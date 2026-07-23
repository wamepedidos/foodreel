import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

declare const process: { env: Record<string, string | undefined> };

const base = process.env.GITHUB_PAGES === 'true' ? '/foodreel/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['offline.html', 'brand/foodreel-logo.png', 'icons/foodreel-192.png', 'icons/foodreel-512.png'],
      manifest: {
        name: 'FoodReel - Carta digital social',
        short_name: 'FoodReel',
        description: 'Menu real e interaccion social para restaurantes.',
        theme_color: '#0B0B0C',
        background_color: '#0B0B0C',
        display: 'standalone',
        lang: 'es',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          {
            src: `${base}icons/foodreel-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: `${base}icons/foodreel-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'foodreel-food-images',
              expiration: {
                maxEntries: 24,
                maxAgeSeconds: 60 * 60 * 24 * 14
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.coverr\.co\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'foodreel-food-videos',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
