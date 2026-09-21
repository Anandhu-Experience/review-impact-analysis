import { Tag, Typography } from 'antd';
import { MessageOutlined, TeamOutlined, LikeOutlined, BarChartOutlined } from '@ant-design/icons';
import type { Evidence } from '../../types';

const META: Record<Evidence['type'], { icon: JSX.Element; color: string }> = {
  review: { icon: <MessageOutlined />, color: 'red' },
  peer: { icon: <TeamOutlined />, color: 'blue' },
  'positive-review': { icon: <LikeOutlined />, color: 'green' },
  metric: { icon: <BarChartOutlined />, color: 'geekblue' },
};

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const m = META[evidence.type];
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #e3e6ea' }}>
      <Tag color={m.color} icon={m.icon} style={{ marginTop: 2 }}>{evidence.label}</Tag>
      <Typography.Text>{evidence.detail}</Typography.Text>
    </div>
  );
}
