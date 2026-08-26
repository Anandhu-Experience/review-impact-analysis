import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  MessageOutlined,
  ExperimentOutlined,
  CheckSquareOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  openActionCount: number;
  topNegativeReviewId: string | null;
}

// Primary navigation. Analysis routes to the top-priority negative review so the item is never
// a dead link (disabled when there are no negatives).
export function Sidebar({ openActionCount, topNegativeReviewId }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = location.pathname.startsWith('/analysis')
    ? '/analysis'
    : '/' + (location.pathname.split('/')[1] || 'dashboard');

  return (
    <Layout.Sider collapsible breakpoint="lg" theme="dark" width={220}>
      <div style={{ color: '#fff', fontWeight: 700, padding: '16px 20px', fontSize: 15, lineHeight: 1.2 }}>
        RIA
        <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>Experience.com · XMP</div>
      </div>
      <Menu
        theme="dark"
        mode="inline"
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
          Action Plan{openActionCount > 0 ? <Badge count={openActionCount} offset={[8, -2]} /> : null}
        </Menu.Item>
        <Menu.Item key="/impact" icon={<RiseOutlined />}>Impact</Menu.Item>
      </Menu>
    </Layout.Sider>
  );
}
