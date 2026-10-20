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
        ['narrador', 'A Dona Zélia é a líder da cidade. Ela guarda o casarão com as velas e um ginásio em que a luz só entra quando a noite cai.'],
        ['benta', 'Chegou! Come mais um pedaço. Aqui a gente janta cedo, porque a noite chega antes do sono.'],
        ['benta', 'Ouvi no rádio que tem gente de capa roxa rondando o casarão. Vá ver. Mas volte antes de dar meia-noite.'],
        ['jogador', 'Vou ao casarão e volto antes da meia-noite. Prometo, Vó Benta.'],
      ],
      depois: {
        flags: { 'nh.chegouLamparina': true },
        objetivo: { texto: 'Vá ao Casarão das Velas depois que escurecer e veja quem está rondando a Dona Zélia', alvo: 'casarao_velas' },
      },
      atores: [
        { id: 'benta_vila', quem: 'benta', nome: 'Vó Benta', look: LOOKS.benta, spot: 'benta', permanente: true, padrao: ['Come mais um pedaço. Neto magro é vergonha pra avó.'] },
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
        ['recruta', 'Não é pedra de vela, velha. É chave. E a chave vai para quem faz a noite durar.'],
        ['recruta2', 'Pode trazer o treinador, Admin Ébano. Ele quer ver a cara dele.'],
        ['ebano', 'Admin Ébano. Vim buscar a pedra, Dona Zélia. E o garoto que sempre aparece no caminho.'],
        ['jogador', 'Você está fazendo isso no escuro, Ébano. Pelo menos tenha coragem de dizer para quem.'],
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
        ['zelia', 'Você fica com a pedra, querido. Se eles voltarem, eu não tenho mais força para segurar a porta.'],
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
        ['narrador', 'O cemitério tem velas acesas em cada túmulo, mesmo sem vento. Ao lado de um laguinho escuro, uma mulher de casaco longo está sentada, com um Absol deitado a seus pés.'],
        ['vespera', 'Você tem o hábito de aparecer onde não é chamado. Isso é ótimo para quem quer roubar pedras. Péssimo para quem quer dormir.'],
        ['jogador', 'Você é a Dra. Véspera. O que a Crepúsculo quer de verdade?'],
        ['vespera', 'Quero que a noite fique do jeito que é, menino. A luz é uma dívida, e a dívida sempre cobra quem não sabe quem empresta.'],
        ['vespera', 'Pergunte à Dona Zélia pela vela que ela guarda desde o ano passado. E pergunte a si mesmo por que o sol atrasa só para quem tem pressa.'],
        ['narrador', 'O Absol levanta a cabeça, olha para você por um instante e volta a dormir. A Dra. Véspera se levanta e some entre as lápides.'],
      ],
      depois: {
        flags: { 'nh.viuVespera6': true },
        objetivo: { texto: 'Volte ao Casarão das Velas e pergunte à Dona Zélia sobre a vela que ela guarda', alvo: 'casarao_velas' },
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
        ['zelia', 'Você perguntou pela vela, querido. Ela é a Vela Eterna. Ficou acesa na minha família desde antes da estrada de ferro.'],
        ['zelia', 'Um homem de terno branco veio aqui ontem, perguntou dela e foi embora sorrindo. Eu não gostei do sorriso dele.'],
        ['zelia', 'Você tem cara de quem sabe guardar uma coisa. Leve a vela e não deixe ninguém acender ela antes de eu mandar.'],
        ['narrador', 'A Dona Zélia coloca uma vela de cera escura nas suas mãos. A chama é pequena, azulada, e não tremeu nem com o vento da porta.'],
        ['jogador', 'Uma vela que não treme com o vento. Isso não é cera comum.'],
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
      falas: [['aprendiz', 'A Zélia usa Lampent no fim. Fogo e fantasma. Água e Sombrio são seus amigos.']],
      depois: { batalha: { id: 'g5_odete', nome: 'Médium Odete', dinheiro: 1100, equipe: [[92, 27, ['lick', 'hypnosis', 'nightShade']], [93, 28, ['lick', 'hypnosis', 'curse']]] } },
    },
    {
      id: 'j06_ciro',
      local: 'casarao_velas',
      gatilho: { tipo: 'avistar', alvo: 'g5_ciro' },
      falas: [['aprendiz', 'Gire os espelhos: a luz da lua acende as velas. A Dona Zélia adora uma charada.']],
      depois: { batalha: { id: 'g5_ciro', nome: 'Médium Ciro', dinheiro: 1150, equipe: [[355, 27, ['shadowSneak', 'willOWisp', 'feintAttack']], [609, 28, ['flamethrower', 'shadowBall', 'willOWisp']]] } },
    },
    {
      id: 'j06_zelia_ginasio',
      local: 'casarao_velas',
      gatilho: { tipo: 'falar', alvo: 'zelia', requer: ['nh.velaEterna', 'trainers.g5_odete', 'trainers.g5_ciro'], semFlag: ['badges.lamparina'] },
      falas: [
        ['zelia', 'Você passou pelos meus médiuns. Eles são teimosos, como a vela, e como eu. Agora é a minha vez.'],
        ['zelia', 'Não vou perguntar se você está pronto. Eu já vi a sua cara de noite, e ela é de quem vai vencer.'],
        ['jogador', 'Dona Zélia, antes de começar: a vela ainda está na minha mochila. Ela precisa ficar apagada?'],
        ['zelia', 'Está, querido. E não é hora de acender. Você vai precisar dela quando a noite for mais escura.'],
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
        ['zelia', 'A Insígnia Vela é sua. Ela diz que a luz não precisa ser grande para ser teimosa. Só precisa ficar acesa.'],
        ['narrador', '{jogador} recebeu a Insígnia Vela!'],
        ['zelia', 'Escuta com atenção: quem perguntou pela vela não foi a Crepúsculo. Foi um homem de branco, e ele já sabe onde ela está guardada.'],
        ['zelia', 'Guarde a vela e não a acenda. A Rota 6 segue pela ferrovia, a leste. Mas olhe para os trilhos antes de pisar: a Aurora colocou carrinhos novos neles.'],
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
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e quarenta e dois minutos. Os moradores de Vila Lamparina dizem que a noite foi a mais longa da região.'],
        ['mae', 'Ravi, seis e quarenta e dois. Isso já é quase meia hora de atraso em cinco dias. Eu não gosto nada disso, filho.'],
        ['jogador', 'Dona Zélia disse que a noite foi a mais longa da região. Eu acredito nela.'],
      ],
      depois: { flags: { 'nh.boletim.5': true, 'nh.sol': '6h42' }, ambiente: true },
    },
  ],
};
