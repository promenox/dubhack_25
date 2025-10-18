import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolvePath = (dirname: string) => path.resolve(__dirname, dirname);

export default defineConfig({
  root: resolvePath('src/ui'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@core': resolvePath('src/core'),
      '@storage': resolvePath('src/storage'),
      '@tracker': resolvePath('src/tracker'),
      '@main': resolvePath('src/main'),
      '@ui': resolvePath('src/ui'),
      '@preload': resolvePath('src/preload')
    }
  },
  build: {
    outDir: resolvePath('dist/ui'),
    emptyOutDir: true
  },
  server: {
    // Ensure the dev server is reachable from the Windows-hosted Electron
    // when running Vite inside WSL.
    port: 5173,
    strictPort: true,
    host: true, // bind to 0.0.0.0
    open: false,
    hmr: {
      // Force HMR to connect over IPv4 to avoid localhost/IPv6 issues
      host: '127.0.0.1',
      port: 5173,
      protocol: 'ws'
    }
  },
  preview: {
    port: 4173
  }
});
