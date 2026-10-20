// Missões e NPCs vivos do Bosque Sussurrante e da Vila Sussurro. Formato: docs/missoes.md.
// Seu Juca é morador que o roteiro assume (elenco.js, `substitui`): o id continua o mesmo.

export const ITENS = {
  viola_juca: { name: 'Viola do Seu Juca', color: '#b8824e', desc: 'A viola da Zefa, com a corda que ela deixou no jequitibá. Quando toca, as árvores do bosque respondem.' },
  corda_zefa: { name: 'Corda da Zefa', color: '#dfe6f0', desc: 'Uma corda de viola de seda de Spinarak, enrolada há anos nos galhos do jequitibá da Zefa. Vibra sozinha com o vento.' },
};

// Vila Sussurro: a viola do Seu Juca (diário) e o Pipoca do Tito (cenas da história em jornada/02-sussurro.js, que o
// diário acompanha pelas flags). A ronda e as tarefas de "vença N" saíram.
export const MISSOES = [
  {
    id: 'sq_viola', titulo: 'A viola do Seu Juca', regiao: 'Vila Sussurro', de: 'juca', versao: 2,
    resumo: 'A viola do Seu Juca era da Zefa, a esposa dele, que tocava debaixo do jequitibá no bosque e ouvia as árvores responderem. Falta a corda, que ela deixou enrolada num galho. Desde que o sol atrasa, o bosque anda calado.',
    oferta: [
      'Esta viola era da minha Zefa. Ela tocava de manhã, debaixo do jequitibá dela, no bosque. E as árvores respondiam, juro por Deus.',
      'Hoje a viola está muda: a corda boa ela deixou lá, enrolada num galho. Dizia que a árvore afinava melhor que qualquer um.',
      'Depois que ela se foi, nunca mais tive coragem de ir. E com o sol atrasando, o bosque calou. Você busca a corda para mim?',
    ],
    aceita: ['O jequitibá da Zefa fica na trilha do bosque, logo depois da entrada. Tem um Z e um J riscados no tronco.'],
    lembrete: ['O jequitibá da Zefa, na trilha do bosque. A corda está num galho, com teia de Spinarak por cima, aposto.'],
    etapas: [
      { tipo: 'chegar', lugar: 'trilha_jequitiba', r: 3, texto: 'Ache o jequitibá da Zefa, na trilha do Bosque Sussurrante, e pegue a corda dela',
        falas: [
          ['narrador', 'Um jequitibá velho, com um Z e um J riscados no tronco. Num galho baixo, uma teia de Spinarak segura uma corda de viola enrolada.'],
          ['narrador', 'Quando o vento passa, a corda vibra sozinha numa nota só. Os Spinarak da teia param para ouvir e deixam você soltar a corda.'],
        ],
        recompensa: { itens: [['corda_zefa', 1]] } },
      { tipo: 'entregar', npc: 'juca', item: 'corda_zefa', texto: 'Leve a corda da Zefa ao Seu Juca, na Vila Sussurro',
        falas: ['É a corda dela. Ainda está afinada depois de todo esse tempo. A Zefa sabia o que fazia.'] },
    ],
    conclusao: [
      [ 'narrador', 'Seu Juca prende a corda e toca a primeira nota. Do lado de fora, as folhas do bosque balançam no mesmo ritmo, uma a uma, como quem responde.' ],
      'Ela respondeu. A árvore dela respondeu. Obrigado, filho.',
      'Fique com a viola. Viola parada é viola triste, e a Zefa ia querer ela andando por aí. Eu faço outra.',
    ],
    recompensa: { itens: [['viola_juca', 1], ['silverPowder', 1]] },
  },
  // cenas da história (jornada/02-sussurro.js): o diário só acompanha, pelas flags; a recompensa é da cena
  {
    id: 'sq_pipoca', titulo: 'Cadê o Pipoca?', regiao: 'Vila Sussurro',
    historia: { ativa: 'nh.sqPipoca', feita: 'nh.sqPipocaFim' },
    resumo: 'O Tito está aflito: o Pipoca, o Skwovet dele, saiu de manhã atrás de nozes no bosque e não voltou.',
    etapas: [
      { tipo: 'flag', flag: 'nh.achouPipoca', lugar: 'mata_jequitibas', texto: 'Procure o Pipoca na Mata dos Jequitibás, a oeste do bosque' },
      { tipo: 'flag', flag: 'nh.sqPipocaFim', npc: 'tito', texto: 'Volte à Vila Sussurro e leve o Pipoca ao Tito' },
    ],
    recompensa: { texto: 'Ovo da Sorte, presente do Tito' },
  },
];

export const NPCS = {
  anciao_sussurro: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['De noite os jequitibás falam mais alto. Hoje reclamam do frio de uma manhã que não chega.'] },
      { se: { hora: 'manha' }, linhas: ['Bom dia. Os galhos estão todos virados para o leste, esperando. Eles sentem que o sol atrasou.'] },
    ],
  },
  kid_sussurro: {
    reage: {
      tipo: { bug: ['Um Pokémon Inseto! Ele pode brincar com o meu Combee? Bzzzz!'] },
      qualquer: ['O seu {pokemon} não é inseto, mas é legal do mesmo jeito!'],
    },
  },
  juca: { falas: [{ se: { missao: 'sq_viola' }, linhas: ['As árvores do bosque gostam de música. A Zefa dizia que elas tinham memória.'] }] },
};
