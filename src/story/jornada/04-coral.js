// Segmento 04 · Cidade Coral (Líder Jonas, Elétrico, ás 28). Ordem: docs/jornada-classica.md, seção 2, linha 4.
// Rota 4 (de barco, depois de NADAR) → Cidade Coral → inauguração da Companhia Aurora (Augusto Solano aparece pela
// primeira vez, como benfeitor; a Iracema desconfia) → Farol Coral (Ébano rouba a pedra; recuperar) → aprendizes
// Saulo e Duda → Líder Jonas. Libera a balsa para as Ilhas Jandaias.
// Missão secundária: o diário do farol (Iracema). Começo, meio e fim; o diário mostra que a Aurora trocou o gerador.
// Níveis: Ébano 13–14; aprendizes 22–24; Jonas 26–28.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova04',
  jornada: 'coral',
  titulo: 'Faísca na Costa Coral',
  sol: '6h34',
  cenas: [
    {
      id: 'j04_chegada',
      local: 'cidade_coral',
      gatilho: { tipo: 'entrar', alvo: 'cidade_coral', requer: ['nh.nadar'], semFlag: ['nh.chegouCoral'] },
      falas: [
        ['narrador', 'Cidade Coral: um farol enorme na ponta do morro, feira de conchas e um calçadão cheio de turistas.'],
        ['narrador', 'O Líder Jonas cuida do farol e da insígnia Faísca. Mas as luzes do farol estão apagadas há dois dias, e ninguém sabe dizer por quê.'],
        ['jogador', 'Antes de falar com o Jonas, preciso ver o que está acontecendo no farol.'],
        ['jogador', 'Um farol apagado e um líder que não quer falar. Isso não cheira bem.'],
      ],
      depois: {
        flags: { 'nh.chegouCoral': true },
        objetivo: { texto: 'Suba ao Farol Coral, na ponta do morro, e veja o que aconteceu com as luzes', alvo: 'farol_entrada' },
      },
    },
    {
      // a inauguração: o Solano faz o discurso que a Iracema não aceita
      id: 'j04_inauguracao',
      local: 'praca_coral',
      gatilho: { tipo: 'entrar', alvo: 'praca_coral', requer: ['nh.chegouCoral'], semFlag: ['nh.viuSolano'] },
      falas: [
        ['narrador', 'Uma faixa dourada atravessa a praça: "Companhia Aurora. A luz que Alvorada merece."'],
        ['solano', 'Amigos de Cidade Coral! Hoje, com a luzita limpa, nenhuma casa desta costa vai depender do sol para acender a noite.'],
        ['solano', 'O sol, meus amigos, é um vizinho que chega atrasado. A Aurora cuida da luz de vocês em todas as horas.'],
        ['iracema', 'Trinta anos cuidando daquela luz no farol. Agora ela gira sozinha. E gira errado, Senhor Solano.'],
        ['solano', 'Dona Iracema, a senhora é uma guardiã admirável. Mas guardiã de farol não entende de luz de cidade.'],
        ['narrador', 'O Solano sorri, aperta a mão de algumas pessoas e entra num carro branco. Ninguém repara que a Iracema ficou olhando para o carro até ele sumir.'],
      ],
      depois: {
        flags: { 'nh.viuSolano': true },
        objetivo: { texto: 'Suba ao Farol Coral: a Iracema disse que o gerador está girando errado', alvo: 'farol_entrada' },
      },
      atores: [
        { id: 'solano_praca', quem: 'solano', nome: 'Augusto Solano', look: LOOKS.solano, spot: 'palco_solano', longe: 4 },
        { id: 'iracema_inauguracao', quem: 'iracema', nome: 'Iracema', look: LOOKS.iracema, spot: 'iracema_praca', longe: 3 },
      ],
    },
    {
      id: 'j04_farol_entrada',
      local: 'farol_coral',
      gatilho: { tipo: 'entrar', alvo: 'farol_coral', requer: ['nh.viuSolano'], semFlag: ['nh.ebanoCoral'] },
      falas: [
        ['iracema', 'Você veio! Olha, o gerador três foi trocado de noite. A peça nova não é do farol. É da Aurora.'],
        ['narrador', 'No topo do farol, dois recrutas de capa roxa seguram a pedra do farol, uma pedra azul do tamanho de uma noz. Um deles tem a outra mão na alavanca dos geradores.'],
        ['recruta', 'Tarde demais, velha. A pedra vai pro Relógio. Quando o sol parar de nascer, todo mundo vai entender por quê.'],
        ['ebano', 'Admin Ébano. Se você está aqui, então ouviu o rádio. A Dra. Véspera quer as pedras longe da Aurora. Você não vai entender enquanto não ver o que ela vê.'],
        ['jogador', 'Eu vejo a Aurora trocando geradores em cima de um farol. Esta é a sua explicação?'],
        ['ebano', 'Então vem pegar a pedra!'],
      ],
      depois: {
        batalha: {
          id: 'c4_ebano', nome: 'Admin Ébano', dinheiro: 1300, perder: 'repete',
          equipe: [[198, 13, ['peck', 'astonish', 'pursuit']], [41, 14, ['leechLife', 'supersonic', 'astonish']]],
        },
        flags: { 'nh.ebanoCoral': true },
      },
      atores: [
        { id: 'iracema_farol', quem: 'iracema', nome: 'Iracema', look: LOOKS.iracema, spot: 'farol_entrada', permanente: true },
        { id: 'recruta_farol', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_farol_topo', longe: 3 },
        { id: 'recruta2_farol', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_farol_topo', longe: 3 },
        { id: 'ebano_farol', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'dentro_farol_topo', longe: 3 },
      ],
    },
    {
      id: 'j04_pedra_recuperada',
      local: 'farol_coral',
      gatilho: { tipo: 'vencer', alvo: 'c4_ebano' },
      falas: [
        ['narrador', 'O Ébano recua. Ao cair, a pedra do farol rola pela escada, e a Iracema a segura com as duas mãos antes que ela caia no mar.'],
        ['iracema', 'Pronto. Está comigo de novo. O gerador, porém, continua girando sozinho. Quem mexeu nele foi a Aurora, não a Crepúsculo.'],
        ['jogador', 'Então a Crepúsculo e a Aurora estão do mesmo lado?'],
        ['iracema', 'Não sei. Eu só sei que quem troca peça de farol à noite não é amigo de ninguém. Leve a pedra ao Jonas. Ele precisa saber.'],
      ],
      depois: {
        flags: { 'nh.pedraCoral': true },
        objetivo: { texto: 'Leve a pedra do farol ao Líder Jonas, no ginásio da cidade', alvo: 'jonas' },
      },
      atores: [
        { id: 'iracema_farol', quem: 'iracema', nome: 'Iracema', look: LOOKS.iracema, spot: 'farol_entrada', permanente: true },
      ],
    },
    {
      id: 'j04_saulo',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_saulo' },
      falas: [['aprendiz', 'O Jonas usa um Lanturn no final. Ele nada e dá choque ao mesmo tempo. Golpe de Terra resolve, se você tiver.']],
      depois: { batalha: { id: 'g4_saulo', nome: 'Técnico Saulo', dinheiro: 900, equipe: [[125, 22, ['thunderShock', 'quickAttack', 'leer']], [81, 23, ['thunderShock', 'supersonic', 'tackle']]] } },
    },
    {
      id: 'j04_duda',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_duda' },
      falas: [['aprendiz', 'Lá em cima, os três geradores. A ordem? A Iracema sabe. Ela sabe tudo deste farol.']],
      depois: { batalha: { id: 'g4_duda', nome: 'Técnica Duda', dinheiro: 950, equipe: [[309, 23, ['thunderShock', 'bite', 'quickAttack']], [181, 24, ['confuseRay', 'thunderbolt', 'discharge']]] } },
    },
    {
      id: 'j04_jonas_ginasio',
      local: 'cidade_coral',
      gatilho: { tipo: 'falar', alvo: 'jonas', requer: ['nh.pedraCoral', 'trainers.g4_saulo', 'trainers.g4_duda'], semFlag: ['badges.coral'] },
      falas: [
        ['jonas', 'Você trouxe a pedra de volta, e ainda passou pelos meus aprendizes. Ninguém faz isso sem levar um choque.'],
        ['jonas', 'Eu já ia pedir ajuda. Mas vamos batalhar primeiro. Eu sou eletricidade, e eletricidade não espera ninguém terminar de falar.'],
        ['jogador', 'Eu trouxe a pedra. E trouxe também os recados da Iracema e do Solano.'],
        ['jonas', 'Então é melhor a gente batalhar primeiro. Não quero conversa sem eletricidade.'],
      ],
      depois: {
        batalha: {
          id: 'leader_jonas', nome: 'Líder Jonas', dinheiro: 2800,
          equipe: [
            [309, 26, ['thunderShock', 'bite', 'quickAttack']],
            [125, 26, ['thunderShock', 'quickAttack', 'leer']],
            [81, 27, ['thunderShock', 'supersonic', 'tackle']],
            [181, 28, ['thunderbolt', 'discharge', 'confuseRay']],
          ],
        },
      },
      atores: [
        { id: 'jonas_ginasio', quem: 'jonas', nome: 'Líder Jonas', look: LOOKS.jonas, spot: 'jonas', permanente: true, padrao: ['Religue os três geradores e a gente conversa! Eu estou com preguiça de consertar.'] },
      ],
    },
    {
      id: 'j04_jonas_insignia',
      local: 'cidade_coral',
      gatilho: { tipo: 'vencer', alvo: 'leader_jonas' },
      falas: [
        ['jonas', 'Pronto, a Insígnia Faísca é sua. Ela faz a sua equipe andar mais rápido e a cabeça mais esperta.'],
        ['narrador', '{jogador} recebeu a Insígnia Faísca!'],
        ['jonas', 'Olha, vou falar uma coisa que eu nunca falei. A pedra do farol é a coisa mais importante da minha vida, e eu não consigo protegê-la sozinho.'],
        ['jonas', 'Se a Crepúsculo voltar, e a Aurora também, eu conto com você. As balsas para as Ilhas Jandaias saem do cais, a leste. Vai com cuidado na água.'],
      ],
      depois: {
        insignia: 'coral',
        flags: { 'nh.pedraCoral2': true },
        objetivo: { texto: 'Pegue a balsa no cais de Cidade Coral para as Ilhas Jandaias', alvo: 'cais_coral' },
      },
      atores: [
        { id: 'jonas_ginasio', quem: 'jonas', nome: 'Líder Jonas', look: LOOKS.jonas, spot: 'jonas', permanente: true },
      ],
    },
    {
      // missão secundária: o diário do farol. Começo: a Iracema pede. Meio: achar o diário no topo. Fim: o diário.
      id: 'j04_sq_diario_inicio',
      local: 'farol_coral',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['nh.viuSolano'], semFlag: ['nh.sqDiario'] },
      falas: [
        ['iracema', 'Eu escrevia tudo que acontecia no farol. Todo dia, desde que me contrataram. O diário está lá no quarto do topo, onde ficam os geradores.'],
        ['iracema', 'Se a Aurora mexeu nas peças, o registro está lá. Eu não consigo subir mais aquela escada com estes joelhos.'],
        ['jogador', 'Um diário de farol? Isso pode ser o que a Iracema estava escondendo.'],
        ['iracema', 'Pode ser. Eu escrevi tudo por medo de esquecer. Agora é hora de lembrar.'],
      ],
      secundaria: { texto: 'Encontre o diário da Iracema no quarto do topo do Farol Coral', alvo: 'farol_topo' },
      depois: { flags: { 'nh.sqDiario': true }, ambiente: true },
      atores: [
        { id: 'iracema_farol', quem: 'iracema', nome: 'Iracema', look: LOOKS.iracema, spot: 'farol_entrada', permanente: true },
      ],
    },
    {
      id: 'j04_sq_diario_achado',
      local: 'farol_topo',
      gatilho: { tipo: 'entrar', alvo: 'farol_topo', requer: ['nh.sqDiario'], semFlag: ['nh.diarioFarol'] },
      falas: [
        ['narrador', 'No quarto dos geradores, um caderno de capa verde está preso debaixo de uma caixa de ferramentas. As páginas do fim são de outra letra.'],
        ['narrador', '"Dia 3: o gerador três foi trocado por ordem da Companhia Aurora. Peça nova, sem número de série. Assinado: A. Solano."'],
        ['narrador', '"Dia 14: a luz gira sozinha. Ela acende mais cedo lá embaixo e mais tarde aqui em cima. Não é o farol que está errado. É o sol."'],
        ['jogador', 'Então o Solano assinou o diário com as próprias mãos. Ele achou que ninguém leria.'],
        ['narrador', 'Você fecha o caderno. Lá embaixo, o mar bate nas pedras do farol, e a luz do topo ainda gira fora de hora.'],
      ],
      secundaria: { texto: 'Leve o diário da Iracema de volta a ela, no pé do farol', alvo: 'farol_entrada' },
      depois: { flags: { 'nh.diarioFarol': true }, ambiente: true },
    },
    {
      id: 'j04_sq_diario_fim',
      local: 'farol_entrada',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['nh.diarioFarol'], semFlag: ['nh.sqDiarioFim'] },
      falas: [
        ['iracema', 'Eu sabia. O Solano assinou o diário, e ninguém tem direito de assinar no farol da cidade. Agora é só a gente mostrar isso à Cidade Coral.'],
        ['iracema', 'Tome, leve estas poções. São as últimas que eu tenho guardadas. Vai precisar delas no caminho.'],
        ['jogador', 'Eu conto ao Jonas. Ele disse que quer ajudar, mesmo que não queira admitir.'],
        ['narrador', 'A Iracema guarda o diário debaixo do braço e olha para o farol com um sorriso pequeno.'],
      ],
      itens: [['superPotion', 3]],
      depois: { flags: { 'nh.sqDiarioFim': true }, ambiente: true },
    },
    {
      id: 'j04_boletim4',
      gatilho: { tipo: 'flag', alvo: 'badges.coral', semFlag: ['nh.boletim.4'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e trinta e quatro minutos. O farol de Cidade Coral voltou a piscar, mas com atraso, segundo os marinheiros.'],
        ['mae', 'Ravi, seis e trinta e quatro. De manhã a casa fica escura por mais tempo. Anda, filho, volta logo.'],
        ['jogador', 'Mãe, não sei quanto tempo mais essa história dura. Mas estou voltando para casa.'],
      ],
      depois: { flags: { 'nh.boletim.4': true, 'nh.sol': '6h34' }, ambiente: true },
    },
  ],
};
