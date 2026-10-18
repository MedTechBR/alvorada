// Capturas do jogo no Chrome sem interface (GPU real do Mac). Só para desenvolvimento.
//   python3 tools/serve.py 8750   (noutro terminal)
//   node tools/teste-3d/foto.mjs "<parâmetros da URL>" nome x,y[,hora] [x,y ...]
// Ex.: node tools/teste-3d/foto.mjs "visual=3d" vila 297,347 300,330,22
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [qs = '', nome = 'foto', ...pts] = process.argv.slice(2);
const W = +(process.env.W ?? 1280), H = +(process.env.H ?? 720);
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
const b = await launch(9500 + Math.floor(Math.random() * 300));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&${qs}`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 60000, 300);
  await sleep(2500);
  let i = 0;
  for (const s of pts.length ? pts : ['']) {
    if (s) {
      const [x, y, h] = s.split(',').map(Number);
      await P.ev(`(() => { const g = game; g.player.x = ${x} * 16 + 8; g.player.y = ${y} * 16 + 8; g.cam.x = g.player.x; g.cam.y = g.player.y; ${h != null && !isNaN(h) ? `g.mundo.setHour?.(${h}); if (g.mundo.clock) g.mundo.clock = ${h};` : ''} return 1; })()`);
      await sleep(+(process.env.WAIT ?? 2500));
    }
    if (process.env.EVAL) await P.ev(process.env.EVAL);
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
    const f = new URL(`${nome}${pts.length > 1 ? '-' + i : ''}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', f.pathname); i++;
  }
  const errs = P.logs.filter((l) => /EXC|error|Error/.test(l));
  if (errs.length) console.log('console:', errs.slice(0, 12).join('\n'));
} finally { b.kill(); }
