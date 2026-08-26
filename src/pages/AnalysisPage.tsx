import { useMemo } from 'react';
import { Result, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useRIAStore, useVisibleReviews } from '../store/useRIAStore';
import { seed } from '../data/seed';
import { analyzeReview } from '../services/reviewAnalysisService';
import { ReviewAnalysis } from '../components/analysis/ReviewAnalysis';
import type { Remedy } from '../types';

export default function AnalysisPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const visibleReviews = useVisibleReviews();
  const actionItems = useRIAStore((s) => s.actionItems);
  const createAction = useRIAStore((s) => s.createAction);

  const analysis = useMemo(
    () => (reviewId ? analyzeReview(reviewId, seed, visibleReviews) : null),
    [reviewId, visibleReviews],
  );

  if (!analysis) {
    return (
      <Result
        status="404"
        title="Review not found"
        extra={<Button type="primary" onClick={() => navigate('/reviews')}>Back to reviews</Button>}
      />
    );
  }

  const itemName = seed.menuCatalog.find((c) => c.id === analysis.review.catalogItemId)?.name ?? analysis.review.foodCategory;
  const alreadyPlanned = actionItems.some((a) => a.remedyId === analysis.remedy.id && a.restaurantId === analysis.review.restaurantId);
  const scenarioId = analysis.review.scenarioId;

  const onCreateAction = (remedy: Remedy) => {
    if (!scenarioId) {
      message.warning('This review is not linked to a tracked scenario.');
      return;
    }
    createAction({ remedy, rootCause: analysis.rootCause, scenarioId });
    message.success('Added to Action Plan');
    navigate('/action-plan');
  };

  return (
    <ReviewAnalysis
      analysis={analysis}
      itemName={itemName}
      alreadyPlanned={alreadyPlanned}
      onCreateAction={onCreateAction}
    />
  );
}
