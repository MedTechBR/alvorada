// autoMove da história pela grade: sem inicial, sair da vila faz o professor chamar o jogador de volta, andando de bloco em bloco.
import { util } from './grade-util.mjs';
export default async function (ctx) {
  const { P, sleep } = ctx; const u = await util(ctx);
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open)'); i++) await sleep(500);
  const v = JSON.parse(await P.ev(`JSON.stringify(game.story.spots.get('village'))`));
  // acha um bloco livre logo além do raio da vila (a leste)
  const alvo = JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map, v = game.story.spots.get('village'); for (let r = ${Math.floor(v.r / 16)} + 1; r < ${Math.floor(v.r / 16)} + 12; r++) for (let dy = -6; dy <= 6; dy++) { const x = ${v.tx} + r, y = ${v.ty} + dy; if (!m.solidAt(x*16+8, y*16+8)) return [x, y]; } return null; })())`));
  console.log('fora da vila em', JSON.stringify(alvo));
  await P.ev(`game.flags.starter = 0; 1`);
  await u.tp(alvo[0], alvo[1], 'right');
  await P.ev(`window.__rec = []; (function f() { const p = game.player; window.__rec.push([performance.now(), p.x, p.y, game.story.busy ? 1 : 0]); if (window.__rec.length < 6000) requestAnimationFrame(f); })()`);
  await sleep(1500);
  console.log('busy?', await P.ev('game.story.busy'), 'diálogo?', await P.ev('!!game.ui.dialog.open'));
  for (let i = 0; i < 12 && await P.ev('!!game.ui.dialog.open'); i++) { await u.hold('e', 60); await sleep(500); }
  await sleep(2500);
  const e = await u.est();
  const r = JSON.parse(await P.ev('JSON.stringify(window.__rec)'));
  let diag = 0, andou = 0; for (let i = 1; i < r.length; i++) { const dx = Math.abs(r[i][1] - r[i-1][1]), dy = Math.abs(r[i][2] - r[i-1][2]); if (dx > .01 && dy > .01 && dx < 5 && dy < 5) diag++; if (r[i][3] && (dx || dy)) andou += Math.hypot(dx, dy); }
  console.log('autoMove: quadros em diagonal', diag, 'caminho andado durante a cena (px)', Math.round(andou), 'posição final', JSON.stringify([e.tx, e.ty]), 'centro', u.centro(e), 'distância ao centro da vila (blocos)', Math.round(Math.hypot(e.x - v.x, e.y - v.y) / 16));
}
