import { effectiveness } from '../data/types.js';
import { TILE, T } from '../world/tiles.js';

// Ponto ÚNICO de cálculo de dano. O ramo `mecanicas` pode trocar esta função inteira pela
// fórmula oficial: a assinatura é computeDamage(user, target, mv, ctx) -> { dmg, eff, crit, mult, note }.
// ctx: { g, power (substitui mv.power), scale (fração do golpe, p.ex. um tique de feixe) }

export const DMG = 0.34; // ritmo do tempo real: lutas de 10 a 40 s contra selvagens do mesmo nível

export function computeDamage(user, target, mv, ctx = {}) {
  const L = user.mon.level, phys = mv.cat === 'phys';
  const A = phys ? user.stat('atk') : user.stat('spa'), D = phys ? target.stat('def') : target.stat('spd');
  const power = ctx.power ?? mv.power ?? 40;
  const critStage = (mv.critUp ?? 0) + ((user.critBoost ?? 0) > 0 ? 2 : 0);
  const rnd = ctx.rnd ?? Math.random;
  const crit = !ctx.noCrit && rnd() < [1 / 16, 1 / 8, 1 / 2, 1][Math.min(3, critStage)];
  let dmg = Math.floor(Math.floor((Math.floor((2 * L) / 5 + 2) * power * A) / D) / 50) + 2;
  const eff = effectiveness(mv.type, target.mon.types);
  if (user.mon.types.includes(mv.type)) dmg *= 1.5;
  const tm = terrainMod(user, target, mv, ctx.g);
  dmg *= eff * (crit ? 1.5 : 1) * (0.85 + rnd() * 0.15) * DMG * tm.mult * (ctx.scale ?? 1);
  if (phys && user.mon.status === 'brn') dmg *= 0.5;
  dmg = eff === 0 ? 0 : Math.max(1, Math.round(dmg));
  return { dmg, eff, crit, mult: tm.mult, note: tm.note };
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
