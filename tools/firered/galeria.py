"""Organiza fotos reais do navegador em 844×390, sem simular telas do jogo."""
from pathlib import Path
from PIL import Image

raiz = Path(__file__).resolve().parents[2]
pasta = raiz / 'tools/shots/firered'
cenas = [('coral', 'Cidade Coral'), ('campina', 'Cidade Campina'), ('rota', 'Rota'),
         ('alvorada', 'Laboratório'), ('sussurro', 'Sussurro'), ('geada', 'Geada'),
         ('mandacaru', 'Mandacaru'), ('casa', 'Casa'), ('centro', 'Centro Pokémon'),
         ('ginasio', 'Ginásio do Farol'), ('gruta', 'Gruta'), ('mata', 'Mata'),
         ('ruina', 'Ruína'), ('ocaso', 'Ocaso'), ('montaria-terra', 'Montaria terrestre'),
         ('montaria-agua', 'Montaria de água'), ('combate', 'Combate preservado'),
         ('mapa-detalhado', 'Mapa detalhado')]

def imagem(nome):
    origem = pasta / (nome + '.jpg')
    if not origem.exists():
        return None
    destino = nome + '-844.jpg'
    with Image.open(origem) as im:
        im.resize((844, 390), Image.Resampling.NEAREST).save(pasta / destino, quality=94)
    return destino

pares, fotos = [], []
for nome, titulo in cenas:
    antes, depois = imagem('antes-' + nome), imagem('depois-' + nome)
    if antes and depois:
        pares.append(f'<section><h2>{titulo}</h2><div class="par"><figure><figcaption>Antes</figcaption><img src="{antes}" alt="{titulo} antes"></figure><figure><figcaption>FireRed</figcaption><img src="{depois}" alt="{titulo} com arte FireRed"></figure></div></section>')
    arq = imagem(nome)
    if arq:
        fotos.append(f'<figure><figcaption>{titulo}</figcaption><img loading="lazy" src="{arq}" alt="{titulo} no jogo"></figure>')

html = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alvorada — exploração FireRed</title>
<style>*{box-sizing:border-box}body{margin:0;background:#15262c;color:#f8f7e4;font:16px/1.5 system-ui,sans-serif}main{max-width:1740px;margin:auto;padding:24px}h1{font-size:30px;margin:0 0 8px}h2{font-size:22px}p{max-width:860px}a{color:#c6f49b}nav{display:flex;gap:24px;margin:20px 0 32px}figure{margin:0}figcaption{padding:8px 0;color:#d5dfd5}img{display:block;width:100%;height:auto;image-rendering:pixelated;background:#000;border:1px solid #607570}.par,.fotos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}section{margin-bottom:32px}@media(max-width:900px){.par,.fotos{grid-template-columns:1fr}main{padding:14px}}</style>
<main><h1>Pokémon Alvorada · FireRed</h1><p>Fotos reais do jogo em 844×390. A exploração usa os blocos e personagens de FireRed, com câmera 2D fixa. As arenas continuam com o combate atual em tempo real.</p><nav><a href="/?teste&amp;nosw">Jogar esta versão local</a><a href="#cenas">Explorar as cenas</a></nav>
'''
html += ''.join(pares) + '<h2 id="cenas">Cidades, interiores e gameplay</h2><div class="fotos">' + ''.join(fotos) + '</div></main></html>'
(pasta / 'index.html').write_text(html)
print('Galeria:', pasta / 'index.html')
