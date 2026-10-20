// Regras compartilhadas da auditoria e do ajuste de biomas (tools/auditar-biomas.mjs, tools/ajustar-biomas.mjs).
// Fonte única de: tipos que combinam com cada bioma, bioma de cada área, segmento da ordem do jogo
// (docs/jornada-classica.md, seção 2) e faixa de nível de cada segmento.

// Tipos que combinam com cada bioma (qualquer tipo da espécie basta). Espécies com tipo fora da lista são "fora de lugar".
export const TIPOS_POR_BIOMA = {
  campo: ['normal', 'grass', 'bug', 'flying', 'fairy', 'electric'],
  floresta: ['grass', 'bug', 'normal', 'flying', 'poison', 'fairy'],
  selva: ['grass', 'bug', 'flying', 'poison', 'normal', 'fighting'],
  margem: ['water', 'grass', 'bug', 'normal', 'poison', 'ground', 'flying'],
  praia: ['water', 'flying', 'electric', 'ground', 'rock', 'normal'],
  mar: ['water', 'ice', 'flying', 'dragon', 'dark'],
  recife: ['water', 'rock', 'fairy', 'bug'],
  abismo: ['water', 'dark', 'dragon', 'ghost', 'poison'],
  brejo: ['water', 'poison', 'ghost', 'ground', 'bug', 'grass'],
  mangue: ['water', 'grass', 'poison', 'ground', 'bug'],
  termal: ['fire', 'water', 'ground', 'rock', 'psychic', 'steel'],
  vulcao: ['fire', 'rock', 'ground', 'steel', 'dark', 'dragon'],
  cratera: ['fire', 'rock', 'ground', 'steel', 'ghost', 'dark'],
  sertao: ['ground', 'rock', 'normal', 'bug', 'fire', 'grass', 'poison'],
  deserto: ['ground', 'rock', 'fire', 'grass', 'bug', 'normal', 'steel'],
  canion: ['rock', 'ground', 'fighting', 'fire', 'normal', 'bug', 'steel', 'dragon'],
  salar: ['ground', 'electric', 'rock', 'normal', 'steel'],
  pampa: ['normal', 'grass', 'flying', 'fighting', 'ground', 'bug'],
  planalto: ['flying', 'rock', 'normal', 'ground', 'steel', 'dragon', 'electric'],
  pico: ['rock', 'ice', 'flying', 'dragon', 'steel', 'dark', 'fighting'],
  neve: ['ice', 'water', 'steel', 'fairy', 'psychic'],
  gelo: ['ice', 'rock', 'water', 'steel', 'dark', 'ghost', 'psychic', 'fairy'],
  cristal: ['psychic', 'rock', 'fairy', 'steel', 'ghost', 'dragon'],
  ruina: ['ghost', 'rock', 'ground', 'psychic', 'dark', 'steel', 'normal'],
  caverna: ['rock', 'ground', 'dark', 'poison', 'steel'],
  vila: ['normal', 'electric', 'steel', 'fairy', 'psychic', 'poison', 'grass'],
  cemiterio: ['ghost', 'dark', 'poison', 'psychic', 'normal'],
};

// Exceções curadas por espécie (fora do tipo): morcegos fazem parte das cavernas.
export const EXTRA_POR_BIOMA = {
  caverna: [41, 42, 169, 527, 528, 714, 715], gelo: [41, 42, 169, 527, 528, 714, 715], // Zubat, Golbat, Crobat, Woobat, Swoobat, Noibat, Noivern
};

// Espécies que se encaixam mesmo sem o tipo do bioma (exceção pontual, com motivo)
export const PERMITIDO_EXTRA = {
  gruta_mare: ['water'], gruta_mare_2: ['water'], // gruta da maré: entra água do mar (Krabby, Shellder)
  templo_mares_1: ['dragon'], // alfa da missão (Dragalge, dragão marinho): mantido, o templo é à beira-mar
};

// Nome da área -> bioma (primeiro que bater; sem acento, minúsculo). Vale antes do bioma do mapa.
export const REGRAS_NOME = [
  [/caverna de gelo|caverna.*iceberg|lago congelado|glaciar/, 'gelo'],
  [/geleira|campos de gelo/, 'neve'],
  [/cemiterio|ilha do veu/, 'cemiterio'],
  [/canion/, 'canion'],
  [/cratera (da )?estrela/, 'deserto'],
  [/vulcao|ticao|chama|sentinela|sol nascente|campos de cinza|basalto/, 'vulcao'],
  [/cratera/, 'cratera'],
  [/fontes termais|termal/, 'termal'],
  [/salar/, 'salar'],
  [/dunas|deserto/, 'deserto'],
  [/\bmangue\b|delta/, 'mangue'],
  [/brejo|pantanal/, 'brejo'],
  [/recife|mares/, 'recife'],
  [/fenda prismatica/, 'cristal'],
  [/pampa|coxilha/, 'pampa'],
  [/ruina/, 'ruina'],
  [/^ilha jandaia|raizes|selva/, 'selva'],
  [/praia|restinga|ilha miragem|ilhas gemeas/, 'praia'],
  [/planalto|paredao|ventos/, 'planalto'],
  [/floresta|bosque|mata |jequitibas|araucarias/, 'floresta'],
  [/^(cachoeira|cataratas|lagoa|lago |oasis)/, 'margem'],
  [/^(mar |fiorde)/, 'mar'],
];
// Sem regra de nome para cavernas e santuários: o rótulo do mapa manda nesses casos.
// Lugares que a regra de nome não cobre (ex.: Rota 15 é neve no mapa da Geada) usam o rótulo do arquivo da região.

// Bioma pelo chão do mapa (contagem de tiles dentro do retângulo da área). Usado na conferência.
export const BIOMA_POR_TILE = {
  water: 'margem', shallow: 'margem', tide: 'praia', wetsand: 'praia', deep: 'mar', reef: 'recife', dock: null,
  sand: 'praia', dune: 'deserto', quicksand: 'deserto', salt: 'salar',
  snow: 'neve', snowfield: 'neve', tallsnow: 'neve', deepsnow: 'neve', frozen: 'gelo', ice: 'gelo', icewall: 'gelo',
  ash: 'cratera', obsidian: 'vulcao', basalt: 'vulcao',
  cracked: 'sertao', caatinga: 'sertao', talldry: 'sertao', canyon: 'canion', redrock: 'canion', dryriver: 'canion',
  oldstone: 'ruina', mud: 'brejo', mangmud: 'mangue', reed: 'brejo', roots: 'mangue',
  forest: 'floresta', tall: 'campo', grass: 'campo', grass2: 'campo', flowers: 'campo',
  rock: 'planalto', cliff: null, climb: null, dark: null, cavedoor: 'caverna',
  court: null, gold: null, plaza: null, path: null, bridge: null, bridgev: null, stairs: null, void: null,
};

// Ordem do jogo (docs/jornada-classica.md, seção 2). Cada segmento: ace = líder do ginásio que fecha o trecho,
// ou, nos arcos de região sem líder, o ace do próximo ginásio. Faixa de selvagens = [ace − 6, ace − 2].
// Pós-jogo (PJ): 55 a 75, pelo custo da área.
export const SEGMENTOS = {
  1: { nome: 'Rota 1 até Cidade Campina', ace: 14, lider: 'Tomé' },
  2: { nome: 'Rota 2, Bosque Sussurrante, Toca do Absol', ace: 19, lider: 'Lia' },
  3: { nome: 'Rota 3, Gruta da Maré, Porto Espelho', ace: 24, lider: 'Marina' },
  4: { nome: 'Rota 4 e costa até Cidade Coral', ace: 28, lider: 'Jonas' },
  5: { nome: 'Ilhas Jandaias (arco de região)', ace: 32, lider: 'Zélia (próximo)' },
  6: { nome: 'Rota 5 e Vila Lamparina', ace: 32, lider: 'Zélia' },
  7: { nome: 'Rota 6, Cidade Aurora, Mina Aurora, Rota 7', ace: 37, lider: 'Brás' },
  8: { nome: 'Sertão do Levante (arco de região)', ace: 41, lider: 'Graça (próximo)' },
  9: { nome: 'Rota 8, Paredão, Cidade Escarpa', ace: 41, lider: 'Graça' },
  10: { nome: 'Brasas (arco de região)', ace: 45, lider: 'Celeste (próximo)' },
  11: { nome: 'Rota 9 e Rota 11, Mirante dos Ventos', ace: 45, lider: 'Celeste' },
  12: { nome: 'Rota 12 e Relógio de Pedra', ace: 50, lider: 'Necrozma / Véspera' },
  13: { nome: 'Cordilheira Geada (arco de região)', ace: 54, lider: 'Elite 4 (próximo)' },
  14: { nome: 'Caminho do Zênite e Liga', ace: 62, lider: 'Campeã Dalva' },
  PJ: { nome: 'Pós-jogo: Mar do Sul e Terras do Ocaso', ace: null, lider: '—' },
};

// Área -> segmento (ids de areas: src/data/habitats.js, AREAS_ENCONTROS). Regiões do mapa usadas: nucleo, geada,
// sertao, jandaia, austral, brasas, poente_leste, poente_oeste (tools/mundo/plano.mjs).
const SEG_POR_AREA = {
  rota1: 1, campos_norte: 1, lagoa_dourada: 1,
  rota2: 2, bosque_sussurrante: 2, toca_absol: 2, mata_jequitibas: 2,
  rota3: 3, lago_espelho: 3, manguezal: 3, gruta_mare: 3, gruta_mare_2: 3, gruta_mare_fundo: 3,
  rota4: 4, restinga: 4, praia_corais: 4, praia_oeste: 4, ilhas_coral: 4, rota13: 4, recife_afundado: 4,
  rota5: 6, cemiterio_velas: 6,
  rota6: 7, mina_aurora: 7, mina_aurora_n1: 7, mina_aurora_n2: 7, mina_aurora_n3: 7, mina_aurora_n4: 7, rota7: 7, rota10: 7,
  mina_abandonada: 8, ilha_veu: 8, santuario_crepusculo: 8,
  rota14: 8, rota20: 8, canion_rio_seco: 8, fundo_canion: 8, chapada_vermelha: 8, dunas_douradas: 8, cratera_estrela: 8,
  oasis_buriti: 8, ruinas_pintada_1: 8, ruinas_pintada_2: 8, ruinas_pintada_3: 8, mangue_siri: 8, praia_levante: 8, mar_levante: 8,
  paredao: 9, rota8: 9,
  ilha_sol_nascente: 10, rota19: 10, ilha_basalto: 10, campos_cinza: 10, fontes_termais: 10, vulcao_ticao: 10,
  templo_chama_1: 10, templo_chama_2: 10, templo_chama_3: 10, cratera_ticao: 10, mar_brasas: 10, ilhota_fumegante: 10,
  planalto_ventos: 11, rota9: 11, ruinas_vigias: 11, ruinas_vigias_sub: 11, rota11: 11,
  fenda_prismatica: 12, rota12: 12,
  fenda_prismatica_3: 13, pico_geada: 13, rota15: 13, lago_congelado: 13, rota16: 13, geleira_uivo: 13,
  caverna_gelo_1: 13, caverna_gelo_2: 13, caverna_gelo_3: 13, cume_vento_branco: 13, fiorde_levante: 13,
  caminho_zenite: 14,
  rota17: 5, ilha_jandaia: 5, ilhas_gemeas: 5, mar_jandaias: 5, praia_cipo: 5, selva_grande: 5, cachoeira_veu_verde: 5,
  templo_raizes_1: 5, templo_raizes_2: 5, templo_raizes_3: 5, ilha_miragem: 5,
};

export const segmentoDe = (id, regiao) => {
  if (SEG_POR_AREA[id]) return SEG_POR_AREA[id];
  if (regiao === 'austral' || regiao === 'poente_leste' || regiao === 'poente_oeste') return 'PJ';
  return null;
};

// Faixa de nível da área. PJ: 55 a 75 escalonado pelo custo (menor custo = 55, maior = 70 a 75).
export function faixaDoSegmento(seg, custo, custoMin, custoMax) {
  if (seg === 'PJ') {
    const t = custoMax > custoMin ? (custo - custoMin) / (custoMax - custoMin) : 0;
    const lo = 55 + Math.round(t * 15);
    return [lo, Math.min(75, lo + 5)];
  }
  const s = SEGMENTOS[seg];
  return [s.ace - 6, s.ace - 2];
}

// Assinatura de cada região (checagem de "a região tem os tipos que a identificam")
export const ASSINATURA = {
  geada: { nome: 'Geada', tipos: ['ice'] },
  brasas: { nome: 'Brasas', tipos: ['fire', 'rock', 'ground'] },
  sertao: { nome: 'Sertão', tipos: ['ground', 'rock', 'grass'] },
  jandaia: { nome: 'Jandaias', tipos: ['grass', 'bug', 'flying'] },
  costa: { nome: 'Costa (praia, mar, recife)', tipos: ['water', 'flying'] },
  brejo: { nome: 'Brejo', tipos: ['water', 'poison', 'ghost'] },
  caverna: { nome: 'Cavernas', tipos: ['rock', 'ground', 'dark'] },
  planalto: { nome: 'Planalto', tipos: ['flying', 'rock'] },
};

export const ARQUIVO_DA_REGIAO = {
  geada: 'regioes/geada.json', sertao: 'regioes/sertao.json', jandaia: 'regioes/jandaia.json',
  austral: 'regioes/austral.json', brasas: 'regioes/brasas.json',
  poente_leste: 'ocaso/leste.json', poente_oeste: 'ocaso/oeste.json',
};
