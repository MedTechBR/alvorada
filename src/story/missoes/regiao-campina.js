// Missões e NPCs vivos de Cidade Campina, da Fazenda do Tomé e da Rota 2 (Trilha das Paineiras). Formato: docs/missoes.md.

export const ITENS = {
  caco_azul: { name: 'Caco de Pedra Azul', color: '#6ab8ff', desc: 'Um caco de pedra que brilha azul mesmo de dia e está sempre morno. Estava no pasto onde o Tauros enlouqueceu. Ninguém em Campina sabe o que é.' },
};

// Cidade Campina: uma só missão solta (Tauros), com mistério. Guloso, espantalho, revanche, medalhão e carta saíram.
export const MISSOES = [
  {
    id: 'sq_tauros', titulo: 'O Tauros de olhos vermelhos', regiao: 'Rota 1', de: 'fazendeiro',
    requer: { insignias: 1 },
    resumo: 'O Tauros manso do Seu Bento ficou de olhos vermelhos e derruba as cercas ao norte da Rota 1. O Seu Bento acha que alguma coisa mexeu com a cabeça do bicho e quer saber o quê.',
    oferta: [
      'Você é treinador, tem insígnia e não tem medo de touro. Então a conversa é com você.',
      'Meu Tauros comia na minha mão há doze anos. Faz uma semana que ficou de olho vermelho e derruba as cercas ao norte da Rota 1.',
      'Virou Alfa: bate forte e não foge. Eu não quero o bicho machucado à toa. Descubra o que fez isso com ele.',
    ],
    aceita: ['Leve Poções, que Alfa bate forte. E olhe o chão onde ele pisa: onde tem causa, tem rastro.'],
    lembrete: ['O Tauros anda pelos campos ao norte da Rota 1. Leve Poções e olhe o chão onde ele pisa.'],
    etapas: [
      { tipo: 'vencer', alfa: { dex: 128, nivel: 20, x: 205, y: 292, golpes: ['tackle', 'hornAttack', 'rage', 'scaryFace'] }, texto: 'Vença (ou capture) o Tauros Alfa nos campos ao norte da Rota 1, perto da fazenda',
        falas: ['O Tauros Alfa sossega. Os olhos vermelhos se apagam e ele fica ali, ofegante, olhando para o chão.', 'Entre as patas dele, um caco de pedra brilha azul em pleno sol, morno como pão saído do forno. Você guarda o caco.'],
        recompensa: { itens: [['caco_azul', 1]] } },
      { tipo: 'falar', npc: 'fazendeiro', texto: 'Volte à fazenda e mostre o caco ao Seu Bento',
        falas: ['Sossegou? Você é dos meus!', 'E isso na sua mão? Nunca vi pedra assim. Brilha azul e é quente.', 'Se o bicho pisou nisso, não me espanto de ter enlouquecido. Guarde o caco e mostre ao professor. Eu só entendo de touro.'] },
    ],
    conclusao: ['As cercas agradecem, e o meu bolso também. Leve isto, é pouco para ter meu touro manso de volta.'],
    recompensa: { dinheiro: 3000, itens: [['moomooMilk', 3], ['revive', 1]] },
  },
];

export const NPCS = {
  peao: {
    tutor: {
      golpes: [{ golpe: 'bodySlam', dinheiro: 2000 }, { golpe: 'mudSlap', item: ['tinyMushroom', 2] }, { golpe: 'swift', dinheiro: 1200 }],
      falas: { ola: ['O Tomé me ensinou uns golpes de fazenda. Quer que eu ensine a um dos seus? Cobro barato.'], tchau: ['Volte quando quiser. Trabalho de fazenda nunca acaba.'] },
    },
  },
  kid_camp2: {
    troca: {
      quer: { especie: 16 }, da: { dex: 179, nivel: 9, apelido: 'Algodão', item: 'oranBerry', golpes: ['tackle', 'growl', 'thunderShock', 'thunderWave'] },
      falas: {
        pede: ['Eu quero tanto um Pidgey! Troca comigo? Dou o meu Mareep, o Algodão. É fofinho, mas solta choque quando abraça.'],
        aceita: ['Eba, um Pidgey! Cuide do Algodão. Ele gosta de dormir no sol, quando tem sol.'],
        recusa: ['Ah… Se pegar um Pidgey na Rota 1, volte aqui!'],
        falta: ['Você não tem um Pidgey. Eles ficam no mato alto da Rota 1.'],
        depois: ['O Pidgey já voa até o moinho! E o Algodão, continua fofinho?'],
      },
    },
  },
  quinzinho: {
    falas: [
      { se: { insignias: 3 }, linhas: ['Dizem que a Marina, do porto, é calma como lago parado. E mesmo assim perdeu para você. Respeito.'] },
      { se: { insignias: 2 }, linhas: ['Dizem que o Scyther da Lia corta folha no ar. E você venceu a moça! Ninguém fala de outra coisa.'] },
      { se: { insignias: 1 }, linhas: ['Soube da sua vitória antes de você sair do ginásio. Em Campina, notícia corre mais que Ponyta.'] },
      { se: { hora: 'noite' }, linhas: ['De noite os trigais fazem barulho de mar. Diz a lenda que é o vento procurando o sol.'] },
    ],
  },
  guia_gym: {
    falas: [{ se: { insignias: ['campina'] }, linhas: ['A Insígnia Espiga combina com você! O Tomé disse que faz tempo que não perdia assim.'] }],
  },
  ana: {
    presente: { itens: [['healBall', 3]], requer: { flags: ['balls'] }, falas: ['Você é treinador novo, né? Tome estas Bolas de Cura. O Pokémon capturado já sai curadinho.'] },
  },
  kid_camp1: {
    treinador: {
      batalha: { id: 'sq_tiago', nome: 'Menino Rafa', equipe: [[16, 9, ['tackle', 'gust', 'sandAttack']], [659, 10, ['tackle', 'mudSlap', 'quickAttack']]] },
      falas: ['Ei! Treinei a manhã inteira para isso. Batalha? Vai, Pidgey!'], dinheiro: 240,
      vitoria: ['Aaah! Amanhã eu treino mais. Você é bom mesmo.'], derrota: ['Ganhei! Ganhei! Quando quiser a revanche, é só chamar.'],
      depois: ['Vou ficar mais forte que você! Mas antes, uma corrida até o moinho.'],
    },
  },
  vovo_camp: {
    reage: { tipo: { flying: ['Ei, esse aí voa! Ele não come o trigo do Seu Bento, né? Né?'] } },
  },
};
