// Toque emulado (740x360): analógico em 4 direções com zona morta, direcional em cruz, botão de correr, FPS com CPU 4x mais lenta.
import { util } from './grade-util.mjs';
export default async function (ctx) {
  const { P, sleep } = ctx; const u = await util(ctx);
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open)'); i++) await sleep(500);
  console.log('toque?', await P.ev('document.body.classList.contains("touch") + " stick visível " + !document.getElementById("touch").hidden'));
  const rect = async (sel) => JSON.parse(await P.ev(`JSON.stringify((() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })())`));
  const tq = (type, id, x, y) => P.raw('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id }] });
  const stick = await rect('#stick');
  const arrasta = async (dx, dy, ms) => { await tq('touchStart', 1, stick.x, stick.y); await sleep(30); await tq('touchMove', 1, stick.x + dx, stick.y + dy); await sleep(ms); await tq('touchEnd', 1, 0, 0); };
  await u.tp(297, 351, 'down'); await sleep(300);
  let a = await u.est();
  await arrasta(8, 0, 500); await sleep(300); let b = await u.est(); console.log('zona morta (8 px): moveu?', b.tx - a.tx, b.ty - a.ty, 'esperado 0 0');
  await arrasta(30, 25, 300); await sleep(400); b = await u.est(); console.log('diagonal (30,25) -> dominante x: dx', b.tx - a.tx, 'dy', b.ty - a.ty, 'dir', b.dir, 'centro', u.centro(b));
  a = b; await arrasta(0, -34, 500); await sleep(400); b = await u.est(); console.log('para cima 500ms: dy', b.ty - a.ty, 'centro', u.centro(b));
  a = b; await arrasta(-52, 0, 600); await sleep(400); b = await u.est(); console.log('esquerda até a borda (corre) 600ms: dx', b.tx - a.tx, '(esperado ~5)', 'centro', u.centro(b));
  await u.foto('10-toque-analogico');
  // direcional em cruz
  await P.ev(`import('/src/ui/options.js').then((o) => { o.OPTIONS.toque = 'cruz'; o.applyOpts(game); return 1; })`); await sleep(500);
  console.log('cruz visível:', await P.ev(`getComputedStyle(document.getElementById('dpad')).display + ' / analógico ' + getComputedStyle(document.getElementById('stick')).display`));
  await u.foto('11-toque-cruz');
  const d = { up: await rect('#dpad [data-d=up]'), right: await rect('#dpad [data-d=right]'), down: await rect('#dpad [data-d=down]'), left: await rect('#dpad [data-d=left]') };
  const cruz = async (n, ms) => { await tq('touchStart', 2, d[n].x, d[n].y); await sleep(ms); await tq('touchEnd', 2, 0, 0); };
  await u.tp(297, 351, 'down'); await sleep(300); a = await u.est();
  await cruz('right', 60); await sleep(300); b = await u.est(); console.log('cruz: toque curto vira:', b.dir, 'andou', b.tx - a.tx, '(esperado 0)');
  await cruz('right', 700); await sleep(400); b = await u.est(); console.log('cruz: segurar 700ms:', 'blocos', b.tx - a.tx, '(esperado 3)', 'centro', u.centro(b));
  // botão de correr (esquiva do treinador)
  const run = await rect('#t-dodge'); a = b;
  await P.raw('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: run.x, y: run.y, id: 3 }, { x: d.left.x, y: d.left.y, id: 4 }] }); await sleep(600);
  await P.raw('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(400);
  b = await u.est(); console.log('correr (botão + cruz) 600ms: dx', b.tx - a.tx, '(esperado ~-5)', 'centro', u.centro(b));
  await P.ev(`import('/src/ui/options.js').then((o) => { o.OPTIONS.toque = 'analogico'; o.applyOpts(game); return 1; })`);
  // FPS: CPU 4x mais lenta, andando de verdade pelo analógico
  await u.tp(297, 351, 'down'); await sleep(300);
  await P.raw('Emulation.setCPUThrottlingRate', { rate: 4 });
  await P.ev(`window.__f = { n: 0, dts: [], t0: performance.now() }; { let a = performance.now(); (function f() { const b = performance.now(); window.__f.n++; window.__f.dts.push(b - a); a = b; requestAnimationFrame(f); })(); }`);
  const dirs = [[40, 0], [0, 40], [-40, 0], [0, -40]];
  const t0 = Date.now(); let i = 0;
  await tq('touchStart', 1, stick.x, stick.y);
  while (Date.now() - t0 < 14000) { const [dx, dy] = dirs[i++ % 4]; await tq('touchMove', 1, stick.x + dx, stick.y + dy); await sleep(900); if (i % 4 === 0) { await u.tp(297, 351); } }
  await tq('touchEnd', 1, 0, 0);
  const f = JSON.parse(await P.ev(`JSON.stringify((() => { const F = window.__f, t = (performance.now() - F.t0) / 1000, q = F.dts.slice(5).sort((a, b) => a - b); return { fps: +(F.n / t).toFixed(1), p50: +q[q.length >> 1].toFixed(1), p95: +q[Math.floor(q.length * .95)].toFixed(1), pior: +q[q.length - 1].toFixed(1), quality: game.quality.level }; })())`));
  console.log('FPS com CPU 4x mais lenta:', JSON.stringify(f));
  await P.raw('Emulation.setCPUThrottlingRate', { rate: 1 });
}
