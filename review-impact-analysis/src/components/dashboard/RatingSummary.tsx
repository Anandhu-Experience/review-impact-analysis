import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { Rating } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';
import { ratingBarColor } from '../../ui/format';

interface RatingSummaryProps {
  distribution: Record<Rating, number>;
  avgRating: number;
  total: number;
}

export function RatingSummary({ distribution, avgRating, total }: RatingSummaryProps) {
  const data = ([1, 2, 3, 4, 5] as Rating[]).map((r) => ({ rating: `${r}★`, count: distribution[r], r }));
  return (
    <Card title="Rating distribution" extra={<Typography.Text strong>{avgRating.toFixed(1)}★ · {total} reviews</Typography.Text>}>
      <ChartFrame $height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="rating" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count">
              {data.map((d) => (
                <Cell key={d.r} fill={ratingBarColor(d.r)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
