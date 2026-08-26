import { Card, Progress, Typography, Tag } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import type { RootCause } from '../../types';
import { EvidenceCard } from './EvidenceCard';

export function RootCauseCard({ rootCause }: { rootCause: RootCause }) {
  return (
    <Card
      title={<span><BulbOutlined /> Likely root cause · {rootCause.category}</span>}
      extra={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Typography.Text type="secondary">Confidence</Typography.Text>
          <Progress type="circle" percent={Math.round(rootCause.confidence * 100)} width={44} />
        </span>
      }
    >
      <Typography.Paragraph style={{ fontSize: 15 }}>{rootCause.statement}</Typography.Paragraph>
      <Tag color="blue" style={{ marginBottom: 8 }}>Beyond classification</Tag>
      <div>
        {rootCause.evidence.map((e, i) => (
          <EvidenceCard key={i} evidence={e} />
        ))}
      </div>
    </Card>
  );
}
