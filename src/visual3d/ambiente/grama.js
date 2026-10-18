import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { hash } from './ruido.js';
import { U, iniciarComum, GLSL_BASE, GLSL_NUVEM, GLSL_VENTO, GLSL_MANCHA } from './comum.js';
import { camadaDoBloco } from './terreno.js';
import { CAMADA } from './texturas.js';

// Grama, capim e flores instanciados (HD-2D: o campo denso e amarelado da referência).
//   - tufo = algumas lâminas afiladas e curvas, em leque; milhares de tufos numa malha só por lote (setor);
//   - vento no shader (rajadas que correm pelo campo + tremor) e quem passa afasta e abaixa as lâminas
//     (U.atores: até 8 pontos com raio e força; o jogador, Pokémon, NPCs...);
//   - mesma mancha de baixa frequência do terreno (tomMancha) e mesma sombra de nuvem: a grama casa com o chão;
//   - mato alto do mapa (TALL e afins) vira capim alto e fechado; borda de trilha, cerca e muro ganha capim;
//   - flores pequenas espalhadas (mais nos blocos de flores).
// Custo: 1 draw call por lote para a grama + 1 para as flores. A densidade vem de qualidade.js (nivel.grama).

const COR = (h, k = 1) => { const c = new THREE.Color(h); return [c.r * k, c.g * k, c.b * k]; };
// cor da ponta das lâminas por tipo
const TIPOS = {
  campo: { cor: COR(0xa8cc4e), alt: [3, 6], larg: 1.1 },
  escuro: { cor: COR(0x86b444), alt: [3, 6], larg: 1.1 },
  alto: { cor: COR(0xbcd65a), alt: [10, 16], larg: 1.25 },
  capim: { cor: COR(0xc8d866), alt: [7, 12], larg: 1.15 },
  neve: { cor: COR(0xe6eef2), alt: [9, 14], larg: 1.3 },
  seco: { cor: COR(0xd8b46a), alt: [9, 15], larg: 1.2 },
  junco: { cor: COR(0x8fae4a), alt: [16, 24], larg: 1.1 },
  mangue: { cor: COR(0x7f9a44), alt: [6, 10], larg: 1.2 },
};
const FLORES = [COR(0xffffff), COR(0xfff2a0), COR(0xffa6c8), COR(0xff7a9a), COR(0xb8a8ff), COR(0xffd36a)];
const ALTO = new Set([TILE.TALL, TILE.TALLSNOW, TILE.TALLDRY, TILE.REED, TILE.CORN].filter((t) => t !== undefined));
// vizinho que pede capim na borda (trilha, praça, areia, água, muro...)
const PEDE_BORDA = new Set([CAMADA.TERRA, CAMADA.CALCADA, CAMADA.AREIA, CAMADA.AREIA_MOLHADA, CAMADA.ROCHA, CAMADA.MADEIRA]);
const GRAMADO = new Set([CAMADA.GRAMA, CAMADA.GRAMA_ESC, CAMADA.MANGUE]);

// geometria do tufo: n lâminas em leque, 3 segmentos cada (posição local; aAlt 0 no pé, 1 na ponta)
function geoTufo(n) {
  const pos = [], alt = [], idx = [];
  for (let b = 0; b < n; b++) {
    const ang = (b / n) * Math.PI * 2 + hash(b, n, 3) * 0.8, r0 = 0.4 + hash(b, n, 5) * 1.6;
    const ca = Math.cos(ang), sa = Math.sin(ang), inc = 0.25 + hash(b, n, 7) * 0.35, h = 0.75 + hash(b, n, 9) * 0.25;
    const px = -sa, pz = ca, base = pos.length / 3; // lâmina de frente para o lado
    const S = 3;
    for (let i = 0; i <= S; i++) {
      const k = i / S, w = (1 - k) * 0.5 + 0.02, cx = ca * (r0 + inc * k * k * 4), cz = sa * (r0 + inc * k * k * 4), y = k * h;
      if (i < S) { pos.push(cx - px * w, y, cz - pz * w, cx + px * w, y, cz + pz * w); alt.push(k, k); }
      else { pos.push(cx, y, cz); alt.push(1); }
    }
    for (let i = 0; i < S - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const a = base + (S - 1) * 2; idx.push(a, a + 1, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAlt', new THREE.Float32BufferAttribute(alt, 1));
  g.setIndex(idx);
  return g;
}
// flor: haste fina + cabeça (dois losangos cruzados, quase deitados)
function geoFlor() {
  const pos = [], alt = [], parte = [], idx = [];
  const q = (a, b, c, d, k, p) => { const n = pos.length / 3; pos.push(...a, ...b, ...c, ...d); alt.push(...k); parte.push(p, p, p, p); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  q([-0.25, 0, 0], [0.25, 0, 0], [0.25, 1, 0], [-0.25, 1, 0], [0, 0, 1, 1], 0);
  const r = 1.6, y = 1;
  q([-r, y, 0], [0, y + 0.35, -r], [r, y, 0], [0, y - 0.35, r], [1, 1, 1, 1], 1);
  q([-r * 0.7, y + 0.2, -r * 0.7], [r * 0.7, y + 0.2, -r * 0.7], [r * 0.7, y - 0.2, r * 0.7], [-r * 0.7, y - 0.2, r * 0.7], [1, 1, 1, 1], 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAlt', new THREE.Float32BufferAttribute(alt, 1));
  g.setAttribute('aParte', new THREE.Float32BufferAttribute(parte, 1));
  g.setIndex(idx);
  return g;
}

function material(flor) {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  m.customProgramCacheKey = () => flor ? 'amb-flor' : 'amb-grama';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { tempo: U.tempo, tRuido: U.tRuido, nuvem: U.nuvem, vento: U.vento, atores: U.atores, noite: U.noite, uClaro: U.uClaro, uEscuro: U.uEscuro, uSeco: U.uSeco });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        ${GLSL_BASE}
        ${GLSL_VENTO}
        attribute vec4 aBase; attribute vec4 aInfo; attribute vec3 aCor; attribute float aAlt; ${flor ? 'attribute float aParte; varying float vParte;' : ''}
        varying vec3 vCorG; varying float vAltG; varying vec2 vPeG;`)
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);')
      .replace('#include <begin_vertex>', `
        float cg = cos(aInfo.x), sg = sin(aInfo.x);
        vec3 pl = vec3(position.x * aInfo.y, position.y * aBase.w, position.z * aInfo.y);
        pl = vec3(cg * pl.x - sg * pl.z, pl.y, sg * pl.x + cg * pl.z);
        vec3 transformed = aBase.xyz + pl + dobra(aBase.xz, aAlt, aInfo.w) * (0.4 + aBase.w / 18.0);
        vCorG = aCor; vAltG = aAlt; vPeG = aBase.xz; ${flor ? 'vParte = aParte;' : ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        ${GLSL_BASE}
        ${GLSL_NUVEM}
        ${GLSL_MANCHA}
        varying vec3 vCorG; varying float vAltG; varying vec2 vPeG; ${flor ? 'varying float vParte;' : ''}`)
      .replace('#include <map_fragment>', flor
        ? `diffuseColor.rgb = vParte > 0.5 ? vCorG : vec3(0.16, 0.26, 0.07);`
        : `vec3 tom = tomMancha(vPeG);
           vec3 c = mix(vCorG * vec3(0.5, 0.6, 0.4), vCorG * vec3(0.86, 0.92, 0.78), smoothstep(0.0, 0.5, vAltG));
           c = mix(c, vCorG * vec3(1.18, 1.14, 0.92), smoothstep(0.6, 1.0, vAltG));
           diffuseColor.rgb = c * tom;`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.directDiffuse *= sombraNuvem(vPeG);`);
  };
  return m;
}

export class Grama {
  // nivel: de qualidade.js (grama = densidade 0..1, laminas = lâminas por tufo, flores = densidade)
  constructor(nivel = {}) {
    iniciarComum();
    this.nivel = nivel;
    this.geo = geoTufo(nivel.laminas ?? 5);
    this.geoF = geoFlor();
    this.mat = material(false); this.matF = material(true);
  }
  // Monta a grama de um retângulo de blocos. L: MapaLeitura (ou {bloco(x,y)}); o:
  //   altura(px, pz) altura do chão (relevo.em); ocupado(x, y) bloco com árvore/prédio (sem grama)
  //   extra(x, y) -> 0..1: capim extra no bloco (cerca, muro, pé de árvore)
  // Devolve { grupo, liberar() }.
  lote(L, x0, y0, w, h, o = {}) {
    const N = this.nivel, dens = N.grama ?? 1, densF = N.flores ?? 1, alt = o.altura ?? (() => 0), ocupado = o.ocupado ?? (() => false);
    const G = [], F = [];
    const tipoDe = (t, cam) => t === TILE.TALLSNOW ? 'neve' : t === TILE.TALLDRY ? 'seco' : t === TILE.REED ? 'junco' : cam === CAMADA.MANGUE ? 'mangue' : cam === CAMADA.GRAMA_ESC ? 'escuro' : 'campo';
    const tufo = (x, z, tipo, k = 1, s = 0) => {
      const T = TIPOS[tipo], r = hash(x * 7 | 0, z * 7 | 0, s);
      const hh = (T.alt[0] + (T.alt[1] - T.alt[0]) * r) * k;
      const cor = T.cor, v = 0.86 + hash(x | 0, z | 0, s + 1) * 0.28;
      G.push(x, alt(x, z) - 0.3, z, hh, hash(x | 0, z | 0, s + 2) * 6.283, T.larg * (0.85 + r * 0.3), 0, hash(z | 0, x | 0, s + 3), cor[0] * v, cor[1] * v, cor[2] * (0.9 + r * 0.2));
    };
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (ocupado(x, y)) continue;
      const t = L.bloco(x, y), cam = camadaDoBloco(t), px = x * 16, pz = y * 16;
      const alto = ALTO.has(t);
      if (!alto && !GRAMADO.has(cam) && !(t === TILE.TALLSNOW || t === TILE.TALLDRY)) continue;
      // capim na borda com trilha, praça, areia, água e muro
      let borda = 0;
      const viz = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (let i = 0; i < 4; i++) { const c2 = camadaDoBloco(L.bloco(x + viz[i][0], y + viz[i][1])); if (PEDE_BORDA.has(c2)) borda |= 1 << i; }
      const ext = o.extra?.(x, y) ?? 0;
      const tipo = tipoDe(t, cam);
      if (alto) {
        const n = Math.round((t === TILE.CORN ? 0 : 16) * Math.max(0.35, dens));
        for (let i = 0; i < n; i++) tufo(px + hash(x, y, i * 2 + 100) * 16, pz + hash(x, y, i * 2 + 101) * 16, t === TILE.TALL ? 'alto' : tipo, 1, i);
      } else {
        const n = Math.round((cam === CAMADA.MANGUE ? 3 : 6) * dens);
        for (let i = 0; i < n; i++) tufo(px + hash(x, y, i * 2 + 200) * 16, pz + hash(x, y, i * 2 + 201) * 16, tipo, 0.8 + hash(x, y, i + 300) * 0.5, i + 50);
        // tufos maiores aqui e ali (o campo não é um tapete)
        if (hash(x, y, 77) < 0.22 * dens + ext) for (let i = 0; i < 5; i++) tufo(px + 4 + hash(x, y, i + 400) * 8, pz + 4 + hash(x, y, i + 410) * 8, 'capim', 0.7 + hash(x, y, i + 420) * 0.4, i + 90);
      }
      if (borda || ext > 0) {
        const n = Math.round((borda ? 7 : 0) * Math.max(0.5, dens) + ext * 8);
        for (let i = 0; i < n; i++) {
          let bx = px + hash(x, y, i + 500) * 16, bz = pz + hash(x, y, i + 510) * 16;
          // puxa para o lado da borda
          if (borda & 1) bz = pz + hash(x, y, i + 520) * 4; else if (borda & 4) bz = pz + 12 + hash(x, y, i + 520) * 4;
          if (borda & 8) bx = px + hash(x, y, i + 530) * 4; else if (borda & 2) bx = px + 12 + hash(x, y, i + 530) * 4;
          tufo(bx, bz, tipo === 'campo' ? 'capim' : tipo, 0.8 + hash(x, y, i + 540) * 0.45, i + 130);
        }
      }
      // flores
      const nf = t === TILE.FLOWERS ? Math.round(10 * densF) : hash(x, y, 900) < 0.16 * densF ? 1 + (hash(x, y, 901) * 3 | 0) : 0;
      const corF = FLORES[(hash(x >> 2, y >> 2, 902) * FLORES.length) | 0];
      for (let i = 0; i < nf; i++) {
        const fx = px + hash(x, y, i + 910) * 16, fz = pz + hash(x, y, i + 920) * 16, c = hash(x, y, i + 930) < 0.75 ? corF : FLORES[(hash(x, y, i + 940) * FLORES.length) | 0];
        F.push(fx, alt(fx, fz) - 0.2, fz, 4 + hash(x, y, i + 950) * 4, hash(x, y, i + 960) * 6.28, 0.75 + hash(x, y, i + 970) * 0.4, 0, hash(x, y, i + 980), c[0], c[1], c[2]);
      }
    }
    const grupo = new THREE.Group();
    const mk = (dados, geo, mat) => {
      if (!dados.length) return null;
      const n = dados.length / 11, ig = new THREE.InstancedBufferGeometry();
      ig.index = geo.index; ig.attributes.position = geo.attributes.position; ig.attributes.aAlt = geo.attributes.aAlt;
      if (geo.attributes.aParte) ig.attributes.aParte = geo.attributes.aParte;
      const buf = new THREE.InstancedInterleavedBuffer(new Float32Array(dados), 11, 1);
      ig.setAttribute('aBase', new THREE.InterleavedBufferAttribute(buf, 4, 0));
      ig.setAttribute('aInfo', new THREE.InterleavedBufferAttribute(buf, 4, 4));
      ig.setAttribute('aCor', new THREE.InterleavedBufferAttribute(buf, 3, 8));
      ig.instanceCount = n;
      const cx = (x0 + w / 2) * 16, cz = (y0 + h / 2) * 16;
      ig.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, alt(cx, cz), cz), Math.hypot(w, h) * 8 + 64);
      const me = new THREE.Mesh(ig, mat); me.receiveShadow = true; me.castShadow = false;
      grupo.add(me); return me;
    };
    const mg = mk(G, this.geo, this.mat), mf = mk(F, this.geoF, this.matF);
    return { grupo, tufos: G.length / 11, flores: F.length / 11, liberar: () => { for (const m of [mg, mf]) if (m) { m.geometry.dispose(); } } };
  }
}
