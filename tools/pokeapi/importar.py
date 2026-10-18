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
  - Pokédex regional: Lumiose (Legends Z-A, 232 espécies, gerações 1 a 7 misturadas, inclui os
    iniciais de Kanto), mais as espécies que o jogo já usava, mais as do roteiro, mais as linhas evolutivas completas.
  - Golpes: Scarlet/Violet (grupo de versão 25); quem não está em SV usa a geração mais recente com
    dados: Sword/Shield (20), Brilliant Diamond/Shining Pearl (23) ou Ultra Sun/Ultra Moon (18).
  - MT = as 229 MTs de SV. Golpes que a espécie aprendia por máquina num jogo antigo e que não são MT
    em SV viram golpes de "ensino" (tutor).
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

# ---------------------------------------------------------------- seleção de espécies
LUMIOSE = [int(r['species_id']) for r in sorted((r for r in rd('pokemon_dex_numbers') if r['pokedex_id'] == '34'),
                                                key=lambda r: int(r['pokedex_number']))]
# espécies que o jogo já usava (src/data/species.js antes da importação)
JA_USADAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 25, 41, 48, 52, 54, 56, 59, 63, 66,
             74, 79, 92, 95, 123, 129, 130, 133, 167, 179, 183, 194, 198, 200, 204, 214, 215, 216, 227, 228, 234, 246,
             278, 280, 283, 285, 349, 359, 396, 403, 406, 415, 417, 418, 422, 425, 427, 443, 447, 548, 550, 570, 590,
             607, 628, 656, 659, 664, 701, 708, 734, 744, 750, 821, 903, 915, 926]
# espécies citadas no roteiro (src/story/script/cap01–12.js: equipes de líderes, Elite, chefes, montarias,
# lendários) + montarias e lendários pedidos à parte (Mudbray, Lapras, Sneasler, Corviknight, Mantine, Solgaleo)
HISTORIA = [13, 17, 41, 42, 48, 52, 54, 58, 59, 66, 67, 76, 79, 81, 82, 92, 93, 94, 95, 100, 123, 128, 129, 130, 133, 149,
            164, 167, 168, 171, 180, 183, 196, 197, 198, 200, 208, 214, 216, 227, 228, 229, 230, 237, 261, 262, 277, 278,
            282, 283, 290, 296, 302, 303, 304, 307, 309, 323, 324, 328, 330, 333, 334, 339, 353, 354, 355, 359, 376, 396,
            397, 398, 401, 403, 404, 415, 417, 418, 425, 427, 429, 430, 434, 435, 437, 445, 447, 448, 453, 457, 461, 462,
            468, 476, 510, 522, 524, 525, 532, 535, 546, 547, 550, 551, 571, 580, 593, 595, 600, 601, 607, 608, 612, 619,
            627, 628, 635, 637, 659, 662, 663, 664, 671, 672, 694, 700, 701, 703, 706, 708, 714, 715, 731, 739, 744, 745,
            792, 800, 819, 835, 837, 851, 861, 915, 921, 927, 932, 933, 936, 952, 959, 969, 970, 971,
            749, 131, 903, 823, 226, 791]
# golpes citados no roteiro (ids do jogo, camelCase)
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
# evoluções que dependem só de forma regional (Meowth de Galar, Wooper de Paldea, Basculin listrado)
SO_FORMA = {863, 980, 902}

chain = defaultdict(list)
for i, r in species.items():
    chain[r['evolution_chain_id']].append(i)
SEL = set()
for s in LUMIOSE + JA_USADAS + HISTORIA:
    SEL |= set(chain[species[s]['evolution_chain_id']])
SEL -= SO_FORMA
SEL = sorted(SEL)

# ---------------------------------------------------------------- golpes por espécie
VG_ORDER = [25, 20, 23, 18]  # SV, SwSh, BDSP, USUM
VG_NAME = {25: 'scarlet-violet', 20: 'sword-shield', 23: 'brilliant-diamond-shining-pearl', 18: 'ultra-sun-ultra-moon'}
pm = defaultdict(list)
for r in rd('pokemon_moves'):
    vg = int(r['version_group_id'])
    if vg in VG_ORDER and r['pokemon_move_method_id'] in ('1', '3', '4'):
        pm[(int(r['pokemon_id']), vg)].append(r)

SV_TM = {}
for r in rd('machines'):
    if r['version_group_id'] == '25':
        SV_TM[int(r['move_id'])] = int(r['machine_number'])

learnsets, used_moves, source_vg = {}, set(), {}
for s in SEL:
    pk = default_pk[s]
    vg = next((v for v in VG_ORDER if pm.get((pk, v))), None)
    if vg is None:
        raise SystemExit(f'sem golpes: {s}')
    source_vg[s] = vg
    lv, tm, tutor = [], set(), set()
    for r in pm[(pk, vg)]:
        mid = int(r['move_id'])
        if r['pokemon_move_method_id'] == '1':
            lv.append((int(r['level'] or 0), int(r['order'] or 0), mid))
        elif r['pokemon_move_method_id'] == '4' and mid in SV_TM:
            tm.add(mid)
        else:
            tutor.add(mid)
    tutor -= tm
    lv.sort()
    learnsets[s] = (lv, tm, tutor)
    used_moves |= {m for _, _, m in lv} | tm | tutor

# golpes que o jogo já usava continuam existindo (saves antigos)
for ident in ['rage', 'twineedle', 'bubble', 'mud-sport', 'magnitude', 'pursuit', 'struggle', 'karate-chop']:
    used_moves.add(move_by_ident[ident])
# e os do roteiro (camelCase -> identificador da PokéAPI)
by_camel = {camel(k): v for k, v in move_by_ident.items()}
for c in GOLPES_HISTORIA:
    if c not in by_camel:
        raise SystemExit(f'golpe do roteiro sem dados na PokéAPI: {c}')
    used_moves.add(by_camel[c])

# ---------------------------------------------------------------- evoluções
evo_rows = defaultdict(list)
for r in rd('pokemon_evolution'):
    to = int(r['evolved_species_id'])
    frm = num(species[to]['evolves_from_species_id'])
    if to in SEL and frm in SEL:
        evo_rows[(frm, to)].append(r)


def item_id(iid):
    return camel(items[iid]['identifier']) if iid else None


def evo_entry(to, r):
    e = {'to': to}
    trig = r['evolution_trigger_id']
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
        e['note'] = f"original: usar o golpe {r['minimum_move_count']} vezes"
    if r['known_move_type_id']:
        e['moveType'] = types[r['known_move_type_id']]
    if r['needs_overworld_rain'] == '1':
        e['rain'] = True
    if r['party_type_id']:
        e['partyType'] = types[r['party_type_id']]
    if r['turn_upside_down'] == '1':
        e['note'] = 'original: virar o aparelho de cabeça para baixo'
    if trig == '4':  # Shedinja: surge junto quando Nincada evolui (com espaço na equipe e uma Poké Bola)
        e['level'], e['shed'] = 20, True
        e['note'] = 'aparece junto quando Nincada evolui para Ninjask'
    elif trig == '3':
        e['item'] = item_id(r['trigger_item_id'])
    elif trig == '2':  # troca -> usar o item que ele seguraria, ou o Cordão de Ligação
        e['item'] = item_id(r['held_item_id']) or 'linkingCord'
        e['trade'] = True
    elif r['held_item_id']:  # subir de nível segurando item -> usar o item
        e['item'] = item_id(r['held_item_id'])
        e['note'] = 'original: subir de nível segurando o item'
    if r['minimum_beauty']:
        e['item'] = 'prismScale'
        e['note'] = 'original: beleza alta (ou troca segurando a Escama Prisma)'
    if trig == '1' and not any(k in e for k in ('level', 'friendship', 'move', 'moveType', 'item')):
        e['level'] = 1  # segurança: sem condição conhecida
    return e


evolutions = defaultdict(list)
for (frm, to), rows in sorted(evo_rows.items()):
    rows = [r for r in rows if not r['region_id']]
    plain = [r for r in rows if not r['required_pokemon_form_id'] or int(r['required_pokemon_form_id']) < 10000]
    if plain:
        rows = plain
    if not rows:
        continue
    top = max(int(r['version_group_id']) for r in rows)
    seen = []
    for r in rows:
        if int(r['version_group_id']) != top:
            continue
        e = evo_entry(to, r)
        if e not in seen:
            seen.append(e)
    # mesma condição para macho e fêmea (formas de gênero, ex.: Meowstic, Oinkologne) -> sem exigência de gênero
    for e in list(seen):
        if e.get('gender') == 'm':
            twin = {**e, 'gender': 'f'}
            if twin in seen:
                seen.remove(twin)
                e.pop('gender')
    evolutions[frm].extend(seen)

# mesma condição para dois destinos (exclusivos de versão, ex.: Cosmoem → Solgaleo em Sun, Lunala em Moon):
# adaptação para dia e noite
for frm, evs in evolutions.items():
    for i, e in enumerate(evs):
        for f in evs[i + 1:]:
            if e['to'] != f['to'] and {k: v for k, v in e.items() if k != 'to'} == {k: v for k, v in f.items() if k != 'to'} and 'time' not in e:
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

# ---------------------------------------------------------------- espécies
tracker = json.load(open(TRACKER, encoding='utf-8'))


def has_pmd(dex):
    t = tracker.get('%04d' % dex) or {}
    files = t.get('sprite_files') or {}
    return bool('Walk' in files or 'Idle' in files)


stats_by_pk = defaultdict(dict)
for r in rd('pokemon_stats'):
    stats_by_pk[int(r['pokemon_id'])][int(r['stat_id'])] = (int(r['base_stat']), int(r['effort']))
types_by_pk = defaultdict(list)
for r in sorted(rd('pokemon_types'), key=lambda r: int(r['slot'])):
    types_by_pk[int(r['pokemon_id'])].append(types[r['type_id']])

sp_out, no_sprite = {}, []
for s in SEL:
    r = species[s]
    pk = default_pk[s]
    p = pokemon[pk]
    st = stats_by_pk[pk]
    lv, tm, tutor = learnsets[s]
    ab = sorted(pk_abil[pk])
    normal = [camel(abil[a]['identifier']) for _, a, h in ab if not h]
    hidden = [camel(abil[a]['identifier']) for _, a, h in ab if h]
    used_abil |= {a for _, a, _ in ab}
    o = {
        'name': names.get(s, {}).get(PT) or names.get(s, {}).get(EN) or r['identifier'].title(),
        'types': types_by_pk[pk],
        'base': [st[i][0] for i in range(1, 7)],
        'evs': [st[i][1] for i in range(1, 7)],
        'catchRate': int(r['capture_rate']),
        'baseExp': num(p['base_experience'], 60),
        'growth': GROWTH[r['growth_rate_id']],
        'height': int(p['height']) / 10,
        'weight': int(p['weight']) / 10,
        'genderRate': int(r['gender_rate']),
        'friendship': num(r['base_happiness'], 50),
        'abilities': normal,
    }
    if hidden:
        o['hidden'] = hidden[0]
    if r['is_legendary'] == '1':
        o['legendary'] = True
    if r['is_mythical'] == '1':
        o['mythical'] = True
    if r['is_baby'] == '1':
        o['baby'] = True
    o['shape'] = SHAPE_BODY.get(r['shape_id'], 'blob')
    if num(r['evolves_from_species_id']) in SEL:
        o['from'] = int(r['evolves_from_species_id'])
    if evolutions.get(s):
        o['evo'] = evolutions[s]
    o['learn'] = [[l, camel(moves[m]['identifier'])] for l, _, m in lv]
    o['tm'] = ' '.join(sorted(camel(moves[m]['identifier']) for m in tm))
    o['tutor'] = ' '.join(sorted(camel(moves[m]['identifier']) for m in tutor))
    # evolução por golpe que a espécie não aprende no jogo de origem (Stantler → Wyrdeer só evolui em
    # Legends Arceus): adaptação para nível 31, como os outros segundos estágios desse ritmo
    known = {m for _, m in o['learn']} | set(o['tm'].split()) | set(o['tutor'].split())
    for e in o.get('evo', []):
        if e.get('move') and e['move'] not in known:
            e.pop('move')
            e['level'] = 31
            e['note'] = 'adaptação: o golpe da evolução original não existe no jogo de origem dos golpes'
    o['src'] = VG_NAME[source_vg[s]]
    o['pmd'] = has_pmd(s)
    if not o['pmd']:
        no_sprite.append(s)
    sp_out[s] = o

abil_out = {}
for a in sorted(used_abil):
    en = abil_en[a]
    abil_out[camel(abil[a]['identifier'])] = {'name': abil_pt.get(a) or ABIL_PT.get(en) or en, 'en': en,
                                              'desc_en': abil_short.get(a, '')}

tm_out = sorted((n, camel(moves[m]['identifier'])) for m, n in SV_TM.items() if camel(moves[m]['identifier']) in move_out)

# ---------------------------------------------------------------- escrita
os.makedirs(OUT, exist_ok=True)
HEAD = '// GERADO por tools/pokeapi/importar.py a partir da PokéAPI (CSV). Não edite à mão: ajustes vão em src/data/*.js.\n'


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(',', ':'))


with open(os.path.join(OUT, 'especies.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write(f'// {len(sp_out)} espécies: Pokédex de Lumiose (Legends Z-A) + espécies já usadas + linhas evolutivas completas.\n')
    f.write('// base/evs = [PS, Atq, Def, AtqE, DefE, Vel]; genderRate = oitavos de fêmea (-1 = sem gênero);\n')
    f.write('// tm/tutor = ids de golpes separados por espaço; src = jogo de onde vêm os golpes.\n')
    f.write('export const ESPECIES = {\n')
    for s, o in sp_out.items():
        f.write(f'  {s}: {js(o)},\n')
    f.write('};\n')

with open(os.path.join(OUT, 'golpes.js'), 'w', encoding='utf-8') as f:
    f.write(HEAD)
    f.write(f'// {len(move_out)} golpes com dados oficiais (tipo, categoria, poder, precisão, PP, prioridade, alvo, efeitos)\n')
    f.write('// e o mapeamento automático para o executor de tempo real (kind, speed, range, cd, count, hits).\n')
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

items_needed = sorted({e['item'] for evs in evolutions.values() for e in evs if e.get('item')})
report = {
    'especies': len(sp_out), 'golpes': len(move_out), 'habilidades': len(abil_out), 'mts': len(tm_out),
    'dex': list(sp_out.keys()), 'sem_sprite_pmd': no_sprite, 'golpes_sem_pt': missing_pt,
    'itens_de_evolucao': items_needed,
    'fontes': {VG_NAME[v]: sum(1 for s in SEL if source_vg[s] == v) for v in VG_ORDER},
}
with open(os.path.join(OUT, 'relatorio.json'), 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
print(json.dumps({k: v for k, v in report.items() if k != 'dex'}, ensure_ascii=False))
