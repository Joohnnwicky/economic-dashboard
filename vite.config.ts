/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 后端代理目标可用环境变量覆盖（默认 localhost:8000；端口被占时可 BACKEND_TARGET=http://localhost:8001 npm run dev）
const BACKEND_TARGET = process.env.BACKEND_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Python后端代理 (所有API请求通过后端)
      '/api/backend': {
        target: BACKEND_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, '/api'),
      },
      // Frankfurter汇率API代理 (ECB数据，无API key)
      '/api/frankfurter': {
        target: 'https://api.frankfurter.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/frankfurter/, ''),
      },
      // 腾讯财经API代理 (A股指数)
      '/api/tencent': {
        target: 'https://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tencent/, ''),
      },
      // Polymarket API — 已迁移到后端代理 (/api/backend/polymarket)
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})