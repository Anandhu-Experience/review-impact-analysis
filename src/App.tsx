import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import SignInPage from './xmp/pages/SignInPage';
import { xmpRoutes } from './xmp/routes';
import { XmpSessionProvider } from './xmp/session';

const router = createBrowserRouter([
  { path: '/signin', element: <SignInPage /> },
  xmpRoutes,
  { path: '/', element: <Navigate to="/signin" replace /> },
  { path: '*', element: <Navigate to="/signin" replace /> },
]);

export default function App() {
  return (
    <XmpSessionProvider>
      <RouterProvider router={router} />
    </XmpSessionProvider>
  );
}
