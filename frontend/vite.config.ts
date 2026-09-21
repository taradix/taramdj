/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// In dev there is no nginx in front of us, so proxy the sheet here instead.
// SHEET_ID / SHEET_TAB come from the compose environment.
export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const tab = env.SHEET_TAB || 'Evenements'

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/evenements.csv': {
          target: 'https://docs.google.com',
          changeOrigin: true,
          rewrite: () =>
            `/spreadsheets/d/${env.SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${tab}`,
        },
      },
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/test/setup.ts',
      css: true,
    },
  }
})
