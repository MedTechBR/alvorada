import * as THREE from 'three';
import { MapaLeitura } from '../world/mapa-leitura.js';
import { Relevo } from './relevo.js';
import { Setores } from './setores.js';
import { Espelho } from './espelho.js';
import { Sobreposicao } from './sobreposicao.js';
import { Ceu } from './ceu.js';
import { Pos } from './pos.js';
import { IS_TOUCH } from '../engine/input.js';
import { curvaY } from './curva.js';

// Visual 3D (HD-2D, estilo HeartGold/SoulSilver). Só desenha: a lógica do jogo é a mesma do 2D.
// Liga-se ao jogo com ?visual=3d (main.js). Desenho completo em docs/visual-3d.md.
//
// Eixos: x = x do mundo (leste), y = altura, z = y do mundo (sul). 1 unidade = 1 px de mundo (bloco = 16).
// A câmera olha para o norte, inclinada; não gira (as direções dos sprites PMD continuam valendo).
export const INCLINACAO = 44 * Math.PI / 180; // acima do horizonte (46° a partir da vertical); o mundo curvo mostra o céu no alto
const FOV = 32;
const LONGE = 34 * 16; // até onde o chão é montado à frente da câmera (px de mundo)

export class Visual3D {
  constructor(g) {
    this.g = g; this.touch = IS_TOUCH;
    this.L = new MapaLeitura(g.map);
    this.relevo = new Relevo(this.L);
    this.versao = this.L.versao;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    r.setPixelRatio(this.#dpr());
    r.setSize(innerWidth, innerHeight, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.domElement.id = 'game3d';
    const host = document.getElementById('game'); host.insertBefore(r.domElement, host.firstChild);
    r.domElement.style.pointerEvents = 'none';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 16, 5000);
    this.alvo = new THREE.Vector3();
    this.cima = new THREE.Vector3(0, Math.cos(INCLINACAO), -Math.sin(INCLINACAO)); // "para cima" dos billboards
    this.u = { tempo: { value: 0 }, luzSprite: { value: new THREE.Color(1, 1, 1) }, curva: { value: 0.0011 }, alvoZ: { value: 0 } }; // uniformes compartilhados
    this.ceu = new Ceu(this);
    this.setores = new Setores(this);
    this.espelho = new Espelho(this);
    this.sobre = new Sobreposicao(this);
    this.pos = new Pos(this);
    this.t = 0;
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
  // troca o desenho do Pixi pelo nosso (o quadro do jogo continua o mesmo)
  instalar() {
    const app = this.g.app;
    app.ticker.remove(app.render, app);
    app.ticker.add(() => this.quadro(), null, -25);
  }
  // distância da câmera: um bloco no foco tem na tela o mesmo tamanho que tem no 2D com esse zoom
  get distancia() { const z = Math.max(0.6, this.g.zoom || 3); return innerHeight / (2 * z * Math.tan(FOV * Math.PI / 360)) * 0.92; }
  altura(px, py) { return this.relevo.em(px, py); }

  #camera() {
    const g = this.g, c = g.cam ?? g.player;
    if (!c) return;
    const fx = c.x, fy = c.y;
    // a altura do foco segue o chão com suavidade (subir uma escada não dá tranco)
    const h = this.altura(fx, fy + (g.mount?.camLift ?? 0));
    this.focoH = this.focoH == null ? h : this.focoH + (h - this.focoH) * 0.15;
    let sx = 0, sy = 0;
    if (g.fx?.shake > 0) { const k = g.fx.shake * 6; sx = (Math.random() - 0.5) * k; sy = (Math.random() - 0.5) * k; }
    this.alvo.set(fx + sx, this.focoH, fy + sy);
    this.u.alvoZ.value = this.alvo.z;
    const D = this.distancia;
    this.camera.position.set(this.alvo.x, this.alvo.y + D * Math.sin(INCLINACAO), this.alvo.z + D * Math.cos(INCLINACAO));
    this.camera.lookAt(this.alvo);
    this.camera.updateMatrixWorld();
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
    this.#camera();
    const v = this.pegada(this.focoH, 1.08);
    v.y1 += 48; v.y0 -= 64; // objetos altos ao norte e ao sul da tela
    this.view = v;
    this.L.cull(v);
  }
  #novoMundo() { this.versao = this.L.versao; this.relevo.limpar(); this.setores.limpar(); }

  paraTela(x, y, h = 0) {
    const v = this.tmpV ??= new THREE.Vector3();
    v.set(x, this.altura(x, y) + h + this.curvaY(y), y).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
  }
  curvaY(z) { return curvaY(this.u.curva.value, this.alvo.z, z); }
  // projeção de um ponto no plano horizontal de altura h (sem o relevo): para a sobreposição
  paraTelaPlano(x, y, h) {
    const v = this.tmpV ??= new THREE.Vector3();
    v.set(x, h + this.curvaY(y), y).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
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
    try {
      this.ceu.update(dt);
      this.setores.update(dt);
      this.espelho.update(dt);
      this.pos.render(this.scene, this.camera);
    } catch (e) { this.#erro(e); }
    try { this.sobre.render(); } catch (e) { this.#erro(e); }
  }
  #erro(e) { if (!this.errT || this.t - this.errT > 5) { this.errT = this.t; console.error('[3D]', e); } }
}
