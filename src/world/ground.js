import { TILE } from './tiles.js';
import { GROUND } from './art.js';

// Compositor do chão: monta, pixel a pixel, os pedaços do mapa com bordas orgânicas (autotile por campo).
// Cada camada (areia, terra, grama) tem um "campo" interpolado entre os centros dos blocos; o contorno
// aparece onde o campo cruza 0,5 e ganha borda escura, brilho, espuma na beira d'água e sombra suave.
// A água fica transparente: por baixo dela corre a camada de água animada.

const RANK = new Int8Array(32).fill(3);
for (const t of [TILE.WATER, TILE.DEEP, TILE.BRIDGE, TILE.BRIDGEV]) RANK[t] = 0;
RANK[TILE.SAND] = 1;
for (const t of [TILE.PATH, TILE.PLAZA, TILE.STAIRS, TILE.COURT]) RANK[t] = 2;
const HARD = new Uint8Array(32);
for (const t of [TILE.CLIFF, TILE.STAIRS, TILE.BRIDGE, TILE.BRIDGEV, TILE.PLAZA, TILE.FLOOR, TILE.WALL, TILE.TILEFLOOR, TILE.VOID, TILE.COURT, TILE.MAT, TILE.CAVE, TILE.ROCK, TILE.CAVEDOOR]) HARD[t] = 1;
const DARKT = new Uint8Array(32); DARKT[TILE.DARK] = 1; DARKT[TILE.FOREST] = 1;

function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
// ruído suave e repetível (64x64) para tornar as bordas orgânicas
const NOISE = new Float32Array(64 * 64);
(() => {
  const g = (x, y, s, p) => hash(((x % p) + p) % p, ((y % p) + p) % p, s);
  const smooth = (x, y, cell, s) => {
    const p = 64 / cell, X = x / cell, Y = y / cell, xi = Math.floor(X), yi = Math.floor(Y), fx = X - xi, fy = Y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = g(xi, yi, s, p), b = g(xi + 1, yi, s, p), c = g(xi, yi + 1, s, p), d = g(xi + 1, yi + 1, s, p);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) NOISE[y * 64 + x] = (smooth(x, y, 8, 1) * 0.65 + smooth(x, y, 4, 2) * 0.35) * 2 - 1;
})();

export function renderTiles(map, img, ox, oy, tx0, ty0, tw, th) {
  const d = img.data, IW = img.width;
  const at = (x, y) => map.at(x, y);
  // grade de "rank" com 1 bloco de margem
  const GW = tw + 2, GH = th + 2, R = new Int8Array(GW * GH), D = new Uint8Array(GW * GH), DP = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const t = at(tx0 + i - 1, ty0 + j - 1); R[j * GW + i] = RANK[t] ?? 3; D[j * GW + i] = DARKT[t];
    // fundo do lago/mar: média 5x5 para o degradê ficar redondo
    let n = 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) if (at(tx0 + i - 1 + a, ty0 + j - 1 + b) === TILE.DEEP) n++; DP[j * GW + i] = n * 10;
  }
  const put = (X, Y, r, g, b, a = 255) => { const k = (Y * IW + X) * 4; d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = a; };
  for (let ty = ty0; ty < ty0 + th; ty++) for (let tx = tx0; tx < tx0 + tw; tx++) {
    const t = at(tx, ty), bx = (tx - ox) * 16, by = (ty - oy) * 16;
    if (HARD[t]) { hardTile(map, t, tx, ty, (x, y, r, g, b, a) => put(bx + x, by + y, r, g, b, a)); continue; }
    const v = Math.floor(hash(tx, ty, 7) * 4);
    const gr = GROUND.grass[v], dk = GROUND.dark[v], sd = GROUND.sand[v], pt = GROUND.path[v];
    const southCliff = at(tx, ty + 1) === TILE.CLIFF;
    const rimTex = southCliff ? GROUND.rim[at(tx - 1, ty + 1) !== TILE.CLIFF ? 0 : at(tx + 1, ty + 1) !== TILE.CLIFF ? 2 : 1] : null;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const gx = tx * 16 + x, gy = ty * 16 + y;
      const u = (gx + 0.5) / 16 - 0.5, w = (gy + 0.5) / 16 - 0.5;
      const iu = Math.floor(u), iw = Math.floor(w), fu = u - iu, fw = w - iw;
      const gi = iu - tx0 + 1, gj = iw - ty0 + 1;
      const k00 = gj * GW + gi, k10 = k00 + 1, k01 = k00 + GW, k11 = k01 + 1;
      const w00 = (1 - fu) * (1 - fw), w10 = fu * (1 - fw), w01 = (1 - fu) * fw, w11 = fu * fw;
      const n = NOISE[(gy & 63) * 64 + (gx & 63)] * 0.11;
      const r00 = R[k00], r10 = R[k10], r01 = R[k01], r11 = R[k11];
      const F = (L) => (r00 >= L) * w00 + (r10 >= L) * w10 + (r01 >= L) * w01 + (r11 >= L) * w11 + n;
      const f3 = F(3), f2 = F(2), f1 = F(1);
      const p = (y * 16 + x) * 4;
      let tex, kr = 1, ov = null, alpha = 255;
      if (f3 >= 0.5) {
        const fd = D[k00] * w00 + D[k10] * w10 + D[k01] * w01 + D[k11] * w11 + n * 0.8;
        tex = fd > 0.5 ? dk : gr;
        if (f3 < 0.555) kr = 0.56; else if (f3 < 0.61) kr = 1.16;
      } else if (f2 >= 0.5) {
        tex = pt;
        if (f3 > 0.41) kr = 0.84; else if (f2 < 0.55 && f1 < 0.99) kr = 0.86;
      } else if (f1 >= 0.5) {
        tex = sd;
        if (f2 > 0.43 || f3 > 0.43) kr = 0.88;
        else if (f1 < 0.555) ov = [244, 250, 255]; else if (f1 < 0.63) kr = 0.86;
      } else {
        // água: transparente, com faixa clara na beira e escurecendo no fundo
        const fdp = (DP[k00] * w00 + DP[k10] * w10 + DP[k01] * w01 + DP[k11] * w11) / 250 + n * 0.5;
        const k = (gy * IW + gx);
        if (f1 > 0.4) { put(bx + x, by + y, 190, 232, 255, 110); }
        else if (fdp > 0.3) { const a = Math.min(1, (fdp - 0.3) * 1.6); put(bx + x, by + y, 18, 46, 110, Math.round(a * a * (3 - 2 * a) * 100)); }
        else put(bx + x, by + y, 0, 0, 0, 0);
        continue;
      }
      if (rimTex && y >= 11 && rimTex[p + 3] > 0) { put(bx + x, by + y, rimTex[p], rimTex[p + 1], rimTex[p + 2]); continue; }
      if (ov) put(bx + x, by + y, ov[0], ov[1], ov[2], alpha);
      else put(bx + x, by + y, Math.min(255, tex[p] * kr), Math.min(255, tex[p + 1] * kr), Math.min(255, tex[p + 2] * kr), alpha);
    }
  }
}

function hardTile(map, t, tx, ty, put) {
  const at = (dx, dy) => map.at(tx + dx, ty + dy);
  let src = null, src2 = null, split = -1, under = null;
  const blit = (s, f) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const p = (y * 16 + x) * 4; const c = f ? f(x, y, s, p) : null; if (c) put(x, y, c[0], c[1], c[2], c[3] ?? 255); else put(x, y, s[p], s[p + 1], s[p + 2], s[p + 3]); } };
  switch (t) {
    case TILE.CLIFF: {
      const W = at(-1, 0) !== TILE.CLIFF, E = at(1, 0) !== TILE.CLIFF;
      const c = GROUND.cliff, s = W && E ? null : W ? c[0] : E ? c[2] : c[1];
      // penhasco de dois blocos: a linha de cima é só rocha (repete a faixa de rocha da face)
      const upper = at(0, 1) === TILE.CLIFF || at(0, 1) === TILE.CAVEDOOR;
      const src = (x, y) => { const tex = s ?? (x < 8 ? c[0] : c[2]); const sy = upper ? 1 + (y % 9) : y; return [tex, (sy * 16 + x) * 4]; };
      blit(c[1], (x, y) => { const [q, p] = src(x, y); return q[p + 3] < 10 ? [96, 78, 70, 255] : [q[p], q[p + 1], q[p + 2], 255]; });
      // a borda de cima de uma face que continua para baixo é rocha, não grama
      return;
    }
    case TILE.STAIRS: blit(GROUND.stairs); return;
    case TILE.BRIDGE: {
      const N = at(0, -1) !== TILE.BRIDGE, S = at(0, 1) !== TILE.BRIDGE;
      blit(GROUND.bridgeH, (x, y) => (N && y < 2) || (S && y > 13) ? (y === 0 || y === 15 ? [70, 44, 26] : [110, 72, 42]) : null); return;
    }
    case TILE.BRIDGEV: {
      const Wb = at(-1, 0) !== TILE.BRIDGEV, Eb = at(1, 0) !== TILE.BRIDGEV;
      blit(GROUND.bridgeV, (x, y) => (Wb && x < 2) || (Eb && x > 13) ? (x === 0 || x === 15 ? [70, 44, 26] : [110, 72, 42]) : null); return;
    }
    case TILE.PLAZA: blit(GROUND.plaza[(tx + ty) & 1]); return;
    case TILE.FLOOR: blit(GROUND.floor[ty & 1]); return;
    case TILE.TILEFLOOR: blit(GROUND.tilefloor); return;
    case TILE.MAT: { const f = GROUND.floor[ty & 1], m = GROUND.mat; blit(f, (x, y, s, p) => m[p + 3] > 0 ? [m[p], m[p + 1], m[p + 2]] : null); return; }
    case TILE.WALL: blit(at(0, 1) === TILE.WALL || at(0, 1) === TILE.VOID ? GROUND.walltop : GROUND.wall); return;
    case TILE.COURT: blit(GROUND.court); return;
    case TILE.CAVE: blit(GROUND.cave[(tx * 7 + ty * 3) % 3]); return;
    case TILE.ROCK: blit(at(0, 1) === TILE.ROCK || at(0, 1) === TILE.VOID ? GROUND.rocktop : GROUND.rockface); return;
    case TILE.CAVEDOOR: blit(GROUND.cavedoor); return;
    default: blit(GROUND.void);
  }
}
