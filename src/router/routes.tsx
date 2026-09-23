import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ReviewsPage from '../pages/ReviewsPage';
import AnalysisPage from '../pages/AnalysisPage';
import ActionPlanPage from '../pages/ActionPlanPage';
import ImpactPage from '../pages/ImpactPage';
import EvalsPage from '../pages/EvalsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/reviews', element: <ReviewsPage /> },
      { path: '/analysis/:reviewId', element: <AnalysisPage /> },
      { path: '/action-plan', element: <ActionPlanPage /> },
      { path: '/impact', element: <ImpactPage /> },
      { path: '/evals', element: <EvalsPage /> },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
