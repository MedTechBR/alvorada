import { MOVES } from '../data/moves.js';

// Golpes de altura/profundidade usados pelo combate em tempo real. Só entram se os dados
// ainda não tiverem o golpe (o ramo `mecanicas` pode trazer as versões oficiais).
// kind: fly (sobe e mergulha no alvo), dig (cava e sai debaixo do alvo), dive (mergulha na água e emerge)
const EXTRA = {
  fly:  { name: 'Voar', type: 'flying', cat: 'phys', power: 90, kind: 'fly', range: 10, cd: 5 },
  dig:  { name: 'Cavar', type: 'ground', cat: 'phys', power: 80, kind: 'dig', range: 9, cd: 5 },
  dive: { name: 'Mergulho', type: 'water', cat: 'phys', power: 80, kind: 'dive', range: 9, cd: 5 },
};
for (const [k, v] of Object.entries(EXTRA)) if (!MOVES[k]) MOVES[k] = v;
// Feixes contínuos (jato) em vez de vários projéteis
export const BEAMS = {
  flamethrower: { dur: 1.0, width: 7, speed: 560, tick: 0.1, share: 1.45, range: 7.5 },
  hydroPump: { dur: 1.1, width: 10, speed: 600, tick: 0.1, share: 1.55, knock: 1.7, range: 8.5 },
};
