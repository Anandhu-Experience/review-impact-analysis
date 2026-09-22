import { useMemo } from 'react';
import { Row, Col, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useRIAStore, useVisibleReviews } from '../store/useRIAStore';
import { seed } from '../data/seed';
import {
  computeMonthlyDeltas,
  computeProblemAreas,
  computeRatingSummary,
  computeRatingTrend,
  fillMonthGaps,
} from '../services/reviewAnalysisService';
import { comparePeers } from '../services/peerComparisonService';
import { reviewsLink, type ReviewFilters } from '../services/reviewFilters';
import { WakeUpCall } from '../components/dashboard/WakeUpCall';
import { RatingSummary } from '../components/dashboard/RatingSummary';
import { RatingTrend } from '../components/dashboard/RatingTrend';
import { ProblemAreas } from '../components/dashboard/ProblemAreas';
import { MetricCard } from '../components/dashboard/MetricCard';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthName = (iso: string) => MONTHS[Number(iso.split('-')[1]) - 1] ?? iso;

export default function DashboardPage() {
  const navigate = useNavigate();
  const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId)!;
  const actionItems = useRIAStore((s) => s.actionItems);
  const visibleReviews = useVisibleReviews();
  const restaurant = seed.restaurants.find((r) => r.id === activeRestaurantId);

  const { summary, trend, problems, negativeCount, peerRank, deltas } = useMemo(() => {
    const summary = computeRatingSummary(visibleReviews);
    // Gaps filled so the axis spaces months truthfully instead of drawing a slope across
    // months nobody reviewed.
    const trend = fillMonthGaps(computeRatingTrend(visibleReviews, 'month'));
    const deltas = computeMonthlyDeltas(visibleReviews);
    const problems = computeProblemAreas(activeRestaurantId, seed, visibleReviews);
    const negativeCount = visibleReviews.filter((r) => r.rating < 3).length;
    const top = problems[0];
    const exampleReview = top ? seed.reviews.find((r) => r.id === top.exampleReviewIds[0]) : undefined;
    const peer = exampleReview ? comparePeers(activeRestaurantId, exampleReview.catalogItemId, seed) : null;
    return { summary, trend, problems, negativeCount, peerRank: peer, deltas };
  }, [activeRestaurantId, visibleReviews]);

  const topProblem = problems[0] ?? null;

  // Is the top problem already being worked? The page answers "what is wrong" but never said
  // "and you are on it", so it kept raising an alarm the owner had already acted on.
  const loop = useMemo(() => {
    if (!topProblem) return null;
    const forCategory = actionItems.filter(
      (a) => a.restaurantId === activeRestaurantId && a.category === topProblem.category,
    );
    if (forCategory.length === 0) return null;
    // A measured result beats an open one: it is the more informative thing to surface.
    const action = forCategory.find((a) => a.impactResult) ?? forCategory[forCategory.length - 1];
    const measured = Boolean(action.impactResult);
    return {
      title: action.action,
      status: measured ? (action.impactResult?.verdict ?? action.status) : action.status,
      measured,
      onOpen: () => navigate(measured ? '/impact' : '/action-plan'),
    };
  }, [actionItems, activeRestaurantId, topProblem, navigate]);

  const goAnalyze = (reviewId?: string) => reviewId && navigate(`/analysis/${reviewId}`);
  // Every chart element and count on this page resolves to one filtered review list.
  const goReviews = (filters: Partial<ReviewFilters>) => navigate(reviewsLink(filters));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* The numbers lead: read the state of the restaurant first, then what to do about it. */}
      <Row gutter={16} data-tour="dashboard-metrics">
        <Col xs={12} md={6}>
          <MetricCard
            title="Avg rating"
            value={summary.avg}
            precision={1}
            suffix="★"
            status={summary.avg < 3 ? 'bad' : 'good'}
            onClick={() => goReviews({ scope: 'all' })}
            hint={`All ${summary.total} reviews`}
            delta={
              deltas
                ? {
                    value: deltas.avgRatingDelta,
                    currentLabel: monthName(deltas.latestLabel),
                    currentValue: `${deltas.avgRating.toFixed(1)}★`,
                    previousLabel: monthName(deltas.previousLabel),
                    goodDirection: 'up',
                    decimals: 1,
                  }
                : undefined
            }
          />
        </Col>
        <Col xs={12} md={6}>
          <MetricCard
            title="Negative reviews"
            value={negativeCount}
            status={negativeCount > 0 ? 'warn' : 'good'}
            onClick={() => goReviews({ scope: 'negative' })}
            hint="Below 3★"
            delta={
              deltas
                ? {
                    value: deltas.negativeDelta,
                    currentLabel: monthName(deltas.latestLabel),
                    currentValue: String(deltas.negativeCount),
                    previousLabel: monthName(deltas.previousLabel),
                    goodDirection: 'down',
                  }
                : undefined
            }
          />
        </Col>
        <Col xs={12} md={6}>
          <MetricCard
            title="Top problem"
            value={problems[0]?.category ?? '—'}
            onClick={problems[0] ? () => goReviews({ category: problems[0].category, scope: 'negative' }) : undefined}
            hint={problems[0] ? `${problems[0].frequency} reviews` : undefined}
          />
        </Col>
        <Col xs={12} md={6}>
          <MetricCard
            title="Peer rank"
            value={peerRank ? `${peerRank.rank} / ${peerRank.peerCount + 1}` : '—'}
            onClick={peerRank ? () => goReviews({ item: peerRank.catalogItemId, scope: 'all' }) : undefined}
            hint={peerRank ? `${peerRank.itemName} reviews` : undefined}
          />
        </Col>
      </Row>

      <WakeUpCall
        restaurantName={restaurant?.name ?? ''}
        topProblem={problems[0] ?? null}
        negativeCount={negativeCount}
        avgRating={summary.avg}
        onAnalyze={goAnalyze}
        onViewCategory={(category) => goReviews({ category, scope: 'negative' })}
        onViewNegative={() => goReviews({ scope: 'negative' })}
        onViewAll={() => goReviews({ scope: 'all' })}
        loop={loop}
      />

      <Row gutter={16} data-tour="dashboard-trend">
        <Col xs={24} md={10}>
          <RatingSummary
            distribution={summary.distribution}
            avgRating={summary.avg}
            total={summary.total}
            onSelectRating={(rating) => goReviews({ rating, scope: 'all' })}
            onSelectAll={() => goReviews({ scope: 'all' })}
          />
        </Col>
        <Col xs={24} md={14}>
          <RatingTrend data={trend} onSelectMonth={(month) => goReviews({ month, scope: 'all' })} />
        </Col>
      </Row>

      <ProblemAreas problems={problems} onSelectCategory={(category) => goReviews({ category, scope: 'negative' })} />

    </Space>
  );
}
