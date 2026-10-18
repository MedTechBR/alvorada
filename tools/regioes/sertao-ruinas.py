# ================================================================ RUÍNAS DE PEDRA PINTADA (3 andares) — seção 11 do plano
def ruina(id, name, g, **kw):
    s = {'id': id, 'name': name, 'rows': g.rows(), 'objects': [], 'decor': [], 'spots': {}, 'people': [], 'pets': [], 'items': [], 'warps': [], 'biome': 'ruina', 'wild': True}
    s.update(kw); return s

# ---------------------------------------------------------------- Andar 1: Pátio das Pinturas (31 x 24)
g = Grid(31, 24, 'H')
g.carve(12, 19, 18, 22); g.put(15, 22, 'm')                      # antecâmara de entrada (tapete na última linha de chão)
g.carve(14, 17, 16, 18)                                          # corredor
g.carve(5, 11, 25, 16); g.carve(12, 12, 18, 15, 'Y')             # pátio com mosaico
g.carve(2, 4, 8, 8); g.carve(5, 9, 6, 10)                         # ala oeste (sino do poente)
g.carve(22, 4, 28, 8); g.carve(24, 9, 25, 10)                     # ala leste (sino do nascente)
g.carve(11, 5, 19, 9); g.carve(14, 10, 16, 10)                    # sala do meio-dia
g.carve(15, 4, 15, 4)                                            # vão do portão
g.carve(13, 2, 17, 3); g.put(15, 2, '>')                          # câmara da escada para baixo
g.carve(1, 12, 3, 14)                                            # nicho do tesouro (atrás da parede rachada em (4,13))
g.put(4, 13, 'H')
p1 = ruina('ruinas_pintada_1', 'Ruínas de Pedra Pintada: Pátio das Pinturas', g)
ob(p1, 'torch', 13, 20, acesa=True, msg='Uma tocha de pedra, acesa há mil anos. Ou há dez minutos.')
ob(p1, 'torch', 17, 20, acesa=True, msg='Uma tocha de pedra, acesa há mil anos. Ou há dez minutos.')
ob(p1, 'torch', 6, 12, acesa=True, msg='Uma tocha de pedra.'); ob(p1, 'torch', 24, 12, acesa=True, msg='Uma tocha de pedra.')
ob(p1, 'mural', 12, 11, 'PINTURA DO CENTRO: um disco amarelo bem no alto, e pessoas de braços erguidos olhando para ele. Embaixo, três marcas: uma à direita, uma no meio, uma à esquerda.')
ob(p1, 'mural', 21, 4, 'PINTURA DA ALA LESTE: o disco amarelo nasce atrás de uma serra. As pessoas se ajoelham. O sino de bronze tem o desenho de um sol baixo.')
ob(p1, 'mural', 3, 4, 'PINTURA DA ALA OESTE: o disco desce e as pessoas viram as costas. O sino tem o desenho de um sol deitado, quase sumindo.')
ob(p1, 'mural', 13, 5, 'PINTURA DA SALA DO MEIO: o disco bem alto, sem sombra. O sino do meio tem o desenho de um sol redondo e cheio. Uma frase riscada: "Nascente, meio-dia, poente. Nunca ao contrário."')
ob(p1, 'obelisk', 14, 18, 'Glifos desbotados. Uma tradução rabiscada com giz por um explorador: "A porta só ouve o sol na ordem do sol."')
ob(p1, 'obelisk', 16, 18)
ob(p1, 'brokenColumn', 8, 13); ob(p1, 'brokenColumn', 22, 15); ob(p1, 'brokenColumn', 8, 15); ob(p1, 'brokenColumn', 22, 13)
ob(p1, 'statue', 5, 7, 'Uma estátua de um felino de quatro patas, com chifres de pedra. A placa, quase apagada, diz TERRAKION.')
ob(p1, 'pot', 7, 14); ob(p1, 'pot', 23, 14); ob(p1, 'pot', 19, 6); ob(p1, 'pot', 11, 6)
# sinos na ordem do sol: leste (1), meio-dia (2), oeste (3); o portão da escada só abre com os três em ordem
ob(p1, 'bell', 25, 6, id='p1_sino_leste', grupo='ruinas_sinos', ordem=1, abre=['p1_porta'], nome='Sino do nascente', text=None)
ob(p1, 'bell', 14, 7, id='p1_sino_meio', grupo='ruinas_sinos', ordem=2, abre=['p1_porta'], nome='Sino do meio-dia')
ob(p1, 'bell', 4, 6, id='p1_sino_oeste', grupo='ruinas_sinos', ordem=3, abre=['p1_porta'], nome='Sino do poente')
ob(p1, 'stoneDoor', 15, 4, id='p1_porta', aberto=False, msg='Uma porta de pedra com um disco entalhado. Não se mexe. Falta algo que a faça ouvir o sol.')
ob(p1, 'crackedWall', 4, 13, chao='templefloor', msg='Uma rachadura grande na parede. O que está atrás parece oco.')
ob(p1, 'chest', 2, 12, item='aerodactylite', n=1)
ob(p1, 'chest', 2, 14, item='fossil_ambar', n=1)
p1['items'] += [{'x': 15, 'y': 14, 'item': 'rareCandy', 'hidden': True}, {'x': 23, 'y': 9, 'item': 'stardust', 'n': 2, 'hidden': True}, {'x': 6, 'y': 5, 'item': 'ultraBall', 'n': 2}]
p1['warps'] += [{'x': 15, 'y': 2, 'dir': 'up', 'to': ['ruinas_pintada_2', 5, 5], 'face': 'down', 'label': 'escada para a Galeria da Areia'}]
p1['spots'] = {'dentro_ruinas_pintada_1': [15, 21, 'up'], 'ruinas_pintada_1_entrada': [15, 21, 'up'], 'ruinas_pintada_1_escada': [15, 3, 'down']}
R.interiors.append(p1)

# ---------------------------------------------------------------- Andar 2: Galeria da Areia (36 x 24)
g = Grid(36, 24, 'H')
g.carve(2, 3, 8, 7); g.put(5, 3, '<')                              # chegada
g.carve(9, 5, 11, 6)
g.carve(12, 4, 28, 20, 'Q')                                        # galeria de areia movediça
def seguro(x0, y0, x1, y1): g.carve(x0, y0, x1, y1, 'z')
seguro(12, 5, 19, 6)                                               # entrada até o entroncamento
seguro(18, 5, 19, 12)                                              # descida
seguro(18, 11, 27, 12)                                             # corredor leste
seguro(26, 6, 27, 12)                                              # subida para a porta
seguro(20, 5, 25, 6)                                               # galho norte (placa 2)
seguro(18, 16, 25, 17); seguro(18, 13, 19, 17)                     # galho sul (placa 1)
g.carve(29, 6, 29, 6, 'E')                                         # vão do portão (parede x=29)
g.carve(30, 3, 34, 9, 'E'); g.carve(31, 4, 33, 8, 'Y'); g.put(32, 3, '>')   # câmara do Alfa e escada para baixo
for x in (12, 13, 14, 15, 16, 17): g.put(x, 4, 'H')
p2 = ruina('ruinas_pintada_2', 'Ruínas de Pedra Pintada: Galeria da Areia', g, afunda={'sala': 'ruinas_pintada_1', 'x': 15, 'y': 14})
ob(p2, 'strengthRock', 21, 6, id='p2_pedra_a')
ob(p2, 'strengthRock', 19, 16, id='p2_pedra_b')
ob(p2, 'plate', 25, 6, id='p2_placa_a', abre=['p2_porta'], trava=True)
ob(p2, 'plate', 25, 16, id='p2_placa_b', abre=['p2_porta'], trava=True)
ob(p2, 'stoneDoor', 29, 6, id='p2_porta', aberto=False, msg='Uma porta de pedra com duas mãos entalhadas. As duas precisam ser apertadas ao mesmo tempo, por pedras pesadas.')
ob(p2, 'mural', 3, 3, 'PINTURA: um crocodilo feito de areia, com olhos de pedra, deitado diante de uma porta. Ao redor, mãos empurram blocos para pesar as portas. A areia engole quem corre sem olhar.')
ob(p2, 'brokenColumn', 9, 4); ob(p2, 'brokenColumn', 9, 8)
ob(p2, 'chest', 26, 17, item='fossil_garra', n=1)
ob(p2, 'chest', 26, 5, item='tm051', n=1)
ob(p2, 'chest', 34, 8, item='sunStone', n=1) if False else None
p2['items'] += [{'x': 19, 'y': 12, 'item': 'tyranitarite', 'hidden': True}, {'x': 22, 'y': 12, 'item': 'excadrite', 'hidden': True}, {'x': 13, 'y': 6, 'item': 'golurkite', 'hidden': True},
                {'x': 6, 'y': 6, 'item': 'hyperPotion', 'n': 2}, {'x': 26, 'y': 9, 'item': 'revive'}]
p2['warps'] += [{'x': 5, 'y': 3, 'dir': 'up', 'to': ['ruinas_pintada_1', 15, 3], 'face': 'down', 'label': 'escada para o Pátio das Pinturas'},
                {'x': 32, 'y': 3, 'dir': 'up', 'to': ['ruinas_pintada_3', 13, 17], 'face': 'up', 'label': 'escada para a Câmara do Sol'}]
p2['spots'] = {'dentro_ruinas_pintada_2': [5, 5, 'down'], 'ruinas_pintada_2_chegada': [5, 5, 'down'], 'krookodile_alfa': [32, 6, 'down']}
R.interiors.append(p2)

# ---------------------------------------------------------------- Andar 3: Câmara do Sol (27 x 21), escura
g = Grid(27, 21, 'H')
g.carve(11, 17, 15, 18); g.put(13, 18, '<')                         # chegada (escada)
g.carve(12, 14, 14, 16)
g.carve(4, 5, 22, 13, 'E'); g.carve(8, 6, 18, 12, 'Y')               # câmara circular de mosaico
for (x, y) in [(4, 5), (5, 5), (4, 6), (22, 5), (21, 5), (22, 6), (4, 13), (5, 13), (4, 12), (22, 13), (21, 13), (22, 12)]: g.put(x, y, 'H')
g.carve(13, 4, 13, 4)                                              # vão do portão
g.carve(10, 1, 16, 3, 'Y'); g.put(13, 1, 'E')                       # santuário
p3 = ruina('ruinas_pintada_3', 'Ruínas de Pedra Pintada: Câmara do Sol', g, escuro=0.88)
for i, (x, y) in enumerate([(7, 7), (19, 7), (7, 12), (19, 12)]):
    ob(p3, 'brazier', x, y, grupo='ruinas_fogo', abre=['p3_porta'], apaga=26, msg='Um braseiro de pedra, apagado. Falta fogo. Um Pokémon de Fogo resolve.')
ob(p3, 'stoneDoor', 13, 4, id='p3_porta', aberto=False, msg='A porta do santuário tem um disco de sol entalhado. Quatro braseiros ao redor da câmara estão apagados.')
ob(p3, 'altar', 12, 2, pede=None, text='O ALTAR DO SOL: um disco de ouro polido, cheio de riscos de unha. Quem passou por aqui deixou presentes, e levou a luz.')
ob(p3, 'chest', 10, 2, item='nugget', n=3)
ob(p3, 'chest', 16, 2, item='sunStone', n=1)
ob(p3, 'statue', 6, 9, 'Uma estátua de gigante de pedra, sem rosto. Os braços são três blocos empilhados. REGIROCK, diz a placa.')
ob(p3, 'statue', 20, 9)
ob(p3, 'mural', 10, 4, 'INSCRIÇÃO: "Só a luz dos quatro cantos acorda o guardião." Embaixo, símbolos dos Vigias, em outro estilo, apagados quase por inteiro.')
p3['items'] += [{'x': 13, 'y': 8, 'item': 'maxRevive', 'hidden': True}, {'x': 5, 'y': 10, 'item': 'stardust', 'n': 2, 'hidden': True}]
p3['warps'] += [{'x': 13, 'y': 18, 'dir': 'down', 'to': ['ruinas_pintada_2', 32, 4], 'face': 'down', 'label': 'escada para a Galeria da Areia'}]
p3['spots'] = {'dentro_ruinas_pintada_3': [13, 16, 'up'], 'ruinas_pintada_3_chegada': [13, 16, 'up'], 'regirock_camara': [13, 2, 'down']}
pp(p3, 'ruinas_nalu', 'Dra. Nalu', {'preset': 'treinadora', 'hairStyle': 'ponytail', 'hair': '#3a2a22', 'skin': '#c98d62', 'hat': 'cap', 'cap': '#e0b030', 'capLogo': '#8a5a2a', 'top': '#4a8a5a', 'legs': 'shorts', 'pants': '#6a4a34', 'shoes': '#4a3428', 'bag': '#8a5a2a'}, 13, 15, ['Passei dez anos atrás desta câmara. A inscrição diz que quatro fogos acordam o guardião.', 'Eu só trouxe um fósforo. Você tem um Pokémon de Fogo?'], 'down', 0)
R.interiors.append(p3)

# entrada na fachada (Dunas Douradas: 960,350)
for x in (959, 960):
    R.warps.append({'x': x, 'y': 350, 'dir': 'up', 'to': ['ruinas_pintada_1', 15, 21], 'face': 'up', 'label': 'Ruínas de Pedra Pintada'})
R.spots['sertao_ruinas_entrada'] = [960, 353, 'up']
R.obj('obelisk', 955, 352); R.obj('obelisk', 964, 352)
R.obj('statue', 957, 351) if False else None
R.sign(958, 357, 'RUÍNAS DE PEDRA PINTADA\n"Quem corre na areia fofa chega cansado. Quem chega cansado, volta."')
