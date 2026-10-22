import * as THREE from 'three';
import { TILE } from '../world/tiles.js';
import { WATER_FRAMES, TALL, CORN } from '../world/art.js';
import { TALL_SNOW, TALL_DRY, TALL_REED } from '../world/arte-biomas.js';
import { PAREDE } from './relevo.js';
import { Modelos } from './modelos.js';
import { paredesDasSalas, pisosDasSalas, materialSala, luzDasJanelas, enfeitesDasSalas } from './salas.js';
import { comNuvens } from './ceu.js';
import { comPixel } from './pixel.js';
import { CURVA_GLSL } from './curva.js';

// Setores do 3D (16x16 blocos, os mesmos do 2D): cada um vira poucas malhas mescladas:
//   chão com relevo (a arte do 2D como textura) + faces de penhasco e paredes,
//   água (plano animado com a arte do 2D e brilho), mato alto (tufos em pé que balançam) e
//   modelos estáticos (árvores, prédios, cercas...) de modelos.js.
// Montagem: no máximo um setor por quadro (o mais perto primeiro); setores longe são descartados.
const CH = 16, CPX = 256;
const AGUA = new Uint8Array(256); for (const t of [TILE.WATER, TILE.DEEP, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S]) AGUA[t] = 1;
const MAX_SETORES = 56;
const cv2img = (cv) => cv.getContext('2d').createImageData(cv.width, cv.height);
const linear = (c) => Math.pow(c / 255, 2.2);

// ---------- texturas compartilhadas ----------
function texDe(canvas, nearest = true, mip = false) {
  const t = new THREE.CanvasTexture(canvas);
  t.flipY = false; t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.minFilter = mip ? THREE.NearestMipmapLinearFilter : nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.generateMipmaps = mip;
  return t;
}
const fonte = (tex) => tex.source.resource;
// tira com os 6 quadros da água do 2D (32x32 cada)
function aguaTira() {
  const c = document.createElement('canvas'); c.width = 32 * 6; c.height = 32;
  const x = c.getContext('2d');
  WATER_FRAMES.forEach((t, i) => { const f = t.frame; x.drawImage(fonte(t), f.x, f.y, f.width, f.height, i * 32, 0, 32, 32); });
  const tx = texDe(c); tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping; return tx;
}
// atlas do mato alto: 5 tipos (mato, milho, neve, seco, junco), quadro parado de cada, em células de 32x32 (pé no fundo)
const MATOS = [TALL, CORN, TALL_SNOW, TALL_DRY, TALL_REED];
function matoAtlas() {
  const c = document.createElement('canvas'); c.width = 32 * 11; c.height = 32;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const tam = [];
  MATOS.forEach((set, i) => { const t = set[0], f = t.frame; x.drawImage(fonte(t), f.x, f.y, f.width, f.height, i * 32 + 16 - Math.floor(f.width / 2), 32 - f.height, f.width, f.height); tam.push([f.width, f.height]); });
  // capim baixo (2 tipos) e florzinhas (branca, amarela, rosa, azul), desenhados aqui em pixel art
  let sd = 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const capim = (ci, alt) => {
    const X = ci * 32, cores = ['#3e7a2c', '#5a9a38', '#7ab848', '#a8d860'];
    for (let k = 0; k < 9; k++) {
      const bx = X + 9 + Math.floor(r() * 14), h = alt - 3 + Math.floor(r() * 5), lean = r() < 0.5 ? -1 : 1;
      for (let y = 0; y < h; y++) { x.fillStyle = cores[Math.min(3, Math.floor((y / h) * 3.2 + r() * 0.6))]; x.fillRect(bx + Math.round(lean * (y / h) * (y / h) * 3), 31 - y, 1, 1); }
    }
    tam.push([16, alt + 2]);
  };
  capim(5, 9); capim(6, 13);
  const flor = (ci, cor, miolo) => {
    const X = ci * 32 + 16;
    x.fillStyle = '#4a8a34'; x.fillRect(X, 26, 1, 6); x.fillRect(X - 3, 29, 1, 3); x.fillRect(X + 3, 28, 1, 4);
    for (const [dx, dy] of [[0, 23], [-3, 26], [3, 25]]) { x.fillStyle = cor; x.fillRect(X + dx - 1, dy, 3, 3); x.fillStyle = miolo; x.fillRect(X + dx, dy + 1, 1, 1); }
    tam.push([10, 10]);
  };
  flor(7, '#ffffff', '#f2c94c'); flor(8, '#ffd84a', '#c87a1a'); flor(9, '#ff8ab0', '#ffffff'); flor(10, '#8ab8ff', '#ffffff');
  return { tex: texDe(c, true, false), tam };
}
const GRAMA = new Uint8Array(256); for (const t of [TILE.GRASS, TILE.GRASS2, TILE.FLOWERS, TILE.DARK, TILE.GOLD]) GRAMA[t] = 1;
const MATO_DE = { [TILE.TALL]: 0, [TILE.CORN]: 1, [TILE.TALLSNOW]: 2, [TILE.TALLDRY]: 3, [TILE.REED]: 4 };

export class Setores {
  constructor(v) {
    this.v = v; this.L = v.L; this.mapa = new Map(); this.fila = [];
    this.grupo = new THREE.Group(); v.scene.add(this.grupo);
    this.modelos = new Modelos(v);
    const u = v.u;
    // água: arte do 2D animada + tinta do chão (raso/fundo/espuma) + brilho do sol e reflexo do céu
    this.uAgua = { tira: { value: aguaTira() }, ceu: { value: new THREE.Color(0xbfe2f6) } };
    this.matAguaBase = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { chao: { value: null } }]),
      vertexShader: `varying vec2 vUv; varying vec2 vW; varying vec3 vVista;
        ${CURVA_GLSL}
        #include <fog_pars_vertex>
        void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xz; wp.xyz = curvar(wp.xyz); vVista = cameraPosition - wp.xyz;
          vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform sampler2D tira; uniform sampler2D chao; uniform float temChao; uniform float tempo; uniform vec3 luz; uniform vec3 ceu; uniform vec3 solDir;
        varying vec2 vUv; varying vec2 vW; varying vec3 vVista;
        #include <fog_pars_fragment>
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        void main(){
          float f = mod(floor(tempo / 0.32), 6.0);
          vec2 w = vW / 32.0;
          vec3 c = texture2D(tira, vec2((fract(w.x) + f) / 6.0, fract(w.y))).rgb;
          vec4 t = texture2D(chao, vUv) * temChao;
          c = mix(c, t.rgb, clamp(t.a * 1.6, 0.0, 1.0));
          // ondinhas: faixas que brilham com o sol (pixeladas em 2 px de mundo)
          vec2 q = floor(vW / 2.0) * 2.0;
          float o = sin(q.x * 0.11 + tempo * 1.7) * sin(q.y * 0.23 - tempo * 1.3) + sin((q.x + q.y) * 0.05 + tempo * 0.9);
          float brilho = smoothstep(1.35, 1.6, o) * 0.55;
          float pisca = step(0.985, h2(floor(vW / 3.0) + floor(tempo * 3.0))) * 0.6;
          vec3 V = normalize(vVista);
          float fres = pow(1.0 - max(V.y, 0.0), 3.0);
          c = mix(c * vec3(0.78, 0.92, 1.0), ceu, 0.06 + fres * 0.22);
          c *= luz;
          c += (brilho + pisca) * luz * vec3(1.0, 0.97, 0.88);
          gl_FragColor = vec4(c, 1.0);
          #include <fog_fragment>
          #include <colorspace_fragment>
        }`,
      fog: true,
    });
    Object.assign(this.matAguaBase.uniforms, { uCurva: v.u.curva, uAlvoZ: v.u.alvoZ, tira: this.uAgua.tira, ceu: this.uAgua.ceu, tempo: u.tempo, luz: u.luzSprite, solDir: { value: new THREE.Vector3(0, 1, 0) } });
    // mato alto: tufos em pé, voltados para a câmera, balançando com o vento; quem passa sacode (aBalanço)
    this.mato = matoAtlas();
    this.matMato = comNuvens(new THREE.MeshLambertMaterial({ map: this.mato.tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }), v, (sh) => {
      sh.uniforms.tempo = u.tempo;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n attribute float aTopo; attribute float aFase; attribute float aBal; uniform float tempo;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float vento = sin(tempo * 1.6 + aFase) * 1.1 + sin(tempo * 3.7 + aFase * 2.3) * 0.35;
          transformed.x += aTopo * (vento + sin(tempo * 26.0) * aBal * 6.0);`);
    });
    this.matMato.customProgramCacheKey = () => 'mt-mato';
  }
  limpar() { for (const s of this.mapa.values()) this.#liberar(s); this.mapa.clear(); this.fila.length = 0; }

  update() {
    const v = this.v, L = this.L;
    this.uAgua.ceu.value.copy(v.ceu.fundo);
    // trocas de bloco (mato cortado, chão queimado, ponte sobre a lava): refaz o setor (a arte o 2D já refez)
    for (const [x, y] of L.mudancas()) {
      this.v.lg?.relevo.sujo(x, y);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const s = this.mapa.get(this.#k(Math.floor((x + i) / CH), Math.floor((y + j) / CH))); if (s) { s.sujo = true; s.trocouBloco = true; } }
    }
    // setores que a câmera vê (pela pegada 3D, não pelo 2D)
    const vw = v.view, quer = new Set(); let refeitos = 0, pintou = false;
    // nível de detalhe da grama (em setores): menor no celular e na qualidade baixa
    this.lodGrama = v.g.quality?.low ? 1.1 : v.touch ? 1.35 : 1.8;
    let falta = null, fd = Infinity;
    const ax = v.alvo.x / CPX, az = v.alvo.z / CPX;
    if (vw) {
      const sx0 = Math.max(0, Math.floor(vw.x0 / CPX)), sx1 = Math.min(L.nx - 1, Math.floor(vw.x1 / CPX));
      const sy0 = Math.max(0, Math.floor(vw.y0 / CPX)), sy1 = Math.min(L.ny - 1, Math.floor(vw.y1 / CPX));
      for (let sy = sy0; sy <= sy1; sy++) for (let sx = sx0; sx <= sx1; sx++) {
        const k = this.#k(sx, sy); quer.add(k);
        const s = this.mapa.get(k), d = Math.hypot(sx + 0.5 - ax, sy + 0.5 - az);
        const arte = L.arteDoSetor(sx, sy);
        if (s && s.pintar) { if (!pintou) { pintou = true; this.#pintar(s); } continue; }
        if (s) {
          if (!v.pixel && arte && s.arte !== arte) { if (s.tex === this.texVazia) s.tex = texDe(arte, true, true); else { s.tex.image = arte; s.tex.needsUpdate = true; } s.arte = arte; s.matAgua.uniforms.chao.value = s.tex; s.matAgua.uniforms.temChao.value = 1; }
          if (s.sujo && refeitos < 2) { s.sujo = false; refeitos++; if (s.lg && s.trocouBloco) { s.trocouBloco = false; v.lg.chao.preencher(s.matChao.userData.mascaraLG); } else if (v.pixel && s.trocouBloco) { s.trocouBloco = false; this.repintar(s); continue; } this.#refazer(s); }
          s.visto = v.t; s.grupo.visible = true;
          // nível de detalhe: grama só perto, arbustos um pouco mais longe
          if (s.grama) s.grama.grupo.visible = d < this.lodGrama;
          if (s.arbustos) s.arbustos.grupo.visible = d < this.lodGrama + 0.8;
        } else if (d < fd && !L.pendente(sx, sy)) { fd = d; falta = { cx: sx, cy: sy }; }
      }
    }
    // um setor novo por quadro (dois se nada estiver pronto ainda)
    if (falta) this.#montar(falta.cx, falta.cy);
    for (const [k, s] of this.mapa) if (!quer.has(k)) s.grupo.visible = false;
    // No celular, guarda só uma pequena vizinhança fora da tela. Nunca descarta o que está visível.
    const limite = v.touch ? 22 : MAX_SETORES;
    if (this.mapa.size > limite) {
      const velhos = [...this.mapa.entries()].filter(([, s]) => !s.grupo.visible).sort((a, b) => a[1].visto - b[1].visto);
      for (const [k, s] of velhos.slice(0, this.mapa.size - limite)) { this.#liberar(s); this.mapa.delete(k); }
    }
    // mato: o 2D guarda quem está balançando (sway); copiamos para os tufos
    for (const s of this.mapa.values()) if (s.grupo.visible && s.mato) this.#balanco(s);
    this.modelos.update();
  }
  #k(sx, sy) { return sx + sy * 4096; }

  #montar(sx, sy) {
    const v = this.v, A = v.amb, lg = !!v.lg?.setor(sx, sy), px = v.pixel && !lg; // lg: setor no estilo Let's Go (src/visual3d/letsgo)
    let arte = this.L.arteDoSetor(sx, sy), tex;
    if (px) {
      // estilo pixel (HGSS/FireRed): o chão é a arte de blocos de 16 px, filtro nearest, pintada aos poucos pelo 3D
      const cv = document.createElement('canvas'); cv.width = cv.height = CPX;
      arte = cv; tex = texDe(cv, true, false);
    } else tex = arte ? texDe(arte, true, true) : this.texVazia ??= new THREE.DataTexture(new Uint8Array(4), 1, 1);
    const s = { sx, sy, arte, tex, grupo: new THREE.Group(), visto: v.t, lg };
    if (px) { s.pintar = { img: cv2img(arte), row: 0 }; s.grupo.visible = false; }
    if (lg) s.matChao = v.curvar(v.lg.chao.material(sx, sy));
    else if (A && !px) s.matChao = v.curvar(A.materialChao(sx, sy, { lados: THREE.DoubleSide })); // chão pintado da ambientação
    else { s.matChao = v.curvar(new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, color: px ? 0xc8d8c0 : 0xffffff })); s.matChao.customProgramCacheKey = () => 'mt-chao-px'; }
    s.matAgua = this.matAguaBase.clone();
    Object.assign(s.matAgua.uniforms, this.matAguaBase.uniforms, { chao: { value: tex }, temChao: { value: arte ? 1 : 0 } });
    this.grupo.add(s.grupo);
    this.mapa.set(this.#k(sx, sy), s);
    if (!px) this.#refazer(s);
  }
  // pinta 4 linhas de blocos por quadro (sem engasgo); quando termina, monta o setor
  #pintar(s) {
    const P = s.pintar, L = this.L, ox = s.sx * CH, oy = s.sy * CH, r1 = Math.min(CH, P.row + 4), th = Math.min(r1, L.h - oy) - P.row;
    if (th > 0) L.pintarChao(P.img, ox, oy, ox, oy + P.row, Math.min(CH, L.w - ox), th);
    P.row = r1;
    if (P.row >= CH) { s.arte.getContext('2d').putImageData(P.img, 0, 0); s.tex.needsUpdate = true; s.pintar = null; this.#refazer(s); return true; }
    return false;
  }
  repintar(s) { if (this.v.pixel && s.arte && !s.pintar) s.pintar = { img: cv2img(s.arte), row: 0 }; }
  #refazer(s) {
    this.nRefaz = (this.nRefaz ?? 0) + 1;
    for (const m of [s.chao, s.agua, s.mato]) if (m) { s.grupo.remove(m); m.geometry.dispose(); }
    s.chao = s.agua = s.mato = null;
    const A = this.v.amb, L = this.L, R = this.v.relevo, lg = s.lg ? this.v.lg : null;
    if (A && !this.v.pixel && !lg) {
      if (s.grama) { s.grupo.remove(s.grama.grupo); s.grama.liberar(); }
      if (s.arbustos) { s.grupo.remove(s.arbustos.grupo); s.arbustos.liberar(); }
      const masc = s.matChao.userData.mascara; if (masc && s.feito) A.terreno.preencher(masc);
      s.feito = true;
      const alt = (px, pz) => R.em(px, pz);
      s.grama = A.gramaDoSetor(s.sx, s.sy, { altura: alt, ocupado: (x, y) => L.ocupado(x, y) && !MATO_DE[L.bloco(x, y)] && MATO_DE[L.bloco(x, y)] !== 0, extra: (x, y) => (L.ocupado(x, y + 1) || L.ocupado(x - 1, y) || L.ocupado(x + 1, y)) ? 0.35 : 0 });
      s.grupo.add(s.grama.grupo);
      s.arbustos = A.arbustosDoSetor(s.sx, s.sy, { altura: alt, objetos: L.objetosDoSetor(s.sx, s.sy).filter((o) => o.kind === 'roundbush') });
      s.grupo.add(s.arbustos.grupo);
      for (const gr of [s.grama.grupo, s.arbustos.grupo]) gr.traverse((m) => { if (m.material) { this.v.curvar(m.material); m.frustumCulled = false; } });
    }
    const g = lg ? lg.chao.geometria(this, s.sx, s.sy) : this.#geometriaChao(s.sx, s.sy);
    s.chao = new THREE.Mesh(g, s.matChao); s.chao.receiveShadow = true; s.chao.castShadow = true; s.grupo.add(s.chao);
    const ga = lg ? lg.geometriaAgua(s.sx, s.sy) : this.#geometriaAgua(s.sx, s.sy);
    if (ga) { s.agua = new THREE.Mesh(ga, lg ? lg.matAgua : s.matAgua); s.agua.renderOrder = -1; s.grupo.add(s.agua); }
    const gm = lg ? lg.geometriaGrama(s) : A && !this.v.pixel ? null : this.#geometriaMato(s);
    if (gm) { s.mato = new THREE.Mesh(gm, lg ? lg.matGrama : this.matMato); s.mato.receiveShadow = true; s.grupo.add(s.mato); }
    this.modelos.setor(s);
    if (s.salas) { for (const m of s.salas) { s.grupo.remove(m); m.geometry.dispose(); } s.salas = null; }
    if (s.luzJanela) { s.grupo.remove(s.luzJanela); s.luzJanela.geometry.dispose(); s.luzJanela = null; }
    if (this.v.amb && s.sy * CH + CH > L.externoH) { s.salas = []; // piso e paredes das salas: uma malha por textura
      for (const { chave, g, mat } of [...pisosDasSalas(this.v, s.sx, s.sy), ...paredesDasSalas(this.v, s.sx, s.sy), ...enfeitesDasSalas(this.v, s.sx, s.sy)]) { const m = new THREE.Mesh(g, mat ?? materialSala(this.v, chave)); m.receiveShadow = true; m.castShadow = !chave.startsWith('floor') && !mat; s.grupo.add(m); s.salas.push(m); }
      s.luzJanela = luzDasJanelas(this.v, s.sx, s.sy); if (s.luzJanela) s.grupo.add(s.luzJanela); }
  }
  matParedeNovo() { const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); return this.v.pixel ? comPixel(m, this.v, { forca: 0.6 }) : m; }
  #liberar(s) {
    this.v.scene.remove(s.grupo); this.grupo.remove(s.grupo);
    for (const m of [s.chao, s.agua, s.mato, s.luzJanela]) m?.geometry.dispose();
    for (const m of s.salas ?? []) m.geometry.dispose();
    this.modelos.liberar(s);
    if (s.lg) this.v.lg.chao.liberar(s.matChao);
    else if (this.v.amb) this.v.amb.liberarSetor(s.matChao, s.grama, s.arbustos); else s.matChao.dispose();
    if (s.tex !== this.texVazia) s.tex.dispose(); s.matAgua.dispose();
  }

  // ---------- alturas da superfície (com paredes) ----------
  // devolve [norte, sul] da superfície do bloco: chão (relevo) + parede, se houver
  sup(x, y) {
    const R = this.v.relevo, L = this.L;
    const n = R.n(x, y), s = R.s(x, y), t = L.bloco(x, y), H = PAREDE[t];
    if (AGUA[t]) { const f = t === TILE.DEEP ? 16 : 9; return [n - f, s - f, 4]; } // leito: a água fica por cima, com fundo de verdade
    const sala = y >= L.externoH;
    // casa de boneca: dentro das salas, parede e vazio ficam no chão, pretos; as paredes de verdade vêm de salas.js
    if (sala && this.v.amb && (t === TILE.VOID || t === TILE.WALL)) return [n, s, t === TILE.VOID ? 6 : 5];
    if (!H) return [n, s, 0];
    const sul = L.bloco(x, y + 1);
    // casa de boneca: dentro das salas, a parede da frente (com o vazio ao sul) fica baixinha
    if (sala && (sul === TILE.VOID || y + 1 >= L.h)) return [n + 5, s + 5, 2];
    if (!PAREDE[sul]) return [n + H, s, 1]; // face: sobe do pé (sul) ao topo (norte)
    return [n + H, s + H, 3];
  }

  // ---------- geometria ----------
  #geometriaChao(sx, sy) {
    const L = this.L, ox = sx * CH, oy = sy * CH, W = Math.min(CH, L.w - ox), H = Math.min(CH, L.h - oy);
    const pos = [], uv = [], cor = [], idx = [];
    const S = new Array((W + 2) * (H + 2));
    for (let j = -1; j <= H; j++) for (let i = -1; i <= W; i++) S[(j + 1) * (W + 2) + i + 1] = this.sup(ox + i, oy + j);
    const sup = (i, j) => S[(j + 1) * (W + 2) + i + 1];
    const quad = (a, b, c, d, ua, ub, uc, ud, k) => {
      const n = pos.length / 3;
      pos.push(...a, ...b, ...c, ...d); uv.push(...ua, ...ub, ...uc, ...ud);
      for (const kk of (Array.isArray(k) ? k : [k, k, k, k])) cor.push(kk, kk, kk);
      idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    };
    const U = (i) => i * 16 / CPX, V = (j) => j * 16 / CPX;
    // sombra de contato: canto do chão encostado em algo mais alto escurece
    const ao = (i, j, hn) => { let k = 1; for (const [a, b] of [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]]) { const q = sup(a, b); if (q && Math.max(q[0], q[1]) > hn + 10) k -= 0.13; } return Math.max(0.55, k); };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const [hn, hs, tipo] = sup(i, j), x0 = (ox + i) * 16, z0 = (oy + j) * 16, x1 = x0 + 16, z1 = z0 + 16;
      const u0 = U(i), u1 = U(i + 1), v0 = V(j), v1 = V(j + 1);
      const ks = tipo >= 5 ? [0.03, 0.03, 0.03, 0.03] : tipo === 3 ? [0.62, 0.62, 0.62, 0.62] : tipo === 1 ? [1, 1, 0.92, 0.92] : [ao(i, j, hn), ao(i + 1, j, hn), ao(i, j + 1, hs), ao(i + 1, j + 1, hs)];
      quad([x0, hn, z0], [x1, hn, z0], [x0, hs, z1], [x1, hs, z1], [u0, v0], [u1, v0], [u0, v1], [u1, v1], ks);
      // saia a leste
      const e = sup(i + 1, j);
      if (e && (Math.abs(e[0] - hn) > 0.5 || Math.abs(e[1] - hs) > 0.5)) {
        const alto = hn + hs > e[0] + e[1];
        const [ua, ub] = alto ? [u0, u1] : [U(i + 1), U(i + 2)];
        quad([x1, hn, z0], [x1, e[0], z0], [x1, hs, z1], [x1, e[1], z1], [ua, v0], [ub, v0], [ua, v1], [ub, v1], 0.7);
      }
      // saia ao sul
      const sl = sup(i, j + 1);
      if (sl && Math.abs(sl[0] - hs) > 0.5) {
        const alto = hs > sl[0]; // a face olha para a câmera
        const vv0 = alto ? v0 : V(j + 1), vv1 = alto ? v1 : V(j + 2);
        quad([x0, Math.max(hs, sl[0]), z1], [x1, Math.max(hs, sl[0]), z1], [x0, Math.min(hs, sl[0]), z1], [x1, Math.min(hs, sl[0]), z1], [u0, vv0], [u1, vv0], [u0, vv1], [u1, vv1], alto ? 0.82 : 0.6);
      }
      // saia a oeste e ao norte só na borda do setor quando o vizinho é mais baixo (o outro setor faz o resto)
      if (i === 0) { const w = sup(-1, j); if (w && (hn - w[0] > 0.5 || hs - w[1] > 0.5)) quad([x0, w[0], z0], [x0, hn, z0], [x0, w[1], z1], [x0, hs, z1], [u0, v0], [u1, v0], [u0, v1], [u1, v1], 0.7); }
      if (j === 0) { const nn = sup(i, -1); if (nn && hn - nn[1] > 0.5) quad([x0, hn, z0], [x1, hn, z0], [x0, nn[1], z0], [x1, nn[1], z0], [u0, v0], [u1, v0], [u0, v1], [u1, v1], 0.6); }
    }
    return this.#buf(pos, uv, cor, idx);
  }
  #buf(pos, uv, cor, idx, extra) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (cor) g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    for (const [k, a, n] of extra ?? []) g.setAttribute(k, new THREE.Float32BufferAttribute(a, n));
    g.setIndex(idx);
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
  #geometriaAgua(sx, sy) {
    const L = this.L, R = this.v.relevo, ox = sx * CH, oy = sy * CH;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const x = ox + i, y = oy + j; if (x >= L.w || y >= L.h) continue;
      const t = L.bloco(x, y);
      if (!AGUA[t] && t !== TILE.TIDE && t !== TILE.SHALLOW && t !== TILE.REED) continue;
      const h = Math.min(R.n(x, y), R.s(x, y)) - 2, n = pos.length / 3;
      const x0 = x * 16, z0 = y * 16;
      pos.push(x0, h, z0, x0 + 16, h, z0, x0, h, z0 + 16, x0 + 16, h, z0 + 16);
      uv.push(i / 16, j / 16, (i + 1) / 16, j / 16, i / 16, (j + 1) / 16, (i + 1) / 16, (j + 1) / 16);
      idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
    return idx.length ? this.#buf(pos, uv, null, idx) : null;
  }
  // tufos de mato alto: 3 por bloco (fundo, meio, frente), voltados para a câmera
  #geometriaMato(s) {
    const L = this.L, R = this.v.relevo, ox = s.sx * CH, oy = s.sy * CH, v = this.v;
    const pos = [], uv = [], cor = [], idx = [], topo = [], fase = [], bal = [];
    const cy = v.cima.y, cz = v.cima.z, tiles = new Map();
    const tufos2d = L.matoDoSetor(s.sx, s.sy);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const x = ox + i, y = oy + j; if (x >= L.w || y >= L.h) continue;
      const t = L.bloco(x, y), m = MATO_DE[t]; if (m === undefined) continue;
      const [fw, fh] = this.mato.tam[m];
      const sp = tufos2d?.get(x + y * L.w);
      const tint = sp?.tint ?? 0xffffff, cr = linear(tint >> 16 & 255), cg = linear(tint >> 8 & 255), cb = linear(tint & 255);
      const first = pos.length / 3;
      const linhas = m === 1 ? [[0, 0.5, 1.12]] : [[-4, 0.25, 0.85], [3, 0.6, 0.95], [-1, 0.98, 0.9]];
      linhas.forEach(([dx, fz, esc], q) => {
        const bx = x * 16 + 8 + dx + (q === 1 ? 2 : 0), bz = y * 16 + fz * 16, h = R.em(bx, bz) - 0.5;
        const w = fw * esc, hh = fh * esc, n = pos.length / 3;
        const u0 = (m * 32 + 16 - fw / 2) / (32 * 11), u1 = (m * 32 + 16 + fw / 2) / (32 * 11), v0 = (32 - fh) / 32, v1 = 1;
        // pé no chão; o topo sobe na direção "cima" da câmera (como os billboards)
        pos.push(bx - w / 2, h, bz, bx + w / 2, h, bz, bx - w / 2, h + hh * cy, bz + hh * cz, bx + w / 2, h + hh * cy, bz + hh * cz);
        uv.push(u0, v1, u1, v1, u0, v0, u1, v0);
        const k = q === 2 ? 1 : 0.86 + q * 0.06;
        for (let r = 0; r < 4; r++) { cor.push(cr * k, cg * k, cb * k); fase.push(x * 0.7 + y * 0.31); bal.push(0); }
        topo.push(0, 0, 1, 1);
        idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      });
      tiles.set(x + y * L.w, [first, pos.length / 3 - first]);
    }
    // capim baixo e florzinhas na grama (mais denso na beira das trilhas e da areia): quebra o recorte do 2D
    const n0 = pos.length / 3;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) {
      const x = ox + i, y = oy + j; if (x >= L.w || y >= L.h) continue;
      const t = L.bloco(x, y); if (!GRAMA[t] || L.ocupado(x, y)) continue;
      let beira = 0; for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const q = L.bloco(x + a, y + b); if (!GRAMA[q] && !MATO_DE[q] && MATO_DE[q] !== 0) beira++; }
      const hsh = (k) => { let hh = (x * 374761393 + y * 668265263 + k * 1442695041) | 0; hh = (hh ^ (hh >>> 13)) * 1274126177; return ((hh ^ (hh >>> 16)) >>> 0) / 4294967295; };
      const n = beira ? 3 + Math.floor(hsh(1) * 3) : hsh(2) < 0.45 ? 1 + Math.floor(hsh(3) * 2) : 0;
      for (let q = 0; q < n; q++) {
        const f = hsh(10 + q), m = f < 0.07 ? 7 + Math.floor(hsh(20 + q) * 4) : f < 0.55 ? 5 : 6;
        const [fw, fh] = this.mato.tam[m];
        const bx = x * 16 + 2 + hsh(30 + q) * 12, bz = y * 16 + 2 + hsh(40 + q) * 13, h = R.em(bx, bz) - 0.3, esc = 0.8 + hsh(50 + q) * 0.5;
        const w = fw * esc, hh = fh * esc, k = pos.length / 3;
        const u0 = (m * 32 + 16 - fw / 2) / (32 * 11), u1 = (m * 32 + 16 + fw / 2) / (32 * 11), v0 = (32 - fh) / 32;
        pos.push(bx - w / 2, h, bz, bx + w / 2, h, bz, bx - w / 2, h + hh * cy, bz + hh * cz, bx + w / 2, h + hh * cy, bz + hh * cz);
        uv.push(u0, 1, u1, 1, u0, v0, u1, v0);
        const tom = 0.85 + hsh(60 + q) * 0.3, dk = t === TILE.DARK ? 0.7 : 1;
        for (let r = 0; r < 4; r++) { cor.push(tom * dk, tom * dk, tom * (m >= 7 ? 1 : 0.9) * dk); fase.push(bx * 0.05 + bz * 0.03); bal.push(0); }
        topo.push(0, 0, 0.6, 0.6);
        idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    void n0;
    if (!idx.length) { s.matoTiles = null; return null; }
    s.matoTiles = tiles;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    const nor = new Float32Array(pos.length); for (let i = 1; i < nor.length; i += 3) nor[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('aTopo', new THREE.Float32BufferAttribute(topo, 1));
    g.setAttribute('aFase', new THREE.Float32BufferAttribute(fase, 1));
    const b = new THREE.Float32BufferAttribute(bal, 1); b.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aBal', b);
    g.setIndex(idx); g.computeBoundingSphere();
    return g;
  }
  #balanco(s) {
    const tufos = this.L.matoDoSetor(s.sx, s.sy); if (!tufos || !s.matoTiles) return;
    const a = s.mato.geometry.getAttribute('aBal'); let mudou = false;
    s.bal ??= new Map();
    for (const [k, sp] of tufos) {
      const val = Math.max(0, sp.sway ?? 0), old = s.bal.get(k) ?? 0;
      if (val === old) continue;
      s.bal.set(k, val);
      const r = s.matoTiles.get(k); if (!r) continue;
      for (let i = r[0]; i < r[0] + r[1]; i++) a.array[i] = val;
      mudou = true;
    }
    if (mudou) a.needsUpdate = true;
  }
}
