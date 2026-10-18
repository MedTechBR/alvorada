# ================================================================ MISSÕES, NPCs VIVOS E ITENS (src/story/missoes/regiao-sertao.js)
ITENS = {
    'fossil_ambar': {'name': 'Fóssil Âmbar', 'desc': 'Um pedaço de âmbar com uma sombra de asa dentro. Dr. Ícaro, em Cidade Buriti, devolve a vida a ele.', 'color': '#c88a30'},
    'fossil_garra': {'name': 'Fóssil Garra', 'desc': 'Uma garra de pedra, cheia de riscos. Dr. Ícaro, em Cidade Buriti, devolve a vida a ele.', 'color': '#8a6a4a'},
    'anel_dourado': {'name': 'Anel Dourado', 'desc': 'Um dos seis anéis perdidos da Rainha do Bazar. Brilha mesmo debaixo de areia.', 'color': '#e0b030'},
    'carga_buriti': {'name': 'Carga de Buriti', 'desc': 'Um fardo da Casa da Caravana, amarrado com corda de buriti. Tem destinatário.', 'color': '#a8783a'},
    'mapa_dunas': {'name': 'Mapa das Dunas', 'desc': 'O mapa do Bento Duna: marca onde a areia segura e onde ela engole. Um X vermelho na Cratera da Estrela.', 'color': '#c8a060'},
    'tabua_mare': {'name': 'Tábua de Maré', 'desc': 'A tábua de maré de Dona Maré: mostra quando a maré baixa e quais baús aparecem no mangue.', 'color': '#4a8aa8'},
}

M = []
def missao(**kw): M.append(kw)

# ---------------- Vila Mandacaru
missao(id='sq_tepig', titulo='As cabras do Seu Brasa', regiao='Vila Mandacaru', de='seu_brasa',
    resumo='Cinco Skiddo fugiram do cercado para a caatinga. Trazer de volta antes do sol a pino.',
    oferta=['Fujiram cinco Skiddo! Passaram por baixo da cerca de vara, as desgraçadas.', 'Procura as bichas na caatinga, de manhã cedinho. Quando o sol vai a pino, elas se escondem na sombra e ninguém acha.'],
    lembrete=['Cinco cabras, antes do sol a pino. De manhã elas ainda andam; depois, só sombra.'],
    etapas=[
        {'tipo': 'achar', 'se': {'hora': 'manha'}, 'pontos': [[660, 227], [701, 252], [832, 226], [884, 238], [930, 254]], 'achou': 'Uma cabrinha Skiddo! Ela te segue e volta sozinha para o cercado.', 'texto': 'Ache as 5 cabras na Rota 14 e na Rota 20 (de manhã)', 'rotulo': 'Cabras'},
        {'tipo': 'falar', 'npc': 'seu_brasa', 'texto': 'Volte ao Seu Brasa', 'falas': ['Todas de volta! Você tem tino para o sertão, moleque.', 'Toma. Um fogoso para você, que está pedindo calor. Cuide dele bem.']},
    ],
    recompensa={'pokemon': {'dex': 498, 'nivel': 15, 'golpes': ['tackle', 'tailWhip', 'ember', 'odorSleuth'], 'apelido': 'Brasinha'}, 'itens': [['charcoal', 1]]})
missao(id='sq_cacimba', titulo='Água na cacimba', regiao='Vila Mandacaru', de='dona_socorro',
    resumo='A cisterna da Dona Socorro secou. Achar o veio de água no Lajedo com um Pokémon que cave.',
    oferta=['Minha cisterna secou. Faz três dias.', 'Dizem que no Lajedo, onde a pedra fica lisa, tem um veio de água. Mas só um bicho que cava acha. Você me ajuda?'],
    lembrete=['O veio fica no Lajedo, na pedra lisa. Leve um Pokémon que cave.'],
    etapas=[
        {'tipo': 'achar', 'pontos': [[925, 216]], 'achou': 'A pedra está úmida aqui. O seu Pokémon cavou um pouco e a água brotou! É o veio.', 'texto': 'Ache o veio de água no Lajedo (Rota 20), cavando', 'dica': {'lugar': 'sertao_veio_dagua'}, 'rotulo': 'Veio'},
        {'tipo': 'falar', 'npc': 'dona_socorro', 'texto': 'Conte à Dona Socorro', 'falas': ['Água! Água na cacimba! Que Deus te dê o dobro, menino.', 'Leve isto. É o que eu tenho de mais valioso: o jeito de cavar do meu marido.']},
    ],
    recompensa={'mt': 'dig', 'itens': [['freshWater', 6]]})
missao(id='sq_forro', titulo='O trio do forró', regiao='Vila Mandacaru', de='forro_sanfona', requer={'insignias': 3},
    resumo='Vencer a sanfona, a zabumba e o triângulo numa batalha tripla em sequência.',
    oferta=['A gente toca em trio. E briga em trio também!', 'Ganhe de cada um de nós, um depois do outro. Ganhando dos três, a gente toca um xote só para você.'],
    lembrete=['Os três: eu, o Dedé e a Nenê. Um depois do outro.'],
    etapas=[
        {'tipo': 'vencer', 'npc': 'forro_sanfona', 'texto': 'Vença o Sanfoneiro Zé de Nô', 'agora': True, 'perguntar': False, 'falas': ['Vai, sanfona!'], 'vitoria': ['Perdi o compasso. Vai lá no Dedé!'],
         'batalha': {'id': 'sq_forro_1', 'nome': 'Sanfoneiro Zé de Nô', 'equipe': [[323, 40, ['eruption', 'earthPower', 'lavaPlume', 'flamethrower']], [136, 40, ['flamethrower', 'bite', 'quickAttack', 'fireFang']]]}},
        {'tipo': 'vencer', 'npc': 'forro_zabumba', 'texto': 'Vença o Zabumbeiro Dedé', 'falas': ['Zabumba é coração batendo!'], 'vitoria': ['Perdi! A Nenê vai te dar trabalho.'],
         'batalha': {'id': 'sq_forro_2', 'nome': 'Zabumbeiro Dedé', 'equipe': [[128, 41, ['hornAttack', 'bodySlam', 'earthquake', 'rage']], [241, 41, ['stomp', 'bodySlam', 'milkDrink', 'rollout']]]}},
        {'tipo': 'vencer', 'npc': 'forro_triangulo', 'texto': 'Vença a Triangueira Nenê', 'falas': ['O triângulo é pequeno, mas o compasso é meu!'], 'vitoria': ['Perdi! Que xote lindo a gente vai tocar.'],
         'batalha': {'id': 'sq_forro_3', 'nome': 'Triangueira Nenê', 'equipe': [[323, 42, ['lavaPlume', 'earthPower', 'rockSlide', 'ember']], [850, 41, ['flamethrower', 'bugBuzz', 'poisonFang', 'crunch']], [324, 42, ['flamethrower', 'earthPower', 'rockSlide', 'ember']]]}},
    ],
    conclusao=['O trio toca um xote só para você. Até o mandacaru balança.'],
    recompensa={'dinheiro': 6000, 'itens': [['metronome', 1]]})
missao(id='sq_tutor_brasa', titulo='Sol a pino', regiao='Vila Mandacaru', de='seu_brasa', requer={'insignias': 2},
    resumo='Seu Brasa ensina Onda de Calor e Lança-Chamas a quem mostrar um Pokémon de Fogo de nível 40 ou mais.',
    oferta=['Eu ensino Onda de Calor e Lança-Chamas. Mas só a quem mostrar fogo de verdade.', 'Um Pokémon de Fogo, nível 40 ou mais. Tem?'],
    lembrete=['Um Pokémon de Fogo, nível 40 ou mais. Quando tiver, mostre.'],
    etapas=[{'tipo': 'mostrar', 'npc': 'seu_brasa', 'tipoPokemon': 'fire', 'nivelMin': 40, 'texto': 'Mostre ao Seu Brasa um Pokémon de Fogo de nível 40 ou mais', 'falta': ['Esse aí ainda é novo. Volte quando tiver mais calor.'], 'falas': ['Isso! Esse aí tem sol por dentro. Pode usar a minha cozinha para aprender.']}],
    recompensa={'flags': {'tutor_brasa_liberado': True}, 'texto': 'Seu Brasa passa a ensinar Onda de Calor e Lança-Chamas'})
missao(id='sq_quermesse', titulo='Quermesse de São João', regiao='Vila Mandacaru', de='padre_pedro', diaria=True,
    resumo='Na festa, as barracas dão um prêmio por dia: frutas, bolas e, de vez em quando, um Doce Raro.',
    oferta=['Todo dia tem prêmio na quermesse! Pesca de peixinho, argola, tiro ao alvo.', 'Quer tentar a sorte? É de graça, só pede para rezar um pouquinho.'],
    ofertaRepetida=['Voltou! Quer tentar a sorte de novo? A barraca de hoje tem coisa boa.'],
    etapas=[{'tipo': 'falar', 'npc': 'padre_pedro', 'texto': 'Tente a sorte nas barracas da quermesse', 'falas': ['O padre sorri: "As barracas são todas do povo. Pegue o seu prêmio."']}],
    recompensa={'itens': [['oranBerry', 3], ['pokeBall', 5], ['greatBall', 2]]}, recompensaRepetida={'itens': [['sitrusBerry', 2], ['greatBall', 3], ['rareCandy', 1]]})
# ---------------- Cidade Buriti
for (mid, it, dex, nome, txt) in [('sq_reviver_ambar', 'fossil_ambar', 142, 'Aerodactyl', 'Fóssil Âmbar'), ('sq_reviver_garra', 'fossil_garra', 347, 'Anorith', 'Fóssil Garra')]:
    missao(id=mid, titulo='De volta à vida: ' + txt, regiao='Cidade Buriti', de='dr_icaro', repetivel=True,
        resumo='Entregue um %s ao Dr. Ícaro para reviver um %s.' % (txt, nome),
        oferta=['Um %s? Ora, ora, ora. Deixe comigo! A máquina leva uma hora do relógio do jogo, mas o resultado vale a pena.' % txt],
        ofertaRepetida=['Outro fóssil? A máquina aguenta, eu aguento. Traga!'],
        lembrete=['Traga o %s e a máquina faz o resto.' % txt],
        etapas=[{'tipo': 'entregar', 'npc': 'dr_icaro', 'item': it, 'n': 1, 'texto': 'Leve o %s ao Dr. Ícaro, no Laboratório de Fósseis' % txt, 'pergunta': ['O fóssil está aí? Vamos pôr a máquina para rodar!'], 'falta': ['Cadê o fóssil? Eu só revivo o que está na minha mão.'], 'falas': ['Pronto! A máquina zumbiu uma hora e… olha ele aí! Está vivo!']}],
        recompensa={'pokemon': {'dex': dex, 'nivel': 25, 'apelido': nome}})
missao(id='sq_caravana', titulo='A caravana das dunas', regiao='Cidade Buriti', de='bento_duna', requer={'insignias': 3},
    resumo='Levar três cargas de Buriti a Vila Mandacaru, Vila Siri e Vila Termas.',
    oferta=['A caravana está parada: o Camerupt quebrou o casco, o outro tropeçou. Tenho três cargas para entregar.', 'Mandacaru, Vila Siri e Vila Termas, lá nas Brasas. Você leva? Em troca, o mapa das dunas e uma areia fina de presente.'],
    lembrete=['Três cargas: Mandacaru (Zé Preá), Vila Siri (Dona Maré) e Vila Termas, nas Brasas.'],
    itensIniciais=[['carga_buriti', 3]],
    etapas=[
        {'tipo': 'falar', 'npc': 'ze_prea', 'texto': 'Entregue a primeira carga ao Zé Preá, em Vila Mandacaru', 'falas': ['Ah, a carga de Buriti! Deixa que eu pago a gorjeta e guardo o fardo.']},
        {'tipo': 'falar', 'npc': 'dona_mare', 'texto': 'Entregue a segunda carga à Dona Maré, em Vila Siri', 'falas': ['Os cestos chegaram! Dá para encher de caranguejo.']},
        {'tipo': 'chegar', 'lugar': 'vila_termas', 'texto': 'Leve a terceira carga a Vila Termas, nas Brasas (Barco das Brasas, em Vila Siri)', 'falas': ['A terceira carga chega ao destinatário nas Termas, entre o vapor e as lanternas.']},
        {'tipo': 'falar', 'npc': 'bento_duna', 'texto': 'Volte ao Bento Duna', 'falas': ['Três cargas entregues! A caravana está de pé outra vez.', 'Tome o mapa. Tem um X vermelho na Cratera da Estrela. Não pergunte, que eu não sei o que tem lá.']},
    ],
    recompensa={'itens': [['softSand', 1], ['mapa_dunas', 1]]})
missao(id='sq_hoopa', titulo='O anel da rainha', regiao='Cidade Buriti', de='zuleica', requer={'insignias': 5},
    resumo='Zuleica perdeu seis anéis no deserto; com todos, o espelho da tenda se abre.',
    oferta=['Perdi seis anéis no deserto. Seis! Anéis dourados, daqueles que brilham até debaixo de areia.', 'Meu espelho só abre com os seis. Quando abrir, uma coisinha muito antiga vai querer sair. E eu quero que saia com você.'],
    lembrete=['Seis anéis dourados, perdidos nas Dunas Douradas. A areia os esconde, mas eles brilham.'],
    etapas=[
        {'tipo': 'achar', 'item': 'anel_dourado', 'escondido': True, 'pontos': [[880, 320], [1040, 310], [1030, 365], [930, 382], [875, 350], [990, 304]], 'dica': {'lugar': 'dunas_douradas'}, 'achou': 'Um brilho dourado debaixo da areia: um anel!', 'texto': 'Ache os 6 anéis dourados nas Dunas Douradas', 'rotulo': 'Anéis'},
        {'tipo': 'entregar', 'npc': 'zuleica', 'item': 'anel_dourado', 'n': 6, 'texto': 'Entregue os 6 anéis à Rainha do Bazar', 'pergunta': ['Trouxe os seis?'], 'falta': ['Ainda faltam anéis. Seis, querido, seis.'], 'falas': ['Seis anéis! O espelho acende, acende… e abre.', 'Pronto: uma coisinha antiga de um bolso dobrado do mundo. Cuide dele como se fosse uma jóia.']},
    ],
    recompensa={'pokemon': {'dex': 720, 'nivel': 50, 'apelido': 'Hoopa'}, 'texto': 'Hoopa, preso no espelho da tenda'})
missao(id='sq_tempestade', titulo='Campeão da areia', regiao='Cidade Buriti', de='mestre_areia', requer={'insignias': 4},
    resumo='Vencer 5 batalhas seguidas na Arena de Areia.',
    oferta=['Todo dia, às três da tarde, a tempestade de areia entra no salão. E os adversários também.', 'Cinco batalhas seguidas, sem curar entre elas. É o título de campeão da areia. Topa?'],
    lembrete=['Cinco vitórias seguidas, sem curar. A tempestade só ajuda quem ela quer.'],
    etapas=[
        {'tipo': 'vencer', 'npc': 'mestre_areia', 'texto': 'Arena de Areia: 1ª batalha (Rodrigo, o Cavador)', 'agora': True, 'perguntar': False, 'falas': ['Primeira! A tempestade começou!'], 'vitoria': ['Passou. Segunda!'], 'batalha': {'id': 'sq_arena_1', 'nome': 'Rodrigo, o Cavador', 'equipe': [[28, 42, ['dig', 'slash', 'sandstorm', 'earthquake']], [330, 43, ['dragonBreath', 'earthquake', 'aerialAce', 'dragonClaw']]]}},
        {'tipo': 'vencer', 'npc': 'mestre_areia', 'texto': 'Arena de Areia: 2ª batalha (Selma, a Venenosa)', 'agora': True, 'perguntar': False, 'falas': ['Segunda! Não cure!'], 'vitoria': ['Passou de novo. Terceira!'], 'batalha': {'id': 'sq_arena_2', 'nome': 'Selma, a Venenosa', 'equipe': [[336, 43, ['poisonFang', 'crunch', 'glare', 'sludgeBomb']], [452, 44, ['crossPoison', 'crunch', 'toxicSpikes', 'poisonJab']]]}},
        {'tipo': 'vencer', 'npc': 'mestre_areia', 'texto': 'Arena de Areia: 3ª batalha (Hugo, o Pedreiro)', 'agora': True, 'perguntar': False, 'falas': ['Terceira! A areia aperta!'], 'vitoria': ['Passou. Quarta!'], 'batalha': {'id': 'sq_arena_3', 'nome': 'Hugo, o Pedreiro', 'equipe': [[112, 44, ['earthquake', 'stoneEdge', 'hornAttack', 'rockBlast']], [75, 43, ['rockSlide', 'earthquake', 'stoneEdge', 'explosion']], [526, 45, ['stoneEdge', 'earthquake', 'rockSlide', 'ironHead']]]}},
        {'tipo': 'vencer', 'npc': 'mestre_areia', 'texto': 'Arena de Areia: 4ª batalha (Aisha, a Dançarina)', 'agora': True, 'perguntar': False, 'falas': ['Quarta! Aguenta o rojão!'], 'vitoria': ['Passou. Última!'], 'batalha': {'id': 'sq_arena_4', 'nome': 'Aisha, a Dançarina', 'equipe': [[330, 44, ['dragonBreath', 'earthquake', 'aerialAce', 'dragonClaw']], [337, 44, ['psychic', 'earthPower', 'shadowBall', 'rockSlide']], [338, 44, ['flamethrower', 'psychic', 'earthPower', 'shadowBall']]]}},
        {'tipo': 'vencer', 'npc': 'mestre_areia', 'texto': 'Arena de Areia: batalha final (Haroldo, o Mestre)', 'agora': True, 'perguntar': False, 'falas': ['A última, e comigo! Eu sou o próprio vento!'], 'vitoria': ['Campeão da areia!'], 'batalha': {'id': 'sq_arena_5', 'nome': 'Mestre da Arena Haroldo', 'equipe': [[330, 46, ['dragonClaw', 'earthquake', 'aerialAce', 'dragonDance']], [553, 46, ['crunch', 'earthquake', 'dragonClaw', 'sandstorm']], [450, 46, ['earthquake', 'crunch', 'ironHead', 'sandstorm']], [248, 47, ['crunch', 'stoneEdge', 'earthquake', 'sandstorm']]]}},
    ],
    conclusao=['A tempestade de areia perde a graça. O salão aplaude.'],
    recompensa={'itens': [['smoothRock', 1], ['garchompite', 1]], 'dinheiro': 5000})
# ---------------- Vila Siri
missao(id='sq_caranguejo', titulo='O maior caranguejo', regiao='Vila Siri', de='dona_mare', requer={'insignias': 3},
    resumo='Mostrar um Kingler (#99) acima do nível 40 ou um Crabominable.',
    oferta=['Eu já vi muito caranguejo. Mas Kingler grande, de verdade, só vi dois.', 'Me mostra um Kingler acima do nível 40, ou um Crabominable. Eu pago com o que tenho.'],
    lembrete=['Um Kingler acima do nível 40 (ou um Crabominable).'],
    etapas=[{'tipo': 'mostrar', 'npc': 'dona_mare', 'especie': [99, 740], 'nivelMin': 40, 'texto': 'Mostre à Dona Maré um Kingler acima do nível 40 (ou um Crabominable)', 'falta': ['Esse é pequeno. Volta com um maior.'], 'falas': ['Que garra! Esse caranguejo é rei do mangue.', 'Leve isto, e a receita da garra.']}],
    recompensa={'itens': [['kingsRock', 1]], 'mt': 'crabhammer'})
missao(id='sq_mare', titulo='Hora da maré', regiao='Vila Siri', de='dona_mare',
    resumo='Com a tábua de maré, achar 4 baús que só aparecem na maré baixa do Mangue.',
    oferta=['Com a maré baixa, aparecem uns baús de gente que naufragou aqui séculos atrás.', 'Pegue minha tábua de maré e ache os quatro. O que tiver dentro é seu, e eu só quero ver o que as águas me devem.'],
    lembrete=['Quatro baús no mangue, na maré baixa.'],
    itensIniciais=[['tabua_mare', 1]],
    etapas=[{'tipo': 'achar', 'pontos': [[626, 408], [704, 424], [770, 436], [800, 420]], 'achou': 'Um baú de ferro e cracas, saído da lama!', 'texto': 'Ache os 4 baús do mangue (maré baixa)', 'dica': {'lugar': 'mangue_siri'}, 'rotulo': 'Baús'},
            {'tipo': 'falar', 'npc': 'dona_mare', 'texto': 'Conte à Dona Maré', 'falas': ['As águas me devem menos agora. Leve estas pérolas de lembrança.']}],
    recompensa={'itens': [['bigPearl', 2], ['dampRock', 1]]})
missao(id='sq_seismitoad', titulo='O sapo do lamaçal', regiao='Vila Siri', de='mestre_iraci', requer={'insignias': 3},
    resumo='Um Seismitoad Alfa afunda as canoas. Vencê-lo no meio do mangue.',
    oferta=['Um Seismitoad Alfa afunda minhas canoas. Sai da lama e vira tudo.', 'Está no meio do mangue. Dá para vencer ou até capturar. Mas é bruto, viu?'],
    lembrete=['O Seismitoad Alfa está no meio do mangue, na lama.'],
    etapas=[{'tipo': 'vencer', 'texto': 'Vença (ou capture) o Seismitoad Alfa, no meio do Mangue do Siri', 'alfa': {'dex': 537, 'nivel': 38, 'x': 758, 'y': 443, 'golpes': ['mudShot', 'earthquake', 'hydroPump', 'bulldoze'], 'aviso': 'Um Seismitoad Alfa sai da lama!'}, 'dica': {'lugar': 'mangue_siri'}}],
    conclusao=['As canoas voltam a boiar em paz.'], recompensa={'dinheiro': 3000, 'itens': [['mysticWater', 1], ['superPotion', 3]]})
missao(id='sq_canoa', titulo='Remar até o farol', regiao='Vila Siri', de='mestre_iraci', requer={'insignias': 4},
    resumo='Corrida de canoa (Nadar) até a Ilha do Sol Nascente e de volta.',
    oferta=['Quer uma corrida de canoa? É até o farol da Ilha do Sol Nascente e de volta.', 'Precisa de fôlego e de um Pokémon que nade. Dá para vencer o meu tempo?'],
    lembrete=['Ilha do Sol Nascente e de volta a Vila Siri, nadando.'],
    etapas=[{'tipo': 'chegar', 'area': 'Ilha do Sol Nascente', 'texto': 'Nade até a Ilha do Sol Nascente', 'falas': ['Chegou ao farol! Agora é voltar.']},
            {'tipo': 'chegar', 'lugar': 'vila_siri', 'texto': 'Volte nadando a Vila Siri', 'falas': ['Você voltou! O Iraci vai ficar de queixo caído.']},
            {'tipo': 'falar', 'npc': 'mestre_iraci', 'texto': 'Conte ao Mestre Iraci', 'falas': ['Ninguém voltou tão rápido desde a minha juventude!']}],
    recompensa={'dinheiro': 4000, 'itens': [['mysticWater', 1]]})
# ---------------- Ruínas de Pedra Pintada
missao(id='sq_alfa_galeria', titulo='O guardião da Galeria', regiao='Ruínas de Pedra Pintada', de='ruinas_heitor', requer={'insignias': 4},
    resumo='Um Krookodile Alfa vigia a Galeria da Areia, no segundo andar das Ruínas de Pedra Pintada.',
    oferta=['Eu entrei na Galeria da Areia uma vez. Vi um Krookodile Alfa, deitado como um crocodilo de pedra.', 'Dá para vencê-lo, se você chegar até a câmara dele. Dois blocos pesados e duas placas é o segredo da porta.'],
    lembrete=['Galeria da Areia, segundo andar. A porta pesa nas duas placas.'],
    etapas=[{'tipo': 'vencer', 'texto': 'Vença o Krookodile Alfa na Galeria da Areia (segundo andar das ruínas)', 'alfa': {'dex': 553, 'nivel': 53, 'sala': 'ruinas_pintada_2', 'x': 32, 'y': 6, 'golpes': ['crunch', 'earthquake', 'outrage', 'sandstorm'], 'aviso': 'Um Krookodile Alfa levanta da areia!'}, 'dica': {'lugar': 'ruinas_pintada_2'}}],
    conclusao=['A areia silencia. O corredor para a Câmara do Sol está livre.'], recompensa={'dinheiro': 6000, 'itens': [['ultraBall', 5], ['hyperPotion', 3]]})
missao(id='sq_regirock', titulo='O guardião de pedra', regiao='Ruínas de Pedra Pintada', de='ruinas_nalu', requer={'missoes': ['sq_alfa_galeria']},
    resumo='Acender os quatro braseiros da Câmara do Sol e acordar o guardião de pedra, Regirock.',
    oferta=['A inscrição manda acender os quatro cantos. Um fogo em cada braseiro, antes que o primeiro apague.', 'Quando a porta abrir, o guardião acorda. Preparado?'],
    lembrete=['Quatro braseiros, quatro fogos, antes que o primeiro apague.'],
    etapas=[{'tipo': 'chegar', 'lugar': 'regirock_camara', 'r': 3, 'texto': 'Acenda os 4 braseiros e entre no santuário da Câmara do Sol'},
            {'tipo': 'vencer', 'texto': 'Enfrente o Regirock, o guardião do santuário', 'alfa': {'dex': 377, 'nivel': 60, 'sala': 'ruinas_pintada_3', 'x': 13, 'y': 2, 'golpes': ['stoneEdge', 'earthquake', 'ironHead', 'rockSlide'], 'aviso': 'As pedras se erguem e formam o Regirock!'}}],
    conclusao=['As pedras se apaziguam. A câmara guarda o silêncio de novo.'], recompensa={'dinheiro': 8000, 'itens': [['rareCandy', 3], ['stardust', 3]]})

# ---------------- Desafios dos treinadores das rotas (um por treinador: ele desafia na conversa)
for t in TREINADORES:
    missao(id='sq_tr_' + t['id'], titulo='Desafio: ' + t['nome'], regiao=t['area'], de=t['id'], resumo='%s desafia quem passa por %s.' % (t['nome'], t['area']),
        oferta=t['desafio'], lembrete=t['desafio'],
        etapas=[{'tipo': 'vencer', 'npc': t['id'], 'texto': 'Vença %s (%s)' % (t['nome'], t['area']), 'agora': True, 'perguntar': False, 'falas': t['desafio'][-1:], 'vitoria': t['vitoria'],
                 'batalha': {'id': 'sq_tr_' + t['id'], 'nome': t['nome'], 'equipe': t['equipe']}}],
        recompensa={'dinheiro': t['dinheiro']})

NPCS = {
    'seu_brasa': {'tutor': {'requer': {'missoes': ['sq_tutor_brasa']}, 'golpes': [{'golpe': 'heatWave', 'dinheiro': 500}, {'golpe': 'flamethrower', 'dinheiro': 500}],
                            'falas': {'ola': ['Fogo é com a gente. Qual golpe você quer?'], 'tchau': ['Que o sol esteja a pino pra você.']}},
                  'falas': [{'se': {'missoes': ['sq_tepig']}, 'linhas': ['O Tepig que você trouxe? Cuide dele. Ele ainda é novo, mas o fogo vem.']}]},
    'ze_prea': {'falas': [{'se': {'missoes': ['sq_caravana']}, 'linhas': ['A carga de Buriti já está na prateleira. Rapadura nova!']}]},
    'dona_socorro': {'falas': [{'se': {'missoes': ['sq_cacimba']}, 'linhas': ['A cisterna está cheia até a boca. Bendita seja a água!']}]},
    'padre_pedro': {'diario': {'sorteio': [['oranBerry', 3], ['pokeBall', 5], ['greatBall', 2], ['sitrusBerry', 2]], 'falas': ['O padre sorri: "Tem prêmio na barraca hoje."'], 'depois': ['Volte amanhã: a quermesse tem prêmio todos os dias.']}},
    'zuleica': {'falas': [{'se': {'missoes': ['sq_hoopa']}, 'linhas': ['O espelho agora só mostra o que eu quero. Que alívio.']}]},
    'kiana': {'troca': {'quer': {'especie': 27, 'nome': 'um Sandshrew'}, 'da': {'dex': 27, 'forma': 'alola', 'nivel': 30, 'apelido': 'Alolinha'}, 'repetivel': False,
                        'falas': {'pede': ['Eu troco um Sandshrew de Alola por um Sandshrew daqui. Quer?'], 'aceita': ['Perfeito! Cuide dele, é do gelo da minha terra!'], 'recusa': ['Tudo bem. Se mudar de ideia, estou no hotel.'], 'falta': ['Preciso de um Sandshrew para a troca.'], 'depois': ['Um Sandshrew do deserto! Sinto saudade do de lá.']}}},
    'kaleo': {'troca': {'quer': {'especie': 37, 'nome': 'um Vulpix'}, 'da': {'dex': 37, 'forma': 'alola', 'nivel': 30, 'apelido': 'Nevinha'}, 'repetivel': False,
                        'falas': {'pede': ['Eu tenho um Vulpix de Alola, branquinho como a neve de lá. Troco por um Vulpix daqui, de fogo. Topa?'], 'aceita': ['Que lindo! Sempre quis ver o fogo de perto sem queimar a mão.'], 'recusa': ['Sem pressa. A neve não derrete tão rápido.'], 'falta': ['Preciso de um Vulpix para a troca.'], 'depois': ['O fogo do Vulpix daqui aquece meu quarto de hotel!']}}},
    'dr_icaro': {'falas': [{'linhas': ['Fóssil Âmbar, Garra, Raiz, Domo… Se você achar, eu revivo.', 'A máquina leva uma hora do jogo, mas é fiel como relógio de sol.']}]},
    'museu_curadora': {'falas': [{'se': {'visitou': 'ruinas_pintada_1'}, 'linhas': ['Você esteve nas Ruínas de Pedra Pintada? As cópias das pinturas ficam aqui, mas o original é de chorar.']}, {'linhas': ['O museu abre todo dia. O Tyrantrum não reclama de visita.']}]},
    'mestre_iraci': {'reage': {'tipo': {'water': ['Um Pokémon de Água! Esse nada bem. Dá para correr de canoa com ele.']}}},
    'ruinas_heitor': {'falas': [{'se': {'missoes': ['sq_alfa_galeria']}, 'linhas': ['Você derrubou o Alfa? Um crocodilo a menos para me perseguir nos sonhos.']}]},
}

js = '// Missões e NPCs vivos do Sertão do Levante (Vila Mandacaru, Cidade Buriti, Vila Siri, Ruínas de Pedra Pintada e treinadores das rotas).\n'
js += '// GERADO por tools/regioes/gerar-sertao.py (edite lá). Formato: docs/missoes.md.\n\n'
js += 'export const ITENS = ' + json.dumps(ITENS, ensure_ascii=False, indent=2) + ';\n\n'
js += 'export const MISSOES = ' + json.dumps(M, ensure_ascii=False, indent=2) + ';\n\n'
js += 'export const NPCS = ' + json.dumps(NPCS, ensure_ascii=False, indent=2) + ';\n'
open(os.path.join(RAIZ, 'src/story/missoes/regiao-sertao.js'), 'w').write(js)
# o explorador Heitor (NPC de missão das ruínas) mora na antecâmara da fachada
R.person('ruinas_heitor', 'Explorador Heitor', {'preset': 'montanhista', 'hat': 'cap', 'cap': '#e0b030', 'capLogo': '#8a5a2a', 'hair': '#3b2a22', 'skin': '#c98d62', 'top': '#6a8a5a', 'trim': '#8a5a2a', 'pants': '#6a4a34', 'shoes': '#4a3428', 'bagStyle': 'big', 'bag': '#6a4a34'}, 962, 355, ['As Ruínas de Pedra Pintada ficam atrás desta porta. Corra na areia fofa e chegue cansado; entre e volte inteiro.', 'São três andares: o Pátio das Pinturas, a Galeria da Areia e a Câmara do Sol. O primeiro é só ouvir o sol.'], 'up', 0)
