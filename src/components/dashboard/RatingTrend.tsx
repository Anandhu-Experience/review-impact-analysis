import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartFrame } from '../../styles/ChartFrame';

interface RatingTrendProps {
  data: Array<{ date: string; avgRating: number; count: number }>;
  onSelectMonth?: (month: string) => void;
}

export function RatingTrend({ data, onSelectMonth }: RatingTrendProps) {
  // Clicking anywhere in the plot resolves to the nearest x bucket (activeLabel), so the dots
  // are hittable without demanding pixel accuracy on a 6px circle.
  const handleClick = (state: any) => {
    const month = state?.activeLabel;
    if (month) onSelectMonth?.(String(month));
  };

  return (
    <Card title="Rating trend">
      <ChartFrame $height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} onClick={handleClick} style={onSelectMonth ? { cursor: 'pointer' } : undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="avgRating"
              stroke="#1b4db1"
              strokeWidth={2}
              dot={{ r: 3, cursor: onSelectMonth ? 'pointer' : undefined }}
              activeDot={{ r: 6, cursor: onSelectMonth ? 'pointer' : undefined }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
