import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { CURVA_GLSL } from '../curva.js';
import { U } from '../ambiente/comum.js';

// Água do estilo Let's Go: lisa, turquesa na beira e azul no fundo, com espuma macia que respira na margem,
// ondinhas suaves que brilham com o sol e o reflexo do céu. A margem é um atributo por canto (aCosta): 1 onde o canto
// encosta em terra, 0 no meio da água; interpolado, vira uma faixa macia sem recorte de bloco.
const AGUA = new Uint8Array(256);
for (const t of [TILE.WATER, TILE.DEEP, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S, TILE.TIDE, TILE.SHALLOW, TILE.REED]) AGUA[t] = 1;
const lin = (h) => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };

export function materialAguaLG(v) {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
    vertexShader: `attribute float aCosta; attribute float aFundo; varying float vCosta; varying float vFundo; varying vec2 vW; varying vec3 vVista;
      ${CURVA_GLSL}
      #include <fog_pars_vertex>
      void main(){ vCosta = aCosta; vFundo = aFundo; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xz; wp.xyz = curvar(wp.xyz); vVista = cameraPosition - wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float tempo; uniform vec3 luz; uniform vec3 ceu; uniform sampler2D tRuido;
      varying float vCosta; varying float vFundo; varying vec2 vW; varying vec3 vVista;
      #include <fog_pars_fragment>
      void main(){
        vec2 p = vW;
        float n = texture2D(tRuido, p / 90.0 + vec2(tempo * 0.012, tempo * 0.008)).r;
        float n2 = texture2D(tRuido, p / 37.0 - vec2(tempo * 0.02, -tempo * 0.015)).g;
        float raso = smoothstep(0.0, 0.85, vCosta);
        vec3 c = mix(${lin('#3a98dc')}, ${lin('#5cc6e6')}, raso);
        c = mix(c, ${lin('#2a72c4')}, vFundo * (1.0 - raso) * 0.8);
        // ondinhas largas e suaves que clareiam
        float o = sin(p.x * 0.07 + tempo * 1.1 + n * 4.0) * sin(p.y * 0.09 - tempo * 0.8 + n2 * 3.0);
        c += smoothstep(0.55, 0.95, o) * 0.07 * vec3(0.8, 0.95, 1.0);
        // reflexo do céu (mais de longe, mais de lado)
        vec3 V = normalize(vVista); float fres = pow(1.0 - max(V.y, 0.0), 3.0);
        c = mix(c, ceu, 0.08 + fres * 0.3);
        c *= luz;
        // brilhos do sol
        float br = smoothstep(0.82, 0.98, n2 * 0.6 + n * 0.4 + sin(p.x * 0.3 + tempo * 2.0) * 0.08);
        c += br * 0.35 * luz * vec3(1.0, 0.97, 0.9);
        // espuma macia na margem, respirando
        float onda = sin(tempo * 1.6 - vCosta * 4.0 + (p.x + p.y) * 0.05) * 0.12;
        float esp = smoothstep(0.74, 0.97, vCosta + onda + (n2 - 0.5) * 0.25);
        float fio = smoothstep(0.4, 0.5, vCosta + onda * 1.5) * (1.0 - smoothstep(0.5, 0.6, vCosta + onda * 1.5)) * 0.35;
        c = mix(c, vec3(0.95, 0.98, 1.0) * max(luz, vec3(0.35)), clamp(esp * 0.85 + fio, 0.0, 1.0));
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }`,
    fog: true,
  });
  Object.assign(m.uniforms, { uCurva: v.u.curva, uAlvoZ: v.u.alvoZ, tempo: v.u.tempo, luz: v.u.luzSprite, ceu: v.setores?.uAgua?.ceu ?? { value: new THREE.Color(0xbfe2f6) }, tRuido: U.tRuido });
  m.customProgramCacheKey = () => 'lg-agua';
  return m;
}

// malha da água do setor (um quadrado por bloco de água, cantos com aCosta e aFundo)
export function geometriaAguaLG(v, sx, sy) {
  const L = v.L, R = v.relevo, ox = sx * 16, oy = sy * 16;
  const ag = (x, y) => AGUA[L.blocoCru(x, y)] === 1;
  const costa = (cx, cy) => { let k = 0; for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) if (!ag(cx + a, cy + b)) k++; return k ? Math.min(1, 0.55 + k * 0.15) : 0; };
  // segunda volta: cantos a um bloco da margem ficam em 0,3 (a faixa rasa fica mais larga)
  const perto = (cx, cy) => { for (let b = -2; b <= 1; b++) for (let a = -2; a <= 1; a++) if (!ag(cx + a, cy + b)) return 0.3; return 0; };
  const fundo = (cx, cy) => { let k = 0; for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) if (L.blocoCru(cx + a, cy + b) === TILE.DEEP) k++; return k / 4; };
  const pos = [], cos = [], fun = [], idx = [];
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = ox + i, y = oy + j; if (x >= L.w || y >= L.h || !ag(x, y)) continue;
    const h = Math.min(R.n(x, y), R.s(x, y)) - 2, n = pos.length / 3, x0 = x * 16, z0 = y * 16;
    pos.push(x0, h, z0, x0 + 16, h, z0, x0, h, z0 + 16, x0 + 16, h, z0 + 16);
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const c = costa(x + a, y + b); cos.push(c || perto(x + a, y + b)); fun.push(fundo(x + a, y + b)); }
    idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCosta', new THREE.Float32BufferAttribute(cos, 1));
  g.setAttribute('aFundo', new THREE.Float32BufferAttribute(fun, 1));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}
