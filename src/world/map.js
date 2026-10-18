import * as PIXI from 'pixi.js';
import { T, TILE, SOLID } from './tiles.js';

// Região gerada por ruído (provisória): vila, campos com mato alto, floresta, lago e praia.
// Colisão por blocos (sólida por construção) + objetos com pegada (árvores, pedras, casas).
const W = 200, H = 200, CH = 25; // tamanho em blocos e tamanho do pedaço de render

function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, s) => noise(x, y, s) * 0.55 + noise(x * 2.1, y * 2.1, s + 7) * 0.3 + noise(x * 4.3, y * 4.3, s + 13) * 0.15;

export const AREAS = [
  { name: 'Vila Alvorada', x: 100, y: 100, r: 16 },
  { name: 'Campos de Lúmen', x: 60, y: 110, r: 40 },
  { name: 'Bosque Sussurrante', x: 105, y: 45, r: 40 },
  { name: 'Lago Espelho', x: 150, y: 115, r: 34 },
  { name: 'Costa Coral', x: 100, y: 180, r: 30 },
];

export class GameMap {
  constructor(tx) {
    this.tx = tx; this.w = W; this.h = H;
    this.tiles = new Uint8Array(W * H);
    this.block = new Uint8Array(W * H);  // ocupação por objetos (árvores etc.)
    this.objects = [];
    this.#generate();
  }

  at(x, y) { return x < 0 || y < 0 || x >= W || y >= H ? TILE.CLIFF : this.tiles[x + y * W]; }
  biome(px, py) {
    const x = px / T, y = py / T;
    if (Math.hypot(x - 100, y - 100) < 16) return 'vila';
    const t = this.at(Math.floor(x), Math.floor(y));
    if (t === TILE.SAND) return 'praia';
    if (this.forest(x, y)) return 'floresta';
    if (Math.hypot(x - 150, y - 115) < 40) return 'margem';
    return 'campo';
  }
  forest(x, y) { return y < 75 && fbm(x * 0.05, y * 0.05, 3) > 0.42; }
  areaName(px, py) {
    const x = px / T, y = py / T; let best = AREAS[1], bd = 1e9;
    for (const a of AREAS) { const d = Math.hypot(x - a.x, y - a.y) - a.r; if (d < bd) { bd = d; best = a; } }
    return best.name;
  }

  #generate() {
    const set = (x, y, t) => { if (x >= 0 && y >= 0 && x < W && y < H) this.tiles[x + y * W] = t; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let t = hash(x, y, 1) > 0.5 ? TILE.GRASS : TILE.GRASS2;
      const lake = Math.hypot((x - 150) * 1, (y - 115) * 1.25) + (fbm(x * 0.08, y * 0.08, 5) - 0.5) * 14;
      if (lake < 20) t = lake < 13 ? TILE.DEEP : TILE.WATER;
      else if (lake < 21.5) t = TILE.SAND;
      if (y > 172 + (fbm(x * 0.06, 0, 9) - 0.5) * 8) t = y > 182 + (fbm(x * 0.07, 3, 9) - 0.5) * 6 ? TILE.WATER : TILE.SAND;
      if (y > 188) t = TILE.DEEP;
      if (t <= TILE.GRASS2 && fbm(x * 0.09, y * 0.09, 11) > 0.6 && Math.hypot(x - 100, y - 100) > 17) t = TILE.TALL;
      if (t <= TILE.GRASS2 && hash(x, y, 4) > 0.985) t = TILE.FLOWERS;
      if (x < 3 || y < 3 || x > W - 4) t = TILE.CLIFF;
      this.tiles[x + y * W] = t;
    }
    // caminhos ligando a vila às áreas
    const path = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const k = i / n; const x = Math.round(x0 + (x1 - x0) * k + Math.sin(k * 6) * 3), y = Math.round(y0 + (y1 - y0) * k); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const c = this.at(x + a, y + b); if (c !== TILE.WATER && c !== TILE.DEEP && c !== TILE.CLIFF) set(x + a, y + b, TILE.PATH); } } };
    path(100, 100, 40, 110); path(100, 100, 105, 25); path(100, 100, 128, 112); path(100, 100, 100, 172);
    // vila: praça de terra e casas
    for (let y = 92; y < 108; y++) for (let x = 90; x < 112; x++) if (Math.hypot(x - 100, y - 100) < 9) set(x, y, TILE.PATH);
    this.#object('house', 88 * T, 94 * T, 4, 2); this.#object('house', 108 * T, 94 * T, 4, 2); this.#object('house', 98 * T, 88 * T, 4, 2);
    // árvores (floresta densa ao norte, esparsas nos campos), arbustos e pedras
    for (let y = 4; y < H - 12; y++) for (let x = 4; x < W - 4; x++) {
      const t = this.at(x, y); if (t !== TILE.GRASS && t !== TILE.GRASS2) continue;
      if (Math.hypot(x - 100, y - 100) < 15 || this.block[x + y * W]) continue;
      const h = hash(x, y, 21);
      const forest = this.forest(x, y);
      if ((forest && h > 0.82) || (!forest && h > 0.985)) { if (this.#free(x, y, 2, 1)) this.#object(forest && hash(x, y, 2) > 0.5 ? 'pine' : 'tree', x * T + 8, y * T + 12, 1, 1); }
      else if (h > 0.976 && h < 0.982) this.#object('bush', x * T + 8, y * T + 10, 1, 1, { breakable: true, hp: 1 });
      else if (h < 0.006) this.#object('rock', x * T + 8, y * T + 10, 1, 1, { breakable: true, hp: 3 });
    }
  }
  #free(x, y, w, h) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.block[x + i + (y + j) * W] || SOLID.has(this.at(x + i, y + j))) return false; return true; }
  #object(kind, px, py, fw, fh, extra = {}) {
    const o = { kind, x: px, y: py, fw, fh, ...extra };
    const tx = Math.floor(px / T) - Math.floor((fw - 1) / 2), ty = Math.floor(py / T) - (fh - 1);
    o.cells = [];
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { const k = tx + i + (ty + j) * W; if (k >= 0 && k < W * H) { this.block[k] = 1; o.cells.push(k); } }
    this.objects.push(o);
    return o;
  }
  removeObject(o) { for (const k of o.cells) this.block[k] = 0; o.dead = true; }

  // Colisão: bloco sólido ou ocupado por objeto
  solidAt(px, py, swim = false) {
    const x = Math.floor(px / T), y = Math.floor(py / T);
    const t = this.at(x, y);
    if (swim) return !(t === TILE.WATER || t === TILE.DEEP) || this.block[x + y * W] === 1;
    return SOLID.has(t) || this.block[x + y * W] === 1;
  }
  tallAt(px, py) { return this.at(Math.floor(px / T), Math.floor(py / T)) === TILE.TALL; }
  // Empurra um círculo para fora dos blocos sólidos
  resolve(p, r, swim = false) {
    const x0 = Math.floor((p.x - r) / T), x1 = Math.floor((p.x + r) / T), y0 = Math.floor((p.y - r) / T), y1 = Math.floor((p.y + r) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!this.solidAt(x * T + 1, y * T + 1, swim)) continue;
      const nx = Math.max(x * T, Math.min(p.x, x * T + T)), ny = Math.max(y * T, Math.min(p.y, y * T + T));
      let dx = p.x - nx, dy = p.y - ny; const d = Math.hypot(dx, dy);
      if (d < r) {
        if (d < 1e-4) { dx = p.x - (x * T + T / 2); dy = p.y - (y * T + T / 2); const l = Math.hypot(dx, dy) || 1; p.x += (dx / l) * r; p.y += (dy / l) * r; }
        else { p.x += (dx / d) * (r - d); p.y += (dy / d) * (r - d); }
      }
    }
  }

  // Render: pedaços de 25x25 blocos guardados como textura (barato de desenhar)
  buildLayer() {
    const root = new PIXI.Container();
    this.chunks = [];
    for (let cy = 0; cy < H / CH; cy++) for (let cx = 0; cx < W / CH; cx++) {
      const c = new PIXI.Container();
      for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
        const t = this.at(cx * CH + x, cy * CH + y);
        const s = new PIXI.Sprite(this.tx[t]); s.x = x * T; s.y = y * T; c.addChild(s);
        (this.tileSprites ??= new Map()).set((cx * CH + x) + (cy * CH + y) * W, s);
      }
      c.x = cx * CH * T; c.y = cy * CH * T;
      c.cacheAsTexture(true);
      root.addChild(c); this.chunks.push(c);
    }
    return root;
  }
  // Troca um bloco já desenhado (mato queimado/cortado etc.) e atualiza o pedaço em cache
  setTile(x, y, t) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = x + y * W; if (this.tiles[k] === t) return;
    this.tiles[k] = t;
    const s = this.tileSprites?.get(k); if (!s) return;
    s.texture = this.tx[t];
    const c = this.chunks[Math.floor(x / CH) + Math.floor(y / CH) * (W / CH)];
    (this.dirty ??= new Set()).add(c);
  }
  flushDirty() { for (const c of this.dirty ?? []) c.updateCacheTexture(); this.dirty?.clear(); }
  cullChunks(view) {
    for (const c of this.chunks) c.visible = c.x < view.x1 && c.x + CH * T > view.x0 && c.y < view.y1 && c.y + CH * T > view.y0;
  }
}
