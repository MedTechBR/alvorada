import * as THREE from 'three';

// Pós-processamento HD-2D, numa cadeia curta e barata:
//   cena -> textura (HDR quando dá) -> pirâmide de 4 reduções (1/2 .. 1/16) com desfoque
//   -> composição final: tilt-shift (desfoca em cima e embaixo, nítido no meio), bloom (brilho que vaza das
//      partes claras), raios de sol diagonais, cor do clima/mergulho, escuro das grutas com luzes,
//      gradação quente, vinheta.
// Qualidade baixa (quality.js): sem pós, desenho direto.
const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const DOWN = `uniform sampler2D t; uniform vec2 px; varying vec2 vUv;
  void main(){ vec3 c = texture2D(t, vUv).rgb * 4.0;
    c += texture2D(t, vUv + vec2(-px.x, -px.y)).rgb + texture2D(t, vUv + vec2(px.x, -px.y)).rgb + texture2D(t, vUv + vec2(-px.x, px.y)).rgb + texture2D(t, vUv + vec2(px.x, px.y)).rgb;
    gl_FragColor = vec4(c / 8.0, 1.0); }`;
const FINAL = `uniform sampler2D tCena, tD1, tD2, tD3, tD4; uniform float tempo, tilt, foco, bloomK, limiar, raios, vinheta, sat, escuro, exposicao; uniform vec3 tinta, corRaio;
  uniform vec4 luzes[8]; uniform float nLuzes; uniform vec2 aspecto;
  varying vec2 vUv;
  void main(){
    vec2 uv = vUv;
    vec3 c = texture2D(tCena, uv).rgb;
    float d = abs(uv.y - foco) - 0.16;
    float t = clamp(d / 0.34, 0.0, 1.0) * tilt;
    vec3 b1 = texture2D(tD1, uv).rgb, b2 = texture2D(tD2, uv).rgb;
    c = mix(c, mix(b1, b2, smoothstep(0.35, 1.0, t)), smoothstep(0.0, 0.6, t));
    vec3 bl = texture2D(tD2, uv).rgb * 0.45 + texture2D(tD3, uv).rgb * 0.35 + texture2D(tD4, uv).rgb * 0.3;
    c += max(bl - limiar, 0.0) * bloomK;
    vec2 q = uv - vec2(-0.1, 1.15);
    float along = dot(q, normalize(vec2(0.62, -1.0))), across = dot(q, normalize(vec2(1.0, 0.62)));
    float faixas = pow(max(0.0, sin(across * 23.0 + tempo * 0.21)), 6.0) * 0.55
      + pow(max(0.0, sin(across * 13.0 - tempo * 0.13 + 1.7)), 8.0) * 0.8
      + pow(max(0.0, sin(across * 41.0 + tempo * 0.37 + 0.4)), 10.0) * 0.35;
    float queda = smoothstep(1.25, 0.15, along) * smoothstep(-0.05, 0.25, along);
    c += corRaio * faixas * queda * raios;
    c *= tinta;
    if (escuro > 0.0) {
      float L = 0.0;
      for (int i = 0; i < 8; i++) { if (float(i) >= nLuzes) break; vec4 l = luzes[i]; vec2 dd = (uv - l.xy) * aspecto; L += l.w * smoothstep(l.z, l.z * 0.15, length(dd)); }
      c *= mix(1.0, clamp(0.06 + L, 0.0, 1.15), escuro);
    }
    // curva de filme (ACES aproximado): segura os claros e dá contraste
    c *= exposicao;
    c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, sat);
    c = c * vec3(1.03, 1.0, 0.95) + vec3(0.0, 0.004, 0.018) * (1.0 - lum);
    vec2 v = (uv - 0.5) * vec2(1.0, 0.85);
    c *= 1.0 - vinheta * smoothstep(0.25, 0.75, length(v));
    gl_FragColor = vec4(max(c, 0.0), 1.0);
    #include <colorspace_fragment>
  }`;

export class Pos {
  constructor(v) {
    this.v = v; const r = v.renderer;
    this.half = !!r.extensions.has?.('EXT_color_buffer_float') || !!r.extensions.has?.('EXT_color_buffer_half_float');
    const tipo = this.half ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const mk = (depth) => new THREE.WebGLRenderTarget(4, 4, { type: tipo, depthBuffer: depth, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
    this.rt = mk(true); this.d = [mk(false), mk(false), mk(false), mk(false)];
    this.cena = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(tri, null); this.quad.frustumCulled = false; this.cena.add(this.quad);
    this.mDown = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, px: { value: new THREE.Vector2() } }, vertexShader: VERT, fragmentShader: DOWN, depthTest: false, depthWrite: false });
    const luzes = []; for (let i = 0; i < 8; i++) luzes.push(new THREE.Vector4());
    this.mFinal = new THREE.ShaderMaterial({
      uniforms: { tCena: { value: null }, tD1: { value: null }, tD2: { value: null }, tD3: { value: null }, tD4: { value: null }, tempo: v.u.tempo,
        tilt: { value: 1 }, foco: { value: 0.5 }, bloomK: { value: 0.55 }, limiar: { value: 0.75 }, raios: { value: 0.2 }, vinheta: { value: 0.32 }, sat: { value: 1.0 }, exposicao: { value: 1.1 },
        tinta: { value: new THREE.Color(1, 1, 1) }, corRaio: { value: new THREE.Color(1, 0.86, 0.6) }, escuro: { value: 0 }, luzes: { value: luzes }, nLuzes: { value: 0 }, aspecto: { value: new THREE.Vector2(1, 1) } },
      vertexShader: VERT, fragmentShader: FINAL, depthTest: false, depthWrite: false, toneMapped: false,
    });
    this.ativo = true;
  }
  get u() { return this.mFinal.uniforms; }
  tamanho() {
    const r = this.v.renderer, s = r.getDrawingBufferSize(new THREE.Vector2());
    this.rt.setSize(s.x, s.y);
    let w = s.x, h = s.y;
    for (const d of this.d) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); d.setSize(w, h); }
    this.u.aspecto.value.set(s.x / s.y, 1);
  }
  #passe(mat, alvo) { const r = this.v.renderer; this.quad.material = mat; r.setRenderTarget(alvo); r.render(this.cena, this.cam); }
  render(scene, camera) {
    const v = this.v, r = v.renderer;
    this.ativo = !v.g.quality?.low;
    if (!this.ativo) { r.setRenderTarget(null); r.render(scene, camera); return; }
    r.setRenderTarget(this.rt); r.render(scene, camera);
    let src = this.rt;
    for (const d of this.d) { this.mDown.uniforms.t.value = src.texture; this.mDown.uniforms.px.value.set(0.5 / src.width, 0.5 / src.height); this.#passe(this.mDown, d); src = d; }
    const u = this.u;
    u.tCena.value = this.rt.texture; u.tD1.value = this.d[0].texture; u.tD2.value = this.d[1].texture; u.tD3.value = this.d[2].texture; u.tD4.value = this.d[3].texture;
    this.#passe(this.mFinal, null);
  }
}
