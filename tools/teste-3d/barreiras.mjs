// Barreiras da progressão no 3D: capturas no celular (844x390) de cada tipo de barreira e uma depois de liberar.
//   python3 tools/serve.py 8761  (noutro terminal)
//   PORT=8761 node tools/teste-3d/barreiras.mjs [nome ...]
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const W = 844, H = 390;
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
// nome: [x, y, flags antes (js), hora]
const CENAS = {
  'barreira-rota3': [326, 350],
  'barreira-rota2-guarda': [120, 280],
  'barreira-mar': [1000, 474],
  'barreira-rota7': [334, 157],
  'barreira-tempestade': [230, 98],
  'barreira-tempestade-lado': [171, 72],
  'barreira-neblina': [500, 473],
  'barreira-lamparina': [353, 206],
  'barreira-zenite': [306, 16],
  'barreira-sertao': [594, 203],
  'barreira-mar-liberada': [1000, 474, `game.flags.badges = [...new Set([...(game.flags.badges ?? []), 'escarpa'])];`],
  'barreira-rota3-liberada': [326, 350, `game.flags.badges = [...new Set([...(game.flags.badges ?? []), 'campina', 'sussurro'])];`],
};
const so = process.argv.slice(2);
const b = await launch();
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8761}/index.html?teste=1&visual=3d`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await P.raw('Page.reload', { ignoreCache: false }); await sleep(1500);
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 60000, 300);
  await sleep(2500);
  // fecha a fala de abertura (se houver)
  await P.ev(`(() => { const e = game.ui?.dialog?.el; if (e) e.style.visibility = "hidden"; return 1; })()`); // a fala de abertura da Mãe tapa metade da tela
  for (const [nome, [x, y, pre]] of Object.entries(CENAS)) {
    if (so.length && !so.includes(nome)) continue;
    await P.ev(`(() => { ${pre ?? ''} const g = game; g.barreiras?.sync(); g.player.x = ${x} * 16 + 8; g.player.y = ${y} * 16 + 8; g.cam.x = g.player.x; g.cam.y = g.player.y; g.mundo.setHour?.(11); return 1; })()`);
    await sleep(+(process.env.WAIT ?? 4500));
    const info = await P.ev(`(() => { const B = game.barreiras; const gs = [...(B?.guardas?.values() ?? [])].map((n) => n.def.id + '@' + Math.floor(n.x / 16) + ',' + Math.floor(n.y / 16) + (n.view.visible ? '' : '(oculto)')); let n = 0; for (const l of B?.porSetor?.values() ?? []) n += l.length; return JSON.stringify({ guardas: gs.length, perto: gs.filter((s) => { const [a, c] = s.split('@')[1].split(','); return Math.abs(a - ${x}) < 20 && Math.abs(parseInt(c) - ${y}) < 20; }), props: n, zonas: window.v3d?.zonas?.caixas?.size, chuva: window.v3d?.zonas?.chuva?.visible }); })()`);
    const shot = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    const f = new URL(`${nome}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', nome, info, f.pathname);
  }
  // conversa: de frente para o guarda da Rota 2, o botão A acha ele e a fala é a da barreira
  const fala = await P.ev(`(() => { const g = game; g.barreiras.sync(); g.player.x = 120 * 16 + 8; g.player.y = 278 * 16 + 10; g.player.dir = 'up'; g.cam.x = g.player.x; g.cam.y = g.player.y; g.mundo.people.update(0.016, true); const w = g.mundo.people.nearest(g.player.x, g.player.y, 'up'); return JSON.stringify(w ? { id: w.o.def.id, nome: w.o.def.name, fala: w.o.def.lines[0] } : null); })()`);
  console.log('conversa com o guarda:', fala);
  const errs = P.logs.filter((l) => /EXC|error|Error/.test(l));
  console.log(errs.length ? 'console:\n' + errs.slice(0, 15).join('\n') : 'console: sem erros');
} finally { b.kill(); }
