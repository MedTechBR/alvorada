#!/usr/bin/env python3
"""Empacota a arte original da amostra, sem pintar quadros intermediários."""
import argparse
import json
from pathlib import Path
from PIL import Image

def recorte(imagem, caixa):
    p = imagem.crop(caixa).convert('RGBA')
    # A ferramenta gera uma franja de alfa quase nulo fora dos desenhos.
    a = p.getchannel('A').point(lambda n: 0 if n < 128 else 255)
    p.putalpha(a)
    b = a.point(lambda n: 255 if n >= 48 else 0).getbbox()
    if not b:
        raise ValueError('Recorte sem desenho: ' + str(caixa))
    return p.crop(b)

def preparar(treinador, objetos, terrenos, destino, moradores=None):
    destino.mkdir(parents=True, exist_ok=True)
    h = Image.open(treinador)
    folha = Image.new('RGBA', (200, 208))
    recortes = [[recorte(h, (x*256,y*256,(x+1)*256,(y+1)*256)) for x in range(6)] for y in range(4)]
    escala = 48 / max(p.height for row in recortes for p in row)
    for y,row in enumerate(recortes):
        for x,p in enumerate([row[j] for j in [0,1,2,3,5]]):
            p = p.resize((round(p.width*escala), round(p.height*escala)), Image.Resampling.NEAREST)
            folha.paste(p, (x*40+(40-p.width)//2,y*52+50-p.height))
    folha.save(destino/'treinador.png', optimize=True)
    o = Image.open(objetos)
    caixas = [(0,0,465,558),(465,0,835,558),(835,0,1260,558),(1260,0,1536,558),(0,558,448,1024),(448,558,890,1024),(890,558,1240,1024),(1240,558,1536,1024)]
    nomes = ['centro','loja','casa','farol','palmeira','canteiro','fonte','poste']
    atlas = Image.new('RGBA',(640,448)); frames = {}
    for i,(nome,caixa) in enumerate(zip(nomes,caixas)):
        p = recorte(o,caixa)
        k = min(144/p.width,208/p.height)
        p = p.resize((round(p.width*k),round(p.height*k)), Image.Resampling.NEAREST)
        x = (i%4)*160+(160-p.width)//2; y = (i//4)*224+216-p.height
        atlas.paste(p,(x,y)); frames[nome] = [x,y,p.width,p.height]
    atlas.save(destino/'objetos.png',optimize=True)
    t = Image.open(terrenos).convert('RGB'); piso = Image.new('RGB',(512,256))
    for y in range(2):
        for x in range(4):
            p=t.crop((round(x*t.width/4),round(y*t.height/2),round((x+1)*t.width/4),round((y+1)*t.height/2)))
            piso.paste(p.resize((128,128),Image.Resampling.NEAREST),(x*128,y*128))
    piso.save(destino/'terrenos.png',optimize=True)
    dados={'frames':frames,'objetos':[640,448],'terrenos':[512,256]}
    (destino/'atlas.json').write_text(json.dumps(dados,ensure_ascii=False,indent=2)+'\n')
    (destino/'treinador.json').write_text(json.dumps({'fw':40,'fh':52,'pe':49,'altura':48,'direcoes':['down','up','left','right'],'colunas':5,'andar':[0,1,2,3],'parado':4,'corridaExclusiva':False},ensure_ascii=False,indent=2)+'\n')
    if moradores:
        im=Image.open(moradores)
        # A folha original tem separação desigual entre linhas: usa os vãos transparentes reais.
        ys=[0,232,444,652,861,1060,1248,1431,1586]
        for n,nome in enumerate(['marinheiro','pescador']):
            f=Image.new('RGBA',(200,208))
            for y in range(4):
                for x in range(5):
                    p=recorte(im,(round(x*im.width/5),ys[n*4+y],round((x+1)*im.width/5),ys[n*4+y+1]))
                    k=min(48/p.height,36/p.width)
                    p=p.resize((round(p.width*k),round(p.height*k)),Image.Resampling.NEAREST)
                    f.paste(p,(x*40+(40-p.width)//2,y*52+50-p.height))
            f.save(destino/(nome+'.png'),optimize=True)
    print('Arte preparada:',destino)

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('treinador');p.add_argument('objetos');p.add_argument('terrenos');p.add_argument('--moradores');p.add_argument('--destino',type=Path,default=Path('assets/coral-aventura'))
    a=p.parse_args();preparar(a.treinador,a.objetos,a.terrenos,a.destino,a.moradores)
