# XMP — parity port onto the new shell

> Experience.com · XMP discipline · owner **Geetha** · window **15 → 29 Sept**

XMP is the product most customers actually open. Every screen has to survive the move to the new
shell, and none of it can regress.

## The requirement

From the XMP discipline card:

| | |
|---|---|
| **Parity means** | A complete, honest screen inventory first · dashboards, requests, responses, users, settings · every workflow that exists today, working · **data parity — nothing silently dropped** |
| **New ground** | **Redesign what's bad.** Parity of *capability*, not of layout. Reproducing a bad screen faithfully is the failure mode here. |
| **Done, inside the window** | Inventory complete and honest · top-traffic screens at parity · every remaining gap written down rather than discovered later |
| **The boundary** | **Sequence by traffic, not by screen order.** An inventory you took two days over beats three rushed screens. |

Target stack: React + TS · Tailwind + shadcn/ui · Postgres · row-level security + auth ·
API integration · Graph read.

## What today's XMP actually is (counted, not estimated)

Measured from `Experience-org/v2` by parsing its route configs — the numbers the plan is built on:

| | |
|---|---|
| Route entries | **240** across `src/routes/config/{admin,user,xpa,global}.js` |
| Distinct URLs | 237 — but only **157 distinct route paths**, so **83 entries are the same screen at a second persona URL** |
| Areas | **43** routed, plus 7 real surfaces with no route at all |
| Drawers / modals | **220** drawer mount points, 34 modals |
| Module code | 4,382 files · **677,148 lines** |
| Nested routes | **0** — tabs and drawers are state-driven, so a route census *understates* the screen count |

Concentration: Hierarchy (81k lines, 45 drawers, **3 routes**), Campaigns (74k), Settings (53k, 39
drawers) and Profile (48k) are 38% of the code and 52% of the drawers.

Full parity inside the window is therefore not reachable, and the card doesn't ask for it — it asks
for a complete inventory, top-traffic screens at parity, and the rest written down.

## What's here

| Path | What it is |
|---|---|
| `xmp-inventory.xlsx` | The parity checklist — 247 rows, all 240 route entries + 7 unrouted surfaces, with a gap log and traffic ranking |
| `xmp-accounts-inventory.xlsx` | The Accounts area at full depth (actions, drawers, permissions, states) — the format other areas follow |
| `scope.md` | Parity vs redesign vs out-of-scope, and the assumptions behind them |
| `PORTING.md` | Divergences between this stand-in and the real shell — read before merging outward |
| `src/xmp/` | The shell itself |

## Architecture — the one bet worth knowing

**Routes, navigation and permissions are a single registry** (`src/xmp/registry.tsx`).

v2 keeps three parallel hand-maintained lists — the route tables, the nav arrays in
`modules/Nav/*NavItems.js`, and two different permission checks (`AuthPage.js` and `Nav`'s
`getAccess`). They have drifted: six nav entries point at URLs with no route, and Social Monitor
(7,375 lines, 11 drawers) is advertised in the nav with no route and no importer at all.

Here the nav is derived from the registry and the router guard uses the same `isAllowed()`, so a nav
entry without a screen is not expressible.

Two consequences worth stating:

- **Persona is a session property, not a URL prefix.** `/admin/accounts` and `/user/accounts` become
  `/xmp/accounts`. That is where the 83 duplicate route entries go.
- **Landing routes are parity behaviour.** Each persona signs in and lands where v2's own
  `DEFAULT_ROUTES` sends it — including the non-obvious one: **admins land on Organizations, not
  Accounts** (`admin.js` `AUTHED_ROUTE`).

Data flows through one seam, `src/xmp/lib/api.ts`. Screens import `XmpApi` and nothing else, so
swapping the mock for Supabase/Postgres is a change to that module, not a UI rewrite. ESLint enforces
that `src/xmp/lib/**` stays UI-free.

## Status

**At parity:** Accounts — with its redesign applied (see below).
**Registered, not yet built:** Dashboard, My dashboard, Organizations, Hierarchy, Reviews, Listings,
Users, Settings. Each renders a placeholder naming the v2 module it owes parity to, so unfinished
reads as a gap rather than as done.

A screen counts as done only with navigation → data → actions → **permission behaviour** →
empty / error / loading.

### Redesigned, not reproduced (Accounts)

| v2 today | Here |
|---|---|
| 11 permission-gated actions in one dropdown, no primary action | 2 inline actions + overflow |
| No row selection, no bulk actions, no export anywhere | Selection + bulk bar + export |
| Filters hidden behind a toggle, only a global Clear | Always-visible, individually removable chips |
| Raw status codes leak to screen (a row can read `3`) | Codes kept in the data, labels on screen |
| `Button.Group` doing a tab's job | Real tabs |
| Denied access redirects to PageNotFound | Says which permission is missing |

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

Sign in as any persona — the choice decides where you land and what the nav shows, which is how
permission behaviour gets verified. `npm run build` · `npm run lint` · `npm run typecheck`.

To exercise loading, empty and error states, set `mockControls` in `src/xmp/lib/api.ts`
(`latencyMs`, `forceEmpty`, `forceError`).

## Known limits

- **Auth is not real.** The persona picker stands in for Supabase auth + RLS. RLS will change what
  the API *returns*, not just what the UI shows — expect the permission model to need revisiting.
- **The traffic ranking is an assumption, not data.** No analytics access; P0 is derived from the
  landing routes v2 declares. Wrong order is the most expensive mistake available here.
- **This is a stand-in shell**, not the real one — see `PORTING.md`.
- Excluded from parity, each with a written reason in the gap log: Social Monitor and the
  Testimonials widget config (both unreachable today), two routes that render a blank page, two
  query-string routes that can never match, and the Campaigns editor (a separate discipline).
