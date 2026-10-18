# Recorta e amplia um pedaço de uma captura de tools/shots (para revisar a vitrine): recorte.py nome x0 y0 x1 y1 saida
import sys
from PIL import Image
n, x0, y0, x1, y1, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
im = Image.open(f'tools/shots/{n}.jpg').crop((x0, y0, x1, y1))
k = max(1, min(3, 1800 // im.width))
im.resize((im.width * k, im.height * k), Image.NEAREST).save(out)
