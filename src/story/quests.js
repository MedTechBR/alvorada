import { ROUTE_TRAINERS, GYM_TRAINERS, LEADER1 } from './chapter1.js';

// Objetivo do painel. Antes do primeiro Pokémon: a abertura em Vila Alvorada (jornada "O primeiro alvorecer").
// Depois: o próximo passo da ordem dos ginásios (src/story/progressao.js, via roteiro.objective). A jornada de Cidade Campina é conduzida aqui (story.js), as outras pelo roteiro.
// O objetivo é sempre calculado a partir das flags do save, então um save antigo (ou um teste que pula etapas)
// cai direto na etapa certa. Cada objetivo: { id, title, text, sub?, target?: { x, y } } (alvo em pixels do mundo)

export function hasBadge(flags, id) { return (flags.badges ?? []).includes(id); }
export function beaten(flags, id) { return !!flags.trainers?.[id]; }

// Cidade Campina: Rota 1, aprendizes e o Líder Tomé (null depois da insígnia)
export function objetivoCampina(story) {
  const f = story.g.flags, S = (n) => story.spots.get(n), npc = (id) => story.npc(id);
  if (hasBadge(f, 'campina')) return null;
  if (!f.campina) {
    const routeDone = ROUTE_TRAINERS.filter((t) => beaten(f, t.id)).length;
    return { id: 'route1', text: 'Siga a trilha a oeste até a Cidade Campina', sub: `Treinadores na trilha: ${routeDone}/${ROUTE_TRAINERS.length}`, target: S('campina') };
  }
  // a Crepúsculo na Fazenda do Tomé (src/story/jornada/01-campina.js): o painel manda lá primeiro (o Tomé luta mesmo assim)
  if (f.nh?.chegouCampina && !f.nh?.ebanoCampina) return { id: 'fazenda1', text: 'Vá à Fazenda do Tomé, ao norte da cidade, e veja o que os recrutas querem', target: S('fazenda_tome') };
  const left = GYM_TRAINERS.filter((t) => !beaten(f, t.id));
  if (left.length) return { id: 'gym1', text: 'Vença os aprendizes do ginásio', sub: `Aprendizes: ${GYM_TRAINERS.length - left.length}/${GYM_TRAINERS.length}`, target: npc(left[0].id) ?? S('gym') };
  return { id: 'leader1', text: 'Desafie o Líder Tomé no fundo da quadra', target: npc(LEADER1.id) ?? S('leader_tome') };
}

export function currentObjective(story) {
  const f = story.g.flags, S = (n) => story.spots.get(n);
  const npc = (id) => story.npc(id);
  if (!f.starter) {
    if (!f.talkedProf) return { id: 'lab', title: 'O primeiro alvorecer', text: 'Vá ao laboratório do Prof. Jatobá, do outro lado da praça', target: npc('prof') ?? S('lab') };
    return { id: 'starter', title: 'O primeiro alvorecer', text: 'Escolha seu primeiro Pokémon na mesa do laboratório', target: S('starters') };
  }
  if (!f.balls) return { id: 'gift', title: 'O primeiro alvorecer', text: 'Fale com o Prof. Jatobá', target: npc('prof') ?? S('lab') };
  return story.roteiro?.objective({ campina: () => objetivoCampina(story) }) ?? null;
}
