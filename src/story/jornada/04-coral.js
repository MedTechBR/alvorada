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
  sol: '6h33',
  cenas: [
    {
      id: 'j04_chegada',
      local: 'cidade_coral',
      gatilho: { tipo: 'entrar', alvo: 'cidade_coral', requer: ['nh.nadar'], semFlag: ['nh.chegouCoral'] },
      falas: [
        ['narrador', 'Cidade Coral: um farol enorme na ponta do morro, feira de conchas e um calçadão cheio de turistas.'],
        ['narrador', 'Você desce do barco no cais e sente o vento salgado no rosto. O Líder Jonas cuida do farol e da insígnia Faísca.'],
        ['narrador', 'Mas as luzes do farol piscam fora de hora há dois dias, e ninguém na cidade quer falar sobre isso.'],
        ['jogador', 'Antes de falar com o Jonas, quero entender o que está acontecendo.'],
        ['jogador', 'Um farol que pisca sozinho e uma cidade calada. Vou perguntar na praça.'],
      ],
      depois: {
        flags: { 'nh.chegouCoral': true },
        objetivo: { texto: 'Vá à praça da Cidade Coral: a Companhia Aurora está inaugurando alguma coisa lá', alvo: 'praca_coral' },
      },
    },
    {
      // a inauguração: o Solano faz o discurso que a Iracema não aceita
      id: 'j04_inauguracao',
      local: 'praca_coral',
      gatilho: { tipo: 'entrar', alvo: 'praca_coral', requer: ['nh.chegouCoral'], semFlag: ['nh.viuSolano'] },
      falas: [
        ['narrador', 'Uma faixa dourada atravessa a praça: "Companhia Aurora. A luz que Alvorada merece."'],
        ['solano', 'Amigos de Cidade Coral! Hoje a luzita, uma energia limpa, chega à nossa cidade. Nenhuma casa vai depender do sol para ter luz.'],
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
        ['narrador', 'No topo do farol, dois recrutas de capa roxa seguram a pedra, uma pedra azul do tamanho de uma noz. Um deles mexe na alavanca dos geradores.'],
        ['recruta', 'Tarde demais, velha. A chefe mandou pegar a pedra do farol.'],
        ['ebano', 'Sou o Admin Ébano. Ordens da Dra. Véspera: ela diz que as pedras estão em perigo aqui e precisam sair.'],
        ['jogador', 'O perigo é a Aurora mexer no gerador, não a pedra. Devolva!'],
        ['ebano', 'Cansei de explicar. Venha tirar a pedra de mim!'],
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
        { id: 'recruta_farol', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, longe: 3 },
        { id: 'recruta2_farol', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, longe: 3 },
        { id: 'ebano_farol', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, longe: 3 },
      ],
    },
    {
      id: 'j04_pedra_recuperada',
      local: 'farol_coral',
      gatilho: { tipo: 'vencer', alvo: 'c4_ebano' },
      falas: [
        ['narrador', 'O Ébano recua. A pedra escapa da mão do recruta, rola pela escada, e a Iracema a segura com as duas mãos antes que caia no mar.'],
        ['iracema', 'Pronto. Está comigo de novo. O gerador, porém, continua girando sozinho. Quem mexeu nele foi a Aurora, não a Crepúsculo.'],
        ['jogador', 'Então a Crepúsculo e a Aurora estão trabalhando juntas aqui?'],
        ['iracema', 'Não sei. Só sei que quem troca peça de farol à noite não é de confiança. Leve a pedra ao Jonas. Ele precisa saber.'],
      ],
      depois: {
        flags: { 'nh.pedraCoral': true },
        objetivo: { texto: 'Leve a pedra do farol ao Líder Jonas: vença os técnicos Saulo e Duda no ginásio e desafie o Jonas', alvo: 'jonas', treinadores: ['g4_saulo', 'g4_duda'], rotulo: 'Técnicos' },
      },
      atores: [
        { id: 'iracema_farol', quem: 'iracema', nome: 'Iracema', look: LOOKS.iracema, spot: 'farol_entrada', permanente: true },
      ],
    },
    {
      id: 'j04_saulo',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_saulo' },
      falas: [['aprendiz', 'O Jonas fecha com um Ampharos, puro choque. Golpe de Terra resolve, se você tiver um.']],
      depois: { batalha: { id: 'g4_saulo', nome: 'Técnico Saulo', dinheiro: 900, equipe: [[125, 22, ['thunderShock', 'quickAttack', 'leer']], [81, 23, ['thunderShock', 'supersonic', 'tackle']]] } },
    },
    {
      id: 'j04_duda',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_duda' },
      falas: [['aprendiz', 'Os três geradores precisam girar na mesma ordem. Só a Iracema sabe qual é, e ela não conta para ninguém.']],
      depois: { batalha: { id: 'g4_duda', nome: 'Técnica Duda', dinheiro: 950, equipe: [[309, 23, ['thunderShock', 'bite', 'quickAttack']], [181, 24, ['confuseRay', 'thunderbolt', 'discharge']]] } },
    },
    {
      id: 'j04_jonas_ginasio',
      local: 'cidade_coral',
      gatilho: { tipo: 'falar', alvo: 'jonas', requer: ['nh.pedraCoral', 'trainers.g4_saulo', 'trainers.g4_duda'], semFlag: ['badges.coral'] },
      falas: [
        ['jonas', 'Você trouxe a pedra de volta, e ainda passou pelos meus aprendizes. Ninguém faz isso sem levar um choque.'],
        ['jonas', 'Eu ia pedir sua ajuda, mas antes vamos batalhar!'],
        ['jogador', 'Eu trouxe a pedra. E a Iracema mandou dizer que a Aurora trocou o gerador três.'],
        ['jonas', 'Isso é sério. Depois da batalha eu quero saber tudo.'],
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
        { id: 'jonas_ginasio', quem: 'jonas', nome: 'Líder Jonas', look: LOOKS.jonas, spot: 'jonas', permanente: true, padrao: ['Ajuste os três geradores e a gente conversa! Eu entendo de choque, não de engrenagem.'] },
      ],
    },
    {
      id: 'j04_jonas_insignia',
      local: 'cidade_coral',
      gatilho: { tipo: 'vencer', alvo: 'leader_jonas' },
      falas: [
        ['jonas', 'Pronto, a Insígnia Faísca é sua. Ela faz a sua equipe andar mais rápido e a cabeça mais esperta.'],
        ['narrador', '{jogador} recebeu a Insígnia Faísca!'],
        ['jonas', 'Preciso da sua ajuda. A pedra do farol é muito importante, e eu não consigo protegê-la sozinho.'],
        ['jonas', 'Se a Crepúsculo voltar, conto com você. A Monja Aruã, nas Ilhas Jandaias, pediu ajuda: as raízes do templo estão secando. A balsa sai do cais.'],
      ],
      depois: {
        insignia: 'coral',
        flags: { 'nh.pedraCoral2': true },
        objetivo: { texto: 'Pegue a balsa no cais de Cidade Coral e ajude a Monja Aruã, nas Ilhas Jandaias', alvo: 'barqueira_coral' },
      },
      atores: [
        { id: 'jonas_ginasio', quem: 'jonas', nome: 'Líder Jonas', look: LOOKS.jonas, spot: 'jonas', permanente: true },
      ],
    },
    {
      // missão secundária: o diário do farol. Começo: a Iracema pede. Meio: achar o diário no topo (e soltar o Rotom preso na
      // lâmpada). Fim: o diário mostra que a Aurora trocou o gerador e que o Solano assinou a troca.
      id: 'j04_sq_diario_inicio',
      local: 'farol_coral',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['nh.viuSolano'], semFlag: ['nh.sqDiario'] },
      falas: [
        ['iracema', 'Eu anoto tudo que acontece neste farol há trinta anos. O diário ficou lá em cima, no quarto dos geradores.'],
        ['iracema', 'A Aurora trocou as peças sem avisar. Se tem prova, está no meu diário. Mas estes joelhos não sobem mais a escada.'],
        ['jogador', 'Um diário pode provar que a Aurora trocou o gerador. Eu busco.'],
        ['iracema', 'Obrigada. Fica no quarto dos geradores, no topo do farol.'],
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
        ['narrador', 'No quarto dos geradores, um caderno de capa verde está preso debaixo de uma caixa de ferramentas. As últimas páginas são de outra letra.'],
        ['narrador', '"Dia 3: o gerador três foi trocado por ordem da Companhia Aurora. Peça nova, sem número de série. Assinado: A. Solano."'],
        ['narrador', '"Dia 14: o farol gira no horário que a Aurora mandou, não no do sol. Não é o farol que está errado. É o sol que está atrasado."'],
        ['narrador', 'Atrás da caixa, a lâmpada de luzita pisca em código: S-O-C-O-R-R-O. Dentro dela, uma bolinha de plasma com olhos bate no vidro.'],
        ['jogador', 'Então é isso que faz a luz piscar fora de hora. Tem um Rotom preso na lâmpada.'],
        ['narrador', 'Você gira o parafuso. O vidro estala, e o Rotom sai faiscando e se agarra ao seu ombro. O farol continua girando fora de hora: o gerador é outro problema.'],
      ],
      secundaria: { texto: 'Leve o diário da Iracema de volta a ela, no pé do farol', alvo: 'farol_entrada' },
      depois: { flags: { 'nh.diarioFarol': true }, pokemon: [479, 25], ambiente: true },
    },
    {
      id: 'j04_sq_diario_fim',
      local: 'farol_entrada',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['nh.diarioFarol'], semFlag: ['nh.sqDiarioFim'] },
      falas: [
        ['iracema', 'Eu sabia. O Solano mandou trocar o gerador e assinou no meu próprio diário, sem medo de ser lido.'],
        ['iracema', 'E o Rotom! Ele pedia socorro desde a semana passada, e eu achando que era interferência. Cuide dele, por favor.'],
        ['iracema', 'Tome estas poções. São as últimas que eu tenho guardadas. Vai precisar delas no caminho.'],
        ['jogador', 'Vou contar ao Jonas o que está escrito. A cidade precisa saber.'],
        ['narrador', 'A Iracema guarda o diário debaixo do braço e olha para o farol com um sorriso pequeno.'],
      ],
      depois: { itens: [['superPotion', 3]], flags: { 'nh.sqDiarioFim': true }, ambiente: true },
    },
    {
      id: 'j04_boletim4',
      gatilho: { tipo: 'flag', alvo: 'badges.coral', semFlag: ['nh.boletim.4'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis e trinta e três. O farol de Cidade Coral segue piscando fora de hora.'],
        ['mae', '{jogador}, seis e trinta e três. Cada manhã está mais escura aqui em casa. Volte logo.'],
        ['jogador', 'Não sei quanto tempo vai demorar, Mãe. Mas prometo voltar quando o sol nascer na hora.'],
      ],
      depois: { flags: { 'nh.boletim.4': true, 'nh.sol': '6h33' }, ambiente: true },
    },
  ],
};
