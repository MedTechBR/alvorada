// Capturas de cenas de jogo no 3D (interior, batalha com golpes, noite, montarias). Só desenvolvimento.
//   node tools/teste-3d/cenas.mjs "visual=3d" interior batalha noite voar correr nadar
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [qs = 'visual=3d', ...cenas] = process.argv.slice(2);
const W = +(process.env.W ?? 1280), H = +(process.env.H ?? 720), CEL = process.env.CEL === '1';
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
const CENAS = {
  interior: `const s = g.map.spots['dentro_casa_jogador']; g.player.x = s.x; g.player.y = s.y + 24; g.cam.x = s.x; g.cam.y = s.y;`,
  centro: `const s = g.map.spots['dentro_centro_campina'] ?? Object.entries(g.map.spots).find(([k]) => k.startsWith('dentro_centro'))[1]; g.player.x = s.x; g.player.y = s.y; g.cam.x = s.x; g.cam.y = s.y;`,
  noite: `g.mundo.setHour(21.5); const s = g.map.spots.inicio; g.player.x = s.x + 20; g.player.y = s.y + 30; g.cam.x = g.player.x; g.cam.y = g.player.y;`,
  tarde: `g.mundo.setHour(17.4); g.player.x = 297 * 16; g.player.y = 347 * 16;`,
  batalha: `g.player.x = 318 * 16; g.player.y = 292 * 16; g.cam.x = g.player.x; g.cam.y = g.player.y;
    await g.spawnWild(); await g.spawnWild(); const w = g.wilds.find((q) => q.alive); if (w) { w.x = g.player.x + 70; w.y = g.player.y - 50; w.ai.state = 'aggro'; w.aggroTarget = g.player; }
    g.throwMon(0, g.player.x + 20, g.player.y - 10); await new Promise((r) => setTimeout(r, 1200)); if (w) { w.x = g.player.x + 60; w.y = g.player.y - 50; w.hpShow = 9; }
    if (w) { w.busy = false; w.lock = 99; w.mon.level = Math.max(w.mon.level, 30); w.mon.stats = null; w.mon.calc?.(); w.mon.hp = w.mon.stats?.hp ?? w.mon.hp; }
    for (let i = 0; i < 3; i++) { const L = g.lead; if (L && w?.alive) { L.cds = [0, 0, 0, 0]; g.combat.use(L, 0, w.x, w.y - 8); } await new Promise((r) => setTimeout(r, 300)); }`,
  voar: `g.player.x = 297 * 16; g.player.y = 340 * 16; g.unlockMount('voar', { silent: true }); g.mount.fly?.(); await new Promise((r) => setTimeout(r, 2500)); g.player.y -= 40;`,
  correr: `g.player.x = 318 * 16; g.player.y = 292 * 16; g.unlockMount('correr', { silent: true }); await g.mount.call('correr');`,
  nadar: `const L = g.map; let best = null; const p0 = { x: 300, y: 330 }; for (let r = 1; r < 60 && !best; r++) for (let a = 0; a < 40 && !best; a++) { const x = Math.round(p0.x + Math.cos(a / 40 * 6.28) * r), y = Math.round(p0.y + Math.sin(a / 40 * 6.28) * r); if (L.at(x, y) === 4 && L.at(x, y - 3) === 4 && L.at(x + 3, y) === 4) best = { x, y }; }
    g.unlockMount('nadar', { silent: true }); if (best) { g.player.x = best.x * 16 + 8; g.player.y = best.y * 16 + 8; g.cam.x = g.player.x; g.cam.y = g.player.y; } await new Promise((r) => setTimeout(r, 600)); await g.mount.call('nadar');`,
  dynamax: `g.player.x = 318 * 16; g.player.y = 292 * 16; g.cam.x = g.player.x; g.cam.y = g.player.y;
    await g.spawnWild(); const w = g.wilds.find((q) => q.alive); if (w) { w.x = g.player.x + 90; w.y = g.player.y - 40; w.ai.state = 'aggro'; w.aggroTarget = g.player; }
    g.throwMon(0, g.player.x + 20, g.player.y - 10); await new Promise((r) => setTimeout(r, 1300));
    g.bag.dynamaxBand = 1; g.poder.lugarDynamax = () => true; g.poder.usar(); await new Promise((r) => setTimeout(r, 2600));`,
  escalar: `const L = g.map; let a = null; for (let y = 0; y < L.outdoorH && !a; y++) for (let x = 0; x < L.w && !a; x++) if (L.at(x, y) === 27 && L.at(x, y + 1) !== 27 && L.at(x, y + 1) !== 8) a = { x, y: y + 1 };
    if (a) { g.player.x = a.x * 16 + 8; g.player.y = a.y * 16 + 10; g.cam.x = g.player.x; g.cam.y = g.player.y; g.player.dir = 'up'; } g.unlockMount('escalar', { silent: true }); await g.mount.call('escalar'); g.player.y -= 20;`,
  mergulhar: `const L = g.map; let best = null; for (let r = 1; r < 90 && !best; r++) for (let a = 0; a < 60 && !best; a++) { const x = Math.round(300 + Math.cos(a / 60 * 6.28) * r), y = Math.round(330 + Math.sin(a / 60 * 6.28) * r); if (L.at(x, y) === 7 && L.at(x + 2, y) === 7 && L.at(x, y + 2) === 7) best = { x, y }; }
    g.unlockMount('mergulhar', { silent: true }); if (best) { g.player.x = best.x * 16 + 8; g.player.y = best.y * 16 + 8; g.cam.x = g.player.x; g.cam.y = g.player.y; } await new Promise((r) => setTimeout(r, 500)); await g.mount.call('mergulhar'); await new Promise((r) => setTimeout(r, 900)); g.mount.dive?.();`,
  objetos: `const want = ['strengthRock', 'chest', 'stoneDoor', 'barsGate', 'lever', 'iceBlock']; const o = g.map.objects.find((q) => want.includes(q.kind));
    if (o) { g.player.x = o.x + 24; g.player.y = o.y + 20; g.cam.x = g.player.x; g.cam.y = g.player.y; }`,
  toca: `const T = g.tocas; const t = T?.list?.find((q) => T.ativa?.(q)) ?? T?.list?.[0]; if (t) { T.ativa = () => true; g.player.x = t.px + 40; g.player.y = t.py + 60; g.cam.x = g.player.x; g.cam.y = g.player.y; }`,
  // cenário vivo: uma árvore caindo, uma virando toco, uma casa danificada e o Pokémon no telhado
  vivo: `const V = g.vivo, M = g.map; const perto = (k, x0, y0, r) => M.objects.filter((o) => !o.dead && k(o.kind) && Math.abs(o.tx - x0) < r && Math.abs(o.ty - y0) < r);
    const casas = perto((k) => /house|casa/i.test(k), 297, 345, 30), arv = perto((k) => /^tree|pine|autumn/.test(k), 297, 345, 30);
    const c = casas[0]; if (c) { g.player.x = c.x - 40; g.player.y = c.y + 60; g.cam.x = g.player.x; g.cam.y = g.player.y; for (let i = 0; i < 12; i++) V.golpe(c, { type: 'fighting', cat: 'phys', power: 120 }, 3, g.player); }
    for (const a of arv.slice(0, 2)) V.golpe(a, null, 6, g.player, { explosao: true });
    g.throwMon(0, g.player.x + 20, g.player.y); await new Promise((r) => setTimeout(r, 1400));
    if (c && g.lead) { g.lead.x = c.x; g.lead.y = c.y - 10; V.subir?.(g.lead, c, { instantaneo: true }); }`,
};
const b = await launch();
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&${qs}`, 'p');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: CEL ? 2 : 1, mobile: CEL });
  if (CEL) { await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await P.raw('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' }); await P.raw('Page.reload', { ignoreCache: false }); await sleep(1500); }
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(2500);
  for (const c of cenas) {
    await P.ev(`(async () => { const g = game; ${CENAS[c] ?? ''} return 1; })()`).catch((e) => console.log('cena', c, e.message));
    await sleep(+(process.env.WAIT ?? 1800));
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
    const f = new URL(`cena-${c}${CEL ? '-cel' : ''}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64')); console.log('ok', f.pathname);
  }
  const errs = P.logs.filter((l) => /EXC|rror/.test(l)); if (errs.length) console.log('console:', [...new Set(errs)].slice(0, 10).join('\n'));
} finally { b.kill(); }
