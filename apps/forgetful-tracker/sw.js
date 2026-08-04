// Minimal service worker: enables "Add to Home Screen" and offline access,
// and is required so showNotification() works reliably on mobile Chrome.
const CACHE_NAME = 'forgetful-tracker-v3';
const ASSETS = ['./', './index.html', './style.css', './script.js', './manifest.json', './icon.svg'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request);
    })
  );
});

// サーバー(Edge Function)から送られてくる本物のプッシュ通知を受け取って表示する。
// アプリが閉じていても、他のアプリを使っていてもここは起動する。
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }

  const title = data.title || "Don't forget!";
  const options = {
    body: data.body || '',
    tag: data.tag || 'forgetful-tracker',
    icon: './icon.svg',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function (clientsArr) {
      for (const client of clientsArr) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
