// Fluxos dos interiores no Chrome sem interface: curar com a Joy (Centro de Cidade Coral) e comprar no Mercado
// (um gerado, onde o vendedor está sempre) andando de verdade até o balcão e apertando o botão de ação.
//   python3 tools/serve.py 8750 &   node tools/teste-3d/salas-fluxo.mjs
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
const b = await launch(9500 + Math.floor(Math.random() * 300));
let falhas = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALHA') + ' ' + m); if (!c) falhas++; };
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&visual=3d`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: false });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(2500);
  const ev = (x) => P.ev(x);
  const foto = async (n) => { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); writeFileSync(new URL(n + '.jpg', out), Buffer.from(s.result.data, 'base64')); };
  const tecla = async (code) => { await ev(`(dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })), 1)`); await sleep(90); await ev(`(dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })), 1)`); await sleep(160); };
  // anda de verdade: caminho por busca em largura nos blocos livres (map.solidAt) e as setas apertadas bloco a bloco
  const andar = async (tx, ty) => {
    const rota = await ev(`(() => { const m = game.map, p = game.player, sx = Math.floor(p.x / 16), sy = Math.floor(p.y / 16);
      const livre = (x, y) => !m.solidAt(x * 16 + 8, y * 16 + 10), k = (x, y) => x + ',' + y, de = new Map([[k(sx, sy), null]]), fila = [[sx, sy]];
      while (fila.length) { const [x, y] = fila.shift(); if (x === ${tx} && y === ${ty}) break; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = k(x + a, y + b); if (!de.has(q) && livre(x + a, y + b)) { de.set(q, [x, y]); fila.push([x + a, y + b]); } } }
      if (!de.has(k(${tx}, ${ty}))) return null; const r = []; let c = [${tx}, ${ty}]; while (c) { r.unshift(c); c = de.get(k(...c)); } return r; })()`);
    if (!rota) { console.log('  sem rota até', tx, ty, await ev(`[Math.floor(game.player.x / 16), Math.floor(game.player.y / 16)]`)); return false; }
    for (const [x, y] of rota.slice(1)) {
      for (let i = 0; i < 30; i++) {
        const p = await ev(`[game.player.x, game.player.y]`), dx = (x * 16 + 8) - p[0], dy = (y * 16 + 10) - p[1];
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) break;
        const code = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        await ev(`(dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })), 1)`); await sleep(45);
        await ev(`(dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })), 1)`); await sleep(30);
      }
    }
    const p = await ev(`[game.player.x, game.player.y]`);
    if (process.env.DEBUG) console.log('  rota', rota.length, 'fim', p, 'alvo', tx * 16 + 8, ty * 16 + 10);
    return Math.abs(p[0] - (tx * 16 + 8)) < 5 && Math.abs(p[1] - (ty * 16 + 10)) < 5;
  };
  const sala = (id) => ev(`(() => { const r = game.map.interiors.find((q) => q.id === '${id}'); let mx = 2, my = 3; r.rows.forEach((row, j) => { const i = row.indexOf('m'); if (i >= 0) { mx = i; my = j - 1; } });
    game.player.x = (r.x + mx) * 16 + 8; game.player.y = (r.y + my) * 16 + 10; if (game.cam) { game.cam.x = game.player.x; game.cam.y = game.player.y; } return [r.x, r.y]; })()`);
  const virar = async (code) => { await ev(`(dispatchEvent(new KeyboardEvent('keydown', { code: '${code}', key: '${code}', bubbles: true })), 1)`); await sleep(30); await ev(`(dispatchEvent(new KeyboardEvent('keyup', { code: '${code}', key: '${code}', bubbles: true })), 1)`); await sleep(200); };
  const dialogo = () => ev(`(() => { const d = document.querySelector('#dialog, .dialog, #say, .gm-say'); return !!(d && d.offsetParent) || game.ui.state !== 'play'; })()`);

  // ---- Centro: Joy cura ----
  const [rx, ry] = await sala('centro_coral'); await sleep(1500);
  await ev(`(game.party.forEach((m) => { m.hp = 1; }), 1)`);
  const joy = await ev(`(() => { const n = game.mundo.people.list.find((q) => q.def.heal && q.def.room === 'centro_coral'); return n ? [Math.floor((n.x - 8) / 16) - ${rx}, Math.round((n.y - 10) / 16) - ${ry}] : null; })()`);
  ok(!!joy, 'Joy no Centro de Cidade Coral em ' + JSON.stringify(joy));
  const chegou = await andar(rx + joy[0], ry + joy[1] + 2); ok(chegou, 'andou até a frente do balcão (porta → balcão)');
  await virar('ArrowUp'); await foto('fluxo-centro-balcao');
  await tecla('KeyE'); await sleep(400);
  ok(await ev(`game.ui.dialog.open`), 'a Joy respondeu (diálogo aberto)');
  for (let i = 0; i < 12 && await ev(`game.ui.dialog.open`); i++) { await tecla('KeyE'); await sleep(350); }
  await sleep(500);
  const hp = await ev(`game.party.every((m) => m.hp >= m.stats.hp)`);
  ok(hp, 'Joy curou a equipe por cima do balcão');

  // ---- Mercado gerado: compra de verdade ----
  const loja = await ev(`(game.map.interiors.find((q) => q.gerado && q.estilo === 'loja') ?? {}).id`);
  const [lx, ly] = await sala(loja); await sleep(1500);
  const vend = await ev(`(() => { const n = game.mundo.people.list.find((q) => /_vendedor$/.test(q.def.id ?? '') && q.def.room === '${loja}'); return n ? [Math.round((n.x - 8) / 16) - ${lx}, Math.floor((n.y - 10) / 16) - ${ly}] : null; })()`);
  ok(!!vend, `vendedor no ${loja} em ${JSON.stringify(vend)}`);
  ok(await andar(lx + vend[0], ly + vend[1] + 2), 'andou até a frente do caixa');
  await virar('ArrowUp');
  await ev(`(game.money = 5000, game.bag.potion = game.bag.potion ?? 0, 1)`);
  const antes = await ev(`[game.money, game.bag.potion ?? 0]`);
  await tecla('KeyE'); await sleep(500);
  for (let i = 0; i < 6 && await ev(`game.ui.dialog.open`); i++) { await tecla('KeyE'); await sleep(450); }
  await sleep(400);
  const aberto = await ev(`!!document.querySelector('#gmenu .gm-shopmain')`);
  ok(aberto, 'a loja abriu ao falar com o vendedor');
  await foto('fluxo-loja-aberta');
  const click = (sel, i = 0) => ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})][${i}]; if (!e) return false; (e._act ?? e.click).call(e); return true; })()`);
  await click('#gmenu .gm-shopmain .nav', 0); await sleep(400);
  await ev(`(() => { const e = [...document.querySelectorAll('#gmenu .gm-item')].find((q) => q.dataset.k === 'potion'); if (e) (e._act ?? e.click).call(e); return !!e; })()`); await sleep(400);
  await click('#gmenu .gm-pop .nav', 0); await sleep(500);
  await foto('fluxo-loja-confirma');
  // "Sim" da pergunta
  await ev(`(() => { const e = [...document.querySelectorAll('#gmenu .nav')].find((q) => /Sim/.test(q.textContent)); if (e) (e._act ?? e.click).call(e); return !!e; })()`); await sleep(700);
  const depois = await ev(`[game.money, game.bag.potion ?? 0]`);
  ok(depois[1] === antes[1] + 1 && depois[0] < antes[0], `comprou 1 Poção (₽ ${antes[0]} → ${depois[0]}, Poções ${antes[1]} → ${depois[1]})`);
  await foto('fluxo-loja-comprou');
  const errs = P.logs.filter((l) => /EXC|rror/.test(l));
  ok(!errs.length, `console sem erros (${errs.length})`);
  if (errs.length) console.log(errs.slice(0, 10).join('\n'));
} finally { b.kill(); }
process.exitCode = falhas ? 1 : 0;
