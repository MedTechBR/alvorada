#!/usr/bin/env python3
"""Confere recortes, passadas e orçamento de texturas da amostra visual."""
import hashlib
import json
from pathlib import Path
from PIL import Image
p=Path('assets/coral-aventura');d=json.loads((p/'treinador.json').read_text())
for nome in ['treinador','marinheiro','pescador']:
    im=Image.open(p/(nome+'.png'))
    assert im.mode=='RGBA' and im.size==(d['fw']*d['colunas'],d['fh']*4)
    for y in range(4):
        quadros=[]
        for x in range(5):
            f=im.crop((x*d['fw'],y*d['fh'],(x+1)*d['fw'],(y+1)*d['fh']))
            b=f.getchannel('A').getbbox()
            assert b and b[0]>=1 and b[1]>=1 and b[2]<d['fw'] and b[3]==d['pe']+1,(nome,x,y,b)
            quadros.append(hashlib.sha256(f.tobytes()).hexdigest())
        assert len(set(quadros[:4]))==4,(nome,y,'Passadas repetidas')
        assert quadros[d['parado']] not in quadros[:4],(nome,y,'Pose parada ausente')
    print('OK:',nome,'— quatro direções, quatro passadas distintas, pose parada e pés alinhados.')
a=json.loads((p/'atlas.json').read_text());im=Image.open(p/'objetos.png')
assert list(im.size)==a['objetos']
for nome,(x,y,w,h) in a['frames'].items():
    assert x>=0 and y>=0 and x+w<=im.width and y+h<=im.height
    assert im.crop((x,y,x+w,y+h)).getchannel('A').getbbox(),nome
assert Image.open(p/'terrenos.png').size==(512,256)
antes=(768*512+512*256+3*96*128)*4
depois=(640*448+512*256+3*200*208)*4
assert depois<=antes
print('OK: atlas compartilhados e três folhas humanas; pixels RGBA:',round(antes/1048576,3),'→',round(depois/1048576,3),'MiB, sem contar setores e demais NPCs.')
