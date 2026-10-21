// Reserva única por adversário: golpes, drenagem, absorção e regeneração dividem a mesma cura.
// Guardada no Mon, para recolher/trocar a entidade não renovar a reserva. Aliados e PvP mantêm suas regras.
const gastos = new WeakMap();
export function reservaCura(e) {
  if (!e?.mon || e.pvp || !['wild', 'foe'].includes(e.side)) return Infinity;
  return Math.max(0, Math.floor(e.mon.stats.hp * 0.3) - (gastos.get(e.mon) ?? 0));
}
export function curaPermitida(e, quantidade) {
  const hp = Math.max(0, Math.min(Math.floor(quantidade), reservaCura(e)));
  if (e?.mon && Number.isFinite(reservaCura(e))) gastos.set(e.mon, (gastos.get(e.mon) ?? 0) + hp);
  return hp;
}
export function curar(e, quantidade) {
  const m = e.mon, hp = curaPermitida(e, Math.min(quantidade, Math.max(0, m.stats.hp - m.hp)));
  m.hp += hp; return hp;
}
