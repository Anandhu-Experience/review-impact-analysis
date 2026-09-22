import { Card, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DetectedProblem, ProblemCategory } from '../../types';
import { ChartFrame } from '../../styles/ChartFrame';

interface ProblemAreasProps {
  problems: DetectedProblem[];
  topN?: number;
  onSelectCategory?: (category: ProblemCategory, exampleReviewId?: string) => void;
}

const datumOf = (d: any) => d?.payload ?? d;

export function ProblemAreas({ problems, topN = 6, onSelectCategory }: ProblemAreasProps) {
  const data = problems.slice(0, topN).map((p) => ({ category: p.category, frequency: p.frequency, exampleReviewId: p.exampleReviewIds[0], severity: p.severity }));
  return (
    <Card title="Problem areas" bodyStyle={{ paddingTop: 12 }} data-tour="dashboard-problems">
      {data.length === 0 ? (
        <Empty description="No problems detected" />
      ) : (
        <ChartFrame $height={Math.max(200, data.length * 42)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="category" width={100} />
              <Tooltip cursor={{ fill: 'rgba(27,77,177,0.06)' }} />
              <Bar
                dataKey="frequency"
                fill="#f04438"
                cursor="pointer"
                onClick={(d: any) => {
                  const datum = datumOf(d);
                  if (datum?.category) onSelectCategory?.(datum.category, datum.exampleReviewId);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      )}
    </Card>
  );
}
