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
        ['jogador', 'Raízes secando, como no bosque da Lia. Será o mesmo problema?'],
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
        ['ebano', 'Admin Ébano. Esta raiz de cristal é de luzita, como o cadeado do Relógio. A Dra. Véspera mandou levá-la.'],
        ['aruan', 'Afastem-se da raiz! Ela sustenta a selva inteira e não é de vocês.'],
        ['ebano', 'Se a Aurora achar a raiz, ela leva do mesmo jeito. É melhor que fique conosco.'],
        ['jogador', 'Arrancar a raiz seca a selva. Eu não vou deixar.'],
        ['ebano', 'Então me impede. Você já atrapalhou a Crepúsculo em quatro cidades. Aqui eu não deixo.'],
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
        ['ebano', 'Hm. A raiz fica, então. Vou avisar a Dra. Véspera.'],
        ['narrador', 'O Ébano recua pelo túnel. Atrás da raiz, uma fresta mostra um cabo de metal com etiqueta dourada: "Companhia Aurora. Luzita, linha 2."'],
        ['aruan', 'Veja: um cabo da Aurora passa por baixo do templo. Desde que ele chegou, as raízes secam.'],
        ['jogador', 'Então o cabo da Aurora seca a selva. E a Crepúsculo quis levar a raiz.'],
        ['aruan', 'Os dois querem a luz da raiz. Mas enquanto ela estiver aqui, a selva resiste ao cabo.'],
        ['aruan', 'Nunca arranque a raiz: a selva morre junto. Se puder, denuncie o cabo da Aurora.'],
      ],
      depois: {
        flags: { 'nh.cabosAurora': true },
        objetivo: { texto: 'Atravesse a Selva Grande, a leste, para voltar à balsa', alvo: 'selva_grande' },
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
        ['teo', 'Você de novo! Eu ia mesmo te procurar.'],
        ['jogador', 'Téo, a Aurora passou um cabo por dentro do templo, e a Crepúsculo tentou levar a raiz. Você sabia disso?'],
        ['teo', 'Não sabia. Mas meu pai trabalha na Mina Aurora, e a empresa paga bem em Alvorada.'],
        ['teo', 'Se a Crepúsculo quer acabar com a luz da Aurora, ela quer acabar com o emprego do meu pai. Eu não vou deixar.'],
        ['jogador', 'Então vamos ver quem está certo. Depois você me escuta.'],
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
        ['jogador', 'Eu não disse que ele mentiu. Disse que o cabo da Aurora está secando a selva.'],
        ['teo', 'Então me dê uma prova. Sem prova, eu não acredito.'],
        ['jogador', 'Achei uma garrafa no manguezal, perto do porto. Dentro, um bilhete do Heitor: "Estamos presos no nível 4 da mina".', { requer: ['nh.bilheteHeitor'] }],
        ['teo', 'Essa letra torta é do meu pai! Mas preso no nível quatro? Ele nunca me contou isso. Preciso pensar.', { requer: ['nh.bilheteHeitor'] }],
        ['teo', 'Sem prova, eu continuo do lado da Aurora. Mas vou ficar de olho em você.', { semFlag: ['nh.bilheteHeitor'] }],
      ],
      depois: {
        flags: { 'nh.teoDuvida': true },
        objetivo: { texto: 'Volte à Cidade Coral pela balsa e siga pela Rota 5 até a Vila Lamparina, onde fica a próxima líder, Zélia', alvo: 'vila_lamparina' },
      },
      atores: [
        { id: 'teo_selva', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'ninho_acampamento_selva', longe: 3 },
      ],
    },
  ],
};
