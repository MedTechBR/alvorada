// Aprender golpes: por nível, por MT (reutilizável) e por ensino (tutor).
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS, itemId } from '../data/items.js';

// Como a espécie aprende o golpe: 'level' | 'tm' | 'tutor' | null
export function learnMethod(dex, moveId) {
  const s = SPECIES[dex];
  if (!s) return null;
  if (s.learn.some(([, id]) => id === moveId)) return 'level';
  if (s.tm.includes(moveId)) return 'tm';
  if (s.tutor.includes(moveId)) return 'tutor';
  return null;
}

export function canLearn(mon, moveId, via = null) {
  if (!MOVES[moveId] || mon.moves.includes(moveId)) return false;
  const m = learnMethod(mon.dex, moveId);
  return via ? m === via || (via === 'tutor' && m === 'level') : !!m;
}

// Golpes aprendidos exatamente neste nível (0 = ao evoluir)
export function movesAtLevel(dex, level) {
  return (SPECIES[dex]?.learn ?? []).filter(([lv]) => lv === level).map(([, id]) => id);
}

// Os 4 últimos golpes aprendidos por nível até `level` (como um selvagem dos jogos)
export function defaultMoves(dex, level) {
  const learned = (SPECIES[dex]?.learn ?? []).filter(([lv]) => lv <= level).map(([, id]) => id).filter((id) => MOVES[id]);
  return [...new Set(learned.reverse())].slice(0, 4).reverse();
}

/**
 * Ensina um golpe. replaceIndex: posição a trocar se já souber 4 (−1 = não troca).
 * Devolve { ok, reason?, replaced? }. reason: 'unknown' | 'known' | 'full' | 'cannot'.
 */
export function learnMove(mon, moveId, replaceIndex = -1, { check = false, via = null } = {}) {
  if (!MOVES[moveId]) return { ok: false, reason: 'unknown' };
  if (mon.moves.includes(moveId)) return { ok: false, reason: 'known' };
  if (check && !canLearn(mon, moveId, via)) return { ok: false, reason: 'cannot' };
  if (mon.moves.length < 4) { mon.moves.push(moveId); return { ok: true }; }
  if (replaceIndex < 0 || replaceIndex > 3) return { ok: false, reason: 'full' };
  const replaced = mon.moves[replaceIndex];
  mon.moves[replaceIndex] = moveId;
  return { ok: true, replaced };
}

// Usa uma MT (não se gasta). tmId: 'tm001'…
export function useTM(mon, tmId, replaceIndex = -1) {
  const it = ITEMS[itemId(tmId)];
  if (!it || it.cat !== 'tm') return { ok: false, reason: 'notTM' };
  return { ...learnMove(mon, it.move, replaceIndex, { check: true, via: it.extra ? null : 'tm' }), move: it.move, consumed: false };
}

// MTs que esta espécie pode usar
export function compatibleTMs(dex) {
  const s = SPECIES[dex];
  if (!s) return [];
  return Object.entries(ITEMS).filter(([, it]) => it.cat === 'tm' && s.tm.includes(it.move)).map(([id]) => id);
}
