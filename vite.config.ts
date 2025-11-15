import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
        global: 'globalThis',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Polyfill Node.js modules for Parse SDK
          'events': path.resolve(__dirname, 'src/events-shim.ts'),
        }
      },
      optimizeDeps: {
        include: ['parse'],
        exclude: []
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true
        },
        rollupOptions: {
          external: ['os'], // Externalize os module
        }
      }
    };
});
