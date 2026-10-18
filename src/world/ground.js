import { TILE } from './tiles.js';
import { GROUND } from './art.js';
import { FAM, SOFT, BLEED, drawBiomeHard, famBuf, warmTile } from './arte-biomas.js';

// Compositor do chão: monta, pixel a pixel, os pedaços do mapa com bordas orgânicas (autotile por campo).
// Cada camada (areia, terra, grama) tem um "campo" interpolado entre os centros dos blocos; o contorno
// aparece onde o campo cruza 0,5 e ganha borda escura, brilho, espuma na beira d'água e sombra suave.
// A água fica transparente: por baixo dela corre a camada de água animada.

const RANK = new Int8Array(256).fill(3);
for (const t of [TILE.WATER, TILE.DEEP, TILE.BRIDGE, TILE.BRIDGEV]) RANK[t] = 0;
RANK[TILE.SAND] = 1;
for (const t of [TILE.PATH, TILE.PLAZA, TILE.STAIRS, TILE.COURT, TILE.CORN, TILE.MUD]) RANK[t] = 2;
RANK[TILE.DOCK] = 0;
const HARD = new Uint8Array(256);
for (const t of [TILE.CLIFF, TILE.STAIRS, TILE.BRIDGE, TILE.BRIDGEV, TILE.PLAZA, TILE.FLOOR, TILE.WALL, TILE.TILEFLOOR, TILE.VOID, TILE.COURT, TILE.MAT, TILE.CAVE, TILE.ROCK, TILE.CAVEDOOR, TILE.MUD, TILE.CLIMB, TILE.WEBG, TILE.WEBS, TILE.SNOW, TILE.DOCK]) HARD[t] = 1;
const DARKT = new Uint8Array(256); DARKT[TILE.DARK] = 1; DARKT[TILE.FOREST] = 1;
const GOLDT = new Uint8Array(256); GOLDT[TILE.GOLD] = 1;
// biomas novos: família de cada bloco (0 = a de sempre: grama, trilha, areia ou água conforme a camada)
// pontes e píer são neutros (não puxam água para dentro de uma poça de lava)
const FAMT = new Uint8Array(256), NEUTRAL = 255, FAMS = [];
for (const f of Object.values(FAM)) FAMS[f.id] = f;
for (const [t, name] of Object.entries(SOFT)) { RANK[t] = FAM[name].rank; FAMT[t] = FAM[name].id; }
for (const [t, [name, r]] of Object.entries(BLEED)) { RANK[t] = r; FAMT[t] = FAM[name].id; }
for (const t of [TILE.BRIDGE, TILE.BRIDGEV, TILE.DOCK]) FAMT[t] = NEUTRAL;
for (const t of [TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S]) RANK[t] = 0;
for (const t of [TILE.ICEWALL, TILE.ICEFLOOR, TILE.LAVAWALL, TILE.LAVAFLOOR, TILE.CANYON, TILE.ROOTS, TILE.TEMPLEFLOOR, TILE.MOSAIC, TILE.OLDSTONE,
  TILE.TEMPLEWALL, TILE.STAIRUP, TILE.STAIRDOWN, TILE.HOLE, TILE.CRACK, TILE.DARKCAVE, TILE.CRYSTALFLOOR, TILE.CRYSTALWALL, TILE.RAIL]) HARD[t] = 1;

const KS = new Int32Array(4), WS = new Float32Array(4);
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
  const GW = tw + 2, GH = th + 2, R = new Int8Array(GW * GH), D = new Uint8Array(GW * GH), DP = new Uint8Array(GW * GH), GD = new Uint8Array(GW * GH), FM = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const t = at(tx0 + i - 1, ty0 + j - 1); R[j * GW + i] = RANK[t] ?? 3; D[j * GW + i] = DARKT[t]; GD[j * GW + i] = GOLDT[t]; FM[j * GW + i] = FAMT[t];
    // fundo do lago/mar: média 5x5 para o degradê ficar redondo
    let n = 0; for (let b = -2; b <= 2; b++) for (let a = -2; a <= 2; a++) if (at(tx0 + i - 1 + a, ty0 + j - 1 + b) === TILE.DEEP) n++; DP[j * GW + i] = n * 10;
  }
  const put = (X, Y, r, g, b, a = 255) => { const k = (Y * IW + X) * 4; d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = a; };
  for (let ty = ty0; ty < ty0 + th; ty++) for (let tx = tx0; tx < tx0 + tw; tx++) {
    const t = at(tx, ty), bx = (tx - ox) * 16, by = (ty - oy) * 16;
    if (HARD[t]) { hardTile(map, t, tx, ty, (x, y, r, g, b, a) => put(bx + x, by + y, r, g, b, a)); continue; }
    const v = Math.floor(hash(tx, ty, 7) * 4);
    const gr = GROUND.grass[v], dk = GROUND.dark[v], gd = GROUND.gold[v], sd = GROUND.sand[v], pt = GROUND.path[v];
    const isC = (t) => t === TILE.CLIFF || t === TILE.CLIMB;
    const southCliff = isC(at(tx, ty + 1));
    const rimTex = southCliff ? GROUND.rim[!isC(at(tx - 1, ty + 1)) ? 0 : !isC(at(tx + 1, ty + 1)) ? 2 : 1] : null;
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
      const f4 = F(4), f3 = F(3), f2 = F(2), f1 = F(1);
      const p = (y * 16 + x) * 4;
      let tex, kr = 1, ov = null, alpha = 255;
      // biomas: família vencedora na camada vencedora (só entre os cantos dessa camada)
      const L = f4 >= 0.5 ? 4 : f3 >= 0.5 ? 3 : f2 >= 0.5 ? 2 : f1 >= 0.5 ? 1 : 0;
      let fa = 0, fb = -9;
      KS[0] = k00; KS[1] = k10; KS[2] = k01; KS[3] = k11; WS[0] = w00; WS[1] = w10; WS[2] = w01; WS[3] = w11;
      for (let q = 0; q < 4; q++) {
        const kq = KS[q]; if (R[kq] !== L) continue;
        const id = FM[kq]; if (id === NEUTRAL) continue;
        let dup = false; for (let q2 = 0; q2 < q; q2++) if (R[KS[q2]] === L && FM[KS[q2]] === id) dup = true;
        if (dup) continue;
        let tot = id ? NOISE[((gy + id * 29) & 63) * 64 + ((gx + id * 17) & 63)] * 0.3 : 0;
        for (let q2 = q; q2 < 4; q2++) if (R[KS[q2]] === L && FM[KS[q2]] === id) tot += WS[q2];
        if (tot > fb) { fb = tot; fa = id; }
      }
      if (fa) {
        const Fm = FAMS[fa], fb = Fm.buf ?? famBuf(Fm), q = (((gy & 255) << 8) + (gx & 255)) * 4; let c = [fb[q], fb[q + 1], fb[q + 2], fb[q + 3]];
        if (L === 4) {
          // monte de neve: lado de cima claro, lado de baixo com sombra azulada (gradiente do campo na vertical)
          const gyF = ((r01 >= 4) - (r00 >= 4)) * (1 - fu) + ((r11 >= 4) - (r10 >= 4)) * fu;
          if (f4 < 0.56) c = gyF < -0.2 ? Fm.rim : [228, 236, 248];
          else if (gyF < -0.2 && f4 < 0.8) c = [c[0] * 0.9, c[1] * 0.93, c[2] * 0.98];
          else if (gyF > 0.2 && f4 < 0.68) c = Fm.hi;
        } else if (L === 3) { if (f3 < 0.555) c = Fm.rim; else if (f3 < 0.61) c = Fm.hi ?? c; else if (f4 > 0.38) { const gyF = ((r01 >= 4) - (r00 >= 4)) * (1 - fu) + ((r11 >= 4) - (r10 >= 4)) * fu; if (gyF < 0) c = [c[0] * 0.84, c[1] * 0.87, c[2] * 0.95]; } }
        else if (L === 2) { if (f3 > 0.41) c = [c[0] * 0.84, c[1] * 0.84, c[2] * 0.84]; else if (f2 < 0.55 && f1 < 0.99) c = Fm.rim; }
        else if (L === 1) { if (f2 > 0.43 || f3 > 0.43) c = [c[0] * 0.88, c[1] * 0.88, c[2] * 0.88]; else if (f1 < 0.555) c = Fm.foam ? (Fm.foam === true ? [244, 250, 255] : Fm.foam) : Fm.rim; else if (f1 < 0.63) c = [c[0] * 0.88, c[1] * 0.88, c[2] * 0.88]; }
        else if (Fm.shore) { for (const [lim, col] of Fm.shore) if (f1 > lim) { c = col; break; } }
        put(bx + x, by + y, Math.min(255, c[0]), Math.min(255, c[1]), Math.min(255, c[2]), c[3] ?? 255);
        continue;
      }
      if (L === 4) { put(bx + x, by + y, 240, 246, 255); continue; }
      if (f3 >= 0.5) {
        const fd = D[k00] * w00 + D[k10] * w10 + D[k01] * w01 + D[k11] * w11 + n * 0.8;
        const fg = GD[k00] * w00 + GD[k10] * w10 + GD[k01] * w01 + GD[k11] * w11 + n * 0.8;
        tex = fd > 0.5 ? dk : fg > 0.5 ? gd : gr;
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
      const isC = (t) => t === TILE.CLIFF || t === TILE.CLIMB, W = !isC(at(-1, 0)), E = !isC(at(1, 0));
      const c = GROUND.cliff, s = W && E ? null : W ? c[0] : E ? c[2] : c[1];
      // penhasco de dois blocos: a linha de cima é só rocha (repete a faixa de rocha da face)
      const upper = at(0, 1) === TILE.CLIFF || at(0, 1) === TILE.CAVEDOOR || at(0, 1) === TILE.CLIMB;
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
    case TILE.MUD: blit(GROUND.mud[(tx + ty * 3) & 1]); return;
    case TILE.WEBG: blit(GROUND.webg); return;
    case TILE.WEBS: blit(GROUND.webs); return;
    case TILE.SNOW: blit(GROUND.snow[(tx * 5 + ty) & 1]); return;
    case TILE.DOCK: blit(GROUND.bridgeV); return;
    case TILE.CLIMB: {
      // paredão com trepadeira: face de penhasco (rocha) com cipós por cima
      const c = GROUND.cliff[1], v = GROUND.climbVine, upper = at(0, 1) === TILE.CLIMB || at(0, 1) === TILE.CLIFF;
      blit(c, (x, y) => { const sy = upper ? 1 + (y % 9) : y, p = (sy * 16 + x) * 4, q = (y * 16 + x) * 4; if (v[q + 3] > 0) return [v[q], v[q + 1], v[q + 2], 255]; return c[p + 3] < 10 ? [96, 78, 70, 255] : [c[p], c[p + 1], c[p + 2], 255]; });
      return;
    }
    default: if (!drawBiomeHard(t, at, tx, ty, put)) blit(GROUND.void);
  }
}

// Assa aos poucos (um por vez, nas folgas) as texturas dos biomas que o mapa usa, para o primeiro setor
// de cada bioma não engasgar o jogo
export function prewarm(map) {
  const seen = new Set(); for (let i = 0; i < map.tiles.length; i += 7) seen.add(map.tiles[i]);
  const list = [...new Set([...seen].map((t) => FAMS[FAMT[t]]).filter((f) => f && !f.buf))].map((f) => () => famBuf(f));
  for (const t of seen) list.push(() => warmTile(t));
  const step = () => { const f = list.shift(); if (!f) return; f(); if (window.requestIdleCallback) requestIdleCallback(step, { timeout: 500 }); else setTimeout(step, 60); };
  setTimeout(step, 1500);
}
