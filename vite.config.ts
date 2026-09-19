import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite 5 + @vitejs/plugin-react (Babel). No path aliases (relative imports only),
// which keeps the services ESLint no-restricted-imports patterns simple.
// Tailwind 4 is the only styling system here (antd and styled-components were
// removed with the RIA app), so preflight is enabled normally.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200 },
});
