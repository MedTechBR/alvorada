import * as THREE from 'three';
import { cor as linear, rng } from '../kit/construtor.js';
import { KINDS } from '../../world/objects.js';
import { SPR } from '../../world/art.js';

// Modelos do estilo Let's Go: formas lisas e arredondadas (esferas de icosaedro, cilindros, caixas chanfradas),
// sombreamento suave e cor em degradê (pé escuro, topo claro), no lugar dos blocos do kit voxel.
// Saída no formato do kit (src/visual3d/kit/construtor.js): position, normal, color (linear), aBrilho, índice;
// então entra na malha mesclada do setor (kit.mesclar) e usa o material do kit sem o pixel (janelas acendem à noite).
// Mesma pegada e mesmo ponto de origem dos modelos do kit (pé do objeto, x = -fw*8..fw*8, z = -fh*16..0): portas,
// colisão e sombras de contato continuam onde estavam.
//
//   modeloLG(kind, obj) -> { geometry, topo, altura, chave } ou null (o tipo fica com o modelo do kit)

// ---------- primitivas (cacheadas, compartilhadas) ----------
const PRIM = new Map();
const prim = (k, f) => { let g = PRIM.get(k); if (!g) { g = f(); PRIM.set(k, g); } return g; };
// esfera de icosaedro com normais suaves (mesmo no detalhe 0)
const esf = (d) => prim('e' + d, () => { const g = new THREE.IcosahedronGeometry(1, d); const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i).normalize(); n.setXYZ(i, v.x, v.y, v.z); } return g; });
const cilG = (n, r0, r1, aberto = true) => prim(`c${n}|${r0}|${r1}|${aberto}`, () => { const g = new THREE.CylinderGeometry(r1, r0, 1, n, 1, aberto); g.translate(0, 0.5, 0); return g; });
const coneG = (n) => prim('k' + n, () => { const g = new THREE.ConeGeometry(1, 1, n, 1, true); g.translate(0, 0.5, 0); return g; });
// caixa de cantos arredondados (o algoritmo do RoundedBoxGeometry do three, sem depender dos addons)
function caixaR(w, h, d, r, seg = 1) {
  return prim(`b${w}|${h}|${d}|${r}|${seg}`, () => {
    const s = seg * 2 + 1; r = Math.min(r, w / 2, h / 2, d / 2);
    const g = new THREE.BoxGeometry(1, 1, 1, s, s, s), P = g.attributes.position, N = g.attributes.normal;
    const box = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r), p = new THREE.Vector3(), n = new THREE.Vector3(), meio = 0.5 / s;
    for (let i = 0; i < P.count; i++) {
      p.fromBufferAttribute(P, i); n.copy(p);
      n.x -= Math.sign(n.x) * meio; n.y -= Math.sign(n.y) * meio; n.z -= Math.sign(n.z) * meio; n.normalize();
      P.setXYZ(i, box.x * Math.sign(p.x) + n.x * r, box.y * Math.sign(p.y) + n.y * r, box.z * Math.sign(p.z) + n.z * r);
      N.setXYZ(i, n.x, n.y, n.z);
    }
    return g;
  });
}

// ---------- montador ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _t = new THREE.Vector3(), _nm = new THREE.Matrix3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3();
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

class MalhaLG {
  constructor(seed = 1) { this.p = []; this.n = []; this.c = []; this.b = []; this.i = []; this.r = rng(seed); }
  // geometria do three posta com { x, y, z, sx, sy, sz, rx, ry, rz }; cor: '#hex' | { pe, topo } (degradê pela normal)
  // | função (x, y, z, nx, ny, nz) -> [r, g, b] linear; o = { brilho, var (ruído de cor), ao (escurece perto do chão), todas }
  add(geo, T, cr, o = {}) {
    _t.set(T.x ?? 0, T.y ?? 0, T.z ?? 0); _e.set(T.rx ?? 0, T.ry ?? 0, T.rz ?? 0); _q.setFromEuler(_e);
    _s.set(T.sx ?? T.s ?? 1, T.sy ?? T.s ?? 1, T.sz ?? T.s ?? 1); _m.compose(_t, _q, _s); _nm.getNormalMatrix(_m);
    const P = geo.attributes.position, N = geo.attributes.normal, idx = geo.index, nt = idx ? idx.count / 3 : P.count / 3;
    const pe = typeof cr === 'object' && !Array.isArray(cr) && cr.pe ? linear(cr.pe) : null, topo = pe ? linear(cr.topo) : null;
    const base = typeof cr === 'function' || pe ? null : linear(cr);
    const v0 = this.p.length / 3, mapa = new Int32Array(P.count).fill(-1);
    const vn = new THREE.Vector3(), vp = new THREE.Vector3();
    const vert = (k) => {
      if (mapa[k] >= 0) return mapa[k];
      vp.fromBufferAttribute(P, k).applyMatrix4(_m); vn.fromBufferAttribute(N, k).applyMatrix3(_nm).normalize();
      let c = base ?? (pe ? null : cr(vp.x, vp.y, vp.z, vn.x, vn.y, vn.z));
      if (pe) { const t = ss(-0.55, 0.95, vn.y + (o.desvio ?? 0)); c = [pe[0] + (topo[0] - pe[0]) * t, pe[1] + (topo[1] - pe[1]) * t, pe[2] + (topo[2] - pe[2]) * t]; }
      let k2 = 1 + (o.var ? (this.r() - 0.5) * o.var : 0);
      if (o.ao !== false) k2 *= 0.72 + 0.28 * Math.min(1, Math.max(0, vp.y / 8));
      this.p.push(vp.x, vp.y, vp.z); this.n.push(vn.x, vn.y, vn.z); this.c.push(c[0] * k2, c[1] * k2, c[2] * k2); this.b.push(o.brilho ?? 0);
      return (mapa[k] = this.p.length / 3 - 1);
    };
    for (let f = 0; f < nt; f++) {
      const ia = idx ? idx.getX(f * 3) : f * 3, ib = idx ? idx.getX(f * 3 + 1) : f * 3 + 1, ic = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;
      if (!o.todas) {
        // faces que a câmera do jogo não vê (para baixo, ou de costas para o sul): fora
        _a.fromBufferAttribute(P, ia).applyMatrix4(_m); _b.fromBufferAttribute(P, ib).applyMatrix4(_m); _c.fromBufferAttribute(P, ic).applyMatrix4(_m);
        _n.subVectors(_c, _b).cross(_a.clone().sub(_b)).normalize();
        if (_n.y < -0.45 || (_n.z < -0.55 && _n.y < 0.3)) continue;
      }
      this.i.push(vert(ia), vert(ib), vert(ic));
    }
    void v0;
    return this;
  }
  bola(x, y, z, rx, ry, rz, cr, o = {}) { return this.add(esf(o.d ?? 1), { x, y, z, sx: rx, sy: ry, sz: rz }, cr, o); }
  cil(x, y0, z, r0, r1, h, n, cr, o = {}) { return this.add(cilG(n, 1, r1 / r0, o.aberto !== false), { x, y: y0, z, sx: r0, sy: h, sz: r0 * (o.achata ?? 1), rx: o.rx, ry: o.ry, rz: o.rz }, cr, o); }
  cone(x, y0, z, r, h, n, cr, o = {}) { return this.add(coneG(n), { x, y: y0, z, sx: r, sy: h, sz: r * (o.achata ?? 1) }, cr, o); }
  caixa(x, y, z, w, h, d, r, cr, o = {}) { return this.add(caixaR(w, h, d, r, o.seg ?? 1), { x, y: y + h / 2, z, rx: o.rx, ry: o.ry, rz: o.rz }, cr, o); }
  geometria() {
    const g = new THREE.BufferGeometry(), nv = this.p.length / 3;
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aBrilho', new THREE.Float32BufferAttribute(this.b, 1));
    g.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  }
}

// ---------- natureza ----------
const PAL = {
  tree: ['#2c8a3c', '#4cb84a', '#7ad45a', '#b2ec80'],
  tree2: ['#257a46', '#3fa85a', '#68c86e', '#a2e49a'],
  autumn: ['#b0561c', '#e08a2a', '#f4b844', '#ffe08a'],
  big: ['#237a36', '#3ea648', '#66c858', '#a0e47a'],
  bigautumn: ['#a8401c', '#d8702a', '#f2a444', '#ffd48a'],
  ipe: ['#b88a10', '#e8b818', '#ffd83a', '#fff09a'],
  paineira: ['#b84a7a', '#e070a0', '#ff9ac4', '#ffd0e4'],
  jeq: ['#1e6e34', '#2f9244', '#52b856', '#8ad87a'],
  pine: ['#1d5e34', '#2c7e42', '#48a058', '#7cc87a'],
  pineT: ['#165a40', '#227a52', '#3a9a66', '#76c896'],
};
const CASCA = ['#6a4428', '#8a5a36', '#a87448'];
const topoDe = (y, r, cz = -8) => ({ y, x0: -r, x1: r, z0: cz - r * 0.7, z1: cz + r * 0.7 });

function redonda({ h, R, pal, tr = 3.2, fruta, cs = CASCA }) {
  return (m, c) => {
    const cz = -8, cy = h - R * 0.95, lite = c.lite, r = m.r, d = lite ? 0 : 1;
    if (!lite) m.cil(0, 0, cz, tr * 1.25, tr * 0.85, cy - R * 0.2, 7, { pe: cs[0], topo: cs[2] }, { desvio: 0.6 });
    const rx = R * (0.98 + c.v * 0.04);
    // copa: bola grande + bolas menores em volta (fofas, um tom de diferença entre elas)
    m.bola(0, cy, cz, rx * 0.95, R * 0.86, R * 0.82, { pe: pal[0], topo: pal[2] }, { d: lite ? 0 : 1, var: 0.08, ao: false });
    const sat = lite ? [[-0.5, -0.2, 0.2, 0.62], [0.52, -0.1, 0.25, 0.6]] : [[-0.55, -0.25, 0.28, 0.62], [0.6, -0.15, 0.2, 0.6], [0.08, 0.5, 0.05, 0.62], [-0.05, -0.32, 0.55, 0.56], [0.35, 0.28, 0.42, 0.45]];
    sat.forEach(([a, b, e, s], k) => {
      const jx = (r() - 0.5) * 0.16, jy = (r() - 0.5) * 0.12;
      m.bola((a + jx) * rx, cy + (b + jy) * R, cz + e * R, rx * s, R * s * 0.92, R * s, { pe: pal[k % 2], topo: pal[2 + (k % 2)] }, { d, var: 0.08, ao: false });
    });
    if (fruta && c.estado !== 'sem' && !lite) for (let k = 0; k < 6; k++) { const a = -0.2 + (k / 5) * (Math.PI + 0.4); m.bola(Math.cos(a) * rx * 0.8, cy - R * 0.35 + r() * R * 0.8, cz + Math.sin(a) * R * 0.75 + 2, 2.2, 2.2, 2.2, fruta, { d: 0, ao: false }); }
    return topoDe(cy + R * 0.9, R * 0.8);
  };
}
function conifera({ h, R, pal, andares = 3, tr = 2.4 }) {
  return (m, c) => {
    const cz = -8, base = h * 0.16, lite = c.lite;
    if (!lite) m.cil(0, 0, cz, tr * 1.2, tr, base + 6, 6, { pe: CASCA[0], topo: CASCA[1] });
    const H = (h - base) / (andares * 0.78 + 0.25);
    for (let i = 0; i < andares; i++) {
      const k = i / andares, w = R * (1.12 - k * 0.42), y0 = base + i * H * 0.72;
      m.cone(0, y0, cz, w, H * 1.05, lite ? 7 : 10, { pe: pal[0], topo: pal[2 + (i % 2)] }, { var: 0.06, ao: false });
      // barriga arredondada embaixo de cada andar
      if (!lite) m.bola(0, y0 + 1, cz, w * 0.98, 3.2, w * 0.98, pal[1], { d: 1, ao: false });
    }
    return topoDe(base + (andares - 1) * H * 0.72 + H, R * 0.4);
  };
}
function arbusto({ w = 16, h = 12, pal = ['#3a9a40', '#5cc04e', '#8ad866'], flores = null, n = 3 }) {
  return (m, c) => {
    const cz = -8, r = m.r;
    const pos = n === 3 ? [[0, 0.5, 0, 0.62], [0.5, 0.36, 0.12, 0.46], [-0.46, 0.34, 0.16, 0.44]] : Array.from({ length: n }, (_, k) => [(k / (n - 1) - 0.5) * 1.6, 0.4 + (k % 2) * 0.12, (k % 2) * 0.12, 0.42 + (k % 2) * 0.06]);
    pos.forEach(([a, b, e, s], k) => m.bola(a * w, b * h * 1.25, cz + e * w, s * w, s * h * 1.3, s * w * 0.9, { pe: pal[0], topo: pal[1 + (k % 2)] }, { d: 1, var: 0.07 }));
    if (flores) for (let k = 0; k < 5; k++) { const a = r() * 6.28; m.bola(Math.cos(a) * w * 0.45, h * (0.6 + r() * 0.45), cz + Math.abs(Math.sin(a)) * w * 0.4 + 2, 1.7, 1.7, 1.7, flores, { d: 0, ao: false }); }
    return { y: h * 1.2, x0: -w / 2, x1: w / 2, z0: cz - w * 0.35, z1: cz + w * 0.35 };
  };
}
function pedra({ w = 24, h = 15, d = 14, pal = ['#8a8274', '#b8b0a0'] }) {
  return (m, c) => {
    const cz = -8, r = m.r;
    m.bola(0, h * 0.42, cz, w * 0.5, h * 0.62, d * 0.55, { pe: pal[0], topo: pal[1] }, { d: 1, var: 0.06 });
    m.bola(w * 0.3, h * 0.22, cz + d * 0.15, w * 0.24, h * 0.36, d * 0.3, { pe: pal[0], topo: pal[1] }, { d: 1, var: 0.06 });
    void r; return { y: h, x0: -w * 0.3, x1: w * 0.2, z0: cz - d * 0.3, z1: cz + d * 0.3 };
  };
}

// ---------- objetos ----------
function cerca({ cor = '#c8925e', vert = false, branca = false }) {
  return (m, c) => {
    const end = c.estado, ax = end === 'L' ? [0, 8] : end === 'R' ? [-8, 0] : [-8, 8];
    const corR = branca ? '#f4ecd8' : cor, pe = branca ? '#d8ccb0' : '#8a5a36';
    const poste = (x, z) => { m.cil(x, 0, z, 1.7, 1.7, 11.5, 8, { pe, topo: corR }, { desvio: 0.5 }); m.bola(x, 11.5, z, 1.75, 1.6, 1.75, corR, { d: 0, ao: false }); };
    if (!vert) {
      poste(0, -6);
      for (const y of [4.5, 9]) { const L = ax[1] - ax[0]; m.cil(ax[0], y, -6, 0.95, 0.95, L, 6, corR, { rz: -Math.PI / 2, ao: false }); }
    } else {
      poste(0, -8);
      for (const y of [4.5, 9]) m.cil(0, y, 0, 0.95, 0.95, 16, 6, corR, { rx: -Math.PI / 2, ao: false });
    }
    return topoDe(13, 2, vert ? -8 : -6);
  };
}
function poste() {
  return (m) => {
    const cor = '#3b4658';
    m.cil(0, 0, -8, 2.6, 2.2, 2, 10, cor);
    m.cil(0, 2, -8, 1.1, 0.9, 22, 8, { pe: cor, topo: '#5a6880' });
    m.cil(0, 23, -8, 1.6, 3.6, 1.6, 10, cor, { aberto: false });
    m.bola(0, 26.5, -8, 3.4, 3.2, 3.4, '#fff1b0', { d: 1, brilho: 1, ao: false });
    m.cone(0, 29, -8, 4.6, 3.6, 10, cor, { ao: false });
    return topoDe(33, 3);
  };
}
function placaMadeira(m) {
  m.cil(0, 0, -8, 1.3, 1.2, 11, 7, { pe: '#6a4428', topo: '#8a5a36' });
  m.caixa(0, 8, -7.5, 15, 9, 2.2, 1.4, '#c08a52', { seg: 1 });
  m.caixa(0, 9.6, -6.3, 11, 5.6, 0.6, 0.3, '#e0b67a', { seg: 1, ao: false });
  return topoDe(17, 6);
}

// ---------- prédios ----------
const RODAPE = '#c8bca4';
const TELHADO = { houseA: '#e0553e', houseB: '#e8673a', houseC: '#5aa84a', houseBlue: '#4a8fe0', housePink: '#f07aa8', houseYellow: '#f2b83a', houseStone: '#7a6aa8', houseStone2: '#5a8ab8', houseMiner: '#a86a3a', radioStation: '#e0553e' };
const portaX = (c) => (c.K.door ?? Math.floor(c.fw / 2)) * 16 + 8 - c.L;
const clarear = (h, k) => { const c = new THREE.Color(h); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };

function janelaLG(m, x, y, z, w = 16, h = 14) {
  m.caixa(x, y - 2, z + 0.5, w + 4, h + 4, 2, 1.2, '#fff8ea', { seg: 1, ao: false });
  m.caixa(x, y, z + 1.4, w, h, 1, 0.8, '#bfe6ff', { seg: 1, ao: false, brilho: 1 });
  m.caixa(x, y, z + 2.1, 1.4, h, 0.6, 0.3, '#fff8ea', { ao: false }); m.caixa(x, y + h / 2 - 0.7, z + 2.1, w, 1.4, 0.6, 0.3, '#fff8ea', { ao: false });
}
function casaLG(m, c) {
  const e = c.K.estilo ?? {}, wall = e.wall?.[0] ?? '#f3e6c8', roof = TELHADO[c.kind] ?? e.roof?.[0] ?? '#e0553e';
  const D = c.D, W = e.w ?? c.fw * 16, wl = W / 2 - 8, wh = e.wallH ?? 40, zf = -3, zb = -D + 5, zc = (zf + zb) / 2, dz = zf - zb;
  m.caixa(0, 0, zc, wl * 2 + 4, 6, dz + 4, 2, RODAPE, { seg: 1 });
  m.caixa(0, 2, zc, wl * 2, wh - 2, dz, 3.5, wall, { seg: 2 });
  // telhado de duas águas: duas lajes chanfradas e a cumeeira redonda
  const rx = W / 2 - 1, yb = wh - 3, yc = wh + dz * 0.55, ze = zf + 6, zn = zb - 6;
  const lado = (z0, y0) => { const L = Math.hypot(zc - z0, yc - y0), a = Math.atan2(yc - y0, Math.abs(zc - z0)), s = Math.sign(z0 - zc);
    m.add(caixaR(rx * 2, 3.6, L + 3, 1.6, 1), { x: 0, y: (y0 + yc) / 2 + 1, z: (z0 + zc) / 2, rx: s * a }, { pe: clarear(roof, -0.12), topo: roof }, { ao: false, desvio: 0.2 });
    // fiadas de telha: frisos arredondados ao longo do telhado
    for (const t of [0.22, 0.47, 0.72]) m.cil(-rx + 0.5, y0 + (yc - y0) * t + 2.6, z0 + (zc - z0) * t, 1.1, 1.1, rx * 2 - 1, 6, clarear(roof, -0.07), { rz: -Math.PI / 2, ao: false }); };
  lado(ze, yb); lado(zn, yb);
  m.cil(-rx - 1, yc + 1.2, zc, 2.6, 2.6, rx * 2 + 2, 10, clarear(roof, 0.06), { rz: -Math.PI / 2, ao: false });
  // empenas (triângulo da parede nos lados), em cor de parede
  for (const sx of [-1, 1]) { const x = sx * wl; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([x, wh - 1, sx > 0 ? zf : zb, x, wh - 1, sx > 0 ? zb : zf, x, yc - 1, zc], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([sx, 0, 0, sx, 0, 0, sx, 0, 0], 3)); m.add(g, {}, wall, { ao: false, todas: true }); }
  if (e.chimney !== false) m.caixa(rx - 18, yb, zc - 7, 9, yc - yb + 10, 8, 1.5, '#b8654a', { seg: 1, ao: false });
  // porta (na coluna da porta do 2D), degrau e janelas com floreira
  const px = portaX(c);
  m.caixa(px, 0, zf + 2.2, 28, 2.6, 8, 1.2, '#ddd2bc', { seg: 1 });
  m.caixa(px, 2, zf + 0.6, 18, 28, 2.6, 2.4, { pe: '#6a4228', topo: '#9a6a40' }, { seg: 1 });
  m.bola(px + 6, 15, zf + 2.4, 1.2, 1.2, 1.2, '#ffd24a', { d: 0, ao: false });
  const jy = wh - 23, wxs = [Math.max(-wl + 12, Math.min(-wl + 20, px - 32)), Math.min(wl - 12, Math.max(wl - 20, px + 24))];
  for (const wx of wxs) {
    janelaLG(m, wx, jy, zf, 16, 14);
    m.caixa(wx, jy - 8, zf + 2.6, 20, 4, 4.5, 1.4, '#a86a4a', { seg: 1, ao: false });
    for (let k = 0; k < 5; k++) m.bola(wx - 7.5 + k * 3.75, jy - 3.5, zf + 3.4, 1.9, 1.7, 1.9, ['#ff6b9a', '#ffd84a', '#ff8a3c', '#ffffff', '#b36bff'][(k + c.v) % 5], { d: 0, ao: false });
  }
  return { y: yc + 3, x0: -rx, x1: rx, z0: zc - 3, z1: zc + 3 };
}
const SALAO = { center: { teto: '#e8483a', faixa: '#e8483a' }, mart: { teto: '#3a7ae8', faixa: '#3a7ae8' }, lab: { teto: '#9aa4b4', faixa: '#4ab0a0' } };
function salaoLG(m, c) {
  const e = c.K.estilo ?? {}, S = SALAO[c.kind] ?? { teto: e.roof?.[0] ?? '#e8483a', faixa: e.band ?? '#e8483a' };
  const W = e.w ?? c.fw * 16, D = c.D, wl = W / 2 - 6, wh = e.wallH ?? 50, zf = -3, zb = -D + 5, zc = (zf + zb) / 2, dz = zf - zb;
  m.caixa(0, 0, zc, wl * 2 + 4, 6, dz + 4, 2, RODAPE, { seg: 1 });
  m.caixa(0, 2, zc, wl * 2, wh - 2, dz, 4, e.wall?.[0] ?? '#f8f6f2', { seg: 2 });
  m.caixa(0, 9, zf - 1, wl * 2 + 1, 4, 3, 1.5, S.faixa, { seg: 1, ao: false });
  // laje grossa e arredondada com a cor da casa (Centro vermelho, Mercado azul)
  m.caixa(0, wh - 1, zc, W - 2, 9, dz + 12, 4, { pe: clarear(S.teto, -0.12), topo: clarear(S.teto, 0.05) }, { seg: 2, ao: false, desvio: 0.3 });
  m.caixa(0, wh + 8, zc - 2, W - 22, 4, dz - 4, 2, clarear(S.teto, 0.12), { seg: 1, ao: false });
  const px = portaX(c), dw = e.door === 'double' ? 30 : 22;
  m.caixa(px, 0, zf + 3, dw + 10, 2.4, 9, 1.2, '#e2dccc', { seg: 1 });
  m.caixa(px, 2, zf + 0.8, dw + 4, 32, 2.4, 2, '#5a6878', { seg: 1, ao: false });
  m.caixa(px, 2.5, zf + 2, dw, 30, 1, 1, '#9ad8f4', { seg: 1, ao: false, brilho: 0.8 });
  for (const wx of e.wins ?? []) janelaLG(m, wx + 8 - W / 2, wh - 36, zf, 16, 14);
  if (c.kind === 'center') {
    // Poké Bola na fachada: disco liso vermelho em cima, branco embaixo, faixa e botão
    const cy = wh - 8, z = zf + 6;
    m.bola(0, cy, z, 10, 10, 3, (x, y) => (y > cy + 0.9 ? linear('#e8483a') : y < cy - 0.9 ? linear('#f6f6f6') : linear('#2a2a33')), { d: 2, ao: false, brilho: -0.25 });
    m.bola(0, cy, z + 2.6, 3, 3, 1, '#f8f8f8', { d: 1, ao: false, brilho: -0.4 });
  } else if (c.kind === 'mart') {
    m.caixa(0, wh - 14, zf + 5, 34, 12, 2.4, 2, '#2a58b8', { seg: 1, ao: false });
    m.caixa(0, wh - 12.5, zf + 6.5, 30, 9, 0.8, 1.2, '#ffffff', { seg: 1, ao: false, brilho: -0.3 });
    m.caixa(0, wh - 8.5, zf + 7, 26, 1.6, 0.6, 0.4, '#3a7ae8', { ao: false, brilho: -0.3 });
  } else m.caixa(0, wh - 14, zf + 5, 22, 10, 2.4, 2, '#2a7a70', { seg: 1, ao: false, brilho: -0.2 });
  return { y: wh + 12, x0: -W / 2 + 3, x1: W / 2 - 3, z0: zb, z1: zf };
}

// ---------- tabela ----------
const TIPOS = {
  tree: { f: redonda({ h: 50, R: 17, pal: PAL.tree }), var: 3 },
  tree2: { f: redonda({ h: 48, R: 16, pal: PAL.tree2 }), var: 3 },
  autumn: { f: redonda({ h: 48, R: 16, pal: PAL.autumn }), var: 3 },
  bigtree: { f: redonda({ h: 66, R: 22, pal: PAL.big, tr: 4.5 }), var: 3 },
  bigautumn: { f: redonda({ h: 66, R: 22, pal: PAL.bigautumn, tr: 4.5 }), var: 3 },
  ipe: { f: redonda({ h: 66, R: 22, pal: PAL.ipe, tr: 4.5 }), var: 3 },
  paineira: { f: redonda({ h: 66, R: 22, pal: PAL.paineira, tr: 4.5, cs: ['#5a4a3a', '#7a6a4a', '#9a8a5a'] }), var: 3 },
  jequitiba: { f: redonda({ h: 100, R: 34, pal: PAL.jeq, tr: 8 }), var: 2 },
  oran: { f: redonda({ h: 64, R: 21, pal: PAL.big, tr: 4.5, fruta: '#3a6ee8' }), var: 2, fruta: true },
  pecha: { f: redonda({ h: 64, R: 21, pal: PAL.big, tr: 4.5, fruta: '#ff7aa8' }), var: 2, fruta: true },
  pine: { f: conifera({ h: 56, R: 16, pal: PAL.pine }), var: 3 },
  pine2: { f: conifera({ h: 50, R: 15, pal: PAL.pine }), var: 3 },
  pineT: { f: conifera({ h: 54, R: 15, pal: PAL.pineT }), var: 3 },
  pinheiroAlto: { f: conifera({ h: 68, R: 14, pal: PAL.pine, andares: 4 }), var: 3 },
  cone: { f: (m) => { m.cil(0, 0, -8, 11, 11, 5, 10, '#3a8a3a'); m.bola(0, 9, -8, 11.5, 9, 10, { pe: '#2f8a3a', topo: '#5cc04e' }, { d: 1 }); m.bola(0, 19, -8, 7.5, 7, 7, { pe: '#3f9a40', topo: '#8ad866' }, { d: 1, ao: false }); return topoDe(26, 4); }, var: 2 },
  bush: { f: arbusto({}), var: 3 },
  moita: { f: arbusto({ w: 14, h: 10, pal: ['#2f8a3a', '#4cb04a', '#7ad05a'] }), var: 3 },
  roundbush: { f: arbusto({ w: 44, h: 18, pal: ['#2a8a44', '#46b058', '#78d070'], n: 5 }), var: 2 },
  samambaia: { f: arbusto({ w: 14, h: 8, pal: ['#2f7a3a', '#56a84a', '#8ad070'] }), var: 3 },
  boulder: { f: pedra({}), var: 3 },
  boulder2: { f: pedra({ w: 24, h: 13, d: 13 }), var: 3 },
  grayrock: { f: pedra({ pal: ['#7a7686', '#b0aebc'] }), var: 3 },
  rock: { f: pedra({ w: 14, h: 10, d: 10, pal: ['#8e8e9c', '#d0d0dc'] }), var: 3 },
  pedrinha: { f: pedra({ w: 14, h: 10, d: 11, pal: ['#7a7686', '#b8b4c0'] }), var: 3 },
  stump: { f: (m) => { m.cil(0, 0, -8, 10, 9, 9, 12, { pe: '#6a4428', topo: '#8a5a36' }, { aberto: false }); m.cil(0, 9, -8, 8.6, 8.6, 0.6, 12, '#e8c888', { aberto: false, ao: false }); return topoDe(10, 8); } },
  log: { f: (m) => { m.cil(-29, 5.5, -7, 5.5, 5.5, 58, 12, { pe: '#6a4428', topo: '#9a6a40' }, { rz: -Math.PI / 2, aberto: false, todas: true }); return { y: 11, x0: -28, x1: 28, z0: -12, z1: -2 }; } },
  fence: { f: cerca({}), estado: (o) => o.end ?? '' },
  fenceV: { f: cerca({ vert: true }) },
  wfence: { f: cerca({ branca: true }), estado: (o) => o.end ?? '' },
  wfenceV: { f: cerca({ branca: true, vert: true }) },
  lamp: { f: poste() },
  sign: { f: placaMadeira },
  mailbox: { f: (m) => { m.cil(0, 0, -8, 1.2, 1.1, 10, 7, '#8a5a36'); m.caixa(0, 9, -8, 10, 7, 6, 2.2, '#e0553e', { seg: 1 }); m.caixa(4.5, 12, -5, 1, 5, 1, 0.4, '#f2c94c', { ao: false }); return topoDe(16, 5); } },
  houseA: { f: casaLG, var: 3 }, houseB: { f: casaLG, var: 3 }, houseC: { f: casaLG, var: 3 }, houseBlue: { f: casaLG, var: 3 },
  housePink: { f: casaLG, var: 3 }, houseYellow: { f: casaLG, var: 3 }, houseStone: { f: casaLG, var: 3 }, houseStone2: { f: casaLG, var: 3 },
  center: { f: salaoLG }, mart: { f: salaoLG }, lab: { f: salaoLG },
};

function hashVar(o) {
  const x = o?.tx ?? Math.floor((o?.x ?? 0) / 16), y = o?.ty ?? Math.floor((o?.y ?? 0) / 16);
  let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0);
}
const cache = new Map();
const ARVORE = new Set(['tree', 'tree2', 'autumn', 'bigtree', 'bigautumn', 'pine', 'pine2', 'pineT', 'pinheiroAlto']);
export const temModeloLG = (kind) => !!TIPOS[kind];
// estado do objeto (fruta colhida, ponta de cerca); lite = árvore do miolo do paredão (o.ss: só a copa aparece)
export function chaveLG(kind, o = {}) {
  const T = TIPOS[kind]; if (!T) return null;
  const v = T.var ? hashVar(o) % T.var : 0;
  const e = T.estado ? T.estado(o) : T.fruta ? ((o?.semFruta || (o?.sprite && o.sprite.texture === SPR.berryless)) ? 'sem' : '') : '';
  return `${kind}|${v}|${e}|${o?.ss && ARVORE.has(kind) ? 1 : 0}`;
}
export function modeloLG(kind, o = {}) {
  const T = TIPOS[kind]; if (!T) return null;
  const k = chaveLG(kind, o); let r = cache.get(k); if (r) return r;
  const [, vs, estado, lite] = k.split('|'), v = +vs, K = KINDS[kind] ?? { fw: 1, fh: 1 };
  let seed = v * 7919 + 13; for (const ch of kind) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483000;
  const m = new MalhaLG(seed);
  const c = { K, o, v, kind, fw: K.fw ?? 1, fh: K.fh ?? 1, L: (K.fw ?? 1) * 8, D: (K.fh ?? 1) * 16, estado, lite: lite === '1' };
  const topo = T.f(m, c);
  const geometry = m.geometria(), bb = geometry.boundingBox;
  r = { geometry, topo: topo ?? { y: bb.max.y, x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z }, altura: bb.max.y, chave: k, tris: m.i.length / 3 };
  cache.set(k, r);
  return r;
}
export function trisLG() { let t = 0; for (const r of cache.values()) t += r.tris; return { tipos: cache.size, tris: t }; }
