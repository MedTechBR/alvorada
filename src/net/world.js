import { Emitter } from './transport.js';
import { Room, PROTO } from './room.js';

// Mundo compartilhado sempre ligado: ao entrar no jogo, você cai sozinho num CANAL, sem código nem senha,
// como nos MMOs. Cada canal é uma sala em estrela (room.js) com um código fixo no servidor de sinalização:
//   mundo-v2-c1, mundo-v2-c2, …  (o "v2" é a versão do protocolo: versões diferentes nunca se misturam)
//
// Quem conseguir REGISTRAR o código vira o anfitrião do canal; quem tentar e achar o código ocupado conecta
// nele. O servidor de sinalização só deixa um registrar cada código, então não existem dois anfitriões no
// mesmo canal. Canal cheio (CHANNEL_MAX) = tenta o próximo.
//
// Quando o anfitrião sai:
//   - saída limpa (fechou a aba, foi para uma sala privada): ele avisa todo mundo e indica o sucessor (o mais
//     antigo no canal), que tenta registrar o código logo; os outros esperam um pouco mais, conforme a ordem
//     de chegada, e conectam no novo anfitrião;
//   - queda (internet caiu, aba travou): os clientes percebem pelo silêncio (11 s) e fazem a mesma reeleição,
//     na ordem de chegada;
//   - se o código ainda estiver preso no servidor (anfitrião morto que o servidor não soltou), cada tentativa
//     falha e a próxima espera o dobro (2 s, 4 s… até 1 min).
// Se o anfitrião perder a sinalização e, ao voltar, o código já for de outro, ele deixa de ser anfitrião e manda
// os clientes dele para o novo dono (evento 'id-lost' do transporte).
// Sem internet ou com a sinalização fora do ar: o jogo segue sozinho e o canal tenta de novo depois, em silêncio.
//
// O que vai e volta durante a reeleição (posições, duelo, troca) é do online.js: os ids dos jogadores não
// mudam (room.js), então quem volta continua de onde estava.

export const CHANNEL_MAX = 16;  // jogadores por canal
export const CHANNELS = 12;     // canais possíveis
const PASS = 'alvorada-mundo';  // senha pública: o canal é aberto; ela só passa pelo mesmo aperto de mão das salas
export const channelCode = (n) => `mundo-v${PROTO}-c${n}`;
const jitter = (ms) => ms * (0.8 + Math.random() * 0.4);

// Eventos: 'room'(room) canal pronto (novo ou depois de uma reeleição) · 'down'(código) caiu, procurando outro
//          'state'(estado) 'off' | 'searching' | 'on' | 'offline'
export class World extends Emitter {
  // profile(): { name, look, key } do jogador · near(a, b): dois estados 'st' estão perto? (para o anfitrião)
  constructor({ kind = 'peer', profile, near = null, max = CHANNEL_MAX, pauseHidden = true }) {
    super();
    this.kind = kind; this.profile = profile; this.near = near; this.max = max;
    this.room = null; this.channel = null; this.state = 'off'; this.running = false; this.fails = 0; this.busy = false;
    this.wake = () => { if (this.running && !this.room && !this.busy) this.#run(this.channel ?? 1, 300); };
    addEventListener('online', this.wake);
    // aba escondida por muito tempo (celular no bolso): sai do canal (sem segurar o código como anfitrião
    // que não responde) e volta quando a aba aparecer de novo
    if (pauseHidden) document.addEventListener('visibilitychange', () => {
      clearTimeout(this.hideT);
      if (document.hidden) this.hideT = setTimeout(() => { if (this.running && document.hidden) { this.paused = true; this.#drop('pausa'); } }, 25000);
      else if (this.paused) { this.paused = false; this.wake(); }
    });
  }
  get on() { return !!this.room && !this.room.closed; }

  start(ch = 1) {
    if (this.running) return;
    this.running = true; this.fails = 0;
    this.#run(ch, 0);
  }
  stop() {
    this.running = false; clearTimeout(this.timer);
    this.#drop('stop');
    this.#state('off');
  }
  #drop(code) { const r = this.room; this.room = null; if (r) r.leave(code); }
  #state(s) { if (this.state !== s) { this.state = s; this.emit('state', s); } }

  #run(ch, delay) {
    clearTimeout(this.timer);
    if (!this.running || this.paused) return;
    if (this.state !== 'offline') this.#state('searching');
    this.timer = setTimeout(async () => {
      if (!this.running || this.busy || this.room || this.paused) return;
      this.busy = true;
      let room = null, err = null;
      try { room = await this.#enter(ch); } catch (e) { err = e; }
      this.busy = false;
      if (room && (!this.running || this.paused)) { room.leave('stop'); return; }
      if (room) return this.#up(room);
      this.fails++;
      const wait = Math.min(60000, 2000 * 2 ** Math.min(5, this.fails - 1));
      if (this.fails >= 2 || !navigator.onLine) this.#state('offline');
      this.lastError = err?.message;
      this.#run(err?.message === 'cheio' ? 1 : ch, jitter(wait));
    }, delay);
  }

  // Do canal `ch` em diante: tenta ser o anfitrião; se o código já tem dono, conecta nele; cheio, vai para o próximo
  async #enter(ch) {
    for (let i = 0; i < CHANNELS; i++) {
      const n = ((ch - 1 + i) % CHANNELS) + 1, code = channelCode(n);
      const p = this.profile();
      try {
        const r = await Room.host({ kind: this.kind, code, password: PASS, max: this.max, channel: true, near: this.near, ...p });
        r.chan = n; return r;
      } catch (e) { if (e.message !== 'taken') throw e; }
      try {
        const r = await Room.join({ kind: this.kind, code, password: PASS, channel: true, timeout: 7000, ...p });
        r.chan = n; return r;
      } catch (e) {
        if (e.message === 'cheia' || e.message === 'versao' || e.message === 'kick') continue;
        throw e; // 'not-found' (anfitrião acabou de sair ou morreu), rede, 'dup'…: espera e tenta este canal de novo
      }
    }
    throw new Error('cheio');
  }

  #up(r) {
    this.room = r; this.channel = r.chan; this.fails = 0;
    r.on('id-lost', () => { if (this.room === r) r.leave('id-lost'); });
    r.on('closed', (_text, code) => {
      if (this.room !== r && this.room) return;
      if (this.room === r) this.room = null;
      if (!this.running || this.paused || code === 'stop' || code === 'pausa') return;
      this.emit('down', code);
      if (code === 'host-lost') {
        // reeleição: o sucessor indicado (ou o mais antigo) tenta primeiro; os outros, em fila
        const order = r.succession().filter((id) => id !== r.hostId && id !== r.next);
        const me = r.selfId, rank = r.next === me ? 0 : (r.next ? 1 : 0) + Math.max(0, order.indexOf(me));
        this.#run(r.chan, 350 + rank * 650 + Math.random() * 250);
      } else if (code === 'dup' || code === 'flood' || code === 'kick') this.#run((r.chan % CHANNELS) + 1, jitter(30000));
      else this.#run(r.chan, jitter(code === 'id-lost' ? 1500 : 3000));
    });
    this.#state('on');
    this.emit('room', r);
  }
}
