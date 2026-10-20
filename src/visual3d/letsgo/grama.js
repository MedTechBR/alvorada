import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { hash } from '../ambiente/ruido.js';

// Mato alto, tufinhos de grama e flores do estilo Let's Go, montados por setor numa malha só (um draw call).
//   mato alto (encontros): moita densa de lâminas lisas, verde fundo no pé e claro na ponta; balança com o vento e
//     sacode quando alguém passa (mesmos atributos do mato de setores.js: aTopo, aFase, aBal; s.matoTiles);
//   grama comum: tufinhos baixos e esparsos (mais na beira das trilhas), como no Let's Go;
//   canteiros (bloco de flores): buquês de florzinhas fofas de várias cores.
const lin = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const MATO = {
  [TILE.TALL]: { n: 15, h: [12, 18], w: 3.6, pe: lin('#2c7428'), ponta: lin('#7cc84c') },
  [TILE.CORN]: { n: 7, h: [22, 30], w: 6, pe: lin('#5a9a32'), ponta: lin('#c8dc78'), espiga: lin('#f2c848') },
  [TILE.REED]: { n: 10, h: [16, 24], w: 2.6, pe: lin('#4a7a3a'), ponta: lin('#b8c87a') },
  [TILE.TALLSNOW]: { n: 13, h: [11, 16], w: 3.4, pe: lin('#3a6a4a'), ponta: lin('#e8f2f4') },
  [TILE.TALLDRY]: { n: 12, h: [11, 16], w: 3.4, pe: lin('#8a7a3a'), ponta: lin('#e0c878') },
};
const GRAMA = new Uint8Array(256); for (const t of [TILE.GRASS, TILE.GRASS2, TILE.DARK, TILE.GOLD]) GRAMA[t] = 1;
const FLORES = ['#ff4f8a', '#ffd23a', '#fff4f0', '#a456ff', '#4fa4ff', '#ff7a2a'].map(lin);
const MIOLO = lin('#ffe27a');

export function materialGramaLG(v) {
  const u = v.u;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tempo = u.tempo;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n attribute float aTopo; attribute float aFase; attribute float aBal; uniform float tempo;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float vento = sin(tempo * 1.5 + aFase) * 1.2 + sin(tempo * 3.3 + aFase * 2.3) * 0.4;
        transformed.x += aTopo * (vento + sin(tempo * 26.0) * aBal * 5.0);
        transformed.z += aTopo * sin(tempo * 1.1 + aFase * 1.7) * 0.5;`);
  };
  m.customProgramCacheKey = () => 'lg-grama';
  return m;
}

export function geometriaGramaLG(v, s) {
  const L = v.L, alt = (x, y) => v.altura(x, y), ox = s.sx * 16, oy = s.sy * 16;
  const P = [], N = [], C = [], I = [], TOP = [], FA = [], BA = [], tiles = new Map();
  const vert = (x, y, z, n, c, topo, fase) => { P.push(x, y, z); N.push(...n); C.push(...c); TOP.push(topo); FA.push(fase); BA.push(0); return P.length / 3 - 1; };
  const UP = [0, 1, 0];
  // lâmina: base larga no chão, ponta inclinada; cores pé -> ponta
  const lamina = (bx, bz, h, w, ang, inc, pe, ponta, fase, k = 1) => {
    const y = alt(bx, bz) - 0.4, ca = Math.cos(ang), sa = Math.sin(ang);
    const a = vert(bx - ca * w / 2, y, bz - sa * w / 2, UP, pe.map((q) => q * k), 0, fase);
    const b = vert(bx + ca * w / 2, y, bz + sa * w / 2, UP, pe.map((q) => q * k), 0, fase);
    const c = vert(bx + Math.cos(ang + 1.57) * inc, y + h, bz + Math.sin(ang + 1.57) * inc, UP, ponta.map((q) => q * k), 1, fase);
    I.push(a, b, c);
  };
  const misturar = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = ox + i, y = oy + j; if (x >= L.w || y >= L.h) continue;
    const t = L.bloco(x, y), H = (k) => hash(x, y, k), fase = x * 0.7 + y * 0.31;
    const M = MATO[t];
    if (M) {
      const first = P.length / 3;
      for (let q = 0; q < M.n; q++) {
        const bx = x * 16 + 1 + H(q * 3 + 1) * 14, bz = y * 16 + 2 + H(q * 3 + 2) * 13, h = M.h[0] + H(q * 3 + 3) * (M.h[1] - M.h[0]);
        const k = 0.82 + H(q + 60) * 0.3;
        lamina(bx, bz, h, M.w * (0.8 + H(q + 40) * 0.5), H(q + 20) * 6.28, (H(q + 30) - 0.5) * 7, M.pe, misturar(M.ponta, M.pe, H(q + 50) * 0.35), fase, k);
        if (M.espiga && q % 3 === 0) { const ex = bx + 1, ez = bz + 1, ey = alt(ex, ez) + h * 0.6, a = vert(ex - 1.6, ey, ez, UP, M.espiga, 0.6, fase), b = vert(ex + 1.6, ey, ez, UP, M.espiga, 0.6, fase), c = vert(ex, ey + 7, ez + 0.5, UP, M.espiga, 0.9, fase); I.push(a, b, c); }
      }
      tiles.set(x + y * L.w, [first, P.length / 3 - first]);
      continue;
    }
    if (t === TILE.FLOWERS && !L.ocupado(x, y)) {
      // buquês: florzinhas fofas (octaedro achatado) em hastes curtas
      const n = 6 + Math.floor(H(5) * 3);
      for (let q = 0; q < n; q++) {
        const fx = x * 16 + 1 + H(q * 7 + 11) * 14, fz = y * 16 + 1 + H(q * 7 + 12) * 14, fh = 3.5 + H(q * 7 + 13) * 4, cor = FLORES[Math.floor(H(q * 7 + 14) * FLORES.length)];
        const r = 2.4 + H(q * 7 + 15) * 1.1, base = alt(fx, fz) - 0.3, cy = base + fh;
        lamina(fx, fz, fh, 1.4, H(q) * 6.28, 0.5, lin('#3a8a36'), lin('#4fa83c'), fase);
        const pts = [[fx + r, cy, fz], [fx, cy, fz + r], [fx - r, cy, fz], [fx, cy, fz - r]], top = [fx, cy + r * 0.55, fz], bot = [fx, cy - r * 0.5, fz];
        for (let e = 0; e < 4; e++) {
          const a = pts[e], b = pts[(e + 1) % 4];
          const na = [(a[0] - fx) / r, 0.3, (a[2] - fz) / r], nb = [(b[0] - fx) / r, 0.3, (b[2] - fz) / r];
          const ia = vert(...a, na, cor, 0.5, fase), ib = vert(...b, nb, cor, 0.5, fase), it = vert(...top, UP, MIOLO, 0.55, fase), id = vert(...bot, [0, -1, 0], cor.map((c) => c * 0.6), 0.45, fase);
          I.push(ia, it, ib, ia, ib, id);
        }
      }
      continue;
    }
    if (t === TILE.WATER && H(77) < 0.06 && L.bioma(x * 16, y * 16) !== 'praia') {
      // vitória-régia: disco achatado com um corte, às vezes com flor
      let terra = false; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (L.blocoCru(x + a, y + b) !== TILE.WATER && L.blocoCru(x + a, y + b) !== TILE.DEEP) terra = true;
      if (terra) {
        const cx = x * 16 + 5 + H(78) * 6, cz = y * 16 + 5 + H(79) * 6, hy = Math.min(v.relevo.n(x, y), v.relevo.s(x, y)) - 1.5, r = 4 + H(80) * 2, a0 = H(81) * 6.28;
        const c0 = vert(cx, hy, cz, UP, lin('#5cb44e'), 0, 0);
        const borda = []; for (let k = 0; k <= 8; k++) { const a = a0 + 0.5 + (k / 8) * (Math.PI * 2 - 0.6); borda.push(vert(cx + Math.cos(a) * r, hy, cz + Math.sin(a) * r * 0.9, UP, lin('#3a8a3e'), 0, 0)); }
        for (let k = 0; k < 8; k++) I.push(c0, borda[k + 1], borda[k]);
        if (H(82) < 0.35) { const fy = hy + 1.5, p0 = vert(cx - 1.6, fy, cz, UP, lin('#ff9ac4'), 0, 0), p1 = vert(cx + 1.6, fy, cz, UP, lin('#ff9ac4'), 0, 0), p2 = vert(cx, fy, cz - 1.6, UP, lin('#ffd0e4'), 0, 0), p3 = vert(cx, fy, cz + 1.6, UP, lin('#ff9ac4'), 0, 0), p4 = vert(cx, fy + 1.4, cz, UP, lin('#ffe27a'), 0, 0); I.push(p0, p3, p4, p3, p1, p4, p1, p2, p4, p2, p0, p4); }
      }
      continue;
    }
    if (!GRAMA[t] || L.ocupado(x, y)) continue;
    // tufinhos: mais perto das trilhas e das coisas
    let beira = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (!GRAMA[L.bloco(x + a, y + b)]) beira++;
    const n = beira ? 1 + Math.floor(H(1) * 2.5) : H(2) < 0.4 ? 1 : 0;
    const escura = t === TILE.GRASS2 || t === TILE.DARK ? 0.75 : 1;
    for (let q = 0; q < n; q++) {
      const bx = x * 16 + 2 + H(30 + q) * 12, bz = y * 16 + 2 + H(40 + q) * 12, tom = (0.85 + H(60 + q) * 0.3) * escura;
      for (let l = 0; l < 3; l++) lamina(bx + (l - 1) * 1.6, bz + (l % 2), 4 + H(70 + q * 3 + l) * 3.5, 2, H(80 + q * 3 + l) * 6.28, (l - 1) * 1.2, lin('#4c9e3a'), lin('#a6e070'), fase, tom);
    }
    // uma flor solta aqui e ali
    if (H(90) < 0.05) {
      const fx = x * 16 + 8, fz = y * 16 + 8, cor = FLORES[Math.floor(H(91) * FLORES.length)], cy = alt(fx, fz) + 4, r = 1.8;
      lamina(fx, fz, 4, 1.2, 0, 0, lin('#3a8a36'), lin('#4fa83c'), fase);
      const a = vert(fx - r, cy, fz, UP, cor, 0.4, fase), b = vert(fx + r, cy, fz, UP, cor, 0.4, fase), c = vert(fx, cy, fz - r, UP, cor, 0.4, fase), d = vert(fx, cy, fz + r, UP, cor, 0.4, fase), e = vert(fx, cy + 1, fz, UP, MIOLO, 0.45, fase);
      I.push(a, d, e, d, b, e, b, c, e, c, a, e);
    }
  }
  if (!I.length) { s.matoTiles = null; return null; }
  s.matoTiles = tiles;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aTopo', new THREE.Float32BufferAttribute(TOP, 1));
  g.setAttribute('aFase', new THREE.Float32BufferAttribute(FA, 1));
  const b = new THREE.Float32BufferAttribute(BA, 1); b.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aBal', b);
  g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
  g.computeBoundingSphere();
  return g;
}
