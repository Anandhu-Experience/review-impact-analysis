import { Card, Button, Result, Typography, Tag } from 'antd';
import { WarningOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { DetectedProblem, ProblemCategory } from '../../types';
import { CountLink } from '../common/CountLink';

interface WakeUpCallProps {
  restaurantName: string;
  topProblem: DetectedProblem | null;
  negativeCount: number;
  avgRating: number;
  onAnalyze: (reviewId: string) => void;
  onViewCategory?: (category: ProblemCategory) => void;
  onViewNegative?: () => void;
  onViewAll?: () => void;
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
    </Card>
  );
}
