import { useMemo, useState } from 'react';
import { Result, Button, Row, Col, Select, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useRIAStore, useVisibleReviews } from '../store/useRIAStore';
import { seed } from '../data/seed';
import { computeRatingTrend } from '../services/reviewAnalysisService';
import { getNextRemedy } from '../services/remedyService';
import { reviewsLink, type ReviewFilters, type ReviewScope } from '../services/reviewFilters';
import { ImprovementSummary } from '../components/impact/ImprovementSummary';
import { BeforeAfterComparison } from '../components/impact/BeforeAfterComparison';
import { ImpactTimeline } from '../components/impact/ImpactTimeline';
import { ImpactMetric } from '../components/impact/ImpactMetric';
import { ImprovementStatus } from '../components/impact/ImprovementStatus';
import type { BeforeAfterMetric } from '../components/impact/BeforeAfterComparison';
import { ReviewPhase } from '../types';
import type { Remedy } from '../types';

export default function ImpactPage() {
  const navigate = useNavigate();
  const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId);
  const actionItems = useRIAStore((s) => s.actionItems);
  const createAction = useRIAStore((s) => s.createAction);
  const visibleReviews = useVisibleReviews();

  const measured = actionItems.filter((a) => a.restaurantId === activeRestaurantId && a.impactResult);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const action = measured.find((a) => a.id === selectedId) ?? measured[measured.length - 1];

  const timeline = useMemo(
    () => computeRatingTrend(visibleReviews, 'month').map((p) => ({ date: p.date, avgRating: p.avgRating })),
    [visibleReviews],
  );

  if (!action || !action.impactResult) {
    return (
      <Result
        title="No impact measured yet"
        subTitle="Collect new reviews on an action to see the before/after result."
        extra={<Button type="primary" onClick={() => navigate('/action-plan')}>Go to Action Plan</Button>}
      />
    );
  }

  const impact = action.impactResult;
  const scenario = seed.scenarios.find((s) => s.id === action.scenarioId);
  const actionDate = scenario?.actionDate ?? '2026-03-01';
  const beforeC = impact.before.complaintFrequency[action.category] ?? 0;
  const afterC = impact.after.complaintFrequency[action.category] ?? 0;

  const nextRemedy = impact.verdict === 'No Significant Improvement' ? getNextRemedy(action.category, action.remedyId) : undefined;

  // Every bar and number on this page stands for one window of this case's reviews.
  const goReviews = (filters: Partial<ReviewFilters>) =>
    navigate(reviewsLink({ scenario: action.scenarioId, ...filters }));

  // What a Before/After bar is counting decides the scope the drill-down opens with.
  const METRIC_FILTER: Record<BeforeAfterMetric, Partial<ReviewFilters>> = {
    avgRating: { scope: 'all' },
    negative: { scope: 'negative' },
    positive: { scope: 'positive' },
    complaints: { scope: 'negative', category: impact.targetCategory },
  };

  const goWindow = (phase: ReviewPhase, metric: BeforeAfterMetric) =>
    goReviews({ phase, ...METRIC_FILTER[metric] });

  const goPhase = (phase: ReviewPhase, scope: ReviewScope, category?: typeof impact.targetCategory) =>
    goReviews({ phase, scope, category });

  const applyNextRemedy = (remedy: Remedy) => {
    createAction({
      remedy,
      rootCause: { id: action.rootCauseId, category: remedy.category, statement: '', evidence: [], confidence: 0.8 },
      scenarioId: action.scenarioId,
    });
    message.success('Next remedy added to Action Plan');
    navigate('/action-plan');
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {measured.length > 1 && (
        <Select
          style={{ minWidth: 320 }}
          value={action.id}
          onChange={setSelectedId}
          options={measured.map((a) => ({ value: a.id, label: `${a.action} (${a.status})` }))}
        />
      )}

      <ImprovementSummary impact={impact} />

      <BeforeAfterComparison
        before={impact.before}
        after={impact.after}
        deltas={impact.deltas}
        targetCategory={impact.targetCategory}
        onSelectWindow={goWindow}
      />

      <ImpactTimeline
        points={timeline}
        actionDate={actionDate}
        onSelectMonth={(month) => navigate(reviewsLink({ month, scope: 'all' }))}
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <ImpactMetric
            label="Avg rating"
            before={impact.before.avgRating}
            after={impact.after.avgRating}
            delta={impact.deltas.avgRating}
            format="rating"
            goodDirection="up"
            onSelectBefore={() => goPhase(ReviewPhase.Baseline, 'all')}
            onSelectAfter={() => goPhase(ReviewPhase.PostAction, 'all')}
          />
        </Col>
        <Col xs={12} md={6}>
          <ImpactMetric
            label="Negative reviews"
            before={impact.before.negativeCount}
            after={impact.after.negativeCount}
            delta={impact.deltas.negativeCount}
            format="count"
            goodDirection="down"
            onSelectBefore={() => goPhase(ReviewPhase.Baseline, 'negative')}
            onSelectAfter={() => goPhase(ReviewPhase.PostAction, 'negative')}
          />
        </Col>
        <Col xs={12} md={6}>
          <ImpactMetric
            label="Positive reviews"
            before={impact.before.positiveCount}
            after={impact.after.positiveCount}
            delta={impact.deltas.positiveCount}
            format="count"
            goodDirection="up"
            onSelectBefore={() => goPhase(ReviewPhase.Baseline, 'positive')}
            onSelectAfter={() => goPhase(ReviewPhase.PostAction, 'positive')}
          />
        </Col>
        <Col xs={12} md={6}>
          <ImpactMetric
            label={`${impact.targetCategory} complaints`}
            before={beforeC}
            after={afterC}
            delta={impact.deltas.targetCategoryComplaints}
            format="count"
            goodDirection="down"
            onSelectBefore={() => goPhase(ReviewPhase.Baseline, 'negative', impact.targetCategory)}
            onSelectAfter={() => goPhase(ReviewPhase.PostAction, 'negative', impact.targetCategory)}
          />
        </Col>
      </Row>

      <ImprovementStatus verdict={impact.verdict} status={action.status} nextRemedy={nextRemedy} onApplyNextRemedy={applyNextRemedy} />
    </Space>
  );
}
