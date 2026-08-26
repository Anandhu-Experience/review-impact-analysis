import { useMemo, useState } from 'react';
import { Card, Segmented, Select, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useVisibleReviews } from '../store/useRIAStore';
import { seed } from '../data/seed';
import { classifyReview } from '../services/reviewAnalysisService';
import { ReviewTable } from '../components/reviews/ReviewTable';
import { ProblemCategory } from '../types';
import type { Review } from '../types';

const nameOf = (r: Review) => seed.menuCatalog.find((c) => c.id === r.catalogItemId)?.name ?? r.foodCategory;

export default function ReviewsPage() {
  const navigate = useNavigate();
  const visibleReviews = useVisibleReviews();
  const [ratingFilter, setRatingFilter] = useState<'below3' | 'all'>('below3');
  const [category, setCategory] = useState<ProblemCategory | 'all'>('all');

  const categoriesPresent = useMemo(() => {
    const set = new Set<ProblemCategory>();
    visibleReviews.forEach((r) => r.tags?.categories.forEach((c) => set.add(c)));
    return [...set];
  }, [visibleReviews]);

  const rows = useMemo(() => {
    let rs = [...visibleReviews];
    if (ratingFilter === 'below3') rs = rs.filter((r) => r.rating < 3);
    if (category !== 'all') rs = rs.filter((r) => r.tags?.categories.includes(category));
    return rs.sort((a, b) => a.rating - b.rating || (a.date < b.date ? 1 : -1));
  }, [visibleReviews, ratingFilter, category]);

  return (
    <Card
      title={<Typography.Text strong>Reviews</Typography.Text>}
      extra={
        <Space wrap>
          <Segmented
            value={ratingFilter}
            onChange={(v) => setRatingFilter(v as 'below3' | 'all')}
            options={[{ label: 'Below 3★ (actionable)', value: 'below3' }, { label: 'All', value: 'all' }]}
          />
          <Select
            style={{ minWidth: 160 }}
            value={category}
            onChange={setCategory}
            options={[{ value: 'all', label: 'All categories' }, ...categoriesPresent.map((c) => ({ value: c, label: c }))]}
          />
        </Space>
      }
    >
      <ReviewTable
        reviews={rows}
        classify={classifyReview}
        itemNameOf={nameOf}
        onAnalyze={(id) => navigate(`/analysis/${id}`)}
      />
    </Card>
  );
}
