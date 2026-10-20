import * as THREE from 'three';
import { cor as linear } from '../kit/construtor.js';
import { prim, ss, topoDe } from './modelos.js';
import { torno, segmento, elipse, prismaTelhado, estadoKit } from './modelos-util.js';

// Modelos lisos (estilo Let's Go) do grupo "objetos-a": adereços de cenário (postes, lampiões, cercas, poço, moinho,
// colunas, estátua, altar, tochas, sino, barco, fonte...). Mesma pegada e mesma "ideia" dos modelos do kit voxel
// (src/visual3d/kit/objetos.js e vestir.js); formas grandes, poucos triângulos, degradê pé escuro -> topo claro.

// ---------- ajudantes locais ----------
const CAIXA = () => prim('caixa-unit', () => new THREE.BoxGeometry(1, 1, 1));
// caixa reta e barata (12 triângulos) para tábuas, painéis e placas finas; (x, y, z) = centro da base
const plano = (m, x, y, z, w, h, d, cr, o = {}) => m.add(CAIXA(), { x, y: y + h / 2, z, sx: w, sy: h, sz: d, rx: o.rx, ry: o.ry, rz: o.rz }, cr, o);
// degradê vertical (pé escuro -> topo claro) por altura absoluta: usar como cor
const grad = (y0, y1, a, b) => { const A = linear(a), B = linear(b); return (x, y) => { const t = ss(y0, y1, y); return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]; }; };
// triângulo solto (vértices em sentido anti-horário visto de fora), liso, sem descarte de face
const tri = (m, a, b, c, cr, o = {}) => {
  const u = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), v = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]), n = u.cross(v).normalize();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z], 3));
  return m.add(g, {}, cr, { todas: true, ao: false, ...o });
};
const PEDRA = { pe: '#8f897c', topo: '#cdc7b8' };
const PEDRA_CL = { pe: '#b2ac9e', topo: '#e6e0d2' };
const MADEIRA = { pe: '#6a4428', topo: '#a87448' };
const FERRO = { pe: '#2c313c', topo: '#5a6474' };
const DOURADO = { pe: '#c8901c', topo: '#ffd860' };

// chama lisa (brilho próprio)
const chama = (m, x, y, z, s = 1) => {
  m.bola(x, y + 3 * s, z, 2.6 * s, 3.8 * s, 2.6 * s, { pe: '#ff6a14', topo: '#ffb22a' }, { d: 0, brilho: -1, ao: false });
  m.bola(x, y + 2.4 * s, z + 0.8, 1.5 * s, 2.5 * s, 1.5 * s, '#ffe36a', { d: 0, brilho: -1, ao: false });
};

// poste fino de luz (lampião, poste de luzita)
function posteLuz({ h, cor, luz, tipo }) {
  return (m) => {
    m.cil(0, 0, -8, 3.4, 2.6, 2.6, 8, cor, { aberto: false });
    m.cil(0, 2.4, -8, 1.2, 0.9, h - 2.4, 7, grad(2, h, cor.pe, cor.topo));
    if (tipo === 'cristal') {
      m.cil(0, h - 1, -8, 3, 2, 1.8, 8, DOURADO, { aberto: false, ao: false });
      elipse(m, 0, h + 7, -8, 3.4, 6, 3.4, 0, 0, 0, luz, { d: 0, brilho: -1, ao: false });
      m.bola(0, h + 7, -8, 1.4, 4, 1.4, '#ffffff', { d: 0, brilho: -1, ao: false });
    } else {
      m.cil(0, h - 1.5, -8, 3.6, 2.6, 1.8, 8, cor, { aberto: false, ao: false });
      m.bola(0, h + 3.2, -8, 4, 4.8, 4, luz, { d: 1, brilho: 1, ao: false });
      m.cone(0, h + 6.4, -8, 4.8, 3.8, 8, cor, { ao: false });
      m.bola(0, h + 10.4, -8, 1.2, 1.2, 1.2, cor.topo, { d: 0, ao: false });
    }
    return topoDe(h + 9, 3);
  };
}
// cerca de varas
const cercaVara = (m) => {
  for (const x of [-6, -2, 2, 6]) {
    const h = 13 + (x & 3);
    m.cil(x, 0, -6, 1.5, 1.2, h, 6, MADEIRA, { desvio: 0.5 });
    m.bola(x, h, -6, 1.5, 1.2, 1.5, '#b88a58', { d: 0, ao: false });
  }
  for (const y of [5.5, 10.5]) m.cil(-8.5, y, -4.6, 0.9, 0.9, 17, 6, '#8a6038', { rz: -Math.PI / 2, ao: false });
  return topoDe(16, 8, -6);
};
// fardo de feno redondo
const feno = (m) => {
  m.cil(-6.8, 6.5, -8, 6.5, 6.5, 13.6, 10, { pe: '#c89a28', topo: '#f2cc5a' }, { rz: -Math.PI / 2, aberto: false, desvio: 0.5, ao: false });
  for (const x of [-3.8, 3.8]) m.cil(x - 0.5, 6.5, -8, 6.7, 6.7, 1, 10, '#9a6a34', { rz: -Math.PI / 2, ao: false });
  m.bola(0, 6.5, -1.6, 4.2, 2.6, 0.9, '#e0b440', { d: 0, ao: false });
  return topoDe(13, 7);
};
// vaso de barro
const vaso = (m) => {
  m.add(torno([[0, 0], [0.5, 0], [0.7, 0.18], [0.98, 0.46], [0.92, 0.7], [0.56, 0.88], [0.6, 0.96], [0.82, 1], [0.78, 1.06], [0.5, 1.04], [0, 0.9]], 10), { x: 0, y: 0, z: -8, sx: 6.4, sy: 11, sz: 6.4 }, { pe: '#a8502e', topo: '#e08a52' }, { desvio: 0.4 });
  m.cil(0, 5.6, -8, 6.5, 6.5, 1.4, 10, '#f2c94c', { ao: false });
  return topoDe(12, 5);
};
// ruínas e templo (colunas)
const coluna = (m) => {
  m.cil(0, 0, -8, 7.2, 6.6, 3.2, 10, PEDRA_CL, { aberto: false });
  m.cil(0, 3, -8, 5, 4.4, 24, 10, grad(3, 27, '#aaa496', '#e6e0d2'));
  m.cil(0, 26.5, -8, 5, 7.4, 4.5, 10, PEDRA_CL, { aberto: false, ao: false });
  m.bola(-3, 31, -5.5, 3, 2, 2.4, { pe: '#3f9a46', topo: '#8ad866' }, { d: 0, ao: false });
  m.bola(-5, 29, -5, 1.8, 3, 1.6, '#4cb04a', { d: 0, ao: false });
  return topoDe(31, 6);
};
const colunaQuebrada = (m) => {
  m.cil(0, 0, -8, 8, 7.2, 4, 10, PEDRA_CL, { aberto: false });
  m.cil(0, 4, -8, 5.4, 4.8, 12, 10, grad(4, 16, '#aaa496', '#e0dacc'));
  m.cil(0, 15.9, -8, 4.8, 4.2, 0.6, 10, '#9a9486', { aberto: false, ao: false });
  m.bola(-3, 16.5, -7, 2.4, 1.2, 2, '#e6e0d2', { d: 0, ao: false });
  // tambor caído no chão
  m.cil(-7, 3.6, -2.5, 3.6, 3.6, 7, 8, grad(0, 8, '#b2ac9e', '#e6e0d2'), { rz: -Math.PI / 2, aberto: false });
  m.bola(-6, 2, -3, 3.4, 1.5, 2, { pe: '#3f9a46', topo: '#8ad866' }, { d: 0, ao: false });
  return topoDe(16, 5);
};

// ---------- tabela ----------
export const TIPOS_OBJETOS_A = {
  lampiao: { f: posteLuz({ h: 18, cor: { pe: '#2a2420', topo: '#5a4a3a' }, luz: '#ffbe52', tipo: 'lanterna' }) },
  posteLuzita: { f: posteLuz({ h: 22, cor: { pe: '#c8c4bc', topo: '#f6f2ea' }, luz: '#5ae8e0', tipo: 'cristal' }) },
  lanternaPedra: {
    f: (m) => {
      m.cil(0, 0, -8, 6.6, 5.6, 3, 10, PEDRA, { aberto: false });
      m.cil(0, 3, -8, 2.8, 2.4, 7, 8, grad(3, 10, '#8a8478', '#bdb7a8'));
      m.cil(0, 9.6, -8, 5.8, 5.4, 2, 10, PEDRA_CL, { aberto: false, ao: false });
      m.cil(0, 11.4, -8, 4.5, 4.5, 6.4, 8, '#d8d2c2', { aberto: false, ao: false });
      m.bola(0, 14.4, -2.9, 3, 3, 1.8, '#ffe39a', { d: 0, brilho: 1, ao: false });
            m.cone(0, 17.8, -8, 8, 6.2, 8, { pe: '#6a655c', topo: '#a8a294' }, { ao: false });
      m.bola(0, 24, -8, 1.8, 2.2, 1.8, '#c8c2b2', { d: 0, ao: false });
      return topoDe(25, 4);
    },
  },
  crate: {
    f: (m) => {
      m.caixa(0, 0, -8, 13.4, 13, 13, 1.6, { pe: '#8a5a30', topo: '#d29a5e' }, { seg: 1, desvio: 0.3 });
      for (const x of [-4.4, 4.4]) plano(m, x, 0.4, -1.3, 1.8, 12.2, 0.5, '#b07a46', { ao: false });
      plano(m, 0, 6, -1.35, 13.4, 1.6, 0.5, '#b07a46', { ao: false });
      return topoDe(13, 6);
    },
  },
  cercaVara: { f: cercaVara },
  well: {
    f: (m) => {
      m.add(torno([[0, 0], [1, 0], [1, 0.86], [1.06, 0.9], [1.06, 1], [0.78, 1], [0.78, 0.8], [0, 0.8]], 10), { x: 0, y: 0, z: -8, sx: 10.4, sy: 10.4, sz: 10.4 }, { pe: '#8a847a', topo: '#cfc9ba' }, { desvio: 0.3 });
      m.cil(0, 9.7, -8, 7.8, 7.8, 0.3, 12, '#3f7ed0', { aberto: false, brilho: -0.2, ao: false });
      for (const x of [-9, 9]) m.cil(x, 10, -8, 1.3, 1.1, 13, 6, MADEIRA, { desvio: 0.4 });
      m.cil(-9, 20, -8, 1.1, 1.1, 18, 6, '#6a4428', { rz: -Math.PI / 2, ao: false });
      m.cil(0, 14.6, -8, 0.5, 0.5, 5.4, 4, '#cfcfd6', { ao: false });
      m.cil(0, 11.4, -8, 2.1, 1.7, 3.2, 8, '#8a8a92', { aberto: false, ao: false });
      prismaTelhado(m, 0, 22, -8, 31, 8, 20, { pe: '#b83a30', topo: '#e8584a' }, { ao: false, desvio: 0.2 });
      return topoDe(30, 8);
    },
  },
  sundial: {
    f: (m) => {
      m.caixa(0, 0, -8, 25, 4, 14, 1.8, PEDRA, { seg: 1 });
      m.cil(0, 3.6, -8, 8, 7, 7, 10, grad(3, 11, '#9a9486', '#cfc9ba'));
      m.cil(0, 10.4, -8, 10.4, 10.4, 2.2, 10, { pe: '#d6d0c0', topo: '#f6f1e6' }, { aberto: false, ao: false });
      m.cone(2, 12.6, -8, 2.4, 9, 3, DOURADO, { ao: false });
      for (let k = 0; k < 4; k++) { const a = -0.2 + k * 1.3; m.bola(Math.cos(a) * 8, 12.8, -8 + Math.sin(a) * 6.2, 0.9, 0.5, 0.9, '#8a7a5a', { d: 0, ao: false }); }
      m.bola(5.4, 14.6, -5.4, 1.5, 1.5, 1.5, '#ffcf4a', { d: 0, brilho: -0.3, ao: false });
      return topoDe(14, 10);
    },
  },
  haybale: { f: feno },
  bale: { f: feno },
  varal: {
    f: (m) => {
      for (const x of [-18, 18]) {
        m.cil(x, 0, -8, 1.5, 1.1, 22, 6, MADEIRA, { desvio: 0.4 });
        m.bola(x, 22, -8, 1.6, 1.4, 1.6, '#b88a58', { d: 0, ao: false });
      }
      m.cil(-18, 20.2, -8, 0.4, 0.4, 36, 4, '#f2eee4', { rz: -Math.PI / 2, ao: false });
      for (const [x, w, cr] of [[-10, 8, '#e8584a'], [0, 7, '#4c9ae8'], [9, 8, '#f6cc4c']]) {
        plano(m, x, 11.4, -8, w, 8.6, 0.7, cr, { ao: false });
      }
      return topoDe(24, 3);
    },
  },
  gate: {
    f: (m) => {
      for (const x of [-14, 14]) {
        m.cil(x, 0, -8, 2.6, 2.2, 18, 8, MADEIRA, { desvio: 0.5 });
        m.bola(x, 18, -8, 2.7, 2.2, 2.7, '#b88a58', { d: 0, ao: false });
      }
      for (const y of [4, 9, 14]) plano(m, 0, y, -8.6, 24, 2.4, 1.6, { pe: '#a56c3c', topo: '#d8a46c' }, { ao: false });
      segmento(m, [-11.5, 4.8, -7.6], [11.5, 14.6, -7.6], 0.9, 0.9, 6, '#c08a56', { ao: false });
      m.bola(0, 19, -8, 3, 1.6, 1.4, DOURADO, { d: 0, ao: false });
      return topoDe(20, 14);
    },
  },
  windmill: {
    f: (m) => {
      const z = -18;
      m.add(torno([[0, 0], [1, 0], [0.92, 0.4], [0.74, 0.8], [0.62, 1], [0, 1]], 14), { x: 0, y: 0, z, sx: 13, sy: 46, sz: 13 }, { pe: '#c9bd9f', topo: '#f4ecd6' }, { desvio: 0.5 });
      m.cil(0, 0, z, 14, 14, 2.4, 14, '#9a9486', { aberto: false });
      m.cone(0, 45, z, 11.4, 14, 14, { pe: '#b83a30', topo: '#f0705c' }, { ao: false });
      m.bola(0, 60, z, 1.8, 1.8, 1.8, '#d8584a', { d: 0, ao: false });
      m.caixa(0, 0, z + 11.2, 10, 15, 3, 1.4, { pe: '#6a4228', topo: '#9a6a40' }, { seg: 1, ao: false });
      m.bola(3, 8, z + 12.8, 0.8, 0.8, 0.8, '#ffd24a', { d: 0, ao: false });
      m.caixa(0, 26, z + 9.2, 6, 7, 2, 1, '#bfe6ff', { seg: 1, ao: false, brilho: 1 });
      plano(m, 0, 25.2, z + 10.2, 8.4, 1, 1.4, '#a56c3c', { ao: false });
      // pás em cruz
      const hz = z + 13, hy = 40;
      m.bola(0, hy, hz - 1, 3.8, 3.8, 3.2, '#6a4428', { d: 0, ao: false });
      for (let k = 0; k < 4; k++) {
        const a = Math.PI / 4 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        plano(m, ca * 15, hy + sa * 15 - 0.6, hz, 28, 1.2, 1, '#6a4428', { rz: a, ao: false });
        plano(m, ca * 17 - sa * 3.8, hy + sa * 17 + ca * 3.8 - 3, hz + 0.3, 20, 6, 0.6, '#f6f1e6', { rz: a, ao: false });
      }
      return topoDe(60, 6, z);
    },
  },
  column: { f: coluna },
  brokenColumn: { f: colunaQuebrada },
  portico: {
    f: (m) => {
      for (const x of [-24, 24]) {
        m.cil(x, 0, -8, 6.4, 5.6, 4, 10, { pe: '#8f897c', topo: '#c8c2b2' }, { aberto: false });
        m.cil(x, 4, -8, 4.4, 4, 35, 10, grad(4, 40, '#b8b2a4', '#f2ece2'));
        m.cil(x, 38, -8, 4.4, 5.4, 3, 10, '#d8cfc0', { aberto: false, ao: false });
      }
      m.caixa(0, 38, -8, 68, 9, 9, 3, { pe: '#b83a30', topo: '#f0705c' }, { seg: 1, ao: false, desvio: 0.3 });
      m.caixa(0, 46, -8, 72, 3.4, 11, 1.4, '#4a3020', { seg: 1, ao: false });
      m.caixa(0, 39.6, -3, 12, 6, 1.4, 1, DOURADO, { seg: 1, ao: false, brilho: -0.2 });
      return { y: 50, x0: -32, x1: 32, z0: -12, z1: -4 };
    },
  },
  statue: {
    f: (m) => {
      m.caixa(0, 0, -8, 25, 10, 14, 2.2, PEDRA, { seg: 1 });
      m.caixa(0, 9, -8, 21, 2.4, 11, 1.2, PEDRA_CL, { seg: 1, ao: false });
      // guardião sentado: corpo, patas, cabeça, orelhas pontudas, olhos que brilham
      m.bola(0, 17.5, -8.5, 6.8, 7.6, 5.8, { pe: '#9a9486', topo: '#d4cebf' }, { d: 0, ao: false });
      for (const x of [-4.4, 4.4]) m.bola(x, 11.8, -4.4, 2.8, 2.4, 2.6, { pe: '#9a9486', topo: '#cdc7b8' }, { d: 0, ao: false });
      m.bola(0, 26.5, -8, 6, 5.6, 5, { pe: '#aaa496', topo: '#e6e0d2' }, { d: 1, ao: false });
      for (const x of [-4, 4]) m.cone(x, 29.4, -8, 2.5, 7.6, 5, { pe: '#aaa496', topo: '#ece6d8' }, { ao: false });
      for (const x of [-2.6, 2.6]) m.bola(x, 26.8, -3.2, 1.3, 1.1, 0.8, '#5ad8e8', { d: 0, brilho: -0.8, ao: false });
      m.cil(9, 9.4, -9, 1.4, 1.1, 7, 6, '#bdb7a8', { ao: false });
      return topoDe(36, 6);
    },
  },
  altar: {
    f: (m) => {
      m.caixa(0, 0, -8, 28, 10, 12, 2, PEDRA, { seg: 1 });
      plano(m, 0, 2.6, -1.9, 18, 7, 0.5, '#9a2a40', { ao: false });
      plano(m, 0, 2.6, -1.7, 18, 1.2, 0.4, DOURADO, { ao: false });
      m.caixa(0, 10, -8, 32, 3, 13, 1.4, PEDRA_CL, { seg: 1, ao: false });
      m.cil(0, 12.8, -8, 3.2, 2, 3, 8, DOURADO, { aberto: false, ao: false });
      elipse(m, 0, 18, -8, 3, 4, 3, 0, 0, 0, '#9ae8ff', { d: 0, brilho: -0.8, ao: false });
      for (const x of [-13, 13]) {
        m.cil(x, 12.8, -8, 1.3, 1.3, 5, 6, '#f4ead2', { aberto: false, ao: false });
        chama(m, x, 17.6, -8, 0.7);
      }
      return topoDe(16, 14);
    },
  },
  obelisk: {
    f: (m) => {
      m.cil(0, 0, -8, 7.4, 6.6, 3.2, 8, PEDRA, { aberto: false });
      m.cil(0, 3, -8, 5.2, 3.2, 36, 4, grad(3, 39, '#7e786c', '#bdb7a8'), { ry: Math.PI / 4, aberto: false });
      m.cone(0, 39, -8, 3.2, 6, 4, { pe: '#aaa496', topo: '#e6e0d2' }, { ry: Math.PI / 4, ao: false });
      for (let i = 0; i < 4; i++) m.bola(0, 10 + i * 7, -8 + 4.4 - i * 0.55, 1.1, 1.8, 0.7, '#5ad8e8', { d: 0, brilho: -0.8, ao: false });
      return topoDe(44, 3);
    },
  },
  pot: { f: vaso },
  torch: {
    f: (m, c) => {
      const on = !!c.estado;
      m.cil(0, 0, -8, 3.4, 3, 2, 8, '#3a2a20', { aberto: false });
      m.cil(0, 2, -8, 1.2, 0.95, 16, 7, grad(2, 18, '#5a4030', '#9a6c46'));
      m.cil(0, 17, -8, 2.6, 4.4, 5, 8, FERRO, { aberto: false, ao: false });
      m.cil(0, 21.8, -8, 4.4, 4.4, 0.5, 8, on ? '#ffb84a' : '#3a3030', { aberto: false, ao: false });
      if (on) chama(m, 0, 22, -8, 1.2);
      else m.bola(0, 22.4, -8, 3, 1, 3, '#2a2222', { d: 0, ao: false });
      return topoDe(22, 3);
    },
    estado: estadoKit('torch'),
  },
  brazier: {
    f: (m, c) => {
      const on = !!c.estado;
      for (const [x, z] of [[-5, -5], [5, -5], [0, -12]]) segmento(m, [x * 0.5, 0, z * 0.55 - 3.6], [x, 8, z], 1.2, 0.9, 5, FERRO, { ao: false });
      m.add(torno([[0, 0], [0.4, 0], [0.8, 0.3], [1, 0.8], [1.12, 1], [0.94, 1], [0.9, 0.9], [0, 0.9]], 10), { x: 0, y: 6.4, z: -8, sx: 9.4, sy: 8, sz: 9.4 }, { pe: '#6a4a2a', topo: '#c89a5a' }, { ao: false, desvio: 0.3 });
      m.cil(0, 13.6, -8, 7.4, 7.4, 0.4, 10, on ? '#c84a1c' : '#2a2020', { aberto: false, ao: false });
      if (on) { chama(m, -2, 13, -8, 1.5); chama(m, 3, 13, -7, 1.15); m.bola(0, 13.8, -8, 5.4, 1.2, 4, '#e8581c', { d: 0, brilho: -1, ao: false }); }
      else m.bola(0, 14, -8, 4, 1, 3.2, '#3a2c28', { d: 0, ao: false });
      return topoDe(14, 8);
    },
    estado: estadoKit('brazier'),
  },
  bell: {
    f: (m) => {
      for (const x of [-11, 11]) { m.cil(x, 0, -8, 2.4, 2, 26, 7, MADEIRA, { desvio: 0.5 }); m.bola(x, 26, -8, 2.3, 1.6, 2.3, '#b88a58', { d: 0, ao: false }); }
      m.cil(-13, 26, -8, 2, 2, 26, 7, { pe: '#8a5a34', topo: '#c08a56' }, { rz: -Math.PI / 2, ao: false, desvio: 0.5 });
      m.cil(0, 21.4, -8, 0.5, 0.5, 4.8, 4, '#5a4030', { ao: false });
      m.add(torno([[0, 0], [1, 0], [0.97, 0.12], [0.72, 0.36], [0.52, 0.72], [0.34, 0.94], [0.1, 1], [0, 1]], 10), { x: 0, y: 8, z: -8, sx: 7.4, sy: 14, sz: 7.4 }, DOURADO, { ao: false, desvio: 0.2 });
      m.bola(0, 8, -8, 2, 1.8, 2, '#8a5a1a', { d: 0, ao: false });
      return topoDe(30, 3);
    },
  },
  mural: {
    f: (m) => {
      m.caixa(0, 0, -8, 49, 32, 8, 2.4, { pe: '#8f8570', topo: '#cbbf9f' }, { seg: 1, desvio: 0.2 });
      const z = -3.6;
      plano(m, 0, 4, z, 42, 24, 0.6, '#d8ccae', { ao: false });
      m.cil(-12, 18.5, z + 0.4, 5.6, 5.6, 0.8, 10, '#e0a438', { rx: Math.PI / 2, aberto: false, ao: false });
      m.cone(8, 6, z + 0.8, 11, 15, 3, { pe: '#5c6c80', topo: '#8a9ab0' }, { achata: 0.2, ao: false });
      m.cone(8, 17.4, z + 1.2, 3.6, 3.6, 3, '#f4f0e8', { achata: 0.2, ao: false });
      for (let i = 0; i < 5; i++) plano(m, -18 + i * 8.4, 6.4, z + 0.5, 6, 1.2, 0.3, '#4a8ab0', { ao: false });
      plano(m, 16, 12, z + 0.5, 6, 5, 0.3, '#9a5a42', { ao: false });
      return topoDe(32, 24);
    },
  },
  surfboard: {
    f: (m) => {
      elipse(m, 0, 15.5, -6, 4.8, 15.5, 1.8, 0, 0, 0.1, { pe: '#2c9cc8', topo: '#7ae0f6' }, { d: 1, desvio: 0.5, ao: false });
      elipse(m, 0.2, 15.5, -4.3, 1.1, 14, 0.5, 0, 0, 0.1, '#e8584a', { d: 0, ao: false });
      m.cone(-1.4, 0, -6.4, 2, 5, 3, '#1c7ea6', { achata: 0.4, ao: false });
      return topoDe(31, 3, -6);
    },
  },
  jangada: {
    f: (m) => {
      for (let i = 0; i < 6; i++) {
        const x = -17.5 + i * 7, cr = i % 2 ? { pe: '#9a6a3a', topo: '#d0a068' } : { pe: '#8a5c30', topo: '#c08a52' };
        m.cil(x, 3.3, -1.2, 3.4, 3.4, 13.6, 7, cr, { rx: -Math.PI / 2, aberto: false, desvio: 0.5 });
      }
      plano(m, 0, 6.2, -5, 40, 1.1, 1.4, '#6a4428', { ao: false });
      m.cil(0, 6, -8, 1.3, 1.1, 28, 6, MADEIRA, { desvio: 0.5, ao: false });
      tri(m, [1.4, 9, -7.6], [18, 12.6, -7.6], [1.4, 32, -7.6], '#f6f0e0');
      tri(m, [1.4, 9, -7.7], [1.4, 32, -7.7], [18, 12.6, -7.7], '#d8d0bc');
      plano(m, 1.4, 17, -7.4, 10, 2, 0.4, '#c84a3c', { ao: false });
      return { y: 8, x0: -20, x1: 20, z0: -15, z1: -1 };
    },
  },
  barrel: {
    f: (m) => {
      m.add(torno([[0, 0], [0.82, 0], [0.96, 0.25], [1, 0.5], [0.96, 0.75], [0.82, 1], [0, 1]], 8), { x: 0, y: 0, z: -8, sx: 6.6, sy: 14, sz: 6.6 }, { pe: '#7a4c26', topo: '#c08a52' }, { desvio: 0.4, var: 0.06 });
      m.cil(0, 13.8, -8, 5.3, 5.3, 0.4, 10, '#d8a468', { aberto: false, ao: false });
      for (const y of [2.2, 10.8]) m.cil(0, y, -8, 6.4, 6.4, 1.4, 8, FERRO, { ao: false });
      return topoDe(14, 5);
    },
  },
  boia: {
    f: (m) => {
      m.add(torno([[0, 0], [0.6, 0], [1, 0.2], [0.96, 0.5], [0.82, 0.75], [0.55, 0.92], [0.4, 1], [0, 1]], 8), { x: 0, y: 0, z: -8, sx: 5.6, sy: 12, sz: 5.6 }, { pe: '#c8382e', topo: '#f2685a' }, { ao: false, desvio: 0.2 });
      m.cil(0, 3.4, -8, 6.1, 5.9, 3.4, 8, '#fffdf8', { ao: false });
      m.cil(0, 11.4, -8, 0.9, 0.7, 6, 5, FERRO, { ao: false });
      m.bola(0, 19, -8, 2.6, 2.6, 2.6, '#ffe05a', { d: 1, brilho: -0.6, ao: false });
      return topoDe(22, 3);
    },
  },
  fumarola: {
    f: (m) => {
      m.add(torno([[0, 0], [1, 0], [0.9, 0.35], [0.62, 0.8], [0.56, 1], [0.3, 0.9], [0, 0.82]], 8), { x: 0, y: 0, z: -8, sx: 8.6, sy: 6, sz: 8.6 }, { pe: '#4a3a32', topo: '#8a7464' }, { desvio: 0.3 });
      for (const [x, z, s] of [[-5.4, -3, 1.6], [4.6, -2.6, 1.4]]) m.bola(x, 1.2, z, s * 1.8, s * 0.8, s, '#e0cc4a', { d: 0, ao: false });
      m.bola(0, 8.5, -8, 3.4, 2.8, 3, '#eef2f4', { d: 0, ao: false });
      m.bola(1.4, 13.5, -7.4, 2.8, 2.4, 2.6, '#f8fafb', { d: 0, ao: false });
      m.bola(-0.6, 17.5, -7.8, 2, 1.8, 1.8, '#ffffff', { d: 0, ao: false });
      return topoDe(8, 4);
    },
  },
  sucata: {
    f: (m) => {
      m.caixa(-4, 0, -8, 16, 9, 12, 2, { pe: '#5a606c', topo: '#98a2b0' }, { seg: 1, ry: 0.3 });
      plano(m, -6, 8.6, -7, 7, 4, 6, { pe: '#a85a2c', topo: '#e08a4a' }, { ao: false, ry: -0.2 });
      plano(m, 9, 0, -6, 11, 8, 9, { pe: '#3a404c', topo: '#8a96a6' });
      m.bola(9, 3.4, -1.3, 1.1, 1.1, 0.6, '#5ae8a0', { d: 0, brilho: -0.8, ao: false });
      m.cil(-12, 4, -2.4, 4, 4, 2.4, 9, '#262a30', { rx: -Math.PI / 2, aberto: false, ao: false });
      segmento(m, [-2, 11, -11], [2, 19, -10], 0.9, 0.9, 5, '#2c313c', { ao: false });
      return topoDe(14, 12);
    },
  },
  fonte: {
    f: (m) => {
      const z = -16;
      m.add(torno([[0, 0], [1, 0], [1, 0.82], [1.07, 0.9], [1.07, 1], [0.84, 1], [0.84, 0.7], [0, 0.7]], 14), { x: 0, y: 0, z, sx: 21.4, sy: 6.4, sz: 21.4 }, { pe: '#8f897c', topo: '#d4cebf' }, { desvio: 0.3 });
      m.cil(0, 5.6, z, 18, 18, 0.4, 16, '#5cc0ec', { aberto: false, brilho: -0.12, ao: false });
      m.cil(0, 5.8, z, 4.6, 3.2, 10, 8, grad(5, 16, '#aaa496', '#e0dacc'));
      m.add(torno([[0, 0], [0.5, 0], [0.9, 0.3], [1, 0.8], [0.84, 0.78], [0, 0.7]], 12), { x: 0, y: 15, z, sx: 10, sy: 4, sz: 10 }, { pe: '#aaa496', topo: '#e6e0d2' }, { ao: false });
      m.cil(0, 16.6, z, 8.2, 8.2, 0.3, 12, '#6ac8f0', { aberto: false, brilho: -0.15, ao: false });
      m.bola(0, 20.5, z, 2.2, 5.5, 2.2, '#dff6ff', { d: 0, ao: false });
      for (const [x, zz] of [[-8, -8], [8, -9], [0, -4], [-5, -21]]) m.bola(x, 6.4, zz, 1.6, 0.8, 1.6, '#ffffff', { d: 0, ao: false });
      return topoDe(24, 18, z);
    },
  },
  santuario: {
    f: (m) => {
      m.caixa(0, 0, -8, 27, 4, 14, 1.6, PEDRA, { seg: 1 });
      m.caixa(0, 4, -10, 14.5, 12, 9, 1.6, { pe: '#d2caae', topo: '#f4ecd4' }, { seg: 1, ao: false });
      plano(m, 0, 4.4, -5.4, 6, 7.6, 0.6, '#3a3028', { ao: false });
      m.bola(0, 8.6, -4.8, 1.8, 1.8, 1.2, '#ffd24a', { d: 0, brilho: 0.8, ao: false });
      for (const x of [-9.5, 9.5]) m.cil(x, 4, -3, 1.2, 1.1, 12, 6, { pe: '#a83a2a', topo: '#d8584a' }, { desvio: 0.5, ao: false });
      prismaTelhado(m, 0, 15, -10, 29, 7.5, 12, { pe: '#a8382c', topo: '#e8584a' }, { ao: false, desvio: 0.2 });
      for (const x of [-12.5, 12.5]) m.bola(x, 6, -2, 1.6, 2, 1.6, '#ff9ac4', { d: 0, ao: false });
      return topoDe(23, 10);
    },
  },
  espantalho: {
    f: (m) => {
      m.cil(0, 0, -8, 1.2, 1, 26, 6, MADEIRA, { desvio: 0.5 });
      m.cil(-10.5, 17, -8, 1, 1, 21, 6, '#8a6038', { rz: -Math.PI / 2, ao: false });
      m.bola(0, 14.2, -8, 4.8, 6, 3.8, { pe: '#3a68b8', topo: '#6a9cea' }, { d: 0, ao: false });
      for (const x of [-10, 10]) m.bola(x, 17, -8, 1.8, 1.8, 1.8, '#f2d05a', { d: 0, ao: false });
      m.bola(0, 22.6, -8, 3.8, 3.8, 3.6, { pe: '#e6c890', topo: '#fae4b4' }, { d: 1, ao: false });
      for (const x of [-1.4, 1.4]) m.bola(x, 23, -4.6, 0.55, 0.55, 0.4, '#3a2a20', { d: 0, ao: false });
      m.cil(0, 25.6, -8, 8, 8, 0.9, 9, '#d0a850', { aberto: false, ao: false });
      m.cil(0, 26.4, -8, 4.2, 3.6, 4.4, 8, { pe: '#c09838', topo: '#e8c468' }, { aberto: false, ao: false });
      return topoDe(31, 4);
    },
  },
  caixotes: {
    f: (m, c) => {
      m.caixa(-6.8, 0, -9, 13, 12, 12, 1.6, { pe: '#8a5a30', topo: '#c8925c' }, { seg: 1, desvio: 0.3 });
      plano(m, -6.8, 5, -2.9, 13, 1.4, 0.4, '#a87448', { ao: false });
      m.caixa(7, 0, -8, 11, 10, 11, 1.6, { pe: '#946438', topo: '#d4a06a' }, { seg: 1, desvio: 0.3 });
      plano(m, -5, 12, -9, 9, 9, 9, { pe: '#9a6a3c', topo: '#dcaa72' }, { ao: false, desvio: 0.3 });
      if (c.v % 2) m.add(torno([[0, 0], [0.82, 0], [0.96, 0.3], [0.96, 0.7], [0.82, 1], [0, 1]], 8), { x: 9, y: 10, z: -8, sx: 4.2, sy: 9, sz: 4.2 }, { pe: '#6a4a2a', topo: '#a87c4c' }, { ao: false });
      return topoDe(21, 12);
    },
    var: 2,
  },
  barco: {
    f: (m, c) => {
      const cor = [['#c8382e', '#f2685a'], ['#2e72c4', '#6aa6ea'], ['#d8aa2c', '#fadc6a']][c.v % 3];
      // casco liso (elipsoide comprido), convés de madeira que aparece por dentro da borda, proa e popa mais altas
      elipse(m, 0, 3.6, -8, 21.5, 6.4, 8.4, 0, 0, 0, { pe: cor[0], topo: cor[1] }, { d: 1, desvio: 0.2 });
      elipse(m, 0, 8.6, -8, 18.4, 1.8, 5.8, 0, 0, 0, { pe: '#8a5a30', topo: '#d09a62' }, { d: 1, ao: false });
      for (const x of [-19.5, 19.5]) m.bola(x, 8.4, -8, 2.6, 3.2, 3.4, cor[1], { d: 0, ao: false });
      plano(m, 0, 9.6, -8, 3, 1.4, 11, '#6a4428', { ao: false });
      segmento(m, [3, 11.4, -4], [17, 8.6, 6], 0.7, 0.7, 5, '#b88a58', { ao: false });
      m.bola(17.6, 8.4, 6.6, 3, 1, 1.6, '#d0a068', { d: 0, ao: false });
      return topoDe(11, 16);
    },
    var: 3,
  },
  redePesca: {
    f: (m) => {
      for (const x of [-14, 14]) { m.cil(x, 0, -8, 1.8, 1.4, 23, 6, MADEIRA, { desvio: 0.5 }); m.bola(x, 23, -8, 1.9, 1.6, 1.9, '#b88a58', { d: 0, ao: false }); }
      m.cil(-15, 21.4, -8, 1.3, 1.3, 30, 5, '#8a5a34', { rz: -Math.PI / 2, ao: false });
      m.caixa(0, 4, -7.4, 24, 17, 0.9, 0.4, { pe: '#6a8076', topo: '#a8bcae' }, { seg: 1, ao: false, desvio: 0.4 });
      m.bola(0, 3.4, -7.4, 12, 2.6, 0.9, '#7a6a48', { d: 0, ao: false });
      segmento(m, [-12, 5, -6.8], [10, 19, -6.8], 0.45, 0.45, 4, '#e8e2c8', { ao: false });
      segmento(m, [-8, 19, -6.8], [12, 5, -6.8], 0.45, 0.45, 4, '#e8e2c8', { ao: false });
      for (const [x, y] of [[-6, 19.6], [6, 19.6], [0, 11]]) m.bola(x, y, -6.6, 1.7, 1.7, 1.7, '#e8584a', { d: 0, ao: false });
      return topoDe(24, 14);
    },
  },
};
