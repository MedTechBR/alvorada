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
      gatilho: { tipo: 'entrar', alvo: 'ninho_cidade_escarpa', requer: ['nh.sina', 'nh.mapaParedao'], semFlag: ['nh.chegouEscarpa'] },
      falas: [
        ['narrador', 'Cidade Escarpa: casas penduradas na rocha, escadas esculpidas no paredão e um ateliê de pedra com estátuas pela calçada.'],
        ['narrador', 'Dá para ver o Planalto dos Ventos lá em cima, com o Relógio de Pedra no topo, pequeno, contra o céu. A tempestade está parada sobre ele.'],
        ['jogador', 'A Líder Graça guarda a pedra da cidade. Mas a Sina me disse que ela já foi levada. Preciso descobrir por quem.'],
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
      gatilho: { tipo: 'entrar', alvo: 'ninho_cidade_escarpa', requer: ['nh.chegouEscarpa'], semFlag: ['nh.traicaoSereno'] },
      falas: [
        ['narrador', 'No meio da praça, a Dra. Véspera segura uma caixa de madeira com sete pedras de cores diferentes. O Admin Sereno está ao lado dela, de capa roxa, sorrindo.'],
        ['vespera', 'Sete, Sereno. Só falta uma. Com as oito no Relógio, a noite finalmente vai ter fim para quem merece.'],
        ['sereno', 'Claro, Dra. Véspera. Com as oito no Relógio, a noite vai ter fim. Ou o cadeado vai abrir de vez.'],
        ['vespera', 'O que você disse?'],
        ['sereno', 'Disse que foi um prazer trabalhar com você. O Senhor Solano manda lembranças. E os cristais também.'],
        ['narrador', 'O Sereno puxa a caixa das mãos dela, dá um passo para trás e corre pela escada da escarpa. Atrás dele, dois recrutas abrem caminho com as lanternas apagadas.'],
        ['vespera', 'Sereno! Você… você era dele desde o começo?'],
        ['jogador', 'Não era a Crepúsculo que estava mandando. Eu vi o nome do Solano em todas as cartas.'],
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
        ['vespera', 'Eu traduzi as inscrições do Relógio com as minhas próprias mãos. Dezesseis anos de estudo. Eu tinha certeza de que as oito pedras fariam o sol dormir.'],
        ['vespera', 'Mas o Sereno cuidou das traduções. Ele trocou as palavras de "fechar" por "abrir". E eu não li de novo, porque confiava nele.'],
        ['jogador', 'Então juntar as oito no Relógio não fecha a noite. Abre o cadeado.'],
        ['vespera', 'Abre. E o Necrozma, que come a luz, sai do Relógio. O Solano sabe disso. Ele quer capturá-lo e vender luz infinita para todas as cidades.'],
        ['vespera', 'A Crepúsculo foi só a faca que cortou a corda. Quem segurava a corda era a Aurora, desde a primeira amostra.'],
        ['jogador', 'Então a Dra. Véspera não está do lado da noite. Está tentando impedir a Aurora de capturar a luz.'],
        ['vespera', 'Eu estou tentando impedir que alguém compre o amanhecer. Se você quiser me acreditar, vá ao Relógio antes do Solano. Eu levo a pedra que me sobrou.'],
      ],
      depois: {
        flags: { 'nh.reviravolta4': true },
        objetivo: { texto: 'Descoberta: juntar as oito pedras no Relógio ABRE o cadeado, e o Solano quer o Necrozma. Vá à Mina Velha, ao fundo da cidade, e enfrente a Líder Graça', alvo: 'ninho_cidade_escarpa' },
      },
      atores: [
        { id: 'vespera_escarpa', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'ninho_cidade_escarpa', longe: 3 },
      ],
    },
    {
      id: 'j09_juvenal',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'avistar', alvo: 'g7_juvenal' },
      falas: [['aprendiz', 'A Graça não perde uma luta de pé. Ela cai, levanta e bate de novo. Pedra não se cansa.']],
      depois: { batalha: { id: 'g7_juvenal', nome: 'Mineiro Juvenal', dinheiro: 1600, equipe: [[524, 33, ['rockBlast', 'headbutt', 'sandAttack']], [837, 34, ['rapidSpin', 'smokescreen', 'ancientPower']]] } },
    },
    {
      id: 'j09_rita',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'avistar', alvo: 'g7_rita' },
      falas: [['aprendiz', 'Subir a Mina Velha é fácil. Descer é que é a parte difícil.']],
      depois: { batalha: { id: 'g7_rita', nome: 'Alpinista Rita', dinheiro: 1650, equipe: [[932, 34, ['rockThrow', 'saltCure', 'headbutt']], [744, 35, ['rockThrow', 'bite', 'howl']]] } },
    },
    {
      id: 'j09_graca_ginasio',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'falar', alvo: 'graca', requer: ['nh.reviravolta4', 'trainers.g7_juvenal', 'trainers.g7_rita'], semFlag: ['badges.escarpa'] },
      falas: [
        ['graca', 'Você chegou ao fundo da Mina Velha, e não ficou com a cara de quem apanhou das pedras. Isso é bom.'],
        ['graca', 'A minha pedra sumiu com o Sereno ontem. Não vou negar que fiquei com raiva. Então agora você vai levar uma pancada de rocha.'],
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
        { id: 'g7_juvenal', quem: 'aprendiz', nome: 'Mineiro Juvenal', look: LOOKS.mineiro, spot: 'ninho_cidade_escarpa', visao: 5, apos: ['O Juvenal caiu, mas ele ainda acha que o Relógio é um bom lugar para dormir.'] },
        { id: 'g7_rita', quem: 'aprendiz', nome: 'Alpinista Rita', look: LOOKS.mediumH, spot: 'ninho_cidade_escarpa', visao: 5, apos: ['Subir é mais fácil que descer. Você já percebeu?'] },
      ],
    },
    {
      id: 'j09_graca_insignia',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'vencer', alvo: 'leader_graca' },
      falas: [
        ['graca', 'A Insígnia Rocha é sua. Ela deixa voar sobre as cidades que você já visitou, mas só essas. O céu é de quem conhece o chão.'],
        ['narrador', '{jogador} recebeu a Insígnia Rocha!'],
        ['graca', 'Eu não sabia que a pedra estava sendo usada para abrir o Relógio. Se você for ao Relógio, leve a pedra da cidade de volta. É dela, não de nenhum deles.'],
        ['graca', 'Vá ao Brasas, no vulcão ao sul. Dizem que o Ébano tentou acordá-lo na Ilha do Basalto. Se o vulcão acordar, o vento do planalto vai para cima da cidade.'],
      ],
      depois: {
        insignia: 'escarpa', montaria: 'corviknight',
        flags: { 'nh.voar': true },
        objetivo: { texto: 'Pegue o barco no cais de Cidade Escarpa e vá à Ilha do Basalto, no arquipélago das Brasas', alvo: 'cais_basalto' },
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
      ],
      depois: { flags: { 'nh.boletim.7': true, 'nh.sol': '7h03' }, ambiente: true },
    },
  ],
};
