// Jornada de Cidade Aurora: "O preço da luz" (era o capítulo 6).
// Rota 6 (ferrovia) → Cidade Aurora → Torre Aurora (visita guiada, Gerente Lúcio) → Mina Aurora (4 níveis, resgate do Heitor com o Téo).
// Mundo aberto: começa ao chegar à cidade (a Pipa pode ter ligado antes, no marco de 4 insígnias, ou não).
// Reviravolta 1: a luzita é a raiz do cadeado do Relógio; a mina é o que atrasa o sol.
// Jogável pelo motor src/story/roteiro.js. Níveis do lugar (o mais longe da vila): selvagens 19–26 fora e 27–38 na mina (cada andar mais forte), treinadores 20–21, Lúcio 22–23, Alfas 33–34, Steelix Alfa 35.
// Mina: alavancas dos desvios (nível 1), carrinhos nos trilhos (nível 3) e passagens que abrem com a história (enigmas.js).
// Sem ginásio. As lutas da mina são em dupla: o Pokémon do Téo luta ao seu lado (roteiro.js, batalha.dupla).

const MINA = { torre_aurora: 'elevador_mina', mina_aurora_n1: 'rampa_n1', mina_aurora_n2: 'rampa_n2', mina_aurora_n3: 'heitor_mina', mina_aurora_n4: 'steelix_alfa' };

export default {
  id: 'cap06',
  jornada: 'aurora',
  titulo: 'O preço da luz',
  sol: '7h12',
  cenas: [
    {
      id: 'ferrovia',
      local: 'rota6',
      gatilho: { tipo: 'pisar', alvo: 'torres_transmissao', semFlag: ['viuTorres'] },
      falas: [
        ['narrador', 'Torres de transmissão enfileiradas até o horizonte, zumbindo. Ao longe, um trem de carga passa carregado de caixas que brilham por entre as frestas.'],
        ['narrador', 'Com a Lente Prisma, os fios das torres parecem rios de luz correndo para o sul, para as cidades. E, por baixo da terra, um rio muito maior corre ao contrário: para o norte.'],
      ],
      depois: { flags: { viuTorres: true } },
    },
    {
      id: 'treinador_rota6',
      local: 'rota6',
      gatilho: { tipo: 'avistar', alvo: 'r6_wagner' },
      falas: [['treinador', 'Sou maquinista de folga. Quando eu não estou dirigindo trem, eu batalho. Quando eu não estou batalhando, eu penso em trem.']],
      depois: { batalha: { id: 'r6_wagner', nome: 'Maquinista Wagner', dinheiro: 1300, equipe: [[309, 20, ['spark', 'bite', 'howl']], [835, 20, ['spark', 'bite', 'roar']], [100, 21, ['spark', 'rollout', 'selfDestruct']]] } },
    },
    {
      id: 'treinadora_rota6',
      local: 'rota6',
      gatilho: { tipo: 'avistar', alvo: 'r6_yara' },
      falas: [['treinador', 'Meu Pawmi carrega o celular de todo mundo do acampamento. Ele é a pessoa mais útil daqui, e ele nem é pessoa.']],
      depois: { batalha: { id: 'r6_yara', nome: 'Campista Yara', dinheiro: 1300, equipe: [[921, 20, ['spark', 'quickAttack', 'nuzzle']], [922, 21, ['spark', 'machPunch', 'nuzzle']], [180, 21, ['thunderShock', 'cottonSpore', 'takeDown']]] } },
    },
    {
      id: 'aurora_chegada',
      local: 'cidade_aurora',
      gatilho: { tipo: 'entrar', alvo: 'cidade_aurora', semFlag: ['aurora'] },
      falas: [
        ['narrador', 'Cidade Aurora. Avenidas largas, prédios de vidro, outdoors que se mexem. Tudo brilha com uma luz dourada, até de dia.'],
        ['narrador', 'No centro, a Torre Aurora: um prédio branco que termina numa ponta de cristal. Atrás dela, a encosta do Paredão está aberta como uma ferida, cheia de andaimes.'],
        ['pipa', 'Ei! {jogador}! Aqui! Sou a Pipa! Você veio mesmo! Essa é a Flash, minha Rotom câmera. Diz oi, Flash.', { requer: ['pipaLigou'] }],
        ['pipa', 'Ei, você! É o {jogador}, não é? O treinador das {insignias_ext} insígnias! Eu sou a Pipa, repórter do "O Farol". Essa é a Flash, minha Rotom câmera. Diz oi, Flash.', { semFlag: ['pipaLigou'], requer: ['insignias>=1'] }],
        ['pipa', 'Ei, você! Treinador! Eu sou a Pipa, repórter do "O Farol". Essa é a Flash, minha Rotom câmera. Diz oi, Flash.', { semFlag: ['pipaLigou', 'insignias>=1'] }],
        ['narrador', 'A câmera flutuante dá um flash na sua cara.'],
        ['pipa', 'Eu estou investigando a Companhia Aurora. Tem coisa errada naquela mina, e ninguém deixa jornalista entrar. Mas estudante em visita guiada, eles deixam.', { semFlag: ['pipaLigou'] }],
        ['pipa', 'Ela gosta de você! Escuta: tem uma visita guiada na Torre daqui a pouco. Eu entro como sua "irmã mais velha". A Flash entra como "celular".'],
        ['pipa', 'Lá dentro tem uma sala de controle. Se a gente conseguir uma foto do painel principal, eu tenho a reportagem da minha vida.'],
      ],
      depois: { flags: { aurora: true, pipaLigou: true, 'objetivos.trama': null }, objetivo: { texto: 'Faça a visita guiada na Torre Aurora', alvo: 'torre_aurora' } },
    },
    {
      id: 'heitor_bairro',
      local: 'cidade_aurora',
      gatilho: { tipo: 'falar', alvo: 'mineiro_bairro', semFlag: ['ouviuMineiro'] },
      falas: [
        ['mineiro_bairro', 'Você é amigo do filho do Heitor? O Téo? Menino bom, barulhento. O Heitor fala dele o dia inteiro.'],
        ['mineiro_bairro', 'O Heitor está no turno da noite, no nível três. Ele não gosta de lá. Ninguém gosta. A gente diz que lá embaixo a mina chora luz.'],
      ],
      depois: { flags: { ouviuMineiro: true } },
    },
    {
      id: 'torre_visita',
      local: 'torre_aurora',
      gatilho: { tipo: 'entrar', alvo: 'torre_aurora', requer: ['aurora'], semFlag: ['visitaTorre'] },
      falas: [
        ['lucio', 'Sejam muito bem-vindos à Torre Aurora! Eu sou o Gerente Lúcio, gerente de Relações com a Comunidade, Segurança e Eventos. Três cargos! Um salário.'],
        ['lucio', 'Ora, ora, se não é o jovem herói da Praia dos Corais! Uma foto, uma foto! Sorria! Com a mão no logo!', { requer: ['defendeuPraia'] }],
        ['lucio', 'Ora, ora, um treinador de verdade! Quantas insígnias? {insignias}? Uma foto, uma foto! Sorria! Com a mão no logo!', { semFlag: ['defendeuPraia'] }],
        ['lucio', 'Aqui temos a maquete da nossa mina. A luzita é extraída com todo o cuidado, de veios naturais que se renovam sozinhos. Energia infinita e limpinha!'],
        ['pipa', '(baixinho) Se renovam sozinhos? Os veios estão encolhendo, eu tenho as medições.'],
        ['lucio', 'Mais alguma pergunta? Não? Excelente! Eu odeio perguntas.'],
      ],
      depois: { flags: { visitaTorre: true } },
    },
    {
      id: 'sirene',
      local: 'torre_aurora',
      gatilho: { tipo: 'apos', cena: 'torre_visita' },
      falas: [
        ['narrador', 'UÓÓÓÓ! Uma sirene corta o prédio. As luzes douradas piscam. Num telão, uma palavra em vermelho: DESABAMENTO, NÍVEL 3.'],
        ['lucio', 'Ah, não, não, não. Hoje não. Tem visita! Seguranças, levem os visitantes para fora! Sorrindo! Sorrindo!'],
        ['narrador', 'Na confusão, a porta da sala de controle fica aberta.'],
        ['pipa', 'É agora ou nunca. Flash, comigo.'],
        ['teo', '{jogador}!'],
        ['narrador', 'Téo entra correndo pela recepção, sem fôlego, de mochila nas costas.'],
        ['teo', 'Eu vim fazer surpresa pro meu pai. Nível três. Ele está no nível três. Eles não deixam ninguém descer!'],
      ],
      escolhas: [
        { texto: 'A gente desce junto.', falas: [['teo', '…Junto. Tá. Junto.']], flags: { teoAfeto: '+1' } },
        { texto: 'Pipa, cuida do painel. Eu vou com o Téo.', falas: [['pipa', 'Vai! Eu me viro aqui! E toma cuidado, por favor!'], ['teo', 'Valeu. Valeu mesmo.']], flags: { teoAfeto: '+1' } },
      ],
      depois: { flags: { teoJunto: true }, objetivo: { texto: 'Desça a Mina Aurora com o Téo e encontre o Heitor', alvo: 'elevador_mina', porSala: MINA } },
    },
    {
      id: 'lucio_porta',
      local: 'torre_aurora',
      gatilho: { tipo: 'pisar', alvo: 'elevador_mina', requer: ['visitaTorre'], semFlag: ['trainers.c6_lucio'] },
      falas: [
        ['lucio', 'Alto lá! Ninguém desce! Área restrita! Política da empresa! O seguro não cobre criança!'],
        ['teo', 'Meu pai está lá embaixo!'],
        ['lucio', 'E vai ser resgatado pela equipe oficial da Aurora, assim que o protocolo de imagem estiver… quer dizer, o protocolo de segurança.'],
        ['jogador', 'Sai da frente.'],
      ],
      depois: { batalha: { id: 'c6_lucio', nome: 'Gerente Lúcio', dinheiro: 2600, equipe: [[81, 22, ['thunderShock', 'sonicBoom', 'mirrorShot']], [599, 22, ['gearGrind', 'charge', 'bind']], [969, 23, ['rockThrow', 'acidSpray', 'stealthRock']]] } },
    },
    {
      id: 'lucio_perdeu',
      local: 'torre_aurora',
      gatilho: { tipo: 'perder', alvo: 'c6_lucio' },
      falas: [['lucio', 'Viu? Protocolo é protocolo! Volte quando estiver… não volte. Não volte, por favor.']],
    },
    {
      id: 'lucio_vencido',
      local: 'torre_aurora',
      gatilho: { tipo: 'vencer', alvo: 'c6_lucio' },
      falas: [
        ['lucio', 'Isso é muito irregular! Vou escrever um relatório! Com cópia!'],
        ['narrador', 'Lúcio deixa cair um crachá dourado na fuga. "CRACHÁ AURORA: ACESSO DE SERVIÇO".'],
        ['teo', 'O elevador de serviço! Com esse crachá ele desce. Vamos!'],
      ],
      depois: { itens: [['cracha_aurora', 1]], objetivo: { texto: 'Desça a Mina Aurora pelo elevador de serviço', alvo: 'elevador_mina', porSala: MINA } },
    },
    {
      id: 'mina_n1',
      local: 'mina_aurora_n1',
      gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n1', semFlag: ['minaN1'] },
      falas: [
        ['narrador', 'Mina Aurora, nível 1. Trilhos, carrinhos, lâmpadas penduradas. As paredes têm veios de luzita do tamanho de troncos.'],
        ['teo', 'Eu nunca tinha vindo aqui. Ele nunca deixou. Ele dizia que não era lugar de criança.'],
        ['teo', 'Eu achava que era porque ele tinha vergonha de mim. Agora acho que ele tinha vergonha daqui.'],
        ['teo', 'Olha: portões de desvio. Uma alavanca abre um e fecha o outro. A rampa pro nível 2 deve ser lá no salão leste.'],
      ],
      depois: { flags: { minaN1: true, dupla: 'teo' }, objetivo: { texto: 'Use as alavancas e chegue à rampa do nível 2', alvo: 'rampa_n1', porSala: MINA } },
    },
    {
      id: 'mina_alfas',
      local: 'mina_aurora_n2',
      gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n2', semFlag: ['minaN2'] },
      falas: [
        ['narrador', 'No nível 2, as lâmpadas estão quebradas. Só a luzita ilumina. Pokémon de cristal saem das paredes de olhos vermelhos.'],
        ['teo', 'Glimmet de olho vermelho! Carbink de olho vermelho! Todo mundo aqui está Alfa?!'],
        ['narrador', 'Lute junto com o Téo: o Pokémon dele luta ao lado do seu.'],
      ],
      depois: {
        batalha: { id: 'c6_alfas', nome: 'Pokémon Alfa de cristal', alfa: true, dupla: 'teo', equipe: [[969, 33, ['rockThrow', 'acidSpray']], [703, 34, ['rockThrow', 'reflect', 'dazzlingGleam']], [525, 34, ['rockBlast', 'headbutt']]] },
        flags: { minaN2: true },
        objetivo: { texto: 'Desça para o nível 3, onde o Heitor está preso', alvo: 'rampa_n2', porSala: MINA },
      },
    },
    {
      id: 'mina_alfas_depois',
      local: 'mina_aurora_n2',
      gatilho: { tipo: 'vencer', alvo: 'c6_alfas' },
      falas: [['teo', 'Ufa. Eles não eram maus. Era como se alguma coisa estivesse gritando dentro deles. Vamos, pai, a gente está chegando.']],
    },
    {
      id: 'mina_n3',
      local: 'mina_aurora_n3',
      gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n3', semFlag: ['minaN3'] },
      falas: [
        ['narrador', 'Nível 3. Pedras no chão, poeira dourada no ar. Carrinhos descarrilados entopem o túnel dos trilhos.'],
        ['teo', 'Ali no fundo! Uma lanterna de capacete! Empurra esses carrinhos pros desvios, rápido!'],
      ],
      depois: { flags: { minaN3: true } },
    },
    {
      id: 'mina_heitor',
      local: 'mina_aurora_n3',
      gatilho: { tipo: 'pisar', alvo: 'heitor_mina', semFlag: ['achouHeitor'] },
      falas: [
        ['narrador', 'Atrás de uma viga caída, uma lanterna de capacete pisca.'],
        ['teo', 'PAI!'],
        ['heitor', 'Téo? Téo?! O que você está fazendo aqui, filho? Isso aqui não é lugar…'],
        ['teo', 'Não é lugar de criança, eu sei! Eu sei! Para de falar isso e me deixa te tirar daí!'],
        ['heitor', 'A perna está presa. Os outros saíram. Eu fiquei pra fechar a válvula do nível 4. Se ninguém fechasse, a luz ia vazar tudo.'],
        ['heitor', 'Mas não deu. Alguma coisa lá embaixo acordou. A parede se mexeu. A parede, filho. A parede se mexeu.'],
        ['narrador', 'Com {inicial} e o {rival_inicial} empurrando juntos, a viga cede. Heitor se arrasta para fora.'],
        ['heitor', 'Vocês dois… Obrigado. Escuta: tem um Steelix lá embaixo, Alfa, guardando a passagem. Foi ele que derrubou o teto. Ele não está bravo. Ele está com dor.'],
      ],
      depois: { flags: { achouHeitor: true }, objetivo: { texto: 'Desça ao nível 4 e acalme o Steelix Alfa', alvo: 'poco_n3', porSala: { ...MINA, mina_aurora_n3: 'poco_n3' } } },
    },
    {
      id: 'mina_n4',
      local: 'mina_aurora_n4',
      gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n4', semFlag: ['minaN4'] },
      falas: [
        ['narrador', 'Nível 4. Aqui não há mais trilhos. As paredes são de luzita pura, e a luz pulsa: devagar, forte, devagar. Como um coração.'],
        ['narrador', 'Atravessando a rocha de um lado a outro, há algo enorme. Uma garra. De cristal escuro. Maior que uma casa.'],
        ['teo', 'Isso… isso é uma pedra, né? Fala que é uma pedra.'],
        ['narrador', 'O Steelix Alfa se ergue entre vocês e a garra. O corpo dele está coberto de luzita. Ele ruge, e a mina inteira treme.'],
      ],
      depois: {
        batalha: { id: 'c6_steelix', nome: 'Steelix Alfa', alfa: true, dupla: 'teo', perder: 'repete', equipe: [[208, 35, ['ironTail', 'rockSlide', 'bind', 'screech']]] },
        flags: { minaN4: true },
      },
    },
    {
      id: 'steelix_perdeu',
      local: 'mina_aurora_n4',
      gatilho: { tipo: 'perder', alvo: 'c6_steelix' },
      falas: [['teo', 'Ele é forte demais assim! Vamos curar a equipe e voltar. Meu pai disse: ele está com dor. A gente tem que tirar essa dor dele.']],
    },
    {
      id: 'verdade_mina',
      local: 'mina_aurora_n4',
      gatilho: { tipo: 'vencer', alvo: 'c6_steelix' },
      falas: [
        ['narrador', 'O Steelix desaba. Os cristais caem do corpo dele como casca de ferida. Ele respira fundo e se enrola no canto, aliviado.'],
        ['narrador', 'Você levanta a Lente Prisma.'],
        ['narrador', 'A luz das paredes não fica aqui. Ela escorre. Por todos os veios, para cima, para o norte, para o planalto. Como raízes bebendo ao contrário.'],
        ['narrador', 'E a garra de cristal… a luz passa por ela. Ela é a ponta de alguma coisa. A raiz de alguma coisa.'],
        ['pokedex', 'Bzzz… {jogador}? É a Pipa! Estou na sala de controle! Você tem que ver isso!'],
        ['pipa', 'O painel principal. Tem uma coluna chamada "consumo de alvorada". Em minutos!'],
        ['pipa', 'Cada carga que sai da mina tem um número do lado. Ontem: quarenta cargas, "1,2 minuto". Semana passada: "8,4 minutos". Eles SABEM!'],
        ['pipa', 'Eles sabem que tirar luzita atrasa o sol. Eles medem! Eles têm um gráfico! Um gráfico bonito, colorido!'],
        ['teo', 'Então não é a Crepúsculo. Não é a Crepúsculo que está roubando o sol.'],
        ['teo', 'É a luz que a gente tem em casa. Até no banheiro.'],
      ],
      depois: { arena: 'torre_saida', flags: { reviravolta1: true }, itens: [['foto_painel', 1]] },
    },
    {
      id: 'saida_mina',
      local: 'torre_aurora',
      gatilho: { tipo: 'apos', cena: 'verdade_mina' },
      falas: [
        ['narrador', 'Na saída da mina, a recepção está cheia de câmeras. As portas do elevador se abrem e Augusto Solano entra, de terno branco, com o rosto preocupado.'],
        ['solano', 'Heitor! Graças aos céus. E estes são os heróis? Dois meninos, sozinhos, lá embaixo!'],
        ['narrador', 'Solano abraça o Téo diante dos flashes. Téo fica duro como uma tábua.'],
        ['solano', 'Vou apurar tudo pessoalmente. Ninguém nesta empresa vai ser esquecido. Heitor, você terá o melhor hospital da região.'],
        ['solano', 'E você, {jogador}. Que coragem. Eu tinha a sua idade quando prometi acender este mundo. Talvez um dia você trabalhe comigo.'],
        ['narrador', 'Ele aperta sua mão. A mão dele é quente e firme. Ele sorri para as câmeras e não olha para você nem por um segundo.'],
        ['teo', '(baixinho) Ele não perguntou do meu pai nenhuma vez. Só da foto.'],
      ],
      depois: { flags: { dupla: null }, objetivo: { texto: 'Encontre a Pipa na redação do "O Farol"', alvo: 'redacao_farol' } },
    },
    {
      id: 'pipa_depois',
      local: 'redacao_farol',
      gatilho: { tipo: 'entrar', alvo: 'redacao_farol', requer: ['reviravolta1'], semFlag: ['jornadas.aurora.feita'] },
      falas: [
        ['pipa', 'Eu tenho a foto. Mas foto sozinha não derruba ninguém. Eles vão dizer que é montagem, que é outro painel, que é maquete.'],
        ['pipa', 'Preciso de mais. De onde vem essa luz? O que é aquela garra? Por que o Relógio de Pedra está metido nisso?'],
        ['pipa', 'O Forte Rochedo tem o arquivo histórico da região. Mapas antigos, cartas, tudo. Se tiver alguma resposta, está lá.'],
        ['pipa', 'Toma. Uma MT que a Flash "achou" na sala de controle. Canhão de Luz. Acho justo devolver um pouco de luz pra quem merece.'],
        ['pipa', 'E se você fotografar Pokémon Alfa pela região, me manda. Cada foto é uma prova.'],
      ],
      depois: { mt: 'flashCannon', flags: { sq_pipa: 'ativa', dupla: null }, fimJornada: true },
    },

    // ---------------- missão secundária: A casa dos Solano (sq_solano) ----------------
    {
      id: 'sq_solano_casa',
      local: 'casa_solano',
      solta: true, // missão secundária na Vila Lamparina: não começa a jornada de Aurora
      gatilho: { tipo: 'pisar', alvo: 'diario_solano', semFlag: ['sq_solano_completa'] },
      falas: [
        ['narrador', 'No canto do quarto empoeirado, um Duskull flutua quietinho. Ele segura uma máscara de papel de menino, pintada com um sol.'],
        ['narrador', 'Quando você chega perto, ele não foge. Aponta com a máscara para uma tábua solta do chão.'],
        ['narrador', 'Debaixo da tábua, um caderno. Na capa: "Diário do Tiago. Proibido ler. Só o Augusto pode."'],
        ['narrador', 'A última página tem um desenho: um menino grande segurando um sol na mão, e um menino pequeno ao lado. Embaixo, com letra torta: "meu irmão vai acender o mundo".'],
        ['narrador', '{jogador} guardou o Diário de Tiago.'],
        ['narrador', 'O Duskull solta a máscara no chão e flutua até o seu ombro. Parece que ele cansou de esperar sozinho.'],
      ],
      depois: { itens: [['diario_tiago', 1]], pokemon: [355, 30], flags: { sq_solano: 'completa', sq_solano_completa: true } },
    },
  ],
};
