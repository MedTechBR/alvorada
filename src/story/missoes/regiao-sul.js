// Missões e NPCs vivos de Cidade Coral, Vila Lamparina e Cidade Aurora. Formato: docs/missoes.md.
// Coral: o diário do farol é cena da história (jornada/04-coral.js); "O farol pisca errado" saiu (era a mesma ideia, ligada às
// cenas do roteiro antigo). Lamparina: a casa dos Solano é a única missão solta, agora tocada pelo motor de missões.

export const ITENS = {};

export const MISSOES = [
  // cena da história (jornada/04-coral.js): o diário só acompanha pelas flags; a recompensa é da cena
  {
    id: 'sq_diario_farol', titulo: 'O diário do farol', regiao: 'Cidade Coral',
    historia: { ativa: 'nh.sqDiario', feita: 'nh.sqDiarioFim' },
    resumo: 'A Iracema cuidou do Farol Coral por décadas e escreveu tudo num diário, guardado no quarto do topo. Agora o farol gira errado e ela quer que alguém leia.',
    etapas: [
      { tipo: 'flag', flag: 'nh.diarioFarol', lugar: 'farol_topo', texto: 'Suba ao quarto do topo do Farol Coral e procure o diário da Iracema' },
      { tipo: 'flag', flag: 'nh.sqDiarioFim', npc: 'iracema', texto: 'Desça e leve o diário de volta à Iracema, no pé do farol' },
    ],
    recompensa: { texto: 'Rotom (o que estava preso na lâmpada) e 3 Superpoções' },
  },
  {
    id: 'sq_solano', titulo: 'A casa dos Solano', regiao: 'Vila Lamparina', de: 'benta',
    requer: { flags: ['nh.chegouLamparina'] },
    resumo: 'Todos em Lamparina evitam a casa abandonada dos Solano. A Vó Benta cuidou dos dois meninos que moravam lá e acha que o Duskull da casa guarda algo do mais novo.',
    oferta: [
      'Está vendo aquela casa torta, de janela quebrada? Era dos Solano. Eu cuidava dos dois meninos de lá.',
      'Quando a mãe descia para a mina, eu ficava com o Augusto, grande, e o Tiago, pequeno, que tinha medo do escuro. Num inverno o Tiago adoeceu, e a luz da casa nunca mais acendeu.',
      'O Augusto foi embora e nunca voltou. Dizem que um Duskull mora lá. Eu acho que ele guarda algo do Tiago. Vai ver por mim?',
    ],
    aceita: ['A porta não tranca, é só empurrar. Leve a lanterna, que lá dentro é escuro de verdade.'],
    lembrete: ['A casa dos Solano, no canto da vila. Se o Duskull não fugir de você, ele mostra o caminho.'],
    etapas: [
      { tipo: 'chegar', lugar: 'casa_solano', texto: 'Entre na casa abandonada dos Solano, no canto de Vila Lamparina' },
      { tipo: 'chegar', lugar: 'diario_solano', r: 2, texto: 'Siga o Duskull até o quarto dos fundos da casa',
        falas: [
          'No canto do quarto empoeirado, um Duskull flutua quietinho. Ele segura uma máscara de papel de menino, pintada com um sol.',
          'Quando você chega perto, ele não foge. Aponta com a máscara para uma tábua solta do chão.',
          'Debaixo da tábua, um caderno. Na capa: "Diário do Tiago. Proibido ler. Só o Augusto pode."',
          'A última página tem um desenho: um menino grande segurando um sol na mão, e um menino pequeno ao lado. Embaixo, com letra torta: "meu irmão vai acender o mundo".',
          'O Duskull solta a máscara no chão e flutua até o seu ombro. Parece que ele cansou de esperar sozinho.',
        ],
        recompensa: { itens: [['diario_tiago', 1]], pokemon: { dex: 355, nivel: 30, apelido: 'Máscara' } } },
      { tipo: 'falar', npc: 'benta', texto: 'Volte à Vó Benta e mostre o diário do Tiago',
        falas: [
          'Esse desenho… um menino grande com o sol na mão. Só pode ser o Augusto.',
          'O Tiago tinha medo do escuro, e o irmão prometeu acender o mundo inteiro para ele. Aos dez anos, prometeu de verdade.',
          'Aquele homem do rádio, o da inauguração em Coral, é o meu Augusto. Hoje tem luz demais e ninguém dentro dela.',
          'Fique com o diário, filho. Se um dia encontrar esse homem, lembre que ele já foi o menino do desenho.',
        ] },
    ],
    conclusao: ['Agora coma mais um pedaço, filho. Chorar de barriga vazia é pior.'],
    recompensa: { itens: [['spellTag', 1], ['duskBall', 3]] },
  },
];

export const NPCS = {
  mineiro_ca: {
    troca: {
      quer: { especie: 81 }, da: { dex: 524, nivel: 22, apelido: 'Pedrita', item: 'hardStone', golpes: ['tackle', 'harden', 'rockBlast', 'headbutt'] },
      falas: {
        pede: ['Lá embaixo, na mina, um Magnemite me ajudava a achar veio de metal. Troca um comigo? Dou a Pedrita, minha Roggenrola.'],
        aceita: ['Olha ele já farejando metal! A Pedrita é teimosa, mas aguenta qualquer pancada.'],
        recusa: ['Tudo bem. Se achar um Magnemite na Rota 6, volte aqui.'],
        falta: ['Magnemite se acha nas torres da Rota 6. Você não tem um na equipe.'],
        depois: ['O Magnemite achou três veios esta semana! E a Pedrita, firme?'],
      },
    },
  },
  coral_neide: { falas: [{ se: { hora: 'noite' }, linhas: ['De noite eu fecho o tabuleiro, mas o cheiro de dendê fica no ar até a manhã. Quando ela chega.'] }] },
  coral_velho: { falas: [{ se: { insignias: 4 }, linhas: ['Quatro insígnias! No meu tempo, quem tinha quatro já ganhava estátua na praça.'] }] },
  lamp_menino: { reage: { tipo: { ghost: ['AAAH! Um fantasma! … Ah, é seu? Ele é bonzinho? Jura?'] } } },
};
