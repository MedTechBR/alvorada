import { redonda, CASCA, topoDe } from './modelos.js';
import { segmento, elipse } from './modelos-util.js';
// Modelos lisos do grupo "natureza-a" (estilo Let's Go): árvores, palmeiras, cactos e plantas.
// Mesma pegada e altura dos tipos do kit voxel (src/visual3d/kit/natureza.js e vestir.js). Ver docs/letsgo-modelos.md.

const cz = -8;
const NEVE = '#f4f8ff', NEVE_S = '#d6e2f2';
const TRONCO = (cs = CASCA) => ({ pe: cs[0], topo: cs[2] });

// ---------- palmeiras ----------
// fronda: elipse partindo de (ox, oy, oz) na direção a (azimute) e inclinação rz; devolve o ponto final
function fronda(m, ox, oy, oz, a, rz, len, wid, cor, d = 0) {
  const cr = Math.cos(rz), x = ox + cr * Math.cos(a) * len / 2, y = oy + Math.sin(rz) * len / 2, z = oz - cr * Math.sin(a) * len / 2;
  elipse(m, x, y, z, len / 2, 1.2, wid, 0, a, rz, cor, { d, ao: false });
  return [ox + 2 * (x - ox), oy + 2 * (y - oy), oz + 2 * (z - oz)];
}
function palmaLG({ h, curva = 0, folhas = 7, L = 18, pal = ['#2a9a42', '#6cd060'], gomo = ['#8a5a34', '#c0905e'], cocos = true, tr = 3.2, duas = true }) {
  return (m, c) => {
    const n = 5, r = m.r, P = (k) => [Math.sin(k * 1.6) * curva, h * k, cz], rad = (k) => tr * (1 - 0.34 * k);
    for (let i = 0; i < n; i++) segmento(m, P(i / n), P((i + 1) / n), rad(i / n) * 1.1, rad((i + 1) / n) * 0.96, 7, { pe: gomo[0], topo: gomo[1] }, { desvio: 0.6 });
    const [tx, ty] = P(1);
    m.bola(tx, ty + 0.5, cz, 4.4, 3.4, 4.4, { pe: '#3a8a40', topo: '#7ad060' }, { d: 1, ao: false });
    for (let k = 0; k < folhas; k++) {
      const a = (k / folhas) * Math.PI * 2 + c.v * 0.5 + (r() - 0.5) * 0.3, len = L * 1.2 * (0.9 + r() * 0.2), cor = { pe: pal[0], topo: pal[1] };
      if (duas) { const e = fronda(m, tx, ty + 1, cz, a, 0.45, len * 0.42, 2.6, cor); fronda(m, e[0], e[1], e[2], a, -0.75, len * 0.62, 2.4, cor); }
      else fronda(m, tx, ty + 1, cz, a, k % 2 ? 0.05 : -0.45, len, 3.2, cor);
    }
    if (cocos) for (const [dx, dz] of [[-2.8, 2], [2.8, 2.2], [0, 4]]) m.bola(tx + dx, ty - 2.2, cz + dz, 2, 2, 2, { pe: '#6a4a22', topo: '#a07a3a' }, { d: 0, ao: false });
    return topoDe(ty + 4, 8, cz);
  };
}

// ---------- coníferas com neve ----------
function coniferaNeve({ h, R, pal, andares = 3, tr = 2.4 }) {
  return (m) => {
    const base = h * 0.13, H = (h - base) / (andares * 0.85 + 0.25);
    m.cil(0, 0, cz, tr * 1.2, tr, base + 6, 6, { pe: CASCA[0], topo: CASCA[1] });
    for (let i = 0; i < andares; i++) {
      const k = i / andares, w = R * (1.1 - k * 0.6), y0 = base + i * H * 0.85, hh = H * 1.05;
      // saia do andar (faixa escura) + cone verde + manto de neve um pouco mais largo que o cone
      m.cil(0, y0, cz, w, w * 0.96, 2.2, 14, { pe: pal[0], topo: pal[0] }, { ao: false });
      m.cone(0, y0 + 2.2, cz, w * 0.97, hh - 2.2, 14, { pe: pal[0], topo: pal[1] }, { var: 0.06, ao: false });
      const f = 0.3, gr = w * 0.97 * (1 - (hh * f - 2.2) / (hh - 2.2));
      m.cone(0, y0 + hh * f, cz, gr * 1.06, hh * (1 - f) + 0.4, 14, { pe: '#b4c6de', topo: '#ffffff' }, { ao: false });
    }
    return topoDe(base + (andares - 1) * H * 0.85 + H, R * 0.4);
  };
}

// ---------- árvores secas / galhos ----------
function arvoreMorta({ h = 28, cor = ['#4a3a2e', '#7a6452'], neve = false, ramos, monte = null }) {
  return (m) => {
    segmento(m, [0, 0, cz], [0.8, h, cz], 2.9, 1.1, 6, { pe: cor[0], topo: cor[1] }, { desvio: 0.5 });
    m.bola(0, 1.5, cz + 0.6, 4.2, 2.2, 3.6, { pe: cor[0], topo: cor[1] }, { d: 0 }); // base alargada
    for (const [y, a, l] of ramos) {
      const x0 = 0.5 + (y / h) * 0.3, p1 = [x0 + Math.cos(a) * l * 0.85, y + l * 0.62, cz - Math.sin(a) * l * 0.85];
      segmento(m, [x0, y, cz], p1, 1.25, 0.65, 5, { pe: cor[0], topo: cor[1] }, { ao: false });
      segmento(m, p1, [p1[0] + Math.cos(a) * l * 0.2, p1[1] + l * 0.5, p1[2]], 0.65, 0.3, 4, { pe: cor[0], topo: cor[1] }, { ao: false });
      if (neve) m.bola((x0 + p1[0]) / 2, (y + p1[1]) / 2 + 1.1, (cz + p1[2]) / 2, l * 0.4, 1.1, 1.5, '#ffffff', { d: 0, ao: false });
    }
    if (neve) m.bola(0.8, h + 0.4, cz, 2.4, 1.4, 2.4, '#ffffff', { d: 0, ao: false });
    if (monte) m.bola(0, 0.8, cz + 1, 8.4, 2, 5.4, monte, { d: 1, ao: false });
    return topoDe(h + 6, 4);
  };
}

// ---------- árvores de copa larga ----------
const umbu = (m, c) => {
  const cs = ['#4a3224', '#6a4a34', '#8a6a4a'], pal = ['#2e6e32', '#4a9a40', '#6cbc50', '#a6dc78'];
  segmento(m, [0, 0, cz], [-1.5, 22, cz], 5.2, 3.8, 7, TRONCO(cs), { desvio: 0.6 });
  segmento(m, [-1.5, 20, cz], [-12, 30, cz], 3, 2, 6, TRONCO(cs), { desvio: 0.6 });
  segmento(m, [-1.5, 20, cz], [9, 29, cz + 1], 3, 2, 6, TRONCO(cs), { desvio: 0.6 });
  const g = { pe: pal[0], topo: pal[2] };
  m.bola(0, 38, cz, 28, 11, 18, g, { d: 1, var: 0.08, ao: false });
  m.bola(-17, 34, cz + 2, 14, 9, 12, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(17, 34, cz + 1, 14, 9, 12, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(-3 + c.v * 4, 46, cz - 1, 15, 7.5, 10.5, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(1, 33, cz + 9, 15, 7, 8, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
  return topoDe(50, 20);
};
const arvoreSelva = (m, c) => {
  const cs = ['#3e2a1a', '#5a3e2a', '#7a5a3e'], pal = ['#1a5e2c', '#2a8040', '#44a850', '#7ed06a'];
  segmento(m, [0, 0, cz], [0, 48, cz], 7.6, 5, 8, TRONCO(cs), { desvio: 0.6 });
  // sapopembas: raízes tabulares
  for (const [x, z, a] of [[-14, 2, 0.5], [14, 1, 0.5], [-5, 5, 0.4], [6, 5, 0.4]]) segmento(m, [x, 0, cz + z], [x * 0.2, 20 + a * 8, cz], 3.4, 2.6, 5, TRONCO(cs), { ao: false });
  const g = { pe: pal[0], topo: pal[2] };
  m.bola(0, 62, cz, 32, 17, 21, g, { d: 1, var: 0.08, ao: false });
  m.bola(-24, 56, cz + 2, 14, 10, 13, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(24, 56, cz + 1, 14, 10, 13, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(-5 + c.v * 8, 74, cz, 18, 9, 12, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(2, 54, cz + 12, 16, 8, 9, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
  // cipós
  for (const [x, z, y] of [[-18, 12, 54], [15, 12, 52], [26, 4, 50]]) segmento(m, [x, y, cz + z], [x + 0.5, 12, cz + z], 0.9, 0.7, 4, '#3e8a3a', { ao: false });
  return topoDe(78, 24);
};
const mangue = (m, c) => {
  const cs = ['#4a3220', '#6a4a30', '#8a6a44'], pal = ['#1e6038', '#2c8444', '#4ca852', '#80d474'];
  // raízes aéreas em arco
  for (const x of [-19, -10, 10, 19]) segmento(m, [x, 0, cz + (x % 2 ? 2 : -1)], [x * 0.22, 13, cz], 1.0, 1.9, 5, TRONCO(cs), { ao: false });
  for (const x of [-15, 14]) segmento(m, [x, 0, cz + 4], [x * 0.3, 10, cz + 1], 0.8, 1.6, 4, TRONCO(cs), { ao: false });
  segmento(m, [0, 8, cz], [0, 24, cz], 4.6, 3.2, 7, TRONCO(cs), { desvio: 0.6 });
  const g = { pe: pal[0], topo: pal[2] };
  m.bola(0, 31, cz, 21, 10, 14, g, { d: 1, var: 0.08, ao: false });
  m.bola(-14, 27, cz + 2, 10, 7, 9, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(14, 28, cz + 1, 10, 7, 9, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(-1 + c.v * 3, 38, cz, 12, 6, 8.5, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  return topoDe(40, 16);
};
const araucaria = (m, c) => {
  const cs = ['#5a3e2a', '#7a5a3e', '#9a7a56'], pal = ['#20603a', '#2e8048', '#4aa05c', '#82cc88'];
  segmento(m, [0, 0, cz], [0, 56, cz], 3.4, 2, 7, TRONCO(cs), { desvio: 0.6 });
  // braços que sobem em "candelabro" e terminam em almofadas de folhas (copa em guarda-chuva)
  for (const [y, w, ph] of [[36, 17, 0], [46, 13, 1]]) for (const s of [-1, 1]) {
    segmento(m, [0, y - 2, cz], [s * w * 0.8, y + 3, cz], 1.3, 0.9, 5, TRONCO(cs), { ao: false });
    m.bola(s * w, y + 4, cz + ph, 10.5 - ph * 2, 3.8, 8.4 - ph, { pe: pal[ph], topo: pal[2 + ph] }, { d: 1, var: 0.08, ao: false });
  }
  m.bola(0, 59, cz, 15, 4.8, 10, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
  m.bola(-2 + c.v * 4, 64, cz + 1, 8, 3.4, 6, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  return topoDe(68, 9);
};
const arvoreVento = (m, c) => {
  const cs = ['#4a3220', '#6a4a30', '#8a6a44'], pal = ['#2e6a2e', '#4a8c3a', '#6cb04e', '#a2d878'];
  // tronco torto, copa puxada para o leste
  const pts = [[0, 0], [3, 12], [8, 22], [14, 30]];
  for (let i = 0; i < 3; i++) segmento(m, [pts[i][0], pts[i][1], cz], [pts[i + 1][0], pts[i + 1][1], cz], 4.2 - i * 0.9, 3.6 - i * 0.9, 7, TRONCO(cs), { desvio: 0.6 });
  m.bola(0, 1.5, cz + 0.6, 5.4, 2.4, 4.4, { pe: cs[0], topo: cs[1] }, { d: 0 });
  m.bola(17, 35, cz, 18, 8.4, 11, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
  m.bola(7, 33, cz + 2, 9, 6, 8, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(24 + c.v * 2, 31, cz + 1, 8, 5.4, 7.4, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(15, 42, cz - 1, 10, 4.6, 7, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  return topoDe(46, 14);
};
const arvoreGigante = (m) => {
  const cs = ['#3e2616', '#5a3a22', '#7a5236'], pal = ['#1a5e2c', '#2a8040', '#44a850', '#82d46e'], cg = -16;
  segmento(m, [0, 0, cg], [0, 74, cg], 11.8, 8.4, 8, TRONCO(cs), { desvio: 0.6 });
  for (const [x, z, h] of [[-19, -9, 28], [19, -11, 26], [-7, -1, 22], [9, -2, 24]]) segmento(m, [x, 0, cg + z * 0.4], [x * 0.25, h, cg], 5.2, 3.2, 5, TRONCO(cs), { ao: false });
  m.bola(0, 82, cg, 46, 21, 29, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
  m.bola(-30, 76, cg + 2, 18, 13, 16, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(31, 76, cg + 1, 18, 13, 16, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(-6, 104, cg - 1, 29, 14, 19, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(4, 78, cg + 17, 24, 10, 11, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
  m.bola(-22, 94, cg + 3, 14, 9, 12, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  m.bola(22, 93, cg + 2, 13, 8, 11, { pe: pal[1], topo: pal[3] }, { d: 1, var: 0.08, ao: false });
  for (const [x, z] of [[-30, 10], [-18, 14], [22, 14], [34, 8]]) segmento(m, [x, 70, cg + z], [x + 0.5, 28, cg + z], 0.9, 0.7, 4, '#3e8a3a', { ao: false });
  return topoDe(114, 34, cg);
};

// ---------- plantas e cactos ----------
const cap = (m, x, y0, z, r, h, cor, n = 8, d = 1) => { // cilindro com ponta arredondada (cápsula)
  m.cil(x, y0, z, r, r, h, n, cor, { ao: false });
  m.bola(x, y0 + h, z, r, r * 0.9, r, cor, { d, ao: false });
};
const cactus = (m) => {
  const g = { pe: '#2e8a48', topo: '#7ed07a' };
  cap(m, 0, 0, cz, 3.4, 22, g, 8);
  m.cil(-1.5, 10.6, cz, 1.9, 1.9, 6.7, 7, g, { rz: Math.PI / 2, ao: false });
  cap(m, -8.2, 9, cz, 2, 9.5, g, 7, 0);
  m.cil(1.5, 14.6, cz, 1.9, 1.9, 5.9, 7, g, { rz: -Math.PI / 2, ao: false });
  cap(m, 7.4, 13, cz, 2, 7, g, 7, 0);
  m.bola(0, 25.4, cz + 1, 1.3, 1.3, 1.3, '#ff8ac0', { d: 0, ao: false });
  return topoDe(27, 4);
};
const mandacaru = (m) => {
  const g = { pe: '#2e8a58', topo: '#86d6a0' };
  m.cil(0, 0, cz, 3.8, 3.2, 11, 8, { pe: '#6a8a4a', topo: '#8aa860' }, { ao: false });
  m.cil(-13, 11.5, cz, 2, 2, 26, 7, g, { rz: -Math.PI / 2, ao: false });
  for (const [x, h, r] of [[0, 33, 3], [-9, 21, 2.5], [9, 25, 2.5], [-13, 13, 2.2], [13, 15, 2.2]]) cap(m, x, 10, cz, r, h, g, 7, x === 0 ? 1 : 0);
  m.bola(0, 44, cz + 1, 2, 1.6, 2, '#ff7ab0', { d: 0, ao: false });
  m.bola(9, 36, cz + 2, 1.4, 1.2, 1.4, '#ff9ac8', { d: 0, ao: false });
  return topoDe(45, 3);
};
const xiquexique = (m) => {
  const g = { pe: '#2e7a4e', topo: '#8ad49e' };
  for (const [x, z, r, h] of [[-8, -6, 4.6, 5], [8, -7, 4.6, 5], [0, -9, 3.2, 12], [-4, -11, 2.4, 8], [4, -11, 2.4, 7]]) cap(m, x, 0, z, r, h, g, 7, h > 10 ? 1 : 0);
  m.bola(-4, 11, -11, 1.6, 1.3, 1.6, '#ff8ac0', { d: 0, ao: false });
  return topoDe(14, 6);
};
const arbustoSeco = (m, c) => {
  const g = ['#7a5a3a', '#a88a56', '#c8ac70'];
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2 + c.v, l = 7 + (k % 3) * 1.6;
    const p1 = [Math.cos(a) * l, 5 + (k % 3) * 2.2, cz + Math.sin(a) * l * 0.75];
    segmento(m, [0, 2, cz], p1, 0.9, 0.45, 4, g[k % 3], { ao: false });
    segmento(m, p1, [p1[0] + Math.cos(a + 0.7) * 3, p1[1] + 2.5, p1[2] + Math.sin(a + 0.7) * 2.2], 0.45, 0.2, 3, g[(k + 1) % 3], { ao: false });
  }
  m.bola(0, 5.5, cz, 4.6, 3.4, 4.2, { pe: g[0], topo: g[1] }, { d: 0, var: 0.15, ao: false });
  m.bola(-1.5, 8, cz + 1, 3, 2.2, 2.8, { pe: g[1], topo: g[2] }, { d: 0, var: 0.12, ao: false });
  return topoDe(11, 5);
};
const cactoBarril = (m, c) => {
  const g = { pe: '#2e8a4e', topo: '#80d27c' }, flor = c.v ? '#ff7ab0' : '#ffd24a';
  m.bola(0, 5.8 + c.v, cz, 6.4, 5.6 + c.v, 6.4, g, { d: 1, ao: false });
  m.bola(0, 11.6 + c.v, cz, 2.2, 1.2, 2.2, flor, { d: 0, ao: false });
  m.bola(8.6, 3, cz + 2, 3.4, 3, 3.4, g, { d: 1, ao: false });
  m.bola(8.6, 6.1, cz + 2, 1.1, 0.8, 1.1, flor, { d: 0, ao: false });
  // costelas: três filetes claros na frente
  for (const x of [-3.4, 0, 3.4]) m.bola(x, 5.2, cz + 5.7, 0.55, 3.4, 0.55, '#a8e8a0', { d: 0, ao: false });
  return topoDe(14, 6);
};
const bambu = (m) => {
  for (const [x, h, z, cr] of [[-9, 44, -10, ['#4a9a38', '#8ad060']], [-3, 48, -7, ['#58a846', '#9ae070']], [4, 40, -11, ['#46903a', '#80c85a']], [10, 46, -6, ['#4a9a38', '#8ad060']]]) {
    const gom = 3;
    for (let k = 0; k < gom; k++) m.cil(x, (h / gom) * k, z, 1.45, 1.35, h / gom - 0.2, 6, { pe: cr[0], topo: cr[1] }, { ao: false });
    m.cil(x, h / gom - 0.5, z, 1.95, 1.95, 0.9, 6, '#3e7a30', { ao: false });
    // folhas finas no topo
    elipse(m, x + 3.4, h - 6, z, 4.4, 0.8, 1.5, 0, 0, 0.5, '#4aa840', { d: 0, ao: false });
    elipse(m, x - 3, h - 2, z + 0.5, 4, 0.8, 1.4, 0, 0, -0.45, '#62c050', { d: 0, ao: false });
  }
  return topoDe(50, 6);
};
const folhaGigante = (m) => {
  m.cil(0, 0, cz, 1.7, 1.4, 16, 6, { pe: '#3e7a2e', topo: '#6aa850' }, { ao: false });
  const cor = { pe: '#2e8a3e', topo: '#80d474' }, cor2 = { pe: '#379846', topo: '#92dc7e' };
  fronda(m, 0, 14, cz, Math.PI + 0.1, 0.55, 26, 6.4, cor, 1); fronda(m, 0, 14, cz, 0.1, 0.5, 26, 6.4, cor, 1);
  fronda(m, 0, 14, cz, -Math.PI / 2 + 0.1, 0.7, 20, 5.4, cor2, 1); fronda(m, 0, 14, cz, Math.PI / 2 - 0.1, 0.35, 20, 5.6, cor2, 1);
  return topoDe(22, 8);
};
const cogumelos = (m, c) => {
  const cap2 = c.v % 2 ? { pe: '#c8302a', topo: '#f06050' } : { pe: '#b8742e', topo: '#e8a860' };
  const hastes = [[-3, -9, 7, 4.6], [3.4, -6, 5, 3.4], [5.4, -11, 3.5, 2.6], [-6.4, -5, 3, 2.2]];
  hastes.forEach(([x, z, h, r], i) => {
    m.cil(x, 0, z, r * 0.36, r * 0.3, h, 6, { pe: '#d8cdb4', topo: '#f8f0dc' }, { ao: false });
    m.bola(x, h, z, r, r * 0.72, r, cap2, { d: i < 2 ? 1 : 0, ao: false });
    if (c.v % 2 && i < 2) m.bola(x - r * 0.3, h + r * 0.62, z + r * 0.35, r * 0.2, r * 0.12, r * 0.2, '#ffffff', { d: 0, ao: false });
  });
  return topoDe(9, 6);
};
const taboa = (m) => {
  const talos = [[-5, -10, 17, 0], [-1.5, -7, 20, 1], [2.5, -11, 15, 0], [5.5, -7, 18, 1], [0, -9, 12, 0]];
  talos.forEach(([x, z, h, tipo], k) => {
    segmento(m, [x, 0, z], [x + (k - 2) * 0.4, h, z], 0.8, 0.45, 4, { pe: '#3e7a30', topo: '#80c058' }, { ao: false });
    if (tipo === 1) m.cil(x + (k - 2) * 0.4, h - 5.5, z, 1.4, 1.4, 5.5, 6, { pe: '#5a3a1e', topo: '#8a5a30' }, { ao: false });
    else elipse(m, x + (k - 2) * 0.4 + 2.2, h - 2, z, 3.6, 0.6, 1.1, 0, 0, 0.9, '#6cb04c', { d: 0, ao: false });
  });
  return topoDe(21, 6);
};
const vitoriaRegia = (m, c) => {
  for (const [x, z, r] of [[-4, -9, 6.4], [5.4, -6, 4.8], [3, -13, 3.8]]) m.cil(x, 0, z, r, r * 0.96, 0.9, 12, { pe: '#2e8a40', topo: '#6cc455' }, { aberto: false, ao: false });
  if (c.v % 2 === 0) {
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; elipse(m, -4 + Math.cos(a) * 1.9, 2.4, -9 + Math.sin(a) * 1.9, 1.7, 0.7, 0.8, 0, -a, 0.9, { pe: '#f080b0', topo: '#ffd0e4' }, { d: 0, ao: false }); }
    m.bola(-4, 2.2, -9, 1.2, 1, 1.2, '#ffe08a', { d: 0, ao: false });
  }
  return topoDe(4, 6);
};
const driftwood = (m, c) => {
  const cor = { pe: '#9a8670', topo: '#d6c6aa' };
  segmento(m, [-18, 2.2, cz], [-4, 3.2, cz + 0.8], 2.6, 2.4, 7, cor, { ao: false });
  segmento(m, [-4, 3.2, cz + 0.8], [16, 2.4, cz - 0.8], 2.4, 1.7, 7, cor, { ao: false });
  m.bola(-18, 2.2, cz, 2.5, 2.3, 2.5, '#e8dcc0', { d: 0, ao: false });
  segmento(m, [6, 3.2, cz], [9, 8 + c.v, cz - 1.5], 1.2, 0.6, 5, cor, { ao: false });
  m.bola(0, 3.8, cz + 1.4, 3, 1.6, 2, '#b8a48a', { d: 0, ao: false });
  return topoDe(6, 14);
};
const moitaNeve = (m, c) => {
  const pal = ['#2a6a42', '#3a8a58'];
  m.bola(0, 5.4, cz, 7.4, 5.2, 5.8, { pe: pal[0], topo: pal[1] }, { d: 1, var: 0.08 });
  m.bola(-5, 4, cz + 1.4, 4.4, 3.6, 4, { pe: pal[0], topo: pal[1] }, { d: 1, var: 0.08 });
  m.bola(5.2, 3.8, cz + 1.6, 4.2, 3.4, 4, { pe: pal[0], topo: pal[1] }, { d: 0, var: 0.08 });
  m.bola(-0.5 + c.v, 9.6, cz - 0.5, 6.2, 2.6, 4.8, { pe: NEVE_S, topo: '#ffffff' }, { d: 1, ao: false });
  m.bola(-5.2, 7.2, cz + 1, 2.8, 1.3, 2.4, '#ffffff', { d: 0, ao: false });
  m.bola(5, 6.6, cz + 1.4, 2.8, 1.2, 2.4, '#ffffff', { d: 0, ao: false });
  return topoDe(13, 6);
};

export const TIPOS_NATUREZA_A = {
  juazeiro: { f: redonda({ h: 56, R: 22, pal: ['#2e6e34', '#46923e', '#68b44c', '#a6dc78'], tr: 3.8, fruta: '#f2d24c', cs: ['#4a3222', '#6a4a32', '#8a6648'] }), var: 2 },
  umbu: { f: umbu, var: 2 },
  arvoreSelva: { f: arvoreSelva, var: 2 },
  mangue: { f: mangue, var: 2 },
  araucaria: { f: araucaria, var: 2 },
  snowPine: { f: coniferaNeve({ h: 50, R: 15, pal: ['#1f5a3a', '#348254'], andares: 3 }), var: 3 },
  snowPineBig: { f: coniferaNeve({ h: 64, R: 19, pal: ['#1a4e34', '#2e7248'], andares: 5, tr: 3 }), var: 3 },
  arvoreSeca: { f: arvoreMorta({ h: 28, cor: ['#4a3a2e', '#7c6652'], ramos: [[16, 0.3, 9], [21, Math.PI - 0.2, 8], [25, 1.8, 6]] }) },
  palm: { f: palmaLG({ h: 34, L: 17, tr: 3 }), var: 3 },
  palmSmall: { f: palmaLG({ h: 16, L: 11, folhas: 6, cocos: false, tr: 2.4, duas: false }), var: 2 },
  coqueiro: { f: palmaLG({ h: 44, curva: 8, L: 20, tr: 3 }), var: 3 },
  palmeira: { f: palmaLG({ h: 50, L: 18, folhas: 9, gomo: ['#a09080', '#d8ccb8'], pal: ['#2e9444', '#66cc5e'], cocos: false, tr: 3.2 }), var: 3 },
  folhaGigante: { f: folhaGigante },
  bambu: { f: bambu },
  cactus: { f: cactus },
  mandacaru: { f: mandacaru },
  xiquexique: { f: xiquexique },
  driftwood: { f: driftwood },
  moitaNeve: { f: moitaNeve, var: 3 },
  pinheiroNevado: { f: coniferaNeve({ h: 70, R: 13, pal: ['#1c4a34', '#2c7048'], andares: 6, tr: 2.6 }), var: 3 },
  galhoNevado: { f: arvoreMorta({ h: 30, cor: ['#4a3e36', '#7a6c60'], neve: true, ramos: [[16, 0.3, 9], [21, Math.PI - 0.2, 8], [25, 1.9, 6]], monte: NEVE_S }) },
  arbustoSeco: { f: arbustoSeco, var: 3 },
  cactoBarril: { f: cactoBarril, var: 2 },
  cogumelos: { f: cogumelos, var: 2 },
  arvoreGigante: { f: arvoreGigante },
  arvoreVento: { f: arvoreVento, var: 2 },
  arvoreCinza: { f: arvoreMorta({ h: 33, cor: ['#3a3434', '#6e6666'], ramos: [[18, 0.4, 10], [23, Math.PI - 0.3, 9], [27, 2.1, 7], [14, -1.2, 6]], monte: '#9a9494' }) },
  taboa: { f: taboa, var: 3 },
  vitoriaRegia: { f: vitoriaRegia, var: 2 },
};
