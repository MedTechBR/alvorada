#!/usr/bin/env python3
"""Atlas de texturas 16x16 (estilo HGSS) para o visual 3D.

Uso (da raiz do repositório):  python3 -I tools/hgss/texturas.py

Saída em assets/hgss/texturas/:
  atlas.png    todas as texturas de 16x16 num só PNG (16 colunas), para usar com filtro 'nearest' e sem mipmaps
  indice.json  { celula, colunas, tamanho, tex: { nome: {x, y, u0, v0, u1, v1} },
                 tipos: { "<nome do TILE em minúsculas>": {id, topo, lado?, anim?: [nomes], altura?} },
                 interior: { nome: "interior/<arquivo>.webp" } }
  interior/    texturas maiores do demo (32 e 64 px) que não cabem na grade de 16

As texturas do demo de fã (referencias/pba/assets/textures) entram como estão: grama, trilha, telhado, parede,
piso de madeira, azulejo, cerca, lâmina de mato, papel de parede. As outras são desenhadas aqui, em código, com
a mesma paleta (cor base + 1 tom claro + 1 tom escuro e pontos soltos), de forma determinística (semente por nome).
"""
import json
import os
import random
import shutil
import zlib

from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEMO = os.path.join(RAIZ, 'referencias', 'pba', 'assets', 'textures')
SAIDA = os.path.join(RAIZ, 'assets', 'hgss', 'texturas')
N = 16


# ------------------------------------------------------------------ cores
def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def claro(c, t=0.18):
    return mix(c, (255, 255, 235), t)


def escuro(c, t=0.22):
    return mix(c, (20, 24, 56), t)  # sombra puxa para o azul, como no HGSS


class Tela:
    def __init__(self, base=None, w=N, h=N):
        self.w, self.h = w, h
        self.p = [[(*base, 255) if base else (0, 0, 0, 0) for _ in range(w)] for _ in range(h)]

    def set(self, x, y, c, a=255):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.p[y][x] = (*c, a)

    def get(self, x, y):
        return self.p[y % self.h][x % self.w]

    def rect(self, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w):
                self.set(i, j, c)

    def img(self):
        im = Image.new('RGBA', (self.w, self.h))
        im.putdata([px for row in self.p for px in row])
        return im


def semente(nome):
    return random.Random(zlib.crc32(nome.encode()))


# ------------------------------------------------------------------ padrões
def ruido(r, base, n=22, tons=None, var=0.1):
    """Fundo com pontos soltos mais claros e mais escuros (a cara das texturas do demo)."""
    t = Tela(base)
    tons = tons or [claro(base, var * 1.4), escuro(base, var), mix(base, claro(base, .5), var * .6)]
    for _ in range(n):
        t.set(r.randrange(N), r.randrange(N), r.choice(tons))
    return t


def folhas_capim(t, r, cor, n=6, alt=3):
    for _ in range(n):
        x, y = r.randrange(N), r.randrange(N)
        for k in range(alt):
            t.set(x, y - k, claro(cor, .12 * k) if k else escuro(cor, .1))


def capim(r, base, n=26, lam=5):
    t = ruido(r, base, n)
    folhas_capim(t, r, base, lam, 2)
    return t


def lamina(r, base, n=3):
    """Mato alto: capim escuro com lâminas compridas claras."""
    t = ruido(r, escuro(base, .2), 18, [escuro(base, .32), base])
    for _ in range(n + 5):
        x, y = r.randrange(N), r.randrange(4, N)
        h = r.randrange(4, 8)
        for k in range(h):
            t.set(x + (k // 4) * r.choice([0, 0]), y - k, mix(base, claro(base, .45), k / h))
    return t


def flores(r, base, cores):
    t = capim(r, base, 20, 3)
    for _ in range(5):
        x, y = r.randrange(1, N - 1), r.randrange(1, N - 1)
        c = r.choice(cores)
        t.set(x, y, c)
        if r.random() < .6:
            t.set(x + 1, y, claro(c, .3))
        t.set(x, y + 1, escuro(base, .1))
    return t


def tijolos(base, argamassa, linhas=4, larg=8, desl=True, r=None):
    t = Tela(base)
    h = N // linhas
    for j in range(linhas):
        y = j * h
        for i in range(N):
            t.set(i, y + h - 1, argamassa)
        off = (larg // 2) if (desl and j % 2) else 0
        for k in range(-1, N // larg + 2):
            x = k * larg + off
            for jj in range(h - 1):
                t.set(x, y + jj, argamassa)
        if r:
            for _ in range(3):
                t.set(r.randrange(N), y + r.randrange(h - 1), r.choice([claro(base, .12), escuro(base, .12)]))
    return t


def tabuas(base, r, tab=4, vertical=False):
    t = Tela(base)
    esc = escuro(base, .28)
    for j in range(N // tab):
        for i in range(N):
            c = esc
            if vertical:
                t.set(j * tab + tab - 1, i, c)
            else:
                t.set(i, j * tab + tab - 1, c)
        if not vertical:
            for i in range(N):
                t.set(i, j * tab, claro(base, .1))
            x = (j * 7 + 3) % N
            for jj in range(tab - 1):
                t.set(x, j * tab + jj, esc)
        else:
            for i in range(N):
                t.set(j * tab, i, claro(base, .1))
    for _ in range(8):
        t.set(r.randrange(N), r.randrange(N), r.choice([claro(base, .1), escuro(base, .1)]))
    return t


def azulejo(c1, c2, tam=8, junta=None):
    t = Tela(c1)
    for j in range(N):
        for i in range(N):
            if ((i // tam) + (j // tam)) % 2:
                t.set(i, j, c2)
    if junta:
        for k in range(N):
            for q in range(0, N, tam):
                t.set(q, k, junta)
                t.set(k, q, junta)
    return t


def ondas(r, base, alto, n=7, quadro=0):
    t = Tela(base)
    pos = [(1, 2), (9, 5), (4, 9), (12, 12), (2, 14), (8, 0), (13, 8)]
    for k, (x, y) in enumerate(pos[:n]):
        x = (x + quadro * 3) % N
        for d in range(4):
            t.set((x + d) % N, y, alto)
        t.set((x + 1) % N, y + 1, mix(base, alto, .45))
    for _ in range(10):
        t.set(r.randrange(N), r.randrange(N), mix(base, alto, .3))
    return t


def pedras(r, base, n=5, lin=True):
    """Calçamento / pedras arredondadas com junta escura."""
    t = ruido(r, base, 8)
    jun = escuro(base, .28)
    # células em grade irregular
    ys = [0, 5, 10, N]
    for jj in range(3):
        y0, y1 = ys[jj], ys[jj + 1]
        xs = [0] + sorted(r.sample(range(3, N - 2), 2)) + [N]
        for k in range(3):
            for i in range(xs[k], xs[k + 1]):
                t.set(i, y1 - 1, jun)
            for j in range(y0, y1):
                t.set(xs[k], j, jun)
            t.set(xs[k] + 1, y0 + 1, claro(base, .16))
    return t


def estratos(r, base, tons, n=5):
    t = Tela(base)
    y = 0
    k = 0
    while y < N:
        h = r.randrange(2, 5)
        c = tons[k % len(tons)]
        for j in range(y, min(N, y + h)):
            for i in range(N):
                t.set(i, j, c)
        for i in range(N):
            t.set(i, min(N - 1, y + h - 1), escuro(c, .12))
        y += h
        k += 1
    for _ in range(14):
        t.set(r.randrange(N), r.randrange(N), r.choice([claro(base, .12), escuro(base, .14)]))
    return t


def rachaduras(r, base, cor, n=2):
    t = ruido(r, base, 14)
    for _ in range(n):
        x, y = r.randrange(N), r.randrange(N)
        for _ in range(r.randrange(5, 9)):
            t.set(x % N, y % N, cor)
            if r.random() < .5:
                x += r.choice([-1, 1])
            else:
                y += r.choice([-1, 1])
    return t


def telhado(base, r, linhas=4, claro_topo=True):
    t = Tela(base)
    esc = escuro(base, .3)
    h = N // linhas
    for j in range(linhas):
        for i in range(N):
            t.set(i, j * h + h - 1, esc)
            if claro_topo:
                t.set(i, j * h, claro(base, .14))
        off = 4 if j % 2 else 0
        for k in range(0, N + 8, 8):
            for jj in range(h - 1):
                t.set((k + off) % N, j * h + jj, escuro(base, .14))
    return t


def folhagem(r, base, topo=False):
    """Copa de árvore / arbusto: grumos de pixel claro sobre verde escuro, sombra embaixo."""
    t = Tela(escuro(base, .25))
    for _ in range(9):
        cx, cy = r.randrange(N), r.randrange(N)
        rad = r.choice([2, 3, 3])
        for j in range(-rad, rad + 1):
            for i in range(-rad, rad + 1):
                d = i * i + j * j
                if d <= rad * rad:
                    sombra = (j + i * .5) / (rad + 1)
                    c = mix(base, claro(base, .55), max(0, -sombra) * .9) if sombra < .35 else escuro(base, .08)
                    t.set((cx + i) % N, (cy + j) % N, c)
    if not topo:
        for i in range(N):
            t.set(i, N - 1, escuro(base, .35))
            t.set(i, N - 2, escuro(base, .22))
    # frutinhas (arbusto de bagas do HGSS)
    return t


def casca(r, base):
    t = Tela(base)
    for i in range(N):
        c = escuro(base, .22) if i % 4 == 1 else (claro(base, .1) if i % 4 == 3 else base)
        for j in range(N):
            t.set(i, j, c)
    for _ in range(10):
        x, y = r.randrange(N), r.randrange(N)
        t.set(x, y, escuro(base, .35))
        t.set(x, y + 1, escuro(base, .35))
    return t


def aneis(base):
    t = Tela(base)
    for j in range(N):
        for i in range(N):
            d = max(abs(i - 7.5), abs(j - 7.5))
            dd = ((i - 7.5) ** 2 + (j - 7.5) ** 2) ** .5
            t.set(i, j, escuro(base, .18) if int(dd) % 3 == 2 else (claro(base, .1) if int(dd) % 3 == 0 else base))
    for i in range(N):
        for j in range(N):
            if ((i - 7.5) ** 2 + (j - 7.5) ** 2) ** .5 > 7.6:
                t.set(i, j, escuro(base, .4))
    return t


def janela(vidro, moldura, noite=False, grade=True):
    t = Tela(moldura)
    t.rect(2, 2, 12, 12, escuro(moldura, .3))
    t.rect(3, 3, 10, 10, vidro)
    if noite:
        t.rect(3, 3, 10, 10, (255, 226, 122))
        t.rect(3, 3, 10, 3, (255, 244, 180))
    else:
        for j in range(3, 13):
            t.rect(3, j, 10, 1, mix(vidro, (230, 245, 255), (13 - j) / 14))
        t.rect(4, 4, 3, 1, (255, 255, 255))
    if grade:
        t.rect(7, 3, 2, 10, moldura)
        t.rect(3, 7, 10, 2, moldura)
    return t


def porta(base, r, vidro=None, trinco=(240, 208, 80)):
    t = Tela(base)
    esc = escuro(base, .3)
    for j in range(N):
        t.set(0, j, esc)
        t.set(N - 1, j, esc)
    for i in range(N):
        t.set(i, 0, esc)
    if vidro:
        t.rect(2, 2, 12, 12, escuro(base, .2))
        t.rect(3, 3, 10, 12, vidro)
        t.rect(7, 3, 2, 12, claro(vidro, .45))
        t.rect(3, 3, 3, 1, claro(vidro, .7))
    else:
        for k in range(3):
            t.rect(2, 2 + k * 4, 12, 3, mix(base, claro(base), .12))
            t.rect(2, 4 + k * 4, 12, 1, esc)
        t.rect(3, 3, 4, 4, escuro(base, .15))
        t.rect(9, 3, 4, 4, escuro(base, .15))
    t.rect(12, 9, 2, 2, trinco)
    return t


def pontos(r, base, cor, n=8):
    t = ruido(r, base, 12)
    for _ in range(n):
        t.set(r.randrange(N), r.randrange(N), cor)
    return t


def setas(base, cor, direcao, quadro=0):
    t = Tela(base)
    for j in range(N):
        for i in range(N):
            if (i + j * 2 + quadro * 2) % 8 == 0:
                t.set(i, j, mix(base, cor, .5))
    cx = cy = 7
    pts = {'e': [(-3, -3), (-2, -2), (-1, -1), (0, 0), (-1, 1), (-2, 2), (-3, 3), (4, 0)], 'w': [], 'n': [], 's': []}
    ch = {'e': (1, 0), 'w': (-1, 0), 'n': (0, -1), 's': (0, 1)}[direcao]
    for k in range(-3, 4):
        # haste e ponta
        t.set(cx + ch[0] * k, cy + ch[1] * k, cor)
        t.set(cx + ch[0] * k + ch[1], cy + ch[1] * k + ch[0], cor)
    px, py = cx + ch[0] * 4, cy + ch[1] * 4
    for k in range(0, 4):
        for s in (-k, k):
            t.set(px - ch[0] * k + (ch[1] * s), py - ch[1] * k + (ch[0] * s), cor)
    return t


# ------------------------------------------------------------------ catálogo de texturas
def desenha_todas():
    """nome -> Tela (ou Image). A ordem define as posições no atlas."""
    T = {}

    def R(n):
        return semente(n)

    verde = rgb('#5ca046')
    # --- chão básico
    T['grama'] = capim(R('grama'), verde)
    T['grama_2'] = capim(R('grama2'), rgb('#62a84b'), 30, 6)
    T['grama_3'] = capim(R('grama3'), rgb('#58983f'), 22, 4)
    T['grama_escura'] = capim(R('grama_e'), rgb('#3f7f3a'), 26, 5)
    T['mato_alto'] = lamina(R('mato'), rgb('#3f9a3a'))
    T['flores'] = flores(R('flores'), verde, [rgb('#e85a5a'), rgb('#f2d64a'), rgb('#f4f4f4'), rgb('#e88ad0')])
    T['flores_2'] = flores(R('flores2'), rgb('#62a84b'), [rgb('#f4f4f4'), rgb('#7aa8f0'), rgb('#f2a84a')])
    T['trilha'] = pontos(R('trilha'), rgb('#a58359'), rgb('#7d6240'), 7)
    T['trilha_2'] = pontos(R('trilha2'), rgb('#ad8b5f'), rgb('#cdae84'), 9)
    T['areia'] = pontos(R('areia'), rgb('#e8d49a'), rgb('#c9b074'), 8)
    T['areia_2'] = pontos(R('areia2'), rgb('#efdca6'), rgb('#d6c186'), 6)
    T['areia_molhada'] = pontos(R('areia_m'), rgb('#b89c64'), rgb('#8e7646'), 10)
    T['lama'] = pontos(R('lama'), rgb('#6e5236'), rgb('#4e3a24'), 12)
    T['praca'] = pedras(R('praca'), rgb('#c9bfa8'))
    T['praca_2'] = pedras(R('praca2'), rgb('#bdb49e'))
    T['quadra'] = azulejo(rgb('#4f9a6a'), rgb('#4a9262'), 8, None)
    T['quadra'].rect(0, 7, 16, 2, rgb('#f0f0e6'))
    T['milho'] = lamina(R('milho'), rgb('#c8b83a'))
    T['teia_chao'] = ruido(R('teia'), rgb('#7a8a6a'), 14)
    T['trepadeira'] = estratos(R('trep'), rgb('#5a6a4a'), [rgb('#5a6a4a'), rgb('#4a7a42'), rgb('#6a8a52')])
    T['ouro'] = pontos(R('ouro'), rgb('#d4aa3c'), rgb('#fff0a0'), 10)
    # --- água
    azul = rgb('#3b7fd8')
    T['agua_0'] = ondas(R('agua'), azul, rgb('#8cc0f4'), 7, 0)
    T['agua_1'] = ondas(R('agua'), azul, rgb('#8cc0f4'), 7, 1)
    T['agua_2'] = ondas(R('agua'), azul, rgb('#8cc0f4'), 7, 2)
    fundo = rgb('#2a5ab0')
    T['agua_funda_0'] = ondas(R('aguaf'), fundo, rgb('#5c96dc'), 5, 0)
    T['agua_funda_1'] = ondas(R('aguaf'), fundo, rgb('#5c96dc'), 5, 1)
    T['agua_rasa_0'] = ondas(R('aguar'), rgb('#6cb4e8'), rgb('#c0e4fa'), 6, 0)
    T['agua_rasa_1'] = ondas(R('aguar'), rgb('#6cb4e8'), rgb('#c0e4fa'), 6, 1)
    T['mare_0'] = ondas(R('mare'), rgb('#7cc4d8'), rgb('#d8f2f4'), 6, 0)
    T['mare_1'] = ondas(R('mare'), rgb('#7cc4d8'), rgb('#d8f2f4'), 6, 1)
    T['recife'] = pontos(R('recife'), rgb('#4aa0b0'), rgb('#e86a8a'), 10)
    T['junco'] = lamina(R('junco'), rgb('#6a9a4a'))
    T['mangue_lama'] = pontos(R('mangl'), rgb('#4e5a3a'), rgb('#6a7a4a'), 12)
    T['raizes'] = estratos(R('raiz'), rgb('#5a4028'), [rgb('#5a4028'), rgb('#6e5234'), rgb('#4a3420')])
    for d, nome in (('e', 'leste'), ('w', 'oeste'), ('n', 'norte'), ('s', 'sul')):
        for q in range(2):
            T['corrente_%s_%d' % (nome, q)] = setas(azul, rgb('#d8ecff'), d, q)
    # --- pedra, penhasco, caverna
    T['penhasco_topo'] = pontos(R('pen_t'), rgb('#9a8a6a'), rgb('#b8a888'), 8)
    T['penhasco_lado'] = estratos(R('pen_l'), rgb('#8a7658'), [rgb('#8a7658'), rgb('#9a8666'), rgb('#7a684c')])
    T['pedra_topo'] = pontos(R('ped_t'), rgb('#8e8e92'), rgb('#aeaeb2'), 8)
    T['pedra_lado'] = estratos(R('ped_l'), rgb('#7c7c84'), [rgb('#7c7c84'), rgb('#8c8c94'), rgb('#6e6e76')])
    T['caverna'] = pontos(R('cav'), rgb('#6a6258'), rgb('#4e473f'), 10)
    T['caverna_escura'] = pontos(R('cave'), rgb('#3a3640'), rgb('#26232c'), 10)
    T['porta_caverna'] = Tela(rgb('#1a1820'))
    T['porta_caverna'].rect(0, 0, 16, 2, rgb('#58504a'))
    T['porta_caverna'].rect(0, 0, 2, 16, rgb('#58504a'))
    T['porta_caverna'].rect(14, 0, 2, 16, rgb('#58504a'))
    T['cristal_chao'] = pontos(R('crc'), rgb('#4a4a78'), rgb('#9ac4ff'), 12)
    cl = Tela(rgb('#5a5a98'))
    cl.p = ruido(R('crl'), rgb('#5a5a98'), 14).p
    for x, y in ((3, 12), (8, 10), (12, 13)):
        for k in range(5):
            cl.set(x, y - k, claro(rgb('#9ac4ff'), .1 * k))
            cl.set(x + 1, y - k, rgb('#6a8ae0'))
    T['cristal_lado'] = cl
    T['cristal_topo'] = pontos(R('crt'), rgb('#6a6aa8'), rgb('#c8e4ff'), 10)
    T['trilho'] = Tela(rgb('#6a6258'))
    T['trilho'].p = pontos(R('tri'), rgb('#6a6258'), rgb('#4e473f'), 6).p
    for y in (4, 11):
        T['trilho'].rect(0, y, 16, 2, rgb('#8a8a92'))
        T['trilho'].rect(0, y + 2, 16, 1, rgb('#3a3a42'))
    for x in (1, 6, 11):
        T['trilho'].rect(x, 2, 3, 12, escuro(rgb('#6a4a2e'), .1))
        T['trilho'].rect(x, 4, 3, 2, rgb('#8a8a92'))
        T['trilho'].rect(x, 11, 3, 2, rgb('#8a8a92'))
    # --- neve e gelo
    T['neve'] = pontos(R('neve'), rgb('#f2f6fa'), rgb('#cfe0f0'), 8)
    T['neve_2'] = pontos(R('neve2'), rgb('#e8f0f8'), rgb('#ffffff'), 8)
    T['neve_funda'] = pontos(R('nevef'), rgb('#dce8f4'), rgb('#b8cde4'), 12)
    T['neve_alta'] = lamina(R('nevea'), rgb('#bcd4e8'))
    T['gelo'] = rachaduras(R('gelo'), rgb('#bfe6f6'), rgb('#e8fbff'), 2)
    T['gelo_congelado'] = rachaduras(R('geloc'), rgb('#9ed2ec'), rgb('#e8fbff'), 3)
    T['gelo_parede_topo'] = pontos(R('gpt'), rgb('#a8dcf0'), rgb('#e8fbff'), 8)
    T['gelo_parede_lado'] = estratos(R('gpl'), rgb('#8cc8e8'), [rgb('#8cc8e8'), rgb('#a8dcf0'), rgb('#78b8dc')])
    T['gelo_piso'] = azulejo(rgb('#cdeaf6'), rgb('#bfe2f2'), 8, rgb('#e8fbff'))
    # --- vulcão
    T['basalto'] = pontos(R('bas'), rgb('#4a4650'), rgb('#6a6672'), 10)
    T['cinza'] = pontos(R('cin'), rgb('#7a767c'), rgb('#9a969c'), 12)
    T['obsidiana'] = pontos(R('obs'), rgb('#26222e'), rgb('#6a5a98'), 6)
    lava = []
    for q in range(3):
        t = Tela(rgb('#e8541c'))
        r = R('lava')
        for _ in range(26):
            t.set(r.randrange(N), r.randrange(N), r.choice([rgb('#ffb02c'), rgb('#c43a14'), rgb('#ff8a24')]))
        for k in range(5):
            x = (k * 5 + q * 2) % N
            y = (k * 7 + q) % N
            t.rect(x, y, 3, 1, rgb('#ffe27a'))
        T['lava_%d' % q] = t
    T['fonte_quente_0'] = ondas(R('fq'), rgb('#4aa8c8'), rgb('#c8f4f4'), 6, 0)
    T['fonte_quente_1'] = ondas(R('fq'), rgb('#4aa8c8'), rgb('#c8f4f4'), 6, 1)
    T['lava_piso'] = azulejo(rgb('#5a3028'), rgb('#4e2a24'), 8, rgb('#e8541c'))
    T['lava_parede_topo'] = pontos(R('lpt'), rgb('#5a3a34'), rgb('#e8541c'), 6)
    T['lava_parede_lado'] = estratos(R('lpl'), rgb('#4a2e2a'), [rgb('#4a2e2a'), rgb('#5a3a34'), rgb('#e8541c'), rgb('#5a3a34')])
    # --- deserto e sertão
    T['duna'] = Tela(rgb('#e6c47a'))
    for y in range(N):
        for x in range(N):
            if (x + y * 2 + (y // 4) * 3) % 9 in (0, 1):
                T['duna'].set(x, y, rgb('#d2aa5c'))
    T['areia_movedica'] = ondas(R('mov'), rgb('#d8b46a'), rgb('#b4904a'), 6, 0)
    T['terra_rachada'] = rachaduras(R('terra'), rgb('#c89a64'), rgb('#7a5a38'), 3)
    T['canion_topo'] = pontos(R('cat'), rgb('#c8784a'), rgb('#e29a68'), 8)
    T['canion_lado'] = estratos(R('cal'), rgb('#b8643a'), [rgb('#b8643a'), rgb('#d08050'), rgb('#9a4e2e'), rgb('#e0a070')])
    T['caatinga'] = pontos(R('caat'), rgb('#b0a068'), rgb('#887848'), 12)
    T['mato_seco'] = lamina(R('seco'), rgb('#a89850'))
    T['sal'] = pontos(R('sal'), rgb('#f2f0ea'), rgb('#d8d4c8'), 8)
    T['sal_espelho'] = ondas(R('sale'), rgb('#e0ecf4'), rgb('#ffffff'), 4, 0)
    T['rocha_vermelha'] = pontos(R('rv'), rgb('#a8483a'), rgb('#c4685a'), 10)
    T['rio_seco'] = rachaduras(R('rseco'), rgb('#b8946a'), rgb('#7a5a38'), 2)
    # --- templos, ruínas, escadas
    T['templo_piso'] = azulejo(rgb('#cbbf9a'), rgb('#c0b48e'), 8, rgb('#a09670'))
    T['mosaico'] = Tela(rgb('#d8c88a'))
    for j in range(N):
        for i in range(N):
            if (abs(i - 7.5) + abs(j - 7.5)) % 6 < 2:
                T['mosaico'].set(i, j, rgb('#3a7a9a'))
            elif (abs(i - 7.5) + abs(j - 7.5)) % 6 < 3:
                T['mosaico'].set(i, j, rgb('#b8484a'))
    T['pedra_antiga'] = pedras(R('pant'), rgb('#8a8670'))
    T['templo_parede_topo'] = pedras(R('tpt'), rgb('#b4a888'))
    T['templo_parede_lado'] = tijolos(rgb('#a89c78'), rgb('#7a7056'), 4, 8, True, R('tpl'))
    T['escada'] = Tela(rgb('#b0a894'))
    for k in range(4):
        T['escada'].rect(0, k * 4, 16, 3, claro(rgb('#b0a894'), .12 * (k % 2) + .05))
        T['escada'].rect(0, k * 4 + 3, 16, 1, escuro(rgb('#b0a894'), .3))
    T['escada_sobe'] = T['escada']
    T['escada_desce'] = Tela(rgb('#6a665a'))
    for k in range(4):
        T['escada_desce'].rect(0, k * 4, 16, 3, escuro(rgb('#b0a894'), .25 + .06 * k))
        T['escada_desce'].rect(0, k * 4 + 3, 16, 1, escuro(rgb('#b0a894'), .45))
    T['buraco'] = Tela(rgb('#7a6a4e'))
    for j in range(N):
        for i in range(N):
            d = ((i - 7.5) ** 2 + (j - 7.5) ** 2) ** .5
            if d < 5:
                T['buraco'].set(i, j, rgb('#16131a'))
            elif d < 6.5:
                T['buraco'].set(i, j, rgb('#4e422e'))
    T['rachadura'] = rachaduras(R('rach'), rgb('#7a6a4e'), rgb('#26201a'), 3)
    T['vazio'] = Tela(rgb('#101014'))
    # --- construção
    T['ponte'] = tabuas(rgb('#b88a56'), R('ponte'))
    T['ponte_v'] = tabuas(rgb('#b88a56'), R('ponte'), 4, True)
    T['cais'] = tabuas(rgb('#8a6a46'), R('cais'))
    T['tapete'] = azulejo(rgb('#c4404a'), rgb('#b83a44'), 8, None)
    T['tapete'].rect(0, 0, 16, 1, rgb('#f0d070'))
    T['tapete'].rect(0, 15, 16, 1, rgb('#f0d070'))
    T['piso_escuro'] = azulejo(rgb('#4a4a58'), rgb('#42424e'), 8, rgb('#34343e'))
    T['piso_pedra'] = pedras(R('pp'), rgb('#9a9a9e'))
    for cor, hexa in (('vermelho', '#cd5a32'), ('azul', '#466ebe'), ('verde', '#4a9a52'), ('amarelo', '#d8a838'),
                      ('marrom', '#8a5a3a'), ('cinza', '#8a8e9a'), ('roxo', '#8a5ab0'), ('turquesa', '#3a9aa8'), ('rosa', '#d8708a')):
        T['telhado_' + cor] = telhado(rgb(hexa), R('tel' + cor))
    T['parede_creme_topo'] = Tela(rgb('#c8bca4'))
    T['parede_topo'] = pedras(R('pt'), rgb('#a8a49c'))
    for nome, base in (('creme', '#e8dec8'), ('branca', '#f0f2f5'), ('azul', '#7a9ad0'), ('rosa', '#e8b8b8'), ('verde', '#a8c8a0'),
                       ('amarela', '#e8d49a')):
        t = Tela(rgb(base))
        t.rect(0, 14, 16, 2, escuro(rgb(base), .12))
        t.rect(0, 0, 16, 1, claro(rgb(base), .12))
        r = R('par' + nome)
        for _ in range(10):
            t.set(r.randrange(16), r.randrange(13), r.choice([claro(rgb(base), .08), escuro(rgb(base), .08)]))
        T['parede_' + nome] = t
    T['parede_tijolo'] = tijolos(rgb('#b8603e'), rgb('#7a3a28'), 4, 8, True, R('pt'))
    T['parede_madeira'] = tabuas(rgb('#b88a5a'), R('pm'), 4)
    T['parede_pedra'] = pedras(R('ppe'), rgb('#9c9890'))
    T['parede_lab_cinza'] = tabuas(rgb('#d7dce4'), R('plc'), 8)
    T['janela_dia'] = janela(rgb('#8cc4f0'), rgb('#e8dec8'))
    T['janela_noite'] = janela(rgb('#8cc4f0'), rgb('#e8dec8'), True)
    T['janela_azul'] = janela(rgb('#9cd0f4'), rgb('#6a8ac8'))
    T['janela_madeira'] = janela(rgb('#8cc4f0'), rgb('#a8784a'), False, False)
    T['janela_redonda'] = janela(rgb('#9cd0f4'), rgb('#d8d0c0'), False, True)
    T['porta_madeira'] = porta(rgb('#9a6a3e'), R('pd'))
    T['porta_azul'] = porta(rgb('#466ebe'), R('pda'))
    T['porta_vidro'] = porta(rgb('#d8e0ec'), R('pdv'), rgb('#7ac0e8'))
    T['porta_centro'] = porta(rgb('#e8e0e0'), R('pdc'), rgb('#4a78d8'))
    T['porta_mercado'] = porta(rgb('#e8e0d0'), R('pdm'), rgb('#4a9ad8'))
    T['porta_ginasio'] = porta(rgb('#5a4a3a'), R('pdg'), None, rgb('#e8c050'))
    # --- árvores e arbustos
    T['copa_topo'] = folhagem(R('ctp'), rgb('#3f9a42'), True)
    T['copa_lado'] = folhagem(R('cls'), rgb('#3f9a42'))
    T['arbusto_topo'] = folhagem(R('abt'), rgb('#4aa84a'), True)
    T['arbusto_lado'] = folhagem(R('abs'), rgb('#4aa84a'))
    for _ in range(4):
        r = R('baga%d' % _)
        t = T['arbusto_lado']
        t.set(r.randrange(2, 14), r.randrange(2, 11), rgb('#e8484a'))
    T['copa_outono_topo'] = folhagem(R('cot'), rgb('#d8782a'), True)
    T['copa_outono_lado'] = folhagem(R('col'), rgb('#d8782a'))
    T['copa_neve_topo'] = folhagem(R('cnt'), rgb('#8ab4a0'), True)
    T['copa_neve_lado'] = folhagem(R('cnl'), rgb('#8ab4a0'))
    T['copa_palmeira_lado'] = folhagem(R('cpl'), rgb('#5ab04a'))
    T['tronco_lado'] = casca(R('tronco'), rgb('#7a5636'))
    T['tronco_topo'] = aneis(rgb('#c8a26a'))
    T['tronco_claro_lado'] = casca(R('troncoc'), rgb('#b8a88a'))
    T['tronco_branco_lado'] = casca(R('troncob'), rgb('#d8d4c8'))
    # --- papel de parede, tapete e afins de interior (16 px)
    T['piso_madeira_claro'] = tabuas(rgb('#c8965e'), R('pmc'), 4)
    T['piso_hospital'] = azulejo(rgb('#f4e8e8'), rgb('#f0dada'), 8, rgb('#d8c4c4'))
    T['piso_mercado'] = azulejo(rgb('#8cb0e8'), rgb('#7ca2e0'), 8, rgb('#6a92d0'))
    T['bancada'] = tabuas(rgb('#a8784a'), R('banc'), 8)
    T['livros'] = Tela(rgb('#8a5a32'))
    cores = ['#c8484a', '#4a78c8', '#e8c050', '#4aa86a', '#e8e0d0', '#8a5ab0']
    for i in range(0, 16, 2):
        T['livros'].rect(i, 1, 2, 6, rgb(cores[(i // 2) % 6]))
        T['livros'].rect(i, 9, 2, 6, rgb(cores[(i // 2 + 3) % 6]))
    return T


# ------------------------------------------------------------------ demo e mapeamento
DEMO_16 = {'grama': 'ground_grass', 'trilha': 'ground_path', 'telhado_vermelho': 'roof', 'telhado_azul': 'roof_blue',
           'parede_creme': 'wall', 'parede_lab': 'wall_lab', 'piso_madeira': 'floor_wood', 'piso_azulejo': 'floor_tile',
           'cerca': 'fence', 'lamina_mato': 'grass_blade', 'papel_parede': 'wallpaper'}

# tile (nome do TILE em src/world/tiles.js) -> {topo, lado?, anim?, altura?}
TIPOS = {
    'grass': ('grama', None, None), 'grass2': ('grama_2', None, None), 'tall': ('mato_alto', None, None),
    'path': ('trilha', None, None), 'water': ('agua_0', None, ['agua_0', 'agua_1', 'agua_2']),
    'sand': ('areia', None, None), 'flowers': ('flores', None, None),
    'deep': ('agua_funda_0', None, ['agua_funda_0', 'agua_funda_1']),
    'cliff': ('penhasco_topo', 'penhasco_lado', None), 'void': ('vazio', None, None), 'stairs': ('escada', None, None),
    'bridge': ('ponte', None, None), 'plaza': ('praca', None, None), 'floor': ('piso_madeira', None, None),
    'wall': ('parede_topo', 'parede_creme', None), 'forest': ('copa_topo', 'copa_lado', None), 'court': ('quadra', None, None),
    'dark': ('piso_escuro', None, None), 'tilefloor': ('piso_azulejo', None, None), 'mat': ('tapete', None, None),
    'bridgev': ('ponte_v', None, None), 'cave': ('caverna', None, None), 'rock': ('pedra_topo', 'pedra_lado', None),
    'cavedoor': ('porta_caverna', None, None), 'gold': ('ouro', None, None), 'mud': ('lama', None, None),
    'corn': ('milho', None, None), 'climb': ('trepadeira', None, None), 'webg': ('teia_chao', None, None),
    'webs': ('teia_chao', None, None), 'snow': ('neve', None, None), 'dock': ('cais', None, None),
    'snowfield': ('neve_2', None, None), 'deepsnow': ('neve_funda', None, None), 'ice': ('gelo', None, None),
    'frozen': ('gelo_congelado', None, None), 'icewall': ('gelo_parede_topo', 'gelo_parede_lado', None),
    'icefloor': ('gelo_piso', None, None), 'tallsnow': ('neve_alta', None, None),
    'basalt': ('basalto', None, None), 'ash': ('cinza', None, None),
    'lava': ('lava_0', None, ['lava_0', 'lava_1', 'lava_2']), 'obsidian': ('obsidiana', None, None),
    'hotspring': ('fonte_quente_0', None, ['fonte_quente_0', 'fonte_quente_1']), 'lavafloor': ('lava_piso', None, None),
    'lavawall': ('lava_parede_topo', 'lava_parede_lado', None),
    'dune': ('duna', None, None), 'quicksand': ('areia_movedica', None, None), 'cracked': ('terra_rachada', None, None),
    'canyon': ('canion_topo', 'canion_lado', None), 'caatinga': ('caatinga', None, None), 'talldry': ('mato_seco', None, None),
    'wetsand': ('areia_molhada', None, None), 'tide': ('mare_0', None, ['mare_0', 'mare_1']), 'roots': ('raizes', None, None),
    'mangmud': ('mangue_lama', None, None), 'reef': ('recife', None, None),
    'cur_e': ('corrente_leste_0', None, ['corrente_leste_0', 'corrente_leste_1']),
    'cur_w': ('corrente_oeste_0', None, ['corrente_oeste_0', 'corrente_oeste_1']),
    'cur_n': ('corrente_norte_0', None, ['corrente_norte_0', 'corrente_norte_1']),
    'cur_s': ('corrente_sul_0', None, ['corrente_sul_0', 'corrente_sul_1']),
    'templefloor': ('templo_piso', None, None), 'mosaic': ('mosaico', None, None), 'oldstone': ('pedra_antiga', None, None),
    'templewall': ('templo_parede_topo', 'templo_parede_lado', None), 'stairup': ('escada_sobe', None, None),
    'stairdown': ('escada_desce', None, None), 'hole': ('buraco', None, None), 'crack': ('rachadura', None, None),
    'darkcave': ('caverna_escura', None, None), 'crystalfloor': ('cristal_chao', None, None),
    'crystalwall': ('cristal_topo', 'cristal_lado', None), 'rail': ('trilho', None, None),
    'salt': ('sal', None, None), 'saltmirror': ('sal_espelho', None, None), 'redrock': ('rocha_vermelha', None, None),
    'dryriver': ('rio_seco', None, None), 'shallow': ('agua_rasa_0', None, ['agua_rasa_0', 'agua_rasa_1']),
    'reed': ('junco', None, None),
}
# altura em blocos (0 = chão) das paredes, sugestão para o 3D
ALTURA = {'cliff': 1.0, 'wall': 1.5, 'forest': 1.5, 'rock': 1.0, 'icewall': 1.0, 'lavawall': 1.0, 'canyon': 1.0,
          'templewall': 1.2, 'crystalwall': 1.0}


def le_tiles():
    """TILE de src/world/tiles.js (nome minúsculo -> id), lido do texto (sem importar pixi)."""
    import re
    s = open(os.path.join(RAIZ, 'src', 'world', 'tiles.js'), encoding='utf-8').read()
    bloco = s[s.index('export const TILE = {'):s.index('};', s.index('export const TILE = {'))]
    return {k.lower(): int(v) for k, v in re.findall(r'([A-Z0-9_]+):\s*(\d+)', bloco)}


def main():
    os.makedirs(os.path.join(SAIDA, 'interior'), exist_ok=True)
    telas = desenha_todas()
    imgs = {}
    for nome, t in telas.items():
        imgs[nome] = t.img()
    # texturas do demo substituem as nossas de mesmo nome
    for nosso, dem in DEMO_16.items():
        imgs[nosso] = Image.open(os.path.join(DEMO, dem + '.webp')).convert('RGBA')
    # variantes derivadas do demo (mesma paleta): telhados e paredes de outras cores ficam como desenhados acima
    ordem = list(imgs.keys())
    cols = 16
    linhas = (len(ordem) + cols - 1) // cols
    atlas = Image.new('RGBA', (cols * N, linhas * N), (0, 0, 0, 0))
    tex = {}
    W, H = atlas.size
    for k, nome in enumerate(ordem):
        x, y = (k % cols) * N, (k // cols) * N
        atlas.paste(imgs[nome], (x, y))
        e = .5  # recuo de meio texel: sem vazamento entre vizinhos com filtro nearest
        tex[nome] = {'x': x, 'y': y, 'u0': round((x + e) / W, 6), 'v0': round(1 - (y + N - e) / H, 6),
                     'u1': round((x + N - e) / W, 6), 'v1': round(1 - (y + e) / H, 6)}
    atlas.save(os.path.join(SAIDA, 'atlas.png'), optimize=True)
    ids = le_tiles()
    tipos = {}
    for nome, (topo, lado, anim) in TIPOS.items():
        for ref in (topo, lado, *(anim or [])):
            assert ref is None or ref in tex, (nome, ref)
        e = {'id': ids.get(nome), 'topo': topo}
        if lado:
            e['lado'] = lado
        if anim:
            e['anim'] = anim
        if nome in ALTURA:
            e['altura'] = ALTURA[nome]
        tipos[nome] = e
    sem = [n for n in ids if n not in tipos]
    # interior do demo (32 e 64 px) e o resto do demo que não é bloco
    interior = {}
    for f in sorted(os.listdir(os.path.join(DEMO, 'interior'))):
        if f.endswith('.webp'):
            shutil.copyfile(os.path.join(DEMO, 'interior', f), os.path.join(SAIDA, 'interior', f))
            interior[f[:-5]] = 'interior/' + f
    json.dump({'versao': 1, 'celula': N, 'colunas': cols, 'linhas': linhas, 'tamanho': [W, H], 'tex': tex, 'tipos': tipos,
               'interior': interior,
               'demo': sorted(DEMO_16.keys()),
               'nota': 'UV com origem embaixo (convencao do three.js, flipY). Filtro nearest, sem mipmaps. anim = quadros de agua/lava para trocar a ~4 fps.'},
              open(os.path.join(SAIDA, 'indice.json'), 'w'), indent=1, ensure_ascii=False)
    print('texturas: %d no atlas %dx%d; tipos de bloco: %d; sem tipo: %s' % (len(tex), W, H, len(tipos), sem))


if __name__ == '__main__':
    main()
