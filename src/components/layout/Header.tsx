import { Layout, Button, Modal, Typography } from 'antd';
import { CompassOutlined, ReloadOutlined } from '@ant-design/icons';
import { theme } from '../../styles/theme';
import type { Restaurant } from '../../types';

interface HeaderProps {
  userName: string;
  activeRestaurant: Restaurant | undefined;
  onResetDemo: () => void;
  onStartTour: () => void;
}

const { colors } = theme;

// Flat app bar in the XMP idiom: context on the left, account + escape hatch on the right.
// Restaurant switching and sign-out live in the sidebar footer.
export function Header({ userName, activeRestaurant, onResetDemo, onStartTour }: HeaderProps) {
  const confirmReset = () =>
    Modal.confirm({
      title: 'Reset demo?',
      content: 'This clears all actions and collected reviews and returns to a pristine baseline.',
      okText: 'Reset',
      okButtonProps: { danger: true },
      onOk: onResetDemo,
    });

  return (
    <Layout.Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        height: theme.layout.headerHeight,
        padding: '0 24px',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ minWidth: 0, lineHeight: 1.3 }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Review Impact Analysis
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted }}>
          {activeRestaurant ? activeRestaurant.name : 'Close the loop on negative feedback'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
          <div
            style={{
              color: colors.textMuted,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Owner
          </div>
          <Typography.Text style={{ fontSize: 13, fontWeight: 500 }}>{userName}</Typography.Text>
        </div>
        <Button size="small" icon={<CompassOutlined />} onClick={onStartTour}>
          Take the tour
        </Button>
        <Button size="small" icon={<ReloadOutlined />} onClick={confirmReset}>
          Reset demo
        </Button>
      </div>
    </Layout.Header>
  );
}
