// Roda uma expressão JS na página do jogo (já em jogo) e imprime o resultado. Um Chrome só.
//   PORT=8771 node tools/vestir/avaliar.mjs "<expr>" [ir=x,y]
import { launch, open, sleep, until } from '../teste-3d/chrome.mjs';
const [expr, ir = '540,866'] = process.argv.slice(2);
const b = await launch(9300 + Math.floor(Math.random() * 150));
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8771}/index.html?teste=1&ir=${ir}&${process.env.QS ?? ''}`, 'p');
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(3000);
  console.log(JSON.stringify(await P.ev(`(async () => { ${expr} })()`)));
  const errs = P.logs.filter((l) => /EXC|rror/.test(l)); if (errs.length) console.log('console:', errs.slice(0, 10).join('\n'));
} finally { b.kill(); }
