#!/usr/bin/env python3
# Gera assets/maps/regioes/sertao.json (Sertão do Levante) a partir de tools/regioes/sertao-base.json (ponto de partida
# de tools/gerar-regioes.mjs). Rode: python3 tools/regioes/gerar-sertao.py && python3 tools/formatar-mapa.py assets/maps/regioes/sertao.json
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from lib import *

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
base = json.load(open(os.path.join(AQUI, 'sertao-base.json')))
R = Reg(base)
R.spots.update(base['spots'])

# passagens do ponto de partida (mantidas no fim, para ganharem de qualquer pintura)
PASSAGENS = [o for o in base['ops'] if o['op'] == 'comment' and o['_'].startswith('passagem')]
_i = base['ops'].index(PASSAGENS[0])
OPS_PASSAGENS = base['ops'][_i:]

exec(open(os.path.join(AQUI, 'sertao-terreno.py')).read())
for parte in ('sertao-cidades.py', 'sertao-ruinas.py', 'sertao-rotas.py', 'sertao-final.py'):
    p = os.path.join(AQUI, parte)
    if os.path.exists(p): exec(open(p).read())

out = {'regiao': base['regiao'], 'comment': base['comment'] + ' Construída por tools/regioes/gerar-sertao.py.',
       'ops': R.ops + OPS_PASSAGENS, 'areas': R.areas, 'spots': R.spots, 'ninhos': base['ninhos'],
       'trees': R.trees, 'objects': R.objects, 'decor': R.decor, 'interiors': R.interiors, 'people': R.people, 'pets': R.pets,
       'warps': R.warps, 'items': R.items, 'viagens': R.viagens, 'tocas': R.tocas, 'mecanismos': R.mecanismos, 'buracos': R.buracos,
       'noTrees': R.noTrees}
for k in ('mecanismos', 'buracos', 'noTrees', 'tocas', 'pets', 'viagens', 'warps'):
    if not out[k]: del out[k]
json.dump(out, open(os.path.join(RAIZ, 'assets/maps/regioes/sertao.json'), 'w'), ensure_ascii=False)
print('ok', len(R.ops), 'ops', len(R.objects), 'objetos', len(R.interiors), 'salas', len(R.people), 'moradores')
