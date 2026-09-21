import { useEffect, useMemo, useState } from 'react';
import { Result, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useRIAStore, useVisibleReviews } from '../store/useRIAStore';
import { seed } from '../data/seed';
import { analyzeReview } from '../services/reviewAnalysisService';
import { reviewsLink } from '../services/reviewFilters';
import { requestAiAnalysis } from '../lib/aiAnalysis';
import type { AiState } from '../components/analysis/RootCauseCard';
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

  // The rule-based analysis renders first and stays if the model never answers — the page is
  // never blocked on the network, and never blank.
  const [ai, setAi] = useState<AiState | undefined>(undefined);

  useEffect(() => {
    if (!analysis) return;
    const restaurant = seed.restaurants.find((r) => r.id === analysis.review.restaurantId);
    const problem =
      analysis.problems.find((p) => p.category === analysis.rootCause.category) ?? analysis.problems[0];
    if (!restaurant || !problem) return;

    let cancelled = false;
    setAi({ status: 'loading' });

    void requestAiAnalysis({
      restaurantName: restaurant.name,
      cuisine: restaurant.cuisine,
      review: analysis.review,
      itemName:
        seed.menuCatalog.find((c) => c.id === analysis.review.catalogItemId)?.name ??
        analysis.review.foodCategory,
      problem,
      peer: analysis.peer,
      positive: analysis.positive,
    }).then((outcome) => {
      if (cancelled) return;
      setAi(
        outcome.status === 'ok'
          ? { status: 'ok', result: outcome.result.analysis, model: outcome.result.model }
          : { status: 'unavailable', reason: outcome.reason },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [analysis]);

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
      onSelectCategory={(category) => navigate(reviewsLink({ category, scope: 'negative' }))}
      onSelectItem={(item) => navigate(reviewsLink({ item, scope: 'all' }))}
      ai={ai}
    />
  );
}
