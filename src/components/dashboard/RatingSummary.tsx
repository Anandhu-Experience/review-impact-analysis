import { Card } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { Rating } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';
import { ratingBarColor } from '../../ui/format';
import { CountLink } from '../common/CountLink';

interface RatingSummaryProps {
  distribution: Record<Rating, number>;
  avgRating: number;
  total: number;
  onSelectRating?: (rating: Rating) => void;
  onSelectAll?: () => void;
}

// Recharts hands the datum straight through on Bar clicks, but wraps it in `payload` on some
// element types — read both so the handler does not depend on which one fired.
const datumOf = (d: any) => d?.payload ?? d;

export function RatingSummary({ distribution, avgRating, total, onSelectRating, onSelectAll }: RatingSummaryProps) {
  const data = ([1, 2, 3, 4, 5] as Rating[]).map((r) => ({ rating: `${r}★`, count: distribution[r], r }));
  return (
    <Card
      title="Rating distribution"
      extra={
        onSelectAll ? (
          <CountLink onClick={onSelectAll} title="View all reviews">
            {avgRating.toFixed(1)}★ · {total} reviews
          </CountLink>
        ) : (
          <span>{avgRating.toFixed(1)}★ · {total} reviews</span>
        )
      }
    >
      <ChartFrame $height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="rating" />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(27,77,177,0.06)' }} />
            <Bar
              dataKey="count"
              cursor={onSelectRating ? 'pointer' : undefined}
              onClick={(d: any) => {
                const datum = datumOf(d);
                if (datum?.r) onSelectRating?.(datum.r as Rating);
              }}
            >
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
