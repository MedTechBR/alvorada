#!/usr/bin/env python3
"""Converte os .scn (Godot 4.4) do demo para .glb usando o Godot 4.4.1 oficial (macOS), sem janela.

Uso (da raiz):  python3 -I tools/hgss/modelos-glb.py
Pré-requisito: tools/godot/bin/Godot.app (baixe de github.com/godotengine/godot/releases/tag/4.4.1-stable,
Godot_v4.4.1-stable_macos.universal.zip, e confira o SHA512-SUMS.txt). tools/godot/ fica fora do git.

Passos: monta tools/godot/projeto/ com as cenas e as texturas (as cenas apontam para .png; o demo guardou .webp,
então convertemos), importa, roda exportar_glb.gd e copia o resultado para assets/hgss/modelos/.
"""
import os
import shutil
import subprocess
import sys

from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODELOS = os.path.join(RAIZ, 'referencias', 'pba', 'assets', 'models')
PROJ = os.path.join(RAIZ, 'tools', 'godot', 'projeto')
GODOT = os.path.join(RAIZ, 'tools', 'godot', 'bin', 'Godot.app', 'Contents', 'MacOS', 'Godot')
SAIDA = os.path.join(RAIZ, 'assets', 'hgss', 'modelos')

PROJECT = '''config_version=5

[application]
config/name="conversor-glb"

[importer_defaults]
texture={
"compress/mode": 0,
"detect_3d/compress_to": 0,
"mipmaps/generate": false
}

[rendering]
textures/vram_compression/import_s3tc_bptc=false
'''


def main():
    if os.path.isdir(PROJ):
        shutil.rmtree(PROJ)
    dst = os.path.join(PROJ, 'assets', 'models')
    shutil.copytree(MODELOS, dst)
    n = 0
    for raiz, _, arqs in os.walk(dst):
        for f in arqs:
            if f.endswith('.webp'):
                p = os.path.join(raiz, f)
                Image.open(p).convert('RGBA').save(p[:-5] + '.png')
                os.remove(p)
                n += 1
    # a cena da Kenney "town" aponta para Textures/colormap.png, que o demo nao trouxe: usa a paleta da suburban
    sub = os.path.join(dst, 'kenney', 'suburban', 'Textures', 'colormap.png')
    alvo = os.path.join(dst, 'kenney', 'town', 'Textures', 'colormap.png')
    os.makedirs(os.path.dirname(alvo), exist_ok=True)
    shutil.copyfile(sub, alvo)
    # a pokedex usa um .jpg que nao veio: sem ele a cena carrega sem textura
    shutil.copyfile(os.path.join(RAIZ, 'tools', 'hgss', 'exportar_glb.gd'), os.path.join(PROJ, 'exportar_glb.gd'))
    open(os.path.join(PROJ, 'project.godot'), 'w').write(PROJECT)
    print('texturas convertidas:', n)
    subprocess.run([GODOT, '--headless', '--path', PROJ, '--import'], check=False, timeout=900)
    r = subprocess.run([GODOT, '--headless', '--path', PROJ, '--script', 'res://exportar_glb.gd'], capture_output=True, text=True, timeout=1800)
    print(r.stdout[-3000:], r.stderr[-1500:])
    saida = os.path.join(PROJ, 'saida')
    if os.path.isdir(saida):
        if os.path.isdir(SAIDA):
            shutil.rmtree(SAIDA)
        shutil.copytree(saida, SAIDA)
        tot = sum(os.path.getsize(os.path.join(a, f)) for a, _, fs in os.walk(SAIDA) for f in fs)
        print('glb em', SAIDA, '%.1f MB' % (tot / 1e6))


if __name__ == '__main__':
    main()
