// 貼圖鍵盤的離線快取：貼圖檔「先用快取」，頁面「先連網、失敗才用快取」
const V = '9c9081d0c7';
const CORE = `core-${V}`, IMG = `img-${V}`;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(['./', './manifest.webmanifest', './icons/app-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.endsWith(V)).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/s/') || url.pathname.includes('/icons/')) {
    e.respondWith(caches.open(IMG).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
  } else {
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CORE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./'))));
  }
});
