// Service worker mínimo (9-nov-2026): guarda la app para que se abra sin conexión.
// Estrategia: responde con lo guardado y, a la vez, pide la versión nueva para la próxima vez.
// Al publicar una versión nueva, cambiar VERSION para que se renueve la caché.
var VERSION = 'hsk-2026-11-12-2';
var ARCHIVOS = ['./', './index.html', './manifest.webmanifest',
  './img/cabecera-paisaje.svg', './img/logo-montanas.svg', './img/nube.svg', './img/tarjeta-paisaje.svg',
  './img/icono-192.png', './img/icono-512.png', './img/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    // Solo las cachés de esta app (prefijo hsk-): en GitHub Pages el dominio lo comparten otras apps
    return Promise.all(ks.filter(function (k) { return k.indexOf('hsk-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (guardado) {
      var red = fetch(e.request).then(function (r) {
        if (!r || !r.ok) return r;
        return c.put(e.request, r.clone()).then(function () { return r; });
      }).catch(function () { return guardado; });
      e.waitUntil(red.then(function () {}, function () {})); // que la actualización termine aunque ya se haya respondido
      return guardado || red;
    });
  }));
});
