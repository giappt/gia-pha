/**
 * Service Worker cho FAT (Family Tree Management System)
 * Xử lý Web Push Notifications & Tương tác mở liên kết ngày giỗ
 * Version: 1.2.0 (Alpha Silhouette & Grouping Notifications)
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Lịch giỗ',
    body: 'Hôm nay dòng họ có ngày giỗ, kính mời con cháu tưởng nhớ tổ tiên.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    url: '/anniversaries',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const origin = self.location.origin;
  const badgeUrl = data.badge ? new URL(data.badge, origin).href : new URL('/icons/badge-72x72.png', origin).href;
  const iconUrl = new URL(data.icon || '/icons/icon-192x192.png', origin).href;

  const options = {
    body: data.body,
    icon: iconUrl,
    badge: badgeUrl,
    vibrate: [200, 100, 200],
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: {
      url: data.url || '/anniversaries',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/anniversaries';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
