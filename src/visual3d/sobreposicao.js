import { RenderTexture, PerspectiveMesh, Matrix } from 'pixi.js';
import { IS_TOUCH } from '../engine/input.js';

// Sobreposição: o Pixi continua desenhando tudo o que o 2D desenha em coordenadas de mundo (golpes, choques no
// ar, partículas, anéis, marcas no chão, bolas, clima, bichinhos), agora numa textura que cobre o pedaço de
// mundo visível. Essa textura vai para a tela num PerspectiveMesh com os cantos projetados pela câmera 3D, isto
// é, o desenho 2D fica deitado no plano do chão, com perspectiva. As receitas de golpe não mudam.
// Depois, em espaço de tela: barras de PS, nomes, balões e "!"/"?" das entidades (Graphics e Text dentro de
// game.ents), no ponto projetado de cada uma, nítidos.
// Camadas de tela cheia do 2D que multiplicam a cor (noite, tinta do clima, mergulho, escuro das grutas) ficam
// escondidas aqui: o 3D faz a sua versão (ceu.js, pos.js).
export class Sobreposicao {
  constructor(v) {
    this.v = v; const g = this.g = v.g, app = g.app;
    this.max = IS_TOUCH ? 1024 : 2048;
    this.rt = RenderTexture.create({ width: 512, height: 512 });
    this.rt.source.scaleMode = 'linear';
    this.mesh = new PerspectiveMesh({ texture: this.rt, verticesX: 16, verticesY: 16 });
    app.stage.addChildAt(this.mesh, Math.max(0, app.stage.getChildIndex(g.world)));
    this.mt = new Matrix();
    this.temTela = new WeakMap(); // filho de ents -> tem algo que não é sprite (barra, nome, balão)?
  }
  // algo dentro que o espelho não desenha (Graphics, Text)
  #desenhoDeTela(n) {
    if (n.renderPipeId && n.renderPipeId !== 'sprite') return true;
    for (const c of n.children ?? []) if (this.#desenhoDeTela(c)) return true;
    return false;
  }
  render() {
    const v = this.v, g = this.g, app = g.app, R = app.renderer, W = g.world, stage = app.stage;
    if (!v.view) return;
    // 1) mundo do 2D -> textura (sem chão, sem entidades)
    const h = v.focoH ?? 0, p = v.pegada(h, 1.02);
    const ww = Math.max(1, p.x1 - p.x0), hh = Math.max(1, p.y1 - p.y0);
    const zoom = Math.max(1, g.zoom || 3);
    const k = Math.min(zoom * 1.1, this.max / ww, this.max / hh);
    const rw = Math.min(this.max, Math.ceil(ww * k)), rh = Math.min(this.max, Math.ceil(hh * k));
    if (Math.abs(this.rt.width - rw) > 32 || Math.abs(this.rt.height - rh) > 32 || this.rt.width < rw || this.rt.height < rh) this.rt.resize(rw + 16, rh + 16);
    const sx = W.x, sy = W.y, ssx = W.scale.x, ssy = W.scale.y;
    const root = g.map.root, ents = g.ents;
    const vr = root?.visible, ve = ents.visible;
    if (root) root.visible = false; ents.visible = false;
    W.position.set(-p.x0 * k, -p.y0 * k); W.scale.set(k);
    // as coisas de tela cheia ficam de fora da textura
    const tela = this.#esconderTela(stage);
    const vm = this.mesh.visible; this.mesh.visible = false;
    for (const c of stage.children) if (c !== W && c.visible) { c.visible = false; tela.push(c); }
    R.render({ container: stage, target: this.rt, clear: true, clearColor: [0, 0, 0, 0] });
    for (const c of tela) c.visible = true;
    this.mesh.visible = vm;
    // cantos: o retângulo da textura (só a parte usada) projetado no plano do chão
    const fu = (ww * k) / this.rt.width, fv = (hh * k) / this.rt.height;
    const q = (x, y) => v.paraTelaPlano(x, y, h);
    const a = q(p.x0, p.y0), b = q(p.x1, p.y0), c = q(p.x1, p.y1), d = q(p.x0, p.y1);
    this.mesh.setCorners(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
    this.#uvParcial(fu, fv);
    // 2) tela: textura projetada + barras/nomes/balões das entidades + HUD do Pixi
    W.position.set(0, 0); W.scale.set(1);
    const escondidos = [];
    for (const c of W.children) if (c !== ents && c.visible) { c.visible = false; escondidos.push(c); }
    ents.visible = true;
    const mexidos = this.#entidadesNaTela(ents);
    const escTela = this.#esconderTela(stage);
    R.render({ container: stage });
    for (const c of escTela) c.visible = true;
    for (const [c, x, y, s1, s2, vis] of mexidos) { c.position.set(x, y); c.scale.set(s1, s2); c.visible = vis; }
    for (const s of this.spritesOff) s.renderable = true;
    for (const c of escondidos) c.visible = true;
    W.position.set(sx, sy); W.scale.set(ssx, ssy);
    if (root) root.visible = vr; ents.visible = ve;
  }
  // camadas que multiplicam a tela inteira (no 3D, cada uma tem a sua versão)
  #esconderTela(stage) {
    const out = [], g = this.g, life = g.mundo;
    for (const c of [life?.shade, life?.lights, life?.clima?.tint, life?.masmorra?.lm?.sprite, g.mount?.tintOver]) if (c && c.visible) { c.visible = false; out.push(c); }
    void stage;
    return out;
  }
  // só a parte usada da textura vai para a malha
  #uvParcial(fu, fv) {
    const buf = this.mesh.geometry.getBuffer('aUV'), uvs = buf.data, n = 16;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = (j * n + i) * 2; uvs[k] = (i / (n - 1)) * fu; uvs[k + 1] = (j / (n - 1)) * fv; }
    buf.update();
  }
  // filhos de ents com barra/nome/balão: vão para o ponto projetado, em escala de tela; sprites ficam de fora
  #entidadesNaTela(ents) {
    const v = this.v, out = [];
    this.spritesOff ??= []; this.spritesOff.length = 0;
    for (const c of ents.children) {
      if (!c.visible) continue;
      let tem = this.temTela.get(c);
      if (tem === undefined || (v.t * 2 | 0) !== this.ultimo) { tem = this.#desenhoDeTela(c); this.temTela.set(c, tem); }
      out.push([c, c.x, c.y, c.scale.x, c.scale.y, true]);
      if (!tem) { c.visible = false; continue; }
      const s = v.escalaEm(c.x, c.y);
      const t = v.paraTela(c.x, c.y, 0);
      c.position.set(t.x, t.y); c.scale.set(c.scale.x * s, c.scale.y * s);
      this.#apagarSprites(c);
    }
    this.ultimo = v.t * 2 | 0;
    return out;
  }
  #apagarSprites(n) {
    if (n.renderPipeId === 'sprite' && n.renderable) { n.renderable = false; this.spritesOff.push(n); }
    for (const c of n.children ?? []) this.#apagarSprites(c);
  }
}
