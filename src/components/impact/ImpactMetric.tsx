import { Card, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { CountLink } from '../common/CountLink';

interface ImpactMetricProps {
  label: string;
  before: number;
  after: number;
  delta: number;
  format?: 'rating' | 'count' | 'sentiment';
  goodDirection?: 'up' | 'down';
  /** Drill into the reviews behind each window. */
  onSelectBefore?: () => void;
  onSelectAfter?: () => void;
}

const fmt = (n: number, format?: string) =>
  format === 'rating' ? `${n.toFixed(1)}★` : format === 'sentiment' ? n.toFixed(2) : `${n}`;

export function ImpactMetric({
  label,
  before,
  after,
  delta,
  format,
  goodDirection = 'up',
  onSelectBefore,
  onSelectAfter,
}: ImpactMetricProps) {
  const improved = goodDirection === 'up' ? delta > 0 : delta < 0;
  const flat = delta === 0;
  const color = flat ? '#6b7280' : improved ? '#067647' : '#b42318';
  const Arrow = delta >= 0 ? ArrowUpOutlined : ArrowDownOutlined;
  return (
    <Card size="small" bodyStyle={{ padding: 16 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        {onSelectAfter ? (
          <Typography.Text style={{ fontSize: 20, fontWeight: 600 }}>
            <CountLink onClick={onSelectAfter} title="View the reviews after the action">
              {fmt(after, format)}
            </CountLink>
          </Typography.Text>
        ) : (
          <Typography.Text style={{ fontSize: 20, fontWeight: 600 }}>{fmt(after, format)}</Typography.Text>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          from{' '}
          {onSelectBefore ? (
            <CountLink onClick={onSelectBefore} title="View the reviews before the action">
              {fmt(before, format)}
            </CountLink>
          ) : (
            fmt(before, format)
          )}
        </Typography.Text>
      </div>
      <div style={{ color, fontSize: 13, marginTop: 2 }}>
        {!flat && <Arrow />} {delta > 0 ? '+' : ''}{format === 'sentiment' ? delta.toFixed(2) : format === 'rating' ? delta.toFixed(1) : delta}
      </div>
    </Card>
  );
}
