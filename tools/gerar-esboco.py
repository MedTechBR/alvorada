# Gera assets/maps/esboco.json a partir da planta da região (docs/mapa-alvorada.json).
# Escala: 1 unidade da planta = 6 blocos de 16 px. O esboço é desenhado ANTES do mapa feito à mão
# (assets/maps/alvorada.json, campo "include"), que detalha por cima as áreas prontas.
# Uso: python3 tools/gerar-esboco.py
import json, math, os

S = 6
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
plan = json.load(open(os.path.join(ROOT, 'docs', 'mapa-alvorada.json'), encoding='utf-8'))
P = {p['id']: p for p in plan['lugares']}
W, H = plan['tamanho']['w'] * S, plan['tamanho']['h'] * S

ops, objects, areas, trees, spots = [], [], [], [], {}
def u(v): return int(round(v * S))
def box(p): return u(p['x']), u(p['y']), u(p['w']), u(p['h'])
def center(p): x, y, w, h = box(p); return x + w // 2, y + h // 2
def op(**k): ops.append(k)
def note(t): op(op='comment', _=t)

# lugares detalhados à mão (o esboço só põe o terreno de base embaixo deles)
DETALHADOS = {'vila_alvorada', 'cidade_campina', 'fazenda_tome', 'rota1', 'rota2', 'vila_sussurro', 'lagoa_dourada', 'toca_absol'}

note('==== esboço gerado por tools/gerar-esboco.py a partir de docs/mapa-alvorada.json (não editar à mão) ====')
note('montanhas ao norte e Monte Zênite')
op(op='rect', t='rock', x=0, y=0, w=W, h=u(2))
z = P['liga_zenite']; zx, zy, zw, zh = box(z)
op(op='rect', t='snow', x=zx - 6, y=0, w=zw + 12, h=u(2) + 6)
g = P['pico_geada']; gx, gy, gw, gh = box(g)
op(op='ellipse', t='snow', cx=gx + gw / 2, cy=gy + gh / 2 + 4, rx=gw / 2 + 4, ry=gh / 2 + 6, noise=0.4)

note('Planalto dos Ventos: capim ondulante e pedras soltas')
op(op='blobs', t='tall', x=0, y=u(2), w=W, h=u(19), scale=0.11, th=0.6)
op(op='scatter', t='flowers', x=0, y=u(2), w=W, h=u(19), p=0.004)
trees.append({'x': 0, 'y': u(2), 'w': W, 'h': u(19), 'p': 0.006, 'kinds': ['grayrock', 'pine', 'pine2', 'rock']})

note('Paredão: parede de pedra de oeste a leste (só com Escalar, pelos cipós da Rota 8)')
py0, py1 = u(22), u(24)
op(op='rect', t='rock', x=0, y=py0, w=W, h=py1 - py0 - 2)
op(op='rect', t='cliff', x=0, y=py1 - 2, w=W, h=2)
r8 = P['rota8']; r8x = u(r8['x'] + r8['w'] / 2)
op(op='rect', t='climb', x=r8x - 2, y=py0, w=4, h=py1 - py0)
fr = P['forte_rochedo']; frx = center(fr)[0]
op(op='rect', t='climb', x=frx - 1, y=py0, w=2, h=py1 - py0)
ma = P['mina_aurora']; mx = center(ma)[0]
op(op='set', t='cavedoor', pts=[[mx, py1 - 1], [mx + 1, py1 - 1]])
objects.append({'kind': 'sign', 'x': mx + 3, 'y': py1, 'text': 'MINA AURORA\n(entrada de serviço — fechada por enquanto)'})

note('florestas: Bosque Sussurrante e Mata dos Jequitibás')
b = P['bosque_sussurrante']; bx, by, bw, bh = box(b)
op(op='poly', t='forest', pts=[[bx - u(8), u(26)], [bx + bw, u(26)], [bx + bw + 4, by + bh // 2], [bx + bw, by + bh], [bx + bw // 2, by + bh + 4], [bx - u(8), by + bh]], noise=4)
mj = P['mata_jequitibas']; mjx, mjy, mjw, mjh = box(mj)
op(op='ellipse', t='dark', cx=mjx + mjw / 2, cy=mjy + mjh / 2, rx=mjw / 2, ry=mjh / 2, noise=0.35)
for k in range(5):
    objects.append({'kind': 'jequitiba', 'x': mjx + 6 + (k * 7) % (mjw - 10), 'y': mjy + 6 + (k * 11) % (mjh - 10)})
op(op='blobs', t='tall', x=mjx, y=mjy, w=mjw, h=mjh, scale=0.25, th=0.6, on=['dark'])

note('Lago Espelho, Ilha do Véu e Rio Lúmen')
L = P['lago_espelho']; lx, ly, lw, lh = box(L)
lcx, lcy = lx + lw / 2, ly + lh / 2
op(op='ellipse', t='sand', cx=lcx, cy=lcy, rx=lw / 2 + 3, ry=lh / 2 + 3, noise=0.2)
op(op='ellipse', t='water', cx=lcx, cy=lcy, rx=lw / 2, ry=lh / 2, noise=0.2)
op(op='ellipse', t='deep', cx=lcx + 6, cy=lcy - 4, rx=lw / 2 - 18, ry=lh / 2 - 14, noise=0.3)
iv = P['ilha_veu']; ivx, ivy, ivw, ivh = box(iv)
op(op='ellipse', t='sand', cx=ivx + ivw / 2, cy=ivy + ivh / 2, rx=ivw / 2 + 2, ry=ivh / 2 + 2, noise=0.3)
op(op='ellipse', t='grass', cx=ivx + ivw / 2, cy=ivy + ivh / 2, rx=ivw / 2, ry=ivh / 2, noise=0.3)
objects += [{'kind': 'grayrock', 'x': ivx + 4, 'y': ivy + 4}, {'kind': 'boulder2', 'x': ivx + ivw - 8, 'y': ivy + 8},
            {'kind': 'sign', 'x': ivx + ivw // 2, 'y': ivy + ivh - 3, 'text': 'ILHA DO VÉU\nUm observatório antigo some na neblina.'}]
r4 = P['rota4']; r4x = u(76)
op(op='path', t='water', pts=[[lcx + 10, ly + lh - 4], [r4x, u(56)], [r4x + 4, u(62)], [r4x - 2, u(68)], [r4x, u(71)]], width=10, wobble=2)
op(op='path', t='deep', pts=[[lcx + 10, ly + lh], [r4x, u(56)], [r4x + 4, u(62)], [r4x - 2, u(68)], [r4x, u(71)]], width=4, wobble=2)

note('Brejo das Lamparinas (Rota 5)')
r5 = P['rota5']; r5x, r5y, r5w, r5h = box(r5)
op(op='rect', t='dark', x=r5x, y=r5y, w=r5w, h=r5h)
op(op='blobs', t='water', x=r5x, y=r5y, w=r5w, h=r5h, scale=0.12, th=0.58, on=['dark'])
op(op='blobs', t='tall', x=r5x, y=r5y, w=r5w, h=r5h, scale=0.2, th=0.62, on=['dark'])
op(op='path', t='bridge', pts=[[r5x, r5y + r5h // 2], [r5x + r5w, r5y + r5h // 2]], width=2, on=['water', 'deep'])
op(op='path', t='dark', pts=[[r5x, r5y + r5h // 2], [r5x + r5w, r5y + r5h // 2]], width=2, on=['forest', 'tall'])
trees.append({'x': r5x, 'y': r5y, 'w': r5w, 'h': r5h, 'p': 0.015, 'kinds': ['stump', 'log', 'autumn'], 'on': ['dark']})

note('Costa Coral, Praia dos Corais e Mar do Sul')
op(op='poly', t='sand', pts=[[u(38), u(66)], [u(48), u(63)], [u(62), u(63)], [u(72), u(62)], [u(86), u(63)], [W, u(62)], [W, u(70)], [u(38), u(70)]], noise=2)
op(op='rect', t='water', x=0, y=u(69), w=W, h=H - u(69))
op(op='rect', t='deep', x=0, y=u(71), w=W, h=H - u(71))
op(op='rect', t='sand', x=0, y=u(67.5), w=u(39), h=u(1.5))
op(op='rect', t='water', x=0, y=u(69), w=u(38), h=u(2))
for k, (ix, iy) in enumerate([(24, 71), (29, 72.5), (33, 70.5)]):
    op(op='ellipse', t='water', cx=u(ix), cy=u(iy), rx=12, ry=9)
    op(op='ellipse', t='sand', cx=u(ix), cy=u(iy), rx=8, ry=6, noise=0.3)
    op(op='ellipse', t='grass', cx=u(ix), cy=u(iy), rx=4.5, ry=3, noise=0.3)
    trees.append({'x': u(ix) - 8, 'y': u(iy) - 6, 'w': 16, 'h': 12, 'p': 0.12, 'kinds': ['palm'], 'on': ['sand', 'grass']})
sn = P['ilha_sol_nascente']; snx, sny, snw, snh = box(sn)
op(op='ellipse', t='water', cx=snx + snw / 2, cy=sny + snh / 2, rx=snw / 2 + 8, ry=snh / 2 + 8)
op(op='ellipse', t='rock', cx=snx + snw / 2, cy=sny + snh / 2, rx=snw / 2, ry=snh / 2, noise=0.3)
op(op='ellipse', t='sand', cx=snx + snw / 2, cy=sny + snh / 2 + 6, rx=snw / 2 - 4, ry=4)
trees.append({'x': u(40), 'y': u(62), 'w': u(50), 'h': u(7), 'p': 0.012, 'kinds': ['palm', 'palm', 'boulder'], 'on': ['sand']})

note('Ravina do Rochedo (Rota 7) e Ferrovia da Aurora (Rota 6)')
r7 = P['rota7']; r7x, r7y, r7w, r7h = box(r7)
op(op='rect', t='path', x=r7x, y=r7y, w=r7w, h=r7h)
trees.append({'x': r7x, 'y': r7y, 'w': r7w, 'h': r7h, 'p': 0.03, 'kinds': ['boulder', 'boulder2', 'rock'], 'on': ['path']})
r6 = P['rota6']; r6x, r6y, r6w, r6h = box(r6)
op(op='rect', t='grass', x=r6x, y=r6y, w=r6w, h=r6h)
op(op='path', t='path', pts=[[center(P['vila_lamparina'])[0], center(P['vila_lamparina'])[1]], [r6x + 10, r6y + r6h - 6], [r6x + r6w, r6y + 10], [center(P['cidade_aurora'])[0], center(P['cidade_aurora'])[1]]], width=3, wobble=1)
op(op='blobs', t='tall', x=r6x, y=r6y, w=r6w, h=r6h, scale=0.15, th=0.6)
trees.append({'x': r6x, 'y': r6y, 'w': r6w, 'h': r6h, 'p': 0.01, 'kinds': ['tree2', 'pine'], 'on': ['grass']})

note('campos abertos do sul: árvores soltas e manchas de mato alto')
op(op='blobs', t='tall', x=0, y=u(24), w=W, h=u(42), scale=0.12, th=0.66, on=['grass'])
trees.append({'x': 0, 'y': u(24), 'w': W, 'h': u(42), 'p': 0.006, 'kinds': ['bigtree', 'tree', 'tree2', 'bush'], 'on': ['grass']})
note('cidades esboçadas (detalhar nas próximas rodadas)')
EXTRA = {
    'porto_espelho': 'Palafitas, píer comprido, barcos a vela.', 'cidade_coral': 'Calçadão, coqueiros e o Farol Coral.',
    'vila_lamparina': 'Pedra escura e lampiões. O ginásio só abre de noite.', 'cidade_aurora': 'A cidade da luzita.',
    'forte_rochedo': 'Fortaleza colonial ao pé do Paredão.', 'cidade_escarpa': 'Cidade mineira em degraus.',
    'mirante_ventos': 'Casas presas nas falésias.', 'liga_zenite': 'Cidadela do Zênite: Liga Alvorada.',
}
for pid, txt in EXTRA.items():
    p = P[pid]; x, y, w, h = box(p); cx, cy = x + w // 2, y + h // 2
    base = {'cidade_aurora': 'plaza', 'liga_zenite': 'snow'}.get(pid, 'grass')
    op(op='rect', t=base, x=x, y=y, w=w, h=h, on=['grass', 'grass2', 'tall', 'flowers', 'forest', 'dark', 'gold', 'rock', 'snow', 'path'])
    op(op='rect', t='plaza', x=cx - 7, y=cy - 1, w=14, h=6)
    op(op='rect', t='path', x=x, y=cy + 5, w=w, h=2)
    objects += [{'kind': 'center', 'x': cx - 16, 'y': cy - 4}, {'kind': 'mart', 'x': cx + 8, 'y': cy - 4},
                {'kind': 'sign', 'x': cx - 1, 'y': cy + 3, 'text': f"{p['nome'].upper()}\n{txt}\n(esboço: cidade em construção)"},
                {'kind': 'lamp', 'x': cx - 8, 'y': cy + 1}, {'kind': 'lamp', 'x': cx + 7, 'y': cy + 1}]
    if w >= 40:
        objects += [{'kind': 'houseA', 'x': x + 2, 'y': cy + 8}, {'kind': 'houseB', 'x': x + w - 10, 'y': cy + 8}]
    if pid == 'forte_rochedo':
        op(op='border', t='rock', x=x - 2, y=y - 2, w=w + 4, h=h + 4, width=2, noise=0)
        op(op='rect', t='path', x=cx - 1, y=y + h, w=3, h=2); op(op='rect', t='path', x=cx - 1, y=y - 2, w=3, h=2)
    if pid == 'porto_espelho':
        for k in range(3): op(op='rect', t='dock', x=x + 8 + k * 12, y=y - 10, w=2, h=10, on=['water', 'deep', 'sand'])
    spots[pid] = [cx, cy + 6, 'down']

note('rotas esboçadas (conexões da planta)')
DET_ROUTES = {('vila_alvorada', 'rota1'), ('rota1', 'cidade_campina'), ('cidade_campina', 'fazenda_tome'), ('fazenda_tome', 'rota2'),
              ('rota2', 'bosque_sussurrante'), ('bosque_sussurrante', 'vila_sussurro'), ('bosque_sussurrante', 'toca_absol'),
              ('bosque_sussurrante', 'vila_alvorada'), ('rota1', 'lagoa_dourada'), ('rota6', 'cidade_aurora'), ('vila_lamparina', 'rota6'),
              ('bosque_sussurrante', 'rota5'), ('bosque_sussurrante', 'mata_jequitibas'), ('vila_alvorada', 'rota3'), ('rota3', 'porto_espelho')}
WATERY = {'rota10', 'rota13', 'ilha_veu', 'santuario_crepusculo', 'recife_afundado', 'ilhas_coral', 'ilha_sol_nascente', 'gruta_mare'}
for a, bb in plan['conexoes']:
    if (a, bb) in DET_ROUTES or a in WATERY or bb in WATERY: continue
    pa, pb = P[a], P[bb]
    if pa['tipo'] == 'rota' and pa['w'] * pa['h'] > 30:
        ax, ay = center(pa)
    else: ax, ay = center(pa)
    bx2, by2 = center(pb)
    up = 'escalar' in pb.get('acesso', []) or 'escalar' in pa.get('acesso', [])
    op(op='path', t='path', pts=[[ax, ay], [(ax + bx2) / 2, (ay + by2) / 2], [bx2, by2]], width=3, wobble=3, on=['grass', 'grass2', 'tall', 'forest', 'dark', 'sand', 'path', 'gold', 'snow'])
op(op='path', t='bridge', pts=[[u(70), u(56.5)], [u(80), u(56.5)]], width=2, on=['water', 'deep'])
note('Relógio de Pedra e Ruínas dos Vigias')
rp = P['relogio_pedra']; rcx, rcy = center(rp)
op(op='ellipse', t='plaza', cx=rcx, cy=rcy, rx=9, ry=8)
for k in range(8):
    a = k / 8 * math.pi * 2
    objects.append({'kind': 'menhir', 'x': int(rcx + math.cos(a) * 7) - 1, 'y': int(rcy + math.sin(a) * 6)})
rv = P['ruinas_vigias']; rvx, rvy, rvw, rvh = box(rv)
op(op='rect', t='plaza', x=rvx, y=rvy, w=rvw, h=rvh)
for k in range(5): objects.append({'kind': 'column', 'x': rvx + 2 + k * 4, 'y': rvy + 4 + (k % 2) * 6})

note('fim do esboço')
# áreas: maiores primeiro (as menores, desenhadas depois, vencem)
BIOMA = {'cidade': 'vila', 'rota': 'campo', 'floresta': 'floresta', 'lago': 'margem', 'praia': 'praia', 'planalto': 'planalto',
         'montanha': 'planalto', 'ilha': 'praia', 'secreta': 'campo', 'caverna': 'planalto', 'local': 'campo', 'santuario': 'planalto',
         'rota_agua': 'margem', 'templo_submerso': 'margem', 'submerso': 'margem'}
lst = sorted(plan['lugares'], key=lambda p: -p['w'] * p['h'])
for p in lst:
    x, y, w, h = box(p)
    bio = BIOMA.get(p['tipo'], 'campo')
    if p['id'] == 'rota2': bio = 'floresta'
    if p['id'] in ('rota4', 'rota13'): bio = 'praia'
    if p['id'] == 'rota5': bio = 'floresta'
    areas.append({'name': p['nome'], 'biome': bio, 'rect': [x, y, w, h], 'id': p['id']})

out = {'comment': 'Gerado por tools/gerar-esboco.py (não editar à mão).', 'scale': S, 'ops': ops, 'objects': objects, 'trees': trees, 'areas': areas, 'spots': spots}
open(os.path.join(ROOT, 'assets', 'maps', 'esboco.json'), 'w', encoding='utf-8').write(json.dumps(out, ensure_ascii=False, indent=0))
print('esboco.json:', len(ops), 'operações,', len(objects), 'objetos,', len(areas), 'áreas; mapa', W, 'x', H)
