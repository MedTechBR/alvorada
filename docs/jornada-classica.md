# Jornada clássica — nova história e ordem do jogo (2026-10-19)

Pedido do Matheus: "a história está muito confusa", "em 5 min derrotei 2 líderes", "queria algo realmente longo,
com mais exploração; os jogos originais fazem mais sentido". Decisões dele: **progressão igual aos originais**
(ginásios em ordem, rotas liberadas pela história e por obstáculos) e **história reescrita do zero**, curta e clara.

Este documento SUBSTITUI `docs/historia-completa.md` e `docs/jornadas.md` como fonte da verdade. O mundo aberto
(`src/story/jornadas.js`, `trama.js`) deixa de existir como regra: a ordem abaixo é obrigatória.

---

## 1. A história em uma página

**Premissa (o que o jogador sabe):** em Alvorada, o sol nasce um pouco mais tarde a cada dia. A **Equipe
Crepúsculo** anda roubando as **Pedras do Alvorecer**, oito pedras que cada ginásio guarda desde sempre. Você
sai de casa com seu primeiro Pokémon para colecionar as oito insígnias e chegar à Liga, e no caminho descobre o
que a Crepúsculo quer.

**O que está acontecendo (revelado aos poucos, sempre explicado na tela):**
- No alto do Planalto dos Ventos fica o **Relógio de Pedra**, que prende **Necrozma**, um Pokémon que come luz.
  As oito Pedras do Alvorecer são as chaves do Relógio; por isso cada ginásio guarda uma.
- A **Dra. Véspera**, chefe da Crepúsculo, quer juntar as oito pedras e libertar o Necrozma para que a noite
  nunca acabe ("a luz só trouxe ganância").
- O jogador e o rival **Téo** atrapalham a Crepúsculo ginásio após ginásio. Cada líder, ao perder, entrega a
  insígnia E pede ajuda para proteger a pedra da cidade.

**Uma única reviravolta** (depois da 7ª insígnia): a Crepúsculo já tem sete pedras; a oitava está com o
jogador desde a 5ª insígnia (a **Vela Eterna** que a Dona Zélia deu "para guardar"). Véspera sequestra o
professor para trocar pela pedra. O jogador sobe ao Relógio, vence Véspera, e Necrozma desperta mesmo assim:
batalha com o lendário (pode capturar). O sol volta ao horário certo. Depois disso, a Liga.

**Personagens (só os essenciais):**
| Quem | Papel |
|---|---|
| Ravi/jogador | Sai de Vila Alvorada com o primeiro Pokémon |
| Mãe (Helena) | Apresenta a Rádio Alvorada; anuncia o horário do sol (marca o perigo crescendo) |
| Prof. Jatobá | Dá o inicial, a Pokédex e explica a lenda do Relógio |
| Téo (rival) | Vizinho, começa junto; 5 batalhas ao longo do jogo; vira aliado no Relógio |
| Dra. Véspera | Chefe da Equipe Crepúsculo |
| Admin Ébano | Braço direito de Véspera; aparece nos eventos das cidades |
| Sina (Absol) | Aparece antes de cada desastre; guia o jogador às pedras ameaçadas |
| 8 líderes | Tomé, Lia, Marina, Jonas, Zélia, Brás, Graça, Celeste |
| Elite 4 + Campeã | Aurélio, Clarice, Seu Brasa, Iberê; Campeã Dalva |

Cortados da trama principal (podem ficar como NPCs sem enredo): Companhia Aurora/Solano como vilão, Sereno
espião, cartas do professor, gêmeas Véspera/Dalva. Uma reviravolta só.

**Regra de clareza:** o painel de objetivo SEMPRE diz o próximo passo concreto ("Vá à Cidade Campina pela Rota 1
e desafie o líder Tomé"). Cada cidade abre com uma cena curta (3–6 falas) que diz por que você está ali.

---

## 2. Ordem do jogo (obrigatória)

Níveis = nível do Pokémon mais forte do líder (ás). Selvagens da área no meio do caminho ≈ ás − 6 até ás − 2.

| # | Trecho | Rotas / masmorra no caminho | Ginásio (tipo, ás) | O que libera | Evento da Crepúsculo |
|---|---|---|---|---|---|
| 0 | Vila Alvorada | Laboratório, inicial, rival 1 | — | Rota 1 | — |
| 1 | Rota 1 → **Cidade Campina** | Rota 1 (6 treinadores) | **Tomé**, Normal, 14 | Rota 2 (guarda sai) | Recrutas rondando a Fazenda |
| 2 | Rota 2 + **Bosque Sussurrante** + **Toca do Absol** → **Vila Sussurro** | Rota 2 (8), Toca do Absol (masmorra 2 andares) | **Lia**, Inseto, 19 | Rota 3 (ponte reconstruída) | Crepúsculo invade a estufa; rival 2 |
| 3 | Rota 3 + **Gruta da Maré** → **Porto Espelho** | Rota 3 (8), Gruta da Maré (3 andares) | **Marina**, Água, 24 | **NADAR** (insígnia Gota) | Ataque ao galpão dos barcos |
| 4 | Rota 4 (água) → **Cidade Coral** | Rota 4 (10), Farol Coral (3 andares, enigmas) | **Jonas**, Elétrico, 28 | Balsa para as Jandaias | Pedra do Farol roubada → recuperar |
| 5 | **Ilhas Jandaias** (selva) | Rota 17, Ilhas Gêmeas, Selva Grande, **Templo das Raízes** (3 andares) | — (arco de região) | Volta a Coral; Rota 5 aberta | Ébano no Templo; rival 3 |
| 6 | Rota 5 (brejo) → **Vila Lamparina** | Rota 5 (10, noite), Casarão das Velas | **Zélia**, Fantasma, 32 | Rota 6; jogador recebe a Vela Eterna | Ataque noturno ao Casarão |
| 7 | Rota 6 → **Cidade Aurora** → **Mina Aurora** (4 andares) → Rota 7 → **Forte Rochedo** | Rota 6 (10), Mina Aurora, Rota 7 (8) | **Brás**, Lutador, 37 | **ESCALAR** (insígnia Punho) | Base da Crepúsculo na mina; resgate dos mineiros |
| 8 | **Sertão do Levante** | Estrada do Sertão, Cânion, Dunas, **Ruínas de Pedra Pintada** (3 andares) | — (arco de região) | Mapa do Paredão | Crepúsculo escava as ruínas; rival 4 |
| 9 | Rota 8 (escalada do Paredão) → **Cidade Escarpa** | Rota 8 (10), Paredão | **Graça**, Pedra, 41 | **VOAR** (insígnia Rocha) — só para cidades visitadas | Reviravolta: Véspera tem 7 pedras |
| 10 | **Brasas** (vulcão) | Ilha do Basalto, Fontes Termais, Vulcão Tição, **Templo da Chama** (3 andares) | — (arco de região) | Fim da tempestade do Planalto | Ébano tenta acordar o vulcão |
| 11 | Rota 9 / Rota 11 (planalto) → **Mirante dos Ventos** | Rota 9 (8), Rota 11 (8), **Ruínas dos Vigias** | **Celeste**, Voador, 45 | **MERGULHAR**; caminho ao Relógio | Professor sequestrado |
| 12 | **Relógio de Pedra** | Topo do Planalto | Véspera (48) + **Necrozma** (50) | Sol normalizado; Rota 12 | Clímax |
| 13 | **Cordilheira Geada** = Estrada da Vitória | Rota 15, Rota 16, **Caverna de Gelo** (3 andares), Cume | — | Rota 12 → Liga | Rival 5 no Cume (52) |
| 14 | **Liga do Zênite** | Caminho do Zênite | Elite 4 (54–58) + **Campeã Dalva** (62) | Créditos; pós-jogo | — |
| PJ | **Pós-jogo** | Mar do Sul (Templo das Marés, Farol Morto), Terras do Ocaso | Revanches, lendários (Solgaleo/Lunala) | — | — |

**Montarias por insígnia (como as MOs):** Correr desde o começo · Nadar após a 3ª · Escalar após a 6ª · Voar após a
7ª (só para ninhos já visitados a pé) · Mergulhar após a 8ª. Antes da insígnia, o jogo explica: "Você precisa da
Insígnia X para usar Y fora de batalha". A regra de capacidade (quem pode carregar) continua; ela só vale depois
da insígnia.

**Barreiras que garantem a ordem (mesmo com Pokémon forte):**
- Guarda/obra/ponte quebrada na saída de cada cidade até vencer o líder (originais: "a estrada está bloqueada").
- Água funda, paredões e mar: exigem as montarias acima.
- Tempestade permanente sobre o Planalto (impede voo e caminhada) até o evento de Brasas.
- Neblina no Mar do Sul e nas Terras do Ocaso até o fim da Liga.
- Voo só para ninhos já visitados.

**Tamanho:** 8 ginásios, 4 arcos de região (Jandaias, Sertão, Brasas, Geada), 10 masmorras de vários andares,
~110 treinadores de rota, 5 batalhas de rival. Meta: 25–40 horas na primeira vez.

---

## 3. Etapas de implementação (para os agentes)

1. **Estrutura:** ordem obrigatória, barreiras, montarias por insígnia, voo só para visitados, objetivo sempre
   claro, os 8 ginásios ligados (inclui cap07–09: Brás, Graça, Celeste) e a Liga; níveis dos líderes pela tabela.
2. **História:** reescrever as cenas de cada trecho com a trama da seção 1 (falas curtas, em português do
   Brasil, sem pontas soltas); rádio da Mãe marcando o sol atrasando.
3. **Conteúdo por trecho, em ordem:** treinadores de rota com níveis da tabela, masmorras que faltam (Gruta da
   Maré, Ruínas dos Vigias), arcos de região reequilibrados para os novos níveis.
4. **Pós-jogo:** Mar do Sul e Terras do Ocaso.
