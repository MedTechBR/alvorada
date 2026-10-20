// Missões e NPCs vivos do Arquipélago das Jandaias (Vila Jandaia, Selva Grande, Templo das Raízes, Ilhas Gêmeas e Miragem).
// Formato: docs/missoes.md. Plano: docs/mundo-expandido.md, seção 10 (Vila Jandaia). Mapa: assets/maps/regioes/jandaia.json
// (gerado por tools/regioes/jandaia.mjs; as posições dos coqueiros abaixo vêm de lá).

export const ITENS = {
  tabuleta_raiz_1: { name: 'Tabuleta de Raiz (1)', color: '#9a8a5a', desc: 'Tabuleta de pedra do Átrio do Templo das Raízes. Tem uma flor e uma raiz gravadas. Era para a Dra. Ybi.' },
  tabuleta_raiz_2: { name: 'Tabuleta de Raiz (2)', color: '#9a8a5a', desc: 'Tabuleta das Galerias Inundadas. Ondas e uma comporta, gravadas à mão. Era para a Dra. Ybi.' },
  tabuleta_raiz_3: { name: 'Tabuleta de Raiz (3)', color: '#9a8a5a', desc: 'Tabuleta da Câmara da Semente. Uma semente e quatro raízes. Era para a Dra. Ybi.' },
  fossil_raiz: { name: 'Fóssil Raiz', color: '#8a6a3a', desc: 'Um fóssil em forma de raiz enrolada. Dizem que um Lileep dormiu nele. Revive no Laboratório de Fósseis de Cidade Buriti.' },
};

// bebês da creche: um ovo por dia, sorteado (agora serviço da Vó Iara em NPCS.vo_iara.diario, não mais missão)
const BEBES = [172, 173, 174, 175, 236, 238, 239, 240, 298, 360, 406, 433, 438, 439, 440, 446, 447, 458, 848];
const ovoDoDia = () => ({ pokemon: { dex: BEBES[Math.floor(Math.random() * BEBES.length)], nivel: 1 }, texto: 'Um ovo chocadinho, ainda com cheiro de palha' });

// Jandaias: o mapa do Templo das Raízes e o guardião (Dra. Ybi). Cocos, capitães, Coqueiro andante, Ilhas Gêmeas e Miragem saíram.
export const MISSOES = [
  {
    id: 'sq_ybi', titulo: 'O mapa do templo', regiao: 'Selva Grande', de: 'dra_ybi',
    resumo: 'A Dra. Ybi descobriu que o Templo das Raízes foi construído em volta de uma câmara escondida. As três tabuletas, uma por andar, mostram o caminho.',
    oferta: [
      'O templo foi construído em volta de uma coisa que ninguém nunca viu. Esse pessoal de capa roxa também sabe: foi isso que eles vieram procurar.',
      'Cada andar guarda uma tabuleta de pedra. Com as três juntas, o mapa mostra onde a coisa está. Eu não durmo desde que descobri.',
      'Escalar e nadar não são problemas para você? Então traga as três antes de mim, e antes deles.',
    ],
    lembrete: ['Uma tabuleta por andar: Átrio, Galerias e Câmara da Semente.'],
    etapas: [
      { tipo: 'ter', item: 'tabuleta_raiz_1', n: 1, texto: 'Pegue a tabuleta do Átrio (1º andar do templo)', falas: ['A primeira está com você.'] },
      { tipo: 'ter', item: 'tabuleta_raiz_2', n: 1, texto: 'Pegue a tabuleta das Galerias Inundadas (2º andar)', falas: ['A segunda também!'] },
      { tipo: 'ter', item: 'tabuleta_raiz_3', n: 1, texto: 'Pegue a tabuleta da Câmara da Semente (3º andar)', falas: ['Três tabuletas. Volte à Dra. Ybi.'] },
      { tipo: 'falar', npc: 'dra_ybi', texto: 'Leve as três tabuletas à Dra. Ybi',
        falas: ['As três! Olha como elas se encaixam… A flor, a onda, a semente. Isso é um mapa.', 'Tem uma câmara escondida, mais funda ainda, e um guardião que acorda quando as quatro raízes recebem golpes de Planta. Eu sei de quem é a casa agora.', 'Aceite isto. A pedra eu achei na sala dos mosaicos; o fóssil dormia debaixo dela. Ficam melhor com você.'] },
    ],
    recompensa: { itens: [['leafStone', 1], ['fossil_raiz', 1], ['venusaurite', 1]], mt: 'leafStorm' },
    proxima: 'sq_tapu_bulu',
  },
  {
    id: 'sq_tapu_bulu', titulo: 'O guardião das raízes', regiao: 'Templo das Raízes', de: 'dra_ybi', requer: { missoes: ['sq_ybi'], insignias: 6 },
    resumo: 'Na Câmara da Semente, depois que as quatro raízes acendem, o guardião do templo desce do teto. Desafio para quem já tem seis insígnias.',
    oferta: [
      'O mapa mostra um quarto lugar: o altar da Câmara da Semente. Lá embaixo desce um guardião quando as quatro raízes acordam.',
      'Ele é mais forte do que qualquer coisa desta ilha. Acorde as raízes com golpes de Planta e tenha cuidado: ele não gosta de visita.',
    ],
    lembrete: ['A Câmara da Semente, no 3º andar. Quatro raízes: golpes de Planta.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_raizes_3', x: 14, y: 12, r: 6, texto: 'Chegue à Câmara da Semente (3º andar do Templo das Raízes)' },
      { tipo: 'vencer', texto: 'Enfrente o guardião que desce das raízes', alfa: { dex: 787, nivel: 60, sala: 'templo_raizes_3', x: 14, y: 9, golpes: ['woodHammer', 'hornLeech', 'brickBreak', 'megahorn'], aviso: 'O guardião das raízes desceu do teto!' } },
    ],
    conclusao: ['Ele reconheceu você. Ninguém abriu aquela câmara em mil anos.'],
    recompensa: { itens: [['miracleSeed', 1], ['rareCandy', 2]] },
  },
];


// Os quatro Capitães das praias da Ilha Jandaia: treinadores de rota (lutam uma vez, na conversa).
const CAPITAES = {
  cap_jandaia_norte: { batalha: { id: 'sq_koko_norte', nome: 'Capitã Sereia', equipe: [[729, 29], [279, 30], [121, 31]] }, dinheiro: 1400,
    falas: ['Eu sou a Capitã do Norte. O mar aqui é manso, mas o meu time não é. Que a maré te leve ao próximo!'], vitoria: ['A maré te levou até mim e te trouxe de volta vencedor.'], derrota: ['A maré levou a sua chance. Volte.'] },
  cap_jandaia_oeste: { batalha: { id: 'sq_koko_oeste', nome: 'Capitão Pôr-do-Sol', equipe: [[741, 29], [733, 30], [663, 31]] }, dinheiro: 1400,
    falas: ['O oeste é onde o dia acaba. O meu time, não.'], vitoria: ['O sol se pôs, e você ficou de pé.'], derrota: ['Escureceu. Volte de manhã.'] },
  cap_jandaia_sul: { batalha: { id: 'sq_koko_sul', nome: 'Capitã Maré Cheia', equipe: [[75, 30], [99, 30], [222, 31]] }, dinheiro: 1500,
    falas: ['No sul a maré sobe duas vezes ao dia. Meus Pokémon sobem mais vezes.'], vitoria: ['A maré baixou e eu junto.'], derrota: ['Maré cheia ganha de qualquer um. Volte na baixa.'] },
  cap_jandaia_leste: { batalha: { id: 'sq_koko_leste', nome: 'Capitão Nascente', equipe: [[735, 30], [743, 31], [754, 32]] }, dinheiro: 1500,
    falas: ['O sol nasce aqui primeiro, depois nasce no resto do mundo. Vamos ver se você acompanha.'], vitoria: ['Os quatro capitães reconheceram você.'], derrota: ['O sol nasce de novo. Volte amanhã.'] },
};

export const NPCS = {
  ...Object.fromEntries(Object.entries(CAPITAES).map(([id, t]) => [id, { treinador: { ...t, depois: t.vitoria } }])),
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
      { linhas: ['Aqui o relógio é a maré. Quando sobe, eu vou pescar. Quando desce, eu volto.'] },
    ],
  },
  vo_iara: {
    diario: { recompensa: ovoDoDia, falas: ['Toda manhã sobra um ovo no cesto. Não sei de quem é, só sei que alguém tem que cuidar. Este está quentinho. Cuida dele como se fosse seu.'], depois: ['Amanhã o cesto dá outro. Passa aqui.'] },
    reage: { especie: { 113: ['Ah, uma Chansey! Mesmo cuidado dos ovos, mesmo carinho. Boa escolha.'], 175: ['Um Togepi! Cuide bem: ele chora quando a gente sai.'] }, qualquer: ['Que gracinha de {pokemon}! Bebê, não é? A gente reconhece pela cara.'] },
  },
  dra_ybi: {
    falas: [
      { se: { missoes: ['sq_tapu_bulu'] }, linhas: ['O guardião das raízes reconheceu você. O mapa do templo está completo. Obrigada.'] },
      { se: { missoes: ['sq_ybi'] }, linhas: ['O mapa do templo está fechado, graças a você. Falta a Câmara da Semente: volte quando tiver seis insígnias.'] },
      { linhas: ['O Templo das Raízes fica logo ao norte, no meio da Selva Grande. Só chega lá quem escala os paredões de cipó.'] },
    ],
  },
  seu_cacau: {
    falas: [
      { linhas: ['O mar aqui conta histórias para quem sabe ouvir. As Ilhas Gêmeas têm a mais bonita.'] },
    ],
  },
};
