// Veste as áreas ao ar livre (guia de biomas, passo 1 a 3): rotas viram corredores com borda de árvore e pedra,
// marcos a cada 40-50 blocos, mato alto em manchas, itens em bolsões, flores e cercas nas cidades, e props por bioma.
// Não mexe nos JSON de mapa: grava uma camada por região em assets/maps/vestir/<id>.json (ver src/world/vestir.js).
//
//   node tools/vestir.mjs                    gera a camada de todas as regiões (nucleo, geada, sertao, jandaia, brasas, austral)
//   node tools/vestir.mjs geada brasas       só essas regiões
//   node tools/vestir.mjs --verificar        monta o mundo COM a camada e confere: conectividade das âncoras, reservados
//
// Regras que o gerador nunca quebra:
//  - nada sólido nos blocos PROTEGIDOS: a árvore de caminhos mais curtos entre as âncoras (portas, passagens,
//    pontos da história, ninhos e centros das cidades). Enquanto ela estiver livre, as âncoras continuam ligadas.
//  - nada sólido a menos de 2 blocos de portas, passagens, pontos, NPCs, itens e pets (reservados).
//  - corredores de rota com uma faixa central livre (a trilha), sem sólido nela.
//  - determinístico: o mesmo resultado a cada execução (semente = id da região).
import { writeFileSync, mkdirSync } from 'node:fs';
import { carregarMundo, TILE } from './vestir/mundo.mjs';
import { ancoras, reservados, protegidos, componentes, caminhavel, labelAreas, regiaoDe } from './vestir/analise.mjs';

const REGIOES = ['nucleo', 'geada', 'sertao', 'jandaia', 'brasas', 'austral'];
const args = process.argv.slice(2);
const verificar = args.includes('--verificar');
const pedidas = args.filter((a) => !a.startsWith('--'));
const VEST = new URL('../assets/maps/vestir/', import.meta.url);
mkdirSync(VEST, { recursive: true });

// ---------- blocos em que um sólido pode nascer (terreno de chão, sem trilha, água, degraus ou pontes)
const LAND = new Set([TILE.GRASS, TILE.GRASS2, TILE.TALL, TILE.FLOWERS, TILE.DARK, TILE.SNOWFIELD, TILE.TALLSNOW, TILE.SNOW,
  TILE.CAATINGA, TILE.TALLDRY, TILE.BASALT, TILE.ASH, TILE.DUNE, TILE.CRACKED, TILE.REDROCK, TILE.SAND, TILE.WETSAND,
  TILE.OBSIDIAN, TILE.SALT]);
const ROTA_BIOMAS = new Set(['campo', 'floresta', 'margem', 'planalto', 'neve', 'sertao', 'selva']);

// ---------- o que cada bioma põe: árvores, pedras, muro de borda, marcos, decoração plana (ver docs/guia-biomas.md, 4.4)
const BIOMA = {
  campo: { p: 0.012, arv: ['tree', 'tree2', 'pine', 'pine2', 'autumn'], pedra: ['bush', 'roundbush', 'boulder', 'grayrock', 'log', 'stump'], marco: ['bigtree', 'menhir', 'column', 'bell', 'statue'], muro: ['tree', 'tree2', 'pine', 'pine2', 'autumn', 'bush'], decor: ['pebble', 'pebble2', 'mush'], dp: 0.02, flor: 0.03 },
  floresta: { p: 0.07, arv: ['tree', 'pine', 'tree2', 'pine2', 'autumn', 'bigtree'], pedra: ['roundbush', 'log', 'stump', 'bush'], marco: ['bigautumn', 'bigtree', 'menhir', 'jequitiba'], muro: ['tree', 'pine', 'tree2', 'pine2', 'autumn'], decor: ['mush', 'mush2', 'pebble'], dp: 0.03, flor: 0.01 },
  margem: { p: 0.02, arv: ['oran', 'pecha', 'tree2', 'palmSmall'], pedra: ['bush', 'driftwood', 'log', 'boulder'], marco: ['mangue', 'bell', 'driftwood'], muro: ['bush', 'oran', 'tree2'], decor: ['pebble2', 'mush'], dp: 0.03, flor: 0.02 },
  planalto: { p: 0.02, arv: ['pine', 'pineT'], pedra: ['boulder', 'grayrock', 'boulder2', 'stalagmite'], marco: ['menhir', 'column', 'bell', 'boulder2'], muro: ['boulder', 'grayrock', 'boulder2'], decor: ['pebble'], dp: 0.02, flor: 0 },
  neve: { p: 0.04, arv: ['snowPine', 'snowPineBig'], pedra: ['boulder', 'stalagmiteIce', 'snowman'], marco: ['snowPineBig', 'stalagmiteIce', 'bell'], muro: ['snowPine', 'snowPineBig'], decor: ['pebble'], dp: 0.02, flor: 0 },
  sertao: { p: 0.022, arv: ['cactus', 'mandacaru', 'juazeiro'], pedra: ['xiquexique', 'boulder', 'grayrock', 'skull'], marco: ['obelisk', 'column', 'altar', 'menhir'], muro: ['cactus', 'mandacaru', 'boulder'], decor: ['pebble'], dp: 0.02, flor: 0 },
  canion: { p: 0.022, arv: ['cactus'], pedra: ['boulder', 'grayrock', 'stalagmite'], marco: ['obelisk', 'column', 'menhir'], muro: ['boulder', 'grayrock'], decor: ['pebble'], dp: 0.02, flor: 0 },
  deserto: { p: 0.02, arv: ['cactus', 'mandacaru'], pedra: ['boulder', 'grayrock', 'skull', 'brokenColumn'], marco: ['statue', 'obelisk', 'brokenColumn'], muro: ['boulder', 'grayrock'], decor: ['pebble'], dp: 0.02, flor: 0 },
  vulcao: { p: 0.045, arv: ['obsidianRock'], pedra: ['obsidianRock', 'stalagmite', 'lavaRock', 'fumarola'], marco: ['lavaRock', 'brazier'], muro: ['obsidianRock', 'stalagmite'], decor: ['pebble'], dp: 0.01, flor: 0 },
  mangue: { p: 0.03, arv: ['mangue', 'palmeira'], pedra: ['log', 'driftwood', 'stump'], marco: ['mangue', 'coqueiro'], muro: ['mangue', 'palmeira'], decor: ['mush'], dp: 0.02, flor: 0 },
  selva: { p: 0.12, arv: ['arvoreSelva', 'folhaGigante', 'araucaria', 'bambu', 'umbu'], pedra: ['roundbush', 'folhaGigante', 'log'], marco: ['arvoreSelva', 'araucaria', 'mural'], muro: ['arvoreSelva', 'bambu', 'folhaGigante', 'umbu'], decor: ['mush', 'mush2'], dp: 0.04, flor: 0.01 },
  praia: { p: 0.02, arv: ['palmeira', 'coqueiro', 'palmSmall'], pedra: ['driftwood', 'surfboard', 'barrel', 'skull'], marco: ['beachStall', 'jangada', 'boia'], muro: ['palmeira', 'coqueiro'], decor: ['pebble'], dp: 0.03, flor: 0 },
  termal: { p: 0.035, arv: ['stalagmite'], pedra: ['stalagmite', 'fumarola', 'boulder'], marco: ['brazier', 'lavaRock'], muro: ['stalagmite', 'boulder'], decor: ['pebble'], dp: 0.01, flor: 0 },
  gelo: { p: 0.03, arv: ['crystal'], pedra: ['stalagmiteIce', 'crystal', 'boulder'], marco: ['crystal', 'stalagmiteIce'], muro: ['stalagmiteIce', 'crystal'], decor: [], dp: 0, flor: 0 },
  pico: { p: 0.03, arv: ['snowPine'], pedra: ['boulder', 'snowPine'], marco: ['bell'], muro: ['boulder'], decor: ['pebble'], dp: 0.02, flor: 0 },
  sertao_: { p: 0.012, arv: ['cactus'], pedra: ['boulder'], marco: ['obelisk'], muro: ['cactus'], decor: ['pebble'], dp: 0.02, flor: 0 },
};
const ITENS = ['potion', 'pokeball', 'oranBerry'];

// ---------- semente e sorteio determinístico
const hashTxt = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const hash = (x, y, s) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------- montagem da linha de base (sem a camada) e das proteções globais
const M = await carregarMundo('alvorada', { semVestir: true });
const { R, W, H, OH, S } = M;
// o catálogo (KINDS) só existe depois de carregar o mundo (os ganchos do Node são registrados em mundo.mjs)
const { KINDS } = await import('../src/world/objects.js');
const walkBase = caminhavel(M);
const ancs = ancoras(M);
const P = protegidos(walkBase, W, H, ancs);     // blocos que precisam ficar livres (ligam as âncoras)
const rsv = reservados(M);
const labBase = labelAreas(R, W, OH);
const compBase = componentes(walkBase, W, H).comp;

// rotas: áreas "Rota N" de bioma terrestre, com a faixa central da trilha
const rotas = R.areas.filter((a) => a.rect && /^Rota \d/.test(a.name ?? '') && ROTA_BIOMAS.has(a.biome));

// ---------- geração de uma região (sobre cópias da linha de base: cada região independe das outras)
function gerarRegiao(reg) {
  const [rx, ry, rw, rh] = reg.rect;
  const x0 = rx, y0 = ry, x1 = Math.min(rx + rw, W), y1 = Math.min(ry + rh, OH);
  const tiles = Uint8Array.from(S.tiles), block = Uint8Array.from(S.block);
  const seed = hashTxt(reg.id);
  const dentro = (x, y) => x >= x0 && y >= y0 && x < x1 && y < y1;
  const lane = new Uint8Array(W * H);
  const out = { objects: [], decor: [], items: [], tiles: new Map() };
  const setTile = (k, nome) => { const t = TILE[nome.toUpperCase()] ?? nome; if (!out.tiles.has(nome)) out.tiles.set(nome, []); out.tiles.get(nome).push(k); tiles[k] = t; };
  // bloco livre para sólido: dentro da região, chão de terra, sem proteção, sem reservado, fora da trilha, sem objeto
  const livre = (k) => !block[k] && LAND.has(tiles[k]) && !P[k] && !rsv[k] && !lane[k];
  const pe = (kind, x, y) => {
    const K = KINDS[kind]; if (!K) { console.warn('vestir: tipo desconhecido', kind); return false; }
    const cells = [];
    for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) {
      if (K.solidCells && !K.solidCells.some(([a, b]) => a === i && b === j)) continue;
      const X = x + i, Y = y + j, k = X + Y * W;
      if (!dentro(X, Y) || !livre(k)) return false;
      cells.push(k);
    }
    // a pegada inteira precisa estar a mais de 0 blocos de reservado (a rsv já é checada por livre)
    for (const k of cells) block[k] = 1;
    const o = { kind, x, y };
    out.objects.push(o);
    return true;
  };
  const pegada = (kind) => KINDS[kind]?.fw ?? 1; // largura da pegada, em blocos
  const escolha = (lista, k) => lista[Math.floor(hash(k % W, Math.floor(k / W), seed + 7) * lista.length)];

  // ----- 1. rotas: corredor, muro de borda, marcos, itens e mato alto na faixa
  const areasReg = rotas.filter((a) => a.rect[0] < x1 && a.rect[0] + a.rect[2] > x0 && a.rect[1] < y1 && a.rect[1] + a.rect[3] > y0);
  for (const a of areasReg) {
    const [ax, ay, aw, ah] = a.rect, cfg = BIOMA[a.biome] ?? BIOMA.campo;
    const horiz = aw >= ah;
    const esp = horiz ? ah : aw, larg = Math.min(esp, 12), off = Math.floor((esp - larg) / 2);
    // faixa da trilha: 12 blocos no máximo, centrada na rota; 3 blocos de trilha central sem nada em cima
    const meio = horiz ? ay + off + Math.floor(larg / 2) : ax + off + Math.floor(larg / 2);
    const ini = horiz ? ay + off : ax + off, fim = ini + larg - 1;
    for (let t = -1; t <= 1; t++) {
      const c = meio + t;
      for (let s = (horiz ? ax : ay); s < (horiz ? ax + aw : ay + ah); s++) {
        const X = horiz ? s : c, Y = horiz ? c : s;
        if (dentro(X, Y)) lane[X + Y * W] = 1;
      }
    }
    // muros: uma linha de cada lado da faixa, com brechas (1/3) para não fechar cruzamentos
    const lados = [ini - 1, fim + 1];
    for (const lin of lados) {
      for (let s = horiz ? ax : ay; s < (horiz ? ax + aw : ay + ah); ) {
        const X = horiz ? s : lin, Y = horiz ? lin : s;
        // parede quase contínua (60% dos vãos); misturada com arbusto (1 em 4) para não ficar de um tipo só
        const kind = hash(s, lin, seed + 5) < 0.25 ? 'bush' : escolha(cfg.muro, s + lin * 97);
        const n = Math.max(1, pegada(kind));
        if (hash(s, lin, seed + 9) < 0.6 && KINDS[kind]) pe(kind, X, Y);
        s += n;
      }
    }
    // marcos a cada 40 a 50 blocos ao longo da rota (no muro de um dos lados, deslocado se não couber)
    let prox = (horiz ? ax : ay) + 12 + Math.floor(hash(ax, ay, seed + 4) * 8);
    let lado = 0;
    while (prox < (horiz ? ax + aw : ay + ah) - 4) {
      const kind = escolha(cfg.marco, prox);
      const lin = lados[lado++ % 2];
      let colocou = false;
      for (let d = 0; d < 6 && !colocou; d++) for (const sg of [1, -1]) {
        if (colocou) break;
        const s = prox + sg * d;
        const X = horiz ? s : lin, Y = horiz ? lin : s;
        colocou = pe(kind, X, Y);
      }
      prox += 40 + Math.floor(hash(prox, lin, seed + 5) * 11);
    }
    // mato alto em manchas na faixa, fora da trilha (encontros de rota)
    for (let s = horiz ? ax + 6 : ay + 6; s < (horiz ? ax + aw : ay + ah) - 6; s += 14 + Math.floor(hash(s, ay, seed + 6) * 10)) {
      const off = Math.floor(larg / 2) - 3, lado = hash(s, meio, seed + 8) < 0.5 ? -1 : 1;
      const cx = horiz ? s : meio + lado * off, cy = horiz ? meio + lado * off : s;
      for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
        if (i * i + j * j > 10 + (hash(cx + i, cy + j, seed) > 0.6 ? 2 : 0)) continue;
        const X = cx + i, Y = cy + j, k = X + Y * W;
        if (dentro(X, Y) && !lane[k] && (tiles[k] === TILE.GRASS || tiles[k] === TILE.GRASS2) && !rsv[k]) setTile(k, 'tall');
      }
    }
    // bolsões com itens: um a cada ~150 blocos, na faixa, sem bloquear
    let it = 0;
    for (let s = horiz ? ax + 8 : ay + 8; s < (horiz ? ax + aw : ay + ah) - 4; s += 150) {
      for (let q = 0; q < 40; q++) {
        const jit = Math.floor(hash(s, q, seed + 10) * 20) - 10, c = (ini + 1 + Math.floor(hash(s + q, meio, seed + 11) * (larg - 2)));
        const X = horiz ? s + jit : c, Y = horiz ? c : s + jit, k = X + Y * W;
        if (dentro(X, Y) && !block[k] && !rsv[k] && !lane[k] && LAND.has(tiles[k])) {
          out.items.push({ x: X, y: Y, item: ITENS[it++ % ITENS.length], n: 1, hidden: true });
          break;
        }
      }
    }
  }

  // ----- 1b. margens da trilha: arbustos, pedras e troncos soltos entre o muro e a faixa central (não na trilha)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = x + y * W, ai = labBase[k];
    if (ai < 0 || lane[k] || rsv[k]) continue;
    const a = R.areas[ai];
    if (!ROTA_BIOMAS.has(a.biome) || !/^Rota \d/.test(a.name ?? '')) continue;
    const cfg = BIOMA[a.biome] ?? BIOMA.campo;
    if (hash(x, y, seed + 30) < 0.035) pe(escolha(cfg.pedra, k + 1), x, y);
  }

  // ----- 2. cidades e vilas: flores, vasos, bancos, lâmpadas, poço na praça
  const vilas = R.areas.filter((a) => a.rect && a.biome === 'vila' && a.rect[0] < x1 && a.rect[0] + a.rect[2] > x0 && a.rect[1] < y1 && a.rect[1] + a.rect[3] > y0);
  for (const a of vilas) {
    const [ax, ay, aw, ah] = a.rect;
    const praca = [];
    for (let y = Math.max(ay, y0); y < Math.min(ay + ah, y1); y++) for (let x = Math.max(ax, x0); x < Math.min(ax + aw, x1); x++) {
      const k = x + y * W;
      if (tiles[k] === TILE.PLAZA) praca.push([x, y]);
      if (labBase[k] !== R.areas.indexOf(a)) continue;
      if (tiles[k] === TILE.GRASS && !block[k] && !rsv[k] && hash(x, y, seed + 12) < 0.05) setTile(k, 'flowers');
      else if (hash(x, y, seed + 13) < 0.012 && livre(k)) pe('flowerpot', x, y);
      else if (hash(x, y, seed + 14) < 0.008 && livre(k)) pe('lamp', x, y);
      else if (hash(x, y, seed + 15) < 0.006 && livre(k)) pe('bench', x, y);
    }
    if (praca.length) {
      const cx = Math.round(praca.reduce((s, p) => s + p[0], 0) / praca.length), cy = Math.round(praca.reduce((s, p) => s + p[1], 0) / praca.length);
      if (!pe('well', cx - 1, cy)) pe('statue', cx - 1, cy);
    }
  }

  // ----- 3. biomas: props por bioma e decoração plana (campo, mata, deserto, neve...)
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = x + y * W, ai = labBase[k];
    if (ai < 0) continue;
    const a = R.areas[ai];
    if (a.biome === 'vila' || a.biome === 'mar') continue;
    const cfg = BIOMA[a.biome] ?? BIOMA.campo;
    const h1 = hash(x, y, seed + 20);
    if (h1 < cfg.p && !lane[k]) {
      const lista = hash(x, y, seed + 21) < 0.55 ? cfg.arv : cfg.pedra;
      const kind = escolha(lista, k);
      if (kind && KINDS[kind]) pe(kind, x, y);
    }
    if (cfg.decor.length && !block[k] && LAND.has(tiles[k]) && hash(x, y, seed + 22) < cfg.dp && !lane[k]) {
      out.decor.push({ kind: escolha(cfg.decor, k), x, y });
    }
    if (cfg.flor && tiles[k] === TILE.GRASS && !block[k] && !lane[k] && !rsv[k] && hash(x, y, seed + 23) < cfg.flor) setTile(k, 'flowers');
  }
  // tiles: converte o mapa em uma lista esparsa por tipo (sem repetir bloco)
  const tilesOut = [...out.tiles].map(([t, ks]) => ({ t, pts: [...new Set(ks)].map((k) => [k % W, Math.floor(k / W)]) }));
  return { tiles: tilesOut, objects: out.objects.filter((o) => dentro(o.x, o.y)), decor: out.decor, items: out.items };
}

// ---------- escrita das camadas
function gravar(id, V) {
  const url = new URL(`${id}.json`, VEST);
  const dados = { regiao: id, comment: 'Camada vestir: enfeite gerado por tools/vestir.mjs (não editar à mão; regere com node tools/vestir.mjs ' + id + ').', ...V };
  writeFileSync(url, JSON.stringify(dados) + '\n');
  console.log(`gravado: assets/maps/vestir/${id}.json (${V.objects.length} objetos, ${V.decor.length} decor, ${V.items.length} itens, ${V.tiles.reduce((s, t) => s + t.pts.length, 0)} blocos)`);
}

// ---------- verificação: monta o mundo com a camada e confere
async function verificarTudo() {
  const C = await carregarMundo('alvorada', { semVestir: false });
  const walk = caminhavel(C);
  const comp = componentes(walk, W, H).comp;
  const erros = [];
  // (a) âncoras que estavam ligadas continuam ligadas
  const porComp = new Map();
  for (const a of ancs) {
    const cb = compBase[a], ca = comp[a];
    if (cb < 0) continue;
    if (!porComp.has(cb)) porComp.set(cb, new Set());
    porComp.get(cb).add(ca);
  }
  let pares = 0, quebrados = 0;
  for (const [, s] of porComp) { pares++; if (s.size > 1) { quebrados++; erros.push(`componente com âncoras separadas: ${[...s].join(',')}`); } }
  // (b) nenhum sólido novo em reservado (portas, passagens, pontos, NPCs, itens)
  let sol = 0;
  for (let k = 0; k < W * OH; k++) if (C.S.block[k] && !S.block[k] && rsv[k]) { sol++; if (sol < 6) erros.push(`sólido em reservado: ${k % W},${Math.floor(k / W)}`); }
  // (c) nenhuma passagem (warp) fica bloqueada
  for (const w of R.warps) if (!w.mundo && w.y < OH && !walk[w.x + w.y * W]) erros.push(`passagem bloqueada em ${w.x},${w.y}`);
  // (d) densidade do mundo com a camada
  return { erros, pares, quebrados, reservadosOk: sol === 0 };
}

if (verificar) {
  const r = await verificarTudo();
  console.log(`conectividade: ${r.pares} grupos de âncoras, ${r.quebrados} quebrado(s)`);
  console.log(`reservados: ${r.reservadosOk ? 'ok' : 'FALHOU'}`);
  if (r.erros.length) { console.log('erros:', r.erros.slice(0, 20)); process.exitCode = 1; } else console.log('verificação: ok');
} else {
  const alvo = REGIOES.filter((id) => !pedidas.length || pedidas.includes(id));
  for (const id of alvo) {
    const reg = R.regioes.find((r) => r.id === id);
    if (!reg) { console.log('região desconhecida (ignorada):', id); continue; }
    const V = gerarRegiao(reg);
    gravar(id, V);
  }
}
