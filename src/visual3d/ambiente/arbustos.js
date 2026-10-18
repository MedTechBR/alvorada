import * as THREE from 'three';
import { TILE } from '../../world/tiles.js';
import { hash, sorteio } from './ruido.js';
import { U, iniciarComum, GLSL_BASE, GLSL_NUVEM, GLSL_MANCHA } from './comum.js';

// Vegetação de enfeite instanciada: arbustos redondos e fofos (vários "repolhos" de folha juntos, superfície
// encaroçada), com frutinhas vermelhas; fileiras de cerca viva e folhagem em volta do pé das árvores.
// É enfeite de chão: os objetos do catálogo (árvores, cercas, prédios) são do kit de modelos.
// Custo: 1 draw call por variante de arbusto (3) + 1 para as frutas, por lote.

const VARIANTES = 3;
// arbusto = 4 a 6 esferas encaroçadas sobrepostas, base achatada no chão (raio ~1, altura ~1.1)
function geoArbusto(seed, seg) {
  const R = sorteio(seed), partes = [];
  const n = 4 + Math.floor(R() * 3);
  partes.push([0, 0.55, 0, 0.72]);
  for (let i = 1; i < n; i++) { const a = R() * Math.PI * 2, d = 0.3 + R() * 0.32; partes.push([Math.cos(a) * d, 0.42 + R() * 0.4, Math.sin(a) * d, 0.42 + R() * 0.22]); }
  const pos = [], nor = [], idx = [], cima = [];
  for (const [cx, cy, cz, r] of partes) {
    const g = new THREE.SphereGeometry(1, seg, Math.max(5, seg * 0.7 | 0));
    const P = g.attributes.position, b = pos.length / 3, s2 = R() * 1000;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      // caroços: soma de ondas na direção (folhas em cachos)
      const k = 1 + 0.09 * Math.sin(x * 7 + s2) * Math.sin(y * 6 + s2 * 0.3) * Math.sin(z * 7 - s2) + 0.05 * Math.sin(x * 13 + y * 11 + s2);
      let px = cx + x * r * k, py = cy + y * r * k, pz = cz + z * r * k;
      if (py < 0.02) py = 0.02 + (py - 0.02) * 0.1; // achata no chão
      pos.push(px, py, pz); nor.push(x, y, z); cima.push(y);
    }
    for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + b);
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aCima', new THREE.Float32BufferAttribute(cima, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function matArbusto() {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff });
  m.customProgramCacheKey = () => 'amb-arbusto';
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { tempo: U.tempo, tRuido: U.tRuido, nuvem: U.nuvem, vento: U.vento, noite: U.noite, uClaro: U.uClaro, uEscuro: U.uEscuro, uSeco: U.uSeco });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        ${GLSL_BASE}
        uniform vec4 vento; attribute float aCima; varying float vCima; varying vec3 vMundoA; varying vec3 vNorA;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 orig = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        float bal = sin(tempo * 1.3 + orig.x * 0.05 + orig.z * 0.03) * 0.04 * vento.z * max(position.y, 0.0);
        transformed.x += bal * vento.x; transformed.z += bal * vento.y;
        vCima = aCima;`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vMundoA = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz; vNorA = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        ${GLSL_BASE}
        ${GLSL_NUVEM}
        ${GLSL_MANCHA}
        varying float vCima; varying vec3 vMundoA; varying vec3 vNorA;`)
      .replace('#include <map_fragment>', `
        // cachos de folha: manchas escuras pequenas + brilho nas pontas viradas para cima
        // folhas em quadradinhos (pixel art do protótipo): ruído amostrado em células de 1,5 px
        vec3 cel = floor(vMundoA / 1.5) * 1.5;
        vec2 q = cel.xz * 0.21 + cel.y * vec2(0.17, -0.13);
        float f = texture2D(tRuido, q).b, f2 = texture2D(tRuido, q * 3.1 + 0.37).r;
        float folha = smoothstep(0.3, 0.7, f * 0.5 + f2 * 0.5);
        float luzC = smoothstep(-0.7, 0.9, vNorA.y);
        diffuseColor.rgb *= mix(0.5, 1.08, luzC) * mix(0.7, 1.18, folha);
        diffuseColor.rgb *= mix(vec3(1.0), tomMancha(vMundoA.xz), 0.5);`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.directDiffuse *= sombraNuvem(vMundoA.xz);
        // borda iluminada (luz que atravessa as folhas)
        float aro = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 3.0);
        reflectedLight.directDiffuse += diffuseColor.rgb * aro * 0.35 * (1.0 - noite);`);
  };
  return m;
}

const COR = (h) => new THREE.Color(h);
export const CORES_ARBUSTO = [COR(0x5a9a36), COR(0x64a43a), COR(0x4e8e30), COR(0x6aa63e)];

export class Arbustos {
  constructor(nivel = {}) {
    iniciarComum();
    this.nivel = nivel;
    const seg = nivel.arbustoSeg ?? 12;
    this.geos = Array.from({ length: VARIANTES }, (_, i) => geoArbusto(1234 + i * 77, seg));
    this.mat = matArbusto();
    this.geoFruta = new THREE.IcosahedronGeometry(1, 1);
    this.matFruta = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x2a0c04 });
  }
  // lista: [{ x, z, y = 0, r = 8 (raio px), alt = 1 (altura relativa), cor (THREE.Color), frutas = 0 (quantas), corFruta }]
  // Devolve { grupo, liberar() }
  lote(lista) {
    const grupo = new THREE.Group(), por = Array.from({ length: VARIANTES }, () => []), frutas = [];
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Pv = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const densF = this.nivel.frutas ?? 1;
    for (const a of lista) {
      const v = (hash(a.x | 0, a.z | 0, 5) * VARIANTES) | 0;
      por[v].push(a);
      const nf = Math.round((a.frutas ?? 0) * densF);
      for (let i = 0; i < nf; i++) {
        // na metade de cima e virada para a câmera (sul)
        const th = hash(a.x | 0, i, 11) * Math.PI * 1.1 - 0.05, ph = 0.25 + hash(a.z | 0, i, 13) * 0.9;
        const r = a.r ?? 8, al = a.alt ?? 1;
        const dx = Math.cos(th) * Math.sin(ph + 0.4), dz = Math.sin(th) * Math.sin(ph + 0.4), dy = Math.cos(ph);
        frutas.push([a.x + dx * r * 0.8, (a.y ?? 0) + (0.55 + dy * 0.6) * r * al, a.z + Math.abs(dz) * r * 0.8, 0.8 + hash(i, a.x | 0, 17) * 0.35, a.corFruta]);
      }
    }
    const malhas = [];
    por.forEach((arr, v) => {
      if (!arr.length) return;
      const im = new THREE.InstancedMesh(this.geos[v], this.mat, arr.length);
      arr.forEach((a, i) => {
        const r = a.r ?? 8;
        Q.setFromAxisAngle(up, hash(a.x | 0, a.z | 0, 7) * 6.283);
        S.set(r * (a.larg ?? 1), r * (a.alt ?? 1), r * (a.prof ?? 1));
        M.compose(Pv.set(a.x, (a.y ?? 0) - 0.5, a.z), Q, S); im.setMatrixAt(i, M);
        const c = (a.cor ?? CORES_ARBUSTO[(hash(a.x | 0, a.z | 0, 9) * CORES_ARBUSTO.length) | 0]).clone();
        c.multiplyScalar(0.9 + hash(a.z | 0, a.x | 0, 3) * 0.2);
        im.setColorAt(i, c);
      });
      im.castShadow = true; im.receiveShadow = true;
      im.computeBoundingSphere();
      grupo.add(im); malhas.push(im);
    });
    if (frutas.length) {
      const im = new THREE.InstancedMesh(this.geoFruta, this.matFruta, frutas.length), c = new THREE.Color();
      frutas.forEach(([x, y, z, s, cor], i) => { M.compose(Pv.set(x, y, z), Q.identity(), S.set(s, s, s)); im.setMatrixAt(i, M); im.setColorAt(i, c.set(cor ?? 0xc8582a)); });
      im.computeBoundingSphere(); grupo.add(im); malhas.push(im);
    }
    return { grupo, n: lista.length, liberar: () => { for (const m of malhas) m.dispose(); } };
  }

  // ---- ajudantes para montar listas ----
  // fileira de cerca viva de (x0,z0) a (x1,z1): arbustos encostados, com frutinhas
  static fileira(x0, z0, x1, z1, o = {}) {
    const r = o.r ?? 9, passo = o.passo ?? r * 1.55, L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / passo)), out = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = x0 + (x1 - x0) * k, z = z0 + (z1 - z0) * k, j = hash(x | 0, z | 0, 31);
      out.push({ x: x + (j - 0.5) * 2, z: z + (hash(z | 0, x | 0, 33) - 0.5) * 2, y: o.altura?.(x, z) ?? 0, r: r * (0.9 + j * 0.22), alt: o.alt ?? 1.05, frutas: o.frutas ?? 5, cor: o.cor });
    }
    return out;
  }
  // folhagem em volta do pé de uma árvore (raio da copa em px)
  static folhagemArvore(x, z, raio = 16, o = {}) {
    const out = [], n = o.n ?? 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + hash(x | 0, z | 0, i) * 0.9, d = raio * (0.55 + hash(x | 0, i, 41) * 0.4);
      const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d * 0.7 + 3;
      out.push({ x: px, z: pz, y: o.altura?.(px, pz) ?? 0, r: 4 + hash(i, z | 0, 43) * 4, alt: 0.8 + hash(i, x | 0, 45) * 0.4, frutas: hash(x | 0, z | 0, 47) < 0.3 ? 2 : 0 });
    }
    return out;
  }
  // Enfeite tirado do mapa, num retângulo de blocos: folhagem no pé das árvores e na borda das matas (FOREST),
  // arbustos onde o catálogo tem 'roundbush'. o: altura(px,pz), objetos (lista de objetos do jogo), ehArvore(kind)
  static doMapa(L, x0, y0, w, h, o = {}) {
    const out = [], alt = o.altura ?? (() => 0);
    const ehArvore = o.ehArvore ?? ((k) => /tree|pine|autumn|ipe|paineira|jequitiba|oran|pecha|araucaria|coqueiro|palm/i.test(k));
    for (const ob of o.objetos ?? []) {
      if (ob.dead) continue;
      const cx = (ob.tx + (ob.fw ?? 1) / 2) * 16, cz = (ob.ty + (ob.fh ?? 1)) * 16 - 4;
      if (ehArvore(ob.kind)) out.push(...Arbustos.folhagemArvore(cx, cz, (ob.fw ?? 2) * 9, { altura: alt, n: o.nFolhagem ?? 4 }));
      else if (ob.kind === 'roundbush') out.push(...Arbustos.fileira(cx - 12, cz - 4, cx + 12, cz - 4, { r: 8, altura: alt }));
    }
    // borda das matas: arbustos na beira que dá para o campo
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (L.bloco(x, y) !== TILE.FOREST) continue;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0]]) {
        const t = L.bloco(x + dx, y + dy);
        if (t === TILE.FOREST || t === TILE.CLIFF || t === TILE.WATER) continue;
        if (hash(x, y, dx * 3 + dy) < 0.7) { const px = x * 16 + 8 + dx * 8, pz = y * 16 + 8 + dy * 8; out.push({ x: px, z: pz, y: alt(px, pz), r: 6 + hash(x, y, 51) * 5, alt: 0.9, frutas: hash(x, y, 53) < 0.2 ? 3 : 0 }); }
      }
    }
    return out;
  }
}
