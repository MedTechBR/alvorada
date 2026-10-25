import { emCidadeCoral } from '../../world/coral-piloto.js';
import { atlasPintado, GLSL_PINTURA } from './pintura.js';
import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { U, GLSL_BASE, GLSL_NUVEM } from '../ambiente/comum.js';

// Chão do estilo Let's Go: grama lisa e clara com manchas macias, listras de corte, pontinhos; trilhas de terra e
// praças de pedra com as bordas borradas (nada de recorte de bloco). Pintado no shader a partir de máscaras
// pequenas por setor (um texel por bloco, filtro linear = a mistura entre blocos já sai macia), com a borda
// tremida por ruído. Faces verticais (penhascos, beiras) em barranco com camadas, na cor do bioma.
//
// Biomas (cada um com paleta própria, tudo liso e saturado como a grama): neve, neve batida e gelo; areia, areia
// molhada e dunas; cânion de rocha vermelha; basalto, cinza e lava (emissiva, em fluxo animado); lama de mangue e
// brejo; chão de selva; pedra de templo e ruína; piso de caverna e cristal.
// Os canais das máscaras (4 por textura) estão em CANAIS_PLENO; no celular (CANAIS_LEVE) são 12 canais em 3 texturas,
// os biomas parecidos dividem o mesmo canal (ALIAS) e o shader lê menos ruído. ?chao=leve|pleno força um dos dois.
// Material Lambert do three: luz do sol, hemisfério, sombras e névoa continuam iguais.

// sRGB -> linear (o shader trabalha em linear)
const lin = (h) => { const c = new THREE.Color(h); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; };

export const CANAIS_PLENO = ['terra', 'pedra', 'areia', 'madeira', 'escura', 'rocha', 'flor', 'selva', 'neve', 'gelo', 'deserto', 'vermelha', 'basalto', 'lava', 'lama', 'templo', 'cinza', 'caverna', 'duro', 'molhada'];
export const CANAIS_LEVE = ['terra', 'pedra', 'areia', 'madeira', 'escura', 'rocha', 'neve', 'gelo', 'deserto', 'vermelha', 'basalto', 'lava'];
const ALIAS = { templo: 'pedra', cinza: 'basalto', caverna: 'rocha', duro: 'neve', selva: 'escura', lama: 'terra', molhada: 'areia', flor: null };
const TODOS = CANAIS_PLENO;
const T = TILE;

// bloco do mapa -> material (o que não está aqui é grama)
const MATERIAL = new Array(256).fill(null);
const por = (nome, ...ts) => { for (const t of ts) if (t !== undefined) MATERIAL[t] = nome; };
por('terra', T.PATH, T.CORN, T.DRYRIVER);
por('lama', T.MUD, T.MANGMUD, T.ROOTS);
por('vermelha', T.CRACKED, T.CANYON, T.REDROCK);
por('areia', T.SAND, T.WATER, T.DEEP, T.REEF, T.HOTSPRING, T.CUR_E, T.CUR_W, T.CUR_N, T.CUR_S, T.SHALLOW, T.REED);
por('molhada', T.WETSAND, T.TIDE);
por('deserto', T.DUNE, T.QUICKSAND, T.CAATINGA, T.TALLDRY);
por('rocha', T.CLIFF, T.CLIMB, T.VOID, T.WALL, T.ROCK, T.CAVE, T.CAVEDOOR, T.RAIL);
por('pedra', T.STAIRS, T.PLAZA, T.COURT, T.TILEFLOOR);
por('templo', T.TEMPLEFLOOR, T.MOSAIC, T.OLDSTONE, T.STAIRUP, T.STAIRDOWN, T.CRACK, T.TEMPLEWALL);
por('madeira', T.BRIDGE, T.BRIDGEV, T.FLOOR, T.MAT, T.DOCK);
por('neve', T.SNOWFIELD, T.TALLSNOW, T.DEEPSNOW, T.SALT);
por('duro', T.SNOW);
por('gelo', T.ICE, T.FROZEN, T.ICEWALL, T.ICEFLOOR, T.CRYSTALWALL, T.SALTMIRROR);
por('caverna', T.CRYSTALFLOOR, T.DARKCAVE);
por('lava', T.LAVA);
por('basalto', T.BASALT, T.OBSIDIAN, T.LAVAFLOOR, T.LAVAWALL, T.HOLE);
por('cinza', T.ASH);
por('escura', T.GRASS2, T.FOREST, T.DARK, T.WEBG, T.WEBS);
por('flor', T.FLOWERS);
const GRAMAS = new Set([T.GRASS, T.GRASS2, T.TALL, T.FLOWERS, T.FOREST, T.DARK, T.GOLD, T.WEBG, T.WEBS]);
const AGUAS = new Set([T.WATER, T.DEEP, T.CUR_E, T.CUR_W, T.CUR_N, T.CUR_S, T.TIDE, T.SHALLOW, T.REED, T.REEF]);
const CAVERNA_BIOMA = /caverna|mina|cristal/;

// índice do canal de um material no layout (resolvendo o ALIAS); -1 = sem canal
function slotDe(layout, nome) {
  while (nome) { const i = layout.indexOf(nome); if (i >= 0) return i; nome = ALIAS[nome]; }
  return -1;
}

// GLSL: declarações das texturas de máscara e as leituras (c_<nome> = peso do material no ponto)
function leituras(layout, leve) {
  const nT = Math.ceil(layout.length / 4), DURO = new Set(['pedra', 'madeira', 'templo']);
  let s = '';
  for (let i = 0; i < nT; i++) s += `vec4 m${i} = texture2D(tM${i}, uv); vec4 r${i} = ${leve ? 'm' + i : `texture2D(tM${i}, uvR)`};\n`;
  for (const n of TODOS) {
    const i = layout.indexOf(n);
    s += i < 0 ? `float c_${n} = 0.0;\n` : `float c_${n} = ${DURO.has(n) ? 'r' : 'm'}${i >> 2}.${'rgba'[i & 3]};\n`;
  }
  return s;
}

function pars(layout, leve) {
  const nT = Math.ceil(layout.length / 4);
  return /* glsl */`
  ${GLSL_BASE}
  ${GLSL_PINTURA}
  ${GLSL_NUVEM}
  ${Array.from({ length: nT }, (_, i) => `uniform sampler2D tM${i};`).join(' ')} uniform vec4 uOrig; uniform float uModelo; uniform float uRuaPedra; uniform float uCoral;
  varying vec3 vMundo; varying vec3 vNorM;
  float gSombra; vec3 gEmi;
  float mk(float c, float nz){ return smoothstep(0.3, 0.7, c + (nz - 0.5) * 0.22); }
  vec3 pintarLG(){
    vec2 p = vMundo.xz;
    vec4 n1 = texture2D(tRuido, p * (1.0 / 300.0));
    vec4 n2 = texture2D(tRuido, p * (1.0 / 70.0));
    vec4 n3 = ${leve ? 'n2.abgr' : 'texture2D(tRuido, p * (1.0 / 17.0))'};
    vec2 warp = (n2.rg - 0.5) * 16.0 + (n3.ba - 0.5) * 6.0;
    vec2 uv = ((p + warp) / 16.0 - uOrig.xy) / uOrig.zw;
    vec2 uvR = ((p + warp * 0.18) / 16.0 - uOrig.xy) / uOrig.zw;
    ${leituras(layout, leve)}
    float terra = mk(c_terra, n3.r);
    float pedra = smoothstep(0.38, 0.62, c_pedra);
    float areia = mk(c_areia, n3.g);
    float mad = smoothstep(0.45, 0.55, c_madeira);
    float escura = smoothstep(0.15, 0.85, c_escura);
    float selva = smoothstep(0.15, 0.85, c_selva);
    float rocha = mk(c_rocha, n3.b);
    float flor = c_flor;
    float neve = mk(c_neve, n3.b), duro = mk(c_duro, n3.g), gelo = mk(c_gelo, n3.r);
    float deserto = mk(c_deserto, n3.a), verm = mk(c_vermelha, n3.g);
    float basalto = mk(c_basalto, n3.r), cinza = mk(c_cinza, n3.b), lava = smoothstep(0.4, 0.6, c_lava + (n3.r - 0.5) * 0.25);
    float lama = mk(c_lama, n3.a), templo = smoothstep(0.4, 0.6, c_templo), cav = mk(c_caverna, n3.g), mol = smoothstep(0.25, 0.75, c_molhada);
    // grama: manchas grandes claras e escuras, listras de corte, pontinhos
    float m = n1.r * 0.65 + n2.b * 0.35;
    vec3 g = mix(${lin('#427c28')}, ${lin('#7aa840')}, smoothstep(0.28, 0.78, m));
    g = mix(g, ${lin('#a8c858')}, smoothstep(0.62, 0.85, n1.g) * 0.3);
    float fx = sin(p.y * 0.1309 + (n2.a - 0.5) * 1.2);
    g *= 1.0 + 0.09 * smoothstep(-0.25, 0.25, fx) - 0.04;
    g *= 0.93 + 0.14 * n3.b;
    g = mix(g, g * ${lin('#c8dc78')} * 1.6, flor * 0.35);
    g = mix(g, ${lin('#3f8a36')} * (0.85 + 0.3 * n2.g), escura * 0.85);
    // selva: verde fundo e úmido, folhas caídas e manchas de luz
    vec3 sv = mix(${lin('#1c6528')}, ${lin('#3c9a3a')}, smoothstep(0.25, 0.8, m));
    sv = mix(sv, ${lin('#0e4624')}, smoothstep(0.55, 0.8, n3.r) * 0.55);
    sv = mix(sv, ${lin('#7bc044')}, smoothstep(0.78, 0.92, n2.g) * 0.35);
    sv = mix(sv, ${lin('#6a4a2a')}, smoothstep(0.7, 0.9, n2.a) * 0.22);
    g = mix(g, sv, selva);
    // terra: centro claro, beira mais escura e quente, pedrinhas
    float miolo = smoothstep(0.55, 0.98, c_terra);
    vec3 t = mix(${lin('#b98a56')}, ${lin('#e2bf86')}, miolo);
    // A terra do modelo é mais baixa e neutra: a rua deixa de parecer uma superfície iluminada por dentro.
    float modelo = uModelo;
    t *= 0.94 + 0.12 * n3.a;
    t = mix(t, ${lin('#efd6a4')}, step(0.86, n3.r) * 0.5 * miolo * (1.0 - modelo * 0.75));
    t *= mix(vec3(1.0), vec3(0.58, 0.66, 0.74), modelo);
    // pedra clara da praça, com juntas apagadas
    vec2 f = abs(fract(p / 16.0 + 0.5) - 0.5);
    float junta = 1.0 - smoothstep(0.0, 0.035, min(f.x, f.y));
    vec3 pd = mix(${lin('#b3a993')}, ${lin('#cbc2ad')}, smoothstep(0.45, 0.9, c_pedra)) * (0.95 + 0.08 * n2.r);
    pd *= 1.0 - junta * 0.1;
    // Pintura compartilhada: rua de pedra na vila, trilha terrosa na rota.
    float cidade = uRuaPedra;
    if (modelo > 0.001) {
    if (pedra > 0.001 || cidade * terra > 0.001) {
    vec3 lajes;
    if(uCoral>.5){
      vec2 lajota=fract(vec2(p.x+floor(p.y/12.0)*12.0,p.y)/vec2(24.0,12.0));
      float borda=1.0-smoothstep(0.01,0.045,min(min(lajota.x,1.0-lajota.x),min(lajota.y,1.0-lajota.y)));
      lajes=mix(vec3(.32,.29,.23),vec3(.43,.39,.31),n2.r)*(1.0-borda*.15)*(0.98+n3.r*.04);
    }else lajes = pintura(5.0, fract(p / 64.0)).rgb;
    t = mix(t, lajes, cidade);
    pd = mix(pd, lajes, modelo);
    }
    if (max(max(terra,pedra),max(max(neve,areia),max(deserto,rocha))) < 0.999) {
    vec3 gramaP = pintura(6.0, fract(p / 70.0)).rgb;
    gramaP = mix(vec3(dot(gramaP, vec3(0.2126,0.7152,0.0722))), gramaP, 0.72);
    g = mix(g, gramaP * vec3(0.27,0.34,0.34) * mix(1.0, 0.65, escura), modelo * (1.0 - selva * 0.7) * 0.95);
    }
    }
    g=mix(g,vec3(.14,.24,.14)*(0.9+n2.r*.15),uCoral*.35);
    // areia da praia: dourada clara com ondulações bem leves; a faixa molhada fica mais escura e brilha
    vec3 ar = mix(${lin('#e6c98a')}, ${lin('#f2dfa6')}, smoothstep(0.3, 0.75, n2.r)) * (0.96 + 0.08 * n3.g);
    ar *= 1.0 + 0.035 * sin((p.x * 0.6 + p.y * 0.9) * 0.22 + n2.g * 5.0);
    vec3 mo = mix(${lin('#bf9e62')}, ${lin('#d3b57a')}, n2.b) * (0.97 + 0.07 * n3.r);
    ar = mix(ar, mo, mol);
    vec2 fm = fract(p / vec2(16.0, 4.0));
    vec3 md = mix(${lin('#a8784a')}, ${lin('#c99a64')}, smoothstep(0.1, 0.5, fm.y) * (1.0 - smoothstep(0.85, 1.0, fm.y)));
    vec3 rc = mix(${lin('#7f7a70')}, ${lin('#a9a395')}, n2.g);
    // neve: branco azulado com sombras frias e brilhos; neve batida mais cinza; gelo ciano com rachaduras
    vec3 nv = mix(${lin('#dae7f4')}, ${lin('#f4f9ff')}, smoothstep(0.3, 0.8, m));
    nv = mix(nv, ${lin('#b6d0ec')}, smoothstep(0.5, 0.85, n2.g) * 0.5);
    nv += step(0.955, texture2D(tRuido, p * (1.0 / 4.5)).b) * 0.10;
    vec3 du = mix(${lin('#c8d8e8')}, ${lin('#e0eaf4')}, n2.r) * (0.96 + 0.07 * n3.a);
    du *= 1.0 - 0.06 * smoothstep(0.3, 0.7, sin(p.x * 0.22 + n2.g * 4.0) * 0.5 + 0.5);
    vec3 ge = mix(${lin('#86d0ee')}, ${lin('#cdf2fc')}, smoothstep(0.25, 0.8, n2.r));
    float raxa = 1.0 - smoothstep(0.0, 0.022, abs(n2.g - 0.5));
    raxa += (1.0 - smoothstep(0.0, 0.016, abs(n3.r - 0.5))) * 0.6;
    ge = mix(ge, ${lin('#f2fcff')}, clamp(raxa, 0.0, 1.0) * 0.7);
    ge += 0.07 * smoothstep(0.6, 1.0, sin((p.x + p.y) * 0.05 + n1.r * 9.0));
    // deserto: ouro com dunas de cristas suaves
    vec3 de = mix(${lin('#e8b562')}, ${lin('#f6d98f')}, smoothstep(0.3, 0.72, m));
    float cr = sin((p.x * 0.55 + p.y * 0.83) * 0.2 + n2.r * 7.0);
    de *= 1.0 + 0.07 * cr + 0.04 * (n3.b - 0.5);
    de = mix(de, ${lin('#d49a4a')}, smoothstep(0.62, 0.85, n1.g) * 0.4);
    // cânion: rocha vermelha em faixas, com fendas
    vec3 ve = mix(${lin('#b4503a')}, ${lin('#dc7c4c')}, smoothstep(0.25, 0.8, n2.r));
    float faixa = sin(p.y * 0.2 + n2.g * 6.0 + p.x * 0.02) * 0.5 + 0.5;
    ve = mix(ve, ${lin('#8c3a2e')}, smoothstep(0.55, 0.9, faixa) * 0.4);
    ve = mix(ve, ${lin('#eaa774')}, smoothstep(0.7, 0.95, 1.0 - faixa) * 0.25);
    ve *= 0.94 + 0.12 * n3.b;
    ve *= 1.0 - 0.28 * (1.0 - smoothstep(0.0, 0.03, abs(n2.a - 0.5)));
    // basalto escuro com veios, cinza fofa
    vec3 ba = mix(${lin('#30303c')}, ${lin('#4c4a5a')}, smoothstep(0.25, 0.8, n2.r));
    ba = mix(ba, ${lin('#6a6878')}, step(0.9, n3.b) * 0.55);
    ba *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.035, abs(n2.g - 0.5)));
    vec3 ci = mix(${lin('#78726e')}, ${lin('#a39d97')}, smoothstep(0.2, 0.85, n1.g * 0.5 + n2.b * 0.5)) * (0.95 + 0.1 * n3.r);
    // lama de mangue: marrom úmido com manchas esverdeadas e poças escuras
    vec3 la = mix(${lin('#6e5b3a')}, ${lin('#4f4b2b')}, smoothstep(0.25, 0.8, n2.r));
    la = mix(la, ${lin('#4a6030')}, smoothstep(0.55, 0.82, n1.g) * 0.4);
    la = mix(la, ${lin('#2f3a22')}, smoothstep(0.66, 0.8, n3.r) * 0.55);
    // pedra de templo: lajes grandes, juntas fundas, musgo
    vec2 fl = abs(fract(p / 32.0 + 0.5) - 0.5);
    float jt = 1.0 - smoothstep(0.0, 0.04, min(fl.x, fl.y));
    vec3 tp = mix(${lin('#b3a88e')}, ${lin('#d3caaf')}, smoothstep(0.3, 0.85, n2.r)) * (0.95 + 0.08 * n3.g);
    tp = mix(tp, ${lin('#7e9a58')}, smoothstep(0.62, 0.85, n1.g) * 0.32);
    tp *= 1.0 - jt * 0.2;
    // caverna: pedra azul-acinzentada com brilhos de cristal
    vec3 cv = mix(${lin('#4f5470')}, ${lin('#7a809c')}, smoothstep(0.25, 0.8, n2.r)) * (0.94 + 0.1 * n3.a);
    cv += step(0.965, texture2D(tRuido, p * (1.0 / 5.5)).g) * vec3(0.12, 0.2, 0.28);
    vec3 c = g;
    c = mix(c, ar, areia);
    c = mix(c, t, terra);
    c *= 1.0 - 0.16 * terra * (1.0 - terra) * 4.0 * (1.0 - areia); // contato grama/terra
    c = mix(c, de, deserto);
    c = mix(c, la, lama);
    c = mix(c, nv, neve);
    c = mix(c, du, duro);
    c = mix(c, ge, gelo);
    c = mix(c, ve, verm);
    c = mix(c, ci, cinza);
    c = mix(c, ba, basalto);
    c = mix(c, cv, cav);
    c = mix(c, pd, pedra);
    c = mix(c, tp, templo);
    c = mix(c, rc, rocha);
    c = mix(c, md, mad);
    // lava: fluxo lento de crostas escuras sobre o miolo quente; emissiva, e esquenta o chão em volta
    gEmi = vec3(0.0);
    float brilho = smoothstep(0.0, 0.5, c_lava) * (1.0 - lava);
    c = mix(c, c * ${lin('#ff9a60')} * 1.5, brilho * 0.5);
    gEmi += ${lin('#ff5a1a')} * brilho * 0.22;
    if (lava > 0.0) {
      ${leve ? 'float a = n2.r, b = n3.g;' : `vec2 fq = p / 46.0;
      float a = texture2D(tRuido, fq + vec2(tempo * 0.018, tempo * 0.011)).r;
      float b = texture2D(tRuido, fq * 2.3 - vec2(tempo * 0.013, -tempo * 0.02)).g;`}
      float crosta = smoothstep(0.42, 0.62, a * 0.6 + b * 0.4);
      vec3 lv = mix(${lin('#ffb02c')}, ${lin('#ff4410')}, smoothstep(0.1, 0.5, a));
      lv = mix(lv, ${lin('#3b160f')}, crosta);
      c = mix(c, lv * 0.55, lava);
      gEmi += lv * (1.0 - crosta * 0.88) * lava * (1.25 + 0.2 * sin(tempo * 1.7 + p.x * 0.05));
    }
    // faces verticais: barranco com camadas, na cor do bioma
    float vert = 1.0 - smoothstep(0.35, 0.75, abs(vNorM.y));
    if (vert > 0.0) {
      float cam = ${leve ? 'n2.r' : 'sin(vMundo.y * 0.55 + n2.r * 3.0) * 0.5 + 0.5'};
      vec3 bar = mix(${lin('#8a7058')}, ${lin('#b29274')}, cam * 0.7 + n3.g * 0.3);
      float pg = clamp(c_neve + c_duro + c_gelo, 0.0, 1.0);
      bar = mix(bar, mix(${lin('#9fb6d2')}, ${lin('#dbe8f5')}, cam * 0.7 + n3.g * 0.3), pg);
      bar = mix(bar, mix(${lin('#a04630')}, ${lin('#cc704a')}, cam), clamp(c_vermelha * 1.4, 0.0, 1.0));
      bar = mix(bar, mix(${lin('#c89a58')}, ${lin('#e6c386')}, cam), clamp(c_deserto * 1.4, 0.0, 1.0));
      bar = mix(bar, mix(${lin('#2a2830')}, ${lin('#4c4a58')}, cam), clamp(c_basalto + c_cinza + c_lava, 0.0, 1.0));
      bar = mix(bar, mix(${lin('#4a4e68')}, ${lin('#767c98')}, cam), clamp(c_caverna * 1.4, 0.0, 1.0));
      bar = mix(bar, mix(${lin('#a39a80')}, ${lin('#c8bfa4')}, cam), clamp(c_templo * 1.4, 0.0, 1.0));
      c = mix(c, bar, vert); gEmi *= 1.0 - vert;
    }
    gSombra = sombraNuvem(p);
    return c;
  }
`;
}

export class ChaoLG {
  constructor(v) {
    this.v = v;
    const q = new URLSearchParams(location.search).get('chao');
    this.leve = q ? q === 'leve' : (v.amb?.nivel?.nome ?? 'alta') !== 'alta'; // celular: shader mais leve
    this.layout = this.leve ? CANAIS_LEVE : CANAIS_PLENO;
    this.pars = pars(this.layout, this.leve);
    this.slot = Object.fromEntries(TODOS.map((n) => [n, slotDe(this.layout, n)]));
  }
  // máscaras do setor (16 + 2 de margem): uma textura por 4 canais
  mascara(sx, sy) {
    const x0 = sx * 16 - 1, y0 = sy * 16 - 1, W = 18, nT = Math.ceil(this.layout.length / 4);
    const d = [], t = [];
    for (let i = 0; i < nT; i++) {
      const da = new Uint8Array(W * W * 4), tx = new THREE.DataTexture(da, W, W, THREE.RGBAFormat);
      tx.magFilter = tx.minFilter = THREE.LinearFilter; tx.generateMipmaps = false; tx.flipY = false; tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping;
      d.push(da); t.push(tx);
    }
    const M = { t, d, x0, y0, W, uOrig: { value: new THREE.Vector4(x0, y0, W, W) } };
    this.preencher(M);
    return M;
  }
  preencher(M) {
    const L = this.v.L, map = this.v.g.map, S = this.slot, W = M.W, nT = M.d.length;
    for (const da of M.d) da.fill(0);
    const agua = (x, y) => AGUAS.has(L.blocoCru(x, y));
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
      const x = M.x0 + i, y = M.y0 + j, t = L.blocoCru(x, y);
      let nome = MATERIAL[t], val = 1;
      // o que depende do lugar: selva, caverna, brejo, areia molhada junto da água
      const dep = GRAMAS.has(t) || nome === 'rocha' || t === T.SHALLOW || t === T.REED || t === T.SAND;
      const bioma = dep ? (map.areaAt?.(x * 16 + 8, y * 16 + 8)?.biome ?? '') : '';
      if (GRAMAS.has(t) && bioma === 'selva') nome = 'selva';
      else if (nome === 'rocha' && CAVERNA_BIOMA.test(bioma)) nome = 'caverna';
      else if (t === T.SHALLOW || t === T.REED) nome = /mangue|brejo/.test(bioma) ? 'lama' : 'areia';
      const k = i + j * W;
      const poe = (n, v) => { const s = S[n]; if (s >= 0 && n) M.d[s >> 2][k * 4 + (s & 3)] = Math.max(M.d[s >> 2][k * 4 + (s & 3)], v * 255); };
      if (nome) poe(nome, val);
      if (nome === 'molhada') poe('areia', 1); // a areia molhada é areia por baixo
      if (t === T.SAND) { // faixa molhada onde a areia encosta na água
        let perto = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if ((a || b) && agua(x + a, y + b)) perto = 1;
        if (perto) poe('molhada', 0.85);
      }
    }
    for (const tx of M.t) tx.needsUpdate = true;
  }
  material(sx, sy) {
    const M = this.mascara(sx, sy);
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, side: THREE.DoubleSide });
    m.customProgramCacheKey = () => 'lg-chao' + (this.leve ? '-leve' : '');
    m.userData.mascaraLG = M;
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { tPintura: { value: atlasPintado() }, tempo: U.tempo, tRuido: U.tRuido, nuvem: U.nuvem, noite: U.noite, uOrig: M.uOrig, uModelo: { value: 1 }, uCoral:{value:emCidadeCoral(this.v.g.map,(sx*16+8)*16,(sy*16+8)*16)?1:0}, uRuaPedra: { value: (()=>{const a=this.v.g.map.areaAt((sx*16+8)*16,(sy*16+8)*16);return /cidade|vila|city|town/i.test((a?.biome??'')+' '+(a?.name??''))?1:0;})() } });
      M.t.forEach((tx, i) => { sh.uniforms['tM' + i] = { value: tx }; });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n varying vec3 vMundo; varying vec3 vNorM;')
        .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
          vMundo = (modelMatrix * vec4(transformed, 1.0)).xyz; vNorM = normalize(mat3(modelMatrix) * objectNormal);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + this.pars)
        .replace('#include <map_fragment>', 'diffuseColor.rgb *= pintarLG();')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += gEmi;`)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          reflectedLight.directDiffuse *= gSombra;`);
    };
    return m;
  }
  liberar(m) { const M = m.userData.mascaraLG; if (M) for (const tx of M.t) tx.dispose(); m.dispose(); }

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
