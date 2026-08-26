import { Card, Tag, Button, Space, Typography, Tooltip } from 'antd';
import { PlayCircleOutlined, CheckOutlined, DownloadOutlined, RiseOutlined } from '@ant-design/icons';
import { ActionStatus } from '../../types';
import type { ActionItem as ActionItemModel } from '../../types';
import { statusTagColor, priorityTagColor } from '../../ui/format';

interface ActionItemProps {
  action: ActionItemModel;
  released: boolean;
  onCollectNewReviews: (actionId: string) => void;
  onAdvanceStatus: (actionId: string, status: ActionStatus) => void;
  onViewImpact: (actionId: string) => void;
}

const TERMINAL = new Set<ActionStatus>([ActionStatus.ImprovementConfirmed, ActionStatus.NoSignificantChange]);

export function ActionItem({ action, released, onCollectNewReviews, onAdvanceStatus, onViewImpact }: ActionItemProps) {
  const measured = !!action.impactResult;
  const canCollect = !released && !TERMINAL.has(action.status);

  return (
    <Card size="small">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <Typography.Text strong>{action.action}</Typography.Text>
          <div style={{ margin: '8px 0' }}>
            <Space size={4} wrap>
              <Tag>{action.category}</Tag>
              <Tag color={priorityTagColor[action.priority]}>{action.priority}</Tag>
              <Tag color={statusTagColor[action.status]}>{action.status}</Tag>
            </Space>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Owner: {action.owner} · created {action.createdDate} · target {action.targetDate}
          </Typography.Text>
        </div>
        <Space direction="vertical" align="end">
          {action.status === ActionStatus.NotStarted && (
            <Button icon={<PlayCircleOutlined />} onClick={() => onAdvanceStatus(action.id, ActionStatus.InProgress)}>Start</Button>
          )}
          {action.status === ActionStatus.InProgress && (
            <Button icon={<CheckOutlined />} onClick={() => onAdvanceStatus(action.id, ActionStatus.Completed)}>Mark Completed</Button>
          )}
          {canCollect && action.status !== ActionStatus.NotStarted && (
            <Tooltip title="Releases the post-action review window and measures the result">
              <Button type="primary" icon={<DownloadOutlined />} onClick={() => onCollectNewReviews(action.id)}>Collect New Reviews</Button>
            </Tooltip>
          )}
          {measured && (
            <Button icon={<RiseOutlined />} onClick={() => onViewImpact(action.id)}>View Impact</Button>
          )}
        </Space>
      </div>
    </Card>
  );
}
