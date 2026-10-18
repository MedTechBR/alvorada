// Captura o mapa do menu com as abas de continente (depois de ir ao Ocaso e voltar). Só para desenvolvimento.
import { launch, open, sleep, until } from '../teste-online/cdp.mjs';
import { writeFileSync } from 'node:fs';
const b = await launch(9371);
const shot = async (P, n) => { const r = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(`../shots/${n}.jpg`, import.meta.url), Buffer.from(r.result.data, 'base64')); };
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORTA ?? 8748}/index.html?teste=1`, 'm');
  await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 60000, 300);
  await P.ev(`import('/tools/jornadas-teste.js').then(() => (motor(), 1))`);
  await sleep(1000);
  await P.ev(`game.viagem.ir('ocaso', 'porto_rubro_cais').then(() => 1)`);
  await until(() => P.ev(`game.map.id === 'ocaso' && !game.viagem.ocupada`), 30000);
  for (let i = 0; i < 6; i++) { await P.ev(`(() => { const p = game.player; p.x -= 16 * 8; return 1; })()`); await sleep(300); }
  await P.ev(`game.viagem.ir('alvorada', 'cais_coral').then(() => 1)`);
  await until(() => P.ev(`game.map.id === 'alvorada' && !game.viagem.ocupada`), 30000);
  await sleep(500); motor: await P.ev(`(motor(false), 1)`);
  await P.ev(`(game.ui.openMenu(), document.querySelector('.gm-main[data-id=map]')._act(), 1)`); await sleep(800);
  await shot(P, 'menu-mapa-alvorada');
  await P.ev(`(document.querySelector('.gm-extra [data-w=ocaso]').click(), 1)`); await sleep(2500);
  await shot(P, 'menu-mapa-ocaso');
  console.log(await P.ev(`document.querySelector('.gm-arealist')?.innerText`));
  console.log(P.logs.filter((l) => /EXC|Error/.test(l)).slice(0, 5));
} finally { b.kill(); }
