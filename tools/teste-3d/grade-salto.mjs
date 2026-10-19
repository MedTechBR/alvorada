// Salto do Mudbray sobre cerca/tora e montaria de água, pelo passo de bloco.
import { util } from './grade-util.mjs';
export default async function (ctx) {
  const { P, sleep } = ctx; const u = await util(ctx);
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open)'); i++) await sleep(500);
  // cenas e avisos que a história abre ao chegar num lugar novo: passa com Enter, como o jogador
  const passa = async () => { for (let i = 0; i < 40 && await P.ev('!!(game.ui.dialog.open || game.story.busy)'); i++) { await u.hold('enter', 60); await sleep(400); } };
  const alvo = JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map, J = ['log', 'stump', 'fence', 'fenceV', 'wfence', 'wfenceV'];
    const livre = (x, y) => !m.solidAt(x * 16 + 8, y * 16 + 8) && !m.cellObj.get(x + y * m.w);
    const kinds = {}; for (const o of m.objects) kinds[o.kind] = (kinds[o.kind] ?? 0) + 1;
    for (const o of m.objects) { if (o.dead || !(o.jump || J.includes(o.kind)) || !o.cells?.length) continue; const k = o.cells[0], tx = k % m.w, ty = Math.floor(k / m.w);
      for (const [dx, dy, d] of [[1, 0, 'right'], [0, 1, 'down']]) if (o.cells.length === 1 && livre(tx - dx, ty - dy) && livre(tx - 2 * dx, ty - 2 * dy) && livre(tx + dx, ty + dy) && livre(tx + 2 * dx, ty + 2 * dy)) return [tx, ty, o.kind, d, dx, dy]; }
    return { kinds }; })())`));
  console.log('obstáculo saltável:', JSON.stringify(alvo));
  if (Array.isArray(alvo)) {
    const [tx, ty, kind, d, dx, dy] = alvo; const K = { right: 'd', down: 's' }[d];
    await u.tp(tx - 2 * dx, ty - 2 * dy, d); await sleep(600); await passa();
    await P.ev(`(game.unlockMount('correr', { silent: true }), game.mount.call('correr'), 1)`); await sleep(3500); await passa();
    await u.foto('31-antes-salto');
    await u.hold([K], 1300); await sleep(600); await passa(); await sleep(1500);
    const e = await u.est(); console.log(`Mudbray contra ${kind}: de (${tx - 2 * dx},${ty - 2 * dy}) para (${e.tx},${e.ty}); objeto em (${tx},${ty}); passou?`, d === 'right' ? e.tx > tx : e.ty > ty, 'centro', u.centro(e));
    await P.ev('game.mount.dismount()'); await sleep(2000); await passa();
  }
  const m = JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map, p = game.player; let best = null, bd = 1e9; const px = Math.floor(p.x / 16), py = Math.floor(p.y / 16);
    const agua = (x, y) => m.solidAt(x * 16 + 8, y * 16 + 8) && !m.solidAt(x * 16 + 8, y * 16 + 8, true);
    for (let y = py - 70; y < py + 70; y++) for (let x = px - 90; x < px + 90; x++) { if (!agua(x, y) || !agua(x, y - 1) || !agua(x, y - 2) || !agua(x, y - 3)) continue; const d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = [x, y]; } } return best; })())`));
  console.log('água:', JSON.stringify(m));
  if (m) {
    await u.tp(m[0], m[1], 'up'); await sleep(800); await passa(); await sleep(3500); await passa();
    console.log('montaria na água:', await P.ev('game.mount.kind'), JSON.stringify(await u.est()));
    const e0 = await u.est(); await u.hold('w', 900); await sleep(500); await passa(); await sleep(800);
    const e1 = await u.est(); console.log('nadando 0,9s:', 'blocos', e0.ty - e1.ty, 'centro', u.centro(e1));
    await u.foto('32-agua');
  }
}
