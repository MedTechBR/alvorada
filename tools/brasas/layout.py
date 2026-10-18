# Posições fixas da região (absolutas): prédios, pontos nomeados, entradas. Usado pelo terreno e pelos objetos.

# kind, x, y, fw, porta (coluna da porta na última linha)
PREDIOS = {
    # --- Vila Termas
    'centro': ('center', 967, 644, 9, 4),
    'mercado': ('mart', 978, 644, 7, 3),
    'banhos': ('casarao', 993, 642, 10, 5),
    'pousada': ('cabin', 1005, 645, 5, 2),
    'casa_n3': ('housePink', 1012, 644, 7, 3),
    'forja': ('houseStone', 967, 654, 7, 3),
    'dra_lava': ('houseGlass', 977, 654, 7, 3),
    'casa_l1': ('houseYellow', 998, 654, 7, 3),
    'casa_l2': ('houseB', 1008, 654, 7, 3),
    'casa_s1': ('houseA', 966, 666, 7, 3),
    'casa_s2': ('houseC', 976, 666, 7, 3),
    'casa_s3': ('taipa', 998, 667, 5, 2),
    'casa_s4': ('houseBlue', 1008, 666, 7, 3),
    # --- Ilha do Basalto
    'barqueiro_basalto': ('cabin', 930, 629, 5, 2),
    'pescador': ('taipa', 918, 652, 5, 2),
    'armazem': ('houseStone2', 902, 641, 7, 3),
    # --- Ilhote do Farol
    'farol': ('farol', 1038, 533, 4, 2),
}

# pontos nomeados (global no mundo: prefixo brasas_)
PONTOS = {
    'ninho_vila_termas': (990, 661, 'down'),
    'cais_termas': (989, 613, 'up'),
    'cais_basalto': (955, 641, 'left'),
    'ninho_ilha_basalto': (924, 646, 'down'),
    'ninho_vulcao': (1047, 792, 'down'),
}
