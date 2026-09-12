/* =====================================================================
   CobbleWorks — Service Worker
   ---------------------------------------------------------------------
   方針：ネットワーク優先（network-first）
   オンラインなら必ず最新を取りに行き、ついでにキャッシュを更新する。
   オフラインのときだけキャッシュを返す。
   → 「更新したのに古い画面が出続ける」事故が起きない。
   ===================================================================== */

// キャッシュの世代。中身を作り変えたらこの数字を上げると古いキャッシュが捨てられる。
const CACHE = 'cobbleworks-v1';

// 最初にまとめて保存しておくファイル（確実に存在するものだけに絞る）
const PRECACHE = [
  './',
  'index.html',
  'offline.html',
  'style.css',
  'tokens.css',
  'script.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // 1つでも失敗すると install ごと失敗するので、個別に足して失敗は無視する
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // GET 以外は触らない（フォーム送信などを壊さないため）
  if (req.method !== 'GET') return;

  // 別ドメイン（Supabase / Google ログイン / Google Fonts）は一切さわらない
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 正常に取れたときだけキャッシュを差し替える
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          // ページ遷移でキャッシュも無いときだけオフライン用の画面を出す
          if (req.mode === 'navigate') return caches.match('offline.html');
          return Response.error();
        })
      )
  );
});
