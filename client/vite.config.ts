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
        name: 'Buzzer',
        short_name: 'Buzzer',
        description: 'A social media web application.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Runs as a standalone app
        start_url: '/auth', // Ensures the app loads correctly
        icons: [
          {
            src: '/icons/icon1.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon2.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
