// Abertura e jornada de Cidade Campina (era o capítulo 1): Vila Alvorada → Campos de Lúmen → Cidade Campina.
// Mundo aberto: o Ginásio de Campina é o 3º da escada pela distância (Tomé ~16; docs/jornadas.md).
// Treinadores do mapa: visual (src/sprites/npc.js), ponto nomeado (spots.js), visão em blocos e equipe [dex, nível].
// double: true = solta dois Pokémon de uma vez.

export const ROUTE_TRAINERS = [
  {
    id: 'r1_caio', look: 'youngster', name: 'Jovem Caio', spot: 'r1_caio', sight: 5,
    team: [[659, 3], [396, 4]], money: 140,
    intro: ['Ei, você aí! Está começando a jornada agora? Então vamos batalhar!'],
    win: ['Puxa! Meu Bunnelby cavou, cavou… e não adiantou nada.'],
    after: ['Os Campos de Lúmen são cheios de Pokémon no mato alto. Chegar devagar ajuda a pegar um distraído!'],
  },
  {
    id: 'r1_davi', look: 'bugcatcher', name: 'Caçador Davi', spot: 'r1_davi', sight: 5, double: true,
    team: [[13, 4], [664, 5]], money: 160,
    intro: ['Achei você no meu caminho! Meus insetos estão loucos para lutar… os dois ao mesmo tempo!'],
    win: ['Meus pobres insetos… Vou treinar no Bosque Sussurrante.'],
    after: ['Dizem que no Bosque tem um ginásio de insetos. Um dia eu vou ser líder de lá!'],
  },
  {
    id: 'r1_pedro', look: 'youngster', name: 'Jovem Pedro', spot: 'r1_pedro', sight: 5,
    team: [[915, 5], [403, 6]], money: 180,
    intro: ['Você vai para Campina? Primeiro tem que passar por mim!'],
    win: ['Que força! Você vai dar trabalho para o Tomé.'],
    after: ['O Líder Tomé usa Pokémon do tipo Normal. Eles não têm fraqueza fácil… só Lutador!'],
  },
];

export const GYM_TRAINERS = [
  {
    id: 'g1_icaro', look: 'youngster', name: 'Aprendiz Ícaro', spot: 'g1_icaro', sight: 4, gym: 'campina',
    team: [[915, 11], [427, 12]], money: 260,
    intro: ['Bem-vindo ao Ginásio de Campina! Para chegar ao mestre Tomé, vai ter que vencer os aprendizes!'],
    win: ['Você passou por mim… mas o Rui é mais casca-grossa!'],
    after: ['Aqui a batalha é na quadra, em tempo real. Use a esquiva quando o golpe vier!'],
  },
  {
    id: 'g1_rui', look: 'bugcatcher', name: 'Aprendiz Rui', spot: 'g1_rui', sight: 5, gym: 'campina',
    team: [[396, 12], [52, 13]], money: 300,
    intro: ['Alto lá! O mestre Tomé só recebe quem mostrar garra!'],
    win: ['Tá bom, tá bom! Pode passar. O mestre está no fundo da quadra.'],
    after: ['O Teddiursa do mestre Tomé arranha forte. Cuide do HP do seu Pokémon!'],
  },
];

export const LEADER1 = {
  id: 'leader_tome', look: 'leader', name: 'Líder Tomé', spot: 'leader_tome', gym: 'campina', badge: 'campina',
  arena: 'arena', // antes da luta, o jogador vai para o centro da quadra
  team: [[659, 11], [915, 12], [216, 14]], money: 1200,
  needs: ['g1_icaro', 'g1_rui'],
  prize: { potion: 3, pokeball: 5, oran: 2 },
  locked: ['Opa, calma lá! Antes de falar comigo, vença os meus dois aprendizes.', 'Quem pula etapa não está pronto.'],
  intro: [
    'Então foi você que enfrentou a Crepúsculo no meu celeiro! Eu sou Tomé, líder do Ginásio de Campina.',
    'Aqui a gente planta, colhe e batalha com Pokémon do tipo Normal. Simples, mas firme como raiz de ipê.',
    'Mostre o que você tem! Valendo a Insígnia Espiga!',
  ],
  win: [
    'Ha! Que colheita! Você venceu de forma justa.',
    'Leve a Insígnia Espiga. Ela foi lapidada de uma lasca da Pedra do Alvorecer, e a pedra inteira continua comigo.',
  ],
  lose: ['Ainda não foi desta vez, mas você tem talento. Descanse e volte quando quiser.'],
  after: [
    'Cada ginásio de Alvorada guarda uma Pedra do Alvorecer. Nenhuma delas deve sair do seu lugar sem um bom motivo.',
    'Ultimamente o sol nasce tarde, e a Crepúsculo rondou a minha fazenda. Se perguntarem da pedra, não diga onde ela está.',
  ],
};
