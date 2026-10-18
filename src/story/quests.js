import { ROUTE_TRAINERS, GYM_TRAINERS, LEADER1 } from './chapter1.js';

// Missões do capítulo 1. O objetivo atual é sempre calculado a partir das flags do save,
// então um save antigo (ou um teste que pula etapas) cai direto na missão certa.
// Cada objetivo: { id, title, text, sub?, target?: { x, y } } (alvo em pixels do mundo)

export function hasBadge(flags, id) { return (flags.badges ?? []).includes(id); }
export function beaten(flags, id) { return !!flags.trainers?.[id]; }

export function currentObjective(story) {
  const g = story.g, f = g.flags, S = (n) => story.spots.get(n);
  const npc = (id) => story.npc(id);
  if (!f.starter) {
    if (!f.talkedProf) return { id: 'lab', title: 'O primeiro alvorecer', text: 'Vá ao laboratório do Prof. Jatobá, do outro lado da praça', target: npc('prof') ?? S('lab') };
    return { id: 'starter', title: 'O primeiro alvorecer', text: 'Escolha seu primeiro Pokémon na mesa do laboratório', target: S('starters') };
  }
  if (!f.balls) return { id: 'gift', title: 'O primeiro alvorecer', text: 'Fale com o Prof. Jatobá', target: npc('prof') ?? S('lab') };
  if (!hasBadge(f, 'campina')) {
    const routeDone = ROUTE_TRAINERS.filter((t) => beaten(f, t.id)).length;
    if (!f.campina) {
      return { id: 'route1', title: 'Campos de Lúmen', text: 'Siga a trilha a oeste até a Cidade Campina',
        sub: `Treinadores na trilha: ${routeDone}/${ROUTE_TRAINERS.length}`, target: S('campina') };
    }
    const left = GYM_TRAINERS.filter((t) => !beaten(f, t.id));
    if (left.length) {
      return { id: 'gym1', title: 'Ginásio de Campina', text: 'Vença os aprendizes do ginásio',
        sub: `Aprendizes: ${GYM_TRAINERS.length - left.length}/${GYM_TRAINERS.length}`, target: npc(left[0].id) ?? S('gym') };
    }
    return { id: 'leader1', title: 'Ginásio de Campina', text: 'Desafie o Líder Tomé no fundo da quadra', target: npc(LEADER1.id) ?? S('leader_tome') };
  }
  if (!f.ch1Done) return { id: 'ch1end', title: 'O primeiro alvorecer', text: 'Atenda a chamada do Prof. Jatobá', target: null };
  return { id: 'ch2', title: 'Capítulo 2 (em breve)', text: 'Siga ao norte até o Bosque Sussurrante', sub: 'Insígnias: ' + (f.badges ?? []).length + '/8', target: S('bosque') };
}
