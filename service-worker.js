const CACHE_NAME = 'workout-session-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
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

// Réception d'une vraie notification push envoyée par le serveur (fonctionne appli fermée).
self.addEventListener('push', (event) => {
  let data = { title: 'Workout Session', body: "C'est l'heure de ta séance 💪" };
  try{ if(event.data) data = { ...data, ...event.data.json() }; }catch(e){}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200,100,200]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for(const c of clients){ if('focus' in c) return c.focus(); }
      if(self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});

// Cache-first: l'appli s'ouvre instantanément et fonctionne hors-ligne.
// En parallèle, on va chercher une version plus récente sur le réseau pour la prochaine visite.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
