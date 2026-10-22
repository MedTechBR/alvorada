import * as THREE from 'three';

// Construtor de malhas low-poly em blocos (kit de modelos do visual 3D).
// Tudo em px de mundo, eixos do 3D: x = leste, y = altura, z = sul (a câmera olha para o norte, de cima, a 55°).
// Origem = ponto do pé do objeto no 2D (o.x, o.y): a pegada vai de x = -fw*8 a fw*8 e de z = -fh*16 a 0.
//
// Cada face recebe cor por vértice já "iluminada" de mentira (topo claro, frente média, lados e fundo escuros),
// com oclusão de ambiente assada perto do chão. Faces que a câmera do jogo nunca vê (viradas para o norte ou para
// baixo) são descartadas na montagem: uma caixa no chão custa 4 faces (8 triângulos), não 12.
// Saída: BufferGeometry indexada com position, normal, color (linear) e aBrilho:
//   aBrilho > 0: luz quente de janela/lampião que acende à noite (0..1);
//   aBrilho < 0: brilho próprio na cor da face, sempre (cristais, lava, fogo), mais forte no escuro.

// Esticão vertical: a câmera a 55° encurta o que é vertical para 0,57 e o chão para 0,82. Com as alturas
// multiplicadas por 1,4, as proporções na tela ficam as do desenho 2D (um cubo parece cubo, uma porta tem o
// tamanho do treinador). Os modelos são escritos em "px do 2D"; o topo devolvido já vem esticado.
export const EY = 1.0; // era 1,4 com a câmera a 55°; com a câmera baixa de exploração (30°) as alturas ficam reais

const LIN = new Map();
// '#rrggbb' ou 0xrrggbb (sRGB) -> [r, g, b] linear (o que o three espera em cores por vértice)
export function cor(c) {
  if (Array.isArray(c)) return c;
  let r = LIN.get(c); if (r) return r;
  const n = typeof c === 'string' ? parseInt(c.slice(1), 16) : c;
  r = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.pow(v / 255, 2.2));
  LIN.set(c, r); return r;
}
// mistura e escala em sRGB (para derivar tons de uma cor do catálogo 2D)
export function tom(c, k) {
  const n = typeof c === 'string' ? parseInt(c.slice(1), 16) : c;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
export function mistura(a, b, k) {
  const A = typeof a === 'string' ? parseInt(a.slice(1), 16) : a, B = typeof b === 'string' ? parseInt(b.slice(1), 16) : b;
  const ch = (s) => Math.round(((A >> s) & 255) * (1 - k) + ((B >> s) & 255) * k);
  return '#' + [ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// direções de onde a câmera do jogo pode ver uma face (elevação 35° a 75°, para os lados até 35°)
const VISTAS = [];
for (const e of [35, 55, 75]) for (const a of [-35, 0, 35]) {
  const er = e * Math.PI / 180, ar = a * Math.PI / 180;
  VISTAS.push([Math.cos(er) * Math.sin(ar), Math.sin(er), Math.cos(er) * Math.cos(ar)]);
}
const visivel = (nx, ny, nz) => { for (const v of VISTAS) if (nx * v[0] + ny * v[1] + nz * v[2] > 0.02) return true; return false; };

// luz de mentira por orientação da face: topo 1, frente (sul) ~0.82, oeste ~0.72, leste ~0.62, baixo ~0.42
const luzFalsa = (nx, ny, nz) => Math.max(0.42, Math.min(1, 0.72 + 0.28 * ny + 0.1 * nz - 0.05 * nx - 0.05 * Math.abs(nx) - (ny < 0 ? 0.2 * -ny : 0)));

// gerador pseudoaleatório pequeno e determinístico (variantes estáveis)
export function rng(seed) { let s = (Math.abs(Math.floor(seed)) % 2147483646) + 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

export class Malha {
  constructor(seed = 1) {
    this.p = []; this.n = []; this.c = []; this.b = []; this.i = [];
    this.T = { x: 0, y: 0, z: 0, cs: 1, sn: 0, s: 1, sy: EY };
    this.pilha = [];
    this.r = rng(seed);
    this.aoH = 12; // altura até onde o chão escurece o pé das coisas
    this.todas = false; // true: não descarta faces escondidas (vitrine girando, por exemplo)
  }
  get tris() { return this.i.length / 3; }
  // transformação local: desloca, gira em torno de y (radianos) e escala; vale dentro de fn
  com({ x = 0, y = 0, z = 0, ry = 0, s = 1 }, fn) {
    this.pilha.push(this.T);
    const P = this.T, c = Math.cos(ry), sn = Math.sin(ry);
    const [ox, oy, oz] = this.#tp(x, y, z);
    this.T = { x: ox, y: oy, z: oz, cs: P.cs * c - P.sn * sn, sn: P.sn * c + P.cs * sn, s: P.s * s, sy: P.sy * s };
    try { fn(); } finally { this.T = this.pilha.pop(); }
    return this;
  }
  #tp(x, y, z) { const T = this.T; x *= T.s; y *= T.sy; z *= T.s; return [T.x + x * T.cs + z * T.sn, T.y + y, T.z - x * T.sn + z * T.cs]; }

  // polígono convexo (pontos em ordem anti-horária vistos de fora); o = { brilho, k (escala de luz), ao: false, var }
  poli(pts, c, o = {}) {
    const P = pts.map((q) => this.#tp(q[0], q[1], q[2]));
    const [a, b, d] = [P[0], P[1], P[P.length - 1]];
    let nx = (b[1] - a[1]) * (d[2] - a[2]) - (b[2] - a[2]) * (d[1] - a[1]);
    let ny = (b[2] - a[2]) * (d[0] - a[0]) - (b[0] - a[0]) * (d[2] - a[2]);
    let nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    const L = Math.hypot(nx, ny, nz); if (L < 1e-9) return this;
    nx /= L; ny /= L; nz /= L;
    if (!this.todas && !o.sempre && !visivel(nx, ny, nz)) return this;
    const base = cor(c), k0 = luzFalsa(nx, ny, nz) * (o.k ?? 1) * (1 + (o.var ? (this.r() - 0.5) * o.var : 0));
    const br = o.brilho ?? 0, v0 = this.p.length / 3;
    for (const q of P) {
      const ao = o.ao === false ? 1 : 0.6 + 0.4 * Math.min(1, Math.max(0, q[1] / (this.aoH * EY)));
      const k = k0 * ao;
      this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); this.c.push(base[0] * k, base[1] * k, base[2] * k); this.b.push(br);
    }
    for (let j = 1; j < P.length - 1; j++) this.i.push(v0, v0 + j, v0 + j + 1);
    return this;
  }
  quad(a, b, c, d, cr, o) { return this.poli([a, b, c, d], cr, o); }
  tri(a, b, c, cr, o) { return this.poli([a, b, c], cr, o); }

  // caixa alinhada; o.cores = { topo, frente, lado } para pintar faces diferentes; o.sem = ['topo', 'frente', ...]
  caixa(x0, y0, z0, x1, y1, z1, c, o = {}) {
    const cs = o.cores ?? {}, sem = o.sem ?? [];
    const f = (nome, pts, cc) => { if (!sem.includes(nome)) this.poli(pts, cc ?? c, o); };
    f('topo', [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], cs.topo);
    f('frente', [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], cs.frente);
    f('leste', [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], cs.lado);
    f('oeste', [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], cs.lado);
    f('tras', [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], cs.tras);
    f('baixo', [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], cs.baixo);
    return this;
  }
  // caixa pelo centro da base e tamanho
  bloco(cx, y0, cz, w, h, d, c, o) { return this.caixa(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, c, o); }
  // octaedro facetado (gema / copa redonda em poucas faces)
  octa(cx, cy, cz, rx, ry, rz, c, o = {}) {
    const T = [cx, cy + ry, cz], B = [cx, cy - ry, cz], E = [cx + rx, cy, cz], W = [cx - rx, cy, cz], S = [cx, cy, cz + rz], N = [cx, cy, cz - rz];
    const cb = o.baixo ?? c;
    this.tri(T, S, E, c, o).tri(T, E, N, c, o).tri(T, N, W, c, o).tri(T, W, S, c, o);
    this.tri(B, E, S, cb, o).tri(B, N, E, cb, o).tri(B, W, N, cb, o).tri(B, S, W, cb, o);
    return this;
  }
  // prisma de n lados, afinando (r0 embaixo, r1 em cima); o.tampa = false sem o topo; o.fase gira os lados
  cil(cx, y0, cz, r0, r1, h, n, c, o = {}) {
    const f = o.fase ?? Math.PI / n, pts0 = [], pts1 = [];
    for (let k = 0; k < n; k++) { const a = f + k / n * Math.PI * 2; pts0.push([cx + Math.cos(a) * r0, y0, cz + Math.sin(a) * r0 * (o.achata ?? 1)]); pts1.push([cx + Math.cos(a) * r1, y0 + h, cz + Math.sin(a) * r1 * (o.achata ?? 1)]); }
    for (let k = 0; k < n; k++) { const j = (k + 1) % n; this.quad(pts0[j], pts0[k], pts1[k], pts1[j], o.lados ?? c, o); }
    if (o.tampa !== false && r1 > 0.01) this.poli(pts1.slice().reverse(), o.topo ?? c, o);
    return this;
  }
  // pirâmide/cone de n lados sobre base circular
  cone(cx, y0, cz, r, h, n, c, o = {}) {
    const f = o.fase ?? Math.PI / n, ap = [cx, y0 + h, cz], pts = [];
    for (let k = 0; k < n; k++) { const a = f + k / n * Math.PI * 2; pts.push([cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r * (o.achata ?? 1)]); }
    for (let k = 0; k < n; k++) this.tri(pts[(k + 1) % n], pts[k], ap, c, o);
    return this;
  }
  // telhado de duas águas com a cumeeira leste-oeste: x0..x1, beiral em ze (sul) e zn (norte), do beiral (yb) à cumeeira (yc em zc)
  aguas(x0, x1, zn, ze, yb, zc, yc, c, o = {}) {
    this.quad([x0, yb, ze], [x1, yb, ze], [x1, yc, zc], [x0, yc, zc], c, o); // água da frente
    this.quad([x1, yb, zn], [x0, yb, zn], [x0, yc, zc], [x1, yc, zc], o.tras ?? c, o); // água de trás
    return this;
  }

  // BufferGeometry pronta (para mesclar, desenhar ou cachear)
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

// junta várias geometrias do kit numa só, já deslocadas (x, y, z) e opcionalmente com um tom (k).
// itens: [{ geometry, x, y, z, k? }]. Muito mais rápido que clonar + mergeGeometries.
export function mesclar(itens) {
  let nv = 0, ni = 0;
  for (const it of itens) { nv += it.geometry.attributes.position.count; ni += it.geometry.index.count; }
  const pintado = itens.some(it => it.geometry.attributes.aPintura);
  const P = new Float32Array(nv * 3), N = pintado ? new Int16Array(nv * 3) : new Float32Array(nv * 3), C = new Float32Array(nv * 3), B = new Float32Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const UV = pintado ? new Uint16Array(nv * 3) : null;
  let ov = 0, oi = 0;
  for (const it of itens) {
    const g = it.geometry, p = g.attributes.position.array, n = g.attributes.normal.array, c = g.attributes.color.array, b = g.attributes.aBrilho.array, idx = g.index.array;
    const mesmaNormal=!!g.attributes.normal.normalized===pintado;
    // A maioria das peças já tem o formato de destino: copia sem reconverter cada vértice.
    if(mesmaNormal)N.set(n,ov*3);
    const escalaN = (g.attributes.normal.normalized ? 1/32767 : 1) * (pintado ? 32767 : 1);
    const x = it.x ?? 0, y = it.y ?? 0, z = it.z ?? 0, k = it.k ?? 1, cnt = p.length / 3;
    for (let v = 0; v < cnt; v++) {
      const s = v * 3, d = (ov + v) * 3;
      P[d] = p[s] + x; P[d + 1] = p[s + 1] + y; P[d + 2] = p[s + 2] + z;
      if(!mesmaNormal){N[d] = Math.round(n[s]*escalaN); N[d + 1] = Math.round(n[s + 1]*escalaN); N[d + 2] = Math.round(n[s + 2]*escalaN);}
      C[d] = c[s] * k; C[d + 1] = c[s + 1] * k; C[d + 2] = c[s + 2] * k;
      B[ov + v] = b[v];
      if (UV && g.attributes.aPintura) { const a = g.attributes.aPintura.array; UV[d] = a[s]; UV[d + 1] = a[s + 1]; UV[d + 2] = a[s + 2]; }
    }
    for (let j = 0; j < idx.length; j++) I[oi + j] = idx[j] + ov;
    ov += cnt; oi += idx.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3, pintado));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  g.setAttribute('aBrilho', new THREE.BufferAttribute(B, 1));
  if (UV) g.setAttribute('aPintura', new THREE.BufferAttribute(UV, 3));
  g.setIndex(new THREE.BufferAttribute(I, 1));
  g.computeBoundingSphere();
  return g;
}

// material dos modelos: Lambert com cor por vértice + brilho noturno (janelas, lampiões, cristais).
// uNoite (0 = dia, 1 = noite) é compartilhado: material(). uniforms... ou kit.noite(valor).
export function criarMaterial(uNoite = { value: 0 }) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNoite = uNoite;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aBrilho; varying float vBrilho;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBrilho = aBrilho;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uNoite; varying float vBrilho;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(1.0, 0.74, 0.38) * max(vBrilho, 0.0) * uNoite * 1.5
          + diffuseColor.rgb * max(-vBrilho, 0.0) * (0.35 + 0.9 * uNoite);`);
  };
  m.customProgramCacheKey = () => 'kit-modelos';
  return m;
}
