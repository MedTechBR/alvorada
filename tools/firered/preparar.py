"""Monta os atlas GBA sem redesenhar pixels. Usa as peças e paletas da revisão indicada.
Cache das fontes: FIRERED_CACHE (padrão /tmp/alvorada-firered).
As matrizes de objetos só recompõem metatiles de 16 px; não usam os mapas de Kanto.
"""
from PIL import Image,ImageDraw
from pathlib import Path
import struct,json,urllib.request,os,hashlib
root=Path(os.environ.get('FIRERED_CACHE','/tmp/alvorada-firered'));raw=root/'originais'
def pal(p):
 d=p.read_text().splitlines();return [tuple(map(int,l.split())) for l in d[3:19]]
def tileset(pri,sec):
 a=raw/'primary'/pri;b=raw/'secondary'/sec
 ia=Image.open(a/'tiles.png');ib=Image.open(b/'tiles.png')
 imgs=[ia,ib]; palettes=[pal((a if i<7 else b)/'palettes'/('%02d.pal'%i)) for i in range(16)]
 ma=(a/'metatiles.bin').read_bytes();mb=(b/'metatiles.bin').read_bytes(); metas=[ma[i:i+16] for i in range(0,len(ma),16)]+[mb[i:i+16] for i in range(0,len(mb),16)]
 out=[]
 for m in metas:
  cv=Image.new('RGBA',(16,16))
  for j,v in enumerate(struct.unpack('<8H',m)):
   idx=v&1023;p=v>>12;I=imgs[0] if idx<640 else imgs[1];n=idx if idx<640 else idx-640
   sx=(n%(I.width//8))*8;sy=(n//(I.width//8))*8
   for y in range(8):
    for x in range(8):
     xx=7-x if v&1024 else x; yy=7-y if v&2048 else y
     if sy+yy>=I.height:continue
     c=I.getpixel((sx+xx,sy+yy))&15
     if j>=4 and c==0:continue
     cv.putpixel(((j%2)*8+x,((j%4)//2)*8+y),(*palettes[p][c],255))
  out.append(cv)
 return out

RAIZ=Path(__file__).resolve().parents[2]
SAIDA=RAIZ/'assets/firered';SAIDA.mkdir(exist_ok=True)
BANCOS={'exterior':('general','pallet_town'),'caverna':('general','cave'),'interior':('building','generic_building_1'),'centro':('building','pokemon_center')}
ts={}
for nome,(p,s) in BANCOS.items():
 ts[nome]=tileset(p,s);im=Image.new('RGBA',(256,((len(ts[nome])+15)//16)*16))
 for i,t in enumerate(ts[nome]):im.paste(t,(i%16*16,i//16*16))
 im.save(SAIDA/(nome+'.png'),optimize=True)

# As peças com chão ao redor ficam transparentes no atlas de objetos.
# Remove apenas os minitiles que são exatamente chão; não retoca a arte.
fundo=set()
for idx in [0x001,0x008,0x009,0x010,0x011]:
 im=ts['exterior'][idx]
 for y in [0,8]:
  for x in [0,8]:fundo.add(im.crop((x,y,x+8,y+8)).tobytes())
def bloco(nome,i,limpo=False):
 im=ts[nome][i].copy()
 if limpo:
  for y in [0,8]:
   for x in [0,8]:
    if im.crop((x,y,x+8,y+8)).tobytes() in fundo:im.paste((0,0,0,0),(x,y,x+8,y+8))
 return im
def matriz(rows,banco='exterior',limpo=True):
 im=Image.new('RGBA',(max(map(len,rows))*16,len(rows)*16))
 for y,row in enumerate(rows):
  for x,i in enumerate(row):
   if i is not None:im.paste(bloco(banco,i,limpo),(x*16,y*16))
 return im
objetos={}
def por(nome,rows,banco='exterior'):objetos[nome]=matriz(rows,banco)
# Árvore isolada de Pewter: ponta, copa e tronco. As peças 0x014/0x015
# pertencem à sobreposição de uma mata, não ao topo de uma árvore avulsa.
por('arvore',[[0x00e,0x00f],[0x01e,0x01f],[0x024,0x025]])
objetos['arvore_grande']=objetos['arvore'].copy()
por('arbusto',[[0x005]])
por('flores',[[0x004]])
por('placa',[[0x002]])
por('cerca',[[0x284]])
por('cerca_madeira',[[0x0f1]])
por('pedra',[[0x2f5]],'caverna')
por('rochedo',[[0x2e6,0x2e7],[0x2ee,0x2ef]],'caverna')
por('casa',[[0x281,0x282,0x282,0x282,0x283],[0x289,0x28a,0x28a,0x28a,0x28b],[0x291,0x293,0x292,0x292,0x294],[0x298,0x29a,0x299,0x29b,0x29c],[0x2a0,0x2a2,0x2a3,0x2a1,0x2a4]])
por('centro',[[0x17b,0x17c,0x17d,0x17e,0x17f],[0x048,0x049,0x04a,0x04b,0x187],[0x050,0x051,0x052,0x053,0x18f],[0x058,0x059,0x05a,0x05b,0x197],[0x060,0x061,0x062,0x186,0x19f]])
por('loja',[[0x028,0x029,0x02a,0x02b],[0x030,0x031,0x032,0x033],[0x038,0x039,0x03a,0x03b],[0x040,0x041,0x062,0x063]])
por('ginasio',[[0x139]+[0x13a]*5+[0x13b],[0x141]+[0x142]*5+[0x143],[0x149]+[0x14a]*5+[0x14b],[0x150,0x151,0x152,0x153,0x154,0x155,0x156],[0x158,0x159,0x15a,0x15b,0x15c,0x15d,0x15e]])
por('laboratorio',[[0x2a8,0x2a9,0x2a9,0x2a9,0x2a9,0x2bd,0x2b5],[0x2b0,0x2b1,0x2b1,0x2b1,0x2b1,0x2b3,0x2b4],[0x2b8,0x2b9,0x2b9,0x2b9,0x2b9,0x2bb,0x2bc],[0x2c0,0x2c1,0x2c2,0x2d0,0x2c3,0x2c4,0x2c5],[0x2c8,0x2c9,0x2ac,0x2d8,0x2cb,0x2cc,0x2cd]])
por('vaso',[[0x057],[0x05f]],'interior')
# O vaso carrega o piso do tileset. Retira somente o fundo conectado à borda,
# preservando a borda escura da planta e as cores do vaso dentro do contorno.
def limpar_borda(im,cores):
 fila=[];visitados=set()
 for x in range(im.width):fila.extend([(x,0),(x,im.height-1)])
 for y in range(im.height):fila.extend([(0,y),(im.width-1,y)])
 while fila:
  x,y=fila.pop()
  if (x,y) in visitados or not(0<=x<im.width and 0<=y<im.height):continue
  visitados.add((x,y));p=im.getpixel((x,y))
  if p[3] and p not in cores:continue
  im.putpixel((x,y),(0,0,0,0));fila.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
im=objetos['vaso'];original=im.copy();limpar_borda(im,set(ts['interior'][0x059].get_flattened_data()))
# O miolo dourado compartilha a paleta do piso, mas pertence ao vaso.
for y in range(20,32):
 a,b=(4,12)if y in[20,30]else(5,11)if y==31 else(3,13)
 for x in range(a,b):im.putpixel((x,y),original.getpixel((x,y)))
grama=set(c for i in[0x001,0x008,0x009,0x010,0x011]for c in ts['exterior'][i].get_flattened_data())
for nome in ['arvore','arvore_grande','arbusto','flores','placa']:
 limpar_borda(objetos[nome],grama)
por('prateleira',[[0x2cb,0x2cc],[0x2cd,0x2ce]],'centro')
por('pc',[[0x062],[0x295]],'centro')
por('tv',[[0x036,0x037],[0x03e,0x03f]],'interior')
por('mesa',[[0x04c,0x04d],[0x054,0x055]],'interior')
por('balcao',[[0x2b9,0x2bc,0x2bc,0x298,0x2bc,0x2bc,0x2bd],[0x2a3,0x2b7,0x2b7,0x2b7,0x2b7,0x2b7,0x2bf]],'centro')
por('escada',[[0x2d0,0x2d1],[0x2d8,0x2d9],[0x2e0,0x2e1]],'centro')
por('maquina',[[0x2a9,0x2aa,0x2ab],[0x2b1,0x2b2,0x2b3]],'centro')
por('cama',[[0x287],[0x28f]],'interior')
por('poste',[[0x0e8],[0x0f1]])
por('banco',[[0x284,0x284]])
por('borda_pedra',[[0x135,0x136]])
por('bau',[[0x003]])
# Pedras do cenário mantêm a escala original. A pedra de Força ampliada parecia
# uma esfera gigante, além de comunicar uma interação que esses enfeites não têm.
for nome,arquivo,tamanho in [('pedra','rock_smash_rock.png',16),('rochedo','rock_smash_rock.png',32)]:
 p=root/'misc'/arquivo
 if p.exists():
  src=Image.open(p);im=src.crop((0,0,16,16));rgba=im.convert('RGBA');rgba.putalpha(im.point([0]+[255]*255,'L'))
  if tamanho==16:objetos[nome]=rgba
  else:
   grupo=Image.new('RGBA',(32,32));grupo.alpha_composite(rgba,(0,12));grupo.alpha_composite(rgba,(16,16));objetos[nome]=grupo

# Um único atlas para os objetos; as peças maiores são montadas por coluna de 16 px.
atlas=Image.new('RGBA',(512,512));frames={};x=y=linha=0
for nome,im in objetos.items():
 if x+im.width>512:x=0;y+=linha;linha=0
 if y+im.height>512:raise ValueError('Atlas de objetos cheio')
 atlas.paste(im,(x,y));frames[nome]=[x,y,im.width,im.height];x+=im.width;linha=max(linha,im.height)
atlas.save(SAIDA/'objetos.png',optimize=True)
fontes={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(raw.rglob('*')) if p.is_file() and any(str(p.relative_to(raw)).startswith(('primary/'+v[0], 'secondary/'+v[1])) for v in BANCOS.values())}
J={'origem':json.loads((root/'origem.json').read_text()),'bloco':16,'bancos':{k:{'arquivo':k+'.png','blocos':len(v)}for k,v in ts.items()},'objetos':frames,'fontes':{**fontes,**{'misc/'+p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in sorted((root/'misc').glob('*.png'))}}}
J['versaoObjetos']=hashlib.sha256((SAIDA/'objetos.png').read_bytes()).hexdigest()[:16]
(SAIDA/'indice.json').write_text(json.dumps(J,ensure_ascii=False,indent=2)+'\n')
print('Atlas de terreno e objetos:',SAIDA)

# As folhas originais têm três direções; a quarta é o espelho do lado esquerdo.
# Só reorganiza quadros no formato 3x4 já usado pelo jogo, sem ampliar o personagem.
pessoas=SAIDA/'pessoas';pessoas.mkdir(exist_ok=True)
for p in (root/'pessoas').glob('*.png'):
 src=Image.open(p);fw=32 if p.stem.endswith(('_bike','_surf','_surf_run','_vs_seeker_bike')) else 16
 if src.width<fw*3:continue
 cv=Image.new('RGBA',(96,128))
 for row,cols in enumerate([[0,3,4],[1,5,6],[2,7,8],[2,7,8]]):
  for col,k in enumerate(cols):
   k=min(k,src.width//fw-1);im=src.crop((k*fw,0,(k+1)*fw,32));rgba=im.convert('RGBA');rgba.putalpha(im.point([0]+[255]*255,'L'))
   if row==3:rgba=rgba.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
   cv.paste(rgba,(col*32+(32-fw)//2,row*32))
 cv.save(pessoas/(p.stem+'.webp'),lossless=True)
J=json.loads((RAIZ/'assets/hgss/personagens/indice.json').read_text())
fixos={'npc_076':'old_woman','frlg_trainer':'red_normal','frlg_trainer_green':'green_normal','frlg_oak':'prof_oak','frlg_mom':'mom','frlg_rival':'blue','frlg_little_girl':'little_girl','frlg_kid':'little_boy','frlg_oldman':'old_man_1','frlg_woman':'woman_1','frlg_gym_guide':'gym_guy','frlg_girl':'picnicker'}
regras=[('old woman','old_woman'),('elder','old_man_1'),('sage','old_man_2'),('scientist f','woman_2'),('scientist','scientist'),('ace trainer f','cooltrainer_f'),('ace trainer','cooltrainer_m'),('school kid f','little_girl'),('school kid','little_boy'),('swimmer f','swimmer_f_land'),('swimmer','swimmer_m_land'),('beauty','beauty'),('fisher','fisher'),('rancher','man'),('guitarist','rocker'),('worker f','worker_f'),('worker','worker_m'),('nurse','nurse'),('clerk','clerk'),('gentleman','gentleman'),('lady','woman_2'),('medium','channeler'),('psychic','man'),('black belt','black_belt'),('prof','prof_oak'),('policeman','policeman'),('sailor','sailor'),('biker','biker'),('hiker','hiker'),('youngster','youngster'),('bug catcher','bug_catcher'),('lass','lass'),('camper','camper'),('waitress','woman_2'),('waiter','man'),('rocket grunt f','rocket_f'),('rocket grunt','rocket_m'),('bruno','bruno'),('brock','brock'),('misty','misty'),('erika','erika'),('koga','koga'),('blaine','blaine'),('sabrina','sabrina'),('surge','lt_surge'),('agatha','agatha'),('lance','lance'),('lorelei','lorelei'),('giovanni','giovanni'),('girl','little_girl'),('boy','boy')]
aliases={}
for k,v in J['personagens'].items():
 nome=v.get('n','').lower().replace('_',' ');possivel=k.removeprefix('frlg_')
 out=fixos.get(k)or(possivel if(pessoas/(possivel+'.webp')).exists()else None)
 if not out:out=next((src for palavra,src in regras if palavra in nome),'woman_1'if any(w in nome for w in ['female','woman',' f','lyra','dawn','may'])else'man')
 aliases[k]=out
(pessoas/'aliases.json').write_text(json.dumps(aliases,ensure_ascii=False,indent=2)+'\n')
print('Folhas FireRed:',len(list(pessoas.glob('*.webp'))))
