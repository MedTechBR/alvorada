"""Regressão dos recortes de pedra: transparência, corpo visível e nenhuma base de água."""
import json
import hashlib
from pathlib import Path
from PIL import Image
raiz = Path(__file__).resolve().parents[2]
indice = json.loads((raiz / 'assets/firered/indice.json').read_text())
imagem = Image.open(raiz / 'assets/firered/objetos.png').convert('RGBA')
assert indice['versaoObjetos']==hashlib.sha256((raiz/'assets/firered/objetos.png').read_bytes()).hexdigest()[:16],'índice e imagem de versões diferentes'
for nome in ('pedra', 'rochedo'):
    x, y, w, h = indice['objetos'][nome]
    recorte = imagem.crop((x, y, x+w, y+h))
    pixels = list(recorte.get_flattened_data())
    assert pixels[0][3] == 0 and pixels[-1][3] == 0, nome + ': base quadrada opaca'
    assert sum(a > 0 for r, g, b, a in pixels) > w*h/4, nome + ': corpo invisível'
    assert not any(a and b > r+32 and b > g+16 for r, g, b, a in pixels), nome + ': base de água'
    print('OK:', nome, f'{w}x{h}, corpo visível e contorno transparente')
for nome in ('arvore','arvore_grande','vaso'):
    x,y,w,h=indice['objetos'][nome];r=imagem.crop((x,y,x+w,y+h))
    assert r.getpixel((0,0))[3]==0 and r.getpixel((w-1,h-1))[3]==0,nome+': fundo preso ao recorte'
    if nome.startswith('arvore'):
        assert (w,h)==(32,48),nome+': copa remontada com largura incorreta'
        assert all(any(r.getpixel((x,y))[3] for x in range(w))for y in range(3,46)),nome+': faixa vazia no corpo'
    print('OK:',nome,'inteiro, separado e com fundo transparente')
