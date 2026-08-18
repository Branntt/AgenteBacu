// Subir este número purga la caché anterior (ver el handler de activate). Hay que hacerlo
// cada vez que se borra o renombra un archivo que la app importa: si queda cacheado un
// main.js viejo que importa un módulo que ya no existe, la app no arranca. Pasó al fusionar
// las dos pestañas de finanzas, que eliminó views/finanzas.js.
const CACHE_NAME = 'agentebacu-shell-v3';
const APP_SHELL = [
  './',
  './index.html',
  './src/styles/tokens.css',
  './src/styles/main.css',
  './src/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
