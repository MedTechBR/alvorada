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
SPECIES_GEN = os.path.join(RAIZ, 'src', 'data', 'gen', 'especies.js')  # espécies importadas da PokéAPI


def texto_especies():
    txt = open(SPECIES_JS, encoding='utf-8').read()
    if os.path.exists(SPECIES_GEN):
        txt += '\n' + open(SPECIES_GEN, encoding='utf-8').read()
    return txt
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
    txt = texto_especies()
    ids = set(int(m) for m in re.findall(r'^\s*(\d+)\s*:\s*(?:\{|S\()', txt, re.M))
    ids |= set(int(m) for m in re.findall(r'\bto\s*:\s*(\d+)', txt))
    ids |= set(int(m) for m in re.findall(r'"to":(\d+)', txt))
    return sorted(ids)


def pre_evolucoes():
    """dex -> dex anterior (para usar a forma mais próxima se faltar)."""
    txt = texto_especies()
    pre = {}
    for m in re.finditer(r'^\s*(\d+)\s*:\s*\{[^\n]*?"from":(\d+)', txt, re.M):
        pre[int(m.group(1))] = int(m.group(2))
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
    parte = os.environ.get('PMD_PARTE', '')  # ex.: PMD_PARTE=2/4 baixa só um quarto (vários em paralelo na mesma pasta)
    if re.fullmatch(r'\d+/\d+', parte):
        i, n = map(int, parte.split('/'))
        lista = lista[i - 1::n]
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


# ------------------------------------------------------------------ baixar tudo (todas as espécies e formas do tracker)
# Animações que o jogo realmente usa (src/sprites/pmd.js, src/combat/vfx.js, combat.js, altitude.js, ai.js, people.js):
# Faint e Special nunca são pedidas (Faint cai em Hurt e Special em Shoot), então não são baixadas nem publicadas.
USADAS = ['Idle', 'Walk', 'Attack', 'Shoot', 'Charge', 'Hurt', 'Sleep', 'Hop', 'Strike', 'Swing', 'Pound', 'Rotate']
# subpastas do SpriteCollab que não são formas do jogo (cores alternativas, cenas, versões beta, fantasias…)
FORA = re.compile(r'^(Altcolor|Cutscene.*|Alternate\d*|.*_Altcolor|.*_Alternate|Beta|Shadow|Substitute.*|Egg|Cosplay|Mikon|'
                  r'Hakogame|Turban|Pombon|Libre|Female|Shiny|Starter|Totem.*|Partner)$')


def alvos_do_tracker(tracker):
    """[(caminho relativo a sprite/, nome da forma)] de tudo que tem Idle ou Walk: espécies 0001–1025 e formas."""
    out = []
    for dex, v in sorted(tracker.items()):
        if not re.fullmatch(r'\d{4}', dex) or dex == '0000' or int(dex) > 1025:
            continue
        sf = v.get('sprite_files') or {}
        if 'Idle' in sf or 'Walk' in sf:
            out.append((dex, ''))
        for sk, sv in (v.get('subgroups') or {}).items():
            nome = (sv.get('name') or '').strip()
            if sk == '0000' or not nome or FORA.match(nome) or not re.fullmatch(r'\d{4}', sk):
                continue
            sf = sv.get('sprite_files') or {}
            if 'Idle' in sf or 'Walk' in sf:
                out.append((f'{dex}/{sk}', nome))
    return out


def baixar_um(stage, caminho, nome):
    pasta = os.path.join(stage, caminho.replace('/', '-'))
    ok = os.path.join(pasta, '_ok.json')
    if os.path.exists(ok):
        return json.load(open(ok))
    xml = baixar_url(f'{BASE}sprite/{caminho}/AnimData.xml')
    if not xml:
        return {'origem': None, 'caminho': caminho, 'nome': nome}
    shadow, anims = parse_animdata(xml)
    os.makedirs(pasta, exist_ok=True)
    open(os.path.join(pasta, 'AnimData.xml'), 'wb').write(xml)
    bases = []
    for w in USADAS:
        b = resolver(anims, w)
        if b and b not in bases:
            bases.append(b)
    baixados = 0
    for b in bases:
        for ex in EXTRAS:
            dados = baixar_url(f'{BASE}sprite/{caminho}/{b}-{ex}.png')
            if eh_png(dados):
                open(os.path.join(pasta, f'{b}-{ex}.png'), 'wb').write(dados)
                baixados += 1
    cred = baixar_url(f'{BASE}sprite/{caminho}/credits.txt')
    if cred:
        open(os.path.join(pasta, 'credits.txt'), 'wb').write(cred)
    info = {'origem': caminho, 'nome': nome, 'shadow': shadow, 'bases': bases,
            'faltou': [w for w in USADAS if not resolver(anims, w)], 'arquivos': baixados}
    json.dump(info, open(ok, 'w'))
    return info


def baixar_tudo(stage, tracker_path, reaproveitar=None, lista=None):
    """Baixa em paralelo (6 conexões) tudo que o tracker tem. `reaproveitar` = pasta de um download antigo
    (formato da função baixar) cujas espécies com sprite próprio são copiadas em vez de baixadas de novo."""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    os.makedirs(os.path.join(stage, '_meta'), exist_ok=True)
    if not os.path.exists(os.path.join(stage, '_meta', 'credit_names.txt')):
        nomes = baixar_url(BASE + 'credit_names.txt')
        if nomes:
            open(os.path.join(stage, '_meta', 'credit_names.txt'), 'wb').write(nomes)
    if lista is None:
        lista = alvos_do_tracker(json.load(open(tracker_path, encoding='utf-8')))
    if reaproveitar:
        for caminho, nome in lista:
            if '/' in caminho:
                continue
            velho = os.path.join(reaproveitar, caminho)
            novo = os.path.join(stage, caminho)
            okv = os.path.join(velho, '_ok.json')
            if os.path.exists(okv) and not os.path.exists(novo) and json.load(open(okv)).get('origem') == caminho:
                shutil.copytree(velho, novo)
                info = json.load(open(okv))
                info['nome'] = ''
                json.dump(info, open(os.path.join(novo, '_ok.json'), 'w'))
    log(f'{len(lista)} alvos ({sum(1 for c, _ in lista if "/" in c)} formas)')
    rel = {}
    with ThreadPoolExecutor(max_workers=6) as ex:
        fut = {ex.submit(baixar_um, stage, c, n): c for c, n in lista}
        for i, f in enumerate(as_completed(fut)):
            c = fut[f]
            try:
                rel[c] = f.result()
            except Exception as e:  # rede: fica para a próxima rodada (o _ok.json só é gravado no fim)
                rel[c] = {'origem': None, 'erro': str(e)}
            if i % 25 == 0:
                log(f'{i + 1}/{len(lista)} {c} {rel[c].get("arquivos", "-")}')
    json.dump(rel, open(os.path.join(stage, '_meta', 'tudo.json'), 'w'), indent=1, sort_keys=True)
    log('fim: ' + str(sum(1 for v in rel.values() if v.get('origem'))) + ' com sprite')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'baixar-tudo':  # baixar-tudo <pasta_stage> <tracker.json> [pasta antiga para reaproveitar]
        baixar_tudo(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
        sys.exit(0)
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
