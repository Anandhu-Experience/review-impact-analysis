import { Card, Rate, Tag, Button, Space, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import type { ProblemCategory, Review, Sentiment } from '../../types';
import { sentimentTagColor } from '../../ui/format';

interface ReviewCardProps {
  review: Review;
  itemName?: string;
  classification?: { categories: ProblemCategory[]; sentiment: Sentiment; isNegative: boolean };
  onAnalyze?: (reviewId: string) => void;
}

export function ReviewCard({ review, itemName, classification, onAnalyze }: ReviewCardProps) {
  return (
    <Card size="small">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Space size={8} wrap>
            <Rate disabled value={review.rating} />
            <Typography.Text type="secondary">{itemName ?? review.foodCategory} · ${review.price.toFixed(2)} · {review.date}</Typography.Text>
          </Space>
          <Typography.Paragraph style={{ margin: '8px 0' }}>"{review.comment}"</Typography.Paragraph>
          <Space size={4} wrap>
            {classification?.sentiment && <Tag color={sentimentTagColor[classification.sentiment]}>{classification.sentiment}</Tag>}
            {(classification?.categories ?? review.tags?.categories ?? []).map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </Space>
        </div>
        {onAnalyze && (
          <Button type="link" icon={<ArrowRightOutlined />} onClick={() => onAnalyze(review.id)}>
            Analyze
          </Button>
        )}
      </div>
    </Card>
  );
}
