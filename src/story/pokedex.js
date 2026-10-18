// Pokédex regional de Alvorada: mistura gerações, na ordem em que o jogador encontra cada um.
// Usa só espécies de src/data/species.js (quem ainda não tem sprite aparece como silhueta).
import { SPECIES } from '../data/species.js';

export const ALVORADA_DEX = [
  // Iniciais do Prof. Jatobá
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  // Campos de Lúmen
  396, 821, 16, 17, 21, 915, 659, 734, 19, 20, 427, 52, 926, 403, 179, 417, 25, 133, 280, 63,
  // Bosque Sussurrante
  10, 11, 12, 13, 14, 15, 664, 415, 167, 48, 204, 548, 406, 285, 590, 216, 570, 708, 123, 214,
  // Lago Espelho e Costa Coral
  54, 194, 183, 79, 283, 418, 422, 656, 129, 130, 349, 550, 278,
  // Só de noite
  41, 92, 198, 200, 425, 607, 228, 359,
  // Paredão e Planalto dos Ventos
  56, 66, 447, 701, 74, 744, 95, 246, 443, 234, 750, 59, 628, 227, 215, 903,
].filter((d) => SPECIES[d]);

// Número regional (1, 2, 3…) de uma espécie, ou null se ela não for de Alvorada
export function regionalNumber(dex) {
  const i = ALVORADA_DEX.indexOf(dex);
  return i < 0 ? null : i + 1;
}
