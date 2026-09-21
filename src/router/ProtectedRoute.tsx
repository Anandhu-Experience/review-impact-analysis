import { Spin } from 'antd';
import { Navigate } from 'react-router-dom';
import { useRIAStore } from '../store/useRIAStore';
import { AppLayout } from '../components/layout/AppLayout';

// Redirect to /login when unauthenticated; otherwise render the authed shell.
export function ProtectedRoute() {
  const currentUserId = useRIAStore((s) => s.currentUserId);
  const authReady = useRIAStore((s) => s.authReady);

  // With Supabase on, a persisted currentUserId is a guess until the session comes back.
  // Holding here for one round-trip beats flashing the app at someone who is signed out —
  // or the login screen at someone who is not.
  if (!authReady) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return currentUserId ? <AppLayout /> : <Navigate to="/login" replace />;
}
