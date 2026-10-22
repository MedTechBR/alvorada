import * as THREE from 'three';

// Um atlas de 512 px para o piloto inteiro. É compartilhado pelos setores;
// só as geometrias e máscaras locais são descartadas quando eles saem de perto.
let atlas;
export function atlasPintado() {
  if (!atlas) {
    atlas = new THREE.TextureLoader().load('assets/visual/pintado/vila.png');
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.anisotropy = 2;
  }
  return atlas;
}
// Meio texel de folga evita puxar a célula vizinha nas emendas do atlas.
export const GLSL_PINTURA = /* glsl */`
  uniform sampler2D tPintura;
  vec4 pintura(float celula, vec2 uvP) {
    float tom = celula;
    if (celula >= 10.0) celula = 0.0;
    vec2 origem, tamanho;
    if (celula < 1.5) { origem = vec2(celula * 0.5, 0.5); tamanho = vec2(0.5); }
    else { float n = celula - 2.0; origem = vec2(mod(n, 4.0) * 0.25, n < 4.0 ? 0.25 : 0.0); tamanho = vec2(0.25); }
    vec4 tinta = texture2D(tPintura, origem + vec2(0.002) + clamp(uvP, 0.0, 1.0) * (tamanho - 0.004));
    if (tom >= 10.0) {
      float folha = smoothstep(0.01, 0.08, tinta.g - max(tinta.r, tinta.b));
      vec3 cor = tom < 10.5 ? vec3(tinta.g * 1.45, tinta.g * 0.92, tinta.b * 0.8)
        : vec3(tinta.g * 1.45, tinta.g * 0.46, tinta.g * 1.16);
      tinta.rgb = mix(tinta.rgb, cor, folha);
    }
    return tinta;
  }
`;
export function pintarMaterial(mat) {
  mat.defaultAttributeValues = { ...(mat.defaultAttributeValues ?? {}), aPintura: [0, 0, 0] };
  const antes = mat.onBeforeCompile, chave = mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile = (sh, renderer) => {
    antes(sh, renderer);
    sh.uniforms.tPintura = { value: atlasPintado() };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aPintura; varying vec3 vPintura;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPintura = aPintura;');
    const temCor = sh.fragmentShader.includes('#include <color_fragment>');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vPintura;\n' + GLSL_PINTURA);
    // Uma amostra na passagem de cor; na sombra, apenas o recorte por alfa.
    if (temCor) sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (vPintura.z > 0.5) {
        vec4 tinta = pintura(vPintura.z - 1.0, vPintura.xy);
        if (tinta.a < 0.45) discard;
        diffuseColor.rgb *= tinta.rgb * (vPintura.z < 2.5 ? 0.85 : 0.9);
      }`);
    else sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      if (vPintura.z > 0.5 && (vPintura.z < 2.5 || vPintura.z > 10.5) && pintura(vPintura.z - 1.0, vPintura.xy).a < 0.45) discard;`);
  };
  mat.customProgramCacheKey = () => chave() + '+pintado-2';
  return mat;
}

let profundidade;
export function profundidadePintada() {
  return profundidade ??= pintarMaterial(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
}
