// Esta etapa vale para selvagens e para o Téo; ginásios, outros treinadores e PvP conservam o ritmo.
export function combateFluido(g, e) {
  if (!e || e.pvp || e.remote || g.arenaGinasio?.contem || g.tocas?.reide) return false;
  const b = g.story?.battle;
  if (b && !b.done) return /^(nh_)?rival\d*$/.test(b.def?.id ?? '') && ['ally', 'foe'].includes(e.side);
  if (e.side === 'wild') return e.ai?.state === 'aggro' && e.aggroTarget?.side === 'ally';
  return e.side === 'ally' && (g.wilds ?? []).some(w => w.alive && w.ai?.state === 'aggro' && w.aggroTarget === e);
}

export const golpeLeve = (mv) => mv?.cat !== 'status' && mv?.power > 0 && mv.power <= 50 && !mv.hits;
