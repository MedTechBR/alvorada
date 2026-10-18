import { tom } from './construtor.js';
import { SPR } from '../../world/art.js';

// fruta colhida: o 2D troca a textura da árvore pela sem frutas (SPR.berryless)
const semFruta = (o) => (o?.semFruta || (o?.sprite && o.sprite.texture === SPR.berryless) ? 'sem' : '');

// Natureza: árvores, arbustos, palmeiras, cactos, pedras, cristais (kit de modelos, ver docs/visual-3d-kit.md).
// Cada função recebe (m, c): m = Malha, c = { K (ficha do catálogo 2D), o (objeto), v (variante), fw, fh,
// L = meia largura da pegada, D = fundo da pegada (z de -D a 0) } e devolve o topo { y, x0, z0, x1, z1 }.
// Cores tiradas do desenho 2D de cada objeto (art.js, arte-biomas.js, folhas do Tuxemon).

const CASCA = ['#4e301c', '#6b4428', '#8a5a34'];
const topoDe = (y, r, cz = -8) => ({ y, x0: -r, x1: r, z0: cz - r * 0.7, z1: cz + r * 0.7 });

// tronco com casca: prisma de 6 lados, faixas mais claras e raízes
function tronco(m, cx, cz, r, h, cs = CASCA, o = {}) {
  m.cil(cx, 0, cz, r * 1.15, r, h, 6, cs[1], { tampa: false, var: 0.1 });
  // listras da casca: duas lascas claras na frente
  m.bloco(cx - r * 0.35, h * 0.15, cz + r * 0.82, r * 0.3, h * 0.5, 1, cs[2], { sem: ['topo'] });
  if (o.raizes !== false) {
    m.bloco(cx - r * 1.1, 0, cz + r * 0.5, r * 0.9, r * 0.7, r * 0.8, cs[0]);
    m.bloco(cx + r * 1.15, 0, cz + r * 0.2, r * 0.8, r * 0.55, r * 0.8, cs[1]);
  }
}
// copa em cubos (voxel fofo): núcleo + anéis de cubos (baixo escuro, meio, alto claro) e um brilho no topo.
// Cada cubo tem o topo um tom mais claro (lê como volume mesmo à noite). Cubos atrás do núcleo são pulados.
function copa(m, cx, cy, cz, rx, ry, rz, pal, o = {}) {
  const r = m.r, R = Math.min(rx, ry);
  const cubo = (x, y, z, s, cr, ct) => m.bloco(x, y - s / 2, z, s * (1 + r() * 0.15), s, s * (0.95 + r() * 0.1), cr, { var: 0.1, ao: false, cores: { topo: ct } });
  m.bloco(cx, cy - ry * 0.7, cz, rx * 1.35, ry * 1.25, rz * 1.3, pal[0], { ao: false, cores: { topo: pal[1] } });
  const anel = (n, raio, y, s, cr, ct, fase) => {
    for (let k = 0; k < n; k++) {
      const a = fase + (k / n) * Math.PI * 2 + (r() - 0.5) * 0.5, sa = Math.sin(a);
      if (sa < -0.55) continue; // atrás: a câmera não vê
      cubo(cx + Math.cos(a) * rx * raio, y + (r() - 0.5) * ry * 0.15, cz + sa * rz * raio, s * (0.85 + r() * 0.3), cr, ct);
    }
  };
  anel(o.n ?? 7, 0.66, cy - ry * 0.35, R * 0.68, pal[0], pal[1], 0.2);
  anel(5, 0.5, cy + ry * 0.12, R * 0.66, pal[1], pal[2], 0.9);
  anel(3, 0.3, cy + ry * 0.5, R * 0.6, pal[2], pal[3] ?? pal[2], 0.4);
  const s = R * 0.42;
  if (pal[3]) m.bloco(cx - rx * 0.2, cy + ry * 0.78, cz + rz * 0.15, s, s * 0.7, s, pal[3], { ao: false });
  return cy + ry * 0.82;
}
// frutas: cubinhos na frente da copa
function frutas(m, cx, cy, cz, rx, ry, rz, cr, n = 7) {
  const r = m.r;
  for (let k = 0; k < n; k++) {
    const a = -0.2 + (k / (n - 1)) * (Math.PI + 0.4), py = cy - ry * 0.5 + r() * ry * 1.1;
    m.bloco(cx + Math.cos(a) * rx * 0.85, py, cz + Math.sin(a) * rz * 0.85 + 2, 3.2, 3.2, 3.2, cr, { ao: false, brilho: 0 });
  }
}

// árvore redonda (folhas do Tuxemon e as grandes desenhadas por código)
function redonda({ h, R, pal, tr = 3.2, cs = CASCA, fruta, n }) {
  return (m, c) => {
    const cz = -8, cy = h - R * 0.95;
    tronco(m, 0, cz, tr, cy, cs);
    const rx = R * (0.95 + c.v * 0.05), top = copa(m, 0, cy, cz, rx, R * 0.85, R * 0.72, pal, { n });
    if (fruta && c.estado !== 'sem') frutas(m, 0, cy, cz, rx, R * 0.8, R * 0.72, fruta);
    return topoDe(top, R * 0.7, cz);
  };
}
// conífera em andares de blocos (voxel): cada andar mais estreito, com o topo um tom mais claro e a borda
// de baixo escura (as "saias" dos galhos aparecem); neve opcional nos topos; ponta em cubinhos
function conifera({ h, R, pal, andares = 4, neve = false, tr = 2.6 }) {
  return (m, c) => {
    const cz = -8, base = h * 0.14, r = m.r;
    m.bloco(0, 0, cz, tr * 2, base + 6, tr * 2, CASCA[1], { cores: { frente: CASCA[2] } });
    const H = (h - base) / (andares + 0.6);
    for (let i = 0; i < andares; i++) {
      const k = i / andares, w = R * 2 * (1 - k * 0.68), y0 = base + i * H * 0.95, dx = (r() - 0.5) * 2, hh = H * 1.05;
      const cr = pal[Math.min(pal.length - 2, i % 2)], ct = neve ? '#f4f8ff' : pal[Math.min(pal.length - 1, 2 + (i % 2))];
      m.bloco(dx, y0, cz, w, hh * 0.4, w * 0.82, pal[0], { var: 0.06, ao: i === 0, cores: { topo: cr } });
      m.bloco(dx * 0.6, y0 + hh * 0.4, cz, w * 0.82, hh * 0.6, w * 0.68, cr, { var: 0.06, ao: false, cores: { topo: ct } });
      if (neve) m.bloco(dx - w * 0.25, y0 + hh * 0.4, cz + w * 0.2, w * 0.3, hh * 0.18, w * 0.25, '#f4f8ff', { ao: false });
    }
    const yt = base + andares * H * 0.95;
    m.bloco(0, yt, cz, R * 0.5, H * 0.55, R * 0.45, pal[1], { ao: false, cores: { topo: neve ? '#ffffff' : pal[2] } });
    m.bloco(0, yt + H * 0.55, cz, R * 0.22, H * 0.4, R * 0.22, neve ? '#ffffff' : pal[2], { ao: false });
    return topoDe(yt + H, R * 0.3, cz);
  };
}
// palmeira / coqueiro: tronco em gomos (curvo), folhas compridas caindo, cocos
function palmeira({ h, curva = 0, folhas = 7, L = 18, pal = ['#2a8a3a', '#4cc25a'], gomo = ['#8a5a34', '#a8784a'], cocos = true }) {
  return (m, c) => {
    const cz = -8, n = 7; let x = 0;
    for (let i = 0; i < n; i++) {
      const k = i / n, nx = Math.sin(k * 1.6) * curva;
      m.bloco(nx, (h / n) * i, cz, 5 - k * 1.2, h / n + 0.5, 5 - k * 1.2, gomo[i % 2], { var: 0.05 });
      x = nx;
    }
    const tx = x, ty = h, r = m.r;
    for (let k = 0; k < folhas; k++) {
      const a = (k / folhas) * Math.PI * 2 + c.v * 0.4 + r() * 0.2, ca = Math.cos(a), sa = Math.sin(a) * 0.8;
      const l1 = L * 0.55, l2 = L * (0.95 + r() * 0.15), w = 3.5;
      const px = -sa, pz = ca; // perpendicular
      const p0 = [tx, ty + 1, cz], p1 = [tx + ca * l1, ty + 4, cz + sa * l1], p2 = [tx + ca * l2, ty - 6, cz + sa * l2];
      const cr = k % 2 ? pal[0] : pal[1];
      m.poli([[p0[0] - px * 1.5, p0[1], p0[2] - pz * 1.5], [p0[0] + px * 1.5, p0[1], p0[2] + pz * 1.5], [p1[0] + px * w, p1[1], p1[2] + pz * w], [p1[0] - px * w, p1[1], p1[2] - pz * w]].map((q) => q), cr, { sempre: true, ao: false });
      m.poli([[p1[0] - px * w, p1[1], p1[2] - pz * w], [p1[0] + px * w, p1[1], p1[2] + pz * w], p2], cr, { sempre: true, ao: false, k: 0.88 });
    }
    m.bloco(tx, ty - 2, cz, 6, 4, 6, '#5a9a3a', { ao: false });
    if (cocos) for (const [dx, dz] of [[-2.5, 2], [2.5, 2], [0, 3.5]]) m.bloco(tx + dx, ty - 5, cz + dz, 3.4, 3.4, 3.4, '#6a4a22', { ao: false });
    return topoDe(ty + 4, 8, cz);
  };
}
// arbusto fofo: cubos baixos em dois tons, flores opcionais
function arbusto({ w = 14, h = 11, pal = ['#2f8a3a', '#47b04e', '#8be37a'], n = 5, flores, cz = -8 }) {
  return (m, c) => {
    const r = m.r;
    m.bloco(0, 0, cz, w, h * 0.75, w * 0.7, pal[0], { var: 0.1 });
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + r(), s = w * (0.38 + r() * 0.18);
      m.bloco(Math.cos(a) * w * 0.32, h * (0.25 + r() * 0.3), cz + Math.sin(a) * w * 0.2 + 1, s, s * 0.85, s * 0.9, k % 2 ? pal[1] : pal[0], { var: 0.12 });
    }
    m.bloco(-w * 0.1, h * 0.7, cz + 1, w * 0.45, h * 0.35, w * 0.4, pal[1], { var: 0.1 });
    if (pal[2]) m.bloco(-w * 0.18, h * 0.95, cz + 2, w * 0.18, h * 0.18, w * 0.18, pal[2]);
    if (flores) for (let k = 0; k < 4; k++) m.bloco((r() - 0.5) * w * 0.7, h * (0.55 + r() * 0.35), cz + w * 0.3, 2.4, 2.4, 2.4, flores[k % flores.length], { ao: false });
    return { y: h * 1.05, x0: -w / 2, x1: w / 2, z0: cz - w * 0.35, z1: cz + w * 0.35 };
  };
}
// pedra facetada: blocos empilhados e chanfrados, 3 tons
function pedra({ w = 26, h = 16, d = 14, pal = ['#8e5555', '#a0695f', '#d08a74'], cz = -8, brilho }) {
  return (m, c) => {
    const s = 1 + (c.v - 1) * 0.06;
    m.bloco(0, 0, cz, w * s, h * 0.55, d, pal[0], { var: 0.06 });
    m.bloco(-w * 0.06, h * 0.5, cz + 0.5, w * 0.8 * s, h * 0.32, d * 0.82, pal[1], { var: 0.06 });
    m.bloco(-w * 0.12, h * 0.78, cz + 1, w * 0.5, h * 0.22, d * 0.6, pal[2], { var: 0.05 });
    m.bloco(w * 0.32, h * 0.38, cz + d * 0.25, w * 0.28, h * 0.25, d * 0.5, pal[1], { var: 0.1 });
    if (brilho) brilho(m, cz);
    return { y: h, x0: -w * 0.3, x1: w * 0.2, z0: cz - d * 0.3, z1: cz + d * 0.3 };
  };
}
// estalagmite / ponta: andares afinando
function ponta(pal) {
  return (m) => {
    m.cil(0, 0, -8, 6.5, 3.5, 12, 5, pal[0], { tampa: false });
    m.cil(1, 12, -8, 3.5, 1.5, 9, 5, pal[1], { tampa: false });
    m.cone(1.4, 21, -8, 1.6, 5, 4, pal[1]);
    m.bloco(-4, 0, -6, 4, 6, 4, pal[2]);
    return topoDe(26, 2);
  };
}
// cristal: prismas pontudos com brilho próprio
function cristal(pal, alto = 1) {
  return (m) => {
    const ponta = (x, z, h, r, a, cr) => m.com({ x, z, ry: a }, () => { m.cil(0, 0, 0, r, r * 0.9, h * 0.75, 5, cr, { tampa: false, brilho: -0.55, ao: false }); m.cone(0, h * 0.75, 0, r * 0.9, h * 0.35, 5, pal[1], { brilho: -0.7, ao: false }); });
    m.com({ z: -8 }, () => {
      ponta(0, 0, 22 * alto, 4, 0, pal[0]);
      ponta(-5, 2, 13 * alto, 2.8, 0.4, pal[0]);
      ponta(5, 1.5, 15 * alto, 3, 0.9, pal[0]);
    });
    m.bloco(0, 0, -7, 14, 3, 8, '#5a5060');
    return topoDe(24 * alto, 3);
  };
}

const PAL = {
  tux: ['#16602a', '#2a8a34', '#46b24a', '#7ad86a'],
  tux2: ['#18642e', '#2e923a', '#4cbc50', '#86e07a'],
  pine: ['#1a4a1c', '#2a6a28', '#3e8a36', '#5eaa52'],
  pineT: ['#124a32', '#18683e', '#22865a', '#58b47e'],
  autumn: ['#6a5a12', '#94841a', '#bca828', '#dcc84a'],
  big: ['#1f6e34', '#2f9a45', '#4cc25a', '#8be37a'],
  bigAutumn: ['#a8541c', '#d8802a', '#f2b048', '#ffd77a'],
  ipe: ['#b88a10', '#e8b818', '#ffd83a', '#fff09a'],
  paineira: ['#b84a7a', '#e070a0', '#ff9ac4', '#ffd0e4'],
  jeq: ['#1a5a2c', '#277a38', '#3aa04a', '#7ad86a'],
};

export const NATUREZA = {
  tree: { f: redonda({ h: 50, R: 17, pal: PAL.tux }), var: 3 },
  tree2: { f: redonda({ h: 48, R: 16, pal: PAL.tux2 }), var: 3 },
  autumn: { f: redonda({ h: 48, R: 16, pal: PAL.autumn }), var: 3 },
  pine: { f: conifera({ h: 56, R: 16, pal: PAL.pine }), var: 3 },
  pine2: { f: conifera({ h: 50, R: 15, pal: PAL.pine, andares: 3 }), var: 3 },
  pineT: { f: conifera({ h: 54, R: 15, pal: PAL.pineT }), var: 3 },
  bigtree: { f: redonda({ h: 66, R: 22, pal: PAL.big, tr: 4.5, n: 8 }), var: 3 },
  bigautumn: { f: redonda({ h: 66, R: 22, pal: PAL.bigAutumn, tr: 4.5, n: 8 }), var: 3 },
  ipe: { f: redonda({ h: 66, R: 22, pal: PAL.ipe, tr: 4.5, n: 8 }), var: 3 },
  paineira: { f: redonda({ h: 66, R: 22, pal: PAL.paineira, tr: 4.5, n: 8, cs: ['#4e3a2a', '#7a6a4a', '#9a8a5a'] }), var: 3 },
  jequitiba: { f: redonda({ h: 100, R: 34, pal: PAL.jeq, tr: 8, n: 9, cs: ['#3e2616', '#5a3a22', '#7a5236'] }), var: 2 },
  oran: { f: redonda({ h: 64, R: 21, pal: PAL.big, tr: 4.5, fruta: '#3a6ee8' }), var: 2, estado: semFruta },
  pecha: { f: redonda({ h: 64, R: 21, pal: PAL.big, tr: 4.5, fruta: '#ff7aa8' }), var: 2, estado: semFruta },
  juazeiro: { f: redonda({ h: 56, R: 22, pal: ['#2e6a2e', '#3e8a3a', '#5aaa48', '#9ad46a'], tr: 3.5, fruta: '#f2d24c', cs: ['#4a3222', '#6a4a32', '#8a6648'] }), var: 2 },
  umbu: { f: (m, c) => { // copa larga e achatada
    tronco(m, 0, -8, 4.5, 30, ['#3e2a20', '#5a4030', '#7a5a42']);
    const top = copa(m, 0, 36, -8, 28, 12, 18, ['#2a5a2e', '#3a7a3a', '#56a04a', '#8ad06a'], { n: 9 });
    return topoDe(top, 22);
  }, var: 2 },
  arvoreSelva: { f: (m, c) => {
    tronco(m, 0, -8, 6, 46, ['#3e2a1a', '#5a3e2a', '#7a5a3e']);
    m.com({ x: -11, z: -6 }, () => m.cil(0, 0, 0, 7, 0.5, 22, 3, '#5a3e2a', { tampa: false, fase: 0.3 })); // raízes tabulares
    m.com({ x: 11, z: -6 }, () => m.cil(0, 0, 0, 7, 0.5, 20, 3, '#5a3e2a', { tampa: false, fase: 2.4 }));
    for (const x of [-18, 16]) m.bloco(x, 14, -2, 1.2, 40, 1.2, '#3e8a3a', { ao: false }); // cipós
    const top = copa(m, 0, 60, -8, 32, 18, 22, ['#1a4a26', '#25683a', '#3a8e46', '#6cc05a'], { n: 9 });
    return topoDe(top, 24);
  }, var: 2 },
  mangue: { f: (m, c) => {
    for (const [x, a] of [[-18, 0.6], [-9, 0.3], [9, -0.3], [18, -0.6]]) m.com({ x, z: -8 }, () => { m.bloco(0, 0, 0, 2.5, 12, 2.5, '#6a4a2e'); m.bloco(-x * 0.25, 10, 0, Math.abs(x) * 0.6 + 2, 2.5, 2.5, '#6a4a2e'); void a; });
    m.bloco(0, 10, -8, 7, 14, 6, '#5a3a22');
    const top = copa(m, 0, 32, -8, 20, 10, 14, ['#1e5a34', '#2a7a40', '#48a050', '#7ad070']);
    return topoDe(top, 16);
  }, var: 2 },
  araucaria: { f: (m, c) => {
    m.cil(0, 0, -8, 3, 2.2, 58, 6, '#6a4a32', { tampa: false });
    for (const [y, w] of [[34, 17], [44, 15], [52, 11], [58, 8]]) {
      m.bloco(0, y - 3, -8, w * 2, 2, 2, '#4a3a2a', { ao: false });
      for (const s of [-1, 1]) {
                m.bloco(s * w, y - 4, -8, 10, 4, 8, '#2a5a3a', { var: 0.08, ao: false });
        m.bloco(s * w, y, -7.5, 7, 2, 6, '#4a8a5a', { ao: false });
      }
    }
    m.bloco(0, 58, -8, 22, 5, 12, '#2a5a3a', { ao: false }); m.bloco(0, 63, -7.5, 15, 2.5, 9, '#4a8a5a', { ao: false });
    return topoDe(66, 9);
  }, var: 2 },
  snowPine: { f: conifera({ h: 50, R: 15, pal: ['#1f5a3a', '#2f7a48', '#3a8a56'], neve: true }), var: 3 },
  snowPineBig: { f: conifera({ h: 64, R: 19, pal: ['#1a4e34', '#2a6e44', '#3a7e50'], neve: true, andares: 5 }), var: 3 },
  arvoreSeca: { f: (m) => {
    m.cil(0, 0, -8, 2.6, 1.8, 26, 5, '#4a3a2e', { tampa: false });
    const galho = (x, y, a, l, w) => m.com({ x, y, z: -8, ry: a }, () => { m.bloco(l / 2, 0, 0, l, w, w, '#4a3a2e', { ao: false }); m.bloco(l, 0, 0, w, l * 0.6, w, '#5a4a3e', { ao: false }); });
    galho(0, 18, 0.3, 9, 2); galho(0, 22, Math.PI - 0.2, 8, 2); galho(0, 26, 1.8, 6, 1.6); m.bloco(0.5, 26, -8, 1.6, 10, 1.6, '#5a4a3e');
    return topoDe(36, 3);
  } },
  palm: { f: palmeira({ h: 34, L: 16 }), var: 3 },
  palmSmall: { f: palmeira({ h: 16, L: 10, folhas: 6, cocos: false }), var: 2 },
  coqueiro: { f: palmeira({ h: 44, curva: 8, L: 20, pal: ['#2a8a3a', '#4cc25a'] }), var: 3 },
  palmeira: { f: palmeira({ h: 50, L: 17, folhas: 9, gomo: ['#9a8a7a', '#c8b8a4'], pal: ['#2f8a3a', '#5ac25a'], cocos: false }), var: 3 },
  // arbustos
  bush: { f: arbusto({}), var: 3 },
  roundbush: { f: arbusto({ w: 44, h: 22, pal: ['#206048', '#089870', '#40a868'], n: 7 }), var: 2 },
  cone: { f: (m, c) => { // arbusto cônico podado
    m.cil(0, 0, -8, 13, 9, 10, 6, '#284000', { tampa: false, var: 0.06 });
    m.cil(0, 9, -8, 11, 5, 12, 6, '#286820', { var: 0.06 }); m.cil(0, 20, -8, 6, 1, 8, 6, '#689848', { topo: '#88c868' });
    return topoDe(28, 4);
  }, var: 2 },
  folhaGigante: { f: (m) => {
    m.bloco(0, 0, -8, 2, 16, 2, '#3e7a2e');
    const folha = (a, inc, l, cr, v) => m.com({ y: 14, z: -8, ry: a }, () => { m.quad([0, 0, -1], [0, 0, 1], [l, -inc * l, 7], [l, -inc * l, -7], cr, { sempre: true, ao: false }); m.quad([l, -inc * l, -7], [l, -inc * l, 7], [l * 1.4, -inc * l * 2.2, 0], [l * 1.4, -inc * l * 2.2, 0], cr, { sempre: true, ao: false }); m.bloco(l * 0.6, -inc * l * 0.6 + 0.3, 0, l * 1.1, 0.6, 1, v, { ao: false }); });
    folha(Math.PI - 0.4, 0.25, 12, '#2e7a3a', '#6ac06a'); folha(0.4, 0.25, 12, '#2e7a3a', '#6ac06a'); folha(-Math.PI / 2 - 0.2, -0.1, 9, '#3e9a46', '#8ad87a'); folha(Math.PI / 2, 0.35, 10, '#3e9a46', '#8ad87a');
    return topoDe(20, 6);
  } },
  bambu: { f: (m) => {
    for (const [x, h, cr, z] of [[-8, 44, '#6aa84a', -10], [-2, 48, '#7ab85a', -7], [4, 40, '#5a9a3e', -11], [9, 46, '#6aa84a', -6]]) {
      for (let y = 0; y < h; y += 12) m.bloco(x, y, z, 2.6, Math.min(11.4, h - y), 2.6, cr, { var: 0.08 });
      m.bloco(x + 3, h - 6, z, 7, 1, 3, '#4a8a3a', { ao: false }); m.bloco(x - 3, h - 2, z, 6, 1, 3, '#5a9a3e', { ao: false });
    }
    return topoDe(48, 6);
  } },
  // cactos
  cactus: { f: (m) => {
    const g = '#3e9a4a';
    m.bloco(0, 0, -8, 6, 26, 6, g, { var: 0.05, cores: { topo: '#7ad06a' } });
    m.bloco(-6, 10, -8, 6, 3, 3.5, g); m.bloco(-8, 10, -8, 3, 10, 3.5, g, { cores: { topo: '#7ad06a' } });
    m.bloco(5, 14, -8, 5, 3, 3.5, g); m.bloco(7, 14, -8, 3, 8, 3.5, g, { cores: { topo: '#7ad06a' } });
    return topoDe(26, 3);
  } },
  mandacaru: { f: (m) => {
    const g = '#4a9a6a', l = '#8ad09a';
    m.bloco(0, 0, -8, 6, 10, 6, '#6a8a4a');
    m.bloco(0, 10, -8, 26, 5, 5, g);
    for (const [x, h] of [[0, 34], [-9, 22], [9, 26], [-13, 14], [13, 16]]) m.bloco(x, 10, -8, 5, h, 5, g, { var: 0.06, cores: { topo: l } });
    m.bloco(0, 44, -7, 4, 3, 4, '#ff7ab0', { ao: false });
    return topoDe(44, 3);
  } },
  xiquexique: { f: (m) => {
    const g = '#4a8a5a';
    for (const [x, z, w, h, d] of [[-7, -6, 9, 5, 6], [-1, -9, 5, 13, 5], [7, -7, 9, 5, 5], [-4, -10, 3.5, 9, 3.5], [8, -10, 3.5, 8, 3.5]]) m.bloco(x, 0, z, w, h, d, g, { var: 0.08, cores: { topo: '#8ad09a' } });
    m.bloco(-4, 9, -10, 2.5, 2, 2.5, '#ff8ac0', { ao: false });
    return topoDe(13, 4);
  } },
  // troncos caídos e tocos
  log: { f: (m) => {
    m.com({ z: -7 }, () => {
      m.bloco(0, 0, 0, 60, 11, 11, '#79584f', { var: 0.05, cores: { topo: '#8f7357' } });
      m.bloco(-30.5, 0.8, 0, 1, 9.4, 9.4, '#d0b068', { sem: ['frente', 'topo', 'leste'] });
      m.bloco(30.5, 0.8, 0, 1, 9.4, 9.4, '#e0d078', { sem: ['frente', 'topo', 'oeste'] });
      m.bloco(-8, 8, 2, 8, 4, 4, '#573b3b'); m.bloco(12, 10.5, 0, 3, 3, 3, '#3a8a3a');
    });
    return { y: 11, x0: -28, x1: 28, z0: -12, z1: -2 };
  } },
  stump: { f: (m) => { m.cil(0, 0, -8, 11, 9.5, 10, 7, '#79584f', { topo: '#e0d078', var: 0.05 }); m.cil(0, 10, -8, 5, 5, 0.4, 7, '#d0b068'); m.bloco(-11, 0, -4, 6, 4, 5, '#573b3b'); m.bloco(10, 0, -6, 5, 3, 5, '#573b3b'); return topoDe(10, 8); } },
  driftwood: { f: (m) => { m.com({ z: -8, ry: 0.15 }, () => { m.bloco(0, 0, 0, 36, 4.5, 4.5, '#b8a48a', { cores: { topo: '#d8c8b0' } }); m.bloco(10, 3, -1, 2, 5, 2, '#9a8670'); }); return topoDe(4.5, 14); } },
  // pedras
  boulder: { f: pedra({}), var: 3 },
  boulder2: { f: pedra({ w: 24, h: 13, d: 13 }), var: 3 },
  grayrock: { f: pedra({ pal: ['#746e7e', '#9393a3', '#bcafc0'] }), var: 3 },
  rock: { f: pedra({ w: 14, h: 10, d: 10, pal: ['#8e8e9c', '#b0b0bf', '#d4d4e0'] }), var: 3 },
  pedregulho: { f: pedra({ w: 28, h: 18, d: 14, pal: ['#5a5660', '#6a6670', '#8a8690'] }), var: 2 },
  strengthRock: { f: pedra({ w: 15, h: 16, d: 13, pal: ['#6a6676', '#8e8a98', '#aeaab8'] }) },
  obsidianRock: { f: pedra({ w: 18, h: 16, d: 12, pal: ['#1a1624', '#2a2238', '#3a2e56'], brilho: (m, cz) => m.bloco(-2, 12, cz + 4, 1.5, 3, 1, '#c8b0ff', { brilho: -0.8 }) }) },
  lavaRock: { f: pedra({ w: 24, h: 15, d: 13, pal: ['#2a2224', '#3a2e30', '#544446'], brilho: (m, cz) => { m.bloco(-3, 2, cz + 6.6, 12, 1.4, 0.4, '#ff8a2a', { brilho: -1, ao: false }); m.bloco(2, 2, cz + 6.6, 1.4, 7, 0.4, '#ff8a2a', { brilho: -1, ao: false }); m.bloco(5, 8.6, cz + 2, 1.4, 0.4, 6, '#ffd060', { brilho: -1, ao: false }); } }), var: 2 },
  stalagmite: { f: ponta(['#8a7868', '#b09c88', '#5e4e44']) },
  stalagmiteIce: { f: ponta(['#8ac4e8', '#d8f2ff', '#5a96c8']) },
  crystal: { f: cristal(['#4ad8d8', '#a8fff8']) },
  crystalPink: { f: cristal(['#d85ad8', '#ffb0f4']) },
  cristal: { f: cristal(['#5ae8e0', '#d8fffa'], 0.9) },
  iceBlock: { f: (m) => { m.bloco(0, 0, -8, 14, 15, 13, '#8ac8ec', { cores: { topo: '#c8ecff' } }); m.bloco(-3, 6, -1.4, 1, 6, 0.4, '#e8f8ff', { ao: false }); return topoDe(15, 6); } },
  menhir: { f: (m) => { m.cil(0, 0, -8, 6.5, 4, 34, 5, '#8a8a96', { topo: '#a8a8b4', var: 0.05 }); m.bloco(0, 14, -4.6, 2, 2, 1, '#c8b04a', { ao: false }); m.bloco(0, 20, -4.9, 2, 2, 1, '#c8b04a', { ao: false }); m.bloco(-4, 0, -4, 5, 4, 3, '#5ab45a'); return topoDe(34, 3); } },
  skull: { f: (m) => { m.bloco(0, 0, -8, 9, 7, 8, '#ece4d4', { cores: { topo: '#f8f2e4' } }); m.bloco(-2, 3, -3.9, 2, 2, 0.4, '#3a3030'); m.bloco(2, 3, -3.9, 2, 2, 0.4, '#3a3030'); for (const s of [-1, 1]) { m.bloco(s * 6, 4, -8, 4, 2, 2, '#ece4d4'); m.bloco(s * 8.5, 5, -9, 2, 2, 2, '#ece4d4'); } return topoDe(7, 4); } },
  snowman: { f: (m) => { m.bloco(0, 0, -8, 13, 12, 12, '#f4f8ff'); m.bloco(0, 12, -8, 9, 9, 9, '#ffffff'); m.bloco(0, 12, -8, 11, 2, 11, '#e8584a'); m.bloco(0, 16, -3, 1.6, 1.6, 3, '#ff8a2a'); m.bloco(-2, 18, -3.4, 1, 1, 0.4, '#2a2a2a'); m.bloco(2, 18, -3.4, 1, 1, 0.4, '#2a2a2a'); m.bloco(0, 21, -8, 10, 1.5, 10, '#2a2a2a'); m.bloco(0, 22.5, -8, 6.5, 5, 6.5, '#2a2a2a'); return topoDe(27, 3); } },
};
export { copa, tronco, arbusto, pedra, PAL, CASCA, topoDe };
