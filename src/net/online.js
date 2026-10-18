import { Room } from './room.js';
import { Remotes, EMOTES, bubble, tickBubble } from './remotes.js';
import { Arbiter } from './arbiter.js';
import { Trade } from './trade.js';
import { Duel } from './duel.js';
import { cleanText, cleanName, monWire } from './validate.js';
import { OnlineUI } from '../ui/online.js';

// Modo online: liga a sala (room.js) ao jogo. É o único ponto que o main.js conhece:
//   game.net = new Online(game)        // no init
//   game.net.update(dt)                // a cada quadro
//   game.net.onFaint(e, by)            // desmaio: true = o duelo online cuidou
// e dois ganchos no combate: combat.onUse (avisa seus golpes) e combat.onPvpHit (pedido ao árbitro).
//
// Selvagens são LOCAIS de cada jogador (cada um tem os seus). Ver README: menos tráfego, nenhuma
// briga sobre quem capturou/derrotou, e funciona mesmo com os amigos longe uns dos outros.

const ARBITER_TYPES = new Set(['st', 'use', 'd-open', 'd-team', 'd-active', 'd-claim', 'd-forfeit']);
// ?perfil=x separa o armazenamento (dois jogadores no mesmo navegador, para testes)
const PROF = (new URLSearchParams(location.search).get('perfil') ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 8);
const sk = (k) => (PROF ? `${k}:${PROF}` : k);
const store = { get(k, d = null) { try { return localStorage.getItem(sk(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(sk(k), v); } catch {} } };

export class Online {
  constructor(g) {
    this.g = g; this.room = null; this.arbiter = null; this.names = new Map();
    this.remotes = new Remotes(g);
    this.trade = new Trade(this); this.duel = new Duel(this);
    this.key = store.get('alv-net-key') ?? (() => { const k = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('alv-net-key', k); return k; })();
    this.name = store.get('alv-net-nome') ?? 'Treinador' + Math.floor(10 + Math.random() * 90);
    this.kind = new URLSearchParams(location.search).get('rede') === 'local' ? 'local' : (store.get('alv-net-rede') ?? 'peer');
    this.stT = 0; this.infoT = 0; this.seq = 0; this.infoKey = '';
    this.ui = new OnlineUI(this);
    g.combat.onUse = (user, slot, ax, ay) => this.#onUse(user, slot, ax, ay);
    g.combat.onPvpHit = (...a) => this.duel.onPvpHit(...a);
    addEventListener('pagehide', () => this.room?.leave());
  }
  get on() { return !!this.room && !this.room.closed; }
  get selfId() { return this.room?.selfId; }
  get isHost() { return !!this.room?.isHost; }
  nameOf(id) { return this.room?.players.get(id)?.name ?? this.names.get(id) ?? 'Treinador'; }
  setName(n) { this.name = cleanName(n); store.set('alv-net-nome', this.name); }
  setKind(k) { this.kind = k; store.set('alv-net-rede', k); }

  // ---------- entrar / sair ----------
  async create({ name, password }) {
    this.setName(name);
    const room = await Room.host({ kind: this.kind, name: this.name, password, key: this.key });
    this.arbiter = new Arbiter((to, type, data) => this.deliver(to, type, data));
    this.#wire(room);
    return room.code;
  }
  async join({ code, name, password }) {
    this.setName(name);
    const room = await Room.join({ kind: this.kind, code, name: this.name, password, key: this.key });
    this.#wire(room);
    return room.code;
  }
  leave() { this.room?.leave(); }
  #wire(room) {
    this.room = room;
    room.on('roster', (list) => { for (const p of list) this.names.set(p.id, p.name); this.remotes.sync(list, room.selfId); this.ui.render(); });
    room.on('message', (type, data, from) => this.#dispatch(type, data, from));
    room.on('status', (text, lvl) => text && this.ui.toast(text, lvl));
    room.on('join', (id) => { if (id !== room.selfId) { this.ui.toast(`${this.nameOf(id)} entrou na sala.`); this.infoT = 0; this.#sendInfo(id); } });
    room.on('leave', (id) => { if (id === room.selfId) return; this.ui.toast(`${this.nameOf(id)} saiu da sala.`); this.trade.onPlayerGone(id, true); this.duel.onPlayerGone(id); this.arbiter?.onLeave(id); });
    room.on('drop', (id) => { this.ui.toast(`A conexão de ${this.nameOf(id)} caiu. Esperando voltar…`, 'warn'); this.trade.onPlayerGone(id, false); this.arbiter?.onLeave(id); });
    room.on('back', (id) => { this.ui.toast(`${this.nameOf(id)} voltou.`, 'ok'); this.trade.onPlayerBack(id); });
    room.on('reconnected', () => { this.infoKey = ''; for (const p of room.others()) this.trade.onPlayerBack(p.id); });
    room.on('closed', (reason) => {
      this.remotes.clear(); this.duel.abort(); this.trade.abort();
      this.arbiter?.destroy(); this.arbiter = null; this.room = null;
      this.ui.closed(reason);
    });
    this.remotes.sync(room.roster, room.selfId);
    this.infoKey = '';
    this.ui.render();
  }

  // ---------- mensagens ----------
  send(type, data, to) { this.room?.send(type, data, to); }
  // para o árbitro (que mora no anfitrião)
  toHost(type, data) { if (this.isHost) this.#dispatch(type, data, this.selfId); else this.send(type, data, this.room?.hostId); }
  // entrega do árbitro: para mim mesmo ou pela rede
  deliver(to, type, data) { if (to === this.selfId) queueMicrotask(() => this.#dispatch(type, data, to, true)); else this.send(type, data, to); }

  #dispatch(type, data, from, fromArbiter = false) {
    if (!this.on || !data || typeof data !== 'object') return;
    if (this.arbiter && ARBITER_TYPES.has(type) && !fromArbiter) this.arbiter.handle(type, data, from);
    if (from === this.selfId && !fromArbiter && ARBITER_TYPES.has(type)) return; // eu mesmo para o meu árbitro
    // mensagens do árbitro só valem se vieram do anfitrião
    if (['d-start', 'd-hit', 'd-end', 'd-bad'].includes(type) && from !== this.room.hostId && !fromArbiter) return;
    const r = this.remotes.get(from);
    switch (type) {
      case 'st': this.remotes.onState(from, data); return;
      case 'info': r?.setInfo(data); return;
      case 'use': return this.#replayUse(r, data);
      case 'chat': { const text = cleanText(data.text, 80); if (!text || !r) return; bubble(r.view, text); this.ui.chat(this.nameOf(from), text, r.color); return; }
      case 'emo': { const e = EMOTES[data.e]; if (e && r) bubble(r.view, e, { big: true, life: 2.4 }); return; }
    }
    if (type.startsWith('t-')) return this.trade.handle(type, data, from);
    if (type.startsWith('d-')) return this.duel.handle(type, data, from);
  }

  // seus golpes: os outros veem a animação (fora do duelo não acerta ninguém do outro lado)
  #onUse(user, slot, ax, ay) {
    if (!this.on || user !== this.g.lead) return;
    const data = { s: slot, ax: Math.round(ax), ay: Math.round(ay) };
    this.send('use', data);
    if (this.isHost) this.arbiter?.handle('use', data, this.selfId);
  }
  #replayUse(r, d) {
    const e = r?.follower; if (!e || !e.alive || !Number.isInteger(d.s) || d.s < 0 || d.s > 3) return;
    if (!Number.isFinite(d.ax) || !Number.isFinite(d.ay)) return;
    e.cds[d.s] = 0; e.lock = 0; e.stun = 0;
    this.g.combat.use(e, d.s, d.ax, d.ay);
  }

  say(text) {
    text = cleanText(text, 80); if (!text || !this.on) return;
    this.send('chat', { text });
    bubble(this.g.player.view, text);
    const me = this.room.players.get(this.selfId);
    this.ui.chat(this.name, text, me?.color ?? '#fff');
  }
  emote(e) {
    if (!EMOTES[e] || !this.on) return;
    this.send('emo', { e });
    bubble(this.g.player.view, EMOTES[e], { big: true, life: 2.4 });
  }

  #sendInfo(to) {
    const lead = this.g.lead?.mon;
    this.send('info', { lead: lead ? monWire(lead) : null }, to);
  }

  // ---------- quadro ----------
  update(dt) {
    tickBubble(this.g.player.view, dt);
    if (!this.on) return;
    const g = this.g, p = g.player, l = g.lead;
    // Pokémon que acompanha mudou (troca, evolução, golpe novo): manda os detalhes
    const key = l ? `${l.mon.uid}:${l.mon.dex}:${l.mon.level}:${l.mon.moves.join(',')}` : '-';
    this.infoT -= dt;
    if (key !== this.infoKey || this.infoT <= 0) { this.infoKey = key; this.infoT = 4; this.#sendInfo(); }
    // posição: 10x/s passeando, 20x/s no duelo
    this.stT -= dt;
    if (this.stT <= 0) {
      this.stT = this.duel.active ? 0.05 : 0.1;
      const r1 = (v) => Math.round(v * 10) / 10;
      const st = { ts: Math.round(performance.now()), seq: ++this.seq, x: r1(p.x), y: r1(p.y), d: p.dir, r: p.speed > 100 };
      if (l?.alive) st.l = { x: r1(l.x), y: r1(l.y), u: l.mon.uid, a: l.dir };
      this.send('st', st);
      if (this.isHost) this.arbiter?.handle('st', st, this.selfId);
    }
    this.remotes.update(dt, this.duel.foeId);
    this.duel.update(dt);
    // perto de alguém: E (ou o botão A) abre as opções com aquele jogador
    const near = this.duel.active ? null : this.remotes.nearest(p.x, p.y, 40);
    this.ui.near(near);
    if (near && g.input.pressed('act') && !this.ui.modalOpen) this.ui.playerMenu(near.id);
  }
  onFaint(e, by) { return this.duel.onFaint(e, by); }
}
