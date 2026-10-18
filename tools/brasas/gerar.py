#!/usr/bin/env python3
# Gera assets/maps/regioes/brasas.json (Arquipélago das Brasas) a partir dos módulos desta pasta.
#   python3 tools/brasas/gerar.py          escreve o JSON
#   python3 tools/brasas/gerar.py --previa  também salva imagens de conferência (pasta de rascunho)
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from base import *
import terreno
import layout

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SAIDA = os.path.join(RAIZ, 'assets', 'maps', 'regioes', 'brasas.json')


def montar():
    G, info = terreno.construir()
    R = {
        'regiao': {'id': 'brasas', 'nome': 'Arquipélago das Brasas', 'mundo': 'alvorada', 'rect': [800, 480, 400, 480], 'faixa': [0, 1920, 1200, 160]},
        'comment': 'Região Arquipélago das Brasas, construída por tools/brasas/gerar.py (terreno em carimbo gerado, cidades, templo e missões). Manual: docs/construir-regiao.md.',
        'ops': [], 'areas': [], 'spots': {}, 'ninhos': [], 'objects': [], 'decor': [], 'interiors': [], 'people': [], 'warps': [],
        'items': [], 'viagens': [], 'tocas': [], 'mecanismos': [], 'noTrees': [],
    }
    R['areas'] = [
        {'id': 'rota19', 'name': 'Rota Marítima 19', 'biome': 'mar', 'rect': [800, 480, 400, 100]},
        {'id': 'rota19', 'name': 'Rota Marítima 19', 'biome': 'mar', 'rect': [800, 580, 400, 120]},
        {'id': 'mar_brasas', 'name': 'Mar das Brasas', 'biome': 'mar', 'rect': [800, 700, 400, 180]},
        {'id': 'ilha_basalto', 'name': 'Ilha do Basalto', 'biome': 'praia', 'rect': [840, 600, 120, 80]},
        {'id': 'fontes_termais', 'name': 'Fontes Termais do Vapor', 'biome': 'termal', 'rect': [1020, 620, 100, 80]},
        {'id': 'campos_cinza', 'name': 'Campos de Cinza', 'biome': 'vulcao', 'rect': [926, 696, 180, 80]},
        {'id': 'vulcao_ticao', 'name': 'Vulcão Tição', 'biome': 'vulcao', 'rect': [990, 770, 156, 112]},
        {'id': 'vila_termas', 'name': 'Vila Termas', 'biome': 'vila', 'rect': [958, 620, 62, 78]},
        {'id': 'cratera_ticao', 'name': 'Cratera do Tição', 'biome': 'vulcao', 'rect': [1040, 800, 52, 40]},
        {'id': 'mar_brasas', 'name': 'Mar das Brasas', 'biome': 'mar', 'rect': [800, 880, 400, 80]},
        {'id': 'ilhota_fumegante', 'name': 'Ilhota Fumegante', 'biome': 'termal', 'rect': [1150, 900, 40, 40]},
    ]
    R['spots'] = {k: list(v) for k, v in layout.PONTOS.items()}
    R['ninhos'] = [
        {'id': 'vila_termas', 'nome': 'Vila Termas', 'spot': 'ninho_vila_termas'},
        {'id': 'ilha_basalto', 'nome': 'Ilha do Basalto', 'spot': 'ninho_ilha_basalto'},
        {'id': 'vulcao_ticao', 'nome': 'Vulcão Tição', 'spot': 'ninho_vulcao'},
    ]
    ctx = {'G': G, 'info': info, 'R': R}
    # módulos que acrescentam conteúdo (cada um tem uma função aplicar(ctx))
    for nome in ('povoado', 'masmorra_chama', 'rotas'):
        try:
            mod = __import__(nome)
        except ModuleNotFoundError as e:
            if e.name != nome:
                raise
            continue
        mod.aplicar(ctx)
    # passagens (seção 5 do plano): água funda nas 5 linhas/colunas da divisa, intocada pelo resto
    G[0:5, :] = 'W'
    G[:, 0:5] = 'W'
    R['ops'] = [
        {'op': 'rect', 't': 'deep', 'x': 800, 'y': 480, 'w': 400, 'h': 480},
        {'op': 'stamp', 'x': 800, 'y': 480, 'rows': [''.join(r) for r in G]},
        {'op': 'comment', '_': 'passagem p_r2_r5: Rota Marítima 19 (Praia do Levante -> Brasas)'},
        {'op': 'rect', 't': 'deep', 'x': 800, 'y': 480, 'w': 400, 'h': 5},
        {'op': 'comment', '_': 'passagem p_r4_r5: Mar entre Recife e Brasas'},
        {'op': 'rect', 't': 'deep', 'x': 800, 'y': 480, 'w': 5, 'h': 480},
    ]
    return R, G, ctx


def escrever(R):
    def val(v):
        return json.dumps(v, ensure_ascii=False, separators=(', ', ': '))
    linhas = ['{']
    chaves = list(R)
    for i, k in enumerate(chaves):
        v = R[k]
        fim = ',' if i < len(chaves) - 1 else ''
        if k == 'ops':
            linhas.append('  "ops": [')
            for j, op in enumerate(v):
                f2 = ',' if j < len(v) - 1 else ''
                if op['op'] == 'stamp':
                    linhas.append('    {"op": "stamp", "x": %d, "y": %d, "rows": [' % (op['x'], op['y']))
                    rows = op['rows']
                    for n, r in enumerate(rows):
                        linhas.append('      ' + json.dumps(r, ensure_ascii=False) + (',' if n < len(rows) - 1 else ''))
                    linhas.append('    ]}' + f2)
                else:
                    linhas.append('    ' + val(op) + f2)
            linhas.append('  ]' + fim)
        elif isinstance(v, list) and v and k not in ('ops',):
            linhas.append('  "%s": [' % k)
            for j, it in enumerate(v):
                linhas.append('    ' + val(it) + (',' if j < len(v) - 1 else ''))
            linhas.append('  ]' + fim)
        elif isinstance(v, dict) and v and k in ('spots',):
            linhas.append('  "%s": {' % k)
            ks = list(v)
            for j, kk in enumerate(ks):
                linhas.append('    ' + json.dumps(kk) + ': ' + val(v[kk]) + (',' if j < len(ks) - 1 else ''))
            linhas.append('  }' + fim)
        else:
            linhas.append('  ' + json.dumps(k) + ': ' + val(v) + fim)
    linhas.append('}')
    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('\n'.join(linhas) + '\n')


if __name__ == '__main__':
    R, G, ctx = montar()
    escrever(R)
    print('escrito', SAIDA, os.path.getsize(SAIDA) // 1024, 'KB')
    if '--previa' in sys.argv:
        sc = os.environ.get('RASCUNHO', '/private/tmp')
        from catalogo import TAM
        objs = []
        for o in R['objects']:
            fw, fh = TAM.get(o['kind'], (1, 1))
            cor = (255, 220, 60) if o['kind'] in ('center', 'mart') or o['kind'][:5] == 'house' or o['kind'] in ('cabin', 'taipa', 'casarao', 'farol') else (240, 120, 40)
            objs.append({'x': o['x'], 'y': o['y'], '_fw': fw, '_fh': fh, '_cor': cor})
        previa(G, os.path.join(sc, 'brasas_full.png'), k=2, objetos=objs)
        previa(G, os.path.join(sc, 'brasas_vila.png'), k=10, objetos=objs, recorte=(955, 608, 80, 100))
        previa(G, os.path.join(sc, 'brasas_fornalha.png'), k=5, objetos=objs, recorte=(925, 600, 230, 290))
