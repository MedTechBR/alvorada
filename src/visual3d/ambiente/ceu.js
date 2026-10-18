import * as THREE from 'three';
import { fbm, hash, sorteio } from './ruido.js';
import { U, iniciarComum } from './comum.js';

// Céu HD-2D com ciclo do dia (game.mundo.hour): gradiente quente, sol com halo, nuvens volumosas pintadas,
// montanhas e colinas em camadas com névoa atmosférica, estrelas e lua à noite. Também é dono da LUZ:
// sol dourado com sombras definidas (shadow map na qualidade alta), luz ambiente azulada (hemisfério) e névoa.
// Tudo o que é "fundo" anda com a câmera (não tem fim) e não escreve profundidade.
//
// Paleta por hora: [hora, zênite, horizonte, sol, força do sol, céu do hemisfério, chão do hemisfério, força hemi,
//                   nuvem clara, nuvem sombra, raios (god rays), estrelas]
const C = (h) => new THREE.Color(h);
const DIA = [
  [0, C(0x050a1c), C(0x14203e), C(0x8aa0e0), 0.22, C(0x30447a), C(0x0c1222), 0.55, C(0x4a5a88), C(0x161e38), 0, 1],
  [4.6, C(0x0a1230), C(0x2a2c52), C(0x9a90d0), 0.26, C(0x3a4678), C(0x161826), 0.6, C(0x5a5a8a), C(0x1e2040), 0, 0.85],
  [6.0, C(0x5a78b8), C(0xf0a07a), C(0xff9a58), 1.0, C(0xb8b0d0), C(0x5a4a40), 0.75, C(0xffc0a0), C(0x8a6a8a), 0.7, 0.1],
  [7.4, C(0x86b8e6), C(0xffd6a0), C(0xffc47a), 2.4, C(0xb6cce8), C(0x6a6a3a), 0.9, C(0xfff0d8), C(0xc0a0a0), 1.0, 0],
  [9.5, C(0x8cc4ee), C(0xf6e6c4), C(0xffe0aa), 2.9, C(0xa8c4ea), C(0x6a7438), 0.95, C(0xffffff), C(0xb8c0d4), 0.75, 0],
  [14.5, C(0x7fbcec), C(0xeee8d2), C(0xfff0d0), 3.0, C(0xa8c8ee), C(0x6a7438), 0.95, C(0xffffff), C(0xb0bcd4), 0.55, 0],
  [16.6, C(0x8ec0e8), C(0xffd89a), C(0xffbe6a), 2.7, C(0xb0c0e0), C(0x6e6834), 0.9, C(0xfff0d0), C(0xc8a0a0), 1.0, 0],
  [18.1, C(0x5a6ca8), C(0xff9c5a), C(0xff7a3a), 1.5, C(0xb09ac0), C(0x5a4030), 0.75, C(0xffb080), C(0x8a5a7a), 0.9, 0.05],
  [19.3, C(0x1e2450), C(0x7a4a6a), C(0xc07ac0), 0.45, C(0x50507a), C(0x1a1626), 0.6, C(0x8a6a90), C(0x2e2848), 0.15, 0.6],
  [20.5, C(0x070c22), C(0x1c2648), C(0x8aa0e0), 0.24, C(0x30447a), C(0x0c1222), 0.55, C(0x4a5a88), C(0x161e38), 0, 1],
  [24, C(0x050a1c), C(0x14203e), C(0x8aa0e0), 0.22, C(0x30447a), C(0x0c1222), 0.55, C(0x4a5a88), C(0x161e38), 0, 1],
];
const lerp = (a, b, k) => a + (b - a) * k;

const VERT_FUNDO = /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
const FRAG_CEU = /* glsl */`
  uniform vec3 zenite, horizonte, solCor, solDir, luaDir; uniform float estrelas, tempo, brilhoSol;
  varying vec3 vDir;
  float h13(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  void main(){
    vec3 d = normalize(vDir);
    float y = d.y;
    // gradiente: horizonte quente e largo, zênite mais fundo; abaixo do horizonte, névoa
    float k = pow(smoothstep(-0.015, 0.2, y), 0.75);
    vec3 c = mix(horizonte, zenite, k);
    float s = max(dot(d, solDir), 0.0);
    c += solCor * (pow(s, 6.0) * 0.32 + pow(s, 48.0) * 0.6) * brilhoSol;            // halo largo do sol
    c += solCor * smoothstep(0.9993, 0.99965, s) * 3.0 * brilhoSol;                   // disco
    c = mix(c, horizonte * 1.02, (1.0 - smoothstep(-0.08, 0.025, y)) * 0.85);          // faixa de névoa no horizonte
    if (estrelas > 0.0 && y > 0.0) {
      vec3 q = d * 260.0; vec3 i = floor(q); float r = h13(i);
      float st = step(0.985, r) * smoothstep(0.45, 0.0, length(fract(q) - 0.5)) * (0.6 + 0.4 * sin(tempo * (2.0 + r * 5.0) + r * 40.0));
      c += vec3(0.85, 0.9, 1.0) * st * estrelas * smoothstep(0.02, 0.25, y);
      float l = dot(d, luaDir);
      c += vec3(0.9, 0.92, 1.0) * (smoothstep(0.9991, 0.9994, l) * 1.4 + pow(max(l, 0.0), 80.0) * 0.18) * estrelas;
    }
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

// textura de nuvem pintada: R = luz (topo iluminado), A = densidade (bordas macias, miolo fofo)
function texNuvem(seed) {
  const W = 256, H = 128, R = sorteio(seed), blobs = [];
  const n = 9 + Math.floor(R() * 5);
  for (let i = 0; i < n; i++) {
    const x = 0.18 + R() * 0.64, r = 0.08 + R() * 0.13 * (1 - Math.abs(x - 0.5));
    blobs.push([x * W, H * (0.72 - R() * 0.32 - r * 0.6), r * W]);
  }
  blobs.push([W * 0.5, H * 0.62, W * 0.2]);
  const dens = (x, y) => { let d = 0; for (const [bx, by, br] of blobs) { const q = Math.hypot(x - bx, (y - by) * 1.15) / br; if (q < 1) d += (1 - q * q) ** 2; } return Math.min(1, d * 1.6) * Math.min(1, Math.max(0, (H * 0.8 - y) / 16)); };
  const d = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = dens(x, y);
    const fio = fbm(x / 24, y / 24, 3, seed) - 0.5;
    const aa = Math.min(1, Math.max(0, a + fio * 0.35 * (1 - a)));
    // luz: quanto de nuvem há na direção do sol (alto, à direita); menos nuvem = mais luz
    const somb = dens(x + 9, y - 14) * 0.6 + dens(x + 18, y - 28) * 0.4;
    const luz = Math.min(1, Math.max(0, 1.05 - somb * 0.75 + (H * 0.4 - y) / H * 0.4));
    const k = ((H - 1 - y) * W + x) * 4; // vira para o uv do plano (v para cima)
    d[k] = luz * 255; d[k + 1] = 0; d[k + 2] = 0; d[k + 3] = aa * 255;
  }
  const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
const FRAG_NUVEM = /* glsl */`
  uniform sampler2D tN; uniform vec3 corLuz, corSombra, horizonte; uniform float opac, nevoa;
  varying vec2 vUv;
  void main(){
    vec4 t = texture2D(tN, vUv);
    if (t.a < 0.01) discard;
    vec3 c = mix(corSombra, corLuz, smoothstep(0.15, 0.95, t.r));
    c = mix(c, horizonte, nevoa);
    gl_FragColor = vec4(c, t.a * opac);
    #include <colorspace_fragment>
  }`;
const FRAG_MONTE = /* glsl */`
  uniform vec3 corTopo, corPe, horizonte, solCor; uniform float nevoa, solLado;
  varying vec2 vUv; varying float vLuz;
  void main(){
    // topo mais escuro e definido, pé some na névoa (perspectiva aérea)
    vec3 c = mix(corPe, corTopo, smoothstep(0.0, 1.0, vUv.y));
    c *= 0.86 + vLuz * 0.28;
    c = mix(c, horizonte, nevoa + (1.0 - nevoa) * (1.0 - smoothstep(0.0, 0.55, vUv.y)) * 0.65);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

// faixa de montanha: perfil por ruído; uv.y = 0 no pé, 1 no cume local
function geoMontanha(seed, largura, altura, rugos, arvores) {
  const N = 220, pos = [], uv = [], luz = [], idx = [];
  const perfil = (k) => {
    let h = fbm(k * rugos, seed * 0.37, 5, seed) * 1.25 - 0.18;
    h = Math.max(0.08, h);
    if (arvores) { const a = k * 900; h += (Math.abs(Math.sin(a)) ** 0.5 * 0.05 + Math.abs(Math.sin(a * 0.37 + 1)) ** 0.6 * 0.035) * (hash(Math.floor(a / 3.14), 0, seed) > 0.25 ? 1 : 0.3); }
    return h * altura;
  };
  for (let i = 0; i <= N; i++) {
    const k = i / N, x = (k - 0.5) * largura, h = perfil(k), hp = perfil(Math.min(1, k + 1 / N));
    pos.push(x, -altura * 0.6, 0, x, h, 0);
    uv.push(k, 0, k, 1);
    const incl = (hp - h) / (largura / N); // encosta virada para o sol (leste) mais clara
    luz.push(0.5, Math.max(0, Math.min(1, 0.5 - incl * 1.5)));
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aLuz', new THREE.Float32BufferAttribute(luz, 1));
  g.setIndex(idx);
  return g;
}

export class CeuHD {
  // ctx: { scene, renderer }; nivel: de qualidade.js
  constructor(ctx, nivel = {}) {
    iniciarComum();
    this.ctx = ctx; this.nivel = nivel;
    const s = ctx.scene;
    this.grupo = new THREE.Group(); this.grupo.name = 'ceuHD'; s.add(this.grupo);
    this.fundo = new THREE.Color();
    s.background = null;
    s.fog = new THREE.Fog(0xf0e6cc, 700, 3200);
    // luz
    this.hemi = new THREE.HemisphereLight(0xa8c4ea, 0x6a7438, 0.95);
    this.sol = new THREE.DirectionalLight(0xffe0aa, 2.9);
    this.sol.target = new THREE.Object3D();
    s.add(this.hemi, this.sol, this.sol.target);
    this.dirSol = new THREE.Vector3(0.5, 0.6, -0.4).normalize();
    this.#sombras();
    // cúpula
    this.uCeu = { zenite: { value: C(0x8cc4ee) }, horizonte: { value: C(0xf6e6c4) }, solCor: { value: C(0xffe0aa) }, solDir: { value: this.dirSol }, luaDir: { value: new THREE.Vector3(0, 1, 0) }, estrelas: { value: 0 }, tempo: U.tempo, brilhoSol: { value: 1 } };
    this.cupula = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({ uniforms: this.uCeu, vertexShader: VERT_FUNDO, fragmentShader: FRAG_CEU, side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false }));
    this.cupula.frustumCulled = false; this.cupula.renderOrder = -100; this.grupo.add(this.cupula);
    // montanhas e colinas: do fundo para a frente (cada camada com mais névoa quanto mais longe)
    const camadas = nivel.montanhas ?? 3;
    this.montes = [];
    const defs = [
      { dist: 6000, larg: 26000, alt: 900, rug: 3.6, topo: C(0x6a7f9e), pe: C(0xaebdd2), nevoa: 0.35, arv: false, par: 0.97 },
      { dist: 4200, larg: 16000, alt: 330, rug: 5, topo: C(0x5c8a50), pe: C(0x9cb88a), nevoa: 0.22, arv: false, par: 0.93 },
      { dist: 2800, larg: 10000, alt: 170, rug: 7, topo: C(0x4f8a3a), pe: C(0x8cb064), nevoa: 0.1, arv: true, par: 0.86 },
    ].slice(3 - camadas);
    for (const [i, d] of defs.entries()) {
      const u = { corTopo: { value: d.topo.clone() }, corPe: { value: d.pe.clone() }, horizonte: this.uCeu.horizonte, solCor: this.uCeu.solCor, nevoa: { value: d.nevoa }, solLado: { value: 0 } };
      const m = new THREE.Mesh(geoMontanha(11 + i * 7, d.larg, d.alt, d.rug, d.arv), new THREE.ShaderMaterial({
        uniforms: u, vertexShader: `attribute float aLuz; varying vec2 vUv; varying float vLuz; void main(){ vUv = uv; vLuz = aLuz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: FRAG_MONTE, depthWrite: false, fog: false }));
      m.frustumCulled = false; m.renderOrder = -90 + i; m.userData = { ...d, base: { topo: d.topo.clone(), pe: d.pe.clone() } };
      this.grupo.add(m); this.montes.push(m);
    }
    // nuvens
    const nN = nivel.nuvens ?? 9;
    this.texN = [texNuvem(3), texNuvem(17), texNuvem(29)];
    this.uNuv = { corLuz: { value: C(0xffffff) }, corSombra: { value: C(0xb8c0d4) }, horizonte: this.uCeu.horizonte };
    this.nuvens = [];
    const R = sorteio(99);
    for (let i = 0; i < nN; i++) {
      const u = { tN: { value: this.texN[i % 3] }, corLuz: this.uNuv.corLuz, corSombra: this.uNuv.corSombra, horizonte: this.uCeu.horizonte, opac: { value: 1 }, nevoa: { value: 0 } };
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.ShaderMaterial({ uniforms: u, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`, fragmentShader: FRAG_NUVEM, transparent: true, depthWrite: false, fog: false }));
      const dist = 3000 + R() * 2600, larg = 900 + R() * 1300;
      m.userData = { x: (R() - 0.5) * 9000, dist, larg, alt: 380 + R() * 700 + (dist - 3000) * 0.12, vel: 4 + R() * 6 };
      u.nevoa.value = Math.min(0.55, (dist - 3000) / 5200);
      m.frustumCulled = false; m.renderOrder = -80; m.scale.set(larg, larg, 1);
      this.grupo.add(m); this.nuvens.push(m);
    }
    this.paleta = { raios: 0.8, corRaio: C(0xffd890), noite: 0, horizonte: this.uCeu.horizonte.value, solCor: this.uCeu.solCor.value, iSol: 2.9 };
    this.tmp = Array.from({ length: 8 }, () => new THREE.Color());
  }
  #sombras() {
    const r = this.ctx.renderer, N = this.nivel, sh = this.sol.shadow;
    const liga = !!N.sombras;
    r.shadowMap.enabled = liga; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.sol.castShadow = liga;
    const tam = N.sombraTam ?? 2048;
    sh.mapSize.set(tam, tam); sh.bias = -0.0005; sh.normalBias = 0.6; sh.radius = 2;
    sh.camera.near = 10; sh.camera.far = 3000;
  }
  // troca de qualidade em jogo
  nivelar(nivel) {
    this.nivel = nivel; this.sol.shadow.map?.dispose(); this.sol.shadow.map = null; this.#sombras();
    this.ctx.scene.traverse((m) => { if (m.material) m.material.needsUpdate = true; });
  }
  #amostra(h) {
    let i = 0; while (i < DIA.length - 2 && DIA[i + 1][0] <= h) i++;
    const a = DIA[i], b = DIA[i + 1], k = Math.min(1, Math.max(0, (h - a[0]) / (b[0] - a[0] || 1))), t = this.tmp;
    return { zen: t[0].copy(a[1]).lerp(b[1], k), hor: t[1].copy(a[2]).lerp(b[2], k), sol: t[2].copy(a[3]).lerp(b[3], k), iSol: lerp(a[4], b[4], k),
      hc: t[3].copy(a[5]).lerp(b[5], k), hg: t[4].copy(a[6]).lerp(b[6], k), iH: lerp(a[7], b[7], k), nl: t[5].copy(a[8]).lerp(b[8], k), ns: t[6].copy(a[9]).lerp(b[9], k), raios: lerp(a[10], b[10], k), est: lerp(a[11], b[11], k) };
  }
  // o: { hora, camera, foco (Vector3: ponto que a câmera olha), raio (px: metade do que se vê, para o mapa de sombra), interior }
  update(dt, o) {
    const h = ((o.hora ?? 12) % 24 + 24) % 24, cam = o.camera, foco = o.foco ?? cam.position;
    const A = this.#amostra(h);
    const u = this.uCeu;
    u.zenite.value.copy(A.zen); u.horizonte.value.copy(A.hor); u.solCor.value.copy(A.sol); u.estrelas.value = A.est;
    this.fundo.copy(A.hor);
    // sol: nasce a leste (x+), se põe a oeste, pende para o norte (contraluz: raios vindo do fundo da cena)
    const ang = ((h - 6) / 12) * Math.PI, el = Math.sin(Math.min(Math.PI, Math.max(0, ang)));
    const lado = Math.cos(ang);
    const solN = this.nivel.solNorte ?? 0.55;
    this.dirSol.set(lado * 0.85, 0.12 + el * 0.85, -solN).normalize();
    if (h < 5.6 || h > 18.8) { // de noite a "luz do sol" é a lua (alta, fria)
      this.dirSol.set(-0.35, 0.8, -0.45).normalize();
    }
    u.luaDir.value.set(-0.45, 0.42, -0.78).normalize();
    u.brilhoSol.value = h > 5.6 && h < 18.8 ? 1 : 0;
    // luz
    this.hemi.color.copy(A.hc); this.hemi.groundColor.copy(A.hg); this.hemi.intensity = A.iH;
    this.sol.color.copy(A.sol); this.sol.intensity = A.iSol;
    const R = Math.min(1400, o.raio ?? 600), sc = this.sol.shadow.camera;
    if (sc.right !== R) { sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.updateProjectionMatrix(); }
    const passo = (2 * R) / this.sol.shadow.mapSize.x, px = Math.round(foco.x / passo) * passo, pz = Math.round(foco.z / passo) * passo;
    this.sol.position.set(px + this.dirSol.x * 1200, foco.y + this.dirSol.y * 1200, pz + this.dirSol.z * 1200);
    this.sol.target.position.set(px, foco.y, pz);
    // névoa da distância = cor do horizonte (um pouco mais clara de dia)
    const fog = this.ctx.scene.fog;
    fog.color.copy(A.hor);
    if (o.nevoa) { fog.near = o.nevoa[0]; fog.far = o.nevoa[1]; }
    // fundo acompanha a câmera
    const cp = cam.position;
    this.cupula.position.copy(cp); this.cupula.scale.setScalar(cam.far * 0.95);
    for (const m of this.montes) {
      const d = m.userData;
      m.position.set(cp.x * d.par, -40 - (1 - d.par) * 200, cp.z - d.dist);
      // cor da camada segue a hora: escurece à noite, esquenta no pôr do sol
      m.material.uniforms.corTopo.value.copy(d.base.topo).multiply(this.tmp[7].copy(A.hc).lerp(A.sol, 0.3).multiplyScalar(0.6 + A.iSol * 0.13));
      m.material.uniforms.corPe.value.copy(d.base.pe).multiply(this.tmp[7].copy(A.hc).multiplyScalar(0.7 + A.iSol * 0.1));
    }
    this.uNuv.corLuz.value.copy(A.nl); this.uNuv.corSombra.value.copy(A.ns);
    const t = U.tempo.value;
    for (const m of this.nuvens) {
      const d = m.userData; let x = d.x + t * d.vel;
      x = ((x - cp.x * 0.5 + 6000) % 12000 + 12000) % 12000 - 6000;
      m.position.set(cp.x + x, d.alt, cp.z - d.dist);
      m.quaternion.copy(cam.quaternion);
    }
    this.grupo.visible = !o.interior;
    // compartilhados
    U.noite.value = A.est;
    U.nuvem.value.w = o.interior ? 0 : (this.nivel.sombraNuvem ?? 0.3) * Math.min(1, A.iSol / 2.4);
    const P = this.paleta; P.raios = o.interior ? 0 : A.raios; P.corRaio.copy(A.sol); P.noite = A.est; P.iSol = A.iSol;
    return P;
  }
}
