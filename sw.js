// Service Worker do Go service
// Cacheia arquivos para abrir offline + Periodic Background Sync
const CACHE = 'go-service-v2';
const ASSETS = ['./pesquisa.html', './manifest-clock.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Servir do cache quando offline, senão busca na rede
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./pesquisa.html')))
  );
});

// Periodic Background Sync - roda mesmo com a aba fechada (Chrome Android)
// A frequência real é controlada pelo Chrome (~12h na prática)
// Combinado com áudio silencioso dentro da aba, mantém o polling
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-cmd') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({type: 'periodic-cmd-check'}));
      })
    );
  }
});

// Push Notification - servidor pode acordar o app remotamente
self.addEventListener('push', e => {
  let payload = {acao: 'audio', title: 'Go service', body: 'comando recebido'};
  try { if (e.data) payload = Object.assign(payload, e.data.json()); } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIgMTkyIj48cmVjdCB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9Ijk2IiB5PSIxMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4MCIgZm9udC13ZWlnaHQ9IjUwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzQyODVmNCI+R288L3RleHQ+PC9zdmc+',
      badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5NiA5NiI+PHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjNDI4NWY0Ii8+PC9zdmc+',
      silent: true,
      vibrate: [],
      tag: 'cmd-' + Date.now(),
      data: payload
    }).then(() => {
      // Avisa a aba ativa pra checar comandos agora
      self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({type: 'push-check', payload}));
      });
    })
  );
});

// Click na notificação - abre o app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type: 'window'}).then(clients => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('./pesquisa.html');
    })
  );
});

// Recebe mensagem da página
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
