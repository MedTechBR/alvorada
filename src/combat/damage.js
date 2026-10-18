import { calcDamage as officialDamage, resolveHit } from '../mechanics/damage.js';
import { TILE, T } from '../world/tiles.js';

// Ponto ÚNICO de cálculo de dano: a fórmula oficial (src/mechanics/damage.js, sem PixiJS, a mesma do árbitro do
// PvP) × o ritmo do tempo real (DMG) × o relevo (terrainMod) × a fração do golpe (ctx.scale, ex.: um tique de feixe).
// computeDamage(user, target, mv, ctx) -> { dmg, eff, crit, mult, note, r }  (r = resultado completo da mecânica)
// ctx: { g, power (substitui mv.power), scale, noCrit, rnd }. Com ctx.g (combate local) também gasta itens e frutas.

export const DMG = 0.34; // ritmo do tempo real: lutas de 10 a 40 s contra selvagens do mesmo nível

export function computeDamage(user, target, mv, ctx = {}) {
  const tm = terrainMod(user, target, mv, ctx.g);
  const m = ctx.power != null ? { ...mv, power: ctx.power, count: 1, hits: 1 } : mv;
  const opts = { rng: ctx.rnd ?? Math.random, pace: DMG * tm.mult * (ctx.scale ?? 1) };
  if (ctx.noCrit) opts.crit = false;
  const r = (ctx.g ? resolveHit : officialDamage)(user, target, m, opts);
  const dmg = r.immune ? 0 : r.damage;
  return { dmg, eff: r.eff, crit: r.crit, mult: tm.mult, note: tm.note ?? r.notes[0] ?? null, r };
}

// Relevo: água fortalece golpes de Água (e Elétrico em quem está molhado), mato alto fortalece Planta,
// fogo perde força em quem está na água.
export function terrainMod(user, target, mv, g) {
  if (!g?.map) return { mult: 1, note: null };
  const at = (e) => g.map.at(Math.floor(e.x / T), Math.floor(e.y / T));
  const wet = (e) => { const t = at(e); return t === TILE.WATER || t === TILE.DEEP || e.alt?.mode === 'dive'; };
  let mult = 1, note = null;
  if (mv.type === 'water' && (wet(user) || nearWater(g, user))) { mult *= 1.5; note = 'água'; }
  if (mv.type === 'grass' && at(user) === TILE.TALL) { mult *= 1.3; note = 'mato'; }
  if (mv.type === 'electric' && wet(target)) { mult *= 1.4; note = 'molhado'; }
  if (mv.type === 'fire' && wet(target)) { mult *= 0.5; note = 'apagou'; }
  return { mult, note };
}
export function nearWater(g, e, r = 1) {
  const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const t = g.map.at(tx + i, ty + j); if (t === TILE.WATER || t === TILE.DEEP) return true; }
  return false;
}
