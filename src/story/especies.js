import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { Mon } from '../data/mon.js';

// Rede de segurança para espécies e golpes do roteiro que não existam em src/data (ou sem sprite em assets/pmd):
// o motor troca por um parecido do mesmo tipo. Com as mecânicas oficiais (448 espécies, 600 golpes) todas as
// equipes dos capítulos 2 e 3 existem e entram como estão; a tabela só vale se algo faltar no futuro.
export const SUBST_ESPECIE = {
  819: 734, // Skwovet (Normal) → Yungoos
  546: 548, // Cottonee (Planta/Fada) → Petilil
  731: 21,  // Pikipek (Normal/Voador) → Spearow
  290: 204, // Nincada (Inseto/Terra) → Pineco
  168: 15,  // Ariados (Inseto/Veneno) → Beedrill
  401: 10,  // Kricketot (Inseto) → Caterpie
  595: 13,  // Joltik (Inseto/Elétrico) → Weedle
  339: 194, // Barboach (Água/Terra) → Wooper
  580: 278, // Ducklett (Água/Voador) → Wingull
  302: 200, // Sableye (Sombrio/Fantasma) → Misdreavus
  749: 750, // Mudbray → Mudsdale (só para mostrar a montaria)
};
export const SUBST_GOLPE = {
  echoedVoice: 'furyAttack', nightShade: 'astonish', leechLife: 'absorb', struggleBug: 'bugBite', bide: 'harden',
  sweetScent: 'growth', watersport: 'mudSport', defog: 'whirlwind', flail: 'tackle', amnesia: 'withdraw',
  rollout: 'tackle', yawn: 'growl', headbutt: 'stomp', detect: 'doubleTeam',
};

let disponiveis = null; // espécies com sprite (assets/pmd/index.json), lido pelo main.js em game.available
export function setDisponiveis(list) { disponiveis = list ? new Set(list) : null; }
const temSprite = (d) => !disponiveis || disponiveis.has(d);
const existe = (d) => !!SPECIES[d] && temSprite(d);

// Espécie que o jogo consegue mostrar: a original, a substituta da tabela ou a mais parecida do mesmo tipo
export function especie(dex) {
  if (existe(dex)) return dex;
  const s = SUBST_ESPECIE[dex];
  if (s && existe(s)) return s;
  const tipo = SPECIES[dex]?.types?.[0];
  const cands = Object.keys(SPECIES).map(Number).filter((d) => existe(d) && (!tipo || SPECIES[d].types[0] === tipo));
  if (!cands.length) return 25;
  return cands.reduce((a, b) => (Math.abs(b - dex) < Math.abs(a - dex) ? b : a));
}

export function golpes(lista, dex, nivel) {
  const out = [];
  for (const id of lista ?? []) {
    const g = MOVES[id] ? id : SUBST_GOLPE[id];
    if (g && MOVES[g] && !out.includes(g)) out.push(g);
  }
  if (out.length < 2) for (const id of Mon.defaultMoves(dex, nivel)) if (!out.includes(id) && out.length < 4) out.push(id);
  return out.slice(0, 4);
}

// [dex, nível, golpes?] do roteiro → Mon pronto para a batalha. `rival` = flags.rivalStarter (linha do Téo).
export function montarEquipe(equipe, rival = 7) {
  return equipe.map(([dex, nivel, mv]) => {
    let d = dex;
    if (typeof d === 'string' && d.startsWith('rival:')) d = (rival ?? 7) + (+d.slice(6) - 1);
    const real = especie(d);
    return new Mon(real, nivel, { moves: golpes(mv, real, nivel), shiny: false });
  });
}

// Nome para a tela: troca o nome da espécie original pelo da substituta ("Ariados Alfa" → "Beedrill Alfa")
export function nomeBatalha(nome, equipe) {
  let out = nome;
  for (const [dex] of equipe) {
    if (typeof dex !== 'number' || existe(dex)) continue;
    const orig = SPECIES[dex]?.name ?? NOMES_FALTANDO[dex];
    if (orig && out.includes(orig)) out = out.replace(orig, SPECIES[especie(dex)]?.name ?? orig);
  }
  return out;
}
const NOMES_FALTANDO = { 168: 'Ariados', 819: 'Skwovet', 546: 'Cottonee', 731: 'Pikipek', 290: 'Nincada', 401: 'Kricketot', 595: 'Joltik', 339: 'Barboach', 580: 'Ducklett', 302: 'Sableye', 749: 'Mudbray', 131: 'Lapras' };
