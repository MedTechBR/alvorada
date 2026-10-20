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
        ['jandira', 'A Marina está no galpão, no fim do píer. Mas tem gente de capa roxa rondando por lá desde cedo.'],
        ['jogador', 'Capa roxa? É a Equipe Crepúsculo?'],
        ['jandira', 'Deve ser. Chegam de madrugada e não falam com ninguém. Vá ver se a Marina precisa de ajuda.'],
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
        ['ebano', 'Fique fora disso, Líder. A Dra. Véspera mandou pegar a pedra do seu ginásio.'],
        ['marina', 'Proteger? Vocês arrombam caixas de madrugada! Saiam do meu galpão.'],
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
        ['vespera', 'Você venceu o Ébano. Isso é raro, quase tão raro quanto o sol nascer na hora.'],
        ['jogador', 'Você é a Dra. Véspera. A Crepúsculo quer as oito pedras para quê?'],
        ['vespera', 'As pedras prendem algo perigoso no Relógio de Pedra. Quero guardá-las num lugar seguro, longe de quem lucra com a luz.'],
        ['vespera', 'Vença a Marina e siga para a Cidade Coral. Lá você vai ver quem lucra com a luz.'],
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
        ['marina', 'Você chegou ao fundo do galpão. Meus Pokémon de água estão bem treinados.'],
        ['marina', 'Meus Pokémon de água são rápidos e se adaptam a qualquer golpe. Vamos ver se você acompanha.'],
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
        { id: 'marina_galpao_lider', quem: 'marina', nome: 'Líder Marina', look: LOOKS.marina, spot: 'dentro_galpao_barcos', permanente: true, padrao: ['O lago e o mar são enormes. Cuide bem dos seus Pokémon de água.'] },
      ],
    },
    {
      id: 'j03_marina_insignia',
      local: 'galpao_barcos',
      gatilho: { tipo: 'vencer', alvo: 'leader_marina' },
      falas: [
        ['marina', 'Pronto, a Insígnia Gota é sua. Ela deixa usar a água fora da batalha, com um Pokémon que saiba nadar.'],
        ['narrador', '{jogador} recebeu a Insígnia Gota!'],
        ['marina', 'Agora você pode atravessar o lago e chegar ao mar.'],
        ['marina', 'A Crepúsculo veio roubar a minha pedra. Se quiser saber mais do porto, fale com o Seu Nestor. Depois siga pela Rota 4.'],
      ],
      depois: {
        insignia: 'espelho', montaria: 'lapras',
        flags: { 'nh.nadar': true },
        objetivo: { texto: 'Pegue a Rota 4, na água, e siga para a Cidade Coral, a leste', alvo: 'praca_coral' },
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
        ['nestor', 'Cada garrafa tem uma história. Todo ano eu jogo uma no mar, com um bilhete dentro, para quem achar.'],
        ['nestor', 'Quase nunca volta nenhuma. Mas esta semana uma veio presa nas raízes do manguezal, a oeste. Eu não aguento a lama.'],
        ['jogador', 'Uma garrafa que voltou? Eu pego para o senhor.'],
        ['nestor', 'Obrigado. Quero ver se alguém respondeu ao meu bilhete.'],
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
        ['narrador', 'Entre as raízes do mangue, uma garrafa verde está presa numa rede. Dentro, o bilhete do Nestor e outro papel.'],
        ['narrador', 'A letra é torta, escrita com pressa:'],
        ['narrador', '"Recebi o seu bilhete, mas não posso sair daqui. Estamos presos no nível 4 da mina."'],
        ['narrador', '"A luz da Aurora não é limpa. Ela vem dos cabos da mina onde trabalhamos. Heitor."'],
        ['jogador', 'Heitor, cabos, nível 4... Isso é de uma mina. Ele deve estar preso na Mina Aurora.'],
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
        ['nestor', 'Ele não está doente, está preso lá embaixo e pediu ajuda. Alguém precisa avisar o Téo.'],
        ['nestor', 'Leve o bilhete ao Téo. Eu fico com uma cópia. Garrafa que responde merece lugar de honra.'],
        ['jogador', 'Eu levo ao Téo. E vou ajudar a tirar o Heitor de lá.'],
        ['narrador', 'O Seu Nestor copia o bilhete num papel limpo e guarda a cópia numa caixa de madeira, com as outras garrafas.'],
      ],
      depois: { itens: [['ultraBall', 3]], flags: { 'nh.sqGarrafaFim': true, 'nh.bilheteHeitor': true }, ambiente: true },
    },
    {
      id: 'j03_boletim3',
      gatilho: { tipo: 'flag', alvo: 'badges.espelho', semFlag: ['nh.boletim.3'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis e vinte e sete. Em Porto Espelho, os pescadores saíram no escuro.'],
        ['mae', '{jogador}, seis e vinte e sete. O sol atrasa a cada dia. Você está bem?'],
        ['jogador', 'Estou bem, Mãe. Se eu descobrir o motivo do atraso, te conto.'],
      ],
      depois: { flags: { 'nh.boletim.3': true, 'nh.sol': '6h27' }, ambiente: true },
    },
  ],
};
