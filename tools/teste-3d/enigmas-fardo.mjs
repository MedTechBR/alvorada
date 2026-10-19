// Fardo empurrável (ginásio do Tomé, milharal): encosta de frente com a tecla da grade e segura. PORT=8797 node tools/teste-3d/enigmas-fardo.mjs
import { sessao, sleep } from './rb-lib.mjs';
import { util } from './grade-util.mjs';
const s = await sessao({ qs: 'ir=court' });
try {
  const { P } = s; const u = await util({ P, sleep, out: new URL('../shots/enigmas/', import.meta.url) });
  for (let i = 0; i < 120 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await u.hold('enter', 60); await sleep(400); }
  const o = JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map; const l = m.objects.filter((o) => !o.dead && KINDS_PUSH(o)); return l.slice(0, 40).map((o) => [o.kind, o.tx, o.ty]); function KINDS_PUSH(o) { return /fardo|bale|hay/.test(o.kind); } })())`));
  console.log('fardos:', JSON.stringify(o).slice(0, 300));
  if (!o.length) { console.log('nenhum fardo encontrado'); process.exit(0); }
  // acha um fardo com bloco livre ao sul e livre ao norte dele: empurra para o norte
  const r = await P.ev(`JSON.stringify((() => { const g = game, m = g.map, T = 16; for (const o of m.objects) { if (o.dead || !/fardo|bale|hay/.test(o.kind)) continue; const li = (x, y) => !m.solidAt(x * T + 8, y * T + 8, false); if (li(o.tx, o.ty + 1) && li(o.tx, o.ty - 1)) return [o.tx, o.ty, o.kind]; } return null; })())`);
  const f = JSON.parse(r); console.log('fardo escolhido', r); if (!f) process.exit(0);
  await u.tp(f[0], f[1] + 1, 'up'); await sleep(1500);
  const pos = () => P.ev(`JSON.stringify(game.map.objects.filter((o) => !o.dead && /fardo|bale|hay/.test(o.kind) && o.tx === ${f[0]}).map((o) => [o.tx, o.ty]))`);
  console.log('antes', await pos()); await u.foto('fardo-0');
  await u.hold('w', 900); await sleep(600);
  console.log('depois', await pos()); await u.foto('fardo-1');
  console.log('erros:', s.erros());
} finally { s.kill(); }
