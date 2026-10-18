// Missões e NPCs vivos do Bosque Sussurrante e da Vila Sussurro. Formato: docs/missoes.md.
// Tito e Seu Juca são moradores que o roteiro assume no capítulo 2 (elenco.js, `substitui`): o id continua o mesmo.

export const ITENS = {
  viola_juca: { name: 'Viola do Seu Juca', color: '#b8824e', desc: 'Viola de madeira caída do bosque, com cordas de seda de Spinarak. Quando toca, as árvores parecem responder.' },
};

export const MISSOES = [
  {
    id: 'sq_pipoca', titulo: 'Cadê o Pipoca?', regiao: 'Bosque Sussurrante', de: 'tito',
    resumo: 'O Skwovet do Tito, o Pipoca, foi buscar nozes no bosque e não voltou. Uma trilha de cascas roídas sai da vila.',
    // a cena "tito_pipoca" do roteiro (cap02) põe flags.sq_pipoca = 'ativa' e a missão começa sozinha; sem roteiro, o Tito oferece
    oferta: ['O Pipoca sumiu! Ele é um Skwovet e foi buscar noz no bosque e não voltou.', 'Você procura ele pra mim? Ele deixa casca de noz por onde passa.'],
    lembrete: ['Achou o Pipoca? Ele deixa casca de noz por onde passa!'],
    etapas: [
      { tipo: 'achar', pontos: [[185, 233], [197, 236], [213, 246]], achou: 'Uma casca de noz roidinha. O Pipoca passou por aqui!', texto: 'Siga as cascas de noz pelo bosque', rotulo: 'Cascas' },
      { tipo: 'vencer', alfa: { dex: 820, nivel: 17, x: 228, y: 243, aviso: 'Um Pokémon enorme de bochechas cheias defende as nozes!' }, texto: 'Algo grande guarda o último monte de nozes: vença-o',
        falas: ['O Pokémon enorme recua… e, de trás dele, sai um Skwovet pequenininho com as bochechas cheias.', 'Era a mãe do Pipoca! Ela só estava guardando o filhote. O Pipoca pula no seu ombro.'] },
      { tipo: 'falar', npc: 'tito', texto: 'Leve o Pipoca de volta ao Tito',
        falas: ['PIPOCA! Você voltou! Eu não tô bravo. Só um pouquinho.', 'Ele achou a mamãe dele? Que bom… Toma, é o meu ovo da sorte. Pra você crescer forte igual a Lia.'] },
    ],
    recompensa: { itens: [['luckyEgg', 1]] },
  },
  {
    id: 'sq_viola', titulo: 'A viola do Seu Juca', regiao: 'Vila Sussurro', de: 'juca',
    resumo: 'Seu Juca está terminando uma viola com madeira caída do bosque. Faltam as cordas de seda e o tom certo.',
    oferta: ['Esta viola está quase pronta. Falta corda. E corda boa é de seda de Spinarak.', 'Os Spinarak do bosque soltam seda quando perdem uma batalha. Me arruma três? Depois eu te conto o segredo do tom.'],
    lembrete: ['Seda de três Spinarak do bosque, e depois o zumbido de um Combee. Sem pressa: madeira boa espera.'],
    etapas: [
      { tipo: 'derrotar', especie: 167, n: 3, lugar: 'bosque_sussurrante', texto: 'Vença 3 Spinarak selvagens no Bosque Sussurrante', rotulo: 'Seda',
        falas: ['Você juntou fios de seda brilhante, finos e fortes.'] },
      { tipo: 'mostrar', npc: 'juca', especie: 415, texto: 'Mostre um Combee ao Seu Juca (o zumbido afina a viola)',
        falta: ['Seda boa! Agora o tom: só o zumbido de um Combee afina esta viola. Traga um na equipe.'],
        falas: ['Escuta… bzzz… Isso! O {pokemon} acertou o tom na primeira.', 'Pronto. Escuta como as árvores respondem.'] },
    ],
    conclusao: [['narrador', 'Seu Juca toca. Do lado de fora, as folhas do bosque balançam no mesmo ritmo.'], 'Fique com ela. Viola parada é viola triste.'],
    recompensa: { itens: [['viola_juca', 1], ['silverPowder', 1]] },
  },
  {
    id: 'sq_ronda', titulo: 'Ronda noturna', regiao: 'Bosque Sussurrante', de: 'bosque_guia',
    requer: { hora: 'noite' },
    resumo: 'O Guarda-florestal faz a ronda da noite pelas trilhas do bosque. Hoje ele precisa de reforço.',
    oferta: ['De noite o bosque fica diferente. Tem luz estranha nas trilhas desde que os agrimensores passaram.', 'Me ajuda na ronda? Três pontos: a trilha do jequitibá, a bifurcação e a clareira do sul. De noite, hein.'],
    lembrete: ['A ronda é de noite: trilha do jequitibá, bifurcação e clareira do sul.'],
    etapas: [
      { tipo: 'chegar', lugar: 'trilha_jequitiba__leste', r: 3, se: { hora: 'noite' }, texto: 'De noite, passe pela trilha do jequitibá', falas: ['Tudo quieto na trilha. Só os Hoothoot de olho em você.'] },
      { tipo: 'chegar', lugar: 'bifurcacao__leste', r: 3, se: { hora: 'noite' }, texto: 'De noite, passe pela bifurcação', falas: ['Na bifurcação, uma estaca da Aurora brilha fraquinha no chão. Esquisito.'] },
      { tipo: 'chegar', lugar: 'clareira_sul__leste', r: 3, se: { hora: 'noite' }, texto: 'De noite, passe pela clareira do sul', falas: ['A clareira está em paz. Vaga-lumes por todo lado.'] },
      { tipo: 'falar', npc: 'bosque_guia', texto: 'Volte ao Guarda-florestal', falas: ['Estaca da Aurora na bifurcação? Vou anotar. Obrigado pela ronda. Tome, para enxergar no escuro.'] },
    ],
    recompensa: { itens: [['duskBall', 3]] },
  },
];

export const NPCS = {
  anciao_sussurro: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['De noite os jequitibás falam mais alto. Hoje eles reclamam do frio da manhã que não chega.'] },
      { se: { hora: 'manha' }, linhas: ['Bom dia. Os galhos estão virados para o leste, esperando. Eles sentem que o sol atrasou.'] },
      { se: { missao: 'sq_carta' }, linhas: ['Releio a carta da minha neta todo dia. Obrigada de novo, viu?'] },
    ],
  },
  kid_sussurro: {
    reage: {
      tipo: { bug: ['Um Pokémon Inseto! Ele pode brincar com o meu Combee? Bzzzz!'] },
      qualquer: ['O seu {pokemon} não é inseto… mas é legal mesmo assim.'],
    },
  },
  tito: { falas: [{ se: { missao: 'sq_pipoca' }, linhas: ['O Pipoca agora dorme no meu chapéu, junto com o Caterpie. Tá apertado, mas eles gostam.'] }] },
  juca: { falas: [{ se: { missao: 'sq_viola' }, linhas: ['Já tocou a viola no bosque? As árvores gostam de música. Os Spinarak, nem tanto.'] }] },
};
