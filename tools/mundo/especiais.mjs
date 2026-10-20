// Como se obtêm as espécies que não aparecem (ou não só aparecem) na natureza: iniciais, presentes, trocas, fósseis,
// ovos, lendários fixos, eventos e Ultra-Feras. Mais o plano da Pulseira Mega, das Mega Pedras, do Bracelete Dynamax
// e das Tocas de Luz (reides). As mecânicas de Mega e Dynamax ficam para outro agente; aqui só o "onde".
//
// Formato: dex (ou id de forma da PokéAPI) -> lista de { como, onde, nivel?, nota? }.
// como: inicial | presente | troca | fossil | ovo | lendario | evento | errante | ultrafera | clube

const L = (onde, nivel, nota) => ({ como: 'lendario', onde, nivel, ...(nota ? { nota } : {}) });
const EV = (onde, nivel, nota) => ({ como: 'evento', onde, nivel, ...(nota ? { nota } : {}) });
const PR = (onde, nivel, nota) => ({ como: 'presente', onde, nivel, ...(nota ? { nota } : {}) });
const TR = (onde, nivel, nota) => ({ como: 'troca', onde, nivel, ...(nota ? { nota } : {}) });
const ER = (onde, nivel, nota) => ({ como: 'errante', onde, nivel, ...(nota ? { nota } : {}) });
const UB = (onde, nivel = 65) => ({ como: 'ultrafera', onde, nivel, nota: 'Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie' });
const FO = (fossil, onde) => ({ como: 'fossil', onde, nivel: 25, nota: `${fossil}; revive no Laboratório de Fósseis de Cidade Buriti` });

export const OBTENCAO = {
  // ---------------- iniciais
  1: [{ como: 'inicial', onde: 'laboratorio', nivel: 5, nota: 'escolha no Laboratório; os outros dois o Prof. Jatobá dá com 8 insígnias' }],
  4: [{ como: 'inicial', onde: 'laboratorio', nivel: 5 }],
  7: [{ como: 'inicial', onde: 'laboratorio', nivel: 5 }],
  255: [PR('cidade_campina', 5, 'missão Os pintinhos que pegam fogo (Lili)')],
  498: [PR('vila_mandacaru', 15, 'missão As cabras do Seu Brasa')],
  // os 27 iniciais também saem no Clube dos Iniciais (Porto Rubro), um a cada 40 espécies do Ocaso
  clube: [1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650, 653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912],

  // ---------------- presentes e trocas
  83: [TR('vila_alvorada', 12, 'Juninho troca por um Pokémon de Água')],
  137: [PR('cidade_aurora', 25, 'prêmio do cartão fidelidade (missão Cliente de todos os andares)')],
  479: [PR('cidade_coral', 25, 'missão O farol pisca errado')],
  772: [PR('laboratorio', 40, 'Bia resgatou da Torre Aurora; dá a quem tiver 8 insígnias')],
  891: [PR('forte_rochedo', 10, 'missão As duas rodas (Mestre Cobra)')],
  374: [PR('cidade_aurora', 40, 'cofre da cobertura da Torre Aurora')],
  'corsola-galar': [TR('cidade_coral', 25, 'Família Brito')],
  'exeggutor-alola': [TR('vila_jandaia', 35, 'Pescador Tupã'), { como: 'evolucao-local', onde: 'ilha_jandaia', nota: 'Exeggcute com Pedra da Folha nas Jandaias' }],
  'sandshrew-alola': [TR('cidade_buriti', 30, 'Kiana, hóspede de Alola')],
  'vulpix-alola': [TR('cidade_buriti', 30, 'Kiana'), TR('estacao_austral', 40, 'Gusmão')],
  'sneasel-hisui': [TR('vila_geada', 40, 'Tor')],
  'avalugg-hisui': [TR('vila_geada', 45, 'Tora')],
  'braviary-hisui': [{ como: 'alfa', onde: 'altiplano_condor', nivel: 72, nota: 'missão O voo do condor' }],
  'raichu-alola': [{ como: 'evolucao-local', onde: 'ilha_jandaia', nota: 'Pikachu que evolui com Pedra do Trovão nas Jandaias vira Raichu de Alola' }],
  'marowak-alola': [{ como: 'evolucao-local', onde: 'ilha_jandaia', nota: 'Cubone que evolui de noite nas Jandaias' }],
  'weezing-galar': [{ como: 'evolucao-local', onde: 'porto_rubro', nota: 'Koffing que evolui no Ocaso' }],
  'typhlosion-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Quilava que evolui no Ocaso' }],
  'samurott-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Dewott que evolui no Ocaso' }],
  'decidueye-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Dartrix que evolui no Ocaso' }],
  'lilligant-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Petilil com Pedra da Alvorada no Ocaso' }],
  'goodra-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Goomy que evolui no Ocaso (Sliggoo e Goodra de Hisui)' }],
  'sliggoo-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Goomy que evolui no Ocaso' }],
  'arcanine-hisui': [{ como: 'evolucao-local', onde: 'vila_fim_mundo', nota: 'Growlithe de Hisui com Pedra do Fogo' }],

  // ---------------- fósseis (achados como tesouro; revividos em Cidade Buriti)
  138: [FO('Fóssil Concha', 'gruta_mare')], 140: [FO('Fóssil Domo', 'gruta_mare')], 142: [FO('Âmbar Antigo', 'ruinas_pintada_1')],
  345: [FO('Fóssil Raiz', 'templo_raizes_3')], 347: [FO('Fóssil Garra', 'dunas_douradas')], 408: [FO('Fóssil Crânio', 'mina_aurora_n4')],
  410: [FO('Fóssil Escudo', 'mina_aurora_n4')], 564: [FO('Fóssil Casco', 'templo_mares_2')], 566: [FO('Fóssil Pena', 'canion_rio_seco')],
  696: [FO('Fóssil Mandíbula', 'fundo_canion')], 698: [FO('Fóssil Vela', 'caverna_gelo_2')],
  880: [FO('Fóssil Pássaro + Fóssil Dragão', 'deserto_silencio')], 881: [FO('Fóssil Pássaro + Fóssil Drake', 'campos_gelo_sul')],
  882: [FO('Fóssil Peixe + Fóssil Dragão', 'deserto_silencio')], 883: [FO('Fóssil Peixe + Fóssil Drake', 'campos_gelo_sul')],

  // ---------------- lendários e míticos (um só de cada, em lugar fixo)
  144: [L('cume_vento_branco', 70)], 145: [L('mirante_ventos (topo, em tempestade, com 8 insígnias)', 70)], 146: [L('cratera_ticao', 70)],
  'articuno-galar': [ER('altiplano_condor', 72, 'aparece voando; segue-se até ele pousar')], 'zapdos-galar': [ER('pampa_coxilhas', 72, 'corre pelas coxilhas')],
  'moltres-galar': [ER('deserto_silencio', 72, 'só de noite')],
  150: [L('gruta_cataratas_2', 80)], 151: [EV('ilha_miragem', 30, 'na lua cheia, depois de registrar 150 espécies')],
  243: [ER('planalto_ventos', 60, 'em tempestade de raios')], 244: [ER('rota14', 60, 'no sertão, ao meio-dia')], 245: [ER('lago_espelho', 60, 'na neblina da madrugada')],
  249: [L('fossa_abissal', 75)], 250: [L('farol_morto_torre', 75, 'no telhado, ao pôr do sol, com a Pena Arco-Íris')],
  251: [EV('mata_jequitibas', 50, 'missão A semente do tempo (Seu Juca planta uma muda de jequitibá)')],
  377: [L('ruinas_pintada_3', 60)], 378: [L('caverna_iceberg_2', 60)], 379: [L('mina_aurora_n4', 60)],
  380: [ER('ilhas_gemeas', 55, 'ilha leste; depois de ver as duas ilhas no mesmo dia')], 381: [ER('ilhas_gemeas', 55, 'ilha oeste')],
  382: [L('templo_mares_3', 70, 'caverna submersa no fim do recife')], 383: [L('vulcao_sentinela', 70)], 384: [L('altiplano_fenda_2 (céu alto, ao meio-dia)', 75)],
  385: [EV('mirante_ventos', 30, 'missão Desejo da Nina')], 386: [L('cratera_estrela', 70, 'na noite de chuva de meteoros')],
  480: [L('lago_congelado', 50)], 481: [ER('lagoa_dourada', 50, 'aparece e foge; depois anda pelo mundo')], 482: [L('oasis_buriti', 50)],
  483: [L('cratera_tempo_2', 75, 'lado do Futuro')], 484: [L('cratera_tempo_3', 75, 'lado do Passado')], 487: [L('cratera_tempo_3', 75)],
  485: [L('templo_chama_3', 70)], 486: [L('campos_gelo_sul', 75, 'com Regirock, Regice e Registeel na equipe')],
  488: [L('ilha_veu', 60, 'lua cheia, no observatório')], 489: [EV('recife_grande_fundo', 40, 'filhote do Manaphy (ovo do recife)')],
  490: [EV('recife_grande_fundo', 1, 'ovo dentro de uma concha gigante')], 491: [EV('vila_lamparina', 60, 'missão Noite de lua nova')],
  492: [EV('lagoa_dourada', 30, 'Flor Gracídea depois de florir 30 Frutas')], 493: [EV('liga_zenite', 80, 'altar acima das nuvens, com a Pokédex completa')],
  494: [EV('forte_rochedo', 50, 'missão Bilhete da vitória')], 638: [L('canion_rio_seco', 65)], 639: [L('ruinas_pintada_1', 65)], 640: [L('mata_jequitibas', 65)],
  641: [ER('pampa_coxilhas', 70, 'ventania')], 642: [ER('pampa_coxilhas', 70, 'trovoada')], 645: [L('altiplano_condor', 70, 'com Tornadus e Thundurus capturados')],
  643: [L('vulcao_sentinela', 75, 'lado do dia')], 644: [L('vulcao_sentinela', 75, 'lado da noite')], 646: [L('caverna_gelo_3', 70, 'Câmara do Zero Absoluto')],
  647: [EV('cachoeira_veu_verde', 60, 'com Cobalion, Terrakion e Virizion')], 648: [EV('vila_sussurro', 50, 'missão A canção das árvores')],
  649: [EV('cidade_aurora', 60, 'missão O cofre da cobertura')],
  716: [L('mata_jequitibas', 70, 'a árvore mais velha, ao amanhecer')], 717: [L('deserto_silencio', 70, 'casulo de pedra, ao anoitecer')], 718: [L('fundo_canion', 70)],
  719: [EV('fenda_prismatica', 50, 'salão dos diamantes, com um Carbink na equipe')], 720: [EV('cidade_buriti', 50, 'missão O anel da rainha')], 721: [L('ilhota_fumegante', 60)],
  785: [L('ilha_jandaia', 60, 'missão O guardião da ilha')], 786: [L('ilha_basalto', 60)], 787: [L('templo_raizes_3', 60)], 788: [L('templo_mares_3', 60)],
  789: [PR('ruinas_vigias', 5, 'o Último Vigia dá depois de Solgaleo e Lunala capturados')],
  791: [L('ilha_sol_nascente', 70, 'missão O rastro do sol')], 792: [L('santuario_crepusculo', 60)], 800: [L('fenda_prismatica', 72)],
  801: [EV('cidade_aurora', 50, 'missão O coração de engrenagem')], 802: [EV('vila_lamparina', 50, 'sombras do Casarão das Velas, depois de vencer a revanche da Zélia')],
  803: [PR('fenda_prismatica', 40, 'o Último Vigia acha um filhote perto da fenda')], 807: [EV('rota6', 50, 'nas torres de transmissão, em tempestade')],
  808: [EV('mina_aurora_n4', 30, 'aparecem em grupo depois de tirar a luzita das paredes (missão da Pipa)')], 809: [{ como: 'evolucao', nota: '400 doces de Meltan: o Vô Ernesto funde' }],
  888: [L('pampa_coxilhas', 70, 'missão A coluna dos heróis')], 889: [L('pampa_coxilhas', 70, 'missão A coluna dos heróis')], 890: [L('salar_branco', 75)],
  894: [L('cataratas_trovao', 70, 'câmara do trovão atrás da cortina')], 895: [L('cordilheira_poente', 70, 'câmara do dragão')],
  893: [EV('selva_grande', 60, 'no coração da selva, em noite de chuva')],
  896: [L('campos_gelo_sul', 75)], 897: [L('deserto_silencio', 75, 'de noite')], 898: [L('vila_altiplana', 75, 'missão O rei das cenouras')],
  905: [ER('pampa_coxilhas', 70, 'na primavera do jogo')],
  1001: [L('pantanal', 70, 'santuário selado por 8 estacas')], 1002: [L('campos_gelo_sul', 70, 'santuário selado por 8 estacas')],
  1003: [L('altiplano_condor', 70, 'santuário selado por 8 estacas')], 1004: [L('vulcao_sentinela', 70, 'santuário selado por 8 estacas')],
  1007: [L('cidadela_poente', 75)], 1008: [L('cidadela_poente', 75)], 1024: [L('pantanal', 80, 'no cristal do fundo')],
  1014: [ER('mata_araucarias', 70, 'os Três Leais; um de cada vez')], 1015: [ER('mata_araucarias', 70)], 1016: [ER('mata_araucarias', 70)],
  1017: [L('pantanal', 70, 'Festa das Máscaras na Estância Ventania')], 1025: [EV('porto_rubro', 70, 'missão O doce envenenado')],
  // ---------------- Ultra-Feras (Fendas Ultra, depois do Necrozma)
  793: [UB('gruta_mare')], 794: [UB('selva_grande')], 795: [UB('dunas_douradas')], 796: [UB('rota6')], 797: [UB('planalto_ventos')],
  798: [UB('bosque_sussurrante')], 799: [UB('canion_rio_seco')], 805: [UB('ilha_basalto')], 806: [UB('campos_cinza')],
};

// Bebês: a Creche da Vó Iara (Vila Jandaia) dá um ovo por dia, sorteado desta lista (missão sq_ovos).
export const OVOS = [172, 173, 174, 175, 236, 238, 239, 240, 298, 360, 406, 433, 438, 439, 440, 446, 447, 458, 848];

// Lendários que precisam de 8 insígnias (a trama principal) ou do Necrozma capturado; o resto é livre.
export const PEDE_TRAMA = [791, 792, 800, 789, 493, 803, 793, 794, 795, 796, 797, 798, 799, 805, 806, 144, 145, 384, 772];

// ------------------------------------------------------------------------------------------------ Mega
export const MEGA = {
  pulseira: { onde: 'cidade_escarpa', como: 'missão A Pedra-Chave (Dona Pedrina lapida três lascas de prisma: Mina Abandonada, Ruínas dos Vigias, Caverna de Gelo Cristalino)' },
  lore: 'As Mega Pedras são lascas da Pedra do Alvorecer que caíram longe do Relógio; brilham como a luzita, mas não drenam nada.',
  // id da forma (PokéAPI) -> lugar e como. As que ficam fora daqui o gerador distribui pelos tesouros das dungeons do tipo da espécie.
  pedras: {
    'venusaur-mega': ['templo_raizes_3', 'missão O mapa do templo (Dra. Ybi)'], 'charizard-mega-x': ['templo_chama_2', 'tesouro'], 'charizard-mega-y': ['vila_termas', 'missão O vulcão acordado'],
    'blastoise-mega': ['estacao_austral', 'missão O canto das Lapras'], 'gengar-mega': ['cemiterio_velas', 'tesouro escondido (noite)'], 'absol-mega': ['vila_lamparina', 'missão Sina e Véspera'],
    'lucario-mega': ['cidade_escarpa', 'junto com a Pulseira Mega'], 'garchomp-mega': ['cidade_buriti', 'missão Campeão da areia'], 'metagross-mega': ['cidade_aurora', 'missão O cofre da cobertura'],
    'steelix-mega': ['cidade_aurora', 'missão O Steelix de cristal'], 'glalie-mega': ['vila_geada', 'missão A luz que dança'], 'camerupt-mega': ['vila_termas', 'missão A montanha que anda'],
    'mewtwo-mega-x': ['gruta_cataratas_2', 'tesouro'], 'mewtwo-mega-y': ['cidadela_poente', '49 vitórias na Torre de Batalha'], 'diancie-mega': ['fenda_prismatica_3', 'tesouro'],
    'ampharos-mega': ['farol_coral (lanterna)', 'tesouro'], 'gyarados-mega': ['templo_mares_1', 'tesouro'], 'altaria-mega': ['torre_vento', 'revanche da Celeste'],
    'aerodactyl-mega': ['ruinas_pintada_1', 'tesouro'], 'tyranitar-mega': ['ruinas_pintada_2', 'tesouro'], 'sceptile-mega': ['templo_raizes_2', 'tesouro'],
    'abomasnow-mega': ['caverna_gelo_1', 'tesouro'], 'froslass-mega': ['caverna_gelo_3', 'tesouro'], 'houndoom-mega': ['templo_chama_1', 'tesouro'],
    'sharpedo-mega': ['templo_mares_2', 'tesouro'], 'rayquaza-mega': ['(não precisa de pedra: Rayquaza com Ascensão do Dragão)', 'golpe'],
    'kangaskhan-mega': ['campos_norte', 'tesouro no ninho de uma Kangaskhan'], 'pinsir-mega': ['bosque_sussurrante', 'revanche da Lia'], 'heracross-mega': ['vila_sussurro', 'revanche da Lia'],
    'pidgeot-mega': ['rota1', 'tesouro escondido no ipê mais alto'], 'beedrill-mega': ['rota2', 'tesouro escondido'], 'audino-mega': ['vila_alvorada', 'a Mãe dá (a Dona Fofa usa a dela)'],
    'lopunny-mega': ['cidade_campina', 'revanche do Tomé'], 'blaziken-mega': ['cidade_campina', 'missão Os pintinhos que pegam fogo (depois de evoluir Torchic duas vezes)'],
    'swampert-mega': ['pantanal', 'tesouro'], 'gardevoir-mega': ['ruinas_vigias_sub', 'tesouro'], 'gallade-mega': ['ruinas_vigias_sub', 'tesouro'],
    'slowbro-mega': ['porto_espelho', 'Tia Jandira (o Doutor tem uma)'], 'medicham-mega': ['forte_rochedo', 'revanche do Brás'], 'banette-mega': ['vila_lamparina', 'revanche da Zélia'],
    'sableye-mega': ['mina_abandonada', 'tesouro'], 'mawile-mega': ['caminho_zenite', 'tesouro'], 'aggron-mega': ['mina_aurora_n4', 'tesouro'], 'manectric-mega': ['cidade_coral', 'revanche do Jonas'],
    'latias-mega': ['ilhas_gemeas', 'tesouro'], 'latios-mega': ['ilhas_gemeas', 'tesouro'], 'salamence-mega': ['chapada_vermelha', 'tesouro'], 'scizor-mega': ['megaloja_aurora', 'loja do 4º andar (₽50000)'],
    'alakazam-mega': ['observatorio_boreal', 'Dra. Hanna'], 'zygarde-mega': ['fundo_canion', 'tesouro (com Zygarde capturado)'], 'magearna-mega': ['oficina_ernesto', 'Vô Ernesto'],
    'magearna-original-mega': ['oficina_ernesto', 'Vô Ernesto'], 'heatran-mega': ['templo_chama_3', 'tesouro'], 'darkrai-mega': ['vila_lamparina', 'capela, na lua nova'],
    'zeraora-mega': ['rota6', 'torre de transmissão'], 'dragonite-mega': ['liga_zenite', 'Iberê, na revanche'], 'clefable-mega': ['ilha_miragem', 'tesouro'],
  },
};

// ------------------------------------------------------------------------------------------------ Dynamax
// Tocas de Luz: buracos no chão por onde vaza a luz do Coração. Reides de até 4 jogadores (cooperativos no online:
// quem estiver no mesmo setor entra junto). A toca "acende" uma vez por dia de jogo; a espécie sai da tabela da área.
export const DYNAMAX = {
  bracelete: { onde: 'laboratorio', como: 'a Bia monta com as leituras do Prisma; dá a quem levar a ela a foto de uma Toca de Luz acesa (qualquer uma)' },
  lore: 'Desde que a luzita afrouxou o cadeado, a luz que vaza se junta em tocas: Pokémon que bebem dela crescem até o céu por três turnos.',
  regras: 'Tocas comuns sorteiam da tabela de encontros da área (nível da área + 5). Tocas Gigantamax têm a forma fixa listada; as raras só acendem de noite ou com clima.',
  tocas: [
    { id: 'toca_campos_norte', area: 'campos_norte', gmax: ['snorlax-gmax', 'eevee-gmax', 'alcremie-gmax'] },
    { id: 'toca_rota1', area: 'rota1', gmax: ['pikachu-gmax'] },
    { id: 'toca_bosque', area: 'bosque_sussurrante', gmax: ['butterfree-gmax', 'orbeetle-gmax'] },
    { id: 'toca_mata', area: 'mata_jequitibas', gmax: ['venusaur-gmax', 'flapple-gmax', 'appletun-gmax'] },
    { id: 'toca_lago', area: 'lago_espelho', gmax: ['drednaw-gmax'] },
    { id: 'toca_rota6', area: 'rota6', gmax: ['toxtricity-amped-gmax', 'toxtricity-low-key-gmax', 'garbodor-gmax'] },
    { id: 'toca_cemiterio', area: 'cemiterio_velas', gmax: ['gengar-gmax'], nota: 'só de noite' },
    { id: 'toca_rota7', area: 'rota7', gmax: ['machamp-gmax'] },
    { id: 'toca_forte', area: 'forte_rochedo', gmax: ['urshifu-single-strike-gmax', 'urshifu-rapid-strike-gmax'], nota: 'só depois da missão As duas rodas' },
    { id: 'toca_rota9', area: 'rota9', gmax: ['corviknight-gmax'] },
    { id: 'toca_mina', area: 'mina_abandonada', gmax: ['melmetal-gmax'] },
    { id: 'toca_ilha_veu', area: 'ilha_veu', gmax: ['grimmsnarl-gmax'] },
    { id: 'toca_jandaia', area: 'ilha_jandaia', gmax: ['meowth-gmax'] },
    { id: 'toca_selva', area: 'selva_grande', gmax: ['rillaboom-gmax'] },
    { id: 'toca_recife', area: 'recife_grande', gmax: ['blastoise-gmax'] },
    { id: 'toca_mangue', area: 'mangue_siri', gmax: ['kingler-gmax'] },
    { id: 'toca_dunas', area: 'dunas_douradas', gmax: ['sandaconda-gmax'] },
    { id: 'toca_chapada', area: 'chapada_vermelha', gmax: ['duraludon-gmax'] },
    { id: 'toca_canion', area: 'canion_rio_seco', gmax: ['copperajah-gmax'] },
    { id: 'toca_austrais', area: 'ilhas_austrais', gmax: ['lapras-gmax'] },
    { id: 'toca_cinza', area: 'campos_cinza', gmax: ['coalossal-gmax', 'centiskorch-gmax'] },
    { id: 'toca_vulcao', area: 'vulcao_ticao', gmax: ['charizard-gmax'] },
    { id: 'toca_pampa', area: 'pampa_coxilhas', gmax: ['cinderace-gmax'] },
    { id: 'toca_cataratas', area: 'cataratas_trovao', gmax: ['inteleon-gmax'] },
    { id: 'toca_araucarias', area: 'mata_araucarias', gmax: ['hatterene-gmax'] },
    { id: 'salao_tocas', area: 'cidadela_poente', gmax: [], nota: 'sorteia qualquer Gigantamax já visto, nível 70; ponto de encontro dos reides online' },
  ],
};

// Dungeons que recebem as Mega Pedras sem lugar fixo, pelo primeiro tipo da espécie.
export const TESOURO_POR_TIPO = {
  normal: 'megaloja_aurora', fire: 'templo_chama_1', water: 'templo_mares_1', grass: 'templo_raizes_1', electric: 'farol_coral (lanterna)', ice: 'caverna_gelo_2',
  fighting: 'forte_rochedo', poison: 'rota5', ground: 'ruinas_pintada_2', flying: 'torre_vento', psychic: 'ruinas_vigias_sub', bug: 'templo_raizes_2', rock: 'mina_abandonada',
  ghost: 'cemiterio_velas', dragon: 'caminho_zenite', dark: 'ilha_veu', steel: 'mina_aurora_n4', fairy: 'mata_araucarias',
};
