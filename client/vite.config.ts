import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // use custom service worker
      srcDir: 'src', // location of your custom SW
      filename: 'sw.js',
      injectManifest: {
        swSrc: 'src/sw.js',
        swDest: 'dist/sw.js', // explicitly different
      },
      registerType: 'autoUpdate', // Auto-update service worker
      manifest: {
        name: 'Buzzer',
        short_name: 'Buzzer',
        description: 'A social media web application.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-icons/icon1.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icons/icon2.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  define: {
    __DEFINES__: {},
  },
});
