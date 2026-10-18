import { KINDS } from './objects.js';
import { BUILDINGS } from './buildings.js';
import { MONTARIAS } from '../data/montarias.js';
import { speciesOf } from '../data/species.js';

// Camadas de altura do cenário e quem sobe onde (usado por src/world/vivo.js e pelo combate).
//
// Camadas (de baixo para cima): chão 0 · topo de rocha 1 · copa de árvore 2 · telhado 3.
// Cada objeto que dá para subir tem uma camada e uma altura em px (a altura do "piso" lá em cima, medida
// a partir do chão, no mesmo eixo z das entidades: e.z). A altura sai do tamanho do desenho do objeto.
//
// Quem sobe (perfil de escalada, pela espécie):
//   voa       voadores (tipo Voador, corpo de pássaro ou de inseto voador): pousam em qualquer lugar alto;
//   escala    escaladores e ágeis (montarias "escalar" de src/data/montarias.js, macacos, gatos, lagartixas,
//             insetos leves, ou rápidos e leves): sobem em rocha, copa e telhado pulando;
//   pula      os médios (até PESADO kg): só sobem em rocha e coisas baixas (tronco, fardo, caixote);
//   pesado    a partir de PESADO kg e sem voar: não sobem em nada.

export const CAMADA = { CHAO: 0, ROCHA: 1, COPA: 2, TELHADO: 3 };
export const CAMADA_NOME = ['chao', 'rocha', 'copa', 'telhado'];
export const PESADO = 100; // kg

// árvores (copa), rochas e coisas baixas (topo de rocha); prédios são os de BUILDINGS e os que têm porta
export const ARVORES = new Set(['tree', 'tree2', 'pine', 'pine2', 'autumn', 'pineT', 'bigtree', 'bigautumn', 'ipe', 'paineira', 'jequitiba', 'oran', 'pecha',
  'palm', 'palmSmall', 'snowPine', 'snowPineBig', 'coqueiro', 'palmeira', 'mangue', 'juazeiro', 'umbu', 'araucaria', 'arvoreSelva']);
export const ROCHAS = new Set(['boulder', 'boulder2', 'grayrock', 'obsidianRock', 'lavaRock']);
const BAIXOS = new Set(['log', 'stump', 'haybale', 'crate', 'barrel', 'driftwood']);
const PREDIOS_EXTRA = new Set(['tuxHouse', 'tuxCenter', 'igloo', 'cabin', 'taipa', 'windmill', 'stands', 'beachStall']);
export const isPredio = (kind) => !!BUILDINGS[kind] || PREDIOS_EXTRA.has(kind) || KINDS[kind]?.door !== undefined;

// altura do piso em cima do objeto (px), pela altura do desenho
const H_K = { [CAMADA.ROCHA]: 0.62, [CAMADA.COPA]: 0.62, [CAMADA.TELHADO]: 0.48 };
export function camadaDe(o, texH = 32) {
  const k = o.kind;
  if (isPredio(k)) return { camada: CAMADA.TELHADO, h: Math.round(texH * H_K[CAMADA.TELHADO]) };
  if (ARVORES.has(k)) return { camada: CAMADA.COPA, h: Math.round(texH * H_K[CAMADA.COPA]) };
  if (ROCHAS.has(k)) return { camada: CAMADA.ROCHA, h: Math.round(texH * H_K[CAMADA.ROCHA]) };
  if (BAIXOS.has(k)) return { camada: CAMADA.ROCHA, h: Math.max(8, Math.round(texH * 0.55)) };
  return null;
}

// escaladores à mão (além das montarias "escalar"): macacos, gatos, esquilos, lagartixas, aranhas, ninjas
const ESCALADORES = new Set([
  56, 57, 190, 424, 979, // Mankey, Primeape, Aipom, Ambipom, Annihilape
  52, 53, 300, 301, 431, 432, 509, 510, 570, 571, 677, 678, 863, // gatos (Meowth… Perrserker)
  215, 461, 903, // Sneasel, Weavile, Sneasler
  252, 253, 254, 417, 587, 702, 819, 820, // Treecko, Grovyle, Sceptile, Pachirisu, Emolga, Dedenne, Skwovet, Greedent
  167, 168, 214, 127, 123, 212, 401, 402, // Spinarak, Ariados, Heracross, Pinsir, Scyther, Scizor, Kricketot, Kricketune
  25, 26, 172, 39, 40, 133, 196, 197, 470, 471, // Pikachu, Raichu, Pichu, Jigglypuff, Eevee e evoluções leves
  351, 352, 543, 544, 265, 266, 268, 412, // Castform, Kecleon, Venipede, Wurmple…, Burmy
  204, 205, 714, 715, 761, 762, 763, // Pineco, Forretress, Noibat, Noivern, Bounsweet…
  656, 657, 658, 393, 394, 395, 390, 391, 392, // Froakie (ninjas), Piplup, Chimchar
]);

// Perfil de escalada de um Mon (ou de uma espécie): { voa, escala, pula, pesado, kg }
export function perfilEscalada(mon) {
  if (!mon) return { voa: false, escala: false, pula: false, pesado: true, kg: 999 };
  const sp = mon.sp ?? speciesOf(mon.dex, mon.form) ?? {};
  const types = mon.types ?? sp.types ?? [];
  const kg = sp.weight ?? 20, spe = sp.base?.[5] ?? 50;
  const voa = types.includes('flying') || sp.body === 'bird' || sp.body === 'flyer' || ['levitate'].includes(mon.ability);
  const mt = MONTARIAS[mon.spriteKey] ?? MONTARIAS[mon.dex];
  const pesado = !voa && kg >= PESADO;
  const escala = !voa && !pesado && (mt?.m?.includes('escalar') || ESCALADORES.has(mon.dex) || (types.includes('bug') && kg <= 40) || (spe >= 85 && kg <= 50 && sp.body !== 'fish' && sp.body !== 'serpent'));
  const pula = !voa && !pesado && !escala && sp.body !== 'fish' && sp.body !== 'worm' && kg < PESADO;
  return { voa, escala, pula, pesado, kg };
}

// Pode subir nesta camada?
export function podeSubir(perfil, camada) {
  if (!perfil || camada == null) return false;
  if (perfil.voa) return true;
  if (perfil.escala) return camada >= CAMADA.ROCHA;
  if (perfil.pula) return camada === CAMADA.ROCHA;
  return false;
}
