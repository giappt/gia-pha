/**
 * Service Worker cho FAT (Family Tree Management System)
 * Xử lý Web Push Notifications & Tương tác mở liên kết ngày giỗ
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
    title: 'Thông Báo Ngày Giỗ Gia Tộc',
    body: 'Hôm nay dòng họ có ngày giỗ, kính mời con cháu tưởng nhớ tổ tiên.',
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

  const options = {
    body: data.body,
    badge: badgeUrl,
    vibrate: [200, 100, 200],
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: {
      url: data.url || '/anniversaries',
    },
  };

  if (data.icon) {
    options.icon = new URL(data.icon, origin).href;
  }

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
