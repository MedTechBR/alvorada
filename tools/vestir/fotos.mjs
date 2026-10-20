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
    await P.ev(`(() => { const g = game; let tx = ${x}, ty = ${y}; const trilha = new Set([3, 30, 12, 11, 20, 31]); let achou = false; busca0: for (let r = 0; r < 12; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; const X = ${x} + i, Y = ${y} + j; if (trilha.has(g.map.at(X, Y)) && !g.map.solidAt(X * 16 + 8, Y * 16 + 12)) { tx = X; ty = Y; achou = true; break busca0; } } if (!achou) busca: for (let r = 0; r < 8; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue; if (!g.map.solidAt((${x} + i) * 16 + 8, (${y} + j) * 16 + 12)) { tx = ${x} + i; ty = ${y} + j; break busca; } } g.player.x = tx * 16 + 8; g.player.y = ty * 16 + 8; g.cam.x = g.player.x; g.cam.y = g.player.y; const hh = ${isNaN(h) ? 11 : h}; g.mundo?.setHour?.(hh); if (g.mundo && 'clock' in g.mundo) g.mundo.clock = hh; return 1; })()`);
    await sleep(+(process.env.WAIT ?? 3500));
    // fala aberta (entrada de área, por exemplo): avança até fechar
    for (let i = 0; i < 10; i++) { const ab = await P.ev('!!game.ui.dialog?.open'); if (!ab) break; await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' })), 1`); await sleep(250); }
    await sleep(400);
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    const f = new URL(`${pref}-${nome}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', f.pathname);
  }
  if (process.env.INFO) console.log(JSON.stringify(await P.ev(`(() => ({ draw: v3d.ultInfo?.calls, tri: v3d.ultInfo?.tri }))()`)));
  const errs = P.logs.filter((l) => /EXC|rror/.test(l));
  console.log(errs.length ? 'console:\n' + errs.slice(0, 15).join('\n') : 'console: sem erros');
} finally { b.kill(); }
