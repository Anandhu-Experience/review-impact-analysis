# XMP build — scope

**Window:** 15 → 29 Sept. **Owner of this build:** Ashwani. **Discipline owner:** Geetha.
**Decided:** 18 Sept, from the inventory. Everything below is judged against this page.

## The bar

From the XMP card: *"Inventory complete and honest, top-traffic screens at parity, every remaining
gap written down rather than discovered later."* Parity is the floor — **parity of capability, not of
layout.** Reproducing a bad screen faithfully is the named failure mode.

Full parity is not reachable and is not the target. Counted: **240 route entries · 43 areas ·
220 drawer mount points · 677,148 lines**, with **zero nested routes**, so tabs and drawers don't
appear in a route count and the true screen count is materially higher.

---

## PARITY — what gets reproduced

**P0 — 25 screens, build first.** Every persona landing route the app itself declares, plus sign-in
and the global chrome everything hangs off:

- **Chrome:** Nav (left menu + header), Page shell. Permission gating ported as *one* concept —
  today it is implemented twice, in `routes/components/AuthPage.js` and `Nav/components/index.js`.
- **Landing routes** (provenance in the sheet, from `DEFAULT_ROUTES`): `/admin/organizations`
  (admins land here, **not** on Accounts), `/user/accounts`, `/user/organizations`,
  `/admin/account/hierarchy`, `/{admin,user}/account/dashboard`, `/user/account/user-dashboard`,
  `/user/account/listing/dashboard`, `/admin/individualprofessionals/manageusers`,
  `/user/profile-setup`, `/user/privacy-agreement`.
- **Sign-in:** `/admin/signin`, `/user/signin`, `/xpa/signin`, `/sso_callback`.
- **Core product screens** carrying GlobalMenu prominence across personas: Accounts, Reviews,
  Account Settings.

**P1 — 143 rows.** Regular multi-persona screens. Taken in area order after P0, as far as the window
allows.

**P2 — 79 rows.** Deep leaf screens (4+ path segments), niche auth flows, single-persona admin.
Inventoried, not scheduled.

A screen counts as **Done** only with: navigation → data → actions → **permission behavior** →
empty / error / loading. Permission behavior is the part most likely to be silently wrong.

**The biggest saving available:** 83 of the 240 entries are the same component mounted at a second
persona URL (240 entries vs 157 distinct route paths). Build once, mount per persona.

---

## REDESIGN — the new ground

XMP's new ground is *"redesign what's bad"* — not a net-new feature. Candidates are evidence-backed,
not opinion. Flagship picked after pass 2; **Accounts is the guaranteed fallback** because its flaws
are already documented and a redesign is already drawn.

Confirmed bad, with evidence:

| Flow | What's wrong | Source |
|---|---|---|
| Accounts row actions | 11 permission-gated actions in one dropdown, no primary action surfaced | `AccountsList/partials/ActionItem.js` |
| Edit Account | 7 fields rendered, **4 permanently disabled** | `AccountsList/partials/EditAccount.js` |
| Account activation | Two separate flows, two components, same outcome | `ActivateAdminAccount.js` / `ActivateAccount.js` |
| Accounts list | No row selection, no bulk actions, no export anywhere | `AccountsList/index.js` |
| Filters | Hidden behind a toggle; no chips; only a global Clear | `AccountsSearchFilter/index.js` |
| Status model | Raw numeric codes (1, -1, 3, 0, -3) leak into the UI; lifecycle state mixed with a pending request | `AccountsSearchFilter/DropdownOptions.js` |
| Hierarchy | 45 drawers behind 3 routes, 81k lines — largest suspected offender, unverified until pass 2 | `modules/Hierarchy` |

---

## OUT OF SCOPE — written down, not silently dropped

| Excluded | Why |
|---|---|
| **Campaigns** editor, settings, audience builder (74k lines, 11 routes) | Its own discipline (deck slide 13), owns agent-assisted creation and graph-query audiences. XMP ports the Campaigns **list** only, for navigational parity. |
| **Social Monitor** (46 files, 7,375 lines, 11 drawers) | No route and no component importer — unreachable today, though nav still links to it. |
| **Testimonials widget config** | Nav link with no route; falls through to PageNotFound. |
| `/admin/account` and `/user/account` | Render a blank page. |
| 2 query-string routes, 2 duplicate `/account/hierarchy/preview` entries | Can never match / unreachable under `<Switch>`. |
| Graph writes, OS/shell internals, DB migrations | Intake: off limits, no DDL rights. Schema requests go to Scott in writing. |

24 rows are marked Excluded in the sheet, each with a written reason.

---

## Assumptions I own

1. **Traffic ranking is a proxy, not data.** No analytics access. P0 is a route-level allowlist drawn
   from the app's declared landing routes, then nav prominence and persona reach. Wrong order is the
   most expensive error available here; it is cheap to change before the build and expensive after.
2. **The new shell is unavailable**, so parity is built against a local stand-in on the same stack
   (React + TS, Tailwind + shadcn/ui) at `xmp-shell/`, with the data layer behind typed interfaces so
   swapping to the real API is a service change, not a UI rewrite. Divergences tracked in
   `xmp-shell/PORTING.md`.
3. **Full parity is out of reach in the window** — the inventory and the gap log are first-class
   deliverables, not consolation prizes.

## Checkpoint

If P0 + chrome exceeds what the build days can carry, cut **at the checkpoint and record it** — do
not discover it on the 27th.
