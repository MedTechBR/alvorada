# Templo da Chama (Vulcão Tição): três andares, com os quebra-cabeças de masmorra (pedras na lava, ponte do rio, sinos e braseiros).
import numpy as np


class Sala:
    def __init__(self, w, h, fill='U'):
        self.w, self.h = w, h
        self.g = [[fill] * w for _ in range(h)]

    def rect(self, x, y, w, h, ch):
        for j in range(h):
            for i in range(w):
                if 0 <= x + i < self.w and 0 <= y + j < self.h:
                    self.g[y + j][x + i] = ch

    def set(self, x, y, ch):
        self.g[y][x] = ch

    def ell(self, cx, cy, rx, ry, ch):
        for j in range(self.h):
            for i in range(self.w):
                if ((i - cx) / rx) ** 2 + ((j - cy) / ry) ** 2 <= 1:
                    self.g[j][i] = ch

    def rows(self):
        return [''.join(r) for r in self.g]


def pedra(x, y, id):
    return {'kind': 'strengthRock', 'x': x, 'y': y, 'id': id}


def bau(x, y, item, n=1, **kw):
    o = {'kind': 'chest', 'x': x, 'y': y, 'item': item}
    if n > 1:
        o['n'] = n
    o.update(kw)
    return o


def aplicar(ctx):
    R = ctx['R']
    G = ctx['G']
    # entrada pelo lado de fora (a fachada está no terreno): porta em (1060, 819), ponto de saída logo abaixo
    R['warps'].append({'x': 1060, 'y': 819, 'dir': 'up', 'to': ['templo_chama_1', 19, 21], 'face': 'up', 'label': 'Templo da Chama'})
    R['spots']['brasas_templo_porta'] = [1060, 821, 'down']
    R['spots']['brasas_cratera_borda'] = [1048, 807, 'down']
    ninho_moltres_pedras(ctx)
    R['interiors'] += [andar1(), andar2(), andar3()]


# ---------------------------------------------------------------- Andar 1: Portal de Basalto
def andar1():
    s = Sala(38, 24)
    # salão de entrada (piso de templo e mosaico)
    s.rect(14, 17, 11, 6, 'E'); s.rect(18, 19, 3, 2, 'Y')
    s.rect(18, 15, 3, 2, 'E')
    # salão da lava
    s.rect(3, 4, 32, 11, 'v')
    s.rect(3, 8, 32, 2, 'l')                       # o rio atravessa o salão de ponta a ponta
    for x in range(3, 35, 3):
        s.set(x, 7, 'o'); s.set(x + 1, 10, 'o')
    s.rect(24, 4, 2, 4, 'l')                       # braço norte do rio, isola o nicho leste
    s.rect(26, 4, 8, 4, 'v')
    s.rect(18, 4, 3, 3, 'E')                       # patamar da escada que desce
    s.rect(9, 4, 1, 4, 'U')                        # parede do nicho oeste (tem uma parede rachada)
    # sombra de pilastras
    for (x, y) in [(6, 12), (12, 12), (26, 12), (31, 12)]:
        s.set(x, y, 'U')
    s.set(19, 3, '>')
    O = [
        # as duas pedras que tapam a travessia principal (coluna 19, rio em y 8–9)
        pedra(19, 11, 'p1a'), pedra(19, 13, 'p1b'),
        # braço norte: duas pedras empurradas para leste (rio em x 24–25, linha y 6)
        pedra(20, 6, 'p1c'), pedra(22, 6, 'p1d'),
        {'kind': 'crackedRock', 'x': 9, 'y': 6, 'id': 'rocha_oeste', 'chao': 'v', 'msg': 'A rocha se abriu! Um nicho escondido, cheio de baús.'},
        bau(4, 5, 'emboarite', id='bau_emboar'), bau(6, 5, 'delphoxite', id='bau_delphox'), bau(4, 7, 'pyroarite', id='bau_pyroar'), bau(7, 7, 'fireStone', 3, id='bau_pedras'),
        bau(32, 5, 'houndoominite', id='bau_houndoom'), bau(29, 5, 'heatRock', id='bau_rocha'),
        {'kind': 'torch', 'x': 14, 'y': 17, 'acesa': True}, {'kind': 'torch', 'x': 24, 'y': 17, 'acesa': True},
        {'kind': 'brazier', 'x': 15, 'y': 21, 'acesa': True}, {'kind': 'brazier', 'x': 23, 'y': 21, 'acesa': True},
        {'kind': 'statue', 'x': 15, 'y': 19, 'text': 'Uma estátua de um Pokémon de fogo com a boca aberta. A língua é de brasa pintada.'},
        {'kind': 'statue', 'x': 22, 'y': 19, 'text': 'A gêmea da outra estátua. Os olhos de obsidiana seguem quem passa.'},
        {'kind': 'mural', 'x': 18, 'y': 17, 'text': 'Mural: um rio de lava cortado por pedras. "Quem alimenta o fogo com a pedra firme, ganha chão de magma frio."'},
        {'kind': 'brokenColumn', 'x': 7, 'y': 13}, {'kind': 'brokenColumn', 'x': 29, 'y': 13},
        {'kind': 'lavaRock', 'x': 13, 'y': 5}, {'kind': 'lavaRock', 'x': 30, 'y': 12},
        {'kind': 'obsidianRock', 'x': 16, 'y': 13}, {'kind': 'obsidianRock', 'x': 22, 'y': 13},
    ]
    return {'id': 'templo_chama_1', 'name': 'Templo da Chama: Portal de Basalto', 'rows': s.rows(), 'biome': 'vulcao', 'wild': True, 'escuro': 0.3,
            'objects': O, 'decor': [], 'people': [], 'items': [{'x': 20, 'y': 14, 'item': 'hyperPotion'}, {'x': 12, 'y': 5, 'item': 'ultraBall'}],
            'spots': {'templo1_entrada': [19, 21, 'up'], 'dentro_templo_chama_1': [19, 21, 'up']},
            'warps': [
                {'x': 19, 'y': 22, 'dir': 'down', 'to': 'brasas_templo_porta', 'face': 'down', 'label': 'Saída'},
                {'x': 19, 'y': 3, 'dir': 'up', 'to': ['templo_chama_2', 5, 21], 'face': 'up', 'label': 'Escada'},
            ]}


# ---------------------------------------------------------------- Andar 2: Rio de Lava
def andar2():
    s = Sala(44, 26)
    s.rect(3, 4, 15, 19, 'v')                       # margem oeste
    s.rect(25, 4, 16, 19, 'v')                      # margem leste
    s.rect(18, 3, 7, 21, 'l')                       # o rio de lava
    for y in range(4, 23, 3):
        s.set(17, y, 'o'); s.set(25, y + 1, 'o')
    s.rect(3, 22, 4, 1, 'E'); s.set(5, 23, '<')
    # alcova da alavanca (oeste, atrás de uma porta de pedra)
    s.rect(3, 4, 6, 3, 'E')
    s.rect(9, 4, 1, 3, 'U'); s.rect(3, 7, 6, 1, 'U'); s.set(5, 7, 'v')   # paredes da alcova; porta de pedra em (5, 7)
    # nicho da chave (parede rachada) a sudoeste
    s.rect(11, 17, 6, 5, 'U'); s.rect(12, 18, 4, 3, 'E')
    # câmara do tesouro a nordeste (porta trancada)
    s.rect(34, 4, 7, 6, 'E')
    s.rect(34, 10, 7, 1, 'U'); s.set(37, 10, 'E')   # passagem fechada pela porta trancada em (37, 10)
    s.rect(33, 4, 1, 7, 'U')
    # escada de descida (leste)
    s.rect(36, 19, 3, 3, 'E'); s.set(37, 18, '>')
    # travessia pelas rachaduras (7 blocos de rio, y 18)
    s.rect(18, 18, 7, 1, '!')
    s.rect(18, 12, 7, 1, 'l')
    # pontes de pedra escuras para o decoro (placas de pressão) e lajes
    s.rect(7, 12, 3, 3, 'E'); s.rect(7, 13, 3, 1, 'E')
    O = [
        # alavanca atrás da porta de pedra: a placa abre a porta (pedra empurrada para cima da placa)
        {'kind': 'stoneDoor', 'x': 5, 'y': 7, 'id': 'porta_alavanca', 'msg': 'A porta de pedra desce no chão.'},
        {'kind': 'plate', 'x': 8, 'y': 13, 'id': 'placa_alavanca', 'trava': True, 'abre': ['porta_alavanca']},
        pedra(8, 16, 'p2a'),
        {'kind': 'lever', 'x': 5, 'y': 4, 'id': 'alavanca_rio', 'nome': 'Comporta do rio', 'abre': ['ponte_rio']},
        # caminho de volta quando ligar
        {'kind': 'crackedRock', 'x': 12, 'y': 17, 'id': 'rocha_chave', 'chao': 'E', 'msg': 'A rocha cedeu e mostrou um nicho de pedra.'},
        bau(13, 19, 'chave_pequena', id='bau_chave'),
        {'kind': 'lockedDoor', 'x': 37, 'y': 10, 'id': 'porta_tesouro', 'chave': 'chave_pequena', 'gasta': True, 'msgTrancado': 'Trancada. A fechadura tem a forma de uma chama.'},
        bau(36, 6, 'charizarditeX', id='bau_charizard'), bau(38, 6, 'fireStone', id='bau_pedra2'), bau(35, 8, 'tm_blastBurn', id='bau_mt'),
        {'kind': 'torch', 'x': 34, 'y': 4, 'acesa': True}, {'kind': 'torch', 'x': 40, 'y': 4, 'acesa': True},
        {'kind': 'brazier', 'x': 4, 'y': 21, 'acesa': True},
        {'kind': 'mural', 'x': 3, 'y': 21, 'text': 'Mural: uma comporta e três braseiros. "O rio obedece a quem puxa a alavanca; ou a quem tem pressa e coragem."'},
        {'kind': 'obsidianRock', 'x': 14, 'y': 8}, {'kind': 'obsidianRock', 'x': 28, 'y': 15}, {'kind': 'lavaRock', 'x': 14, 'y': 14}, {'kind': 'lavaRock', 'x': 31, 'y': 8},
        {'kind': 'strengthRock', 'x': 30, 'y': 17, 'id': 'p2b'},
        {'kind': 'brokenColumn', 'x': 10, 'y': 10}, {'kind': 'brokenColumn', 'x': 32, 'y': 13},
    ]
    mec = [{'id': 'ponte_rio', 'tipo': 'ponte', 't': 'bridge', 'rect': [18, 12, 7, 1], 'msg': 'O rio de lava desvia, e uma ponte de basalto emerge do fundo.'}]
    holes = [{'x': x, 'y': 18, 'to': [6, 24]} for x in range(18, 25)]
    return {'id': 'templo_chama_2', 'name': 'Templo da Chama: Rio de Lava', 'rows': s.rows(), 'biome': 'vulcao', 'wild': True, 'escuro': 0.35,
            'objects': O, 'decor': [], 'people': [], 'mecanismos': mec, 'buracos': holes,
            'items': [{'x': 14, 'y': 20, 'item': 'superPotion'}, {'x': 28, 'y': 21, 'item': 'fullHeal'}, {'x': 38, 'y': 14, 'item': 'rareCandy', 'hidden': True}],
            'spots': {'templo2_sensor': [30, 8, 'down'], 'templo2_entrada': [5, 21, 'up'], 'dentro_templo_chama_2': [5, 21, 'up']},
            'warps': [
                {'x': 5, 'y': 23, 'dir': 'down', 'to': ['templo_chama_1', 19, 4], 'face': 'down', 'label': 'Escada'},
                {'x': 37, 'y': 18, 'dir': 'up', 'to': ['templo_chama_3', 4, 27], 'face': 'up', 'label': 'Escada'},
            ]}


# ---------------------------------------------------------------- Andar 3: Forja Antiga
def andar3():
    s = Sala(36, 30)
    # salão sul dos sinos
    s.rect(3, 20, 30, 8, 'E')
    s.rect(14, 22, 8, 4, 'Y')
    s.set(4, 28, '<')
    # corredor para o salão dos braseiros (porta de pedra em (17, 19))
    s.rect(17, 17, 2, 3, 'v')
    # salão norte dos braseiros
    s.rect(4, 9, 28, 8, 'u')
    s.rect(10, 11, 16, 4, 'E')
    # corredor para a câmara (porta em (17, 8))
    s.rect(17, 6, 2, 3, 'v')
    # câmara do Heatran
    s.rect(7, 1, 22, 5, 'v')
    s.ell(18, 2.5, 6, 1.7, 'l'); s.ell(18, 2.5, 2.2, 0.9, 'o')
    O = [
        # sinos nas quatro direções do salão sul (leste, sul, oeste, norte)
        {'kind': 'bell', 'x': 24, 'y': 24, 'grupo': 'sinos', 'ordem': 1, 'abre': ['porta_sinos_a', 'porta_sinos_b'], 'msg': 'Os sinos ecoaram juntos e a porta de pedra subiu!'},
        {'kind': 'bell', 'x': 17, 'y': 27, 'grupo': 'sinos', 'ordem': 2, 'abre': ['porta_sinos_a', 'porta_sinos_b']},
        {'kind': 'bell', 'x': 9, 'y': 24, 'grupo': 'sinos', 'ordem': 3, 'abre': ['porta_sinos_a', 'porta_sinos_b']},
        {'kind': 'bell', 'x': 17, 'y': 21, 'grupo': 'sinos', 'ordem': 4, 'abre': ['porta_sinos_a', 'porta_sinos_b']},
        {'kind': 'mural', 'x': 14, 'y': 20, 'text': 'No teto, as brasas pintadas contam: "Nasce no leste, esquenta no sul, arde no oeste, descansa no norte." Quatro sinos esperam em cruz.'},
        {'kind': 'stoneDoor', 'x': 17, 'y': 19, 'id': 'porta_sinos_a'}, {'kind': 'stoneDoor', 'x': 18, 'y': 19, 'id': 'porta_sinos_b'},
        # braseiros: acender os quatro em 40 s
        {'kind': 'brazier', 'x': 6, 'y': 10, 'grupo': 'forja', 'apaga': 40, 'abre': ['porta_forja_a', 'porta_forja_b'], 'msg': 'As quatro brasas acesas! A porta da câmara se abre.'},
        {'kind': 'brazier', 'x': 29, 'y': 10, 'grupo': 'forja', 'apaga': 40, 'abre': ['porta_forja_a', 'porta_forja_b']},
        {'kind': 'brazier', 'x': 6, 'y': 15, 'grupo': 'forja', 'apaga': 40, 'abre': ['porta_forja_a', 'porta_forja_b']},
        {'kind': 'brazier', 'x': 29, 'y': 15, 'grupo': 'forja', 'apaga': 40, 'abre': ['porta_forja_a', 'porta_forja_b']},
        {'kind': 'stoneDoor', 'x': 17, 'y': 8, 'id': 'porta_forja_a'}, {'kind': 'stoneDoor', 'x': 18, 'y': 8, 'id': 'porta_forja_b'},
        {'kind': 'statue', 'x': 10, 'y': 21, 'text': 'Um ferreiro de pedra martela uma lâmina de fogo que nunca esfria.'},
        {'kind': 'statue', 'x': 24, 'y': 21, 'text': 'Outro ferreiro de pedra, com o mesmo martelo e uma coroa de chamas.'},
        {'kind': 'altar', 'x': 12, 'y': 12, 'text': 'Um altar de ferro com uma cavidade em forma de brasa. A forja ainda está quente, muito depois do último ferreiro.'},
        bau(8, 3, 'heatranite', id='bau_heatran'), bau(27, 3, 'fireStone', 3, id='bau_pedras3'), bau(11, 22, 'heatRock', id='bau_rocha3'),
        {'kind': 'torch', 'x': 4, 'y': 22, 'acesa': True}, {'kind': 'torch', 'x': 30, 'y': 22, 'acesa': True},
        {'kind': 'lavaRock', 'x': 8, 'y': 12}, {'kind': 'lavaRock', 'x': 26, 'y': 12}, {'kind': 'obsidianRock', 'x': 12, 'y': 26}, {'kind': 'obsidianRock', 'x': 24, 'y': 26},
    ]
    return {'id': 'templo_chama_3', 'name': 'Templo da Chama: Forja Antiga', 'rows': s.rows(), 'biome': 'vulcao', 'wild': True, 'escuro': 0.75,
            'objects': O, 'decor': [], 'people': [],
            'items': [{'x': 31, 'y': 26, 'item': 'maxRevive'}, {'x': 5, 'y': 14, 'item': 'charcoal', 'hidden': True}],
            'spots': {'templo3_sensor': [18, 5, 'down'], 'templo3_camara': [18, 3, 'down'], 'templo3_entrada': [4, 27, 'up'], 'dentro_templo_chama_3': [4, 27, 'up']},
            'warps': [
                {'x': 4, 'y': 28, 'dir': 'down', 'to': ['templo_chama_2', 37, 19], 'face': 'down', 'label': 'Escada'},
            ]}


# ---------------------------------------------------------------- pedras do ninho de Moltres (cratera, fora do templo)
def ninho_moltres_pedras(ctx):
    R = ctx['R']
    G = ctx['G']
    X0, Y0 = 800, 480
    x = 1080
    # linha da coluna x: de baixo para cima, acha a lava e a ilha
    col = [G[y - Y0, x - X0] for y in range(960 - 480 + 480 - 480, 0)] if False else None
    ys = list(range(845, 800, -1))
    lava = [y for y in ys if G[y - Y0, x - X0] == 'l']
    ilha = [y for y in ys if G[y - Y0, x - X0] == 'o' and y < max(lava)]
    base = max(lava)                                     # a lava mais ao sul
    topo_ilha = max(y for y in ilha if y < base) if ilha else min(lava)
    n = len([y for y in lava if y > topo_ilha])
    for i in range(n):
        R['objects'].append({'kind': 'strengthRock', 'x': x, 'y': base + 1 + 2 * i, 'id': f'pedra_moltres_{i + 1}'})
    R['spots']['brasas_moltres'] = [x, topo_ilha, 'up']
    ctx['info']['moltres_pedras'] = n
    R['objects'] += [
        {'kind': 'brazier', 'x': 1057, 'y': 821, 'acesa': True}, {'kind': 'brazier', 'x': 1063, 'y': 821, 'acesa': True},
        {'kind': 'statue', 'x': 1053, 'y': 820, 'text': 'Uma estátua de uma ave de fogo, de asas abertas. A pedra ainda está quente.'},
        {'kind': 'statue', 'x': 1065, 'y': 823, 'text': 'A mesma ave, de perfil. Dizem que ela só aparece para quem vem sem pressa.'},
        {'kind': 'sign', 'x': 1058, 'y': 823, 'text': 'Templo da Chama. Só entra quem aguenta o calor.'},
        {'kind': 'lavaRock', 'x': 1048, 'y': 830}, {'kind': 'lavaRock', 'x': 1086, 'y': 811},
        {'kind': 'obsidianRock', 'x': 1050, 'y': 808}, {'kind': 'obsidianRock', 'x': 1085, 'y': 838},
    ]
