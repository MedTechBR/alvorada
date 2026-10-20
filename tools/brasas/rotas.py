# Rotas e áreas selvagens das Brasas: enfeites, itens no chão, Tocas de Luz, treinadores e o roteiro deles.
import json, os
import numpy as np
from base import *
from cena import *
from catalogo import ITENS, RAIZ

CAMINHA = set('.,=P*:Aavo;"')
SEM_TRILHA = set('.,P*:Aavo;"')


def escolhe(C, G, mask, n, seed, sep=4, chao=SEM_TRILHA, evitar=None):
    rr = Sorteio(seed)
    ys, xs = np.nonzero(mask)
    if len(xs) == 0:
        return []
    out = []
    tent = 0
    while len(out) < n and tent < n * 60:
        tent += 1
        k = rr.i(0, len(xs) - 1)
        x, y = int(xs[k]) + X0, int(ys[k]) + Y0
        if G[y - Y0, x - X0] not in chao or C.ocup[y - Y0, x - X0]:
            continue
        if any(abs(x - a) < sep and abs(y - b) < sep for a, b in out):
            continue
        out.append((x, y))
    return out


def snap(C, G, x, y, r=6, chao=CAMINHA):
    best, bd = None, 1e9
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            xx, yy = x + dx, y + dy
            if not (X0 <= xx < X0 + W and Y0 <= yy < Y0 + H):
                continue
            if G[yy - Y0, xx - X0] in chao and not C.ocup[yy - Y0, xx - X0]:
                d = dx * dx + dy * dy
                if d < bd:
                    best, bd = (xx, yy), d
    return best


def direcao(G, x, y, alcance=8):
    melhor, mv = 'down', -1
    for nome, (dx, dy) in {'down': (0, 1), 'up': (0, -1), 'left': (-1, 0), 'right': (1, 0)}.items():
        n = 0
        for k in range(1, alcance + 1):
            xx, yy = x + dx * k, y + dy * k
            if not (X0 <= xx < X0 + W and Y0 <= yy < Y0 + H) or G[yy - Y0, xx - X0] not in CAMINHA:
                break
            n += 1
        # prefere olhar para a trilha mais próxima
        bonus = 0
        for k in range(1, alcance + 1):
            xx, yy = x + dx * k, y + dy * k
            if X0 <= xx < X0 + W and Y0 <= yy < Y0 + H and G[yy - Y0, xx - X0] == '=':
                bonus = 3
                break
        if n + bonus > mv:
            melhor, mv = nome, n + bonus
    return melhor


# ---------------------------------------------------------------- treinadores: (id, nome, look, aprox, area, equipe, fala, apos)
# look: chave de LOOKS (elenco.js) ou de OLHARES (abaixo)
TREINADORES = [
    # ---- Rota Marítima 19 (selvagens 38–42): nadadores nos bancos de areia
    ('br_r19_caua', 'Nadador Cauã', 'nadador', (872, 522), 'rota19', [[73, 38, ['surf', 'sludgeBomb']], [320, 39, ['waterPulse', 'rest']]],
     'Quem nada até aqui merece um mergulho de boas-vindas! Vamos ver se você segura a maré!', ['O mar daqui é frio e a correnteza muda de humor. Siga as boias e não se afaste do recife.']),
    ('br_r19_isa', 'Nadadora Isa', 'nadadora', (1106, 521), 'rota19', [[121, 40, ['surf', 'psychic']], [119, 38, ['waterPulse', 'megahorn']]],
     'Este banco de areia é minha praia particular. O ingresso é uma batalha!', ['As tartarugas desovam aqui nesta época. Se encontrar um ovo, deixe quieto, hein?']),
    ('br_r19_nestorio', 'Pescador Nestório', 'pescador', (965, 557), 'rota19', [[689, 39, ['rockSlide', 'waterPulse']], [211, 38, ['waterPulse', 'sludgeBomb']], [130, 40, ['aquaTail', 'crunch']]],
     'Perdi três anzóis neste naufrágio e quero uma revanche com o mar. Pode ser com você?', ['O naufrágio ainda guarda coisa boa. Mas é de quem achar primeiro.']),
    ('br_r19_pedro', 'Marujo Pedro', 'marujo', (1040, 541), 'rota19', [[279, 40, ['surf', 'airSlash']], [278, 38, ['airSlash', 'waterPulse']]],
     'Cuido do Farol das Brasas! Ninguém passa sem treinar com o vigia do mar!', ['Quando o vulcão ronca, as gaivotas somem. Quando elas voltam, é seguro navegar.']),
    ('br_r19_kai', 'Surfista Kai', 'surfista', (1152, 562), 'rota19', [[419, 40, ['surf', 'crunch']], [130, 41, ['aquaTail', 'crunch']]],
     'A onda está perfeita e o dia também! Vamos surfar nos golpes!', ['A onda mais bonita é a que quebra no basalto. Tem espuma preta e dourada.']),
    # ---- Ilha do Basalto (36–40)
    ('br_b_beto', 'Catador Beto', 'pescador', (880, 631), 'ilha_basalto', [[557, 35, ['rockTomb', 'xScissor']], [558, 37, ['rockSlide', 'xScissor']]],
     'Catei tantas conchas hoje! Vem ver se eu também luto bem!', ['Os Crustle daqui carregam pedra de lava nas costas. É pesado, mas eles gostam.']),
    ('br_b_rosa', 'Banhista Rosa', 'banhista', (868, 652), 'ilha_basalto', [[80, 38, ['waterPulse', 'psychic']], [120, 36, ['waterPulse', 'psychic']]],
     'A areia preta queima o pé, mas o mar ajuda. Quer treinar?', ['Se estiver muito quente, molhe os pés.']),
    ('br_b_davi', 'Surfista Davi', 'surfista', (857, 634), 'ilha_basalto', [[320, 37, ['waterPulse', 'rest']], [419, 38, ['surf', 'crunch']]],
     'Não tem onda sem desafio! Prepare a prancha e os golpes!', ['A prancha preta é de basalto polido. Fui eu que fiz, e quebrou três vezes.']),
    ('br_b_joana', 'Campista Joana', 'campista', (928, 658), 'ilha_basalto', [[726, 38, ['flamethrower', 'bite']], [58, 37, ['flamethrower', 'crunch']]],
     'Acampei na ilha pensando em silêncio, mas o silêncio é chato. Vamos batalhar!', ['Os Litten daqui acordam ao pôr do sol. Eu faço fogueira e eles aparecem sozinhos.']),
    ('br_b_tadeu', 'Guarda-praia Tadeu', 'surfista', (910, 674), 'ilha_basalto', [[126, 39, ['flamethrower', 'thunderPunch']], [219, 38, ['flamethrower', 'rockTomb']]],
     'Cuido da praia e dos banhistas. Se quer passar, mostre que sabe se defender!', ['Só uma coisa me assusta: a luz estranha que aparece no morro, de noite.']),
    # ---- Fontes Termais do Vapor (41–45)
    ('br_f_yuri', 'Banhista Yuri', 'banhista', (1046, 667), 'fontes_termais', [[324, 43, ['flamethrower', 'ironDefense']], [80, 42, ['psychic', 'scald']]],
     'Estou de molho há duas horas e minha paciência já ferveu. Batalha?', ['A água quente relaxa. Experimente, é de graça.']),
    ('br_f_ryu', 'Monge Ryu', 'monge', (1062, 640), 'fontes_termais', [[57, 43, ['crunch', 'earthquake']], [68, 44, ['rockSlide', 'earthquake']]],
     'Medito no vapor para domar a pressa. Mas hoje meus punhos pedem exercício.', ['A calma é a melhor técnica. Mas um bom soco ajuda.']),
    ('br_f_sachiko', 'Idosa Sachiko', 'idosa', (1088, 685), 'fontes_termais', [[80, 43, ['psychic', 'scald']], [38, 44, ['flamethrower', 'psychic']]],
     'Esta é a minha cadeira na fonte termal. Se quer sentar, vai ter que me vencer!', ['Dizem que a água daqui vem do fundo da montanha.']),
    ('br_f_elaine', 'Turista Elaine', 'turista', (1076, 646), 'fontes_termais', [[909, 41, ['flamethrower', 'bite']], [910, 43, ['flamethrower', 'bite']]],
     'Meu Fuecoco amou o vapor! Será que ele ama batalha também?', ['Tirei mil fotos. Em todas, a minha cara está vermelha de calor.']),
    ('br_f_welling', 'Alpinista Wellington', 'alpinista', (1100, 662), 'fontes_termais', [[112, 44, ['earthquake', 'rockSlide']], [126, 42, ['flamethrower', 'thunderPunch']]],
     'Subo o Tição todos os domingos. Hoje vim aquecer antes do cume!', ['Para subir na cratera, escale o paredão de cipós a noroeste. Não olhe para baixo.']),
    ('br_f_aki', 'Chef Aki', 'cozinheiro', (1030, 689), 'fontes_termais', [[324, 44, ['flamethrower', 'ironDefense']], [59, 44, ['flamethrower', 'crunch']]],
     'Cozinho no vapor e no fogo. Hoje o prato do dia é derrota, com acompanhamento de arroz!', ['Ovo de vapor com sal do mar é a melhor refeição pós-batalha.']),
    # ---- Campos de Cinza (40–44)
    ('br_c_lucio', 'Estagiário Lúcio', 'vulcanologo', (968, 735), 'campos_cinza', [[322, 40, ['flamethrower', 'earthPower']], [323, 42, ['eruption', 'earthPower']]],
     'Sou estagiário da Dra. Lava! Estou medindo os Camerupt, e você entrou no meio da medição!', ['A Dra. Lava diz que a cinza mostra o que o vulcão andou fazendo. Eu só varro.']),
    ('br_c_candido', 'Mineiro Cândido', 'mineiro', (1002, 723), 'campos_cinza', [[111, 40, ['rockSlide', 'earthquake']], [76, 42, ['rockSlide', 'earthquake']]],
     'Cavo basalto desde menino. Se você quer atravessar meu território, mostre dureza!', ['O basalto daqui tem um brilho roxo quando bate sol. É obsidiana, das boas.']),
    ('br_c_cida', 'Fornalheira Cida', 'fornalheira', (1040, 745), 'campos_cinza', [[218, 40, ['flamethrower', 'rockTomb']], [219, 43, ['flamethrower', 'rockTomb']]],
     'Trabalho na forja do Brasão! Minhas Slugma aquecem o ferro e qualquer visita!', ['O Brasão está sempre precisando de Pedra do Fogo. Se achar uma, leve para ele.']),
    ('br_c_davi', 'Garoto da Cinza Nando', 'garoto', (1075, 722), 'campos_cinza', [[935, 41, ['flamethrower', 'darkPulse']], [631, 43, ['flamethrower', 'xScissor']]],
     'Todo mundo diz que estas crateras são perigosas. Eu digo que são divertidas!', ['Já cai numa cratera pequena. Era só cinza, mas a vergonha queimou mais.']),
    ('br_c_silvia', 'Ranger Sílvia', 'ranger', (1020, 708), 'campos_cinza', [[229, 44, ['flamethrower', 'darkPulse']], [126, 42, ['flamethrower', 'thunderPunch']]],
     'Cuido destes campos! Se quer passar, mostre que respeita o fogo e a cinza!', ['Fique longe das crateras abertas. E se ouvir um ronco, corra para o lado.']),
    ('br_c_gui', 'Sobrevivente Guilherme', 'mineiro', (1090, 750), 'campos_cinza', [[839, 43, ['rockSlide', 'flamethrower']], [324, 42, ['flamethrower', 'ironDefense']]],
     'Já escapei de um Camerupt Alfa. Se escapei dele, escapo de você!', ['O Alfa abre a cratera com a corcova. Eu vi o chão subir feito pão no forno.']),
    # ---- Vulcão Tição (46–50)
    ('br_v_tomas', 'Escalador Tomás', 'alpinista', (1030, 796), 'vulcao_ticao', [[219, 47, ['flamethrower', 'rockTomb']], [323, 48, ['eruption', 'earthPower']]],
     'Cheguei até aqui escalando. Se você quer subir mais, passe por mim!', ['Depois da encosta, só com Pokémon que escale. Os cipós aguentam, mas a coragem tem limite.']),
    ('br_v_helio', 'Guardião Hélio', 'guardiao', (1056, 786), 'vulcao_ticao', [[59, 48, ['flamethrower', 'crunch']], [136, 47, ['flamethrower', 'quickAttack']]],
     'O Tição é sagrado para nós. Quem quer subir precisa me vencer em batalha!', ['Fogo de fogueira aquece, fogo de vulcão queima. Fique longe das crateras.']),
    ('br_v_dolores', 'Mineradora Dolores', 'mineiro', (1115, 811), 'vulcao_ticao', [[208, 48, ['earthquake', 'ironHead']], [464, 49, ['earthquake', 'rockSlide']]],
     'O Tição é uma mina a céu aberto! Eu cato e cuido. Quer levar pedra? Leva golpe!', ['Pedra de lava demora a esfriar. Cuidado onde pisa.']),
    ('br_v_zeca', 'Pirotécnico Zeca', 'pirotecnico', (1018, 846), 'vulcao_ticao', [[157, 49, ['eruption', 'flamethrower']], [6, 49, ['flamethrower', 'airSlash']]],
     'Eu faço fogos de artifício com fogo de verdade! Quer ver uma estreia?', ['Se o vulcão resolver soltar fogos antes de mim, eu largo o ofício.']),
    ('br_v_batista', 'Domador Batista', 'domador', (1085, 861), 'vulcao_ticao', [[467, 49, ['flamethrower', 'thunderbolt']], [324, 47, ['flamethrower', 'ironDefense']]],
     'Os Pokémon de fogo me escutam. O rio de lava não, mas estou trabalhando nisso!', ['A lava hoje corre devagar. Mesmo assim, mantenha distância.']),
    ('br_v_eremita', 'Eremita da Cratera', 'eremita', (1050, 826), 'cratera_ticao', [[637, 50, ['bugBuzz', 'fireBlast']], [6, 49, ['flamethrower', 'airSlash']]],
     'Há anos vivo à beira da cratera. Quem chega aqui precisa me convencer de que merece subir!', ['A ave de fogo só aparece para quem vem em paz. E sem pressa.']),
    # ---- Mar das Brasas (43–47): bancos de areia no mar aberto
    ('br_m_julia', 'Mergulhadora Júlia', 'nadadora', (880, 906), 'mar_brasas', [[171, 44, ['surf', 'thunderbolt']], [226, 45, ['surf', 'airSlash']]],
     'Estava treinando respiração e você me interrompeu. Agora tem que lutar!', ['Quanto mais fundo o mar, mais silêncio.']),
    ('br_m_bento', 'Capitão Bento', 'marujo', (942, 929), 'mar_brasas', [[130, 46, ['aquaTail', 'crunch']], [279, 44, ['surf', 'hurricane']]],
     'Perdi meu navio neste banco. Mas ainda tenho meus Pokémon e vontade de lutar!', ['A carta na garrafa que achei aqui chegou a Alvorada em duas semanas. Não sei de quem era.']),
    ('br_m_calado', 'Pirata Zé Calado', 'pirata', (1090, 940), 'mar_brasas', [[319, 45, ['crunch', 'surf']], [91, 46, ['iceBeam', 'surf']]],
     'Navego sem rumo e sem medo! Mas por um desafio, eu paro a viagem!', ['Tem um tesouro numa ilhota fumegante. Mas ninguém chega lá de barco.']),
    ('br_m_raul', 'Vigia Raul', 'marujo', (1002, 904), 'mar_brasas', [[227, 46, ['ironHead', 'airSlash']], [306, 45, ['ironHead', 'earthquake']]],
     'Vigio o mar do sul para ninguém chegar sem aviso. E você chegou sem avisar!', ['Quando a névoa chega do sul, dá para ouvir sinos de um navio. Ninguém sabe qual.']),
]

OLHARES = {
    'nadador': {'preset': 'treinador', 'hairStyle': 'spiky', 'hair': '#2a211c', 'hat': None, 'skin': '#c98d62', 'outfit': 'shirt', 'top': '#3a8ad8', 'legs': 'shorts', 'pants': '#3a8ad8', 'shoes': '#f2f2f2', 'bagStyle': None},
    'marujo': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#2a4a7a', 'capLogo': '#f2f2f2', 'top': '#2a4a7a', 'trim': '#f2f2f2', 'pants': '#3a3a5a', 'hair': '#5a3a2a', 'bagStyle': None},
    'surfista': {'preset': 'treinador', 'hairStyle': 'spiky', 'hair': '#e8c060', 'hat': None, 'skin': '#c98d62', 'outfit': 'shirt', 'top': '#4ab0c0', 'legs': 'shorts', 'pants': '#e0782e', 'shoes': '#f2f2f2', 'bagStyle': None},
    'banhista': {'preset': 'treinadora', 'hairStyle': 'bun', 'hair': '#3a2a22', 'outfit': 'shirt', 'top': '#f2f2f2', 'legs': 'shorts', 'pants': '#e0a0b8', 'shoes': '#f2f2f2', 'bagStyle': None},
    'campista': {'preset': 'treinadora', 'hairStyle': 'ponytail', 'hair': '#d8762e', 'hat': 'beanie', 'cap': '#3a9a5a', 'capLogo': '#3a9a5a', 'outfit': 'jacket', 'top': '#3a9a5a', 'trim': '#f2c03a', 'legs': 'shorts', 'pants': '#3a4a5a', 'bagStyle': None},
    'monge': {'preset': 'treinador', 'hat': None, 'hair': '#1a1a1a', 'skin': '#efc19b', 'outfit': 'coat', 'top': '#e0782e', 'trim': '#f2f2f2', 'legs': 'pants', 'pants': '#f2f2f2', 'shoes': '#5a3a24', 'bagStyle': None},
    'idosa': {'preset': 'mae', 'hairStyle': 'bun', 'hair': '#e8e4dc', 'skin': '#efc19b', 'top': '#8a5ac8', 'trim': '#f4ead2', 'pants': '#4a3a5a', 'shoes': '#5a3a24'},
    'turista': {'preset': 'treinadora', 'hairStyle': 'bun', 'hair': '#a0602e', 'hat': 'cap', 'cap': '#f2f2f2', 'capLogo': '#e8455a', 'outfit': 'shirt', 'top': '#e8455a', 'legs': 'shorts', 'pants': '#f2c03a', 'shoes': '#ffffff', 'bagStyle': None},
    'alpinista': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#e8643a', 'capLogo': '#e8643a', 'top': '#5a6a7a', 'trim': '#e8643a', 'pants': '#3a4a5a', 'bagStyle': 'big'},
    'cozinheiro': {'preset': 'treinador', 'hat': 'cap', 'cap': '#f2f2f2', 'capLogo': '#f2f2f2', 'top': '#f2f2f2', 'trim': '#e0b030', 'legs': 'pants', 'pants': '#3a3a3a', 'bagStyle': None},
    'vulcanologo': {'preset': 'treinador', 'hat': 'cap', 'cap': '#e8643a', 'capLogo': '#f2f2f2', 'outfit': 'jacket', 'top': '#f4f4f0', 'trim': '#e8643a', 'legs': 'pants', 'pants': '#3a3a3a', 'bagStyle': 'shoulder', 'bag': '#c8a040'},
    'mineiro': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#f2c03a', 'capLogo': '#f2c03a', 'top': '#5a6a7a', 'trim': '#f2c03a', 'pants': '#3a4a5a', 'bagStyle': None},
    'fornalheira': {'preset': 'treinadora', 'hairStyle': 'ponytail', 'hair': '#2a211c', 'outfit': 'jacket', 'top': '#6a3a2a', 'trim': '#e8643a', 'legs': 'pants', 'pants': '#3a2a24', 'shoes': '#2a1a14', 'bagStyle': None},
    'garoto': {'preset': 'menino', 'hair': '#3a2a22', 'top': '#e8643a', 'pants': '#3a3a5a'},
    'ranger': {'preset': 'treinadora', 'hairStyle': 'ponytail', 'hair': '#2a211c', 'outfit': 'jacket', 'top': '#e8643a', 'trim': '#f2f2f2', 'legs': 'pants', 'pants': '#3a4a5a', 'bagStyle': None},
    'guardiao': {'preset': 'treinador', 'hat': None, 'hair': '#2a1a14', 'skin': '#a06a44', 'outfit': 'coat', 'top': '#c8301a', 'trim': '#f2c03a', 'legs': 'pants', 'pants': '#2a1a14', 'shoes': '#2a1a14', 'bagStyle': None},
    'pirotecnico': {'preset': 'treinador', 'hairStyle': 'spiky', 'hair': '#c04a2a', 'hat': 'beanie', 'cap': '#3a3a3a', 'capLogo': '#e8643a', 'outfit': 'jacket', 'top': '#3a3a3a', 'trim': '#e8643a', 'legs': 'pants', 'pants': '#2a2a2a', 'bagStyle': None},
    'domador': {'preset': 'montanhista', 'hat': None, 'hair': '#2a1a14', 'skin': '#a06a44', 'top': '#c84a2a', 'trim': '#f2c03a', 'pants': '#3a2a24', 'bagStyle': 'shoulder', 'bag': '#8a3a1a'},
    'eremita': {'preset': 'professor', 'hair': '#e8e4dc', 'skin': '#c98d62', 'outfit': 'coat', 'top': '#6a3a1a', 'trim': '#e8c050', 'pants': '#3a2a1a', 'shoes': '#2a1a14'},
    'pirata': {'preset': 'treinador', 'hat': 'beanie', 'cap': '#c82a2a', 'capLogo': '#f2f2f2', 'hair': '#2a1a14', 'skin': '#c98d62', 'outfit': 'coat', 'top': '#2a2a3a', 'trim': '#c82a2a', 'legs': 'pants', 'pants': '#2a2a3a', 'shoes': '#2a1a14', 'bagStyle': None},
    'pescador': None,
    'nadadora': None,
}


def aplicar(ctx):
    R, G = ctx['R'], ctx['G']
    C = ctx['C']
    info = ctx['info']
    Z = info['Z']
    fontes(ctx, C)
    campos(ctx, C)
    vulcao(ctx, C)
    itens(ctx, C)
    tocas(ctx, C)
    treinadores(ctx, C)
    # moradores de fora que ficaram dentro de um objeto: vão para o chão livre mais perto
    S = solidos(R)
    for p in R['people']:
        if p.get('viagem'):
            continue
        x, y = int(p['x']), int(p['y'])
        ch = G[y - Y0, x - X0]
        if S[y - Y0, x - X0] or ch not in CAMINHA:
            for rr_ in range(1, 8):
                ach = None
                for dy in range(-rr_, rr_ + 1):
                    for dx in range(-rr_, rr_ + 1):
                        xx, yy = x + dx, y + dy
                        if X0 <= xx < X0 + W and Y0 <= yy < Y0 + H and G[yy - Y0, xx - X0] in CAMINHA and not S[yy - Y0, xx - X0]:
                            ach = (xx, yy); break
                    if ach: break
                if ach:
                    p['x'], p['y'] = ach
                    break
    # nada de objeto em cima de passagem de mar: limpa qualquer objeto fora do retângulo
    R['objects'] = [o for o in R['objects'] if X0 <= o['x'] < X0 + W and Y0 <= o['y'] < Y0 + H]


# ---------------------------------------------------------------- Fontes Termais
def fontes(ctx, C):
    R, G, info = ctx['R'], ctx['G'], ctx['info']
    f = info['Z']['fontes']
    d_f = info['d_f']
    # clareira escondida (ofurô secreto), a leste: círculo de rocha com a entrada tapada por dois arbustos
    cx, cy = 1103, 668
    anel = elipse(cx, cy, 6.5, 5.5, ruido=0.1, semente=500) & info['m_for']
    miolo = elipse(cx, cy, 4.2, 3.4, ruido=0.1, semente=501) & info['m_for']
    G[anel] = '#'
    G[miolo] = ','
    G[elipse(cx + 1, cy, 2.2, 1.6, ruido=0.05, semente=502) & miolo] = 'q'
    G[elipse(cx + 1, cy, 3.2, 2.5, ruido=0.05, semente=503) & miolo & (G != 'q')] = ';'
    for yy in (cy - 1, cy, cy + 1):
        G[yy - Y0, cx - 6 - X0] = ','
        G[yy - Y0, cx - 5 - X0] = ','
    C.reserva(cx - 7, cy - 6, 14, 12)
    R['objects'] += [{'kind': 'bush', 'x': cx - 6, 'y': cy - 1}, {'kind': 'bush', 'x': cx - 6, 'y': cy}, {'kind': 'bush', 'x': cx - 6, 'y': cy + 1}]
    R['items'].append({'x': cx - 1, 'y': cy + 2, 'item': 'leftovers', 'hidden': True})
    R['items'].append({'x': cx + 3, 'y': cy - 2, 'item': 'rareCandy', 'hidden': True})
    # a trilha chega ao arbusto
    G[faixa([(1090, 668), (1096, 667)], 2, ruido=0.3, semente=504) & (G == '.')] = '='
    # mirante nordeste: bancos e luneta
    C.obj('bench', 1094, 637, forcar=True); C.obj('bench', 1099, 637, forcar=True)
    C.obj('sign', 1097, 634, forcar=True, text='Mirante do Vapor. De cima se vê o Tição soltando fumaça e, ao norte, a rota do Barco das Brasas.')
    C.obj('lanternaPedra', 1093, 635, forcar=True); C.obj('lanternaPedra', 1101, 635, forcar=True)
    # escada do mirante (a rocha tem um corte de degraus)
    for x in (1096, 1097, 1098):
        for y in (639, 640):
            G[y - Y0, x - X0] = '^' if y == 640 else ','
    # bambuzais, fumarolas e lanternas
    for (x, y) in escolhe(C, G, f & (d_f >= 3), 46, 510, sep=3, chao=set('.,')):
        C.obj('bambu', x, y)
    for (x, y) in escolhe(C, G, f & (G == ';'), 16, 511, sep=5, chao=set(';')):
        C.obj('fumarola', x, y)
    for (x, y) in escolhe(C, G, f & (G == '.'), 28, 512, sep=4, chao=set('.,')):
        C.obj(Sorteio(x * 7 + y).pick(['roundbush', 'bush', 'bush', 'flowerpot']), x, y)
    tr = info['T'][6] | info['T'][7] | info['T'][8]
    for (x, y) in escolhe(C, G, f & ~tr, 26, 513, sep=7, chao=set('.,;')):
        C.obj('lanternaPedra', x, y)
    for (x, y) in escolhe(C, G, f & (G == ','), 14, 514, sep=5, chao=set(',.')):
        C.obj('boulder2', x, y)
    C.obj('sign', 1024, 650, forcar=True, text='Fontes Termais do Vapor. Entre nas piscinas para curar a equipe: os Pokémon agradecem. Não leve sabão.')
    # placa de aviso dos Slowpoke
    C.obj('sign', 1062, 656, forcar=True, text='Atenção: os Slowpoke das piscinas têm o dia inteiro. Você não.')
    C.spot('brasas_fontes_entrada', 1030, 650, 'right')
    C.spot('brasas_ofuro_secreto', cx + 1, cy + 1, 'up')
    C.pessoa(id='fontes_idoso', name='Vovó Kimiko', look='mae', x=1056, y=651, dir='down', wander=1,
             lines=['As piscinas mais altas são as mais quentes. As mais baixas, as mais calmas. A vida também é assim.', 'Dizem que existe uma fonte escondida no leste, atrás de uns arbustos. Nunca achei. Meus joelhos, sim.'])


# ---------------------------------------------------------------- Campos de Cinza
def campos(ctx, C):
    R, G, info = ctx['R'], ctx['G'], ctx['info']
    c = info['Z']['campos']
    d_f = info['d_f']
    for i, (cx, cy, rx, ry) in enumerate(info['crateras']):
        C.marca(int(cx - rx - 2), int(cy - ry - 2), int(2 * rx + 4), int(2 * ry + 4))
    trilhas = info['T'][5]
    for (x, y) in escolhe(C, G, c & (d_f >= 2), 70, 520, sep=4, chao=set('av')):
        r = Sorteio(x * 13 + y)
        C.obj(r.pick(['obsidianRock', 'lavaRock', 'boulder2', 'rock', 'obsidianRock', 'grayrock']), x, y)
    for (x, y) in escolhe(C, G, c & (d_f >= 3), 30, 521, sep=5, chao=set('av')):
        C.obj('fumarola', x, y)
    for (x, y) in escolhe(C, G, c & (G == '"'), 10, 522, sep=3, chao=set('"')):
        C.obj('roundbush', x, y)
    for (x, y) in escolhe(C, G, c & (d_f >= 3), 4, 523, sep=10, chao=set('av')):
        C.obj('skull', x, y)
    for (mx, my) in info['mesas']:
        R['items'].append({'x': mx, 'y': my, 'item': Sorteio(mx * 3 + my).pick(['rareCandy', 'nugget', 'fullRestore', 'maxRevive']), 'hidden': True})
        C.marca(mx - 6, my - 4, 13, 9)
        R['objects'].append({'kind': 'lavaRock', 'x': mx - 2, 'y': my - 1})
        R['objects'].append({'kind': 'obsidianRock', 'x': mx + 2, 'y': my})
    C.obj('sign', 992, 702, forcar=True, text='Campos de Cinza. O chão aqui respira: se subir, pode ser um Camerupt. Ande leve.')
    C.obj('sign', 1048, 768, forcar=True, text='Pé do Tição. A subida é ao norte da cratera, pelo paredão de cipós. Só para quem escala.')
    C.spot('brasas_campos_alfa', 1060, 735, 'down')
    C.spot('brasas_fenda_cinza', 1000, 750, 'down')


# ---------------------------------------------------------------- Vulcão Tição
def vulcao(ctx, C):
    R, G, info = ctx['R'], ctx['G'], ctx['info']
    v = info['Z']['vulcao'] & ~info['bacia']
    d_f = info['d_f']
    for (x, y) in escolhe(C, G, v & (d_f >= 2), 90, 530, sep=4, chao=set('av')):
        r = Sorteio(x * 17 + y)
        C.obj(r.pick(['lavaRock', 'obsidianRock', 'boulder2', 'obsidianRock', 'lavaRock']), x, y)
    for (x, y) in escolhe(C, G, v & (d_f >= 3), 40, 531, sep=5, chao=set('av')):
        C.obj('fumarola', x, y)
    # bacia: pedras, tochas e a placa do ninho
    b = info['bacia']
    for (x, y) in escolhe(C, G, b, 12, 532, sep=4, chao=set('av')):
        C.obj(Sorteio(x + y).pick(['obsidianRock', 'lavaRock']), x, y)
    C.obj('sign', 1046, 806, forcar=True, text='Borda da cratera do Tição. Daqui para dentro, o chão é de gente corajosa.')
    C.obj('sign', 1040, 797, forcar=True, text='Escalada: paredão de cipós a noroeste. Segure firme.')
    C.spot('brasas_vulcao_mirante', 1124, 790, 'left')
    # os dois cipós
    C.spot('brasas_cipo_noroeste', 1044, 804, 'up')


# ---------------------------------------------------------------- itens no chão
def itens(ctx, C):
    R, G, info = ctx['R'], ctx['G'], ctx['info']
    Z = info['Z']
    d_b = info['d_b']
    listas = [
        ('basalto', info['m_bas'] & (d_b >= 3), 14, ['pearl', 'bigPearl', 'oranBerry', 'superPotion', 'greatBall', 'stardust', 'revive'], 550),
        ('fontes', Z['fontes'] & (info['d_f'] >= 3), 14, ['oranBerry', 'pechaBerry', 'fullHeal', 'superPotion', 'ultraBall', 'ether', 'cheriBerry'], 551),
        ('campos', Z['campos'] & (info['d_f'] >= 3), 14, ['fireStone', 'charcoal', 'hardStone', 'ultraBall', 'hyperPotion', 'burnHeal', 'heatRock'], 552),
        ('vulcao', Z['vulcao'] & (info['d_f'] >= 3), 14, ['hyperPotion', 'revive', 'ultraBall', 'fireStone', 'ether', 'maxRevive', 'fullHeal'], 553),
        ('vila', Z['vila'] & (info['d_f'] >= 3), 6, ['potion', 'oranBerry', 'pokeball', 'superPotion'], 554),
    ]
    for nome, mask, n, pool, seed in listas:
        rr = Sorteio(seed)
        for (x, y) in escolhe(C, G, mask, n, seed, sep=5):
            it = rr.pick(pool)
            if it in ITENS:
                R['items'].append({'x': x, 'y': y, 'item': it, **({'n': 2} if it in ('oranBerry', 'pearl') else {})})
                C.marca(x, y, 1, 1)
    # escondidos (só brilham de perto)
    esc = [('basalto', info['m_bas'] & (d_b >= 5), ['nugget', 'bigPearl', 'rareCandy'], 3, 560), ('fontes', Z['fontes'], ['stardust', 'nugget'], 2, 561),
           ('campos', Z['campos'], ['nugget', 'rareCandy', 'hardStone'], 3, 562), ('vulcao', Z['vulcao'] & ~info['bacia'], ['nugget', 'fullRestore', 'rareCandy'], 3, 563)]
    for nome, mask, pool, n, seed in esc:
        rr = Sorteio(seed)
        for (x, y) in escolhe(C, G, mask, n, seed, sep=12):
            it = rr.pick(pool)
            if it in ITENS:
                R['items'].append({'x': x, 'y': y, 'item': it, 'hidden': True})
    # bancos de areia: pérolas e tesouros do naufrágio
    for (x, y, it, h) in [(868, 520, 'pearl', False), (1108, 523, 'bigPearl', False), (962, 556, 'nugget', True), (942, 931, 'bigPearl', True), (878, 905, 'pearl', False),
                          (1088, 940, 'stardust', False), (1000, 905, 'ultraBall', False), (1038, 541, 'superPotion', False), (947, 933, 'rareCandy', True)]:
        pos = snap(C, G, x, y, 4)
        if pos is None:
            continue
        o = {'x': pos[0], 'y': pos[1], 'item': it}
        C.marca(pos[0], pos[1], 1, 1)
        if h:
            o['hidden'] = True
        R['items'].append(o)
    # ilhota fumegante
    R['items'] += [{'x': 1162, 'y': 922, 'item': 'rareCandy', 'hidden': True}, {'x': 1178, 'y': 925, 'item': 'maxRevive'}, {'x': 1170, 'y': 912, 'item': 'fullRestore', 'hidden': True}]
    # confere item inexistente
    R['items'] = [i for i in R['items'] if i['item'] in ITENS]


# ---------------------------------------------------------------- Tocas de Luz
def livre_raio(C, G, x, y, r=7):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy > r * r:
                continue
            xx, yy = x + dx, y + dy
            ch = G[yy - Y0, xx - X0]
            if ch not in set('.,=P*:Aavo;"'):
                return False
            if dx * dx + dy * dy <= 4 and C.ocup[yy - Y0, xx - X0]:
                return False
    return True


def tocas(ctx, C):
    R, G = ctx['R'], ctx['G']
    achados = {}
    for id, (px, py), gmax in [('toca_cinza', (1005, 738), ['coalossal-gmax', 'centiskorch-gmax']), ('toca_vulcao', (1120, 796), ['charizard-gmax'])]:
        for r in range(0, 14):
            ok = None
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r:
                        continue
                    if livre_raio(C, G, px + dx, py + dy, 7):
                        ok = (px + dx, py + dy)
                        break
                if ok:
                    break
            if ok:
                break
        if not ok:
            print('AVISO: sem lugar livre para', id)
            continue
        R['tocas'].append({'id': id, 'x': ok[0], 'y': ok[1], 'gmax': gmax})
        C.marca(ok[0] - 7, ok[1] - 7, 15, 15)
        achados[id] = ok
    print('tocas', achados)


# ---------------------------------------------------------------- treinadores
def treinadores(ctx, C):
    R, G = ctx['R'], ctx['G']
    elenco, cenas = [], []
    for (id, nome, look, (ax, ay), area, equipe, fala, apos) in TREINADORES:
        pos = snap(C, G, ax, ay, 6)
        if pos is None:
            print('AVISO: treinador sem chão', id)
            continue
        x, y = pos
        d = direcao(G, x, y, 8)
        C.marca(x, y, 1, 1, folga=1)
        R['spots'][id] = [x, y, d]
        nivel_max = max(e[1] for e in equipe)
        elenco.append({'id': id, 'nome': nome, 'look': look, 'spot': id, 'visao': 6, 'apos': apos})
        cenas.append({'id': id + '_cena', 'local': area, 'gatilho': {'tipo': 'avistar', 'alvo': id}, 'solta': True,
                      'falas': [['treinador', fala]],
                      'depois': {'batalha': {'id': id, 'nome': nome, 'dinheiro': nivel_max * 30, 'equipe': equipe}}})
    ctx['elenco'] = elenco
    escrever_js(elenco, cenas)


def js(v, ind=0):
    return json.dumps(v, ensure_ascii=False)


def escrever_js(elenco, cenas):
    # elenco: mesmos campos de src/story/elenco.js
    out = ["// Treinadores do Arquipélago das Brasas (gerado por tools/brasas/rotas.py): elenco no mapa e cenas de batalha.",
           "// Entram no roteiro como as demais jornadas (ver src/story/script/index.js). Níveis pelo plano (docs/mundo-expandido.md, seção 8).",
           "import { ELENCO, LOOKS } from '../elenco.js';", "",
           "const OLHARES = " + json.dumps({k: v for k, v in OLHARES.items() if v}, ensure_ascii=False, indent=1).replace('\n ', '\n  ') + ";",
           "const USA = { pescador: LOOKS.pescador, nadadora: LOOKS.nadadora };", "",
           "const TREINADORES = ["]
    for e in elenco:
        out.append("  { id: %s, quem: 'treinador', nome: %s, look: OLHARES[%s] ?? USA[%s], spot: %s, visao: %d, apos: %s }," % (
            js(e['id']), js(e['nome']), js(e['look']), js(e['look']), js(e['spot']), e['visao'], js(e['apos'])))
    out.append("];")
    out.append("")
    out.append("// quem aparece no mapa (o motor lê ELENCO ao criar o roteiro, que importa este arquivo antes)")
    out.append("for (const t of TREINADORES) if (!ELENCO.some((x) => x.id === t.id)) ELENCO.push({ cap: 0, ...t });")
    out.append("")
    out.append("export default {")
    out.append("  id: 'regiao_brasas',")
    out.append("  regiao: true,   // cenas soltas (treinadores de rota): sempre valem, sem jornada")
    out.append("  titulo: 'Arquipélago das Brasas',")
    out.append("  cenas: [")
    for c in cenas:
        out.append("    " + js(c) + ",")
    out.append("  ],")
    out.append("};")
    # a lista de OLHARES precisa mapear 'pescador' e 'nadadora' para os LOOKS do elenco
    with open(os.path.join(RAIZ, 'src/story/script/regiao-brasas.js'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')
