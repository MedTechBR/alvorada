import * as THREE from 'three';
import { prim } from './modelos.js';
import { segmento, estadoKit } from './modelos-util.js';
// Modelos lisos do grupo "objetos-b" (estilo Let's Go): mecanismos, portas, barracas, palco, painéis, lápides.
// Mesma pegada, altura e estados do kit voxel (src/visual3d/kit/objetos.js).

const t1 = (y, r = 6, cz = -8) => ({ y, x0: -r, x1: r, z0: cz - r, z1: cz + r });
const MAD = { pe: '#6a4428', topo: '#a87448' };


// caixa chanfrada barata (44 triângulos, com a quina macia pela mistura das normais): no lugar do caixaR com subdivisão
function caixaB(w, h, d, r) {
  return prim(`bb${w}|${h}|${d}|${r}`, () => {
    r = Math.min(r, w / 2, h / 2, d / 2) * 0.999;
    const P = [], N = [], I = [], hw = w / 2, hh = h / 2, hd = d / 2, id = {};
    const V = (sx, sy, sz, k) => { const kk = `${sx}${sy}${sz}${k}`; if (id[kk] != null) return id[kk];
      const n = [0, 0, 0]; n[k] = [sx, sy, sz][k];
      P.push(k === 0 ? sx * hw : sx * (hw - r), k === 1 ? sy * hh : sy * (hh - r), k === 2 ? sz * hd : sz * (hd - r)); N.push(...n); return (id[kk] = P.length / 3 - 1); };
    const T = (a, b, c) => { const pa = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], pb = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], pc = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]];
      const u = pb.map((v, i) => v - pa[i]), v2 = pc.map((v, i) => v - pa[i]), f = [u[1] * v2[2] - u[2] * v2[1], u[2] * v2[0] - u[0] * v2[2], u[0] * v2[1] - u[1] * v2[0]];
      const out = [(pa[0] + pb[0] + pc[0]), (pa[1] + pb[1] + pc[1]), (pa[2] + pb[2] + pc[2])];
      (f[0] * out[0] + f[1] * out[1] + f[2] * out[2] >= 0) ? I.push(a, b, c) : I.push(a, c, b); };
    const S = [-1, 1];
    for (const sx of S) for (const sy of S) for (const sz of S) T(V(sx, sy, sz, 0), V(sx, sy, sz, 1), V(sx, sy, sz, 2)); // cantos
    for (let k = 0; k < 3; k++) { // faces grandes
      const a = (k + 1) % 3, b = (k + 2) % 3;
      for (const s of S) { const q = []; for (const sa of S) for (const sb of S) { const g = [0, 0, 0]; g[k] = s; g[a] = sa; g[b] = sb; q.push(V(g[0], g[1], g[2], k)); } T(q[0], q[1], q[2]); T(q[1], q[3], q[2]); }
    }
    for (let k = 0; k < 3; k++) { // arestas: entre duas faces (k e a) ao longo do eixo b
      const a = (k + 1) % 3, b = (k + 2) % 3;
      for (const sk of S) for (const sa of S) { const q = []; for (const sb of S) { const g = [0, 0, 0]; g[k] = sk; g[a] = sa; g[b] = sb; q.push(V(g[0], g[1], g[2], k), V(g[0], g[1], g[2], a)); } T(q[0], q[1], q[2]); T(q[1], q[3], q[2]); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I); return g;
  });
}
const cx = (m, x, y, z, w, h, d, r, cr, o = {}) => m.add(caixaB(w, h, d, r), { x, y: y + h / 2, z, rx: o.rx, ry: o.ry, rz: o.rz }, cr, o);

// plano liso virado para o sul (letreiros, telas, listras): 2 triângulos
const planoG = () => prim('plano', () => new THREE.PlaneGeometry(1, 1));
const lam = (m, x, y, z, w, h, cr, o = {}) => m.add(planoG(), { x, y: y + h / 2, z, sx: w, sy: h }, cr, { todas: true, ao: false, ...o });
// plano deitado (virado para cima), largura w, profundidade d centrada em z
const lamH = (m, x, y, z, w, d, cr, o = {}) => m.add(planoG(), { x, y, z, sx: w, sy: d, rx: -Math.PI / 2 }, cr, { todas: true, ao: false, ...o });
// triângulo solto (gomos de toldo, bandeirolas); as normais dizem para onde a face aponta (acerta a ordem dos vértices)
function tri(m, a, b, c, cr, nA, nB, nC, o = {}) {
  const g = new THREE.BufferGeometry(), A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), C = new THREE.Vector3(...c);
  const f = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)), nn = new THREE.Vector3(...nA).add(new THREE.Vector3(...nB)).add(new THREE.Vector3(...nC));
  const ok = f.dot(nn) >= 0, [p, q] = ok ? [b, c] : [c, b], [np, nq] = ok ? [nB, nC] : [nC, nB];
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...p, ...q], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([...nA, ...np, ...nq], 3));
  return m.add(g, {}, cr, { todas: true, ao: false, ...o });
}
// toldo cônico com gomos de duas cores (guarda-sol, barraca): normais da superfície do cone, listras nítidas
function toldo(m, cx, y, cz, r, h, n, cores, o = {}) {
  const L = Math.hypot(r, h), kn = (a) => [Math.cos(a) * h / L, r / L, Math.sin(a) * h / L];
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
    tri(m, [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r], [cx, y + h, cz], cores[k % cores.length], kn(a0), kn(a1), kn(am), o);
  }
}

// ---------- mecanismos ----------
const chest = (m, c) => {
  const a = c.estado === 'aberto', OURO = '#d8b048';
  cx(m, 0, 0, -8, 16, 8, 11, 2, { pe: '#6a4018', topo: '#a8743a' }, {});
  for (const x of [-5, 5]) lam(m, x, 0.4, -2.45, 1.8, 7.2, OURO);
  lam(m, 0, 2.4, -2.44, 16, 1.4, OURO);
  if (a) {
    // tampa levantada para trás, interior escuro e brilho dourado
    lamH(m, 0, 8.05, -8, 14, 9, '#2a1808');
    m.bola(0, 8.6, -8, 5.2, 1.6, 3, '#ffe27a', { d: 0, brilho: -0.8, ao: false });
    cx(m, 0, 8, -13.6, 16, 9, 2, 1, { pe: '#8a5a2a', topo: '#b8843e' }, { rx: -0.2, ao: false });
    lam(m, 0, 9, -11.9, 13, 6.5, '#4a2c14', { rx: -0.2 });
  } else {
    m.cil(-8, 8, -8, 4.2, 4.2, 16, 9, { pe: '#8a5a2a', topo: '#c08a46' }, { rz: -Math.PI / 2, achata: 1.3, aberto: false, ao: false });
    for (const x of [-5.9, 4.1]) m.cil(x, 8, -8, 4.5, 4.5, 1.8, 9, OURO, { rz: -Math.PI / 2, achata: 1.28, ao: false });
    m.bola(0, 8.6, -2.4, 1.5, 2, 0.8, '#f2d24c', { d: 0, ao: false });
  }
  return t1(a ? 8 : 12, 7);
};
const cart = (m) => {
  cx(m, 0, 3, -8, 14, 8, 12, 2.4, { pe: '#585c68', topo: '#9a9eaa' });
  cx(m, 0, 10, -8, 16, 2.2, 14, 1.1, '#c4c8d4', { ao: false });
  lamH(m, 0, 12.25, -8, 12, 10, '#33333c');
  m.bola(-2.6, 12.6, -8.5, 3.4, 2.3, 2.8, '#8a6a4a', { d: 0, ao: false });
  m.bola(3, 12.6, -7.5, 3, 2.6, 2.6, '#6a6a76', { d: 0, ao: false });
  for (const x of [-4.5, 4.5]) m.cil(x, 0.2, -2.6, 2.4, 2.4, 1.4, 8, '#2a2a30', { rz: -Math.PI / 2, aberto: false, ao: false });
  return t1(12, 6);
};
const plate = (m, c) => {
  const b = c.estado === 'baixa', h = b ? 0.7 : 1.9;
  cx(m, 0, 0, -8, 13, h, 13, 0.7, b ? { pe: '#5e584c', topo: '#7a7466' } : { pe: '#8a8478', topo: '#c0baac' }, { ao: false });
  m.cil(0, h - 0.1, -8, 3.4, 3.2, 0.5, 10, b ? '#e8b84a' : '#c89a2a', { aberto: false, ao: false, brilho: b ? -0.6 : 0 });
  return t1(1.9, 6);
};
const lever = (m, c) => {
  const on = c.estado === 'ligada';
  cx(m, 0, 0, -8, 12, 6, 8, 2, { pe: '#4a4e58', topo: '#9096a2' }, {});
  const a = on ? 0.6 : -0.6, x = Math.sin(a) * 10, y = 5 + Math.cos(a) * 10;
  segmento(m, [0, 5, -8], [x, y, -8], 1.1, 0.9, 6, '#9a7a56', { ao: false });
  m.bola(0, 5.4, -8, 2.2, 1.4, 2.2, '#caced8', { d: 0, ao: false });
  m.bola(x, y, -8, 2.5, 2.5, 2.5, on ? { pe: '#3aa84a', topo: '#8af08a' } : { pe: '#c8382e', topo: '#ff8a7a' }, { d: 0, ao: false });
  return t1(6, 5);
};

// ---------- portas e portões (pegada x -8..8, z -12..-4, altura 30) ----------
const TOPO_PORTA = { y: 30, x0: -8, x1: 8, z0: -12, z1: -4 };
const portaPedra = (m) => {
  cx(m, 0, 0, -8, 16, 30, 8, 3, { pe: '#5e5448', topo: '#b4a690' }, {});
  cx(m, 0, 1.5, -3.9, 12.6, 25.5, 1.2, 1.4, { pe: '#8a7c6a', topo: '#a89a86' }, { ao: false });
  lam(m, 0, 3, -3.2, 0.9, 22, '#5e5246');
  for (const y of [9, 17, 24]) lam(m, 0, y, -3.2, 11.5, 0.8, '#5e5246');
  m.bola(0, 18, -3.4, 3.4, 3.4, 1.1, '#5ad8e8', { d: 0, brilho: -0.8, ao: false });
  return TOPO_PORTA;
};
const portaoGrade = (m) => {
  cx(m, 0, 0, -8, 16, 3.4, 3, 1.1, '#4a4a56', {});
  cx(m, 0, 27, -8, 16, 3.4, 3, 1.1, '#4a4a56', {});
  cx(m, 0, 12, -8, 16, 2.2, 2.4, 0.9, '#6a6e7a', { ao: false });
  for (let x = -6; x <= 6; x += 4) { m.cil(x, 3, -8, 1.1, 1.1, 24, 6, { pe: '#6a6e7a', topo: '#b0b6c4' }, { ao: false }); m.cone(x, 27, -8, 1.2, 2.2, 6, '#b0b6c4', { ao: false }); }
  return TOPO_PORTA;
};
const portaTrancada = (m) => {
  cx(m, 0, 0, -8, 16, 30, 8, 3, { pe: '#4a2c18', topo: '#7a4c2c' }, {});
  cx(m, 0, 1.5, -3.9, 12.6, 26.5, 1.2, 1.4, { pe: '#7a4a2a', topo: '#9a6a40' }, { ao: false });
  for (const y of [8, 22]) lam(m, 0, y, -3.1, 13.2, 2.2, '#5a5a66');
  lam(m, 0, 11.6, -3.0, 6.6, 8, '#f2c94c');
  m.bola(0, 15.6, -2.8, 1.1, 1.4, 0.5, '#2a1a10', { d: 0, ao: false });
  m.bola(0, 14, -2.8, 0.6, 1.2, 0.5, '#2a1a10', { d: 0, ao: false });
  return TOPO_PORTA;
};
const portaoRaio = (m) => {
  for (const x of [-7, 7]) { m.cil(x, 0, -8, 2.2, 1.9, 22, 8, { pe: '#2a3038', topo: '#667484' }, { ao: false }); m.bola(x, 22.5, -8, 2.4, 2, 2.4, '#9afff4', { d: 0, brilho: -1, ao: false }); }
  for (const y of [5.5, 19.5]) cx(m, 0, y, -8, 16, 2.6, 2.6, 1, '#3a4048', {});
  // raios: zigue-zague brilhante entre os postes
  for (let k = 0; k < 3; k++) {
    const y0 = 10 + k * 3.4;
    for (let i = 0; i < 4; i++) segmento(m, [-6 + i * 3, y0 + (i % 2 ? 1.3 : -1.3), -8], [-3 + i * 3, y0 + (i % 2 ? -1.3 : 1.3), -8], 0.5, 0.5, 4, '#9afff4', { brilho: -1, ao: false });
  }
  return TOPO_PORTA;
};

// ---------- paredes rachadas (bloco do bioma com fendas) ----------
const RACHA = [[0, 1, -2, 0.75], [-2, 0.75, 1, 0.5], [1, 0.5, -3, 0.25], [-3, 0.25, -1, 0], [1, 0.5, 5, 0.38], [5, 0.38, 6, 0.12]];
function rachada(cor, h, fenda = '#1e1414', brilho = 0) {
  return (m) => {
    cx(m, 0, 0, -8, 16, h, 16, 3.2, cor, { var: 0.05, desvio: 0.15 });
    for (const [x0, y0, x1, y1] of RACHA) segmento(m, [x0, y0 * h, 0.2], [x1, y1 * h, 0.2], 0.8, 0.65, 4, fenda, { ao: false, brilho });
    return { y: h, x0: -8, x1: 8, z0: -16, z1: 0 };
  };
}

// ---------- lápides e velas ----------
const velaChama = (m, x, y, z, s = 1) => m.bola(x, y, z, 1.1 * s, 1.7 * s, 1.1 * s, '#ffb84a', { d: 0, brilho: -1, ao: false });
const lapide = (vela) => (m) => {
  const cor = vela ? { pe: '#5a5a68', topo: '#a0a0ae' } : { pe: '#70707e', topo: '#b4b4c0' };
  cx(m, 0, 0, -7, 12, 2.2, 8, 1, vela ? '#4a4a58' : '#585866', {});
  cx(m, 0, 2, -7, 10, 11, 4, 1.4, cor, {});
  m.bola(0, 13, -7, 5, 3.6, 2, cor, { d: 0 });
  if (vela) {
    lam(m, -0.5, 4.5, -4.9, 1.2, 8, '#4a4a56'); lam(m, -3, 8, -4.9, 6, 1.2, '#4a4a56');
    m.cil(5.5, 0, -2, 1.3, 1.3, 6, 7, '#f4ead2', { aberto: false, ao: false }); velaChama(m, 5.5, 7.6, -2);
  } else {
    for (const y of [6.5, 9]) lam(m, 0, y, -4.9, 5, 0.9, '#585866');
    m.bola(-4, 1.3, -2, 2.4, 1.6, 1.8, { pe: '#3a8a3a', topo: '#7ad05a' }, { d: 0, ao: false });
    m.bola(-1.8, 1, -1.6, 1.6, 1.1, 1.3, { pe: '#3a8a3a', topo: '#7ad05a' }, { d: 0, ao: false });
  }
  return t1(vela ? 14 : 17, 5, -7);
};
const velas = (m) => {
  for (const [x, z, h] of [[-4, -7, 7], [0, -9, 9], [4, -6, 6]]) {
    m.cil(x, 0, z, 1.2, 1.1, h, 7, { pe: '#d8ceb4', topo: '#fff8e4' }, { aberto: false, ao: false });
    velaChama(m, x, h + 1.4, z);
  }
  return t1(9, 5);
};

// ---------- barracas e palco ----------
const barraca = (m) => {
  cx(m, 0, 0, -7.5, 36, 12, 9, 2, { pe: '#8a5a34', topo: '#d09a64' }, {});
  lam(m, 0, 2, -2.9, 30, 1.2, '#6a4428');
  for (const x of [-17, 17]) m.cil(x, 12, -8, 1.2, 1.1, 12, 6, MAD, { ao: false });
  toldo(m, 0, 23, -8, 24, 12, 12, ['#e8584a', '#fff6e8']);
  m.bola(0, 35.5, -8, 1.6, 1.6, 1.6, '#f2c94c', { d: 0, ao: false });
  // frutas na bancada
  for (const [x, cr] of [[-10, '#7ac04a'], [-2, '#f2c94c'], [6, '#e8584a']]) m.bola(x, 14.6, -8, 3.2, 2.8, 3.2, { pe: cr, topo: '#ffffff' }, { d: 0, ao: false, desvio: 0.9 });
  return t1(36, 5);
};
const guardaSol = (m) => {
  m.cil(0, 0, -8, 1.1, 1, 24, 7, { pe: '#c8c4bc', topo: '#f4f0e8' }, { ao: false });
  toldo(m, 0, 20, -8, 13, 7, 8, ['#f2c94c', '#3a8ad8']);
  m.bola(0, 27.4, -8, 1.3, 1.3, 1.3, '#e8e4dc', { d: 0, ao: false });
  return t1(28, 3);
};
const palco = (m) => {
  cx(m, 0, 0, -16, 92, 10, 28, 3, { pe: '#5a3a22', topo: '#c08a52' }, {});
  lam(m, 0, 2, -1.9, 88, 1.5, '#e0b030');
  for (const x of [-44, 44]) m.cil(x, 10, -28, 1.7, 1.7, 28, 8, { pe: '#d0ccc4', topo: '#f8f6f0' }, { ao: false });
  cx(m, 0, 22, -29, 68, 16, 2, 1.2, { pe: '#e8e4d8', topo: '#fffef8' }, { ao: false });
  for (const y of [22.5, 34.5]) lam(m, 0, y, -27.9, 66, 2.6, '#e0b030');
  m.bola(-12, 30, -27.5, 4.2, 4.2, 1, '#f2cc5a', { d: 0, ao: false });
  for (let i = 0; i < 12; i++) {
    const x0 = -42 + i * 7.3, cr = ['#e8584a', '#f2c94c', '#3a8ad8', '#5ab45a'][i % 4];
    tri(m, [x0, 38, -27.5], [x0 + 6.4, 38, -27.5], [x0 + 3.2, 33.4, -27.5], cr, [0, 0, 1], [0, 0, 1], [0, 0, 1]);
  }
  return { y: 10, x0: -46, x1: 46, z0: -30, z1: -2 };
};

// ---------- torre, outdoor, carrinho ----------
const torreTx = (m) => {
  const H = 60, G = { pe: '#585c66', topo: '#9ca0aa' };
  for (const s of [-1, 1]) for (const z of [-12, -4]) segmento(m, [s * 13, 0, z], [s * 3, H, z], 1.1, 0.8, 5, G, { ao: false });
  for (let y = 8; y < H; y += 9) {
    const w = 13 - (y / H) * 10;
    for (const z of [-12, -4]) segmento(m, [-w, y, z], [w, y, z], 0.55, 0.55, 4, '#6a6e78', { ao: false });
  }
  for (let y = 8, k = 0; y < H - 9; y += 9, k++) {
    const w0 = 13 - (y / H) * 10, w1 = 13 - ((y + 9) / H) * 10;
    segmento(m, [k % 2 ? w0 : -w0, y, -4], [k % 2 ? -w1 : w1, y + 9, -4], 0.5, 0.5, 4, '#7a7e88', { ao: false });
  }
  cx(m, 0, 0, -8, 34, 9, 12, 2.4, { pe: '#4a4e58', topo: '#7a7e88' }, {});
  for (const x of [-15, 15]) m.bola(x, 10.5, -8, 1.8, 1.8, 1.8, '#9afff4', { d: 0, brilho: -1, ao: false });
  m.cil(0, H - 1, -8, 1.1, 0.8, 9, 6, '#6a6e78', { ao: false });
  m.bola(0, H + 9.6, -8, 2.2, 2.2, 2.2, '#e8584a', { d: 0, brilho: -1, ao: false });
  return t1(H + 11, 3);
};
const outdoor = (m) => {
  for (const x of [-16, 16]) m.cil(x, 0, -8, 1.9, 1.7, 17, 7, { pe: '#4a4e58', topo: '#8a909c' }, { ao: false });
  cx(m, 0, 16, -8, 64, 24, 4, 2, { pe: '#1e2434', topo: '#3a4258' }, { ao: false });
  cx(m, 0, 18, -5.6, 60, 20, 0.9, 0.8, '#f8f4e6', { ao: false, brilho: 0.6 });
  m.bola(-18, 28, -5.1, 7, 7, 0.9, '#f2cc5a', { d: 0, brilho: -0.3, ao: false });
  lam(m, -18, 22.5, -4.7, 6, 8, '#5ae8e0');
  lam(m, 10, 30, -4.7, 32, 4, '#c89a28'); lam(m, 10, 24, -4.7, 32, 2, '#5ae8e0');
  return { y: 40, x0: -32, x1: 32, z0: -10, z1: -6 };
};
const carrinho = (m) => {
  cx(m, 0, 3, -8, 14, 9, 10, 2.4, { pe: '#4a4036', topo: '#8a7a6a' }, {});
  cx(m, 0, 10, -8, 14.6, 2, 10.6, 1, '#a09080', { ao: false });
  lamH(m, 0, 12.05, -8, 11.5, 7, '#3a3028');
  for (const x of [-7.5, 7.5]) for (const z of [-4.5, -11.5]) m.cil(x, 0.1, z, 2.3, 2.3, 0.8, 6, '#2a2a2a', { rz: -Math.PI / 2, aberto: false, ao: false });
  m.bola(-2, 14, -8, 2.5, 3.4, 2.5, '#5ae8e0', { d: 0, brilho: -0.8, ao: false });
  m.bola(3, 13.6, -9, 2, 3, 2, '#3ab0c8', { d: 0, brilho: -0.8, ao: false });
  return t1(12, 6);
};

// ---------- cena das masmorras e laboratório ----------
const vigaCaida = (m) => {
  m.cil(-22, 7, -8, 4.4, 4.4, 44, 8, { pe: '#6a4428', topo: '#b07a46' }, { rz: -Math.PI / 2, ry: -0.18, achata: 0.95, aberto: false, ao: false });
  m.bola(-16, 3.2, -6, 5.2, 3.4, 4.6, { pe: '#5e5a66', topo: '#9a96a4' }, { d: 0 });
  m.bola(14, 2.6, -9, 6, 2.9, 4.6, { pe: '#6a6672', topo: '#a09cac' }, { d: 0 });
  return { y: 11, x0: -22, x1: 22, z0: -12, z1: -4 };
};
const maquete = (m) => {
  cx(m, 0, 0, -8, 44, 10, 12, 2, { pe: '#6a4a2c', topo: '#b07a46' }, {});
  cx(m, 0, 9.6, -8, 40, 2.4, 9, 1.1, { pe: '#5a7a4a', topo: '#9ac27a' }, { ao: false });
  m.cone(-8, 11.5, -8, 8, 9, 8, { pe: '#7a746a', topo: '#b8b2a6' }, { ao: false });
  m.cone(6, 11.5, -9, 9, 12, 8, { pe: '#8a847a', topo: '#c8c2b6' }, { ao: false });
  m.cone(6, 21, -9, 2.6, 2.6, 8, '#fafaf4', { ao: false });
  m.bola(10, 19, -6, 1.5, 1.5, 1.5, '#5ae8e0', { d: 0, brilho: -0.8, ao: false });
  return t1(12, 18);
};
const painel = (m) => {
  cx(m, 0, 0, -8, 48, 18, 8, 2.4, { pe: '#2c3238', topo: '#5a626c' }, {});
  for (let i = 0; i < 3; i++) {
    const x = -15 + i * 15;
    cx(m, x, 6, -3.9, 12, 9, 0.8, 0.9, '#1a2a3a', { ao: false });
    lam(m, x, 10 + i - 0.5, -3.4, 10, 1.1, '#5ae8e0', { brilho: -1 });
  }
  for (let i = 0; i < 8; i++) lam(m, -17.5 + i * 5, 2, -3.3, 2.4, 2.4, ['#e8584a', '#5ab45a', '#f2c94c'][i % 3], { brilho: -0.8 });
  return t1(18, 20);
};
const elevador = (m) => {
  cx(m, 0, 0, -8, 32, 36, 12, 3, { pe: '#6a7a8a', topo: '#9aaab8' }, {});
  for (const s of [-1, 1]) cx(m, s * 6.5, 0, -1.9, 12.6, 29, 0.8, 0.5, { pe: '#aab8c4', topo: '#d8e2e8' }, { ao: false });
  cx(m, 0, 31, -1.8, 12, 4, 0.6, 0.7, '#22303e', { ao: false });
  m.bola(-2, 33, -1.4, 1.1, 1.1, 0.5, '#f2c94c', { d: 0, brilho: -1, ao: false });
  m.bola(2, 33, -1.4, 1.1, 1.1, 0.5, '#5ae8e0', { d: 0, brilho: -1, ao: false });
  return t1(36, 14);
};
const garra = (m) => {
  cx(m, 0, 0, -8, 112, 6, 12, 2.4, { pe: '#1e1636', topo: '#44326a' }, {});
  for (let i = 0; i < 12; i++) lamH(m, -50 + i * 9, 6.1, -6, 3, 1.4, '#9afff4', { brilho: -1 });
  for (const x of [-40, -6, 28]) {
    segmento(m, [x, 5, -8], [x + 12, 50, -8], 4.6, 2.6, 8, { pe: '#4a3478', topo: '#8a62d0' }, { ao: false });
    for (const t of [0.35, 0.65]) { const yy = 5 + 45 * t; m.bola(x + 12 * t, yy, -8, 4.6 - 2 * t, 2.2, 4.4 - 2 * t, '#2a1e44', { d: 0, ao: false }); }
    m.bola(x + 12, 51, -8, 3.2, 3.2, 3.2, '#b99aff', { d: 0, brilho: -0.5, ao: false });
  }
  return t1(54, 30);
};

// ---------- pequenos ----------
const conePlast = (m) => {
  cx(m, 0, 0, -8, 11, 1.5, 11, 0.8, '#33333a', {});
  m.cone(0, 1.4, -8, 4.6, 12.6, 10, { pe: '#e0601c', topo: '#ff9a4a' }, { ao: false });
  m.cil(0, 4.6, -8, 3.5, 2.8, 2.6, 10, '#ffffff', { ao: false });
  return t1(13, 2);
};
const cavalete = (m) => {
  for (const x of [-12, 12]) { segmento(m, [x, 0, -11.5], [x, 10, -8], 1.2, 1, 6, '#3a3a40', { ao: false }); segmento(m, [x, 0, -4.5], [x, 10, -8], 1.2, 1, 6, '#3a3a40', { ao: false }); }
  cx(m, 0, 8, -8, 34, 6.4, 2.6, 1, '#fdfaf4', { ao: false });
  for (let i = 0; i < 4; i++) lam(m, -14 + i * 8, 8.2, -6.65, 4, 6, '#e8584a');
  return t1(14.4, 14);
};
const gerador = (m) => {
  cx(m, 0, 0, -8, 14, 15, 10, 2.4, { pe: '#464e58', topo: '#8a929c' }, {});
  cx(m, 0, 3.5, -2.8, 9, 7, 0.8, 0.5, '#2a3040', { ao: false });
  for (const y of [5, 7.5]) lam(m, 0, y, -2.0, 7, 0.6, '#4a5468');
  m.cil(0, 14.5, -8, 1.4, 1.3, 6.5, 7, { pe: '#d8aa20', topo: '#ffdc50' }, { ao: false });
  m.bola(3.2, 11, -2.7, 1.1, 1.1, 0.5, '#5ae8a0', { d: 0, brilho: -1, ao: false });
  return t1(21, 6);
};
const placaAurora = (m) => {
  m.cil(0, 0, -8, 1.1, 1, 11, 7, { pe: '#a8a298', topo: '#e0dcd2' }, { ao: false });
  cx(m, 0, 10.5, -8.6, 16, 11, 1.8, 1.2, '#e0b030', { ao: false });
  cx(m, 0, 11.5, -7.6, 13.4, 8.4, 0.5, 0.4, '#f8f6ee', { ao: false, brilho: -0.2 });
  m.bola(-3.5, 15, -7.2, 2.1, 2.1, 0.6, '#f2cc5a', { d: 0, ao: false });
  lam(m, 1.5, 12.2, -7.3, 6, 1, '#d8b04a'); lam(m, 1.5, 14.2, -7.3, 6, 1, '#d8b04a');
  return t1(22, 7);
};
const poleiro = (m) => {
  cx(m, 0, 0, -8, 10, 2.2, 8, 1, MAD, {});
  m.cil(0, 2, -8, 1.2, 1.1, 18, 7, MAD, { ao: false });
  m.cil(-6.4, 20.4, -8, 1.2, 1.2, 12.8, 7, { pe: '#8a5a34', topo: '#c08a52' }, { rz: -Math.PI / 2, aberto: false, ao: false });
  return t1(22, 6);
};

export const TIPOS_OBJETOS_B = {
  chest: { f: chest, estado: estadoKit('chest') },
  cart: { f: cart },
  plate: { f: plate, estado: estadoKit('plate') },
  lever: { f: lever, estado: estadoKit('lever') },
  stoneDoor: { f: portaPedra },
  barsGate: { f: portaoGrade },
  lockedDoor: { f: portaTrancada },
  raioGate: { f: portaoRaio },
  crackedWall: { f: rachada({ pe: '#b89c6c', topo: '#e4cc9c' }, 40) },
  crackedRock: { f: rachada({ pe: '#6e5a4c', topo: '#a48a76' }, 36, '#2a1a14') },
  crackedIce: { f: rachada({ pe: '#7ab0d8', topo: '#d4eeff' }, 34, '#2a4a78') },
  crackedLava: { f: rachada({ pe: '#2c2226', topo: '#5a4a4e' }, 34, '#ff7a1a', -0.8) },
  crackedCanyon: { f: rachada({ pe: '#b8905e', topo: '#e8c898' }, 48, '#8a3a22') },
  lapide: { f: lapide(false) },
  lapideVela: { f: lapide(true) },
  velas: { f: velas },
  barraca: { f: barraca },
  guardaSol: { f: guardaSol },
  palco: { f: palco },
  torreTx: { f: torreTx },
  outdoor: { f: outdoor },
  carrinho: { f: carrinho },
  carrinhoParado: { f: carrinho },
  vigaCaida: { f: vigaCaida },
  maquete: { f: maquete },
  painel: { f: painel },
  elevador: { f: elevador },
  garra: { f: garra },
  conePlast: { f: conePlast },
  cavalete: { f: cavalete },
  gerador: { f: gerador },
  placaAurora: { f: placaAurora },
  poleiro: { f: poleiro },
};
