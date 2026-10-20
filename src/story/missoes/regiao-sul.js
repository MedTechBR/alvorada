// Missões e NPCs vivos de Cidade Coral, Vila Lamparina e Cidade Aurora. Formato: docs/missoes.md.
// Coral: o diário do farol é cena da história (jornada/04-coral.js); "O farol pisca errado" saiu (era a mesma ideia, ligada às
// cenas do roteiro antigo). Lamparina: a casa dos Solano é a única missão solta, agora tocada pelo motor de missões.

export const ITENS = {};

export const MISSOES = [
  // cena da história (jornada/04-coral.js): o diário só acompanha pelas flags; a recompensa é da cena
  {
    id: 'sq_diario_farol', titulo: 'O diário do farol', regiao: 'Cidade Coral',
    historia: { ativa: 'nh.sqDiario', feita: 'nh.sqDiarioFim' },
    resumo: 'A Iracema escreveu quarenta anos de diário no quarto do topo do Farol Coral, e agora quer que alguém leia.',
    etapas: [
      { tipo: 'flag', flag: 'nh.diarioFarol', lugar: 'farol_topo', texto: 'Suba ao quarto do topo do Farol Coral e ache o diário da Iracema' },
      { tipo: 'flag', flag: 'nh.sqDiarioFim', npc: 'iracema', texto: 'Leve o diário de volta à Iracema, no pé do farol' },
    ],
    recompensa: { texto: 'Rotom (o que estava preso na lâmpada) e 3 Superpoções' },
  },
  {
    id: 'sq_solano', titulo: 'A casa dos Solano', regiao: 'Vila Lamparina', de: 'benta',
    requer: { flags: ['nh.chegouLamparina'] },
    resumo: 'Todos evitam a casa abandonada dos Solano. A Vó Benta cuidou dos dois meninos que moravam lá e quer saber o que o Duskull da casa guarda.',
    oferta: [
      'Está vendo a casa torta, de janela quebrada? Era dos Solano. Dois meninos moravam ali: o Augusto, grande, e o Tiago, pequeno, que tinha medo do escuro.',
      'Eu cuidava dos dois quando a mãe descia para a mina. Num inverno o Tiago adoeceu, e a casa nunca mais acendeu a luz. O Augusto foi embora e nunca voltou.',
      'Dizem que um Duskull mora lá dentro e não deixa ninguém passar. Eu acho que ele está guardando alguma coisa do menino. Vai ver, por mim?',
    ],
    aceita: ['A casa não tranca. É só empurrar a porta. E acende a lanterna, que lá é escuro de verdade.'],
    lembrete: ['A casa dos Solano, no canto da vila. Se o Duskull não fugir, ele mostra o caminho.'],
    etapas: [
      { tipo: 'chegar', lugar: 'casa_solano', texto: 'Entre na casa abandonada dos Solano, em Vila Lamparina' },
      { tipo: 'chegar', lugar: 'diario_solano', r: 2, texto: 'Siga o Duskull até o quarto dos fundos',
        falas: [
          'No canto do quarto empoeirado, um Duskull flutua quietinho. Ele segura uma máscara de papel de menino, pintada com um sol.',
          'Quando você chega perto, ele não foge. Aponta com a máscara para uma tábua solta do chão.',
          'Debaixo da tábua, um caderno. Na capa: "Diário do Tiago. Proibido ler. Só o Augusto pode."',
          'A última página tem um desenho: um menino grande segurando um sol na mão, e um menino pequeno ao lado. Embaixo, com letra torta: "meu irmão vai acender o mundo".',
          'O Duskull solta a máscara no chão e flutua até o seu ombro. Parece que ele cansou de esperar sozinho.',
        ],
        recompensa: { itens: [['diario_tiago', 1]], pokemon: { dex: 355, nivel: 30, apelido: 'Máscara' } } },
      { tipo: 'falar', npc: 'benta', texto: 'Leve o diário do Tiago à Vó Benta',
        falas: [
          'O Augusto, que desenho é esse? Esse menino grande com o sol na mão…',
          'O Tiago tinha medo do escuro, e o irmão prometeu acender o mundo inteiro para ele nunca mais ficar no escuro. Prometeu de verdade, aos dez anos de idade.',
          'Hoje o Augusto tem luz demais e nenhuma pessoa dentro dela. O diário é seu, filho. Se um dia você encontrar esse homem, lembre que um dia ele foi o menino do desenho.',
        ] },
    ],
    conclusao: ['Agora come mais um pedaço. Chorar de barriga vazia é pior.'],
    recompensa: { itens: [['spellTag', 1], ['duskBall', 3]] },
  },
];

export const NPCS = {
  mineiro_ca: {
    troca: {
      quer: { especie: 81 }, da: { dex: 524, nivel: 22, apelido: 'Pedrita', item: 'hardStone', golpes: ['tackle', 'harden', 'rockBlast', 'headbutt'] },
      falas: {
        pede: ['Lá embaixo da mina, um Magnemite ajudava a achar veio de metal. Troca um comigo? Dou a Pedrita, minha Roggenrola.'],
        aceita: ['Ele já tá farejando metal! A Pedrita é teimosa, mas segura qualquer pancada.'],
        recusa: ['Tudo bem. Se achar um Magnemite na Rota 6, volta aqui.'],
        falta: ['Magnemite eu acho nas torres da Rota 6. Você não tem um na equipe.'],
        depois: ['O Magnemite achou três veios essa semana! E a Pedrita, firme?'],
      },
    },
  },
  coral_neide: { falas: [{ se: { hora: 'noite' }, linhas: ['De noite eu fecho o tabuleiro, mas o cheiro de dendê fica até de manhã.'] }] },
  coral_velho: { falas: [{ se: { insignias: 4 }, linhas: ['Quatro insígnias! No meu tempo, quem tinha quatro já tinha estátua na praça.'] }] },
  lamp_menino: { reage: { tipo: { ghost: ['AAAH! Um fantasma! … Ah, é seu? Ele é bonzinho? Jura?'] } } },
};
