import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ChartFrame } from '../../styles/ChartFrame';

interface ImpactTimelineProps {
  points: Array<{ date: string; avgRating: number }>;
  actionDate: string;
}

export function ImpactTimeline({ points, actionDate }: ImpactTimelineProps) {
  // ReferenceLine matches the bucketed x-axis (month) so it lands on the right tick.
  const actionBucket = actionDate.slice(0, 7);
  return (
    <Card title="Impact timeline">
      <ChartFrame $height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip />
            <ReferenceLine x={actionBucket} stroke="#ed6c02" strokeDasharray="4 4" label={{ value: 'Action taken', position: 'top', fill: '#ed6c02', fontSize: 12 }} />
            <Line type="monotone" dataKey="avgRating" stroke="#1f6feb" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
