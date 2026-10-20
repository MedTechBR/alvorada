// Segmento 13 · Cordilheira Geada (arco de região: Estrada da Vitória, sem ginásio). Ordem: docs/jornada-classica.md,
// seção 2, linha 13. Rota 12 → Rota 15 (lago congelado) → Vila Geada (o professor liga do observatório) → Rota 16 →
// Caverna de Gelo (3 andares) → Cume do Vento Branco → RIVAL 5: o Téo, no Cume (ele também vai para a Liga, e explica
// o porquê: quer ver o pai sair da Aurora e quer uma luta de verdade antes da Elite).
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
        ['narrador', 'A Cordilheira Geada começa numa estrada de terra batida, com a neve já acumulada nas margens. Ao longe, os picos brancos parecem recortados no céu.'],
        ['narrador', 'Esta é a Estrada da Vitória. Quem quer chegar à Liga do Zênite precisa atravessar a cordilheira inteira, com frio, vento e uma vila escondida no alto.'],
        ['jogador', 'Depois do Relógio, o caminho para a Liga é este. Não há outro jeito de chegar lá sem passar pelo gelo.'],
        ['narrador', 'Um vento seco desce do alto da cordilheira e enche a estrada de neve fina, que brilha como açúcar.'],
      ],
      depois: {
        flags: { 'nh.chegouGeada': true },
        objetivo: { texto: 'Atravesse a Rota 15, pelo lago congelado, até a Vila Geada', alvo: 'ninho_vila_geada' },
      },
    },
    {
      id: 'j13_vila_geada',
      local: 'ninho_vila_geada',
      gatilho: { tipo: 'entrar', alvo: 'ninho_vila_geada', requer: ['nh.chegouGeada'], semFlag: ['nh.vilaGeada'] },
      falas: [
        ['narrador', 'Vila Geada: casas de madeira com telhado de neve, um observatório com cúpula de vidro e uma estalagem onde o fogo nunca apaga.'],
        ['prof', 'Ravi, está me ouvindo? Eu estou no observatório da vila. Um rapaz da estalagem me emprestou o telefone.'],
        ['prof', 'Vá com cuidado na Caverna de Gelo. Dizem que o eco do gelo repete as vozes de quem passou por lá, e ninguém volta sem ouvir a própria voz de volta.'],
        ['prof', 'E o Téo subiu para o Cume ontem. Ele disse que quer enfrentar você lá em cima, antes da Liga. Não deixe ele te achar despreparado.'],
        ['jogador', 'O professor no observatório. Eu não imaginava que ele fosse tão animado lá em cima.'],
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
        ['narrador', 'A Caverna de Gelo tem três andares, cada um mais frio que o anterior. As paredes são de gelo azul, e dentro dele dá para ver bolhas de ar presas, como lembranças.'],
        ['narrador', 'No primeiro andar, o seu próprio eco volta mais grave do que você falou. Parece que alguém está respondendo no fundo, com a sua voz.'],
        ['jogador', 'Eu vou subir. Não tenho medo de eco.'],
        ['narrador', 'No terceiro andar, uma luz fraca aparece ao fundo: a saída para o Cume do Vento Branco. Alguém está parado ali, de costas, esperando.'],
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
        ['jogador', 'Eu subi. E o seu pai? Eu o vi no Relógio, Téo. Ele está bem.'],
        ['teo', 'Eu sei. Eu não estou aqui por causa dele. Ou melhor, estou, mas não do jeito que você pensa.'],
        ['teo', 'Eu quero entrar na Liga e ver se a Aurora ainda tem poder sobre quem trabalha lá embaixo. Se tiver, eu quero ser o primeiro a dizer isso para a Elite.'],
        ['jogador', 'Então vamos lutar, e você fala depois que ganhar.'],
        ['teo', 'Se eu ganhar, eu falo. Se você ganhar, eu falo também. Mas eu vou falar, Ravi.'],
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
        ['teo', 'Tá. Você ganhou. Eu não estou com raiva. Eu estou com frio, e isso é pior.'],
        ['teo', 'Então escuta. Meu pai vai sair da mina e voltar para casa, e eu vou com ele, se ele quiser. A Aurora não vai mais dar as ordens lá embaixo.'],
        ['teo', 'Quando você chegar à Liga, a Elite vai te pedir o seu nome. Diga o nome do Téo. Eu estou lá antes de você, no Portão da Liga.'],
        ['jogador', 'Eu digo, Téo. Até lá.'],
        ['narrador', 'O Téo estende a mão sem muita cerimônia. A luta não resolve tudo, mas ajuda a chegar mais perto.'],
        ['jogador', 'Eu aperto, Téo. Até a Liga.'],
      ],
      depois: {
        flags: { 'nh.teoFinalPronto': true },
        objetivo: { texto: 'Siga pela Rota 12 até a Liga do Zênite, no alto da cordilheira', alvo: 'ninho_liga_zenite' },
      },
      atores: [
        { id: 'teo_cume', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_cume', longe: 3 },
      ],
    },
  ],
};
