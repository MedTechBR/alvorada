import { cor as linear } from '../kit/construtor.js';
import * as THREE from 'three';
import { estadoKit, prim } from './modelos-util.js';
// Modelos lisos do grupo "interior" (estilo Let's Go): móveis e peças de casa, laboratório, Centro e Mercado.
// Vistos de cima e de frente (casa de boneca): costas não importam. Móveis de parede encostam no norte do bloco (z = -16).
// Corpos grandes em caixa arredondada (seg 1); detalhes em blocos simples de 12 triângulos.

const MAD = { pe: '#8e5a34', topo: '#cf9f66' };       // madeira média
const MADE = { pe: '#6e4226', topo: '#a87848' };      // madeira escura
const MADC = { pe: '#b8824c', topo: '#e2b87c' };      // madeira clara
const LIVROS = ['#e8584a', '#4c9ae8', '#f2c94c', '#5ab45a', '#8a5ad8', '#f4f0e6', '#d86a2a'];
const t = (y, x0, x1, z0, z1) => ({ y, x0, x1, z0, z1 });
// caixa: com { seg: 1 } é a caixa arredondada do kit (108 tris); sem seg é um bloco simples de 12 tris (detalhes e peças finas)
const BOX = () => prim('caixa-simples', () => new THREE.BoxGeometry(1, 1, 1));
const cx = (m, x, y, z, w, h, d, r, cr, o = {}) => (o.seg ? m.caixa(x, y, z, w, h, d, r, cr, o) : m.add(BOX(), { x, y: y + h / 2, z, sx: w, sy: h, sz: d }, cr, o));
const luz = (cr, k) => { // clareia/escurece um hex
  const n = parseInt(cr.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
};
// tela com brilho próprio leve (frente voltada para o sul)
const tela = (m, x, y, z, w, h, cr, b = -0.5) => cx(m, x, y, z, w, h, 0.8, 0.3, cr, { brilho: b, ao: false });
// Poké Bola lisa: vermelha em cima, branca embaixo (função de cor pela normal)
const BR = linear('#f6f4ee'), VM = linear('#e5483f');
const corBola = (x, y, z, nx, ny) => { const k = Math.max(0, Math.min(1, (ny + 0.12) / 0.24)); return [BR[0] + (VM[0] - BR[0]) * k, BR[1] + (VM[1] - BR[1]) * k, BR[2] + (VM[2] - BR[2]) * k]; };
const bola = (m, x, y, z, r, o = {}) => m.bola(x, y, z, r, r, r, corBola, { d: o.d ?? 1, ao: false, ...o });

// ---------- estantes de livros (shelf, estante, estanteLarga): corpo de madeira com 3-4 fileiras ----------
function estante(m, c, nivel) {
  const L = c.L - 0.6, h = 46, z0 = -15.6, z1 = -6, zc = (z0 + z1) / 2, cr = c.v ? MADE : MAD;
  for (const sx of [-1, 1]) cx(m, sx * (L - 0.8), 0, zc, 1.6, h, z1 - z0, 0.6, cr);
  cx(m, 0, h - 1.6, zc, L * 2, 1.6, z1 - z0 + 0.6, 0.6, MADC);
  cx(m, 0, 0, z0 + 0.5, L * 2 - 2, h - 1.6, 1, 0.3, { pe: '#4e301c', topo: '#6e4226' }, { ao: false });
  cx(m, 0, 0, zc, L * 2 - 2, 1.5, z1 - z0, 0.3, cr);
  for (let i = 0; i < nivel; i++) {
    const y = 1.5 + i * ((h - 3) / nivel), hh = (h - 3) / nivel;
    cx(m, 0, y, z1 - 3, L * 2 - 3, 1.2, 5.6, 0.4, MADC, { ao: false });
    let x = -L + 2.4, k = i * 3 + c.v * 5, n = 0;
    while (x < L - 4 && n < 3) { const bw = 2 + ((k * 7) % 3) * 0.7, bh = hh * (0.5 + ((k * 5) % 4) * 0.1); cx(m, x + bw / 2, y + 1.2, z1 - 3.4, bw, bh, 4, 0.5, LIVROS[k % 7], { ao: false }); x += bw + 0.6; k++; n++; }
  }
  return t(h, -L, L, z0, z1);
}

// ---------- sofá / poltrona (encosto ao norte) ----------
function assento(m, w, cor, cz = -8, almofada) {
  const d = 13, ar = 3.2, e = { pe: luz(cor, 0.78), topo: luz(cor, 1.18) };
  cx(m, 0, 0, cz, w, 7, d, 2.6, e, { seg: 1 });
  cx(m, 0, 6.5, cz - d / 2 + 2.2, w, 9, 4.4, 2.2, { pe: luz(cor, 0.74), topo: luz(cor, 1.12) });
  for (const s of [-1, 1]) cx(m, s * (w / 2 - ar / 2), 5, cz, ar, 7, d, 1.4, { pe: luz(cor, 0.82), topo: luz(cor, 1.2) });
  const nA = w > 20 ? 2 : 1, aw = (w - ar * 2 - 1) / nA; // almofadas do assento
  for (let i = 0; i < nA; i++) cx(m, -((nA - 1) * aw) / 2 + i * aw, 7, cz + 1.2, aw - 0.6, 2.2, d - 4.5, 1.1, { pe: luz(cor, 0.95), topo: luz(cor, 1.28) }, { ao: false });
  if (almofada) m.bola(w / 2 - 6, 11.5, cz - 1.2, 2.6, 2.6, 1.9, almofada, { d: 0, ao: false });
  return t(7, -w / 2, w / 2, cz - d / 2, cz + d / 2);
}

// perna de móvel (cilindro fininho)
const perna = (m, x, z, h, r, cr) => m.cil(x, 0, z, r * 1.15, r, h, 6, cr, { ao: false });

export const TIPOS_INTERIOR = {
  bed: { f: (m) => { // cama 1x2: cabeceira ao norte, travesseiro, cobertor azul
    cx(m, 0, 0, -16, 15, 6, 29, 2.2, MAD, { seg: 1 });
    cx(m, 0, 6, -15, 13.6, 3, 27, 1.4, { pe: '#e9e6f0', topo: '#ffffff' }, { ao: false });
    cx(m, 0, 6.5, -9, 14.4, 4.2, 18, 2, { pe: '#3f6fd8', topo: '#85adf8' }, { ao: false });
    cx(m, 0, 10, -18.6, 14.6, 1.1, 3.4, 0.5, '#f9f9f9', { ao: false });
    m.bola(0, 10.6, -27, 5.4, 2.4, 3.4, { pe: '#ece8f4', topo: '#ffffff' }, { d: 0, ao: false });
    cx(m, 0, 0, -30.8, 16, 18, 2.6, 1.2, MADE);
    cx(m, 0, 0, -1.4, 16, 9, 2.2, 1.1, MADE);
    return t(10, -7, 7, -30, -2);
  } },
  table: { f: (m) => { // mesa de madeira com prato e copo
    for (const [x, z] of [[-12.5, -12.5], [12.5, -12.5], [-12.5, -3.5], [12.5, -3.5]]) perna(m, x, z, 9.5, 1.5, MADE.pe);
    cx(m, 0, 9, -8, 31, 3, 13.5, 1.5, MADC, { seg: 1 });
    m.cil(-5, 12, -8, 4.2, 4, 0.7, 9, '#f6f4ee', { aberto: false, ao: false });
    m.cil(7, 12, -7, 1.9, 1.7, 4, 7, { pe: '#e5483f', topo: '#f6a0a0' }, { aberto: false, ao: false });
    return t(12.5, -15, 15, -14, -1.5);
  } },
  tv: { f: (m) => { // TV de tubo sobre rack de madeira
    cx(m, 0, 0, -10.5, 16, 8, 9, 1.8, MAD, { seg: 1 });
    cx(m, 0, 8, -10.5, 15, 10, 7.4, 2, { pe: '#3a3a46', topo: '#5a5a68' });
    tela(m, 0, 9.4, -6.9, 11.6, 7.2, '#7ac0e8', -0.6);
    cx(m, -3, 14, -6.7, 4, 1.4, 0.4, 0.3, '#d6f0ff', { brilho: -0.6, ao: false });
    cx(m, 5.3, 9.6, -6.8, 1.4, 1.4, 0.4, 0.3, '#e8584a', { ao: false });
    return t(18, -8, 8, -15, -6);
  } },
  shelf: { f: (m, c) => estante(m, c, 4), var: 2 },
  estante: { f: (m, c) => estante(m, c, 4), var: 2 },
  estanteLarga: { f: (m, c) => estante(m, c, 4), var: 2 },
  plant: { f: (m) => { // vaso de barro com folhagem
    m.cil(0, 0, -8, 4, 4.8, 7, 8, { pe: '#b0502c', topo: '#d8804a' });
    m.cil(0, 6, -8, 5.4, 5.4, 1.4, 8, '#c8683c', { ao: false });
    m.cil(0, 7, -8, 4, 4, 0.4, 8, '#5a3a22', { aberto: false, ao: false });
    m.bola(0, 12, -8, 6.6, 5.4, 6.2, { pe: '#2f9a45', topo: '#62d070' }, { d: 1, ao: false });
    for (const [x, y, z, r] of [[-4.6, 10, -7, 3.2], [4.6, 11, -8, 3.2], [0.5, 16, -9, 3.2]]) m.bola(x, y, z, r, r * 0.9, r, { pe: '#3aaa50', topo: '#84e078' }, { d: 0, ao: false });
    return t(18, -4, 4, -12, -4);
  } },
  pc: { estado: estadoKit('pc'), f: (m, c) => {
    if (c.estado === 'centro') { // terminal do PC do Centro: totem com tela azul e teclado
      cx(m, 0, 0, -8.5, 15, 16, 9, 2.4, { pe: '#aeb8c6', topo: '#eef2f6' }, { seg: 1 });
      cx(m, 0, 15.5, -7.5, 16.4, 2, 10, 1, { pe: '#98a2b0', topo: '#e4e8ee' });
      cx(m, 0, 16.5, -5.4, 12, 1.2, 4.2, 0.6, '#3a3a44', { ao: false });
      cx(m, 0, 17.5, -10.6, 15, 15, 3.4, 1.8, { pe: '#aeb8c6', topo: '#eef2f6' });
      tela(m, 0, 19.6, -8.7, 12, 10.6, '#4c9ae8', -0.5);
      bola(m, 0, 25, -8.2, 2.5, { d: 0, brilho: -0.4 });
      m.bola(5.6, 32.6, -10, 1, 1, 1, '#5aff7a', { d: 0, brilho: -1, ao: false });
      return t(33, -7.5, 7.5, -13, -4);
    }
    cx(m, 0, 0, -10, 16, 9, 10, 2, { pe: '#8a94a2', topo: '#cfd6de' }, { seg: 1 });
    cx(m, 6.4, 0, -9, 3, 8, 6, 0.8, '#7a8490', { ao: false });
    cx(m, -1, 9, -9.4, 13.4, 10, 4.4, 1.8, { pe: '#8a94a2', topo: '#cfd6de' });
    tela(m, -1, 10.4, -7.1, 10.6, 7.2, '#3f5a72', -0.2);
    cx(m, -3, 14, -6.9, 5, 1.2, 0.4, 0.3, '#7ae8b0', { brilho: -1, ao: false });
    cx(m, -1, 9, -5.4, 11, 1, 3, 0.5, '#6a7480', { ao: false });
    return t(19, -8, 8, -15, -5);
  } },
  machine: { f: (m) => { // máquina de cura: corpo claro, tela verde e seis Poké Bolas
    cx(m, 0, 0, -9, 30, 13, 12, 2.6, { pe: '#aab4c0', topo: '#e2e8ee' }, { seg: 1 });
    cx(m, 0, 0, -2.8, 29, 1.8, 0.8, 0.3, '#7a8490', { ao: false });
    cx(m, -8, 12.5, -12.5, 14, 9, 5, 1.8, { pe: '#aab4c0', topo: '#e2e8ee' });
    tela(m, -8, 14, -9.7, 10.4, 6.2, '#3a4a5a', -0.2);
    cx(m, -8, 15.4, -9.5, 5, 3, 0.4, 0.3, '#7ae8b0', { brilho: -1, ao: false });
    for (let i = 0; i < 6; i++) bola(m, 1.5 + (i % 3) * 5.2, 15, -12.2 + Math.floor(i / 3) * 5.2, 2.3, { d: 0 });
    cx(m, 6, 4.4, -2.9, 14, 4.4, 0.5, 0.4, '#ff6a5c', { brilho: -0.2, ao: false });
    return t(13, -15, 15, -15, -3);
  } },
  counter: { f: (m) => { // balcão da Joy: branco com faixa vermelha
    cx(m, 0, 0, -8.5, 64, 14, 11, 2.4, { pe: '#cfd8e0', topo: '#f2f6f8' }, { seg: 1 });
    cx(m, 0, 5.6, -2.8, 64.4, 3.2, 0.7, 0.3, '#ee6a5c', { ao: false });
    cx(m, 0, 0, -2.8, 64.4, 1.6, 0.7, 0.3, '#aab4be', { ao: false });
    cx(m, 0, 14, -8.4, 67, 1.8, 14, 0.9, { pe: '#e4eaf0', topo: '#ffffff' });
    cx(m, 14, 15.8, -9, 6.4, 1, 4.4, 0.4, '#f4f0e6', { ao: false });
    m.cil(-16, 15.8, -10, 2.6, 2.1, 2.6, 7, '#c8683c', { ao: false });
    m.bola(-16, 20, -10, 3.2, 2.8, 3.2, { pe: '#2f9a45', topo: '#6edb78' }, { d: 0, ao: false });
    return t(16, -33, 33, -15, -2);
  } },
  balltable: { f: (m) => { // mesa das Poké Bolas
    for (const x of [-20, 20]) for (const z of [-11.5, -4.5]) perna(m, x, z, 8.5, 1.4, MADE.pe);
    cx(m, 0, 8, -8, 47, 3, 13, 1.5, MADC, { seg: 1 });
    for (const x of [-12, 0, 12]) { bola(m, x, 14.6, -8, 3.4, { d: 0 }); cx(m, x, 14, -4.7, 2, 1.6, 0.5, 0.3, '#f6f4ee', { ao: false }); }
    return t(17, -23, 23, -14, -2);
  } },
  radio: { f: (m) => { // rádio antigo de madeira
    cx(m, 0, 0, -8.5, 14, 12, 9, 2.6, MAD, { seg: 1 });
    m.cil(-2.6, 6, -3.9, 3.2, 3.2, 0.8, 9, '#3a3030', { rx: Math.PI / 2, aberto: false, ao: false });
    cx(m, 4, 7, -3.9, 4.4, 1.4, 0.4, 0.3, '#f2c94c', { ao: false });
    cx(m, 4, 3.8, -3.9, 4.4, 1.4, 0.4, 0.3, '#f2c94c', { ao: false });
    m.cil(4.5, 12, -10, 0.5, 0.5, 9, 5, '#8a8a92', { ao: false });
    m.bola(4.5, 21.4, -10, 0.9, 0.9, 0.9, '#e8584a', { d: 0, ao: false });
    return t(12, -7, 7, -13, -4);
  } },
  luzita: { f: (m) => { // cristal Luzita sobre pedestal
    m.cil(0, 0, -8, 5.8, 5, 3.4, 8, { pe: '#5a5a66', topo: '#8a8a98' }, { aberto: false });
    m.bola(0, 10, -8, 3.8, 6.2, 3.8, '#9afff4', { d: 0, brilho: -1, ao: false });
    m.bola(-3.6, 6.4, -6, 1.9, 3.2, 1.9, '#5ae8e0', { d: 0, brilho: -1, ao: false });
    return t(16, -4, 4, -12, -4);
  } },
  fogao: { f: (m) => { // fogão a lenha com chaminé e panela
    cx(m, 0, 0, -8.5, 30, 12, 11, 2.4, MAD, { seg: 1 });
    cx(m, -6.5, 1.8, -2.8, 10, 7.4, 0.7, 0.4, '#2a2420', { ao: false });
    cx(m, -6.5, 2.8, -2.5, 7.4, 4.6, 0.6, 0.4, '#ffb84a', { brilho: -1, ao: false });
    cx(m, 0, 12, -8.5, 31, 1.2, 12, 0.5, { pe: '#4a4a52', topo: '#7a7a86' }, { ao: false });
    m.cil(7, 13, -9, 4.8, 4.2, 4.2, 8, '#4a4a54', { aberto: false });
    m.cil(9.5, 13, -12, 1.6, 1.5, 17, 6, '#7a7a86', { ao: false });
    return t(13, -15, 15, -14, -3);
  } },
  quadro: { f: (m) => { // retrato emoldurado na parede
    cx(m, 0, 4, -15.4, 14, 13.4, 1.4, 0.6, '#a8782e', { ao: false });
    cx(m, 0, 5.1, -14.5, 11.8, 11.2, 0.5, 0.3, '#d8b45a', { ao: false });
    cx(m, 0, 6.2, -14.2, 9.6, 9, 0.5, 0.3, '#4a3e54', { ao: false });
    m.bola(0, 12, -13.8, 2.6, 2.9, 0.9, '#d8b090', { d: 0, ao: false });
    cx(m, 0, 7, -13.8, 5.4, 2.8, 0.6, 1, '#7a4a5a', { ao: false });
    return t(17, -7, 7, -16, -14);
  } },
  quadroBenta: { f: (m) => { // quadro da Benta (fundo claro, retrato com vestido vermelho)
    cx(m, 0, 4, -15.4, 14, 13.4, 1.4, 0.6, '#a8782e', { ao: false });
    cx(m, 0, 5.1, -14.5, 11.8, 11.2, 0.5, 0.3, '#ecd070', { ao: false });
    cx(m, 0, 6.2, -14.2, 9.6, 9, 0.5, 0.3, '#f6ecd4', { ao: false });
    m.bola(0, 12, -13.8, 2.6, 2.9, 0.9, '#f0c8a0', { d: 0, ao: false });
    cx(m, 0, 7, -13.8, 5.4, 2.8, 0.6, 1, '#e86a60', { ao: false });
    return t(17, -7, 7, -16, -14);
  } },
  cadeira: { f: (m) => {
    for (const [x, z] of [[-4.6, -11.5], [4.6, -11.5], [-4.6, -4.4], [4.6, -4.4]]) perna(m, x, z, 7.2, 0.9, MADE.pe);
    cx(m, 0, 6.8, -8, 12.5, 2, 10.6, 1, MADC);
    cx(m, 0, 8.6, -12.6, 12, 8.6, 1.8, 0.9, MAD);
    return t(9, -6, 6, -13, -3);
  } },
  sofa: { f: (m, c) => assento(m, c.L * 2 - 2, '#4c7ae8', -8, '#f2c94c') },
  poltrona: { f: (m) => assento(m, 15, '#e8b83a', -8) },
  poltronaAzul: { f: (m) => assento(m, 15, '#4c7ae8', -8) },
  mesaCentro: { f: (m) => { // mesinha baixa branca
    cx(m, 0, 0, -8, 29, 7, 10, 2.6, { pe: '#dcdcd6', topo: '#ffffff' }, { seg: 1 });
    cx(m, 0, 0, -2.9, 25, 5, 0.7, 0.4, '#c8c8c0', { ao: false });
    return t(7, -15, 15, -13, -3);
  } },
  mesaEstudo: { f: (m) => { // escrivaninha com gaveteiro, livros e papel
    cx(m, -11, 0, -10, 8, 10, 10, 1.4, MAD);
    cx(m, -11, 6, -4.9, 6, 0.9, 0.4, 0.3, '#f2c94c', { ao: false });
    cx(m, -11, 2.4, -4.9, 6, 0.9, 0.4, 0.3, '#f2c94c', { ao: false });
    for (const z of [-13.4, -5.6]) perna(m, 13, z, 10.5, 1, MADE.pe);
    cx(m, 0, 10, -9.5, 31, 2.2, 11.5, 1.2, MADC, { seg: 1 });
    cx(m, -5.6, 12.2, -8, 6, 0.5, 5, 0.2, '#f9f9f9', { ao: false });
    for (let i = 0; i < 3; i++) cx(m, 4 + i * 2.6, 12.2, -11, 2.2, 5.6 - (i % 2), 4, 0.5, LIVROS[i], { ao: false });
    return t(13, -15, 15, -15, -4);
  } },
  prateleiraLoja: { f: (m) => { // prateleira de metal azul com produtos
    cx(m, 0, 0, -11, 30, 24, 8, 1.8, { pe: '#2f64c8', topo: '#7aaaf8' }, { seg: 1 });
    for (const y of [2, 10.4, 18.6]) {
      cx(m, 0, y, -8.4, 27.4, 0.9, 5.6, 0.3, '#dde2e6', { ao: false });
      for (let i = 0; i < 4; i++) cx(m, -9 + i * 6, y + 0.9, -8.6, 3.6, 4.4 + ((i + y) % 2) * 1.6, 3.4, 0.9, ['#e8584a', '#f2c94c', '#5ab45a', '#4c9ae8', '#ff9ad0', '#ffffff'][(i + (y | 0)) % 6], { ao: false });
    }
    return t(24, -15, 15, -15, -7);
  } },
  tapete: { f: (m) => { // tapete vermelho com miolo dourado
    cx(m, 0, 0, -8, 30, 0.7, 12, 0.3, '#cf5446', { ao: false });
    cx(m, 0, 0.5, -8, 26, 0.5, 8.6, 0.25, '#e9a840', { ao: false });
    cx(m, 0, 0.8, -8, 21, 0.4, 5, 0.2, '#cf5446', { ao: false });
    return t(1, -15, 15, -14, -2);
  } },
  tapeteVerde: { f: (m) => { // tapete verde grande
    cx(m, 0, 0, -16, 46, 0.7, 28, 0.35, '#3a8a46', { ao: false });
    cx(m, 0, 0.5, -16, 40, 0.5, 22, 0.3, '#5cb85e', { ao: false });
    return t(1, -23, 23, -30, -2);
  } },
  vaso: { f: (m) => { // vaso branco com plantas altas
    m.cil(0, 0, -8, 4.2, 5.2, 9, 8, { pe: '#d8e0e6', topo: '#ffffff' });
    m.cil(0, 8.6, -8, 4.8, 4.8, 0.5, 8, '#5a3a22', { aberto: false, ao: false });
    m.bola(-1.6, 15, -8.4, 3.6, 6.6, 3.4, { pe: '#2f9a45', topo: '#5cd070' }, { d: 0, ao: false });
    m.bola(2.6, 14, -7.4, 3.3, 5.6, 3.2, { pe: '#3aaa50', topo: '#84e078' }, { d: 0, ao: false });
    m.bola(0, 20, -8, 4.2, 3.2, 3.6, { pe: '#4cc25a', topo: '#9af088' }, { d: 0, ao: false });
    return t(24, -4, 4, -12, -4);
  } },
  janelaInterna: { f: (m) => { // janela de parede com vidro claro
    cx(m, 0, 6, -15.4, 30, 20, 1.4, 1, '#f6f4ee', { ao: false });
    cx(m, 0, 7.6, -14.5, 26, 16.8, 0.6, 0.5, '#bfe4ff', { brilho: 0.7, ao: false });
    cx(m, 0, 7.6, -14.1, 1.6, 16.8, 0.6, 0.3, '#f6f4ee', { ao: false });
    cx(m, 0, 15.4, -14.1, 26, 1.4, 0.6, 0.3, '#f6f4ee', { ao: false });
    cx(m, 0, 5, -14.2, 32, 1.6, 2.2, 0.7, '#e2dcd0', { ao: false });
    return t(26, -15, 15, -16, -14);
  } },
  quadroMapa: { f: (m) => { // mapa de Alvorada
    cx(m, 0, 10, -15.4, 24, 16, 1.4, 0.8, '#3f7a44', { ao: false });
    cx(m, 0, 11, -14.5, 22, 14, 0.5, 0.4, '#8fd078', { ao: false });
    cx(m, -6, 14, -14.1, 7, 4, 0.5, 0.8, '#6cc0e8', { ao: false });
    cx(m, 5, 21.6, -14.1, 6, 3, 0.5, 0.8, '#d8c890', { ao: false });
    for (const [x, y] of [[-6, 20], [0, 15.5], [6, 17], [3, 12.5]]) m.bola(x, y, -13.8, 1.1, 1.1, 0.7, '#e8584a', { d: 0, ao: false });
    return t(26, -12, 12, -16, -14);
  } },
  telaCentro: { f: (m) => { // telão do Centro com Poké Bola
    cx(m, 0, 14, -15.4, 26, 14, 1.4, 1, '#4a4a58', { ao: false });
    tela(m, 0, 15, -14.4, 24, 12, '#7ac0e8', -0.55);
    bola(m, 0, 21, -13.4, 3.6, { d: 1, brilho: -0.3 });
    return t(28, -13, 13, -16, -14);
  } },
  cruzJoy: { f: (m) => { // placa branca com cruz vermelha
    cx(m, 0, 12, -15.4, 14, 14, 1.4, 1.4, '#fafafa', { ao: false });
    cx(m, 0, 14, -14.5, 3.4, 10, 0.5, 0.5, '#ea4a3e', { ao: false });
    cx(m, 0, 17.4, -14.4, 10, 3.4, 0.5, 0.5, '#ea4a3e', { ao: false });
    return t(26, -7, 7, -16, -14);
  } },
  gondola3: { f: (m, c) => { // gôndola de loja (dois lados), azul e branca, com produtos coloridos
    const L = c.L - 1, z0 = -13, z1 = -3, zm = (z0 + z1) / 2;
    cx(m, 0, 0, zm, L * 2, 4.4, z1 - z0, 1.6, { pe: '#2a58b8', topo: '#9ac0f8' }, { seg: 1 });
    cx(m, 0, 4, zm, L * 2 - 4, 30, 1.8, 0.8, { pe: '#dfe6ee', topo: '#ffffff' });
    for (const s of [-1, 1]) cx(m, s * (L - 1.2), 0, zm, 2.6, 35, z1 - z0, 1.2, { pe: '#3a7ae8', topo: '#9ac0f8' });
    const cores = ['#e8584a', '#f2c94c', '#5ab45a', '#4c9ae8', '#ff9ad0', '#ffffff'];
    for (const [i, y] of [[0, 4.4], [1, 14], [2, 23.6]]) {
      cx(m, 0, y, zm + 3, L * 2 - 5, 0.9, 5.6, 0.3, '#d8e0e8', { ao: false });
      const n = Math.max(4, Math.round((L * 2 - 8) / 5.2));
      for (let k = 0; k < n; k++) cx(m, -L + 4.4 + k * ((L * 2 - 8.8) / (n - 1)), y + 0.9, zm + 3.4, 3.6, 4 + ((k + i) % 2) * 1.6, 3.6, 0.9, cores[(k + i * 2) % 6], { ao: false });
    }
    cx(m, 0, 35, zm, L * 2, 4.4, 2.4, 1, { pe: '#d8483c', topo: '#ff8a7a' }, { ao: false });
    return t(39.4, -L, L, z0, z1);
  } },
};
