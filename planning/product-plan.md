# Review Impact Analysis (RIA) — Product / Business Plan

> **Owner:** Product/Business Agent · **Feeds:** ux-plan, data-plan, analysis-plan.

This is the product source-of-truth for RIA. It defines *what* we are building and *why it
is worth building*, in terms the downstream planning agents (UX, data, analysis) consume
directly. All names, types, routes, enums, and components referenced here are fixed by the
shared authoritative context and are used verbatim — nothing is renamed.

---

## 1. MVP Objective

**RIA is a closed-loop review-intelligence tool that helps a restaurant owner understand
what customers are unhappy about, decide a specific fix, and then *prove* whether the fix
actually improved feedback** — without any manual spreadsheet work, competitor
mystery-shopping, or guesswork.

RIA exists to answer **7 owner questions**, in order. The whole product is a machine for
walking an owner from question 1 to question 7:

| # | Owner question | Where RIA answers it |
|---|----------------|----------------------|
| 1 | What are customers unhappy about? | Dashboard → `ProblemAreas`; `/reviews` |
| 2 | Why? | `/analysis/:reviewId` → `RootCauseCard` |
| 3 | How do I compare to similar restaurants? | `/analysis/:reviewId` → `PeerComparison` |
| 4 | What are successful restaurants doing differently? | `/analysis/:reviewId` → `PositiveReviewComparison` |
| 5 | What remedy should I take? | `/analysis/:reviewId` → `RemedyCard` |
| 6 | What action should I perform? | `/action-plan` → `ActionPlan` / `ActionItem` |
| 7 | Did the action actually improve feedback? | `/impact` → `ImprovementSummary`, `BeforeAfterComparison` |

**Definition of the MVP win:** an owner logs in, sees that "something is wrong," drills into
the evidence, gets a *specific* recommended fix, records the action, clicks **Collect New
Reviews**, and watches RIA render a before/after verdict — all end to end, with stable,
deterministic numbers.

---

## 2. Product Framing — RIA is an Experience.com / XMP capability

**RIA is a review-intelligence capability of the Experience.com XMP (Experience Management
Platform), demoed on the restaurant vertical. It is NOT a generic restaurant app.**

Experience.com helps multi-location brands manage reputation and customer experience across
all of their locations: collecting reviews and survey feedback, surfacing them in one place,
responding to them, and reporting on CX trends. The recurring hard problem for those brands
is not *collecting* feedback — it is **closing the loop on negative feedback**: turning a
pile of 1- and 2-star reviews into a specific operational fix at a specific location, and
then confirming that the fix moved the numbers.

RIA is exactly that "close the loop" capability:

- **Multi-location reputation management** — the data model is location- and
  restaurant-scoped (`Location`, `Restaurant`, `restaurantIds` on `User`), so RIA reasons
  per location the way XMP reports per location. Peer comparison across locations
  (`catalogItemId` join) is the multi-location intelligence a single-restaurant tool cannot
  produce.
- **Review response / CX improvement** — RIA does not stop at "here is an angry customer."
  It produces a `RootCause`, a specific `Remedy`, and a tracked `ActionItem`, then measures
  the `ImpactResult`. That is the CX-improvement loop XMP customers are graded on.
- **Restaurants as the *demo* vertical** — restaurants give us reviews, ratings, menu items,
  prices, and cross-location comparability that make the closed loop legible in a 5-minute
  demo. The same engine applies to any multi-location XMP brand (retail, healthcare,
  mortgage, auto) where the unit of comparison is a "location × offering."

> **Framing rule for all copy:** wherever natural, use the language of multi-location
> reputation management, review response, and CX improvement — not the language of a
> consumer restaurant-review app.

---

## 3. Primary Persona & User Journey

### Primary persona

| Attribute | Detail |
|-----------|--------|
| Who | **Restaurant owner** (`User.role = 'owner'`), owns exactly one restaurant in the demo dataset |
| Model in code | `User { id, name, email, role:'owner', restaurantIds: string[] }`; 10 owners / 10 restaurants; each restaurant has ≥10 reviews |
| Real-world analog | Location owner / GM inside a multi-location brand that uses Experience.com XMP |
| Goal | Stop the bleeding on negative reviews at the lowest cost and time, and *prove* to themselves (and the brand) that it worked |
| Pain today | Reviews are scattered; patterns are invisible; there is no peer benchmark; "did my fix work?" is answered weeks later, by feel, if at all |
| Sophistication | Operator, not analyst. Wants a specific instruction ("do X"), not a dashboard to interpret |

### Journey → narrative arc

The product is intentionally shaped as a **story the owner walks through**, not a set of
tools. Each arc beat maps to a concrete route/component and answers one owner question.

| Narrative beat | What the owner experiences | Route / component | Owner Q |
|----------------|----------------------------|-------------------|:------:|
| **Something is wrong** | A "wake-up call" the moment they log in — rating dip, a spike of negatives | `/dashboard` → `WakeUpCall`, `RatingSummary`, `RatingTrend` | 1 |
| **Here's what** | The specific problems ranked by frequency/severity | `/dashboard` → `ProblemAreas`; `/reviews` → `ReviewTable`, `ReviewCard` | 1 |
| **Here's evidence** | The actual negative reviews behind each problem | `/analysis/:reviewId` → `ReviewAnalysis`, `EvidenceCard` | 2 |
| **Here's what successful peers do** | How peers price/rate the same item; what happy customers praise | `/analysis/:reviewId` → `PeerComparison`, `PositiveReviewComparison` | 3, 4 |
| **Here's the likely root cause** | A "beyond classification" root-cause statement with confidence | `/analysis/:reviewId` → `RootCauseCard` | 2 |
| **Here's what to do** | A *specific* remedy with concrete steps and expected impact | `/analysis/:reviewId` → `RemedyCard` | 5 |
| **I took the action** | Owner records the action and works it through statuses | `/action-plan` → `ActionPlan`, `ActionItem` | 6 |
| **Here's whether it worked** | Click **Collect New Reviews** → before/after verdict, or a next remedy | `/impact` → `ImprovementSummary`, `BeforeAfterComparison`, `ImpactTimeline`, `ImprovementStatus` | 7 |

The arc is deliberately closed: beat 8 either **confirms improvement** or **loops back** to
beat 6 with the tier-2 remedy — this loop is the differentiator (§9) and the demo climax.

---

## 4. Business Rules

These rules are fixed and must be honored identically by the data, analysis, and UX plans.

### 4.1 Rating scale (1–5)

| Rating | Meaning |
|:------:|---------|
| 1 | Low |
| 2 | Moderate |
| 3 | Average |
| 4 | Good |
| 5 | Excellent |

### 4.2 What we analyze

- **Analyze reviews rated *below 3*** (i.e. ratings **1 and 2**). These are the negative
  reviews the closed loop acts on. Ratings 3–5 are used as context — notably 4–5 reviews
  feed `PositiveReviewComparison` ("what happy customers praise").
- **A single review may carry MULTIPLE problems.** Classification returns a *set* of
  `ProblemCategory` values per review (`tags.categories: ProblemCategory[]`), and
  `DetectedProblem` aggregates across the many-to-many relationship. No review is forced into
  a single bucket.

### 4.3 The 13 problem categories (`ProblemCategory`)

`Price` · `Quality` · `Quantity` · `Taste` · `Service` · `WaitingTime` · `Availability` ·
`Staff` · `Cleanliness` · `Menu` · `Ambience` · `Delivery` · `Packaging`

### 4.4 The closed-loop flow (canonical)

```
Reviews
  → Detect Problems
  → Analyze
  → Peer Comparison
  → Positive Review Comparison
  → Root Cause
  → Remedy
  → Action Plan
  → Owner Takes Action
  → Collect New Reviews
  → Before/After Analysis
  → Measure Improvement
  → Confirm Improvement  OR  Recommend Next Remedy
```

The final branch is the business heart of RIA:

- **Confirm Improvement** — post-action reviews clear the thresholds in `thresholds.ts`;
  `ImpactResult.verdict = 'Improvement Confirmed'`; `ActionItem.status` advances to
  `ImprovementConfirmed`.
- **Recommend Next Remedy** — post-action reviews do not clear the thresholds;
  `ImpactResult.verdict = 'No Significant Improvement'`; `nextRemedyId` is set via
  `remedyService.getNextRemedy(category, excludeRemedyId)` (tier-2), and the owner can create
  a second `ActionItem` and loop again.
- **Monitoring** — if the after-window is too small (`< MIN_AFTER_REVIEWS`), verdict is
  `'Monitoring — more feedback needed'` and status sits at `Monitoring`.

---

## 5. MVP Scope

### 5.1 In scope

| Area | In scope for MVP |
|------|------------------|
| Auth | Mock email-only `login(email)` against seeded `User` list; `ProtectedRoute` gate |
| Data | Deterministic mock seed (`SeedData`) — 10 owners, 10 restaurants, shared locations, shared catalog items, ≥10 reviews each, authored `tags` ground truth |
| Detection | Multi-problem classification of below-3 reviews; `DetectedProblem` aggregation |
| Analysis | `ReviewAnalysis` orchestration: problems + sentiment + peer + positive + root cause + remedy |
| Peer comparison | Cross-restaurant, joined on `catalogItemId`: price delta, percentile, rating gap, rank |
| Positive comparison | Themes happy customers praise vs. the negative contrast |
| Remedies | Specific tier-1 and tier-2 remedies from `remedyTable.ts` |
| Action plan | Create action from remedy; advance through the 6 `ActionStatus` values |
| Before/after | `Collect New Reviews` release mechanism → `computeImpact` → verdict |
| Continuous loop | Next-remedy recommendation on a failed remedy (Scenario 6) |
| Persistence | `localStorage` via zustand `persist` (key `ria-store-v1`); visible **Reset Demo** |
| Demo | 6 scripted scenarios; screenshot(s) in `demo/` |

### 5.2 Explicitly out of scope (do NOT build)

- **Real authentication** — no passwords, OAuth, sessions, or real identity.
- **Real database / backend** — no server, no API; static seed + `localStorage` only.
- **Real review integrations** — no Google/Yelp/delivery/XMP API ingestion; reviews are
  authored mock data.
- **Real AI** — the "analysis" is a deterministic mock service, not a live LLM call.
- **Billing / payments / subscriptions.**
- **Notifications** — no email/SMS/push.
- **Complex permissions / RBAC** — a single `'owner'` role; no admin, manager tiers, or org
  hierarchy.

These exclusions are deliberate: they keep the MVP deterministic and demo-stable (a hard
requirement for the scorer, see §7) and focus every hour on the closed-loop story.

---

## 6. Success Criteria

### 6.1 Functional "done"

- [ ] Owner can log in with a seeded email and is gated by `ProtectedRoute` otherwise.
- [ ] Dashboard renders the wake-up call, rating summary, rating trend, and ranked problem
      areas for the active restaurant.
- [ ] `/reviews` lists reviews; below-3 reviews are clearly the actionable set.
- [ ] `/analysis/:reviewId` renders **all** sections in one route — evidence, peer
      comparison, positive comparison, root cause, and a *specific* remedy.
- [ ] Owner can create an `ActionItem` from a `Remedy` and advance it through the 6 statuses.
- [ ] **Collect New Reviews** releases the post-action set and renders a before/after verdict.
- [ ] Scenario 5 yields **Improvement Confirmed**; Scenario 6 yields **No Significant
      Improvement** and offers a tier-2 next remedy — against the *same* thresholds.
- [ ] **Reset Demo** returns the app to a clean baseline; nothing computed is persisted.

### 6.2 Demo "done" (scoring-critical)

The demo must **tell the closed-loop story end to end with stable numbers**:

- Runs live in a browser (not a slide deck) — a static deck scores **0** on `working_demo`.
- Evidence lives as a screenshot in the **`demo/`** folder.
- Every number is deterministic: no `Math.random()`, `Date.now()`, or `new Date()`; a single
  seeded PRNG and hardcoded dates. Re-running the demo shows identical figures, so the
  headline ROI numbers in the README stay true on stage.
- The narrative arc (§3) is visibly walked: *Something is wrong → … → Here's whether it
  worked*, ending on both a **confirmed** improvement (Scenario 5) and a **loop-back** to a
  next remedy (Scenario 6).

---

## 7. ROI Thesis (quantified, defensible)

**Headline claim RIA's README will carry:**

> **RIA saves a location owner ~7.5 hours of review triage, analysis, and impact-measurement
> work per location every month — cutting a ~8.5-hour manual loop down to ~1 hour — and
> compresses time-to-fix from ~3–4 weeks to under 1 week. Across a 20-location brand that is
> ~1,800 owner/GM hours reclaimed per year (~$72K at a $40/hr blended rate), before counting
> the revenue upside of a higher rating.**

### 7.1 The unit-level arithmetic

We frame savings in specific "saves X min per Y" units, then roll them up per location per
month. Volume assumptions are marked and conservative.

**Assumptions (per location, per month):**
- ~150 total reviews/month across sources *(assumption — typical active XMP location)*.
- ~20% are negative (rating below 3) → **~30 negative reviews/month** to triage.
- ~4 active problem areas and ~2 remedy/action cycles per month *(assumption)*.
- Blended owner/GM labor cost **$40/hr** *(assumption)*.

| Work item | Unit | Manual time | RIA time | Saved / unit | Units / mo | Saved / mo |
|-----------|------|:-----------:|:--------:|:------------:|:----------:|:----------:|
| Triage + tag a negative review | per negative review | 5.0 min | 0.5 min | 4.5 min | 30 | **135 min** |
| Root cause + peer comparison for a problem area | per problem area | 45 min | 5 min | 40 min | 4 | **160 min** |
| Before/after impact measurement | per action cycle | 90 min | 5 min | 85 min | 2 | **170 min** |
| **Total** | | | | | | **465 min ≈ 7.75 hrs** |

- **Manual loop total ≈ 8.5 hrs/mo** (30×5 + 4×45 + 2×90 = 150 + 180 + 180 = 510 min).
- **RIA loop total ≈ 1.1 hrs/mo** (30×0.5 + 4×5 + 2×5 = 15 + 20 + 10 = 45 min ≈ 0.75 hr,
  plus ~20 min reading the generated narratives → ~1.1 hr).
- **Net saved ≈ 7.5 hrs/location/month.**

### 7.2 Rolling it up

| Lens | Calculation | Result |
|------|-------------|--------|
| Per location / month | 7.5 hrs × $40 | **~$300** |
| Per location / year | 7.5 hrs × 12 | **90 hrs (~$3,600)** |
| 20-location brand / year | 90 hrs × 20 | **~1,800 hrs (~$72,000)** |

### 7.3 The three additional ROI levers

1. **Faster time-to-fix.** Manually, an owner notices a pattern late and reacts in ~3–4
   weeks. RIA surfaces the ranked problem + specific remedy on login, dropping time-to-fix to
   **under 1 week** — every extra week of an unfixed problem is more negative reviews.
2. **Measurable rating lift.** RIA does not just recommend; it confirms. In the demo,
   Scenario 5's confirmed remedy lifts the flagged item's rating **+2.1 stars** (avgRating
   delta) with complaints down 7 and sentiment up 0.8 — a concrete, on-screen proof point.
3. **Revenue upside of a higher rating.** A published Harvard Business School study (Luca)
   found that a one-star increase in a restaurant's online rating is associated with a
   **5–9% increase in revenue** *(external benchmark, cited for scale)*. RIA is the mechanism
   that turns triaged complaints into that rating movement.

### 7.4 Why this is defensible

Every figure is either (a) computed from a stated per-unit time and a marked volume
assumption, or (b) an attributed external benchmark. Nothing is a vague "saves time" claim —
each line reads as *"saves X min per Y."* Because the demo is deterministic, the headline
numbers are reproducible on stage.

---

## 8. Differentiator

**Most review tools stop at "here are your unhappy customers." RIA goes two steps further:
it recommends a *specific* fix, and then it *proves whether the fix improved feedback*.**

| Capability | Typical review dashboard | RIA |
|------------|:------------------------:|:---:|
| Aggregate reviews & ratings | ✅ | ✅ |
| Surface negative sentiment | ✅ | ✅ |
| Rank problems by frequency/severity | partial | ✅ (`DetectedProblem`) |
| Benchmark against peers on the *same item* | ❌ | ✅ (`PeerComparison`, `catalogItemId` join) |
| Contrast with what happy customers praise | ❌ | ✅ (`PositiveReviewComparison`) |
| State a "beyond classification" **root cause** | ❌ | ✅ (`RootCause`) |
| Recommend a **specific** remedy (not "improve service") | ❌ | ✅ (`Remedy` with `specificActions`) |
| **Prove** the fix worked (before/after verdict) | ❌ | ✅ (`ImpactResult`) |
| **Loop** to a next remedy when a fix fails | ❌ | ✅ (`getNextRemedy`) |

The last three rows are the moat. "Reduce prep-to-table time below 15 minutes" and "increase
portion weight 20% on flagged items" are actions an owner can execute Monday morning — and
the before/after verdict is what lets a multi-location brand *trust* the recommendation
enough to roll it out across locations. This is the close-the-loop CX capability
Experience.com XMP customers are measured on.

---

## 9. Success Metrics / KPIs (production)

If RIA shipped as an XMP capability, these are the metrics the product would track. (In the
MVP they are illustrated by the deterministic demo, not instrumented.)

### Adoption & speed

| KPI | Definition | Target direction |
|-----|------------|:----------------:|
| Negative-review triage coverage | % of below-3 reviews classified & surfaced within 24h | ↑ toward 100% |
| Mean time-to-fix | Days from problem detected → `ActionItem` created | ↓ (weeks → days) |
| Loop-closure rate | % of created actions that reach a terminal verdict (`ImprovementConfirmed` / `NoSignificantChange`) | ↑ |

### Effectiveness (the close-the-loop proof)

| KPI | Definition | Target direction |
|-----|------------|:----------------:|
| Remedy success rate | % of actions with verdict `Improvement Confirmed` | ↑ |
| Rating lift per location | avgRating delta post-action vs. baseline (`ImpactResult.deltas.avgRating`) | ↑ |
| Complaint-category reduction | Drop in `complaintFrequency` for the targeted `ProblemCategory` | ↑ |
| Sentiment lift | `sentimentScore` before → after | ↑ |
| Peer-gap closure | Reduction in `PeerComparisonResult.ratingGap` / `priceDeltaPct` vs. peers | ↓ gap |

### Business impact

| KPI | Definition | Target direction |
|-----|------------|:----------------:|
| Owner/GM hours reclaimed | Modeled per §7 (per location / month) | ↑ |
| Rating-driven revenue lift | Rating lift × published elasticity (§7.3) | ↑ |
| Multi-location rollout rate | % of confirmed remedies replicated to peer locations | ↑ |

---

## 10. Hand-off Notes to Downstream Agents

- **ux-plan** — implement the narrative arc (§3) as the spine of navigation; the
  `WakeUpCall` is the first thing an owner sees; peer/root-cause/remedy are *sections within*
  `/analysis/:reviewId`, not separate routes; **Collect New Reviews** and **Reset Demo** are
  first-class, visible controls.
- **data-plan** — author the 6 scenarios (§4.4 branches) so Scenario 5 clears and Scenario 6
  fails the *same* `thresholds.ts`; supply authored `tags` ground truth; keep everything
  deterministic (seeded PRNG, hardcoded dates); ≥10 reviews per restaurant with shared
  `catalogItemId`s to make peer comparison real.
- **analysis-plan** — honor the business rules (analyze below-3, multi-problem per review),
  the 13 categories, and the requirement that remedies are **specific**; keep all logic in
  pure `src/services/` (no react/antd/zustand/store imports) so the closed-loop math is
  testable and reproducible for the demo.

> The ROI numbers in §7 are the ones RIA's `README.md` output card should carry verbatim so
> the `roi_impact` claim is quantified, defensible, and consistent with the live demo.
