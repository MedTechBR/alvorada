// Segmento 05 · Ilhas Jandaias (arco de região, sem ginásio). Ordem: docs/jornada-classica.md, seção 2, linha 5.
// Rota 17 (balsa de Cidade Coral) → Vila Jandaia → Templo das Raízes (3 andares; Ébano tenta levar a raiz de
// cristal) → Selva Grande → rival 3 (Téo, que ainda defende a Aurora porque o pai trabalha na Mina) → volta a Cidade
// Coral e segue para a Rota 5. Os treinadores de rota (Ilhas Gêmeas, Mar das Jandaias, Selva Grande, Templo) são os
// gerados em elenco-jandaia.js e regiao-jandaia.js; este arquivo não os repete.
// Níveis: Ébano 22–23; Téo (rival 3) 23–26.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova05',
  jornada: 'jandaias',
  titulo: 'As raízes das Jandaias',
  sol: '6h34',
  cenas: [
    {
      id: 'j05_chegada',
      local: 'vila_jandaia',
      gatilho: { tipo: 'entrar', alvo: 'vila_jandaia', requer: ['nh.pedraCoral2'], semFlag: ['nh.chegouJandaia'] },
      falas: [
        ['narrador', 'Vila Jandaia: casas de palha sobre estacas, pontes de cipó e um templo de raízes que cresce por cima da pedra.'],
        ['narrador', 'A Monja Aruã, do templo, disse ao rádio que as raízes estão secando e que a seiva está escurecendo.'],
        ['jogador', 'Raízes secando por causa de quê? Será a mesma luz que a Lia viu no bosque?'],
        ['narrador', 'Uma criança aponta para o templo, do outro lado da lagoa: "Tem gente de capa roxa lá dentro desde ontem."'],
      ],
      depois: {
        flags: { 'nh.chegouJandaia': true },
        objetivo: { texto: 'Atravesse a lagoa até o Templo das Raízes e veja quem está lá dentro', alvo: 'templo_raizes_porta' },
      },
    },
    {
      id: 'j05_templo_ebano',
      local: 'templo_raizes_1',
      gatilho: { tipo: 'entrar', alvo: 'templo_raizes_porta', requer: ['nh.chegouJandaia'], semFlag: ['nh.ebanoTemplo'] },
      falas: [
        ['narrador', 'Nas paredes do templo, raízes grossas se abrem como cortinas. No centro, uma raiz de cristal brilha com a mesma luz morna das pedras.'],
        ['ebano', 'Admin Ébano. Esta raiz de cristal tem a mesma luz do cadeado do Relógio. A Dra. Véspera precisa dela para manter a noite.'],
        ['aruan', 'Afasta-te da raiz, forasteiro! Ela não é tua, nem dele.'],
        ['ebano', 'A monja tem razão, mas a monja não entende o que a raiz faz com a selva. Eu entendo. Por isso eu levo.'],
        ['jogador', 'Você está destruindo o templo para uma luz que não é sua.'],
        ['ebano', 'Então me impede. Você já atrapalhou a Crepúsculo em três cidades. Não vai ser diferente aqui.'],
      ],
      depois: {
        batalha: {
          id: 'c5_ebano', nome: 'Admin Ébano', dinheiro: 2000, perder: 'repete',
          equipe: [[198, 22, ['peck', 'astonish', 'pursuit']], [430, 23, ['nightSlash', 'braveBird', 'suckerPunch']], [302, 23, ['shadowClaw', 'foulPlay', 'willOWisp']]],
        },
        flags: { 'nh.ebanoTemplo': true },
      },
      atores: [
        { id: 'ebano_templo', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'templo_raizes_porta', longe: 3 },
        { id: 'aruan_templo', quem: 'aruan', nome: 'Monja Aruã', look: LOOKS.benta, spot: 'templo_raizes_porta', longe: 4 },
      ],
    },
    {
      id: 'j05_templo_fim',
      local: 'templo_raizes_1',
      gatilho: { tipo: 'vencer', alvo: 'c5_ebano' },
      falas: [
        ['ebano', 'Hm. Então a raiz fica onde está. A Aurora vai querer cobrar por isso, e eu vou esperar a conta.'],
        ['narrador', 'O Ébano recua pelo túnel. Atrás da raiz, uma fresta mostra um cabo de metal com etiqueta dourada: "Companhia Aurora. Luzita, linha 2."'],
        ['aruan', 'Está vendo? A luz de vocês atravessa a terra da minha selva. Desde que o cabo chegou, as raízes secam por baixo.'],
        ['jogador', 'Então a Aurora passou um cabo debaixo do templo. E a Crepúsculo tenta levar o que a Aurora deixou.'],
        ['aruan', 'Os dois querem a mesma coisa: a luz que não é deles. A raiz fica aqui, na terra da selva. Enquanto estiver no lugar, a selva resiste ao cabo.'],
        ['aruan', 'Não tente arrancá-la. Quem tira a raiz, tira a selva inteira junto. Cuide do cabo, se puder, mas deixe a raiz em paz.'],
      ],
      depois: {
        flags: { 'nh.cabosAurora': true },
        objetivo: { texto: 'Atravesse a Selva Grande em direção ao leste, onde o Téo está esperando', alvo: 'selva_grande' },
      },
      atores: [
        { id: 'aruan_templo', quem: 'aruan', nome: 'Monja Aruã', look: LOOKS.benta, spot: 'templo_raizes_porta', permanente: true },
      ],
    },
    {
      // Téo defende a Aurora: o pai trabalha na Mina e a empresa paga o salário dele
      id: 'j05_rival3',
      local: 'selva_grande',
      gatilho: { tipo: 'entrar', alvo: 'selva_grande', requer: ['nh.cabosAurora'], semFlag: ['nh.rival3'] },
      falas: [
        ['teo', 'Você de novo! Achei que o templo ia te engolir. Pelo jeito, a selva não te quis.'],
        ['jogador', 'Téo, a Aurora passou um cabo por dentro do templo, e a Crepúsculo tentou levar a raiz. Você sabia disso?'],
        ['teo', 'Eu sei que meu pai trabalha na Mina Aurora. A Aurora é a única empresa que paga bem aqui em Alvorada.'],
        ['teo', 'Se a Crepúsculo quer acabar com a luz da Aurora, ela quer acabar com o emprego do meu pai. Eu não vou deixar.'],
        ['jogador', 'Então vamos lutar. Mas depois você vai ouvir o que eu vi no templo.'],
      ],
      depois: {
        batalha: {
          id: 'nh_rival3', nome: 'Rival Téo', dinheiro: 2600, perder: 'continua',
          equipe: [[397, 23, ['wingAttack', 'quickAttack', 'aerialAce']], [58, 23, ['flameWheel', 'bite', 'roar']], [133, 24, ['quickAttack', 'bite', 'swift']], ['rival:2', 26, []]],
        },
        flags: { 'nh.rival3': true },
      },
      atores: [
        { id: 'teo_selva', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_acampamento_selva', longe: 3 },
      ],
    },
    {
      id: 'j05_rival3_fim',
      local: 'selva_grande',
      gatilho: { tipo: 'vencer', alvo: 'nh_rival3' },
      falas: [
        ['teo', 'Tá bom, você ganhou. Mas eu não estou convencido. Meu pai nunca mentiu para mim.'],
        ['jogador', 'Eu não disse que ele mentiu. Eu disse que a Aurora passou um cabo pelo templo, e a selva está secando por causa disso.'],
        ['teo', 'Então me dá uma prova. Se for mentira, eu vou ser o primeiro a te enfrentar de novo.'],
        ['jogador', 'Achei uma garrafa no manguezal, perto do porto. Dentro, um bilhete do Heitor: "Estamos no nível 4. A luz daqui não é limpa".', { requer: ['nh.bilheteHeitor'] }],
        ['teo', 'Essa letra torta é do meu pai, de quem escreve no escuro. Mas nível quatro? Ele nunca me contou nada disso. Eu preciso pensar.', { requer: ['nh.bilheteHeitor'] }],
        ['teo', 'Sem prova, eu continuo do lado da Aurora. Mas vou ficar de olho em você.', { semFlag: ['nh.bilheteHeitor'] }],
      ],
      depois: {
        flags: { 'nh.teoDuvida': true },
        objetivo: { texto: 'Volte à Cidade Coral pela balsa e siga pela Rota 5 até a Vila Lamparina, a oeste', alvo: 'vila_lamparina' },
      },
      atores: [
        { id: 'teo_selva', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_acampamento_selva', longe: 3 },
      ],
    },
  ],
};
