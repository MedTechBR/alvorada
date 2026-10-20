// Missões e NPCs vivos de Vila Alvorada e da Rota 1 (Campos de Lúmen). Formato: docs/missoes.md.
// NPCs pelo id do mapa (assets/maps/alvorada.json, "people", também dentro dos interiores).

export const ITENS = {
  relogio_ze: { name: 'Relógio do Seu Zé', color: '#c8a040', desc: 'Um relógio de bolso que o Seu Zé acertou pelo sol da Lagoa Dourada. Era do pai dele. Atrasa um pouquinho todo dia, e agora o Seu Zé sabe que ele está certo.' },
};

// Uma só missão solta em Vila Alvorada: o resto (cestas, pesquisas, iscas) era tarefa genérica e saiu (docs/jornada-roteiro.md).
export const MISSOES = [
  {
    id: 'sq_relogios', titulo: 'Os relógios do Seu Zé', regiao: 'Vila Alvorada', de: 'seu_ze',
    requer: { flags: ['starter'] },
    resumo: 'Os relógios da Rádio Alvorada marcam horas diferentes e o Seu Zé jura que o defeito não é deles. Ele quer ver o sol de manhã, longe das antenas.',
    oferta: [
      'Psiu! Você que vai sair por aí… me faz um favor de cientista?',
      'Trinta anos acertando relógio, e agora cada um marca uma hora. Os relógios não são. Eu desconfio é do sol.',
      'Vá à Lagoa Dourada de manhã, longe das antenas, e olhe o céu. Volte e me conte. Topa?',
    ],
    aceita: ['Isso! A Lagoa Dourada fica no norte da Rota 1, no meio dos campos. De manhã, hein! De tarde todo sol é mentiroso.'],
    lembrete: ['A Lagoa Dourada, de manhã! Se o sol estiver baixo demais, eu estou certo.'],
    etapas: [
      { tipo: 'chegar', lugar: 'lagoa_dourada', r: 6, se: { hora: 'manha' }, texto: 'Vá à Lagoa Dourada de manhã (antes do meio-dia) e olhe o sol',
        falas: ['O sol se espelha na lagoa. Está mais baixo do que devia para esta hora, como se tivesse dormido demais.', 'Você olha o relógio. Está certo. É o céu que está atrasado.'] },
      { tipo: 'falar', npc: 'seu_ze', texto: 'Conte ao Seu Zé o que viu na lagoa',
        falas: ['E então? Baixo? Mais baixo do que devia?', 'Eu sabia! Não são os meus relógios. É o sol que está atrasado… e cada dia um pouquinho mais.', 'Trinta anos de ofício, e a primeira vez que o relógio acerta é a hora que o mundo erra. Tome. Este é o relógio de bolso do meu pai. Ele atrasa um pouquinho todo dia, e agora eu sei que ele está certo.'] },
    ],
    conclusao: [['narrador', 'O Seu Zé guarda o caderno, olha o céu pela janela e anota uma linha. Pela primeira vez em semanas, ele está sorrindo.']],
    recompensa: { itens: [['relogio_ze', 1], ['timerBall', 5]], flags: { zeHoraCerta: true } },
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
