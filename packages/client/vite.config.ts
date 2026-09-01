import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * The engine is consumed as TypeScript source rather than a build artefact, so
 * a change to a rule or a level shows up in the browser on the next save.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@logiq/engine': fileURLToPath(new URL('../engine/src/index.ts', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
