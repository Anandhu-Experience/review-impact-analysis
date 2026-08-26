import { Layout, Select, Button, Modal, Typography } from 'antd';
import { ReloadOutlined, LogoutOutlined } from '@ant-design/icons';
import type { Restaurant } from '../../types';

interface HeaderProps {
  userName: string;
  activeRestaurant: Restaurant | undefined;
  restaurants: Restaurant[];
  onSwitchRestaurant: (restaurantId: string) => void;
  onResetDemo: () => void;
  onLogout: () => void;
}

export function Header({ userName, activeRestaurant, restaurants, onSwitchRestaurant, onResetDemo, onLogout }: HeaderProps) {
  const confirmReset = () =>
    Modal.confirm({
      title: 'Reset demo?',
      content: 'This clears all actions and collected reviews and returns to a pristine baseline.',
      okText: 'Reset',
      okButtonProps: { danger: true },
      onOk: onResetDemo,
    });

  return (
    <Layout.Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ lineHeight: 1.2 }}>
        <Typography.Text strong style={{ fontSize: 16 }}>Review Impact Analysis</Typography.Text>
        <div style={{ fontSize: 11, color: '#6b7280' }}>Close the loop on negative feedback</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Restaurant</div>
          <Select
            size="small"
            style={{ minWidth: 180 }}
            value={activeRestaurant?.id}
            onChange={onSwitchRestaurant}
            options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
          />
        </div>
        <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Owner</div>
          <Typography.Text>{userName}</Typography.Text>
        </div>
        <Button size="small" danger ghost icon={<ReloadOutlined />} onClick={confirmReset}>Reset Demo</Button>
        <Button size="small" icon={<LogoutOutlined />} onClick={onLogout} />
      </div>
    </Layout.Header>
  );
}
