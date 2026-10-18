# Lê o catálogo de objetos do jogo (src/world/objects.js, buildings.js e src/story/cenario.js) para saber o tamanho de cada tipo.
import re, os
RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))


def carregar():
    tam = {}
    o = open(os.path.join(RAIZ, 'src/world/objects.js'), encoding='utf-8').read()
    for m in re.finditer(r"\b([A-Za-z0-9_]+): *(?:tree\('[A-Za-z0-9]+'|\{)[^{}]*?(?:fw: *(\d+), *fh: *(\d+))?", o):
        pass
    for m in re.finditer(r"\b([A-Za-z0-9_]+): *\{ *tex: *'[A-Za-z0-9_]+', *fw: *(\d+), *fh: *(\d+)", o):
        tam[m.group(1)] = (int(m.group(2)), int(m.group(3)))
    for m in re.finditer(r"\b([A-Za-z0-9_]+): *tree\('[A-Za-z0-9]+'(?:, *\{[^}]*\})?\)", o):
        tam[m.group(1)] = (2, 1)
    b = open(os.path.join(RAIZ, 'src/world/buildings.js'), encoding='utf-8').read()
    for m in re.finditer(r"^mk\('([A-Za-z0-9]+)'.*?\), *(\d+), *(\d+), *(\d+)\);", b, re.S | re.M):
        tam[m.group(1)] = (int(m.group(2)), int(m.group(3)))
    c = open(os.path.join(RAIZ, 'src/story/cenario.js'), encoding='utf-8').read()
    for m in re.finditer(r"^[OB]\('([A-Za-z0-9]+)',.*?\), *(\d+), *(\d+)(?:, *(\d+|undefined))?\);", c, re.S | re.M):
        tam[m.group(1)] = (int(m.group(2)), int(m.group(3)))
    return tam


TAM = carregar()
if __name__ == '__main__':
    for k in ['center', 'mart', 'cabin', 'taipa', 'farol', 'casarao', 'houseA', 'houseStone', 'lampiao', 'posteLuzita', 'bambu', 'palmeira', 'coqueiro', 'lavaRock', 'fumarola', 'bench', 'well', 'beachStall', 'jangada', 'statue', 'brazier', 'torch', 'strengthRock', 'estante', 'counter', 'mural', 'barraca', 'guardaSol', 'boia', 'driftwood', 'sign']:
        print(k, TAM.get(k))


def itens_validos():
    ids = set()
    for arq in ('src/data/items.js', 'src/data/gen/itens.js'):
        t = open(os.path.join(RAIZ, arq), encoding='utf-8').read()
        ids |= set(re.findall(r"^\s{2}([A-Za-z0-9_]+):", t, re.M))
    ids |= set(re.findall(r"^\s{2}([A-Za-z0-9_]+):", open(os.path.join(RAIZ, 'src/story/itens.js'), encoding='utf-8').read(), re.M))
    return ids


ITENS = itens_validos() | {'tm%03d' % n for n in range(1, 230)} | {'chave_pequena', 'chave_mestra'}
