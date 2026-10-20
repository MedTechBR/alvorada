// Missões e NPCs vivos de Cidade Campina, da Fazenda do Tomé e da Rota 2 (Trilha das Paineiras). Formato: docs/missoes.md.

export const ITENS = {
  caco_azul: { name: 'Caco de Pedra Azul', color: '#6ab8ff', desc: 'Um caco de pedra que brilha azul mesmo de dia e está sempre morno. Estava no pasto onde o Tauros enlouqueceu. Ninguém em Campina sabe o que é.' },
};

// Cidade Campina: uma só missão solta (Tauros), com mistério. Guloso, espantalho, revanche, medalhão e carta saíram.
export const MISSOES = [
  {
    id: 'sq_tauros', titulo: 'O Tauros de olhos vermelhos', regiao: 'Rota 1', de: 'fazendeiro',
    requer: { insignias: 1 },
    resumo: 'O Tauros manso do Seu Bento ficou Alfa e derruba as cercas da Rota 1. Seu Bento jura que alguma coisa mexeu com a cabeça do bicho.',
    oferta: [
      'Você tem insígnia, não tem? Então é com você mesmo.',
      'Meu Tauros é manso há doze anos! Comia na minha mão. Faz uma semana que ficou de olho vermelho e derruba as cercas ao norte da Rota 1.',
      'É Alfa agora: bate forte e não foge. Mas eu não quero o bicho machucado à toa. Alguma coisa fez isso com ele. Acha o quê?',
    ],
    aceita: ['Cuidado: Alfa bate forte e não foge. Leve Poções! E olhe o chão onde ele pisa.'],
    lembrete: ['O Tauros anda pelos campos ao norte da Rota 1. Leve Poções, e olhe o chão onde ele pisa.'],
    etapas: [
      { tipo: 'vencer', alfa: { dex: 128, nivel: 20, x: 205, y: 292, golpes: ['tackle', 'hornAttack', 'rage', 'scaryFace'] }, texto: 'Vença (ou capture) o Tauros Alfa nos campos ao norte da Rota 1',
        falas: ['O Tauros Alfa sossega. Os olhos vermelhos apagam, e ele fica ali, ofegante, olhando para o chão.', 'Entre as patas dele, um caco de pedra brilha azul em pleno sol, morno como pão saído do forno. Você guarda o caco.'],
        recompensa: { itens: [['caco_azul', 1]] } },
      { tipo: 'falar', npc: 'fazendeiro', texto: 'Mostre o caco ao Seu Bento',
        falas: ['Sossegou? Você é dos meus!', 'E isso aí? Nunca vi pedra assim… é quente. Se o bicho pisou nela, nem me espanto. Fique com ela e pergunte pro professor de vocês. Eu só entendo de touro.'] },
    ],
    conclusao: ['As cercas agradecem. E o meu bolso também agradece você.'],
    recompensa: { dinheiro: 3000, itens: [['moomooMilk', 3], ['revive', 1]] },
  },
];

export const NPCS = {
  peao: {
    tutor: {
      golpes: [{ golpe: 'bodySlam', dinheiro: 2000 }, { golpe: 'mudSlap', item: ['tinyMushroom', 2] }, { golpe: 'swift', dinheiro: 1200 }],
      falas: { ola: ['O Tomé me ensinou uns golpes de fazenda. Quer que eu ensine para um dos seus? Cobro barato!'], tchau: ['Volte quando quiser. Trabalho de fazenda nunca acaba!'] },
    },
  },
  kid_camp2: {
    troca: {
      quer: { especie: 16 }, da: { dex: 179, nivel: 9, apelido: 'Algodão', item: 'oranBerry', golpes: ['tackle', 'growl', 'thunderShock', 'thunderWave'] },
      falas: {
        pede: ['Eu quero muito um Pidgey! Troca comigo? Dou o meu Mareep, o Algodão. Ele é fofinho, mas solta choque quando abraça.'],
        aceita: ['Eba, um Pidgey! Cuida do Algodão, ele gosta de dormir no sol. Quando tem sol.'],
        recusa: ['Ah… Se pegar um Pidgey na Rota 1, volta aqui!'],
        falta: ['Você não tem Pidgey. Eles vivem no mato alto da Rota 1!'],
        depois: ['O Pidgey já aprendeu a voar até o moinho! E o Algodão, tá fofinho?'],
      },
    },
  },
  quinzinho: {
    falas: [
      { se: { insignias: 3 }, linhas: ['Contaram que até a Marina, lá do porto, perdeu a calma. Coisa feia, essa Crepúsculo.'] },
      { se: { insignias: 2 }, linhas: ['Boato quentinho: a Lia de Sussurro tem um Scyther que corta folha no ar. Eu acredito.'] },
      { se: { insignias: 1 }, linhas: ['Fiquei sabendo da sua vitória antes de você sair do ginásio. Aqui em Campina, notícia corre mais que Ponyta.'] },
      { se: { hora: 'noite' }, linhas: ['De noite os trigais fazem barulho de mar. Diz a lenda que é o vento procurando o sol.'] },
    ],
  },
  guia_gym: {
    falas: [{ se: { insignias: ['campina'] }, linhas: ['A Insígnia Espiga combina com você! O Tomé disse que faz tempo que não perde assim.'] }],
  },
  ana: {
    presente: { itens: [['healBall', 3]], requer: { flags: ['balls'] }, falas: ['Você é treinador novo, né? Tome: Bolas de Cura. O Pokémon capturado já sai curadinho!'] },
  },
  kid_camp1: {
    treinador: {
      batalha: { id: 'sq_tiago', nome: 'Menino Tiago', equipe: [[16, 9, ['tackle', 'gust', 'sandAttack']], [659, 10, ['tackle', 'mudSlap', 'quickAttack']]] },
      falas: ['Ei! Treinei a manhã inteira. Batalha? Vai, Pidgey!'], dinheiro: 240,
      vitoria: ['Aaah! Amanhã eu treino mais. Você é bom mesmo.'], derrota: ['Ganhei! Ganhei! Volte quando quiser revanche.'],
      depois: ['Eu vou ficar mais forte que você! Esperando o moinho girar para treinar.'],
    },
  },
  vovo_camp: {
    reage: { tipo: { flying: ['Ei! Esse aí voa… Ele não come trigo, né? Né?'] } },
  },
};
