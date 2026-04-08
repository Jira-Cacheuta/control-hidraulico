import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** Misma base que en producción si el front vive en subcarpeta (coherente con `manifest.scope` / `start_url`). */
const BASE = '/'

export default defineConfig(() => {
  const iconBase = BASE.replace(/\/$/, '') || ''

  return {
    base: BASE,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'pwa-32x32.png',
          'pwa-48x48.png',
          'pwa-192x192.png',
          'pwa-256x256.png',
          'pwa-512x512.png',
          'maps/*.pdf',
        ],
        manifest: {
          name: 'Control hidráulico',
          short_name: 'Control hidráulico',
          description: 'Panel de operación y monitoreo (datos en vivo vía backend)',
          lang: 'es',
          display: 'standalone',
          theme_color: '#3182CE',
          background_color: '#F7FAFC',
          start_url: BASE,
          scope: BASE,
          icons: [
            {
              src: `${iconBase}/pwa-32x32.png`,
              sizes: '32x32',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${iconBase}/pwa-48x48.png`,
              sizes: '48x48',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${iconBase}/pwa-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${iconBase}/pwa-256x256.png`,
              sizes: '256x256',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${iconBase}/pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${iconBase}/pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      allowedHosts: ['uncontinued-hisako-interpolable.ngrok-free.dev'],
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
