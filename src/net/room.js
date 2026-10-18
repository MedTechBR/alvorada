import { Emitter, createTransport } from './transport.js';
import { cleanName, cleanLook } from './validate.js';

// Sala em estrela: o anfitrião é o centro. Cada jogador tem um único link, com o anfitrião, que
// repassa as mensagens. Serve aos dois jeitos de jogar:
//   - sala privada (código ALV-1234 + senha, até MAX_PLAYERS);
//   - canal do mundo (src/net/world.js): código fixo "mundo-…-cN", senha pública, até ~16, sem expulsar
//     ninguém e com reeleição do anfitrião quando ele sai (quem cuida disso é o world.js).
//
// Aperto de mão (a senha NUNCA trafega, nem em URL):
//   anfitrião -> cliente  {k:'chal', nonce, v}
//   cliente -> anfitrião  {k:'hello', name, look, key, proof = SHA-256(nonce|código|senha)}
//   anfitrião -> cliente  {k:'welcome', id, roster} | {k:'deny', why}
// Depois: {k:'m', type, data, to?, from} (mensagem do jogo), {k:'sts', l:[{f, d}]} (posições em lote),
// {k:'roster'}, {k:'ping'}/{k:'pong'}, {k:'bye', why, next?}.
//
// Identidade: o id de cada jogador é SHA-256 da chave secreta do aparelho (alv-net-key), cortado. É o mesmo
// em qualquer sala ou canal e depois de cada reeleição, então a troca e o duelo continuam se o anfitrião
// mudar. Só o anfitrião vê a chave; os outros só veem o id, e não dá para tirar a chave dele.
//
// Tráfego (o que mais pesa num canal cheio): a posição ('st') não é repassada na hora. O anfitrião guarda a
// última de cada um e, a cada TICK, manda a cada jogador um lote só com as novidades: de quem está perto, sempre;
// de quem está longe, 1 vez por segundo (o bastante para o minimapa e a lista). Golpes, chat, emotes e o
// 'info' também só vão para quem está perto. "Perto" é decidido pelo jogo (opção `near`).

export const PROTO = 2;
export const MAX_PLAYERS = 8;
const PING_EVERY = 2500, DEAD_AFTER = 11000, KEEP_SLOT = 30000;
const TICK = 50, FAR_EVERY = 20;                 // lote a cada 50 ms; quem está longe, a cada 20 lotes (1 s)
const NEAR_TYPES = new Set(['use', 'chat', 'emo', 'info']);
const RATE = 45, BURST = 90, FLOOD = 300;        // por link: 45 msg/s (rajada de 90); 300 descartadas = expulso
const IN_CAP = 900;                              // cliente: no máximo isto por segundo vindo do anfitrião
const TYPE_RE = /^[a-z][a-z?-]{0,11}$/;
const ID_RE = /^[a-z0-9]{1,16}$/i;
export const COLORS = ['#e5383b', '#2f6fe4', '#2fbf71', '#f2a93b', '#9b5de5', '#ef6fb0', '#20b2c9', '#8a6a4a'];

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const proofOf = (nonce, code, password) => sha(`${nonce}|${code}|${password}`);
export const idOf = async (key) => 'u' + (await sha('alv-id|' + key)).slice(0, 12);
const rnd = (n = 12) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); };
export function newRoomCode() { return 'ALV-' + String(1000 + Math.floor(Math.random() * 9000)); }

// Eventos: 'roster'(players) 'message'(type, data, from) 'status'(texto, nível) 'closed'(texto, código)
//          'join'(id) 'leave'(id) 'drop'(id) 'back'(id) 'id-lost' (anfitrião: perdeu o código do canal)
export class Room extends Emitter {
  constructor() { super(); this.players = new Map(); this.selfId = null; this.isHost = false; this.code = null; this.closed = false; this.hostPid = null; }
  get hostId() { return this.hostPid; }
  get roster() { return [...this.players.values()]; }
  others() { return this.roster.filter((p) => p.id !== this.selfId); }
  // ordem de sucessão (canal): quem entrou antes assume primeiro; o anfitrião atual e quem caiu ficam de fora
  succession() { return this.roster.filter((p) => !p.host && !p.drop).map((p) => p.id); }

  // ---------- anfitrião ----------
  static async host({ kind = 'peer', name, password, key, look, code = null, max = MAX_PLAYERS, channel = false, near = null }) {
    const r = new Room(); r.isHost = true; r.kind = kind; r.password = String(password ?? ''); r.max = max; r.channel = channel; r.near = near;
    r.selfId = r.hostPid = await idOf(key); r.links = new Map(); r.last = new Map(); r.banned = new Set(); r.tickN = 0;
    r.players.set(r.selfId, { id: r.selfId, name: cleanName(name), look: cleanLook(look), color: COLORS[0], host: true, drop: false });
    for (let tries = 0; ; tries++) {
      const c = code ?? newRoomCode();
      r.t = createTransport(kind);
      try { await r.t.listen(c); r.code = c; break; }
      catch (e) { r.t.destroy(); if (code || e.message !== 'taken' || tries > 6) throw e; }
    }
    r.t.on('link', (link) => r.#accept(link));
    r.t.on('signal', (s) => r.emit('status', s === 'lost' && !channel ? 'Sinalização instável; quem já está na sala continua.' : '', 'warn'));
    r.t.on('id-lost', () => r.emit('id-lost'));
    r.pinger = setInterval(() => r.#hostTick(), PING_EVERY);
    r.flusher = setInterval(() => r.#flush(), TICK);
    return r;
  }

  #accept(link) {
    const nonce = rnd(16); let st = 'chal';
    link.lastSeen = performance.now();
    link.send({ k: 'chal', nonce, v: PROTO });
    const kill = setTimeout(() => { if (st !== 'in') link.close(); }, 12000);
    link.on('message', async (m) => {
      link.lastSeen = performance.now();
      if (st === 'chal') {
        if (m.k !== 'hello') return;
        st = 'checking';
        if (m.v !== PROTO) return this.#deny(link, 'versao');
        const want = await proofOf(nonce, this.code, this.password);
        if (m.proof !== want) { await new Promise((r) => setTimeout(r, 700)); return this.#deny(link, 'senha'); }
        if (typeof m.key !== 'string' || m.key.length < 8 || m.key.length > 64) return this.#deny(link, 'versao');
        const id = await idOf(m.key);
        if (this.closed) return link.close();
        if (id === this.selfId) return this.#deny(link, 'dup');
        if (this.banned.has(id)) return this.#deny(link, 'kick');
        let p = this.players.get(id);
        const old = this.links.get(id);
        // a mesma conta já está aqui: se o link antigo ainda fala, é outra aba (recusa); se calou, é quem caiu voltando
        if (p && !p.drop && old && performance.now() - old.lastSeen < 4000) return this.#deny(link, 'dup');
        if (p) {
          old?.close(); this.links.delete(id);
          const was = p.drop;
          p.drop = false; p.name = cleanName(m.name); p.look = cleanLook(m.look); clearTimeout(p.dropT);
          if (was) this.emit('back', id);
        } else {
          if (this.players.size >= this.max) return this.#deny(link, 'cheia');
          const used = new Set([...this.players.values()].map((q) => q.color));
          p = { id, name: cleanName(m.name), look: cleanLook(m.look), color: COLORS.find((c) => !used.has(c)) ?? COLORS[this.players.size % COLORS.length], host: false, drop: false };
          this.players.set(id, p);
          this.emit('join', id);
        }
        clearTimeout(kill);
        st = 'in'; link.pid = id; link.tok = BURST; link.tokT = performance.now(); link.dropped = 0; link.sent = new Map();
        this.links.set(id, link);
        link.send({ k: 'welcome', id, roster: this.#pub(), code: this.code, max: this.max });
        this.#broadcastRoster();
        return;
      }
      if (st !== 'in' || this.links.get(link.pid) !== link) return;
      // limite de mensagens: quem inunda perde as que passam do limite e, se insistir, sai
      const now = performance.now();
      link.tok = Math.min(BURST, link.tok + (now - link.tokT) * RATE / 1000); link.tokT = now;
      if (link.tok < 1) { if (++link.dropped > FLOOD) { this.banned.add(link.pid); link.send({ k: 'bye', why: 'flood' }); this.#gone(link.pid, true); } return; }
      link.tok -= 1;
      if (m.k === 'ping') return link.send({ k: 'pong', t: m.t });
      if (m.k === 'pong') { const p = this.players.get(link.pid); if (p && Number.isFinite(m.t)) p.ping = Math.max(0, Math.min(9999, Math.round(now - m.t))); return; }
      if (m.k === 'bye') { this.#gone(link.pid, true); link.close(); return; }
      if (m.k === 'm' && typeof m.type === 'string' && TYPE_RE.test(m.type) && m.data && typeof m.data === 'object') this.#route(link.pid, m.type, m.data, typeof m.to === 'string' ? m.to : null);
    });
    link.on('close', () => { clearTimeout(kill); if (st === 'in' && this.links.get(link.pid) === link) this.#gone(link.pid, false); });
  }
  #deny(link, why) { link.send({ k: 'deny', why }); setTimeout(() => link.close(), 300); }
  #near(a, b) {
    const A = this.last.get(a)?.d, B = this.last.get(b)?.d;
    if (!A || !B || !this.near) return true; // sem posição ainda: na dúvida, manda
    try { return !!this.near(A, B); } catch { return true; }
  }
  // repassa: `from` é sempre carimbado pelo anfitrião (ninguém se passa por outro)
  #route(from, type, data, to) {
    if (to) {
      if (to === this.selfId) this.emit('message', type, data, from);
      else this.links.get(to)?.send({ k: 'm', type, data, from });
      return;
    }
    if (type === 'st') { this.#store(from, data); this.emit('message', type, data, from); return; }
    const near = NEAR_TYPES.has(type);
    for (const [id, l] of this.links) if (id !== from && (!near || this.#near(from, id))) l.send({ k: 'm', type, data, from });
    if (!near || this.#near(from, this.selfId)) this.emit('message', type, data, from);
  }
  #store(id, d) { const e = this.last.get(id) ?? { n: 0 }; e.d = d; e.n++; this.last.set(id, e); }
  // lote de posições para cada jogador: perto = toda novidade; longe = 1 vez por segundo
  #flush() {
    if (this.closed) return;
    const far = this.tickN++ % FAR_EVERY === 0;
    for (const [rid, link] of this.links) {
      const list = [];
      for (const [pid, e] of this.last) {
        if (pid === rid || link.sent.get(pid) === e.n) continue;
        if (!far && !this.#near(pid, rid)) continue;
        link.sent.set(pid, e.n); list.push({ f: pid, d: e.d });
      }
      if (list.length) link.send({ k: 'sts', l: list });
    }
  }
  #gone(id, left) {
    const p = this.players.get(id); if (!p) return;
    this.links.get(id)?.close(); this.links.delete(id); this.last.delete(id);
    for (const l of this.links.values()) l.sent?.delete(id);
    if (left) { this.players.delete(id); this.emit('leave', id); this.#broadcastRoster(); return; }
    p.drop = true; this.emit('drop', id); this.#broadcastRoster();
    p.dropT = setTimeout(() => { if (p.drop && this.players.get(id) === p) { this.players.delete(id); this.emit('leave', id); this.#broadcastRoster(); } }, this.channel ? 12000 : KEEP_SLOT);
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
  kick(id) { if (!this.isHost || this.channel || id === this.selfId) return; this.banned.add(id); this.links.get(id)?.send({ k: 'bye', why: 'kick' }); this.#gone(id, true); }

  // ---------- cliente ----------
  // channel: true = canal do mundo. Se o anfitrião some, a sala fecha com o código 'host-lost' e o world.js
  // faz a reeleição (em vez de insistir no mesmo anfitrião, como a sala privada faz).
  static async join({ kind = 'peer', code, name, password, key, look, channel = false, timeout }) {
    const r = new Room(); r.kind = kind; r.code = String(code).trim(); r.name = cleanName(name); r.key = key; r.look = cleanLook(look);
    r.password = String(password ?? ''); r.channel = channel; r.timeout = timeout;
    if (!channel) { r.code = r.code.toUpperCase(); if (/^\d{4}$/.test(r.code)) r.code = 'ALV-' + r.code; }
    try { await r.#connect(); } catch (e) { r.closed = true; clearInterval(r.pinger); r.t?.destroy(); throw e; }
    return r;
  }
  async #connect() {
    this.t?.destroy();
    this.t = createTransport(this.kind);
    const link = await this.t.connect(this.code, this.timeout ? { timeout: this.timeout } : {});
    const res = await new Promise((resolve, reject) => {
      let ok = false;
      const to = setTimeout(() => { reject(new Error('timeout')); link.close(); }, 12000);
      link.on('message', async (m) => {
        if (m.k === 'chal') { link.send({ k: 'hello', v: PROTO, name: this.name, look: this.look, key: this.key, proof: await proofOf(m.nonce, this.code, this.password) }); return; }
        if (!ok && m.k === 'deny') { clearTimeout(to); reject(new Error(String(m.why).slice(0, 12))); return; }
        if (!ok && m.k === 'welcome') { if (typeof m.id !== 'string' || !ID_RE.test(m.id)) return; ok = true; clearTimeout(to); resolve(m); return; }
        if (ok) this.#clientMsg(m);
      });
      link.on('close', () => { clearTimeout(to); reject(new Error('closed')); this.#lost(link); });
    });
    this.link = link; this.selfId = res.id; this.lastSeen = performance.now(); this.inN = 0; this.inT = performance.now();
    if (Number.isInteger(res.max)) this.max = res.max;
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
    const now = performance.now();
    this.lastSeen = now;
    // um anfitrião malicioso não trava o jogo inundando mensagens: acima do teto, ignora
    if (now - this.inT > 1000) { this.inT = now; this.inN = 0; }
    if (++this.inN > IN_CAP) return;
    if (m.k === 'ping') return this.link?.send({ k: 'pong', t: m.t });
    if (m.k === 'pong') { if (!Number.isFinite(m.t)) return; this.ping = Math.round(now - m.t); const me = this.players.get(this.selfId); if (me) me.ping = this.ping; return; }
    if (m.k === 'roster') return this.#setRoster(m.roster);
    if (m.k === 'bye') {
      const why = String(m.why ?? '');
      if (this.channel && (why === 'host-left' || why === 'migrate')) { this.next = typeof m.next === 'string' ? m.next : null; this.#close('O anfitrião do canal saiu.', 'host-lost'); return; }
      this.#close({ kick: 'Você foi removido da sala.', flood: 'Você mandou mensagens demais e saiu da sala.', dup: 'Você entrou com a mesma conta em outra janela.' }[why] ?? 'O anfitrião encerrou a sala.', why || 'host-left');
      return;
    }
    if (m.k === 'sts') {
      if (!Array.isArray(m.l)) return;
      for (const e of m.l.slice(0, 64)) if (e && typeof e.f === 'string' && ID_RE.test(e.f) && e.f !== this.selfId && e.d && typeof e.d === 'object') this.emit('message', 'st', e.d, e.f);
      return;
    }
    if (m.k === 'm' && typeof m.type === 'string' && TYPE_RE.test(m.type) && typeof m.from === 'string' && ID_RE.test(m.from) && m.data && typeof m.data === 'object') this.emit('message', m.type, m.data, m.from);
  }
  // o roster vem do anfitrião, que também pode ser malicioso: tudo é limpo de novo aqui
  #setRoster(list) {
    if (!Array.isArray(list)) return;
    const before = new Set(this.players.keys()), now = new Set();
    const was = new Map([...this.players].map(([id, p]) => [id, p.drop]));
    this.players = new Map();
    for (const q of list.slice(0, 64)) {
      if (!q || typeof q.id !== 'string' || !ID_RE.test(q.id) || this.players.has(q.id)) continue;
      const p = { id: q.id, name: cleanName(q.name), look: cleanLook(q.look), color: COLORS.includes(q.color) ? q.color : '#888888', host: q.host === true, drop: q.drop === true, ping: Number.isInteger(q.ping) ? Math.max(0, Math.min(9999, q.ping)) : undefined };
      this.players.set(p.id, p); now.add(p.id);
      if (p.host) this.hostPid = p.id;
    }
    for (const id of now) if (!before.has(id)) this.emit('join', id);
    for (const id of before) if (!now.has(id)) this.emit('leave', id);
    for (const p of this.players.values()) { if (was.get(p.id) === false && p.drop) this.emit('drop', p.id); if (was.get(p.id) === true && !p.drop) this.emit('back', p.id); }
    this.emit('roster', this.roster);
  }
  // queda do link com o anfitrião. Canal: avisa o world.js (reeleição). Sala privada: tenta voltar para a mesma vaga.
  async #lost(link) {
    if (this.closed || this.link !== link || this.reconnecting) return;
    this.link = null;
    if (this.channel) { this.#close('A conexão com o canal caiu.', 'host-lost'); return; }
    this.reconnecting = true;
    for (let i = 1; i <= 6 && !this.closed; i++) {
      this.emit('status', `Conexão caiu. Reconectando (${i}/6)…`, 'warn');
      await new Promise((r) => setTimeout(r, 1200 * i));
      if (this.closed) return;
      try {
        await this.#connect();
        this.reconnecting = false;
        this.emit('status', 'Reconectado!', 'ok'); this.emit('reconnected');
        return;
      } catch (e) {
        if (['senha', 'cheia', 'kick', 'versao'].includes(e.message)) break;
      }
    }
    this.reconnecting = false;
    this.#close('A sala foi encerrada: o anfitrião saiu ou a conexão não voltou.', 'lost');
  }

  // ---------- comum ----------
  // type: tipo da mensagem do jogo; to: id do jogador (sem `to` = todos os outros; 'st', golpes, chat e emotes
  // só chegam a quem está perto)
  send(type, data, to) {
    if (this.closed) return;
    if (this.isHost) {
      if (to) { this.links.get(to)?.send({ k: 'm', type, data, from: this.selfId }); return; }
      if (type === 'st') { this.#store(this.selfId, data); return; }
      const near = NEAR_TYPES.has(type);
      for (const [id, l] of this.links) if (!near || this.#near(this.selfId, id)) l.send({ k: 'm', type, data, from: this.selfId });
    } else this.link?.send({ k: 'm', type, data, to });
  }
  #close(reason, code = 'closed') {
    if (this.closed) return;
    this.closed = true; clearInterval(this.pinger); clearInterval(this.flusher);
    try { this.t?.destroy(); } catch {}
    this.emit('closed', reason, code);
  }
  // sair. O anfitrião de um canal indica o sucessor (o primeiro da fila), que assume o código logo.
  leave(code = 'left') {
    if (this.closed) return;
    if (this.isHost) { const next = this.succession()[0] ?? null; for (const l of this.links.values()) l.send({ k: 'bye', why: this.channel ? 'migrate' : 'host-left', next }); }
    else this.link?.send({ k: 'bye' });
    // dá tempo de a despedida sair antes de derrubar a conexão
    this.closed = true; clearInterval(this.pinger); clearInterval(this.flusher);
    setTimeout(() => { try { this.t?.destroy(); } catch {} }, 250);
    this.emit('closed', 'Você saiu da sala.', code);
  }
}
