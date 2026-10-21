// Cenário das barreiras da progressão: o que fica EM PÉ dentro de cada retângulo de barreira-dados.js enquanto ela
// está ativa (cavaletes de obra, cones, moitas, toras, entulho, cerca da Aurora, boias com corda, espuma da
// correnteza, montes de neve, portão do Zênite, placas) e os guardas parados no caminho. Módulo puro (sem PIXI nem
// three): o jogo (src/world/barreiras.js) desenha o resultado e tools/auditar-solidos.mjs confere os guardas.
//
//   montarCenario(mundo, flags, leitor) -> { props: [...], guardas: [...] }
//     leitor.tile(x, y)     bloco do chão (TILE) ou -1 fora do mapa
//     leitor.ocupado(x, y)  true se o bloco já era sólido por objeto do mapa (antes da barreira)
//   prop:   { kind, tx, ty, x, y (pé, px), ori ('h' | 'v'), estilo?, ponta?, bar (id da barreira) }
//   guarda: { id, bar, tx, ty, x, y, dir, look, nome, fala }
//
// Regras: cada objeto fica num bloco do retângulo (nunca fora: a colisão continua sendo a de aplicar()). Bloco de
// floresta, penhasco, paredão, cânion ou já ocupado por objeto não recebe nada (o mundo já é uma parede ali). A linha
// do meio do retângulo leva a peça contínua (cerca, cavalete, corda); as outras fileiras levam enchimento esparso.
// Tempestade e neblina não têm objeto no chão: só placas de aviso onde um caminho entra na zona (o resto é efeito
// de clima, src/visual3d/zonas-clima.js).
import { TILE, SOLID } from './tiles.js';
import { BARREIRAS, TEMPESTADES, NEVOAS, ativa } from './barreiras-dados.js';

const T = 16;
const AGUA = new Set([TILE.WATER, TILE.DEEP, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S, TILE.SHALLOW]);
const CAMINHO = new Set([TILE.PATH, TILE.PLAZA, TILE.STAIRS, TILE.BRIDGE, TILE.BRIDGEV, TILE.DOCK]);
// sólidos que ainda assim recebem objeto (lama, junco): o resto dos SOLID é parede natural
const CHAO_SOLIDO = new Set([TILE.MUD, TILE.CORN]);

// classe do bloco: 'agua', 'cam' (caminho), 'chao' ou null (parede natural / objeto)
export function classe(leitor, x, y) {
  const t = leitor.tile(x, y);
  if (t < 0 || t == null) return null;
  if (AGUA.has(t)) return 'agua';
  if (leitor.ocupado(x, y)) return null;
  if (SOLID.has(t) && !CHAO_SOLIDO.has(t)) return null;
  return CAMINHO.has(t) ? 'cam' : 'chao';
}
// sorteio fixo por bloco (o mesmo objeto sempre no mesmo lugar)
function sorte(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// fala do guarda: o trecho entre aspas da msg (sem o "Guarda da Rota 2:"), ou a msg inteira
export const falaDe = (msg) => /"([^"]+)"/.exec(msg)?.[1] ?? msg;

// guardas das barreiras ativas neste mundo
export function guardasAtivos(mundo, f) {
  const out = [];
  for (const d of BARREIRAS) {
    if (d.mundo !== mundo || !ativa(d, f)) continue;
    (d.visual?.guardas ?? []).forEach(([tx, ty, dir, look, nome], i) => out.push({
      id: `barreira_${d.id}_${i}`, bar: d.id, tx, ty, x: tx * T + 8, y: ty * T + 10, dir, look, nome, fala: falaDe(d.msg),
    }));
  }
  return out;
}

// peça de cada tema para um bloco. linha: está na linha do meio; k: posição ao longo da linha; cl: classe
function peca(tema, cl, linha, k, x, y) {
  const r = sorte(x, y), r2 = sorte(x, y, 7);
  if (cl === 'agua') {
    if (tema === 'obra') return linha || r < 0.75 ? 'barPonte' : null;        // a ponte da obra, quebrada
    if (tema === 'neve' || tema === 'zenite') return linha ? (k % 4 === 0 ? 'boia' : 'barCorda') : (r < 0.4 ? 'barEspuma' : null);
    if (linha) return k % 40 === 20 ? 'barPlacaBoia' : k % 4 === 0 ? 'boia' : 'barCorda';
    return r < (tema === 'mar' ? 0.8 : 0.55) ? 'barEspuma' : null;
  }
  switch (tema) {
    case 'mata': case 'brejo':
      if (cl === 'cam') return linha ? 'barCavalete' : (r < 0.5 ? 'barToras' : null);
      return linha ? (r2 < 0.28 ? 'barToras' : 'barMoita') : (r < 0.6 ? 'barMoita' : null);
    case 'obra':
      if (linha) return k % 3 === 2 ? 'barCone' : 'barCavalete';
      return r < 0.45 ? 'barCone' : null;
    case 'entulho':
      if (linha) return r2 < 0.12 ? 'barToras' : 'barEntulho';
      return r < 0.8 ? 'barEntulho' : null;
    case 'aurora':
      if (linha) return cl === 'cam' ? 'barPortao' : 'barCerca';
      return r < 0.25 ? 'barCone' : null;
    case 'posto':
      if (linha) return cl === 'cam' ? 'barCancela' : (k % 2 ? 'barCerca' : 'barCavalete');
      return cl === 'cam' ? (r < 0.4 ? 'barCone' : null) : (r < 0.3 ? 'barCavalete' : null);
    case 'neve':
      return linha || r < 0.7 ? 'barNeve' : null;
    case 'zenite':
      if (linha) return k % 4 === 0 ? 'barPilar' : 'barGrade';
      return cl === 'chao' && r < 0.4 ? 'barNeve' : null;
    default: return null;
  }
}
const ESTILO = { aurora: 'aurora', zenite: 'liga', tempestade: 'tempestade', neblina: 'tempestade' };

export function montarCenario(mundo, f, leitor) {
  const props = [], guardas = guardasAtivos(mundo, f), usados = new Set();
  const chave = (x, y) => x + ',' + y;
  for (const gd of guardas) usados.add(chave(gd.tx, gd.ty));
  const por = (kind, tx, ty, ori, bar, extra) => {
    const k = chave(tx, ty); if (usados.has(k)) return; usados.add(k);
    const jit = /barMoita|barEntulho|barNeve|barEspuma/.test(kind) ? (sorte(tx, ty, 3) - 0.5) * 3 : 0;
    props.push({ kind, tx, ty, x: tx * T + 8 + jit, y: ty * T + 16, ori, bar, ...extra });
  };
  for (const d of BARREIRAS) {
    if (d.mundo !== mundo || !ativa(d, f) || !d.visual) continue;
    const tema = d.visual.tema;
    // placa ao lado de cada guarda, na mesma linha (antes de tudo, para ganhar o bloco)
    for (const gd of guardas) {
      if (gd.bar !== d.id) continue;
      const R = d.rects.find(([x, y, w, h]) => gd.tx >= x && gd.ty >= y && gd.tx < x + w && gd.ty < y + h); if (!R) continue;
      const hor = R[2] >= R[3];
      for (const s of [1, -1]) {
        const tx = gd.tx + (hor ? s : 0), ty = gd.ty + (hor ? 0 : s);
        if (tx < R[0] || ty < R[1] || tx >= R[0] + R[2] || ty >= R[1] + R[3] || !classe(leitor, tx, ty) || classe(leitor, tx, ty) === 'agua') continue;
        por('barPlaca', tx, ty, hor ? 'h' : 'v', d.id, { estilo: ESTILO[tema] ?? 'obra' }); break;
      }
    }
    for (const [x, y, w, h] of d.rects) {
      const hor = w >= h, ori = hor ? 'h' : 'v';
      if (tema === 'paredao') {
        // paredão: nada pendurado no muro; só a placa no pé, no meio do trecho
        const tx = x + Math.floor(w / 2), ty = y + h - 1;
        por('barPlaca', tx, ty, 'h', d.id, { estilo: 'obra' });
        // a fileira de cima (o topo do paredão, onde o trecho esbarra de quem vem do platô) também é bloqueada: cavaletes nos blocos de chão
        for (let i = 0; i < w; i++) if (classe(leitor, x + i, y)) por('barCavalete', x + i, y, 'h', d.id);
        continue;
      }
      const meio = hor ? Math.floor(h / 2) : Math.floor(w / 2);
      for (let j = 0; j < h; j++) {
        let antes = null; // classe do bloco anterior na linha (ponta da cancela)
        for (let i = 0; i < w; i++) {
          const tx = x + i, ty = y + j, cl = classe(leitor, tx, ty);
          // linha cheia no meio E na primeira e na última fileira do retângulo: o jogador esbarra na fileira de fora e ela
          // precisa estar desenhada (antes só o meio tinha peças contínuas, e as fileiras de fora ficavam com falhas: muro invisível)
          const lin = hor ? j : i, ult = (hor ? h : w) - 1, linha = lin === meio || lin === 0 || lin === ult, k = hor ? i : j;
          if (!cl) { antes = null; continue; }
          const kind = peca(tema, cl, linha, k, tx, ty);
          if (kind) por(kind, tx, ty, ori, d.id, kind === 'barCancela' ? { ponta: antes !== 'cam' } : kind === 'barCerca' ? { placa: k % 6 === 3 } : kind === 'barPlacaBoia' ? { estilo: 'tempestade' } : undefined);
          antes = cl;
        }
      }
    }
    // retângulos verticais: a cancela anda na coluna; refaz a ponta pelo vizinho de cima
    for (const p of props) if (p.kind === 'barCancela' && p.ori === 'v' && p.bar === d.id) p.ponta = classe(leitor, p.tx, p.ty - 1) !== 'cam' || !d.rects.some(([x, y, w, h]) => p.tx >= x && p.ty - 1 >= y && p.tx < x + w && p.ty - 1 < y + h);
  }
  // tempestade e neblina: placa onde um caminho (ou o mar navegável) entra na zona; nada mais no chão
  for (const d of [...TEMPESTADES, ...NEVOAS]) {
    if (d.mundo !== mundo || !ativa(d, f)) continue;
    const dentro = (tx, ty) => d.rects.some(([x, y, w, h]) => tx >= x && ty >= y && tx < x + w && ty < y + h);
    const ultimas = [];
    for (const [x, y, w, h] of d.rects) {
      const borda = [];
      for (let i = 0; i < w; i++) borda.push([x + i, y, 0, -1], [x + i, y + h - 1, 0, 1]);
      for (let j = 0; j < h; j++) borda.push([x, y + j, -1, 0], [x + w - 1, y + j, 1, 0]);
      for (const [tx, ty, dx, dy] of borda) {
        if (dentro(tx + dx, ty + dy)) continue; // borda interna (entre dois retângulos da mesma zona)
        const cl = classe(leitor, tx, ty), fora = classe(leitor, tx + dx, ty + dy);
        if (!cl || !fora) continue;
        const terra = cl === 'cam' && fora === 'cam', mar = cl === 'agua' && fora === 'agua' && TEMPESTADES.includes(d) === false;
        if (!terra && !mar) continue;
        if (ultimas.some(([a, b]) => Math.abs(a - tx) + Math.abs(b - ty) < (mar ? 48 : 12))) continue;
        ultimas.push([tx, ty]);
        por(mar ? 'barPlacaBoia' : 'barPlaca', tx, ty, dx ? 'v' : 'h', d.id, { estilo: 'tempestade' });
      }
    }
  }
  return { props, guardas };
}
