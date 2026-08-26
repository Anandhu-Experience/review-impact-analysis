import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartFrame } from '../../styles/ChartFrame';

interface RatingTrendProps {
  data: Array<{ date: string; avgRating: number; count: number }>;
}

export function RatingTrend({ data }: RatingTrendProps) {
  return (
    <Card title="Rating trend">
      <ChartFrame $height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip />
            <Line type="monotone" dataKey="avgRating" stroke="#1f6feb" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
