import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { ThemeProvider } from 'styled-components';
import { RouterProvider } from 'react-router-dom';
import { theme } from './styles/theme';
import { GlobalStyle } from './styles/GlobalStyle';
import { router } from './router/routes';
import { validateSeed } from './data/seed';
import { useRIAStore } from './store/useRIAStore';

// Dev-only referential-integrity assertion — surfaces a bad seed immediately.
if (import.meta.env.DEV) {
  const problems = validateSeed();
  if (problems.length) console.error('[RIA] validateSeed found problems:\n' + problems.join('\n'));
}

export default function App() {
  // Resolve the Supabase session once at boot; a no-op when Supabase is not configured.
  useEffect(() => {
    useRIAStore.getState().initAuth();
  }, []);

  return (
    <ConfigProvider
      componentSize="middle"
      getPopupContainer={(node) => (node?.parentElement as HTMLElement) ?? document.body}
    >
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <RouterProvider router={router} />
      </ThemeProvider>
    </ConfigProvider>
  );
}
