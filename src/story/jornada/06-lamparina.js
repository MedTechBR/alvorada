// Segmento 06 · Vila Lamparina (Dona Zélia, Fantasma, ás 32). Ordem: docs/jornada-classica.md, seção 2, linha 6.
// Rota 5 (brejo, de noite) → Vila Lamparina → Casarão das Velas (ataque noturno da Crepúsculo, com o Admin Ébano)
// → Cemitério das Velas (a Dra. Véspera e o Absol, à beira do laguinho; ela não revela nada ainda) → Dona Zélia
// entrega a Vela Eterna "para guardar" (é a oitava chave: reviravolta 5, explicada no Mirante) → Líder Zélia
// (com os médiuns Odete e Ciro). Libera a Rota 6 (ferrovia).
// Níveis: recrutas 24; Ébano 26; médiuns 27–28; Zélia 30–32.
// Não há missão secundária aqui: a cidade é toda da trama.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova06',
  jornada: 'lamparina',
  titulo: 'A noite que não acaba',
  sol: '6h42',
  cenas: [
    {
      id: 'j06_chegada',
      local: 'vila_lamparina',
      gatilho: { tipo: 'entrar', alvo: 'vila_lamparina', requer: ['nh.teoDuvida'], semFlag: ['nh.chegouLamparina'] },
      falas: [
        ['narrador', 'Vila Lamparina: casas baixas com janelas de vidro colorido, lampiões acesos mesmo de dia e um cheiro de cera de vela.'],
        ['narrador', 'A Dona Zélia é a líder do ginásio e cuida do Casarão das Velas, onde fica a pedra da cidade.'],
        ['benta', 'Chegou! Come mais um pedaço. Aqui a gente janta cedo.'],
        ['benta', 'Ouvi no rádio que tem gente de capa roxa rondando o Casarão das Velas. Vá ver, mas volte cedo.'],
        ['jogador', 'Prometo, Vó Benta. Vou ao casarão e volto cedo.'],
      ],
      depois: {
        flags: { 'nh.chegouLamparina': true },
        objetivo: { texto: 'Vá ao Casarão das Velas depois que escurecer e veja quem está rondando a Dona Zélia', alvo: 'casarao_velas' },
      },
      atores: [
        { id: 'benta_vila', quem: 'benta', nome: 'Vó Benta', look: LOOKS.benta, spot: 'benta', permanente: true, padrao: ['Come mais um pedaço. Gente magra é vergonha pra avó.'] },
      ],
    },
    {
      // ataque noturno: só de noite, no Casarão das Velas
      id: 'j06_casarao_ataque',
      local: 'casarao_velas',
      gatilho: { tipo: 'entrar', alvo: 'casarao_velas', hora: 'noite', requer: ['nh.chegouLamparina'], semFlag: ['nh.ebanoLamparina'] },
      falas: [
        ['narrador', 'Dentro do casarão, a Dona Zélia segura um candelabro. Dois recrutas tentam arrancar do teto a pedra que fica presa na lanterna do salão.'],
        ['zelia', 'Saiam da minha casa! Essa pedra acende as velas da cidade há mais tempo do que vocês têm de vida.'],
        ['recruta', 'Não é pedra de vela, velha. A chefe mandou pegar as pedras dos ginásios. Ela diz que é para proteger a região.'],
        ['recruta2', 'Avisa o Admin Ébano. Ele disse que alguém ia aparecer por aqui.'],
        ['ebano', 'Admin Ébano. Vim buscar a pedra, Dona Zélia. E você de novo no meu caminho.'],
        ['jogador', 'Você rouba pedras no escuro, Ébano. Devolva isso e vá embora!'],
      ],
      depois: {
        batalha: {
          id: 'c6_recruta', nome: 'Recruta Crepúsculo', dinheiro: 1100, perder: 'repete',
          equipe: [[198, 24, ['peck', 'astonish', 'pursuit']], [41, 24, ['leechLife', 'supersonic', 'astonish']]],
        },
        flags: { 'nh.ebanoLamparina': true },
      },
      atores: [
        { id: 'zelia_casarao', quem: 'zelia', nome: 'Dona Zélia', look: LOOKS.zelia, spot: 'dentro_casarao_velas', longe: 3 },
        { id: 'recruta_casarao', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_casarao_velas', longe: 4 },
        { id: 'recruta2_casarao', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_casarao_velas', longe: 4 },
        { id: 'ebano_casarao', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'dentro_casarao_velas', longe: 3 },
      ],
    },
    {
      id: 'j06_casarao_fim',
      local: 'casarao_velas',
      gatilho: { tipo: 'vencer', alvo: 'c6_recruta' },
      falas: [
        ['ebano', 'Você derrubou meus recrutas. Não me faça perder tempo com o resto. A Dra. Véspera vai te encontrar no cemitério.'],
        ['narrador', 'O Ébano recua pela porta dos fundos. A pedra da lanterna continua no lugar, meio solta.'],
        ['zelia', 'Deixe a pedra onde está. Eu não tenho mais força para segurar a porta se eles voltarem.'],
      ],
      depois: {
        flags: { 'nh.casaraoEvento': true },
        objetivo: { texto: 'Siga para o Cemitério das Velas, a noroeste, e veja quem a Dra. Véspera está esperando', alvo: 'cemiterio_velas' },
      },
      atores: [
        { id: 'zelia_casarao', quem: 'zelia', nome: 'Dona Zélia', look: LOOKS.zelia, spot: 'dentro_casarao_velas', permanente: true },
      ],
    },
    {
      // Véspera e o Absol no laguinho do cemitério. Ela fala, mas não revela o que sabe.
      id: 'j06_cemiterio_vespera',
      local: 'cemiterio_velas',
      gatilho: { tipo: 'entrar', alvo: 'cemiterio_velas', requer: ['nh.casaraoEvento'], semFlag: ['nh.viuVespera6'] },
      falas: [
        ['narrador', 'Velas acesas em cada túmulo, mesmo sem vento. Ao lado de um laguinho escuro, uma mulher de casaco longo está sentada, com um Absol aos pés.'],
        ['vespera', 'Você aparece onde ninguém chamou. Está atrapalhando o meu trabalho.'],
        ['jogador', 'Você é a Dra. Véspera. O que a Crepúsculo quer de verdade?'],
        ['vespera', 'Quero as pedras longe da Companhia Aurora. A luz que ela vende custa mais caro do que parece.'],
        ['vespera', 'Pergunte à Dona Zélia pela vela que a família dela guarda. Ela é mais importante do que parece.'],
        ['narrador', 'O Absol levanta a cabeça, olha para você por um instante e volta a dormir. A Dra. Véspera se levanta e some entre as lápides.'],
      ],
      depois: {
        flags: { 'nh.viuVespera6': true },
        objetivo: { texto: 'Volte ao Casarão das Velas e pergunte à Dona Zélia sobre a vela que ela guarda', alvo: 'zelia' },
      },
      atores: [
        { id: 'vespera_cemiterio', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'cemiterio_porta', longe: 3 },
        { id: 'absol_cemiterio', quem: 'absol', pokemon: 359, nome: 'Absol', spot: 'absol_lago', cena: ['j06_cemiterio_vespera'] },
      ],
    },
    {
      // a Vela Eterna: a Dona Zélia a entrega para guardar. Solano já a procurou (ele aparece no Mirante).
      id: 'j06_zelia_vela',
      local: 'casarao_velas',
      gatilho: { tipo: 'falar', alvo: 'zelia', requer: ['nh.viuVespera6'], semFlag: ['nh.velaEterna'] },
      falas: [
        ['zelia', 'Pela vela, então. É a Vela Eterna. Ela está na minha família desde antes da estrada de ferro.'],
        ['zelia', 'Um homem de terno branco veio aqui ontem, perguntou dela e foi embora sorrindo. Eu não gostei do sorriso dele.'],
        ['zelia', 'Ele quer essa vela, e eu não sei por quê. Aqui ela não está segura. Leve e não a acenda até eu mandar.'],
        ['narrador', 'A Dona Zélia coloca uma vela de cera escura nas suas mãos. O pavio está apagado, mas a cera ainda está morna.'],
        ['jogador', 'Pode deixar, eu guardo a vela. Ninguém vai tirá-la de mim.'],
      ],
      depois: {
        flags: { 'nh.velaEterna': true },
        objetivo: { texto: 'Vença os médiuns Odete e Ciro e desafie a Dona Zélia no Casarão das Velas', alvo: 'zelia', treinadores: ['g5_odete', 'g5_ciro'], rotulo: 'Médiuns' },
      },
      atores: [
        { id: 'zelia_casarao', quem: 'zelia', nome: 'Dona Zélia', look: LOOKS.zelia, spot: 'dentro_casarao_velas', permanente: true },
      ],
    },
    {
      id: 'j06_odete',
      local: 'casarao_velas',
      gatilho: { tipo: 'avistar', alvo: 'g5_odete' },
      falas: [['aprendiz', 'A Zélia começa com um Lampent e termina com um Chandelure. Os dois são Fogo e Fantasma: Água e Sombrio resolvem.']],
      depois: { batalha: { id: 'g5_odete', nome: 'Médium Odete', dinheiro: 1100, equipe: [[92, 27, ['lick', 'hypnosis', 'nightShade']], [93, 28, ['lick', 'hypnosis', 'curse']]] } },
    },
    {
      id: 'j06_ciro',
      local: 'casarao_velas',
      gatilho: { tipo: 'avistar', alvo: 'g5_ciro' },
      falas: [['aprendiz', 'A Dona Zélia tem um Dusknoir que segura a porta. Golpe Sombrio atravessa a defesa dele.']],
      depois: { batalha: { id: 'g5_ciro', nome: 'Médium Ciro', dinheiro: 1150, equipe: [[355, 27, ['shadowSneak', 'willOWisp', 'feintAttack']], [609, 28, ['flamethrower', 'shadowBall', 'willOWisp']]] } },
    },
    {
      id: 'j06_zelia_ginasio',
      local: 'casarao_velas',
      gatilho: { tipo: 'falar', alvo: 'zelia', requer: ['nh.velaEterna', 'trainers.g5_odete', 'trainers.g5_ciro'], semFlag: ['badges.lamparina'] },
      falas: [
        ['zelia', 'Você passou pelos meus médiuns. Eles são teimosos, como a vela, e como eu. Agora é a minha vez.'],
        ['zelia', 'Não vou perguntar se você está pronto. Pelo seu jeito, acho que está. Vamos ver se está mesmo.'],
        ['jogador', 'Dona Zélia, antes de começar: a vela precisa ficar apagada mesmo?'],
        ['zelia', 'Precisa. Só acenda quando eu avisar. Eu digo quando for a hora.'],
      ],
      depois: {
        batalha: {
          id: 'leader_zelia', nome: 'Dona Zélia', dinheiro: 3200,
          equipe: [
            [608, 30, ['flamethrower', 'shadowBall', 'willOWisp']],
            [94, 31, ['shadowBall', 'hypnosis', 'curse']],
            [477, 32, ['shadowPunch', 'hypnosis', 'suckerPunch']],
            [609, 32, ['flamethrower', 'shadowBall', 'willOWisp']],
          ],
        },
      },
      atores: [
        { id: 'zelia_casarao', quem: 'zelia', nome: 'Dona Zélia', look: LOOKS.zelia, spot: 'dentro_casarao_velas', permanente: true, padrao: ['Chá? Tem de erva-cidreira e de assombração. O de assombração é de erva-cidreira também.'] },
      ],
    },
    {
      id: 'j06_zelia_insignia',
      local: 'casarao_velas',
      gatilho: { tipo: 'vencer', alvo: 'leader_zelia' },
      falas: [
        ['zelia', 'A Insígnia Vela é sua. Ela lembra que até uma luz pequena enfrenta a escuridão.'],
        ['narrador', '{jogador} recebeu a Insígnia Vela!'],
        ['zelia', 'A Véspera e o homem de branco querem a mesma vela. Nenhum dos dois pode ficar com ela.'],
        ['zelia', 'Guarde-a bem. A Rota 6 segue pela ferrovia, a leste, e a Aurora pôs carrinhos novos nos trilhos. Olhe antes de pisar.'],
      ],
      depois: {
        insignia: 'lamparina',
        flags: { 'nh.velaGuardada': true },
        objetivo: { texto: 'Siga pela Rota 6 (ferrovia) até a Cidade Aurora, a leste', alvo: 'cidade_aurora' },
      },
      atores: [
        { id: 'zelia_casarao', quem: 'zelia', nome: 'Dona Zélia', look: LOOKS.zelia, spot: 'dentro_casarao_velas', permanente: true },
      ],
    },
    {
      id: 'j06_boletim5',
      gatilho: { tipo: 'flag', alvo: 'badges.lamparina', semFlag: ['nh.boletim.5'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis e quarenta e dois. Vila Lamparina teve a noite mais longa da região.'],
        ['mae', '{jogador}, seis e quarenta e dois. Quase quarenta minutos de atraso desde o primeiro boletim. Não gosto nada disso.'],
        ['jogador', 'Mãe, a Dona Zélia me deu uma vela para guardar. Ela parece saber mais do que diz.'],
      ],
      depois: { flags: { 'nh.boletim.5': true, 'nh.sol': '6h42' }, ambiente: true },
    },
  ],
};
