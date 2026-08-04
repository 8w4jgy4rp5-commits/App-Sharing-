// Minimal service worker: enables "Add to Home Screen" and offline access,
// and is required so showNotification() works reliably on mobile Chrome.
const CACHE_NAME = 'forgetful-tracker-v7';
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

// ネットワーク優先: オンラインなら毎回サーバーから最新を取りに行き、取れたらキャッシュも更新する。
// オフラインでネットワークに届かない時だけ、最後に取れたキャッシュを使う(以前は逆で、
// 一度キャッシュしたら新しいデプロイをしても古い内容を返し続けてしまっていた)。
self.addEventListener('fetch', function (event) {
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then(function (response) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(function () {
        return caches.match(event.request);
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
