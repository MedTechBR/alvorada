// Conferência estática dos estádios (src/world/estadios.js) com as peças das arenas (src/data/arenas.js), sem navegador:
// para cada estádio, o retângulo da luta tem pelo menos 40 x 28 blocos, os andáveis (sem parede, água, lava nem
// objeto) passam de 40 x 28 = 1120, e nenhuma peça (perigo, plataforma, alavanca, cobertura, candelabro, posições
// de jogador e líder) cai fora da arena ou em cima de um obstáculo do estádio.
//   node tools/teste-3d/estadios-pecas.mjs [--planta=<id>]   (--planta desenha a sala em texto com as peças)
// Usado também por tools/teste-3d/ginasios-tamanho.mjs.
import { ESTADIOS, salasEstadios, ARENA_ESTADIO } from '../../src/world/estadios.js';
import { ARENAS } from '../../src/data/arenas.js';

export const META_W = 40, META_H = 28;
// pegada dos objetos usados nos estádios (src/world/objects.js: fw x fh)
const PEGADA = { stands: [6, 2], boulder: [2, 1], haybale: [1, 1], folhaGigante: [2, 1], bush: [1, 1], crate: [1, 1], barrel: [1, 1], machine: [2, 1], cristal: [1, 1],
  column: [1, 1], statue: [2, 1], pot: [1, 1], log: [4, 1], bell: [2, 1], stalagmite: [1, 1], crystal: [1, 1], sundial: [2, 1], menhir: [1, 1], obelisk: [1, 1],
  roundbush: [3, 1], flowerpot: [1, 1], lavaRock: [2, 1], brazier: [1, 1], brokenColumn: [1, 1], lamp: [1, 1] };
const SOLIDO = new Set(['w', '~', 'W', 'l', 'r', 'M']); // parede, água, água funda, lava, rocha, milho (os que a arena usa)

export function conferir() {
  const salas = salasEstadios(), out = [];
  for (const E of ESTADIOS) {
    const S = salas.find((s) => s.id === 'estadio_' + E.id), A = ARENAS[E.luta], erros = [];
    const W = S.rows[0].length, H = S.rows.length, ocup = Array.from({ length: H }, () => new Array(W).fill(null));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (SOLIDO.has(S.rows[y][x])) ocup[y][x] = 'chão ' + S.rows[y][x];
    for (const o of S.objects) { const [fw, fh] = PEGADA[o.kind] ?? (erros.push('pegada desconhecida: ' + o.kind), [1, 1]); for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) if (ocup[o.y + j]) ocup[o.y + j][o.x + i] = o.kind; }
    if (!A) { out.push({ id: E.id, erros: ['sem arena ' + E.luta] }); continue; }
    if (A.sala !== S.id) erros.push(`arena aponta para ${A.sala}`);
    const [ax, ay, aw, ah] = A.area;
    let andaveis = 0; for (let y = ay; y < ay + ah; y++) for (let x = ax; x < ax + aw; x++) if (!ocup[y]?.[x]) andaveis++;
    const dentro = (x, y) => x >= ax && x < ax + aw && y >= ay && y < ay + ah;
    const livre = (x, y, o) => { const tx = Math.floor(x), ty = Math.floor(y); if (!dentro(tx, ty)) return `${o} (${x},${y}) fora da arena`; if (ocup[ty]?.[tx]) return `${o} (${x},${y}) em cima de ${ocup[ty][tx]}`; return null; };
    const confere = (o, x, y) => { const e = livre(x, y, o); if (e) erros.push(e); };
    confere('jogador', ...A.posicoes.jogador); confere('líder', ...A.posicoes.lider);
    for (const p of A.pecas) {
      const nome = p.id ?? p.tipo;
      const celulas = (lista, o, chao = false) => { for (const c of lista ?? []) { if (c.length === 4) { for (let y = c[1]; y < c[1] + c[3]; y++) for (let x = c[0]; x < c[0] + c[2]; x++) if (!chao || !dentro(x, y)) confere(o, x, y); else if (ocup[y]?.[x] && !/chão [~W]/.test(ocup[y][x])) erros.push(`${o} (${x},${y}) em cima de ${ocup[y][x]}`); } else confere(o, c[0], c[1]); } };
      if (p.tipo === 'plateia') continue; // na arquibancada, fora da luta de propósito
      if (['pos', 'candelabros'].some((k) => p[k])) { const L = p.pos ?? p.candelabros; celulas(typeof L[0] === 'number' ? [L] : L, nome); }
      if (p.celulas) celulas(p.celulas, nome);
      if (p.altas) celulas(p.altas, nome + '/alta', true);
      if (p.plataformas) for (const r of p.plataformas) if (!dentro(r[0], r[1]) || !dentro(r[0] + r[2] - 1, r[1] + r[3] - 1)) erros.push(`${nome}: plataforma ${r} fora da arena`);
      if (p.evita) for (const c of p.evita) if (!dentro(c[0], c[1])) erros.push(`${nome}: evita ${c} fora`);
      if (p.pares) for (const par of p.pares) for (const c of par) confere(nome, c[0], c[1]);
      if (p.barcos) for (const b of p.barcos) for (const [x, y] of b.rota) for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) { const tx = x + i, ty = y + j; if (!dentro(tx, ty)) erros.push(`${nome}: barco fora (${tx},${ty})`); else if (ocup[ty][tx] && !/chão [~W]/.test(ocup[ty][tx])) erros.push(`${nome}: barco em cima de ${ocup[ty][tx]} (${tx},${ty})`); }
      if (p.tipo === 'gerador' || p.tipo === 'pararaio') { /* já em pos */ }
      if (p.tipo === 'teia' && !S.rows.some((l) => l.includes('x'))) erros.push('teia sem fios (x) no chão');
      if (p.tipo === 'faixa' && p.faixas) for (const f of p.faixas) if (f < ay || f >= ay + ah) erros.push(`${nome}: trilho ${f} fora`);
    }
    const pecasIn = A.pecas.filter((p) => p.tipo !== 'plateia').length;
    out.push({ id: E.id, luta: E.luta, sala: S.id, salaTam: `${W}x${H}`, area: `${aw}x${ah}`, andaveis, total: aw * ah, meta: aw >= META_W && ah >= META_H && andaveis >= META_W * META_H, pecas: pecasIn, objetos: S.objects.length, erros });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = conferir();
  for (const l of r) console.log(l.id.padEnd(12), (l.sala ?? '').padEnd(22), (l.salaTam ?? '').padEnd(7), (l.area ?? '').padEnd(7), String(l.andaveis).padStart(5) + '/' + l.total, l.meta ? 'OK' : 'PEQUENA', 'peças', l.pecas, 'objetos', l.objetos, l.erros.length ? '\n   ' + l.erros.join('\n   ') : '');
  const pl = process.argv.find((a) => a.startsWith('--planta='))?.split('=')[1];
  if (pl) { const S = salasEstadios().find((s) => s.id === 'estadio_' + pl); console.log(S.rows.map((l, y) => String(y).padStart(2) + ' ' + l).join('\n')); console.log(S.objects.map((o) => `${o.kind}@${o.x},${o.y}`).join(' ')); }
  const ruins = r.filter((l) => l.erros.length || !l.meta);
  console.log(ruins.length ? `PROBLEMAS: ${ruins.length}` : `OK: ${r.length} estádios, todos com ${META_W}x${META_H} ou mais e peças em lugar livre (arena ${ARENA_ESTADIO.join(',')})`);
  process.exitCode = ruins.length ? 1 : 0;
}
