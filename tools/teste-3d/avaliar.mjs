// Roda uma expressão JS no jogo (Chrome sem interface) e imprime o resultado. Só desenvolvimento.
//   node tools/teste-3d/avaliar.mjs "<parâmetros da URL>" "<expressão>"
import { launch, open, sleep, until } from './chrome.mjs';
const [qs = '', expr = '1'] = process.argv.slice(2);
const b = await launch(9700 + Math.floor(Math.random() * 90));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&${qs}`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: +(process.env.W ?? 844), height: +(process.env.H ?? 390), deviceScaleFactor: 1, mobile: false });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(+(process.env.WAIT ?? 1500));
  console.log(JSON.stringify(await P.ev(expr), null, process.env.BONITO ? 1 : 0));
  const errs = P.logs.filter((l) => /EXC|rror/.test(l)); if (errs.length) console.log('console:', errs.slice(0, 10).join('\n'));
} finally { b.kill(); }
