# Ferramentas de desenho da região Arquipélago das Brasas (gerador de assets/maps/regioes/brasas.json).
# Coordenadas absolutas do mundo; a grade cobre o retângulo da região [800, 480, 400, 480].
import math
import numpy as np
from PIL import Image, ImageDraw

X0, Y0, W, H = 800, 480, 400, 480


def novo():
    return np.full((H, W), 'W', dtype='<U1')


# ---------------------------------------------------------------- ruído
def _suave(t):
    return t * t * (3 - 2 * t)


def vnoise(escala, semente, shape=(H, W)):
    rng = np.random.default_rng(semente)
    gh, gw = int(shape[0] / escala) + 3, int(shape[1] / escala) + 3
    g = rng.random((gh, gw))
    ys = np.arange(shape[0]) / escala
    xs = np.arange(shape[1]) / escala
    y0 = ys.astype(int); x0 = xs.astype(int)
    fy = _suave(ys - y0)[:, None]; fx = _suave(xs - x0)[None, :]
    a = g[np.ix_(y0, x0)]; b = g[np.ix_(y0, x0 + 1)]
    c = g[np.ix_(y0 + 1, x0)]; d = g[np.ix_(y0 + 1, x0 + 1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(semente, escalas=(48, 24, 12, 6), pesos=(0.4, 0.3, 0.2, 0.1)):
    r = np.zeros((H, W))
    for i, (e, p) in enumerate(zip(escalas, pesos)):
        r += vnoise(e, semente * 31 + i) * p
    return r / sum(pesos)


# ---------------------------------------------------------------- máscaras
def poligono(pts, ruido=0, semente=1, amp=3.0):
    """Máscara (H, W) de um polígono em coordenadas absolutas; 'ruido' > 0 entorta a borda."""
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).polygon([(x - X0, y - Y0) for x, y in pts], fill=255)
    m = np.array(im) > 0
    if ruido:
        n1 = (fbm(semente, (24, 12, 6), (0.5, 0.3, 0.2)) - 0.5) * 2 * amp
        n2 = (fbm(semente + 7, (24, 12, 6), (0.5, 0.3, 0.2)) - 0.5) * 2 * amp
        yy, xx = np.mgrid[0:H, 0:W]
        sx = np.clip((xx + n1).round().astype(int), 0, W - 1)
        sy = np.clip((yy + n2).round().astype(int), 0, H - 1)
        m = m[sy, sx]
    return m


def elipse(cx, cy, rx, ry, ruido=0.0, semente=1, rot=0.0):
    yy, xx = np.mgrid[0:H, 0:W]
    dx = xx + X0 - cx; dy = yy + Y0 - cy
    if rot:
        c, s = math.cos(rot), math.sin(rot)
        dx, dy = dx * c + dy * s, -dx * s + dy * c
    d = (dx / rx) ** 2 + (dy / ry) ** 2
    if ruido:
        d = d + (fbm(semente, (16, 8, 4), (0.5, 0.3, 0.2)) - 0.5) * 2 * ruido
    return d < 1.0


def eliptica_d(cx, cy, rx, ry):
    """Distância normalizada ao centro de uma elipse (1 = na borda)."""
    yy, xx = np.mgrid[0:H, 0:W]
    return np.sqrt(((xx + X0 - cx) / rx) ** 2 + ((yy + Y0 - cy) / ry) ** 2)


def retangulo(x, y, w, h):
    m = np.zeros((H, W), bool)
    m[max(0, y - Y0):max(0, y - Y0 + h), max(0, x - X0):max(0, x - X0 + w)] = True
    return m


def faixa(pts, larg, ruido=0.0, semente=1):
    """Máscara de uma linha poligonal grossa (trilha, rio de lava, correnteza)."""
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    p = [(x - X0 + 0.5, y - Y0 + 0.5) for x, y in pts]
    d.line(p, fill=255, width=max(1, int(round(larg))), joint='curve')
    r = larg / 2
    for x, y in p:
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    m = np.array(im) > 0
    if ruido:
        n1 = (fbm(semente, (10, 5), (0.6, 0.4)) - 0.5) * 2 * ruido
        n2 = (fbm(semente + 3, (10, 5), (0.6, 0.4)) - 0.5) * 2 * ruido
        yy, xx = np.mgrid[0:H, 0:W]
        m = m[np.clip((yy + n2).round().astype(int), 0, H - 1), np.clip((xx + n1).round().astype(int), 0, W - 1)]
    return m


def interior(mask, n=40):
    """Distância (em blocos, 4-vizinhança alternada com 8) de cada célula verdadeira até a borda: 1 = encostada."""
    d = np.zeros(mask.shape, int)
    cur = mask.copy()
    k = 0
    while cur.any() and k < n:
        k += 1
        d[cur] = k
        p = np.pad(cur, 1, constant_values=False)
        e = p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:]
        if k % 2 == 0:
            e = e & p[:-2, :-2] & p[:-2, 2:] & p[2:, :-2] & p[2:, 2:]
        cur = cur & e
    return d


def exterior(mask, n=12):
    d = np.zeros(mask.shape, int)
    cur = mask.copy()
    for k in range(1, n + 1):
        p = np.pad(cur, 1, constant_values=False)
        a = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
        if k % 2 == 0:
            a = a | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]
        new = a & ~cur
        d[new & (d == 0)] = k
        cur = cur | a
    return d


def pinta(G, mask, ch):
    G[mask] = ch


def ponto(G, x, y, ch):
    if X0 <= x < X0 + W and Y0 <= y < Y0 + H:
        G[y - Y0, x - X0] = ch


def carimbo(G, x, y, linhas, legenda=None):
    """Cola um desenho em texto (espaço = não muda) em coordenadas absolutas."""
    for j, ln in enumerate(linhas):
        for i, c in enumerate(ln):
            if c == ' ':
                continue
            ponto(G, x + i, y + j, (legenda or {}).get(c, c))


def em(G, x, y):
    return G[y - Y0, x - X0]


# ---------------------------------------------------------------- aleatório determinístico
class Sorteio:
    def __init__(self, semente):
        self.r = np.random.default_rng(semente)

    def u(self):
        return float(self.r.random())

    def i(self, a, b):
        return int(self.r.integers(a, b + 1))

    def pick(self, lst):
        return lst[int(self.r.integers(0, len(lst)))]


# ---------------------------------------------------------------- pré-visualização
CORES = {
    'W': (14, 40, 92), '~': (30, 90, 160), ':': (226, 206, 150), 'A': (150, 130, 100), '.': (92, 160, 76), ',': (82, 148, 68),
    '"': (52, 120, 60), '=': (170, 140, 92), 'P': (200, 190, 170), '*': (230, 120, 170), '#': (110, 90, 80), '^': (160, 120, 80),
    'V': (60, 140, 70), 'B': (150, 100, 60), 'D': (130, 90, 56), 'F': (30, 80, 40), 'v': (54, 50, 56), 'a': (110, 108, 112), 'l': (255, 90, 20),
    'o': (60, 30, 90), 'q': (120, 220, 230), ';': (232, 232, 224), '%': (70, 190, 190), '/': (110, 190, 220), 'O': (20, 10, 10),
    'H': (140, 90, 60), 'E': (190, 150, 100), 'Y': (200, 100, 60), 'X': (130, 120, 100), '→': (60, 130, 200), '↓': (60, 130, 200),
    '←': (60, 130, 200), '↑': (60, 130, 200), 'u': (140, 50, 30), 'U': (60, 30, 30), 's': (240, 240, 250), 'f': (200, 170, 120), 'w': (90, 70, 60),
    'm': (200, 60, 60), 'c': (190, 150, 90), '_': (0, 0, 0), 'g': (210, 190, 80), 'L': (110, 80, 50), 'd': (40, 90, 50), 't': (210, 200, 190),
}


def previa(G, caminho, k=2, objetos=None, rotulos=None, recorte=None):
    h, w = G.shape
    im = Image.new('RGB', (w * k, h * k))
    px = im.load()
    for y in range(h):
        for x in range(w):
            c = CORES.get(G[y, x], (255, 0, 255))
            for j in range(k):
                for i in range(k):
                    px[x * k + i, y * k + j] = c
    d = ImageDraw.Draw(im)
    for o in objetos or []:
        x, y = o['x'] - X0, o['y'] - Y0
        fw, fh = o.get('_fw', 1), o.get('_fh', 1)
        d.rectangle([x * k, y * k, (x + fw) * k - 1, (y + fh) * k - 1], fill=o.get('_cor', (255, 255, 0)))
    for t, x, y in rotulos or []:
        d.text(((x - X0) * k, (y - Y0) * k), t, fill=(255, 255, 255))
    if recorte:
        x, y, ww, hh = recorte
        im = im.crop(((x - X0) * k, (y - Y0) * k, (x - X0 + ww) * k, (y - Y0 + hh) * k))
    im.save(caminho)
