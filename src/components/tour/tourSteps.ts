/**
 * The guided tour retraces the closed loop end to end: dashboard → reviews → analysis →
 * action plan → impact. Each step names a `data-tour` anchor already present on the real
 * page (see the matching component/page files) — no separate "tour mode" UI to keep in sync.
 */
export interface TourStep {
  id: string;
  /** '/analysis' is resolved to `/analysis/:reviewId` at runtime. */
  route: '/dashboard' | '/reviews' | '/analysis' | '/action-plan' | '/impact';
  target: string;
  title: string;
  body: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard-metrics',
    route: '/dashboard',
    target: 'dashboard-metrics',
    title: 'The moment you log in',
    body: 'Average rating, negative volume, the #1 problem, and your peer rank — the headline numbers, before anything else.',
  },
  {
    id: 'dashboard-wakeup',
    route: '/dashboard',
    target: 'dashboard-wakeup',
    title: 'Something is wrong — named',
    body: 'RIA leads with the dominant problem instead of a wall of reviews to sift through. One click jumps straight into the analysis.',
  },
  {
    id: 'dashboard-trend',
    route: '/dashboard',
    target: 'dashboard-trend',
    title: 'Where the rating is headed',
    body: 'Rating distribution and the month-by-month trend, so a dip is visible before it becomes a pattern.',
  },
  {
    id: 'dashboard-problems',
    route: '/dashboard',
    target: 'dashboard-problems',
    title: 'Every problem, ranked',
    body: 'A single review can carry more than one issue. Severity blends how often it comes up, how negative it is, and how much it drags the rating.',
  },
  {
    id: 'reviews-table',
    route: '/reviews',
    target: 'reviews-table',
    title: 'The raw voice',
    body: 'Every chart and count on the dashboard links back here, pre-filtered. This is the evidence behind the numbers.',
  },
  {
    id: 'analysis-review',
    route: '/analysis',
    target: 'analysis-review',
    title: 'One review, fully diagnosed',
    body: 'Pick a complaint and RIA classifies it against 13 problem categories automatically — multi-label, not just one tag.',
  },
  {
    id: 'analysis-peer',
    route: '/analysis',
    target: 'analysis-peer',
    title: 'Benchmarked against peers',
    body: 'The same menu item, priced and rated at other restaurants. Is this a pricing problem, or a perception problem?',
  },
  {
    id: 'analysis-rootcause',
    route: '/analysis',
    target: 'analysis-rootcause',
    title: 'Beyond classification',
    body: 'A causal statement synthesized from the problem, the peer benchmark, and what happy customers of winning peers praise — with a confidence score and attached evidence.',
  },
  {
    id: 'analysis-remedy',
    route: '/analysis',
    target: 'analysis-remedy',
    title: 'A specific remedy, not "improve service"',
    body: 'Tiered, actionable steps — try-first and an escalation. Add it to the Action Plan to start tracking it.',
  },
  {
    id: 'action-plan',
    route: '/action-plan',
    target: 'action-plan',
    title: 'Track the fix',
    body: 'Every remedy becomes a tracked action moving through Detected → Remedied → Monitoring → Confirmed. "Collect New Reviews" releases the next batch of feedback to test it.',
  },
  {
    id: 'impact',
    route: '/impact',
    target: 'impact',
    title: 'Did it actually work?',
    body: 'Before/after, threshold-gated: Improvement Confirmed, Monitoring, or No Significant Improvement — which automatically surfaces the next remedy to try.',
  },
];
