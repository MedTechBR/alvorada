// Service worker do Pokémon Alvorada.
// - Código, mapa e telas: REDE PRIMEIRO (nunca prende uma versão velha do jogo). Se a rede falhar ou demorar
//   demais, usa a cópia guardada (jogar offline depois da primeira visita).
// - Sprites dos Pokémon (assets/pmd: 1025 espécies e as formas, centenas de MB no total): CACHE PRIMEIRO e SOB
//   DEMANDA. Cada espécie só é guardada quando aparece no jogo; nada é baixado de uma vez. As listas da raiz de
//   assets/pmd (index.json, substitutos.json) mudam quando entram sprites novos: essas vão pela rede primeiro.
// - Na primeira visita a página ainda não passa pelo service worker; por isso ela manda a lista do que já
//   carregou ({ type: 'guardar', urls }) e ele guarda esses arquivos, para o modo offline funcionar logo.
const CODE = 'alvorada-codigo-v4-acabamento';
const SPR = 'alvorada-sprites-v2'; // v2: todas as espécies e formas, só as animações usadas
const KEEP = [CODE, SPR];
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'src/main.js', 'src/ui/style.css', 'src/ui/menu.css', 'src/ui/encaixe.js', 'assets/icons/icon-192.png',
  'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.min.mjs', 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js'];
const NET_TIMEOUT = 6000; // ms: rede lenta demais = usa a cópia guardada

const isSprite = (url) => url.origin === location.origin && url.pathname.includes('/assets/pmd/') && !/\/assets\/pmd\/[^/]+\.json$/.test(url.pathname);
const cacheable = (url) => (url.origin === location.origin && !url.pathname.startsWith('/__')) || url.hostname === 'cdn.jsdelivr.net';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CODE).then((c) => c.addAll(CORE)).catch(() => {}));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!KEEP.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// a página manda o que já carregou antes de o service worker assumir
self.addEventListener('message', (e) => {
  const d = e.data;
  if (d?.type !== 'guardar' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const code = await caches.open(CODE), spr = await caches.open(SPR);
    for (const u of d.urls.slice(0, 600)) {
      let url; try { url = new URL(u, location.href); } catch { continue; }
      if (!cacheable(url)) continue;
      const c = isSprite(url) ? spr : code;
      if (await c.match(url.href, { ignoreSearch: true })) continue;
      try { const res = await fetch(url.href, { credentials: 'same-origin' }); if (res.ok) await c.put(url.href, res); } catch { /* sem rede: fica para a próxima */ }
    }
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!cacheable(url)) return;
  if (isSprite(url)) { e.respondWith(spriteFirst(req)); return; }
  e.respondWith(networkFirst(req, url));
});

// sprites: do cache se já tiver; senão da rede, e guarda
async function spriteFirst(req) {
  const c = await caches.open(SPR);
  const hit = await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) c.put(req, res.clone()).catch(() => {});
  return res;
}

async function networkFirst(req, url) {
  const mine = url.origin === location.origin;
  const net = fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache', credentials: 'same-origin' }).then((res) => {
    if (res.ok && (res.type === 'basic' || res.type === 'cors')) { const copy = res.clone(); caches.open(CODE).then((c) => c.put(req, copy)).catch(() => {}); }
    return res;
  });
  net.catch(() => {}); // se a cópia guardada já respondeu, a falha da rede não importa
  const fallback = async () => {
    const hit = await caches.match(req, { ignoreSearch: mine });
    if (hit) return hit;
    if (req.mode === 'navigate') return caches.match('index.html');
    return null;
  };
  try {
    // rede lenta demais: usa a cópia guardada (se houver); a rede segue atualizando o cache em segundo plano
    const timer = new Promise((r) => setTimeout(() => r('lento'), NET_TIMEOUT));
    const first = await Promise.race([net, timer]);
    if (first !== 'lento') return first;
    const hit = await fallback();
    return hit ?? await net;
  } catch (err) {
    const hit = await fallback();
    if (hit) return hit;
    throw err;
  }
}
