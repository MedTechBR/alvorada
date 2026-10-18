import * as THREE from 'three';

// Textura de pixel 16x16 (filtro nearest) em qualquer modelo de cor por vértice: o padrão é escolhido pela cor
// (verde = folhas, vermelho/laranja = telha, marrom = madeira, cinza = pedra, claro = reboco) e projetado pelas
// três direções do mundo (triplanar), 16 texels por bloco de 16 px, como a arte 2D e o demo HGSS/FireRed em 3D.
// Os padrões são desenhados aqui (nada copiado). comPixel(material, v) encadeia no onBeforeCompile.
const N = 16, PADROES = ['folhas', 'telha', 'madeira', 'pedra', 'reboco', 'tijolo'];
let tex = null;
function desenhar() {
  const c = document.createElement('canvas'); c.width = N * PADROES.length; c.height = N;
  const x = c.getContext('2d'); let sd = 11; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const p = (i, X, Y, l, w = 1, h = 1) => { const v = Math.round(Math.max(0, Math.min(255, l * 200))); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i * N + X, Y, w, h); };
  PADROES.forEach((nome, i) => {
    for (let y = 0; y < N; y++) for (let X = 0; X < N; X++) p(i, X, y, 1);
    if (nome === 'folhas') { for (let k = 0; k < 70; k++) { const a = r() * N | 0, b = r() * N | 0, l = r(); p(i, a, b, l < 0.3 ? 0.62 : l < 0.7 ? 0.86 : 1.22); } for (let k = 0; k < 10; k++) p(i, r() * N | 0, r() * N | 0, 1.35, 2, 1); }
    if (nome === 'telha') { for (let y = 0; y < N; y += 4) { for (let X = 0; X < N; X++) p(i, X, y + 3, 0.7); for (let X = (y / 4) % 2 ? 0 : 4; X < N; X += 8) p(i, X, y, 0.8, 1, 3); for (let X = 0; X < N; X++) p(i, X, y, 1.15); } }
    if (nome === 'madeira') { for (let X = 0; X < N; X += 4) { p(i, X + 3, 0, 0.7, 1, N); p(i, X, 0, 1.12, 1, N); } for (let k = 0; k < 8; k++) p(i, r() * N | 0, r() * N | 0, 0.82, 1, 2); }
    if (nome === 'pedra') { for (let k = 0; k < 60; k++) p(i, r() * N | 0, r() * N | 0, r() < 0.5 ? 0.86 : 1.1); p(i, 2, 5, 0.65, 5, 1); p(i, 9, 11, 0.65, 4, 1); p(i, 11, 2, 0.7, 1, 3); }
    if (nome === 'reboco') { for (let k = 0; k < 26; k++) p(i, r() * N | 0, r() * N | 0, r() < 0.5 ? 0.94 : 1.05); }
    if (nome === 'tijolo') { for (let y = 0; y < N; y += 4) { for (let X = 0; X < N; X++) p(i, X, y + 3, 0.72); for (let X = (y / 4) % 2 ? 0 : 4; X < N; X += 8) p(i, X, y, 0.72, 1, 3); } }
  });
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
export function comPixel(m, v, { forca = 1 } = {}) {
  tex ??= desenhar();
  const antes = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    antes?.call(m, sh, r);
    sh.uniforms.tPix = { value: tex }; sh.uniforms.forcaPix = { value: forca };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n varying vec3 vPixP; varying vec3 vPixN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vPixP = (modelMatrix * vec4(transformed, 1.0)).xyz; vPixN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vPixP; varying vec3 vPixN; uniform sampler2D tPix; uniform float forcaPix;
      float pixPadrao(vec3 c, vec3 n){
        float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = mx > 0.0 ? (mx - mn) / mx : 0.0;
        if (c.g > c.r * 1.05 && c.g > c.b * 1.1 && sat > 0.2) return 0.0;              // folhas
        if (c.r > c.g * 1.35 && sat > 0.35) return abs(n.y) > 0.3 ? 1.0 : 5.0;         // telha (em cima) / tijolo (de lado)
        if (c.r >= c.b && c.g >= c.b * 0.9 && sat > 0.25 && mx < 0.55) return 2.0;      // madeira
        if (sat < 0.18 && mx < 0.6) return 3.0;                                          // pedra
        return 4.0;                                                                       // reboco
      }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 an = abs(vPixN);
        vec2 uvp = an.y > 0.6 ? vPixP.xz : an.x > an.z ? vPixP.zy : vPixP.xy;
        uvp.y = -uvp.y;
        float k = pixPadrao(diffuseColor.rgb, vPixN);
        vec2 f = fract(uvp / 16.0);
        float t = texture2D(tPix, vec2((k + f.x) / ${PADROES.length}.0, f.y)).r * 1.275;
        diffuseColor.rgb *= mix(1.0, t, forcaPix);
      }`);
  };
  const k0 = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => (k0 ? k0() : '') + '+pixel';
  m.needsUpdate = true;
  return m;
}
