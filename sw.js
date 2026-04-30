const CACHE = 'life-planner-v4';

const ASSETS = [
  '/life-planner/',
  '/life-planner/index.html',
  '/life-planner/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  // Don't auto-skip — let the page trigger skipWaiting via postMessage
  // so the reload is controlled and intentional
});

// Allow page to trigger activation when ready
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for HTML (always get latest), cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isHTML) {
    // Network first for HTML — phone always gets the latest version
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first for assets (fonts, scripts)
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
