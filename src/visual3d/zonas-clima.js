import * as THREE from 'three';
import { TEMPESTADES, NEVOAS, ativa } from '../world/barreiras-dados.js';
import { CURVA_GLSL } from './curva.js';

// Clima das zonas fechadas da progressão (barreiras-dados.js): nada no chão, só o ar.
//   Tempestade (Planalto): um volume escuro em cima da zona (céu carregado, mais escuro no alto, nuvens que andam),
//   chuva inclinada só dentro dela e raios de vez em quando (relâmpago no volume, risco do raio, luz e trovão).
//   Neblina (Mar do Sul): um banco de névoa branca, denso embaixo, que se mexe devagar.
// Cada retângulo vira uma caixa só quando está perto do que a câmera vê (uma malha por retângulo, um draw call);
// a chuva é uma malha só (linhas), presa ao trecho da tempestade mais perto do foco. Some quando a zona é liberada.
const PERTO = 700;     // px além da vista em que a caixa já existe
const ALTO = { tempestade: 130, neblina: 56 }; // a parede da tempestade sobe alta (cortina escura na borda)

const VERT = /* glsl */`
  ${CURVA_GLSL}
  varying vec3 vW;
  void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * vec4(curvar(w.xyz), 1.0); }`;
const FRAG = /* glsl */`
  uniform vec3 cor, corAlto; uniform float alfa, flash, tempo, y0, y1, neblina;
  varying vec3 vW;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
  void main(){
    float k = clamp((vW.y - y0) / (y1 - y0), 0.0, 1.0);
    vec2 q = vW.xz * 0.006 + vec2(tempo * 0.012, tempo * 0.004);
    float n = ruido(q) * 0.6 + ruido(q * 2.7 + 3.1) * 0.4;
    float a;
    vec3 c;
    if (neblina > 0.5) { a = alfa * (1.0 - 0.7 * k) * (0.7 + 0.5 * n); c = mix(cor, corAlto, k); }
    else { a = alfa * (0.8 + 0.2 * k) * (0.85 + 0.3 * n); c = mix(cor, corAlto, k * n); }
    c = mix(c, vec3(0.9, 0.88, 1.0), flash);
    a = clamp(a + flash * 0.25, 0.0, 0.95);
    gl_FragColor = vec4(c, a);
    #include <colorspace_fragment>
  }`;
// chuva: segmentos que caem dentro da caixa (rmin..rmax em xz, y0..y1), inclinados pelo vento
const VCHUVA = /* glsl */`
  ${CURVA_GLSL}
  attribute vec4 aSem; attribute float aPonta;
  uniform vec2 rmin, rmax; uniform float y0, y1, tempo;
  varying float vA;
  void main(){
    vec2 span = rmax - rmin; float H = y1 - y0;
    float y = y1 - mod(aSem.y * H + tempo * (260.0 + aSem.w * 120.0), H);
    vec3 p = vec3(rmin.x + aSem.x * span.x + (y1 - y) * 0.28, y, rmin.y + aSem.z * span.y);
    float L = 9.0 + aSem.w * 7.0;
    p += aPonta * vec3(-L * 0.28, L, 0.0);
    vA = smoothstep(0.0, 0.12, (y - y0) / H) * step(0.001, span.x * span.y);
    gl_Position = projectionMatrix * viewMatrix * vec4(curvar(p), 1.0);
  }`;
const FCHUVA = /* glsl */`
  varying float vA;
  void main(){
    gl_FragColor = vec4(0.78, 0.84, 0.95, 0.55 * vA);
    #include <colorspace_fragment>
  }`;

export class ZonasClima {
  constructor(v) {
    this.v = v; this.caixas = new Map(); this.t = 0; this.proxRaio = 3; this.flash = 0;
    this.grupo = new THREE.Group(); this.grupo.name = 'zonas-clima'; v.scene.add(this.grupo);
    this.uCurva = { uCurva: v.u.curva, uAlvoZ: v.u.alvoZ };
    this.uTempo = { value: 0 }; this.uFlash = { value: 0 };
    // chuva (uma malha para a tempestade inteira)
    const N = v.touch ? 900 : 1500, sem = new Float32Array(N * 2 * 4), ponta = new Float32Array(N * 2), pos = new Float32Array(N * 2 * 3);
    for (let i = 0; i < N; i++) { const s = [Math.random(), Math.random(), Math.random(), Math.random()]; for (let e = 0; e < 2; e++) { sem.set(s, (i * 2 + e) * 4); ponta[i * 2 + e] = e; } }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSem', new THREE.BufferAttribute(sem, 4)); g.setAttribute('aPonta', new THREE.BufferAttribute(ponta, 1));
    this.uChuva = { ...this.uCurva, rmin: { value: new THREE.Vector2() }, rmax: { value: new THREE.Vector2() }, y0: { value: 0 }, y1: { value: 1 }, tempo: this.uTempo };
    this.chuva = new THREE.LineSegments(g, new THREE.ShaderMaterial({ uniforms: this.uChuva, vertexShader: VCHUVA, fragmentShader: FCHUVA, transparent: true, depthWrite: false }));
    this.chuva.frustumCulled = false; this.chuva.visible = false; this.chuva.renderOrder = 8;
    this.grupo.add(this.chuva);
    // risco do raio: fita em zigue-zague (12 trechos), refeita a cada raio
    const rp = new Float32Array(26 * 3), ri = [];
    for (let k = 0; k < 12; k++) { const a = k * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setIndex(ri);
    this.raio = new THREE.Mesh(rg, v.curvar(new THREE.MeshBasicMaterial({ color: 0xf4f0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide })));
    this.raio.frustumCulled = false; this.raio.visible = false; this.raio.renderOrder = 9;
    this.grupo.add(this.raio);
  }

  // zonas ativas no mapa de agora: [{ d, tipo, rect }] (retângulo inteiro dentro de outro da mesma zona é pulado)
  #zonas() {
    const g = this.v.g, f = g.flags ?? {}, id = g.map?.id ?? 'alvorada', out = [];
    for (const [lista, tipo] of [[TEMPESTADES, 'tempestade'], [NEVOAS, 'neblina']]) for (const d of lista) {
      if (d.mundo !== id || !ativa(d, f)) continue;
      d.rects.forEach((r, i) => {
        const [x, y, w, h] = r;
        if (d.rects.some((o, j) => j !== i && x >= o[0] && y >= o[1] && x + w <= o[0] + o[2] && y + h <= o[1] + o[3] && o[2] * o[3] > w * h)) return;
        out.push({ k: d.id + ':' + i, d, tipo, rect: r });
      });
    }
    return out;
  }
  #caixa(z) {
    const v = this.v, [x, y, w, h] = z.rect, X0 = x * 16, Z0 = y * 16, X1 = (x + w) * 16, Z1 = (y + h) * 16;
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j <= 8; j++) for (let i = 0; i <= 8; i++) { const a = v.altura(X0 + (X1 - X0) * i / 8, Z0 + (Z1 - Z0) * j / 8); lo = Math.min(lo, a); hi = Math.max(hi, a); }
    const y0 = lo - 6, y1 = hi + ALTO[z.tipo], neb = z.tipo === 'neblina';
    const geo = new THREE.BoxGeometry(X1 - X0, y1 - y0, Z1 - Z0, Math.max(1, Math.round(w / 8)), 1, Math.max(1, Math.round(h / 8)));
    const u = { ...this.uCurva, tempo: this.uTempo, flash: neb ? { value: 0 } : this.uFlash, y0: { value: y0 }, y1: { value: y1 },
      cor: { value: new THREE.Color(neb ? 0xe8eef2 : 0x3a3456) }, corAlto: { value: new THREE.Color(neb ? 0xf6f8fa : 0x201c34) },
      alfa: { value: neb ? 0.85 : 0.86 }, neblina: { value: neb ? 1 : 0 } };
    const me = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false }));
    me.position.set((X0 + X1) / 2, (y0 + y1) / 2, (Z0 + Z1) / 2);
    me.renderOrder = 7;
    me.caixa = { X0, X1, Z0, Z1, y0, y1, tipo: z.tipo };
    this.grupo.add(me);
    return me;
  }
  #tirar(k) { const me = this.caixas.get(k); if (!me) return; this.grupo.remove(me); me.geometry.dispose(); me.material.dispose(); this.caixas.delete(k); }
  limpar() { for (const k of [...this.caixas.keys()]) this.#tirar(k); this.chuva.visible = false; this.raio.visible = false; }

  update(dt) {
    const v = this.v, g = v.g, vw = v.view, a = v.alvo;
    this.t += dt; this.uTempo.value = this.t;
    const sala = g.map?.interiorAt?.(g.player?.x ?? 0, g.player?.y ?? 0);
    if (!vw || sala) { this.grupo.visible = false; return; }
    this.grupo.visible = true;
    const zonas = this.#zonas(), vivos = new Set();
    let tormenta = null, dMin = Infinity;
    for (const z of zonas) {
      const [x, y, w, h] = z.rect, X0 = x * 16, Z0 = y * 16, X1 = (x + w) * 16, Z1 = (y + h) * 16;
      if (X1 < vw.x0 - PERTO || X0 > vw.x1 + PERTO || Z1 < vw.y0 - PERTO || Z0 > vw.y1 + PERTO) continue;
      vivos.add(z.k);
      if (!this.caixas.has(z.k)) this.caixas.set(z.k, this.#caixa(z));
      if (z.tipo === 'tempestade') { const d = Math.hypot(Math.max(X0 - a.x, 0, a.x - X1), Math.max(Z0 - a.z, 0, a.z - Z1)); if (d < dMin) { dMin = d; tormenta = this.caixas.get(z.k); } }
    }
    for (const k of [...this.caixas.keys()]) if (!vivos.has(k)) this.#tirar(k);
    // chuva: só no pedaço da tempestade mais perto, perto do foco
    const C = tormenta?.caixa;
    if (C) {
      const U = this.uChuva;
      U.rmin.value.set(Math.max(C.X0, a.x - 520), Math.max(C.Z0, a.z - 820));
      U.rmax.value.set(Math.min(C.X1, a.x + 520), Math.min(C.Z1, a.z + 260));
      U.y0.value = C.y0; U.y1.value = C.y1 - 10;
      this.chuva.visible = U.rmax.value.x > U.rmin.value.x && U.rmax.value.y > U.rmin.value.y;
    } else this.chuva.visible = false;
    // perto da tempestade o céu fecha: sem os raios de sol e um pouco mais escuro (o ceu.js refaz isso a cada quadro)
    const P = v.amb?.pos?.u, perto = C ? Math.max(0, Math.min(1, 1 - (dMin - 80) / 420)) : 0;
    if (P && perto > 0) {
      if (P.raios) P.raios.value *= 1 - 0.85 * perto;
      if (P.exposicao) P.exposicao.value *= 1 - 0.12 * perto;
      if (P.sat) P.sat.value *= 1 - 0.18 * perto;
    }
    // raios
    this.flash = Math.max(0, this.flash - dt * 4.5);
    if (this.raioT > 0 && (this.raioT -= dt) <= 0) this.raio.visible = false;
    if (C && this.chuva.visible && (this.proxRaio -= dt) <= 0) {
      this.proxRaio = 2.5 + Math.random() * 4.5;
      const U = this.uChuva, x = U.rmin.value.x + Math.random() * (U.rmax.value.x - U.rmin.value.x), z = U.rmin.value.y + Math.random() * (U.rmax.value.y - U.rmin.value.y);
      this.#riscar(x, z, v.altura(x, z), C.y1);
      this.flash = 1;
      const fl = v.flash;
      if (fl) { fl.color.setHex(0xc8c0ff); fl.position.set(x, v.altura(x, z) + 70, z); v.flashMax = 2.2; v.flashT = v.flashVida = 0.35; }
      const p = g.player;
      if (p && Math.hypot(x - p.x, z - p.y) < 700) setTimeout(() => g.audio?.sfx?.('thunder'), 250 + Math.random() * 500);
    }
    // relâmpago duplo: pisca, apaga, pisca de novo
    const k = this.flash, pisca = k > 0.7 || (k > 0.25 && k < 0.45);
    this.uFlash.value = pisca ? k * 0.7 : k * 0.15;
  }
  #riscar(x, z, chao, topo) {
    const P = this.raio.geometry.attributes.position, n = 13;
    let cx = x, w = 2.4;
    for (let i = 0; i < n; i++) {
      const y = topo - (topo - chao) * (i / (n - 1));
      if (i) cx += (Math.random() - 0.5) * 14;
      P.setXYZ(i * 2, cx - w, y, z); P.setXYZ(i * 2 + 1, cx + w, y, z);
      w = Math.max(0.8, w * 0.92);
    }
    P.needsUpdate = true;
    this.raio.visible = true; this.raioT = 0.16;
  }
}
