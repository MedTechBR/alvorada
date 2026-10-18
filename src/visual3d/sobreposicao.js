import { RenderTexture, MeshPlane, Matrix } from 'pixi.js';
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
    // malha em grade: cada vértice vai para a projeção 3D do seu ponto no chão (com perspectiva e mundo curvo)
    this.N = 9; this.mRT = new Matrix(); this.mTela = new Matrix(); this.mClima = new Matrix();
    this.mesh = new MeshPlane({ texture: this.rt, verticesX: this.N, verticesY: this.N });
    app.stage.addChildAt(this.mesh, Math.max(0, app.stage.getChildIndex(g.world)));
    this.temTela = new WeakMap(); // filho de ents -> tem algo que não é sprite (barra, nome, balão)?
    // grupos de desenho: esconder/mostrar o chão e as entidades não obriga o Pixi a refazer a lista do palco inteiro
    g.world.isRenderGroup = true; g.ents.isRenderGroup = true; if (g.map.root) g.map.root.isRenderGroup = true;
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
    const pf = (this.pf ??= { rt: 0, tela: 0, n: 0 }), t0 = performance.now();
    // 1) mundo do 2D -> textura (sem chão, sem entidades): o grupo do mundo direto, com a transformação da textura
    const h = v.focoH ?? 0, p = v.pegada(h, 1.02);
    const ww = Math.max(1, p.x1 - p.x0), hh = Math.max(1, p.y1 - p.y0);
    const zoom = Math.max(1, g.zoom || 3);
    const k = Math.min(zoom * 1.1, this.max / ww, this.max / hh);
    const rw = Math.min(this.max, Math.ceil(ww * k)), rh = Math.min(this.max, Math.ceil(hh * k));
    if (Math.abs(this.rt.width - rw) > 32 || Math.abs(this.rt.height - rh) > 32 || this.rt.width < rw || this.rt.height < rh) this.rt.resize(rw + 16, rh + 16);
    const root = g.map.root, ents = g.ents, cl = g.mundo?.clima;
    // clima (chuva, neve, cinzas, areia, névoa): fica no ar em volta da câmera, então vai em espaço de tela
    // como no 2D, e não deitado no chão
    const climas = cl ? [cl.layer, cl.add].filter((c) => c?.visible) : [];
    const vr = root?.visible, ve = ents.visible;
    if (root) root.visible = false; ents.visible = false;
    for (const c of climas) c.visible = false;
    this.mRT.set(k, 0, 0, k, -p.x0 * k, -p.y0 * k);
    R.render({ container: W, target: this.rt, clear: true, clearColor: [0, 0, 0, 0], transform: this.mRT });
    if (root) root.visible = vr; ents.visible = ve;
    for (const c of climas) c.visible = true;
    // a grade: posição = projeção do ponto do chão; uv = a parte usada da textura
    const fu = (ww * k) / this.rt.width, fv = (hh * k) / this.rt.height, N = this.N;
    const geo = this.mesh.geometry, pb = geo.getBuffer('aPosition'), ub = geo.getBuffer('aUV'), P = pb.data, U = ub.data, tmp = (this.tmp ??= {});
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const kk = (j * N + i) * 2, fx = i / (N - 1), fy = j / (N - 1);
      const t = v.paraTelaPlano(p.x0 + ww * fx, p.y0 + hh * fy, h, tmp);
      P[kk] = t.x; P[kk + 1] = t.y; U[kk] = fx * fu; U[kk + 1] = fy * fv;
    }
    pb.update(); ub.update();
    const t1 = performance.now();
    // 2) tela: textura projetada + HUD do Pixi (o mundo fica de fora: ele já está na textura)
    const vw = W.visible; W.visible = false;
    const escTela = this.#esconderTela(stage);
    R.render({ container: stage });
    for (const c of escTela) c.visible = true;
    W.visible = vw;
    // clima com a câmera do 2D (as partículas estão em volta dela)
    if (climas.length) { this.mClima.set(W.scale.x, 0, 0, W.scale.y, W.x, W.y); for (const c of climas) R.render({ container: c, clear: false, transform: this.mClima }); }
    // 3) barras de PS, nomes, balões e marcas das entidades: cada uma no seu ponto projetado, sem os sprites
    this.#rotulos(R, ents);
    pf.rt += t1 - t0; pf.tela += performance.now() - t1; pf.n++;
  }
  #rotulos(R, ents) {
    const v = this.v, vw = v.view;
    // quem tem rótulo (barra, nome, balão, "!") é reavaliado 2x por segundo; no resto dos quadros só essa lista
    if ((v.t * 2 | 0) !== this.ultimo || !this.comRotulo) {
      this.ultimo = v.t * 2 | 0;
      this.comRotulo = ents.children.filter((c) => this.#desenhoDeTela(c));
    }
    for (const c of this.comRotulo) {
      if (c.destroyed || !c.parent || !c.visible || c.alpha <= 0.01) continue;
      if (!c.base3d && vw && (c.x < vw.x0 || c.x > vw.x1 || c.y < vw.y0 || c.y > vw.y1 + 64)) continue;
      if (c.base3d) { // marcas de dano do prédio (cenário vivo): em pé na frente do prédio
        const B = c.base3d, sb = v.escalaEm(B.x, B.y + 2), tb = v.paraTela(B.x, B.y + 2, 0), k = 0.85;
        this.mTela.set(sb * k, 0, 0, sb * k, tb.x - (B.w / 2) * sb * k, tb.y - B.h * sb * k);
        R.render({ container: c, clear: false, transform: this.mTela }); continue;
      }
      const s = v.escalaEm(c.x, c.y), t = v.paraTela(c.x, c.y, 0), r = c.rotation ?? 0;
      const sx = c.scale.x * s, sy = c.scale.y * s, co = Math.cos(r), si = Math.sin(r);
      this.mTela.set(sx * co, sx * si, -sy * si, sy * co, t.x, t.y);
      const off = []; this.#apagarSprites(c, off);
      R.render({ container: c, clear: false, transform: this.mTela });
      for (const [n, a] of off) n.alpha = a;
    }
  }
  // camadas que multiplicam a tela inteira (no 3D, cada uma tem a sua versão)
  #esconderTela(stage) {
    const out = [], g = this.g, life = g.mundo;
    for (const c of [life?.shade, life?.lights, life?.clima?.tint, life?.masmorra?.lm?.sprite, g.mount?.tintOver]) if (c && c.visible) { c.visible = false; out.push(c); }
    void stage;
    return out;
  }
  #apagarSprites(n, off) {
    if (n.renderPipeId === 'sprite' && n.alpha > 0) { off.push([n, n.alpha]); n.alpha = 0; }
    for (const c of n.children ?? []) this.#apagarSprites(c, off);
  }
}
