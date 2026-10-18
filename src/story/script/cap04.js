// Capítulo 4: Faísca na Costa Coral
// Rota 4 (Rio Lúmen de Lapras, Restinga) → Cidade Coral (inauguração da Aurora) → Téo → Farol Coral (ginásio) → Praia dos Corais.

export default {
  id: 'cap04',
  titulo: 'Faísca na Costa Coral',
  sol: '6h40',
  cenas: [
    {
      id: 'titulo',
      local: 'rota4',
      gatilho: { tipo: 'inicio', requer: ['ch3Done'] },
      falas: [['narrador', 'Capítulo 4: Faísca na Costa Coral']],
      depois: { flags: { chapter: 4 } },
    },
    {
      id: 'radio',
      local: 'rota4',
      gatilho: { tipo: 'apos', cena: 'titulo' },
      falas: [
        ['radio', 'Bom dia, Alvorada! Seis e quarenta. Seis e quarenta, gente. O galo do Seu Zé desistiu de cantar e agora só suspira.'],
        ['radio', 'Hoje tem festa em Cidade Coral: o Farol ganha holofotes novos da Companhia Aurora. O próprio Augusto Solano vai fazer discurso!'],
      ],
    },
    {
      id: 'rio',
      local: 'rota4',
      gatilho: { tipo: 'pisar', alvo: 'rio_lumen_inicio', semFlag: ['desceuRio'] },
      falas: [
        ['narrador', 'O Rio Lúmen se alarga entre manguezais. Os Buizel apostam corrida com o Lapras e perdem de propósito, só para rir.'],
        ['narrador', 'Mais adiante, o rio encontra as dunas e o mar. Dá para sentir o cheiro de sal.'],
      ],
      depois: { flags: { desceuRio: true } },
    },
    {
      id: 'surfista',
      local: 'rota4',
      gatilho: { tipo: 'avistar', alvo: 'r4_kaua' },
      falas: [
        ['kaua', 'E aí, brother! Kauã, da Escola de Surfe. Tá descendo o rio de Lapras? Que onda!'],
        ['kaua', 'Bora uma batalha de boa? Se eu perder, te dou aula grátis. Se eu ganhar, te dou aula grátis também, porque eu sou gente boa.'],
      ],
      depois: { batalha: { id: 'r4_kaua', nome: 'Surfista Kauã', dinheiro: 800, equipe: [[278, 20, ['waterGun', 'wingAttack', 'quickAttack']], [418, 21, ['aquaJet', 'swift', 'quickAttack']]] } },
    },
    {
      id: 'restinga',
      local: 'rota4',
      gatilho: { tipo: 'avistar', alvo: 'r4_sandra' },
      falas: [['treinador', 'A areia aqui esconde Sandile! Esconde Trapinch! Esconde até o meu chinelo, que eu perdi ontem!']],
      depois: { batalha: { id: 'r4_sandra', nome: 'Turista Sandra', dinheiro: 820, equipe: [[551, 21, ['bite', 'sandTomb', 'leer']], [328, 21, ['bite', 'sandAttack', 'bulldoze']]] } },
    },
    {
      id: 'coral_chegada',
      local: 'cidade_coral',
      gatilho: { tipo: 'entrar', alvo: 'cidade_coral', semFlag: ['coral'] },
      falas: [
        ['narrador', 'Cidade Coral: calçadão de ondas pretas e brancas, coqueiros, barracas de água de coco. No alto do morro, o Farol Coral, listrado de vermelho.'],
        ['narrador', 'A praça está lotada. Bandeirinhas douradas, banda de música e um palco com o logo da Companhia Aurora: um sol nascendo de um cristal.'],
      ],
      depois: { flags: { coral: true } },
    },
    {
      id: 'discurso_solano',
      local: 'cidade_coral',
      gatilho: { tipo: 'apos', cena: 'coral_chegada' },
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
      ],
      depois: { flags: { discursoSolano: true, sq_farol: 'disponivel' } },
    },
    {
      id: 'teo_calcadao',
      local: 'cidade_coral',
      gatilho: { tipo: 'pisar', alvo: 'calcadao', requer: ['discursoSolano'], semFlag: ['rival2'] },
      falas: [
        ['teo', '{jogador}! Aqui! Você viu o Solano? Meu pai trabalha pra ele, sabia? Lá na Mina Aurora. Chefe de turma!'],
        ['teo', 'Ganhei do Jonas hoje de manhã. A Insígnia Faísca já é minha. Meu pai prometeu que vinha ver a próxima batalha.'],
        ['teo', 'Ele deve estar chegando. Ele disse que vinha. Então vamos batalhar agora, que aí ele vê!'],
      ],
      depois: {
        batalha: {
          id: 'rival2', nome: 'Rival Téo', dinheiro: 2000,
          equipe: [
            [397, 22, ['wingAttack', 'quickAttack', 'doubleTeam']],
            [58, 22, ['ember', 'bite', 'roar']],
            [133, 23, ['quickAttack', 'bite', 'sandAttack']],
            ['rival:2', 25, []],
          ],
        },
        flags: { rival2: true },
      },
    },
    {
      id: 'teo_pier',
      local: 'cidade_coral',
      gatilho: { tipo: 'apos', cena: 'teo_calcadao' },
      falas: [
        ['teo', 'Boa batalha. Muito boa. Ele ia ter gostado.'],
        ['narrador', 'Téo olha para a estrada que desce do morro. Ninguém vem.'],
        ['teo', 'Deve ter tido problema na mina. Sempre tem problema na mina. Fala que tá tudo bem e manda dinheiro. E manda luzita de presente. A gente tem luzita em casa até no banheiro.'],
      ],
      escolhas: [
        { texto: 'Ele deve estar com saudade de você.', falas: [['teo', '…É. Deve. Valeu, {jogador}.']], flags: { teoAfeto: 1 } },
        { texto: 'Quer comer um acarajé?', falas: [['teo', 'Quero. Mas você paga, que você ganhou o dinheiro da batalha. Ou perdeu. Paga do mesmo jeito.']], flags: { teoAfeto: 1 } },
        { texto: 'Bora treinar em vez de esperar.', falas: [['teo', 'É isso aí. Esperar é pra quem não tem Pokémon.']] },
      ],
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
      depois: { flags: { farolDentro: true }, objetivo: 'Religue os geradores do Farol Coral' },
    },
    {
      id: 'iracema_morse',
      local: 'casa_iracema',
      gatilho: { tipo: 'falar', alvo: 'iracema', requer: ['farolDentro'] },
      repete: true,
      falas: [
        ['iracema', 'A ordem dos geradores? O Jonas sempre usa a mesma: curto, longo, curto. Código de farol antigo. A letra R. De "retorno".'],
        ['iracema', 'Gerador pequeno é curto. Gerador grande é longo. Simples. Pena que a luz nova não sabe Morse. Ou sabe e fala besteira.'],
      ],
    },
    {
      id: 'aprendiz_jonas1',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_saulo' },
      falas: [['aprendiz', 'Cuidado com o portão de raio! Ele abre e fecha a cada dois segundos. Eu já levei três choques hoje. Meu cabelo nunca mais abaixou.']],
      depois: { batalha: { id: 'g4_saulo', nome: 'Técnico Saulo', dinheiro: 880, equipe: [[81, 21, ['thunderShock', 'sonicBoom', 'supersonic']], [100, 22, ['spark', 'rollout', 'screech']]] } },
    },
    {
      id: 'aprendiz_jonas2',
      local: 'farol_coral',
      gatilho: { tipo: 'avistar', alvo: 'g4_duda' },
      falas: [['aprendiz', 'Último andar antes do Jonas! Ninguém passa sem carga total!']],
      depois: { batalha: { id: 'g4_duda', nome: 'Técnica Duda', dinheiro: 920, equipe: [[309, 22, ['spark', 'howl', 'quickAttack']], [694, 23, ['thunderShock', 'quickAttack', 'parabolicCharge']]] } },
    },
    {
      id: 'jonas_desafio',
      local: 'farol_coral',
      gatilho: { tipo: 'falar', alvo: 'jonas', requer: ['trainers.g4_saulo', 'trainers.g4_duda', 'geradoresLigados'], semFlag: ['badges.coral'] },
      falas: [
        ['jonas', 'Você religou o farol inteiro! Até eu estava com preguiça. Eu sou o Jonas, engenheiro deste farol e líder do ginásio.'],
        ['jonas', 'Me obrigaram a trocar a lâmpada pela luzita. Disseram que é o futuro. O futuro queimou meu circuito duas vezes esta semana.'],
        ['jonas', 'Mas chega de reclamar! Vamos ver se você conduz bem! Valendo a Insígnia Faísca!'],
      ],
      depois: {
        batalha: {
          id: 'leader_jonas', nome: 'Líder Jonas', dinheiro: 2700,
          equipe: [
            [81, 23, ['thunderShock', 'sonicBoom', 'thunderWave']],
            [180, 24, ['thunderShock', 'cottonSpore', 'takeDown']],
            [417, 24, ['spark', 'quickAttack', 'sweetKiss']],
            [404, 25, ['spark', 'bite', 'leer']],
            [171, 27, ['spark', 'waterGun', 'confuseRay', 'bubbleBeam']],
          ],
        },
      },
    },
    {
      id: 'jonas_perdeu_jogador',
      local: 'farol_coral',
      gatilho: { tipo: 'perder', alvo: 'leader_jonas' },
      falas: [['jonas', 'Curto-circuito! Volte com mais carga.']],
    },
    {
      id: 'jonas_vencido',
      local: 'farol_coral',
      gatilho: { tipo: 'vencer', alvo: 'leader_jonas' },
      falas: [
        ['jonas', 'Você acendeu o farol e a mim também! A Insígnia Faísca é sua.'],
        ['narrador', '{jogador} recebeu a Insígnia Faísca!'],
        ['jonas', 'E a MT Faísca. Pequena, rápida, irritante. Como o meu Pachirisu.'],
        ['jonas', 'Cuidado com essa luz nova, viu? Ela não pisca direito. A Iracema tem razão, e eu tenho vergonha de não ter dito antes.'],
      ],
      depois: { insignia: 'coral', mt: 'spark', flags: { 'badges.coral': true }, objetivo: 'Descanse em Cidade Coral até a noite' },
    },
    {
      id: 'praia_ataque',
      local: 'praia_corais',
      gatilho: { tipo: 'entrar', alvo: 'praia_corais', hora: 'noite', requer: ['badges.coral'], semFlag: ['defendeuPraia'] },
      falas: [
        ['narrador', 'De noite, a praia está quieta. Quieta demais. Na areia, perto do Farol, lanternas roxas se movem.'],
        ['jonas', '{jogador}! Eles estão na casa de máquinas! O meu fragmento fica lá!'],
        ['recruta', 'Ih, o moleque de novo. Esse moleque é praga.'],
      ],
      depois: { batalha: { id: 'c4_recruta', nome: 'Recruta Crepúsculo', dinheiro: 900, equipe: [[261, 23, ['bite', 'howl', 'sandAttack']], [434, 23, ['poisonGas', 'feintAttack', 'screech']]] } },
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
      depois: { batalha: { id: 'c4_ebano', nome: 'Admin Ébano', dinheiro: 2000, equipe: [[198, 24, ['wingAttack', 'pursuit', 'haze']], [228, 24, ['ember', 'bite', 'smog']], [302, 26, ['shadowSneak', 'feintAttack', 'furySwipes', 'detect']]] } },
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
        ['bia', 'O Professor quer que você vá para Vila Lamparina, a nordeste. A Dona Zélia guarda o quinto fragmento. E sua avó mora lá!'],
        ['bia', 'Ah, o ginásio de lá só abre de noite. A Dona Zélia diz que fantasma não trabalha de dia. Sindicato.'],
        ['narrador', 'Fim do Capítulo 4'],
      ],
      depois: { flags: { ch4Done: true, chapter: 5 }, objetivo: 'Vá a Vila Lamparina pelo Brejo das Lamparinas', fimCapitulo: true },
    },
  ],
};
