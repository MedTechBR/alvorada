// Capturas do vestir no celular deitado (844x390, toque, câmera do celular). Um Chrome só, sem som.
//   PORT=8771 node tools/vestir/fotos.mjs <prefixo> nome=x,y[,hora] [nome=x,y ...]   (QS="vestir=0" para o antes)
// Salva em tools/shots/<prefixo>-<nome>.jpg
import { launch, open, sleep, until } from '../teste-3d/chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [pref = 'v', ...pts] = process.argv.slice(2);
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
const b = await launch(9300 + Math.floor(Math.random() * 150));
console.log('chrome pid', b.proc.pid);
try {
  const [n0, p0] = pts[0].split('=');
  const [x0, y0] = p0.split(',');
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8771}/index.html?teste=1&ir=${x0},${y0}&${process.env.QS ?? ''}`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(4000);
  for (const s of pts) {
    const [nome, pos] = s.split('=');
    const [x, y, h] = pos.split(',').map(Number);
    await P.ev(`(() => { const g = game; g.player.x = ${x} * 16 + 8; g.player.y = ${y} * 16 + 8; g.cam.x = g.player.x; g.cam.y = g.player.y; const hh = ${isNaN(h) ? 11 : h}; g.mundo?.setHour?.(hh); if (g.mundo && 'clock' in g.mundo) g.mundo.clock = hh; return 1; })()`);
    await sleep(+(process.env.WAIT ?? 3500));
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    const f = new URL(`${pref}-${nome}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', f.pathname);
  }
  if (process.env.INFO) console.log(JSON.stringify(await P.ev(`(() => ({ draw: v3d.ultInfo?.calls, tri: v3d.ultInfo?.tri }))()`)));
  const errs = P.logs.filter((l) => /EXC|rror/.test(l));
  console.log(errs.length ? 'console:\n' + errs.slice(0, 15).join('\n') : 'console: sem erros');
} finally { b.kill(); }
