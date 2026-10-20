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
    resumo: 'Faz trinta anos que o Seu Zé acerta relógios, e agora nenhum marca a mesma hora. Ele desconfia do sol e pede que você confira o céu na Lagoa Dourada, longe das antenas da rádio.',
    oferta: [
      'Psiu, você! Vai sair da vila, não vai? Então me faz um favor de cientista.',
      'Trinta anos acertando relógio, e de uns dias para cá cada um marca uma hora. Os relógios não têm culpa. Eu desconfio é do sol.',
      'Vá à Lagoa Dourada, ao norte da Rota 1, longe das antenas, e olhe o céu. Depois volte e me conte. Topa?',
    ],
    aceita: ['Isso! A lagoa fica no meio dos campos, ao norte da Rota 1. Olhe onde o sol está e guarde bem a posição dele.'],
    lembrete: ['A Lagoa Dourada, ao norte da Rota 1. Olhe o sol e volte para me contar. Se estiver baixo demais, eu estou certo.'],
    etapas: [
      { tipo: 'chegar', lugar: 'lagoa_dourada', r: 6, texto: 'Vá à Lagoa Dourada, ao norte da Rota 1, e olhe onde o sol está',
        falas: ['O sol se espelha na lagoa, mais baixo do que devia para esta hora. Parece que dormiu demais.', 'Você confere o relógio de pulso. Está certo. Quem está atrasado é o céu.'] },
      { tipo: 'falar', npc: 'seu_ze', texto: 'Volte à Vila Alvorada e conte ao Seu Zé o que viu na lagoa',
        falas: ['E então? O sol estava baixo? Mais baixo do que devia?', 'Eu sabia! Não eram os meus relógios. É o sol que atrasa, e um pouquinho mais a cada dia.', 'Trinta anos de ofício, e agora o mundo é que erra a hora. Fique com o relógio de bolso do meu pai.', 'Ele atrasa um pouco todo dia, e eu vivia achando que era defeito. Agora sei que ele sempre esteve certo.'] },
    ],
    conclusao: [['narrador', 'O Seu Zé abre o caderno, olha o céu pela janela e anota uma linha. Pela primeira vez em dias, ele sorri.']],
    recompensa: { itens: [['relogio_ze', 1], ['timerBall', 5]], flags: { zeHoraCerta: true } },
  },
];

export const NPCS = {
  dona_flor: {
    diario: { sorteio: [['oran', 2], ['pecha', 2], ['sitrusBerry', 1], ['cheri', 2]], falas: ['Bom dia, querido! Colhi agora cedinho no quintal. Leve umas frutinhas para a estrada.'], depois: ['Volte amanhã, que o pomar não para.'] },
    falas: [
      { se: { hora: 'noite' }, linhas: ['A essa hora as flores fecham. Até elas sabem que é noite, e olha que a manhã anda demorando a chegar.'] },
      { se: { insignias: 1 }, linhas: ['Soube da sua insígnia! Plantei um girassol em sua homenagem. Ele vira para onde o sol deveria estar.'] },
    ],
  },
  padeiro: {
    diario: { itens: [['potion', 1]], requer: { flags: ['starter'] }, falas: ['Ô, freguês! Leve um pão de queijo para a viagem. Ainda está quentinho e dá ânimo para a estrada.'] },
  },
  rita: {
    reage: {
      especie: { 25: ['Um Pikachu de verdade! Posso falar dele no programa de amanhã?'], 4: ['Que Charmander lindo! A chama dele está bem acesa hoje.'] },
      tipo: { flying: ['Um Pokémon que voa! Pergunte a ele se lá de cima o sol já aparece mais cedo.'] },
      qualquer: ['Que gracinha de {pokemon}! Tem cara de quem aguenta um programa inteiro.'],
    },
    falas: [
      { se: { insignias: 1 }, linhas: ['Notícia de última hora: {jogador} conquistou uma insígnia! Eu anunciei no rádio agora há pouco.'] },
      { se: { missao: 'sq_relogios' }, linhas: ['O Seu Zé me ligou todo orgulhoso: "não eram os relógios!". Agora quer um programa só dele.'] },
    ],
  },
  kid_vila1: {
    falas: [
      { se: { insignias: 2 }, linhas: ['Duas insígnias?! Você é quase um campeão! Me dá um autógrafo?'] },
      { se: { insignias: 1 }, linhas: ['Uau, uma insígnia! Quando eu crescer vou ganhar oito. Ou nove!'] },
    ],
  },
  kid_vila2: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['Já escureceu! Dizem que o Pokémon branco aparece na cerca da saída. Eu vou para casa. Correndo.'] },
    ],
  },
  seu_ze: {
    falas: [
      { se: { missao: 'sq_relogios' }, linhas: ['Os relógios eu acerto pelo sol da Lagoa Dourada, longe das antenas. Lá o céu não mente.'] },
    ],
  },
  irma_teo: {
    falas: [
      { se: { insignias: 1 }, linhas: ['O Téo ligou de Campina e só falou de você. Disse que vai te vencer, mas contou de uma ponta à outra.'] },
    ],
  },
  vovo_bento: {
    presente: { itens: [['superPotion', 2]], requer: { flags: ['starter'] }, falas: ['Três dias perdido no bosque, eu te contei? Pois é. Leve estas Superpoções, que eu teria adorado ter umas.'] },
  },
};
