import { Card, Button, Tag, List, Typography } from 'antd';
import { PlusOutlined, CheckOutlined, ToolOutlined } from '@ant-design/icons';
import type { Remedy } from '../../types';

interface RemedyCardProps {
  remedy: Remedy;
  alreadyPlanned?: boolean;
  onCreateAction?: (remedy: Remedy) => void;
}

export function RemedyCard({ remedy, alreadyPlanned, onCreateAction }: RemedyCardProps) {
  return (
    <Card
      title={<span><ToolOutlined /> Recommended remedy</span>}
      extra={<Tag color={remedy.tier === 1 ? 'blue' : 'purple'}>Tier {remedy.tier}</Tag>}
      style={{ borderLeft: '4px solid #1b4db1' }}
    >
      <Typography.Title level={4} style={{ marginTop: 0 }}>{remedy.title}</Typography.Title>
      <Typography.Paragraph type="secondary">{remedy.description}</Typography.Paragraph>
      <List
        size="small"
        header={<Typography.Text strong>Specific actions</Typography.Text>}
        dataSource={remedy.specificActions}
        renderItem={(a) => <List.Item>• {a}</List.Item>}
      />
      <Typography.Paragraph style={{ marginTop: 12 }}>
        <Typography.Text type="secondary">Expected impact: </Typography.Text>{remedy.expectedImpact}
      </Typography.Paragraph>
      {onCreateAction && (
        <Button
          type="primary"
          size="large"
          icon={alreadyPlanned ? <CheckOutlined /> : <PlusOutlined />}
          disabled={alreadyPlanned}
          onClick={() => onCreateAction(remedy)}
        >
          {alreadyPlanned ? 'Added to Action Plan' : 'Add to Action Plan'}
        </Button>
      )}
    </Card>
  );
}
