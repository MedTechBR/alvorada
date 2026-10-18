#!/usr/bin/env python3
"""Gera os dados do jogo (src/data/gen/*.js) a partir dos CSVs da PokéAPI.

Uso (a partir da raiz do repositório):
    python3 -I tools/pokeapi/importar.py dados-brutos/pokeapi dados-brutos/spritecollab/tracker.json src/data/gen

Fontes (baixadas para pastas próprias, ignoradas pelo git):
  - dados-brutos/pokeapi/*.csv  <- github.com/PokeAPI/pokeapi, pasta data/v2/csv (branch master)
  - dados-brutos/spritecollab/tracker.json <- github.com/PMDCollab/SpriteCollab (raiz)

Os CSVs são tratados como dados: só são lidos com o módulo csv. Nomes em português ficam em
tools/pokeapi/golpes_pt.tsv e habilidades_pt.tsv (a PokéAPI quase não tem pt-BR).

Escolhas:
  - Espécies: todas as 1025 da Pokédex Nacional (gerações 1 a 9), com as formas (regionais, Mega, Primitiva,
    Gigantamax, de batalha, de gênero e alternativas) em `forms` dentro da espécie. Veja o comentário de EXCLUI.
  - Golpes: Scarlet/Violet (grupo de versão 25); quem não está em SV usa a geração mais recente com
    dados (VG_ORDER). Os Max Golpes vêm da PokéAPI; os Gigantamax (GMAX) são dados à mão.
  - MT = as 229 MTs de SV. Golpes que a espécie aprendia por máquina num jogo antigo e que não são MT
    em SV viram golpes de "ensino" (tutor).
  - Sprites: tools/pokeapi/formas_pmd.json diz de que subpasta do SpriteCollab vem cada forma (tools/pmd_baixar.py).
"""
import csv
import json
import os
import re
import sys
from collections import defaultdict

D, TRACKER, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
EN, PT = '9', '13'


def rd(name):
    with open(os.path.join(D, name + '.csv'), encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def camel(ident):
    parts = [p for p in re.split(r'[-\s]+', ident) if p]
    return parts[0] + ''.join(p[:1].upper() + p[1:] for p in parts[1:])


def num(v, default=None):
    return default if v in ('', None) else int(v)


def num0(v):
    # alguns golpes novos vêm com 0 no lugar de vazio (poder/precisão "—")
    n = num(v)
    return None if not n else n


def tsv(name):
    out = {}
    with open(os.path.join(HERE, name), encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if not line or line.startswith('#'):
                continue
            k, v = line.split('\t')
            out[k] = v
    return out


MOVE_PT = tsv('golpes_pt.tsv')
ABIL_PT = tsv('habilidades_pt.tsv')

# ---------------------------------------------------------------- tabelas básicas
species = {int(r['id']): r for r in rd('pokemon_species')}
pokemon = {int(r['id']): r for r in rd('pokemon')}
default_pk = {int(r['species_id']): int(r['id']) for r in pokemon.values() if r['is_default'] == '1'}
types = {r['id']: r['identifier'] for r in rd('types')}
items = {r['id']: r for r in rd('items')}
moves = {int(r['id']): r for r in rd('moves')}
move_by_ident = {r['identifier']: int(r['id']) for r in moves.values()}
meta = {int(r['move_id']): r for r in rd('move_meta')}
targets = {r['id']: r['identifier'] for r in rd('move_targets')}
flags_name = {r['id']: r['identifier'] for r in rd('move_flags')}
ailments = {r['id']: r['identifier'] for r in rd('move_meta_ailments')}
move_flags = defaultdict(set)
for r in rd('move_flag_map'):
    move_flags[int(r['move_id'])].add(flags_name[r['move_flag_id']])
stat_changes = defaultdict(list)
for r in rd('move_meta_stat_changes'):
    stat_changes[int(r['move_id'])].append((int(r['stat_id']), int(r['change'])))
names = {}
for r in rd('pokemon_species_names'):
    if r['local_language_id'] in (EN, PT):
        names.setdefault(int(r['pokemon_species_id']), {})[r['local_language_id']] = r['name']
move_names_en = {int(r['move_id']): r['name'] for r in rd('move_names') if r['local_language_id'] == EN}
move_names_pt = {int(r['move_id']): r['name'] for r in rd('move_names') if r['local_language_id'] == PT}
abil = {int(r['id']): r for r in rd('abilities')}
abil_en = {int(r['ability_id']): r['name'] for r in rd('ability_names') if r['local_language_id'] == EN}
abil_pt = {int(r['ability_id']): r['name'] for r in rd('ability_names') if r['local_language_id'] == PT}
abil_short = {}
for r in rd('ability_prose'):
    if r['local_language_id'] == EN:
        abil_short[int(r['ability_id'])] = r['short_effect']

GROWTH = {'1': 's', '2': 'mf', '3': 'f', '4': 'ms', '5': 'e', '6': 'fl'}
STAT_KEY = {1: 'hp', 2: 'atk', 3: 'def', 4: 'spa', 5: 'spd', 6: 'spe', 7: 'acc', 8: 'eva'}
CAT = {'1': 'status', '2': 'phys', '3': 'spec'}
SHAPE_BODY = {'1': 'blob', '2': 'serpent', '3': 'fish', '4': 'blob', '5': 'blob', '6': 'biped', '7': 'biped',
              '8': 'quad', '9': 'bird', '10': 'blob', '11': 'blob', '12': 'biped', '13': 'flyer', '14': 'worm'}

# ---------------------------------------------------------------- seleção de espécies: todas as nacionais (1 a 1025)
SEL = sorted(s for s in species if s <= 1025)
LUMIOSE = [int(r['species_id']) for r in sorted((r for r in rd('pokemon_dex_numbers') if r['pokedex_id'] == '34'),
                                                key=lambda r: int(r['pokedex_number']))]
# golpes citados no roteiro (ids do jogo, camelCase): continuam garantidos mesmo que nenhuma espécie os aprenda
GOLPES_HISTORIA = '''absorb accelerock acidSpray acrobatics aerialAce agility airCutter airSlash amnesia ancientPower aquaJet
armThrust armorCannon astonish attract auraSphere bide bind bite bodyPress boomburst braveBird brickBreak bubble bubbleBeam
bugBite bugBuzz bulkUp bulldoze bulletPunch bulletSeed calmMind charge closeCombat confuseRay confusion cottonGuard
cottonSpore counter crunch crushClaw curse darkPulse darkestLariat dazzlingGleam defenseCurl defog detect disable discharge
doubleTeam dragonBreath dragonClaw dragonDance dragonPulse drainingKiss earthPower earthquake echoedVoice ember endeavor
energyBall explosion extrasensory extremeSpeed fairyWind fakeOut feintAttack fieryDance fireLash flail flameBurst
flameCharge flameWheel flamethrower flareBlitz flashCannon focusEnergy forcePalm foulPlay furyCutter furySwipes gearGrind
gigaDrain gigatonHammer growl gust gyroBall harden haze headbutt heatWave hex hornAttack howl hurricane hyperVoice hypnosis
iceFang iceShard ironDefense ironHead ironTail karateChop knockOff leechLife leechSeed leer lick lowKick magnetBomb meditate
metalClaw meteorMash mirrorMove mirrorShot moonblast moongeistBeam moonlight morningSun mudSlap mysticalFire nastyPlot
nightDaze nightShade nightSlash nuzzle ominousWind outrage parabolicCharge payback peck petalBlizzard photonGeyser playRough
poisonGas poisonPowder poisonSting pound powerGem powerUpPunch psybeam psychic psychoCut psyshock pursuit quickAttack
quiverDance rapidSpin razorLeaf recover reflect revenge roar rockBlast rockSlide rockThrow rockTomb rollout roost round
saltCure sandAttack sandTomb scald scaryFace scratch screech selfDestruct shadowBall shadowClaw shadowPunch shadowSneak
shiftGear sludgeBomb sludgeWave smog smokescreen snarl sonicBoom spark spikes spiritBreak splash stealthRock steelWing
stoneEdge stringShot struggleBug suckerPunch sunsteelStrike superpower supersonic surf sweetKiss sweetScent swift
swordsDance tackle tailWhip tailwind takeDown thunderShock thunderWave thunderbolt toxic triAttack trickRoom tripleKick
twister uTurn waterGun waterPulse waterfall waterSport wildCharge willOWisp wingAttack yawn zenHeadbutt'''.split()

# ---------------------------------------------------------------- formas
# Formas com dados próprios (linhas de pokemon.csv além da padrão) e formas visuais (pokemon_forms.csv) que têm
# tipo próprio (Arceus, Silvally) ou sprite próprio no SpriteCollab. Ficam de fora: Pokémon Dominantes (totem),
# Pikachu de boné e fantasia, os "starter" de Let's Go, Zygarde/Greninja que só mudam a habilidade, as cores de
# meteoro do Minior (iguais à padrão), os modos de passeio de Koraidon/Miraidon e as 63 coberturas de Alcremie.
EXCLUI = re.compile(r'(totem|-cap$|^pikachu-(rock-star|belle|pop-star|phd|libre|cosplay|starter)$|^eevee-starter$|'
                    r'power-construct|battle-bond|^koraidon-|^miraidon-|^minior-.*-meteor$|^alcremie-(?!gmax$)|^arceus-unknown$)')
REGIOES = ('alola', 'galar', 'hisui', 'paldea')
pforms = rd('pokemon_forms')
form_row = {int(r['id']): r for r in pforms}
pk_default_form = {int(r['pokemon_id']): r for r in pforms if r['is_default'] == '1'}
form_types = defaultdict(list)
for r in sorted(rd('pokemon_form_types'), key=lambda r: int(r['slot'])):
    form_types[int(r['pokemon_form_id'])].append(types[r['type_id']])
form_name_en = {int(r['pokemon_form_id']): (r['form_name'], r['pokemon_name']) for r in rd('pokemon_form_names')
                if r['local_language_id'] == EN}
tracker = json.load(open(TRACKER, encoding='utf-8'))


def form_key(sid, ident):
    """Identificador da forma no jogo: o sufixo do nome da PokéAPI em camelCase, sem o sufixo da forma padrão
    (toxtricity-amped-gmax → gmax; darmanitan-galar-standard → galar; urshifu-rapid-strike-gmax → rapidStrikeGmax)."""
    base = species[sid]['identifier']
    suf = ident[len(base) + 1:] if ident.startswith(base + '-') else ident
    dflt = pokemon[default_pk[sid]]['identifier']
    dsuf = dflt[len(base) + 1:] if dflt.startswith(base + '-') else ''
    if dsuf and suf.startswith(dsuf + '-'):
        suf = suf[len(dsuf) + 1:]
    elif dsuf and suf.endswith('-' + dsuf):
        suf = suf[:-len(dsuf) - 1]
    return camel(suf)


def kind_of(ident, frow, has_row):
    toks = ident.split('-')
    if frow.get('is_mega') == '1':
        return 'mega'
    if 'primal' in toks:
        return 'primal'
    if 'gmax' in toks:
        return 'gmax'
    if frow.get('is_battle_only') == '1':
        return 'battle'
    if any(t in REGIOES for t in toks[1:]):
        return 'regional'
    if toks[-1] in ('female', 'male'):
        return 'gender'
    return 'alt' if has_row else 'visual'


# --- sprites do SpriteCollab por forma: nome da subpasta (Alola, Mega_X, Pom_Pom…) → identificador da forma
SC_MANUAL = {  # forma da PokéAPI → nome da subpasta no SpriteCollab, quando a regra automática não acha
    'oricorio-pau': 'Pa_U', 'toxtricity-low-key': 'Lowkey', 'zacian-crowned': 'Crowned_Sword', 'zamazenta-crowned': 'Crowned_Shield',
    'dudunsparce-three-segment': 'Three', 'maushold-family-of-three': 'Three', 'wormadam-sandy': 'Sand', 'burmy-sandy': 'Sand',
    'mothim-sandy': 'Sand', 'tauros-paldea-combat-breed': 'Paldea', 'basculin-blue-striped': 'Blue', 'basculin-white-striped': 'White',
    'ogerpon-wellspring-mask': 'Wellspring_Mask', 'ogerpon-hearthflame-mask': 'Hearthflame_Mask', 'ogerpon-cornerstone-mask': 'Cornerstone_Mask',
    'vivillon-savanna': 'Savannah', 'vivillon-poke-ball': 'Pokeball', 'unown-question': 'Question', 'unown-exclamation': 'Exclamation',
    'pichu-spiky-eared': 'Spiky', 'cherrim-sunshine': 'Sunshine', 'necrozma-dusk': 'Dusk_Mane', 'necrozma-dawn': 'Dawn_Wings', 'calyrex-ice': 'Ice_Rider', 'calyrex-shadow': 'Shadow_Rider',
    'zygarde-10': '10', 'zygarde-complete': 'Complete', 'magearna-original': 'Original', 'darmanitan-galar-zen': 'Galar_Zen',
    'gimmighoul-roaming': 'Roaming', 'eternatus-eternamax': 'Eternamax', 'palafin-hero': 'Hero', 'tatsugiri-droopy': 'Droopy',
    'tatsugiri-stretchy': 'Stretchy', 'terapagos-terastal': 'Terastal', 'ursaluna-bloodmoon': 'Bloodmoon',
    'squawkabilly-blue-plumage': 'Blue', 'squawkabilly-yellow-plumage': 'Yellow', 'squawkabilly-white-plumage': 'White',
    'minior-red': 'Red', 'minior-orange': 'Orange', 'minior-yellow': 'Yellow', 'minior-green': 'Green', 'minior-blue': 'Blue',
    'minior-indigo': 'Indigo', 'minior-violet': 'Violet', 'urshifu-rapid-strike-gmax': None, 'toxtricity-low-key-gmax': None,
}


def sc_subgroups(dex):
    t = tracker.get('%04d' % dex) or {}
    out = {}
    for sk, sv in (t.get('subgroups') or {}).items():
        sf = sv.get('sprite_files') or {}
        if sk != '0000' and ('Idle' in sf or 'Walk' in sf):
            out[(sv.get('name') or '').strip()] = f'{dex:04d}/{sk}'
    # fêmea da forma padrão: sprite/<dex>/0000/0000/0002
    fem = (((t.get('subgroups') or {}).get('0000') or {}).get('subgroups') or {}).get('0000', {}).get('subgroups', {}).get('0002')
    if fem and ('Idle' in (fem.get('sprite_files') or {}) or 'Walk' in (fem.get('sprite_files') or {})):
        out['Female'] = f'{dex:04d}/0000/0000/0002'
    return out


def sc_path(dex, ident, key):
    subs = sc_subgroups(dex)
    if ident in SC_MANUAL:
        n = SC_MANUAL[ident]
        return subs.get(n) if n else None
    base = species[dex]['identifier']
    suf = ident[len(base) + 1:] if ident.startswith(base + '-') else ident
    norm = {k.lower().replace('_', '-'): v for k, v in subs.items()}
    for cand in (suf, re.sub(r'-(breed|mask|standard|striped|plumage|segment|build|mode|cloak|forme?|style|strike)$', '', suf),
                 suf.replace('-', ''), suf.split('-')[0] if suf.split('-')[0] in REGIOES else None):
        if cand and cand in norm:
            return norm[cand]
    return None


def sc_has_base(dex):
    sf = (tracker.get('%04d' % dex) or {}).get('sprite_files') or {}
    return 'Idle' in sf or 'Walk' in sf


FORMAS = {}  # (sid, key) -> {'pk': id de pokemon.csv ou None, 'form_id', 'ident', 'kind', 'sc'}
for pid, p in sorted(pokemon.items()):
    sid = int(p['species_id'])
    if pid == default_pk.get(sid) or sid > 1025 or EXCLUI.search(p['identifier']):
        continue
    fr = pk_default_form.get(pid, {})
    key = form_key(sid, p['identifier'])
    FORMAS[(sid, key)] = {'pk': pid, 'form_id': int(fr['id']) if fr else None, 'ident': p['identifier'],
                          'kind': kind_of(p['identifier'], fr, True), 'sc': sc_path(sid, p['identifier'], key)}
for r in pforms:
    pid = int(r['pokemon_id'])
    sid = int(pokemon[pid]['species_id'])
    if r['is_default'] == '1' or pid != default_pk.get(sid) or EXCLUI.search(r['identifier']):
        continue
    key = camel(r['form_identifier'])
    sc = sc_path(sid, r['identifier'], key)
    if not (sc or form_types.get(int(r['id']))):
        continue  # visual e sem sprite próprio: não acrescenta nada
    FORMAS[(sid, key)] = {'pk': None, 'form_id': int(r['id']), 'ident': r['identifier'],
                          'kind': kind_of(r['identifier'], r, False), 'sc': sc}
# forma de pokemon_forms (id) -> (espécie, chave da forma ou None = padrão)
FORM_OF_FID = {}
for (sid, key), f in FORMAS.items():
    if f['form_id']:
        FORM_OF_FID[f['form_id']] = (sid, key)

# ---------------------------------------------------------------- golpes por espécie
VG_ORDER = [25, 20, 24, 23, 18, 17, 16, 15, 19, 14, 11, 8]  # SV, SwSh, LA, BDSP, USUM, SM, ORAS, XY, LGPE, B2W2, BW, HGSS
VG_NAME = {25: 'scarlet-violet', 20: 'sword-shield', 24: 'legends-arceus', 23: 'brilliant-diamond-shining-pearl',
           18: 'ultra-sun-ultra-moon', 17: 'sun-moon', 16: 'omega-ruby-alpha-sapphire', 15: 'x-y', 19: 'lets-go',
           14: 'black-2-white-2', 11: 'black-white', 8: 'heartgold-soulsilver'}
pm = defaultdict(list)
for r in rd('pokemon_moves'):
    vg = int(r['version_group_id'])
    if vg in VG_ORDER and r['pokemon_move_method_id'] in ('1', '3', '4', '10'):
        pm[(int(r['pokemon_id']), vg)].append(r)

SV_TM = {}
for r in rd('machines'):
    if r['version_group_id'] == '25':
        SV_TM[int(r['move_id'])] = int(r['machine_number'])


def learnset(pk):
    vg = next((v for v in VG_ORDER if pm.get((pk, v))), None)
    if vg is None:
        return None
    lv, tm, tutor = [], set(), set()
    for r in pm[(pk, vg)]:
        mid = int(r['move_id'])
        meth = r['pokemon_move_method_id']
        if meth == '1':
            lv.append((int(r['level'] or 0), int(r['order'] or 0), mid))
        elif meth == '10':  # aprende ao mudar de forma (Rotom): vira golpe de nível 0
            lv.append((0, 0, mid))
        elif meth == '4' and mid in SV_TM:
            tm.add(mid)
        else:
            tutor.add(mid)
    tutor -= tm
    lv = sorted(set(lv))
    return lv, tm, tutor, vg


learnsets, used_moves = {}, set()
for s in SEL:
    ls = learnset(default_pk[s])
    if ls is None:
        raise SystemExit(f'sem golpes: {s}')
    learnsets[s] = ls
    used_moves |= {m for _, _, m in ls[0]} | ls[1] | ls[2]
form_learn = {}
for (sid, key), f in FORMAS.items():
    if f['pk'] and f['kind'] in ('regional', 'alt', 'gender'):
        ls = learnset(f['pk'])
        if ls:
            form_learn[(sid, key)] = ls
            used_moves |= {m for _, _, m in ls[0]} | ls[1] | ls[2]

# golpes que o jogo já usava continuam existindo (saves antigos)
for ident in ['rage', 'twineedle', 'bubble', 'mud-sport', 'magnitude', 'pursuit', 'struggle', 'karate-chop']:
    used_moves.add(move_by_ident[ident])
# os Max Golpes (Dynamax) e o Canhão Dynamax: dados para a mecânica de Dynamax/Gigantamax
for ident, mid in move_by_ident.items():
    if ident.startswith('max-') or ident == 'dynamax-cannon':
        used_moves.add(mid)
# e os do roteiro (camelCase -> identificador da PokéAPI)
by_camel = {camel(k): v for k, v in move_by_ident.items()}
for c in GOLPES_HISTORIA:
    if c not in by_camel:
        raise SystemExit(f'golpe do roteiro sem dados na PokéAPI: {c}')
    used_moves.add(by_camel[c])

# ---------------------------------------------------------------- evoluções
REGIAO = {'7': 'alola', '8': 'galar', '9': 'hisui', '10': 'paldea'}
for r in rd('regions') if os.path.exists(os.path.join(D, 'regions.csv')) else []:
    REGIAO.setdefault(r['id'], r['identifier'])


def item_id(iid):
    return camel(items[iid]['identifier']) if iid else None


NATURE_BY_ID = {}
for r in rd('natures'):
    NATURE_BY_ID[int(r['id'])] = r['identifier']


def natures_of(mask):
    # bitmask pela ordem de natures.csv (id 1 = bit 0)
    m = int(mask)
    return sorted(NATURE_BY_ID[i + 1] for i in range(25) if m >> i & 1 and (i + 1) in NATURE_BY_ID)


ADAPT_NIVEL = {  # evoluções que dependem de algo que o tempo real não tem: nível de troca (original na nota)
    'runerigus': (34, 'original: sofrer 49 de dano sem desmaiar e passar pelo arco de pedra'),
    'basculegion': (36, 'original: sofrer 294 de dano de recuo sem desmaiar'),
    'pawmot': (32, 'original: andar 1.000 passos fora da Poké Bola e subir de nível'),
    'brambleghast': (30, 'original: andar 1.000 passos fora da Poké Bola e subir de nível'),
    'rabsca': (30, 'original: andar 1.000 passos fora da Poké Bola e subir de nível'),
    'melmetal': (45, 'original: 400 Doces de Meltan (Pokémon GO)'),
    'maushold': (25, None), 'palafin': (38, 'original: subir de nível no Círculo da União (multijogador)'),
}
ADAPT_ITEM = {
    'sirfetchd': ('leek', 'original: três acertos críticos na mesma batalha; aqui, usar o Alho-Poró'),
    'kingambit': ('leadersCrest', 'original: derrotar três Bisharp que seguram o Brasão do Líder'),
    'gholdengo': ('gimmighoulCoin', 'original: subir de nível com 999 Moedas de Gimmighoul; aqui, usar a moeda'),
}


def evo_entry(to, r):
    e = {'to': to}
    trig = r['evolution_trigger_id']
    tname = species[to]['identifier']
    if r['minimum_level']:
        e['level'] = int(r['minimum_level'])
    if r['minimum_happiness'] or r['minimum_affection']:
        e['friendship'] = 160
    if r['time_of_day']:
        e['time'] = {'full-moon': 'fullMoon'}.get(r['time_of_day'], r['time_of_day'])
    if r['gender_id']:
        e['gender'] = 'f' if r['gender_id'] == '1' else 'm'
    if r['known_move_id']:
        e['move'] = camel(moves[int(r['known_move_id'])]['identifier'])
    if r['used_move_id']:  # "use o golpe 20 vezes" -> adaptação: subir de nível sabendo o golpe
        e['move'] = camel(moves[int(r['used_move_id'])]['identifier'])
        e['note'] = f"original: usar o golpe {r['minimum_move_count'] or 20} vezes"
    if r['known_move_type_id']:
        e['moveType'] = types[r['known_move_type_id']]
    if r['needs_overworld_rain'] == '1':
        e['rain'] = True
    if r['party_type_id']:
        e['partyType'] = types[r['party_type_id']]
    if r['party_species_id']:
        e['partySpecies'] = int(r['party_species_id'])
    if r['relative_physical_stats']:
        e['atkDef'] = int(r['relative_physical_stats'])  # 1: Ataque > Defesa; -1: Ataque < Defesa; 0: iguais
    if r['nature_bitmask']:
        e['natures'] = natures_of(r['nature_bitmask'])
    if r['condition_expression'] and r['percentage_chance'] == '50':  # Wurmple: metade vira Silcoon, metade Cascoon
        e['split'] = 0 if 'silcoon' in tname else 1
        e['note'] = 'original: depende de um valor escondido; aqui, do identificador do Pokémon'
    if r['turn_upside_down'] == '1':
        e['note'] = 'original: virar o aparelho de cabeça para baixo'
    if r['region_id']:
        e['region'] = REGIAO.get(r['region_id'], r['region_id'])
    if trig == '4':  # Shedinja: surge junto quando Nincada evolui (com espaço na equipe e uma Poké Bola)
        e['level'], e['shed'] = 20, True
        e['note'] = 'aparece junto quando Nincada evolui para Ninjask'
    elif trig == '3':
        e['item'] = item_id(r['trigger_item_id'])
    elif trig == '2':  # troca -> usar o item que ele seguraria, ou o Cordão de Ligação
        e['item'] = item_id(r['held_item_id']) or 'linkingCord'
        e['trade'] = True
        if r['trade_species_id']:
            e['note'] = f"original: troca por um {names[int(r['trade_species_id'])].get(EN)}"
    elif trig == '5':  # Milcery: girar segurando um doce -> usar o doce
        e = {'to': to, 'item': item_id(r['held_item_id']), 'note': 'original: girar segurando o doce'}
    elif r['held_item_id']:  # subir de nível segurando item -> usar o item
        e['item'] = item_id(r['held_item_id'])
        e['note'] = 'original: subir de nível segurando o item'
    if r['minimum_beauty']:
        e['item'] = 'prismScale'
        e['note'] = 'original: beleza alta (ou troca segurando a Escama Prisma)'
    if tname in ADAPT_NIVEL and 'item' not in e and 'move' not in e:
        lv, note = ADAPT_NIVEL[tname]
        e['level'] = max(e.get('level', 0), lv)
        if note:
            e['note'] = note
    if tname in ADAPT_ITEM:
        e = {'to': to, 'item': ADAPT_ITEM[tname][0], 'note': ADAPT_ITEM[tname][1]}
    if trig in ('1', '10') and not any(k in e for k in ('level', 'friendship', 'move', 'moveType', 'item', 'partySpecies')):
        e['level'] = 1  # segurança: sem condição conhecida
    return e


def which_form(fid):
    """id de pokemon_forms -> chave da forma no jogo (None = forma padrão ou forma que o jogo não separa)."""
    if not fid:
        return None
    return FORM_OF_FID.get(int(fid), (None, None))[1]


evo_rows = defaultdict(list)
for r in rd('pokemon_evolution'):
    to = int(r['evolved_species_id'])
    frm = num(species[to]['evolves_from_species_id'])
    if to in species and frm in species and to <= 1025:
        fk = which_form(r['required_pokemon_form_id'])
        tk = which_form(r['evolved_pokemon_form_id'])
        if tk and FORMAS[(to, tk)]['kind'] == 'gender':
            tk = None  # a forma de gênero é aplicada sozinha pelo gênero (src/data/mon.js)
        evo_rows[(frm, fk, to, tk, r['region_id'] or '')].append(r)

evolutions = defaultdict(list)  # (espécie, forma ou None) -> [entradas]
for (frm, fk, to, tk, reg), rows in sorted(evo_rows.items(), key=lambda kv: (kv[0][0], kv[0][1] or '', kv[0][2], kv[0][3] or '', kv[0][4])):
    top = max(int(r['version_group_id']) for r in rows if int(r['version_group_id']) < 28 or len(rows) == 1)
    seen = []
    for r in rows:
        if int(r['version_group_id']) != top:
            continue
        e = evo_entry(to, r)
        if tk:
            e['form'] = tk
        if e not in seen:
            seen.append(e)
    evolutions[(frm, fk)].extend(seen)

for k, evs in evolutions.items():
    # mesma condição para macho e fêmea (formas de gênero, ex.: Meowstic, Oinkologne) -> sem exigência de gênero
    for e in list(evs):
        if e.get('gender') == 'm':
            twin = {**e, 'gender': 'f'}
            if twin in evs:
                evs.remove(twin)
                e.pop('gender')
    # entradas repetidas (Maushold de três/quatro, Dudunsparce de dois/três segmentos)
    uniq = []
    for e in evs:
        if e not in uniq:
            uniq.append(e)
    evs[:] = uniq
    # mesma condição para dois destinos (exclusivos de versão, ex.: Cosmoem → Solgaleo em Sun, Lunala em Moon):
    # adaptação para dia e noite
    for i, e in enumerate(evs):
        for f in evs[i + 1:]:
            same = {a: b for a, b in e.items() if a not in ('to', 'form')} == {a: b for a, b in f.items() if a not in ('to', 'form')}
            if (e['to'], e.get('form')) != (f['to'], f.get('form')) and same and 'time' not in e and not e.get('natures'):
                e['time'], f['time'] = 'day', 'night'
                e['note'] = f['note'] = 'original: exclusivo de versão; aqui depende da hora do dia'

# ---------------------------------------------------------------- habilidades
pk_abil = defaultdict(list)
for r in rd('pokemon_abilities'):
    pk_abil[int(r['pokemon_id'])].append((int(r['slot']), int(r['ability_id']), r['is_hidden'] == '1'))
used_abil = set()

# ---------------------------------------------------------------- tempo real: regras automáticas
WEATHER = {'rain-dance': 'rain', 'sunny-day': 'sun', 'sandstorm': 'sand', 'hail': 'snow', 'snowscape': 'snow'}
TERRAIN = {'grassy-terrain': 'grassy', 'misty-terrain': 'misty', 'electric-terrain': 'electric', 'psychic-terrain': 'psychic'}
HAZARD = {'spikes': 'spikes', 'toxic-spikes': 'toxicSpikes', 'stealth-rock': 'stealthRock', 'sticky-web': 'stickyWeb'}
SELF_T = {'user', 'users-field', 'user-and-allies', 'all-allies', 'user-or-ally', 'ally', 'entire-field', 'specific-move'}
SPREAD_T = {'all-opponents', 'all-other-pokemon', 'all-pokemon'}
DASH_WORDS = ('tackle', 'charge', 'rush', 'wheel', 'blitz', 'take-down', 'double-edge', 'head-smash', 'brave-bird',
              'extreme-speed', 'quick-attack', 'aqua-jet', 'wave-crash', 'skull-bash', 'lunge', 'pounce', 'u-turn',
              'flip-turn', 'volt-switch', 'shadow-sneak', 'accelerock', 'first-impression', 'dragon-rush',
              'steel-roller', 'rollout', 'flame-charge', 'grassy-glide', 'psyshield-bash', 'headbutt', 'zen-headbutt',
              'iron-head', 'horn-attack', 'megahorn', 'giga-impact', 'smart-strike', 'spark', 'nuzzle', 'body-slam',
              'heavy-slam', 'heat-crash', 'high-horsepower', 'stomping-tantrum', 'bounce', 'fly', 'dig', 'dive',
              'phantom-force', 'sky-attack', 'feint', 'fake-out', 'sucker-punch', 'upper-hand', 'bullet-punch',
              'mach-punch', 'vacuum-wave', 'pursuit', 'retaliate', 'supercell-slam')
CONE_WORDS = ('breath', 'wind', 'gust', 'twister', 'blizzard', 'heat-wave', 'powder-snow', 'air-cutter', 'petal-blizzard',
              'smog', 'snarl', 'incinerate', 'lava-plume', 'inferno', 'burning-jealousy', 'acid-spray', 'mist-ball',
              'scorching-sands', 'mud-slap', 'leaf-storm', 'clear-smog', 'fire-spin', 'sand-tomb', 'whirlpool',
              'aromatic-mist', 'sweet-scent', 'sand-attack', 'smokescreen', 'whirlwind', 'roar', 'teeter-dance')
FIXED = {'seismic-toss': 'level', 'night-shade': 'level', 'super-fang': 'half', 'endeavor': 'endeavor',
         'final-gambit': 'gambit', 'dragon-rage': 40, 'sonic-boom': 20, 'psywave': 'level', 'counter': 'counter',
         'mirror-coat': 'counter', 'metal-burst': 'counter', 'comeuppance': 'counter', 'bide': 'counter'}
VARPOWER = {'low-kick': 'weight', 'grass-knot': 'weight', 'heavy-slam': 'weightRatio', 'heat-crash': 'weightRatio',
            'gyro-ball': 'gyro', 'electro-ball': 'electro', 'eruption': 'hpHigh', 'water-spout': 'hpHigh',
            'flail': 'hpLow', 'reversal': 'hpLow', 'return': 'friendship', 'frustration': 'unfriendship',
            'magnitude': 'magnitude', 'present': 'present', 'stored-power': 'boosts', 'power-trip': 'boosts',
            'hex': 'hex', 'facade': 'facade', 'acrobatics': 'acrobatics', 'venoshock': 'venoshock', 'brine': 'brine',
            'fling': 'fling', 'natural-gift': 'naturalGift', 'rage-fist': 'rageFist', 'weather-ball': 'weatherBall',
            'terrain-pulse': 'terrainPulse', 'hard-press': 'hpTarget', 'knock-off': 'knockOff',
            'hidden-power': 'hiddenPower', 'triple-axel': 'tripleAxel', 'beat-up': 'beatUp', 'spit-up': 'stockpile',
            'trump-card': 'trumpCard', 'punishment': 'boostsTarget', 'echoed-voice': 'echo', 'fury-cutter': 'echo',
            'rollout': 'echo', 'round': 'echo', 'assurance': 'revenge', 'avalanche': 'revenge', 'revenge': 'revenge',
            'payback': 'revenge', 'stomping-tantrum': 'revenge', 'temper-flare': 'revenge', 'lash-out': 'revenge',
            'retaliate': 'revenge', 'bolt-beak': 'first', 'fishious-rend': 'first'}
SWITCH = {'u-turn', 'volt-switch', 'flip-turn', 'parting-shot', 'baton-pass', 'teleport', 'chilly-reception'}
PROTECT = {'protect': 1.2, 'detect': 1.2, 'kings-shield': 1.2, 'spiky-shield': 1.2, 'baneful-bunker': 1.2,
           'silk-trap': 1.2, 'obstruct': 1.2, 'burning-bulwark': 1.2, 'wide-guard': 1.0, 'quick-guard': 1.0}
SELFKO = {'explosion', 'self-destruct', 'misty-explosion', 'memento', 'healing-wish', 'final-gambit', 'lunar-dance'}
SCREEN = {'reflect': 'phys', 'light-screen': 'spec', 'aurora-veil': 'both'}
SEMI = {'fly': 'fly', 'bounce': 'fly', 'dig': 'dig', 'dive': 'dive', 'phantom-force': 'vanish', 'shadow-force': 'vanish'}
AIL = {'paralysis': 'par', 'sleep': 'slp', 'freeze': 'frz', 'burn': 'brn', 'poison': 'psn'}


def r1(x):
    return round(x * 10) / 10


def realtime(m):
    """Mapeia um golpe para o executor de tempo real (kind) e parâmetros (speed, range, cd, count, hits)."""
    ident, cat, typ, power, pp, prio = m['ident'], m['cat'], m['type'], m['power'], m['pp'], m['priority']
    tgt, fl, mt = m['target'], m['flags'], m['meta']
    hits_lo, hits_hi = num(mt.get('min_hits')), num(mt.get('max_hits'))
    multi = (hits_hi or 1) > 1
    avg_hits = 1 if not multi else (3.1 if (hits_lo, hits_hi) == (2, 5) else (hits_lo + hits_hi) / 2)
    rt = {}
    if cat == 'status':
        if ident in WEATHER:
            rt.update(kind='rain', range=8)
        elif ident in TERRAIN:
            rt.update(kind='cloud', range=8)
        elif ident in HAZARD or tgt == 'opponents-field':
            rt.update(kind='cloud', range=9)
        elif tgt in SELF_T:
            rt.update(kind='self')
        elif any(w in ident for w in CONE_WORDS):
            rt.update(kind='cone', range=6)
        elif tgt in SPREAD_T:
            rt.update(kind='wave', range=6)
        elif 'powder' in fl:
            rt.update(kind='cloud', range=8)
        else:
            rt.update(kind='proj', speed=12, range=11)
    else:
        contact = 'contact' in fl
        drain = num(mt.get('drain'), 0)
        if tgt in SPREAD_T:
            ground = cat == 'phys' and typ in ('ground', 'rock') or ident in ('earthquake', 'magnitude', 'bulldoze')
            rt.update(kind='quake' if ground else 'wave', range=r1(5 + min(3, (power or 60) / 45)))
        elif contact:
            if multi:
                rt.update(kind='multi', range=1.8, hits=round(avg_hits))
            elif prio > 0 or drain < 0 or any(w in ident for w in DASH_WORDS):
                rt.update(kind='dash', range=r1(5 + min(3, (power or 60) / 50)))
            else:
                rt.update(kind='melee', range=1.8)
        else:
            if any(w in ident for w in CONE_WORDS) or ('sound' in fl and cat == 'spec'):
                rt.update(kind='cone', range=6)
            elif cat == 'phys' and typ == 'rock' and not multi:
                rt.update(kind='rain', range=13)
            else:
                speed = 17
                if typ == 'electric' or 'beam' in ident:
                    speed = 26
                elif 'pulse' in fl:
                    speed = 20
                elif 'ballistics' in fl:
                    speed = 14
                if prio > 0:
                    speed = 26
                rt.update(kind='proj', speed=speed, range=r1(12 + min(3, (power or 60) / 40)))
                if multi:
                    rt['count'] = round(avg_hits)
    # recarga (cd): golpe forte e com pouco PP recarrega devagar
    ppt = 1.2 if pp <= 5 else 0.5 if pp <= 10 else 0.2 if pp <= 15 else 0
    if cat == 'status':
        changes = stat_changes.get(m['id'], [])
        ail = ailments.get(mt.get('meta_ailment_id', '0'), 'none')
        if ident in WEATHER or ident in TERRAIN:
            cd = 12
        elif ident in HAZARD:
            cd = 8
        elif ident in PROTECT:
            cd = 5
        elif num(mt.get('healing'), 0) > 0:
            cd = 7
        elif ail == 'sleep':
            cd = 9
        elif ail in ('paralysis', 'burn'):
            cd = 7
        elif ail in ('poison', 'confusion'):
            cd = 6
        elif changes:
            tot = sum(abs(c) for _, c in changes)
            cd = 4 + 0.6 * tot if m['self'] else 4.5 + 0.4 * tot
        else:
            cd = 6
        cd += 1.5 if pp <= 5 else 0.5 if pp <= 10 else 0
    else:
        p = (power or 60) * avg_hits
        cd = 0.4 + p / 55 + ppt
        if 'recharge' in fl:
            cd += 1.6
        if 'charge' in fl:
            cd += 0.8
        if rt['kind'] in ('wave', 'quake'):
            cd *= 1.15
        if prio > 0:
            cd *= 0.85
    rt['cd'] = r1(min(12, max(0.8, cd)))
    return rt


def effect(m):
    """Efeitos no formato que o combate lê (eff) + campos novos."""
    ident, cat, mt = m['ident'], m['cat'], m['meta']
    e = {}
    ail = ailments.get(mt.get('meta_ailment_id', '0'), 'none')
    ach = num(mt.get('ailment_chance'), 0)
    chance = 1 if cat == 'status' else (ach / 100 if ach else (m['effect_chance'] or 100) / 100)
    if ail in AIL:
        e['status'] = AIL[ail]
        e['chance'] = round(chance, 2)
        if ident in ('toxic', 'poison-fang', 'toxic-thread', 'malignant-chain'):
            e['toxic'] = True
    elif ail == 'confusion':
        e['confuse'] = round(chance, 2)
    elif ail == 'trap':
        e['bind'] = 4
    elif ail == 'leech-seed':
        e['seed'] = 1
    elif ail not in ('none', 'unknown', 'protect'):
        e['ailment'] = camel(ail)
    fl = num(mt.get('flinch_chance'), 0)
    if fl:
        e['flinch'] = fl / 100
    drain = num(mt.get('drain'), 0)
    if drain > 0:
        e['drain'] = drain / 100
    elif drain < 0:
        e['recoil'] = -drain / 100
    heal = num(mt.get('healing'), 0)
    if heal > 0:
        e['heal'] = heal / 100
        e['self'] = True
    elif heal < 0:
        e['hpCost'] = -heal / 100
    changes = stat_changes.get(m['id'], [])
    if changes:
        sc = num(mt.get('stat_chance'), 0)
        st = [{'stat': STAT_KEY[s], 'by': c} for s, c in changes]
        e['stat'], e['by'] = st[0]['stat'], st[0]['by']
        if len(st) > 1:
            e['stats'] = st
        if m['self']:
            e['self'] = True
        if cat != 'status':
            e['statChance'] = sc / 100 if sc else 1
            if 'status' not in e:  # o combate lê eff.chance também para a mudança de status
                e['chance'] = e['statChance']
    if mt.get('meta_category_id') == '12':
        e['knock'] = 9
    if mt.get('meta_category_id') == '9':
        e['ohko'] = True
    if ident in WEATHER:
        e['weather'], e['dur'] = WEATHER[ident], 30
    if ident in TERRAIN:
        e['terrain'], e['dur'] = TERRAIN[ident], 30
    if ident in HAZARD:
        e['hazard'], e['dur'] = HAZARD[ident], 25
    if ident in SWITCH:
        e['switch'] = True
    if ident in PROTECT:
        e['protect'] = PROTECT[ident]
        e['self'] = True
    if ident == 'endure':
        e['endure'] = 1.2
        e['self'] = True
    if ident == 'substitute':
        e['substitute'] = 0.25
        e['self'] = True
    if ident in SCREEN:
        e['screen'], e['dur'] = SCREEN[ident], 20
    if ident in SELFKO:
        e['selfKO'] = True
    if ident in ('haze', 'clear-smog'):
        e['haze'] = True
    if ident == 'rest':
        e.update(heal=1, self=True, status='slp', chance=1)
    if ident == 'teleport':
        e.update(teleport=True, self=True)
    if ident == 'splash':
        e.update(splash=True, self=True)
    if ident == 'focus-energy':
        e.update(crit=2, self=True)
    if ident in ('tailwind',):
        e.update(tailwind=15, self=True)
    if ident in ('mud-sport', 'water-sport'):
        e.update({camel(ident): 8, 'self': True})
    if ident in ('metronome',):
        e.update(metronome=True, self=True)
    if 'recharge' in m['flags']:
        e['recharge'] = 1.5
    if 'charge' in m['flags']:
        e['charge'] = 0.8
    if ident in SEMI:
        e['semi'] = SEMI[ident]
    return e


AIL_PT = {'par': 'paralisar', 'slp': 'fazer dormir', 'frz': 'congelar', 'brn': 'queimar', 'psn': 'envenenar'}
STAT_PT = {'atk': 'o Ataque', 'def': 'a Defesa', 'spa': 'o Ataque Especial', 'spd': 'a Defesa Especial',
           'spe': 'a Velocidade', 'acc': 'a Precisão', 'eva': 'a Evasão'}


def pct(x):
    return f'{round(x * 100)}%'


def describe(m, e):
    """Descrição curta em português gerada a partir dos dados."""
    out = []
    if m.get('fixed') == 'level':
        out.append('Causa dano igual ao nível do usuário.')
    elif m.get('fixed') == 'half':
        out.append('Tira metade dos PS atuais do alvo.')
    elif m.get('fixed') == 'counter':
        out.append('Devolve com força o dano que recebeu.')
    if e.get('ohko'):
        out.append('Nocauteia com um golpe se acertar.')
    if 'status' in e and e.get('self') is not True:
        verb = 'envenenar gravemente' if e.get('toxic') else AIL_PT[e['status']]
        if e['chance'] < 1:
            out.append(f"Pode {verb} o alvo ({pct(e['chance'])}).")
        else:
            out.append(f"{verb.capitalize()} o alvo.")
    if 'confuse' in e:
        out.append('Deixa o alvo confuso.' if e['confuse'] >= 1 else f"Pode confundir o alvo ({pct(e['confuse'])}).")
    if 'flinch' in e:
        out.append(f"Pode fazer o alvo hesitar ({pct(e['flinch'])}).")
    if 'drain' in e:
        out.append(f"Recupera {pct(e['drain'])} do dano causado.")
    if 'recoil' in e:
        out.append(f"O usuário sofre {pct(e['recoil'])} do dano como recuo.")
    if e.get('heal') and 'status' not in e:
        out.append(f"Recupera {pct(e['heal'])} dos PS máximos.")
    if 'stat' in e:
        st = e.get('stats') or [{'stat': e['stat'], 'by': e['by']}]
        who = 'do usuário' if e.get('self') else 'do alvo'
        groups = {}
        for s in st:
            verb = ('Aumenta' if s['by'] > 0 else 'Diminui') + (' muito' if abs(s['by']) >= 2 else '')
            groups.setdefault(verb, []).append(STAT_PT[s['stat']])
        parts = []
        for verb, stats in groups.items():
            lst = stats[0] if len(stats) == 1 else ', '.join(stats[:-1]) + ' e ' + stats[-1]
            parts.append(f'{verb} {lst}')
        txt = '; '.join(parts)
        txt = txt[0] + txt[1:].replace('; Aumenta', '; aumenta').replace('; Diminui', '; diminui')
        ch = e.get('statChance', 1)
        out.append(f"{txt} {who}{'' if ch >= 1 else f' ({pct(ch)})'}.")
    if e.get('bind'):
        out.append('Prende o alvo por alguns segundos.')
    if e.get('seed'):
        out.append('Planta uma semente que suga PS do alvo.')
    if e.get('protect'):
        out.append('Cria um escudo que bloqueia golpes por um instante.')
    if e.get('switch'):
        out.append('Depois do golpe, o usuário pode trocar de lugar com outro da equipe.')
    if e.get('weather'):
        out.append('Muda o clima por um tempo.')
    if e.get('terrain'):
        out.append('Transforma o terreno ao redor por um tempo.')
    if e.get('hazard'):
        out.append('Espalha uma armadilha no chão.')
    if e.get('selfKO'):
        out.append('O usuário desmaia depois de usar.')
    if e.get('recharge'):
        out.append('O usuário fica parado um instante depois.')
    if e.get('charge') and not e.get('semi'):
        out.append('Precisa carregar antes de disparar.')
    if e.get('semi'):
        out.append({'fly': 'Sobe alto e mergulha sobre o alvo.', 'dig': 'Some debaixo da terra e surge sob o alvo.',
                    'dive': 'Mergulha e surge sob o alvo.', 'vanish': 'Desaparece e ataca de surpresa.'}[e['semi']])
    if m.get('priority', 0) > 0 and m['cat'] != 'status':
        out.append('Sai antes dos outros golpes.')
    if m.get('critUp'):
        out.append('Acerto crítico mais fácil.')
    return ' '.join(out)


# Golpes das gerações 8 e 9 (Legends Arceus, Scarlet/Violet) vêm sem marcas na PokéAPI: as oficiais, à mão,
# para o tempo real saber o que é de contato (corpo a corpo/investida), soco, corte e som.
FLAGS_NOVOS = {
    'contact': 'dire-claw psyshield-bash raging-fury wave-crash headlong-rush ceaseless-edge stone-axe axe-kick jet-punch '
               'spin-out population-bomb ice-spinner glaive-rush triple-dive mortal-spin kowtow-cleave aqua-step raging-bull '
               'psyblade collision-course pounce trailblaze hyper-drill rage-fist bitter-blade double-shock comeuppance '
               'mighty-cleave hard-press temper-flare supercell-slam upper-hand',
    'punch': 'jet-punch rage-fist',
    'slicing': 'ceaseless-edge stone-axe kowtow-cleave psyblade bitter-blade aqua-cutter mighty-cleave tachyon-cutter',
    'sound': 'torch-song alluring-voice psychic-noise',
}
SEM_MARCAS = {m for m in moves if not move_flags.get(m)}
for fl, ids in FLAGS_NOVOS.items():
    for ident in ids.split():
        if move_by_ident.get(ident) in SEM_MARCAS:  # só completa quem não tem marca nenhuma
            move_flags[move_by_ident[ident]].add(fl)
TYPE_OF = {}
move_out, missing_pt = {}, []
for mid in sorted(used_moves):
    r = moves[mid]
    ident = r['identifier']
    mt = meta.get(mid, {})
    tgt = targets.get(r['target_id'], 'selected-pokemon')
    cat = CAT[r['damage_class_id']]
    cat_id = mt.get('meta_category_id', '0')
    self_t = tgt in SELF_T
    m = {'id': mid, 'ident': ident, 'cat': cat, 'type': types[r['type_id']], 'power': num0(r['power']),
         'pp': num(r['pp'], 10), 'priority': num(r['priority'], 0), 'target': tgt, 'flags': move_flags.get(mid, set()),
         'meta': mt, 'effect_chance': num(r['effect_chance']),
         'self': cat_id == '7' or (cat_id == '2' and self_t) or (cat == 'status' and self_t)}
    name = move_names_pt.get(mid) or MOVE_PT.get(ident)
    if not name:
        name = move_names_en[mid]
        missing_pt.append(ident)
    o = {'name': name, 'en': move_names_en[mid], 'type': m['type'], 'cat': cat}
    if m['power'] is not None:
        o['power'] = m['power']
    if ident in FIXED:
        o['fixed'] = FIXED[ident]
    if ident in VARPOWER:
        o['varPower'] = VARPOWER[ident]
        o.setdefault('power', 60)
    if cat != 'status' and 'power' not in o and 'fixed' not in o:
        o['power'] = 60
        o['varPower'] = 'desconhecido'
    o['acc'] = None if not num0(r['accuracy']) else int(r['accuracy']) / 100
    o['pp'] = m['pp']
    if m['priority']:
        o['priority'] = m['priority']
    o['target'] = camel(tgt)
    if m['flags']:
        o['flags'] = sorted(camel(f) for f in m['flags'])
    if num(mt.get('crit_rate'), 0):
        o['critUp'] = int(mt['crit_rate'])
    hits_lo, hits_hi = num(mt.get('min_hits')), num(mt.get('max_hits'))
    if (hits_hi or 1) > 1:
        o['minHits'], o['maxHits'] = hits_lo, hits_hi
    if m['effect_chance']:
        o['effectChance'] = m['effect_chance'] / 100
    o['effectId'] = num(r['effect_id'])
    o['gen'] = int(r['generation_id'])
    o.update(realtime(m))
    e = effect(m)
    if e:
        o['eff'] = e
    o['desc'] = describe({**o, 'cat': cat}, e)
    move_out[camel(ident)] = o


# ---------------------------------------------------------------- Max Golpes Gigantamax (não estão na PokéAPI)
# [id do jogo, nome em inglês, nome em pt-BR, tipo, poder (130 = o dos Max Golpes de golpes fortes; 160 nos três
#  iniciais de Galar, que ignoram habilidades), efeito no formato do combate, descrição]
GMAX = {
    'venusaur': ('gMaxVineLash', 'G-Max Vine Lash', 'G-Max Chicote de Vinhas', 'grass', 130, {'field': 'vineLash', 'dur': 12}, 'Chicoteia com vinhas: quem não é de Planta perde PS por alguns segundos.'),
    'charizard': ('gMaxWildfire', 'G-Max Wildfire', 'G-Max Incêndio', 'fire', 130, {'field': 'wildfire', 'dur': 12}, 'Cerca o campo de fogo: quem não é de Fogo perde PS por alguns segundos.'),
    'blastoise': ('gMaxCannonade', 'G-Max Cannonade', 'G-Max Canhonada', 'water', 130, {'field': 'cannonade', 'dur': 12}, 'Redemoinho de água: quem não é de Água perde PS por alguns segundos.'),
    'butterfree': ('gMaxBefuddle', 'G-Max Befuddle', 'G-Max Pó Atordoante', 'bug', 130, {'statusAny': ['psn', 'par', 'slp'], 'chance': 1}, 'Pó que envenena, paralisa ou faz dormir os adversários.'),
    'pikachu': ('gMaxVoltCrash', 'G-Max Volt Crash', 'G-Max Colisão Voltaica', 'electric', 130, {'status': 'par', 'chance': 1}, 'Paralisa os adversários.'),
    'meowth': ('gMaxGoldRush', 'G-Max Gold Rush', 'G-Max Chuva de Ouro', 'normal', 130, {'confuse': 1, 'money': True}, 'Confunde os adversários e espalha moedas.'),
    'machamp': ('gMaxChiStrike', 'G-Max Chi Strike', 'G-Max Golpe Chi', 'fighting', 130, {'crit': 1, 'self': True, 'allies': True}, 'Acerto crítico mais fácil para o usuário e os aliados.'),
    'gengar': ('gMaxTerror', 'G-Max Terror', 'G-Max Pavor', 'ghost', 130, {'trap': True}, 'Sombras impedem os adversários de fugir.'),
    'kingler': ('gMaxFoamBurst', 'G-Max Foam Burst', 'G-Max Explosão de Espuma', 'water', 130, {'stat': 'spe', 'by': -2, 'chance': 1}, 'Diminui muito a Velocidade dos adversários.'),
    'lapras': ('gMaxResonance', 'G-Max Resonance', 'G-Max Ressonância', 'ice', 130, {'screen': 'both', 'dur': 20}, 'Cria um Véu de Aurora que reduz o dano recebido.'),
    'eevee': ('gMaxCuddle', 'G-Max Cuddle', 'G-Max Aconchego', 'normal', 130, {'ailment': 'infatuation'}, 'Encanta os adversários do gênero oposto.'),
    'snorlax': ('gMaxReplenish', 'G-Max Replenish', 'G-Max Reposição', 'normal', 130, {'berries': True, 'self': True}, 'Pode devolver as frutas que o usuário e os aliados já comeram.'),
    'garbodor': ('gMaxMalodor', 'G-Max Malodor', 'G-Max Mau Cheiro', 'poison', 130, {'status': 'psn', 'chance': 1}, 'Envenena os adversários.'),
    'melmetal': ('gMaxMeltdown', 'G-Max Meltdown', 'G-Max Fusão', 'steel', 130, {'torment': True}, 'Os adversários não conseguem repetir o mesmo golpe.'),
    'rillaboom': ('gMaxDrumSolo', 'G-Max Drum Solo', 'G-Max Solo de Tambor', 'grass', 160, {'ignoreAbility': True}, 'Ataque que ignora a habilidade do alvo.'),
    'cinderace': ('gMaxFireball', 'G-Max Fireball', 'G-Max Bola de Fogo', 'fire', 160, {'ignoreAbility': True}, 'Ataque que ignora a habilidade do alvo.'),
    'inteleon': ('gMaxHydrosnipe', 'G-Max Hydrosnipe', 'G-Max Hidrotiro', 'water', 160, {'ignoreAbility': True}, 'Ataque que ignora a habilidade do alvo.'),
    'corviknight': ('gMaxWindRage', 'G-Max Wind Rage', 'G-Max Fúria do Vento', 'flying', 130, {'defog': True}, 'Varre do campo barreiras e armadilhas.'),
    'orbeetle': ('gMaxGravitas', 'G-Max Gravitas', 'G-Max Gravidade', 'psychic', 130, {'gravity': 15}, 'Intensifica a gravidade por um tempo.'),
    'drednaw': ('gMaxStonesurge', 'G-Max Stonesurge', 'G-Max Onda de Pedras', 'water', 130, {'hazard': 'stealthRock', 'dur': 25}, 'Espalha pedras afiadas no campo adversário.'),
    'coalossal': ('gMaxVolcalith', 'G-Max Volcalith', 'G-Max Vulcalito', 'rock', 130, {'field': 'volcalith', 'dur': 12}, 'Chuva de rochas: quem não é de Pedra perde PS por alguns segundos.'),
    'flapple': ('gMaxTartness', 'G-Max Tartness', 'G-Max Acidez', 'grass', 130, {'stat': 'eva', 'by': -1, 'chance': 1}, 'Diminui a Evasão dos adversários.'),
    'appletun': ('gMaxSweetness', 'G-Max Sweetness', 'G-Max Doçura', 'grass', 130, {'cureAllies': True, 'self': True}, 'Cura os problemas de estado do usuário e dos aliados.'),
    'sandaconda': ('gMaxSandblast', 'G-Max Sandblast', 'G-Max Tempestade de Areia', 'ground', 130, {'bind': 5}, 'Prende os adversários num redemoinho de areia.'),
    'toxtricity': ('gMaxStunShock', 'G-Max Stun Shock', 'G-Max Choque Atordoante', 'electric', 130, {'statusAny': ['psn', 'par'], 'chance': 1}, 'Envenena ou paralisa os adversários.'),
    'centiskorch': ('gMaxCentiferno', 'G-Max Centiferno', 'G-Max Centinferno', 'fire', 130, {'bind': 5}, 'Prende os adversários num turbilhão de fogo.'),
    'hatterene': ('gMaxSmite', 'G-Max Smite', 'G-Max Castigo', 'fairy', 130, {'confuse': 1}, 'Confunde os adversários.'),
    'grimmsnarl': ('gMaxSnooze', 'G-Max Snooze', 'G-Max Soneca', 'dark', 130, {'yawn': 0.5}, 'Pode deixar o alvo sonolento (dorme logo depois).'),
    'alcremie': ('gMaxFinale', 'G-Max Finale', 'G-Max Final', 'fairy', 130, {'healAllies': 1 / 6, 'self': True}, 'Recupera 1/6 dos PS do usuário e dos aliados.'),
    'copperajah': ('gMaxSteelsurge', 'G-Max Steelsurge', 'G-Max Onda de Aço', 'steel', 130, {'hazard': 'steelsurge', 'dur': 25}, 'Espalha espinhos de aço no campo adversário.'),
    'duraludon': ('gMaxDepletion', 'G-Max Depletion', 'G-Max Esgotamento', 'dragon', 130, {'cdUp': 2}, 'Atrasa a recarga do último golpe do alvo.'),
    'urshifu': ('gMaxOneBlow', 'G-Max One Blow', 'G-Max Golpe Único', 'dark', 130, {'bypassProtect': True}, 'Atravessa a proteção do alvo.'),
    'urshifu-rapid-strike': ('gMaxRapidFlow', 'G-Max Rapid Flow', 'G-Max Fluxo Rápido', 'water', 130, {'bypassProtect': True}, 'Atravessa a proteção do alvo.'),
}
GMAX_KIND = {'field': ('quake', 7), 'hazard': ('cloud', 9), 'screen': ('wave', 7), 'bind': ('cloud', 10)}
for sp_ident, (gid, en, pt, typ, pw, eff, desc) in GMAX.items():
    kind, rng = next((v for k, v in GMAX_KIND.items() if k in eff), ('wave', 7))
    move_out[gid] = {'name': pt, 'en': en, 'type': typ, 'cat': 'phys', 'power': pw, 'acc': None, 'pp': 5,
                     'target': 'allOpponents', 'maxMove': True, 'gmax': True, 'catFromMove': True, 'gen': 8,
                     'kind': kind, 'range': rng, 'cd': 6, 'big': 2.2, 'eff': eff, 'desc': desc}
# Max Golpes comuns: a categoria (físico/especial) vem do golpe de origem, como nos jogos
for k, o in move_out.items():
    if k.startswith('max') and o['en'].startswith('Max '):
        o['maxMove'] = True
        if o['cat'] != 'status':
            o['catFromMove'] = True
            o['power'] = 130
            o.update(kind='wave', range=7, cd=6, big=2.2)


# ---------------------------------------------------------------- espécies
def has_pmd(dex):
    return sc_has_base(dex)


stats_by_pk = defaultdict(dict)
for r in rd('pokemon_stats'):
    stats_by_pk[int(r['pokemon_id'])][int(r['stat_id'])] = (int(r['base_stat']), int(r['effort']))
types_by_pk = defaultdict(list)
for r in sorted(rd('pokemon_types'), key=lambda r: int(r['slot'])):
    types_by_pk[int(r['pokemon_id'])].append(types[r['type_id']])
item_en = {int(r['item_id']): r['name'] for r in rd('item_names') if r['local_language_id'] == EN}
item_by_ident = {r['identifier']: int(r['id']) for r in items.values()}

REG_PT = {'alola': 'de Alola', 'galar': 'de Galar', 'hisui': 'de Hisui', 'paldea': 'de Paldea'}
# nomes das formas em português (o nome completo é "<espécie> <forma>"; Mega e Gigantamax têm regra própria)
FORM_PT = {
    'attack': 'Ataque', 'defense': 'Defesa', 'speed': 'Velocidade', 'sandy': 'Manto de Areia', 'trash': 'Manto de Lixo',
    'sky': 'Céu', 'origin': 'Origem', 'heat': 'Calor', 'wash': 'Lavagem', 'frost': 'Gelo', 'fan': 'Ventilador', 'mow': 'Cortador',
    'sunny': 'Sol', 'rainy': 'Chuva', 'snowy': 'Neve', 'blueStriped': 'Listra Azul', 'whiteStriped': 'Listra Branca',
    'zen': 'Modo Zen', 'galarZen': 'de Galar Modo Zen', 'pirouette': 'Pirueta', 'therian': 'Therian', 'black': 'Negro',
    'white': 'Branco', 'resolute': 'Resoluta', 'female': 'Fêmea', 'male': 'Macho', 'blade': 'Lâmina', 'small': 'Pequeno',
    'large': 'Grande', 'super': 'Gigante', 'eternal': 'Flor Eterna', 'unbound': 'Libertado', 'ash': 'de Ash',
    '10': 'Forma 10%', 'complete': 'Forma Completa', 'pomPom': 'Pompom', 'pau': "Pa'u", 'sensu': 'Sensu',
    'midnight': 'Meia-Noite', 'dusk': 'Crepúsculo', 'school': 'Cardume', 'busted': 'Desmascarado', 'ownTempo': 'Ritmo Próprio',
    'dawn': 'Asas da Alvorada', 'ultra': 'Ultra', 'original': 'Cor Original', 'gulping': 'Engolindo', 'gorging': 'Engasgado',
    'lowKey': 'Grave', 'noice': 'Rosto Degelado', 'hangry': 'Faminto', 'crowned': 'Coroado', 'eternamax': 'Eternamax',
    'rapidStrike': 'Golpe Fluido', 'dada': 'Papai', 'ice': 'Cavaleiro Glacial', 'shadow': 'Cavaleiro Espectral',
    'bloodmoon': 'Lua de Sangue', 'wellspringMask': 'Máscara da Fonte', 'hearthflameMask': 'Máscara da Fornalha',
    'cornerstoneMask': 'Máscara da Pedra Angular', 'terastal': 'Terastal', 'stellar': 'Astral', 'roaming': 'Andarilho',
    'threeSegment': 'Três Segmentos', 'hero': 'Herói', 'familyOfThree': 'Família de Três', 'droopy': 'Caída',
    'stretchy': 'Esticada', 'bluePlumage': 'Plumagem Azul', 'yellowPlumage': 'Plumagem Amarela', 'whitePlumage': 'Plumagem Branca',
    'paldeaCombatBreed': 'de Paldea (Raça Combatente)', 'paldeaBlazeBreed': 'de Paldea (Raça Chamejante)',
    'paldeaAquaBreed': 'de Paldea (Raça Aquática)', 'red': 'Núcleo Vermelho', 'orange': 'Núcleo Laranja', 'yellow': 'Núcleo Amarelo',
    'green': 'Núcleo Verde', 'blue': 'Núcleo Azul', 'indigo': 'Núcleo Anil', 'violet': 'Núcleo Violeta', 'sunshine': 'Ensolarada',
    'east': 'Mar do Leste', 'summer': 'Verão', 'autumn': 'Outono', 'winter': 'Inverno', 'douse': 'Disco Hídrico',
    'shock': 'Disco Elétrico', 'burn': 'Disco Flamejante', 'chill': 'Disco Congelante', 'spikyEared': 'Orelha Espetada',
    'active': 'Modo Ativo', 'antique': 'Autêntico', 'artisan': 'Artesanal', 'masterpiece': 'Primoroso', 'question': '?',
    'exclamation': '!', 'mega': 'Mega', 'kabuki': 'Corte Kabuki',
}
TYPE_PT_FORM = {'normal': 'Normal', 'fighting': 'Lutador', 'flying': 'Voador', 'poison': 'Venenoso', 'ground': 'Terrestre',
                'rock': 'Pedra', 'bug': 'Inseto', 'ghost': 'Fantasma', 'steel': 'Aço', 'fire': 'Fogo', 'water': 'Água',
                'grass': 'Planta', 'electric': 'Elétrico', 'psychic': 'Psíquico', 'ice': 'Gelo', 'dragon': 'Dragão',
                'dark': 'Sombrio', 'fairy': 'Fada'}
VIVILLON_PT = {'icySnow': 'Neve Gelada', 'polar': 'Polar', 'tundra': 'Tundra', 'continental': 'Continental', 'garden': 'Jardim',
               'elegant': 'Elegante', 'meadow': 'Prado', 'modern': 'Moderna', 'marine': 'Marinha', 'archipelago': 'Arquipélago',
               'highPlains': 'Planalto', 'sandstorm': 'Tempestade de Areia', 'river': 'Rio', 'monsoon': 'Monção',
               'savanna': 'Savana', 'sun': 'Sol', 'ocean': 'Oceano', 'jungle': 'Selva', 'fancy': 'Extravagante', 'pokeBall': 'Poké Bola'}
FLOR_PT = {'yellow': 'Flor Amarela', 'orange': 'Flor Laranja', 'blue': 'Flor Azul', 'white': 'Flor Branca'}
falta_form_pt = []


def form_pt(sid, key, kind, base_name):
    ident = FORMAS[(sid, key)]['ident']
    toks = ident.split('-')
    if kind == 'mega':
        suf = key[4:] if key.startswith('mega') else ''
        extra = {'X': ' X', 'Y': ' Y', 'Z': ' Z', 'Male': '', 'Female': ' (fêmea)'}.get(suf, '')
        pre = {'femaleMega': ' (fêmea)', 'droopyMega': ' (Caída)', 'stretchyMega': ' (Esticada)', 'originalMega': ' (Cor Original)'}.get(key, '')
        return f'Mega {base_name}{extra}{pre}', 'Mega' + extra
    if kind == 'gmax':
        pre = ' Golpe Fluido' if 'rapid' in key else ' Grave' if 'lowKey' in key else ''
        return f'{base_name}{pre} Gigantamax', 'Gigantamax'
    if kind == 'primal':
        return f'{base_name} Primitivo', 'Primitivo'
    if sid == 800 and key in ('dusk', 'dawn'):
        f = {'dusk': 'Juba do Crepúsculo', 'dawn': 'Asas da Alvorada'}[key]
        return f'{base_name} {f}', f
    if sid in (493, 773) and key in TYPE_PT_FORM:
        return f'{base_name} ({TYPE_PT_FORM[key]})', TYPE_PT_FORM[key]
    if sid in (664, 665, 666) and key in VIVILLON_PT:
        return f'{base_name} ({VIVILLON_PT[key]})', VIVILLON_PT[key]
    if sid in (669, 670, 671) and key in FLOR_PT:
        return f'{base_name} ({FLOR_PT[key]})', FLOR_PT[key]
    if sid == 201:
        return f'{base_name} {key.upper() if len(key) == 1 else FORM_PT.get(key, key)}', key.upper() if len(key) == 1 else FORM_PT.get(key, key)
    if key in FORM_PT:
        f = FORM_PT[key]
        return (f'{base_name} {f}' if not f.startswith('de ') else f'{base_name} {f}'), f
    if kind == 'regional':
        reg = next(t for t in toks if t in REGIOES)
        return f'{base_name} {REG_PT[reg]}', REG_PT[reg]
    en = form_name_en.get(FORMAS[(sid, key)]['form_id'] or -1, ('', ''))[0]
    falta_form_pt.append(ident)
    return f'{base_name} ({en or key})', en or key


def mega_stone(sid, key):
    """Mega Pedra de uma forma Mega: a pedra cujo nome começa como o da espécie (venusaur → venusaurite,
    charizard X → charizardite-x). Rayquaza não usa pedra (precisa saber Ascensão do Dragão)."""
    base = species[sid]['identifier'].replace('-', '')
    suf = '-' + key[-1].lower() if key[-1] in 'XYZ' and key.startswith('mega') else ''
    best, score = None, 0
    for r in items.values():
        if r['category_id'] != '44':
            continue
        st = r['identifier']
        if suf and not st.endswith(suf) or not suf and re.search(r'-[xyz]$', st):
            continue
        stem = re.sub(r'-[xyz]$', '', st)
        n = 0
        while n < min(len(stem), len(base)) and stem[n] == base[n]:
            n += 1
        if n > score:
            best, score = st, n
    return camel(best) if best and score >= 4 else None


def pick(o, keys):
    return {k: o[k] for k in keys if k in o}


def learn_fields(ls):
    lv, tm, tutor, vg = ls
    return {'learn': [[l, camel(moves[m]['identifier'])] for l, _, m in lv],
            'tm': ' '.join(sorted(camel(moves[m]['identifier']) for m in tm)),
            'tutor': ' '.join(sorted(camel(moves[m]['identifier']) for m in tutor)), 'src': VG_NAME[vg]}


def stat_fields(pk, r, fallback=None):
    p = pokemon[pk]
    st = stats_by_pk[pk]
    ab = sorted(pk_abil[pk])
    o = {'types': types_by_pk[pk], 'base': [st[i][0] for i in range(1, 7)], 'evs': [st[i][1] for i in range(1, 7)]}
    o['baseExp'] = num(p['base_experience'], fallback['baseExp'] if fallback else 60)
    o['height'] = int(p['height']) / 10
    o['weight'] = int(p['weight']) / 10
    normal = [camel(abil[a]['identifier']) for _, a, h in ab if not h]
    hidden = [camel(abil[a]['identifier']) for _, a, h in ab if h]
    o['abilities'] = normal or (fallback or {}).get('abilities', [])
    if hidden:
        o['hidden'] = hidden[0]
    return o, {a for _, a, _ in ab}


def fix_evo_moves(o, known):
    # evolução por golpe que a espécie não aprende no jogo de origem (Stantler → Wyrdeer só evolui em
    # Legends Arceus): adaptação para nível 31, como os outros segundos estágios desse ritmo
    for e in o.get('evo', []):
        if e.get('move') and e['move'] not in known:
            e.pop('move')
            e['level'] = 31
            e['note'] = 'adaptação: o golpe da evolução original não existe no jogo de origem dos golpes'


sp_out, no_sprite, form_count = {}, [], defaultdict(int)
FORM_SPRITES = {}  # pasta em assets/pmd ("0026-alola") -> caminho no SpriteCollab ("0026/0001")
MEGA_STONES = {}
for s in SEL:
    r = species[s]
    pk = default_pk[s]
    o = {'name': names.get(s, {}).get(PT) or names.get(s, {}).get(EN) or r['identifier'].title()}
    sf, ab_ids = stat_fields(pk, r)
    used_abil |= ab_ids
    o.update(sf)
    o.update({'catchRate': int(r['capture_rate']), 'growth': GROWTH[r['growth_rate_id']],
              'genderRate': int(r['gender_rate']), 'friendship': num(r['base_happiness'], 50)})
    o = {k: o[k] for k in ['name', 'types', 'base', 'evs', 'catchRate', 'baseExp', 'growth', 'height', 'weight', 'genderRate',
                           'friendship', 'abilities', 'hidden'] if k in o}
    o['gen'] = int(r['generation_id'])
    if r['is_legendary'] == '1':
        o['legendary'] = True
    if r['is_mythical'] == '1':
        o['mythical'] = True
    if r['is_baby'] == '1':
        o['baby'] = True
    o['shape'] = SHAPE_BODY.get(r['shape_id'], 'blob')
    if num(r['evolves_from_species_id']):
        o['from'] = int(r['evolves_from_species_id'])
    if evolutions.get((s, None)):
        o['evo'] = evolutions[(s, None)]
    o.update(learn_fields(learnsets[s]))
    known = {m for _, m in o['learn']} | set(o['tm'].split()) | set(o['tutor'].split())
    fix_evo_moves(o, known)
    o['pmd'] = has_pmd(s)
    if not o['pmd']:
        no_sprite.append(s)
    # ---- formas
    forms = {}
    for (fs, key), f in FORMAS.items():
        if fs != s:
            continue
        kind = f['kind']
        name, short = form_pt(s, key, kind, o['name'])
        fo = {'name': name, 'formName': short, 'kind': kind, 'api': f['ident']}  # api: id da PokéAPI (vulpix-alola)
        if f['pk']:
            sf, ab_ids = stat_fields(f['pk'], r, o)
            used_abil |= ab_ids
            for k, v in sf.items():
                if v != o.get(k):
                    fo[k] = v
        elif form_types.get(f['form_id']):
            fo['types'] = form_types[f['form_id']]
        if (s, key) in form_learn:
            lf = learn_fields(form_learn[(s, key)])
            if (lf['learn'], lf['tm'], lf['tutor']) != (o['learn'], o['tm'], o['tutor']):
                fo.update(lf)
        own = evolutions.get((s, key))
        if kind in ('mega', 'gmax', 'primal', 'battle'):
            fo['evo'] = []
        elif kind == 'regional':
            fo['evo'] = own or []
        elif own:
            alvos = {(e['to']) for e in own}
            fo['evo'] = own + [e for e in o.get('evo', []) if e['to'] not in alvos]
        if 'evo' in fo:
            kn = known | ({m for _, m in fo['learn']} | set(fo['tm'].split()) | set(fo['tutor'].split()) if 'learn' in fo else set())
            fix_evo_moves(fo, kn)
            if fo['evo'] == o.get('evo', []):
                fo.pop('evo')
        if kind in ('mega', 'primal'):
            st = mega_stone(s, key) if kind == 'mega' else ('redOrb' if s == 383 else 'blueOrb' if s == 382 else None)
            if s == 384 and kind == 'mega':
                st = None
                fo['megaMove'] = 'dragonAscent'
            if st:
                fo['megaStone'] = st
                MEGA_STONES.setdefault(st, []).append([s, key])
        if kind == 'gmax':
            g = GMAX.get('urshifu-rapid-strike' if s == 892 and 'rapid' in key else r['identifier'])
            if g:
                fo['gmaxMove'] = g[0]
        if f['sc']:
            fo['pmd'] = True
            FORM_SPRITES[f'{s:04d}-{key}'] = f['sc']
        forms[key] = fo
        form_count[kind] += 1
    if forms:
        o['forms'] = forms
        # forma de gênero: aplicada sozinha pelo gênero (Meowstic, Indeedee, Basculegion, Oinkologne…)
        gen = {('f' if k == 'female' else 'm'): k for k, v in forms.items() if v['kind'] == 'gender'}
        if gen:
            o['genderForms'] = gen
    sp_out[s] = o

abil_out = {}
for a in sorted(used_abil):
    en = abil_en[a]
    abil_out[camel(abil[a]['identifier'])] = {'name': abil_pt.get(a) or ABIL_PT.get(en) or en, 'en': en,
                                              'desc_en': abil_short.get(a, '')}

tm_out = sorted((n, camel(moves[m]['identifier'])) for m, n in SV_TM.items() if camel(moves[m]['identifier']) in move_out)

# ---------------------------------------------------------------- itens novos (Mega Pedras, Orbes, itens-chave,
# itens de evolução e de mudança de forma). src/data/items.js só usa os que ele ainda não define à mão.
ITEM_PT = {
    'upgrade': 'Melhoria', 'dubiousDisc': 'Disco Duvidoso', 'protector': 'Protetor', 'electirizer': 'Eletrizador',
    'magmarizer': 'Magmatizador', 'ovalStone': 'Pedra Oval', 'deepSeaTooth': 'Dente do Mar Profundo',
    'deepSeaScale': 'Escama do Mar Profundo', 'galaricaCuff': 'Bracelete Galarica', 'galaricaWreath': 'Coroa Galarica',
    'tartApple': 'Maçã Azeda', 'sweetApple': 'Maçã Doce', 'syrupyApple': 'Maçã Melada', 'crackedPot': 'Bule Rachado',
    'chippedPot': 'Bule Lascado', 'unremarkableTeacup': 'Xícara Comum', 'masterpieceTeacup': 'Xícara Primorosa',
    'scrollOfDarkness': 'Pergaminho das Trevas', 'scrollOfWaters': 'Pergaminho das Águas', 'leadersCrest': 'Brasão do Líder',
    'gimmighoulCoin': 'Moeda de Gimmighoul', 'metalAlloy': 'Liga Metálica', 'leek': 'Alho-Poró',
    'strawberrySweet': 'Doce de Morango', 'loveSweet': 'Doce de Coração', 'berrySweet': 'Doce de Fruta',
    'cloverSweet': 'Doce de Trevo', 'flowerSweet': 'Doce de Flor', 'starSweet': 'Doce de Estrela', 'ribbonSweet': 'Doce de Laço',
    'rotomCatalog': 'Catálogo Rotom', 'meteorite': 'Meteorito', 'gracidea': 'Gracídea', 'griseousCore': 'Núcleo Platinado',
    'adamantCrystal': 'Cristal Adamante', 'lustrousGlobe': 'Globo Lustroso', 'revealGlass': 'Espelho da Verdade',
    'dnaSplicers': 'Ligadores de DNA', 'nSolarizer': 'N-Solarizador', 'nLunarizer': 'N-Lunarizador',
    'prisonBottle': 'Garrafa Prisão', 'reinsOfUnity': 'Rédeas da União', 'rustedSword': 'Espada Enferrujada',
    'rustedShield': 'Escudo Enferrujado', 'redOrb': 'Orbe Vermelho', 'blueOrb': 'Orbe Azul', 'zygardeCube': 'Cubo Zygarde',
    'redNectar': 'Néctar Vermelho', 'yellowNectar': 'Néctar Amarelo', 'pinkNectar': 'Néctar Rosa', 'purpleNectar': 'Néctar Roxo',
    'wellspringMask': 'Máscara da Fonte', 'hearthflameMask': 'Máscara da Fornalha', 'cornerstoneMask': 'Máscara da Pedra Angular',
    'megaBracelet': 'Pulseira Mega', 'dynamaxBand': 'Bracelete Dynamax', 'douseDrive': 'Disco Hídrico',
    'shockDrive': 'Disco Elétrico', 'burnDrive': 'Disco Flamejante', 'chillDrive': 'Disco Congelante',
    'upGrade': 'Melhoria', 'kingsRock': 'Rocha do Rei', 'razorClaw': 'Garra Afiada', 'razorFang': 'Presa Afiada', 'metalCoat': 'Revestimento Metálico',
}
PLATE = {'flame': 'fire', 'splash': 'water', 'zap': 'electric', 'meadow': 'grass', 'icicle': 'ice', 'fist': 'fighting',
         'toxic': 'poison', 'earth': 'ground', 'sky': 'flying', 'mind': 'psychic', 'insect': 'bug', 'stone': 'rock',
         'spooky': 'ghost', 'draco': 'dragon', 'dread': 'dark', 'iron': 'steel', 'pixie': 'fairy'}
PLATE_PT = {'flame': 'da Chama', 'splash': 'Respingo', 'zap': 'Elétrica', 'meadow': 'do Prado', 'icicle': 'de Gelo',
            'fist': 'do Punho', 'toxic': 'Tóxica', 'earth': 'da Terra', 'sky': 'do Céu', 'mind': 'da Mente', 'insect': 'do Inseto',
            'stone': 'de Pedra', 'spooky': 'Assustadora', 'draco': 'do Dragão', 'dread': 'do Medo', 'iron': 'de Ferro',
            'pixie': 'da Fada'}
# itens que mudam a forma ao serem usados: [espécies, sequência de formas (None = padrão)]
FORM_ITEMS = {
    'rotomCatalog': ([479], ['heat', 'wash', 'frost', 'fan', 'mow', None]),
    'meteorite': ([386], ['attack', 'defense', 'speed', None]),
    'gracidea': ([492], ['sky', None]),
    'griseousCore': ([487], ['origin', None]), 'adamantCrystal': ([483], ['origin', None]), 'lustrousGlobe': ([484], ['origin', None]),
    'revealGlass': ([641, 642, 645, 905], ['therian', None]),
    'dnaSplicers': ([646], ['black', 'white', None]),
    'nSolarizer': ([800], ['dusk', None]), 'nLunarizer': ([800], ['dawn', None]),
    'prisonBottle': ([720], ['unbound', None]),
    'reinsOfUnity': ([898], ['ice', 'shadow', None]),
    'zygardeCube': ([718], ['10', None]),
    'redNectar': ([741], [None]), 'yellowNectar': ([741], ['pomPom']), 'pinkNectar': ([741], ['pau']), 'purpleNectar': ([741], ['sensu']),
    'douseDrive': ([649], ['douse', None]), 'shockDrive': ([649], ['shock', None]), 'burnDrive': ([649], ['burn', None]),
    'chillDrive': ([649], ['chill', None]),
    'wellspringMask': ([1017], ['wellspringMask', None]), 'hearthflameMask': ([1017], ['hearthflameMask', None]),
    'cornerstoneMask': ([1017], ['cornerstoneMask', None]),
}
for pl, t in PLATE.items():
    FORM_ITEMS[camel(pl + '-plate')] = ([493], [t, None])
    ITEM_PT[camel(pl + '-plate')] = f'Placa {PLATE_PT[pl]}'
for t, tpt in TYPE_PT_FORM.items():
    if t != 'normal':
        FORM_ITEMS[camel(t + '-memory')] = ([773], [t, None])
        ITEM_PT[camel(t + '-memory')] = f'Memória {tpt}'
for k, (dexes, seq) in FORM_ITEMS.items():  # só formas que existem nos dados
    FORM_ITEMS[k] = (dexes, [f for f in seq if f is None or any((d, f) in FORMAS for d in dexes)])


def item_row(ident):
    iid = item_by_ident.get(ident)
    return (items[str(iid)], item_en.get(int(iid), ident)) if iid else (None, ident)


def stone_pt(st):
    # venusaurite -> Venusaurita; charizardite-x -> Charizardita X
    base = re.sub(r'([a-z]+)ite(-[xyz])?$', lambda m: m.group(1) + 'ita' + (m.group(2) or ''), st)
    return base.replace('-x', ' X').replace('-y', ' Y').replace('-z', ' Z').capitalize().replace(' x', ' X').replace(' y', ' Y').replace(' z', ' Z')


itens_out = {}
for st, alvos in sorted(MEGA_STONES.items()):
    ident = re.sub(r'([a-z])([A-Z])', r'\1-\2', st).lower()
    row, en = item_row(ident)
    if st in ('redOrb', 'blueOrb'):
        quem = sp_out[alvos[0][0]]['name']
        itens_out[st] = {'name': ITEM_PT[st], 'en': en, 'cat': 'held', 'price': 0, 'hold': True, 'primal': alvos,
                         'desc': f'Segurado por {quem}, desperta a Reversão Primitiva em batalha.'}
        continue
    quem = ' ou '.join(sorted({sp_out[d]['name'] for d, _ in alvos}))
    itens_out[st] = {'name': stone_pt(ident), 'en': en, 'cat': 'held', 'price': 0, 'hold': True, 'megaStone': True, 'mega': alvos,
                     'desc': f'Mega Pedra. Segurada por {quem}, permite a Mega Evolução em batalha (com a Pulseira Mega).'}
itens_out['megaBracelet'] = {'name': 'Pulseira Mega', 'en': 'Mega Bracelet', 'cat': 'key', 'price': 0, 'key': True,
                             'desc': 'Pulseira com uma Pedra-Chave. Permite Mega Evoluir um Pokémon que segura a Mega Pedra certa.'}
itens_out['dynamaxBand'] = {'name': 'Bracelete Dynamax', 'en': 'Dynamax Band', 'cat': 'key', 'price': 0, 'key': True,
                            'desc': 'Bracelete com um Fragmento Wishing. Permite Dynamax e Gigantamax em batalha.'}
for st in ('rustedSword', 'rustedShield'):
    row, en = item_row(re.sub(r'([A-Z])', lambda m: '-' + m.group(1).lower(), st))
    d = 888 if st == 'rustedSword' else 889
    itens_out[st] = {'name': ITEM_PT[st], 'en': en, 'cat': 'held', 'price': 0, 'hold': True, 'crowned': [d, 'crowned'],
                     'desc': f"Segurado por {sp_out[d]['name']}, ele entra em batalha na Forma Coroada."}
for k, (dexes, seq) in FORM_ITEMS.items():
    if len(seq) < 1 or (len(seq) == 1 and seq[0] is None and k != 'redNectar'):
        continue
    row, en = item_row(re.sub(r'([A-Z])', lambda m: '-' + m.group(1).lower(), k))
    quem = ' e '.join(sp_out[d]['name'] for d in dexes)
    itens_out[k] = {'name': ITEM_PT.get(k, en), 'en': en, 'cat': 'misc', 'price': 0, 'formChange': {'dex': dexes, 'forms': seq},
                    'desc': f'Usado em {quem}, muda a forma do Pokémon' + ('.' if len(seq) == 1 else ' (use de novo para trocar).')}
evo_items = sorted({e['item'] for evs in evolutions.values() for e in evs if e.get('item')})
falta_item_pt = []
for k in evo_items:
    if k in itens_out:
        continue
    row, en = item_row(re.sub(r'([A-Z])', lambda m: '-' + m.group(1).lower(), k))
    if k not in ITEM_PT:
        falta_item_pt.append(k)
    alvo = sorted({sp_out[e['to']]['name'] for evs in evolutions.values() for e in evs if e.get('item') == k})
    itens_out[k] = {'name': ITEM_PT.get(k, en), 'en': en, 'cat': 'evolution', 'price': int(row['cost']) if row and row['cost'] else 0,
                    'desc': 'Faz evoluir: ' + ', '.join(alvo) + '.'}

# ---------------------------------------------------------------- escrita
os.makedirs(OUT, exist_ok=True)
HEAD = '// GERADO por tools/pokeapi/importar.py a partir da PokéAPI (CSV). Não edite à mão: ajustes vão em src/data/*.js.\n'


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


with open(os.path.join(OUT, 'especies.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write(f'// {len(sp_out)} espécies (Pokédex Nacional 1 a 1025) e {sum(form_count.values())} formas.\n')
    f.write('// base/evs = [PS, Atq, Def, AtqE, DefE, Vel]; genderRate = oitavos de fêmea (-1 = sem gênero);\n')
    f.write('// tm/tutor = ids de golpes separados por espaço; src = jogo de onde vêm os golpes; gen = geração.\n')
    f.write('// forms = { id: só o que muda em relação à forma padrão + name, formName, kind }; kind: regional, mega, primal,\n')
    f.write('//   gmax, battle (só em batalha), gender (aplicada pelo gênero), alt (forma com dados próprios), visual (só o sprite/tipo).\n')
    f.write('// evo[].form = forma de destino; evo[].region = só naquela região (dados para o mundo; o jogo ainda não usa).\n')
    f.write('export const ESPECIES = {\n')
    for s, o in sp_out.items():
        f.write(f'  {s}: {js(o)},\n')
    f.write('};\n')

with open(os.path.join(OUT, 'golpes.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write(f'// {len(move_out)} golpes com dados oficiais (tipo, categoria, poder, precisão, PP, prioridade, alvo, efeitos)\n')
    f.write('// e o mapeamento automático para o executor de tempo real (kind, speed, range, cd, count, hits).\n')
    f.write('// maxMove = Max Golpe (Dynamax); gmax = Max Golpe exclusivo Gigantamax (dados à mão, a PokéAPI não tem);\n')
    f.write('// catFromMove = a categoria e o poder dependem do golpe de origem.\n')
    f.write('export const GOLPES = {\n')
    for k, o in move_out.items():
        f.write(f'  {k}: {js(o)},\n')
    f.write('};\n')

with open(os.path.join(OUT, 'habilidades.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write('export const HABILIDADES = {\n')
    for k, o in abil_out.items():
        f.write(f'  {k}: {js(o)},\n')
    f.write('};\n')

with open(os.path.join(OUT, 'mts.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write('// MTs de Scarlet/Violet: [número, golpe]. Só entram as de golpes que alguma espécie do jogo aprende.\n')
    f.write(f'export const MTS = {js(tm_out)};\n')

with open(os.path.join(OUT, 'itens.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write('// Itens que as espécies e formas pedem: Mega Pedras (mega = [[dex, forma]]), Orbes da Reversão Primitiva,\n')
    f.write('// Pulseira Mega, Bracelete Dynamax, itens que mudam a forma (formChange) e itens de evolução.\n')
    f.write('export const ITENS = {\n')
    for k, o in itens_out.items():
        f.write(f'  {k}: {js(o)},\n')
    f.write('};\n')

# sprites das formas: pasta do jogo -> subpasta do SpriteCollab (lido por tools/pmd_baixar.py)
with open(os.path.join(HERE, 'formas_pmd.json'), 'w', encoding='utf-8') as f:
    json.dump(FORM_SPRITES, f, indent=1, sort_keys=True)

report = {
    'especies': len(sp_out), 'formas': sum(form_count.values()), 'formas_por_tipo': dict(form_count),
    'formas_com_sprite_proprio': len(FORM_SPRITES), 'golpes': len(move_out), 'habilidades': len(abil_out), 'mts': len(tm_out),
    'itens_gerados': len(itens_out), 'mega_pedras': sum(1 for o in itens_out.values() if o.get('megaStone')),
    'sem_sprite_pmd': no_sprite, 'golpes_sem_pt': missing_pt, 'formas_sem_nome_pt': falta_form_pt,
    'itens_sem_nome_pt': falta_item_pt, 'itens_de_evolucao': evo_items,
    'fontes': {VG_NAME[v]: sum(1 for s in SEL if learnsets[s][3] == v) for v in VG_ORDER if any(learnsets[s][3] == v for s in SEL)},
}
with open(os.path.join(OUT, 'relatorio.json'), 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in report.items() if k not in ('itens_de_evolucao',)}, ensure_ascii=False))
