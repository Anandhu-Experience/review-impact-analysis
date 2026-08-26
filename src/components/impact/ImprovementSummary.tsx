import { Card, Result, Typography } from 'antd';
import type { ImpactResult } from '../../types';

const STATUS: Record<ImpactResult['verdict'], 'success' | 'warning' | 'error'> = {
  'Improvement Confirmed': 'success',
  'Monitoring — more feedback needed': 'warning',
  'No Significant Improvement': 'error',
};

export function ImprovementSummary({ impact }: { impact: ImpactResult }) {
  return (
    <Card>
      <Result
        status={STATUS[impact.verdict]}
        title={impact.verdict}
        subTitle={<Typography.Text style={{ fontSize: 15 }}>{impact.narrative}</Typography.Text>}
      />
    </Card>
  );
}
