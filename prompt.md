# Prompt — Review Impact Analysis (RIA)

This is the product + engineering brief that drove RIA, built with Claude Code via a multi-agent
planning workflow followed by phased implementation. RIA is an **Experience.com / XMP
review-intelligence capability** — "close the loop on negative feedback" — demoed on restaurants.

---

## Main product requirements

Build an MVP that helps a restaurant (location) owner understand and act on negative reviews:
1. What are customers unhappy about? 2. Why? 3. How do I compare with similar restaurants?
4. What are successful restaurants doing differently? 5. What remedy should I take?
6. What action should I perform? 7. Did the action actually improve customer feedback?

Business context: 10 owners, 10 restaurants (some share locations), each with 20–30 reviews; many
menu items shared across restaurants. Each review has a rating (1–5), comment, restaurant, menu
item, price, date, location, and category. Rating meaning: 1=Low, 2=Moderate, 3=Average, 4=Good,
5=Excellent. Analyze reviews rated **below 3**; a review may contain **multiple** problems.

Tech stack (fixed): React + TypeScript + Vite; Ant Design v4 + @ant-design/icons; styled-components;
Recharts; Zustand; React Router; mock JSON/TS data; localStorage; **no backend; mock AI only**; no
Tailwind; no unnecessary dependencies.

Architecture principle (load-bearing): **separate business logic from UI.** Analysis lives only in
pure services (`reviewAnalysisService`, `peerComparisonService`, `remedyService`,
`impactAnalysisService`, `actionPlanService`, …); the frontend contains no analysis logic. Services
start on mock data and can later be replaced by real APIs/AI without redesigning the UI.

## Multi-agent / agentic workflow

Plan the project with specialized agents **before** writing code, then implement.

- **Phase 1 — Requirements → drafts:** Product agent first; then UX, Data, and Analysis agents
  (each depends only on Product); then Frontend (needs UX + Data) and QA (needs Data + Analysis).
- **Phase 2 — Cross-agent review:** a Tech-Lead agent reads all six plans, resolves conflicts,
  checks coverage, and produces `architecture-review.md`.
- **Phase 3 — Implementation planning:** the Tech-Lead synthesizes `implementation-plan.md`
  (phases, task breakdown, dependencies, files, validation), then implementation proceeds phase by
  phase with TypeScript + build checks after each phase.

Agent dependencies: `Product → UX / Data / Analysis`; `UX + Data → Frontend`;
`Data + Analysis → QA`; `all → Tech-Lead review`.

## Agent responsibilities

1. **Product / Business** → `product-plan.md`: MVP scope, user journey, business rules, ROI,
   success criteria.
2. **UX / UI** → `ux-plan.md`: information architecture, pages, navigation, dashboard/analysis/
   remedy/improvement experiences, empty/loading/error states.
3. **Data Architect** → `data-plan.md`: entities, TypeScript interfaces, mock-data structure,
   peer-comparison model, before/after data structure.
4. **Analysis / AI** → `analysis-plan.md`: the review-analysis pipeline, problem categories,
   sentiment, peer comparison, positive-review matching, root cause, remedy, action-plan, and
   improvement analysis.
5. **Frontend Architect** → `frontend-plan.md`: React/component/page architecture, Zustand store,
   routing, styled-components strategy, AntD v4 usage.
6. **Test / QA** → `qa-plan.md`: test strategy, functional scenarios, edge cases, data validation,
   before/after improvement scenarios.
7. **Tech Lead / Review** → `architecture-review.md` + `implementation-plan.md`: reconcile plans,
   remove unnecessary complexity, define implementation order and dependencies.

## Implementation approach

Deterministic, mock-first, UI-decoupled. Build in dependency order across 17 phases: Foundation →
Mock Data → User/Restaurant Context → Dashboard → Reviews → Review Analysis Engine → Peer
Comparison → Price/Quality/Quantity Analysis → Root Cause → Remedy Engine → Action Plan →
Before/After Measurement → Impact & Improvement → Continuous Improvement → UX Polish → Demo
Scenarios → QA. Keep all data deterministic (seeded PRNG, hardcoded dates, authored ground-truth
tags) so scores/impact are byte-reproducible. Enforce the pure-services boundary with ESLint.

## Review analysis requirements

For the logged-in restaurant's reviews rated below 3, detect problems across the 13 categories:
**Price, Quality, Quantity/Portion, Taste, Service, Waiting Time, Availability, Staff, Cleanliness,
Menu, Ambience, Delivery, Packaging.** A review may carry several. Aggregate into per-category
problems with a frequency and a 0–100 severity, and surface evidence (the actual review text).

## Price / Quality / Quantity analysis

Go beyond a single label. Example — *"The pasta was cold, the portion was small and it wasn't worth
$18."* → Quality (temperature), Quantity (small portion), Price (poor value). Combined signal: the
price-to-value experience is weaker than comparable restaurants — not three unrelated complaints.

## Peer comparison

Compare the logged-in restaurant against the other restaurants on the **same or similar menu item**
(join on a canonical catalog item). Compare price, rating, quality/quantity signals, sentiment, and
positive vs. negative review patterns. Identify what successful restaurants do differently
(e.g. higher rating at the same or lower price = a price-to-value gap).

## Root cause

Don't just classify — determine the *likely cause*, stated in one owner-readable sentence backed by
evidence (own reviews + peer benchmark + positive contrast) and a confidence score. Collapse
co-occurring symptoms into a single causal statement.

## Remedy

Provide **specific, actionable** corrective actions — never generic ("improve service"). Examples:
"Reduce prep-to-table time below 15 minutes"; "Increase portion weight 20% on flagged items";
"Raise par levels on top-3 items 30% and adopt an 86-board process"; "Introduce a value meal /
review pricing against 3 peers." Provide a tier-1 (try-first) and a tier-2 (escalation) per category.

## Action plan

Convert remedies into tracked tasks. Each action has: Action, Category, Owner, Priority, Status,
Created Date, Target Date. Statuses: **Not Started, In Progress, Monitoring, Completed, Improvement
Confirmed, No Significant Change.**

## Before/after improvement tracking

Capture baseline metrics before the action. After the action, collect new reviews and compare:
rating, negative/positive counts, complaint frequency by category, sentiment, and peer gap.
Example — Before: rating 2.4, Quality complaints 8, Quantity 5 → After: 4.1, 2, 1 → Rating +1.7,
Quality −75%, Quantity −80% → **"Improvement Confirmed."** If evidence is insufficient →
**"Monitoring — more customer feedback is needed."** If it didn't improve → **"No Significant
Improvement,"** then recommend the next remedy.

## Continuous improvement flow

The loop is a cycle, not a one-shot. On "No Significant Improvement," the system surfaces the next
(tier-2) remedy; the owner creates a new action and the pipeline re-enters at the action step —
measure again, confirm or escalate. This close-the-loop-and-prove-it behavior is the differentiator:
RIA doesn't just find unhappy customers, it recommends a specific fix and proves whether it worked.

## UX principle

The product tells a story: *"Something is wrong → here's what → here's evidence → here's what
successful peers do → here's the likely root cause → here's what to do → I took the action → here's
whether it worked."* The navigation and page layouts follow that arc.
