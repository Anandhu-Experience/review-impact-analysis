import { Card } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ImpactResult, MetricSnapshot, ProblemCategory } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';

interface BeforeAfterComparisonProps {
  before: MetricSnapshot;
  after: MetricSnapshot;
  deltas: ImpactResult['deltas'];
  targetCategory: ProblemCategory;
}

export function BeforeAfterComparison({ before, after, targetCategory }: BeforeAfterComparisonProps) {
  const data = [
    { metric: 'Avg rating', Before: before.avgRating, After: after.avgRating },
    { metric: 'Negative', Before: before.negativeCount, After: after.negativeCount },
    { metric: 'Positive', Before: before.positiveCount, After: after.positiveCount },
    { metric: `${targetCategory} complaints`, Before: before.complaintFrequency[targetCategory] ?? 0, After: after.complaintFrequency[targetCategory] ?? 0 },
  ];
  return (
    <Card title="Before vs after">
      <ChartFrame $height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="metric" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Before" fill="#90a4ae" />
            <Bar dataKey="After" fill="#1f6feb" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
