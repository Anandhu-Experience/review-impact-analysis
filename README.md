# Review Impact Analysis (RIA)

> Experience.com / XMP review-intelligence — **close the loop on negative feedback**, demoed on the restaurant vertical.

## Files in this branch
- `README.md` (this file)
- `prompt.md` — the product requirements + multi-agent planning/implementation prompts
- `ai-chat-export.json` ← required — the AI/agent planning & implementation record
- `demo/` — screenshots of the running app
- `review-impact-analysis/` — the RIA application source (React + TypeScript + Vite)

---

## Submission card

**Name + Role:** Anandhu Subramaniam — Engineer, Experience.com

**Problem I solved:** Multi-location brands on Experience.com collect plenty of reviews, but the hard part is *closing the loop on negative feedback*: turning a pile of 1–2★ reviews at one location into a specific operational fix, and then proving the fix actually moved the numbers. Owners do this manually today — scattered reviews, no peer benchmark, and "did my fix work?" answered weeks later by gut feel, if at all.

**What I built:** RIA — a closed-loop review-intelligence MVP. It detects problems in a location's negative reviews, benchmarks the same menu item against peer restaurants, contrasts what happy customers of winning peers praise, states a *beyond-classification* root cause, recommends a **specific** remedy, tracks it as an action, then — after new reviews arrive — renders a before/after verdict: **Improvement Confirmed**, **Monitoring**, or **No Significant Improvement → recommend the next remedy**.

**Tool used:** Claude Code — planned via a 7-agent workflow, then implemented; zero hand-written code.

**Time without AI:** ~5–6 engineering days (React/TS app, an 8-service analysis pipeline, a deterministic 264-review seed, 23 components, 6 pages).

**Time with AI today:** ~1 day — a 7-agent planning pass produced 8 planning docs, then implementation across 17 phases with TypeScript + build verification at each checkpoint and an end-to-end browser walkthrough.

**Will I use next week?** YES — as the reference implementation for the XMP "close-the-loop" capability; the pure-service seam lets the mock analysis be swapped for real XMP AI without touching the UI.

**Impact quantified:**
- **~7.5 hours/location/month** saved on review triage, root-cause + peer analysis, and impact measurement (an ~8.5-hour manual loop cut to ~1 hour).
- Across a **20-location brand: ~1,800 owner/GM hours (~$72K) per year** reclaimed (at a $40/hr blended rate), before revenue upside.
- **Time-to-fix compressed from ~3–4 weeks to under 1 week** — problems surface on login with a specific remedy.
- **Measurable rating lift, proven on screen:** the demo's confirmed remedy lifts the flagged item **+2.1★** with target-category complaints down 100%.
- Revenue lever: a published HBS study (Luca) associates a one-star rating increase with a **5–9% revenue increase** for restaurants — RIA is the mechanism that turns triaged complaints into that movement.

---

## Project overview

RIA is a front-end MVP (no backend) that walks a restaurant owner through the seven questions that matter: *what are customers unhappy about, why, how do I compare, what do successful peers do differently, what remedy should I take, what action should I perform, and did it actually work?* All analysis lives in pure, deterministic services so the same inputs always produce the same output — the demo is byte-reproducible. It is framed as an **Experience.com / XMP** capability, not a generic restaurant app: the data model is location- and peer-scoped exactly as XMP reports per location.

## MVP goal

Prove the **closed loop** end to end on deterministic mock data:

```
Reviews → Detect Problems → Analyze → Peer Comparison → Positive Review Comparison
→ Root Cause → Remedy → Action Plan → Owner Takes Action → Collect New Reviews
→ Before/After Analysis → Measure Improvement → Confirm Improvement OR Recommend Next Remedy
```

## Key features

- **Wake-up dashboard** — the dominant problem, rating distribution, rating trend, and ranked problem areas the moment an owner logs in.
- **Multi-problem detection** — a single review can carry several of the 13 problem categories; severity-ranked.
- **Peer comparison** — price/rating benchmarking against other restaurants selling the *same* catalog item (join on `catalogItemId`).
- **Positive-review contrast** — what happy customers of winning peers praise, vs. this restaurant's complaints.
- **Root cause beyond classification** — e.g. "a price-to-value gap, not an absolute pricing error," with graded confidence and attached evidence.
- **Specific remedies** — actionable ("Reduce prep-to-table time below 15 minutes"), never "improve service"; tiered (try-first + escalation).
- **Action plan** — remedy → tracked `ActionItem` through a 6-state lifecycle.
- **Before/after proof** — "Collect New Reviews" releases post-action feedback and renders a threshold-gated verdict.
- **Continuous improvement** — a failed remedy automatically recommends the next one.
- **Deterministic + resettable** — seeded data, localStorage persistence, and a visible **Reset Demo** control.

## Tech stack

React 18 · TypeScript 5 · Vite 5 · Ant Design **v4** + @ant-design/icons · styled-components 6 · Recharts 2 · Zustand 4 · React Router 6 · mock JSON/TS data · localStorage. No backend, no Tailwind, mock AI analysis only.

## Application flow

`/login` (mock owner sign-in) → `/dashboard` (something is wrong) → `/reviews` (the raw voice) → `/analysis/:reviewId` (evidence → peer comparison → positive contrast → root cause → specific remedy, all on one page) → `/action-plan` (commit the fix, advance status, **Collect New Reviews**) → `/impact` (before/after verdict; on failure, the tier-2 remedy).

## Project structure

```
review-impact-analysis/
├─ package.json · vite.config.ts · tsconfig.json · .eslintrc.cjs · index.html
├─ planning/            # 8 planning docs (product, ux, data, analysis, frontend, qa, review, implementation)
└─ src/
   ├─ main.tsx · App.tsx
   ├─ types/            # enums, domain, analysis, impact (canonical contracts)
   ├─ data/             # prng, locations, users, menuCatalog, restaurantMenuItems,
   │                    # restaurants, reviews, scenarios, remedyTable, seed (+ validateSeed)
   ├─ services/         # PURE analysis logic (no React/antd/store imports):
   │                    # sentiment, reviewAnalysis, peerComparison, positiveReview,
   │                    # rootCause, remedy, impactAnalysis, actionPlan (+ lexicon, thresholds)
   ├─ store/            # useRIAStore (Zustand) + useVisibleReviews selector
   ├─ router/           # routes + ProtectedRoute
   ├─ styles/           # theme, GlobalStyle, ChartFrame
   ├─ ui/               # format helpers (status/sentiment color maps)
   ├─ components/       # layout · dashboard · reviews · analysis · action · impact (23 components)
   └─ pages/            # Login, Dashboard, Reviews, Analysis, ActionPlan, Impact
```

## How to install

```bash
cd review-impact-analysis
yarn install
```

Yarn 4 (Berry), pinned via the `packageManager` field — `corepack enable` first if the
`yarn` command is missing. `yarn.lock` is the lockfile; there is no npm lockfile.

## How to run locally

```bash
cd review-impact-analysis
yarn dev
# open http://localhost:5173  (sign in via a demo-owner chip, e.g. "Somchai Pat")
```

## Available commands

| Command | What it does |
|---|---|
| `yarn dev` | Vite dev server with HMR (port 5173) |
| `yarn build` | Type-check (`tsc`) then production build to `dist/` |
| `yarn preview` | Serve the built app (port 4173) — used to capture demo screenshots |
| `yarn lint` | ESLint; enforces the pure-services import boundary |
| `yarn typecheck` | `tsc --noEmit` type-only pass |
| `yarn db:seed-sql` | Regenerate `supabase/seed.sql` from `src/data/**` |

## Mock data information

Deterministic seed (`src/data/`), validated by `validateSeed()`:

- **10 owners → 10 restaurants** (1:1), across **5 shared locations** (2 restaurants each).
- **26 canonical menu items**, all offered by 2+ restaurants (the peer-comparison anchor) via ~71 per-restaurant offerings with tier-spread prices.
- **264 reviews** — **20–30 per restaurant** — with authored ground-truth tags (categories + sentiment) and hardcoded ISO dates; new reviews span the last ~90 days.
- **Realistic patterns:** e.g. Bella Napoli is weak on Quality/Quantity/Price; Mediterraneo is a strong Quality/Quantity/Taste peer; Green Fork is fast/attentive/spotless. Every negative category has a positive peer on a shared item for comparison.
- **6 scripted scenarios** including the two hero cases: **Scenario 5** (Thai Orchid, WaitingTime) → *Improvement Confirmed*; **Scenario 6** (Pizza Corner, Quality) → *No Significant Improvement → next remedy*.
- **Determinism:** no `Math.random`/`Date.now`/`new Date`; a single seeded PRNG (mulberry32) is the only source of jitter; nothing computed is persisted.

## AI / analysis architecture

All intelligence lives in **pure services** that take plain data and return plain objects — no React/antd/store imports (enforced by ESLint `no-restricted-imports`). The mock heuristic body can be replaced by real Experience.com XMP AI behind the **identical typed signature** without changing the UI. Pipeline:

`classifyReview / detectProblems → sentiment → comparePeers → findPositiveComparisons → deriveRootCause → getRemedy → createActionFromRemedy → collectNewReviews → computeImpact → [if failed] getNextRemedy`

- **Classification** is tags-first (authored ground truth) with a keyword-lexicon fallback; multi-label.
- **Severity** = `100·(0.45·frequency + 0.30·negativity + 0.25·rating-drag)`, 0–100.
- **Root cause** uses per-category rules to synthesize a causal statement from the problem + peer benchmark + positive contrast, with a confidence score.
- **Remedies** come from a tiered lookup table (tier-1 try-first, tier-2 escalation) for all 13 categories.

## Before/after improvement flow

With no backend, each scenario ships **both** a baseline review set and a hidden post-action set. Clicking **Collect New Reviews** flips a boolean release (`releasedScenarioIds`); `impactAnalysisService.computeImpact` then diffs before vs. after snapshots against `thresholds.ts`:

- `Δrating ≥ 0.6` **and** target-category complaint drop `≥ 3` **and** `Δsentiment ≥ 0.3` → **Improvement Confirmed**
- after-window `< 5` reviews → **Monitoring — more feedback needed**
- otherwise → **No Significant Improvement**, and `getNextRemedy` surfaces the tier-2 remedy (the continuous-improvement loop).

## Current MVP limitations

- Mock data only — no real review ingestion (Google/Yelp/delivery/XMP APIs).
- No backend, no database, no real authentication (mock email-only owner switch).
- Mock AI — deterministic heuristics, not a live LLM call.
- Single `owner` role; no RBAC, billing, or notifications.
- One restaurant per owner in the demo dataset.

## Future enhancements

- Swap each pure service's body for real **Experience.com / XMP AI** (LLM classification, semantic theme clustering, generative remedies) behind the same interfaces.
- Real review ingestion + a backend/DB; live before/after over streaming feedback.
- Real auth/RBAC and multi-location org hierarchy; replicate confirmed remedies across peer locations.
- Instrument the production KPIs (loop-closure rate, remedy success rate, rating lift, peer-gap closure).
