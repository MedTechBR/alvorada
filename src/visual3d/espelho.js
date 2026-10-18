import * as THREE from 'three';
import { CURVA_GLSL } from './curva.js';

// Espelho: redesenha em 3D os sprites que o jogo monta no Pixi, sem mexer na lógica deles.
// - game.ents (treinador, Pokémon, NPCs, outros jogadores, montarias, objetos sem modelo): billboards em pé no
//   ponto do pé de cada filho de primeiro nível, com a mesma textura, recorte, escala, giro, tint, transparência
//   e clarão branco do quadro atual. A profundidade é a do pé (o y-sort do 2D vira oclusão de verdade).
// - Sombras do 2D (tx.shadow) e coisas planas (placas no chão): deitadas no chão.
// - Decoração plana do mapa (flores, vitórias-régias, seixos, tapetes, lava/maré animadas): no chão.
// Lotes por folha de textura e modo (um draw call cada), refeitos a cada quadro.
const MODOS = { opaco: 0, transp: 1, aditivo: 2, chao: 3 };
const ORDEM = [0, 4, 6, 2]; // renderOrder por modo: chão antes dos billboards transparentes
const lin = new Float32Array(256); for (let i = 0; i < 256; i++) lin[i] = Math.pow(i / 255, 2.2);

const VERT = `attribute vec4 aCor; attribute vec3 aBase; attribute float aBranco;
  uniform float uPlano; varying vec2 vUv; varying vec4 vCor; varying float vBranco;
  ${CURVA_GLSL}
  #include <fog_pars_vertex>
  void main(){ vUv = uv; vCor = aCor; vBranco = aBranco;
    vec3 cb = curvar(aBase); vec3 pw = position + vec3(0.0, cb.y - aBase.y, 0.0); // o sprite inteiro desce junto com o pé
    if (uPlano > 0.5) pw = curvar(position);
    vec4 mvPosition = viewMatrix * vec4(pw, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    if (uPlano < 0.5) { vec4 b = projectionMatrix * viewMatrix * vec4(cb, 1.0); gl_Position.z = (b.z / b.w - 0.0006) * gl_Position.w; }
    #include <fog_vertex>
  }`;
const FRAG = `uniform sampler2D map; uniform vec3 luz; uniform float uCorte; varying vec2 vUv; varying vec4 vCor; varying float vBranco;
  #include <fog_pars_fragment>
  void main(){ vec4 t = texture2D(map, vUv);
    if (t.a < uCorte) discard;
    vec3 c = mix(t.rgb * vCor.rgb, vec3(1.0), vBranco) * luz;
    gl_FragColor = vec4(c, t.a * vCor.a);
    #include <fog_fragment>
    #include <colorspace_fragment>
  }`;

class Lote {
  constructor(esp, tex, modo) {
    this.tex = tex; this.modo = modo; this.n = 0; this.cap = 0; this.quads = [];
    const plano = modo === MODOS.chao;
    this.mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uPlano: { value: plano ? 1 : 0 }, uCorte: { value: modo === MODOS.opaco ? 0.5 : 0.02 } }]),
      vertexShader: VERT, fragmentShader: FRAG, fog: true,
      transparent: modo !== MODOS.opaco, depthWrite: modo === MODOS.opaco,
      blending: modo === MODOS.aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
    this.mat.uniforms.map = { value: tex };
    this.mat.uniforms.uCurva = esp.v.u.curva; this.mat.uniforms.uAlvoZ = esp.v.u.alvoZ;
    this.mat.map = tex; this.mat.alphaTest = 0.5; // o mapa de sombra copia daqui o recorte pela transparência
    this.mat.uniforms.luz = modo === MODOS.aditivo ? { value: new THREE.Color(1, 1, 1) } : esp.v.u.luzSprite;
    this.geo = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = ORDEM[modo];
    // os sprites em pé fazem sombra de verdade (recorte pela transparência da arte)
    if (modo === MODOS.opaco) { this.mesh.castShadow = true; this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5, side: THREE.DoubleSide }); }
    this.#crescer(64);
    esp.grupo.add(this.mesh);
  }
  #crescer(cap) {
    this.cap = cap;
    const mk = (n) => { const a = new THREE.BufferAttribute(new Float32Array(cap * 4 * n), n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.pos = mk(3); this.uv = mk(2); this.cor = mk(4); this.base = mk(3); this.br = mk(1);
    const idx = new Uint32Array(cap * 6);
    for (let i = 0; i < cap; i++) { const v = i * 4, k = i * 6; idx[k] = v; idx[k + 1] = v + 2; idx[k + 2] = v + 1; idx[k + 3] = v + 1; idx[k + 4] = v + 2; idx[k + 5] = v + 3; }
    const g = this.geo;
    g.setAttribute('position', this.pos); g.setAttribute('uv', this.uv); g.setAttribute('aCor', this.cor); g.setAttribute('aBase', this.base); g.setAttribute('aBranco', this.br);
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  // q: { p: [12 floats], uv: [8], c: [r,g,b,a], b: [3], w, d (profundidade para ordenar) }
  add(q) { this.quads.push(q); }
  fechar() {
    const qs = this.quads, n = qs.length;
    if (n > this.cap) { let c = this.cap; while (c < n) c *= 2; this.geo.dispose(); this.geo = new THREE.BufferGeometry(); this.mesh.geometry = this.geo; this.#crescer(c); }
    if (this.modo !== MODOS.opaco && n > 1) qs.sort((a, b) => a.d - b.d); // de trás para a frente
    const P = this.pos.array, U = this.uv.array, C = this.cor.array, B = this.base.array, W = this.br.array;
    for (let i = 0; i < n; i++) {
      const q = qs[i];
      P.set(q.p, i * 12); U.set(q.uv, i * 8);
      for (let k = 0; k < 4; k++) { C.set(q.c, i * 16 + k * 4); B.set(q.b, i * 12 + k * 3); W[i * 4 + k] = q.w; }
    }
    for (const a of [this.pos, this.uv, this.cor, this.base, this.br]) { a.needsUpdate = true; a.clearUpdateRanges(); a.addUpdateRange(0, n * 4 * a.itemSize); }
    this.geo.setDrawRange(0, n * 6);
    this.mesh.visible = n > 0;
    this.n = n; this.quads = [];
  }
}

export class Espelho {
  constructor(v) {
    this.v = v; this.g = v.g;
    this.grupo = new THREE.Group(); v.scene.add(this.grupo);
    this.lotes = new Map();
    this.texs = new Map(); // fonte do Pixi -> textura do three
    this.pool = []; this.np = 0;
    this.M = [];
  }
  #tex(src) {
    let t = this.texs.get(src);
    if (t) return t;
    const img = src.resource;
    t = new THREE.Texture(img);
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.needsUpdate = true; t.uid = this.texs.size;
    src.on?.('update', () => { t.image = src.resource; t.needsUpdate = true; });
    src.on?.('destroy', () => { this.texs.delete(src); t.dispose(); });
    this.texs.set(src, t);
    return t;
  }
  #lote(tex, modo) {
    const k = tex.uid * 4 + modo;
    let l = this.lotes.get(k);
    if (!l) { l = new Lote(this, tex, modo); this.lotes.set(k, l); }
    return l;
  }
  #quad() { const q = this.pool[this.np++] ?? (this.pool[this.np - 1] = { p: new Float32Array(12), uv: new Float32Array(8), c: new Float32Array(4), b: new Float32Array(3), w: 0, d: 0 }); return q; }

  update() {
    const g = this.g, v = this.v, ents = g.ents;
    this.np = 0;
    this.sombra = g.tx?.shadow?.source;
    this.dono = v.setores.modelos.donosDeSprite?.() ?? null;
    const cam = v.camera.position;
    this.cx = cam.x; this.cz = cam.z;
    const vw = v.view;
    for (const c of ents.children) {
      if (!c.visible || c.alpha <= 0.001) continue;
      if (v.L.ehMato(c)) continue;               // o mato alto é desenhado pelos setores
      if (this.dono?.has(c)) continue;           // objeto com modelo 3D
      const gx = c.x, gy = c.y;
      if (vw && (gx < vw.x0 - 64 || gx > vw.x1 + 64 || gy < vw.y0 - 64 || gy > vw.y1 + 160)) continue;
      const plano = c.zIndex < -1e5;            // placas no chão (objects.js: flat)
      this.gx = gx; this.gy = gy; this.h = v.altura(gx, gy);
      this.#no(c, 1, 0, 0, 1, 0, 0, 1, plano);
    }
    // decoração plana do mapa (setores visíveis)
    for (const s of v.L.setoresVisiveis()) {
      const d = s.deco; if (!d?.visible && !d) continue;
      this.gx = null;
      for (const sp of d.children) if (sp.visible && sp.alpha > 0.01) this.#no(sp, 1, 0, 0, 1, 0, 0, 1, true, true);
    }
    for (const l of this.lotes.values()) l.fechar();
  }
  // percorre a árvore do Pixi compondo a transformação (a, b, c, d, tx, ty) e a transparência
  #no(n, pa, pb, pc, pd, ptx, pty, alpha, plano, deco = false) {
    if (!n.visible || !n.renderable) return;
    const sx = n.scale.x, sy = n.scale.y, r = n.rotation, kx = n.skew.x, ky = n.skew.y;
    const la = Math.cos(r + ky) * sx, lb = Math.sin(r + ky) * sx, lc = -Math.sin(r - kx) * sy, ld = Math.cos(r - kx) * sy;
    const px = n.pivot.x, py = n.pivot.y;
    const ltx = n.x - (px * la + py * lc), lty = n.y - (px * lb + py * ld);
    const a = pa * la + pc * lb, b = pb * la + pd * lb, c = pa * lc + pc * ld, d = pb * lc + pd * ld;
    const tx = pa * ltx + pc * lty + ptx, ty = pb * ltx + pd * lty + pty;
    alpha *= n.alpha;
    if (alpha <= 0.003) return;
    if (n.renderPipeId === 'sprite' && n.texture) this.#sprite(n, a, b, c, d, tx, ty, alpha, plano, deco);
    const ch = n.children;
    if (ch?.length) for (let i = 0; i < ch.length; i++) this.#no(ch[i], a, b, c, d, tx, ty, alpha, plano, deco);
  }
  #sprite(n, a, b, c, d, tx, ty, alpha, plano, deco) {
    const T = n.texture, src = T.source; if (!src?.resource) return;
    const f = T.frame, o = T.orig, w = o.width, h = o.height; if (!w || !h) return;
    const ax = n.anchor.x, ay = n.anchor.y;
    const x0 = -ax * w, y0 = -ay * h, x1 = x0 + w, y1 = y0 + h;
    const sombra = src === this.sombra;
    const chao = plano || sombra;
    const blend = n.blendMode === 'add' ? 2 : 0;
    const modo = chao ? 3 : blend === 2 ? 2 : alpha < 0.99 ? 1 : 0;
    const tex = this.#tex(src);
    const q = this.#quad();
    const v = this.v, cx = v.cima.x, cy = v.cima.y, cz = v.cima.z, rx = v.direita.x, ry = v.direita.y, rz = v.direita.z;
    const P = q.p;
    const cs = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    let k = 0, sumz = 0;
    for (const [lx, ly] of cs) {
      const X = a * lx + c * ly + tx, Y = b * lx + d * ly + ty;
      if (deco) { P[k] = X; P[k + 1] = v.altura(X, Y) + 0.35; P[k + 2] = Y; }
      else if (chao) { P[k] = X; P[k + 1] = this.h + 0.45 + (sombra ? 0 : 0.1); P[k + 2] = Y; }
      else { const up = this.gy - Y, dx = X - this.gx; P[k] = this.gx + dx * rx + up * cx; P[k + 1] = this.h + dx * ry + up * cy; P[k + 2] = this.gy + dx * rz + up * cz; }
      sumz += P[k + 2]; k += 3;
    }
    const sw = src.width, sh = src.height;
    const u0 = f.x / sw, u1 = (f.x + f.width) / sw, v0 = f.y / sh, v1 = (f.y + f.height) / sh;
    const U = q.uv; U[0] = u0; U[1] = v0; U[2] = u1; U[3] = v0; U[4] = u0; U[5] = v1; U[6] = u1; U[7] = v1;
    const tint = n.tint ?? 0xffffff, C = q.c;
    C[0] = lin[tint >> 16 & 255]; C[1] = lin[tint >> 8 & 255]; C[2] = lin[tint & 255]; C[3] = alpha;
    if (deco || chao) { q.b[0] = P[0]; q.b[1] = P[1]; q.b[2] = P[2]; }
    else { q.b[0] = this.gx; q.b[1] = this.h; q.b[2] = this.gy; }
    q.w = n.filters?.length ? 1 : 0;
    q.d = deco || chao ? sumz / 4 : this.gy;
    this.#lote(tex, modo).add(q);
  }
}
