import { MOVES } from '../../data/moves.js';
import { BEAMS } from '../specialmoves.js';
import fire from './fire.js';
import water from './water.js';
import electric from './electric.js';
import grass from './grass.js';
import ice from './ice.js';
import fighting from './fighting.js';
import poison from './poison.js';
import ground from './ground.js';
import flying from './flying.js';
import psychic from './psychic.js';
import bug from './bug.js';
import rock from './rock.js';
import ghost from './ghost.js';
import dragon from './dragon.js';
import normal from './normal.js';

// Registro das animações por golpe (id -> receita em fases). Golpes que ainda não existem nos dados
// entram com os dados mínimos da receita (o ramo `mecanicas` pode substituí-los pelos oficiais).
export const ANIMS = {};
for (const fam of [fire, water, electric, grass, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, normal]) {
  for (const [id, a] of Object.entries(fam)) {
    if (!a) continue;
    ANIMS[id] = a;
    if (a.data && !MOVES[id]) MOVES[id] = a.data;
    if (a.beam) BEAMS[id] = a.beam;
  }
}
const EMPTY = Object.freeze({});
export const animFor = (id) => ANIMS[id] ?? EMPTY;

// forma de execução: receita > dado do golpe > palpite pela categoria (para golpes oficiais sem "kind")
export function kindOf(id, mv) {
  const a = ANIMS[id];
  if (a?.kind) return a.kind;
  if (mv.kind) return mv.kind;
  if (BEAMS[id]) return 'proj';
  return mv.cat === 'status' ? 'self' : mv.cat === 'phys' ? 'melee' : 'proj';
}
export const ANIM_IDS = Object.keys(ANIMS);
