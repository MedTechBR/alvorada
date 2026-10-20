// Captura a cena de evolução em vários instantes: tools/shots/pol/<prefixo>-<WxH>-14x-evolucao-*.jpg
//   PORT=8830 node tools/teste-3d/polimento-evolucao.mjs depois 844x390
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const pre = process.argv[2] ?? 'depois', [W, H] = (process.argv[3] ?? '844x390').split('x').map(Number), cel = W < 900;
const out = new URL('../shots/pol/', import.meta.url); mkdirSync(out, { recursive: true });
const b = await launch();
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8830}/index.html?teste=1`, 'evo');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: cel ? 2 : 1, mobile: cel });
  if (cel) await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 120000, 300); await sleep(2500);
  P.ev('game.evolve(game.party[0], 5)').catch((e) => console.log('evo', e.message));
  await until(() => P.ev('document.querySelector(".evo") ? 1 : 0'), 15000, 40);
  const t0 = Date.now(); const alvo = [['a-texto', 600], ['b-pisca', 2300], ['c-pisca-rapido', 3500], ['d-clarao', 4300], ['e-fim', 5600]];
  for (const [n, ms] of alvo) { await sleep(Math.max(0, ms - (Date.now() - t0))); const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 86 }); writeFileSync(new URL(`${pre}-${W}x${H}-14${n[0]}-evolucao-${n.slice(2)}.jpg`, out), Buffer.from(s.result.data, 'base64')); }
  console.log('erros', JSON.stringify([...new Set(P.logs.filter((l) => /EXC|rror/.test(l)))]));
} finally { b.kill(); }
