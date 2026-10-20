// História nova ("Pokémon Alvorada", nova jornada clássica): docs/jornada-classica.md e docs/jornada-roteiro.md.
//
// LIGADA (2026-10-20): src/story/roteiro.js roda [mantidas, regiões, ...JORNADA]; o elenco do mapa vem de
// src/story/elenco-ativo.js (elenco.js + ELENCO_JORNADA, um por id); as jornadas do painel estão em jornadas.js; a ordem
// e as barreiras foram conferidas por tools/teste-jornada-completa.mjs. O roteiro de como ligar fica abaixo, como registro.
// COMO LIGAR (feito):
//   1. Importar { JORNADA, ELENCO_JORNADA } deste arquivo.
//   2. Trocar a lista de capítulos do motor: this.caps = [TRAMA, ...JORNADA] (no lugar de [TRAMA, ...CAPITULOS...]).
//      O motor já lê cenas por gatilho (não por ordem da lista); a ordem obrigatória do jogo vem dos
//      gatilhos (badges.X, trainers.X e flags nh.*) e das barreiras, não desta lista.
//   3. Acrescentar ELENCO_JORNADA ao ELENCO de src/story/elenco.js (ELENCO.push(...ELENCO_JORNADA)). Cada ator já
//      traz `cena` (quando só aparece numa cena), `spot`, `look`, `visao` (treinador) e `padrao`.
//   4. Os capítulos antigos (cap02–cap12, trama.js, regiao-jandaia.js, regiao-brasas.js) não devem tocar ao mesmo
//      tempo: quando esta jornada for ligada, tirar do JOGAVEIS e do CAPITULOS os que ela substitui.
//   5. Cada segmento usa `jornada: '<id>'` (alvorada, campina, sussurro, espelho, coral, jandaias, lamparina,
//      aurora, sertao, escarpa, brasas, mirante, relogio, geada, liga, posjogo). Confirmar esses ids em jornadas.js
//      antes de ligar (as jornadas de região — jandaias, sertao, brasas, geada — ainda não existem lá).
//   6. Pontos do mapa que faltam (lista em tools/teste-jornada.mjs, PONTOS_A_CRIAR): o mapa (solidos) cria os
//      nomes; até lá, esses atores e gatilhos não funcionam.
//
// Cada segmento é um arquivo: 00-alvorada.js … 14-liga.js e pos-jogo.js. Cada um exporta um objeto
// { id, jornada, titulo, sol, cenas: [...] }. Uma cena tem: id (único no jogo), gatilho, falas, depois
// (batalha, flags, insignia, montaria, objetivo, ambiente, fimJornada...), atores (opcional) e secundaria
// (missão secundária: texto do diário, sem tocar o painel principal).
import s00 from './00-alvorada.js';
import s01 from './01-campina.js';
import s02 from './02-sussurro.js';
import s03 from './03-espelho.js';
import s04 from './04-coral.js';
import s05 from './05-jandaias.js';
import s06 from './06-lamparina.js';
import s07 from './07-aurora.js';
import s08 from './08-sertao.js';
import s09 from './09-escarpa.js';
import s10 from './10-brasas.js';
import s11 from './11-mirante.js';
import s12 from './12-relogio.js';
import s13 from './13-geada.js';
import s14 from './14-liga.js';
import sPJ from './pos-jogo.js';

// Ordem de leitura (a ordem do jogo vem dos gatilhos, veja o README acima)
export const JORNADA = [s00, s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, sPJ];

// Elenco da jornada: une os atores de todas as cenas pelo id. Um ator que aparece em mais de uma cena fica visível em
// todas elas; se algum deles for permanente (líder, treinador com visão, morador de cidade), fica sempre no mapa.
export function montarElenco(jornadas = JORNADA) {
  const porId = new Map();
  for (const seg of jornadas) for (const cena of seg.cenas) for (const a of cena.atores ?? []) {
    const { cena: _c, permanente, ...base } = a;
    const cenaLista = [...(Array.isArray(a.cena) ? a.cena : a.cena ? [a.cena] : [])];
    const ator = porId.get(a.id) ?? { ...base, _permanente: false, _cenas: new Set() };
    if (permanente || a.visao) ator._permanente = true;
    for (const c of cenaLista) ator._cenas.add(c);
    if (!cenaLista.length && !permanente && !a.visao) ator._cenas.add(cena.id);
    // primeiro ator com o mesmo id ganha os campos (nome, look, spot...); os demais só acrescentam cenas
    if (!porId.has(a.id)) porId.set(a.id, ator);
  }
  return [...porId.values()].map(({ _permanente, _cenas, ...e }) => {
    const out = { ...e };
    if (!_permanente && _cenas.size) out.cena = [..._cenas];
    return out;
  });
}

export const ELENCO_JORNADA = montarElenco(JORNADA);

// Lista plana de todas as cenas (usada pelo teste e para conferir ids)
export const CENAS = JORNADA.flatMap((seg) => seg.cenas.map((c) => ({ ...c, capitulo: seg.id, jornadaSeg: seg.jornada })));
