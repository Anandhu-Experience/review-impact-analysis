import { Card } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ChartFrame } from '../../styles/ChartFrame';

interface ImpactTimelineProps {
  points: Array<{ date: string; avgRating: number }>;
  actionDate: string;
  onSelectMonth?: (month: string) => void;
}

export function ImpactTimeline({ points, actionDate, onSelectMonth }: ImpactTimelineProps) {
  // ReferenceLine matches the bucketed x-axis (month) so it lands on the right tick.
  const actionBucket = actionDate.slice(0, 7);
  const handleClick = (state: any) => {
    const month = state?.activeLabel;
    if (month) onSelectMonth?.(String(month));
  };

  return (
    <Card title="Impact timeline">
      <ChartFrame $height={280}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} onClick={handleClick} style={onSelectMonth ? { cursor: 'pointer' } : undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
            <Tooltip />
            <ReferenceLine x={actionBucket} stroke="#f79009" strokeDasharray="4 4" label={{ value: 'Action taken', position: 'top', fill: '#f79009', fontSize: 12 }} />
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
