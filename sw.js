// ShareMoments - Service Worker (sw.js) v3
const CACHE_NAME = 'sharemoments-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './client/welcome.html',
  './client/selector.html',
  './client/upload.html',
  './client/gallery.html',
  './client/contact.html',
  './client/guestbook.html',
  './client/firmas.html',
  './admin/login.html',
  './admin/panel.html',
  './projection/full_screen.html',
  './projection/guests.html',
  './projection/signatures.html'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Estrategia: Red-Primero (Network-First) para archivos dinámicos
  // Esto garantiza que vean los cambios de branding y fotos AL INSTANTE
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
