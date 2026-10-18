import * as THREE from 'three';
import { texRuido } from './ruido.js';

// Uniformes compartilhados por todos os materiais da ambientação (um objeto só: mudar aqui muda em todos).
//   tempo         segundos desde o início (vento, nuvens, partículas)
//   tRuido        ruído suave que repete (manchas, borda irregular, nuvens)
//   nuvem         x = escala (1/px), y, z = velocidade (px/s em uv), w = força da sombra (0 = sem nuvens)
//   vento         x, y = direção no chão (xz), z = força, w = rajada (0..1, sobe e desce)
//   atores        até 8 quem empurra a grama: x, z (px de mundo), raio, força (0 = livre)
//   luzGrama      multiplicador de cor da grama e dos arbustos (casa com o dia; 1 = meio-dia)
export const MAX_ATORES = 8;
export const U = {
  tempo: { value: 0 },
  tRuido: { value: null },
  nuvem: { value: new THREE.Vector4(1 / 1400, 0.0045, 0.0018, 0.32) },
  vento: { value: new THREE.Vector4(0.86, -0.5, 1, 0) },
  atores: { value: Array.from({ length: MAX_ATORES }, () => new THREE.Vector4(0, 0, 0, 0)) },
  noite: { value: 0 },
  // manchas de baixa frequência do chão (o terreno, a grama e os arbustos usam as mesmas, então casam)
  uClaro: { value: new THREE.Color(1.16, 1.1, 0.8) }, uEscuro: { value: new THREE.Color(0.74, 0.86, 0.74) }, uSeco: { value: new THREE.Color(1.22, 1.08, 0.72) },
};
export function iniciarComum() { if (!U.tRuido.value) U.tRuido.value = texRuido(); return U; }

// GLSL: declarações comuns (incluir uma vez, antes dos outros trechos)
export const GLSL_BASE = /* glsl */`
  uniform float tempo; uniform sampler2D tRuido; uniform float noite;
`;
// GLSL: tom das manchas de baixa frequência no ponto p (xz); multiplicar a cor por mix(1, tomMancha(p), força)
export const GLSL_MANCHA = /* glsl */`
  uniform vec3 uClaro, uEscuro, uSeco;
  vec3 tomMancha(vec2 p){
    vec4 nz = texture2D(tRuido, p * (1.0 / 520.0)); float b = texture2D(tRuido, p * (1.0 / 86.0)).b;
    vec3 tom = mix(uEscuro, uClaro, smoothstep(0.28, 0.72, nz.r * 0.75 + b * 0.25));
    return mix(tom, uSeco, smoothstep(0.58, 0.8, nz.g) * 0.8);
  }
`;
// GLSL: sombra das nuvens no ponto p (xz em px de mundo): 1 = sol cheio, menor = na sombra
export const GLSL_NUVEM = /* glsl */`
  uniform vec4 nuvem;
  float sombraNuvem(vec2 p){
    if (nuvem.w <= 0.0) return 1.0;
    float n = texture2D(tRuido, p * nuvem.x + tempo * nuvem.yz).a;
    float n2 = texture2D(tRuido, p * nuvem.x * 2.3 - tempo * nuvem.yz * 0.7).a;
    return 1.0 - nuvem.w * smoothstep(0.52, 0.72, n * 0.75 + n2 * 0.25);
  }
`;
// GLSL: deslocamento do vento e de quem passa, para algo plantado em b (xz), com flexibilidade k (0 no pé, 1 na ponta)
export const GLSL_VENTO = /* glsl */`
  uniform vec4 vento; uniform vec4 atores[${MAX_ATORES}];
  vec3 dobra(vec2 b, float k, float fase){
    vec2 d = vento.xy;
    float onda = sin(dot(b, d) * 0.018 - tempo * 1.7 + fase * 0.6) * 0.5 + 0.5;          // rajadas que correm pelo campo
    float tremor = sin(tempo * 4.3 + fase * 6.28 + b.x * 0.11) * 0.25;
    float f = (0.35 + onda * (0.9 + vento.w)) * vento.z;
    vec3 o = vec3(d.x, 0.0, d.y) * (f + tremor) * k * k * 3.2;
    for (int i = 0; i < ${MAX_ATORES}; i++){
      vec4 a = atores[i]; if (a.w <= 0.0) continue;
      vec2 dd = b - a.xy; float L = length(dd);
      float e = (1.0 - smoothstep(a.z * 0.35, a.z, L)) * a.w;
      if (e > 0.0) { vec2 dir = L > 0.01 ? dd / L : vec2(0.0, 1.0); o.xz += dir * e * k * 7.0; o.y -= e * k * 4.0; }
    }
    return o;
  }
`;
