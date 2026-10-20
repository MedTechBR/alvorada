import { KINDS } from '../../world/objects.js';
import { Malha, mesclar, criarMaterial, EY } from './construtor.js';
import { NATUREZA } from './natureza.js';
import { OBJETOS } from './objetos.js';
import { PREDIOS } from './predios.js';
import { INTERIOR, paredeInterior } from './interior.js';
import { GLB_TIPOS, glbPronto } from './glb.js';

// Kit de modelos 3D low-poly (HD-2D) gerados por código. Interface em docs/visual-3d-kit.md.
//
//   import { kit } from './kit/index.js'
//   kit.temModelo(kind)            true se o tipo tem modelo 3D (senão: billboard do sprite 2D)
//   kit.modelo(kind, obj)          { geometry, topo, variante, tris, altura } (cacheado por tipo + variante + estado)
//   kit.dinamico(kind)             true se o modelo muda com o estado do objeto (baú, alavanca, portão, fruta...)
//   kit.chave(kind, obj)           chave do cache (muda quando o estado muda: refazer o setor/peça)
//   kit.mesclar(itens)             [{ geometry, x, y, z, k? }] -> uma geometria (para a malha do setor)
//   kit.material()                 material único dos modelos (Lambert + cor por vértice + brilho noturno)
//   kit.noite(valor)               0 = dia, 1 = noite (acende janelas e lampiões)
//
// A geometria devolvida é COMPARTILHADA (cache): não altere nem descarte; para posicionar, use kit.mesclar.
// Origem = ponto do pé do objeto (o.x, chão, o.y); pegada de x = -fw*8..fw*8 e z = -fh*16..0, igual ao 2D.

const TIPOS = { ...NATUREZA, ...OBJETOS, ...PREDIOS, ...INTERIOR };
const cache = new Map();
const uNoite = { value: 0 };
let mat = null;
const medidas = new Map(); // kind -> { ms, tris, n }

function hashVar(o) {
  const x = o?.tx ?? Math.floor((o?.x ?? 0) / 16), y = o?.ty ?? Math.floor((o?.y ?? 0) / 16);
  let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0);
}
const ficha = (kind) => KINDS[kind] ?? TIPOS[kind]?.ficha ?? { fw: 1, fh: 1 };

export const kit = {
  temModelo: (kind) => !!TIPOS[kind],
  dinamico: (kind) => !!TIPOS[kind]?.estado,
  tipos: () => Object.keys(TIPOS),
  ficha,
  chave(kind, obj) {
    if (GLB_TIPOS[kind] && glbPronto(kind)) return `${kind}|glb`; // modelo GLB carregado (kit/glb.js)
    const T = TIPOS[kind]; if (!T) return null;
    const v = T.var ? hashVar(obj) % T.var : 0, e = T.estado ? T.estado(obj ?? {}, ficha(kind)) : '';
    return `${kind}|${v}|${e}`;
  },
  modelo(kind, obj = {}) {
    const T = TIPOS[kind]; if (!T) return null;
    const k = this.chave(kind, obj);
    let r = cache.get(k); if (r) return r;
    if (k.endsWith('|glb')) { const g = glbPronto(kind); r = { geometry: g.geometry, topo: g.topo, variante: 0, tris: g.geometry.index.count / 3, altura: g.topo.y, chave: k }; cache.set(k, r); return r; }
    const K = ficha(kind), v = T.var ? hashVar(obj) % T.var : 0;
    const t0 = performance.now();
    let seed = v * 7919 + 13; for (const ch of kind) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483000;
    const m = new Malha(seed);
    const c = { K, o: obj, v, kind, fw: K.fw, fh: K.fh, L: K.fw * 8, D: K.fh * 16, estado: k.split('|')[2] };
    const t = T.f(m, c) ?? null, topo = t && { ...t, y: t.y * EY };
    const geometry = m.geometria();
    const bb = geometry.boundingBox;
    r = { geometry, topo: topo ?? { y: bb.max.y, x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z }, variante: v, tris: m.tris, altura: bb.max.y, chave: k };
    const ms = performance.now() - t0;
    const md = medidas.get(kind) ?? { ms: 0, tris: 0, n: 0 }; md.ms += ms; md.n++; md.tris = m.tris; medidas.set(kind, md);
    cache.set(k, r);
    return r;
  },
  mesclar,
  parede: paredeInterior, // paredeInterior(w, h, { papel, rodape, faixa, meia }) -> geometria (não cacheada)
  material() { return (mat ??= criarMaterial(uNoite)); },
  noite(v) { uNoite.value = v; },
  uNoite,
  medidas: () => medidas,
  limparCache() { for (const r of cache.values()) r.geometry.dispose(); cache.clear(); },
};
export default kit;
