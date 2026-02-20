const CACHE_NAME = 'addc-v2';
const FILES_TO_CACHE = [
  '/app-addc/',
  '/app-addc/index.html',
  '/app-addc/manifest.json',
  '/app-addc/android-launchericon-192-192.png',
  '/app-addc/android-launchericon-512-512.png',
  '/app-addc/android-launchericon-144-144.png',
  '/app-addc/android-launchericon-96-96.png',
  '/app-addc/android-launchericon-72-72.png',
  '/app-addc/android-launchericon-48-48.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  // API — toujours aller au réseau, jamais cacher
  if (event.request.url.includes('addc.smddesign.ca')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match('/app-addc/index.html');
      });
    })
  );
});
