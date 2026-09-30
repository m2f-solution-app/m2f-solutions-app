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

// ---------- Notificaciones push (28/9, pedido de Martin — parte 1) ----------
// Lo único que hace este Service Worker con las notificaciones: mostrarlas cuando
// llega un push (aunque la app esté cerrada) y, si la tocan, enfocar una pestaña
// existente de la app o abrir una nueva. El envío en sí (parte 2, pendiente) lo va
// a hacer una Edge Function del lado del servidor usando las claves VAPID.
self.addEventListener('push', (event) => {
  let datos = {};
  try { datos = event.data ? event.data.json() : {}; }
  catch (e) { datos = { titulo: 'M2F Solutions', cuerpo: event.data ? event.data.text() : '' }; }

  const titulo = datos.titulo || datos.title || 'M2F Solutions';
  const opciones = {
    body: datos.cuerpo || datos.body || '',
    icon: datos.icon || 'icon-192.png',
    badge: datos.badge || 'icon-192.png',
    data: { url: datos.url || './' },
  };
  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      const existente = lista.find((c) => 'focus' in c);
      if (existente){
        // App ya abierta: la página no se entera sola de que tocaron el aviso (no hay
        // cambio de visibilidad), así que se lo decimos para que abra el Wellness/aviso.
        try { existente.postMessage({ m2f: 'notificacion_tocada', url }); } catch (e) {}
        return existente.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
