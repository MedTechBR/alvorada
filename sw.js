// Service worker do Pokémon Alvorada: REDE PRIMEIRO.
// Com internet, tudo vem sempre do servidor (nunca prende uma versão velha do jogo);
// a cópia em cache só é usada quando a rede falha (jogar offline depois de abrir uma vez).
const CACHE = 'alvorada-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'src/main.js', 'src/ui/style.css', 'src/ui/menu.css', 'assets/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/__')) return; // ferramentas de teste
  const mine = url.origin === location.origin, cdn = url.hostname === 'cdn.jsdelivr.net';
  if (!mine && !cdn) return;
  e.respondWith((async () => {
    try {
      // no-cache: revalida com o servidor sempre (o cache HTTP não segura arquivo velho)
      const res = await fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache', credentials: 'same-origin' });
      if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: mine });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await caches.match('index.html'); if (home) return home; }
      throw err;
    }
  })());
});
