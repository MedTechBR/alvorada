import { Emitter } from './transport.js';
import { cleanName, cleanLook } from './validate.js';

// Mundo online SEM anfitrião, pelo Firebase Realtime Database (projeto alvorada-online, plano grátis).
// Substitui o canal de PeerJS (world.js + room.js) no mundo sempre ligado; salas privadas seguem em room.js.
//
// Presença por célula (nada de salas nem códigos):
//   mundo/v1/celulas/{mundo_cx_cy}/{uid} = { n nome, k visual, x y d r w ts, l? (Pokémon), tz? m? z? mu? md? (montaria) }
//   O mapa é dividido em células de 640 px (40 blocos). Cada jogador escreve só o próprio nó, só quando algo
//   mudou e no máximo ~4,5x por segundo (10x no duelo), com onDisconnect().remove(). Cada cliente escuta só as
//   9 células ao redor (3x3), então baixa apenas quem está perto, nunca o mundo inteiro.
// Mensagens (troca, duelo, golpes, chat, emotes, reide): caixa de entrada de cada jogador
//   mundo/v1/caixa/{uid}/{pushId} = { f remetente, y tipo, d JSON, t hora do servidor }
//   Só o remetente cria (as regras exigem f === auth.uid, então ninguém se passa por outro) e só o dono lê e apaga.
//   Fica por conta de quem recebe: lê, entrega ao jogo e apaga.
// FireRoom fala a mesma língua do Room (room.js): online.js, troca, duelo e árbitro não percebem a diferença.

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDX9A9qCaK1re2luBFtGy8apVlb1G50yEw', // pública por design (as regras do banco é que protegem)
  authDomain: 'alvorada-online.firebaseapp.com',
  databaseURL: 'https://alvorada-online-default-rtdb.firebaseio.com',
  projectId: 'alvorada-online',
  appId: '1:395876486766:web:444e61d842dc204bebe07f',
  messagingSenderId: '395876486766',
};
export const FB_VERSION = '10.14.1';
const CDN = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
const ROOT = 'mundo/v1';
const CELL = 640;                 // px por célula
const SUB_KEEP = 8000;            // ms: célula que saiu do 3x3 continua escutada por mais um tempo (troca/duelo na borda)
const GONE_GRACE = 1500;          // ms: sumiu de uma célula e não apareceu noutra = saiu
const GAP = 220, GAP_FAST = 100;  // ms entre escritas de posição (normal, duelo)
const MSG_MAX = 16000, STALE = 90000;
const TYPE_RE = /^[a-z][a-z?-]{0,11}$/;
const MUNDO_ID = /^[a-z0-9-]{1,24}$/;
export const COLORS = ['#e5383b', '#2f6fe4', '#2fbf71', '#f2a93b', '#9b5de5', '#ef6fb0', '#20b2c9', '#8a6a4a'];
const colorOf = (id) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0; return COLORS[h % COLORS.length]; };
const fin = (v) => Number.isFinite(v);
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- SDK (carregado só quando o online liga) ----------
let sdkP = null;
export function loadFirebase({ memoryAuth = false } = {}) {
  sdkP ??= (async () => {
    const [A, AU, DB] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-database.js')]);
    const app = A.initializeApp(FIREBASE_CONFIG);
    // memoryAuth (?perfil=x, só testes): cada aba é um jogador diferente, sem dividir a sessão guardada no navegador
    const auth = memoryAuth ? AU.initializeAuth(app, { persistence: AU.inMemoryPersistence }) : AU.getAuth(app);
    const db = DB.getDatabase(app);
    return { app, auth, db, AU, DB };
  })();
  sdkP.catch(() => { sdkP = null; });
  return sdkP;
}
async function signIn(fb) {
  await fb.auth.authStateReady();
  if (!fb.auth.currentUser) await fb.AU.signInAnonymously(fb.auth);
  return fb.auth.currentUser.uid;
}

// ---------- sala sem anfitrião ----------
export class FireRoom extends Emitter {
  constructor(fb, uid, profile) {
    super();
    this.fire = true; this.fb = fb; this.selfId = uid; this.profile = profile;
    this.players = new Map(); this.isHost = false; this.hostPid = null; this.code = 'mundo'; this.closed = false;
    this.cells = new Map(); this.myCell = null; this.fast = false;
    this.pending = null; this.lastKey = ''; this.lastAt = 0; this.timer = null; this.connected = true;
    this.inTok = new Map(); this.outTok = 120; this.outT = performance.now(); this.offset = 0;
    const p = profile();
    this.players.set(uid, { id: uid, name: cleanName(p.name), look: cleanLook(p.look), color: colorOf(uid), host: false, drop: false });
    this.#start();
  }
  get hostId() { return null; }
  get roster() { return [...this.players.values()]; }
  others() { return this.roster.filter((p) => p.id !== this.selfId); }
  succession() { return []; }

  #ref(path) { return this.fb.DB.ref(this.fb.db, `${ROOT}/${path}`); }
  #start() {
    const { DB } = this.fb;
    this.offs = [];
    this.offs.push(DB.onValue(DB.ref(this.fb.db, '.info/serverTimeOffset'), (s) => { this.offset = Number(s.val()) || 0; }));
    this.offs.push(DB.onValue(DB.ref(this.fb.db, '.info/connected'), (s) => {
      const on = s.val() === true;
      if (on === this.connected) return;
      this.connected = on; this.emit('net', on ? 'ok' : 'lost');
      if (on && this.myCell) { this.lastKey = ''; this.#flush(true); } // voltou: o servidor já tinha apagado a presença; escreve de novo
    }));
    this.offs.push(DB.onChildAdded(this.#ref(`caixa/${this.selfId}`), (s) => this.#inbox(s), (e) => console.warn('[fire] caixa', e.code)));
  }

  // ---------- caixa de entrada ----------
  #inbox(snap) {
    const { DB } = this.fb;
    const v = snap.val();
    DB.remove(snap.ref).catch(() => {});
    if (this.closed || !v || typeof v !== 'object') return;
    const from = v.f, type = v.y;
    if (typeof from !== 'string' || from === this.selfId || typeof type !== 'string' || !TYPE_RE.test(type) || type === 'st' || typeof v.d !== 'string' || v.d.length > MSG_MAX) return;
    if (fin(v.t) && Date.now() + this.offset - v.t > STALE) return; // sobra de uma sessão antiga
    // limite por remetente: 60 msg/s (rajada 120); quem inunda é ignorado
    const now = performance.now(); let b = this.inTok.get(from);
    if (!b) this.inTok.set(from, b = { tok: 120, t: now });
    b.tok = Math.min(120, b.tok + (now - b.t) * 0.06); b.t = now;
    if (b.tok < 1) return; b.tok -= 1;
    let data; try { data = JSON.parse(v.d); } catch { return; }
    if (data && typeof data === 'object' && !Array.isArray(data)) this.emit('message', type, data, from);
  }
  #post(to, type, body) {
    const now = performance.now();
    this.outTok = Math.min(120, this.outTok + (now - this.outT) * 0.06); this.outT = now; // 60 msg/s de saída
    if (this.outTok < 1) return; this.outTok -= 1;
    const { DB } = this.fb;
    DB.push(this.#ref(`caixa/${to}`), { f: this.selfId, y: type, d: body, t: DB.serverTimestamp() }).catch((e) => { if (!this.warned) { this.warned = 1; console.warn('[fire] envio recusado', e.code); } });
  }

  // type: tipo da mensagem do jogo; to: id do jogador (sem `to` = todos os que estão por perto)
  send(type, data, to) {
    if (this.closed) return;
    if (type === 'st') { this.pending = data; this.#schedule(); return; }
    if (!data || typeof data !== 'object' || typeof type !== 'string' || !TYPE_RE.test(type)) return;
    let body; try { body = JSON.stringify(data); } catch { return; }
    if (body.length > MSG_MAX) return;
    if (to) { if (to !== this.selfId) this.#post(to, type, body); return; }
    for (const p of this.players.values()) if (p.id !== this.selfId && !p.drop) this.#post(p.id, type, body);
  }

  // ---------- presença ----------
  #schedule() {
    if (this.timer) return;
    const wait = Math.max(0, this.lastAt + (this.fast ? GAP_FAST : GAP) - performance.now());
    this.timer = setTimeout(() => { this.timer = null; this.#flush(false); }, wait);
  }
  #flush(force) {
    const st = this.pending;
    if (this.closed || !st || (!this.connected && !force)) return;
    if (!fin(st.x) || !fin(st.y)) return;
    const w = typeof st.w === 'string' && MUNDO_ID.test(st.w) ? st.w : 'alvorada';
    const x = clampN(st.x, -64, 65700), y = clampN(st.y, -64, 65700);
    const prof = this.profile(), name = cleanName(prof.name), look = JSON.stringify(cleanLook(prof.look));
    const node = { n: name, k: look.slice(0, 400), x, y, d: ['down', 'up', 'left', 'right'].includes(st.d) ? st.d : 'down', r: !!st.r, w, ts: Math.max(0, Math.round(fin(st.ts) ? st.ts : performance.now())) };
    if (st.l && fin(st.l.x) && fin(st.l.y) && typeof st.l.u === 'string' && st.l.u) {
      node.l = { x: clampN(st.l.x, -64, 65700), y: clampN(st.l.y, -64, 65700), u: st.l.u.slice(0, 16) };
      if (Number.isInteger(st.l.a)) node.l.a = clampN(st.l.a, 0, 7);
      if (fin(st.l.h) && st.l.h > 0) node.l.h = clampN(Math.round(st.l.h), 0, 160);
      if (st.l.p === 1) node.l.p = 1;
    }
    if (fin(st.tz) && st.tz > 0) node.tz = clampN(Math.round(st.tz), 0, 120);
    if (['correr', 'nadar', 'escalar', 'voar', 'mergulhar'].includes(st.m)) {
      node.m = st.m; node.z = fin(st.z) ? clampN(Math.round(st.z), 0, 120) : 0; node.mu = st.u ? 1 : 0;
      if (Number.isInteger(st.mountDex) && st.mountDex >= 1 && st.mountDex <= 1025) node.md = st.mountDex;
      else if (typeof st.mountDex === 'string' && /^\d{1,4}-[A-Za-z]{1,24}$/.test(st.mountDex)) node.md = st.mountDex;
    }
    // só escreve se mudou alguma coisa (parado = zero tráfego)
    const { ts, ...rest } = node; const key = JSON.stringify(rest);
    if (key === this.lastKey && !force) return;
    this.lastKey = key; this.lastAt = performance.now();
    const cx = clampN(Math.floor(x / CELL), -1, 102), cy = clampN(Math.floor(y / CELL), -1, 102), cell = `${w}_${cx}_${cy}`;
    const { DB } = this.fb;
    const mine = DB.ref(this.fb.db, `${ROOT}/celulas/${cell}/${this.selfId}`);
    const fail = (e) => { if (!this.warnedW) { this.warnedW = 1; console.warn('[fire] escrita recusada', e.code); } };
    if (cell !== this.myCell) {
      const old = this.myCell ? DB.ref(this.fb.db, `${ROOT}/celulas/${this.myCell}/${this.selfId}`) : null;
      DB.set(mine, node).catch(fail);
      DB.onDisconnect(mine).remove().catch(() => {});
      if (old) { DB.remove(old).catch(() => {}); DB.onDisconnect(old).cancel().catch(() => {}); }
      this.myCell = cell; this.#resub(w, cx, cy);
    } else { DB.set(mine, node).catch(fail); if (force) DB.onDisconnect(mine).remove().catch(() => {}); }
    const me = this.players.get(this.selfId);
    if (me) me.name = name;
  }

  // ---------- vizinhança (3x3 células) ----------
  #resub(w, cx, cy) {
    const want = new Set();
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const a = cx + i, b = cy + j; if (a >= -1 && b >= -1 && a <= 102 && b <= 102) want.add(`${w}_${a}_${b}`); }
    for (const key of want) {
      const c = this.cells.get(key);
      if (c) { clearTimeout(c.dropT); c.dropT = null; continue; }
      this.#attach(key);
    }
    for (const [key, c] of this.cells) if (!want.has(key) && !c.dropT) c.dropT = setTimeout(() => this.#detach(key), SUB_KEEP);
  }
  #attach(key) {
    const { DB } = this.fb, r = DB.ref(this.fb.db, `${ROOT}/celulas/${key}`);
    const up = (s) => this.#seen(key, s), err = (e) => console.warn('[fire] celula', key, e.code);
    this.cells.set(key, { dropT: null, offs: [DB.onChildAdded(r, up, err), DB.onChildChanged(r, up, err), DB.onChildRemoved(r, (s) => this.#unseen(key, s), err)] });
  }
  #detach(key) {
    const c = this.cells.get(key); if (!c) return;
    this.cells.delete(key); for (const off of c.offs) try { off(); } catch {}
    for (const p of [...this.players.values()]) if (p.id !== this.selfId && p.cell === key) this.#remove(p.id);
  }
  // nó de alguém na célula `key` (entrou ou mudou)
  #seen(key, snap) {
    const id = snap.key; if (id === this.selfId || this.closed) return;
    const v = snap.val(); if (!v || typeof v !== 'object' || !fin(v.x) || !fin(v.y) || typeof v.n !== 'string') return;
    const name = cleanName(v.n);
    let look = null; if (typeof v.k === 'string' && v.k.length <= 400) { try { look = cleanLook(JSON.parse(v.k)); } catch {} }
    let p = this.players.get(id), joined = false, changed = false;
    if (!p) { p = { id, name, look: look ?? cleanLook('menino'), color: colorOf(id), host: false, drop: false }; this.players.set(id, p); joined = true; }
    else {
      clearTimeout(p.goneT); p.goneT = null;
      if (p.name !== name) { p.name = name; changed = true; }
      if (look && JSON.stringify(look) !== JSON.stringify(p.look)) { p.look = look; changed = true; }
    }
    p.cell = key;
    if (joined) this.emit('join', id);
    if (joined || changed) this.emit('roster', this.roster);
    // estado no formato que o resto do jogo já conhece (validateState confere de novo)
    const st = { ts: v.ts, x: v.x, y: v.y, d: v.d, r: v.r === true, w: v.w };
    if (v.l && typeof v.l === 'object') st.l = { x: v.l.x, y: v.l.y, u: v.l.u, a: v.l.a ?? 2, h: v.l.h ?? 0, p: v.l.p === 1 ? 1 : 0 };
    if (fin(v.tz)) st.tz = v.tz;
    if (typeof v.m === 'string') { st.m = v.m; st.z = v.z; st.u = v.mu === 1; st.mountDex = v.md; }
    this.emit('message', 'st', st, id);
  }
  #unseen(key, snap) {
    const p = this.players.get(snap.key); if (!p || p.id === this.selfId || p.cell !== key) return;
    clearTimeout(p.goneT); p.goneT = setTimeout(() => this.#remove(p.id), GONE_GRACE);
  }
  #remove(id) {
    const p = this.players.get(id); if (!p) return;
    clearTimeout(p.goneT); this.players.delete(id);
    this.emit('leave', id); this.emit('roster', this.roster);
  }

  // ---------- sair ----------
  leave(code = 'left') {
    if (this.closed) return;
    this.closed = true; clearTimeout(this.timer);
    const { DB } = this.fb;
    for (const off of this.offs) try { off(); } catch {}
    for (const c of this.cells.values()) { clearTimeout(c.dropT); for (const off of c.offs) try { off(); } catch {} }
    this.cells.clear();
    if (this.myCell) {
      const mine = DB.ref(this.fb.db, `${ROOT}/celulas/${this.myCell}/${this.selfId}`);
      DB.remove(mine).catch(() => {}); DB.onDisconnect(mine).cancel().catch(() => {});
    }
    for (const p of this.players.values()) clearTimeout(p.goneT);
    this.emit('closed', 'Você saiu do mundo.', code);
  }
}

// ---------- o "mundo" (mesma interface do World de world.js) ----------
// Eventos: 'room'(room) · 'state'(estado: 'off' | 'searching' | 'on' | 'offline')
export class FireWorld extends Emitter {
  constructor({ profile, pauseHidden = true, memoryAuth = false }) {
    super();
    this.kind = 'fire'; this.profile = profile; this.memoryAuth = memoryAuth;
    this.fire = true; this.channel = null; this.max = Infinity;
    this.room = null; this.state = 'off'; this.running = false; this.fails = 0; this.busy = false; this.paused = false;
    this.wake = () => { if (this.running && !this.room && !this.busy) this.#run(300); };
    addEventListener('online', this.wake);
    // aba escondida por um bom tempo (celular no bolso): sai do mapa dos outros e volta quando a aba reaparece
    if (pauseHidden) document.addEventListener('visibilitychange', () => {
      clearTimeout(this.hideT);
      if (document.hidden) this.hideT = setTimeout(() => { if (this.running && document.hidden) { this.paused = true; this.#drop('pausa'); } }, 25000);
      else if (this.paused) { this.paused = false; this.wake(); }
    });
  }
  get connected() { return !!this.room && !this.room.closed; }
  start() { if (this.running) return; this.running = true; this.fails = 0; this.#run(0); }
  stop() { this.running = false; clearTimeout(this.timer); this.#drop('stop'); this.#state('off'); }
  #drop(code) { const r = this.room; this.room = null; if (r) r.leave(code); }
  #state(s) { if (this.state !== s) { this.state = s; this.emit('state', s); } }
  #run(delay) {
    clearTimeout(this.timer);
    if (!this.running || this.paused) return;
    if (this.state !== 'offline') this.#state('searching');
    this.timer = setTimeout(async () => {
      if (!this.running || this.busy || this.room || this.paused) return;
      this.busy = true;
      let room = null, err = null;
      try {
        const fb = await loadFirebase({ memoryAuth: this.memoryAuth });
        const uid = await signIn(fb);
        if (this.running && !this.paused) room = new FireRoom(fb, uid, this.profile);
      } catch (e) { err = e; }
      this.busy = false;
      if (room && (!this.running || this.paused)) { room.leave('stop'); return; }
      if (room) return this.#up(room);
      if (!this.running || this.paused) return;
      this.fails++;
      if (this.fails >= 2 || !navigator.onLine) this.#state('offline');
      this.lastError = err?.code ?? err?.message;
      this.#run(Math.min(60000, 2000 * 2 ** Math.min(5, this.fails - 1)) * (0.8 + Math.random() * 0.4));
    }, delay);
  }
  #up(room) {
    this.room = room; this.fails = 0;
    room.on('net', (s) => { if (this.room === room) this.#state(s === 'ok' ? 'on' : 'offline'); });
    this.#state('on');
    this.emit('room', room);
  }
}
