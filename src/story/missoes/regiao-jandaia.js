// Missões e NPCs vivos do Arquipélago das Jandaias (Vila Jandaia, Selva Grande, Templo das Raízes, Ilhas Gêmeas e Miragem).
// Formato: docs/missoes.md. Plano: docs/mundo-expandido.md, seção 10 (Vila Jandaia). Mapa: assets/maps/regioes/jandaia.json
// (gerado por tools/regioes/jandaia.mjs; as posições dos coqueiros abaixo vêm de lá).

export const ITENS = {
  coco_verde: { name: 'Coco Verde', color: '#7fbf4f', desc: 'Um coco verde, daqueles que caem quando o coqueiro é sacudido por um Pokémon forte. Cheio de água de coco.' },
  tabuleta_raiz_1: { name: 'Tabuleta de Raiz (1)', color: '#9a8a5a', desc: 'Tabuleta de pedra do Átrio do Templo das Raízes. Tem uma flor e uma raiz gravadas. Era para a Dra. Ybi.' },
  tabuleta_raiz_2: { name: 'Tabuleta de Raiz (2)', color: '#9a8a5a', desc: 'Tabuleta das Galerias Inundadas. Ondas e uma comporta, gravadas à mão. Era para a Dra. Ybi.' },
  tabuleta_raiz_3: { name: 'Tabuleta de Raiz (3)', color: '#9a8a5a', desc: 'Tabuleta da Câmara da Semente. Uma semente e quatro raízes. Era para a Dra. Ybi.' },
  fossil_raiz: { name: 'Fóssil Raiz', color: '#8a6a3a', desc: 'Um fóssil em forma de raiz enrolada. Dizem que um Lileep dormiu nele. Revive no Laboratório de Fósseis de Cidade Buriti.' },
};

// coqueiros da Ilha Jandaia que dão cocos na missão "Coco verde" (o coco cai logo ao sul do coqueiro)
const COCOS = [[46, 588], [61, 580], [78, 574], [112, 575], [128, 580], [150, 585], [162, 600], [157, 618], [130, 640], [100, 646], [76, 642]];
// bebês da creche: um ovo por dia, sorteado
const BEBES = [172, 173, 174, 175, 236, 238, 239, 240, 298, 360, 406, 433, 438, 439, 440, 446, 447, 458, 848];
const ovoDoDia = () => ({ pokemon: { dex: BEBES[Math.floor(Math.random() * BEBES.length)], nivel: 1 }, texto: 'Um ovo chocadinho, ainda com cheiro de palha' });

export const MISSOES = [
  {
    id: 'sq_ovos', titulo: 'Os ovos da Vó Iara', regiao: 'Vila Jandaia', de: 'vo_iara',
    resumo: 'A Vó Iara tem mais ovos do que ninhos. Um por dia, de graça, para quem cuidar.',
    oferta: ['Toda manhã, sobra um ovo no cesto. Não sei de quem é, não sei de quem foi, só sei que alguém tem que cuidar.', 'Passa aqui uma vez por dia e eu te dou o ovo daquele dia. Mas cuida bem, viu?'],
    ofertaRepetida: ['Hoje o cesto deu um ovo novo. Quer?'],
    lembrete: ['O ovo de hoje está no cesto. É só pedir.'],
    diaria: true, repetivel: true,
    etapas: [{ tipo: 'falar', npc: 'vo_iara', texto: 'Pegue o ovo do dia com a Vó Iara', falas: ['Este está quentinho. Cuida dele como se fosse seu.'] }],
    get recompensa() { return ovoDoDia(); },
    get recompensaRepetida() { return ovoDoDia(); },
  },
  {
    id: 'sq_coco', titulo: 'Coco verde', regiao: 'Ilha Jandaia', de: 'pescador_tupa',
    resumo: 'O Tupã quer dez cocos verdes. Os coqueiros da ilha só soltam o fruto se um Pokémon forte os sacudir.',
    oferta: ['Preciso de dez cocos verdes para a festa da balsa. Mas os coqueiros são teimosos: só soltam o fruto se um Pokémon forte sacudir o tronco.', 'Os cocos caem logo ao pé do coqueiro. Pode juntar?'],
    lembrete: ['Dez cocos verdes. Os coqueiros ficam espalhados pela orla da ilha.'],
    etapas: [
      { tipo: 'achar', pontos: COCOS.map(([x, y]) => [x, y + 1]), item: 'coco_verde', nItem: 1, achou: 'O Pokémon sacudiu o coqueiro e um coco verde caiu!', texto: 'Sacuda os coqueiros da orla da Ilha Jandaia (10 cocos)', dica: { lugar: 'ilha_jandaia' } },
      { tipo: 'entregar', npc: 'pescador_tupa', item: 'coco_verde', n: 10, texto: 'Leve os 10 cocos ao Pescador Tupã', pergunta: ['Trouxe os cocos?'], falta: ['Ainda faltam cocos. Procure em volta dos coqueiros.'], falas: ['Que cocos lindos! A festa da balsa está salva.'] },
    ],
    recompensa: { itens: [['sitrusBerry', 10]], mt: 'bulletSeed' },
  },
  {
    id: 'sq_ybi', titulo: 'O mapa do templo', regiao: 'Selva Grande', de: 'dra_ybi',
    resumo: 'A Dra. Ybi precisa das três tabuletas do Templo das Raízes (uma por andar) para fechar o mapa.',
    oferta: ['O templo tem três andares e cada andar guarda uma tabuleta de pedra. Sem as três, o meu mapa não fecha e eu não durmo.', 'Escalar e nadar não são problemas para você? Então traga as três.'],
    lembrete: ['Uma tabuleta por andar: Átrio, Galerias e Câmara da Semente.'],
    etapas: [
      { tipo: 'ter', item: 'tabuleta_raiz_1', n: 1, texto: 'Pegue a tabuleta do Átrio (1º andar do templo)', falas: ['A primeira está com você.'] },
      { tipo: 'ter', item: 'tabuleta_raiz_2', n: 1, texto: 'Pegue a tabuleta das Galerias Inundadas (2º andar)', falas: ['A segunda também!'] },
      { tipo: 'ter', item: 'tabuleta_raiz_3', n: 1, texto: 'Pegue a tabuleta da Câmara da Semente (3º andar)', falas: ['Três tabuletas. Volte à Dra. Ybi.'] },
      { tipo: 'falar', npc: 'dra_ybi', texto: 'Leve as três tabuletas à Dra. Ybi', falas: ['As três! Isso fecha o mapa do templo. Veja: tem uma câmara escondida, mais funda ainda.', 'Aceite isto. E esta pedra, que achei na sala dos mosaicos, é sua.'] },
    ],
    recompensa: { itens: [['leafStone', 1], ['fossil_raiz', 1], ['venusaurite', 1]], mt: 'leafStorm' },
    proxima: 'sq_tapu_bulu',
  },
  {
    id: 'sq_tapu_bulu', titulo: 'O guardião das raízes', regiao: 'Templo das Raízes', de: 'dra_ybi', requer: { missoes: ['sq_ybi'] },
    resumo: 'Na Câmara da Semente, depois que as quatro raízes acendem, o guardião do templo desce do teto.',
    oferta: ['O mapa mostra um quarto lugar: o altar da Câmara da Semente. Lá embaixo desce um guardião, quando as quatro raízes acordam.', 'Acorde as raízes com golpes de Planta, que elas respondem. E tenha cuidado: ele não gosta de visita.'],
    lembrete: ['A Câmara da Semente, no 3º andar. Quatro raízes: golpes de Planta.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_raizes_3', x: 14, y: 12, r: 6, texto: 'Chegue à Câmara da Semente (3º andar do Templo das Raízes)' },
      { tipo: 'vencer', texto: 'Enfrente o guardião que desce das raízes', alfa: { dex: 787, nivel: 60, sala: 'templo_raizes_3', x: 14, y: 9, golpes: ['woodHammer', 'hornLeech', 'brickBreak', 'megahorn'], aviso: 'O guardião das raízes desceu do teto!' } },
    ],
    recompensa: { itens: [['miracleSeed', 1], ['rareCandy', 2]] },
  },
  {
    id: 'sq_tapu_koko', titulo: 'O guardião da ilha', regiao: 'Ilha Jandaia', de: 'cap_jandaia_norte',
    resumo: 'Os quatro Capitães da ilha, um em cada praia. Quem vence os quatro vê o guardião descer no altar da colina.',
    oferta: ['Quem sobe a colina do altar sem a nossa licença, volta de cara no chão. A licença é vencer os quatro Capitães, um em cada praia.', 'Eu sou a primeira, do Norte. O Oeste, o Sul e o Leste esperam nas praias deles. Topa?'],
    lembrete: ['Quatro Capitães: Norte, Oeste, Sul e Leste. Cada um na sua praia.'],
    etapas: [
      { tipo: 'vencer', npc: 'cap_jandaia_norte', texto: 'Vença a Capitã Sereia (praia do norte)', batalha: { id: 'sq_koko_norte', nome: 'Capitã Sereia', dinheiro: 1400, equipe: [[729, 29], [279, 30], [121, 31]] }, falas: ['Que a maré te leve ao próximo!'], vitoria: ['A maré te levou até mim e te trouxe de volta vencedor.'], derrota: ['A maré levou a sua chance. Volte.'] },
      { tipo: 'vencer', npc: 'cap_jandaia_oeste', texto: 'Vença o Capitão Pôr-do-Sol (praia do oeste)', batalha: { id: 'sq_koko_oeste', nome: 'Capitão Pôr-do-Sol', dinheiro: 1400, equipe: [[741, 29], [733, 30], [663, 31]] }, falas: ['O dia vai acabar, mas a luta não.'], vitoria: ['O sol se pôs, e você ficou de pé.'], derrota: ['Escureceu. Volte de manhã.'] },
      { tipo: 'vencer', npc: 'cap_jandaia_sul', texto: 'Vença a Capitã Maré Cheia (praia do sul)', batalha: { id: 'sq_koko_sul', nome: 'Capitã Maré Cheia', dinheiro: 1500, equipe: [[75, 30], [99, 30], [222, 31]] }, falas: ['A maré está alta, e eu também.'], vitoria: ['A maré baixou e eu junto.'], derrota: ['Maré cheia ganha de qualquer um. Volte na baixa.'] },
      { tipo: 'vencer', npc: 'cap_jandaia_leste', texto: 'Vença o Capitão Nascente (praia do leste)', batalha: { id: 'sq_koko_leste', nome: 'Capitão Nascente', dinheiro: 1500, equipe: [[735, 30], [743, 31], [754, 32]] }, falas: ['O último dos quatro. Depois de mim, só o morro.'], vitoria: ['Os quatro reconheceram você. Pode subir.'], derrota: ['O sol nasce de novo. Volte amanhã.'] },
      { tipo: 'chegar', x: 146, y: 600, r: 4, texto: 'Suba a colina e chegue ao altar', falas: ['O relâmpago do altar acendeu. Os quatro buracos redondos brilham, um por Capitão.', 'No céu, um estrondo. Uma figura de ouro e preto desce sobre a colina.'] },
    ],
    recompensa: { pokemon: { dex: 785, nivel: 60, apelido: 'Koko' }, texto: 'O guardião da ilha desceu e ficou do seu lado' },
  },
  {
    id: 'sq_troca_tupa', titulo: 'Coqueiro andante', regiao: 'Vila Jandaia', de: 'pescador_tupa',
    resumo: 'O Tupã troca o Exeggutor que criou na ilha por um Exeggcute.',
    oferta: ['Eu tenho um Exeggutor que anda pela ilha mais alto que os coqueiros. Troco por um Exeggcute, se você tiver.'],
    lembrete: ['Um Exeggcute por um Exeggutor. Os Exeggcute andam na mata da ilha.'],
    etapas: [{ tipo: 'falar', npc: 'pescador_tupa', texto: 'Fale com o Pescador Tupã sobre a troca', falas: ['Quando tiver um Exeggcute, é só voltar.'] }],
    recompensa: { texto: 'A troca é feita na conversa com o Tupã' },
  },
  {
    id: 'sq_gemeas', titulo: 'As ilhas que são uma só', regiao: 'Ilhas Gêmeas', de: 'seu_cacau', requer: { missoes: ['sq_tapu_koko'] },
    resumo: 'Duas ilhotas iguais, um banco de areia que a maré descobre e dois Pokémon que só aparecem para quem viu as duas no mesmo dia.',
    oferta: ['Quando eu era menino, o meu avô me levou às Ilhas Gêmeas. Ele dizia: "quem vir as duas no mesmo dia, vê quem mora lá".', 'Vá, e leve Pokémon fortes. Eles não gostam de visita.'],
    lembrete: ['As Ilhas Gêmeas, ao sul da Ilha Jandaia: oeste e leste, no mesmo dia.'],
    etapas: [
      { tipo: 'chegar', lugar: 'ilhas_gemeas', r: 12, texto: 'Chegue às Ilhas Gêmeas' },
      { tipo: 'vencer', texto: 'Enfrente quem vive na ilha do oeste', alfa: { dex: 381, nivel: 55, x: 258, y: 634, golpes: ['dragonPulse', 'psychic', 'surf', 'lusterPurge'], aviso: 'Uma sombra azul passou voando sobre a ilha do oeste!' } },
      { tipo: 'vencer', texto: 'Enfrente quem vive na ilha do leste', alfa: { dex: 380, nivel: 55, x: 318, y: 634, golpes: ['dragonPulse', 'psychic', 'mistBall', 'surf'], aviso: 'Uma sombra vermelha passou voando sobre a ilha do leste!' } },
    ],
    recompensa: { itens: [['rareCandy', 3], ['mysticWater', 1]] },
  },
  {
    id: 'sq_miragem', titulo: 'A ilha que aparece', regiao: 'Ilha Miragem', de: 'dra_ybi', requer: { missoes: ['sq_gemeas'] },
    resumo: 'Uma ilha cercada de rochas, no canto sudeste do mar, que só se alcança voando. E um Pokémon rosa que não gosta de ser visto.',
    oferta: ['As tabuletas falam de uma ilha que aparece só de noite, no canto sudeste do arquipélago. Cercada de rochas: só se chega voando.', 'Dizem que um Pokémon rosa e pequeno dorme lá. Se conseguir ver, me conte.'],
    lembrete: ['A Ilha Miragem, no canto sudeste. Só voando. De noite.'],
    etapas: [
      { tipo: 'chegar', lugar: 'ilha_miragem', r: 10, se: { hora: 'noite' }, texto: 'Chegue voando à Ilha Miragem, de noite' },
      { tipo: 'vencer', texto: 'Encontre o Pokémon rosa da ilha', alfa: { dex: 151, nivel: 30, x: 350, y: 898, golpes: ['psychic', 'transform', 'auraSphere', 'ancientPower'], aviso: 'Algo rosa se mexeu perto do altar…' } },
    ],
    recompensa: { itens: [['rareCandy', 3], ['stardust', 3]] },
  },
];

export const NPCS = {
  pescador_tupa: {
    troca: {
      quer: { especie: 102 },
      da: { dex: 103, nivel: 35, apelido: 'Coqueiro' },
      falas: {
        pede: ['Esse Exeggutor cresceu comigo. Troco por um Exeggcute. É um Pokémon pequenininho, ovo com cara.'],
        aceita: ['Ele vai estranhar o chão. Mas vai se acostumar.'], recusa: ['Fica para a próxima, então.'],
        falta: ['Não tem Exeggcute aí? Eles andam na mata da ilha.'], depois: ['O Coqueiro está bem? Fica de olho: ele cresce quando ninguém vê.'],
      },
    },
    falas: [
      { se: { missoes: ['sq_coco'] }, linhas: ['Os cocos estavam deliciosos. A festa da balsa foi um sucesso.'] },
      { linhas: ['Aqui o relógio é a maré. Quando sobe, eu vou pescar. Quando desce, eu volto.'] },
    ],
  },
  vo_iara: {
    reage: { especie: { 113: ['Ah, uma Chansey! Mesmo cuidado dos ovos, mesmo carinho. Boa escolha.'], 175: ['Um Togepi! Cuide bem: ele chora quando a gente sai.'] }, qualquer: ['Que gracinha de {pokemon}! Bebê, não é? A gente reconhece pela cara.'] },
  },
  dra_ybi: {
    falas: [
      { se: { missoes: ['sq_tapu_bulu'] }, linhas: ['O guardião das raízes reconheceu você. O mapa do templo está completo. Obrigada.'] },
      { se: { missoes: ['sq_ybi'] }, linhas: ['O mapa do templo está fechado, graças a você. Mas falta a Câmara da Semente: olhe o que sobrou.'] },
      { linhas: ['O Templo das Raízes fica logo ao norte, no meio da Selva Grande. Só chega lá quem escala os paredões de cipó.'] },
    ],
  },
  seu_cacau: {
    falas: [
      { se: { missoes: ['sq_gemeas'] }, linhas: ['E então? Viu quem mora lá? Eu nunca vi. Mas o meu avô jurava que sim.'] },
      { linhas: ['O mar aqui conta histórias para quem sabe ouvir. As Ilhas Gêmeas têm a mais bonita.'] },
    ],
  },
};
