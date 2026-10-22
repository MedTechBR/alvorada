import * as THREE from 'three';

// Nível de detalhe das árvores lisas do estilo Let's Go (~300 triângulos cada): de longe (setores a mais de LONGE
// px do foco da câmera) o setor usa um substituto de ~30 triângulos (tronco de 5 lados + copa de icosaedro com normais
// esféricas, ou cone nos pinheiros), na cor média da copa e do tronco do modelo de verdade, com o mesmo tamanho e pegada.
// O tilt-shift e a névoa já borram esses setores; quem corta triângulos é o celular. A troca é só visibilidade de duas
// malhas já montadas (kit/modelos-setor.js), com histerese, sem refazer nada.
export const ARVORES_LG = new Set(['tree', 'tree2', 'autumn', 'bigtree', 'bigautumn', 'pine', 'pine2', 'pineT', 'pinheiroAlto']);
export const LONGE = 380;   // px de mundo do foco ao centro do setor
export const HISTERESE = 32;
export const LOD_LIGA = new URLSearchParams(location.search).get('lod') !== '0'; // ?lod=0 desliga (comparar FPS)
const cache = new Map();

// md = resultado de modeloLG(kind, o): { geometry, chave, altura }
export function proxyArvore(kind, md) {
  let g = cache.get(md.chave); if (g) return g;
  const src = md.geometry, P = src.attributes.position.array, C = src.attributes.color.array, n = P.length / 3;
  if (!src.boundingBox) src.computeBoundingBox();
  const H = src.boundingBox.max.y, escalaCor=src.attributes.color.normalized?1/65535:1;
  let cr = [0, 0, 0], tr = [0, 0, 0], nc = 0, nt = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    if (y > H * 0.5) { cr[0] += C[i * 3]; cr[1] += C[i * 3 + 1]; cr[2] += C[i * 3 + 2]; nc++; }
    if (y < H * 0.2) { tr[0] += C[i * 3]; tr[1] += C[i * 3 + 1]; tr[2] += C[i * 3 + 2]; nt++; }
    if (y > H * 0.3) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  cr = cr.map((v) => v * escalaCor / Math.max(1, nc)); tr = tr.map((v) => v * escalaCor / Math.max(1, nt));
  const pos = [], nor = [], col = [], idx = [];
  const poe = (geo, T, cor, esf, grad) => {
    const p = geo.attributes.position, nn = geo.attributes.normal, base = pos.length / 3;
    const m = new THREE.Matrix4().compose(new THREE.Vector3(T.x, T.y, T.z), new THREE.Quaternion(), new THREE.Vector3(T.sx, T.sy, T.sz));
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const l = v.clone();
      v.applyMatrix4(m); pos.push(v.x, v.y, v.z);
      if (esf) { l.normalize(); nor.push(l.x, l.y, l.z); } else nor.push(nn.getX(i), nn.getY(i), nn.getZ(i));
      const k = grad ? 0.78 + 0.34 * Math.max(0, Math.min(1, (v.y - T.y + T.sy) / (2 * T.sy))) : 1;
      col.push(cor[0] * k, cor[1] * k, cor[2] * k);
    }
    if (geo.index) for (const q of geo.index.array) idx.push(base + q); else for (let i = 0; i < p.count; i++) idx.push(base + i);
  };
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rx = Math.max(4, (x1 - x0) / 2), rz = Math.max(4, (z1 - z0) / 2), alt = Math.max(8, y1 - y0);
  const rt = Math.max(1.6, H * 0.05), alturaTronco = Math.max(6, y0 + alt * 0.3);
  poe(new THREE.CylinderGeometry(rt * 0.8, rt, alturaTronco, 5, 1, true).translate(0, alturaTronco / 2, 0), { x: cx, y: 0, z: cz, sx: 1, sy: 1, sz: 1 }, tr, false, false);
  if (/^pin/.test(kind)) {
    const cone = new THREE.ConeGeometry(1, 1, 6, 1, true).translate(0, 0.5, 0);
    poe(cone, { x: cx, y: y0 - alt * 0.05, z: cz, sx: rx, sy: alt * 1.05, sz: rz }, cr, false, true);
  } else {
    poe(new THREE.IcosahedronGeometry(1, 0), { x: cx, y: y0 + alt / 2, z: cz, sx: rx, sy: alt / 2, sz: rz }, cr, true, true);
  }
  g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aBrilho', new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(0), 1));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  g.tris = idx.length / 3;
  cache.set(md.chave, g);
  return g;
}
