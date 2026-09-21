import { Card, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';

export interface MetricDelta {
  /** Signed change against the comparison period. */
  value: number;
  /** The latest period and its own value, e.g. "Aug" and "3.0★". Shown explicitly because the
   *  headline above is an all-time figure — without this, a reader takes the arrow to mean
   *  the headline moved. */
  currentLabel: string;
  currentValue: string;
  /** What it is compared against, e.g. "Jul". */
  previousLabel: string;
  /** Which direction counts as good, so the colour says more than the sign does. */
  goodDirection: 'up' | 'down';
  decimals?: number;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  precision?: number;
  suffix?: string;
  status?: 'good' | 'warn' | 'bad';
  icon?: ReactNode;
  /** When set the whole tile becomes the drill-down into the reviews behind the number. */
  onClick?: () => void;
  hint?: string;
  /** Movement since the previous period. A number you have already read twice on this page
   *  earns its space back by saying which way it is going. */
  delta?: MetricDelta;
}

const COLOR = { good: '#067647', warn: '#b54708', bad: '#b42318' };

function DeltaLine({ delta }: { delta: MetricDelta }) {
  const flat = delta.value === 0;
  const improved = delta.goodDirection === 'up' ? delta.value > 0 : delta.value < 0;
  const color = flat ? '#6b7280' : improved ? '#067647' : '#b42318';
  const magnitude = Math.abs(delta.value).toFixed(delta.decimals ?? 0);

  return (
    <div style={{ marginTop: 2, fontSize: 11.5, lineHeight: 1.5, color: '#6b7280' }}>
      {delta.currentLabel} {delta.currentValue}{' '}
      <span style={{ color, fontWeight: 600, whiteSpace: 'nowrap' }}>
        <span aria-hidden="true">{flat ? '→' : delta.value > 0 ? '↑' : '↓'}</span>{' '}
        {flat ? 'flat' : magnitude}
      </span>{' '}
      vs {delta.previousLabel}
    </div>
  );
}

export function MetricCard({ title, value, precision, suffix, status, icon, onClick, hint, delta }: MetricCardProps) {
  return (
    <Card
      size="small"
      bodyStyle={{ padding: 16 }}
      className={onClick ? 'ria-clickable' : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <Statistic
        title={title}
        value={value}
        precision={precision}
        suffix={suffix}
        prefix={icon}
        valueStyle={{
          ...(status ? { color: COLOR[status] } : null),
          // A long category name ("WaitingTime") has no break point, so it either overflows
          // the tile or splits mid-word. Sizing it to its own length keeps it one piece.
          ...(typeof value === 'string'
            ? { fontSize: value.length > 12 ? 14 : value.length > 8 ? 16 : 19, lineHeight: 1.3 }
            : null),
        }}
      />
      {delta ? <DeltaLine delta={delta} /> : null}
      {onClick ? (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 2, fontSize: 11 }}>
          {hint ?? 'View reviews'}
        </Typography.Text>
      ) : null}
    </Card>
  );
}
