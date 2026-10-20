// Segmento 11 · Mirante dos Ventos (Líder Celeste, Voador, ás 45). Ordem: docs/jornada-classica.md, seção 2, linha 11.
// Planalto (Rota 9, depois que a tempestade acabou) → Mirante dos Ventos → o Prof. Jatobá é sequestrado pela
// Companhia Aurora (Lúcio, em combate) → Solano liga para o jogador e pede a Vela Eterna em troca do professor →
// REVIRAVOLTA 5: a Dona Zélia explica que a Vela Eterna é a OITAVA CHAVE do Relógio, e que ela está com o jogador
// desde Lamparina → aprendizes Bruno, Célia, Gael e Íris → Líder Celeste (com o Braviary, em Dynamax).
// Libera MERGULHAR (insígnia Pluma). Caminho ao Relógio de Pedra.
// Níveis: Lúcio 41–42; Celeste 43–45.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova11',
  jornada: 'mirante',
  titulo: 'Asas do Mirante',
  sol: '7h01',
  cenas: [
    {
      id: 'j11_chegada',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'entrar', alvo: 'mirante_ventos', requer: ['nh.tempestadeFim'], semFlag: ['nh.chegouMirante'] },
      falas: [
        ['narrador', 'Mirante dos Ventos: uma torre de vidro no topo do Planalto, com vento de todos os lados. Do alto, o Relógio de Pedra aparece do outro lado do vale.'],
        ['narrador', 'O Prof. Jatobá tinha marcado de encontrar você aqui. Pelo celular, ele disse que tinha algo importante para mostrar antes do Relógio.'],
        ['jogador', 'O professor nunca se atrasa. Algo está errado.'],
        ['narrador', 'Um vento frio sobe pelo vale e faz as bandeiras do mirante estalarem como velas de barco.'],
      ],
      depois: {
        flags: { 'nh.chegouMirante': true },
        objetivo: { texto: 'Procure o Prof. Jatobá no Mirante dos Ventos, perto da torre de vidro', alvo: 'ninho_mirante_ventos' },
      },
    },
    {
      // o sequestro: a Aurora chega de helicóptero e leva o professor. Lúcio luta para protegê-lo.
      id: 'j11_prof_sequestrado',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'entrar', alvo: 'mirante_ventos', requer: ['nh.chegouMirante'], semFlag: ['nh.profSequestrado'] },
      falas: [
        ['narrador', 'O Prof. Jatobá está sentado no muro do mirante, com uma pasta no colo. Um carro branco de faróis dourados para atrás dele, e um helicóptero começa a pousar.'],
        ['prof', '{jogador}, fuja! Eles não vieram conversar, vieram me buscar!'],
        ['lucio', 'Professor, o Senhor Solano pediu que o senhor nos acompanhe. Não precisamos fazer barulho.'],
        ['jogador', 'Solte o professor, Lúcio!'],
        ['lucio', 'O professor sabe coisas que o Senhor Solano quer saber. E você carrega algo que ele também quer.'],
      ],
      depois: {
        batalha: {
          id: 'c11_lucio', nome: 'Gerente Lúcio', dinheiro: 4200, perder: 'repete',
          equipe: [
            [462, 41, ['flashCannon', 'thunderbolt', 'magnetBomb']],
            [601, 41, ['gearGrind', 'thunderbolt', 'shiftGear']],
            [970, 42, ['powerGem', 'sludgeBomb', 'stealthRock']],
          ],
        },
        flags: { 'nh.profSequestrado': true },
      },
      atores: [
        { id: 'prof_mirante', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'ninho_mirante_ventos', longe: 3 },
        { id: 'lucio_mirante', quem: 'lucio', nome: 'Gerente Lúcio', look: LOOKS.lucio, spot: 'ninho_mirante_ventos', longe: 4 },
      ],
    },
    {
      // o Solano liga para o jogador: troca o professor pela vela
      id: 'j11_solano_liga',
      gatilho: { tipo: 'vencer', alvo: 'c11_lucio' },
      falas: [
        ['narrador', 'O Lúcio recua até o carro. O helicóptero da Aurora já está no ar, e o professor olha para você pela janela, com a pasta no peito.'],
        ['narrador', 'Seu celular toca. O número não está salvo, mas você reconhece a voz no primeiro segundo.'],
        ['solano', '{jogador}, certo? Eu acompanho você desde a inauguração em Cidade Coral. Você é muito eficiente.'],
        ['solano', 'O professor está sob a minha proteção. Ele volta inteiro se você me entregar a Vela Eterna que guarda.'],
        ['jogador', 'Você sequestrou um professor para pegar uma vela?'],
        ['solano', 'A vela é uma peça que eu preciso. O professor é só o motivo para você trazê-la.'],
        ['solano', 'Estarei no Relógio de Pedra. Venha rápido e traga a vela.'],
      ],
      depois: {
        flags: { 'nh.solanoLiga': true },
        ambiente: true,
      },
      atores: [
        { id: 'prof_mirante', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'ninho_mirante_ventos', cena: ['j11_prof_sequestrado'] },
      ],
    },
    {
      // REVIRAVOLTA 5: a Vela Eterna é a oitava chave, e ela estava com o jogador o tempo todo
      id: 'j11_vela_revelada',
      gatilho: { tipo: 'apos', cena: 'j11_solano_liga' },
      reviravolta: 5,
      falas: [
        ['zelia', '{jogador}, o Solano me ligou antes de ligar para você. Preciso contar a verdade sobre a vela.'],
        ['zelia', 'A Vela Eterna é a oitava chave do Relógio. As outras sete estavam nos ginásios.'],
        ['zelia', 'A pedra de Lamparina, a que o Ébano tentou levar, eu escondi dentro da vela. Por isso a vela é a oitava chave.'],
        ['jogador', 'Então eu tenho a oitava chave desde Lamparina. A senhora me deu para guardar.'],
        ['zelia', 'Dei porque você ia guardar melhor do que eu. Ainda bem que não acendeu. Ela só deve ser acesa no Relógio.'],
        ['jogador', 'O Solano quer que eu acenda a vela no Relógio, para abrir o cadeado e capturar o Necrozma. Não é isso?'],
        ['zelia', 'É isso. Mas as suas oito insígnias podem fechar o cadeado de novo. Chegue ao topo antes do Solano.'],
      ],
      depois: {
        flags: { 'nh.reviravolta5': true, 'nh.velaSelo': true },
        objetivo: { texto: 'Descoberta: a Vela Eterna é a oitava chave do Relógio, e estava com você desde Lamparina. Enfrente a Líder Celeste no Mirante e suba ao Relógio antes do Solano', alvo: 'leader_celeste', treinadores: ['r9_bruno', 'r9_celia', 'g8_gael', 'g8_iris'], rotulo: 'Treinadores' },
      },
    },
    {
      id: 'j11_bruno',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'r9_bruno' },
      falas: [['treinador', 'Piloto Bruno, do Mirante. Quem voa aqui não tem medo de nada. Vamos ver se você aguenta o vento!']],
      depois: { batalha: { id: 'r9_bruno', nome: 'Piloto Bruno', dinheiro: 1700, equipe: [[333, 37, ['dragonBreath', 'mirrorMove', 'cottonGuard']], [662, 38, ['flameCharge', 'wingAttack', 'agility']]] } },
    },
    {
      id: 'j11_celia',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'r9_celia' },
      falas: [['treinador', 'Vaqueira Célia, de Estepe dos Ventos. Passo a vida entre o vento e os bois. Vamos ver quem aguenta mais.']],
      depois: { batalha: { id: 'r9_celia', nome: 'Vaqueira Célia', dinheiro: 1750, equipe: [[128, 38, ['zenHeadbutt', 'takeDown', 'scaryFace']], [672, 38, ['razorLeaf', 'bulldoze', 'leechSeed']]] } },
    },
    {
      id: 'j11_gael',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'g8_gael' },
      falas: [['aprendiz', 'Eu sou o Gael, piloto de confiança da Celeste. Vou testar você antes dela!']],
      depois: { batalha: { id: 'g8_gael', nome: 'Piloto Gael', dinheiro: 1800, equipe: [[333, 38, ['dragonBreath', 'cottonGuard', 'peck']], [662, 39, ['flameCharge', 'acrobatics', 'agility']]] } },
    },
    {
      id: 'j11_iris',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'avistar', alvo: 'g8_iris' },
      falas: [['aprendiz', 'Sou a Íris, piloto da Celeste. Vamos ver se você aguenta o meu Pokémon!']],
      depois: { batalha: { id: 'g8_iris', nome: 'Piloto Íris', dinheiro: 1850, equipe: [[17, 39, ['wingAttack', 'twister', 'quickAttack']], [164, 40, ['airSlash', 'hypnosis', 'extrasensory']]] } },
    },
    {
      id: 'j11_celeste_ginasio',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'falar', alvo: 'celeste', requer: ['nh.velaSelo', 'trainers.r9_bruno', 'trainers.r9_celia', 'trainers.g8_gael', 'trainers.g8_iris'], semFlag: ['badges.mirante'] },
      falas: [
        ['celeste', 'Você passou por todos os pilotos do Planalto. Muito bem.'],
        ['celeste', 'Hoje o meu Braviary vai ficar gigante, com o Dynamax. Eu não vou pegar leve.'],
        ['jogador', 'Passei por todos os seus pilotos. Agora é a sua vez.'],
        ['celeste', 'Sei que você está com pressa por causa do professor. Mas não vou facilitar. Vamos lá!'],
      ],
      depois: {
        batalha: {
          id: 'leader_celeste', nome: 'Líder Celeste', dinheiro: 4400, dynamax: true,
          equipe: [
            [18, 43, ['wingAttack', 'twister', 'quickAttack']],
            [279, 43, ['gust', 'airSlash', 'hypnosis']],
            [823, 45, ['airSlash', 'roost', 'braveBird']],
            [628, 45, ['braveBird', 'wingAttack', 'hypnosis']],
          ],
        },
      },
      atores: [
        { id: 'celeste_torre', quem: 'celeste', nome: 'Líder Celeste', look: LOOKS.tecnica, spot: 'ninho_mirante_ventos', permanente: true, padrao: ['O Braviary da Celeste fica gigante na batalha. Leve uma equipe forte.'] },
        { id: 'r9_bruno', quem: 'treinador', nome: 'Piloto Bruno', look: LOOKS.observador, spot: 'r9_a', visao: 6, apos: ['Você ganhou. Cuidado: a Celeste é mais forte do que eu.'] },
        { id: 'r9_celia', quem: 'treinador', nome: 'Vaqueira Célia', look: LOOKS.campista, spot: 'r9_b', visao: 6, apos: ['Você ganhou dessa vez. Vou voltar com um vento mais forte.'] },
        { id: 'g8_gael', quem: 'aprendiz', nome: 'Piloto Gael', look: LOOKS.tecnico, spot: 'torre_gael', visao: 5, apos: ['A Celeste usa Pokémon Voadores. Golpes de Gelo, Elétrico e Pedra são fortes contra eles.'] },
        { id: 'g8_iris', quem: 'aprendiz', nome: 'Piloto Íris', look: LOOKS.tecnica, spot: 'torre_iris', visao: 5, apos: ['Você é forte, mas a Celeste é mais. Boa sorte!'] },
      ],
    },
    {
      id: 'j11_celeste_insignia',
      local: 'ninho_mirante_ventos',
      gatilho: { tipo: 'vencer', alvo: 'leader_celeste' },
      falas: [
        ['celeste', 'Eu perdi. A Insígnia Pluma é sua. Ela deixa você mergulhar nos lagos e rios do Planalto, onde o vento não alcança.'],
        ['narrador', '{jogador} recebeu a Insígnia Pluma!'],
        ['celeste', 'O Relógio fica do outro lado do vale. Atravesse pela ponte de pedra, à esquerda. Pela direita tem gente da Aurora.'],
        ['celeste', 'E traga o professor de volta, se conseguir.'],
      ],
      depois: {
        insignia: 'mirante', montaria: 'mantine',
        objetivo: { texto: 'Atravesse o vale pela ponte de pedra, à esquerda, e suba ao Relógio de Pedra', alvo: 'relogio_pedra' },
      },
      atores: [
        { id: 'celeste_torre', quem: 'celeste', nome: 'Líder Celeste', look: LOOKS.tecnica, spot: 'ninho_mirante_ventos', permanente: true },
      ],
    },
    {
      id: 'j11_boletim8',
      gatilho: { tipo: 'flag', alvo: 'badges.mirante', semFlag: ['nh.boletim.8'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às sete e um. A tempestade do Planalto acabou, mas o sol segue atrasado.'],
        ['mae', '{jogador}, sete e um. Eu não entendo mais nada. O Prof. Jatobá não atende o telefone desde ontem.'],
        ['jogador', 'Mãe, eu vou atrás dele. O Solano está no Relógio, e eu prometo que volto com o professor.'],
      ],
      depois: { flags: { 'nh.boletim.8': true, 'nh.sol': '7h01' }, ambiente: true },
    },
  ],
};
