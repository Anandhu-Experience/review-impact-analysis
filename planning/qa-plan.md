# RIA — QA & Test Plan

> **Owner:** Test/QA Agent · **Consumes:** data-plan.md, analysis-plan.md · **Feeds:** architecture-review, implementation-plan.

Review Impact Analysis (RIA) is an **Experience.com / XMP review-intelligence capability** — the "close the loop on negative feedback" workflow — demoed on the restaurant vertical. This document defines how we prove RIA works end to end, reproducibly, and that the branch is ready for the hackathon scorer (`main.py`, 100 pts). It assumes the architecture, data model, and service layer fixed in the shared authoritative context and does not redesign them.

---

## 1. Test Strategy

RIA has **no backend**, a **mock AI analysis service**, and **fully deterministic** authored data. That shapes the entire strategy: there is nothing asynchronous, no network, and no randomness to flake on. The correct verdict is a pure function of authored inputs, so QA is mostly about (a) confirming the closed loop renders and advances correctly, and (b) locking the numbers so the live demo is reproducible.

### What we test, and how

| Layer | Method | Priority | Rationale |
|---|---|---|---|
| **Closed-loop user journey** (login → dashboard → reviews → analysis → action plan → collect new reviews → impact) | **Manual walkthrough scripts** (§3, §5) | P0 — must pass | This is the demo. If the loop runs and the numbers land, we ship. |
| **6 demo scenarios** produce their intended verdicts/remedies | **Manual acceptance tests** (§4) | P0 — must pass | Scenarios 5 & 6 are the punchline; they must pass/fail the *same* thresholds. |
| **Pure services** (`src/services/**`) — classification, peer comparison, root cause, remedy, impact math | **Optional lightweight unit tests (Vitest)** (§2.1) | P1 — recommended, not blocking | Services are pure functions of plain data → trivially unit-testable. Guards the threshold math. |
| **Determinism** (reload → identical numbers) | **Manual + static grep assertions** (§8) | P0 — must pass | A non-deterministic number on stage is a demo-killer. |
| **Services boundary** (no react/antd/zustand leak into services) | **ESLint `no-restricted-imports`** (§9) | P0 — must pass | The load-bearing architecture principle; enforced, not just documented. |
| **Data invariants** (referential integrity, scenario ids exist, ≥10 reviews/restaurant) | **Data-validation checks** — Vitest or a `data:validate` script (§7) | P0 — must pass | A dangling `catalogItemId` silently breaks peer comparison. |
| **Scorer readiness** (README output card, prompt.md, ai-chat-export.json, demo/ screenshot, build passes) | **Manual checklist** (§10) | P0 — must pass | Directly worth up to 100 scorer points; `ai-chat-export.json` alone is a ±25 swing. |

### Guiding principles

1. **Determinism over coverage.** Because inputs are authored ground truth, a single manual pass that hits every route deterministically proves more than a large flaky suite. We optimize for *reproducibility of the exact numbers*, not raw assertion count.
2. **Closed loop is the acceptance boundary.** A feature is "done" only when it participates correctly in the full loop, ending in a rendered impact verdict.
3. **Services are the unit-test surface; pages are the manual-test surface.** Logic lives only in `src/services/`; pages/components merely call it. So unit tests target services; manual scripts target rendering and wiring.
4. **Keep dependencies minimal.** Unit tests are **optional**. If added, Vitest only (no RTL, no jsdom unless a component test truly needs it) — RIA ships with no test framework by default and the mandated stack must not grow.

### 2.1 Optional Vitest setup (only if time permits — do NOT block the demo on it)

Vitest is a **nice-to-have** that raises confidence in the threshold math and `complexity` credibility. If added, keep it surgical:

```bash
# optional dev-only addition — do not add RTL/jsdom unless a component test needs the DOM
npm i -D vitest
```

```jsonc
// package.json (optional)
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "data:validate": "vitest run src/data/__tests__/dataIntegrity.test.ts"
}
```

Highest-value pure-service tests, in priority order:

1. `impactAnalysisService.computeImpact` → asserts each verdict boundary (§4 scenarios 5/6 + the Monitoring edge).
2. `reviewAnalysisService.detectProblems` / `classifyReview` → authored `tags` win; multi-problem reviews yield multiple `DetectedProblem`s.
3. `peerComparisonService.comparePeers` → `priceDeltaPct`, `ratingGap`, `rank`, `peerCount` on a known catalog item.
4. `remedyService.getRemedy` / `getNextRemedy(category, excludeRemedyId)` → tier-1 then tier-2, never repeating the excluded remedy.
5. Data-integrity suite (§7).

> **Assumption:** unit tests are optional and out of the demo critical path. All P0 gates in §11 are satisfiable by the manual scripts alone.

---

## 3. Functional Test Scenarios — the full closed loop

Numbered cases covering the canonical pipeline: `Reviews → Detect → Analyze → Peer → Positive → Root Cause → Remedy → Action Plan → Take Action → Collect New Reviews → Impact Verdict`. All cases assume a fresh **Reset Demo** state unless a precondition says otherwise.

| # | Case | Preconditions | Steps | Expected result |
|---|---|---|---|---|
| **F-01** | Login redirect guard | `currentUserId === null` (logged out) | Navigate directly to `/dashboard` | `ProtectedRoute` redirects to `/login`. Same for `/reviews`, `/analysis/:reviewId`, `/action-plan`, `/impact`. |
| **F-02** | Successful login | Logged out; a valid owner email exists in `users.ts` | On `/login`, enter the owner email → submit | `login(email)` returns `true`; `currentUserId` + `activeRestaurantId` set; redirect to `/dashboard`; `AppLayout` shell (Sidebar + Header + Outlet) renders. |
| **F-03** | Invalid login | Logged out | Enter an email not in `users.ts` → submit | `login(email)` returns `false`; stays on `/login`; visible inline error; no store mutation. |
| **F-04** | Dashboard — wake-up call | Logged in, baseline state (no scenarios released) | Land on `/dashboard` | `WakeUpCall` surfaces the headline problem (highest-severity `DetectedProblem`). `MetricCard`s, `RatingSummary` (1–5★ BarChart), `RatingTrend` (LineChart), `ProblemAreas` (horizontal BarChart, top-N by frequency) all render with non-empty deterministic values. |
| **F-05** | Charts render inside AntD Card | Logged in | Inspect each dashboard chart | Every chart is inside a `ResponsiveContainer` **inside a fixed-height styled wrapper** — no chart collapses to 0 height. (Recharts-in-Card gotcha.) |
| **F-06** | Reviews list | Logged in | Navigate to `/reviews` | `ReviewTable` lists this restaurant's **visible** reviews only (via `useVisibleReviews()`); low-rated reviews (rating < 3) are visibly flagged. `ReviewCard`/row shows rating, comment, menu item, price, date. |
| **F-07** | Open a low-rated review | On `/reviews` | Click a review with `rating < 3` | Routes to `/analysis/:reviewId` for that review id. |
| **F-08** | Analysis — evidence | On `/analysis/:reviewId` (low-rated) | Observe the `ReviewAnalysis` container | Renders `DetectedProblem`s (a review may carry **multiple**). `EvidenceCard`s show `Evidence` items of types `review` / `peer` / `positive-review` / `metric`. |
| **F-09** | Analysis — peer comparison | Same, item has peers on the same `catalogItemId` | Observe `PeerComparison` section | Grouped BarChart of my price/rating vs peer avg; `PeerComparisonResult` fields populated (`myPrice`, `peerAvgPrice`, `priceDeltaPct`, `pricePercentile`, `ratingGap`, `rank`, `peerCount`). |
| **F-10** | Analysis — positive-review contrast | Same, category has positive exemplars | Observe `PositiveReviewComparison` | Shows `positiveThemes` vs `negativeThemes` and a `contrast` string; optional RadarChart renders if used. |
| **F-11** | Analysis — root cause | Same | Observe `RootCauseCard` | Shows a `RootCause.statement` that goes **beyond classification** (a "why"), backed by `evidence[]`, with `confidence` shown. Peer/positive context attached where relevant. |
| **F-12** | Analysis — remedy | Same | Observe `RemedyCard` | Shows a **specific** tier-1 `Remedy` (`title`, `specificActions[]`, `expectedImpact`, `targetMetric`) — never a vague "improve service". |
| **F-13** | Add to action plan | On `/analysis/:reviewId` with a remedy shown | Click "Add to Action Plan" | `createAction({remedy, rootCause, scenarioId})` appends an `ActionItem` (status `Not Started`) to `actionItems`; it persists to `localStorage` (`ria-store-v1`). |
| **F-14** | Action plan renders | ≥1 action created | Navigate to `/action-plan` | `ActionPlan` lists each `ActionItem` with `action`, `category`, `owner`, `priority`, `status`, `createdDate`, `targetDate`, and a status control. |
| **F-15** | Advance status | On `/action-plan`, action `Not Started` | Advance status (e.g., → `In Progress`) | `updateActionStatus(actionId, status)` updates the item; persists; UI reflects the new `ActionStatus`. |
| **F-16** | Collect new reviews | Action exists for a scenario; scenario **not** yet released | Click "Collect New Reviews" on that action | `collectNewReviews(actionId)` adds `scenarioId` to `releasedScenarioIds`, runs `impactAnalysisService.computeImpact`, and writes back `afterSnapshot` + `impactResult` + a new `status`. Post-action reviews now appear in `/reviews`. |
| **F-17** | Impact verdict | After F-16 | Navigate to `/impact` | `ImprovementSummary` + `BeforeAfterComparison` (grouped BarChart: avgRating, negativeCount, positiveCount, target-category complaints) + `ImpactTimeline` (LineChart with `ReferenceLine` at `actionDate`) + `ImpactMetric`s + `ImprovementStatus` all render one of the three `verdict` values from the authored deltas. |
| **F-18** | Verdict → status mapping | After F-17 | Compare `ImpactResult.verdict` with the action's `ActionStatus` | Mapping holds (see §Appendix A): `Improvement Confirmed`→`ImprovementConfirmed`; `Monitoring — more feedback needed`→`Monitoring`; `No Significant Improvement`→`NoSignificantChange`. |
| **F-19** | Next-remedy loop | Verdict is `No Significant Improvement` (scenario 6) | On `/impact` or `/action-plan`, follow the "recommend next remedy" affordance | `impactResult.nextRemedyId` is set (tier-2, from `remedyService.getNextRemedy(category, excludeRemedyId)`); owner can create a **second** `ActionItem` from it, closing the loop again. |
| **F-20** | Recompute-on-read | Any computed value shown anywhere | Reload the page | Nothing computed is read from `localStorage`; all analysis/impact numbers are recomputed from seed + `releasedScenarioIds` and are **identical** to before reload. |

---

## 4. The 6 Demo Scenarios as Acceptance Tests

One detailed acceptance test per authored scenario. Each targets a specific `Scenario` in `data/scenarios.ts`. Verdicts and next-remedy behavior are the **contractual outputs**; `expectedOutcome` on the scenario is QA-only intent and must never be the source of the verdict — the verdict must fall out of `computeImpact` over the authored review deltas.

> **Threshold contract (`services/thresholds.ts`):** `MIN_AVG_RATING_DELTA = 0.6`, `MIN_COMPLAINT_DROP = 3`, `MIN_AFTER_REVIEWS = 5`, `MIN_SENTIMENT_DELTA = 0.3`. Scenario 5 must **clear** these; scenario 6 must **fail** them; the "Monitoring" edge is `afterReviewCount < MIN_AFTER_REVIEWS`.

### A-01 · Scenario 1 — High price + low quantity
- **Target:** `targetCategory` covering **Price** + **Quantity** (multi-problem review).
- **Preconditions:** fresh Reset Demo; scenario 1's restaurant active.
- **Steps:** Dashboard → `ProblemAreas` shows Price & Quantity high → open a flagged review → analysis.
- **Expected:** `detectProblems` returns **both** `Price` and `Quantity` `DetectedProblem`s from one review. `PeerComparison` shows `myPrice > peerAvgPrice` (positive `priceDeltaPct`, high `pricePercentile`) on the shared `catalogItemId`. Remedies are specific — Price T1 ≈ *"Introduce a value meal / review pricing against 3 peers"*; Quantity T1 ≈ *"Increase portion weight 20% on flagged items"*. Root cause statement ties price-to-value gap, not just "expensive".

### A-02 · Scenario 2 — Poor quality + long waiting time
- **Target:** `Quality` + `WaitingTime`.
- **Steps:** open flagged review → analysis.
- **Expected:** two `DetectedProblem`s (`Quality`, `WaitingTime`). Root cause distinguishes food-quality from throughput. Remedies specific — WaitingTime T1 ≈ *"Reduce prep-to-table time below 15 minutes"*, with T2 ≈ *"Add 2 staff during 12–2 & 7–9 peak windows"* available via `getNextRemedy`. `EvidenceCard`s cite the originating review(s).

### A-03 · Scenario 3 — Poor service
- **Target:** `Service` (and/or `Staff`).
- **Expected:** `Service` problem detected with low `avgRatingWhenMentioned`; `PositiveReviewComparison` contrasts positive service themes from peers/exemplars against this restaurant's negative themes; remedy is a concrete service-process change (not "improve service"). `PeerComparison` present if the item has peers.

### A-04 · Scenario 4 — Availability problem
- **Target:** `Availability`.
- **Expected:** `Availability` problem detected; remedy specific — Availability T1 ≈ *"Raise par levels on top-3 items 30% + adopt an 86-board process"*; `targetMetric` plausibly `categoryComplaints`. Root cause references stock-outs / item unavailability, backed by review evidence.

### A-05 · Scenario 5 — Successful improvement (→ "Improvement Confirmed")  **[punchline #1]**
- **Preconditions:** fresh Reset Demo; scenario 5 **not** released; an `ActionItem` created from its tier-1 remedy (`seededRemedyTier1Id`).
- **Steps:** `/action-plan` → advance to `In Progress` → **Collect New Reviews** → `/impact`.
- **Expected — assert exactly:**
  - `impactResult.verdict === "Improvement Confirmed"`.
  - `deltas.avgRating ≈ +2.1` → **≥ `MIN_AVG_RATING_DELTA` (0.6)** ✓.
  - `deltas.targetCategoryComplaints ≈ -7` (a drop of 7) → **≥ `MIN_COMPLAINT_DROP` (3)** ✓.
  - `deltas.sentiment ≈ +0.8` → **≥ `MIN_SENTIMENT_DELTA` (0.3)** ✓.
  - `after.reviewCount ≥ MIN_AFTER_REVIEWS (5)` ✓.
  - `deltas.negativeCount` negative (fewer negatives), `deltas.positiveCount` positive, `deltas.peerGap` narrows.
  - `nextRemedyId` is **undefined** (no next remedy needed).
  - Action status → `ImprovementConfirmed` ("Improvement Confirmed"); `BeforeAfterComparison` shows After bars clearly better; `ImpactTimeline` `ReferenceLine` sits at `actionDate` with the after-segment trending up.

### A-06 · Scenario 6 — Failed remedy → next recommendation (→ "No Significant Improvement")  **[punchline #2]**
- **Preconditions:** fresh Reset Demo; scenario 6 **not** released; an `ActionItem` created from its tier-1 remedy (`seededRemedyTier1Id`).
- **Steps:** `/action-plan` → **Collect New Reviews** → `/impact` → follow "recommend next remedy".
- **Expected — assert exactly:**
  - `impactResult.verdict === "No Significant Improvement"`.
  - Deltas **fail** the thresholds: `deltas.avgRating < 0.6` **and** `deltas.targetCategoryComplaints` drop `< 3` **and/or** `deltas.sentiment < 0.3` (post-action reviews barely move) — while still having `after.reviewCount ≥ 5` (so it is *not* "Monitoring").
  - `impactResult.nextRemedyId` **is set** and equals a **tier-2** remedy: `getNextRemedy(targetCategory, seededRemedyTier1Id)` and `nextRemedyId === scenario.seededRemedyTier2Id`, `nextRemedyId !== seededRemedyTier1Id`.
  - The UI surfaces the tier-2 remedy and offers to create a **second** `ActionItem` from it (loop-back to "recommend next remedy").
  - Action status → `NoSignificantChange` ("No Significant Change").

> **Cross-scenario invariant (top risk #3):** scenarios 5 and 6 are graded by the **same** `thresholds.ts`. QA must confirm 5 passes and 6 fails without editing thresholds between them. Any threshold change is re-validated against **both**.

---

## 5. Closed-Loop User Journey Walkthrough (reproducible demo script)

A single scripted run an owner (or presenter) follows on stage. Numbers must match on every machine after a fresh **Reset Demo**. Values fixed by the shared context are marked **[fixed]**; values authored in Phase 16 are marked **[author-locked]** — QA records the actual authored number here **once** so the demo is byte-reproducible.

| Step | Action | Route | Expected on screen |
|---|---|---|---|
| 0 | Click **Reset Demo** | any | Store back to all-baseline: `actionItems = []`, `releasedScenarioIds = []`, `demoVersion` current. |
| 1 | Log in as the demo owner | `/login → /dashboard` | Dashboard renders; `WakeUpCall` names the top problem. Baseline `MetricCard`s: avgRating **[author-locked: ___]**, negative-review count **[author-locked: ___]**. |
| 2 | Read the wake-up call | `/dashboard` | `ProblemAreas` top complaint = scenario 5's `targetCategory` **[author-locked]**; `RatingTrend` flat/declining pre-action. |
| 3 | Open reviews | `/reviews` | `ReviewTable` shows **only baseline** reviews (post-action hidden); ≥10 reviews for this restaurant; low-rated rows flagged. |
| 4 | Open the flagged low-rated review | `/analysis/:reviewId` | Evidence, peer comparison (myPrice/rating vs peer avg), positive contrast, root cause (confidence shown), specific tier-1 remedy. |
| 5 | Add remedy to action plan | `/analysis → /action-plan` | New `ActionItem`, status `Not Started`; persists across reload. |
| 6 | Advance status | `/action-plan` | Status → `In Progress`. |
| 7 | **Collect New Reviews** | `/action-plan` | Scenario released; `/reviews` now also shows post-action reviews; `computeImpact` runs. |
| 8 | View impact (scenario 5) | `/impact` | **Verdict = "Improvement Confirmed" [fixed].** Deltas: avgRating **≈ +2.1 [fixed]**, target-category complaints **≈ −7 [fixed]**, sentiment **≈ +0.8 [fixed]**; negatives down, positives up, peer gap narrower. `nextRemedyId` undefined. Before/After bars + timeline `ReferenceLine` at `actionDate`. |
| 9 | Run the "failed remedy" loop | scenario 6: analysis → action → **Collect New Reviews** → `/impact` | **Verdict = "No Significant Improvement" [fixed].** Deltas fail thresholds **[author-locked, must be sub-threshold]**; `nextRemedyId` = tier-2 remedy shown; owner spins up a second action → loop closes. |
| 10 | Reload the browser (F5) | any authed route | Every number in steps 1–9 is **identical** (determinism). Session persists (still logged in, same active restaurant, same actions). |

> **QA action:** after Phase 16 data authoring lands, run steps 0–10 once and **fill every [author-locked] blank with the observed value**, then freeze this table. The frozen table is the demo's expected-output oracle.

---

## 6. Edge Cases

| # | Edge case | Setup | Expected behavior |
|---|---|---|---|
| **E-01** | No negative reviews | A restaurant/state with all reviews `rating ≥ 3` | `ProblemAreas` / `WakeUpCall` render a graceful empty/positive state ("No problems detected"); no crash, no NaN in charts. |
| **E-02** | No actions yet | Fresh Reset Demo, before any `createAction` | `/action-plan` shows an empty-state prompt (e.g., "Analyze a review to add your first action"); `/impact` shows an empty/awaiting state, not an error. |
| **E-03** | After-window too small → Monitoring | A scenario (or authored case) where `after.reviewCount < MIN_AFTER_REVIEWS (5)` after release | `verdict === "Monitoring — more feedback needed"`; action status → `Monitoring`; UI says more feedback is needed; no false "Improvement/No Improvement" claim. |
| **E-04** | Multiple concurrent actions | Create actions from ≥2 scenarios | Each `ActionItem` tracks its **own** `scenarioId`, snapshots, and `impactResult` independently; releasing one scenario does not alter another's numbers; `/impact` and `/action-plan` list all correctly. |
| **E-05** | Logout / login persistence | Create actions, release a scenario, `logout()`, then `login()` again | `actionItems` and `releasedScenarioIds` survive (persisted); on re-login the same state and numbers are restored. Logout returns to `/login` and re-guards protected routes. |
| **E-06** | localStorage migration on `demoVersion` mismatch | Seed `localStorage` `ria-store-v1` with an **older** `version`/`demoVersion` | zustand `persist` `migrate` runs; stale/incompatible persisted state is migrated or reset cleanly (no white screen, no partial state); app boots to a valid baseline. |
| **E-07** | Reset Demo returns to baseline | Any mid-loop state (actions created, scenarios released) → click **Reset Demo** | `actionItems = []`, `releasedScenarioIds = []`; all pages show pure baseline; post-action reviews hidden again; numbers match step-1 baseline exactly. |
| **E-08** | Direct-link to `/analysis/:reviewId` with unknown id | Navigate to an analysis route for a non-existent review id | Graceful not-found / redirect; no unhandled exception. |
| **E-09** | Analysis of a non-negative review | Open `/analysis/:reviewId` for a `rating ≥ 3` review | No fabricated problems; either a "no problems detected" analysis state or the review is not offered for analysis. |

---

## 7. Data-Validation Checks (invariants from data-plan)

These are authored-data invariants. Ideally enforced by a `data:validate` Vitest suite (`src/data/__tests__/dataIntegrity.test.ts`); at minimum a manual review before demo. A single dangling reference silently breaks peer comparison or the before/after math.

| # | Invariant | Check |
|---|---|---|
| **D-01** | Review → RestaurantMenuItem integrity | Every `Review.restaurantMenuItemId` exists in `restaurantMenuItems.ts`. |
| **D-02** | Review → Catalog integrity | Every `Review.catalogItemId` exists in `menuCatalog.ts` **and** equals the `catalogItemId` of its `RestaurantMenuItem` (denormalization is consistent). |
| **D-03** | Review → Restaurant integrity | Every `Review.restaurantId` exists in `restaurants.ts`; `Review.locationId`, `Review.foodCategory`, and `Review.price` are consistent with the referenced restaurant/menu item. |
| **D-04** | Restaurant → owner/location | Every `Restaurant.ownerId` exists in `users.ts`; `locationId` exists in `locations.ts`; each of `menuItemIds` exists. 10 owners, 10 restaurants, each owner owns exactly 1. |
| **D-05** | Scenario review ids exist | Every id in `Scenario.baselineReviewIds` and `postActionReviewIds` exists in `reviews.ts`, and each such review's `scenarioId` matches the scenario. |
| **D-06** | Scenario remedy ids exist | `seededRemedyTier1Id` (tier 1) and `seededRemedyTier2Id` (tier 2) exist in `remedyTable.ts` for the scenario's `targetCategory`; tier1 ≠ tier2. |
| **D-07** | Phase ↔ date consistency | Every baseline review has `phase === Baseline` and `date < actionDate`; every post-action review has `phase === PostAction` and `date >= actionDate`. Dates are ISO and **hardcoded**. |
| **D-08** | ≥10 reviews per restaurant | Each of the 10 restaurants has **≥ 10** reviews in `reviews.ts`. |
| **D-09** | Peer comparison is possible | Scenarios relying on peer comparison have ≥1 other restaurant offering the same `catalogItemId` (so `peerCount ≥ 1`). Some catalog items are shared across restaurants. |
| **D-10** | Deterministic totals | Aggregate counts (total reviews, per-restaurant counts, per-scenario baseline/after counts) are fixed integers that match the frozen walkthrough (§5). No count is computed from a random or date-relative source. |
| **D-11** | Scenario 5/6 threshold alignment | The authored baseline/after review sets for scenario 5 produce deltas that **clear** `thresholds.ts`; scenario 6's **fail** them; the after-window edge case has `< MIN_AFTER_REVIEWS`. (Co-tuned in Phase 16.) |
| **D-12** | Rating domain | Every `Review.rating` ∈ {1,2,3,4,5}; `tags.categories` ⊆ the 13 `ProblemCategory` values; `tags.sentiment` ∈ `Sentiment`. |

---

## 8. Determinism Assertion

RIA must produce **identical numbers on every load, on every machine**. This is both a demo requirement and top risk #2.

**Manual assertion (D-A):** open every route, note every number and chart, hard-reload (F5), and confirm each value is byte-identical. Repeat once in a fresh browser profile (empty `localStorage`) — baseline numbers must match the frozen walkthrough.

**Static assertions (D-B) — must all return no source hits:**

```bash
# From src/ — none of these may appear anywhere in application code:
grep -rn "Math.random"        src/ | grep -v node_modules   # → (no results)
grep -rn "Date.now"           src/ | grep -v node_modules   # → (no results)
grep -rn "new Date("          src/ | grep -v node_modules   # → (no results)
grep -rn "performance.now"    src/ | grep -v node_modules   # → (no results)
```

- Randomness, if any, comes **only** from the single seeded PRNG (`src/data/prng.ts`, mulberry32) with a fixed seed. Verify the seed is a hardcoded constant.
- All dates are hardcoded ISO strings in the data layer.
- **Nothing computed is persisted.** Confirm the zustand `partialize` persists only `currentUserId`, `activeRestaurantId`, `actionItems`, `releasedScenarioIds`, `demoVersion` — never analysis/impact results. Impact/analysis are recomputed on read (F-20).
- Services are **pure functions of inputs**: calling any service twice with the same `SeedData` + `releasedScenarioIds` yields deep-equal output. (If Vitest is present, assert `expect(fn(x)).toEqual(fn(x))` on the impact and analysis orchestrators.)

---

## 9. Pure-Services Boundary Test

The architecture principle "business logic lives only in `src/services/` and imports none of react/antd/zustand/store" is **enforced, not just documented** (top of the shared context; ESLint `no-restricted-imports`).

**Automated (S-A) — the gate:**

```jsonc
// .eslintrc — applied to src/services/**
"overrides": [{
  "files": ["src/services/**/*.ts"],
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [
        { "name": "react",             "message": "services must be UI-free" },
        { "name": "antd",              "message": "services must be UI-free" },
        { "name": "zustand",           "message": "services must be UI-free" },
        { "name": "styled-components", "message": "services must be UI-free" }
      ],
      "patterns": [
        { "group": ["../store", "../store/*", "**/store/*", "**/useRIAStore*"], "message": "services must not read the store" },
        { "group": ["react-router*", "recharts", "@ant-design/*"],              "message": "services must be UI-free" }
      ]
    }]
  }
}]
```

- **Pass:** `npm run lint` reports **zero** `no-restricted-imports` violations under `src/services/`.
- **Negative test:** temporarily add `import { message } from 'antd'` to any service → lint **must fail** → revert. Proves the rule is live.

**Corroborating grep (S-B):**

```bash
grep -rnE "from ['\"](react|antd|zustand|styled-components|recharts|\.\./store|.*/useRIAStore)" src/services/   # → (no results)
```

Services take a `SeedData` bundle / plain arrays and return plain objects only. Pages/components call services and **never reimplement** logic (spot-check that `computeImpact`, `analyzeReview`, `comparePeers`, etc. are invoked from pages/containers, not duplicated in components).

---

## 10. Scorer-Readiness Checklist (scoring-critical)

The scorer (`main.py`) reads each branch's `README.md`, `prompt.md`, `ai-chat-export.json`, and the **last 10 commit messages**, grabs the **first image in `demo/`** as the demo screenshot, and grades with an LLM out of 100. This checklist is a hard gate — several items are large point swings.

| # | Item | Requirement | Why it matters | Status gate |
|---|---|---|---|---|
| **SC-01** | `README.md` output card at **branch root** | Present at repo root (`/README.md`), structured as the output card: **Name + Role · Problem I solved · What I built · Tool used · Time without AI · Time with AI today · Will I use next week? · Impact quantified**. | Feeds most criteria; missing README ≈ zero on most. | **BLOCKER** |
| **SC-02** | `prompt.md` at branch root | Present and substantive. | Read directly by the scorer. | **BLOCKER** |
| **SC-03** | `ai-chat-export.json` at branch root | Present **and substantive** (real, detailed agentic transcript, not a stub). | **Missing → `llm_craft` HARD-CAPPED at 5/30** (a −25 point swing). `llm_craft` is the single largest dimension (30 pts). | **BLOCKER (±25)** |
| **SC-04** | `demo/` contains a **real screenshot of the running RIA app** | ≥1 image in `demo/` that shows the **RIA app running** (dashboard/analysis/impact), not a slide and not a screenshot of the scorer UI. | `working_demo` (15) needs end-to-end evidence; **slide decks score 0**. ⚠️ Current `demo/` holds only `scorer-ui.png` + `demo-description.txt` — that is a scorer screenshot, **not** the RIA app. Must be replaced/supplemented with a genuine app screenshot before ship. | **BLOCKER** |
| **SC-05** | `npm run build` passes | `npm run build` completes with no errors (TypeScript + Vite production build green). | A broken build undercuts `working_demo` and `complexity`; a green build is the baseline proof it's real. | **BLOCKER** |
| **SC-06** | App renders end-to-end | Full closed loop (§5 steps 0–10) runs in the built app without console errors: login → dashboard → reviews → analysis → action plan → collect new reviews → impact verdict. | Core of `working_demo` (15). | **BLOCKER** |
| **SC-07** | Meaningful commit history | Last 10 commit messages are descriptive and tell the build story (phases, features), not "wip"/"fix". | Last 10 commits are fed to the scorer and influence `llm_craft` / overall credibility. | **HIGH** |
| **SC-08** | Product framing = experience.com / XMP | README + demo language frames RIA as an **Experience.com / XMP review-intelligence capability** (multi-location reputation, review response, CX improvement), demoed on restaurants — **not** a "generic restaurant app". | `product_knowledge` (20) rewards real experience.com understanding; generic apps score low. | **HIGH** |
| **SC-09** | ROI quantified | README `Impact quantified` uses **specific, defensible numbers** (e.g., "cuts negative-review triage from X hrs to Y min per location per week across N locations"), not "saves time". | `roi_impact` (25) explicitly rewards quantified, defensible savings. | **HIGH** |
| **SC-10** | Complexity is genuine | The closed-loop before/after mechanism, deterministic scenario scripting, and pure-service layer are visibly real and hard. | `complexity` (10). | **MEDIUM** |
| **SC-11** | Branch name correct | Branch is `anandhu-subramaniam/ria`. | Scorer reads per-branch. | **BLOCKER** |
| **SC-12** | No StrictMode regressions | App mounts **without** `React.StrictMode`; AntD v4 `Table` + `Tooltip` smoke-tested (no `findDOMNode` crashes). | AntD v4 + React 18 top risk #1 — a crash here kills `working_demo`. | **HIGH** |

> **Reference bar:** the reference submission self-reports **78/100**. SC-03 alone (present + substantive `ai-chat-export.json`) protects up to 25 of our points; SC-04/05/06 protect the 15-pt `working_demo`.

---

## 11. QA Sign-Off Criteria (ship gate)

RIA ships **only when all of the following are true**:

**P0 — must all pass (blockers):**
1. **Functional loop (§3):** F-01 … F-20 all pass — full closed loop runs, verdict renders, verdict↔status mapping (F-18) holds.
2. **Demo scenarios (§4):** A-01 … A-06 all pass; specifically **A-05 verdict = "Improvement Confirmed"** with deltas clearing thresholds, and **A-06 verdict = "No Significant Improvement"** with a **tier-2 `nextRemedyId`** surfaced — both against the *same* `thresholds.ts`.
3. **Reproducible walkthrough (§5):** the frozen expected-output table is filled and steps 0–10 reproduce it exactly on a clean profile.
4. **Determinism (§8):** static greps return no `Math.random`/`Date.now`/`new Date`; reload yields identical numbers; nothing computed is persisted.
5. **Services boundary (§9):** `npm run lint` clean under `src/services/`; negative test confirms the rule is live.
6. **Data invariants (§7):** D-01 … D-12 all hold (referential integrity, scenario ids, ≥10 reviews/restaurant, phase↔date, threshold alignment).
7. **Edge cases (§6):** E-01 … E-09 handled gracefully — especially E-03 (Monitoring), E-06 (migration), E-07 (Reset Demo → baseline).
8. **Scorer readiness (§10):** every **BLOCKER** row (SC-01, SC-02, SC-03, SC-04, SC-05, SC-06, SC-11) satisfied.

**P1 — strongly expected (raise before ship if time allows):**
9. SC-07 (meaningful commits), SC-08 (experience.com framing), SC-09 (quantified ROI), SC-12 (no StrictMode/AntD-v4 regressions).
10. Optional Vitest suite (§2.1) green if present — not a blocker.

**Explicit red-flags that block ship:**
- `ai-chat-export.json` missing or stubby (caps `llm_craft` at 5).
- `demo/` lacks a real screenshot of the **running RIA app** (only `scorer-ui.png` present today).
- Any non-deterministic number, or a number that differs after reload.
- Scenario 5 not "Improvement Confirmed" **or** scenario 6 not "No Significant Improvement" + tier-2 remedy.
- `npm run build` fails, or the app throws on the closed-loop path.

---

## Appendix A — Verdict ↔ ActionStatus mapping (subtle-bug guard)

`ImpactResult.verdict` (a string) and `ActionStatus` (an enum with different label strings) are **distinct**. `collectNewReviews` must map correctly — mismatches are an easy bug:

| `ImpactResult.verdict` | → `ActionStatus` member | `ActionStatus` label string |
|---|---|---|
| `"Improvement Confirmed"` | `ActionStatus.ImprovementConfirmed` | `"Improvement Confirmed"` |
| `"Monitoring — more feedback needed"` | `ActionStatus.Monitoring` | `"Monitoring"` |
| `"No Significant Improvement"` | `ActionStatus.NoSignificantChange` | `"No Significant Change"` |

> Note the deliberate wording gap: the impact **verdict** says *"No Significant Improvement"* while the mapped **status** reads *"No Significant Change"*. QA verifies both strings render where expected and are not accidentally swapped or conflated.

## Appendix B — Threshold reference (`services/thresholds.ts`)

| Constant | Value | Used for |
|---|---|---|
| `MIN_AVG_RATING_DELTA` | `0.6` | avgRating must rise ≥ this to count as improvement |
| `MIN_COMPLAINT_DROP` | `3` | target-category complaints must fall ≥ this |
| `MIN_AFTER_REVIEWS` | `5` | below this → "Monitoring — more feedback needed" |
| `MIN_SENTIMENT_DELTA` | `0.3` | sentiment must rise ≥ this |

Scenario 5 clears all; scenario 6 fails them (with `after.reviewCount ≥ 5` so it is *not* Monitoring); the Monitoring edge is `after.reviewCount < 5`.
