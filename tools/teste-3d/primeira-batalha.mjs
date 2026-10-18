// Jogo novo no celular simulado até a primeira batalha da história (rival no laboratório) terminar.
//   PORT=8770 node tools/teste-3d/primeira-batalha.mjs
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const PORT = process.env.PORT ?? 8770, sh = (P, n) => P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 }).then((s) => writeFileSync(new URL(`../shots/pb-${n}.jpg`, import.meta.url), Buffer.from(s.result.data, 'base64')));
const b = await launch();
try {
  const P = await open(b, 'about:blank', 'pb');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 2, mobile: true });
  await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await P.raw('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await until(() => P.ev('!!document.querySelector("#title [data-a=create]")'), 90000, 400);
  const s = randomBytes(9).toString('base64url');
  await P.ev(`document.querySelector('#title [data-a=create]').click(), 1`); await sleep(500);
  await P.ev(`(() => { const q = (x) => document.querySelector('#title ' + x); q('.nm').value = 'Prim'; q('.p1').value = ${JSON.stringify(s)}; q('.p2').value = ${JSON.stringify(s)}; q('.tt-go').click(); return 1; })()`);
  await until(() => P.ev('!!document.querySelector("#title .cc")'), 15000, 300);
  await P.ev(`document.querySelector('#title .tt-go').click(), 1`);
  await until(() => P.ev('!!(window.game && game.ui?.state === "play")'), 60000, 400);
  await P.ev(`import('/tools/jornadas-teste.js').then(() => (motor(), lutar(true), 1))`);
  await until(() => P.ev('!game.story.busy'), 60000, 500);
  const lab = await P.ev(`(() => { const s = Object.keys(game.map.spots).find((k) => k.startsWith('dentro_lab')); const p = game.map.spots[s]; game.player.x = p.x; game.player.y = p.y; game.cam.x = p.x; game.cam.y = p.y; return s; })()`);
  await sleep(3000);
  console.log('lab', lab, 'prof:', await P.ev(`falar('prof')`).catch((e) => e.message));
  await until(() => P.ev('!game.story.busy'), 60000, 500);
  const t0 = Date.now();
  P.ev(`game.story.cut(() => game.story.pickStarter(4)).then(() => 'fim')`).catch(() => {});
  const comecou = await until(() => P.ev('!!(game.story.battle && !game.story.battle.done)'), 90000, 500);
  console.log('batalha começou:', !!comecou, 'equipe', await P.ev('game.party.map((m) => m.name).join(",")'));
  await sleep(2500); await sh(P, 'batalha');
  const fim = await until(() => P.ev('!!game.flags.rival1'), 240000, 1000);
  console.log('rival1 =', await P.ev('game.flags.rival1 ?? "—"'), `em ${Math.round((Date.now() - t0) / 1000)} s`);
  await sleep(4000); await sh(P, 'depois');
  console.log('console:', [...new Set(P.logs.filter((l) => /EXC|rror/.test(l)))].slice(0, 8).join('\n') || 'sem erros');
} finally { b.kill(); }
