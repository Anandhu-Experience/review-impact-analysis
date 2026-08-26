import { ReviewPhase } from '../types';
import type { ActionItem, ImpactResult, MetricSnapshot, ProblemCategory, Review } from '../types';
import type { SeedData } from '../data/seed';
import type { Scenario } from '../data/scenarios';
import { detectProblems } from './reviewAnalysisService';
import { aggregateSentiment } from './sentimentService';
import { comparePeers } from './peerComparisonService';
import { MIN_AFTER_REVIEWS, MIN_AVG_RATING_DELTA, MIN_COMPLAINT_DROP, MIN_SENTIMENT_DELTA } from './thresholds';
import { getNextRemedy } from './remedyService';

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

// The gating primitive: baseline reviews always; post-action reviews only for released scenarios.
export function getVisibleReviews(restaurantId: string, releasedScenarioIds: string[], data: SeedData): Review[] {
  return data.reviews.filter(
    (r) =>
      r.restaurantId === restaurantId &&
      (r.phase === ReviewPhase.Baseline ||
        (r.phase === ReviewPhase.PostAction && !!r.scenarioId && releasedScenarioIds.includes(r.scenarioId))),
  );
}

function complaintFrequency(reviews: Review[]): Partial<Record<ProblemCategory, number>> {
  const out: Partial<Record<ProblemCategory, number>> = {};
  for (const p of detectProblems(reviews)) out[p.category] = p.frequency;
  return out;
}

// One phase window's metrics.
export function captureSnapshot(restaurantId: string, scenario: Scenario, phase: ReviewPhase, data: SeedData): MetricSnapshot {
  const ids = phase === ReviewPhase.Baseline ? scenario.baselineReviewIds : scenario.postActionReviewIds;
  const idSet = new Set(ids);
  const reviews = data.reviews.filter((r) => idSet.has(r.id));

  // peerGap = (window avg rating on the target item) - (peer avg rating on that item)
  let peerGap = 0;
  if (scenario.targetCatalogItemId) {
    const windowItem = reviews.filter((r) => r.catalogItemId === scenario.targetCatalogItemId);
    const myWindowAvg = mean(windowItem.map((r) => r.rating));
    const peer = comparePeers(restaurantId, scenario.targetCatalogItemId, data);
    if (peer && myWindowAvg > 0) peerGap = round1(myWindowAvg - peer.peerAvgRating);
  }

  return {
    windowLabel: phase === ReviewPhase.Baseline ? 'Before' : 'After',
    asOfDate: reviews.reduce((max, r) => (r.date > max ? r.date : max), reviews[0]?.date ?? scenario.actionDate),
    reviewCount: reviews.length,
    avgRating: round2(mean(reviews.map((r) => r.rating))),
    negativeCount: reviews.filter((r) => r.rating < 3).length,
    positiveCount: reviews.filter((r) => r.rating >= 4).length,
    complaintFrequency: complaintFrequency(reviews),
    sentimentScore: round2(aggregateSentiment(reviews)),
    peerGap,
  };
}

// Before vs after deltas + threshold-gated verdict.
export function computeImpact(action: ActionItem, data: SeedData, _releasedScenarioIds: string[]): ImpactResult {
  const scenario = data.scenarios.find((s) => s.id === action.scenarioId);
  if (!scenario) throw new Error(`computeImpact: unknown scenario ${action.scenarioId}`);

  const before = captureSnapshot(action.restaurantId, scenario, ReviewPhase.Baseline, data);
  const after = captureSnapshot(action.restaurantId, scenario, ReviewPhase.PostAction, data);
  const tgt = action.category;

  const beforeC = before.complaintFrequency[tgt] ?? 0;
  const afterC = after.complaintFrequency[tgt] ?? 0;
  const deltas = {
    avgRating: round2(after.avgRating - before.avgRating),
    negativeCount: after.negativeCount - before.negativeCount,
    positiveCount: after.positiveCount - before.positiveCount,
    targetCategoryComplaints: afterC - beforeC, // negative = fewer complaints
    sentiment: round2(after.sentimentScore - before.sentimentScore),
    peerGap: round1(after.peerGap - before.peerGap),
  };
  const complaintDrop = beforeC - afterC; // positive = improvement

  let verdict: ImpactResult['verdict'];
  let nextRemedyId: string | undefined;
  if (after.reviewCount < MIN_AFTER_REVIEWS) {
    verdict = 'Monitoring — more feedback needed';
  } else if (
    deltas.avgRating >= MIN_AVG_RATING_DELTA &&
    complaintDrop >= MIN_COMPLAINT_DROP &&
    deltas.sentiment >= MIN_SENTIMENT_DELTA
  ) {
    verdict = 'Improvement Confirmed';
  } else {
    verdict = 'No Significant Improvement';
    nextRemedyId = getNextRemedy(tgt, action.remedyId)?.id;
  }

  const narrative = buildNarrative(verdict, deltas, complaintDrop, beforeC, after.reviewCount, tgt);

  return { actionId: action.id, targetCategory: tgt, before, after, deltas, verdict, nextRemedyId, narrative };
}

function buildNarrative(
  verdict: ImpactResult['verdict'],
  deltas: ImpactResult['deltas'],
  complaintDrop: number,
  beforeC: number,
  afterCount: number,
  tgt: ProblemCategory,
): string {
  const ratingPart = `${deltas.avgRating >= 0 ? '+' : ''}${deltas.avgRating}★`;
  const dropPct = beforeC > 0 ? Math.round((complaintDrop / beforeC) * 100) : 0;
  if (verdict === 'Improvement Confirmed') {
    return `Average rating rose ${ratingPart} and ${tgt} complaints fell ${dropPct}% across ${afterCount} new reviews — improvement confirmed.`;
  }
  if (verdict === 'Monitoring — more feedback needed') {
    return `Only ${afterCount} new reviews so far — not enough evidence yet. Monitoring; collect more feedback.`;
  }
  return `Rating moved ${ratingPart} and ${tgt} complaints barely changed (${dropPct}% drop) across ${afterCount} new reviews — no significant improvement. A different remedy is recommended.`;
}
