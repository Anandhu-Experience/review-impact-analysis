# Supabase for RIA

The database side of RIA: schema, row-level security, and a generated seed.

**Auth is wired; data is not.** Supabase Auth decides who you are, and the `owners` table
decides which owner that maps to. Everything else — reviews, restaurants, the analysis — is
still read from `src/data/seed.ts`. Moving the data itself is a separate step.

```
supabase/
  migrations/20260921090000_schema.sql      tables, enums, indexes
  migrations/20260921090100_rls.sql         RLS policies + peer access functions
  migrations/20260921090200_auth_bridge.sql links a signup to its seeded owner row
  seed.sql                                  generated from src/data/** — do not hand-edit
```

## Applying it

**Hosted project (no local tooling).** Open the project's SQL editor and run the four files
in order: schema, rls, auth_bridge, then `seed.sql`.

Every file is idempotent — guarded enums, `if not exists` tables, policies dropped before
they are created — so a re-run after a failed attempt is safe. That matters because the SQL
editor executes a script as a single transaction: one error anywhere rolls back the whole
file, and a leftover object from an earlier attempt would otherwise make every subsequent
run fail on the first statement.

Each file ends with a count so you can see it worked without leaving the editor: the schema
reports `tables_created = 10`, the policies file `policies_created = 14`, and the seed can be
checked with `select count(*) from public.reviews;` (264). They also `notify pgrst, 'reload
schema'` — without that the Data API keeps serving a stale cache and every table answers
`PGRST205`, which looks identical to the tables not existing at all.

**Locally (Docker + the Supabase CLI).** `npx supabase start` then `npx supabase db reset`
applies both migrations and `seed.sql` automatically.

Regenerate the seed after any change to `src/data/**`:

```bash
yarn db:seed-sql
```

The generator loads the TypeScript seed through Vite's own resolver, so what lands in
Postgres is exactly what the app computes against today — the authored data stays the single
source of truth rather than being copied by hand.

## Two decisions worth reviewing

**Peer comparison is cross-tenant by design.** Two of the seven questions RIA answers — *how
do I compare* and *what do successful peers do differently* — read other restaurants' prices,
ratings and review text. A blanket own-rows-only policy silently breaks both: `comparePeers`
returns null and the Peer comparison card renders its empty state forever. So peer data is
reachable only through two `security definer` functions that return aggregates and anonymized
text, never peer rows:

- `peer_item_stats(catalog_item_id, restaurant_id)` — one row per peer offering, identified
  only by an ordinal. Enough to compute rank and price percentile, not enough to identify a
  competitor.
- `peer_positive_comments(catalog_item_id, restaurant_id, limit)` — 4–5★ peer review text
  with restaurant, reviewer, id and date stripped.

Both verify the caller owns the restaurant they pass, so the argument cannot be used to probe
another tenant's position. The second one is the weaker of the two: it returns verbatim
competitor review text, where the UI only ever displays extracted themes. Before real
customer data lands, that should become precomputed themes rather than raw text.

**Seed ids are the primary keys.** `'rst-05'`, `'rev-0041'` — not uuids. The demo's promise
is byte-reproducibility (the QA plan locks exact numbers), and those ids appear in scenario
review lists, action ids and screenshots.

## Signing in as a seeded owner

Owners exist in the database before anyone signs up. A trigger on `auth.users` claims the
matching owner row by email on signup, so signing up as `somchai@thaiorchid.test` lands on
Thai Orchid's data under real auth, with RLS — not the UI — deciding what comes back.

## Running the app against Supabase

Copy `.env.example` to `.env` (gitignored) and fill both values from Project Settings → API:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...   # or VITE_SUPABASE_ANON_KEY on older projects
```

Restart the dev server afterwards — Vite reads `.env` at startup, and under Yarn PnP a
running server will not pick up a newly installed dependency either.

Two project settings matter before a seeded owner can sign in:

- **Email confirmation must be off** (Authentication → Sign In / Providers → Email →
  *Confirm email*). The seeded owners use `.test` addresses, which are reserved by RFC 2606
  and can never receive mail, so a confirmation email is a dead end. The app detects this
  case and says so rather than leaving you on a spinner.
- **The migrations must actually be applied to the project the `.env` points at.** With an
  empty schema the app signs in and then reports that the account has no owner row.

With no `.env` at all the app runs exactly as before: seed data, no password field, no
network.

The anon key is meant to ship in the browser bundle; RLS is the only thing protecting the
data behind it, which is why the policies land first. The **service_role** key bypasses RLS
entirely and must never appear in this repo, the frontend, or a chat window.

The seam for moving the data itself is narrow: every analysis service is a pure function over
`SeedData`, so an adapter only has to produce that same shape. Keeping `seed.ts` as the
fallback when the env vars are absent leaves the offline demo deterministic.

## How sign-in resolves an identity

1. `supabase.auth.signInWithPassword` establishes the session.
2. One RLS-scoped select on `owners` returns the caller's own row and nothing else — which
   is itself a live check that the policies work.
3. That owner id is the same id used by `src/data/users.ts`, so the rest of the app reads
   the local seed for that owner without any further change.

An account with no matching owner row is reported rather than dropped into an empty app —
the likely cause is signing up with an address that is not one of the seeded owners.
