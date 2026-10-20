import * as THREE from 'three';
import { TILE } from '../world/tiles.js';

// Paredes das salas (casa de boneca, como no protótipo): a parede do fundo e as laterais ficam em pé, altas,
// com papel de parede, faixa e rodapé; a da frente fica baixinha para a câmera ver dentro. O vazio entre as salas
// é preto. A sala vem do mapa (interiores); o piso andável é o que não é parede nem vazio.
// Cada sala é montada pelo setor que contém o canto de cima à esquerda dela.
const ALTA = 54, BAIXA = 7, ESP = 7;
const C = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
// texturas de piso e parede (assets/hgss/texturas/interior, 32x32): uma imagem por tile de 16 unidades, pixel seco
const texs = new Map();
function texInterior(nome) {
  if (!texs.has(nome)) {
    const t = new THREE.TextureLoader().load(new URL(`../../assets/hgss/texturas/interior/${nome}.webp`, import.meta.url).href);
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
    texs.set(nome, t);
  }
  return texs.get(nome);
}
// material de piso ou parede por textura (compartilhado entre os setores)
export function materialSala(v, chave) {
  const mats = v.salasMats ??= new Map();
  if (!mats.has(chave)) {
    const piso = chave.startsWith('floor');
    const m = v.curvar(piso ? new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }) : v.setores.matParedeNovo());
    m.map = texInterior(chave); m.needsUpdate = true; mats.set(chave, m);
  }
  return mats.get(chave);
}
function pisoDe(r) {
  const id = (r.id ?? '') + ' ' + (r.name ?? '');
  if (/centro|center/i.test(id)) return 'floor_center';
  if (/loja|mart|mercado/i.test(id)) return 'floor_mart';
  if (/lab|escritorio|redacao|estufa/i.test(id)) return 'floor_lab';
  if (/mina|caverna|gruta|toca/i.test(id) || r.dark) return 'floor_rock';
  return 'floor_wood';
}
function paredeDe(r) { return /lab|escritorio|redacao/i.test((r.id ?? '') + ' ' + (r.name ?? '')) ? 'wall_lab' : 'wallpaper_cream'; }
// uv de um quad: faces verticais pelo eixo horizontal (x ou z) e pela altura, em tiles de 16; tampos sem textura
function uvDe(uv, a, b, c, d) {
  if (a[1] === b[1] && a[1] === c[1] && a[1] === d[1]) { uv.push(0, 0, 0, 0, 0, 0, 0, 0); return; }
  const hz = a[0] === b[0] && b[0] === c[0] ? 2 : 0;
  for (const p of [a, b, c, d]) uv.push(p[hz] / 16, p[1] / 16);
}
function geometriaDe(b) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(b.cor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
  g.setIndex(b.idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
// paleta por bioma da sala (papel, listra, rodapé, faixa)
const PALETA = {
  padrao: ['#f2e8d2', '#e6d8b8', '#8a5a34', '#c8a874'],
  centro: ['#f6f2ee', '#efe2de', '#c84a3c', '#e8907e'],
  loja: ['#eef4f8', '#dde8f0', '#3a6ad8', '#8ab0e8'],
  caverna: ['#7a6a5e', '#6a5a50', '#4a3a30', '#8a7a6a'],
  templo: ['#d8ccb0', '#c8b898', '#7a6a4a', '#b0a070'],
};
function paleta(r) {
  const id = (r.id ?? '') + ' ' + (r.name ?? '');
  if (/centro|center/i.test(id)) return PALETA.centro;
  if (/loja|mart|mercado/i.test(id)) return PALETA.loja;
  if (/mina|caverna|gruta|toca/i.test(id) || r.dark) return PALETA.caverna;
  if (/templo|ruina/i.test(id)) return PALETA.templo;
  return PALETA.padrao;
}

// Luz do sol pela janela: um feixe inclinado (dois planos aditivos) e a mancha clara no piso. Leve: sem luz dinâmica.
let matLuz = null;
function texLuz() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(255,236,190,0.0)'); g.addColorStop(0.25, 'rgba(255,236,190,0.75)'); g.addColorStop(1, 'rgba(255,236,190,0.0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const h = x.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.15, 'rgba(0,0,0,0)'); h.addColorStop(0.85, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
  x.globalCompositeOperation = 'destination-out'; x.fillStyle = h; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function luzDasJanelas(v, sx, sy) {
  const js = v.salasJanelas?.get(sx + ',' + sy); if (!js?.length) return null;
  matLuz ??= v.curvar(new THREE.MeshBasicMaterial({ map: texLuz(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.3 }));
  const pos = [], uv = [], idx = [];
  const q = (a, b, c, d) => { const n = pos.length / 3; pos.push(...a, ...b, ...c, ...d); uv.push(0, 1, 1, 1, 1, 0, 0, 0); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  for (const j of js) {
    const y0 = j.h + 0.6, top = j.h + 44, bot = j.h + 24, dx = -34, len = 84; // o sol vem do alto, um pouco da direita
    // mancha no piso (paralelogramo deitado)
    q([j.x - 20 + dx, y0, j.z + len], [j.x + 20 + dx, y0, j.z + len], [j.x + 18, y0, j.z + 14], [j.x - 18, y0, j.z + 14]); q([j.x - 20 + dx, y0 + 0.1, j.z + len], [j.x + 20 + dx, y0 + 0.1, j.z + len], [j.x + 18, y0 + 0.1, j.z + 14], [j.x - 18, y0 + 0.1, j.z + 14]);
    // feixe: da janela até a mancha
    // (os dois planos aditivos do feixe passavam na frente de quem andava na sala e deixavam o boneco branco, sem cor: só a mancha no piso fica)
    void top; void bot;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const m = new THREE.Mesh(g, matLuz); m.renderOrder = 8; return m;
}

export function paredesDasSalas(v, sx, sy) {
  const L = v.L, R = v.relevo;
  // uma malha por textura (papel de parede ou parede de laboratório)
  const baldes = new Map(), bucket = (chave) => { if (!baldes.has(chave)) baldes.set(chave, { chave, pos: [], cor: [], uv: [], idx: [] }); return baldes.get(chave); };
  let B = bucket('wallpaper_cream');
  const quad = (a, b, c, d, k) => { const n = B.pos.length / 3; B.pos.push(...a, ...b, ...c, ...d); uvDe(B.uv, a, b, c, d); for (let i = 0; i < 4; i++) B.cor.push(...k); B.idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  // caixa com a face principal virada para +z (sul); rot = 0 sul, 1 leste (+x), -1 oeste (-x)
  const caixa = (x0, y0, z0, x1, y1, z1, k, kt = k.map((q) => q * 0.55)) => {
    const ks = k.map((q) => q * 0.8);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], k);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], ks);
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], ks);
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], ks);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], kt);
  };
  const janelas = [];
  const piso = (x, y) => { const t = L.bloco(x, y); return t !== TILE.WALL && t !== TILE.VOID; };
  for (const r of L.interiores ?? []) {
    if (Math.floor(r.x / 16) !== sx || Math.floor(r.y / 16) !== sy) continue;
    const [papel, listra, rodape, faixa] = paleta(r).map(C);
    B = bucket(paredeDe(r));
    const topo = C('#3a3430');
    const h = R.em(r.x * 16 + r.w * 8, r.y * 16 + r.h * 8);
    // parede de fundo: para cada coluna, o primeiro piso de cima para baixo
    const fundo = (x) => { for (let y = r.y; y < r.y + r.h; y++) if (piso(x, y)) return y; return null; };
    const baixo = (x) => { for (let y = r.y + r.h - 1; y >= r.y; y--) if (piso(x, y)) return y; return null; };
    // janela na parede do fundo (a 2/3 da sala), com a luz do sol entrando e caindo no piso
    const jx = Math.floor(r.x + r.w * 0.66), jy = fundo(jx);
    if (jy != null && r.w >= 7 && !r.dark && !r.escuro) janelas.push({ x: jx * 16 + 8, z: jy * 16, h });
    for (let x = r.x; x < r.x + r.w; x++) {
      const yf = fundo(x); if (yf == null) continue;
      const X0 = x * 16, X1 = X0 + 16, Z = yf * 16;
      caixa(X0, h, Z - ESP, X1, h + ALTA, Z, papel, topo);
      if (x % 2 === 0) quad([X0 + 5, h + 10, Z + 0.05], [X0 + 8, h + 10, Z + 0.05], [X0 + 8, h + ALTA - 3, Z + 0.05], [X0 + 5, h + ALTA - 3, Z + 0.05], listra);
      caixa(X0, h + 13, Z, X1, h + 15, Z + 0.9, faixa);
      caixa(X0, h, Z, X1, h + 5, Z + 1.3, rodape);
      // frente baixinha
      const yb = baixo(x); if (yb != null) caixa(X0, h, (yb + 1) * 16, X1, h + BAIXA, (yb + 1) * 16 + ESP, papel.map((q) => q * 0.85), topo);
    }
    // laterais: para cada linha, o primeiro piso da esquerda e o último da direita
    for (let y = r.y; y < r.y + r.h; y++) {
      let xa = null, xb = null;
      for (let x = r.x; x < r.x + r.w; x++) if (piso(x, y)) { xa ??= x; xb = x; }
      if (xa == null) continue;
      const Z0 = y * 16, Z1 = Z0 + 16, frente = !piso(xa, y + 1) && y > r.y + 1;
      const H = frente ? BAIXA : ALTA;
      caixa(xa * 16 - ESP, h, Z0, xa * 16, h + H, Z1, papel.map((q) => q * 0.92), topo);
      caixa(xa * 16, h, Z0, xa * 16 + 1.3, h + 5, Z1, rodape);
      caixa((xb + 1) * 16, h, Z0, (xb + 1) * 16 + ESP, h + H, Z1, papel.map((q) => q * 0.8), topo);
      caixa((xb + 1) * 16 - 1.3, h, Z0, (xb + 1) * 16, h + 5, Z1, rodape);
    }
  }
  // moldura e vidro das janelas (o vidro brilha de leve; a luz no chão é janelaLuz, aditiva)
  B = bucket('wallpaper_cream');
  for (const j of janelas) {
    const X0 = j.x - 13, X1 = j.x + 13, Y0 = j.h + 22, Y1 = j.h + 46, Z = j.z + 0.15, mold = C('#8a5a34'), vidro = [1.15, 1.25, 1.35];
    quad([X0 - 2, Y0 - 2, Z], [X1 + 2, Y0 - 2, Z], [X1 + 2, Y1 + 2, Z], [X0 - 2, Y1 + 2, Z], mold);
    quad([X0, Y0, Z + 0.1], [X1, Y0, Z + 0.1], [X1, Y1, Z + 0.1], [X0, Y1, Z + 0.1], vidro);
    quad([j.x - 0.8, Y0, Z + 0.2], [j.x + 0.8, Y0, Z + 0.2], [j.x + 0.8, Y1, Z + 0.2], [j.x - 0.8, Y1, Z + 0.2], mold);
    quad([X0, (Y0 + Y1) / 2 - 0.8, Z + 0.2], [X1, (Y0 + Y1) / 2 - 0.8, Z + 0.2], [X1, (Y0 + Y1) / 2 + 0.8, Z + 0.2], [X0, (Y0 + Y1) / 2 + 0.8, Z + 0.2], mold);
    quad([X0 - 4, Y0 - 3, Z], [X1 + 4, Y0 - 3, Z], [X1 + 4, Y0 - 1, Z + 3], [X0 - 4, Y0 - 1, Z + 3], C('#f4eee2'));
  }
  v.salasJanelas = (v.salasJanelas ?? new Map()); v.salasJanelas.set(sx + ',' + sy, janelas);
  return [...baldes.values()].filter((b) => b.idx.length).map((b) => ({ chave: b.chave, g: geometriaDe(b) }));
}

// Piso das salas: um quad por tile andável, com a textura do tipo da sala (centro, mercado, laboratório, madeira).
// Fica um pouco acima do chão do relevo (o polygonOffset do material evita z-fighting). Cor levemente quente.
export function pisosDasSalas(v, sx, sy) {
  const L = v.L, R = v.relevo, baldes = new Map();
  for (const r of L.interiores ?? []) {
    if (Math.floor(r.x / 16) !== sx || Math.floor(r.y / 16) !== sy) continue;
    const chave = pisoDe(r);
    if (!baldes.has(chave)) baldes.set(chave, { chave, pos: [], cor: [], uv: [], idx: [] });
    const b = baldes.get(chave);
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
      if (Math.floor(x / 16) !== sx || Math.floor(y / 16) !== sy) continue;
      const t = L.bloco(x, y); if (t !== TILE.FLOOR && t !== TILE.TILEFLOOR) continue;
      const hn = R.n(x, y) + 0.6, hs = R.s(x, y) + 0.6, x0 = x * 16, x1 = x0 + 16, z0 = y * 16, z1 = z0 + 16, n = b.pos.length / 3;
      b.pos.push(x0, hn, z0, x1, hn, z0, x0, hs, z1, x1, hs, z1);
      b.uv.push(0, 0, 1, 0, 0, 1, 1, 1);
      for (let i = 0; i < 4; i++) b.cor.push(1, 0.93, 0.82);
      b.idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  return [...baldes.values()].filter((b) => b.idx.length).map((b) => ({ chave: b.chave, g: geometriaDe(b) }));
}
