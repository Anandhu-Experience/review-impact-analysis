import { Card, Tag, Alert, Space, Typography } from 'antd';
import type { ActionStatus, ImpactResult, Remedy } from '../../types';
import { statusTagColor } from '../../ui/format';
import { RemedyCard } from '../analysis/RemedyCard';

interface ImprovementStatusProps {
  verdict: ImpactResult['verdict'];
  status: ActionStatus;
  nextRemedy?: Remedy;
  onApplyNextRemedy?: (remedy: Remedy) => void;
}

export function ImprovementStatus({ verdict, status, nextRemedy, onApplyNextRemedy }: ImprovementStatusProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space size={12} wrap>
          <Typography.Text strong>Outcome</Typography.Text>
          <Tag color={statusTagColor[status]}>{status}</Tag>
          <Typography.Text type="secondary">{verdict}</Typography.Text>
        </Space>
      </Card>

      {nextRemedy && (
        <>
          <Alert
            type="warning"
            showIcon
            message="The first remedy didn't move the numbers"
            description="RIA recommends the next remedy — this is the continuous-improvement loop."
          />
          <RemedyCard remedy={nextRemedy} onCreateAction={onApplyNextRemedy} />
        </>
      )}
    </Space>
  );
}
