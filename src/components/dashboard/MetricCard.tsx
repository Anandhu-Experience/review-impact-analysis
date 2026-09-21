import { Card, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';

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
}

const COLOR = { good: '#067647', warn: '#b54708', bad: '#b42318' };

export function MetricCard({ title, value, precision, suffix, status, icon, onClick, hint }: MetricCardProps) {
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
        valueStyle={status ? { color: COLOR[status] } : undefined}
      />
      {onClick ? (
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {hint ?? 'View reviews'}
        </Typography.Text>
      ) : null}
    </Card>
  );
}
