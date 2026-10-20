// Missões e NPCs vivos do Arquipélago das Jandaias (Vila Jandaia, Selva Grande, Templo das Raízes, Ilhas Gêmeas e Miragem).
// Formato: docs/missoes.md. Plano: docs/mundo-expandido.md, seção 10 (Vila Jandaia). Mapa: assets/maps/regioes/jandaia.json
// (gerado por tools/regioes/jandaia.mjs; as posições dos coqueiros abaixo vêm de lá).

export const ITENS = {
  decalque_ybi: { name: 'Decalque do Altar', color: '#9a8a5a', desc: 'Papel de seda com o mapa gravado em volta do altar da Câmara da Semente, copiado a carvão. Era para a Dra. Ybi.' },
  fossil_raiz: { name: 'Fóssil Raiz', color: '#8a6a3a', desc: 'Um fóssil em forma de raiz enrolada. Dizem que um Lileep dormiu nele. Revive no Laboratório de Fósseis de Cidade Buriti.' },
};

// bebês da creche: um ovo por dia, sorteado (agora serviço da Vó Iara em NPCS.vo_iara.diario, não mais missão)
const BEBES = [172, 173, 174, 175, 236, 238, 239, 240, 298, 360, 406, 433, 438, 439, 440, 446, 447, 458, 848];
const ovoDoDia = () => ({ pokemon: { dex: BEBES[Math.floor(Math.random() * BEBES.length)], nivel: 1 }, texto: 'Um ovo chocadinho, ainda com cheiro de palha' });

// Jandaias: o mapa do Templo das Raízes e o guardião (Dra. Ybi). Cocos, capitães, Coqueiro andante, Ilhas Gêmeas e Miragem saíram.
export const MISSOES = [
  {
    id: 'sq_ybi', titulo: 'O mapa do templo', regiao: 'Selva Grande', de: 'dra_ybi',
    versao: 2,
    resumo: 'A Dra. Ybi acredita que o Templo das Raízes foi construído em volta de uma câmara escondida. O mapa está gravado no altar da Câmara da Semente, no 3º andar, e a Equipe Crepúsculo também o procura.',
    oferta: [
      'Este templo foi construído em volta de uma câmara que ninguém nunca viu. O pessoal de capa roxa sabe, e veio procurá-la.',
      'Os antigos gravaram o mapa dela no altar da Câmara da Semente, no 3º andar. Eu nunca passei das galerias inundadas.',
      'Você escala e nada, então chega lá. Leve este papel e este carvão, e copie o altar antes que eles cheguem.',
    ],
    aceita: ['Passe o carvão de leve, que o papel de seda rasga fácil. E cuidado com o pessoal de roxo.'],
    lembrete: ['O altar da Câmara da Semente, no 3º andar do templo. Carvão de leve, que o papel rasga.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_raizes_3', x: 14, y: 12, r: 6, texto: 'Suba à Câmara da Semente (3º andar do Templo das Raízes) e copie o mapa do altar',
        falas: [
          ['narrador', 'Em volta do altar, a pedra tem desenhos fundos: uma flor, uma onda, uma semente e quatro raízes.'],
          ['narrador', 'As raízes descem para um quarto lugar que não aparece em nenhum andar do templo.'],
          ['narrador', 'Você passa o carvão sobre o papel de seda. No teto, as raízes estalam baixinho, como se algo tivesse acordado.'],
        ],
        recompensa: { itens: [['decalque_ybi', 1]] } },
      { tipo: 'entregar', npc: 'dra_ybi', item: 'decalque_ybi', texto: 'Leve o decalque do altar à Dra. Ybi, no acampamento da Selva Grande',
        falas: ['A flor, a onda, a semente… e as quatro raízes. Isso é um mapa, e você o trouxe inteiro.', 'Ele aponta para uma câmara mais funda. Dizem que um guardião mora lá e só acorda com golpes de Planta nas quatro raízes.', 'Aceite isto. A pedra eu achei na sala dos mosaicos, e o fóssil dormia debaixo dela. Com você, servem de algo.'] },
    ],
    recompensa: { itens: [['leafStone', 1], ['fossil_raiz', 1], ['venusaurite', 1]], mt: 'leafStorm' },
    proxima: 'sq_tapu_bulu',
  },
  {
    id: 'sq_tapu_bulu', titulo: 'O guardião das raízes', regiao: 'Templo das Raízes', de: 'dra_ybi', requer: { missoes: ['sq_ybi'], insignias: 6 },
    resumo: 'Com o mapa da Dra. Ybi, a Câmara da Semente ganha sentido: acordadas as quatro raízes, o guardião do templo desce do teto. Desafio para quem já tem seis insígnias.',
    oferta: [
      'O seu decalque mostra o quarto lugar, bem debaixo do altar. É de lá que o guardião do templo desce.',
      'Ele é mais forte que tudo nesta ilha e não gosta de visita. Acorde as raízes com golpes de Planta e vá preparado.',
    ],
    aceita: ['Leve Pokémon que aguentem um golpe forte, e acorde as raízes uma a uma. Eu espero aqui.'],
    lembrete: ['Câmara da Semente, 3º andar do templo. Golpes de Planta nas quatro raízes e o guardião desce.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_raizes_3', x: 14, y: 12, r: 6, texto: 'Volte à Câmara da Semente (3º andar do Templo das Raízes)' },
      { tipo: 'vencer', texto: 'Enfrente o guardião que desce do teto da câmara', alfa: { dex: 787, nivel: 60, sala: 'templo_raizes_3', x: 14, y: 9, golpes: ['woodHammer', 'hornLeech', 'brickBreak', 'megahorn'], aviso: 'O guardião das raízes desceu do teto!' } },
    ],
    conclusao: ['O guardião se curva para você e volta às raízes. Ninguém via aquela câmara aberta havia mil anos.'],
    recompensa: { itens: [['miracleSeed', 1], ['rareCandy', 2]] },
  },
];


// Os quatro Capitães das praias da Ilha Jandaia: treinadores de rota (lutam uma vez, na conversa).
const CAPITAES = {
  cap_jandaia_norte: { batalha: { id: 'sq_koko_norte', nome: 'Capitã Sereia', equipe: [[729, 29], [279, 30], [121, 31]] }, dinheiro: 1400,
    falas: ['Sou a Capitã do Norte. O mar aqui é manso, mas o meu time não é.'], vitoria: ['A maré te trouxe até mim e te levou embora vencedor. Siga em frente.'], derrota: ['A maré levou a sua chance. Volte quando ela subir.'] },
  cap_jandaia_oeste: { batalha: { id: 'sq_koko_oeste', nome: 'Capitão Pôr-do-Sol', equipe: [[741, 29], [733, 30], [663, 31]] }, dinheiro: 1400,
    falas: ['O oeste é onde o dia acaba. O meu time, não.'], vitoria: ['O sol se pôs e você ficou de pé. Ainda bem que ele volta.'], derrota: ['Escureceu para você. Volte de manhã.'] },
  cap_jandaia_sul: { batalha: { id: 'sq_koko_sul', nome: 'Capitã Maré Cheia', equipe: [[75, 30], [99, 30], [222, 31]] }, dinheiro: 1500,
    falas: ['No sul a maré sobe duas vezes ao dia. Os meus Pokémon sobem mais vezes.'], vitoria: ['A maré baixou, e eu junto com ela.'], derrota: ['Maré cheia ganha de qualquer um. Volte na baixa.'] },
  cap_jandaia_leste: { batalha: { id: 'sq_koko_leste', nome: 'Capitão Nascente', equipe: [[735, 30], [743, 31], [754, 32]] }, dinheiro: 1500,
    falas: ['O sol nasce aqui primeiro e só depois no resto do mundo. Vamos ver se você acompanha.'], vitoria: ['Você acompanhou o nascente. Pode seguir pelas praias.'], derrota: ['O sol nasce de novo amanhã, e você também. Volte.'] },
};

export const NPCS = {
  ...Object.fromEntries(Object.entries(CAPITAES).map(([id, t]) => [id, { treinador: { ...t, depois: t.vitoria } }])),
  pescador_tupa: {
    troca: {
      quer: { especie: 102 },
      da: { dex: 103, nivel: 35, apelido: 'Coqueiro' },
      falas: {
        pede: ['Este Exeggutor cresceu comigo. Troco por um Exeggcute, aquele Pokémon pequenininho, com cara de ovo.'],
        aceita: ['Ele vai estranhar o chão novo, mas se acostuma. Cuide dele.'], recusa: ['Tudo bem, fica para a próxima.'],
        falta: ['Você não tem um Exeggcute? Eles andam pela mata da ilha.'], depois: ['O Coqueiro está bem? Fique de olho, que ele cresce quando ninguém vê.'],
      },
    },
    falas: [
      { linhas: ['Aqui o relógio é a maré. Quando sobe, eu vou pescar. Quando desce, eu volto para casa.'] },
    ],
  },
  vo_iara: {
    diario: { recompensa: ovoDoDia, falas: ['Toda manhã aparece um ovo no cesto. Não sei de quem é, só sei que alguém tem que cuidar.', 'Este ainda está quentinho. Cuide dele como se fosse seu.'], depois: ['Amanhã o cesto dá outro. Passe aqui.'] },
    reage: { especie: { 113: ['Ah, uma Chansey! Ela cuida de ovo melhor que eu. Boa companheira.'], 175: ['Um Togepi! Cuide bem dele, que ele chora quando a gente sai.'] }, qualquer: ['Que gracinha, esse {pokemon}! Ainda é bebê? A gente reconhece pela cara.'] },
  },
  dra_ybi: {
    falas: [
      { se: { missoes: ['sq_tapu_bulu'] }, linhas: ['O guardião das raízes reconheceu você, e o mapa do templo está completo. Obrigada por tudo.'] },
      { se: { missoes: ['sq_ybi'] }, linhas: ['O mapa do templo está completo, graças a você. Falta só acordar o guardião, e isso pede seis insígnias.'] },
      { linhas: ['O Templo das Raízes fica logo ao norte, no meio da Selva Grande. Só chega lá quem escala os paredões de cipó.'] },
    ],
  },
  seu_cacau: {
    falas: [
      { linhas: ['O mar aqui conta histórias para quem sabe ouvir. Fique um fim de tarde na praia e escute.'] },
    ],
  },
};
