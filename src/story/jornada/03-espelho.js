// Segmento 03 · Porto Espelho (Líder Marina, Água, ás 24). Ordem: docs/jornada-classica.md, seção 2, linha 3.
// Rota 3 (ponte) → Porto Espelho → Galpão de Barcos (ataque da Crepúsculo com o Admin Ébano; Véspera aparece no
// píer) → aprendizes Zeca e Tainá → Líder Marina. Libera NADAR (insígnia Gota). Missão secundária: a garrafa do
// Seu Nestor, que leva ao nome do Heitor (pai do Téo, mineiro da Mina Aurora).
// Níveis: Ébano 12–14 (reaproveitado de cap03.js: c3_ebano); aprendizes 10–12; Marina 20–24.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova03',
  jornada: 'espelho',
  titulo: 'O espelho partido',
  sol: '6h27',
  cenas: [
    {
      id: 'j03_chegada',
      local: 'porto_espelho',
      gatilho: { tipo: 'entrar', alvo: 'porto_espelho', requer: ['badges.sussurro'], semFlag: ['nh.chegouEspelho'] },
      falas: [
        ['narrador', 'Porto Espelho: um píer comprido, barcos encostados e um lago tão calmo que parece uma lâmina.'],
        ['narrador', 'Para atravessar o lago e chegar ao mar, você precisa da Insígnia Gota. A Líder Marina fica no Galpão de Barcos.'],
        ['jandira', 'A moqueca hoje está de lamber os dedos. A Marina está no galpão, no fim do píer. Mas ontem apareceram uns barcos sem dono.'],
        ['jogador', 'Barcos sem dono? Quem faria isso?'],
        ['jandira', 'Gente de capa roxa, que chega de madrugada e não fala com ninguém. Eles estão rondando o galpão desde cedo.'],
      ],
      depois: {
        flags: { 'nh.chegouEspelho': true },
        objetivo: { texto: 'Vá ao Galpão de Barcos, no fim do píer, e veja o que a Crepúsculo quer ali', alvo: 'galpao_barcos' },
      },
      atores: [
        { id: 'jandira_porto', quem: 'jandira', nome: 'Tia Jandira', look: LOOKS.jandira, spot: 'jandira', permanente: true, padrao: ['A Marina fica no galpão de barcos, no fim do píer comprido.'] },
      ],
    },
    {
      id: 'j03_galpao_ataque',
      local: 'galpao_barcos',
      gatilho: { tipo: 'entrar', alvo: 'galpao_barcos', requer: ['nh.chegouEspelho'], semFlag: ['nh.ebanoEspelho'] },
      falas: [
        ['narrador', 'Dentro do galpão, a Marina enfrenta dois recrutas que tentam abrir a caixa onde ela guarda a pedra.'],
        ['marina', 'Ei! Essa caixa é do ginásio, e a pedra também. Saiam daqui!'],
        ['ebano', 'Fique fora disso, Líder. A Dra. Véspera quer a pedra longe de quem a vende.'],
        ['marina', 'Quem vende são vocês, Ébano. Essas tábuas guardam as cargas do porto: vocês chegam de noite, e no dia seguinte o sol atrasa.'],
        ['ebano', 'Chega de conversa. Pokémon, para fora!'],
      ],
      depois: {
        batalha: {
          id: 'c3_ebano', nome: 'Admin Ébano', dinheiro: 1500, perder: 'continua',
          equipe: [[41, 12, ['bite', 'supersonic', 'wingAttack']], [228, 13, ['ember', 'bite', 'roar']], [302, 14, ['furySwipes', 'astonish', 'detect']]],
        },
        flags: { 'nh.ebanoEspelho': true },
      },
      atores: [
        { id: 'marina_galpao_ataque', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'dentro_galpao_barcos', longe: 3 },
        { id: 'recruta_galpao', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_galpao_barcos', longe: 4 },
        { id: 'recruta2_galpao', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_galpao_barcos', longe: 4 },
        { id: 'ebano_galpao', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'dentro_galpao_barcos', longe: 3 },
      ],
    },
    {
      // Véspera aparece no píer, ao fim do ataque. Ela não luta: observa, e deixa um recado.
      id: 'j03_vespera_pier',
      local: 'porto_espelho',
      gatilho: { tipo: 'vencer', alvo: 'c3_ebano' },
      falas: [
        ['narrador', 'Quando o Ébano recua, uma mulher de casaco longo aparece na ponta do píer, com um Absol sentado aos seus pés.'],
        ['vespera', 'Você venceu o meu homem, menino. Isso é raro, quase tão raro quanto o sol nascer na hora.'],
        ['jogador', 'Você é a Dra. Véspera. A Crepúsculo quer as oito pedras para quê?'],
        ['vespera', 'Para que a noite não acabe. A luz já virou moeda: quem tem dinheiro compra o amanhecer, e o resto espera no escuro.'],
        ['vespera', 'Vá à Líder Marina e depois siga para o mar, se ainda tiver coragem. A água também tem segredos.'],
      ],
      depois: {
        flags: { 'nh.viuVesperaPier': true },
        objetivo: { texto: 'Vença os aprendizes Zeca e Tainá e desafie a Líder Marina no Galpão de Barcos', alvo: 'marina', treinadores: ['g3_zeca', 'g3_taina'], rotulo: 'Aprendizes' },
      },
      atores: [
        { id: 'vespera_pier', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'porto_espelho', longe: 4 },
      ],
    },
    {
      id: 'j03_zeca',
      local: 'galpao_barcos',
      gatilho: { tipo: 'avistar', alvo: 'g3_zeca' },
      falas: [['aprendiz', 'A Marina guarda o Basculin para o fim. Ele morde forte e nada mais rápido que todos nós.']],
      depois: { batalha: { id: 'g3_zeca', nome: 'Pescador Zeca', dinheiro: 700, equipe: [[129, 10, ['splash', 'tackle', 'flail']], [339, 11, ['mudSlap', 'waterGun', 'amnesia']]] } },
    },
    {
      id: 'j03_taina',
      local: 'galpao_barcos',
      gatilho: { tipo: 'avistar', alvo: 'g3_taina' },
      falas: [['aprendiz', 'Quer chegar na Marina? Primeiro aprende a ficar molhado!']],
      depois: { batalha: { id: 'g3_taina', nome: 'Nadadora Tainá', dinheiro: 740, equipe: [[278, 11, ['waterGun', 'wingAttack', 'supersonic']], [183, 12, ['bubble', 'rollout', 'defenseCurl']]] } },
    },
    {
      id: 'j03_marina_ginasio',
      local: 'galpao_barcos',
      gatilho: { tipo: 'falar', alvo: 'marina', requer: ['trainers.g3_zeca', 'trainers.g3_taina', 'nh.viuVesperaPier'], semFlag: ['badges.espelho'] },
      falas: [
        ['marina', 'Você chegou ao fundo do galpão. Pouca gente chega sem ficar molhado. Os meus Pokémon estão bem treinados.'],
        ['marina', 'Água não tem forma. Ela pega o formato de quem a segura. Vamos ver se você sabe segurar.'],
        ['jogador', 'Então eu não vou ficar molhado à toa. Vamos ver quem nada melhor.'],
        ['marina', 'Esse é o espírito! Pode começar quando quiser. O Basculin já está ansioso para morder.'],
      ],
      depois: {
        batalha: {
          id: 'leader_marina', nome: 'Líder Marina', dinheiro: 2200,
          equipe: [
            [54, 20, ['waterGun', 'confusion', 'scratch']],
            [418, 21, ['aquaJet', 'quickAttack', 'waterGun']],
            [550, 22, ['aquaJet', 'bite', 'waterPulse', 'headbutt']],
            [120, 23, ['bubbleBeam', 'scald', 'recover']],
            [226, 24, ['bubbleBeam', 'waterfall', 'recover']],
          ],
        },
      },
      atores: [
        { id: 'marina_galpao_lider', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'dentro_galpao_barcos', permanente: true, padrao: ['Você vai nadar, de qualquer jeito. Vai ser bom para o seu cansaço.'] },
      ],
    },
    {
      id: 'j03_marina_insignia',
      local: 'galpao_barcos',
      gatilho: { tipo: 'vencer', alvo: 'leader_marina' },
      falas: [
        ['marina', 'Pronto, a Insígnia Gota é sua. Ela deixa usar a água fora da batalha, com um Pokémon que saiba nadar.'],
        ['narrador', '{jogador} recebeu a Insígnia Gota!'],
        ['marina', 'Água ensina a esperar a maré, e a não ter pressa. Agora você pode atravessar o lago.'],
        ['marina', 'A Crepúsculo voltou aqui por causa das cargas do porto. Vá ver o Seu Nestor: ele conhece cada barco que chega e sai.'],
      ],
      depois: {
        insignia: 'espelho', montaria: 'lapras',
        flags: { 'nh.nadar': true },
        objetivo: { texto: 'Pegue a Rota 4, na água, e siga para a Cidade Coral, a leste', alvo: 'cidade_coral' },
      },
      atores: [
        { id: 'marina_galpao_lider', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'dentro_galpao_barcos', permanente: true },
      ],
    },
    {
      // missão secundária: a garrafa do Seu Nestor. Começo: ele pede. Meio: a garrafa no manguezal. Fim: a letra do Heitor.
      id: 'j03_sq_garrafa_inicio',
      local: 'porto_espelho',
      gatilho: { tipo: 'falar', alvo: 'nestor', semFlag: ['nh.sqGarrafa'] },
      falas: [
        ['nestor', 'Cada garrafa tem uma história. Eu jogo uma no mar todo ano desde que a Aurora chegou, com um bilhete dentro, para quem achar.'],
        ['nestor', 'Quase nunca volta nenhuma. Mas esta semana uma veio presa nas raízes do manguezal, a oeste. Eu não aguento a lama.'],
        ['jogador', 'Uma das suas garrafas voltando… Isso parece coisa de pescador com saudade.'],
        ['nestor', 'É saudade, sim. E é curiosidade também: eu quero saber quem leu o meu bilhete e respondeu. Vai lá, filho.'],
      ],
      secundaria: { texto: 'Ache a garrafa que voltou, presa nas raízes do manguezal, a oeste do porto', alvo: 'manguezal' },
      depois: { flags: { 'nh.sqGarrafa': true }, ambiente: true },
      atores: [
        { id: 'nestor_porto', quem: 'nestor', nome: 'Seu Nestor', look: LOOKS.nestor, spot: 'nestor', permanente: true },
      ],
    },
    {
      id: 'j03_sq_garrafa_achada',
      local: 'manguezal',
      gatilho: { tipo: 'pisar', alvo: 'manguezal', requer: ['nh.sqGarrafa'], semFlag: ['nh.achouGarrafa'] },
      falas: [
        ['narrador', 'Entre as raízes dos mangues, uma garrafa verde está presa numa rede. Dentro, o bilhete do Nestor e um segundo papel, molhado.'],
        ['narrador', 'A letra é torta, de quem escreve no escuro: "Recebi o seu bilhete, mas não posso responder à vista. Estamos no nível 4. A luz daqui não é limpa, é a mesma que sai dos nossos cabos. Heitor."'],
        ['jogador', 'Heitor. O bilhete fala de cabos e de nível 4. Isso não parece coisa de pescador, parece coisa de mina.'],
        ['narrador', 'O papel está úmido, e a tinta escorre nas bordas. Você guarda os dois bilhetes no bolso com cuidado.'],
      ],
      secundaria: { texto: 'Leve a garrafa de volta ao Seu Nestor, no porto de Porto Espelho', alvo: 'nestor' },
      depois: { flags: { 'nh.achouGarrafa': true }, ambiente: true },
    },
    {
      id: 'j03_sq_garrafa_fim',
      local: 'porto_espelho',
      gatilho: { tipo: 'falar', alvo: 'nestor', requer: ['nh.achouGarrafa'], semFlag: ['nh.sqGarrafaFim'] },
      falas: [
        ['nestor', 'Heitor! Esse nome eu conheço. O menino que cantava nos barcos quando era pequeno. Ele é o pai do Téo, não é?'],
        ['nestor', 'Não é coisa de quem está doente. É de quem está preso lá embaixo e pediu ajuda. Respondeu à minha garrafa, filho!'],
        ['nestor', 'Leve o bilhete com você, para o Téo. Eu copio a letra para a minha caixa. Garrafa que responde merece um lugar de honra.'],
        ['jogador', 'Eu levo para o Téo. E um dia eu vou descer até lá para ver o que está acontecendo.'],
        ['narrador', 'O Seu Nestor copia o bilhete num papel limpo e guarda a cópia numa caixa de madeira, com as outras garrafas.'],
      ],
      depois: { itens: [['ultraBall', 3]], flags: { 'nh.sqGarrafaFim': true, 'nh.bilheteHeitor': true }, ambiente: true },
    },
    {
      id: 'j03_boletim3',
      gatilho: { tipo: 'flag', alvo: 'badges.espelho', semFlag: ['nh.boletim.3'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis horas e vinte e sete minutos. Os pescadores dizem que o lago está escuro.'],
        ['mae', 'Ravi, seis e vinte e sete. O Capitão Ivo disse que nunca viu o sol tão preguiçoso. Ele mandou um abraço, aliás.'],
        ['jogador', 'Mãe, amanhã cedo eu vou ver o lago. Se o sol atrasar mais, eu te conto.'],
      ],
      depois: { flags: { 'nh.boletim.3': true, 'nh.sol': '6h27' }, ambiente: true },
    },
  ],
};
