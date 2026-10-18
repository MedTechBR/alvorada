# Gera src/data/montarias.js: quais espécies do jogo conseguem carregar o treinador, em que modo
# (correr, nadar, escalar, voar, mergulhar) e onde o treinador senta no sprite do PMD.
# Rodar da raiz do repositório:  python3 tools/gerar_montarias.py
#
# 1) Classificação: regras automáticas (altura e peso reais, tipo, formato do corpo) + listas à mão
#    (o que os jogos e o anime mostram; o que as regras erram). Tudo explicado nas tabelas abaixo.
# 2) Pose: mede o sprite de lado (Idle, olhando para a direita) e acha o "lombo": o vale mais fundo do
#    contorno de cima perto do centro do corpo (fica entre o pescoço e a garupa, ou entre as asas e a cabeça).
#    Bípedes em pé levam o treinador nas costas (como o Sneasler). AJUSTE corrige à mão o que a medida erra.
# Medidas em px do sprite sem escala, relativas ao ponto "centro do corpo" do PMD; o jogo multiplica pela escala.
import json, os, re, sys
from PIL import Image

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(RAIZ)

# ---------------------------------------------------------------- dados
ESP = {}
for linha in open('src/data/gen/especies.js', encoding='utf-8'):
    m = re.match(r'\s*(\d+): (\{.*\}),?\s*$', linha)
    if m: ESP[int(m.group(1))] = json.loads(m.group(2))
PMD = set(json.load(open('assets/pmd/index.json')))
# quem não tem sprite próprio usa o de outra pasta (tools/pmd_baixar.py instalar-tudo); a medida segue o substituto
try: SUBST = {k: v['de'] for k, v in json.load(open('assets/pmd/substitutos.json')).items()}
except Exception: SUBST = {}
# formas que andam pelo mundo (regionais e alternativas) também podem ser montaria: chave "59-hisui"
FORMAS = {f'{d}-{k}': {**s, **f} for d, s in ESP.items() for k, f in s.get('forms', {}).items() if f.get('kind') in ('regional', 'alt')}
def pasta_de(key):
    d, _, f = str(key).partition('-')
    p = f'{int(d):04d}' + (f'-{f}' if f else '')
    return p if os.path.isfile(f'assets/pmd/{p}/frames.json') else SUBST.get(p)
MODOS = ['correr', 'nadar', 'escalar', 'voar', 'mergulhar']

# ---------------------------------------------------------------- regras automáticas
def auto(dex, s):
    """Modos sugeridos pelas regras (antes dos ajustes à mão)."""
    h, w, t, f = s['height'], s['weight'], s['types'], s['shape']
    out = set()
    if h < 1.1 or w < 20: return out
    # voar: tipo Voador (ou dragão com asas) com porte para levar alguém
    if ('flying' in t or ('dragon' in t and f == 'bird')) and f in ('bird', 'flyer', 'biped', 'quad') and w >= 35 and h >= 1.2 and 'bug' not in t:
        out.add('voar')
    # nadar: tipo Água com corpo de nadar (peixe, serpente, quadrúpede, bolha, ave) ou bípede pesado
    if 'water' in t and (f in ('fish', 'serpent', 'quad', 'blob', 'bird') or (f == 'biped' and w >= 60)):
        out.add('nadar')
        # mergulhar: aquático grande (peixe, serpente) ou pesado
        if f in ('fish', 'serpent') or w >= 85: out.add('mergulhar')
    # correr: quadrúpede com porte de montaria
    if f == 'quad' and w >= 30 and 'water' not in t:
        out.add('correr')
    # escalar: lutador bípede (agarra a parede e leva nas costas)
    if 'fighting' in t and f == 'biped' and w >= 35:
        out.add('escalar')
    return out

# ---------------------------------------------------------------- ajustes à mão
# + acrescenta modo, - tira modo. Comentário curto do porquê.
MAO = {
    749: '+correr',              # Mudbray: montaria da história (1,0 m, mas leva o treinador nos jogos)
    750: '+correr',              # Mudsdale: montaria de Alola
    131: '+nadar +mergulhar',    # Lapras: o barco clássico
    226: '-voar +mergulhar',     # Mantine: plana sobre as ondas, não voa de verdade (montaria de surfe em Alola)
    130: '-voar',                # Gyarados: sem asas
    823: '+voar',                # Corviknight: táxi aéreo de Galar
    903: '+escalar',             # Sneasler: montaria de escalada de Hisui
    334: '+voar',                # Altaria: leva gente nas asas de algodão (jogos e anime), apesar de leve
    780: '+voar +correr',        # Drampa: voa e gosta de carregar crianças
    635: '+voar',                # Hydreigon: dragão de seis asas
    6: '+correr',                # Charizard: também anda com o treinador nas costas
    373: '+correr',              # Salamence
    149: '+nadar',               # Dragonite: resgata náufragos no mar
    148: '+nadar +mergulhar',    # Dragonair: vive em lagos e mares
    604: '+nadar +mergulhar',    # Eelektross: vive no fundo do mar
    691: '+nadar +mergulhar',    # Dragalge: alga-dragão do mar
    95: '+correr', 208: '+correr',  # Onix e Steelix: correntes de pedra e aço que levam gente na cabeça
    545: '+correr', 851: '+correr',  # Scolipede (rápido) e Centiskorch (comprido)
    376: '+correr',              # Metagross: quatro pernas, 550 kg
    713: '+correr +nadar',       # Avalugg: leva Bergmite (e gente) no lombo, inclusive pelo mar
    398: '+voar', 663: '+voar',  # Staraptor e Talonflame: leves, mas usam Voar nos jogos
    916: '+correr',              # Oinkologne: porco de 120 kg, criança monta
    # bípedes que correm com o treinador nas costas
    445: '+correr', 697: '+correr', 248: '+correr +escalar', 306: '+correr +escalar', 217: '+correr +escalar',
    553: '+correr', 612: '+correr', 115: '+correr',
    # escaladores (garras, montanha, força)
    461: '+escalar', 673: '+escalar', 359: '+escalar', 571: '+escalar', 428: '+escalar', 861: '+escalar',
    460: '+escalar', 740: '+escalar', 127: '+escalar', 212: '+escalar', 900: '+escalar', 214: '+escalar',
    282: '-escalar', 475: '+escalar',
    # o que as regras pegam mas não serve
    79: '-correr -nadar',        # Slowpoke: lento demais e leva o treinador a lugar nenhum
    80: '-nadar -mergulhar', 199: '-nadar -mergulhar',  # Slowbro e Slowking: bípedes desajeitados
    117: '-nadar -mergulhar',    # Seadra: pequeno e espinhoso
    171: '-nadar -mergulhar', 457: '-nadar -mergulhar',  # Lanturn e Lumineon: peixes finos demais
    279: '-nadar -voar -mergulhar',  # Pelipper: leva no bico, não no lombo
    689: '-nadar -mergulhar',    # Barbaracle: um amontoado de cracas
    693: '-nadar -mergulhar',    # Clawitzer: é quase só a garra
    372: '-correr',              # Shelgon: casco fechado, quase não anda
    634: '-correr',              # Zweilous: cego e briguento
    237: '-escalar',             # Hitmontop: gira de cabeça para baixo
    560: '-escalar',             # Scrafty: pequeno demais
    296: '-escalar',             # Makuhita
    499: '-escalar',             # Pignite
    419: '-correr',              # Floatzel: só nada
    523: '-correr',              # Zebstrika: sem sprite no PMD
}
# lendários e grandes que a regra deixa de fora
MAO.update({716: '+correr', 791: '+correr', 717: '+voar', 792: '+voar', 899: '+correr', 901: '+correr'})

# ---------------------------------------------------------------- estilo do assento
# lombo: senta em cima (quadrúpedes, serpentes, peixes, aves); costas: vai agarrado às costas (bípedes em pé)
def estilo(dex, s, modos):
    if dex in COSTAS: return 'costas'
    if dex in LOMBO: return 'lombo'
    return 'costas' if s['shape'] == 'biped' and not ({'voar', 'nadar', 'mergulhar'} & modos) else 'lombo'
COSTAS = {903, 461, 571, 428, 861, 282, 475, 214, 127, 212, 900, 740, 115}
LOMBO = {6, 149, 635, 445, 697, 248, 306, 217, 553, 612, 460, 9, 160, 55, 195, 537}

# Pose revista à mão na vitrine (px do sprite sem escala; substituem a medida): lift = assento acima do centro,
# back = recuo para trás do centro, topo = topo da silhueta de frente, backV = sobe mais olhando para baixo,
# behind = direções (0 = direita, sentido horário) em que o treinador fica atrás do Pokémon
AJUSTE = {
    95: {'lift': 20, 'back': -9},    # Onix: vai em cima da cabeça (como no anime)
    208: {'lift': 20, 'back': -14},  # Steelix: idem
    130: {'lift': 30, 'back': -6},   # Gyarados: no alto do pescoço, atrás da cabeça
    851: {'lift': -6, 'back': 15},   # Centiskorch: no corpo deitado, atrás da parte erguida
    286: {'back': 6}, 620: {'back': 5},  # Breloom e Mienshao: a cauda puxava o assento para longe
}

# ---------------------------------------------------------------- medida do sprite
ROW_RIGHT, ROW_DOWN = 2, 0   # linhas do PMD: 0 baixo, 2 direita

def quadro(dex, anim='Idle', row=ROW_RIGHT, i=0):
    p = pasta_de(dex)
    if not p: return None
    pasta = f'assets/pmd/{p}/'
    try: fr = json.load(open(pasta + 'frames.json'))
    except Exception: return None
    a = fr['anims'].get(anim) or fr['anims'].get('Walk')
    if not a or not a.get('q'): return None
    img = Image.open(pasta + f"{a['src']}-Anim.png").convert('RGBA')
    fw, fh = a['fw'], a['fh']
    row = min(row, img.height // fh - 1)
    crop = img.crop((i * fw, row * fh, (i + 1) * fw, (row + 1) * fh))
    al = crop.getchannel('A').load()
    q = a['q'][row][i]
    return {'w': fw, 'h': fh, 'a': al, 'q': q}

def topo(F):
    """contorno de cima: para cada coluna, o y do primeiro pixel opaco (None se vazia)"""
    out = []
    for x in range(F['w']):
        y = next((y for y in range(F['h']) if F['a'][x, y] > 40), None)
        out.append(y)
    return out

def medir(dex, est):
    F = quadro(dex)
    if not F: return None
    q = F['q']; cx, cy = q[2], q[3]
    if cx < 0: cx, cy = q[0], q[1] - 8
    x0, y0, x1, y1 = q[10], q[11], q[12], q[13]
    W = max(4, x1 - x0)
    T = topo(F)
    if est == 'costas':
        # nas costas: altura um pouco acima do centro, recuado até a borda de trás do corpo na linha do centro
        lin = [x for x in range(F['w']) if F['a'][x, cy] > 40]
        tras = min(lin) if lin else cx - W // 3
        return {'lift': round(0.2 * (cy - y0)), 'back': max(2, round((cx - tras) * 0.75))}
    # lombo: vale mais fundo do contorno de cima perto do centro (entre pescoço e garupa, ou entre asas e cabeça).
    # Só conta o corpo ligado ao centro: em cada coluna, sobe a partir da linha do centro enquanto houver pixel.
    def corrida(x):
        if F['a'][x, cy] <= 40: return None
        y = cy
        while y > 0 and F['a'][x, y - 1] > 40: y -= 1
        return y
    R = [corrida(x) if 0 <= x < F['w'] else None for x in range(F['w'])]
    best = None
    lo, hi = int(cx - 0.3 * W), int(cx + 0.22 * W)
    pref = cx - 0.05 * W
    for x in range(max(x0 + 1, lo), min(x1 - 1, hi) + 1):
        js = [R[k] for k in range(x - 2, x + 3) if 0 <= k < F['w'] and R[k] is not None]
        if len(js) < 4: continue
        apoio = min(js)                       # o ponto mais alto sob o assento segura o treinador
        score = apoio - 0.25 * abs(x - pref)
        if best is None or score > best[0]: best = (score, x, apoio)
    if not best: return {'lift': round(0.4 * (cy - y0)), 'back': 0}
    _, sx, sy = best
    # vista de 3/4 por cima: o assento fica no meio do lombo, abaixo da borda do contorno (como nas 5 da história)
    return {'lift': round(0.45 * (cy - sy)), 'back': round(min(0.6 * (cx - sx), 0.18 * W))}

def medir_baixo(dex):
    """olhando para baixo: topo da silhueta na coluna do centro (o treinador precisa aparecer por cima)"""
    F = quadro(dex, row=ROW_DOWN)
    if not F: return None
    q = F['q']; cx, cy = q[2], q[3]
    if cx < 0: cx, cy = q[0], q[1] - 8
    T = topo(F)
    col = [T[k] for k in range(cx - 1, cx + 2) if 0 <= k < F['w'] and T[k] is not None]
    return {'topo': (cy - min(col)) if col else 0}

# ---------------------------------------------------------------- monta a tabela
tabela, cont = {}, {k: 0 for k in MODOS}
for dex, s in sorted(ESP.items()) + sorted(FORMAS.items()):
    if isinstance(dex, int) and dex not in PMD: continue
    if isinstance(dex, str) and not pasta_de(dex): continue
    modos = auto(dex, s)
    base = int(str(dex).split('-')[0])
    # a forma herda os ajustes à mão da espécie, a não ser que tenha os próprios
    for op in MAO.get(dex, MAO.get(base, '') if isinstance(dex, str) and dex not in MAO else '').split():
        (modos.add if op[0] == '+' else modos.discard)(op[1:])
    if not modos: continue
    est = estilo(dex, s, modos)
    p = medir(dex, est)
    if not p: print('sem medida', dex, s['name'], file=sys.stderr); continue
    b = medir_baixo(dex) or {'topo': 0}
    adj = AJUSTE.get(dex, {})
    e = {'m': [k for k in MODOS if k in modos], 'est': est,
         'lift': adj.get('lift', p['lift']), 'back': adj.get('back', p['back']), 'topo': adj.get('topo', b['topo'])}
    for k in ('backV', 'behind', 'sink'):
        if k in adj: e[k] = adj[k]
    tabela[dex] = e
    for k in e['m']: cont[k] += 1

def js(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))
nome = lambda d: FORMAS[d]['name'] if isinstance(d, str) else ESP[d]['name']
linhas = [f'  {d if isinstance(d, int) else js(d)}: {js(e)}, // {nome(d)}' for d, e in tabela.items()]
txt = f'''// GERADO por tools/gerar_montarias.py (não edite à mão: ajustes vão nas tabelas MAO e AJUSTE do script).
// Espécies que carregam o treinador: {len(tabela)} ({", ".join(f"{k} {v}" for k, v in cont.items())}).
// m = modos; est = lombo (senta em cima) | costas (vai agarrado às costas, como no Sneasler);
// lift = altura do assento acima do centro do corpo; back = recuo do assento para trás do centro;
// topo = altura da silhueta acima do centro, olhando para a câmera (o treinador aparece por cima dela).
// Medidas em px do sprite do PMD sem escala; src/world/mounts.js multiplica pela escala da espécie.
// Formas (regionais e alternativas) entram com a chave "<dex>-<forma>" (a mesma de Mon.spriteKey).
export const MONTARIAS = {{
{chr(10).join(linhas)}
}};
'''
open('src/data/montarias.js', 'w', encoding='utf-8').write(txt)
print(len(tabela), cont)
