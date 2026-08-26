# Review Impact Analysis (RIA) — UX / UI Plan

> **Owner:** UX/UI Agent · **Consumes:** product-plan.md · **Feeds:** frontend-plan.md

RIA is an **Experience.com / XMP (Experience Management Platform) review-intelligence
capability**, demoed on the restaurant vertical — the "close the loop on negative
feedback" workflow that multi-location brands use to turn reputation signals into
CX action and then _prove_ the action worked. This document is the UX/UI contract for
the MVP: the information architecture, the six pages, the twenty-something named
components in play on each, the interaction flows, every empty/loading/error state, the
visual language (Ant Design v4 + styled-components), and the exact screen we capture for
`demo/`.

Everything here uses the **fixed** routes, component names, enum values, and terminology
from the shared authoritative context. Nothing is renamed. Where a detail was not
specified, it is called out inline as an **[Assumption]**.

---

## 0. How to read this doc

- **Pages** are the 6 route-level containers (`LoginPage`, `DashboardPage`, `ReviewsPage`,
  `AnalysisPage`, `ActionPlanPage`, `ImpactPage`).
- **Components** are the named building blocks under `src/components/{layout,dashboard,
  reviews,analysis,action,impact}/`. Peer comparison, root cause, and remedy are
  **sections _within_ `/analysis/:reviewId`**, rendered by the `PeerComparison`,
  `RootCauseCard`, and `RemedyCard` components — they are **not** separate routes.
- Data reaches every page through the store selector **`useVisibleReviews()`**
  (= `getVisibleReviews(activeRestaurantId, releasedScenarioIds, seed)`), so review gating
  (baseline-only vs. baseline + post-action) is uniform across the app. The UI never
  filters reviews itself.
- All numbers are **deterministic** (seeded PRNG + hardcoded dates + authored `tags`).
  The UI must render whatever the pure services return and must **never** call
  `Math.random()`, `Date.now()`, or `new Date()`.

---

## 1. Information architecture & navigation

### 1.1 The authed shell — `AppLayout`

Every route except `/login` renders inside `AppLayout`, a persistent chrome built on
AntD v4 `Layout`. `ProtectedRoute` guards it: when `currentUserId` is `null` it redirects
to `/login`; otherwise it renders `AppLayout` with the matched page in the `Outlet`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header  [☰]  Review Impact Analysis        Restaurant: [Bella Trattoria ▾] │  ← Header
│              (Experience.com · XMP)         Owner: A. Rossi   [Reset Demo]  │
├───────────────┬────────────────────────────────────────────────────────── ┤
│ Sidebar       │                                                            │
│ ● Dashboard   │                                                            │
│ ○ Reviews     │                  <Outlet />  — the active Page            │
│ ○ Analysis    │                  (Dashboard / Reviews / Analysis /        │
│ ○ Action Plan │                   Action Plan / Impact)                    │
│ ○ Impact      │                                                            │
│               │                                                            │
│ (collapsible) │                                                            │
└───────────────┴────────────────────────────────────────────────────────── ┘
   Sidebar          Content (AntD Layout.Content, max-width ~1200px, centered)
```

- `AppLayout` is a **container** component: it reads `currentUserId`, `activeRestaurantId`,
  and the current user's restaurants from the store to hydrate the Header, and renders
  `<Sidebar/>`, `<Header/>`, and `<Outlet/>`.
- Content region uses a comfortable max width (~1200px) with responsive gutters so charts
  and tables never sprawl on wide monitors.

### 1.2 `Sidebar` — primary navigation

AntD `Layout.Sider` + `Menu` (mode `inline`, collapsible). One menu item per primary
route. The active item is derived from `useLocation().pathname` so deep links highlight
correctly. **Analysis** is included as a nav entry even though it is normally reached by
drilling into a specific review — see the note below.

| Order | Label        | Icon (@ant-design/icons v4) | Route             | Notes |
|------:|--------------|------------------------------|-------------------|-------|
| 1 | Dashboard    | `DashboardOutlined`          | `/dashboard`      | Default landing after login |
| 2 | Reviews      | `MessageOutlined`            | `/reviews`        | The raw voice-of-customer feed |
| 3 | Analysis     | `ExperimentOutlined`         | `/analysis/:reviewId` | Deep-dive; nav item routes to the **top-priority negative review** (`/analysis/<worst review id>`) so the item is never a dead link **[Assumption]** |
| 4 | Action Plan  | `CheckSquareOutlined`        | `/action-plan`    | Badge = count of open actions |
| 5 | Impact       | `RiseOutlined`               | `/impact`         | The proof screen |

- **Analysis nav target [Assumption]:** since the route is parameterized, the Sidebar's
  "Analysis" item links to `analysis/${topNegativeReviewId}` computed from the visible
  reviews (highest-severity problem's example review). If there are no negative reviews it
  is disabled with a tooltip ("No negative reviews to analyze").
- **Action Plan badge:** AntD `Badge` on the menu label showing the number of `ActionItem`s
  not in a terminal state (`Improvement Confirmed` / `No Significant Change`).

### 1.3 `Header` — active restaurant context + Reset Demo

AntD `Layout.Header`, flex row, three zones:

| Zone | Contents | Behaviour |
|------|----------|-----------|
| Left | Sider collapse toggle + product wordmark "Review Impact Analysis" with an "Experience.com · XMP" eyebrow | Reinforces the platform framing (product_knowledge) |
| Center/Right | **Active Restaurant switcher** — AntD `Select` bound to `activeRestaurantId`, options = current user's `restaurantIds` → `Restaurant.name` | On change → `setActiveRestaurant(id)`; all pages re-derive via `useVisibleReviews()`. Owner + location shown as sub-text |
| Far right | **Reset Demo** control — AntD `Button` (`ReloadOutlined`, `danger` ghost) | Opens a `Modal.confirm` → `resetDemo()` → clears `actionItems`/`releasedScenarioIds`, bumps `demoVersion`, returns to a pristine baseline. Always visible in the authed shell |

- The restaurant switcher is the app's single "tenant" control. For the 10-owner / 10-
  restaurant model each owner typically owns one restaurant, so the switcher usually shows
  one option — but it is always rendered so the multi-location XMP story reads clearly and
  so a judge can hop between demo scenarios' restaurants. **[Assumption]**
- **Reset Demo is non-negotiable UX:** it is the safety net for localStorage staleness
  (Top Risk #5) and lets a presenter re-run the closed loop live. It must be reachable
  from every authed screen.

---

## 2. Component roster (named components → where they live)

The full component inventory from the shared context, grouped by folder, with the page(s)
that mount each. Containers read the store/services; presentational components take props
only and stay pure.

| Folder | Component | Kind | Rendered by |
|--------|-----------|------|-------------|
| layout | **AppLayout** | container | shell for all authed routes |
| layout | **Sidebar** | presentational | AppLayout |
| layout | **Header** | presentational | AppLayout |
| dashboard | **WakeUpCall** | presentational | DashboardPage |
| dashboard | **RatingSummary** | presentational | DashboardPage |
| dashboard | **RatingTrend** | presentational | DashboardPage |
| dashboard | **ProblemAreas** | presentational | DashboardPage |
| dashboard | **MetricCard** | presentational | DashboardPage (row), ImpactPage (reuse) |
| reviews | **ReviewCard** | presentational | ReviewsPage (compact list / mobile), AnalysisPage (header) |
| reviews | **ReviewTable** | presentational | ReviewsPage |
| analysis | **ReviewAnalysis** | container | AnalysisPage (orchestrates the story) |
| analysis | **EvidenceCard** | presentational | ReviewAnalysis |
| analysis | **PeerComparison** | presentational | ReviewAnalysis |
| analysis | **PositiveReviewComparison** | presentational | ReviewAnalysis |
| analysis | **RootCauseCard** | presentational | ReviewAnalysis |
| analysis | **RemedyCard** | presentational | ReviewAnalysis |
| action | **ActionPlan** | container | ActionPlanPage |
| action | **ActionItem** | presentational | ActionPlan (list row) |
| impact | **ImprovementSummary** | presentational | ImpactPage |
| impact | **BeforeAfterComparison** | presentational | ImpactPage |
| impact | **ImpactTimeline** | presentational | ImpactPage |
| impact | **ImpactMetric** | presentational | ImpactPage (row) |
| impact | **ImprovementStatus** | presentational | ImpactPage |

Container set (per shared context): `AppLayout`, all 6 Pages, `ReviewAnalysis`, `ActionPlan`.
Everything else is presentational and receives fully-computed props (a `ReviewAnalysis`
result, an `ImpactResult`, a `MetricSnapshot`, etc.) — **no service calls in leaf
components**.

---

## 3. The narrative arc

RIA is a **story**, and the layout order on and across pages is the storytelling device.
The arc runs **"Something is wrong → why → how you compare → what winners do → what to do
→ do it → did it work?"** — which is exactly the 7 owner questions and the closed loop.

| # | Page / route | Owner question answered | Narrative beat | Owner's feeling |
|--:|--------------|-------------------------|----------------|-----------------|
| 1 | `/dashboard` | Q1 What are customers unhappy about? | **Something is wrong.** The `WakeUpCall` names the pain first. | Alarm → focus |
| 2 | `/reviews` | Q1 (evidence) | **Here's the raw voice.** Real negative reviews, filterable. | "It's real." |
| 3 | `/analysis/:reviewId` | Q2 Why? / Q3 How do I compare? / Q4 What do winners do? / Q5 What remedy? | **Understand it end-to-end.** One page walks evidence → peer gap → what positive reviews praise → root cause → a specific remedy. | Clarity → resolve |
| 4 | `/action-plan` | Q6 What action should I perform? | **Commit to the fix.** The remedy becomes a tracked `ActionItem`. | Ownership |
| 5 | `/impact` | Q7 Did the action improve feedback? | **Prove it.** Before vs. after, a verdict, and — if it failed — the next remedy. | Vindication _or_ honest "try again" |

The page sequence in the Sidebar is intentionally the arc order (Dashboard → Reviews →
Analysis → Action Plan → Impact). **Within** the Analysis page, the vertical stack is also
the arc in miniature (evidence → comparison → contrast → cause → cure). The Impact page is
the payoff and is the screen we capture for `demo/` (see §9).

---

## 4. Page-by-page UX spec

For each page: **purpose**, an **ASCII wireframe**, the **component order table** (which of
the named components appear and in what sequence), **key interactions**, **narrative role**,
and per-page **states** (states are also consolidated in §6).

---

### 4.1 `/login` — `LoginPage`

**Purpose.** Establish "who am I" (which owner / restaurant context) with zero friction.
This is a demo login: email-only, no password (see safety note). It sets `currentUserId`
and a default `activeRestaurantId`.

**Layout.** A single centered `Card` on a branded, full-height background. No `AppLayout`
(this route is outside the authed shell).

```
                ┌─────────────────────────────────────────┐
                │        Experience.com · XMP               │
                │     Review Impact Analysis                │
                │   Close the loop on negative feedback     │
                │                                           │
                │   Owner email                             │
                │   [ a.rossi@bellatrattoria.com        ]   │
                │                                           │
                │   [  Sign in  ]                           │
                │                                           │
                │   Demo owners:  ● Rossi  ● Chen  ● ...     │  ← quick-pick chips
                └─────────────────────────────────────────┘
```

**Components.** No dashboard/analysis components; this is a standalone AntD `Card` + `Form`
+ `Input` + `Button`. Optional quick-pick `Tag`/`Button` chips list the seeded demo owner
emails so a presenter never mistypes.

**Key interactions.**
- Submit → `login(email)` (store action, returns `boolean`). On `true`, navigate to
  `/dashboard`. On `false`, inline `Form.Item` error "No owner found for that email."
- Quick-pick chip → fills the email field (and can auto-submit) — a **presenter
  affordance** so the live demo starts instantly. **[Assumption]**

**Narrative role.** Curtain-up. Keep it fast; the story starts on the Dashboard.

**States.** _Loading:_ button `loading` while `login` resolves (synchronous in practice).
_Error:_ unknown email → field-level validation message. _Already authed:_ if
`currentUserId` is set, `ProtectedRoute`'s inverse behavior redirects `/login` → `/dashboard`.

> **Safety / scope note:** login is a **mock identity switch over seeded owners**, not real
> authentication — no passwords are entered or stored. This is deliberate for the demo and
> keeps us clear of credential handling.

---

### 4.2 `/dashboard` — `DashboardPage`

**Purpose.** Answer Q1 — _what are customers unhappy about?_ — and hit the owner in the
face with it. This is the "something is wrong" beat.

**Mandated component order:** `WakeUpCall` → `RatingSummary` → `RatingTrend` →
`ProblemAreas` → `MetricCard` row.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  WakeUpCall   ⚠  "3 in 5 recent reviews call out slow service and cold food" │
│               Avg rating 2.4 ★ · 12 negative reviews this period  [Analyze →]│
├───────────────────────────────┬──────────────────────────────────────────── ┤
│  RatingSummary                 │  RatingTrend                                 │
│  ▁▂▅▇█  (1–5★ distribution     │   ╲___                                       │
│   BarChart)                    │       ╲__  avg rating over time (LineChart)  │
├───────────────────────────────┴──────────────────────────────────────────── ┤
│  ProblemAreas  (horizontal BarChart — complaint frequency by category, top-N)│
│   Service   ██████████ 11                                                     │
│   Quality   ███████ 8                                                         │
│   WaitingTime █████ 5 ...                            (click a bar → Analysis) │
├────────────┬────────────┬────────────┬─────────────────────────────────────  ┤
│ MetricCard │ MetricCard │ MetricCard │ MetricCard   ← the MetricCard row      │
│ Avg Rating │ Neg. reviews│ Top problem│ Peer rank                            │
│  2.4 ★     │  12         │ Service    │  8 / 10                               │
└────────────┴────────────┴────────────┴────────────────────────────────────── ┘
```

**Component order & data.**

| Order | Component | Shows | Data source |
|------:|-----------|-------|-------------|
| 1 | **WakeUpCall** | One-sentence headline naming the dominant problem + a punchy stat, with a primary CTA into Analysis | `computeProblemAreas` (top problem) + `computeRatingSummary` |
| 2 | **RatingSummary** | 1–5★ distribution BarChart + headline avg | `computeRatingSummary(reviews)` |
| 3 | **RatingTrend** | Avg rating over time LineChart | `computeRatingTrend(reviews, bucket)` |
| 4 | **ProblemAreas** | Horizontal BarChart, complaint frequency by `ProblemCategory`, top-N | `computeProblemAreas(restaurantId, data, visibleReviews)` |
| 5 | **MetricCard × N** | KPI row: Avg Rating, Negative reviews, Top problem, Peer rank | derived from the summaries above + `comparePeers` for rank |

**Key interactions.**
- `WakeUpCall` CTA → `/analysis/<topNegativeReviewId>`.
- `ProblemAreas` bar click → `/analysis/<exampleReviewId for that category>` (deep-links the
  story straight to the tapped problem). **[Assumption: bar click deep-link]**
- Restaurant switch in Header re-renders every widget from `useVisibleReviews()`.

**Narrative role.** The hook. `WakeUpCall` intentionally leads so the owner feels the
problem before seeing numbers; the KPI row anchors it in metrics.

**States.**
- _Loading:_ AntD `Skeleton`/`Spin` per Card (services are synchronous, but the pattern is
  in place for consistency).
- _Empty — no negative reviews:_ `WakeUpCall` flips to a positive `Result`
  ("No pressing problems — ratings are healthy this period"), `ProblemAreas` renders AntD
  `Empty`. Charts still show whatever positive data exists.
- _Error:_ if a service throws, the affected Card shows an AntD `Alert type="error"` with a
  retry that re-selects the restaurant; the rest of the dashboard still renders.

---

### 4.3 `/reviews` — `ReviewsPage`

**Purpose.** Q1 evidence. Make the negative feedback tangible and browsable, and give the
owner a launch point into deep analysis of any review.

**Layout.** Filter bar → `ReviewTable` (primary), with `ReviewCard` used for the compact /
mobile rendering and for the highlighted "worst review" callout.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Filters:  Rating [<3 ▾]  Category [Service ▾]  Phase [Baseline ▾]  Item [▾]  │
├────────────────────────────────────────────────────────────────────────────┤
│ ReviewTable                                                                  │
│ ┌──────┬──────────────────────────────┬──────────┬─────────┬────────┬─────┐ │
│ │ Rate │ Comment (truncated)          │ Item     │ Category│ Date   │  →  │ │
│ ├──────┼──────────────────────────────┼──────────┼─────────┼────────┼─────┤ │
│ │ ★☆☆☆☆│ "Waited 40 min, food cold"   │ Carbonara│ Service │ 06-14  │ Ana │ │
│ │ ★★☆☆☆│ "Portion tiny for the price" │ Risotto  │ Quantity│ 06-11  │ Ana │ │
│ └──────┴──────────────────────────────┴──────────┴─────────┴────────┴─────┘ │
│  Rows show a Rate ★, sentiment Tag, and category Tag(s).                     │
└────────────────────────────────────────────────────────────────────────────┘
```

**Component order & data.**

| Order | Component | Role |
|------:|-----------|------|
| 1 | Filter bar (AntD `Select`/`Segmented`) | Filter by rating (default **below 3** to match the business rule), `ProblemCategory`, `ReviewPhase`, catalog item |
| 2 | **ReviewTable** | AntD `Table`: rating (`Rate`), truncated comment, item name, category `Tag`(s), sentiment `Tag`, date; row action "Analyze →" |
| 3 | **ReviewCard** | Compact card rendering for narrow screens; also renders the single "most severe" review as a highlighted callout above the table **[Assumption]** |

**Key interactions.**
- Row / card "Analyze →" → `/analysis/:reviewId`. Row click anywhere also navigates.
- Filters are client-side over `useVisibleReviews()` output — they do **not** re-run
  services; they narrow what the table displays. Default filter = rating **below 3** to
  reflect the "analyze reviews rated below 3" business rule (owner can widen it).
- Sentiment/category `Tag`s use the status color map (§7).

**Narrative role.** Proof that the Dashboard's alarm is grounded in real customer words.

**States.**
- _Loading:_ `Table` `loading` prop.
- _Empty (filters too narrow):_ `Table` `locale.emptyText` → AntD `Empty`
  ("No reviews match these filters").
- _Empty (no negative reviews at all):_ callout `Result` ("No negative reviews for this
  restaurant") and the default filter widens to all ratings.

---

### 4.4 `/analysis/:reviewId` — `AnalysisPage` (single-page story)

**Purpose.** The heart of RIA. One scrollable page answers Q2–Q5 for a single review:
_why_ it happened, _how you compare_ to peers, _what winning restaurants do differently_,
the _root cause_, and a _specific remedy_ you can act on. Peer comparison, root cause, and
remedy are **sections on this page**, not routes.

**Orchestration.** `AnalysisPage` (route container) reads `:reviewId`, calls
`analyzeReview(reviewId, data, visibleReviews)` (the orchestrator), and passes the single
`ReviewAnalysis` result to the **`ReviewAnalysis`** container component, which lays out the
story by feeding slices of that result to presentational children.

**Mandated section order:** `EvidenceCard`(s) → `PeerComparison` →
`PositiveReviewComparison` → `RootCauseCard` → `RemedyCard` (with **"Add to Action Plan"**
CTA).

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ReviewCard (context header): ★☆☆☆☆ "Waited 40 min and the food was cold"     │
│  Carbonara · Service · Negative · 2025-06-14                                 │
├────────────────────────────────────────────────────────────────────────────┤
│ ▸ EvidenceCard(s)   The signals behind this problem                          │
│    • review   "…food was cold"           (reviewId link)                     │
│    • metric   Service complaints in 11 of 20 reviews                         │
│    • peer     Your Carbonara rated 2.4 vs peers 4.1                          │
├────────────────────────────────────────────────────────────────────────────┤
│ ▸ PeerComparison    How you compare on this item (grouped BarChart)          │
│    My price $18 vs peer avg $16  (+12%, 80th pct)                            │
│    My rating 2.4 vs peer avg 4.1  · rank 8/10                                │
├────────────────────────────────────────────────────────────────────────────┤
│ ▸ PositiveReviewComparison  What winning restaurants get praised for         │
│    Positive themes: "fast", "hot", "attentive"                               │
│    vs your negative themes: "slow", "cold"          (optional RadarChart)    │
├────────────────────────────────────────────────────────────────────────────┤
│ ▸ RootCauseCard     Why this is happening (beyond classification)            │
│    "Kitchen-to-table handoff during 7–9pm peak exceeds 20 min…"  conf 0.82   │
├────────────────────────────────────────────────────────────────────────────┤
│ ▸ RemedyCard        Recommended remedy                        [Tier 1]       │
│    "Reduce prep-to-table time below 15 minutes"                              │
│    • specific action 1  • specific action 2                                  │
│    Expected impact: +0.8 avg rating on Service                               │
│                                            [  + Add to Action Plan  ]        │
└────────────────────────────────────────────────────────────────────────────┘
```

**Component order & data (all slices of one `ReviewAnalysis`).**

| Order | Component | Consumes | Answers |
|------:|-----------|----------|---------|
| 0 | **ReviewCard** (context header) | `analysis.review` | Grounds the story in the specific review |
| 1 | **EvidenceCard** (1..n) | `analysis.rootCause.evidence: Evidence[]` (types `review`/`peer`/`positive-review`/`metric`) | Q2 (the observable signals) |
| 2 | **PeerComparison** | `analysis.peer: PeerComparisonResult \| null` | Q3 How do I compare? |
| 3 | **PositiveReviewComparison** | `analysis.positive: PositiveReviewComparison \| null` | Q4 What do winners do differently? |
| 4 | **RootCauseCard** | `analysis.rootCause: RootCause` (statement + confidence) | Q2 Why? (synthesized) |
| 5 | **RemedyCard** | `analysis.remedy: Remedy` (title, `specificActions`, `expectedImpact`, `tier`, `targetMetric`) | Q5 What remedy? + the CTA |

**Key interactions.**
- **"Add to Action Plan"** (`RemedyCard` primary `Button`) → store `createAction({remedy,
  rootCause, scenarioId})` → `createActionFromRemedy(...)` produces an `ActionItem`
  (status `Not Started`). Show a success `message`/`notification` and offer "View Action
  Plan" → `/action-plan`. If an action already exists for this remedy, the CTA reads
  "Added ✓" (disabled) to prevent duplicates. **[Assumption: dedupe on remedyId]**
- `scenarioId` for `createAction` comes from the review's `scenarioId` (the analysis is
  scenario-anchored), linking the action to its post-action review set.
- `EvidenceCard` items of type `review` link to that review; `peer`/`positive-review` items
  scroll to the corresponding section on the page.
- `RemedyCard` `tier` badge (`Tier 1` vs `Tier 2`) makes the continuous-improvement loop
  legible when a second remedy is surfaced later.

**Narrative role.** The whole arc in one page: evidence → comparison → contrast → cause →
cure. The reader should finish it wanting to click **Add to Action Plan**.

**States.**
- _Loading:_ section-level `Skeleton`s in the arc order.
- _No peer data:_ `PeerComparison` shows `Empty` ("No comparable peer offerings for this
  item") and the layout closes the gap — the story still flows.
- _No positive comparison:_ `PositiveReviewComparison` shows a muted note
  ("No standout positive reviews in this category yet").
- _Invalid / missing `:reviewId`:_ AntD `Result status="404"` ("Review not found") with a
  button back to `/reviews`.
- _Non-negative review analyzed:_ header banner "This review isn't flagged negative —
  showing available context." (We still render whatever the orchestrator returns.)

---

### 4.5 `/action-plan` — `ActionPlanPage`

**Purpose.** Q6 — _what action should I perform?_ — and the operational home for tracking
those actions through their lifecycle, including the pivotal **"Collect New Reviews"**
trigger that opens the loop to measurement.

**Orchestration.** `ActionPlanPage` mounts the **`ActionPlan`** container, which reads
`actionItems` from the store and `summarizeActionPlan(actions)` for the header rollup, then
renders one **`ActionItem`** per action.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ActionPlan  ·  4 actions · 2 in progress · 1 confirmed · 1 monitoring        │
│  Steps overview: Not Started → In Progress → Completed → Monitoring →         │
│                  Improvement Confirmed / No Significant Change                │
├────────────────────────────────────────────────────────────────────────────┤
│ ActionItem                                                                    │
│  Reduce prep-to-table time below 15 min      Service · High · Owner: A.Rossi │
│  Status: [ In Progress ▾ ]   created 06-15 · target 06-29                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ [ Mark Completed ]      [  ⤓ Collect New Reviews  ]  →  see Impact       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│ ActionItem  … (Improvement Confirmed — green)  [ View Impact → ]             │
│ ActionItem  … (Not Started — grey)             [ Start ]                     │
└────────────────────────────────────────────────────────────────────────────┘
```

**Component order & data.**

| Order | Component | Role | Data |
|------:|-----------|------|------|
| 1 | **ActionPlan** | Header rollup + AntD `Steps` legend of the lifecycle; owns the list | `summarizeActionPlan(actions)` |
| 2 | **ActionItem** (list) | One row per `ActionItem`: action text, `category` Tag, `Priority` Tag, owner, dates, **status control**, and contextual buttons | `store.actionItems` |

**Key interactions (status controls).**
- **Status `Select`** on each `ActionItem` → `updateActionStatus(actionId, status)` →
  `advanceStatus(action, newStatus)`. The dropdown offers only forward-valid transitions
  (see §5.3).
- **"Collect New Reviews"** button (enabled once status is `Completed`, or from
  `In Progress` as a presenter shortcut) → `collectNewReviews(actionId)`. This is the
  before/after crux: the store releases the action's scenario
  (`releasedScenarioIds += scenarioId`), runs `computeImpact`, writes back
  `afterSnapshot` + `impactResult` + the resulting status, then we route to `/impact`
  (or reveal the Impact section inline and offer "View Impact →"). **[Assumption: auto-nav
  to /impact after collect]**
- The button label carries a tooltip explaining it "releases the post-action review window
  and measures the result" so the mechanism reads clearly on stage.

**Narrative role.** Commitment. The remedy stops being advice and becomes a tracked,
owned action — then the owner pulls the lever that will judge it.

**States.**
- _Empty — no actions yet:_ AntD `Empty` with copy "No actions yet — analyze a review and
  add its remedy here," plus a primary button to `/dashboard` (or the top negative review's
  Analysis). This is the expected first-run state.
- _Loading:_ list `Skeleton`.
- _After Collect, before enough data:_ if the after-window is too small
  (`< MIN_AFTER_REVIEWS`), status becomes **`Monitoring`** and the row shows a gold
  "Monitoring — more feedback needed" note instead of a verdict (mirrors the Impact page).

---

### 4.6 `/impact` — `ImpactPage`

**Purpose.** Q7 — _did the action actually improve feedback?_ — the proof screen and the
close of the loop. This is the **scoring-critical demo capture** (§9).

**Mandated component order:** `ImprovementSummary` → `BeforeAfterComparison` →
`ImpactTimeline` → `ImpactMetric` row → `ImprovementStatus` (and, **on a failed remedy**,
the **tier-2 `RemedyCard`**).

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ImprovementSummary   ✅  "Improvement Confirmed"                              │
│   Reducing prep-to-table time lifted Service. Avg rating 2.4 → 4.5 (+2.1),   │
│   complaints 8 → 1 (−7), sentiment +0.8.            (narrative from result)  │
├────────────────────────────────────────────────────────────────────────────┤
│ BeforeAfterComparison  (grouped BarChart — Before vs After)                  │
│   avgRating │ negativeCount │ positiveCount │ target-category complaints      │
│    ▇  █     │   █  ▁         │   ▁  █         │    █  ▁                        │
├────────────────────────────────────────────────────────────────────────────┤
│ ImpactTimeline  (LineChart, ReferenceLine at actionDate)                     │
│     ___                     ⎪  action taken                                  │
│    ╱   ╲___             ___╱⎪___╱▔▔▔                                          │
│        baseline window  ⎪   post-action window                               │
├────────────┬────────────┬────────────┬─────────────────────────────────────  ┤
│ ImpactMetric│ImpactMetric│ImpactMetric│ ImpactMetric   ← the metric row       │
│ Avg +2.1 ★ │ Neg −7     │ Pos +6     │ Peer gap −1.7                         │
├────────────┴────────────┴────────────┴─────────────────────────────────────  ┤
│ ImprovementStatus   Status: Improvement Confirmed   (green Result/Badge)     │
│   — OR on failure —                                                          │
│ ImprovementStatus   No Significant Change  +  RemedyCard [Tier 2] "Add 2     │
│                     staff during 12–2 & 7–9 peak windows"  [+ Add to Plan]   │
└────────────────────────────────────────────────────────────────────────────┘
```

**Component order & data (all from one `ImpactResult`).**

| Order | Component | Consumes | Role |
|------:|-----------|----------|------|
| 1 | **ImprovementSummary** | `impactResult.verdict` + `impactResult.narrative` | Headline verdict in plain language |
| 2 | **BeforeAfterComparison** | `impactResult.before` / `impactResult.after` (`MetricSnapshot`) | Grouped BarChart: avgRating, negativeCount, positiveCount, target-category complaints |
| 3 | **ImpactTimeline** | visible reviews across phases + `scenario.actionDate` | LineChart of avg rating over time with a `ReferenceLine` at `actionDate` |
| 4 | **ImpactMetric × N** | `impactResult.deltas` | KPI deltas row (avgRating, negativeCount, positiveCount, sentiment, peerGap, target-category complaints) |
| 5 | **ImprovementStatus** | `impactResult.verdict` | Final status chip/Result |
| 6* | **RemedyCard** (Tier 2) | `remedyService.getNextRemedy(category, excludeRemedyId)` via `impactResult.nextRemedyId` | **Only when verdict is "No Significant Improvement"** — closes the loop back to Action Plan |

**Which action is shown.** The page shows the most recently measured action (has
`impactResult`). **[Assumption]** If several are measured, a small `Select` at the top
switches between them; if none is measured yet, see empty state below.

**Key interactions.**
- On a **failed** remedy, the tier-2 `RemedyCard`'s **"Add to Action Plan"** creates a new
  `ActionItem` (`createAction`) — this is the **continuous-improvement loop** ("recommend
  next remedy"). Route/notify to `/action-plan`.
- Deltas render with direction + color (improvement green, regression red) per §7.

**Narrative role.** The payoff. Before/after side-by-side + a timeline with the action
marked is the single most persuasive artifact in the app — it visually proves the loop
closed. On failure it stays honest and immediately offers the next move, demonstrating the
loop is a _cycle_, not a one-shot.

**States.**
- _Empty — nothing collected yet:_ AntD `Result` ("No impact measured yet — collect new
  reviews on an action to see before/after") with a button to `/action-plan`.
- _Monitoring — after-window too small:_ `ImprovementSummary`/`ImprovementStatus` show the
  gold **"Monitoring — more feedback needed"** state; `BeforeAfterComparison` renders the
  "before" bars and a placeholder for "after" with a note that thresholds
  (`MIN_AFTER_REVIEWS`) aren't met. No verdict claimed.
- _Loading:_ section `Skeleton`s in order.

---

## 5. Key interaction flows

### 5.1 "Add to Action Plan" (review → action)

```
Analysis page (RemedyCard)
  └─[click "Add to Action Plan"]─▶ store.createAction({ remedy, rootCause, scenarioId })
        └─ actionPlanService.createActionFromRemedy(remedy, rootCause,
             restaurantId, owner, scenarioId, data)  →  ActionItem{ status: 'Not Started' }
        └─ push into store.actionItems (persisted)
  ◀─ toast "Added to Action Plan"  +  [View Action Plan →]
```

- Idempotency: if an `ActionItem` already exists for this `remedyId`, the button shows
  "Added ✓" (disabled). **[Assumption]**
- `owner` defaults to the active user's `name`; `priority` comes from the remedy/root-cause
  mapping (the UI just displays it).

### 5.2 "Collect New Reviews" (action → impact verdict)

This is the no-backend before/after mechanism made visible.

```
Action Plan (ActionItem, status Completed/In Progress)
  └─[click "Collect New Reviews"]─▶ store.collectNewReviews(actionId)
        1. releasedScenarioIds += action.scenarioId          (persisted boolean release)
        2. getVisibleReviews(...) now includes post-action reviews for that scenario
        3. impactAnalysisService.computeImpact(action, data, releasedScenarioIds) → ImpactResult
        4. write back action.afterSnapshot, action.impactResult, and status:
             • after-window < MIN_AFTER_REVIEWS      → status 'Monitoring'
             • verdict 'Improvement Confirmed'        → status 'Improvement Confirmed'
             • verdict 'No Significant Improvement'    → status 'No Significant Change'
                 (impactResult.nextRemedyId = getNextRemedy(category, excludeRemedyId))
  ◀─ navigate to /impact  (or reveal Impact inline)  → shows before/after + verdict
```

- The trigger is deliberately a single, obvious button. The tooltip explains it "releases
  the post-action review window" so nobody thinks it's calling a live API.
- Because the data is authored deterministically, **Scenario 5** clears the thresholds
  (Improvement Confirmed) and **Scenario 6** does not (No Significant Improvement → tier-2
  remedy). The UI presents whichever verdict the service returns; it never decides.

### 5.3 Status transitions across the 6 `ActionStatus` values

```
              createAction
                   │
                   ▼
            ┌──────────────┐   Start    ┌──────────────┐   Mark done  ┌──────────────┐
            │  Not Started │──────────▶ │  In Progress │────────────▶ │  Completed   │
            │  (grey)      │            │  (blue)      │              │  (cyan)      │
            └──────────────┘            └──────┬───────┘              └──────┬───────┘
                                               │  Collect New Reviews        │  Collect New Reviews
                                               ▼  (shortcut)                 ▼
                                        ┌───────────────────────────────────────────┐
                                        │            collectNewReviews / computeImpact │
                                        └───────────────┬─────────────────────────────┘
                        after-window too small          │            verdict
                         (< MIN_AFTER_REVIEWS)           │
                                   ▼                     ├────────────▶ Improvement Confirmed  (green, terminal)
                            ┌──────────────┐             │
                            │  Monitoring  │             └────────────▶ No Significant Change  (red, terminal
                            │  (gold)      │                            → offers tier-2 RemedyCard → new action)
                            └──────┬───────┘
                                   │ more reviews collected / re-measured
                                   └────────────────────────────────────────▶ (re-enters computeImpact)
```

| From | Trigger | To | Where |
|------|---------|----|-------|
| — | `createAction` | **Not Started** | Analysis → Add to Action Plan |
| Not Started | Start | **In Progress** | ActionItem status control |
| In Progress | Mark Completed | **Completed** | ActionItem status control |
| Completed / In Progress | Collect New Reviews (window < min) | **Monitoring** | ActionItem / Impact |
| Completed / In Progress | Collect New Reviews (thresholds met) | **Improvement Confirmed** | Impact verdict |
| Completed / In Progress | Collect New Reviews (thresholds not met) | **No Significant Change** | Impact verdict + tier-2 remedy |
| Monitoring | Re-collect with more data | Improvement Confirmed / No Significant Change | Impact |

- The status `Select` only offers **legal forward transitions** from the current state;
  terminal states (`Improvement Confirmed`, `No Significant Change`) are read-only chips.
- Manual set of `Monitoring`/`Improvement Confirmed`/`No Significant Change` is **not**
  offered in the dropdown — those are produced by measurement, keeping the verdict
  trustworthy. **[Assumption]**

---

## 6. Empty / loading / error states (consolidated)

| Page | Loading | Empty | Error / edge |
|------|---------|-------|--------------|
| `/login` | Button `loading` on submit | Quick-pick chips always available | Unknown email → field error "No owner found" |
| `/dashboard` | Per-Card `Skeleton`/`Spin` | No negative reviews → `WakeUpCall` positive `Result`; `ProblemAreas` → `Empty` | Service throw → per-Card `Alert` + retry, rest still renders |
| `/reviews` | `Table` `loading` | Filters too narrow → `Empty`; no negatives → `Result` + widen filter | Bad filter combo simply yields `Empty` (never crashes) |
| `/analysis/:reviewId` | Section `Skeleton`s in arc order | No peer data → `PeerComparison` `Empty`; no positive → muted note | Missing/invalid id → `Result 404` → back to `/reviews`; non-negative review → info banner |
| `/action-plan` | List `Skeleton` | No actions → `Empty` + CTA to analyze a review | After-window too small → row shows `Monitoring` note |
| `/impact` | Section `Skeleton`s | Nothing collected → `Result` + CTA to `/action-plan` | After-window too small → gold **Monitoring — more feedback needed**, no verdict |

Global patterns: use AntD `Empty`, `Result`, `Skeleton`, `Spin`, and `Alert` — no custom
empty-state widgets. Every empty state includes a **next-step CTA** so the demo never dead-
ends. Because services are synchronous over seeded data, loading states are brief but are
implemented for polish and consistency.

---

## 7. Visual language

### 7.1 AntD v4 component mapping (canonical usage)

| Need | AntD v4 component |
|------|-------------------|
| App shell / regions | `Layout` (`Sider`, `Header`, `Content`) |
| Primary nav | `Menu` (mode `inline`) + `Badge` on Action Plan |
| Content blocks | `Card` (every widget is a Card for consistent rhythm) |
| Tabular reviews | `Table` (sortable, filterable columns) |
| Category / sentiment / priority labels | `Tag` |
| KPIs & deltas | `Statistic` (inside `MetricCard` / `ImpactMetric`) |
| Lifecycle overview | `Steps` (ActionPlan legend) |
| Counts on nav / statuses | `Badge` |
| Threshold / confidence progress | `Progress` |
| Verdicts & empty screens | `Result` |
| Star ratings | `Rate` (read-only) |
| Key/value detail | `Descriptions` (RootCause, Remedy meta) |
| Structured order-of-events | `Timeline` (optional in ImpactTimeline sidebar) |
| Confirmations (Reset Demo, destructive) | `Modal.confirm` |
| Success/undo feedback | `message` / `notification` |
| Tenant + filters | `Select`, `Segmented` |

> **AntD v4 pin (Top Risk #1):** we are on **antd ^4.24 + @ant-design/icons 4**, mounted
> **without `React.StrictMode`** to avoid the `findDOMNode`/double-invoke breakage with
> React 18. `Table` + `Tooltip` are smoke-tested in Phase 1. Do not import antd v5 APIs.

### 7.2 Status color map — the 6 `ActionStatus` values

| `ActionStatus` value | Meaning | Color role | AntD token / Tag color |
|----------------------|---------|-----------|------------------------|
| `Not Started` | Queued, no work yet | Neutral | `default` (grey) |
| `In Progress` | Owner acting | Active | `processing` / blue |
| `Monitoring` | Measuring, insufficient data | Caution | `warning` / gold |
| `Completed` | Action done, awaiting/using measurement | Info | `cyan` / geekblue |
| `Improvement Confirmed` | Verdict: it worked | Success | `success` / green |
| `No Significant Change` | Verdict: it didn't (yet) | Failure | `error` / red |

Rendered consistently as `Tag` (in lists), `Badge` status dot (on nav / cards), and the
`Result` status icon on the Impact page. One mapping, defined once in `theme.ts`.

### 7.3 Sentiment & rating maps

| `Sentiment` | Color | Tag |
|-------------|-------|-----|
| `Positive` | green | `success` |
| `Neutral` | grey/gold | `default` |
| `Negative` | red | `error` |

| `Rating` | Label (fixed) | Star render |
|---------:|---------------|-------------|
| 1 | Low | ★☆☆☆☆ |
| 2 | Moderate | ★★☆☆☆ |
| 3 | Average | ★★★☆☆ |
| 4 | Good | ★★★★☆ |
| 5 | Excellent | ★★★★★ |

Ratings **below 3** are the analysis population (business rule); the UI visually
de-emphasizes 3+ in problem contexts and uses the `Rating` labels above in tooltips.

**Delta direction coloring (Impact):** positive movement on a "good" metric (avgRating ↑,
positiveCount ↑, peerGap ↓, complaints ↓) renders green with an up/down arrow that matches
the _desired_ direction; regressions render red. `ImpactMetric` encodes this so the row
reads at a glance.

### 7.4 styled-components theming role

- **`styles/theme.ts`** exports the single source of design tokens: brand palette
  (Experience.com blue accent), the status color map (§7.2), sentiment colors, spacing,
  radii, and **chart wrapper heights**. It also seeds AntD's `ConfigProvider` theme where
  v4 allows (primary color, etc.), so AntD and styled-components agree.
- **`styles/GlobalStyle.ts`** sets base typography, background, scrollbar, and resets.
- styled-components is used for **layout scaffolding and chart wrappers** (things AntD
  doesn't own) and to apply theme tokens; AntD owns the interactive widgets. We do **not**
  restyle AntD internals ad hoc — theme via tokens, compose with styled wrappers.
- No Tailwind, no additional UI dependencies (mandated stack).

### 7.5 Responsive chart wrappers (Recharts — Top Risk #6)

Every Recharts chart is wrapped in a **fixed-height styled wrapper** with
`ResponsiveContainer` inside, because an AntD `Card` body has no intrinsic height and
`ResponsiveContainer` collapses to 0 otherwise.

```tsx
// styles/theme.ts:  chart heights are tokens, e.g. { chart: { sm: 220, md: 300, lg: 360 } }
const ChartFrame = styled.div<{ h?: number }>`
  width: 100%;
  height: ${({ h, theme }) => h ?? theme.chart.md}px;  /* explicit height — required */
`;

// usage inside any dashboard/analysis/impact chart component:
<ChartFrame h={theme.chart.md}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={trend}> … </LineChart>
  </ResponsiveContainer>
</ChartFrame>
```

Chart-by-chart (per shared context):

| Component | Chart | Notes |
|-----------|-------|-------|
| `RatingSummary` | BarChart (1–5★ distribution) | color bars by rating band |
| `RatingTrend` | LineChart (avg rating over time) | single series |
| `ProblemAreas` | horizontal BarChart (complaint freq by category, top-N) | bars clickable → Analysis |
| `PeerComparison` | grouped BarChart (my price/rating vs peer avg) | two series, legend |
| `PositiveReviewComparison` | optional RadarChart (contrast) | positive vs negative themes |
| `BeforeAfterComparison` | grouped BarChart (before vs after) | avgRating, negativeCount, positiveCount, target-category complaints |
| `ImpactTimeline` | LineChart + `ReferenceLine` at `actionDate` | the "action taken" marker is the money shot |

Wrappers are responsive (fluid width, fixed height) and the Content column reflows on
narrower viewports; on mobile the two-up dashboard row stacks to one column.

---

## 8. Accessibility & polish notes

- **Color is never the only signal.** Status/sentiment always pair color with a text label
  and/or an icon (`Tag` text, `Badge` status + label, arrows on deltas). This also protects
  the demo screenshot from being misread.
- **Charts have text equivalents.** Each chart Card includes a one-line takeaway caption
  (e.g. "Avg rating rose 2.4 → 4.5 after the action") and, where practical, an
  `aria-label`/`Descriptions` summary so a screen reader gets the same conclusion. Recharts
  tooltips use the fixed `Rating` labels.
- **Keyboard & focus.** All interactive controls are real AntD components (buttons, selects,
  table row actions) with visible focus rings; the Reset Demo `Modal.confirm` traps focus.
  Table rows are reachable and the "Analyze →" action is a focusable control, not a
  click-only region.
- **Hit targets & density.** KPI cards, status controls, and CTAs use comfortable sizing;
  the primary CTAs ("Add to Action Plan", "Collect New Reviews") are visually dominant so
  the demo path is unmistakable.
- **Motion.** Subtle transitions on status change and chart mount; nothing that would fight
  a screen recording. Respect `prefers-reduced-motion`.
- **Copy tone.** Plain, owner-facing language ("what customers are unhappy about", "did it
  work?") — not data-science jargon. Ties to the Experience.com CX-improvement voice.
- **Numbers, formatted once.** A shared formatter (ratings to 1 decimal + ★, deltas with
  sign, percents) so every surface is consistent. Deterministic data means these never
  jitter between renders.
- **Empty states never dead-end** — each carries a next-step CTA (see §6).

---

## 9. Demo screenshot target (scoring-critical)

`working_demo` (15 pts) requires a **screenshot in the `demo/` folder**; slide decks score
0. The screenshot must make the end-to-end loop obvious in one frame.

### Primary capture — the Impact page, Scenario 5, "Improvement Confirmed"

**Screen:** `/impact` for the Scenario 5 action **after** "Collect New Reviews", showing:

1. `ImprovementSummary` with the green **"Improvement Confirmed"** verdict and its
   narrative (e.g. avg rating **2.4 → 4.5 (+2.1)**, complaints **8 → 1 (−7)**,
   sentiment **+0.8**).
2. `BeforeAfterComparison` grouped BarChart with the Before vs After bars visibly diverging.
3. `ImpactTimeline` LineChart with the `ReferenceLine` at `actionDate` and the curve
   climbing after it.
4. The `ImpactMetric` delta row (all green, correct-direction arrows).
5. `ImprovementStatus` = **Improvement Confirmed** (green `Result`/`Badge`).

**Why this is the best evidence.** This single screen proves the _entire_ closed loop
worked: a problem was detected, a specific remedy was acted on, **new reviews were
collected**, and the before/after math + the action-marked timeline **confirm measurable
improvement**. It shows the product's differentiator — _proving_ the fix, not just
suggesting one — which is exactly the Experience.com "close the loop on negative feedback"
value. Before/after side-by-side with the action marker is far more persuasive than any
analysis-only view. Capture at desktop width with the AntD chrome visible so the whole app
context reads.

**Filename [Assumption]:** `demo/impact-improvement-confirmed.png`.

### Secondary capture (backup) — the Analysis page story

**Screen:** `/analysis/:reviewId` for a strong scenario (e.g. Scenario 2, poor quality +
long waiting time) showing the full arc in one scroll: `EvidenceCard`(s) → `PeerComparison`
(my vs peer bars) → `PositiveReviewComparison` → `RootCauseCard` (statement + confidence) →
`RemedyCard` with a specific Tier-1 remedy and the **"Add to Action Plan"** CTA.

**Why keep it as backup.** It evidences the analytical depth and product understanding
(peer comparison, positive-review contrast, root cause "beyond classification", specific
remedy) that underpins `product_knowledge` and `complexity`. If a single screenshot is
allowed, use the Impact shot; if two are allowed, pair Analysis (the insight) with Impact
(the proof) to tell the whole story. **[Assumption]** Suggested filename:
`demo/analysis-root-cause-remedy.png`.

> **Presenter tip:** the two CTAs "Add to Action Plan" and "Collect New Reviews" are the
> live-demo levers that walk a judge from Analysis → Action Plan → Impact in under a minute;
> the Reset Demo control lets you re-run the loop cleanly for each viewer.
