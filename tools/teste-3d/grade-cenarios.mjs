import { util } from './grade-util.mjs';
export default async function (ctx) {
  const { P, sleep } = ctx; const { hold, foto, est, centro, tp, key } = await util(ctx);
  // gravador por quadro
  await P.ev(`window.__rec = []; (function f() { const p = game.player; if (p) window.__rec.push([performance.now(), p.x, p.y, p.dir, p.animIdx, p.andando ? 1 : 0, Math.round(p.speed)]); if (window.__rec.length < 40000) requestAnimationFrame(f); })()`);
  const rec = () => P.ev('JSON.stringify(window.__rec.splice(0))').then(JSON.parse);
  const vmax = (r) => { let v = 0; for (let i = 0, j = 1; j < r.length; j++) { while (r[j][0] - r[i][0] > 120) i++; const dt = (r[j][0] - r[i][0]) / 1000; if (dt > 0.08 && Math.hypot(r[j][1] - r[j-1][1], r[j][2] - r[j-1][2]) < 12) v = Math.max(v, Math.hypot(r[j][1] - r[i][1], r[j][2] - r[i][2]) / dt); } return Math.round(v); };
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.viagem?.ocupada)'); i++) await sleep(500);
  const T0 = await est(); console.log('inicio', JSON.stringify(T0), 'centro', centro(T0));
  await foto('00-inicio');

  // 1) toque curto só vira; toque de frente dá um passo
  await tp(297, 347, 'down'); await sleep(200);
  await rec();
  await hold('s', 5); await hold('a', 60); await sleep(300);
  let e1 = await est(); console.log('toque curto (virar):', e1.dir, 'andou', e1.tx - 297, 'esperado 0');
  await hold('a', 60); await sleep(400);
  let e2 = await est(); console.log('toque de frente:', 'andou', e2.tx - 297, 'blocos, centro', centro(e2), 'esperado -1');
  // 2) segurar 700 ms (andar ~4 blocos/s): termina o passo em curso
  await hold('a', 700); await sleep(400);
  let e3 = await est(); console.log('segurar 700ms:', 'blocos', e2.tx - e3.tx, 'centro', centro(e3), '(esperado 3: 2,8 passos arredondados pelo fim do passo)');
  let r = await rec(); console.log('vel andando px/s (esperado 64):', vmax(r));
  // 3) correr
  await hold(['shift', 'd'], 750); await sleep(400);
  let e4 = await est(); console.log('correr 750ms:', 'blocos', e4.tx - e3.tx, 'centro', centro(e4), '(esperado 6)');
  r = await rec(); console.log('vel correndo px/s (esperado 128):', vmax(r));
  let diag = 0; for (let i = 1; i < r.length; i++) if (Math.abs(r[i][1] - r[i-1][1]) > .01 && Math.abs(r[i][2] - r[i-1][2]) > .01) diag++;
  console.log('quadros com movimento diagonal:', diag, 'de', r.length);
  // 4) duas direções: a última vale
  await tp(297, 347); await sleep(200);
  await P.ev(`__k('KeyD', true)`); await sleep(40); await P.ev(`__k('KeyW', true)`); await sleep(260); let m1 = await est(); await sleep(300); await P.ev(`__k('KeyD', false)`); await sleep(100); await P.ev(`__k('KeyW', false)`); await sleep(400);
  let e5 = await est(); console.log('d e depois w:', 'dx', e5.tx - 297, 'dy', e5.ty - 347, 'dir', e5.dir, 'centro', centro(e5), '(vale o w: dy<0)');
  // 5) parede: anda no lugar
  await tp(297, 346, 'up'); await sleep(200);
  await P.ev(`window.__sfx = 0; const f0 = game.audio.sfx.bind(game.audio); game.audio.sfx = (n, ...a) => { if (n === 'bump') window.__sfx++; return f0(n, ...a); }`);
  await hold('a', 10); await sleep(100); // vira para o lado: (296,346) livre? só vira
  await tp(296, 346, 'up'); await sleep(150); await key('w', true); await sleep(200);
  const bump = await est(); await sleep(500); const bump2 = await est(); await key('w', false);
  const rb = await rec();
  console.log('parede:', JSON.stringify([bump.tx, bump.ty, bump.an, bump.idx]), 'depois', JSON.stringify([bump2.tx, bump2.ty, bump2.idx]), 'bumps', await P.ev('__sfx'));
  await foto('02-parede');
  // 5b) falar com a mãe, de frente (ela está em 299,347); de lado/diagonal não
  await tp(298, 346, 'right'); await sleep(200); await hold('e', 80); await sleep(400);
  const diagTalk = await P.ev('!!game.ui.dialog.open'); console.log('diagonal (298,346) -> mãe (299,347): abre diálogo?', diagTalk, '(esperado false)');
  await tp(298, 347, 'right'); await sleep(200); await hold('e', 80); await sleep(600);
  const frontTalk = await P.ev('!!game.ui.dialog.open'); console.log('de frente (298,347) -> mãe: abre diálogo?', frontTalk, '(esperado true)');
  await foto('03-conversa');
  if (frontTalk) { for (let i = 0; i < 12 && await P.ev('!!game.ui.dialog.open'); i++) { await hold('e', 60); await sleep(500); } }
  await tp(298, 347, 'up'); await sleep(200); await hold('e', 80); await sleep(400);
  console.log('de costas para a mãe (olhando para cima): abre diálogo?', await P.ev('!!game.ui.dialog.open'), '(esperado false)');
  // 5c) entrar em casa e sair
  await tp(297, 347, 'down'); await sleep(300);
  await hold('w', 900); await sleep(2200);
  const dentro = await est(); console.log('entrou em casa?', dentro.interior, JSON.stringify([dentro.x, dentro.y]), 'centro', centro(dentro));
  await foto('04-dentro');
  await hold('s', 1400); await sleep(2200);
  const fora = await est(); console.log('saiu?', fora.interior, JSON.stringify([fora.tx, fora.ty]), 'centro', centro(fora));
  // 6) fica no centro mesmo com o tempo de quadro irregular
  await P.ev(`window.__t0 = 0`);
  await tp(297, 347); await sleep(200);
  for (let k = 0; k < 8; k++) { await hold(['d'], 60 + k * 40); await sleep(30); await hold(['a'], 60 + k * 37); await sleep(30); }
  await sleep(500);
  const e6 = await est(); console.log('após toques irregulares: centro', centro(e6), JSON.stringify([e6.x, e6.y]));
}
