import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Auto-update service worker
      devOptions: { enabled: true }, // Enable in dev mode
      manifest: {
        name: 'Buzzer',
        short_name: 'Buzzer',
        description: 'A social media web application.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/auth',
        icons: [
          { src: '/pwa-icons/icon1.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icons/icon2.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg}'], // Cache assets
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst', // Try network first, fallback to cache
            options: { cacheName: 'pages-cache' },
          },
          {
            urlPattern: ({ url }) => url.pathname === '/offline.html',
            handler: 'CacheFirst',
            options: { cacheName: 'offline-cache' },
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 5,
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) =>
                    response && response.status === 200
                      ? response
                      : caches.match('/offline.html'),
                },
              ],
            },
          },
        ],
      },
    }),
  ],
});
