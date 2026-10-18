// Espécies do jogo: dados oficiais importados da PokéAPI (src/data/gen/especies.js, gerado por
// tools/pokeapi/importar.py) + o que é só do jogo (corpo para animação, temperamento, encontros).
//
// Cada espécie: name, types, base [PS, Atq, Def, AtqE, DefE, Vel], evs (EVs dados ao ser derrotado),
// catchRate, baseExp, growth, height (m), weight (kg), genderRate (oitavos de fêmea, −1 = sem gênero),
// friendship (amizade inicial), abilities / hidden (habilidades), evo (evoluções), learn [[nível, golpe]],
// tm e tutor (listas de golpes), body (animação), pmd (tem sprite no PMD SpriteCollab).
// Compatibilidade: `evolve` = primeira evolução por nível ({ level, to }), como no formato antigo.
import { ESPECIES } from './gen/especies.js';
import { expForLevel as expCurve } from '../mechanics/stats.js';

// Corpo usado pela animação procedural (valores escolhidos à mão; os demais vêm do formato da PokéAPI)
const BODY = {"1":"quad","2":"quad","3":"quad","4":"biped","5":"biped","6":"biped","7":"biped","8":"biped","9":"biped","10":"worm","11":"blob","12":"flyer","13":"worm","14":"blob","15":"flyer","16":"bird","17":"bird","19":"quad","20":"quad","21":"bird","25":"biped","41":"flyer","48":"biped","52":"biped","54":"biped","56":"biped","59":"quad","63":"biped","66":"biped","74":"blob","79":"quad","92":"flyer","95":"serpent","123":"biped","129":"fish","130":"serpent","133":"quad","167":"quad","179":"quad","183":"biped","194":"biped","198":"bird","200":"flyer","204":"blob","214":"biped","215":"biped","216":"biped","227":"bird","228":"quad","234":"quad","246":"biped","278":"bird","280":"biped","283":"quad","285":"blob","349":"fish","359":"quad","396":"bird","403":"quad","406":"blob","415":"flyer","417":"quad","418":"biped","422":"worm","425":"flyer","427":"biped","443":"biped","447":"biped","548":"blob","550":"fish","570":"quad","590":"blob","607":"blob","628":"bird","656":"biped","659":"biped","664":"worm","701":"biped","708":"flyer","734":"quad","744":"quad","750":"quad","821":"bird","903":"biped","915":"quad","926":"quad"};

const words = (s) => (s ? s.split(' ') : []);

export const SPECIES = {};
for (const [k, raw] of Object.entries(ESPECIES)) {
  const dex = +k;
  const s = { ...raw, dex, tm: words(raw.tm), tutor: words(raw.tutor), body: BODY[dex] ?? raw.shape, evo: raw.evo ?? [] };
  const byLevel = s.evo.find((e) => e.level && !e.item && !e.friendship && !e.move && !e.moveType && !e.time && !e.gender && !e.rain && !e.partyType);
  if (byLevel) s.evolve = { level: byLevel.level, to: byLevel.to };
  SPECIES[dex] = s;
}

// Comportamento no mapa: timid foge, neutral ignora, aggressive vem para a briga.
const TEMPER_MANUAL = {"3":"neutral","6":"aggressive","9":"neutral","10":"neutral","11":"neutral","12":"timid","13":"neutral","14":"neutral","15":"aggressive","16":"timid","17":"timid","19":"aggressive","20":"aggressive","21":"aggressive","25":"timid","41":"aggressive","48":"neutral","52":"aggressive","54":"neutral","56":"aggressive","59":"aggressive","63":"timid","66":"aggressive","74":"neutral","79":"neutral","92":"aggressive","95":"aggressive","123":"aggressive","129":"neutral","130":"aggressive","133":"timid","167":"aggressive","179":"timid","183":"neutral","194":"neutral","198":"aggressive","200":"neutral","204":"neutral","214":"aggressive","215":"aggressive","216":"aggressive","227":"aggressive","228":"aggressive","234":"timid","246":"neutral","278":"timid","280":"timid","283":"timid","285":"neutral","349":"timid","359":"neutral","396":"timid","403":"aggressive","406":"timid","415":"aggressive","417":"timid","418":"aggressive","422":"neutral","425":"neutral","427":"timid","443":"aggressive","447":"neutral","548":"timid","550":"aggressive","570":"aggressive","590":"neutral","607":"timid","628":"aggressive","656":"timid","659":"timid","664":"neutral","701":"aggressive","708":"aggressive","734":"aggressive","744":"aggressive","750":"neutral","821":"aggressive","903":"aggressive","915":"neutral","926":"neutral"};

// Para as espécies novas: temperamento automático pelos status (forte e lento = briga; rápido e fraco = foge).
function autoTemper(s) {
  const [hp, atk, def, spa, spd, spe] = s.base;
  const power = Math.max(atk, spa), total = hp + atk + def + spa + spd + spe;
  if (s.legendary || s.mythical) return 'neutral';
  if (((s.types.includes('dark') || s.types.includes('dragon')) && power >= 80) || power >= 115 || (total >= 490 && power >= 105)) return 'aggressive';
  if (s.baby || (spe >= power && total < 360) || s.catchRate >= 190 && power < 60) return 'timid';
  return 'neutral';
}
export const TEMPER = {};
for (const s of Object.values(SPECIES)) TEMPER[s.dex] = TEMPER_MANUAL[s.dex] ?? autoTemper(s);

// Pokédex do jogo, em ordem: a de Lumiose primeiro, depois as que vieram de fora.
export const DEX_ORDER = Object.keys(SPECIES).map(Number);

// Quem vive em cada bioma da região: [dex, nívelMín, nívelMáx, peso]. "noite" substitui de 18h às 6h.
export const BIOME_ENCOUNTERS = {
  campo: [[396, 3, 6, 22], [915, 3, 6, 20], [659, 3, 6, 16], [403, 4, 7, 12], [427, 4, 7, 12], [734, 3, 6, 12], [16, 3, 6, 12], [179, 4, 7, 14],
    [52, 4, 7, 10], [417, 5, 7, 8], [821, 4, 6, 12], [926, 4, 6, 10], [25, 5, 7, 5], [133, 5, 7, 3], [280, 6, 8, 3], [63, 6, 8, 3]],
  floresta: [[13, 3, 5, 18], [14, 6, 7, 6], [415, 4, 6, 14], [548, 4, 7, 12], [570, 6, 8, 6], [25, 5, 7, 8], [123, 8, 10, 3], [17, 8, 10, 5],
    [48, 5, 8, 12], [167, 4, 7, 12], [204, 5, 8, 10], [216, 6, 9, 10], [285, 5, 7, 12], [406, 4, 6, 12], [590, 5, 8, 10], [664, 3, 5, 14], [708, 7, 9, 6], [214, 10, 12, 2]],
  margem: [[54, 4, 7, 20], [194, 4, 7, 20], [183, 4, 7, 18], [129, 3, 6, 10], [79, 5, 8, 14], [283, 4, 7, 12], [418, 6, 9, 12], [422, 5, 8, 12],
    [550, 9, 12, 4], [656, 7, 9, 3], [349, 6, 9, 2]],
  planalto: [[234, 10, 13, 20], [750, 12, 14, 12], [17, 10, 12, 14], [59, 14, 16, 3], [903, 13, 15, 4], [628, 14, 16, 4], [123, 10, 12, 6],
    [66, 10, 13, 14], [744, 10, 13, 14], [701, 13, 15, 5], [246, 12, 14, 3], [443, 12, 14, 3], [227, 14, 16, 3], [447, 11, 13, 4]],
  praia: [[194, 5, 7, 20], [54, 5, 7, 20], [129, 4, 6, 18], [130, 15, 18, 2], [278, 5, 8, 22], [422, 5, 8, 16], [418, 6, 9, 10]],
  // biomas só das masmorras (ramo biomas); os do mundo ampliado vêm de BIOMAS_PADRAO (src/data/habitats-biomas.js)
  mina: [[74, 15, 19, 22], [304, 15, 19, 18], [524, 15, 19, 16], [529, 16, 20, 14], [41, 15, 19, 14], [66, 15, 19, 10]],
  templo: [[92, 18, 22, 22], [200, 18, 22, 16], [355, 18, 22, 16], [302, 19, 23, 12], [707, 19, 23, 10], [93, 23, 25, 3]],
};
export const NIGHT_ENCOUNTERS = {
  campo: [[41, 4, 7, 26], [198, 6, 9, 10], [228, 6, 9, 10], [16, 3, 6, 8], [52, 4, 7, 12], [92, 6, 8, 8], [425, 6, 9, 8], [359, 10, 12, 2]],
  floresta: [[92, 6, 9, 18], [200, 7, 10, 12], [425, 6, 9, 10], [607, 5, 8, 12], [41, 5, 8, 16], [198, 7, 10, 10], [167, 5, 8, 12], [708, 7, 10, 10], [570, 7, 9, 6]],
  margem: [[79, 6, 9, 20], [41, 5, 8, 16], [550, 10, 13, 8], [129, 4, 7, 14], [607, 6, 8, 8], [92, 7, 9, 8]],
  planalto: [[215, 12, 14, 16], [228, 12, 14, 16], [41, 10, 12, 16], [198, 12, 14, 12], [359, 14, 16, 4], [744, 11, 13, 10], [246, 12, 14, 4]],
  praia: [[278, 5, 8, 14], [41, 5, 8, 14], [422, 6, 9, 14], [129, 5, 7, 14]],
};


// Altura usada na cena (m): legível para os pequenos, contida para os gigantes.
export function displayHeight(dex) {
  const h = SPECIES[dex]?.height ?? 0.6;
  return Math.min(6.5, Math.max(0.8, h * 1.5 + 0.35)); // Onix ~6,5 m, Charmander ~1,25 m, Rattata ~0,8 m
}

// Curvas de experiência oficiais (conferidas com experience.csv da PokéAPI: 600 de 600 valores batem).
export function expForLevel(growth, n) { return expCurve(growth, n); }

// Todos os golpes que a espécie pode aprender (nível, MT e ensino)
export function learnableMoves(dex) {
  const s = SPECIES[dex];
  if (!s) return [];
  return [...new Set([...s.learn.map(([, id]) => id), ...s.tm, ...s.tutor])];
}
