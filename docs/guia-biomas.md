# Guia de biomas e áreas ao ar livre: como vestir as rotas, cidades e biomas do Alvorada

Objetivo: transformar os campos vazios em áreas que leiam como rota de Pokémon, sem perder o que já existe. Escrito a
partir de (a) pesquisa nas gerações originais, (b) medidas diretas nos arquivos de mapa do repositório e (c) leitura
do motor. Esta é uma leitura de projeto: nada foi alterado no jogo.

## 0. Limites da pesquisa (leia antes de usar os números)

- A Bulbapedia respondeu HTTP 403 ao WebFetch e a Spriters Resource também; os trechos vieram de buscas (snippets).
  Não foi possível abrir os mapas (imagens de tiles) das gerações originais. Por isso **não há contagem medida de
  blocos de tiles nos originais**. As regras de densidade abaixo são propostas nossas, justificadas pelas observações
  citadas e pela escala de tela; elas são marcadas como **proposta**.
- Os números "medidos" deste guia são contagens do nosso repositório, feitas nos JSON de mapa (objetos, árvores,
  áreas, caminhos), não rasterização de tiles.
- Os 3 prints do Matheus: (1) campo verde liso com tufos de grama e um quadrado de piso claro isolado (provavelmente um
  `rect` de `plaza` solto); (2) planície de neve com manchas de neve alta, quase sem objetos. Não dá para saber pelo
  print em qual arquivo de região a neve está; o chão usado é `snowfield` (bioma `neve`/`pico`).

---

## 1. Regras medidas nas gerações originais (com fontes)

### 1.1 Forma das rotas

| Regra | Observação | Fonte |
|---|---|---|
| Rotas são faixas longas com 1 a 3 "trechos" | Kanto Route 5 é descrita como três seções verticais, com o meio de mato em faixa, dividido por ledges. | https://bulbapedia.bulbagarden.net/wiki/Kanto_Route_5 (trecho de busca) |
| Mato alto ocupa manchas, não o corredor inteiro | Kanto Route 1 é "riddled with large patches of tall grass and ledges" com pequenas brechas onde a estrada passa; a rota faz um S. | https://bulbapedia.bulbagarden.net/wiki/Kanto_Route_1 (trecho de busca) |
| Ledges são unidirecionais e funcionam como atalho | Em Kanto Route 1, descer pelo ledge evita batalhas; subir exige atravessar o mato. | idem |
| Árvores cortáveis abrem atalhos | Kanto Route 2: árvores que bloqueiam o caminho; na Geração I há três árvores para o Corte ao sul do portão, duas na III e VII. | https://bulbapedia.bulbagarden.net/wiki/Kanto_Route_2 (trecho de busca) |
| Faixas de mato entre cercas | Route 15 (FRLG): rota leste-oeste com faixas de mato entre corredores cercados. | https://rankedboost.com/pokemon/location/firered-leafgreen/route-15/ (trecho de busca) |
| Trilhas paralelas com opções de risco | Route 7 (B2W2): por mato alto, por um caminho elevado com treinador ou por uma ponte fina sobre o mato; usar a ponte pula muitas batalhas. | https://www.gamerguides.com/pokemon-black-white/guide/story-walkthrough/gym-6/route-7 (trecho de busca) |
| Treinador em mato alto com linha de visão | Route 1 (B2W2): treinador se move no mato muito alto e a batalha começa quando o jogador entra no campo de visão. | https://gamerguides.com/pokemon-black-white/guide/story-walkthrough/gym-1/route-2 (trecho de busca) |

### 1.2 Densidade e pontos de interesse (medidos em pelo menos um jogo de referência)

| Regra | Observação | Fonte |
|---|---|---|
| Rotas curtas têm pouquíssimo conteúdo | Route 217 (Platinum): 2 manchas de grama "muito pequenas", 13 itens (4 no chão, 7 do Dowsing, 2 presentes) e 11 treinadores nomeados nas seções DP e Platinum. | https://serebii.net/pokearth/sinnoh/4th/route217.shtml (página lida) |
| A rota tem 3 saídas, neve forte e poucas bordas definidas | Route 217: saídas norte (Acuity Lakefront), sul (Rota 216) e leste (Snowpoint City); neve "mais forte que qualquer outro lugar" limita a visão. Não cita penhascos nem árvores como limites. | idem |
| Entrada estreita e pontos de grama | Route 217: a passagem de entrada é "narrow", com grama no topo e perto da Ice Rock. | https://www.dragonflycave.com/locations/gen4/167/ (página lida, resposta resumida) |
| Deserto tem terreno variado | Desert Resort: areia, colinas, vales e areia funda; entrada sudeste por uma colina rochosa; castelo ao norte-central guardado por estátuas. | https://bulbapedia.bulbagarden.net/wiki/Desert_Resort (trecho de busca) |
| Rota de deserto é uma estrada semi-construída | Route 4 (BW): estrada de deserto com as duas pontas abertas e uma bifurcação no meio. | https://bulbapedia.bulbagarden.net/wiki/Unova_Route_4 (trecho de busca) |
| Região aberta tem vários corredores de grama e relevo | Obsidian Fieldlands (Legends Arceus): planícies com manchas de flores e florestas, rios de norte a sul, colinas no centro, ~duas dezenas de sub-áreas nomeadas, cercada por praias e montanhas; um lago fechado por penhascos em quase todo o contorno. | https://bulbapedia.bulbagarden.net/wiki/Obsidian_Fieldlands (trecho de busca) |

**Lacuna declarada:** não foi possível obter contagem de tiles por rota nem a largura exata de corredores nos
originais. Quem tiver acesso aos mapas (Porymap/decomp de pokeemerald, ou dumps de tiles das gerações III-IV) deve
conferir os números da seção 4 antes de fechá-los.

### 1.3 Ferramenta de referência para a geometria em grade

- Um romhack em pokeemerald-expansion recorta o HGSS em blocos de 16 px e separa "grama alta em nine-slice" e
  "ledges e muros de uma peça" (romhack, não oficial): https://github.com/Davisfox5/pokeemerald-expansion/pull/3
- Tutorial de fangame: canvas de 26 x 34 blocos para uma rota, com ledges que obrigam o jogador a atravessar o mato
  na ida e permitem pular na volta: https://daily.pokecommunity.com/2017/09/14/fangame-tutorials-mapping-routes/2/

### 1.4 Limite de tela (regra física, não de design)

- GBA: 240 x 160 px = **15 x 10 blocos** de 16 px = 150 blocos por tela.
- DS: 256 x 192 px = **16 x 12 blocos** = 192 blocos por tela.

Uma rota precisa ter o que mostrar **a cada tela** (~150-190 blocos), não a cada 30 blocos. Nossa câmera 3/4 mostra
mais que uma tela GBA; medir na tela real antes de fechar os números da seção 4.

---

## 2. Medidas do nosso repositório (contagem nos JSON, não em jogo)

Script de contagem: feito em scratchpad, não commitado. Objeto e árvore contados pelo `x,y` dentro do retângulo da
área (`areas[].rect`); "por 1000 blocos²" = objetos / área x 1000.

### 2.1 Densidade por área (mundo Alvorada, `assets/maps/alvorada.json` e região Geada)

| Área | Bioma | Retângulo | Objetos | Por 1000 blocos² |
|---|---|---|---|---|
| Rota 7 | campo | 156 x 18 | 0 | 0,0 |
| Praia oeste | praia | 62 x 44 | 0 | 0,0 |
| Campos ao norte da Rota 1 | campo | 170 x 48 | 3 | 0,4 |
| Lago Espelho | margem | 168 x 92 | 4 | 0,3 |
| Rota 4 | margem | 44 x 50 | 4 | 1,8 |
| Rota 6 | campo | 120 x 46 | 11 | 2,0 |
| Rota 1, Campos de Lúmen | campo | 106 x 56 | 17 | 2,9 |
| Bosque Sussurrante | floresta | 252 x 108 | 28 | 1,0 |
| Cidade Campina | vila | 64 x 64 | 39 | 9,5 |
| Cidade Coral | vila | 86 x 42 | 37 | 10,2 |
| Cidade Aurora | vila | 77 x 52 | 36 | 9,0 |
| Geada: Geleira do Uivo | neve | 160 x 160 | 35 | 1,4 |
| Geada: Rota 16 (trecho) | neve | 160 x 90 | 13 | 0,9 |
| Geada: Rota 15 | planalto | 160 x 70 | 13 | 1,2 |
| Geada: Vila Geada | vila | 60 x 50 | 41 | 13,7 |

**Leitura:** rota e campo têm entre 0 e 3 objetos por 1000 blocos² (um objeto a cada 300 a 2500 blocos); vila tem
9 a 14 (um a cada ~100). Um campo de 170 x 48 blocos (8160) tem 3 objetos: é o print 1.

### 2.2 Outros indicadores

| Indicador | Alvorada | Geada | Sertão | Jandaia | Brasas | Austral |
|---|---|---|---|---|---|---|
| Objetos (total) | 390 | 146 | 200 | 529 | 697 | 0 |
| Árvores soltas (`trees`) | 15 | 5 | 18 | 0 | 0 | 0 |
| Zonas de mata (`forestZones`) | 2 | 1 | 0 | 0 | 0 | 0 |
| Operações `forest` (`ops`) | 5 | 10 | 0 | 2 | 0 | 0 |
| Blocos de cerca (`fence`) | 322 | 0 | 0 | 0 | 0 | 0 |
| `decor` (plano) | 7 | 0 | nd | nd | nd | nd |
| Operações `scatter` | 4 | 3 | nd | nd | nd | nd |
| Largura de `path` (blocos) | 3 (15 de 27), 2, 4, 5 | 1 a 3 | 3 a 5 | 2 a 3 (um de 9) | nd | nd |

nd = não há dado (arquivo sem essa operação). "Austral" tem zero objetos: a região existe só como contorno.

Notas:
- Toda árvore que aparece em rota é colocada à mão (`trees`, `objects`) ou herdada de uma `forestZones`. Não há
  geração automática de bordas de rota.
- A única fileira de árvore de borda automática é a dos blocos `forest`, e só onde a arte pinta `forest`.
- As fileiras de cerca de Alvorada (322 blocos) estão nas cidades e na área central; nenhuma região nova tem cerca.

### 2.3 Como as áreas são pintadas (fonte da vazio)

`tools/gerar-regioes.mjs`, linhas 15-23 (tabela `CHAO`) e 76-80 (laço das áreas):

- Cada área recebe **uma** elipse de chão (`elipse(chao, rect, 0, 0.6)`) e, se houver, **uma** operação `blobs` de mato
  alto com `scale: 0.12` e `th: 0.62`. Essa é a única textura de rota gerada.
- Não há objeto, árvore, cerca, ledge, penhasco, relevo, caminho novo ou marco. As únicas coisas que o gerador põe são
  o Ninho de pouso por cidade, os cais e o contorno de terra/mar (cabeçalho da linha 1-3 do próprio arquivo).
- O cabeçalho do gerador diz "ponto de partida"; o trabalho de vestir foi deixado para a mão. Por isso toda região
  nova nasce vazia por construção.

---

## 3. Por que o mapa está vazio (causas-raiz, com arquivos)

1. **Gerador de região cria só o chão.** `tools/gerar-regioes.mjs` L15-23 e L76-80: uma elipse de chão e um `blobs` de
   mato por área. Nenhum passo de decoração existe no gerador. Causa direta das regiões novas (Geada, Sertão, Jandaia,
   Austral, Brasas).

2. **Mato alto é esparso por desenho.** `blobs` com `th: 0.62` e `scale: 0.12`
   (`tools/gerar-regioes.mjs` L80; `src/world/build.js` L132-134, fbm acima do limiar): manchas raras, poucas por área.
   Só 7 `blobs` `tall` em Alvorada inteira; 1 em Geada.

3. **Grama 3D é tufo, não relevo.** `src/visual3d/ambiente/grama.js` L153-171 põe 12 tufos (`capim`) por bloco de grama
   e 16 por bloco de mato alto. Isso dá textura de "tapete" que parece cheio de longe, mas não há objeto nem altura. O
   resultado é o print 1: muita grama fina, nenhum volume.

4. **Objetos são autorados um a um.** `objects` em `alvorada.json` (390 entradas) e nos regioes. O catálogo
   (`src/world/objects.js`, ~110 tipos) está completo, mas ninguém o usa em escala. As áreas `campo` têm 0 a 3 objetos.

5. **Nenhum passo "vestir" existe.** `decor` tem 7 entradas em Alvorada e 0 em Geada. `DECOR` em `objects.js` (rug,
   pebble, mush, wheat) não é espalhado por código. `scatter` (`build.js` L136-138) existe, mas quase não é usado.

6. **Rotas não têm limite.** Não há corredor com borda. As áreas são só retângulos com nome. Sem `forest`/`cliff` de
   borda, o jogador anda pelo campo aberto inteiro. Em Geada, `path` tem larguras de 1 a 3 blocos e a neve é `snowfield`
   nos 250 `rect` (`geada.json`), sem nenhuma forma de quebra.

7. **Terreno sem relevo na neve.** `geada.json` pinta `snowfield` em 250 `rect` e 21 `ellipse`; nenhuma colina ou
   barranco. Não verifiquei a altura do terreno 3D (`src/visual3d/ambiente/terreno.js`), mas a captura 2 mostra chão
   plano.

8. **Sem ledge unidirecional.** `src/world/tiles.js`: `CLIFF` é sólido em `SOLID`, e não existe tile de ledge que deixa
   descer e impede subir. Sem isso, não dá para ter o atalho de ledge das gerações originais.

9. **Não há medida de vazio.** Nenhum script conta densidade. O único teste de mapa (`tools/teste-mapa/nucleo.mjs`)
   compara o núcleo com referência e exige Chrome; não serve para medir pouco conteúdo.

10. **Modelos 3D não cobrem os biomas.** `assets/hgss/modelos/_lista.json` (729 itens) tem árvores, arbustos,
    cercas, pedras e cogumelos de `kenney/nature`, mas **nenhum** nome com neve, gelo, duna, vulcão, coral, junco ou
    mangue. Os biomas precisam dos construtores de `src/visual3d/kit/natureza.js` (já há copa, conífera com neve,
    tronco) ou de novos modelos.

---

## 4. Regras-alvo para o nosso motor (propostas)

Estas são propostas de projeto. Ajustar depois de ver na tela, não antes.

### 4.1 Corredores de rota

- **Largura de caminho:** 4 a 6 blocos para rota principal, 3 para trilha, 2 para atalho. Hoje a maioria é 3.
- **Limites:** cada corredor tem borda contínua de um dos tipos: árvore (`forest` com fileiras), penhasco (`cliff`), água
  funda, cerca (`fence` ou `wfence`), muro de rocha (`rock`). Borda aberta só em praia e planície de sal.
- **Campo de visão:** a borda fica a 3 a 6 blocos do centro do caminho. Vista de 15 blocos de largura: o jogador vê a
  rota inteira e não o campo todo.
- **Bifurcação:** a cada 60 a 90 blocos, uma saída lateral com item ou treinador (1 a 2 por rota longa).
- **Ledge (quando o motor suportar):** faixa de 1 bloco de penhasco que desce mas não sobe; deixar 1 brecha de 2 blocos
  para a estrada, como em Kanto Route 1.

### 4.2 Densidade (por tela de 15 x 10 blocos)

| Tipo de área | Objetos por tela | Mato alto (manchas) | Marcos | Itens no chão |
|---|---|---|---|---|
| Rota de campo | 3 a 6 | 2 a 4 manchas de 4 x 3 a 6 x 4 | 1 por tela de corredor | 1 a cada 120 blocos |
| Rota de mata | 5 a 8 | mato em faixas paralelas ao corredor | 1 por tela | 1 a cada 100 blocos |
| Cidade | 8 a 15 | nenhum | praça + 2 marcos | 1 por casa com interior |
| Biomas (deserto, neve, vulcão) | 2 a 5 | 1 a 2 manchas | 1 por tela | 1 a cada 150 blocos |

Hoje: rota ~0,4 a 2,9 objetos por 1000 blocos² (~0,06 a 0,4 por tela). A meta de 3 a 6 por tela é 10 a 20 vezes mais.

- **Espaçamento de marcos:** um marco (placa, cerca com portão, árvore grande, rocha, altar, poste) a cada 40 a 50
  blocos ao longo da rota. Nunca dois marcos iguais em sequência (variar o tipo).
- **Treinadores:** no máximo 1 a cada 60 blocos de corredor; com linha de visão de 4 a 6 blocos, sempre dentro de um
  trecho de mato ou atrás de uma curva, nunca em campo aberto de 15 blocos.
- **Placas:** uma em cada entrada de rota e em cada bifurcação.
- **Portão de rota:** entre áreas com mudança de bioma, usar `gate`/`fence` com 1 a 2 blocos de largura.

### 4.3 Vilas

- Praça central com fonte ou estátua (`fountain` não está no catálogo 2D; usar `well`, `statue` ou `altar`).
- Caminho de terra que liga as portas (`path`, 2 a 3 blocos) e cerca de jardim.
- 8 a 15 objetos, 1 flor ou canteiro a cada 6 a 8 blocos, 1 a 2 moradores fora de casa.
- Cerca de madeira (`fence`) em quintais; não em praça.

### 4.4 Paletas de bioma (chão, mato, props)

A coluna "existe" usa o catálogo 2D (`src/world/objects.js`) e os tiles de `src/world/tiles.js`. A coluna "3D" indica
se há construtor em `src/visual3d/kit/natureza.js`; onde não há, marca "verificar" (não conferi cada função).

**Temperado (rota e floresta)**
- Chão: `grass`, `grass2`, `flowers`; mato `tall`; floresta `dark` + `forest`.
- Props: `tree`, `tree2`, `pine`, `pine2`, `autumn`, `bigtree`, `oran`, `pecha` (árvores de baga), `bush`, `roundbush`,
  `boulder`, `log`, `stump`, `sign`, `fence`, `wfence`, `lamp`, `mailbox`, `flowerpot`.
- 3D: árvores redondas e cônicas no kit; `kenney/nature` tem `tree_default`, `tree_pineRound*`, `plant_bush*`,
  `flower_*`, `mushroom_*`, `stump_*`, `log_*`, `rock_*`, `stone_*`, `fence_*`, `sign`.
- Cerca de rota com portão: `kenney/nature/fence_gate` existe no catálogo 3D; não conferi se algum mapa o usa.

**Praia e costa**
- Chão: `sand`, `wetsand`, `tide`, `deep`, `dock`; borda de `reef` e `cur_*` (correntes).
- Props: `beachStall`, `surfboard`, `driftwood`, `jangada`, `boia`, `palmeira`, `coqueiro`, `skull`, `barrel`.
- 3D: `kenney/nature/tree_palm*`, `platform_beach`, `canoe`. Falta: conchas, corais, pedras da maré (`verificar`).

**Neve e gelo (Snowpoint, Rota 216/217, Monte Coronet, Icirrus)**
- Chão: `snowfield`, `deepsnow` (lento, 0,55), `tallsnow`, `ice`, `frozen`; paredes `icewall`.
- Props: `snowPine`, `snowPineBig`, `snowman`, `igloo`, `cabin`, `stalagmiteIce`, `iceBlock`, `crystal`, `boulder`.
- Referência em Serebii (Rota 217): pouca grama, neve forte, duas manchas de grama, uma rocha de gelo (Ice Rock).
- Falta na 3D: conífera com neve existe (`conifera(neve: true)` em `natureza.js`), mas não há modelo `kenney` de neve.
  Faltam: pedra de gelo grande, ponte de gelo, árvore morta de neve.

**Vulcão e cinza (Rota 113, Monte Chaminé, Cinnabar)**
- Chão: `basalt`, `ash`, `obsidian`, `lava` (brilha à noite), `lavafloor`, `hotspring`.
- Props: `lavaRock` (com luz), `obsidianRock`, `fumarola`, `brazier`, `torch`, `stalagmite`.
- Falta na 3D: rocha vulcânica (basalto), nenhum modelo `lava`/`volc` na lista.

**Deserto (Rota 111, Rota 4 BW, Desert Resort)**
- Chão: `dune` (correr é 0,88), `quicksand` (0,45), `cracked`, `canyon`, `redrock`.
- Props: `cactus`, `mandacaru`, `xiquexique`, `juazeiro`, `statue`, `obelisk`, `brokenColumn`, `altar`, `menhir`.
- 3D: `kenney/nature/cactus_short`, `cactus_tall`, `rock_*`, `statue_*`, `statue_obelisk`, `statue_column`.
- Falta: duna (modelo), ruína de areia.

**Jungla e floresta tropical (Rota 119/120)**
- Chão: `dark`, `tall`, `roots`, `mangmud`; mato `talldry`/`tall`.
- Props: `arvoreSelva`, `folhaGigante`, `bambu`, `araucaria`, `mangue`, `umbu`, `mural` (ruína).
- 3D: `kenney/nature/crops_bambooStage*` (bambu), `tree_palm*`, `hanging_moss`.
- Falta: cipó como modelo (`MOUNT_PASS.escalar` usa `TILE.CLIMB`), árvore gigante de copa larga.

**Cavernas**
- Chão: `cave`, `darkcave`, `grass2`, `crystalfloor`; paredes `rock`, `cavedoor`.
- Props: `stalagmite`, `crystal`, `crystalPink`, `lanternaPedra`, `chest`, `torch`.
- 3D: `kenney/nature/cliff_cave_*`, `rock_tall*`, `stone_tall*`.

**Brejo e pântano (Grande Pântano)**
- Chão: `shallow` (0,72), `reed` (0,65), `mud` (lama funda, bloqueia sem montaria), `mangmud`.
- Props: `reed`, `bambu`, `mangue`, `driftwood`; caminho de madeira (`bridge` ou `bridgeV`).
- 3D: `kenney/nature/bridge_wood*`, `path_wood*`, `canoe`, `lily_*`. Falta: junco alto em 3D (existe `tallDry`/`reed` 2D).

**Montanha e planalto**
- Chão: `grass`, `tall`, `rock`, `cliff`; trilha de `path` com `gate`.
- Props: `boulder`, `boulder2`, `grayrock`, `menhir`, `column`, `windmill`, `bell`.
- 3D: `kenney/nature/cliff_*`, `rock_large*`, `stone_large*`, `ground_pathRocks`.

**Mar e rotas marítimas**
- Chão: `deep`, `shallow`; correntes `cur_*`; `reef`.
- Props: `boia`, `jangada`, `dock`, `skull`.
- Falta: boia e bloco de coral 3D (sem `coral` na lista).

---

## 5. Legibilidade na câmera 3/4 de cima

Regras que o nosso motor precisa respeitar (a câmera mostra o topo e a frente dos objetos):

1. **Camadas:** chão < decoração plana (`decor`, `pebble`, `mush`) < objetos com y-sort < personagens < teto. Já é o
   padrão (`objects.js`, comentário em `DECOR`). Não colocar decoração plana acima de um personagem.
2. **Bordas:** toda rota deve ter borda com volume (árvore, penhasco, cerca, rocha) de 1 a 2 blocos de altura visual.
   Chão plano sem borda lê como "campo infinito", que é o problema do print 1.
3. **Contraste:** duas famílias de cor por área, uma para chão e outra para o que limita. Hoje o campo usa um único
   verde; falta a segunda família (caminho de terra ou flor).
4. **Sombra:** `tx.shadow` (16 x 8, elipse) existe em `makeTiles()`. Dar sombra a todo objeto sólido, inclusive cerca
   e marco.
5. **Escala:** árvore de 2 x 1 blocos e rocha de 1 x 1. Não misturar dois objetos do mesmo tamanho lado a lado sem
   variação (já há `v` de variante no 3D).
6. **Mato alto:** a linha de contorno do mato tem que ser visível de cima. Hoje `blobs` gera manchas soltas; uma
   mancha de 4 x 3 blocos com borda seca lê melhor que uma grande com borda difusa.
7. **Sem tudo de uma vez:** em cada tela, um ponto focal (marco, treinador, placa ou porta). Não 8 objetos iguais.

---

## 6. Plano de implementação

### 6.1 Decisão: gerador ou passo de runtime?

**Recomendação: gerador offline que reescreve o JSON**, mais um passo de runtime só para o que é visual.

Motivos:
- Os mapas são lidos e editados à mão (`assets/maps/LEIAME.md`, `tools/formatar-mapa.py`). Um passo de runtime
  esconderia o resultado da edição e quebraria o `formatar-mapa.py`.
- O online leva a posição de cada jogador por bloco (`LEIAME.md`, seção Viagens). Um passo de runtime não determinístico
  daria mapas diferentes por cliente. Com seed fixa por região, o gerador dá o mesmo resultado sempre.
- As regiões já têm semente própria (`LEIAME.md`, "Cada região tem a própria semente"); o gerador pode usar a mesma.
- Os objetos gerados ficam no JSON e podem ser apagados por região; o núcleo continua intocado (`nucleo.mjs`).

**Runtime (já existe, manter):** grama 3D (`grama.js`), flores, luz de noite. Não gerar props em runtime.

### 6.2 Passos, em ordem

**Passo 0 (medida, sem mexer no jogo).** Criar `tools/densidade.mjs` (Node, sem Chrome) que lê um JSON de mapa e
imprime: objetos por 1000 blocos² por área; percentual de blocos de rota a até 3 blocos de borda sólida; largura média
de caminho; marcos por 100 blocos. Rodar nas regiões atuais para ter a linha de base da seção 2. Aceitação: tabela
impressa para as 6 regiões + núcleo.

**Passo 1 (corredores).** Estender `tools/gerar-regioes.mjs` com uma função `corredores(area, polilinha)`:
- para cada rota (`areas` com `tipo: 'rota'` ou os `path` já existentes), gerar um corredor de 4 a 6 blocos;
- colocar borda de `forest` (fileira de árvore) ou `cliff` a 3 a 6 blocos do eixo, com brechas nas bifurcações;
- deixar o eixo como `path`; a faixa entre a borda e o eixo como `grass`/`tall`.
Aceitação: `densidade.mjs` mostra borda contínua em pelo menos 80% de cada rota, e o retângulo de cada rota tem
bloco sólido nas duas laterais.

**Passo 2 (vestir).** Novo `tools/vestir.mjs` (ou função dentro de `gerar-regioes.mjs`) que, por área e bioma:
- espalha `scatter` de decoração plana (`pebble`, `mush`, `flowers`) com `p` por bioma;
- planta objetos por tabela de bioma da seção 4.4 com densidade da seção 4.2, respeitando borda e marcos;
- põe mato alto em manchas com `blobs` `th` entre 0,55 e 0,6 e `scale` 0,18 (manchas ~6 blocos);
- coloca marcos a cada 40 a 50 blocos ao longo do eixo; placa em entrada e bifurcação;
- põe treinadores e itens só depois, à mão (campo de visão é decisão de jogo).
Aceitação: `densidade.mjs` mostra objetos por tela na faixa da seção 4.2 para rota e vila.

**Passo 3 (3D).** Confirmar no visual3d (`src/visual3d/kit/natureza.js`) quais tipos já têm construtor; criar os que
faltam para neve (pedra de gelo), deserto (duna pequena, pedra de areia), vulcão (basalto), junco (reed) e coral.
Prioridade: neve e deserto, porque os prints e a área da Geada dependem de neve.

**Passo 4 (ledge).** Só depois de decidir: criar tile `LEDGE` com regra de passagem no sentido único em
`src/world/tiles.js` (e no `SOLID`/movimento). Sem isso, usar `cliff` com brecha.

**Passo 5 (verificação).** Rodar `densidade.mjs` nas regiões e conferir os números; abrir cada região no navegador com o
flag de teste (`?teste=1&ir=...`) e comparar o print com o de hoje. Essa parte exige o navegador: fica com o Matheus
ou com quem for rodar a sessão de teste.

### 6.3 Ordem de trabalho sugerida

1. Passo 0 (medida) — baixo risco, mostra a linha de base.
2. Passo 1 nas rotas de Geada e Sertão (regiões que estão mais vazias: 0 `forest` em Sertão, 5 árvores em Geada).
3. Passo 2 na mesma região; comparar.
4. Passo 3 para neve, depois deserto.
5. Repetir para Jandaia/Brasas/Austral.
6. Revisar as cidades de Alvorada só depois (já têm densidade adequada).

---

## 7. Resumo das lacunas

- Nenhuma medida de tiles nos originais (Bulbapedia 403; Spriters Resource 403). Usar o print de cada geração quando
  houver acesso.
- Largura exata de corredores nos originais: não obtida.
- Nenhum modelo 3D de neve, gelo, duna, vulcão, coral, junco ou mangue. Usar construtores do kit ou criar.
- Nenhum tile de ledge unidirecional.
- Nenhum script de densidade no repositório.
