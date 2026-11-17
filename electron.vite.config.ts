import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    build: { lib: { entry: resolve(__dirname, 'apps/overlay/src/main/index.ts') } },
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@core': resolve(__dirname, 'packages/core/src') } }
  },
  preload: {
    build: { lib: { entry: resolve(__dirname, 'apps/overlay/src/preload/index.ts') } },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: resolve(__dirname, 'apps/overlay/src/renderer'),
    build: { rollupOptions: { input: resolve(__dirname, 'apps/overlay/src/renderer/index.html') } },
    resolve: { alias: { '@': resolve(__dirname, 'apps/overlay/src/renderer') } },
    plugins: [vue()]
  }
});
