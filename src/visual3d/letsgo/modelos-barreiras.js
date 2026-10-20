import * as THREE from 'three';
import { cor as linear } from '../kit/construtor.js';
import { MalhaLG, esf, prim } from './modelos.js';
import { estadoKit } from './modelos-util.js';

// Modelos lisos do grupo "barreiras" (estilo Let's Go): as peças de 1 bloco (x de -8 a 8, z de -16 a 0) das barreiras
// da progressão, espelhando src/visual3d/kit/barreiras.js. Cada peça encosta na vizinha (parede contínua); a orientação
// 'h' (ao longo de x) / 'v' (ao longo de z) vem do estado do kit (estadoKit), igual ao voxel.
// Nada fica abaixo de y = 0 (as peças de água sobem do nível da superfície).

const MAD = ['#6a4428', '#8a5a36', '#a87448', '#c89460'];
const LAR = '#f48a3a', LAR2 = '#ff9f5a', BRANCO = '#f6f4ee', AMBAR = '#ffbc3a', FERRO = '#59606e', OURO = '#f0c040';
const t1 = (y, r = 7) => ({ y, x0: -r, x1: r, z0: -8 - r, z1: -8 + r });
const ori = (e) => (e && e[0] === 'v' ? 'v' : 'h');
const CAIXA = () => prim('tabua', () => new THREE.BoxGeometry(1, 1, 1));

// Ajudante de coordenadas locais: a peça é desenhada "ao longo de x" com o centro do bloco em (0, 0) e é girada para
// 'v' (ao longo de z) sem mexer no resto. x local = ao longo da peça; z local = atravessado.
function L(m, o) {
  const v = o === 'v', r0 = v ? Math.PI / 2 : 0;
  const p = (x, z) => (v ? [z, -8 - x] : [x, z - 8]);
  const ry = (e) => (e?.ry ?? 0) + r0;
  return {
    // tábua plana (caixa simples, poucos triângulos): centro em x,z; base em y
    tab: (x, y, z, w, h, d, cr, e = {}) => { const [X, Z] = p(x, z); return m.add(CAIXA(), { x: X, y: y + h / 2, z: Z, sx: w, sy: h, sz: d, rx: e.rx, ry: ry(e), rz: e.rz }, cr, e); },
    cx: (x, y, z, w, h, d, r, cr, e = {}) => { const [X, Z] = p(x, z); return m.caixa(X, y, Z, w, h, d, r, cr, { ...e, ry: ry(e) }); },
    cil: (x, y, z, r0_, r1, h, n, cr, e = {}) => { const [X, Z] = p(x, z); return m.cil(X, y, Z, r0_, r1, h, n, cr, { ...e, ry: ry(e) }); },
    // cilindro deitado ao longo da peça, começando em x (comprimento len), centro à altura y
    trilho: (x, y, z, len, r, n, cr, e = {}) => { const [X, Z] = p(x, z); return m.cil(X, y, Z, r, r, len, n, cr, { ...e, rz: -Math.PI / 2, ry: ry(e) }); },
    bola: (x, y, z, sx, sy, sz, cr, e = {}) => { const [X, Z] = p(x, z); return m.add(esf(e.d ?? 1), { x: X, y, z: Z, sx, sy, sz, ry: ry(e) }, cr, e); },
    cone: (x, y, z, r, h, n, cr, e = {}) => { const [X, Z] = p(x, z); return m.cone(X, y, Z, r, h, n, cr, e); },
  };
}
// losango de aviso (preto + amarelo + símbolo); centro cy, raio R, face voltada para o sul (z)
function losango(m, cy, R, z, amarelo, simbolo) {
  const dado = (s, cz, cr, e = {}) => m.add(CAIXA(), { x: 0, y: cy, z: cz, sx: s, sy: s, sz: e.e ?? 0.9, rz: Math.PI / 4 }, cr, { ao: false });
  dado(R * 1.42, z, '#2c2c34'); dado(R * 1.42 - 1.7, z + 0.35, amarelo);
  if (simbolo === 'obra') { m.add(CAIXA(), { x: 0, y: cy + 0.9, z: z + 0.8, sx: 1.2, sy: 4, sz: 0.4 }, '#2c2c34', { ao: false }); m.add(esf(0), { x: 0, y: cy - 2.1, z: z + 0.8, s: 0.8 }, '#2c2c34', { ao: false }); }
  else {
    m.add(CAIXA(), { x: 0.5, y: cy + 1.8, z: z + 0.8, sx: 1.3, sy: 4.4, sz: 0.4, rz: 0.45 }, '#2c2c34', { ao: false });
    m.add(CAIXA(), { x: -0.4, y: cy - 1.8, z: z + 0.8, sx: 1.3, sy: 4.4, sz: 0.4, rz: 0.45 }, '#2c2c34', { ao: false });
  }
}
// disco dourado de frente para o sul
const disco = (m, x, y, z, r, cr) => m.add(prim('disco10', () => { const g = new THREE.CylinderGeometry(1, 1, 1, 10, 1, false); g.rotateX(Math.PI / 2); return g; }), { x, y, z, sx: r, sy: r, sz: 0.5 }, cr, { ao: false });

export const TIPOS_BARREIRAS = {
  // cavalete de obra: pernas de madeira, duas tábuas listradas e o pisca âmbar
  barCavalete: { estado: estadoKit('barCavalete'), f: (m, c) => {
    const l = L(m, ori(c.estado));
    for (const x of [-6, 6]) for (const z of [-2.2, 2.2]) l.cil(x, 0, z, 1, 0.8, 12, 6, { pe: MAD[0], topo: MAD[2] });
    const lista = (y0, y1, a, b, e = 1.8) => { for (let k = 0; k < 4; k++) l.tab(-6 + k * 4, y0, 0, 4, y1 - y0, e, k % 2 ? b : a, { ao: false }); };
    lista(8.5, 12.5, LAR, BRANCO); lista(3.5, 6.5, BRANCO, LAR, 1.4);
    l.cil(5.5, 12.5, 0, 1.3, 1.1, 1, 6, '#34343c');
    l.bola(5.5, 14.4, 0, 1.5, 1.5, 1.5, AMBAR, { d: 0, brilho: -0.7, ao: false });
    return t1(16);
  } },
  // cone de trânsito
  barCone: { f: (m) => {
    m.add(CAIXA(), { x: 0, y: 0.7, z: -8, sx: 9.4, sy: 1.4, sz: 9.4 }, { pe: '#c8601e', topo: '#e87c30' }, {});
    m.cone(0, 1.4, -8, 4, 11, 10, { pe: '#d8641e', topo: LAR2 }, { ao: false });
    m.cil(0, 4.4, -8, 2.95, 2.1, 2.4, 10, BRANCO, { ao: false });
    m.cil(0, 7.4, -8, 1.9, 1.45, 1.2, 10, BRANCO, { ao: false });
    return t1(12.4, 4);
  } },
  // pilha de toras cortadas
  barToras: { estado: estadoKit('barToras'), var: 2, f: (m, c) => {
    const o = ori(c.estado), l = L(m, o);
    const cor = (x, y, z, nx, ny, nz) => (Math.abs(o === 'v' ? nz : nx) > 0.9 ? linear('#e6cc86') : linear(ny > 0.3 ? '#9a7a5a' : '#7a5a46'));
    const tora = (y, z, len, r) => l.trilho(-len / 2, y, z, len, r, 7, cor, { var: 0.06 });
    tora(3.2, -3.1, 16, 3.2); tora(3.2, 3.1, 16 - c.v, 3.2); tora(8.4, 0, 15, 3);
    if (c.v) l.bola(-3, 12, 0, 2.2, 1.4, 2.2, '#4aa84a', { d: 0, ao: false });
    return t1(11.5);
  } },
  // moita fechada (cerca viva)
  barMoita: { var: 3, f: (m, c) => {
    const r = m.r, pal = [['#237a3a', '#3a9a46'], ['#2f8a40', '#58bc54'], ['#47a84a', '#86dc66']];
    m.bola(0, 7, -8, 10.2, 7.4, 6.8, { pe: pal[0][0], topo: pal[0][1] }, { d: 1, var: 0.1 });
    for (const [x, y, z, s, k] of [[-6.6, 6.5, -8, 5.8, 1], [6.6, 6.7, -8, 5.8, 1], [-1.5 + c.v, 12.5, -8.5, 5.4, 2], [3.6, 10.5 - c.v, -5, 4.2, 1]]) m.bola(x + (r() - 0.5), y, z, s, s * 0.9, s * 0.9, { pe: pal[k][0], topo: pal[k][1] }, { d: 0, var: 0.12, ao: false });
    if (c.v === 2) for (const x of [-4, 3]) m.bola(x, 11, -2, 1.2, 1.2, 1.2, '#f0584a', { d: 0, ao: false });
    return t1(17);
  } },
  // entulho do desmoronamento
  barEntulho: { var: 3, f: (m, c) => {
    const r = m.r, pal = [['#7a6e64', '#a09484'], ['#8e8272', '#b8aa98'], ['#807e8c', '#b2b0bc']];
    m.bola(0, 3.4, -8, 10.4, 5.2, 7.2, { pe: '#6a5844', topo: '#9a8266' }, { d: 1, var: 0.06 });
    const n = 3 + c.v;
    for (let k = 0; k < n; k++) { const w = 3 + r() * 2.2, p = pal[k % 3]; m.bola(-6 + r() * 12, 4.5 + (k > 1 ? 4 : 0) + r() * 2, -11 + r() * 6, w * 1.2, w, w * 1.05, { pe: p[0], topo: p[1] }, { d: 0, var: 0.08 }); }
    if (c.v === 2) m.bola(1, 8, -8.5, 6.5, 7.5, 5.5, { pe: pal[2][0], topo: pal[2][1] }, { d: 1, var: 0.06 });
    if (c.v !== 1) m.add(CAIXA(), { x: -1, y: 11 + r() * 2, z: -5, sx: 15, sy: 1.8, sz: 2.2, rz: 0.4, ry: 0.15 }, MAD[2], { ao: false });
    return t1(17);
  } },
  // cerca de metal da Companhia Aurora
  barCerca: { estado: estadoKit('barCerca'), f: (m, c) => {
    const l = L(m, ori(c.estado));
    l.tab(0, 0, 0, 16, 2.5, 3.2, '#b4aea0', {});
    for (const x of [-7.2, 7.2]) { l.cil(x, 2.5, 0, 1.3, 1.1, 18.5, 7, { pe: '#434956', topo: '#6a707e' }); l.bola(x, 21.6, 0, 1.7, 1.7, 1.7, OURO, { d: 0, ao: false }); }
    for (const y of [3.4, 19.4]) l.trilho(-8, y, 0, 16, 0.7, 5, '#6a707a', { ao: false });
    for (let k = 0; k < 5; k++) l.tab(-5.5 + k * 2.75, 4, 0, 0.6, 15, 0.5, '#9aa0ae', { ao: false });
    l.tab(0, 15.6, 0.3, 15, 1.7, 0.7, OURO, { ao: false });
    if (c.estado.endsWith('p')) {
      l.cx(0, 6.2, 0.9, 9.4, 7.6, 0.8, 0.5, BRANCO, { seg: 1, ao: false });
      l.bola(0, 10.8, 1.6, 2.2, 2.2, 0.6, OURO, { d: 0, ao: false });
      for (const [dx, dy] of [[0, 3.6], [2.6, 2.4], [-2.6, 2.4]]) l.bola(dx, 10.8 + dy - 1, 1.6, 0.6, 0.6, 0.4, OURO, { d: 0, ao: false });
      l.tab(0, 7.2, 1.45, 6, 0.6, 0.3, '#6a5a3a', { ao: false });
    }
    return t1(23);
  } },
  // portão de metal fechado
  barPortao: { estado: estadoKit('barPortao'), f: (m, c) => {
    const l = L(m, ori(c.estado));
    for (const x of [-7.2, 7.2]) { l.cil(x, 0, 0, 1.6, 1.4, 21, 7, { pe: '#434956', topo: '#6a707e' }); l.bola(x, 21, 0, 2, 2, 2, OURO, { d: 0, ao: false }); }
    for (const y of [1.2, 18.4]) l.trilho(-8, y + 0.8, 0, 16, 0.8, 5, '#5e6470', { ao: false });
    for (let k = 0; k < 4; k++) l.tab(-4.5 + k * 3, 2, 0, 0.7, 16, 0.6, '#8a909c', { ao: false });
    for (let k = 0; k < 6; k++) l.tab(-6.25 + k * 2.5, 8.4, 0.8, 2.5, 2.6, 0.6, k % 2 ? '#34343c' : '#f4c640', { ao: false });
    l.tab(0, 12.4, 0.9, 5, 4, 0.7, '#e04a3a', { ao: false });
    l.tab(0, 14, 1.3, 3, 0.8, 0.2, BRANCO, { ao: false });
    return t1(23);
  } },
  // cancela listrada do posto de divisa
  barCancela: { estado: estadoKit('barCancela'), f: (m, c) => {
    const l = L(m, ori(c.estado));
    if (c.estado.endsWith('p')) {
      l.cil(-5.6, 0, 0, 2.5, 2.3, 12, 8, { pe: '#cfc9be', topo: '#f2eee6' });
      l.bola(-5.6, 12.5, 0, 2.6, 2.4, 2.6, '#e04a3a', { d: 0, brilho: -0.4, ao: false });
    } else { l.cil(6, 0, 0, 1, 0.9, 9.6, 6, FERRO); l.bola(6, 9.8, 0, 1.8, 1, 1.8, FERRO, { d: 0, ao: false }); }
    for (let k = 0; k < 4; k++) l.trilho(-8 + k * 4, 10.8, 0, 4, 1.1, 6, k % 2 ? BRANCO : '#e04a3a', { ao: false });
    return t1(16);
  } },
  // corda entre as boias, com flutuador
  barCorda: { estado: estadoKit('barCorda'), f: (m, c) => {
    const l = L(m, ori(c.estado));
    l.trilho(-8, 2, 0, 16, 0.6, 5, '#efe0a8', { ao: false });
    l.bola(0, 2.2, 0, 2.2, 2.2, 2.2, BRANCO, { d: 0, ao: false });
    l.trilho(-0.9, 2.2, 0, 1.8, 2.3, 8, '#ee5a4a', { ao: false });
    return t1(4.6, 7);
  } },
  // espuma branca da correnteza (nada abaixo do nível da água)
  barEspuma: { var: 4, f: (m, c) => {
    const r = m.r;
    for (let k = 0; k < 5; k++) { const rx = 2.4 + r() * 3, ry = 0.7 + r() * 0.8; m.bola(-6 + r() * 12, ry, -14 + r() * 12, rx, ry, rx * 0.6, k % 3 ? '#f6fcff' : '#d4ecf6', { d: 0, ao: false }); }
    m.bola(-2 + c.v, 1.2, -8, 4.5, 1.2, 1.6, '#ffffff', { d: 0, ao: false });
    return t1(2.4);
  } },
  // monte de neve soprada
  barNeve: { var: 3, f: (m, c) => {
    const r = m.r;
    m.bola(0, 3.6, -8, 9, 6 + c.v * 1.4, 7.5, { pe: '#c9d8ee', topo: '#fafcff' }, { d: 1, ao: false });
    m.bola(-4.4 + r() * 2, 3.4, -5.5, 5.6, 4.6 + r() * 1.6, 4.6, { pe: '#d0dcee', topo: '#ffffff' }, { d: 0, ao: false });
    m.bola(4.6, 2.8, -10, 4.8, 3.8 + r() * 2, 4.4, { pe: '#c4d4ea', topo: '#f0f6ff' }, { d: 0, ao: false });
    if (c.v === 2) { m.cil(3, 0, -6, 0.8, 0.7, 12.5, 5, MAD[0], { ao: false }); m.add(CAIXA(), { x: 5.2, y: 11, z: -5.6, sx: 4, sy: 2.4, sz: 0.5 }, '#e04a3a', { ao: false }); }
    return t1(10 + c.v);
  } },
  // ponte quebrada na água: estacas, tábua partida inclinada e tábua solta boiando
  barPonte: { var: 2, f: (m, c) => {
    for (const [x, z, h] of [[-6, -13, 9], [6, -12, 6 + c.v * 3], [-5, -3, 4]]) { m.cil(x, 0, z, 1.3, 1.1, h, 6, { pe: MAD[0], topo: MAD[2] }); m.bola(x, h, z, 1.2, 0.6, 1.2, MAD[3], { d: 0, ao: false }); }
    m.add(CAIXA(), { x: -2.5, y: 4.2, z: -8.5, sx: 11, sy: 1, sz: 5.4, rz: 0.36 }, { pe: MAD[2], topo: MAD[3] }, { ao: false });
    m.add(CAIXA(), { x: 4, y: 0.7, z: -7.6, sx: 3.6, sy: 0.8, sz: 4.6, rz: 0.2 }, MAD[1], { ao: false });
    m.add(CAIXA(), { x: 2, y: 0.4, z: -3, sx: 9, sy: 0.8, sz: 3.2, ry: 0.5 + c.v }, { pe: MAD[2], topo: MAD[3] }, { ao: false });
    return t1(10);
  } },
  // placa de aviso no poste
  barPlaca: { estado: estadoKit('barPlaca'), f: (m, c) => {
    const e = c.estado || 'obra';
    m.cil(0, 0, -8, 0.9, 0.8, 13, 6, { pe: '#434956', topo: '#6a707e' });
    if (e === 'obra' || e === 'tempestade') {
      losango(m, 16.2, 5.2, -7, e === 'obra' ? '#f6c63e' : '#f6d850', e);
      m.add(CAIXA(), { x: 0, y: 11, z: -8, sx: 3, sy: 1, sz: 3 }, '#59606e', { ao: false });
    } else {
      const fundo = e === 'aurora' ? BRANCO : '#2f55a0';
      m.caixa(0, 11, -8.3, 13, 8.4, 1.6, 1, { pe: fundo, topo: e === 'aurora' ? '#ffffff' : '#4a72c0' }, { seg: 1, ao: false });
      disco(m, 0, 15.6, -7.3, 2.1, OURO);
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; m.bola(Math.cos(a) * 3.3, 15.6 + Math.sin(a) * 3.3, -7.3, 0.55, 0.55, 0.3, OURO, { d: 0, ao: false }); }
      m.add(CAIXA(), { x: 0, y: 12.6, z: -7.3, sx: 9, sy: 0.7, sz: 0.3 }, OURO, { ao: false });
    }
    return t1(21, 6);
  } },
  // boia de aviso com placa amarela (nada abaixo da água)
  barPlacaBoia: { f: (m) => {
    m.cil(0, 0, -8, 5.5, 4.5, 6, 10, { pe: '#d8a020', topo: '#f8d050' }, { aberto: false });
    m.cil(0, 2, -8, 5.6, 5.3, 1.8, 10, '#34343c', { ao: false });
    m.cil(0, 6, -8, 0.8, 0.7, 8, 5, FERRO, { ao: false });
    losango(m, 16, 4.6, -7.2, '#f6d850', 'tempestade');
    m.bola(0, 21.6, -8, 1.5, 1.5, 1.5, '#ff7a3a', { d: 0, brilho: -0.8, ao: false });
    return t1(23, 5.5);
  } },
  // pilar de pedra do portão do Zênite, com capitel dourado
  barPilar: { f: (m) => {
    m.add(CAIXA(), { x: 0, y: 1.5, z: -8, sx: 12, sy: 3, sz: 12 }, { pe: '#a8a294', topo: '#c8c2b4' }, {});
    m.cil(0, 3, -8, 3.9, 3.3, 24, 8, { pe: '#cfc7b6', topo: '#efe8d8' }, { var: 0.04 });
    m.cil(0, 27, -8, 5.2, 5.6, 2.8, 8, OURO, { aberto: false, ao: false });
    m.bola(0, 32.4, -8, 2.8, 3.2, 2.8, '#f8dc58', { d: 1, brilho: -0.5, ao: false });
    return t1(36, 6);
  } },
  // grade de ferro com pontas douradas, entre os pilares
  barGrade: { estado: estadoKit('barGrade'), f: (m, c) => {
    const l = L(m, ori(c.estado));
    l.tab(0, 0, 0, 16, 2.5, 4, '#b4aea0', {});
    for (const y of [6.4, 18]) l.trilho(-8, y, 0, 16, 0.65, 5, '#3e3e4c', { ao: false });
    for (let k = 0; k < 6; k++) { const x = -6.4 + k * 2.56; l.cil(x, 2.5, 0, 0.55, 0.5, 20, 4, '#3e3e4c', { ao: false }); l.cone(x, 22, 0, 1.1, 2.8, 4, OURO, { ao: false }); }
    disco(m, ...(ori(c.estado) === 'v' ? [0, 12, -8] : [0, 12, -7.3]), 2.3, OURO);
    return t1(25);
  } },
};
void MalhaLG;
