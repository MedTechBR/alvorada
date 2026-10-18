# Gera assets/maps/demo-biomas.json: mapa SÓ de teste dos biomas novos (abrir com ?mapa=demo-biomas).
# Um pedaço de cada bioma em volta de uma praça, e um mini-templo de dois andares com todas as mecânicas.
# Uso: python3 tools/gerar-demo-biomas.py
import json, math, os, random

W, OUT_H = 170, 74
random.seed(7)
g = [['.'] * W for _ in range(OUT_H)]

def noise(x, y, s=0):
    return (math.sin(x * 0.37 + s) + math.sin(y * 0.41 + s * 1.7) + math.sin((x + y) * 0.23 + s * 2.3)) / 3

def put(x, y, c):
    if 0 <= x < W and 0 <= y < OUT_H: g[y][x] = c

def ell(cx, cy, rx, ry, c, nz=0.25, s=0, on=None):
    for y in range(int(cy - ry - 3), int(cy + ry + 4)):
        for x in range(int(cx - rx - 3), int(cx + rx + 4)):
            if not (0 <= x < W and 0 <= y < OUT_H): continue
            if on and g[y][x] not in on: continue
            if math.hypot((x - cx) / rx, (y - cy) / ry) + noise(x, y, s) * nz < 1: g[y][x] = c

def rect(x0, y0, w, h, c, on=None):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if 0 <= x < W and 0 <= y < OUT_H and (not on or g[y][x] in on): g[y][x] = c

def blobs(x0, y0, w, h, c, th, s, on, sc=0.35):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if g[y][x] in on and noise(x * sc * 2.6, y * sc * 2.6, s) > th: g[y][x] = c

def path(pts, c, width=2):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        for k in range(n + 1):
            x = x0 + (x1 - x0) * k / n; y = y0 + (y1 - y0) * k / n
            for yy in range(int(y - width / 2), int(y + width / 2) + 1):
                for xx in range(int(x - width / 2), int(x + width / 2) + 1):
                    if math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= width / 2 + 0.2: put(xx, yy, c)

objects, items, warps, areas, signs = [], [], [], [], []
def obj(kind, x, y, **k): objects.append({'kind': kind, 'x': x, 'y': y, **k})

# ---------------- gelo (noroeste) ----------------
rect(0, 0, 44, 34, 'n')
for y in range(0, 36):
    for x in range(40, 48):
        if x + noise(x, y, 3) * 3 > 44: g[y][x] = '.' if y < 34 else g[y][x]
blobs(0, 4, 44, 30, 'N', 0.35, 1, ['n'])
ell(13, 12, 7, 4, 'I', 0.2, 2)
ell(13, 12, 9, 5.5, 'n', 0.15, 2, on=['N'])
rect(23, 18, 11, 7, 'i')                    # campo de gelo escorregadio (enigma)
blobs(2, 22, 18, 10, 'J', 0.3, 4, ['n'])
rect(4, 1, 34, 2, 'G'); put(20, 2, 'O')     # paredão de gelo com a entrada da caverna
warps.append({'x': 20, 'y': 2, 'dir': 'up', 'to': None, 'room': 'caverna_gelo', 'face': 'up', 'label': 'Caverna de Gelo'})
for (x, y) in [(23, 18), (33, 18), (27, 21), (23, 24), (31, 24), (29, 19)]: obj('stalagmiteIce', x, y)
items.append({'x': 33, 'y': 22, 'item': 'nevermeltIce' if False else 'iceStone'})
obj('igloo', 4, 26, text='Iglu do Seu Gélio. Ele pesca no lago congelado de manhã.')
obj('cabin', 30, 5, text='Cabana do guarda-florestal. Lareira acesa, chocolate quente.')
obj('snowman', 10, 20); obj('snowPineBig', 36, 26)
for (x, y) in [(2, 6), (6, 8), (24, 9), (28, 12), (38, 14), (3, 16), (16, 30), (36, 31), (20, 6), (40, 22)]: obj('snowPine', x, y)
signs.append({'kind': 'sign', 'x': 22, 'y': 25, 'text': 'Campo de gelo: quem pisa escorrega até bater em alguma coisa. Pense antes de andar!'})
areas.append({'name': 'Picos Gelados', 'biome': 'gelo', 'rect': [0, 0, 44, 34]})

# ---------------- vulcão (nordeste) ----------------
rect(84, 0, 44, 34, 'a')
for y in range(0, 36):
    for x in range(78, 88):
        if x - noise(x, y, 5) * 3 < 84: g[y][x] = '.'
blobs(84, 0, 44, 34, 'v', 0.2, 6, ['a'])
path([(102, 0), (104, 8), (112, 14), (116, 22), (124, 30)], 'l', 3)
ell(112, 12, 5, 3.5, 'l', 0.2, 7)
ell(112, 12, 7.5, 5.5, 'o', 0.3, 7, on=['a', 'v'])
ell(93, 25, 3.2, 2.2, 'q', 0.1, 8)
ell(93, 25, 5, 3.5, 'v', 0.1, 8, on=['a'])
rect(86, 1, 30, 2, 'U'); put(96, 2, 'O')
warps.append({'x': 96, 'y': 2, 'dir': 'up', 'to': None, 'room': 'caverna_lava', 'face': 'up', 'label': 'Caverna de Lava'})
path([(70, 20), (90, 20), (104, 20), (122, 20)], 'v', 2)
for x in range(112, 120):
    for y in range(18, 23):
        if g[y][x] == 'l': g[y][x] = 'B'
# a pedra de Força vira chão na lava (atalho para um item)
for y in range(28, 31):
    for x in range(102, 105):
        if (x, y) != (103, 29): put(x, y, 'l')
obj('strengthRock', 99, 29)
items.append({'x': 103, 'y': 29, 'item': 'fireStone'})
for (x, y) in [(88, 8), (106, 26), (120, 6), (90, 14), (124, 16)]: obj('lavaRock', x, y)
for (x, y) in [(96, 24), (90, 26)]: obj('fumarola', x, y)
obj('obsidianRock', 108, 9); obj('obsidianRock', 117, 15)
signs.append({'kind': 'sign', 'x': 92, 'y': 21, 'text': 'Fonte termal: entre na água quente para a equipe descansar. Não encoste na lava!'})
areas.append({'name': 'Vulcão Brasa', 'biome': 'vulcao', 'rect': [84, 0, 44, 34]})

# ---------------- deserto e sertão (sudoeste) ----------------
rect(0, 40, 44, 34, 'z')
for y in range(36, 42):
    for x in range(0, 46):
        if y + noise(x, y, 9) * 2 < 40: g[y][x] = '.'
rect(22, 40, 22, 34, 'h', on=['z'])
blobs(22, 40, 22, 34, 'K', 0.0, 10, ['h'])
blobs(22, 44, 22, 30, 'j', 0.25, 11, ['K'])
for (cx, cy) in [(6, 50), (14, 60), (8, 66)]: ell(cx, cy, 2.2, 1.6, 'Q', 0.15, cx)
rect(12, 44, 2, 12, 'C'); rect(18, 44, 2, 12, 'C')   # cânion: corredor entre paredões
path([(16, 40), (16, 58)], ':', 2)
items.append({'x': 16, 'y': 50, 'item': 'nugget'})
for (x, y) in [(3, 44), (9, 56), (2, 62), (20, 68), (11, 47)]: obj('cactus', x, y)
for (x, y) in [(26, 48), (34, 56), (40, 64), (28, 66)]: obj('mandacaru', x, y)
obj('taipa', 34, 44, text='Casa de taipa. Na janela, um vaso de flor de mandacaru.')
obj('skull', 6, 70); obj('skull', 38, 60)
signs.append({'kind': 'sign', 'x': 8, 'y': 46, 'text': 'CUIDADO: areia movediça! Parado, você afunda. Corra para sair.'})
areas.append({'name': 'Dunas do Sol', 'biome': 'deserto', 'rect': [0, 40, 22, 34]})
areas.append({'name': 'Sertão Velho', 'biome': 'sertao', 'rect': [22, 40, 22, 34]})

# ---------------- praia tropical e mangue (sudeste) ----------------
rect(84, 38, 44, 36, ':')
for y in range(36, 74):
    for x in range(78, 88):
        if x - noise(x, y, 12) * 3 < 84: g[y][x] = '.'
rect(108, 38, 20, 36, '~')
for y in range(38, 74):
    for x in range(100, 112):
        if x + noise(x, y, 13) * 2 > 106: g[y][x] = '~'
for y in range(38, 74):
    for x in range(98, 112):
        if g[y][x] == ':' and any(g[y][x + d] == '~' for d in (1, 2) if x + d < W): g[y][x] = 'A'
rect(116, 38, 12, 36, 'W', on=['~'])
ell(120, 46, 3, 2, ':', 0.1, 14); ell(120, 46, 4, 3, 'A', 0.1, 14, on=['~', 'W'])   # ilhota
rect(106, 46, 11, 2, 'T', on=['~', 'A', 'W'])                                         # banco de areia da maré
blobs(100, 52, 16, 20, '%', 0.25, 15, ['~'])
path([(84, 66), (92, 64), (100, 64), (108, 64), (126, 64)], '~', 2)                   # rio que corre para o mar
for y in range(62, 67):
    for x in range(84, 128):
        if g[y][x] == '~' and x < 112: g[y][x] = '→'
# mangue
rect(84, 56, 14, 18, 'p', on=[':', '.'])
for y in range(54, 74):
    for x in range(80, 100):
        if g[y][x] == 'p' and (y + noise(x, y, 18) * 2.5 < 57.5 or x + noise(x, y, 19) * 2.5 > 96.5): g[y][x] = ':'
blobs(84, 56, 14, 18, 'R', 0.55, 16, ['p'])
blobs(84, 56, 14, 18, '"', 0.4, 17, ['p'])
obj('coqueiro', 120, 45); items.append({'x': 121, 'y': 46, 'item': 'pearl'})
for (x, y) in [(90, 40), (98, 44), (94, 50)]: obj('coqueiro', x, y)
for (x, y) in [(86, 44), (102, 40)]: obj('palmeira', x, y)
obj('beachStall', 90, 46, text='Barraca da Dona Iara: água de coco, tapioca e protetor solar.')
obj('surfboard', 96, 47); obj('jangada', 101, 58); obj('driftwood', 88, 52)
for (x, y) in [(86, 60), (92, 66), (95, 58)]: obj('mangue', x, y)
signs.append({'kind': 'sign', 'x': 104, 'y': 44, 'text': 'Maré baixa: dá para ir a pé até a ilhota. Maré alta (6 h e 18 h): só nadando.'})
areas.append({'name': 'Praia Coral', 'biome': 'praia', 'rect': [84, 38, 44, 36]})
areas.append({'name': 'Mangue Fundo', 'biome': 'mangue', 'rect': [84, 56, 14, 18]})

# ---------------- ruínas e templo (norte, no meio) ----------------
rect(48, 2, 32, 26, 'X')
for y in range(0, 30):
    for x in range(44, 84):
        if g[y][x] == 'X' and (abs(x - 64) / 16) ** 2 + (abs(y - 15) / 13) ** 2 + noise(x, y, 20) * 0.25 > 1: g[y][x] = '.'
rect(54, 4, 20, 7, 'H')               # fachada do templo (paredão com porta)
rect(62, 9, 4, 2, 'E'); rect(63, 9, 2, 2, '^')
path([(64, 11), (64, 30)], 'Y', 2)
warps.append({'x': 63, 'y': 9, 'dir': 'up', 'to': None, 'room': 'templo_1', 'entry': [15, 20], 'face': 'up', 'label': 'Templo'})
warps.append({'x': 64, 'y': 9, 'dir': 'up', 'to': None, 'room': 'templo_1', 'entry': [16, 20], 'face': 'up', 'label': 'Templo'})
for x in (56, 60, 68, 72): obj('column', x, 12)
obj('statue', 58, 14); obj('statue', 69, 14)
obj('brazier', 61, 12, acesa=True); obj('brazier', 66, 12, acesa=True)
obj('brokenColumn', 52, 20); obj('brokenColumn', 76, 22); obj('obelisk', 50, 14); obj('pot', 74, 18); obj('pot', 54, 24)
signs.append({'kind': 'sign', 'x': 62, 'y': 18, 'text': 'TEMPLO DE ARÁ. Os antigos deixaram enigmas: força, fogo, chave e sinos.'})
areas.append({'name': 'Ruínas de Ará', 'biome': 'ruina', 'rect': [46, 0, 36, 30]})

# ---------------- serra das cavernas (sul, no meio) ----------------
ell(64, 62, 16, 9, 'r', 0.15, 21)
rect(48, 66, 34, 8, '.', on=['r'])
put(56, 65, 'O'); put(72, 65, 'O')
for x in range(54, 76): put(x, 66, '=') if g[66][x] == '.' else None
warps.append({'x': 56, 'y': 65, 'dir': 'up', 'to': None, 'room': 'caverna_cristal', 'face': 'up', 'label': 'Gruta de Cristal'})
warps.append({'x': 72, 'y': 65, 'dir': 'up', 'to': None, 'room': 'mina', 'face': 'up', 'label': 'Mina'})
signs.append({'kind': 'sign', 'x': 62, 'y': 67, 'text': 'À esquerda, a Gruta de Cristal. À direita, a mina velha (o vagonete ainda corre nos trilhos).'})
areas.append({'name': 'Serra Oca', 'biome': 'campo', 'rect': [46, 52, 36, 22]})

# ---------------- faixa leste: biomas do plano do mundo (salar, cânion, brejo, selva, termal, pampa) ----------------
rect(128, 0, 42, 74, '.')
rect(128, 0, 42, 12, ';'); ell(150, 6, 8, 3.5, '?', 0.2, 30)
rect(128, 12, 42, 14, '&'); rect(134, 14, 2, 10, 'C'); rect(146, 14, 2, 10, 'C'); rect(158, 13, 3, 9, 'C')
path([(128, 24), (140, 20), (152, 25), (169, 22)], '-', 3)
rect(128, 26, 42, 14, '/'); blobs(128, 26, 42, 14, '|', 0.35, 31, ['/']); ell(146, 33, 4, 2.5, '.', 0.2, 32); ell(160, 30, 3, 2, '.', 0.2, 33)
path([(130, 32), (142, 32), (150, 33), (166, 32)], 'B', 1)
rect(128, 40, 42, 16, '.'); blobs(128, 40, 42, 16, '"', 0.25, 34, ['.']); blobs(128, 40, 42, 16, 'd', 0.0, 35, ['.'])
rect(128, 56, 20, 18, 'X'); for_ = [(134, 62, 3, 2), (141, 66, 2.5, 1.8), (136, 69, 2, 1.5)]
for (cx, cy, rx, ry) in for_: ell(cx, cy, rx, ry, 'q', 0.1, cx)
rect(148, 56, 22, 18, '.'); blobs(148, 56, 22, 18, ',', 0.1, 36, ['.'])
path([(110, 36), (128, 36), (148, 36), (148, 40)], 'B', 2)
for y in range(35, 38):
    for x in range(110, 130):
        if g[y][x] not in ('~', 'W', 'B'): pass
obj('mural', 140, 9); obj('xiquexique', 131, 18); obj('xiquexique', 163, 17); obj('juazeiro', 150, 16)
for (x, y) in [(130, 44), (150, 46), (160, 52), (138, 50)]: obj('arvoreSelva', x, y)
for (x, y) in [(136, 44), (146, 52), (157, 43), (165, 48)]: obj('folhaGigante', x, y)
for (x, y) in [(130, 58), (144, 60), (131, 71)]: obj('bambu', x, y)
for (x, y) in [(138, 60), (139, 70), (145, 64)]: obj('lanternaPedra', x, y)
obj('umbu', 156, 62); obj('araucaria', 165, 58); obj('araucaria', 152, 70); obj('cercaVara', 150, 66); obj('cercaVara', 151, 66); obj('cercaVara', 152, 66)
obj('sucata', 162, 70); obj('boia', 116, 40)
for nm, bio, r in [('Salar Branco', 'salar', [128, 0, 42, 12]), ('Cânion Rubro', 'canion', [128, 12, 42, 14]), ('Brejo das Garças', 'brejo', [128, 26, 42, 14]),
                   ('Selva Funda', 'selva', [128, 40, 42, 16]), ('Fontes Termais', 'termal', [128, 56, 20, 18]), ('Pampa', 'pampa', [148, 56, 22, 18])]:
    areas.append({'name': nm, 'biome': bio, 'rect': r})

# ---------------- praça no meio e caminhos ----------------
rect(58, 33, 12, 7, 'P')
for pts in [[(58, 36), (44, 30), (30, 26)], [(70, 36), (84, 30), (96, 22)], [(58, 37), (44, 44), (30, 50)], [(70, 37), (84, 44), (94, 52)], [(64, 33), (64, 28)], [(64, 40), (64, 54)]]:
    path(pts, '=', 2)
for (x, y) in [(50, 34), (78, 34), (52, 42), (76, 42)]: obj('tree', x, y)
signs.append({'kind': 'sign', 'x': 61, 'y': 33, 'text': 'DEMO DOS BIOMAS (só para teste). Norte: templo. Noroeste: gelo. Nordeste: vulcão. Sudoeste: deserto. Sudeste: praia e mangue. Sul: cavernas.'})

# ---------------- interiores (abaixo da parte externa) ----------------
rooms = []
def room(id, name, x, y, rows, **k):
    w = max(len(r) for r in rows)
    rows = [r.ljust(w, '_') for r in rows]
    rooms.append({'id': id, 'name': name, 'x': x, 'y': y, 'rows': rows, **k}); return rooms[-1]

T1 = [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHEEEEEEEHHHHEEEEEEEEHHHHEEEEEEEHH',
    'HH0000000HHHH!!!!!!!!HHHHEEEEEEEHH',
    'HH0000000HHHH!!!!!!!!HHHHEEEEEEEHH',
    'HHEEEEEEEHHHHEEEEEEEEHHHHEEEEEEEHH',
    'HHHHEHHHHHHHHHHHEHHHHHHHHHHHEHHHHH',
    'HHHHEHHHHHHHHHHHEHHHHHHHHHHHEHHHHH',
    'HHYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYHH',
    'HHYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYHH',
    'HHHHHHHHHHHHHHHEEHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHEEHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHEEEEEEEEEEHHHHHHHHHHHHH',
    'HHHHHHHHHHHEEEEEEEEEEHEEHHHHHHHHHH',
    'HHHHHHHHHHHEEEEEEEEEEHEEHHHHHHHHHH',
    'HHHHHHHHHHHEEEEEEEEEEHEEHHHHHHHHHH',
    'HHHHHHHHHHHEEEEEEEEEEHHHHHHHHHHHHH',
    'HHHHHHHHHHHEEEEEEEEEEHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHYYHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHYYHHHHHHHHHHHHHHHHH',
    '_______________YY_________________',
]
r1 = room('templo_1', 'Templo de Ará', 2, 96, T1, biome='templo', abaixo='templo_2',
    objects=[
        # salão: a pedra de Força na placa abre as duas portas de pedra
        {'kind': 'plate', 'x': 12, 'y': 13, 'id': 'placaSalao', 'abre': ['portaSalaoA', 'portaSalaoB'], 'trava': True},
        {'kind': 'strengthRock', 'x': 12, 'y': 15, 'id': 'pedraSalao'},
        {'kind': 'stoneDoor', 'x': 15, 'y': 11, 'id': 'portaSalaoA', 'msg': 'As portas de pedra se arrastaram para o lado!'},
        {'kind': 'stoneDoor', 'x': 16, 'y': 11, 'id': 'portaSalaoB'},
        {'kind': 'brazier', 'x': 11, 'y': 17, 'acesa': True}, {'kind': 'brazier', 'x': 20, 'y': 17, 'acesa': True},
        {'kind': 'statue', 'x': 17, 'y': 12},
        # parede rachada no salão: esconderijo com item
        {'kind': 'crackedWall', 'x': 21, 'y': 14, 'id': 'paredeSalao', 'chao': 'templefloor'},
        # corredor: a alavanca troca as grades (abre a oeste, fecha a do norte)
        {'kind': 'lever', 'x': 2, 'y': 9, 'id': 'alavancaCorredor', 'alterna': ['gradeOeste', 'gradeNorte'], 'nome': 'Alavanca das grades'},
        {'kind': 'barsGate', 'x': 4, 'y': 7, 'id': 'gradeOeste'},
        {'kind': 'barsGate', 'x': 16, 'y': 7, 'id': 'gradeNorte', 'aberto': True},
        {'kind': 'lockedDoor', 'x': 28, 'y': 7, 'id': 'portaLeste', 'chave': 'chave_pequena', 'chaveNome': 'Chave Pequena'},
        # sala oeste: duas tochas do outro lado do fosso; acesas, sobe a ponte
        {'kind': 'torch', 'x': 2, 'y': 2, 'grupo': 'oeste', 'abre': ['ponteOeste']},
        {'kind': 'torch', 'x': 8, 'y': 2, 'grupo': 'oeste', 'abre': ['ponteOeste']},
        # sala norte: o baú com a chave fica depois da faixa de chão rachado
        {'kind': 'chest', 'x': 17, 'y': 2, 'item': 'chave_pequena', 'itemNome': 'Chave Pequena', 'id': 'bauChave'},
        # sala leste: três sinos em ordem abrem a escada para o subsolo
        {'kind': 'bell', 'x': 25, 'y': 2, 'grupo': 'sinos', 'ordem': 1, 'abre': ['escadaLeste'], 'msg': 'Os três sinos ecoaram juntos… o chão se abriu numa escada!'},
        {'kind': 'bell', 'x': 27, 'y': 2, 'grupo': 'sinos', 'ordem': 3},
        {'kind': 'bell', 'x': 29, 'y': 2, 'grupo': 'sinos', 'ordem': 2},
        {'kind': 'sign', 'x': 31, 'y': 5, 'text': 'Primeiro o da esquerda, depois o da direita; o do meio fala por último.'},
        {'kind': 'sign', 'x': 13, 'y': 16, 'text': 'A pedra pesada abre o caminho. Só um Pokémon forte a empurra.'},
        {'kind': 'sign', 'x': 3, 'y': 5, 'text': 'Fogo do outro lado do fosso. Um golpe de Fogo acende de longe.'},
    ],
    mecanismos=[
        {'id': 'ponteOeste', 'tipo': 'ponte', 't': 'templefloor', 'pts': [[5, 3], [5, 4]], 'msg': 'Uma ponte de pedra subiu do fosso!'},
        {'id': 'escadaLeste', 'tipo': 'blocos', 't': 'stairdown', 'pts': [[28, 5]]},
    ])
items_rooms = [(r1, 22, 14, 'rareCandy'), (r1, 5, 2, 'superPotion')]

T2 = [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHEEEEEEEEEEEEEEEEEEEEEEEEEEEE<EHH',
    'HHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEHH',
    'HHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEHH',
    'HHEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEHH',
    'HHHHHHHHHHHEEHHHHHHHHHHHHHHHEEHHHH',
    'HHHHHHHHHHHEEHHHHHHHHHHHHHHHEEHHHH',
    'HHEEEEEEEEiiiiiiiiiiiiiEEEEEEEEEHH',
    'HHEEEEEEEEiiiiiiiiiiiiiEEEEEEEEEHH',
    'HHEEEEEEEEiiiiiiiiiiiiiEE00EEEEEHH',
    'HHEEEEEEEEiiiiiiiiiiiiiEE00EEEEEHH',
    'HHEEEEEEEEiiiiiiiiiiiiiEEEEEEEEEHH',
    'HHEEEEEEEEiiiiiiiiiiiiiEEEEEEEEEHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHEEHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHEEHHHHH',
    'HHEEEEEEEEEEEEElllEEEEEEEEEEEEEEHH',
    'HHEEEEEEEEEEEEElllEEEEEEEEEEEEEEHH',
    'HHEEEEEEEEEEEEElllEEEEEEEEEEEEEEHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
]
r2 = room('templo_2', 'Cripta de Ará', 60, 96, T2, biome='templo', escuro=True,
    objects=[
        {'kind': 'brazier', 'x': 6, 'y': 2}, {'kind': 'brazier', 'x': 20, 'y': 2},
        {'kind': 'crystal', 'x': 2, 'y': 5}, {'kind': 'crystalPink', 'x': 31, 'y': 5},
        # gelo: chegar ao outro lado escorregando, batendo nas estalagmites
        {'kind': 'stalagmiteIce', 'x': 14, 'y': 8}, {'kind': 'stalagmiteIce', 'x': 22, 'y': 10}, {'kind': 'stalagmiteIce', 'x': 18, 'y': 13},
        {'kind': 'stalagmiteIce', 'x': 10, 'y': 11}, {'kind': 'stalagmiteIce', 'x': 17, 'y': 9},
        {'kind': 'iceBlock', 'x': 5, 'y': 10, 'id': 'blocoGelo'},
        # buraco no caminho: a pedra de Força tapa
        {'kind': 'strengthRock', 'x': 25, 'y': 9, 'id': 'pedraBuraco'},
        # placa do outro lado da fenda de lava: a ponte aparece quando algo pesa nela
        {'kind': 'plate', 'x': 12, 'y': 17, 'id': 'placaPonte', 'abre': ['ponteLava']},
        {'kind': 'strengthRock', 'x': 10, 'y': 17, 'id': 'pedraPonte'},
        {'kind': 'chest', 'x': 29, 'y': 17, 'item': 'rareCandy', 'n': 2, 'id': 'bauCripta'},
        {'kind': 'torch', 'x': 27, 'y': 16, 'apaga': 12, 'grupo': 'cripta', 'abre': []},
        {'kind': 'sign', 'x': 3, 'y': 8, 'text': 'No gelo não há freio: você só para quando bate.'},
    ],
    mecanismos=[{'id': 'ponteLava', 'tipo': 'ponte', 't': 'bridge', 'pts': [[15, 17], [16, 17], [17, 17]], 'msg': 'Uma ponte desceu sobre a lava!'}])

room('caverna_gelo', 'Caverna de Gelo', 118, 96, [
    'GGGGGGGGGGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGGGGGGGGGG',
    'GGeeeeeeeeGGGGeeeeeeeeGG',
    'GGeeeeeeeeeeeeeeeIIIeeGG',
    'GGeeiiiiieeeeeeeIIIIeeGG',
    'GGeeiiiiieeeeeeeeIIeeeGG',
    'GGeeeeeeeeeeeeeeeeeeeeGG',
    'GGeeeeeeeeeeGGGGeeeeeeGG',
    'GGeeeeeeeeeeGeeeeeeeeeGG',
    'GGGGGGGGGGeeGGGGGGGGGGGG',
    '__________ee____________',
], biome='caverna', clima={'tinta': 0xe8f2ff, 'neve': 0.15},
    objects=[{'kind': 'stalagmiteIce', 'x': 3, 'y': 2}, {'kind': 'stalagmiteIce', 'x': 20, 'y': 7}, {'kind': 'crackedIce', 'x': 12, 'y': 8, 'chao': 'icefloor'},
             {'kind': 'crystal', 'x': 15, 'y': 2}])
room('caverna_lava', 'Caverna de Lava', 2, 140, [
    'UUUUUUUUUUUUUUUUUUUUUU',
    'UUUUUUUUUUUUUUUUUUUUUU',
    'UUuuuuuulllluuuuuuuuUU',
    'UUuuuuuulllluuuuuuuuUU',
    'UUuuuoouulllluuuuuuuUU',
    'UUuuuoouulllluuuuqquUU',
    'UUuuuuuuulllluuuuqquUU',
    'UUuuuuuuuuuuuuuuuuuuUU',
    'UUUUUUUUUuuUUUUUUUUUUU',
    '_________uu___________',
], biome='caverna', escuro=0.55, clima={'brasas': 0.6, 'calor': 0.6, 'tinta': 0xffe4d4, 'som': 'lava'},
    objects=[{'kind': 'lavaRock', 'x': 3, 'y': 2}, {'kind': 'lavaRock', 'x': 15, 'y': 6}, {'kind': 'plate', 'x': 4, 'y': 7, 'abre': ['ponteLavaC']},
             {'kind': 'strengthRock', 'x': 6, 'y': 6}, {'kind': 'fumarola', 'x': 18, 'y': 3}],
    mecanismos=[{'id': 'ponteLavaC', 'tipo': 'ponte', 't': 'bridge', 'pts': [[8, 3], [9, 3], [10, 3], [11, 3]]}])
room('caverna_cristal', 'Gruta de Cristal', 48, 140, [
    '$$$$$$$$$$$$$$$$$$$$$$$$',
    '$$$$$$$$$$$$$$$$$$$$$$$$',
    '$$ZZZZZZSSSSSSSSZZZZZZ$$',
    '$$ZZZZSSSSSSSSSSSSZZZZ$$',
    '$$ZZSSSSSS$$$$SSSSSSZZ$$',
    '$$ZSSSSSSS$$$$SSSSSSSZ$$',
    '$$ZZSSSSSSSSSSSSSSSSZZ$$',
    '$$ZZZZSSSSSSSSSSSSZZZZ$$',
    '$$$$$$$$$$SSSS$$$$$$$$$$',
    '__________SSSS__________',
], biome='cristal', escuro=0.85,
    objects=[{'kind': 'crystal', 'x': 3, 'y': 2}, {'kind': 'crystalPink', 'x': 20, 'y': 3}, {'kind': 'crystal', 'x': 9, 'y': 6}, {'kind': 'crystalPink', 'x': 15, 'y': 6},
             {'kind': 'crystal', 'x': 12, 'y': 3}, {'kind': 'stalagmite', 'x': 5, 'y': 5}])
room('mina', 'Mina Velha', 96, 140, [
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrSSSSSSSSSSSSSSSSSSSSrrSSrr',
    'rrSS++++++++++++++++++++SSrr',
    'rrSS+SSSSSSSSSSSSSSSSSrrSSrr',
    'rrSS+SSSSSSSSSSSSSSSSSrrSSrr',
    'rrSS+++++SSSSSSSSSSSSSSSSSrr',
    'rrSSSSSSSSSSSSSSSSSSSSSSSSrr',
    'rrrrrrrrrrrrSSSSrrrrrrrrrrrr',
    '____________SSSS____________',
], biome='mina', escuro=0.5,
    objects=[{'kind': 'cart', 'x': 6, 'y': 3}, {'kind': 'crackedRock', 'x': 24, 'y': 3, 'chao': 'darkcave', 'msg': 'O vagonete arrebentou a parede rachada!'},
             {'kind': 'torch', 'x': 2, 'y': 2, 'acesa': True}, {'kind': 'torch', 'x': 20, 'y': 7, 'acesa': True}, {'kind': 'barrel', 'x': 3, 'y': 7}, {'kind': 'barrel', 'x': 22, 'y': 7},
             {'kind': 'sign', 'x': 8, 'y': 2, 'text': 'Empurre o vagonete: ele corre até o fim dos trilhos.'},
             {'kind': 'raioGate', 'x': 12, 'y': 8, 'periodo': 2}, {'kind': 'raioGate', 'x': 13, 'y': 8, 'periodo': 2},
             {'kind': 'raioGate', 'x': 14, 'y': 7, 'periodo': 2, 'fase': 1}, {'kind': 'raioGate', 'x': 15, 'y': 7, 'periodo': 2, 'fase': 1}])

# entradas e saídas: liga as portas de fora às salas (entrada = 1 bloco acima da saída de baixo)
by = {r['id']: r for r in rooms}
def exits(r):
    h = len(r['rows']); last = r['rows'][-1]
    return [(i, h - 1) for i, c in enumerate(last) if c != '_']
for w in [q for q in warps if 'room' in q]:
    r = by[w.pop('room')]; ex = exits(r)
    ent = w.pop('entry', None) or [ex[0][0], ex[0][1] - 1]
    w['to'] = [r['x'] + ent[0], r['y'] + ent[1]]
    for (i, j) in ex:
        warps.append({'x': r['x'] + i, 'y': r['y'] + j, 'dir': 'down', 'to': [w['x'], w['y'] + 1], 'face': 'down', 'label': 'saída'})
seen = set(); uw = []
for w in warps:
    k = (w['x'], w['y'])
    if k in seen: continue
    seen.add(k); uw.append(w)
warps = uw
# escadas do templo (subir do subsolo volta para o corredor; a escada leste desce depois dos sinos)
warps.append({'x': r2['x'] + 30, 'y': r2['y'] + 2, 'dir': 'up', 'to': [r1['x'] + 29, r1['y'] + 9], 'face': 'down', 'label': 'escada'})
warps.append({'x': r1['x'] + 28, 'y': r1['y'] + 5, 'dir': 'any', 'to': [r2['x'] + 29, r2['y'] + 3], 'face': 'down', 'label': 'escada', 'requer': 'grupo:sinos', 'msg': 'Só pedra aqui.'})
for (r, x, y, it) in items_rooms: items.append({'x': r['x'] + x, 'y': r['y'] + y, 'item': it})
items.append({'x': by['caverna_gelo']['x'] + 14, 'y': by['caverna_gelo']['y'] + 8, 'item': 'neverMeltIce'})
items.append({'x': r2['x'] + 28, 'y': r2['y'] + 12, 'item': 'ultraBall', 'n': 3})

H = 156
rows = [''.join(r) for r in g]
J = {
    'name': 'Demo dos biomas', 'comment': 'SÓ PARA TESTE (?mapa=demo-biomas). Gerado por tools/gerar-demo-biomas.py; não faz parte da aventura.',
    'w': W, 'h': H, 'outdoorH': OUT_H, 'base': 'void',
    'teste': {'equipe': [[4, 18], [66, 18], [25, 16], [7, 16]]},
    'ops': [{'op': 'stamp', 'x': 0, 'y': 0, 'rows': rows}],
    'objects': objects + signs, 'interiors': rooms, 'warps': warps, 'items': items,
    'spots': {'inicio': [64, 37, 'down']}, 'areas': [{'name': 'Praça da Demo', 'biome': 'vila', 'rect': [52, 30, 24, 14]}] + areas,
    'trees': [], 'people': [{'id': 'guia', 'name': 'Guia', 'look': 'professor', 'x': 66, 'y': 35, 'dir': 'down', 'wander': 0, 'lines': [['Este mapa é só para testar os biomas novos.', 'Use o F3 para ver o FPS e as Opções para mudar a qualidade.']]}],
}
out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'maps', 'demo-biomas.json')
with open(out, 'w') as f: json.dump(J, f, ensure_ascii=False, indent=1)
print('ok', out, len(objects), 'objetos', len(warps), 'passagens')
