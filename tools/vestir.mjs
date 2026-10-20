// Veste as áreas ao ar livre (docs/guia-biomas.md): cada região vira um conjunto de rotas desenhadas, como nos
// jogos de Pokémon — trilha clara, paredões de mata ou rocha com volume dos lados, mato alto em blocos, clareiras com
// marco, nichos com item ou árvore de baga, placas nos cruzamentos e cidades com praça, canteiros, cercas e postes.
// Não mexe nos JSON de mapa: grava uma camada por região em assets/maps/vestir/<id>.json (ver src/world/vestir.js).
//
//   node tools/vestir.mjs                    gera a camada de todas as regiões (nucleo, geada, sertao, jandaia, brasas, austral)
//   node tools/vestir.mjs geada brasas       só essas regiões (a rede de trilhas é calculada no mundo todo do mesmo jeito)
//   node tools/vestir.mjs --verificar        monta o mundo COM a camada e confere conectividade e reservados
//
// Como funciona (tudo determinístico, a semente é o id da região; regerar depois que alguém mexer num mapa é seguro):
//  1. Âncoras: passagens, pontos da história (ninhos inclusive), portas, NPCs, itens, tocas e uma grade de pontos
//     de exploração (um a cada ~34 blocos de terra), para as regiões grandes ganharem rede de trilhas.
//  2. Rede de trilhas: árvore de caminhos mais baratos entre as âncoras (Dijkstra que prefere a trilha que já existe).
//     Onde não há trilha, ela é pintada (terra, neve batida, cinza...) seguindo a linha suavizada.
//  3. Proteção: a mesma árvore, recalculada preferindo as trilhas novas, nunca recebe nada sólido. Enquanto ela
//     estiver livre, todas as âncoras continuam ligadas (o --verificar confere).
//  4. Corredor: distância de cada bloco até a trilha; além do raio do bioma (4 a 9, com ruído e clareiras) nasce o
//     paredão (mata em fileiras, rocha em camadas, mangue, cacto...). Dentro do corredor: mato alto em blocos,
//     borda com pedras e arbustos, manchas no chão, marcos nas clareiras, nichos e placas.
//  5. Cidades (áreas "vila"): chafariz na praça, bancos, postes, canteiros, cercas de quintal e enfeite do tema.
import { writeFileSync, mkdirSync } from 'node:fs';
import { carregarMundo, TILE, SOLID } from './vestir/mundo.mjs';
import { componentes, labelAreas } from './vestir/analise.mjs';

const REGIOES = ['nucleo', 'geada', 'sertao', 'jandaia', 'brasas', 'austral'];
const args = process.argv.slice(2);
const verificar = args.includes('--verificar');
const pedidas = args.filter((a) => !a.startsWith('--'));
const VEST = new URL('../assets/maps/vestir/', import.meta.url);
mkdirSync(VEST, { recursive: true });

// ---------- ruído e sorteio determinístico
const hashTxt = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const hash = (x, y, s) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const vnoise = (x, y, s) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.3, y * 2.3, s + 9) * 0.4;

// ---------- o mundo sem a camada (linha de base)
const M = await carregarMundo('alvorada', { semVestir: true });
const { R, S, W, H, OH } = M;
const { KINDS } = await import('../src/world/objects.js');
const T = S.tiles, B = S.block, N = W * OH;
const lab = labelAreas(R, W, OH);

// ---------- biomas por bloco
const BIO = ['campo', 'floresta', 'selva', 'neve', 'gelo', 'deserto', 'canion', 'sertao', 'vulcao', 'praia', 'mangue', 'margem', 'planalto', 'termal', 'vila', 'mar'];
const BI = Object.fromEntries(BIO.map((b, i) => [b, i]));
const PORTILE = new Map();
const tb = (nomes, b) => { for (const n of nomes.split(' ')) PORTILE.set(TILE[n], b); };
tb('SNOWFIELD TALLSNOW DEEPSNOW SNOW', 'neve'); tb('ICE FROZEN', 'gelo'); tb('DUNE QUICKSAND', 'deserto'); tb('CRACKED REDROCK DRYRIVER', 'canion');
tb('CAATINGA TALLDRY', 'sertao'); tb('BASALT ASH OBSIDIAN LAVAFLOOR', 'vulcao'); tb('SAND WETSAND TIDE', 'praia'); tb('MANGMUD ROOTS SHALLOW REED', 'mangue');
tb('HOTSPRING', 'termal'); tb('SALT SALTMIRROR', 'deserto');
const VERDE = new Set([TILE.GRASS, TILE.GRASS2, TILE.TALL, TILE.FLOWERS, TILE.DARK, TILE.GOLD]);
const VERDE_AREA = new Set(['campo', 'floresta', 'selva', 'margem', 'planalto', 'mangue']);
const bio = new Uint8Array(N).fill(BI.mar);
for (let k = 0; k < N; k++) {
  const t = T[k], ai = lab[k], ab = ai >= 0 ? R.areas[ai].biome : null;
  if (ab === 'vila') { bio[k] = BI.vila; continue; }
  if (VERDE.has(t)) { bio[k] = VERDE_AREA.has(ab) ? BI[ab] : BI.campo; continue; }
  const b = PORTILE.get(t); if (b) bio[k] = BI[b];
}

// ---------- blocos
const LAND = new Set([TILE.GRASS, TILE.GRASS2, TILE.TALL, TILE.FLOWERS, TILE.DARK, TILE.SNOWFIELD, TILE.TALLSNOW, TILE.SNOW, TILE.DEEPSNOW,
  TILE.CAATINGA, TILE.TALLDRY, TILE.BASALT, TILE.ASH, TILE.DUNE, TILE.CRACKED, TILE.REDROCK, TILE.SAND, TILE.WETSAND, TILE.OBSIDIAN, TILE.SALT, TILE.MANGMUD, TILE.GOLD, TILE.DRYRIVER]);
const TRILHA = new Set([TILE.PATH, TILE.PLAZA, TILE.BRIDGE, TILE.BRIDGEV, TILE.DOCK, TILE.STAIRS, TILE.COURT, TILE.TILEFLOOR, TILE.OLDSTONE, TILE.TEMPLEFLOOR, TILE.MOSAIC, TILE.SNOW]);
const walk0 = new Uint8Array(W * H);
for (let k = 0; k < W * H; k++) walk0[k] = SOLID.has(T[k]) || B[k] ? 0 : 1;

// ---------- âncoras e reservados (nada sólido a menos de 2 blocos)
const rsv = new Uint8Array(N), ancs = [];
const marca = (x, y, r = 2) => { x = Math.floor(x); y = Math.floor(y); for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < OH) rsv[X + Y * W] = 1; } };
const anc = (x, y) => { if (typeof x !== 'number' || typeof y !== 'number') return; x = Math.floor(x); y = Math.floor(y); if (y < OH && x >= 0 && x < W && y >= 0 && walk0[x + y * W]) ancs.push(x + y * W); };
for (const w of R.warps) { marca(w.x, w.y); if (w.mundo) continue; anc(w.x, w.y); if (Array.isArray(w.to) && typeof w.to[0] === 'number') { marca(w.to[0], w.to[1]); anc(w.to[0], w.to[1]); } }
for (const v of Object.values(R.spots)) if (Array.isArray(v)) { marca(v[0], v[1], 3); anc(v[0], v[1]); }
for (const p of R.people) if (p.room == null) { marca(p.x, p.y, Math.min(4, 2 + (p.wander ?? 0))); anc(p.x, p.y); }
for (const p of R.pets) if (p.room == null) marca(p.x, p.y);
for (const i of R.items) if (i.room == null) { marca(i.x, i.y, 1); anc(i.x, i.y); }
for (const t of R.tocas ?? []) { marca(t.x, t.y, 3); anc(t.x, t.y); }
for (const s of R.signs ?? []) if (s.x != null) marca(s.x, s.y, 1);
for (const mc of R.mecanismos ?? []) { for (const [x, y] of mc.pts ?? []) marca(x, y, 2); if (mc.rect) { const [x, y, w, h] = mc.rect; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) marca(x + i, y + j, 2); } }
// noTrees ("sem árvores soltas"): sem paredão nem marco ali, mas a cidade pode ganhar poste, canteiro e enfeite
const semArv = new Uint8Array(N);
for (const [x0, y0, w0, h0] of R.noTrees ?? []) for (let y = y0; y < y0 + h0; y++) for (let x = x0; x < x0 + w0; x++) if (x >= 0 && y >= 0 && x < W && y < OH) semArv[x + y * W] = 1;
for (const o of S.placed) if (o.doorX !== undefined && o.doorY < OH) { marca(o.doorX, o.doorY + 1, 2); anc(o.doorX, Math.min(OH - 1, o.doorY + 1)); }
for (const o of S.placed) if (o.text && o.y < OH) marca(o.x, o.y + 1, 1); // placas e móveis com texto: dá para ler
const ancReais = new Set(ancs);

// pontos de exploração: um por célula de 34x34 blocos de terra (fora de vila e mar), no bloco andável mais central
const GRADE = 42;
for (let gy = 0; gy < OH; gy += GRADE) for (let gx = 0; gx < W; gx += GRADE) {
  let melhor = -1, md = 1e9;
  for (let y = gy; y < Math.min(OH, gy + GRADE); y += 2) for (let x = gx; x < Math.min(W, gx + GRADE); x += 2) {
    const k = x + y * W; if (!walk0[k] || !LAND.has(T[k]) || bio[k] === BI.vila || bio[k] === BI.mar || rsv[k]) continue;
    const d = ((x - gx - GRADE / 2) ** 2 + (y - gy - GRADE / 2) ** 2) * 0.15 + hash(x, y, 5) * 120; if (d < md) { md = d; melhor = k; }
  }
  if (melhor >= 0) ancs.push(melhor);
}

// ---------- Dijkstra em baldes (custos inteiros pequenos), uma raiz por componente; devolve o pai de cada bloco
const comp0 = componentes(walk0, W, H).comp;
function arvore(custo) {
  const dist = new Int32Array(N).fill(0x3fffffff), par = new Int32Array(N).fill(-1), feito = new Uint8Array(N);
  const raizes = new Map(); for (const a of ancs) { const c = comp0[a]; if (c >= 0 && !raizes.has(c)) raizes.set(c, a); }
  const NB = 16, baldes = Array.from({ length: NB }, () => []);
  let n = 0; for (const r of raizes.values()) { dist[r] = 0; baldes[0].push(r); n++; }
  for (let d = 0; n > 0; d++) {
    const bk = baldes[d % NB];
    while (bk.length) {
      const k = bk.pop(); n--; if (feito[k] || dist[k] !== d) continue; feito[k] = 1;
      const x = k % W, y = (k - x) / W;
      for (let q = 0; q < 4; q++) {
        const X = x + (q === 0 ? 1 : q === 1 ? -1 : 0), Y = y + (q === 2 ? 1 : q === 3 ? -1 : 0);
        if (X < 0 || Y < 0 || X >= W || Y >= OH) continue;
        const nk = X + Y * W; if (!walk0[nk] || feito[nk]) continue;
        const nd = d + custo(nk, k); if (nd < dist[nk]) { dist[nk] = nd; par[nk] = k; baldes[nd % NB].push(nk); n++; }
      }
    }
  }
  return par;
}
// ---------- 2. rede de trilhas: árvore "gulosa" (cada âncora, da mais perto da raiz para a mais longe, liga-se ao
// ponto mais barato da rede que já existe), preferindo a trilha pronta e serpenteando por um ruído de custo
const ruidoCusto = new Uint8Array(N);
for (let y = 0; y < OH; y++) for (let x = 0; x < W; x++) { const f = fbm(x * 0.07, y * 0.07, 777); ruidoCusto[x + y * W] = Math.floor(f * f * 9); }
const custo1 = (k) => (TRILHA.has(T[k]) ? 1 : 2 + ruidoCusto[k] + (T[k] === TILE.TALL || T[k] === TILE.TALLSNOW ? 2 : 0) - (bio[k] === BI.vila ? 1 : 0));
function rede(custo, oito) {
  const par0 = arvore(custo); // só para ordenar as âncoras pela distância até a raiz
  const ordem = ancs.map((a) => { let n = 0, k = a; while (k >= 0 && n < 100000) { k = par0[k]; n++; } return [a, n]; }).sort((p, q) => p[1] - q[1]).map((p) => p[0]);
  const naRede = new Uint8Array(N), segs = [];
  const dist = new Int32Array(N).fill(0x3fffffff), par = new Int32Array(N), toc = [];
  const raizes = new Set(); for (const a of ordem) { const c = comp0[a]; if (c >= 0 && !raizes.has(c)) { raizes.add(c); naRede[a] = 1; } }
  const NB = 256, VZ = [[1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10], [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14]];
  for (const a of ordem) {
    if (naRede[a] || comp0[a] < 0) continue;
    const baldes = Array.from({ length: NB }, () => []); let n = 1, fim = -1;
    dist[a] = 0; par[a] = -1; toc.push(a); baldes[0].push(a);
    for (let d = 0; n > 0 && fim < 0; d++) {
      const bk = baldes[d % NB];
      while (bk.length) {
        const k = bk.pop(); n--; if (dist[k] !== d) continue;
        if (naRede[k]) { fim = k; break; }
        const x = k % W, y = (k - x) / W;
        for (const [dx, dy, f] of (oito ? VZ : VZ.slice(0, 4))) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= W || Y >= OH) continue;
          const nk = X + Y * W; if (!walk0[nk]) continue;
          if (dx && dy && (!walk0[x + dx + y * W] || !walk0[x + Y * W])) continue; // sem cortar quina
          const nd = d + Math.max(1, custo(nk)) * f; if (nd < dist[nk]) { if (dist[nk] === 0x3fffffff) toc.push(nk); dist[nk] = nd; par[nk] = k; baldes[nd % NB].push(nk); n++; }
        }
      }
    }
    if (fim >= 0) { const seg = []; for (let k = fim; k >= 0; k = par[k]) { seg.push(k); naRede[k] = 1; } segs.push(seg.reverse()); }
    for (const k of toc) dist[k] = 0x3fffffff; toc.length = 0;
  }
  return { segs, vis: naRede };
}
const { segs } = rede(custo1, true);
const TRILHA_DE = { campo: 'path', floresta: 'path', selva: 'path', margem: 'path', planalto: 'path', neve: 'snow', gelo: null, deserto: 'path', canion: 'path', sertao: 'path', vulcao: 'ash', praia: null, mangue: 'bridge', termal: 'path', vila: 'path', mar: null };
const NEVADO = new Set([TILE.SNOWFIELD, TILE.TALLSNOW, TILE.DEEPSNOW]);
const pintado = new Map(); // k -> nome do bloco da trilha nova
const trilhaNova = new Uint8Array(N);
// simplifica a linha (Ramer–Douglas–Peucker) e pinta com largura 2-3 e um leve tremor
function rdp(p, eps) {
  if (p.length < 3) return p;
  const [a, b] = [p[0], p[p.length - 1]]; let md = 0, mi = 0;
  for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((b[0] - a[0]) * (a[1] - p[i][1]) - (a[0] - p[i][0]) * (b[1] - a[1])) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1); if (d > md) { md = d; mi = i; } }
  return md > eps ? [...rdp(p.slice(0, mi + 1), eps).slice(0, -1), ...rdp(p.slice(mi), eps)] : [a, b];
}
for (const seg of segs) {
  const pts = seg.map((k) => [k % W, Math.floor(k / W)]);
  const novos = seg.filter((k) => !TRILHA.has(T[k]) && LAND.has(T[k])).length;
  if (novos < 3) continue;
  // linha suavizada: RDP (corta as escadinhas do caminho em grade) + Chaikin (curvas); as pontas ficam no lugar
  let lin = rdp(pts, seg.length > 12 ? 3 : 1.2);
  for (let it = 0; it < 2; it++) { const nv = [lin[0]]; for (let i = 0; i < lin.length - 1; i++) { const [a, b] = [lin[i], lin[i + 1]]; nv.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } nv.push(lin[lin.length - 1]); lin = nv; }
  const larg = seg.length > 50 ? 2.7 : 2.2;
  for (let i = 0; i < lin.length - 1; i++) {
    const [x0, y0] = lin[i], [x1, y1] = lin[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
    for (let s = 0; s <= n; s++) {
      const f = s / n; let x = x0 + (x1 - x0) * f + 0.5, y = y0 + (y1 - y0) * f + 0.5;
      x += (fbm(x * 0.06, y * 0.06, 31) - 0.5) * 2.4; y += (fbm(x * 0.06 + 7, y * 0.06, 37) - 0.5) * 2.4;
      const r = larg / 2;
      for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
        if (xx < 0 || yy < 0 || xx >= W || yy >= OH || Math.hypot(xx + 0.5 - x, yy + 0.5 - y) > r + 0.15) continue;
        const k = xx + yy * W; if (!LAND.has(T[k]) || B[k] || !walk0[k]) continue;
        let nome = TRILHA_DE[BIO[bio[k]]]; if (!nome) continue;
        if (NEVADO.has(T[k])) nome = 'snow';
        if (nome === 'bridge' && T[k] !== TILE.MANGMUD) continue; // passarela só por cima da lama
        pintado.set(k, nome); trilhaNova[k] = 1;
      }
    }
  }
}
// ---------- 3. proteção: a árvore recalculada preferindo as trilhas (as novas inclusive)
const ehTrilha = (k) => TRILHA.has(T[k]) || trilhaNova[k] === 1;
const P = rede((k) => (ehTrilha(k) ? 1 : 6 + ruidoCusto[k]), false).vis;
for (const a of ancs) P[a] = 1;

// ---------- 4. distância até a trilha (chanfro 3-4, em terços de bloco)
const D = new Uint16Array(N).fill(60000);
for (let k = 0; k < N; k++) if (ehTrilha(k) || P[k] || bio[k] === BI.vila || (rsv[k] && walk0[k])) D[k] = 0;
for (let y = 0; y < OH; y++) for (let x = 0; x < W; x++) { const k = x + y * W; let d = D[k];
  if (x > 0) d = Math.min(d, D[k - 1] + 3); if (y > 0) { d = Math.min(d, D[k - W] + 3); if (x > 0) d = Math.min(d, D[k - W - 1] + 4); if (x < W - 1) d = Math.min(d, D[k - W + 1] + 4); } D[k] = d; }
for (let y = OH - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const k = x + y * W; let d = D[k];
  if (x < W - 1) d = Math.min(d, D[k + 1] + 3); if (y < OH - 1) { d = Math.min(d, D[k + W] + 3); if (x < W - 1) d = Math.min(d, D[k + W + 1] + 4); if (x > 0) d = Math.min(d, D[k + W - 1] + 4); } D[k] = d; }
const dist = (k) => D[k] / 3;

// ---------- 5. o que cada bioma põe
// raio: meia largura do corredor (blocos); muro: o paredão; fundo: o miolo do paredão; borda: o pé do paredão;
// solto: o que fica espalhado no corredor; alto: o mato alto; chao: manchas de chão; piso: chão sob a mata; marcos.
const CFG = {
  campo: { degrau: 'degrau', um: ['moita', 'moita', 'pedrinha'], raio: 5, amp: 1.5, muro: ['tree', 'tree2', 'tree', 'autumn', 'tree2', 'pine'], fundo: ['bigtree', 'tree', 'bigautumn', 'tree2'], borda: ['cone', 'roundbush', 'boulder', 'stump', 'cone'], solto: ['boulder2', 'stump', 'log', 'grayrock'], alto: 'tall', chao: [['grass2', 0.5], ['flowers', 0.12]], piso: 'dark', marcos: ['arvoreGigante', 'fazenda', 'santuario', 'ruina', 'arcoPedra', 'fazenda'], baga: true, decor: ['mush', 'pebble'] },
  floresta: { um: ['moita', 'moita', 'samambaia'], raio: 4, amp: 1.2, muro: ['pine', 'pineT', 'tree', 'pinheiroAlto', 'pine2', 'tree2'], fundo: ['pinheiroAlto', 'bigtree', 'pineT'], borda: ['roundbush', 'stump', 'cone', 'log'], solto: ['log', 'stump', 'cogumelos', 'samambaia', 'samambaia'], alto: 'tall', chao: [['dark', 0.35], ['grass2', 0.3]], piso: 'dark', marcos: ['arvoreGigante', 'santuario', 'cachoeira'], baga: true, decor: ['mush', 'mush2'] },
  selva: { um: ['moita', 'samambaia'], raio: 4, amp: 1.2, muro: ['arvoreSelva', 'umbu', 'bambu', 'folhaGigante', 'arvoreSelva'], fundo: ['arvoreSelva', 'umbu'], borda: ['folhaGigante', 'samambaia', 'samambaia', 'bambu'], solto: ['samambaia', 'samambaia', 'folhaGigante', 'cogumelos', 'log'], alto: 'tall', chao: [['dark', 0.45], ['mangmud', 0.06]], piso: 'dark', marcos: ['arvoreGigante', 'cachoeira', 'mural'], baga: true, decor: ['mush2'] },
  neve: { degrau: 'degrauNeve', um: ['moitaNeve', 'moitaNeve', 'stalagmiteIce'], raio: 5, amp: 1.6, muro: ['snowPine', 'pinheiroNevado', 'snowPineBig', 'snowPine'], fundo: ['snowPineBig', 'pinheiroNevado'], borda: ['monteNeve', 'pedraGelo', 'monteNeve', 'galhoNevado'], solto: ['monteNeve', 'pedraGelo', 'monteNeve', 'galhoNevado', 'stalagmiteIce'], alto: 'tallsnow', chao: [['deepsnow', 0.22]], piso: null, marcos: ['lagoGelo', 'arcoPedra', 'pedraGeloAnel', 'snowman'], baga: false, decor: [] },
  gelo: { um: ['stalagmiteIce', 'pedrinha'], raio: 6, amp: 1.5, muro: ['escarpaNeve', 'stalagmiteIce'], fundo: ['escarpaNeve'], borda: ['pedraGelo', 'stalagmiteIce', 'crystal'], solto: ['pedraGelo', 'stalagmiteIce'], alto: null, chao: [], piso: null, marcos: ['crystal'], baga: false, decor: [] },
  deserto: { ralo: true, um: ['cactoBarril', 'arbustoSeco'], raio: 7, amp: 2.5, muro: ['duna', 'duna', 'duna', 'duna', 'mesa'], fundo: ['duna', 'duna', 'duna', 'mesa'], borda: ['cactus', 'cactoBarril', 'arbustoSeco', 'duna', 'boulder'], solto: ['cactus', 'cactoBarril', 'arbustoSeco', 'ossada', 'skull', 'mandacaru', 'pilarRocha'], alto: null, chao: [['cracked', 0.05]], piso: null, marcos: ['oasis', 'mesaGrupo', 'ossada', 'brokenColumn'], baga: false, decor: ['pebble'] },
  canion: { degrau: 'degrauAreia', um: ['pedrinhaVerm', 'pilarRocha'], raio: 5, amp: 1.5, muro: ['escarpaVerm', 'pilarRocha', 'escarpaVerm', 'mesa'], fundo: ['escarpaVerm', 'mesa'], borda: ['pilarRocha', 'arbustoSeco', 'cactus', 'boulder'], solto: ['arbustoSeco', 'cactoBarril', 'skull', 'boulder2'], alto: 'talldry', chao: [], piso: null, marcos: ['arcoPedra', 'mesaGrupo', 'ossada'], baga: false, decor: ['pebble'] },
  sertao: { um: ['arbustoSeco', 'cactus', 'cactoBarril'], raio: 5, amp: 1.5, muro: ['mandacaru', 'juazeiro', 'xiquexique', 'cactus', 'arbustoSeco', 'umbu'], fundo: ['juazeiro', 'umbu', 'mandacaru'], borda: ['xiquexique', 'arbustoSeco', 'cactoBarril', 'boulder', 'cactus'], solto: ['arbustoSeco', 'cactoBarril', 'skull', 'boulder2', 'xiquexique'], alto: 'talldry', chao: [['cracked', 0.1]], piso: null, marcos: ['mesaGrupo', 'santuario', 'umbu'], baga: false, decor: ['pebble'] },
  vulcao: { um: ['pedrinhaBasalto', 'pinaculo'], raio: 5, amp: 1.5, muro: ['escarpaBasalto', 'basaltoColunas', 'pinaculo', 'arvoreCinza', 'escarpaBasalto'], fundo: ['escarpaBasalto', 'basaltoColunas'], borda: ['basaltoColunas', 'lavaRock', 'arvoreCinza', 'fumarola', 'pinaculo'], solto: ['lavaRock', 'arvoreCinza', 'fumarola', 'fendaLava', 'pinaculo'], alto: null, chao: [['ash', 0.3], ['obsidian', 0.05]], piso: null, marcos: ['lagoLava', 'pinaculoGrupo', 'termas'], baga: false, decor: [] },
  termal: { um: ['pedrinhaBasalto', 'fumarola'], raio: 5, amp: 1.5, muro: ['escarpa', 'basaltoColunas', 'pinaculo'], fundo: ['escarpa'], borda: ['fumarola', 'boulder', 'basaltoColunas'], solto: ['fumarola', 'boulder2', 'lavaRock'], alto: null, chao: [['ash', 0.2]], piso: null, marcos: ['termas'], baga: false, decor: [] },
  praia: { touceira: true, um: ['palmSmall', 'pedrinha'], raio: 8, amp: 2.5, muro: ['palmeira', 'coqueiro', 'pedraMar', 'palmeira', 'palmSmall'], fundo: ['coqueiro', 'palmeira', 'pedraMar'], borda: ['pedraMar', 'driftwood', 'palmSmall', 'concha'], solto: ['concha', 'concha', 'pedraMar', 'driftwood', 'palmSmall', 'concha', 'pocaMare'], alto: null, chao: [], piso: null, marcos: ['pocaMare', 'barco', 'palmeiral', 'jangada', 'guardaSol'], baga: false, decor: ['pebble'] },
  mangue: { um: ['taboa', 'moita'], raio: 4, amp: 1.2, muro: ['mangue', 'mangue', 'palmeira', 'taboa'], fundo: ['mangue'], borda: ['taboa', 'taboa', 'driftwood', 'log'], solto: ['taboa', 'driftwood', 'stump', 'vitoriaRegia'], alto: 'reed', chao: [], piso: null, marcos: ['mangue', 'santuario'], baga: false, decor: ['mush'] },
  margem: { degrau: 'degrau', um: ['moita', 'taboa'], raio: 5, amp: 1.5, muro: ['tree2', 'tree', 'tree2', 'autumn'], fundo: ['bigtree', 'tree2'], borda: ['taboa', 'roundbush', 'cone', 'boulder'], solto: ['taboa', 'log', 'stump', 'boulder2'], alto: 'tall', chao: [['grass2', 0.4], ['flowers', 0.08]], piso: 'dark', marcos: ['santuario', 'arvoreGigante'], baga: true, decor: ['mush', 'pebble'] },
  planalto: { degrau: 'degrau', um: ['pedrinha', 'moita'], raio: 6, amp: 2.5, muro: ['escarpa', 'escarpa', 'arvoreVento', 'escarpa', 'pinheiroAlto'], fundo: ['escarpa', 'escarpa', 'pinheiroAlto'], borda: ['boulder', 'grayrock', 'arvoreVento', 'boulder2', 'moita'], solto: ['boulder', 'grayrock', 'arvoreVento', 'boulder2'], alto: 'tall', chao: [['grass2', 0.4], ['flowers', 0.05]], piso: null, marcos: ['arcoPedra', 'menhirAnel', 'arvoreVento', 'ruina'], baga: false, decor: ['pebble'] },
};
const ALTO_BASE = { tall: [TILE.GRASS, TILE.GRASS2, TILE.DARK], tallsnow: [TILE.SNOWFIELD, TILE.DEEPSNOW], talldry: [TILE.CAATINGA, TILE.CRACKED, TILE.REDROCK, TILE.GRASS], reed: [TILE.MANGMUD] };
const ITENS = ['potion', 'pokeball', 'oranBerry', 'superPotion', 'greatBall', 'repel', 'antidote', 'escapeRope'];

// ---------- geração de uma região
function gerarRegiao(reg) {
  const [rx, ry, rw, rh] = reg.rect;
  const x0 = rx, y0 = ry, x1 = Math.min(rx + rw, W), y1 = Math.min(ry + rh, OH);
  const seed = hashTxt(reg.id);
  const dentro = (x, y) => x >= x0 && y >= y0 && x < x1 && y < y1;
  const t = Uint8Array.from(T.subarray(0, N)), blk = Uint8Array.from(B.subarray(0, N));
  const out = { objects: [], decor: [], items: [], tiles: new Map() };
  const setT = (k, nome) => { const v = TILE[nome.toUpperCase()]; if (v === undefined) throw new Error('bloco ' + nome); t[k] = v; out.tiles.set(k, nome); };
  for (const [k, nome] of pintado) { const x = k % W, y = (k - x) / W; if (dentro(x, y)) setT(k, nome); }
  let naVila = false; // ligado só enquanto as cidades são vestidas
  const livre = (k) => !blk[k] && LAND.has(t[k]) && !P[k] && !rsv[k] && !ehTrilha(k) && (naVila || bio[k] !== BI.vila) && bio[k] !== BI.mar;
  const pe = (kind, x, y, extra) => {
    const K = KINDS[kind]; if (!K) { console.warn('vestir: tipo desconhecido', kind); return false; }
    const cells = [];
    for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) {
      const X = x + i, Y = y + j, k = X + Y * W;
      if (!dentro(X, Y)) return false;
      const solido = !K.solidCells || K.solidCells.some(([a, b]) => a === i && b === j);
      if (solido ? !livre(k) : (blk[k] || !LAND.has(t[k]) || ehTrilha(k) || (!naVila && bio[k] === BI.vila))) return false;
      cells.push(k);
    }
    for (const k of cells) blk[k] = 1;
    out.objects.push(extra ? { kind, x, y, ...extra } : { kind, x, y });
    return true;
  };
  const esc = (lista, x, y, s) => lista[Math.floor(hash(x, y, seed + s) * lista.length) % lista.length];
  const cfgDe = (k) => CFG[BIO[bio[k]]];
  const raio = (x, y, c) => c.raio + (fbm(x * 0.07, y * 0.07, seed + 1) - 0.5) * 2 * c.amp + (fbm(x * 0.025, y * 0.025, seed + 2) > 0.7 ? 4 : 0);

  // ----- c. clareiras com marco: um a cada ~42 blocos, perto da trilha
  const marcos = [], clareira = new Uint8Array(N);
  const abre = (x, y, r) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const X = x + i, Y = y + j; if (dentro(X, Y)) clareira[X + Y * W] = 1; } };
  const longe = (x, y, m) => marcos.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) > m);
  const conjunto = (nome, x, y) => {
    switch (nome) {
      case 'lagoGelo': case 'lagoLava': case 'oasis': case 'termas': {
        const bloco = nome === 'lagoGelo' ? 'ice' : nome === 'lagoLava' ? 'lava' : nome === 'termas' ? 'hotspring' : 'water';
        const rx2 = 3 + Math.floor(hash(x, y, seed + 90) * 3), ry2 = 2 + Math.floor(hash(x, y, seed + 91) * 2), cx = x + rx2, cy = y + ry2;
        const cel = [];
        for (let j = -ry2 - 1; j <= ry2 + 1; j++) for (let i = -rx2 - 1; i <= rx2 + 1; i++) {
          const X = cx + i, Y = cy + j, kk = X + Y * W; if (!dentro(X, Y)) return false;
          const e = (i / (rx2 + 0.5)) ** 2 + (j / (ry2 + 0.5)) ** 2 + (fbm(X * 0.4, Y * 0.4, seed + 92) - 0.5) * 0.5;
          if (e < 1) { if (!livre(kk) || dist(kk) < 2) return false; cel.push([kk, e]); }
        }
        for (const [kk, e] of cel) setT(kk, bloco === 'ice' && e > 0.7 ? 'frozen' : bloco);
        if (bloco !== 'ice') for (const [kk] of cel) blk[kk] = 1; // gelo é andável (escorrega); água, lava e fonte não
        const contorno = nome === 'lagoGelo' ? ['pedraGelo', 'monteNeve', 'stalagmiteIce'] : nome === 'lagoLava' ? ['basaltoColunas', 'pinaculo', 'lavaRock'] : nome === 'termas' ? ['boulder', 'fumarola', 'stalagmite'] : ['palmeira', 'coqueiro', 'palmeira', 'boulder'];
        for (let a = 0; a < 7; a++) { const ang = a / 7 * Math.PI * 2 + hash(x, y, seed + 93), X = Math.round(cx + Math.cos(ang) * (rx2 + 1.6)), Y = Math.round(cy + Math.sin(ang) * (ry2 + 1.4)); if (Math.sin(ang) > 0.5 && nome !== 'oasis') continue; pe(contorno[a % contorno.length], X, Y); }
        return true;
      }
      case 'mesaGrupo': if (!pe('mesa', x, y)) return false; pe('pilarRocha', x + 4, y + 1); pe('pilarRocha', x - 2, y + 1); return true;
      case 'pinaculoGrupo': if (!pe('pinaculo', x, y)) return false; pe('pinaculo', x + 2, y + 1); pe('basaltoColunas', x - 3, y); return true;
      case 'menhirAnel': case 'pedraGeloAnel': {
        const p = nome === 'menhirAnel' ? 'menhir' : 'stalagmiteIce'; let n = 0;
        for (let a = 0; a < 7; a++) { const ang = a / 7 * Math.PI * 2, X = Math.round(x + 3 + Math.cos(ang) * 3.2), Y = Math.round(y + 2 + Math.sin(ang) * 2.2); n += pe(p, X, Y) ? 1 : 0; }
        if (n >= 4) pe(nome === 'menhirAnel' ? 'altar' : 'crystal', x + 2, y + 2);
        return n >= 4;
      }
      case 'palmeiral': { let n = 0; for (let a = 0; a < 5; a++) n += pe(a % 2 ? 'coqueiro' : 'palmeira', x + Math.round(hash(x, a, seed) * 5), y + Math.round(hash(a, y, seed) * 3)) ? 1 : 0; if (n) pe('guardaSol', x + 2, y + 4); return n > 1; }
      case 'barco': if (!pe('barco', x, y)) return false; pe('redePesca', x + 4, y); return true;
      case 'fazenda': {
        // lavoura cercada (9x6) com canteiros em fileira, espantalho, porteira embaixo; celeiro ou moinho ao lado
        const fw = 9, fh = 6;
        for (let j = -1; j <= fh; j++) for (let i = -1; i <= fw + 5; i++) { const X = x + i, Y = y + j; if (!dentro(X, Y) || !livre(X + Y * W)) return false; }
        for (let i = 0; i < fw; i++) { pe('cercaVara', x + i, y); if (i < 3 || i > 5) pe('cercaVara', x + i, y + fh - 1); }
        for (let j = 1; j < fh - 1; j++) { pe('fenceV', x, y + j); pe('fenceV', x + fw - 1, y + j); }
        for (let j = 1; j < fh - 2; j++) for (let i = 1; i < fw - 1; i++) if (i !== 4) pe('horta', x + i, y + j);
        pe('espantalho', x + 4, y + 2);
        if (hash(x, y, seed + 97) < 0.5) pe('celeiro', x + fw + 1, y + 1); else pe('windmill', x + fw + 1, y + 2);
        return true;
      }
      default: return pe(nome, x, y);
    }
  };
  for (let y = y0 + 2; y < y1 - 8; y += 3) for (let x = x0 + 2; x < x1 - 8; x += 3) {
    const k = x + y * W; if (!livre(k) || semArv[k]) continue;
    const c = cfgDe(k); if (!c || !c.marcos.length) continue;
    const d = dist(k); if (d < 2.5 || d > Math.min(c.raio + 4, 10)) continue;
    if (!longe(x, y, 42) || hash(x, y, seed + 95) > 0.35) continue;
    const nome = esc(c.marcos, x >> 4, y >> 4, 96);
    const n0 = out.objects.length;
    if (conjunto(nome, x, y)) { marcos.push([x, y]); abre(x + 3, y + 2, 6); for (const o of out.objects.slice(n0)) abre(o.x, o.y, 2); }
  }

  // ----- a. paredões: de norte a sul, linha a linha; peças de 2 blocos começam em casa par numa linha e ímpar na
  // seguinte (tijolo), as sobras viram peças de 1 bloco: a parede fica fechada, sem buraco para entrar
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = x + y * W; if (!livre(k)) continue;
    const c = cfgDe(k); if (!c || !c.muro.length) continue;
    const prof = dist(k) - raio(x, y, c); if (prof <= 0 || clareira[k] || semArv[k]) continue;
    if (c.piso && prof > 0.5) setT(k, c.piso);
    // vulcão: rios de lava serpenteando por dentro do paredão (acendem à noite)
    if (bio[k] === BI.vulcao && prof > 1.5 && Math.abs(fbm(x * 0.05, y * 0.05, seed + 44) - 0.5) < 0.035) { setT(k, 'lava'); blk[k] = 1; continue; }
    // mata e selva: riachos serpenteando por dentro da mata
    if ((bio[k] === BI.floresta || bio[k] === BI.selva) && prof > 1 && Math.abs(fbm(x * 0.045, y * 0.045, seed + 46) - 0.5) < 0.028) { setT(k, 'water'); blk[k] = 1; continue; }
    // miolo (longe da trilha, só aparece na beira da tela ou voando): em grade mais aberta, para poupar memória e
    // triângulos; a frente do paredão (até 5 blocos) é fechada, então não dá para entrar nele
    if (prof > 4 && (y & 1)) continue;
    if (prof > 7 && ((x % 3) || hash(x, y, seed + 40) < 0.35)) continue;
    // deserto: dunas soltas numa grade torta (não em fileira), o chão vira duna; o resto do paredão é areia ondulada
    if (c.ralo) { if (t[k] === TILE.SAND || t[k] === TILE.CAATINGA) setT(k, 'dune'); if ((x + (y >> 1) * 2) % 3 || (y & 1) || hash(x, y, seed + 45) < 0.2) continue; }
    let lista = prof < 1.4 ? c.borda : prof > 4 ? c.fundo : c.muro;
    if (!lista.length) lista = c.muro;
    const kind = esc(lista, x, y, 41 + (y & 1)), K = KINDS[kind];
    if ((K?.fw ?? 1) >= 2 && ((x + y) & 1) && livre(k + 1)) continue; // a próxima casa começa a peça
    if (!pe(kind, x, y) && prof < 4 && c.um) pe(esc(c.um, x, y, 43), x, y);
  }

  // ----- b. corredor: mato alto em blocos, borda, solto, manchas de chão, decoração
  const usado = new Uint8Array(N);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const k = x + y * W; if (!livre(k) || usado[k]) continue;
    const c = cfgDe(k); if (!c) continue;
    const d = dist(k), r = raio(x, y, c);
    // mato alto: blocos retangulares de cantos cortados (4x3 a 8x5), entre a trilha e o paredão
    if (c.alto && d >= 2 && d < Math.min(r, 12) - 0.5 && hash(x >> 3, y >> 3, seed + 50) < 0.55 && hash(x, y, seed + 51) < 0.035) {
      const bw = 4 + Math.floor(hash(x, y, seed + 52) * 5), bh = 3 + Math.floor(hash(x, y, seed + 53) * 3);
      for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
        const X = x + i, Y = y + j, kk = X + Y * W;
        if (!dentro(X, Y) || usado[kk]) continue;
        if ((i === 0 || i === bw - 1) && (j === 0 || j === bh - 1)) continue;
        if (!livre(kk) || dist(kk) < 1.5 || dist(kk) > raio(X, Y, c) - 0.3) continue;
        if (!ALTO_BASE[c.alto].includes(t[kk])) continue;
        setT(kk, c.alto); usado[kk] = 1;
      }
      continue;
    }
    // degraus (ledges): fila de 4 a 10 blocos saindo do paredão em direção à trilha, sem chegar nela
    if (c.degrau && d >= r - 1.2 && d <= r && hash(x >> 2, y >> 2, seed + 56) < 0.18 && hash(x, y, seed + 57) < 0.25) {
      const dir = dist(k + 1) < dist(k - 1) ? 1 : -1, fila = [];
      for (let i = 0; i < 10; i++) { const X = x + i * dir, kk = X + y * W; if (!dentro(X, y) || !livre(kk) || usado[kk] || dist(kk) < 2.5) break; fila.push(X); }
      if (fila.length >= 4) { for (const X of fila) { pe(c.degrau, X, y); usado[X + y * W] = 1; } continue; }
    }
    if (d >= r - 1.6 && d <= r && c.borda.length && hash(x, y, seed + 60) < 0.22) { if (pe(esc(c.borda, x, y, 61), x, y)) continue; }
    if (d >= 2.2 && d < Math.min(r, 14) - 1 && c.solto.length && hash(x, y, seed + 62) < (c.touceira ? 0.045 : 0.022)) {
      const kind = esc(c.solto, x, y, 63);
      if (pe(kind, x, y)) {
        // praia: palmeira puxa outras em volta (touceira), pedra puxa pedras e conchas
        if (c.touceira && (kind === 'palmeira' || kind === 'coqueiro' || kind === 'pedraMar')) for (let a = 0; a < 4; a++) { const X = x + Math.round((hash(x, a, seed + 64) - 0.5) * 6), Y = y + Math.round((hash(a, y, seed + 65) - 0.5) * 4); if (dist(X + Y * W) >= 2) pe(a % 2 ? kind : (kind === 'pedraMar' ? 'concha' : 'palmSmall'), X, Y); }
        continue;
      }
    }
    for (const [nome, p] of c.chao) {
      if (p > 0 && fbm(x * 0.18, y * 0.18, seed + 70 + nome.length) > 1 - p * 0.9) { if (nome !== 'deepsnow' || d > 1.5) setT(k, nome); break; }
    }
    if (c.decor.length && d >= 1.5 && hash(x, y, seed + 80) < 0.02) out.decor.push({ kind: esc(c.decor, x, y, 81), x, y });
  }
  // vitórias-régias e juncos na água parada junto da margem
  for (let y = Math.max(1, y0); y < Math.min(y1, OH - 1); y++) for (let x = Math.max(1, x0); x < Math.min(x1, W - 1); x++) {
    const k = x + y * W; if ((t[k] !== TILE.WATER && t[k] !== TILE.SHALLOW) || blk[k] || rsv[k] || P[k]) continue;
    const ai = lab[k], ab = ai >= 0 ? R.areas[ai].biome : null; if (ab !== 'margem' && ab !== 'mangue' && ab !== 'floresta' && ab !== 'selva') continue;
    let terra = false; for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (LAND.has(t[k + i + j * W])) terra = true;
    if (!terra || hash(x, y, seed + 85) > 0.12) continue;
    blk[k] = 1; out.objects.push({ kind: t[k] === TILE.SHALLOW && hash(x, y, seed + 86) < 0.5 ? 'taboa' : 'vitoriaRegia', x, y });
  }
  // praia: linha de onda (areia molhada) junto da água
  for (let y = Math.max(1, y0); y < Math.min(y1, OH - 1); y++) for (let x = Math.max(1, x0); x < Math.min(x1, W - 1); x++) {
    const k = x + y * W; if (t[k] !== TILE.SAND || blk[k]) continue;
    let agua = false; for (let j = -1; j <= 1 && !agua; j++) for (let i = -1; i <= 1; i++) { const q = t[k + i + j * W]; if (q === TILE.WATER || q === TILE.DEEP || q === TILE.TIDE) { agua = true; break; } }
    if (agua) setT(k, 'wetsand');
  }

  // ----- d. nichos junto do paredão: árvore de baga ou item à vista, a cada ~60 blocos de trilha
  const nichos = [];
  for (let y = y0 + 2; y < y1 - 3; y++) for (let x = x0 + 2; x < x1 - 3; x++) {
    const k = x + y * W; const c = cfgDe(k); if (!c || !c.muro.length) continue;
    if (!walk0[k] || !(ehTrilha(k) || P[k])) continue;
    if (hash(x, y, seed + 100) > 0.02 || !nichos.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) > 60)) continue;
    const ang = hash(x, y, seed + 101) * Math.PI * 2;
    const X = Math.round(x + Math.cos(ang) * 4), Y = Math.round(y + Math.sin(ang) * 4), kk = X + Y * W;
    if (!dentro(X, Y) || blk[kk] || !LAND.has(t[kk]) || ehTrilha(kk) || P[kk]) continue;
    if (c.baga && hash(X, Y, seed + 102) < 0.5 && pe(hash(X, Y, seed + 103) < 0.5 ? 'oran' : 'pecha', X, Y)) { nichos.push([x, y]); continue; }
    if (!rsv[kk] && !blk[kk]) { out.items.push({ x: X, y: Y, item: ITENS[Math.floor(hash(X, Y, seed + 104) * ITENS.length)], n: 1 }); nichos.push([x, y]); }
  }

  // ----- e. placas nos cruzamentos de trilha (3 ou mais saídas), com o nome da área
  const placas = [];
  for (let y = y0 + 3; y < y1 - 3; y++) for (let x = x0 + 3; x < x1 - 3; x++) {
    const k = x + y * W; if (!ehTrilha(k) || T[k] === TILE.PLAZA || bio[k] === BI.vila) continue;
    if (!placas.every(([a, b]) => Math.abs(a - x) + Math.abs(b - y) > 50)) continue;
    let trechos = 0, ant = null;
    for (let a = 0; a <= 24; a++) { const g = a / 24 * Math.PI * 2, X = Math.round(x + Math.cos(g) * 3), Y = Math.round(y + Math.sin(g) * 3), q = ehTrilha(X + Y * W) ? 1 : 0; if (ant === 0 && q === 1) trechos++; ant = q; }
    if (trechos < 3) continue;
    const ai = lab[k]; const nome = ai >= 0 ? R.areas[ai].name : null; if (!nome) continue;
    for (const [dx, dy] of [[2, -2], [-2, -2], [2, 2], [-2, 2], [3, 0], [-3, 0]]) {
      const X = x + dx, Y = y + dy; if (!dentro(X, Y)) continue;
      if (pe('sign', X, Y, { text: nome })) { placas.push([x, y]); break; }
    }
  }

  // ----- f. cidades
  naVila = true;
  vestirCidades(reg, { t, blk, dentro, pe, setT, livre, seed, out });
  naVila = false;

  const tilesOut = {};
  for (const [k, nome] of out.tiles) (tilesOut[nome] ??= []).push(k % W, Math.floor(k / W));
  return { tiles: Object.entries(tilesOut).map(([nome, xy]) => ({ t: nome, xy })), objects: out.objects, decor: out.decor, items: out.items };
}

// ---------- cidades: praça com chafariz, bancos e postes, canteiros, cercas de quintal, tema da cidade
function vestirCidades(reg, { t, blk, dentro, pe, setT, livre, seed, out }) {
  const [rx, ry, rw, rh] = reg.rect;
  const vilas = R.areas.filter((a) => a.rect && a.biome === 'vila' && a.rect[0] < rx + rw && a.rect[0] + a.rect[2] > rx && a.rect[1] < ry + rh && a.rect[1] + a.rect[3] > ry);
  const feitas = new Set();
  for (const a of vilas) {
    const chave = a.rect.join(); if (feitas.has(chave)) continue; feitas.add(chave);
    const [ax, ay, aw, ah] = a.rect;
    const X0 = Math.max(ax, rx), Y0 = Math.max(ay, ry), X1 = Math.min(ax + aw, rx + rw, W), Y1 = Math.min(ay + ah, ry + rh, OH);
    // tema pelo entorno: chão predominante e presença de cais
    let neve = 0, areia = 0, cinza = 0, seco = 0, cais = 0;
    let verde = 0;
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const q = T[x + y * W]; if (VERDE.has(q)) verde++; if (q === TILE.SNOWFIELD || q === TILE.SNOW || q === TILE.TALLSNOW) neve++; else if (q === TILE.SAND || q === TILE.WETSAND) areia++; else if (q === TILE.BASALT || q === TILE.ASH || q === TILE.HOTSPRING) cinza++; else if (q === TILE.CAATINGA || q === TILE.DUNE || q === TILE.CRACKED) seco++; else if (q === TILE.DOCK) cais++; }
    const n0 = out.objects.length;
    const tema = cinza > 40 ? 'termas' : neve > verde && neve > 40 ? 'neve' : cais > 4 || areia > verde ? 'porto' : seco > verde ? 'sertao' : 'campo';
    const pePraca = (kind, x, y) => {
      const K = KINDS[kind]; for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) { const k = x + i + (y + j) * W; if (!dentro(x + i, y + j) || blk[k] || P[k] || rsv[k] || t[k] !== TILE.PLAZA) return false; }
      for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) blk[x + i + (y + j) * W] = 1;
      out.objects.push({ kind, x, y }); return true;
    };
    // praça: chafariz no meio se couber; postes e bancos na borda
    const praca = []; for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) if (t[x + y * W] === TILE.PLAZA) praca.push([x, y]);
    if (praca.length > 30) {
      const cx = Math.round(praca.reduce((s, p) => s + p[0], 0) / praca.length), cy = Math.round(praca.reduce((s, p) => s + p[1], 0) / praca.length);
      let ok = false;
      for (let r = 0; r <= 3 && !ok; r++) for (let j = -r; j <= r && !ok; j++) for (let i = -r; i <= r && !ok; i++) ok = pePraca('fonte', cx - 1 + i, cy - 1 + j);
      if (!ok) for (let r = 0; r <= 2 && !ok; r++) for (let j = -r; j <= r && !ok; j++) for (let i = -r; i <= r && !ok; i++) ok = pePraca(tema === 'neve' ? 'lanternaPedra' : 'well', cx + i, cy + j);
      let nb = 0, np = 0;
      for (const [x, y] of praca) {
        const k = x + y * W, borda = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([i, j]) => t[k + i + j * W] !== TILE.PLAZA);
        if (!borda) continue;
        if (np < 6 && hash(x, y, seed + 200) < 0.12 && pePraca(tema === 'neve' ? 'lanternaPedra' : 'lamp', x, y)) { np++; continue; }
        if (nb < 4 && hash(x, y, seed + 201) < 0.08 && pePraca('bench', x, y)) nb++;
      }
    }
    // casas: canteiro (ou monte de neve, cacto) de cada lado da porta; cerca descendo dos cantos da frente
    const casas = S.placed.filter((o) => o.doorX !== undefined && o.x >= X0 - 2 && o.x < X1 && o.y >= Y0 - 2 && o.y < Y1 && o.y < OH);
    for (const o of casas) {
      const fy = o.y + o.fh;
      for (const x of [o.x, o.x + o.fw - 2]) {
        if (Math.abs(x - o.doorX) < 2 || Math.abs(x + 1 - o.doorX) < 2) continue;
        if (!pe(tema === 'neve' ? 'monteNeve' : tema === 'sertao' ? 'cactoBarril' : 'canteiro', x, fy) && tema !== 'neve') { const k = x + fy * W; if (livre(k) && VERDE.has(t[k])) setT(k, 'flowers'); }
      }
      if (tema === 'campo' || tema === 'sertao') for (const x of [o.x - 1, o.x + o.fw]) {
        const cel = [];
        for (let j = -1; j < 3; j++) { const y = o.y + o.fh - 1 + j, k = x + y * W; if (!dentro(x, y) || !livre(k)) { cel.length = 0; break; } cel.push(y); }
        for (const y of cel) pe(tema === 'sertao' ? 'cercaVara' : 'fenceV', x, y);
      }
    }
    // a cidade toda: postes espaçados ao longo das trilhas, anel de flores em volta da praça, barracas de feira,
    // faixa de flores na beira da cidade e o enfeite do tema
    const postes = [], perto = (L, x, y, d) => L.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < d);
    const viz4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let barracas = 0;
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) {
      const k = x + y * W; if (!livre(k)) continue;
      const juntoTrilha = viz4.some(([i, j]) => TRILHA.has(t[k + i + j * W]));
      const juntoPraca = [-1, 0, 1].some((j) => [-1, 0, 1].some((i) => t[k + i + j * W] === TILE.PLAZA));
      if (juntoTrilha && !perto(postes, x, y, 7) && hash(x, y, seed + 210) < 0.5) { if (pe(tema === 'neve' ? 'lanternaPedra' : tema === 'termas' ? 'lampiao' : 'lamp', x, y)) { postes.push([x, y]); continue; } }
      if (juntoPraca && barracas < 2 && praca.length > 30 && tema !== 'neve' && hash(x, y, seed + 214) < 0.15 && pe('barraca', x, y)) { barracas++; continue; }
      if (juntoPraca && tema !== 'neve' && tema !== 'termas') { if (hash(x, y, seed + 215) < 0.35 && pe('canteiro', x, y)) continue; if (VERDE.has(t[k])) { setT(k, 'flowers'); continue; } }
      if (juntoPraca && (tema === 'neve' || tema === 'termas') && hash(x, y, seed + 217) < 0.25 && pe(tema === 'neve' ? 'monteNeve' : 'boulder', x, y)) continue;
      // árvore de sombra no gramado (longe das trilhas e das portas)
      if (!juntoTrilha && !juntoPraca && hash(x, y, seed + 218) < 0.012) { const arv = { campo: 'tree2', porto: 'palmeira', neve: 'snowPine', termas: 'arvoreCinza', sertao: 'juazeiro' }[tema]; let ok = true; for (let j = -1; j <= 2 && ok; j++) for (let i = -1; i <= 3; i++) { const q = k + i + j * W; if (TRILHA.has(t[q]) || rsv[q]) { ok = false; break; } } if (ok && pe(arv, x, y)) continue; }
      const beira = x - ax < 2 || ax + aw - 1 - x < 2 || y - ay < 2 || ay + ah - 1 - y < 2;
      if (beira && VERDE.has(t[k]) && tema !== 'neve' && fbm(x * 0.35, y * 0.35, seed + 216) > 0.42) { setT(k, 'flowers'); continue; }
      if (tema !== 'neve' && tema !== 'termas' && VERDE.has(t[k]) && fbm(x * 0.3, y * 0.3, seed + 211) > 0.72) setT(k, 'flowers');
      // neve: montes de neve varrida na beira das ruas
      if (tema === 'neve' && juntoTrilha && hash(x, y, seed + 219) < 0.16 && pe('monteNeve', x, y)) continue;
      if (hash(x, y, seed + 212) < 0.03) {
        const enfeite = { campo: ['flowerpot', 'horta', 'mailbox', 'canteiro', 'moita'], porto: ['caixotes', 'crate', 'redePesca', 'crate', 'guardaSol'], neve: ['monteNeve', 'snowman', 'monteNeve', 'moitaNeve', 'pedraGelo'], termas: ['fumarola', 'caixotes', 'lanternaPedra', 'boulder'], sertao: ['cactoBarril', 'xiquexique', 'flowerpot', 'caixotes'] }[tema];
        pe(enfeite[Math.floor(hash(x, y, seed + 213) * enfeite.length)], x, y);
      }
    }
    // tema forte: horta com espantalho (campo), barco e redes (porto), poço de água quente (termas)
    if (tema === 'campo' || tema === 'porto' || tema === 'termas') {
      for (let tent = 0; tent < 400; tent++) {
        const x = X0 + Math.floor(hash(tent, 1, seed + 220) * Math.max(1, X1 - X0 - 6)), y = Y0 + Math.floor(hash(tent, 2, seed + 221) * Math.max(1, Y1 - Y0 - 4));
        let ok = true; for (let j = 0; j < 4 && ok; j++) for (let i = 0; i < 6; i++) if (!dentro(x + i, y + j) || !livre(x + i + (y + j) * W)) { ok = false; break; }
        if (!ok) continue;
        if (tema === 'campo') { for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) pe('horta', x + i, y + j); pe('espantalho', x + 5, y + 1); }
        else if (tema === 'porto') { pe('barco', x, y + 1); pe('redePesca', x + 3, y); pe('caixotes', x + 4, y + 2); }
        else { for (let j = 0; j < 3; j++) for (let i = 1; i < 5; i++) { setT(x + i + (y + j) * W, 'hotspring'); blk[x + i + (y + j) * W] = 1; } for (const [i, j] of [[0, 0], [5, 0], [0, 2], [5, 2], [2, 3]]) pe(j === 3 ? 'fumarola' : 'boulder', x + i, y + j); }
        break;
      }
    }
    if (process.env.DEBUG) { let nl = 0, nr = 0, np = 0, nb = 0; for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { const k = x + y * W; if (livre(k)) nl++; if (rsv[k]) nr++; if (P[k]) np++; if (blk[k]) nb++; } console.log('cidade', a.name, tema, out.objects.length - n0, 'livres', nl, 'rsv', nr, 'P', np, 'blk', nb, (X1 - X0) * (Y1 - Y0)); }
  }
}

// ---------- escrita e verificação
function gravar(id, V) {
  const url = new URL(`${id}.json`, VEST);
  const dados = { regiao: id, comment: 'Camada vestir: enfeite gerado por tools/vestir.mjs (não editar à mão; regere com node tools/vestir.mjs ' + id + ').', ...V };
  writeFileSync(url, JSON.stringify(dados) + '\n');
  console.log(`gravado: assets/maps/vestir/${id}.json (${V.objects.length} objetos, ${V.decor.length} decor, ${V.items.length} itens, ${V.tiles.reduce((s, t) => s + t.xy.length / 2, 0)} blocos)`);
}

async function verificarTudo() {
  const C = await carregarMundo('alvorada', { semVestir: false });
  const walk = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) walk[k] = SOLID.has(C.S.tiles[k]) || C.S.block[k] ? 0 : 1;
  const comp = componentes(walk, W, H).comp, erros = [];
  const porComp = new Map();
  for (const a of ancReais) { const cb = comp0[a]; if (cb < 0) continue; if (!porComp.has(cb)) porComp.set(cb, new Map()); const m = porComp.get(cb); m.set(comp[a], (m.get(comp[a]) ?? 0) + 1); }
  let quebrados = 0;
  for (const [cb, m] of porComp) if (m.size > 1) { quebrados++; erros.push(`grupo ${cb}: âncoras separadas em ${[...m.entries()].map(([c, n]) => `${c}(${n})`).join(', ')}`); }
  let sol = 0;
  for (let k = 0; k < N; k++) if (C.S.block[k] && !B[k] && rsv[k]) { sol++; if (sol < 6) erros.push(`sólido em reservado: ${k % W},${Math.floor(k / W)}`); }
  for (const w of R.warps) if (!w.mundo && w.y < OH && !walk[w.x + w.y * W]) erros.push(`passagem bloqueada em ${w.x},${w.y}`);
  return { erros, grupos: porComp.size, quebrados, reservadosOk: sol === 0 };
}

if (verificar) {
  const r = await verificarTudo();
  console.log(`conectividade: ${r.grupos} grupos de âncoras (${ancReais.size} âncoras: passagens, pontos, portas, NPCs, itens, tocas), ${r.quebrados} quebrado(s)`);
  console.log(`reservados: ${r.reservadosOk ? 'ok' : 'FALHOU'}`);
  if (r.erros.length) { console.log('erros:', r.erros.slice(0, 20)); process.exitCode = 1; } else console.log('verificação: ok');
} else {
  const alvo = REGIOES.filter((id) => !pedidas.length || pedidas.includes(id));
  for (const id of alvo) {
    const reg = R.regioes.find((r) => r.id === id);
    if (!reg) { console.log('região desconhecida (ignorada):', id); continue; }
    gravar(id, gerarRegiao(reg));
  }
}
