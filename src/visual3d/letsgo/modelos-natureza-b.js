import * as THREE from 'three';
import { cor as linear } from '../kit/construtor.js';
import { MalhaLG, pedra, topoDe, caixaR, ss, clarear } from './modelos.js';
import { prim, coneG, segmento, esf } from './modelos-util.js';

// Modelos lisos do grupo "natureza-b" (estilo Let's Go): pedras, relevo, cristais, gelo e terreno.
// Espelha src/visual3d/kit/natureza.js e kit/vestir.js (mesma pegada, mesma altura, mesmas variantes).

// ---------- ajudantes ----------
// degradê vertical (pé escuro -> topo claro) com a face de cima numa cor própria
const vgrad = (a, b, y0, y1, top) => {
  const A = linear(a), B = linear(b), T = linear(top ?? b);
  return (x, y, z, nx, ny) => {
    const t = Math.min(1, Math.max(0, (y - y0) / (y1 - y0))), u = ss(0.3, 0.8, ny);
    return [0, 1, 2].map((i) => (A[i] + (B[i] - A[i]) * t) * (1 - u) + T[i] * u);
  };
};
// cilindro/cone de faces chapadas (cristais e rocha lascada): normais por face
const chapado = (g) => { const f = g.toNonIndexed(); f.computeVertexNormals(); return f; };
const fCil = (n, topo) => prim(`fc${n}|${topo}`, () => { const g = new THREE.CylinderGeometry(topo, 1, 1, n, 1, true); g.translate(0, 0.5, 0); return chapado(g); });
const fCone = (n) => prim('fk' + n, () => { const g = new THREE.ConeGeometry(1, 1, n, 1, true); g.translate(0, 0.5, 0); return chapado(g); });
const _v = new THREE.Vector3(), _eu = new THREE.Euler();
// prisma facetado com ponta (cristal, lasca): base em (x,y,z), raio r, altura h, inclinação rx/rz
function prisma(m, x, y, z, r, h, n, cor, o = {}) {
  const f = o.f ?? 0.7, rx = o.rx ?? 0, rz = o.rz ?? 0, ry = o.ry ?? 0, tp = o.topo ?? 0.8;
  m.add(fCil(n, tp), { x, y, z, sx: r, sy: h * f, sz: r, rx, ry, rz }, cor, { ao: false, brilho: o.brilho });
  _eu.set(rx, ry, rz); _v.set(0, h * f, 0).applyEuler(_eu);
  m.add(fCone(n), { x: x + _v.x, y: y + _v.y, z: z + _v.z, sx: r * tp, sy: h * (1 - f), sz: r * tp, rx, ry, rz }, o.cor2 ?? cor, { ao: false, brilho: o.brilho });
}
// retângulo liso virado para o sul (2 triângulos): x,y = centro da base
const placa = (m, x, y, z, w, h, cor, o = {}) => m.add(prim(`pl${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), { x, y: y + h / 2, z }, cor, { ao: false, ...o });
const disco = (m, x, y, z, r, h, n, achata, cor, o = {}) => m.cil(x, y, z, r, r, h, n, cor, { achata, aberto: false, ...o });

const PV = ['#b0603e', '#cc7e50', '#e4a068', '#dcae7c'];
const POC = ['#b8824e', '#d4a062', '#ecc484', '#e4c890'];
const PB = ['#3a3438', '#4a4246', '#5a5054', '#6a5e60'];
const NEVE = '#f6faff', NEVE_S = '#c4d4ea';

// camadas arredondadas empilhadas (rocha estratificada): mesa, pilar, arco
function estratos(m, { w, d, h, cz, pal, n = 4, enc = 0.1, topo, desv = 2, lados = 10 }) {
  let y = 0, ww = w, dd = d, x = 0;
  for (let i = 0; i < n; i++) {
    const hh = (h / n) * (0.88 + m.r() * 0.24), cr = pal[i % 3], dx = (m.r() - 0.5) * desv, ult = i === n - 1;
    const r0 = (ww / 2) * 1.04, r1 = r0 * (1 - enc * 0.5);
    m.cil(x + dx, y, cz, r0, r1, hh, lados, vgrad(clarear(cr, -0.1), clarear(cr, 0.04), y, y + hh, ult ? (topo ?? pal[3]) : clarear(cr, 0.1)), { achata: dd / ww, aberto: false, ao: i === 0, var: 0.05 });
    y += hh; x += dx * 0.5; ww *= 1 - enc * (0.7 + m.r() * 0.6); dd *= 1 - enc * 0.7;
  }
  return y;
}
const tufo = (m, x, y, z, r, cor = '#5ea84a') => m.bola(x, y, z, r, r * 0.6, r * 0.8, { pe: clarear(cor, -0.1), topo: clarear(cor, 0.1) }, { d: 0, ao: false });
const seixo = (m, x, y, z, r, cr, o = {}) => m.bola(x, y, z, r, r * 0.7, r * 0.85, { pe: clarear(cr, -0.08), topo: clarear(cr, 0.08) }, { d: 0, ao: false, var: 0.06, ...o });

// ponto na superfície frontal de um elipsoide (para colar rachaduras acesas)
const frente = (cx, cy, cz, rx, ry, rz, x, y) => { const q = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2; return q <= 0 ? cz : cz + rz * Math.sqrt(q); };
const rachadura = (m, el, pts, r, cor) => {
  const P = pts.map(([x, y]) => [x, y, frente(...el, x, y) + 0.4]);
  for (let i = 0; i < P.length - 1; i++) segmento(m, P[i], P[i + 1], r, r, 4, cor, { brilho: -1, ao: false, aberto: false });
};

// copia uma malha auxiliar para a malha principal, deslocada em x
function deslocar(m, sub, dx) {
  const base = m.p.length / 3;
  for (let i = 0; i < sub.p.length; i += 3) m.p.push(sub.p[i] + dx, sub.p[i + 1], sub.p[i + 2]);
  m.n.push(...sub.n); m.c.push(...sub.c); m.b.push(...sub.b);
  for (const k of sub.i) m.i.push(k + base);
}

// ---------- pedras ----------
const lavaRock = (m, c) => {
  const w = 24, h = 15, d = 13, cz = -8;
  pedra({ w, h, d, pal: ['#3a2c30', '#6a5658'] })(m, c);
  const el = [0, h * 0.42, cz, w * 0.5, h * 0.62, d * 0.55];
  rachadura(m, el, [[-9, 3.2], [-4, 4.4], [-1, 7.6], [4, 9.4], [8.4, 6]], 0.75, '#ff8a2a');
  rachadura(m, el, [[2, 2.4], [2.6, 5.4]], 0.6, '#ffc050');
  m.bola(5, h * 0.9, cz - 0.5, 2.2, 0.6, 1.8, '#ffb040', { d: 0, brilho: -1, ao: false });
  return { y: h, x0: -w * 0.3, x1: w * 0.2, z0: cz - d * 0.3, z1: cz + d * 0.3 };
};
const obsidiana = (m, c) => {
  m.bola(0, 1.2, -8, 8.5, 2.6, 6, { pe: '#2a2432', topo: '#4a4258' }, { d: 1 });
  const cor = { pe: '#1c1626', topo: '#6a52a0' };
  prisma(m, -2, 1, -9, 4.4, 17 + c.v * 2, 5, cor, { cor2: '#8a6ac8', rz: 0.08, brilho: -0.12, ry: 0.2 });
  prisma(m, 4.4, 1, -6.5, 3.3, 11, 5, cor, { cor2: '#7a5cb8', rz: -0.22, rx: 0.12, brilho: -0.12, ry: 1.1 });
  prisma(m, -6.2, 1, -5.5, 2.6, 8, 5, cor, { cor2: '#7a5cb8', rz: 0.3, rx: 0.18, brilho: -0.12, ry: 2 });
  return topoDe(18, 4);
};

// ponta de caverna (estalagmite): andares afinando, arredondados
function ponta(pal, gelo) {
  return (m) => {
    const o = gelo ? { brilho: -0.1, ao: false } : {};
    m.cil(0, 0, -8, 6.6, 4.6, 8, 9, { pe: pal[2], topo: pal[0] }, { desvio: 0.2, aberto: false, ...o });
    m.cil(0.4, 7.5, -8, 5, 2.8, 8, 9, { pe: pal[0], topo: pal[1] }, { aberto: false, ...o });
    m.cil(1, 15, -8, 3, 1.4, 7, 8, { pe: pal[0], topo: pal[1] }, { aberto: false, ...o });
    m.cone(1.3, 21, -8, 1.5, 5.4, 8, pal[1], o);
    m.bola(-5, 2, -5.5, 2.6, 3.2, 2.4, { pe: pal[2], topo: pal[0] }, { d: 0, ...o });
    m.bola(6, 1.4, -5.2, 2, 2.2, 1.8, { pe: pal[2], topo: pal[0] }, { d: 0, ...o });
    return topoDe(26, 2);
  };
}

// cristais: prismas facetados com brilho próprio saindo de uma base de rocha
function cristais(pal, alto = 1) {
  return (m) => {
    m.bola(0, 1.6, -8, 8, 2.8, 5.2, { pe: '#4a4258', topo: '#7a7088' }, { d: 1 });
    const cor = { pe: pal[0], topo: pal[1] };
    const b = { brilho: -0.5, cor2: pal[1] };
    prisma(m, 0, 1, -8, 3.6, 22 * alto, 6, cor, { ...b, ry: 0.3, f: 0.72 });
    prisma(m, -5.2, 1.4, -6.2, 2.5, 13 * alto, 6, cor, { ...b, rz: 0.34, rx: 0.1, ry: 0.5 });
    prisma(m, 5.2, 1.4, -6.6, 2.7, 15 * alto, 6, cor, { ...b, rz: -0.3, rx: 0.12, ry: 1.0 });
    prisma(m, 1.6, 1, -4, 1.6, 7 * alto, 5, cor, { ...b, rx: 0.5, ry: 0.2 });
    return topoDe(24 * alto, 3);
  };
}

const iceBlock = (m) => {
  m.caixa(0, 0, -8, 14, 15, 13, 3.6, { pe: '#7ab8e0', topo: '#d4f0ff' }, { seg: 1, brilho: -0.08, ao: false });
  placa(m, -3.2, 5.6, -1.25, 1.6, 6.5, '#f2fbff');
  m.bola(3.2, 12.4, -4.2, 2.6, 0.6, 1.8, '#ffffff', { d: 0, ao: false });
  return topoDe(15, 6);
};
const menhir = (m) => {
  m.cil(0, 0, -8, 6.6, 4.2, 29, 8, { pe: '#7a7a88', topo: '#b0b0be' }, { aberto: false, var: 0.05, desvio: 0.3 });
  m.bola(0, 29, -8, 4.2, 5, 4.2, { pe: '#a0a0ae', topo: '#c4c4d0' }, { d: 1, ao: false });
  placa(m, 0, 12.5, -2.7, 2.4, 2.4, '#d8bc50'); placa(m, 0, 19, -3.4, 2.4, 2.4, '#d8bc50');
  m.bola(-4, 1.2, -4.4, 3.4, 2.2, 2.6, { pe: '#4a9a4a', topo: '#7ad06a' }, { d: 0 });
  m.bola(3.6, 0.8, -3.6, 2.2, 1.4, 1.8, { pe: '#4a9a4a', topo: '#7ad06a' }, { d: 0 });
  return topoDe(34, 3);
};
const skull = (m) => {
  const osso = { pe: '#cfc4ac', topo: '#fbf6ea' }, osso2 = '#ece3cf';
  // ossos cruzados atrás da caveira
  for (const s of [-1, 1]) {
    segmento(m, [s * 7.5, 1.6, -9.6], [-s * 7.5, 1.6, -6.4], 1.2, 1.2, 5, osso2, { ao: false, aberto: false });
  }
  m.bola(0, 4.6, -8.2, 4.6, 4.2, 4.6, osso, { d: 1, ao: false });
  m.bola(0, 1.2, -6.4, 2.6, 1.3, 1.8, '#e0d6bc', { d: 0, ao: false });
  for (const s of [-1, 1]) placa(m, s * 1.9 - 0.0, 3.0, -3.6, 1.8, 2.2, '#2e2626');
  return topoDe(8, 4);
};
const snowman = (m) => {
  const neve = { pe: '#cddcf0', topo: '#ffffff' };
  m.bola(0, 6, -8, 6.6, 6.2, 6.4, neve, { d: 1, ao: false });
  m.bola(0, 14, -8, 5, 4.8, 4.9, neve, { d: 1, ao: false });
  m.bola(0, 20.2, -8, 3.9, 3.8, 3.8, neve, { d: 1, ao: false });
  // cachecol, nariz de cenoura, olhos e botões, cartola
  m.cil(0, 16.2, -8, 4.6, 4.4, 1.9, 8, '#e8584a', { aberto: false, ao: false });
  placa(m, 2.6, 9, -3.3, 2, 6, '#d8483c');
  m.add(coneG(6), { x: 0, y: 20, z: -4.3, sx: 0.9, sy: 4, sz: 0.9, rx: Math.PI / 2 }, '#ff8a2a', { ao: false });
  for (const s of [-1, 1]) placa(m, s * 1.5, 21, -4.1, 1, 1, '#262630');
  for (const y of [11.2, 8]) placa(m, 0, y, -3, 1.2, 1.2, '#262630');
  m.cil(0, 23, -8, 5.2, 5.2, 0.9, 8, '#2e2e38', { aberto: false, ao: false });
  m.cil(0, 23.6, -8, 3.4, 3.2, 4.4, 8, { pe: '#2e2e38', topo: '#4a4a58' }, { aberto: false, ao: false });
  m.cil(0, 23.8, -8, 3.5, 3.5, 1, 8, '#d8483c', { aberto: false, ao: false });
  return topoDe(28, 3);
};

// degrau (beirada baixa de pedra com o topo do chão do bioma)
const degrau = (topo, face) => (m, c) => {
  const f0 = linear(face[0]), f1 = linear(face[1]), t0 = linear(clarear(topo, -0.1)), t1 = linear(topo);
  const cr = (x, y, z, nx, ny) => { const k = ss(0, 9, y), u = ss(7.4, 8.4, y) ; const A = [0, 1, 2].map((i) => f0[i] + (f1[i] - f0[i]) * k), B = [0, 1, 2].map((i) => t0[i] + (t1[i] - t0[i]) * ss(0.2, 0.8, ny)); return [0, 1, 2].map((i) => A[i] * (1 - u) + B[i] * u); };
  m.add(caixaR(16.8, 11, 13.4, 3.2, 1), { x: 0, y: 5.5, z: -9.2 }, cr, { ao: true });
  if (c.v === 1) m.bola(-4, 2.4, -2.6, 2.4, 1.8, 1.2, face[2], { d: 0, ao: false });
  if (c.v === 2) m.bola(4.4, 2, -2.6, 1.8, 1.4, 1, face[2], { d: 0, ao: false });
  return { y: 11, x0: -8, x1: 8, z0: -15, z1: -3 };
};
const pedrinha = (pal) => pedra({ w: 14, h: 10, d: 11, pal: [pal[0], pal[2]] });

// ---------- paredões e relevo grande ----------
function escarpa(pal, o = {}) {
  return (m, c) => {
    const h = (o.h ?? 46) + c.v * 5, cz = -16, ws = [50, 42, 33], ds = [30, 25, 19], hs = [0.4, 0.34, 0.3];
    let y = 0; const dx = [-2, 3, 1][c.v % 3], dxs = [0, dx, -dx * 1.2];
    for (let i = 0; i < 3; i++) {
      const hh = h * hs[i] * (0.92 + m.r() * 0.16), cr = pal[i % 3];
      m.add(caixaR(ws[i], hh, ds[i], 6.5 - i, 1), { x: dxs[i], y: y + hh / 2, z: cz + i * 0.8 }, vgrad(clarear(cr, -0.1), clarear(cr, 0.03), y, y + hh, i === 2 ? (o.topo ?? pal[3]) : clarear(cr, 0.12)), { ao: i === 0, var: 0.05 });
      y += hh * 0.95;
    }
    const tc = o.topo ?? pal[3], x3 = dxs[2];
    if (o.neve) {
      m.bola(x3, y, cz + 1, 16, 4.6, 9.4, { pe: NEVE_S, topo: '#ffffff' }, { d: 1, ao: false });
      m.bola(x3 + 8, y + 2.4, cz + 3, 7, 3, 4.4, '#ffffff', { d: 0, ao: false });
    } else {
      m.bola(x3, y, cz + 1, 16, 3.6, 9.4, { pe: clarear(tc, -0.08), topo: clarear(tc, 0.08) }, { d: 1, ao: false });
      if (o.mato) for (const [x, z, r] of [[-9, -17, 6], [8, -13, 4.6]]) tufo(m, x + x3, y + 1.4, z, r, o.mato);
    }
    // pedras soltas no pé
    seixo(m, -17, 3, -3, 5.4, pal[0], { d: 1 }); seixo(m, 15, 2.4, -2, 4.4, pal[1]);
    return topoDe(y, 18, -16);
  };
}

const monteNeve = (m, c) => {
  const w = 13 + c.v * 1.5;
  m.bola(0, 0, -8, w, 5.2, w * 0.55, { pe: NEVE_S, topo: '#fbfdff' }, { d: 1, ao: false });
  m.bola(-2 + c.v, 3, -9, w * 0.66, 4.8, w * 0.38, { pe: '#dce8f6', topo: '#ffffff' }, { d: 1, ao: false });
  m.bola(-3 + c.v, 6.6, -9, w * 0.32, 3.2, w * 0.2, '#ffffff', { d: 0, ao: false });
  return { y: 10, x0: -w, x1: w, z0: -14, z1: -2 };
};
const pedraGelo = (m, c) => {
  pedra({ w: 26, h: 15, d: 14, pal: ['#6c7a94', '#aab8d0'] })(m, c);
  m.bola(-2, 14.2, -8, 8.6, 2.4, 5.2, { pe: NEVE_S, topo: '#ffffff' }, { d: 1, ao: false });
  for (const [x, h, rz] of [[-7, 5.6, 0.1], [4, 5, -0.12]]) prisma(m, x, 4.6, -0.5, 1.4, h, 4, { pe: '#9ad0f0', topo: '#e8f8ff' }, { brilho: -0.3, rz, rx: 0.45, cor2: '#f2fcff' });
  return { y: 16, x0: -7, x1: 8, z0: -12, z1: -4 };
};

const mesa = (m, c) => {
  const pal = c.v % 2 ? POC : PV, w = 44 + c.v * 2;
  const y = estratos(m, { w, d: 30, h: 40 + c.v * 6, cz: -16, pal, n: 4, enc: 0.09, desv: 4.5, lados: 10 });
  m.bola(0, y, -16, w * 0.42, 2.6, 12, { pe: clarear(pal[3], -0.08), topo: clarear(pal[3], 0.06) }, { d: 1, ao: false });
  tufo(m, -8, y + 1.4, -16, 4.4, '#78a84a'); tufo(m, 9, y + 1.2, -18, 3.4, '#6a9a3e');
  for (const [x, z, s] of [[-20, -2, 6], [-12, 0, 4], [16, -1, 5.5], [22, -4, 4]]) seixo(m, x, s * 0.4, z, s, pal[0]);
  return topoDe(y + 3, 18, -16);
};
const pilarRocha = (m, c) => {
  const pal = c.v % 2 ? POC : PV;
  const y = estratos(m, { w: 14, d: 12, h: 36 + c.v * 8, cz: -8, pal, n: 5, enc: 0.04, desv: 2.5, lados: 9 });
  m.bola(0, y, -8, 6.4, 3, 5.4, { pe: clarear(pal[2], -0.05), topo: clarear(pal[2], 0.1) }, { d: 1, ao: false });
  seixo(m, -7, 2, -3.6, 4.4, pal[0]); seixo(m, 6.4, 1.6, -4, 3.6, pal[1]);
  return topoDe(y + 3, 6);
};
const ossada = (m) => {
  const osso = { pe: '#d6cbb2', topo: '#fbf6ea' }, osso2 = '#e4dac2';
  segmento(m, [-15, 2.2, -8], [3, 2.2, -8], 1.3, 1.3, 5, osso, { ao: false, aberto: false });
  for (let k = 0; k < 4; k++) { const x = -12 + k * 4.4, e = 4.6 - k * 0.3; for (const s of [-1, 1]) segmento(m, [x, 2.8, -8 + s * 0.5], [x, 0.9, -8 + s * e], 0.85, 0.65, 4, k % 2 ? osso2 : osso, { ao: false }); }
  m.bola(9, 3.4, -7.4, 4, 3.4, 3.6, osso, { d: 1, ao: false });
  m.bola(11.8, 1.4, -7.4, 2.4, 1.2, 1.6, osso2, { d: 0, ao: false });
  placa(m, 10.2, 3.4, -3.7, 1.6, 1.8, '#2e2626');
  for (const s of [-1, 1]) segmento(m, [8 + s * 3, 1.2, -9.6], [8 + s * 7, 0.7, -11], 0.8, 0.8, 4, osso2, { ao: false });
  return topoDe(5, 10);
};
const duna = (m, c) => {
  const dx = (c.v - 1) * 3, k = [0.8, 1, 1.25][c.v % 3];
  m.bola(0, 0, -16, 23.5 * k, 10.5 * k, 15 * k, { pe: '#d2a062', topo: '#f2d49a' }, { d: 1, ao: false });
  m.bola((dx + 2) * k, 2 * k, -17, 17 * k, 11 * k, 10 * k, { pe: '#e6bc80', topo: '#fae4b4' }, { d: 1, ao: false });
  m.bola((dx + 5) * k, 6 * k, -17, 9 * k, 8.4 * k, 6 * k, { pe: '#f4d8a0', topo: '#fff0cc' }, { d: 1, ao: false });
  return topoDe(15 * k, 18, -16);
};

// ---------- vulcão ----------
const pinaculo = (m, c) => {
  const pal = ['#6a2e22', '#8a3e2a', '#b05a3e'], e = c.v * 6, H = 40 + e;
  m.bola(0, 3, -8, 8.6, 4.4, 7, { pe: '#2e2a2e', topo: '#5a5054' }, { d: 1 });
  m.cil(0, 3, -8, 6.6, 3.4, 20 + e * 0.5, 7, { pe: pal[0], topo: pal[1] }, { aberto: false, desvio: 0.3 });
  m.cil(0.8, 22 + e * 0.5, -8, 3.4, 1.2, 14 + e * 0.5, 7, { pe: pal[1], topo: pal[2] }, { aberto: false });
  m.cone(1.2, H - 6, -8, 1.3, 7, 7, pal[2]);
  const el = [0, 14, -8, 6.6, 12, 6.6];
  rachadura(m, el, [[-1, 7], [0, 12], [-1.5, 17]], 0.6, '#ff8a3a');
  return topoDe(H, 3);
};
const basaltoColunas = (m, c) => {
  const hs = [[-8, -10, 26], [0, -9, 34], [8, -11, 22], [-4, -4, 16], [5, -3, 12], [12, -5, 8], [-12, -3, 10]];
  hs.forEach(([x, z, h], i) => {
    const hh = h + c.v * 3, cr = PB[i % 3];
    m.cil(x, 0, z, 4.4, 4.4, hh, 6, { pe: clarear(cr, -0.04), topo: '#625e68' }, { aberto: false, desvio: 0.15, var: 0.05 });
  });
  return topoDe(34, 12);
};
const fendaLava = (m) => {
  m.caixa(0, 0, -8, 30, 1.8, 9, 0.8, { pe: '#2e2a2e', topo: '#4a4246' }, { seg: 1, ao: false });
  const P = [[-13, -8.4], [-8, -9.4], [-2, -7], [4, -8.6], [10, -6.4], [13.5, -7.4]];
  for (let i = 0; i < P.length - 1; i++) segmento(m, [P[i][0], 1.9, P[i][1]], [P[i + 1][0], 1.9, P[i + 1][1]], 1.3, 1.3, 4, '#ff6a1a', { brilho: -1, ao: false });
    m.bola(7, 2, -6, 2.4, 0.8, 1.8, '#ffc040', { d: 0, brilho: -1, ao: false });
  m.bola(-5, 2, -8.4, 1.6, 0.7, 1.2, '#ffc040', { d: 0, brilho: -1, ao: false });
  return topoDe(2, 12);
};

// ---------- praia ----------
const concha = (m, c) => {
  const cs = [['#f6dccc', '#e8a888'], ['#ffc0b0', '#e87a6a'], ['#fbeab4', '#e0c070']][c.v % 3];
  m.bola(-3, 1.3, -9, 3.8, 2.4, 3.2, { pe: cs[1], topo: cs[0] }, { d: 1, ao: false });
  m.bola(-2.6, 2.6, -8.4, 1.8, 1.2, 1.6, cs[1], { d: 0, ao: false });
  for (let k = 0; k < 5; k++) { const a = k * 1.2566; m.add(esf(0), { x: 4 + Math.cos(a) * 2.6, y: 0.7, z: -5 + Math.sin(a) * 2.6, sx: 2.4, sy: 0.8, sz: 1, ry: -a }, '#ff8a4a', { ao: false }); }
  m.bola(4, 1, -5, 1.3, 0.9, 1.3, '#ffa860', { d: 0, ao: false });
  return topoDe(3, 5);
};
const pedraMar = (m, c) => {
  const pal = ['#58686e', '#76878c', '#9aaaa8'];
  m.bola(-3, 5 + c.v, -9, 10, 6.4 + c.v, 7.6, { pe: '#2e3e42', topo: pal[2] }, { d: 1, var: 0.06 });
  m.bola(7, 3, -6, 6, 4, 5, { pe: '#2e3e42', topo: pal[1] }, { d: 1, var: 0.06 });
  m.bola(-5, 9 + c.v * 2, -9, 2.6, 0.7, 1.9, '#f0ece4', { d: 0, ao: false });
  m.bola(1.4, 3, -3.4, 1.9, 1.4, 0.8, '#5a9a4a', { d: 0, ao: false }); m.bola(0, 4.4, -3.4, 1.2, 1.8, 0.7, '#4a8a3e', { d: 0, ao: false });
  return topoDe(11 + c.v * 2, 9);
};
const pocaMare = (m) => {
  disco(m, 0, 0, -8, 13.4, 2.4, 12, 0.52, { pe: '#566468', topo: '#8a9a9c' }, { ao: false });
  disco(m, 0, 2, -8, 10.6, 0.7, 12, 0.52, { pe: '#4ab0cc', topo: '#8ee0f0' }, { brilho: -0.15, ao: false });
  m.bola(-5, 3, -9, 1.6, 1.4, 1.6, '#ff7a6a', { d: 0, ao: false }); m.bola(-3.4, 2.8, -7.4, 1, 0.9, 1, '#ff9a8a', { d: 0, ao: false });
  m.bola(5, 2.8, -6, 1.8, 1, 1.4, '#7ad070', { d: 0, ao: false });
  for (const [x, z, r] of [[-12, -4, 3], [12, -11, 3.2], [10, -3, 2.6], [-8, -12, 2.4]]) seixo(m, x, r * 0.5, z, r, '#7a8a8c');
  return topoDe(4, 12);
};

// ---------- cachoeira, arco e ruína ----------
const cachoeira = (m) => {
  const pal = ['#5e5e66', '#76767e', '#8e8e94'], musgo = '#5c9a4a';
  m.add(caixaR(54, 56, 12, 5, 1), { x: 0, y: 28, z: -26 }, vgrad('#4a4a52', '#7e7e86', 0, 56, musgo), { ao: true });
  m.cil(-18, 0, -17, 8.4, 7.4, 43, 8, vgrad('#4e4e56', '#86868e', 0, 43, musgo), { achata: 0.8, aberto: false, ao: false });
  m.cil(18, 0, -17, 8.4, 7.4, 39, 8, vgrad('#505058', '#8a8a92', 0, 39, musgo), { achata: 0.8, aberto: false, ao: false });
  m.bola(0, 56, -26, 25, 3, 6.4, { pe: '#4a8a3c', topo: '#7cc060' }, { d: 1, ao: false });
  m.bola(-18, 43, -17, 8, 2.6, 6.2, { pe: '#4a8a3c', topo: '#7cc060' }, { d: 0, ao: false });
  m.bola(18, 39, -17, 8, 2.6, 6.2, { pe: '#4a8a3c', topo: '#7cc060' }, { d: 0, ao: false });
  // véu d'água e fios de espuma
  placa(m, 0, 3, -19.4, 16, 52, vgrad('#c8eefc', '#7cc4ec', 4, 56), { brilho: -0.25 });
  for (let y = 9; y < 52; y += 9) placa(m, -3 + (y % 2) * 5, y, -19.2, 3.2, 5, '#f2fcff', { brilho: -0.1 });
  // poço e espuma
  disco(m, 0, 0, -9, 16, 1.8, 12, 0.52, { pe: '#3e98d0', topo: '#86d4f0' }, { brilho: -0.15, ao: false });
  for (const [x, z, r] of [[-5, -15, 5.4], [5, -14, 5], [0, -11, 4.6], [-9.5, -9, 3.4], [9.5, -8, 3.4]]) m.bola(x, 1.8, z, r, 1.3, r * 0.6, { pe: '#e4f4fc', topo: '#ffffff' }, { d: 0, ao: false });
  seixo(m, -20, 2.6, -4, 6, pal[1], { d: 1 }); seixo(m, 20, 2.4, -5, 5.4, pal[1], { d: 1 });
  tufo(m, -20.5, 5.6, -3, 3, '#5a9a44'); tufo(m, 21, 5, -7, 2.6, '#5a9a44');
  return topoDe(58, 22, -26);
};
const arcoPedra = (m) => {
  const pal = ['#827a72', '#9c968a', '#b4aea0', '#6a8a4a'];
  for (const sx of [-1, 1]) {
    // pilar de camadas arredondadas, deslocado para x = +-24 (estratos desenha em torno de x = 0)
    const sub = new MalhaLG(m.r() * 1e6 | 0);
    const y = estratos(sub, { w: 15, d: 13, h: 38, cz: -8, pal, n: 3, enc: 0.03, desv: 1.2, lados: 7 });
    deslocar(m, sub, sx * 24);
    m.bola(sx * 24, y, -8, 8, 3, 7, { pe: '#5e8a40', topo: '#8ac468' }, { d: 0, ao: false });
  }
  // o vão: arco de segmentos grossos com juntas redondas
  const P = [];
  for (let i = 0; i <= 8; i++) { const t = Math.PI * (1 - i / 8); P.push([24 * Math.cos(t) * 0.98, 36 + 12 * Math.sin(t), -8]); }
  for (let i = 0; i < 8; i++) segmento(m, P[i], P[i + 1], 5.6, 5.6, 6, { pe: pal[0], topo: pal[2] }, { desvio: 0.3, ao: false, var: 0.05 });
  P.forEach((p, i) => m.bola(p[0], p[1], p[2], 5.6, 5.6, 5.6, { pe: pal[i % 2], topo: pal[2] }, { d: 0, ao: false }));
  m.bola(-5, 49.6, -8, 12, 3, 6.4, { pe: '#5e8a40', topo: '#8ac468' }, { d: 1, ao: false });
  return topoDe(50, 28);
};
const ruina = (m, c) => {
  const p = ['#b0a690', '#cac2ac', '#948c78'], musgo = '#78a850';
  const parede = (x, w, h, d, z, cr) => m.add(caixaR(w, h, d, 1.8, 1), { x, y: h / 2, z }, vgrad(clarear(cr, -0.12), clarear(cr, 0.02), 0, h, musgo), { ao: true, var: 0.05 });
  const hA = 31 - c.v * 6;
  parede(-14, 20, hA, 9, -10, p[0]);
  placa(m, -14, 10, -5.4, 7, 12, '#3e3a32');
  m.bola(-14, hA, -10, 9.4, 1.8, 4.4, { pe: '#5e9440', topo: '#8ac068' }, { d: 0, ao: false });
  parede(5, 11, 17, 9, -10, p[1]);
  m.bola(5, 17, -10, 5.4, 1.6, 4.4, { pe: '#5e9440', topo: '#8ac068' }, { d: 0, ao: false });
  const hc = 27 - c.v * 8;
  m.cil(18.5, 0, -8, 4.4, 4, hc, 8, { pe: p[0], topo: p[1] }, { aberto: false });
  m.cil(18.5, hc, -8, 5, 5, 1.6, 8, p[1], { aberto: false, ao: false });
  for (const [x, z, s2] of [[-1, -2, 5.2], [13, 0, 4.2], [-24, -3, 3.4]]) seixo(m, x, s2 * 0.4, z, s2, p[2], { d: 1 });
  return topoDe(30, 20, -10);
};

// ---------- tabela ----------
export const TIPOS_NATUREZA_B = {
  pedregulho: { f: pedra({ w: 28, h: 18, d: 14, pal: ['#4e4a58', '#8a8696'] }), var: 2 },
  strengthRock: { f: pedra({ w: 15, h: 16, d: 13, pal: ['#767284', '#bab6c6'] }) },
  obsidianRock: { f: obsidiana, var: 2 },
  lavaRock: { f: lavaRock, var: 2 },
  stalagmite: { f: ponta(['#9a8878', '#c0ae9a', '#6e5e54'], false) },
  stalagmiteIce: { f: ponta(['#98cef0', '#e0f6ff', '#6aa4d4'], true) },
  crystal: { f: cristais(['#3cc8d0', '#b4fffa']) },
  crystalPink: { f: cristais(['#d050d4', '#ffc0f6']) },
  cristal: { f: cristais(['#52e0d8', '#e0fffb'], 0.9) },
  iceBlock: { f: iceBlock },
  menhir: { f: menhir },
  skull: { f: skull },
  snowman: { f: snowman },
  degrauNeve: { f: degrau('#f0f6fe', ['#7c8494', '#9aa2b0', '#626c7a']), var: 3 },
  degrauAreia: { f: degrau('#ecd096', ['#b8804e', '#d0985e', '#926040']), var: 3 },
  pedrinhaVerm: { f: pedrinha(PV), var: 3 },
  pedrinhaBasalto: { f: pedrinha(PB), var: 3 },
  escarpa: { f: escarpa(['#78746c', '#948f85', '#aaa496', '#6a9a4a'], { mato: '#5e9a42' }), var: 3 },
  escarpaNeve: { f: escarpa(['#68707c', '#8890a0', '#a2aab6', NEVE], { neve: true, topo: NEVE }), var: 3 },
  escarpaVerm: { f: escarpa(PV, { h: 50 }), var: 3 },
  escarpaBasalto: { f: escarpa(PB, { h: 42 }), var: 3 },
  monteNeve: { f: monteNeve, var: 3 },
  pedraGelo: { f: pedraGelo, var: 3 },
  mesa: { f: mesa, var: 4 },
  pilarRocha: { f: pilarRocha, var: 4 },
  ossada: { f: ossada },
  duna: { f: duna, var: 3 },
  pinaculo: { f: pinaculo, var: 3 },
  basaltoColunas: { f: basaltoColunas, var: 3 },
  fendaLava: { f: fendaLava },
  concha: { f: concha, var: 3 },
  pedraMar: { f: pedraMar, var: 3 },
  pocaMare: { f: pocaMare },
  cachoeira: { f: cachoeira },
  arcoPedra: { f: arcoPedra },
  ruina: { f: ruina, var: 2 },
};
