// Fotos dos interiores no Chrome sem interface, na tela de celular deitado (844x390, toque), e FPS dentro de uma sala.
//   python3 tools/serve.py 8750   (noutro terminal, em segundo plano)
//   node tools/teste-3d/salas.mjs <prefixo> sala[@x,y] [sala ...]       fotos em tools/shots/<prefixo>-<sala>.jpg
//   FPS=centro_coral node tools/teste-3d/salas.mjs fps                  FPS parado na sala, CPU 4x mais lenta
// A posição é relativa à sala; sem ela, o jogador fica um bloco acima do tapete da porta.
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [prefixo = 'sala', ...salas] = process.argv.slice(2);
const W = +(process.env.W ?? 844), H = +(process.env.H ?? 390);
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
const b = await launch(9500 + Math.floor(Math.random() * 300));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&visual=3d&${process.env.QS ?? ''}`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(2500);
  const vai = (id, pos) => P.ev(`(() => { const g = game, r = g.map.interiors.find((q) => q.id === ${JSON.stringify(id)}); if (!r) return 'sem sala';
    let mx = 2, my = 3; r.rows.forEach((row, j) => { const i = row.indexOf('m'); if (i >= 0) { mx = i; my = j - 1; } });
    const p = ${pos ? JSON.stringify(pos) : 'null'} ?? [mx, my];
    g.player.x = (r.x + p[0]) * 16 + 8; g.player.y = (r.y + p[1]) * 16 + 10; g.player.dir = 'up'; if (g.cam) { g.cam.x = g.player.x; g.cam.y = g.player.y; }
    return r.name; })()`);
  if (process.env.FPS) {
    console.log(await vai(process.env.FPS));
    await sleep(4000);
    await P.raw('Emulation.setCPUThrottlingRate', { rate: +(process.env.LENT ?? 4) });
    await P.ev(`(() => { window.__fps = { n: 0, t0: performance.now(), q: [] }; let a = performance.now(); const f = () => { const t = performance.now(); __fps.n++; __fps.q.push(t - a); a = t; requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
    await sleep(+(process.env.SEG ?? 10) * 1000);
    const r = await P.ev(`(() => { const F = __fps, dt = (performance.now() - F.t0) / 1000, q = F.q.slice(5).sort((a, b) => a - b);
      return { fps: +(F.n / dt).toFixed(1), p50: +q[q.length >> 1].toFixed(1), p95: +q[Math.floor(q.length * 0.95)].toFixed(1), draw: v3d.ultInfo.calls, tri: v3d.ultInfo.tri, qualidade: game.quality.level }; })()`);
    console.log(JSON.stringify({ sala: process.env.FPS, lentidao: +(process.env.LENT ?? 4), ...r }));
  }
  for (const s of salas) {
    const [id, xy] = s.split('@');
    const nome = await vai(id, xy ? xy.split(',').map(Number) : null);
    await sleep(+(process.env.WAIT ?? 3500));
    if (process.env.EVAL) await P.ev(process.env.EVAL);
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    const f = new URL(`${prefixo}-${id}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', nome, f.pathname);
  }
  const errs = P.logs.filter((l) => /EXC|rror/.test(l));
  if (errs.length) console.log('console:', errs.slice(0, 12).join('\n'));
} finally { b.kill(); }
