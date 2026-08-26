import { Card, Tag, Typography, Row, Col, Empty } from 'antd';
import type { PositiveReviewComparison as PositiveReviewComparisonResult } from '../../types';

export function PositiveReviewComparison({ positive }: { positive: PositiveReviewComparisonResult | null }) {
  if (!positive) {
    return (
      <Card title="What successful peers do differently">
        <Empty description="No standout positive peer reviews in this category yet" />
      </Card>
    );
  }
  return (
    <Card title="What successful peers do differently">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Typography.Text type="secondary">Peers praised</Typography.Text>
          <div style={{ marginTop: 8 }}>
            {positive.positiveThemes.length ? positive.positiveThemes.map((t) => <Tag key={t} color="success">{t}</Tag>) : <Tag>consistent quality</Tag>}
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Typography.Text type="secondary">Your negatives cite</Typography.Text>
          <div style={{ marginTop: 8 }}>
            {positive.negativeThemes.length ? positive.negativeThemes.map((t) => <Tag key={t} color="error">{t}</Tag>) : <Tag>—</Tag>}
          </div>
        </Col>
      </Row>
      <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>{positive.contrast}</Typography.Paragraph>
    </Card>
  );
}
