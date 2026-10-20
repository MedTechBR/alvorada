import { tom } from './construtor.js';
import { copa, tronco, pedra, topoDe, CASCA } from './natureza.js';
import '../../world/vestir.js'; // registra as fichas (pegadas) destas peças no catálogo

// Peças do "vestir" (enfeite das áreas ao ar livre, tools/vestir.mjs): o que faltava ao kit para cada bioma ter
// cara própria. Mesmas regras do resto do kit (construtor.js): origem no pé do objeto, pegada de x = -fw*8..fw*8 e
// z = -fh*16..0, a câmera olha para o norte (a face da frente é +z). As fichas (pegada, se é sólido) ficam em
// src/world/vestir.js (VESTIR_KINDS), registradas no catálogo do jogo.
//
// Todas são estáticas: entram na malha mesclada do setor (um draw call por setor, kit/modelos-setor.js).

const NEVE = '#f4f8ff', NEVE2 = '#dfe8f4', NEVE_S = '#b8c8de';
const r2 = (m, a, b) => a + m.r() * (b - a);

// ---------- rochas em camadas (estratos): o bloco que forma paredões, mesas e pináculos
// pal: [base escura, faixa, faixa clara, topo]; andares de blocos que encolhem, com faixas alternadas
function estratos(m, { w, d, h, cz, pal, n = 4, encolhe = 0.1, topo, neve = false, desv = 3 }) {
  // andares em prisma de 7 lados achatado (rocha sem cara de caixote), cada um com uma faixa mais escura na base
  let y = 0, ww = w, dd = d, x = 0;
  for (let i = 0; i < n; i++) {
    const hh = (h / n) * r2(m, 0.8, 1.2), cr = pal[i % 3], dx = (m.r() - 0.5) * desv, fase = m.r() * 6.28, ult = i === n - 1;
    const r0 = ww / 2 / 0.92, enc = 1 - encolhe * 0.5;
    m.cil(x + dx, y, cz, r0, r0 * enc, hh, 7, cr, { achata: dd / ww, fase, var: 0.08, topo: ult ? (topo ?? pal[3]) : tom(cr, 1.12) });
    m.cil(x + dx, y, cz, r0 * 1.02, r0 * 1.0, Math.min(2, hh * 0.25), 7, tom(cr, 0.72), { achata: dd / ww, fase, tampa: false, ao: false });
    y += hh; x += dx * 0.5; ww *= 1 - encolhe * r2(m, 0.6, 1.4); dd *= 1 - encolhe * 0.7;
  }
  if (neve) { m.cil(x, y, cz, ww / 2, ww / 2.3, 3, 7, NEVE, { achata: dd / ww, ao: false }); m.bloco(x - ww * 0.15, y + 3, cz, ww * 0.4, 1.6, dd * 0.4, '#ffffff', { ao: false }); }
  return y;
}

// paredão de rocha (pedaço de penhasco) 3x2: estratos largos e um degrau de pedras soltas no pé
function escarpa(pal, o = {}) {
  return (m, c) => {
    const w = 46 + c.v * 2, h = (o.h ?? 46) + c.v * 6;
    const y = estratos(m, { w, d: 28, h, cz: -16, pal, n: 4, encolhe: 0.12, neve: o.neve, topo: o.topo });
    if (o.mato) for (let k = 0; k < 3; k++) m.bloco(r2(m, -14, 14), y, -16 + r2(m, -6, 6), r2(m, 5, 9), 3, r2(m, 4, 7), o.mato, { ao: false });
    m.bloco(-w * 0.32, 0, -2, 9, 5, 6, pal[0], { var: 0.1 }); m.bloco(w * 0.3, 0, -3, 7, 4, 5, pal[1], { var: 0.1 });
    return topoDe(y, 18, -16);
  };
}

// ---------- neve
const monteNeve = (m, c) => {
  // monte de neve acumulada: prismas achatados empilhados (borda redonda), sombra azulada do lado norte
  const w = 13 + c.v * 1.5;
  m.cil(0, 0, -8, w, w * 0.85, 4, 8, NEVE2, { achata: 0.5, topo: NEVE, ao: false });
  m.cil(-2 + c.v, 4, -9, w * 0.7, w * 0.45, 4, 8, NEVE, { achata: 0.55, topo: '#ffffff', ao: false });
  m.cil(-3 + c.v, 8, -9, w * 0.35, w * 0.15, 2.5, 6, '#ffffff', { achata: 0.6, ao: false });
  return { y: 10, x0: -w, x1: w, z0: -14, z1: -2 };
};
const pedraGelo = pedra({ w: 26, h: 15, d: 14, pal: ['#6a7488', '#8a96aa', '#aab8cc'], brilho: (m, cz) => {
  m.bloco(-2, 15, cz, 22, 3, 12, NEVE, { ao: false }); m.bloco(-4, 18, cz + 1, 12, 2, 7, '#ffffff', { ao: false });
  for (const x of [-8, -2, 5]) m.bloco(x, 9, cz + 7.2, 1.6, 5, 1, '#d8f2ff', { brilho: -0.3, ao: false });
} });
const galhoNevado = (m) => {
  m.cil(0, 0, -8, 2.6, 1.8, 28, 5, '#4a3e36', { tampa: false });
  const galho = (y, a, l) => m.com({ y, z: -8, ry: a }, () => { m.bloco(l / 2, 0, 0, l, 2, 2, '#4a3e36', { ao: false }); m.bloco(l / 2, 2, 0, l * 0.9, 1.5, 2.6, NEVE, { ao: false }); m.bloco(l, 0, 0, 2, l * 0.5, 2, '#5a4c42', { ao: false }); m.bloco(l, l * 0.5, 0, 2.8, 1.4, 2.8, NEVE, { ao: false }); });
  galho(16, 0.3, 9); galho(21, Math.PI - 0.2, 8); galho(25, 1.9, 6);
  m.bloco(0.4, 28, -8, 3, 2, 3, NEVE, { ao: false });
  m.bloco(0, 0, -6, 14, 3, 9, NEVE2, { ao: false });
  return topoDe(32, 4);
};
const pinheiroAlto = (neve) => (m, c) => {
  // fino e alto, andares estreitos (mata de neve e de montanha): mais variado que o pine do kit
  const cz = -8, h = 64 + c.v * 8, n = 6, pal = neve ? ['#1c4a34', '#24603e', '#2e7448'] : ['#173f22', '#215a2c', '#2e7238'];
  m.bloco(0, 0, cz, 4.5, 10, 4.5, CASCA[1], { cores: { frente: CASCA[2] } });
  for (let i = 0; i < n; i++) {
    const k = i / n, w = 26 * (1 - k * 0.78), y0 = 8 + i * ((h - 14) / n), hh = (h - 14) / n * 1.15;
    m.bloco((m.r() - 0.5) * 2, y0, cz, w, hh * 0.55, w * 0.8, pal[i % 2], { var: 0.07, ao: i === 0, cores: { topo: neve ? NEVE : pal[2] } });
    if (neve && i % 2 === 0) m.bloco(-w * 0.2, y0 + hh * 0.55, cz + 1, w * 0.45, 1.6, w * 0.4, '#ffffff', { ao: false });
  }
  m.bloco(0, h - 6, cz, 4, 8, 4, neve ? NEVE : pal[2], { ao: false });
  return topoDe(h + 2, 5, cz);
};

// ---------- deserto e cânion
const PAL_VERM = ['#a8583a', '#c8784a', '#e09a62', '#d8a070'];
const PAL_OCRE = ['#b07a4a', '#d09a5e', '#e8bc7e', '#e0c08a'];
const mesa = (m, c) => {
  const pal = c.v % 2 ? PAL_OCRE : PAL_VERM, w = 44 + c.v * 2;
  const y = estratos(m, { w, d: 30, h: 40 + c.v * 6, cz: -16, pal, n: 4, encolhe: 0.05, desv: 2 });
  m.bloco(-8, y, -16, 7, 4, 6, '#7a8a4a', { ao: false }); m.bloco(9, y, -18, 5, 3, 5, '#6a7a3e', { ao: false });
  // talude de pedras no pé
  for (const [x, z, s] of [[-20, -2, 8], [-12, 0, 5], [16, -1, 7], [22, -4, 5]]) m.bloco(x, 0, z, s, s * 0.6, s * 0.8, pal[0], { var: 0.12 });
  return topoDe(y + 3, 18, -16);
};
const pilarRocha = (m, c) => {
  const pal = c.v % 2 ? PAL_OCRE : PAL_VERM;
  const y = estratos(m, { w: 14, d: 12, h: 38 + c.v * 8, cz: -8, pal, n: 5, encolhe: 0.04, desv: 2.5 });
  m.cil(0, y, -8, 8, 7, 3, 7, pal[2], { achata: 0.85, ao: false });
  m.bloco(-7, 0, -3, 6, 4, 5, pal[0]); m.bloco(6, 0, -4, 5, 3, 4, pal[1]);
  return topoDe(y + 3, 6);
};
const ossada = (m) => {
  const osso = '#ece4d4', osso2 = '#d8ccb4';
  m.bloco(-8, 0, -8, 18, 2.4, 2.4, osso, { ao: false, cores: { topo: '#f8f2e4' } }); // espinha
  for (let k = 0; k < 5; k++) { const x = -14 + k * 4.2; for (const s of [-1, 1]) m.bloco(x, 1, -8 + s * 4, 1.6, 4 - k * 0.3, 5, k % 2 ? osso2 : osso, { ao: false }); }
  m.bloco(8, 0, -7, 8, 5, 7, osso, { cores: { topo: '#f8f2e4' } }); m.bloco(10.5, 2, -3.4, 2, 2, 0.3, '#3a3030', { ao: false });
  for (const s of [-1, 1]) m.bloco(9 + s * 4, 4, -9, 6, 1.6, 1.6, osso2, { ao: false });
  return topoDe(5, 10);
};
const arbustoSeco = (m, c) => {
  const cz = -8, g = ['#7a5a3a', '#9a7a4a', '#b89a62'];
  m.bloco(0, 0, cz, 3, 4, 3, g[0]);
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + c.v, l = r2(m, 5, 9); m.com({ y: 2, z: cz, ry: a }, () => m.bloco(l / 2, r2(m, 1, 6), 0, l, 1.3, 1.3, g[k % 3], { ao: false })); }
  m.bloco(0, 6, cz, 9, 4, 8, '#8a7a4a', { var: 0.15, ao: false });
  m.bloco(-2, 9, cz + 1, 5, 2.5, 5, '#a89a5a', { ao: false });
  return topoDe(11, 5);
};
const cactoBarril = (m, c) => {
  const cz = -8, g = '#4a9a5a';
  m.cil(0, 0, cz, 6.5, 5.5, 9 + c.v * 2, 8, g, { topo: '#7ac87a', var: 0.05 });
  m.cil(0, 9 + c.v * 2, cz, 5.5, 2, 3, 8, g, { topo: '#7ac87a' });
  m.bloco(0, 12 + c.v * 2, cz, 3, 2, 3, c.v ? '#ff7ab0' : '#ffd24a', { ao: false });
  m.cil(9, 0, cz + 2, 3.5, 3, 5, 6, g, { topo: '#7ac87a' });
  return topoDe(14, 6);
};
const duna = (m, c) => {
  // duna: monte de areia em prismas achatados, crista deslocada para o leste e sombra no sopé (3x2)
  const a = '#d8a868', b = '#f0cf92', cr = '#fbe6b8', dx = (c.v - 1) * 3, k = [0.8, 1, 1.25][c.v % 3];
  m.com({ s: k }, () => {
    m.cil(0, 0, -16, 23, 20, 5, 10, a, { achata: 0.62, topo: b, ao: false, fase: 0 });
    m.cil(dx + 2, 5, -17, 18, 12, 6, 10, b, { achata: 0.6, topo: cr, ao: false, fase: 0 });
    m.cil(dx + 4, 11, -17, 10, 3, 4, 8, cr, { achata: 0.55, ao: false });
  });
  return topoDe(15 * k, 18, -16);
};

// ---------- vulcão
const PAL_BAS = ['#2e2a2e', '#3e383c', '#4e4648', '#5a5052'];
const pinaculo = (m, c) => {
  const pal = ['#6a2e22', '#8a3e2a', '#a8543a', '#3a2622'];
  m.bloco(0, 0, -8, 16, 6, 13, PAL_BAS[1], { var: 0.1 });
  m.cil(0, 5, -8, 6.5, 3.5, 22 + c.v * 6, 5, pal[c.v % 2], { tampa: false, var: 0.06 });
  m.cil(1, 27 + c.v * 6, -8, 3.5, 1, 12, 5, pal[2], { tampa: false });
  m.bloco(-2, 14, -3.2, 1.4, 8, 0.6, '#ff8a3a', { brilho: -0.9, ao: false });
  return topoDe(40 + c.v * 6, 3);
};
const basaltoColunas = (m, c) => {
  const hs = [[-8, -10, 26], [0, -9, 34], [8, -11, 22], [-4, -4, 16], [5, -3, 12], [12, -5, 8], [-12, -3, 10]];
  for (const [x, z, h] of hs) m.cil(x, 0, z, 4.4, 4.4, h + c.v * 3, 6, PAL_BAS[(x + 16) % 3], { topo: PAL_BAS[3], var: 0.06, fase: 0 });
  return topoDe(34, 12);
};
const arvoreCinza = (m) => {
  const tr = '#3a3434', cz = '#c8c4c0';
  m.cil(0, 0, -8, 3, 2, 30, 5, tr, { tampa: false });
  const galho = (y, a, l) => m.com({ y, z: -8, ry: a }, () => { m.bloco(l / 2, 0, 0, l, 2, 2, tr, { ao: false }); m.bloco(l / 2, 2, 0, l * 0.7, 1, 2.2, cz, { ao: false }); m.bloco(l, 0, 0, 1.8, l * 0.6, 1.8, '#4a4242', { ao: false }); });
  galho(18, 0.4, 10); galho(23, Math.PI - 0.3, 9); galho(27, 2.1, 7); galho(14, -1.2, 6);
  m.bloco(0, 0, -6, 12, 2, 9, '#8a8484', { ao: false });
  return topoDe(36, 4);
};
const fendaLava = (m) => {
  // rachadura acesa no chão de basalto (não é sólida: dá para passar por cima)
  m.bloco(0, 0, -8, 30, 1.2, 9, PAL_BAS[1], { ao: false });
  m.bloco(-3, 0.6, -8, 22, 1, 3, '#ff6a1a', { brilho: -1, ao: false });
  m.bloco(7, 0.6, -6, 3, 1, 6, '#ffb03a', { brilho: -1, ao: false });
  return topoDe(2, 12);
};

// ---------- praia
const concha = (m, c) => {
  const cs = [['#f4d8c8', '#e8a888'], ['#ffb8a8', '#e87a6a'], ['#f8e8b0', '#e0c070']][c.v % 3];
  m.bloco(-3, 0, -9, 5, 2, 4, cs[0], { ao: false, cores: { topo: cs[0] } }); m.bloco(-3, 2, -9, 3, 1, 2.5, cs[1], { ao: false });
  // estrela-do-mar
  for (let k = 0; k < 5; k++) m.com({ x: 4, z: -5, ry: k * 1.2566 }, () => m.bloco(2, 0, 0, 4, 1.2, 1.6, '#ff8a4a', { ao: false }));
  return topoDe(3, 5);
};
const pedraMar = (m, c) => {
  // pedras da arrebentação: blocos arredondados, base molhada escura, cracas e um tufo de alga
  const pal = ['#56646a', '#6e7e82', '#8a9a9a'];
  m.cil(-3, 0, -9, 10, 8, 9 + c.v * 2, 7, pal[1], { achata: 0.6, fase: c.v, topo: pal[2], var: 0.06 });
  m.cil(7, 0, -6, 6, 4.5, 6, 6, pal[0], { achata: 0.7, fase: 1 + c.v, topo: pal[1] });
  m.cil(-3, 0, -9, 10.4, 10.2, 2, 7, '#3a4a46', { achata: 0.6, fase: c.v, tampa: false, ao: false });
  m.bloco(-5, 9 + c.v * 2, -9, 5, 1.2, 4, '#e8e4dc', { ao: false });
  m.bloco(1, 3, -3.6, 3, 2, 0.8, '#5a8a4a', { ao: false });
  return topoDe(11 + c.v * 2, 9);
};
const barco = (m, c) => {
  const cor = ['#d8584a', '#3a8ad8', '#e8c44a'][c.v % 3];
  m.com({ z: -8 }, () => {
    m.bloco(0, 0, 0, 34, 4, 12, tom(cor, 0.8));
    m.bloco(0, 4, 0, 38, 4, 14, cor, { cores: { topo: '#a8744a' } });
    m.bloco(0, 7.6, 0, 32, 0.6, 10, '#8a5a34', { ao: false });
    m.bloco(-19, 4, 0, 4, 6, 8, cor); m.bloco(19, 4, 0, 4, 6, 8, cor);
    m.bloco(0, 8, 0, 3, 1.2, 12, '#6b4428', { ao: false }); // banco
    m.com({ ry: 0.3 }, () => m.bloco(6, 8.5, 2, 22, 1, 1.4, '#b07a46', { ao: false })); // remo
  });
  return topoDe(9, 16);
};
const redePesca = (m) => {
  for (const x of [-12, 12]) m.bloco(x, 0, -8, 2, 22, 2, '#6b4428', { cores: { frente: '#8a5a34' } });
  m.bloco(0, 21, -8, 26, 2, 2, '#6b4428');
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) m.bloco(-10 + i * 4, 6 + j * 4, -7.2, 3.4, 3.4, 0.4, j === 3 ? '#c8a050' : '#8a9a8a', { sempre: true, ao: false });
  m.bloco(-4, 18, -6.8, 3, 3, 1, '#e8584a', { ao: false }); m.bloco(5, 10, -6.8, 3, 3, 1, '#e8584a', { ao: false }); // boias da rede
  return topoDe(23, 12);
};
const pocaMare = (m) => {
  m.bloco(0, 0, -8, 26, 1.4, 13, '#6a7a7c', { ao: false });
  m.bloco(0, 0.8, -8, 20, 1, 9, '#5ab8d0', { brilho: -0.15, ao: false });
  m.bloco(-5, 1.4, -9, 3, 1, 3, '#ff7a6a', { ao: false }); m.bloco(5, 1.4, -6, 3, 0.8, 2, '#7ad070', { ao: false });
  for (const [x, z] of [[-12, -4], [12, -11], [10, -3]]) m.bloco(x, 0, z, 5, 4, 4, '#6a7a7c', { var: 0.1 });
  return topoDe(4, 12);
};

// ---------- selva, mata e brejo
const samambaia = (m, c) => {
  const g = ['#2e7a3a', '#3e9a46', '#5ab456'];
  m.bloco(0, 0, -8, 4, 3, 4, '#3a5a2a');
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * Math.PI * 2 + c.v * 0.5, l = r2(m, 9, 12);
    m.com({ y: 2, z: -8, ry: a }, () => { m.quad([0, 0, -1.2], [0, 0, 1.2], [l * 0.6, 5, 2.4], [l * 0.6, 5, -2.4], g[k % 3], { sempre: true, ao: false }); m.quad([l * 0.6, 5, -2.4], [l * 0.6, 5, 2.4], [l, 1.5, 0.5], [l, 1.5, -0.5], g[(k + 1) % 3], { sempre: true, ao: false }); });
  }
  return topoDe(7, 8);
};
const cogumelos = (m, c) => {
  const cap = c.v % 2 ? '#d8483a' : '#c88a4a';
  for (const [x, z, h, r] of [[-3, -9, 7, 4.5], [3, -6, 5, 3.4], [5, -11, 3.5, 2.6], [-6, -5, 3, 2.2]]) {
    m.bloco(x, 0, z, r * 0.5, h, r * 0.5, '#f0e8d4', { ao: false });
    m.bloco(x, h, z, r * 1.6, r * 0.6, r * 1.6, cap, { ao: false, cores: { topo: tom(cap, 1.15) } });
    if (c.v % 2) m.bloco(x - r * 0.3, h + r * 0.6, z + r * 0.2, 1.2, 0.4, 1.2, '#ffffff', { ao: false });
  }
  return topoDe(9, 6);
};
const arvoreGigante = (m, c) => {
  // marco: tronco grosso com sapopembas, copa larga em dois andares, cipós
  const cs = ['#3e2616', '#5a3a22', '#7a5236'], cz = -16;
  tronco(m, 0, cz, 11, 70, cs);
  for (const [x, z, a] of [[-16, -10, 0.2], [16, -12, 2.6], [-6, -2, 1.2], [9, -3, 2.0]]) m.com({ x, z, ry: a }, () => m.cil(0, 0, 0, 9, 0.6, 26, 3, cs[1], { tampa: false }));
  copa(m, 0, 78, cz, 46, 22, 30, ['#1a5a2c', '#277a38', '#3aa04a', '#7ad86a'], { n: 11 });
  const top = copa(m, -6, 104, cz, 30, 16, 20, ['#227034', '#2f8a42', '#48b052', '#8be37a'], { n: 8 });
  for (const x of [-30, -18, 22, 34]) m.bloco(x, 30, cz + 12, 1.4, 44, 1.4, '#3e8a3a', { ao: false });
  return topoDe(top, 34, cz);
};
const cachoeira = (m) => {
  // marco: paredão musgoso com a queda d'água caindo num poço com espuma
  const pal = ['#5a5a5e', '#6e6e72', '#8a8a8a', '#5a8a4a'];
  m.bloco(0, 0, -26, 48, 56, 12, pal[0], { cores: { topo: pal[3], frente: pal[1] } });
  m.bloco(-17, 0, -18, 14, 44, 8, pal[1], { cores: { topo: pal[3] } }); m.bloco(17, 0, -18, 14, 40, 8, pal[2], { cores: { topo: pal[3] } });
  m.bloco(0, 4, -19.5, 16, 52, 1, '#8ad0f0', { brilho: -0.25, ao: false });
  for (let y = 8; y < 54; y += 9) m.bloco(-3 + (y % 2) * 4, y, -18.8, 4, 5, 0.4, '#e8f8ff', { ao: false });
  m.bloco(0, 0, -9, 30, 1.2, 16, '#4aa0d8', { brilho: -0.15, ao: false });
  for (const [x, z] of [[-6, -14], [5, -13], [0, -10], [-10, -9], [9, -8]]) m.bloco(x, 0.8, z, 6, 2.5, 4, '#ffffff', { ao: false });
  for (const [x, z, s] of [[-18, -4, 8], [18, -5, 7], [-14, -1, 5]]) m.bloco(x, 0, z, s, s * 0.7, s * 0.8, pal[1], { var: 0.1, cores: { topo: pal[3] } });
  return topoDe(56, 22, -26);
};
const taboa = (m, c) => {
  for (let k = 0; k < 7; k++) {
    const x = r2(m, -6, 6), z = -8 + r2(m, -4, 4), h = r2(m, 12, 20);
    m.bloco(x, 0, z, 1.2, h, 1.2, '#5a8a3a', { ao: false });
    if (k % 2 === 0) m.bloco(x, h - 5, z, 2.2, 5, 2.2, '#7a4a2a', { ao: false });
    else m.com({ x, z, ry: k }, () => m.quad([0, 2, -0.5], [0, 2, 0.5], [4, h * 0.8, 1], [4, h * 0.8, 0], '#6aa04a', { sempre: true, ao: false }));
  }
  return topoDe(20, 6);
};
const vitoriaRegia = (m, c) => {
  for (const [x, z, r] of [[-4, -9, 6], [5, -6, 4.5], [3, -13, 3.5]]) { m.cil(x, 0, z, r, r, 0.8, 8, '#3e8a3a', { topo: '#5aaa4a', ao: false }); }
  if (c.v % 2 === 0) { m.bloco(-4, 0.8, -9, 2.6, 2.4, 2.6, '#ff9ac4', { ao: false }); m.bloco(-4, 3.2, -9, 1.4, 1, 1.4, '#ffe08a', { ao: false }); }
  return topoDe(3, 6);
};

// ---------- montanha, campos e marcos
const arcoPedra = (m, c) => {
  // dois pilares e o vão (anda-se por baixo): pegada 4x1, sólidos só nas pontas
  const pal = ['#7a746c', '#948e84', '#aaa498', '#6a8a4a'];
  m.com({ x: 24 }, () => estratos(m, { w: 15, d: 13, h: 40, cz: -8, pal, n: 4, encolhe: 0.03, desv: 1.5 }));
  m.com({ x: -24 }, () => estratos(m, { w: 15, d: 13, h: 40, cz: -8, pal, n: 4, encolhe: 0.03, desv: 1.5 }));
  m.bloco(0, 38, -8, 62, 9, 13, pal[1], { cores: { topo: pal[3] } });
  m.bloco(0, 34, -8, 36, 4, 12, pal[0]);
  m.bloco(-6, 47, -8, 30, 3, 9, pal[2], { cores: { topo: pal[3] } });
  return topoDe(50, 28);
};
const arvoreVento = (m, c) => {
  // árvore torta pelo vento: tronco inclinado, copa puxada para o leste
  const cz = -8;
  for (let i = 0; i < 6; i++) m.bloco(i * 2.2, i * 5, cz, 5 - i * 0.3, 5.5, 5 - i * 0.3, CASCA[i % 2 ? 1 : 0]);
  m.bloco(16, 28, cz, 12, 2, 2, CASCA[1], { ao: false });
  const top = copa(m, 16, 34, cz, 18, 8, 11, ['#3a6a2a', '#4e8a34', '#6aa844', '#9ac868'], { n: 6 });
  return topoDe(top, 14, cz);
};
const ruina = (m, c) => {
  const p = ['#a89e8a', '#c0b8a4', '#8a826e'], musgo = '#6a9a4a';
  m.bloco(-14, 0, -10, 18, 30 - c.v * 6, 8, p[0], { var: 0.08, cores: { topo: musgo } });
  m.bloco(-14, 10, -5.8, 8, 12, 0.6, '#3a3630', { ao: false }); // janela vazada
  m.bloco(4, 0, -10, 10, 16, 8, p[1], { var: 0.08, cores: { topo: musgo } });
  m.cil(18, 0, -8, 4, 4, 26 - c.v * 8, 6, p[1], { topo: musgo });
  for (const [x, z, s] of [[-2, -2, 6], [12, 0, 5], [22, -2, 4]]) m.bloco(x, 0, z, s, s * 0.6, s, p[2], { var: 0.12 });
  return topoDe(30, 20, -10);
};
const santuario = (m, c) => {
  const mad = '#8a3a2a', pedra2 = '#a8a294';
  m.bloco(0, 0, -8, 26, 4, 14, pedra2, { cores: { topo: '#c8c2b4' } });
  m.bloco(0, 4, -10, 14, 12, 8, '#d8d0bc', { cores: { frente: '#e8e0cc' } });
  m.bloco(0, 6, -5.8, 6, 7, 0.6, '#3a3028', { ao: false });
  m.bloco(0, 8, -5.4, 2.4, 2.4, 0.5, '#ffd24a', { brilho: 0.8, ao: false });
  m.aguas(-11, 11, -16, -3, 15, -9.5, 23, mad, { tras: tom(mad, 0.8) });
  for (const x of [-9, 9]) m.bloco(x, 4, -3, 2, 11, 2, mad);
  for (const x of [-12, 12]) m.bloco(x, 4, -2, 2.5, 5, 2.5, '#ff9ac4', { ao: false }); // oferendas
  return topoDe(23, 10);
};
const espantalho = (m) => {
  m.bloco(0, 0, -8, 2, 26, 2, '#8a5a34'); m.bloco(0, 17, -8, 20, 2, 2, '#8a5a34');
  m.bloco(0, 12, -8, 9, 9, 5, '#4a7ac8', { cores: { topo: '#5a8ad8' } });
  for (const x of [-9, 9]) m.bloco(x, 16, -8, 3, 3, 3, '#e8c44a', { ao: false });
  m.bloco(0, 21, -8, 6, 6, 6, '#f0d8a0'); m.bloco(0, 27, -8, 11, 1.5, 11, '#c8a050'); m.bloco(0, 28.5, -8, 6, 4, 6, '#c8a050');
  return topoDe(32, 4);
};
const horta = (m, c) => {
  // canteiro de lavoura: terra arada com mudas em fila (repolho, cenoura, abóbora pelas variantes)
  m.bloco(0, 0, -8, 15, 2.5, 12, '#7a5236', { cores: { topo: '#8a5e3a' } });
  const [f, g] = [['#5aaa4a', '#8ad06a'], ['#4a9a3a', '#ff9a3a'], ['#3e8a3a', '#f2b048']][c.v % 3];
  for (const x of [-4.5, 0, 4.5]) for (const z of [-11, -5]) { m.bloco(x, 2.5, z, 3.6, 2.6, 3.6, f, { ao: false, cores: { topo: g } }); }
  return topoDe(6, 7);
};
const celeiro = (m, c) => {
  // celeiro vermelho sem porta de entrar (5x3)
  const V = '#b83a2e', B = '#f4ece0', cz = -24;
  m.caixa(-34, 0, -44, 34, 34, -6, V, { cores: { topo: V, lado: tom(V, 0.85) } });
  m.aguas(-37, 37, -46, -3, 33, -24.5, 52, '#8a4a3a', { tras: '#6a3a2e' });
  m.caixa(-12, 0, -7, 12, 24, -5.5, '#7a2a22', { sem: ['topo'] });
  for (const [a, b] of [[-11, 1], [1, 11]]) m.bloco((a + b) / 2, 11, -5.2, 10, 1.6, 0.4, B, { ao: false });
  m.bloco(0, 38, -5.4, 9, 7, 0.5, B, { ao: false });
  for (const x of [-30, 30]) m.bloco(x, 0, -5, 2, 34, 1, B, { ao: false });
  void cz;
  return { y: 52, x0: -34, x1: 34, z0: -44, z1: -6 };
};
const fonte = (m, c) => {
  // chafariz de praça (3x2): bacia de pedra, água, coluna com taça
  const p = '#c8c2b4', p2 = '#a8a294', agua = '#6ac0e8';
  m.cil(0, 0, -16, 21, 21, 6, 10, p2, { topo: p, fase: 0 });
  m.cil(0, 5.4, -16, 18, 18, 0.8, 10, agua, { brilho: -0.12, fase: 0, ao: false });
  m.cil(0, 0, -16, 4, 3, 16, 8, p, { tampa: false });
  m.cil(0, 15, -16, 9, 10, 3, 8, p2, { topo: agua });
  m.bloco(0, 18, -16, 2.4, 6, 2.4, '#e8f8ff', { ao: false });
  for (const [x, z] of [[-6, -8], [6, -9], [0, -6]]) m.bloco(x, 6, z, 2.5, 0.6, 2.5, '#ffffff', { ao: false });
  return topoDe(24, 16, -16);
};
const canteiro = (m, c) => {
  // canteiro de flores com borda de madeira (2x1)
  const fl = [['#ff7aa8', '#ffd24a', '#ffffff'], ['#b87aff', '#ff9a4a', '#ffe08a'], ['#ff5a5a', '#ffffff', '#ffb0d0']][c.v % 3];
  m.bloco(0, 0, -8, 30, 4, 12, '#8a5a34', { cores: { topo: '#6a4428' } });
  m.bloco(0, 4, -8, 27, 1, 9.5, '#4a3a22', { ao: false });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const x = -11 + i * 4.4 + (j % 2) * 2, z = -11 + j * 5;
    m.bloco(x, 5, z, 1.4, 3 + ((i + j) % 2), 1.4, '#3e8a3a', { ao: false });
    m.bloco(x, 7.6 + ((i + j) % 2), z, 2.6, 2.4, 2.6, fl[(i + j * 2) % 3], { ao: false });
  }
  return topoDe(10, 14);
};
const caixotes = (m, c) => {
  const M = ['#a8744a', '#c7925c', '#8a5a34'];
  m.bloco(-7, 0, -9, 13, 12, 12, M[0], { cores: { topo: M[1] } }); m.bloco(-7, 5, -2.9, 13, 1.4, 0.4, M[2], { ao: false });
  m.bloco(7, 0, -8, 11, 10, 11, M[1], { cores: { topo: tom(M[1], 1.1) } });
  m.bloco(-5, 12, -9, 9, 9, 9, M[1], { cores: { topo: tom(M[1], 1.12) } });
  if (c.v % 2) m.cil(9, 10, -8, 4, 4, 9, 8, '#7a5a3a', { topo: '#9a7a52' });
  return topoDe(21, 12);
};

// peças de 1 bloco que fecham as sobras do paredão (não quebram com Corte, ao contrário do "bush")
const moita = (pal, neve) => (m, c) => {
  m.bloco(0, 0, -8, 14, 8, 11, pal[0], { var: 0.1, cores: { topo: pal[1] } });
  m.bloco(-2 + c.v, 7, -8.5, 10, 5, 8, pal[1], { var: 0.1, cores: { topo: neve ? NEVE : pal[2] } });
  m.bloco(3, 3, -3.6, 6, 5, 2, pal[1], { ao: false });
  if (neve) m.bloco(-1, 12, -8.5, 7, 2, 5, '#ffffff', { ao: false });
  return topoDe(neve ? 14 : 12, 6);
};
const pedrinha = (pal) => pedra({ w: 14, h: 10, d: 11, pal });

// degrau (ledge): beirada baixa de pedra com o topo do chão do bioma; em fila forma o "pulinho" das rotas clássicas
const degrau = (topo, face) => (m, c) => {
  m.caixa(-8.1, 0, -15, 8.1, 9, -3, face[0], { cores: { topo, frente: face[1], lado: face[0] } });
  m.caixa(-8.1, 9, -15.5, 8.1, 11, -2.4, topo, { cores: { frente: tom(topo, 0.82) }, ao: false });
  m.bloco(-4 + c.v * 3, 2, -2.6, 4, 3, 0.6, face[2], { ao: false });
  return { y: 11, x0: -8, x1: 8, z0: -15, z1: -3 };
};

export const VESTIR = {
  degrau: { f: degrau('#7cb04a', ['#7a6a58', '#94826c', '#5e5044']), var: 3 },
  degrauNeve: { f: degrau('#eef4fc', ['#6e7684', '#8a929e', '#56606c']), var: 3 },
  degrauAreia: { f: degrau('#e8c88a', ['#b0784a', '#c8905a', '#8a5a36']), var: 3 },
  moita: { f: moita(['#2a7a34', '#3e9a46', '#6ac05a']), var: 3 },
  moitaNeve: { f: moita(['#2a5a3e', '#3a6e4a', '#ffffff'], true), var: 3 },
  pedrinha: { f: pedrinha(['#746e7e', '#9393a3', '#bcafc0']), var: 3 },
  pedrinhaVerm: { f: pedrinha(PAL_VERM), var: 3 },
  pedrinhaBasalto: { f: pedrinha(PAL_BAS), var: 3 },
  escarpa: { f: escarpa(['#6e6a64', '#8a857c', '#a29c90', '#6a8a4a'], { mato: '#5a8a3e' }), var: 3 },
  escarpaNeve: { f: escarpa(['#5e646e', '#7a808a', '#959ba4', NEVE], { neve: true, topo: NEVE }), var: 3 },
  escarpaVerm: { f: escarpa(PAL_VERM, { h: 50 }), var: 3 },
  escarpaBasalto: { f: escarpa(PAL_BAS, { h: 42 }), var: 3 },
  monteNeve: { f: monteNeve, var: 3 },
  pedraGelo: { f: pedraGelo, var: 3 },
  galhoNevado: { f: galhoNevado },
  pinheiroAlto: { f: pinheiroAlto(false), var: 3 },
  pinheiroNevado: { f: pinheiroAlto(true), var: 3 },
  mesa: { f: mesa, var: 4 },
  pilarRocha: { f: pilarRocha, var: 4 },
  ossada: { f: ossada },
  arbustoSeco: { f: arbustoSeco, var: 3 },
  cactoBarril: { f: cactoBarril, var: 2 },
  duna: { f: duna, var: 3 },
  pinaculo: { f: pinaculo, var: 3 },
  basaltoColunas: { f: basaltoColunas, var: 3 },
  arvoreCinza: { f: arvoreCinza },
  fendaLava: { f: fendaLava },
  concha: { f: concha, var: 3 },
  pedraMar: { f: pedraMar, var: 3 },
  barco: { f: barco, var: 3 },
  redePesca: { f: redePesca },
  pocaMare: { f: pocaMare },
  samambaia: { f: samambaia, var: 3 },
  cogumelos: { f: cogumelos, var: 2 },
  arvoreGigante: { f: arvoreGigante },
  cachoeira: { f: cachoeira },
  taboa: { f: taboa, var: 3 },
  vitoriaRegia: { f: vitoriaRegia, var: 2 },
  arcoPedra: { f: arcoPedra },
  arvoreVento: { f: arvoreVento, var: 2 },
  ruina: { f: ruina, var: 2 },
  santuario: { f: santuario },
  espantalho: { f: espantalho },
  horta: { f: horta, var: 3 },
  celeiro: { f: celeiro },
  fonte: { f: fonte },
  canteiro: { f: canteiro, var: 3 },
  caixotes: { f: caixotes, var: 2 },
};
