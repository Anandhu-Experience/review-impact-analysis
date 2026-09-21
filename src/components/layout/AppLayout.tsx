import { Layout } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRIAStore, useVisibleReviews } from '../../store/useRIAStore';
import { seed } from '../../data/seed';
import { computeProblemAreas } from '../../services/reviewAnalysisService';
import { ActionStatus } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const Content = styled.div`
  max-width: ${({ theme }) => theme.layout.maxContentWidth}px;
  margin: 0 auto;
  width: 100%;
`;

const TERMINAL = new Set<ActionStatus>([ActionStatus.ImprovementConfirmed, ActionStatus.NoSignificantChange]);

export function AppLayout() {
  const navigate = useNavigate();
  const currentUserId = useRIAStore((s) => s.currentUserId);
  const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId);
  const actionItems = useRIAStore((s) => s.actionItems);
  const setActiveRestaurant = useRIAStore((s) => s.setActiveRestaurant);
  const resetDemo = useRIAStore((s) => s.resetDemo);
  const logout = useRIAStore((s) => s.logout);
  const visibleReviews = useVisibleReviews();

  const user = seed.users.find((u) => u.id === currentUserId);
  const restaurants = seed.restaurants.filter((r) => user?.restaurantIds.includes(r.id));
  const activeRestaurant = seed.restaurants.find((r) => r.id === activeRestaurantId);

  const problems = activeRestaurantId ? computeProblemAreas(activeRestaurantId, seed, visibleReviews) : [];
  const topNegativeReviewId = problems[0]?.exampleReviewIds[0] ?? null;
  const openActionCount = actionItems.filter((a) => a.restaurantId === activeRestaurantId && !TERMINAL.has(a.status)).length;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        openActionCount={openActionCount}
        topNegativeReviewId={topNegativeReviewId}
        activeRestaurantId={activeRestaurantId ?? undefined}
        restaurants={restaurants}
        onSwitchRestaurant={setActiveRestaurant}
        onLogout={() => {
          logout();
          navigate('/login');
        }}
      />
      <Layout>
        <Header
          userName={user?.name ?? 'Owner'}
          activeRestaurant={activeRestaurant}
          onResetDemo={resetDemo}
        />
        <Layout.Content style={{ padding: '24px 32px 40px' }}>
          <Content>
            <Outlet />
          </Content>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
