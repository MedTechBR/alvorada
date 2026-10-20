import * as THREE from 'three';
import { cor as linear } from '../kit/construtor.js';
import { prim } from './modelos.js';
import { sombra } from './modelos-util.js';

// Modelos lisos do grupo "moveis" (estilo Let's Go): móveis do Centro Pokémon, do Mercado, das casas e do laboratório.
// Espelha src/visual3d/kit/moveis.js (mesma pegada, mesma altura, mesmas variantes): caixas de cantos suaves, degradê
// pé escuro -> topo claro, telas e luzes com brilho próprio leve. Origem = pé do móvel (meio da borda sul da pegada),
// x de -fw*8 a fw*8, z de -fh*16 a 0; o encosto/fundo dos móveis fica ao norte (z menor).

const t = (y, x0, x1, z0, z1) => ({ y, x0, x1, z0, z1 });
const G = (c, d = 0.11) => ({ pe: sombra(c, -d), topo: sombra(c, d * 0.55) });
const MAD = ['#6a4428', '#8e5c36', '#b07a4a', '#cf9a62'];
const MADC = ['#8a5e3a', '#aa7a4c', '#c8985e', '#e0b886'];
const ESC = '#3a3640', METAL = '#a6b0bc', METAL2 = '#cdd5de';
const PROD = ['#ec6a5a', '#f4cc56', '#62bc62', '#58a4ec', '#b684e6', '#ff9fd2', '#f69048', '#ffffff'];

// caixa de cantos suaves por cantos (x0,y0,z0)-(x1,y1,z1) como no kit; seg 0.5 = chanfro barato (~32 tris)
const B = (m, x0, y0, z0, x1, y1, z1, r, cr, o = {}) => m.caixa((x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, r, cr, { seg: 0.5, ...o });
// tábua/painel reto (12 tris): prateleiras, costas, produtos
const BOXG = () => prim('boxT', () => new THREE.BoxGeometry(1, 1, 1));
const T = (m, x0, y0, z0, x1, y1, z1, cr, o = {}) => m.add(BOXG(), { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0 }, cr, o);
// plano de frente (virado para o sul) e plano deitado (virado para cima): telas, portas, papéis
const PL = () => prim('plano', () => new THREE.PlaneGeometry(1, 1));
const Q = (m, x0, y0, x1, y1, z, cr, o = {}) => m.add(PL(), { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z, sx: x1 - x0, sy: y1 - y0 }, cr, { ao: false, ...o });
const H = (m, x0, z0, x1, z1, y, cr, o = {}) => m.add(PL(), { x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, sx: x1 - x0, sy: z1 - z0, rx: -Math.PI / 2 }, cr, { ao: false, ...o });
const DISCO = (n) => prim('disco' + n, () => new THREE.CircleGeometry(1, n));
// disco deitado (voltado para cima) e disco de frente (relógio, mostradores)
const D = (m, x, y, z, r, cr, o = {}) => m.add(DISCO(o.n ?? 8), { x, y, z, sx: r, sy: r * (o.achata ?? 1), sz: r, rx: -Math.PI / 2 }, cr, { ao: false, ...o });
const DF = (m, x, y, z, r, cr, o = {}) => m.add(DISCO(o.n ?? 10), { x, y, z, sx: r, sy: r, sz: r }, cr, { ao: false, ...o });

// Poké Bola lisa: calota vermelha, faixa escura, base branca (d:0 = 20 tris)
const bolaFn = (x, y, z, nx, ny) => (ny > 0.25 ? linear('#ec4a3e') : ny < -0.25 ? linear('#f8f8f6') : linear('#34343c'));
function pb(m, x, y, z, r = 2.4, cor, o = {}) {
  m.bola(x, y + r, z, r, r, r, cor ?? bolaFn, { d: o.d ?? 0, ao: false });
  if (o.botao) m.bola(x, y + r, z + r * 0.92, r * 0.34, r * 0.34, r * 0.2, '#ffffff', { d: 0, ao: false, brilho: -0.3 });
}
// tela com brilho próprio leve + reflexo
function tela(m, x0, y0, x1, y1, z, cr = '#6cd0f6') {
  Q(m, x0, y0, x1, y1, z, cr, { brilho: -0.55 });
  Q(m, x0 + 1, y1 - 2.2, x0 + (x1 - x0) * 0.45, y1 - 1, z + 0.05, sombra(cr, 0.16), { brilho: -0.8 });
}
// produtos coloridos numa prateleira: caixinhas e potes (n peças entre x0 e x1)
function prods(m, x0, x1, y, z, k, n = 5, alto = 6, potes = false) {
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const cr = PROD[(i * 3 + k) % PROD.length], h = alto - 1.2 + ((i * 5 + k) % 3) * 0.9, cx = x0 + w * (i + 0.5);
    if (potes && (i + k) % 3 === 1) m.cil(cx, y, z, w * 0.34, w * 0.34, h, 6, G(cr, 0.08), { aberto: false, ao: false });
    else T(m, cx - w * 0.38, y, z - 2.2, cx + w * 0.38, y + h, z + 2.2, G(cr, 0.08), { ao: false });
  }
}

// ---------------------------------------------------------------- sofás, poltrona e cadeiras (uma fábrica por orientação)
// orient: S = encosto ao norte olhando o sul (padrão), N = de costas para o jogador, L = encosto a oeste (olha leste), R = a leste.
// a = eixo da largura do móvel, f = eixo "para a frente" (do encosto ao assento)
const mapa = (orient, cx, cz) => ({
  P: (a, f) => (orient === 'S' ? [cx + a, cz + f] : orient === 'N' ? [cx - a, cz - f] : orient === 'L' ? [cx + f, cz + a] : [cx - f, cz - a]),
  lat: orient === 'L' || orient === 'R',
});
function sofaF({ w = 30, dep = 13, cor, almo, orient = 'S', enc = 21, br = 3, cx = 0, cz = -8 }) {
  return (m, c) => {
    const k = typeof cor === 'function' ? cor(c) : cor, al = typeof almo === 'function' ? almo(c) : almo;
    const { P, lat } = mapa(orient, cx, cz), W = w / 2, hd = dep / 2;
    const box = (a0, a1, f0, f1, y0, y1, r, cr, o) => { const [x, z] = P((a0 + a1) / 2, (f0 + f1) / 2); const sa = a1 - a0, sf = f1 - f0; m.caixa(x, y0, z, lat ? sf : sa, y1 - y0, lat ? sa : sf, r, cr, { seg: 0.5, ...o }); };
        box(-W, W, -hd, hd, 0, 9.5, 2.6, G(sombra(k, -0.05), 0.1));
    box(-W, W, -hd, -hd + 4.8, 5, enc, 2.4, G(k, 0.1), { ao: false });
    const n = Math.max(1, Math.round((w - 2 * br) / 13)), cw = (w - 2 * br) / n;
    for (let i = 0; i < n; i++) box(-W + br + cw * i + 0.3, -W + br + cw * (i + 1) - 0.3, -hd + 4.6, hd - 0.3, 8.6, 12, 1.7, G(sombra(k, 0.06), 0.12), { ao: false });
    for (const s of [-1, 1]) box(s > 0 ? W - br : -W, s > 0 ? W : -W + br, -hd, hd, 0, 14, 1.6, G(sombra(k, -0.03), 0.1));
    if (al) box(-W + br + 1.6, -W + br + 7.4, -hd + 4.8, -hd + 8, 10, 16, 1.4, G(al, 0.1), { ao: false });
    return lat ? t(10.5, -hd, hd, cz - W, cz + W) : t(10.5, -W, W, cz - hd, cz + hd);
  };
}
const SOFAS = ['#5c8cf0', '#62b062', '#d86a58'], ALMS = ['#f6d25c', '#f8f4ea', '#f6d25c'];
const sofaCasaF = (orient, enc = 21, almo = (c) => ALMS[c.v % 3]) => sofaF({ cor: (c) => SOFAS[c.v % 3], almo, orient, enc, cz: orient === 'L' || orient === 'R' ? -16 : -8 });

function cadeiraF(orient) {
  return (m) => {
    const { P, lat } = mapa(orient, 0, -8);
    const caixa = (a0, a1, f0, f1, y0, y1, r, cr) => { const [x, z] = P((a0 + a1) / 2, (f0 + f1) / 2); m.caixa(x, y0, z, lat ? f1 - f0 : a1 - a0, y1 - y0, lat ? a1 - a0 : f1 - f0, r, cr, { seg: 0.5 }); };
    for (const [a, f] of [[-4.6, -4], [4.6, -4], [-4.6, 4], [4.6, 4]]) { const [x, z] = P(a, f); m.cil(x, 0, z, 1, 0.8, 8.4, 6, G(MADC[0], 0.06)); }
    caixa(-6, 6, -5, 5, 8, 10.2, 1.8, G(MADC[3], 0.1));
    caixa(-6, 6, -5.6, -3.6, 10, 22, 1.4, G(MADC[1], 0.1));
    return t(10.2, -6, 6, -14, -2);
  };
}

// ---------------------------------------------------------------- balcões, armários e bancadas
const TAMPO = { pe: '#ece6e2', topo: '#ffffff' };
// balcão reto (troca, caixa): corpo em cor, tampo branco com beiral, faixa clara
function balcao(m, x0, x1, z0, z1, cor, faixa) {
  B(m, x0, 0, z0, x1, 18, z1, 2.4, G(cor, 0.12));
  B(m, x0 - 1.4, 17.4, z0 - 1.4, x1 + 1.4, 21, z1 + 1.4, 1.6, TAMPO, { ao: false });
  Q(m, x0 + 1, 10.4, x1 - 1, 13, z1 + 0.05, faixa);
}
function enfeitesBalcao(m) {
  m.cil(-30, 21, -4.5, 2.2, 1.4, 2.2, 8, G('#f4c84e', 0.1), { aberto: false, ao: false }); m.bola(-30, 23.4, -4.5, 0.9, 0.8, 0.9, '#ffe08a', { d: 0, ao: false });
  H(m, 11, -7.2, 17, -2.8, 21.3, '#f8f4ea'); H(m, 12.2, -6.6, 15.8, -5.4, 21.5, '#9a9aa4');
  m.cil(36, 21, -6, 1.8, 1.4, 3.6, 6, G('#9ad8ee', 0.1), { aberto: false, ao: false });
  m.bola(36, 26, -6, 2.1, 1.7, 2.1, '#ff9fd2', { d: 0, ao: false }); m.bola(35, 27.6, -5.5, 1.3, 1.3, 1.3, '#ffffff', { d: 0, ao: false });
}
function counterJoy(m, c) {
  const L = c.L, leg = L - 5.5, zF = -6, zB = -c.D + 1, cor = '#ec5a66';
  B(m, -leg - 5, 0, zF - 5, leg + 5, 18, zF + 5, 2.6, G(cor, 0.12));
  for (const s of [-1, 1]) {
    B(m, s > 0 ? leg - 5 : -leg - 5, 0, zB, s > 0 ? leg + 5 : -leg + 5, 18, zF, 2.6, G(cor, 0.12));
    B(m, s > 0 ? leg - 6.3 : -leg - 6.3, 17.4, zB - 0.3, s > 0 ? leg + 6.3 : -leg + 6.3, 21, zF, 1.6, TAMPO, { ao: false });
  }
  B(m, -leg - 6.3, 17.4, zF - 6.3, leg + 6.3, 21, zF + 6.3, 1.6, TAMPO, { ao: false });
  Q(m, -leg - 3, 10.4, leg + 3, 13, zF + 5.1, '#fff2f2');
  Q(m, -leg - 3, 0.2, leg + 3, 2.4, zF + 5.1, '#9a3a46');
  enfeitesBalcao(m);
  return t(21, -L, L, -c.D, 0);
}
const counterTroca = (m, c) => {
  const L = c.L - 1;
  balcao(m, -L, L, -11, -1, '#4a78e6', '#f2f6ff');
  T(m, -3.5, 21, -9, 3.5, 22.2, -4, METAL); B(m, -5.4, 22, -9, 5.4, 30, -7.2, 1.4, G(ESC, 0.1), { ao: false });
  tela(m, -4.3, 23.2, 4.3, 29, -7.1, '#82ecb8');
  pb(m, 10, 21, -6, 2.6); B(m, 8, 21, -8, 12, 23, -4, 0.8, G('#4a78e6'), { ao: false });
  return t(21, -L, L, -12, 0);
};
const cabo = (m, x0, x1, z0, z1, h, cor) => B(m, x0, 0, z0, x1, h, z1, 2.4, G(cor, 0.1));
const maquinaCura = (m) => {
  cabo(m, -15.5, 15.5, -15.5, -5, 17, '#f6f0ec');
  Q(m, -15.4, 9, 15.4, 11, -4.8, '#ec5a66'); Q(m, -13, 3, -1, 8, -4.85, '#ece0da'); Q(m, 1, 3, 13, 8, -4.85, '#ece0da');
  B(m, -14, 17, -15, 14, 22, -6, 2, G('#bccadc'), { ao: false });
  H(m, -12, -14, 6, -7, 22.1, '#5c6a7a');
  for (let i = 0; i < 6; i++) pb(m, -9 + (i % 3) * 6, 22.1, -12 + Math.floor(i / 3) * 4.2, 1.6);
  B(m, 7, 22, -15, 14, 38, -11.5, 2, G('#bccadc'), { ao: false });
  tela(m, 8, 25, 13, 36, -11.4, '#82ecb8');
  Q(m, 9.4, 30, 12.6, 31, -11.3, '#ffffff', { brilho: -1 }); Q(m, 10.5, 28.9, 11.5, 32.1, -11.3, '#ffffff', { brilho: -1 });
  m.bola(10.5, 39, -13, 1.6, 1.4, 1.6, '#ff6a6a', { d: 0, brilho: -0.9, ao: false });
  return t(22, -15.5, 15.5, -15.5, -5);
};
const armarioCentro = (m) => {
  cabo(m, -15.5, 15.5, -15.5, -6, 17, '#f6f0ec');
  Q(m, -13.5, 3, -1.5, 14, -5.9, '#ece0da'); Q(m, 1.5, 3, 13.5, 14, -5.9, '#ece0da');
  B(m, -15.5, 17, -15.5, 15.5, 44, -12, 2.2, G('#f8f2ee'), { ao: false });
  for (const [i, y] of [[0, 24], [1, 33]]) { T(m, -14.5, y - 0.8, -15, 14.5, y, -9, '#e6dad4', { ao: false }); prods(m, -13.5, 13.5, y, -11.5, i * 3 + 1, 5, 5.5); }
  B(m, -15.8, 40.6, -15.8, 15.8, 44.6, -11.4, 1.6, G('#ec5a66'), { ao: false });
  prods(m, -12, 12, 17, -9, 3, 4, 4.5);
  return t(17, -15.5, 15.5, -15.5, -6);
};
const caixaRot = (x, y, z) => prim(`cr${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z));
function escadaRolante(m, c) {
  const D2 = c.D, ang = Math.atan2(34, D2 - 2), Ln = Math.hypot(34, D2 - 2), cy = 22, cz = -D2 / 2;
  Q(m, -12, 30, 12, 62, -D2 + 0.3, '#2c2434');
  B(m, -14.5, 60, -D2, 14.5, 65, -D2 + 2.4, 1.6, G('#ec5a66'), { ao: false });
  m.add(caixaRot(20, 5, Ln), { x: 0, y: cy - 2, z: cz, rx: ang }, G('#66667a', 0.1), { ao: false });
  for (let i = 1; i <= 5; i++) { const f = i / 6; m.cil(-9.4, 20 + ((D2 - 2) * f - D2 / 2 + 0.5) * 34 / (D2 - 2) + 3.9, -(D2 - 2) * f - 0.5, 0.9, 0.9, 18.8, 6, '#f4cc56', { rz: -Math.PI / 2, ao: false }); }
  for (const s of [-1, 1]) {
    m.add(caixaRot(4, 7, Ln + 2), { x: s * 12, y: cy + 4, z: cz, rx: ang }, G(s < 0 ? '#d4d9e2' : '#c2c8d4', 0.08), { ao: false });
    m.add(caixaRot(4.6, 2.4, Ln + 2), { x: s * 12, y: cy + 9, z: cz, rx: ang }, '#34343e', { ao: false });
  }
  return t(44, -14, 14, -D2, 0);
}

// ---------------------------------------------------------------- Centro Pokémon: sala de espera
const mesaRevistas = (m) => {
  m.cil(0, 0, -8, 2, 1.7, 8, 8, G(METAL));
  m.cil(0, 0, -8, 5.2, 4, 1.4, 10, G(METAL), { aberto: false });
  m.cil(0, 7.9, -8, 7.4, 7.2, 1.8, 14, { pe: '#e8e4dc', topo: '#ffffff' }, { aberto: false, ao: false });
  H(m, -5.4, -11.4, -0.2, -6.4, 9.75, '#ec6a5a'); H(m, -4.7, -10.8, -0.9, -7.2, 9.9, '#ffffff');
  H(m, 0.6, -9.6, 5.6, -4.6, 9.8, '#58a4ec'); H(m, 1.2, -9, 5, -5.2, 9.95, '#f4cc56');
  return t(9.75, -7, 7, -15, -1);
};
function tvRack(m) {
  B(m, -15, 0, -14, 15, 9, -3, 2.2, G(MAD[1], 0.1));
  Q(m, -13.5, 1.8, -1, 7.6, -2.8, MAD[2]); Q(m, 1, 1.8, 13.5, 7.6, -2.8, MAD[2]);
  T(m, -4, 9, -10.5, 4, 10.4, -7.5, ESC);
  B(m, -13, 10, -10.6, 13, 27, -8.4, 1.8, G('#2c2a34', 0.06), { ao: false });
  Q(m, -11.8, 11.2, 11.8, 25.8, -8.25, '#62b6f4', { brilho: -0.6 });
  Q(m, -11.8, 11.2, 11.8, 16, -8.2, '#72d472', { brilho: -0.6 });
  Q(m, 3, 17.6, 9.4, 24, -8.15, '#fff4a8', { brilho: -0.9 });
  pb(m, -7, 15, -8.1, 3.1);
  return t(27, -15, 15, -14, -3);
}
const plantaGrande = (m) => {
  m.cil(0, 0, -8, 4.8, 6, 11, 9, { pe: '#d8d2c6', topo: '#f2eee6' }, { aberto: false });
  m.cil(0, 9.4, -8, 6.5, 6.4, 2.4, 9, G('#c6c0b4'), { aberto: false, ao: false });
  m.cil(0, 11, -8, 0.9, 0.7, 9, 5, '#5a8a34', { ao: false });
  const F = [[0, 22, -8, 9, 7, '#35a04c'], [-6, 18, -6, 6.5, 5, '#42b457'], [6, 19, -9, 6.5, 5, '#42b457'], [-3, 28, -10, 6, 5, '#52c862'], [4, 27, -5, 6, 5, '#52c862'], [0, 33, -8, 5, 4.4, '#72dc72'], [-7, 24, -10, 4.4, 4.2, '#35a04c'], [7, 25, -6, 4.4, 4.2, '#35a04c']];
  for (const [x, y, z, r, h, cr] of F) m.bola(x, y, z, r, h, r * 0.9, { pe: sombra(cr, -0.1), topo: sombra(cr, 0.08) }, { d: 0, ao: false });
  return t(37, -7, 7, -15, -1);
};

// ---------------------------------------------------------------- Mercado
const counterLoja = (m, c) => {
  const L = c.L - 0.5;
  balcao(m, -L, L, -11, -1, '#4a88f0', '#ffffff');
  const rx = L - 9;
  B(m, rx - 6, 21, -10, rx + 6, 26, -2, 1.8, G('#6a7284'), { ao: false });
  B(m, rx - 3.6, 26, -10.2, rx + 3.6, 32, -8.8, 1.2, G('#3e4456'), { ao: false });
  tela(m, rx - 2.7, 27, rx + 2.7, 31, -8.65, '#82ecb8');
  for (let j = 0; j < 4; j++) H(m, rx - 4.6 + j * 2.4, -7.2, rx - 3.2 + j * 2.4, -5.6, 26.1, j === 3 ? '#ec6a5a' : '#eceef2');
  H(m, rx - 4.6, -4.8, rx + 4.6, -3.2, 26.1, '#eceef2');
  B(m, -L + 5, 21, -9, -L + 14, 24.5, -3, 1.6, G('#f4cc56'), { ao: false });
  for (let i = 0; i < 3; i++) m.bola(-L + 7.4 + i * 2.8, 25, -6, 1.4, 1.2, 1.4, PROD[i], { d: 0, ao: false });
  B(m, -6, 21, -9.5, 3, 23.2, -4, 1, G('#f6f0e6'), { ao: false });
  return t(21, -L, L, -12, 0);
};
const prateleiraParede = (m, c) => {
  const L = c.L - 0.5;
  T(m, -L, 0, -15.8, L, 46, -14.2, '#e6edf6', { ao: false });
  B(m, -L, 0, -14.4, L, 8, -8.5, 1.8, { pe: '#3c78e0', topo: '#f2f6fb' });
  for (const [i, y] of [[0, 18], [1, 28], [2, 38]]) { T(m, -L, y - 1, -14.4, L, y, -9, '#d0d9e4', { ao: false }); prods(m, -L + 1, L - 1, y, -11.7, i * 5 + 1, 5, 7); }
  for (const x of [-L, L - 1.4]) T(m, x, 8, -14.4, x + 1.4, 46, -9, '#3c78e0', { ao: false });
  B(m, -L, 44, -14.4, L, 46.6, -8.6, 1, G('#3c78e0'), { ao: false });
  return t(8, -L, L, -16, -8.5);
};
const vitrineFria = (m, c) => {
  const L = c.L - 0.5, hi = L - 2;
  T(m, -L, 6, -15.6, L, 44, -14.4, '#d4eeff', { brilho: -0.3, ao: false });
  for (const s of [-1, 1]) T(m, s > 0 ? L - 1.6 : -L, 0, -15.8, s > 0 ? L : -L + 1.6, 50, -3, G('#f4f6fa'));
  B(m, -L, 0, -15.8, L, 6, -2.4, 1.6, G('#c6d0da'));
  B(m, -L - 0.2, 44, -15.8, L + 0.2, 50.4, -1.8, 1.8, G('#f4f6fa'), { ao: false });
  Q(m, -L + 0.5, 45, L - 0.5, 49.4, -1.75, '#4a88f0', { brilho: -0.2 });
  Q(m, -L + 4.5, 46.4, L - 4.5, 48, -1.7, '#ffffff', { brilho: -0.9 });
  for (const [i, y] of [[0, 6.4], [1, 16], [2, 25.6], [3, 35]]) {
    T(m, -hi, y - 0.8, -14.4, hi, y, -3.2, '#b6c8d6', { ao: false });
    if (i < 3) for (let j = 0; j < 5; j++) { const cr = ['#62bc62', '#f69048', '#58a4ec', '#ec6a5a', '#b684e6', '#f4cc56'][(j + i * 2) % 6], cx = -hi + 3.4 + j * ((2 * hi - 6.8) / 4), alto = j % 2 ? 6 : 7.6; T(m, cx - 1.6, y, -9, cx + 1.6, y + alto, -5, G(cr, 0.07), { ao: false }); }
  }
  T(m, -0.8, 6, -3.6, 0.8, 44, -2.4, '#d0d8e0', { ao: false });
  Q(m, -L + 3.4, 10, -L + 5.6, 40, -2.3, '#ffffff', { brilho: -0.5 });
  return t(50, -L, L, -16, -3);
};
const gondola = (n) => (m, c) => {
  const L = c.L - 1, z0 = -13, z1 = -3, zm = (z0 + z1) / 2;
  B(m, -L, 0, z0, L, 5, z1, 2, G('#3a70d8'));
  T(m, -L + 1, 4, zm - 0.6, L - 1, 32, zm + 0.6, '#f0f4f8', { ao: false });
  for (const x of [-L, L - 2.4]) B(m, x, 0, z0, x + 2.4, 35, z1, 1.2, G('#4a88f0'), { ao: false });
  for (const [i, y] of [[0, 5], [1, 14], [2, 23]]) {
    if (i) T(m, -L + 2, y - 0.8, zm + 0.6, L - 2, y, z1, '#d8e0e8', { ao: false });
    prods(m, -L + 3, L - 3, y, zm + 3.6, i * 4 + n, n, 7);
    if (i) Q(m, -L + 2, y - 3, L - 2, y - 0.8, z1 + 0.05, i % 2 ? '#f4cc56' : '#ffffff');
  }
  B(m, -L, 34.6, zm - 1.6, L, 40, zm + 1.6, 1.8, G('#ec6a5a'), { ao: false });
  Q(m, -L + 2, 35.8, L - 2, 38.8, zm + 1.7, '#ffffff', { brilho: -0.2 });
  return t(40, -L, L, z0, z1);
};
const expositor = (m, c) => {
  const L = c.L - 1.5;
  B(m, -L, 0, -13, L, 12, -3, 2.4, { pe: '#e85a68', topo: '#fafcfd' });
  Q(m, -L + 1, 5, L - 1, 7, -2.7, '#ffffff');
  for (const x of [-8, -2.7, 2.7, 8]) pb(m, x, 12, -6, 2.4);
  for (const x of [-5.4, 0, 5.4]) pb(m, x, 16.2, -9, 2.4, '#3c78e0');
  B(m, L - 7, 12, -11.8, L - 1, 21, -10.8, 1, G('#f4cc56'), { ao: false });
  Q(m, L - 6.3, 13.2, L - 1.7, 19.6, -10.7, '#ec6a5a', { brilho: -0.2 });
  return t(12, -L, L, -13, -3);
};
const cestas = (m) => {
  for (let i = 0; i < 4; i++) m.cil(0, i * 3.2, -8, 5.7, 6.7, 3.4, 10, { pe: '#d23e3e', topo: '#f2685a' }, { aberto: false, achata: 0.72, ao: false });
  D(m, 0, 12.9, -8, 5.4, '#8a2a2a', { n: 10, achata: 0.7 });
  T(m, -5.6, 13, -8.7, -4.6, 17, -7.3, ESC); T(m, 4.6, 13, -8.7, 5.6, 17, -7.3, ESC); T(m, -5.6, 17, -8.7, 5.6, 18, -7.3, ESC);
  return t(13, -6, 6, -12, -4);
};

// ---------------------------------------------------------------- casas
const tvConsole = (m) => {
  B(m, -15, 0, -14, 15, 9, -3, 2.2, G(MADC[1], 0.1));
  Q(m, -13.5, 1.8, -1.5, 7.6, -2.8, MADC[2]);
  B(m, -12, 9, -13, 6, 25, -4.5, 2.4, G('#4a4854', 0.08), { ao: false });
  Q(m, -10.4, 11, 4.4, 22.6, -4.3, '#6cbcf4', { brilho: -0.55 });
  Q(m, -10.4, 11, 4.4, 15, -4.25, '#62cc62', { brilho: -0.55 });
  Q(m, -6, 15.4, -2, 19.4, -4.2, '#f4cc56', { brilho: -0.9 });
  m.cil(-9, 25, -9, 0.4, 0.4, 5, 4, '#6a6a74', { rz: 0.3, ao: false }); m.cil(-5.5, 25, -9, 0.4, 0.4, 4, 4, '#6a6a74', { rz: -0.35, ao: false });
  B(m, 7, 9, -12, 14.4, 12.4, -5, 1.6, G('#c4c0d8'), { ao: false });
  Q(m, 8.4, 9.8, 13, 11, -4.9, '#7a7890');
  H(m, 8.4, -9.2, 9.8, -7.8, 12.55, '#ec6a5a'); H(m, 11.2, -9.2, 12.6, -7.8, 12.55, '#58a4ec');
  B(m, 5, 0, -3.4, 11, 1.8, -0.4, 0.8, G('#c4c0d8'), { ao: false });
  return t(25, -15, 15, -14, -2);
};
const mesaJantar = (m) => {
  for (const [x, z] of [[-13, -12], [13, -12], [-13, -3.4], [13, -3.4]]) m.cil(x, 0, z, 1.3, 1, 13, 6, G(MADC[0], 0.06));
  B(m, -15, 12.6, -14.2, 15, 15, -1.2, 1.6, G(MADC[2], 0.1), { ao: false });
  B(m, -14, 14.8, -13.4, 14, 15.6, -2, 0.4, G('#f6f0e4', 0.04), { ao: false });
  for (let i = 0; i < 4; i++) H(m, -13.6 + i * 7, -13.2, -11.8 + i * 7, -2.2, 15.7, '#ec6a5a');
  H(m, -13.8, -9, 13.8, -7.6, 15.72, '#ec6a5a');
  Q(m, -13.6, 11.4, 13.6, 15.2, -1.15, '#f6f0e4');
  for (const x of [-9.5, 9.5]) { D(m, x, 15.8, -7.5, 3.2, '#ffffff', { n: 10 }); D(m, x, 15.85, -7.5, 1.8, '#f4cc56', { n: 8 }); }
  m.cil(0, 15.6, -8, 3, 3.8, 2, 9, G('#b88450'), { aberto: false, ao: false });
  for (const [x, z, cr] of [[-1.2, -8.6, '#ec6a5a'], [1.4, -7.4, '#f4cc56'], [0, -9.4, '#62bc62']]) m.bola(x, 18.2, z, 1.7, 1.5, 1.7, cr, { d: 0, ao: false });
  return t(15.6, -15, 15, -14.2, -1.2);
};
const pia = (m) => {
  cabo(m, -15.5, 15.5, -15.5, -4, 17, '#f6f0e4');
  Q(m, -13.6, 2, -1.4, 14, -3.9, '#eadfca'); Q(m, 1.4, 2, 13.6, 14, -3.9, '#eadfca');
  Q(m, -2.6, 8, -1.8, 11, -3.8, '#8c8c96'); Q(m, 1.8, 8, 2.6, 11, -3.8, '#8c8c96');
  B(m, -16, 17, -16, 16, 19.4, -2.8, 1, G('#c4ccd4'), { ao: false });
  B(m, -10, 18.8, -13.4, 2, 19.6, -5.6, 1.2, G('#7a8694', 0.05), { ao: false });
  m.cil(-4, 19.4, -14, 0.9, 0.9, 6.4, 6, G(METAL2), { ao: false }); T(m, -4.8, 25, -14.9, -3.2, 25.9, -10.6, METAL2);
  m.cil(8, 19.4, -9, 2.5, 2.8, 3.6, 9, G('#e0605a'), { aberto: false, ao: false });
  B(m, -15.5, 34, -16, 15.5, 48, -10, 2, G('#f6f0e4'), { ao: false });
  for (const x of [-15, -5, 5]) { Q(m, x + 1, 35.4, x + 9, 46.6, -9.85, '#eadfca'); Q(m, x + 4, 36.8, x + 6, 37.6, -9.8, '#8c8c96'); }
  return t(19, -16, 16, -16, -3);
};
const fogaoMod = (m) => {
  B(m, -7.8, 0, -15.5, 7.8, 17, -4, 2.2, G('#f6f6f6'));
  Q(m, -6, 3, 6, 12.4, -3.9, '#34343c'); Q(m, -4.5, 4.8, 4.5, 10, -3.85, '#ff9e50', { brilho: -0.4 });
  T(m, -6, 13, -4.6, 6, 14, -3.2, METAL);
  B(m, -8, 17, -16, 8, 18.4, -3.4, 1, G('#3e3e46'), { ao: false });
  for (const [x, z] of [[-3.5, -12.5], [3.5, -12.5], [-3.5, -7], [3.5, -7]]) D(m, x, 18.5, z, 2.4, '#1c1c22', { n: 8 });
  m.cil(3.5, 18.4, -7, 2.8, 2.5, 3.6, 8, G('#d86a58'), { aberto: false, ao: false });
  B(m, -8, 18, -16, 8, 23.4, -14.4, 1.2, G('#f6f6f6'), { ao: false });
  for (let i = 0; i < 4; i++) Q(m, -5.6 + i * 3.4, 19.8, -4.4 + i * 3.4, 21.6, -14.2, '#5c5c64');
  return t(18, -8, 8, -16, -3.4);
};
const geladeira = (m) => {
  B(m, -7.6, 0, -15.5, 7.6, 46, -4, 3, G('#f4f6f8'));
  T(m, -7.7, 30, -4.1, 7.7, 30.8, -3.5, '#c8d0d8', { ao: false });
  T(m, 4.4, 34, -4, 5.4, 42, -3.3, METAL); T(m, 4.4, 19, -4, 5.4, 27, -3.3, METAL);
  Q(m, -6, 36, -1, 41, -3.45, '#f4cc56'); Q(m, -5.5, 37, -1.5, 40, -3.4, '#ec6a5a'); Q(m, -6, 8, -2, 13, -3.45, '#ffffff');
  m.cil(-2, 46, -10, 2.5, 2.3, 3, 8, G('#d2ae7c'), { aberto: false, ao: false }); D(m, -2, 49.1, -10, 2.3, '#ec6a5a', { n: 8 });
  return t(46, -7.6, 7.6, -15.5, -4);
};
const estanteAlta = (m, c) => {
  const L = c.L - 0.6, h = 46, z0 = -15.6, z1 = -6, cr = c.v ? MAD[1] : MADC[0];
  T(m, -L, 0, z0, L, h, z0 + 0.8, sombra(cr, -0.1), { ao: false });
  for (const x of [-L, L - 1.5]) T(m, x, 0, z0, x + 1.5, h, z1 + 0.4, G(cr, 0.1), { ao: false });
  B(m, -L, h - 1.6, z0, L, h + 0.6, z1 + 0.8, 0.9, G(sombra(cr, 0.05), 0.1), { ao: false });
  T(m, -L, 0, z1 - 4, L, 2.2, z1 + 0.4, sombra(cr, -0.06), { ao: false });
  for (let i = 0; i < 4; i++) {
    const y = 1.6 + i * 11;
    if (i) T(m, -L + 1.2, y, z0, L - 1.2, y + 1.1, z1, sombra(cr, 0.1), { ao: false });
    let x = -L + 1.7, k = i * 3 + c.v * 5;
    for (let b = 0; b < 4; b++) {
      const bw = 1.8 + ((k * 7) % 3) * 0.4, bh = 6.4 + ((k * 5) % 4) * 0.9, cl = ['#ec6a5a', '#58a4ec', '#f4cc56', '#62bc62', '#8a6ae0', '#f6f0e4', '#e07a3a'][k % 7];
      T(m, x, y + 1.1, z1 - 7.4, x + bw, y + 1.1 + bh, z1 - 1.2, G(cl, 0.08), { ao: false }); x += bw + 0.35; k++;
    }
  }
  return t(h, -L, L, z0, z1);
};
const criado = (m) => {
  B(m, -6, 0, -14, 6, 11, -4, 2, G(MADC[1], 0.1));
  Q(m, -5, 2, 5, 9, -3.9, MADC[2]); m.bola(0, 5.2, -3.8, 0.9, 0.9, 0.5, '#f4cc56', { d: 0, ao: false });
  m.cil(-1, 11, -9, 1.9, 1.5, 4.2, 7, G('#eae2d0'), { aberto: false, ao: false });
  m.cil(-1, 15, -9, 4.3, 2.8, 5, 9, { pe: '#fff0b4', topo: '#fff8d8' }, { aberto: false, ao: false, brilho: -0.5 });
  T(m, 2, 11, -9, 6, 12, -5.4, '#58a4ec', { ao: false });
  return t(11, -6, 6, -14, -4);
};
const piano = (m) => {
  B(m, -15, 0, -15.5, 15, 30, -8, 2.6, G('#322a32', 0.08));
  B(m, -15, 11, -9, 15, 15, -2.4, 1.6, G('#322a32', 0.08), { ao: false });
  H(m, -13.6, -6.6, 13.6, -2.8, 15.2, '#f8f8f4');
  for (let i = 0; i < 12; i++) if (i % 7 !== 2 && i % 7 !== 6) T(m, -12.4 + i * 2.2, 15.2, -6.4, -11.2 + i * 2.2, 15.9, -3.6, '#1c181c', { ao: false });
  for (const x of [-13.4, 11.4]) B(m, x, 0, -5, x + 2, 11, -3, 0.8, G('#322a32', 0.08));
  Q(m, -6, 15.6, 6, 22, -7.95, '#f6f0e4');
  m.cil(9, 30, -12, 1.8, 1.4, 3, 6, G('#f4cc56'), { aberto: false, ao: false }); m.bola(9, 35, -12, 2.4, 2.2, 2.2, '#ec6a5a', { d: 0, ao: false });
  return t(30, -15, 15, -15.5, -2.4);
};
const aquario = (m) => {
  B(m, -7.6, 0, -14, 7.6, 12, -3, 2, G(MAD[1], 0.1));
  B(m, -7.2, 12, -13, 7.2, 25, -3.4, 1.8, { pe: '#2e86d0', topo: '#7ac4f2' }, { ao: false, brilho: -0.3 });
  B(m, -7.5, 24.6, -13.2, 7.5, 26.4, -3.2, 0.8, G('#34343c'), { ao: false });
  T(m, -7, 12, -4.2, 7, 13.2, -3.4, '#ecdcae', { ao: false });
  for (const [x, y, cr] of [[-2.6, 17.5, '#f69048'], [3, 20.6, '#f4cc56']]) {
    m.bola(x, y, -3.2, 1.7, 1.0, 0.6, cr, { d: 0, ao: false, brilho: -0.4 }); m.bola(x + 2, y, -3.2, 0.9, 1, 0.4, cr, { d: 0, ao: false, brilho: -0.4 });
  }
  for (const x of [-5.4, 5.2]) m.bola(x, 15.4, -3.3, 0.7, 2.6, 0.5, '#42b457', { d: 0, ao: false });
  Q(m, -6, 18, -4.8, 23.6, -3.15, '#ffffff', { brilho: -0.5 });
  return t(26.4, -7.6, 7.6, -14, -3);
};
const relogioPe = (m) => {
  B(m, -6, 0, -14, 6, 8, -6, 2, G(MAD[1], 0.1));
  B(m, -5, 7.4, -13.4, 5, 34, -7, 1.8, G(MAD[2], 0.1), { ao: false });
  Q(m, -3.5, 12, 3.5, 28, -6.85, '#3c2a1e');
  T(m, -0.3, 14, -6.9, 0.3, 24, -6.5, '#e8b83e'); DF(m, 0, 14.6, -6.4, 2.3, '#f4cc56', { n: 8, brilho: -0.2 });
  B(m, -6, 33.6, -14, 6, 44, -6, 1.4, G(MAD[1], 0.1), { ao: false });
  DF(m, 0, 39, -5.8, 4.3, '#faf4e6', { n: 12 });
  T(m, -0.3, 39, -5.75, 0.3, 42, -5.65, ESC, { ao: false }); T(m, 0, 38.7, -5.75, 2.6, 39.3, -5.65, ESC, { ao: false });
  return t(44, -6, 6, -14, -6);
};
const lareira = (m) => {
  B(m, -15.5, 0, -15.8, 15.5, 30, -6, 2.4, G('#b8644a', 0.1), { var: 0.05 });
  for (const y of [8, 17, 25]) T(m, -15.3, y, -6.2, 15.3, y + 0.6, -5.8, '#d89878', { ao: false });
  Q(m, -8, 0.6, 8, 15.2, -5.7, '#241a18');
  m.bola(-2, 4, -5.4, 3.2, 4.4, 1, '#ff9e3e', { d: 0, brilho: -0.9, ao: false }); m.bola(2.6, 3.4, -5.3, 2.6, 3.6, 1, '#ffd264', { d: 0, brilho: -0.9, ao: false }); m.bola(0, 5.6, -5.2, 1.6, 3, 0.8, '#fff2a8', { d: 0, brilho: -1, ao: false });
  B(m, -17.4, 30, -16, 17.4, 32.8, -4.4, 1.4, G(MAD[2], 0.1), { ao: false });
  m.cil(-10, 32.8, -10, 1.6, 1.4, 4, 6, G('#f6f0e4'), { aberto: false, ao: false }); m.bola(-10, 37.2, -10, 0.7, 1, 0.7, '#ffd264', { d: 0, brilho: -0.9, ao: false });
  B(m, 5.4, 32.8, -10.6, 11.4, 38.6, -9.4, 0.6, G('#d8aa50'), { ao: false });
  return t(32.8, -17, 17, -16, -4.4);
};
const mesaCentroCasa = (m) => {
  for (const [x, z] of [[-12, -12], [12, -12], [-12, -4], [12, -4]]) m.cil(x, 0, z, 1.2, 1, 6.4, 6, G(MADC[0], 0.06));
  B(m, -14, 6, -14, 14, 8.6, -2, 1.4, G(MADC[2], 0.1), { ao: false });
  H(m, -8.4, -11.6, -1.2, -5.4, 8.75, '#ec6a5a'); H(m, -7.4, -10.8, -2, -6.2, 8.9, '#ffffff');
  m.cil(6, 8.6, -8, 1.8, 1.5, 2.6, 8, G('#f6f0e4'), { aberto: false, ao: false });
  return t(8.6, -14, 14, -14, -2);
};

// ---------------------------------------------------------------- laboratório
const maquinaLab = (m, c) => {
  const L = c.L - 0.5, cr = c.v ? '#bccad8' : '#cdd1da';
  B(m, -L, 0, -15.8, L, 50, -5, 2.6, G(cr, 0.1));
  T(m, -L, 0, -5, L, 4, -4.3, '#66727e', { ao: false });
  tela(m, -L + 3, 26, 0, 44, -4.8, c.v ? '#82ecb8' : '#82c8f6');
  for (let i = 0; i < 6; i++) Q(m, 3 + (i % 3) * 4, 40 - Math.floor(i / 3) * 4, 5 + (i % 3) * 4, 42 - Math.floor(i / 3) * 4, -4.75, ['#ff6666', '#62ff82', '#ffd45c'][(i + c.v) % 3], { brilho: -0.9 });
  for (const x of [5, 11]) { DF(m, x, 28, -4.7, 2.8, '#faf8f2', { n: 10 }); T(m, x, 27.8, -4.65, x + 2.4, 28.5, -4.55, ESC, { ao: false }); }
  B(m, -L + 3, 8, -5, L - 3, 20, -4.5, 1.2, G(sombra(cr, -0.1)), { ao: false });
  for (let i = 0; i < 4; i++) Q(m, -L + 6 + i * ((2 * L - 14) / 3), 13.2, -L + 9 + i * ((2 * L - 14) / 3), 15, -4.45, '#444e5a');
  m.cil(L - 5, 50, -11, 1.4, 1.2, 6, 6, G('#8894a0'), { ao: false }); m.bola(L - 5, 57, -11, 2.2, 2, 2.2, '#ff6666', { d: 0, brilho: -0.9, ao: false });
  return t(50, -L, L, -16, -4.3);
};
const computadorLab = (m, c) => {
  const L = c.L - 0.6;
  B(m, -L, 12.8, -15, L, 15, -3, 1.4, { pe: '#dfe4ea', topo: '#f8fafc' }, { ao: false });
  for (const x of [-L + 1, L - 3]) B(m, x, 0, -14, x + 2, 13, -4, 0.8, G(METAL));
  B(m, L - 10.5, 0, -14, L - 3.5, 12.4, -5, 1.6, G('#66727e'));
  Q(m, L - 8.4, 7.4, L - 5.6, 8.4, -4.9, '#62ff82', { brilho: -0.9 });
  for (const x of [-9, 6]) {
    T(m, x - 1.5, 15, -11.6, x + 1.5, 17.4, -9.6, ESC);
    B(m, x - 7, 17, -12.2, x + 7, 28, -10.4, 1.6, G('#33313a', 0.06), { ao: false });
    Q(m, x - 6, 18.2, x + 6, 26.8, -10.25, x < 0 ? '#7ac8f8' : '#82ecb8', { brilho: -0.55 });
  }
  T(m, -8, 15, -8, 4, 15.7, -5, '#3e3e48', { ao: false }); T(m, 8, 15, -7, 10.6, 15.9, -4, '#3e3e48', { ao: false });
  return t(15, -L, L, -15, -3);
};
const mesaPapeis = (m, c) => {
  const L = c.L - 0.6;
  B(m, -L, 0, -15, L, 14, -3, 2, G('#e6ebf0'));
  Q(m, -L + 1.5, 2, -0.8, 12, -2.85, '#d6dce4'); Q(m, 0.8, 2, L - 1.5, 12, -2.85, '#d6dce4');
  for (let i = 0; i < 3; i++) H(m, -L + 3 + i * 0.7, -12 + i * 0.5, -L + 12 + i * 0.7, -5 + i * 0.3, 14.1 + i * 0.4, i % 2 ? '#f6f0e4' : '#ffffff');
  H(m, -L + 4.5, -9.5, -L + 10, -8.6, 15.5, '#66727e');
  B(m, -0.4, 14, -11.4, 4.4, 15.8, -6.6, 0.8, G(ESC), { ao: false });
  m.cil(2, 15.5, -9.6, 0.8, 0.8, 8, 5, G('#3e3e48'), { ao: false }); B(m, 0.6, 21, -11, 3.4, 24.4, -6.6, 1.2, G('#3e3e48'), { ao: false });
  for (const [x, cr] of [[L - 8, '#62bc62'], [L - 3.6, '#58a4ec']]) {
    m.cil(x, 14, -8, 2, 2, 2.8, 8, G(cr, 0.08), { aberto: false, ao: false, brilho: -0.3 }); m.cil(x, 16.8, -8, 0.9, 0.9, 3, 6, '#e2eaf0', { aberto: false, ao: false });
  }
  return t(14, -L, L, -15, -3);
};
const tanque = (m) => {
  m.cil(0, 0, -8, 6.6, 6.2, 5, 11, G('#8894a0'), { aberto: false });
  m.cil(0, 5, -8, 5.6, 5.6, 26, 11, { pe: '#3ec890', topo: '#78eab4' }, { brilho: -0.45, ao: false });
  m.bola(0, 15, -8, 2.6, 4.4, 2.2, '#2e8a62', { d: 0, ao: false });
  for (const [x, y] of [[-2.4, 11], [2.2, 19], [-1.2, 25]]) m.bola(x, y, -3.5, 0.9, 0.9, 0.5, '#e8fff4', { d: 0, ao: false, brilho: -0.9 });
  Q(m, -4.2, 8, -3.2, 28, -2.8, '#ffffff', { brilho: -0.6 });
  m.cil(0, 31, -8, 5.7, 6.6, 4, 11, G('#8894a0'), { aberto: false, ao: false });
  T(m, -1, 34, -9, 1, 38, -7, '#66727e', { ao: false });
  Q(m, 3, 2, 5, 3.6, -1.7, '#ff6666', { brilho: -0.9 });
  return t(38, -6.6, 6.6, -14.6, -1.4);
};

export const TIPOS_MOVEIS = {
  counterJoy: { f: counterJoy },
  counterTroca: { f: counterTroca },
  maquinaCura: { f: maquinaCura },
  armarioCentro: { f: armarioCentro },
  escadaRolante: { f: escadaRolante },
  sofaCentro: { f: sofaF({ cor: '#ee6a86', almo: '#ffffff' }) },
  sofaCentroN: { f: sofaF({ cor: '#ee6a86', orient: 'N', enc: 16 }) },
  sofaLadoL: { f: sofaF({ cor: '#ee6a86', orient: 'L', cz: -16 }) },
  sofaLadoR: { f: sofaF({ cor: '#ee6a86', orient: 'R', cz: -16 }) },
  mesaRevistas: { f: mesaRevistas },
  tvRack: { f: tvRack },
  plantaGrande: { f: plantaGrande },
  counterLoja: { f: counterLoja },
  prateleiraParede: { f: prateleiraParede },
  vitrineFria: { f: vitrineFria },
  gondola: { f: gondola(4) },
  expositor: { f: expositor },
  cestas: { f: cestas },
  tvConsole: { f: tvConsole },
  sofaCasa: { f: sofaCasaF('S'), var: 3 },
  sofaCasaN: { f: sofaCasaF('N', 16, null), var: 3 },
  sofaCasaLadoR: { f: sofaCasaF('R', 21, () => '#f8f4ea'), var: 3 },
  sofaCasaLadoL: { f: sofaCasaF('L', 21, () => '#f8f4ea'), var: 3 },
  poltronaCasa: { f: sofaF({ w: 15, dep: 12, cor: (c) => ['#d8685a', '#5c8cf0', '#e0aa44'][c.v % 3], br: 2.6 }), var: 3 },
  mesaJantar: { f: mesaJantar },
  cadeiraL: { f: cadeiraF('L') },
  cadeiraR: { f: cadeiraF('R') },
  pia: { f: pia },
  fogaoMod: { f: fogaoMod },
  geladeira: { f: geladeira },
  estanteAlta: { f: estanteAlta, var: 2 },
  criado: { f: criado },
  piano: { f: piano },
  aquario: { f: aquario },
  relogioPe: { f: relogioPe },
  lareira: { f: lareira },
  mesaCentroCasa: { f: mesaCentroCasa },
  maquinaLab: { f: maquinaLab, var: 2 },
  computadorLab: { f: computadorLab },
  mesaPapeis: { f: mesaPapeis },
  tanque: { f: tanque },
};
