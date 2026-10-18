import { SPECIES, expForLevel } from '../data/species.js';
import { MOVES } from '../data/moves.js';

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

// Um Pokémon da equipe ou selvagem. Fórmulas de status, XP e evolução das gerações 3+.
export class Mon {
  constructor(dex, level, opts = {}) {
    this.dex = dex;
    this.level = level;
    this.ivs = opts.ivs ?? STAT_KEYS.map(() => Math.floor(Math.random() * 32));
    this.nick = opts.nick ?? null;
    this.xp = opts.xp ?? expForLevel(this.sp.growth, level);
    this.moves = opts.moves ?? Mon.defaultMoves(dex, level);
    this.status = opts.status ?? null; // par | slp | psn | brn
    this.calc();
    this.hp = opts.hp ?? this.stats.hp;
    this.uid = opts.uid ?? Math.random().toString(36).slice(2, 10);
  }

  get sp() { return SPECIES[this.dex]; }
  get name() { return this.nick || this.sp.name; }
  get types() { return this.sp.types; }
  get fainted() { return this.hp <= 0; }

  static defaultMoves(dex, level) {
    const learned = SPECIES[dex].learn.filter(([lv]) => lv <= level).map(([, id]) => id);
    return [...new Set(learned)].slice(-4);
  }

  calc() {
    const b = this.sp.base, L = this.level;
    const s = {};
    STAT_KEYS.forEach((k, i) => {
      const core = Math.floor(((2 * b[i] + this.ivs[i]) * L) / 100);
      s[k] = i === 0 ? core + L + 10 : core + 5;
    });
    const oldMax = this.stats?.hp;
    this.stats = s;
    if (oldMax != null) this.hp = Math.min(s.hp, this.hp + (s.hp - oldMax));
  }

  xpToNext() { return expForLevel(this.sp.growth, this.level + 1); }
  xpFloor() { return expForLevel(this.sp.growth, this.level); }

  // Ganha XP; devolve a lista de eventos (subiu de nível, novo golpe, evolução pronta).
  gainXp(amount) {
    const events = [];
    if (this.level >= 100) return events;
    this.xp += amount;
    while (this.level < 100 && this.xp >= this.xpToNext()) {
      this.level++;
      this.calc();
      events.push({ type: 'level', level: this.level });
      for (const [lv, id] of this.sp.learn) {
        if (lv === this.level && !this.moves.includes(id)) events.push({ type: 'learn', move: id });
      }
      const ev = this.sp.evolve;
      if (ev && this.level >= ev.level && SPECIES[ev.to]) events.push({ type: 'evolve', to: ev.to });
    }
    return events;
  }

  evolveTo(dex) {
    const ratio = this.hp / this.stats.hp;
    this.dex = dex;
    this.stats = null;
    this.calc();
    this.hp = Math.max(1, Math.round(this.stats.hp * ratio));
  }

  learn(id, replaceIndex = -1) {
    if (this.moves.includes(id)) return;
    if (this.moves.length < 4) this.moves.push(id);
    else if (replaceIndex >= 0) this.moves[replaceIndex] = id;
  }

  heal() { this.hp = this.stats.hp; this.status = null; }

  // XP de derrotar este Pokémon (fórmula da geração 3).
  xpYield(trainer = false) {
    return Math.floor((this.sp.baseExp * this.level * (trainer ? 1.5 : 1)) / 7);
  }

  toJSON() {
    return { dex: this.dex, level: this.level, ivs: this.ivs, nick: this.nick, xp: this.xp,
      moves: this.moves, status: this.status, hp: this.hp, uid: this.uid };
  }
  static from(o) { return new Mon(o.dex, o.level, o); }
}

export function moveInfo(id) { return MOVES[id]; }
