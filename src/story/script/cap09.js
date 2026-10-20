// Capítulo 9: Asas do Mirante
// Rota 9 (Estepe dos Ventos) → Mirante dos Ventos → ataque da Aurora ao Viveiro (resgate dos filhotes, Lúcio) →
// confissão do Prof. Jatobá → Torre do Vento (ginásio da Celeste) → Corviknight.

export default {
  id: 'cap09',
  titulo: 'Asas do Mirante',
  sol: '8h22',
  cenas: [
    {
      id: 'titulo',
      local: 'rota9',
      gatilho: { tipo: 'inicio', requer: ['ch8Done'] },
      falas: [['narrador', 'Capítulo 9: Asas do Mirante']],
      depois: { flags: { chapter: 9 } },
    },
    {
      id: 'radio',
      local: 'rota9',
      gatilho: { tipo: 'apos', cena: 'titulo' },
      falas: [
        ['radio', 'Bom dia, Alvorada. Oito e vinte e dois.'],
        ['radio', 'Hoje eu vou ler uma carta de ouvinte. "Dona Helena, meu filho de cinco anos perguntou se o sol está doente." Assinado, Clara, de Porto Espelho.'],
        ['radio', 'Clara, eu não sei. Mas eu conheço alguém que está tentando descobrir. E ele é teimoso igual ao pai dele.'],
      ],
    },
    {
      id: 'estepe',
      local: 'rota9',
      gatilho: { tipo: 'pisar', alvo: 'estepe_inicio', semFlag: ['viuEstepe'] },
      falas: [
        ['narrador', 'A Estepe dos Ventos. Rajadas fortes atravessam o capim e empurram você para os lados. Cata-ventos de pedra, antigos, rangem girando.'],
        ['narrador', 'Quando a rajada vem, o capim deita antes. Observe o capim e se abrigue atrás das pedras.'],
      ],
      depois: { flags: { viuEstepe: true } },
    },
    {
      id: 'vigia',
      local: 'rota9',
      gatilho: { tipo: 'falar', alvo: 'vigia', semFlag: ['conheceuVigia'] },
      falas: [
        ['vigia', 'Ah. O menino que carrega seis pedaços da chave. Ou sete, contando a chama no bolso.'],
        ['jogador', 'Quem é o senhor?'],
        ['vigia', 'O último de uma família que vigiava. Hoje eu vigio as nuvens. Elas também não chegam na hora.'],
        ['vigia', 'Uma coisa só, porque coisa demais confunde: o Relógio não acende o sol. Nunca acendeu.'],
        ['vigia', 'Se quiser saber o resto, as Ruínas ao oeste do Relógio guardam as letras. Elas estão espalhadas. Elas gostam de brincar.'],
      ],
      depois: { flags: { conheceuVigia: true, sq_unown: 'disponivel' } },
    },
    {
      id: 'piloto_rota9',
      local: 'rota9',
      gatilho: { tipo: 'avistar', alvo: 'r9_bruno' },
      falas: [['treinador', 'Asa-delta é liberdade! Até a hora de pousar. Pousar é a parte que dói. Batalha!']],
      depois: { batalha: { id: 'r9_bruno', nome: 'Piloto Bruno', dinheiro: 1700, equipe: [[333, 37, ['dragonBreath', 'mirrorMove', 'cottonGuard']], [662, 38, ['flameCharge', 'wingAttack', 'agility']]] } },
    },
    {
      id: 'vaqueira_rota9',
      local: 'rota9',
      gatilho: { tipo: 'avistar', alvo: 'r9_celia' },
      falas: [['treinador', 'Meu Tauros pastou aqui a vida inteira. Agora tem dia que ele acorda de olho vermelho e eu tenho que dormir no telhado. Bora lutar!']],
      depois: { batalha: { id: 'r9_celia', nome: 'Vaqueira Célia', dinheiro: 1750, equipe: [[128, 38, ['zenHeadbutt', 'takeDown', 'scaryFace']], [672, 38, ['razorLeaf', 'bulldoze', 'leechSeed']]] } },
    },
    {
      id: 'mirante_chegada',
      local: 'mirante_ventos',
      gatilho: { tipo: 'entrar', alvo: 'mirante_ventos', semFlag: ['mirante'] },
      falas: [
        ['narrador', 'Mirante dos Ventos. Casas de madeira presas nas falésias, pontes de corda balançando, bandeirolas e cata-ventos por toda parte. Embaixo, só nuvem.'],
        ['narrador', 'E um barulho alto: TUC-TUC-TUC-TUC. Dois helicópteros brancos e dourados pousam no topo da falésia.'],
        ['nina', 'Não, não, não! Os filhotes! Eles vão assustar os filhotes!'],
      ],
      depois: { flags: { mirante: true } },
    },
    {
      id: 'lucio_viveiro',
      local: 'viveiro_corviknight',
      gatilho: { tipo: 'apos', cena: 'mirante_chegada' },
      falas: [
        ['lucio', 'Bom dia, Mirante! Companhia Aurora! Viemos fazer uma proposta irrecusável. Tão irrecusável que trouxemos seguranças!'],
        ['celeste', 'Saiam do meu viveiro.'],
        ['lucio', 'Senhora Celeste! Que prazer. O senhor Solano deseja adquirir o fragmento histórico do Mirante para o novo Museu Aurora da Luz. E o terreno do viveiro, para uma subestação.'],
        ['celeste', 'Não.'],
        ['lucio', 'Que pena. Nós já compramos os fragmentos de Sussurro, de Coral e de… bem, de quase todo mundo. As prefeituras adoram doações.'],
        ['narrador', 'Um dos helicópteros acelera. O vento dos rotores bate no viveiro e os ninhos se soltam. Cinco filhotes de Rookidee caem pelas falésias, piando.'],
        ['nina', 'NÃO!'],
        ['celeste', 'Menino. Você. Ajuda a Nina a buscar os filhotes. Eu seguro esse homem.'],
      ],
      depois: { objetivo: 'Resgate os 5 filhotes de Rookidee nas falésias', flags: { resgateFilhotes: 0 } },
    },
    {
      id: 'filhote',
      local: 'mirante_ventos',
      gatilho: { tipo: 'falar', alvo: 'filhote_rookidee' },
      repete: true,
      falas: [
        ['narrador', 'Um filhote de Rookidee tremendo numa saliência da rocha. Ele bica seu dedo, assustado, e depois se aninha na sua mão.'],
        ['nina', 'Mais um! Traz pra cá, com cuidado!'],
      ],
      depois: { flags: { resgateFilhotes: '+1' } },
    },
    {
      id: 'ventania',
      local: 'viveiro_corviknight',
      gatilho: { tipo: 'flag', alvo: 'resgateFilhotes', valor: 5, semFlag: ['ventaniaConfia'] },
      falas: [
        ['nina', 'Os cinco! Os cinco estão aqui!'],
        ['narrador', 'Do alto da falésia desce uma Corviknight enorme, de penas azul-escuras como aço molhado. Ela pousa, conta os filhotes com o bico, um por um.'],
        ['narrador', 'Depois abaixa a cabeça diante de você e fica assim, parada.'],
        ['nina', 'Essa é a Ventania. A mãe deles. Ela… ela nunca abaixa a cabeça pra ninguém. Nem pra Celeste.'],
      ],
      depois: { flags: { ventaniaConfia: true } },
    },
    {
      id: 'lucio_batalha',
      local: 'viveiro_corviknight',
      gatilho: { tipo: 'apos', cena: 'ventania' },
      falas: [
        ['lucio', 'Muito comovente. De verdade. Eu quase chorei. Mas negócios são negócios.'],
        ['narrador', 'Atrás dele, um Vigilante sai do viveiro com uma caixa de vidro. Dentro, o Fragmento da Pluma.'],
        ['celeste', 'Eles me prenderam no cercado com Magnezone! Não deixa ele levar!'],
        ['lucio', 'O menino de novo! Eu tenho pesadelo com você, sabia? Dessa vez eu vim preparado!'],
      ],
      depois: { batalha: { id: 'c9_lucio', nome: 'Gerente Lúcio', dinheiro: 3600, equipe: [[462, 41, ['flashCannon', 'thunderbolt', 'magnetBomb']], [601, 41, ['gearGrind', 'thunderbolt', 'shiftGear']], [970, 42, ['powerGem', 'sludgeBomb', 'stealthRock']]] } },
    },
    {
      id: 'lucio_foge',
      local: 'viveiro_corviknight',
      gatilho: { tipo: 'vencer', alvo: 'c9_lucio' },
      falas: [
        ['lucio', 'Não importa! Não importa! A pedra já está no helicóptero! Decolar, decolar!'],
        ['narrador', 'O helicóptero sobe com o Fragmento da Pluma e some na direção de Cidade Aurora.'],
        ['celeste', 'Eles levaram. Mas os filhotes estão vivos. Uma coisa de cada vez.'],
        ['narrador', 'Atrás de vocês, um Corviknight-táxi pousa na ponte de corda. Do cesto desce, desajeitado, um homem de barba grisalha e sandálias. Com um Tropius atrás.'],
        ['prof', 'Eu… cheguei atrasado. Como sempre. Como o sol.'],
      ],
      depois: { flags: { plumaRoubada: true } },
    },
    {
      id: 'confissao',
      local: 'mirante_ventos',
      gatilho: { tipo: 'apos', cena: 'lucio_foge' },
      falas: [
        ['narrador', 'No ponto mais alto do Mirante, de onde se vê o Relógio de Pedra, o Professor senta numa pedra. O Tropius deita do lado dele.'],
        ['prof', 'Você leu as cartas. A Bia me contou que você leu. Eu… preciso dizer em voz alta. Pelo menos uma vez na vida.'],
        ['prof', 'Dezesseis anos atrás, a Véspera e eu achamos a gruta. A luzita. Era a coisa mais bonita que eu já tinha visto. Ela tinha medo. Eu tinha pressa.'],
        ['prof', 'Fui eu que quis tirar a amostra. Fui eu que disse "só uma". A Noite Longa veio naquela madrugada. E a Sina entrou na gruta por nós.'],
        ['prof', 'Depois… o laboratório não tinha dinheiro. Ninguém me levava a sério. E o Augusto, que era um rapaz de Lamparina com sonho grande, me ofereceu tudo.'],
        ['prof', 'Eu disse a mim mesmo que a amostra era pequena. Que ele ia estudar com cuidado. Que a Noite Longa tinha sido coincidência.'],
        ['prof', 'A Véspera nunca me perdoou. E ela estava certa. Cada minuto que o sol atrasa, {jogador}, um pouco dele é meu.'],
        ['narrador', 'O Professor tira os óculos e esfrega os olhos.'],
        ['prof', 'Eu não espero que você me perdoe. Só não queria que você ouvisse de outra pessoa.'],
      ],
      escolhas: [
        {
          texto: 'O senhor errou. Mas está aqui agora.',
          falas: [['prof', 'Estou. E vou continuar. Até o sol nascer na hora certa, ou até eu não aguentar mais a escada.']],
          flags: { profPerdao: 'perdoou' },
        },
        {
          texto: 'O senhor devia ter contado antes.',
          falas: [['prof', 'Devia. Devia ter contado para a polícia, para o jornal, para a sua mãe. Vou contar. Quando isso acabar, eu conto para todo mundo.']],
          flags: { profPerdao: 'cobrou' },
        },
        {
          texto: '(Ficar em silêncio.)',
          falas: [['narrador', 'Vocês ficam olhando o Relógio de Pedra por um longo tempo. O Tropius oferece uma fruta do cacho. Você aceita.']],
          flags: { profPerdao: 'silencio' },
        },
      ],
    },
    {
      id: 'prof_plano',
      local: 'mirante_ventos',
      gatilho: { tipo: 'apos', cena: 'confissao' },
      falas: [
        ['prof', 'Escute. Eu passei a semana relendo o caderno velho. A luzita não é uma pedra. São raízes. Raízes de um cadeado.'],
        ['prof', 'O Relógio não acende o sol. Ele prende alguma coisa. Uma coisa que come luz. E cada tonelada que a Aurora tira solta um pouco o cadeado.'],
        ['prof', 'Se a Véspera juntar os oito fragmentos e fizer o Relógio "dormir"… eu não sei o que acontece. Ninguém sabe. E é isso que me apavora.'],
        ['prof', 'Vença a Celeste. Você vai precisar de asas. E eu preciso que você encontre a Véspera antes que ela encaixe as pedras.'],
      ],
      depois: { flags: { profConfessou: true }, objetivo: 'Suba a Torre do Vento e desafie a Celeste' },
    },
    {
      id: 'torre_entrada',
      local: 'torre_vento',
      gatilho: { tipo: 'entrar', alvo: 'torre_vento', semFlag: ['torreDentro'] },
      falas: [
        ['narrador', 'A Torre do Vento é aberta para o céu. Tubos de vento sopram para cima entre plataformas. Quatro cata-ventos de bronze giram nos cantos.'],
        ['nina', 'Cada cata-vento gira noventa graus quando você bate nele. Quando os quatro apontarem pro centro, a corrente do meio leva até a Celeste!'],
      ],
      depois: { flags: { torreDentro: true } },
    },
    {
      id: 'aprendiz_celeste1',
      local: 'torre_vento',
      gatilho: { tipo: 'avistar', alvo: 'g8_gael' },
      falas: [['aprendiz', 'Aqui em cima não tem chão firme. Só tem coragem e corda!']],
      depois: { batalha: { id: 'g8_gael', nome: 'Piloto Gael', dinheiro: 1800, equipe: [[333, 38, ['dragonBreath', 'cottonGuard', 'peck']], [662, 39, ['flameCharge', 'acrobatics', 'agility']]] } },
    },
    {
      id: 'aprendiz_celeste2',
      local: 'torre_vento',
      gatilho: { tipo: 'avistar', alvo: 'g8_iris' },
      falas: [['aprendiz', 'Meu Noctowl enxerga você desde que você entrou. Ele achou seu cabelo engraçado.']],
      depois: { batalha: { id: 'g8_iris', nome: 'Piloto Íris', dinheiro: 1850, equipe: [[17, 39, ['wingAttack', 'twister', 'quickAttack']], [164, 40, ['airSlash', 'hypnosis', 'extrasensory']]] } },
    },
    {
      id: 'torre_catavento',
      local: 'torre_vento',
      gatilho: { tipo: 'flag', alvo: 'trainers.g8_iris', requer: ['trainers.g8_gael'] },
      falas: [
        ['narrador', 'Os cata-ventos da torre param um a um. O vento que sobrava desce pelo tubo central e some.'],
        ['celeste', 'Você chegou ao topo com o vento a favor. Agora a Torre é sua conversa.'],
      ],
      depois: { flags: { cataVentos: true }, objetivo: 'Desafie a Líder Celeste no topo da Torre do Vento' },
    },
    {
      id: 'celeste_desafio',
      local: 'torre_vento',
      gatilho: { tipo: 'falar', alvo: 'celeste', requer: ['cataVentos', 'trainers.g8_gael', 'trainers.g8_iris'], semFlag: ['badges.mirante'] },
      falas: [
        ['celeste', 'Você salvou os filhotes. Eu não falo muito, então vou dizer uma vez: obrigada.'],
        ['celeste', 'Agora, batalha. Aqui, o vento decide metade. Você decide a outra metade.'],
      ],
      depois: {
        batalha: {
          id: 'leader_celeste', nome: 'Líder Celeste', dinheiro: 4400, dynamax: true, // ginásio de Dynamax: o Braviary dela cresce no fim
          equipe: [
            [277, 41, ['aerialAce', 'quickAttack', 'endeavor']],
            [227, 42, ['steelWing', 'airCutter', 'spikes']],
            [334, 43, ['dragonPulse', 'cottonGuard', 'airSlash']],
            [663, 43, ['flameCharge', 'acrobatics', 'quickAttack']],
            [628, 45, ['braveBird', 'crushClaw', 'airSlash', 'superpower']],
          ],
        },
      },
    },
    {
      id: 'celeste_perdeu_jogador',
      local: 'torre_vento',
      gatilho: { tipo: 'perder', alvo: 'leader_celeste' },
      falas: [['celeste', 'O vento muda. Volte quando ele estiver a seu favor.']],
    },
    {
      id: 'celeste_vencida',
      local: 'torre_vento',
      gatilho: { tipo: 'vencer', alvo: 'leader_celeste' },
      falas: [
        ['celeste', 'Você voou mais alto que o meu Braviary. A Pluma é sua.'],
        ['narrador', '{jogador} recebeu a Insígnia Pluma! As oito insígnias estão no estojo, em roda, como um relógio.'],
        ['celeste', 'E a MT Golpe Aéreo. Ele nunca erra. Ao contrário de algumas pessoas.'],
        ['celeste', 'A Ventania escolheu você. Corviknight não é dado, é escolhido. Leve ela. Ela conhece cada Ninho da região.'],
        ['narrador', 'A Ventania abre as asas. Agora {jogador} pode VOAR sobre o mapa e viajar rápido para qualquer Ninho!'],
        ['nina', 'Cuida dela! E dá uma voltinha por cima das nuvens. É a coisa mais bonita do mundo.'],
      ],
      depois: { insignia: 'mirante', mt: 'aerialAce', montaria: 'mantine', flags: { 'badges.mirante': true, 'mounts.mergulhar': true } }, // Mergulhar: a partir da 8ª insígnia
    },
    {
      id: 'fim',
      local: 'mirante_ventos',
      gatilho: { tipo: 'apos', cena: 'celeste_vencida' },
      falas: [
        ['narrador', 'Lá embaixo, o Lago Espelho brilha. No meio dele, a neblina de sempre. Mas hoje, no meio da neblina, há uma luz roxa piscando.'],
        ['narrador', 'E na borda da falésia, branca contra o céu, a Sina olha para o lago. Depois olha para você.'],
        ['prof', 'A neblina do lago. A Ilha do Véu. Tem um observatório antigo lá, dos Vigias. É lá que ela está, não é?'],
        ['prof', 'Eu vou ficar aqui e estudar o Relógio de longe com a Celeste. Me ligue a cada hora. A cada hora, {jogador}.'],
        ['narrador', 'Fim do Capítulo 9'],
      ],
      depois: { flags: { ch9Done: true, chapter: 10 }, objetivo: 'Voe até o Lago Espelho e entre na neblina da Ilha do Véu', fimCapitulo: true },
    },
  ],
};
