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
    sourcemap: true,
    rollupOptions: {
      input: {
        'service-worker': path.resolve(__dirname, 'src/extension/background/service-worker.ts'),
        'isolated-probe': path.resolve(__dirname, 'src/extension/content/isolated-probe.ts'),
        'main-probe': path.resolve(__dirname, 'src/extension/content/main-probe.ts'),
        'engine': path.resolve(__dirname, 'src/engine/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        format: 'es',
      },
    },
  },
});
