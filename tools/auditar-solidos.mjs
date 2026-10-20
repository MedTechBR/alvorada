// Auditoria de posicionamento (sem Chrome): carrega cada mundo do jogo em Node e procura personagens,
// pontos de história e portas que caem em cima de objeto sólido, parede, outro personagem ou passagem.
// Uso: node tools/auditar-solidos.mjs [--corrigir]   (--corrigir só relata; a correção é feita à mão nos dados)
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ARQ = (s) => 'data:text/javascript,' + encodeURIComponent(s);
// Stubs: o desenho (canvas, PIXI) não existe em Node; só a geometria dos objetos e dos blocos importa aqui.
const STUB_PIXI = `export class Container{} export class Sprite{} export class Graphics{} export class Texture{static from(){return {}}}
export class Text{} export class Rectangle{} export class ParticleContainer{} export class TilingSprite{} export class Particle{}
export class RenderTexture{} export class DisplacementFilter{} export class ColorMatrixFilter{} export const Assets={}; export const Application=class{};
export const UPDATE=0; export const TextureSource=class{}; export default {};`;
const DUMMY = `const D=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:D,apply:()=>D,construct:()=>D});export default D;`;
const STUB_ART = `const D=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:D,apply:()=>D,construct:()=>D});
export const SPR=new Proxy({},{get:()=>D}); export const canvas=()=>D; export const texOf=()=>D; export const outline=()=>D;
export const GROUND={}; export const TALL=[]; export const CORN=[]; export const WATER_FRAMES=[]; export const FLOWERS=[]; export const LILY=[];
export const LEAVES=[]; export const VARAL=[]; export const TALL_SNOW=[]; export const TALL_DRY=[]; export const TALL_REED=[];`;
const STUB_ARTE = `const D=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:D,apply:()=>D,construct:()=>D});
export const FAM={}; export const SOFT={}; export const BLEED={}; export const drawBiomeHard=()=>{}; export const famBuf=()=>D; export const warmTile=()=>{};
export const FLOORS=[]; export const ANIM={}; export const TALL_SNOW=[]; export const TALL_DRY=[]; export const TALL_REED=[];`;
const HOOKS = `
const STUBS = ${JSON.stringify({ art: STUB_ART, arte: STUB_ARTE })};
const url = (s) => 'data:text/javascript,' + encodeURIComponent(s);
export async function resolve(spec, ctx, next) {
  if (spec === 'pixi.js') return { url: url(${JSON.stringify(STUB_PIXI)}), shortCircuit: true, format: 'module' };
  const r = await next(spec, ctx);
  if (r.url.endsWith('/src/world/art.js')) return { url: url(STUBS.art), shortCircuit: true, format: 'module' };
  if (r.url.endsWith('/src/world/arte-biomas.js')) return { url: url(STUBS.arte), shortCircuit: true, format: 'module' };
  return r;
}`;
register(ARQ(HOOKS));

const RAIZ = new URL('../', import.meta.url);
const MAPS = new URL('assets/maps/', RAIZ);
globalThis.fetch = async (u) => {
  const p = u instanceof URL ? u : new URL(String(u), 'file:///');
  if (p.protocol !== 'file:') throw new Error('sem rede: ' + p);
  return new Response(readFileSync(fileURLToPath(p)), { status: 200 });
};

// o catálogo completo do jogo: os capítulos 4 a 6 registram os próprios prédios e objetos (como roteiro.js faz)
await import(pathToFileURL(fileURLToPath(new URL('src/story/cenario.js', RAIZ))).href);
const { dadosDoMundo, MUNDOS } = await import(pathToFileURL(fileURLToPath(new URL('src/world/mundos.js', RAIZ))).href);
const { prepararMundo, montarParte } = await import(pathToFileURL(fileURLToPath(new URL('src/world/build.js', RAIZ))).href);
const { TILE, SOLID } = await import(pathToFileURL(fileURLToPath(new URL('src/world/tiles.js', RAIZ))).href);
const NOME_TILE = Object.fromEntries(Object.entries(TILE).map(([k, v]) => [v, k]));

// Cada ponto de pessoa, história ou passagem que cai em: objeto sólido (pegada), bloco sólido, porta/passagem
// ou em outro personagem. Um personagem em cima da própria mesa de balcão também conta.
function auditar(R) {
  const S = prepararMundo(R);
  for (const P of R.partes) montarParte(S, P);
  const W = S.W, H = S.H;
  const pos = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? x + y * W : -1);
  const objDe = new Map();
  for (const o of [...S.placed, ...(S.novos ?? [])]) for (const k of o.cells ?? []) objDe.set(k, o);
  const portas = new Set();
  for (const o of [...S.placed, ...(S.novos ?? [])]) if (o.doorX !== undefined) portas.add(pos(o.doorX, o.doorY));
  for (const w of R.warps ?? []) if (typeof w.x === 'number') portas.add(pos(w.x, w.y));
  for (const r of R.interiors ?? []) (r.rows ?? []).forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'm') portas.add(pos(r.x + i, r.y + j)); }));
  const achados = [];
  const sala = (x, y) => { const r = (R.interiors ?? []).find((q) => x >= q.x && y >= q.y && x < q.x + q.w && y < q.y + q.h); return r ? r.id : 'mundo'; };
  const pessoas = S.people.filter((d) => d.x != null);
  // bloco livre mais perto (até 6 blocos), na mesma sala, sem objeto, parede, porta nem outra pessoa, com passagem
  const ocupados = new Set(pessoas.map((d) => `${Math.floor(d.x)},${Math.floor(d.y)}`));
  const livreDe = (tx, ty) => {
    const k = pos(tx, ty); if (k < 0) return false;
    if (objDe.has(k) || S.block[k] === 1 || SOLID.has(S.tiles[k]) || portas.has(k) || ocupados.has(`${tx},${ty}`)) return false;
    let n = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = pos(tx + a, ty + b); if (q >= 0 && !objDe.has(q) && S.block[q] !== 1 && !SOLID.has(S.tiles[q])) n++; }
    return n >= 2;
  };
  const sugerir = (x, y, sl) => {
    let best = null;
    for (let r = 1; r <= 6 && !best; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
      const tx = Math.floor(x) + i, ty = Math.floor(y) + j;
      if (sala(tx, ty) === sl && livreDe(tx, ty) && !best) best = [tx, ty];
    }
    return best;
  };
  const checar = (grupo, id, nome, x, y) => {
    const tx = Math.floor(x), ty = Math.floor(y), k = pos(tx, ty);
    if (k < 0) return;
    const motivos = [];
    if (objDe.has(k)) motivos.push(`objeto ${objDe.get(k).kind}`);
    else if (S.block[k] === 1) motivos.push('bloco bloqueado');
    if (SOLID.has(S.tiles[k])) motivos.push(`bloco sólido ${NOME_TILE[S.tiles[k]] ?? S.tiles[k]}`);
    if (portas.has(k)) motivos.push('porta/passagem');
    if (motivos.length) achados.push({ grupo, id, nome, sala: sala(tx, ty), x: tx, y: ty, motivos, sugestao: sugerir(tx, ty, sala(tx, ty)) });
  };
  // personagens (pessoas do mapa e de salas), pontos de história e passagens
  for (const d of pessoas) checar('pessoa', d.id ?? '?', d.name ?? '', d.x, d.y);
  for (const [k, v] of Object.entries(R.spots ?? {})) if (Array.isArray(v) && !/^porta_|^dentro_/.test(k)) checar('ponto', k, '', v[0], v[1]);
  // ilhado: do bloco do personagem não dá para chegar a pelo menos 40 blocos livres (porta conta como passagem; balcão e mesa não tapam)
  // balcão, mesa e máquina são de interação: o jogador fala por cima deles, então o alcance passa por eles
  const BALCAO = /counter|table|machine|desk|balcao/i;
  const livre = (tx, ty) => { const q = pos(tx, ty); if (q < 0 || SOLID.has(S.tiles[q])) return false; if (!objDe.has(q) && S.block[q] !== 1) return true; return !!objDe.has(q) && BALCAO.test(objDe.get(q).kind); };
  // alcança a porta da sala (ou 40 blocos livres, se estiver ao ar livre)?
  const alcanca = (tx, ty) => {
    const vistos = new Set([`${tx},${ty}`]), fila = [[tx, ty]];
    while (fila.length && vistos.size < 4000) {
      const [x, y] = fila.shift();
      if (portas.has(pos(x, y)) || (sala(x, y) === 'mundo' && vistos.size >= 40)) return true;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = `${x + a},${y + b}`; if (!vistos.has(n) && livre(x + a, y + b)) { vistos.add(n); fila.push([x + a, y + b]); } }
    }
    return false;
  };
  for (const d of pessoas) if (!alcanca(Math.floor(d.x), Math.floor(d.y)) && !achados.some((q) => q.id === d.id)) achados.push({ grupo: 'pessoa', id: d.id ?? '?', nome: d.name ?? '', sala: sala(d.x, d.y), x: Math.floor(d.x), y: Math.floor(d.y), motivos: ['ilhado (não chega à porta nem ao espaço livre)'] });
  // duas pessoas no mesmo bloco
  const porBloco = new Map();
  for (const d of pessoas) { const k = `${Math.floor(d.x)},${Math.floor(d.y)}`; if (!porBloco.has(k)) porBloco.set(k, []); porBloco.get(k).push(d); }
  for (const [k, lista] of porBloco) if (lista.length > 1) for (const d of lista.slice(1)) achados.push({ grupo: 'pessoa', id: d.id ?? '?', nome: d.name ?? '', sala: sala(d.x, d.y), x: Math.floor(d.x), y: Math.floor(d.y), motivos: [`mesmo bloco de ${lista[0].id ?? lista[0].name}`] });
  return achados;
}

const todos = [];
for (const m of MUNDOS) {
  const R = await dadosDoMundo(m.id);
  const achados = auditar(R);
  todos.push(...achados.map((a) => ({ mundo: m.id, ...a })));
  console.log(`${m.id}: ${achados.length} sobreposição(ões)`);
}
for (const a of todos) console.log(`  [${a.mundo}] ${a.grupo} ${a.id} ${a.nome ? '"' + a.nome + '" ' : ''}em (${a.x},${a.y}) sala=${a.sala}: ${a.motivos.join(', ')}${a.sugestao ? ` -> sugestão (${a.sugestao})` : ' -> sem bloco livre'}`);
console.log(`total: ${todos.length}`);
process.exitCode = todos.length ? 1 : 0;
