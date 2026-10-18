import * as THREE from 'three';
import { SPR } from '../world/art.js';
import { criarAtlas, AtlasDinamico } from './atlas.js';
import { comNuvens } from './ceu.js';
import { curvarMaterial } from './curva.js';
import { kit } from './kit/index.js';

// Modelos low-poly gerados por código, no estilo HD-2D do protótipo (blocos meio voxel, pixel art nas faces),
// sem copiar modelo nenhum. Por setor, tudo o que é estático vira uma malha só (um draw call):
//   - adereços: árvores, pinheiros, palmeiras, cactos, arbustos, pedras, troncos, cercas, postes, placas, móveis,
//     paredes e telhados dos prédios (atlas de materiais, cor no vértice);
//   - fachadas: a frente dos prédios usa a própria arte 2D do prédio (janelas, porta, letreiro), recortada num
//     atlas que cresce; as janelas acendem à noite;
//   - sombras assadas: manchas no chão debaixo de cada modelo.
// O kit de modelos (src/visual3d/kit, ramo modelos3d), quando existir, tem prioridade: kit.modelo(kind, obj).
// Objeto com mecânica (quebrável, empurrável, portão, baú, alavanca, tocha...) continua como billboard do sprite
// do Pixi, que é a fonte da verdade do estado dele. Objeto sem modelo também (nunca some nada).
// Cores: tiradas do próprio sprite 2D (média da copa, do tronco), então os biomas novos já saem com a cor certa.
const corLin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const hx = (s) => parseInt(String(s).slice(1), 16);
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------- acumulador de geometria ----------
export class Malha {
  constructor(at) { this.at = at; this.pos = []; this.cor = []; this.uv = []; this.cel = []; this.bal = []; this.bri = []; this.idx = []; }
  get vazio() { return !this.idx.length; }
  #v(p, c, u, v, cel, bal, bri) { this.pos.push(p[0], p[1], p[2]); this.cor.push(c[0], c[1], c[2]); this.uv.push(u, v); this.cel.push(cel[0], cel[1], cel[2], cel[3]); this.bal.push(bal); this.bri.push(bri); }
  // a, b, c, d: baixo-esquerda, baixo-direita, cima-direita, cima-esquerda, vistos de fora (anti-horário)
  quad(a, b, c, d, cor, cel, uw = 1, vh = 1, o = {}) {
    const n = this.pos.length / 3, C = Array.isArray(cor[0]) ? cor : [cor, cor, cor, cor];
    const ce = typeof cel === 'string' ? this.at.cel[cel] : cel, bal = o.bal ?? 0, bri = o.bri ?? 0;
    const B = Array.isArray(bal) ? bal : [bal, bal, bal, bal];
    this.#v(a, C[0], 0, vh, ce, B[0], bri); this.#v(b, C[1], uw, vh, ce, B[1], bri);
    this.#v(c, C[2], uw, 0, ce, B[2], bri); this.#v(d, C[3], 0, 0, ce, B[3], bri);
    this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  // caixa alinhada aos eixos. o: cor, topo, frente, cel, celTopo, bal (vento no topo), balBase, ao, sem {}, bri
  caixa(x0, y0, z0, x1, y1, z1, o = {}) {
    const cor = o.cor, ct = o.topo ?? cor, cf = o.frente ?? cor, cel = o.cel ?? 'branco', celT = o.celTopo ?? cel, S = o.rep ?? 16;
    const ao = o.ao ?? 0.78, sem = o.sem ?? {}, bb = o.balBase ?? 0, bt = o.bal ?? 0, bri = o.bri ?? 0;
    const lado = (c) => [c.map((v) => v * ao), c.map((v) => v * ao), c, c];
    const B = [bb, bb, bt, bt], w = x1 - x0, h = y1 - y0, d = z1 - z0;
    if (!sem.frente) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], lado(cf), o.celFrente ?? cel, w / S, h / S, { bal: B, bri });
    if (!sem.tras) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], lado(cor), cel, w / S, h / S, { bal: B, bri });
    if (!sem.esq) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], lado(cor), cel, d / S, h / S, { bal: B, bri });
    if (!sem.dir) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], lado(cor), cel, d / S, h / S, { bal: B, bri });
    if (!sem.topo) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], ct, celT, w / S, d / S, { bal: bt, bri });
  }
  // tronco de pirâmide de base quadrada
  tronco(cx, cz, y0, y1, r0, r1, o = {}) {
    const cor = o.cor, ct = o.topo ?? cor, cel = o.cel ?? 'branco', B0 = o.balBase ?? 0, B1 = o.bal ?? 0, ao = o.ao ?? 0.8, bri = o.bri ?? 0;
    const P = (r, y, sx, sz) => [cx + r * sx, y, cz + r * sz];
    const lo = cor.map((v) => v * ao);
    for (const [ax, az, bx, bz] of [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]]) this.quad(P(r0, y0, ax, az), P(r0, y0, bx, bz), P(r1, y1, bx, bz), P(r1, y1, ax, az), [lo, lo, cor, cor], cel, (r0 * 2) / 16, Math.hypot(y1 - y0, r0 - r1) / 16, { bal: [B0, B0, B1, B1], bri });
    if (r1 > 0.2) this.quad(P(r1, y1, -1, 1), P(r1, y1, 1, 1), P(r1, y1, 1, -1), P(r1, y1, -1, -1), ct, o.celTopo ?? cel, (r1 * 2) / 16, (r1 * 2) / 16, { bal: B1, bri });
  }
  // junta uma geometria pronta (kit de modelos): position + color [+ normal], em coordenadas do mundo depois de (ox, oy, oz)
  anexar(geo, ox, oy, oz, bal = 0) {
    const P = geo.getAttribute('position'), C = geo.getAttribute('color'), I = geo.getIndex(), n0 = this.pos.length / 3, ce = this.at.cel.branco;
    const balA = geo.getAttribute('aBal'), briA = geo.getAttribute('aBrilho');
    for (let i = 0; i < P.count; i++) {
      this.#v([P.getX(i) + ox, P.getY(i) + oy, P.getZ(i) + oz], C ? [C.getX(i), C.getY(i), C.getZ(i)] : [1, 1, 1], 0, 0, ce, balA ? balA.getX(i) : bal * Math.max(0, P.getY(i)) / 40, briA ? briA.getX(i) : 0);
    }
    if (I) for (let i = 0; i < I.count; i++) this.idx.push(n0 + I.getX(i)); else for (let i = 0; i < P.count; i++) this.idx.push(n0 + i);
  }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.cor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aCel', new THREE.Float32BufferAttribute(this.cel, 4));
    g.setAttribute('aBal', new THREE.Float32BufferAttribute(this.bal, 1));
    g.setAttribute('aBrilho', new THREE.Float32BufferAttribute(this.bri, 1));
    g.setIndex(this.idx);
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
}

// ---------- material: repetição dentro da célula do atlas, vento e brilho à noite ----------
export function materialAtlas(v, tex, { fachada = false } = {}) {
  const m = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, side: fachada ? THREE.FrontSide : THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tempo = v.u.tempo; sh.uniforms.noite = v.u.noite;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aCel; attribute float aBal; attribute float aBrilho; varying vec4 vCel; varying float vBrilho; uniform float tempo;`)
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        vCel = aCel; vBrilho = aBrilho;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float fz = position.x * 0.045 + position.z * 0.021;
        transformed.x += aBal * (sin(tempo * 1.3 + fz) * 0.9 + sin(tempo * 2.7 + position.z * 0.06) * 0.3);
        transformed.z += aBal * sin(tempo * 1.1 + position.x * 0.03) * 0.4;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec4 vCel; varying float vBrilho; uniform float noite;`)
      .replace('#include <map_fragment>', `
        vec4 sampledDiffuseColor = texture2D(map, vCel.xy + fract(vMapUv) * vCel.zw);
        if (sampledDiffuseColor.a < 0.5) discard;
        float vidro = ${fachada ? 'step(0.2, sampledDiffuseColor.b - sampledDiffuseColor.r) * step(0.45, sampledDiffuseColor.b) * step(sampledDiffuseColor.r, 0.8)' : '0.0'};
        diffuseColor *= sampledDiffuseColor;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.72, 0.32), vidro * noite * 0.85);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += (vBrilho + vidro) * noite * vec3(1.5, 1.0, 0.45);`);
  };
  m.customProgramCacheKey = () => (fachada ? 'mt-fachada' : 'mt-atlas');
  return m;
}

// cores de um sprite 2D (copa = parte de cima, tronco = faixa de baixo no meio), em cache
const CORES = new Map();
export function coresDoSprite(tex) {
  if (!tex?.source?.resource) return null;
  let r = CORES.get(tex); if (r) return r;
  const f = tex.frame, img = tex.source.resource, w = Math.max(1, Math.round(f.width)), h = Math.max(1, Math.round(f.height));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, f.x, f.y, f.width, f.height, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const media = (y0, y1, x0, x1) => {
    const px = [];
    for (let y = Math.floor(y0 * h); y < Math.ceil(y1 * h); y++) for (let X = Math.floor(x0 * w); X < Math.ceil(x1 * w); X++) {
      const k = (y * w + X) * 4; if (d[k + 3] < 200) continue; const l = d[k] + d[k + 1] + d[k + 2]; if (l < 110) continue; px.push([d[k], d[k + 1], d[k + 2], l]);
    }
    if (!px.length) return null;
    px.sort((a, b) => a[3] - b[3]);
    const pega = (q) => { const p = px[Math.min(px.length - 1, Math.floor(q * px.length))]; return (p[0] << 16) | (p[1] << 8) | p[2]; };
    let R = 0, G = 0, B = 0; for (const p of px) { R += p[0]; G += p[1]; B += p[2]; }
    return { med: (Math.round(R / px.length) << 16) | (Math.round(G / px.length) << 8) | Math.round(B / px.length), claro: pega(0.88), escuro: pega(0.15) };
  };
  r = { copa: media(0, 0.6, 0.1, 0.9), tronco: media(0.75, 0.95, 0.4, 0.6), tudo: media(0, 1, 0, 1), w, h };
  CORES.set(tex, r);
  return r;
}

const ehPinheiro = (k) => /pine|Pine|araucaria/.test(k);
const ehPalmeira = (k) => /palm|coqueiro/.test(k);
const ehCacto = (k) => /cactus|mandacaru|xiquexique/.test(k);
const ARVORES = new Set(['tree', 'tree2', 'autumn', 'bigtree', 'bigautumn', 'ipe', 'paineira', 'jequitiba', 'oran', 'pecha', 'umbu', 'juazeiro', 'arvoreSelva', 'mangue', 'arvoreSeca']);
const MECANICA = (K) => K.breakable || K.push || K.strength || K.gate || K.chest || K.lever || K.cracked || K.cart || K.bell || K.flat || K.fire || K.anim || K.steam;
const TAB = { roundbush: 'arbusto', cone: 'arbusto', boulder: 'pedra', boulder2: 'pedra', grayrock: 'pedra', obsidianRock: 'pedra', lavaRock: 'pedra', pedregulho: 'pedra', stalagmite: 'pedra', stalagmiteIce: 'pedra',
  log: 'tora', stump: 'toco', fence: 'cerca', fenceV: 'cerca', wfence: 'cerca', wfenceV: 'cerca', cercaVara: 'cerca',
  lamp: 'poste', lanternaPedra: 'poste', posteLuzita: 'poste', lampiao: 'poste', sign: 'placa', placaAurora: 'placa', mailbox: 'correio', flowerpot: 'vaso', crate: 'caixote',
  bench: 'banco', well: 'poco', bed: 'cama', table: 'mesa', tv: 'tv', shelf: 'estante', estante: 'estante', plant: 'planta', pc: 'pc', machine: 'maquina', counter: 'balcao',
  balltable: 'mesaBolas', radio: 'radio', fogao: 'balcao', column: 'coluna', brokenColumn: 'coluna', menhir: 'pedra', obelisk: 'coluna', statue: 'pedra', crystal: 'cristal', crystalPink: 'cristal', cristal: 'cristal' };

export class Modelos {
  constructor(v) {
    this.v = v;
    v.u.noite ??= { value: 0 };
    this.at = criarAtlas();
    this.fach = new AtlasDinamico(2048);
    this.mat = comNuvens(materialAtlas(v, this.at.tex), v);
    this.matFach = comNuvens(materialAtlas(v, this.fach.tex, { fachada: true }), v);
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const bt = new THREE.CanvasTexture(c); bt.colorSpace = THREE.SRGBColorSpace;
    this.matSombra = curvarMaterial(new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false, color: 0x1a2030 }), v);
    this.donos = new Set();
    this.kit = new URLSearchParams(location.search).get('kit') === '0' ? null : kit; // kit de modelos (src/visual3d/kit); ?kit=0 usa os modelos daqui
    if (this.kit) { this.matKit = v.curvar(kit.material()); }
  }
  usarKit(kit) { this.kit = kit; for (const s of this.v.setores?.mapa.values() ?? []) s.sujo = true;
  }
  #construtor(K, kind) {
    if (!K) return null;
    if (this.kit?.temModelo?.(kind)) return 'kitModelo';
    if (MECANICA(K)) return null;
    if (K.estilo?.tipo === 'casa') return 'casa';
    if (K.estilo?.tipo === 'salao') return 'salao';
    if (ehPinheiro(kind)) return 'pinheiro';
    if (ehPalmeira(kind)) return 'palmeira';
    if (ehCacto(kind)) return 'cacto';
    if (ARVORES.has(kind) || /snowPine/.test(kind)) return 'arvore';
    return TAB[kind] ?? null;
  }
  temModelo(K, kind) { return !!this.#construtor(K, kind); }
  // monta os modelos do setor (chamado pelos setores)
  setor(s) {
    this.liberar(s);
    const v = this.v, L = v.L, M = new Malha(this.at), F = new Malha(this.at), S = [];
    s.objsModelo = new Set(); this.itensKit = [];
    for (const o of L.objetosDoSetor(s.sx, s.sy)) {
      if (o.dead) continue;
      const K = L.catalogo(o.kind), tipo = this.#construtor(K, o.kind);
      if (!tipo) continue;
      const h = v.relevo.em(o.x, o.y - 4);
      try { this[tipo](M, F, S, o, K, h); } catch (e) { console.warn('[3D] modelo', o.kind, e); continue; }
      s.objsModelo.add(o); o.__pos3d = o.tx + ',' + o.ty;
    }
    if (this.itensKit.length) { s.kitMesh = new THREE.Mesh(this.kit.mesclar(this.itensKit), this.matKit); s.kitMesh.castShadow = s.kitMesh.receiveShadow = true; s.grupo.add(s.kitMesh); }
    if (!M.vazio) { s.props = new THREE.Mesh(M.geometria(), this.mat); s.props.castShadow = s.props.receiveShadow = true; s.grupo.add(s.props); }
    if (!F.vazio) { s.fachadas = new THREE.Mesh(F.geometria(), this.matFach); s.fachadas.castShadow = s.fachadas.receiveShadow = true; s.grupo.add(s.fachadas); }
    if (S.length) {
      const pos = [], uv = [], idx = [];
      for (const [x, z, rx, rz, y] of S) { const n = pos.length / 3; pos.push(x - rx, y, z - rz, x + rx, y, z - rz, x - rx, y, z + rz, x + rx, y, z + rz); uv.push(0, 0, 1, 0, 0, 1, 1, 1); idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
      s.sombras = new THREE.Mesh(g, this.matSombra); s.sombras.renderOrder = 1; s.grupo.add(s.sombras);
    }
  }
  liberar(s) { for (const k of ['props', 'fachadas', 'sombras', 'kitMesh']) if (s[k]) { s.grupo.remove(s[k]); s[k].geometry.dispose(); s[k] = null; } }
  // sprites do Pixi que o espelho não deve desenhar (o objeto já tem modelo); objeto quebrado ou movido refaz o setor
  update() {
    const v = this.v, d = this.donos; d.clear();
    v.u.noite.value = Math.max(v.ceu.noite ?? 0, v.ceu.sala?.dark ? 0.6 : 0);
    this.kit?.noite(v.u.noite.value);
    for (const s of v.setores.mapa.values()) {
      if (!s.objsModelo || !s.grupo.visible) continue;
      for (const o of s.objsModelo) {
        if (o.dead || o.__pos3d !== o.tx + ',' + o.ty || (o.__chave3d && this.kit.chave(o.kind, o) !== o.__chave3d)) { s.sujo = true; continue; }
        if (o.sprite) d.add(o.sprite);
      }
    }
  }
  donosDeSprite() { return this.donos; }
  // altura do topo de um modelo (telhado, copa) num ponto, para quem sobe nele (cenário vivo)
  topoEm(o) { return o?.__topo3d ?? null; }

  // modelo do kit: origem no pé do objeto (o.x, chão, o.y), como o 2D
  kitModelo(M, F, S, o, K, h) {
    const r = this.kit.modelo(o.kind, o); if (!r?.geometry) throw new Error('kit sem geometria');
    this.itensKit.push({ geometry: r.geometry, x: o.x, y: h, z: o.y });
    o.__chave3d = this.kit.dinamico(o.kind) ? this.kit.chave(o.kind, o) : null;
    o.__topo3d = h + (r.topo?.y ?? r.altura ?? 0);
    if (!this.v.amb) S.push([o.x, o.y - (K.fh ?? 1) * 8 + 2, (K.fw ?? 1) * 10, (K.fh ?? 1) * 8 + 4, h + 0.3]);
  }

  // =================== árvores ===================
  arvore(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, W = cs.w ?? 32, H = cs.h ?? 48;
    const r = (k) => hash(o.tx, o.ty, k);
    const cx = o.x + (r(1) - 0.5) * 3, cz = o.y - 7, y = h;
    const copa = cs.copa ?? { med: 0x3a9a4a, claro: 0x7ad86a, escuro: 0x1a5a2c }, tronco = cs.tronco?.med ?? 0x6b4428;
    const seca = o.kind === 'arvoreSeca';
    const altT = H * (seca ? 0.62 : 0.36), rt = Math.max(2.5, W * 0.085);
    M.caixa(cx - rt, y, cz - rt, cx + rt, y + altT + 4, cz + rt, { cor: corLin(tronco), cel: 'casca', ao: 0.7 });
    if (seca) {
      M.caixa(cx - rt * 3, y + altT * 0.8, cz - 1, cx - rt, y + altT * 0.8 + 3, cz + 1, { cor: corLin(tronco), cel: 'casca' });
      M.caixa(cx + rt, y + altT * 0.65, cz - 1, cx + rt * 3.2, y + altT * 0.65 + 3, cz + 1, { cor: corLin(tronco), cel: 'casca' });
      S.push([cx, cz, W * 0.35, W * 0.2, y + 0.3]); o.__topo3d = y + H * 0.8; return;
    }
    const cm = corLin(copa.med), cc = corLin(copa.claro), cw = W * 0.5, base = y + altT, ch = H * 0.52, bal = 0.9;
    M.caixa(cx - cw * 0.92, base, cz - cw * 0.7, cx + cw * 0.92, base + ch * 0.78, cz + cw * 0.75, { cor: cm, topo: cc, cel: 'folhas', bal, balBase: bal * 0.3, ao: 0.6 });
    [[-0.62, 0.15, 0.5, 0.42], [0.6, 0.2, 0.45, 0.4], [-0.1, 0.62, 0.62, 0.45], [0.05, -0.1, 0.55, 0.5]].forEach(([dx, dy, s, sh], i) => {
      const bw = cw * s * (0.85 + r(10 + i) * 0.3), bx = cx + dx * cw, by = base + dy * ch + ch * 0.12, bz = cz + (r(20 + i) - 0.5) * cw * 0.5;
      M.caixa(bx - bw, by, bz - bw * 0.85, bx + bw, by + ch * sh, bz + bw * 0.9, { cor: i === 2 ? cc : cm, topo: cc, cel: 'folhas', bal, balBase: bal * 0.5, ao: 0.7 });
    });
    if (K.berry || o.kind === 'ipe' || o.kind === 'paineira') {
      const cf = corLin(K.berry === 'oran' ? 0x3a6ad8 : K.berry === 'pecha' ? 0xff8ab0 : copa.claro, 1.1);
      for (let i = 0; i < 7; i++) { const a = r(40 + i) * 6.28, rr = cw * (0.6 + r(50 + i) * 0.35), fx = cx + Math.cos(a) * rr, fy = base + ch * (0.25 + r(60 + i) * 0.45), fz = cz + cw * 0.78 + Math.sin(a) * 2; M.caixa(fx - 1.5, fy, fz - 1.5, fx + 1.5, fy + 3, fz + 1.5, { cor: cf, bal }); }
    }
    S.push([cx, cz + 2, cw * 1.3, cw * 1.0, y + 0.3]);
    o.__topo3d = base + ch;
  }
  pinheiro(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, W = cs.w ?? 32, H = cs.h ?? 48;
    const cx = o.x, cz = o.y - 7, y = h, copa = cs.copa ?? { med: 0x2a7a48, claro: 0x5ab070, escuro: 0x1a4a30 };
    const neve = /snow/i.test(o.kind), tr = corLin(cs.tronco?.med ?? 0x5a3a22);
    const cm = corLin(copa.med), cc = corLin(neve ? 0xf4f8ff : copa.claro);
    if (o.kind === 'araucaria') {
      M.caixa(cx - 2, y, cz - 2, cx + 2, y + H * 0.7, cz + 2, { cor: tr, cel: 'casca' });
      M.tronco(cx, cz, y + H * 0.62, y + H * 0.8, W * 0.55, W * 0.35, { cor: cm, topo: cc, cel: 'folhas', bal: 0.7, balBase: 0.4 });
      S.push([cx, cz, W * 0.6, W * 0.4, y + 0.3]); o.__topo3d = y + H * 0.8; return;
    }
    M.caixa(cx - 2.5, y, cz - 2.5, cx + 2.5, y + H * 0.22, cz + 2.5, { cor: tr, cel: 'casca', ao: 0.7 });
    let y0 = y + H * 0.14; const n = 4;
    for (let i = 0; i < n; i++) {
      const k = i / n, r0 = W * (0.5 - k * 0.32), r1 = r0 * 0.45, th = H * (0.27 - k * 0.04);
      M.tronco(cx, cz, y0, y0 + th, r0, r1, { cor: cm, topo: cc, cel: 'folhas', bal: 0.4 + k * 0.6, balBase: 0.2 + k * 0.5, ao: 0.6 });
      if (neve) M.tronco(cx, cz, y0 + th * 0.6, y0 + th + 0.5, r0 * 0.62, r1 * 0.9, { cor: cc, cel: 'neve', bal: 0.4 + k * 0.6, balBase: 0.3 + k * 0.5, ao: 0.9 });
      y0 += th * 0.68;
    }
    S.push([cx, cz + 2, W * 0.6, W * 0.45, y + 0.3]);
    o.__topo3d = y0;
  }
  palmeira(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, H = Math.max(32, cs.h ?? 40);
    const cx = o.x, cz = o.y - 6, y = h, tr = corLin(cs.tronco?.med ?? 0x9a7a4a), fo = corLin(cs.copa?.med ?? 0x3a9a4a), fc = corLin(cs.copa?.claro ?? 0x7ad86a);
    const seg = 5, alt = H * 0.78, inc = (hash(o.tx, o.ty, 3) - 0.5) * 10;
    let px = cx, py = y;
    for (let i = 0; i < seg; i++) { const nx = cx + inc * ((i + 1) / seg) ** 2, ny = py + alt / seg, r = 2.6 - i * 0.25; M.caixa(Math.min(px, nx) - r, py, cz - r, Math.max(px, nx) + r, ny + 1, cz + r, { cor: tr, cel: 'casca', bal: (i / seg) * 0.6, balBase: Math.max(0, (i - 1) / seg) * 0.6 }); px = nx; py = ny; }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3, L = H * 0.42, dx = Math.cos(a), dz = Math.sin(a) * 0.8;
      const p0 = [px, py + 1, cz], p1 = [px + dx * L * 0.6, py + 4, cz + dz * L * 0.6], p2 = [px + dx * L, py - 6, cz + dz * L];
      const nx = -dz * 3.5, nz = dx * 3.5;
      M.quad([p0[0] - nx * 0.3, p0[1], p0[2] - nz * 0.3], [p0[0] + nx * 0.3, p0[1], p0[2] + nz * 0.3], [p1[0] + nx, p1[1], p1[2] + nz], [p1[0] - nx, p1[1], p1[2] - nz], [fo, fo, fc, fc], 'folhas', 0.5, 1, { bal: [0.6, 0.6, 1.2, 1.2] });
      M.quad([p1[0] - nx, p1[1], p1[2] - nz], [p1[0] + nx, p1[1], p1[2] + nz], [p2[0], p2[1], p2[2]], [p2[0], p2[1], p2[2]], [fc, fc, fo, fo], 'folhas', 0.5, 1, { bal: [1.2, 1.2, 1.8, 1.8] });
    }
    M.caixa(px - 3, py - 3, cz - 3, px + 3, py + 2, cz + 3, { cor: corLin(0x8a5a2a), cel: 'casca', bal: 0.6 });
    S.push([cx + inc * 0.5, cz, H * 0.38, H * 0.28, y + 0.3]);
    o.__topo3d = py;
  }
  cacto(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, H = cs.h ?? 24, W = cs.w ?? 16;
    const cx = o.x, cz = o.y - 6, y = h, c = corLin(cs.tudo?.med ?? 0x4a9a4a), cc = corLin(cs.tudo?.claro ?? 0x8ad86a), r = Math.max(2.5, W * 0.14);
    M.caixa(cx - r, y, cz - r, cx + r, y + H * 0.85, cz + r, { cor: c, topo: cc, cel: 'folhas', ao: 0.75 });
    M.caixa(cx - r * 3, y + H * 0.35, cz - r * 0.7, cx - r, y + H * 0.35 + 3, cz + r * 0.7, { cor: c, cel: 'folhas' });
    M.caixa(cx - r * 3, y + H * 0.35, cz - r * 0.7, cx - r * 1.8, y + H * 0.62, cz + r * 0.7, { cor: c, topo: cc, cel: 'folhas' });
    M.caixa(cx + r, y + H * 0.48, cz - r * 0.7, cx + r * 2.8, y + H * 0.48 + 3, cz + r * 0.7, { cor: c, cel: 'folhas' });
    M.caixa(cx + r * 1.8, y + H * 0.48, cz - r * 0.7, cx + r * 2.8, y + H * 0.72, cz + r * 0.7, { cor: c, topo: cc, cel: 'folhas' });
    S.push([cx, cz, W * 0.5, W * 0.3, y + 0.3]);
  }
  arbusto(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, W = (K.fw ?? 1) * 16, H = cs.h ?? 24;
    const cx = o.x, cz = o.y - 7, y = h, c = cs.copa ?? { med: 0x3a9a4a, claro: 0x7ad86a }, n = Math.max(1, Math.round(W / 14));
    for (let i = 0; i < n; i++) {
      const bx = cx + (i - (n - 1) / 2) * 13, bw = 7 + hash(o.tx + i, o.ty, 5) * 2, bh = H * (0.55 + hash(o.tx + i, o.ty, 6) * 0.25);
      M.caixa(bx - bw, y, cz - bw * 0.8, bx + bw, y + bh, cz + bw * 0.8, { cor: corLin(c.med), topo: corLin(c.claro), cel: 'folhas', bal: 0.3, ao: 0.65 });
    }
    S.push([cx, cz, W * 0.55, 8, y + 0.3]);
  }
  pedra(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, W = Math.min(cs.w ?? 24, (K.fw ?? 1) * 16 + 4), H = cs.h ?? 20;
    const cx = o.x, cz = o.y - 7, y = h - 1, c = corLin(cs.tudo?.med ?? 0x9a9aa2), cc = corLin(cs.tudo?.claro ?? 0xc8c8d0);
    const alto = /stalag|obelisk|menhir|statue/.test(o.kind) ? 1.4 : 1, r0 = W * 0.48, hh = H * 0.62 * alto;
    M.tronco(cx, cz, y, y + hh, r0, r0 * (alto > 1 ? 0.25 : 0.55), { cor: c, topo: cc, cel: 'pedra', ao: 0.7 });
    if (W > 20 && alto === 1) M.tronco(cx + r0 * 0.55, cz + r0 * 0.3, y, y + hh * 0.55, r0 * 0.5, r0 * 0.25, { cor: c, topo: cc, cel: 'pedra', ao: 0.7 });
    S.push([cx, cz + 1, r0 * 1.3, r0 * 0.9, h + 0.3]);
    o.__topo3d = y + hh;
  }
  tora(M, F, S, o, K, h) {
    const W = (K.fw ?? 4) * 16 - 6, cx = o.x, cz = o.y - 7, y = h;
    M.caixa(cx - W / 2, y, cz - 4, cx + W / 2, y + 8, cz + 4, { cor: corLin(0x7a5236), topo: corLin(0x9a6a42), cel: 'casca' });
    M.caixa(cx - W / 2 - 0.5, y + 1, cz - 3, cx - W / 2, y + 7, cz + 3, { cor: corLin(0xd8b078), cel: 'madeira' });
    S.push([cx, cz, W * 0.6, 7, y + 0.3]);
  }
  toco(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 7, y = h;
    M.caixa(cx - 7, y, cz - 6, cx + 7, y + 7, cz + 6, { cor: corLin(0x7a5236), topo: corLin(0xd8b078), cel: 'casca', celTopo: 'madeira' });
    S.push([cx, cz, 11, 8, y + 0.3]);
  }
  cerca(M, F, S, o, K, h) {
    const branca = o.kind.startsWith('w'), vert = o.kind.endsWith('V'), vara = o.kind === 'cercaVara';
    const c = corLin(branca ? 0xf4f0e6 : vara ? 0x8a6a3a : 0xa8744a), ct = corLin(branca ? 0xffffff : 0xc08a56);
    const x0 = o.tx * 16, z0 = o.ty * 16, y = h;
    if (!vert) {
      const zc = z0 + 9;
      for (const px of [x0 + 2, x0 + 14]) M.caixa(px - 1.5, y, zc - 1.5, px + 1.5, y + 13, zc + 1.5, { cor: c, topo: ct, cel: 'madeira' });
      for (const ry of [5, 10]) M.caixa(x0, y + ry, zc - 0.8, x0 + 16, y + ry + 2.2, zc + 0.8, { cor: c, topo: ct, cel: 'madeira' });
    } else {
      const xc = x0 + 8;
      for (const pz of [z0 + 2, z0 + 14]) M.caixa(xc - 1.5, y, pz - 1.5, xc + 1.5, y + 13, pz + 1.5, { cor: c, topo: ct, cel: 'madeira' });
      for (const ry of [5, 10]) M.caixa(xc - 0.8, y + ry, z0, xc + 0.8, y + ry + 2.2, z0 + 16, { cor: c, topo: ct, cel: 'madeira' });
    }
  }
  poste(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 6, y = h;
    if (o.kind === 'lanternaPedra') {
      M.caixa(cx - 5, y, cz - 5, cx + 5, y + 3, cz + 5, { cor: corLin(0x9a9aa2), cel: 'pedra' });
      M.caixa(cx - 2, y + 3, cz - 2, cx + 2, y + 10, cz + 2, { cor: corLin(0x9a9aa2), cel: 'pedra' });
      M.caixa(cx - 4, y + 10, cz - 4, cx + 4, y + 16, cz + 4, { cor: corLin(0xffe08a), cel: 'branco', bri: 1 });
      M.tronco(cx, cz, y + 16, y + 20, 6, 1, { cor: corLin(0x8a8a92), cel: 'pedra' });
      return;
    }
    const luzita = o.kind === 'posteLuzita', cor = corLin(luzita ? 0x3a4a5a : 0x2e3238);
    M.caixa(cx - 1.5, y, cz - 1.5, cx + 1.5, y + 26, cz + 1.5, { cor, cel: 'metal' });
    M.caixa(cx - 3, y, cz - 3, cx + 3, y + 3, cz + 3, { cor, cel: 'metal' });
    M.caixa(cx - 3.5, y + 26, cz - 3.5, cx + 3.5, y + 33, cz + 3.5, { cor: corLin(luzita ? 0x9afff4 : 0xfff0b0), cel: 'branco', bri: 1 });
    M.tronco(cx, cz, y + 33, y + 36, 5, 1, { cor, cel: 'metal' });
    S.push([cx, cz, 6, 4, y + 0.3]);
  }
  placa(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 6, y = h;
    M.caixa(cx - 1.2, y, cz - 1.2, cx + 1.2, y + 10, cz + 1.2, { cor: corLin(0x8a5a34), cel: 'madeira' });
    M.caixa(cx - 7, y + 7, cz - 1.5, cx + 7, y + 16, cz + 1.5, { cor: corLin(0xb07a48), topo: corLin(0xd09a68), cel: 'madeira' });
    S.push([cx, cz, 7, 4, y + 0.3]);
  }
  correio(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 6, y = h;
    M.caixa(cx - 1, y, cz - 1, cx + 1, y + 10, cz + 1, { cor: corLin(0x6b4428), cel: 'madeira' });
    M.caixa(cx - 4, y + 10, cz - 3, cx + 4, y + 17, cz + 4, { cor: corLin(0xd8402e), topo: corLin(0xf06a52), cel: 'metal' });
    M.caixa(cx + 4, y + 13, cz - 1, cx + 5, y + 18, cz, { cor: corLin(0xf2c94c), cel: 'branco' });
  }
  vaso(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 7, y = h;
    M.tronco(cx, cz, y, y + 7, 4, 5.5, { cor: corLin(0xc06a3a), topo: corLin(0x5a3a22), cel: 'tijolo' });
    M.caixa(cx - 4, y + 7, cz - 3, cx + 4, y + 8.5, cz + 3, { cor: corLin(0x4aa04a), cel: 'folhas' });
    for (const [dx, cc] of [[-2.5, 0xff7aa8], [2.5, 0xffd84a], [0, 0xffffff]]) M.caixa(cx + dx - 1.5, y + 8, cz - 1.5 + (dx ? 0 : 1.5), cx + dx + 1.5, y + 11, cz + 1.5 + (dx ? 0 : 1.5), { cor: corLin(cc), cel: 'folhas', bal: 0.2 });
  }
  caixote(M, F, S, o, K, h) { const cx = o.x, cz = o.y - 7, y = h; M.caixa(cx - 6, y, cz - 6, cx + 6, y + 12, cz + 6, { cor: corLin(0xc08a50), cel: 'madeira' }); S.push([cx, cz, 9, 7, y + 0.3]); }
  banco(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 7, y = h, c = corLin(0xa8744a);
    M.caixa(cx - 13, y + 5, cz - 3, cx + 13, y + 7, cz + 3, { cor: c, topo: corLin(0xc8945a), cel: 'madeira' });
    M.caixa(cx - 13, y + 7, cz - 4, cx + 13, y + 13, cz - 2.5, { cor: c, cel: 'madeira' });
    for (const dx of [-11, 11]) M.caixa(cx + dx - 1, y, cz - 2, cx + dx + 1, y + 5, cz + 2, { cor: corLin(0x3a3a3a), cel: 'metal' });
    S.push([cx, cz, 16, 5, y + 0.3]);
  }
  poco(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 8, y = h;
    M.caixa(cx - 10, y, cz - 8, cx + 10, y + 9, cz + 8, { cor: corLin(0xa0a0a8), topo: corLin(0x2a4a7a), cel: 'pedra', celTopo: 'branco' });
    for (const dx of [-9, 8]) M.caixa(cx + dx, y + 9, cz - 1, cx + dx + 1.5, y + 24, cz + 1, { cor: corLin(0x6b4428), cel: 'madeira' });
    M.tronco(cx, cz, y + 22, y + 30, 14, 1, { cor: corLin(0xb84a3a), cel: 'telha' });
    S.push([cx, cz, 14, 10, y + 0.3]);
  }
  coluna(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, H = (cs.h ?? 32) * (o.kind === 'brokenColumn' ? 0.6 : 0.9);
    const cx = o.x, cz = o.y - 7, y = h, c = corLin(cs.tudo?.med ?? 0xd8d0c0), cc = corLin(cs.tudo?.claro ?? 0xf0e8dc);
    M.caixa(cx - 6, y, cz - 6, cx + 6, y + 3, cz + 6, { cor: c, cel: 'pedra' });
    if (o.kind === 'obelisk') M.tronco(cx, cz, y + 3, y + H, 4.5, 1.5, { cor: c, topo: cc, cel: 'pedra' });
    else M.caixa(cx - 4, y + 3, cz - 4, cx + 4, y + H - 3, cz + 4, { cor: c, topo: cc, cel: 'pedra' });
    if (o.kind === 'column') M.caixa(cx - 6, y + H - 3, cz - 6, cx + 6, y + H, cz + 6, { cor: c, topo: cc, cel: 'pedra' });
    S.push([cx, cz, 9, 6, y + 0.3]);
  }
  cristal(M, F, S, o, K, h) {
    const cs = coresDoSprite(SPR[K.tex]) ?? {}, H = cs.h ?? 24, c = corLin(cs.tudo?.claro ?? 0x9afff4);
    const cx = o.x, cz = o.y - 7, y = h;
    M.tronco(cx, cz, y, y + H * 0.8, 4, 0.5, { cor: c, cel: 'cristal', ao: 1, bri: 0.3 });
    M.tronco(cx - 4, cz + 2, y, y + H * 0.45, 2.5, 0.3, { cor: c, cel: 'cristal', ao: 1, bri: 0.3 });
    M.tronco(cx + 4, cz + 1, y, y + H * 0.55, 2.5, 0.3, { cor: c, cel: 'cristal', ao: 1, bri: 0.3 });
  }
  // =================== móveis (interiores) ===================
  cama(M, F, S, o, K, h) {
    const x0 = o.tx * 16 + 1, z0 = o.ty * 16 + 1, y = h;
    M.caixa(x0, y, z0, x0 + 14, y + 6, z0 + 30, { cor: corLin(0x8a5a34), cel: 'madeira' });
    M.caixa(x0 + 1, y + 6, z0 + 1, x0 + 13, y + 9, z0 + 29, { cor: corLin(0xf4f0e6), topo: corLin(0xffffff), cel: 'tecido' });
    M.caixa(x0 + 1, y + 6.5, z0 + 10, x0 + 13, y + 9.5, z0 + 29, { cor: corLin(0x5a8ad8), topo: corLin(0x7aaaf8), cel: 'tecido' });
    M.caixa(x0, y, z0 - 1, x0 + 14, y + 16, z0 + 1, { cor: corLin(0x6b4428), cel: 'madeira' });
  }
  mesa(M, F, S, o, K, h) {
    const W = (K.fw ?? 2) * 16, x0 = o.tx * 16 + 2, z0 = o.ty * 16 + 2, y = h;
    M.caixa(x0, y + 9, z0, x0 + W - 4, y + 11, z0 + 12, { cor: corLin(0xa8744a), topo: corLin(0xc8945a), cel: 'madeira' });
    for (const [dx, dz] of [[1, 1], [W - 7, 1], [1, 9], [W - 7, 9]]) M.caixa(x0 + dx, y, z0 + dz, x0 + dx + 2, y + 9, z0 + dz + 2, { cor: corLin(0x6b4428), cel: 'madeira' });
    S.push([x0 + (W - 4) / 2, z0 + 6, W * 0.45, 8, y + 0.3]);
  }
  tv(M, F, S, o, K, h) {
    const cx = o.x, z0 = o.ty * 16 + 2, y = h;
    M.caixa(cx - 7, y, z0, cx + 7, y + 7, z0 + 10, { cor: corLin(0x6b4428), cel: 'madeira' });
    M.caixa(cx - 6, y + 7, z0 + 2, cx + 6, y + 17, z0 + 8, { cor: corLin(0x3a3a44), frente: corLin(0xffffff), cel: 'metal', celFrente: 'tela', bri: 0.2 });
  }
  estante(M, F, S, o, K, h) {
    const x0 = o.tx * 16 + 1, z0 = o.ty * 16, y = h;
    M.caixa(x0, y, z0, x0 + 14, y + 28, z0 + 7, { cor: corLin(0x8a5a34), frente: corLin(0xffffff), cel: 'madeira', celFrente: 'livros', topo: corLin(0xa8744a) });
  }
  planta(M, F, S, o, K, h) {
    const cx = o.x, cz = o.y - 7, y = h;
    M.tronco(cx, cz, y, y + 7, 4, 5, { cor: corLin(0xd8d0c0), cel: 'tijolo' });
    for (let i = 0; i < 5; i++) { const a = i * 1.26, bx = cx + Math.cos(a) * 3, bz = cz + Math.sin(a) * 3; M.caixa(bx - 2.5, y + 7, bz - 2.5, bx + 2.5, y + 13 + (i % 2) * 4, bz + 2.5, { cor: corLin(0x3aa04a), topo: corLin(0x7ad86a), cel: 'folhas', bal: 0.15 }); }
  }
  pc(M, F, S, o, K, h) {
    const cx = o.x, z0 = o.ty * 16 + 1, y = h;
    M.caixa(cx - 7, y, z0, cx + 7, y + 10, z0 + 12, { cor: corLin(0xd8dde2), cel: 'metal' });
    M.caixa(cx - 6, y + 10, z0 + 2, cx + 6, y + 19, z0 + 7, { cor: corLin(0xe8ecf0), frente: corLin(0xffffff), cel: 'metal', celFrente: 'tela', bri: 0.3 });
  }
  maquina(M, F, S, o, K, h) {
    const x0 = o.tx * 16 + 1, z0 = o.ty * 16 + 1, W = (K.fw ?? 2) * 16 - 2, y = h;
    M.caixa(x0, y, z0, x0 + W, y + 18, z0 + 12, { cor: corLin(0xe8ecf0), topo: corLin(0xffffff), cel: 'metal' });
    for (let i = 0; i < 3; i++) M.caixa(x0 + 4 + i * 8, y + 18, z0 + 4, x0 + 9 + i * 8, y + 21, z0 + 9, { cor: corLin(0xe5383b), cel: 'branco', bri: 0.2 });
  }
  balcao(M, F, S, o, K, h) {
    const x0 = o.tx * 16, z0 = o.ty * 16 + 2, W = (K.fw ?? 4) * 16, y = h;
    M.caixa(x0, y, z0, x0 + W, y + 14, z0 + 12, { cor: corLin(0xd8483a), topo: corLin(0xf4f0e6), cel: 'tabua', celTopo: 'laje' });
  }
  mesaBolas(M, F, S, o, K, h) {
    const x0 = o.tx * 16 + 2, z0 = o.ty * 16 + 2, W = (K.fw ?? 3) * 16 - 4, y = h;
    M.caixa(x0, y, z0, x0 + W, y + 12, z0 + 12, { cor: corLin(0xa8744a), topo: corLin(0xc8945a), cel: 'madeira' });
    for (let i = 0; i < 3; i++) { const bx = x0 + 8 + i * 13; M.caixa(bx - 2.5, y + 12, z0 + 4, bx + 2.5, y + 17, z0 + 9, { cor: corLin(0xe5383b), topo: corLin(0xffffff), cel: 'branco' }); }
  }
  radio(M, F, S, o, K, h) {
    const cx = o.x, z0 = o.ty * 16 + 4, y = h;
    M.caixa(cx - 6, y, z0, cx + 6, y + 9, z0 + 7, { cor: corLin(0x8a5a34), frente: corLin(0xd8c8a8), cel: 'madeira' });
    M.caixa(cx + 3, y + 9, z0 + 3, cx + 4, y + 18, z0 + 4, { cor: corLin(0x3a3a3a), cel: 'metal' });
  }

  // =================== prédios ===================
  // fachada: a frente do prédio é a arte 2D (porta, janelas, faixas, letreiro), recortada no atlas de fachadas
  #fachada(K, ex, y0, ex1, y1) {
    const tex = SPR[K.tex]; if (!tex?.source?.resource) return null;
    const f = tex.frame;
    return this.fach.pegar(K.tex + ':' + [ex, y0, ex1, y1].join(','), tex.source.resource, f.x + ex, f.y + y0, ex1 - ex, y1 - y0);
  }
  casa(M, F, S, o, K, h) {
    const E = K.estilo, w = E.w, base = E.h - 3, H = E.wallH ?? 40, y = h;
    const x0 = o.x - w / 2 + 8, x1 = o.x + w / 2 - 8, z1 = o.y - 1, z0 = o.ty * 16 + 4;
    const wall2 = corLin(hx(E.wall[1])), roof = corLin(hx(E.roof[0])), roofHi = corLin(hx(E.roof[2])), roofLo = corLin(hx(E.roof[1]));
    M.caixa(x0, y, z0, x1, y + H, z1 - 0.2, { cor: wall2, cel: 'tabua', sem: { frente: true, topo: true }, ao: 0.85 });
    M.caixa(x0 - 0.5, y, z0 - 0.5, x1 + 0.5, y + 6, z1 - 0.3, { cor: corLin(0x8a8478), cel: 'pedra', sem: { topo: true, frente: true } });
    const uv = this.#fachada(K, 8, base - H, w - 8, base);
    if (uv) F.quad([x0, y, z1], [x1, y, z1], [x1, y + H, z1], [x0, y + H, z1], [1, 1, 1], uv, 0.9999, 0.9999);
    else M.caixa(x0, y, z1 - 1, x1, y + H, z1, { cor: corLin(hx(E.wall[0])), cel: 'tabua', sem: { topo: true } });
    // telhado de quatro águas com beiral (o trapézio do telhado do 2D)
    const be = 6, ry = y + H, X0 = x0 - be, X1 = x1 + be, Z0 = z0 - be, Z1 = z1 + be + 1, zc = (Z0 + Z1) / 2, d = (Z1 - Z0) / 2 * 0.95;
    const rh = Math.min(30, (Z1 - Z0) * 0.55), top = ry + rh, rx0 = X0 + d, rx1 = X1 - d, lr = Math.hypot(rh, d) / 16;
    M.quad([X0, ry, Z1], [X1, ry, Z1], [rx1, top, zc], [rx0, top, zc], [roofLo, roofLo, roofHi, roofHi], 'telha', (X1 - X0) / 16, lr);
    M.quad([X1, ry, Z0], [X0, ry, Z0], [rx0, top, zc], [rx1, top, zc], [roofLo, roofLo, roof, roof], 'telha', (X1 - X0) / 16, lr);
    M.quad([X0, ry, Z0], [X0, ry, Z1], [rx0, top, zc], [rx0, top, zc], [roofLo, roofLo, roof, roof], 'telha', (Z1 - Z0) / 16, lr);
    M.quad([X1, ry, Z1], [X1, ry, Z0], [rx1, top, zc], [rx1, top, zc], [roofLo, roofLo, roof, roof], 'telha', (Z1 - Z0) / 16, lr);
    M.caixa(X0, ry - 2, Z0, X1, ry, Z1, { cor: corLin(0x3a2420), cel: 'madeira', sem: { topo: true } });
    M.caixa(rx0 - 1, top - 1, zc - 1.5, rx1 + 1, top + 1.5, zc + 1.5, { cor: roofHi, cel: 'telha' });
    if (E.chimney) M.caixa(x1 - 30, top - 14, zc - 2, x1 - 18, top + 8, zc + 8, { cor: corLin(0x8a4a3a), topo: corLin(0x5a3028), cel: 'tijolo' });
    S.push([o.x, (z0 + z1) / 2 + 4, w * 0.62, (z1 - z0) * 0.8, y + 0.3]);
    o.__topo3d = top;
  }
  salao(M, F, S, o, K, h) {
    const E = K.estilo, w = E.w, base = E.h - 3, H = E.wallH ?? 50, y = h;
    const x0 = o.x - w / 2 + 6, x1 = o.x + w / 2 - 6, z1 = o.y - 1, z0 = o.ty * 16 + 2;
    const wall2 = corLin(hx(E.wall[1])), roof = corLin(hx(E.roof[0])), roofHi = corLin(hx(E.roof[2])), roofLo = corLin(hx(E.roof[1])), band = corLin(hx(E.band ?? '#888888'));
    M.caixa(x0, y, z0, x1, y + H, z1 - 0.2, { cor: wall2, cel: 'laje', sem: { frente: true, topo: true }, ao: 0.85 });
    M.caixa(x0 - 0.3, y + H - 10, z0 - 0.3, x1 + 0.3, y + H - 6, z1 - 0.5, { cor: band, cel: 'branco', sem: { topo: true, frente: true } });
    const uv = this.#fachada(K, 6, base - H, w - 6, base);
    if (uv) F.quad([x0, y, z1], [x1, y, z1], [x1, y + H, z1], [x0, y + H, z1], [1, 1, 1], uv, 0.9999, 0.9999);
    const be = 4, ry = y + H;
    M.caixa(x0 - be, ry, z0 - be, x1 + be, ry + 7, z1 + be, { cor: roofLo, topo: roof, frente: roof, cel: 'laje', ao: 0.8 });
    M.caixa(x0 - be, ry + 7, z1 + be - 3, x1 + be, ry + 10, z1 + be, { cor: roofHi, cel: 'laje' });
    if (E.skylight) M.caixa(o.x - 22, ry + 7, (z0 + z1) / 2 - 8, o.x + 22, ry + 10, (z0 + z1) / 2 + 8, { cor: corLin(0xbfe4ff), cel: 'vidro', bri: 0.3 });
    // letreiro no telhado: o pedaço do 2D em volta do meio do telhado (bola do Centro, placa da loja)
    const ruv = this.#fachada(K, w / 2 - 26, 3, w / 2 + 26, 3 + 22);
    if (ruv) F.quad([o.x - 26, ry + 7, z1 + be - 4], [o.x + 26, ry + 7, z1 + be - 4], [o.x + 26, ry + 29, z1 + be - 9], [o.x - 26, ry + 29, z1 + be - 9], [1, 1, 1], ruv, 0.9999, 0.9999);
    S.push([o.x, (z0 + z1) / 2 + 4, w * 0.62, (z1 - z0) * 0.8, y + 0.3]);
    o.__topo3d = ry + 7;
  }
}
