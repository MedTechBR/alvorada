import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { CURVA_GLSL } from '../curva.js';
import { U } from '../ambiente/comum.js';

// Água do estilo Let's Go: lisa, turquesa na beira e azul no fundo, com espuma macia que respira na margem,
// ondinhas suaves que brilham com o sol e o reflexo do céu. A margem é um atributo por canto (aCosta): 1 onde o canto
// encosta em terra, 0 no meio da água; interpolado, vira uma faixa macia sem recorte de bloco.
// Tipos de água (atributo aTipo por canto, misturados entre blocos): mar (azul fundo -> turquesa -> raso), recife (turquesa
// claro com coral), brejo/mangue (turva, verde-oliva, sem espuma), fonte termal (leitosa, quente) e água fria (Geada, mais
// escura e esverdeada). Água rasa (maré, raso, junco, recife, termal) fica rente ao chão e é translúcida (aRaso).
// Na praia, linhas de onda deslizam para a margem e a espuma respira junto da areia.
const AGUA = new Uint8Array(256);
for (const t of [TILE.WATER, TILE.DEEP, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S, TILE.TIDE, TILE.SHALLOW, TILE.REED, TILE.REEF, TILE.HOTSPRING]) AGUA[t] = 1;
const RASA = new Uint8Array(256); for (const t of [TILE.TIDE, TILE.SHALLOW, TILE.REED, TILE.REEF, TILE.HOTSPRING]) RASA[t] = 1;
const lin = (h) => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };

export function materialAguaLG(v) {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]),
    vertexShader: `attribute float aCosta; attribute float aFundo; attribute float aRaso; attribute vec4 aTipo; varying float vCosta; varying float vFundo; varying float vRaso; varying vec4 vTipo; varying vec2 vW; varying vec3 vVista;
      ${CURVA_GLSL}
      #include <fog_pars_vertex>
      void main(){ vCosta = aCosta; vFundo = aFundo; vRaso = aRaso; vTipo = aTipo; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xz; wp.xyz = curvar(wp.xyz); vVista = cameraPosition - wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float tempo; uniform vec3 luz; uniform vec3 ceu; uniform sampler2D tRuido;
      varying float vCosta; varying float vFundo; varying float vRaso; varying vec4 vTipo; varying vec2 vW; varying vec3 vVista;
      #include <fog_pars_fragment>
      void main(){
        vec2 p = vW;
        float n = texture2D(tRuido, p / 90.0 + vec2(tempo * 0.012, tempo * 0.008)).r;
        float n2 = texture2D(tRuido, p / 37.0 - vec2(tempo * 0.02, -tempo * 0.015)).g;
        float raso = max(smoothstep(0.0, 0.85, vCosta), vRaso * 0.7);
        float brejo = vTipo.x, rec = vTipo.y, term = vTipo.z, frio = vTipo.w;
        vec3 c = mix(${lin('#2c80cc')}, ${lin('#45aedc')}, raso);
        c = mix(c, ${lin('#2a72c4')}, vFundo * (1.0 - raso) * 0.8);
        // recife: turquesa claro com manchas de coral e areia clara por baixo
        vec3 cr = mix(${lin('#2fcdc0')}, ${lin('#8cf0dc')}, smoothstep(0.3, 0.8, n2));
        cr = mix(cr, ${lin('#ff8f7a')}, smoothstep(0.78, 0.9, texture2D(tRuido, p / 23.0).b) * 0.55);
        cr = mix(cr, ${lin('#a35cd0')}, smoothstep(0.84, 0.95, texture2D(tRuido, p / 29.0 + 0.3).a) * 0.4);
        c = mix(c, cr, rec);
        // fonte termal: leitosa e verde-azulada
        c = mix(c, mix(${lin('#6fe0d6')}, ${lin('#b8f6e8')}, smoothstep(0.3, 0.8, n)), term);
        // água fria (Geada): mais escura e esverdeada
        c = mix(c, c * vec3(0.62, 0.88, 0.95) + ${lin('#0b3a50')} * 0.2, frio * 0.8);
        // brejo e mangue: turva, verde-oliva, com nata mais clara em manchas
        vec3 bj = mix(${lin('#566a36')}, ${lin('#7b8a42')}, smoothstep(0.25, 0.8, n2));
        bj = mix(bj, ${lin('#8c9a50')}, smoothstep(0.6, 0.85, n) * 0.5);
        bj = mix(bj, ${lin('#3a4a2a')}, smoothstep(0.7, 0.9, texture2D(tRuido, p / 19.0 + 0.7).r) * 0.5);
        c = mix(c, bj, brejo);
        // ondinhas largas e suaves que clareiam
        float o = sin(p.x * 0.07 + tempo * 1.1 + n * 4.0) * sin(p.y * 0.09 - tempo * 0.8 + n2 * 3.0);
        c += smoothstep(0.55, 0.95, o) * 0.06 * vec3(0.8, 0.95, 1.0) * (1.0 - brejo * 0.8);
        // reflexo do céu (mais de longe, mais de lado; o brejo quase não reflete)
        vec3 V = normalize(vVista); float fres = pow(1.0 - max(V.y, 0.0), 3.0);
        c = mix(c, ceu, (0.04 + fres * 0.22) * (1.0 - brejo * 0.7));
        c *= luz;
        // brilhos do sol
        float br = smoothstep(0.82, 0.98, n2 * 0.6 + n * 0.4 + sin(p.x * 0.3 + tempo * 2.0) * 0.08);
        c += br * 0.28 * luz * vec3(1.0, 0.97, 0.9) * (1.0 - brejo * 0.85);
        // espuma macia na margem, respirando, e linhas de onda deslizando para a areia
        float onda = sin(tempo * 1.6 - vCosta * 4.0 + (p.x + p.y) * 0.05) * 0.12;
        float esp = smoothstep(0.8, 0.99, vCosta + onda + (n2 - 0.5) * 0.22);
        float fio = smoothstep(0.4, 0.5, vCosta + onda * 1.5) * (1.0 - smoothstep(0.5, 0.6, vCosta + onda * 1.5)) * 0.35;
        float ph = fract(tempo * 0.16 - vCosta * 1.7 + (n - 0.5) * 0.25 + (p.x + p.y) * 0.004);
        float linha = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.05, 0.14, ph)) * smoothstep(0.2, 0.6, vCosta) * (1.0 - smoothstep(0.92, 1.0, vCosta));
        float esk = clamp(esp * 0.75 + fio * 0.7 + linha * 0.5 * (0.6 + 0.4 * n2), 0.0, 1.0) * (1.0 - brejo * 0.9) * (1.0 - term * 0.5);
        c = mix(c, vec3(0.9, 0.95, 1.0) * max(luz, vec3(0.35)), esk);
        float alfa = mix(1.0, mix(0.8, 0.66, rec), clamp(vRaso, 0.0, 1.0));
        alfa = mix(alfa, 0.93, brejo);
        gl_FragColor = vec4(c, alfa);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }`,
    fog: true, transparent: true, depthWrite: false,
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
  // tipo da água de cada bloco: [brejo, recife, termal, frio, rasa]
  const map = v.g.map, tipoCache = new Map();
  const tipo = (x, y) => {
    const k = x + y * 8192; let q = tipoCache.get(k); if (q) return q;
    const t = L.blocoCru(x, y); q = [0, 0, 0, 0, RASA[t]];
    if (AGUA[t]) {
      const bio = map.areaAt?.(x * 16 + 8, y * 16 + 8)?.biome ?? '';
      if (t === TILE.REED || (t === TILE.SHALLOW && /mangue|brejo/.test(bio))) q[0] = 1;
      if (t === TILE.REEF) q[1] = 1;
      if (t === TILE.HOTSPRING) q[2] = 1;
      if (map.regionAt?.(x * 16 + 8, y * 16 + 8)?.id === 'geada' || /neve|gelo|pico/.test(bio)) q[3] = 1;
    }
    tipoCache.set(k, q); return q;
  };
  const canto = (cx, cy) => { const r = [0, 0, 0, 0, 0]; let n = 0; for (const [a, b] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) if (ag(cx + a, cy + b)) { const q = tipo(cx + a, cy + b); for (let i = 0; i < 5; i++) r[i] += q[i]; n++; } return n ? r.map((e) => e / n) : r; };
  const pos = [], cos = [], fun = [], ras = [], tip = [], idx = [];
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const x = ox + i, y = oy + j; if (x >= L.w || y >= L.h || !ag(x, y)) continue;
    const rasa = RASA[L.blocoCru(x, y)], h = Math.min(R.n(x, y), R.s(x, y)) + (rasa ? 0.6 : -2), n = pos.length / 3, x0 = x * 16, z0 = y * 16;
    pos.push(x0, h, z0, x0 + 16, h, z0, x0, h, z0 + 16, x0 + 16, h, z0 + 16);
    for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const c = costa(x + a, y + b); cos.push(c || perto(x + a, y + b)); fun.push(fundo(x + a, y + b)); const q = canto(x + a, y + b); ras.push(q[4]); tip.push(q[0], q[1], q[2], q[3]); }
    idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
  }
  if (!idx.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCosta', new THREE.Float32BufferAttribute(cos, 1));
  g.setAttribute('aFundo', new THREE.Float32BufferAttribute(fun, 1));
  g.setAttribute('aRaso', new THREE.Float32BufferAttribute(ras, 1));
  g.setAttribute('aTipo', new THREE.Float32BufferAttribute(tip, 4));
  g.setIndex(idx); g.computeBoundingSphere();
  return g;
}
