// Status, IVs, EVs, estágios e experiência — fórmulas das gerações 3 em diante. Funções puras.
import { natureMult } from '../data/natures.js';

export const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
export const STAT_PT = { hp: 'PS', atk: 'Ataque', def: 'Defesa', spa: 'Ataque Especial', spd: 'Defesa Especial', spe: 'Velocidade', acc: 'Precisão', eva: 'Evasão' };
export const IV_MAX = 31;
export const EV_STAT_MAX = 252;
export const EV_TOTAL_MAX = 510;

// PS = ⌊(2·Base + IV + ⌊EV/4⌋)·Nível/100⌋ + Nível + 10
// Outros = ⌊(⌊(2·Base + IV + ⌊EV/4⌋)·Nível/100⌋ + 5) · Natureza⌋
export function calcStat(key, base, iv, ev, level, nature) {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (key === 'hp') return base === 1 ? 1 : core + level + 10; // Shedinja
  return Math.floor((core + 5) * natureMult(nature, key));
}

export function calcStats(base, ivs, evs, level, nature) {
  const s = {};
  STAT_KEYS.forEach((k, i) => { s[k] = calcStat(k, base[i], ivs[i] ?? 0, evs?.[i] ?? 0, level, nature); });
  return s;
}

export function randomIvs(rng = Math.random) {
  return STAT_KEYS.map(() => Math.floor(rng() * (IV_MAX + 1)));
}

// Soma EVs respeitando 252 por status e 510 no total. Devolve quanto entrou em cada status.
export function addEvs(evs, gain, mult = 1) {
  const got = [0, 0, 0, 0, 0, 0];
  let total = evs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 6; i++) {
    const want = Math.max(0, Math.floor((gain[i] ?? 0) * mult));
    const room = Math.min(EV_STAT_MAX - evs[i], EV_TOTAL_MAX - total);
    const add = Math.max(0, Math.min(want, room));
    evs[i] += add; total += add; got[i] = add;
  }
  return got;
}

// Estágios −6..+6: Atq/Def/AtqE/DefE/Vel usam (2+n)/2; precisão e evasão usam (3+n)/3.
export function stageMult(stage, accuracy = false) {
  const s = Math.max(-6, Math.min(6, stage | 0));
  const b = accuracy ? 3 : 2;
  return s >= 0 ? (b + s) / b : b / (b - s);
}

// Chance de crítico pelo estágio (gerações 7+): 1/24, 1/8, 1/2, sempre.
export const CRIT_CHANCE = [1 / 24, 1 / 8, 1 / 2, 1];

// ---- experiência ----
// Curvas: s lenta, mf média-rápida, f rápida, ms média-lenta, e errática, fl flutuante.
export function expForLevel(growth, n) {
  if (n <= 1) return 0;
  switch (growth) {
    case 'ms': return Math.max(0, Math.floor(1.2 * n ** 3 - 15 * n ** 2 + 100 * n - 140));
    case 's': return Math.floor((5 * n ** 3) / 4);
    case 'f': return Math.floor((4 * n ** 3) / 5);
    case 'e':
      if (n <= 50) return Math.floor((n ** 3 * (100 - n)) / 50);
      if (n <= 68) return Math.floor((n ** 3 * (150 - n)) / 100);
      if (n <= 98) return Math.floor((n ** 3 * Math.floor((1911 - 10 * n) / 3)) / 500);
      return Math.floor((n ** 3 * (160 - n)) / 100);
    case 'fl':
      if (n <= 15) return Math.floor((n ** 3 * (Math.floor((n + 1) / 3) + 24)) / 50);
      if (n <= 36) return Math.floor((n ** 3 * (n + 14)) / 50);
      return Math.floor((n ** 3 * (Math.floor(n / 2) + 32)) / 50);
    default: return n ** 3;
  }
}

// XP por derrotar (gerações 7+, "escalonada"): ⌊(b·L/5)·((2L+10)/(L+Lv+10))^2,5⌋ + 1,
// × 1,5 com Ovo da Sorte, × 1,5 se foi recebido em troca. Sem o vencedor, usa a fórmula da geração 3 (b·L/7).
export function expYield(baseExp, level, opts = {}) {
  const { victorLevel = null, trainer = false, luckyEgg = false, traded = false, share = 1 } = opts;
  let xp;
  if (victorLevel == null) xp = Math.floor((baseExp * level * (trainer ? 1.5 : 1)) / 7);
  else xp = Math.floor(((baseExp * level) / 5 / share) * Math.pow((2 * level + 10) / (level + victorLevel + 10), 2.5)) + 1;
  if (luckyEgg) xp = Math.floor(xp * 1.5);
  if (traded) xp = Math.floor(xp * 1.5);
  return Math.max(1, xp);
}
