"""Recompacta PNG sem perder nenhum pixel: se a imagem tem até 256 cores (contando a transparência), vira PNG
de paleta (8 bits ou menos por pixel, com a transparência de cada cor); senão, só recomprime. Confere pixel a
pixel antes de aceitar e só fica com o resultado se ele for menor.

    python3 -I tools/png_sem_perda.py <arquivo.png> [...]      (ou importado: otimizar(bytes) -> bytes)
"""
import io
import sys
from PIL import Image


def _rgba(b):
    im = Image.open(io.BytesIO(b))
    im.load()
    return im.convert('RGBA')


def otimizar(b):
    im = _rgba(b)
    cands = []
    cores = im.getcolors(256)
    if cores is not None:
        # transparência total vira uma cor só (o valor RGB por baixo de alfa 0 não aparece)
        px = im.tobytes()
        pal, idx = [], {}
        out = bytearray(len(px) // 4)
        for i in range(0, len(px), 4):
            c = px[i:i + 4]
            if c[3] == 0:
                c = b'\0\0\0\0'
            k = idx.get(c)
            if k is None:
                k = idx[c] = len(pal)
                pal.append(c)
            out[i // 4] = k
        if len(pal) <= 256:
            p = Image.frombytes('P', im.size, bytes(out))
            p.putpalette(b''.join(c[:3] for c in pal), rawmode='RGB')
            alfa = bytes(c[3] for c in pal)
            o = io.BytesIO()
            bits = 1 if len(pal) <= 2 else 2 if len(pal) <= 4 else 4 if len(pal) <= 16 else 8
            p.save(o, 'PNG', optimize=True, transparency=alfa, bits=bits)
            cands.append(o.getvalue())
    o = io.BytesIO()
    im.save(o, 'PNG', optimize=True)
    cands.append(o.getvalue())
    ref = _zera(im)
    melhor = b
    for c in sorted(cands, key=len):
        if len(c) >= len(melhor):
            break
        if _zera(_rgba(c)) == ref:
            melhor = c
            break
    return melhor


def _zera(im):
    # pixels com alfa 0 contam como (0, 0, 0, 0): a cor escondida por baixo não aparece em lugar nenhum
    base = Image.new('RGBA', im.size, (0, 0, 0, 0))
    base.paste(im, mask=im.getchannel('A').point(lambda v: 255 if v else 0))
    return base.tobytes()


if __name__ == '__main__':
    antes = depois = 0
    for f in sys.argv[1:]:
        b = open(f, 'rb').read()
        n = otimizar(b)
        antes += len(b)
        depois += len(n)
        if len(n) < len(b):
            open(f, 'wb').write(n)
    print(f'{len(sys.argv) - 1} arquivos: {antes} -> {depois} bytes')
