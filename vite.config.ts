/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Порты можно сменить, если стандартные заняты: TWINLINE_WEB_PORT, TWINLINE_API_PORT.
const webPort = Number(process.env.TWINLINE_WEB_PORT ?? 5173)
const apiPort = Number(process.env.TWINLINE_API_PORT ?? 8000)

export default defineConfig(({ command }) => ({
  // Сборка кладётся в backend/public/app — Laravel раздаёт её как одностраничное приложение.
  base: command === 'build' ? '/app/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: webPort,
    strictPort: true,
    // API на Laravel (backend/) запускается вместе с фронтендом: npm run dev
    proxy: { '/api': { target: `http://127.0.0.1:${apiPort}` } },
  },
  build: {
    outDir: 'backend/public/app',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // Крупные библиотеки — отдельными файлами: кешируются браузером между обновлениями приложения
        // и не грузятся на экранах, где не нужны (Three.js — только в 3D-туре, React Flow — в двойнике).
        codeSplitting: {
          groups: [
            { name: 'vendor-three', test: /node_modules[\/](three|@react-three|three-stdlib|camera-controls|troika|meshline|maath)/, priority: 30 },
            { name: 'vendor-flow', test: /node_modules[\/]@xyflow/, priority: 25 },
            { name: 'vendor-charts', test: /node_modules[\/](recharts|d3-|victory-vendor|@reduxjs|react-redux|immer|reselect|es-toolkit|decimal\.js)/, priority: 20 },
            { name: 'vendor-react', test: /node_modules[\/](react|react-dom|react-router|scheduler|zustand|use-sync-external-store)[\/]/, priority: 15 },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
