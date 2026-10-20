import * as THREE from 'three';
import { MapaLeitura } from '../world/mapa-leitura.js';
import { Relevo } from './relevo.js';
import { Setores } from './setores.js';
import { Espelho } from './espelho.js';
import { Sobreposicao } from './sobreposicao.js';
import { Ceu } from './ceu.js';
import { Pos } from './pos.js';
import { Ambiente } from './ambiente/index.js';
import { curvarMaterial } from './curva.js';
import { IS_TOUCH } from '../engine/input.js';
import { curvaY } from './curva.js';
import { CameraDinamica } from './camera.js';
import { Tocas3D } from './tocas3d.js';
import { HudBatalha } from '../ui/hud-batalha.js';
import { ZonasClima } from './zonas-clima.js';
import { LetsGo } from './letsgo/index.js';

// Visual 3D (HD-2D, estilo HeartGold/SoulSilver). Só desenha: a lógica do jogo é a mesma do 2D.
// Liga-se ao jogo com ?visual=3d (main.js). Desenho completo em docs/visual-3d.md.
//
// Eixos: x = x do mundo (leste), y = altura, z = y do mundo (sul). 1 unidade = 1 px de mundo (bloco = 16).
// A câmera olha para o norte, inclinada; não gira (as direções dos sprites PMD continuam valendo).
export const INCLINACAO = 44 * Math.PI / 180; // acima do horizonte (46° a partir da vertical); o mundo curvo mostra o céu no alto
const FOV = 34;
const LONGE = 38 * 16; // até onde o chão é montado à frente da câmera (px de mundo)

export class Visual3D {
  constructor(g) {
    this.g = g; this.touch = IS_TOUCH;
    // estilo pixel (HGSS/FireRed): toda superfície com arte de 16 px e filtro nearest. ?estilo=liso volta ao chão pintado.
    this.pixel = new URLSearchParams(location.search).get('estilo') !== 'liso';
    this.L = new MapaLeitura(g.map);
    this.relevo = new Relevo(this.L);
    if (new URLSearchParams(location.search).get('amb') !== '0') this.L.semArte(true);
    this.versao = this.L.versao;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    r.setPixelRatio(this.#dpr());
    r.setSize(innerWidth, innerHeight, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.id = 'game3d';
    const host = document.getElementById('game'); host.insertBefore(r.domElement, host.firstChild);
    r.domElement.style.pointerEvents = 'none';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 16, 12000);
    this.alvo = new THREE.Vector3();
    this.cima = new THREE.Vector3(0, Math.cos(INCLINACAO), -Math.sin(INCLINACAO)); // "para cima" dos billboards (segue a câmera)
    this.direita = new THREE.Vector3(1, 0, 0);
    this.dinamica = new CameraDinamica(this);
    this.u = { tempo: { value: 0 }, luzSprite: { value: new THREE.Color(1, 1, 1) }, curva: { value: 0.0002 }, alvoZ: { value: 0 } }; // uniformes compartilhados
    // ambientação HD-2D (src/visual3d/ambiente): terreno pintado, grama, arbustos, céu, luz, pós, partículas.
    // ?amb=0 volta à luz/pós antigos (ceu.js, pos.js) para comparar.
    if (new URLSearchParams(location.search).get('amb') !== '0') {
      try { this.amb = new Ambiente({ renderer: r, scene: this.scene, camera: this.camera, quality: g.quality, L: this.L }); }
      catch (e) { console.error('[3D] ambientação falhou; seguindo sem ela', e); this.amb = null; }
    }
    // estilo Let's Go (src/visual3d/letsgo): zona do começo até o 2º ginásio; ?estilo=voxel desliga, ?estilo=letsgo liga em tudo
    if (this.amb && this.pixel) { try { this.lg = new LetsGo(this); if (!this.lg.ligado) this.lg = null; } catch (e) { console.error('[3D] estilo Let\'s Go falhou; seguindo sem ele', e); this.lg = null; } }
    this.ceu = new Ceu(this);
    this.setores = new Setores(this);
    this.zonas = new ZonasClima(this); // tempestade e neblina das zonas fechadas (barreiras-dados.js)
    this.espelho = new Espelho(this);
    this.sobre = new Sobreposicao(this);
    this.tocas = new Tocas3D(this);
    this.hudBatalha = new HudBatalha(g); // HUD de batalha no estilo do demo (src/ui/hud-batalha.js)
    this.pos = this.amb ? { u: this.amb.pos.u, tamanho: () => this.amb.tamanho(), render: (sc, cam) => this.amb.render(sc, cam), amb: true } : new Pos(this);
    this.t = 0;
    this.#luzDeGolpe();
    this.#tamanho();
    addEventListener('resize', () => this.#tamanho());
    // projeção para quem precisa (mira, marcador do objetivo)
    g.worldToScreen = (x, y, h = 0) => this.paraTela(x, y, h);
    g.screenToWorld = (sx, sy) => this.daTela(sx, sy);
    window.v3d = this;
  }
  #dpr() { const q = this.g.quality?.low; return Math.min(devicePixelRatio || 1, q ? 0.75 : IS_TOUCH ? 1.5 : 2); }
  #tamanho() {
    this.renderer.setPixelRatio(this.#dpr());
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    this.pos?.tamanho();
  }
  // luz 3D de golpes e choques: cada luz grande do 2D (fx.light, usada em impactos, choques no ar, explosões)
  // acende uma luz pontual de verdade no cenário por um instante. Uma luz só, sempre na cena (sem recompilar).
  #luzDeGolpe() {
    const fx = this.g.fx; if (!fx?.light) return;
    this.flash = new THREE.PointLight(0xffffff, 0, 220, 1.4); this.flash.position.set(0, -9999, 0); this.scene.add(this.flash);
    this.flashT = 0; this.flashMax = 0;
    const orig = fx.light.bind(fx);
    fx.light = (x, y, color = 0xffffff, r = 24, life = 0.2, alpha = 0.8) => {
      orig(x, y, color, r, life, alpha);
      if (r < 22) return;
      const forca = Math.min(3, r / 18) * (alpha ?? 0.8);
      if (this.flashT > 0 && forca < this.flashMax * 0.7) return;
      this.flash.color.setHex(color); this.flash.position.set(x, this.altura(x, y) + 22, y);
      this.flashMax = forca; this.flashT = Math.max(0.12, life * 1.4); this.flashVida = this.flashT;
      if (r >= 34) this.dinamica?.impulso(Math.min(0.8, r / 70));
    };
  }
  #luzUpdate(dt) {
    if (!this.flash) return;
    if (this.flashT > 0) { this.flashT -= dt; const k = Math.max(0, this.flashT / this.flashVida); this.flash.intensity = this.flashMax * 9000 * k * k; }
    else this.flash.intensity = 0;
  }
  // troca o desenho do Pixi pelo nosso (o quadro do jogo continua o mesmo)
  instalar() {
    const app = this.g.app;
    app.ticker.remove(app.render, app);
    app.ticker.add(() => this.quadro(), null, -25);
  }
  // distância da câmera: um bloco no foco tem na tela o mesmo tamanho que tem no 2D com esse zoom
  get distancia() { const z = Math.max(0.4, (this.g.zoom || 3) * (this.g.camK ?? 1)); return innerHeight / (2 * z * Math.tan(FOV * Math.PI / 360)) * 1.04; }
  altura(px, py) { const h = this.relevo.em(px, py); return this.lg ? h + this.lg.relevo.em(px, py) : h; }
  // aplica o mundo curvo uma vez em materiais que vieram de outros módulos (ambientação, kit)
  curvar(m) { if (m && !m.userData.curvado) { m.userData.curvado = true; curvarMaterial(m, this); m.needsUpdate = true; } return m; }

  #camera() {
    const g = this.g, agora = performance.now(), dt = Math.min(0.1, (agora - (this.tCam ?? agora)) / 1000); this.tCam = agora;
    const cd = this.dinamica.update(dt);
    if (!cd) return;
    // a altura do foco segue o chão com suavidade (subir uma escada não dá tranco)
    const h = this.altura(cd.x, cd.z);
    this.focoH = this.focoH == null ? h : this.focoH + (h - this.focoH) * Math.min(1, dt * 8);
    let sx = 0, sy = 0;
    if (g.fx?.shake > 0) { const k = g.fx.shake * 6; sx = (Math.random() - 0.5) * k; sy = (Math.random() - 0.5) * k; }
    this.alvo.set(cd.x + sx, this.focoH, cd.z + sy);
    this.u.alvoZ.value = this.alvo.z;
    const D = this.distancia * cd.dist, p = cd.incl, gy = cd.giro;
    this.incl = p;
    this.camera.position.set(this.alvo.x + Math.sin(gy) * D * Math.cos(p), this.alvo.y + D * Math.sin(p), this.alvo.z + Math.cos(gy) * D * Math.cos(p));
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.alvo);
    if (cd.rolo) this.camera.rotateZ(cd.rolo);
    this.camera.updateMatrixWorld();
    this.pv = (this.pv ?? new THREE.Matrix4()).multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    const e = this.camera.matrixWorld.elements;
    this.direita.set(e[0], e[1], e[2]); this.cima.set(e[4], e[5], e[6]);
  }
  // pegada da câmera no chão (retângulo em px de mundo), limitada ao longe
  pegada(h = this.focoH ?? 0, extra = 1) {
    const cam = this.camera, o = cam.position, v = new THREE.Vector3();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [nx, ny] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      v.set(nx * extra, ny * extra, 0.5).unproject(cam).sub(o).normalize();
      let t = v.y < -1e-3 ? (h - o.y) / v.y : Infinity;
      const maxT = (this.distancia + LONGE);
      if (t > maxT) t = maxT;
      const px = o.x + v.x * t, pz = o.z + v.z * t;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, pz); y1 = Math.max(y1, pz);
    }
    return { x0, x1, y0, y1 };
  }
  // chamado pela câmera do jogo no lugar de map.cullChunks
  cull() {
    if (this.L.versao !== this.versao) this.#novoMundo();
    // região nova montada (motor do mapa): o relevo e os setores daquela parte são refeitos aos poucos
    if (this.L.montadas !== this.montadas) { const prim = this.montadas == null; this.montadas = this.L.montadas; if (!prim) { this.relevo.limpar(); for (const s of this.setores.mapa.values()) s.sujo = true; } }
    this.#camera();
    const v = this.pegada(this.focoH, 1.08);
    v.y1 += 48; v.y0 -= 64; // objetos altos ao norte e ao sul da tela
    this.view = v;
    // o 2D só monta o que está perto (sprites dos objetos, mato, luzes, bichinhos): a área de uma tela do 2D
    // em volta do foco. O chão 3D distante não precisa da arte 2D (os setores 3D se montam sozinhos).
    const z = Math.max(1, this.g.zoom || 3), hw = innerWidth / 2 / z + 96, hh = innerHeight / 2 / z + 96, a = this.alvo;
    this.perto = { x0: Math.max(v.x0, a.x - hw), x1: Math.min(v.x1, a.x + hw), y0: Math.max(v.y0, a.z - hh * 1.4), y1: Math.min(v.y1, a.z + hh) };
    this.L.cull(this.perto);
  }
  #novoMundo() { this.versao = this.L.versao; this.relevo.limpar(); this.lg?.limpar(); this.setores.limpar(); this.zonas?.limpar(); }

  paraTela(x, y, h = 0) {
    const v = this.tmpV ??= new THREE.Vector3();
    v.set(x, this.altura(x, y) + h + this.curvaY(y), y).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
  }
  curvaY(z) { return curvaY(this.u.curva.value, this.alvo.z, z); }
  // projeção de um ponto no plano horizontal de altura h (sem o relevo): para a sobreposição
  paraTelaPlano(x, y, h, out = {}) {
    const m = this.pv.elements, Y = h + this.curvaY(y);
    const w = 1 / (m[3] * x + m[7] * Y + m[11] * y + m[15]);
    out.x = ((m[0] * x + m[4] * Y + m[8] * y + m[12]) * w * 0.5 + 0.5) * innerWidth;
    out.y = (-(m[1] * x + m[5] * Y + m[9] * y + m[13]) * w * 0.5 + 0.5) * innerHeight;
    return out;
  }
  // px de tela por px de mundo de um billboard em pé no ponto (x, y)
  escalaEm(x, y) {
    const v = this.tmpV ??= new THREE.Vector3(), h = this.altura(x, y);
    v.set(x, h, y).project(this.camera); const ay = v.y;
    v.set(x, h + this.cima.y * 16, y + this.cima.z * 16).project(this.camera);
    return Math.abs(v.y - ay) * 0.5 * innerHeight / 16;
  }
  // ponto do chão sob um ponto da tela
  daTela(sx, sy) {
    const cam = this.camera, v = new THREE.Vector3((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1, 0.5).unproject(cam).sub(cam.position).normalize();
    const h = this.focoH ?? 0, t = v.y < -1e-3 ? (h - cam.position.y) / v.y : 0;
    return { x: cam.position.x + v.x * t, y: cam.position.z + v.z * t };
  }

  quadro() {
    const g = this.g, dt = Math.min(0.05, g.app.ticker.deltaMS / 1000);
    this.t += dt; this.u.tempo.value = this.t;
    if (!this.view) this.cull();
    // qualidade mudou (automática ou nas Opções): resolução, sombras, densidade da grama
    const q = g.quality?.level;
    if (q !== this.nivelQ) { const prim = this.nivelQ == null; this.nivelQ = q; if (!prim) { this.#tamanho(); if (this.amb?.nivelar(g.quality)) this.setores.limpar(); } }
    const inf = this.renderer.info; inf.autoReset = false; this.ultInfo = { calls: inf.render.calls, tri: inf.render.triangles }; inf.reset();
    const T = this.perf ??= { ceu: 0, setores: 0, espelho: 0, cena: 0, sobre: 0, n: 0 }, now = () => performance.now();
    let t0 = now();
    const marca = (k) => { const t = now(); T[k] += t - t0; t0 = t; };
    try {
      this.ceu.update(dt); this.#luzUpdate(dt); marca('ceu');
      this.setores.update(dt); this.zonas.update(dt); marca('setores');
      this.espelho.update(dt); this.tocas.update(dt); this.hudBatalha.update(dt); marca('espelho');
      this.pos.render(this.scene, this.camera); marca('cena');
    } catch (e) { this.#erro(e); }
    try { this.sobre.render(); marca('sobre'); } catch (e) { this.#erro(e); }
    T.n++;
  }
  // médias de tempo de CPU por quadro (ms) desde a última chamada
  medir() { const T = this.perf, o = {}; if (!T?.n) return o; for (const k of Object.keys(T)) if (k !== 'n') { o[k] = +(T[k] / T.n).toFixed(2); T[k] = 0; } T.n = 0; return o; }
  #erro(e) { if (!this.errT || this.t - this.errT > 5) { this.errT = this.t; console.error('[3D]', e); } }
}
