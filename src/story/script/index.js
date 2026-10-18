// Índice dos capítulos de Pokémon Alvorada 2D. Formato descrito em docs/historia-completa.md, seção 8.
import cap01 from './cap01.js';
import cap02 from './cap02.js';
import cap03 from './cap03.js';
import cap04 from './cap04.js';
import cap05 from './cap05.js';
import cap06 from './cap06.js';
import cap07 from './cap07.js';
import cap08 from './cap08.js';
import cap09 from './cap09.js';
import cap10 from './cap10.js';
import cap11 from './cap11.js';
import cap12 from './cap12.js';
import regiaoJandaia from './regiao-jandaia.js';

export const CAPITULOS = [cap01, cap02, cap03, cap04, cap05, cap06, cap07, cap08, cap09, cap10, cap11, cap12];
// Treinadores de rota das regiões novas (cenas soltas); entram em JOGAVEIS (roteiro.js)
CAPITULOS.push(regiaoJandaia);

export const capitulo = (n) => CAPITULOS[n - 1] ?? null;

// Procura uma cena pelo id em todos os capítulos
export function cena(id) {
  for (const c of CAPITULOS) {
    const s = c.cenas.find((x) => x.id === id);
    if (s) return { capitulo: c.id, ...s };
  }
  return null;
}

// Troca {jogador}, {inicial}, {rival_inicial}, {hora} no texto
export function preencher(texto, vars = {}) {
  return texto.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
