import { precacheAndRoute } from 'workbox-precaching';

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  console.log('🔔 Push received:', data);

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/icon.png', // optional
    badge: '/badge.png', // optional
    data: data.url ? { url: data.url } : {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// This is where Workbox will inject the precache manifest
precacheAndRoute(self.__WB_MANIFEST);
