import * as PIXI from 'pixi.js';
import { MOVES } from '../data/moves.js';
import { validateMon, monWire } from './validate.js';

// Duelo PvP, lado do jogador. Fluxo:
//   desafio 'd-req' -> 'd-ans' (aceitou) -> quem aceitou abre o duelo no árbitro ('d-open')
//   -> cada um escolhe até 3 e manda 'd-team' ao árbitro -> 'd-start' (arena, equipes validadas)
//   -> contagem 3, 2, 1 -> luta em tempo real no próprio mapa -> 'd-end' -> resultado / revanche.
// Durante a luta, seus golpes encostando no Pokémon rival viram 'd-claim'; o HP só muda quando o
// árbitro responde 'd-hit' (src/net/arbiter.js).
// O árbitro roda em quem ACEITOU o desafio (d.ref), não no anfitrião: no canal do mundo o anfitrião pode ser um
// estranho que sai a qualquer hora, e um duelo não deve cair porque um terceiro fechou a aba. Se o anfitrião do
// canal muda no meio da luta, as mensagens param por uns segundos e voltam sozinhas (os ids não mudam). No PvP não há XP e ninguém perde nada: a equipe do
// duelo é uma cópia curada, e a sua equipe volta como estava no fim.

const newId = () => Math.random().toString(36).slice(2, 10);

export class Duel {
  constructor(net) { this.net = net; this.g = net.g; this.d = null; this.pending = null; this.incoming = null; }
  get busy() { return !!(this.d || this.pending); }
  get foeId() { return this.d?.phase === 'fight' || this.d?.phase === 'count' ? this.d.foe : null; }
  get active() { return !!this.d && (this.d.phase === 'count' || this.d.phase === 'fight'); }

  // ---------- desafio ----------
  challenge(pid, rematch = false) {
    const net = this.net;
    if (this.busy || net.trade.busy) { net.ui.toast('Termine o que está fazendo antes.'); return; }
    const duel = newId();
    this.pending = { duel, foe: pid };
    net.send('d-req', { duel, rematch }, pid);
    net.ui.toast(`Desafio enviado para ${net.nameOf(pid)}.`);
    this.pending.t = setTimeout(() => { if (this.pending?.duel === duel) { this.pending = null; net.ui.toast(`${net.nameOf(pid)} não respondeu.`); } }, 30000);
  }
  handle(type, data, from) {
    const net = this.net, g = this.g;
    if (typeof data.duel !== 'string' || data.duel.length > 16) return;
    if (type === 'd-req') {
      if (this.busy || net.trade.busy) { net.send('d-ans', { duel: data.duel, ok: false, why: 'ocupado' }, from); return; }
      this.incoming = { duel: String(data.duel), foe: from };
      net.ui.ask(`${net.nameOf(from)} ${data.rematch ? 'quer revanche!' : 'te desafiou para um duelo!'}`, 'Aceitar', 'Recusar', (ok) => {
        if (this.incoming?.duel !== String(data.duel)) return;
        this.incoming = null;
        if (!ok || !net.on || !net.room?.players.has(from)) { net.send('d-ans', { duel: data.duel, ok: false }, from); return; }
        // eu sou o árbitro: abro o duelo no meu árbitro antes de responder (a equipe do rival já chega nele)
        this.d = { id: String(data.duel), foe: from, phase: 'pick', ref: net.selfId };
        net.toArbiter(net.selfId, 'd-open', { duel: String(data.duel), a: from });
        net.send('d-ans', { duel: data.duel, ok }, from);
        this.#pick();
      });
      return;
    }
    if (type === 'd-ans') {
      if (this.pending?.duel !== data.duel || this.pending.foe !== from) return;
      clearTimeout(this.pending.t); this.pending = null;
      if (!data.ok) { net.ui.toast(data.why === 'ocupado' ? `${net.nameOf(from)} está ocupado.` : `${net.nameOf(from)} recusou o duelo.`); return; }
      this.d = { id: data.duel, foe: from, phase: 'pick', ref: from }; // o árbitro é quem aceitou
      this.#pick();
      return;
    }
    if (!this.d || data.duel !== this.d.id) return;
    if (from !== this.d.ref) return; // resultado de duelo só vale vindo do árbitro deste duelo
    if (type === 'd-bad') { net.ui.toast('Equipe recusada: ' + data.why); this.#pick(); return; }
    if (type === 'd-start') return this.#start(data);
    if (type === 'd-hit') return this.#hit(data);
    if (type === 'd-end') return this.#end(data);
    void g;
  }
  #pick() {
    const net = this.net;
    net.ui.pickTeam(this.g.party, (idxs) => {
      if (!this.d || this.d.phase !== 'pick') return;
      if (!idxs) { this.forfeit(); return; }
      net.toArbiter(this.d.ref, 'd-team', { duel: this.d.id, team: idxs.map((i) => monWire(this.g.party[i])) });
      net.ui.toast('Equipe enviada. Esperando o rival…');
    });
  }
  forfeit() {
    if (!this.d) return;
    this.net.toArbiter(this.d.ref, 'd-forfeit', { duel: this.d.id });
    if (this.d.phase === 'pick') { this.d = null; this.net.ui.closePick?.(); }
  }

  // ---------- início ----------
  async #start(s) {
    const g = this.g, net = this.net, me = net.selfId, d = this.d;
    const mine = (s.teams[me] ?? []).map((o) => validateMon(o)).filter((v) => v.ok).map((v) => v.mon);
    const foe = (s.teams[d.foe] ?? []).map((o) => validateMon(o)).filter((v) => v.ok).map((v) => v.mon);
    if (!mine.length || !foe.length) return;
    net.ui.closePick?.();
    Object.assign(d, { phase: 'count', arena: s.arena, mine, foeTeam: foe, saved: { party: g.party, leadIdx: g.leadIdx }, announced: null });
    // sua equipe do duelo entra no lugar da equipe normal (cópias curadas)
    g.party = mine;
    await g.sendOut(0);
    if (this.d !== d) return;
    g.lead.pvp = true;
    const st = s.starts[me];
    if (st) { g.player.x = st.x; g.player.y = st.y; g.map.resolve(g.player, g.player.r); g.lead.x = st.x + 10; g.lead.y = st.y + 6; g.cam.x = g.player.x; g.cam.y = g.player.y; }
    // o Pokémon que acompanha o rival passa a ser o "rival" (pode ser acertado)
    const r = net.remotes.get(d.foe);
    if (r) { r.duelMon = (uid) => d.foeTeam.find((m) => m.uid === uid) ?? null; r.leadKey = '__'; }
    this.#clearWilds();
    this.#drawArena();
    g.hudLead(); g.hudMoves();
    net.ui.countdown(s.count ?? 3, () => { if (this.d === d && d.phase === 'count') d.phase = 'fight'; });
    net.ui.duelBar(d);
  }
  #clearWilds() {
    const g = this.g, a = this.d.arena;
    for (const w of g.wilds.slice()) if (Math.hypot(w.x - a.x, w.y - a.y) < a.r + 140) { w.dead = true; g.removeEntity(w); }
  }
  #drawArena() {
    const g = this.g, a = this.d.arena;
    const c = new PIXI.Graphics();
    c.circle(a.x, a.y, a.r).fill({ color: 0xfff2c8, alpha: 0.12 });
    c.circle(a.x, a.y, a.r).stroke({ width: 3, color: 0xffffff, alpha: 0.85 });
    c.circle(a.x, a.y, a.r - 5).stroke({ width: 1, color: 0xe5383b, alpha: 0.8 });
    c.circle(a.x, a.y, 18).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    c.moveTo(a.x - a.r, a.y).lineTo(a.x + a.r, a.y).stroke({ width: 1.5, color: 0xffffff, alpha: 0.45 });
    for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; c.circle(a.x + Math.cos(t) * a.r, a.y + Math.sin(t) * a.r, 2.2).fill(i % 2 ? 0xe5383b : 0xffffff); }
    g.world.addChildAt(c, 1);
    this.arenaG = c;
  }

  // ---------- quadro ----------
  update(dt) {
    const d = this.d, g = this.g;
    if (!d || (d.phase !== 'count' && d.phase !== 'fight')) return;
    g.spawnT = Math.max(g.spawnT, 1); // sem selvagens nascendo durante o duelo
    if (g.wilds.length) this.#clearWilds();
    const a = d.arena, p = g.player;
    if (d.phase === 'count') { p.stun = Math.max(p.stun ?? 0, 0.1); if (g.lead) g.lead.lock = Math.max(g.lead.lock, 0.1); }
    // ninguém sai da arena
    const clamp = (e, m) => { const dx = e.x - a.x, dy = e.y - a.y, l = Math.hypot(dx, dy); if (l > a.r - m) { e.x = a.x + dx / l * (a.r - m); e.y = a.y + dy / l * (a.r - m); } };
    clamp(p, 8);
    const l = g.lead;
    if (l) {
      clamp(l, 6);
      // qualquer Pokémon que entrar em campo no duelo (Tab, ou depois de um desmaio) é de duelo
      if (!l.pvp) l.pvp = true;
      if (d.announced !== l.mon.uid && l.alive) { d.announced = l.mon.uid; this.net.toArbiter(d.ref, 'd-active', { duel: d.id, uid: l.mon.uid }); }
    }
    const r = this.net.remotes.get(d.foe);
    if (r?.follower) clamp(r.follower, 0);
  }

  // Gancho do combate: um golpe encostou num Pokémon de duelo (combat.onPvpHit)
  onPvpHit(user, t, mv, id, dx, dy) {
    const d = this.d; if (!d || d.phase !== 'fight') return;
    if (user !== this.g.lead || t.remote !== d.foe || !t.alive) return; // só quem ataca pede
    const slot = user.mon.moves.indexOf(id); if (slot < 0) return;
    this.net.toArbiter(d.ref, 'd-claim', { duel: d.id, slot, tgt: t.mon.uid, dx: +dx.toFixed(3), dy: +dy.toFixed(3) });
  }

  #ent(uid) {
    const g = this.g, d = this.d;
    if (g.lead?.pvp && g.lead.mon.uid === uid) return g.lead;
    const f = this.net.remotes.get(d.foe)?.follower;
    if (f?.mon.uid === uid) return f;
    return null;
  }
  #mon(uid) { const d = this.d; return d.mine.find((m) => m.uid === uid) ?? d.foeTeam.find((m) => m.uid === uid) ?? null; }

  // resultado oficial do árbitro: os dois lados aplicam o mesmo número
  #hit(h) {
    const g = this.g, d = this.d; if (!d.mine) return;
    const t = this.#ent(h.tgt), tm = t?.mon ?? this.#mon(h.tgt);
    const a = h.atk ? this.#ent(h.atk) : null, am = a?.mon ?? (h.atk ? this.#mon(h.atk) : null);
    if (!tm) return;
    const mv = MOVES[h.mv];
    if (t && t.alive && (h.dmg > 0 || h.dot)) {
      t.mon.hp = Math.max(0, h.hp) + h.dmg;
      g.combat.hurt(t, h.dmg, a, { eff: h.eff, crit: h.crit, mv, dx: h.dx, dy: h.dy, silent: !!h.dot, auth: true });
    } else tm.hp = Math.max(0, h.hp);
    if (h.dot && t) { t.flash = 0.1; g.fx.number(t.x, t.y - 30, String(h.dmg), tm.status === 'brn' ? '#ff9a5a' : '#c78bff'); }
    tm.status = h.st ?? null;
    const say = (txt, c) => t && g.fx.number(t.x, t.y - 34, txt, c);
    if (h.newSt) say({ brn: 'Queimado!', psn: 'Envenenado!', par: 'Paralisado!' }[h.newSt] ?? h.newSt, '#ff9adf');
    if (h.slp && t) { t.stun = 2.5; say('Dormiu!', '#ff9adf'); }
    if (h.flinch && t) t.stun = Math.max(t.stun, 0.35);
    if (h.drop) say('Caiu!', '#9ad0ff');
    if (h.conf && t) t.confused = 4;
    if (h.knock && t && a) { const dd = Math.hypot(t.x - a.x, t.y - a.y) || 1; t.kx += (t.x - a.x) / dd * h.knock * 30; t.ky += (t.y - a.y) / dd * h.knock * 30; }
    if (am && Number.isFinite(h.ahp)) {
      if (h.drain && a) g.fx.number(a.x, a.y - 28, '+' + h.drain, '#7dff8a');
      if (h.recoil && a && a.alive) { a.mon.hp = h.ahp + h.recoil; g.combat.hurt(a, h.recoil, null, { silent: true, auth: true }); }
      else am.hp = h.ahp;
    }
    if (h.eff === 0 && t && mv?.cat !== 'status' && !h.dot) say('Não afetou…', '#c8c8c8');
    this.net.ui.duelBar(d);
  }

  // Gancho do jogo (main.onFaint): no duelo, o desmaio veio do árbitro e é tratado aqui
  onFaint(e) {
    const d = this.d, g = this.g;
    if (!d || !e.pvp) return false;
    e.dead = true; e.play('Hurt');
    g.fx.burst(e.x, e.y - 8, 0xffffff, 1.2);
    g.toast(`${e.mon.name} desmaiou!`);
    if (e === g.lead) {
      g.later(0.9, async () => {
        if (this.d !== d || d.phase === 'end') return;
        const next = g.party.findIndex((m) => !m.fainted);
        if (next >= 0) { await g.sendOut(next); if (this.d === d && g.lead) { g.lead.pvp = true; g.toast(`Vai, ${g.party[next].name}!`); } }
      });
    }
    this.net.ui.duelBar(d);
    return true;
  }

  // ---------- fim ----------
  async #end(e) {
    const d = this.d, net = this.net, g = this.g;
    const started = !!d.mine;
    d.phase = 'end';
    const me = net.selfId, foeName = net.nameOf(d.foe);
    const why = { ko: '', desistiu: `${foeName} desistiu.`, caiu: `${foeName} saiu da sala.`, tempo: 'Tempo esgotado na escolha.', cancelado: 'Duelo cancelado.', empate: '' }[e.reason] ?? '';
    const title = e.winner == null ? (e.reason === 'empate' ? 'Empate!' : 'Duelo cancelado') : e.winner === me ? 'Você venceu!' : 'Você perdeu…';
    if (e.reason === 'desistiu' && e.winner !== me) Object.assign(e, { self: true });
    await this.#restore(d);
    this.d = null;
    net.ui.closePick?.();
    net.ui.duelBar(null);
    if (!started && e.reason !== 'tempo' && e.reason !== 'caiu') { net.ui.toast(why || title); return; }
    const foeStillHere = net.room?.players.has(d.foe);
    net.ui.result(title, e.self ? 'Você desistiu.' : why, foeStillHere && e.reason !== 'caiu' ? () => this.challenge(d.foe, true) : null);
    if (e.winner === me) g.audio?.sfx?.('levelup');
  }
  async #restore(d) {
    const g = this.g;
    this.arenaG?.destroy(); this.arenaG = null;
    const r = this.net.remotes.get(d.foe);
    if (r) { r.duelMon = null; r.leadKey = '__'; }
    if (d.saved) {
      g.party = d.saved.party;
      let i = d.saved.leadIdx; if (g.party[i]?.fainted) i = Math.max(0, g.party.findIndex((m) => !m.fainted));
      if (g.lead) g.lead.pvp = false;
      await g.sendOut(i);
      g.hudLead(); g.hudMoves();
    }
  }
  // saiu da sala / caiu no meio: desfaz tudo localmente
  abort() {
    if (this.pending) { clearTimeout(this.pending.t); this.pending = null; }
    this.incoming = null;
    const d = this.d; if (!d) return;
    this.d = null; this.#restore(d);
    this.net.ui.closePick?.(); this.net.ui.duelBar(null);
  }
  onPlayerGone(pid) {
    if (this.pending?.foe === pid) { clearTimeout(this.pending.t); this.pending = null; }
    const d = this.d; if (d?.foe !== pid) return;
    if (d.phase === 'pick') { this.net.ui.toast(`${this.net.nameOf(pid)} saiu.`); this.abort(); return; }
    // o rival era o árbitro e sumiu: não vem mais 'd-end', então o fim é decidido aqui (vitória por W.O.)
    if (d.ref !== this.net.selfId && d.phase !== 'end') this.#end({ duel: d.id, winner: this.net.selfId, reason: 'caiu' });
  }
}
