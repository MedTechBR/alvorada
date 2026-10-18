# Pokémon Alvorada 2D: o mundo ampliado

Projeto pessoal de fã, sem fins comerciais. Este documento é o plano do mundo gigante, em **mundo aberto**: o que
existe, onde fica, como se chega, quem mora lá, quais Pokémon vivem em cada canto e quão difícil é cada lugar. Ele é a
base para os agentes que vão desenhar o mapa (uma região cada), o sistema de missões (ramo `missoes`), a arte dos
biomas (ramo `biomas`) e o roteiro de mundo aberto (ramo `mundo-aberto`).

Os dados de máquina estão em `docs/mundo-expandido.json` e a distribuição das espécies em `src/data/habitats.js`. Os
dois são **gerados**: a fonte é `tools/mundo/*.mjs` e o gerador é `tools/gerar-mundo.mjs` (seção 14). As tabelas
marcadas como geradas neste arquivo também são reescritas pelo gerador; o resto é texto à mão.

---

## 1. Mundo aberto: as regras

- **Nada fecha por capítulo nem por insígnia.** O que separa os lugares é o terreno: lama funda, água, paredão, céu,
  neve funda e redemoinho. Cada barreira cai quando o jogador tem um Pokémon capaz daquele modo (um Lapras capturado
  já nada; as espécies capazes de cada modo são decisão do ramo de montarias).
- **A única exigência de insígnias é a Liga**, com as 8. Algumas coisas depois da trama principal (o Relógio, o
  Necrozma, as Fendas Ultra) pedem que a trama tenha acontecido, não um número de capítulo.
- **A progressão é a dificuldade de cada lugar.** O nível dos selvagens cresce com a distância de caminho desde a Vila
  Alvorada e com o quanto o lugar é difícil de alcançar (montaria exigida, escondido, fundo de dungeon, outro
  continente). Seção 8.
- **Ginásios com nível fixo pelo lugar**, numa escada coerente com essa distância. Qualquer ordem vale, desde que o
  jogador consiga vencer. Seção 8.
- **A história vira jornadas por cidade** mais uma trama principal que avança pelo número de insígnias (ramo
  `mundo-aberto`). Nada aqui depende de ordem: regiões, dungeons e missões funcionam a qualquer momento; quando uma
  missão continua outra, ela diz "depois de".

---

## 2. Tamanho do mundo e como o que existe se encaixa

**Continente de Alvorada: 1200 × 960 blocos externos** (o mapa de hoje tem 600 × 480: são **4 vezes a área**). Mais
o continente do **Ocaso**, num arquivo próprio, com **960 × 720 blocos externos** (seção 3). Somando, o mundo externo
tem cerca de 6,3 vezes a área de hoje.

**Nada do lado de fora se move.** O núcleo atual continua em x 0–599, y 0–479, com as mesmas coordenadas. O mundo
cresce para leste (x 600–1199) e para o sul (y 480–959).

**Só a faixa de interiores se desloca**, porque hoje ela ocupa y 480–675, que vira mar. Deslocamento exato:
**dy = +480** para todos os interiores (y 480–675 passa a y 960–1155). As salas ficam na faixa do núcleo
(y 960–1279) e cada região nova ganha a sua faixa (seção 4). Altura total do arquivo: **h = 2080**.

### Migração do núcleo, passo a passo (para o primeiro agente do mapa)

1. Em `assets/maps/alvorada.json`: `w` 600 → **1200**, `outdoorH` 480 → **960**, `h` 676 → **2080**.
2. A operação 0 (`rect void 0 480 600 196`) vira `rect void 0 960 1200 1120` (vazio só na faixa de interiores).
3. Todo interior: `y += 480`. Todo ponto de `spots` com y ≥ 480 (pontos dentro de salas, como `nurse`): `y += 480`.
   Todo `warps[].to` com y ≥ 480: `y += 480`. Pontos internos das salas (`interiors[].spots`, `people` das salas) são
   relativos à sala e não mudam. Conferido: nenhum arquivo de `src/` usa coordenada absoluta da faixa de interiores.
4. A borda de mata (operação 125, `border forest 0 150 600 330`) continua, mas com as quatro aberturas das passagens
   (seção 5): estrada em x 598–599, y 200–207; mar em x 598–599, y 416–477; e mar em toda a linha y 478–479, x 2–597.
5. `include` passa a listar, além do esboço, um arquivo por região (seção 4).
6. Jogos salvos: quem salvou dentro de uma sala (y ≥ 480 × 16 px) tem `y += 480 × 16` ao carregar (subir
   `SAVE_VERSION` e migrar).

O esboço (`esboco.json`) continua sendo a planta do núcleo e não precisa mudar.

---

## 3. Continentes, ilhas e a escolha técnica

### O que existe

- **Continente de Alvorada** (o da história), com seus mares e arquipélagos: Mar do Sul, Arquipélago das Jandaias
  (tropical), Recife Grande, Ilha do Farol Morto (templo afundado), Ilhas Austrais (geladas), Arquipélago das Brasas
  (vulcânico), Ilha Miragem (secreta) e Ilhota Fumegante (secreta), além das ilhas que já estão na história (Ilhas
  Coral, Ilha do Véu, Ilha do Sol Nascente).
- **Terras do Ocaso**, a oeste, além do Mar do Poente: o outro lado do dia. Onde Alvorada é madrugada, o Ocaso é fim de
  tarde. Clima de pampa e de cordilheira: coxilhas verdes, estâncias, o Pantanal alagado, as Cataratas do Trovão, o
  altiplano, o Salar Branco, o Deserto do Silêncio, um vulcão e os campos de gelo do sul. Cultura dos **Pastores do
  Poente**, povo-irmão dos Vigias, que guardavam o pôr do sol como os Vigias guardavam o nascer. É o continente das
  áreas avançadas (selvagens de nível 57 a 79) e das formas de Paldea, Hisui e parte das de Galar.

### Meios de viagem

| Meio | Como funciona |
|---|---|
| Balsas e navios | Coral–Jandaia (8h, 13h, 18h, ₽300), Barco das Brasas Vila Siri–Vila Termas (7h e 15h, ₽500, parada na Ilha do Basalto), Navio de Pesquisa Coral–Estação Austral (seg, qua, sex às 10h, ₽800), Bote do Seu Nestor Porto Espelho–Ilha do Véu (de dia, grátis), **Cargueiro Estrela-d’Alva** Coral–Porto Rubro (10h e 22h; o comandante é o Capitão Ivo, o pai do jogador; antes de ele voltar, um mestre de navio faz a rota por ₽2000). |
| Trem da Aurora | Trem animado na ferrovia da Rota 6 e da Rota 14: estações em Vila Lamparina, Cidade Aurora e Vila Mandacaru; passa de 10 em 10 minutos de jogo; ₽200. |
| Nadar | Qualquer água profunda; todas as divisas de mar entre regiões são abertas. |
| Voar | Pousa em qualquer Ninho já visitado (um por cidade e vila, e um em cada dungeon de ilha). Entre continentes, só depois de ter chegado uma vez de navio. |
| Mergulhar | Redemoinhos escuros levam a mapas submersos (interiores com bioma `recife` ou `abismo`): Recife Afundado, Recife Grande, Gruta da Maré (fundo), Santuário do Crepúsculo, Templo das Marés, Fossa Abissal. |

### Recomendação: um arquivo por continente, e cada continente montado de um arquivo por região

**Alvorada fica num mapa só** (o mesmo `alvorada.json`), com seus mares e ilhas, porque eles são contíguos: dá para
nadar da Costa Coral até as Brasas, e o voo e o minimapa continuam simples. Cada região é desenhada num arquivo próprio,
juntado pelo `include` que o motor já tem. **O Ocaso fica num arquivo separado** (`assets/maps/ocaso.json`, também
com um arquivo por região), ligado a Alvorada pelo navio e, depois da primeira visita, pelo voo.

Por quê:

- Hoje `build.js` monta um JSON só e pinta todas as operações ao carregar; os setores de 16 × 16 blocos são desenhados
  sob demanda. Isso aguenta bem 1200 × 2080 (2,5 milhões de blocos, ~9800 setores). Pôr o Ocaso no mesmo arquivo pediria
  um oceano vazio de centenas de blocos entre os dois (ou um teletransporte, que é o mesmo que um segundo mapa) e
  dobraria o tempo de montagem para quem nem foi lá.
- O minimapa e o mapa da região no menu desenham `w × outdoorH` num canvas de 1 pixel por bloco: um continente por vez
  fica legível; os dois juntos, não.
- O online transmite posição; com mundos separados, quem está no outro continente simplesmente não aparece, e cada mundo
  valida as próprias coordenadas.
- Arquivos por região deixam vários agentes trabalharem ao mesmo tempo sem conflito.

### O que o motor precisa ganhar

Para o continente de Alvorada maior (pouco):

1. `include` (em `src/world/map.js`) juntar também `interiors`, `people`, `pets`, `noTrees`, `radius` e `signs` dos
   arquivos incluídos (hoje junta só `ops`, `objects`, `decor`, `trees`, `areas`, `items`, `warps` e `spots`).
2. Setores visitados (`src/world/life.js` e `src/world/minimap.js`) usam `cx + cy * 64`; com 75 setores de largura isso
   colide. Trocar 64 por `Math.ceil(map.w / 16)` e converter os índices salvos (o índice antigo `i` vira
   `(i % 64) + Math.floor(i / 64) * 75`).
3. `src/net/validate.js` aceita posições até 1024 × 16 px: subir para `2080 × 16` (ou ler `w` e `h` do mapa).
4. Medir o tempo de montagem no celular; se passar de ~1 s, montar as operações de cada região na primeira vez em que
   um setor dela entra na tela.

Para o segundo continente:

1. Um registro de mundos (`assets/maps/mundos.json`: id, arquivo, nome) e um `GameMap` que pode ser trocado: descarta
   setores, entidades e selvagens, monta o outro mapa e põe o jogador no ponto de chegada.
2. O jogo salvo guarda `mundo` (padrão `alvorada`); a posição vale dentro daquele mundo.
3. O online manda `mundo` junto com a posição; quem está em outro mundo fica escondido e as trocas e duelos continuam
   valendo (são por sala, não por mapa).
4. Minimapa e mapa do menu por mundo (abas Alvorada e Ocaso no menu).
5. Destinos de voo com mundo; o roteiro (`src/story/roteiro.js`) diz `mundo: 'ocaso'` em vez de `'mundo'` para
   pontos do lado de fora do outro continente. Os ids de área e de interior já são únicos entre os dois mundos.

---

## 4. Regiões de construção

Retângulos sem sobreposição, em blocos. Cada região é um arquivo e **só pinta dentro do próprio retângulo**,
começando com um `rect` de fundo que cobre o retângulo inteiro. Os interiores de cada região ficam na faixa dela.

| Região | Mundo | Retângulo [x, y, w, h] | Faixa de interiores [x, y, w, h] | Arquivo | Resumo |
|---|---|---|---|---|---|
| Núcleo de Alvorada | Alvorada | [0, 0, 600, 480] | [0, 960, 1200, 320] | `alvorada.json` + `esboco.json` | a região da história (já desenhada nos capítulos 1 a 6) |
| Cordilheira Geada | Alvorada | [600, 0, 600, 200] | [0, 1280, 1200, 160] | `regioes/geada.json` | neve, lago congelado, geleira, caverna de gelo, fiorde |
| Sertão do Levante | Alvorada | [600, 200, 600, 280] | [0, 1440, 1200, 160] | `regioes/sertao.json` | caatinga, cânion, chapada, dunas, oásis, mangue |
| Arquipélago das Jandaias | Alvorada | [0, 480, 400, 480] | [0, 1600, 1200, 160] | `regioes/jandaia.json` | ilha tropical, ilhas gêmeas, selva, cachoeira, templo, ilha secreta |
| Mar do Sul e Ilhas Austrais | Alvorada | [400, 480, 400, 480] | [0, 1760, 1200, 160] | `regioes/austral.json` | recife de mergulho, farol morto e templo afundado, fossa, ilhas geladas |
| Arquipélago das Brasas | Alvorada | [800, 480, 400, 480] | [0, 1920, 1200, 160] | `regioes/brasas.json` | praia de areia preta, fontes termais, cinzas, vulcão, templo do fogo |
| Ocaso Leste | Ocaso | [480, 0, 480, 720] | [0, 720, 960, 160] | `ocaso/leste.json` | Porto Rubro, pampa, Pantanal, cataratas, delta, araucárias |
| Ocaso Oeste | Ocaso | [0, 0, 480, 720] | [0, 880, 960, 160] | `ocaso/oeste.json` | cordilheira, vulcão, altiplano, salar, deserto, cratera, gelo do sul |

Regras para quem desenha uma região:

- Use as áreas de `docs/mundo-expandido.json` (`areas[]`, com `rect`, `bioma` e `id`) como `areas` do mapa, com os
  mesmos ids. Copie a tabela de cada área de `src/data/habitats.js` (`AREAS_ENCONTROS[id].dia` como `encounters`,
  `.noite` como `night`) ou deixe a área sem tabela e o motor usa a do bioma.
- Toda área com montaria em `acesso` precisa mostrar o obstáculo antes de o jogador ter o Pokémon capaz (a parede com
  trepadeira, o redemoinho, a neve funda).
- Cada cidade e vila: todos os prédios da seção 10 com interior, um Ninho de pouso e um Centro Pokémon.
- As passagens da seção 5 são exatas: pinte exatamente aquelas células, com 4 blocos livres de cada lado.

---

## 5. Passagens entre regiões

Células `[x0, y0, x1, y1]` inclusivas. Nas divisas de mar, os dois lados pintam água funda nas 4 linhas ou colunas
vizinhas da divisa, salvo onde uma passagem diga outra coisa.

| Passagem | Entre | Células | Terreno | Exige | Núcleo / lado A | Lado B |
|---|---|---|---|---|---|---|
| Passo do Uivo (Rota 9 → Rota 15) | Núcleo ↔ Geada | [599, 66, 600, 77] | trilha | — | estender a trilha da Rota 9 do Mirante (516, 72) até (599, 72), largura 6; a borda leste do planalto já é capim | Rota 15 começa em (600, 66–77), com cata-ventos de pedra |
| Estrada do Sertão (Aurora → Rota 14) | Núcleo ↔ Sertão | [598, 200, 600, 207] | trilha | — | abrir a borda de mata em x 598–599, y 200–207 e ligar o portão leste de Aurora (553, 186) a (599, 203), com passagem de nível na ferrovia | Rota 14 entra em (600, 200–207), porteira e placa |
| Costa do Siri | Núcleo ↔ Sertão | [598, 416, 600, 477] | água funda | Nadar | pintar deep em x 598–599, y 416–477 | deep em x 600–603 até o mangue |
| Mar do Sul | Núcleo ↔ Jandaias e Austral | [2, 478, 597, 480] | água funda | Nadar | pintar deep em y 478–479, x 2–597 | deep em y 480–483 |
| Desfiladeiro Branco | Sertão ↔ Geada | [1020, 199, 1031, 200] | paredão com trepadeira | Escalar | trepadeira em x 1020–1031, y 200–215, subindo da Chapada Vermelha | trilha de neve em x 1020–1031, y 184–199 até a Geleira |
| Mar do Levante | Sertão ↔ Geada | [1140, 199, 1199, 200] | água funda | Nadar | mar do levante | fiorde |
| Saída sul do Mangue | Sertão ↔ Austral | [600, 479, 799, 480] | água funda | Nadar | deep em y 476–479 | deep em y 480–483 |
| Rota Marítima 19 | Sertão ↔ Brasas | [800, 479, 1199, 480] | água funda | Nadar | deep em y 476–479; boias em x 900–940 | deep em y 480–483 |
| Jandaias ↔ Recife | Jandaias ↔ Austral | [399, 480, 400, 959] | água funda | Nadar | deep em x 396–399 | deep em x 400–403 |
| Recife ↔ Brasas | Austral ↔ Brasas | [799, 480, 800, 959] | água funda | Nadar | deep em x 796–799 | deep em x 800–803 |
| Estrada das Tropas | Ocaso Leste ↔ Oeste | [479, 300, 480, 315] | trilha | — | estrada sobe do Pampa | Rota começa em (479, 300–315) |
| Rio do Poente | Ocaso Leste ↔ Oeste | [479, 120, 480, 160] | água funda | Nadar | rio do Pantanal | rio da cordilheira |
| Costa austral do Ocaso | Ocaso Leste ↔ Oeste | [479, 600, 480, 719] | água funda | Nadar | mar do delta | mar dos campos de gelo |

---

## 6. Biomas

Cada bioma tem arte própria (ramo `biomas`) e Pokémon próprios. `base` é o bioma atual cuja arte serve enquanto a nova
não existe. O id é o valor de `areas[].biome` no mapa.

| Bioma | Visual | Blocos novos | Pokémon que dão a cara do bioma |
|---|---|---|---|
| `neve` | neve rala e funda, pinheiros nevados, nevasca que reduz a visão | snow, neve funda (Wyrdeer), ice | Snover, Snorunt, Cubchoo, Delibird, Vulpix de Alola, Darumaka de Galar |
| `gelo` | chão de gelo azul que escorrega até bater, estalactites, cristal translúcido | ice, icewall, rachadura (cai para o andar de baixo) | Bergmite, Cryogonal, Vanillite, Frigibax, Sneasel de Hisui |
| `vulcao` | basalto preto, rios de lava que brilham à noite, chuva de cinza, fumarolas | basalt, lava, ash, magma frio | Numel, Slugma, Magmar, Heatmor, Charcadet, Larvesta |
| `termal` | piscinas com vapor, terraços de calcário branco, bambus, lanternas | fonte termal (cura ao nadar), travertino | Fuecoco, Slowpoke de Galar, Torkoal |
| `sertao` | terra rachada, mandacaru, xique-xique, juazeiro, lajedos, cercas de vara | dirt, cracked, cactus | Cacnea, Maractus, Bramblin, Capsakid, Cyndaquil (raríssimo), Zangoose e Seviper |
| `canion` | paredões vermelhos em camadas, leito seco, pontes de corda, eco | redrock, redcliff, dryriver | Chimchar (raríssimo), Rufflet, Vullaby, Klawf, Druddigon, Axew |
| `deserto` | dunas douradas, oásis, tempestade de areia, miragens | dune (Correr), areia movediça | Fennekin (raríssimo), Trapinch, Sandile, Orthworm, Flittle, Rellor |
| `salar` | crosta branca em hexágonos, espelho d’água, flamingos | salt, saltmirror | Nacli, Flamigo, Rolycoly |
| `mangue` | raízes aéreas sobre água rasa, lama com caranguejos, maré que muda o caminho | mud, roots, água rasa andável | Totodile (raríssimo), Krabby, Corphish, Wooper de Paldea, Stunfisk de Galar |
| `brejo` | névoa, pontes de tábua, árvores secas, vaga-lumes, campos alagados | água rasa, junco | Croagunk, Tympole, Toedscool, Shroodle, Mudkip (raríssimo, Pantanal) |
| `selva` | cipós, folhas gigantes, raízes tabulares, chuva súbita, araras | mata fechada, cipó (Escalar), folha gigante | Treecko e Grookey (raríssimos), Passimian, Oranguru, Komala, Bounsweet, Goomy |
| `mar` | ondas, boias, cardumes, bancos de areia, redemoinhos | — | Tentacool, Wailmer, Finizen, Veluza, Dondozo, Tatsugiri |
| `recife` | luz azul que dança no fundo, corais, algas (só mergulhando) | seabed, coral, kelp (mato alto submerso) | Clamperl, Wishiwashi, Relicanth, Bruxish, Alomomola |
| `abismo` | escuro total, só a luz da Vela Eterna e de Pokémon luminosos | seabed escuro | Lanturn, Lumineon, Jellicent, Dondozo |
| `caverna`, `ruina`, `cristal`, `pico` | rocha e estalagmites; blocos esculpidos e murais; cristais que dividem a luz; rocha nua acima das nuvens | — | Zubat e Roggenrola; Unown, Golett, Baltoy; Carbink, Minior; Gabite, Pupitar |
| `pampa` | coxilhas onduladas, taipas de pedra, umbu solitário, céu enorme ao entardecer | — | Tauros de Paldea (três raças), Wooloo, Bouffalant, Sprigatito e Scorbunny (raríssimos) |
| `cratera` | cratera funda com selva primitiva e instalações de metal abandonadas | — | os Pokémon Paradoxo (passado e futuro) |

Os biomas de hoje (`campo`, `floresta`, `margem`, `praia`, `planalto`, `vila`) continuam como estão.

---

## 7. As regiões, uma a uma

**Núcleo de Alvorada.** A região da história (seção 6 de `historia-completa.md`). Já desenhado: Vila Alvorada,
Campos de Lúmen, Campina, Bosque, Sussurro, Rota 3, Porto Espelho, Lago, Costa Coral, Brejo, Lamparina, Rota 6, Cidade
Aurora e Mina. Falta (pendente no núcleo, para os agentes do mapa): Gruta da Maré, Ilhas Coral, Recife Afundado,
Forte Rochedo por dentro, a Megaloja de 5 andares, o trem animado da ferrovia, o Rotom no farol (estava sem sprite),
Paredão, Planalto, Escarpa, Mirante, Ruínas, Ilha do Véu, Santuário, Relógio, Fenda, Caminho do Zênite e a Liga.

**Cordilheira Geada (nordeste).** O Planalto dos Ventos sobe para leste e o capim vira neve. A Rota 15 (Passo do Uivo)
sai do fim da Rota 9, perto do Mirante, com cata-ventos de pedra cobertos de gelo. A Vila Geada é uma vila de
cabanas de pescadores de gelo, na beira do Lago Congelado (gelo escorregadio por cima, buracos de pesca). A leste, a
Rota 16 atravessa campos nevados até a Geleira do Uivo, que se sobe escalando paredes de gelo; dentro dela, a Caverna
de Gelo Cristalino. No alto, o Cume do Vento Branco (neve funda: Wyrdeer), casa do Articuno. No extremo leste, o
Fiorde do Levante.

**Sertão do Levante (leste).** A Estrada do Sertão sai de Cidade Aurora; a terra fica vermelha e rachada. Vila
Mandacaru é a terra do Seu Brasa, da Elite (ele mora lá, cuida de cabras e dá o Tepig). A Caatinga do Lajedo leva ao
leste; o Cânion do Rio Seco se desce escalando; a Chapada Vermelha, ao norte, é um platô de mesas com ninhos de Bagon
e o Desfiladeiro Branco que sobe para a neve. No meio, as Dunas Douradas (areia fofa: Correr) com as Ruínas de Pedra
Pintada e a Cratera da Estrela, onde caiu um meteoro. A leste, Cidade Buriti, uma cidade-oásis com bazar, museu e o
Laboratório de Fósseis. No litoral sul, o Mangue do Siri e Vila Siri, de palafitas, e a Praia do Levante.

**Arquipélago das Jandaias (sudoeste).** Da Costa Coral sai a balsa para a Ilha Jandaia: vila de pescadores, coqueiros e
a Creche da Vó Iara (ovos). As Ilhas Gêmeas, duas ilhotas iguais (Latias numa, Latios na outra). Ao sul, a Ilha da Selva
Grande, cercada de paredões de cipó, com a Cachoeira do Véu Verde (Dratini e Snivy) e o Templo das Raízes. Na lua
cheia, a Ilha Miragem aparece no canto sudeste do arquipélago (só voando).

**Mar do Sul e Ilhas Austrais (sul).** Mar aberto com o Recife Grande (mergulho), a Ilha do Farol Morto, de um farol dos
Vigias em ruínas sobre o Templo das Marés, e a Fossa Abissal (o mergulho mais fundo: Lugia). No extremo sul, quanto
mais frio, mais gelo: as Ilhas Austrais, com a Estação Austral de pesquisa e a Caverna do Iceberg (Regice).

**Arquipélago das Brasas (sudeste).** Ilhas de basalto perto da Ilha do Sol Nascente. A Ilha do Basalto tem praia de
areia preta; a Ilha da Fornalha tem Vila Termas e as Fontes Termais do Vapor, os Campos de Cinza e o Vulcão Tição, com o
Templo da Chama dentro (Heatran) e a Cratera do Tição no topo (Moltres). A Ilhota Fumegante, só voando, guarda o
Volcanion.

**Ocaso Leste.** O navio atraca em Porto Rubro, de tijolo vermelho. Para oeste, o Pampa das Coxilhas e a Estância
Ventania (Tauros de Paldea); ao norte, o Pantanal (alagado: Nadar) e as Cataratas do Trovão, com a gruta atrás da
cortina d’água (Mewtwo, no fundo). Ao sul, o Delta das Garças Rubras, a Mata das Araucárias (fadas e Ponyta de Galar) e a
Cidadela do Poente (Torre de Batalha e Salão das Tocas).

**Ocaso Oeste.** A Estrada das Tropas sobe para o Altiplano do Condor e a Vila Altiplana (o rei Calyrex). O Salar Branco
tem a Mina de Sal (Eternatus). O Deserto do Silêncio esconde o Templo do Poente (Reshiram, Zekrom e Ho-Oh) e, atrás de
uma miragem, a Cratera do Tempo, com os Paradoxo, Koraidon, Miraidon e Terapagos. A Cordilheira do Poente tem o Vulcão
Sentinela (Groudon); no sul, os Campos de Gelo, a Vila Fim-do-Mundo e o Glaciar do Fim do Mundo (Giratina).

---

## 8. Dificuldade por lugar

### O modelo

`custo` de um lugar = caminho em blocos desde a casa do jogador + o custo de cada exigência:

| Exigência | Custo (blocos) |
|---|---:|
| Correr (lama, areia fofa) | 30 |
| Nadar | 60 |
| Escalar | 200 |
| Voar (só se chega pelo ar) | 300 |
| Mergulhar | 300 |
| Neve funda | 200 |
| Escondido (sem placa nem trilha) | 150 |
| Cada andar abaixo da entrada de uma dungeon | 80 |
| Navio até o Ocaso | 1700 |

No núcleo, o caminho é **medido no mapa de verdade** (busca em largura sobre os blocos, a pé, nadando, escalando),
pela mediana dos blocos da área; nas regiões ainda não desenhadas, é o custo da passagem + 1,25 × a linha reta até o
centro da área. O nível médio dos selvagens sai da curva (interpolação linear entre os pontos):

| Custo | 0 | 100 | 200 | 300 | 450 | 600 | 800 | 1000 | 1300 | 1700 | 2200 | 2800 | 3500 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nível médio | 2 | 7 | 14 | 20 | 26 | 31 | 36 | 41 | 47 | 54 | 62 | 71 | 80 |

A faixa de cada área é o nível médio ± 2. Dentro da área: à noite, o teto sobe 1; os andares de dungeon são áreas à
parte, cada um mais forte que o de cima; os Alfa ficam 5 níveis acima do teto. A "equipe recomendada" é o teto + 3.

O validador (`node tools/gerar-mundo.mjs --conferir`) recusa: lugar perto de casa e a pé com nível acima de 15; andar
de dungeon mais fraco que a entrada; área do Ocaso com nível médio abaixo de 55; nível acima de 80 em Alvorada; Alfa
mais de 10 acima da faixa; escada de ginásios fora de ordem ou passando da Liga.

### Escada dos ginásios (gerada)

O nível de cada ginásio é fixo pelo lugar: a equipe do líder vai do nível médio da cidade até o ás, 4 acima. Qualquer
ordem vale; a escada só diz o que é mais fácil e o que é mais difícil.

<!-- gerado:ginasios -->
| # | Ginásio | Líder | Tipo | Custo | Acesso | Equipe do líder | Ás |
|---:|---|---|---|---:|---|---|---:|
| 1 | Cidade Coral | Jonas | Elétrico | 90 | a pé | 7–11 | 11 |
| 2 | Porto Espelho | Marina | Água | 161 | a pé | 11–15 | 15 |
| 3 | Cidade Campina | Tomé | Normal | 172 | a pé | 12–16 | 16 |
| 4 | Vila Lamparina | Dona Zélia | Fantasma | 227 | nadar | 16–20 | 20 |
| 5 | Vila Sussurro | Lia | Inseto | 246 | a pé | 17–21 | 21 |
| 6 | Forte Rochedo | Brás | Lutador | 320 | a pé | 21–25 | 25 |
| 7 | Mirante dos Ventos | Celeste | Voador | 841 | correr + nadar + escalar | 37–41 | 41 |
| 8 | Cidade Escarpa | Graça | Pedra | 925 | correr + nadar + escalar | 39–43 | 43 |
| — | Liga Alvorada (8 insígnias) | Elite | — | — | todas | 55–61 | Campeã 66 |
<!-- /gerado:ginasios -->

Os dois ginásios acima do Paredão (Celeste e Graça) ficam bem mais fortes que os seis de baixo porque o Planalto só se
alcança escalando e está longe de tudo. Entre um degrau e outro estão as regiões novas (Sertão, Jandaias, Austral,
Brasas, Geada), com selvagens de 20 a 60: é lá que o jogador treina antes de subir.

A Liga pede as 8 insígnias e tem nível fixo: Elite 55–61, Campeã até 66; revanche depois de campeão com 70–75. Os
líderes também aceitam revanche, depois das 8 insígnias, com equipes de 60 a 65.

### Área → faixa de nível → equipe recomendada (gerada)

Ordenada do lugar mais fácil para o mais difícil.

<!-- gerado:niveis -->
| Área | Região | Bioma | Custo | Acesso | Selvagens (nível) | Equipe recomendada |
|---|---|---|---:|---|---|---:|
| Rota 1, Campos de Lúmen | Núcleo de Alvorada | campo | 83 | a pé | 4–8 | 11 |
| Praia Oeste | Núcleo de Alvorada | praia | 91 | a pé | 5–9 | 12 |
| Rota 3, Margem das Garças | Núcleo de Alvorada | margem | 94 | a pé | 5–9 | 12 |
| Gruta da Maré | Núcleo de Alvorada | caverna | 109 | a pé | 6–10 | 13 |
| Campos do Manguezal | Núcleo de Alvorada | campo | 119 | a pé | 6–10 | 13 |
| Campos ao norte da Rota 1 | Núcleo de Alvorada | campo | 127 | a pé | 7–11 | 14 |
| Restinga | Núcleo de Alvorada | praia | 158 | a pé | 9–13 | 16 |
| Praia dos Corais | Núcleo de Alvorada | praia | 180 | a pé | 11–15 | 18 |
| Gruta da Maré — Galeria das Conchas | Núcleo de Alvorada | caverna | 189 | a pé | 11–15 | 18 |
| Rota 5, Brejo das Lamparinas | Núcleo de Alvorada | brejo | 213 | nadar | 13–17 | 20 |
| Rota 4, Rio Lúmen | Núcleo de Alvorada | margem | 238 | nadar | 14–18 | 21 |
| Cemitério das Velas | Núcleo de Alvorada | floresta | 246 | nadar | 15–19 | 22 |
| Bosque Sussurrante | Núcleo de Alvorada | floresta | 249 | a pé | 15–19 | 22 |
| Rota 2, Trilha das Paineiras | Núcleo de Alvorada | floresta | 255 | a pé | 15–19 | 22 |
| Lagoa Dourada | Núcleo de Alvorada | margem | 284 | a pé, escondido | 17–21 | 24 |
| Rota Marítima 13 | Núcleo de Alvorada | mar | 289 | nadar | 17–21 | 24 |
| Ilhas Coral | Núcleo de Alvorada | praia | 292 | nadar | 18–22 | 25 |
| Rota 10, Águas do Véu | Núcleo de Alvorada | margem | 326 | nadar | 19–23 | 26 |
| Lago Espelho | Núcleo de Alvorada | margem | 328 | nadar | 19–23 | 26 |
| Toca do Absol (Gruta do Musgo) | Núcleo de Alvorada | caverna | 329 | a pé | 19–23 | 26 |
| Rota 6, Ferrovia da Aurora | Núcleo de Alvorada | campo | 335 | nadar | 19–23 | 26 |
| Rota 7, Ravina do Rochedo | Núcleo de Alvorada | canion | 343 | nadar | 20–24 | 27 |
| Rota Marítima 17 | Arquipélago das Jandaias | mar | 343 | nadar | 20–24 | 27 |
| Ilhas Gêmeas | Arquipélago das Jandaias | praia | 395 | nadar | 22–26 | 29 |
| Pé do Paredão (Mina Aurora) | Núcleo de Alvorada | planalto | 404 | nadar | 22–26 | 29 |
| Rota Marítima 18 | Mar do Sul e Ilhas Austrais | mar | 438 | nadar | 24–28 | 31 |
| Ilha Jandaia | Arquipélago das Jandaias | praia | 499 | nadar | 26–30 | 33 |
| Recife Afundado | Núcleo de Alvorada | recife | 517 | nadar + mergulhar | 26–30 | 33 |
| Ilha do Véu | Núcleo de Alvorada | praia | 527 | nadar, escondido | 27–31 | 34 |
| Mina Aurora — Nível 1 | Núcleo de Alvorada | caverna | 544 | nadar | 27–31 | 34 |
| Gruta da Maré — Câmara Submersa | Núcleo de Alvorada | recife | 569 | mergulhar | 28–32 | 35 |
| Recife Grande | Mar do Sul e Ilhas Austrais | mar | 581 | nadar | 28–32 | 35 |
| Mangue do Siri | Sertão do Levante | mangue | 591 | nadar | 29–33 | 36 |
| Rota 14, Estrada do Sertão | Sertão do Levante | sertao | 602 | nadar | 29–33 | 36 |
| Mata dos Jequitibás | Núcleo de Alvorada | floresta | 611 | correr, escondido | 29–33 | 36 |
| Mina Aurora — Nível 2 | Núcleo de Alvorada | caverna | 624 | nadar | 30–34 | 37 |
| Santuário do Crepúsculo | Núcleo de Alvorada | recife | 626 | nadar + mergulhar | 30–34 | 37 |
| Mar das Jandaias | Arquipélago das Jandaias | mar | 632 | nadar | 30–34 | 37 |
| Mar do Sul Profundo | Mar do Sul e Ilhas Austrais | mar | 698 | nadar | 31–35 | 38 |
| Mina Aurora — Nível 3 | Núcleo de Alvorada | caverna | 704 | nadar | 32–36 | 39 |
| Praia do Cipó | Arquipélago das Jandaias | praia | 735 | nadar | 32–36 | 39 |
| Ilha do Farol Morto | Mar do Sul e Ilhas Austrais | praia | 741 | nadar | 33–37 | 40 |
| Paredão | Núcleo de Alvorada | planalto | 754 | correr + nadar + escalar | 33–37 | 40 |
| Rota 9, Estepe dos Ventos | Núcleo de Alvorada | planalto | 777 | correr + nadar + escalar | 33–37 | 40 |
| Mina Aurora — Nível 4 | Núcleo de Alvorada | cristal | 784 | nadar | 34–38 | 41 |
| Rota 11, Escadaria dos Vigias | Núcleo de Alvorada | ruina | 801 | correr + nadar + escalar | 34–38 | 41 |
| Selva Grande | Arquipélago das Jandaias | selva | 825 | nadar + escalar | 35–39 | 42 |
| Ilhas Austrais | Mar do Sul e Ilhas Austrais | neve | 827 | nadar | 35–39 | 42 |
| Planalto dos Ventos | Núcleo de Alvorada | planalto | 845 | correr + nadar + escalar | 35–39 | 42 |
| Rota 8, Escalada do Paredão | Núcleo de Alvorada | planalto | 876 | correr + nadar + escalar | 36–40 | 43 |
| Ilha do Basalto | Arquipélago das Brasas | praia | 880 | nadar | 36–40 | 43 |
| Rota 20, Caatinga do Lajedo | Sertão do Levante | sertao | 881 | nadar | 36–40 | 43 |
| Templo das Marés — Nave Alta | Mar do Sul e Ilhas Austrais | ruina | 881 | nadar | 36–40 | 43 |
| Praia do Levante | Sertão do Levante | praia | 903 | nadar | 37–41 | 44 |
| Cânion do Rio Seco | Sertão do Levante | canion | 906 | nadar + escalar | 37–41 | 44 |
| Cachoeira do Véu Verde | Arquipélago das Jandaias | margem | 907 | nadar + escalar, escondido | 37–41 | 44 |
| Rota Marítima 19 | Arquipélago das Brasas | mar | 957 | nadar | 38–42 | 45 |
| Rota 15, Passo do Uivo | Cordilheira Geada | planalto | 966 | correr + nadar + escalar | 38–42 | 45 |
| Caverna do Iceberg — Túnel Azul | Mar do Sul e Ilhas Austrais | gelo | 967 | nadar | 38–42 | 45 |
| Mina Abandonada (Nível 5) | Núcleo de Alvorada | caverna | 1014 | nadar, escondido | 39–43 | 46 |
| Dunas Douradas | Sertão do Levante | deserto | 1014 | nadar + correr | 39–43 | 46 |
| Recife Grande — Fundo (mergulho) | Mar do Sul e Ilhas Austrais | recife | 1021 | nadar + mergulhar | 39–43 | 46 |
| Lago Congelado | Cordilheira Geada | gelo | 1045 | correr + nadar + escalar | 40–44 | 47 |
| Caverna do Iceberg — Salão Polar | Mar do Sul e Ilhas Austrais | gelo | 1047 | nadar | 40–44 | 47 |
| Ruínas dos Vigias | Núcleo de Alvorada | ruina | 1054 | correr + nadar + escalar, escondido | 40–44 | 47 |
| Campos de Cinza | Arquipélago das Brasas | vulcao | 1064 | nadar | 40–44 | 47 |
| Fundo do Cânion | Sertão do Levante | canion | 1074 | nadar + escalar, escondido | 40–44 | 47 |
| Fontes Termais do Vapor | Arquipélago das Brasas | termal | 1080 | nadar | 41–45 | 48 |
| Ilha do Sol Nascente | Núcleo de Alvorada | vulcao | 1142 | nadar, escondido | 42–46 | 49 |
| Oásis do Buriti | Sertão do Levante | margem | 1147 | nadar | 42–46 | 49 |
| Cratera da Estrela | Sertão do Levante | deserto | 1148 | nadar + correr, escondido | 42–46 | 49 |
| Templo das Raízes — Átrio | Arquipélago das Jandaias | ruina | 1165 | nadar + escalar | 42–46 | 49 |
| Mar do Levante | Sertão do Levante | mar | 1172 | nadar | 42–46 | 49 |
| Ilha Miragem | Arquipélago das Jandaias | praia | 1177 | nadar + voar, escondido | 43–47 | 50 |
| Ruínas de Pedra Pintada — Pátio das Pinturas | Sertão do Levante | ruina | 1184 | nadar + correr | 43–47 | 50 |
| Mar das Brasas | Arquipélago das Brasas | mar | 1199 | nadar | 43–47 | 50 |
| Templo das Raízes — Galerias Inundadas | Arquipélago das Jandaias | selva | 1245 | nadar + escalar | 44–48 | 51 |
| Rota 16, Campos Nevados | Cordilheira Geada | neve | 1246 | correr + nadar + escalar | 44–48 | 51 |
| Templo das Marés — Nave Afundada | Mar do Sul e Ilhas Austrais | recife | 1261 | nadar + mergulhar | 44–48 | 51 |
| Ruínas de Pedra Pintada — Galeria da Areia | Sertão do Levante | ruina | 1264 | nadar + correr | 44–48 | 51 |
| Chapada Vermelha | Sertão do Levante | canion | 1286 | nadar + escalar | 45–49 | 52 |
| Rota 12, Caminho do Zênite | Núcleo de Alvorada | pico | 1300 | correr + nadar + escalar | 45–49 | 52 |
| Templo das Raízes — Câmara da Semente | Arquipélago das Jandaias | ruina | 1325 | nadar + escalar | 45–49 | 52 |
| Templo das Marés — Altar da Maré | Mar do Sul e Ilhas Austrais | recife | 1341 | nadar + mergulhar | 46–50 | 53 |
| Ruínas de Pedra Pintada — Câmara do Sol | Sertão do Levante | ruina | 1344 | nadar + correr | 46–50 | 53 |
| Vulcão Tição | Arquipélago das Brasas | vulcao | 1379 | nadar + escalar | 46–50 | 53 |
| Ruínas dos Vigias — Sala dos Murais | Núcleo de Alvorada | ruina | 1424 | correr + nadar + escalar | 47–51 | 54 |
| Geleira do Uivo | Cordilheira Geada | neve | 1442 | correr + nadar + escalar | 47–51 | 54 |
| Fossa Abissal | Mar do Sul e Ilhas Austrais | abismo | 1448 | nadar + mergulhar, escondido | 48–52 | 55 |
| Pico Geada | Núcleo de Alvorada | neve | 1473 | correr + nadar + escalar + neve, escondido | 48–52 | 55 |
| Fiorde do Levante | Cordilheira Geada | mar | 1579 | correr + nadar + escalar | 50–54 | 57 |
| Fenda Prismática | Núcleo de Alvorada | cristal | 1653 | correr + nadar + escalar, escondido | 51–55 | 58 |
| Caminho do Zênite — Caverna | Núcleo de Alvorada | caverna | 1670 | correr + nadar + escalar | 51–55 | 58 |
| Templo da Chama — Portal de Basalto | Arquipélago das Brasas | vulcao | 1719 | nadar + escalar | 52–56 | 59 |
| Templo da Chama — Rio de Lava | Arquipélago das Brasas | vulcao | 1799 | nadar + escalar | 54–58 | 61 |
| Ilhota Fumegante | Arquipélago das Brasas | termal | 1805 | nadar + voar, escondido | 54–58 | 61 |
| Caverna de Gelo Cristalino — Saguão | Cordilheira Geada | gelo | 1812 | correr + nadar + escalar | 54–58 | 61 |
| Cratera do Tição | Arquipélago das Brasas | vulcao | 1825 | nadar + escalar + voar, escondido | 54–58 | 61 |
| Cume do Vento Branco | Cordilheira Geada | pico | 1832 | correr + nadar + escalar + neve, escondido | 54–58 | 61 |
| Templo da Chama — Forja Antiga | Arquipélago das Brasas | vulcao | 1879 | nadar + escalar | 55–59 | 62 |
| Caverna de Gelo Cristalino — Rio Congelado | Cordilheira Geada | gelo | 1892 | correr + nadar + escalar | 55–59 | 62 |
| Caverna de Gelo Cristalino — Coração Azul | Cordilheira Geada | gelo | 1972 | correr + nadar + escalar | 56–60 | 63 |
| Pampa das Coxilhas | Ocaso Leste: Pampa e Pantanal | pampa | 1997 | a pé | 57–61 | 64 |
| Restinga do Poente | Ocaso Leste: Pampa e Pantanal | praia | 2044 | a pé | 58–62 | 65 |
| Pantanal do Poente | Ocaso Leste: Pampa e Pantanal | brejo | 2181 | nadar | 60–64 | 67 |
| Fenda Prismática — Salão dos Espelhos | Núcleo de Alvorada | cristal | 2183 | correr + nadar + escalar | 60–64 | 67 |
| Cataratas do Trovão | Ocaso Leste: Pampa e Pantanal | margem | 2246 | nadar | 61–65 | 68 |
| Delta das Garças Rubras | Ocaso Leste: Pampa e Pantanal | mangue | 2256 | nadar | 61–65 | 68 |
| Mata das Araucárias | Ocaso Leste: Pampa e Pantanal | floresta | 2258 | a pé | 61–65 | 68 |
| Estrada das Tropas | Ocaso Oeste: Cordilheira e Desertos | planalto | 2375 | a pé | 63–67 | 70 |
| Gruta das Cataratas — Cortina d’Água | Ocaso Leste: Pampa e Pantanal | caverna | 2386 | nadar | 63–67 | 70 |
| Salar Branco | Ocaso Oeste: Cordilheira e Desertos | salar | 2489 | a pé | 64–68 | 71 |
| Mina de Sal — Galerias Brancas | Ocaso Oeste: Cordilheira e Desertos | caverna | 2569 | a pé | 66–70 | 73 |
| Mina de Sal — Poço Profundo | Ocaso Oeste: Cordilheira e Desertos | cristal | 2649 | a pé | 67–71 | 74 |
| Gruta das Cataratas — Abismo do Silêncio | Ocaso Leste: Pampa e Pantanal | caverna | 2696 | nadar, escondido | 67–71 | 74 |
| Campos de Gelo do Sul | Ocaso Oeste: Cordilheira e Desertos | neve | 2731 | nadar | 68–72 | 75 |
| Altiplano do Condor | Ocaso Oeste: Cordilheira e Desertos | planalto | 2759 | escalar | 68–72 | 75 |
| Deserto do Silêncio | Ocaso Oeste: Cordilheira e Desertos | deserto | 2792 | correr | 69–73 | 76 |
| Glaciar do Fim do Mundo — Fendas | Ocaso Oeste: Cordilheira e Desertos | gelo | 2871 | nadar | 70–74 | 77 |
| Templo do Poente — Escadaria do Sol | Ocaso Oeste: Cordilheira e Desertos | ruina | 2902 | correr | 70–74 | 77 |
| Templo do Poente — Salão dos Dois Céus | Ocaso Oeste: Cordilheira e Desertos | ruina | 2982 | correr | 71–75 | 78 |
| Cordilheira do Poente | Ocaso Oeste: Cordilheira e Desertos | pico | 3018 | escalar | 72–76 | 79 |
| Cratera do Tempo — Borda | Ocaso Oeste: Cordilheira e Desertos | cratera | 3132 | correr, escondido | 73–77 | 80 |
| Vulcão Sentinela | Ocaso Oeste: Cordilheira e Desertos | vulcao | 3178 | escalar, escondido | 74–78 | 81 |
| Glaciar do Fim do Mundo — Mundo Avesso | Ocaso Oeste: Cordilheira e Desertos | cristal | 3181 | nadar, escondido | 74–78 | 81 |
| Cratera do Tempo — Fundo (Passado e Futuro) | Ocaso Oeste: Cordilheira e Desertos | cratera | 3292 | correr, escondido | 75–79 | 82 |
<!-- /gerado:niveis -->

### Tabelas do mapa que precisam de rebalanceamento (gerado)

As tabelas que já estão em `assets/maps/alvorada.json` foram feitas na ordem dos capítulos. No mundo aberto, estas
ficam longe do modelo (diferença maior que 4 níveis). `src/data/habitats.js` já traz cada uma com as mesmas espécies do
mapa e os níveis novos; falta o agente do mapa trocar os níveis (ou o motor passar a ler `habitats.js`, seção 14).

<!-- gerado:rebalancear -->
| Área do mapa | Hoje (mapa) | Modelo |
|---|---|---|
| rota2 | 10–13 | 15–19 |
| rota3 | 15–20 | 5–9 |
| manguezal | 19–23 | 6–10 |
| praia_oeste | 22–25 | 5–9 |
| rota7 | 34–38 | 20–24 |
| mina_aurora | 31–34 | 22–26 |
| rota4 | 22–26 | 14–18 |
| restinga | 23–27 | 9–13 |
| praia_corais | 24–28 | 11–15 |
| rota5 | 27–32 | 13–17 |
| cemiterio_velas | 27–30 | 15–19 |
| rota6 | 31–35 | 19–23 |
| toca_absol | 14–16 | 19–23 |
<!-- /gerado:rebalancear -->

---

## 9. Ginásios, Elite e Campeã: um tipo cada

| Ginásio | Cidade e bioma | Tipo | Por que combina |
|---|---|---|---|
| Tomé, Insígnia Espiga | Cidade Campina, campos e milharal | Normal | o Normal da roça: Lechonk, Teddiursa, Bunnelby |
| Lia, Insígnia Casulo | Vila Sussurro, raízes do Bosque | Inseto | estufa-teia dentro da floresta |
| Marina, Insígnia Gota | Porto Espelho, margem do lago | Água | galpão de barcos com comportas |
| Jonas, Insígnia Faísca | Cidade Coral, praia e farol | Elétrico | o farol e os geradores |
| Dona Zélia, Insígnia Vela | Vila Lamparina, brejo e cemitério | Fantasma | lampiões e velas da Noite Longa |
| Brás, Insígnia Punho | Forte Rochedo, ravina | Lutador | roda de capoeira |
| Graça, Insígnia Rocha | Cidade Escarpa, encosta do planalto | Pedra | mina velha |
| Celeste, Insígnia Pluma | Mirante dos Ventos, falésias | Voador | torre do vento |
| Elite: Aurélio, Clarice, Seu Brasa, Iberê | Cidadela do Zênite | Sombrio, Fada, Fogo, Dragão | as quatro horas do dia; Seu Brasa mora no Sertão do Levante |
| Campeã Dalva | Salão da Campeã | mista (um de cada hora) | a estrela-d’alva |

---

## 10. Cidades e vilas (gerado)

Todos os prédios têm interior. "Já no mapa" = o interior existe em `assets/maps/alvorada.json`. Recompensas em
formato de máquina estão em `docs/mundo-expandido.json` (`cidades[].missoes[].recompensa`).

<!-- gerado:cidades -->
#### Vila Alvorada
Região: Núcleo de Alvorada.

**Prédios (todos com interior):**
- Casa do jogador (2 andares) *(já no mapa)*: sala com o rádio, cozinha, a Mãe cura a equipe; quarto com janela para o leste e o PC.
- Casa do Téo / Padaria Pão do Sol *(já no mapa)*: balcão de pães, forno a lenha, quarto do Téo com pôsteres de batalha.
- Laboratório do Prof. Jatobá *(já no mapa)*: salão com 3 pedestais, estantes, estufa com Pokémon planta, mesa da Bia, porão dos cadernos (abre com 8 insígnias).
- Rádio Alvorada *(já no mapa)*: estúdio com microfone de fita, parede de relógios do Seu Zé.
- Casa da Dona Flor *(já no mapa)*: sala cheia de vasos; Flabébé no parapeito.
- Mercadinho da Vila: balcão pequeno: Poções, Poké Bolas, Antídotos (os itens básicos sem precisar ir a Campina).
- Casa da Família Lima: pescadores do Lago; vara velha pendurada, aquário com Magikarp, menino que troca Pokémon.

**Moradores:** Mãe Helena (cura e anuncia o nascer do sol); Dona Rosa (pão de queijo); Prof. Jatobá; Bia; Seu Zé do Rádio; Dona Flor; Juninho Lima (8 anos, faz trocas).

**Missões:**
- **A Pokédex da Bia** `sq_bia_dex` (cadeia): Bia premia cada marco de espécies registradas: 30, 60, 120, 250, 500 e 1000. Recompensa: item greatBall x10, item quickBall x10, item expShare, item luckyEgg, item masterBall, item-chave amuleto-brilhante.
- **Os relógios do Seu Zé** `sq_relogios` (buscar): Cinco relógios antigos do Seu Zé foram dados como brinde pela região (Campina, Porto, Coral, Lamparina, Escarpa). Trazer de volta. Recompensa: item metronome, ₽3000, item-chave relogio-de-bolso (mostra a hora exata do nascer do sol).
- **Pão de queijo da Dona Rosa** `sq_pao_diario` (diario): Toda manhã, ao passar na padaria, ela dá um pão de queijo (cura 50 PS). Recompensa: item potion x1 por dia.
- **As cores da Dona Flor** `sq_flor` (mostrar): Mostrar Flabébé (#669) de três cores diferentes (vermelha, amarela, azul). Recompensa: item shinyStone, item miracleSeed.
- **Cartas na garrafa** `sq_garrafas` (achar): Seis garrafas boiam pelo Lago Espelho, Mar do Sul, Jandaias, Recife Grande, Mar das Brasas e Fiorde: cartas do Capitão Ivo. Recompensa: item pearl x6, item bigPearl, falas novas da Mãe.
- **Troca do Juninho** `sq_troca_juninho` (troca): Juninho troca o Farfetch’d (#83) dele por qualquer Pokémon do tipo Água. Recompensa: Pokémon #83 nv12.

#### Cidade Campina
Região: Núcleo de Alvorada · Ginásio: **Tomé** (Normal), Insígnia Espiga, Arena do milharal (a céu aberto).

**Prédios (todos com interior):**
- Centro Pokémon *(já no mapa)*: balcão, PC, mesa de troca, sofá de palha.
- Mercado Pokémon *(já no mapa)*: vendedor comum + vendedor especial (Bola Nível, fertilizantes).
- Casa do Seu Quinzinho *(já no mapa)*: panela de milho cozido, mural de boatos.
- Casa do Agricultor *(já no mapa)*: sementes, enxadas, Lechonk dormindo.
- Celeiro da Fazenda do Tomé *(já no mapa)*: estábulo dos Mudbray, feno, sela.
- Casa da Lili e do Tomé: cozinha da fazenda, quadro de corridas da Lili.
- Moinho de Campina: engrenagens que giram, sacos de fubá, Seu Moleiro e o Diggersby que empurra a mó.
- Casa da Dona Cida: horta de abóboras atrás, cozinha.
- Silo velho: pilhas de abóbora (missão do Lechonk); escada até o topo com vista da região.
- Galinheiro da Lili: ninhos de palha, chocadeira (missão dos pintinhos).

**Moradores:** Líder Tomé; Lili (10 anos, corridas); Seu Quinzinho (boatos que viram verdade); Dona Cida; Seu Moleiro.

**Missões:**
- **O Lechonk guloso** `sq_lechonk` (achar): Seguir as pegadas do Lechonk que come a horta até o silo. Recompensa: Pokémon #915 nv8 (com Tiro de Lama), item oranBerry x5.
- **Corrida da Lili** `sq_corrida` (cadeia): Três corridas pelos Campos de Lúmen contra a Lili, cada uma mais difícil. Recompensa: item-chave sela-de-couro, item rareCandy, Mudbray vira Mudsdale de montaria.
- **Os pintinhos que pegam fogo** `sq_pintinhos` (buscar): Cinco ovos fugiram da chocadeira e rolaram pelos campos. Trazer os cinco: um deles choca na hora. Recompensa: Pokémon #255 nv5 (Torchic).
- **O Tauros de olhos vermelhos** `sq_tauros` (alfa): Um Tauros Alfa derruba as cercas da Rota 1. Cansá-lo correndo ao lado e vencer. Recompensa: Pokémon #128 alfa capturável, ₽3000.
- **Milho do Quinzinho** `sq_milho` (entregar): Levar quatro espigas cozidas para amigos dele em Porto Espelho, Coral, Lamparina e Vila Siri. Recompensa: MT seedBomb, item amuletCoin.
- **Lição do Tomé** `sq_tutor_tome` (tutor): Por 3 Fubás (do moinho), Tomé ensina Golpe Corpo e Retribuição. Recompensa: tutor bodySlam, tutor return.

#### Vila Sussurro
Região: Núcleo de Alvorada · Ginásio: **Lia** (Inseto), Insígnia Casulo, Estufa-Teia.

**Prédios (todos com interior):**
- Centro Pokémon (tronco oco) *(já no mapa)*: padrão, com musgo e lanternas de vaga-lume.
- Mercado Pokémon *(já no mapa)*: vendedor especial: Bola de Rede, Repelente.
- Oficina do Seu Juca *(já no mapa)*: violas penduradas, bancada, madeira caída.
- Casa do Tito *(já no mapa)*: caminha do Skwovet Pipoca.
- Estufa-Teia (ginásio) *(já no mapa)*: teia de fios dourados e prateados.
- Casa na Árvore da Lia: biblioteca de insetos, lupas, gavetas de casulos.
- Casa do Seu Avelino: potes de luz, mapa das noites de vaga-lume.
- Casa do Galho Alto: família de tecelões; tear com seda de Spinarak.

**Moradores:** Líder Lia; Seu Juca (luthier); Tito (7 anos); Seu Avelino (vaga-lumes); Dona Tecelã Marta.

**Missões:**
- **A viola do Seu Juca** `sq_viola` (buscar): Três cordas: seda de Spinarak (Bosque), fio de Joltik (Rota 6, noite) e cera de Combee (Estufa). Recompensa: item-chave viola (acalma Alfa por 10 s).
- **Cadê o Pipoca?** `sq_pipoca` (achar): Seguir a trilha de nozes pelo Bosque até um Greedent enorme: a mãe do Pipoca. Recompensa: item luckyEgg.
- **Noite de vaga-lumes** `sq_vagalumes` (mostrar): De noite, mostrar Volbeat (#313) e Illumise (#314) ao Seu Avelino. Recompensa: item moonStone, item brightPowder.
- **As asas do mundo** `sq_vivillon` (mostrar): Mostrar Vivillon (#666) de 3 padrões de asa (cada continente tem o seu). Recompensa: item netBall x10, item silverPowder.
- **A canção das árvores** `sq_meloetta` (cadeia, depois de `sq_viola`): Depois da viola: tocar a viola na clareira do Bosque à meia-noite. A música acorda Meloetta. Recompensa: Pokémon #648 nv50 (evento).

#### Porto Espelho
Região: Núcleo de Alvorada · Ginásio: **Marina** (Água), Insígnia Gota, Galpão de Barcos.

**Prédios (todos com interior):**
- Centro Pokémon *(já no mapa)*: padrão, com redes e boias.
- Casa do Seu Nestor *(já no mapa)*: garrafas e fotos antigas, rede de dormir.
- Galpão de Barcos (ginásio) *(já no mapa)*: comportas e tanques.
- Feira do Porto (loja): iscas, varas, Poções; vendedor especial: Bola de Mergulho.
- Quiosque da Tia Jandira: mesas de moqueca, o Slowpoke Doutor.
- Estaleiro: barco em reforma, ferramentas; onde Véspera fugiu.
- Casa da Marina: troféus de regata, mapa do lago.
- Peixaria do Seu Bigode: balança de peixes, quadro de recordes.

**Moradores:** Líder Marina; Seu Nestor (avô da Marina); Tia Jandira; Seu Bigode (recordes de pesca).

**Missões:**
- **O Gyarados da tempestade** `sq_gyarados` (alfa): Em dia de chuva, um Gyarados Alfa vira barcos no lago. Recompensa: Pokémon #130 alfa capturável.
- **O quadro de recordes** `sq_recordes` (mostrar): Mostrar ao Seu Bigode um peixe de cada: Magikarp, Barboach, Basculin, Feebas, Finneon. Recompensa: item-chave vara-boa, item-chave super-vara (com os 5).
- **Moqueca da Jandira** `sq_moqueca` (buscar): Trazer 3 Frutas Rawst, 1 Shellos (mostrar) e uma Pérola. Recompensa: MT scald, item leftovers.
- **O bote do Seu Nestor** `sq_bote` (diario): Seu Nestor leva à Ilha do Véu uma vez por dia e conta uma história do lago. Recompensa: viagem gratuita, item freshWater x2.
- **O mergulho do Seu Nestor** `sq_anel` (achar): A aliança da finada esposa está no baú do capitão do Recife Afundado, guardada por um Dhelmise. Recompensa: Pokémon #781 nv36, item bigPearl.

#### Cidade Coral
Região: Núcleo de Alvorada · Ginásio: **Jonas** (Elétrico), Insígnia Faísca, Farol Coral (3 andares).

**Prédios (todos com interior):**
- Centro Pokémon *(já no mapa)*: padrão, com pranchas.
- Mercado Pokémon *(já no mapa)*: Repelentes, roupas de banho.
- Casa da Família Brito *(já no mapa)*: aquário de corais.
- Escola de Surfe do Kauã *(já no mapa)*: pranchas, quadro de ondas.
- Casa da Iracema *(já no mapa)*: telégrafo, mapas de navegação.
- Farol Coral (térreo, 1º andar, lanterna) *(já no mapa)*: ginásio em espiral.
- Terminal de Balsas: quadro de horários (Jandaia, Austral, Ocaso), bilheteria, sala de espera com vitrine de conchas.
- Barraca do Açaí: balcão de frutas (vende Frutas e Limonada).
- Clube de Mergulho: cilindros, mapa dos redemoinhos, instrutora Dona Coral.
- Casa do Mestre de Navio: maquetes de navios; ele leva ao Ocaso por ₽2000 enquanto o Capitão Ivo não volta.

**Moradores:** Líder Jonas; Iracema (faroleira aposentada); Kauã (surfista); Dona Coral (mergulho); Família Brito.

**Missões:**
- **O farol pisca errado** `sq_farol` (achar): Anotar à noite a sequência em Morse do farol: S-O-C-O-R-R-O. Libertar o Rotom preso na lanterna. Recompensa: Pokémon #479 nv25.
- **A onda perfeita** `sq_ondas` (vencer): Vencer os três surfistas do Kauã na Praia dos Corais e na Praia Oeste. Recompensa: MT aquaJet, ₽2500.
- **Conchas da Iracema** `sq_conchas` (diario): Trocar Pérolas e Conchas por itens; uma conversa sobre o mar por dia. Recompensa: item pearl -> item:hyperPotion.
- **Coral branco** `sq_troca_brito` (troca): A Família Brito troca um Corsola de Galar por um Corsola comum. Recompensa: Pokémon #222@galar nv25.
- **Batismo de mergulho** `sq_mergulho_coral` (cadeia): Dona Coral mostra os redemoinhos; quem tem um Pokémon capaz de Mergulhar mergulha com ela na Gruta da Maré e no Recife Afundado. Recompensa: item diveBall x10, MT dive.

#### Vila Lamparina
Região: Núcleo de Alvorada · Ginásio: **Dona Zélia** (Fantasma), Insígnia Vela, Casarão das Velas (só de noite).

**Prédios (todos com interior):**
- Centro Pokémon *(já no mapa)*: iluminado a lampião.
- Mercado Pokémon *(já no mapa)*: velas, Bola do Crepúsculo.
- Casa do Seu Bento *(já no mapa)*: gatos, varal.
- Casa da Vó Benta *(já no mapa)*: fogão a lenha, Noctowl Coronel no poleiro.
- Casa abandonada dos Solano *(já no mapa)*: sótão com o diário do Tiago.
- Casarão das Velas (ginásio) *(já no mapa)*: espelhos, quadros.
- Capela das Velas: bancos de madeira, centenas de velas, sino.
- Casa do Seu Lázaro (coveiro): pás, flores secas, livro de piadas de defunto.
- Estação de Lamparina: plataforma do Trem da Aurora, bilheteria.

**Moradores:** Líder Dona Zélia; Vó Benta; Seu Lázaro (coveiro); Seu Bento.

**Missões:**
- **O bolo da Vó Benta** `sq_bolo` (buscar): Fubá do moinho de Campina, Leite Moomoo de Miltank (Ilhas Coral), ovo de Chansey (Ilha Jandaia) e mel de Combee. Recompensa: item rareCandy x2, item fullRestore (Bolo de Fubá).
- **A casa dos Solano** `sq_solano` (achar): O Yamask da casa abandonada segura uma máscara. Achar o diário de Tiago Solano no sótão. Recompensa: Pokémon #562 nv30.
- **As velas apagadas** `sq_lapides` (achar): Cinco lápides do cemitério estão com a vela apagada. De noite, acendê-las com a Vela Eterna (ou um Pokémon de Fogo). Recompensa: item duskStone, item spellTag.
- **Sina e Véspera** `sq_sina` (vencer): Com 8 insígnias e o Relógio em paz, Véspera pede que o jogador visite Sina no cemitério. A Absol só vai depois de uma batalha. Recompensa: Pokémon #359 nv55 (Sina, com Corte Noturno), Mega Pedra absolite.
- **Noite de lua nova** `sq_darkrai` (cadeia, depois de `sq_sina`): Depois de Sina: na lua nova, a capela não acende. Dentro, um pesadelo espera. Recompensa: Pokémon #491 nv60 (evento).

#### Cidade Aurora
Região: Núcleo de Alvorada.

**Prédios (todos com interior):**
- Centro Pokémon *(já no mapa)*: moderno, painéis de luzita.
- Mercado Pokémon *(já no mapa)*: padrão.
- Redação do "O Farol" *(já no mapa)*: máquinas de escrever, mural de fotos da Pipa.
- Casa do Seu Dito *(já no mapa)*: casa de mineiro.
- Torre Aurora (recepção, maquete, sala de controle, cobertura) *(já no mapa)*: sede da Companhia; o cofre de Solano fica na cobertura.
- Megaloja Aurora (5 andares + terraço): 1º remédios, 2º bolas, 3º MTs, 4º itens de batalha e pedras, 5º roupas; terraço com vista da mina e máquina de bebidas; elevador.
- Hospital dos Mineiros: enfermaria, Heitor em recuperação, médica que pede Frutas.
- Estação Central: plataformas do Trem da Aurora (Lamparina e Mandacaru), relógio grande.
- Bairro dos Mineiros (6 casas iguais): cada casa com uma família e um detalhe diferente; numa delas um menino coleciona luzita apagada.
- Oficina do Vô Ernesto: engrenagens antigas, uma boneca de metal desmontada (Magearna).
- Delegacia de Cidade Aurora: celas; com 8 insígnias, Véspera e Solano ficam aqui.

**Moradores:** Pipa (repórter); Gerente Lúcio; Heitor (no hospital); Vô Ernesto (relojoeiro); Seu Dito.

**Missões:**
- **A reportagem da Pipa** `sq_pipa` (mostrar): Fotografar 10 Pokémon Alfa diferentes com a Rotom câmera. Recompensa: item-chave camera-rotom, item nugget x2.
- **Cliente de todos os andares** `sq_megaloja` (cadeia): Comprar algo em cada andar da Megaloja; no terraço, o gerente dá um cartão fidelidade (10% de desconto). Recompensa: item-chave cartao-aurora, item premierBall x10.
- **O Steelix de cristal** `sq_steelix` (alfa): Na Mina Abandonada (nível 5), um Steelix Alfa coberto de luzita dorme no escuro. Recompensa: Pokémon #208 alfa capturável, item hardStone, Mega Pedra steelixite.
- **O maquinista sumido** `sq_trem` (achar): O maquinista do Trem da Aurora sumiu: está pescando no Lago Espelho. Sem ele o trem não sai. Recompensa: passe livre no trem, item thunderStone.
- **O coração de engrenagem** `sq_magearna` (cadeia): Trazer ao Vô Ernesto 4 engrenagens de Klink (Mina), um Ímã e a Lente Prisma: a boneca acorda. Recompensa: Pokémon #801 nv50 (evento).
- **O cofre da cobertura** `sq_genesect` (achar): Com o Crachá Aurora (ou 8 insígnias), abrir o cofre de Solano: um projeto "fóssil vivo" e um Beldum guardado. Recompensa: Pokémon #374 nv40, Pokémon #649 nv60 (evento), Mega Pedra metagrossite.

#### Forte Rochedo
Região: Núcleo de Alvorada · Ginásio: **Brás** (Lutador), Insígnia Punho, Roda de Capoeira.

**Prédios (todos com interior):**
- Centro Pokémon (antigo quartel): beliches, armas antigas na parede.
- Mercado: vendedor especial: Faixa Preta, itens de PS.
- Arquivo do Forte: estantes altas, mapas antigos, caixa de cartas.
- Roda de Capoeira (ginásio): salão circular com placas de pressão.
- Casa do Mestre Cobra: berimbaus, esteira, Hitmontop velho.
- Museu do Forte: canhões, maquete da muralha, armadura de Aegislash na vitrine.
- Torre dos Canhões: escada em caracol até o topo da muralha (vista do Paredão).

**Moradores:** Líder Brás; Mestre Cobra (cego, berimbau); Curadora Dona Lúcia (museu).

**Missões:**
- **As duas rodas** `sq_kubfu` (cadeia): Mestre Cobra confia um Kubfu. Ele evolui depois de vencer a Roda de Angola (Torre dos Canhões, estilo Sombrio) ou a Roda Regional (Cachoeira, estilo Água). Recompensa: Pokémon #891 nv10, Urshifu de um dos dois estilos.
- **As balas de canhão** `sq_canhoes` (buscar): Quatro balas de canhão antigas rolaram pela Ravina. Recolocá-las abre o paiol. Recompensa: item hardStone, item expertBelt.
- **O ritmo do berimbau** `sq_tutor_cobra` (tutor): Mestre Cobra ensina Chute Baixo, Contra-Ataque e Soco Drenante. Recompensa: tutor lowKick, tutor counter, tutor drainPunch.
- **Bilhete da vitória** `sq_victini` (vencer): Vencer a revanche de Brás com 8 insígnias: no paiol, uma pequena chama alaranjada. Recompensa: Pokémon #494 nv50 (evento).
- **A armadura da vitrine** `sq_aegislash` (mostrar): Mostrar à curadora um Honedge (#679): a armadura do museu "reconhece" e ela dá a Pedra. Recompensa: item duskStone, item metalCoat.

#### Cidade Escarpa
Região: Núcleo de Alvorada · Ginásio: **Graça** (Pedra), Insígnia Rocha, Mina Velha.

**Prédios (todos com interior):**
- Centro Pokémon: lareira, telhado de ardósia.
- Mercado: vendedor especial: Pedra Dura, Escudo.
- Ateliê da Dona Pedrina: bancada de lapidação, vitrine de insígnias, lupa enorme.
- Mina Velha (ginásio): carrinhos e trilhos.
- Pousada do Planalto: quartos (descansar até a manhã ou a noite), cozinha.
- Igreja de Pedra: vitral com os oito menires.
- Casas em degraus (4): família de mineiros, alpinista aposentado, menina das pedras de evolução, casal de velhinhos com Probopass.

**Moradores:** Líder Graça; Dona Pedrina (lapidária); Velho Alpinista Urbano; Menina Ágata (pedras).

**Missões:**
- **A Pedra-Chave** `sq_pedra_chave` (cadeia): Dona Pedrina lapida a Pulseira Mega com três lascas de prisma: uma da Mina Abandonada, uma das Ruínas dos Vigias e uma da Caverna de Gelo Cristalino. Recompensa: item-chave pulseira-mega, Mega Pedra lucarionite.
- **O que a pedra guarda** `sq_fosseis` (troca): Pedrina identifica fósseis achados pela região e indica o Laboratório de Fósseis de Cidade Buriti. Recompensa: fósseis identificados.
- **As pedras da Ágata** `sq_agata` (troca): Ágata troca uma pedra de evolução por 3 Cacos (achados quebrando rochas). Recompensa: item fireStone|waterStone|thunderStone|leafStone|iceStone|moonStone.
- **Os 28 Unown** `sq_unown` (mostrar): Encontrar as 28 formas de Unown nas Ruínas dos Vigias e no Planalto; juntas, a frase "O RELÓGIO NÃO ACENDE O SOL". Recompensa: item sunStone, lore.
- **O carrinho desgovernado** `sq_carrinho` (vencer): Graça desafia: descer a Mina Velha no carrinho sem bater (três tentativas) e vencer o Alfa Probopass do fim da linha. Recompensa: item rockyHelmet, MT stealthRock.

#### Mirante dos Ventos
Região: Núcleo de Alvorada · Ginásio: **Celeste** (Voador), Insígnia Pluma, Torre do Vento.

**Prédios (todos com interior):**
- Centro Pokémon: preso à rocha por vigas, janela para o mar.
- Mercado: vendedor especial: Cachecol, Penas.
- Viveiro de Corviknight: ninhos, Nina e os filhotes de Rookidee.
- Torre do Vento (ginásio): tubos de vento e cata-ventos.
- Casa da Celeste: cachecóis, telescópio.
- Posto do Correio do Céu: sacos de cartas, Corviknight-carteiro com a asa enfaixada.
- Casas penduradas (3): pescador de nuvens, menino das pipas, avó que conta de Rayquaza.

**Moradores:** Líder Celeste; Nina (14 anos, viveiro); Carteiro Seu Abílio; Vó Zefa (lendas do céu).

**Missões:**
- **O carteiro do céu** `sq_carteiro` (entregar): Entregar 5 cartas, uma em cada Ninho, dentro do tempo, voando. A última é para o Iberê. Recompensa: MT steelWing, item hpUp x5.
- **Estrelas cadentes** `sq_minior` (mostrar): Nas noites claras, Minior caem no Planalto. Mostrar 7 cores de núcleo ao Último Vigia. Recompensa: item stardust x7, lore do Necrozma.
- **Pipas no vento** `sq_pipas` (achar): O menino perdeu 4 pipas nas falésias; só se alcançam voando ou escalando. Recompensa: item airBalloon, item sharpBeak.
- **Desejo da Nina** `sq_jirachi` (cadeia, depois de `sq_minior`): Depois das estrelas cadentes: numa chuva de meteoros, Nina faz um pedido no topo da Torre do Vento. Recompensa: Pokémon #385 nv30 (evento).
- **O dragão do céu alto** `sq_rayquaza` (achar): Vó Zefa conta de uma serpente verde acima das nuvens. Com 8 insígnias, voar até o alto da Torre do Vento ao meio-dia. Recompensa: Pokémon #384 nv75.

#### Liga Alvorada (Cidadela do Zênite)
Região: Núcleo de Alvorada.

**Prédios (todos com interior):**
- Portão da Liga: Centro Pokémon e loja; guarda confere as 8 insígnias.
- Sala da Madrugada (Aurélio, Sombrio): escura, estrelas no teto.
- Sala da Manhã (Clarice, Fada): flores e luz rosa.
- Sala do Meio-dia (Seu Brasa, Fogo): chão de terra rachada, calor.
- Sala do Entardecer (Iberê, Dragão): janela para o pôr do sol eterno.
- Salão da Campeã (Dalva): janela para o leste.
- Hall da Fama: registro das equipes campeãs.

**Moradores:** Elite: Aurélio, Clarice, Seu Brasa, Iberê; Campeã Dalva.

**Missões:**
- **Revanche das quatro horas** `sq_revanches` (vencer): Depois de campeão, a Elite e a Campeã aceitam revanche com equipes de nível 70+. Recompensa: item abilityCapsule, ₽20000.

#### Vila Geada
Região: Cordilheira Geada.

**Prédios (todos com interior):**
- Centro Pokémon (cabana de troncos): lareira, chá quente.
- Mercado: agasalhos, Antigelo, Bola Pesada.
- Casa do Seu Olavo (pescador de gelo): serra de gelo, varas curtas, buraco no chão da cozinha que dá para o lago.
- Estalagem do Uivo: quartos, mesa de sopa, mural de alpinistas desaparecidos.
- Observatório Boreal: telescópio, Dra. Hanna (estuda auroras e o Coração).
- Casa da Família Nev: gêmeos que adoram batalhas na neve.
- Sorveteria da Dona Branca: balcão de sorvete feito por Vanillite.

**Moradores:** Seu Olavo; Dra. Hanna; Gêmeos Nev (Tor e Tora); Dona Branca.

**Missões:**
- **Pesca no buraco** `sq_pesca_gelo` (mostrar): Pescar pelos buracos do Lago Congelado e mostrar Seel, Barboach e Relicanth ao Seu Olavo. Ele dá a vara que pesca através do gelo. Recompensa: item-chave vara-de-gelo, item neverMeltIce.
- **Alpinistas perdidos** `sq_avalanche` (achar): Três alpinistas do mural estão presos na Geleira do Uivo depois de uma avalanche. Recompensa: item iceStone, item maxRevive x3.
- **Sorvete de Vanillite** `sq_sorvete` (diario): Dona Branca dá um sorvete por dia (cura 1 Pokémon e tira congelamento). Recompensa: item iceHeal + cura.
- **A luz que dança** `sq_aurora_boreal` (cadeia): Dra. Hanna pede leituras de luz em 3 picos (Cume, Pico Geada, Geleira) numa noite de aurora. As leituras mostram o Coração "respirando". Recompensa: item dawnStone, Mega Pedra glalitite.
- **Gêmeos trocadores** `sq_troca_nev` (troca): Tor troca um Sneasel de Hisui por um Sneasel comum; Tora troca um Avalugg de Hisui por um Avalugg. Recompensa: Pokémon #215@hisui nv40, Pokémon #713@hisui nv45.

#### Vila Mandacaru
Região: Sertão do Levante.

**Prédios (todos com interior):**
- Centro Pokémon: paredes de taipa, rede na varanda.
- Bodega do Zé Preá (loja): rapadura, farinha, Pedra do Fogo, Bola Veloz.
- Casa do Seu Brasa: chapéu de couro, sanfona, cercado de Skiddo; ele é da Elite, mas mora aqui.
- Casa de Farinha: forno de farinha, prensa, Diggersby girando a roda.
- Capela de São Pedro: ex-votos, sino; quermesse em junho (festa junina com batalhas).
- Estação Mandacaru: fim da linha do Trem da Aurora.
- Casa da Dona Socorro: pote de barro, cisterna seca.

**Moradores:** Seu Brasa (Elite, Fogo, 65 anos); Zé Preá (bodegueiro); Dona Socorro; Trio do Forró (treinadores).

**Missões:**
- **As cabras do Seu Brasa** `sq_tepig` (buscar): Cinco Skiddo fugiram do cercado para a caatinga. Trazer de volta antes do sol a pino. Recompensa: Pokémon #498 nv15 (Tepig), item charcoal.
- **Água na cacimba** `sq_cacimba` (achar): A cisterna da Dona Socorro secou. Achar o veio de água no Lajedo com um Pokémon que cave. Recompensa: MT dig, item freshWater x6.
- **O trio do forró** `sq_forro` (vencer): Vencer a sanfona, a zabumba e o triângulo numa batalha tripla em sequência. Recompensa: ₽6000, item metronome.
- **Sol a pino** `sq_tutor_brasa` (tutor): Seu Brasa ensina Onda de Calor e Lança-Chamas a quem mostrar um Pokémon de Fogo de nível 40 ou mais. Recompensa: tutor heatWave, tutor flamethrower.
- **Quermesse de São João** `sq_quermesse` (diario): Na festa (fim de semana do jogo), barracas dão um prêmio por dia: Frutas, Bolas, um Doce Raro no domingo. Recompensa: item rareCandy (domingo).

#### Cidade Buriti
Região: Sertão do Levante.

**Prédios (todos com interior):**
- Centro Pokémon: cúpula branca, fonte no meio.
- Bazar do Oásis (loja): tapetes, Bola Pesada, Areia Macia, Escama de Dragão (cara).
- Laboratório de Fósseis: máquina de reviver, cientista Dr. Ícaro; revive fósseis em 1 hora de jogo.
- Museu do Sertão: esqueleto de Tyrantrum, pinturas rupestres copiadas, pedra do meteoro.
- Hotel Oásis: quartos, piscina, hóspede de Alola que troca.
- Tenda da Rainha do Bazar: anéis dourados, espelho; ela conhece Hoopa.
- Arena de Areia: batalhas sob tempestade de areia todo dia às 15h.
- Casa da Caravana: tropeiros, mapas das dunas.

**Moradores:** Dr. Ícaro (fósseis); Rainha do Bazar Zuleica; Tropeiro Bento Duna; Hóspede Kiana (de Alola).

**Missões:**
- **De volta à vida** `sq_reviver` (troca): Reviver qualquer fóssil achado no mundo (Concha, Domo, Âmbar, Raiz, Garra, Crânio, Escudo, Casco, Pena, Mandíbula, Vela e os quatro meio-fósseis do Ocaso). Recompensa: Pokémon #fóssil nv25.
- **A caravana das dunas** `sq_caravana` (entregar): Levar três cargas de Buriti a Vila Mandacaru, Vila Siri e Vila Termas. Recompensa: item softSand, item-chave mapa-das-dunas (marca a Cratera da Estrela).
- **O anel da rainha** `sq_hoopa` (cadeia): Zuleica perdeu seis anéis no deserto; com todos, o espelho da tenda se abre. Recompensa: Pokémon #720 nv50 (evento).
- **Lembrança de Alola** `sq_troca_kiana` (troca): Kiana troca um Sandshrew de Alola por um Sandshrew e um Vulpix de Alola por um Vulpix. Recompensa: Pokémon #27@alola nv30, Pokémon #37@alola nv30.
- **Campeão da areia** `sq_tempestade` (vencer): Vencer 5 batalhas seguidas na Arena de Areia. Recompensa: item smoothRock, Mega Pedra garchompite.

#### Vila Siri
Região: Sertão do Levante.

**Prédios (todos com interior):**
- Centro Pokémon (palafita): chão de tábuas sobre a água.
- Mercado do Caranguejo: Bola de Rede, Bola Isca, Frutas.
- Casa da Marisqueira Dona Maré: cestos de caranguejo, tábua de maré.
- Escola de Canoa: remos, canoas penduradas, mestre Iraci.
- Cais do Barco das Brasas: quadro de horários (7h e 15h), bilheteria.
- Casa da Rendeira: bilros, rendas penduradas.

**Moradores:** Dona Maré; Mestre Iraci (canoa); Dona Rendeira Lia-Rosa.

**Missões:**
- **O maior caranguejo** `sq_caranguejo` (mostrar): Mostrar um Kingler (#99) acima do nível 40 ou um Crabominable. Recompensa: item kingsRock, MT crabhammer.
- **Hora da maré** `sq_mare` (achar): Com a tábua de maré, achar 4 baús que só aparecem na maré baixa do Mangue. Recompensa: item bigPearl x2, item dampRock.
- **O sapo do lamaçal** `sq_seismitoad` (alfa): Um Seismitoad Alfa afunda as canoas. Vencê-lo no meio do mangue. Recompensa: Pokémon #537 alfa capturável.
- **Remar até o farol** `sq_canoa` (vencer): Corrida de canoa (Nadar) até a Ilha do Sol Nascente e de volta. Recompensa: item mysticWater, ₽4000.

#### Vila Jandaia
Região: Arquipélago das Jandaias.

**Prédios (todos com interior):**
- Centro Pokémon: telhado de palha, redes.
- Mercado: Frutas tropicais, Bola Rápida, Bola Ninho.
- Creche da Vó Iara: ninhos, cesto de ovos, Chansey ajudante.
- Casa do Pescador Tupã: redes, jangada.
- Pousada da Praia: quartos com vista, mural de surfe.
- Píer da Balsa: horários para Cidade Coral (9h, 14h, 19h).
- Acampamento dos Pesquisadores (na Selva Grande): barraca, mapa do templo, pesquisadora Dra. Ybi.

**Moradores:** Vó Iara (creche); Pescador Tupã; Dra. Ybi (arqueóloga).

**Missões:**
- **Os ovos da Vó Iara** `sq_ovos` (diario): Um ovo por dia, sorteado entre os bebês: Pichu, Cleffa, Igglybuff, Togepi, Tyrogue, Smoochum, Elekid, Magby, Azurill, Wynaut, Budew, Chingling, Bonsly, Mime Jr., Happiny, Munchlax, Riolu, Mantyke, Toxel. Recompensa: Pokémon #bebê nv1.
- **Coco verde** `sq_coco` (buscar): Derrubar 10 cocos dos coqueiros da Ilha Jandaia (balançando com um Pokémon forte). Recompensa: item sitrusBerry x10, MT bulletSeed.
- **O mapa do templo** `sq_ybi` (cadeia): Dra. Ybi precisa de 3 tabuletas do Templo das Raízes (uma por andar). Recompensa: item leafStone, fóssil:raiz, Mega Pedra venusaurite.
- **O guardião da ilha** `sq_tapu_koko` (vencer): Vencer os 4 capitães da ilha (um em cada praia): no altar da colina, o guardião desce. Recompensa: Pokémon #785 nv60.
- **Coqueiro andante** `sq_troca_tupa` (troca): Tupã troca um Exeggutor de Alola por um Exeggcute. Recompensa: Pokémon #103@alola nv35.

#### Estação Austral
Região: Mar do Sul e Ilhas Austrais.

**Prédios (todos com interior):**
- Enfermaria da Estação (Centro Pokémon): macas, aquecedor.
- Refeitório: mesa comprida, cozinheira que troca receitas por Frutas.
- Laboratório Glaciológico: núcleos de gelo, microscópio, Prof.ª Solveig.
- Dormitórios: beliches; descansar até de manhã.
- Hangar do navio: navio de pesquisa (volta para Cidade Coral seg, qua, sex às 16h).

**Moradores:** Prof.ª Solveig; Marinheiro Gusmão; Cozinheira Dona Neca.

**Missões:**
- **Núcleos de gelo** `sq_amostras` (buscar): Coletar amostras em 4 icebergs das Ilhas Austrais (dois só nadando). Recompensa: item icyRock, MT blizzard.
- **O canto das Lapras** `sq_lapras_austral` (mostrar): Mostrar uma Lapras à Prof.ª Solveig: ela grava o canto e dá um presente. Recompensa: item waterStone, Mega Pedra blastoisinite.
- **As letras no gelo** `sq_regice` (achar): Decifrar a inscrição da Caverna do Iceberg (alfabeto dos Vigias, ensinado pelo Último Vigia). Recompensa: Pokémon #378 nv60.
- **Lembrança fria** `sq_troca_gusmao` (troca): Gusmão troca um Vulpix de Alola por um Vulpix comum. Recompensa: Pokémon #37@alola nv40.

#### Vila Termas
Região: Arquipélago das Brasas.

**Prédios (todos com interior):**
- Centro Pokémon: lanternas de papel, chão de madeira.
- Mercado: Antiqueimadura, Pedra do Fogo, Rocha Quente.
- Casa de Banhos: piscinas termais (curam a equipe toda, ₽300).
- Pousada do Vapor: quartos com tatame, ovos cozidos no vapor.
- Forja do Ferreiro Brasão: bigorna, armaduras de Charcadet.
- Casa da Vulcanóloga Dra. Lava: sismógrafo, amostras de basalto.
- Cais: Barco das Brasas para Vila Siri (9h e 17h).

**Moradores:** Ferreiro Brasão; Dra. Lava (vulcanóloga); Dona Hana (banhos).

**Missões:**
- **As duas armaduras** `sq_armaduras` (troca): Brasão forja a Armadura Auspiciosa (10 Pedras do Fogo) ou a Maliciosa (10 Etiquetas Enfeitiçadas) para o Charcadet. Recompensa: item auspiciousArmor, item maliciousArmor.
- **Ovo cozido no vapor** `sq_ovo_vapor` (diario): A pousada dá um ovo cozido por dia (cura e dá um pouco de experiência). Recompensa: item expCandyS.
- **A montanha que anda** `sq_camerupt` (alfa): Um Camerupt Alfa abre crateras nos Campos de Cinza. Recompensa: Pokémon #323 alfa capturável, Mega Pedra cameruptite.
- **O vulcão acordado** `sq_sismografo` (achar): Instalar 3 sensores da Dra. Lava (borda da cratera, Rio de Lava, Forja Antiga). Recompensa: item heatRock, Mega Pedra charizarditeY.
- **O coração do vulcão** `sq_heatran` (cadeia, depois de `sq_sismografo`): Depois dos sensores: o terceiro mostra "algo se mexe" na câmara da Forja Antiga. Recompensa: Pokémon #485 nv70.

#### Porto Rubro
Região: Ocaso Leste: Pampa e Pantanal.

**Prédios (todos com interior):**
- Centro Pokémon: tijolo vermelho, janelas para o pôr do sol.
- Mercado do Porto: tudo do Ocaso: Ultra Bolas, Bola de Luxo, Doces de Exp..
- Capitania dos Portos: cargueiro Estrela-d’Alva (10h e 22h para Cidade Coral), Capitão Ivo.
- Clube dos Iniciais: sala com 27 pedestais; o presidente premia a Pokédex.
- Museu do Poente: história dos Pastores do Poente, réplica do Templo.
- Mercado de Peixe: peixeiros, gaivotas.
- Casa do Cartógrafo: mapas do Ocaso com áreas em branco.

**Moradores:** Capitão Ivo (pai do jogador); Presidente do Clube, Seu Rubens; Cartógrafa Dona Selma.

**Missões:**
- **O Clube dos Iniciais** `sq_iniciais` (cadeia): A cada 40 espécies registradas no Ocaso, o clube dá um inicial à escolha entre os que o jogador ainda não tem. Recompensa: Pokémon #inicial nv5 (até completar os 27).
- **Manchas em branco** `sq_mapa_ocaso` (achar): Visitar 8 marcos do Ocaso para Dona Selma completar o mapa. Recompensa: item expCandyL x5, item-chave mapa-do-ocaso.
- **O doce envenenado** `sq_pecharunt` (cadeia): Um caixeiro estranho oferece doces de pêssego no cais; cada um que alguém come o deixa esquisito. Achar o dono dos doces. Recompensa: Pokémon #1025 nv70 (evento).
- **Um dia no convés** `sq_pai` (diario): O Capitão Ivo conta uma história do mar por viagem e dá uma lembrança de cada porto. Recompensa: item pearl / item:stardust por viagem.

#### Estância Ventania
Região: Ocaso Leste: Pampa e Pantanal.

**Prédios (todos com interior):**
- Centro Pokémon: galpão de madeira, chimarrão no balcão.
- Armazém: Leite Moomoo, Bola Veloz, selas.
- Galpão Crioulo: fogo de chão, violão, histórias de assombração.
- Casa do Gaúcho Bento: boleadeiras, quadro de rodeios.
- Estábulo: Tauros de Paldea das três raças.

**Moradores:** Gaúcho Bento; Prenda Laura; Peão Tiaraju.

**Missões:**
- **As três raças** `sq_tauros_paldea` (mostrar): Mostrar ao Bento os três Tauros de Paldea (Combate, Chama, Água). Recompensa: item choiceBand, ₽10000.
- **Rodeio da Estância** `sq_rodeio` (vencer): Vencer 3 peões no rodeio (montado num Pokémon de Correr). Recompensa: item powerAnklet, item-chave sela-de-prata.
- **A coluna dos heróis** `sq_herois` (achar): Duas estátuas no Pampa seguram uma espada e um escudo de pedra. Limpar as duas ao amanhecer. Recompensa: Pokémon #888 nv70, Pokémon #889 nv70.

#### Vila Altiplana
Região: Ocaso Oeste: Cordilheira e Desertos.

**Prédios (todos com interior):**
- Centro Pokémon: adobe, mantas coloridas.
- Mercado: lã, Ervas, Bola Lua.
- Casa da Tecelã Quilla: tear, novelos de lã de Wooloo e Mareep.
- Palácio de Adobe: trono vazio, jardim de cenouras; dizem que um rei antigo voltará.
- Observatório do Altiplano: céu mais limpo do mundo; estrelas de Deoxys.

**Moradores:** Tecelã Quilla; Guardião do Palácio Mayta; Astrônoma Inti.

**Missões:**
- **O rei das cenouras** `sq_calyrex` (cadeia): Plantar cenouras no jardim do palácio: uma de gelo (Campos de Gelo do Sul) e uma de sombra (Deserto, de noite). O rei volta e chama um corcel. Recompensa: Pokémon #898 nv75, Pokémon #896 ou 897 nv75.
- **Lã para o inverno** `sq_la` (buscar): Trazer 6 tufos de lã (Wooloo, Mareep, Altaria). Recompensa: item assaultVest, item expCandyM x5.
- **O voo do condor** `sq_condor` (vencer): Vencer o Alfa Braviary de Hisui que domina o paredão do altiplano. Recompensa: Pokémon #628@hisui alfa capturável.

#### Vila Fim-do-Mundo
Região: Ocaso Oeste: Cordilheira e Desertos.

**Prédios (todos com interior):**
- Centro Pokémon: chapa de metal, aquecedor a lenha.
- Armazém do Fim: Bola Cronômetro, Antigelo, Gelo Eterno.
- Farol do Fim do Mundo: escada espiral, livro de visitas de todos os navegantes.
- Casa do Velho Baleeiro: arpões enferrujados, fotos de Wailord; arrependido, hoje protege.

**Moradores:** Velho Baleeiro Nuno; Faroleira Rosaura.

**Missões:**
- **Promessa do baleeiro** `sq_baleia` (mostrar): Mostrar um Wailord (#321) nível 70+ ao Nuno. Recompensa: item bigPearl x3, item leftovers.
- **O cavalo de gelo** `sq_glastrier` (alfa): Pegadas de casco congelam o caminho para o glaciar. No fim delas, um corcel de gelo. Recompensa: Pokémon #896 nv75 (se não veio com o rei).
- **O mundo do avesso** `sq_giratina` (achar): No fundo do Glaciar, um espelho de gelo mostra o mundo de cabeça para baixo. Recompensa: Pokémon #487 nv75.

#### Cidadela do Poente
Região: Ocaso Leste: Pampa e Pantanal.

**Prédios (todos com interior):**
- Torre de Batalha: sequências de 7 batalhas, nível 50 e livre.
- Salão das Tocas: reides cooperativos com até 4 jogadores (online).
- Loja de Pontos de Batalha: itens competitivos, Cápsula de Habilidade, Mega Pedras raras.

**Moradores:** Mestra da Torre Dandara do Poente.

**Missões:**
- **Sete seguidas** `sq_torre` (vencer): Vencer 7, 21 e 49 batalhas seguidas. Recompensa: item abilityCapsule, Mega Pedra mewtwonite X/Y (49).

<!-- /gerado:cidades -->

---

## 11. Cavernas, templos e dungeons (gerado)

Legenda dos mapas: `E` entrada, `S` escada ou saída, `B` chefe ou Alfa, `T` tesouro, `#` parede, `.` chão, `~` água,
`i` gelo escorregadio, `o` pedra para empurrar, `x` buraco ou rachadura para o andar de baixo, `=` ponte ou trilho, `^`
interruptor, `|` porta, `L` lava, `*` cristal, `?` sala escura (precisa de luz), `v` cipó, `:` areia, `P`/`F` passado e
futuro.

<!-- gerado:dungeons -->
#### Gruta da Maré
Região: Núcleo de Alvorada. Entrada: Praia Oeste, sob o morro do farol (252, 396). Acesso: a pé na maré baixa (6h–10h e 18h–22h); Mergulhar para a Câmara Submersa. Estado: pendente no núcleo.

- **Boca da Gruta** (selvagens 6–10): poças que enchem com a maré: o interruptor ^ fecha uma comporta e seca o canal por 60 s

  ```
  #########
  #E..~~..#
  #.o.~~.T#
  #..^..S.#
  #########
  ```
- **Galeria das Conchas** (selvagens 11–15): empurrar duas pedras para dentro do canal e criar uma ponte; o buraco x cai direto no fundo (atalho de volta)

  ```
  ###########
  #S..~~~..T#
  #.##~o~##.#
  #..x...o..#
  #E########S#
  ```
- **Câmara Submersa** (selvagens 28–32): mergulho com correntes: seguir as bolhas; sem luz, só se vê com a Vela Eterna ou um Lanturn

  ```
  ~~~~~~~~~
  ~E~~*~~B~
  ~~~~~~T~~
  ```

**Chefe ou alfa:** Alfa Barbaracle (#689) na Galeria; Dhelmise (#781) guarda a câmara.
**Tesouros:** Fóssil Concha (Omanyte), Fóssil Domo (Kabuto), Pérola Grande, Escama Prisma (rara), MT Escaldar.


#### Toca do Absol (Gruta do Musgo)
Região: Núcleo de Alvorada. Entrada: Bosque Sussurrante (201, 201). Acesso: a pé. Estado: desenhada.

- **Gruta do Musgo** (selvagens 19–23): primeiro lugar com luzita nas paredes; luz e sombra alternam

  ```
  ##########
  #E..**..T#
  #.##..##.#
  #...B....#
  ##########
  ```

**Chefe ou alfa:** Ariados Alfa (#168).
**Tesouros:** Pedra da Lua, Absolita (com a missão de Sina).
**Só aqui:** Ariados (#168).

#### Mina Aurora (4 níveis) + Mina Abandonada
Região: Núcleo de Alvorada. Entrada: Pé do Paredão, nos fundos de Cidade Aurora. Acesso: a pé (nível 5: Vela Eterna ou luz). Estado: níveis 1-4 desenhados.

- **Nível 1** (selvagens 27–31): trilhos e elevador de carga
- **Nível 2** (selvagens 30–34): carrinhos que derrubam paredes
- **Nível 3** (selvagens 32–36): desabamento; poço
- **Nível 4** (selvagens 34–38): paredes de luzita que pulsam; garra de cristal
- **Mina Abandonada (Nível 5)** (selvagens 39–43): escuro total: só a Vela Eterna mostra o caminho; carrinhos parados viram pontes quando empurrados para o vão

  ```
  ############
  #S?????..T##
  #.#?##?##..#
  #..?..B?...#
  ############
  ```

**Chefe ou alfa:** Steelix Alfa (#208) no nível 4; Steelix de cristal Alfa no nível 5.
**Tesouros:** MT Canhão de Luz, Lasca de prisma (Pulseira Mega), Fóssil Crânio, Fóssil Escudo, Steelixita, Registeel (câmara selada no nível 5, com as letras dos Vigias).
**Só aqui:** Whismur (#293), Loudred (#294), Klink (#599), Carkol (#838), Excadrill (#530), Klang (#600), Klefki (#707), Mawile (#303), Cufant (#878), Copperajah (#879).

#### Ruínas dos Vigias
Região: Núcleo de Alvorada. Entrada: Planalto dos Ventos (216, 36). Acesso: Escalar (o Paredão); Lente Prisma para as inscrições. Estado: pendente no núcleo.

- **Colunata** (selvagens 40–44): oito colunas com sombras; ao meio-dia as sombras apontam para a escada

  ```
  #.#.#.#.#
  .E.....T.
  #.#.^.#.#
  ....S....
  ```
- **Sala dos Murais** (selvagens 47–51): portas que abrem quando os Unown certos são mostrados ao mural

  ```
  ##########
  #S.|..|.T#
  #.#^##^#.#
  #...B....#
  ##########
  ```

**Chefe ou alfa:** Alfa Bronzong (#437).
**Tesouros:** Lasca de prisma (Pulseira Mega), Pedra do Sol, MT Psíquico.
**Só aqui:** Honedge (#679), Doublade (#680), Aegislash (#681), Chimecho (#358).

#### Caverna de Gelo Cristalino
Região: Cordilheira Geada. Entrada: Geleira do Uivo (1000, 60). Acesso: Escalar (paredes de gelo da geleira).

- **Saguão** (selvagens 54–58): gelo escorregadio: o jogador desliza até bater; as pedras servem de parada

  ```
  ###########
  #E.iiiii..#
  #..i#iii.T#
  #.iiiii#iS#
  ###########
  ```
- **Rio Congelado** (selvagens 55–59): empurrar blocos de gelo no rio para fazer paradas; rachaduras x quebram depois de pisadas duas vezes e derrubam para o andar de baixo

  ```
  ############
  #S..iiix..T#
  #.oo.iiiii.#
  #..^..iix.S#
  ############
  ```
- **Coração Azul** (selvagens 56–60): espelhos de gelo refletem a luz da Vela Eterna para derreter a parede do altar

  ```
  ##########
  #S*.ii.*T#
  #.*i##i*.#
  #..*B*...#
  ##########
  ```

**Chefe ou alfa:** Alfa Avalugg (#713) no Rio Congelado; Glalie Alfa (#362) no Coração Azul. Atrás de uma parede de gelo grosso, a Câmara do Zero Absoluto guarda Kyurem (#646).
**Tesouros:** Lasca de prisma (Pulseira Mega), Fóssil Vela (Amaura), Pedra de Gelo, Glalita, Abomasnita, Froslassita, MT Nevasca.


#### Ruínas de Pedra Pintada
Região: Sertão do Levante. Entrada: Dunas Douradas (960, 350). Acesso: Correr (areia fofa até a entrada).

- **Pátio das Pinturas** (selvagens 43–47): pinturas de Solgaleo: pisar nas placas na ordem do sol (leste, meio-dia, oeste) abre a porta

  ```
  ###########
  #E..^...^.#
  #.##.##.#.#
  #..T..|..S#
  ###########
  ```
- **Galeria da Areia** (selvagens 44–48): areia movediça (x) puxa para o andar de baixo; pedras empurradas param a areia que escorre

  ```
  ############
  #S::xx::::T#
  #.::xx::##.#
  #..o..:::.S#
  ############
  ```
- **Câmara do Sol** (selvagens 46–50): dois raios de luz pelo teto precisam acertar o disco do altar ao mesmo tempo (girar espelhos)

  ```
  #########
  #S..*..T#
  #.^.B.^.#
  #########
  ```

**Chefe ou alfa:** Alfa Krookodile (#553) na Galeria; Regirock (#377) na Câmara do Sol depois da inscrição dos Vigias.
**Tesouros:** Fóssil Garra (Anorith), Fóssil Âmbar (Aerodactyl), Pedra do Sol, Aerodactylita, Tyranitarita, MT Tempestade de Areia.
**Só aqui:** Runerigus (#867), Yamask (yamask-galar), Zweilous (#634).

#### Templo das Raízes
Região: Arquipélago das Jandaias. Entrada: Selva Grande (120, 760). Acesso: Escalar (paredões de cipó).

- **Átrio** (selvagens 42–46): cipós (v) crescem ou recuam quando se rega a flor-interruptor ^

  ```
  ###########
  #E.vv.^.vT#
  #.##v##.#.#
  #....|...S#
  ###########
  ```
- **Galerias Inundadas** (selvagens 44–48): correnteza: canais empurram o jogador (Nadar); comportas de pedra mudam a direção

  ```
  ############
  #S~~~.~~~.T#
  #.~=~^~=~..#
  #..~~~~~~.S#
  ############
  ```
- **Câmara da Semente** (selvagens 45–49): sala escura: raízes luminosas acendem quando um Pokémon Planta usa um golpe de Planta perto

  ```
  #########
  #S.vv..T#
  #.v.B.v.#
  #########
  ```

**Chefe ou alfa:** Alfa Tangrowth (#465) nas Galerias; Tapu Bulu (#787) desce à Câmara da Semente.
**Tesouros:** Fóssil Raiz (Lileep), Pedra da Folha, Venusaurita, Sceptilita, Tabuletas da Dra. Ybi, MT Tempestade de Folhas.


#### Templo das Marés
Região: Mar do Sul e Ilhas Austrais. Entrada: Ilha do Farol Morto (700, 640). Acesso: Nadar até a ilha; Mergulhar para os andares 2 e 3.

- **Nave Alta** (selvagens 36–40): a maré do salão sobe e desce quando se puxa a corrente do sino ^

  ```
  ###########
  #E..~^~..T#
  #.#~~~~~#.#
  #...~~~..S#
  ###########
  ```
- **Nave Afundada** (selvagens 44–48): portas d’água (|) que só abrem com a maré alta; ar acaba em 60 s (bolsas de ar recarregam)

  ```
  ~~~~~~~~~~~
  ~S~~|~~~~T~
  ~~~^~~~|~~~
  ~~~~~~~~~S~
  ```
- **Altar da Maré** (selvagens 46–50): quatro conchas-sino tocadas na ordem das ondas

  ```
  ~~~~~~~~~
  ~S~*B*~T~
  ~~~~~~~~~
  ```

**Chefe ou alfa:** Alfa Dragalge (#691); Tapu Fini (#788) no Altar.
**Tesouros:** Fóssil Casco (Tirtouga), Gyaradosita, Sharpedonita, Escama de Dragão, MT Hidrobomba.
**Só aqui:** Cursola (#864), Drakloak (#886).

#### Caverna do Iceberg
Região: Mar do Sul e Ilhas Austrais. Entrada: Ilhas Austrais (600, 900). Acesso: Nadar.

- **Túnel Azul** (selvagens 38–42): gelo escorregadio com placas que mudam a direção do deslize

  ```
  ##########
  #E.iiii.T#
  #.i#ii#i.#
  #..iiii.S#
  ##########
  ```
- **Salão Polar** (selvagens 40–44): letras dos Vigias no chão: pisar na palavra GELO abre a câmara de Regice

  ```
  #########
  #S.ii.^T#
  #.iiBii.#
  #########
  ```

**Chefe ou alfa:** Alfa Walrein (#365) e Regice (#378).
**Tesouros:** Pedra de Gelo, Blastoisinita (com a Prof.ª Solveig), Gelo Eterno.


#### Templo da Chama (Vulcão Tição)
Região: Arquipélago das Brasas. Entrada: Vulcão Tição (1060, 820). Acesso: Escalar (encosta do vulcão).

- **Portal de Basalto** (selvagens 52–56): empurrar pedras na lava cria chão de magma frio

  ```
  ###########
  #E.LLL..T.#
  #.oLLL.o..#
  #...^...S.#
  ###########
  ```
- **Rio de Lava** (selvagens 54–58): pontes de pedra que afundam depois de 3 s; um interruptor desvia o rio de lava por 30 s

  ```
  ############
  #S=LLLL=LLT#
  #.=L^LL=L..#
  #..LLLL=..S#
  ############
  ```
- **Forja Antiga** (selvagens 55–59): quatro braseiros acesos na ordem das brasas pintadas no teto

  ```
  #########
  #S.L*L.T#
  #.L.B.L.#
  #########
  ```

**Chefe ou alfa:** Alfa Magmortar (#467) no Rio de Lava; Heatran (#485) na Forja Antiga (missão do sismógrafo).
**Tesouros:** Charizardita X, Houndoominita, Pedra do Fogo x3, Rocha Quente, MT Explosão de Chamas.


#### Santuário do Crepúsculo
Região: Núcleo de Alvorada. Entrada: redemoinho no Lago Espelho (489, 273). Acesso: Mergulhar. Estado: pendente no núcleo.

- **Três salões e o altar** (selvagens 30–34): luz de luar pela água: a Vela Eterna e a Lente Prisma acendem três pilares

  ```
  ~~~~~~~~~~~
  ~E~~|~~|~B~
  ~~T~~~~~~~~
  ```

**Chefe ou alfa:** guardiões Jellicent (#593) e Lanturn (#171); Lunala (#792).
**Tesouros:** Escama Lunar, Bola Lua x5.


#### Fenda Prismática
Região: Núcleo de Alvorada. Entrada: sob o Relógio de Pedra. Acesso: a trama principal abre a fenda (8 insígnias e o Relógio).

- **Boca do Prisma** (selvagens 51–55): prismas dividem a luz em cores; cada cor abre uma porta da mesma cor

  ```
  #########
  #E**.**T#
  #.*^*..S#
  #########
  ```
- **Salão dos Espelhos** (selvagens 60–64): chão de espelho: o jogador só vê o caminho refletido no teto; Fendas Ultra se abrem aqui à noite

  ```
  ###########
  #S*|*|*|*B#
  #.*^*^*^*T#
  ###########
  ```

**Chefe ou alfa:** Necrozma (#800) nível 72.
**Tesouros:** Diancita, Bola Ultra-Fera x10, Pó Estelar, Diancie (#719, evento no salão dos diamantes).


#### Caminho do Zênite
Região: Núcleo de Alvorada. Entrada: Rota 12. Acesso: todas as montarias; a Liga pede 8 insígnias. Estado: pendente no núcleo.

- **Estrada da Vitória** (selvagens 51–55): um obstáculo de cada montaria em sequência: lama, rio, paredão, abismo (voar) e redemoinho

**Chefe ou alfa:** Garchomp Alfa (#445).
**Tesouros:** Garchompita, Doce Raro x3.


#### Gruta das Cataratas
Região: Ocaso Leste: Pampa e Pantanal. Entrada: atrás da cortina das Cataratas do Trovão. Acesso: Nadar contra a correnteza.

- **Cortina d’Água** (selvagens 63–67): subir a cachoeira por dentro: correntes para cima só com o interruptor ^ desligado

  ```
  ###########
  #E~~~..~~T#
  #.~=~^~=~.#
  #...~~~..S#
  ###########
  ```
- **Abismo do Silêncio** (selvagens 67–71): escuro e silencioso: passos ecoam e mostram as paredes por um instante

  ```
  ##########
  #S??????T#
  #.?##?#?.#
  #..??B??.#
  ##########
  ```

**Chefe ou alfa:** Mewtwo (#150) nível 80, o mais forte do mundo.
**Tesouros:** Mewtwonita X, Mewtwonita Y, Bola Mestra.
**Só aqui:** Gigalith (#526), Wobbuffet (#202).

#### Templo do Poente
Região: Ocaso Oeste: Cordilheira e Desertos. Entrada: Deserto do Silêncio (120, 400). Acesso: Correr (dunas).

- **Escadaria do Sol** (selvagens 70–74): degraus que só aparecem na luz do entardecer (17h–18h)

  ```
  #########
  #E^.^.^T#
  #.......#
  #...S...#
  ```
- **Salão dos Dois Céus** (selvagens 71–75): metade do salão é dia e metade é noite; uma pedra branca e uma preta trocam de lado

  ```
  ###########
  #S.*|B|*.T#
  #..^...^..#
  ###########
  ```

**Chefe ou alfa:** Reshiram (#643) e Zekrom (#644), cada um de um lado; Ho-Oh (#250) no telhado ao pôr do sol.
**Tesouros:** Pena Arco-Íris, Pedra da Alvorada, Pedra do Anoitecer.


#### Cratera do Tempo
Região: Ocaso Oeste: Cordilheira e Desertos. Entrada: no meio do Deserto do Silêncio, escondida por uma miragem. Acesso: Correr e Voar para descer.

- **Borda** (selvagens 73–77): descida em espiral; tempestades que mudam o céu de cor
- **Fundo (Passado e Futuro)** (selvagens 75–79): P = selva antiga (paradoxos do passado), F = instalação abandonada (paradoxos do futuro); duas chaves abrem o laboratório

  ```
  ############
  #S..PPPP..T#
  #.PP.**.FF.#
  #..FFFF..B.#
  ############
  ```

**Chefe ou alfa:** Koraidon (#1007), Miraidon (#1008) e Terapagos (#1024).
**Tesouros:** Bola Mestra, Cápsula de Habilidade, pedras de evolução.
**Só aqui:** Bisharp (#625), Noivern (#715), Great Tusk (#984), Scream Tail (#985), Brute Bonnet (#986), Flutter Mane (#987), Slither Wing (#988), Sandy Shocks (#989), Iron Treads (#990), Iron Bundle (#991), Iron Hands (#992), Iron Jugulis (#993), Iron Moth (#994), Iron Thorns (#995), Roaring Moon (#1005), Iron Valiant (#1006), Walking Wake (#1009), Iron Leaves (#1010), Gouging Fire (#1020), Raging Bolt (#1021), Iron Boulder (#1022), Iron Crown (#1023).

#### Mina de Sal
Região: Ocaso Oeste: Cordilheira e Desertos. Entrada: Salar Branco (330, 430). Acesso: a pé.

- **Galerias Brancas** (selvagens 66–70): blocos de sal empurráveis; poços de salmoura
- **Poço Profundo** (selvagens 67–71): cristais de sal guiam a luz até o fundo

**Chefe ou alfa:** Alfa Garganacl (#934); Eternatus (#890) dorme no Poço Profundo.
**Tesouros:** Pedra Dura, Bola Cronômetro x10.


#### Glaciar do Fim do Mundo
Região: Ocaso Oeste: Cordilheira e Desertos. Entrada: Campos de Gelo do Sul. Acesso: Nadar.

- **Fendas** (selvagens 70–74): fendas que se abrem e fecham com a hora; gelo escorregadio
- **Mundo Avesso** (selvagens 74–78): o chão vira teto: gravidade invertida em salas marcadas

**Chefe ou alfa:** Giratina (#487).
**Tesouros:** Orbe Grisalho (item a criar), Gelo Eterno, Bola do Crepúsculo x10.
**Só aqui:** Dusclops (#356), Dusknoir (#477).

<!-- /gerado:dungeons -->

---

## 12. Lendários, míticos, Ultra-Feras e Paradoxo (gerado)

Um de cada, em lugar fixo (`lendario`), andando pelo mundo (`errante`), por missão ou condição especial (`evento`) ou
pelas Fendas Ultra que se abrem de noite depois de capturar o Necrozma (`ultrafera`). Os Paradoxo vivem soltos no fundo
da Cratera do Tempo (raros e muito raros). Os lendários da história (Solgaleo, Lunala, Necrozma) e os que dependem do
Relógio só aparecem depois da trama principal.

<!-- gerado:lendarios -->
| Espécie | Como | Onde | Nível | Nota |
|---|---|---|---:|---|
| Articuno (#144) | lendario | Cume do Vento Branco | 70 |  |
| Zapdos (#145) | lendario | Torre do Vento (Mirante dos Ventos) (topo, em tempestade, com 8 insígnias) | 70 |  |
| Moltres (#146) | lendario | Cratera do Tição | 70 |  |
| Mewtwo (#150) | lendario | Gruta das Cataratas — Abismo do Silêncio | 80 |  |
| Mew (#151) | evento | Ilha Miragem | 30 | na lua cheia, depois de registrar 150 espécies |
| Raikou (#243) | errante | Planalto dos Ventos | 60 | em tempestade de raios |
| Entei (#244) | errante | Rota 14, Estrada do Sertão | 60 | no sertão, ao meio-dia |
| Suicune (#245) | errante | Lago Espelho | 60 | na neblina da madrugada |
| Lugia (#249) | lendario | Fossa Abissal | 75 |  |
| Ho-Oh (#250) | lendario | Templo do Poente — Salão dos Dois Céus | 75 | no telhado, ao pôr do sol, com a Pena Arco-Íris |
| Celebi (#251) | evento | Mata dos Jequitibás | 50 | missão A semente do tempo (Seu Juca planta uma muda de jequitibá) |
| Regirock (#377) | lendario | Ruínas de Pedra Pintada — Câmara do Sol | 60 |  |
| Regice (#378) | lendario | Caverna do Iceberg — Salão Polar | 60 |  |
| Registeel (#379) | lendario | Mina Abandonada (Nível 5) | 60 |  |
| Latias (#380) | errante | Ilhas Gêmeas | 55 | ilha leste; depois de ver as duas ilhas no mesmo dia |
| Latios (#381) | errante | Ilhas Gêmeas | 55 | ilha oeste |
| Kyogre (#382) | lendario | Recife Grande — Fundo (mergulho) | 70 | caverna submersa no fim do recife |
| Groudon (#383) | lendario | Vulcão Sentinela | 70 |  |
| Rayquaza (#384) | lendario | Torre do Vento (Mirante dos Ventos) (céu alto, ao meio-dia) | 75 |  |
| Jirachi (#385) | evento | Mirante dos Ventos | 30 | missão Desejo da Nina |
| Deoxys (#386) | lendario | Cratera da Estrela | 70 | na noite de chuva de meteoros |
| Uxie (#480) | lendario | Lago Congelado | 50 |  |
| Mesprit (#481) | errante | Lagoa Dourada | 50 | aparece e foge; depois anda pelo mundo |
| Azelf (#482) | lendario | Oásis do Buriti | 50 |  |
| Dialga (#483) | lendario | Cratera do Tempo — Fundo (Passado e Futuro) | 75 | lado do Futuro |
| Palkia (#484) | lendario | Cratera do Tempo — Fundo (Passado e Futuro) | 75 | lado do Passado |
| Heatran (#485) | lendario | Templo da Chama — Forja Antiga | 70 |  |
| Regigigas (#486) | lendario | Templo do Poente — Salão dos Dois Céus | 75 | com Regirock, Regice e Registeel na equipe |
| Giratina (#487) | lendario | Glaciar do Fim do Mundo — Mundo Avesso | 75 |  |
| Cresselia (#488) | lendario | Ilha do Véu | 60 | lua cheia, no observatório |
| Phione (#489) | evento | Recife Grande — Fundo (mergulho) | 40 | filhote do Manaphy (ovo do recife) |
| Manaphy (#490) | evento | Recife Grande — Fundo (mergulho) | 1 | ovo dentro de uma concha gigante |
| Darkrai (#491) | evento | Vila Lamparina | 60 | missão Noite de lua nova |
| Shaymin (#492) | evento | Lagoa Dourada | 30 | Flor Gracídea depois de florir 30 Frutas |
| Arceus (#493) | evento | Liga Alvorada (Cidadela do Zênite) | 80 | altar acima das nuvens, com a Pokédex completa |
| Victini (#494) | evento | Forte Rochedo | 50 | missão Bilhete da vitória |
| Cobalion (#638) | lendario | Cânion do Rio Seco | 65 |  |
| Terrakion (#639) | lendario | Ruínas de Pedra Pintada — Pátio das Pinturas | 65 |  |
| Virizion (#640) | lendario | Mata dos Jequitibás | 65 |  |
| Tornadus (#641) | errante | Pampa das Coxilhas | 70 | ventania |
| Thundurus (#642) | errante | Pampa das Coxilhas | 70 | trovoada |
| Reshiram (#643) | lendario | Templo do Poente — Salão dos Dois Céus | 75 | lado do dia |
| Zekrom (#644) | lendario | Templo do Poente — Salão dos Dois Céus | 75 | lado da noite |
| Landorus (#645) | lendario | Altiplano do Condor | 70 | com Tornadus e Thundurus capturados |
| Kyurem (#646) | lendario | Caverna de Gelo Cristalino — Coração Azul | 70 | Câmara do Zero Absoluto |
| Keldeo (#647) | evento | Cachoeira do Véu Verde | 60 | com Cobalion, Terrakion e Virizion |
| Meloetta (#648) | evento | Vila Sussurro | 50 | missão A canção das árvores |
| Genesect (#649) | evento | Cidade Aurora | 60 | missão O cofre da cobertura |
| Xerneas (#716) | lendario | Mata dos Jequitibás | 70 | a árvore mais velha, ao amanhecer |
| Yveltal (#717) | lendario | Deserto do Silêncio | 70 | casulo de pedra, ao anoitecer |
| Zygarde (#718) | lendario | Fundo do Cânion | 70 |  |
| Diancie (#719) | evento | Fenda Prismática — Salão dos Espelhos | 50 | salão dos diamantes, com um Carbink na equipe |
| Hoopa (#720) | evento | Cidade Buriti | 50 | missão O anel da rainha |
| Volcanion (#721) | lendario | Ilhota Fumegante | 60 |  |
| Tapu Koko (#785) | lendario | Ilha Jandaia | 60 | missão O guardião da ilha |
| Tapu Lele (#786) | lendario | Ilha do Basalto | 60 |  |
| Tapu Bulu (#787) | lendario | Templo das Raízes — Câmara da Semente | 60 |  |
| Tapu Fini (#788) | lendario | Templo das Marés — Altar da Maré | 60 |  |
| Solgaleo (#791) | lendario | Ilha do Sol Nascente | 70 | missão O rastro do sol |
| Lunala (#792) | lendario | Santuário do Crepúsculo | 60 |  |
| Nihilego (#793) | ultrafera | Gruta da Maré | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Buzzwole (#794) | ultrafera | Selva Grande | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Pheromosa (#795) | ultrafera | Dunas Douradas | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Xurkitree (#796) | ultrafera | Rota 6, Ferrovia da Aurora | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Celesteela (#797) | ultrafera | Planalto dos Ventos | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Kartana (#798) | ultrafera | Bosque Sussurrante | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Guzzlord (#799) | ultrafera | Cânion do Rio Seco | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Necrozma (#800) | lendario | Fenda Prismática — Salão dos Espelhos | 72 |  |
| Magearna (#801) | evento | Cidade Aurora | 50 | missão O coração de engrenagem |
| Marshadow (#802) | evento | Vila Lamparina | 50 | sombras do Casarão das Velas, depois de vencer a revanche da Zélia |
| Stakataka (#805) | ultrafera | Ilha do Basalto | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Blacephalon (#806) | ultrafera | Campos de Cinza | 65 | Fenda Ultra que se abre de noite depois de capturar o Necrozma; uma por espécie |
| Zeraora (#807) | evento | Rota 6, Ferrovia da Aurora | 50 | nas torres de transmissão, em tempestade |
| Meltan (#808) | evento | Mina Aurora — Nível 4 | 30 | aparecem em grupo depois de tirar a luzita das paredes (missão da Pipa) |
| Zacian (#888) | lendario | Pampa das Coxilhas | 70 | missão A coluna dos heróis |
| Zamazenta (#889) | lendario | Pampa das Coxilhas | 70 | missão A coluna dos heróis |
| Eternatus (#890) | lendario | Mina de Sal — Poço Profundo | 75 |  |
| Zarude (#893) | evento | Selva Grande | 60 | no coração da selva, em noite de chuva |
| Regieleki (#894) | lendario | Cataratas do Trovão | 70 | câmara do trovão atrás da cortina |
| Regidrago (#895) | lendario | Cordilheira do Poente | 70 | câmara do dragão |
| Glastrier (#896) | lendario | Campos de Gelo do Sul | 75 |  |
| Spectrier (#897) | lendario | Deserto do Silêncio | 75 | de noite |
| Calyrex (#898) | lendario | Vila Altiplana | 75 | missão O rei das cenouras |
| Enamorus (#905) | errante | Pampa das Coxilhas | 70 | na primavera do jogo |
| Wo-Chien (#1001) | lendario | Pantanal do Poente | 70 | santuário selado por 8 estacas |
| Chien-Pao (#1002) | lendario | Campos de Gelo do Sul | 70 | santuário selado por 8 estacas |
| Ting-Lu (#1003) | lendario | Altiplano do Condor | 70 | santuário selado por 8 estacas |
| Chi-Yu (#1004) | lendario | Vulcão Sentinela | 70 | santuário selado por 8 estacas |
| Koraidon (#1007) | lendario | Cratera do Tempo — Fundo (Passado e Futuro) | 75 |  |
| Miraidon (#1008) | lendario | Cratera do Tempo — Fundo (Passado e Futuro) | 75 |  |
| Okidogi (#1014) | errante | Mata das Araucárias | 70 | os Três Leais; um de cada vez |
| Munkidori (#1015) | errante | Mata das Araucárias | 70 |  |
| Fezandipiti (#1016) | errante | Mata das Araucárias | 70 |  |
| Ogerpon (#1017) | lendario | Pantanal do Poente | 70 | Festa das Máscaras na Estância Ventania |
| Terapagos (#1024) | lendario | Cratera do Tempo — Fundo (Passado e Futuro) | 80 | no cristal do fundo |
| Pecharunt (#1025) | evento | Porto Rubro | 70 | missão O doce envenenado |
| Articuno (articuno-galar) | errante | Altiplano do Condor | 72 | aparece voando; segue-se até ele pousar |
| Zapdos (zapdos-galar) | errante | Pampa das Coxilhas | 72 | corre pelas coxilhas |
| Moltres (moltres-galar) | errante | Deserto do Silêncio | 72 | só de noite |
<!-- /gerado:lendarios -->

---

## 13. Mega e Dynamax (gerado)

As Mega Pedras são lascas da Pedra do Alvorecer que caíram longe do Relógio. As Tocas de Luz são buracos por onde vaza
a luz do Coração: reides de até 4 jogadores, cooperativos no online (quem estiver no mesmo setor entra junto).

A mecânica está pronta: Mega, Primitiva, Dynamax e Gigantamax em `src/combat/poder.js` (regras puras em
`src/mechanics/poder.js`), as Tocas de Luz em `src/world/tocas.js` e o reide online em `src/net/reide.js`.
**Para colocar uma toca**, acrescente uma linha em `src/data/tocas.js` (chave = id do mapa) ou um campo `"tocas": [...]`
no JSON da região, com `id` (o da tabela abaixo), `x`, `y` (bloco do centro, chão livre num raio de 2 blocos e arena
de ~7 blocos em volta), `gmax` (ids da PokéAPI) e, se preciso, `noite`, `requer`, `nivel`, `chanceGmax`. O cabeçalho
do arquivo explica cada campo. Uma área, um interior ou um ginásio com `"dynamax": true` também liberam o Dynamax ali;
um ginásio do roteiro liga com `dynamax: true` na batalha (como a da Celeste). Treinador que segura Mega Pedra
(`[dex, nível, golpes, { item: 'garchompite' }]` no roteiro) Mega Evolui sozinho no momento certo.

<!-- gerado:mega -->
Pulseira Mega: Cidade Escarpa, missão A Pedra-Chave (Dona Pedrina lapida três lascas de prisma: Mina Abandonada, Ruínas dos Vigias, Caverna de Gelo Cristalino).

| Forma Mega | Pedra | Onde | Como |
|---|---|---|---|
| venusaur-mega | venusaurite | Templo das Raízes — Câmara da Semente | missão O mapa do templo (Dra. Ybi) |
| charizard-mega-x | charizarditeX | Templo da Chama — Rio de Lava | tesouro |
| charizard-mega-y | charizarditeY | Vila Termas | missão O vulcão acordado |
| blastoise-mega | blastoisinite | Estação Austral | missão O canto das Lapras |
| beedrill-mega | beedrillite | Rota 2, Trilha das Paineiras | tesouro escondido |
| pidgeot-mega | pidgeotite | Rota 1, Campos de Lúmen | tesouro escondido no ipê mais alto |
| raichu-mega-x | raichuniteX | Farol Coral (Cidade Coral) (lanterna) | tesouro escondido da dungeon do tipo |
| raichu-mega-y | raichuniteY | Farol Coral (Cidade Coral) (lanterna) | tesouro escondido da dungeon do tipo |
| clefable-mega | clefablite | Ilha Miragem | tesouro |
| alakazam-mega | alakazite | Observatório Boreal (Vila Geada) | Dra. Hanna |
| victreebel-mega | victreebelite | Templo das Raízes — Átrio | tesouro escondido da dungeon do tipo |
| slowbro-mega | slowbronite | Porto Espelho | Tia Jandira (o Doutor tem uma) |
| gengar-mega | gengarite | Cemitério das Velas | tesouro escondido (noite) |
| kangaskhan-mega | kangaskhanite | Campos ao norte da Rota 1 | tesouro no ninho de uma Kangaskhan |
| starmie-mega | starminite | Templo das Marés — Nave Alta | tesouro escondido da dungeon do tipo |
| pinsir-mega | pinsirite | Bosque Sussurrante | revanche da Lia |
| gyarados-mega | gyaradosite | Templo das Marés — Nave Alta | tesouro |
| aerodactyl-mega | aerodactylite | Ruínas de Pedra Pintada — Pátio das Pinturas | tesouro |
| dragonite-mega | dragoninite | Liga Alvorada (Cidadela do Zênite) | Iberê, na revanche |
| mewtwo-mega-x | mewtwoniteX | Gruta das Cataratas — Abismo do Silêncio | tesouro |
| mewtwo-mega-y | mewtwoniteY | Cidadela do Poente | 49 vitórias na Torre de Batalha |
| meganium-mega | meganiumite | Templo das Raízes — Átrio | tesouro escondido da dungeon do tipo |
| feraligatr-mega | feraligite | Templo das Marés — Nave Alta | tesouro escondido da dungeon do tipo |
| ampharos-mega | ampharosite | Farol Coral (Cidade Coral) (lanterna) | tesouro |
| steelix-mega | steelixite | Cidade Aurora | missão O Steelix de cristal |
| scizor-mega | scizorite | Megaloja Aurora (Cidade Aurora) | loja do 4º andar (₽50000) |
| heracross-mega | heracronite | Vila Sussurro | revanche da Lia |
| skarmory-mega | skarmorite | Mina Aurora — Nível 4 | tesouro escondido da dungeon do tipo |
| houndoom-mega | houndoominite | Templo da Chama — Portal de Basalto | tesouro |
| tyranitar-mega | tyranitarite | Ruínas de Pedra Pintada — Galeria da Areia | tesouro |
| sceptile-mega | sceptilite | Templo das Raízes — Galerias Inundadas | tesouro |
| blaziken-mega | blazikenite | Cidade Campina | missão Os pintinhos que pegam fogo (depois de evoluir Torchic duas vezes) |
| swampert-mega | swampertite | Pantanal do Poente | tesouro |
| gardevoir-mega | gardevoirite | Ruínas dos Vigias — Sala dos Murais | tesouro |
| sableye-mega | sablenite | Mina Abandonada (Nível 5) | tesouro |
| mawile-mega | mawilite | Caminho do Zênite — Caverna | tesouro |
| aggron-mega | aggronite | Mina Aurora — Nível 4 | tesouro |
| medicham-mega | medichamite | Forte Rochedo | revanche do Brás |
| manectric-mega | manectite | Cidade Coral | revanche do Jonas |
| sharpedo-mega | sharpedonite | Templo das Marés — Nave Afundada | tesouro |
| camerupt-mega | cameruptite | Vila Termas | missão A montanha que anda |
| altaria-mega | altarianite | Torre do Vento (Mirante dos Ventos) | revanche da Celeste |
| banette-mega | banettite | Vila Lamparina | revanche da Zélia |
| chimecho-mega | chimechite | Ruínas dos Vigias — Sala dos Murais | tesouro escondido da dungeon do tipo |
| absol-mega | absolite | Vila Lamparina | missão Sina e Véspera |
| absol-mega-z | absoliteZ | Ilha do Véu | tesouro escondido da dungeon do tipo |
| glalie-mega | glalitite | Vila Geada | missão A luz que dança |
| salamence-mega | salamencite | Chapada Vermelha | tesouro |
| metagross-mega | metagrossite | Cidade Aurora | missão O cofre da cobertura |
| latias-mega | latiasite | Ilhas Gêmeas | tesouro |
| latios-mega | latiosite | Ilhas Gêmeas | tesouro |
| rayquaza-mega | — | (não precisa de pedra: Rayquaza com Ascensão do Dragão) | golpe |
| staraptor-mega | staraptite | Megaloja Aurora (Cidade Aurora) | tesouro escondido da dungeon do tipo |
| lopunny-mega | lopunnite | Cidade Campina | revanche do Tomé |
| garchomp-mega | garchompite | Cidade Buriti | missão Campeão da areia |
| garchomp-mega-z | garchompiteZ | Caminho do Zênite — Caverna | tesouro escondido da dungeon do tipo |
| lucario-mega | lucarionite | Cidade Escarpa | junto com a Pulseira Mega |
| lucario-mega-z | lucarioniteZ | Forte Rochedo | tesouro escondido da dungeon do tipo |
| abomasnow-mega | abomasite | Caverna de Gelo Cristalino — Saguão | tesouro |
| gallade-mega | galladite | Ruínas dos Vigias — Sala dos Murais | tesouro |
| froslass-mega | froslassite | Caverna de Gelo Cristalino — Coração Azul | tesouro |
| heatran-mega | heatranite | Templo da Chama — Forja Antiga | tesouro |
| darkrai-mega | darkranite | Vila Lamparina | capela, na lua nova |
| emboar-mega | emboarite | Templo da Chama — Portal de Basalto | tesouro escondido da dungeon do tipo |
| excadrill-mega | excadrite | Ruínas de Pedra Pintada — Galeria da Areia | tesouro escondido da dungeon do tipo |
| audino-mega | audinite | Vila Alvorada | a Mãe dá (a Dona Fofa usa a dela) |
| scolipede-mega | scolipite | Templo das Raízes — Galerias Inundadas | tesouro escondido da dungeon do tipo |
| scrafty-mega | scraftinite | Ilha do Véu | tesouro escondido da dungeon do tipo |
| eelektross-mega | eelektrossite | Farol Coral (Cidade Coral) (lanterna) | tesouro escondido da dungeon do tipo |
| chandelure-mega | chandelurite | Cemitério das Velas | tesouro escondido da dungeon do tipo |
| golurk-mega | golurkite | Ruínas de Pedra Pintada — Galeria da Areia | tesouro escondido da dungeon do tipo |
| chesnaught-mega | chesnaughtite | Templo das Raízes — Átrio | tesouro escondido da dungeon do tipo |
| delphox-mega | delphoxite | Templo da Chama — Portal de Basalto | tesouro escondido da dungeon do tipo |
| greninja-mega | greninjite | Templo das Marés — Nave Alta | tesouro escondido da dungeon do tipo |
| pyroar-mega | pyroarite | Templo da Chama — Portal de Basalto | tesouro escondido da dungeon do tipo |
| floette-mega | floettite | Mata das Araucárias | tesouro escondido da dungeon do tipo |
| meowstic-male-mega | meowsticite | Ruínas dos Vigias — Sala dos Murais | tesouro escondido da dungeon do tipo |
| meowstic-female-mega | meowsticite | Ruínas dos Vigias — Sala dos Murais | tesouro escondido da dungeon do tipo |
| malamar-mega | malamarite | Ilha do Véu | tesouro escondido da dungeon do tipo |
| barbaracle-mega | barbaracite | Mina Abandonada (Nível 5) | tesouro escondido da dungeon do tipo |
| dragalge-mega | dragalgite | Rota 5, Brejo das Lamparinas | tesouro escondido da dungeon do tipo |
| hawlucha-mega | hawluchanite | Forte Rochedo | tesouro escondido da dungeon do tipo |
| zygarde-mega | zygardite | Fundo do Cânion | tesouro (com Zygarde capturado) |
| diancie-mega | diancite | Fenda Prismática — Salão dos Espelhos | tesouro |
| crabominable-mega | crabominite | Forte Rochedo | tesouro escondido da dungeon do tipo |
| golisopod-mega | golisopite | Templo das Raízes — Galerias Inundadas | tesouro escondido da dungeon do tipo |
| drampa-mega | drampanite | Megaloja Aurora (Cidade Aurora) | tesouro escondido da dungeon do tipo |
| magearna-mega | magearnite | Oficina do Vô Ernesto (Cidade Aurora) | Vô Ernesto |
| magearna-original-mega | magearnite | Oficina do Vô Ernesto (Cidade Aurora) | Vô Ernesto |
| zeraora-mega | zeraorite | Rota 6, Ferrovia da Aurora | torre de transmissão |
| falinks-mega | falinksite | Forte Rochedo | tesouro escondido da dungeon do tipo |
| scovillain-mega | scovillainite | Templo das Raízes — Átrio | tesouro escondido da dungeon do tipo |
| glimmora-mega | glimmoranite | Mina Abandonada (Nível 5) | tesouro escondido da dungeon do tipo |
| tatsugiri-curly-mega | tatsugirinite | Caminho do Zênite — Caverna | tesouro escondido da dungeon do tipo |
| tatsugiri-droopy-mega | tatsugirinite | Caminho do Zênite — Caverna | tesouro escondido da dungeon do tipo |
| tatsugiri-stretchy-mega | tatsugirinite | Caminho do Zênite — Caverna | tesouro escondido da dungeon do tipo |
| baxcalibur-mega | baxcalibrite | Caminho do Zênite — Caverna | tesouro escondido da dungeon do tipo |

Bracelete Dynamax: Laboratório do Prof. Jatobá (Vila Alvorada), a Bia monta com as leituras do Prisma; dá a quem levar a ela a foto de uma Toca de Luz acesa (qualquer uma). Tocas comuns sorteiam da tabela de encontros da área (nível da área + 5). Tocas Gigantamax têm a forma fixa listada; as raras só acendem de noite ou com clima.

| Toca de Luz | Área | Gigantamax | Nota |
|---|---|---|---|
| toca_campos_norte | Campos ao norte da Rota 1 | snorlax-gmax, eevee-gmax, alcremie-gmax |  |
| toca_rota1 | Rota 1, Campos de Lúmen | pikachu-gmax |  |
| toca_bosque | Bosque Sussurrante | butterfree-gmax, orbeetle-gmax |  |
| toca_mata | Mata dos Jequitibás | venusaur-gmax, flapple-gmax, appletun-gmax |  |
| toca_lago | Lago Espelho | drednaw-gmax |  |
| toca_rota6 | Rota 6, Ferrovia da Aurora | toxtricity-amped-gmax, toxtricity-low-key-gmax, garbodor-gmax |  |
| toca_cemiterio | Cemitério das Velas | gengar-gmax | só de noite |
| toca_rota7 | Rota 7, Ravina do Rochedo | machamp-gmax |  |
| toca_forte | Forte Rochedo | urshifu-single-strike-gmax, urshifu-rapid-strike-gmax | só depois da missão As duas rodas |
| toca_rota9 | Rota 9, Estepe dos Ventos | corviknight-gmax |  |
| toca_mina | Mina Abandonada (Nível 5) | melmetal-gmax |  |
| toca_ilha_veu | Ilha do Véu | grimmsnarl-gmax |  |
| toca_jandaia | Ilha Jandaia | meowth-gmax |  |
| toca_selva | Selva Grande | rillaboom-gmax |  |
| toca_recife | Recife Grande | blastoise-gmax |  |
| toca_mangue | Mangue do Siri | kingler-gmax |  |
| toca_dunas | Dunas Douradas | sandaconda-gmax |  |
| toca_chapada | Chapada Vermelha | duraludon-gmax |  |
| toca_canion | Cânion do Rio Seco | copperajah-gmax |  |
| toca_austrais | Ilhas Austrais | lapras-gmax |  |
| toca_cinza | Campos de Cinza | coalossal-gmax, centiskorch-gmax |  |
| toca_vulcao | Vulcão Tição | charizard-gmax |  |
| toca_pampa | Pampa das Coxilhas | cinderace-gmax |  |
| toca_cataratas | Cataratas do Trovão | inteleon-gmax |  |
| toca_araucarias | Mata das Araucárias | hatterene-gmax |  |
| salao_tocas | Cidadela do Poente | (sorteio) | sorteia qualquer Gigantamax já visto, nível 70; ponto de encontro dos reides online |
<!-- /gerado:mega -->

---

## 14. Distribuição das espécies

### Números (gerado)

<!-- gerado:contagem -->
- Espécies na lista nacional: **1025**; selvagens em pelo menos uma área: **637**; exclusivas de uma área só: **342**; obtidas de outro jeito (evolução, presente, troca, fóssil, ovo, lendário, evento): **388**; sem lugar: **0**.
- Formas regionais: **58** (sem lugar: 0); Mega: **97** pedras; Gigantamax: **34** formas em **26** tocas.
- Áreas com selvagens: **126**; distâncias do núcleo: medidas no mapa atual.
<!-- /gerado:contagem -->

### Regras de raridade

- Iniciais: os três do laboratório; os outros 24 aparecem cada um num lugar só, muito raros (Chikorita na Lagoa
  Dourada, Totodile no Mangue do Siri, Treecko e Grookey na Selva Grande, Fennekin nas Dunas, Popplio nas Ilhas Gêmeas,
  Piplup nas Ilhas Austrais, Sprigatito e Scorbunny no Pampa…) ou são presente de missão (Torchic, Tepig); todos também
  saem no Clube dos Iniciais de Porto Rubro. Nunca aparecem já no último estágio.
- Pseudolendários: raros e num lugar específico (Dratini na Cachoeira do Véu Verde, Larvitar no Planalto, Bagon na
  Chapada Vermelha, Gible na Escalada do Paredão, Deino nas Ruínas de Pedra Pintada, Goomy na Selva, Jangmo-o no
  Altiplano, Dreepy no Templo das Marés, Frigibax na Caverna de Gelo, Axew no Cânion); Beldum é presente.
- Lendários e míticos: um de cada, fixos; nenhum em tabela de selvagem (o validador recusa).
- Exclusivas: muitas espécies vivem numa área só (lista abaixo). Formas regionais combinam com o lugar: Alola nas
  Jandaias e no gelo, Galar espalhadas pelo frio e pelo litoral, Hisui na neve alta e no Ocaso, Paldea no Pampa e no
  Pantanal; algumas só por troca com moradores.
- Evoluções por nível entram sozinhas onde a faixa da área alcança o nível de evoluir, com peso menor; as de pedra,
  troca ou amizade só nas áreas de nível 40+ (troca, 55+), com peso bem menor.

### Exclusivas por região (gerado)

<!-- gerado:exclusivas -->
- **Núcleo de Alvorada** (182): Caterpie (#10), Butterfree (#12), Beedrill (#15), Pidgeotto (#17), Rattata (#19), Fearow (#22), Pikachu (#25), Nidoran♀ (#29), Nidoran♂ (#32), Jigglypuff (#39), Oddish (#43), Meowth (#52), Mankey (#56), Growlithe (#58), Abra (#63), Bellsprout (#69), Ponyta (#77), Magnemite (#81), Magneton (#82), Grimer (#88), Drowzee (#96), Voltorb (#100), Electrode (#101), Lickitung (#108), Koffing (#109), Kangaskhan (#115), Horsea (#116), Starmie (#121), Electabuzz (#125), Pinsir (#127), Eevee (#133), Snorlax (#143), Chikorita (#152), Bayleef (#153), Ledian (#166), Ariados (#168), Flaaffy (#180), Azumarill (#184), Hoppip (#187), Girafarig (#203), Pineco (#204), Dunsparce (#206), Snubbull (#209), Heracross (#214), Ursaring (#217), Poochyena (#261), Mightyena (#262), Wurmple (#265), Silcoon (#266), Beautifly (#267), Cascoon (#268), Dustox (#269), Taillow (#276), Ralts (#280), Breloom (#286), Slakoth (#287), Vigoroth (#288), Whismur (#293), Loudred (#294), Makuhita (#296), Skitty (#300), Mawile (#303), Meditite (#307), Electrike (#309), Manectric (#310), Plusle (#311), Minun (#312), Volbeat (#313), Illumise (#314), Gulpin (#316), Spoink (#325), Grumpig (#326), Spinda (#327), Castform (#351), Shuppet (#353), Chimecho (#358), Absol (#359), Turtwig (#387), Grotle (#388), Staravia (#397), Bidoof (#399), Kricketot (#401), Kricketune (#402), Luxio (#404), Budew (#406), Wormadam (#413), Mothim (#414), Pachirisu (#417), Floatzel (#419), Cherubi (#420), Drifloon (#425), Buneary (#427), Glameow (#431), Stunky (#434), Spiritomb (#442), Lucario (#448), Lillipup (#506), Liepard (#510), Munna (#517), Pidove (#519), Blitzle (#522), Excadrill (#530), Audino (#531), Timburr (#532), Throh (#538), Sawk (#539), Swadloon (#541), Venipede (#543), Petilil (#548), Scraggy (#559), Trubbish (#568), Garbodor (#569), Zoroark (#571), Minccino (#572), Emolga (#587), Amoonguss (#591), Joltik (#595), Ferroseed (#597), Klink (#599), Klang (#600), Tynamo (#602), Litwick (#607), Stunfisk (#618), Mienfoo (#619), Chespin (#650), Froakie (#656), Bunnelby (#659), Pancham (#674), Furfrou (#676), Espurr (#677), Honedge (#679), Doublade (#680), Aegislash (#681), Inkay (#686), Skrelp (#690), Helioptile (#694), Dedenne (#702), Klefki (#707), Rowlet (#722), Dartrix (#723), Mudsdale (#750), Shiinotic (#756), Stufful (#759), Comfey (#764), Togedemaru (#777), Mimikyu (#778), Dhelmise (#781), Rookidee (#821), Blipbug (#824), Dottler (#825), Nickit (#827), Thievul (#828), Gossifleur (#829), Yamper (#835), Boltund (#836), Carkol (#838), Applin (#840), Cramorant (#845), Clobbopus (#852), Sinistea (#854), Impidimp (#859), Falinks (#870), Stonjourner (#874), Morpeko (#877), Cufant (#878), Copperajah (#879), Lechonk (#915), Tarountula (#917), Spidops (#918), Nymble (#919), Pawmi (#921), Pawmo (#922), Tandemaus (#924), Fidough (#926), Tadbulb (#938), Wattrel (#940), Shroodle (#944), Greavard (#971), Gimmighoul (#999), Poltchageist (#1012), Zigzagoon (zigzagoon-galar), Linoone (linoone-galar).
- **Cordilheira Geada** (8): Cloyster (#91), Drampa (#780), Sobble (#816), Drizzile (#817), Mr. Rime (#866), Vulpix (vulpix-alola), Ninetales (ninetales-alola), Mr. Mime (mr-mime-galar).
- **Sertão do Levante** (55): Ekans (#23), Arbok (#24), Kingler (#99), Cyndaquil (#155), Quilava (#156), Totodile (#158), Croconaw (#159), Phanpy (#231), Donphan (#232), Cacturne (#332), Zangoose (#335), Seviper (#336), Bagon (#371), Shelgon (#372), Chimchar (#390), Monferno (#391), Drapion (#452), Oshawott (#501), Dewott (#502), Pansage (#511), Simisage (#512), Pansear (#513), Panpour (#515), Simipour (#516), Darumaka (#554), Maractus (#556), Gothita (#574), Gothorita (#575), Gothitelle (#576), Solosis (#577), Duosion (#578), Reuniclus (#579), Karrablast (#588), Shelmet (#616), Zweilous (#634), Fennekin (#653), Braixen (#654), Litleo (#667), Drednaw (#834), Runerigus (#867), Duraludon (#884), Maschiff (#942), Mabosstiff (#943), Bramblin (#946), Klawf (#950), Capsakid (#951), Rellor (#953), Rabsca (#954), Tinkatink (#957), Tinkatuff (#958), Tinkaton (#959), Bombirdier (#962), Varoom (#965), Archaludon (#1018), Yamask (yamask-galar).
- **Arquipélago das Jandaias** (32): Chansey (#113), Tangela (#114), Dratini (#147), Dragonair (#148), Yanma (#193), Treecko (#252), Grovyle (#253), Kecleon (#352), Chatot (#441), Snivy (#495), Servine (#496), Popplio (#728), Brionne (#729), Trumbeak (#732), Toucannon (#733), Gumshoos (#735), Grubbin (#736), Charjabug (#737), Ribombee (#743), Lurantis (#754), Oranguru (#765), Passimian (#766), Komala (#775), Grookey (#810), Thwackey (#811), Grimer (grimer-alola), Geodude (geodude-alola), Graveler (graveler-alola), Rattata (rattata-alola), Raticate (raticate-alola), Meowth (meowth-alola), Persian (persian-alola).
- **Mar do Sul e Ilhas Austrais** (7): Piplup (#393), Prinplup (#394), Cursola (#864), Pincurchin (#871), Drakloak (#886), Veluza (#976), Tatsugiri (#978).
- **Arquipélago das Brasas** (10): Slowbro (#80), Crustle (#558), Litten (#725), Torracat (#726), Sizzlipede (#850), Centiskorch (#851), Fuecoco (#909), Crocalor (#910), Slowpoke (slowpoke-galar), Slowbro (slowbro-galar).
- **Ocaso Leste: Pampa e Pantanal** (43): Pidgeot (#18), Politoed (#186), Wobbuffet (#202), Mudkip (#258), Toxicroak (#454), Gigalith (#526), Seismitoad (#537), Swanna (#581), Bouffalant (#626), Florges (#671), Spritzee (#682), Aromatisse (#683), Swirlix (#684), Slurpuff (#685), Clawitzer (#693), Golisopod (#768), Scorbunny (#813), Hatenna (#856), Hatterene (#858), Perrserker (#863), Sirfetch’d (#865), Milcery (#868), Alcremie (#869), Indeedee (#876), Basculegion (#902), Overqwil (#904), Sprigatito (#906), Quaxly (#912), Smoliv (#928), Arboliva (#930), Squawkabilly (#931), Toedscruel (#949), Wugtrio (#961), Tauros (tauros-paldea-combat-breed), Tauros (tauros-paldea-blaze-breed), Tauros (tauros-paldea-aqua-breed), Farfetch’d (farfetchd-galar), Meowth (meowth-galar), Qwilfish (qwilfish-hisui), Ponyta (ponyta-galar), Rapidash (rapidash-galar), Voltorb (voltorb-hisui), Electrode (electrode-hisui).
- **Ocaso Oeste: Cordilheira e Desertos** (31): Ninetales (#38), Golem (#76), Steelix (#208), Dusclops (#356), Gliscor (#472), Dusknoir (#477), Watchog (#505), Bisharp (#625), Noivern (#715), Jangmo-o (#782), Great Tusk (#984), Scream Tail (#985), Brute Bonnet (#986), Flutter Mane (#987), Slither Wing (#988), Sandy Shocks (#989), Iron Treads (#990), Iron Bundle (#991), Iron Hands (#992), Iron Jugulis (#993), Iron Moth (#994), Iron Thorns (#995), Roaring Moon (#1005), Iron Valiant (#1006), Walking Wake (#1009), Iron Leaves (#1010), Gouging Fire (#1020), Raging Bolt (#1021), Iron Boulder (#1022), Iron Crown (#1023), Braviary (braviary-hisui).
<!-- /gerado:exclusivas -->

### Formato de `src/data/habitats.js`

- `AREAS_ENCONTROS[id] = { nivel, custo, bioma, alfa?, dia, noite }`; `dia` e `noite` no formato de
  `areas[].encounters`: `[[dex, nív. mín., nív. máx., peso], …]`, com um quinto campo opcional `{ forma: '<id da
  forma>' }` para as formas regionais (`'vulpix-alola'`, `'tauros-paldea-blaze-breed'`). `alfa = [dex, nível, {forma}?,
  nota]`.
- `BIOMAS_PADRAO` e `BIOMAS_NOITE`: a tabela de cada bioma (para áreas sem tabela própria), no nível do lugar mais fácil
  daquele bioma. A cópia pequena `src/data/habitats-biomas.js` é a que o jogo carrega.
- `ONDE[dex]`: como se obtém cada uma das 1025 espécies (selvagem, com a lista de áreas e se é exclusiva; evolução;
  presente; troca; fóssil; ovo; lendário; evento; errante; ultrafera; clube; inicial).
- `FORMAS`, `MEGA_PEDRAS`, `GIGANTAMAX`, `ESCADA_GINASIOS` e a função `encontrosDaArea(id, noite)`.

### Ligado ao jogo

Já ligado (sem mexer no mapa): `src/main.js` usa `BIOMAS_PADRAO` e `BIOMAS_NOITE` quando o bioma de um lugar não
existe em `BIOME_ENCOUNTERS` de `src/data/species.js`. Os cinco biomas atuais não mudaram; os novos passam a ter
selvagens assim que uma área do mapa usar `biome: 'neve'`, `'sertao'` etc.

Para ligar o resto:

1. **Tabelas por área**: em `#encounterTable` de `src/main.js`, quando a área não tiver `encounters`, usar
   `encontrosDaArea(zone.id, noite)` de `habitats.js` (importação dinâmica, para não carregar os 180 KB na abertura).
   Isso também aplica os níveis novos às áreas do mapa sem tabela própria. Para as que têm, ou o agente do mapa troca os
   níveis (seção 8), ou o motor passa a preferir `habitats.js` quando ele existir para aquele id.
2. **Formas regionais**: `new Mon(dex, nível, { forma })` precisa da forma (tipos, sprite e golpes); é do ramo
   `especies`, que está importando as formas.
3. **Pokédex do menu** (`src/ui/menu.js`, `habitat()`): trocar a varredura das tabelas por `ONDE[dex]`, que já diz
   todas as áreas, a exclusividade e os jeitos que não são selvagens; e dar nome em português aos biomas novos.
4. **Rodar de novo quando a lista crescer**: `python3 tools/mundo/extrair-especies.py` (relê os CSVs da PokéAPI) e
   `node tools/gerar-mundo.mjs`. Espécie nova sem lugar aparece no relatório como aviso "sem lugar"; basta pôr a ficha
   dela numa área de `tools/mundo/lugares.mjs` ou em `tools/mundo/especiais.mjs`.

---

## 15. Como a história se encaixa (sem ordem)

- A trama principal (Aurora, Crepúsculo, Relógio, Necrozma) continua no núcleo e avança pelo número de insígnias (ramo
  `mundo-aberto`). Nenhuma região nova é necessária para ela.
- As regiões novas enriquecem a história sem contradizê-la: o Sertão mostra para onde a Aurora queria expandir a mina
  (a Estrada do Sertão leva os caminhões) e é a casa do Seu Brasa; a Cratera da Estrela e as Ruínas de Pedra Pintada
  têm pinturas do Solgaleo carregando o sol; o Templo das Marés é um farol dos Vigias; as lascas de prisma das Mega
  Pedras e a luz das Tocas de Luz são a mesma luz que vaza do Coração; o Ocaso é o povo-irmão dos Vigias, que guardava o
  pôr do sol (ecoando Véspera e Dalva), e é para lá que o pai do jogador navega.
- O pai, o Capitão Ivo, comanda o cargueiro do Ocaso. Antes de ele voltar (o roteiro decide quando), um mestre de navio
  faz a viagem; depois, ele mesmo leva o jogador e conta uma história do mar por viagem.

---

## 16. Em aberto

- **Escada dos ginásios**: a ordem que sai da distância real é Jonas, Marina, Tomé, Zélia, Lia, Brás, Celeste, Graça.
  Hoje o Tomé está implementado como o primeiro (níveis 9 a 12). O ramo `mundo-aberto` decide se ajusta as equipes à
  escada ou se a escada aceita o Tomé como o mais fácil (a diferença é pequena: a Costa Coral fica a 90 blocos da casa,
  Campina a 170).
- **Forte Rochedo** está cercado de rocha no esboço e ninguém chega nele: usei custo 320 (perto da Rota 7). O agente
  do mapa precisa abrir a entrada.
- **Ovos**: a Creche dá ovos, mas o jogo ainda não choca ovos; até lá, o presente pode ser o bebê no nível 1.
- **Evolução por lugar** (formas de Hisui e Alola que evoluem no Ocaso ou nas Jandaias) e **evoluções sem nível**
  (Pó Estelar do Meltan, troca) dependem das mecânicas.
- **Montarias por espécie**: o custo de cada exigência supõe que os Pokémon capazes existem cedo; se o ramo de montarias
  só aceitar espécies raras, vale subir os custos em `tools/mundo/plano.mjs` e rodar de novo.
- **Sem sprite hoje**: o jogo só mostra selvagens com sprite em `assets/pmd/index.json`; as tabelas já trazem todas as
  1025 espécies e as que faltam ficam de fora sozinhas até o sprite chegar.
- **Rotom do farol, trem animado, Megaloja de 5 andares, Gruta da Maré, Ilhas Coral e a missão do bolo da Vó Benta**
  estão neste plano (seções 3, 7, 10 e 11), mas ainda não no mapa.
- O nome de cada MT e o id de cada golpe de tutor seguem os da lista do jogo quando existirem; os que não existirem o
  ramo de missões troca por um parecido do mesmo tipo.
