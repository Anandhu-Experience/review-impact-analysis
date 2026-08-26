import { Space, Card, Rate, Tag, Typography } from 'antd';
import type { ReviewAnalysis as ReviewAnalysisResult, Remedy } from '../../types';
import { PeerComparison } from './PeerComparison';
import { PositiveReviewComparison } from './PositiveReviewComparison';
import { RootCauseCard } from './RootCauseCard';
import { RemedyCard } from './RemedyCard';

interface ReviewAnalysisProps {
  analysis: ReviewAnalysisResult;
  itemName: string;
  alreadyPlanned: boolean;
  onCreateAction?: (remedy: Remedy) => void;
}

export function ReviewAnalysis({ analysis, itemName, alreadyPlanned, onCreateAction }: ReviewAnalysisProps) {
  const { review, problems } = analysis;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small">
        <Space wrap>
          <Rate disabled value={review.rating} />
          <Typography.Text strong>{itemName}</Typography.Text>
          <Typography.Text type="secondary">${review.price.toFixed(2)} · {review.date}</Typography.Text>
        </Space>
        <Typography.Paragraph style={{ margin: '8px 0 4px' }}>"{review.comment}"</Typography.Paragraph>
        <Space size={4} wrap>
          <Typography.Text type="secondary">Detected problems:</Typography.Text>
          {problems.length ? problems.map((p) => <Tag key={p.category} color="red">{p.category} · sev {p.severity}</Tag>) : <Tag>none</Tag>}
        </Space>
      </Card>

      <PeerComparison peer={analysis.peer} />
      <PositiveReviewComparison positive={analysis.positive} />
      <RootCauseCard rootCause={analysis.rootCause} />
      <RemedyCard remedy={analysis.remedy} alreadyPlanned={alreadyPlanned} onCreateAction={onCreateAction} />
    </Space>
  );
}
