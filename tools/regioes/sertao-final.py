# ---------------------------------------------------------------- ÁREAS (ids do plano; a última que contém o ponto vence)
def A(id, name, biome, rect, **kw): R.area(id, name, biome, rect=rect, **kw)
NOMES = {a['id']: (a['name'], a['biome']) for a in base['areas']}
def AA(id, rect): A(id, NOMES[id][0], NOMES[id][1], rect)
# fundo: tudo cai numa rota (os ids das áreas grandes cobrem o retângulo todo, sem vazio)
AA('rota14', [600, 200, 150, 70])
AA('rota14', [600, 270, 22, 96])
AA('rota20', [750, 200, 240, 60])
AA('rota20', [750, 260, 80, 8])
AA('mar_levante', [1140, 200, 60, 280])
AA('canion_rio_seco', [606, 262, 224, 106])
AA('fundo_canion', [680, 300, 115, 42])
AA('rota20', [830, 262, 30, 40])
AA('dunas_douradas', [852, 290, 214, 130])
AA('cratera_estrela', [928, 328, 36, 36])
AA('chapada_vermelha', [984, 200, 160, 54])
AA('mangue_siri', [600, 366, 232, 114])
AA('praia_levante', [832, 420, 268, 60])
AA('praia_levante', [1066, 296, 74, 184])
AA('oasis_buriti', [1066, 250, 74, 46])
AA('cidade_buriti', [994, 250, 96, 48])
AA('vila_mandacaru', [742, 208, 76, 52])
AA('vila_siri', [684, 366, 64, 38])
for a in R.areas: pass
# tocas de luz (src/data/tocas.js explica) já foram registradas em R.tocas

# ---------------------------------------------------------------- Ninhos de pouso: os 3 do ponto de partida já existem (spots ninho_*)

# ---------------------------------------------------------------- garantias: nada de árvore solta em cima de gente, item, baú, sinal ou toca
for p in R.people: R.noTrees.append([p['x'] - 1, p['y'] - 1, 3, 3])
for i in R.items: R.noTrees.append([i['x'] - 1, i['y'] - 1, 3, 3])
for o in R.objects:
    if o['kind'] in ('chest', 'sign', 'bench'): R.noTrees.append([o['x'] - 1, o['y'] - 1, 3, 3])
for t in R.tocas: R.noTrees.append([t['x'] - 4, t['y'] - 4, 9, 9])
for n, (x, y, d) in R.spots.items():
    if n.startswith('sertao_') or n.startswith('ninho_'): R.noTrees.append([int(x) - 2, int(y) - 2, 5, 5])
