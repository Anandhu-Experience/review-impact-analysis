import { Card, Button, Result, Typography, Tag } from 'antd';
import { WarningOutlined, ArrowRightOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { DetectedProblem, ProblemCategory } from '../../types';
import { theme } from '../../styles/theme';
import { CountLink } from '../common/CountLink';

/** The action already under way for this problem, if there is one. */
export interface LoopStatus {
  title: string;
  status: string;
  /** Measured actions point at the result; everything else points at the plan. */
  measured: boolean;
  onOpen: () => void;
}

interface WakeUpCallProps {
  restaurantName: string;
  topProblem: DetectedProblem | null;
  negativeCount: number;
  avgRating: number;
  onAnalyze: (reviewId: string) => void;
  onViewCategory?: (category: ProblemCategory) => void;
  onViewNegative?: () => void;
  onViewAll?: () => void;
  loop?: LoopStatus | null;
}

export function WakeUpCall({
  restaurantName,
  topProblem,
  negativeCount,
  avgRating,
  onAnalyze,
  onViewCategory,
  onViewNegative,
  onViewAll,
  loop,
}: WakeUpCallProps) {
  if (!topProblem) {
    return (
      <Card>
        <Result status="success" title="No pressing problems" subTitle={`Ratings look healthy at ${restaurantName} this period.`} />
      </Card>
    );
  }
  const exampleId = topProblem.exampleReviewIds[0];
  return (
    <Card style={{ borderLeft: '4px solid #b42318' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Tag color="error" icon={<WarningOutlined />}>Something is wrong</Tag>
          <Typography.Title level={4} style={{ margin: '8px 0 4px' }}>
            {onViewCategory ? (
              <CountLink
                onClick={() => onViewCategory(topProblem.category)}
                title={`View the ${topProblem.category} reviews`}
              >
                {topProblem.frequency} recent reviews
              </CountLink>
            ) : (
              <>{topProblem.frequency} recent reviews</>
            )}{' '}
            call out {topProblem.category} at {restaurantName}
          </Typography.Title>
          <Typography.Text type="secondary">
            Avg rating{' '}
            {onViewAll ? (
              <CountLink onClick={onViewAll} title="View all reviews">{avgRating.toFixed(1)}★</CountLink>
            ) : (
              <>{avgRating.toFixed(1)}★</>
            )}{' '}
            ·{' '}
            {onViewNegative ? (
              <CountLink onClick={onViewNegative} title="View the negative reviews">
                {negativeCount} negative reviews
              </CountLink>
            ) : (
              <>{negativeCount} negative reviews</>
            )}{' '}
            this period
          </Typography.Text>
        </div>
        {exampleId && (
          <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => onAnalyze(exampleId)}>
            Analyze
          </Button>
        )}
      </div>

      {/* Without this the dashboard keeps reporting a problem you are already fixing, and the
          only way to know otherwise is to go looking in the Action Plan. */}
      {loop ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 14,
            paddingTop: 12,
            borderTop: `1px solid ${theme.colors.border}`,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '2px 8px',
              borderRadius: theme.radius.sm,
              background: loop.measured ? theme.colors.tone.success.bg : theme.colors.tone.info.bg,
              color: loop.measured ? theme.colors.tone.success.fg : theme.colors.tone.info.fg,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {loop.measured ? <CheckCircleOutlined /> : <SyncOutlined />}
            {loop.status}
          </span>
          <Typography.Text style={{ fontSize: 13 }}>{loop.title}</Typography.Text>
          <Button size="small" onClick={loop.onOpen}>
            {loop.measured ? 'View impact' : 'Open action plan'}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
