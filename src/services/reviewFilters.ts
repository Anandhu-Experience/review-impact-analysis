import { ProblemCategory, ReviewPhase } from '../types';
import type { Rating, Review } from '../types';
import { classifyReview } from './reviewAnalysisService';

/**
 * The one filter vocabulary shared by every chart, count, and the Reviews list.
 *
 * Charts do not own a filtered view of their own — they link to /reviews with these params,
 * so "which reviews is this bar made of?" is answerable by clicking it, and the answer is a
 * URL you can share or reload.
 */
export type ReviewScope = 'negative' | 'positive' | 'all';

export interface ReviewFilters {
  scope: ReviewScope;
  rating: Rating | null;
  category: ProblemCategory | null;
  month: string | null; // YYYY-MM bucket, matching computeRatingTrend
  item: string | null; // catalogItemId
  phase: ReviewPhase | null; // before/after an action
  scenario: string | null; // the tracked case a before/after window belongs to
}

export const EMPTY_FILTERS: ReviewFilters = {
  scope: 'all',
  rating: null,
  category: null,
  month: null,
  item: null,
  phase: null,
  scenario: null,
};

const SCOPES: ReviewScope[] = ['negative', 'positive', 'all'];
const RATINGS: Rating[] = [1, 2, 3, 4, 5];

const isScope = (v: string | null): v is ReviewScope => !!v && SCOPES.includes(v as ReviewScope);
const isRating = (v: number): v is Rating => RATINGS.includes(v as Rating);
const isCategory = (v: string | null): v is ProblemCategory =>
  !!v && (Object.values(ProblemCategory) as string[]).includes(v);
const isPhase = (v: string | null): v is ReviewPhase =>
  !!v && (Object.values(ReviewPhase) as string[]).includes(v);

export function parseReviewFilters(params: URLSearchParams): ReviewFilters {
  const scopeParam = params.get('scope');
  const rating = Number(params.get('rating'));
  const month = params.get('month');

  const filters: ReviewFilters = {
    scope: isScope(scopeParam) ? scopeParam : 'negative',
    rating: isRating(rating) ? rating : null,
    category: isCategory(params.get('category')) ? (params.get('category') as ProblemCategory) : null,
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : null,
    item: params.get('item'),
    phase: isPhase(params.get('phase')) ? (params.get('phase') as ReviewPhase) : null,
    scenario: params.get('scenario'),
  };

  // Landing with no params at all keeps the actionable default (below 3★). But a link that
  // pins a rating/month/item/phase/category means "the reviews behind this number" — narrowing
  // it further to negatives would silently drop rows the chart just counted, so scope widens.
  const pinned =
    filters.rating || filters.category || filters.month || filters.item || filters.phase || filters.scenario;
  if (!isScope(scopeParam) && pinned) filters.scope = 'all';

  return filters;
}

export function reviewFilterParams(filters: Partial<ReviewFilters>): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.scope) params.set('scope', filters.scope);
  if (filters.rating) params.set('rating', String(filters.rating));
  if (filters.category) params.set('category', filters.category);
  if (filters.month) params.set('month', filters.month);
  if (filters.item) params.set('item', filters.item);
  if (filters.phase) params.set('phase', filters.phase);
  if (filters.scenario) params.set('scenario', filters.scenario);
  return params;
}

/** Destination for every clickable chart element and count in the app. */
export function reviewsLink(filters: Partial<ReviewFilters>): string {
  const qs = reviewFilterParams(filters).toString();
  return qs ? `/reviews?${qs}` : '/reviews';
}

export function applyReviewFilters(reviews: Review[], filters: ReviewFilters): Review[] {
  return reviews.filter((r) => {
    if (filters.scope === 'negative' && r.rating >= 3) return false;
    if (filters.scope === 'positive' && r.rating < 4) return false;
    if (filters.rating && r.rating !== filters.rating) return false;
    if (filters.month && r.date.slice(0, 7) !== filters.month) return false;
    if (filters.item && r.catalogItemId !== filters.item) return false;
    if (filters.phase && r.phase !== filters.phase) return false;
    if (filters.scenario && r.scenarioId !== filters.scenario) return false;
    if (filters.category && !classifyReview(r).categories.includes(filters.category)) return false;
    return true;
  });
}

export function hasActiveFilters(filters: ReviewFilters): boolean {
  return Boolean(
    filters.rating ||
      filters.category ||
      filters.month ||
      filters.item ||
      filters.phase ||
      filters.scenario ||
      filters.scope !== 'negative',
  );
}
