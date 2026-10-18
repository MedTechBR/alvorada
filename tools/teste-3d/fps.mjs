// Mede FPS no Chrome sem interface: CPU N vezes mais lenta, tela 740x360 (celular deitado), andando pelo mapa.
//   node tools/teste-3d/fps.mjs "visual=3d" [lentidao=4] [segundos=12] [celular=1]
import { launch, open, sleep, until } from './chrome.mjs';
const [qs = 'visual=3d', lent = '4', seg = '12', cel = '1'] = process.argv.slice(2);
const b = await launch(9800 + Math.floor(Math.random() * 150));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&${qs}`, 'p');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  const mobile = cel === '1';
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: mobile ? 2 : 1, mobile });
  if (mobile) await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(3000);
  await P.raw('Emulation.setCPUThrottlingRate', { rate: +lent });
  // anda em volta da vila e pela Rota 1 (posição mexida direto; a câmera e o mundo seguem)
  await P.ev(`(() => { const g = game, p = g.player, x0 = p.x, y0 = p.y; let t = 0;
    if (!${process.env.PARADO ? 1 : 0}) window.__anda = setInterval(() => { t += 1 / 60; p.x = x0 + Math.sin(t * 0.25) * 260; p.y = y0 - 120 + Math.cos(t * 0.18) * 300; p.vx = Math.cos(t * 0.25) * 65; p.vy = -Math.sin(t * 0.18) * 54; }, 16);
    window.__fps = { n: 0, t0: performance.now(), piores: [] }; let ant = performance.now();
    const f = () => { const a = performance.now(); window.__fps.n++; window.__fps.piores.push(a - ant); ant = a; requestAnimationFrame(f); }; requestAnimationFrame(f); return 1; })()`);
  await P.ev('window.v3d && v3d.medir(), 1');
  await sleep(+seg * 1000);
  const r = await P.ev(`(() => { const F = window.__fps, dt = (performance.now() - F.t0) / 1000, q = F.piores.slice(5).sort((a, b) => a - b);
    return { fps: +(F.n / dt).toFixed(1), p50: +q[Math.floor(q.length * 0.5)].toFixed(1), p95: +q[Math.floor(q.length * 0.95)].toFixed(1), pior: +q[q.length - 1].toFixed(1), qualidade: game.quality.level, dpr: devicePixelRatio,
      hidden: document.hidden, ms3d: window.v3d ? v3d.medir() : null, sobre: window.v3d ? (() => { const f = v3d.sobre.pf; return f ? { rt: +(f.rt / f.n).toFixed(2), tela: +(f.tela / f.n).toFixed(2) } : null; })() : null, draw: window.v3d ? v3d.ultInfo.calls : null, tri: window.v3d ? v3d.ultInfo.tri : null, prog: window.v3d ? v3d.renderer.info.programs.length : null }; })()`);
  console.log(JSON.stringify({ qs, lentidao: +lent, celular: mobile, ...r }));
  const errs = P.logs.filter((l) => /EXC|rror/.test(l)); if (errs.length) console.log('console:', errs.slice(0, 8).join('\n'));
} finally { b.kill(); }
