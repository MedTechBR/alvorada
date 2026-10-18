# Ajudantes para pôr objetos, moradores e salas no JSON da região, conferindo o chão e a ocupação.
import numpy as np
from base import *
from catalogo import TAM

TAM.update({'lampiao': (1, 1), 'estante': (1, 1), 'barraca': (3, 1), 'fogao': (2, 1), 'quadro': (1, 1), 'table': (2, 1), 'machine': (2, 1),
            'counter': (4, 1), 'balltable': (3, 1), 'bed': (1, 2), 'cavalete': (2, 1), 'maquete': (3, 1), 'painel': (3, 1)})

ANDAVEL = set('.,"=PB*:Aaovq;%DEYXVfwtmkSZ+/|')   # chão onde uma pegada pode ficar
CHAO_OBJ = set('.,=P*:Aavo;EYX"')                   # onde objetos comuns podem ir (sem água, sem lava, sem poça)


class Cena:
    def __init__(self, R, G):
        self.R, self.G = R, G
        self.ocup = np.zeros((H, W), bool)
        self.n = 0

    # ---- ocupação do mapa de fora
    def livre(self, x, y, fw=1, fh=1, chao=CHAO_OBJ):
        for j in range(fh):
            for i in range(fw):
                xx, yy = x + i - X0, y + j - Y0
                if not (0 <= xx < W and 0 <= yy < H):
                    return False
                if self.ocup[yy, xx] or self.G[yy, xx] not in chao:
                    return False
        return True

    def marca(self, x, y, fw=1, fh=1, folga=0):
        self.ocup[max(0, y - Y0 - folga):max(0, y - Y0 + fh + folga), max(0, x - X0 - folga):max(0, x - X0 + fw + folga)] = True

    def obj(self, kind, x, y, forcar=False, folga=0, **kw):
        fw, fh = TAM.get(kind, (1, 1))
        if not forcar and not self.livre(x, y, fw, fh):
            return None
        o = {'kind': kind, 'x': x, 'y': y}
        o.update(kw)
        self.R['objects'].append(o)
        self.marca(x, y, fw, fh, folga)
        return o

    def reserva(self, x, y, fw, fh):
        self.marca(x, y, fw, fh)

    def reserva_mask(self, m):
        self.ocup |= m

    # ---- gente
    def pessoa(self, **kw):
        self.R['people'].append(kw)
        return kw

    def spot(self, nome, x, y, dir='down'):
        self.R['spots'][nome] = [x, y, dir]


# ---------------------------------------------------------------- salas (interiores) feitas à mão
def paredes(Wd, Hd, piso='f', porta=None, extra=None):
    rows = []
    for y in range(Hd):
        if y < 2 or y == Hd - 1:
            rows.append('w' * Wd)
            continue
        s = 'w' + piso * (Wd - 2) + 'w'
        if y == Hd - 2 and porta is not None:
            s = s[:porta] + 'm' + s[porta + 1:]
        rows.append(s)
    for (x, y, ch) in extra or []:
        rows[y] = rows[y][:x] + ch + rows[y][x + 1:]
    return rows


def retoca(rows, x, y, ch):
    rows[y] = rows[y][:x] + ch + rows[y][x + 1:]


def preenche(rows, x, y, w, h, ch):
    for j in range(h):
        for i in range(w):
            retoca(rows, x + i, y + j, ch)
