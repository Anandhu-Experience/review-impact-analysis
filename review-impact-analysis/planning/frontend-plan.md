# RIA — Frontend Architecture Plan

> **Owner:** Frontend Architect Agent · **Consumes:** ux-plan.md, data-plan.md · **Feeds:** implementation-plan.md

This document is the execution-ready front-end blueprint for **Review Impact Analysis (RIA)** —
the Experience.com / XMP "close the loop on negative feedback" review-intelligence capability,
demoed on the restaurant vertical. It specifies the React 18 + Vite architecture, the 23
components, the 6 pages, the Zustand store, routing, styling, AntD v4 usage, Recharts
integration, tooling, and the performance/correctness rules that keep the demo deterministic
and threshold-correct.

Everything below uses the **exact** names, routes, types, and file paths from
`ria-shared-context.md`. Nothing is renamed. Where a detail is not fixed by the shared context
it is flagged **(assumption)**.

---

## 0. Non-negotiable invariants (read first)

These are the constraints every file in `src/` must respect. They are repeated up front because
they drive most of the architecture decisions in this document.

1. **Mount WITHOUT `React.StrictMode`.** AntD v4.24's `rc-*` internals call the deprecated
   `ReactDOM.findDOMNode`. React 18 StrictMode double-invokes and surfaces console errors /
   layout glitches on `Table`, `Tooltip`, `Dropdown`, and animated components. We mount a plain
   `createRoot(...).render(<App />)`. (Top Risk #1.)
2. **Pure services.** Nothing under `src/services/**` may import `react`, `react-dom`, `antd`,
   `zustand`, `styled-components`, `recharts`, `../store`, or any component. Enforced by ESLint
   `no-restricted-imports`. Pages read data from the store and **inject** it into services.
3. **Determinism.** No `Math.random()`, `Date.now()`, or `new Date()` anywhere in `src/`. Dates
   are hardcoded; the only randomness is the seeded `prng.ts` (mulberry32). Nothing computed is
   persisted — services recompute on every read.
4. **Single review gate.** Every page reads reviews through the `useVisibleReviews()` selector so
   the baseline/post-action gating is uniform. No page filters raw seed reviews itself.
5. **AntD is v4, not v5.** CSS import path, ConfigProvider capabilities, and several component
   APIs differ from v5. See §9.

---

## 1. React 18 + Vite architecture

### 1.1 Entry: `src/main.tsx`

```tsx
import { createRoot } from 'react-dom/client';
import 'antd/dist/antd.css';           // v4 global stylesheet — MUST load before SC styles (§8)
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

// NOTE: intentionally NOT wrapped in <React.StrictMode>.
// AntD v4.24 (rc-* components) uses ReactDOM.findDOMNode internally; React 18 StrictMode
// double-invokes render + effects and breaks/wars on Table, Tooltip, Dropdown, Steps.
// Removing StrictMode is the sanctioned mitigation for the mandated antd v4 stack (Risk #1).
createRoot(container).render(<App />);
```

Why the `antd/dist/antd.css` import lives here (in the entry, not in `App.tsx`): it must be the
**first** style injected so styled-components (which injects at the end of `<head>`) reliably wins
specificity ties for our brand overrides.

### 1.2 `src/App.tsx`

```tsx
import { ConfigProvider } from 'antd';
import { ThemeProvider } from 'styled-components';
import { RouterProvider } from 'react-router-dom';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';
import { router } from './router/routes';

export default function App() {
  return (
    <ConfigProvider
      componentSize="middle"
      // v4 ConfigProvider does NOT accept a v5-style theme={{ token }} prop.
      // We use it only for size/locale/popup-container concerns (§9).
      getPopupContainer={(node) => (node?.parentElement as HTMLElement) ?? document.body}
    >
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <RouterProvider router={router} />
      </ThemeProvider>
    </ConfigProvider>
  );
}
```

Provider nesting order: **AntD `ConfigProvider` outermost** (so all antd components read config),
then **styled-components `ThemeProvider`** (so our styled wrappers get `theme`), then
`GlobalStyle`, then the router. There is no Zustand `<Provider>` — Zustand's store is a module
singleton (`useRIAStore`), imported directly where needed.

### 1.3 `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Review Impact Analysis · Experience.com</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 1.4 Pinned dependency set

Versions are taken verbatim from the mandated stack in the shared context. **No Tailwind, no extra
runtime deps.** The installed toolchain uses `@vitejs/plugin-react` (Babel-based), which is
present in `node_modules` — we standardize on it (not the SWC variant).

Sample `package.json` (dependency lists only):

```jsonc
{
  "name": "review-impact-analysis",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.0",
    "antd": "^4.24.16",
    "@ant-design/icons": "^4.8.3",
    "styled-components": "^6.1.11",
    "recharts": "^2.12.7",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/styled-components": "^5.1.34",
    "eslint": "^8.57.0",
    "@typescript-eslint/parser": "^7.13.0",
    "@typescript-eslint/eslint-plugin": "^7.13.0",
    "eslint-plugin-react-hooks": "^4.6.2"
  }
}
```

**Pin notes:**
- `antd` pinned to the `^4.24` line — never allow a v5 hoist.
- `@ant-design/icons` must be the **v4** line (`^4.8`); the v5 icons package assumes antd v5 CSS-in-JS.
- `styled-components` v6 ships its own types, but `@types/styled-components` (v5 typings) is still
  the pragmatic way to type the `DefaultTheme` via declaration merging (see §8); if v6's bundled
  types are preferred, drop the `@types` dep and keep `styles/styled.d.ts`.

---

## 2. The pure-services rule

**Rule:** business/analysis logic lives ONLY in `src/services/`. Those modules take plain data
(a `SeedData` bundle or plain arrays) and return plain objects. They never touch React, antd,
Zustand, styled-components, Recharts, the store, or components. Pages/components call services;
they never reimplement logic.

### 2.1 ESLint enforcement (`.eslintrc.cjs`)

```js
/* .eslintrc.cjs */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  overrides: [
    {
      // Pure-services boundary — src/services/** must be UI-free and store-free.
      files: ['src/services/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          paths: [
            { name: 'react',              message: 'Services must be pure — no React in src/services/**.' },
            { name: 'react-dom',          message: 'Services must be pure — no ReactDOM in src/services/**.' },
            { name: 'antd',               message: 'Services must be pure — no UI framework in src/services/**.' },
            { name: '@ant-design/icons',  message: 'Services must be pure — no icons in src/services/**.' },
            { name: 'zustand',            message: 'Services must be pure — no store library in src/services/**.' },
            { name: 'styled-components',  message: 'Services must be pure — no styling in src/services/**.' },
            { name: 'recharts',           message: 'Services must be pure — no charts in src/services/**.' },
          ],
          patterns: [
            { group: ['**/store/**', '../store', '../../store', '@/store*'],
              message: 'Services must not import the store. Pages read the store and inject plain data.' },
            { group: ['**/components/**', '**/pages/**'],
              message: 'Services must not import components or pages.' },
            { group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'Services must be pure, React-free modules.' },
          ],
        }],
      },
    },
  ],
};
```

Services **may** import: other services, `../types`, `../data/*` (seed & tables), and standard-lib
helpers. That's the entire allowed surface.

### 2.2 How pages inject data into pure services

The pattern is always the same three steps — **select → compute (memoized) → render**:

```tsx
// Inside a page/container component:
const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId);
const visibleReviews = useVisibleReviews();               // 1. select gated data from the store

const problems = useMemo(                                  // 2. inject plain data into a pure service
  () => reviewAnalysisService.computeProblemAreas(activeRestaurantId!, seed, visibleReviews),
  [activeRestaurantId, visibleReviews],
);

return <ProblemAreas problems={problems} topN={5} />;      // 3. pass results as props (presentational)
```

The store (§6) is the only place a service and the seed are wired together for *mutating* flows
(`collectNewReviews` calls `impactAnalysisService.computeImpact`). Read-only flows compute inside
pages/containers via `useMemo`. Services stay ignorant of where their inputs came from.

---

## 3. Component architecture (all 23)

Folders live under `src/components/`. **Container** = reads store and/or calls services.
**Presentational** = pure, props-only, no store, no service calls. Presentational components are
the majority and must stay pure (Top Risk mitigations depend on this).

> **Naming-collision guard (load-bearing).** Four component names collide with type names from
> `src/types`: the component `ReviewAnalysis` vs type `ReviewAnalysis`; component `PeerComparison`
> vs type `PeerComparisonResult` (distinct, but adjacent); component `PositiveReviewComparison` vs
> type `PositiveReviewComparison` (identical); component `ActionItem` vs type `ActionItem`
> (identical). **Convention:** components are imported as-is; where a file needs both, alias the
> type on import — `import type { ActionItem as ActionItemModel } from '../../types';` and
> `import type { PositiveReviewComparison as PositiveReviewComparisonResult } from '../../types';`.
> Do this consistently in `action/ActionItem.tsx`, `analysis/PositiveReviewComparison.tsx`,
> `analysis/ReviewAnalysis.tsx`, and `pages/AnalysisPage.tsx`.

### 3.1 Folder → component → role map

| Folder | Component | Kind | Used by page(s) |
|---|---|---|---|
| `layout/` | **AppLayout** | Container | shell for /dashboard, /reviews, /analysis/:reviewId, /action-plan, /impact |
| `layout/` | **Sidebar** | Presentational | via AppLayout (all authed pages) |
| `layout/` | **Header** | Presentational | via AppLayout (all authed pages) |
| `dashboard/` | **MetricCard** | Presentational | DashboardPage, ImpactPage (reused) |
| `dashboard/` | **RatingSummary** | Presentational | DashboardPage |
| `dashboard/` | **RatingTrend** | Presentational | DashboardPage |
| `dashboard/` | **ProblemAreas** | Presentational | DashboardPage |
| `dashboard/` | **WakeUpCall** | Presentational | DashboardPage |
| `reviews/` | **ReviewCard** | Presentational | ReviewsPage, AnalysisPage |
| `reviews/` | **ReviewTable** | Presentational | ReviewsPage |
| `analysis/` | **ReviewAnalysis** | Container | AnalysisPage |
| `analysis/` | **EvidenceCard** | Presentational | via ReviewAnalysis (inside RootCauseCard) |
| `analysis/` | **PeerComparison** | Presentational | via ReviewAnalysis |
| `analysis/` | **PositiveReviewComparison** | Presentational | via ReviewAnalysis |
| `analysis/` | **RootCauseCard** | Presentational | via ReviewAnalysis |
| `analysis/` | **RemedyCard** | Presentational | via ReviewAnalysis |
| `action/` | **ActionPlan** | Container | ActionPlanPage |
| `action/` | **ActionItem** | Presentational | via ActionPlan |
| `impact/` | **ImprovementSummary** | Presentational | ImpactPage |
| `impact/` | **BeforeAfterComparison** | Presentational | ImpactPage |
| `impact/` | **ImpactTimeline** | Presentational | ImpactPage |
| `impact/` | **ImpactMetric** | Presentational | ImpactPage (row of tiles) |
| `impact/` | **ImprovementStatus** | Presentational | ImpactPage |

Containers (per shared context): **AppLayout, all 6 Pages, ReviewAnalysis, ActionPlan**. Everything
else is presentational.

### 3.2 Component composition tree

```
AppLayout (container)
├─ Sidebar          (nav: Dashboard, Reviews, Action Plan, Impact)
├─ Header           (restaurant switcher, owner name, Reset Demo)
└─ Outlet ──▶ one of the 6 pages
                DashboardPage
                ├─ WakeUpCall
                ├─ MetricCard × N          (avg rating, negative count, sentiment, peer gap)
                ├─ RatingSummary           (BarChart: 1–5★ distribution)
                ├─ RatingTrend             (LineChart: avg rating over time)
                └─ ProblemAreas            (horizontal BarChart: complaints by category)
                ReviewsPage
                └─ ReviewTable             (row → navigate /analysis/:reviewId)
                     └─ ReviewCard         (optional detail drawer)
                AnalysisPage
                └─ ReviewAnalysis (container)
                     ├─ ReviewCard                      (the review under analysis)
                     ├─ PeerComparison                  (grouped BarChart)
                     ├─ PositiveReviewComparison        (themes contrast, optional RadarChart)
                     ├─ RootCauseCard
                     │    └─ EvidenceCard × N
                     └─ RemedyCard          (Create Action → store.createAction)
                ActionPlanPage
                └─ ActionPlan (container)
                     └─ ActionItem × N      (Collect New Reviews, Advance Status, View Impact)
                ImpactPage
                ├─ ImprovementSummary
                ├─ ImpactMetric × N         (before → after tiles)
                ├─ BeforeAfterComparison    (grouped BarChart)
                ├─ ImpactTimeline           (LineChart + ReferenceLine at actionDate)
                └─ ImprovementStatus        (verdict + next-remedy loop)
```

### 3.3 Presentational component props (derived from `analysis.ts` / `impact.ts` / `domain.ts`)

Types referenced are the shared-context types. All callbacks bubble intent up to the container.

**layout/**

```ts
// Sidebar.tsx — pure; uses react-router NavLink internally, no store.
interface SidebarProps { collapsed?: boolean; onCollapse?: (c: boolean) => void; }

// Header.tsx — pure; container passes data + callbacks.
interface HeaderProps {
  userName: string;
  activeRestaurant: Restaurant | undefined;
  restaurants: Restaurant[];
  onSwitchRestaurant: (restaurantId: string) => void;
  onResetDemo: () => void;
}
```

**dashboard/**

```ts
// MetricCard.tsx — wraps antd Statistic inside a Card.
interface MetricCardProps {
  title: string;
  value: number | string;
  precision?: number;
  suffix?: string;                 // e.g. '★', '%'
  delta?: number;                  // signed change vs baseline (optional)
  status?: 'good' | 'warn' | 'bad';
  icon?: React.ReactNode;
}

// RatingSummary.tsx — 1–5★ distribution BarChart.
interface RatingSummaryProps {
  distribution: Record<Rating, number>;   // from reviewAnalysisService.computeRatingSummary
  avgRating: number;
  total: number;
}

// RatingTrend.tsx — avg rating over time LineChart.
interface RatingTrendProps {
  data: Array<{ date: string; avgRating: number; count: number }>; // computeRatingTrend(reviews, bucket)
}

// ProblemAreas.tsx — horizontal BarChart, top-N complaint categories.
interface ProblemAreasProps {
  problems: DetectedProblem[];     // category, severity, frequency, affectedReviewIds, ...
  topN?: number;                   // default 5
  onSelectCategory?: (category: ProblemCategory) => void;
}

// WakeUpCall.tsx — hero alert answering "what are customers unhappy about?"
interface WakeUpCallProps {
  restaurantName: string;
  topProblem: DetectedProblem | null;
  negativeCount: number;
  avgRating: number;
  onAnalyze: (reviewId: string) => void;   // jumps to a representative exampleReviewId
}
```

**reviews/**

```ts
// ReviewCard.tsx
interface ReviewCardProps {
  review: Review;
  classification?: { categories: ProblemCategory[]; sentiment: Sentiment; isNegative: boolean };
  onAnalyze?: (reviewId: string) => void;
}

// ReviewTable.tsx — antd Table. Columns: date, item, rating (Tag), categories (Tags),
// sentiment (Tag), price, action. `classify` is a pure fn the container passes in.
interface ReviewTableProps {
  reviews: Review[];
  classify: (review: Review) => { categories: ProblemCategory[]; sentiment: Sentiment; isNegative: boolean };
  onAnalyze: (reviewId: string) => void;
  loading?: boolean;
}
```

**analysis/**

```ts
// EvidenceCard.tsx
interface EvidenceCardProps { evidence: Evidence; }        // type, label, detail, reviewId?

// PeerComparison.tsx — grouped BarChart (my price/rating vs peer avg) + rank/percentile/gap.
interface PeerComparisonProps { peer: PeerComparisonResult | null; }

// PositiveReviewComparison.tsx — positive vs negative themes + contrast (+ optional RadarChart).
import type { PositiveReviewComparison as PositiveReviewComparisonResult } from '../../types';
interface PositiveReviewComparisonProps { positive: PositiveReviewComparisonResult | null; }

// RootCauseCard.tsx — statement + confidence + evidence list + peer/positive context.
interface RootCauseCardProps { rootCause: RootCause; }

// RemedyCard.tsx — the specific remedy + "Create Action" CTA.
interface RemedyCardProps {
  remedy: Remedy;                    // title, description, specificActions, expectedImpact, tier, targetMetric
  alreadyPlanned?: boolean;          // container checks store.actionItems for remedy.id
  onCreateAction?: (remedy: Remedy) => void;
}
```

**action/**

```ts
// ActionItem.tsx — one action row.
import type { ActionItem as ActionItemModel } from '../../types';
interface ActionItemProps {
  action: ActionItemModel;           // status, priority, dates, category, owner, impactResult?
  released: boolean;                 // scenarioId ∈ releasedScenarioIds
  onCollectNewReviews: (actionId: string) => void;
  onAdvanceStatus: (actionId: string, status: ActionStatus) => void;
  onViewImpact: (actionId: string) => void;
}
```

**impact/**

```ts
// ImprovementSummary.tsx — verdict headline + narrative.
interface ImprovementSummaryProps { impact: ImpactResult; }

// BeforeAfterComparison.tsx — grouped BarChart of the 4 headline metrics.
interface BeforeAfterComparisonProps {
  before: MetricSnapshot;
  after: MetricSnapshot;
  deltas: ImpactResult['deltas'];    // avgRating, negativeCount, positiveCount, targetCategoryComplaints, sentiment, peerGap
  targetCategory: ProblemCategory;
}

// ImpactTimeline.tsx — LineChart with a ReferenceLine at actionDate.
interface ImpactTimelineProps {
  points: Array<{ date: string; avgRating: number }>;
  actionDate: string;                // from the scenario driving this action
}

// ImpactMetric.tsx — one before→after tile.
interface ImpactMetricProps {
  label: string;
  before: number;
  after: number;
  delta: number;
  format?: 'rating' | 'count' | 'sentiment' | 'pct';
  goodDirection?: 'up' | 'down';     // colors the delta green/red correctly per metric
}

// ImprovementStatus.tsx — verdict + status + next-remedy loop.
interface ImprovementStatusProps {
  verdict: ImpactResult['verdict'];
  status: ActionStatus;
  nextRemedyId?: string;             // present on a failed remedy (scenario 6)
  onApplyNextRemedy?: () => void;    // container creates a tier-2 action
}
```

---

## 4. Page architecture (6 pages)

Routes are fixed: `/login`, `/dashboard`, `/reviews`, `/analysis/:reviewId`, `/action-plan`,
`/impact`. Peer comparison, root cause, and remedy are **sections inside** `/analysis/:reviewId`,
not separate routes.

### 4.1 `LoginPage` → `/login`

| Aspect | Detail |
|---|---|
| Services | none |
| Store | `login(email) → boolean`, `setActiveRestaurant(id)`; reads `currentUserId` |
| Data import | `data/users.ts` (to render a demo-owner picker — a data import, not a service) |
| Components | antd `Card`, `Form`, `Input`/`Select`, `Button`, `Result` (on invalid email) |
| Flow | Owner picks/enters email → `login(email)`; on `true`, set active restaurant to the user's first `restaurantIds[0]` → `navigate('/dashboard')`; on `false`, show inline error. If already authed, redirect to `/dashboard`. |

### 4.2 `DashboardPage` → `/dashboard`

| Aspect | Detail |
|---|---|
| Services | `reviewAnalysisService.computeRatingSummary`, `computeRatingTrend(reviews, bucket)`, `computeProblemAreas(restaurantId, data, visibleReviews)`; `sentimentService.aggregateSentiment` |
| Store | `activeRestaurantId`; `useVisibleReviews()` |
| Components | `WakeUpCall`, `MetricCard × N`, `RatingSummary`, `RatingTrend`, `ProblemAreas` |
| Flow | `useVisibleReviews()` → memoized service calls → props. `WakeUpCall.onAnalyze` and `ProblemAreas.onSelectCategory` navigate to `/analysis/:reviewId` (picking a representative `exampleReviewIds[0]`). This page answers owner-questions 1 & 3. |

### 4.3 `ReviewsPage` → `/reviews`

| Aspect | Detail |
|---|---|
| Services | `reviewAnalysisService.classifyReview` (passed to `ReviewTable` as `classify`); optionally `detectProblems` for filter facets |
| Store | `useVisibleReviews()` |
| Components | `ReviewTable` (+ optional `ReviewCard` detail drawer) |
| Flow | Gated reviews → `ReviewTable`. Local UI state for rating/category/sentiment filters. Row/analyze click → `navigate('/analysis/' + reviewId)`. Highlights reviews rated **below 3** (the analyzable set). |

### 4.4 `AnalysisPage` → `/analysis/:reviewId`

| Aspect | Detail |
|---|---|
| Services | (via `ReviewAnalysis` container) `reviewAnalysisService.analyzeReview(reviewId, data, visibleReviews)` — the orchestrator that runs detect → sentiment → comparePeers → findPositiveComparisons → deriveRootCause → getRemedy |
| Store | `useVisibleReviews()`, `activeRestaurantId`, `createAction`, `actionItems` (to compute `alreadyPlanned`) |
| Components | `ReviewAnalysis` → `ReviewCard`, `PeerComparison`, `PositiveReviewComparison`, `RootCauseCard` (→ `EvidenceCard`), `RemedyCard` |
| Flow | Read `:reviewId` param → `analyzeReview` (memoized) yields the `ReviewAnalysis` **type** → fan out to sub-cards. `RemedyCard.onCreateAction` → `createAction({ remedy, rootCause, scenarioId: review.scenarioId })` → `navigate('/action-plan')`. This page answers owner-questions 2, 4, 5, 6. |

### 4.5 `ActionPlanPage` → `/action-plan`

| Aspect | Detail |
|---|---|
| Services | `actionPlanService.summarizeActionPlan(actions)` |
| Store | `actionItems` (filtered by `activeRestaurantId`), `releasedScenarioIds`, `collectNewReviews`, `updateActionStatus` |
| Components | `ActionPlan` → `ActionItem × N` |
| Flow | List the restaurant's actions. `ActionItem.onCollectNewReviews` → `collectNewReviews(actionId)` (releases the scenario, computes impact, writes back). `onAdvanceStatus` → `updateActionStatus`. `onViewImpact` → `navigate('/impact')`. This is the "Owner Takes Action → Collect New Reviews" hinge of the closed loop. |

### 4.6 `ImpactPage` → `/impact`

| Aspect | Detail |
|---|---|
| Services | reads `action.impactResult` (already computed on `collectNewReviews`); `impactAnalysisService.computeImpact` as a fallback recompute; `remedyService.getNextRemedy(category, excludeRemedyId)` for failed remedies |
| Store | `actionItems`, `releasedScenarioIds`, `createAction`, `updateActionStatus` |
| Components | `ImprovementSummary`, `ImpactMetric × N`, `BeforeAfterComparison`, `ImpactTimeline`, `ImprovementStatus` |
| Flow | Pick actions whose scenario is released → render before/after. **Scenario 5:** verdict "Improvement Confirmed". **Scenario 6:** verdict "No Significant Improvement" + `nextRemedyId`; `ImprovementStatus.onApplyNextRemedy` → `createAction` with the tier-2 remedy (loop back to "recommend next remedy"). This page answers owner-question 7 and is the primary `working_demo` evidence surface. |

---

## 5. Zustand store design (`src/store/useRIAStore.ts`)

### 5.1 Store shape

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActionItem, Remedy, RootCause, ActionStatus, Review } from '../types';
import { ActionStatus as Status } from '../types';
import { seed } from '../data/seed';                       // static SeedData bundle — NEVER persisted
import { impactAnalysisService } from '../services/impactAnalysisService';
import { actionPlanService } from '../services/actionPlanService';

/** Bump when seed data / scenario scripting changes; forces a persisted-state auto-reset. */
export const DEMO_VERSION = 1;

interface RIAState {
  // ---------- persisted state ----------
  currentUserId: string | null;
  activeRestaurantId: string | null;
  actionItems: ActionItem[];
  releasedScenarioIds: string[];
  demoVersion: number;

  // ---------- actions ----------
  login: (email: string) => boolean;
  logout: () => void;
  setActiveRestaurant: (id: string) => void;
  createAction: (args: { remedy: Remedy; rootCause: RootCause; scenarioId: string }) => void;
  updateActionStatus: (actionId: string, status: ActionStatus) => void;
  collectNewReviews: (actionId: string) => void;
  resetDemo: () => void;
}

const INITIAL: Pick<RIAState,
  'currentUserId' | 'activeRestaurantId' | 'actionItems' | 'releasedScenarioIds' | 'demoVersion'> = {
  currentUserId: null,
  activeRestaurantId: null,
  actionItems: [],
  releasedScenarioIds: [],
  demoVersion: DEMO_VERSION,
};

export const useRIAStore = create<RIAState>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      login: (email) => {
        const user = seed.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
        if (!user) return false;
        set({ currentUserId: user.id, activeRestaurantId: user.restaurantIds[0] ?? null });
        return true;
      },

      logout: () => set({ currentUserId: null, activeRestaurantId: null }),

      setActiveRestaurant: (id) => set({ activeRestaurantId: id }),

      createAction: ({ remedy, rootCause, scenarioId }) => {
        const { activeRestaurantId, actionItems, currentUserId } = get();
        if (!activeRestaurantId) return;
        const owner = seed.users.find((u) => u.id === currentUserId)?.name ?? 'Owner';
        const action = actionPlanService.createActionFromRemedy(
          remedy, rootCause, activeRestaurantId, owner, scenarioId, seed,
        );
        set({ actionItems: [...actionItems, action] });
      },

      updateActionStatus: (actionId, status) =>
        set((s) => ({
          actionItems: s.actionItems.map((a) =>
            a.id === actionId ? actionPlanService.advanceStatus(a, status) : a),
        })),

      // The before/after crux — release the scenario, then recompute impact from now-visible data.
      collectNewReviews: (actionId) => {
        const { actionItems, releasedScenarioIds } = get();
        const action = actionItems.find((a) => a.id === actionId);
        if (!action) return;

        const released = releasedScenarioIds.includes(action.scenarioId)
          ? releasedScenarioIds
          : [...releasedScenarioIds, action.scenarioId];

        const impact = impactAnalysisService.computeImpact(action, seed, released);
        const nextStatus: ActionStatus =
          impact.verdict === 'Improvement Confirmed'            ? Status.ImprovementConfirmed
          : impact.verdict === 'No Significant Improvement'      ? Status.NoSignificantChange
          : Status.Monitoring; // 'Monitoring — more feedback needed'

        set({
          releasedScenarioIds: released,
          actionItems: actionItems.map((a) =>
            a.id === actionId
              ? { ...a, afterSnapshot: impact.after, impactResult: impact, status: nextStatus }
              : a),
        });
      },

      resetDemo: () => set({ ...INITIAL }),
    }),
    {
      name: 'ria-store-v1',
      version: DEMO_VERSION,
      // Persist ONLY these keys — never seed data, never computed analysis.
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        activeRestaurantId: s.activeRestaurantId,
        actionItems: s.actionItems,
        releasedScenarioIds: s.releasedScenarioIds,
        demoVersion: s.demoVersion,
      }),
      // Auto-reset if the persisted blob predates the current demo scripting.
      migrate: (persisted: any, version) => {
        if (!persisted || version !== DEMO_VERSION || persisted.demoVersion !== DEMO_VERSION) {
          return { ...INITIAL };
        }
        return persisted;
      },
    },
  ),
);
```

### 5.2 `useVisibleReviews()` selector (the uniform review gate)

Implemented to avoid a re-render trap: `getVisibleReviews` returns a **new array reference** each
call, so selecting it directly would make the component re-render on *every* store change
(Object.is comparison always fails). Instead select the two primitive inputs and memoize:

```ts
import { useMemo } from 'react';
import { impactAnalysisService } from '../services/impactAnalysisService';

export const useVisibleReviews = (): Review[] => {
  const activeRestaurantId  = useRIAStore((s) => s.activeRestaurantId);
  const releasedScenarioIds = useRIAStore((s) => s.releasedScenarioIds);
  return useMemo(
    () => (activeRestaurantId
      ? impactAnalysisService.getVisibleReviews(activeRestaurantId, releasedScenarioIds, seed)
      : []),
    [activeRestaurantId, releasedScenarioIds],
  );
};
```

`releasedScenarioIds` changes reference only when `collectNewReviews` / `resetDemo` mutate it, so
the memo deps are stable across unrelated store updates. Every page reads reviews through this
selector — gating stays uniform.

### 5.3 Reset Demo control

`Header` renders a visible **Reset Demo** button → `useRIAStore.getState().resetDemo()` (or the
`onResetDemo` prop wired to it) → wipes persisted actions/releases back to `INITIAL`. This is the
mitigation for localStorage staleness (Top Risk #5), paired with the `demoVersion` migrate
auto-reset. (assumption) A brief antd `Modal.confirm` guards the click so a live demo can't reset
by accident.

---

## 6. Routing (`src/router/routes.tsx`, `src/router/ProtectedRoute.tsx`)

`react-router-dom` v6 with `createBrowserRouter` + `RouterProvider`.

```tsx
// router/routes.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ReviewsPage from '../pages/ReviewsPage';
import AnalysisPage from '../pages/AnalysisPage';
import ActionPlanPage from '../pages/ActionPlanPage';
import ImpactPage from '../pages/ImpactPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,          // guards + renders <AppLayout /> (which holds <Outlet/>)
    children: [
      { path: '/dashboard',           element: <DashboardPage /> },
      { path: '/reviews',             element: <ReviewsPage /> },
      { path: '/analysis/:reviewId',  element: <AnalysisPage /> },
      { path: '/action-plan',         element: <ActionPlanPage /> },
      { path: '/impact',              element: <ImpactPage /> },
    ],
  },
  { path: '/',  element: <Navigate to="/dashboard" replace /> },
  { path: '*',  element: <Navigate to="/dashboard" replace /> },
]);
```

```tsx
// router/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useRIAStore } from '../store/useRIAStore';
import { AppLayout } from '../components/layout/AppLayout';

export function ProtectedRoute() {
  const currentUserId = useRIAStore((s) => s.currentUserId);
  // Redirect to /login when unauthenticated; otherwise render the authed shell.
  return currentUserId ? <AppLayout /> : <Navigate to="/login" replace />;
}
```

```tsx
// components/layout/AppLayout.tsx  (container)
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Layout.Content style={{ padding: 24 }}>
          <Outlet />          {/* the active page renders here */}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
```

**Redirect rules:** `/` and any unknown path → `/dashboard` (which, if unauthenticated, bounces to
`/login` via `ProtectedRoute`). `LoginPage` self-redirects authed users to `/dashboard`.

---

## 7. Styled-components strategy (`src/styles/`)

### 7.1 `theme.ts` tokens

```ts
export const theme = {
  colors: {
    brand:      '#1f6feb',   // Experience.com-adjacent blue
    brandDark:  '#1552b0',
    bg:         '#f5f7fa',
    surface:    '#ffffff',
    text:       '#1f2933',
    textMuted:  '#6b7280',
    border:     '#e5e7eb',

    // status
    success:    '#2e7d32',
    warning:    '#ed6c02',
    danger:     '#d32f2f',
    info:       '#0288d1',

    // sentiment (Sentiment enum)
    positive:   '#2e7d32',
    neutral:    '#9e9e9e',
    negative:   '#d32f2f',

    // rating scale 1..5 (1=Low … 5=Excellent)
    rating: { 1: '#d32f2f', 2: '#f57c00', 3: '#fbc02d', 4: '#7cb342', 5: '#2e7d32' } as Record<number, string>,

    // priority (Priority enum)
    priorityHigh:   '#d32f2f',
    priorityMedium: '#ed6c02',
    priorityLow:    '#0288d1',

    // chart series
    chart: { before: '#90a4ae', after: '#1f6feb', mine: '#1f6feb', peer: '#b0bec5',
             positive: '#2e7d32', negative: '#d32f2f' },
  },
  space:  { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' }, // 8px scale
  radius: { sm: '4px', md: '8px', lg: '12px' },
  shadow: { card: '0 1px 3px rgba(16,24,40,0.08)', raised: '0 4px 12px rgba(16,24,40,0.12)' },
  font:   { base: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` },
} as const;

export type AppTheme = typeof theme;
```

Theme typing via declaration merging in `src/styles/styled.d.ts`:

```ts
import 'styled-components';
import type { AppTheme } from './theme';
declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
```

### 7.2 `GlobalStyle.ts`

```ts
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html, body, #root { height: 100%; }
  body {
    margin: 0;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font.base};
  }
  /* Targeted brand overrides on top of antd v4's default blue (see §8 note). */
  .ant-btn-primary { background: ${({ theme }) => theme.colors.brand}; border-color: ${({ theme }) => theme.colors.brand}; }
  .ant-btn-primary:hover { background: ${({ theme }) => theme.colors.brandDark}; border-color: ${({ theme }) => theme.colors.brandDark}; }
`;
```

### 7.3 How styled-components coexists with AntD v4

- **Layout & primitives** come from antd (`Layout`, `Card`, `Table`, etc.). **Bespoke wrappers,
  spacing, chart frames, and brand accents** come from styled-components. We do not restyle antd
  internals wholesale — only targeted class overrides in `GlobalStyle`.
- **Theming reality (v4, not v5):** antd v4's `ConfigProvider` has **no** `theme={{ token }}` prop
  (that's a v5 feature). v4 palette theming normally means Less `modifyVars` at build time. Since
  we import the precompiled `antd/dist/antd.css`, we do **not** recompile Less; instead the brand
  color is applied via a small set of `GlobalStyle` overrides (above) plus styled-components on our
  own components. `ConfigProvider` is used only for `componentSize`, `getPopupContainer`, and (if
  needed) `locale`.
- **Specificity / injection order:** `antd/dist/antd.css` is imported in `main.tsx` (top of
  `<head>`); styled-components injects at the **end** of `<head>`, so our overrides win without
  `!important`.

### 7.4 Fixed-height chart wrapper (the Recharts-in-Card fix)

antd `Card` body has no intrinsic height, so a Recharts `ResponsiveContainer` (height `100%`)
collapses to 0. Always wrap charts in a fixed-height styled frame (Top Risk #6):

```ts
// styles/ChartFrame.ts
import styled from 'styled-components';
export const ChartFrame = styled.div<{ $height?: number }>`
  width: 100%;
  height: ${({ $height }) => $height ?? 280}px;
`;
```

```tsx
<Card title="Rating trend">
  <ChartFrame $height={300}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>{/* ... */}</LineChart>
    </ResponsiveContainer>
  </ChartFrame>
</Card>
```

---

## 8. AntD v4 component usage

### 8.1 UI need → antd v4 component map

| UI need | antd v4 component(s) | Where |
|---|---|---|
| App shell (sider + content) | `Layout`, `Layout.Sider`, `Layout.Header`, `Layout.Content` | AppLayout |
| Primary navigation | `Menu` (mode="inline") + react-router `NavLink` | Sidebar |
| Restaurant switcher | `Select` | Header |
| KPI tiles | `Card` + `Statistic` | MetricCard, ImpactMetric |
| Reviews grid | `Table` (+ `Tag` in cells, `Tooltip`) | ReviewTable |
| Category / sentiment / rating chips | `Tag` | ReviewCard, ReviewTable, ProblemAreas |
| Action status stepper | `Steps` (map the 6 `ActionStatus` values to steps) | ActionItem |
| Priority badge | `Badge` / `Tag` | ActionItem |
| Confidence / progress | `Progress` | RootCauseCard |
| Verdict banner (empty/success/warning states) | `Result` | ImprovementStatus, LoginPage error |
| Structured before/after facts | `Descriptions` | ImprovementSummary, BeforeAfterComparison legend |
| Chronological evidence / activity | `Timeline` | ImpactTimeline caption, EvidenceCard list (optional) |
| Section containers | `Card`, `Collapse`, `Divider`, `Space`, `Row`/`Col` grid | all pages |
| Actions | `Button`, `Modal.confirm` (Reset Demo), `Form` (login) | Header, LoginPage, RemedyCard |

### 8.2 v4-specific pitfalls to code around

- **`findDOMNode` / StrictMode** — mount without StrictMode (§1.1). Smoke-test `Table` + `Tooltip`
  in Phase 1.
- **CSS import path** — v4 is `import 'antd/dist/antd.css';` (dark: `antd/dist/antd.dark.css`).
  This is **not** v5's `antd/dist/reset.css`. Import once, in `main.tsx`.
- **Icons package** — v4 uses `@ant-design/icons@^4`; imports like
  `import { WarningOutlined } from '@ant-design/icons';` are fine, but do not upgrade to the v5
  icons line.
- **`ConfigProvider` theming** — no `theme={{ token }}` prop in v4 (§7.3). Don't write v5 token code.
- **`Table` API** — v4 `columns` use `dataIndex`/`key`/`render(value, record)`; row selection and
  `rowKey` behave as v4 (set `rowKey="id"`). `Table` `size="middle"`, `pagination` object shape is
  v4.
- **`Menu`** — prefer the v4 `<Menu>{<Menu.Item/>}</Menu>` children form (the `items` prop was
  added late in v4 and is more robust in v5); either works on 4.24, but children form is safest.
- **`Statistic`** — `precision`, `suffix`, `valueStyle` props (used by MetricCard/ImpactMetric).
- **Popup containers** — `getPopupContainer` is set globally in `ConfigProvider` so `Select`/
  `Tooltip`/`Dropdown` overlays position correctly inside scrolling `Card`s.

---

## 9. Recharts integration (Recharts 2)

All charts follow the **ResponsiveContainer-inside-fixed-height-`ChartFrame`** rule (§7.4).

| Component | Chart | Data / encoding |
|---|---|---|
| `RatingTrend` | `LineChart` | avg rating over time; `XAxis` date, `YAxis` domain `[1,5]` |
| `ProblemAreas` | horizontal `BarChart` (`layout="vertical"`) | complaint frequency by `ProblemCategory`, top-N |
| `RatingSummary` | `BarChart` | 1–5★ distribution, bars colored via `theme.colors.rating` |
| `PeerComparison` | grouped `BarChart` | my price/rating vs peer avg (`theme.colors.mine` / `peer`) |
| `PositiveReviewComparison` | optional `RadarChart` | positive vs negative theme contrast |
| `BeforeAfterComparison` | grouped `BarChart` | before vs after: avgRating, negativeCount, positiveCount, target-category complaints (`theme.colors.before` / `after`) |
| `ImpactTimeline` | `LineChart` + `ReferenceLine` | avg rating over time with a `ReferenceLine x={actionDate}` marking when the owner acted |

Shared chart conventions: pull series colors from `theme.colors.chart`; give every chart a
`Tooltip`, `CartesianGrid`, and a `Legend` where multiple series exist; format axis ticks with
plain functions (no date libs beyond the hardcoded ISO strings). Charts receive already-shaped
arrays from services — they never compute analysis themselves.

---

## 10. Build & tooling

### 10.1 `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';   // Babel-based plugin (present in node_modules)

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
  preview: { port: 4173 },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200 },
});
```

(assumption) No path aliases are configured — imports use relative paths, matching the ESLint
`no-restricted-imports` patterns in §2.1. If an `@/` alias is later added, extend those patterns.

### 10.2 `tsconfig.json` (settings of note)

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,

    // Relaxed so the multi-file scaffold doesn't churn while files land incrementally
    // (a half-wired component with an unused import must not fail `npm run build`).
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

Keep `strict: true` for type safety on the domain types, but `noUnusedLocals`/`noUnusedParameters`
are **off** — during a 17-phase build, temporarily-unused imports are expected and shouldn't block
`build`. Re-enable at the Phase 17 QA gate if desired.

### 10.3 npm scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | local dev server (HMR) |
| `build` | `tsc && vite build` | typecheck then production bundle |
| `preview` | `vite preview` | serve the built `dist/` (used to capture the `demo/` screenshot) |
| `lint` | `eslint "src/**/*.{ts,tsx}"` | enforces the pure-services boundary (§2) |
| `typecheck` | `tsc --noEmit` | fast type-only pass |

**Scoring hook:** `npm run preview` on the built app is what you screenshot into `demo/` — that
screenshot is the `working_demo` evidence (15 pts; a slide deck scores 0). The `/impact` page's
before/after with an "Improvement Confirmed" verdict is the strongest single frame.

---

## 11. Performance & correctness notes

1. **Memoize every service call per render.** Wrap `analyzeReview`, `computeProblemAreas`,
   `computeRatingTrend`, `comparePeers`, `computeImpact`, etc. in `useMemo` keyed on their real
   inputs (`reviewId`, `activeRestaurantId`, `visibleReviews`/`releasedScenarioIds`). Services are
   pure, so identical inputs → identical outputs; memoizing avoids recompute churn and keeps chart
   data references stable.
2. **Select primitives from the store, derive with `useMemo`.** Never select a freshly-built array
   (like the output of `getVisibleReviews`) directly — it defeats Zustand's `Object.is` bail-out
   and re-renders on every store change. `useVisibleReviews()` (§5.2) is the reference pattern.
3. **Stable list keys.** Use domain ids as React keys: `review.id`, `action.id`, `rootCause.id`,
   `remedy.id`, `problem.category`, `evidence.reviewId ?? index`. Never array index for reorderable
   lists.
4. **Nothing computed is persisted.** Only the 5 partialized keys hit localStorage (§5.1). Analysis
   is always recomputed on read, guaranteeing the deterministic scenario math is never served from
   a stale cache.
5. **Presentational purity.** The 18 presentational components must not call the store or services.
   This keeps them trivially memoizable (`React.memo` where a parent re-renders often, e.g.
   `ReviewTable` rows, `MetricCard`) and testable.
6. **Fixed-height chart frames everywhere** (§7.4) — the single most common runtime bug in this
   stack is a 0-height Recharts container inside a `Card`.
7. **Determinism guard.** No `Math.random()`, `Date.now()`, `new Date()` in `src/` — including
   components. Any "today" marker (e.g. `ImpactTimeline` reference line) uses a hardcoded date or
   `scenario.actionDate`. This is what lets scenario 5 pass and scenario 6 fail the *same*
   `thresholds.ts` values reproducibly (Top Risk #3).
8. **Idempotent release.** `collectNewReviews` guards against double-adding a `scenarioId` to
   `releasedScenarioIds`, so re-clicking is safe and the verdict never drifts.

---

## Appendix A — Front-end file manifest (from the shared FILE STRUCTURE)

```
src/
  main.tsx · App.tsx
  styles/     theme.ts · GlobalStyle.ts · (styled.d.ts, ChartFrame.ts)
  store/      useRIAStore.ts            (+ useVisibleReviews selector)
  router/     routes.tsx · ProtectedRoute.tsx
  components/
    layout/     AppLayout.tsx · Sidebar.tsx · Header.tsx
    dashboard/  MetricCard.tsx · RatingSummary.tsx · RatingTrend.tsx · ProblemAreas.tsx · WakeUpCall.tsx
    reviews/    ReviewCard.tsx · ReviewTable.tsx
    analysis/   ReviewAnalysis.tsx · EvidenceCard.tsx · PeerComparison.tsx ·
                PositiveReviewComparison.tsx · RootCauseCard.tsx · RemedyCard.tsx
    action/     ActionPlan.tsx · ActionItem.tsx
    impact/     ImprovementSummary.tsx · BeforeAfterComparison.tsx · ImpactTimeline.tsx ·
                ImpactMetric.tsx · ImprovementStatus.tsx
  pages/      LoginPage.tsx · DashboardPage.tsx · ReviewsPage.tsx · AnalysisPage.tsx ·
              ActionPlanPage.tsx · ImpactPage.tsx
```

(`types/`, `data/`, and `services/` are owned by the data & analysis plans; this document only
consumes their exported names.)

## Appendix B — Build-phase alignment (frontend slices of the 17 phases)

| Phase | Frontend deliverable |
|---|---|
| 1 Foundation | `main.tsx` (no StrictMode), `App.tsx`, `theme.ts`, `GlobalStyle.ts`, vite/tsconfig/eslint, antd v4 CSS import, **smoke-test Table + Tooltip** |
| 3 User/Restaurant Context | `useRIAStore.ts`, `useVisibleReviews`, `routes.tsx`, `ProtectedRoute`, `AppLayout` + `Sidebar` + `Header`, `LoginPage` |
| 4 Dashboard | `DashboardPage` + MetricCard, RatingSummary, RatingTrend, ProblemAreas, WakeUpCall |
| 5 Reviews | `ReviewsPage` + ReviewTable, ReviewCard |
| 6–10 Analysis engine → Remedy | `AnalysisPage` + ReviewAnalysis, EvidenceCard, PeerComparison, PositiveReviewComparison, RootCauseCard, RemedyCard |
| 11 Action Plan | `ActionPlanPage` + ActionPlan, ActionItem; `createAction`/`updateActionStatus` wiring |
| 12–14 Before/After → Continuous | `ImpactPage` + ImprovementSummary, BeforeAfterComparison, ImpactTimeline, ImpactMetric, ImprovementStatus; `collectNewReviews`; next-remedy loop |
| 15 UX Polish | spacing, empty states (`Result`), loading, responsive `Row`/`Col` |
| 16 Demo Scenarios | verify the 6 scenarios render; scenario 5 "Improvement Confirmed", scenario 6 "No Significant Improvement" + next remedy |
| 17 QA | re-enable strict unused checks, `Reset Demo` verification, capture `demo/` screenshot from `npm run preview` |
```
