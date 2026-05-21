const CACHE = 'touch-formacao-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './bg.jpg', './field.png', './squad.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function shouldCache(url) {
  if (url.pathname.includes('/@vite/') || url.pathname.includes('/@id/')) return false;
  if (url.pathname.startsWith('/src/')) return false;
  if (url.pathname.startsWith('/node_modules/')) return false;
  if (url.search.includes('import') || url.search.includes('t=')) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!shouldCache(url)) {
    event.respondWith(fetch(req));
    return;
  }
  event.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
      return res;
    }).catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
