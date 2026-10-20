// Jornada de Cidade Coral: "Faísca na Costa Coral" (era o capítulo 4).
// Escadaria do Mirante (a pé, da Vila Alvorada) ou Rota 4 (Rio Lúmen de Lapras, Restinga) → Cidade Coral (inauguração
// da Aurora) → Téo no calçadão → Farol Coral (ginásio) → Praia dos Corais.
// Mundo aberto: começa ao chegar à costa, em qualquer ordem. A revanche do Téo no calçadão só acontece se ele estiver
// devendo uma (marco de 2 insígnias, trama.js); senão ele só conversa.
// Jogável pelo motor src/story/roteiro.js. Níveis do lugar (o ginásio mais perto de casa): selvagens 5–18, treinadores 6–16, Jonas 7–11 (~11), Ébano 13–14.
// Quebra-cabeça do farol (circuitos, portões de raio e os três geradores): src/story/enigmas.js.

const FAROL = { farol_coral: 'escada_f1', farol_coral_2: 'escada_f2', farol_topo: 'jonas' };

export default {
  id: 'cap04',
  jornada: 'coral',
  titulo: 'Faísca na Costa Coral',
  sol: '6h40',
  cenas: [
    {
      id: 'rio',
      local: 'rota4',
      gatilho: { tipo: 'pisar', alvo: 'rio_lumen_inicio', semFlag: ['desceuRio'] },
      falas: [
        ['narrador', 'O Rio Lúmen se alarga entre manguezais. Os Buizel apostam corrida com você e perdem de propósito, só para rir.'],
        ['narrador', 'Mais adiante, o rio encontra as dunas e o mar. Dá para sentir o cheiro de sal.'],
      ],
      depois: { flags: { desceuRio: true }, objetivo: { texto: 'Siga o rio até a foz e atravesse a Restinga até Cidade Coral', alvo: 'cidade_coral' } },
    },
    {
      id: 'surfista',
      local: 'rota4',
      gatilho: { tipo: 'avistar', alvo: 'r4_kaua' },
      falas: [
        ['kaua', 'E aí, brother! Kauã, da Escola de Surfe. Tá descendo o rio de Lapras? Que onda!'],
        ['kaua', 'Bora uma batalha de boa? Se eu perder, te dou aula grátis. Se eu ganhar, te dou aula grátis também, porque eu sou gente boa.'],
        ['kaua', 'Encosta o Lapras aqui no banco de areia, desce e manda o teu Pokémon. Na água é covardia!'],
      ],
      depois: { batalha: { id: 'r4_kaua', nome: 'Surfista Kauã', dinheiro: 900, equipe: [[278, 14, ['waterGun', 'wingAttack', 'quickAttack']], [418, 15, ['aquaJet', 'swift', 'quickAttack']], [279, 16, ['waterGun', 'wingAttack', 'protect']]] } },
    },
    {
      id: 'kaua_perdeu',
      local: 'rota4',
      gatilho: { tipo: 'vencer', alvo: 'r4_kaua' },
      falas: [['kaua', 'Caí da prancha! Mas caí com estilo. Toma, presente da escola: quem cai muito precisa disso.']],
      depois: { itens: [['superPotion', 2]] },
    },
    {
      id: 'restinga',
      local: 'rota4',
      gatilho: { tipo: 'avistar', alvo: 'r4_sandra' },
      falas: [['treinador', 'A areia aqui esconde Sandile! Esconde Trapinch! Esconde até o meu chinelo, que eu perdi ontem!']],
      depois: { batalha: { id: 'r4_sandra', nome: 'Turista Sandra', dinheiro: 920, equipe: [[551, 10, ['bite', 'sandTomb', 'leer']], [328, 10, ['bite', 'sandAttack', 'bulldoze']], [449, 11, ['bite', 'sandTomb', 'yawn']]] } },
    },
    {
      id: 'coral_chegada',
      local: 'cidade_coral',
      gatilho: { tipo: 'entrar', alvo: 'cidade_coral', semFlag: ['coral'] },
      falas: [
        ['narrador', 'Cidade Coral: calçadão de ondas pretas e brancas, coqueiros, barracas de água de coco. No alto do morro, o Farol Coral, listrado de vermelho.'],
        ['narrador', 'A praça está lotada. Bandeirinhas douradas, banda de música e um palco com o logo da Companhia Aurora: um sol nascendo de um cristal.'],
      ],
      depois: { flags: { coral: true }, objetivo: { texto: 'Vá até a praça: o discurso já vai começar', alvo: 'praca_coral' } },
    },
    {
      id: 'discurso_solano',
      local: 'cidade_coral',
      gatilho: { tipo: 'pisar', alvo: 'praca_coral', requer: ['coral'], semFlag: ['discursoSolano'] },
      falas: [
        ['solano', 'Boa tarde, Cidade Coral!'],
        ['solano', 'Eu nasci em Vila Lamparina. Numa casa sem luz. Quando eu tinha onze anos, meu irmão caçula, o Tiago, teve febre num inverno escuro.'],
        ['solano', 'O médico não conseguiu chegar. A estrada estava escura demais. O Tiago tinha seis anos.'],
        ['solano', 'Naquela noite eu prometi: nenhuma criança desta região vai viver no escuro de novo.'],
        ['solano', 'Hoje o Farol Coral ganha a luz da Aurora. E nenhum barco desta costa vai se perder no escuro. Nunca mais.'],
        ['narrador', 'A praça explode em aplausos. Os holofotes de luzita acendem no topo do farol. A luz é dourada, linda, e um pouco forte demais para os olhos.'],
        ['iracema', 'Pisca errado.'],
        ['jogador', 'O quê?'],
        ['iracema', 'O farol. Pisca errado. Trinta anos eu cuidei daquela luz. Ela pisca errado agora. Ninguém me escuta, porque eu sou velha.'],
        ['iracema', 'Moro na casa azul, na rua de cima. Se um dia quiser ouvir uma velha, aparece.'],
      ],
      depois: { flags: { discursoSolano: true, sq_farol: 'disponivel' }, objetivo: { texto: 'Dê uma volta pelo calçadão', alvo: 'calcadao' } },
    },
    {
      // revanche do marco de 2 insígnias (trama.js), aqui no calçadão, se o Téo ainda estiver devendo
      id: 'teo_calcadao',
      local: 'cidade_coral',
      gatilho: { tipo: 'pisar', alvo: 'calcadao', requer: ['discursoSolano', 'insignias>=2'], semFlag: ['rival2'] },
      falas: [
        ['teo', '{jogador}! Aqui! Você viu o Solano? Meu pai trabalha pra ele, sabia? Lá na Mina Aurora. Chefe de turma!'],
        ['teo', 'Ganhei do Jonas hoje de manhã. A Insígnia Faísca já é minha. Meu pai prometeu que vinha ver a próxima batalha.'],
        ['teo', 'Você tem {insignias_ext} insígnias? Eu também. Ele deve estar chegando. Ele disse que vinha. Então vamos batalhar agora, que aí ele vê!'],
      ],
      depois: {
        batalha: {
          id: 'rival2', nome: 'Rival Téo', dinheiro: 1800, perder: 'continua',
          equipe: [
            [397, 14, ['wingAttack', 'quickAttack', 'doubleTeam']],
            [58, 14, ['ember', 'bite', 'roar']],
            [133, 15, ['quickAttack', 'bite', 'sandAttack']],
            ['rival:2', 17, []],
          ],
        },
        flags: { rival2: true, teoCalcadao: true, lutouCalcadao: true },
      },
    },
    {
      // sem revanche pendente: o Téo só conversa (esperando o pai que não vem)
      id: 'teo_calcadao_conversa',
      local: 'cidade_coral',
      gatilho: { tipo: 'pisar', alvo: 'calcadao', requer: ['discursoSolano'], semFlag: ['teoCalcadao'] },
      falas: [
        ['teo', '{jogador}! Aqui! Você viu o Solano? Meu pai trabalha pra ele, sabia? Lá na Mina Aurora. Chefe de turma!'],
        ['teo', 'Ganhei do Jonas hoje de manhã. A Insígnia Faísca já é minha. Meu pai prometeu que vinha ver a festa comigo.'],
        ['teo', 'Ele deve estar chegando. Ele disse que vinha. A gente batalha outro dia, quando você tiver mais insígnia. Hoje eu tô esperando ele.', { semFlag: ['rival2'] }],
        ['teo', 'Ele deve estar chegando. Ele disse que vinha. Nossa revanche já foi, né? Então hoje eu só espero.', { requer: ['rival2'] }],
      ],
      depois: { flags: { teoCalcadao: true } },
    },
    {
      id: 'teo_pier',
      local: 'cidade_coral',
      gatilho: { tipo: 'apos', cena: ['teo_calcadao', 'teo_calcadao_conversa'] },
      falas: [
        ['teo', 'Boa batalha. Muito boa. Ele ia ter gostado.', { requer: ['lutouCalcadao'] }],
        ['narrador', 'Téo olha para a escadaria do Mirante, lá no alto. Ninguém desce.'],
        ['teo', 'Deve ter tido problema na mina. Sempre tem problema na mina. Fala que tá tudo bem e manda dinheiro. E manda luzita de presente. A gente tem luzita em casa até no banheiro.'],
      ],
      escolhas: [
        { texto: 'Ele deve estar com saudade de você.', falas: [['teo', '…É. Deve. Valeu, {jogador}.']], flags: { teoAfeto: '+1' } },
        { texto: 'Quer comer um acarajé?', falas: [['teo', 'Quero. Mas você paga, que você ganhou o dinheiro da batalha. Ou perdeu. Paga do mesmo jeito.']], flags: { teoAfeto: '+1' } },
        { texto: 'Bora treinar em vez de esperar.', falas: [['teo', 'É isso aí. Esperar é pra quem não tem Pokémon.']] },
      ],
      depois: { objetivo: { texto: 'Desafie o Líder Jonas no Farol Coral, no alto do morro', alvo: 'farol_coral', sub: 'Suba pela escadinha de pedra da praia' } },
    },
    {
      id: 'farol_entrada',
      local: 'farol_coral',
      gatilho: { tipo: 'entrar', alvo: 'farol_coral', semFlag: ['farolDentro'] },
      falas: [
        ['narrador', 'Dentro do farol, tudo está apagado. Uma escada em espiral sobe no escuro. Em cada andar, um gerador parado e peças de circuito espalhadas pelo chão.'],
        ['jonas', '(pelo alto-falante) Bem-vindo ao ginásio mais iluminado da costa! Que, no momento, está no escuro. Porque a luz nova queimou o meu circuito velho.'],
        ['jonas', 'Gire as peças para ligar a fonte ao gerador de cada andar. No topo, ligue os três geradores na ordem certa. A ordem? Pergunte para quem pisca.'],
      ],
      depois: { flags: { farolDentro: true }, objetivo: { texto: 'Religue os geradores do Farol Coral e suba até o Jonas', porSala: FAROL, treinadores: ['g4_saulo', 'g4_duda'], rotulo: 'Técnicos' } },
    },
    {
      id: 'iracema_morse',
      local: 'casa_iracema',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['farolDentro'], semFlag: ['geradoresLigados'] },
      repete: true,
      falas: [
        ['iracema', 'A ordem dos geradores? O Jonas sempre usa a mesma: curto, longo, curto. Código de farol antigo. A letra R. De "retorno".'],
        ['iracema', 'Gerador pequeno é curto. Gerador grande é longo. Simples. Pena que a luz nova não sabe Morse. Ou sabe e fala besteira.'],
      ],
    },
    {
      id: 'iracema_casa',
      local: 'casa_iracema',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['discursoSolano'], semFlag: ['farolDentro', 'conheceuIracema'] },
      falas: [
        ['iracema', 'Veio ouvir a velha? Senta. Cuidado com o rádio, ele morde.'],
        ['iracema', 'Trinta anos subindo aqueles degraus. Toda noite. Eu conhecia aquela luz como conheço o meu nome. Aí veio a Aurora e disse: "agora é automático".'],
        ['iracema', 'Automático. A luz gira sozinha e ninguém olha. E sabe para onde ela aponta? Para o norte. O mar fica ao sul, menino.'],
        ['iracema', 'Se for desafiar o Jonas, lembra: lá dentro tudo tem ordem. Até a luz.'],
      ],
      depois: { flags: { conheceuIracema: true } },
    },
    {
      id: 'aprendiz_jonas1',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_saulo' },
      falas: [['aprendiz', 'Cuidado com o portão de raio do andar de cima! Ele abre e fecha a cada dois segundos. Eu já levei três choques hoje. Meu cabelo nunca mais abaixou.']],
      depois: { batalha: { id: 'g4_saulo', nome: 'Técnico Saulo', dinheiro: 960, equipe: [[81, 6, ['thunderShock', 'sonicBoom', 'supersonic']], [100, 7, ['spark', 'rollout', 'screech']]] } },
    },
    {
      id: 'aprendiz_jonas2',
      local: 'farol_coral_2',
      gatilho: { tipo: 'avistar', alvo: 'g4_duda' },
      falas: [['aprendiz', 'Último andar antes do Jonas! Ninguém passa sem carga total!']],
      depois: { batalha: { id: 'g4_duda', nome: 'Técnica Duda', dinheiro: 1000, equipe: [[309, 7, ['spark', 'howl', 'quickAttack']], [694, 8, ['thunderShock', 'quickAttack', 'parabolicCharge']]] } },
    },
    {
      id: 'jonas_desafio',
      local: 'farol_topo',
      gatilho: { tipo: 'falar', alvo: 'jonas', requer: ['trainers.g4_saulo', 'trainers.g4_duda', 'geradoresLigados'], semFlag: ['badges.coral'] },
      falas: [
        ['jonas', 'Você religou o farol inteiro! Até eu estava com preguiça. Eu sou o Jonas, engenheiro deste farol e líder do ginásio.'],
        ['jonas', 'Me obrigaram a trocar a lâmpada pela luzita. Disseram que é o futuro. O futuro queimou meu circuito duas vezes esta semana.'],
        ['jonas', 'Mas chega de reclamar! Vamos ver se você conduz bem! Valendo a Insígnia Faísca!'],
      ],
      depois: {
        batalha: {
          id: 'leader_jonas', nome: 'Líder Jonas', dinheiro: 2900,
          equipe: [
            [81, 25, ['thunderShock', 'sonicBoom', 'thunderWave']],
            [179, 26, ['thunderShock', 'cottonSpore', 'takeDown']],
            [417, 26, ['spark', 'quickAttack', 'sweetKiss']],
            [403, 27, ['spark', 'bite', 'leer']],
            [170, 28, ['spark', 'waterGun', 'confuseRay', 'bubbleBeam']],
          ],
        },
      },
    },
    {
      id: 'jonas_espera',
      local: 'farol_topo',
      gatilho: { tipo: 'falar', alvo: 'jonas', requer: ['farolDentro'], semFlag: ['badges.coral'] },
      repete: true,
      falas: [['jonas', 'Ainda falta luz aqui! Vença os meus técnicos e ligue os três geradores, na ordem. Aí sim a gente conversa.']],
    },
    {
      id: 'jonas_perdeu_jogador',
      local: 'farol_topo',
      gatilho: { tipo: 'perder', alvo: 'leader_jonas' },
      falas: [['jonas', 'Curto-circuito! Volte com mais carga.']],
    },
    {
      id: 'jonas_vencido',
      local: 'farol_topo',
      gatilho: { tipo: 'vencer', alvo: 'leader_jonas' },
      falas: [
        ['jonas', 'Você acendeu o farol e a mim também! A Insígnia Faísca é sua.'],
        ['narrador', '{jogador} recebeu a Insígnia Faísca!'],
        ['jonas', 'E a MT Faísca. Pequena, rápida, irritante. Como o meu Pachirisu.'],
        ['jonas', 'Cuidado com essa luz nova, viu? Ela não pisca direito. A Iracema tem razão, e eu tenho vergonha de não ter dito antes.'],
      ],
      depois: { insignia: 'coral', mt: 'spark', flags: { 'badges.coral': true }, objetivo: { texto: 'Descanse em Cidade Coral até a noite', alvo: 'iracema', sub: 'A Iracema mora na casa azul' } },
    },
    {
      id: 'esperar_noite',
      local: 'casa_iracema',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['badges.coral'], semFlag: ['defendeuPraia'] },
      repete: true,
      falas: [['iracema', 'Ganhou do Jonas? Então senta. Fica pra janta. De noite a gente olha aquela luz junto, que de dia ela disfarça.']],
      escolhas: [
        { texto: 'Ficar até a noite.', falas: [['iracema', 'Peixe frito e farofa. E silêncio, que eu gosto de ouvir o mar.']], depois: { hora: 20, objetivo: { texto: 'Lanternas roxas na Praia dos Corais!', alvo: 'casa_maquinas' } } },
        { texto: 'Agora não, obrigado.', falas: [['iracema', 'Vai, vai. A noite não foge. Ela só demora cada dia mais pra ir embora.']] },
      ],
    },
    {
      id: 'praia_ataque',
      local: 'praia_corais',
      gatilho: { tipo: 'entrar', alvo: 'praia_corais', hora: 'noite', requer: ['badges.coral'], semFlag: ['defendeuPraia'] },
      falas: [
        ['narrador', 'De noite, a praia está quieta. Quieta demais. Na areia, perto do farol, lanternas roxas se movem.'],
        ['jonas', '{jogador}! Eles estão na casa de máquinas! O meu fragmento fica lá!'],
        ['recruta', 'Ih, o moleque de novo. Esse moleque é praga.'],
      ],
      depois: { batalha: { id: 'c4_recruta', nome: 'Recruta Crepúsculo', dinheiro: 1000, equipe: [[261, 12, ['bite', 'howl', 'sandAttack']], [434, 12, ['poisonGas', 'feintAttack', 'screech']], [41, 12, ['bite', 'supersonic', 'wingAttack']]] } },
    },
    {
      id: 'praia_ebano',
      local: 'praia_corais',
      gatilho: { tipo: 'vencer', alvo: 'c4_recruta' },
      falas: [
        ['ebano', 'Você. De novo. Eu falei de você pra chefe, sabia? Com ênfase.'],
        ['ebano', 'Ela disse que você é teimoso que nem ela era. Não foi um elogio. Ou foi. Ela é difícil de entender.'],
        ['jogador', 'Por que vocês estão roubando os fragmentos?'],
        ['ebano', 'Porque se a gente não pegar, outro pega. E esse outro tem mais dinheiro que a gente e menos vergonha. Agora chega de papo.'],
      ],
      depois: { batalha: { id: 'c4_ebano', nome: 'Admin Ébano', dinheiro: 2200, equipe: [[198, 13, ['wingAttack', 'pursuit', 'haze']], [228, 13, ['ember', 'bite', 'smog']], [302, 14, ['shadowSneak', 'feintAttack', 'furySwipes', 'detect']]] } },
    },
    {
      id: 'praia_recupera',
      local: 'praia_corais',
      gatilho: { tipo: 'vencer', alvo: 'c4_ebano' },
      falas: [
        ['ebano', 'Hm. Tá. Pode ficar. Eu volto. Não hoje, mas volto.'],
        ['ebano', 'Moleque. Antes de dormir, olha pra luz daquele farol por um minuto inteiro. Depois me diz se ela é bonita.'],
        ['narrador', 'Ébano larga o fragmento na areia e some no escuro com os recrutas. O fragmento é cinza e sem graça, mas morno, como se tivesse batimento.'],
        ['jonas', 'Você recuperou! Ninguém tinha recuperado um ainda!'],
        ['jonas', 'Toma isto. É a Lente Prisma. Eu fiz pra estudar a luzita. Com ela dá pra ver rastros de luz que o olho não vê.'],
        ['jonas', 'Eu olhei a luz do farol com ela ontem. Sabe o que eu vi? A luz não vai pro mar. Ela vai pro norte. Pro Paredão.'],
        ['narrador', '{jogador} recebeu a Lente Prisma!'],
        ['jonas', 'E se for subir pra Vila Alvorada, vai pela escadaria do Mirante. Botaram poste de luzita em cada degrau. Claro que botaram.'],
      ],
      depois: { flags: { defendeuPraia: true, fragmentoCoral: 'jonas' }, itens: [['lente_prisma', 1], ['isca_luz', 3]] },
    },
    {
      id: 'ligacao_fim',
      local: 'cidade_coral',
      gatilho: { tipo: 'apos', cena: 'praia_recupera' },
      falas: [
        ['pokedex', 'Bzzz…'],
        ['bia', '{jogador}! Você é famoso! A Pipa do "O Farol" ligou aqui perguntando quem é o menino que recuperou um fragmento.'],
        ['bia', 'O Professor ficou olhando a Lente Prisma no jornal da tarde. Disse que com ela dá pra ver as tábuas de luz do Brejo das Lamparinas. Sua avó mora do outro lado!', { semFlag: ['badges.lamparina'] }],
        ['bia', 'Ah, o ginásio de Lamparina só abre de noite. A Dona Zélia diz que fantasma não trabalha de dia. Sindicato.', { semFlag: ['badges.lamparina'] }],
        ['bia', 'O Professor ficou olhando a Lente Prisma no jornal da tarde e não disse nada. Ele anda assim. Quieto demais.', { requer: ['badges.lamparina'] }],
      ],
      depois: { fimJornada: true },
    },

    // ---------------- missão secundária: O farol pisca errado (sq_farol) ----------------
    {
      id: 'sq_farol_morse',
      local: 'casa_iracema',
      gatilho: { tipo: 'falar', alvo: 'iracema', hora: 'noite', requer: ['defendeuPraia', 'sq_farol=disponivel'] },
      falas: [
        ['iracema', 'Chegou na hora. Olha pela janela. Olha o farol. Conta comigo.'],
        ['narrador', 'A luz dourada gira e pisca. Três curtas. Três longas. Três curtas. Depois um padrão mais comprido, de novo e de novo.'],
        ['iracema', 'Ponto, ponto, ponto. Traço, traço, traço… Eu anotei a noite inteira ontem. Dá isto aqui: S-O-C-O-R-R-O.'],
        ['iracema', 'Máquina não pede socorro, menino. Quem pede socorro é bicho. Tem alguém preso lá em cima, dentro daquela luz.'],
        ['narrador', '{jogador} recebeu o Bilhete da Iracema!'],
        ['iracema', 'Sobe lá no topo do farol e encosta a orelha na máquina nova. Eu subiria, mas meus joelhos já se aposentaram também.'],
      ],
      depois: { flags: { sq_farol: 'ativa' }, itens: [['bilhete_morse', 1]] },
    },
    {
      id: 'sq_farol_maquina',
      local: 'farol_topo',
      gatilho: { tipo: 'pisar', alvo: 'maquina_luzita', requer: ['sq_farol=ativa'] },
      falas: [
        ['narrador', 'Você encosta a orelha na máquina de luzita. Lá dentro, um zumbido triste, no mesmo ritmo do farol: ponto, ponto, ponto…'],
        ['jonas', 'Socorro em Morse? Na MINHA máquina? Me dá essa chave de fenda.'],
        ['narrador', 'Jonas abre a tampa. Preso entre os cristais, um Tynamo pisca fraquinho, enroscado nos fios.'],
        ['jonas', 'Ele estava fazendo a luz piscar pra pedir ajuda. Esse tempo todo. E a gente achando que era defeito.'],
        ['narrador', 'O Tynamo escorrega dos fios direto para o seu braço e não quer mais soltar.'],
        ['jonas', 'Acho que ele escolheu. Leva. Eu conserto a máquina. E conto pra Iracema que ela tinha razão. De novo.'],
      ],
      depois: { pokemon: [602, 25], flags: { sq_farol: 'completa', sq_farol_completa: true } },
    },
  ],
};
