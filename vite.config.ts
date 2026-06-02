import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 本機開發時，把 /api/* 的呼叫轉送到部署在 Vercel 的後端 functions。
    // 這樣 localhost 上跑的前端可以直接用線上 OAuth token 交換 API，
    // 不用本機跑 vercel dev。
    proxy: {
      '/api': {
        target: 'https://finance-manager-sooty-two.vercel.app',
        changeOrigin: true,
      },
    },
  },
})
