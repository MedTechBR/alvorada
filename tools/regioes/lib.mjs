// Biblioteca do gerador das regiões: reproduz em Node as operações de pintura do motor (src/world/build.js) com a mesma
// semente do arquivo da região, para o gerador saber exatamente que bloco cai onde (e pôr objetos sem erro).
// Uso: const M = new Mapa('jandaia', [x, y, w, h]); M.ellipse('sand', ...); ... M.ops é a lista para o JSON.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(join(raiz, 'src/world/tiles.js'), 'utf8');
export const TILE = new Function('return ' + src.match(/export const TILE = (\{[\s\S]*?\n\});/)[1])();
export const CHARS = new Function('TILE', 'return ' + src.match(/export const CHARS = (\{[\s\S]*?\n\});/)[1])(TILE);
export const NAMES = Object.fromEntries(Object.entries(TILE).map(([k, v]) => [k.toLowerCase(), v]));
export const NOME_DE = Object.fromEntries(Object.entries(TILE).map(([k, v]) => [v, k.toLowerCase()]));
const SOLID = new Set(['water', 'deep', 'cliff', 'void', 'wall', 'forest', 'rock', 'mud', 'corn', 'climb', 'icewall', 'lava', 'lavawall', 'canyon', 'roots', 'templewall', 'crystalwall'].map((n) => NAMES[n]));
export const tileOf = (n) => (typeof n === 'number' ? n : NAMES[n] ?? CHARS[n] ?? TILE.GRASS);

export function hashTxt(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.3, y * 2.3, s + 9) * 0.4;

// gerador pseudoaleatório simples (para sortear posições de enfeites de forma repetível)
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export class Mapa {
  constructor(id, rect, base = 'grass') {
    this.id = id; this.rect = rect; [this.rx, this.ry, this.rw, this.rh] = rect;
    this.t = new Uint8Array(this.rw * this.rh).fill(tileOf(base));
    this.seed = 100000 + (hashTxt(id) % 50000) * 64;
    this.ops = []; this.occ = new Uint8Array(this.rw * this.rh); // occ: pegada de objetos
    this.objs = [];
  }
  dentro(x, y) { return x >= this.rx && y >= this.ry && x < this.rx + this.rw && y < this.ry + this.rh; }
  get(x, y) { return this.dentro(x, y) ? this.t[x - this.rx + (y - this.ry) * this.rw] : TILE.CLIFF; }
  nome(x, y) { return NOME_DE[this.get(x, y)]; }
  set(x, y, t) { if (this.dentro(x, y)) this.t[x - this.rx + (y - this.ry) * this.rw] = t; }
  #on(on, x, y) { return !on || on.map(tileOf).includes(this.get(x, y)); }
  #s() { return this.seed++; }
  #push(o) { this.ops.push(o); return this; }
  comment(_) { return this.#push({ op: 'comment', _ }); }
  rect_(t, x, y, w, h, on) { const T = tileOf(t); for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.#on(on, i, j)) this.set(i, j, T); return this.#push({ op: 'rect', t, x, y, w, h, ...(on ? { on } : {}) }); }
  ellipse(t, cx, cy, rx, ry, noise = 0, on) {
    const T = tileOf(t), s = this.#s();
    for (let y = Math.floor(cy - ry - 4); y <= cy + ry + 4; y++) for (let x = Math.floor(cx - rx - 4); x <= cx + rx + 4; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry) + (fbm(x * 0.15, y * 0.15, s) - 0.5) * noise;
      if (d < 1 && this.#on(on, x, y)) this.set(x, y, T);
    }
    return this.#push({ op: 'ellipse', t, cx, cy, rx, ry, ...(noise ? { noise } : {}), ...(on ? { on } : {}) });
  }
  poly(t, pts, noise = 0, on) {
    const T = tileOf(t), s = this.#s(), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    for (let y = Math.min(...ys) - 3; y <= Math.max(...ys) + 3; y++) for (let x = Math.min(...xs) - 3; x <= Math.max(...xs) + 3; x++) {
      const jx = x + (fbm(x * 0.2, y * 0.2, s) - 0.5) * noise * 2, jy = y + (fbm(x * 0.2 + 5, y * 0.2, s) - 0.5) * noise * 2;
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) if ((pts[i][1] > jy) !== (pts[j][1] > jy) && jx < ((pts[j][0] - pts[i][0]) * (jy - pts[i][1])) / (pts[j][1] - pts[i][1]) + pts[i][0]) ins = !ins;
      if (ins && this.#on(on, x, y)) this.set(x, y, T);
    }
    return this.#push({ op: 'poly', t, pts, ...(noise ? { noise } : {}), ...(on ? { on } : {}) });
  }
  border(t, x0, y0, w, h, width, noise = 0) {
    const T = tileOf(t), s = this.#s();
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const d = Math.min(x - x0, y - y0, x0 + w - 1 - x, y0 + h - 1 - y);
      if (d < width + fbm(x * 0.12, y * 0.12, s) * noise) this.set(x, y, T);
    }
    return this.#push({ op: 'border', t, x: x0, y: y0, w, h, width, noise });
  }
  path(t, pts, width = 3, wobble = 0, on) {
    const T = tileOf(t), r = width / 2, s = this.#s();
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let k = 0; k <= n; k++) {
        const f = k / n; let x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
        if (wobble) { x += (fbm(x * 0.08, y * 0.08, s) - 0.5) * wobble * 2; y += (fbm(x * 0.08 + 7, y * 0.08, s) - 0.5) * wobble * 2; }
        for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r + 0.2 && this.#on(on, xx, yy)) this.set(xx, yy, T);
      }
    }
    return this.#push({ op: 'path', t, pts, width, ...(wobble ? { wobble } : {}), ...(on ? { on } : {}) });
  }
  line(t, pts) {
    const T = tileOf(t);
    for (let i = 0; i < pts.length - 1; i++) {
      let [x0, y0] = pts[i]; const [x1, y1] = pts[i + 1];
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
      for (;;) { this.set(x0, y0, T); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    }
    return this.#push({ op: 'line', t, pts });
  }
  setPts(t, pts) { const T = tileOf(t); for (const [x, y] of pts) this.set(x, y, T); return this.#push({ op: 'set', t, pts }); }
  blobs(t, x0, y0, w, h, scale = 0.15, th = 0.6, on) {
    const T = tileOf(t), s = this.#s(), o = on ?? ['grass', 'grass2'];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (fbm(x * scale, y * scale, s) > th && this.#on(o, x, y)) this.set(x, y, T);
    return this.#push({ op: 'blobs', t, x: x0, y: y0, w, h, scale, th, ...(on ? { on } : {}) });
  }
  scatter(t, x0, y0, w, h, p, on) {
    const T = tileOf(t), s = this.#s(), o = on ?? ['grass', 'grass2'];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (hash(x, y, s) < p && this.#on(o, x, y)) this.set(x, y, T);
    return this.#push({ op: 'scatter', t, x: x0, y: y0, w, h, p, ...(on ? { on } : {}) });
  }
  stamp(x0, y0, rows, legend) {
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === ' ') return; const t = legend?.[ch] !== undefined ? tileOf(legend[ch]) : CHARS[ch]; if (t !== undefined) this.set(x0 + i, y0 + j, t); }));
    return this.#push({ op: 'stamp', x: x0, y: y0, rows, ...(legend ? { legend } : {}) });
  }

  // ---------- objetos ----------
  livre(x, y, fw = 1, fh = 1, { terra = true } = {}) {
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
      const X = x + i, Y = y + j; if (!this.dentro(X, Y)) return false;
      if (this.occ[X - this.rx + (Y - this.ry) * this.rw]) return false;
      if (terra && SOLID.has(this.get(X, Y))) return false;
      if (terra && ![TILE.GRASS, TILE.GRASS2, TILE.SAND, TILE.DARK, TILE.TALL, TILE.FLOWERS, TILE.PATH, TILE.PLAZA, TILE.WETSAND, TILE.GOLD].includes(this.get(X, Y))) return false;
    }
    return true;
  }
  ocupa(x, y, fw, fh) { for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) if (this.dentro(x + i, y + j)) this.occ[x + i - this.rx + (y + j - this.ry) * this.rw] = 1; }
  obj(o, fw = 1, fh = 1) { this.objs.push(o); this.ocupa(o.x, o.y, fw, fh); return o; }
  ascii(x0, y0, w, h) {
    const C = { grass: '.', grass2: ',', tall: '"', path: '=', water: '~', sand: ':', flowers: '*', deep: 'W', cliff: '#', stairs: '^', bridge: 'B', bridgev: 'b', plaza: 'P', forest: 'F', dark: 'd', dock: 'D', climb: 'V', wetsand: 'A', reef: '%', tide: 'T', shallow: '/', reed: '|', mud: 'L', mangmud: 'p', roots: 'R', stairup: '<', stairdown: '>', templefloor: 'E', oldstone: 'X', mosaic: 'Y', templewall: 'H' };
    const L = [];
    for (let y = y0; y < y0 + h; y++) { let s = ''; for (let x = x0; x < x0 + w; x++) { const o = this.occ[x - this.rx + (y - this.ry) * this.rw]; s += o ? '@' : C[this.nome(x, y)] ?? '?'; } L.push(s); }
    return L.join('\n');
  }
}
