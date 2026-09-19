import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { RequirePermission } from './components/RequirePermission';
import { XmpShell } from './components/Shell';
import { SCREENS } from './registry';
import { PERSONA_LANDING, useXmpSession } from './session';

/** Everything under /xmp requires a session. Unauthenticated users go to sign-in. */
function XmpLayout() {
  const { signedIn } = useXmpSession();
  if (!signedIn) return <Navigate to="/signin" replace />;
  return <XmpShell />;
}

/** Sends a signed-in user to the landing route their persona declares. */
function LandingRedirect() {
  const { persona } = useXmpSession();
  return <Navigate to={PERSONA_LANDING[persona]} replace />;
}

/**
 * Every screen in the registry becomes a route, each wrapped in the same permission
 * guard the nav filters with. Routes are generated, never hand-listed, so the route
 * table and the nav cannot drift apart.
 */
export const xmpRoutes: RouteObject = {
  path: '/xmp',
  element: <XmpLayout />,
  children: [
    { index: true, element: <LandingRedirect /> },
    ...SCREENS.map((s) => ({
      // Children are relative to the /xmp parent.
      path: s.path.replace(/^\/xmp\//, ''),
      element: <RequirePermission gate={s.gate}>{s.render()}</RequirePermission>,
    })),
    { path: '*', element: <LandingRedirect /> },
  ],
};
