import { Room } from './room.js';
import { World, CHANNEL_MAX } from './world.js';
import { Remotes, EMOTES, bubble, tickBubble } from './remotes.js';
import { Arbiter } from './arbiter.js';
import { Trade } from './trade.js';
import { Duel } from './duel.js';
import { NetReide } from './reide.js';
import { cleanText, cleanName, cleanLook, monWire } from './validate.js';
import { OnlineUI } from '../ui/online.js';

// Modo online: liga o canal do mundo (world.js) ou uma sala privada (room.js) ao jogo. É o único ponto que o main.js conhece:
//   game.net = new Online(game)        // no init
//   game.net.autoStart()               // depois do título: entra sozinho num canal do mundo
//   game.net.update(dt)                // a cada quadro
//   game.net.onFaint(e, by)            // desmaio: true = o duelo online cuidou
// e dois ganchos no combate: combat.onUse (avisa seus golpes) e combat.onPvpHit (pedido ao árbitro).
//
// Dois jeitos de jogar:
//   - MUNDO (padrão): logado, o jogo entra sozinho num canal (até CHANNEL_MAX jogadores), sem código nem senha.
//     Você vê quem está perto andando no mapa, no minimapa e na lista do menu, e pode desafiar, trocar e acenar.
//   - SALA PRIVADA: código + senha, só com amigos. Enquanto ela dura, você sai do canal; ao sair dela, volta.
// ?teste=1 não entra no mundo, a menos que tenha ?online=1. ?online=0 nunca entra. ?rede=local usa a rede de teste
// entre abas (BroadcastChannel). O botão "Ficar offline" do menu também desliga (e lembra).
//
// Selvagens são LOCAIS de cada jogador (cada um tem os seus). Ver README: menos tráfego, nenhuma
// briga sobre quem capturou/derrotou, e funciona mesmo com os amigos longe uns dos outros.

const ARBITER_TYPES = new Set(['st', 'use', 'd-open', 'd-team', 'd-active', 'd-claim', 'd-forfeit', 'd-poder']);
const NEAR = 40 * 16;          // "perto" para o anfitrião repassar posição a 10 Hz, golpes e chat (40 blocos)
const GHOST = 15000;           // na reeleição do anfitrião, quem sumiu continua na tela (apagado) por até 15 s
const Q = new URLSearchParams(location.search);
const LOCALHOST = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
// ?perfil=x separa o armazenamento (dois jogadores no mesmo navegador, para testes)
const PROF = (Q.get('perfil') ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 8);
const sk = (k) => (PROF ? `${k}:${PROF}` : k);
const store = { get(k, d = null) { try { return localStorage.getItem(sk(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(sk(k), v); } catch {} } };
const fin = (v) => Number.isFinite(v);

export class Online {
  constructor(g) {
    this.g = g; this.room = null; this.arbiter = null; this.names = new Map(); this.ghosts = new Map(); this.iqAt = new Map();
    this.remotes = new Remotes(g);
    this.trade = new Trade(this); this.duel = new Duel(this);
    this.reide = new NetReide(this); // reide cooperativo das Tocas de Luz
    this.key = store.get('alv-net-key') ?? (() => { const k = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('alv-net-key', k); return k; })();
    this.name = store.get('alv-net-nome') ?? 'Treinador' + Math.floor(10 + Math.random() * 90);
    this.kind = Q.get('rede') === 'local' ? 'local' : (store.get('alv-net-rede') ?? 'peer');
    this.stT = 0; this.infoT = 0; this.seq = 0; this.infoKey = '';
    // canal do mundo (o limite por canal pode ser trocado no localhost com ?canal_max=N, para testar canal cheio)
    const max = LOCALHOST && Number(Q.get('canal_max')) >= 2 ? Math.min(32, Number(Q.get('canal_max'))) : CHANNEL_MAX;
    this.world = new World({ kind: this.kind, max, profile: () => ({ name: this.name, look: this.look, key: this.key }), near: (a, b) => this.#nearSt(a, b), pauseHidden: !Q.has('teste') });
    this.world.on('room', (room) => this.#wire(room, true));
    this.world.on('state', () => this.ui.render());
    this.ui = new OnlineUI(this);
    g.combat.onUse = (user, slot, ax, ay) => this.#onUse(user, slot, ax, ay);
    g.combat.onPvpHit = (...a) => this.duel.onPvpHit(...a);
    addEventListener('pagehide', () => { this.room?.leave(); });
  }
  get on() { return !!this.room && !this.room.closed; }
  get inWorld() { return this.mode === 'world'; }
  get selfId() { return this.room?.selfId ?? this.lastSelf; }
  get isHost() { return !!this.room?.isHost; }
  get worldOn() { return store.get('alv-net-mundo') !== '0'; }
  nameOf(id) { return this.room?.players.get(id)?.name ?? this.names.get(id) ?? 'Treinador'; }
  // visual escolhido no criador de personagem: game.look (ou game.player.look); senão o padrão
  get look() { return cleanLook(this.g.look ?? this.g.player?.look ?? 'menino'); }
  setName(n) { this.name = cleanName(n); store.set('alv-net-nome', this.name); }
  setKind(k) { this.kind = k; this.world.kind = k; store.set('alv-net-rede', k); }

  // ---------- mundo ----------
  // Chamado pelo main.js depois do título (com a conta já escolhida)
  autoStart() {
    if (Q.get('online') === '0' || ((Q.has('teste') || Q.has('mapa')) && !Q.has('online'))) return; // outro mapa (?mapa=demo-biomas) não entra no mundo online
    if (Q.has('teste')) this.setName(LOCALHOST && Q.get('nome') ? Q.get('nome') : 'Teste' + (PROF ? ' ' + PROF : ''));
    this.autoOn = true;
    if (this.worldOn && !this.on) this.world.start();
  }
  setWorld(on) {
    store.set('alv-net-mundo', on ? '1' : '0');
    if (on) { this.autoOn = true; if (!this.on || this.inWorld) this.world.start(); }
    else if (this.inWorld || this.world.running) this.world.stop();
    this.ui.render();
  }
  // perto para o anfitrião (estados 'st' crus, ainda não validados): mesmo lugar e até NEAR
  #nearSt(a, b) {
    if (!fin(a.x) || !fin(a.y) || !fin(b.x) || !fin(b.y)) return false;
    if (Math.abs(a.x - b.x) > NEAR || Math.abs(a.y - b.y) > NEAR) return false;
    const m = this.g.map;
    return (m.interiorAt(a.x, a.y)?.id ?? '') === (m.interiorAt(b.x, b.y)?.id ?? '');
  }

  // ---------- sala privada ----------
  async create({ name, password }) {
    this.setName(name);
    this.#leaveWorld();
    try {
      const room = await Room.host({ kind: this.kind, name: this.name, password, key: this.key, look: this.look });
      this.#wire(room, false);
      return room.code;
    } catch (e) { this.#backToWorld(); throw e; }
  }
  async join({ code, name, password }) {
    this.setName(name);
    this.#leaveWorld();
    try {
      const room = await Room.join({ kind: this.kind, code, name: this.name, password, key: this.key, look: this.look });
      this.#wire(room, false);
      return room.code;
    } catch (e) { this.#backToWorld(); throw e; }
  }
  #leaveWorld() { if (this.world.running) this.world.stop(); if (this.inWorld) this.#cleanup(); }
  #backToWorld() { if (this.autoOn && this.worldOn) this.world.start(); }
  leave() { if (this.inWorld) { this.setWorld(false); return; } this.room?.leave(); }

  #wire(room, channel) {
    this.room = room; this.mode = channel ? 'world' : 'room'; this.lastSelf = room.selfId;
    room.on('roster', (list) => {
      for (const p of list) { this.names.set(p.id, p.name); if (this.ghosts.delete(p.id) && p.id !== room.selfId) { this.trade.onPlayerBack(p.id); this.infoKey = ''; } }
      this.remotes.sync(list, room.selfId, [...this.ghosts.keys()]); this.ui.render();
    });
    room.on('message', (type, data, from) => this.#dispatch(type, data, from));
    room.on('status', (text, lvl) => text && this.ui.toast(text, lvl));
    room.on('join', (id) => { if (id === room.selfId) return; if (!channel) this.ui.toast(`${this.nameOf(id)} entrou na sala.`); this.#sendInfo(id); });
    room.on('leave', (id) => { if (id === room.selfId) return; this.#gone(id, true, !channel); });
    room.on('drop', (id) => { if (!channel) this.ui.toast(`A conexão de ${this.nameOf(id)} caiu. Esperando voltar…`, 'warn'); this.trade.onPlayerGone(id, false); if (!channel) this.arbiter?.onLeave(id); });
    room.on('back', (id) => { if (!channel) this.ui.toast(`${this.nameOf(id)} voltou.`, 'ok'); this.trade.onPlayerBack(id); });
    room.on('reconnected', () => { this.infoKey = ''; for (const p of room.others()) this.trade.onPlayerBack(p.id); });
    room.on('closed', (reason, code) => {
      if (this.room !== room) return;
      this.room = null;
      // canal: o anfitrião saiu ou caiu e o world.js já está reelegendo. Ninguém some de vez ainda:
      // ficam como "fantasmas" (apagados) até voltarem no canal novo, ou até GHOST passar.
      if (channel && this.world.running && !this.world.paused) {
        const until = performance.now() + GHOST;
        for (const p of room.roster) if (p.id !== room.selfId) this.ghosts.set(p.id, until);
        if (room.hostQuit && room.hostId) this.ghosts.set(room.hostId, 0); // o anfitrião fechou o jogo: sai já (no próximo quadro)
        this.remotes.sync([], room.selfId, [...this.ghosts.keys()]);
        this.ui.render();
        return;
      }
      this.#cleanup();
      if (channel) { this.ui.render(); return; }
      this.ui.closed(reason);
      this.#backToWorld();
    });
    this.remotes.sync(room.roster, room.selfId, [...this.ghosts.keys()]);
    this.infoKey = '';
    this.ui.render();
  }
  #gone(id, left, say) {
    if (say) this.ui.toast(`${this.nameOf(id)} saiu da sala.`);
    this.ghosts.delete(id);
    this.trade.onPlayerGone(id, left); this.duel.onPlayerGone(id); this.arbiter?.onLeave(id); this.reide.onPlayerGone(id);
  }
  #cleanup() {
    for (const id of [...this.ghosts.keys()]) this.#gone(id, true, false);
    this.ghosts.clear();
    this.remotes.clear(); this.duel.abort(); this.trade.abort();
    this.arbiter?.destroy(); this.arbiter = null; this.room = null; this.mode = null;
    this.ui.closeNear?.();
  }

  // ---------- mensagens ----------
  send(type, data, to) { this.room?.send(type, data, to); }
  // para o árbitro de um duelo (que mora num dos dois duelistas: quem aceitou)
  toArbiter(ref, type, data) {
    if (ref === this.selfId) { this.arbiter ??= new Arbiter((to, t, d) => this.deliver(to, t, d)); this.arbiter.handle(type, data, this.selfId); }
    else this.send(type, data, ref);
  }
  // entrega do árbitro: para mim mesmo ou pela rede
  deliver(to, type, data) { if (to === this.selfId) queueMicrotask(() => this.#dispatch(type, data, to, true)); else this.send(type, data, to); }

  #dispatch(type, data, from, fromArbiter = false) {
    if (!data || typeof data !== 'object' || typeof type !== 'string') return;
    if (!fromArbiter && (!this.on || from === this.selfId)) return;
    // para o meu árbitro (se eu estiver arbitrando um duelo). Abrir duelo no meu árbitro, só eu mesmo.
    if (!fromArbiter && this.arbiter && ARBITER_TYPES.has(type) && type !== 'd-open') this.arbiter.handle(type, data, from);
    const r = this.remotes.get(from);
    switch (type) {
      case 'st': this.remotes.onState(from, data); return;
      case 'info': r?.setInfo(data); return;
      case 'iq': this.#sendInfo(from); return; // alguém chegou perto e pediu os detalhes
      case 'use': return this.#replayUse(r, data);
      case 'chat': { const text = cleanText(data.text, 80); if (!text || !r) return; bubble(r.view, text); this.ui.chat(this.nameOf(from), text, r.color); return; }
      case 'emo': {
        const e = EMOTES[data.e]; if (!e || !r) return;
        bubble(r.view, e, { big: true, life: 2.4 });
        if (data.t === this.selfId && data.e === 'wave') this.ui.toast(`${this.nameOf(from)} acenou para você.`);
        return;
      }
    }
    if (type.startsWith('t-')) return this.trade.handle(type, data, from);
    if (type.startsWith('d-')) return this.duel.handle(type, data, from);
    if (type.startsWith('r-')) return this.reide.handle(type, data, from);
  }

  // seus golpes: os outros veem a animação (fora do duelo não acerta ninguém do outro lado)
  #onUse(user, slot, ax, ay) {
    if (!this.on || user !== this.g.lead) return;
    const data = { s: slot, ax: Math.round(ax), ay: Math.round(ay) };
    this.send('use', data);
    this.arbiter?.handle('use', data, this.selfId);
  }
  #replayUse(r, d) {
    const e = r?.follower; if (!e || !e.alive || !r.view.visible || !Number.isInteger(d.s) || d.s < 0 || d.s > 3) return;
    if (!fin(d.ax) || !fin(d.ay) || Math.abs(d.ax - e.x) > 2000 || Math.abs(d.ay - e.y) > 2000) return;
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
  // emote; `to` = id de quem você cumprimentou (Acenar), para ele receber o aviso
  emote(e, to = null) {
    if (!EMOTES[e] || !this.on) return;
    this.send('emo', to ? { e, t: to } : { e });
    bubble(this.g.player.view, EMOTES[e], { big: true, life: 2.4 });
  }

  #sendInfo(to) {
    const lead = this.g.lead?.mon;
    this.send('info', { lead: lead ? monWire(lead) : null, look: this.look }, to);
  }

  // jogadores para a lista do menu: nome, cor, onde está e a que distância
  players() {
    const room = this.room; if (!room) return [];
    const p = this.g.player, m = this.g.map;
    return room.roster.map((q) => {
      const r = this.remotes.get(q.id), me = q.id === room.selfId;
      const has = me || r?.has, x = me ? p.x : r?.x, y = me ? p.y : r?.y;
      const same = has && this.remotes.sameRoom(x, y);
      return { ...q, me, area: has ? m.areaName(x, y) : '…', dist: has && same && !me ? Math.round(Math.hypot(x - p.x, y - p.y) / 16) : null, near: !!r?.view.visible };
    });
  }

  // ---------- quadro ----------
  update(dt, paused = false) {
    tickBubble(this.g.player.view, dt);
    // fantasmas da reeleição que não voltaram a tempo: agora saíram mesmo
    if (this.ghosts.size) {
      const now = performance.now(), out = [...this.ghosts].filter(([, t]) => now > t).map(([id]) => id);
      for (const id of out) this.#gone(id, true, false);
      if (out.length) this.remotes.sync(this.room?.roster ?? [], this.selfId, [...this.ghosts.keys()]);
    }
    const g = this.g, p = g.player, l = g.lead;
    if (!this.on) { if (this.ghosts.size) this.remotes.update(dt, this.duel.foeId); return; }
    // Pokémon que acompanha mudou (troca, evolução, golpe novo): manda os detalhes
    const key = (l ? `${l.mon.uid}:${l.mon.dex}:${l.mon.level}:${l.mon.moves.join(',')}` : '-') + JSON.stringify(this.g.look ?? this.g.player?.look ?? '');
    this.infoT -= dt;
    if (key !== this.infoKey || this.infoT <= 0) { this.infoKey = key; this.infoT = 10; this.#sendInfo(); }
    // posição: 20x/s no duelo, 10x/s com alguém por perto, 2x/s sozinho (o anfitrião repassa 1x/s para quem está longe)
    this.stT -= dt;
    if (this.stT <= 0) {
      const busy = this.duel.active || this.remotes.nearest(p.x, p.y, NEAR + 160) || this.room.players.size <= 2 || this.mode === 'room';
      this.stT = this.duel.active ? 0.05 : busy ? 0.1 : 0.5;
      const r1 = (v) => Math.round(v * 10) / 10;
      const st = { ts: Math.round(performance.now()), seq: ++this.seq, x: r1(p.x), y: r1(p.y), d: p.dir, r: p.speed > 100 };
      if (l?.alive) st.l = { x: r1(l.x), y: r1(l.y), u: l.mon.uid, a: l.dir };
      const mt = this.g.mount?.netState(); if (mt) Object.assign(st, mt); // montaria: tipo, altura do voo, mergulho (e mountDex)
      this.send('st', st);
      this.arbiter?.handle('st', st, this.selfId);
    }
    this.remotes.update(dt, this.duel.foeId);
    // apareceu na tela alguém de quem não sabemos o Pokémon: pede os detalhes (uma vez a cada 4 s por pessoa)
    for (const r of this.remotes.map.values()) {
      if (!r.view.visible || r.drop) continue;
      const u = r.buf[r.buf.length - 1]?.l?.u;
      if (u && r.lead?.uid !== u && performance.now() - (this.iqAt.get(r.id) ?? -1e9) > 4000) { this.iqAt.set(r.id, performance.now()); this.send('iq', {}, r.id); }
    }
    this.duel.update(dt);
    // perto de alguém: E (ou o botão A) abre as opções com aquele jogador
    const near = this.duel.active || paused ? null : this.remotes.nearest(p.x, p.y, 40);
    this.ui.near(near);
    if (near && g.input.pressed('act') && !this.ui.modalOpen) { g.input.taps.delete('act'); this.ui.playerMenu(near.id); }
  }
  onFaint(e, by) { return this.duel.onFaint(e, by); }
}
