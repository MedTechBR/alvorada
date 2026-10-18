# Confere a conexão a pé (e nadando, e escalando) entre os pontos importantes da região.
import sys, collections
from base import *
from catalogo import TAM
import gerar
from cena import solidos

PE = set('.,"=PB*:Aavoq;%DEYXf^/|O')
NADA = set('~W→←↑↓')


def bfs(G, S, ini, modos):
    ok = set(PE)
    if 'nadar' in modos:
        ok |= NADA
    if 'escalar' in modos:
        ok |= set('V')
    seen = np.zeros((H, W), bool)
    q = collections.deque()
    x, y = ini
    q.append((x - X0, y - Y0)); seen[y - Y0, x - X0] = True
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xx, yy = x + dx, y + dy
            if 0 <= xx < W and 0 <= yy < H and not seen[yy, xx] and G[yy, xx] in ok and not S[yy, xx]:
                seen[yy, xx] = True
                q.append((xx, yy))
    return seen


if __name__ == '__main__':
    R, G, ctx = gerar.montar()
    S = solidos(R)
    inicio = (989, 660)
    pe = bfs(G, S, inicio, set())
    nad = bfs(G, S, inicio, {'nadar'})
    esc = bfs(G, S, inicio, {'nadar', 'escalar'})
    def mostra(nome, x, y):
        p = '·'
        r = 'PÉ' if pe[y - Y0, x - X0] else 'NADO' if nad[y - Y0, x - X0] else 'ESCALA' if esc[y - Y0, x - X0] else 'NÃO'
        return f'{nome:28s} ({x},{y}) {G[y - Y0, x - X0]} {r}'
    print('--- pontos')
    for k, v in R['spots'].items():
        if not k.startswith('dentro_') and not k.startswith('templo') and not k.startswith('porta_') and not k.startswith('centro') and not k.startswith('banhos'):
            x, y = int(v[0]), int(v[1])
            if X0 <= x < X0 + W and Y0 <= y < Y0 + H:
                print(mostra(k, x, y))
    print('--- itens')
    for i in R['items']:
        r = mostra(i['item'] + ('*' if i.get('hidden') else ''), i['x'], i['y'])
        if 'PÉ' not in r:
            print(r)
    print('--- tocas')
    for t in R['tocas']:
        print(mostra(t['id'], t['x'], t['y']))
    print('--- pessoas')
    for p in R['people']:
        r = mostra(p['id'], int(p['x']), int(p['y']))
        if 'PÉ' not in r:
            print(r)
    print('--- avisos de objetos em cima de caminho')
    bloq = 0
    for o in R['objects']:
        fw, fh = TAM.get(o['kind'], (1, 1))
        for j in range(fh):
            for i in range(fw):
                if G[o['y'] + j - Y0, o['x'] + i - X0] in 'B=' and o['kind'] not in ('center', 'mart') and o['kind'][:5] != 'house':
                    bloq += 1
    print('objetos sobre trilha/ponte:', bloq)
