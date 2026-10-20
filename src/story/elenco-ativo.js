// Elenco que o motor de roteiro põe no mapa com a história nova ligada (src/story/roteiro.js).
// Junta o elenco do mapa (src/story/elenco.js: posições, lojas, treinadores de rota, moradores) com o da história
// nova (src/story/jornada: ELENCO_JORNADA, montado das cenas). Regra: UMA definição por id e uma pessoa por papel.
//   - ids que existem nos dois (treinadores e aprendizes que o construtor das cidades já pôs no mapa): fica a POSIÇÃO
//     do elenco do mapa (spot, visão, falas depois de vencido) e o resto (nome, visual) da história nova;
//   - personagem fixo que a história nova recria com outro id (líder no ginásio, morador): fica o do mapa, com a fala
//     padrão nova (FUNDIR abaixo); o da história nova sai;
//   - do elenco do mapa saem os atores das cenas dos capítulos antigos (campo `cena`) e os que dependiam das flags
//     antigas (`mostrar`): essas cenas não tocam mais.
import { ELENCO } from './elenco.js';
import { ELENCO_JORNADA } from './jornada/index.js';

// id da história nova → id do elenco do mapa que faz o mesmo papel (null: o story.js já põe essa pessoa no mapa)
export const FUNDIR = {
  tome_ginasio: null, lia_estufa: 'lia', tito_vila: 'tito', jandira_porto: 'jandira', marina_galpao_lider: 'marina_galpao',
  nestor_porto: 'nestor', iracema_farol: 'iracema', jonas_ginasio: 'jonas', benta_vila: 'benta', zelia_casarao: 'zelia',
  bras_roda: 'leader_bras', graca_mina: 'leader_graca', celeste_torre: 'leader_celeste',
  aurelio_liga: 'elite_aurelio', clarice_liga: 'elite_clarice', brasa_liga: 'elite_brasa', ibere_liga: 'elite_ibere', dalva_liga: 'campea_dalva',
};
// do elenco do mapa: segundas cópias de líderes fora do ginásio (a história nova fala com o líder do ginásio)
const SAEM = new Set(['bras_forte', 'graca_escarpa', 'teo_marco']);
// Elite e Campeã lutam por conversa (cena "falar"), não por visão
const MOSTRAR_ANTIGO = new Set(['pipa_cidade', 'pipa_redacao', 'lucio_elevador', 'teo_mina', 'heitor_mina', 'heitor_torre', 'duskull_solano', 'marina_pier']);
const SEM_VISAO = new Set(['elite_aurelio', 'elite_clarice', 'elite_brasa', 'elite_ibere', 'campea_dalva']);

export function montarElencoAtivo(antigo = ELENCO, novo = ELENCO_JORNADA) {
  const novoPorId = new Map(novo.map((e) => [e.id, e]));
  const padraoNovo = new Map();
  for (const e of novo) if (e.id in FUNDIR && FUNDIR[e.id] && e.padrao) padraoNovo.set(FUNDIR[e.id], e.padrao);
  const out = [];
  const vistos = new Set();
  for (const e of antigo) {
    if (SAEM.has(e.id)) continue;
    if (e.cena?.length) continue; // ator de cena de capítulo antigo
    let x = { ...e };
    if (x.id === 'marina_galpao') delete x.mostrar; // a Marina fica no galpão o tempo todo
    if (x.mostrar && MOSTRAR_ANTIGO.has(x.id)) continue; // dependia das flags antigas dos capítulos
    delete x.cap;
    if (SEM_VISAO.has(x.id)) delete x.visao;
    const n = novoPorId.get(x.id);
    if (n) x = { ...n, spot: e.spot ?? n.spot, visao: e.visao ?? n.visao, apos: n.apos ?? e.apos, ...(e.substitui ? { substitui: e.substitui } : {}) };
    if (padraoNovo.has(x.id)) x.padrao = padraoNovo.get(x.id);
    out.push(x); vistos.add(x.id);
  }
  for (const e of novo) {
    if (vistos.has(e.id) || e.id in FUNDIR) continue;
    out.push(e); vistos.add(e.id);
  }
  return out;
}

export const ELENCO_ATIVO = montarElencoAtivo();
