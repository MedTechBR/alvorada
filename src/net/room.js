import { Emitter, createTransport } from './transport.js';
import { cleanName, cleanLook } from './validate.js';

// Sala em estrela: o anfitrião é o centro. Cada amigo tem um único link, com o anfitrião, que
// repassa as mensagens. Isso limita a 7 conexões no anfitrião (8 jogadores) e deixa um só lugar
// para conferir senha, quem é quem e o árbitro dos duelos.
//
// Aperto de mão (a senha NUNCA trafega, nem em URL):
//   anfitrião -> cliente  {k:'chal', nonce, v}
//   cliente -> anfitrião  {k:'hello', name, look, key, proof = SHA-256(nonce|código|senha), rejoin?}
//   anfitrião -> cliente  {k:'welcome', id, token, roster} | {k:'deny', why}
// Depois: {k:'m', type, data, to?, from} (mensagem do jogo), {k:'roster'}, {k:'ping'}/{k:'pong'}, {k:'bye'}.

export const PROTO = 1;
export const MAX_PLAYERS = 8;
const PING_EVERY = 2500, DEAD_AFTER = 11000, KEEP_SLOT = 30000;
export const COLORS = ['#e5383b', '#2f6fe4', '#2fbf71', '#f2a93b', '#9b5de5', '#ef6fb0', '#20b2c9', '#8a6a4a'];

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function proofOf(nonce, code, password) {
  const data = new TextEncoder().encode(`${nonce}|${code}|${password}`);
  return hex(await crypto.subtle.digest('SHA-256', data));
}
const rnd = (n = 12) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); };
export function newRoomCode() { return 'ALV-' + String(1000 + Math.floor(Math.random() * 9000)); }

// Eventos: 'roster'(players) 'message'(type, data, from) 'status'(texto, nível) 'closed'(motivo)
//          'join'(id) 'leave'(id) 'drop'(id) 'back'(id)
export class Room extends Emitter {
  constructor() { super(); this.players = new Map(); this.selfId = null; this.isHost = false; this.code = null; this.closed = false; }
  get hostId() { return 'h'; }
  get roster() { return [...this.players.values()]; }
  others() { return this.roster.filter((p) => p.id !== this.selfId); }

  // ---------- anfitrião ----------
  static async host({ kind = 'peer', name, password, key, look }) {
    const r = new Room(); r.isHost = true; r.kind = kind; r.password = String(password ?? '');
    r.selfId = 'h'; r.links = new Map(); r.nextId = 1;
    r.players.set('h', { id: 'h', name: cleanName(name), look: cleanLook(look), color: COLORS[0], host: true, key, drop: false });
    for (let tries = 0; ; tries++) {
      const code = newRoomCode();
      r.t = createTransport(kind);
      try { await r.t.listen(code); r.code = code; break; }
      catch (e) { r.t.destroy(); if (e.message !== 'taken' || tries > 6) throw e; }
    }
    r.t.on('link', (link) => r.#accept(link));
    r.t.on('signal', (s) => r.emit('status', s === 'lost' ? 'Sinalização instável; quem já está na sala continua.' : '', 'warn'));
    r.pinger = setInterval(() => r.#hostTick(), PING_EVERY);
    return r;
  }

  #accept(link) {
    const nonce = rnd(16); let st = 'chal';
    link.lastSeen = performance.now();
    link.send({ k: 'chal', nonce, v: PROTO });
    const kill = setTimeout(() => { if (st === 'chal') link.close(); }, 12000);
    link.on('message', async (m) => {
      link.lastSeen = performance.now();
      if (st === 'chal') {
        if (m.k !== 'hello') return;
        st = 'checking'; clearTimeout(kill);
        if (m.v !== PROTO) return this.#deny(link, 'versao');
        const want = await proofOf(nonce, this.code, this.password);
        if (m.proof !== want) { await new Promise((r) => setTimeout(r, 700)); return this.#deny(link, 'senha'); }
        // volta de quem caiu: mesma vaga (mesmo id), se a chave e o token batem
        let p = m.rejoin && this.players.get(m.rejoin.id);
        if (p && (p.token !== m.rejoin.token || p.key !== m.key)) p = null;
        if (!p) {
          const old = [...this.players.values()].find((q) => q.key && q.key === m.key && q.drop);
          if (old) p = old;
        }
        if (p) {
          this.links.get(p.id)?.close();
          p.drop = false; p.name = cleanName(m.name); p.look = cleanLook(m.look); clearTimeout(p.dropT);
          this.emit('back', p.id);
        } else {
          if (this.players.size >= MAX_PLAYERS) return this.#deny(link, 'cheia');
          const id = 'p' + this.nextId++;
          const used = new Set([...this.players.values()].map((q) => q.color));
          p = { id, name: cleanName(m.name), look: cleanLook(m.look), color: COLORS.find((c) => !used.has(c)) ?? COLORS[this.nextId % 8], host: false, key: String(m.key ?? '').slice(0, 40), token: rnd(12), drop: false };
          this.players.set(id, p);
          this.emit('join', id);
        }
        st = 'in'; link.pid = p.id; this.links.set(p.id, link);
        link.send({ k: 'welcome', id: p.id, token: p.token, roster: this.#pub(), code: this.code });
        this.#broadcastRoster();
        return;
      }
      if (st !== 'in') return;
      if (m.k === 'ping') return link.send({ k: 'pong', t: m.t });
      if (m.k === 'pong') { const p = this.players.get(link.pid); if (p) p.ping = Math.round(performance.now() - m.t); return; }
      if (m.k === 'bye') { this.#gone(link.pid, true); link.close(); return; }
      if (m.k === 'm' && typeof m.type === 'string') this.#route(link.pid, m.type, m.data, m.to);
    });
    link.on('close', () => { if (st === 'in' && this.links.get(link.pid) === link) this.#gone(link.pid, false); });
  }
  #deny(link, why) { link.send({ k: 'deny', why }); setTimeout(() => link.close(), 300); }
  // repassa: `from` é sempre carimbado pelo anfitrião (ninguém se passa por outro)
  #route(from, type, data, to) {
    if (to && to !== 'h') { this.links.get(to)?.send({ k: 'm', type, data, from }); return; }
    if (!to) for (const [id, l] of this.links) if (id !== from) l.send({ k: 'm', type, data, from });
    this.emit('message', type, data, from);
  }
  #gone(id, left) {
    const p = this.players.get(id); if (!p) return;
    this.links.get(id)?.close(); this.links.delete(id);
    if (left) { this.players.delete(id); this.emit('leave', id); this.#broadcastRoster(); return; }
    p.drop = true; this.emit('drop', id); this.#broadcastRoster();
    p.dropT = setTimeout(() => { if (p.drop) { this.players.delete(id); this.emit('leave', id); this.#broadcastRoster(); } }, KEEP_SLOT);
  }
  #hostTick() {
    const now = performance.now();
    for (const [id, l] of this.links) {
      if (now - l.lastSeen > DEAD_AFTER) { this.#gone(id, false); continue; }
      l.send({ k: 'ping', t: now });
    }
  }
  #pub() { return this.roster.map(({ id, name, look, color, host, drop, ping }) => ({ id, name, look, color, host, drop, ping })); }
  #broadcastRoster() { const roster = this.#pub(); for (const l of this.links.values()) l.send({ k: 'roster', roster }); this.emit('roster', this.roster); }
  kick(id) { this.links.get(id)?.send({ k: 'bye', why: 'kick' }); this.#gone(id, true); }

  // ---------- cliente ----------
  static async join({ kind = 'peer', code, name, password, key, look }) {
    const r = new Room(); r.kind = kind; r.code = String(code).trim().toUpperCase(); r.name = cleanName(name); r.key = key; r.look = cleanLook(look);
    r.password = String(password ?? '');
    if (/^\d{4}$/.test(r.code)) r.code = 'ALV-' + r.code;
    try { await r.#connect(null); } catch (e) { r.closed = true; clearInterval(r.pinger); r.t?.destroy(); throw e; }
    return r;
  }
  async #connect(rejoin) {
    this.t?.destroy();
    this.t = createTransport(this.kind);
    const link = await this.t.connect(this.code);
    const res = await new Promise((resolve, reject) => {
      const to = setTimeout(() => { reject(new Error('timeout')); link.close(); }, 12000);
      link.on('message', async (m) => {
        if (m.k === 'chal') { link.send({ k: 'hello', v: PROTO, name: this.name, look: this.look, key: this.key, proof: await proofOf(m.nonce, this.code, this.password), rejoin }); return; }
        if (m.k === 'deny') { clearTimeout(to); reject(new Error(m.why)); return; }
        if (m.k === 'welcome') { clearTimeout(to); resolve(m); return; }
        this.#clientMsg(m);
      });
      link.on('close', () => { clearTimeout(to); reject(new Error('closed')); this.#lost(link); });
    });
    this.link = link; this.selfId = res.id; this.token = res.token; this.lastSeen = performance.now();
    this.#setRoster(res.roster);
    clearInterval(this.pinger);
    this.pinger = setInterval(() => {
      if (this.link !== link) return;
      if (performance.now() - this.lastSeen > DEAD_AFTER) { link.close(); this.#lost(link); return; }
      link.send({ k: 'ping', t: performance.now() });
    }, PING_EVERY);
    return res;
  }
  #clientMsg(m) {
    this.lastSeen = performance.now();
    if (m.k === 'ping') return this.link?.send({ k: 'pong', t: m.t });
    if (m.k === 'pong') { this.ping = Math.round(performance.now() - m.t); const me = this.players.get(this.selfId); if (me) me.ping = this.ping; return; }
    if (m.k === 'roster') return this.#setRoster(m.roster);
    if (m.k === 'bye') { this.#close(m.why === 'kick' ? 'Você foi removido da sala.' : 'O anfitrião encerrou a sala.'); return; }
    if (m.k === 'm') this.emit('message', m.type, m.data, m.from);
  }
  #setRoster(list) {
    const before = new Set(this.players.keys()), now = new Set();
    const was = new Map([...this.players].map(([id, p]) => [id, p.drop]));
    this.players = new Map();
    for (const p of list ?? []) { this.players.set(p.id, p); now.add(p.id); }
    for (const id of now) if (!before.has(id)) this.emit('join', id);
    for (const id of before) if (!now.has(id)) this.emit('leave', id);
    for (const p of this.players.values()) { if (was.get(p.id) === false && p.drop) this.emit('drop', p.id); if (was.get(p.id) === true && !p.drop) this.emit('back', p.id); }
    this.emit('roster', this.roster);
  }
  // queda do link com o anfitrião: tenta voltar para a mesma vaga
  async #lost(link) {
    if (this.closed || this.link !== link || this.reconnecting) return;
    this.reconnecting = true; this.link = null;
    for (let i = 1; i <= 6 && !this.closed; i++) {
      this.emit('status', `Conexão caiu. Reconectando (${i}/6)…`, 'warn');
      await new Promise((r) => setTimeout(r, 1200 * i));
      if (this.closed) return;
      try {
        await this.#connect({ id: this.selfId, token: this.token });
        this.reconnecting = false;
        this.emit('status', 'Reconectado!', 'ok'); this.emit('reconnected');
        return;
      } catch (e) {
        if (e.message === 'senha' || e.message === 'cheia') break;
      }
    }
    this.reconnecting = false;
    this.#close('A sala foi encerrada: o anfitrião saiu ou a conexão não voltou.');
  }

  // ---------- comum ----------
  // type: tipo da mensagem do jogo; to: id do jogador (sem `to` = todos os outros)
  send(type, data, to) {
    if (this.closed) return;
    if (this.isHost) {
      const m = { k: 'm', type, data, from: 'h' };
      if (to) this.links.get(to)?.send(m); else for (const l of this.links.values()) l.send(m);
    } else this.link?.send({ k: 'm', type, data, to });
  }
  #close(reason) {
    if (this.closed) return;
    this.closed = true; clearInterval(this.pinger);
    try { this.t?.destroy(); } catch {}
    this.emit('closed', reason);
  }
  leave() {
    if (this.closed) return;
    if (this.isHost) { for (const l of this.links.values()) l.send({ k: 'bye', why: 'host-left' }); }
    else this.link?.send({ k: 'bye' });
    // dá tempo de a despedida sair antes de derrubar a conexão
    this.closed = true; clearInterval(this.pinger);
    setTimeout(() => { try { this.t?.destroy(); } catch {} }, 250);
    this.emit('closed', 'Você saiu da sala.');
  }
}
