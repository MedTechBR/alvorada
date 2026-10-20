# Junta capturas numa folha (2 colunas) para revisar de uma vez: python3 tools/vestir/folha.py saida.jpg a.jpg b.jpg ...
import sys
from PIL import Image, ImageDraw
out, fs = sys.argv[1], sys.argv[2:]
ims = [Image.open(f) for f in fs]
w, h = 844 // 2 * 1, 390 // 2 * 1
cols = 2; rows = (len(ims) + 1) // 2
S = Image.new('RGB', (cols * w, rows * h), 'black')
for i, (f, im) in enumerate(zip(fs, ims)):
    t = im.resize((w, h)); d = ImageDraw.Draw(t); d.text((6, h - 14), f.split('/')[-1], fill='yellow')
    S.paste(t, ((i % cols) * w, (i // cols) * h))
S.save(out, quality=85)
