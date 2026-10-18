// Perfil de CPU (funções que mais gastam) andando no 3D, com a CPU 4x mais lenta. Só desenvolvimento.
import { launch, open, sleep, until } from './chrome.mjs';
const [qs = 'visual=3d', seg = '8'] = process.argv.slice(2);
const b = await launch();
try {
  const P = await open(b, `http://127.0.0.1:8750/index.html?teste=1&${qs}`, 'p');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 2, mobile: true });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(3000);
  await P.ev(`game.quality.setMode('alta'), 1`);
  await P.raw('Emulation.setCPUThrottlingRate', { rate: 4 });
  await P.ev(`(() => { const p = game.player, x0 = p.x, y0 = p.y; let t = 0; setInterval(() => { t += 1 / 60; p.x = x0 + Math.sin(t * 0.25) * 260; p.y = y0 - 120 + Math.cos(t * 0.18) * 300; }, 16); return 1; })()`);
  await P.raw('Profiler.enable'); await P.raw('Profiler.setSamplingInterval', { interval: 200 }); await P.raw('Profiler.start');
  await sleep(+seg * 1000);
  const r = await P.raw('Profiler.stop');
  const prof = r.result.profile, self = new Map(), byId = new Map(prof.nodes.map((n) => [n.id, n]));
  const dt = prof.timeDeltas, total = dt.reduce((a, b) => a + b, 0);
  prof.samples.forEach((id, i) => { const n = byId.get(id), cf = n.callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').slice(-2).join('/')}:${cf.lineNumber}`; self.set(k, (self.get(k) ?? 0) + (dt[i] ?? 0)); });
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  for (const [k, v] of top) console.log((v / total * 100).toFixed(1).padStart(5) + '%', k);
} finally { b.kill(); }
