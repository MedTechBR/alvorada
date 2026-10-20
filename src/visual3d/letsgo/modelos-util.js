import * as THREE from 'three';
import { prim, esf, cilG, coneG, caixaR, ss } from './modelos.js';

// Ajudantes extras para os modelos lisos dos grupos (modelos-<grupo>.js). Tudo em px do 2D, mesmo eixo do kit:
// x = leste, y = altura, z = sul; pé do objeto em (0, 0, 0); pegada x = -fw*8..fw*8, z = -fh*16..0.
export { prim, esf, cilG, coneG, caixaR, ss };

// sólido de revolução (torno): perfil [[raio, altura], ...] de baixo para cima, raio e altura em unidades "1" (escalar na hora de usar)
// -> m.add(torno(perfil, n), { x, y, z, sx: R, sy: H, sz: R }, cor, opções). Normais suaves.
export function torno(perfil, n = 12) {
  return prim(`t${n}|${perfil.flat().join(',')}`, () => {
    const g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), n);
    return g;
  });
}
// tronco/cano de cilindro entre dois pontos a -> b (tampas opcionais), raios r0 (em a) e r1 (em b)
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _u = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
export function segmento(m, a, b, r0, r1, n, cor, o = {}) {
  _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = _d.length(); if (L < 1e-4) return m;
  _q.setFromUnitVectors(_u, _d.normalize()); _e.setFromQuaternion(_q);
  return m.add(cilG(n, 1, r1 / r0, o.aberto !== false), { x: a[0], y: a[1], z: a[2], sx: r0, sy: L, sz: r0, rx: _e.x, ry: _e.y, rz: _e.z }, cor, o);
}
// elipsoide liso com rotação (folhas de palmeira, pétalas, asas, pedras deitadas)
export function elipse(m, x, y, z, sx, sy, sz, rx, ry, rz, cor, o = {}) {
  return m.add(esf(o.d ?? 1), { x, y, z, sx, sy, sz, rx, ry, rz }, cor, o);
}
// telhado de duas águas inteiriço (prisma com cumeeira ao longo de x): largura w (x), beiral na altura y, cumeeira em y+h, profundidade d (z, centro zc)
export function prismaTelhado(m, x, y, zc, w, h, d, cor, o = {}) {
  const key = `pr${w}|${h}|${d}`;
  const g = prim(key, () => {
    const P = [], N = [], I = [], v = (px, py, pz, nx, ny, nz) => { P.push(px, py, pz); N.push(nx, ny, nz); return P.length / 3 - 1; };
    const hw = w / 2, hd = d / 2, L = Math.hypot(hd, h), ny = hd / L, nz = h / L;
    // água sul
    let a = v(-hw, 0, hd, 0, ny, nz), b = v(hw, 0, hd, 0, ny, nz), c = v(hw, h, 0, 0, ny, nz), e = v(-hw, h, 0, 0, ny, nz); I.push(a, b, c, a, c, e);
    // água norte
    a = v(hw, 0, -hd, 0, ny, -nz); b = v(-hw, 0, -hd, 0, ny, -nz); c = v(-hw, h, 0, 0, ny, -nz); e = v(hw, h, 0, 0, ny, -nz); I.push(a, b, c, a, c, e);
    // empenas
    a = v(-hw, 0, hd, -1, 0, 0); b = v(-hw, h, 0, -1, 0, 0); c = v(-hw, 0, -hd, -1, 0, 0); I.push(a, b, c);
    a = v(hw, 0, hd, 1, 0, 0); b = v(hw, 0, -hd, 1, 0, 0); c = v(hw, h, 0, 1, 0, 0); I.push(a, b, c);
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g2.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g2.setIndex(I); return g2;
  });
  return m.add(g, { x, y, z: zc }, cor, { todas: true, ...o });
}
// pirâmide de base quadrada/retangular (tendas, torres): n lados, raio r, altura h (cone com poucos lados, girado 45° para base reta)
export function piramide(m, x, y, z, rx, h, rz, cor, o = {}) {
  return m.add(coneG(4), { x, y, z, sx: rx * Math.SQRT2, sy: h, sz: rz * Math.SQRT2, ry: Math.PI / 4 }, cor, o);
}
export const sombra = (cor, k) => { const c = new THREE.Color(cor); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };
export { caixaR as caixaArredondada };
export const ruido = (a, b, x) => ss(a, b, x);
// estado do objeto igual ao do kit voxel (baú aberto, portão, ponta de cerca, orientação da barreira...): reaproveita a regra do kit
import { kit } from '../kit/index.js';
export const estadoKit = (kind) => (o) => (kit.chave(kind, o) ?? '').split('|')[2] ?? '';
