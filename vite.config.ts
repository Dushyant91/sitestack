import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/engine/index.ts'),
      name: 'SiteStackEngine',
      fileName: (format) => `sitestack-engine.${format}.js`,
      formats: ['es'],
    },
    sourcemap: true,
  },
});
