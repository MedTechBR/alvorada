import * as PIXI from 'pixi.js';
import { T, TILE } from '../world/tiles.js';
import { Mon } from '../data/mon.js';
import { PokeEntity } from '../entities/pokemon.js';

// Peças das arenas dos ginásios (motor em src/combat/arena-ginasio.js, dados em src/data/arenas.js, docs/arenas.md).
// Cada peça é configurada por um objeto de dados { tipo, id?, ativo?, ...parâmetros } e pode responder a ganchos:
//   iniciar() · update(dt) (só fora das cenas) · sempre(dt) (sempre) · desenhar(G0, G1) · fim()
//   bloqueia(x, y, mv, proj) → true segura o projétil · impacto(x, y, mv, P) · pisoteio(x, y, mv, quem) · varrer(rect)
//   velocidade(e) → multiplicador · molhado(x, y) · perigoEm(x, y, e) → 0..1 · objetivo(e) → { x, y, peso, ... }
//   modDano(user, alvo, mv) → multiplicador · aoUsar(user, id, mv) · luzes(add) · lider(alvo) → true se agiu
//   acionar(acao, quem) (alavancas) · ajustar(params) e evento(fase) (fases) · torcer(k, grito) (plateia) · estado()
// Coordenadas dos dados: blocos relativos à sala (ou ao mapa, se a arena for ao ar livre).
// Regra: todo dano de perigo passa por A.avisar() antes (ou é terreno visível o tempo todo, anunciado pela fase).

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const per = (A, p) => (Array.isArray(p) ? rnd(p[0], p[1]) : p) * A.K.ritmo;
const key = (x, y) => x + ',' + y;
const CORTA_EN = new Set(['Cut', 'Slash', 'Fury Cutter', 'X-Scissor', 'Leaf Blade', 'Air Slash', 'Razor Leaf', 'Air Cutter', 'Night Slash', 'Psycho Cut', 'Aerial Ace', 'Scratch', 'Fury Swipes', 'Metal Claw', 'Shadow Claw', 'Dragon Claw', 'Crush Claw', 'Sacred Sword', 'False Swipe', 'Bug Bite', 'Wing Attack']);
const corta = (mv) => !!mv && (mv.flags?.includes('slicing') || CORTA_EN.has(mv.en) || (mv.cat === 'phys' && ['bug', 'grass', 'steel', 'flying', 'dark'].includes(mv.type)));
const forte = (mv, P = 1) => (mv?.power ?? 40) >= 60 || P > 1.2;
function celulas(A, spec) { // [[x,y], [x,y,w,h], …] relativos → [[tx,ty]] absolutos
  const out = [];
  for (const c of spec ?? []) {
    if (c.length === 4) { for (let y = c[1]; y < c[1] + c[3]; y++) for (let x = c[0]; x < c[0] + c[2]; x++) out.push(A.abs(x, y)); }
    else out.push(A.abs(c[0], c[1]));
  }
  return out;
}
function tilesDaArena(A, fn) { const R = A.R, out = []; for (let ty = R.y0 / T; ty < R.y1 / T; ty++) for (let tx = R.x0 / T; tx < R.x1 / T; tx++) if (fn(tx, ty)) out.push([tx, ty]); return out; }
const ocupado = (A, x, y, r = 12) => A.g.entities.some((e) => e.alive && Math.hypot(e.x - x, e.y - y) < r + e.r) || Math.hypot(A.g.player.x - x, A.g.player.y - y) < r + 4 || (A.b.npc && Math.hypot(A.b.npc.x - x, A.b.npc.y - y) < r + 4);

class Peca {
  constructor(A, def) { this.A = A; this.def = def; }
  get g() { return this.A.g; }
  ajustar(p) { Object.assign(this.def, p); }
  estado() { return {}; }
}

// ======================================================================= plateia (torcida)
class Plateia extends Peca {
  iniciar() {
    const A = this.A, d = this.def;
    this.exc = 0.3; this.gritoT = 0;
    const PELES = [0xf2c9a0, 0xd9a273, 0xa8744a, 0x7a4e2e, 0xf6d7b8];
    const CORES = d.cores ?? [0xe5383b, 0x3a7ae8, 0xf2c03a, 0x4cb050, 0xe87a3a, 0x9a5ae8, 0xffffff];
    this.grupos = (d.lugares ?? []).map((L) => {
      const r = A.rectPx(L), n = Math.max(2, Math.round((r.x1 - r.x0) / 11)), linhas = Math.max(1, Math.round((r.y1 - r.y0) / 14));
      const gente = [];
      for (let j = 0; j < linhas; j++) for (let i = 0; i < n; i++) gente.push({ x: r.x0 + 6 + (i + (j % 2) * 0.5) * ((r.x1 - r.x0 - 12) / Math.max(1, n - 0.5)), y: r.y0 + 12 + j * 12, pele: pick(PELES), cor: pick(CORES), ph: Math.random() * TAU, salto: 0, vz: 0 });
      return { r, gente, G: A.gfx(r.y1 - 2) };
    });
  }
  torcer(k, grito) {
    this.exc = Math.min(2.2, this.exc + k);
    if (!grito || this.gritoT > 0) return;
    this.gritoT = 0.9;
    const frases = this.def.frases ?? ['Uau!', 'Isso!', 'Vai!', 'Olha isso!'];
    const gr = pick(this.grupos); if (!gr) return;
    const p = pick(gr.gente);
    this.g.fx.number(p.x, p.y - 18, pick(frases), pick([0xffe27a, 0xffffff, 0x9ad0ff, 0xffb0c0]));
    this.g.audio?.sfx?.('crowd');
  }
  sempre(dt) {
    this.exc = Math.max(0.25, this.exc - dt * 0.35); this.gritoT -= dt;
    const t = this.g.time, estilo = this.def.estilo ?? 'gente';
    for (const gr of this.grupos) {
      const G = gr.G; G.clear();
      for (const p of gr.gente) {
        if (p.salto <= 0 && Math.random() < dt * this.exc * 1.6) p.vz = 40 + Math.random() * 30 * this.exc;
        p.salto = Math.max(0, p.salto + p.vz * dt); p.vz -= 260 * dt; if (p.salto === 0) p.vz = Math.max(0, p.vz);
        const x = p.x, y = p.y - p.salto - (estilo === 'fantasma' ? 3 + Math.sin(t * 2 + p.ph) * 2 : 0), up = p.salto > 2;
        if (estilo === 'fantasma') {
          G.ellipse(x, y - 7, 4, 5).fill({ color: 0xf2eeff, alpha: 0.7 }).poly([x - 4, y - 7, x - 4, y, x - 2, y - 2, x, y, x + 2, y - 2, x + 4, y, x + 4, y - 7]).fill({ color: 0xf2eeff, alpha: 0.7 });
          G.circle(x - 1.5, y - 8, 0.8).circle(x + 1.5, y - 8, 0.8).fill({ color: 0x2a1a4a, alpha: 0.9 });
        } else if (estilo === 'inseto') {
          G.ellipse(x, y - 4, 4, 3).fill(p.cor).circle(x + 3, y - 6, 2).fill(0x3a3a2a);
          G.moveTo(x + 3, y - 8).lineTo(x + 5, y - 11).moveTo(x + 4, y - 7).lineTo(x + 7, y - 9).stroke({ width: 0.8, color: 0x2a2a1a });
        } else {
          G.rect(x - 3, y - 9, 6, 7).fill(p.cor).circle(x, y - 11, 2.6).fill(p.pele);
          if (up) G.moveTo(x - 3, y - 8).lineTo(x - 5, y - 13).moveTo(x + 3, y - 8).lineTo(x + 5, y - 13).stroke({ width: 1.2, color: p.pele });
          if (estilo === 'marujo') G.rect(x - 3, y - 14, 6, 1.6).fill(0xffffff);
        }
      }
    }
  }
}

// ======================================================================= milho (Tomé): muro que o golpe e o atropelo derrubam
class Milho extends Peca {
  iniciar() { this.cel = new Set(); for (const [x, y] of celulas(this.A, this.def.celulas)) this.plantar(x, y); }
  plantar(tx, ty) {
    const A = this.A; if (ocupado(A, tx * T + 8, ty * T + 8, 10)) return false;
    A.trocaTile(tx, ty, TILE.CORN); this.cel.add(key(tx, ty)); return true;
  }
  cortar(tx, ty, fogo = false) {
    const A = this.A, k = key(tx, ty); if (!this.cel.has(k)) return false;
    this.cel.delete(k);
    const orig = A.tileOriginal(tx, ty); A.trocaTile(tx, ty, orig === TILE.CORN ? TILE.GRASS2 : orig);
    const fx = this.g.fx, x = tx * T + 8, y = ty * T + 8;
    fx.emit(x, y - 4, { tex: 'clip', n: 10, speed: 70, life: 0.8, grav: 300, vz: 90, add: false, spin: 10, color: 0xd8c060 });
    fx.emit(x, y - 6, { tex: 'leaf2', n: 4, speed: 40, life: 0.9, grav: 140, vz: 60, add: false, spin: 8 });
    if (fogo) { fx.decal('scorch', x, y, { scale: 0.7, alpha: 0.5, life: 30 }); fx.emit(x, y - 4, { frames: 'flame', n: 4, speed: 10, life: 0.5, vz: 30, add: false }); }
    else fx.decal('stump', x, y, { scale: 0.8, life: 30, tint: 0xd8c060, flip: false });
    this.g.combat?.sfx('rustle', null, 0.08);
    return true;
  }
  #em(x, y) { const tx = Math.floor(x / T), ty = Math.floor(y / T); return this.cel.has(key(tx, ty)) ? [tx, ty] : null; }
  bloqueia(x, y, mv) {
    const c = this.#em(x, y); if (!c) return false;
    if (mv?.type === 'fire') this.cortar(...c, true);
    else if (forte(mv) || corta(mv) || Math.random() < 0.3) this.cortar(...c);
    return true; // o milho segura o golpe (é cobertura)
  }
  impacto(x, y, mv, P) { const c = this.#em(x, y); if (c && (mv?.type === 'fire' || forte(mv, P) || corta(mv))) this.cortar(...c, mv?.type === 'fire'); }
  pisoteio(x, y) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const tx = Math.floor(x / T) + i, ty = Math.floor(y / T) + j; if (Math.hypot(tx * T + 8 - x, ty * T + 8 - y) < 14) this.cortar(tx, ty); } }
  varrer(r) { for (const k of [...this.cel]) { const [tx, ty] = k.split(',').map(Number), x = tx * T + 8, y = ty * T + 8; if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) this.cortar(tx, ty); } }
  update(dt) {
    // atropelo: quem anda contra o milho por meio segundo derruba o pé
    for (const e of this.A.lutadores()) {
      const sp = Math.hypot(e.vx, e.vy); if (sp < 15 || this.A.voando(e)) { e.milhoT = 0; continue; }
      const px = e.x + e.vx / sp * (e.r + 5), py = e.y + e.vy / sp * (e.r + 5), c = this.#em(px, py);
      if (!c) { e.milhoT = 0; continue; }
      e.milhoT = (e.milhoT ?? 0) + dt;
      if (e.milhoT > 0.45) { e.milhoT = 0; this.cortar(...c); if (Math.random() < 0.4) this.g.fx.number(e.x, e.y - 30, 'Atropelou o milho!', 0xe8d070); }
    }
  }
  // líder: "Planta de novo!": brotos (aviso verde, sem dano) e o milho volta perto do seu Pokémon
  lider(alvo) {
    const A = this.A, cx = Math.floor(alvo.x / T), cy = Math.floor(alvo.y / T), cells = [];
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const tx = cx + i, ty = cy + j, x = tx * T + 8, y = ty * T + 8;
      if (Math.abs(i) + Math.abs(j) < 2 || !A.dentro(x, y, -T) || this.cel.has(key(tx, ty)) || A.g.map.solidAt(x, y) || Math.random() < 0.55) continue;
      cells.push([tx, ty]);
    }
    if (cells.length < 2) return false;
    A.avisar({ forma: 'celulas', cells, t: 1.3, cor: 0x7ad84a, dano: false, rotulo: 'Brotou!', corTexto: 0x9aff8a, fonte: this, depois: () => { for (const [x, y] of cells) this.plantar(x, y); this.g.combat?.sfx('rustle'); } });
    return true;
  }
  // o Pokémon do líder, machucado, se esconde atrás do milho
  objetivo(e) {
    if (!this.A.doLider(e) || e.mon.hp / e.mon.stats.hp > 0.5 || !this.cel.size) return null;
    const L = this.A.lead; if (!L) return null;
    let best = null, bd = 1e9;
    for (const k of this.cel) {
      const [tx, ty] = k.split(',').map(Number), x = tx * T + 8, y = ty * T + 8, dx = x - L.x, dy = y - L.y, d = Math.hypot(dx, dy) || 1;
      const hx = x + dx / d * 16, hy = y + dy / d * 16;
      if (!this.A.livre(hx, hy, 4)) continue;
      const s = Math.hypot(hx - e.x, hy - e.y); if (s < bd) { bd = s; best = { x: hx, y: hy, peso: 0.45, raio: 8, ficar: true }; }
    }
    return best;
  }
  estado() { return { celulas: [...this.cel].map((k) => k.split(',').map(Number)) }; }
}

// ======================================================================= faixa: máquina que varre uma faixa (debulhadora, onda, vagonete, rajada)
class Faixa extends Peca {
  iniciar() { this.tm = per(this.A, this.def.primeiro ?? this.def.periodo ?? [8, 12]); this.maq = []; this.lado = 0; }
  disparar(alvo) {
    const A = this.A, d = this.def, R = A.R, h = (d.orient ?? 'h') === 'h', L = d.largura ?? 2;
    let i0;
    if (d.faixas) { // trilhos fixos: o mais perto do alvo
      const at = h ? Math.floor(alvo.y / T) - A.o.y : Math.floor(alvo.x / T) - A.o.x;
      i0 = d.faixas.reduce((b, f) => (Math.abs(f - at) < Math.abs(b - at) ? f : b), d.faixas[0]) + (h ? A.o.y : A.o.x);
    } else {
      i0 = (h ? Math.floor(alvo.y / T) : Math.floor(alvo.x / T)) - Math.floor(L / 2) + (Math.random() < 0.5 ? 0 : (L > 1 ? 0 : 0));
      i0 = Math.max((h ? R.y0 : R.x0) / T, Math.min((h ? R.y1 : R.x1) / T - L, i0));
    }
    const dir = d.dir ?? (Math.random() < 0.5 ? 1 : -1);
    const r = h ? { x0: R.x0, x1: R.x1, y0: i0 * T, y1: (i0 + L) * T } : { x0: i0 * T, x1: (i0 + L) * T, y0: R.y0, y1: R.y1 };
    A.avisar({ forma: 'faixa', ...r, dir: h ? [dir, 0] : [0, dir], t: d.aviso ?? 1.4, cor: d.cor ?? 0xff7a2a, rotulo: d.rotulo, fonte: this, chao: d.chao !== false,
      depois: (av) => { this.maq.push({ ...r, h, dir, pos: h ? (dir > 0 ? R.x0 - 14 : R.x1 + 14) : (dir > 0 ? R.y0 - 14 : R.y1 + 14), hit: new Set(), av, t: 0 }); this.g.audio?.sfx?.(d.som ?? 'whoosh'); } });
  }
  update(dt) {
    const A = this.A, d = this.def, R = A.R;
    if ((this.tm -= dt) <= 0) {
      this.tm = per(A, d.periodo ?? [8, 12]);
      const ls = A.lutadores(); this.lado ^= 1;
      const alvo = ls.find((e) => (e.side === 'foe') === !!this.lado) ?? ls[0] ?? { x: R.cx, y: R.cy };
      if (!this.maq.length || d.multiplas) this.disparar(alvo);
    }
    const v = (d.vel ?? 6) * T;
    for (const m of this.maq) {
      m.t += dt; m.pos += m.dir * v * dt;
      const a0 = m.pos - 12, a1 = m.pos + 12;
      const span = m.h ? { x0: a0, x1: a1, y0: m.y0, y1: m.y1 } : { x0: m.x0, x1: m.x1, y0: a0, y1: a1 };
      if (d.corta !== false) for (const pc of A.pecas) if (pc !== this) pc.varrer?.(span);
      for (const e of A.lutadores()) {
        if (m.hit.has(e) || (d.chao !== false && A.voando(e))) continue;
        const along = m.h ? e.x : e.y, lat = m.h ? e.y : e.x, l0 = m.h ? m.y0 : m.x0, l1 = m.h ? m.y1 : m.x1;
        if (lat < l0 - e.r * 0.5 || lat > l1 + e.r * 0.5 || Math.abs(along - m.pos) > 12 + e.r) continue;
        m.hit.add(e);
        const side = Math.sign(lat - (l0 + l1) / 2) || 1;
        const dx = m.h ? m.dir : side * 0.7, dy = m.h ? side * 0.7 : m.dir;
        if ((d.dano ?? 0.09) > 0) A.ferir(e, d.dano ?? 0.09, { dx, dy, knock: d.knock ?? 1.5, aviso: m.av, fonte: this, tipo: d.tipoDano ?? 'normal', forca: 70 });
        if (d.empurra) { e.kx += dx * d.empurra; e.ky += dy * d.empurra; e.react?.({ power: 1.2, quiet: true, dx, dy }); }
      }
      if (Math.random() < dt * 25) this.g.fx.emit(m.h ? m.pos : (m.x0 + m.x1) / 2 + rnd(-8, 8), m.h ? rnd(m.y0, m.y1) : m.pos, d.visual === 'onda' ? { tex: 'bubble', n: 2, speed: 40, life: 0.5, add: false, vz: 40 } : d.visual === 'rajada' ? { tex: 'dust', n: 1, speed: 80, dir: m.h ? (m.dir > 0 ? 0 : Math.PI) : (m.dir > 0 ? Math.PI / 2 : -Math.PI / 2), spread: 0.2, life: 0.4, scale: 0.6, alpha: 0.5, add: false } : { tex: 'clip', n: 2, speed: 60, life: 0.6, grav: 300, vz: 70, add: false, color: 0xd8c060 });
    }
    this.maq = this.maq.filter((m) => (m.h ? m.pos > R.x0 - 40 && m.pos < R.x1 + 40 : m.pos > R.y0 - 40 && m.pos < R.y1 + 40));
  }
  lider(alvo) { if (this.maq.length || this.A.avisos.some((a) => a.fonte === this)) return false; this.disparar(alvo); this.tm = per(this.A, this.def.periodo ?? [8, 12]); return true; }
  perigoEm(x, y, e) {
    for (const m of this.maq) {
      const lat = m.h ? y : x, along = m.h ? x : y, l0 = m.h ? m.y0 : m.x0, l1 = m.h ? m.y1 : m.x1;
      if (lat > l0 - 4 && lat < l1 + 4 && (along - m.pos) * m.dir > -14 && !(e && this.A.voando(e) && this.def.chao !== false)) return 1;
    }
    return 0;
  }
  desenhar(G0, G1) {
    const d = this.def, t = this.g.time;
    if (d.trilhos) for (const f of d.faixas ?? []) { // trilhos sempre à vista: dá para saber por onde o vagonete passa
      const R = this.A.R, h = (d.orient ?? 'h') === 'h', a = (f + (h ? this.A.o.y : this.A.o.x)) * T, L = (d.largura ?? 1) * T;
      if (h) { G0.rect(R.x0, a + L * 0.3, R.x1 - R.x0, 1.5).rect(R.x0, a + L * 0.7, R.x1 - R.x0, 1.5).fill({ color: 0x6a6a72, alpha: 0.9 }); for (let x = R.x0; x < R.x1; x += 6) G0.rect(x, a + L * 0.22, 2, L * 0.56).fill({ color: 0x5a3a22, alpha: 0.8 }); }
      else { G0.rect(a + L * 0.3, R.y0, 1.5, R.y1 - R.y0).rect(a + L * 0.7, R.y0, 1.5, R.y1 - R.y0).fill({ color: 0x6a6a72, alpha: 0.9 }); for (let y = R.y0; y < R.y1; y += 6) G0.rect(a + L * 0.22, y, L * 0.56, 2).fill({ color: 0x5a3a22, alpha: 0.8 }); }
    }
    for (const m of this.maq) {
      // a faixa continua marcada enquanto a máquina passa
      G0.rect(m.x0, m.y0, m.x1 - m.x0, m.y1 - m.y0).fill({ color: d.cor ?? 0xff7a2a, alpha: 0.1 });
      const cx = m.h ? m.pos : (m.x0 + m.x1) / 2, cy = m.h ? (m.y0 + m.y1) / 2 : m.pos, W = m.h ? 22 : m.x1 - m.x0, H = m.h ? m.y1 - m.y0 : 22;
      const vis = d.visual ?? 'debulhadora';
      if (vis === 'onda') {
        for (let i = 0; i < 3; i++) G1.ellipse(cx - m.dir * i * 5 * (m.h ? 1 : 0), cy - m.dir * i * 5 * (m.h ? 0 : 1), W / 2 - i, H / 2 - i).stroke({ width: 2, color: i ? 0x9ad8ff : 0xffffff, alpha: 0.8 - i * 0.2 });
        G1.ellipse(cx, cy, W / 2 - 2, H / 2 - 2).fill({ color: 0x3a8ad8, alpha: 0.5 });
      } else if (vis === 'rajada') {
        for (let i = 0; i < 7; i++) { const o = ((t * 7 + i * 0.37) % 1) * 28 - 14, q = (i / 6 - 0.5) * (m.h ? H : W); if (m.h) G1.moveTo(cx + o - 10, cy + q).lineTo(cx + o + 10, cy + q); else G1.moveTo(cx + q, cy + o - 10).lineTo(cx + q, cy + o + 10); }
        G1.stroke({ width: 1.5, color: 0xffffff, alpha: 0.7 });
      } else if (vis === 'vagonete') {
        G1.rect(cx - W / 2 + 2, cy - H / 2 + 1, W - 4, H - 4).fill(0x6a5a4a).stroke({ width: 1, color: 0x2a2018 });
        G1.rect(cx - W / 2 + 4, cy - H / 2 - 2, W - 8, 5).fill(0x8a8a92);
        for (const s of [-1, 1]) G1.circle(cx + s * (W / 2 - 4), cy + H / 2 - 2, 2.5).fill(0x2a2a2a);
      } else { // debulhadora / colheitadeira: corpo vermelho e molinete dourado girando
        G1.rect(cx - W / 2, cy - H / 2, W, H).fill(0xc8382a).stroke({ width: 1, color: 0x5a1410 });
        const reel = m.h ? cx + m.dir * (W / 2 + 3) : cx, reelY = m.h ? cy : cy + m.dir * (H / 2 + 3);
        if (m.h) { G1.rect(reel - 2, cy - H / 2 + 1, 4, H - 2).fill(0xe8c050); for (let i = 0; i < 4; i++) { const yy = cy - H / 2 + ((i / 4 + t * 3) % 1) * H; G1.moveTo(reel - 4, yy).lineTo(reel + 4, yy); } }
        else { G1.rect(cx - W / 2 + 1, reelY - 2, W - 2, 4).fill(0xe8c050); for (let i = 0; i < 4; i++) { const xx = cx - W / 2 + ((i / 4 + t * 3) % 1) * W; G1.moveTo(xx, reelY - 4).lineTo(xx, reelY + 4); } }
        G1.stroke({ width: 1.2, color: 0x8a6a20 });
        G1.rect(cx - 4, cy - 5, 8, 6).fill(0x9ad0ff);
      }
    }
  }
  estado() { return { maquinas: this.maq.map((m) => ({ pos: m.pos, horizontal: m.h, dir: m.dir, faixa: [m.x0, m.y0, m.x1, m.y1] })) }; }
}

// ======================================================================= marcas: algo cai do alto onde a marca aparece (raio, pedra)
class Marcas extends Peca {
  iniciar() { this.tm = per(this.A, this.def.primeiro ?? this.def.periodo ?? [3, 5]); this.lado = 0; this.caindo = []; }
  ponto(alvo) {
    let p = alvo ? { x: alvo.x, y: alvo.y } : this.A.aleatorio(14);
    const rod = this.A.pecas.find((q) => q.ativo && q.atrai)?.atrai(p.x, p.y);
    if (rod) p = { x: rod.x, y: rod.y, rod };
    return p;
  }
  disparar(alvo = null) {
    const A = this.A, d = this.def, p = this.ponto(alvo), r = (d.raio ?? 1.2) * T;
    const av = A.avisar({ forma: 'circulo', x: p.x, y: p.y, r, t: d.aviso ?? 1.2, cor: d.cor ?? 0xffe23a, fonte: this, chao: false, depois: (a) => this.golpe(p, r, a) });
    if (d.visual === 'pedra') this.caindo.push({ av, x: p.x, y: p.y });
  }
  golpe(p, r, av) {
    const A = this.A, d = this.def, fx = this.g.fx;
    this.caindo = this.caindo.filter((c) => c.av !== av);
    if (d.visual === 'pedra') {
      fx.emit(p.x, p.y - 4, { tex: 'rock1', n: 6, speed: 70, life: 0.8, grav: 400, vz: 110, add: false, spin: 12, bounce: 0.3 });
      fx.emit(p.x, p.y - 2, { tex: 'dust', n: 8, speed: 50, life: 0.8, scale: 0.9, end: 2, add: false, alpha: 0.8 });
      fx.decal('crater', p.x, p.y, { scale: r / 18, life: 30 }); fx.kick(0.25, 0.03); this.g.audio?.sfx?.('thud');
    } else {
      fx.bolt(p.x + rnd(-6, 6), p.y - 230, p.x, p.y - 4, 0xfff27a, 0.2);
      fx.bolt(p.x + rnd(-10, 10), p.y - 200, p.x, p.y - 4, 0xffffff, 0.12);
      fx.light(p.x, p.y - 10, 0xfff8b0, 70, 0.3, 1); fx.shock(p.x, p.y, 0xffe23a, r * 1.4, 0.35); fx.screenFlash(0xffffe0, 0.12);
      fx.decal('scorch', p.x, p.y, { scale: 0.7, alpha: 0.5, life: 20 }); this.g.audio?.sfx?.('thunder');
    }
    if (p.rod) { p.rod.atingido(); return; } // o para-raios bebe o raio: ninguém em volta apanha
    for (const e of A.lutadores()) {
      const dd = Math.hypot(e.x - p.x, e.y - p.y); if (dd > r + e.r) continue;
      A.ferir(e, d.dano ?? 0.1, { dx: (e.x - p.x) / (dd || 1), dy: (e.y - p.y) / (dd || 1), knock: 1.1, tipo: d.tipoDano ?? 'electric', status: d.status, chance: d.chance, aviso: av, fonte: this, ar: d.visual !== 'pedra', forca: 80 });
    }
    A.impacto(p.x, p.y, { type: d.tipoDano ?? 'electric', power: 80, cat: 'phys', en: 'Arena' }, 1.3);
    if (d.entulho && Math.random() < d.entulho) A.pecas.find((q) => q.adicionar)?.adicionar(p.x, p.y, 1);
  }
  update(dt) {
    if ((this.tm -= dt) > 0) return;
    const A = this.A, d = this.def; this.tm = per(A, d.periodo ?? [3, 5]);
    const n = Array.isArray(d.n) ? Math.round(rnd(d.n[0], d.n[1])) : d.n ?? 1, ls = A.lutadores();
    for (let i = 0; i < n; i++) {
      this.lado ^= 1;
      const quem = (d.alvo ?? 'misto') === 'aleatorio' || (i > 0 && Math.random() < 0.5) ? null : ls.find((e) => (e.side === 'foe') === !!this.lado) ?? ls[0];
      this.disparar(quem);
    }
  }
  lider(alvo) { this.disparar(alvo); return true; }
  desenhar(G0, G1) {
    const d = this.def;
    if (d.ceu) { const R = this.A.R; G1.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0).fill({ color: 0x1a2040, alpha: 0.16 + 0.06 * Math.sin(this.g.time * 1.3) }); if (Math.random() < 0.5) this.g.fx.emit(rnd(R.x0, R.x1), R.y0 + rnd(0, R.y1 - R.y0) - 30, { tex: 'spark', color: 0x9ac8ff, n: 1, speed: 160, dir: Math.PI / 2 + 0.2, spread: 0, life: 0.2, stretch: 0.02, alpha: 0.6 }); }
    for (const c of this.caindo) { // a pedra aparece caindo nos últimos instantes do aviso (sombra crescendo)
      const k = c.av.t / c.av.dur; if (k < 0.45) continue;
      const q = (k - 0.45) / 0.55, h = (1 - q) * 160;
      G0.ellipse(c.x, c.y, 4 + 8 * q, 2 + 4 * q).fill({ color: 0x000000, alpha: 0.2 + 0.25 * q });
      G1.poly([c.x - 6, c.y - h - 2, c.x - 2, c.y - h - 8, c.x + 5, c.y - h - 6, c.x + 7, c.y - h + 1, c.x + 1, c.y - h + 5, c.x - 5, c.y - h + 3]).fill(0x8a8070).stroke({ width: 1, color: 0x4a4038 });
    }
    void G0;
  }
}

// ======================================================================= painéis do chão que eletrificam em padrão (Jonas)
class Paineis extends Peca {
  iniciar() {
    const A = this.A, d = this.def, s = d.tam ?? 2, R = d.area ? A.rectPx(d.area) : A.R;
    const evita = new Set(celulas(A, d.evita).map(([x, y]) => key(x, y)));
    this.pn = [];
    for (let y = R.y0, j = 0; y + s * T <= R.y1 + 1; y += s * T, j++) for (let x = R.x0, i = 0; x + s * T <= R.x1 + 1; x += s * T, i++) {
      const cells = []; for (let b = 0; b < s; b++) for (let a = 0; a < s; a++) { const tx = x / T + a, ty = y / T + b; if (!evita.has(key(tx, ty)) && !A.g.map.solidAt(tx * T + 8, ty * T + 8)) cells.push([tx, ty]); }
      if (cells.length) this.pn.push({ i, j, x, y, cells });
    }
    this.ni = Math.max(...this.pn.map((p) => p.i)) + 1; this.nj = Math.max(...this.pn.map((p) => p.j)) + 1;
    this.tm = per(A, d.primeiro ?? d.periodo ?? [4, 6]); this.lig = null; this.k = 0;
  }
  padrao(nome, s = Math.round(Math.random())) {
    const mi = (this.ni - 1) / 2, mj = (this.nj - 1) / 2;
    const f = {
      xadrez: (p) => (p.i + p.j) % 2 === s, linhas: (p) => p.j % 2 === s, colunas: (p) => p.i % 2 === s,
      anel: (p) => (p.i === 0 || p.j === 0 || p.i === this.ni - 1 || p.j === this.nj - 1) === !s, cruz: (p) => Math.abs(p.i - mi) < 1 || Math.abs(p.j - mj) < 1,
      metade: (p) => (s ? p.i < mi : p.i > mi), diagonal: (p) => Math.abs(p.i - p.j * (this.ni / this.nj)) < 1.2 === !s,
    }[nome] ?? (() => Math.random() < 0.5);
    return this.pn.filter(f);
  }
  disparar(sel) {
    if (!sel.length) return;
    const A = this.A, d = this.def, cells = sel.flatMap((p) => p.cells);
    A.avisar({ forma: 'celulas', cells, t: d.aviso ?? 1.1, cor: d.cor ?? 0xffe23a, fonte: this, chao: true,
      depois: (av) => { this.lig = { set: new Set(cells.map(([x, y]) => key(x, y))), cells, t: (d.ativo ?? 0.8), av, hit: new Set() }; this.g.combat?.sfx('beam-electric'); } });
  }
  update(dt) {
    const A = this.A, d = this.def;
    if (this.lig) {
      const L = this.lig; L.t -= dt;
      for (const e of A.lutadores()) {
        if (L.hit.has(e) || A.voando(e) || !L.set.has(key(Math.floor(e.x / T), Math.floor(e.y / T)))) continue;
        L.hit.add(e); A.ferir(e, d.dano ?? 0.07, { tipo: d.tipoDano ?? 'electric', status: d.status ?? 'par', chance: d.chance ?? 0.2, aviso: L.av, fonte: this, knock: 0.4 });
      }
      if (Math.random() < dt * 30) { const [tx, ty] = pick(L.cells); this.g.fx.emit(tx * T + rnd(2, 14), ty * T + rnd(2, 14), { tex: 'spark', color: 0xfff27a, n: 2, speed: 50, life: 0.2, stretch: 0.01 }); }
      if (L.t <= 0) this.lig = null;
    }
    if (!this.lig && !A.avisos.some((a) => a.fonte === this) && (this.tm -= dt) <= 0) {
      this.tm = per(A, d.periodo ?? [4, 6]);
      const ps = d.padroes ?? ['xadrez', 'linhas', 'colunas', 'anel', 'cruz'];
      this.disparar(this.padrao(ps[this.k++ % ps.length]));
    }
  }
  lider(alvo) { // escolhe um padrão que pega o painel onde o seu Pokémon está
    if (this.lig || this.A.avisos.some((a) => a.fonte === this)) return false;
    const k = key(Math.floor(alvo.x / T), Math.floor(alvo.y / T));
    for (const nome of ['xadrez', 'linhas', 'colunas', 'anel', 'cruz']) for (const s of [0, 1]) { const sel = this.padrao(nome, s); if (sel.some((p) => p.cells.some(([x, y]) => key(x, y) === k))) { this.disparar(sel); return true; } }
    return false;
  }
  perigoEm(x, y, e) { return this.lig && !(e && this.A.voando(e)) && this.lig.set.has(key(Math.floor(x / T), Math.floor(y / T))) ? 1 : 0; }
  desenhar(G0) {
    const s = (this.def.tam ?? 2) * T;
    for (const p of this.pn) G0.rect(p.x + 1, p.y + 1, s - 2, s - 2);
    G0.stroke({ width: 1, color: 0x9ab0c8, alpha: 0.35 });
    if (this.lig) { for (const [x, y] of this.lig.cells) G0.rect(x * T, y * T, T, T); G0.fill({ color: 0xfff27a, alpha: 0.35 + 0.25 * Math.sin(this.g.time * 50) }); }
  }
  estado() { return { ligados: this.lig ? this.lig.cells : [] }; }
}

// ======================================================================= gerador: fica perto e o próximo golpe do tipo sai mais forte
class Gerador extends Peca {
  iniciar() { this.gens = (this.def.pos ?? []).map(([x, y]) => ({ ...this.A.P(x, y), prog: new Map(), cd: 0 })); }
  #serve(e) { const t = this.def.tipo ?? 'electric'; return e.mon.moves.some((id) => this.g.combat.move(id)?.type === t); }
  dar(e, x, y, txt = 'Carregado!') {
    e.cargaArena = { tipo: this.def.tipo ?? 'electric', mult: this.def.mult ?? 1.5, t: 15 };
    const fx = this.g.fx; fx.ring(e.x, e.y - 8, 0xfff27a, 16, 0.5, { width: 2 }); fx.bolt(x, y - 16, e.x, e.y - 10, 0xfff27a, 0.15);
    fx.number(e.x, e.y - (e.topH ?? 20) - 14, txt, 0xfff27a, true); this.g.combat?.sfx('charge'); this.A.torcida(0.6, true);
    this.A.emitir('peca', { peca: this.id, acao: 'carga', lado: e.side });
  }
  update(dt) {
    const A = this.A, d = this.def, R = (d.raio ?? 1.6) * T;
    for (const gn of this.gens) {
      gn.cd -= dt; if (gn.cd > 0) continue;
      for (const e of A.lutadores()) {
        if (e.cargaArena || !this.#serve(e) || Math.hypot(e.x - gn.x, e.y - gn.y) > R + e.r) { gn.prog.delete(e); continue; }
        const p = (gn.prog.get(e) ?? 0) + dt; gn.prog.set(e, p);
        if (p >= (d.tempo ?? 1.3)) { this.dar(e, gn.x, gn.y); gn.cd = d.recarga ?? 7; gn.prog.clear(); break; }
      }
    }
    for (const e of A.lutadores()) if (e.cargaArena) { e.cargaArena.t -= dt; if (e.cargaArena.t <= 0) e.cargaArena = null; else if (Math.random() < dt * 8) this.g.fx.emit(e.x + rnd(-6, 6), e.y - rnd(4, 18), { tex: 'spark', color: 0xfff27a, n: 1, speed: 30, life: 0.2 }); }
  }
  modDano(user, t, mv) {
    const c = user.cargaArena; if (!c || mv.type !== c.tipo) return 1;
    user.cargaArena = null; this.g.fx.number(user.x, user.y - (user.topH ?? 20) - 22, 'Carga do gerador!', 0xfff27a, true);
    return c.mult;
  }
  objetivo(e) {
    if (!this.A.doLider(e) || e.cargaArena || !this.#serve(e)) return null;
    const L = this.A.lead; let best = null, bd = 1e9;
    for (const gn of this.gens) { if (gn.cd > 0) continue; const d = Math.hypot(gn.x - e.x, gn.y - e.y); if (L && Math.hypot(gn.x - L.x, gn.y - L.y) < 40) continue; if (d < bd) { bd = d; best = { x: gn.x, y: gn.y + 14, raio: 12, ficar: true, peso: 0.55 }; } }
    return best;
  }
  desenhar(G0) {
    const t = this.g.time, R = (this.def.raio ?? 1.6) * T;
    for (const gn of this.gens) {
      const pronto = gn.cd <= 0, k = 0.5 + 0.5 * Math.sin(t * 5);
      G0.circle(gn.x, gn.y + 4, R).stroke({ width: 1, color: 0xfff27a, alpha: pronto ? 0.35 + 0.3 * k : 0.12 });
      let mx = 0; for (const v of gn.prog.values()) mx = Math.max(mx, v);
      if (mx > 0) G0.moveTo(gn.x + R - 3, gn.y + 4).arc(gn.x, gn.y + 4, R - 3, 0, TAU * Math.min(1, mx / (this.def.tempo ?? 1.3))).stroke({ width: 2.5, color: 0xffffff, alpha: 0.9 });
      if (pronto && Math.random() < 0.05) this.g.fx.emit(gn.x + rnd(-6, 6), gn.y - rnd(4, 16), { tex: 'spark', color: 0xfff27a, n: 1, speed: 20, life: 0.25 });
    }
  }
  estado() { return { geradores: this.gens.map((g) => ({ x: g.x, y: g.y, pronto: g.cd <= 0 })) }; }
}

// ======================================================================= para-raios: puxa os raios que caem perto (perto dele, ninguém apanha)
class Pararaio extends Peca {
  iniciar() { this.rods = (this.def.pos ?? []).map(([x, y]) => { const p = this.A.P(x, y); const A = this.A, [tx, ty] = A.abs(x, y); A.bloquear(tx, ty, true); const self = this; return { ...p, brilho: 0, deu: new Set(), atingido() { this.brilho = 2.5; this.deu.clear(); self.g.fx.light(this.x, this.y - 24, 0xfff8b0, 50, 0.5, 1); } }; }); }
  atrai(x, y) { const R = (this.def.raio ?? 2.4) * T; let best = null, bd = R; for (const r of this.rods) { const d = Math.hypot(r.x - x, r.y - y); if (d < bd) { bd = d; best = r; } } return best; }
  update(dt) {
    const ger = this.A.pecas.find((p) => p instanceof Gerador);
    for (const r of this.rods) {
      r.brilho -= dt; if (r.brilho <= 0) continue;
      for (const e of this.A.lutadores()) if (!r.deu.has(e) && !e.cargaArena && Math.hypot(e.x - r.x, e.y - r.y) < 22 + e.r && e.mon.moves.some((id) => this.g.combat.move(id)?.type === 'electric')) { r.deu.add(e); ger?.dar(e, r.x, r.y - 20, 'Carga do para-raios!'); }
    }
  }
  objetivo(e) { // na tempestade, quem é do líder procura o para-raios
    if (!this.A.doLider(e) || !this.A.pecas.some((p) => p instanceof Marcas && p.ativo && p.def.ceu)) return null;
    let best = null, bd = 1e9; for (const r of this.rods) { const d = Math.hypot(r.x - e.x, r.y - e.y); if (d < bd) { bd = d; best = { x: r.x + 14, y: r.y + 8, raio: 10, ficar: true, peso: 0.5 }; } }
    return best;
  }
  desenhar(G0, G1) {
    const R = (this.def.raio ?? 2.4) * T, t = this.g.time;
    for (const r of this.rods) {
      G0.circle(r.x, r.y + 2, R).stroke({ width: 1, color: 0x9ad0ff, alpha: 0.22 + (r.brilho > 0 ? 0.4 : 0) });
      G1.rect(r.x - 1, r.y - 26, 2, 28).fill(0x8a8a9a).circle(r.x, r.y - 27, 2.5).fill(r.brilho > 0 ? 0xfff8b0 : 0xc8c8d8);
      if (r.brilho > 0 && Math.sin(t * 40) > 0) G1.moveTo(r.x, r.y - 27).lineTo(r.x + rnd(-8, 8), r.y - 18).lineTo(r.x + rnd(-6, 6), r.y - 8).stroke({ width: 1, color: 0xfff27a, alpha: 0.9 });
    }
  }
  estado() { return { pararaios: this.rods.map((r) => ({ x: r.x, y: r.y, carregado: r.brilho > 0 })) }; }
}

// ======================================================================= inundação: a água sobe e desce em ciclos (Marina)
class Inundacao extends Peca {
  iniciar() {
    const A = this.A, m = this.g.map, altas = new Set(celulas(A, this.def.altas).map(([x, y]) => key(x, y)));
    const agua = (t) => t === TILE.WATER || t === TILE.DEEP;
    this.alt = new Map();
    for (const [tx, ty] of tilesDaArena(A, () => true)) {
      const t = m.at(tx, ty);
      if (agua(t)) { this.alt.set(key(tx, ty), 0); continue; }
      if (m.solidAt(tx * T + 8, ty * T + 8)) continue;
      if (altas.has(key(tx, ty))) { this.alt.set(key(tx, ty), 9); continue; }
      let beira = false; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (agua(m.at(tx + i, ty + j))) beira = true;
      this.alt.set(key(tx, ty), beira ? 1 : 2);
    }
    this.nivel = 0; this.ci = 0; this.tc = (this.def.ciclo?.[0]?.[1] ?? 6) * A.K.ritmo;
  }
  inundado(tx, ty) { const a = this.alt.get(key(tx, ty)); return a != null && a > 0 && a <= this.nivel && !this.A.pecas.some((p) => p.plataformaEm?.(tx * T + 8, ty * T + 8)); }
  #celulasAte(n) { const out = []; for (const [k, a] of this.alt) if (a > this.nivel && a <= n) out.push(k.split(',').map(Number)); return out; }
  subir(alvo, rotulo = 'A água vai subir!') {
    if (alvo <= this.nivel) { this.nivel = alvo; this.g.fx.number(this.A.R.cx, this.A.R.cy - 20, 'A água baixou', 0x9ad0ff); return; }
    const cells = this.#celulasAte(alvo);
    if (this.sobe) return;
    this.sobe = this.A.avisar({ forma: 'celulas', cells, t: this.def.aviso ?? 1.6, cor: 0x3a8aff, dano: alvo >= (this.def.maxAfoga ?? 3), rotulo, corTexto: 0x9ad0ff, fonte: this, chao: true,
      depois: () => { this.nivel = alvo; this.sobe = null; this.g.audio?.sfx?.('splash'); for (let i = 0; i < 6; i++) { const [x, y] = pick(cells.length ? cells : [[0, 0]]); this.g.fx.emit(x * T + 8, y * T + 8, { tex: 'bubble', n: 3, speed: 40, life: 0.6, add: false, vz: 50 }); } } });
  }
  update(dt) {
    const A = this.A, d = this.def;
    if ((this.tc -= dt) <= 0 && !this.sobe) {
      const C = d.ciclo ?? [[0, 6], [1, 7], [2, 8], [1, 5]];
      this.ci = (this.ci + 1) % C.length; this.tc = C[this.ci][1] * A.K.ritmo;
      this.subir(C[this.ci][0]);
    }
    if (this.nivel >= (d.maxAfoga ?? 3)) for (const e of A.lutadores()) {
      if (A.nadador(e) || A.voando(e) || !this.inundado(Math.floor(e.x / T), Math.floor(e.y / T))) { e.afogaT = 0; continue; }
      e.afogaT = (e.afogaT ?? 0) + dt;
      if (e.afogaT >= 1) { e.afogaT = 0; if (A.ferir(e, d.afoga ?? 0.035, { aviso: 'terreno', fonte: this, tipo: 'normal', knock: 0.1 })) this.g.fx.number(e.x, e.y - 30, 'Afundando!', 0x9ad0ff); }
    }
  }
  velocidade(e) {
    if (this.A.voando(e) || !this.inundado(Math.floor(e.x / T), Math.floor(e.y / T))) return 1;
    if (this.A.nadador(e)) return 1.2;
    return (this.def.lento ?? [1, 0.8, 0.62, 0.5, 0.5])[this.nivel] ?? 0.5;
  }
  molhado(x, y) { return this.inundado(Math.floor(x / T), Math.floor(y / T)); }
  perigoEm(x, y, e) { return e && !this.A.nadador(e) && !this.A.voando(e) && this.nivel >= (this.def.maxAfoga ?? 3) && this.molhado(x, y) ? 0.7 : 0; }
  objetivo(e) {
    if (!this.A.doLider(e) || this.nivel < 2) return null;
    const quer = this.A.nadador(e); let best = null, bd = 1e9;
    for (const [k, a] of this.alt) {
      if (a === 0) continue; const [tx, ty] = k.split(',').map(Number), mol = this.inundado(tx, ty);
      if (mol !== quer) continue;
      const x = tx * T + 8, y = ty * T + 8, d = Math.hypot(x - e.x, y - e.y); if (d < bd) { bd = d; best = { x, y, raio: 6, peso: quer ? 0.4 : 0.65 }; }
    }
    if (best && bd < 10) return null;
    return best;
  }
  // alavanca: "subir" a água (um degrau a mais por um tempo)
  acionar(acao) { if (acao === 'subir') { this.subir(Math.min(this.nivel + 1, this.def.maxNivel ?? 3), 'A comporta abriu!'); this.tc = Math.max(this.tc, 6 * this.A.K.ritmo); return true; } return false; }
  utilAlavanca(e) { return this.A.nadador(e) && this.nivel < 2 ? 0.6 : 0; }
  lider(alvo) { if (this.A.nadador(alvo) || this.nivel >= 2 || this.sobe) return false; this.tc = 0; return true; }
  ajustar(p) { super.ajustar(p); this.ci = -1; this.tc = 0; }
  desenhar(G0) {
    const t = this.g.time; let n = 0;
    for (const [k, a] of this.alt) {
      if (a === 0 || a > this.nivel) continue;
      const [tx, ty] = k.split(',').map(Number); if (!this.inundado(tx, ty)) continue;
      G0.rect(tx * T, ty * T, T, T); n++;
    }
    if (n) G0.fill({ color: 0x2a6ac8, alpha: 0.42 + 0.06 * this.nivel });
    if (n) {
      for (const [k, a] of this.alt) {
        if (a === 0 || a > this.nivel) continue; const [tx, ty] = k.split(',').map(Number); if ((tx + ty) % 2) continue;
        const o = Math.sin(t * 2 + tx * 0.7 + ty) * 3; G0.moveTo(tx * T + 3 + o, ty * T + 6).lineTo(tx * T + 9 + o, ty * T + 6);
      }
      G0.stroke({ width: 1, color: 0xbfe6ff, alpha: 0.5 });
    }
  }
  estado() { return { nivel: this.nivel, inundadas: [...this.alt].filter(([k, a]) => a > 0 && a <= this.nivel).map(([k]) => k.split(',').map(Number)) }; }
}

// ======================================================================= correnteza: empurra quem está na água
class Correnteza extends Peca {
  iniciar() { this.sentido = 1; this.tm = per(this.A, this.def.periodo ?? 10); this.vira = 0; this.cellsT = 0; this.cells = []; }
  #agua(tx, ty) { const t = this.g.map.at(tx, ty); return t === TILE.WATER || t === TILE.DEEP || !!this.A.pecas.find((p) => p.inundado)?.inundado(tx, ty); }
  #fluxo(x, y) {
    const d = this.def;
    if (d.modo === 'giro') { const c = d.centro ? this.A.P(...d.centro) : { x: this.A.R.cx, y: this.A.R.cy }, dx = x - c.x, dy = y - c.y, l = Math.hypot(dx, dy) || 1; return [-dy / l * this.sentido, dx / l * this.sentido]; }
    const [a, b] = d.dir ?? [1, 0]; return [a * this.sentido, b * this.sentido];
  }
  update(dt) {
    const A = this.A, d = this.def;
    if (d.periodo && (this.tm -= dt) <= 0) { this.tm = per(A, d.periodo); this.vira = 1.2; this.g.fx.number(A.R.cx, A.R.cy - 30, 'A correnteza vai virar!', 0x9ad0ff, true); }
    if (this.vira > 0 && (this.vira -= dt) <= 0) this.sentido *= -1;
    const F = (d.forca ?? 70) * 7;
    for (const e of A.lutadores()) {
      if (A.voando(e) || !this.#agua(Math.floor(e.x / T), Math.floor(e.y / T))) continue;
      const [fx, fy] = this.#fluxo(e.x, e.y), k = A.nadador(e) ? 0.6 : 1;
      e.kx += fx * F * k * dt; e.ky += fy * F * k * dt;
    }
  }
  acionar(acao) { if (acao === 'inverter') this.sentido *= -1; else this.ativo = !this.ativo; this.g.fx.number(this.A.R.cx, this.A.R.cy - 30, this.ativo ? 'Correnteza!' : 'A correnteza parou', 0x9ad0ff, true); return true; }
  utilAlavanca(e) { return this.A.nadador(e) ? 0 : 0.3; }
  desenhar(G0) {
    const A = this.A, t = this.g.time;
    if ((this.cellsT -= 1 / 60) <= 0) { this.cellsT = 0.5; this.cells = tilesDaArena(A, (x, y) => (x + y) % 2 === 0 && this.#agua(x, y)); }
    const blink = this.vira > 0 && Math.sin(t * 30) > 0;
    for (const [tx, ty] of this.cells) {
      const x = tx * T + 8, y = ty * T + 8, [fx, fy] = this.#fluxo(x, y), o = ((t * 1.2 + (tx + ty) * 0.13) % 1 - 0.5) * 10;
      const px = x + fx * o, py = y + fy * o;
      G0.moveTo(px - fx * 3 - fy * 3, py - fy * 3 + fx * 3).lineTo(px + fx * 2, py + fy * 2).lineTo(px - fx * 3 + fy * 3, py - fy * 3 - fx * 3);
    }
    G0.stroke({ width: 1, color: blink ? 0xffe27a : 0xdff4ff, alpha: 0.55 });
  }
  estado() { return { sentido: this.sentido, modo: this.def.modo ?? 'dir' }; }
}

// ======================================================================= plataformas e barcos que boiam e se mexem
class Plataforma extends Peca {
  iniciar() {
    this.barcos = (this.def.barcos ?? []).map((b) => ({ ...b, x: b.rota[0][0], y: b.rota[0][1], seg: 0, espera: b.pausa ?? 1.2, cob: new Set() }));
    for (const b of this.barcos) this.#cobrir(b);
  }
  #rect(b) { const p = this.A.Q(b.x, b.y); return { x0: p.x, y0: p.y, x1: p.x + b.w * T, y1: p.y + b.h * T }; }
  plataformaEm(x, y) { for (const b of this.barcos) { const r = this.#rect(b); if (x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1) return true; } return false; }
  #cobrir(b) {
    const A = this.A, r = this.#rect(b), nova = new Set();
    for (let ty = Math.floor(r.y0 / T); ty < Math.ceil(r.y1 / T - 0.05); ty++) for (let tx = Math.floor(r.x0 / T); tx < Math.ceil(r.x1 / T - 0.05); tx++) nova.add(key(tx, ty));
    // só a parte que cobre o barco inteiro vira chão; a borda que sai volta a ser água
    for (const k of b.cob) if (!nova.has(k)) { const [tx, ty] = k.split(',').map(Number); A.trocaTile(tx, ty, A.tileOriginal(tx, ty)); }
    for (const k of nova) if (!b.cob.has(k)) { const [tx, ty] = k.split(',').map(Number), o = A.tileOriginal(tx, ty); if (o === TILE.WATER || o === TILE.DEEP) A.trocaTile(tx, ty, TILE.DOCK); }
    b.cob = nova;
  }
  update(dt) {
    for (const b of this.barcos) {
      if (b.espera > 0) { b.espera -= dt; continue; }
      const alvo = b.rota[(b.seg + 1) % b.rota.length], dx = alvo[0] - b.x, dy = alvo[1] - b.y, d = Math.hypot(dx, dy), v = (b.vel ?? 1.1) * dt;
      const r0 = this.#rect(b);
      const mx = d <= v ? dx : dx / d * v, my = d <= v ? dy : dy / d * v;
      b.x += mx; b.y += my;
      if (d <= v) { b.seg = (b.seg + 1) % b.rota.length; b.espera = b.pausa ?? 1.2; }
      // quem está em cima vai junto
      const px = mx * T, py = my * T;
      for (const e of [...this.A.lutadores(), this.g.player]) if (e.x >= r0.x0 && e.x < r0.x1 && e.y >= r0.y0 && e.y < r0.y1 && !this.A.voando(e)) { e.x += px; e.y += py; }
      this.#cobrir(b);
    }
  }
  objetivo(e) {
    const inu = this.A.pecas.find((p) => p.inundado); if (!this.A.doLider(e) || this.A.nadador(e) || !inu || inu.nivel < 2) return null;
    let best = null, bd = 1e9; for (const b of this.barcos) { const r = this.#rect(b), x = (r.x0 + r.x1) / 2, y = (r.y0 + r.y1) / 2, d = Math.hypot(x - e.x, y - e.y); if (d < bd) { bd = d; best = { x, y, raio: 8, ficar: true, peso: 0.7 }; } }
    return best;
  }
  desenhar(G0) {
    for (const b of this.barcos) {
      const r = this.#rect(b), w = r.x1 - r.x0, h = r.y1 - r.y0;
      G0.roundRect(r.x0 - 1, r.y0 - 1, w + 2, h + 2, 5).fill({ color: 0x7a4a26 }).stroke({ width: 1.5, color: 0x3a2010 });
      for (let x = r.x0 + 4; x < r.x1 - 2; x += 5) G0.moveTo(x, r.y0 + 2).lineTo(x, r.y1 - 2);
      G0.stroke({ width: 1, color: 0x5a3416, alpha: 0.8 });
      G0.ellipse((r.x0 + r.x1) / 2, r.y1 + 1, w * 0.55, 2).stroke({ width: 1, color: 0xdff4ff, alpha: 0.4 + 0.2 * Math.sin(this.g.time * 4) });
    }
  }
  fim() { for (const b of this.barcos) { b.cob.forEach((k) => { const [tx, ty] = k.split(',').map(Number); this.A.trocaTile(tx, ty, this.A.tileOriginal(tx, ty)); }); b.cob.clear(); } }
  estado() { return { barcos: this.barcos.map((b) => ({ ...this.#rect(b) })) }; }
}

// ======================================================================= alavanca: os dois lados usam (pisar meio segundo ou acertar com golpe)
class Alavanca extends Peca {
  iniciar() { const p = this.A.P(...this.def.pos); this.x = p.x; this.y = p.y; this.cd = 0; this.on = false; this.prog = 0; }
  acionar(quem) {
    if (this.cd > 0) return;
    const d = this.def; this.cd = d.recarga ?? 5; this.on = !this.on; this.prog = 0;
    this.A.peca(d.alvo)?.acionar?.(d.acao ?? 'alternar', quem);
    this.g.fx.number(this.x, this.y - 22, (d.nome ?? 'Alavanca') + '!', 0xffe27a, true); this.g.audio?.sfx?.('thud');
    this.A.torcida(0.7, true); this.A.emitir('peca', { peca: this.id, acao: d.acao, lado: quem?.side ?? null });
  }
  update(dt) {
    this.cd -= dt; if (this.cd > 0) return;
    let perto = null; for (const e of this.A.lutadores()) if (Math.hypot(e.x - this.x, e.y - this.y) < 14 + e.r) perto = e;
    if (perto) { this.prog += dt; if (this.prog >= 0.5) this.acionar(perto); } else this.prog = Math.max(0, this.prog - dt);
  }
  bloqueia(x, y, mv, p) { if (Math.hypot(x - this.x, y - this.y) < 10) { this.acionar(p?.user ?? null); return true; } return false; }
  impacto(x, y) { if (Math.hypot(x - this.x, y - this.y) < 14) this.acionar(null); }
  objetivo(e) { if (!this.A.doLider(e) || this.cd > 0) return null; const u = this.A.peca(this.def.alvo)?.utilAlavanca?.(e, this.def.acao) ?? 0; return u > 0 ? { x: this.x, y: this.y, raio: 8, ficar: true, peso: u } : null; }
  desenhar(G0, G1) {
    const x = this.x, y = this.y, c = this.def.cor ?? 0xe5383b, a = this.on ? 0.6 : -0.6;
    G0.roundRect(x - 6, y - 2, 12, 6, 2).fill(0x4a4a52).stroke({ width: 1, color: 0x2a2a30 });
    G1.moveTo(x, y).lineTo(x + Math.sin(a) * 10, y - Math.cos(a) * 10).stroke({ width: 2, color: 0x8a8a92 });
    G1.circle(x + Math.sin(a) * 10, y - Math.cos(a) * 10, 2.6).fill(this.cd > 0 ? 0x6a6a6a : c);
    if (this.prog > 0) G0.moveTo(x + 11, y + 1).arc(x, y + 1, 11, 0, TAU * this.prog / 0.5).stroke({ width: 2, color: 0xffffff, alpha: 0.85 });
    else if (this.cd <= 0) G0.circle(x, y + 1, 11 + Math.sin(this.g.time * 4)).stroke({ width: 1, color: c, alpha: 0.35 });
  }
  estado() { return { x: this.x, y: this.y, ligada: this.on, pronta: this.cd <= 0 }; }
}

// ======================================================================= cobertura: fardo, pilar, móvel; segura golpes e quebra; o fardo rola
class Cobertura extends Peca {
  iniciar() { this.itens = []; for (const [x, y] of celulas(this.A, this.def.pos)) this.adicionar(x * T + 8, y * T + 8, this.def.hp ?? 3); }
  adicionar(x, y, hp) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T), A = this.A;
    if (this.itens.some((i) => i.tx === tx && i.ty === ty && !i.morto) || A.g.map.solidAt(tx * T + 8, ty * T + 8) || ocupado(A, tx * T + 8, ty * T + 8, 8)) return null;
    const it = { tx, ty, x: tx * T + 8, y: ty * T + 8, hp, max: hp, rola: null, treme: 0, G: A.gfx(ty * T + 14), ang: 0 };
    A.bloquear(tx, ty, true); this.itens.push(it); return it;
  }
  #em(x, y) { return this.itens.find((i) => !i.morto && !i.rola && Math.abs(i.x - x) < 9 && Math.abs(i.y - y) < 9); }
  bater(it, mv, dir, P = 1) {
    const d = this.def;
    if (mv?.type === 'fire' && (d.visual ?? 'fardo') === 'fardo') { this.quebrar(it, true); return; }
    if (d.rola && dir && (forte(mv, P) || mv?.cat === 'phys')) { this.rolar(it, dir); return; }
    it.hp -= forte(mv, P) ? 2 : 1; it.treme = 0.25; this.g.combat?.sfx(d.visual === 'pilar' ? 'crack' : 'rustle', null, 0.06);
    if (it.hp <= 0) this.quebrar(it);
  }
  rolar(it, dir) {
    const l = Math.hypot(dir.x, dir.y) || 1;
    this.A.bloquear(it.tx, it.ty, false);
    it.rola = { vx: dir.x / l * 150, vy: dir.y / l * 150, hit: new Set(), t: 0 };
    this.g.fx.number(it.x, it.y - 18, 'Rolou!', 0xe8d070); this.g.audio?.sfx?.('whoosh');
  }
  quebrar(it, fogo = false) {
    if (it.morto) return;
    it.morto = true; if (!it.rola) this.A.bloquear(it.tx, it.ty, false);
    it.G.clear(); const fx = this.g.fx, vis = this.def.visual ?? 'fardo';
    if (vis === 'pilar') { fx.emit(it.x, it.y - 8, { tex: 'rock2', n: 6, speed: 80, life: 1, grav: 400, vz: 120, add: false, spin: 12, bounce: 0.35 }); fx.emit(it.x, it.y - 4, { tex: 'dust', n: 8, speed: 40, life: 0.8, scale: 0.9, end: 2, add: false, alpha: 0.8 }); this.g.audio?.sfx?.('break'); }
    else if (vis === 'movel') { fx.emit(it.x, it.y - 8, { tex: 'clip', n: 12, speed: 90, life: 0.8, grav: 380, vz: 110, add: false, spin: 12, color: 0x8a5a2a }); this.g.audio?.sfx?.('break'); }
    else { fx.emit(it.x, it.y - 6, { tex: 'clip', n: 16, speed: 90, life: 0.9, grav: 300, vz: 100, add: false, spin: 10, color: 0xe8c860 }); if (fogo) fx.emit(it.x, it.y - 6, { frames: 'flame', n: 6, speed: 20, life: 0.6, vz: 40, add: false }); this.g.audio?.sfx?.('rustle'); }
    fx.kick(0.1, 0.02); this.A.torcida(0.4);
    if (this.def.renasce) this.g.later(this.def.renasce, () => { if (!this.A.done) { const n = this.adicionar(it.x, it.y, it.max); if (n) fx.emit(n.x, n.y - 6, { tex: 'dust', n: 5, speed: 20, life: 0.5, add: false, alpha: 0.6 }); } });
  }
  #dir(it) { let best = null, bd = 60; for (const e of this.A.lutadores()) { const d = Math.hypot(e.x - it.x, e.y - it.y); if (d < bd) { bd = d; best = e; } } return best ? { x: it.x - best.x, y: it.y - best.y } : null; }
  bloqueia(x, y, mv, p) { const it = this.#em(x, y); if (!it) return false; this.bater(it, mv, p ? { x: p.vx, y: p.vy } : this.#dir(it)); return true; }
  impacto(x, y, mv, P) { const it = this.itens.find((i) => !i.morto && !i.rola && Math.hypot(i.x - x, i.y - y) < 14); if (it) this.bater(it, mv, this.#dir(it), P); }
  pisoteio(x, y, mv, u) { const it = this.itens.find((i) => !i.morto && !i.rola && Math.hypot(i.x - x, i.y - y) < (u?.r ?? 6) + 10); if (it) this.bater(it, mv ?? { power: 60, cat: 'phys' }, u ? { x: u.kx || u.vx, y: u.ky || u.vy } : null, 1.3); }
  varrer(r) { for (const it of this.itens) if (!it.morto && it.x > r.x0 && it.x < r.x1 && it.y > r.y0 && it.y < r.y1) this.quebrar(it); }
  sempre(dt) {
    const A = this.A, m = this.g.map;
    for (const it of this.itens) {
      if (it.morto) continue;
      it.treme = Math.max(0, it.treme - dt);
      if (it.rola) {
        const r = it.rola; r.t += dt; it.ang += dt * 12;
        const nx = it.x + r.vx * dt, ny = it.y + r.vy * dt, l = Math.hypot(r.vx, r.vy);
        if (!A.dentro(nx, ny, -6) || m.solidAt(nx + r.vx / l * 6, ny + r.vy / l * 6) || r.t > 3) { this.quebrar(it); continue; }
        it.x = nx; it.y = ny; it.G.zIndex = it.y + 6;
        for (const e of A.lutadores()) if (!r.hit.has(e) && Math.hypot(e.x - it.x, e.y - it.y) < e.r + 8) { r.hit.add(e); A.ferir(e, this.def.dano ?? 0.08, { dx: r.vx / l, dy: r.vy / l, knock: 1.4, aviso: 'consequencia', fonte: this, forca: 70 }); }
        for (const pc of A.pecas) if (pc !== this) pc.varrer?.({ x0: it.x - 7, x1: it.x + 7, y0: it.y - 7, y1: it.y + 7 });
        for (const o of this.itens) if (o !== it && !o.morto && !o.rola && Math.hypot(o.x - it.x, o.y - it.y) < 14) { this.quebrar(o); this.quebrar(it); break; }
      }
      this.#pintar(it);
    }
    this.itens = this.itens.filter((i) => !i.morto);
  }
  #pintar(it) {
    const G = it.G, vis = this.def.visual ?? 'fardo', x = it.x + (it.treme > 0 ? Math.sin(it.treme * 80) * 1.5 : 0), y = it.y, dano = it.hp / it.max;
    G.clear();
    G.ellipse(x, y + 6, 8, 3).fill({ color: 0x000000, alpha: 0.25 });
    if (vis === 'pilar') {
      G.rect(x - 6, y - 18, 12, 24).fill(0x9a948a).stroke({ width: 1, color: 0x5a5448 });
      G.rect(x - 7, y - 20, 14, 4).fill(0xb0aaa0).rect(x - 7, y + 3, 14, 3).fill(0x7a746a);
      if (dano < 1) G.moveTo(x - 2, y - 14).lineTo(x + 1, y - 8).lineTo(x - 1, y - 2).stroke({ width: 1, color: 0x3a342a });
    } else if (vis === 'movel') {
      G.rect(x - 7, y - 16, 14, 21).fill(0x7a4a26).stroke({ width: 1, color: 0x3a2010 });
      G.rect(x - 5, y - 13, 4, 7).rect(x + 1, y - 13, 4, 7).fill(0x5a3418).circle(x - 1.5, y - 4, 0.8).circle(x + 1.5, y - 4, 0.8).fill(0xe8c050);
    } else {
      const s = it.rola ? Math.sin(it.ang) * 2 : 0;
      G.roundRect(x - 8, y - 9, 16, 14, 4).fill(0xe0b850).stroke({ width: 1, color: 0x9a7a28 });
      for (let i = -1; i <= 1; i++) G.moveTo(x - 6, y - 4 + i * 4 + s).lineTo(x + 6, y - 5 + i * 4 + s);
      G.stroke({ width: 1, color: 0xb08a30 });
      G.rect(x - 2, y - 9, 2, 14).fill(0x8a3a20);
      if (dano < 1) G.moveTo(x - 8, y - 9).lineTo(x - 4, y - 12).stroke({ width: 1, color: 0xe0b850 });
    }
  }
  objetivo(e) {
    if (!this.A.doLider(e)) return null;
    const ferido = e.mon.hp / e.mon.stats.hp < 0.55, semGolpe = e.cds.every((c, i) => c > 0.8 || !e.mon.moves[i]);
    if (!ferido && !semGolpe) return null;
    const L = this.A.lead; if (!L) return null;
    let best = null, bd = 1e9;
    for (const it of this.itens) {
      if (it.morto || it.rola) continue;
      const dx = it.x - L.x, dy = it.y - L.y, d = Math.hypot(dx, dy) || 1, hx = it.x + dx / d * 17, hy = it.y + dy / d * 17;
      if (!this.A.livre(hx, hy, 4)) continue;
      const s = Math.hypot(hx - e.x, hy - e.y); if (s < bd) { bd = s; best = { x: hx, y: hy, raio: 7, ficar: semGolpe, peso: 0.5, pressa: 1.2 }; }
    }
    return best;
  }
  fim() { for (const it of this.itens) it.G.clear(); }
  estado() { return { itens: this.itens.map((i) => ({ x: i.x, y: i.y, ps: i.hp, rolando: !!i.rola })) }; }
}

// ======================================================================= teia: prende e deixa lento; fogo e corte destroem (Lia)
class Teia extends Peca {
  iniciar() {
    const A = this.A, d = this.def;
    this.base = tilesDaArena(A, (x, y) => A.tileOriginal(x, y) === (d.tile ?? TILE.WEBS));
    this.web = new Set(); this.G = A.gfx(-1e6); A.g.fx.ground.addChild(this.G); this.sujo = true;
    // começo: manchas de teia (fração "cobre" dos fios prateados), crescendo a partir de sementes
    const quer = Math.round(this.base.length * (d.cobre ?? 0.35)), livre = new Set(this.base.map(([x, y]) => key(x, y)));
    while (this.web.size < quer && livre.size) {
      const [sx, sy] = pick([...livre].map((k) => k.split(',').map(Number))), fila = [[sx, sy]];
      let n = 0; while (fila.length && n < 9 && this.web.size < quer) { const [x, y] = fila.shift(), k = key(x, y); if (!livre.has(k)) continue; livre.delete(k); this.web.add(k); n++; for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (Math.random() < 0.7) fila.push([x + i, y + j]); }
    }
  }
  imune(e) { return this.A.voando(e) || e.mon.types.some((t) => (this.def.imunes ?? ['bug']).includes(t)); }
  #tem(x, y) { return this.web.has(key(Math.floor(x / T), Math.floor(y / T))); }
  velocidade(e) { return this.#tem(e.x, e.y) && !this.imune(e) ? this.def.lento ?? 0.5 : 1; }
  update(dt) {
    for (const e of this.A.lutadores()) {
      if (this.imune(e) || !this.#tem(e.x, e.y)) { e.teiaT = Math.max(-1, (e.teiaT ?? 0) - dt); continue; }
      e.teiaT = (e.teiaT ?? 0) + dt * (Math.hypot(e.vx, e.vy) > 10 ? 1.3 : 1);
      if (e.teiaT >= (this.def.prende ?? 1.4)) { e.teiaT = -1.2; e.stun = Math.max(e.stun, this.def.preso ?? 0.8); this.g.fx.number(e.x, e.y - 30, 'Preso na teia!', 0xffffff); this.g.fx.ring(e.x, e.y - 6, 0xffffff, 9, 0.5, { width: 1.5, squash: 0.5 }); }
    }
  }
  remover(x, y, r, fogo) {
    let n = 0;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const tx = Math.floor(x / T) + i, ty = Math.floor(y / T) + j, k = key(tx, ty);
      if (!this.web.has(k) || Math.hypot(tx * T + 8 - x, ty * T + 8 - y) > r) continue;
      this.web.delete(k); n++;
      this.g.fx.emit(tx * T + 8, ty * T + 8, fogo ? { frames: 'flame', n: 3, speed: 12, life: 0.5, vz: 30, add: false } : { tex: 'clip', n: 4, speed: 40, life: 0.5, grav: 120, vz: 40, add: false, color: 0xffffff });
    }
    if (n) { this.sujo = true; if (fogo) this.g.combat?.sfx('beam-fire', null, 0.1); }
    return n;
  }
  tecer(cells) { for (const [x, y] of cells) if (!this.A.g.map.solidAt(x * T + 8, y * T + 8)) this.web.add(key(x, y)); this.sujo = true; }
  impacto(x, y, mv, P) {
    if (!mv) return;
    if (mv.type === 'fire') this.remover(x, y, T * (1.3 + P * 0.4), true);
    else if (corta(mv)) this.remover(x, y, T * 0.9, false);
    else if (mv.en === 'String Shot' || (mv.type === 'bug' && mv.cat === 'status')) this.tecer([[Math.floor(x / T), Math.floor(y / T)], [Math.floor(x / T) + 1, Math.floor(y / T)], [Math.floor(x / T), Math.floor(y / T) + 1]]);
  }
  bloqueia(x, y, mv) { if (mv?.type === 'fire' && this.#tem(x, y)) this.remover(x, y, T * 0.8, true); return false; }
  varrer(r) { for (const k of [...this.web]) { const [tx, ty] = k.split(',').map(Number), x = tx * T + 8, y = ty * T + 8; if (x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) { this.web.delete(k); this.sujo = true; } } }
  // líder: "Tece!": a teia cresce em volta do seu Pokémon (aviso branco, sem dano)
  lider(alvo) {
    const cx = Math.floor(alvo.x / T), cy = Math.floor(alvo.y / T), cells = [];
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const tx = cx + i, ty = cy + j; if (Math.hypot(i, j) > 2.2 || this.web.has(key(tx, ty)) || this.A.g.map.solidAt(tx * T + 8, ty * T + 8) || !this.A.dentro(tx * T + 8, ty * T + 8, -4)) continue; cells.push([tx, ty]); }
    if (cells.length < 4) return false;
    this.A.avisar({ forma: 'celulas', cells, t: 1.3, cor: 0xf2f2ff, dano: false, rotulo: 'Tece!', corTexto: 0xffffff, fonte: this, depois: () => this.tecer(cells) });
    return true;
  }
  // fase 2: a teia sobe e cobre os fios prateados; os dourados viram as passarelas
  evento() {
    const falta = this.base.filter(([x, y]) => !this.web.has(key(x, y)));
    if (falta.length) this.A.avisar({ forma: 'celulas', cells: falta, t: 1.8, cor: 0xf2f2ff, dano: false, fonte: this, depois: () => this.tecer(falta) });
  }
  perigoEm(x, y, e) { return e && !this.imune(e) && this.#tem(x, y) ? 0.32 : 0; }
  objetivo(e) { // inseto do líder fica na teia, onde o seu Pokémon anda devagar
    if (!this.A.doLider(e) || !this.imune(e) || this.#tem(e.x, e.y) || Math.random() > 0.5) return null;
    let best = null, bd = 90; for (const k of this.web) { const [tx, ty] = k.split(',').map(Number), x = tx * T + 8, y = ty * T + 8, d = Math.hypot(x - e.x, y - e.y); if (d < bd) { bd = d; best = { x, y, raio: 6, peso: 0.3 }; } }
    return best;
  }
  desenhar() {
    if (!this.sujo) return;
    this.sujo = false; const G = this.G; G.clear();
    for (const k of this.web) {
      const [tx, ty] = k.split(',').map(Number), x = tx * T, y = ty * T;
      G.moveTo(x, y).lineTo(x + T, y + T).moveTo(x + T, y).lineTo(x, y + T).moveTo(x + 8, y).lineTo(x + 8, y + T).moveTo(x, y + 8).lineTo(x + T, y + 8);
      G.moveTo(x + 4, y + 4).lineTo(x + 12, y + 4).lineTo(x + 12, y + 12).lineTo(x + 4, y + 12).lineTo(x + 4, y + 4);
    }
    G.stroke({ width: 0.8, color: 0xffffff, alpha: 0.6 });
  }
  fim() { this.G.destroy(); }
  estado() { return { celulas: [...this.web].map((k) => k.split(',').map(Number)) }; }
}

// ======================================================================= plantas carnívoras: mordem quem passa (aviso verde antes)
class Planta extends Peca {
  iniciar() { this.ps = celulas(this.A, this.def.pos).map(([x, y]) => ({ x: x * T + 8, y: y * T + 10, st: 'idle', cd: rnd(0, 1.5), murcha: 0, av: null, boca: 0 })); }
  update(dt) {
    const A = this.A, d = this.def, R = (d.raio ?? 1.3) * T;
    for (const p of this.ps) {
      p.cd -= dt; p.murcha -= dt; p.boca = Math.max(0, p.boca - dt * 3);
      if (p.st !== 'idle' || p.cd > 0 || p.murcha > 0) continue;
      if (!A.lutadores().some((e) => !A.voando(e) && Math.hypot(e.x - p.x, e.y - p.y) < R + e.r)) continue;
      p.st = 'aviso';
      p.av = A.avisar({ forma: 'circulo', x: p.x, y: p.y, r: R, t: d.aviso ?? 0.8, cor: 0x9ad83a, fonte: this, som: false, depois: (av) => this.morder(p, R, av) });
    }
  }
  morder(p, R, av) {
    const A = this.A; p.st = 'idle'; p.cd = this.def.recarga ?? 3.5; p.boca = 1; p.av = null;
    if (p.murcha > 0) return;
    this.g.audio?.sfx?.('munch');
    for (const e of A.lutadores()) if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r * 0.6) A.ferir(e, this.def.dano ?? 0.07, { tipo: 'grass', prende: this.def.prende ?? 0.6, aviso: av, fonte: this, knock: 0.3, dx: (e.x - p.x) / R, dy: (e.y - p.y) / R });
  }
  #murchar(p) { if (p.murcha > 0) return; p.murcha = this.def.murcha ?? 8; if (p.av) { this.A.avisos = this.A.avisos.filter((a) => a !== p.av); p.av = null; p.st = 'idle'; } this.g.fx.number(p.x, p.y - 24, 'A planta murchou!', 0xc8c8a0); }
  impacto(x, y, mv) { for (const p of this.ps) if (Math.hypot(p.x - x, p.y - y) < 16 && (mv?.type === 'fire' || mv?.type === 'ice' || mv?.type === 'flying' || forte(mv))) this.#murchar(p); }
  bloqueia(x, y, mv) { const p = this.ps.find((q) => Math.abs(q.x - x) < 7 && Math.abs(q.y - 6 - y) < 9); if (!p) return false; if (mv?.type === 'fire' || mv?.type === 'ice' || mv?.type === 'flying' || forte(mv)) this.#murchar(p); return true; }
  perigoEm(x, y, e) { if (e && this.A.voando(e)) return 0; const R = (this.def.raio ?? 1.3) * T; return this.ps.some((p) => p.murcha <= 0 && Math.hypot(p.x - x, p.y - y) < R + 4) ? 0.35 : 0; }
  desenhar(G0, G1) {
    const t = this.g.time;
    for (const p of this.ps) {
      const m = p.murcha > 0, k = p.st === 'aviso' && p.av ? p.av.t / p.av.dur : 0, abre = m ? 0 : Math.max(k, p.boca);
      G0.ellipse(p.x, p.y + 2, 7, 3).fill({ color: 0x1a3a10, alpha: 0.35 });
      G1.moveTo(p.x, p.y + 1).lineTo(p.x + Math.sin(t * 2 + p.x) * 2, p.y - 8).stroke({ width: 2, color: m ? 0x7a7a50 : 0x3a8a2a });
      const hx = p.x + Math.sin(t * 2 + p.x) * 2, hy = p.y - 11 + (m ? 5 : 0);
      G1.ellipse(hx, hy - abre * 3, 6, 3 + abre).fill(m ? 0x8a8a60 : 0xd8384a).ellipse(hx, hy + abre * 3, 6, 3).fill(m ? 0x8a8a60 : 0xc82838);
      if (abre > 0.2) G1.ellipse(hx, hy, 4, abre * 3).fill(0x4a0a10);
      if (!m) G1.circle(hx - 3, hy - 3 - abre * 3, 0.9).circle(hx + 3, hy - 3 - abre * 3, 0.9).fill(0xffffff);
    }
  }
  estado() { return { plantas: this.ps.map((p) => ({ x: p.x, y: p.y, estado: p.murcha > 0 ? 'murcha' : p.st })) }; }
}

// ======================================================================= casulos que eclodem em ajudantes (quebre antes!)
class Casulo extends Peca {
  iniciar() { this.cs = celulas(this.A, this.def.pos).map(([x, y]) => ({ x: x * T + 8, y: y * T + 4, t: per(this.A, this.def.eclode ?? [16, 22]) * rnd(0.6, 1), hp: this.def.hp ?? 2, treme: 0, avisou: false })); }
  update(dt) {
    const A = this.A, d = this.def;
    for (const c of this.cs) {
      c.t -= dt; c.treme = Math.max(0, c.treme - dt);
      if (c.t < 2.5 && !c.avisou) { c.avisou = true; A.avisar({ forma: 'circulo', x: c.x, y: c.y + 10, r: 12, t: 2.4, cor: 0xd8e870, dano: false, rotulo: 'Vai eclodir!', corTexto: 0xe8f080, fonte: this, som: false }); }
      if (c.t <= 0) {
        c.t = per(A, d.eclode ?? [16, 22]); c.avisou = false; c.hp = d.hp ?? 2;
        if (A.ajudantes.length < (d.max ?? 2)) this.#eclodir(c);
      }
    }
  }
  async #eclodir(c) {
    const A = this.A, g = this.g, d = this.def;
    const mon = new Mon(pick(d.dex ?? [13, 10]), Math.max(2, A.nivel + (d.nivel ?? -6)));
    const e = new PokeEntity(g, mon, 'foe', c.x, c.y + 12);
    await e.ready; if (A.done) { e.view.destroy({ children: true }); return; }
    g.entities.push(e); g.ents.addChild(e.view); e.vz = 70;
    A.addAjudante(e, d.vida ?? 22);
    g.fx.emit(c.x, c.y + 4, { tex: 'clip', n: 10, speed: 60, life: 0.7, grav: 260, vz: 70, add: false, color: 0xe8e0b0 });
    g.fx.number(c.x, c.y - 10, `Eclodiu um ${mon.name}!`, 0xe8f080, true); g.audio?.sfx?.('pop');
    A.emitir('peca', { peca: this.id, acao: 'eclodiu', nome: mon.name });
  }
  #bater(c) {
    c.hp--; c.treme = 0.3; this.g.combat?.sfx('crack', null, 0.06);
    if (c.hp <= 0) { c.t = per(this.A, this.def.eclode ?? [16, 22]) * 1.2; c.hp = this.def.hp ?? 2; c.avisou = false; this.A.avisos = this.A.avisos.filter((a) => !(a.fonte === this && Math.hypot(a.x - c.x, a.y - c.y - 10) < 2)); this.g.fx.number(c.x, c.y - 10, 'O casulo rompeu!', 0xe8f080); this.g.fx.emit(c.x, c.y + 4, { tex: 'clip', n: 8, speed: 50, life: 0.6, grav: 260, vz: 50, add: false, color: 0xe8e0b0 }); this.A.torcida(0.5, true); }
  }
  bloqueia(x, y, mv) { const c = this.cs.find((q) => Math.abs(q.x - x) < 8 && Math.abs(q.y + 6 - y) < 12); if (!c) return false; this.#bater(c); return true; }
  impacto(x, y) { for (const c of this.cs) if (Math.hypot(c.x - x, c.y + 6 - y) < 14) this.#bater(c); }
  desenhar(G0, G1) {
    const t = this.g.time;
    for (const c of this.cs) {
      const k = c.t < 3 ? 1 - c.t / 3 : 0, sh = (c.treme > 0 ? Math.sin(c.treme * 90) * 1.5 : 0) + (k ? Math.sin(t * 40) * k * 1.5 : 0);
      G1.moveTo(c.x, c.y - 10).lineTo(c.x + sh * 0.5, c.y - 2).stroke({ width: 0.8, color: 0xffffff, alpha: 0.7 });
      G1.ellipse(c.x + sh, c.y + 4, 4.5, 7).fill(k ? 0xe8e070 : 0xd8d0a0).stroke({ width: 1, color: 0x8a8050 });
      G1.moveTo(c.x - 3 + sh, c.y + 1).lineTo(c.x + 3 + sh, c.y + 2).moveTo(c.x - 3 + sh, c.y + 5).lineTo(c.x + 3 + sh, c.y + 6).stroke({ width: 0.8, color: 0xa89860 });
    }
    void G0;
  }
  estado() { return { casulos: this.cs.map((c) => ({ x: c.x, y: c.y, eclodeEm: +c.t.toFixed(1) })) }; }
}

// ======================================================================= escuro: as luzes apagam; só os candelabros iluminam (Zélia)
class Escuro extends Peca {
  iniciar() { this.cs = celulas(this.A, this.def.candelabros).map(([x, y]) => ({ x: x * T + 8, y: y * T + 8, aceso: true, prog: 0 })); this.ligou(); }
  ligou() { if (this.A.room) this.A.room.escuro = this.def.nivel ?? 0.8; }
  desligou() { if (this.A.room) this.A.room.escuro = this.A.antes?.escuro; for (const e of this.g.entities) if (!e.dead && e.alpha < 1) e.alpha = 1; }
  #luz(e) { const R = (this.def.raio ?? 3.6) * T * 0.9; return e.charging || e.mon.types.some((t) => t === 'fire' || t === 'electric') || this.cs.some((c) => c.aceso && Math.hypot(c.x - e.x, c.y - e.y) < R); }
  luzes(add) {
    const R = (this.def.raio ?? 3.6) * T, f = 0.94 + Math.sin(this.g.time * 9) * 0.04;
    for (const c of this.cs) if (c.aceso) add(c.x, c.y - 12, R * f);
    const l = this.A.lead; if (l) add(l.x, l.y - 10, 30, undefined, 0.8); // o seu Pokémon nunca some
  }
  sempre(dt) {
    if (!this.ativo) return;
    for (const e of this.A.lutadores()) if (e.side === 'foe') { const alvo = this.#luz(e) ? 1 : 0.22; e.alpha += (alvo - e.alpha) * Math.min(1, dt * 6); }
  }
  update(dt) {
    for (const c of this.cs) {
      if (c.aceso) continue;
      const perto = this.A.lutadores().find((e) => e.side !== 'foe' && Math.hypot(e.x - c.x, e.y - c.y) < 20 + e.r);
      if (perto) { c.prog += dt; if (c.prog >= (this.def.reacende ?? 1.5)) this.#acender(c); } else c.prog = Math.max(0, c.prog - dt);
    }
  }
  #acender(c) { c.aceso = true; c.prog = 0; this.g.fx.number(c.x, c.y - 26, 'Reacendeu!', 0xffd27a); this.g.fx.light(c.x, c.y - 12, 0xffb050, 60, 0.4, 1); this.g.audio?.sfx?.('sino'); this.A.torcida(0.5, true); }
  impacto(x, y, mv) { if (mv?.type === 'fire') for (const c of this.cs) if (!c.aceso && Math.hypot(c.x - x, c.y - y) < 22) this.#acender(c); }
  // líder (ou o fantasma dele): sopra o candelabro mais perto do seu Pokémon (fica sempre ao menos um aceso)
  lider(alvo) {
    const acesos = this.cs.filter((c) => c.aceso); if (acesos.length < 2) return false;
    const c = acesos.reduce((b, q) => (Math.hypot(q.x - alvo.x, q.y - alvo.y) < Math.hypot(b.x - alvo.x, b.y - alvo.y) ? q : b));
    this.A.avisar({ forma: 'circulo', x: c.x, y: c.y, r: 12, t: 1.2, cor: 0xb07aff, dano: false, rotulo: 'Uuuu…', corTexto: 0xd0b0ff, fonte: this, som: false, depois: () => { c.aceso = false; this.g.fx.emit(c.x, c.y - 14, { tex: 'smoke', n: 6, speed: 15, life: 1.2, scale: 0.6, end: 1.8, vz: 25, alpha: 0.5, add: false, color: 0x888888 }); this.g.audio?.sfx?.('whoosh'); } });
    return true;
  }
  objetivo(e) { // fantasma do líder gosta do escuro
    if (!this.A.doLider(e) || !e.mon.types.includes('ghost') || !this.#luz(e) || e.charging) return null;
    for (let i = 0; i < 8; i++) { const p = this.A.aleatorio(16); if (!this.cs.some((c) => c.aceso && Math.hypot(c.x - p.x, c.y - p.y) < (this.def.raio ?? 3.6) * T) && this.A.livre(p.x, p.y)) return { ...p, raio: 10, peso: 0.3 }; }
    return null;
  }
  desenhar(G0, G1) {
    const t = this.g.time;
    for (const c of this.cs) {
      if (c.aceso) { for (let i = -1; i <= 1; i++) G1.ellipse(c.x + i * 4, c.y - 16 + Math.sin(t * 12 + i) * 0.6, 1.4, 2.4).fill(0xffd050); }
      else if (c.prog > 0) G0.moveTo(c.x + 14, c.y).arc(c.x, c.y, 14, 0, TAU * c.prog / (this.def.reacende ?? 1.5)).stroke({ width: 2, color: 0xffd27a, alpha: 0.9 });
      else G0.circle(c.x, c.y, 14 + Math.sin(t * 3)).stroke({ width: 1, color: 0xffd27a, alpha: 0.3 });
    }
  }
  fim() { for (const e of this.g.entities) if (!e.dead && e.alpha < 1) e.alpha = 1; }
  estado() { return { escuro: this.def.nivel ?? 0.8, candelabros: this.cs.map((c) => ({ x: c.x, y: c.y, aceso: c.aceso })) }; }
}

// ======================================================================= móveis e quadros que voam (aviso: linha roxa do objeto até o alvo)
class Poltergeist extends Peca {
  iniciar() { this.tm = per(this.A, this.def.primeiro ?? this.def.periodo ?? [4, 6]); this.voos = []; this.lado = 0; }
  lancar(alvo) {
    const A = this.A, R = A.R, d = this.def;
    const lados = [[R.x0 + 6, rnd(R.y0 + 10, R.y1 - 10)], [R.x1 - 6, rnd(R.y0 + 10, R.y1 - 10)], [rnd(R.x0 + 10, R.x1 - 10), R.y0 + 6]];
    const [ox, oy] = lados.reduce((b, l) => (Math.hypot(l[0] - alvo.x, l[1] - alvo.y) > Math.hypot(b[0] - alvo.x, b[1] - alvo.y) ? l : b));
    const dx = alvo.x - ox, dy = alvo.y - oy, l = Math.hypot(dx, dy) || 1, L = Math.min(l + 60, 320);
    const v = { x: ox, y: oy, ux: dx / l, uy: dy / l, L, obj: pick(d.objetos ?? ['quadro', 'cadeira', 'vaso', 'livro']), st: 'sobe', p: 0, ang: 0 };
    v.av = A.avisar({ forma: 'linha', ax: ox, ay: oy, bx: ox + v.ux * L, by: oy + v.uy * L, w: 16, t: d.aviso ?? 1.1, cor: 0xb07aff, fonte: this, chao: false, depois: () => { v.st = 'voa'; this.g.audio?.sfx?.('whoosh'); } });
    this.voos.push(v);
  }
  update(dt) {
    const A = this.A, d = this.def;
    if ((this.tm -= dt) <= 0) { this.tm = per(A, d.periodo ?? [4, 6]); this.lado ^= 1; const ls = A.lutadores(); const alvo = ls.find((e) => (e.side === 'foe') === !!this.lado) ?? ls[0]; if (alvo) this.lancar(alvo); }
    for (const v of this.voos) {
      if (v.st !== 'voa') continue;
      const s = (d.vel ?? 230) * dt; v.p += s; v.ang += dt * 9;
      const x = v.x + v.ux * v.p, y = v.y + v.uy * v.p;
      const e = A.lutadores().find((q) => Math.hypot(q.x - x, q.y - y) < q.r + 7);
      if (e) { A.ferir(e, d.dano ?? 0.08, { dx: v.ux, dy: v.uy, knock: 1.2, tipo: 'normal', aviso: v.av, fonte: this, ar: true, forca: 70 }); this.#quebra(v, x, y); continue; }
      if (v.p >= v.L || this.g.map.solidAt(x, y)) this.#quebra(v, x, y);
    }
    this.voos = this.voos.filter((v) => v.st !== 'fim');
  }
  #quebra(v, x, y) { v.st = 'fim'; this.g.fx.emit(x, y - 6, { tex: 'clip', n: 10, speed: 80, life: 0.7, grav: 340, vz: 90, add: false, spin: 12, color: v.obj === 'vaso' ? 0x6a8ad8 : 0x8a5a2a }); this.g.audio?.sfx?.('break'); }
  lider(alvo) { this.lancar(alvo); return true; }
  perigoEm(x, y) { for (const v of this.voos) if (v.st === 'voa') { const k = ((x - v.x) * v.ux + (y - v.y) * v.uy); if (k > v.p - 10 && k < v.L && Math.abs((x - v.x) * v.uy - (y - v.y) * v.ux) < 12) return 1; } return 0; }
  desenhar(G0, G1) {
    const t = this.g.time;
    for (const v of this.voos) {
      const sobe = v.st === 'sobe', k = sobe && v.av ? v.av.t / v.av.dur : 1;
      const x = v.x + v.ux * v.p + (sobe ? Math.sin(t * 40) * 1.5 * k : 0), y = v.y + v.uy * v.p - (sobe ? 6 + 8 * k : 10);
      G0.ellipse(v.x + v.ux * v.p, v.y + v.uy * v.p + 2, 6, 2.5).fill({ color: 0x000000, alpha: 0.25 });
      const c = Math.cos(v.ang), s = Math.sin(v.ang), rot = (px, py) => [x + px * c - py * s, y + px * s + py * c];
      const quad = (w, h) => [...rot(-w, -h), ...rot(w, -h), ...rot(w, h), ...rot(-w, h)];
      if (v.obj === 'quadro') { G1.poly(quad(7, 5)).fill(0xc8a040).stroke({ width: 1, color: 0x6a5020 }); G1.poly(quad(5, 3)).fill(0x5a7aa8); }
      else if (v.obj === 'vaso') { G1.circle(x, y, 4.5).fill(0x6a8ad8).stroke({ width: 1, color: 0x2a3a6a }); G1.rect(x - 2, y - 7, 4, 3).fill(0x6a8ad8); }
      else if (v.obj === 'livro') G1.poly(quad(5, 3.5)).fill(0x8a2a3a).stroke({ width: 1, color: 0x3a0a10 });
      else { G1.poly(quad(5, 5)).fill(0x7a4a26).stroke({ width: 1, color: 0x3a2010 }); G1.poly([...rot(-5, -5), ...rot(-3, -5), ...rot(-3, -12), ...rot(-5, -12)]).fill(0x7a4a26); }
      if (sobe) G1.ellipse(x, y + 6, 6, 2).stroke({ width: 1, color: 0xb07aff, alpha: 0.6 });
    }
  }
  estado() { return { objetos: this.voos.map((v) => ({ x: v.x + v.ux * v.p, y: v.y + v.uy * v.p, objeto: v.obj, voando: v.st === 'voa' })) }; }
}

// ======================================================================= portas que teleportam (cores mostram os pares)
class Portas extends Peca {
  iniciar() { this.ds = []; (this.def.pares ?? []).forEach(([a, b], i) => { const pa = this.A.P(...a), pb = this.A.P(...b); this.ds.push({ ...pa, par: this.ds.length + 1, cor: i }, { ...pb, par: this.ds.length, cor: i }); }); this.trocando = 0; }
  #cor(i) { return [0xb07aff, 0x5ad8c8, 0xffb05a, 0xff6a9a][i % 4]; }
  update(dt) {
    const A = this.A, C = A.R;
    for (const e of A.lutadores()) {
      e.portaCd = (e.portaCd ?? 0) - dt; if (e.portaCd > 0 || A.voando(e)) continue;
      const d = this.ds.find((q) => Math.hypot(q.x - e.x, q.y - e.y) < 9); if (!d) continue;
      const o = this.ds[d.par], dx = C.cx - o.x, dy = C.cy - o.y, l = Math.hypot(dx, dy) || 1;
      this.g.fx.emit(e.x, e.y - 8, { tex: 'glow', color: this.#cor(d.cor), n: 8, speed: 50, life: 0.4 });
      e.x = o.x + dx / l * 16; e.y = o.y + dy / l * 16; e.kx = e.ky = 0; e.portaCd = this.def.recarga ?? 1.5; e.iframes = Math.max(e.iframes, 0.2);
      this.g.fx.emit(e.x, e.y - 8, { tex: 'glow', color: this.#cor(d.cor), n: 8, speed: 50, life: 0.4 }); this.g.audio?.sfx?.('teleport');
    }
  }
  evento() { // fase 2: as portas trocam de par (piscam antes)
    for (const d of this.ds) this.A.avisar({ forma: 'circulo', x: d.x, y: d.y, r: 12, t: 1.5, cor: 0xb07aff, dano: false, fonte: this, som: false });
    this.g.later(1.5 * this.A.K.aviso, () => {
      if (this.A.done) return;
      const idx = this.ds.map((_, i) => i).sort(() => Math.random() - 0.5);
      for (let i = 0; i + 1 < idx.length; i += 2) { const a = idx[i], b = idx[i + 1]; this.ds[a].par = b; this.ds[b].par = a; this.ds[a].cor = this.ds[b].cor = i / 2; }
      this.g.fx.number(this.A.R.cx, this.A.R.cy - 30, 'As portas mudaram!', 0xd0b0ff, true);
    });
  }
  objetivo(e) { // o Pokémon do líder usa a porta para aparecer atrás do seu
    const L = this.A.lead; if (!this.A.doLider(e) || !L || Math.hypot(L.x - e.x, L.y - e.y) < 110) return null;
    for (const d of this.ds) { const o = this.ds[d.par]; if (Math.hypot(o.x - L.x, o.y - L.y) < 70 && Math.hypot(d.x - e.x, d.y - e.y) < 140) return { x: d.x, y: d.y, raio: 4, peso: 0.35 }; }
    return null;
  }
  desenhar(G0) {
    const t = this.g.time;
    for (const d of this.ds) {
      const c = this.#cor(d.cor);
      G0.ellipse(d.x, d.y, 8, 5).fill({ color: c, alpha: 0.25 }).stroke({ width: 1.5, color: c, alpha: 0.8 });
      G0.moveTo(d.x + Math.cos(t * 3) * 6, d.y + Math.sin(t * 3) * 3.5).arc(d.x, d.y, 4, t * 3, t * 3 + 3).stroke({ width: 1, color: 0xffffff, alpha: 0.6 });
    }
  }
  estado() { return { portas: this.ds.map((d) => ({ x: d.x, y: d.y, par: d.par })) }; }
}

// ======================================================================= sombras falsas do Pokémon do líder (sem sombra no chão; um golpe as desfaz)
class Sombras extends Peca {
  iniciar() { this.ss = []; this.tm = 2; }
  ligou() { this.tm = 1.5; }
  update(dt) {
    const A = this.A, d = this.def, real = A.rival;
    if ((this.tm -= dt) <= 0 && real?.set) {
      this.tm = per(A, d.periodo ?? [14, 18]);
      this.#limpar();
      for (let i = 0; i < (d.n ?? 2); i++) {
        const sp = new PIXI.Sprite(real.body.texture); sp.anchor.copyFrom(real.body.anchor); sp.tint = 0xd8c8ff;
        const c = new PIXI.Container(); c.addChild(sp); A.g.ents.addChild(c);
        const p = A.aleatorio(20);
        this.ss.push({ c, sp, x: p.x, y: p.y, t: d.dur ?? 11, a: Math.random() * TAU, real });
        A.g.fx.emit(p.x, p.y - 10, { tex: 'smoke', n: 6, speed: 20, life: 0.7, scale: 0.7, end: 1.6, alpha: 0.5, add: false, color: 0x6a4a9a });
      }
      A.g.fx.number(real.x, real.y - (real.topH ?? 20) - 16, 'Sombras!', 0xd0b0ff, true);
    }
    for (const s of this.ss) {
      s.t -= dt; s.a += dt * 1.1;
      const R = s.real; if (!R?.alive) { s.t = 0; continue; }
      // andam em volta do seu Pokémon como o real faria, copiando o quadro de animação
      const L = A.lead ?? { x: A.R.cx, y: A.R.cy };
      const tx = L.x + Math.cos(s.a) * 70, ty = L.y + Math.sin(s.a) * 50;
      s.x += (tx - s.x) * Math.min(1, dt * 1.5); s.y += (ty - s.y) * Math.min(1, dt * 1.5);
      if (!A.dentro(s.x, s.y, -8)) { s.x = Math.max(A.R.x0 + 10, Math.min(A.R.x1 - 10, s.x)); s.y = Math.max(A.R.y0 + 10, Math.min(A.R.y1 - 10, s.y)); }
      s.sp.texture = R.body.texture; s.sp.anchor.copyFrom(R.body.anchor); s.sp.scale.copyFrom(R.body.scale);
      s.c.x = Math.round(s.x); s.c.y = Math.round(s.y); s.c.scale.set(R.view.scale.x); s.c.zIndex = s.y;
      s.c.alpha = Math.min(1, s.t) * (0.78 + 0.12 * Math.sin(this.g.time * 7 + s.a)) * (R.alpha ?? 1);
    }
    const fim = this.ss.filter((s) => s.t <= 0); for (const s of fim) this.#desfaz(s, false);
  }
  #desfaz(s, golpe) { if (s.morto) return; s.morto = true; this.g.fx.emit(s.x, s.y - 10, { tex: 'smoke', n: 8, speed: 30, life: 0.6, scale: 0.7, end: 1.8, alpha: 0.5, add: false, color: 0x6a4a9a }); if (golpe) { this.g.fx.number(s.x, s.y - 28, 'Era uma sombra!', 0xd0b0ff); this.g.audio?.sfx?.('whoosh'); } s.c.destroy({ children: true }); this.ss = this.ss.filter((q) => q !== s); }
  #limpar() { for (const s of this.ss.slice()) this.#desfaz(s, false); }
  bloqueia(x, y, mv, p) { const s = this.ss.find((q) => Math.abs(q.x - x) < 9 && Math.abs(q.y - y) < 14); if (!s) return false; this.#desfaz(s, true); return !!p; }
  impacto(x, y) { for (const s of this.ss.slice()) if (Math.hypot(s.x - x, s.y - y) < 14) this.#desfaz(s, true); }
  desligou() { this.#limpar(); }
  fim() { this.#limpar(); }
  estado() { return { sombras: this.ss.map((s) => ({ x: s.x, y: s.y })) }; }
}

// ======================================================================= o salão gira: tudo no chão é arrastado em volta do centro
class Giro extends Peca {
  iniciar() { this.sentido = 1; this.tm = per(this.A, this.def.periodo ?? 11); this.vira = 0; }
  update(dt) {
    const A = this.A, d = this.def, C = A.R;
    if ((this.tm -= dt) <= 0) { this.tm = per(A, d.periodo ?? 11); this.vira = 1.3 * A.K.aviso; A.g.fx.number(C.cx, C.cy - 30, 'O salão vai virar!', 0xd0b0ff, true); }
    if (this.vira > 0 && (this.vira -= dt) <= 0) { this.sentido *= -1; this.g.fx.kick(0.25, 0); }
    const F = (d.forca ?? 45) * 7 * (this.vira > 0 ? 0.3 : 1);
    for (const e of A.lutadores()) {
      if (A.voando(e)) continue;
      const dx = e.x - C.cx, dy = e.y - C.cy, l = Math.hypot(dx, dy) || 1;
      e.kx += -dy / l * F * this.sentido * dt * Math.min(1, l / 60); e.ky += dx / l * F * this.sentido * dt * Math.min(1, l / 60);
    }
  }
  desenhar(G0) {
    const C = this.A.R, t = this.g.time, R = Math.min(C.x1 - C.x0, C.y1 - C.y0) * 0.36, blink = this.vira > 0 && Math.sin(t * 30) > 0;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + t * 0.8 * this.sentido, x = C.cx + Math.cos(a) * R, y = C.cy + Math.sin(a) * R * 0.75, tx = -Math.sin(a) * this.sentido, ty = Math.cos(a) * this.sentido * 0.75;
      G0.moveTo(x - tx * 5 - ty * 3, y - ty * 5 + tx * 3).lineTo(x + tx * 3, y + ty * 3).lineTo(x - tx * 5 + ty * 3, y - ty * 5 - tx * 3);
    }
    G0.stroke({ width: 1.5, color: blink ? 0xffe27a : 0xb07aff, alpha: 0.6 });
    G0.ellipse(C.cx, C.cy, R, R * 0.75).stroke({ width: 1, color: 0xb07aff, alpha: 0.2 });
  }
  estado() { return { sentido: this.sentido }; }
}

// ======================================================================= colheita: o campo vai sendo cortado e a arena encolhe (Tomé, fase 2)
class Encolher extends Peca {
  iniciar() { this.i = 0; this.tm = 1; this.machT = 0; }
  ligou() { this.tm = 0.5; }
  #dentro(x, y, r = 0) { const R = this.A.R, I = this.i * T; return x > R.x0 + I + r && x < R.x1 - I - r && y > R.y0 + I + r && y < R.y1 - I - r; }
  update(dt) {
    const A = this.A, d = this.def, R = A.R;
    this.machT += dt;
    if ((this.tm -= dt) <= 0 && this.i < (d.aneis ?? 2) && !A.avisos.some((a) => a.fonte === this)) {
      this.tm = per(A, d.passo ?? 8);
      A.avisar({ forma: 'anel', x0: R.x0, y0: R.y0, x1: R.x1, y1: R.y1, i: (this.i + 1) * T, t: d.aviso ?? 1.8, cor: 0xffb030, rotulo: d.rotulo ?? 'A colheitadeira vem aí!', fonte: this,
        depois: () => { this.i++; const I = this.i * T; for (const r of [{ x0: R.x0, x1: R.x1, y0: R.y0, y1: R.y0 + I }, { x0: R.x0, x1: R.x1, y0: R.y1 - I, y1: R.y1 }, { x0: R.x0, x1: R.x0 + I, y0: R.y0, y1: R.y1 }, { x0: R.x1 - I, x1: R.x1, y0: R.y0, y1: R.y1 }]) for (const pc of A.pecas) if (pc !== this) pc.varrer?.(r); this.g.audio?.sfx?.('quake'); } });
    }
    if (!this.i) return;
    for (const e of A.lutadores()) {
      if (this.#dentro(e.x, e.y, e.r * 0.5)) { e.colheT = 0.3; continue; }
      const dx = R.cx - e.x, dy = R.cy - e.y, l = Math.hypot(dx, dy) || 1;
      e.kx += dx / l * 900 * dt; e.ky += dy / l * 900 * dt;
      e.colheT = (e.colheT ?? 0.3) - dt;
      if (e.colheT <= 0) { e.colheT = 0.7; if (A.ferir(e, d.dano ?? 0.05, { aviso: 'terreno', fonte: this, dx: dx / l, dy: dy / l, knock: 0.6 })) this.g.fx.number(e.x, e.y - 30, 'Colheitadeira!', 0xffb030); }
    }
  }
  perigoEm(x, y) { return this.i && !this.#dentro(x, y, 4) ? 1 : 0; }
  desenhar(G0, G1) {
    if (!this.i) return;
    const R = this.A.R, I = this.i * T;
    G0.rect(R.x0, R.y0, R.x1 - R.x0, I).rect(R.x0, R.y1 - I, R.x1 - R.x0, I).rect(R.x0, R.y0 + I, I, R.y1 - R.y0 - 2 * I).rect(R.x1 - I, R.y0 + I, I, R.y1 - R.y0 - 2 * I).fill({ color: 0xc8a050, alpha: 0.55 });
    for (let x = R.x0 + 2; x < R.x1; x += 5) { G0.moveTo(x, R.y0 + 3).lineTo(x + 1, R.y0 + I - 3).moveTo(x, R.y1 - I + 3).lineTo(x + 1, R.y1 - 3); }
    G0.stroke({ width: 1, color: 0x8a6a28, alpha: 0.6 });
    G0.rect(R.x0 + I, R.y0 + I, R.x1 - R.x0 - 2 * I, R.y1 - R.y0 - 2 * I).stroke({ width: 1.5, color: 0xffb030, alpha: 0.7 });
    // a colheitadeira rodando no anel cortado
    const W = R.x1 - R.x0 - I, H = R.y1 - R.y0 - I, P = 2 * (W + H), s = (this.machT * 90) % P;
    let x, y; if (s < W) { x = R.x0 + I / 2 + s; y = R.y0 + I / 2; } else if (s < W + H) { x = R.x1 - I / 2; y = R.y0 + I / 2 + s - W; } else if (s < 2 * W + H) { x = R.x1 - I / 2 - (s - W - H); y = R.y1 - I / 2; } else { x = R.x0 + I / 2; y = R.y1 - I / 2 - (s - 2 * W - H); }
    G1.rect(x - 8, y - 7, 16, 12).fill(0x3a9a3a).stroke({ width: 1, color: 0x1a4a1a }).rect(x - 3, y - 11, 6, 5).fill(0x9ad0ff);
  }
  estado() { return { recuo: this.i }; }
}

// ======================================================================= ritmo do berimbau (Brás): golpe no tempo vale mais
class Ritmo extends Peca {
  iniciar() { this.b0 = this.A.t; this.ult = -1; this.pulso = 0; }
  get tb() { return 60 / (this.def.bpm ?? 96); }
  #fase() { return ((this.A.t - this.b0) % this.tb) / this.tb; }
  sempre(dt) {
    const n = Math.floor((this.A.t - this.b0) / this.tb);
    if (n !== this.ult) { this.ult = n; this.pulso = 1; if (n % (this.def.compasso ?? 2) === 0) this.g.audio?.sfx?.('berimbau'); }
    this.pulso = Math.max(0, this.pulso - dt * 4);
  }
  aoUsar(user) {
    const f = this.#fase(), dist = Math.min(f, 1 - f) * this.tb;
    if (dist <= (this.def.janela ?? 0.14)) { user.noRitmo = { ate: this.g.time + 3, mult: this.def.bonus ?? 1.3 }; this.g.fx.number(user.x, user.y - (user.topH ?? 20) - 18, 'No ritmo!', 0xffd84a, true); this.A.torcida(0.3); }
  }
  modDano(user) { const r = user.noRitmo; if (!r || this.g.time > r.ate) return 1; user.noRitmo = null; return r.mult; }
  desenhar(G0) {
    const k = this.pulso, C = this.A.R;
    G0.circle(C.cx, C.cy, 18 + k * 10).stroke({ width: 2, color: 0xffd84a, alpha: 0.2 + 0.6 * k });
    for (const e of this.A.lutadores()) G0.ellipse(e.x, e.y + 1, e.r + 4 + k * 6, (e.r + 4 + k * 6) * 0.5).stroke({ width: 1, color: 0xffd84a, alpha: 0.5 * k });
  }
  estado() { return { bpm: this.def.bpm ?? 96, fase: +this.#fase().toFixed(2) }; }
}

// ======================================================================= tábuas que racham e quebram (o rachado é o aviso)
class Tabuas extends Peca {
  iniciar() { this.cs = new Map(); for (const [x, y] of celulas(this.A, this.def.celulas)) this.cs.set(key(x, y), { tx: x, ty: y, st: 'ok', t: 0 }); }
  #em(x, y) { return this.cs.get(key(Math.floor(x / T), Math.floor(y / T))); }
  update(dt) {
    const A = this.A, d = this.def;
    for (const c of this.cs.values()) { if (c.st === 'racha' && (c.t -= dt) <= 0) { c.st = 'buraco'; c.t = d.buraco ?? 7; this.g.audio?.sfx?.('crack'); } else if (c.st === 'buraco' && (c.t -= dt) <= 0) c.st = 'ok'; }
    for (const e of A.lutadores()) {
      if (A.voando(e)) continue;
      const c = this.#em(e.x, e.y); if (!c) continue;
      if (c.st === 'ok') { e.tabT = (e.tabT ?? 0) + dt; if (e.tabT > 0.5) { e.tabT = 0; c.st = 'racha'; c.t = (d.quebra ?? 1.2) * A.K.aviso; } }
      else if (c.st === 'buraco') this.#cair(e, c);
    }
  }
  #cair(e, c) {
    const A = this.A; let best = null, bd = 1e9;
    for (const q of this.cs.values()) if (q.st === 'ok') { const d = Math.hypot(q.tx * T + 8 - e.x, q.ty * T + 8 - e.y); if (d < bd) { bd = d; best = q; } }
    A.ferir(e, this.def.dano ?? 0.06, { aviso: { dur: (this.def.quebra ?? 1.2) * A.K.aviso }, fonte: this, knock: 0 });
    if (best) { e.x = best.tx * T + 8; e.y = best.ty * T + 8; }
    e.iframes = Math.max(e.iframes, 0.8); this.g.fx.number(e.x, e.y - 30, 'Caiu no buraco!', 0xe8c080);
  }
  impacto(x, y, mv, P) { const c = this.#em(x, y); if (c && c.st === 'ok' && (forte(mv, P) && mv?.cat === 'phys' || ['ground', 'rock', 'fighting'].includes(mv?.type))) { c.st = 'racha'; c.t = (this.def.quebra ?? 1.2) * this.A.K.aviso; } }
  perigoEm(x, y, e) { if (e && this.A.voando(e)) return 0; const c = this.#em(x, y); return !c ? 0 : c.st === 'buraco' ? 1 : c.st === 'racha' ? 0.5 : 0; }
  desenhar(G0) {
    for (const c of this.cs.values()) {
      const x = c.tx * T, y = c.ty * T;
      if (c.st === 'buraco') { G0.rect(x + 1, y + 1, T - 2, T - 2).fill({ color: 0x0a0806, alpha: 0.9 }); continue; }
      G0.rect(x, y, T, T).fill({ color: 0x9a6a3a, alpha: 0.85 }); G0.moveTo(x, y + 5).lineTo(x + T, y + 5).moveTo(x, y + 11).lineTo(x + T, y + 11).stroke({ width: 1, color: 0x5a3a1a, alpha: 0.7 });
      if (c.st === 'racha') G0.moveTo(x + 3, y + 2).lineTo(x + 8, y + 8).lineTo(x + 6, y + 14).moveTo(x + 8, y + 8).lineTo(x + 13, y + 6).stroke({ width: 1.2, color: 0x1a0a00 });
    }
  }
  estado() { return { tabuas: [...this.cs.values()].map((c) => ({ x: c.tx, y: c.ty, estado: c.st })) }; }
}

// ======================================================================= corda do ringue: quem é jogado contra ela volta lançado
class Corda extends Peca {
  iniciar() { this.vib = 0; }
  sempre(dt) {
    if (!this.ativo) return;
    const A = this.A, R = A.R, d = this.def; this.vib = Math.max(0, this.vib - dt * 3);
    for (const e of A.lutadores()) {
      e.lancT = (e.lancT ?? 0) - dt;
      const bate = (pos, lim, sinal, eixo) => {
        const v = eixo === 'x' ? e.kx : e.ky; if ((pos - lim) * sinal < -e.r - 2 || v * sinal < 90) return false;
        if (eixo === 'x') e.kx = -e.kx * (d.forca ?? 1.5); else e.ky = -e.ky * (d.forca ?? 1.5);
        e.lancT = 0.6; this.vib = 1; this.g.fx.number(e.x, e.y - 30, 'A corda lançou!', 0xffd84a); this.g.audio?.sfx?.('jump'); return true;
      };
      bate(e.x, R.x1, 1, 'x') || bate(e.x, R.x0, -1, 'x') || bate(e.y, R.y1, 1, 'y') || bate(e.y, R.y0, -1, 'y');
      if (e.lancT > 0) for (const o of A.lutadores()) if (o !== e && o.side !== e.side && Math.hypot(o.x - e.x, o.y - e.y) < o.r + e.r + 2) { e.lancT = 0; A.ferir(o, d.dano ?? 0.06, { aviso: 'consequencia', fonte: this, dx: Math.sign(e.kx), dy: Math.sign(e.ky) }); }
    }
  }
  desenhar(G0, G1) {
    const R = this.A.R, w = Math.sin(this.g.time * 40) * this.vib * 2;
    for (let i = 0; i < 3; i++) { const o = -4 - i * 4; G1.moveTo(R.x0, R.y0 + o).quadraticCurveTo(R.cx, R.y0 + o + w, R.x1, R.y0 + o).moveTo(R.x0, R.y1 + o).quadraticCurveTo(R.cx, R.y1 + o - w, R.x1, R.y1 + o); }
    G1.stroke({ width: 1, color: 0xe8e0c8, alpha: 0.8 });
    for (const [x, y] of [[R.x0, R.y0], [R.x1, R.y0], [R.x0, R.y1], [R.x1, R.y1]]) G1.rect(x - 2, y - 16, 4, 16).fill(0x7a4a26);
    void G0;
  }
}

// ======================================================================= plataformas no alto: fora delas é queda (Celeste)
class Queda extends Peca {
  iniciar() { this.ps = (this.def.plataformas ?? []).map((r) => this.A.rectPx(r)); this.nuvens = Array.from({ length: 6 }, () => ({ ...this.A.aleatorio(0), v: rnd(6, 14) })); }
  na(x, y) { return this.ps.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1) || this.A.pecas.some((p) => p.plataformaEm?.(x, y)); }
  update(dt) {
    const A = this.A;
    for (const e of A.lutadores()) {
      if (A.voando(e) || this.na(e.x, e.y)) { e.quedaT = 0; continue; }
      e.quedaT = (e.quedaT ?? 0) + dt; if (e.quedaT < 0.15) continue;
      e.quedaT = 0;
      const doi = this.g.time - (e.caiuT ?? -99) > 3; e.caiuT = this.g.time; // duas quedas seguidas: só volta, sem dano
      let best = null, bd = 1e9; for (const r of this.ps) { const x = Math.max(r.x0 + 10, Math.min(r.x1 - 10, e.x)), y = Math.max(r.y0 + 10, Math.min(r.y1 - 10, e.y)), d = Math.hypot(x - e.x, y - e.y); if (d < bd) { bd = d; best = { x, y }; } }
      if (doi) { e.iframes = 0; A.ferir(e, this.def.dano ?? 0.1, { aviso: 'terreno', fonte: this, knock: 0 }); }
      if (best) { e.x = best.x; e.y = best.y; e.kx = e.ky = 0; }
      e.iframes = Math.max(e.iframes, 1.5); e.lock = Math.max(e.lock, 0.4); this.g.fx.number(e.x, e.y - 30, 'Caiu!', 0x9ad0ff, true);
    }
  }
  perigoEm(x, y, e) { return e && this.A.voando(e) ? 0 : this.na(x, y) ? 0 : 1; }
  desenhar(G0) {
    const R = this.A.R;
    G0.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0).fill({ color: 0x6aa8e8 });
    for (const n of this.nuvens) { n.x += n.v / 60; if (n.x > R.x1 + 20) n.x = R.x0 - 20; G0.ellipse(n.x, n.y, 18, 6).fill({ color: 0xffffff, alpha: 0.5 }); }
    for (const r of this.ps) { G0.rect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0).fill(0xb8b0a0).stroke({ width: 2, color: 0x6a6458 }); G0.rect(r.x0, r.y1, r.x1 - r.x0, 4).fill(0x7a7468); }
  }
  estado() { return { plataformas: this.ps }; }
}

export const PECAS = {
  plateia: Plateia, milho: Milho, faixa: Faixa, marcas: Marcas, paineis: Paineis, gerador: Gerador, pararaio: Pararaio,
  inundacao: Inundacao, correnteza: Correnteza, plataforma: Plataforma, alavanca: Alavanca, cobertura: Cobertura,
  teia: Teia, planta: Planta, casulo: Casulo, escuro: Escuro, poltergeist: Poltergeist, portas: Portas, sombras: Sombras,
  giro: Giro, encolher: Encolher, ritmo: Ritmo, tabuas: Tabuas, corda: Corda, queda: Queda,
};
