// Segmento 08 · Sertão do Levante (arco de região, sem ginásio). Ordem: docs/jornada-classica.md, seção 2, linha 8.
// Forte Rochedo → Estrada do Sertão (Vila Mandacaru) → Cânion → Ruínas de Pedra Pintada (Crepúsculo escava, com
// o Admin Ébano) → pinturas → REVIRAVOLTA 3: o Absol que aparece antes dos desastres é a Sina, a parceira da
// Dra. Véspera, presa à luz do Relógio → rival 4 (Téo, já do lado do jogador, mas quer medir o time) → Museu do Sertão:
// o mapa do Paredão (libera a Rota 8).
// Níveis: Ébano 35; rival 4 (Téo) 28–30. Os treinadores de rota do Sertão estão em missoes/regiao-sertao.js.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova08',
  jornada: 'sertao',
  titulo: 'Pedra pintada',
  sol: '6h47',
  cenas: [
    {
      id: 'j08_chegada',
      local: 'vila_mandacaru',
      gatilho: { tipo: 'entrar', alvo: 'vila_mandacaru', requer: ['nh.reviravolta2'], semFlag: ['nh.chegouSertao'] },
      falas: [
        ['narrador', 'Vila Mandacaru: casas de barro, uma cacimba no centro da praça e um vento seco que levanta areia até o meio da rua.'],
        ['narrador', 'A Crepúsculo escava as Ruínas de Pedra Pintada há uma semana. Ninguém na vila sabe o que eles procuram.'],
        ['jogador', 'Preciso chegar às ruínas antes da Crepúsculo. Elas podem esconder algo sobre o Relógio.'],
        ['narrador', 'Um menino de chapéu de palha vende água de cacimba numa caneca de lata. Ele aponta para o cânion, do outro lado da vila.'],
      ],
      depois: {
        flags: { 'nh.chegouSertao': true },
        objetivo: { texto: 'Atravesse o Cânion e chegue às Ruínas de Pedra Pintada, ao norte', alvo: 'sertao_ruinas_entrada' },
      },
    },
    {
      id: 'j08_escavacao',
      local: 'sertao_ruinas_entrada',
      gatilho: { tipo: 'entrar', alvo: 'sertao_ruinas_entrada', requer: ['nh.chegouSertao'], semFlag: ['nh.ebanoSertao'] },
      falas: [
        ['narrador', 'Na entrada das ruínas, a parede de pedra está riscada com linhas de escavação. Uma máquina de perfuração está parada ao lado de um buraco fundo.'],
        ['recruta', 'Falta só uma camada, Admin. Quando a pedra sair, é só levar.'],
        ['ebano', 'Esta parede tem o desenho do cadeado do Relógio. A Dra. Véspera precisa dele para usar as pedras.'],
        ['jogador', 'O cadeado do Relógio está desenhado nessa parede?'],
        ['ebano', 'Sim, desde muito antes da Aurora. Quem quiser ler esta parede vai ter que passar por mim.'],
      ],
      depois: {
        batalha: {
          id: 'c8_ebano', nome: 'Admin Ébano', dinheiro: 2400, perder: 'repete',
          equipe: [[302, 35, ['shadowClaw', 'foulPlay', 'willOWisp']], [430, 35, ['nightSlash', 'braveBird', 'suckerPunch']]],
        },
        flags: { 'nh.ebanoSertao': true },
      },
      atores: [
        { id: 'ebano_ruinas', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'sertao_ruinas_entrada', longe: 3 },
        { id: 'recruta_ruinas', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'sertao_ruinas_entrada', longe: 4 },
      ],
    },
    {
      id: 'j08_pinturas',
      local: 'ruinas_pintada_1',
      gatilho: { tipo: 'vencer', alvo: 'c8_ebano' },
      falas: [
        ['narrador', 'O Ébano some por um corredor de pedra. Atrás dele, um salão baixo tem pinturas vermelhas e ocre cobrindo o teto.'],
        ['narrador', 'Numa das pinturas, um Absol branco fica ao lado de uma mulher de casaco longo, diante de um relógio com oito estrelas.'],
        ['narrador', 'Em outra, duas mulheres idênticas aparecem sob a mesma estrela. A legenda está apagada, exceto pela palavra "irmãs".'],
        ['jogador', 'Esse é o Absol que aparece antes de cada desastre. Ele está em todas as pinturas, sempre ao lado da Véspera.'],
        ['narrador', 'Você passa a mão pela parede. A pintura é antiga, mas está bem conservada.'],
      ],
      depois: {
        flags: { 'nh.pinturas': true },
        objetivo: { texto: 'Procure o Absol branco nas Ruínas de Pedra Pintada: ele está escondido no salão do fundo', alvo: 'ruinas_pintada_2' },
      },
    },
    {
      // REVIRAVOLTA 3: o Absol é a Sina, a parceira da Véspera, presa à luz do Relógio desde então
      id: 'j08_sina_revela',
      local: 'ruinas_pintada_2',
      gatilho: { tipo: 'entrar', alvo: 'ruinas_pintada_2', requer: ['nh.pinturas'], semFlag: ['nh.sina'] },
      reviravolta: 3,
      falas: [
        ['narrador', 'No salão do fundo, o Absol branco está sentado sob um facho de luz dourada. A luz não é de sol. Ela vem de um cristal lá em cima.'],
        ['narrador', 'O Absol levanta a cabeça devagar e olha para você, como quem espera há muito tempo.'],
        ['narrador', 'Você estende a mão devagar. O Absol encosta a testa na sua palma. Um calor morno sobe pelo braço, e uma voz de mulher aparece dentro da sua cabeça.'],
        ['absol', 'Eu sou a Sina, a Absol da Véspera. Estamos juntas desde antes da Aurora.'],
        ['absol', 'A Véspera tentou fechar o Relógio sozinha, e a luz dele me prendeu. Desde então, eu aviso antes dos desastres.'],
        ['absol', 'Você me viu no bosque, na gruta, no cemitério e na mina. Eu guiava você até as pedras ameaçadas.'],
        ['jogador', 'Então você é a Sina. A Véspera sabe que você está aqui?'],
        ['absol', 'Sabe. Mas ela só me liberta mexendo no cadeado do Relógio, e ele prende o Necrozma. Ninguém deve soltá-lo.'],
      ],
      depois: {
        flags: { 'nh.sina': true, 'nh.viuSina': true },
        objetivo: { texto: 'Descoberta: o Absol é a Sina, a Absol da Dra. Véspera. Volte à praça de Mandacaru, onde o Téo espera, e depois pegue o mapa do Paredão no Museu', alvo: 'sertao_praca_mandacaru' },
      },
      atores: [
        { id: 'sina_ruinas', quem: 'absol', pokemon: 359, nome: 'Sina', spot: 'dentro_ruinas_pintada_2', cena: ['j08_sina_revela'] },
      ],
    },
    {
      id: 'j08_teo_rival4',
      local: 'sertao_praca_mandacaru',
      gatilho: { tipo: 'entrar', alvo: 'sertao_praca_mandacaru', requer: ['nh.sina'], semFlag: ['nh.rival4'] },
      falas: [
        ['teo', 'Fiquei do seu lado na mina, mas quero ver o seu time antes de seguir com você. Vamos batalhar!'],
        ['jogador', 'Você mudou de lado na mina, Téo. Ainda duvida de mim?'],
        ['teo', 'Não duvido de você. Só quero saber se o seu time aguenta o Paredão.'],
      ],
      depois: {
        batalha: {
          id: 'nh_rival4', nome: 'Rival Téo', dinheiro: 4200, perder: 'continua',
          equipe: [[397, 28, ['wingAttack', 'aerialAce', 'quickAttack']], [59, 28, ['flameWheel', 'crunch', 'extremeSpeed']], [197, 29, ['feintAttack', 'confuseRay', 'moonlight']], ['rival:3', 30, []]],
        },
        flags: { 'nh.rival4': true },
        objetivo: { texto: 'Pegue o mapa do Paredão no Museu do Sertão, em Vila Mandacaru', alvo: 'museu_sertao' },
      },
      atores: [
        { id: 'teo_sertao', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'sertao_praca_mandacaru', longe: 3 },
      ],
    },
    {
      id: 'j08_mapa_paredao',
      local: 'museu_sertao',
      gatilho: { tipo: 'entrar', alvo: 'museu_sertao', requer: ['nh.rival4'], semFlag: ['nh.mapaParedao'] },
      falas: [
        ['narrador', 'O Museu do Sertão guarda um mapa dobrado em quatro, com a trilha do Paredão marcada em cor. O nome da Cidade Escarpa está escrito em caneta.'],
        ['narrador', 'No verso, um recado de letra miúda: "Quem sobe o Paredão sem mapa se perde no vento. Siga a trilha marcada em cor."'],
        ['teo', 'Eu conheço esse mapa. Meu pai tinha uma cópia parecida na garagem. Ele dizia que o Paredão levava ao Relógio.'],
        ['jogador', 'Seu pai já procurava o Relógio? Depois você pergunta a ele.'],
      ],
      depois: {
        flags: { 'nh.mapaParedao': true },
        objetivo: { texto: 'Com o mapa, escale o Paredão pela Rota 8 até a Cidade Escarpa', alvo: 'ninho_cidade_escarpa' },
        ambiente: true,
      },
    },
  ],
};
