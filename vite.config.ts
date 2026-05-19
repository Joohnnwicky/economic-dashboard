/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // FRED API 代理
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, '/fred'),
      },
      // BLS API 代理 (POST 请求)
      '/api/bls': {
        target: 'https://api.bls.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bls/, '/publicAPI/v2'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.method === 'POST') {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
          });
        },
      },
      // CoinGecko API 代理
      '/api/coingecko': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, '/api/v3'),
      },
      // Alpha Vantage API 代理
      '/api/alphavantage': {
        target: 'https://www.alphavantage.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/alphavantage/, '/query'),
      },
      // 东方财富 API 代理 (A股数据)
      '/api/eastmoney': {
        target: 'https://push2.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoney/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://eastmoney.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
          });
        },
      },
      // 东方财富历史K线API代理
      '/api/eastmoneykline': {
        target: 'http://push2his.eastmoney.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoneykline/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://eastmoney.com/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0');
          });
        },
      },
      // 腾讯财经 API 代理 (A股数据 - 最稳定)
      '/api/tencent': {
        target: 'http://qt.gtimg.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tencent/, ''),
      },
      // Python后端代理 (自选股数据)
      '/api/backend': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})