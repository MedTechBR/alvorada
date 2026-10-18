import * as THREE from 'three';

// Pós-processamento HD-2D da ambientação (substitui src/visual3d/pos.js quando o principal quiser):
//   cena -> textura HDR -> pirâmide de reduções (1/2 .. 1/16) -> [raios de sol: desfoque radial a partir do sol]
//   -> composição: tilt-shift forte (desfoca em cima e embaixo, nítido na faixa do foco), bloom dos claros,
//      raios de sol volumétricos falsos (desfoque radial dos claros + feixes procedurais que saem do sol),
//      gradação de cor para o tom da referência (amarelos quentes, verdes oliva, sombras frias), curva de filme,
//      vinheta quente.
// Qualidade baixa (nivel.pos = 'simples'): uma passada só (gradação + vinheta), sem reduções nem raios.
// Interface igual à do pos.js antigo: tamanho(), render(scene, camera), u (uniformes da composição).
const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const DOWN = `uniform sampler2D t; uniform vec2 px; varying vec2 vUv;
  void main(){ vec3 c = texture2D(t, vUv).rgb * 4.0;
    c += texture2D(t, vUv + vec2(-px.x, -px.y)).rgb + texture2D(t, vUv + vec2(px.x, -px.y)).rgb + texture2D(t, vUv + vec2(-px.x, px.y)).rgb + texture2D(t, vUv + vec2(px.x, px.y)).rgb;
    gl_FragColor = vec4(c / 8.0, 1.0); }`;
// desfoque radial dos claros na direção do sol (luz que vaza por entre as copas)
const RAIOS = `uniform sampler2D t; uniform vec2 sol; uniform float limiar; uniform vec2 aspecto; varying vec2 vUv;
  void main(){
    vec2 d = (sol - vUv); float L = length(d * aspecto); d *= 0.92 / 28.0;
    vec2 uv = vUv; float peso = 1.0, soma = 0.0; vec3 c = vec3(0.0);
    for (int i = 0; i < 28; i++) { vec3 s = texture2D(t, uv).rgb; float l = dot(s, vec3(0.2126, 0.7152, 0.0722)); c += smoothstep(limiar, limiar + 0.5, l) * peso; soma += peso; peso *= 0.955; uv += d; }
    gl_FragColor = vec4(c / soma, 1.0); }`;
const FINAL = `uniform sampler2D tCena, tD1, tD2, tD3, tD4, tR;
  uniform float tempo, tilt, foco, faixa, bloomK, limiar, raios, raiosR, vinheta, sat, exposicao, simples, contraste, quente, oliva, frio;
  uniform vec3 tinta, corRaio; uniform vec2 sol, aspecto;
  varying vec2 vUv;
  void main(){
    vec2 uv = vUv;
    vec3 c = texture2D(tCena, uv).rgb;
    if (simples < 0.5) {
      // tilt-shift: nítido numa faixa em volta do foco, desfoque crescente para cima e para baixo
      float d = abs(uv.y - foco) - faixa;
      float t = clamp(d / 0.3, 0.0, 1.0) * tilt;
      vec3 b1 = texture2D(tD1, uv).rgb, b2 = texture2D(tD2, uv).rgb, b3 = texture2D(tD3, uv).rgb;
      vec3 bb = mix(b1, b2, smoothstep(0.25, 0.7, t)); bb = mix(bb, b3, smoothstep(0.7, 1.0, t) * 0.7);
      c = mix(c, bb, smoothstep(0.0, 0.45, t));
      // bloom
      vec3 bl = b2 * 0.3 + b3 * 0.4 + texture2D(tD4, uv).rgb * 0.45;
      c += max(bl - limiar, 0.0) * bloomK;
      // raios: desfoque radial + feixes que saem do sol
      // raios em "tela" (clareiam sem sujar os escuros de laranja)
      vec3 ra = clamp(texture2D(tR, uv).r * raiosR * 0.45 * corRaio, 0.0, 0.8);
      c = c + ra * (1.0 - min(c, vec3(1.0))) * 0.9 + ra * 0.1;
      vec2 q = (uv - sol) * aspecto; float r = length(q); float ang = atan(q.y, q.x);
      float feixes = pow(max(0.0, sin(ang * 9.0 + tempo * 0.05)), 5.0) * 0.6 + pow(max(0.0, sin(ang * 23.0 - tempo * 0.08 + 1.3)), 9.0) * 0.5 + pow(max(0.0, sin(ang * 5.0 + 2.1)), 4.0) * 0.35;
      vec3 fx = corRaio * (feixes * smoothstep(1.5, 0.05, r) * smoothstep(0.0, 0.1, r) * 0.55 + 0.07 * smoothstep(1.0, 0.0, r)) * raios;
      c = c + fx * (1.0 - min(c, vec3(1.0)));
    }
    c *= tinta * exposicao;
    // gradação HD-2D (antes da curva): verdes puxados para oliva/amarelo, sombras frias, claros dourados
    float lum0 = dot(c, vec3(0.2126, 0.7152, 0.0722));
    float verde = clamp((c.g - max(c.r, c.b)) / max(c.g, 1e-3), 0.0, 1.0);
    c.r += (c.g - c.r) * verde * oliva;
    c.b *= 1.0 - verde * oliva * 0.35;
    float sombra = 1.0 - smoothstep(0.0, 0.35, lum0);
    c = mix(c, c * vec3(0.84, 0.95, 1.18) + vec3(0.0, 0.006, 0.022), sombra * frio);
    float claro = smoothstep(0.35, 1.2, lum0);
    c *= mix(vec3(1.0), vec3(1.1, 1.0, 0.8), claro * quente);
    // curva de filme (ACES aproximado)
    c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, sat);
    c = 0.18 * pow(max(c, 0.0) / 0.18, vec3(contraste)); // contraste com pivô no cinza médio (não esmaga os escuros)
    vec2 v = (uv - 0.5) * vec2(1.0, 0.9);
    c *= mix(vec3(1.0), vec3(0.56, 0.5, 0.44), vinheta * smoothstep(0.35, 0.9, length(v)));
    gl_FragColor = vec4(max(c, 0.0), 1.0);
    #include <colorspace_fragment>
  }`;

export class PosHD {
  constructor(renderer, nivel = {}, tempo = { value: 0 }) {
    this.r = renderer; this.nivel = nivel;
    const ext = renderer.extensions;
    this.half = !!(ext.has?.('EXT_color_buffer_float') || ext.has?.('EXT_color_buffer_half_float'));
    const tipo = this.half ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const mk = (depth) => new THREE.WebGLRenderTarget(4, 4, { type: tipo, depthBuffer: depth, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.rt = mk(true); this.d = [mk(false), mk(false), mk(false), mk(false)]; this.rR = mk(false);
    this.cena = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(tri, null); this.quad.frustumCulled = false; this.cena.add(this.quad);
    const sm = (u, f) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: f, depthTest: false, depthWrite: false, toneMapped: false });
    this.mDown = sm({ t: { value: null }, px: { value: new THREE.Vector2() } }, DOWN);
    this.mRaios = sm({ t: { value: null }, sol: { value: new THREE.Vector2(0.8, 0.9) }, limiar: { value: 0.75 }, aspecto: { value: new THREE.Vector2(1, 1) } }, RAIOS);
    this.mFinal = sm({
      tCena: { value: null }, tD1: { value: null }, tD2: { value: null }, tD3: { value: null }, tD4: { value: null }, tR: { value: null }, tempo,
      tilt: { value: 1 }, foco: { value: 0.5 }, faixa: { value: 0.1 }, bloomK: { value: 0.6 }, limiar: { value: 0.8 }, raios: { value: 0.3 }, raiosR: { value: 1.2 },
      vinheta: { value: 0.4 }, sat: { value: 1.1 }, exposicao: { value: 1.25 }, contraste: { value: 1.04 }, quente: { value: 0.45 }, oliva: { value: 0.26 }, frio: { value: 0.4 },
      tinta: { value: new THREE.Color(1, 1, 1) }, corRaio: { value: new THREE.Color(1, 0.86, 0.6) }, sol: { value: new THREE.Vector2(0.85, 1.05) },
      aspecto: { value: new THREE.Vector2(1, 1) }, simples: { value: 0 },
    }, FINAL);
    this.sol3 = new THREE.Vector3();
  }
  get u() { return this.mFinal.uniforms; }
  nivelar(nivel) { this.nivel = nivel; this.tamanho(); }
  tamanho() {
    const s = this.r.getDrawingBufferSize(new THREE.Vector2());
    this.rt.setSize(s.x, s.y);
    let w = s.x, h = s.y;
    for (const d of this.d) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); d.setSize(w, h); }
    this.rR.setSize(Math.max(1, s.x >> 2), Math.max(1, s.y >> 2));
    this.u.aspecto.value.set(s.x / s.y, 1); this.mRaios.uniforms.aspecto.value.set(s.x / s.y, 1);
  }
  // ajusta tudo pela paleta do céu (CeuHD.update) e pela câmera: posição do sol na tela, cor e força dos raios
  ajustar(paleta, camera, dirSol) {
    const u = this.u;
    u.tilt.value = this.nivel.dof === false ? 0 : (this.nivel.tilt ?? 1);
    if (dirSol) {
      this.sol3.copy(dirSol).multiplyScalar(4000).add(camera.position).project(camera);
      const sx = this.sol3.x * 0.5 + 0.5, sy = this.sol3.y * 0.5 + 0.5;
      // atrás da câmera: os raios saem do alto (longe)
      const atras = this.sol3.z > 1;
      u.sol.value.set(Math.min(1.25, Math.max(-0.25, atras ? 1 - sx : sx)), atras ? 1.3 : Math.min(1.3, Math.max(sy, -0.3)));
      this.mRaios.uniforms.sol.value.copy(u.sol.value);
    }
    if (paleta) {
      u.corRaio.value.copy(paleta.corRaio).lerp(new THREE.Color(1, 0.9, 0.7), 0.3);
      u.raios.value = paleta.raios * (this.nivel.raios ?? 1) * 0.55;
      u.raiosR.value = paleta.raios * (this.nivel.raios ?? 1) * 1.6;
      u.limiar.value = 0.85 - paleta.noite * 0.4;
      u.bloomK.value = (this.nivel.bloom ?? 1) * (0.55 + paleta.noite * 0.4);
    }
  }
  #passe(mat, alvo) { this.quad.material = mat; this.r.setRenderTarget(alvo); this.r.render(this.cena, this.cam); }
  render(scene, camera) {
    const r = this.r, N = this.nivel, modo = N.pos ?? 'completo';
    if (modo === 'nenhum') { r.setRenderTarget(null); r.render(scene, camera); return; }
    r.setRenderTarget(this.rt); r.render(scene, camera);
    const u = this.u;
    u.tCena.value = this.rt.texture;
    if (modo === 'simples') { u.simples.value = 1; this.#passe(this.mFinal, null); return; }
    u.simples.value = 0;
    let src = this.rt;
    for (const d of this.d) { this.mDown.uniforms.t.value = src.texture; this.mDown.uniforms.px.value.set(0.5 / src.width, 0.5 / src.height); this.#passe(this.mDown, d); src = d; }
    u.tD1.value = this.d[0].texture; u.tD2.value = this.d[1].texture; u.tD3.value = this.d[2].texture; u.tD4.value = this.d[3].texture;
    if (u.raiosR.value > 0.01) { const m = this.mRaios.uniforms; m.t.value = this.d[1].texture; m.limiar.value = 0.55 + u.limiar.value * 0.35; this.#passe(this.mRaios, this.rR); }
    u.tR.value = this.rR.texture;
    this.#passe(this.mFinal, null);
  }
}
