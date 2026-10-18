# ================================================================ VEGETAÇÃO, DETALHES E TESOUROS
CAAT = ['caatinga', 'cracked']
# --- vegetação geral da caatinga (mandacaru, xique-xique, juazeiro, cactos), mais densa nas rotas
R.tree(607, 204, 143, 56, 0.045, ['mandacaru', 'xiquexique', 'cactus', 'cactus'], CAAT)
R.tree(607, 204, 143, 56, 0.006, ['juazeiro'], CAAT)
R.tree(810, 203, 180, 90, 0.04, ['mandacaru', 'xiquexique', 'cactus', 'umbu'], CAAT)
R.tree(810, 203, 180, 90, 0.006, ['juazeiro'], CAAT)
R.tree(606, 262, 215, 14, 0.04, ['mandacaru', 'xiquexique', 'cactus'], CAAT)
R.tree(822, 276, 40, 120, 0.04, ['mandacaru', 'xiquexique', 'cactus'], CAAT)
R.tree(1040, 292, 100, 130, 0.03, ['mandacaru', 'xiquexique', 'cactus'], CAAT)
R.tree(860, 395, 270, 28, 0.04, ['mandacaru', 'xiquexique', 'cactus'], CAAT)
R.tree(606, 360, 220, 32, 0.035, ['mandacaru', 'xiquexique', 'cactus'], CAAT)
R.tree(990, 252, 160, 14, 0.04, ['mandacaru', 'xiquexique', 'umbu'], CAAT)
# canyon e chapada: pedras, cactos e galhos secos
R.tree(614, 276, 205, 78, 0.03, ['boulder2', 'xiquexique', 'cactus', 'stalagmite'], ['redrock', 'cracked'])
R.tree(992, 208, 146, 32, 0.035, ['boulder2', 'xiquexique', 'cactus'], ['redrock', 'cracked'])
R.tree(688, 304, 100, 32, 0.05, ['boulder2', 'xiquexique', 'stalagmite'], ['dryriver', 'redrock'])
# dunas: cactos, crânios de boi e madeira seca
R.tree(858, 294, 205, 100, 0.012, ['cactus', 'skull', 'driftwood', 'boulder2'], ['dune', 'sand'])
# oásis: palmeiras, juazeiros, umbu
R.tree(1082, 252, 58, 46, 0.07, ['palmeira', 'coqueiro', 'juazeiro', 'umbu'], ['grass', 'grass2', 'tall'])
# mangue: árvores de mangue (3 blocos), raízes
R.tree(606, 392, 220, 78, 0.04, ['mangue'], ['mangmud'])
R.noTrees += [[740, 205, 76, 52], [996, 253, 90, 42], [686, 368, 60, 36], [940, 335, 30, 30], [950, 340, 20, 20], [645, 312, 14, 14], [650, 427, 22, 14], [1083, 217, 14, 14]]

# --- paredões das bordas: cactos no topo e a Rota 14 com cerca de vara
for x in range(612, 748, 6): R.obj('cercaVara', x, 211)
R.obj('mandacaru', 618, 212); R.obj('mandacaru', 651, 213); R.obj('juazeiro', 700, 224); R.obj('juazeiro', 722, 233); R.obj('juazeiro', 668, 238)
R.sign(640, 205, 'ROTA 14\nAdiante: Vila Mandacaru. Ao sul, o Cânion do Rio Seco (sem trilha — a subida é de trepadeira).')
R.sign(646, 259, 'MIRANTE DO RIO SECO\n"De cima, o cânion parece um rio de fogo parado."')
R.obj('bench', 643, 260)
R.sign(688, 259, 'DESCIDA PELA TREPADEIRA ↓\nCânion do Rio Seco (Escalar)')
R.sign(628, 259, 'DESCIDA PELA TREPADEIRA ↓\nCânion do Rio Seco (Escalar)')
R.sign(760, 263, 'DESCIDA PELA TREPADEIRA ↓\nCânion do Rio Seco (Escalar)')
R.sign(713, 366, 'TRILHA DO SIRI\nVila Siri, ao sul. Ao norte, o Cânion do Rio Seco.')
R.sign(724, 296, 'FUNDO DO CÂNION ↓ (Escalar)\n"Ninguém guarda o fundo. O fundo é que guarda quem desce."')
R.sign(818, 306, 'SAÍDA LESTE DO CÂNION\nRota 20 e Dunas Douradas.')
R.sign(838, 282, 'ROTA 20 — CAATINGA DO LAJEDO\nVila Mandacaru: oeste. Cidade Buriti: leste.')

# --- Fundo do Cânion (escondido): baús e a Toca de Luz do cânion fica no leito aberto
R.obj('chest', 700, 316, item='revive', n=3)
R.obj('chest', 770, 318, item='nugget', n=2)
R.obj('chest', 738, 322, item='maxRevive', n=1)
R.obj('skull', 744, 318)
R.item(691, 311, 'rareCandy', hidden=True)
R.item(784, 332, 'bigPearl', hidden=True)
R.item(718, 309, 'ultraBall', 3)
R.tocas.append({'id': 'toca_canion', 'x': 650, 'y': 318, 'gmax': ['copperajah-gmax']})

# --- Chapada Vermelha: ninhos de Bagon (ovos de pedra), baú com a Salamencita atrás das mesas
R.obj('chest', 1128, 223, item='salamencite', n=1)
R.obj('boulder', 1130, 221); R.obj('boulder', 1130, 226)
R.obj('skull', 1034, 232); R.obj('skull', 1090, 232)
R.obj('boulder2', 1018, 212); R.obj('boulder2', 1030, 230); R.obj('boulder2', 1062, 228); R.obj('boulder2', 1108, 232)
R.item(1012, 214, 'dragonScale', hidden=True)
R.item(1098, 232, 'rareCandy', hidden=True)
R.item(1048, 228, 'hyperPotion', 2)
R.item(1120, 210, 'ultraBall', 3)
R.tocas.append({'id': 'toca_chapada', 'x': 1090, 'y': 222, 'gmax': ['duraludon-gmax']})
R.sign(1100, 244, 'CHAPADA VERMELHA\n"Aqui moram os que olham o mundo de cima."')
R.sign(1026, 217, 'DESFILADEIRO BRANCO ↑\n(Escalar) A subida leva à Cordilheira Geada.')

# --- Dunas Douradas e Cratera da Estrela
R.obj('obsidianRock', 940, 336); R.obj('obsidianRock', 951, 338); R.obj('obsidianRock', 934, 348); R.obj('obsidianRock', 956, 346)
R.obj('boulder2', 944, 344)
R.sign(945, 330, 'CRATERA DA ESTRELA\n(o chão aqui é obsidiana. Não leve para casa: ela esquenta.)')
R.item(942, 342, 'meteorite', hidden=True)
R.item(947, 351, 'starPiece', hidden=True) if False else None
R.item(947, 351, 'stardust', 3, hidden=True)
R.item(900, 312, 'nugget', hidden=True); R.item(1040, 318, 'revive', hidden=True); R.item(988, 392, 'bigPearl', hidden=True)
R.item(878, 360, 'softSand', hidden=True)
R.tocas.append({'id': 'toca_dunas', 'x': 915, 'y': 322, 'gmax': ['sandaconda-gmax']})
R.sign(868, 332, 'DUNAS DOURADAS\n"Areia fofa: ande de pé. Corra se for preciso. Cuidado com os poços."')

# --- Oásis do Buriti: lago, bancos e Pokémon na água
R.obj('bench', 1099, 270); R.obj('bench', 1127, 289)
R.sign(1094, 258, 'OÁSIS DO BURITI\n"Aqui a água sobra. Do outro lado, falta."')
R.pets += [{'dex': 54, 'x': 1105, 'y': 273, 'wander': 3, 'say': 'Psyduck boia no lago segurando a cabeça.'}, {'dex': 183, 'x': 1118, 'y': 284, 'wander': 3, 'say': 'Marill saltita na beira d’água.'},
           {'dex': 195, 'x': 1124, 'y': 275, 'wander': 3, 'say': 'Quagsire deixa só os olhos de fora da lama.'}]
R.item(1116, 262, 'oranBerry', 3); R.item(1088, 290, 'sitrusBerry', 2); R.item(1126, 262, 'pearl', hidden=True)

# --- Rota 20 (Lajedo): a cacimba (veio de água) escondida do sq_cacimba
R.item(920, 217, 'freshWater', 2, hidden=True)
R.obj('rock', 880, 232); R.obj('rock', 888, 233)
R.obj('boulder2', 860, 255); R.obj('boulder2', 905, 245); R.obj('skull', 946, 272); R.obj('skull', 875, 218)
R.item(840, 268, 'hyperPotion', 2); R.item(960, 258, 'greatBall', 3); R.item(900, 228, 'tinyMushroom', 2, hidden=True)
R.item(870, 280, 'revive', hidden=True)
# aqui o lajedo onde o veio de água aparece (achado pelo Pokémon que cava): ponto de missão
R.spots['sertao_veio_dagua'] = [925, 216, 'down']

# --- Rota 14
R.item(635, 214, 'potion', 3); R.item(688, 218, 'pokeBall', 4); R.item(720, 240, 'superPotion', 2); R.item(704, 256, 'tinyMushroom', 2, hidden=True)
R.item(662, 238, 'heatRock', hidden=True); R.item(648, 224, 'revive', hidden=True)

# --- Mangue do Siri: ilhota da Toca de Luz, baús da maré, palafitas de apoio
R.tocas.append({'id': 'toca_mangue', 'x': 660, 'y': 432, 'gmax': ['kingler-gmax']})
for (cx, cy, it, n) in [(626, 408, 'dampRock', 1), (704, 424, 'bigPearl', 2), (770, 436, 'nugget', 1), (800, 420, 'pearl', 2)]:
    R.obj('chest', cx, cy, item=it, n=n, id='mare_%d_%d' % (cx, cy))
R.item(640, 444, 'netBall', 3); R.item(740, 414, 'oranBerry', 3); R.item(812, 448, 'revive', hidden=True)
R.sign(720, 398, 'MANGUE DO SIRI\n"A maré muda o caminho duas vezes por dia. Pergunte à Dona Maré."')
R.obj('jangada', 733, 405); R.obj('jangada', 690, 407)

# --- Praia do Levante
R.obj('beachStall', 925, 434); R.obj('beachStall', 1000, 436)
R.obj('surfboard', 930, 437); R.obj('surfboard', 996, 437); R.obj('driftwood', 960, 442)
for x in (900, 940, 1000, 1020): R.obj('boia', x, 473) if False else None
for x in (905, 920, 935): R.obj('boia', x, 473)
R.sign(960, 432, 'PRAIA DO LEVANTE\n"Cuidado com a maré: o banco de areia some às 6h e às 18h."')
R.item(870, 438, 'pokeBall', 5); R.item(1050, 440, 'greatBall', 3); R.item(980, 458, 'pearl', 2, hidden=True)
R.item(885, 448, 'bigPearl', hidden=True)
R.item(1070, 446, 'revive', hidden=True)
R.person('praia_banhista', 'Banhista Dalila', 'menina', 950, 444, ['A água aqui é tão clara que dá para contar os Staryu no fundo.'], 'down', 3)
R.person('praia_pescador', 'Velho Aderbal', {**LOOK_VAQ, 'cap': '#f2f2f2', 'top': '#5a8aa8', 'hair': '#e8e4dc'}, 1030, 446, ['Pesco aqui desde menino. O boto só aparece no meio da tarde.'], 'left', 0)
R.person('mar_balsa', 'Capitã Sônia', {**LOOK_SERT_F2, 'cap': '#f2f2f2', 'capLogo': '#3a8ad8', 'top': '#3a8ad8'}, 1086, 448, ['O Mar do Levante é fundo e cheio de correntes. Só vai nadando quem tem fôlego.'], 'left', 0)
R.sign(1060, 437, 'ROTA MARÍTIMA 19 →\n(só nadando) Arquipélago das Brasas, ao sul.')

# --- mirantes
R.obj('bench', 1096, 245) if False else None
R.sign(1120, 238, 'MIRANTE DA CHAPADA\n"Do alto, o mar do Levante parece um lençol azul esticado."')
R.obj('bench', 1124, 241)
R.sign(960, 365, 'MIRANTE DAS DUNAS\n(a vista é da Cratera: um buraco no meio do deserto, com uma moldura de pedra preta.)')
R.obj('bench', 962, 363)

# ================================================================ TREINADORES (níveis da seção 8; viram missões em src/story/missoes/regiao-sertao.js)
V = LOOK_VAQ; F2 = LOOK_SERT_F2
def L(**kw): return {'preset': 'treinador', 'bagStyle': None, **kw}
TREINADORES = []
def treinador(id, nome, look, x, y, dir, desafio, vitoria, dinheiro, equipe, area, depois=None):
    TREINADORES.append({'id': id, 'nome': nome, 'look': look, 'x': x, 'y': y, 'dir': dir, 'desafio': desafio, 'vitoria': vitoria, 'dinheiro': dinheiro, 'equipe': equipe, 'area': area})
    R.person(id, nome, look, x, y, [depois or vitoria[0]], dir, 0)

# Rota 14 (29–33)
treinador('sertao_tiao', 'Vaqueiro Tião', V, 640, 213, 'down', ['Eita, forasteiro! Pra passar na minha estrada tem que me ganhar no braço. Quer dizer, no Pokémon!'], ['Boa, forasteiro. O boi aprendeu a respeitar você.'], 660, [[128, 30, ['tackle', 'hornAttack', 'scaryFace', 'rage']], [241, 31, ['stomp', 'rollout', 'milkDrink', 'bodySlam']]], 'Rota 14')
treinador('sertao_nana', 'Tropeira Naná', F2, 684, 224, 'right', ['Tropeira não passa batida! Quer ver os meus bichos de pelo e de veneno?'], ['Perdi, mas não deixei de rir. Siga, o sol está a pino.'], 690, [[335, 31, ['slash', 'crushClaw', 'furySwipes', 'quickAttack']], [336, 31, ['poisonFang', 'bite', 'glare', 'crunch']]], 'Rota 14')
treinador('sertao_beto', 'Menino Beto', 'menino', 702, 240, 'left', ['Eu cavo buraco e acho de tudo! Já achei até uma Pedra do Fogo! Quer apostar?'], ['Nossa, você é forte! Vou cavar mais fundo para ganhar de você.'], 580, [[27, 29, ['dig', 'slash', 'sandAttack', 'furySwipes']], [331, 30, ['pinMissile', 'poisonSting', 'sandAttack', 'absorb']]], 'Rota 14')
treinador('sertao_zemaria', 'Repentista Zé Maria', V, 728, 226, 'down', ['Eu faço repente de tudo, até de batalha: "Quem perde é o mole, quem ganha é o duro!" Bora!'], ['Perdi, mas fiz a rima. O verso eu não esqueço.'], 700, [[672, 30, ['vineWhip', 'bulletSeed', 'headbutt', 'tackle']], [673, 32, ['rockSmash', 'vineWhip', 'headbutt', 'bulletSeed']]], 'Rota 14')
# Rota 20 (36–40)
treinador('sertao_raimundo', 'Lajedeiro Raimundo', V, 835, 262, 'down', ['O Lajedo é meu! Cada pedra aqui eu conheço pelo nome. E você, conhece o seu Pokémon pelo nome?'], ['Sabe das pedras e dos bichos. Passe, passe.'], 800, [[323, 38, ['eruption', 'earthPower', 'lavaPlume', 'ember']], [324, 38, ['flamethrower', 'earthPower', 'rockSlide', 'ember']]], 'Rota 20')
treinador('sertao_dalva', 'Cangaceira Dalva', F2, 868, 252, 'down', ['De chapéu e cartucheira! Aqui o que vale é o veneno e o olho vivo. Vem!'], ['Ganhou de uma cangaceira. Conte isso nas feiras.'], 840, [[336, 38, ['poisonFang', 'crunch', 'glare', 'bite']], [452, 39, ['crossPoison', 'crunch', 'toxicSpikes', 'poisonFang']]], 'Rota 20')
treinador('sertao_joca', 'Menino Joca', 'menino', 905, 282, 'up', ['Eu sou do mato! Quando tem espinho, é comigo mesmo!'], ['Ai, espinhou! Mas foi bonito.'], 640, [[556, 36, ['pinMissile', 'sandAttack', 'bulletSeed', 'quickAttack']], [332, 37, ['suckerPunch', 'sandstorm', 'pinMissile', 'quickAttack']]], 'Rota 20')
treinador('sertao_cleo', 'Mateira Dona Cleo', {**LOOK_SERT_F, 'cap': '#6a8a5a'}, 942, 260, 'down', ['Ai, que susto! Não pisa no meu canteiro de erva-doce! Se pisou, paga na batalha.'], ['Hum, você tem pulso. Leva um pouco de erva-doce, para dar sorte.'], 760, [[946, 36, ['vineWhip', 'bulletSeed', 'tackle', 'poisonJab']], [951, 37, ['flameCharge', 'bite', 'bulletSeed', 'tackle']]], 'Rota 20')
treinador('sertao_tome', 'Ciclista Tomé', 'menino', 962, 276, 'left', ['Vrum, vrum! Meu Varoom corre mais que o vento. E você?'], ['Queimei o motor… foi mal. Boa batalha!'], 860, [[965, 38, ['quickAttack', 'ironHead', 'bulldoze', 'flameCharge']], [962, 39, ['aerialAce', 'bulldoze', 'drillPeck', 'rockSlide']]], 'Rota 20')
# Cânion do Rio Seco (37–41)
treinador('sertao_rute', 'Alpinista Rute', F2, 645, 300, 'right', ['Subir parede é fácil. Difícil é encarar um Druddigon lá em cima. Vamos treinar?'], ['Um dia ainda escalo como você luta.'], 840, [[627, 38, ['wingAttack', 'aerialAce', 'quickAttack', 'rockSlide']], [621, 40, ['dragonClaw', 'rockSlide', 'slash', 'crunch']]], 'Cânion do Rio Seco')
treinador('sertao_orlando', 'Mineiro Orlando', V, 690, 288, 'down', ['Passei trinta anos cavando. Quero ver se a sua equipe aguenta a poeira!'], ['Você tem aço nas pedras. Eu gosto disso.'], 820, [[950, 39, ['crabhammer', 'rockSlide', 'knockOff', 'stoneEdge']], [112, 40, ['earthquake', 'rockBlast', 'hornAttack', 'stoneEdge']]], 'Cânion do Rio Seco')
treinador('sertao_davi', 'Escalador Davi', 'menino', 745, 330, 'left', ['Aqui no fundo ninguém me incomoda. Quer me incomodar?'], ['Pode me incomodar mais vezes!'], 760, [[610, 37, ['dragonClaw', 'slash', 'crunch', 'rockSlide']], [611, 40, ['dragonClaw', 'crunch', 'rockSlide', 'swordsDance']]], 'Fundo do Cânion')
treinador('sertao_neide', 'Guia Neide', F2, 782, 338, 'up', ['Trilha, mirante, eco… o cânion é meu quintal. Quer ver como ele responde às batalhas?'], ['O eco levou o seu nome. Já já ele volta.'], 800, [[629, 38, ['aerialAce', 'knockOff', 'braveBird', 'quickAttack']], [630, 40, ['airSlash', 'knockOff', 'braveBird', 'darkPulse']]], 'Cânion do Rio Seco')
# Dunas Douradas (39–43)
treinador('sertao_samir', 'Beduíno Samir', V, 900, 310, 'right', ['Quem anda de duna aprende a cair e a levantar. Você sabe cair com estilo?'], ['Caiu com estilo e levantou melhor ainda.'], 880, [[552, 40, ['crunch', 'earthquake', 'sandstorm', 'scaryFace']], [328, 39, ['bulldoze', 'dig', 'crunch', 'sandTomb']]], 'Dunas Douradas')
treinador('sertao_yasmin', 'Cameleira Yasmin', F2, 940, 312, 'down', ['Meus bichos amam areia. E gostam de cuspir nela também. Prepare-se!'], ['Você é duro como pedra. Parabéns.'], 900, [[330, 41, ['dragonBreath', 'earthquake', 'aerialAce', 'dragonClaw']], [968, 40, ['ironHead', 'earthquake', 'rockSlide', 'crunch']]], 'Dunas Douradas')
treinador('sertao_nilo', 'Explorador Nilo', L(hat='cap', cap='#e0b030', capLogo='#8a5a2a', top='#6a8a5a', pants='#8a6a3a', shoes='#4a3428'), 1000, 352, 'left', ['Eu estudo as ruínas, e as ruínas me estudam. Já é hora de a gente se conhecer em batalha.'], ['Você vai bem nas ruínas. Eu vou bem nos livros. Equilíbrio!'], 920, [[622, 40, ['shadowBall', 'earthquake', 'ironHead', 'rockSlide']], [562, 40, ['shadowBall', 'hypnosis', 'psychic', 'knockOff']], [344, 41, ['psychic', 'earthPower', 'shadowBall', 'rockSlide']]], 'Dunas Douradas')
treinador('sertao_kalil', 'Menino Kalil', 'menino', 880, 372, 'up', ['Eu atravessei as dunas a pé! Duas vezes! Só me perdi uma.'], ['Perdi, mas eu continuo atravessando.'], 700, [[28, 41, ['dig', 'slash', 'sandAttack', 'furySwipes']], [330, 42, ['dragonBreath', 'dig', 'aerialAce', 'earthquake']]], 'Dunas Douradas')
# Oásis do Buriti (42–46)
treinador('sertao_jair', 'Pescador Jair', V, 1100, 262, 'right', ['Hoje o Whiscash está esquisito. Será que é da água ou é do meu humor? Vamos descobrir na batalha!'], ['Ganhou de mim e do bigodudo. Muito bem.'], 960, [[339, 42, ['mudShot', 'waterGun', 'earthquake', 'mudSlap']], [340, 45, ['earthquake', 'waterPulse', 'muddyWater', 'bulldoze']]], 'Oásis do Buriti')
treinador('sertao_iris', 'Banhista Íris', 'menina', 1127, 300, 'left', ['O oásis é meu spa! Ninguém me tira daqui sem me ganhar!'], ['Tá bom, tá bom, a água é de todos.'], 940, [[184, 43, ['aquaTail', 'bubbleBeam', 'waterPulse', 'playRough']], [55, 44, ['surf', 'psychic', 'iceBeam', 'zenHeadbutt']]], 'Oásis do Buriti')
treinador('sertao_lourdes', 'Jardineira Lourdes', {**LOOK_SERT_F, 'top': '#4a9a5a'}, 1090, 290, 'up', ['Plantei isso tudo com paciência. Se pisar nas minhas flores, vai ter que enfrentar os meus bichos.'], ['Você tem pé leve. Pode passar.'], 980, [[272, 44, ['energyBall', 'surf', 'bubbleBeam', 'leechSeed']], [192, 43, ['gigaDrain', 'solarBeam', 'sunnyDay', 'bulletSeed']]], 'Oásis do Buriti')
# Chapada Vermelha (45–49)
treinador('sertao_aila', 'Domadora Aíla', F2, 1030, 225, 'right', ['Dragões do sertão têm gênio. Vamos ver se o seu aguenta o calor do meu!'], ['O dragão foi domado… por você.'], 1100, [[371, 45, ['dragonBreath', 'headbutt', 'crunch', 'bite']], [372, 47, ['dragonClaw', 'crunch', 'rockSlide', 'dragonBreath']]], 'Chapada Vermelha')
treinador('sertao_vicente', 'Ornitólogo Vicente', L(hat='cap', cap='#3a6a8a', capLogo='#f2f2f2', top='#e8e0d0', pants='#6a4a34', shoes='#4a3428'), 1075, 218, 'down', ['Passo as manhãs contando asas. Hoje vou contar as suas derrotas!'], ['Contei as asas: o seu Pokémon voou mais alto.'], 1120, [[628, 48, ['braveBird', 'aerialAce', 'crunch', 'roost']], [630, 47, ['airSlash', 'knockOff', 'darkPulse', 'roost']]], 'Chapada Vermelha')
treinador('sertao_cris', 'Escaladora Cris', F2, 1108, 224, 'left', ['O cume é aqui e mais acima só vento. Quer um duelo de altura?'], ['Você chegou lá em cima. Respeito.'], 1140, [[959, 47, ['ironHead', 'rockSlide', 'metalClaw', 'knockOff']], [884, 48, ['dragonClaw', 'flashCannon', 'earthquake', 'ironHead']]], 'Chapada Vermelha')
treinador('sertao_zeca', 'Mestre dos Ventos Zeca', V, 1062, 238, 'up', ['O vento no sertão não pergunta nada. Eu também não. Só luto!'], ['Foi um vento diferente esse. O seu.'], 1180, [[334, 48, ['dragonPulse', 'airSlash', 'roost', 'moonblast']], [148, 46, ['dragonRush', 'aquaTail', 'thunderbolt', 'outrage']]], 'Chapada Vermelha')
# Mangue do Siri (29–33)
treinador('sertao_pita', 'Canoeiro Pita', V, 640, 408, 'down', ['Se está no meu mangue, vai ter que me ganhar no remo ou no Pokémon!'], ['Boa! Pode passar com a canoa.'], 620, [[98, 30, ['bubbleBeam', 'crabhammer', 'knockOff', 'bubble']], [99, 32, ['crabhammer', 'bubbleBeam', 'knockOff', 'slash']]], 'Mangue do Siri')
treinador('sertao_lucio', 'Catador Lúcio', V, 700, 420, 'left', ['Cato caranguejo, cato lama, cato tudo. E também cato derrota dos outros!'], ['Catei uma derrota hoje. Para mim.'], 600, [[341, 30, ['crabhammer', 'knockOff', 'waterGun', 'bubbleBeam']], [195, 32, ['muddyWater', 'earthquake', 'mudShot', 'bulldoze']]], 'Mangue do Siri')
treinador('sertao_bia', 'Menina Bia', 'menina', 760, 415, 'down', ['O mangue é minha casa. Meus Pokémon são meus irmãos!'], ['Meus irmãos perderam, mas aprenderam.'], 560, [[158, 31, ['waterGun', 'bite', 'scaryFace', 'slash']], [61, 32, ['waterPulse', 'bubbleBeam', 'mudShot', 'hypnosis']]], 'Mangue do Siri')
treinador('sertao_tereza', 'Pescadora Tereza', F2, 790, 440, 'left', ['Tarrafa na mão e paciência no peito. Mas hoje quero batalha!'], ['Tarrafei você. E você me tarrafeou. Empate técnico.'], 640, [[339, 30, ['mudSlap', 'waterGun', 'mudShot', 'bulldoze']], [195, 33, ['muddyWater', 'earthquake', 'mudShot', 'waterPulse']]], 'Mangue do Siri')
# Praia do Levante (37–41)
treinador('sertao_kaua', 'Surfista Kauã', 'menino', 900, 436, 'right', ['Mar flat e coração agitado: a combinação perfeita para uma batalha!'], ['Onda boa! Foi tipo pegar um tubo.'], 820, [[73, 39, ['surf', 'sludgeBomb', 'iceBeam', 'bubbleBeam']], [279, 39, ['surf', 'airSlash', 'roost', 'bubbleBeam']]], 'Praia do Levante')
treinador('sertao_marta', 'Salva-vidas Marta', F2, 960, 446, 'up', ['Eu salvo vidas, mas hoje vou salvar você… de uma derrota! Ou não.'], ['Você resistiu. Pode nadar sossegado.'], 860, [[121, 40, ['surf', 'psychic', 'thunderbolt', 'iceBeam']], [87, 39, ['iceBeam', 'surf', 'aquaTail', 'dragonBreath']]], 'Praia do Levante')
treinador('sertao_dudu', 'Turista Dudu', 'menino', 1030, 436, 'down', ['Vim passear e acabei brigando. Que dia! Bora lá!'], ['Nota dez de turismo. E de batalha também.'], 780, [[28, 40, ['dig', 'slash', 'sandAttack', 'furySwipes']], [73, 41, ['surf', 'sludgeBomb', 'iceBeam', 'acidSpray']]], 'Praia do Levante')

# Trio do forró (Vila Mandacaru) e Arena de Areia: batalhas da missão (equipes em src/story/missoes/regiao-sertao.js)
