"""Lista nacional de espécies para o plano de habitats (tools/mundo/especies.json).

Lê os CSVs da PokéAPI (mesma pasta do tools/pokeapi/importar.py) e grava um resumo por espécie:
número, nome, tipos, geração, de quem evolui e como, raridade (bebê, lendário, mítico, captura) e as formas
(regionais, Mega, Gigantamax). O gerador (tools/gerar-mundo.mjs) usa este arquivo; rode de novo quando a lista crescer:

  python3 tools/mundo/extrair-especies.py [pasta-dos-csv]

Pasta padrão: dados-brutos/pokeapi na raiz do repositório (ou na raiz do repositório principal, se o ramo for um
worktree sem os CSVs). Os CSVs são tratados como dados: só são lidos com o módulo csv.
"""
import csv, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))


def achar_pasta():
    if len(sys.argv) > 1:
        return sys.argv[1]
    cands = [os.path.join(ROOT, 'dados-brutos', 'pokeapi')]
    # worktree em .claude/worktrees/<nome>: procura também no repositório principal e nos ramos vizinhos
    wt = os.path.dirname(ROOT)
    if os.path.basename(wt) == 'worktrees':
        main = os.path.dirname(os.path.dirname(wt))
        cands.append(os.path.join(main, 'dados-brutos', 'pokeapi'))
        for nome in sorted(os.listdir(wt)):
            cands.append(os.path.join(wt, nome, 'dados-brutos', 'pokeapi'))
    for c in cands:
        if os.path.exists(os.path.join(c, 'pokemon_species.csv')):
            return c
    sys.exit('CSVs da PokéAPI não encontrados (passe a pasta como argumento).')


D = achar_pasta()


def ler(nome):
    with open(os.path.join(D, nome + '.csv'), encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


tipos_id = {r['id']: r['identifier'] for r in ler('types')}
itens = {r['id']: r['identifier'] for r in ler('items')}
gatilhos = {r['id']: r['identifier'] for r in ler('evolution_triggers')}
nomes = {}
for r in ler('pokemon_species_names'):
    if r['local_language_id'] == '9':
        nomes[r['pokemon_species_id']] = r['name']
tipos = {}
for r in sorted(ler('pokemon_types'), key=lambda r: int(r['slot'])):
    tipos.setdefault(r['pokemon_id'], []).append(tipos_id[r['type_id']])
pokemon = ler('pokemon')
evo = {}
for r in ler('pokemon_evolution'):
    if r['evolved_species_id'] in evo:
        continue  # fica a primeira forma de evoluir (a padrão)
    e = {'gatilho': gatilhos.get(r['evolution_trigger_id'], r['evolution_trigger_id'])}
    if r['minimum_level']: e['nivel'] = int(r['minimum_level'])
    if r['trigger_item_id']: e['item'] = itens.get(r['trigger_item_id'])
    if r['held_item_id']: e['segurando'] = itens.get(r['held_item_id'])
    if r['time_of_day']: e['hora'] = r['time_of_day']
    if r['minimum_happiness']: e['amizade'] = int(r['minimum_happiness'])
    if r['known_move_type_id']: e['tipoGolpe'] = tipos_id.get(r['known_move_type_id'])
    evo[r['evolved_species_id']] = e

CLASSE = [('-alola', 'alola'), ('-galar', 'galar'), ('-hisui', 'hisui'), ('-paldea', 'paldea'), ('-gmax', 'gmax'), ('-mega', 'mega')]
especies = []
for s in ler('pokemon_species'):
    sid = s['id']
    formas = []
    for p in pokemon:
        if p['species_id'] != sid or p['is_default'] == '1':
            continue
        ident = p['identifier']
        classe = next((c for suf, c in CLASSE if suf in ident), None)
        if not classe or 'totem' in ident or 'cap' in ident.split('-'):
            continue
        formas.append({'id': ident, 'classe': classe, 'tipos': tipos.get(p['id'], [])})
    especies.append({
        'dex': int(sid), 'nome': nomes.get(sid, s['identifier'].title()), 'tipos': tipos.get(sid, []),
        'geracao': int(s['generation_id']), 'de': int(s['evolves_from_species_id']) if s['evolves_from_species_id'] else None,
        'cadeia': int(s['evolution_chain_id']) if s['evolution_chain_id'] else None, 'captura': int(s['capture_rate']),
        'bebe': s['is_baby'] == '1', 'lendario': s['is_legendary'] == '1', 'mitico': s['is_mythical'] == '1',
        'evo': evo.get(sid), 'formas': formas,
    })
especies.sort(key=lambda e: e['dex'])
saida = os.path.join(HERE, 'especies.json')
with open(saida, 'w', encoding='utf-8') as f:
    f.write('[\n' + ',\n'.join(json.dumps(e, ensure_ascii=False, separators=(',', ':')) for e in especies) + '\n]\n')
print(f'{len(especies)} espécies, {sum(len(e["formas"]) for e in especies)} formas -> {saida}')
