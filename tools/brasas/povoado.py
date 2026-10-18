# Vila Termas, Ilha do Basalto e o Ilhote do Farol: prédios, salas feitas à mão, moradores, enfeites e viagens.
import numpy as np
from base import *
from cena import *
import layout

OLHA = {
    'joy': {'preset': 'treinadora', 'hair': '#f08ab0', 'hairStyle': 'long', 'top': '#ffffff', 'trim': '#f08ab0', 'pants': '#f4c0d0', 'shoes': '#f08ab0', 'bagStyle': None},
    'vendedor': {'preset': 'treinador', 'hat': 'cap', 'cap': '#e8643a', 'top': '#e8643a', 'legs': 'pants', 'pants': '#2a3a5a'},
    'hana': {'preset': 'mae', 'hairStyle': 'bun', 'hair': '#e8e4dc', 'skin': '#efc19b', 'top': '#e0a0b8', 'trim': '#f8ecd8', 'pants': '#6a3a5a', 'shoes': '#5a3a24'},
    'brasao': {'preset': 'montanhista', 'hat': None, 'hair': '#2a1a14', 'skin': '#a06a44', 'outfit': 'jacket', 'top': '#6a3a2a', 'trim': '#c8602a', 'pants': '#3a2a24', 'shoes': '#2a1a14', 'bagStyle': None},
    'lava': {'preset': 'professor', 'hair': '#c04a2a', 'skin': '#efc19b', 'outfit': 'coat', 'top': '#f4f4f0', 'trim': '#e8643a', 'pants': '#3a3a3a', 'shoes': '#5a3a24'},
    'pousada': {'preset': 'mae', 'hairStyle': 'ponytail', 'hair': '#3a2a22', 'skin': '#c98d62', 'top': '#e8c050', 'trim': '#fff6e8', 'pants': '#5a3a2a', 'shoes': '#5a3a24'},
    'marujo': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#2a4a7a', 'capLogo': '#f2f2f2', 'top': '#2a4a7a', 'trim': '#f2f2f2', 'pants': '#3a3a5a', 'hair': '#5a3a2a', 'bagStyle': None},
    'pescador': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#4a7a3a', 'capLogo': '#4a7a3a', 'hair': '#b9b4ae', 'top': '#7a8a5a', 'trim': '#4a5a3a', 'pants': '#3a5a9a', 'bagStyle': 'shoulder', 'bag': '#8a6a3a'},
    'banhista': {'preset': 'treinadora', 'hairStyle': 'bun', 'hair': '#3a2a22', 'outfit': 'shirt', 'top': '#f2f2f2', 'legs': 'shorts', 'pants': '#e0a0b8', 'shoes': '#f2f2f2', 'bagStyle': None},
    'faroleiro': {'preset': 'montanhista', 'hat': 'cap', 'cap': '#f2f2f2', 'capLogo': '#3a8ad8', 'hair': '#e8e4dc', 'top': '#e8e0d0', 'pants': '#3a5a9a', 'shoes': '#5a3a24', 'bagStyle': None},
}


def aplicar(ctx):
    R, G = ctx['R'], ctx['G']
    C = Cena(R, G)
    ctx['C'] = C
    ctx['previa_objs'] = []

    # ------------------------------------------------------------ prédios da vila e das ilhas
    to_feito = {'centro': 'centro_termas', 'mercado': 'loja_termas', 'banhos': 'casa_banhos', 'pousada': 'pousada_vapor',
                'forja': 'forja_termas', 'dra_lava': 'casa_vulcanologa'}
    extras = {
        'casa_n3': {'interior': {'npc': {'id': 'termas_estudante', 'name': 'Estudante Mayara', 'look': 'menina',
                                         'lines': ['Vim fazer a minha tese sobre as fontes termais. Passei a semana mergulhada, e agora o dedo parece uma ameixa.']}}},
        'casa_l1': {'interior': {'nome': 'Casa da Dona Ritinha', 'itens': [['oranBerry', 2]]}},
        'casa_s1': {'interior': {'falas': ['Aqui o chão esquenta no inverno. É o melhor aquecedor que existe.']}},
        'casa_s3': {'interior': {'nome': 'Casa do Seu Cinzas', 'itens': [['hardStone', 1]]}},
        'barqueiro_basalto': {'interior': {'nome': 'Cabana do Barqueiro', 'npc': {'id': 'basalto_zemare', 'name': 'Zé Maré', 'look': OLHA['marujo'],
                                           'lines': ['Eu cuido do embarcadouro e da cabana. O Barco das Brasas para aqui só no fim da tarde.']}}},
        'pescador': {'interior': {'nome': 'Casa do Pescador Gaudêncio', 'npc': {'id': 'pescador_gaudencio', 'name': 'Pescador Gaudêncio', 'look': OLHA['pescador'],
                                    'lines': ['A areia preta daqui esquenta o pé, mas dá uma sorte danada na pesca. Os peixes gostam do calor.']}}},
        'armazem': {'interior': {'nome': 'Armazém de Pedra', 'tipo': 'oficina', 'falas': ['Guardamos aqui as redes e as caixas do barco. Tudo cheira a sal e a pedra quente.']}},
        'farol': {'interior': {'nome': 'Farol das Brasas', 'tipo': 'escritorio', 'npc': {'id': 'faroleiro_tobias', 'name': 'Faroleiro Tobias', 'look': OLHA['faroleiro'],
                                  'lines': ['Eu acendo a luz todas as noites para os barcos não se perderem entre as ilhas. De longe, o vulcão parece outro farol, mas esse não obedece ninguém.']}}},
    }
    for chave, (kind, x, y, fw, porta) in layout.PREDIOS.items():
        # terreno liso sob o prédio e uma folga na frente
        sel = retangulo(x - 1, y - 1, fw + 2, 6)
        G[sel & np.isin(G, list('A:"aovq;,')) ] = '.'
        o = {'kind': kind, 'x': x, 'y': y}
        if chave in to_feito:
            o['to'] = to_feito[chave]
        o.update(extras.get(chave, {}))
        R['objects'].append(o)
        C.marca(x, y, fw, 3, 0)
        C.marca(x - 1, y + 3, fw + 2, 2)    # a frente fica livre
    # a frente das casas gerais: capim liso e caminho curto
    # ------------------------------------------------------------ salas feitas à mão
    salas(R)
    # ------------------------------------------------------------ praça, estradas e enfeites da vila
    vila(ctx, C)
    basalto(ctx, C)
    farol(ctx, C)
    bichos(ctx, C)
    viagens(R)


# ---------------------------------------------------------------- interiores
def salas(R):
    I = R['interiors']
    rug = lambda x, y: {'kind': 'rug', 'x': x, 'y': y}

    # --- Centro Pokémon (lanternas de papel, chão de madeira)
    rows = paredes(15, 10, 'f', 7)
    I.append({'id': 'centro_termas', 'name': 'Centro Pokémon de Vila Termas', 'rows': rows, 'biome': 'termal',
              'objects': [
                  {'kind': 'counter', 'x': 5, 'y': 3}, {'kind': 'pc', 'x': 10, 'y': 2},
                  {'kind': 'machine', 'x': 2, 'y': 2, 'text': 'A máquina de cura. Zumbe baixinho, como uma chaleira, e deixa os Pokémon com cheiro de banho recém-tomado.'},
                  {'kind': 'plant', 'x': 1, 'y': 7}, {'kind': 'plant', 'x': 13, 'y': 7},
                  {'kind': 'table', 'x': 11, 'y': 5}, {'kind': 'shelf', 'x': 13, 'y': 2, 'text': 'Revistas sobre as fontes termais e um mapa do arquipélago. A ilha mais ao sul está riscada de caneta vermelha.'},
                  {'kind': 'lanternaPedra', 'x': 4, 'y': 2, 'text': 'Uma lanterna de papel acesa. A chama dança no vapor que vem de fora.'},
                  {'kind': 'lanternaPedra', 'x': 9, 'y': 2, 'text': 'Uma lanterna de papel acesa.'},
                  {'kind': 'lanternaPedra', 'x': 1, 'y': 3}, {'kind': 'lanternaPedra', 'x': 13, 'y': 4},
              ],
              'decor': [rug(6, 6)],
              'people': [
                  {'id': 'joy_termas', 'name': 'Enfermeira Joy', 'look': OLHA['joy'], 'x': 7, 'y': 2, 'dir': 'down', 'heal': True, 'all': True,
                   'lines': ['Bem-vindo ao Centro Pokémon de Vila Termas! Aqui a gente cura no vapor.', 'Pronto! Seus Pokémon estão tão relaxados que quase dormiram.']},
                  {'id': 'viajante_termas', 'name': 'Viajante', 'look': 'montanhista', 'x': 3, 'y': 6, 'dir': 'right', 'wander': 1,
                   'lines': ['Cheguei no Barco das Brasas e o Seu Zé Maré me avisou: o Camerupt dos Campos de Cinza abre cratera onde bem entende. Olhe onde pisa.']},
                  {'id': 'treinador_termas', 'name': 'Treinador Anselmo', 'look': 'treinador', 'x': 12, 'y': 7, 'dir': 'left', 'wander': 1,
                   'lines': ['Meu Magmar adora o Centro daqui. A temperatura é a de casa.']},
              ],
              'spots': {'centro_termas_balcao': [7, 4, 'up']}})

    # --- Mercado
    rows = paredes(11, 9, 't', 5)
    I.append({'id': 'loja_termas', 'name': 'Mercado de Vila Termas', 'rows': rows, 'biome': 'termal',
              'objects': [{'kind': 'counter', 'x': 1, 'y': 4}] + [{'kind': 'estante', 'x': x, 'y': 2, 'text': t} for x, t in
                         [(6, 'Pedras do Fogo numa vitrine, cada uma com uma chama presa dentro.'), (7, 'Antiqueimaduras empilhadas até o teto. Aqui elas saem mais que Poção.'),
                          (8, 'Rochas Quentes, ainda mornas. Seguram o sol por muito tempo.'), (9, 'Carvão em saquinhos de pano e um cartaz: "Para o seu Pokémon de Fogo mandar bem".')]] +
                         [{'kind': 'plant', 'x': 9, 'y': 6}],
              'decor': [rug(4, 6)],
              'people': [
                  {'id': 'vendedor_termas', 'name': 'Vendedora', 'look': OLHA['vendedor'], 'x': 2, 'y': 3, 'dir': 'down', 'lines': ['Mercado de Vila Termas! Antiqueimadura, Pedra do Fogo e Rocha Quente: o que o vulcão pede.']},
                  {'id': 'cliente_termas', 'name': 'Cliente', 'look': 'menino', 'kid': True, 'x': 7, 'y': 5, 'dir': 'left', 'wander': 1,
                   'lines': ['Vim trocar uma Pedra do Fogo por três Antiqueimaduras. O vulcão deve ter notado, ele anda de mau humor.']},
              ]})

    # --- Casa de Banhos
    rows = paredes(17, 12, 't', 8)
    preenche(rows, 3, 4, 4, 4, 'q'); preenche(rows, 10, 4, 4, 4, 'q'); preenche(rows, 7, 8, 3, 2, 'q')
    preenche(rows, 2, 3, 6, 1, 'f'); preenche(rows, 9, 3, 6, 1, 'f')
    I.append({'id': 'casa_banhos', 'name': 'Casa de Banhos', 'rows': rows, 'biome': 'termal',
              'objects': [{'kind': 'plant', 'x': 1, 'y': 3}, {'kind': 'plant', 'x': 15, 'y': 3}, {'kind': 'plant', 'x': 1, 'y': 9}, {'kind': 'plant', 'x': 15, 'y': 9},
                          {'kind': 'bench', 'x': 2, 'y': 10, 'text': 'Um banco de madeira, quente de tanto vapor.'}, {'kind': 'bench', 'x': 13, 'y': 10},
                          {'kind': 'lanternaPedra', 'x': 7, 'y': 4}, {'kind': 'lanternaPedra', 'x': 9, 'y': 4},
                          {'kind': 'shelf', 'x': 5, 'y': 2, 'text': 'Toalhas dobradas e cestinhos de sabonete de cinza vulcânica.'},
                          {'kind': 'shelf', 'x': 11, 'y': 2, 'text': 'Um aviso: "Entre devagar. A água cura o corpo, mas queima a pressa."'}],
              'decor': [], 'spots': {'banhos_entrada': [8, 9, 'up']},
              'people': [
                  {'id': 'dona_hana', 'name': 'Dona Hana', 'look': OLHA['hana'], 'x': 8, 'y': 2.6, 'dir': 'down',
                   'lines': ['Bem-vindo à Casa de Banhos. As águas daqui curam a equipe toda. É só entrar na piscina e ficar um pouquinho quieto.',
                             'O banho custaria trezentos, mas quem sobe o vulcão e volta inteiro merece cortesia da casa.']},
                  {'id': 'banhista_a', 'name': 'Banhista Tomoe', 'look': OLHA['banhista'], 'x': 2, 'y': 5, 'dir': 'right',
                   'lines': ['Eu fico duas horas na água. Meu Slowpoke fica seis, e ainda diz que foi pouco.']},
                  {'id': 'banhista_b', 'name': 'Vovô Kenji', 'look': 'montanhista', 'x': 14, 'y': 5, 'dir': 'left',
                   'lines': ['Já vi o vulcão acordar duas vezes. Das duas, a primeira coisa que fiz foi entrar na água quente e esperar passar.']},
              ],
              'pets': [{'dex': 79, 'x': 5, 'y': 6, 'wander': 0, 'say': 'O Slowpoke boia na água quente de olhos fechados. Parece ter chegado a uma conclusão importante.'}]})

    # --- Pousada do Vapor
    rows = paredes(15, 11, 'f', 7)
    I.append({'id': 'pousada_vapor', 'name': 'Pousada do Vapor', 'rows': rows, 'biome': 'termal',
              'objects': [
                  {'kind': 'bed', 'x': 2, 'y': 2}, {'kind': 'bed', 'x': 4, 'y': 2}, {'kind': 'bed', 'x': 6, 'y': 2},
                  {'kind': 'plant', 'x': 1, 'y': 8}, {'kind': 'estante', 'x': 9, 'y': 2, 'text': 'Livros de hóspedes, de receitas e um caderno de visitas aberto na página do vulcão.'},
                  {'kind': 'fogao', 'x': 11, 'y': 2, 'text': 'O fogão da pousada. Ao lado, uma panela de ovos cozinhando no vapor de uma fenda no chão.'},
                  {'kind': 'table', 'x': 11, 'y': 5}, {'kind': 'table', 'x': 3, 'y': 6},
                  {'kind': 'fumarola', 'x': 13, 'y': 4},
                  {'kind': 'lanternaPedra', 'x': 9, 'y': 8}, {'kind': 'plant', 'x': 13, 'y': 8},
              ],
              'decor': [rug(2, 4), rug(5, 4), rug(6, 7)],
              'people': [
                  {'id': 'dona_vapor', 'name': 'Dona Cida do Vapor', 'look': OLHA['pousada'], 'x': 10, 'y': 4, 'dir': 'left',
                   'lines': ['Bem-vindo à Pousada do Vapor! Os ovos cozinham sozinhos na fenda do chão, é só colocar o cesto.', 'Todo dia de manhã tem ovo cozido para os hóspedes. E para quem sobe o vulcão com fome.']},
                  {'id': 'hospede_1', 'name': 'Hóspede Lúcia', 'look': 'menina', 'x': 4, 'y': 6, 'dir': 'down', 'wander': 1,
                   'lines': ['Dormi no tatame e sonhei que o vulcão roncava. Acordei e era o hóspede do quarto ao lado.']},
              ]})

    # --- Forja do Ferreiro Brasão
    rows = paredes(13, 9, 'f', 6)
    I.append({'id': 'forja_termas', 'name': 'Forja do Ferreiro Brasão', 'rows': rows, 'biome': 'vulcao',
              'objects': [
                  {'kind': 'machine', 'x': 3, 'y': 3, 'text': 'A bigorna do Brasão. O metal brilha de tanto uso, e há marcas de martelo em formato de chama.'},
                  {'kind': 'brazier', 'x': 1, 'y': 3, 'acesa': True}, {'kind': 'brazier', 'x': 11, 'y': 3, 'acesa': True},
                  {'kind': 'shelf', 'x': 8, 'y': 2, 'text': 'Armaduras de Charcadet em fileiras: umas douradas e vistosas, outras escuras e cheias de pontas.'},
                  {'kind': 'shelf', 'x': 9, 'y': 2, 'text': 'Pedras do Fogo e etiquetas amarradas com barbante, esperando para virar armadura.'},
                  {'kind': 'barrel', 'x': 1, 'y': 6}, {'kind': 'crate', 'x': 11, 'y': 6},
                  {'kind': 'obsidianRock', 'x': 11, 'y': 5, 'text': 'Obsidiana bruta dos Campos de Cinza. O Brasão usa para afiar.'},
                  {'kind': 'statue', 'x': 1, 'y': 5, 'text': 'Uma armadura de teste. Dentro dela, uma plaquinha: "Charcadet, cuidado, está quente".'},
              ],
              'decor': [rug(5, 5)],
              'people': [
                  {'id': 'ferreiro_brasao', 'name': 'Ferreiro Brasão', 'look': OLHA['brasao'], 'x': 5, 'y': 3, 'dir': 'down',
                   'lines': ['Eu forjo as armaduras para os Charcadet. Cada um escolhe a sua: a Auspiciosa, dourada, ou a Maliciosa, escura.', 'Traga o material e eu faço o resto. A chama é por minha conta.']},
              ],
              'pets': [{'dex': 935, 'x': 7, 'y': 5, 'wander': 1, 'say': 'Um Charcadet cutuca a brasa com o dedo e se queima de leve. Faz isso há semanas.'},
                       {'dex': 935, 'x': 3, 'y': 6, 'wander': 1, 'say': 'O Charcadet olha as armaduras na prateleira com ar de quem já decidiu qual quer.'}]})

    # --- Casa da Vulcanóloga Dra. Lava
    rows = paredes(13, 9, 'f', 6)
    I.append({'id': 'casa_vulcanologa', 'name': 'Casa da Vulcanóloga Dra. Lava', 'rows': rows, 'biome': 'vulcao',
              'objects': [
                  {'kind': 'painel', 'x': 1, 'y': 2, 'text': 'O sismógrafo. Uma agulha desenha um tremor fino sem parar. De vez em quando, dá um pulinho.'},
                  {'kind': 'maquete', 'x': 8, 'y': 2, 'text': 'Maquete do Vulcão Tição, com a cratera, o rio de lava e os três pontos marcados em vermelho para os sensores.'},
                  {'kind': 'estante', 'x': 5, 'y': 2, 'text': 'Cadernos de campo. A letra da Dra. Lava piora conforme o tremor aumenta.'},
                  {'kind': 'obsidianRock', 'x': 11, 'y': 4, 'text': 'Amostra de obsidiana com a etiqueta "Cratera, 02".'},
                  {'kind': 'lavaRock', 'x': 2, 'y': 5, 'text': 'Basalto ainda morno. A Dra. Lava jura que ele respira.'},
                  {'kind': 'table', 'x': 9, 'y': 5}, {'kind': 'plant', 'x': 11, 'y': 7}, {'kind': 'plant', 'x': 1, 'y': 7},
              ],
              'decor': [rug(5, 5)],
              'people': [
                  {'id': 'dra_lava', 'name': 'Dra. Lava', 'look': OLHA['lava'], 'x': 6, 'y': 3, 'dir': 'down',
                   'lines': ['Sou a Dra. Lava, vulcanóloga. Estudo o Tição desde que ele começou a roncar.', 'Os tremores aumentam, mas o vulcão ainda guarda segredo. Alguém com coragem poderia ajudar.']},
              ]})


# ---------------------------------------------------------------- vila
def vila(ctx, C):
    R, G = ctx['R'], ctx['G']
    # praça central
    G[retangulo(986, 656, 9, 8)] = 'P'
    C.obj('portico', 987, 679, forcar=True)
    C.obj('well', 990, 659, forcar=True)
    C.obj('bench', 987, 657, forcar=True)
    C.obj('bench', 992, 657, forcar=True)
    C.obj('flowerpot', 986, 662, forcar=True); C.obj('flowerpot', 994, 662, forcar=True)
    C.obj('lampiao', 986, 656, forcar=True); C.obj('lampiao', 994, 656, forcar=True)
    C.obj('lampiao', 986, 663, forcar=True); C.obj('lampiao', 994, 663, forcar=True)
    C.marca(985, 655, 11, 10)
    # lampiões ao longo das estradas (um bloco fora da trilha)
    def trilha_em_x(x, y0, y1):
        return [y for y in range(y0, y1) if G[y - Y0, x - X0] in '=B']
    for x in range(968, 1020, 8):
        ys = trilha_em_x(x, 644, 653)
        if ys:
            C.obj('lampiao', x, max(ys) + 1)
    for y in range(628, 646, 6):
        xs = [x for x in range(984, 996) if G[y - Y0, x - X0] in '=B']
        if xs:
            C.obj('lampiao', min(xs) - 1, y); C.obj('lampiao', max(xs) + 1, y)
    for y in range(672, 700, 6):
        xs = [x for x in range(984, 996) if G[y - Y0, x - X0] in '=B']
        if xs:
            C.obj('lampiao', min(xs) - 1, y); C.obj('lampiao', max(xs) + 1, y)
    # placas
    C.obj('sign', 986, 626, text='Vila Termas. Águas que curam, vapor que acalma. Cuidado com o vulcão: ele ronca quando está com fome.', forcar=True)
    C.obj('sign', 992, 626, text='Cais de Vila Termas: Barco das Brasas para Vila Siri, às 9h e às 17h.', forcar=True)
    C.obj('sign', 1022, 650, text='Fontes Termais do Vapor, a leste. Não esquente a cabeça: só os pés.', forcar=True)
    C.obj('sign', 993, 684, text='Campos de Cinza e Vulcão Tição, ao sul. Para subir a cratera, só com um Pokémon que escale.', forcar=True)
    C.obj('sign', 964, 650, text='Praia de areia preta a oeste: a Ilha do Basalto fica do outro lado do canal, só nadando.', forcar=True)
    # jardins e bambus
    rr = Sorteio(42)
    for _ in range(70):
        x, y = rr.i(962, 1020), rr.i(630, 690)
        kind = rr.pick(['bambu', 'bambu', 'palmeira', 'flowerpot', 'bush', 'roundbush'])
        C.obj(kind, x, y, folga=0)
    # canteiros de flores (decoração plana não existe: usa o chão de flores)
    for (cx, cy) in [(982, 651), (1004, 651), (974, 660), (1014, 662)]:
        for dx in range(-1, 2):
            for dy in range(0, 2):
                if C.livre(cx + dx, cy + dy):
                    G[cy + dy - Y0, cx + dx - X0] = '*'
    # píer: pessoas e barco
    C.obj('jangada', 983, 613, forcar=True)
    C.obj('boia', 984, 618, forcar=True); C.obj('boia', 994, 616, forcar=True)
    C.obj('barrel', 987, 622, forcar=True); C.obj('crate', 991, 623, forcar=True)
    C.pessoa(id='barqueiro_termas', name='Barqueiro Tião', look=OLHA['marujo'], x=989, y=614, dir='down', viagem='barco_brasas_termas',
             lines=['Eu levo o pessoal para Vila Siri. A travessia é tranquila, desde que o vulcão não decida arrotar.'])
    # moradores
    C.pessoa(id='termas_menino', name='Menino Haru', look='menino', kid=True, x=991, y=660, dir='down', wander=2,
             lines=['Você viu o vulcão? Ele solta fumaça de manhã e de tarde. Meu pai diz que é o bocejo dele.', 'Eu cozinho ovo na pedra quente da praça e não conto pra ninguém.'])
    C.pessoa(id='termas_idoso', name='Seu Takeshi', look='montanhista', x=1002, y=659, dir='left', wander=1,
             lines=['Moro aqui há sessenta anos. O vulcão já roncou, já tremeu, já cuspiu. Nunca fez maldade.', 'Os Slowpoke das fontes são os verdadeiros moradores. A gente só aluga o terreno.'])
    C.pessoa(id='termas_guarda', name='Guarda-Parque Luana', look={'preset': 'treinadora', 'hairStyle': 'ponytail', 'hair': '#2a211c', 'outfit': 'jacket', 'top': '#e8643a', 'trim': '#f2f2f2', 'pants': '#3a4a5a', 'bagStyle': None},
             x=989, y=686, dir='down', wander=0,
             lines=['Os Campos de Cinza são perigosos à noite: o Camerupt abre cratera onde menos se espera.', 'Para chegar ao topo do Tição é preciso escalar o paredão de cipós. Eu não subo, tenho vertigem.'])
    C.pessoa(id='termas_banhista_fora', name='Turista Beatriz', look=OLHA['banhista'], x=1018, y=651, dir='right', wander=1,
             lines=['Vim para o fim de semana e já estou aqui há um mês. Quem vai embora desta vila?'])
    C.pessoa(id='termas_cozinheiro', name='Seu Naka', look='treinador', x=1004, y=651, dir='down', wander=1,
             lines=['Faço o melhor ovo cozido no vapor das ilhas. A Dona Cida da pousada é minha concorrente e eu a respeito muito.'])


# ---------------------------------------------------------------- bichos de enfeite da vila e das fontes
def bichos(ctx, C):
    R, G = ctx['R'], ctx['G']
    # gaivotas nos telhados e no píer
    for (x, y, say) in [(971, 643, 'Uma Wingull no telhado do Centro Pokémon, de olho na sua mochila.'), (981, 643, 'A Wingull observa o mar do telhado do Mercado.'),
                        (1007, 644, 'Uma Wingull cochila no telhado da pousada, no calor da chaminé.'), (997, 641, 'A Wingull da Casa de Banhos nunca sai do vapor.')]:
        R['pets'].append({'dex': 278, 'x': x, 'y': y, 'wander': 0, 'perch': True, 'say': say})
    R['pets'].append({'dex': 278, 'x': 989, 'y': 612, 'wander': 0, 'say': 'Uma Wingull pousada no fim do píer, esperando o Barco das Brasas.'})
    def snapq(x, y, r=4):
        for rr in range(r + 1):
            for dy in range(-rr, rr + 1):
                for dx in range(-rr, rr + 1):
                    xx, yy = x + dx, y + dy
                    if G[yy - Y0, xx - X0] in '.,:;' and not C.ocup[yy - Y0, xx - X0]:
                        return xx, yy
        return None
    for (dex, x, y, wander, say, sleep) in [
        (324, 970, 661, 0, 'Um Torkoal dorme ao lado da forja. Solta fumaça pelo casco a cada ronco.', True),
        (240, 975, 662, 1, 'Um Magby pula sobre as brasas da forja sem se queimar. Faz parte da profissão.', False),
        (79, 1044, 662, 0, 'Um Slowpoke boia na piscina, de olhos fechados. Ele conhece o sentido da vida, mas esqueceu.', False),
        (79, 1075, 672, 0, 'Um Slowpoke parado à beira da fonte, esperando a água esfriar. Ou esquentar.', False),
        (79, 1056, 684, 0, 'Um Slowpoke olha o vapor subir como quem lê um livro.', False),
        (80, 1066, 656, 0, 'Um Slowbro, o Slowpoke mais velho das fontes. Tem uma Shellder grudada e parece feliz.', False),
        (58, 989, 689, 0, 'Um Growlithe de guarda ao lado da Guarda-Parque. Late para o vulcão quando ele ronca.', False),
        (37, 1010, 661, 1, 'Uma Vulpix passeia entre as casas, deixando um cheirinho de brasa.', False),
        (322, 1010, 702, 0, 'Um Numel dorme na cinza morna, bem na beira da trilha.', True),
        (218, 1030, 640, 0, 'Uma Slugma toma sol nas pedras brancas. Deixa um rastro escuro.', False),
        (126, 1055, 790, 0, 'Um Magmar de guarda no pé do vulcão, sem desviar o olhar da cratera.', False),
        (324, 1096, 667, 0, 'Um Torkoal descansa na beira do ofurô secreto.', True),
        (725, 885, 660, 1, 'Um Litten brinca com a areia preta e se esquenta na barriga.', False),
        (558, 870, 634, 0, 'Um Crustle com uma pedra de lava nas costas descansa na praia.', True),
        (749, 925, 652, 1, 'Um Mudbray pasta nas moitas da ilha. Não tem nada para pastar, mas ele insiste.', False),
    ]:
        pos = snapq(x, y, 5)
        if pos:
            R['pets'].append({'dex': dex, 'x': pos[0], 'y': pos[1], 'wander': wander, **({'sleep': True} if sleep else {}), 'say': say})
            C.marca(pos[0], pos[1], 1, 1)


# ---------------------------------------------------------------- Ilha do Basalto
def basalto(ctx, C):
    R, G = ctx['R'], ctx['G']
    # clareira de Tapu Lele
    cx, cy = 900, 619
    C.obj('altar', 899, 618, forcar=True, text='Um altar coberto de flores recentes. O ar tem cheiro de chuva e de brilho. Alguém visita este lugar.')
    for (x, y) in [(894, 616), (905, 616), (894, 622), (905, 622)]:
        C.obj('statue', x, y, forcar=True, text='Uma estátua de pedra clara, esculpida há muito tempo, de um guardião de asas largas.')
    for (x, y) in [(897, 615), (903, 615), (896, 623), (903, 623)]:
        C.obj('lanternaPedra', x, y, forcar=True)
    C.marca(891, 613, 18, 13)
    C.spot('brasas_tapu', 900, 622, 'up')
    C.spot('brasas_fenda_basalto', 925, 668, 'down')
    # cais leste e embarcadouro
    C.obj('jangada', 958, 643, forcar=True)
    C.obj('boia', 958, 638, forcar=True)
    C.obj('barrel', 949, 639, forcar=True); C.obj('crate', 950, 643, forcar=True)
    C.obj('sign', 948, 643, forcar=True, text='Embarcadouro da Ilha do Basalto. Barco das Brasas, às 15h: Vila Termas e Vila Siri.')
    C.pessoa(id='barqueiro_basalto', name='Marujo Dino', look=OLHA['marujo'], x=955, y=641, dir='right', viagem='barco_brasas_basalto',
             lines=['Aqui é parada. O barco encosta às três da tarde, quem quiser seguir é só falar comigo.'])
    C.pessoa(id='basalto_surfista', name='Surfista Lúcio', look={'preset': 'treinador', 'hairStyle': 'spiky', 'hair': '#e8c060', 'hat': None, 'outfit': 'shirt', 'top': '#4ab0c0', 'legs': 'shorts', 'pants': '#e0782e', 'shoes': '#f2f2f2', 'bagStyle': None},
             x=852, y=642, dir='left', wander=1,
             lines=['A onda aqui bate na pedra preta e volta dourada. Já tentei surfar no vulcão, mas a onda é de lava.'])
    C.pessoa(id='basalto_catador', name='Catadora Marlene', look=OLHA['banhista'], x=880, y=668, dir='down', wander=2,
             lines=['Procuro pérolas nas poças da maré. Nesta ilha as pérolas saem pretas.', 'A noite, uma luz estranha fura o céu perto do morro. Tenho medo de olhar.'])
    # barracas de praia, pranchas, madeira da maré
    C.obj('beachStall', 939, 647, forcar=True, text='Barraca de praia com óculos de sol, boias e sacos de areia preta como lembrança.')
    C.obj('guardaSol', 937, 650, forcar=True); C.obj('guardaSol', 943, 650, forcar=True)
    C.obj('surfboard', 868, 648); C.obj('surfboard', 870, 648); C.obj('driftwood', 876, 670); C.obj('driftwood', 940, 604 + 6)
    rr = Sorteio(7)
    d_b = ctx['info']['d_b']
    mask = ctx['info']['m_bas']
    for _ in range(120):
        x, y = rr.i(842, 952), rr.i(603, 681)
        if not mask[y - Y0, x - X0] or d_b[y - Y0, x - X0] < 2:
            continue
        ch = G[y - Y0, x - X0]
        if ch in ':A':
            kind = rr.pick(['coqueiro', 'palmeira', 'driftwood', 'palm'])
        elif ch in 'va':
            kind = rr.pick(['obsidianRock', 'boulder2', 'lavaRock', 'rock', 'obsidianRock'])
        else:
            kind = rr.pick(['coqueiro', 'palmeira', 'bush', 'roundbush'])
        C.obj(kind, x, y, folga=0)
    # moradores
    C.pessoa(id='basalto_garoto', name='Menina Iara', look='menina', kid=True, x=915, y=660, dir='right', wander=2,
             lines=['A areia preta guarda o calor do dia. De noite eu deito e a barriga fica quentinha.', 'Escuto uma coisinha cantando no morro das flores. Mas nunca vejo ninguém lá.'])
    C.pessoa(id='basalto_colecionador', name='Colecionador Odair', look='montanhista', x=884, y=640, dir='down', wander=1,
             lines=['Coleciono pedras vulcânicas. Esta daqui é obsidiana, aquela é basalto, e a do bolso é só uma pedra, mas eu gosto dela.'])


# ---------------------------------------------------------------- Ilhote do Farol e bancos de areia
def farol(ctx, C):
    G = ctx['G']
    for (x, y) in [(1034, 538), (1046, 541), (1044, 536)]:
        C.obj('boulder2', x, y)
    C.obj('lampiao', 1042, 537, forcar=True)
    C.obj('sign', 1036, 538, forcar=True, text='Farol das Brasas. Aceso todas as noites desde antes do vulcão resmungar.')
    C.marca(1037, 532, 6, 6)
    rr = Sorteio(9)
    for nome, (cx, cy, rx, ry) in {'gaivotas': (872, 522, 10, 5), 'naufragio': (965, 557, 9, 4), 'tartarugas': (1106, 521, 11, 5), 'pedra_sul': (1152, 562, 7, 4),
                                  'albatroz': (880, 906, 10, 5), 'naufragio2': (942, 930, 13, 6), 'recife_v': (1090, 940, 9, 4), 'sentinela': (1002, 905, 6, 4)}.items():
        for _ in range(8):
            x, y = int(cx + (rr.u() - .5) * 2 * rx * .8), int(cy + (rr.u() - .5) * 2 * ry * .8)
            C.obj(rr.pick(['palmeira', 'driftwood', 'rock', 'coqueiro', 'barrel', 'boulder2']), x, y)
    # boias do recife da Rota Marítima 19 (x 900 a 940)
    for i, x in enumerate(range(900, 942, 6)):
        C.obj('boia', x, 487 + (i % 2) * 3, forcar=True)
    # naufrágio
    C.obj('sucata', 938, 928, forcar=True, text='Restos de um casco partido, comido de sal. Não dá para saber de que barco era.')
    C.obj('driftwood', 944, 930, forcar=True); C.obj('barrel', 947, 931, forcar=True)
    # ilhota fumegante
    for (x, y) in [(1160, 921), (1180, 921), (1170, 912), (1170, 930)]:
        C.obj('fumarola', x, y, forcar=True)
    C.obj('boia', 1128, 902, forcar=True)
    for x, y in [(1163, 908), (1176, 908), (1163, 933), (1177, 933)]:
        C.obj('obsidianRock', x, y, forcar=True)
    C.spot('brasas_volcanion', 1170, 924, 'up')


# ---------------------------------------------------------------- viagens
def viagens(R):
    R['viagens'] += [
        {'id': 'barco_brasas_termas', 'nome': 'Barco das Brasas',
         'fala': ['O Barco das Brasas! Para onde vamos?'],
         'destinos': [
             {'nome': 'Vila Siri', 'destino': 'cais_siri', 'preco': 500, 'horarios': [9, 17], 'cena': 'O barco corta o mar de basalto e a fumaça do vulcão vai ficando para trás…'},
         ]},
        {'id': 'barco_brasas_basalto', 'nome': 'Barco das Brasas',
         'fala': ['Parada na Ilha do Basalto. Para onde seguimos?'],
         'destinos': [
             {'nome': 'Vila Termas', 'destino': 'cais_termas', 'preco': 200, 'horarios': [15], 'cena': 'O barco contorna a ilha e o vapor das fontes vai se aproximando…'},
             {'nome': 'Vila Siri', 'destino': 'cais_siri', 'preco': 500, 'horarios': [15], 'cena': 'O barco volta para o norte, devagar, sob as gaivotas…'},
         ]},
    ]
