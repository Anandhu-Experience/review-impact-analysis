import { Card } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ReviewPhase } from '../../types';
import type { ImpactResult, MetricSnapshot, ProblemCategory } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';

/** Which reviews a bar stands for, independent of the window it was measured in. */
export type BeforeAfterMetric = 'avgRating' | 'negative' | 'positive' | 'complaints';

interface BeforeAfterComparisonProps {
  before: MetricSnapshot;
  after: MetricSnapshot;
  deltas: ImpactResult['deltas'];
  targetCategory: ProblemCategory;
  onSelectWindow?: (phase: ReviewPhase, metric: BeforeAfterMetric) => void;
}

const datumOf = (d: any) => d?.payload ?? d;

export function BeforeAfterComparison({ before, after, targetCategory, onSelectWindow }: BeforeAfterComparisonProps) {
  const data = [
    { metric: 'Avg rating', metricKey: 'avgRating' as const, Before: before.avgRating, After: after.avgRating },
    { metric: 'Negative', metricKey: 'negative' as const, Before: before.negativeCount, After: after.negativeCount },
    { metric: 'Positive', metricKey: 'positive' as const, Before: before.positiveCount, After: after.positiveCount },
    {
      metric: `${targetCategory} complaints`,
      metricKey: 'complaints' as const,
      Before: before.complaintFrequency[targetCategory] ?? 0,
      After: after.complaintFrequency[targetCategory] ?? 0,
    },
  ];

  // A bar is (window × metric): the series says which window, the datum says which metric.
  const handle = (phase: ReviewPhase) => (d: any) => {
    const datum = datumOf(d);
    if (datum?.metricKey) onSelectWindow?.(phase, datum.metricKey as BeforeAfterMetric);
  };

  return (
    <Card title="Before vs after">
      <ChartFrame $height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="metric" />
            <YAxis allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(27,77,177,0.06)' }} />
            <Legend />
            <Bar
              dataKey="Before"
              fill="#98a2b3"
              cursor={onSelectWindow ? 'pointer' : undefined}
              onClick={handle(ReviewPhase.Baseline)}
            />
            <Bar
              dataKey="After"
              fill="#1b4db1"
              cursor={onSelectWindow ? 'pointer' : undefined}
              onClick={handle(ReviewPhase.PostAction)}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
    </Card>
  );
}
