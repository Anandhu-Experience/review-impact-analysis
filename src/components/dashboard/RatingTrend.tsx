import { Card, Typography } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { ChartFrame } from '../../styles/ChartFrame';

interface TrendPoint {
  date: string; // YYYY-MM
  avgRating: number | null; // null = no reviews that month
  count: number;
}

interface RatingTrendProps {
  data: TrendPoint[];
  onSelectMonth?: (month: string) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 'Jan 26' on the first tick and every January, bare month names in between — enough to place
// a point in time without five identical year stamps competing for width.
const tickLabel = (value: string, index: number) => {
  const [year, month] = value.split('-');
  const name = MONTHS[Number(month) - 1] ?? value;
  return index === 0 || month === '01' ? `${name} ${year.slice(2)}` : name;
};

const monthLabel = (value: string) => {
  const [year, month] = value.split('-');
  return `${MONTHS[Number(month) - 1] ?? value} ${year}`;
};

/** Contiguous runs of months with no reviews, so each can be shaded as one band. */
function emptyRuns(data: TrendPoint[]): Array<{ from: string; to: string; months: number }> {
  const runs: Array<{ from: string; to: string; months: number }> = [];
  let start: string | null = null;
  let previous: string | null = null;
  let months = 0;

  for (const point of data) {
    if (point.count === 0) {
      if (start === null) start = point.date;
      previous = point.date;
      months += 1;
    } else if (start !== null && previous !== null) {
      runs.push({ from: start, to: previous, months });
      start = null;
      previous = null;
      months = 0;
    }
  }
  if (start !== null && previous !== null) runs.push({ from: start, to: previous, months });
  return runs;
}

export function RatingTrend({ data, onSelectMonth }: RatingTrendProps) {
  const withReviews = new Set(data.filter((p) => p.count > 0).map((p) => p.date));
  const gaps = data.length - withReviews.size;
  const runs = emptyRuns(data);
  // Only the widest run gets a label; several stacked captions would be noisier than the
  // thing they explain.
  const widest = runs.reduce<{ from: string; to: string; months: number } | null>(
    (best, run) => (best === null || run.months > best.months ? run : best),
    null,
  );

  // Clicking anywhere in the plot resolves to the nearest x bucket (activeLabel), so the dots
  // are hittable without demanding pixel accuracy on a 6px circle. Months with no reviews are
  // not links — there is nothing on the other side of them.
  const handleClick = (state: any) => {
    const month = state?.activeLabel ? String(state.activeLabel) : null;
    if (month && withReviews.has(month)) onSelectMonth?.(month);
  };

  return (
    <Card
      title="Rating trend"
      extra={
        gaps > 0 ? (
          <Typography.Text type="secondary" style={{ fontSize: 11.5 }}>
            {gaps} month{gaps === 1 ? '' : 's'} with no reviews
          </Typography.Text>
        ) : null
      }
    >
      <ChartFrame $height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} onClick={handleClick} style={onSelectMonth ? { cursor: 'pointer' } : undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            {/* A broken line alone reads as a rendering failure. Shading the span says the
                absence is the data, not a bug. */}
            {runs.map((run) => (
              <ReferenceArea
                key={run.from}
                x1={run.from}
                x2={run.to}
                fill="#f2f4f7"
                fillOpacity={0.75}
                stroke="none"
                label={
                  run === widest
                    ? { value: 'no reviews', position: 'center', fill: '#98a2b3', fontSize: 11 }
                    : undefined
                }
              />
            ))}
            <XAxis dataKey="date" tickFormatter={tickLabel} minTickGap={16} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip
              labelFormatter={monthLabel}
              formatter={(value: any, _name: any, entry: any) =>
                value === null || value === undefined
                  ? ['No reviews', 'Avg rating']
                  : [`${value}★ from ${entry?.payload?.count ?? 0} reviews`, 'Avg rating']
              }
            />
            {/* connectNulls stays false on purpose: an unbroken line across a month nobody
                reviewed is an assertion the data cannot support. */}
            <Line
              type="monotone"
              dataKey="avgRating"
              stroke="#1b4db1"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3, cursor: onSelectMonth ? 'pointer' : undefined }}
              activeDot={{ r: 6, cursor: onSelectMonth ? 'pointer' : undefined }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
