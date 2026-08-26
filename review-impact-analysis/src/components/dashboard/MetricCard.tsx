import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  precision?: number;
  suffix?: string;
  status?: 'good' | 'warn' | 'bad';
  icon?: ReactNode;
}

const COLOR = { good: '#2e7d32', warn: '#ed6c02', bad: '#d32f2f' };

export function MetricCard({ title, value, precision, suffix, status, icon }: MetricCardProps) {
  return (
    <Card size="small" bodyStyle={{ padding: 16 }}>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        suffix={suffix}
        prefix={icon}
        valueStyle={status ? { color: COLOR[status] } : undefined}
      />
    </Card>
  );
}
