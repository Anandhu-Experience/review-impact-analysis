import type { ProblemCategory, Priority, ActionStatus } from './enums';

export interface MetricSnapshot {
  windowLabel: 'Before' | 'After';
  asOfDate: string;
  reviewCount: number;
  avgRating: number;
  negativeCount: number;
  positiveCount: number;
  complaintFrequency: Partial<Record<ProblemCategory, number>>;
  sentimentScore: number; // -1..1
  peerGap: number;
}

export interface ImpactResult {
  actionId: string;
  targetCategory: ProblemCategory;
  before: MetricSnapshot;
  after: MetricSnapshot;
  deltas: {
    avgRating: number;
    negativeCount: number;
    positiveCount: number;
    targetCategoryComplaints: number;
    sentiment: number;
    peerGap: number;
  };
  verdict: 'Improvement Confirmed' | 'Monitoring — more feedback needed' | 'No Significant Improvement';
  nextRemedyId?: string;
  narrative: string;
}

export interface ActionItem {
  id: string;
  restaurantId: string;
  remedyId: string;
  rootCauseId: string;
  scenarioId: string;
  action: string;
  category: ProblemCategory;
  owner: string;
  priority: Priority;
  status: ActionStatus;
  createdDate: string;
  targetDate: string;
  beforeSnapshot?: MetricSnapshot;
  afterSnapshot?: MetricSnapshot;
  impactResult?: ImpactResult;
}
