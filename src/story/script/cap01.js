// Capítulo 1: O primeiro alvorecer
// Vila Alvorada → Laboratório → escolha do inicial → Téo → Rota 1 (Campos de Lúmen) → Cidade Campina → Ginásio do Tomé.
// Mesmos ids de treinador e flags do capítulo 1 do 3D (r1_caio, r1_davi, r1_pedro, g1_icaro, g1_rui, leader_tome).

export default {
  id: 'cap01',
  titulo: 'O primeiro alvorecer',
  sol: '6h11',
  cenas: [
    {
      id: 'titulo',
      local: 'casa_jogador',
      gatilho: { tipo: 'inicio', semFlag: ['intro'] },
      falas: [
        ['narrador', 'REGIÃO ALVORADA'],
        ['narrador', 'Capítulo 1: O primeiro alvorecer'],
      ],
      depois: { flags: { intro: true, chapter: 1 } },
    },
    {
      id: 'radio',
      local: 'casa_jogador',
      gatilho: { tipo: 'apos', cena: 'titulo' },
      falas: [
        ['radio', 'Bom dia, Alvorada! Aqui é a Helena, no seu "Bom Dia, Alvorada!", direto da vila mais simpática da região!'],
        ['radio', 'E a hora do nascer do sol de hoje foi… seis e onze. Seis e onze! O certo é cinco e cinquenta e oito, minha gente.'],
        ['radio', 'Se alguém souber onde o sol anda passando as madrugadas, liga pra rádio. Agora, uma música pra acordar quem ainda está na cama…'],
        ['radio', '…e eu estou olhando pra você, {jogador}.'],
      ],
    },
    {
      id: 'acordar',
      local: 'casa_jogador',
      gatilho: { tipo: 'apos', cena: 'radio' },
      falas: [
        ['mae', '{jogador}… {jogador}! Acorda, dorminhoco! Os Starly já cantaram, desistiram e foram cantar na casa do vizinho.'],
        ['mae', 'O Professor Jatobá passou aqui antes do sol. Bom, antes do sol hoje não é muito difícil.'],
        ['mae', 'Ele disse que hoje é um dia especial para você. O laboratório fica no fim da praça, ao sul da vila.'],
        ['mae', 'E nada de sair da vila sem um Pokémon, ouviu? O mato alto não perdoa canela de ninguém.'],
      ],
      escolhas: [
        { texto: 'Já estou indo!', falas: [['mae', 'Esse é o meu filho. Vai, vai! E escova esse cabelo no caminho.']] },
        { texto: 'Só mais cinco minutinhos…', falas: [['mae', 'Cinco minutinhos foi o que o sol disse hoje também. Olha no que deu. Levanta!']] },
      ],
      depois: { objetivo: 'Vá ao laboratório do Prof. Jatobá, no fim da praça' },
    },
    {
      id: 'mae_sem_pokemon',
      local: 'casa_jogador',
      gatilho: { tipo: 'falar', alvo: 'mae', semFlag: ['starter'] },
      repete: true,
      falas: [['mae', 'O Professor está esperando no laboratório, no fim da praça! Vai que eu seguro as pontas da rádio.']],
    },
    {
      id: 'rosa_praca',
      local: 'vila_alvorada',
      gatilho: { tipo: 'falar', alvo: 'rosa', semFlag: ['starter'] },
      falas: [
        ['rosa', 'Bom dia, {jogador}! O Téo saiu correndo daqui com meio pão de queijo na boca. Disse que ia "ganhar de você no laboratório".'],
        ['rosa', 'Toma um pra você também, que ninguém briga direito de barriga vazia.'],
      ],
      depois: { itens: [['pao_de_queijo', 1]] },
    },
    {
      id: 'ze_relogios',
      local: 'radio_alvorada',
      gatilho: { tipo: 'falar', alvo: 'ze' },
      repete: true,
      falas: [
        ['ze', 'Tenho quarenta e dois relógios nesta casa e cada um marca uma hora diferente.'],
        ['ze', 'Antes era por defeito. Agora é por protesto. Se o sol não respeita horário, por que eles respeitariam?'],
      ],
    },
    {
      id: 'saida_bloqueada',
      local: 'vila_alvorada',
      gatilho: { tipo: 'pisar', alvo: 'saida_oeste', semFlag: ['starter'] },
      repete: true,
      falas: [
        ['prof', 'Ei! Espere! Não saia da vila sem um Pokémon!'],
        ['prof', 'O mato alto é cheio de Pokémon selvagens. Venha ao meu laboratório, no fim da praça!'],
      ],
    },
    {
      id: 'lab_chegada',
      local: 'lab_jatoba',
      gatilho: { tipo: 'falar', alvo: 'prof', semFlag: ['talkedProf'] },
      falas: [
        ['bia', 'Professor! Professor, ele chegou! O menino da rádio!'],
        ['prof', 'Ah, {jogador}! Até que enfim! Bom dia! Bom… dia meio atrasado, mas bom dia!'],
        ['prof', 'Eu sou Jatobá, o professor desta vila. Esta é a Bia, minha assistente, que não dorme e não deixa ninguém dormir.'],
        ['bia', 'Prazer! Eu dou apelido pra todos os Pokémon do laboratório. Aquele Tropius ali é o Seu Cacho.'],
        ['prof', 'Eu estudo os Pokémon da região Alvorada… e o próprio alvorecer.'],
        ['prof', 'Há meses o sol nasce cada dia um pouquinho mais tarde sobre o Planalto dos Ventos. Um minuto aqui, dois ali. Ninguém sabe explicar.'],
        ['prof', 'E os Pokémon Alfa, aqueles maiores, de olhos vermelhos, nunca apareceram tanto. Antes era um por ano. Agora é um por semana.'],
        ['prof', 'Eu preciso de olhos jovens espalhados pela região. Pernas jovens também. As minhas reclamam da escada.'],
        ['prof', 'Por isso quero que você leve um destes Pokémon. Nos pedestais estão Bulbasaur, Charmander e Squirtle. Escolha com o coração!'],
      ],
      depois: { flags: { talkedProf: true }, objetivo: 'Escolha seu primeiro Pokémon nos pedestais' },
    },
    {
      id: 'teo_entra',
      local: 'lab_jatoba',
      gatilho: { tipo: 'apos', cena: 'lab_chegada' },
      falas: [
        ['teo', 'Chegueeei! Fala, {jogador}! O Professor também vai me dar um Pokémon.'],
        ['teo', 'Pode escolher primeiro, vai. Eu sou generoso. E esperto. Mais esperto do que generoso, na verdade.'],
        ['prof', 'Téo, você pisou no rabo do Seu Cacho.'],
        ['teo', 'Foi mal, Seu Cacho!'],
      ],
    },
    {
      id: 'escolha_bulbasaur',
      local: 'lab_jatoba',
      gatilho: { tipo: 'item', alvo: 'pedestal_1', semFlag: ['starter'] },
      falas: [
        ['prof', 'Bulbasaur, do tipo Planta! Calmo, resistente, e cresce tomando sol junto com você. Vai ser este?'],
      ],
      escolhas: [
        { texto: 'Vou com o Bulbasaur!', flags: { starter: 1, rivalStarter: 4 } },
        { texto: 'Deixa eu ver os outros.', falas: [['prof', 'Calma é uma virtude. Olhe à vontade!']] },
      ],
    },
    {
      id: 'escolha_charmander',
      local: 'lab_jatoba',
      gatilho: { tipo: 'item', alvo: 'pedestal_2', semFlag: ['starter'] },
      falas: [
        ['prof', 'Charmander, do tipo Fogo! A chama da cauda mostra o que ele sente. Cuide para ela nunca apagar. Vai ser este?'],
      ],
      escolhas: [
        { texto: 'Vou com o Charmander!', flags: { starter: 4, rivalStarter: 7 } },
        { texto: 'Deixa eu ver os outros.', falas: [['prof', 'Sem pressa. Ele não vai a lugar nenhum. Bom, não deveria.']] },
      ],
    },
    {
      id: 'escolha_squirtle',
      local: 'lab_jatoba',
      gatilho: { tipo: 'item', alvo: 'pedestal_3', semFlag: ['starter'] },
      falas: [
        ['prof', 'Squirtle, do tipo Água! Esconde-se no casco quando tem medo e responde com um jato certeiro. Vai ser este?'],
      ],
      escolhas: [
        { texto: 'Vou com o Squirtle!', flags: { starter: 7, rivalStarter: 1 } },
        { texto: 'Deixa eu ver os outros.', falas: [['prof', 'Claro, claro. Escolha com o coração. E com os olhos também.']] },
      ],
    },
    {
      id: 'inicial_escolhido',
      local: 'lab_jatoba',
      gatilho: { tipo: 'flag', alvo: 'starter' },
      falas: [
        ['narrador', '{jogador} recebeu {inicial}!'],
        ['inicial', '!!'],
        ['bia', 'Ele gostou de você! Olha a cara dele! Quer dar um apelido? Eu sugiro "Senhor Bolinha". Eu sempre sugiro "Senhor Bolinha".'],
        ['teo', 'Então eu fico com este aqui! O {rival_inicial} tem vantagem de tipo contra o seu. Azar o seu, vizinho!'],
        ['prof', 'Téo… isso não é bem "generoso".'],
        ['teo', 'Eu avisei que era mais esperto.'],
      ],
    },
    {
      id: 'rival_batalha',
      local: 'lab_jatoba',
      gatilho: { tipo: 'apos', cena: 'inicial_escolhido' },
      falas: [
        ['teo', 'Espera aí, {jogador}! Pokémon novo, treinador novo… vamos ver quem escolheu melhor!'],
        ['prof', 'Aqui dentro não! Os meus tubos de ensaio! Ah, tudo bem, só não acertem a estufa.'],
      ],
      depois: {
        batalha: {
          id: 'rival1', nome: 'Rival Téo', perder: 'continua', dinheiro: 0,
          equipe: [['rival:1', 5, ['tackle', 'growl']]],
        },
        flags: { rival1: true },
      },
    },
    {
      id: 'rival_ganhou_jogador',
      local: 'lab_jatoba',
      gatilho: { tipo: 'vencer', alvo: 'rival1' },
      falas: [
        ['teo', 'O quê?! Não acredito! Eu tinha vantagem de tipo! Eu li isso num livro!'],
        ['prof', 'Livro ensina tipo, Téo. Batalha ensina o resto.'],
        ['teo', 'Tá bom, tá bom. Foi sorte de principiante. Na próxima eu treino antes.'],
      ],
    },
    {
      id: 'rival_perdeu_jogador',
      local: 'lab_jatoba',
      gatilho: { tipo: 'perder', alvo: 'rival1' },
      falas: [
        ['teo', 'Isso aí! Meu {rival_inicial} é demais! Viu, Professor? Vantagem de tipo!'],
        ['prof', 'Vi sim. E vi o {inicial} do {jogador} se levantar três vezes. Isso também conta.'],
      ],
    },
    {
      id: 'presentes',
      local: 'lab_jatoba',
      gatilho: { tipo: 'apos', cena: 'rival_batalha' },
      falas: [
        ['prof', 'Muito bem, os dois! Deixem-me cuidar dos seus Pokémon. Pronto, novinhos em folha.'],
        ['prof', 'Leve também estas Poké Bolas e Poções. E esta Pokédex: ela registra cada Pokémon que você encontrar.'],
        ['bia', 'Eu programei ela! Se travar, é só dar um tapinha. Carinhoso. Um tapinha carinhoso.'],
        ['prof', 'Na batalha, enfraqueça o Pokémon selvagem e arremesse a Poké Bola. No mapa também dá: mire e arremesse.'],
        ['prof', 'Cada cidade de Alvorada tem um Ginásio. Pela tradição, os líderes guardam fragmentos de uma pedra antiga, a Pedra do Alvorecer.'],
        ['prof', 'O mais perto é o de Cidade Campina. Siga a trilha a oeste, pelos Campos de Lúmen. Boa sorte, {jogador}!'],
        ['teo', 'Eu vou na frente! A Insígnia Espiga vai ser minha primeiro. Até mais, lesma!'],
      ],
      depois: {
        flags: { balls: true, rivalGone: true },
        itens: [['pokeball', 5], ['potion', 3], ['pokedex', 1]],
        objetivo: 'Siga a trilha a oeste até a Cidade Campina',
      },
    },
    {
      id: 'mae_despedida',
      local: 'casa_jogador',
      gatilho: { tipo: 'falar', alvo: 'mae', requer: ['starter'], semFlag: ['campina'] },
      falas: [
        ['mae', 'Então esse é o seu {inicial}! Que coisinha mais linda. Vem cá, deixa a Dona Fofa dar uma olhada.'],
        ['narrador', 'A Audino da Mãe encosta a orelha no {inicial} e sorri. Seus Pokémon estão recuperados.'],
        ['mae', 'Sempre que precisar, volte para casa. A Dona Fofa cura, e eu faço sopa.'],
        ['mae', 'E me liga. Pelo menos quando ganhar alguma coisa. Ou quando perder. Liga sempre, tá?'],
      ],
    },
    {
      id: 'absol_cerca',
      local: 'vila_alvorada',
      gatilho: { tipo: 'pisar', alvo: 'saida_oeste', requer: ['balls'], semFlag: ['viuAbsol1'] },
      falas: [
        ['narrador', 'Em cima da cerca, no fim da vila, um Pokémon branco observa você. O chifre curvo brilha como uma foice de lua.'],
        ['absol', '…'],
        ['narrador', 'Um piscar de olhos, e ele não está mais lá.'],
        ['jogador', '(Era… um Absol?)'],
      ],
      depois: { flags: { viuAbsol1: true } },
    },
    {
      id: 'caio_avista',
      local: 'rota1',
      gatilho: { tipo: 'avistar', alvo: 'r1_caio' },
      falas: [['caio', 'Ei, você aí! Treinador novo na trilha? Dá pra ver pelo tênis limpinho. Vamos batalhar!']],
      depois: { batalha: { id: 'r1_caio', nome: 'Jovem Caio', dinheiro: 140, equipe: [[659, 3, ['tackle']], [396, 4, ['tackle', 'growl']]] } },
    },
    {
      id: 'caio_vencido',
      local: 'rota1',
      gatilho: { tipo: 'vencer', alvo: 'r1_caio' },
      falas: [
        ['caio', 'Puxa! Meu Bunnelby cavou, cavou… e não adiantou nada.'],
        ['caio', 'Dica de graça: no mato alto, chegue devagar. Pokémon assustado foge antes de você mirar.'],
      ],
    },
    {
      id: 'davi_avista',
      local: 'rota1',
      gatilho: { tipo: 'avistar', alvo: 'r1_davi' },
      falas: [['davi', 'Achei você no meu caminho! Meus insetos estão loucos para lutar! Eu também, mas eles são mais fortes.']],
      depois: { batalha: { id: 'r1_davi', nome: 'Caçador Davi', dinheiro: 160, equipe: [[13, 4, ['poisonSting', 'stringShot']], [664, 5, ['tackle', 'stringShot']]] } },
    },
    {
      id: 'davi_vencido',
      local: 'rota1',
      gatilho: { tipo: 'vencer', alvo: 'r1_davi' },
      falas: [
        ['davi', 'Meus pobres insetos… Vou treinar no Bosque Sussurrante.'],
        ['davi', 'Dizem que lá tem um ginásio só de inseto. Um dia eu vou ser líder de lá. Ou pelo menos o cara que limpa as teias.'],
      ],
    },
    {
      id: 'pedro_avista',
      local: 'rota1',
      gatilho: { tipo: 'avistar', alvo: 'r1_pedro' },
      falas: [['pedro', 'Você vai para Campina? Primeiro tem que passar por mim! Eu sou o porteiro não oficial da cidade!']],
      depois: { batalha: { id: 'r1_pedro', nome: 'Jovem Pedro', dinheiro: 180, equipe: [[915, 5, ['tackle', 'tailWhip']], [403, 6, ['tackle', 'leer']]] } },
    },
    {
      id: 'pedro_vencido',
      local: 'rota1',
      gatilho: { tipo: 'vencer', alvo: 'r1_pedro' },
      falas: [
        ['pedro', 'Que força! Você vai dar trabalho para o Tomé.'],
        ['pedro', 'Os Pokémon dele são do tipo Normal. Não têm fraqueza fácil… só Lutador. E paciência. Paciência funciona também.'],
      ],
    },
    {
      id: 'campina_chegada',
      local: 'cidade_campina',
      gatilho: { tipo: 'entrar', alvo: 'cidade_campina', semFlag: ['campina'] },
      falas: [
        ['narrador', 'Cidade Campina! O vento balança o trigo, o moinho range devagar e, no meio do milharal, se ergue a arena do Ginásio.'],
      ],
      depois: { flags: { campina: true } },
    },
    {
      id: 'teo_campina',
      local: 'cidade_campina',
      gatilho: { tipo: 'apos', cena: 'campina_chegada' },
      falas: [
        ['teo', '{jogador}! Chegou tarde: já ganhei a Insígnia Espiga! Olha ela aqui, brilhando. Brilha mais que o sol de hoje.'],
        ['teo', 'O Tomé usa Pokémon do tipo Normal. Eles batem firme, mas não têm truque. Só precisa aguentar.'],
        ['teo', 'Ah, e dentro do milharal tem uns fardos de feno. Empurra eles. Eu descobri isso depois de me perder por meia hora.'],
        ['teo', 'Vou para o norte. Ouvi falar de um Pokémon branco rondando o Bosque Sussurrante. Tchau, lesma!'],
      ],
      depois: { flags: { rivalCampina: true }, objetivo: 'Vença os aprendizes do Ginásio de Campina' },
    },
    {
      id: 'quinzinho',
      local: 'cidade_campina',
      gatilho: { tipo: 'falar', alvo: 'quinzinho' },
      repete: true,
      falas: [
        ['quinzinho', 'Milho cozido, milho assado, milho com manteiga! E fofoca de graça.'],
        ['quinzinho', 'Ontem à noite apareceram dois sujeitos de capa roxa perguntando pelo "fragmento do Tomé". Capa roxa, no calor que faz aqui! Gente estranha.'],
      ],
    },
    {
      id: 'joy_campina',
      local: 'centro_campina',
      gatilho: { tipo: 'falar', alvo: 'joy' },
      repete: true,
      falas: [['joy', 'Bem-vindo ao Centro Pokémon de Campina! Quer que eu cuide dos seus Pokémon?']],
      escolhas: [
        { texto: 'Sim, por favor.', falas: [['joy', 'Prontinho! Seus Pokémon estão recuperados. Volte sempre!']], flags: { curar: true } },
        { texto: 'Agora não.', falas: [['joy', 'Tudo bem. Estaremos aqui quando precisar!']] },
      ],
    },
    {
      id: 'icaro_avista',
      local: 'arena_campina',
      gatilho: { tipo: 'avistar', alvo: 'g1_icaro' },
      falas: [['icaro', 'Bem-vindo ao Ginásio de Campina! Para chegar ao mestre Tomé, vai ter que passar pelos aprendizes. E pelo milharal. Mais pelo milharal.']],
      depois: { batalha: { id: 'g1_icaro', nome: 'Aprendiz Ícaro', dinheiro: 260, equipe: [[915, 7, ['tackle', 'tailWhip']], [427, 8, ['pound', 'defenseCurl']]] } },
    },
    {
      id: 'icaro_vencido',
      local: 'arena_campina',
      gatilho: { tipo: 'vencer', alvo: 'g1_icaro' },
      falas: [
        ['icaro', 'Você passou por mim… e a primeira porteira abriu. Mas o Rui é mais casca-grossa!'],
        ['icaro', 'Aqui a batalha é em tempo real. Quando o golpe vier, esquiva! Não é feio fugir de um golpe. Feio é levar.'],
      ],
    },
    {
      id: 'rui_avista',
      local: 'arena_campina',
      gatilho: { tipo: 'avistar', alvo: 'g1_rui' },
      falas: [['rui', 'Alto lá! O mestre Tomé só recebe quem mostra garra! E quem não pisou na plantação dele.']],
      depois: { batalha: { id: 'g1_rui', nome: 'Aprendiz Rui', dinheiro: 300, equipe: [[396, 8, ['tackle', 'quickAttack']], [52, 9, ['scratch', 'bite']]] } },
    },
    {
      id: 'rui_vencido',
      local: 'arena_campina',
      gatilho: { tipo: 'vencer', alvo: 'g1_rui' },
      falas: [
        ['rui', 'Tá bom, tá bom! Pode passar. A última porteira está aberta. O mestre está no fundo da quadra.'],
        ['rui', 'O Teddiursa dele arranha forte. Fique de olho no HP. E no chapéu dele, que voa quando ele se empolga.'],
      ],
      depois: { objetivo: 'Desafie o Líder Tomé no fundo da quadra' },
    },
    {
      id: 'tome_trancado',
      local: 'arena_campina',
      gatilho: { tipo: 'falar', alvo: 'tome', semFlag: ['trainers.g1_icaro', 'trainers.g1_rui'] },
      repete: true,
      falas: [
        ['tome', 'Opa, calma lá! Antes de falar comigo, vença os meus dois aprendizes.'],
        ['tome', 'Quem pula etapa colhe o trigo verde.'],
      ],
    },
    {
      id: 'tome_desafio',
      local: 'arena_campina',
      gatilho: { tipo: 'falar', alvo: 'tome', requer: ['trainers.g1_icaro', 'trainers.g1_rui'], semFlag: ['badges.campina'] },
      falas: [
        ['tome', 'Então você é o novo treinador que o Jatobá mandou! Eu sou Tomé, Líder do Ginásio de Campina.'],
        ['tome', 'Aqui a gente planta, colhe e batalha com Pokémon do tipo Normal. Simples, mas firme como raiz de ipê.'],
        ['tome', 'O Téo passou por aqui como um vendaval. Ganhou, mas deixou metade do milharal deitado. Vamos ver como você colhe.'],
        ['tome', 'Mostre o que você tem! Valendo a Insígnia Espiga!'],
      ],
      depois: {
        arena: 'centro_quadra',
        batalha: {
          id: 'leader_tome', nome: 'Líder Tomé', dinheiro: 1200, perder: 'centro',
          equipe: [
            [659, 9, ['tackle', 'mudSlap', 'quickAttack']],
            [915, 10, ['tackle', 'tailWhip', 'takeDown']],
            [216, 12, ['scratch', 'leer', 'furySwipes', 'lick']],
          ],
        },
      },
    },
    {
      id: 'tome_perdeu_jogador',
      local: 'arena_campina',
      gatilho: { tipo: 'perder', alvo: 'leader_tome' },
      falas: [['tome', 'Ainda não está maduro, mas a semente é boa. Descanse e volte quando quiser. A porteira fica aberta.']],
    },
    {
      id: 'tome_vencido',
      local: 'arena_campina',
      gatilho: { tipo: 'vencer', alvo: 'leader_tome' },
      falas: [
        ['tome', 'Ha! Que colheita! Você venceu de forma justa, como chuva no tempo certo.'],
        ['tome', 'Leve a Insígnia Espiga. Ela foi lapidada de uma lasca da Pedra do Alvorecer, como manda a tradição da região.'],
        ['narrador', '{jogador} recebeu a Insígnia Espiga!'],
        ['tome', 'E leve esta MT também. Ataque Rápido: para quem precisa chegar antes do problema.'],
      ],
      depois: {
        insignia: 'campina', mt: 'quickAttack',
        itens: [['potion', 3], ['pokeball', 5]],
        flags: { 'badges.campina': true },
      },
    },
    {
      id: 'tome_fragmento',
      local: 'arena_campina',
      gatilho: { tipo: 'apos', cena: 'tome_vencido' },
      falas: [
        ['tome', 'Cada ginásio de Alvorada guarda um Fragmento do Alvorecer. Os oito juntos, dizem, acendem o Relógio de Pedra lá no Planalto.'],
        ['tome', 'O meu fica aqui, numa caixinha de madeira debaixo da arquibancada. Não conta pra ninguém. Bom, agora você sabe. E o Quinzinho, que sabe de tudo.'],
        ['tome', 'Ultimamente o sol tem nascido tarde. E uns sujeitos de capa escura andaram perguntando da minha pedra. Fique de olho, viu?'],
      ],
    },
    {
      id: 'ligacao_prof',
      local: 'cidade_campina',
      gatilho: { tipo: 'apos', cena: 'tome_fragmento' },
      falas: [
        ['pokedex', 'Bzzz… bzzz…'],
        ['prof', '{jogador}? Aqui é o Jatobá! O Tomé me ligou contando da sua vitória. Parabéns! A Bia está dançando no laboratório.'],
        ['bia', '(ao fundo) Senhor Bolinhaaa!'],
        ['prof', 'Escute: hoje o sol nasceu onze minutos atrasado. Ontem foram dez.'],
        ['prof', 'E viram um Absol branco feito neblina na borda do Bosque Sussurrante. Dizem que Absol só aparece antes de alguma coisa ruim…'],
        ['jogador', '(O mesmo da cerca?)'],
        ['prof', 'Quando puder, siga para o norte, até a Vila Sussurro. A Líder Lia sabe tudo do bosque. Passe na fazenda do Tomé antes, que ele tem um presente.'],
        ['narrador', 'Fim do Capítulo 1'],
      ],
      depois: {
        flags: { ch1Done: true, chapter: 2 },
        objetivo: 'Vá à Fazenda do Tomé, ao norte de Campina',
        fimCapitulo: true,
      },
    },
    {
      id: 'mae_insignia',
      local: 'casa_jogador',
      gatilho: { tipo: 'falar', alvo: 'mae', requer: ['badges.campina'], semFlag: ['momBadge'] },
      falas: [
        ['mae', '{jogador}! A vizinhança inteira já sabe da sua insígnia. Eu falei na rádio. Duas vezes. Três, se contar a reprise.'],
        ['mae', 'Estou tão orgulhosa. Agora descansa. A jornada é longa.'],
      ],
      depois: { flags: { momBadge: true } },
    },
    {
      id: 'prof_insignia',
      local: 'lab_jatoba',
      gatilho: { tipo: 'falar', alvo: 'prof', requer: ['badges.campina'], semFlag: ['profBadge'] },
      falas: [
        ['prof', '{jogador}! A Insígnia Espiga! Sabia que podia contar com você.'],
        ['prof', 'Os próximos ginásios ficam ao norte, no Bosque Sussurrante, e a leste, no Lago Espelho. A ponte do leste ainda está quebrada, então comece pelo norte.'],
      ],
      depois: { flags: { profBadge: true } },
    },
  ],
};
