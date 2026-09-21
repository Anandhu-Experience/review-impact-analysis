-- Row-level security for RIA. Idempotent: every policy is dropped before it is created, so
-- re-running after a partial attempt cannot fail on "policy already exists".
--
-- The interesting part is not "owners see their own rows" — it is that two of the seven
-- questions this product answers are cross-tenant by design:
--
--   "How do I compare?"                        → peerComparisonService reads OTHER
--                                                 restaurants' prices and ratings.
--   "What do successful peers do differently?" → positiveReviewService reads OTHER
--                                                 restaurants' 4–5★ review text.
--
-- A blanket own-rows-only policy answers neither: comparePeers would return null and the
-- Peer comparison card would render its empty state forever. So peer data is reachable only
-- through the two security-definer functions at the bottom, which return aggregates and
-- anonymized text — never peer rows, never a peer's identity.

alter table public.locations             enable row level security;
alter table public.menu_catalog          enable row level security;
alter table public.remedies              enable row level security;
alter table public.owners                enable row level security;
alter table public.restaurants           enable row level security;
alter table public.restaurant_menu_items enable row level security;
alter table public.scenarios             enable row level security;
alter table public.reviews               enable row level security;
alter table public.action_items          enable row level security;
alter table public.released_scenarios    enable row level security;

-- Which owner row the caller is. Security definer so it can read owners while owners itself
-- is behind RLS — otherwise every policy calling this would recurse into the policy being
-- evaluated.
create or replace function public.app_owner_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.owners where auth_user_id = auth.uid()
$$;

-- ---------------------------------------------------------------- reference data
-- Shared by every tenant and carrying nothing tenant-specific: the menu catalogue is the
-- comparison anchor, and the remedy table is authored content.
drop policy if exists "locations are readable by signed-in users" on public.locations;
create policy "locations are readable by signed-in users"
  on public.locations for select to authenticated using (true);

drop policy if exists "menu catalog is readable by signed-in users" on public.menu_catalog;
create policy "menu catalog is readable by signed-in users"
  on public.menu_catalog for select to authenticated using (true);

drop policy if exists "remedies are readable by signed-in users" on public.remedies;
create policy "remedies are readable by signed-in users"
  on public.remedies for select to authenticated using (true);

-- ---------------------------------------------------------------- own rows
drop policy if exists "an owner reads their own row" on public.owners;
create policy "an owner reads their own row"
  on public.owners for select to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "an owner reads their own restaurants" on public.restaurants;
create policy "an owner reads their own restaurants"
  on public.restaurants for select to authenticated
  using (owner_id = public.app_owner_id());

drop policy if exists "an owner reads their own menu items" on public.restaurant_menu_items;
create policy "an owner reads their own menu items"
  on public.restaurant_menu_items for select to authenticated
  using (restaurant_id in (select id from public.restaurants where owner_id = public.app_owner_id()));

drop policy if exists "an owner reads their own scenarios" on public.scenarios;
create policy "an owner reads their own scenarios"
  on public.scenarios for select to authenticated
  using (restaurant_id in (select id from public.restaurants where owner_id = public.app_owner_id()));

-- The policy that makes the demo honest: switching owners changes what the API returns,
-- not merely what the UI chooses to render.
drop policy if exists "an owner reads their own reviews" on public.reviews;
create policy "an owner reads their own reviews"
  on public.reviews for select to authenticated
  using (restaurant_id in (select id from public.restaurants where owner_id = public.app_owner_id()));

-- ---------------------------------------------------------------- owner progress
drop policy if exists "an owner reads their own actions" on public.action_items;
create policy "an owner reads their own actions"
  on public.action_items for select to authenticated
  using (owner_id = public.app_owner_id());

drop policy if exists "an owner creates their own actions" on public.action_items;
create policy "an owner creates their own actions"
  on public.action_items for insert to authenticated
  with check (
    owner_id = public.app_owner_id()
    and restaurant_id in (select id from public.restaurants where owner_id = public.app_owner_id())
  );

drop policy if exists "an owner updates their own actions" on public.action_items;
create policy "an owner updates their own actions"
  on public.action_items for update to authenticated
  using (owner_id = public.app_owner_id())
  with check (owner_id = public.app_owner_id());

drop policy if exists "an owner deletes their own actions" on public.action_items;
create policy "an owner deletes their own actions"
  on public.action_items for delete to authenticated
  using (owner_id = public.app_owner_id());

drop policy if exists "an owner reads their own releases" on public.released_scenarios;
create policy "an owner reads their own releases"
  on public.released_scenarios for select to authenticated
  using (owner_id = public.app_owner_id());

drop policy if exists "an owner releases their own scenarios" on public.released_scenarios;
create policy "an owner releases their own scenarios"
  on public.released_scenarios for insert to authenticated
  with check (
    owner_id = public.app_owner_id()
    and scenario_id in (
      select s.id from public.scenarios s
      join public.restaurants r on r.id = s.restaurant_id
      where r.owner_id = public.app_owner_id()
    )
  );

drop policy if exists "an owner clears their own releases" on public.released_scenarios;
create policy "an owner clears their own releases"
  on public.released_scenarios for delete to authenticated
  using (owner_id = public.app_owner_id());

-- ---------------------------------------------------------------- peer access
-- Both functions take the caller's own restaurant and verify they own it, so the argument
-- cannot be used to probe another tenant's position.

create or replace function public.peer_item_stats(p_catalog_item_id text, p_restaurant_id text)
returns table (peer_ordinal bigint, price numeric, avg_baseline_rating numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.restaurants r
    where r.id = p_restaurant_id and r.owner_id = public.app_owner_id()
  ) then
    raise exception 'peer_item_stats: % is not your restaurant', p_restaurant_id
      using errcode = '42501';
  end if;

  -- One row per peer offering, identified only by an ordinal. Enough for the client to
  -- compute rank and price percentile exactly as it does today, and not enough to say
  -- which competitor is which.
  return query
    select row_number() over (order by rmi.id) as peer_ordinal,
           rmi.price,
           round(avg(rev.rating)::numeric, 4) as avg_baseline_rating
      from public.restaurant_menu_items rmi
      left join public.reviews rev
        on rev.restaurant_id = rmi.restaurant_id
       and rev.catalog_item_id = p_catalog_item_id
       and rev.phase = 'baseline'
     where rmi.catalog_item_id = p_catalog_item_id
       and rmi.restaurant_id <> p_restaurant_id
     group by rmi.id, rmi.price;
end;
$$;

create or replace function public.peer_positive_comments(
  p_catalog_item_id text,
  p_restaurant_id text,
  p_limit int default 20
)
returns table (comment text, rating smallint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.restaurants r
    where r.id = p_restaurant_id and r.owner_id = public.app_owner_id()
  ) then
    raise exception 'peer_positive_comments: % is not your restaurant', p_restaurant_id
      using errcode = '42501';
  end if;

  -- Returns review TEXT, stripped of restaurant, reviewer, id and date. Theme extraction
  -- stays client-side, so this is the narrowest thing that still answers the question.
  -- Worth revisiting before real customer data lands: a production version would precompute
  -- themes in a job, since verbatim competitor text is a heavier disclosure than the words
  -- the UI actually shows.
  return query
    select rev.comment, rev.rating
      from public.reviews rev
     where rev.catalog_item_id = p_catalog_item_id
       and rev.restaurant_id <> p_restaurant_id
       and rev.rating >= 4
       and rev.phase = 'baseline'
     order by rev.rating desc, rev.id
     limit greatest(p_limit, 0);
end;
$$;

revoke execute on function public.peer_item_stats(text, text) from public, anon;
revoke execute on function public.peer_positive_comments(text, text, int) from public, anon;
grant execute on function public.peer_item_stats(text, text) to authenticated;
grant execute on function public.peer_positive_comments(text, text, int) to authenticated;

notify pgrst, 'reload schema';

-- What you should see: 14.
select count(*) as policies_created from pg_policies where schemaname = 'public';
