// Moradores em grade, salto do Mudbray sobre cerca e montaria de água, tudo pelo passo de bloco.
import { util } from './grade-util.mjs';
export default async function (ctx) {
  const { P, sleep } = ctx; const u = await util(ctx);
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open)'); i++) await sleep(500);
  // 1) moradores
  const r1 = JSON.parse(await P.ev(`JSON.stringify((() => { const L = game.mundo.people.list.filter((n) => n.def.wander && Math.abs(n.x - game.player.x) < 600 && Math.abs(n.y - game.player.y) < 400); return L.map((n) => [n.def.id, Math.floor(n.x / 16), Math.floor((n.y - 2) / 16), n.def.wander]); })())`));
  console.log('moradores que andam por perto:', JSON.stringify(r1));
  if (r1.length) {
    const [id, bx, by] = r1[0];
    await u.tp(bx, by + 3, 'up'); await sleep(200);
    await P.ev(`window.__nr = []; window.__nid = ${JSON.stringify(id)}; (function f() { const n = game.mundo.people.list.find((q) => q.def.id === window.__nid); if (n) window.__nr.push([performance.now(), n.x, n.y, n.walk ? 1 : 0]); if (window.__nr.length < 8000) requestAnimationFrame(f); })()`);
    await sleep(25000);
    const r = JSON.parse(await P.ev('JSON.stringify(window.__nr)'));
    let diag = 0, passos = 0, desalinhado = 0, anda = false;
    for (let i = 1; i < r.length; i++) {
      const dx = Math.abs(r[i][1] - r[i-1][1]), dy = Math.abs(r[i][2] - r[i-1][2]);
      if (dx > .001 && dy > .001 && dx < 4 && dy < 4) diag++;
      if (r[i][3] && !r[i-1][3]) passos++;
      if (!r[i][3] && (Math.abs((r[i][1] % 16) - 8) > 0.01 || Math.abs((r[i][2] % 16) - 10) > 0.01)) desalinhado++;
    }
    console.log(`morador ${id}: ${r.length} quadros, ${passos} passos, diagonais ${diag}, parado fora do centro ${desalinhado} (esperado 0 e 0)`);
    await u.foto('30-morador');
  }
  // 2) salto do Mudbray sobre cerca/tora: acha um obstáculo saltável com bloco livre dos dois lados
  const alvo = JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map; for (const o of m.objects) { if (o.dead || !['fence', 'wfence', 'log'].includes(o.kind)) continue; const tx = Math.floor(o.x / 16), ty = Math.floor((o.y - 2) / 16); const livre = (x, y) => !m.solidAt(x * 16 + 8, y * 16 + 8) && !m.cellObj.get(x + y * m.w); if (m.cellObj.get(tx + ty * m.w) === o && livre(tx - 2, ty) && livre(tx - 1, ty) && livre(tx + 1, ty) && livre(tx + 2, ty)) return [tx, ty, o.kind]; } return null; })())`));
  console.log('obstáculo saltável:', JSON.stringify(alvo));
  if (alvo) {
    await u.tp(alvo[0] - 2, alvo[1], 'right'); await sleep(400);
    await P.ev(`(game.unlockMount('correr', { silent: true }), game.mount.call('correr'), 1)`); await sleep(3500);
    await u.foto('31-antes-salto');
    await u.hold(['d'], 1200); await sleep(1200);
    const e = await u.est(); console.log('Mudbray contra a cerca: bloco inicial', alvo[0] - 2, '-> final', e.tx, '(cerca em', alvo[0] + ')', 'centro', u.centro(e));
    await P.ev('game.mount.dismount()'); await sleep(1200);
  }
  // 3) montaria de água: acha uma margem
  const margem = JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map, p = game.player; let best = null, bd = 1e9; const px = Math.floor(p.x / 16), py = Math.floor(p.y / 16);
    const agua = (x, y) => m.solidAt(x * 16 + 8, y * 16 + 8) && !m.solidAt(x * 16 + 8, y * 16 + 8, true);
    const terra = (x, y) => !m.solidAt(x * 16 + 8, y * 16 + 8) && !m.cellObj.get(x + y * m.w);
    for (let y = py - 70; y < py + 70; y++) for (let x = px - 90; x < px + 90; x++) { if (!agua(x, y) || !terra(x, y + 1) || !agua(x, y - 1)) continue; const d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = [x, y + 1, x, y]; } } return best; })())`));
  console.log('margem (terra, água):', JSON.stringify(margem));
  if (margem) {
    await u.tp(margem[0], margem[1], 'up'); await sleep(400);
    await P.ev(`game.flags.mounts = { ...(game.flags.mounts ?? {}), nadar: true }; 1`);
    await u.hold('x', 90); await sleep(3500);
    console.log('montaria:', await P.ev('game.mount.kind'), JSON.stringify(await u.est()));
    await u.foto('32-agua');
    const e0 = await u.est();
    await u.hold('w', 900); await sleep(500);
    const e1 = await u.est(); console.log('nadando 0,9s:', 'blocos', e0.ty - e1.ty, 'centro', u.centro(e1));
  }
}
