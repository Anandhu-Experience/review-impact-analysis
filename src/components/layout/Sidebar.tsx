import { Layout, Menu, Select, Typography } from 'antd';
import {
  DashboardOutlined,
  MessageOutlined,
  ExperimentOutlined,
  CheckSquareOutlined,
  RiseOutlined,
  LogoutOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { theme } from '../../styles/theme';
import type { Restaurant } from '../../types';

interface SidebarProps {
  openActionCount: number;
  topNegativeReviewId: string | null;
  activeRestaurantId: string | undefined;
  restaurants: Restaurant[];
  onSwitchRestaurant: (restaurantId: string) => void;
  onLogout: () => void;
}

const { colors, layout } = theme;

// Nav item count chip — the XMP shell's parity dot, carrying a number instead.
function CountChip({ count }: { count: number }) {
  return (
    <span
      style={{
        marginLeft: 'auto',
        minWidth: 20,
        padding: '0 6px',
        borderRadius: 999,
        background: colors.tone.warning.bg,
        color: colors.tone.warning.fg,
        fontFamily: theme.font.mono,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '18px',
        textAlign: 'center',
      }}
    >
      {count}
    </span>
  );
}

// Primary navigation. Analysis routes to the top-priority negative review so the item is never
// a dead link (disabled when there are no negatives). Layout mirrors the XMP shell: brand block,
// derived nav, and a context footer (what you are looking at + sign out).
export function Sidebar({
  openActionCount,
  topNegativeReviewId,
  activeRestaurantId,
  restaurants,
  onSwitchRestaurant,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = location.pathname.startsWith('/analysis')
    ? '/analysis'
    : '/' + (location.pathname.split('/')[1] || 'dashboard');

  return (
    <Layout.Sider
      theme="light"
      width={layout.sidebarWidth}
      style={{
        background: colors.muted,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: layout.headerHeight,
          padding: '0 20px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>RIA</span>
        <span
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: colors.brandSoft,
            color: colors.brand,
            fontFamily: theme.font.mono,
            fontSize: 10,
            fontWeight: 500,
          }}
        >
          impact loop
        </span>
      </div>

      <nav style={{ flex: 1, overflow: 'auto', padding: 12 }} aria-label="Primary">
        <Menu
          theme="light"
          mode="inline"
          style={{ background: 'transparent', borderRight: 'none' }}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => {
            if (key === '/analysis') {
              if (topNegativeReviewId) navigate(`/analysis/${topNegativeReviewId}`);
            } else {
              navigate(key);
            }
          }}
        >
          <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>Dashboard</Menu.Item>
          <Menu.Item key="/reviews" icon={<MessageOutlined />}>Reviews</Menu.Item>
          <Menu.Item key="/analysis" icon={<ExperimentOutlined />} disabled={!topNegativeReviewId}>
            Analysis
          </Menu.Item>
          <Menu.Item key="/action-plan" icon={<CheckSquareOutlined />}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Action Plan
              {openActionCount > 0 ? <CountChip count={openActionCount} /> : null}
            </span>
          </Menu.Item>
          <Menu.Item key="/impact" icon={<RiseOutlined />}>Impact</Menu.Item>
        </Menu>
      </nav>

      <div style={{ borderTop: `1px solid ${colors.border}`, padding: 12 }}>
        <label
          htmlFor="ria-restaurant"
          style={{
            display: 'block',
            marginBottom: 6,
            color: colors.textMuted,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Viewing
        </label>
        <Select
          id="ria-restaurant"
          size="small"
          style={{ width: '100%' }}
          value={activeRestaurantId}
          onChange={onSwitchRestaurant}
          options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Typography.Text
          type="secondary"
          style={{ display: 'block', marginTop: 8, fontSize: 11, lineHeight: 1.4 }}
        >
          {restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'} on this account
        </Typography.Text>

        <button
          type="button"
          onClick={() => navigate('/evals')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            padding: 0,
            border: 'none',
            background: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          <FileSearchOutlined style={{ fontSize: 12 }} />
          Eval history
        </button>

        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            padding: 0,
            border: 'none',
            background: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          <LogoutOutlined style={{ fontSize: 12 }} />
          Sign out
        </button>
      </div>
    </Layout.Sider>
  );
}
