import * as THREE from 'three';
import { TILE } from '../world/tiles.js';

// Paredes das salas (casa de boneca, como no protótipo): a parede do fundo e as laterais ficam em pé, altas,
// com papel de parede, faixa e rodapé; a da frente fica baixinha para a câmera ver dentro. O vazio entre as salas
// é preto. A sala vem do mapa (interiores); o piso andável é o que não é parede nem vazio.
// Cada sala é montada pelo setor que contém o canto de cima à esquerda dela.
const ALTA = 54, BAIXA = 7, ESP = 7;
const C = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
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

export function paredesDasSalas(v, sx, sy) {
  const L = v.L, R = v.relevo, pos = [], cor = [], idx = [];
  const quad = (a, b, c, d, k) => { const n = pos.length / 3; pos.push(...a, ...b, ...c, ...d); for (let i = 0; i < 4; i++) cor.push(...k); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  // caixa com a face principal virada para +z (sul); rot = 0 sul, 1 leste (+x), -1 oeste (-x)
  const caixa = (x0, y0, z0, x1, y1, z1, k, kt = k.map((q) => q * 0.55)) => {
    const ks = k.map((q) => q * 0.8);
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], k);
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], ks);
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], ks);
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], ks);
    quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], kt);
  };
  const piso = (x, y) => { const t = L.bloco(x, y); return t !== TILE.WALL && t !== TILE.VOID; };
  for (const r of L.interiores ?? []) {
    if (Math.floor(r.x / 16) !== sx || Math.floor(r.y / 16) !== sy) continue;
    const [papel, listra, rodape, faixa] = paleta(r).map(C);
    const topo = C('#3a3430');
    const h = R.em(r.x * 16 + r.w * 8, r.y * 16 + r.h * 8);
    // parede de fundo: para cada coluna, o primeiro piso de cima para baixo
    const fundo = (x) => { for (let y = r.y; y < r.y + r.h; y++) if (piso(x, y)) return y; return null; };
    const baixo = (x) => { for (let y = r.y + r.h - 1; y >= r.y; y--) if (piso(x, y)) return y; return null; };
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
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
  g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
