const CACHE_NAME = 'addc-v1';

// Fichiers essentiels à mettre en cache pour le mode hors ligne
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

// INSTALL — mise en cache au premier chargement
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ACTIVATE — supprime les anciens caches
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

// FETCH — Cache First : répond depuis le cache, sinon réseau
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET et les extensions Chrome
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Mettre en cache les nouvelles ressources valides
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Hors ligne et pas en cache — retourne index.html comme fallback
        return caches.match('/app-addc/index.html');
      });
    })
  );
});
