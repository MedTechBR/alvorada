import * as THREE from 'three';
import { carregarHGSS } from '../hgss/carregar.js';

// Móveis de interior com modelo GLB real (kits Kenney em assets/hgss/modelos/kenney/furniture, sem textura:
// só cor por material). Cada tipo do catálogo que aparece aqui troca o bloco de kit/interior.js pelo modelo,
// quando ele estiver carregado. Enquanto não carrega (ou se falhar), vale o bloco antigo: nada quebra.
//
// Escala: o modelo cabe na pegada do catálogo (fw x fh tiles, 16 px por tile), em X e Z; a altura segue o aperto
// da pegada (ou a altura `h`, em px do 2D). `iso`: profundidade igual à largura (TV, rádio: não fica chapada).
// `encosto`: a traseira do modelo encosta no fundo da pegada (estante, rádio na parede); senão, a frente é o sul.
// A geometria fica em cache por tipo (uma por tipo, compartilhada) e entra na malha mesclada do setor.
// Os móveis de sala (balcões, sofás, estantes, mesas, TVs, cozinha, laboratório) são peças sob medida em
// kit/moveis.js: mesma luz e escala do resto do kit. Do Kenney ficam só os miúdos que combinam com elas.
export const GLB_TIPOS = {
  crate: { m: 'kenney/furniture/cardboardBoxClosed' },
  radio: { m: 'kenney/furniture/radio', iso: true, encosto: true },
};

// ?glb=0 desliga os modelos GLB (só para comparar com o bloco antigo)
const LIGADO = typeof location === 'undefined' || new URLSearchParams(location.search).get('glb') !== '0';
const prontos = new Map(); // kind -> { geometry, topo }
const pendentes = new Set();
const ouvintes = new Set();
let hPromise = null;

// geometria pronta do tipo (ou null enquanto não carrega)
export function glbPronto(kind) { return LIGADO ? prontos.get(kind) ?? null : null; }
// assina a chegada de um modelo novo (o kit refaz os setores que o usam)
export function onGLB(cb) { ouvintes.add(cb); return () => ouvintes.delete(cb); }

// pede o carregamento de um tipo; K = { fw, fh } da pegada no catálogo
export function pedirGLB(kind, K) {
  const cfg = GLB_TIPOS[kind];
  if (!LIGADO || !cfg || prontos.has(kind) || pendentes.has(kind)) return;
  pendentes.add(kind);
  (hPromise ??= carregarHGSS()).then((h) => h.modelo(cfg.m)).then((grupo) => {
    prontos.set(kind, montar(grupo, { fw: K.fw ?? 1, fh: K.fh ?? 1, ...cfg }));
  }).catch((e) => { console.warn('[glb] ' + kind + ': ' + e.message); prontos.set(kind, null); })
    .finally(() => { pendentes.delete(kind); for (const cb of [...ouvintes]) cb(kind); });
}

// Uma geometria do kit (indexada, position/normal/color/aBrilho) a partir de um grupo GLB.
function montar(grupo, { fw, fh, h, iso, encosto }) {
  grupo.updateMatrixWorld(true);
  const partes = [];
  grupo.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    partes.push({ g, c: mat?.color ?? new THREE.Color(0.8, 0.8, 0.8) });
  });
  const bb = new THREE.Box3();
  for (const p of partes) { p.g.computeBoundingBox(); bb.union(p.g.boundingBox); }
  const W = Math.max(bb.max.x - bb.min.x, 1e-4), H = Math.max(bb.max.y - bb.min.y, 1e-4), D = Math.max(bb.max.z - bb.min.z, 1e-4);
  const sx = (fw * 16) / W, sz = iso ? sx : (fh * 16) / D;
  const sy = h ? h / H : Math.min(sx, sz);
  const cx = (bb.min.x + bb.max.x) / 2;
  // z: traseira no fundo da pegada (encosto) ou frente no sul (z = 0)
  const zRef = encosto ? bb.min.z : bb.max.z, zAlvo = encosto ? -fh * 16 : 0;
  const M = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().makeTranslation(0, 0, zAlvo), new THREE.Matrix4().makeScale(sx, sy, sz))
    .multiply(new THREE.Matrix4().makeTranslation(-cx, -bb.min.y, -zRef));
  let nv = 0, ni = 0;
  for (const p of partes) { p.g.applyMatrix4(M); nv += p.g.attributes.position.count; ni += p.g.index ? p.g.index.count : p.g.attributes.position.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), B = new Float32Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const { g, c } of partes) {
    const pos = g.attributes.position, nor = g.attributes.normal, cnt = pos.count;
    for (let v = 0; v < cnt; v++) {
      const d = (ov + v) * 3;
      P[d] = pos.getX(v); P[d + 1] = pos.getY(v); P[d + 2] = pos.getZ(v);
      if (nor) { N[d] = nor.getX(v); N[d + 1] = nor.getY(v); N[d + 2] = nor.getZ(v); } else N[d + 1] = 1;
      C[d] = c.r; C[d + 1] = c.g; C[d + 2] = c.b;
    }
    if (g.index) { const ix = g.index.array; for (let k = 0; k < ix.length; k++) I[oi + k] = ix[k] + ov; oi += ix.length; }
    else { for (let k = 0; k < cnt; k++) I[oi + k] = ov + k; oi += cnt; } // sem índice (não ocorre nos kits GLB)
    ov += cnt;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(C, 3));
  geometry.setAttribute('aBrilho', new THREE.BufferAttribute(B, 1));
  geometry.setIndex(new THREE.BufferAttribute(I, 1));
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const b = geometry.boundingBox;
  return { geometry, topo: { y: b.max.y, x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z } };
}
