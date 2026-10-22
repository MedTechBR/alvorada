import * as THREE from 'three';

// Um atlas de 512 px para todos os biomas e interiores. É compartilhado pelos setores;
// só as geometrias e máscaras locais são descartadas quando eles saem de perto.
let atlas;
export function atlasPintado() {
  if (!atlas) {
    atlas = new THREE.TextureLoader().load('assets/visual/pintado/vila.png');
    atlas.colorSpace = THREE.SRGBColorSpace;
    // A câmera fixa não precisa de anisotropia extra; mantém mipmaps e
    // interpolação linear, com uma amostra de nível em vez de duas.
    atlas.anisotropy = 1;
    atlas.minFilter = THREE.LinearMipmapNearestFilter;
  }
  return atlas;
}
// Meio texel de folga evita puxar a célula vizinha nas emendas do atlas.
export const GLSL_PINTURA = /* glsl */`
  uniform sampler2D tPintura;
  vec4 pintura(float celula, vec2 uvP) {
    float tom = celula;
    if (celula >= 10.0 && celula < 12.0) celula = 0.0;
    else if (celula >= 12.0) celula = celula < 12.5 ? 2.0 : celula < 13.5 ? 7.0 : celula < 14.5 ? 5.0 : celula < 15.5 ? 9.0 : 4.0;
    vec2 origem, tamanho;
    if (celula < 1.5) { origem = vec2(celula * 0.5, 0.5); tamanho = vec2(0.5); }
    else { float n = celula - 2.0; origem = vec2(mod(n, 4.0) * 0.25, n < 4.0 ? 0.25 : 0.0); tamanho = vec2(0.25); }
    vec4 tinta = texture2D(tPintura, origem + vec2(0.002) + clamp(uvP, 0.0, 1.0) * (tamanho - 0.004));
    if (tom >= 10.0 && tom < 12.0) {
      float folha = smoothstep(0.01, 0.08, tinta.g - max(tinta.r, tinta.b));
      vec3 cor = tom < 10.5 ? vec3(tinta.g * 1.45, tinta.g * 0.92, tinta.b * 0.8)
        : vec3(tinta.g * 1.45, tinta.g * 0.46, tinta.g * 1.16);
      tinta.rgb = mix(tinta.rgb, cor, folha);
    }
    if (tom >= 12.0) {
      float valor = tom < 12.5 ? tinta.r / 0.65 : dot(tinta.rgb, vec3(0.2126,0.7152,0.0722)) / (tom < 13.5 ? 0.22 : tom < 14.5 ? 0.35 : tom < 15.5 ? 0.14 : 0.7);
      tinta.rgb = vec3(clamp(valor, 0.6, 1.25));
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
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPintura = vec3(aPintura.xy / 65535.0, aPintura.z);');
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
      if (vPintura.z > 0.5 && (vPintura.z < 2.5 || (vPintura.z > 10.5 && vPintura.z < 12.5)) && pintura(vPintura.z - 1.0, vPintura.xy).a < 0.45) discard;`);
  };
  mat.customProgramCacheKey = () => chave() + '+pintado-3';
  return mat;
}

let profundidade;
export function profundidadePintada() {
  return profundidade ??= pintarMaterial(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
}

// Pisos de madeira usam diretamente o atlas compartilhado: uma leitura,
// sem acumular a textura antiga com outra por cima. Azulejos, papel de parede,
// cartazes e saídas continuam com a arte própria de cada interior.
export function pintarSala(mat) {
  const antes=mat.onBeforeCompile, chave=mat.customProgramCacheKey.bind(mat);
  mat.onBeforeCompile=(sh,r)=>{
    antes(sh,r);sh.uniforms.tPintura={value:atlasPintado()};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSuperficieP;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvSuperficieP = position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSuperficieP;\nuniform sampler2D tPintura;')
      .replace('#include <color_fragment>',`#include <color_fragment>\n diffuseColor.rgb *= texture2D(tPintura, vec2(0.252,0.002)+fract(vSuperficieP.xz/64.0)*0.246).rgb * 0.85;`);
  };
  mat.customProgramCacheKey=()=>chave()+'+piso-pintado';
  return mat;
}
