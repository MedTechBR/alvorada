# Cenário vivo: destruição, regeneração e altura

Pedido do dono: "quero que os cenários também sejam explorados, destruídos, Pokémon pode conseguir subir em uma casa, uma árvore etc."

Código: `src/world/vivo.js` (estado, regras, rede, save), `src/world/altura.js` (camadas e quem sobe onde),
`src/combat/arena.js` (entrada dos golpes no cenário). Fica em `game.vivo` (criado pela arena).
Teste: `node tools/teste-online/cenario-vivo.mjs [porta]` (fotos em `tools/shots/cv-*.jpg`).

## 1. Regras de destruição

| Material | Objetos (catálogo de `objects.js`) | O que machuca | Quando acaba |
|---|---|---|---|
| árvore | tree, pine, bigtree, ipe, oran, pecha, coqueiro, araucaria… e cactos | golpe físico (Lutador, Aço, Inseto, Pedra, Dragão, Planta ×1,5), fogo (a copa pega fogo e queima aos poucos, pula para a árvore vizinha), explosão | cai com animação para o lado oposto de quem bateu → tronco no chão → toco → broto → árvore |
| rochedo | boulder, boulder2, grayrock, obsidianRock, lavaRock | físico (Lutador, Terra, Aço, Pedra, Água ×2), Água forte, explosão | quebra em pedaços, libera os blocos |
| pedra | rock, estalagmites | idem | idem |
| madeira | cercas, caixote, barril, placa, caixa de correio, poste, vaso, banco, fardo, tronco… | qualquer golpe de dano; fogo queima na hora | quebra, libera os blocos |
| arbusto | bush, roundbush, cone, folhaGigante, bambu | qualquer golpe de dano | quebra |
| prédio | tudo de `buildings.js` e o que tem porta | físico ×4, especial ×3, fogo (telhado queima uns segundos) | **nunca some**: ganha marcas (0–100 de dano) |

Prédio por nível de dano: ≥15 rachaduras · ≥45 telhas arrancadas e janelas quebradas (nas posições de luz do
catálogo) · ≥75 marcas de queimado e fumaça. Portas, lojas, interiores e história continuam funcionando.
Golpe de Planta põe cipó (desenho) em prédio e árvore por 1 h.

**Indestrutível** (só treme): objetos com `id` no mapa (história, quebra-cabeça), com `indestrutivel: true` no
catálogo ou `indestrutivel`/`fixo` no objeto do mapa, peças da masmorra (empurrar, portão, baú, alavanca, sino,
tocha), e — dentro de interiores, áreas de bioma templo/caverna/ruína/mina/cristal e até 4 blocos de um
mecanismo de masmorra — tudo o que não era quebrável antes (vasos e barris continuam quebrando). Assim nenhuma
dungeon ganha atalho.

**Sem atalho em lugar aberto também:** o toco da árvore continua ocupando os blocos dela; o tronco caído não bloqueia.

**Recompensas** (só para quem bateu, nunca para golpe de outro jogador):
- árvore chacoalhada: 18% fruta; árvore caída: fruta (a de frutas, sempre 2; as outras, metade das vezes);
- Pokémon escondido na copa: 8% por golpe forte, 25% quando cai (Aipom, Pineco, Ledyba, Caterpie, Weedle, Pidgey, Hoothoot…, nível da área) — ele cai da copa;
- mato cortado: 7% de um Pokémon da tabela da área sair do mato;
- rochedo 35% / pedra 15% solta item (Pedra Dura, Pedra Eterna, Pó Estelar, pedras de evolução, Pérola); 8% disso é fóssil (Fóssil de Hélice, de Domo, Âmbar Antigo — novos em `items.js`);
- caixote e barril: 30% Poção, Poké Bola, fruta…
- árvore caindo acerta quem estiver embaixo (1/10 dos PS).

**Água:** golpe na água faz ondas e respingos. Gelo congela a água rasa (até 2 blocos da margem, ou `SHALLOW`)
num raio de 1–2 blocos: vira `TILE.ICE` (escorrega, dá para atravessar) por 0,6 h; fogo derrete na hora.
Elétrico na água se espalha pela água ligada (até 6 blocos, 70 no máximo) e acerta os inimigos de quem atacou que
estão dentro dela (inclusive mergulhados), com 60% do dano.

**Terreno:** golpe de Terra com raio ≥ 12 (Terremoto, Magnitude, Escavar saindo) deixa fendas por 0,5 h.
Golpe de Planta faz o mato alto crescer em volta (1 h). Mato cortado (1,5 h), queimado (2 h) e terra revirada (2 h)
voltam sozinhos — antes ficavam para sempre.

## 2. Regeneração

Relógio do cenário: horas do jogo (1 h = 50 s), `vivo.horas`, salvo em `flags.cv.h`.

| | volta em |
|---|---|
| árvore | 6 h (tronco some em 0,4 h; nas últimas 25% aparece o broto crescendo) |
| copa queimada (árvore que não caiu) | 3 h |
| rochedo / pedra / madeira / arbusto | 8 h / 4 h / 3 h / 1,5 h |
| objeto arranhado e não quebrado | inteiro 0,5 h depois do último golpe |
| prédio | começa a consertar 1 h depois do último golpe: 35 de dano por hora; **à noite 140 por hora**; um pedreiro aparece martelando na frente quando dá para ver |
| gelo · mato que cresceu · fenda | 0,6 h · 1 h · 0,5 h |

Nada volta em cima de alguém (espera sair). Bloco que outra coisa mudou no meio do caminho (masmorra) não é tocado.
Salvo em `flags.cv.o[chave] = [fase, hp|dano, horas que faltam, bits (1 queimado, 2 carbonizada), lado da queda]`
para árvore, rochedo, pedra, madeira e prédio. Chave do objeto: `"<kind>@<tx>,<ty>"`.

## 3. Altura e escalada

Camadas (`altura.js`, `CAMADA`): `0 chao` · `1 rocha` (rochedos, tronco, fardo, caixote) · `2 copa` · `3 telhado`.
A altura do piso lá em cima sai do tamanho do desenho (telhado ≈ 48% da altura do sprite, copa e rocha ≈ 62%).

Cada entidade (Pokémon, treinador) tem:
- `e.z` altura atual · `e.piso` altura do chão onde está (0 ou a do objeto) · `e.pouso = { o, k, h, camada, rect, de }`
  enquanto está em cima · `e.saltando` durante o pulo de subir/descer.
- Em cima, anda só dentro da pegada do objeto; empurrando a borda (o seu Pokémon), desce.
- Desce **do lado de onde subiu** (voadores: de qualquer lado). Isso evita atravessar paredões e cercas.

Quem sobe (`perfilEscalada(mon)`):
- **voa** (tipo Voador, corpo `bird`/`flyer`, Levitação): pousa em qualquer camada (voando, C em cima do objeto);
- **escala** (montarias `escalar` de `montarias.js`, macacos, gatos, esquilos, lagartixas, aranhas, insetos ≤ 40 kg, ou Velocidade base ≥ 85 e ≤ 50 kg): rocha, copa e telhado;
- **pula** (os outros abaixo de 100 kg): só rocha;
- **pesado** (≥ 100 kg e não voa): nada.
- **Dynamax** (`e.dmaxT > 0`, src/combat/poder.js): gigante, não sobe em nada; se estava em cima, cai; e o que ele pisa
  leva golpe de explosão a cada 0,25 s (árvores caem, cercas e pedras quebram, prédio só ganha marcas).

Controles do seu Pokémon: X perto do objeto = sobe (se a espécie consegue; senão aviso "Não consegue subir aí"/"Pesado demais");
C em cima = desce; X em cima = pula ali mesmo; golpe corpo a corpo ou investida mirando fora do telhado = salta
no alvo ("Ataque do alto!", dano ×1,3).

Combate com altura (`altitude.js` `dodges`, `combat.js`):
- em cima de algo: alcance dos golpes ×1,25 (`combat.range(mv, user)`), selvagens enxergam ×1,6;
- golpe de Terra (e Terremoto/linha) de quem está no chão não atinge quem está no alto ("Não alcança!");
- corpo a corpo do chão só alcança até a altura de quem bate + 10 px (telhado fica fora);
- 22% de esquiva extra contra projétil, cone, onda, corpo a corpo e investida vindos do chão;
- **derrubar:** dano na árvore/rocha derruba quem está em cima; no prédio, golpe forte (≥ 6) ou explosão;
  golpe forte (força > 1,45, super efetivo ou crítico) em quem está no alto também derruba. Queda: giro, atordoado 0,7 s e um pouco de dano.

Selvagens: ao nascer, voadores e escaladores têm 35% de chance de já estar num poleiro perto (pássaro no telhado,
Aipom na copa); parados, às vezes sobem; ficam até ~25–55 s. Na vila aparecem pássaros pousados nos telhados que
voam quando alguém chega perto. De cima, um selvagem bravo luta à distância ou salta no alvo (emboscada).

Treinador: ~40% das casas com porta têm escada de mão encostada (sempre as mesmas, pela posição; o mapa pode pedir
mais com `"escadas": [[tx, ty], …]` usando o canto da pegada). E = "Subir a escada" / "Descer a escada".
Montado no escalador (Sneasler), E perto de rocha, árvore ou prédio = "Escalar". No telhado, as portas lá de baixo
não puxam para dentro, e a montaria não troca (desça primeiro).

## 4. Online

Autoridade: **quem causou** a mudança (o cliente cujo golpe local mexeu no objeto) manda o estado final do objeto;
não há anfitrião para o cenário. Selvagens são locais, então golpe repetido de Pokémon de outro jogador (`use`)
só mexe no desenho (`by.remote`).

- Mensagem `'cv'` `{ l: [...] }` em lote, no máximo 4 por segundo, até 40 itens:
  objeto `{ k, f: fase, n: hp|dano, r: horas que faltam, v, q: bits (1 queimado, 2 carbonizada, 4 queimando), d: ±1 }`;
  bloco `{ t: [tx, ty], a: novo, b: original, tp: tipo, r, v }` (`a === b` = voltou ao original).
- Versão `v` é um relógio de Lamport do cliente; aplica quem tem versão maior (empate: id maior).
- Só vai para a rede o que nasce de golpe (dano, queda começando, quebra, cipó, fogo); o que depende só do tempo
  (tronco→toco→broto→volta, conserto) cada cliente faz sozinho com as horas que faltam.
- Quem chega no canal recebe de cada um o que está mexido (`room 'join'` → `vivo.novoJogador(id)`).
- Fogo vindo da rede só aparece; o dano do fogo é contado por quem acendeu.
- Altura: o estado `st` leva `l.h` (z do Pokémon), `l.p` (em cima de algo) e `tz` (z do treinador). Do outro lado o
  Pokémon e o treinador aparecem na altura certa, na frente do telhado.

## 5. Interface para o 3D (ramo `visual3d`)

Tudo por `game.vivo` (só leitura, salvo os ouvintes):

```js
vivo.estado(o)        // null = intacto; senão:
// { k, material, fase: 'danificado'|'caindo'|'caido'|'toco'|'broto'|'quebrado', hp, max,
//   dano (prédio 0..100), nivel (prédio 0..3), queimando, queimado, cipo,
//   angulo (rad, queda: 0 → ±π/2), dir (±1, lado da queda em x), broto (0..1 crescendo), resta (horas), consertando }
vivo.mexidos()        // [{ o, ...estado }] só os objetos mexidos (o resto está intacto)
vivo.mexido(o)        // true se caído/toco/broto/quebrado (o desenho normal não vale)
vivo.camada(o)        // { camada: 0..3, nome: 'rocha'|'copa'|'telhado', h: px } ou null (não dá para subir)
vivo.altura(e)        // { z, piso, camada, nome, pouso: chave|null, saltando }  (e = Pokémon ou game.player)
vivo.temporarios()    // [{ tipo: 'gelo'|'mato'|'cortado'|'queimado'|'terra', tx, ty, orig, novo, resta }
                      //  ou { tipo: 'fenda', x, y, ang, len, resta }]
vivo.escadas          // [{ o, x, y, lado: 'esq'|'dir' }] escadas de mão
vivo.horas            // relógio do cenário (horas do jogo)
vivo.on(evento, fn)   // devolve a função para cancelar
```

Eventos: `'objeto'` `{ o, estado, motivo }` (motivo: dano, caindo, caiu, toco, broto, quebrou, voltou, inteiro,
conserto, queima, apagou, cipo, copa, rede, save) · `'tile'` `{ tx, ty, tipo, novo, orig, voltou? }` ·
`'pouso'` `{ e, o|null, camada, h }` · `'queda'` `{ e, h }` · `'emboscada'` `{ e, alvo }` · `'agua'`
`{ x, y, tipo: 'onda'|'gelo'|'derreteu'|'choque', … }` · `'fenda'` · `'escondido'` `{ e, o }` · `'recompensa'`.

Notas para desenhar igual ao 2D: a árvore gira em volta da base (`angulo`, para o lado `dir`); em `toco` mostra o toco;
em `broto` a árvore em escala 0,3 + 0,7 × `broto`; `quebrado` = não desenha. Entidade no alto: corpo em `z`,
sombra em `piso` (em cima do telhado), ordem de desenho como se estivesse em `y + piso`.
Os blocos trocados já estão no `map.tiles` (o 3D lê o mapa normalmente; `temporarios()` só diz o que volta e quando).

## 6. Para os outros ramos

- `ginasios`: pode usar `vivo.golpe(o, mv, P, by, { explosao })`, `vivo.subir(e, o)`, `vivo.descer(e)`, `vivo.derrubar(e)`,
  `vivo.trocarTile(tx, ty, tile, tipo, horas)` e marcar objetos da arena com `indestrutivel: true`.
- Ganchos de uma linha em código alheio: `map.resolve` (quem está em cima), `ai.think` (`vivo.pensar`),
  `story.interactions`, `mounts #input`, `life.js` (fruta), `main.js` (`e.sortY`), `pokemon.js` (`piso`), `combat.js`
  (`range(mv, user)`, `by` nas chamadas da arena, `quedaT`, `aoAtingir`).
