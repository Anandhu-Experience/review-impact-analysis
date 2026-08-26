# Analysis / AI Plan — Review Impact Analysis (RIA)

> **Owner:** Analysis/AI Agent · **Consumes:** product-plan.md, data-plan.md · **Feeds:** frontend-plan, qa-plan

This document specifies the **analysis engine** of RIA: the pure service layer under
`src/services/` that turns raw reviews into detected problems, peer benchmarks, positive-review
contrasts, root causes, specific remedies, action items, and a threshold-gated before/after
verdict. It is the "brain" behind Experience.com / XMP's *close-the-loop-on-negative-feedback*
capability, demoed on the restaurant vertical.

**Hard architectural rule (inherited, load-bearing):** every symbol below lives in a **pure
service** under `src/services/`. No service imports `react`, `antd`, `zustand`, or `../store`
(ESLint `no-restricted-imports` enforces this). Services take a plain `SeedData` bundle or arrays
and return plain objects. All logic is **deterministic** — no `Math.random()`, `Date.now()`, or
`new Date()`; randomness comes only from the seeded `prng.ts` (mulberry32). Nothing computed is
persisted; every page recomputes on read.

---

## 1. The Mock-AI Pipeline

### 1.1 Principle — "mock now, real Experience.com AI later, same interface"

Every analysis capability is a **pure function with a stable, typed signature**. Today the body is
a deterministic heuristic — a keyword lexicon, per-category rule sets, a hardcoded remedy table,
and threshold math. Tomorrow the body can call **Experience.com's XMP review-intelligence AI**
(LLM classification, semantic theme extraction, generative remedies) and return **the exact same
shapes** (`DetectedProblem`, `RootCause`, `Remedy`, `ImpactResult`). Callers — pages, the store,
QA fixtures — never change. The interface *is* the contract; the intelligence behind it is swappable.

This is why authored ground-truth `tags` and the lexicon coexist: `tags` guarantee reproducible
demo scores today, the lexicon proves the classifier works on untagged text, and both are read
**only inside the service** — data supplies ground truth, but the logic never leaves `src/services/`.

### 1.2 The ordered pipeline

```
                         ┌──────────────────────────────────────────────────────────────────┐
                         │  reviewAnalysisService.analyzeReview(reviewId, ...) — orchestrator │
                         └──────────────────────────────────────────────────────────────────┘
                                                   │
  (1) classifyReview / detectProblems     ────────▶  What are customers unhappy about?
        reviewAnalysisService                          DetectedProblem[]  (category, severity, frequency…)
                                                   │
  (2) scoreSentiment / aggregateSentiment ────────▶  How strong is the dissatisfaction?
        sentimentService                              sentiment ∈ {Pos,Neu,Neg}, score ∈ [-1,1]
                                                   │
  (3) comparePeers                         ────────▶  How do I compare to similar restaurants?
        peerComparisonService                        PeerComparisonResult (priceDeltaPct, ratingGap, rank…)
                                                   │
  (4) findPositiveComparisons              ────────▶  What are successful restaurants doing differently?
        positiveReviewService                        PositiveReviewComparison (positiveThemes, contrast)
                                                   │
  (5) deriveRootCause                      ────────▶  WHY? (beyond classification)
        rootCauseService                             RootCause (statement, evidence[], confidence)
                                                   │
  (6) getRemedy  (tier 1)                  ────────▶  What remedy should I take?
        remedyService                                Remedy (title, specificActions[], targetMetric)
                                                   │
   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ USER ACTS ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                   │
  (7) createActionFromRemedy               ────────▶  What action should I perform?
        actionPlanService                            ActionItem (status lifecycle begins)
                                                   │
  (8) collectNewReviews  (store releases scenario) ─▶  release post-action reviews (no timers)
                                                   │
  (9) computeImpact                        ────────▶  Did the action actually improve feedback?
        impactAnalysisService                        ImpactResult (before, after, deltas, verdict)
                                                   │
                                          ┌────────┴─────────┐
                                   verdict = Confirmed   verdict = No Significant Improvement
                                          │                    │
                                        DONE      (10) getNextRemedy(category, excludeRemedyId) → tier-2
                                                               └──▶ loop back to step (7)
```

Steps 1–6 are **automatic** (run on page load via `analyzeReview`). Steps 7–8 are **user-driven**
(owner creates an action, then clicks "Collect New Reviews"). Steps 9–10 are **automatic** once
new reviews are released. The loop closes the seven owner questions in order.

---

## 2. Per-Service Design

All signatures are copied verbatim from the shared context. `data` is the `SeedData` bundle;
`visibleReviews` is the gated review array from `impactAnalysisService.getVisibleReviews`.

### 2.1 `sentimentService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `scoreSentiment` | `scoreSentiment(comment, tags?) → {sentiment, score}` | One review → `Sentiment` label + numeric `score ∈ [-1,1]`. |
| `aggregateSentiment` | `aggregateSentiment(reviews) → number` | Mean sentiment score across a review set, `∈ [-1,1]`. |

**Algorithm.** `scoreSentiment` prefers authored ground truth: if `tags?.sentiment` is present it
sets the label directly and derives a magnitude so downstream math has a real number; otherwise it
falls back to the lexicon (§4.1). `aggregateSentiment` averages the per-review `score`. Detailed in §5.

### 2.2 `reviewAnalysisService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `classifyReview` | `classifyReview(review) → {categories, sentiment, isNegative}` | Multi-label problem classification for one review. |
| `detectProblems` | `detectProblems(reviews) → DetectedProblem[]` | Aggregate classifications into per-category `DetectedProblem`. |
| `computeProblemAreas` | `computeProblemAreas(restaurantId, data, visibleReviews)` | Dashboard `ProblemAreas` feed: top-N complaint categories by frequency. |
| `computeRatingTrend` | `computeRatingTrend(reviews, bucket)` | Avg rating bucketed over time (for `RatingTrend` LineChart). |
| `computeRatingSummary` | `computeRatingSummary(reviews)` | 1–5★ distribution + overall average (for `RatingSummary`). |
| `analyzeReview` | `analyzeReview(reviewId, data, visibleReviews) → ReviewAnalysis` | **Orchestrator** — runs the whole pipeline for one review. |

**`analyzeReview` orchestration (the assembly point):**

```
analyzeReview(reviewId, data, visibleReviews):
  review   = find review by id in data
  problems = detectProblems(visibleReviews for this restaurant)         // §4
  primary  = problem with max severity among review's own categories    // the "headline" issue
  peer     = comparePeers(review.restaurantId, review.catalogItemId, data)          // §6  (null if no peers)
  positive = findPositiveComparisons(review.restaurantId, primary.category,
                                     review.catalogItemId, data)                     // §7  (null if none)
  root     = deriveRootCause(primary, review.restaurantId, data, peer, positive)     // §8
  remedy   = getRemedy(primary.category, root)                                       // §9  (tier 1)
  return { review, problems, peer, positive, rootCause: root, remedy }   // → ReviewAnalysis
```

### 2.3 `peerComparisonService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `getPeerItems` | `getPeerItems(catalogItemId, excludeRestaurantId, data)` | All `RestaurantMenuItem` offerings of the same catalog item at *other* restaurants. |
| `comparePricing` | `comparePricing(...)` | `myPrice` vs peer prices → `priceDeltaPct`, `pricePercentile`. |
| `compareRatings` | `compareRatings(...)` | `myAvgRating` vs peer ratings → `ratingGap`, `rank`. |
| `comparePeers` | `comparePeers(restaurantId, catalogItemId, data) → PeerComparisonResult` | Orchestrates the two above into one result. Detailed in §6. |

### 2.4 `positiveReviewService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `findPositiveComparisons` | `findPositiveComparisons(restaurantId, category, catalogItemId, data) → PositiveReviewComparison` | Mine 4–5★ peer reviews of the same item; build the contrast. |
| `extractPositiveThemes` | `extractPositiveThemes(reviews) → string[]` | Positive-theme phrases from a review set. Detailed in §7. |

### 2.5 `rootCauseService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `deriveRootCause` | `deriveRootCause(problem, restaurantId, data, peer, positive) → RootCause` | Per-category rules that synthesize a *beyond-classification* `statement`, attach `Evidence[]`, and set `confidence`. Detailed in §8. |

### 2.6 `remedyService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `getRemedy` | `getRemedy(category, rootCause) → Remedy` | Tier-1 remedy for the category (rootCause biases the pick). |
| `getNextRemedy` | `getNextRemedy(category, excludeRemedyId) → Remedy` | Tier-2 remedy (the one *not* excluded) — the failed-remedy loop. |
| `mapProblemToRemedies` | `mapProblemToRemedies(category) → Remedy[]` | All remedies (tier 1 + tier 2) for a category, from `remedyTable.ts`. |

### 2.7 `impactAnalysisService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `getVisibleReviews` | `getVisibleReviews(restaurantId, releasedScenarioIds, data)` | Baseline reviews always; post-action reviews only for released scenarios (the gating primitive). |
| `captureSnapshot` | `captureSnapshot(restaurantId, scenario, phase, data) → MetricSnapshot` | Compute a `MetricSnapshot` for a phase window. Detailed in §11. |
| `computeImpact` | `computeImpact(action, data, releasedScenarioIds) → ImpactResult` | Before vs after deltas + verdict. Detailed in §11. |

### 2.8 `actionPlanService.ts`

| Function | Signature | Purpose |
|---|---|---|
| `createActionFromRemedy` | `createActionFromRemedy(remedy, rootCause, restaurantId, owner, scenarioId, data) → ActionItem` | Materialize a remedy into a tracked `ActionItem`. Detailed in §10. |
| `advanceStatus` | `advanceStatus(action, newStatus)` | Transition an action along the `ActionStatus` lifecycle. |
| `summarizeActionPlan` | `summarizeActionPlan(actions)` | Counts by status for the `ActionPlan` header. |

**Supporting pure modules (no exported analysis, data only):** `lexicon.ts` (keyword→category +
positive/negative sentiment words), `remedyTable.ts` (`Record<ProblemCategory, Remedy[]>`),
`thresholds.ts` (the four impact constants), `prng.ts` (mulberry32 seeded PRNG).

---

## 3. Problem Detection & Classification

### 3.1 `classifyReview(review) → {categories, sentiment, isNegative}`

Single-review, **multi-label** (a review may contain multiple problems — a hard requirement).

```
classifyReview(review):
  if review.tags present:                       // authored ground truth wins
    categories = review.tags.categories          // ProblemCategory[]
    sentiment  = review.tags.sentiment           // Sentiment
  else:                                          // fallback: keyword lexicon (§4.1)
    categories = matchLexicon(review.comment)    // union of all category hits
    sentiment  = scoreSentiment(review.comment).sentiment
  isNegative = review.rating < 3                 // business rule: analyze reviews rated below 3
  return { categories, sentiment, isNegative }
```

**Tags-first, lexicon-fallback** keeps the demo reproducible (authored reviews score identically
every run) while proving the classifier works on free text. Both paths live only inside the service.

### 3.2 `detectProblems(reviews) → DetectedProblem[]`

Aggregates classifications across a review set into one `DetectedProblem` per category that appears.

```
detectProblems(reviews):
  negatives = reviews.filter(r => r.rating < 3)          // business rule
  for each category c that any negative mentions:
    mentions          = negatives that include c in classifyReview(r).categories
    frequency         = mentions.length
    affectedReviewIds = mentions.map(id)
    avgRatingWhenMentioned = mean(mentions.rating)
    exampleReviewIds  = top 2–3 mentions by lowest rating (most illustrative)
    severity          = severityFormula(...)             // §3.3, 0–100
  return problems sorted by severity desc
```

Fields map 1:1 to the `DetectedProblem` interface: `category`, `severity` (0–100), `frequency`,
`affectedReviewIds`, `avgRatingWhenMentioned`, `exampleReviewIds`.

### 3.3 Severity formula — `severity = f(frequency, negativity, ratingDrag)`, 0–100

Three normalized components, weighted to sum to 1, scaled to 0–100:

```
freqScore  = clamp(frequency / maxFrequencyAcrossCategories, 0, 1)   // relative prevalence
negScore   = clamp(-aggregateSentiment(mentions), 0, 1)              // depth of negativity (sentiment −1..1 → 0..1)
dragScore  = clamp((3 - avgRatingWhenMentioned) / 2, 0, 1)           // how far it drags rating below neutral(3): r=1→1.0, r=3→0

severity = round(100 * (0.45 * freqScore + 0.30 * negScore + 0.25 * dragScore))
```

- **`freqScore`** — a problem mentioned in most negative reviews outranks a one-off gripe.
- **`negScore`** — leans on `aggregateSentiment` over the mentioning reviews; a category tied to
  furious comments scores above one tied to mild "meh" comments at the same frequency.
- **`dragScore`** — a category appearing on 1★ reviews drags the rating harder than one on 2★.

Weights (0.45 / 0.30 / 0.25) are defined in `thresholds.ts` as `SEVERITY_WEIGHTS` so QA and demo
tuning stay in one place. *Assumption:* if a category has zero negative mentions it produces no
`DetectedProblem` (severity is only defined over mentioned categories).

---

## 4. Sentiment Analysis

### 4.1 Scoring approach — `score ∈ [-1, 1]`

```
scoreSentiment(comment, tags?):
  if tags?.sentiment present:                               // ground truth
    base = { Positive: +0.7, Neutral: 0, Negative: -0.7 }[tags.sentiment]
    score = clamp(base + lexiconAdjust(comment) * 0.3, -1, 1) // lexicon nudges magnitude only, not sign
    return { sentiment: tags.sentiment, score }
  else:                                                     // lexicon fallback
    (pos, neg) = countLexiconHits(comment)                  // lexicon.ts positive/negative word lists
    score = (pos - neg) / (pos + neg + 1)                   // Laplace smoothing → bounded [-1,1]
    sentiment = score > 0.2 ? Positive : score < -0.2 ? Negative : Neutral
    return { sentiment, score }
```

The `±0.2` band and `+0.7` anchors live in `thresholds.ts` (`SENTIMENT_POS_CUT`,
`SENTIMENT_NEG_CUT`, `SENTIMENT_ANCHOR`). Smoothing by `+1` guarantees a defined, bounded score even
for a single-hit comment.

### 4.2 Aggregation

```
aggregateSentiment(reviews) = mean( scoreSentiment(r.comment, r.tags).score for r in reviews )   // ∈ [-1,1]
```

Consumed by: the severity formula (§3.3), `MetricSnapshot.sentimentScore` (§11), and the impact
`deltas.sentiment` gate. One definition, reused everywhere — no divergent sentiment math.

---

## 5. Peer Comparison Logic

Peer comparison is the join that makes RIA more than single-restaurant analytics: it benchmarks one
owner against *other restaurants selling the same catalog item*. The join key is **`catalogItemId`**
(denormalized onto every `Review` for fast queries).

### 5.1 `comparePeers(restaurantId, catalogItemId, data) → PeerComparisonResult`

```
comparePeers(restaurantId, catalogItemId, data):
  peerItems = getPeerItems(catalogItemId, restaurantId, data)     // other restaurants' offerings of this item
  peerCount = distinct restaurants in peerItems

  // pricing (comparePricing)
  myPrice         = my RestaurantMenuItem.price for catalogItemId
  peerAvgPrice    = mean(peerItems.price)
  priceDeltaPct   = 100 * (myPrice - peerAvgPrice) / peerAvgPrice      // + = I'm dearer, − = I'm cheaper
  pricePercentile = 100 * (# peers priced strictly below me) / peerCount

  // ratings (compareRatings) — over reviews joined on catalogItemId
  myAvgRating   = mean(rating of MY reviews for catalogItemId)
  peerAvgRating = mean(rating of PEER reviews for catalogItemId)
  ratingGap     = myAvgRating - peerAvgRating                          // − = peers beat me
  rank          = my position when all restaurants (me + peers) are sorted by avg rating desc (1 = best)

  return { catalogItemId, itemName, myPrice, peerAvgPrice, priceDeltaPct, pricePercentile,
           myAvgRating, peerAvgRating, ratingGap, rank, peerCount }
```

Returns `null` when `peerCount === 0` (no comparable item elsewhere) — the analysis degrades
gracefully and the UI hides the `PeerComparison` section.

### 5.2 What "successful restaurants doing differently" means mathematically

A peer is **doing better** when it has a **higher avg rating at the same or lower price** for the
same catalog item. In the numbers this is: `ratingGap < 0` (peers out-rate me) *combined with*
`priceDeltaPct >= 0` (I'm priced at or above them). That pairing is the signature of a
**price-to-value gap** — I charge more and satisfy less — which is precisely the finding
`deriveRootCause` synthesizes for `Price` (§8). `rank` and `pricePercentile` let the UI say
"you rank 4th of 5 on this dish while sitting in the 80th price percentile."

---

## 6. Positive-Review Matching

The mirror of problem detection: instead of asking *what's wrong with my item*, it asks *what do
happy customers of the winning peers praise about the same item* — then contrasts.

### 6.1 `findPositiveComparisons(restaurantId, category, catalogItemId, data) → PositiveReviewComparison`

```
findPositiveComparisons(restaurantId, category, catalogItemId, data):
  peerPositives = reviews where catalogItemId matches
                  AND restaurantId != mine
                  AND rating >= 4                                  // 4–5★ peer reviews of the same item
  positiveThemes     = extractPositiveThemes(peerPositives)        // e.g. ["generous portion","hot & fresh","great value"]
  positiveExampleIds = top 2–3 peerPositives by rating then recency

  myNegatives    = my reviews for catalogItemId with rating < 3 that mention `category`
  negativeThemes = negative-lexicon pass over myNegatives          // e.g. ["cold","small portion","overpriced"]

  contrast = `Peers' happy customers praise ${top positiveThemes} on the same dish,
              while yours cite ${top negativeThemes}.`

  return { category, positiveThemes, negativeThemes, positiveExampleIds, contrast }
```

Returns `null` when no 4–5★ peer reviews of the item exist.

### 6.2 `extractPositiveThemes(reviews) → string[]`

Tokenize each comment, match n-grams against a **positive-theme phrase list** in `lexicon.ts`
(e.g. `generous portion`, `hot and fresh`, `great value`, `quick service`, `friendly staff`,
`cooked perfectly`). Count phrase frequency, return the top themes (deduped, ordered by count). It
is a lexicon lookup, not free generation, so the same reviews always yield the same themes — the
Experience.com AI later replaces this with semantic theme clustering behind the identical signature.

---

## 7. Root-Cause Analysis (Beyond Classification)

Classification says *which* category; root cause says **why**, in one owner-readable `statement`,
backed by `Evidence[]` drawn from the review, the peer benchmark, and the positive contrast.
`deriveRootCause` runs a **per-category rule set** and sets a `confidence ∈ [0,1]` that rises with
corroborating evidence (own reviews + peer gap + positive contrast all agreeing → high).

### 7.1 `deriveRootCause(problem, restaurantId, data, peer, positive) → RootCause`

```
deriveRootCause(problem, restaurantId, data, peer, positive):
  evidence = []
  push review evidence: {type:'review', reviewId, label:'Customer says', detail: exampleComment}
  if peer:     push {type:'peer', label:'Peer benchmark', detail: `${priceDeltaPct}% price, ${ratingGap}★ gap`}
  if positive: push {type:'positive-review', label:'Peers praised', detail: positive.contrast}

  statement  = RULES[problem.category](problem, peer, positive)    // §7.2 — synthesizes the "why"
  confidence = base(problem.severity/100)
             + (peer ? 0.15 : 0) + (positive ? 0.15 : 0)           // clamp to [0,1]
  return { id, category: problem.category, statement, evidence, peerContext: peer,
           positiveContext: positive, confidence }
```

Cross-category synthesis: when a review carries **Quality + Quantity + Price** together *and* the
peer shows a positive `priceDeltaPct` with a negative `ratingGap`, the rule collapses the three
symptoms into a single **price-to-value** root cause rather than three unrelated statements. This is
the "beyond classification" step the interface name promises.

### 7.2 Worked examples (per-category rules using peer + positive evidence)

**Price — price-to-value gap.**
> "Your $18 pasta is priced **28% above** the 4-peer average of $14, yet rates **1.6★ below** them.
> Customers aren't rejecting the price in isolation — they reject the *value*: peers deliver more for
> less. Root cause: a price-to-value gap, not an absolute price problem."
> *Evidence:* peer (`priceDeltaPct +28`, `ratingGap −1.6`), positive ("great value" praised on peers), 3 own <3★ reviews.

**WaitingTime — peak understaffing, not kitchen capacity.**
> "Wait complaints cluster in **9 of 12** negative reviews, concentrated at the 12–2pm peak. Peers
> serving the same item turn tickets ~9 min faster at similar volume. Root cause: **peak-window
> understaffing**, not kitchen throughput."
> *Evidence:* 9 review mentions, peer rating gap, positive ("quick service" on peers).

**Quantity — portion weight relative to price.**
> "Portion size is flagged in **7 of 11** negative burger reviews; peers at a comparable price earn
> **4.4★** with visibly larger portions. Root cause: **portion weight is too low for the price
> point** — value perception, not taste."
> *Evidence:* 7 mentions, positive ("generous portion" on peers), peer price parity + rating gap.

**Quality (the requirements pasta example) — Quality + Quantity + Price → price-to-value.**
> Review: *"cold pasta, small portion, not worth $18."* → `classifyReview` returns
> `categories: [Quality, Quantity, Price]`, `sentiment: Negative`, `isNegative: true`.
> `deriveRootCause` sees all three co-occurring plus a peer showing `priceDeltaPct +28`,
> `ratingGap −1.6`, and peer praise of "hot & fresh / generous portion":
> > "Three symptoms — cold food (Quality), small portion (Quantity), and an $18 price (Price) — point
> > to **one** root cause: the dish is **not worth what you charge**. Peers serve it hot and larger
> > for less and out-rate you by 1.6★. Fix the value equation, not just the temperature."

---

## 8. Remedy Generation

### 8.1 `remedyTable.ts` structure

```ts
// remedyTable.ts — pure data, no logic. Record<ProblemCategory, Remedy[]>.
export const remedyTable: Record<ProblemCategory, Remedy[]> = {
  [ProblemCategory.Price]: [ /* tier-1 Remedy, tier-2 Remedy */ ],
  // ... one entry per category ...
};
```

Each category maps to **exactly two** `Remedy` objects — one `tier: 1` (cheapest, fastest,
try-first) and one `tier: 2` (deeper, costlier, the escalation). `remedyService` reads only this
table:

- `getRemedy(category, rootCause)` → the `tier: 1` entry (rootCause may bias which tier-1 variant,
  but the MVP has one tier-1 per category, so it returns `remedyTable[category].find(r => r.tier === 1)`).
- `getNextRemedy(category, excludeRemedyId)` → `remedyTable[category].find(r => r.id !== excludeRemedyId)`
  — i.e. the tier-2 remedy when tier-1 was tried and failed.
- `mapProblemToRemedies(category)` → `remedyTable[category]` (both tiers).

### 8.2 Full remedy table — all 13 categories, tier-1 & tier-2, with `targetMetric`

**Remedies are SPECIFIC and actionable — never "improve service."** `targetMetric` is the
`MetricSnapshot` dimension the remedy is expected to move, and it is the metric the before/after
verdict weighs most for that action.

| Category | Tier | `title` (specific, actionable) | `targetMetric` |
|---|---|---|---|
| **Price** | 1 | Introduce a value meal / review pricing against 3 peers (reprice flagged items within 10% of the 3 closest peers; bundle a combo) | `peerGap` |
| | 2 | Re-engineer the dish to justify the price — add a plated side + upgrade presentation so value matches price | `sentiment` |
| **Quality** | 1 | Hold cooked items ≤6 min, fire-to-order, add a heat-lamp pass-check before serving | `categoryComplaints` |
| | 2 | Switch the flagged ingredient to a higher-grade supplier + run line-cook retraining | `avgRating` |
| **Quantity** | 1 | Increase portion weight 20% on flagged items; update prep sheets & re-spec plating | `categoryComplaints` |
| | 2 | Add a complimentary side (bread/salad) to flagged mains | `sentiment` |
| **Taste** | 1 | Recalibrate seasoning to a standardized spec; run a weekly 5-item taste panel | `categoryComplaints` |
| | 2 | Revise the recipe with a consulting chef; relaunch as a "new & improved" dish | `avgRating` |
| **Service** | 1 | Set a 5-min greet + 12-min food-runner SLA with table-side check-backs | `categoryComplaints` |
| | 2 | Move to section-based server assignment + handheld ordering to cut ticket time | `avgRating` |
| **WaitingTime** | 1 | Reduce prep-to-table time below 15 minutes | `categoryComplaints` |
| | 2 | Add 2 staff during 12–2 & 7–9 peak windows | `avgRating` |
| **Availability** | 1 | Raise par levels on top-3 items 30% + adopt an 86-board process | `categoryComplaints` |
| | 2 | Add a backup supplier + a daily prep forecast tied to reservations | `avgRating` |
| **Staff** | 1 | Run a 2-hour hospitality refresher + a shift-lead floor check every 30 min | `sentiment` |
| | 2 | Revise the hiring scorecard + add a tipped-out service-quality bonus | `avgRating` |
| **Cleanliness** | 1 | Adopt an hourly restroom + table sanitation checklist with sign-off | `categoryComplaints` |
| | 2 | Schedule a nightly deep-clean contractor + monthly third-party hygiene audit | `sentiment` |
| **Menu** | 1 | Add photos, allergen & calorie tags, and flag the top-3 sellers on the menu | `sentiment` |
| | 2 | Redesign the menu — re-org categories and remove the 5 worst-rated items | `avgRating` |
| **Ambience** | 1 | Fix lighting & noise: install dimmers + acoustic panels in the loud zone | `sentiment` |
| | 2 | Refresh décor & seating layout in the flagged section | `avgRating` |
| **Delivery** | 1 | Add insulated bags + a seal-check step; cap the delivery radius to a 20-min drive | `categoryComplaints` |
| | 2 | Switch to a better-rated delivery partner + add live order tracking | `avgRating` |
| **Packaging** | 1 | Switch to leak-proof, vented containers for hot items | `categoryComplaints` |
| | 2 | Redesign packaging with compartment trays + tamper-evident seals | `sentiment` |

Every `Remedy` also carries `id`, `category`, a `description` sentence, a `specificActions: string[]`
checklist (2–4 concrete steps), and an `expectedImpact` string (e.g. "cut Quantity complaints ~70%,
+0.8★ on the item"). `tier` is `1|2` as tabled.

---

## 9. Action-Plan Generation

### 9.1 `createActionFromRemedy(remedy, rootCause, restaurantId, owner, scenarioId, data) → ActionItem`

Maps the chosen `Remedy` (plus its `RootCause`) into a tracked `ActionItem`:

```
createActionFromRemedy(remedy, rootCause, restaurantId, owner, scenarioId, data):
  return {
    id, restaurantId,
    remedyId:    remedy.id,
    rootCauseId: rootCause.id,
    scenarioId,                                   // links this action to its post-action review set
    action:      remedy.title,                    // the specific thing the owner will do
    category:    remedy.category,
    owner,                                         // owner name from User
    priority:    remedy.tier === 1
                   ? (rootCause.confidence >= 0.75 ? Priority.High : Priority.Medium)
                   : Priority.High,                // an escalated tier-2 action is always High
    status:      ActionStatus.NotStarted,
    createdDate: HARDCODED_TODAY,                  // deterministic — no new Date()
    targetDate:  HARDCODED_TODAY + 14 days (hardcoded ISO),
    // beforeSnapshot / afterSnapshot / impactResult filled later by the store's collectNewReviews flow
  }
```

`priority` is derived, not asked. Dates are hardcoded ISO strings (determinism rule).

### 9.2 Status lifecycle (`ActionStatus`, the 6 required statuses)

```
NotStarted ──(owner starts)──▶ InProgress ──(owner clicks "Collect New Reviews")──▶ Monitoring
                                                                                        │
                                                          computeImpact verdict ────────┤
                                                                                        │
   after.reviewCount < MIN_AFTER_REVIEWS ──▶ stays Monitoring ("more feedback needed")  │
   verdict = Improvement Confirmed        ──▶ ImprovementConfirmed  ◀────────────────────┤
   verdict = No Significant Improvement   ──▶ NoSignificantChange   ◀────────────────────┘
                                                     │
                              (owner may mark done)  └──▶ Completed  (terminal manual marker)
```

`advanceStatus(action, newStatus)` performs the transition and returns a new `ActionItem` (pure — no
mutation). `summarizeActionPlan(actions)` returns counts keyed by `ActionStatus` for the plan header.
The two verdict-driven statuses (`ImprovementConfirmed`, `NoSignificantChange`) are set by the store's
`collectNewReviews` after `computeImpact`, keeping the verdict → status mapping in one place.

---

## 10. Improvement Analysis (Before/After)

### 10.1 `captureSnapshot(restaurantId, scenario, phase, data) → MetricSnapshot`

Computes one window's metrics. `phase = Baseline` (ReviewPhase.Baseline) uses
`scenario.baselineReviewIds`; `phase = PostAction` (ReviewPhase.PostAction) uses
`scenario.postActionReviewIds`.

```
captureSnapshot(restaurantId, scenario, phase, data):
  ids     = phase === Baseline ? scenario.baselineReviewIds : scenario.postActionReviewIds
  reviews = resolve ids from data
  return {
    windowLabel:   phase === Baseline ? 'Before' : 'After',
    asOfDate:      max(reviews.date),                             // hardcoded ISO from data
    reviewCount:   reviews.length,
    avgRating:     mean(reviews.rating),
    negativeCount: count(reviews where rating < 3),
    positiveCount: count(reviews where rating >= 4),
    complaintFrequency: perCategoryCount(detectProblems(reviews)),  // Partial<Record<ProblemCategory,number>>
    sentimentScore: aggregateSentiment(reviews),                    // −1..1
    peerGap:       comparePeers(restaurantId, scenario.targetCatalogItemId, data)?.ratingGap ?? 0,
  }
```

### 10.2 `computeImpact(action, data, releasedScenarioIds) → ImpactResult` — delta math & verdicts

```
computeImpact(action, data, releasedScenarioIds):
  scenario = data.scenarios[action.scenarioId]
  before   = captureSnapshot(action.restaurantId, scenario, Baseline,   data)
  after    = captureSnapshot(action.restaurantId, scenario, PostAction, data)
  tgt      = action.category

  deltas = {
    avgRating:                after.avgRating     - before.avgRating,
    negativeCount:            after.negativeCount - before.negativeCount,
    positiveCount:            after.positiveCount - before.positiveCount,
    targetCategoryComplaints: (after.complaintFrequency[tgt] ?? 0) - (before.complaintFrequency[tgt] ?? 0),
    sentiment:                after.sentimentScore - before.sentimentScore,
    peerGap:                  after.peerGap        - before.peerGap,
  }
  complaintDrop = (before.complaintFrequency[tgt] ?? 0) - (after.complaintFrequency[tgt] ?? 0)   // positive = fewer complaints
```

**Verdict rules (evaluated top-down; thresholds from `thresholds.ts`):**

| Order | Condition | Verdict |
|---|---|---|
| 1 | `after.reviewCount < MIN_AFTER_REVIEWS` (=5) | `Monitoring — more feedback needed` |
| 2 | `deltas.avgRating ≥ MIN_AVG_RATING_DELTA` (0.6) **AND** `complaintDrop ≥ MIN_COMPLAINT_DROP` (3) **AND** `deltas.sentiment ≥ MIN_SENTIMENT_DELTA` (0.3) | `Improvement Confirmed` |
| 3 | otherwise | `No Significant Improvement` → set `nextRemedyId = getNextRemedy(tgt, action.remedyId).id` |

`narrative` is templated from the deltas, e.g. *"Average rating rose +1.7★ and Quality complaints
fell 75% across 8 new reviews — improvement confirmed."* Only rule 3 populates `nextRemedyId`.

### 10.3 Reproduce the requirements example

> **Before** avgRating **2.4**, Quality complaints **8**, Quantity complaints **5** →
> **After** avgRating **4.1**, Quality **2**, Quantity **1**.

```
deltas.avgRating       = 4.1 - 2.4 = +1.7      ≥ 0.6  ✓
Quality complaintDrop  = 8 - 2   = 6  (−75%)   ≥ 3    ✓   // −75% displayed by UI
Quantity complaintDrop = 5 - 1   = 4  (−80%)                // corroborating
deltas.sentiment       ≈ +0.9                  ≥ 0.3  ✓   // authored so it clears
after.reviewCount      ≥ 5                             ✓
────────────────────────────────────────────────────────────────
verdict = "Improvement Confirmed"     (nextRemedyId = undefined)
```

The percentages the UI shows (−75%, −80%) are `complaintDrop / before.complaintFrequency[cat]`.

---

## 11. Continuous Improvement Loop (Scenario 6 — failed remedy)

Scenario 6 authors post-action reviews that **barely move**: `deltas.avgRating < 0.6` and/or
`complaintDrop < 3`, so rule 2 fails and rule 1 doesn't apply (`after.reviewCount ≥ 5`). Result:

```
verdict      = "No Significant Improvement"
nextRemedyId = remedyService.getNextRemedy(action.category, action.remedyId).id   // → the TIER-2 remedy
status       = ActionStatus.NoSignificantChange
```

The UI surfaces `nextRemedyId` as a **"Recommend Next Remedy"** call to action. The owner clicks it,
`createActionFromRemedy(tier2Remedy, rootCause, ...)` spins up a **second `ActionItem`** (tier-2,
`Priority.High`), and the pipeline re-enters at step 7 — closing the loop back to *"recommend next
remedy"*. Because the tier-1 remedy id is excluded, `getNextRemedy` deterministically returns the
tier-2 escalation. This demonstrates the *closed loop*: RIA doesn't just measure failure, it
prescribes the next move.

---

## 12. Complexity Argument (README scoring hook)

RIA's analysis layer is a genuinely hard problem, not a CRUD app dressed as one. It chains
**seven distinct reasoning stages**, each depending on the last: multi-label problem classification
over noisy free text (one review, several problems); sentiment scoring that both labels and
quantifies dissatisfaction on a bounded scale; a **cross-restaurant join** on a shared catalog item
to compute price/rating percentiles and rank — the difference between "you're expensive" and "you're
expensive *and* worse than the people charging less"; **contrastive positive-review mining** that
extracts what winning peers do differently; per-category **root-cause synthesis** that collapses
co-occurring symptoms (cold + small + $18) into one causal statement with graded confidence and
attached evidence; tiered, specific remedy selection; and finally a **threshold-gated causal
before/after inference** with a monitoring fallback and an automatic next-remedy escalation loop.
Doing this *deterministically* — reproducible scores every run, no backend, the same typed interface
whether the body is a heuristic today or Experience.com's XMP AI tomorrow — is where the real
engineering lives: it is evidence-based, multi-stage review intelligence, exactly the "close the loop
on negative feedback" capability Experience.com sells to multi-location brands.
