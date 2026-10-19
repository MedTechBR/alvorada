// Peças de masmorra (tocha, braseiro, alavanca, sino, baú, altar...): de cada uma, de quais blocos vizinhos o jogador, de frente,
// recebe o prompt dela (mesma regra de story.js). PORT=8797 node tools/teste-3d/enigmas-masmorra.mjs <?ir=...> [tipos]
import { sessao, sleep } from './rb-lib.mjs';
const ir = process.argv[2] ?? 'ir=praca_coral';
const s = await sessao({ qs: ir });
try {
  const { P } = s;
  for (let i = 0; i < 120 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping || game.viagem?.ocupada)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await P.ev(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'Enter'})), 1`); await sleep(400); }
  await sleep(2000);
  console.log('mapa', await P.ev('game.map.id'));
  const r = await P.ev(`(async () => JSON.stringify(await (async () => {
    const g = game, T = 16, p = g.player, M = g.mundo.masmorra, res = [], DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
    const livre = (tx, ty) => !g.map.solidAt(tx * T + 8, ty * T + 8, false) && !g.grade.ocupado(tx, ty);
    const alvo = [...M.objs.values()].filter((o) => !o.dead && o.sprite && /torch|brazier|lever|bell|chest|altar|locked|tocha|braseiro/.test(o.kind) || (!o.dead && (o.pede || o.abre || o.alterna)));
    for (const o of alvo) {
      const ox = o.tx, oy = o.ty, lados = [];
      p.x = ox * T + 8; p.y = oy * T + 26; g.cam.x = p.x; g.cam.y = p.y; await new Promise((r) => setTimeout(r, 350)); // deixa o mapa criar o sprite da peça
      for (const [dn, [dx, dy]] of Object.entries(DIRV)) {
        const tx = ox - dx, ty = oy - dy; // bloco de onde se olha para o objeto (olhando em dn)
        if (!livre(tx, ty)) continue;
        p.x = tx * T + 8; p.y = ty * T + 10; p.dir = dn;
        let best = null, bd = 1e9; const f = DIRV[dn];
        for (const it of g.story.interactions()) { const a = it.o.x - p.x, b = it.o.y - p.y, d = Math.hypot(a, b); if (d > 6) { const al = a * f[0] + b * f[1], pe = Math.abs(a * f[1] - b * f[0]); if (al < 0 || pe > al * 0.55 + 7) continue; } if (d < it.r && d < bd) { bd = d; best = it; } }
        lados.push(dn + ':' + (best ? best.label : '-'));
      }
      res.push({ id: o.id, kind: o.kind, t: [ox, oy], lados });
    }
    return res;
  })()))()`);
  for (const o of JSON.parse(r)) console.log(o.lados.some((l) => !l.endsWith(':-')) ? 'ok  ' : 'FALHA', o.kind, o.t.join(','), o.lados.join(' '));
  console.log('erros:', s.erros());
} finally { s.kill(); }
