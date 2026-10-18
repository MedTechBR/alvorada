# Visual 3D (HD-2D, estilo HeartGold/SoulSilver)

Refaz só a forma de desenhar. A lógica (mapa, colisão, combate, montarias, online, história) continua a mesma,
com as mesmas coordenadas em pixels de mundo (bloco de 16 px). Ativação: `?visual=3d` (o 2D segue padrão até o 3D
ficar igual ou melhor em tudo; depois o padrão vira 3D e `?visual=2d` fica de reserva).

Referência: protótipo de fã "Battle Advanced" (HD-2D, à la Octopath Traveler) e HGSS. Nada do protótipo é
copiado: a geometria é gerada por código (low-poly em blocos), as texturas são pixel art nossa (as mesmas do 2D,
assadas por `ground.js`, e padrões desenhados em canvas). Pacotes da Kenney (CC0) só da fonte oficial, com crédito
em `assets/CREDITOS.md`, se ajudarem.

## 1. Decisões

### Tecnologia
- **three.js 0.170.0** (versão fixa) via import map, de `cdn.jsdelivr.net`, como o Pixi. Só é baixado com
  `?visual=3d` (import dinâmico em `main.js`): quem joga em 2D não paga nada.
- **Pixi continua vivo.** Ele segue dono de toda a lógica de desenho que o jogo já tem (sprites dos Pokémon,
  quadros PMD, tint, piscar, giro, desmaio, montarias, NPCs, objetos, partículas, golpes). O 3D **lê** a cena do
  Pixi e a redesenha. Assim nada da lógica muda e cada recurso novo do 2D aparece no 3D de graça.

### Três camadas
1. **Cenário 3D (three.js, canvas de baixo):** relevo, chão, água, mato alto, árvores, prédios, objetos,
   interiores, céu, luz do dia e da noite, sombras, pós-processamento.
2. **Espelho (three.js):** cada filho de `game.ents` (treinador, Pokémon, NPCs, outros jogadores, montarias,
   objetos sem modelo 3D) vira um *billboard* em pé no ponto do pé, com a textura, o recorte, o tint, a
   transparência e o clarão branco do sprite do Pixi naquele quadro. A profundidade do billboard é a do pé
   (como o y-sort do 2D): quem está atrás de uma árvore some atrás dela, quem está na frente cobre. Sombras do
   Pixi (`tx.shadow`) viram manchas deitadas no chão. Decoração plana (`map.decorLayer`) vira quadrados no chão.
3. **Sobreposição (Pixi, canvas de cima, fundo transparente):**
   - **Golpes e partículas: decisão = desenhar o Pixi numa textura sobreposta**, não converter as 230 receitas.
     Cada quadro o Pixi desenha `game.world` (menos chão e entidades) numa RenderTexture que cobre o pedaço de
     mundo visível, e essa textura é posta na tela com um `PerspectiveMesh` cujos cantos são a projeção 3D do
     plano do chão. Resultado: tudo que o 2D desenha em coordenadas de mundo (golpes, choques no ar, faíscas,
     anéis, marcas no chão, bolas, clima, bichinhos) cai no lugar certo, com perspectiva, sem mudar uma linha
     das receitas. Converter tudo para 3D seria reescrever ~6 mil linhas com risco alto de bug.
     A altura desenhada no 2D (y para cima) fica ~sen(inclinação) menor; com a câmera a 55°, 82%.
   - Barras de PS, nomes, balões e "!"/"?" (Graphics/Text dentro das entidades) são desenhados em espaço de tela,
     no ponto projetado da entidade, nítidos e sem perspectiva.
   - Clarão de tela, tinta do clima e HUD HTML seguem como estão.

### Câmera estilo HGSS
- Perspectiva, campo de visão vertical de 30°, **inclinada 35° a partir da vertical (55° acima do horizonte)**,
  sem girar, sempre olhando para o norte do mapa (assim as direções dos sprites PMD continuam as mesmas).
- Segue o mesmo ponto que a câmera 2D segue (`game.cam`), com o mesmo amortecimento e o mesmo tremor.
- O zoom atual (+/−, roda, pinça, e o zoom suave do voo da montaria) muda a **distância**: a distância é
  escolhida para que um bloco no ponto focado tenha na tela o mesmo tamanho que tem no 2D com aquele zoom.
- `game.worldToScreen(x, y, h)` e `game.screenToWorld(sx, sy)` passam a usar a projeção 3D (mira com o mouse,
  marcador do objetivo, toques).

### Relevo
O mapa 2D não guarda altura; o 3D a deduz, sem mudar o mapa:
- **Penhascos** (`CLIFF`, `CLIMB`) são faces. Os blocos andáveis são agrupados em regiões ligadas (os penhascos
  e as escadas separam regiões). Cada faixa de penhasco diz que a região ao norte fica um degrau acima da região
  ao sul. Um degrau = 24 px. Se a mesma região estiver dos dois lados (penhasco solto no meio do campo), a faixa
  vira uma mureta (sobe e desce).
- A face do penhasco ocupa exatamente os blocos dele no 2D, inclinada (do pé ao topo), com a arte de rocha do
  2D. Assim a colisão continua idêntica e quem está embaixo encosta na face.
- **Escadas** (`STAIRS`) viram rampas entre os dois níveis; quem anda nelas sobe de verdade.
- **Paredes** (`WALL`, `ROCK`, gelo, lava, cânion, templo, cristal) viram blocos altos: a linha de baixo é a face,
  as de cima são o topo. Nos interiores, a parede da frente (a que fica entre a câmera e o piso) é cortada baixa:
  **efeito casa de boneca**.
- `alturaEm(x, y)` dá a altura do chão em qualquer ponto: billboards, sombras e a sobreposição usam.

### Mapa por interface
`src/world/mapa-leitura.js` é a única porta do 3D para o mapa: tamanho, bloco em (x,y), altura, objetos por
setor, áreas, interiores, setores, arte do chão de um setor e eventos de mudança (bloco trocado, objeto movido,
quebrado ou aberto). O motor do mapa pode mudar por dentro (regiões em arquivos, mapa maior, interiores gerados)
e só esse arquivo precisa acompanhar.

### Chão e setores
- Setor = 16×16 blocos (o mesmo do 2D). O chão de cada setor usa a mesma arte do 2D (`renderTiles` de
  `ground.js`, com bordas orgânicas, trilhas e areia) como textura num terreno com relevo, filtro *nearest*
  (pixel art nítida, como no Octopath).
- Cada setor vira **uma malha mesclada**: chão + faces + modelos estáticos (árvores, prédios, cercas, pedras).
  Um draw call por material por setor. Montagem fatiada ao longo dos quadros (sem engasgo) e descarte dos
  setores longe (memória do celular).
- Água: um plano por setor abaixo do chão (a arte do 2D deixa a água transparente), com ondas, cor por
  profundidade, brilho do sol e reflexo do céu (Fresnel). Lava, correnteza e maré usam a animação do 2D.
- Mato alto: tufos 3D (quadrados cruzados) instanciados, balançando com vento no shader; quem passa faz o tufo
  sacudir (lido do mesmo `sway` do 2D) e o mato cobre o pé de quem está dentro, como no 2D.

### Modelos
Gerados por código em blocos (estilo do protótipo, sem copiar): árvores com copas em cubos/esferas facetadas,
pinheiros em camadas, casas com parede, telhado de duas águas com beiral, porta, janelas e chaminé; Centro
Pokémon, loja e laboratório com telhado plano e letreiro; móveis dos interiores em blocos. Cores tiradas do
catálogo do 2D. Objeto sem modelo vira billboard do sprite 2D (nunca some nada). Objetos de mecânica (pedra de
Força, portões, baús, alavancas, quebráveis) usam o sprite do Pixi como fonte da verdade do estado.

### Luz, tempo e pós
- Sol direcional + céu hemisférico, cor e ângulo pela hora de `game.mundo.hour`; noite azulada com luzes das
  janelas e postes (manchas de luz no chão e halos aditivos, sem dezenas de luzes dinâmicas).
- Sombra: *shadow map* do sol só na qualidade alta, em volta do jogador; na baixa, sombras em mancha.
- Salas escuras: escuro de verdade com luz em volta do jogador e das tochas.
- Pós HD-2D: bloom, tilt-shift (desfoque em cima e embaixo), vinheta e gradação quente; raios de sol em
  quadrados aditivos; folhas, pétalas, pólen e poeira na luz. Tudo ligado à qualidade (`quality.js`).

### Desempenho (prioridade nº 1)
- Malha mesclada por setor, instancing do mato, texturas pequenas e *nearest*, sem MSAA.
- Billboards em lotes por textura (um draw call por folha de sprite).
- Resolução de desenho pela qualidade (`quality.js`): alta 1×DPR até 2; baixa 0,75; pós e sombra só na alta.
- Medição: Chrome sem interface, CPU 4× mais lenta, 740×360 (`tools/teste-3d/`).

## 2. Arquivos
| Arquivo | Papel |
|---|---|
| `src/world/mapa-leitura.js` | interface de leitura do mapa (o 3D só fala com o mapa por aqui) |
| `src/visual3d/index.js` | liga o 3D ao jogo: renderizador, câmera, quadro, projeção |
| `src/visual3d/relevo.js` | altura deduzida (penhascos, escadas, paredes) |
| `src/visual3d/setores.js` | malha de cada setor (chão, faces, água, modelos) |
| `src/visual3d/modelos.js` | modelos low-poly por código |
| `src/visual3d/espelho.js` | billboards a partir da cena do Pixi |
| `src/visual3d/sobreposicao.js` | Pixi por cima, projetado no chão |
| `src/visual3d/ceu.js`, `pos.js` | céu, luz do dia, pós-processamento |

## 3. Mudanças de rumo (depois do desenho inicial)
- Alvo virou o **HD-2D da referência** (vídeo "Battle Advanced"), não só "HGSS": chão pintado em 3D
  (`ambiente/terreno.js`), grama instanciada, céu com montanhas, pós HD-2D (ramo `ambiente3d`), modelos do kit
  (`kit/`, ramo `modelos3d`). A arte 2D do chão não é mais usada no 3D (o 2D nem pinta mais o chão: `L.semArte()`).
- **Câmera dinâmica** (`camera.js`): explorar 19° acima do horizonte (céu e montanhas aparecem; o mundo curvo de
  `curva.js` ajuda), batalha sobe para ~41° e afasta para enquadrar todos, interiores 56°, voo sobe, corrida afasta,
  mergulho aproxima; sobe sozinha quando uma casa ou árvore tapa o jogador; silhueta azul do jogador e do Pokémon
  atrás de paredes; `camera.cena({alvo, distancia, angulo, duracao})` para o roteiro; impulso em golpes fortes;
  opção "Movimentos de câmera (3D)" nas Opções (desligada = só seguir). O zoom do jogador e o `camK` do Dynamax
  continuam valendo.
- Interiores **casa de boneca** (`salas.js`): parede do fundo e laterais altas com papel, faixa e rodapé, frente
  baixinha, vazio preto. Salas escuras: escuro no pós com luz em volta do jogador, Pokémon de Fogo/Elétrico,
  tochas acesas e pedras que brilham (mesma regra do 2D).
- Clima (chuva, neve, areia, névoa) em espaço de tela, como no 2D.
- Motor do mapa gigante: relevo lê blocos sem forçar regiões (`L.blocoCru`), setores de região pendente esperam,
  região montada refaz relevo e setores aos poucos; troca de continente refaz tudo (`L.versao`).

## 4. Lista de conferência (captura em `tools/shots/`, `node tools/teste-3d/cenas.mjs`)
| Item | Estado | Captura |
|---|---|---|
| Vila Alvorada, exploração | ok | vila-baixa.jpg, vila-lado.jpg |
| Rota / campo, grama que abre quando passa | ok | 3d-kit-1.jpg |
| Interior casa de boneca | ok | cena-interior.jpg |
| Salas escuras com luz | ok | sala-0.jpg |
| Biomas (gelo, vulcão, deserto, ruínas, praia, selva) | ok, partículas ainda de primavera em todos | biomas-grade.jpg |
| Noite (janelas acesas, luar) | ok, telhados do kit escuros demais | cena-noite.jpg |
| Batalha: bola, golpes, telegrafia, números, PS | ok (sobreposição projetada) | cena-batalha.jpg |
| Choques no ar entre golpes | aparecem (mesma sobreposição); falta luz 3D própria | — |
| Montaria: correr | ok | cena-correr.jpg |
| Montaria: voar (sobe, sombra, câmera alta) | ok | cena-voar.jpg |
| Montaria: nadar | ok | cena-nadar.jpg |
| Montaria: escalar, mergulhar (vista do fundo) | não testado no 3D | — |
| Mega / Dynamax (escala, brilho, câmera afasta) | pelo espelho e camK; não capturado | — |
| Online (outros jogadores, nomes, balões) | pelo espelho e rótulos; não testado com 2 clientes | — |
| Pedra empurrável, portões, baús, quebráveis | kit (peças por objeto) + espelho; não capturado | — |
| Segundo continente (`?ir=ocaso:640,300`) | ok | ocaso.jpg |
| Minimapa, HUD, marcador do objetivo | ok (HTML por cima; marcador usa a projeção 3D) | todas |

## 5. Desempenho (`node tools/teste-3d/fps.mjs`)
Chrome sem interface com a GPU do Mac (M3), 740×360, DPR 2 emulado, CPU 4× mais lenta, andando pela vila:
3D ≈ 57 FPS (p50 16,8 ms, p95 24 ms, pior 60 ms), 161 draw calls, 161 mil triângulos; o 2D no mesmo teste ≈ 104
FPS. Sem lentidão, 1280×720: ≈ 214 FPS (p50 4,5 ms). A máquina de teste estava muito carregada (outros agentes),
os números variam ±15%. Gasto do 3D por quadro (4×): pós e cena 3,9 ms, sobreposição 3,8 ms, espelho 0,8 ms.

## 6. Em aberto
- Trocar o padrão para 3D (etapa 5): só quando os itens "não testado" acima estiverem conferidos.
- Partículas e paleta por bioma (neve/vulcão ainda com pétalas de primavera): ambientação.
- Telhados do kit à noite; altura das árvores com a câmera baixa: kit.
- Choque no ar: luz 3D e tremor próprios; fumaça e telhas caindo do cenário vivo (interfaces ainda não estão em main).
- `story/roteiro.js #naZona` gasta ~9% da CPU por quadro no 2D e no 3D (varre todos os pontos a cada chamada).
