import type { ProblemCategory } from './enums';
import type { Review } from './domain';

export interface Evidence {
  type: 'review' | 'peer' | 'positive-review' | 'metric';
  reviewId?: string;
  label: string;
  detail: string;
}

export interface DetectedProblem {
  category: ProblemCategory;
  severity: number; // 0–100
  frequency: number;
  affectedReviewIds: string[];
  avgRatingWhenMentioned: number;
  exampleReviewIds: string[];
}

export interface PeerComparisonResult {
  catalogItemId: string;
  itemName: string;
  myPrice: number;
  peerAvgPrice: number;
  priceDeltaPct: number;
  pricePercentile: number;
  myAvgRating: number;
  peerAvgRating: number;
  ratingGap: number;
  rank: number;
  peerCount: number;
}

export interface PositiveReviewComparison {
  category: ProblemCategory;
  positiveThemes: string[];
  negativeThemes: string[];
  positiveExampleIds: string[];
  contrast: string;
}

export interface RootCause {
  id: string;
  category: ProblemCategory;
  statement: string; // beyond classification
  evidence: Evidence[];
  peerContext?: PeerComparisonResult;
  positiveContext?: PositiveReviewComparison;
  confidence: number; // 0–1
}

export interface Remedy {
  id: string;
  category: ProblemCategory;
  title: string; // SPECIFIC
  description: string;
  specificActions: string[];
  expectedImpact: string;
  tier: 1 | 2;
  targetMetric: 'avgRating' | 'categoryComplaints' | 'peerGap' | 'sentiment';
}

export interface ReviewAnalysis {
  review: Review;
  problems: DetectedProblem[];
  peer: PeerComparisonResult | null;
  positive: PositiveReviewComparison | null;
  rootCause: RootCause;
  remedy: Remedy;
}
