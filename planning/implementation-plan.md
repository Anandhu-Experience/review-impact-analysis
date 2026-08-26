# Review Impact Analysis (RIA) — Master Implementation Plan

> **Owner:** Tech Lead (synthesis of all 7 planning agents) · **Status:** plan only — no code until approved.
> Companion docs: [product-plan](product-plan.md) · [ux-plan](ux-plan.md) · [data-plan](data-plan.md) · [analysis-plan](analysis-plan.md) · [frontend-plan](frontend-plan.md) · [qa-plan](qa-plan.md) · [architecture-review](architecture-review.md).

---

## 1. Executive summary

**Review Impact Analysis (RIA)** is an Experience.com / XMP *review-intelligence* capability —
the "close the loop on negative feedback" workflow — demoed on the restaurant vertical. A
restaurant owner logs in, sees that "something is wrong," drills into evidence, gets a peer
benchmark and a *specific* remedy, records an action, clicks **Collect New Reviews**, and watches
RIA render a before/after verdict — **Improvement Confirmed** or **recommend the next remedy**.
The whole product is a machine that walks the owner from *"what's wrong?"* to *"did my fix
work?"*, deterministically, with no backend.

It is built to a mandated stack (React 18 + TS + Vite, AntD v4, styled-components, Recharts,
Zustand, React Router, mock data + localStorage) and to a hard architecture principle: **all
analysis logic lives in pure services**; pages only render. It is also a hackathon submission
scored by `main.py` (100 pts), so the plan optimizes for that scorer alongside the product spec.

**Current state:** greenfield. `review-impact-analysis/` has only a hollow `node_modules/` and an
empty `dist/`; a real `npm install` and full scaffold are required.

---

## 2. MVP scope

**In:** mock email login + route guard; deterministic seed (10 owners, 10 restaurants, 5 shared
locations, 12-item shared catalog, ~139 reviews, 6 scenarios); multi-problem classification of
below-3 reviews; peer comparison on shared menu items; positive-review contrast; beyond-
classification root cause; specific tiered remedies; action plan with 6 statuses; the Collect New
Reviews → before/after verdict loop; next-remedy recommendation on failure; localStorage
persistence + Reset Demo; 6 scripted demo scenarios; a `demo/` screenshot.

**Out (deliberately):** real auth, real DB/backend, real review integrations, real AI/LLM calls,
billing, notifications, RBAC/multi-role. These keep the MVP deterministic and demo-stable.

---

## 3. Architecture

Layered, with a strict one-way dependency flow and a hard purity boundary:

```
data/ (seed, deterministic) ─┐
types/ (canonical contracts) ─┼─▶ services/ (PURE: no react/antd/zustand/store) ─▶ store/ (Zustand) ─▶ pages/ ─▶ components/
                              │                                                         ▲                         │
                              └─────────────────────────────────────────────────────────┘   (pages inject seed data into pure services; components are props-only)
```

- **Purity boundary (load-bearing):** `src/services/**` imports only other services, `../types`,
  and `../data/*` — never react/antd/zustand/styled-components/recharts/store/components. Enforced
  by ESLint `no-restricted-imports` (frontend §2.1).
- **Determinism:** no `Math.random`/`Date.now`/`new Date`; one seeded PRNG (`data/prng.ts`,
  mulberry32); hardcoded ISO dates; nothing computed is persisted (recompute on read).
- **Swap-later:** every service is a typed pure function; the mock heuristic body can be replaced
  by Experience.com XMP AI behind the identical signature without touching the UI.

---

## 4. Agent responsibilities & 5. Agent workflow

**Seven specialized planning agents** each produced one doc:

| Agent | Output | Responsibility |
|---|---|---|
| Product/Business | product-plan.md | scope, user journey, business rules, ROI, success criteria |
| UX/UI | ux-plan.md | IA, 6 pages, navigation, states, narrative arc, demo screen |
| Data Architect | data-plan.md | entities, TS types, mock data, peer join, before/after data |
| Analysis/AI | analysis-plan.md | the pure-service pipeline, root cause, remedies, impact math |
| Frontend Architect | frontend-plan.md | React/Vite architecture, components, store, routing, antd v4 |
| Test/QA | qa-plan.md | test strategy, scenarios, edge cases, determinism, scorer readiness |
| Tech Lead | architecture-review.md + this plan | conflict resolution, coverage, order, synthesis |

**Workflow:** Phase 1 — Product first, then UX/Data/Analysis (depend on Product), then
Frontend (needs UX+Data) and QA (needs Data+Analysis). Phase 2 — Tech Lead cross-review
(architecture-review.md). Phase 3 — Tech Lead synthesis (this document). Dependencies:
`Product → UX/Data/Analysis`; `UX+Data → Frontend`; `Data+Analysis → QA`; `all → Tech Lead`.

---

## 6. Page list (6)

`/login` · `/dashboard` · `/reviews` · `/analysis/:reviewId` · `/action-plan` · `/impact`.
Peer comparison, root cause, and remedy are **sections within `/analysis/:reviewId`**. Route
tree + `ProtectedRoute` + `AppLayout` shell in frontend §6.

## 7. Component list (23)

- **layout/** AppLayout*, Sidebar, Header
- **dashboard/** MetricCard, RatingSummary, RatingTrend, ProblemAreas, WakeUpCall
- **reviews/** ReviewCard, ReviewTable
- **analysis/** ReviewAnalysis*, EvidenceCard, PeerComparison, PositiveReviewComparison, RootCauseCard, RemedyCard
- **action/** ActionPlan*, ActionItem
- **impact/** ImprovementSummary, BeforeAfterComparison, ImpactTimeline, ImpactMetric, ImprovementStatus

`*` = container (plus the 6 pages). All others presentational (props-only). Props for every
component in frontend §3.3. *(23 named components — see architecture-review C-1.)*

---

## 8. Data model

Canonical types in `src/types/{enums,domain,analysis,impact}.ts` (+ `Scenario` in
`src/data/scenarios.ts`), reproduced verbatim in **data-plan §4**. Highlights:

- **Enums:** `ProblemCategory` (13), `Sentiment`, `ReviewPhase` (baseline|post-action),
  `Priority`, `ActionStatus` (the 6 statuses), `Rating`.
- **Peer-comparison anchor:** `MenuItemCatalog` (canonical dish) ↔ `RestaurantMenuItem`
  (per-restaurant price) joined by `catalogItemId`, denormalized onto every `Review`.
- **Before/after fields:** `Review.phase`, `Review.scenarioId`; `Scenario.baselineReviewIds` /
  `postActionReviewIds`; store `releasedScenarioIds` gate.
- **Analysis types:** `Evidence`, `DetectedProblem`, `PeerComparisonResult`,
  `PositiveReviewComparison`, `RootCause`, `Remedy` (tier 1|2), `ReviewAnalysis`.
- **Impact types:** `MetricSnapshot`, `ImpactResult` (verdict + `nextRemedyId`), `ActionItem`.
- **`SeedData`** = `{ locations, users, restaurants, menuCatalog, restaurantMenuItems, reviews,
  scenarios }`; `remedyTable` is separate data in `src/data/remedyTable.ts` (review C-4/C-5).

ER diagram + cardinalities in data-plan §2.

---

## 9. Service architecture

Pure modules in `src/services/` (signatures verbatim in analysis §2):

- `sentimentService` — `scoreSentiment`, `aggregateSentiment`
- `reviewAnalysisService` — `classifyReview`, `detectProblems`, `computeProblemAreas`,
  `computeRatingTrend`, `computeRatingSummary`, `analyzeReview` (orchestrator)
- `peerComparisonService` — `getPeerItems`, `comparePricing`, `compareRatings`, `comparePeers`
- `positiveReviewService` — `findPositiveComparisons`, `extractPositiveThemes`
- `rootCauseService` — `deriveRootCause`
- `remedyService` — `getRemedy`, `getNextRemedy`, `mapProblemToRemedies`
- `impactAnalysisService` — `getVisibleReviews`, `captureSnapshot`, `computeImpact`
- `actionPlanService` — `createActionFromRemedy`, `advanceStatus`, `summarizeActionPlan`
- supporting data/const modules: `lexicon.ts`, `thresholds.ts`, `prng.ts`, `data/remedyTable.ts`

## 10. Analysis pipeline

`classifyReview/detectProblems → sentiment → comparePeers → findPositiveComparisons →
deriveRootCause → getRemedy` — orchestrated by `analyzeReview(reviewId, data, visibleReviews)`
for the Analysis page (analysis §1, §2.2). Severity = `100·(0.45·freq + 0.30·negativity +
0.25·ratingDrag)` (analysis §3.3). Classification is **tags-first, lexicon-fallback**; a review
may carry multiple problems. Root cause goes **beyond classification** via per-category rules
(e.g. price-to-value gap), with graded confidence and attached `Evidence[]` (analysis §7).

## 11. Remedy pipeline

`remedyTable.ts` = `Record<ProblemCategory, Remedy[]>`, one **tier-1** (try-first) and one
**tier-2** (escalation) per category, all **specific and actionable** (e.g. WaitingTime T1
"Reduce prep-to-table time below 15 minutes"). `getRemedy` returns tier-1; `getNextRemedy(cat,
excludeRemedyId)` returns tier-2 for the failed-remedy loop. Full 13-category table in
analysis §8.2.

## 12. Improvement pipeline

`createActionFromRemedy` → owner advances status → **Collect New Reviews** releases the
scenario's post-action reviews → `computeImpact` diffs Before vs After snapshots against
`thresholds.ts` and emits a verdict:

| Order | Condition | Verdict → status |
|---|---|---|
| 1 | `after.reviewCount < 5` | `Monitoring — more feedback needed` → `Monitoring` |
| 2 | `Δrating ≥ 0.6` AND `complaintDrop ≥ 3` AND `Δsentiment ≥ 0.3` | `Improvement Confirmed` → `ImprovementConfirmed` |
| 3 | otherwise | `No Significant Improvement` → `NoSignificantChange` (+ `nextRemedyId` = tier-2) |

Delta math + the reproduced "+1.7★ / −75% / −80%" example in analysis §10. Verdict→status
mapping done once in `store.collectNewReviews` (review C-2).

---

## 13. State management (Zustand)

`useRIAStore` (full code in frontend §5): persisted keys `currentUserId`, `activeRestaurantId`,
`actionItems`, `releasedScenarioIds`, `demoVersion` (key `ria-store-v1`, `version`+`migrate`
auto-reset on mismatch). Actions: `login/logout/setActiveRestaurant/createAction/
updateActionStatus/collectNewReviews/resetDemo`. Seed is a static import (never persisted);
computed analysis is never persisted. Uniform review access via `useVisibleReviews()` selector
(memoized on `activeRestaurantId` + `releasedScenarioIds`). Visible **Reset Demo** control in
Header.

## 14. Routing

`react-router-dom` v6 `createBrowserRouter` + `RouterProvider`; `ProtectedRoute` renders the
`AppLayout` shell (Sidebar + Header + Outlet) when authed, else redirects to `/login`; `/` and
`*` → `/dashboard` (frontend §6).

## 15. Mock data strategy

Deterministic seed (data-plan §7): 10 owners→10 restaurants, 5 locations (2 restaurants each),
12 catalog dishes (several shared across restaurants — e.g. Margherita offered by 4), ~28
`RestaurantMenuItem` offerings with spread prices, ~139 reviews (100 baseline + 39 post-action)
with authored `tags` ground truth and hardcoded ISO dates. IDs are authored constants (§7.1).
6 scenarios mapped to `rst-01…rst-06`; **Scenario 5 (WaitingTime @ Thai Orchid) is co-tuned to
PASS, Scenario 6 (Quality @ Pizza Corner) to FAIL** the same thresholds (§7.7). `validateSeed`
dev assertion enforces referential integrity (§9).

---

## 16. Implementation phases (17) — task breakdown, ownership, outputs, validation

| # | Phase | Key tasks | Owner | Output | Validation |
|---|---|---|---|---|---|
| 1 | Foundation | author `package.json`, clean `npm install`, `vite.config.ts`, `tsconfig`, ESLint (services rule), `index.html`, `main.tsx` (**no StrictMode**), `App.tsx`, `theme.ts`, `GlobalStyle.ts`, antd v4 CSS | Frontend | scaffold builds | `npm run build` green; **Table+Tooltip smoke-test** (Risk #1) |
| 2 | Mock Data | `types/*`, `prng.ts`, locations/users/menuCatalog/restaurantMenuItems/restaurants, `reviews` (tagged), `scenarios`, `remedyTable`, `seed.ts` | Data | `SeedData` | `validateSeed` passes; D-01…D-12 |
| 3 | User/Restaurant Context | `useRIAStore` + persist, `useVisibleReviews`, `routes`, `ProtectedRoute`, `AppLayout/Sidebar/Header`, `LoginPage` | Frontend | auth + shell | F-01…F-03 |
| 4 | Dashboard | `reviewAnalysisService` (summary/trend/problem-areas) + `sentimentService`; MetricCard, RatingSummary, RatingTrend, ProblemAreas, WakeUpCall, DashboardPage | Analysis+Frontend | dashboard | F-04, F-05 |
| 5 | Reviews | ReviewTable/ReviewCard, ReviewsPage, filters, row→analysis | Frontend | reviews list | F-06, F-07 |
| 6 | Review Analysis Engine | `classifyReview`, `detectProblems`, `analyzeReview`; AnalysisPage + ReviewAnalysis + EvidenceCard | Analysis+Frontend | analysis shell | F-08 |
| 7 | Peer Comparison | `peerComparisonService`; PeerComparison component | Analysis+Frontend | peer section | F-09 |
| 8 | Price/Quality/Quantity | category severity + evidence rules (scenarios 1,2,4 signals) | Analysis | category logic | A-01, A-02, A-04 |
| 9 | Root Cause | `rootCauseService` + `positiveReviewService`; RootCauseCard, PositiveReviewComparison | Analysis+Frontend | root cause | F-10, F-11 |
| 10 | Remedy Engine | `remedyService` + `remedyTable`; RemedyCard + CTA | Analysis+Frontend | remedies | F-12 |
| 11 | Action Plan | `actionPlanService`; store `createAction/updateActionStatus`; ActionPlan, ActionItem, ActionPlanPage | Frontend | action plan | F-13, F-14, F-15 |
| 12 | Before/After Measurement | `impactAnalysisService.captureSnapshot/getVisibleReviews`; before-snapshot on create | Analysis | snapshots | (unit) |
| 13 | Impact & Improvement | `computeImpact` + thresholds; store `collectNewReviews`; ImpactPage + 5 impact components | Analysis+Frontend | impact verdict | F-16, F-17, F-18 |
| 14 | Continuous Improvement | `getNextRemedy` wiring; tier-2 RemedyCard on failed verdict | Analysis+Frontend | next-remedy loop | F-19 |
| 15 | UX Polish | theming, empty/loading/error states, responsive layout, Reset Demo modal | UX+Frontend | polished UI | E-01…E-09 |
| 16 | Demo Scenarios | co-tune review text + `thresholds.ts` so all 6 land; freeze qa §5 numbers | Data+QA | scripted demo | A-05 pass, A-06 fail |
| 17 | QA + Package | run all P0 gates; re-enable strict checks; capture `demo/` screenshot; author README/prompt.md/ai-chat-export.json; commit + push branch | QA+Tech Lead | shippable branch | qa §11 sign-off; SC-01…SC-12 |

## 17. Task dependencies

P1→P2→P3 are the serial critical path (nothing compiles without types/seed/store). P4–P5 depend
on P3. P6 (orchestrator) depends on P7–P10 sub-services. P11 depends on P10; P12–P13 depend on
P11 + P2 post-action data; P14 depends on P13. P16 depends on P13 (co-tune against real deltas).
P17 depends on all. Full graph in architecture-review §5.

## 18. File structure

```
review-impact-analysis/
├─ package.json · vite.config.ts · tsconfig.json · tsconfig.node.json · .eslintrc.cjs · index.html
└─ src/
   ├─ main.tsx · App.tsx
   ├─ types/      enums · domain · analysis · impact · index
   ├─ data/       prng · locations · users · menuCatalog · restaurantMenuItems · restaurants ·
   │              reviews · scenarios · remedyTable · seed
   ├─ services/   lexicon · thresholds · sentimentService · reviewAnalysisService ·
   │              peerComparisonService · positiveReviewService · rootCauseService ·
   │              remedyService · impactAnalysisService · actionPlanService
   ├─ store/      useRIAStore  (+ useVisibleReviews selector)
   ├─ router/     routes · ProtectedRoute
   ├─ styles/     theme · GlobalStyle · styled.d · ChartFrame
   ├─ components/ layout/ · dashboard/ · reviews/ · analysis/ · action/ · impact/
   └─ pages/      LoginPage · DashboardPage · ReviewsPage · AnalysisPage · ActionPlanPage · ImpactPage
```

---

## 19. QA strategy

Manual-first, determinism-focused (qa-plan). P0 gates: functional loop F-01…F-20; scenario
acceptance A-01…A-06 (A-05 "Improvement Confirmed", A-06 "No Significant Improvement" + tier-2
remedy, same thresholds); reproducible walkthrough (qa §5, frozen after P16); determinism greps
(no `Math.random`/`Date.now`/`new Date`; reload → identical numbers); services-boundary ESLint
gate (+ negative test); data invariants D-01…D-12; edge cases E-01…E-09; scorer-readiness
SC-01…SC-12. Optional Vitest for pure services (off critical path).

## 20. Demo scenarios (6)

| # | Scenario | Restaurant | Category | Outcome |
|---|---|---|---|---|
| 1 | High price + low quantity | rst-01 Bella Napoli | Price (+Quantity) | analysis story |
| 2 | Poor quality + long waiting | rst-02 Sakura Sushi | Quality (+WaitingTime) | analysis story |
| 3 | Poor service | rst-03 Curry House | Service | analysis story |
| 4 | Availability problem | rst-04 Burger Barn | Availability | analysis story |
| 5 | **Successful improvement** | rst-05 Thai Orchid | WaitingTime | **Improvement Confirmed** (Δrating +2.1, complaints −7, sentiment +0.8) |
| 6 | **Failed remedy → next** | rst-06 Pizza Corner | Quality | **No Significant Improvement** → tier-2 remedy |

Scenarios 5 & 6 are the demo climax and the closed-loop proof. Details + numbers in data §7.6–7.7,
acceptance tests in qa §4.

## 21. Risks (top)

1. **AntD v4 + React 18 `findDOMNode`/StrictMode** → mount without StrictMode; smoke-test P1.
2. **Determinism** → seeded PRNG + hardcoded dates; nothing computed persisted.
3. **Believable AND threshold-correct before/after** → co-tune scenarios 5/6 vs same thresholds (P16).
4. **`ai-chat-export.json` load-bearing** → missing caps llm_craft at 5 (−25).
5. **localStorage staleness** → `demoVersion` + persist migrate + Reset Demo.
6. **Recharts 0-height in antd Card** → fixed-height `ChartFrame` wrapper everywhere.
7. **Hollow `node_modules`** → real `npm install` in P1.

## 22. Future production architecture

The pure-service seam is the migration path. Replace each mock service body with Experience.com /
XMP calls behind the **identical signature** — UI untouched:

- `reviewAnalysisService` / `sentimentService` → XMP LLM classification + semantic sentiment.
- `peerComparisonService` → real cross-location XMP benchmarks (live review/price feeds).
- `positiveReviewService` / `rootCauseService` → semantic theme clustering + generative root cause.
- `remedyService` → generative, context-aware remedies (still tiered).
- `impactAnalysisService` → live before/after over streaming review ingestion.
- Data layer → real ingestion (Google/Yelp/delivery/XMP APIs), a backend + DB, real auth/RBAC,
  notifications, and multi-location org hierarchy. The store swaps static seed for fetched data;
  `useVisibleReviews` becomes a query. Because logic is already isolated and typed, this is a
  body swap, not a redesign.

---

## 23. Submission packaging (scoring-critical)

A submission is the git branch `anandhu-subramaniam/ria`. At **branch root**, ship:

1. **`README.md`** — the output card, exact fields: *Name + Role · Problem I solved · What I built ·
   Tool used · Time without AI · Time with AI today · Will I use next week? · Impact quantified*.
   `Impact quantified` carries product §7's numbers verbatim (~7.5 hrs/location/month; ~1,800 hrs /
   ~$72K per year for 20 locations; time-to-fix weeks→<1 week; +2.1★ demo proof). Framed as
   Experience.com/XMP review intelligence (not a generic restaurant app).
2. **`prompt.md`** — the product/requirements framing and how the agent was directed.
3. **`ai-chat-export.json`** — a **substantive** transcript of this multi-agent plan + build.
   *Missing or stubby caps `llm_craft` at 5/30 (−25).* Redact any secrets.
4. **`demo/`** — a real screenshot of the **running RIA app** (the `/impact` page, "Improvement
   Confirmed"), captured from `npm run preview`. **Replace the existing `scorer-ui.png`** (review C-6).
5. **`src/`** — the RIA source (committed; `node_modules/` gitignored).
6. **Meaningful commit history** — descriptive messages telling the phase/build story (the last 10
   are fed to the scorer).

Scorer targets: `llm_craft` 30, `roi_impact` 25, `product_knowledge` 20, `working_demo` 15,
`complexity` 10; bar to beat 78/100. Dimension→artifact map in architecture-review §6.

---

## 24. Definition of done

All qa-plan §11 P0 gates pass; the closed loop runs end-to-end in the built app with deterministic
numbers; scenarios 5 & 6 produce their verdicts against the same thresholds; the branch ships
README + prompt.md + substantive ai-chat-export.json + a real RIA `demo/` screenshot; `npm run
build` is green. **Implementation begins only after this planning set is approved.**
