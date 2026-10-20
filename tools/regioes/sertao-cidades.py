# ---------------------------------------------------------------- CIDADES E VILAS
def predio(kind, x, y, pid, **kw):
    o = R.obj(kind, x, y, predio=pid)
    o.update(kw); return o

def mao(kind, x, y, sala):  # prédio com sala feita à mão
    return R.obj(kind, x, y, to=sala)

LOOK_BRASA = {'preset': 'montanhista', 'hat': 'cap', 'cap': '#6a4424', 'capLogo': '#6a4424', 'hair': '#e8e4dc', 'skin': '#a06a44', 'top': '#c8442a', 'trim': '#f2c03a', 'pants': '#5a4a34', 'shoes': '#4a3428', 'bagStyle': None}
LOOK_VAQ = {'preset': 'montanhista', 'hat': 'cap', 'cap': '#8a5a2a', 'capLogo': '#8a5a2a', 'hair': '#3b2a22', 'skin': '#c98d62', 'top': '#d8a040', 'trim': '#8a5a2a', 'pants': '#4a5a8a', 'shoes': '#4a3428', 'bagStyle': 'shoulder', 'bag': '#8a5a2a'}
LOOK_SERT_F = {'preset': 'mae', 'hair': '#2a211c', 'skin': '#a06a44', 'top': '#e0782e', 'trim': '#fff6e8'}
LOOK_SERT_F2 = {'preset': 'treinadora', 'hairStyle': 'ponytail', 'hair': '#2a211c', 'skin': '#c98d62', 'hat': 'cap', 'cap': '#d8a040', 'capLogo': '#8a5a2a', 'top': '#d8442a', 'legs': 'skirt', 'pants': '#8a5a2a', 'shoes': '#4a3428'}
LOOK_TURBANTE = {'preset': 'treinadora', 'hairStyle': 'bun', 'hair': '#1a1a22', 'skin': '#c98d62', 'outfit': 'coat', 'top': '#e0b030', 'trim': '#8a2a6a', 'legs': 'skirt', 'pants': '#8a2a6a', 'shoes': '#e0b030', 'bagStyle': None}

# ================================================================ VILA MANDACARU [750,210,60,45]
R.c('vila_mandacaru: Vila Mandacaru (taipa, caatinga e sol a pino)')
R.ell('caatinga', 780, 232, 36, 26, 0.5, ['talldry', 'cracked'])
# ruas de terra batida e praça
R.path('path', [[600, 203], [632, 206], [668, 212], [706, 218], [742, 218]], 3, 1.2)
R.path('path', [[742, 218], [814, 219]], 3)
R.path('path', [[780, 219], [780, 256]], 3)
R.path('path', [[748, 245], [814, 245]], 3)
R.path('path', [[780, 246], [815, 249], [850, 262], [905, 270], [960, 268], [1000, 266]], 3, 1.5)   # Rota 20 até Buriti
R.rect('plaza', 774, 228, 13, 8)
R.rect('plaza', 767, 230, 7, 2)
R.rect('plaza', 787, 230, 7, 2)
# prédios (todos com interior)
mao('taipa', 773, 214, 'casa_brasa')
predio('estacao', 742, 213, 'estacao_mandacaru')
predio('center', 753, 214, 'centro_mandacaru')
predio('mart', 764, 214, 'loja_mandacaru', interior={'npc': {'id': 'ze_prea', 'name': 'Zé Preá', 'look': LOOK_VAQ, 'lines': ['Rapadura, farinha e Pedra do Fogo. O que o freguês precisa?', 'Aqui o sol cobra caro pelo calor, mas eu cobro barato pelo fresco da bodega.']}})
predio('barn', 780, 214, 'casa_farinha', interior={'tipo': 'celeiro', 'nome': 'Casa de Farinha'})
predio('capela', 789, 214, 'capela_mandacaru', interior={'npc': {'id': 'padre_pedro', 'name': 'Padre Pedro', 'look': 'professor', 'lines': ['Em junho a vila inteira vira festa. Fogueira, quadrilha e batalha de Pokémon no terreiro.', 'São Pedro olha por nós. Mas olhe também por onde pisa na caatinga.']}})
predio('taipa', 757, 239, 'casa_cacimba', interior={'tipo': 'casa', 'nome': 'Casa da Dona Socorro', 'npc': {'id': 'dona_socorro', 'name': 'Dona Socorro', 'look': LOOK_SERT_F, 'lines': ['A cisterna aqui nunca secou, graças a Deus. Água de cacimba é água de herança.', 'No Lajedo tem veio de água, dizem. Mas só quem sabe cavar acha.']}})
R.obj('taipa', 767, 239, interior={'tipo': 'casa'})
R.obj('houseC', 790, 239, interior={'tipo': 'cozinha'})
R.obj('taipa', 800, 239, interior={'tipo': 'casa'})
# cercado das cabras do Seu Brasa
for x in range(765, 776):
    R.obj('cercaVara', x, 222)
    R.obj('cercaVara', x, 227) if x not in (769, 770) else None
for y in range(223, 227):
    R.obj('cercaVara', 765, y); R.obj('cercaVara', 775, y)
R.pets += [{'dex': 672, 'x': 768, 'y': 224, 'wander': 3, 'say': 'Méééé! (mordisca um mandacaru de enfeite)'},
           {'dex': 672, 'x': 772, 'y': 225, 'wander': 3, 'say': 'Mééé… (empurra a cerca com o chifre)'},
           {'dex': 673, 'x': 770, 'y': 223, 'wander': 2, 'say': 'Gogoat solta um bufo grave e olha de lado.'},
           {'dex': 749, 'x': 746, 'y': 235, 'wander': 3, 'say': 'Mudbray cava um buraco e deita nele.'},
           {'dex': 28, 'x': 806, 'y': 232, 'wander': 3, 'say': 'Sandslash se enrola na sombra do mandacaru.'}]
# praça: barracas da quermesse, lampiões, poço e Ninho
R.obj('well', 779, 237)
R.obj('lampiao', 775, 229); R.obj('lampiao', 786, 229)
R.obj('barraca', 768, 232); R.obj('barraca', 789, 232)
R.obj('mandacaru', 750, 226); R.obj('mandacaru', 804, 224); R.obj('xiquexique', 812, 227)
R.obj('bench', 777, 227)
R.obj('cercaVara', 748, 247); R.obj('cercaVara', 749, 247); R.obj('cercaVara', 750, 247)
R.sign(750, 219, 'VILA MANDACARU\n"Aqui o sol é de casa."')
R.sign(758, 219, 'CENTRO POKÉMON · BODEGA DO ZÉ PREÁ · CASA DE FARINHA\n(à direita: Capela de São Pedro)')
R.sign(748, 211, 'ESTAÇÃO MANDACARU\nFim da linha do Trem da Aurora.')
R.sign(812, 246, 'ROTA 20 — CAATINGA DO LAJEDO →\nCidade Buriti: 50 passos de pedra e areia.')
R.sign(604, 208, 'ROTA 14 — ESTRADA DO SERTÃO\n(Vila Mandacaru adiante. Feche a porteira.)')
R.obj('gate', 603, 204)
R.dec('trilhoH', 607, 209, 143, 1)
R.obj('conePlast', 750, 208) if False else None
# rota do trem: o último trecho termina na Estação (gabarito de pedras no fim da linha)
R.obj('boulder2', 752, 209)
# moradores
R.person('forro_sanfona', 'Sanfoneiro Zé de Nô', LOOK_VAQ, 770, 234, ['Quer ouvir um xote? Só se for depois da batalha!', 'O trio do forró toca o dia todo na praça. A gente só para para descansar o fole.'], 'right', 0)
R.person('forro_zabumba', 'Zabumbeiro Dedé', {**LOOK_VAQ, 'cap': '#3a5a8a', 'top': '#5a8a4a'}, 773, 236, ['Zabumba é coração batendo. Com o sol chegando atrasado, o meu bate mais tarde também.'], 'right', 0)
R.person('forro_triangulo', 'Triangueiro Nenê', {**LOOK_SERT_F2}, 776, 234, ['O triângulo é pequeno, mas quem manda no compasso sou eu!'], 'left', 0)
R.person('mandacaru_vaqueira', 'Vaqueira Cida', LOOK_SERT_F2, 794, 222, ['As cabras do Seu Brasa são as mais teimosas do sertão. Fugiram de novo, vê só.', 'Se vir um Skiddo desgarrado, não corra atrás. Ele volta sozinho quando acha sombra de juazeiro.'], 'down', 3)
R.person('mandacaru_menino', 'Neguinho', 'menino', 783, 241, ['O Seu Brasa é da Elite Quatro, sabia? Mas aqui ele só cuida das cabras. E das brasas.', 'Eu também vou ser da Elite. Vou ter um Pokémon de fogo bem, bem quente.'], 'down', 4, kid=True)
R.person('mandacaru_velha', 'Vovó Ana', LOOK_SERT_F, 802, 220, ['Antigamente o trem trazia gente. Hoje traz só o vento.', 'O mandacaru floresce de noite quando vem chuva boa. Este ano floresceu de dia. O sol atrasado desnorteou até a planta.'], 'left', 0)
R.spots['sertao_praca_mandacaru'] = [780, 231, 'down']
R.spots['sertao_estacao_mandacaru'] = [746, 217, 'down']
R.spots['sertao_cacimba'] = [872, 224, 'down']

# ================================================================ CIDADE BURITI [1000,250,80,40]
R.c('cidade_buriti: Cidade Buriti (oásis, bazar, museu e fósseis)')
R.ell('caatinga', 1040, 270, 44, 28, 0.5, ['talldry', 'cracked', 'dune', 'sand'])
R.path('path', [[996, 266], [1020, 262], [1036, 261], [1078, 261]], 3)
R.path('path', [[1039, 262], [1039, 292]], 3)
R.path('path', [[1003, 277], [1078, 277]], 3)
R.rect('plaza', 1033, 264, 13, 9)
R.rect('plaza', 1036, 273, 7, 4)
R.rect('plaza', 1070, 260, 8, 3)
# fileira de cima (a frente dos prédios dá para a rua y 259-262)
predio('center', 1000, 256, 'centro_buriti')
predio('mart', 1012, 256, 'bazar_buriti')
mao('lab', 1023, 256, 'lab_fosseis')
mao('houseStone', 1036, 256, 'museu_sertao')
predio('houseYellow', 1045, 256, 'hotel_oasis', interior={'npc': [{'id': 'kiana', 'name': 'Kiana', 'look': {'preset': 'treinadora', 'hairStyle': 'long', 'hair': '#2a211c', 'skin': '#c98d62', 'outfit': 'shirt', 'top': '#f2c03a', 'legs': 'shorts', 'pants': '#3a8ad8', 'shoes': '#ffffff', 'bagStyle': None}, 'lines': ['Sou de Alola! Aqui o sol é seco; lá, é molhado. Sinto saudade da brisa.', 'Tem Pokémon aqui que eu nunca vi em Alola. Gosto dos que têm cheiro de mar.']}, {'id': 'kaleo', 'name': 'Hóspede Kaleo', 'look': {'preset': 'treinador', 'hairStyle': 'spiky', 'hair': '#e8c060', 'hat': None, 'outfit': 'shirt', 'top': '#e8455a', 'legs': 'shorts', 'pants': '#3a8ad8', 'shoes': '#ffffff', 'bagStyle': None}, 'lines': ['Eu e a Kiana somos de Alola. O hotel tem piscina, mas o calor daqui ainda me derrete.', 'Se você tiver um Vulpix, a gente conversa.']}]})
mao('housePink', 1058, 256, 'tenda_rainha')
predio('taipa', 1067, 256, 'casa_caravana', interior={'tipo': 'casa', 'nome': 'Casa da Caravana', 'npc': {'id': 'bento_duna', 'name': 'Tropeiro Bento Duna', 'look': LOOK_VAQ, 'lines': ['Quarenta anos cruzando as dunas. Sei onde a areia engole e onde ela segura.', 'Se for atravessar, vá em linha reta e não pare. A areia fofa cobra por cada passo.']}})
# fileira de baixo
predio('barn', 1004, 280, 'arena_areia', interior={'tipo': 'salao', 'nome': 'Arena de Areia', 'npc': {'id': 'mestre_areia', 'name': 'Mestre da Arena Haroldo', 'look': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#e0b030', 'capLogo': '#8a5a2a', 'hair': '#3b2a22', 'skin': '#a06a44', 'top': '#c8a040', 'trim': '#8a5a2a', 'pants': '#6a4a34', 'shoes': '#4a3428', 'bagStyle': None}, 'lines': ['Todo dia às três da tarde, a tempestade de areia entra no salão. E ninguém sai de cabeça baixa.', 'Quer me enfrentar? Venha com o time inteiro. Eu não guardo golpe.']}})
R.obj('houseA', 1014, 280, interior={'tipo': 'sobrado'})
R.obj('taipa', 1024, 281, interior={'tipo': 'casa'})
R.obj('houseC', 1047, 280, interior={'tipo': 'casa'})
R.obj('taipa', 1057, 281, interior={'tipo': 'cozinha'})
R.obj('houseB', 1065, 280, interior={'tipo': 'casa'})
# praça: relógio de sol, poste, bancos e a fonte do oásis
R.obj('sundial', 1038, 266)
R.obj('lampiao', 1034, 265); R.obj('lampiao', 1045, 265); R.obj('lampiao', 1034, 271); R.obj('lampiao', 1045, 271)
R.obj('bench', 1035, 268); R.obj('bench', 1042, 268)
R.obj('barraca', 1070, 263); R.obj('barraca', 1074, 263); R.obj('guardaSol', 1000, 263)
R.obj('palmeira', 998, 262); R.obj('palmeira', 1081, 262); R.obj('palmeira', 1030, 274); R.obj('palmeira', 1048, 274)
R.obj('jangada', 1059, 274) if False else None
R.sign(1002, 262, 'CIDADE BURITI\n"A única sombra que não pede nada em troca."')
R.sign(1018, 262, 'BAZAR DO OÁSIS · LAB. DE FÓSSEIS · MUSEU DO SERTÃO')
R.sign(1051, 262, 'HOTEL OÁSIS · TENDA DA RAINHA DO BAZAR · CASA DA CARAVANA')
R.sign(1008, 279, 'ARENA DE AREIA\nBatalhas às 15h, sob tempestade de areia.')
R.sign(1021, 244, 'SUBIDA DA CHAPADA VERMELHA ↑\n(só com trepadeira: Escalar)')
R.sign(1058, 244, 'SUBIDA DA CHAPADA VERMELHA ↑\n(só com trepadeira: Escalar)')
R.person('buriti_vendedora', 'Dona Lídia', LOOK_SERT_F, 1072, 266, ['Tecidos, tapetes e bugigangas do deserto! Tudo com cheiro de sol.', 'A Rainha do Bazar sabe quanto vale cada anel. Mas só diz depois do chá.'], 'down', 1)
R.person('buriti_menino', 'Duduzinho', 'menino', 1040, 268, ['Eu cavei na areia e achei um osso! O doutor Ícaro disse que era de um boi. Que decepção.'], 'down', 4, kid=True)
R.person('buriti_cameleiro', 'Cameleiro Ali', LOOK_VAQ, 1008, 270, ['Meus Camerupt carregam até as pedras do Lajedo. Pedra boa, pedra pesada.', 'No bazar a Areia Macia é cara porque vem de longe. Quem manda no preço é o frete.'], 'right', 0)
R.person('buriti_idosa', 'Dona Zulmira', LOOK_SERT_F, 1054, 270, ['Vi o céu cair uma noite. Foi um clarão de dar medo. Na manhã seguinte, a cratera estava lá.', 'Dizem que aquilo na cratera é pedra das estrelas. Eu digo que é só uma pedra grande.'], 'left', 0)
R.spots['sertao_praca_buriti'] = [1039, 268, 'down']

# ================================================================ VILA SIRI [690,370,50,30] (palafitas sobre o mangue)
R.c('vila_siri: Vila Siri (palafitas)')
R.ell('sand', 715, 383, 36, 16, 0.5, ['caatinga', 'cracked', 'talldry', 'dune', 'mangmud', 'shallow'])
R.ell('shallow', 715, 391, 33, 13, 0.5, ['sand', 'mangmud', 'shallow'])
R.ell('water', 715, 391, 27, 10, 0.5)
R.rect('dock', 688, 375, 55, 2)           # calçadão da frente dos prédios
R.rect('dock', 714, 377, 3, 18)           # passarela norte-sul
R.rect('dock', 707, 381, 17, 6)           # praça sobre as estacas
R.rect('dock', 695, 384, 9, 5)            # palafita da Rendeira
R.rect('dock', 703, 387, 12, 2)
R.rect('dock', 726, 387, 10, 6)           # palafita do cais
R.rect('dock', 714, 391, 32, 2)           # píer do Barco das Brasas
predio('center', 690, 371, 'centro_siri', interior={'nome': 'Centro Pokémon (palafita)'})
predio('mart', 701, 371, 'loja_siri')
predio('taipa', 710, 371, 'casa_mare', interior={'tipo': 'casa', 'nome': 'Casa da Marisqueira Dona Maré', 'npc': {'id': 'dona_mare', 'name': 'Dona Maré', 'look': LOOK_SERT_F, 'lines': ['Caranguejo bom é o que sai quando a maré vira. Eu leio na tábua.', 'A tábua de maré diz tudo: hora de enchente, hora de vazante. Quem não lê, molha o pé.']}})
predio('houseC', 718, 371, 'escola_canoa', interior={'tipo': 'oficina', 'nome': 'Escola de Canoa', 'npc': {'id': 'mestre_iraci', 'name': 'Mestre Iraci', 'look': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#4a7a3a', 'capLogo': '#4a7a3a', 'hair': '#b9b4ae', 'skin': '#a06a44', 'top': '#e8e0d0', 'trim': '#3a8ad8', 'pants': '#3a5a9a', 'shoes': '#5a3a24', 'bagStyle': None}, 'lines': ['Remo na água é como pé na terra: tem que ter ritmo.', 'A canoa é de quem sabe a hora da maré. Vento a favor ajuda, mas não rema por você.']}})
predio('taipa', 697, 384, 'casa_rendeira', interior={'tipo': 'casa', 'nome': 'Casa da Rendeira', 'npc': {'id': 'lia_rosa', 'name': 'Dona Lia-Rosa', 'look': {**LOOK_SERT_F, 'top': '#f2e6cc', 'hair': '#e8e4dc'}, 'lines': ['Cada renda leva uma semana. Cada ponto, uma história.', 'Os bilros fazem barulhinho de chuva. Meu marido dizia que é por isso que a gente nunca dorme mal.']}})
predio('taipa', 728, 387, 'cais_siri', interior={'tipo': 'escritorio', 'nome': 'Cais do Barco das Brasas'})
R.obj('barrel', 708, 382); R.obj('crate', 709, 382); R.obj('barrel', 721, 385)
R.obj('lampiao', 712, 376); R.obj('lampiao', 718, 376)
R.obj('jangada', 702, 396); R.obj('jangada', 726, 397)
R.obj('boia', 744, 398); R.obj('boia', 690, 395)
R.sign(692, 378, 'VILA SIRI\n"Palafita é casa que aprendeu a dançar com a maré."')
R.sign(735, 390, 'BARCO DAS BRASAS → VILA TERMAS\nSaídas: 7h e 15h · ₽500')
R.pets += [{'dex': 98, 'x': 710, 'y': 384, 'wander': 3, 'say': 'Krabby sai de baixo da tábua e levanta a garra.'},
           {'dex': 99, 'x': 719, 'y': 384, 'wander': 3, 'say': 'Kingler segura um caranguejinho de brinquedo.'},
           {'dex': 278, 'x': 699, 'y': 376, 'wander': 3, 'perch': False, 'say': 'Wingull grasna, de olho nas redes de pesca.'}]
R.person('siri_barqueiro', 'Capitão Tonho', {'preset': 'montanhista', 'hat': 'cap', 'cap': '#f2f2f2', 'capLogo': '#3a8ad8', 'hair': '#e8e4dc', 'skin': '#c98d62', 'top': '#3a6ad8', 'trim': '#f2f2f2', 'pants': '#f2f2f2', 'shoes': '#5a3a24', 'bagStyle': None}, 735, 392, ['O Barco das Brasas sai às sete e às três. A das sete agora sai no escuro, por causa do sol atrasado.'], 'down', 0, viagem='barco_brasas')
R.person('siri_menina', 'Naiara', 'menina', 713, 386, ['Eu remo mais rápido que o Iraci! Quase.', 'Se escutar um barulho de sapo gigante no mangue, não vá lá. É o Alfa. Ele afunda canoa.'], 'down', 4, kid=True)
R.person('siri_pescador', 'Pescador Zeca', LOOK_VAQ, 700, 376, ['A pesca no mangue é paciência e botas altas.', 'De noite o mangue brilha. Dizem que é vaga-lume. Eu acho que é Chinchou.'], 'right', 0)
R.spots['sertao_cais_siri'] = [733, 392, 'right']
R.viagens.append({'id': 'barco_brasas', 'nome': 'O Barco das Brasas', 'fala': ['O Barco das Brasas faz a travessia para Vila Termas, nas Brasas. São ₽500 e uma parada na Ilha do Basalto.', 'Embarca?'],
                  'destinos': [{'nome': 'Vila Termas (Arquipélago das Brasas)', 'destino': 'ninho_vila_termas', 'preco': 500, 'horarios': [7, 15], 'cena': 'O barco sai do mangue e pega a Rota Marítima 19, com o vulcão fumegando no horizonte…'}]})

# ================================================================ SALAS FEITAS À MÃO
def ob(s, kind, x, y, text=None, **kw):
    o = {'kind': kind, 'x': x, 'y': y}
    if text: o['text'] = text
    o.update(kw); s['objects'].append(o)

def pp(s, id, name, look, x, y, lines, dir='down', wander=0, **kw):
    p = {'id': id, 'name': name, 'look': look, 'x': x, 'y': y, 'dir': dir, 'lines': lines}
    if wander: p['wander'] = wander
    p.update(kw); s['people'].append(p)

# --- Casa do Seu Brasa
s = sala('casa_brasa', 'Casa do Seu Brasa', 15, 10, 7)
ob(s, 'shelf', 2, 2, 'Chapéus de couro pendurados, um sobre o outro. O de cima tem as iniciais S.B. bordadas à mão.')
ob(s, 'shelf', 12, 2, 'Troféus empoeirados do tempo de campeão. Um deles está dentro de um balde, servindo de bebedouro.')
ob(s, 'radio', 4, 2, 'Uma sanfona de oito baixos descansa em cima do rádio. Falta uma tecla, que ele diz que é de propósito.')
ob(s, 'fogao', 7, 2, 'Um fogão a lenha. Na panela, um cozido de macaxeira que ainda está vivo de tão quente.')
ob(s, 'table', 5, 5, 'Na mesa, um mapa da Cidadela do Zênite todo riscado de brasa. "Quarta-feira, 12h em ponto."')
ob(s, 'bed', 12, 5, 'A cama de rede é maior que a cama de verdade. Ele dorme na rede, claro.')
ob(s, 'plant', 1, 6); ob(s, 'plant', 13, 8)
s['decor'] += [{'kind': 'rug', 'x': 6, 'y': 6}, {'kind': 'window', 'x': 3, 'y': 1, 'oy': 3}, {'kind': 'window', 'x': 10, 'y': 1, 'oy': 3}]
pp(s, 'seu_brasa', 'Seu Brasa', LOOK_BRASA, 8, 4, ['Sou da Elite, o de Fogo. Mas só nos dias de Liga, lá no Zênite. No resto do tempo eu cuido de cabra.', 'Sol a pino é a hora do fogo. De manhã ele ainda acorda; à tarde, já cansou. Ao meio-dia, não tem pra ninguém.'], 'down', 0)
s['pets'] += [{'dex': 672, 'x': 3, 'y': 6, 'wander': 2, 'say': 'Skiddo cochila em cima de um tapete de lã.'}, {'dex': 58, 'x': 10, 'y': 7, 'wander': 1, 'sleep': True, 'say': 'Growlithe dorme esparramado, com o rabo no ar.'}]
s['spots']['brasa_dentro'] = [8, 6, 'up']
R.interiors.append(s)

# --- Laboratório de Fósseis (Dr. Ícaro)
s = sala('lab_fosseis', 'Laboratório de Fósseis', 17, 11, 8, floor='t')
ob(s, 'machine', 6, 3, 'A MÁQUINA DE REVIVER: tubos, lâmpadas e um funil de vidro. Leva uma hora do jogo para devolver a vida a um fóssil. Cheira a poeira e ozônio.')
ob(s, 'machine', 10, 3, 'Uma segunda máquina, esta só para limpar. Dentro, uma escovinha de dente gira devagar.')
ob(s, 'pc', 14, 2, 'No computador: "Catálogo de fósseis do Sertão. Item 12: Âmbar Antigo. Item 13: um osso que não é fóssil, é de boi."')
ob(s, 'shelf', 2, 2, 'Frascos de pó de rocha por camada: vermelho, ocre, branco. Cada um com data e hora da coleta.')
ob(s, 'shelf', 4, 2, 'Livros: "Paleontologia de Bolso", "Fósseis do Ocaso", "Por Que o Meu Chão É Vermelho".')
ob(s, 'table', 3, 6, 'Uma mesa com lupas, pincéis e um fragmento de concha. Um bilhete: "Não encoste. Eu sei quando encosta."')
ob(s, 'table', 12, 6, 'Bandejas com fósseis catalogados. Todos têm etiquetas manuscritas em letra de cientista (ilegível).')
ob(s, 'plant', 1, 8); ob(s, 'plant', 15, 8)
s['decor'] += [{'kind': 'window', 'x': 8, 'y': 1, 'oy': 3}]
pp(s, 'dr_icaro', 'Dr. Ícaro', {'preset': 'professor', 'hair': '#3a3a3a', 'skin': '#efc19b', 'outfit': 'coat', 'top': '#f4f4f0', 'trim': '#8a2a6a', 'pants': '#6a4a34', 'shoes': '#4a3428'}, 8, 5, ['Seja bem-vindo ao melhor laboratório de fósseis a leste do Rio Seco. Também o único.', 'Se encontrar um fóssil, traga aqui. Eu devolvo a vida a ele: Âmbar, Garra, Raiz ou Vela. A máquina é teimosa, mas fiel.'], 'down', 0)
pp(s, 'lab_assistente', 'Assistente Pati', 'menina', 4, 8, ['O doutor deixa a gente limpar o pó com pincel. Eu acho que é só para a gente não conversar.'], 'right', 0)
s['spots']['lab_fosseis_maquina'] = [7, 4, 'up']
R.interiors.append(s)

# --- Museu do Sertão
s = sala('museu_sertao', 'Museu do Sertão', 19, 11, 9, floor='t')
ob(s, 'statue', 8, 3, 'O esqueleto de um Tyrantrum, remontado com arame e paciência. A placa: "Tyrantrum, 8 m. Mordida: 500 kg. Dentes: muitos."')
ob(s, 'mural', 2, 2, 'Cópia das pinturas rupestres de Pedra Pintada: figuras com os braços para cima, um disco amarelo e dois animais em fila.')
ob(s, 'mural', 14, 2, 'Outra cópia: um desenho de pegadas que sobem as dunas e somem no meio. Embaixo, alguém anotou: "areia fofa, de novo".')
ob(s, 'rock', 15, 6, 'A PEDRA DO METEORO, num pedestal de vidro. Pesa tanto que o piso foi reforçado. Uma plaquinha: "Não é uma pedra qualquer."')
ob(s, 'bench', 4, 7); ob(s, 'bench', 11, 7)
ob(s, 'shelf', 1, 5, 'Vitrine com cacos de cerâmica do Sertão, colados um a um. Dos mil pedaços, faltam vinte.')
ob(s, 'plant', 17, 8); ob(s, 'plant', 1, 8)
s['decor'] += [{'kind': 'rug', 'x': 8, 'y': 6}]
pp(s, 'museu_curadora', 'Curadora Verônica', {'preset': 'treinadora', 'hairStyle': 'bun', 'hair': '#3a2a22', 'skin': '#c98d62', 'outfit': 'coat', 'top': '#e8e0d0', 'trim': '#8a5a2a', 'legs': 'skirt', 'pants': '#4a4a5a', 'shoes': '#4a3428'}, 6, 5, ['Cada peça aqui foi achada no Sertão. Algumas, cavando. Outras, caindo do céu.', 'O fóssil de Tyrantrum foi achado por um menino brincando de cavar. Hoje esse menino é o Dr. Ícaro.'], 'right', 0)
pp(s, 'museu_guarda', 'Guarda Tadeu', 'treinador', 12, 5, ['Pode olhar, mas não pode encostar. Principalmente na pedra do meteoro. Ela esquenta.'], 'left', 0)
R.interiors.append(s)

# --- Tenda da Rainha do Bazar
s = sala('tenda_rainha', 'Tenda da Rainha do Bazar', 14, 9, 6, floor='f')
ob(s, 'mural', 4, 2, 'O ESPELHO DOURADO da tenda, enorme e embaçado. Seis argolas de ouro faltam na moldura. Pelo vidro, a tenda parece maior do que é.')
ob(s, 'shelf', 1, 2, 'Prateleira de anéis dourados e pulseiras de contas. Etiqueta: "Todos autênticos. Quase todos."')
ob(s, 'shelf', 12, 2, 'Perfumes e óleos de duna. Um deles cheira a chuva, que ninguém aqui jamais viu.')
ob(s, 'table', 9, 4, 'Uma mesinha com chá de hibisco e doces de cuscuz. Dois pratos, uma xícara cheia, outra vazia.')
ob(s, 'plant', 1, 6); ob(s, 'plant', 12, 6)
s['decor'] += [{'kind': 'rug', 'x': 5, 'y': 4}, {'kind': 'rug', 'x': 7, 'y': 4}, {'kind': 'rug', 'x': 5, 'y': 6}, {'kind': 'rug', 'x': 7, 'y': 6}]
pp(s, 'zuleica', 'Rainha do Bazar Zuleica', LOOK_TURBANTE, 6, 4, ['Eu conheço todos os desertos, querido. Os de areia e os de ouro. Os de ouro são mais perigosos.', 'Meu espelho já mostrou muita coisa. Só não mostra onde eu perdi meus anéis.'], 'down', 0)
R.interiors.append(s)
