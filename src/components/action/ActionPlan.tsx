import { Card, Empty, Space, Steps, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useRIAStore } from '../../store/useRIAStore';
import { ACTION_STAGE_TITLES, planStage, summarizeActionPlan } from '../../services/actionPlanService';
import { ActionItem } from './ActionItem';

export function ActionPlan() {
  const navigate = useNavigate();
  const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId);
  const actionItems = useRIAStore((s) => s.actionItems);
  const releasedScenarioIds = useRIAStore((s) => s.releasedScenarioIds);
  const collectNewReviews = useRIAStore((s) => s.collectNewReviews);
  const updateActionStatus = useRIAStore((s) => s.updateActionStatus);

  const actions = actionItems.filter((a) => a.restaurantId === activeRestaurantId);
  const summary = summarizeActionPlan(actions);
  const stage = planStage(actions);

  if (actions.length === 0) {
    return (
      <Card>
        <Empty description="No actions yet — analyze a review and add its remedy here">
          <Button type="primary" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Typography.Text strong>
          {summary.total} actions · {summary.inProgress} in progress · {summary.confirmed} confirmed · {summary.monitoring} monitoring
        </Typography.Text>
        <Steps
          size="small"
          responsive
          style={{ marginTop: 16 }}
          current={stage.current}
          status={stage.allTerminal ? 'finish' : 'process'}
          items={ACTION_STAGE_TITLES.map((title) => ({ title }))}
        />
        {stage.spread ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Tracking the least-advanced of {actions.length} actions — each action's own status is on its card.
          </Typography.Text>
        ) : null}
      </Card>
      {actions.map((a) => (
        <ActionItem
          key={a.id}
          action={a}
          released={releasedScenarioIds.includes(a.scenarioId)}
          onCollectNewReviews={(id) => { collectNewReviews(id); navigate('/impact'); }}
          onAdvanceStatus={updateActionStatus}
          onViewImpact={() => navigate('/impact')}
        />
      ))}
    </Space>
  );
}
