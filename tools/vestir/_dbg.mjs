import { launch, open, sleep, until } from '../teste-3d/chrome.mjs';
const b = await launch(9300 + Math.floor(Math.random() * 150));
try {
  const P = await open(b, `http://127.0.0.1:8771/index.html?teste=1&visual=3d&ir=${process.env.IR}&${process.env.QS ?? ""}`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 1, mobile: true });
  await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const t0 = Date.now();
  for (let i = 0; i < 14; i++) { let st; try { st = await Promise.race([P.ev('window.game?.ui?.state ?? "-"'), sleep(20000).then(() => 'timeout-ev')]); } catch (e) { st = 'ERR ' + e.message; } console.log(((Date.now() - t0) / 1000).toFixed(1), st, P.logs.length ? P.logs[P.logs.length-1].slice(0,200) : ""); if (st === 'play') break; await sleep(1500); }
  console.log(P.logs.slice(-15).join('\n'));
} finally { b.kill(); }
