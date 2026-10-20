import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { camadaDoBloco } from '../ambiente/terreno.js';
import { CAMADA } from '../ambiente/texturas.js';
import { U, GLSL_BASE, GLSL_NUVEM } from '../ambiente/comum.js';

// Chão do estilo Let's Go: grama lisa e clara com manchas macias, listras de corte, pontinhos; trilhas de terra e
// praças de pedra com as bordas borradas (nada de recorte de bloco). Pintado no shader a partir de duas máscaras
// pequenas por setor (um texel por bloco, filtro linear = a mistura entre blocos já sai macia), com a borda
// tremida por ruído. Faces verticais (penhascos, beiras) em barranco de terra e pedra com camadas.
// Material Lambert do three: luz do sol, hemisfério, sombras e névoa continuam iguais.

// sRGB -> linear (o shader trabalha em linear)
const lin = (h) => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };

// camada do terreno da ambientação -> canal das máscaras: A = [terra, pedra, areia, madeira], B = [grama escura, rocha, flores, -]
function canais(t) {
  const c = camadaDoBloco(t), a = [0, 0, 0, 0], b = [0, 0, 0, 0];
  if (t === TILE.FLOWERS) b[2] = 1;
  if (t === TILE.WATER || t === TILE.DEEP || t === TILE.SHALLOW || t === TILE.TIDE || t === TILE.REED) { a[2] = 1; return [a, b]; }
  switch (c) {
    case CAMADA.TERRA: case CAMADA.MANGUE: case CAMADA.TERRA_VERM: a[0] = 1; break;
    case CAMADA.CALCADA: case CAMADA.NEVE_TRILHA: case CAMADA.GELO: case CAMADA.SAL: a[1] = 1; break;
    case CAMADA.AREIA: case CAMADA.AREIA_MOLHADA: case CAMADA.DESERTO: case CAMADA.NEVE: case CAMADA.NEVE_FUNDA: a[2] = 1; break;
    case CAMADA.MADEIRA: a[3] = 1; break;
    case CAMADA.GRAMA_ESC: b[0] = 1; break;
    case CAMADA.ROCHA: case CAMADA.BASALTO: case CAMADA.LAVA: case CAMADA.CINZA: b[1] = 1; break;
  }
  return [a, b];
}

const PARS = /* glsl */`
  ${GLSL_BASE}
  ${GLSL_NUVEM}
  uniform sampler2D tMA, tMB; uniform vec4 uOrig;
  varying vec3 vMundo; varying vec3 vNorM;
  float gSombra;
  vec3 pintarLG(){
    vec2 p = vMundo.xz;
    vec4 n1 = texture2D(tRuido, p * (1.0 / 300.0));
    vec4 n2 = texture2D(tRuido, p * (1.0 / 70.0));
    vec4 n3 = texture2D(tRuido, p * (1.0 / 17.0));
    vec2 warp = (n2.rg - 0.5) * 16.0 + (n3.ba - 0.5) * 6.0;
    vec2 uv = ((p + warp) / 16.0 - uOrig.xy) / uOrig.zw;
    vec2 uvR = ((p + warp * 0.18) / 16.0 - uOrig.xy) / uOrig.zw;
    vec4 A = texture2D(tMA, uv), A0 = texture2D(tMA, uvR), B = texture2D(tMB, uv);
    float terra = smoothstep(0.3, 0.7, A.r + (n3.r - 0.5) * 0.22);
    float pedra = smoothstep(0.38, 0.62, A0.g);
    float areia = smoothstep(0.3, 0.7, A.b + (n3.g - 0.5) * 0.2);
    float mad = smoothstep(0.45, 0.55, A0.a);
    float escura = smoothstep(0.15, 0.85, B.r);
    float rocha = smoothstep(0.3, 0.7, B.g);
    float flor = B.b;
    // grama: manchas grandes claras e escuras, listras de corte, pontinhos
    float m = n1.r * 0.65 + n2.b * 0.35;
    vec3 g = mix(${lin('#427c28')}, ${lin('#7aa840')}, smoothstep(0.28, 0.78, m));
    g = mix(g, ${lin('#a8c858')}, smoothstep(0.62, 0.85, n1.g) * 0.3);
    float fx = sin(p.y * 0.1309 + (n2.a - 0.5) * 1.2);
    g *= 1.0 + 0.09 * smoothstep(-0.25, 0.25, fx) - 0.04;
    g *= 0.93 + 0.14 * n3.b;
    g = mix(g, g * ${lin('#c8dc78')} * 1.6, flor * 0.35);
    g = mix(g, ${lin('#3f8a36')} * (0.85 + 0.3 * n2.g), escura * 0.85);
    // terra: centro claro, beira mais escura e quente, pedrinhas
    float miolo = smoothstep(0.55, 0.98, A.r);
    vec3 t = mix(${lin('#b98a56')}, ${lin('#e2bf86')}, miolo);
    t *= 0.94 + 0.12 * n3.a;
    t = mix(t, ${lin('#efd6a4')}, step(0.86, n3.r) * 0.5 * miolo);
    // pedra clara da praça, com juntas apagadas
    vec2 f = abs(fract(p / 16.0 + 0.5) - 0.5);
    float junta = 1.0 - smoothstep(0.0, 0.035, min(f.x, f.y));
    vec3 pd = mix(${lin('#bdb39e')}, ${lin('#d6cdb8')}, smoothstep(0.45, 0.9, A0.g)) * (0.95 + 0.08 * n2.r);
    pd *= 1.0 - junta * 0.1;
    vec3 ar = ${lin('#ecd9a4')} * (0.94 + 0.1 * n2.r);
    vec2 fm = fract(p / vec2(16.0, 4.0));
    vec3 md = mix(${lin('#a8784a')}, ${lin('#c99a64')}, smoothstep(0.1, 0.5, fm.y) * (1.0 - smoothstep(0.85, 1.0, fm.y)));
    vec3 rc = mix(${lin('#7f7a70')}, ${lin('#a9a395')}, n2.g);
    vec3 c = g;
    c = mix(c, ar, areia);
    c = mix(c, t, terra);
    c *= 1.0 - 0.16 * terra * (1.0 - terra) * 4.0 * (1.0 - areia); // contato grama/terra
    c = mix(c, pd, pedra);
    c = mix(c, rc, rocha);
    c = mix(c, md, mad);
    // faces verticais: barranco com camadas
    float vert = 1.0 - smoothstep(0.35, 0.75, abs(vNorM.y));
    if (vert > 0.0) {
      float cam = sin(vMundo.y * 0.55 + n2.r * 3.0) * 0.5 + 0.5;
      vec3 bar = mix(${lin('#8a7058')}, ${lin('#b29274')}, cam * 0.7 + n3.g * 0.3);
      c = mix(c, bar, vert);
    }
    gSombra = sombraNuvem(p);
    return c;
  }
`;

export class ChaoLG {
  constructor(v) { this.v = v; }
  // máscaras do setor (16 + 2 de margem)
  mascara(sx, sy) {
    const L = this.v.L, x0 = sx * 16 - 1, y0 = sy * 16 - 1, W = 18;
    const da = new Uint8Array(W * W * 4), db = new Uint8Array(W * W * 4);
    const tA = new THREE.DataTexture(da, W, W, THREE.RGBAFormat), tB = new THREE.DataTexture(db, W, W, THREE.RGBAFormat);
    for (const t of [tA, tB]) { t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
    const M = { tA, tB, da, db, x0, y0, W, uOrig: { value: new THREE.Vector4(x0, y0, W, W) } };
    this.preencher(M);
    return M;
  }
  preencher(M) {
    const L = this.v.L;
    for (let j = 0; j < M.W; j++) for (let i = 0; i < M.W; i++) {
      const [a, b] = canais(L.blocoCru(M.x0 + i, M.y0 + j)), k = (i + j * M.W) * 4;
      for (let q = 0; q < 4; q++) { M.da[k + q] = a[q] * 255; M.db[k + q] = b[q] * 255; }
    }
    M.tA.needsUpdate = M.tB.needsUpdate = true;
  }
  material(sx, sy) {
    const M = this.mascara(sx, sy);
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide });
    m.customProgramCacheKey = () => 'lg-chao';
    m.userData.mascaraLG = M;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { tempo: U.tempo, tRuido: U.tRuido, nuvem: U.nuvem, noite: U.noite, tMA: { value: M.tA }, tMB: { value: M.tB }, uOrig: M.uOrig });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n varying vec3 vMundo; varying vec3 vNorM;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          vMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vNorM = normalize(mat3(modelMatrix) * objectNormal);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + PARS)
        .replace('#include <map_fragment>', 'diffuseColor.rgb *= pintarLG();')
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          reflectedLight.directDiffuse *= gSombra;`);
    };
    return m;
  }
  liberar(m) { const M = m.userData.mascaraLG; if (M) { M.tA.dispose(); M.tB.dispose(); } m.dispose(); }

  // malha do chão do setor: a mesma de setores.js (topos por bloco, saias nos degraus), com a ondulação nos cantos e a
  // normal suave tirada dela (sem facetas de bloco na luz)
  geometria(S, sx, sy) {
    const v = this.v, L = v.L, RL = v.lg.relevo, CH = 16, ox = sx * CH, oy = sy * CH, W = Math.min(CH, L.w - ox), H = Math.min(CH, L.h - oy);
    const pos = [], nor = [], cor = [], idx = [];
    const SU = new Array((W + 2) * (H + 2));
    for (let j = -1; j <= H; j++) for (let i = -1; i <= W; i++) SU[(j + 1) * (W + 2) + i + 1] = S.sup(ox + i, oy + j);
    const sup = (i, j) => SU[(j + 1) * (W + 2) + i + 1];
    const quad = (a, b, c, d, k, n) => {
      const q = pos.length / 3;
      pos.push(...a, ...b, ...c, ...d);
      const ks = Array.isArray(k) ? k : [k, k, k, k];
      for (let r = 0; r < 4; r++) { cor.push(ks[r], ks[r], ks[r]); if (n) nor.push(...n[r]); else nor.push(NaN, NaN, NaN); }
      idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
    };
    const ao = (i, j, hn) => { let k = 1; for (const [a, b] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]]) { const q = sup(a, b); if (q && Math.max(q[0], q[1]) > hn + 10) k -= 0.12; } return Math.max(0.6, k); };
    // alturas extras dos cantos (com 1 de margem para a inclinação), lidas uma vez
    const HC = new Float32Array(19 * 19); for (let j = -1; j <= 17; j++) for (let i = -1; i <= 17; i++) HC[(i + 1) + (j + 1) * 19] = RL.canto(ox + i, oy + j);
    const hc = (cx, cy) => HC[(cx - ox + 1) + (cy - oy + 1) * 19];
    const nC = (cx, cy) => { const gx = (hc(cx + 1, cy) - hc(cx - 1, cy)) / 32, gz = (hc(cx, cy + 1) - hc(cx, cy - 1)) / 32, l = Math.hypot(gx, 1, gz); return [-gx / l, 1 / l, -gz / l]; };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const [hn, hs, tipo] = sup(i, j), x0 = (ox + i) * 16, z0 = (oy + j) * 16, x1 = x0 + 16, z1 = z0 + 16, cx = ox + i, cy = oy + j;
      const ks = tipo >= 5 ? [0.03, 0.03, 0.03, 0.03] : tipo === 3 ? [0.62, 0.62, 0.62, 0.62] : tipo === 1 ? [1, 1, 0.92, 0.92] : [ao(i, j, hn), ao(i + 1, j, hn), ao(i, j + 1, hs), ao(i + 1, j + 1, hs)];
      if (tipo === 0 && hn === hs) {
        const a = hc(cx, cy), b = hc(cx + 1, cy), c = hc(cx, cy + 1), d = hc(cx + 1, cy + 1);
        quad([x0, hn + a, z0], [x1, hn + b, z0], [x0, hs + c, z1], [x1, hs + d, z1], ks, [nC(cx, cy), nC(cx + 1, cy), nC(cx, cy + 1), nC(cx + 1, cy + 1)]);
      } else quad([x0, hn, z0], [x1, hn, z0], [x0, hs, z1], [x1, hs, z1], ks);
      const e = sup(i + 1, j);
      if (e && (Math.abs(e[0] - hn) > 0.5 || Math.abs(e[1] - hs) > 0.5)) quad([x1, hn, z0], [x1, e[0], z0], [x1, hs, z1], [x1, e[1], z1], 0.72);
      const sl = sup(i, j + 1);
      if (sl && Math.abs(sl[0] - hs) > 0.5) { const alto = hs > sl[0]; quad([x0, Math.max(hs, sl[0]), z1], [x1, Math.max(hs, sl[0]), z1], [x0, Math.min(hs, sl[0]), z1], [x1, Math.min(hs, sl[0]), z1], alto ? 0.86 : 0.62); }
      if (i === 0) { const w = sup(-1, j); if (w && (hn - w[0] > 0.5 || hs - w[1] > 0.5)) quad([x0, w[0], z0], [x0, hn, z0], [x0, w[1], z1], [x0, hs, z1], 0.72); }
      if (j === 0) { const nn = sup(i, -1); if (nn && hn - nn[1] > 0.5) quad([x0, hn, z0], [x1, hn, z0], [x0, nn[1], z0], [x1, nn[1], z0], 0.62); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    // normais suaves da ondulação onde foram dadas
    const N = g.getAttribute('normal');
    for (let k = 0; k < nor.length; k += 3) if (!Number.isNaN(nor[k])) { N.array[k] = nor[k]; N.array[k + 1] = nor[k + 1]; N.array[k + 2] = nor[k + 2]; }
    N.needsUpdate = true;
    g.computeBoundingSphere();
    return g;
  }
}
