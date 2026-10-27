"""Obtém somente os gráficos públicos de uma revisão fixa. Não usa ROM nem código de terceiros."""
import json,urllib.request,concurrent.futures,time
from pathlib import Path
import os
raiz=Path(os.environ.get('FIRERED_CACHE','/tmp/alvorada-firered'))/'originais';raiz.mkdir(parents=True,exist_ok=True)
sha='ce6406d8c2eaf46d543c8a2606de0c3cb1951982';(raiz.parent/'origem.json').write_text(json.dumps({'repositorio':'pret/pokefirered','commit':sha}))
gr=['primary/general','primary/building','secondary/pallet_town','secondary/generic_building_1','secondary/pokemon_center','secondary/cave']
nomes=['tiles.png','metatiles.bin','metatile_attributes.bin']+['palettes/%02d.pal'%i for i in range(16)]
def baixar(arg):
 g,n=arg;p=raiz/g/n
 if p.exists():return
 for k in range(3):
  try:
   u='https://raw.githubusercontent.com/pret/pokefirered/'+sha+'/data/tilesets/'+g+'/'+n
   b=urllib.request.urlopen(u,timeout=30).read();p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);return
  except urllib.error.HTTPError as e:
   if e.code==404:return
   if k==2:raise
  except Exception:
   if k==2:raise
  time.sleep(1)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:list(ex.map(baixar,[(g,n)for g in gr for n in nomes]))
print('Origem:',sha,'arquivos:',len(list(raiz.rglob('*.*'))))

pessoas=raiz.parent/'pessoas';pessoas.mkdir(exist_ok=True)
req=urllib.request.Request('https://api.github.com/repos/pret/pokefirered/contents/graphics/object_events/pics/people?ref='+sha,headers={'User-Agent':'Alvorada-arte'})
lista=json.load(urllib.request.urlopen(req,timeout=30))
def pessoa(p):
 alvo=pessoas/p['name']
 if not alvo.exists():alvo.write_bytes(urllib.request.urlopen(p['download_url'],timeout=30).read())
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as ex:list(ex.map(pessoa,lista))

# Objetos móveis: transparência própria evita trazer o chão do tileset junto da rocha.
misc=raiz.parent/'misc';misc.mkdir(exist_ok=True)
for nome in ['strength_boulder.png','rock_smash_rock.png','wooden_sign.png','cut_tree.png']:
 p=misc/nome
 if not p.exists():p.write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/pret/pokefirered/'+sha+'/graphics/object_events/pics/misc/'+nome,timeout=30).read())
