// Auditoria: nenhum NPC ou treinador fecha uma passagem (regra dos jogos originais: o treinador fica ao lado do caminho,
// nunca no único caminho). Abre o jogo de verdade (Chrome sem interface) e, para CADA pessoa parada no mapa (elenco do
// roteiro, treinadores e moradores, todos tratados como sólidos), testa o bloco dela: os blocos livres vizinhos tinham
// caminho entre si (num raio de 40 blocos) sem ela, e com todos os NPCs em pé deixam de ter? Então ela fecha uma passagem.
// Cobre todo ginásio, interior e rota do mapa. Também confere, em cada sala com líder, o caminho da entrada até ele.
//   python3 tools/serve.py 8793   e   PORTA=8793 node tools/auditar-passagens-npc.mjs
import { launch, open, until } from './teste-3d/chrome.mjs';
const PORTA = process.env.PORTA ?? 8793;
const b = await launch(+(process.env.CDP ?? 9482));
let falhas = 0;
try {
  const p = await open(b, `http://127.0.0.1:${PORTA}/?teste&nosw`, 'passagens');
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await p.raw('Page.reload', {});
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`);
  await p.ev(`(async () => { const G = window.game; Object.assign(G.flags, { balls: true }); G.story.roteiro.tickT = 0; await espera(1); })()`);
  const r = await p.ev(`(() => {
    const G = window.game, M = G.map, T = 16, R = 40;
    const lista = [...(G.story.roteiro.atores.values()), ...(G.story.npcs?.values() ?? []), ...(G.mundo?.people?.list ?? [])].filter((n) => n.visible !== false && n.x != null);
    const tile = (n) => [Math.floor(n.x / T), Math.floor((n.y - 2) / T)];
    const ocup = new Set(lista.map((n) => tile(n).join(',')));
    const livre = (x, y) => x >= 0 && y >= 0 && x < M.w && y < M.h && !M.solidAt(x * T + 8, y * T + 8) && !M.warpAt?.get(x + y * M.w)?.trap;
    const alcanca = (x0, y0, alvos, bloq, ate) => {
      const vis = new Set([x0 + ',' + y0]), fila = [[x0, y0]]; const faltam = new Set(alvos.map((a) => a.join(',')));
      faltam.delete(x0 + ',' + y0);
      for (let i = 0; i < fila.length && faltam.size; i++) {
        const [a, c] = fila[i];
        for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
          const na = a + dx, nc = c + dy, k = na + ',' + nc;
          if (vis.has(k) || Math.abs(na - ate[0]) > R || Math.abs(nc - ate[1]) > R || !livre(na, nc) || bloq.has(k)) continue;
          vis.add(k); fila.push([na, nc]); faltam.delete(k);
        }
      }
      return faltam.size === 0;
    };
    const salaDe = (n) => M.interiorAt(n.x, n.y)?.id ?? 'mundo';
    const out = [];
    for (const n of lista) {
      const [tx, ty] = tile(n), k0 = tx + ',' + ty;
      const viz = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => [tx + dx, ty + dy]).filter(([x, y]) => livre(x, y) && !ocup.has(x + ',' + y));
      if (viz.length < 2) continue;
      if (alcanca(viz[0][0], viz[0][1], viz.slice(1), ocup, [tx, ty])) continue; // com todos em pé ainda há caminho entre os lados dele
      const sem = new Set(ocup); sem.delete(k0);
      if (!alcanca(viz[0][0], viz[0][1], viz.slice(1), sem, [tx, ty])) continue; // nem sem ele há caminho (outro bloqueio, não é ele)
      out.push({ id: n.e?.id ?? n.id ?? n.def?.id ?? n.name, sala: salaDe(n), tx, ty, viz: viz.length });
    }
    // sala com líder: caminho da entrada até o líder com todos em pé
    const lideres = [];
    for (const r of M.interiors) {
      const L = Object.entries(r.spots ?? {}).find(([k]) => k.startsWith('lider_')); if (!L) continue;
      const ent = M.spots['dentro_' + r.id]; if (!ent) continue;
      const alvo = [Math.floor(r.x + L[1][0]), Math.floor(r.y + L[1][1]) + 1];
      const bloq = new Set([...ocup].filter((k) => k !== alvo.join(',')));
      const ok = alcanca(ent.tx, ent.ty, [alvo], bloq, [ent.tx, ent.ty]);
      if (!ok) lideres.push({ sala: r.id, entrada: [ent.tx, ent.ty], lider: alvo });
    }
    return { total: lista.length, fecham: out, lideres };
  })()`);
  console.log(`NPCs parados avaliados: ${r.total}`);
  for (const o of r.fecham) { falhas++; console.log(`  FECHA PASSAGEM: ${o.id} em ${o.sala} (${o.tx},${o.ty})`); }
  for (const o of r.lideres) { falhas++; console.log(`  SEM CAMINHO ATÉ O LÍDER: ${o.sala} entrada ${o.entrada} -> líder ${o.lider}`); }
  await p.close();
} finally { b.kill(); }
console.log(falhas ? `FALHOU: ${falhas} bloqueio(s)` : 'OK: nenhum NPC fecha uma passagem');
process.exitCode = falhas ? 1 : 0;
