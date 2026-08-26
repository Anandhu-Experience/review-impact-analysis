import { ProblemCategory } from '../types';

// A scripted before/after demo case. `expectedOutcome` is QA-only intent and is NEVER read
// by computeImpact — the verdict falls out of the authored review deltas vs. thresholds.
export interface Scenario {
  id: string;
  restaurantId: string;
  targetCategory: ProblemCategory;
  targetCatalogItemId?: string;
  actionDate: string; // ISO cutoff dividing baseline/post-action
  expectedOutcome: 'improved' | 'unchanged';
  baselineReviewIds: string[];
  postActionReviewIds: string[];
  seededRemedyTier1Id: string;
  seededRemedyTier2Id: string;
}

const range = (prefix: string, start: number, end: number): string[] => {
  const out: string[] = [];
  for (let i = start; i <= end; i++) out.push(`${prefix}${String(i).padStart(4, '0')}`);
  return out;
};

export const scenarios: Scenario[] = [
  {
    id: 'scn-01', restaurantId: 'rst-01', targetCategory: ProblemCategory.Price, targetCatalogItemId: 'cat-01',
    actionDate: '2026-03-01', expectedOutcome: 'improved',
    baselineReviewIds: range('rev-', 1, 10), postActionReviewIds: range('rev-', 111, 116),
    seededRemedyTier1Id: 'rem-Price-t1', seededRemedyTier2Id: 'rem-Price-t2',
  },
  {
    id: 'scn-02', restaurantId: 'rst-02', targetCategory: ProblemCategory.Quality, targetCatalogItemId: 'cat-06',
    actionDate: '2026-03-01', expectedOutcome: 'improved',
    baselineReviewIds: range('rev-', 11, 20), postActionReviewIds: range('rev-', 117, 122),
    seededRemedyTier1Id: 'rem-Quality-t1', seededRemedyTier2Id: 'rem-Quality-t2',
  },
  {
    id: 'scn-03', restaurantId: 'rst-03', targetCategory: ProblemCategory.Service, targetCatalogItemId: 'cat-04',
    actionDate: '2026-03-01', expectedOutcome: 'improved',
    baselineReviewIds: range('rev-', 21, 30), postActionReviewIds: range('rev-', 123, 128),
    seededRemedyTier1Id: 'rem-Service-t1', seededRemedyTier2Id: 'rem-Service-t2',
  },
  {
    id: 'scn-04', restaurantId: 'rst-04', targetCategory: ProblemCategory.Availability, targetCatalogItemId: 'cat-03',
    actionDate: '2026-03-01', expectedOutcome: 'improved',
    baselineReviewIds: range('rev-', 31, 40), postActionReviewIds: range('rev-', 129, 134),
    seededRemedyTier1Id: 'rem-Availability-t1', seededRemedyTier2Id: 'rem-Availability-t2',
  },
  {
    // HERO — Scenario 5: WaitingTime at Thai Orchid → Improvement Confirmed
    id: 'scn-05', restaurantId: 'rst-05', targetCategory: ProblemCategory.WaitingTime, targetCatalogItemId: 'cat-07',
    actionDate: '2026-03-01', expectedOutcome: 'improved',
    baselineReviewIds: range('rev-', 41, 50), postActionReviewIds: range('rev-', 135, 142),
    seededRemedyTier1Id: 'rem-WaitingTime-t1', seededRemedyTier2Id: 'rem-WaitingTime-t2',
  },
  {
    // FAILED REMEDY — Scenario 6: Quality at Pizza Corner → No Significant Improvement → next remedy
    id: 'scn-06', restaurantId: 'rst-06', targetCategory: ProblemCategory.Quality, targetCatalogItemId: 'cat-01',
    actionDate: '2026-03-01', expectedOutcome: 'unchanged',
    baselineReviewIds: range('rev-', 51, 60), postActionReviewIds: range('rev-', 143, 149),
    seededRemedyTier1Id: 'rem-Quality-t1', seededRemedyTier2Id: 'rem-Quality-t2',
  },
];
