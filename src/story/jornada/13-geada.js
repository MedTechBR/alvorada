// Segmento 13 · Cordilheira Geada (arco de região: Estrada da Vitória, sem ginásio). Ordem: docs/jornada-classica.md,
// seção 2, linha 13. Rota 12 → Rota 15 (lago congelado) → Vila Geada (o professor voltou ao observatório) → Rota 16 →
// Caverna de Gelo (3 andares) → Cume do Vento Branco → RIVAL 5: o Téo, no Cume. Ele mudou de lado na mina e quer uma
// luta de verdade antes da Elite, para saber se aguenta ficar do lado certo.
// Libera o caminho para a Liga do Zênite. Sem reviravolta nesta cordilheira: a história fica no Relógio e na Liga.
// Níveis: Téo (rival 5) 52, com a equipe de rival de estágio 4.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova13',
  jornada: 'geada',
  titulo: 'A Estrada da Vitória',
  sol: '6h04',
  cenas: [
    {
      id: 'j13_chegada',
      local: 'geada_entrada_oeste',
      gatilho: { tipo: 'entrar', alvo: 'geada_entrada_oeste', requer: ['nh.seloFechado'], semFlag: ['nh.chegouGeada'] },
      falas: [
        ['narrador', 'A Cordilheira Geada começa numa estrada de terra, com neve nas margens. Ao longe, os picos brancos recortam o céu.'],
        ['narrador', 'Esta é a Estrada da Vitória, o último caminho até a Liga. Ela atravessa frio, vento e uma vila escondida no alto.'],
        ['jogador', 'Não existe outro caminho para a Liga. Então é melhor eu subir logo.'],
        ['narrador', 'Um vento seco desce do alto e enche a estrada de neve fina, que brilha como açúcar.'],
      ],
      depois: {
        flags: { 'nh.chegouGeada': true },
        objetivo: { texto: 'Atravesse a Rota 15, pelo lago congelado, até a Vila Geada', alvo: 'ninho_vila_geada' },
      },
    },
    {
      id: 'j13_vila_geada',
      local: 'ninho_vila_geada',
      gatilho: { tipo: 'entrar', alvo: 'vila_geada', requer: ['nh.chegouGeada'], semFlag: ['nh.vilaGeada'] },
      falas: [
        ['narrador', 'Vila Geada: casas de madeira com telhado de neve, um observatório de cúpula de vidro e uma estalagem sempre quente.'],
        ['prof', 'Ravi! Depois do Relógio eu não podia ficar parado. A aurora daqui é a melhor medição que eu tenho.'],
        ['prof', 'Cuidado na Caverna de Gelo. Dizem que o eco repete a voz de quem passa, e às vezes não sabemos quem responde.'],
        ['prof', 'E o Téo subiu para o Cume ontem. Ele quer enfrentar você lá em cima, antes da Liga. Não deixe ele te achar despreparado.'],
        ['jogador', 'O senhor não parece cansado depois de tudo. Fico feliz de ver.'],
      ],
      depois: {
        flags: { 'nh.vilaGeada': true },
        objetivo: { texto: 'Siga pela Rota 16 até a Caverna de Gelo, no meio da cordilheira', alvo: 'caverna_gelo_1' },
      },
      atores: [
        { id: 'prof_geada', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'dentro_observatorio_boreal', longe: 4 },
      ],
    },
    {
      id: 'j13_caverna_gelo',
      local: 'caverna_gelo_1',
      gatilho: { tipo: 'entrar', alvo: 'caverna_gelo_1', requer: ['nh.vilaGeada'], semFlag: ['nh.cavernaGelo'] },
      falas: [
        ['narrador', 'A Caverna de Gelo tem três andares, cada um mais frio. As paredes são de gelo azul, com bolhas de ar presas nele.'],
        ['narrador', 'No primeiro andar, sua voz volta mais grave do que você falou. Parece que alguém responde do fundo, usando a sua voz.'],
        ['jogador', 'Eco não me assusta. Eu vou subir.'],
        ['narrador', 'No terceiro andar, uma luz fraca aparece ao fundo. Na saída para o Cume, alguém está parado de costas, esperando.'],
      ],
      depois: {
        flags: { 'nh.cavernaGelo': true },
        objetivo: { texto: 'Saia da Caverna de Gelo pelo topo e chegue ao Cume do Vento Branco', alvo: 'cume_vento_branco' },
      },
    },
    {
      // Téo: o rival 5, no Cume. Ele quer ver se o jogador merece chegar à Liga.
      id: 'j13_teo_cume',
      local: 'cume_vento_branco',
      gatilho: { tipo: 'entrar', alvo: 'cume_vento_branco', requer: ['nh.cavernaGelo'], semFlag: ['nh.rival5'] },
      falas: [
        ['teo', 'Você demorou. Eu fiquei esperando aqui desde ontem, olhando o vento e pensando se você ia mesmo subir.'],
        ['jogador', 'Eu subi. E o seu pai? Eu o vi no Relógio, Téo. Ele está bem, e está livre.'],
        ['teo', 'Eu sei. Eu não estou aqui por ele. Ou melhor, estou, mas não do jeito que você pensa.'],
        ['teo', 'Mudei de lado na mina e não sei se aguento ficar do lado certo. Quero uma luta de verdade antes da Elite.'],
        ['jogador', 'Então vamos lutar. Você fala depois, se quiser.'],
        ['teo', 'Se eu ganhar, eu falo. Se perder, falo do mesmo jeito. Mas eu vou falar, Ravi.'],
      ],
      depois: {
        batalha: {
          id: 'nh_rival5', nome: 'Rival Téo', dinheiro: 5200, perder: 'continua',
          equipe: [
            [398, 50, ['braveBird', 'closeCombat', 'uTurn', 'quickAttack']],
            [59, 50, ['flareBlitz', 'extremeSpeed', 'crunch', 'wildCharge']],
            [197, 51, ['foulPlay', 'moonlight', 'toxic', 'snarl']],
            ['rival:4', 52, []],
          ],
        },
        flags: { 'nh.rival5': true },
      },
      atores: [
        { id: 'teo_cume', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_cume', longe: 3 },
      ],
    },
    {
      id: 'j13_teo_fim',
      local: 'cume_vento_branco',
      gatilho: { tipo: 'vencer', alvo: 'nh_rival5' },
      falas: [
        ['teo', 'Tá, você ganhou. Eu não estou com raiva. Estou com frio, e isso é pior.'],
        ['teo', 'Meu pai já saiu da mina, e eu vou com ele para casa. Nenhuma companhia manda mais em nós dois.'],
        ['teo', 'Quando a Elite perguntar quem te trouxe até aqui, diga o meu nome. Eu estou no Portão da Liga, esperando você.'],
        ['jogador', 'Eu digo, Téo. Pode deixar.'],
        ['narrador', 'O Téo estende a mão sem muita cerimônia. A luta não resolveu tudo, mas aproximou os dois.'],
        ['jogador', 'Até a Liga, Téo.'],
      ],
      depois: {
        flags: { 'nh.teoFinalPronto': true, geada_vencida: true },
        objetivo: { texto: 'Desça ao Planalto e suba o Caminho do Zênite, na Rota 12, até a Liga do Zênite', alvo: 'zenite_entrada' },
      },
      atores: [
        { id: 'teo_cume', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_cume', longe: 3 },
      ],
    },
  ],
};
