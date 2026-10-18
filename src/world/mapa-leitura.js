import { T, TILE, TALLS } from './tiles.js';
import { KINDS } from './objects.js';
import { renderTiles } from './ground.js';
import { TALL, CORN } from './art.js';
import { TALL_SNOW, TALL_DRY, TALL_REED } from './arte-biomas.js';

// Interface de LEITURA do mapa para quem só desenha (o visual 3D, src/visual3d).
// O 3D nunca mexe no mapa nem depende de como ele é montado: tudo o que precisa passa por aqui.
// Se o motor do mapa mudar por dentro (regiões em arquivos, mundos trocados com map.carregar, interiores gerados),
// só este arquivo acompanha.
//
//   const L = new MapaLeitura(game.map)
//   L.versao                 muda quando o mundo inteiro é trocado (outro continente, outro mapa)
//   L.w, L.h, L.externoH     tamanho em blocos; linhas >= externoH são a faixa dos interiores
//   L.bloco(x, y)            tipo do bloco (fora do mapa = penhasco, como no jogo)
//   L.setor                  lado do setor em blocos (16)
//   L.objetosDoSetor(sx, sy) objetos cujo pé cai no setor (o mesmo objeto do jogo: kind, tx, ty, fw, fh, x, y, dead, sprite...)
//   L.catalogo(kind)         ficha do objeto (objects.js)
//   L.areaEm(px, py), L.interiorEm(px, py), L.interiores, L.bioma(px, py)
//   L.pintarChao(img, ox, oy, x0, y0, w, h)   arte do chão (a mesma do 2D) num ImageData
//   L.arteDoSetor(sx, sy)    canvas do chão já assado pelo 2D para o setor (ou null); muda de identidade se o 2D refizer
//   L.mudancas()             blocos trocados desde a última chamada: [[x, y, antigo, novo], ...]
//   L.ehMato(sprite)         o sprite é um tufo de mato alto do 2D (o 3D desenha o seu)
//   L.setoresVisiveis()      setores que o 2D considera na tela (as outras partes do jogo usam essa lista)
//   L.cull(view)             pede ao 2D para montar/mostrar os setores do retângulo (px de mundo)
const TALL_SETS = new Set([TALL, CORN, TALL_SNOW, TALL_DRY, TALL_REED]);

export class MapaLeitura {
  constructor(map) {
    this.map = map; this.setor = 16; this.trocas = []; this.v = 0;
    this.#ligar();
  }
  // escuta setTile sem mudar o mapa (embrulha o método da instância)
  #ligar() {
    const m = this.map;
    if (m.__leitura) return;
    m.__leitura = this;
    const orig = m.setTile.bind(m);
    m.setTile = (x, y, t) => { const a = m.at(x, y); orig(x, y, t); const b = m.at(x, y); if (a !== b) this.trocas.push([x, y, a, b]); };
  }
  get versao() { const m = this.map; if (m.tiles !== this.lastTiles) { this.lastTiles = m.tiles; this.v++; this.trocas.length = 0; } return this.v; }
  get w() { return this.map.w; }
  get h() { return this.map.h; }
  get externoH() { return this.map.outdoorH ?? this.map.h; }
  bloco(x, y) { return this.map.at(x, y); }
  get tiles() { return this.map.tiles; }
  catalogo(kind) { return KINDS[kind]; }
  get interiores() { return this.map.interiors; }
  interiorEm(px, py) { return this.map.interiorAt(px, py); }
  areaEm(px, py) { return this.map.areaAt(px, py); }
  bioma(px, py) { return this.map.biome(px, py); }
  ehMato(s) { return !!s && TALL_SETS.has(s.frames); }
  ehMatoBloco(t) { return TALLS.has(t) || t === TILE.CORN; }
  #chunk(sx, sy) { const m = this.map; if (sx < 0 || sy < 0 || sx >= m.CW || sy >= m.CHh) return null; return m.chunks[sx + sy * m.CW] ?? null; }
  objetosDoSetor(sx, sy) { return this.#chunk(sx, sy)?.objs ?? []; }
  arteDoSetor(sx, sy) { const c = this.#chunk(sx, sy); return c?.built && c.canvas ? c.canvas : null; }
  decoDoSetor(sx, sy) { const c = this.#chunk(sx, sy); return c?.built ? c.deco : null; }
  matoDoSetor(sx, sy) { const c = this.#chunk(sx, sy); return c?.built ? c.tall : null; }
  setoresVisiveis() { return this.map.visible; }
  get nx() { return this.map.CW; }
  get ny() { return this.map.CHh; }
  pintarChao(img, ox, oy, x0, y0, w, h) { renderTiles(this.map, img, ox, oy, x0, y0, w, h); }
  cull(view) { this.map.cullChunks(view); }
  mudancas() { const v = this.trocas; this.trocas = []; return v; }
  // água animada do 2D (para o 3D usar a mesma arte)
  get T() { return T; }
}
