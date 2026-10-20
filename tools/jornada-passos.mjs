// Passos da jornada clássica (estado ao COMEÇAR cada um), usados por tools/teste-jornada-completa.mjs e
// tools/teste-guia.mjs. Puro dados + flagsDe (flags do save naquele passo).
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const { JORNADA } = await abrir('src/story/jornada/index.js');

// ---------------------------------------------------------------- os passos (estado ao COMEÇAR cada um)
// f: flags do save; caps: montarias liberadas; alvos: o que o passo precisa alcançar; proibidos: o que só abre depois;
// segs: segmentos da história (src/story/jornada) cujas cenas acontecem neste passo; painel: chave esperada em proximoPasso
export const B8 = ['campina', 'sussurro', 'espelho', 'coral', 'lamparina', 'rochedo', 'escarpa', 'mirante'];
export const PASSOS = [
  { id: 'campina', badges: 0, nh: {}, caps: { correr: true }, segs: ['nova00', 'nova01'], painel: 'campina',
    alvos: ['leader_tome', 'g1_icaro', 'g1_rui', 'fazenda_tome', 'r1_caio', 'r1_davi', 'r1_pedro', 'centro_campina'],
    proibidos: ['vila_sussurro', 'estufa_lia', 'toca_absol'] },
  { id: 'sussurro', badges: 1, nh: {}, caps: { correr: true }, segs: ['nova02'], painel: 'sussurro',
    alvos: ['vila_sussurro', 'estufa_lia', 'toca_absol', 'trilha_jequitiba', 'bifurcacao', 'mata_jequitibas', 'r2_marcia', 'r2_otavio'],
    proibidos: ['porto_espelho', 'galpao_barcos'] },
  { id: 'espelho', badges: 2, nh: {}, caps: { correr: true }, segs: ['nova03'], painel: 'espelho',
    alvos: ['porto_espelho', 'galpao_barcos', 'jandira', 'manguezal', 'r3_seu_bigode', 'r3_carol'],
    proibidos: ['cidade_coral', 'farol_coral', 'vila_lamparina'] },
  { id: 'coral', badges: 3, nh: {}, caps: { correr: true, nadar: true }, segs: ['nova04'], painel: 'coral',
    alvos: ['cidade_coral', 'praca_coral', 'farol_coral', 'farol_topo', 'cais_coral', 'r4_kaua', 'r4_sandra'],
    proibidos: ['vila_jandaia', 'templo_raizes_1', 'vila_lamparina', 'casarao_velas'] },
  { id: 'jandaias', badges: 4, nh: {}, caps: { correr: true, nadar: true }, segs: ['nova05'], painel: 'jandaias',
    alvos: ['vila_jandaia', 'templo_raizes_porta', 'templo_raizes_1', 'selva_grande', 'ninho_acampamento_selva'],
    proibidos: ['vila_lamparina', 'casarao_velas', 'cemiterio_velas'] },
  { id: 'lamparina', badges: 4, nh: { teoDuvida: true }, caps: { correr: true, nadar: true }, segs: ['nova06'], painel: 'lamparina',
    alvos: ['vila_lamparina', 'casarao_velas', 'cemiterio_velas', 'benta', 'r5_ofelia', 'r5_guto', 'cemiterio_porta'],
    proibidos: ['cidade_aurora', 'rota6', 'torre_aurora', 'r6_wagner'] },
  { id: 'aurora', badges: 5, nh: { teoDuvida: true }, caps: { correr: true, nadar: true }, segs: [], painel: 'rochedo',
    alvos: ['cidade_aurora', 'torre_aurora', 'r6_wagner', 'r6_yara', 'pipa_aurora', 'aurora_praca'],
    proibidos: ['forte_rochedo', 'roda_capoeira', 'vila_mandacaru', 'cidade_escarpa'] },
  { id: 'mina', badges: 5, nh: { teoDuvida: true, lucioVencido: true, sirene: true }, minaN2: true, caps: { correr: true, nadar: true }, segs: [], painel: 'rochedo',
    alvos: ['mina_aurora_n1', 'mina_aurora_n2', 'mina_aurora_n3', 'mina_aurora_n4'],
    proibidos: ['forte_rochedo', 'roda_capoeira', 'vila_mandacaru'] },
  { id: 'rochedo', badges: 5, nh: { teoDuvida: true, lucioVencido: true, reviravolta1: true }, caps: { correr: true, nadar: true }, segs: ['nova07'], painel: 'rochedo',
    alvos: ['forte_rochedo', 'arquivo_forte', 'roda_capoeira', 'r7_jairo', 'r7_soraia', 'r7_b', 'r7_g'],
    proibidos: ['vila_mandacaru', 'cidade_escarpa', 'mina_velha'] },
  { id: 'sertao', badges: 6, nh: { teoDuvida: true, lucioVencido: true, reviravolta1: true, reviravolta2: true }, caps: { correr: true, nadar: true, escalar: true }, segs: ['nova08'], painel: 'sertao',
    alvos: ['vila_mandacaru', 'sertao_praca_mandacaru', 'sertao_ruinas_entrada', 'ruinas_pintada_1', 'ruinas_pintada_2', 'museu_sertao'],
    proibidos: ['cidade_escarpa', 'mina_velha', 'leader_graca', 'r8_ricardo'] },
  { id: 'escarpa', badges: 6, nh: { teoDuvida: true, lucioVencido: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true }, caps: { correr: true, nadar: true, escalar: true }, segs: ['nova09'], painel: 'escarpa',
    alvos: ['paredao_base', 'r8_ricardo', 'r8_lena', 'cidade_escarpa', 'mina_velha', 'cova_paredao'],
    proibidos: ['vila_termas', 'ilha_basalto', 'templo_chama_1', 'mirante_ventos', 'torre_vento'] },
  { id: 'brasas', badges: 7, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true }, caps: { correr: true, nadar: true, escalar: true, voar: true }, segs: ['nova10'], painel: 'brasas',
    alvos: ['vila_termas', 'ilha_basalto', 'vulcao_ticao', 'templo_chama_1', 'casa_vulcanologa'],
    proibidos: ['mirante_ventos', 'torre_vento', 'relogio_pedra', 'camara_coracao'] },
  { id: 'mirante', badges: 7, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true }, brasas: true, caps: { correr: true, nadar: true, escalar: true, voar: true }, segs: ['nova11'], painel: 'mirante',
    alvos: ['mirante_ventos', 'torre_vento', 'r9_a', 'r9_b', 'r11_a', 'ruinas_vigias', 'estepe_inicio'],
    proibidos: ['relogio_pedra', 'camara_coracao', 'vila_geada', 'portao_liga'] },
  { id: 'relogio', badges: 8, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true, reviravolta5: true }, brasas: true, caps: { correr: true, nadar: true, escalar: true, voar: true, mergulhar: true }, segs: ['nova12'], painel: 'relogio',
    alvos: ['relogio_pedra', 'camara_coracao', 'vig1', 'vig2', 'escadaria_base'],
    proibidos: ['vila_geada', 'geada_entrada_oeste', 'caverna_gelo_1', 'portao_liga'] },
  { id: 'geada', badges: 8, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true, reviravolta5: true, seloFechado: true }, brasas: true, relogio: true, caps: { correr: true, nadar: true, escalar: true, voar: true, mergulhar: true }, segs: ['nova13'], painel: 'geada',
    alvos: ['geada_entrada_oeste', 'ninho_vila_geada', 'caverna_gelo_1', 'caverna_gelo_3', 'cume_vento_branco', 'ninho_cume'],
    proibidos: ['portao_liga', 'sala_madrugada', 'salao_campea', 'ninho_liga_zenite'] },
  { id: 'liga', badges: 8, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true, reviravolta5: true, seloFechado: true, teoFinalPronto: true }, brasas: true, relogio: true, geada: true, caps: { correr: true, nadar: true, escalar: true, voar: true, mergulhar: true }, segs: ['nova14'], painel: 'liga',
    alvos: ['zenite_entrada', 'r12_sonia', 'r12_osvaldo', 'portao_liga', 'sala_madrugada', 'sala_manha', 'sala_meio_dia', 'sala_entardecer', 'salao_campea'],
    proibidos: ['ilha_farol_morto', 'estacao_austral', 'mar_do_sul'] },
];

// treinadores já vencidos ao fim de cada passo: os das batalhas dos segmentos até ele (inclusive), os de Campina
// (src/story/chapter1.js) e os das cenas mantidas da rota; abrem as porteiras e os portões dos ginásios
const { GYM_TRAINERS, ROUTE_TRAINERS } = await abrir('src/story/chapter1.js');
export const batalhasAte = (i) => {
  const ids = [...GYM_TRAINERS, ...ROUTE_TRAINERS].map((t) => t.id);
  for (const P of PASSOS.slice(0, i + 1)) for (const sid of P.segs) for (const c of JORNADA.find((s) => s.id === sid)?.cenas ?? []) if (c.depois?.batalha) ids.push(c.depois.batalha.id);
  return Object.fromEntries(ids.map((id) => [id, true]));
};
export const flagsDe = (P, i = PASSOS.indexOf(P)) => {
  const f = { balls: true, starter: 4, badges: B8.slice(0, P.badges), nh: { ...P.nh }, trainers: batalhasAte(i) };
  if (P.minaN2 || i > PASSOS.findIndex((q) => q.id === 'mina')) f.minaN2 = true;
  if (P.brasas) f.brasas_resolvido = true;
  if (P.relogio) f.relogio_vencido = true;
  if (P.geada) f.geada_vencida = true;
  if (P.liga) f.liga_campeao = true;
  return f;
};

