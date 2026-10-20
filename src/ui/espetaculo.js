import { TYPE_COLOR } from '../data/types.js';
import { IS_TOUCH } from '../engine/input.js';

// Espetáculo da luta (camada de TELA, por cima do jogo, sem pegar toque): o que deixa a batalha "acabada" como no vídeo
// de referência do dono (Pokémon Battlegrounds, RED vs GOLD):
// - textos que voam: dano grande com contorno (cor pela eficácia), "SUPER EFETIVO!", "POUCO EFETIVO", "NÃO AFETA",
//   "CRÍTICO!" e os avisos curtos do jogo (Errou!, Paralisado!, +XP…). Antes eram letras de pixel desenhadas no CHÃO
//   (no 3D a sobreposição deita tudo no plano do chão) e ficavam ilegíveis;
// - anúncio do golpe: uma pílula "Nome do golpe!" do lado de quem usou (seu lado à esquerda, o adversário à direita);
// - faixas enormes inclinadas: "<NOME> DESMAIOU!" e "MEGA <NOME>!";
// - quadro de impacto (estilo mangá): golpe forte, crítico, super efetivo, choque de golpes e todo nocaute cortam por
//   ~0,4 s para linhas de velocidade saindo do ponto do impacto, as silhuetas dos dois Pokémon (os sprites de verdade),
//   o dano e a eficácia. Sem onomatopeias (pedido do dono). Com pausa no impacto curta; no máximo um a cada 4 s, fora
//   os nocautes. Nunca segura o controle: a camada não recebe toque e o jogo continua por baixo.
// Tudo num canvas 2D só; quando não há nada para mostrar ele fica limpo e parado (custo zero).
const CSS = `
#show { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
`;
const FONTE = '"Avenir Next", "Nunito", ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
const COR_EF = { super: '#ffd23f', pouco: '#c9ced8', nada: '#aab0bc', crit: '#ff7a4a' };
const hex = (c) => (typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c);
const easeOut = (k) => 1 - (1 - k) * (1 - k);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Espetaculo {
  constructor(g) {
    this.g = g;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const c = this.c = document.createElement('canvas'); c.id = 'show';
    const host = document.getElementById('hud') ?? document.body;
    host.insertBefore(c, host.firstChild);
    this.x = c.getContext('2d');
    this.textos = []; this.anuncios = { eu: null, ele: null }; this.faixaAt = null; this.imp = null;
    this.sujo = true; this.ultImpacto = -1e9; this.t = 0;
    this.reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#tamanho(); addEventListener('resize', () => this.#tamanho());
  }
  #tamanho() {
    const d = Math.min(devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2);
    this.dpr = d; this.W = innerWidth; this.H = innerHeight;
    this.c.width = Math.round(this.W * d); this.c.height = Math.round(this.H * d); this.sujo = true;
    this.esc = clamp(Math.min(this.W, this.H * 1.9) / 900, 0.62, 1.25); // tamanho das letras (celular deitado ≈ 0,8)
  }
  // ponto da tela de um ponto do mundo (x, y no chão; h acima dele)
  #tela(x, y, h = 0) { return this.g.worldToScreen ? this.g.worldToScreen(x, y, h) : { x, y }; }

  // ---------- textos que voam ----------
  // texto genérico (fx.number cai aqui): estilo 'dmg' (número em arco), 'banner' (palavra grande) e 'info' (sobe)
  texto(x, y, text, color = '#ffffff', big = false, style = null) {
    const s = String(text), st = style ?? (/^[0-9]+$/.test(s) ? 'dmg' : 'info');
    this.#push({ x, y, h: 0, s, cor: hex(color), st, big, life: st === 'banner' ? 1.05 : st === 'dmg' ? 0.95 : 0.9 });
  }
  // dano num alvo: número com contorno, cor pela eficácia; acima dele "SUPER EFETIVO!" etc. e "CRÍTICO!"
  dano(t, dmg, { eff = 1, crit = false, forte = false } = {}) {
    const h = (t.topH ?? 20) * 0.85 + 6, x = t.x + (Math.random() - 0.5) * 8;
    const cor = eff > 1 ? '#ffc23a' : eff < 1 && eff > 0 ? '#c9ced8' : crit ? '#ff7a4a' : '#ffffff';
    const big = forte || crit || eff > 1;
    this.#push({ x, y: t.y, h, s: String(dmg), cor, st: 'dmg', big, life: 1.0, k: big ? 1.35 : 1 });
    const pal = this.#palavras(eff, crit);
    // as palavras ficam acima do número, em degraus fixos na tela (não encavalam com o número que pula)
    pal.forEach((p, i) => this.#push({ x: t.x, y: t.y, h, oy: -(big ? 34 : 28) - i * 19, s: p.s, cor: p.cor, st: 'banner', big: true, life: 1.1, k: 0.8 }));
  }
  #palavras(eff, crit) {
    const out = [];
    if (eff > 1) out.push({ s: 'SUPER EFETIVO!', cor: COR_EF.super });
    else if (eff === 0) out.push({ s: 'NÃO AFETA', cor: COR_EF.nada });
    else if (eff < 1) out.push({ s: 'POUCO EFETIVO', cor: COR_EF.pouco });
    if (crit) out.push({ s: 'CRÍTICO!', cor: COR_EF.crit });
    return out;
  }
  #push(o) {
    if (this.textos.length > 28) this.textos.shift();
    o.t = 0; o.vx = o.st === 'dmg' ? (Math.random() - 0.5) * 60 : 0; o.vy = o.st === 'dmg' ? -95 - (o.big ? 20 : 0) : o.st === 'banner' ? -12 : -34; o.dy = 0; o.dx = 0;
    this.textos.push(o);
  }

  // ---------- anúncio do golpe (pílula do lado de quem usou) ----------
  anuncio(lado, nome, tipo) {
    if (!nome) return;
    this.anuncios[lado] = { s: nome + '!', cor: TYPE_COLOR[tipo] ?? '#8a8f9c', t: 0, life: 1.7 };
  }

  // ---------- faixas: "<X> DESMAIOU!", "MEGA <X>!" ----------
  faixa(texto, tipo = 'ko') {
    this.faixaAt = { s: texto, tipo, t: 0, life: tipo === 'mega' ? 1.7 : 1.5 };
  }

  // ---------- quadro de impacto ----------
  // o: { a: atacante, b: alvo (entidades), x, y (ponto do impacto no chão), h, dano, eff, crit, ko, choque, tipo }
  impacto(o) {
    const agora = this.t * 1000; // relógio da camada (tempo de quadro de verdade, sem a pausa do menu)
    if (this.reduz || this.g.quality?.low && !o.ko) return false;
    if (!o.ko && agora - this.ultImpacto < 4000) return false;
    if (o.ko && this.imp && this.imp.t < this.imp.life * 0.5) return false; // um nocaute no meio de outro quadro: fica o que está
    this.ultImpacto = agora;
    const p = this.#tela(o.x, o.y, o.h ?? 10);
    const sil = (e) => (e ? this.#silhueta(e) : null);
    this.imp = { ...o, t: 0, life: o.ko ? 0.55 : 0.42, sx: clamp(p.x, this.W * 0.2, this.W * 0.8), sy: clamp(p.y, this.H * 0.3, this.H * 0.72),
      A: sil(o.a), B: sil(o.b), linhas: null, linT: 0, ladoA: o.a && o.b ? Math.sign((o.a.x - o.b.x) || 1) : -1,
      pal: o.choque ? [] : this.#palavras(o.eff ?? 1, !!o.crit), cor: TYPE_COLOR[o.tipo] ?? '#ffd23f' };
    const g = this.g; g.fx.hitStop = Math.max(g.fx.hitStop, o.ko ? 0.12 : 0.085);
    return true;
  }
  // silhueta (preta e branca) do quadro atual do sprite da entidade, recortada pela transparência
  #silhueta(e) {
    const T = e.body?.texture, src = T?.source?.resource, f = T?.frame;
    if (!src || !f || !f.width || !f.height) return null;
    const mk = (cor) => {
      const c = document.createElement('canvas'); c.width = f.width; c.height = f.height;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
      try { x.drawImage(src, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height); } catch { return null; }
      x.globalCompositeOperation = 'source-in'; x.fillStyle = cor; x.fillRect(0, 0, f.width, f.height);
      return c;
    };
    const ax = e.body.anchor?.x ?? 0.5, ay = e.body.anchor?.y ?? 0.5;
    return { preta: mk('#111018'), branca: mk('#fbf7ea'), w: f.width, h: f.height, ax, ay, top: (e.set?.top ?? f.height * 0.7) };
  }

  // ---------- quadro ----------
  update(rdt, dt = rdt) {
    this.t += rdt;
    const vivo = this.textos.length || this.anuncios.eu || this.anuncios.ele || this.faixaAt || this.imp;
    if (!vivo) { if (this.sujo) { this.x.setTransform(1, 0, 0, 1, 0, 0); this.x.clearRect(0, 0, this.c.width, this.c.height); this.sujo = false; } return; }
    const x = this.x; this.sujo = true;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.c.width, this.c.height);
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.lineJoin = 'round'; x.textAlign = 'center'; x.textBaseline = 'middle';
    // o quadro de impacto cobre a tela: por baixo dele não precisa desenhar textos do mundo
    const cheio = this.imp && this.imp.t < this.imp.life - 0.1;
    this.#textos(x, dt, !cheio);
    for (const lado of ['eu', 'ele']) this.#anuncio(x, lado, rdt);
    if (this.imp) this.#impacto(x, rdt);
    if (this.faixaAt) this.#faixa(x, rdt);
  }
  #textos(x, dt, desenha) {
    const L = this.textos, E = this.esc;
    for (let i = L.length - 1; i >= 0; i--) {
      const o = L[i]; o.t += dt;
      if (o.t >= o.life) { L.splice(i, 1); continue; }
      o.dx += o.vx * dt; o.dy += o.vy * dt;
      if (o.st === 'dmg') { o.vy += 420 * dt; if (o.t > 0.38) { o.vy = Math.min(o.vy, 8); o.vx *= 0.88; } }
      else o.vy *= 1 - Math.min(1, dt * 3.5);
      if (!desenha) continue;
      const p = this.#tela(o.x, o.y, o.h);
      const pop = o.st === 'dmg' ? 1 + Math.max(0, 0.14 - o.t) / 0.14 * 0.7 : o.st === 'banner' ? 1 + Math.max(0, 0.12 - o.t) / 0.12 * 0.5 : 1;
      const tam = (o.st === 'dmg' ? (o.big ? 30 : 22) : o.st === 'banner' ? 19 : 14) * (o.k ?? 1) * E * pop;
      const a = Math.min(1, (o.life - o.t) / 0.25) * Math.min(1, o.t / 0.04 + 0.3);
      x.globalAlpha = a;
      x.save(); x.translate(p.x + o.dx, p.y + o.dy + (o.oy ?? 0) * E);
      if (o.st === 'banner') x.transform(1, 0, -0.18, 1, 0, 0); // inclinadas, como no vídeo
      this.#letras(x, o.s, 0, 0, tam, o.cor, o.st === 'info' ? 3.5 : 5.5);
      x.restore();
    }
    x.globalAlpha = 1;
  }
  // letras grossas com contorno escuro e sombra embaixo
  #letras(x, s, px, py, tam, cor, borda = 5, sombra = true) {
    x.font = `italic 900 ${tam.toFixed(1)}px ${FONTE}`;
    x.lineWidth = borda * (tam / 22);
    if (sombra) { x.strokeStyle = 'rgba(10,12,28,.55)'; x.strokeText(s, px, py + tam * 0.1); }
    x.strokeStyle = '#151a30'; x.strokeText(s, px, py);
    x.fillStyle = cor; x.fillText(s, px, py);
  }
  #anuncio(x, lado, dt) {
    const o = this.anuncios[lado]; if (!o) return;
    o.t += dt; if (o.t >= o.life) { this.anuncios[lado] = null; return; }
    const E = this.esc, tam = 15 * E, topo = this.#topoHud() + 6;
    x.font = `italic 900 ${tam.toFixed(1)}px ${FONTE}`;
    const w = x.measureText(o.s).width + 30 * E, h = tam + 12 * E;
    const ent = easeOut(clamp(o.t / 0.14, 0, 1)), sai = clamp((o.life - o.t) / 0.2, 0, 1);
    const eu = lado === 'eu', margem = 10 + (eu ? this.sl : this.sr);
    const px = eu ? margem - (1 - ent) * (w + 20) : this.W - margem - w + (1 - ent) * (w + 20);
    x.globalAlpha = sai;
    x.save(); x.translate(px, topo);
    x.transform(1, 0, -0.16, 1, 0, 0);
    const r = h / 2;
    x.beginPath(); x.roundRect(0, 0, w, h, r); x.fillStyle = 'rgba(14,18,36,.35)'; x.fill();
    x.beginPath(); x.roundRect(0, -2, w, h, r); x.fillStyle = '#fbf7ea'; x.fill();
    x.lineWidth = 2.5; x.strokeStyle = '#151a30'; x.stroke();
    x.beginPath(); x.roundRect(eu ? 3 : w - 9 * E - 3, 2, 9 * E, h - 8, 4); x.fillStyle = o.cor; x.fill();
    x.textAlign = 'center'; x.fillStyle = '#151a30';
    x.fillText(o.s, w / 2 + (eu ? 4 : -4) * E, h / 2 - 1);
    x.restore(); x.globalAlpha = 1;
  }
  // altura da barra do topo (HUD de batalha), para os anúncios ficarem logo abaixo
  #topoHud() {
    if ((this.tHud = (this.tHud ?? 0) - 1) > 0) return this.hHud;
    this.tHud = 30;
    const cs = getComputedStyle(document.documentElement);
    this.sl = parseFloat(cs.getPropertyValue('--sl')) || 0; this.sr = parseFloat(cs.getPropertyValue('--sr')) || 0;
    const bar = document.querySelector('#hb:not([hidden]) .topo');
    const r = bar?.getBoundingClientRect();
    this.hHud = r && r.height ? r.bottom : 10 + (parseFloat(cs.getPropertyValue('--st')) || 0);
    return this.hHud;
  }
  #faixa(x, dt) {
    const o = this.faixaAt; o.t += dt; if (o.t >= o.life) { this.faixaAt = null; return; }
    const W = this.W, H = this.H, E = this.esc, mega = o.tipo === 'mega';
    const ent = easeOut(clamp(o.t / 0.16, 0, 1)), sai = clamp((o.life - o.t) / 0.25, 0, 1);
    const tam = Math.min(W * 0.085, 62 * E * 1.15), cy = H * (mega ? 0.36 : 0.42);
    x.globalAlpha = sai;
    // faixa escura inclinada atrás das letras
    x.save(); x.translate(W / 2 + (1 - ent) * -W, cy); x.rotate(-0.06);
    x.fillStyle = mega ? 'rgba(20,40,90,.55)' : 'rgba(18,14,30,.55)';
    x.fillRect(-W, -tam * 0.72, W * 2, tam * 1.44);
    x.fillStyle = mega ? '#7ad8ff' : '#ffd23f'; x.fillRect(-W, -tam * 0.72, W * 2, 3); x.fillRect(-W, tam * 0.72 - 3, W * 2, 3);
    x.restore();
    x.save(); x.translate(W / 2 + (1 - ent) * W * 0.6, cy); x.rotate(-0.06); x.transform(1, 0, -0.22, 1, 0, 0);
    const punch = 1 + Math.max(0, 0.1 - Math.abs(o.t - 0.16)) * 2.5;
    x.scale(punch, punch);
    let s = tam; x.font = `italic 900 ${s}px ${FONTE}`;
    const mw = W * 0.92; const w = x.measureText(o.s).width; if (w > mw) s *= mw / w;
    this.#letras(x, o.s, 0, 0, s, mega ? '#9fe6ff' : '#ffd23f', 7);
    x.restore(); x.globalAlpha = 1;
  }

  // quadro de impacto: fundo, linhas de velocidade saindo do ponto, silhuetas grandes, dano e eficácia
  #impacto(x, dt) {
    const o = this.imp; o.t += dt;
    if (o.t >= o.life) { this.imp = null; return; }
    const W = this.W, H = this.H, k = o.t / o.life;
    const escuro = o.t < 0.1;                        // primeiro o negativo (fundo preto, linhas brancas), depois o claro
    const a = clamp((o.life - o.t) / 0.1, 0, 1) * clamp(o.t / 0.025, 0, 1);
    const fundo = escuro ? '#0d0c14' : '#f6f0df', tinta = escuro ? '#f6f0df' : '#0d0c14';
    x.globalAlpha = a;
    // tremor curto no começo
    const tr = Math.max(0, 0.12 - o.t) * 60, ox = (Math.random() - 0.5) * tr, oy = (Math.random() - 0.5) * tr;
    x.save(); x.translate(ox, oy);
    x.fillStyle = fundo; x.fillRect(-20, -20, W + 40, H + 40);
    // linhas: cunhas finas, refeitas a cada ~33 ms (tremulam como no mangá)
    if (!o.linhas || (o.linT -= dt) <= 0) {
      o.linT = 0.033; const n = 64, L = [];
      for (let i = 0; i < n; i++) { const ang = (i + Math.random() * 0.8) / n * Math.PI * 2; L.push([ang, 0.006 + Math.random() * 0.03, 0.16 + Math.random() * 0.22]); }
      o.linhas = L;
    }
    const R = Math.hypot(W, H), cx = o.sx, cy = o.sy, r0 = Math.min(W, H);
    x.fillStyle = tinta; x.beginPath();
    for (const [ang, lw, ri] of o.linhas) {
      const r1 = r0 * ri * (1.15 - k * 0.3);
      x.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      x.lineTo(cx + Math.cos(ang - lw) * R, cy + Math.sin(ang - lw) * R);
      x.lineTo(cx + Math.cos(ang + lw) * R, cy + Math.sin(ang + lw) * R);
      x.closePath();
    }
    x.fill();
    // brilho do tipo no centro
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r0 * 0.22);
    gr.addColorStop(0, o.cor + 'cc'); gr.addColorStop(1, o.cor + '00');
    x.fillStyle = gr; x.fillRect(cx - r0 * 0.3, cy - r0 * 0.3, r0 * 0.6, r0 * 0.6);
    // silhuetas: o alvo grande no ponto do impacto, o atacante do lado de onde veio (meio cortado pela borda)
    const zoom = 1.12 - easeOut(Math.min(1, o.t / 0.18)) * 0.12;
    const alto = H * 0.5 * zoom;
    const desenha = (S, px, py, alt, flip) => {
      if (!S) return; const img = escuro ? S.branca : S.preta; if (!img) return;
      const sc = alt / Math.max(8, S.top), w = S.w * sc, h = S.h * sc;
      x.save(); x.translate(px, py); if (flip) x.scale(-1, 1); x.imageSmoothingEnabled = false;
      x.drawImage(img, -S.ax * w, -S.ay * h, w, h); x.restore();
    };
    const lado = o.ladoA;
    if (o.A) desenha(o.A, cx + lado * W * 0.3, cy + alto * 0.62, alto * 0.95, false);
    if (o.B) desenha(o.B, cx - lado * W * 0.04, cy + alto * 0.5, alto, false);
    x.restore();
    // dano e eficácia (sem onomatopeias)
    const E = this.esc;
    let ty = clamp(cy - alto * 0.55, this.#topoHud() + 70 * E, H * 0.5);
    if (o.dano) {
      const s = 58 * E * (1 + Math.max(0, 0.1 - o.t) * 4);
      x.save(); x.translate(cx - lado * W * 0.08, ty); x.transform(1, 0, -0.2, 1, 0, 0);
      this.#letras(x, String(o.dano), 0, 0, s, o.ko ? '#ff6a4a' : o.eff > 1 ? '#ffc23a' : '#ffffff', 7);
      x.restore(); ty -= s * 0.8;
    }
    o.pal.forEach((p, i) => {
      const s = 26 * E;
      x.save(); x.translate(cx - lado * W * 0.08, ty - i * s * 1.1); x.transform(1, 0, -0.2, 1, 0, 0);
      this.#letras(x, p.s, 0, 0, s, p.cor, 6); x.restore();
    });
    x.globalAlpha = 1;
  }
}
