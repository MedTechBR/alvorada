"""Galeria de capturas reais do acabamento compartilhado, no tamanho do celular."""
from pathlib import Path
from html import escape
from PIL import Image
raiz=Path(__file__).resolve().parents[1]
pasta=raiz/'tools/shots/visual-restante'
cenas=[('campina','Campina','Serviços próximos e a interface compartilhada.'),('sussurro','Sussurro','Arquitetura da mata preservada; mesma câmera e personagens originais.'),('geada','Geada','Neve e construções regionais continuam reconhecíveis.'),('mandacaru','Mandacaru','Materiais do sertão preservados.'),('gruta','Gruta de Lúmen','Circuito em duas alas, lago e recompensa única.'),('mata','Clareira das Raízes','Duas pontes sobre o riacho e pomar na volta.'),('ruina','Ruína do Pomar','Alavanca abre a alcova; a saída permanece livre.'),('casa','Casa','Mesmo enquadramento e controles nos interiores.'),('centro','Centro Pokémon','Serviços e interações originais.'),('ginasio','Ginásio do Farol','O puzzle e a campanha permanecem; apresentação compartilhada.'),('ocaso','Terras do Ocaso','Troca de continente com o mesmo compositor.')]
cards=[]
for nome,titulo,desc in cenas:
 p=pasta/(nome+'.jpg')
 if not p.exists(): continue
 Image.open(p).resize((844,390),Image.Resampling.LANCZOS).save(pasta/(nome+'-844.jpg'),quality=91)
 cards.append(f'<article><h2>{escape(titulo)}</h2><p>{escape(desc)}</p><a href="{nome}.jpg"><img src="{nome}-844.jpg" width="844" height="390" loading="lazy" alt="{escape(titulo)} — captura real do jogo"></a></article>')
html='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alvorada — apresentação compartilhada</title><style>*{box-sizing:border-box}body{margin:0;background:#102a32;color:#f6edd7;font:16px/1.5 system-ui}header,main{max-width:1400px;margin:auto;padding:24px}h1{font-size:32px;margin:0}header p{max-width:800px;color:#bfd1c7}nav a{color:#f5d99a;margin-right:20px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:30px}article h2{margin:0;font-size:23px}article p{color:#bfd1c7;margin:6px 0 12px}img{width:100%;height:auto;display:block;border:1px solid #608075;border-radius:8px}small{display:block;color:#bfd1c7;margin-top:18px}@media(max-width:900px){main{grid-template-columns:1fr}}</style><header><h1>Pokémon Alvorada</h1><p>Capturas reais em 844×390. Câmera, interface e apresentação compartilhadas; humanos nos sprites originais. As peças regionais e os materiais dos biomas são preservados.</p><nav><a href="/?teste&nosw&ir=1033,1181">Jogar em Coral</a><a href="/?teste&nosw&ir=776,1056">Explorar a gruta</a><a href="../cidades-compactas/">Cidades: antes × depois</a></nav><small>Versão local para revisão. O acervo de arte ainda combina peças novas e anteriores; estas fotos não representam um redesenho de cada objeto.</small></header><main>'''+''.join(cards)+'</main></html>'
(pasta/'index.html').write_text(html)
print('Galeria:',pasta/'index.html',f'({len(cards)} cenas)')
