"""Monta a galeria a partir das capturas reais, sem alterar o conteúdo do jogo."""
import json
from pathlib import Path
from PIL import Image, ImageDraw

raiz = Path(__file__).resolve().parents[1]
pasta = raiz / 'tools/shots/cidades-compactas'
resultados = raiz / 'tools/resultados/cidades-compactas'
nomes = {'centro': 'Coral: serviços', 'bairro': 'Coral: bairro', 'orla': 'Coral: orla',
         'sussurro': 'Sussurro', 'campina': 'Campina'}
for nome in nomes:
    imagens = []
    for etapa in ['antes', 'depois']:
        imagem = Image.open(pasta / f'{nome}-{etapa}.jpg').resize((844, 390), Image.Resampling.LANCZOS)
        imagem.save(pasta / f'{nome}-{etapa}-844.jpg', quality=90)
        imagens.append(imagem)
    comparacao = Image.new('RGB', (1688, 424), '#10222d')
    comparacao.paste(imagens[0], (0, 34))
    comparacao.paste(imagens[1], (844, 34))
    desenho = ImageDraw.Draw(comparacao)
    desenho.text((16, 11), 'ANTES', fill='white')
    desenho.text((860, 11), 'DEPOIS', fill='white')
    comparacao.save(pasta / f'{nome}-comparacao.jpg', quality=90)

atual = json.loads((resultados / 'distancias.json').read_text())[-1]
x, y = atual['percursos']['chegada']['alvo']
html = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cidades compactas — Alvorada</title><style>*{box-sizing:border-box}body{margin:0;background:#10222d;color:#edf3ed;font:16px/1.55 system-ui}main{max-width:1760px;margin:auto;padding:24px}h1{font-size:clamp(26px,4vw,42px);margin:0}p{max-width:900px;color:#c4d4db}section{margin:40px 0}h2{font-size:22px}img{display:block;width:100%;height:auto;border-radius:8px}a{color:#a7e6cf}.grade{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}figcaption{margin:0 0 8px;font-weight:650}table{border-collapse:collapse}td,th{padding:10px 18px 10px 0;text-align:left;border-bottom:1px solid #36505a}@media(max-width:750px){.grade{grid-template-columns:1fr}main{padding:16px}}</style><main><h1>Cidades próximas e rotas mais curtas</h1><p>Capturas reais do jogo em 844 × 390, DPR 2. A comparação usa a mesma posição relativa ao bairro ou à porta do Centro. Os prédios, personagens e interiores mantêm o tamanho; a revisão aproxima os destinos e encurta os trechos esticados do continente.</p>'''
html += f'<p><a href="/index.html?teste&nosw&ir={x},{y}">Explorar Coral no jogo</a> · <a href="/docs/cidades-compactas.md">Relatório e testes</a></p>'
html += '<table><tr><th>Rota terrestre</th><th>Antes</th><th>Depois</th></tr>'
for rota in json.loads((resultados / 'rotas-comparacao.json').read_text()):
    html += f'<tr><td>{rota["rota"]}</td><td>{rota["antes"]} blocos</td><td>{rota["depois"]} blocos</td></tr>'
html += '</table>'
for nome, titulo in nomes.items():
    html += f'<section><h2>{titulo}</h2><div class="grade">'
    for etapa in ['antes', 'depois']:
        arquivo = f'{nome}-{etapa}-844.jpg'
        html += f'<figure><figcaption>{etapa.capitalize()}</figcaption><a href="{arquivo}"><img src="{arquivo}" alt="{titulo}, {etapa}" width="844" height="390" loading="lazy"></a></figure>'
    html += '</div></section>'
(pasta / 'index.html').write_text(html + '</main></html>')
