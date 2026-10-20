// Segmento 09 · Cidade Escarpa (Líder Graça, Pedra, ás 41). Ordem: docs/jornada-classica.md, seção 2, linha 9.
// Rota 8 (escalada do Paredão, com o mapa do Museu e a Sina) → Cidade Escarpa → TRAIÇÃO: o Admin Sereno, braço
// direito da Véspera, revela que é espião de Solano e foge com sete pedras → REVIRAVOLTA 4: as traduções que guiavam
// a Crepúsculo foram falsificadas; juntar as oito pedras no Relógio não faz o sol dormir, ABRE o cadeado →
// aprendizes Juvenal e Rita → Líder Graça. Libera VOAR (insígnia Rocha), só para ninhos já visitados.
// Níveis: aprendizes 33–35 (reaproveitados de cap08.js); Graça 39–41.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova09',
  jornada: 'escarpa',
  titulo: 'Acima do Paredão',
  sol: '7h03',
  cenas: [
    {
      id: 'j09_chegada',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'entrar', alvo: 'cidade_escarpa', requer: ['nh.sina', 'nh.mapaParedao'], semFlag: ['nh.chegouEscarpa'] },
      falas: [
        ['narrador', 'Cidade Escarpa: casas penduradas na rocha, escadas esculpidas no paredão e um ateliê de pedra com estátuas pela calçada.'],
        ['narrador', 'Dá para ver o Planalto dos Ventos lá em cima, com o Relógio de Pedra no topo, pequeno, contra o céu. A tempestade está parada sobre ele.'],
        ['jogador', 'A Líder Graça guarda a pedra desta cidade. Se a Crepúsculo chegou primeiro, preciso saber disso agora.'],
        ['narrador', 'Na praça, o ateliê de pedra está com a porta aberta. Uma escultora de avental cinza acena para você, sem sorrir.'],
      ],
      depois: {
        flags: { 'nh.chegouEscarpa': true },
        objetivo: { texto: 'Procure a Líder Graça na Mina Velha, no fim da rua de pedra', alvo: 'ninho_cidade_escarpa' },
      },
    },
    {
      // a traição: o Sereno aparece com a Véspera e foge com as sete pedras
      id: 'j09_traicao',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'entrar', alvo: 'cidade_escarpa', requer: ['nh.chegouEscarpa'], semFlag: ['nh.traicaoSereno'] },
      falas: [
        ['narrador', 'No meio da praça, a Dra. Véspera segura uma caixa de madeira com sete pedras de cores diferentes. O Admin Sereno está ao lado dela, de capa roxa, sorrindo.'],
        ['vespera', 'Sete, Sereno. Com as oito no Relógio, a Aurora não vai ter mais luz para vender.'],
        ['sereno', 'Claro, Dra. Véspera. Falta só a da Lamparina, e a Dona Zélia nunca quis entregá-la.'],
        ['vespera', 'O que você disse?'],
        ['sereno', 'Disse que foi um prazer trabalhar com você. O Senhor Solano manda lembranças. E diz que a luz agora é dele.'],
        ['narrador', 'O Sereno puxa a caixa das mãos dela, dá um passo para trás e corre pela escada da escarpa. Atrás dele, dois recrutas abrem caminho com as lanternas apagadas.'],
        ['vespera', 'Sereno! Você… você era dele desde o começo?'],
        ['jogador', 'Não era a Crepúsculo que estava mandando. O nome do Solano está em todas as cartas do Forte Rochedo.'],
      ],
      depois: {
        flags: { 'nh.traicaoSereno': true },
        objetivo: { texto: 'Veja o que a Dra. Véspera sabe sobre as traduções que guiavam a Crepúsculo', alvo: 'ninho_cidade_escarpa' },
      },
      atores: [
        { id: 'vespera_escarpa', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'ninho_cidade_escarpa', longe: 3 },
        { id: 'sereno_escarpa', quem: 'sereno', nome: 'Admin Sereno', look: LOOKS.ebano, spot: 'ninho_cidade_escarpa', longe: 4 },
        { id: 'recruta_escarpa', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'ninho_cidade_escarpa', longe: 5 },
      ],
    },
    {
      // REVIRAVOLTA 4: as traduções falsas. Juntar as oito pedras ABRE o cadeado do Relógio.
      id: 'j09_traducoes',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'apos', cena: 'j09_traicao' },
      reviravolta: 4,
      falas: [
        ['vespera', 'Eu traduzi as inscrições do Relógio com as minhas próprias mãos, em dezesseis anos de estudo. Eu tinha certeza de que as oito pedras fechariam o cadeado.'],
        ['vespera', 'Mas o Sereno copiou as traduções para a equipe e trocou "fechar" por "abrir". Eu não conferi, porque confiava nele.'],
        ['jogador', 'Então juntar as oito no Relógio não fecha nada. Abre o cadeado.'],
        ['vespera', 'Abre. E o Necrozma, que come a luz, sai pela fenda. O Solano sabe disso. Ele quer capturá-lo e vender luz infinita para todas as cidades.'],
        ['vespera', 'A Crepúsculo foi só a mão que girou a chave. Quem mandava era a Aurora, desde a primeira amostra.'],
        ['jogador', 'Então a senhora não quer a noite. Quer impedir a Aurora de vender a luz.'],
        ['vespera', 'Quero impedir que alguém compre o amanhecer. Eu não tenho mais pedras. Só sei o que o Relógio pede. Desconfie de quem sorrir demais lá em cima.'],
      ],
      depois: {
        flags: { 'nh.reviravolta4': true },
        objetivo: { texto: 'Descoberta: juntar as oito pedras ABRE o cadeado, e o Solano quer o Necrozma. Vá à Mina Velha, vença os mineiros e enfrente a Líder Graça', alvo: 'mina_velha', treinadores: ['g7_juvenal', 'g7_rita'], rotulo: 'Mineiros' },
      },
      atores: [
        { id: 'vespera_escarpa', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'ninho_cidade_escarpa', longe: 3 },
      ],
    },
    {
      id: 'j09_juvenal',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'avistar', alvo: 'g7_juvenal' },
      falas: [['aprendiz', 'A Graça não cai fácil. Antes de chegar nela, você vai ter que passar por mim.']],
      depois: { batalha: { id: 'g7_juvenal', nome: 'Mineiro Juvenal', dinheiro: 1600, equipe: [[524, 33, ['rockBlast', 'headbutt', 'sandAttack']], [837, 34, ['rapidSpin', 'smokescreen', 'ancientPower']]] } },
    },
    {
      id: 'j09_rita',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'avistar', alvo: 'g7_rita' },
      falas: [['aprendiz', 'A Graça mandou a gente guardar a mina. Quem guarda mina não deixa ninguém passar sem luta.']],
      depois: { batalha: { id: 'g7_rita', nome: 'Alpinista Rita', dinheiro: 1650, equipe: [[932, 34, ['rockThrow', 'saltCure', 'headbutt']], [744, 35, ['rockThrow', 'bite', 'howl']]] } },
    },
    {
      id: 'j09_graca_ginasio',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'falar', alvo: 'graca', requer: ['nh.reviravolta4', 'trainers.g7_juvenal', 'trainers.g7_rita'], semFlag: ['badges.escarpa'] },
      falas: [
        ['graca', 'Você chegou ao fundo da Mina Velha e ainda está de pé. Isso eu respeito.'],
        ['graca', 'O Sereno levou a pedra da minha cidade. Não vou negar que estou com raiva, e vou descontar em você.'],
        ['jogador', 'Eu sinto muito pela pedra, Graça. Vou trazê-la de volta.'],
        ['graca', 'Traz mesmo. E não deixe o Sereno enganar você com sorriso. Ele sorri até para quem vai trair.'],
      ],
      depois: {
        batalha: {
          id: 'leader_graca', nome: 'Líder Graça', dinheiro: 3800,
          equipe: [
            [464, 39, ['earthquake', 'stoneEdge', 'headbutt']],
            [248, 40, ['crunch', 'stoneEdge', 'earthquake']],
            [526, 39, ['rockBlast', 'headbutt', 'rapidSpin']],
            [476, 41, ['rockTomb', 'thunderWave', 'earthquake']],
          ],
        },
      },
      atores: [
        { id: 'graca_mina', quem: 'graca', nome: 'Líder Graça', look: LOOKS.zelia, spot: 'ninho_cidade_escarpa', permanente: true, padrao: ['A pedra é dura, mas o coração de quem cuida dela é mais.'] },
        { id: 'g7_juvenal', quem: 'aprendiz', nome: 'Mineiro Juvenal', look: LOOKS.mineiro, spot: 'ninho_cidade_escarpa', visao: 5, apos: ['Eu caí, mas a Graça ainda está de pé. Você vai precisar de mais do que sorte.'] },
        { id: 'g7_rita', quem: 'aprendiz', nome: 'Alpinista Rita', look: LOOKS.mediumH, spot: 'ninho_cidade_escarpa', visao: 5, apos: ['Você já percebeu que é mais fácil subir que descer? Pense nisso antes de enfrentar a Graça.'] },
      ],
    },
    {
      id: 'j09_graca_insignia',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'vencer', alvo: 'leader_graca' },
      falas: [
        ['graca', 'A Insígnia Rocha é sua. Ela deixa voar sobre as cidades que você já visitou, mas só essas. O céu é de quem conhece o chão.'],
        ['narrador', '{jogador} recebeu a Insígnia Rocha!'],
        ['graca', 'Eu não sabia que a pedra servia de chave para o Relógio. Se ela aparecer, traga de volta. É da minha cidade, não de nenhum deles.'],
        ['graca', 'Vá ao Arquipélago das Brasas, no vulcão ao sul. Dizem que o Ébano quer acordá-lo. Se ele acordar, a cinza pode cobrir o Planalto inteiro.'],
      ],
      depois: {
        insignia: 'escarpa', montaria: 'corviknight',
        flags: { 'nh.voar': true },
        objetivo: { texto: 'Vá ao Arquipélago das Brasas, a sudeste: voe com o Corviknight ou pegue o Barco das Brasas no cais de Vila Siri, no Sertão', alvo: 'sertao_cais_siri' },
      },
      atores: [
        { id: 'graca_mina', quem: 'graca', nome: 'Líder Graça', look: LOOKS.zelia, spot: 'ninho_cidade_escarpa', permanente: true },
      ],
    },
    {
      id: 'j09_boletim7',
      gatilho: { tipo: 'flag', alvo: 'badges.escarpa', semFlag: ['nh.boletim.7'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às sete horas e três minutos. Pela primeira vez, a Companhia Aurora fala no rádio sobre o horário do sol: diz que é uma "variação passageira".'],
        ['mae', 'Ravi, sete e três. Passageira? Filho, faz mais de uma semana. Você está conseguindo ver o que está acontecendo lá em cima?'],
        ['jogador', 'A Aurora está mentindo, mãe. Vou ao Relógio ver com os meus próprios olhos o que ela esconde.'],
      ],
      depois: { flags: { 'nh.boletim.7': true, 'nh.sol': '7h03' }, ambiente: true },
    },
  ],
};
