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
  vigor: (d, n = 3) => (n <= 3 ? 4.4 : n === 4 ? 3.9 : 3.5) + 0.5 * d, // × PS máximos dos Pokémon do líder (n = tamanho da equipe): luta de minutos, não de segundos
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
    const g = this.g = b.g; this.b = b;
    this.simples = b.def?.id?.startsWith('leader_') && cfg.sala?.startsWith('estadio_');
    // Campo esportivo: sem peças escondidas, perigos automáticos ou fases que diminuam a área.
    // A equipe, os avisos dos golpes, a troca contínua e os poderes do líder continuam valendo.
    if (this.simples) cfg = { ...cfg, posicoes: { jogador: [20, 20], lider: [29, 17] }, pecas: [], fases: [{ id: 'campo', nome: 'Campo de batalha' }], abertura: 'O campo está livre. Vamos batalhar!' };
    this.cfg = cfg;
    const room = cfg.sala ? g.map.interiors.find((r) => r.id === cfg.sala) : null;
    if (cfg.sala && !room) throw new Error('sala ' + cfg.sala + ' não existe');
    this.room = room; this.o = room ? { x: room.x, y: room.y } : { x: 0, y: 0 };
    this.estadio = room?.estadio ?? null; // estádio próprio (src/world/estadios.js): a luta vai para lá e volta no fim
    this.contem = false; // enquanto vale, ninguém sai do retângulo da arena (conterTodos, map.limite)
    const [ax, ay, aw, ah] = cfg.area;
    this.R = { x0: (this.o.x + ax) * T, y0: (this.o.y + ay) * T, x1: (this.o.x + ax + aw) * T, y1: (this.o.y + ay + ah) * T };
    this.R.cx = (this.R.x0 + this.R.x1) / 2; this.R.cy = (this.R.y0 + this.R.y1) / 2;
    // dificuldade: o nível do ginásio é o do ás (último da equipe)
    this.nivel = Math.max(...b.team.map((m) => m.level));
    const d = this.d = DIFICULDADE.d(this.nivel);
    this.K = { aviso: DIFICULDADE.aviso(d), dano: DIFICULDADE.dano(d), ritmo: DIFICULDADE.ritmo(d) };
    this.reacao = DIFICULDADE.reacao(d); this.esperteza = DIFICULDADE.esperteza(d);
    // Pokémon de líder aguentam mais (como chefe): sem isso a luta acabava em 30 s e a arena mal mudava de fase
    const vg = cfg.vigor ?? DIFICULDADE.vigor(d, b.team.length);
    for (const m of b.team) if (!m.vigorK) { m.vigorK = vg; m.calc(); m.hp = m.stats.hp; }
    this.t = 0; this.done = false; this.fase = -1; this.cenaT = 0; this.liderT = DIFICULDADE.lider(d) * 0.8;
    this.avisos = []; this.tiles = new Map(); this.blocks = new Map(); this.gfxs = []; this.ajudantes = [];
    this.ouvintes = []; this.lutT = 0; this.cache = [];
    this.stats = { avisos: 0, golpes: 0, semAviso: 0, minAviso: Infinity, acertos: { ally: 0, foe: 0 }, porPerigo: {}, fases: [], inicio: performance.now(), noMuro: 0, foraArea: 0 };
    this.pressa = 1; this.pararT = 0; this.checkT = 0; // tempo da luta (1 = normal), segundos com o seu Pokémon parado, relógio da conferência
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
    if (aviso === 'terreno' || aviso === 'consequencia') { /* zona visível o tempo todo / efeito de um golpe que já foi telegrafado */ } else if (aviso && aviso.dur) s.minAviso = Math.min(s.minAviso, aviso.dur); else s.semAviso++;
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
    const pos = cfg.posicoes;
    if (pos) {
      // estádio: o líder leva o jogador para a sala da luta (onde estavam fica guardado para a volta, em voltar())
      if (this.estadio) g.toast(`${this.b.def?.name ?? 'O líder'}: Vem comigo, a luta é no estádio!`);
      await g.ui.fade(() => {
        if (this.estadio) this.#guardarVolta();
        const pj = this.P(...pos.jogador), pl = this.P(...pos.lider);
        const p = g.player; p.x = pj.x; p.y = pj.y; p.vx = p.vy = p.kx = p.ky = 0; p.dir = 'up'; p.seguro = null; p.pouso = null; g.grade?.soltar?.(p);
        if (g.lead) { g.lead.x = p.x; g.lead.y = p.y - 16; g.lead.kx = g.lead.ky = g.lead.vx = g.lead.vy = 0; g.lead.seguro = null; }
        for (const e of g.entities) if (e.side === 'aliado' && e.alive) { e.x = p.x + 18; e.y = p.y - 6; e.seguro = null; }
        if (npc?.place) npc.place(pl.x, pl.y, 'down'); else if (npc) { npc.x = pl.x; npc.y = pl.y; }
        g.cam.x = this.R.cx; g.cam.y = this.R.cy;
        this.#ligarContencao(); // já no escuro: do primeiro quadro no estádio em diante ninguém sai da arena
      }, this.estadio ? 420 : 260);
    }
    for (const p of this.pecas) p.iniciar?.();
    this.pronta = true; // as peças montam depois da ida ao estádio (até lá, update não mexe nelas)
    if (!this.contem) this.#ligarContencao();
    g.audio?.music?.(cfg.musica?.luta ?? 'gym');
    this.#entrarFase(0, true);
    await this.#vs();
    // apresentação: a câmera passeia pela arena enquanto o nome aparece
    await this.cena({ foco: { x: this.R.cx, y: this.R.cy }, dur: 1.5, titulo: cfg.nome, fala: cfg.abertura, quem: npc, cor: cfg.cor, som: 'whistle', forca: 1 });
  }

  // flash de VS antes da apresentação: a tela pisca e o VS aparece (ninguém age ainda)
  async #vs() {
    const g = this.g;
    g.fx.screenFlash(0xffffff, 0.9); g.audio?.sfx?.('boom');
    g.ui?.banner?.('VS', '#ffffff');
    await new Promise((r) => g.later(0.8, r));
  }
  // cena curta: câmera vai a um ponto, faixa e fala; ninguém age nem apanha enquanto dura
  // livre: no meio da luta (fase nova, entrada do ás) a cena NÃO para ninguém nem tira a câmera: só a pílula pequena
  // embaixo da barra do topo (espetaculo.faixa), a fala do líder no canto e o som; a luta continua (pedido do dono)
  cena({ foco, dur = 1.5, titulo, fala, quem, cor = '#ffe27a', som = null, tremor = 0, forca = 0.8, livre = false } = {}) {
    const g = this.g;
    if (livre) {
      const c = typeof cor === 'number' ? '#' + cor.toString(16).padStart(6, '0') : cor;
      if (titulo) { if (g.show?.faixa) g.show.faixa(titulo, 'fase', c); else g.toast(titulo); }
      if (fala) { g.toast(`${this.b.def.name}: ${fala}`); quem?.exclaim?.('!'); quem?.throwPose?.(); }
      if (tremor) g.fx.kick(Math.min(tremor, 0.25), 0);
      if (som) g.audio?.sfx?.(som);
      this.torcida(forca, true);
      return Promise.resolve();
    }
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

  // ---------------------------------------------------------------- estádio: ida e volta
  #guardarVolta() {
    const g = this.g, p = g.player, n = this.b.npc;
    this.volta = { j: { x: p.x, y: p.y, dir: p.dir }, n: n ? { x: n.x, y: n.y, dir: n.dir ?? 'down' } : null };
  }
  // Traz todo mundo de volta ao ginásio (story.js chama depois da luta). soLider: o jogador desmaiou e já foi levado
  // ao Centro Pokémon; só o líder volta ao lugar dele.
  async voltar({ soLider = false } = {}) {
    const v = this.volta; if (!v) return;
    this.volta = null;
    const g = this.g, npc = this.b.npc;
    const leva = () => {
      if (npc && v.n) { if (npc.place) npc.place(v.n.x, v.n.y, v.n.dir); else { npc.x = v.n.x; npc.y = v.n.y; } }
      if (soLider) return;
      const p = g.player, m = g.map;
      p.x = v.j.x; p.y = v.j.y; p.dir = v.j.dir; p.vx = p.vy = p.kx = p.ky = 0; p.seguro = null; p.pouso = null; g.grade?.soltar?.(p);
      if (g.lead) { g.lead.x = p.x + 14; g.lead.y = p.y + 6; g.lead.kx = g.lead.ky = g.lead.vx = g.lead.vy = 0; g.lead.seguro = null; m.resolve(g.lead, g.lead.r); }
      for (const e of g.entities) if (e.side === 'aliado' && e.alive) { e.x = p.x - 14; e.y = p.y + 6; e.seguro = null; m.resolve(e, e.r); }
      g.cam.x = p.x; g.cam.y = p.y;
    };
    if (soLider) leva(); else await g.ui.fade(leva, 360);
  }

  // ---------------------------------------------------------------- contenção (ninguém sai da arena durante a luta)
  // Vale para o treinador e para todo Pokémon da luta (os dois lados, os ajudantes e o do Téo): o retângulo da arena
  // vira parede invisível no movimento (map.limite, a cada passo curto de colisão) e, no fim de cada quadro,
  // conterTodos() devolve para dentro quem saiu por outro caminho (teleporte, porta da arena, plataforma, cena).
  #ligarContencao() {
    const g = this.g, R = this.R;
    this.contem = true;
    g.map.limite = { x0: R.x0, y0: R.y0, x1: R.x1, y1: R.y1, quem: (e) => this.contido(e) };
  }
  contido(e) { return !!e && (e === this.g.player || (!!e.mon && SIDES.has(e.side) && !e.dead)); }
  // ponto livre dentro da arena, perto de (x, y): onde nasce o Pokémon que entra (bola, troca, desmaio) e para onde o
  // treinador anda. folga: distância mínima da borda (px).
  pontoSeguro(x, y, folga = T) {
    const R = this.R, m = this.g.map;
    const cx = clamp(x, R.x0 + folga, R.x1 - folga), cy = clamp(y, R.y0 + folga, R.y1 - folga);
    if (!m.solidAt(cx, cy) && !m.solidAt(cx, cy + 4)) return { x: cx, y: cy };
    const tx = Math.floor(cx / T), ty = Math.floor(cy / T);
    for (let k = 1; k <= 10; k++) {
      let best = null, bd = 1e9;
      for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== k) continue;
        const px = (tx + i) * T + 8, py = (ty + j) * T + 9;
        if (!this.dentro(px, py, -folga) || m.solidAt(px, py)) continue;
        const d = Math.hypot(px - cx, py - cy); if (d < bd) { bd = d; best = { x: px, y: py }; }
      }
      if (best) return best;
    }
    return { x: R.cx, y: R.cy };
  }
  conter(e) {
    const R = this.R, r = Math.min(e.r ?? 6, 8) + 1;
    let x = e.x, y = e.y, saiu = false;
    if (x < R.x0 + r) { x = R.x0 + r; saiu = true; if (e.kx < 0) e.kx = 0; if (e.vx < 0) e.vx = 0; } else if (x > R.x1 - r) { x = R.x1 - r; saiu = true; if (e.kx > 0) e.kx = 0; if (e.vx > 0) e.vx = 0; }
    if (y < R.y0 + r) { y = R.y0 + r; saiu = true; if (e.ky < 0) e.ky = 0; if (e.vy < 0) e.vy = 0; } else if (y > R.y1 - r) { y = R.y1 - r; saiu = true; if (e.ky > 0) e.ky = 0; if (e.vy > 0) e.vy = 0; }
    if (!saiu) return false;
    e.x = x; e.y = y;
    if (this.g.map.solidAt(x, y) && !this.voando(e) && !this.nadador(e)) { const q = this.pontoSeguro(x, y, r); e.x = q.x; e.y = q.y; }
    this.stats.contidos = (this.stats.contidos ?? 0) + 1;
    return true;
  }
  conterTodos() {
    if (!this.contem || this.done) return;
    const g = this.g;
    if (g.player) this.conter(g.player);
    for (const e of g.entities) if (e.alive && this.contido(e)) this.conter(e);
  }
  #desligarContencao() { this.contem = false; if (this.g.map.limite?.quem && this.g.map.limite.x0 === this.R.x0) this.g.map.limite = null; }

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
    this.cena({ foco, dur: f.dur ?? 1.8, titulo: f.titulo, fala: f.fala, quem: this.b.npc, cor: f.cor ?? this.cfg.cor, som: f.som ?? 'quake', tremor: f.tremor ?? 0.35, forca: 1, livre: true });
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
    if (this.done || !this.pronta) return;
    const g = this.g;
    this.t += dt;
    const parado = this.cenaT > 0;
    if (parado) this.cenaT -= dt;
    // o seu Pokémon parado conta para o castigo da IA (ver guiar)
    const L = this.lead; if (L && !parado) this.pararT = Math.hypot(L.vx ?? 0, L.vy ?? 0) < 4 ? this.pararT + dt : 0;
    if ((this.checkT -= dt) <= 0) { this.checkT = 0.5; this.#confere(); }
    // fases: a próxima entra quando a condição dela vale (uma de cada vez, nunca no meio de outra cena)
    const prox = this.cfg.fases?.[this.fase + 1];
    if (!parado && prox && this.#condicao(prox.quando)) this.#entrarFase(this.fase + 1);
    if (!parado) {
      // o líder aciona um perigo de vez em quando (grita antes; o perigo em si ainda tem o aviso dele)
      if ((this.liderT -= dt * this.pressa) <= 0) { this.liderT = DIFICULDADE.lider(this.d) * (0.85 + Math.random() * 0.3); this.#acaoLider(); }
      // sem Pokémon do líder em campo (entre um e outro), os perigos esperam: ninguém apanha sozinho
      const luta = this.b.active.some((e) => e.alive) || this.ajudantes.length;
      if (luta) for (const p of this.pecas) if (p.ativo) p.update?.(dt * this.pressa);
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

  // conferência dos muros: quem está dentro de parede (que não nada, não voa) ou fora da arena (tem que dar 0)
  #confere() {
    const m = this.g.map;
    for (const e of this.g.entities) {
      if (!SIDES.has(e.side) || !e.alive || e.dead || !e.mon) continue;
      if (m.solidAt(e.x, e.y) && !this.voando(e) && !this.nadador(e)) this.stats.noMuro++;
      if (!this.dentro(e.x, e.y, 4)) this.stats.foraArea++;
    }
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
    // esquiva: saiu de lado de um golpe seu (aoUsar), por um instante
    if (e.esquiva?.t > 0) { e.esquiva.t -= dt; return { vx: e.esquiva.vx, vy: e.esquiva.vy }; }
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
    // castigo: se você fica parado, o Pokémon do líder perto vai até você (e não espera a sua vez)
    const L = this.lead;
    if (L && this.pararT > 1.4 && !e.charging && Math.hypot(e.x - L.x, e.y - L.y) < 170) ia.alvo = { x: L.x, y: L.y, raio: 18, pressa: 1.35, castigo: true };
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
    for (const R of [22, 38, 56, 76, 100, 130]) { // anéis de fora: no estádio o lugar seguro pode estar a 8 blocos
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
    this.pressa = 1.3; // o último Pokémon: a arena pisca mais depressa até o fim
    this.cena({ foco: npc ? { x: npc.x, y: npc.y } : { x: this.R.cx, y: this.R.cy }, dur: 1.6, titulo: `${this.b.def?.name ?? 'O líder'} está com tudo!`, fala: as.fala, quem: npc, cor: as.cor ?? this.cfg.cor, som: 'howl', forca: 1, livre: true });
    if (as.musica) this.g.audio?.music?.(as.musica);
    return 0.3; // só o tempo do grito: o arremesso vem logo, com a luta andando
  }
  // um Pokémon do líder entrou em campo (ultimo = o ás)
  entrou(e, ultimo) {
    const g = this.g;
    e.arenaVel = 1;
    for (const p of this.pecas) p.entrou?.(e, ultimo);
    if (!ultimo) return;
    const as = this.cfg.as ?? {}, cor = as.corFx ?? 0xffe27a;
    e.lock = Math.max(e.lock, 0.6); e.iframes = Math.max(e.iframes, 0.6); // entrada do ás: efeito, sem congelar a luta
    g.fx.shock(e.x, e.y, cor, 80, 0.7); g.fx.ring(e.x, e.y - 8, 0xffffff, 26, 0.6, { width: 3 });
    g.fx.light(e.x, e.y - 10, cor, 90, 0.6, 1); g.fx.screenFlash(0xffffff, 0.22); g.fx.kick(0.35, 0.05);
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
    this.#desligarContencao();
    this.#setas(null);
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
  aoUsar(user, id, mv) {
    for (const pc of this.pecas) if (pc.ativo) pc.aoUsar?.(user, id, mv);
    if (this.esperaPoder && user === this.esperaPoder.e) { /* o poder espera os PS */ }
    // esquiva: os Pokémon do líder perto do seu golpe saem de lado (com chance, conforme a dificuldade)
    if (user && user === this.g.lead) for (const e of this.b.active) {
      if (!e.alive || e.dead || e.esquiva?.t > 0 || Math.hypot(e.x - user.x, e.y - user.y) > 150) continue;
      if (Math.random() > 0.25 + 0.5 * this.esperteza) continue;
      const ax = e.x - user.x, ay = e.y - user.y, l = Math.hypot(ax, ay) || 1, sg = Math.random() < 0.5 ? 1 : -1, v = 2.2 * e.speed(1);
      e.esquiva = { t: 0.45, vx: -ay / l * sg * v, vy: ax / l * sg * v };
    }
  }
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
    if (this.contem) { if (this.simples) { if (!this.g.v3d) this.#quadra(G0); } else this.#borda(G0, G1, t); }
    for (const p of this.pecas) if (p.ativo || p.sempreDesenha) p.desenhar?.(G0, G1);
    for (const av of this.avisos) this.#desenharAviso(GA, G1, av, t);
    if (this.contem) this.#setas(this.#foraDaTela());
  }
  // Linhas claras e poucas cores; a cor do ginásio fica apenas na faixa externa.
  #quadra(G) {
    // O piso é estático: geometria criada uma vez e liberada junto das peças da arena.
    // As cores identificam o ginásio sem mudar terreno, perigos ou colisões.
    if(this.quadraArte&&!this.quadraArte.destroyed)return;
    G=this.quadraArte=new PIXI.Graphics();this.g.fx.ground.addChildAt(G,0);this.gfxs.push(G);
    const temas={electric:[0x34495c,0x3c566a],water:[0x426d80,0x4b788a],grass:[0x4c7158,0x557c61],fire:[0x795d4b,0x846552],rock:[0x777267,0x827c70],psychic:[0x635c77,0x6d6582],ghost:[0x4b5366,0x555e72]};
    const [base,faixa]=temas[this.cfg.tipo]??[0x4f6d60,0x587668];
    const R = this.R, w = R.x1 - R.x0, h = R.y1 - R.y0;
    const cor = parseInt(this.cfg.cor.replace('#', ''), 16), linha = 0xe4eddb;
    G.rect(R.x0, R.y0, w, h).fill(base);
    for (let i = 0; i < 8; i += 2) G.rect(R.x0, R.y0 + h * i / 8, w, h / 8).fill({ color: faixa, alpha: 0.5 });
    for(let x=R.x0+16;x<R.x1;x+=16)G.moveTo(x,R.y0+12).lineTo(x,R.y1-12);
    for(let y=R.y0+16;y<R.y1;y+=16)G.moveTo(R.x0+12,y).lineTo(R.x1-12,y);
    G.stroke({color:0xffffff,width:1,alpha:.035});
    G.rect(R.x0 + 4, R.y0 + 4, w - 8, h - 8).stroke({ color: cor, width: 5, alpha: 0.8 });
    G.rect(R.x0 + 18, R.y0 + 18, w - 36, h - 36).stroke({ color: linha, width: 2, alpha: 0.7 });
    G.moveTo(R.cx, R.y0 + 18).lineTo(R.cx, R.cy - 48).moveTo(R.cx, R.cy + 48).lineTo(R.cx, R.y1 - 18).stroke({ color: linha, width: 2, alpha: 0.6 });
    G.circle(R.cx, R.cy, 48).stroke({ color: linha, width: 2.5, alpha: 0.75 });
    G.circle(R.cx, R.cy, 12).stroke({ color: linha, width: 2.5, alpha: 0.75 });
    G.moveTo(R.cx - 48, R.cy).lineTo(R.cx - 12, R.cy).moveTo(R.cx + 12, R.cy).lineTo(R.cx + 48, R.cy).stroke({ color: linha, width: 2.5, alpha: 0.75 });
    for (const x of [R.x0 + w * 0.22, R.x1 - w * 0.22]) G.circle(x, R.cy, 24).stroke({ color: linha, width: 2, alpha: 0.4 });
  }
  // borda da arena, sempre à vista durante a luta: faixa no chão na cor do ginásio e postes com corda (o limite que
  // ninguém passa). A corda do Brás (peça "corda") já faz esse papel no ringue dele.
  #borda(G0, G1, t) {
    const R = this.R, cor = parseInt(String(this.cfg.cor ?? '#ffe27a').replace('#', ''), 16) || 0xffe27a, k = 0.55 + 0.15 * Math.sin(t * 2.2);
    G0.rect(R.x0 + 1, R.y0 + 1, R.x1 - R.x0 - 2, R.y1 - R.y0 - 2).stroke({ width: 3, color: cor, alpha: k });
    G0.rect(R.x0 + 5, R.y0 + 5, R.x1 - R.x0 - 10, R.y1 - R.y0 - 10).stroke({ width: 1, color: 0xffffff, alpha: 0.35 });
    if (this.pecas.some((p) => p.def.tipo === 'corda')) return;
    const passo = 4 * T;
    for (let x = R.x0; x <= R.x1 + 1; x += passo) for (const y of [R.y0 + 2, R.y1 - 2]) G1.rect(x - 1.5, y - 10, 3, 10).fill({ color: 0x5a4a3a, alpha: 0.9 });
    for (let y = R.y0 + passo; y < R.y1; y += passo) for (const x of [R.x0 + 2, R.x1 - 2]) G1.rect(x - 1.5, y - 10, 3, 10).fill({ color: 0x5a4a3a, alpha: 0.9 });
    G1.moveTo(R.x0, R.y1 - 9).lineTo(R.x1, R.y1 - 9).moveTo(R.x0 + 2, R.y0 - 8).lineTo(R.x0 + 2, R.y1 - 9).moveTo(R.x1 - 2, R.y0 - 8).lineTo(R.x1 - 2, R.y1 - 9).moveTo(R.x0, R.y0 - 7).lineTo(R.x1, R.y0 - 7)
      .stroke({ width: 1, color: cor, alpha: 0.85 });
  }
  // Setas na borda da tela para quem está fora dela (no celular deitado a arena inteira não cabe): os Pokémon do
  // líder (e os ajudantes) e o líder; o seu Pokémon é quem a câmera segue.
  #foraDaTela() {
    const g = this.g, W = innerWidth, H = innerHeight, M = 18, out = [];
    const tela = (x, y, h) => (g.v3d?.view ? g.v3d.paraTela(x, y, h) : g.worldToScreen(x, y, h));
    const quem = [...this.b.active.filter((e) => e.alive && !e.dead), ...this.ajudantes.filter((e) => e.alive)];
    for (const e of quem) {
      const s = tela(e.x, e.y, 10); if (!Number.isFinite(s.x)) continue;
      if (s.x >= M && s.x <= W - M && s.y >= M && s.y <= H - M) continue;
      out.push({ s, nome: e.mon?.name ?? '?', cor: e.ajudante ? '#e8f080' : '#ff5a4a', ps: e.mon ? Math.max(0, e.mon.hp / e.mon.stats.hp) : 1 });
    }
    return out;
  }
  #setas(lista) {
    if (typeof document === 'undefined') return;
    if (!lista) { this.setasEl?.remove(); this.setasEl = null; return; }
    if (!this.setasEl) {
      const el = this.setasEl = document.createElement('div');
      el.className = 'arena-setas';
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden';
      document.body.appendChild(el);
    }
    const el = this.setasEl, W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, M = 26;
    while (el.children.length < lista.length) {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;gap:1px;font:600 10px/1.1 system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #000';
      d.innerHTML = '<div class="s" style="width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:16px solid #ff5a4a;filter:drop-shadow(0 1px 2px #000)"></div><div class="n"></div><div class="b" style="width:30px;height:3px;background:#0008;border-radius:2px"><div style="height:100%;background:#7ad84a;border-radius:2px"></div></div>';
      el.appendChild(d);
    }
    for (let i = 0; i < el.children.length; i++) {
      const d = el.children[i], q = lista[i];
      if (!q) { d.style.display = 'none'; continue; }
      d.style.display = 'flex';
      // ponto da borda na direção do Pokémon (a partir do meio da tela)
      const dx = q.s.x - cx, dy = q.s.y - cy, k = Math.min((W / 2 - M) / Math.max(1e-3, Math.abs(dx)), (H / 2 - M) / Math.max(1e-3, Math.abs(dy)));
      const x = cx + dx * k, y = cy + dy * k, ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      d.style.transform = `translate(${Math.round(x - 18)}px, ${Math.round(y - 14)}px)`;
      const s = d.firstChild; s.style.transform = `rotate(${ang.toFixed(0)}deg)`; s.style.borderBottomColor = q.cor;
      d.children[1].textContent = q.nome;
      d.children[2].firstChild.style.width = Math.round(q.ps * 100) + '%';
    }
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
