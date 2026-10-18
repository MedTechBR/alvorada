import { TILE, CHARS, NAMES, SOLID } from './tiles.js';
import { KINDS } from './objects.js';

// Interpreta o mapa em JSON (assets/maps/alvorada.json) e devolve blocos, objetos e pontos da região.
//
// Formato (resumo; ver também o README da pasta assets/maps):
//   w, h            tamanho em blocos de 16 px
//   base            tipo de bloco inicial ("grass")
//   ops             operações de pintura, na ordem:
//     rect {t,x,y,w,h} · ellipse {t,cx,cy,rx,ry,noise} · poly {t,pts,noise} · border {t,x,y,w,h,width,noise}
//     path {t,pts,width,wobble} · line {t,pts} · set {t,pts} · blobs {t,x,y,w,h,scale,th,on}
//     scatter {t,x,y,w,h,p,on} · stamp {x,y,rows,legend} (um caractere por bloco; espaço = não muda)
//     trees {x,y,w,h,p,kinds,on} (árvores soltas) · fence {x,y,len,dir,white}
//   objects         [{kind,x,y,...}] (catálogo em objects.js; "door" liga a um interior)
//   interiors       [{id,name,x,y,rows,objects,spots}] (salas desenhadas em texto, numa faixa isolada do mapa)
//   areas           [{name,biome,rect:[x,y,w,h]} ou {ellipse:[cx,cy,rx,ry]}] (a última que contém o ponto vence)
//   spots, signs, items, decor, cave
const tileOf = (name) => (typeof name === 'number' ? name : NAMES[name] ?? CHARS[name] ?? TILE.GRASS);

function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, s) => vnoise(x, y, s) * 0.6 + vnoise(x * 2.3, y * 2.3, s + 9) * 0.4;

export function buildRegion(J) {
  const W = J.w, H = J.h;
  const tiles = new Uint8Array(W * H).fill(tileOf(J.base ?? 'grass'));
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const get = (x, y) => (inb(x, y) ? tiles[x + y * W] : TILE.CLIFF);
  const set = (x, y, t) => { if (inb(x, y)) tiles[x + y * W] = t; };
  const onOk = (on, x, y) => !on || on.map(tileOf).includes(get(x, y));
  let seed = 1;
  const objects = [], decor = [];

  const ops = {
    rect(o) { const t = tileOf(o.t); for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (onOk(o.on, x, y)) set(x, y, t); },
    ellipse(o) {
      const t = tileOf(o.t), s = seed++, nz = o.noise ?? 0;
      for (let y = Math.floor(o.cy - o.ry - 4); y <= o.cy + o.ry + 4; y++) for (let x = Math.floor(o.cx - o.rx - 4); x <= o.cx + o.rx + 4; x++) {
        const d = Math.hypot((x - o.cx) / o.rx, (y - o.cy) / o.ry) + (fbm(x * 0.15, y * 0.15, s) - 0.5) * nz;
        if (d < 1 && onOk(o.on, x, y)) set(x, y, t);
      }
    },
    poly(o) {
      const t = tileOf(o.t), p = o.pts, s = seed++, nz = o.noise ?? 0;
      const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
      for (let y = Math.min(...ys) - 3; y <= Math.max(...ys) + 3; y++) for (let x = Math.min(...xs) - 3; x <= Math.max(...xs) + 3; x++) {
        const jx = x + (fbm(x * 0.2, y * 0.2, s) - 0.5) * nz * 2, jy = y + (fbm(x * 0.2 + 5, y * 0.2, s) - 0.5) * nz * 2;
        let ins = false;
        for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > jy) !== (p[j][1] > jy) && jx < ((p[j][0] - p[i][0]) * (jy - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) ins = !ins;
        if (ins && onOk(o.on, x, y)) set(x, y, t);
      }
    },
    border(o) {
      const t = tileOf(o.t), s = seed++;
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
        const d = Math.min(x - o.x, y - o.y, o.x + o.w - 1 - x, o.y + o.h - 1 - y);
        if (d < o.width + fbm(x * 0.12, y * 0.12, s) * (o.noise ?? 0)) set(x, y, t);
      }
    },
    path(o) {
      const t = tileOf(o.t), r = (o.width ?? 3) / 2, s = seed++, wob = o.wobble ?? 0;
      for (let i = 0; i < o.pts.length - 1; i++) {
        const [x0, y0] = o.pts[i], [x1, y1] = o.pts[i + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
        for (let k = 0; k <= n; k++) {
          const f = k / n; let x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f;
          if (wob) { x += (fbm(x * 0.08, y * 0.08, s) - 0.5) * wob * 2; y += (fbm(x * 0.08 + 7, y * 0.08, s) - 0.5) * wob * 2; }
          for (let yy = Math.floor(y - r); yy <= y + r; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r + 0.2 && onOk(o.on, xx, yy)) set(xx, yy, t);
        }
      }
    },
    line(o) {
      const t = tileOf(o.t);
      for (let i = 0; i < o.pts.length - 1; i++) {
        let [x0, y0] = o.pts[i]; const [x1, y1] = o.pts[i + 1];
        const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
        for (;;) { set(x0, y0, t); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
      }
    },
    set(o) { const t = tileOf(o.t); for (const [x, y] of o.pts) set(x, y, t); },
    blobs(o) {
      const t = tileOf(o.t), s = seed++, sc = o.scale ?? 0.15, th = o.th ?? 0.6;
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (fbm(x * sc, y * sc, s) > th && onOk(o.on ?? ['grass', 'grass2'], x, y)) set(x, y, t);
    },
    scatter(o) {
      const t = tileOf(o.t), s = seed++;
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (hash(x, y, s) < o.p && onOk(o.on ?? ['grass', 'grass2'], x, y)) set(x, y, t);
    },
    stamp(o) {
      const lg = o.legend ?? {};
      o.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === ' ') return; const t = lg[ch] !== undefined ? tileOf(lg[ch]) : CHARS[ch]; if (t !== undefined) set(o.x + i, o.y + j, t); }));
    },
    trees(o) { treeOps.push(o); },
    comment() {},
    fence(o) {
      const v = o.dir === 'v', kind = (o.white ? 'wfence' : 'fence') + (v ? 'V' : '');
      for (let i = 0; i < o.len; i++) objects.push({ kind, x: o.x + (v ? 0 : i), y: o.y + (v ? i : 0), end: i === 0 ? 'L' : i === o.len - 1 ? 'R' : 'M' });
    },
  };
  const treeOps = [];
  for (const o of J.trees ?? []) treeOps.push(o);
  for (const o of J.ops ?? []) { if (!ops[o.op]) { console.warn('op desconhecida', o); continue; } ops[o.op](o); }

  // interiores: salas desenhadas em texto
  for (const r of J.interiors ?? []) {
    ops.stamp({ x: r.x, y: r.y, rows: r.rows });
    for (const o of r.objects ?? []) objects.push({ ...o, x: r.x + o.x, y: r.y + o.y });
    for (const d of r.decor ?? []) decor.push({ ...d, x: r.x + d.x, y: r.y + d.y });
  }

  // objetos declarados (posição absoluta)
  for (const o of J.objects ?? []) objects.push({ ...o });
  // decoração: com w/h preenche um retângulo (ex.: lavoura de trigo)
  for (const d of J.decor ?? []) { if (d.w) { for (let y = d.y; y < d.y + d.h; y++) for (let x = d.x; x < d.x + d.w; x++) decor.push({ kind: d.kind, x, y }); } else decor.push({ ...d }); }

  // ocupação (pegadas)
  const block = new Uint8Array(W * H);
  const free = (x, y, fw, fh) => { for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) { const k = x + i + (y + j) * W; if (!inb(x + i, y + j) || block[k] || SOLID.has(tiles[k]) || tiles[k] === TILE.PATH || tiles[k] === TILE.PLAZA || tiles[k] === TILE.STAIRS) return false; } return true; };
  const occupy = (o) => {
    const K = KINDS[o.kind]; if (!K) { console.warn('objeto desconhecido', o.kind); return false; }
    o.fw = K.fw; o.fh = K.fh; o.cells = [];
    const cells = K.solidCells ?? null;
    for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) {
      if (cells && !cells.some(([a, b]) => a === i && b === j)) continue;
      if (K.door !== undefined && j === K.fh - 1 && i === K.door) continue;
      const k = o.x + i + (o.y + j) * W; if (inb(o.x + i, o.y + j)) { block[k] = 1; o.cells.push(k); }
    }
    if (K.door !== undefined) { o.doorX = o.x + K.door; o.doorY = o.y + K.fh - 1; }
    if (K.breakable) { o.breakable = true; o.hp = K.hp; }
    if (K.berry) o.berry = K.berry;
    return true;
  };
  const placed = [];
  for (const o of objects) if (occupy(o)) placed.push(o);

  // árvores soltas
  for (const o of treeOps) {
    const s = seed++, kinds = o.kinds ?? ['tree'];
    for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
      if (hash(x, y, s) >= o.p || !onOk(o.on ?? ['grass', 'grass2', 'dark'], x, y)) continue;
      const kind = kinds[Math.floor(hash(x, y, s + 1) * kinds.length)], K = KINDS[kind];
      if (!free(x - 1, y - 1, K.fw + 2, K.fh + 1)) continue;
      const t = { kind, x, y }; if (occupy(t)) placed.push(t);
    }
  }
  // floresta densa: árvores em grade sobre os blocos FOREST (fileiras alternadas)
  const fk = J.forestKinds ?? ['tree', 'pine', 'tree2', 'pine2'];
  for (let y = 0; y < H; y += 2) for (let x = (y / 2) % 2; x < W - 1; x += 2) {
    if (get(x, y) !== TILE.FOREST || get(x + 1, y) !== TILE.FOREST) continue;
    const zone = J.forestZones?.find((z) => x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h);
    const ks = zone?.kinds ?? fk;
    placed.push({ kind: ks[Math.floor(hash(x, y, 77) * ks.length)], x, y, fw: 2, fh: 1, cells: [], forest: true });
  }
  return { W, H, tiles, block, objects: placed, decor };
}
