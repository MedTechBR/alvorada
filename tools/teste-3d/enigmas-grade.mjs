// Quebra-cabeças x movimento em grade: para cada sala de enigma, calcula de quais (bloco, direção) cada peça
// recebe o prompt E/A (mesma regra de story.js#update) e se esse bloco é alcançável a pé a partir da entrada.
//   python3 tools/serve.py 8797 ; PORT=8797 node tools/teste-3d/enigmas-grade.mjs farol_coral farol_coral_2 ...
import { sessao, sleep } from './rb-lib.mjs';
const salas = process.argv.slice(2);
const s = await sessao({ qs: 'ir=' + (salas[0] ?? 'farol_coral') });
const { P } = s;
try {
  for (const sala of salas) {
    await P.ev(`game.mundo.warpTo(...(() => { const r = game.map.interiors.find((x) => x.id === ${JSON.stringify(sala)}); let mx = 2, my = 2; r.rows.forEach((row, j) => { const i = row.indexOf('m'); if (i >= 0) { mx = i; my = j - 1; } }); return [r.x + mx, r.y + my, 'up']; })()); 1`);
    await sleep(2500);
    const r = await P.ev(`JSON.stringify((() => {
      const g = game, m = g.map, p = g.player, T = 16, room = m.interiors.find((x) => x.id === ${JSON.stringify(sala)});
      const rows = room.rows, W = Math.max(...rows.map((r) => r.length)), H = rows.length;
      const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
      const livre = (tx, ty) => tx >= 0 && ty >= 0 && tx < m.w && ty < m.h && !m.solidAt(tx * T + 8, ty * T + 8, false) && !g.grade.ocupado(tx, ty);
      // alcançáveis a partir do bloco onde estamos
      const bx = Math.floor(p.x / T), by = Math.floor((p.y - 2) / T);
      const vis = new Set([bx + ',' + by]), fila = [[bx, by]];
      for (let i = 0; i < fila.length; i++) { const [a, b] = fila[i]; for (const [dx, dy] of Object.values(DIRV)) { const x = a + dx, y = b + dy, k = x + ',' + y; if (vis.has(k) || !livre(x, y)) continue; if (x < room.x - 1 || y < room.y - 1 || x > room.x + W || y > room.y + H) continue; vis.add(k); fila.push([x, y]); } }
      const its = g.story.interactions().filter((it) => /Girar|Gerador|alavanca|Alavanca|espelho|Acender|Apagar|Tocha|Braseiro|placa|Puxar|Empurrar/i.test(it.label) || true);
      const hit = new Map(); // idx -> [{tx,ty,dir}]
      const ps = { x: p.x, y: p.y, pouso: p.pouso };
      for (const k of vis) { const [tx, ty] = k.split(',').map(Number); for (const dn of Object.keys(DIRV)) {
        const px = tx * T + 8, py = ty * T + 10, f = DIRV[dn]; let best = null, bd = 1e9;
        its.forEach((it, idx) => { const ox = it.o.x - px, oy = it.o.y - py, d = Math.hypot(ox, oy); if (d > 6) { const along = ox * f[0] + oy * f[1], perp = Math.abs(ox * f[1] - oy * f[0]); if (along < 0 || perp > along * 0.55 + 7) return; } if (d < it.r && d < bd) { bd = d; best = idx; } });
        if (best != null) { if (!hit.has(best)) hit.set(best, []); hit.get(best).push(tx + ',' + ty + dn[0]); }
      } }
      return its.map((it, idx) => ({ label: it.label, x: Math.round(it.o.x), y: Math.round(it.o.y), tx: Math.floor(it.o.x / T), ty: Math.floor(it.o.y / T), r: it.r, acertos: (hit.get(idx) ?? []).length, ex: (hit.get(idx) ?? []).slice(0, 6) })).filter((o) => o.tx >= room.x && o.ty >= room.y && o.tx < room.x + W && o.ty < room.y + H).map((o) => ({ ...o, rx: o.tx - room.x, ry: o.ty - room.y }));
    })())`);
    console.log('=== ' + sala); for (const o of JSON.parse(r)) console.log(o.acertos === 0 ? 'SEM PROMPT' : 'ok        ', o.label, `(sala ${o.rx},${o.ry}) r=${o.r} acertos=${o.acertos}`, o.ex.join(' '));
  }
  console.log('erros:', s.erros());
} finally { s.kill(); }
