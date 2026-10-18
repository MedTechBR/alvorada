// Missões e NPCs vivos de Vila Alvorada e da Rota 1 (Campos de Lúmen). Formato: docs/missoes.md.
// NPCs pelo id do mapa (assets/maps/alvorada.json, "people", também dentro dos interiores).

export const ITENS = {
  cesta_paes: { name: 'Cesta de Pães', color: '#e0a050', desc: 'Pão de queijo quentinho da Padaria Pão do Sol, para a Dona Cida, da feira de Campina.' },
};

export const MISSOES = [
  {
    id: 'sq_relogios', titulo: 'Os relógios do Seu Zé', regiao: 'Vila Alvorada', de: 'seu_ze',
    requer: { flags: ['starter'] },
    resumo: 'Cada relógio da Rádio Alvorada marca uma hora diferente. Seu Zé quer saber como está o sol longe da vila, de manhã.',
    oferta: [
      'Psiu! Você que vai sair por aí… me faz um favor de cientista?',
      'Cada relógio meu marca uma hora. Preciso de alguém que veja o sol da Lagoa Dourada de manhã, longe das antenas.',
      'Vai lá antes do meio-dia, olha bem o céu e volta me contar. Topa?',
    ],
    aceita: ['Isso! A Lagoa Dourada fica no norte da Rota 1, no meio dos campos. De manhã, hein!'],
    lembrete: ['A Lagoa Dourada, de manhã! Os relógios não vão se acertar sozinhos.'],
    etapas: [
      { tipo: 'chegar', lugar: 'lagoa_dourada', r: 6, se: { hora: 'manha' }, texto: 'Vá à Lagoa Dourada de manhã (antes do meio-dia)',
        falas: ['O sol se espelha na lagoa. Ele está mais baixo do que devia para esta hora, como se tivesse dormido demais.', 'Você guarda o que viu para contar ao Seu Zé.'] },
      { tipo: 'falar', npc: 'seu_ze', texto: 'Conte ao Seu Zé o que viu na lagoa',
        falas: ['E então? Baixo? Mais baixo do que devia?', 'Eu sabia! Não são os meus relógios. É o sol que está atrasado.', 'Tome, isto é para quem tem paciência com o tempo.'] },
    ],
    recompensa: { itens: [['timerBall', 3]], flags: { zeHoraCerta: true } },
  },
  {
    id: 'sq_cesta', titulo: 'Pão quentinho para Campina', regiao: 'Vila Alvorada', de: 'padeiro',
    requer: { flags: ['balls'] },
    resumo: 'Seu Ramiro, da Padaria Pão do Sol, quer mandar uma cesta de pão de queijo para a Dona Cida, na feira de Campina.',
    oferta: ['Vai para Campina? Então leva esta cesta para a Dona Cida, da feira. Ela troca meu pão pelas abóboras dela.', 'Pode levar?'],
    itensIniciais: [['cesta_paes', 1]],
    aceita: ['Cuidado para não comer no caminho! Eu contei: são doze.'],
    lembrete: ['A Dona Cida fica na praça de Campina, perto do Mercado.'],
    etapas: [
      { tipo: 'entregar', npc: 'feirante', item: 'cesta_paes', texto: 'Entregue a cesta de pães à Dona Cida, na feira de Campina',
        pergunta: ['Isso é cheiro de pão de queijo do Ramiro? Você trouxe a cesta?'],
        falas: ['Doze! Ele sempre manda doze. E ainda quentinhos. Diga ao Ramiro que as abóboras vão na próxima carroça.'] },
      { tipo: 'falar', npc: 'padeiro', texto: 'Volte à Padaria Pão do Sol e fale com o Seu Ramiro',
        falas: ['Chegaram quentinhos? Que maravilha! Tome, pela viagem.'] },
    ],
    recompensa: { dinheiro: 400, itens: [['moomooMilk', 2]] },
  },
  {
    id: 'sq_pesquisa1', titulo: 'Pesquisa de campo', regiao: 'Rota 1', de: 'bia', proxima: 'sq_pesquisa2',
    requer: { flags: ['balls'] },
    resumo: 'A Bia está estudando os Pokémon que voam baixo nos Campos de Lúmen e precisa de dados de captura.',
    oferta: ['Ei! Você já tem Poké Bolas, né? Me ajuda numa pesquisa rapidinho?', 'Preciso de dois Pokémon do tipo Voador capturados nos campos. Os Starly e os Pidgey andam esquisitos com o sol atrasado.'],
    aceita: ['Valeu! Pode capturar os que quiser, eu só leio os dados da sua Pokédex.'],
    lembrete: ['Dois Pokémon do tipo Voador! Eles adoram o mato alto da Rota 1.'],
    etapas: [
      { tipo: 'capturar', tipoPokemon: 'flying', n: 2, area: 'Rota 1, Campos de Lúmen', texto: 'Capture 2 Pokémon do tipo Voador', rotulo: 'Capturados' },
      { tipo: 'falar', npc: 'bia', texto: 'Volte e conte para a Bia',
        falas: ['Deixa eu ver… asas cansadas, sono fora de hora. Eles também estão confusos com o sol!', 'Ótimos dados. Tome, para as próximas capturas.'] },
    ],
    recompensa: { itens: [['greatBall', 3]] },
  },
  {
    id: 'sq_pesquisa2', titulo: 'Pesquisa de campo II', regiao: 'Rota 1', de: 'bia',
    resumo: 'Agora a Bia quer ver de perto um Pokémon do tipo Elétrico, que sente a luz de um jeito diferente.',
    oferta: ['Próxima fase da pesquisa! Os Pokémon Elétricos sentem a luz de um jeito diferente.', 'Me mostra um? Shinx, Mareep, Pikachu… qualquer um serve!'],
    lembrete: ['Um Pokémon do tipo Elétrico na sua equipe! Os campos têm vários.'],
    etapas: [
      { tipo: 'mostrar', npc: 'bia', tipoPokemon: 'electric', texto: 'Mostre à Bia um Pokémon do tipo Elétrico',
        falas: ['Olha a estática do {pokemon}! Ele fica eriçado quando o sol aparece, mesmo atrasado.', 'Isso confirma a teoria do professor. Toma, este aqui estava esperando um treinador.'] },
    ],
    recompensa: { pokemon: { dex: 133, nivel: 10, golpes: ['tackle', 'quickAttack', 'sandAttack', 'helpingHand'], item: 'sootheBell', bola: 'premierBall' } },
  },
  {
    id: 'sq_isca', titulo: 'Isca de fruta', regiao: 'Vila Alvorada', de: 'pescador',
    requer: { flags: ['starter'] },
    resumo: 'Seu Tonho jura que os Magikarp do laguinho da vila mordem isca de Fruta Oran.',
    oferta: ['Rapaz, com isca de minhoca ninguém morde. Mas com Fruta Oran…', 'Me arruma três Frutas Oran? A Dona Flor sempre tem no quintal, e as árvores de fruta também dão.'],
    lembrete: ['Três Frutas Oran! Com isso eu pego até o Gyarados do lago.'],
    etapas: [
      { tipo: 'entregar', npc: 'pescador', item: 'oran', n: 3, texto: 'Leve 3 Frutas Oran para o Seu Tonho',
        falas: ['Agora sim! Olha o cheiro… Os Magikarp vão fazer fila.', 'Tome umas bolas de pescador. Na água elas pegam melhor.'] },
    ],
    recompensa: { itens: [['diveBall', 2], ['netBall', 2]] },
  },
];

export const NPCS = {
  dona_flor: {
    diario: { sorteio: [['oran', 2], ['pecha', 2], ['sitrusBerry', 1], ['cheri', 2]], falas: ['Bom dia, querido! Colhi agora cedinho no quintal. Leve umas frutas!'], depois: ['Volte amanhã que tem mais.'] },
    falas: [
      { se: { hora: 'noite' }, linhas: ['A essa hora as flores fecham. Até elas sabem que é noite… mesmo com o sol atrasando de manhã.'] },
      { se: { insignias: 1 }, linhas: ['Fiquei sabendo da sua insígnia! Plantei um girassol em sua homenagem.'] },
    ],
  },
  padeiro: {
    diario: { itens: [['potion', 1]], requer: { flags: ['starter'] }, falas: ['Ô, freguês! Leva um pão de queijo para a viagem. Cura qualquer cansaço!'] },
  },
  rita: {
    reage: {
      especie: { 25: ['Um Pikachu de verdade! Posso falar dele no programa de amanhã?'], 4: ['Que Charmander lindo! A chama dele está bem acesa hoje.'] },
      tipo: { flying: ['Um Pokémon que voa! Pergunta pra ele se lá de cima dá para ver o sol nascendo mais cedo.'] },
      qualquer: ['Que gracinha de {pokemon}! Ele parece ter energia para um programa inteiro.'],
    },
    falas: [
      { se: { insignias: 1 }, linhas: ['Notícia de última hora: {jogador} conquistou uma insígnia! Eu anunciei no rádio, viu?'] },
      { se: { missao: 'sq_relogios' }, linhas: ['O Seu Zé está todo orgulhoso: "não eram os relógios!". Agora ele quer um programa só dele.'] },
    ],
  },
  kid_vila1: {
    falas: [
      { se: { insignias: 2 }, linhas: ['Duas insígnias?! Você é tipo um campeão! Me dá um autógrafo?'] },
      { se: { insignias: 1 }, linhas: ['Uau, uma insígnia! Quando eu crescer vou ganhar oito. Ou nove!'] },
    ],
  },
  kid_vila2: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['Viu? Já escureceu! O Pokémon branco aparece na cerca da saída… Eu vou pra casa. Correndo.'] },
    ],
  },
  seu_ze: {
    falas: [
      { se: { missao: 'sq_relogios' }, linhas: ['Agora eu acerto os relógios pela lagoa. Mais baixo do que devia… e cada dia mais.'] },
    ],
  },
  irma_teo: {
    falas: [
      { se: { insignias: 1 }, linhas: ['O Téo ligou de Campina. Falou de você o tempo todo. Só que dizendo que vai te vencer.'] },
    ],
  },
  vovo_bento: {
    presente: { itens: [['superPotion', 2]], requer: { flags: ['starter'] }, falas: ['Três dias perdido no bosque, eu te contei? Pois é. Leve estas Superpoções. Eu teria adorado ter umas.'] },
  },
};
