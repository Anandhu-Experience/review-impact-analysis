# XMP port — notes on the shell stand-in

The XMP port lives **inside this project**, under `src/xmp/`, mounted at `/xmp`. It shares this
repo's build, package.json and router with RIA rather than sitting in a separate app.

The real new shell exists in another repo ("the shells exist and are wired") but was not available,
so this is a **stand-in**. Everything below is a divergence from the real thing or a decision the
real shell may have made differently. Read this before merging outward.

## How it is wired into this project

| Concern | Decision |
|---|---|
| Location | `src/xmp/` — self-contained; nothing outside it imports from it except the router |
| Route | `src/router/routes.tsx` mounts `xmpRoutes` at `/xmp`, alongside RIA's own routes |
| Imports | Relative, no `@/` alias — matching this project's existing convention, which keeps the services ESLint `no-restricted-imports` boundary simple |
| React | Uses this project's React 18.3 and react-router-dom 6, **not** React 19 / Router 7 |
| Styling | Tailwind 4 via `@tailwindcss/vite`, tokens in `src/styles/tailwind.css` |
| Session | `XmpSessionProvider` is scoped to the `/xmp` subtree — RIA's Zustand store is untouched |

### Tailwind coexists with AntD v4 — two deliberate choices

1. **No preflight.** `src/styles/tailwind.css` imports only `tailwindcss/theme.css` and
   `tailwindcss/utilities.css`. Tailwind's preflight is an aggressive global reset that unstyles
   AntD's buttons, inputs and tables; omitting it leaves every RIA page exactly as it was.
2. **Utilities are imported unlayered.** Any `@layer` loses to unlayered CSS *regardless of source
   order*, and AntD ships plain unlayered CSS. Layered utilities would silently lose to antd's `a`,
   `button` and `input` resets. Unlayered, loaded after antd in `main.tsx`, normal cascade order
   applies.

Base styles are scoped to `.xmp-root` (set on the XMP shell's outermost element), so nothing bleeds
into RIA.

## Deliberate divergences from v2

### 1. Persona is a session property, not a URL prefix
v2 mounts nearly every screen twice — once under `/admin`, once under `/user`. That is **83 of its
240 route entries**. Here each screen is declared once and `gate.personas` controls visibility.

*Risk:* if the real shell or existing deep links depend on the `/admin` and `/user` prefixes, this
needs a redirect layer. Confirm before merging outward.

### 2. Routes, nav and permissions are one registry
`src/xmp/registry.tsx` is the single source of truth. The nav is derived from it, and the router
guard (`RequirePermission`) uses the same `isAllowed()`.

v2 keeps three parallel hand-maintained lists (`routes/config/*.js`, `Nav/*NavItems.js`, and two
different permission checks). They have drifted: six nav entries point at URLs with no route, and
Social Monitor is advertised in nav with no route and no importer at all. In this structure a nav
entry without a screen is not expressible.

*Risk:* if the real shell has its own router or nav convention, adapt the registry to it. The value
is the single-source property, not this exact file.

### 3. All data goes through one service interface
XMP screens import `XmpApi` from `src/xmp/lib/api.ts` and nothing else. `mockApi` is an in-memory
implementation with deliberate latency. Swapping to Supabase/Postgres is a change to that one
module — no screen should need editing.

`mockControls` in the same file (`latencyMs`, `forceError`, `forceEmpty`) exists so the
loading / error / empty states can be exercised. Delete it when the real API lands.

### 4. Status codes kept in the data, never shown
v2 leaks raw numeric codes into the UI — a row can literally read `3`. `AccountStatus` preserves
the exact codes (`Active: 1`, `Inactive: -1`, `DeactivationRequested: 3`, `Onboarding: 0`,
`Suspended: -3`) so the API contract still matches, while the UI renders labels only. **Data parity
without layout parity.**

### 5. Denied access says so
v2 redirects to `/pagenotfound` when an `accessKey` is missing, which hides the reason.
`RequirePermission` names the missing permission, flag or persona instead — which also makes the
permission model testable via the persona switcher.

### 6. shadcn/ui primitives are hand-rolled
`npx shadcn init` was not run, because the real shell may already have a component registry and a
`components.json`, and because this project has no path alias for shadcn's generator to target. The
three primitives (`Button`, `StatusPill`, `States`) follow the shadcn pattern — cva variants, `cn()`
merge, semantic CSS-variable tokens — so the real registry's components can replace them without
touching call sites.

## Not built yet

- **Auth is fake.** The persona switcher in the sidebar replaces sign-in. No Supabase auth, no RLS.
  RLS will change what the API *returns*, not just what the UI shows — expect the permission model
  to need revisiting once it is real.
- **One screen is at parity:** Accounts. Every other registered screen renders `PlannedScreen`,
  which names the v2 module it owes parity to, so unfinished reads as a gap rather than as done.
- No tests, no error boundary, no i18n.

## Where the rest of the work is tracked

- `xmp-inventory.xlsx` — 247 rows, 240 route entries, 43 routed areas, plus the gap log and the
  traffic ranking that decides build order.
- `xmp-accounts-inventory.xlsx` — the Accounts area at full pass-2 depth, the format other areas follow.
- `scope.md` — parity vs redesign vs out-of-scope.
