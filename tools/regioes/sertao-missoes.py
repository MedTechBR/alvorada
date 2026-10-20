# ================================================================ MISSÕES, NPCs VIVOS E ITENS (src/story/missoes/regiao-sertao.js)
ITENS = {
    'fossil_ambar': {'name': 'Fóssil Âmbar', 'desc': 'Um pedaço de âmbar com uma sombra de asa dentro. Dr. Ícaro, em Cidade Buriti, devolve a vida a ele.', 'color': '#c88a30'},
    'fossil_garra': {'name': 'Fóssil Garra', 'desc': 'Uma garra de pedra, cheia de riscos. Dr. Ícaro, em Cidade Buriti, devolve a vida a ele.', 'color': '#8a6a4a'},
    'anel_dourado': {'name': 'Anel Dourado', 'desc': 'Um dos seis anéis sumidos da Rainha do Bazar. Brilha mesmo debaixo de areia.', 'color': '#e0b030'},
}

M = []
def missao(**kw): M.append(kw)

# Uma só missão solta no Sertão: o espelho da Zuleica (Hoopa). Os fósseis são serviço do Dr. Ícaro (NPCS.dr_icaro.reviver).
# Cabras, cacimba, trio do forró, tutor, quermesse, caravana, arena, caranguejo, maré, sapo, canoa, Krookodile, Regirock e os 31
# "Desafios" de treinadores de rota saíram (docs/jornada-roteiro.md): os treinadores seguem no mapa e lutam na conversa (NPCS[id].treinador).
missao(id='sq_hoopa', titulo='O anel da rainha', regiao='Cidade Buriti', de='zuleica', requer={'insignias': 5}, versao=2,
    resumo='Seis anéis sumiram da tenda da Zuleica numa noite só. O espelho dela mostra dois olhinhos rindo, e toda noite um riso vem do poço seco das Dunas Douradas.',
    oferta=['Eu conheço todos os desertos, querido, e nenhum me roubou como este. Seis anéis dourados sumiram da minha tenda numa noite só.', 'O espelho mostra o que está dentro dele. Faz uma semana que mostra dois olhos pequeninos, rindo. E toda noite eu ouço o mesmo riso vindo das Dunas Douradas, do lado do poço seco.', 'Vá ao poço seco e veja quem ri. Se os anéis estiverem lá, traga todos: com os seis juntos o espelho abre. E quando abrir, eu quero que a coisinha saia com você, porque comigo ela só rouba.'],
    lembrete=['O poço seco, no meio das Dunas Douradas. Siga o riso.'],
    etapas=[
        {'tipo': 'chegar', 'x': 930, 'y': 382, 'r': 3, 'texto': 'Siga o riso até o poço seco, no meio das Dunas Douradas', 'falas': [['narrador', 'No fundo do poço seco, seis anéis dourados giram em roda, no ar, em volta de um buraco que não devia existir.'], ['narrador', 'Uma mãozinha de chifres aparece do buraco, conta os anéis, ri e some. Quando você estende a mão, os seis caem na areia, como se alguém tivesse cansado da brincadeira.']], 'recompensa': {'itens': [['anel_dourado', 6]]}},
        {'tipo': 'entregar', 'npc': 'zuleica', 'item': 'anel_dourado', 'n': 6, 'texto': 'Leve os seis anéis à Rainha do Bazar, em Cidade Buriti', 'pergunta': ['Trouxe os seis?'], 'falta': ['Ainda faltam anéis. Seis, querido, seis.'], 'falas': ['Seis anéis! O espelho acende, acende… e abre.', 'Duas mãos enormes saem de um buraco no ar, pegam um anel de volta e somem. Do outro lado, um bichinho de chifres ri na sua cara.', 'Ele gostou de você. Cuide dele como se fosse uma jóia, e conte os seus anéis toda noite.']},
    ],
    recompensa={'pokemon': {'dex': 720, 'nivel': 50, 'apelido': 'Hoopa'}, 'texto': 'Hoopa, preso no espelho da tenda'})

# Treinadores das rotas: lutam uma vez ao conversar (NPCS[id].treinador, src/story/missoes/npcs.js). Não são missões.
TREINADORES_NPC = {}
for t in TREINADORES:
    TREINADORES_NPC[t['id']] = {'treinador': {'batalha': {'id': 'sq_tr_' + t['id'], 'nome': t['nome'], 'equipe': t['equipe']}, 'falas': t['desafio'],
                                              'vitoria': t['vitoria'], 'depois': t['vitoria'][-1:], 'dinheiro': t['dinheiro']}}

# O trio do forró, o Mestre da Arena de Areia e o resto dos lutadores nomeados também seguem como treinadores
TREINADORES_NPC['forro_sanfona'] = {'treinador': {'batalha': {'id': 'sq_forro_1', 'nome': 'Sanfoneiro Zé de Nô', 'equipe': [[323, 40, ['eruption', 'earthPower', 'lavaPlume', 'flamethrower']], [136, 40, ['flamethrower', 'bite', 'quickAttack', 'fireFang']]]},
    'falas': ['A gente toca em trio e briga em trio. Vai, sanfona!'], 'vitoria': ['Perdi o compasso. Vai lá no Dedé!'], 'depois': ['Perdi o compasso, mas toco um xote para você qualquer dia.'], 'dinheiro': 1600, 'requer': {'insignias': 3}}}
TREINADORES_NPC['forro_zabumba'] = {'treinador': {'batalha': {'id': 'sq_forro_2', 'nome': 'Zabumbeiro Dedé', 'equipe': [[128, 41, ['hornAttack', 'bodySlam', 'earthquake', 'rage']], [241, 41, ['stomp', 'bodySlam', 'milkDrink', 'rollout']]]},
    'falas': ['Zabumba é coração batendo!'], 'vitoria': ['Perdi! A Nenê vai te dar trabalho.'], 'depois': ['Perdi, mas o coração segue batendo.'], 'dinheiro': 1700, 'requer': {'insignias': 3}}}
TREINADORES_NPC['forro_triangulo'] = {'treinador': {'batalha': {'id': 'sq_forro_3', 'nome': 'Triangueira Nenê', 'equipe': [[323, 42, ['lavaPlume', 'earthPower', 'rockSlide', 'ember']], [850, 41, ['flamethrower', 'bugBuzz', 'poisonFang', 'crunch']], [324, 42, ['flamethrower', 'earthPower', 'rockSlide', 'ember']]]},
    'falas': ['O triângulo é pequeno, mas quem manda no compasso sou eu!'], 'vitoria': ['O trio toca um xote só para você. Até o mandacaru balança.'], 'depois': ['O triângulo é pequeno, mas o xote saiu grande.'], 'dinheiro': 2200, 'requer': {'insignias': 3}}}
TREINADORES_NPC['mestre_areia'] = {'treinador': {'batalha': {'id': 'sq_arena_5', 'nome': 'Mestre da Arena Haroldo', 'equipe': [[330, 46, ['dragonClaw', 'earthquake', 'aerialAce', 'dragonDance']], [553, 46, ['crunch', 'earthquake', 'dragonClaw', 'sandstorm']], [450, 46, ['earthquake', 'crunch', 'ironHead', 'sandstorm']], [248, 47, ['crunch', 'stoneEdge', 'earthquake', 'sandstorm']]]},
    'falas': ['Todo dia, às três da tarde, a tempestade de areia entra no salão. Ninguém sai de cabeça baixa. Eu sou o próprio vento!'], 'vitoria': ['Campeão da areia! A tempestade perde a graça. O salão aplaude.'], 'depois': ['A tempestade volta às três. O salão sempre aplaude quem fica de pé.'], 'dinheiro': 5000, 'requer': {'insignias': 4}}}

NPCS = {
    **TREINADORES_NPC,
    # Seu Brasa (da Elite) ensina Onda de Calor e Lança-Chamas por ₽500, a quem já tem 2 insígnias
    'seu_brasa': {'tutor': {'requer': {'insignias': 2}, 'golpes': [{'golpe': 'heatWave', 'dinheiro': 500}, {'golpe': 'flamethrower', 'dinheiro': 500}],
                            'falas': {'ola': ['Fogo é com a gente. Eu ensino Onda de Calor e Lança-Chamas. Qual golpe você quer?'], 'tchau': ['Que o sol esteja a pino pra você.']}}},
    'padre_pedro': {'diario': {'sorteio': [['oranBerry', 3], ['pokeBall', 5], ['greatBall', 2], ['sitrusBerry', 2]], 'falas': ['O padre sorri: "Tem prêmio na barraca hoje."'], 'depois': ['Volte amanhã: a quermesse tem prêmio todos os dias.']}},
    'zuleica': {'falas': [{'se': {'missoes': ['sq_hoopa']}, 'linhas': ['O espelho agora só mostra o que eu quero. Que alívio.']}]},
    'kiana': {'troca': {'quer': {'especie': 27, 'nome': 'um Sandshrew'}, 'da': {'dex': 27, 'forma': 'alola', 'nivel': 30, 'apelido': 'Alolinha'}, 'repetivel': False,
                        'falas': {'pede': ['Eu troco um Sandshrew de Alola por um Sandshrew daqui. Quer?'], 'aceita': ['Perfeito! Cuide dele, é do gelo da minha terra!'], 'recusa': ['Tudo bem. Se mudar de ideia, estou no hotel.'], 'falta': ['Preciso de um Sandshrew para a troca.'], 'depois': ['Um Sandshrew do deserto! Sinto saudade do de lá.']}}},
    'kaleo': {'troca': {'quer': {'especie': 37, 'nome': 'um Vulpix'}, 'da': {'dex': 37, 'forma': 'alola', 'nivel': 30, 'apelido': 'Nevinha'}, 'repetivel': False,
                        'falas': {'pede': ['Eu tenho um Vulpix de Alola, branquinho como a neve de lá. Troco por um Vulpix daqui, de fogo. Topa?'], 'aceita': ['Que lindo! Sempre quis ver o fogo de perto sem queimar a mão.'], 'recusa': ['Sem pressa. A neve não derrete tão rápido.'], 'falta': ['Preciso de um Vulpix para a troca.'], 'depois': ['O fogo do Vulpix daqui aquece meu quarto de hotel!']}}},
    'dr_icaro': {'reviver': {'fosseis': [{'item': 'fossil_ambar', 'dex': 142, 'nivel': 25}, {'item': 'fossil_garra', 'dex': 347, 'nivel': 25}, {'item': 'fossil_raiz', 'dex': 345, 'nivel': 25}, {'item': 'fossil_vela', 'dex': 698, 'nivel': 25}],
                             'falas': {'um': ['Isso é um {fossil}? Ora, ora, ora. Deixe comigo! Ponho a máquina para rodar?'], 'qual': ['Quantos fósseis! A máquina só acorda um por vez. Qual vai primeiro?'], 'pronto': ['A máquina zumbe, esquenta, apita… e olha ele aí! Está vivo, de olho aberto, olhando para o século errado!']}},
                 'falas': [{'linhas': ['Fóssil Âmbar, Garra, Raiz, Vela… Se você achar, eu revivo. É só trazer.', 'Fóssil não é pedra, rapaz. É um bicho que esperou milhões de anos por uma tomada.']}]},
    'museu_curadora': {'falas': [{'se': {'visitou': 'ruinas_pintada_1'}, 'linhas': ['Você esteve nas Ruínas de Pedra Pintada? As cópias das pinturas ficam aqui, mas o original é de chorar.']}, {'linhas': ['O museu abre todo dia. O Tyrantrum não reclama de visita.']}]},
    'mestre_iraci': {'reage': {'tipo': {'water': ['Um Pokémon de Água! Esse nada bem. Dá para correr de canoa com ele.']}}},
}

# Texto revisado (revisão de diálogos, dialogos-e): missões e NPCs trocados por id a partir de sertao-dialogos.json.
# Edite os textos lá; o resto (equipes, ids, passos) continua vindo deste arquivo.
_rev = json.load(open(os.path.join(RAIZ, 'tools/regioes/sertao-dialogos.json'), encoding='utf-8'))
ITENS.update(_rev['ITENS'])
for _i, _m in enumerate(M):
    if _m['id'] in _rev['MISSOES']:
        M[_i] = _rev['MISSOES'][_m['id']]
NPCS.update(_rev['NPCS'])

js = '// Missões e NPCs vivos do Sertão do Levante (Vila Mandacaru, Cidade Buriti, Vila Siri, Ruínas de Pedra Pintada e treinadores das rotas).\n'
js += '// GERADO por tools/regioes/gerar-sertao.py (edite lá; os textos revisados estão em tools/regioes/sertao-dialogos.json). Formato: docs/missoes.md.\n\n'
js += 'export const ITENS = ' + json.dumps(ITENS, ensure_ascii=False, indent=2) + ';\n\n'
js += 'export const MISSOES = ' + json.dumps(M, ensure_ascii=False, indent=2) + ';\n\n'
js += 'export const NPCS = ' + json.dumps(NPCS, ensure_ascii=False, indent=2) + ';\n'
open(os.path.join(RAIZ, 'src/story/missoes/regiao-sertao.js'), 'w').write(js)
# o explorador Heitor (NPC de missão das ruínas) mora na antecâmara da fachada
R.person('ruinas_heitor', 'Explorador Hermes', {'preset': 'montanhista', 'hat': 'cap', 'cap': '#e0b030', 'capLogo': '#8a5a2a', 'hair': '#3b2a22', 'skin': '#c98d62', 'top': '#6a8a5a', 'trim': '#8a5a2a', 'pants': '#6a4a34', 'shoes': '#4a3428', 'bagStyle': 'big', 'bag': '#6a4a34'}, 962, 355, ['As Ruínas de Pedra Pintada ficam atrás desta porta. A areia fofa cansa, então entre descansado.', 'São três andares: o Pátio das Pinturas, a Galeria da Areia e a Câmara do Sol. Comece pelo pátio, que é o mais calmo.'], 'up', 0)
