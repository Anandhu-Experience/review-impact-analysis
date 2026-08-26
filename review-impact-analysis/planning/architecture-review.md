# RIA — Architecture Review (Tech Lead)

> **Owner:** Tech Lead / Review Agent · **Consumes:** product-plan, ux-plan, data-plan, analysis-plan, frontend-plan, qa-plan · **Feeds:** implementation-plan.md

This is the cross-agent review of the six RIA planning documents. It resolves conflicts,
audits coverage against the requirement doc and the hackathon scorer, prunes unnecessary
complexity, confirms compatibility, and fixes the implementation order. **Verdict up front:
the six plans are mutually compatible and ready to implement**, once the resolutions in §1
are folded into the code (they are already reflected in the individual docs where noted).

---

## 1. Conflicts found & resolved

| # | Conflict / ambiguity | Where it surfaced | Resolution (authoritative) |
|---|---|---|---|
| C-1 | **Component count 23 vs "24".** The shared context said "24 components"; the named list actually contains **23**. | ux-plan, frontend-plan §3.1 | **There are 23 named components.** The "24" was a loose count, not a missing component. The canonical list is in §2.2 below; all 23 are placed in folders and mapped to pages. No component is missing or extra. |
| C-2 | **Verdict string ≠ status label.** `ImpactResult.verdict` = `"No Significant Improvement"` but `ActionStatus` label = `"No Significant Change"`. Easy to conflate. | qa Appendix A, data §9, analysis §9.2/§11 | Keep both strings **distinct and intentional**. The verdict→status mapping is done in **exactly one place** — `store.collectNewReviews` — per the table in qa Appendix A. QA F-18 explicitly verifies both strings render where expected. |
| C-3 | **Component/type name collisions.** Components `ReviewAnalysis`, `PositiveReviewComparison`, `ActionItem` share names with types; `PeerComparison` (component) is adjacent to `PeerComparisonResult` (type). | frontend §3 (naming-collision guard) | **Alias the type on import** where a file needs both: `import type { ActionItem as ActionItemModel } from '../../types'`, etc. Applied in `action/ActionItem.tsx`, `analysis/ReviewAnalysis.tsx`, `analysis/PositiveReviewComparison.tsx`, `pages/AnalysisPage.tsx`. |
| C-4 | **`remedyTable.ts` location.** The shared file structure listed it under `src/data/` while the service list grouped it with `remedyService`. | data §8, analysis §8.1 | **`src/data/remedyTable.ts`** — authored remedy *data*. Imported **directly** by the pure `remedyService` (a `../data/*` import is allowed by the services ESLint rule; it is a deterministic constant, so purity holds). It is **not** part of `SeedData` (remedy fns take `(category, …)`, no `data` arg). |
| C-5 | **`SeedData` shape not pinned.** The shared context named the bundle but not its fields. | data §8 | Canonically defined in data §8: `{ locations, users, restaurants, menuCatalog, restaurantMenuItems, reviews, scenarios }`. `remedyTable` excluded (see C-4). |
| C-6 | **`demo/` currently holds the wrong screenshot.** The repo's existing `demo/` has only `scorer-ui.png` (a screenshot of the *scorer* UI) + `demo-description.txt`. | qa §10 SC-04 | **BLOCKER for implementation.** Phase 17 must capture a real screenshot of the **running RIA app** (the `/impact` page showing "Improvement Confirmed") into `demo/`. A scorer screenshot does not evidence the RIA `working_demo` (15 pts; slide decks score 0). |
| C-7 | **styled-components v6 types vs `@types/styled-components` v5.** | frontend §1.4, §7.1 | Type the theme via declaration merging in `styles/styled.d.ts` (DefaultTheme extends AppTheme). Either keep `@types/styled-components` or rely on v6's bundled types — do not mix. |
| C-8 | **Scenario 5 target category unspecified by the requirement doc** ("successful improvement" is category-agnostic). | data §7.6, qa A-05 | Assigned deterministically: **Scenario 5 = `WaitingTime` @ `rst-05` Thai Orchid** (passes), **Scenario 6 = `Quality` @ `rst-06` Pizza Corner** (fails). Consistent across data/analysis/qa. |

No **hard** contradictions were found — every type is single-sourced in data-plan §4, and the
analysis/frontend/qa docs reference those names verbatim. The items above are ambiguities and
polish, all now resolved.

---

## 2. Coverage audit vs the requirement doc

### 2.1 Pages (6) — ✓ complete
`/login` · `/dashboard` · `/reviews` · `/analysis/:reviewId` · `/action-plan` · `/impact`.
Peer comparison, root cause, and remedy are **sections within `/analysis/:reviewId`** (not
separate routes) — a deliberate, documented decision (frontend §4, ux page specs).

### 2.2 Components (23) — ✓ complete
`AppLayout, Sidebar, Header, MetricCard, RatingSummary, RatingTrend, ProblemAreas, WakeUpCall,
ReviewCard, ReviewTable, ReviewAnalysis, EvidenceCard, PeerComparison, PositiveReviewComparison,
RootCauseCard, RemedyCard, ActionPlan, ActionItem, ImprovementSummary, BeforeAfterComparison,
ImpactTimeline, ImpactMetric, ImprovementStatus.`
All 23 are placed in `components/{layout,dashboard,reviews,analysis,action,impact}/` and mapped
to pages (frontend §3.1). Containers: AppLayout, the 6 Pages, ReviewAnalysis, ActionPlan; the
other 18 are presentational.

### 2.3 Other mandated coverage
| Requirement | Status |
|---|---|
| 13 problem categories (`ProblemCategory`) | ✓ enums.ts (data §4.1) |
| 6 action statuses (`ActionStatus`) | ✓ enums.ts; lifecycle in analysis §9.2 |
| 8 services + supporting modules (lexicon/thresholds/prng/remedyTable) | ✓ analysis §2 |
| Analysis pipeline / Remedy pipeline / Improvement pipeline | ✓ analysis §1, §8, §10 |
| 6 demo scenarios (data-scripted, not random) | ✓ data §7.6, qa §4 |
| Rating 1–5 meaning; analyze reviews <3; multi-problem per review | ✓ product §4, analysis §3 |
| localStorage persistence + Reset Demo | ✓ frontend §5 |
| Mandated `implementation-plan.md` section list | ✓ produced in implementation-plan.md |

### 2.4 Requirement doc's 8 planning outputs
`product-plan.md, ux-plan.md, data-plan.md, analysis-plan.md, frontend-plan.md, qa-plan.md,
architecture-review.md` (this file), `implementation-plan.md` — **all 8 delivered** under
`review-impact-analysis/planning/`.

---

## 3. Unnecessary complexity to remove / de-scope

Keep the build lean; the following are explicitly trimmed:

1. **Scenarios 1–4 post-action sets stay minimal (≈6 reviews each).** The impact narrative
   centers on **Scenario 5 (pass)** and **Scenario 6 (fail)**. Scenarios 1–4 only need enough
   post-action data for the before/after UI to render if released; do not over-author them.
2. **Vitest is optional and off the critical path** (qa §2.1). Do not add RTL/jsdom. Manual
   walkthrough scripts satisfy every P0 gate.
3. **RadarChart for `PositiveReviewComparison` is optional** — paired bars / theme chips are
   sufficient; only add the radar if time allows.
4. **No path aliases, no extra deps, no Tailwind, no antd v5 tokens.** Relative imports only;
   this also keeps the services ESLint patterns simple.
5. **No Less recompilation for antd theming.** Use the precompiled `antd/dist/antd.css` + a few
   `GlobalStyle` brand overrides (frontend §7.3) rather than a Less `modifyVars` build.

---

## 4. Compatibility confirmation (single-source-of-truth check)

- **Types:** defined once in `data-plan §4` (`src/types/*` + `Scenario` in `src/data/scenarios.ts`).
  analysis/frontend/qa reference them verbatim. ✓
- **`SeedData`:** defined once in `data-plan §8`; store + services consume it as a plain arg. ✓
- **Thresholds:** defined once in `services/thresholds.ts` (`MIN_AVG_RATING_DELTA=0.6`,
  `MIN_COMPLAINT_DROP=3`, `MIN_AFTER_REVIEWS=5`, `MIN_SENTIMENT_DELTA=0.3`, plus `SEVERITY_WEIGHTS`
  0.45/0.30/0.25). Cited identically in analysis §3.3/§10, data §7.7, qa §4/Appendix B. ✓
- **Verdict→status mapping:** one place (`collectNewReviews`), one table (qa Appendix A). ✓
- **Visibility gate:** one selector (`useVisibleReviews` → `getVisibleReviews`); every page reads
  reviews through it. ✓
- **Determinism:** no `Math.random`/`Date.now`/`new Date`; one seeded PRNG; nothing computed
  persisted — stated identically in data §6, analysis intro, frontend §0/§11, qa §8. ✓
- **Pure-services boundary:** one ESLint override (frontend §2.1 / qa §9). ✓

The Scenario-5-passes / Scenario-6-fails numbers (data §7.7) are the exact deltas the qa
acceptance tests assert (qa A-05/A-06) and the analysis verdict rules produce (analysis §10.2).
They agree. ✓

---

## 5. Implementation order & task dependencies (the 17 phases)

Dependency-ordered; the critical path runs Foundation → Data → Store/Context → then feature
verticals. Analysis services (a page's data source) must precede the page that renders them.

```
P1 Foundation ──┬─▶ P2 Mock Data ──┬─▶ P3 User/Restaurant Context ──┬─▶ P4 Dashboard
                │                   │   (store, login, layout, router)│
                │                   │                                 ├─▶ P5 Reviews
                │                   │                                 │
                │                   └─▶ P6 Review Analysis Engine ────┤
                │                        (detect/classify/analyzeReview)
                │                              │
                │                     P7 Peer Comparison ─────────────┤
                │                     P8 Price/Quality/Quantity ──────┤ (severity + category rules)
                │                     P9 Root Cause ──────────────────┤
                │                     P10 Remedy Engine ──────────────┴─▶ P11 Action Plan
                │                                                              │
                │                                              P12 Before/After Measurement
                │                                                              │
                │                                              P13 Impact & Improvement
                │                                                              │
                │                                              P14 Continuous Improvement (next-remedy loop)
                │
                └─────────────────────────────────────────────▶ P15 UX Polish ─▶ P16 Demo Scenarios ─▶ P17 QA + Package
```

**Key dependencies:**
- P2 (types + data) **blocks everything** — no service or page compiles without the type catalog
  and seed.
- P3 (store + `useVisibleReviews`) blocks every page's data access.
- P6 (`analyzeReview` orchestrator) depends on P7–P10's sub-services; build the sub-services
  (peer, positive, root-cause, remedy) then wire the orchestrator and the Analysis page.
- P11 (Action Plan) needs P10 (a remedy to act on). P12–P13 (before/after) need P11 (an action to
  measure) and P2's post-action review sets.
- P16 (scenario tuning) needs P13 complete to co-tune `thresholds.ts` against real computed deltas.
- P17 (QA + package) is last: re-enable strict checks, run the qa gates, capture the `demo/`
  screenshot, author README/prompt.md/ai-chat-export.json, commit + push the branch.

**Agent ownership per phase** is tabulated in `implementation-plan.md §Implementation phases`.

---

## 6. Scoring-alignment audit (all 5 scorer dimensions → concrete artifacts)

| Dimension | Max | Concrete artifact that earns it | Owning doc / gate |
|---|---|---|---|
| `llm_craft` | 30 | Substantive **`ai-chat-export.json`** at branch root (the real agentic transcript of this multi-agent plan + build). **Missing → hard-capped at 5.** | qa SC-03 (BLOCKER ±25); implementation-plan §Submission packaging |
| `roi_impact` | 25 | README `Impact quantified` carries product §7's numbers **verbatim**: ~7.5 hrs/location/month, ~1,800 hrs/~$72K per year for a 20-location brand, time-to-fix weeks→<1 week, +2.1★ demo proof. | product §7; qa SC-09 |
| `product_knowledge` | 20 | Experience.com/XMP framing throughout (multi-location reputation, review response, CX loop); the real 13-category taxonomy; the peer/location data model. **Not** "a restaurant app". | product §2; qa SC-08 |
| `working_demo` | 15 | A real screenshot of the **running RIA app** (`/impact`, "Improvement Confirmed") in `demo/`; `npm run build` green; closed loop runs end to end. | ux §demo target; qa SC-04/05/06 (BLOCKERs); C-6 above |
| `complexity` | 10 | The 7-stage evidence-based analysis + deterministic before/after with a next-remedy loop, pure-service architecture. | analysis §12; qa SC-10 |

**Biggest levers, in order:** (1) ship a real `ai-chat-export.json` (protects 25 pts); (2) the
Impact-page demo screenshot + green build (protects 15 pts); (3) quantified ROI in the README
(25 pts). Reference bar to beat: **78/100**.

---

## 7. Residual risks the Tech Lead is watching

1. **AntD v4 + React 18 `findDOMNode`** — mitigated by mounting without StrictMode (frontend §1.1);
   **must smoke-test `Table` + `Tooltip` in Phase 1** before building on the stack.
2. **Scenario 5/6 co-tuning** — the pass/fail split must fall out of `computeImpact` over authored
   deltas against the *same* thresholds; freeze the qa §5 walkthrough numbers only after Phase 16.
3. **`demo/` screenshot (C-6)** — do not ship the scorer screenshot; capture the RIA app.
4. **localStorage staleness** — `demoVersion` + `persist.migrate` auto-reset + visible Reset Demo
   (frontend §5); bump `DEMO_VERSION` whenever scenario data changes.
5. **Hollow `node_modules`** — the current `node_modules/` has no manifests; Phase 1 must author a
   real `package.json` and run a clean `npm install` before anything runs.

---

## 8. Sign-off

All six perspective plans are internally consistent and jointly implementable. The resolutions in
§1 are folded into the corresponding docs. Proceed to `implementation-plan.md` for the master
synthesis, phase-by-phase task breakdown, and submission-packaging plan. **No application code is
written until the planning set is approved.**
