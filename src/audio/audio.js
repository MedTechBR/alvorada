import { PARTITURAS } from './partituras.js';
// Som 8-bit gerado na hora: efeitos e músicas originais (nenhum arquivo externo).

const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const freq = (n) => {
  const m = /^([A-G][#b]?)(\d)$/.exec(n);
  if (!m) return 0;
  return 440 * 2 ** ((NOTE[m[1]] + (+m[2] + 1) * 12 - 69) / 12);
};
const seq = (s) => s.replace(/\|/g, ' ').trim().split(/\s+/);

// Músicas originais. Cada token é uma colcheia; "-" sustenta, "." pausa.
const TRACKS = {
  town: { bpm: 96, lead: seq(`
    F5 - A5 - C6 - A5 - G5 - - - E5 - G5 - | F5 - A5 - C6 - D6 - C6 - - - - - - - |
    Bb5 - A5 - G5 - F5 - G5 - A5 - G5 - E5 - | F5 - - - A5 - G5 - F5 - - - . . . . |
    D6 - C6 - Bb5 - A5 - Bb5 - - - G5 - - - | C6 - Bb5 - A5 - G5 - A5 - - - F5 - - - |
    G5 - A5 - Bb5 - C6 - D6 - C6 - Bb5 - A5 - | G5 - - - E5 - - - F5 - - - . . . . |`),
    bass: seq(`F3 . C4 . F3 . C4 . | C3 . G3 . C3 . G3 . | F3 . C4 . F3 . C4 . | Bb2 . F3 . C3 . G3 . |
      Bb2 . F3 . Bb2 . F3 . | F3 . C4 . F3 . C4 . | Bb2 . F3 . C3 . G3 . | C3 . G3 . F3 . C4 .`), drums: null },
  route: { bpm: 132, lead: seq(`
    G5 - B5 D6 - B5 C6 - A5 - F#5 A5 - D6 B5 - | G5 - B5 D6 - G6 E6 - D6 - B5 C6 - A5 G5 - |
    E6 - D6 C6 - B5 A5 - D6 - C6 B5 - A5 G5 - | A5 - B5 C6 - A5 F#5 - G5 - - - . . . . |`),
    bass: seq(`G3 G3 D4 G3 G3 D4 G3 D4 | D3 D3 A3 D3 D3 A3 F#3 A3 | G3 G3 D4 G3 E3 E3 B3 E3 | C3 C3 G3 C3 D3 D3 A3 D3 |
      C3 C3 G3 C3 G3 G3 D4 G3 | A2 A2 E3 A2 D3 D3 A3 D3 | C3 C3 G3 E3 D3 D3 F#3 A3 | G3 D3 G3 . G3 . . .`),
    drums: seq('k . h . s . h . k k h . s . h h') },
  battle: { bpm: 168, lead: seq(`
    D5 D5 F5 D5 A5 - G5 F5 E5 E5 G5 E5 C6 - Bb5 A5 | D5 D5 F5 D5 A5 - G5 F5 E5 F5 G5 A5 D6 - - - |
    Bb5 - A5 - G5 - F5 - G5 A5 Bb5 - A5 G5 F5 E5 | F5 - E5 - D5 - C#5 - D5 E5 F5 G5 A5 - - - |`),
    bass: seq(`D3 D4 D3 D4 D3 D4 D3 D4 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 D3 D4 D3 D4 | Bb2 Bb3 Bb2 Bb3 A2 A3 A2 A3 |
      G2 G3 G2 G3 G2 G3 G2 G3 | C3 C4 C3 C4 C3 C4 C3 C4 | Bb2 Bb3 Bb2 Bb3 A2 A3 A2 A3 | D3 D4 D3 D4 A2 A3 C#3 E3`),
    drums: seq('k h s h k k s h k h s h k s s s') },
  // luta contra líder de ginásio (arena dinâmica): mais pesada que a de treinador, em mi menor
  gym: { bpm: 156, lead: seq(`
    E5 - E5 G5 B5 - A5 G5 F#5 - F#5 A5 B5 - - - | E5 - E5 G5 B5 - D6 C6 B5 - A5 G5 F#5 - - - |
    G5 - G5 A5 B5 - G5 E5 A5 - A5 B5 C6 - B5 A5 | B5 - A5 G5 F#5 - G5 A5 B5 - - - . . . . |`),
    bass: seq(`E2 E3 E2 E3 E2 E3 B2 B3 | D2 D3 D2 D3 D2 D3 A2 A3 | C3 C4 C3 C4 G2 G3 G2 G3 | D3 D4 D3 D4 B2 B3 B2 B3 |
      E2 E3 E2 E3 E2 E3 B2 B3 | D2 D3 D2 D3 F#2 F#3 F#2 F#3 | C3 C4 C3 C4 A2 A3 A2 A3 | B2 B3 B2 B3 B2 B3 D#3 F#3`),
    drums: seq('k h s h k h s h k k s h k h s s') },
  // fase final da arena: o mesmo tema mais rápido, subindo
  gymFinal: { bpm: 178, lead: seq(`
    B5 - B5 D6 E6 - D6 B5 A5 - A5 B5 D6 - - - | B5 - B5 D6 E6 - G6 F#6 E6 - D6 B5 A5 - - - |
    C6 - C6 D6 E6 - C6 A5 D6 - D6 E6 F#6 - E6 D6 | E6 - D6 C6 B5 - C6 D6 E6 - - - E6 F#6 G6 - |`),
    bass: seq(`E2 E3 E2 E3 E2 E3 E2 E3 | D2 D3 D2 D3 D2 D3 D2 D3 | C3 C4 C3 C4 C3 C4 C3 C4 | B2 B3 B2 B3 B2 B3 B2 B3 |
      E2 E3 E2 E3 G2 G3 G2 G3 | D2 D3 D2 D3 F#2 F#3 F#2 F#3 | C3 C4 C3 C4 D3 D4 D3 D4 | B2 B3 B2 B3 D#3 D#4 F#3 F#4`),
    drums: seq('k s k s k s k s k k s k k s s s') },
  // tela de título: calma, devagar, sem bateria
  title: { bpm: 76, lead: seq(`
    E5 - - - G5 - A5 - B5 - - - A5 - G5 - | E5 - - - D5 - E5 - G5 - - - - - - - |
    C6 - - - B5 - A5 - G5 - - - E5 - G5 - | A5 - - - G5 - E5 - D5 - - - - - - - |
    E5 - - - G5 - A5 - B5 - - - D6 - B5 - | C6 - - - B5 - A5 - B5 - - - - - - - |
    A5 - - - G5 - E5 - G5 - - - A5 - B5 - | G5 - - - - - - - . . . . . . . . |`),
    bass: seq(`C3 . G3 . E4 . G3 . | G2 . D3 . B3 . D3 . | A2 . E3 . C4 . E3 . | E2 . B2 . G3 . B2 . |
      F2 . C3 . A3 . C3 . | C3 . G3 . E4 . G3 . | F2 . C3 . A3 . C3 . | G2 . D3 . G3 . . .`), drums: null, soft: true },
  // bosques e matas: menor, misteriosa
  forest: { bpm: 104, lead: seq(`
    A4 - C5 - E5 - D5 C5 B4 - - - G4 - B4 - | A4 - C5 - E5 - G5 F5 E5 - - - . . . . |
    F5 - E5 - D5 - C5 - B4 - C5 - D5 - - - | E5 - D5 - C5 - B4 - A4 - - - . . . . |`),
    bass: seq(`A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | E2 . B2 . E2 . G#2 . |
      D2 . A2 . D2 . A2 . | F2 . C3 . F2 . C3 . | E2 . B2 . E2 . B2 . | A2 . E3 . A2 . . .`),
    drums: seq('k . . h . . s . k . . h . . . h') },
  // ---- biomas (ramo biomas) ----
  // gelo: calma, de sino, em ré
  snow: { bpm: 84, lead: seq(`
    D5 - F#5 - A5 - - - G5 - F#5 - E5 - - - | D5 - E5 - F#5 - A5 - B5 - - - A5 - - - |
    G5 - F#5 - E5 - D5 - E5 - - - C#5 - - - | D5 - - - - - - - . . . . . . . . |`),
    bass: seq(`D3 . A3 . F#3 . A3 . | G2 . D3 . B3 . D3 . | E3 . B3 . G3 . B3 . | A2 . E3 . C#4 . E3 .`), drums: null, soft: true },
  // vulcão: menor, com pressa
  volcano: { bpm: 140, lead: seq(`
    E5 - E5 F5 E5 - D5 - E5 - G5 - F5 E5 D5 - | E5 - E5 F5 E5 - B4 - C5 - D5 - E5 - - - |
    G5 - F5 E5 F5 - E5 D5 E5 - C5 - B4 - - - | E5 F5 G5 - F5 E5 D5 - E5 - - - . . . . |`),
    bass: seq(`E2 E3 E2 E3 E2 E3 F2 F3 | E2 E3 E2 E3 D2 D3 D2 D3 | C2 C3 C2 C3 D2 D3 D2 D3 | E2 E3 E2 E3 E2 . E2 .`),
    drums: seq('k . h k s . h . k k h . s . h h') },
  // deserto e sertão: menor harmônica
  desert: { bpm: 108, lead: seq(`
    A4 - C5 - D5 - E5 - F5 - E5 - G#4 - - - | A4 - B4 - C5 - D5 - E5 - - - . . . . |
    F5 - E5 - D5 - C5 - B4 - C5 - D5 - - - | E5 - D5 - C5 - B4 - A4 - - - . . . . |`),
    bass: seq(`A2 . . A2 E3 . A2 . | A2 . . A2 E3 . G#2 . | D3 . . D3 A3 . D3 . | E2 . . E2 B2 . E2 .`),
    drums: seq('k . . h k . s . k . . h k . s h') },
  // mangue: lenta, molhada
  mangrove: { bpm: 92, lead: seq(`
    D5 - - F5 - G5 A5 - G5 - F5 - D5 - - - | C5 - D5 - F5 - - - E5 - D5 - - - . . |
    D5 - - F5 - G5 A5 - C6 - A5 - G5 - - - | F5 - E5 - D5 - - - . . . . . . . . |`),
    bass: seq(`D3 . A3 . D3 . C3 . | Bb2 . F3 . Bb2 . C3 . | D3 . A3 . D3 . F3 . | G2 . D3 . A2 . E3 .`),
    drums: seq('k . h . . k h . k . h . . k h h') },
  // cavernas: esparsa, misteriosa
  cave: { bpm: 70, lead: seq(`
    E5 - - - . . B4 - - - . . G5 - - - | F#5 - - - E5 - - - . . . . . . . . |
    C5 - - - . . G4 - - - . . E5 - - - | D#5 - - - B4 - - - . . . . . . . . |`),
    bass: seq(`E2 . . . B2 . . . | E2 . . . B2 . . . | C2 . . . G2 . . . | B1 . . . F#2 . . .`), drums: null, soft: true },
  // templos e ruínas: solene
  temple: { bpm: 80, lead: seq(`
    A4 - C5 - E5 - - - D5 - C5 - B4 - - - | A4 - B4 - C5 - E5 - A5 - - - - - - - |
    G5 - F5 - E5 - D5 - C5 - - - B4 - - - | A4 - - - - - - - . . . . . . . . |`),
    bass: seq(`A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | E2 . B2 . E2 . G#2 .`), drums: null, soft: true },
};

// sons que tocam muito em combate ganham uma leve variação de altura (não soam sempre iguais)
const VARY = new Set(['hit', 'hit-weak', 'hit-super', 'hit-heavy', 'pop', 'dodge', 'whoosh', 'crack', 'thud', 'shake', 'warn']);

export class Audio {
  constructor() { this.ctx = null; this.track = null; this.musicOn = true; this.rate = 1; }

  unlock() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // compressor no fim: explosões e trovões juntos não estouram (alto-falante de celular agradece)
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.knee.value = 18; this.comp.ratio.value = 4; this.comp.attack.value = 0.003; this.comp.release.value = 0.25;
    this.comp.connect(this.ctx.destination);
    this.master = this.ctx.createGain(); this.master.gain.value = 0.6; this.master.connect(this.comp);
    // música: volume da opção (musicGain) → abaixa no menu (duckGain) → master
    this.duckGain = this.ctx.createGain(); this.duckGain.gain.value = this.duckK ?? 1; this.duckGain.connect(this.master);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.duckGain);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.8; this.sfxGain.connect(this.master);
    // eco das cavernas: os efeitos também passam por um atraso com realimentação (liga com echo(true))
    this.echoD = this.ctx.createDelay(1); this.echoD.delayTime.value = 0.23; this.echoFb = this.ctx.createGain(); this.echoFb.gain.value = 0.38;
    this.echoWet = this.ctx.createGain(); this.echoWet.gain.value = this.echoOn ? 0.45 : 0;
    this.sfxGain.connect(this.echoD); this.echoD.connect(this.echoFb); this.echoFb.connect(this.echoD); this.echoD.connect(this.echoWet); this.echoWet.connect(this.master);
    this.ambGain = this.ctx.createGain(); this.ambGain.gain.value = 0.9; this.ambGain.connect(this.master);
    const real = new Float32Array(32), imag = new Float32Array(32);
    for (let n = 1; n < 32; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25); // pulso 25%
    this.pulse = this.ctx.createPeriodicWave(real, imag);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.pendingTrack) this.music(this.pendingTrack);
    if (this.ambName) { const n = this.ambName; this.ambName = null; this.ambient(n); }
    document.addEventListener('visibilitychange', () => (document.hidden ? this.ctx.suspend() : this.ctx.resume()));
  }

  #tone(f, t, dur, { type = 'square', vol = 0.2, to = null, dest = this.sfxGain, attack = 0.005 } = {}) {
    const c = this.ctx;
    if (dest === this.sfxGain && this.rate !== 1) { f *= this.rate; if (to) to *= this.rate; }
    const o = c.createOscillator();
    if (type === 'pulse') o.setPeriodicWave(this.pulse); else o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  #noise(t, dur, { vol = 0.25, freq: f = 2000, q = 0.8, type = 'bandpass', to = null, dest = this.sfxGain } = {}) {
    const c = this.ctx;
    const s = c.createBufferSource(); s.buffer = this.noise;
    if (dest === this.sfxGain && this.rate !== 1) { f *= this.rate; if (to) to *= this.rate; }
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  sfx(name, type) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const T = (...a) => this.#tone(...a), N = (...a) => this.#noise(...a);
    this.rate = VARY.has(name) ? 0.94 + Math.random() * 0.12 : 1;
    switch (name) {
      case 'blip': T(880, t, 0.05, { vol: 0.08, type: 'pulse' }); break;
      case 'tick': T(1320, t, 0.03, { vol: 0.045, type: 'pulse' }); break; // cursor do menu
      case 'back': T(660, t, 0.06, { to: 440, vol: 0.07, type: 'pulse' }); break; // voltar no menu
      case 'pop': T(300, t, 0.15, { to: 1200, vol: 0.18 }); N(t, 0.12, { freq: 4000, vol: 0.12 }); break;
      case 'throw': T(400, t, 0.3, { to: 900, vol: 0.1, type: 'triangle' }); N(t, 0.25, { freq: 1500, to: 4000, vol: 0.08 }); break;
      case 'hit': N(t, 0.12, { freq: 1200, vol: 0.35 }); T(160, t, 0.12, { to: 60, vol: 0.3, type: 'triangle' }); break;
      case 'hit-super': N(t, 0.2, { freq: 900, vol: 0.45 }); T(220, t, 0.18, { to: 50, vol: 0.35, type: 'square' }); T(880, t + 0.02, 0.1, { vol: 0.1 }); break;
      case 'hit-weak': N(t, 0.08, { freq: 2200, vol: 0.18 }); break;
      case 'faint': T(600, t, 0.7, { to: 80, vol: 0.18, type: 'pulse' }); break;
      case 'levelup': [0, 4, 7, 12].forEach((s, i) => T(523 * 2 ** (s / 12), t + i * 0.08, 0.16, { vol: 0.14, type: 'pulse' })); break;
      case 'caught': [0, 4, 7, 4, 7, 12].forEach((s, i) => T(659 * 2 ** (s / 12), t + i * 0.1, 0.18, { vol: 0.14, type: 'pulse' })); break;
      case 'shake': T(220, t, 0.06, { vol: 0.15, type: 'square' }); N(t, 0.05, { freq: 3000, vol: 0.1 }); break;
      case 'thud': T(120, t, 0.15, { to: 50, vol: 0.3, type: 'triangle' }); N(t, 0.1, { freq: 400, vol: 0.2 }); break;
      case 'bump': T(150, t, 0.07, { to: 95, vol: 0.1, type: 'triangle' }); N(t, 0.03, { freq: 500, vol: 0.05 }); break; // esbarrar na parede (movimento em grade)
      case 'deny': T(110, t, 0.12, { vol: 0.12, type: 'square' }); break;
      case 'dodge': N(t, 0.2, { freq: 800, to: 3000, vol: 0.15 }); break;
      case 'status': T(300, t, 0.3, { to: 150, vol: 0.12, type: 'pulse' }); T(310, t, 0.3, { to: 160, vol: 0.08, type: 'square' }); break;
      case 'heal': [0, 7, 12].forEach((s, i) => T(659 * 2 ** (s / 12), t + i * 0.07, 0.2, { vol: 0.1, type: 'triangle' })); break;
      case 'rustle': N(t, 0.35, { freq: 3000, vol: 0.18, q: 0.5 }); N(t + 0.15, 0.3, { freq: 2500, vol: 0.12, q: 0.5 }); break;
      case 'splash': N(t, 0.4, { freq: 700, to: 200, vol: 0.2, type: 'lowpass' }); N(t + 0.05, 0.25, { freq: 2500, vol: 0.08 }); break;
      case 'pickup': [0, 7].forEach((s, i) => T(988 * 2 ** (s / 12), t + i * 0.06, 0.1, { vol: 0.1, type: 'triangle' })); break;
      case 'teleport': T(500, t, 0.3, { to: 2000, vol: 0.1, type: 'sine' }); T(700, t + 0.05, 0.25, { to: 2600, vol: 0.06, type: 'sine' }); break;
      case 'munch': for (let i = 0; i < 3; i++) N(t + i * 0.12, 0.06, { freq: 1800, vol: 0.12 }); break;
      case 'step': N(t, 0.04, { freq: 600, vol: 0.04 }); break;
      // ---- combate ----
      case 'hit-heavy': N(t, 0.25, { freq: 700, vol: 0.5 }); T(140, t, 0.25, { to: 40, vol: 0.4, type: 'square' }); N(t + 0.02, 0.3, { freq: 200, vol: 0.3, type: 'lowpass' }); break;
      case 'warn': T(980, t, 0.05, { vol: 0.05, type: 'pulse' }); T(980, t + 0.09, 0.05, { vol: 0.05, type: 'pulse' }); break;
      case 'whistle': T(1700, t, 0.12, { to: 2300, vol: 0.09, type: 'sine' }); T(2300, t + 0.15, 0.22, { to: 1800, vol: 0.09, type: 'sine' }); break;
      case 'whoosh': N(t, 0.22, { freq: 600, to: 2600, vol: 0.18, q: 0.6 }); break;
      case 'clash': N(t, 0.3, { freq: 2500, vol: 0.35, q: 2 }); T(1800, t, 0.12, { to: 900, vol: 0.12, type: 'square' }); T(2400, t + 0.03, 0.15, { to: 1200, vol: 0.08, type: 'square' }); break;
      case 'boom': N(t, 0.8, { freq: 500, to: 60, vol: 0.6, type: 'lowpass' }); T(90, t, 0.6, { to: 30, vol: 0.5, type: 'triangle' }); N(t, 0.15, { freq: 3000, vol: 0.25 }); break;
      case 'struggle': N(t, 0.12, { freq: 1500 + Math.random() * 1500, vol: 0.18, q: 3 }); T(200 + Math.random() * 80, t, 0.1, { vol: 0.1, type: 'square' }); break;
      case 'beam-fire': N(t, 0.14, { freq: 700 + Math.random() * 300, to: 400, vol: 0.2, type: 'lowpass' }); N(t, 0.1, { freq: 3000, vol: 0.05 }); break;
      case 'beam-water': N(t, 0.14, { freq: 1200 + Math.random() * 400, vol: 0.16, q: 0.5 }); break;
      case 'beam-electric': for (let i = 0; i < 2; i++) T(600 + Math.random() * 900, t + i * 0.03, 0.04, { vol: 0.08, type: 'square' }); break;
      case 'beam-ice': T(1800 + Math.random() * 600, t, 0.08, { vol: 0.05, type: 'triangle' }); N(t, 0.12, { freq: 5000, vol: 0.06 }); break;
      case 'crack': N(t, 0.1, { freq: 1800, vol: 0.3, q: 1.5 }); T(300, t, 0.08, { to: 120, vol: 0.15, type: 'square' }); break;
      case 'break': N(t, 0.35, { freq: 900, to: 200, vol: 0.45 }); for (let i = 0; i < 4; i++) N(t + 0.05 + i * 0.05, 0.06, { freq: 2000 + i * 300, vol: 0.12 }); break;
      case 'dig': N(t, 0.3, { freq: 400, to: 150, vol: 0.3, type: 'lowpass' }); N(t + 0.1, 0.2, { freq: 900, vol: 0.12 }); break;
      case 'jump': T(300, t, 0.12, { to: 700, vol: 0.1, type: 'pulse' }); break;
      case 'quake': N(t, 0.9, { freq: 120, vol: 0.55, type: 'lowpass' }); T(45, t, 0.8, { vol: 0.4, type: 'triangle' }); N(t + 0.1, 0.4, { freq: 600, vol: 0.15 }); break;
      case 'howl': T(320, t, 0.7, { to: 520, vol: 0.14, type: 'pulse' }); T(330, t + 0.02, 0.7, { to: 500, vol: 0.1, type: 'square' }); T(520, t + 0.6, 0.4, { to: 300, vol: 0.12, type: 'pulse' }); break;
      case 'perfect': [0, 7, 12, 19].forEach((s, i) => T(880 * 2 ** (s / 12), t + i * 0.04, 0.12, { vol: 0.09, type: 'triangle' })); break;
      case 'thunder': N(t, 1.0, { freq: 300, to: 60, vol: 0.6, type: 'lowpass' }); N(t, 0.2, { freq: 4000, vol: 0.35 }); T(70, t, 0.8, { to: 30, vol: 0.4, type: 'square' }); break;
      case 'charge': T(200, t, 0.5, { to: 900, vol: 0.08, type: 'triangle' }); T(205, t, 0.5, { to: 910, vol: 0.05, type: 'square' }); break;
      case 'shield': T(660, t, 0.3, { to: 990, vol: 0.1, type: 'sine' }); T(990, t + 0.05, 0.3, { vol: 0.06, type: 'triangle' }); break;
      case 'freeze': for (let i = 0; i < 5; i++) T(2000 + i * 400, t + i * 0.03, 0.06, { vol: 0.05, type: 'triangle' }); break;
      case 'gota': T(1500 + Math.random() * 500, t, 0.07, { to: 700, vol: 0.05, type: 'sine' }); break;
      case 'sino': [0, 12, 19].forEach((s2, i) => T(392 * 2 ** (s2 / 12), t + i * 0.01, 1.6 - i * 0.4, { vol: 0.12 / (i + 1), type: 'sine', attack: 0.004 })); T(784, t, 0.05, { vol: 0.08, type: 'square' }); break;
      case 'crowd': for (let i = 0; i < 4; i++) N(t + i * 0.07, 0.35, { freq: 900 + Math.random() * 900, vol: 0.07, q: 0.7 }); T(330, t, 0.25, { to: 420, vol: 0.03, type: 'triangle' }); break;
      case 'berimbau': T(196, t, 0.28, { to: 186, vol: 0.12, type: 'triangle' }); T(392, t, 0.12, { vol: 0.05, type: 'square' }); N(t, 0.03, { freq: 5000, vol: 0.05 }); break;
      case 'exclaim': T(1200, t, 0.08, { vol: 0.1, type: 'pulse' }); T(1600, t + 0.08, 0.1, { vol: 0.1, type: 'pulse' }); break;
      default:
        if (name.startsWith('move-')) {
          const kind = name.slice(5);
          const base = { fire: 300, water: 500, electric: 900, grass: 600, poison: 250, psychic: 700, flying: 400, rock: 150, ground: 120, bug: 800, ice: 1400, dragon: 220, ghost: 330, dark: 260, fairy: 1200, fighting: 200, steel: 1000, normal: 450 }[type] ?? 450;
          if (kind === 'proj' && type === 'ice') { T(base, t, 0.15, { to: base * 1.5, vol: 0.08, type: 'triangle' }); N(t, 0.15, { freq: 6000, vol: 0.06 }); break; }
          if (kind === 'proj' && (type === 'ghost' || type === 'dark' || type === 'dragon')) { T(base, t, 0.3, { to: base * 0.5, vol: 0.12, type: 'sawtooth' }); break; }
          if (kind === 'proj' && type === 'psychic') { T(base, t, 0.3, { to: base * 1.6, vol: 0.08, type: 'sine' }); T(base * 1.5, t, 0.3, { to: base * 2.2, vol: 0.05, type: 'sine' }); break; }
          if (kind === 'proj' && type === 'fairy') { [0, 4, 7].forEach((s2, i) => T(base * 2 ** (s2 / 12), t + i * 0.04, 0.1, { vol: 0.06, type: 'triangle' })); break; }
          if (kind === 'proj') { if (type === 'electric') { for (let i = 0; i < 4; i++) T(base * (1 + Math.random()), t + i * 0.03, 0.05, { vol: 0.1, type: 'square' }); } else if (type === 'fire') N(t, 0.35, { freq: 900, to: 300, vol: 0.25, type: 'lowpass' }); else T(base, t, 0.22, { to: base * 2, vol: 0.12, type: type === 'water' ? 'sine' : 'triangle' }); }
          else if (kind === 'melee' || kind === 'multi' || kind === 'dash') N(t, 0.15, { freq: 2500, to: 600, vol: 0.18 });
          else if (kind === 'cone') N(t, 0.4, { freq: 600, to: 1800, vol: 0.18, q: 0.4 });
          else if (kind === 'wave') { T(400, t, 0.35, { vol: 0.12, type: 'pulse' }); T(410, t + 0.05, 0.3, { vol: 0.08, type: 'pulse' }); }
          else if (kind === 'self') [0, 5, 9].forEach((s, i) => T(700 * 2 ** (s / 12), t + i * 0.06, 0.15, { vol: 0.08, type: 'triangle' }));
          else if (kind === 'cloud') N(t, 0.6, { freq: 1500, vol: 0.12, q: 0.3 });
          else if (kind === 'rain') N(t, 0.5, { freq: 300, to: 120, vol: 0.2, type: 'lowpass' });
          else if (kind === 'quake') { N(t, 0.6, { freq: 150, vol: 0.4, type: 'lowpass' }); T(55, t, 0.6, { vol: 0.3, type: 'triangle' }); }
        }
    }
  }

  music(name) {
    if (!this.ctx) { this.pendingTrack = name; return; }
    if (this.track === name) return;
    this.track = name;
    clearInterval(this.timer);
    const tr = PARTITURAS[name] ?? TRACKS[name];
    if (!tr || !this.musicOn) return;
    // Cada troca tem sua própria saída: encerra o tema anterior sem cortar a cauda das notas.
    if (this.arranjo) { const antigo = this.arranjo; antigo.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15); setTimeout(() => antigo.disconnect(), 1200); }
    const saida = this.arranjo = this.ctx.createGain(); saida.gain.value = 0.001; saida.connect(this.musicGain); saida.gain.setTargetAtTime(1, this.ctx.currentTime, 0.2);
    const step = 60 / tr.bpm / 2;
    let i = 0, next = this.ctx.currentTime + 0.1;
    const lead = tr.lead, bass = tr.bass, drums = tr.drums;
    const sustain = (arr, k) => { let n = 1; while (arr[(k + n) % arr.length] === '-') n++; return n; };
    const tick = () => {
      while (next < this.ctx.currentTime + 0.2) {
        const l = lead[i % lead.length];
        if (l !== '-' && l !== '.') this.#tone(freq(l), next, step * sustain(lead, i % lead.length) * 0.92, { type: tr.timbre ?? (tr.soft ? 'triangle' : 'pulse'), vol: tr.soft ? 0.16 : 0.09, dest: saida, attack: tr.soft ? 0.03 : 0.01 });
        const b = bass[i % bass.length];
        if (b !== '-' && b !== '.') this.#tone(freq(b), next, step * 0.9, { type: 'triangle', vol: 0.22, dest: saida, attack: 0.005 });
        const ar = tr.arp?.[i % tr.arp.length];
        if (ar && ar !== '.') this.#tone(freq(ar), next, step * 0.72, { type: 'triangle', vol: 0.055, dest: saida, attack: 0.012 });
        const acorde = tr.pad?.[i % tr.pad.length];
        if (acorde) for (const n of acorde) this.#tone(freq(n), next, step * 13, { type: 'sine', vol: tr.batalha ? 0.022 : 0.035, dest: saida, attack: 0.14 });
        if (drums) {
          const d = drums[i % drums.length];
          if (d === 'k') this.#tone(140, next, 0.12, { to: 45, type: 'sine', vol: 0.4, dest: saida });
          if (d === 's') this.#noise(next, 0.1, { freq: 1800, vol: 0.18, dest: saida });
          if (d === 'h') this.#noise(next, 0.03, { freq: 8000, vol: 0.06, type: 'highpass', dest: saida });
        }
        i++; next += step;
      }
    };
    this.timer = setInterval(tick, 50);
    tick();
  }

  // abaixa a música (menu aberto) com rampa curta; k = 1 volta ao normal
  duck(k) {
    this.duckK = k;
    if (!this.duckGain) return;
    const t = this.ctx.currentTime; this.duckGain.gain.cancelScheduledValues(t);
    this.duckGain.gain.setTargetAtTime(k, t, 0.12);
  }

  // eco (cavernas, templos, salas escuras)
  echo(on) {
    this.echoOn = on; if (!this.echoWet) return;
    const t = this.ctx.currentTime; this.echoWet.gain.cancelScheduledValues(t); this.echoWet.gain.setTargetAtTime(on ? 0.45 : 0, t, 0.3);
  }
  // som ambiente contínuo do bioma: 'vento', 'lava', 'mar', 'gotas', 'mangue', 'templo' ou null
  ambient(name) {
    if (!this.ctx) { this.ambName = name; return; }
    if (name === this.ambName) return;
    this.ambName = name;
    const c = this.ctx, t = c.currentTime;
    if (this.amb) { const o = this.amb; o.g.gain.setTargetAtTime(0.0001, t, 0.5); setTimeout(() => { try { o.src.stop(); o.lfo?.stop(); } catch { /* já parou */ } }, 2500); clearInterval(o.timer); this.amb = null; }
    if (!name) return;
    const P = { vento: ['bandpass', 520, 0.6, 0.07, 0.13, 380], lava: ['lowpass', 170, 0.9, 0.12, 0.07, 60], mar: ['lowpass', 650, 0.7, 0.06, 0.11, 0], gotas: ['lowpass', 220, 0.8, 0.025, 0.05, 40], mangue: ['highpass', 3800, 1.5, 0.012, 0.6, 0], templo: ['lowpass', 130, 0.8, 0.04, 0.04, 30] }[name];
    if (!P) return;
    const [type, f0, q, vol, lfoHz, lfoAmt] = P;
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f0; fl.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.setTargetAtTime(vol, t, 1);
    src.connect(fl); fl.connect(g); g.connect(this.ambGain); src.start();
    // oscilador lento: rajadas de vento, ondas do mar
    const lfo = c.createOscillator(); lfo.frequency.value = lfoHz; const la = c.createGain();
    if (name === 'mar') { la.gain.value = vol * 0.8; lfo.connect(la); la.connect(g.gain); } else { la.gain.value = lfoAmt; lfo.connect(la); la.connect(fl.frequency); }
    lfo.start();
    // eventos soltos: bolhas de lava, gotas, sapos e grilos
    const timer = setInterval(() => {
      if (document.hidden) return;
      const n = c.currentTime, r = Math.random();
      if (name === 'lava' && r < 0.3) this.#tone(90 + Math.random() * 60, n, 0.12, { to: 40, vol: 0.06, type: 'sine', dest: this.ambGain });
      if (name === 'gotas' && r < 0.18) this.#tone(1300 + Math.random() * 900, n, 0.06, { to: 700, vol: 0.035, type: 'sine', dest: this.sfxGain });
      if (name === 'mangue' && r < 0.12) { const f = 95 + Math.random() * 40; for (let i = 0; i < 3; i++) this.#tone(f, n + i * 0.09, 0.06, { vol: 0.05, type: 'square', dest: this.ambGain }); }
      if (name === 'templo' && r < 0.04) this.#tone(220 * (Math.random() < 0.5 ? 1 : 1.5), n, 2.2, { vol: 0.025, type: 'sine', dest: this.ambGain, attack: 0.6 });
    }, 300);
    this.amb = { src, g, lfo, timer };
  }

  toggleMusic(on) { this.musicOn = on; const t = this.track; this.track = null; if (on) this.music(t); else clearInterval(this.timer); }
}
