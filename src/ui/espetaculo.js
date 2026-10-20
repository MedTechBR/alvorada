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
// iPhone com Safari antigo (antes do 16) não tem roundRect: retângulo de cantos arredondados à mão
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); };
}

export class Espetaculo {
  constructor(g) {
    this.g = g;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const c = this.c = document.createElement('canvas'); c.id = 'show';
    const host = document.getElementById('hud') ?? document.body;
    host.insertBefore(c, host.firstChild);
    this.x = c.getContext('2d');
    this.textos = []; this.anuncios = { eu: null, ele: null }; this.faixaAt = null;
    this.sujo = true; this.t = 0;
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
  // (no 3D: a altura do chão é lida uma vez por texto e a projeção usa a matriz pronta da câmera, sem alocar)
  #tela(x, y, h = 0, o = null) {
    const v = this.g.v3d;
    if (v?.pv && o) { o.alt ??= v.altura(x, y); return v.paraTelaPlano(x, y, o.alt + h, (this.tmp ??= {})); }
    return this.g.worldToScreen ? this.g.worldToScreen(x, y, h) : { x, y };
  }

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
    this.#push({ x, y: t.y, h, oy: -24, s: String(dmg), cor, st: 'dmg', big, life: 0.9, k: 1 }); // acima da plaquinha do alvo
    const pal = this.#palavras(eff, crit);
    // as palavras ficam acima do número, em degraus fixos na tela (não encavalam com o número que pula)
    pal.forEach((p, i) => this.#push({ x: t.x, y: t.y, h, oy: -(big ? 46 : 43) - i * 13, s: p.s, cor: p.cor, st: 'banner', big: true, life: 0.95, k: 1 }));
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
    o.t = 0; o.vx = o.st === 'dmg' ? (Math.random() - 0.5) * 40 : 0; o.vy = o.st === 'dmg' ? -70 - (o.big ? 10 : 0) : o.st === 'banner' ? -10 : -30; o.dy = 0; o.dx = 0;
    this.textos.push(o);
  }

  // ---------- plaquinha de cada adversário (nome, nível e PS em cima dele) ----------
  // Todo selvagem que está brigando (ou já levou golpe) e os Pokémon de treinador: assim, numa luta com vários
  // selvagens, todos aparecem (a barra do topo é só para treinador, ginásio, lendário e reide: hud-batalha.js).
  #quemPlaca() {
    const g = this.g, out = (this.placasL ??= []); out.length = 0;
    if (g.ui?.state !== 'play') return out;
    const f = g.lead?.alive ? g.lead : g.player; if (!f) return out;
    for (const e of g.entities ?? []) {
      if (!e.mon || e.side === 'ally' || e.side === 'peer' || !e.alive || e.dead || e.alt?.mode === 'dig' || e.alt?.mode === 'dive' || !e.set) continue;
      if (!(e.hpShow > 0 || e.side === 'foe' || e.ai?.state === 'aggro' || e.mon.hp < e.mon.stats.hp)) continue;
      if (Math.hypot(e.x - f.x, e.y - f.y) > 18 * 16) continue;
      out.push(e);
    }
    return out;
  }
  #placa(x, e) {
    const E = this.esc, pl = (e.__pl ??= {});
    if (Math.abs((pl.x ?? 1e9) - e.x) > 4 || Math.abs((pl.y ?? 1e9) - e.y) > 4) { pl.alt = undefined; pl.x = e.x; pl.y = e.y; } // altura do chão relida quando o corpo anda
    const p = this.#tela(e.x, e.y, (e.topH ?? 20) * 0.85 + 7, pl);
    if (p.x < -60 || p.x > this.W + 60 || p.y < -30 || p.y > this.H + 30) return;
    const chave = `${e.mon.name}|${e.mon.level}|${e.isAlpha ? 1 : 0}|${E}`;
    if (e.__plK !== chave) { e.__plK = chave; e.__plIm = this.#bitmapPlaca(e, E); }
    const im = e.__plIm, w = im.width / this.dpr, h = im.height / this.dpr, x0 = Math.round(p.x - w / 2), y0 = Math.round(p.y - h);
    const k = Math.max(0, Math.min(1, e.mon.hp / e.mon.stats.hp));
    x.globalAlpha = Math.min(1, e.alpha ?? 1);
    x.drawImage(im, x0, y0, w, h);
    // barra de PS (por cima do bitmap, muda todo quadro)
    const bx = x0 + 4 * E, by = y0 + h - 6.5 * E, bw = w - 8 * E, bh = 3.5 * E;
    e.__plK2 = e.__plK2 == null ? k : e.__plK2 + (k - e.__plK2) * 0.12; // a parte clara escoa devagar
    x.fillStyle = '#0a0e20'; x.fillRect(bx, by, bw, bh);
    x.fillStyle = '#f4ecd2'; x.fillRect(bx, by, bw * Math.max(k, e.__plK2), bh);
    x.fillStyle = k > 0.5 ? '#3ccf6e' : k > 0.2 ? '#f2c335' : '#ee4b4b'; x.fillRect(bx, by, bw * k, bh);
    x.globalAlpha = 1;
  }
  #bitmapPlaca(e, E) {
    const c = document.createElement('canvas'), x = c.getContext('2d'), d = this.dpr;
    const fn = `900 ${(8.5 * E).toFixed(1)}px ${FONTE}`, fl = `900 ${(7 * E).toFixed(1)}px ${FONTE}`;
    x.font = fn; const wn = x.measureText(e.mon.name).width; x.font = fl; const lv = `Nv${e.mon.level}`, wl = x.measureText(lv).width;
    const w = Math.max(46 * E, wn + wl + 14 * E), h = 19 * E;
    c.width = Math.ceil(w * d); c.height = Math.ceil(h * d); x.setTransform(d, 0, 0, d, 0, 0);
    x.beginPath(); x.roundRect(0.5, 0.5, w - 1, h - 1, 5 * E); x.fillStyle = e.isAlpha ? 'rgba(70,10,14,.86)' : 'rgba(14,19,40,.82)'; x.fill();
    x.lineWidth = 1; x.strokeStyle = e.isAlpha ? '#ff6a5a' : 'rgba(244,236,210,.75)'; x.stroke();
    x.textBaseline = 'alphabetic'; x.font = fn; x.fillStyle = '#ffffff'; x.fillText(e.mon.name, 4 * E, 9.5 * E);
    x.font = fl; x.fillStyle = '#ffd23f'; x.textAlign = 'right'; x.fillText(lv, w - 4 * E, 9.5 * E);
    return c;
  }

  // ---------- anúncio do golpe (pílula do lado de quem usou) ----------
  anuncio(lado, nome, tipo) {
    if (!nome) return;
    this.anuncios[lado] = { s: nome + '!', cor: TYPE_COLOR[tipo] ?? '#8a8f9c', t: 0, life: 1.7 };
  }

  // ---------- faixas: "<X> DESMAIOU!", "MEGA <X>!" ----------
  faixa(texto, tipo = 'ko') {
    this.faixaAt = { s: texto, tipo, t: 0, life: 1.05 };
  }

  // ---------- golpe forte ----------
  // (O quadro de impacto em tela cheia, estilo mangá, saiu: o dono achou que atrapalhava. Fica só uma pausa curtinha
  // no acerto, até 60 ms, e o tremor de câmera que o combate já dá.)
  impacto(o) { const fx = this.g.fx; if (fx) fx.hitStop = Math.max(fx.hitStop, o.ko ? 0.06 : 0.045); return true; }

  // ---------- quadro ----------
  update(rdt, dt = rdt) {
    this.t += rdt;
    const placas = this.#quemPlaca();
    const vivo = placas.length || this.textos.length || this.anuncios.eu || this.anuncios.ele || this.faixaAt;
    if (!vivo) { if (this.sujo) { this.x.setTransform(1, 0, 0, 1, 0, 0); this.x.clearRect(0, 0, this.c.width, this.c.height); this.sujo = false; } return; }
    const x = this.x; this.sujo = true;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.c.width, this.c.height);
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.lineJoin = 'round'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (const e of placas) this.#placa(x, e);
    this.#textos(x, dt, true);
    for (const lado of ['eu', 'ele']) this.#anuncio(x, lado, rdt);
    if (this.faixaAt) this.#faixa(x, rdt);
  }
  #textos(x, dt, desenha) {
    const L = this.textos, E = this.esc;
    for (let i = L.length - 1; i >= 0; i--) {
      const o = L[i]; o.t += dt;
      if (o.t >= o.life) { L.splice(i, 1); continue; }
      o.dx += o.vx * dt; o.dy += o.vy * dt;
      if (o.st === 'dmg') { o.vy += 320 * dt; if (o.t > 0.3) { o.vy = Math.min(o.vy, 6); o.vx *= 0.88; } }
      else o.vy *= 1 - Math.min(1, dt * 3.5);
      if (!desenha) continue;
      const p = this.#tela(o.x, o.y, o.h, o);
      const pop = o.st === 'dmg' ? 1 + Math.max(0, 0.12 - o.t) / 0.12 * 0.35 : o.st === 'banner' ? 1 + Math.max(0, 0.1 - o.t) / 0.1 * 0.25 : 1;
      const a = Math.min(1, (o.life - o.t) / 0.25) * Math.min(1, o.t / 0.04 + 0.3);
      // cada texto é desenhado UMA vez num canvas pequeno (contorno e sombra custam caro no celular) e depois só copiado
      const im = o.im ??= this.#bitmap(o, (o.st === 'dmg' ? (o.big ? 19 : 15) : o.st === 'banner' ? 13 : 12) * (o.k ?? 1) * E * 1.35);
      const k = pop / 1.35, w = im.width / this.dpr * k, h = im.height / this.dpr * k;
      x.globalAlpha = a;
      x.drawImage(im, p.x + o.dx - w / 2, p.y + o.dy + (o.oy ?? 0) * E - h / 2, w, h);
    }
    x.globalAlpha = 1;
  }
  #bitmap(o, tam) {
    const c = document.createElement('canvas'), x = c.getContext('2d'), d = this.dpr;
    x.font = `italic 900 ${tam.toFixed(1)}px ${FONTE}`;
    const borda = o.st === 'info' ? 3.5 : 5.5, lw = borda * (tam / 22), w = x.measureText(o.s).width + lw * 2 + tam * 0.4, h = tam * 1.5 + lw * 2;
    c.width = Math.ceil(w * d); c.height = Math.ceil(h * d);
    x.setTransform(d, 0, 0, d, 0, 0); x.lineJoin = 'round'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.translate(w / 2, h / 2 - tam * 0.05);
    if (o.st === 'banner') x.transform(1, 0, -0.18, 1, 0, 0); // inclinadas, como no vídeo
    this.#letras(x, o.s, 0, 0, tam, o.cor, borda);
    return c;
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
    const E = this.esc, tam = 15 * E, topo = this.#topoHud(lado) + 6;
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
  // (sem a barra, luta com selvagens: abaixo do painel do seu Pokémon à esquerda e do minimapa/menu à direita)
  #topoHud(lado = null) {
    if ((this.tHud = (this.tHud ?? 0) - 1) <= 0) {
      this.tHud = 30;
      const cs = getComputedStyle(document.documentElement);
      this.sl = parseFloat(cs.getPropertyValue('--sl')) || 0; this.sr = parseFloat(cs.getPropertyValue('--sr')) || 0;
      const fundo = (sel) => { let b = 0; for (const s of sel) { const el = document.querySelector(s); if (!el || el.hidden || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue; const r = el.getBoundingClientRect(); if (r.height && getComputedStyle(el).visibility !== 'hidden') b = Math.max(b, r.bottom); } return b; };
      const bar = document.querySelector('#hb.on:not([hidden]) .topo')?.getBoundingClientRect();
      const st = 10 + (parseFloat(cs.getPropertyValue('--st')) || 0);
      this.hHud = bar?.height ? bar.bottom : Math.max(st, fundo(['#foe'])); // (o painel do treinador fica no meio, em cima)
      this.hEu = bar?.height ? bar.bottom : Math.max(st, fundo(['#lead', '#objective']));
      this.hEle = bar?.height ? bar.bottom : Math.max(st, fundo(['#minimapa', '#menu-btn']));
    }
    return lado === 'eu' ? this.hEu : lado === 'ele' ? this.hEle : this.hHud;
  }
  // faixa compacta: uma pílula escura no meio, logo abaixo da barra do topo (não cobre o campo), ~1 s
  #faixa(x, dt) {
    const o = this.faixaAt; o.t += dt; if (o.t >= o.life) { this.faixaAt = null; return; }
    const W = this.W, E = this.esc, mega = o.tipo === 'mega';
    const ent = easeOut(clamp(o.t / 0.12, 0, 1)), sai = clamp((o.life - o.t) / 0.2, 0, 1);
    const tam = 15 * E, topo = this.#topoHud() + 6 + (1 - ent) * -8;
    x.font = `italic 900 ${tam.toFixed(1)}px ${FONTE}`;
    const w = Math.min(W * 0.46, x.measureText(o.s).width + 34 * E), h = tam + 12 * E;
    x.globalAlpha = sai;
    x.save(); x.translate(W / 2 - w / 2, topo); x.transform(1, 0, -0.16, 1, 0, 0);
    x.beginPath(); x.roundRect(0, 0, w, h, h / 2); x.fillStyle = mega ? 'rgba(18,48,96,.92)' : 'rgba(16,14,30,.9)'; x.fill();
    x.lineWidth = 2; x.strokeStyle = mega ? '#7ad8ff' : '#ffd23f'; x.stroke();
    x.textAlign = 'center'; x.fillStyle = mega ? '#bff0ff' : '#ffd23f';
    let s = tam; const mw = w - 20 * E, tw = x.measureText(o.s).width; if (tw > mw) { s *= mw / tw; x.font = `italic 900 ${s.toFixed(1)}px ${FONTE}`; }
    x.fillText(o.s, w / 2, h / 2 + 0.5);
    x.restore(); x.globalAlpha = 1;
  }


}
