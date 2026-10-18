// Camada de transporte do modo online.
//
// O jogo nunca fala direto com PeerJS, BroadcastChannel ou WebSocket: fala com este contrato.
// Trocar a rede (por exemplo, por um servidor próprio num VPS) = escrever outra classe com os
// mesmos métodos e registrá-la em createTransport(). Nada acima disto (room.js, trade.js,
// duel.js, a interface) precisa mudar.
//
// Contrato de um transporte:
//   await t.listen(code)       anfitrião: passa a aceitar conexões no código da sala.
//                              Emite 'link' (link) a cada jogador que conecta.
//                              Rejeita com Error('taken') se o código já está em uso.
//   await t.connect(code)      cliente: devolve um link para o anfitrião.
//                              Rejeita com Error('not-found') se não há sala com esse código.
//   t.on('error', fn)          erro de rede sem recuperação.
//   t.on('signal', fn(state))  estado da sinalização: 'ok' | 'lost' (só informativo).
//   t.on('id-lost', fn)        anfitrião: a sinalização caiu e, ao voltar, o código já era de outro
//                              (alguém assumiu o canal). Quem recebe deixa de ser anfitrião.
//   t.destroy()                fecha tudo.
// connect(code, { timeout }) aceita um prazo menor (o canal do mundo não espera 15 s por um anfitrião morto).
//
// Contrato de um link (ponto a ponto, confiável e ordenado, mensagens = objetos JSON):
//   link.send(obj)  link.close()  link.open (bool)
//   link.on('message', fn(obj))   link.on('close', fn(reason))

export class Emitter {
  constructor() { this._h = {}; }
  on(ev, fn) { (this._h[ev] ??= []).push(fn); return () => this.off(ev, fn); }
  off(ev, fn) { this._h[ev] = (this._h[ev] ?? []).filter((f) => f !== fn); }
  emit(ev, ...a) { for (const f of (this._h[ev] ?? []).slice()) { try { f(...a); } catch (e) { console.error('[net]', ev, e); } } }
}

// Prefixo dos ids no servidor público do PeerJS (evita colidir com outros apps que usam o mesmo servidor)
const PEER_PREFIX = 'pkmn-alvorada-v1-';
const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/+esm';
const MAX_MSG = 16 * 1024; // mensagens maiores que isto são descartadas (proteção contra lixo)

class BaseLink extends Emitter {
  constructor(id) { super(); this.id = id; this.open = true; }
  _in(obj) { if (this.open) this.emit('message', obj); }
  _closed(reason = 'closed') { if (!this.open) return; this.open = false; this.emit('close', reason); }
}

// ---------------------------------------------------------------------------------------------
// WebRTC com PeerJS: sinalização pelo servidor público padrão (0.peerjs.com), sem conta e sem chave.
// Depois do aperto de mão os dados vão direto entre os navegadores (DataChannel).
// ---------------------------------------------------------------------------------------------
let peerLib = null;
async function loadPeer() {
  peerLib ??= import(/* @vite-ignore */ PEERJS_URL).then((m) => m.Peer ?? m.default);
  return peerLib;
}

class PeerLink extends BaseLink {
  constructor(conn) {
    super(conn.peer); this.conn = conn;
    conn.on('data', (d) => {
      if (typeof d === 'string') { if (d.length > MAX_MSG) return; try { d = JSON.parse(d); } catch { return; } }
      if (d && typeof d === 'object') this._in(d);
    });
    conn.on('close', () => this._closed('closed'));
    conn.on('error', () => this._closed('error'));
    // queda do caminho WebRTC (Wi-Fi caiu, celular trocou de rede)
    const pc = conn.peerConnection;
    if (pc) pc.addEventListener('iceconnectionstatechange', () => { if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') this._closed('ice'); });
  }
  send(obj) { if (!this.open) return; try { this.conn.send(JSON.stringify(obj)); } catch { this._closed('error'); } }
  close() { if (!this.open) return; try { this.conn.close(); } catch {} this._closed('local'); }
}

export class PeerTransport extends Emitter {
  constructor() { super(); this.kind = 'peer'; this.peer = null; }
  async #makePeer(id) {
    const Peer = await loadPeer();
    return new Promise((resolve, reject) => {
      const peer = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
      const to = setTimeout(() => { reject(new Error('timeout')); try { peer.destroy(); } catch {} }, 15000);
      peer.on('open', () => { clearTimeout(to); peer.everOpen = true; this.emit('signal', 'ok'); resolve(peer); });
      peer.on('error', (err) => {
        clearTimeout(to);
        const type = err?.type;
        if (type === 'unavailable-id') { if (peer.everOpen) this.emit('id-lost'); reject(new Error('taken')); }
        else if (type === 'peer-unavailable') this.emit('peer-unavailable');
        else if (!peer.open) reject(new Error(type || 'network'));
        else if (type === 'network' || type === 'server-error' || type === 'socket-error' || type === 'socket-closed') this.emit('signal', 'lost');
      });
      // perdeu o servidor de sinalização: os links já abertos continuam; tenta voltar
      peer.on('disconnected', () => { this.emit('signal', 'lost'); setTimeout(() => { if (!peer.destroyed) try { peer.reconnect(); } catch {} }, 1500); });
    });
  }
  async listen(code) {
    this.peer = await this.#makePeer(PEER_PREFIX + code);
    this.peer.on('connection', (conn) => {
      const ok = () => this.emit('link', new PeerLink(conn));
      if (conn.open) ok(); else conn.on('open', ok);
    });
  }
  async connect(code, { timeout = 15000 } = {}) {
    if (!this.peer || this.peer.destroyed) this.peer = await this.#makePeer(null);
    return new Promise((resolve, reject) => {
      const conn = this.peer.connect(PEER_PREFIX + code, { reliable: true, serialization: 'raw' });
      let done = false;
      const fail = (why) => { if (done) return; done = true; clearTimeout(to); off(); try { conn.close(); } catch {} reject(new Error(why)); };
      const off = this.on('peer-unavailable', () => fail('not-found'));
      const to = setTimeout(() => fail('not-found'), timeout);
      conn.on('open', () => { if (done) return; done = true; clearTimeout(to); off(); resolve(new PeerLink(conn)); });
      conn.on('error', () => fail('network'));
    });
  }
  destroy() { this.dead = true; try { this.peer?.destroy(); } catch {} this.peer = null; }
}

// ---------------------------------------------------------------------------------------------
// Transporte local de TESTE: BroadcastChannel entre abas do mesmo navegador e mesma origem.
// Não sai do computador. Serve para validar a lógica (sala, troca, duelo) sem depender da internet.
// `latency` (ms) simula o atraso de uma rede real.
// ---------------------------------------------------------------------------------------------
class LocalLink extends BaseLink {
  constructor(t, remote, linkId) { super(remote); this.t = t; this.remote = remote; this.linkId = linkId; }
  send(obj) { if (this.open) this.t._post({ k: 'msg', to: this.remote, link: this.linkId, data: JSON.stringify(obj) }); }
  close() { if (!this.open) return; this.t._post({ k: 'fin', to: this.remote, link: this.linkId }); this.t.links.delete(this.linkId); this._closed('local'); }
}

export class LocalTransport extends Emitter {
  constructor({ latency = 40 } = {}) {
    super(); this.kind = 'local'; this.latency = latency;
    this.me = 'L' + Math.random().toString(36).slice(2, 10);
    this.links = new Map(); this.code = null; this.waiting = new Map();
    this.ch = new BroadcastChannel('pkmn-alvorada-net-local');
    this.ch.onmessage = (ev) => setTimeout(() => this.#on(ev.data), this.latency);
    this._bye = () => this.destroy();
    addEventListener('pagehide', this._bye);
  }
  _post(m) { this.ch.postMessage({ ...m, from: this.me }); }
  #on(m) {
    if (!m || (m.to && m.to !== this.me)) return;
    if (m.k === 'probe' && this.code && m.code === this.code) this._post({ k: 'busy', to: m.from, code: m.code });
    if (m.k === 'busy') this.waiting.get('probe:' + m.code)?.(m);
    if (m.k === 'syn' && this.code && m.code === this.code) {
      const link = new LocalLink(this, m.from, m.link); this.links.set(m.link, link);
      this._post({ k: 'ack', to: m.from, link: m.link });
      this.emit('link', link);
    }
    if (m.k === 'ack') this.waiting.get('ack:' + m.link)?.(m);
    if (m.k === 'msg') { const l = this.links.get(m.link); if (l && m.data.length <= MAX_MSG) { try { l._in(JSON.parse(m.data)); } catch {} } }
    if (m.k === 'fin') { const l = this.links.get(m.link); if (l) { this.links.delete(m.link); l._closed('closed'); } }
  }
  async listen(code) {
    // se outra aba já usa o código, recusa (igual ao servidor do PeerJS). A reserva é atômica com Web Locks:
    // duas abas tentando o mesmo código ao mesmo tempo não viram as duas anfitriãs (o servidor do PeerJS também garante isso).
    if (navigator.locks) {
      const got = await new Promise((res) => {
        navigator.locks.request('pkmn-alvorada-code:' + code, { ifAvailable: true }, (lock) => {
          if (!lock) { res(false); return undefined; }
          res(true);
          return new Promise((free) => { this.freeLock = free; }); // segura até destroy() (ou até a aba fechar)
        }).catch(() => res(false));
      });
      if (!got) throw new Error('taken');
    } else {
      const busy = await new Promise((res) => { const k = 'probe:' + code; this.waiting.set(k, () => res(true)); this._post({ k: 'probe', code }); setTimeout(() => { this.waiting.delete(k); res(false); }, 300 + this.latency * 2); });
      if (busy) throw new Error('taken');
    }
    this.code = code;
  }
  async connect(code, { timeout = 2500 } = {}) {
    const linkId = Math.random().toString(36).slice(2, 12);
    const host = await new Promise((res, rej) => {
      const k = 'ack:' + linkId;
      const to = setTimeout(() => { this.waiting.delete(k); rej(new Error('not-found')); }, Math.min(timeout, 2500));
      this.waiting.set(k, (m) => { clearTimeout(to); this.waiting.delete(k); res(m.from); });
      this._post({ k: 'syn', code, link: linkId });
    });
    const link = new LocalLink(this, host, linkId);
    this.links.set(linkId, link);
    return link;
  }
  destroy() {
    if (this.dead) return; this.dead = true;
    for (const l of this.links.values()) l.close();
    this.links.clear(); this.code = null; this.freeLock?.();
    removeEventListener('pagehide', this._bye);
    try { this.ch.close(); } catch {}
  }
}
// ---------------------------------------------------------------------------------------------
// WebSocket num servidor próprio (VPS) — ESBOÇO para a migração, ainda sem servidor.
// O servidor só repassa quadros (relé), com este protocolo JSON:
//   cliente -> servidor: {op:'host', code} | {op:'join', code} | {op:'send', link, data} | {op:'close', link}
//   servidor -> cliente: {op:'ok'} | {op:'err', why:'taken'|'not-found'} | {op:'link', link}
//                        {op:'data', link, data} | {op:'unlink', link}
// O anfitrião continua sendo um navegador (mesma lógica de sala/senha/árbitro); o servidor só
// garante que todo mundo alcança todo mundo, sem depender de NAT. Ver README (Modo online).
// ---------------------------------------------------------------------------------------------
class WsLink extends BaseLink {
  constructor(t, link) { super(link); this.t = t; }
  send(obj) { if (this.open) this.t.ws.send(JSON.stringify({ op: 'send', link: this.id, data: obj })); }
  close() { if (!this.open) return; this.t.ws.send(JSON.stringify({ op: 'close', link: this.id })); this._closed('local'); }
}
export class WsTransport extends Emitter {
  constructor(url) { super(); this.kind = 'ws'; this.url = url; this.links = new Map(); }
  #open(first) {
    return new Promise((res, rej) => {
      const ws = this.ws = new WebSocket(this.url);
      ws.onopen = () => ws.send(JSON.stringify(first));
      ws.onerror = () => rej(new Error('network'));
      ws.onclose = () => { for (const l of this.links.values()) l._closed('closed'); this.links.clear(); this.emit('signal', 'lost'); };
      ws.onmessage = (ev) => {
        let m; try { m = JSON.parse(ev.data); } catch { return; }
        if (m.op === 'ok') res(m);
        else if (m.op === 'err') rej(new Error(m.why));
        else if (m.op === 'link') { const l = new WsLink(this, m.link); this.links.set(m.link, l); if (first.op === 'host') this.emit('link', l); else res(l); }
        else if (m.op === 'data') this.links.get(m.link)?._in(m.data);
        else if (m.op === 'unlink') { const l = this.links.get(m.link); this.links.delete(m.link); l?._closed('closed'); }
      };
    });
  }
  async listen(code) { await this.#open({ op: 'host', code }); }
  async connect(code) { return this.#open({ op: 'join', code }); }
  destroy() { try { this.ws?.close(); } catch {} }
}

// kind: 'peer' (padrão, internet) | 'local' (teste entre abas) | 'ws' (servidor próprio, opts.url)
export function createTransport(kind = 'peer', opts = {}) {
  if (kind === 'local') return new LocalTransport(opts);
  if (kind === 'ws') return new WsTransport(opts.url);
  return new PeerTransport();
}
