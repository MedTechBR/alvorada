#!/usr/bin/env python3
"""Personagens HGSS/FRLG do demo para o formato do jogo (4 direções x quadros de andar).

Uso (da raiz):  python3 -I tools/hgss/personagens.py

Entrada: referencias/pba/assets/sprites/*.webp (FRLG) e sprites/hd2d/*.webp (HGSS, Dawn, Lucas, Ethan...).
Todas as folhas do demo têm 96x128: 3 colunas x 4 linhas de 32x32. Colunas: 0 = parado, 1 e 2 = passos.
Linhas do demo: baixo, esquerda, direita, cima. Aqui as linhas são reordenadas para o padrão do jogo
(src/sprites/characters.js): baixo, cima, esquerda, direita.
Ciclo de andar = colunas [0, 1, 0, 2].

Saída: assets/hgss/personagens/<id>.webp (96x128, linhas down/up/left/right) e indice.json com
  { fw, fh, colunas, direcoes, andar, personagens: {id: {n, grupo, pe}}, looks: {look do jogo: id} }.
"""
import json
import os
import re
import shutil

from PIL import Image

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DEMO = os.path.join(RAIZ, 'referencias', 'pba', 'assets', 'sprites')
SAIDA = os.path.join(RAIZ, 'assets', 'hgss', 'personagens')

# Nosso `look` (src/sprites/charart.js PRESETS, src/sprites/npc.js LOOKS e o elenco) -> id do sprite parecido
LOOKS = {
    'menino': 'frlg_trainer', 'menina': 'frlg_trainer_green',
    'professor': 'frlg_oak', 'prof': 'frlg_oak', 'mae': 'npc_126_mom', 'mom': 'npc_126_mom',
    'rival': 'frlg_rival', 'treinador': 'npc_023_youngster', 'treinadora': 'npc_002_ace_trainer_f',
    'montanhista': 'npc_046_hiker', 'hiker': 'npc_046_hiker',
    'youngster': 'frlg_youngster', 'bugcatcher': 'frlg_bug_catcher', 'leader': 'frlg_brock',
    'nurse': 'npc_115_nurse_1', 'enfermeira': 'npc_115_nurse_1',
    # elenco e classes comuns
    'cientista': 'frlg_scientist', 'lojista': 'frlg_clerk', 'balconista': 'frlg_clerk', 'vendedor': 'npc_113_mart_m',
    'vendedora': 'npc_114_mart_f', 'velho': 'frlg_oldman', 'idoso': 'npc_073_elder', 'senhora': 'frlg_woman',
    'mulher': 'frlg_woman', 'moca': 'frlg_lass', 'menininha': 'frlg_little_girl', 'garoto': 'frlg_kid',
    'campista': 'frlg_camper', 'acampante': 'frlg_camper', 'guia': 'frlg_gym_guide', 'lider': 'npc_148_gym_leader_brock',
    'pescador': 'npc_068_fisherman', 'marinheiro': 'npc_033_sailor', 'nadador': 'npc_027_swimmer_m', 'nadadora': 'npc_029_swimmer_f',
    'esquiador': 'npc_011_skier_m', 'esquiadora': 'npc_012_skier_f', 'faixa_preta': 'npc_007_black_belt',
    'ciclista': 'npc_019_cyclist_m', 'ciclista_f': 'npc_020_cyclist_f', 'policial': 'npc_088_policeman',
    'motoqueiro': 'npc_018_biker', 'fazendeiro': 'npc_034_rancher', 'cavalheiro': 'npc_036_gentleman',
    'dama': 'npc_043_lady', 'beleza': 'npc_044_beauty', 'palhaco': 'npc_047_clown', 'trabalhador': 'npc_080_worker',
    'garcom': 'npc_064_waiter', 'garconete': 'npc_065_waitress', 'medium': 'npc_078_medium', 'sabio': 'npc_072_sage',
    'psiquico': 'npc_082_psychic', 'ladrao': 'npc_085_burglar', 'artista': 'npc_070_artist', 'violonista': 'npc_069_guitarist',
    'estudante': 'npc_056_school_kid_m', 'estudante_f': 'npc_058_school_kid_f', 'corredor': 'npc_087_jogger',
    'equipe_foguete': 'npc_184_rocket_grunt_m', 'brendan': 'brendan_running', 'may': 'may_running',
    'red': 'npc_180_champion_red', 'leaf': 'frlg_trainer_green', 'ethan': 'npc_203_ethan', 'lyra': 'npc_206_lyra',
    'lucas': 'npc_198_lucas', 'dawn': 'npc_201_dawn', 'silver': 'npc_139_silver', 'daisy': 'frlg_daisy', 'carvalho': 'npc_136_prof_oak',
    'elm': 'npc_137_prof_elm', 'rowan': 'npc_138_prof_rowan', 'kurt': 'npc_129_kurt',
}
# jogador por personagem criado (menino/menina): FRLG Red/Leaf, ou Brendan/May (corrida)
JOGADOR = {'m': {'frlg': 'frlg_trainer', 'hgss': 'npc_203_ethan', 'rse': 'brendan_running'},
           'f': {'frlg': 'frlg_trainer_green', 'hgss': 'npc_206_lyra', 'rse': 'may_running'}}


def slug(nome):
    return re.sub(r'_+', '_', re.sub(r'[^a-z0-9]+', '_', nome.lower())).strip('_')


def reordena(im):
    """linhas do demo (baixo, esquerda, direita, cima) -> (baixo, cima, esquerda, direita)"""
    w, h = im.size
    lh = h // 4
    linhas = [im.crop((0, i * lh, w, (i + 1) * lh)) for i in range(4)]
    novo = Image.new('RGBA', im.size, (0, 0, 0, 0))
    for dst, src in enumerate((0, 3, 1, 2)):
        novo.paste(linhas[src], (0, dst * lh))
    return novo


def pe_da_folha(im):
    b = im.getchannel('A').getbbox()
    return b[3] % 32 if b and b[3] % 32 else 31


def main():
    os.makedirs(SAIDA, exist_ok=True)
    pers = {}
    total = 0

    def um(arq, id_, nome, grupo):
        nonlocal total
        im = Image.open(arq).convert('RGBA')
        if im.size != (96, 128):
            return False
        out = reordena(im)
        # pé: maior linha ocupada dentro das células (todas as células têm o mesmo chão)
        pe = max(((c.getchannel('A').getbbox() or (0, 0, 0, 0))[3]) for c in
                 [out.crop((i * 32, j * 32, i * 32 + 32, j * 32 + 32)) for i in range(3) for j in range(4)]) - 1
        dest = os.path.join(SAIDA, id_ + '.webp')
        out.save(dest, 'WEBP', lossless=True, quality=100, method=6)
        total += os.path.getsize(dest)
        pers[id_] = {'n': nome, 'grupo': grupo, 'pe': pe}
        return True

    for f in sorted(os.listdir(DEMO)):
        if f.endswith('.webp'):
            base = f[:-5]
            if base.startswith('critter') or base == 'tree':
                continue
            nome = base.replace('npc_', '').replace('_', ' ')
            um(os.path.join(DEMO, f), 'frlg_' + slug(base.replace('npc_', '')), nome, 'frlg')
    for f in sorted(os.listdir(os.path.join(DEMO, 'hd2d'))):
        if f.endswith('.webp'):
            base = f[:-5]
            id_ = slug(base)
            nome = re.sub(r'^NPC_\d+_?', '', base).replace('_', ' ') or base
            um(os.path.join(DEMO, 'hd2d', f), id_, nome, 'hd2d')
    # criaturinhas (2 colunas x 4 linhas) e a árvore, copiadas como estão
    os.makedirs(os.path.join(SAIDA, 'outros'), exist_ok=True)
    for f in ('critter_bird', 'critter_green', 'critter_purple', 'tree'):
        shutil.copyfile(os.path.join(DEMO, f + '.webp'), os.path.join(SAIDA, 'outros', f + '.webp'))
    falta = [(k, v) for k, v in LOOKS.items() if v not in pers]
    assert not falta, falta
    json.dump({'versao': 1, 'fw': 32, 'fh': 32, 'colunas': 3, 'direcoes': ['down', 'up', 'left', 'right'],
               'andar': [0, 1, 0, 2], 'parado': 0, 'personagens': pers, 'looks': LOOKS, 'jogador': JOGADOR,
               'outros': {'critter_bird': {'fw': 32, 'fh': 32, 'colunas': 2}, 'critter_green': {'fw': 32, 'fh': 32, 'colunas': 2},
                          'critter_purple': {'fw': 32, 'fh': 32, 'colunas': 2}, 'tree': {'fw': 48, 'fh': 64, 'colunas': 1}}},
              open(os.path.join(SAIDA, 'indice.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('personagens: %d, %.2f MB' % (len(pers), total / 1e6))


if __name__ == '__main__':
    main()
