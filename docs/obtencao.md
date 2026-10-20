# Obtenção das espécies (auditoria)

Gerado por `node tools/auditar-obtencao.mjs`. Não edite à mão: mude as fontes (tools/mundo, src/data/species.js, src/mechanics/evolve.js) e rode de novo.

- Espécies na Pokédex nacional: **1025**
- Obteníveis no jogo: **1025**
- **Inativas: 0**

## Por como se obtém (primeiro método da lista de prioridade)

| Método | Espécies |
|---|---:|
| Selvagem (área, dia/noite) | 626 |
| Evolução de espécie obtível | 210 |
| Lendário/mítico fixo | 52 |
| Clube dos Iniciais | 24 |
| Evento / missão | 20 |
| Ovo (Creche) | 16 |
| Toca de Luz (Gigantamax) | 15 |
| Fóssil revivido | 15 |
| Errante (aparece pelo mapa) | 15 |
| Ultra-Fera (Fenda Ultra) | 9 |
| Evolução local (item/hora no mundo) | 8 |
| Presente / missão | 7 |
| Alfa (área) | 4 |
| Inicial | 3 |
| Troca com NPC | 1 |

## Babies

- Babies na lista nacional: 19; na Creche (OVOS): 19. Todos cobertos.

## Trocas (evoluções que pedem troca)

Online, a troca continua valendo. Offline, cada uma tem o jeito abaixo.

| Origem | Evolui para | Troca (original) | Como sem troca |
|---|---|---|---|
| Poliwhirl (#61) | Politoed (#186) | Rocha do Rei (troca) | nível 25, segurando Rocha do Rei |
| Kadabra (#64) | Alakazam (#65) | Cordão de Ligação (troca) | nível 16, sabendo 4 golpes psychic | amizade alta, de noite |
| Machoke (#67) | Machamp (#68) | Cordão de Ligação (troca) | nível 28, em forte_rochedo |
| Graveler (#75) | Golem (#76) | Cordão de Ligação (troca) | nível 25, em vulcao_ticao ou mina_aurora_n1 ou mina_aurora_n2 ou mina_aurora_n3 ou mina_aurora_n4 |
| Slowpoke (#79) | Slowking (#199) | Rocha do Rei (troca) | nível 37, segurando Rocha do Rei |
| Haunter (#93) | Gengar (#94) | Cordão de Ligação (troca) | nível 25, em cemiterio_velas, de noite |
| Onix (#95) | Steelix (#208) | Revestimento Metálico (troca) | nível 30, segurando Revestimento Metálico |
| Rhydon (#112) | Rhyperior (#464) | Protetor (troca) | nível 42, segurando Protetor |
| Seadra (#117) | Kingdra (#230) | Escama de Dragão (troca) | nível 40, segurando Escama de Dragão |
| Scyther (#123) | Scizor (#212) | Revestimento Metálico (troca) | nível 30, segurando Revestimento Metálico |
| Electabuzz (#125) | Electivire (#466) | Eletrizador (troca) | nível 30, segurando Eletrizador |
| Magmar (#126) | Magmortar (#467) | Magmatizador (troca) | nível 30, segurando Magmatizador |
| Porygon (#137) | Porygon2 (#233) | Melhoria (troca) | nível 20, segurando Melhoria |
| Porygon2 (#233) | Porygon-Z (#474) | Disco Duvidoso (troca) | nível 40, segurando Disco Duvidoso |
| Dusclops (#356) | Dusknoir (#477) | Tecido Ceifador (troca) | nível 37, segurando Tecido Ceifador |
| Clamperl (#366) | Huntail (#367) | Dente do Mar Profundo (troca) | nível 25, segurando Dente do Mar Profundo |
| Clamperl (#366) | Gorebyss (#368) | Escama do Mar Profundo (troca) | nível 25, segurando Escama do Mar Profundo |
| Boldore (#525) | Gigalith (#526) | Cordão de Ligação (troca) | nível 40, em fenda_prismatica |
| Gurdurr (#533) | Conkeldurr (#534) | Cordão de Ligação (troca) | nível 25, segurando Bola de Ferro |
| Karrablast (#588) | Escavalier (#589) | Cordão de Ligação (troca) | nível 30, com Shelmet na equipe |
| Shelmet (#616) | Accelgor (#617) | Cordão de Ligação (troca) | nível 30, com Karrablast na equipe |
| Spritzee (#682) | Aromatisse (#683) | Sachê (troca) | nível 30, amizade alta |
| Swirlix (#684) | Slurpuff (#685) | Chantili dos Sonhos (troca) | nível 30, amizade alta |
| Phantump (#708) | Trevenant (#709) | Cordão de Ligação (troca) | nível 30, em bosque_sussurrante ou mata_jequitibas, de noite |
| Pumpkaboo (#710) | Gourgeist (#711) | Cordão de Ligação (troca) | nível 35, em bosque_sussurrante ou mata_jequitibas, de noite |

Trocas sem alternativa: **0**

## Espécies inativas

Nenhuma.

## Formas

Formas cadastradas (regionais, de gênero, alternativas, mega, Gigantamax): 392. A auditoria conta a espécie; cada forma regional tem a sua fonte em tools/mundo/especiais.mjs (OBTENCAO) ou nas tabelas de área.

