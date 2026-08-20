// SUBIR ESTE NÚMERO EN CADA PUBLICACIÓN.
//
// No es solo por la caché: cambiar este archivo es lo ÚNICO que le avisa al navegador que
// hay una versión nueva. Si sw.js no cambia, el navegador no reinstala nada, no dispara
// controllerchange, y un teléfono con la app en la pantalla de inicio se queda con la
// versión vieja para siempre — pasaron 17 publicaciones así, y el usuario no vio ninguna.
//
// Además purga la caché anterior (ver el handler de activate), que hace falta cada vez que
// se borra o renombra un archivo que la app importa: un main.js viejo cacheado que importe
// un módulo que ya no existe no arranca. Pasó al fusionar las dos pestañas de finanzas.
const CACHE_NAME = 'agentebacu-shell-v7';
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
