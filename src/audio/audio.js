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
};

export class Audio {
  constructor() { this.ctx = null; this.track = null; this.musicOn = true; }

  unlock() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.55; this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.8; this.sfxGain.connect(this.master);
    const real = new Float32Array(32), imag = new Float32Array(32);
    for (let n = 1; n < 32; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25); // pulso 25%
    this.pulse = this.ctx.createPeriodicWave(real, imag);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.pendingTrack) this.music(this.pendingTrack);
    document.addEventListener('visibilitychange', () => (document.hidden ? this.ctx.suspend() : this.ctx.resume()));
  }

  #tone(f, t, dur, { type = 'square', vol = 0.2, to = null, dest = this.sfxGain, attack = 0.005 } = {}) {
    const c = this.ctx;
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
    switch (name) {
      case 'blip': T(880, t, 0.05, { vol: 0.08, type: 'pulse' }); break;
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
    const tr = TRACKS[name];
    if (!tr || !this.musicOn) return;
    const step = 60 / tr.bpm / 2;
    let i = 0, next = this.ctx.currentTime + 0.1;
    const lead = tr.lead, bass = tr.bass, drums = tr.drums;
    const sustain = (arr, k) => { let n = 1; while (arr[(k + n) % arr.length] === '-') n++; return n; };
    const tick = () => {
      while (next < this.ctx.currentTime + 0.2) {
        const l = lead[i % lead.length];
        if (l !== '-' && l !== '.') this.#tone(freq(l), next, step * sustain(lead, i % lead.length) * 0.92, { type: 'pulse', vol: 0.09, dest: this.musicGain, attack: 0.01 });
        const b = bass[i % bass.length];
        if (b !== '-' && b !== '.') this.#tone(freq(b), next, step * 0.9, { type: 'triangle', vol: 0.22, dest: this.musicGain, attack: 0.005 });
        if (drums) {
          const d = drums[i % drums.length];
          if (d === 'k') this.#tone(140, next, 0.12, { to: 45, type: 'sine', vol: 0.4, dest: this.musicGain });
          if (d === 's') this.#noise(next, 0.1, { freq: 1800, vol: 0.18, dest: this.musicGain });
          if (d === 'h') this.#noise(next, 0.03, { freq: 8000, vol: 0.06, type: 'highpass', dest: this.musicGain });
        }
        i++; next += step;
      }
    };
    this.timer = setInterval(tick, 50);
    tick();
  }

  toggleMusic(on) { this.musicOn = on; const t = this.track; this.track = null; if (on) this.music(t); else clearInterval(this.timer); }
}
