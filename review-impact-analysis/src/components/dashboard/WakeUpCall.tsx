import { Card, Button, Result, Typography, Tag } from 'antd';
import { WarningOutlined, ArrowRightOutlined } from '@ant-design/icons';
import type { DetectedProblem } from '../../types';

interface WakeUpCallProps {
  restaurantName: string;
  topProblem: DetectedProblem | null;
  negativeCount: number;
  avgRating: number;
  onAnalyze: (reviewId: string) => void;
}

export function WakeUpCall({ restaurantName, topProblem, negativeCount, avgRating, onAnalyze }: WakeUpCallProps) {
  if (!topProblem) {
    return (
      <Card>
        <Result status="success" title="No pressing problems" subTitle={`Ratings look healthy at ${restaurantName} this period.`} />
      </Card>
    );
  }
  const exampleId = topProblem.exampleReviewIds[0];
  return (
    <Card style={{ borderLeft: '4px solid #d32f2f' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Tag color="error" icon={<WarningOutlined />}>Something is wrong</Tag>
          <Typography.Title level={4} style={{ margin: '8px 0 4px' }}>
            {topProblem.frequency} recent reviews call out {topProblem.category} at {restaurantName}
          </Typography.Title>
          <Typography.Text type="secondary">
            Avg rating {avgRating.toFixed(1)}★ · {negativeCount} negative reviews this period
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
