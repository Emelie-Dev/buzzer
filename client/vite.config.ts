import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates service worker
      devOptions: { enabled: true }, // Enables PWA in dev mode
      manifest: {
        name: 'My PWA App',
        short_name: 'PWA',
        description:
          'A Progressive Web App built with Vite, React, and TypeScript.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Runs as a standalone app
        start_url: '/', // Ensures the app loads correctly
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
