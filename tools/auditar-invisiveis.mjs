// Auditoria de barreira invisível (sem Chrome): para o mundo todo, lista cada bloco SÓLIDO (objeto, tile sólido, bloco
// bloqueado, barreira da história) que NÃO tem nada visível desenhado em cima no estilo Let's Go (src/visual3d/letsgo/).
// Usa o motor de verdade (build.js, mundos.js, a camada vestir) e os MESMOS modelos lisos do jogo (letsgo/modelos-todos.js),
// medindo onde a malha de cada modelo cai no chão (amostras de 2 px de cada triângulo, vistas de cima).
//
// Um bloco sólido está "marcado" quando alguma malha desenhada (objeto sólido ou de enfeite, árvore de mata densa, peça
// de barreira) cobre pelo menos COBRE_MIN das 16 células (4x4 px) dele com altura >= ALTURA_MIN, ou quando o próprio chão o marca
// (água, penhasco, parede, rocha, lava, lama, trepadeira, milharal: material e relevo próprios).
// Só a MATA (TILE.FOREST) é chão de grama no Let's Go: sem árvore em cima ela parece caminhável (é o clássico "muro invisível").
//
// Verificações:
//   1. por tipo de objeto sólido: o modelo liso existe, tem triângulos, tamanho razoável e cobre a pegada dele;
//   2. por bloco: objeto sólido sem malha em cima, mata sem árvore/arbusto, bloco bloqueado sem dono, barreira sem peça;
//   3. tipos de bem pequeno (seixo, flor, concha, espuma) que bloqueiam: devem ser sem pegada sólida.
// Uso: node tools/auditar-invisiveis.mjs [--detalhe] [--mundo=alvorada] [--caixa=x0,y0,x1,y1]    (sai com 1 se achar algo)
// Precisa de uma cópia do three.js (só a geometria, sem WebGL): THREE_JS=/caminho/three.module.js, ou um dos locais abaixo.
import { register } from 'node:module';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const args = process.argv.slice(2), detalhe = args.includes('--detalhe');
const soMundo = args.find((a) => a.startsWith('--mundo='))?.slice(8);
const caixa = args.find((a) => a.startsWith('--caixa='))?.slice(8).split(',').map(Number); // x0,y0,x1,y1: o detalhe só dessa janela

const THREE = [process.env.THREE_JS, join(RAIZ, 'tools/vendor/three.module.js'), join(RAIZ, 'node_modules/three/build/three.module.js'),
  join(homedir(), 'Documents/Codex/casa-3d/vendor/three.module.js'), join(homedir(), 'Documents/Codex/casa-3d-profissional/vendor/package/build/three.module.js')].find((p) => p && existsSync(p));
if (!THREE) { console.error('three.js não achado: aponte THREE_JS=/caminho/three.module.js'); process.exit(2); }
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) { if (s === 'three') return { url: ${JSON.stringify(pathToFileURL(THREE).href)}, shortCircuit: true, format: 'module' }; return n(s, c); }`));
globalThis.location ??= { search: '' };

const { carregarMundo, TILE, SOLID } = await abrir('tools/vestir/mundo.mjs');
const { KINDS } = await abrir('src/world/objects.js');
const { MUNDOS } = await abrir('src/world/mundos.js');
const { kit } = await abrir('src/visual3d/kit/index.js');
const LG = await abrir('src/visual3d/letsgo/modelos-todos.js');
const { perfilCoral } = await abrir('src/visual3d/letsgo/modelos-coral.js');
const { BARREIRAS, TEMPESTADES, NEVOAS, ativa } = await abrir('src/world/barreiras-dados.js');
const { montarCenario, classe } = await abrir('src/world/barreiras-cenario.js');

// ---------- limites (px de mundo; um bloco = 16)
const COBRE_MIN = 3;     // das 16 células de 4x4 px de um bloco, quantas precisam ter malha em cima (uma cerca fina ocupa 4)
const COBRE_MATA = 6;    // a mata é chão de grama: a ponta da copa de uma árvore vizinha não basta, tem de cobrir ~40 % do bloco
const ALTURA_MIN = 5;    // a malha tem de subir pelo menos isto
const NOME_TILE = Object.fromEntries(Object.entries(TILE).map(([k, v]) => [v, k]));
// tiles sólidos cujo chão já se mostra como barreira (material próprio, parede com relevo ou água); a mata não está aqui
const MARCA_SOZINHO = new Set(['WATER', 'DEEP', 'CUR_E', 'CUR_W', 'CUR_N', 'CUR_S', 'LAVA', 'CLIFF', 'VOID', 'WALL', 'ROCK', 'ICEWALL', 'LAVAWALL', 'CANYON',
  'TEMPLEWALL', 'CRYSTALWALL', 'MUD', 'ROOTS', 'CLIMB', 'CORN'].map((n) => TILE[n]));
// bem pequeno por natureza: se bloqueia, é bug (o jogador não enxerga o que o trava)
const MIUDO = /^(pedrinha|seixo|flor|concha|espuma|graveto|samambaia|vitoriaRegia|pocaMare|cogumelos)/i;

// ---------- amostras de cada malha (cache por chave do modelo)
const amostras = new Map();
let mundoAtual = '', tilePintado=()=>-1;
function malhaDe(kind, o) {
  const md = (LG.temModeloLG(kind) && LG.modeloLG(kind, LG.opcoesPintadas(kind,o,tilePintado), perfilCoral({id:mundoAtual},{...o,kind}))) || (kit.temModelo(kind) && kit.modelo(kind, o));
  if (!md) return null;
  let a = amostras.get(md.chave); if (a) return a;
  const g = md.geometry, P = g.attributes.position, I = g.index, nt = I ? I.count / 3 : P.count / 3, pts = [];
  const v = (i) => { const k = I ? I.getX(i) : i; return [P.getX(k), P.getY(k), P.getZ(k)]; };
  for (let t = 0; t < nt; t++) {
    const pin = g.attributes.aPintura;
    if (pin) { const k=I?I.getX(t*3):t*3; if(pin.getZ(k)>0.5&&(pin.getZ(k)<2.5||(pin.getZ(k)>10.5&&pin.getZ(k)<12.5)))continue; }
    const A = v(t * 3), B = v(t * 3 + 1), C = v(t * 3 + 2);
    const x0 = Math.min(A[0], B[0], C[0]), x1 = Math.max(A[0], B[0], C[0]), z0 = Math.min(A[2], B[2], C[2]), z1 = Math.max(A[2], B[2], C[2]);
    const den = (B[2] - C[2]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[2] - C[2]);
    for (let x = Math.ceil(x0 / 2) * 2 + 1; x <= x1 + 1e-6; x += 2) for (let z = Math.ceil(z0 / 2) * 2 + 1; z <= z1 + 1e-6; z += 2) {
      let u = 0.5, w = 0.5;
      if (Math.abs(den) > 1e-9) { u = ((B[2] - C[2]) * (x - C[0]) + (C[0] - B[0]) * (z - C[2])) / den; w = ((C[2] - A[2]) * (x - C[0]) + (A[0] - C[0]) * (z - C[2])) / den; }
      if (u < -1e-6 || w < -1e-6 || u + w > 1 + 1e-6) continue;
      pts.push(x, z, u * A[1] + w * B[1] + (1 - u - w) * C[1]);
    }
    // arestas (faces verticais viram uma risca fina, que a grade de 2 px perde)
    for (const [P1, P2] of [[A, B], [B, C], [C, A]]) {
      const n = Math.max(1, Math.ceil(Math.hypot(P2[0] - P1[0], P2[2] - P1[2]) / 2));
      for (let i = 0; i <= n; i++) { const f = i / n; pts.push(P1[0] + (P2[0] - P1[0]) * f, P1[2] + (P2[2] - P1[2]) * f, P1[1] + (P2[1] - P1[1]) * f); }
    }
  }
  g.computeBoundingBox();
  a = { pts: Float32Array.from(pts), bb: g.boundingBox, tris: nt, chave: md.chave };
  amostras.set(md.chave, a);
  return a;
}

// ---------- uma passada num mundo
async function auditar(id) {
  mundoAtual = id;
  const M = await carregarMundo(id), { R, S, W, H, OH } = M;
  tilePintado=(x,y)=>x>=0&&y>=0&&x<W&&y<H?S.tiles[x+y*W]:-1;
  const placed = [...S.placed, ...(S.novos ?? [])];
  const cover = new Uint16Array(W * H);   // máscara por bloco: 16 células de 4x4 px com malha em cima (altura >= ALTURA_MIN)
  const pop = (m) => { let n = 0; for (; m; m &= m - 1) n++; return n; };
  const dono = new Map();                 // bloco -> tipos que o cobrem (só para o detalhe)
  const marcar = (a, fx, fz, tipo) => {
    const P = a.pts;
    for (let i = 0; i < P.length; i += 3) {
      if (P[i + 2] < ALTURA_MIN) continue;
      const X = fx + P[i], Z = fz + P[i + 1], tx = Math.floor(X / 16), ty = Math.floor(Z / 16);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      cover[tx + ty * W] |= 1 << ((Math.floor((X - tx * 16) / 4) & 3) + 4 * (Math.floor((Z - ty * 16) / 4) & 3));
      if (detalhe) { const k = tx + ty * W; let s = dono.get(k); if (!s) dono.set(k, (s = new Set())); s.add(tipo); }
    }
  };
  const achados = [];
  const areaDe = (x, y) => {
    for (const a of R.areas ?? []) {
      if (a.rect && x >= a.rect[0] && y >= a.rect[1] && x < a.rect[0] + a.rect[2] && y < a.rect[1] + a.rect[3]) return a.name ?? a.id ?? '?';
      if (a.ellipse && ((x - a.ellipse[0]) / a.ellipse[2]) ** 2 + ((y - a.ellipse[1]) / a.ellipse[3]) ** 2 <= 1) return a.name ?? a.id ?? '?';
    }
    return R.regioes?.find((r) => x >= r.rect[0] && y >= r.rect[1] && x < r.rect[0] + r.rect[2] && y < r.rect[1] + r.rect[3])?.id ?? '(fora de área)';
  };
  const acha = (tipo, nome, x, y, motivo) => achados.push({ tipo, nome, x, y, area: areaDe(x, y), motivo });

  // 1. tipos de objeto: modelo existe, tem forma e cobre a pegada
  const tipos = new Map();
  for (const o of placed) { const t = tipos.get(o.kind) ?? { n: 0, solidos: 0, ex: o }; t.n++; t.solidos += o.cells?.length ?? 0; tipos.set(o.kind, t); }
  const nomeDoTipo = new Map();
  for (const [kind, t] of tipos) {
    const K = KINDS[kind], o = { ...t.ex, tx: t.ex.x, ty: t.ex.y };
    if (!t.solidos) continue; // sem pegada sólida: não trava ninguém
    const a = malhaDe(kind, o);
    const ex = [t.ex.x, t.ex.y];
    if (!a) { acha('tipo sólido sem modelo', kind, ex[0], ex[1], `${t.solidos} bloco(s), sem modelo liso nem do kit: só sobra o sprite 2D`); continue; }
    if (!a.tris) { acha('tipo sólido com modelo vazio', kind, ex[0], ex[1], `${t.solidos} bloco(s), modelo sem triângulos`); continue; }
    const larg = a.bb.max.x - a.bb.min.x, prof = a.bb.max.z - a.bb.min.z, alt = a.bb.max.y;
    nomeDoTipo.set(kind, `${larg.toFixed(0)}x${prof.toFixed(0)}x${alt.toFixed(0)}`);
    if (alt < ALTURA_MIN + 1) acha('tipo sólido baixo demais', kind, ex[0], ex[1], `${t.solidos} bloco(s), modelo de ${alt.toFixed(1)} px de altura`);
    // cobertura da pegada: cada bloco sólido do tipo precisa receber malha dele mesmo
    const fx = (t.ex.x + K.fw / 2) * 16, fz = (t.ex.y + K.fh) * 16, loc = new Map();
    marcarLocal(a, fx, fz, loc);
    for (const k of t.ex.cells ?? []) {
      const n = pop(loc.get(k % W + Math.floor(k / W) * 65536) ?? 0);
      if (n < COBRE_MIN) acha('pegada sólida sem malha', kind, k % W, Math.floor(k / W), `o modelo (${larg.toFixed(0)}x${prof.toFixed(0)}x${alt.toFixed(0)}) cobre só ${n} de 16 células desse bloco`);
    }
  }
  function marcarLocal(a, fx, fz, mapa) {
    for (let i = 0; i < a.pts.length; i += 3) {
      if (a.pts[i + 2] < ALTURA_MIN) continue;
      const X = fx + a.pts[i], Z = fz + a.pts[i + 1], tx = Math.floor(X / 16), ty = Math.floor(Z / 16), k = tx + ty * 65536;
      mapa.set(k, (mapa.get(k) ?? 0) | (1 << ((Math.floor((X - tx * 16) / 4) & 3) + 4 * (Math.floor((Z - ty * 16) / 4) & 3))));
    }
  }

  // 2. cobertura do mundo: todo objeto (sólido ou de enfeite, inclusive as árvores da mata densa) e as peças de barreira
  // as zonas de CLIMA (tempestade do Planalto, neblina do mar) não têm peça no chão: a parede de nuvem, a chuva e a névoa
  // (visual3d/zonas-clima.js) é que as mostram; ficam só no total de blocos conferidos
  const todasBarreiras = BARREIRAS.filter((d) => d.mundo === id && d.rects);
  const climaBlocos = [...TEMPESTADES, ...NEVOAS].filter((d) => d.mundo === id && ativa(d, {})).reduce((n, d) => n + d.rects.reduce((m, [, , w, h]) => m + w * h, 0), 0);
  const leitor = { tile: (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : S.tiles[x + y * W]), ocupado: (x, y) => x >= 0 && y >= 0 && x < W && y < H && S.block[x + y * W] === 1 };
  for (const o of placed) {
    const K = KINDS[o.kind]; if (!K) continue;
    const a = malhaDe(o.kind, { ...o, tx: o.x, ty: o.y }); if (!a) continue;
    marcar(a, (o.x + K.fw / 2) * 16, (o.y + K.fh) * 16, o.kind);
  }
  const { props, guardas } = montarCenario(id, {}, leitor);
  for (const p of props) { const a = malhaDe(p.kind, p); if (a) marcar(a, p.x, p.y, p.kind); }
  const marcado = (k) => pop(cover[k]) >= COBRE_MIN;

  // 3. blocos sólidos sem nada
  const objDe = new Map();
  for (const o of placed) for (const k of o.cells ?? []) objDe.set(k, o);
  const porTile = new Map();
  const salaDe = (x, y) => (R.interiors ?? []).some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
  for (let y = 0; y < OH; y++) for (let x = 0; x < W; x++) {
    const k = x + y * W, t = S.tiles[k];
    if (salaDe(x, y)) continue;
    const o = objDe.get(k);
    if (o && MIUDO.test(o.kind)) { acha('bem pequeno que bloqueia', o.kind, x, y, 'seixo, flor ou concha com pegada sólida: não pode travar o jogador'); continue; }
    if (o) { if (!marcado(k)) acha('objeto sólido sem malha no bloco', o.kind, x, y, 'nenhuma malha (do objeto ou vizinha) cobre o bloco'); continue; }
    if (SOLID.has(t)) {
      const nome = NOME_TILE[t], p = porTile.get(nome) ?? { n: 0, sem: 0 }; p.n++;
      if (!MARCA_SOZINHO.has(t) && (t === TILE.FOREST ? pop(cover[k]) < COBRE_MATA : !marcado(k))) { p.sem++; acha('tile sólido que parece chão', nome, x, y, `${nome} sem árvore, arbusto nem pedra em cima`); }
      porTile.set(nome, p);
    } else if (S.block[k] === 1) acha('bloco bloqueado sem dono', NOME_TILE[t], x, y, 'map.block=1 sem objeto nem tile sólido');
  }
  // 4. barreiras da história (todas ativas, jogo novo): cada bloco do retângulo que bloqueia a pé precisa de peça, guarda ou chão que o marque
  const guardaEm = new Set(guardas.map((g) => g.tx + g.ty * W));
  let barreiraN = 0;
  for (const d of todasBarreiras) {
    if (!ativa(d, {})) continue;
    const ruins = [];
    for (const [rx, ry, w, h] of d.rects) for (let y = ry; y < ry + h; y++) for (let x = rx; x < rx + w; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const k = x + y * W, t = S.tiles[k];
      if (SOLID.has(t) || objDe.has(k)) continue; // já era parede
      const cl = classe(leitor, x, y);
      barreiraN++;
      if (marcado(k) || guardaEm.has(k)) continue;
      ruins.push([x, y, cl]);
    }
    // o bloco sem peça só vira achado se a faixa não for uma linha de peças contínua (o jogador vê a linha, não cada bloco)
    for (const [x, y, cl] of ruins) acha('barreira sem peça', d.id, x, y, `bloco de ${cl} dentro do retângulo sem peça nem guarda`);
  }
  return { id, W, H, OH, achados, tipos, nomeDoTipo, porTile, barreiraN, climaBlocos, dono };
}

// ---------- relatório
let total = 0;
const resumo = [];
for (const m of MUNDOS) {
  if (soMundo && m.id !== soMundo) continue;
  let r;
  try { r = await auditar(m.id); } catch (e) { console.log(`${m.id}: não montou (${e.message})`); continue; }
  console.log(`\n=== ${m.id} (${r.W}x${r.H}, ao ar livre até y=${r.OH}) ===`);
  const porTipo = new Map(), porKind = new Map(), porArea = new Map();
  for (const a of r.achados) {
    porTipo.set(a.tipo, (porTipo.get(a.tipo) ?? 0) + 1);
    const kk = `${a.tipo} / ${a.nome}`; porKind.set(kk, (porKind.get(kk) ?? 0) + 1);
    const ak = a.area; porArea.set(ak, (porArea.get(ak) ?? 0) + 1);
  }
  console.log('tiles sólidos:', [...r.porTile].map(([n, p]) => `${n} ${p.n}${p.sem ? ` (${p.sem} sem marca)` : ''}`).join(', '));
  console.log(`blocos de barreira da história conferidos: ${r.barreiraN} (mais ${r.climaBlocos} de zonas de clima, que o clima mostra)`);
  console.log(`achados: ${r.achados.length}`);
  for (const [k, n] of [...porTipo].sort((a, b) => b[1] - a[1])) console.log(`  por motivo   ${String(n).padStart(6)}  ${k}`);
  for (const [k, n] of [...porKind].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`  por tipo     ${String(n).padStart(6)}  ${k}`);
  for (const [k, n] of [...porArea].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  por área     ${String(n).padStart(6)}  ${k}`);
  if (detalhe) for (const a of r.achados.filter((q) => !caixa || (q.x >= caixa[0] && q.y >= caixa[1] && q.x <= caixa[2] && q.y <= caixa[3]))) console.log(`    (${a.x},${a.y}) ${a.area} | ${a.tipo} ${a.nome}: ${a.motivo}`);
  total += r.achados.length;
  resumo.push([m.id, r.achados.length]);
}
console.log(`\ntotal de blocos sólidos sem nada visível: ${total}${resumo.length ? ' (' + resumo.map(([i, n]) => `${i} ${n}`).join(', ') + ')' : ''}`);
process.exitCode = total ? 1 : 0;
