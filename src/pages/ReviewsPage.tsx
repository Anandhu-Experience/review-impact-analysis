import { useMemo } from 'react';
import { Button, Card, Segmented, Select, Space, Tag, Typography } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useVisibleReviews } from '../store/useRIAStore';
import { seed } from '../data/seed';
import { classifyReview } from '../services/reviewAnalysisService';
import {
  applyReviewFilters,
  hasActiveFilters,
  parseReviewFilters,
  reviewFilterParams,
  type ReviewFilters,
  type ReviewScope,
} from '../services/reviewFilters';
import { ReviewTable } from '../components/reviews/ReviewTable';
import { ProblemCategory, ReviewPhase } from '../types';
import type { Review } from '../types';

const nameOf = (r: Review) => seed.menuCatalog.find((c) => c.id === r.catalogItemId)?.name ?? r.foodCategory;

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

const PHASE_LABEL: Record<ReviewPhase, string> = {
  [ReviewPhase.Baseline]: 'Before action',
  [ReviewPhase.PostAction]: 'After action',
};

const SCOPE_OPTIONS = [
  { label: 'Below 3★ (actionable)', value: 'negative' },
  { label: 'Positive (4★+)', value: 'positive' },
  { label: 'All', value: 'all' },
];

/**
 * The list every chart point and count links into. Filters live in the URL, so a link from a
 * bar, a trend point, or a metric card is shareable and survives a reload.
 */
export default function ReviewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const visibleReviews = useVisibleReviews();

  const filters = useMemo(() => parseReviewFilters(searchParams), [searchParams]);

  const setFilters = (patch: Partial<ReviewFilters>) =>
    setSearchParams(reviewFilterParams({ ...filters, ...patch }), { replace: true });

  const categoriesPresent = useMemo(() => {
    const set = new Set<ProblemCategory>();
    visibleReviews.forEach((r) => classifyReview(r).categories.forEach((c) => set.add(c)));
    return [...set];
  }, [visibleReviews]);

  const rows = useMemo(
    () =>
      applyReviewFilters(visibleReviews, filters).sort(
        (a, b) => a.rating - b.rating || (a.date < b.date ? 1 : -1),
      ),
    [visibleReviews, filters],
  );

  // One chip per pinned dimension, each clearable on its own.
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.rating) {
    chips.push({ key: 'rating', label: `Rating · ${filters.rating}★`, clear: () => setFilters({ rating: null }) });
  }
  if (filters.category) {
    chips.push({ key: 'category', label: `Category · ${filters.category}`, clear: () => setFilters({ category: null }) });
  }
  if (filters.month) {
    chips.push({ key: 'month', label: `Month · ${monthLabel(filters.month)}`, clear: () => setFilters({ month: null }) });
  }
  if (filters.item) {
    const item = seed.menuCatalog.find((c) => c.id === filters.item);
    chips.push({ key: 'item', label: `Item · ${item?.name ?? filters.item}`, clear: () => setFilters({ item: null }) });
  }
  if (filters.phase) {
    chips.push({ key: 'phase', label: `Window · ${PHASE_LABEL[filters.phase]}`, clear: () => setFilters({ phase: null }) });
  }
  if (filters.scenario) {
    const scenario = seed.scenarios.find((s) => s.id === filters.scenario);
    chips.push({
      key: 'scenario',
      label: `Case · ${scenario?.targetCategory ?? filters.scenario}`,
      clear: () => setFilters({ scenario: null }),
    });
  }

  return (
    <Card
      data-tour="reviews-table"
      title={
        <div style={{ lineHeight: 1.3 }}>
          <Typography.Text strong>Reviews</Typography.Text>
          <div style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>
            {rows.length} of {visibleReviews.length} reviews
          </div>
        </div>
      }
      extra={
        <Space wrap>
          <Segmented
            value={filters.scope}
            onChange={(v) => setFilters({ scope: v as ReviewScope })}
            options={SCOPE_OPTIONS}
          />
          <Select
            style={{ minWidth: 160 }}
            value={filters.category ?? 'all'}
            onChange={(v) => setFilters({ category: v === 'all' ? null : (v as ProblemCategory) })}
            options={[
              { value: 'all', label: 'All categories' },
              ...categoriesPresent.map((c) => ({ value: c, label: c })),
            ]}
          />
        </Space>
      }
    >
      {chips.length > 0 || hasActiveFilters(filters) ? (
        <Space wrap size={6} style={{ marginBottom: 12 }}>
          {chips.map((c) => (
            <Tag key={c.key} color="blue" closable onClose={c.clear}>
              {c.label}
            </Tag>
          ))}
          {hasActiveFilters(filters) ? (
            <Button
              type="link"
              size="small"
              style={{ height: 22, padding: '0 4px' }}
              onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
            >
              Clear filters
            </Button>
          ) : null}
        </Space>
      ) : null}

      <ReviewTable
        reviews={rows}
        classify={classifyReview}
        itemNameOf={nameOf}
        onAnalyze={(id) => navigate(`/analysis/${id}`)}
      />
    </Card>
  );
}
