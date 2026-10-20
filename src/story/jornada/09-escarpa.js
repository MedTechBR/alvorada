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
  sol: '6h54',
  cenas: [
    {
      id: 'j09_chegada',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'entrar', alvo: 'cidade_escarpa', requer: ['nh.sina', 'nh.mapaParedao'], semFlag: ['nh.chegouEscarpa'] },
      falas: [
        ['narrador', 'Cidade Escarpa: casas penduradas na rocha, escadas esculpidas no paredão e um ateliê de pedra com estátuas pela calçada.'],
        ['narrador', 'Do alto da cidade, dá para ver o Relógio de Pedra no topo do Planalto, pequeno contra o céu. A tempestade está parada sobre ele.'],
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
        ['narrador', 'No meio da praça, a Dra. Véspera segura uma caixa com sete pedras. O Admin Sereno está ao lado dela, de capa roxa, sorrindo.'],
        ['vespera', 'Sete pedras, Sereno. Falta só a de Lamparina. Com as oito no Relógio, a Aurora fica sem luzita.'],
        ['sereno', 'Claro, Dra. Véspera. Já deixei tudo pronto para entregar.'],
        ['vespera', 'Entregar? Entregar a quem?'],
        ['sereno', 'Ao Senhor Solano. Foi um prazer trabalhar com você. Ele manda lembranças.'],
        ['narrador', 'O Sereno arranca a caixa das mãos dela e corre pela escada da escarpa. Dois recrutas abrem caminho para ele.'],
        ['vespera', 'Sereno! Você… você era dele desde o começo?'],
        ['jogador', 'Ele espionava a senhora para o Solano. Como a senhora não percebeu?'],
      ],
      depois: {
        flags: { 'nh.traicaoSereno': true },
        objetivo: { texto: 'Fale com a Dra. Véspera: o que o Sereno estava escondendo?', alvo: 'ninho_cidade_escarpa' },
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
        ['vespera', 'Eu traduzi as inscrições do Relógio por dezesseis anos. Tinha certeza de que as oito pedras fechariam o cadeado.'],
        ['vespera', 'Mas o Sereno copiou as traduções para a equipe e trocou "fechar" por "abrir". Eu não conferi, porque confiava nele.'],
        ['jogador', 'Então juntar as oito no Relógio não fecha nada. Abre o cadeado.'],
        ['vespera', 'Abre. O Necrozma, que come a luz, sai. O Solano quer capturá-lo e vender luz infinita para as cidades.'],
        ['vespera', 'A Crepúsculo trabalhou para o plano do Solano sem saber. Ele só precisava de alguém que juntasse as pedras.'],
        ['jogador', 'Então a senhora não quer a noite. Quer impedir a Aurora de vender a luz.'],
        ['vespera', 'Isso. Não tenho mais pedras, mas ainda posso ajudar. Cuidado com o Solano: ele quer abrir o Relógio.'],
      ],
      depois: {
        flags: { 'nh.reviravolta4': true },
        objetivo: { texto: 'Descoberta: juntar as oito pedras ABRE o cadeado, e o Solano quer o Necrozma. Vá à Mina Velha, vença os mineiros e enfrente a Líder Graça', alvo: 'leader_graca', treinadores: ['g7_juvenal', 'g7_rita'], rotulo: 'Mineiros' },
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
        ['graca', 'Traz mesmo. E cuidado com o Sereno: ele finge ser amigo.'],
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
        { id: 'graca_mina', quem: 'graca', nome: 'Líder Graça', look: LOOKS.zelia, spot: 'ninho_cidade_escarpa', permanente: true, padrao: ['O Sereno ainda vai me pagar por levar a pedra da minha cidade.'] },
        { id: 'g7_juvenal', quem: 'aprendiz', nome: 'Mineiro Juvenal', look: LOOKS.mineiro, spot: 'ninho_cidade_escarpa', visao: 5, apos: ['Eu caí, mas a Graça ainda está de pé. Você vai precisar de mais do que sorte.'] },
        { id: 'g7_rita', quem: 'aprendiz', nome: 'Alpinista Rita', look: LOOKS.mediumH, spot: 'ninho_cidade_escarpa', visao: 5, apos: ['Os Pokémon de Pedra da Graça aguentam muito dano. Leve golpes de Água ou de Planta.'] },
      ],
    },
    {
      id: 'j09_graca_insignia',
      local: 'ninho_cidade_escarpa',
      gatilho: { tipo: 'vencer', alvo: 'leader_graca' },
      falas: [
        ['graca', 'A Insígnia Rocha é sua. Com ela, seu Pokémon pode voar, mas só até as cidades que você já visitou.'],
        ['narrador', '{jogador} recebeu a Insígnia Rocha!'],
        ['graca', 'Se você achar a pedra de Escarpa, traga de volta. Ela é da minha cidade.'],
        ['graca', 'Vá ao Arquipélago das Brasas, ao sul. O Ébano quer acordar o vulcão, e a cinza fecharia o caminho até o Relógio.'],
      ],
      depois: {
        insignia: 'escarpa', montaria: 'corviknight',
        flags: { 'nh.voar': true },
        objetivo: { texto: 'Vá ao Arquipélago das Brasas, a sudeste: voe com o Corviknight ou pegue o Barco das Brasas com o Capitão Tonho, no cais de Vila Siri, no Sertão', alvo: 'siri_barqueiro' },
      },
      atores: [
        { id: 'graca_mina', quem: 'graca', nome: 'Líder Graça', look: LOOKS.zelia, spot: 'ninho_cidade_escarpa', permanente: true },
      ],
    },
    {
      id: 'j09_boletim7',
      gatilho: { tipo: 'flag', alvo: 'badges.escarpa', semFlag: ['nh.boletim.7'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis e cinquenta e quatro. A Aurora diz, pela primeira vez, que é uma "variação passageira".'],
        ['mae', '{jogador}, seis e cinquenta e quatro. Passageira? Faz mais de uma semana. Você sabe o que está acontecendo?'],
        ['jogador', 'A Aurora está mentindo, Mãe. Vou ao Relógio de Pedra resolver isso.'],
      ],
      depois: { flags: { 'nh.boletim.7': true, 'nh.sol': '6h54' }, ambiente: true },
    },
  ],
};
