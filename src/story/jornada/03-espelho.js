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
        ['narrador', 'Para continuar, você precisa de uma insígnia que deixe usar a água. A Líder Marina tem a Insígnia Gota e fica no Galpão de Barcos.'],
        ['jandira', 'A moqueca hoje está de lamber os dedos. A Marina está no galpão, no fim do píer. Mas cuidado: ontem estranharam uns barcos sem dono.'],
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
        ['narrador', 'Dentro do galpão, a Marina está de costas para a porta, com um Pokémon de água na frente. Dois recrutas tentam abrir a caixa de ferramentas onde ela guarda uma pedra.'],
        ['marina', 'Ei! Essa caixa é do ginásio, e a pedra também. Saiam daqui!'],
        ['ebano', 'Admin Ébano, da Equipe Crepúsculo. A Dra. Véspera quer a pedra longe de quem a vende. Fique fora disso, Líder.'],
        ['marina', 'Quem vende é você. Essas tábuas de barco contam a história toda: vocês chegam de noite, e o sol atrasa no dia seguinte.'],
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
        { id: 'marina_galpao', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'galpao_barcos', longe: 3 },
        { id: 'recruta_galpao', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'galpao_barcos', longe: 4 },
        { id: 'recruta2_galpao', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'galpao_barcos', longe: 4 },
        { id: 'ebano_galpao', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'galpao_barcos', longe: 3 },
      ],
    },
    {
      // Véspera aparece no píer, ao fim do ataque. Ela não luta: observa, e deixa um recado.
      id: 'j03_vespera_pier',
      local: 'porto_espelho',
      gatilho: { tipo: 'vencer', alvo: 'c3_ebano' },
      falas: [
        ['narrador', 'Quando o Ébano recua, uma mulher de casaco longo aparece na ponta do píer. Ela não tem Pokémon à vista, só um Absol sentado a seus pés.'],
        ['vespera', 'Você venceu o meu homem. Isso é raro. Quase tão raro quanto a sua pontualidade.'],
        ['jogador', 'Você é a Dra. Véspera. A Crepúsculo quer as oito pedras para quê?'],
        ['vespera', 'Para que a noite não acabe, menino. A luz de hoje é só uma moeda: ela compra o amanhecer de quem tem dinheiro.'],
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
      falas: [['aprendiz', 'A Marina usa o Basculin no fim. Ele morde forte e nada mais rápido ainda.']],
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
        { id: 'marina_galpao_lider', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'galpao_barcos', permanente: true, padrao: ['Você vai nadar, de qualquer jeito. Vai ser bom para o seu cansaço.'] },
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
        ['marina', 'A Crepúsculo voltou aqui por causa das tábuas do galpão. Elas guardam um mapa de todas as cargas que saíram daqui este ano. Vá ver o Seu Nestor, ele tem um sino de vento que vê mais que eu.'],
      ],
      depois: {
        insignia: 'espelho', montaria: 'lapras',
        flags: { 'nh.nadar': true },
        objetivo: { texto: 'Pegue a Rota 4, na água, e siga para a Cidade Coral, a leste', alvo: 'cidade_coral' },
      },
      atores: [
        { id: 'marina_galpao_lider', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'galpao_barcos', permanente: true },
      ],
    },
    {
      // missão secundária: a garrafa do Seu Nestor. Começo: ele pede. Meio: a garrafa no manguezal. Fim: o nome do Heitor.
      id: 'j03_sq_garrafa_inicio',
      local: 'porto_espelho',
      gatilho: { tipo: 'falar', alvo: 'nestor', semFlag: ['nh.sqGarrafa'] },
      falas: [
        ['nestor', 'Cada garrafa tem uma história. Essa aqui só tem areia. Mas é uma areia muito bonita.'],
        ['nestor', 'Eu jogo uma garrafa no mar desde o ano em que a Aurora chegou. Uma delas voltou com um bilhete de um mineiro. Você pode achar a outra no manguezal?'],
      ],
      secundaria: { texto: 'Ache a garrafa do Seu Nestor no manguezal, a oeste do porto', alvo: 'manguezal' },
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
        ['narrador', 'Entre as raízes dos mangues, uma garrafa verde está presa numa rede de pesca. Dentro, um papel enrolado, molhado e pálido.'],
        ['narrador', 'A letra é torta, de quem escreve no escuro: "Estamos no nível 4. A luz daqui não é limpa, é a mesma que sai dos nossos cabos. Heitor."'],
        ['jogador', 'Heitor. Esse é o nome do pai do Téo. O Téo disse que ele trabalha na Mina Aurora.'],
      ],
      secundaria: { texto: 'Leve o bilhete ao Seu Nestor, no porto de Porto Espelho', alvo: 'nestor' },
      depois: { flags: { 'nh.achouGarrafa': true }, ambiente: true },
    },
    {
      id: 'j03_sq_garrafa_fim',
      local: 'porto_espelho',
      gatilho: { tipo: 'falar', alvo: 'nestor', requer: ['nh.achouGarrafa'], semFlag: ['nh.sqGarrafaFim'] },
      falas: [
        ['nestor', 'Heitor! Esse nome eu conheço. O menino da Aurora que cantava no barco quando era pequeno. Ele é pai do Téo, não é?'],
        ['nestor', 'Se ele escreveu isso, não é coisa de quem está doente. É coisa de quem está preso lá embaixo. Leve o papel ao Téo, antes que a Aurora o encontre.'],
        ['jogador', 'Eu levo. E eu vou descer até lá.'],
      ],
      itens: [['superRepel', 2]],
      depois: { flags: { 'nh.sqGarrafaFim': true, 'nh.bilheteHeitor': true }, ambiente: true },
    },
    {
      id: 'j03_boletim3',
      gatilho: { tipo: 'flag', alvo: 'badges.espelho', semFlag: ['nh.boletim.3'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e vinte e sete minutos. Os pescadores do porto dizem que o lago está mais escuro de manhã.'],
        ['mae', 'Ravi, seis e vinte e sete. O Capitão Ivo disse que nunca viu o sol tão preguiçoso. Ele mandou um abraço, aliás.'],
      ],
      depois: { flags: { 'nh.boletim.3': true, 'nh.sol': '6h27' }, ambiente: true },
    },
  ],
};
