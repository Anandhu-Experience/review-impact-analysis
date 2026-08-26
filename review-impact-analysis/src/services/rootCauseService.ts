import { ProblemCategory } from '../types';
import type { DetectedProblem, Evidence, PeerComparisonResult, PositiveReviewComparison, RootCause } from '../types';
import type { SeedData } from '../data/seed';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// Per-category rules that synthesize a "beyond classification" statement from the problem +
// peer benchmark + positive contrast. Collapses co-occurring symptoms into one causal "why".
function statementFor(
  problem: DetectedProblem,
  peer: PeerComparisonResult | null,
  _positive: PositiveReviewComparison | null,
): string {
  const freq = problem.frequency;
  const gap = peer ? Math.abs(peer.ratingGap).toFixed(1) : null;
  const pricePct = peer ? Math.round(peer.priceDeltaPct) : null;

  switch (problem.category) {
    case ProblemCategory.Price:
      return peer && peer.priceDeltaPct > 0 && peer.ratingGap < 0
        ? `Your ${peer.itemName} is priced ${pricePct}% above the ${peer.peerCount}-peer average yet rates ${gap}★ lower — customers reject the value, not the price itself. Root cause: a price-to-value gap, not an absolute pricing error.`
        : `Price is flagged across ${freq} negative reviews; the value perception is weaker than comparable restaurants. Root cause: a price-to-value gap.`;
    case ProblemCategory.WaitingTime:
      return `Wait complaints cluster in ${freq} negative reviews, concentrated at peak. Peers serving the same item turn tickets faster at similar volume. Root cause: peak-window throughput, not kitchen capacity.`;
    case ProblemCategory.Quantity:
      return `Portion size is flagged in ${freq} negative reviews${peer ? `; peers at a comparable price out-rate you by ${gap}★ with visibly larger portions` : ''}. Root cause: portion weight is too low for the price point — a value-perception problem.`;
    case ProblemCategory.Quality:
      return `Quality issues (temperature, freshness, execution) appear in ${freq} negative reviews${peer ? `, while peers out-rate you by ${gap}★ on the same dish` : ''}. Root cause: inconsistent kitchen execution and hold times, not the recipe.`;
    case ProblemCategory.Service:
      return `Service is cited in ${freq} negative reviews — slow greets, missed check-backs, inattentiveness. Root cause: no floor ownership of the service cadence at peak, not staff attitude alone.`;
    case ProblemCategory.Availability:
      return `Stock-outs drive ${freq} negative reviews — top items sell out mid-service. Root cause: par levels and prep forecasting are set below real demand.`;
    default:
      return `${problem.category} is the dominant complaint across ${freq} negative reviews${peer ? `, and peers out-rate you by ${gap}★ on the same item` : ''}. Root cause: this dimension is materially below comparable restaurants.`;
  }
}

export function deriveRootCause(
  problem: DetectedProblem,
  restaurantId: string,
  data: SeedData,
  peer: PeerComparisonResult | null,
  positive: PositiveReviewComparison | null,
): RootCause {
  const evidence: Evidence[] = [];

  const exampleId = problem.exampleReviewIds[0] ?? problem.affectedReviewIds[0];
  const example = data.reviews.find((r) => r.id === exampleId);
  if (example) {
    evidence.push({ type: 'review', reviewId: example.id, label: 'Customer says', detail: `"${example.comment}" (${example.rating}★)` });
  }
  evidence.push({
    type: 'metric',
    label: `${problem.category} frequency`,
    detail: `Cited in ${problem.frequency} negative reviews · avg ${problem.avgRatingWhenMentioned.toFixed(1)}★ when mentioned`,
  });
  if (peer) {
    evidence.push({
      type: 'peer',
      label: 'Peer benchmark',
      detail: `Your ${peer.itemName}: ${peer.myAvgRating}★ / $${peer.myPrice} vs peers ${peer.peerAvgRating}★ / $${peer.peerAvgPrice} (rank ${peer.rank}/${peer.peerCount + 1})`,
    });
  }
  if (positive) {
    evidence.push({ type: 'positive-review', label: 'Peers praised', detail: positive.contrast });
  }

  const base = 0.4 + (problem.severity / 100) * 0.3;
  const confidence = clamp(base + (peer ? 0.15 : 0) + (positive ? 0.15 : 0), 0, 1);

  return {
    id: `rc-${restaurantId}-${problem.category}`,
    category: problem.category,
    statement: statementFor(problem, peer, positive),
    evidence,
    peerContext: peer ?? undefined,
    positiveContext: positive ?? undefined,
    confidence: Math.round(confidence * 100) / 100,
  };
}
