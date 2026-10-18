# ---------------------------------------------------------------- ÁREAS (ids do plano; a última que contém o ponto vence)
def A(id, name, biome, rect, **kw): R.area(id, name, biome, rect=rect, **kw)
for a in base['areas']:
    A(a['id'], a['name'], a['biome'], a['rect'])
