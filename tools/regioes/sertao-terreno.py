# ---------------------------------------------------------------- TERRENO (Sertão do Levante: [600,200,600,280])
R.c('=== Sertão do Levante: fundo, mar e bordas ===')
R.rect('caatinga', 600, 200, 600, 280)
# solo: manchas de terra rachada e capim seco por todo o fundo, para a caatinga não ficar lisa
R.blobs('cracked', 600, 200, 600, 270, 0.07, 0.66, ['caatinga'])
R.blobs('talldry', 600, 205, 550, 255, 0.08, 0.60, ['caatinga'])

# --- mar a leste (Mar do Levante) com costa irregular e enseadas
R.rect('deep', 1150, 200, 50, 280)
R.poly('water', [[1136, 200], [1150, 200], [1150, 480], [1138, 480], [1132, 440], [1141, 400], [1134, 360], [1142, 320], [1135, 280], [1140, 240]], 1.2)
R.poly('deep', [[1146, 200], [1200, 200], [1200, 480], [1146, 480], [1146, 400], [1150, 340], [1146, 260]], 1.4)
R.poly('sand', [[1118, 262], [1128, 270], [1138, 296], [1130, 330], [1124, 372], [1134, 410], [1122, 440], [1100, 452], [1100, 420], [1112, 380], [1108, 340], [1114, 300]], 1.5, ['caatinga', 'cracked', 'talldry'])
R.poly('wetsand', [[1134, 296], [1140, 320], [1130, 372], [1138, 410], [1130, 440]], 1.0, ['sand', 'caatinga', 'cracked', 'talldry'])
R.rect('sand', 1138, 205, 6, 50, ['caatinga', 'cracked', 'talldry'])
R.ell('water', 1152, 440, 14, 20, 0.8)  # enseada
R.ell('deep', 1160, 440, 14, 18, 0.8)

# --- mar ao sul (Praia do Levante / Rota Marítima 19): areia, recifes, maré, bancos e águas rasas
R.c('praia_levante: Praia do Levante')
R.poly('sand', [[838, 422], [880, 416], [940, 424], [1000, 420], [1060, 424], [1092, 434], [1104, 452], [1092, 466], [838, 468]], 1.4, ['caatinga', 'cracked', 'talldry', 'dune'])
R.poly('wetsand', [[842, 452], [900, 448], [960, 454], [1020, 450], [1088, 460], [1092, 468], [842, 470]], 1.0, ['sand'])
R.poly('water', [[606, 462], [700, 466], [800, 458], [900, 462], [1000, 458], [1100, 462], [1140, 462], [1140, 472], [606, 472]], 1.2)
R.rect('deep', 606, 472, 540, 8)
R.poly('reef', [[880, 462], [930, 458], [990, 462], [1040, 460], [1060, 466], [900, 468]], 0.8, ['water'])
R.poly('tide', [[900, 452], [930, 450], [950, 456], [920, 462], [896, 458]], 0.7, ['sand', 'wetsand', 'water'])
R.poly('tide', [[1010, 452], [1040, 450], [1060, 458], [1030, 464], [1006, 460]], 0.7, ['sand', 'wetsand', 'water'])
R.ell('sand', 980, 468, 22, 5, 0.8, ['water'])      # banco de areia
R.ell('sand', 880, 470, 12, 4, 0.8, ['water'])
# praia: rochedos e coqueiros
R.tree(842, 424, 250, 28, 0.012, ['coqueiro', 'coqueiro', 'palmeira'], ['sand'])
R.tree(842, 430, 250, 28, 0.012, ['boulder2', 'driftwood', 'skull'], ['sand'])

# --- muralha a oeste (divisa com o Núcleo) e ao norte (divisa com a Cordilheira): paredão de cânion
R.c('paredões das divisas')
R.rect('canyon', 600, 212, 3, 204)
R.poly('canyon', [[600, 208], [604, 208], [606, 214], [600, 216]], 0.5)
R.rect('canyon', 607, 200, 413, 2)
R.rect('canyon', 1032, 200, 108, 2)
R.rect('canyon', 600, 212, 2, 2)
# o paredão fica a prumo: tira 2 blocos de erro de ruído na entrada da estrada
R.rect('path', 600, 200, 7, 8)

# ---------------------------------------------------------------- CÂNION DO RIO SECO [620,270,200,90]
R.c('canion_rio_seco: Cânion do Rio Seco')
# paredões (anel) e chão
R.poly('canyon', [[606, 268], [660, 262], [700, 264], [760, 266], [822, 276], [828, 312], [822, 352], [770, 364], [716, 360], [660, 366], [606, 358]], 0.9)
R.poly('redrock', [[613, 275], [660, 269], [700, 271], [760, 273], [816, 283], [821, 312], [816, 346], [770, 357], [716, 353], [660, 359], [613, 351]], 0.9)
R.blobs('cracked', 613, 270, 210, 90, 0.1, 0.68, ['redrock'])
# leito do Rio Seco, serpenteando de oeste a leste
R.path('dryriver', [[613, 318], [650, 306], [690, 322], [730, 312], [770, 326], [800, 306], [826, 300]], 5, 3.0)
R.path('dryriver', [[713, 354], [712, 340], [716, 324]], 3, 1.0)       # afluente do sul
R.set('dryriver', [[640 + i, 333 + (i // 5) % 3] for i in range(30)])
# saídas: leste (para as dunas/Rota 20) e sul (trilha de Vila Siri)
R.rect('redrock', 818, 296, 12, 9)
R.rect('dryriver', 818, 298, 14, 5)
R.path('redrock', [[713, 356], [713, 372]], 4, 0.6)
# subidas por trepadeira: do mirante norte para o cânion e do cânion para a beira da Rota 20
R.rect('climb', 689, 262, 4, 11)
R.rect('climb', 760, 266, 4, 9)
R.rect('climb', 630, 262, 3, 10)
# fundo do cânion: bacia mais baixa com paredões próprios, só se entra escalando
R.c('fundo_canion: Fundo do Cânion (escondido)')
R.poly('canyon', [[682, 302], [716, 297], [760, 299], [792, 306], [794, 336], [756, 343], [716, 341], [684, 336]], 0.6)
R.poly('dryriver', [[687, 307], [716, 302], [760, 304], [787, 310], [789, 331], [756, 338], [716, 336], [689, 331]], 0.6)
R.blobs('redrock', 687, 303, 105, 36, 0.14, 0.6, ['dryriver'])
R.rect('climb', 726, 297, 4, 8)     # entrada de cima
R.rect('climb', 790, 316, 5, 4)     # entrada leste
# mirante (pedra plana no alto, sobre o cânion)
R.ell('oldstone', 646, 263, 4, 2, 0.4)

# ---------------------------------------------------------------- CHAPADA VERMELHA [990,200,150,50]
R.c('chapada_vermelha: Chapada Vermelha')
R.poly('canyon', [[984, 216], [1000, 206], [1060, 203], [1142, 203], [1142, 242], [1110, 252], [1050, 252], [1004, 250], [984, 242]], 0.8)
R.poly('redrock', [[991, 220], [1004, 210], [1060, 207], [1138, 207], [1138, 238], [1108, 246], [1050, 246], [1008, 244], [991, 238]], 0.8)
R.blobs('cracked', 990, 205, 150, 46, 0.12, 0.66, ['redrock'])
# mesas (blocos de paredão) com vãos entre elas
for (mx, my, mw, mh) in [(1000, 222, 8, 5), (1040, 214, 10, 6), (1072, 224, 9, 5), (1100, 214, 11, 5), (1115, 230, 8, 5), (1056, 236, 7, 4)]:
    R.poly('canyon', [[mx, my + 1], [mx + mw // 2, my], [mx + mw, my + 1], [mx + mw, my + mh], [mx, my + mh]], 0.5, ['redrock', 'cracked'])
# o Desfiladeiro Branco (trepadeira) sobe pelo norte e a subida da Chapada vem de Buriti, pelo sul
R.rect('climb', 1052, 244, 4, 12)
R.rect('climb', 1019, 244, 4, 12)
R.rect('climb', 1020, 200, 12, 16)

# ---------------------------------------------------------------- DUNAS DOURADAS [860,290,200,100] + CRATERA DA ESTRELA
R.c('dunas_douradas: Dunas Douradas')
R.poly('dune', [[852, 322], [880, 296], [930, 290], [990, 292], [1044, 302], [1066, 336], [1058, 376], [1030, 396], [960, 398], [900, 392], [866, 366]], 1.6)
R.blobs('sand', 855, 292, 215, 105, 0.16, 0.62, ['dune'])
R.blobs('dune', 855, 292, 215, 105, 0.07, 0.5, ['sand'])
# poços de areia movediça
R.ell('quicksand', 905, 340, 9, 6, 0.9, ['dune', 'sand'])
R.ell('quicksand', 1010, 330, 8, 7, 0.9, ['dune', 'sand'])
R.ell('quicksand', 985, 378, 10, 5, 0.9, ['dune', 'sand'])
# Cratera da Estrela: tigela escurecida por um meteoro, borda de obsidiana
R.c('cratera_estrela: Cratera da Estrela (escondida)')
R.ell('obsidian', 945, 345, 17, 16, 0.7)
R.ell('cracked', 945, 345, 14, 13, 0.7)
R.ell('ash', 945, 345, 9, 8, 0.8)
R.ell('obsidian', 945, 345, 3, 3, 0.4)
# entrada das Ruínas de Pedra Pintada: fachada de pedra no flanco leste da cratera
R.stamp(953, 347, [
    'HHHHHHHHHHHHH',
    'HHHHHHHHHHHHH',
    'HHHHHHHHHHHHH',
    'HHHHHHOOHHHHH',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX'])
R.ell('oldstone', 959, 356, 9, 3, 0.5, ['dune', 'sand'])

# ---------------------------------------------------------------- RAMPA E OÁSIS DO BURITI [1080,250,60,50]
R.c('oasis_buriti: Oásis do Buriti')
R.ell('grass', 1110, 278, 33, 26, 0.7)
R.ell('grass2', 1110, 278, 25, 20, 0.7)
R.blobs('tall', 1080, 252, 62, 48, 0.12, 0.64, ['grass', 'grass2'])
R.ell('water', 1112, 280, 15, 10, 0.5)
R.ell('shallow', 1112, 280, 18, 13, 0.5, ['grass', 'grass2'])
R.blobs('reed', 1090, 262, 44, 36, 0.2, 0.66, ['shallow'])
R.scatter('flowers', 1082, 254, 58, 46, 0.04, ['grass', 'grass2'])

# ---------------------------------------------------------------- MANGUE DO SIRI [600,390,220,86] + Vila Siri
R.c('mangue_siri: Mangue do Siri')
R.poly('mangmud', [[606, 392], [650, 386], [720, 394], [790, 384], [822, 396], [830, 440], [820, 466], [760, 470], [700, 466], [640, 470], [606, 462]], 1.2)
R.poly('shallow', [[606, 404], [660, 400], [730, 410], [800, 402], [826, 420], [828, 450], [800, 462], [740, 464], [680, 456], [630, 462], [606, 452]], 1.3, ['mangmud'])
R.blobs('mangmud', 606, 392, 220, 78, 0.12, 0.55, ['shallow'])
R.blobs('reed', 606, 392, 220, 78, 0.16, 0.64, ['shallow'])
R.blobs('roots', 606, 392, 222, 78, 0.22, 0.72, ['mangmud', 'shallow'])
R.blobs('tide', 606, 396, 220, 70, 0.14, 0.74, ['mangmud'])
# a Costa do Siri é água funda nas 4 colunas de oeste (passagem): o mangue só começa depois
R.rect('deep', 600, 416, 5, 62)
# ilhota da Toca de Luz (kingler) sempre seca
R.ell('mangmud', 660, 432, 8, 6, 0.4)
R.ell('sand', 660, 432, 4, 3, 0.3)

# ---------------------------------------------------------------- CAATINGA: Rota 14 e Rota 20
R.c('rota14: Rota 14 — Estrada do Sertão')
R.ell('cracked', 700, 250, 28, 8, 0.7, ['caatinga', 'talldry'])
R.c('rota20: Rota 20 — Caatinga do Lajedo')
# lajedos: lajes de pedra lisa
for (lx, ly, lrx, lry) in [(850, 266, 14, 5), (905, 276, 12, 5), (930, 258, 10, 4), (880, 232, 16, 6), (850, 215, 11, 5), (945, 232, 9, 4)]:
    R.ell('cracked', lx, ly, lrx, lry, 0.9)
    R.ell('oldstone', lx + 1, ly, max(2, lrx - 6), max(1, lry - 3), 0.7)
# açude seco no meio do lajedo
R.ell('cracked', 925, 215, 16, 7, 0.9)
