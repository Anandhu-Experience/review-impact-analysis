import { Navigate } from 'react-router-dom';
import { useRIAStore } from '../store/useRIAStore';
import { AppLayout } from '../components/layout/AppLayout';

// Redirect to /login when unauthenticated; otherwise render the authed shell.
export function ProtectedRoute() {
  const currentUserId = useRIAStore((s) => s.currentUserId);
  return currentUserId ? <AppLayout /> : <Navigate to="/login" replace />;
}
