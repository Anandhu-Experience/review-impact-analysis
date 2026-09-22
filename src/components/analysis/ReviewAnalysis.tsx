import { Space, Card, Rate, Tag, Typography } from 'antd';
import type { ProblemCategory, ReviewAnalysis as ReviewAnalysisResult, Remedy } from '../../types';
import { PeerComparison } from './PeerComparison';
import { PositiveReviewComparison } from './PositiveReviewComparison';
import { RootCauseCard, type AiState } from './RootCauseCard';
import { RemedyCard } from './RemedyCard';

interface ReviewAnalysisProps {
  analysis: ReviewAnalysisResult;
  itemName: string;
  alreadyPlanned: boolean;
  onCreateAction?: (remedy: Remedy) => void;
  onSelectCategory?: (category: ProblemCategory) => void;
  onSelectItem?: (catalogItemId: string) => void;
  ai?: AiState;
}

export function ReviewAnalysis({
  analysis,
  itemName,
  alreadyPlanned,
  onCreateAction,
  onSelectCategory,
  onSelectItem,
  ai,
}: ReviewAnalysisProps) {
  const { review, problems } = analysis;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" data-tour="analysis-review">
        <Space wrap>
          <Rate disabled value={review.rating} />
          <Typography.Text strong>{itemName}</Typography.Text>
          <Typography.Text type="secondary">${review.price.toFixed(2)} · {review.date}</Typography.Text>
        </Space>
        <Typography.Paragraph style={{ margin: '8px 0 4px' }}>"{review.comment}"</Typography.Paragraph>
        <Space size={4} wrap>
          <Typography.Text type="secondary">Detected problems:</Typography.Text>
          {problems.length ? (
            problems.map((p) => (
              <Tag
                key={p.category}
                color="red"
                style={onSelectCategory ? { cursor: 'pointer' } : undefined}
                onClick={onSelectCategory ? () => onSelectCategory(p.category) : undefined}
              >
                {p.category} · sev {p.severity} · {p.frequency} review{p.frequency === 1 ? '' : 's'}
              </Tag>
            ))
          ) : (
            <Tag>none</Tag>
          )}
        </Space>
      </Card>

      <PeerComparison peer={analysis.peer} onSelectMyItem={onSelectItem} />
      <PositiveReviewComparison positive={analysis.positive} />
      <RootCauseCard rootCause={analysis.rootCause} ai={ai} />
      <RemedyCard remedy={analysis.remedy} alreadyPlanned={alreadyPlanned} onCreateAction={onCreateAction} />
    </Space>
  );
}
