import * as THREE from 'three';
import { U, iniciarComum } from './comum.js';

// Partículas de ambiente, todas calculadas na GPU (zero trabalho por quadro no JS além de 3 uniformes):
//   folhas que caem rodopiando, pétalas rosa, pólen, poeira dourada flutuando na luz e vagalumes à noite.
// Cada tipo é uma malha instanciada (1 draw call). As partículas vivem numa caixa presa ao mundo em volta do foco
// da câmera e dão a volta nas bordas (somem suavemente), então andar pelo mapa nunca as deixa para trás.
const TIPOS = {
  folhas:   { n: 110, forma: 0, aditivo: false, tam: [3, 5], vel: [14, -10, 4], flut: 9, cores: [0xd98a3a, 0xc8b04a, 0x8aa83a, 0xe0a050], dia: 1 },
  petalas:  { n: 140, forma: 1, aditivo: false, tam: [2.6, 4.2], vel: [16, -7, 3], flut: 12, cores: [0xffa6c4, 0xff8ab0, 0xffc8da], dia: 1 },
  polen:    { n: 260, forma: 2, aditivo: true, tam: [0.9, 1.6], vel: [3, 1.2, 1], flut: 5, cores: [0xfff0b0, 0xffe080], dia: 1, brilho: 1.4 },
  poeira:   { n: 80, forma: 3, aditivo: true, tam: [3, 7], vel: [4, 1.5, 1], flut: 7, cores: [0xffd27a, 0xffb85a], dia: 1, brilho: 0.55 },
  vagalumes:{ n: 70, forma: 4, aditivo: true, tam: [1.6, 2.6], vel: [2, 0.5, 2], flut: 14, cores: [0xd8ff7a, 0xfff08a], dia: 0, brilho: 2.4 },
};

const VERT = /* glsl */`
  attribute vec4 aSemente; attribute vec3 aCorP;
  uniform float tempo, tamMin, tamMax, flut, forma, visivel, escalaN;
  uniform vec3 foco, caixa, vel; uniform vec4 vento;
  varying vec2 vQ; varying vec3 vCor; varying float vA;
  void main(){
    vec4 s = aSemente;
    vec3 span = caixa * 2.0;
    vec3 v = vel * (0.6 + s.yzw * 0.8); v.xz += vento.xy * vento.z * 6.0 * (forma < 2.0 ? 1.0 : 0.3);
    vec3 p0 = s.xyz * span + v * tempo;
    // flutuar (cada uma no seu ritmo)
    p0.x += sin(tempo * (0.7 + s.w) + s.x * 40.0) * flut;
    p0.y += sin(tempo * (0.9 + s.y) + s.z * 30.0) * flut * 0.5;
    p0.z += cos(tempo * (0.6 + s.z) + s.y * 20.0) * flut * 0.6;
    vec3 base = foco - caixa;
    vec3 p = mod(p0 - base, span) + base;
    if (forma > 3.5) p.y = foco.y + 4.0 + mod(s.y * 40.0 + sin(tempo * 0.5 + s.x * 9.0) * 6.0, 34.0);
    // some nas bordas da caixa (sem estalo ao dar a volta)
    vec3 e = min(p - (foco - caixa), (foco + caixa) - p) / (caixa * 0.18);
    vA = clamp(min(min(e.x, e.y), e.z), 0.0, 1.0) * visivel;
    float tam = mix(tamMin, tamMax, s.w) * escalaN;
    // giro (folhas e pétalas viram de lado: a largura pisca)
    float ang = tempo * (1.0 + s.x * 2.5) + s.y * 6.28;
    vec2 q = position.xy;
    if (forma < 1.5) { q.x *= 0.35 + 0.65 * abs(sin(ang * 0.7)); float c = cos(ang), sn = sin(ang); q = vec2(c * q.x - sn * q.y, sn * q.x + c * q.y); }
    if (forma > 3.5) vA *= 0.35 + 0.65 * pow(0.5 + 0.5 * sin(tempo * (1.5 + s.z * 2.0) + s.x * 50.0), 3.0);
    vQ = position.xy; vCor = aCorP;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    mv.xy += q * tam;
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */`
  uniform float forma, brilho; uniform vec3 luz;
  varying vec2 vQ; varying vec3 vCor; varying float vA;
  void main(){
    float r = length(vQ);
    float a;
    vec3 c = vCor;
    if (forma < 0.5) { a = step(r, 0.5) * step(abs(vQ.x) * 1.7 + abs(vQ.y), 0.62); c *= luz * (0.85 + vQ.y * 0.4); }
    else if (forma < 1.5) { a = step(length(vQ * vec2(1.0, 1.35)), 0.5); c *= luz * (0.9 + vQ.y * 0.3); }
    else if (forma < 2.5) { a = smoothstep(0.5, 0.0, r); c *= brilho; }
    else if (forma < 3.5) { a = smoothstep(0.5, 0.28, r) * 0.55 + smoothstep(0.5, 0.0, r) * 0.25; c *= brilho; }
    else { a = smoothstep(0.5, 0.0, r); a = a * a + smoothstep(0.12, 0.0, r); c *= brilho; }
    a *= vA;
    if (forma < 1.5) { if (a < 0.5) discard; gl_FragColor = vec4(c, 1.0); }
    else gl_FragColor = vec4(c * a, a);
    #include <colorspace_fragment>
  }`;

export class Particulas {
  // nivel.particulas: multiplicador da quantidade (0 = nada)
  constructor(scene, nivel = {}) {
    iniciarComum();
    this.grupo = new THREE.Group(); this.grupo.name = 'particulas'; scene.add(this.grupo);
    this.u = { foco: { value: new THREE.Vector3() }, caixa: { value: new THREE.Vector3(420, 90, 320) }, luz: { value: new THREE.Color(1, 1, 1) } };
    this.tipos = {};
    const k = nivel.particulas ?? 1;
    for (const [nome, T] of Object.entries(TIPOS)) {
      const n = Math.round(T.n * k); if (!n) continue;
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const sem = new Float32Array(n * 4), cor = new Float32Array(n * 3), c = new THREE.Color();
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < 4; j++) sem[i * 4 + j] = Math.random();
        c.set(T.cores[i % T.cores.length]); cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b;
      }
      g.setAttribute('aSemente', new THREE.InstancedBufferAttribute(sem, 4));
      g.setAttribute('aCorP', new THREE.InstancedBufferAttribute(cor, 3));
      g.instanceCount = n;
      const uni = { tempo: U.tempo, vento: U.vento, foco: this.u.foco, caixa: this.u.caixa, luz: this.u.luz,
        tamMin: { value: T.tam[0] }, tamMax: { value: T.tam[1] }, flut: { value: T.flut }, forma: { value: T.forma }, vel: { value: new THREE.Vector3(...T.vel) },
        visivel: { value: 1 }, brilho: { value: T.brilho ?? 1 }, escalaN: { value: 1 } };
      const m = new THREE.ShaderMaterial({ uniforms: uni, vertexShader: VERT, fragmentShader: FRAG, transparent: T.aditivo, depthWrite: !T.aditivo,
        blending: T.aditivo ? THREE.AdditiveBlending : THREE.NormalBlending, premultipliedAlpha: true });
      const me = new THREE.Mesh(g, m); me.frustumCulled = false; me.renderOrder = T.aditivo ? 10 : 0;
      this.grupo.add(me);
      this.tipos[nome] = { me, uni, T };
    }
  }
  // o: { foco (Vector3), noite 0..1, luz (Color: luz do cenário), escala (zoom: partículas um pouco maiores de perto), interior, mostrar: {tipo: bool} }
  update(o) {
    this.u.foco.value.copy(o.foco);
    if (o.luz) this.u.luz.value.copy(o.luz);
    if (o.caixa) this.u.caixa.value.copy(o.caixa);
    const noite = o.noite ?? 0;
    for (const [nome, t] of Object.entries(this.tipos)) {
      let vis = t.T.dia ? 1 - noite * 0.85 : Math.max(0, noite * 1.2 - 0.2);
      if (nome === 'poeira' || nome === 'polen') vis *= o.sol ?? 1;
      if (o.interior) vis = nome === 'poeira' ? 0.4 : 0;
      if (o.mostrar && o.mostrar[nome] === false) vis = 0;
      t.uni.visivel.value = vis; t.uni.escalaN.value = o.escala ?? 1;
      t.me.visible = vis > 0.01;
    }
  }
}
