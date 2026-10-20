// Missões e NPCs vivos do Bosque Sussurrante e da Vila Sussurro. Formato: docs/missoes.md.
// Seu Juca é morador que o roteiro assume (elenco.js, `substitui`): o id continua o mesmo.

export const ITENS = {
  viola_juca: { name: 'Viola do Seu Juca', color: '#b8824e', desc: 'Viola de madeira caída do bosque, com cordas de seda de Spinarak. Quando toca, as árvores parecem responder.' },
};

// Vila Sussurro: só a viola do Seu Juca. A busca do Pipoca virou cena da história (jornada/02-sussurro.js) e a ronda saiu.
export const MISSOES = [
  {
    id: 'sq_viola', titulo: 'A viola do Seu Juca', regiao: 'Vila Sussurro', de: 'juca',
    resumo: 'Seu Juca não toca desde que o sol começou a atrasar: as árvores pararam de responder. Ele quer terminar a viola da esposa com seda de Spinarak e o zumbido de um Combee.',
    oferta: [
      'Esta viola era da minha Zefa. Ela tocava de manhã, no bosque, e as árvores respondiam. Juro por Deus.',
      'Depois que o sol começou a atrasar, as árvores pararam. Eu parei também. A viola ficou sem corda.',
      'Corda boa é seda de Spinarak, e o tom só um Combee acerta. Me traz as duas coisas? Eu quero ouvir o bosque responder mais uma vez.',
    ],
    aceita: ['Spinarak solta seda quando perde a batalha. Três já dão corda. Depois o Combee, para afinar.'],
    lembrete: ['Seda de três Spinarak do bosque, e depois o zumbido de um Combee. Sem pressa: madeira boa espera.'],
    etapas: [
      { tipo: 'derrotar', especie: 167, n: 3, lugar: 'bosque_sussurrante', texto: 'Vença 3 Spinarak selvagens no Bosque Sussurrante', rotulo: 'Seda',
        falas: ['Você juntou fios de seda brilhante, finos e fortes.'] },
      { tipo: 'mostrar', npc: 'juca', especie: 415, texto: 'Mostre um Combee ao Seu Juca (o zumbido afina a viola)',
        falta: ['Seda boa! Agora o tom: só o zumbido de um Combee afina esta viola. Traga um na equipe.'],
        falas: ['Escuta… bzzz… Isso! O {pokemon} acertou o tom na primeira.', 'Pronto. A Zefa ia gostar de ver.'] },
    ],
    conclusao: [
      [ 'narrador', 'Seu Juca toca a primeira nota. Do lado de fora, as folhas do bosque balançam no mesmo ritmo, uma a uma, como quem responde.' ],
      'Ela respondeu. A árvore dela respondeu. Obrigado, rapaz.',
      'Fique com ela. Viola parada é viola triste. Eu toco de ouvido mesmo.',
    ],
    recompensa: { itens: [['viola_juca', 1], ['silverPowder', 1]] },
  },
];

export const NPCS = {
  anciao_sussurro: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['De noite os jequitibás falam mais alto. Hoje eles reclamam do frio da manhã que não chega.'] },
      { se: { hora: 'manha' }, linhas: ['Bom dia. Os galhos estão virados para o leste, esperando. Eles sentem que o sol atrasou.'] },
    ],
  },
  kid_sussurro: {
    reage: {
      tipo: { bug: ['Um Pokémon Inseto! Ele pode brincar com o meu Combee? Bzzzz!'] },
      qualquer: ['O seu {pokemon} não é inseto… mas é legal mesmo assim.'],
    },
  },
  juca: { falas: [{ se: { missao: 'sq_viola' }, linhas: ['Já tocou a viola no bosque? As árvores gostam de música. Os Spinarak, nem tanto.'] }] },
};
