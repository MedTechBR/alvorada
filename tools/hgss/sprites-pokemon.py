#!/usr/bin/env python3
"""Sprites de batalha das 1025 espécies (frente e costas) em tiras WebP + índice JSON.

Uso (da raiz do repositório):
    python3 -I tools/hgss/sprites-pokemon.py baixar      # baixa só o que falta (cache em dados-brutos/pokeapi-sprites/)
    python3 -I tools/hgss/sprites-pokemon.py converter   # gera assets/hgss/pokemon/{frente,costas}/*.webp + indice.json
    python3 -I tools/hgss/sprites-pokemon.py tudo

Fontes (veja assets/CREDITOS.md):
  - 51 espécies do demo de fã: referencias/pba/assets/pokemon/<especie>/{front,back}.webp (tiras de quadros quadrados);
  - o resto: github.com/PokeAPI/sprites, pasta sprites/pokemon:
      * dex 1-649: versions/generation-v/black-white/animated/{,back/}<id>.gif  (animado)
      * dex 650+ e formas: <id>.png e back/<id>.png (estático)
      * formas (regionais, Mega...): id de forma da PokéAPI (10001+) pelo campo `api` de src/data/gen/especies.js

Baixa só uma vez (o cache vale), em lotes de 40 com pausa, e cada pedido espera um pouco. Falhas 404 ficam
registradas em dados-brutos/pokeapi-sprites/_ausentes.json e não são pedidas de novo.

Índice: { "<chave>": { "n": nome, "f": {...}, "b": {...} } }  onde chave = "0025" ou "0006-megaX";
cada lado = { "w": largura do quadro, "h": altura, "n": quadros, "d": [ms por quadro] | ms (um só valor para todos),
              "c": colunas da grade (só quando a tira passaria de 16000 px; senão uma linha só),
              "src": "demo" | "gif" | "png" }.
Tira = quadros lado a lado, da esquerda para a direita, todos w x h; com "c", em ordem de leitura numa grade.
"""
import io
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error

from PIL import Image, ImageSequence

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CACHE = os.path.join(RAIZ, 'dados-brutos', 'pokeapi-sprites')
DEMO = os.path.join(RAIZ, 'referencias', 'pba', 'assets', 'pokemon')
SAIDA = os.path.join(RAIZ, 'assets', 'hgss', 'pokemon')
BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
ANIM = BASE + 'versions/generation-v/black-white/animated/'
UA = {'User-Agent': 'alvorada-assets/1.0 (fan game pessoal; baixa uma vez)'}


def log(*a):
    print(*a, flush=True)


# ------------------------------------------------------------------ catálogo
def catalogo():
    """[(chave, dex, id_pokeapi, api_nome)] de espécies e formas."""
    saida = os.path.join(CACHE, '_catalogo.json')
    if os.path.exists(saida):
        return json.load(open(saida))
    os.makedirs(CACHE, exist_ok=True)
    js = (
        "import('" + os.path.join(RAIZ, 'src/data/gen/especies.js') + "').then(m=>{const o=[];"
        "for(const [k,v] of Object.entries(m.ESPECIES)){o.push({dex:+k,nome:v.name,forms:Object.fromEntries("
        "Object.entries(v.forms||{}).map(([f,x])=>[f,x.api||null]))})}console.log(JSON.stringify(o))})"
    )
    esp = json.loads(subprocess.check_output(['node', '-e', js], cwd=RAIZ))
    lista = os.path.join(CACHE, '_lista.json')
    if not os.path.exists(lista):
        req = urllib.request.Request('https://pokeapi.co/api/v2/pokemon?limit=3000', headers=UA)
        open(lista, 'wb').write(urllib.request.urlopen(req, timeout=60).read())
    ids = {r['name']: int(r['url'].rstrip('/').split('/')[-1]) for r in json.load(open(lista))['results']}
    cat = []
    for e in esp:
        cat.append({'chave': '%04d' % e['dex'], 'dex': e['dex'], 'id': e['dex'], 'nome': e['nome']})
        for f, api in e['forms'].items():
            if api and api in ids and ids[api] > 10000:
                cat.append({'chave': '%04d-%s' % (e['dex'], f), 'dex': e['dex'], 'id': ids[api], 'nome': api})
    json.dump(cat, open(saida, 'w'))
    return cat


# ------------------------------------------------------------------ download
def pega(url, destino, ausentes):
    if os.path.exists(destino):
        return True
    if url in ausentes:
        return False
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    for tentativa in range(4):
        try:
            dados = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
            open(destino, 'wb').write(dados)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 404:
                ausentes[url] = 404
                return False
            time.sleep(2 + 3 * tentativa)
        except Exception:
            time.sleep(2 + 3 * tentativa)
    return False


def baixar():
    cat = catalogo()
    aus_f = os.path.join(CACHE, '_ausentes.json')
    ausentes = json.load(open(aus_f)) if os.path.exists(aus_f) else {}
    demo = set(os.listdir(DEMO)) if os.path.isdir(DEMO) else set()
    n = 0
    t0 = time.time()
    for c in cat:
        i = c['id']
        forma = i > 10000
        # animado só para dex 1-649 (formas tentam o animado também, mas quase sempre não existe)
        for lado, sub in (('f', ''), ('b', 'back/')):
            if c['dex'] <= 649 or forma and c['dex'] <= 649:
                ok = pega(ANIM + sub + '%d.gif' % i, os.path.join(CACHE, 'gif', sub or 'front/', '%d.gif' % i), ausentes)
                n += 1
                time.sleep(0.12)
                if ok:
                    continue
            if c['dex'] > 649 or forma or True:
                # estático só se não achou o gif (ou dex > 649)
                gif_ok = os.path.exists(os.path.join(CACHE, 'gif', sub or 'front/', '%d.gif' % i))
                if not gif_ok:
                    pega(BASE + sub + '%d.png' % i, os.path.join(CACHE, 'png', sub or 'front/', '%d.png' % i), ausentes)
                    n += 1
                    time.sleep(0.12)
        if n and n % 40 < 2:
            json.dump(ausentes, open(aus_f, 'w'))
            log('  %s ... %d pedidos, %.0fs' % (c['chave'], n, time.time() - t0))
            time.sleep(2.5)
    json.dump(ausentes, open(aus_f, 'w'))
    log('baixar: fim,', n, 'pedidos')


# ------------------------------------------------------------------ conversão
def caixa_uniao(quadros):
    caixa = None
    for q in quadros:
        b = q.getchannel('A').getbbox()
        if b:
            caixa = b if caixa is None else (min(caixa[0], b[0]), min(caixa[1], b[1]), max(caixa[2], b[2]), max(caixa[3], b[3]))
    return caixa


def gif_para_quadros(caminho):
    im = Image.open(caminho)
    quadros, durs = [], []
    for fr in ImageSequence.Iterator(im):
        quadros.append(fr.convert('RGBA'))
        durs.append(max(20, int(fr.info.get('duration', 100) or 100)))
    return quadros, durs


def compacta(quadros, durs):
    """Junta quadros consecutivos idênticos somando a duração; recorta pela união das caixas."""
    caixa = caixa_uniao(quadros) or (0, 0, quadros[0].width, quadros[0].height)
    quadros = [q.crop(caixa) for q in quadros]
    qs, ds = [], []
    for q, d in zip(quadros, durs):
        if qs and qs[-1].tobytes() == q.tobytes():
            ds[-1] += d
        else:
            qs.append(q)
            ds.append(d)
    return qs, ds


def colunas_de(w, n):
    """WebP aceita até 16383 px de lado: tiras muito longas viram grade (c colunas, quadros em ordem de leitura)."""
    return max(1, min(n, 16000 // w))


def tira(quadros):
    w, h = quadros[0].size
    c = colunas_de(w, len(quadros))
    linhas = -(-len(quadros) // c)
    folha = Image.new('RGBA', (w * c, h * linhas), (0, 0, 0, 0))
    for k, q in enumerate(quadros):
        folha.paste(q, ((k % c) * w, (k // c) * h))
    return folha


def grava(folha, destino):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    folha.save(destino, 'WEBP', lossless=True, quality=100, method=3, exact=False)
    return os.path.getsize(destino)


def d_compacto(ds):
    return ds[0] if len(set(ds)) == 1 else ds


def converte_lado(c, lado, idx, tam):
    sub = 'front/' if lado == 'f' else 'back/'
    pasta = 'frente' if lado == 'f' else 'costas'
    i = c['id']
    nome_demo = c['nome'].lower().replace('♀', '_f').replace('♂', '_m').replace(' ', '').replace('.', '').replace("'", '')
    nome_demo = {'nidoran-f': 'nidoran_f', 'nidoran-m': 'nidoran_m', 'nidoran_f': 'nidoran_f', 'nidoran_m': 'nidoran_m'}.get(nome_demo, nome_demo)
    destino = os.path.join(SAIDA, pasta, c['chave'] + '.webp')
    gif = os.path.join(CACHE, 'gif', sub, '%d.gif' % i)
    png = os.path.join(CACHE, 'png', sub, '%d.png' % i)
    demo = os.path.join(DEMO, nome_demo, ('front' if lado == 'f' else 'back') + '.webp')
    info = None
    if c['id'] == c['dex'] and os.path.exists(demo):
        # tira pronta do demo; durações vêm do gif da PokéAPI quando o número de quadros bate, senão 100 ms
        folha = Image.open(demo).convert('RGBA')
        h = folha.height
        n = folha.width // h
        durs = [100] * n
        if os.path.exists(gif):
            try:
                q, d = compacta(*gif_para_quadros(gif))
                if len(q) == n:
                    durs = d
            except Exception:
                pass
        # sem recompressão se já for pequeno: copia o arquivo
        import shutil
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        shutil.copyfile(demo, destino)
        tam[0] += os.path.getsize(destino)
        info = {'w': h, 'h': h, 'n': n, 'd': d_compacto(durs), 'src': 'demo'}
        if folha.width > 16383:
            raise SystemExit('tira do demo larga demais: ' + demo)
    elif os.path.exists(gif):
        q, d = compacta(*gif_para_quadros(gif))
        tam[0] += grava(tira(q), destino)
        info = {'w': q[0].width, 'h': q[0].height, 'n': len(q), 'd': d_compacto(d), 'src': 'gif'}
        if colunas_de(q[0].width, len(q)) < len(q):
            info['c'] = colunas_de(q[0].width, len(q))
    elif os.path.exists(png):
        im = Image.open(png).convert('RGBA')
        b = im.getchannel('A').getbbox()
        if b:
            im = im.crop(b)
        tam[0] += grava(im, destino)
        info = {'w': im.width, 'h': im.height, 'n': 1, 'd': 1000, 'src': 'png'}
    return info


def _um(c):
    tam = [0]
    e = {'n': c['nome']}
    for lado in ('f', 'b'):
        info = converte_lado(c, lado, None, tam)
        if info:
            e[lado] = info
    return c['chave'], e, tam[0]


def converter():
    from multiprocessing import Pool
    cat = catalogo()
    idx, falta, total = {}, [], 0
    with Pool(6) as pool:
        for k, (chave, e, t) in enumerate(pool.imap(_um, cat, chunksize=4)):
            total += t
            if 'f' in e or 'b' in e:
                idx[chave] = e
            else:
                falta.append(chave)
            if k % 100 == 0:
                log('  convertido', chave, '%.1f MB' % (total / 1e6))
    json.dump({'versao': 1, 'cabecalho': 'chave = dex 4 digitos ou dex-forma; f=frente, b=costas; veja tools/hgss/sprites-pokemon.py',
               'sprites': idx}, open(os.path.join(SAIDA, 'indice.json'), 'w'), separators=(',', ':'))
    log('converter: %d entradas, %.1f MB, sem sprite: %d %s' % (len(idx), total / 1e6, len(falta), falta[:20]))
    json.dump(falta, open(os.path.join(SAIDA, '_sem_sprite.json'), 'w'))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'tudo'
    if cmd in ('baixar', 'tudo'):
        baixar()
    if cmd in ('converter', 'tudo'):
        converter()
