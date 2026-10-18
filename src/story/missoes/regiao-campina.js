// Missões e NPCs vivos de Cidade Campina, da Fazenda do Tomé e da Rota 2 (Trilha das Paineiras). Formato: docs/missoes.md.

export const ITENS = {
  medalhao_sol: { name: 'Medalhão da Sol', color: '#f2c94c', desc: 'Um medalhão dourado com um sol gravado. A Trilheira Sol perdeu na Lagoa Dourada.' },
  carta_andarilho: { name: 'Carta do Andarilho', color: '#f4ead2', desc: 'Envelope amassado, com lama na ponta. Para a Anciã Iara, da Vila Sussurro.' },
};

export const MISSOES = [
  {
    id: 'sq_guloso', titulo: 'O Teddiursa guloso', regiao: 'Cidade Campina', de: 'feirante',
    requer: { flags: ['balls'] },
    resumo: 'Alguém anda comendo o mel e as frutas da barraca da Dona Cida. As pegadas levam para fora da cidade.',
    oferta: ['Ai, ai, ai… Sumiu de novo o mel da barraca! E metade das Frutas Oran!', 'Tem umas pegadinhas saindo daqui. Segue para mim? Eu não posso largar a feira.'],
    aceita: ['Obrigada! Olha no chão: patinha pequena, cheiro de mel.'],
    lembrete: ['As pegadas iam para o norte, para os lados da fazenda do Tomé.'],
    etapas: [
      { tipo: 'achar', pontos: [[143, 347], [131, 331], [118, 318]], achou: 'Pegadas pequenas, melecadas de mel…', texto: 'Siga as pegadas de mel', rotulo: 'Pegadas' },
      { tipo: 'chegar', x: 106, y: 311, r: 3, texto: 'Procure perto do celeiro da Fazenda do Tomé',
        falas: ['Atrás dos fardos de feno, um Teddiursa ronca abraçado a um pote de mel vazio.', 'Ele acorda, olha para você… e oferece o pote. Vazio.'] },
      { tipo: 'falar', npc: 'feirante', texto: 'Conte para a Dona Cida o que achou',
        falas: ['Um Teddiursa! Então era ele… Coitadinho, deve estar com fome desde que o sol começou a atrasar.', 'Sabe de uma coisa? Ele gostou de você. Quer levá-lo junto, ou deixo ele de mascote da feira?'],
        escolhas: [
          { texto: 'Levar o Teddiursa', falas: ['Então vai com Deus, comilão! E não coma o mel dos outros, hein.'], recompensa: { pokemon: { dex: 216, nivel: 8, golpes: ['scratch', 'leer', 'lick', 'covet'], item: 'oranBerry' } } },
          { texto: 'Deixar na feira', falas: ['Mascote da feira! Vai ganhar um potinho de mel por dia. Tome, pela ajuda.'], recompensa: { itens: [['oran', 5]] } },
        ] },
    ],
  },
  {
    id: 'sq_tauros', titulo: 'O Tauros de olhos vermelhos', regiao: 'Rota 1', de: 'fazendeiro',
    requer: { insignias: 1 },
    resumo: 'Um Tauros Alfa derruba as cercas dos campos ao norte da Rota 1. Seu Bento pede ajuda a quem já tem insígnia.',
    oferta: ['Você tem insígnia, não tem? Então é com você mesmo.', 'Um Tauros de olhos vermelhos está derrubando as cercas nos campos ao norte da Rota 1. É um Alfa. Ninguém segura!'],
    aceita: ['Cuidado: Alfa bate forte e não foge. Leve Poções!'],
    lembrete: ['O Tauros Alfa anda pelos campos ao norte da Rota 1. Leve Poções!'],
    etapas: [
      { tipo: 'vencer', alfa: { dex: 128, nivel: 20, x: 205, y: 292, golpes: ['tackle', 'hornAttack', 'rage', 'scaryFace'] }, texto: 'Vença (ou capture) o Tauros Alfa nos campos ao norte da Rota 1',
        falas: ['O Tauros Alfa sossega. Os olhos vermelhos apagam, e os campos ficam em paz.'] },
      { tipo: 'falar', npc: 'fazendeiro', texto: 'Avise o Seu Bento',
        falas: ['Sossegou? Você é dos meus! As cercas agradecem. E o meu bolso também agradece você.'] },
    ],
    recompensa: { dinheiro: 3000, itens: [['moomooMilk', 3]] },
  },
  {
    id: 'sq_espantalho', titulo: 'Espantalho de carne e osso', regiao: 'Rota 1', de: 'vovo_camp',
    requer: { flags: ['balls'] },
    resumo: 'Os Pokémon voadores estão bicando o trigo dos Campos de Lúmen. Vô Lino quer quem espante cinco deles.',
    oferta: ['Meu espantalho se aposentou. Os passarinhos não respeitam mais ninguém.', 'Espanta cinco Pokémon voadores lá dos campos para mim? Uma batalha e eles aprendem.'],
    lembrete: ['Cinco Pokémon do tipo Voador, na Rota 1. Batalha neles!'],
    etapas: [
      { tipo: 'derrotar', tipoPokemon: 'flying', n: 5, area: 'Rota 1, Campos de Lúmen', texto: 'Vença 5 Pokémon selvagens do tipo Voador na Rota 1', rotulo: 'Espantados' },
      { tipo: 'falar', npc: 'vovo_camp', texto: 'Volte ao banco do Vô Lino', falas: ['O trigo agradece! Tome. Esse golpe é tão rápido que nem passarinho escapa.'] },
    ],
    recompensa: { mt: 'swift' },
  },
  {
    id: 'sq_revanche', titulo: 'Revanche do Tiago', regiao: 'Cidade Campina', de: 'kid_camp1', diaria: true,
    requer: { flags: ['balls'] },
    resumo: 'O Tiago treina todo dia e quer uma batalha por dia. Uma por dia, ele jura.',
    oferta: ['Ei! Treinei a manhã inteira. Batalha? Só uma! Por hoje.'],
    ofertaRepetida: ['Novo dia, nova batalha! Hoje eu ganho. Bora?'],
    aceita: ['Valendo!'],
    etapas: [
      { tipo: 'vencer', npc: 'kid_camp1', agora: true, perguntar: false, batalha: { id: 'sq_tiago', nome: 'Menino Tiago', dinheiro: 240, equipe: [[16, 9, ['tackle', 'gust', 'sandAttack']], [659, 10, ['tackle', 'mudSlap', 'quickAttack']]] },
        texto: 'Vença o Tiago numa batalha', falas: ['Vai, Pidgey!'], vitoria: ['Aaah! Amanhã eu treino mais. Toma, você mereceu.'], derrota: ['Ganhei! Ganhei! Volte quando quiser revanche.'] },
    ],
    recompensa: { itens: [['sitrusBerry', 1]] },
    recompensaRepetida: { itens: [['oran', 2]] },
  },
  {
    id: 'sq_medalhao', titulo: 'O medalhão da Sol', regiao: 'Rota 1', de: 'trilheira',
    requer: { flags: ['balls'] },
    resumo: 'A Trilheira Sol perdeu o medalhão da avó na margem da Lagoa Dourada.',
    oferta: ['Que desastre… Perdi o medalhão da minha avó na Lagoa Dourada. Ele tem um sol gravado.', 'Tá escondido em algum canto da margem. Você me ajuda a procurar?'],
    lembrete: ['O medalhão está escondido na margem da Lagoa Dourada. Ele brilha de pertinho!'],
    etapas: [
      { tipo: 'achar', x: 216, y: 316, escondido: true, item: 'medalhao_sol', dica: { lugar: 'lagoa_dourada' }, texto: 'Procure o medalhão na margem da Lagoa Dourada (brilha de pertinho)' },
      { tipo: 'entregar', npc: 'trilheira', item: 'medalhao_sol', texto: 'Devolva o medalhão à Trilheira Sol',
        falas: ['É ele! Com o solzinho e tudo! Minha avó dizia que ele marca a hora certa do amanhecer.', 'Tome, você merece mais que um obrigado.'] },
    ],
    recompensa: { itens: [['ultraBall', 2], ['stardust', 1]] },
  },
  {
    id: 'sq_carta', titulo: 'Carta para a Vila Sussurro', regiao: 'Rota 2', de: 'lamacal',
    requer: { flags: ['mounts.correr'] },
    resumo: 'O Andarilho não consegue atravessar o lamaçal. Ele pede que você leve uma carta até a Anciã Iara.',
    oferta: ['Você atravessa o lamaçal, né? Eu não. Faz uma semana que tento.', 'Leva esta carta para a Anciã Iara, na Vila Sussurro? É da neta dela.'],
    itensIniciais: [['carta_andarilho', 1]],
    aceita: ['A Iara mora no meio dos jequitibás, depois do bosque. Obrigado, viu?'],
    lembrete: ['A carta é para a Anciã Iara, na Vila Sussurro.'],
    etapas: [
      { tipo: 'entregar', npc: 'anciao_sussurro', item: 'carta_andarilho', texto: 'Entregue a carta à Anciã Iara, na Vila Sussurro',
        pergunta: ['Uma carta para mim? Do meu povo lá de Campina?'],
        falas: ['É da minha neta! Ela diz que lá o trigo também está crescendo devagar, como se esperasse o sol.', 'Fique com isto. É pouco perto da notícia que você me trouxe.'] },
    ],
    recompensa: { dinheiro: 800, itens: [['bigMushroom', 1]] },
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
  vovo_camp: {
    reage: { tipo: { flying: ['Ei! Esse aí voa… Ele não come trigo, né? Né?'] } },
  },
};
