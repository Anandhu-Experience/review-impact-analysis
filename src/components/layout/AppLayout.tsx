import { useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useRIAStore, useVisibleReviews } from '../../store/useRIAStore';
import { useTourStore } from '../../store/useTourStore';
import { seed } from '../../data/seed';
import { computeProblemAreas } from '../../services/reviewAnalysisService';
import { ActionStatus } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TourOverlay } from '../tour/TourOverlay';

const Content = styled.div`
  max-width: ${({ theme }) => theme.layout.maxContentWidth}px;
  margin: 0 auto;
  width: 100%;
`;

const TERMINAL = new Set<ActionStatus>([ActionStatus.ImprovementConfirmed, ActionStatus.NoSignificantChange]);

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = useRIAStore((s) => s.currentUserId);
  const activeRestaurantId = useRIAStore((s) => s.activeRestaurantId);
  const actionItems = useRIAStore((s) => s.actionItems);
  const setActiveRestaurant = useRIAStore((s) => s.setActiveRestaurant);
  const resetDemo = useRIAStore((s) => s.resetDemo);
  const logout = useRIAStore((s) => s.logout);
  const visibleReviews = useVisibleReviews();
  const tourSeen = useTourStore((s) => s.seen);
  const startTour = useTourStore((s) => s.start);

  const user = seed.users.find((u) => u.id === currentUserId);
  const restaurants = seed.restaurants.filter((r) => user?.restaurantIds.includes(r.id));
  const activeRestaurant = seed.restaurants.find((r) => r.id === activeRestaurantId);

  const problems = activeRestaurantId ? computeProblemAreas(activeRestaurantId, seed, visibleReviews) : [];
  const topNegativeReviewId = problems[0]?.exampleReviewIds[0] ?? null;
  const openActionCount = actionItems.filter((a) => a.restaurantId === activeRestaurantId && !TERMINAL.has(a.status)).length;

  // First time landing on the dashboard this browser, walk through the closed loop unasked;
  // after that it is opt-in only, from the header.
  useEffect(() => {
    if (tourSeen || location.pathname !== '/dashboard' || !activeRestaurantId) return;
    const timer = setTimeout(() => startTour(Boolean(topNegativeReviewId)), 700);
    return () => clearTimeout(timer);
  }, [tourSeen, location.pathname, activeRestaurantId, topNegativeReviewId, startTour]);

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
          onStartTour={() => startTour(Boolean(topNegativeReviewId))}
        />
        <Layout.Content style={{ padding: '24px 32px 40px' }}>
          <Content>
            <Outlet />
          </Content>
        </Layout.Content>
      </Layout>
      <TourOverlay analysisReviewId={topNegativeReviewId} />
    </Layout>
  );
}
