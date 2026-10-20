import * as THREE from 'three';
import { caixaR, prim, RODAPE, portaX, clarear } from './modelos.js';
import { torno, piramide, segmento } from './modelos-util.js';
import { cor as linear } from '../kit/construtor.js';

// Modelos lisos do grupo "predios" (estilo Let's Go): os prédios que faltavam de cada cidade.
// Mesma pegada, mesma coluna de porta (portaX) e mesma ideia do kit voxel (src/visual3d/kit/predios.js).
// Peças pequenas (janelas, tábuas, vigas) usam caixas planas (BOXG) e planos (PLANO) para gastar poucos triângulos;
// as massas grandes (paredes, telhados, laje) usam caixas de cantos arredondados com 1 segmento.

const BOXG = prim('pb-caixa', () => new THREE.BoxGeometry(1, 1, 1));
const PLANO = prim('pb-plano', () => new THREE.PlaneGeometry(1, 1));
// caixa plana (x, z = centro; y = pé) e plano virado para o sul
const cai = (m, x, y, z, w, h, d, cr, o = {}) => m.add(BOXG, { x, y: y + h / 2, z, sx: w, sy: h, sz: d, rx: o.rx, ry: o.ry, rz: o.rz }, cr, o);
const pla = (m, x, y, z, w, h, cr, o = {}) => m.add(PLANO, { x, y: y + h / 2, z, sx: w, sy: h }, cr, { todas: true, ao: false, ...o });
// disco liso vertical (relógio, rosácea, vidro redondo): esfera achatada em z
const disco = (m, x, y, z, r, cr, o = {}) => m.bola(x, y, z, r, r, o.e ?? 1.2, cr, { d: o.d ?? 1, ao: false, ...o });
const SEG = (m, a, b, r, cr, o = {}) => segmento(m, a, b, r, r, o.n ?? 5, cr, { ao: false, ...o });

// ---------- peças ----------
// janela: moldura clara, vidro (acende à noite), cruz e peitoril; x = centro, y = pé, z = plano da parede
function janP(m, x, y, z, w = 16, h = 14, o = {}) {
  const marco = o.marco ?? '#fff8ea', luz = o.luz ?? 1;
  cai(m, x, y - 2, z + 0.5, w + 4, h + 4, 1.6, marco, { ao: false });
  cai(m, x, y, z + 1.4, w, h, 0.8, o.vidro ?? '#bfe6ff', { ao: false, brilho: luz });
  if (o.cruz !== false) { cai(m, x, y, z + 2, 1.4, h, 0.6, marco, { ao: false }); cai(m, x, y + h / 2 - 0.7, z + 2, w, 1.4, 0.6, marco, { ao: false }); }
  if (o.peitoril) cai(m, x, y - 4, z + 2.2, w + 6, 2.6, 4, o.peitoril, { ao: false });
}
// porta com degrau; 'madeira' ou 'vidro'; px = coluna da porta
function portaP(m, px, zf, o = {}) {
  const dw = o.dw ?? 18, dh = o.dh ?? 28;
  m.caixa(px, 0, zf + 2.2, dw + 10, 2.6, 8, 1.2, o.degrau ?? '#ddd2bc', { seg: 1 });
  if (o.tipo === 'vidro') {
    m.caixa(px, 2, zf + 0.6, dw + 4, dh + 2, 2.4, 2, o.batente ?? '#5a6878', { seg: 1, ao: false });
    cai(m, px, 2.4, zf + 1.9, dw, dh - 0.5, 0.8, o.vidro ?? '#9ad8f4', { ao: false, brilho: 0.8 });
    cai(m, px, 2.4, zf + 2.4, 1.6, dh - 0.5, 0.6, o.batente ?? '#5a6878', { ao: false });
    cai(m, px - dw / 4, 8, zf + 2.4, 1.6, dh - 12, 0.5, '#e8f8ff', { ao: false, brilho: 0.8 });
  } else {
    m.caixa(px, 2, zf + 0.6, dw, dh, 2.6, 2.4, { pe: o.cor0 ?? '#6a4228', topo: o.cor1 ?? '#9a6a40' }, { seg: 1 });
    m.bola(px + dw / 3, 2 + dh / 2, zf + 2.3, 1.2, 1.2, 1.2, '#ffd24a', { d: 0, ao: false });
  }
}
// triângulo liso (empenas)
function tri(m, a, b, c, n, cr) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([...n, ...n, ...n], 3));
  m.add(g, {}, cr, { ao: false, todas: true });
}
// uma água do telhado (laje chanfrada inclinada) saindo do beiral (z0, y0) até a cumeeira (zc, yc)
function agua(m, rx, z0, y0, zc, yc, cr, o = {}) {
  const L = Math.hypot(zc - z0, yc - y0), a = Math.atan2(yc - y0, Math.abs(zc - z0)), s = Math.sign(z0 - zc);
  m.add(caixaR(rx * 2, o.esp ?? 3.6, L + 3, 1.6, 1), { x: 0, y: (y0 + yc) / 2 + 1, z: (z0 + zc) / 2, rx: s * a }, { pe: clarear(cr, -0.12), topo: cr }, { ao: false, desvio: 0.2 });
  for (const t of o.frisos ?? []) m.cil(-rx + 0.5, y0 + (yc - y0) * t + 2.6, z0 + (zc - z0) * t, 1.1, 1.1, rx * 2 - 1, 6, clarear(cr, -0.07), { rz: -Math.PI / 2, ao: false });
  return { a, s };
}
// altura da água sul no ponto z
const yAgua = (z0, y0, zc, yc, z) => y0 + (yc - y0) * (z0 - z) / (z0 - zc);

// ---------- casa de duas águas (base das casas, rádio, capela, taipa, cabana, galpão, casarão) ----------
// o = { W, wh, wall, roof, alto (inclinação), chamine, porta, janelas: [x...], flores, troncos, neve, extra }
function casaP(m, c, o = {}) {
  const W = o.W ?? c.fw * 16, D = c.D, wl = W / 2 - 8, wh = o.wh ?? 40, zf = -3, zb = -D + 5, zc = (zf + zb) / 2, dz = zf - zb;
  const wall = o.wall ?? '#f3e6c8', roof = o.roof ?? '#e0553e';
  m.caixa(0, 0, zc, wl * 2 + 4, 6, dz + 4, 2, o.rodape ?? RODAPE, { seg: 1 });
  if (o.troncos) {
    m.caixa(0, 2, zc, wl * 2, wh - 2, dz, 3, clarear(wall, -0.12), { seg: 1 });
    for (let y = 6, k = 0; y < wh - 1; y += 5.2, k++) m.cil(-wl - 1.5, y, zf + 0.6, 2.8, 2.8, wl * 2 + 3, 8, k % 2 ? wall : clarear(wall, 0.07), { rz: -Math.PI / 2, ao: false });
    for (const s of [-1, 1]) for (let y = 6, k = 0; y < wh - 1; y += 5.2, k++) m.cil(s * wl, y, zf - 1, 2.8, 2.8, 5, 8, '#e8c888', { rx: Math.PI / 2, ao: false });
  } else m.caixa(0, 2, zc, wl * 2, wh - 2, dz, o.r ?? 3.5, wall, { seg: 1 });
  const rx = o.rx ?? W / 2 - 1, yb = wh - 3, yc = wh + dz * (o.alto ?? 0.55), ze = zf + 6, zn = zb - 6;
  const fr = o.frisos ?? [0.3, 0.65];
  const S = agua(m, rx, ze, yb, zc, yc, roof, { frisos: fr });
  agua(m, rx, zn, yb, zc, yc, o.roofBack ?? roof, { frisos: fr });
  if (o.neve) {
    m.add(caixaR(rx * 2 - 6, 2.6, Math.hypot(zc - ze, yc - yb) - 1, 1.2, 1), { x: 0, y: (yb + yc) / 2 + 3.6, z: (ze + zc) / 2 - 0.6, rx: S.a }, { pe: '#dce8f4', topo: '#ffffff' }, { ao: false });
    m.add(caixaR(rx * 2 - 6, 2.6, Math.hypot(zc - zn, yc - yb) - 1, 1.2, 1), { x: 0, y: (yb + yc) / 2 + 3.6, z: (zn + zc) / 2 + 0.6, rx: -S.a }, { pe: '#dce8f4', topo: '#ffffff' }, { ao: false });
  }
  m.cil(-rx - 1, yc + 1.2, zc, 2.6, 2.6, rx * 2 + 2, 8, clarear(o.cumeeira ?? roof, 0.06), { rz: -Math.PI / 2, ao: false });
  for (const sx of [-1, 1]) { const x = sx * wl; tri(m, [x, wh - 1, sx > 0 ? zf : zb], [x, wh - 1, sx > 0 ? zb : zf], [x, yc - 1, zc], [sx, 0, 0], o.empena ?? clarear(wall, -0.06)); }
  if (o.chamine !== false) {
    const cx = o.chamineX ?? rx - 18;
    m.caixa(cx, yb, zc - 7, 9, yc - yb + 10, 8, 1.5, o.tijolo ?? '#b8654a', { seg: 1, ao: false });
    m.caixa(cx, yc + 8, zc - 7, 11, 3, 10, 1.2, o.neve ? '#ffffff' : clarear(o.tijolo ?? '#b8654a', -0.12), { seg: 1, ao: false });
  }
  const px = portaX(c);
  portaP(m, px, zf, { tipo: o.porta ?? 'madeira', dw: o.dw ?? 18, dh: o.dh ?? 28, ...(o.portaCor ?? {}) });
  const jy = o.jy ?? wh - 23;
  const wxs = o.janelas ?? [Math.max(-wl + 12, Math.min(-wl + 20, px - 32)), Math.min(wl - 12, Math.max(wl - 20, px + 24))];
  for (const wx of wxs) janP(m, wx, jy, zf, o.jw ?? 16, o.jh ?? 14, { peitoril: o.peitoril ?? '#a86a4a', marco: o.marco, vidro: o.vidroJ });
  if (o.flores !== false) {
    const fx = wxs[0];
    cai(m, fx, jy - 9, zf + 3.4, 20, 4, 4.5, '#a86a4a', { ao: false });
    for (let k = 0; k < 4; k++) m.bola(fx - 6 + k * 4, jy - 4, zf + 4.2, 1.9, 1.7, 1.9, ['#ff6b9a', '#ffd84a', '#ff8a3c', '#ffffff'][k], { d: 0, ao: false });
  }
  o.extra?.(m, { W, wl, wh, zf, zb, zc, dz, rx, yb, yc, ze, zn, px, wxs, jy, S, wall, roof });
  return { y: yc + 3, x0: -rx, x1: rx, z0: zc - 3, z1: zc + 3 };
}
// estilo do catálogo (cores 2D) ou o padrão dado
const est = (c, pad) => c.K.estilo ?? pad ?? {};

// ---------- casas ----------
const casaMineiro = (m, c) => {
  const e = est(c);
  return casaP(m, c, { wall: e.wall?.[0] ?? '#e8dcc4', roof: e.roof?.[0] ?? '#7a7e86', extra: (m2, k) => {
    // pedras de minério ao lado da porta e picareta encostada
    m2.bola(k.px + 22, 3.4, k.zf + 6, 4, 3.4, 3.6, { pe: '#6a7078', topo: '#a8aeb8' }, { d: 0 });
    m2.bola(k.px + 28, 2.4, k.zf + 5, 2.6, 2.4, 2.4, { pe: '#4a7ab8', topo: '#9ad0ff' }, { d: 0, ao: false });
    m2.bola(k.px + 17, 2, k.zf + 7, 2, 1.8, 2, { pe: '#b88a2a', topo: '#ffe27a' }, { d: 0, ao: false });
    SEG(m2, [k.px + 31, 1, k.zf + 4.4], [k.px + 28, 18, k.zf + 3.2], 0.9, '#8a5a34');
    m2.add(caixaR(9, 2.4, 2.2, 1, 1), { x: k.px + 27.4, y: 19, z: k.zf + 3.2, rz: 0.35 }, '#7a7e86', { ao: false });
  } });
};
const casaVidro = (m, c) => {
  const e = est(c);
  return casaP(m, c, { wall: e.wall?.[0] ?? '#e8f0f4', roof: e.roof?.[0] ?? '#3a4a5a', chamine: false, porta: 'vidro', flores: false, marco: '#dfe8ee', jw: 20, jh: 18, jy: 14, extra: (m2, k) => {
    // fachada de vidro: duas grandes vidraças com reflexo (degradê céu) nos lados da porta
    for (const wx of k.wxs) {
      const y0 = 12, w = 24, h = 22;
      m2.caixa(wx, y0 - 2, k.zf + 1.6, w + 4, h + 4, 1.6, 1, '#5a6878', { seg: 1, ao: false });
      pla(m2, wx, y0, k.zf + 2.6, w, h, (x, y) => linear(y > y0 + h * 0.5 ? '#d8f4ff' : '#7ac0e8'), { brilho: 0.7 });
      pla(m2, wx - 6, y0 + 3, k.zf + 2.7, 3, h - 6, '#ffffff', { brilho: 0.7 }); pla(m2, wx + 1, y0 + 3, k.zf + 2.7, 1.6, h - 6, '#ffffff', { brilho: 0.7 });
    }
  } });
};
const capela = (m, c) => {
  const e = est(c, { w: 96 });
  return casaP(m, c, { W: e.w ?? 96, wall: e.wall?.[0] ?? '#d8d0c4', roof: e.roof?.[0] ?? '#3a3242', chamine: false, flores: false, dw: 20, janelas: [-26, 26], peitoril: '#bcb4a8', extra: (m2, k) => {
    // cruz dourada na cumeeira e rosácea sobre a porta
    m2.caixa(0, k.yc + 3, k.zc + 3, 3, 15, 3, 1, '#e0c050', { seg: 1, ao: false }); m2.caixa(0, k.yc + 10, k.zc + 3, 11, 3, 3, 1, '#e0c050', { seg: 1, ao: false });
    disco(m2, k.px, k.wh - 8, k.zf + 2, 6, '#fff8ea'); disco(m2, k.px, k.wh - 8, k.zf + 3.2, 4.2, '#8fd0f8', { brilho: 1 });
    cai(m2, k.px, k.wh - 14, k.zf + 4, 1.2, 12, 0.6, '#fff8ea', { ao: false }); cai(m2, k.px, k.wh - 8.4, k.zf + 4, 8.4, 1.2, 0.6, '#fff8ea', { ao: false });
  } });
};
const radio = (m, c) => {
  const e = est(c, { w: 96 });
  return casaP(m, c, { W: e.w ?? 96, wall: e.wall?.[0] ?? '#f4ead2', roof: e.roof?.[0] ?? '#d8902a', chamine: false, extra: (m2, k) => {
    // antena de bambu no telhado com luz vermelha no topo
    const x = -30, z = k.zc - 4, y0 = k.yc - 8;
    for (let i = 0; i < 4; i++) { m2.cil(x, y0 + i * 12, z, 1.7, 1.5, 11, 6, i % 2 ? '#7ab84a' : '#9ad65a', { ao: false }); m2.cil(x, y0 + i * 12 + 10.5, z, 2.3, 2.3, 1.5, 6, '#5a8a32', { ao: false, aberto: false }); }
    m2.bola(x, y0 + 50, z, 2.8, 2.8, 2.8, '#ff5a48', { d: 0, brilho: -0.8, ao: false });
    // sino de transmissão ao lado da porta
    disco(m2, k.px - 24, 20, k.zf + 2, 4.4, '#ffe9a8'); disco(m2, k.px - 24, 20, k.zf + 3, 2.6, '#e0553e', { brilho: -0.3 });
  } });
};
const casaTux = (m, c) => casaP(m, c, { W: 80, wall: '#c89a62', roof: '#9a5a3a', cumeeira: '#d08a6a', flores: false, tijolo: '#8a5a3a', janelas: [-20, 20] });
const taipa = (m, c) => casaP(m, c, { W: 80, wh: 32, r: 6, wall: '#c8925c', roof: '#b8502a', cumeeira: '#d8703a', chamine: false, flores: false, janelas: [-20, 20], jy: 12, jh: 13, rodape: '#a87a48', alto: 0.5, peitoril: '#b07a48', extra: (m2, k) => {
  // trama de varas aparecendo no reboco (retângulo claro com grade escura)
  const x = 21, y0 = 8, w = 14, h = 14;
  pla(m2, x, y0, k.zf + 0.7, w, h, '#a8764a');
  for (let i = 0; i < 4; i++) cai(m2, x - w / 2 + 1.5 + i * 3.7, y0, k.zf + 1.3, 1, h, 0.7, '#6a4428', { ao: false });
  for (let j = 0; j < 3; j++) cai(m2, x, y0 + 1.5 + j * 5, k.zf + 1.6, w, 1, 0.7, '#6a4428', { ao: false });
} });
const cabana = (m, c) => casaP(m, c, { W: 80, wh: 34, troncos: true, wall: '#8a5a34', roof: '#6a3a2a', roofBack: '#6a3a2a', rx: 41, neve: true, alto: 0.55, tijolo: '#8a4a3a', chamineX: 14, flores: false, janelas: [-22, 22], jw: 12, jh: 10, jy: 14, empena: '#6b4428', peitoril: '#f4f8ff', frisos: [], portaCor: { cor0: '#4e301c', cor1: '#6b4428' } });
const galpao = (m, c0) => { const c = c0.fw === 8 ? c0 : { ...c0, fw: 8, fh: 3, L: 64, D: 48, K: { ...c0.K, fw: 8, fh: 3, door: 4 } }; return casaP(m, c, { W: 128, wh: 44, wall: '#4a7aa8', roof: '#7a8a9a', cumeeira: '#a8b8c8', chamine: false, flores: false, janelas: [-c.L + 20, c.L - 20], alto: 0.5, jy: 22, peitoril: '#e8f0f8', extra: (m2, k) => {
  // portão alto de tábuas e trapiche de madeira na frente, com cabeços
  const px = k.px;
  m2.caixa(px, 0, k.zf + 1.2, 40, 40, 2, 2, '#2a4a6a', { seg: 1, ao: false });
  for (let y = 3; y < 38; y += 5.6) cai(m2, px, y, k.zf + 2.6, 34, 3.8, 0.8, '#5a8ab8', { ao: false });
  m2.caixa(px, 0, 4, 30, 1.6, 12, 0.7, '#7a5233', { seg: 1 });
  for (let i = -3; i <= 3; i++) cai(m2, px + i * 4.2, 1.6, 4, 0.6, 0.3, 12, '#5a3d24', { ao: false });
  for (const s of [-1, 1]) m2.cil(px + s * 12, 1.5, 8.5, 1.8, 1.4, 5, 6, '#3a3a44', { aberto: false });
} }); };

// ---------- salões de laje ----------
function salaoP(m, c, o = {}) {
  const e = o.e ?? c.K.estilo ?? {};
  const W = o.W ?? e.w ?? c.fw * 16, D = c.D, wl = W / 2 - 6, wh = o.wh ?? e.wallH ?? 50, zf = -3, zb = -D + 5, zc = (zf + zb) / 2, dz = zf - zb;
  const teto = o.teto ?? e.roof?.[0] ?? '#e8483a', faixa = o.faixa ?? e.band ?? teto, wall = o.wall ?? e.wall?.[0] ?? '#f8f6f2';
  m.caixa(0, 0, zc, wl * 2 + 4, 6, dz + 4, 2, RODAPE, { seg: 1 });
  m.caixa(0, 2, zc, wl * 2, wh - 2, dz, 4, wall, { seg: 1 });
  m.caixa(0, 9, zf - 0.6, wl * 2 + 1, 4, 3, 1.5, faixa, { seg: 1, ao: false });
  m.caixa(0, wh - 1, zc, W - 2, 9, dz + 12, 4, { pe: clarear(teto, -0.12), topo: clarear(teto, 0.05) }, { seg: 1, ao: false, desvio: 0.3 });
  m.caixa(0, wh + 8, zc - 2, W - 22, 4, dz - 4, 2, clarear(teto, 0.12), { seg: 1, ao: false });
  const px = portaX(c), dw = e.door === 'double' ? 30 : 22;
  m.caixa(px, 0, zf + 3, dw + 10, 2.4, 9, 1.2, '#e2dccc', { seg: 1 });
  m.caixa(px, 2, zf + 0.8, dw + 4, 32, 2.4, 2, '#5a6878', { seg: 1, ao: false });
  cai(m, px, 2.5, zf + 2, dw, 30, 0.8, '#9ad8f4', { ao: false, brilho: 0.8 });
  cai(m, px, 2.5, zf + 2.5, 1.6, 30, 0.6, '#5a6878', { ao: false });
  for (const wx of e.wins ?? []) janP(m, wx + 8 - W / 2, wh - 36, zf, 16, 14, { marco: '#eef0f4' });
  o.sinal?.(m, { W, wl, wh, zf, zb, zc, dz, px, dw, teto, faixa, yl: wh + 8 });
  return { y: wh + 12, x0: -W / 2 + 3, x1: W / 2 - 3, z0: zb, z1: zf };
}
// letreiro: moldura escura, fundo e filete (sem texto)
const letreiro = (m, x, y, z, w, h, borda, fundo, filete) => {
  m.caixa(x, y - h / 2, z, w + 3, h + 3, 2.4, 1.6, borda, { seg: 1, ao: false });
  cai(m, x, y - h / 2 + 0.5, z + 1.3, w, h, 0.6, fundo, { ao: false, brilho: -0.2 });
  if (filete) cai(m, x, y - 0.8, z + 1.8, w - 6, 1.6, 0.5, filete, { ao: false, brilho: -0.2 });
};
const bolaPoke = (m, x, y, z, r) => m.bola(x, y, z, r, r, 3, (px, py) => (py > y + 0.9 ? linear('#e8483a') : py < y - 0.9 ? linear('#f6f6f6') : linear('#2a2a33')), { d: 2, ao: false, brilho: -0.25 });
const botao = (m, x, y, z, r) => m.bola(x, y, z, r, r, 1, '#f8f8f8', { d: 1, ao: false, brilho: -0.4 });

const megaloja = (m, c) => salaoP(m, c, { sinal: (m2, k) => {
  letreiro(m2, 0, k.wh + 14, k.zf + 5, 56, 12, '#c89a28', '#fffdf4', '#e0a020');
  // moedas douradas em cima do letreiro e toldo listrado sobre a porta
  for (const x of [-22, 0, 22]) m2.bola(x, k.wh + 24, k.zf + 5, 4, 4, 1.4, '#ffd24a', { d: 1, ao: false, brilho: -0.2 });
  for (let i = 0; i < 8; i++) { const x = k.px - 20 + i * 5; m2.add(BOXG, { x: x + 2.5, y: 38.2, z: k.zf + 6.6, sx: 5, sy: 1.6, sz: 8, rx: 0.3 }, i % 2 ? '#fffaf0' : '#e0a020', { ao: false }); }
} });
const redacao = (m, c) => salaoP(m, c, { sinal: (m2, k) => {
  letreiro(m2, 0, k.wh + 14, k.zf + 5, 38, 12, '#c8452f', '#f4f0e6', '#c8452f');
  // antena na laje e jornal na vitrine
  SEG(m2, [28, k.wh + 12, k.zc - 4], [28, k.wh + 36, k.zc - 4], 0.9, '#5a6a8a'); m2.bola(28, k.wh + 37, k.zc - 4, 2, 2, 2, '#ff5a48', { d: 0, brilho: -0.8, ao: false });
  cai(m2, k.px + 22, 4, k.zf + 4, 8, 6, 1, '#fffdf4', { ao: false }); cai(m2, k.px + 22, 8, k.zf + 4.6, 6, 1, 0.5, '#2a2a33', { ao: false });
} });
const estacao = (m, c) => salaoP(m, c, { sinal: (m2, k) => {
  letreiro(m2, 0, k.wh + 14, k.zf + 5, 42, 12, '#3a5a8a', '#3a5a8a', '#ffffff');
  // relógio redondo sobre a porta e marquise de ferro
  disco(m2, k.px, k.wh - 8, k.zf + 2, 8, '#3a3a44'); disco(m2, k.px, k.wh - 8, k.zf + 3.2, 6.6, '#f8f4ea', { brilho: -0.2 });
  cai(m2, k.px, k.wh - 8, k.zf + 4.2, 1, 5, 0.6, '#2a2a33', { ao: false }); cai(m2, k.px, k.wh - 8.5, k.zf + 4.2, 4, 1, 0.6, '#2a2a33', { ao: false });
  m2.caixa(k.px, 36, k.zf + 7, 44, 2.6, 14, 1, '#3a5a8a', { seg: 1, ao: false });
  for (const s of [-1, 1]) cai(m2, k.px + s * 20, 2, k.zf + 12, 2, 34, 2, '#3a3a44', { ao: false });
} });
const hospital = (m, c) => salaoP(m, c, { sinal: (m2, k) => {
  // cruz vermelha na laje, marquise clara com filete azul
  m2.caixa(0, k.yl + 4, k.zf + 4, 7, 22, 3, 1.4, '#e8483a', { seg: 1, ao: false }); m2.caixa(0, k.yl + 12, k.zf + 4, 22, 7, 3, 1.4, '#e8483a', { seg: 1, ao: false });
  m2.caixa(k.px, 36, k.zf + 6, 44, 2.6, 12, 1, '#f4f8fc', { seg: 1, ao: false });
  cai(m2, k.px, 37.4, k.zf + 12.4, 44, 1.2, 0.7, '#3aa0d8', { ao: false });
} });
const tuxCenter = (m, c) => salaoP(m, c, { e: { w: 80, roof: ['#e8483a'], wall: ['#f8f6f2'], band: '#e8483a', wins: [6, 58], wallH: 40 }, wh: 40, sinal: (m2, k) => {
  const cy = k.wh - 8, z = k.zf + 6; bolaPoke(m2, 0, cy, z, 8); botao(m2, 0, cy, z + 2.6, 2.6);
} });

// ---------- celeiros ----------
function celeiroP(m, c, o) {
  const { wl, zf, zb, wh, alto, rx, body, bodyDark, roof, trim, portao } = o;
  const zc = (zf + zb) / 2, dz = zf - zb, yc = wh + alto, yb = wh - 2, ze = zf + 6, zn = zb - 4;
  m.caixa(0, 0, zc, wl * 2 + 3, 4, dz + 3, 1.6, '#c8bca4', { seg: 1 });
  m.caixa(0, 2, zc, wl * 2, wh - 2, dz, 3.5, body, { seg: 1 });
  // tábuas verticais (planos) e friso claro em cima
  for (let x = -wl + 6; x < wl - 2; x += 6.5) pla(m, x, 6, zf + 0.7, 1, wh - 10, bodyDark);
  m.caixa(0, wh - 3, zf + 0.3, wl * 2 + 1, 3, 2.2, 1, trim, { seg: 1, ao: false });
  const S = agua(m, rx, ze, yb, zc, yc, roof, { frisos: [0.25, 0.5, 0.75] });
  agua(m, rx, zn, yb, zc, yc, clarear(roof, -0.1), { frisos: [0.25, 0.5, 0.75] });
  m.cil(-rx - 1, yc + 1.2, zc, 3.2, 3.2, rx * 2 + 2, 8, o.cumeeira ?? clarear(roof, 0.1), { rz: -Math.PI / 2, ao: false });
  for (const sx of [-1, 1]) tri(m, [sx * wl, wh - 1, sx > 0 ? zf : zb], [sx * wl, wh - 1, sx > 0 ? zb : zf], [sx * wl, yc - 1, zc], [sx, 0, 0], bodyDark);
  const px = o.px ?? 0, gw = o.gw ?? 34, gh = o.gh ?? 34;
  m.caixa(px, 0, zf + 1, gw + 6, gh + 4, 2, 1.6, trim, { seg: 1, ao: false });
  for (const s of [-1, 1]) {
    const mx = s * (gw / 4 + 0.5), pw = gw / 2 - 1;
    if (portao === 'x') {
      cai(m, px + mx, 1.4, zf + 2.2, pw, gh - 2, 1, '#8a5a34', { ao: false });
      const len = Math.hypot(pw, gh - 4), ang = Math.atan2(gh - 4, pw);
      cai(m, px + mx, gh / 2 - 1.2, zf + 3, len, 2.2, 0.7, trim, { ao: false, rz: ang }); cai(m, px + mx, gh / 2 - 1.2, zf + 3, len, 2.2, 0.7, trim, { ao: false, rz: -ang });
    } else {
      cai(m, px + mx, 1.4, zf + 2.2, pw, gh - 2, 1, bodyDark, { ao: false });
      pla(m, px + mx, 5, zf + 2.8, pw - 5, gh - 12, clarear(bodyDark, -0.05));
      cai(m, px + mx, 14, zf + 3.2, pw - 2, 1.4, 0.6, trim, { ao: false });
    }
  }
  // janela do feno na água da frente
  const zl = zf - (o.lucZ ?? 0), yl = yAgua(ze, yb, zc, yc, zl) + 1.5;
  const ny = Math.cos(S.a), nz = Math.sin(S.a), ly = yl + ny * 3, lz = zl + nz * 3;
  m.add(BOXG, { x: 0, y: ly + 5.5, z: lz, sx: 16, sy: 11, sz: 1.6, rx: S.a }, trim, { ao: false });
  m.add(BOXG, { x: 0, y: ly + 5.5 + ny * 1.3, z: lz + nz * 1.3, sx: 12, sy: 8, sz: 1.2, rx: S.a }, '#3a2a1a', { ao: false, brilho: 0.6 });
  m.add(BOXG, { x: 0, y: ly + 5.5 + ny * 1.9, z: lz + nz * 1.9, sx: 1.4, sy: 8, sz: 1, rx: S.a }, trim, { ao: false });
  for (const x of o.janelas ?? []) janP(m, x, 12, zf, 14, 12, { marco: trim, peitoril: false });
  return { y: yc + 3, x0: -rx, x1: rx, z0: zc - 3, z1: zc + 3 };
}
const barn = (m, c) => celeiroP(m, c, { wl: 48, zf: -3, zb: -c.D + 5, wh: 42, alto: 34, rx: 54, body: '#b8402e', bodyDark: '#9a3426', roof: '#9a6040', trim: '#f4ead2', portao: 'x', px: portaX(c), janelas: [-34, 34], lucZ: 6 });
const celeiro = (m, c) => celeiroP(m, c, { wl: 34, zf: -6, zb: -44, wh: 33, alto: 19, rx: 37, body: '#b83a2e', bodyDark: '#7a2a22', roof: '#8a4a3a', trim: '#f4ece0', portao: 'painel', px: 0, gw: 24, gh: 24, cumeeira: '#a8624a', lucZ: 7 });

// ---------- jequitibá com porta (Centro de Vila Sussurro e casas nas árvores) ----------
function arvorePredio(centro) {
  return (m, c) => {
    const zf = -3, zc = -24, cs = ['#5a3a22', '#7a5236', '#8a6040'];
    // tronco com raízes (torno): base larga, afina, abre um pouco na copa
    m.add(torno([[1.28, 0], [1.1, 0.12], [0.96, 0.3], [0.9, 0.6], [0.92, 0.9], [0.8, 1]], 14), { x: 0, y: 0, z: zc, sx: 22, sy: 62, sz: 22 }, { pe: cs[0], topo: cs[2] }, { desvio: 0.6 });
    for (const [x, w, z] of [[-24, 11, 6], [24, 12, 6], [-33, 7, -2], [33, 7, -2]]) m.bola(x, 4, zc + z, w, 5.5, 7, { pe: cs[0], topo: cs[1] }, { d: 0 });
    // porta em arco (preta por trás, madeira ou vidro na frente)
    const pw = 18, ph = 28, pz = zf - 0.5, cd = centro ? '#7ac0e8' : '#8a5a34', bd = centro ? 0.6 : 0;
    cai(m, 0, 0, pz, pw + 4, ph, 3, '#2e1c10', { ao: false }); m.bola(0, ph, pz, (pw + 4) / 2, 8, 1.5, '#2e1c10', { d: 1, ao: false });
    cai(m, 0, 0, pz + 1, pw, ph, 2, cd, { ao: false, brilho: bd }); m.bola(0, ph, pz + 1, pw / 2, 7, 1, cd, { d: 1, ao: false, brilho: bd });
    cai(m, 0, 0, pz + 2.2, 1.4, ph + 5, 0.6, centro ? '#5a6470' : '#4e301c', { ao: false });
    m.caixa(0, 0, pz + 5, pw + 14, 2.4, 8, 1.2, '#7a5236', { seg: 1 });
    // janela redonda acesa e lanternas de vaga-lume
    disco(m, 0, 46, zf - 1.5, 6.4, '#3e2616'); disco(m, 0, 46, zf - 0.4, 4.8, '#ffe39a', { brilho: 1 });
    for (const x of [-26, 26]) { SEG(m, [x, 38, zf - 3], [x, 30, zf - 3], 0.6, '#3e2616', { n: 4 }); m.bola(x, 26, zf - 3, 3.4, 4.4, 3.4, '#ffe08a', { d: 1, brilho: 1, ao: false }); }
    if (centro) {
      m.caixa(0, 50, zf - 5, 30, 12, 2.6, 1.8, '#3a2a2a', { seg: 1, ao: false }); cai(m, 0, 51.5, zf - 3.6, 27, 9, 0.6, '#ffffff', { ao: false, brilho: -0.2 });
      bolaPoke(m, -7, 56, zf - 2.4, 4.2); botao(m, -7, 56, zf + 0.2, 1.5); cai(m, 5, 54, zf - 3, 10, 4, 0.5, '#e8483a', { ao: false, brilho: -0.2 });
    } else {
      m.caixa(0, 50, zf - 3, 56, 3, 4, 1.2, '#8a5a34', { seg: 1 });
      for (const x of [-22, 22]) m.caixa(x, 53, zf - 3, 7, 7, 4, 1.4, '#c08a56', { seg: 1, ao: false });
    }
    // copa: bola grande e satélites, degradê verde
    const cy = 86, pal = ['#1e6e34', '#2f9244', '#52b856', '#8ad87a'];
    m.bola(0, cy, zc, 46, 24, 30, { pe: pal[0], topo: pal[2] }, { d: 1, var: 0.08, ao: false });
    for (const [a, b, e, s, k] of [[-0.7, -0.1, 0, 0.5, 0], [0.72, -0.1, 0, 0.5, 1], [0, 0.45, -0.1, 0.55, 0], [-0.3, 0.05, 0.2, 0.4, 1], [0.35, 0.1, 0.2, 0.36, 0]]) m.bola(a * 46, cy + b * 24, zc + e * 30, 46 * s, 24 * s * 0.95, 30 * s, { pe: pal[k], topo: pal[2 + k] }, { d: 1, var: 0.08, ao: false });
    return { y: cy + 24, x0: -40, x1: 40, z0: zc - 20, z1: zc + 20 };
  };
}

// ---------- estufa de vidro (laboratório anexo e ginásio da Lia) ----------
const MEIO = prim('pb-meiocil', () => new THREE.CylinderGeometry(1, 1, 1, 14, 1, true, 0, Math.PI));
const ARCO = prim('pb-arco', () => new THREE.TorusGeometry(1, 0.045, 3, 12, Math.PI));
function estufa(m, c) {
  const wl = c.L - 6, zf = -3, zb = -c.D + 5, wh = 28, zc = (zf + zb) / 2, dz = zf - zb, fr = '#2f7a3a';
  m.caixa(0, 0, zc, wl * 2 + 2, 5, dz + 2, 1.5, '#b8c8bc', { seg: 1 });
  // paredes de vidro claro com leve brilho + montantes
  m.caixa(0, 4, zc, wl * 2, wh - 4, dz, 2, { pe: '#a8d8c0', topo: '#d8f4e4' }, { seg: 1, ao: false, brilho: 0.18 });
  for (let x = -wl + 2; x <= wl - 1; x += 12) cai(m, x, 4, zf + 0.7, 1.8, wh - 4, 1.2, fr, { ao: false });
  cai(m, 0, wh - 14, zf + 0.9, wl * 2, 1.8, 1, fr, { ao: false });
  // teto em arco (meio cilindro de vidro) com costelas
  const Rz = dz / 2 + 3, Rv = 24;
  m.add(MEIO, { x: 0, y: wh - 1, z: zc, sx: Rv, sy: wl * 2 + 4, sz: Rz, rz: Math.PI / 2 }, { pe: '#a8dcc4', topo: '#d2f0e2' }, { ao: false, brilho: 0.2, todas: true, desvio: 0.2 });
  for (const x of [-wl, -wl / 2, 0, wl / 2, wl]) m.add(ARCO, { x, y: wh - 1, z: zc, sx: Rz, sy: Rv, sz: Rz, ry: Math.PI / 2 }, fr, { ao: false, todas: true });
  m.cil(-wl - 1, wh - 1 + Rv, zc, 1.6, 1.6, wl * 2 + 2, 6, fr, { rz: -Math.PI / 2, ao: false });
  // plantas na frente e porta de vidro
  for (let x = -wl + 8; x < wl - 6; x += 18) { m.bola(x, 4.5, zf - 5, 6, 4.5, 4.5, { pe: '#2f8a3a', topo: '#7ad86a' }, { d: 0 }); m.bola(x + 4, 7, zf - 4, 3, 3, 3, { pe: '#3aa04a', topo: '#9aea80' }, { d: 0, ao: false }); }
  portaP(m, portaX(c), zf, { tipo: 'vidro', dw: 22, dh: 28, batente: fr, degrau: '#d8d0c0' });
  return { y: wh + Rv, x0: -wl, x1: wl, z0: zc - 4, z1: zc + 4 };
}

// ---------- farol ----------
// raio do fuste na altura y (perfil do torno abaixo)
const PERFIL_FAROL = [[0.9, 0.04], [0.78, 0.5], [0.58, 1.0]];
const rFarol = (y, H, R) => { const t = Math.max(0.04, Math.min(1, y / H)); for (let i = 0; i < 2; i++) { const [r0, y0] = PERFIL_FAROL[i], [r1, y1] = PERFIL_FAROL[i + 1]; if (t <= y1) return R * (r0 + (r1 - r0) * (t - y0) / (y1 - y0)); } return R * 0.58; };
function farol(m, c) {
  const zc = -c.D / 2 - 2, H = 132;
  // pé de pedra e fuste listrado (um torno só; a cor por altura faz as listras)
  m.add(torno([[1.2, 0], [1.2, 0.045], [1.05, 0.05]], 14), { x: 0, y: 0, z: zc, sx: 24, sy: H, sz: 24 }, { pe: '#8a8478', topo: '#b4aea0' }, { ao: false });
  for (let i = 0; i < 7; i++) {
    const y0 = i * (H - 6) / 7 + 5, y1 = (i + 1) * (H - 6) / 7 + 5;
    m.cil(0, y0, zc, rFarol(y0, H, 24), rFarol(y1, H, 24), y1 - y0 + 0.2, 14, i % 2 ? '#f6f0e8' : '#e0442f', { ao: false });
  }
  // galeria e grade
  m.cil(0, H - 1, zc, 18, 17, 3.5, 14, '#3a3a44', { aberto: false, ao: false });
  m.cil(0, H + 2.5, zc, 17.5, 17.5, 1.4, 14, '#4a4a56', { aberto: false, ao: false });
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; if (Math.sin(a) < -0.35) continue; cai(m, Math.cos(a) * 16.6, H + 3, zc + Math.sin(a) * 16.6, 1.2, 6, 1.2, '#3a3a44', { ao: false }); }
  m.cil(0, H + 8.8, zc, 17.5, 17.5, 1.6, 14, '#3a3a44', { aberto: false, ao: false });
  // lanterna de vidro acesa, teto vermelho e pontinha
  m.cil(0, H + 4, zc, 10.5, 10, 15, 10, '#aaf8ee', { aberto: false, brilho: -0.7, ao: false });
  m.bola(0, H + 11.5, zc, 4, 5, 4, '#ffffff', { d: 1, brilho: -0.9, ao: false });
  m.cone(0, H + 18, zc, 13.5, 14, 12, { pe: '#c0382a', topo: '#f0604a' }, { ao: false });
  m.bola(0, H + 32.5, zc, 2.2, 2.2, 2.2, '#3a3a44', { d: 0, ao: false });
  // janelinhas na frente do fuste, porta e degrau
  for (const y of [44, 78, 106]) { const r = rFarol(y, H, 24); cai(m, 0, y, zc + r - 0.4, 6, 9, 1.4, '#3a3a44', { ao: false }); cai(m, 0, y + 1, zc + r + 0.3, 4, 7, 0.6, '#8fd0f8', { ao: false, brilho: 1 }); }
  const rb = rFarol(26, H, 24);
  m.caixa(0, 0, zc + rb - 1, 22, 26, 4, 2.4, '#5a6a8a', { seg: 1, ao: false });
  m.caixa(0, 0, zc + rb + 1, 15, 22, 1.2, 1.4, { pe: '#3a4a6a', topo: '#5a6a8a' }, { seg: 1, ao: false });
  m.bola(5, 11, zc + rb + 1.8, 1, 1, 1, '#ffd24a', { d: 0, ao: false });
  m.caixa(0, 0, zc + rb + 4, 28, 2.6, 9, 1.2, '#b4aea0', { seg: 1 });
  return { y: H + 3, x0: -16, x1: 16, z0: zc - 16, z1: zc + 16 };
}

// ---------- casarão das velas ----------
function casarao(m, c) {
  const roof = '#2a2430', wall = '#4a4050';
  return casaP(m, c, { W: 160, wh: 56, wall, roof, cumeeira: '#3a3242', empena: '#3a3242', rodape: '#5a5066', flores: false, tijolo: '#5a4a5e', chamineX: 56, janelas: [-56, -32, 32, 56], jy: 10, vidroJ: '#ffd27a', marco: '#d8c8e0', peitoril: '#5e5466', extra: (m2) => {
    // torreão central com telhado de ardósia e vela na janela
    m2.caixa(0, 50, -21, 32, 56, 20, 3, wall, { seg: 1 });
    piramide(m2, 0, 104, -21, 20, 24, 14, { pe: '#1e1a24', topo: roof }, { ao: false });
    m2.bola(0, 129, -21, 2.4, 2.4, 2.4, '#e0c050', { d: 0, ao: false });
    janP(m2, 0, 80, -11, 14, 16, { vidro: '#ffd27a', marco: '#d8c8e0' });
    // lampiões acesos nos dois lados da porta
    for (const lx of [-24, 24]) { SEG(m2, [lx, 1, -1], [lx, 24, -1], 1, '#2a2430', { n: 5 }); m2.bola(lx, 28, -1, 3.6, 4.6, 3.6, '#ffd27a', { d: 1, brilho: 1, ao: false }); m2.cone(lx, 31.5, -1, 4.6, 3.6, 6, '#2a2430', { ao: false }); }
  } });
}

// ---------- torre aurora ----------
const CRISTAL = torno([[0.001, 0], [1, 0.36], [0.001, 1]], 8);
function torre(m, c) {
  const zc = -c.D / 2 - 1, zf = -3, D = c.D;
  m.caixa(0, 0, (zf + 5 - D) / 2, 112, 34, D - 8, 4, { pe: '#d8dde2', topo: '#f4f6f8' }, { seg: 1 });
  m.caixa(0, 29, (zf + 3 - D) / 2 - 0.5, 118, 6, D, 2.4, '#e0b030', { seg: 1, ao: false });
  for (const x of [-44, -26, 26, 44]) janP(m, x, 7, zf, 12, 16, { cruz: false, marco: '#d8dde2', peitoril: false, vidro: '#7aa8c8' });
  portaP(m, portaX(c), zf, { tipo: 'vidro', dw: 24, dh: 28, degrau: '#d8d0c0' });
  // corpo alto com janelas azuis (algumas acesas), friso dourado e cristal no topo
  const tz0 = zc - 18, tz1 = zc + 14;
  m.caixa(0, 34, (tz0 + tz1) / 2, 80, 134, tz1 - tz0, 4, { pe: '#dfe4e9', topo: '#f8fafc' }, { seg: 1 });
  for (let y = 44, j = 0; y < 158; y += 14, j++) for (let x = -34, i = 0; x < 34; x += 14, i++) pla(m, x + 5, y, tz1 + 0.7, 9, 9, (px, py) => linear(py > y + 4.5 ? '#9ac8e4' : '#6a98b8'), { brilho: ((i * 7 + j * 3) % 5 < 2) ? 1 : 0.25 });
  m.caixa(0, 164, (tz0 + tz1) / 2, 86, 6, tz1 - tz0 + 4, 2, '#e0b030', { seg: 1, ao: false });
  const cr = { pe: '#2a9ab8', topo: '#7af0e8' };
  m.add(CRISTAL, { x: 0, y: 170, z: zc - 2, sx: 18, sy: 66, sz: 18 }, cr, { brilho: -0.6, ao: false, todas: true });
  for (const x of [-26, 26]) m.add(CRISTAL, { x, y: 170, z: zc - 2, sx: 8, sy: 26, sz: 8 }, cr, { brilho: -0.6, ao: false, todas: true });
  return { y: 170, x0: -40, x1: 40, z0: zc - 18, z1: zc + 14 };
}

// ---------- prédio de vidro (só cenário) ----------
function predioVidro(m, c) {
  const zf = -3, zb = -c.D + 5, H = 128, zc = (zf + zb) / 2;
  m.caixa(0, 0, zc, 80, H, zf - zb, 4, { pe: '#3a5670', topo: '#6a8aa4' }, { seg: 1, ao: false });
  // vidraças em colunas e andares, com reflexo (céu claro em cima) e algumas luzes acesas
  const cols = 6, w = 11, gx = 13;
  for (let r = 0; r < 11; r++) for (let k = 0; k < cols; k++) {
    const x = (k - (cols - 1) / 2) * gx, y = 12 + r * 10.4;
    pla(m, x, y, zf + 0.8, w, 8, (px, py) => linear(py > y + 4 ? '#c0e8ff' : '#7cc0ec'), { brilho: ((k * 5 + r * 3) % 7 < 3) ? 1 : 0.1 });
  }
  m.caixa(0, 0, zf + 1.5, 76, 9, 4, 2, '#2a3a4a', { seg: 1, ao: false });
  pla(m, 0, 1, zf + 3.8, 30, 7, '#9ad4f8', { brilho: 0.6 });
  m.caixa(0, H - 1, zc, 83, 5, zf - zb + 3, 2, '#2a3a4a', { seg: 1 });
  m.caixa(-18, H + 4, zc, 16, 8, 14, 2, '#5a6a7a', { seg: 1 }); SEG(m, [20, H + 4, zc], [20, H + 22, zc], 0.9, '#5a6a7a', { n: 4 });
  return { y: H + 3, x0: -40, x1: 40, z0: zb, z1: zf };
}

// ---------- casa de máquinas ----------
function casaMaquinas(m, c) {
  const zf = -3, zb = -c.D + 5, zc = (zf + zb) / 2, px = portaX(c);
  m.caixa(0, 0, zc, 52, 36, zf - zb, 3.5, { pe: '#8a8c94', topo: '#c0c2c8' }, { seg: 1 });
  m.caixa(0, 36, zc - 1, 58, 7, zf - zb + 6, 2.4, { pe: '#4a4c54', topo: '#7a7c84' }, { seg: 1, ao: false });
  portaP(m, px, zf, { dw: 18, dh: 24, cor0: '#4a5a6a', cor1: '#6a7a8a', degrau: '#9a9aa0' });
  // placa de aviso amarela, chaminé industrial e cano
  m.caixa(-16, 22, zf + 1.5, 12, 10, 1.6, 1.4, '#f2c94c', { seg: 1, ao: false }); cai(m, -16, 24, zf + 2.5, 2, 6, 0.5, '#2a2a2a', { ao: false });
  m.cil(14, 43, zc - 6, 5, 4.2, 10, 8, { pe: '#6a6c74', topo: '#9a9ca4' }, { aberto: false, ao: false }); m.cil(14, 53, zc - 6, 5.8, 5.8, 2, 8, '#3a3c44', { aberto: false, ao: false });
  m.cil(-30, 0, zc + 4, 2.4, 2.4, 30, 8, { pe: '#7a7c84', topo: '#b0b2ba' }, { aberto: false, ao: false });
  for (const x of [-4, 4]) m.bola(x + 22, 28, zf + 1.4, 3, 3, 1.2, '#ffd24a', { d: 0, ao: false, brilho: 0.4 });
  return { y: 43, x0: -29, x1: 29, z0: zb, z1: zf };
}

// ---------- iglu ----------
function iglu(m, c) {
  const zc = -c.D / 2 - 4, R = 19;
  // cúpula lisa de neve com fiadas de blocos suaves (cor por altura), sombra azulada no pé
  m.bola(0, 0, zc, R, R * 0.95, R, (x, y, z, nx, ny) => {
    const b = (y / (R * 0.95)) * 5, f = Math.abs(b - Math.round(b)) < 0.07 ? 0.86 : 1, t = Math.max(0, Math.min(1, ny * 0.7 + 0.35));
    const [r0, g0, b0] = linear('#b4cae6'), [r1, g1, b1] = linear('#ffffff');
    return [(r0 + (r1 - r0) * t) * f, (g0 + (g1 - g0) * t) * f, (b0 + (b1 - b0) * t) * f];
  }, { d: 2, ao: false });
  // túnel de entrada (domo baixo alongado) e boca escura
  m.bola(0, 0, zc + 11, 8.6, 10.5, 9, (x, y, z, nx, ny) => { const t = Math.max(0, Math.min(1, ny * 0.7 + 0.35)); const [r0, g0, b0] = linear('#b0c6e2'), [r1, g1, b1] = linear('#fafcff'); return [r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t]; }, { d: 1, ao: false });
  m.bola(0, 0.5, zc + 19.6, 5.4, 7, 1.2, '#1a2a3a', { d: 1, ao: false });
  return { y: R, x0: -8, x1: 8, z0: zc - 8, z1: zc + 8 };
}

// ---------- quiosque de praia ----------
function barracaPraia(m) {
  const zf = -2, z0 = -14;
  m.caixa(0, 0, (z0 + zf) / 2, 52, 13, zf - z0, 2.4, { pe: '#a8744a', topo: '#d9a46c' }, { seg: 1 });
  for (let x = -22; x <= 22; x += 6) pla(m, x, 2, zf + 0.6, 1, 9, '#8a5a34');
  m.caixa(0, 12.4, (z0 + zf) / 2 + 1, 54, 2.2, zf - z0 + 4, 1, '#e0b078', { seg: 1, ao: false });
  for (const x of [-24, 24]) m.cil(x, 0, z0 + 3, 1.9, 1.7, 32, 6, { pe: '#6a4428', topo: '#8a5a34' }, { aberto: false });
  // toldo: tiras vermelhas e brancas inclinadas para a frente e franja
  const a = Math.atan2(6, 20);
  for (let i = 0; i < 7; i++) {
    const x = -24 + i * 8 + 4, cr = i % 2 ? '#ffffff' : '#e8584a';
    m.add(BOXG, { x, y: 33.6, z: (zf + 6 + z0 - 2) / 2, sx: 8, sy: 1.6, sz: Math.hypot(22, 6) + 1, rx: a }, cr, { ao: false });
    pla(m, x - 4, 28.5, zf + 6.6, 8, 4.4, cr);
  }
  // balcão: frutas, copo e canudo
  for (const [x, cr] of [[-14, '#6aba3a'], [-8, '#ffe05a'], [4, '#ff8a3a']]) m.bola(x, 16.4, -7, 3.2, 3, 3.2, { pe: clarear(cr, -0.1), topo: cr }, { d: 0, ao: false });
  m.cil(14, 13.4, -7, 2.4, 2.8, 5, 8, { pe: '#4c9ae8', topo: '#9ad0ff' }, { aberto: false, ao: false }); SEG(m, [14.6, 18, -7], [16, 23, -7], 0.5, '#f0f0f0', { n: 3 });
  return { y: 36, x0: -28, x1: 28, z0: z0 - 2, z1: zf + 6 };
}

export const TIPOS_PREDIOS = {
  houseMiner: { f: casaMineiro }, houseGlass: { f: casaVidro }, capela: { f: capela }, radioStation: { f: radio },
  tuxHouse: { f: casaTux }, megaloja: { f: megaloja }, redacao: { f: redacao }, estacao: { f: estacao }, hospital: { f: hospital },
  tuxCenter: { f: tuxCenter }, barn: { f: barn }, treeCenter: { f: arvorePredio(true) }, treeHouse: { f: arvorePredio(false) },
  greenhouse: { f: estufa }, farol: { f: farol }, casarao: { f: casarao }, torre: { f: torre }, vidro: { f: predioVidro },
  casaMaquinas: { f: casaMaquinas }, igloo: { f: iglu }, cabin: { f: cabana }, taipa: { f: taipa }, beachStall: { f: barracaPraia },
  galpaoBarcos: { f: galpao }, celeiro: { f: celeiro },
};
