// Toda luta conserva o compositor anterior, inclusive reides e duelos online.
// Um Pokémon apenas acompanhando o jogador não troca a apresentação do mundo.
export function emCombate(g){
 if(g.encontro?.ativo||g.story?.battle&&!g.story.battle.done||g.arenaGinasio?.contem&&!g.arenaGinasio.done||g.tocas?.reide&&!g.tocas.reide.done||g.net?.duel?.active)return true;
 const foco=g.lead?.alive?g.lead:g.player;
 return !!foco&&!!g.wilds?.some(w=>w.alive&&!w.dead&&w.ai?.state==='aggro'&&Math.hypot(w.x-foco.x,w.y-foco.y)<256);
}
