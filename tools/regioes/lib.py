# Ajudantes para gerar o JSON de uma região (usado por gerar-sertao.py). Coordenadas absolutas do mundo, em blocos.
import json, math, random

class Reg:
    def __init__(self, base):
        self.base = base
        self.ops, self.objects, self.decor, self.trees = [], [], [], []
        self.interiors, self.warps, self.items, self.people, self.pets = [], [], [], [], []
        self.areas, self.spots, self.ninhos, self.viagens, self.tocas = [], {}, [], [], []
        self.mecanismos, self.buracos, self.noTrees, self.signs = [], [], [], []
        self.rng = random.Random(7)

    # ---- pintura
    def c(self, txt): self.ops.append({'op': 'comment', '_': txt})
    def rect(self, t, x, y, w, h, on=None):
        o = {'op': 'rect', 't': t, 'x': x, 'y': y, 'w': w, 'h': h}
        if on: o['on'] = on
        self.ops.append(o)
    def ell(self, t, cx, cy, rx, ry, noise=0.6, on=None):
        o = {'op': 'ellipse', 't': t, 'cx': cx, 'cy': cy, 'rx': rx, 'ry': ry, 'noise': noise}
        if on: o['on'] = on
        self.ops.append(o)
    def poly(self, t, pts, noise=0.6, on=None):
        o = {'op': 'poly', 't': t, 'pts': pts, 'noise': noise}
        if on: o['on'] = on
        self.ops.append(o)
    def path(self, t, pts, w=3, wob=0, on=None):
        o = {'op': 'path', 't': t, 'pts': pts, 'width': w}
        if wob: o['wobble'] = wob
        if on: o['on'] = on
        self.ops.append(o)
    def line(self, t, pts): self.ops.append({'op': 'line', 't': t, 'pts': pts})
    def set(self, t, pts): self.ops.append({'op': 'set', 't': t, 'pts': pts})
    def blobs(self, t, x, y, w, h, scale=0.12, th=0.62, on=None):
        o = {'op': 'blobs', 't': t, 'x': x, 'y': y, 'w': w, 'h': h, 'scale': scale, 'th': th}
        if on: o['on'] = on
        self.ops.append(o)
    def scatter(self, t, x, y, w, h, p, on=None):
        o = {'op': 'scatter', 't': t, 'x': x, 'y': y, 'w': w, 'h': h, 'p': p}
        if on: o['on'] = on
        self.ops.append(o)
    def stamp(self, x, y, rows, legend=None):
        o = {'op': 'stamp', 'x': x, 'y': y, 'rows': rows}
        if legend: o['legend'] = legend
        self.ops.append(o)
    def fence(self, x, y, n, d='h', white=False):
        o = {'op': 'fence', 'x': x, 'y': y, 'len': n, 'dir': d}
        if white: o['white'] = True
        self.ops.append(o)
    # ---- árvores / objetos
    def tree(self, x, y, w, h, p, kinds, on): self.trees.append({'x': x, 'y': y, 'w': w, 'h': h, 'p': p, 'kinds': kinds, 'on': on})
    def obj(self, kind, x, y, **kw): o = {'kind': kind, 'x': x, 'y': y}; o.update(kw); self.objects.append(o); return o
    def dec(self, kind, x, y, w=None, h=None):
        d = {'kind': kind, 'x': x, 'y': y}
        if w: d['w'] = w; d['h'] = h or 1
        self.decor.append(d)
    def sign(self, x, y, text): self.obj('sign', x, y, text=text)
    def item(self, x, y, item, n=1, hidden=False):
        o = {'x': x, 'y': y, 'item': item}
        if n != 1: o['n'] = n
        if hidden: o['hidden'] = True
        self.items.append(o)
    def person(self, id, name, look, x, y, lines, dir='down', wander=0, **kw):
        p = {'id': id, 'name': name, 'look': look, 'x': x, 'y': y, 'dir': dir, 'lines': lines}
        if wander: p['wander'] = wander
        p.update(kw); self.people.append(p); return p
    def area(self, id, name, biome, rect=None, ell=None, **kw):
        a = {'id': id, 'name': name, 'biome': biome}
        if rect: a['rect'] = rect
        if ell: a['ellipse'] = ell
        a.update(kw); self.areas.append(a)

def sala(id, name, W, H, mat_x, biome=None, floor='f', wall='w', **kw):
    """Sala retangular: 2 linhas de parede em cima, chão, tapete na última linha de chão e parede embaixo."""
    rows = []
    for y in range(H):
        if y < 2 or y == H - 1: rows.append(wall * W)
        else: rows.append(wall + floor * (W - 2) + wall)
    r = list(rows[H - 2]); r[mat_x] = 'm'; rows[H - 2] = ''.join(r)
    s = {'id': id, 'name': name, 'rows': rows, 'objects': [], 'decor': [], 'spots': {}, 'people': [], 'pets': [], 'items': [], 'warps': []}
    if biome: s['biome'] = biome
    s.update(kw); return s

class Grid:
    def __init__(self, W, H, fill='H'): self.W, self.H, self.g = W, H, [[fill] * W for _ in range(H)]
    def put(self, x, y, ch): self.g[y][x] = ch
    def get(self, x, y): return self.g[y][x]
    def carve(self, x0, y0, x1, y1, ch='E'):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1): self.g[y][x] = ch
    def rows(self): return [''.join(r) for r in self.g]
    def show(self):
        for i, r in enumerate(self.rows()): print('%2d %s' % (i, r))
