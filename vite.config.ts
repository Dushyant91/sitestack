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
        popup: path.resolve(__dirname, 'popup/index.html'),
        canvas: path.resolve(__dirname, 'canvas.html'),
        'service-worker': path.resolve(__dirname, 'src/extension/background/service-worker.ts'),
        'isolated-probe': path.resolve(__dirname, 'src/extension/content/isolated-probe.ts'),
        'main-probe': path.resolve(__dirname, 'src/extension/content/main-probe.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker' || chunkInfo.name === 'isolated-probe' || chunkInfo.name === 'main-probe') {
            return '[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        format: 'es',
      },
    },
  },
});
