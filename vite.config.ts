import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 5 + @vitejs/plugin-react (Babel). No path aliases (relative imports only),
// which keeps the services ESLint no-restricted-imports patterns simple.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200 },
});
