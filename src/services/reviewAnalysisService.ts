import { ProblemCategory, Sentiment } from '../types';
import type { DetectedProblem, Rating, Review, ReviewAnalysis } from '../types';
import type { SeedData } from '../data/seed';
import { matchLexicon } from './lexicon';
import { SEVERITY_WEIGHTS } from './thresholds';
import { scoreSentiment, aggregateSentiment } from './sentimentService';
import { comparePeers } from './peerComparisonService';
import { findPositiveComparisons } from './positiveReviewService';
import { deriveRootCause } from './rootCauseService';
import { getRemedy } from './remedyService';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

// Multi-label classification for one review. Authored tags win; lexicon is the fallback.
export function classifyReview(review: Review): { categories: ProblemCategory[]; sentiment: Sentiment; isNegative: boolean } {
  const categories = review.tags ? review.tags.categories : matchLexicon(review.comment);
  const sentiment = review.tags ? review.tags.sentiment : scoreSentiment(review.comment).sentiment;
  return { categories, sentiment, isNegative: review.rating < 3 };
}

// Aggregate negative reviews into one DetectedProblem per category (severity-sorted).
export function detectProblems(reviews: Review[]): DetectedProblem[] {
  const negatives = reviews.filter((r) => r.rating < 3);
  const byCat = new Map<ProblemCategory, Review[]>();
  for (const r of negatives) {
    for (const c of classifyReview(r).categories) {
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c)!.push(r);
    }
  }
  const maxFreq = Math.max(1, ...[...byCat.values()].map((a) => a.length));
  const problems: DetectedProblem[] = [...byCat.entries()].map(([category, mentions]) => {
    const frequency = mentions.length;
    const avgRatingWhenMentioned = mean(mentions.map((r) => r.rating));
    const freqScore = clamp(frequency / maxFreq, 0, 1);
    const negScore = clamp(-aggregateSentiment(mentions), 0, 1);
    const dragScore = clamp((3 - avgRatingWhenMentioned) / 2, 0, 1);
    const severity = Math.round(100 * (SEVERITY_WEIGHTS.freq * freqScore + SEVERITY_WEIGHTS.neg * negScore + SEVERITY_WEIGHTS.drag * dragScore));
    const exampleReviewIds = [...mentions].sort((a, b) => a.rating - b.rating).slice(0, 3).map((r) => r.id);
    return { category, severity, frequency, affectedReviewIds: mentions.map((r) => r.id), avgRatingWhenMentioned: round1(avgRatingWhenMentioned), exampleReviewIds };
  });
  return problems.sort((a, b) => b.severity - a.severity);
}

export function computeProblemAreas(restaurantId: string, _data: SeedData, visibleReviews: Review[]): DetectedProblem[] {
  return detectProblems(visibleReviews.filter((r) => r.restaurantId === restaurantId));
}

export function computeRatingTrend(reviews: Review[], bucket: 'week' | 'month' = 'month'): Array<{ date: string; avgRating: number; count: number }> {
  const keyOf = (iso: string) => (bucket === 'month' ? iso.slice(0, 7) : iso.slice(0, 10));
  const groups = new Map<string, number[]>();
  for (const r of reviews) {
    const k = keyOf(r.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r.rating);
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, ratings]) => ({ date, avgRating: round1(mean(ratings)), count: ratings.length }));
}

/**
 * Inserts the months that have no reviews.
 *
 * computeRatingTrend only emits buckets that contain data, and a categorical x-axis spaces
 * whatever it is given evenly — so a three-month hole renders as one short step and the line
 * draws a confident slope across months nobody reviewed. Filling the gaps with nulls lets the
 * axis keep real proportions and the line break where the evidence does.
 *
 * Month arithmetic is done on the ISO string (no `new Date`) to stay inside the determinism
 * rule the rest of the data layer follows.
 */
export function fillMonthGaps(
  points: Array<{ date: string; avgRating: number; count: number }>,
): Array<{ date: string; avgRating: number | null; count: number }> {
  if (points.length === 0) return [];

  const byMonth = new Map(points.map((p) => [p.date, p]));
  const [startYear, startMonth] = points[0].date.split('-').map(Number);
  const [endYear, endMonth] = points[points.length - 1].date.split('-').map(Number);

  const out: Array<{ date: string; avgRating: number | null; count: number }> = [];
  let year = startYear;
  let month = startMonth;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const hit = byMonth.get(key);
    out.push(hit ? { ...hit } : { date: key, avgRating: null, count: 0 });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out;
}

export interface PeriodDelta {
  latestLabel: string;
  previousLabel: string;
  avgRating: number;
  avgRatingDelta: number;
  negativeCount: number;
  negativeDelta: number;
}

/**
 * Movement between the two most recent months that actually have reviews.
 *
 * Deliberately not "last 30 days": the demo's dates are authored, so anything derived from the
 * wall clock would drift away from the data. Comparing the two latest populated buckets is
 * well-defined, needs no clock, and can be named in the UI ("vs Jul") so nobody has to guess
 * what the number is measured against. Null when there is nothing to compare.
 */
export function computeMonthlyDeltas(reviews: Review[]): PeriodDelta | null {
  const byMonth = new Map<string, Review[]>();
  for (const r of reviews) {
    const key = r.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(r);
  }

  const months = [...byMonth.keys()].sort();
  if (months.length < 2) return null;

  const latest = byMonth.get(months[months.length - 1])!;
  const previous = byMonth.get(months[months.length - 2])!;
  const negatives = (rs: Review[]) => rs.filter((r) => r.rating < 3).length;

  const latestAvg = round1(mean(latest.map((r) => r.rating)));
  const previousAvg = round1(mean(previous.map((r) => r.rating)));

  return {
    latestLabel: months[months.length - 1],
    previousLabel: months[months.length - 2],
    avgRating: latestAvg,
    avgRatingDelta: round1(latestAvg - previousAvg),
    negativeCount: negatives(latest),
    negativeDelta: negatives(latest) - negatives(previous),
  };
}

export function computeRatingSummary(reviews: Review[]): { avg: number; distribution: Record<Rating, number>; total: number } {
  const distribution: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) distribution[r.rating] += 1;
  return { avg: round1(mean(reviews.map((r) => r.rating))), distribution, total: reviews.length };
}

// Orchestrator — runs the whole analysis pipeline for one review. Null if the id is unknown.
export function analyzeReview(reviewId: string, data: SeedData, visibleReviews: Review[]): ReviewAnalysis | null {
  const review = data.reviews.find((r) => r.id === reviewId);
  if (!review) return null;

  const restaurantReviews = visibleReviews.filter((r) => r.restaurantId === review.restaurantId);
  const problems = detectProblems(restaurantReviews);
  const reviewCats = classifyReview(review).categories;

  let primary = problems.find((p) => reviewCats.includes(p.category)) ?? problems[0];
  if (!primary) {
    const cat = reviewCats[0] ?? ProblemCategory.Service;
    primary = { category: cat, severity: 0, frequency: 0, affectedReviewIds: [review.id], avgRatingWhenMentioned: review.rating, exampleReviewIds: [review.id] };
  }

  const peer = comparePeers(review.restaurantId, review.catalogItemId, data);
  const positive = findPositiveComparisons(review.restaurantId, primary.category, review.catalogItemId, data);
  const rootCause = deriveRootCause(primary, review.restaurantId, data, peer, positive);
  const remedy = getRemedy(primary.category, rootCause);

  return { review, problems, peer, positive, rootCause, remedy };
}
