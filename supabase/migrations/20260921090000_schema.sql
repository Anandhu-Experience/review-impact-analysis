-- RIA schema — the seed data model (src/types/domain.ts, src/data/**) in Postgres.
--
-- Every statement is idempotent: enums are guarded, tables and indexes use IF NOT EXISTS.
-- The SQL editor runs a script as one transaction, so a single "type already exists" from a
-- half-finished earlier attempt would otherwise roll back the entire file and leave you with
-- nothing — which is exactly the failure this file is written to survive. Re-run it freely.
--
-- Two decisions worth knowing before reading:
--
-- 1. Primary keys keep the seed's text ids ('rst-05', 'rev-0041') rather than uuids. The
--    demo's promise is byte-reproducibility — the QA plan locks exact numbers — and those
--    ids appear in scenario review lists, action ids and screenshots.
--
-- 2. Enums mirror src/types/enums.ts exactly, so a bad value fails at the database rather
--    than silently producing a wrong verdict downstream.

-- ---------------------------------------------------------------- enums
do $$ begin
  create type problem_category as enum (
    'Price', 'Quality', 'Quantity', 'Taste', 'Service', 'WaitingTime', 'Availability',
    'Staff', 'Cleanliness', 'Menu', 'Ambience', 'Delivery', 'Packaging'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_sentiment as enum ('Positive', 'Neutral', 'Negative');
exception when duplicate_object then null; end $$;

do $$ begin
  create type review_phase as enum ('baseline', 'post-action');
exception when duplicate_object then null; end $$;

do $$ begin
  create type action_priority as enum ('High', 'Medium', 'Low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type action_status as enum (
    'Not Started', 'In Progress', 'Monitoring', 'Completed',
    'Improvement Confirmed', 'No Significant Change'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type remedy_target_metric as enum ('avgRating', 'categoryComplaints', 'peerGap', 'sentiment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type scenario_outcome as enum ('improved', 'unchanged');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- reference data
create table if not exists public.locations (
  id      text primary key,
  name    text not null,
  address text not null,
  city    text not null
);

create table if not exists public.menu_catalog (
  id            text primary key,
  name          text not null,
  food_category text not null
);
comment on table public.menu_catalog is 'Canonical cross-restaurant item — the peer-comparison anchor, shared by every tenant.';

create table if not exists public.remedies (
  id               text primary key,
  category         problem_category not null,
  tier             smallint not null check (tier in (1, 2)),
  title            text not null,
  description      text not null,
  specific_actions text[] not null,
  expected_impact  text not null,
  target_metric    remedy_target_metric not null,
  unique (category, tier)
);
comment on table public.remedies is 'Authored remedies: one try-first (tier 1) and one escalation (tier 2) per category.';

-- ---------------------------------------------------------------- tenants
create table if not exists public.owners (
  id           text primary key,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name         text not null,
  email        text not null unique,
  role         text not null default 'owner',
  created_at   timestamptz not null default now()
);
comment on column public.owners.auth_user_id is 'Bridge to Supabase Auth. Null until that owner signs up; the signup trigger fills it by matching email, which is what lets the seeded demo owners sign in as themselves.';

create table if not exists public.restaurants (
  id          text primary key,
  name        text not null,
  owner_id    text not null references public.owners (id) on delete cascade,
  location_id text not null references public.locations (id),
  cuisine     text not null,
  price_tier  smallint not null check (price_tier between 1 and 3)
);
create index if not exists restaurants_owner_id_idx on public.restaurants (owner_id);
-- Restaurant.menuItemIds is deliberately not a column: it is derivable from
-- restaurant_menu_items, and storing it twice invites the two copies to disagree.

create table if not exists public.restaurant_menu_items (
  id              text primary key,
  restaurant_id   text not null references public.restaurants (id) on delete cascade,
  catalog_item_id text not null references public.menu_catalog (id),
  price           numeric(10, 2) not null check (price >= 0),
  unique (restaurant_id, catalog_item_id)
);
create index if not exists restaurant_menu_items_catalog_idx on public.restaurant_menu_items (catalog_item_id);

-- ---------------------------------------------------------------- scripted demo cases
create table if not exists public.scenarios (
  id                      text primary key,
  restaurant_id           text not null references public.restaurants (id) on delete cascade,
  target_category         problem_category not null,
  target_catalog_item_id  text references public.menu_catalog (id),
  action_date             date not null,
  expected_outcome        scenario_outcome not null,
  baseline_review_ids     text[] not null,
  post_action_review_ids  text[] not null,
  seeded_remedy_tier1_id  text not null references public.remedies (id),
  seeded_remedy_tier2_id  text not null references public.remedies (id)
);
comment on column public.scenarios.expected_outcome is 'QA-only intent. computeImpact never reads it — the verdict falls out of the review deltas.';

-- ---------------------------------------------------------------- reviews
create table if not exists public.reviews (
  id                      text primary key,
  restaurant_id           text not null references public.restaurants (id) on delete cascade,
  restaurant_menu_item_id text not null references public.restaurant_menu_items (id),
  catalog_item_id         text not null references public.menu_catalog (id),
  location_id             text not null references public.locations (id),
  rating                  smallint not null check (rating between 1 and 5),
  comment                 text not null,
  price                   numeric(10, 2) not null check (price >= 0),
  date                    date not null,
  food_category           text not null,
  phase                   review_phase not null,
  scenario_id             text references public.scenarios (id),
  categories              problem_category[] not null default '{}',
  sentiment               review_sentiment not null
);
create index if not exists reviews_restaurant_phase_idx on public.reviews (restaurant_id, phase);
create index if not exists reviews_catalog_item_idx on public.reviews (catalog_item_id);
create index if not exists reviews_scenario_idx on public.reviews (scenario_id);
comment on column public.reviews.categories is 'Authored ground-truth labels. classifyReview prefers these and falls back to the lexicon.';

-- ---------------------------------------------------------------- owner progress
-- What lives in zustand + localStorage today. Moving it here is what makes the loop
-- survive a different browser.
create table if not exists public.action_items (
  id              text primary key,
  owner_id        text not null references public.owners (id) on delete cascade,
  restaurant_id   text not null references public.restaurants (id) on delete cascade,
  remedy_id       text not null references public.remedies (id),
  root_cause_id   text not null,
  scenario_id     text not null references public.scenarios (id),
  action          text not null,
  category        problem_category not null,
  owner_name      text not null,
  priority        action_priority not null,
  status          action_status not null default 'Not Started',
  created_date    date not null,
  target_date     date not null,
  before_snapshot jsonb,
  after_snapshot  jsonb,
  impact_result   jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists action_items_owner_idx on public.action_items (owner_id);

-- The post-action review window is gated, not generated: releasing a scenario is what makes
-- its post-action reviews visible, which is the whole before/after mechanism.
create table if not exists public.released_scenarios (
  owner_id    text not null references public.owners (id) on delete cascade,
  scenario_id text not null references public.scenarios (id) on delete cascade,
  released_at timestamptz not null default now(),
  primary key (owner_id, scenario_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists action_items_touch_updated_at on public.action_items;
create trigger action_items_touch_updated_at
  before update on public.action_items
  for each row execute function public.touch_updated_at();

-- Tell PostgREST about the new objects; without this the Data API keeps serving its old
-- cache and every table 404s as PGRST205.
notify pgrst, 'reload schema';

-- What you should see: 10.
select count(*) as tables_created
  from information_schema.tables
 where table_schema = 'public'
   and table_name in ('locations', 'menu_catalog', 'remedies', 'owners', 'restaurants',
                      'restaurant_menu_items', 'scenarios', 'reviews', 'action_items',
                      'released_scenarios');
