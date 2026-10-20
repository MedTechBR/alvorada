# Antes (esquerda) x depois (direita), uma linha por lugar: python3 tools/vestir/lado.py saida.jpg nome1 nome2 ...
import sys
from PIL import Image, ImageDraw
out, nomes = sys.argv[1], sys.argv[2:]
w, h = 422, 195
S = Image.new('RGB', (2 * w, len(nomes) * h), 'black')
for i, n in enumerate(nomes):
    for j, pref in enumerate(['antes', 'depois']):
        im = Image.open(f'tools/shots/{pref}-{n}.jpg').resize((w, h)); d = ImageDraw.Draw(im); d.text((6, h - 14), f'{pref} {n}', fill='yellow')
        S.paste(im, (j * w, i * h))
S.save(out, quality=85)
