# Junta a captura da demo e a referência lado a lado (tools/shots/<saida>.jpg). Só para desenvolvimento.
#   python3 tools/teste-3d/lado-a-lado.py tools/shots/ambiente-v5.jpg <referencia.jpg> ambiente-lado-v5
import sys
from PIL import Image, ImageDraw
a, b, out = sys.argv[1], sys.argv[2], sys.argv[3]
A = Image.open(a).convert('RGB').resize((960, 540)); B = Image.open(b).convert('RGB').resize((960, 540))
W = Image.new('RGB', (1920, 560), (20, 20, 20)); W.paste(A, (0, 20)); W.paste(B, (960, 20))
d = ImageDraw.Draw(W); d.text((8, 4), 'demo (nossa)', fill=(255, 255, 255)); d.text((968, 4), 'referencia', fill=(255, 255, 255))
W.save(f'tools/shots/{out}.jpg', quality=88)
