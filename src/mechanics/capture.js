// Chance de captura (gerações 6+): a = ((3·PSmáx − 2·PS) · taxa · bola / (3·PSmáx)) · estado · nível baixo
// Cada uma das 4 sacudidas passa com b/65536, b = 65536 / (255/a)^(3/16); captura = (a/255)^(3/4).
// Adaptações ao tempo real: "primeiro turno" = primeiros QUICK_S segundos do encontro; "turnos" da Bola
// Cronômetro = segundos / TURNO_S; pegar o selvagem distraído (sem ter percebido você) dá ×1,6.
import { itemInfo, itemId } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { TURNO_S } from './tempo.js';
import * as amb from './ambiente.js';

export const QUICK_S = 6;
export const UNAWARE_BONUS = 1.6;

// Multiplicador da bola (ou { add } para a Bola Pesada, que soma na taxa). ctx: veja catchChance.
export function ballModifier(ballId, mon, ctx = {}) {
  const it = itemInfo(ballId);
  const rule = it?.ball ?? 1;
  if (typeof rule === 'number') return { mult: rule };
  const sp = SPECIES[mon.dex] ?? {};
  const types = sp.types ?? [];
  const seconds = ctx.seconds ?? null; // sem informação: Bola Rápida só vale com o alvo distraído
  switch (rule) {
    case 'master': return { mult: 1, guaranteed: true };
    case 'quick': return { mult: (seconds != null && seconds <= QUICK_S) || ctx.unaware ? 5 : 1 };
    case 'dusk': return { mult: (ctx.night ?? amb.isNight()) || (ctx.cave ?? amb.inCave()) ? 3 : 1 };
    case 'net': return { mult: types.includes('water') || types.includes('bug') ? 3.5 : 1 };
    case 'nest': return { mult: mon.level < 30 ? Math.max(1, (41 - mon.level) / 10) : 1 };
    case 'timer': return { mult: Math.min(4, 1 + ((seconds ?? 0) / TURNO_S) * (1229 / 4096)) };
    case 'repeat': return { mult: ctx.caught?.has?.(mon.dex) || ctx.caught?.includes?.(mon.dex) ? 3.5 : 1 };
    case 'level': {
      const L = ctx.leadLevel ?? 0, l = mon.level;
      return { mult: L >= 4 * l ? 8 : L >= 2 * l ? 4 : L > l ? 2 : 1 };
    }
    case 'love': return { mult: ctx.leadDex === mon.dex && ctx.leadGender && mon.gender && ctx.leadGender !== mon.gender ? 8 : 1 };
    case 'heavy': {
      const w = sp.weight ?? 0;
      return { mult: 1, add: w >= 300 ? 30 : w >= 200 ? 20 : w >= 100 ? 0 : -20 };
    }
    case 'lure': return { mult: ctx.fishing ? 4 : 1 };
    case 'moon': return { mult: (sp.evo ?? []).some((e) => e.item === 'moonStone') ? 4 : 1 };
    case 'fast': return { mult: (sp.base?.[5] ?? 0) >= 100 ? 4 : 1 };
    case 'dive': return { mult: ctx.water || ctx.fishing ? 3.5 : 1 };
    case 'dream': return { mult: mon.status === 'slp' || ctx.asleep ? 4 : 1 };
    case 'beast': return { mult: 410 / 4096 };
    default: return { mult: 1 };
  }
}

/**
 * mon: o Mon selvagem. ball: id da bola ('pokeBall', 'greatBall', … ou o antigo 'pokeball').
 * ctx: { seconds (desde o começo do encontro), unaware (não percebeu você), asleep, stunned, night, cave,
 *        water, fishing, caught (Set/array de dex já capturados), leadLevel, leadDex, leadGender }
 * Devolve { chance (0–1), shake (chance de cada sacudida), a, guaranteed }.
 */
export function catchChance(mon, ball = 'pokeBall', ctx = {}) {
  const sp = SPECIES[mon.dex] ?? {};
  const bm = ballModifier(itemId(ball), mon, ctx);
  if (bm.guaranteed) return { chance: 1, shake: 1, a: 255, guaranteed: true };
  const max = mon.stats.hp, hp = Math.max(1, mon.hp);
  const rate = Math.max(1, Math.min(255, (sp.catchRate ?? 45) + (bm.add ?? 0)));
  let a = ((3 * max - 2 * hp) * rate * bm.mult) / (3 * max);
  // estado: dormindo/congelado ×2,5; paralisado/envenenado/queimado ×1,5
  const st = mon.status;
  if (st === 'slp' || st === 'frz' || ctx.asleep) a *= 2.5;
  else if (st || ctx.stunned) a *= 1.5;
  // nível baixo (Scarlet/Violet): abaixo do nível 13, × (36 − 2·nível)/10
  if (mon.level < 13) a *= (36 - 2 * mon.level) / 10;
  if (ctx.unaware) a *= UNAWARE_BONUS;
  if (a >= 255) return { chance: 1, shake: 1, a, guaranteed: false };
  const shake = Math.pow(a / 255, 3 / 16);
  return { chance: Math.pow(shake, 4), shake, a, guaranteed: false };
}

// Sorteia as 4 sacudidas. Devolve quantas passaram (4 = capturou).
export function rollShakes(chance, rng = Math.random) {
  const s = Math.pow(chance, 1 / 4);
  let n = 0;
  while (n < 4 && rng() < s) n++;
  return n;
}
