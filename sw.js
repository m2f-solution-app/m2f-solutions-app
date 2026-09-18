// Service Worker de M2F Solutions — su único trabajo es evitar que el celular (sobre
// todo la app agregada a la pantalla de inicio) se quede mostrando una copia vieja
// cacheada de index.html. No guarda nada para uso offline a propósito: cada vez que se
// abre o se vuelve a abrir la app, esto obliga a pedir la versión más nueva a internet.
//
// Se activa solo (skipWaiting + clients.claim) para no dejar una versión anterior del
// propio Service Worker dando vueltas esperando que se cierren todas las pestañas.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo nos metemos en la carga de la página en sí (navegación) y del propio
  // index.html — todo lo demás (Supabase, gifs, fuentes, etc.) sigue su curso normal.
  const esNavegacion = req.mode === 'navigate' || req.destination === 'document';
  if (!esNavegacion) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' }).catch(() => fetch(req))
  );
});
