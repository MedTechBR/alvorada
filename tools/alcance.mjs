// Alcance no mapa de verdade, sem navegador: monta o mundo como o jogo (tools/vestir/mundo.mjs: mundos.js + build.js,
// com regiões e a camada vestir), aplica as barreiras da progressão (src/world/barreiras-dados.js) para um conjunto de
// flags e faz uma busca em largura a partir de um ponto. Usado por tools/teste-jornada-completa.mjs.
//
// O que a busca entende (o mesmo que o jogo deixa fazer):
//   - andar: bloco não sólido e sem objeto (map.block), ou sólido que a montaria vence (lama/Correr, água/Nadar,
//     trepadeira/Escalar: MOUNT_PASS de src/world/tiles.js), maré (TIDE) conta como passável (ela baixa);
//   - salto do Mudbray por cima de tora e cerca baixa (JUMPABLE de src/world/mounts.js), caindo a até 4 blocos;
//   - portas de prédio, tapetes de saída, passagens do mapa ("warps") e portais dos enigmas (com "requer");
//   - barcos e balsas: falar com o barqueiro (morador com "viagem") leva ao destino;
//   - voo (Voar, depois da insígnia): pousa em qualquer chão livre ao ar livre fora das zonas sem pouso;
//   - dentro de masmorra, os enigmas (portões, pedras, pontes) contam como resolvidos: a sala inteira e as escadas
//     dela valem assim que se entra (os quebra-cabeças têm teste próprio).
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const { carregarMundo } = await abrir('tools/vestir/mundo.mjs');
// os enigmas (portais com "requer") moram em src/story/enigmas.js, que puxa o desenho do mapa: troca os módulos de
// desenho por stubs que aceitam qualquer nome (ganchos registrados depois rodam antes dos de tools/vestir)
{
  const { register } = await import('node:module');
  const D = 'const D=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:k==="then"?undefined:D,apply:()=>D,construct:()=>D});';
  const ARTE = D + 'export default D; export const FAM={}; export const SOFT={}; export const BLEED={}; export const drawBiomeHard=()=>{}; export const famBuf=()=>D; export const warmTile=()=>{}; export const FLOORS=[]; export const ANIM={}; export const TALL_SNOW=[]; export const TALL_DRY=[]; export const TALL_REED=[];';
  const ART = D + 'export const SPR=new Proxy({},{get:()=>D}); export const canvas=()=>D; export const texOf=()=>D; export const outline=()=>D; export const GROUND={}; export const TALL=[]; export const CORN=[]; export const WATER_FRAMES=[]; export const FLOWERS=[]; export const LILY=[]; export const LEAVES=[]; export const VARAL=[]; export const TALL_SNOW=[]; export const TALL_DRY=[]; export const TALL_REED=[];';
  const PIXI = 'export class Container{} export class Sprite{} export class Graphics{} export class Text{} export class Rectangle{} export class ParticleContainer{} export class TilingSprite{} export class Particle{} export class RenderTexture{} export const Texture={from:()=>({source:{}}),WHITE:{}}; export const Assets={}; export default {};';
  const url = (t) => 'data:text/javascript,' + encodeURIComponent(t);
  const HOOK = `const M=${JSON.stringify({ arte: url(ARTE), art: url(ART), pixi: url(PIXI) })};
export async function resolve(spec, ctx, next) {
  if (spec === 'pixi.js') return { url: M.pixi, shortCircuit: true, format: 'module' };
  if (/(^|\\/)arte-biomas\\.js$/.test(spec)) return { url: M.arte, shortCircuit: true, format: 'module' };
  if (/(^|\\/)art\\.js$/.test(spec)) return { url: M.art, shortCircuit: true, format: 'module' };
  return next(spec, ctx);
}`;
  register(url(HOOK));
}
const { TILE, SOLID, MOUNT_PASS } = await abrir('src/world/tiles.js');
const { KINDS } = await abrir('src/world/objects.js');
const { aplicar, ZONAS_SEM_POUSO, ativa } = await abrir('src/world/barreiras-dados.js');
globalThis.location ??= { search: '' }; // map.js lê ?mapa= da URL
const { ENIGMAS } = await abrir('src/story/enigmas.js');

const JUMPABLE = new Set(['log', 'stump', 'fence', 'fenceV', 'wfence', 'wfenceV']);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Monta o mundo uma vez e devolve o "mapa de alcance": blocos, objetos, salas, pontos e passagens em blocos.
export async function montarAlcance(id = 'alvorada') {
  const M = await carregarMundo(id);
  const { R, S, W, H } = M;
  const OH = R.outdoorH ?? H;
  const tiles = S.tiles, block0 = S.block;
  const cellObj = new Map();
  for (const o of [...S.placed, ...(S.novos ?? [])]) for (const k of o.cells ?? []) cellObj.set(k, o);
  // objetos de masmorra (portão, pedra de Força, vagonete, parede rachada...) não contam como parede: o enigma se resolve
  const puzzle = new Uint8Array(W * H);
  // portões que abrem por flag (portão de pedra com "flag", porteira com "opens" = treinador vencido): dependem das flags
  const condicionais = [];
  for (const o of [...S.placed, ...(S.novos ?? [])]) if ((o.flag || o.opens) && o.cells?.length) condicionais.push({ cells: o.cells, flag: o.flag ?? null, opens: o.opens ?? null, aberto: !!o.aberto });
  const cond = new Set(condicionais.flatMap((c) => c.cells));
  for (const [k, o] of cellObj) { if (cond.has(k)) continue; const K = KINDS[o.kind] ?? {}; if (K.gate || K.strength || K.cart || K.cracked || o.pede || o.abre || K.lever || K.chest || K.bell) puzzle[k] = 1; }
  const salas = R.interiors;
  const salaIdx = new Int16Array(W * H).fill(-1);
  salas.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (x >= 0 && y >= 0 && x < W && y < H) salaIdx[x + y * W] = i; });
  // pontos (como map.#links): os do mapa, os de cada sala, porta_/dentro_ dos prédios
  const spots = {};
  for (const [k, v] of Object.entries(R.spots ?? {})) spots[k] = [Math.floor(v[0]), Math.floor(v[1])];
  const warps = []; // { x, y, to: [x, y], requer? }
  const byId = Object.fromEntries(salas.map((r) => [r.id, r]));
  for (const o of [...S.placed, ...(S.novos ?? [])]) {
    if (o.doorX === undefined || !o.to) continue;
    const r = byId[o.to]; if (!r) continue;
    let mx = -1, my = -1; r.rows.forEach((row, j) => { const i = row.indexOf('m'); if (i >= 0) { mx = r.x + i; my = r.y + j; } });
    const entry = [mx, my - 1], door = [o.doorX, o.doorY + 1];
    warps.push({ x: o.doorX, y: o.doorY, to: entry, porta: r.id });
    r.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'm') warps.push({ x: r.x + i, y: r.y + j, to: door }); }));
    spots['porta_' + r.id] = door; spots['dentro_' + r.id] = entry;
  }
  for (const r of salas) for (const [k, v] of Object.entries(r.spots ?? {})) spots[k] = [r.x + Math.floor(v[0]), r.y + Math.floor(v[1])];
  for (const w of R.warps ?? []) {
    if (w.mundo && w.mundo !== id) continue;
    const to = typeof w.to === 'string' ? spots[w.to] : Array.isArray(w.to) ? w.to : null;
    if (!to) continue;
    warps.push({ x: w.x, y: w.y, to: [Math.floor(to[0]), Math.floor(to[1])], requer: w.requer });
  }
  for (const r of salas) if (r.trap) r.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === r.trap.tile) warps.push({ x: r.x + i, y: r.y + j, to: [r.x + r.trap.to[0], r.y + r.trap.to[1]] }); }));
  // portais dos enigmas (escadas do farol, elevador da torre, rampas da mina), com as flags que pedem
  if (id === 'alvorada') for (const p of ENIGMAS.portais ?? []) {
    const a = byId[p.de[0]], b = byId[p.para[0]]; if (!a || !b) continue;
    warps.push({ x: a.x + p.de[1], y: a.y + p.de[2], to: [b.x + p.para[1], b.y + p.para[2]], requer: p.requer });
  }
  // barcos: o barqueiro (morador com "viagem") leva aos destinos
  const barcos = [];
  for (const d of S.people ?? []) {
    if (!d.viagem || d.x == null) continue;
    const v = (R.viagens ?? []).find((q) => q.id === d.viagem); if (!v) continue;
    for (const dest of v.destinos ?? []) {
      if (dest.mundo && dest.mundo !== id) continue;
      const to = typeof dest.destino === 'string' ? spots[dest.destino] : null;
      if (to) barcos.push({ x: Math.floor(d.x + 0.5), y: Math.floor(d.y + 0.5), to, requer: dest.requer, nome: `${v.id} → ${dest.nome}` });
    }
  }
  return { id, R, S, W, H, OH, tiles, block0, cellObj, puzzle, condicionais, salas, salaIdx, spots, warps, barcos, areas: R.areas };
}

// flags no formato do save (f.badges, f.nh.x, f.trainers.x...): o mesmo leitor de src/story/roteiro.js
export function flagDe(f, expr) {
  const m = /^insignias\s*(>=|<=|==|>|<)\s*(\d+)$/.exec(String(expr));
  if (m) { const n = (f.badges ?? []).length, v = +m[2]; return { '>=': n >= v, '<=': n <= v, '==': n === v, '>': n > v, '<': n < v }[m[1]]; }
  const [k, val] = String(expr).split('=');
  let v;
  if (k.startsWith('badges.')) v = (f.badges ?? []).includes(k.slice(7));
  else if (k.startsWith('trainers.')) v = f.trainers?.[k.slice(9)];
  else v = k.split('.').reduce((o, p) => (o == null ? undefined : o[p]), f);
  return val !== undefined ? String(v) === val : !!v;
}

// Busca em largura. f: flags; caps: { correr, nadar, escalar, voar } (montarias liberadas); de: [x, y] em blocos.
// Devolve { alcancado: Uint8Array, alcanca(x, y, raio) }.
export function buscar(A, f, caps, de) {
  const { W, H, OH, tiles, cellObj, puzzle, salas, salaIdx, warps, barcos } = A;
  const block = new Uint8Array(A.block0);
  const barreira = new Map(); // blocos de barreira ativa (como map.barreiraCells no jogo)
  aplicar(block, W, A.id, f, barreira);
  // portões condicionais abertos com estas flags
  for (const c of A.condicionais) if (c.aberto || (c.flag && flagDe(f, c.flag)) || (c.opens && f.trainers?.[c.opens])) for (const k of c.cells) block[k] = 0;
  const passa = new Set();
  for (const [k, lista] of Object.entries(MOUNT_PASS)) if (caps[k]) for (const t of lista) passa.add(t);
  const livre = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const k = x + y * W, t = tiles[k];
    if (block[k] === 1 && !(puzzle[k] && salaIdx[k] >= 0)) return false; // objeto ou barreira (enigma de masmorra: resolvido)
    if (t === TILE.TIDE) return true;
    return !SOLID.has(t) || passa.has(t);
  };
  const warpDe = new Map();
  for (const w of warps) { if (w.requer && !w.requer.every((q) => flagDe(f, q))) continue; const k = w.x + w.y * W; if (!warpDe.has(k)) warpDe.set(k, []); warpDe.get(k).push(w.to); }
  const barcoPerto = barcos.filter((b) => !b.requer || [b.requer].flat().every((q) => flagDe(f, q)));
  const zonas = (ZONAS_SEM_POUSO ?? []).filter((z) => z.mundo === A.id && ativa(z, f));
  const semPouso = (x, y) => zonas.some((z) => z.zona.some(([zx, zy, zw, zh]) => x >= zx && y >= zy && x < zx + zw && y < zy + zh));
  const vis = new Uint8Array(W * H), prev = new Int32Array(W * H).fill(-1);
  const fila = [];
  const salasVistas = new Set();
  let atual = -1;
  const por = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = x + y * W; if (vis[k]) return; vis[k] = 1; prev[k] = atual; fila.push(k); };
  // começa no bloco livre mais perto do ponto
  let [sx, sy] = de;
  if (!livre(sx, sy)) { outer: for (let r = 1; r < 4; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (livre(sx + i, sy + j)) { sx += i; sy += j; break outer; } }
  por(sx, sy);
  let voou = false;
  for (let qi = 0; qi < fila.length; qi++) {
    const k = fila[qi], x = k % W, y = (k - x) / W;
    atual = k;
    const si = salaIdx[k];
    if (si >= 0 && !salasVistas.has(si)) {
      salasVistas.add(si);
      // masmorra: a sala inteira vale (enigmas resolvidos); as passagens dela também
      const r = salas[si];
      for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) if (livre(xx, yy) || warpDe.has(xx + yy * W)) por(xx, yy);
    }
    for (const to of warpDe.get(k) ?? []) por(to[0], to[1]);
    for (const b of barcoPerto) if (Math.abs(b.x - x) <= 2 && Math.abs(b.y - y) <= 2) por(b.to[0], b.to[1]);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (livre(nx, ny) || warpDe.has(nx + ny * W)) por(nx, ny);
      else if (caps.correr && si < 0) {
        // salto do Mudbray: objeto saltável logo à frente, cai no primeiro bloco livre a até 4 blocos
        const o = cellObj.get(nx + ny * W);
        if (o && (o.jump || JUMPABLE.has(o.kind))) for (let n = 2; n <= 4; n++) { const jx = x + dx * n, jy = y + dy * n; if (barreira.has(jx + jy * W)) break; if (cellObj.get(jx + jy * W) || !livre(jx, jy)) continue; por(jx, jy); break; }
      }
    }
    // voo: de qualquer chão ao ar livre, pousa em qualquer chão livre ao ar livre fora das zonas sem pouso (uma vez)
    if (caps.voar && !voou && si < 0 && y < OH) {
      voou = true;
      for (let yy = 0; yy < OH; yy++) for (let xx = 0; xx < W; xx++) if (salaIdx[xx + yy * W] < 0 && livre(xx, yy) && !semPouso(xx, yy)) por(xx, yy);
    }
  }
  const alcanca = (x, y, raio = 1) => {
    for (let j = -raio; j <= raio; j++) for (let i = -raio; i <= raio; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < W && yy < H && vis[xx + yy * W]) return true; }
    return false;
  };
  // caminho até (x, y): lista de [x, y] desde o começo, pulando trechos retos (para achar vazamentos)
  const caminho = (x, y, raio = 1) => {
    let k = -1;
    for (let j = -raio; j <= raio && k < 0; j++) for (let i = -raio; i <= raio && k < 0; i++) { const q = x + i + (y + j) * W; if (vis[q]) k = q; }
    const out = [];
    while (k >= 0) { out.push([k % W, Math.floor(k / W)]); k = prev[k]; }
    return out.reverse();
  };
  return { vis, alcanca, livre, block, caminho };
}

// Lugar por nome: ponto (spot), sala (qualquer bloco dela) ou área (qualquer bloco dela). Devolve uma função de teste.
export function lugar(A, nome) {
  const { W, salas, areas, spots } = A;
  if (spots[nome]) { const [x, y] = spots[nome]; return { tipo: 'ponto', x, y, testa: (B, raio = 2) => B.alcanca(x, y, raio) }; }
  const r = salas.find((s) => s.id === nome);
  if (r) return { tipo: 'sala', x: r.x, y: r.y, testa: (B) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (B.vis[x + y * W]) return true; return false; } };
  const as = areas.filter((a) => a.id === nome);
  if (as.length) return { tipo: 'area', x: (as[0].rect ?? as[0].ellipse)[0], y: (as[0].rect ?? as[0].ellipse)[1], testa: (B) => as.some((a) => {
    const [ax, ay, aw, ah] = a.rect ?? [a.ellipse[0] - a.ellipse[2], a.ellipse[1] - a.ellipse[3], a.ellipse[2] * 2, a.ellipse[3] * 2];
    for (let y = ay; y < ay + ah; y++) for (let x = ax; x < ax + aw; x++) if (x >= 0 && y >= 0 && x < W && B.vis[x + y * W]) return true;
    return false;
  }) };
  return null;
}
