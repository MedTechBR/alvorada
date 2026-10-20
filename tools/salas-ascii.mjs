// Planta das salas mobiliadas em texto (sem Chrome): node tools/salas-ascii.mjs [sala ...] (padrão: as de teste)
// pontos de história e portas que caem em cima de objeto sólido, parede, outro personagem ou passagem.
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

const pedidas = process.argv.slice(2);
const { KINDS } = await import(pathToFileURL(fileURLToPath(new URL('src/world/objects.js', RAIZ))).href);
const R = await dadosDoMundo('alvorada');
const S = prepararMundo(R);
const LETRA = { counterJoy: 'B', counterLoja: 'B', counterTroca: 'b', maquinaCura: 'M', armarioCentro: 'A', escadaRolante: 'E', pc: 'C', plantaGrande: 'P', plant: 'p', vaso: 'p', tvRack: 'T', tvConsole: 'T', tv: 'T',
  mesaRevistas: 'o', sofaCentro: 'S', sofaCentroN: 'S', sofaLadoL: 'S', sofaLadoR: 'S', sofaCasa: 'S', sofaCasaN: 'S', sofaCasaLadoL: 'S', poltronaCasa: 's', vitrineFria: 'F', gondola: 'G', gondola3: 'G',
  expositor: 'X', cestas: 'c', prateleiraParede: '=', geladeira: 'F', pia: 'K', fogaoMod: 'k', mesaJantar: 'D', cadeira: 'h', cadeiraL: 'h', cadeiraR: 'h', estanteAlta: 'L', estanteLarga: 'L', bed: 'Z', criado: 'n',
  mesaCentroCasa: 'o', relogioPe: 'r', aquario: 'q', piano: 'Q', lareira: 'Q', maquinaLab: 'M', computadorLab: 'C', mesaPapeis: 'D', tanque: 'U', balltable: 'O', radio: 'R', sign: '!' };
for (const r of R.interiors) {
  if (pedidas[0] === 'gerado' ? !(r.gerado && r.receita && (!pedidas[1] || r.receita === pedidas[1])) : pedidas.length ? !pedidas.includes(r.id) : !['centro_coral', 'loja_coral', 'casa_coral', 'casa_jogador', 'laboratorio'].includes(r.id)) continue;
  const g = r.rows.map((s) => [...s].map((c) => (c === 'w' ? '#' : c === 'm' ? '_' : c === '^' ? '^' : '.')));
  for (const o of r.objects ?? []) { const K = KINDS[o.kind]; for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) { const sol = !K.solidCells || K.solidCells.some(([a, b]) => a === i && b === j); if (g[o.y + j]?.[o.x + i] != null) g[o.y + j][o.x + i] = sol ? (LETRA[o.kind] ?? '?') : (K.solidCells?.length === 0 ? (LETRA[o.kind] ?? '?').toLowerCase() : g[o.y + j][o.x + i]); } }
  for (const d of r.people ?? []) { const x = Math.floor(d.x + 0.5), y = Math.floor(d.y + 0.5); if (g[y]?.[x] != null) g[y][x] = '@'; }
  for (const [k, v] of Object.entries(r.spots ?? {})) { const x = Math.floor(v[0] + 0.5), y = Math.floor(v[1] + 0.5); if (g[y]?.[x] === '.') g[y][x] = '*'; }
  console.log(`\n${r.id} (${r.name}) receita=${r.receita ?? r.estilo ?? '-'} objetos=${r.objects?.length} enfeites=${r.enfeites?.map((e) => e.tipo).join(',')}`);
  console.log(g.map((l) => l.join('')).join('\n'));
  if (process.env.V) console.log((r.objects ?? []).map((o) => `${o.kind}@${o.x},${o.y}${o.text ? ' "' + o.text.slice(0, 40) + '"' : ''}`).join('\n'));
}
void S; void montarParte; void TILE; void SOLID;
if (process.env.LISTA) for (const r of R.interiors) if (r.estilo) console.log('#', r.id, r.estilo, r.receita ?? '', r.gerado ? 'gerado' : 'mão', r.w + 'x' + r.h);
