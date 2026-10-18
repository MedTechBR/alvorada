#!/usr/bin/env python3
"""Baixa e prepara os sprites do PMD SpriteCollab para o jogo.

Uso (sempre com -I, para o Python não carregar nada da pasta atual):
    python3 -I tools/pmd_baixar.py baixar   <pasta_nova_vazia>     # só baixa (dados não confiáveis)
    python3 -I tools/pmd_baixar.py instalar <mesma_pasta>          # valida, copia e gera os índices
    python3 -I tools/pmd_baixar.py tudo     <pasta_nova_vazia>     # as duas coisas
    python3 -I tools/pmd_baixar.py processar                       # só refaz frames.json/index/créditos

Origem: https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/<dex 4 dígitos>/
Licença dos sprites: CC BY-NC 4.0 (e licenças PMDCollab_1/2, todas pedem crédito; uso não comercial).

O que é gerado em assets/pmd/:
  <dex>/AnimData.xml, <Anim>-Anim.png, <Anim>-Offsets.png, <Anim>-Shadow.png, credits.txt
  <dex>/frames.json   tudo que o jogo precisa por quadro (durações, ponto da sombra, corpo, cabeça, mãos, recorte)
  index.json          lista dos dex disponíveis (o jogo usa para sortear selvagens)
  fontes.json         de onde veio cada espécie (pasta/forma), situação e animações que faltaram
  CREDITOS.md         autores por espécie + licença
"""
import json, os, re, shutil, sys, time, random
import urllib.request, urllib.error
import xml.etree.ElementTree as ET

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(RAIZ, 'assets', 'pmd')
SPECIES_JS = os.path.join(RAIZ, 'src', 'data', 'species.js')
BASE = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/'
WANTED = ['Idle', 'Walk', 'Attack', 'Shoot', 'Charge', 'Hurt', 'Sleep', 'Faint', 'Hop',
          'Strike', 'Swing', 'Pound', 'Rotate', 'Special']
EXTRAS = ['Anim', 'Offsets', 'Shadow']
# Espécie ausente ou incompleta lá: forma mais próxima a tentar (caminho relativo a sprite/)
ALTERNATIVAS = {
    # exemplo: 903: ['0215/0001'],  # Sneasler -> Sneasel de Hisui
}
PAUSA = 0.12
UA = 'pokemon-alvorada-fan-game/1.0 (uso pessoal; download unico)'


# ------------------------------------------------------------------ util
def log(*a):
    print(*a, flush=True)


def baixar_url(url, tentativas=5):
    """Devolve bytes, ou None se 404. Tenta de novo com espera crescente em erros de rede/limite."""
    espera = 1.5
    for k in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=40) as r:
                dados = r.read()
            time.sleep(PAUSA + random.random() * 0.08)
            return dados
        except urllib.error.HTTPError as e:
            if e.code == 404:
                time.sleep(PAUSA)
                return None
            log(f'  ! HTTP {e.code} em {url} (tentativa {k + 1})')
        except Exception as e:  # rede
            log(f'  ! {type(e).__name__} em {url} (tentativa {k + 1})')
        time.sleep(espera)
        espera *= 2
    raise RuntimeError('falhou: ' + url)


def eh_png(b):
    return b is not None and b[:8] == b'\x89PNG\r\n\x1a\n'


def dex_do_species():
    txt = open(SPECIES_JS, encoding='utf-8').read()
    ids = set(int(m) for m in re.findall(r'^\s*(\d+)\s*:\s*(?:\{|S\()', txt, re.M))
    ids |= set(int(m) for m in re.findall(r'\bto\s*:\s*(\d+)', txt))
    return sorted(ids)


def pre_evolucoes():
    """dex -> dex anterior (para usar a forma mais próxima se faltar)."""
    txt = open(SPECIES_JS, encoding='utf-8').read()
    pre = {}
    for m in re.finditer(r'^\s*(\d+)\s*:\s*\{(?:(?!^\s*\d+\s*:).)*?evolve\s*:\s*\{[^}]*?to\s*:\s*(\d+)', txt, re.M | re.S):
        pre[int(m.group(2))] = int(m.group(1))
    return pre


def parse_animdata(xml_bytes):
    root = ET.fromstring(xml_bytes)
    shadow = int((root.findtext('ShadowSize') or '1').strip())
    anims = {}
    for a in root.iter('Anim'):
        nome = (a.findtext('Name') or '').strip()
        if not re.fullmatch(r'[A-Za-z0-9_]{1,40}', nome):
            continue
        copy = (a.findtext('CopyOf') or '').strip() or None
        d = {'copy': copy}
        if not copy:
            d['fw'] = int(a.findtext('FrameWidth'))
            d['fh'] = int(a.findtext('FrameHeight'))
            d['durs'] = [int(x.text) for x in a.iter('Duration')]
            for tag, k in (('HitFrame', 'hit'), ('RushFrame', 'rush'), ('ReturnFrame', 'ret')):
                v = a.findtext(tag)
                if v is not None and v.strip().lstrip('-').isdigit():
                    d[k] = int(v)
        anims[nome] = d
    return shadow, anims


def resolver(anims, nome, prof=0):
    a = anims.get(nome)
    if a is None or prof > 6:
        return None
    if a['copy']:
        return resolver(anims, a['copy'], prof + 1)
    return nome


# ------------------------------------------------------------------ baixar
def baixar(stage):
    os.makedirs(stage, exist_ok=True)
    if any(n for n in os.listdir(stage) if not n.startswith('.')) and not os.path.exists(os.path.join(stage, '_meta')):
        sys.exit('A pasta de download precisa ser nova (vazia).')
    meta = os.path.join(stage, '_meta')
    os.makedirs(meta, exist_ok=True)
    nomes = baixar_url(BASE + 'credit_names.txt')
    if nomes:
        open(os.path.join(meta, 'credit_names.txt'), 'wb').write(nomes)
    pre = pre_evolucoes()
    relatorio = {}
    lista = dex_do_species()
    log(f'{len(lista)} espécies: {lista}')
    for dex in lista:
        pasta_dex = os.path.join(stage, f'{dex:04d}')
        if os.path.exists(os.path.join(pasta_dex, '_ok.json')):
            relatorio[dex] = json.load(open(os.path.join(pasta_dex, '_ok.json')))
            continue
        candidatos = [f'{dex:04d}'] + ALTERNATIVAS.get(dex, [])
        p = dex
        while p in pre:  # pré-evoluções como último recurso
            p = pre[p]
            candidatos.append(f'{p:04d}')
        xml = origem = None
        for c in candidatos:
            xml = baixar_url(f'{BASE}sprite/{c}/AnimData.xml')
            if xml:
                origem = c
                break
        if not xml:
            log(f'{dex}: SEM sprite')
            relatorio[dex] = {'origem': None}
            continue
        shadow, anims = parse_animdata(xml)
        os.makedirs(pasta_dex, exist_ok=True)
        open(os.path.join(pasta_dex, 'AnimData.xml'), 'wb').write(xml)
        bases = []
        for w in WANTED:
            b = resolver(anims, w)
            if b and b not in bases:
                bases.append(b)
        faltou = [w for w in WANTED if not resolver(anims, w)]
        baixados = []
        for b in bases:
            for ex in EXTRAS:
                nome = f'{b}-{ex}.png'
                dados = baixar_url(f'{BASE}sprite/{origem}/{nome}')
                if eh_png(dados):
                    open(os.path.join(pasta_dex, nome), 'wb').write(dados)
                    baixados.append(nome)
                elif ex == 'Anim':
                    log(f'  {dex}: folha {nome} ausente')
        cred = baixar_url(f'{BASE}sprite/{origem}/credits.txt')
        if cred:
            open(os.path.join(pasta_dex, 'credits.txt'), 'wb').write(cred)
        info = {'origem': origem, 'shadow': shadow, 'bases': bases, 'faltou': faltou, 'arquivos': len(baixados)}
        json.dump(info, open(os.path.join(pasta_dex, '_ok.json'), 'w'))
        relatorio[dex] = info
        log(f'{dex}: {origem} {len(baixados)} arquivos; sem: {faltou}')
    json.dump(relatorio, open(os.path.join(meta, 'relatorio.json'), 'w'), indent=1)
    return relatorio


# ------------------------------------------------------------------ instalar
def instalar(stage):
    os.makedirs(DEST, exist_ok=True)
    rel = json.load(open(os.path.join(stage, '_meta', 'relatorio.json')))
    nomes = os.path.join(stage, '_meta', 'credit_names.txt')
    if os.path.exists(nomes):
        shutil.copyfile(nomes, os.path.join(DEST, 'credit_names.txt'))
    for dex, info in rel.items():
        if not info.get('origem'):
            continue
        src = os.path.join(stage, f'{int(dex):04d}')
        dst = os.path.join(DEST, f'{int(dex):04d}')
        if os.path.isdir(dst):
            shutil.rmtree(dst)
        os.makedirs(dst)
        for n in os.listdir(src):
            if not re.fullmatch(r'(AnimData\.xml|credits\.txt|[A-Za-z0-9_]{1,40}-(Anim|Offsets|Shadow)\.png)', n):
                continue
            caminho = os.path.join(src, n)
            b = open(caminho, 'rb').read()
            if n.endswith('.png') and not eh_png(b):
                continue
            if n == 'AnimData.xml':
                parse_animdata(b)  # precisa ser XML válido
            open(os.path.join(dst, n), 'wb').write(b)
    fontes = {int(k): {'origem': v.get('origem'), 'faltou': v.get('faltou', [])} for k, v in rel.items()}
    json.dump(fontes, open(os.path.join(DEST, 'fontes.json'), 'w'), indent=1, sort_keys=True)
    processar()


# ------------------------------------------------------------------ processar (Offsets/Shadow -> frames.json)
def ler_png(caminho):
    from PIL import Image
    im = Image.open(caminho)
    im.load()
    return im.convert('RGBA')


def pontos_do_quadro(px, x0, y0, fw, fh, cores):
    achados = {}
    for y in range(fh):
        for x in range(fw):
            c = px[x0 + x, y0 + y]
            if c[3] == 0:
                continue
            k = cores.get(c[:3])
            if k and k not in achados:
                achados[k] = (x, y)
    return achados


def caixa_do_quadro(im, x0, y0, fw, fh):
    bb = im.crop((x0, y0, x0 + fw, y0 + fh)).getchannel('A').getbbox()
    return list(bb) if bb else None


def processar():
    from PIL import Image  # noqa: F401  (falha cedo se faltar o Pillow)
    disp = []
    for n in sorted(os.listdir(DEST)):
        pasta = os.path.join(DEST, n)
        if not (re.fullmatch(r'\d{4}', n) and os.path.isfile(os.path.join(pasta, 'AnimData.xml'))):
            continue
        shadow, anims = parse_animdata(open(os.path.join(pasta, 'AnimData.xml'), 'rb').read())
        out = {'shadow': shadow, 'anims': {}}
        for w in WANTED:
            b = resolver(anims, w)
            if not b or not os.path.isfile(os.path.join(pasta, f'{b}-Anim.png')):
                continue
            a = anims[b]
            fw, fh, durs = a['fw'], a['fh'], a['durs']
            folha = ler_png(os.path.join(pasta, f'{b}-Anim.png'))
            rows = max(1, round(folha.height / fh))
            sombra = ler_png(os.path.join(pasta, f'{b}-Shadow.png')) if os.path.isfile(os.path.join(pasta, f'{b}-Shadow.png')) else None
            offs = ler_png(os.path.join(pasta, f'{b}-Offsets.png')) if os.path.isfile(os.path.join(pasta, f'{b}-Offsets.png')) else None
            spx = sombra.load() if sombra else None
            opx = offs.load() if offs else None
            quadros = []
            for r in range(rows):
                linha = []
                for i in range(len(durs)):
                    x0, y0 = i * fw, r * fh
                    sx, sy = fw // 2, fh // 2 + 4  # padrão do PMD se faltar o Shadow
                    if spx and x0 + fw <= sombra.width and y0 + fh <= sombra.height:
                        s = pontos_do_quadro(spx, x0, y0, fw, fh, {(255, 255, 255): 's'})
                        if 's' in s:
                            sx, sy = s['s']
                    # Offsets: preto = cabeça, verde = centro do corpo, vermelho/azul = mãos
                    o = {}
                    if opx and x0 + fw <= offs.width and y0 + fh <= offs.height:
                        o = pontos_do_quadro(opx, x0, y0, fw, fh, {(0, 0, 0): 'h', (0, 255, 0): 'c', (255, 0, 0): 'r', (0, 0, 255): 'l'})
                    bb = caixa_do_quadro(folha, x0, y0, fw, fh)
                    def P(k):
                        return list(o[k]) if k in o else None
                    linha.append({'s': [sx, sy], 'c': P('c'), 'h': P('h'), 'r': P('r'), 'l': P('l'), 'b': bb})
                quadros.append(linha)
            ent = {'src': b, 'fw': fw, 'fh': fh, 'rows': rows, 'durs': durs, 'q': quadros}
            for k in ('hit', 'rush', 'ret'):
                if k in a:
                    ent[k] = a[k]
            out['anims'][w] = ent
        if 'Idle' not in out['anims'] and 'Walk' not in out['anims']:
            continue
        # compacta: listas planas [sx,sy,cx,cy,hx,hy,rx,ry,lx,ly,bx0,by0,bx1,by1] (-1 = sem ponto)
        for ent in out['anims'].values():
            plano = []
            for linha in ent['q']:
                pl = []
                for q in linha:
                    v = q['s'][:]
                    for k in ('c', 'h', 'r', 'l'):
                        v += q[k] if q[k] else [-1, -1]
                    v += q['b'] if q['b'] else [0, 0, 0, 0]
                    pl.append(v)
                plano.append(pl)
            ent['q'] = plano
        with open(os.path.join(pasta, 'frames.json'), 'w') as f:
            json.dump(out, f, separators=(',', ':'))
        disp.append(int(n))
    json.dump(disp, open(os.path.join(DEST, 'index.json'), 'w'))
    creditos(disp)
    log(f'processadas {len(disp)} espécies')


# ------------------------------------------------------------------ créditos
def creditos(disp):
    nomes = {}
    cn = os.path.join(DEST, 'credit_names.txt')
    if os.path.exists(cn):
        for ln in open(cn, encoding='utf-8', errors='replace').read().splitlines()[1:]:
            p = ln.split('\t')
            if len(p) >= 2:
                nomes[p[1].strip()] = (p[0].strip(), p[2].strip() if len(p) > 2 else '')
    try:
        fontes = json.load(open(os.path.join(DEST, 'fontes.json')))
    except Exception:
        fontes = {}
    sp_nome = {}
    txt = open(SPECIES_JS, encoding='utf-8').read()
    for m in re.finditer(r"^\s*(\d+)\s*:\s*(?:\{\s*name\s*:\s*|S\()\s*'([^']+)'", txt, re.M):
        sp_nome[int(m.group(1))] = m.group(2)
    linhas = ['# Créditos dos sprites de Pokémon', '',
              'Sprites do **PMD Sprite Repository / SpriteCollab** (https://github.com/PMDCollab/SpriteCollab,',
              'site http://sprites.pmdcollab.org/), feitos pela comunidade no estilo de *Pokémon Mystery Dungeon*.',
              '',
              '**Licença:** Creative Commons Atribuição-NãoComercial 4.0 (CC BY-NC 4.0),',
              'https://creativecommons.org/licenses/by-nc/4.0/ (texto em `LICENSE.md` do repositório).',
              'Alguns envios antigos usam as licenças históricas `PMDCollab_1` (uso livre mantendo o crédito ao artista) e',
              '`PMDCollab_2` (idem, sem fins lucrativos). Todas pedem **crédito** e este jogo é **pessoal e não comercial**.',
              'Sprites marcados `CHUNSOFT` são dos jogos oficiais da Spike Chunsoft (Pokémon Mystery Dungeon); Pokémon é',
              'marca da Nintendo / Game Freak / The Pokémon Company. Projeto de fã, sem relação com elas.',
              '',
              'Arquivos recebidos sem alteração (as folhas são lidas e recortadas pelo jogo em tempo de execução;',
              '`frames.json` é derivado dos arquivos `*-Offsets.png` e `*-Shadow.png`).',
              '',
              '| Dex | Espécie | Pasta de origem | Autores (atual) | Autores anteriores | Licença |',
              '|---|---|---|---|---|---|']
    todos = {}
    for dex in disp:
        f = os.path.join(DEST, f'{dex:04d}', 'credits.txt')
        cur, old, lic = [], [], set()
        if os.path.exists(f):
            for ln in open(f, encoding='utf-8', errors='replace').read().splitlines():
                p = ln.split('\t')
                if len(p) < 3:
                    continue
                autor = nomes.get(p[1].strip(), (p[1].strip(), ''))[0]
                autor = re.sub(r'[|<>@!]', '', autor) or '?'
                (cur if p[2].strip() == 'CUR' else old).append(autor)
                if len(p) > 3 and p[3].strip():
                    lic.add(p[3].strip())
                todos.setdefault(autor, nomes.get(p[1].strip(), ('', ''))[1])
        u = lambda xs: ', '.join(dict.fromkeys(xs)) or '-'
        orig = (fontes.get(str(dex)) or {}).get('origem') or f'{dex:04d}'
        linhas.append(f"| {dex} | {sp_nome.get(dex, '?')} | sprite/{orig} | {u(cur)} | {u(old)} | {', '.join(sorted(lic)) or '-'} |")
    linhas += ['', '## Contato dos artistas citados', '']
    for a in sorted(todos, key=str.lower):
        c = todos[a]
        c = '' if (not c or c.startswith('<')) else f' ({c})'
        linhas.append(f'- {a}{c}')
    open(os.path.join(DEST, 'CREDITOS.md'), 'w', encoding='utf-8').write('\n'.join(linhas) + '\n')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'baixar':
        baixar(sys.argv[2])
    elif cmd == 'instalar':
        instalar(sys.argv[2])
    elif cmd == 'tudo':
        baixar(sys.argv[2])
        instalar(sys.argv[2])
    elif cmd == 'processar':
        processar()
    else:
        print(__doc__)
