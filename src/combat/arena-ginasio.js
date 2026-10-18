import * as PIXI from 'pixi.js';
import { T } from '../world/tiles.js';
import { effectiveness } from '../data/types.js';
import { ARENAS } from '../data/arenas.js';
import { PECAS } from './arena-pecas.js';

// Arena dinâmica dos ginásios (docs/arenas.md). A luta contra o líder ganha um palco vivo, montado por DADOS
// (src/data/arenas.js) em cima da sala ou do pedaço de mapa do ginásio:
// - perigos do terreno ligados ao tipo, que mudam durante a luta (src/combat/arena-pecas.js);
// - FASES: quando o líder perde um Pokémon ou a equipe dele chega à metade dos PS, a arena se transforma, com uma
//   cena curta (câmera, faixa, fala do líder, plateia) em que ninguém apanha;
// - peças que os dois lados usam: alavancas, geradores, plataformas, coberturas que quebram;
// - IA do líder: os Pokémon dele fogem dos avisos, se escondem, vão às peças úteis e usam a fase a favor; o próprio
//   líder aciona perigos de tempos em tempos (gritando antes);
// - plateia que torce, música que muda na fase final e entrada especial do último Pokémon.
// Duas regras valem para tudo: TODO perigo que tira PS passa por um aviso visual antes (avisar(), com tempo mínimo
// AVISO_MIN) e a dificuldade sai do nível do ginásio (nível do ás), nunca do jogador.
//
// Uso: TrainerBattle cria com arenaPara(batalha). Ganchos no jogo: combat/arena.js (projéteis e impactos), damage.js
// (água e cargas), pokemon.js (velocidade), main.js (câmera), masmorra.js (luzes da sala escura), hud.js (fase).
// Estado para outros desenhos (3D): estado() e onEvento(fn), descritos em docs/arenas.md.

export const AVISO_MIN = 0.75; // nenhum perigo acerta com menos aviso que isso (s)
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const SIDES = new Set(['ally', 'foe', 'aliado']);

// Curvas de dificuldade: d = 0 no ginásio mais fácil (ás ~10), d = 1 no mais difícil (ás ~44)
export const DIFICULDADE = {
  d: (nivel) => clamp((nivel - 10) / 34, 0, 1),
  aviso: (d) => 1.3 - 0.4 * d,      // × tempo de aviso de cada perigo
  dano: (d) => 0.75 + 0.5 * d,      // × fração dos PS que o perigo tira
  ritmo: (d) => 1.1 - 0.35 * d,     // × intervalo entre perigos
  vigor: (d) => 1.7 + 0.3 * d,      // × PS máximos dos Pokémon do líder (a luta dura o bastante para a arena acontecer)
  reacao: (d) => 0.55 - 0.35 * d,   // s até a IA reagir a um aviso
  esperteza: (d) => 0.4 + 0.5 * d,  // chance de a IA usar a arena (peças, cobertura, fase)
  lider: (d) => 9 - 3 * d,         // s entre um perigo acionado pelo líder e o próximo
};

export function arenaPara(b) {
  const cfg = b.def?.arenaGinasio ?? ARENAS[b.def?.id];
  if (!cfg || b.opts?.semArena) return null;
  try { return new ArenaGinasio(b, cfg); } catch (err) { console.warn('arena do ginásio não montou:', err); return null; }
}

export class ArenaGinasio {
  constructor(b, cfg) {
    const g = this.g = b.g; this.b = b; this.cfg = cfg;
    const room = cfg.sala ? g.map.interiors.find((r) => r.id === cfg.sala) : null;
    if (cfg.sala && !room) throw new Error('sala ' + cfg.sala + ' não existe');
    this.room = room; this.o = room ? { x: room.x, y: room.y } : { x: 0, y: 0 };
    const [ax, ay, aw, ah] = cfg.area;
    this.R = { x0: (this.o.x + ax) * T, y0: (this.o.y + ay) * T, x1: (this.o.x + ax + aw) * T, y1: (this.o.y + ay + ah) * T };
    this.R.cx = (this.R.x0 + this.R.x1) / 2; this.R.cy = (this.R.y0 + this.R.y1) / 2;
    // dificuldade: o nível do ginásio é o do ás (último da equipe)
    this.nivel = Math.max(...b.team.map((m) => m.level));
    const d = this.d = DIFICULDADE.d(this.nivel);
    this.K = { aviso: DIFICULDADE.aviso(d), dano: DIFICULDADE.dano(d), ritmo: DIFICULDADE.ritmo(d) };
    this.reacao = DIFICULDADE.reacao(d); this.esperteza = DIFICULDADE.esperteza(d);
    // Pokémon de líder aguentam mais (como chefe): sem isso a luta acabava em 30 s e a arena mal mudava de fase
    const vg = cfg.vigor ?? DIFICULDADE.vigor(d);
    for (const m of b.team) if (!m.vigorK) { m.vigorK = vg; m.calc(); m.hp = m.stats.hp; }
    this.t = 0; this.done = false; this.fase = -1; this.cenaT = 0; this.liderT = DIFICULDADE.lider(d) * 0.8;
    this.avisos = []; this.tiles = new Map(); this.blocks = new Map(); this.gfxs = []; this.ajudantes = [];
    this.ouvintes = []; this.lutT = 0; this.cache = [];
    this.stats = { avisos: 0, golpes: 0, semAviso: 0, minAviso: Infinity, acertos: { ally: 0, foe: 0 }, porPerigo: {}, fases: [], inicio: performance.now() };
    // camadas: chão (abaixo de todos) e topo (acima de todos)
    this.G0 = new PIXI.Graphics(); g.fx.ground.addChild(this.G0);
    this.G1 = new PIXI.Graphics(); g.combat.layer.addChild(this.G1);
    // avisos por cima de tudo, inclusive da sombra das salas escuras e do mapa de luz: perigo sempre legível
    this.topo = new PIXI.Container(); this.GA = new PIXI.Graphics(); this.topo.addChild(this.GA); g.app.stage.addChild(this.topo);
    // Mega/Dynamax (src/combat/poder.js): a arena escolhe a hora; o Dynamax vale para os dois lados neste ginásio
    if (cfg.poder) { b.poder = { usado: true }; if (cfg.poder.tipo === 'dynamax') b.def.dynamax = true; }
    this.pecas = []; this.porId = new Map();
    for (const def of cfg.pecas ?? []) {
      const K = PECAS[def.tipo]; if (!K) { console.error('arena: peça desconhecida', def.tipo); continue; }
      const p = new K(this, { ...def }); p.id = def.id ?? def.tipo; p.ativo = def.ativo !== false;
      this.pecas.push(p); this.porId.set(p.id, p);
    }
  }

  // ---------------------------------------------------------------- geometria
  P(x, y) { return { x: (this.o.x + x) * T + 8, y: (this.o.y + y) * T + 8 }; }  // bloco relativo (centro) → px
  Q(x, y) { return { x: (this.o.x + x) * T, y: (this.o.y + y) * T }; }          // canto do bloco relativo → px
  abs(x, y) { return [this.o.x + x, this.o.y + y]; }                            // bloco relativo → absoluto
  dentro(x, y, m = 0) { const R = this.R; return x >= R.x0 - m && x <= R.x1 + m && y >= R.y0 - m && y <= R.y1 + m; }
  rectPx([x, y, w, h]) { const a = this.Q(x, y); return { x0: a.x, y0: a.y, x1: a.x + w * T, y1: a.y + h * T }; }
  peca(id) { return this.porId.get(id); }
  aleatorio(m = 12) { const R = this.R; return { x: R.x0 + m + Math.random() * (R.x1 - R.x0 - 2 * m), y: R.y0 + m + Math.random() * (R.y1 - R.y0 - 2 * m) }; }
  livre(x, y, r = 5) { return this.dentro(x, y, -2) && !this.g.map.solidAt(x, y) && !this.g.map.solidAt(x + r, y) && !this.g.map.solidAt(x - r, y) && !this.g.map.solidAt(x, y + r) && !this.g.map.solidAt(x, y - r); }
  // troca um bloco do mapa durante a luta (guarda o original para devolver no fim)
  trocaTile(tx, ty, t) { const m = this.g.map, k = tx + ty * m.w; if (!this.tiles.has(k)) this.tiles.set(k, m.at(tx, ty)); if (m.at(tx, ty) !== t) m.setTile(tx, ty, t); }
  tileOriginal(tx, ty) { const m = this.g.map, k = tx + ty * m.w; return this.tiles.has(k) ? this.tiles.get(k) : m.at(tx, ty); }
  bloquear(tx, ty, on) { const m = this.g.map, k = tx + ty * m.w; if (!this.blocks.has(k)) this.blocks.set(k, m.block[k]); m.block[k] = on ? 1 : this.blocks.get(k); }
  gfx(z = 0, top = false) { const G = new PIXI.Graphics(); G.zIndex = z; (top ? this.g.combat.layer : this.g.ents).addChild(G); this.gfxs.push(G); return G; }

  // ---------------------------------------------------------------- quem luta
  lutadores() {
    if (this.lutT === this.g.time) return this.cache;
    this.lutT = this.g.time;
    this.cache = this.g.entities.filter((e) => e.alive && !e.busy && !e.dead && SIDES.has(e.side) && this.dentro(e.x, e.y, 24));
    return this.cache;
  }
  voando(e) { return e.alt?.mode === 'fly' || e.z > 14; }
  nadador(e) { return !!e.mon?.types?.includes('water') || e.alt?.mode === 'dive'; }
  doLider(e) { return e.side === 'foe'; }
  get lead() { const l = this.g.lead; return l?.alive ? l : null; }
  get rival() { return this.b.active.find((e) => e.alive) ?? null; }

  // ---------------------------------------------------------------- avisos (telegrafia)
  // Todo perigo que fere passa por aqui: o desenho aparece já, cresce até a hora e pisca no fim; depois() roda o golpe.
  // forma: circulo {x,y,r} · faixa {x0,y0,x1,y1,dir} · celulas {cells:[[tx,ty]]} · linha {ax,ay,bx,by,w} · anel {x0,y0,x1,y1,i}
  avisar(o) {
    const base = o.t ?? 1.2;
    const dur = Math.max(AVISO_MIN, base * this.K.aviso);
    const av = { ...o, t: 0, dur, cor: o.cor ?? 0xff5a2a, id: ++this.stats.avisos };
    if (av.forma === 'celulas') av.set = new Set(av.cells.map(([x, y]) => x + ',' + y));
    this.avisos.push(av);
    if (o.som !== false) this.g.combat?.sfx('warn', null, 0.25);
    if (o.rotulo) { const c = this.centroAviso(av); this.g.fx.number(c.x, c.y - 14, o.rotulo, o.corTexto ?? 0xffd84a, true); }
    this.emitir('aviso', { id: av.id, forma: av.forma, dur, fonte: o.fonte?.id });
    return av;
  }
  centroAviso(av) {
    switch (av.forma) {
      case 'circulo': return { x: av.x, y: av.y };
      case 'linha': return { x: (av.ax + av.bx) / 2, y: (av.ay + av.by) / 2 };
      case 'celulas': { let x = 0, y = 0; for (const [a, b] of av.cells) { x += a; y += b; } const n = av.cells.length || 1; return { x: x / n * T + 8, y: y / n * T + 8 }; }
      default: return { x: (av.x0 + av.x1) / 2, y: (av.y0 + av.y1) / 2 };
    }
  }
  cobre(av, x, y, r = 0) {
    switch (av.forma) {
      case 'circulo': return Math.hypot(x - av.x, y - av.y) < av.r + r;
      case 'faixa': return x > av.x0 - r && x < av.x1 + r && y > av.y0 - r && y < av.y1 + r;
      case 'celulas': return av.set.has(Math.floor(x / T) + ',' + Math.floor(y / T));
      case 'linha': { const vx = av.bx - av.ax, vy = av.by - av.ay, l2 = vx * vx + vy * vy || 1, k = clamp(((x - av.ax) * vx + (y - av.ay) * vy) / l2, 0, 1); return Math.hypot(x - (av.ax + vx * k), y - (av.ay + vy * k)) < av.w / 2 + r; }
      case 'anel': { const inside = x > av.x0 && x < av.x1 && y > av.y0 && y < av.y1, inner = x > av.x0 + av.i + r && x < av.x1 - av.i - r && y > av.y0 + av.i + r && y < av.y1 - av.i - r; return inside && !inner; }
    }
    return false;
  }
  // risco no ponto para quem está em e (0..1): avisos em andamento + zonas ativas das peças
  perigo(x, y, e = null) {
    let p = 0;
    const r = (e?.r ?? 6) + 3, voa = e && this.voando(e);
    for (const av of this.avisos) if (av.dano !== false && !(voa && av.chao) && this.cobre(av, x, y, r)) p = Math.max(p, 0.6 + 0.4 * (av.t / av.dur));
    for (const pc of this.pecas) if (pc.ativo && pc.perigoEm) p = Math.max(p, pc.perigoEm(x, y, e) ?? 0);
    return p;
  }

  // dano de perigo: fração dos PS máximos (justo em qualquer nível), escalada pela dificuldade do ginásio
  ferir(e, frac, o = {}) {
    if (!e?.alive || e.dead || this.cenaT > 0) return false;
    const g = this.g;
    if (e.iframes > 0) { if ((e.missT ?? 0) < g.time) { e.missT = g.time + 0.35; g.fx.number(e.x, e.y - (e.topH ?? 20) - 10, 'Esquivou!', '#d8f0ff'); } return false; }
    if (o.chao !== false && this.voando(e) && !o.ar) return false;
    const tipo = o.tipo ?? 'normal', eff = effectiveness(tipo, e.mon.types);
    if (eff === 0) { if ((e.noteT ?? 0) < g.time) { e.noteT = g.time + 1.2; g.fx.number(e.x, e.y - (e.topH ?? 20) - 12, 'Não afeta...', 0xbbbbbb); } return false; }
    const k = eff > 1 ? 1.25 : eff < 1 ? 0.75 : 1;
    const dmg = Math.max(1, Math.round(e.mon.stats.hp * frac * this.K.dano * k));
    const aviso = o.aviso;
    // estatística da justiça: quanto aviso esse golpe teve (terreno contínuo = 'terreno', anunciado pela fase)
    const s = this.stats; s.golpes++; s.acertos[e.side === 'foe' ? 'foe' : 'ally']++;
    const nome = o.fonte?.id ?? 'arena'; s.porPerigo[nome] = (s.porPerigo[nome] ?? 0) + 1;
    if (aviso === 'terreno') { /* zona visível o tempo todo */ } else if (aviso && aviso.dur) s.minAviso = Math.min(s.minAviso, aviso.dur); else s.semAviso++;
    g.combat.hurt(e, dmg, null, { mv: { type: tipo, power: o.forca ?? 50, cat: 'phys' }, dx: o.dx ?? 0, dy: o.dy ?? 0, knock: o.knock ?? 1, eff: eff > 1 ? eff : 1, note: o.texto ?? null });
    if (o.status && !e.mon.status && Math.random() < (o.chance ?? 0.2)) { e.mon.status = o.status; g.fx.number(e.x, e.y - 34, { par: 'Paralisado!', brn: 'Queimado!', psn: 'Envenenado!' }[o.status] ?? o.status, '#ff9adf'); }
    if (o.prende) { e.stun = Math.max(e.stun, o.prende); }
    this.torcida(e.side === 'foe' ? 0.5 : 0.35);
    this.emitir('golpe', { fonte: nome, alvo: e.mon?.name, lado: e.side, dano: dmg });
    return true;
  }

  // ---------------------------------------------------------------- ciclo da luta
  async abertura() {
    const g = this.g, cfg = this.cfg, npc = this.b.npc;
    g.arenaGinasio = this;
    this.antes = { escuro: this.room?.escuro, dark: this.room?.dark, musica: g.audio?.track };
    if (cfg.acende && this.room) this.room.dark = false; // a sala do líder acende para a luta (o farol com os geradores ligados)
    for (const p of this.pecas) p.iniciar?.();
    const pos = cfg.posicoes;
    if (pos) {
      await g.ui.fade(() => {
        const pj = this.P(...pos.jogador), pl = this.P(...pos.lider);
        const p = g.player; p.x = pj.x; p.y = pj.y; p.vx = p.vy = p.kx = p.ky = 0; p.dir = 'up';
        if (g.lead) { g.lead.x = p.x; g.lead.y = p.y - 16; }
        if (npc?.place) npc.place(pl.x, pl.y, 'down'); else if (npc) { npc.x = pl.x; npc.y = pl.y; }
        g.cam.x = this.R.cx; g.cam.y = this.R.cy;
      }, 260);
    }
    g.audio?.music?.(cfg.musica?.luta ?? 'gym');
    this.#entrarFase(0, true);
    // apresentação: a câmera passeia pela arena enquanto o nome aparece
    await this.cena({ foco: { x: this.R.cx, y: this.R.cy }, dur: 1.5, titulo: cfg.nome, fala: cfg.abertura, quem: npc, cor: cfg.cor, som: 'whistle', forca: 1 });
  }

  // cena curta: câmera vai a um ponto, faixa e fala; ninguém age nem apanha enquanto dura
  cena({ foco, dur = 1.5, titulo, fala, quem, cor = '#ffe27a', som = null, tremor = 0, forca = 0.8 } = {}) {
    const g = this.g;
    this.cenaT = dur;
    for (const e of this.lutadores()) { e.lock = Math.max(e.lock, dur); e.iframes = Math.max(e.iframes, dur + 0.35); e.charging = null; e.vx = e.vy = 0; }
    if (foco) g.camFocus = foco;
    if (titulo) g.ui?.banner?.(titulo, typeof cor === 'number' ? '#' + cor.toString(16).padStart(6, '0') : cor);
    if (fala) { g.toast(`${this.b.def.name}: ${fala}`); quem?.exclaim?.('!'); quem?.throwPose?.(); }
    if (tremor) g.fx.kick(tremor, 0);
    if (som) g.audio?.sfx?.(som);
    this.torcida(forca, true);
    return new Promise((r) => g.later(dur, () => { if (g.camFocus === foco) g.camFocus = null; r(); }));
  }

  #entrarFase(i, silencioso = false) {
    const f = this.cfg.fases?.[i]; if (!f) return;
    this.fase = i;
    for (const id of f.liga ?? []) { const p = this.peca(id); if (p) { p.ativo = true; p.ligou?.(); } }
    for (const id of f.desliga ?? []) { const p = this.peca(id); if (p) { p.ativo = false; p.desligou?.(); } }
    for (const [id, aj] of Object.entries(f.ajusta ?? {})) this.peca(id)?.ajustar?.(aj);
    this.stats.fases.push({ fase: f.id, t: +this.t.toFixed(1), desmaios: this.b.fainted ?? 0 });
    this.emitir('fase', { fase: f.id, nome: f.nome });
    if (f.musica) this.g.audio?.music?.(f.musica);
    if (silencioso) return;
    for (const id of f.evento ?? []) this.peca(id)?.evento?.(f);
    const foco = f.camera === 'lider' && this.b.npc ? { x: this.b.npc.x, y: this.b.npc.y } : { x: this.R.cx, y: this.R.cy };
    this.cena({ foco, dur: f.dur ?? 1.8, titulo: f.titulo, fala: f.fala, quem: this.b.npc, cor: f.cor ?? this.cfg.cor, som: f.som ?? 'quake', tremor: f.tremor ?? 0.35, forca: 1 });
  }
  #condicao(q) {
    if (!q) return false;
    const b = this.b, as = b.team[b.team.length - 1];
    if (q.desmaios != null && (b.fainted ?? 0) >= q.desmaios) return true;
    if (q.psEquipe != null) { let hp = 0, mx = 0; for (const m of b.team) { hp += Math.max(0, m.hp); mx += m.stats.hp; } if (hp / mx <= q.psEquipe) return true; }
    const asE = b.active.find((e) => e.mon === as && e.alive);
    if (q.as && asE) return true;
    if (q.asPS != null && asE && as.hp / as.stats.hp <= q.asPS) return true;
    return false;
  }

  update(dt) {
    if (this.done) return;
    const g = this.g;
    this.t += dt;
    const parado = this.cenaT > 0;
    if (parado) this.cenaT -= dt;
    // fases: a próxima entra quando a condição dela vale (uma de cada vez, nunca no meio de outra cena)
    const prox = this.cfg.fases?.[this.fase + 1];
    if (!parado && prox && this.#condicao(prox.quando)) this.#entrarFase(this.fase + 1);
    if (!parado) {
      // o líder aciona um perigo de vez em quando (grita antes; o perigo em si ainda tem o aviso dele)
      if ((this.liderT -= dt) <= 0) { this.liderT = DIFICULDADE.lider(this.d) * (0.85 + Math.random() * 0.3); this.#acaoLider(); }
      // sem Pokémon do líder em campo (entre um e outro), os perigos esperam: ninguém apanha sozinho
      const luta = this.b.active.some((e) => e.alive) || this.ajudantes.length;
      if (luta) for (const p of this.pecas) if (p.ativo) p.update?.(dt);
      for (let i = this.avisos.length - 1; i >= 0; i--) {
        const av = this.avisos[i]; av.t += dt;
        if (av.t >= av.dur) { this.avisos.splice(i, 1); try { av.depois?.(av); } catch (err) { console.warn('perigo da arena falhou', err); } }
      }
      for (const a of this.ajudantes) this.#ajudante(a, dt);
      this.ajudantes = this.ajudantes.filter((a) => a.alive && !a.dead);
    }
    // velocidade de cada lutador no terreno (teia, água, lama) e luzes
    for (const e of this.lutadores()) {
      let k = 1; for (const p of this.pecas) if (p.ativo && p.velocidade) k *= p.velocidade(e) ?? 1;
      e.arenaVel = k;
    }
    for (const p of this.pecas) p.sempre?.(dt); // o que anda mesmo nas cenas (plateia, barcos)
    this.#desenhar();
  }

  #acaoLider() {
    const g = this.g, alvo = this.lead; if (!alvo || !this.dentro(alvo.x, alvo.y)) return;
    if (Math.random() > 0.35 + 0.6 * this.esperteza) return; // líder mais fraco esquece de usar a arena às vezes
    const ops = this.pecas.filter((p) => p.ativo && p.lider);
    for (let n = 0; n < 3 && ops.length; n++) {
      const p = ops.splice(Math.floor(Math.random() * ops.length), 1)[0];
      if (!p.lider(alvo)) continue;
      const grito = this.cfg.gritos?.[p.id];
      if (grito) { g.toast(`${this.b.def.name}: ${Array.isArray(grito) ? grito[Math.floor(Math.random() * grito.length)] : grito}`); this.b.npc?.exclaim?.('!'); this.b.npc?.throwPose?.(); }
      this.emitir('lider', { peca: p.id });
      return;
    }
  }

  // ---------------------------------------------------------------- IA dos Pokémon do líder
  // chamado pela TrainerBattle depois do think(): devolve a velocidade final
  guiar(e, v, dt) {
    if (this.cenaT > 0) return { vx: 0, vy: 0 };
    const ia = (e.aIA ??= { t: Math.random(), reac: 0, alvo: null });
    const s = e.speed(1.15);
    // 1) perigo onde está: depois do tempo de reação, sai para o lugar seguro mais perto
    const p = this.perigo(e.x, e.y, e);
    if (p >= 0.45) {
      ia.reac += dt;
      if (ia.reac >= this.reacao) { const sf = ia.fuga && this.perigo(ia.fuga.x, ia.fuga.y, e) < 0.3 ? ia.fuga : (ia.fuga = this.seguro(e)); if (sf) return this.#para(e, sf, s); }
    } else { ia.reac = 0; ia.fuga = null; }
    // 2) objetivo de uma peça (cobertura, gerador, água a favor...), reavaliado a cada pouco
    if ((ia.t -= dt) <= 0) {
      ia.t = 1 + Math.random() * 1.2;
      ia.alvo = Math.random() < this.esperteza ? this.#objetivo(e) : null;
    }
    if (ia.alvo && !e.charging) {
      const a = ia.alvo, d = Math.hypot(a.x - e.x, a.y - e.y);
      if (d < (a.raio ?? 8)) { a.chegou?.(e); if (a.ficar) return { vx: v.vx * 0.15, vy: v.vy * 0.15 }; ia.alvo = null; }
      else if (this.perigo(a.x, a.y, e) < 0.45) { const w = this.#para(e, a, s * (a.pressa ?? 1)); return { vx: w.vx * 0.8 + v.vx * 0.2, vy: w.vy * 0.8 + v.vy * 0.2 }; }
      else ia.alvo = null;
    }
    // 3) não entra num aviso andando
    const ax = e.x + v.vx * 0.35, ay = e.y + v.vy * 0.35;
    if (Math.hypot(v.vx, v.vy) > 5 && this.perigo(ax, ay, e) >= 0.45) return { vx: -v.vy * 0.6, vy: v.vx * 0.6 };
    return v;
  }
  #para(e, a, s) { const dx = a.x - e.x, dy = a.y - e.y, d = Math.hypot(dx, dy) || 1; const k = Math.min(1, d / 18); return { vx: dx / d * s * k, vy: dy / d * s * k }; }
  // lugar seguro mais perto (anéis de amostras em volta)
  seguro(e, longe = null) {
    let best = null, bs = 1e9;
    for (const R of [22, 38, 56, 76]) {
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU + R, x = e.x + Math.cos(a) * R, y = e.y + Math.sin(a) * R;
        if (!this.livre(x, y, e.r * 0.6)) continue;
        const p = this.perigo(x, y, e); if (p >= 0.3) continue;
        const sc = R + p * 80 + (longe ? -Math.min(80, Math.hypot(x - longe.x, y - longe.y)) * 0.3 : 0);
        if (sc < bs) { bs = sc; best = { x, y }; }
      }
      if (best) return best;
    }
    return best;
  }
  #objetivo(e) {
    let best = null;
    for (const p of this.pecas) {
      if (!p.ativo || !p.objetivo) continue;
      const o = p.objetivo(e); if (o && (!best || o.peso > best.peso)) best = o;
    }
    return best && best.peso > 0.15 ? best : null;
  }

  // ajudantes (Pokémon que nascem na arena, como os dos casulos): lado do líder, fora da equipe e da vitória
  addAjudante(e, vida = 20) {
    e.ajudante = true; e.vida = vida; e.ai.state = 'aggro'; e.ai.t = 10; e.lock = 0.6;
    this.ajudantes.push(e);
  }
  #ajudante(e, dt) {
    const g = this.g;
    e.vida -= dt;
    if (e.vida <= 0 || !this.b.active.length && this.b.next >= this.b.team.length) { this.#some(e); return; }
    if (e.stun > 0 || e.lock > 0) { e.vx = e.vy = 0; return; }
    const tgt = this.lead ?? g.player;
    e.aggroTarget = tgt; e.ai.state = 'aggro'; e.ai.t = 10; e.hpShow = Math.max(e.hpShow, 0.3);
    const v = e.think(dt), w = this.guiar(e, v, dt); e.vx = w.vx; e.vy = w.vy;
    if (Math.hypot(w.vx, w.vy) > 1) e.face(w.vx, w.vy);
  }
  #some(e) { const g = this.g; if (e.dead) return; e.dead = true; g.fx.emit(e.x, e.y - 6, { tex: 'dust', n: 6, speed: 30, life: 0.5, scale: 0.7, end: 1.6, add: false, alpha: 0.7 }); g.removeEntity(e); }

  // ---------------------------------------------------------------- ganchos chamados pela batalha
  // desmaio de um ajudante: a arena cuida (devolve true); desmaio de Pokémon da equipe: só torcida
  onFaint(e) {
    if (e.ajudante) { e.dead = true; e.play?.('Hurt'); this.g.fx.burst(e.x, e.y - 8, 0xffffff, 1); this.g.later(0.5, () => this.g.removeEntity(e)); this.ajudantes = this.ajudantes.filter((a) => a !== e); return true; }
    this.torcida(1, true);
    return false;
  }
  // o último Pokémon vai entrar: cena no líder antes do arremesso (devolve o atraso extra, em segundos)
  antesDoAs() {
    const as = this.cfg.as ?? {}, npc = this.b.npc;
    this.cena({ foco: npc ? { x: npc.x, y: npc.y } : { x: this.R.cx, y: this.R.cy }, dur: 1.6, titulo: as.titulo ?? 'O ás do líder!', fala: as.fala, quem: npc, cor: as.cor ?? this.cfg.cor, som: 'howl', forca: 1 });
    if (as.musica) this.g.audio?.music?.(as.musica);
    return 1.5;
  }
  // um Pokémon do líder entrou em campo (ultimo = o ás)
  entrou(e, ultimo) {
    const g = this.g;
    e.arenaVel = 1;
    for (const p of this.pecas) p.entrou?.(e, ultimo);
    if (!ultimo) return;
    const as = this.cfg.as ?? {}, cor = as.corFx ?? 0xffe27a;
    e.lock = Math.max(e.lock, 1.1); e.iframes = Math.max(e.iframes, 1.1);
    g.fx.shock(e.x, e.y, cor, 80, 0.7); g.fx.ring(e.x, e.y - 8, 0xffffff, 26, 0.6, { width: 3 });
    g.fx.light(e.x, e.y - 10, cor, 90, 0.6, 1); g.fx.screenFlash(0xffffff, 0.5); g.fx.kick(0.45, 0.12);
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fx.emit(e.x + Math.cos(a) * 6, e.y - 8, { tex: 'spark', color: cor, n: 1, speed: 170, dir: a, spread: 0.08, life: 0.55, stretch: 0.012, drag: 3 }); }
    g.fx.emit(e.x, e.y - 4, { tex: 'dust', n: 12, speed: 90, life: 0.8, scale: 0.9, end: 2.2, add: false, alpha: 0.7 });
    g.fx.number(e.x, e.y - (e.topH ?? 24) - 18, as.grito ?? `${e.mon.name}!`, cor, true, 'banner');
    e.play?.(e.set?.anims?.Charge ? 'Charge' : 'Attack');
    g.audio?.sfx?.('boom');
    this.torcida(1.5, true);
    this.emitir('as', { nome: e.mon.name });
    this.#poder(e);
  }
  // Mega Evolução / Dynamax do ás (ramo mega: game.poder). Sem o módulo, nada acontece.
  async #poder(e) {
    const g = this.g, P = this.cfg.poder; if (!P || !g.poder) return;
    const quando = P.quando ?? 'entrada';
    const vai = async () => {
      if (!e.alive || this.done) return;
      if (P.tipo === 'dynamax') await g.poder.dynamax?.(e);
      else { const mod = await import('../mechanics/poder.js').catch(() => null); const f = mod?.megaFormFor?.(e.mon); if (f) await g.poder.mega?.(e, f); }
      this.emitir('poder', { tipo: P.tipo });
    };
    if (quando === 'entrada') g.later(1.2, vai);
    else this.esperaPoder = { e, vai, ps: P.ps ?? 0.5 };
  }

  fim(resultado) {
    if (this.done) return;
    this.done = true;
    const g = this.g, m = g.map;
    for (const p of this.pecas) { try { p.fim?.(); } catch (err) { console.warn(err); } }
    for (const [k, t] of this.tiles) { const x = k % m.w, y = Math.floor(k / m.w); if (m.at(x, y) !== t) m.setTile(x, y, t); }
    for (const [k, v] of this.blocks) m.block[k] = v;
    for (const a of this.ajudantes) this.#some(a);
    for (const e of g.entities) { e.arenaVel = 1; if (e.alpha < 1 && !e.dead && !e.fadeIn) e.alpha = 1; e.cargaArena = null; e.noRitmo = null; }
    if (this.room) { this.room.escuro = this.antes?.escuro; this.room.dark = this.antes?.dark; }
    this.G0.destroy(); this.G1.destroy(); this.topo.destroy({ children: true });
    for (const G of this.gfxs) G.destroy();
    if (g.camFocus) g.camFocus = null;
    if (g.arenaGinasio === this) g.arenaGinasio = null;
    this.stats.resultado = resultado; this.stats.duracao = +((performance.now() - this.stats.inicio) / 1000).toFixed(1); this.stats.tempoJogo = +this.t.toFixed(1);
    window.__arenaUltima = this.stats; // para os testes (tools/arenas-teste.mjs)
    this.emitir('fim', { resultado });
  }

  // ---------------------------------------------------------------- ganchos chamados pelo combate
  // projétil chegando no ponto: alguma peça segura o golpe? (cobertura, milho, sombra falsa)
  bloqueia(x, y, mv, p) { if (!this.dentro(x, y, 8)) return false; let b = false; for (const pc of this.pecas) if (pc.ativo !== false && pc.bloqueia?.(x, y, mv, p)) b = true; return b; }
  impacto(x, y, mv, P = 1) { if (!this.dentro(x, y, 8)) return; for (const pc of this.pecas) pc.impacto?.(x, y, mv, P); }
  pisoteio(x, y, mv, u) { if (!this.dentro(x, y, 8)) return; for (const pc of this.pecas) pc.pisoteio?.(x, y, mv, u); }
  aoUsar(user, id, mv) { for (const pc of this.pecas) if (pc.ativo) pc.aoUsar?.(user, id, mv); if (this.esperaPoder && user === this.esperaPoder.e) { /* o poder espera os PS */ } }
  molhado(x, y) { for (const pc of this.pecas) if (pc.ativo && pc.molhado?.(x, y)) return true; return false; }
  // multiplicador extra de dano (carga do gerador, golpe no ritmo do berimbau)
  modDano(user, t, mv) {
    let k = 1;
    for (const pc of this.pecas) if (pc.ativo && pc.modDano) k *= pc.modDano(user, t, mv) ?? 1;
    const ep = this.esperaPoder; if (ep && t === ep.e && ep.e.mon.hp / ep.e.mon.stats.hp <= ep.ps) { this.esperaPoder = null; this.g.later(0.3, ep.vai); }
    return k;
  }
  luzes(add) { for (const pc of this.pecas) if (pc.ativo && pc.luzes) pc.luzes(add); for (const av of this.avisos) { const c = this.centroAviso(av); add(c.x, c.y, 40, undefined, 0.8); } for (const e of this.lutadores()) if (e.charging) add(e.x, e.y - 10, 44, undefined, 0.9); }

  // ---------------------------------------------------------------- plateia
  torcida(k = 0.5, grito = false) { for (const p of this.pecas) p.torcer?.(k, grito); }

  // ---------------------------------------------------------------- desenho
  #desenhar() {
    const G0 = this.G0, G1 = this.G1, GA = this.GA, t = this.g.time, W = this.g.world;
    G0.clear(); G1.clear(); GA.clear();
    this.topo.position.copyFrom(W.position); this.topo.scale.copyFrom(W.scale);
    if (this.topo.parent && this.topo.parent.children[this.topo.parent.children.length - 1] !== this.topo) this.topo.parent.addChild(this.topo);
    for (const p of this.pecas) if (p.ativo || p.sempreDesenha) p.desenhar?.(G0, G1);
    for (const av of this.avisos) this.#desenharAviso(GA, G1, av, t);
  }
  #desenharAviso(G, G1, av, t) {
    const k = av.t / av.dur, blink = k > 0.72 ? (Math.sin(t * 38) > 0 ? 1 : 0.45) : 1;
    const cor = av.cor, a1 = (0.12 + 0.22 * k) * blink, edge = { width: 1.2, color: cor, alpha: 0.55 + 0.4 * k };
    const stripes = (x0, y0, x1, y1) => { // listras de "perigo" correndo (distinguem os perigos da arena dos golpes)
      const off = (t * 22) % 10;
      for (let s = x0 - (y1 - y0) + off; s < x1; s += 10) { const ax = Math.max(x0, s), ay = y1 - (ax - s), bx = Math.min(x1, s + (y1 - y0)), by = y1 - (bx - s); if (bx > ax) G.moveTo(ax, ay).lineTo(bx, by); }
      G.stroke({ width: 1, color: cor, alpha: 0.25 * blink });
    };
    switch (av.forma) {
      case 'circulo': {
        G.circle(av.x, av.y, av.r).fill({ color: cor, alpha: a1 * 0.7 }).stroke(edge);
        G.circle(av.x, av.y, Math.max(1, av.r * k)).fill({ color: cor, alpha: a1 });
        G.circle(av.x, av.y, av.r + 3 + (1 - k) * 6).stroke({ width: 1, color: 0xffffff, alpha: 0.35 * blink });
        break;
      }
      case 'faixa': {
        G.rect(av.x0, av.y0, av.x1 - av.x0, av.y1 - av.y0).fill({ color: cor, alpha: a1 * 0.6 }).stroke(edge);
        stripes(av.x0, av.y0, av.x1, av.y1);
        if (av.dir) { // setas andando na direção em que o perigo vai passar
          const [dx, dy] = av.dir, cx = (av.x0 + av.x1) / 2, cy = (av.y0 + av.y1) / 2, L = dx ? av.x1 - av.x0 : av.y1 - av.y0;
          for (let i = 0; i < 5; i++) {
            const s = ((i / 5 + t * 0.6) % 1 - 0.5) * L, px = cx + dx * s, py = cy + dy * s, w = dx ? (av.y1 - av.y0) * 0.3 : (av.x1 - av.x0) * 0.3;
            G.moveTo(px - dx * 5 - dy * w, py - dy * 5 - dx * w).lineTo(px + dx * 4, py + dy * 4).lineTo(px - dx * 5 + dy * w, py - dy * 5 + dx * w);
          }
          G.stroke({ width: 2, color: 0xffffff, alpha: 0.55 * blink });
        }
        break;
      }
      case 'celulas': {
        for (const [x, y] of av.cells) G.rect(x * T + 1, y * T + 1, T - 2, T - 2);
        G.fill({ color: cor, alpha: a1 }).stroke({ width: 1, color: cor, alpha: 0.5 + 0.4 * k });
        break;
      }
      case 'linha': {
        const dx = av.bx - av.ax, dy = av.by - av.ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l * av.w / 2, ny = dx / l * av.w / 2;
        G.poly([av.ax + nx, av.ay + ny, av.bx + nx, av.by + ny, av.bx - nx, av.by - ny, av.ax - nx, av.ay - ny]).fill({ color: cor, alpha: a1 * 0.6 }).stroke(edge);
        const q = k; G.poly([av.ax + nx, av.ay + ny, av.ax + dx * q + nx, av.ay + dy * q + ny, av.ax + dx * q - nx, av.ay + dy * q - ny, av.ax - nx, av.ay - ny]).fill({ color: cor, alpha: a1 });
        break;
      }
      case 'anel': {
        const { x0, y0, x1, y1, i } = av;
        G.rect(x0, y0, x1 - x0, i).rect(x0, y1 - i, x1 - x0, i).rect(x0, y0 + i, i, y1 - y0 - 2 * i).rect(x1 - i, y0 + i, i, y1 - y0 - 2 * i).fill({ color: cor, alpha: a1 });
        G.rect(x0 + i, y0 + i, x1 - x0 - 2 * i, y1 - y0 - 2 * i).stroke({ width: 1.5, color: cor, alpha: 0.6 + 0.4 * k });
        stripes(x0, y0, x1, y0 + i); stripes(x0, y1 - i, x1, y1);
        break;
      }
    }
    void G1;
  }

  // ---------------------------------------------------------------- estado para outros desenhos (3D) e testes
  onEvento(fn) { this.ouvintes.push(fn); return () => { this.ouvintes = this.ouvintes.filter((f) => f !== fn); }; }
  emitir(tipo, dados = {}) { for (const f of this.ouvintes) { try { f({ tipo, t: this.t, ...dados }); } catch (err) { console.warn(err); } } }
  estado() {
    const f = this.cfg.fases?.[this.fase];
    return {
      id: this.cfg.id, nome: this.cfg.nome, tipo: this.cfg.tipo, nivel: this.nivel, dificuldade: +this.d.toFixed(2),
      fase: f ? { i: this.fase, id: f.id, nome: f.nome, final: !!f.final } : null,
      area: { ...this.R }, cena: this.cenaT > 0 ? { resta: +this.cenaT.toFixed(2), foco: this.g.camFocus ?? null } : null,
      avisos: this.avisos.map((av) => ({ id: av.id, forma: av.forma, progresso: +(av.t / av.dur).toFixed(2), dur: av.dur, cor: av.cor, fonte: av.fonte?.id ?? null,
        ...(av.forma === 'circulo' ? { x: av.x, y: av.y, r: av.r } : av.forma === 'linha' ? { a: [av.ax, av.ay], b: [av.bx, av.by], w: av.w } : av.forma === 'celulas' ? { celulas: av.cells } : { x0: av.x0, y0: av.y0, x1: av.x1, y1: av.y1, ...(av.i ? { i: av.i } : {}), ...(av.dir ? { dir: av.dir } : {}) }) })),
      pecas: this.pecas.map((p) => ({ id: p.id, tipo: p.def.tipo, ativo: !!p.ativo, ...(p.estado?.() ?? {}) })),
      ajudantes: this.ajudantes.map((e) => ({ nome: e.mon.name, x: e.x, y: e.y })),
    };
  }
}
