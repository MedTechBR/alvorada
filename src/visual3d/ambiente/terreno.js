import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { texTerreno, CAMADA, ESCALA, N_CAMADAS } from './texturas.js';
import { U, iniciarComum, GLSL_BASE, GLSL_NUVEM, GLSL_MANCHA } from './comum.js';

// Material do terreno estilizado (HD-2D): em vez da arte 2D projetada, o chão é pintado no shader a partir das
// camadas de texturas.js, escolhidas por uma MÁSCARA tirada dos blocos do mapa (src/world/mapa-leitura.js).
//   - cada bloco vira um texel da máscara (número da camada);
//   - o shader mistura os 4 blocos em volta do ponto com pesos suaves, a borda tremida por ruído e a mistura
//     "por altura" (a pintura mais alta ganha: tufos de grama avançam sobre a terra, pedras aparecem na trilha);
//   - manchas claras e escuras de baixa frequência (a grama não fica chapada), sombra das nuvens passando,
//     faces verticais (penhascos, paredes) em rocha, lava acesa.
// Custo: 1 leitura de textura onde os 4 blocos são iguais (a maior parte da tela), 4 nas bordas, + 3 de ruído.
// Funciona com qualquer geometria que tenha posição (o mundo é lido de modelMatrix * position): pode trocar o
// material do chão dos setores (setores.js) sem mudar a malha. Cor de vértice (sombra de contato) é respeitada.

// bloco do mapa -> camada
const DE = new Uint8Array(256).fill(CAMADA.GRAMA);
const por = (cam, ...ts) => { for (const t of ts) if (t !== undefined) DE[t] = cam; };
por(CAMADA.GRAMA, TILE.GRASS, TILE.TALL, TILE.FLOWERS, TILE.GOLD);
por(CAMADA.GRAMA_ESC, TILE.GRASS2, TILE.FOREST, TILE.DARK, TILE.WEBG, TILE.WEBS);
por(CAMADA.TERRA, TILE.PATH, TILE.CORN, TILE.DRYRIVER);
por(CAMADA.AREIA, TILE.SAND);
por(CAMADA.AREIA_MOLHADA, TILE.WATER, TILE.DEEP, TILE.WETSAND, TILE.TIDE, TILE.REEF, TILE.HOTSPRING, TILE.SHALLOW, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S);
por(CAMADA.ROCHA, TILE.CLIFF, TILE.CLIMB, TILE.VOID, TILE.WALL, TILE.ROCK, TILE.CAVE, TILE.CAVEDOOR, TILE.TEMPLEWALL, TILE.RAIL);
por(CAMADA.CALCADA, TILE.STAIRS, TILE.PLAZA, TILE.COURT, TILE.TILEFLOOR, TILE.TEMPLEFLOOR, TILE.MOSAIC, TILE.OLDSTONE, TILE.STAIRUP, TILE.STAIRDOWN, TILE.CRACK);
por(CAMADA.MADEIRA, TILE.BRIDGE, TILE.BRIDGEV, TILE.FLOOR, TILE.MAT, TILE.DOCK);
por(CAMADA.NEVE, TILE.SNOWFIELD, TILE.TALLSNOW);
por(CAMADA.NEVE_TRILHA, TILE.SNOW);
por(CAMADA.NEVE_FUNDA, TILE.DEEPSNOW);
por(CAMADA.GELO, TILE.ICE, TILE.FROZEN, TILE.ICEWALL, TILE.ICEFLOOR, TILE.CRYSTALFLOOR, TILE.CRYSTALWALL);
por(CAMADA.LAVA, TILE.LAVA);
por(CAMADA.CINZA, TILE.ASH);
por(CAMADA.BASALTO, TILE.BASALT, TILE.OBSIDIAN, TILE.LAVAFLOOR, TILE.LAVAWALL, TILE.HOLE, TILE.DARKCAVE);
por(CAMADA.DESERTO, TILE.DUNE, TILE.QUICKSAND, TILE.CAATINGA, TILE.TALLDRY);
por(CAMADA.TERRA_VERM, TILE.CRACKED, TILE.CANYON, TILE.REDROCK);
por(CAMADA.MANGUE, TILE.MUD, TILE.MANGMUD, TILE.ROOTS, TILE.REED);
por(CAMADA.SAL, TILE.SALT, TILE.SALTMIRROR);
export const camadaDoBloco = (t) => DE[t] ?? CAMADA.GRAMA;

// quanto cada camada varia em manchas (0 = nada) e o deslocamento da borda
const VAR = new Float32Array(N_CAMADAS).fill(0.35);
VAR[CAMADA.GRAMA] = 1; VAR[CAMADA.GRAMA_ESC] = 0.9; VAR[CAMADA.TERRA] = 0.45; VAR[CAMADA.CALCADA] = 0.25; VAR[CAMADA.MADEIRA] = 0.15;
VAR[CAMADA.LAVA] = 0; VAR[CAMADA.NEVE] = 0.3; VAR[CAMADA.NEVE_TRILHA] = 0.25; VAR[CAMADA.NEVE_FUNDA] = 0.3; VAR[CAMADA.CINZA] = 0.4; VAR[CAMADA.DESERTO] = 0.5; VAR[CAMADA.MANGUE] = 0.6;
// camadas "duras" (piso construído): borda reta, sem tremer
const DURA = new Float32Array(N_CAMADAS); DURA[CAMADA.CALCADA] = 1; DURA[CAMADA.MADEIRA] = 1;

const SHADER_PARS = /* glsl */`
  ${GLSL_BASE}
  ${GLSL_NUVEM}
  ${GLSL_MANCHA}
  uniform highp sampler2DArray tCamadas;
  uniform sampler2D tMasc; uniform vec4 uMasc;   // xy = bloco de origem da máscara, zw = tamanho em blocos
  uniform float uVar[${N_CAMADAS}]; uniform float uDura[${N_CAMADAS}];
  uniform float uBorda, uMancha;
  varying vec3 vMundo; varying vec3 vNorM;
  int idEm(ivec2 c){ c = clamp(c, ivec2(0), ivec2(uMasc.zw) - 1); return int(texelFetch(tMasc, c, 0).r * 255.0 + 0.5); }
  vec4 camada(int i, vec2 uv){ return texture(tCamadas, vec3(uv, float(i))); }
  float gLava; float gSombra;
  vec3 pintarChao(){
    vec2 p = vMundo.xz;
    vec4 nz = texture2D(tRuido, p * (1.0 / 520.0));
    vec4 nz2 = texture2D(tRuido, p * (1.0 / 86.0));
    vec2 nz3 = texture2D(tRuido, p * (1.0 / 31.0)).rg;
    vec2 desv = (nz2.rg - 0.5) * uBorda * 1.6 + (nz.ba - 0.5) * uBorda * 0.9 + (nz3 - 0.5) * uBorda * 0.7;
    vec2 t0 = p / 16.0 - 0.5 - uMasc.xy;
    ivec2 ib0 = ivec2(floor(t0));
    vec2 t = (p + desv) / 16.0 - 0.5 - uMasc.xy;
    vec2 b = floor(t); vec2 f = t - b; ivec2 ib = ivec2(b);
    int i0 = idEm(ib), i1 = idEm(ib + ivec2(1, 0)), i2 = idEm(ib + ivec2(0, 1)), i3 = idEm(ib + ivec2(1, 1));
    vec2 uv = p / ${ESCALA.toFixed(1)};
    vec4 c0 = camada(i0, uv);
    vec3 cor; int dom = i0; float borda = 0.0;
    if (i0 == i1 && i0 == i2 && i0 == i3) cor = c0.rgb;
    else {
      // pisos construídos usam a borda reta (sem o desvio)
      float dura = max(max(uDura[i0], uDura[i1]), max(uDura[i2], uDura[i3]));
      if (dura > 0.5) { t = t0; b = floor(t); f = t - b; ib = ivec2(b);
        i0 = idEm(ib); i1 = idEm(ib + ivec2(1, 0)); i2 = idEm(ib + ivec2(0, 1)); i3 = idEm(ib + ivec2(1, 1)); c0 = camada(i0, uv); }
      vec4 c1 = camada(i1, uv), c2 = camada(i2, uv), c3 = camada(i3, uv);
      vec2 s = smoothstep(0.08, 0.92, f);
      vec4 w = vec4((1.0 - s.x) * (1.0 - s.y), s.x * (1.0 - s.y), (1.0 - s.x) * s.y, s.x * s.y);
      vec4 h = w + vec4(c0.a, c1.a, c2.a, c3.a) * 0.42;
      float m = max(max(h.x, h.y), max(h.z, h.w));
      vec4 ww = max(h - (m - 0.14), 0.0);
      ww /= (ww.x + ww.y + ww.z + ww.w);
      cor = c0.rgb * ww.x + c1.rgb * ww.y + c2.rgb * ww.z + c3.rgb * ww.w;
      float mx = max(max(ww.x, ww.y), max(ww.z, ww.w));
      dom = mx == ww.x ? i0 : mx == ww.y ? i1 : mx == ww.z ? i2 : i3;
      borda = 1.0 - mx;
      gLava = (i0 == ${CAMADA.LAVA} ? ww.x : 0.0) + (i1 == ${CAMADA.LAVA} ? ww.y : 0.0) + (i2 == ${CAMADA.LAVA} ? ww.z : 0.0) + (i3 == ${CAMADA.LAVA} ? ww.w : 0.0);
    }
    if (i0 == i1 && i0 == i2 && i0 == i3) gLava = i0 == ${CAMADA.LAVA} ? 1.0 : 0.0;
    // manchas claras/escuras e secas (baixa frequência), mais fortes na grama
    float k = uVar[dom] * uMancha;
    cor *= mix(vec3(1.0), tomMancha(p), k);
    // borda entre camadas escurece um pouco (contato da grama com a terra)
    cor *= 1.0 - borda * 0.22 * step(0.5, uVar[dom]);
    // faces verticais: rocha projetada de lado
    float vert = 1.0 - smoothstep(0.35, 0.7, abs(vNorM.y));
    if (vert > 0.0) { vec3 r = camada(${CAMADA.ROCHA}, vec2(vMundo.x + vMundo.z, -vMundo.y) / ${ESCALA.toFixed(1)}).rgb; cor = mix(cor, r * 0.92, vert); gLava *= 1.0 - vert; }
    gSombra = sombraNuvem(p);
    return cor;
  }
`;

export class Terreno {
  // nivel: de qualidade.js (usa nivel.mancha, nivel.borda)
  constructor(nivel = {}) {
    iniciarComum();
    this.nivel = nivel;
    this.tex = texTerreno();
    this.base = {
      tCamadas: { value: this.tex }, uVar: { value: VAR }, uDura: { value: DURA },
      uClaro: U.uClaro, uEscuro: U.uEscuro, uSeco: U.uSeco,
      uBorda: { value: nivel.borda ?? 10 }, uMancha: { value: nivel.mancha ?? 1 },
    };
  }
  // Máscara de um retângulo de blocos (x0, y0, w, h). L = MapaLeitura (ou qualquer objeto com bloco(x, y)).
  mascara(L, x0, y0, w, h) {
    const d = new Uint8Array(w * h * 4);
    const m = { tex: new THREE.DataTexture(d, w, h, THREE.RGBAFormat), x0, y0, w, h, dados: d, L };
    m.tex.magFilter = m.tex.minFilter = THREE.NearestFilter; m.tex.generateMipmaps = false; m.tex.flipY = false;
    m.uMasc = { value: new THREE.Vector4(x0, y0, w, h) };
    this.preencher(m);
    return m;
  }
  // relê os blocos (depois de trocas no mapa: L.mudancas())
  preencher(m, xa = m.x0, ya = m.y0, xb = m.x0 + m.w - 1, yb = m.y0 + m.h - 1) {
    const { L, dados: d } = m;
    for (let y = Math.max(ya, m.y0); y <= Math.min(yb, m.y0 + m.h - 1); y++) for (let x = Math.max(xa, m.x0); x <= Math.min(xb, m.x0 + m.w - 1); x++) {
      const k = ((y - m.y0) * m.w + (x - m.x0)) * 4;
      d[k] = camadaDoBloco(L.bloco(x, y)); d[k + 3] = 255;
    }
    m.tex.needsUpdate = true;
  }
  // máscara de um setor (16x16 blocos + 1 de margem para misturar com os vizinhos)
  mascaraDoSetor(L, sx, sy, lado = 16) { return this.mascara(L, sx * lado - 1, sy * lado - 1, lado + 2, lado + 2); }

  // Material Lambert (luz, sombras do sol e névoa do three) com o chão pintado. Um programa só para todos.
  material(mascara, o = {}) {
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: o.cores ?? true, side: o.lados ?? THREE.FrontSide });
    m.customProgramCacheKey = () => 'amb-terreno';
    m.userData.mascara = mascara;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.base, { tempo: U.tempo, tRuido: U.tRuido, nuvem: U.nuvem, noite: U.noite, tMasc: { value: mascara.tex }, uMasc: mascara.uMasc });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n varying vec3 vMundo; varying vec3 vNorM;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          vMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vNorM = normalize(mat3(modelMatrix) * objectNormal);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + SHADER_PARS)
        .replace('#include <map_fragment>', 'diffuseColor.rgb *= pintarChao();')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += diffuseColor.rgb * gLava * (1.4 + 0.5 * sin(tempo * 1.7 + vMundo.x * 0.05));`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          reflectedLight.directDiffuse *= gSombra;`);
    };
    return m;
  }
  materialDoSetor(L, sx, sy, o) { const masc = this.mascaraDoSetor(L, sx, sy); const m = this.material(masc, o); return m; }
  liberar(m) { m.userData.mascara?.tex.dispose(); m.dispose(); }
}
