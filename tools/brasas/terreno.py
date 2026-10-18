# Terreno do Arquipélago das Brasas: contorno das ilhas, praias, zonas e o chão de cada área do plano.
import math
import numpy as np
from base import *
from layout import PREDIOS, PONTOS

BASALTO = [(846, 628), (852, 614), (868, 606), (890, 602), (912, 604), (930, 610), (944, 622), (950, 640), (947, 658), (938, 672),
           (920, 680), (895, 681), (872, 676), (856, 664), (846, 648)]
FORNALHA = [(962, 650), (966, 636), (978, 627), (992, 623), (1008, 627), (1022, 621), (1042, 616), (1064, 614), (1086, 618), (1103, 627),
            (1112, 641), (1113, 658), (1108, 674), (1112, 690), (1104, 702), (1100, 716), (1104, 730), (1112, 744), (1124, 756), (1138, 768),
            (1142, 786), (1143, 806), (1141, 828), (1136, 850), (1124, 866), (1106, 876), (1084, 879), (1060, 880), (1036, 877), (1014, 869),
            (1000, 856), (992, 840), (990, 822), (992, 804), (996, 786), (990, 772), (976, 766), (958, 758), (944, 744), (932, 728), (930, 712),
            (940, 702), (952, 692), (958, 678), (960, 664)]
CR = (1065, 820, 26, 21)           # cratera do Tição: centro e raios (blocos)
LAGO = (1080, 825, 8, 6)           # lago de lava dentro da cratera (ilha do ninho de Moltres no meio)


def ilhota_poly(cx, cy, r, semente, n=28):
    rng = np.random.default_rng(semente)
    ph = rng.random(3) * 6.28
    pts = []
    for i in range(n):
        a = i / n * 6.2832
        k = 1 + 0.10 * math.sin(3 * a + ph[0]) + 0.07 * math.sin(5 * a + ph[1]) + 0.04 * math.sin(8 * a + ph[2])
        pts.append((cx + math.cos(a) * r * k, cy + math.sin(a) * r * k))
    return pts


def angulo(cx, cy):
    yy, xx = np.mgrid[0:H, 0:W]
    return np.degrees(np.arctan2(yy + Y0 - cy, xx + X0 - cx))   # 0 = leste, 90 = sul, -90 = norte


def entre(a, lo, hi):
    return (a >= lo) & (a <= hi)


def trilha(G, pts, larg=2, ch='=', semente=1, ruido=0.8, sobre=None, ponte='B', agua_ponte=('q', 'l', '~', 'W'), proteger=None):
    m = faixa(pts, larg, ruido=ruido, semente=semente)
    if sobre is not None:
        m &= sobre
    ag = np.isin(G, agua_ponte)
    G[m & ag] = ponte
    ok = m & ~ag & (G != 'F') & (G != 'H') & (G != 'O')
    if proteger is not None:
        ok &= ~proteger
    G[ok] = ch
    return m


def construir():
    G = novo()
    info = {}
    # ------------------------------------------------------------ massas de terra
    m_bas = poligono(BASALTO, ruido=1, semente=11, amp=2.5)
    m_for = poligono(FORNALHA, ruido=1, semente=12, amp=2.5)
    m_ilhota = poligono(ilhota_poly(1170, 920, 19, 5), ruido=1, semente=13, amp=1.5)
    bancos = [  # (id, cx, cy, rx, ry, semente)
        ('gaivotas', 872, 522, 10, 5, 21), ('farol', 1040, 539, 9, 6, 22), ('naufragio', 965, 557, 9, 4.5, 23),
        ('tartarugas', 1106, 521, 11, 5, 24), ('pedra_sul', 1152, 562, 7, 4, 25), ('albatroz', 880, 906, 10, 5, 26),
        ('naufragio2', 942, 930, 13, 6, 27), ('recife_v', 1090, 940, 9, 4, 28), ('sentinela', 1002, 905, 6, 4, 29),
    ]
    m_banco = {}
    for nome, cx, cy, rx, ry, s in bancos:
        m_banco[nome] = elipse(cx, cy, rx, ry, ruido=0.35, semente=s)
    terra = m_bas | m_for | m_ilhota
    for m in m_banco.values():
        terra |= m
    info.update(m_bas=m_bas, m_for=m_for, m_ilhota=m_ilhota, m_banco=m_banco, terra=terra)

    # ------------------------------------------------------------ mar: água rasa em volta de tudo
    d_out = exterior(terra, 6)
    G[(d_out >= 1) & (d_out <= 3)] = '~'
    n_mar = fbm(3, (20, 10), (0.6, 0.4))
    G[(d_out == 4) & (n_mar > 0.55)] = '~'

    # ------------------------------------------------------------ recifes (andáveis) e correntezas
    recifes = [(922, 493, 22, 6), (1080, 566, 8, 4), (1140, 610, 6, 5), (930, 700, 5, 4), (1030, 925, 12, 5), (860, 940, 9, 4), (1122, 900, 7, 4)]
    for i, (cx, cy, rx, ry) in enumerate(recifes):
        m = elipse(cx, cy, rx, ry, ruido=0.5, semente=40 + i) & ~terra
        G[m] = '%'
        G[m & (n_mar > 0.7)] = '~'
    correntes = [
        ('↓', [(905, 503), (910, 530), (904, 560), (900, 590)], 3),
        ('→', [(955, 497), (1010, 499), (1060, 497)], 3),
        ('↓', [(1130, 582), (1136, 610), (1126, 640)], 3),
        ('→', [(1000, 944), (1050, 948), (1110, 944)], 3),
        ('↑', [(1160, 880), (1164, 860), (1172, 840)], 3),
    ]
    for i, (ch, pts, larg) in enumerate(correntes):
        m = faixa(pts, larg, ruido=1.2, semente=60 + i) & ~terra & (G != '%')
        G[m] = ch

    # ------------------------------------------------------------ bancos de areia
    for nome, m in m_banco.items():
        d = interior(m, 8)
        G[m] = ':'
        G[m & (d == 1)] = 'A'
        if nome == 'farol':
            G[m & (d >= 3)] = 'v'
            G[m & (d >= 4) & (fbm(70, (6, 3), (0.6, 0.4)) > 0.55)] = 'o'
        elif nome in ('naufragio', 'naufragio2', 'albatroz'):
            G[m & (d >= 3) & (fbm(71, (8, 4), (0.6, 0.4)) > 0.6)] = '.'
        elif nome in ('tartarugas', 'recife_v', 'pedra_sul', 'gaivotas'):
            G[m & (d >= 3) & (fbm(72, (8, 4), (0.6, 0.4)) > 0.62)] = ','
        elif nome == 'sentinela':
            G[m & (d >= 2)] = 'v'

    # ------------------------------------------------------------ Ilha do Basalto (praia de areia preta)
    d_b = interior(m_bas, 40)
    n1 = fbm(80); n2 = fbm(81, (20, 10, 5), (0.5, 0.3, 0.2)); n3 = fbm(82, (10, 5), (0.6, 0.4))
    G[m_bas] = 'v'
    G[m_bas & (d_b == 1)] = 'A'
    G[m_bas & (d_b == 2) & (n3 > 0.45)] = 'A'
    G[m_bas & (d_b >= 2) & (d_b <= 4) & (n3 <= 0.45) & (n2 > 0.5)] = ':'
    G[m_bas & (d_b >= 6) & (n1 > 0.58)] = 'a'
    G[m_bas & (d_b >= 7) & (n2 > 0.66)] = 'o'
    clar = elipse(900, 618, 17, 9, ruido=0.3, semente=83) & m_bas & (d_b >= 3)
    G[clar] = '.'
    G[clar & (fbm(84, (6, 3), (0.6, 0.4)) > 0.5)] = ','
    G[clar & (fbm(85, (4, 2), (0.6, 0.4)) > 0.72)] = '*'
    G[elipse(900, 619, 5, 3.2, ruido=0.1, semente=86) & clar] = 'P'
    mato = m_bas & (d_b >= 5) & (fbm(87, (12, 6), (0.6, 0.4)) > 0.56) & ~clar & (G != 'o')
    G[mato] = '"'
    G[m_bas & (d_b >= 5) & (d_b <= 9) & (n1 < 0.34) & ~clar & (G == 'v')] = ','
    # trilhas da ilha: do cais leste ao morro de Tapu Lele e à cabana do sul
    trilha(G, [(955, 641), (940, 641), (925, 645), (912, 640), (900, 632), (900, 622)], 2, '=', semente=90)
    trilha(G, [(925, 645), (922, 656), (912, 664)], 2, '=', semente=91)
    trilha(G, [(940, 641), (936, 633), (932, 631)], 1, '=', semente=92)
    info['d_b'] = d_b; info['clar_b'] = clar

    # ------------------------------------------------------------ Ilha da Fornalha: zonas
    d_f = interior(m_for, 40)
    yy_, xx_ = np.mgrid[0:H, 0:W]
    AX = xx_ + X0; AY = yy_ + Y0
    curva = 700 + 9 * np.sin(AX / 8.0) + 6 * np.sin(AX / 3.7 + 2) + 14 * (fbm(100, (30, 14, 6), (0.5, 0.3, 0.2)) - 0.5)
    dn0 = eliptica_d(*CR)
    claro = m_for & (AY < curva)
    vulcao = m_for & ~claro & ((dn0 < 2.05 + 0.15 * (fbm(101, (12, 6), (0.6, 0.4)) - 0.5)) | (AY > 792))
    campos = m_for & ~claro & ~vulcao
    corte = 1020 + 9 * (fbm(102, (14, 7), (0.6, 0.4)) - 0.5)
    Z = {'vila': claro & (AX < corte), 'fontes': claro & (AX >= corte), 'campos': campos, 'vulcao': vulcao}
    info['Z'] = Z; info['d_f'] = d_f
    g1 = fbm(110); g2 = fbm(111, (14, 7), (0.6, 0.4)); g3 = fbm(112, (8, 4), (0.6, 0.4))

    # --- Vila e Fontes: capim e praia clara
    G[m_for & claro] = '.'
    G[m_for & claro & (g2 > 0.55)] = ','
    G[m_for & claro & (d_f == 1)] = 'A'
    G[m_for & claro & (d_f >= 2) & (d_f <= 3)] = ':'
    G[m_for & claro & (d_f == 4) & (g3 > 0.5)] = ':'
    G[m_for & claro & (d_f >= 5) & (g3 > 0.84)] = '*'

    # --- Campos de Cinza
    c = Z['campos']
    G[c] = 'a'
    G[c & (g1 > 0.52)] = 'v'
    G[c & (g2 > 0.74)] = 'o'
    G[c & (d_f == 1)] = 'v'
    G[c & (d_f == 2) & (g3 > 0.4)] = 'v'

    # --- Vulcão
    v = Z['vulcao']
    G[v] = 'v'
    G[v & (g1 > 0.5)] = 'a'
    G[v & (g2 > 0.78)] = 'o'
    G[v & (d_f == 1) & (g3 > 0.45)] = 'o'

    # ------------------------------------------------------------ Fontes Termais do Vapor
    f = Z['fontes']
    G[f & (g3 > 0.62) & (d_f >= 5)] = '"'
    piscinas = [(1058, 646, 6, 4), (1071, 653, 5, 3.4), (1049, 660, 5, 3.4), (1067, 664, 7, 4.4), (1083, 668, 5, 3.4), (1054, 677, 6, 4.2),
                (1073, 682, 6, 4), (1093, 654, 4, 3), (1097, 673, 5, 3.4), (1038, 668, 4, 3), (1085, 640, 4, 2.6)]
    info['piscinas'] = piscinas
    for i, (cx, cy, rx, ry) in enumerate(piscinas):
        borda = elipse(cx, cy, rx + 1.8, ry + 1.5, ruido=0.12, semente=120 + i) & m_for
        dentro = elipse(cx, cy, rx, ry, ruido=0.12, semente=140 + i) & m_for
        G[borda & (G != 'q')] = ';'
        G[dentro] = 'q'
    G[f & (g1 > 0.6) & (G == '.')] = ';'
    mir = elipse(1098, 636, 9, 5.5, ruido=0.2, semente=160) & m_for & (d_f >= 3)
    G[mir] = '#'
    G[elipse(1098, 637, 6.5, 3.2, ruido=0.2, semente=161) & mir] = ','
    info['mirante'] = mir

    # ------------------------------------------------------------ Campos de Cinza: crateras do Camerupt
    crateras = [(955, 722, 6, 4), (975, 748, 7, 4.5), (1030, 722, 8, 5), (1086, 733, 7, 4.5), (1003, 714, 5, 3.4), (1062, 746, 6, 4)]
    info['crateras'] = crateras
    for i, (cx, cy, rx, ry) in enumerate(crateras):
        anel = elipse(cx, cy, rx + 1.6, ry + 1.3, ruido=0.15, semente=170 + i) & m_for
        meio = elipse(cx, cy, rx * 0.62, ry * 0.62, ruido=0.2, semente=180 + i) & m_for
        G[anel] = 'o'
        G[elipse(cx, cy, rx, ry, ruido=0.15, semente=190 + i) & m_for] = 'v'
        G[meio] = 'l'
    # rios de cinza: leitos escuros no meio dos campos
    for i, pts in enumerate([[(940, 735), (975, 728), (1010, 740), (1040, 735)], [(1060, 705), (1075, 722), (1100, 740)]]):
        m = faixa(pts, 3, ruido=1.5, semente=200 + i) & c & (G == 'a')
        G[m] = 'v'

    # ------------------------------------------------------------ transição entre zonas (cinza invade o capim e vice-versa)
    tr = fbm(230, (10, 5, 3), (0.5, 0.3, 0.2))
    borda_v = m_for & claro & (G == '.') & (d_f > 4)
    perto_campos = exterior(Z['campos'], 7) <= 5
    G[borda_v & perto_campos & (tr > 0.62)] = 'a'
    G[borda_v & perto_campos & (tr > 0.78)] = 'o'
    G[Z['campos'] & (exterior(claro & m_for, 7) <= 5) & (tr > 0.66) & (G == 'a')] = ','
    G[Z['campos'] & (exterior(claro & m_for, 7) <= 3) & (tr > 0.72)] = '"'

    # ------------------------------------------------------------ Vulcão Tição: terraços, cratera, rios de lava
    dn = eliptica_d(*CR)
    ang = angulo(CR[0], CR[1])
    cone = m_for & (dn < 2.05)
    mistura = np.where(g1 > 0.5, 'a', 'v')
    sel = cone & ~(Z['campos'] & (dn > 1.7))
    G[sel] = mistura[sel]
    # curvas de nível (penhascos orgânicos) a partir do ruído: terraços na encosta
    alt = fbm(240, (40, 20, 10), (0.5, 0.3, 0.2))
    contorno = (np.abs(((alt * 9) % 1.0) - 0.5) < 0.05) & (dn > 1.2) & (dn < 2.7) & m_for & (d_f > 3) & ~Z['campos']
    abre = fbm(241, (7, 3), (0.6, 0.4)) > 0.46
    G[contorno & ~abre & (G != 'l')] = '#'
    # anel externo (penhasco com passagens)
    anel2 = m_for & (dn >= 1.82) & (dn <= 1.92)
    passagens2 = entre(ang, -105, -75) | entre(ang, 75, 105) | entre(ang, -12, 14) | entre(ang, 160, 190)
    G[anel2 & ~passagens2] = '#'
    G[anel2 & passagens2 & (G == '#')] = 'v'
    # cones de cinza menores nas encostas (lavas antigas)
    for i, (cx, cy, rx, ry) in enumerate([(1010, 790, 5, 3.5), (1118, 800, 5, 3.5), (1018, 848, 4, 3), (1098, 856, 4.5, 3), (1135, 760, 3.5, 3)]):
        G[elipse(cx, cy, rx + 1.5, ry + 1.2, ruido=0.2, semente=250 + i) & m_for] = 'o'
        G[elipse(cx, cy, rx, ry, ruido=0.2, semente=260 + i) & m_for] = 'v'
        G[elipse(cx, cy, rx * 0.55, ry * 0.55, ruido=0.2, semente=270 + i) & m_for] = 'l'
    # borda da cratera (muro)
    rim = (dn >= 1.0) & (dn <= 1.12) & m_for
    G[rim] = '#'
    G[rim & entre(ang, -150, -138)] = 'V'          # cipós de escalada: noroeste (principal)
    G[rim & entre(ang, 22, 28)] = 'V'              # e leste (escondida)
    # bacia da cratera
    bacia = m_for & (dn < 1.0)
    G[bacia] = 'v'
    G[bacia & (fbm(210, (8, 4), (0.6, 0.4)) > 0.55)] = 'a'
    lago = elipse(*LAGO, ruido=0.1, semente=211)
    G[lago] = 'l'
    G[bacia & (exterior(lago, 2) > 0) & (exterior(lago, 2) <= 1)] = 'o'
    ilha = elipse(LAGO[0], LAGO[1] - 0.5, 2.6, 2.1, ruido=0.1, semente=212)
    G[ilha] = 'o'
    info['lago'] = lago; info['ilha_moltres'] = ilha; info['bacia'] = bacia
    # fachada do Templo da Chama (centrada em x=1060, porta em (1060, 819))
    carimbo(G, 1056, 817, ['HHHHHHHHH', 'HHHHHHHHH', 'HHHHOHHHH'])
    carimbo(G, 1056, 820, ['EEEEEEEEE', ' EEEEEEE '])
    # rios de lava descendo da cratera e fluxos finos nas encostas
    rios = [
        [(1092, 822), (1106, 828), (1114, 842), (1110, 858), (1114, 872), (1112, 882)],
        [(1040, 828), (1030, 842), (1026, 856), (1032, 868), (1030, 882)],
        [(1010, 790), (1006, 804), (998, 818)],
        [(1118, 800), (1126, 812), (1132, 826), (1134, 842)],
        [(1098, 856), (1092, 868), (1096, 880)],
    ]
    for i, pts in enumerate(rios):
        larg = 3 if i < 2 else 2
        mm = faixa(pts, larg + 2, ruido=1.0, semente=220 + i) & m_for
        G[mm & np.isin(G, ['v', 'a', '#'])] = 'o'
        m = faixa(pts, larg, ruido=1.0, semente=220 + i) & m_for
        G[m & (G != 'V') & (G != 'H') & (G != 'E')] = 'l'
    # ------------------------------------------------------------ Ilhota Fumegante (termal, só por cima)
    di = interior(m_ilhota, 30)
    G[m_ilhota] = '.'
    G[m_ilhota & (fbm(280, (8, 4), (0.6, 0.4)) > 0.55)] = ','
    G[m_ilhota & (di <= 2)] = '#'
    G[m_ilhota & (di == 1) & (fbm(281, (5, 3), (0.6, 0.4)) > 0.7)] = 'A'
    G[m_ilhota & (di >= 3) & (di <= 4) & (fbm(282, (6, 3), (0.6, 0.4)) > 0.5)] = ';'
    G[elipse(1170, 921, 8, 6, ruido=0.2, semente=283) & m_ilhota] = ';'
    G[elipse(1170, 921, 5.5, 4, ruido=0.2, semente=284) & m_ilhota] = 'q'
    G[elipse(1170, 921, 1.8, 1.5) & m_ilhota] = 'o'
    for i, (cx, cy) in enumerate([(1160, 912), (1181, 912), (1160, 930), (1182, 929)]):
        G[elipse(cx, cy, 3.2, 2.6, ruido=0.1, semente=285 + i) & m_ilhota & (di >= 4)] = 'q'
    info['m_ilhota_d'] = di
    # ------------------------------------------------------------ trilhas
    # boulevard da Vila ao pier e aos Campos; estrada da vila
    T = []
    T.append(trilha(G, [(989, 626), (989, 640)], 3, '=', semente=300, ruido=0))
    T.append(trilha(G, [(964, 648), (1022, 648)], 2, '=', semente=301, ruido=0))
    T.append(trilha(G, [(964, 658), (987, 658)], 2, '=', semente=302, ruido=0))
    T.append(trilha(G, [(993, 658), (1019, 658)], 2, '=', semente=303, ruido=0))
    T.append(trilha(G, [(964, 670), (1019, 670)], 2, '=', semente=304, ruido=0))
    T.append(trilha(G, [(989, 640), (989, 700), (996, 716), (1016, 732), (1040, 748), (1050, 764), (1050, 780)], 3, '=', semente=305, ruido=0.7))
    # Fontes: sobe pela borda dos terraços (pontes de tábua sobre as piscinas)
    T.append(trilha(G, [(1021, 648), (1034, 647), (1042, 652), (1044, 662), (1048, 670), (1058, 671), (1062, 677), (1066, 688), (1066, 700)], 2, '=', semente=306, ruido=0.6))
    T.append(trilha(G, [(1066, 688), (1086, 690), (1100, 684)], 2, '=', semente=307, ruido=0.6))
    T.append(trilha(G, [(1044, 652), (1062, 640), (1080, 646), (1090, 642), (1096, 640)], 2, '=', semente=308, ruido=0.6))
    # estrada em volta do vulcão (cruza os rios por pontes)
    T.append(trilha(G, [(1050, 780), (1034, 790), (1012, 806), (1004, 830), (1014, 858), (1040, 866), (1070, 868), (1100, 864), (1124, 848), (1130, 822), (1124, 794), (1112, 770), (1100, 752)], 3, '=', semente=309, ruido=0.8))
    # subida pelo flanco norte até o muro da cratera (a escada sobe o paredão de cipós)
    T.append(trilha(G, [(1050, 780), (1046, 792), (1040, 800), (1044, 806)], 2, '=', semente=310, ruido=0.3, proteger=rim))
    # pier norte
    ponte = faixa([(989, 611), (989, 626)], 3)
    G[ponte & (G != '=')] = 'D'
    info['T'] = T
    # píer do Basalto (leste) e cais
    G[retangulo(950, 640, 7, 2)] = 'D'
    return G, info
