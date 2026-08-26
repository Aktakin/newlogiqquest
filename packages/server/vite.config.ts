import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/** Used when Vercel’s root directory is `packages/server`. */
export default defineConfig({
  plugins: [react()],
  root: fileURLToPath(new URL('../client', import.meta.url)),
  resolve: {
    alias: {
      '@logiq/engine': fileURLToPath(new URL('../engine/src/index.ts', import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('../client/dist', import.meta.url)),
    emptyOutDir: true,
  },
});
