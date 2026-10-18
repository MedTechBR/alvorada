# Pokémon Alvorada (2D)

Jogo de fã, pessoal e não comercial. 2D com sprites, roda no navegador (computador e celular).

- Exploração e combate são a mesma coisa: não existe tela de batalha. Seu Pokémon anda com você e ataca o que você mirar, a qualquer momento.
- Motor: PixiJS 8 (WebGL 2D) via import map, ES modules sem build.
- Rodar: `python3 tools/serve.py 8700` e abrir http://127.0.0.1:8700

Controles (computador): WASD anda, Shift corre, mouse mira, 1–4 / clique esquerdo / direito = golpes,
Espaço = esquiva, Q = enviar/chamar de volta o Pokémon (R também chama), B = Poké Bola de captura (G troca o tipo de bola), Tab = trocar Pokémon, E/Enter = falar, M/Esc = menu, F3 = medidor de FPS.
Celular: analógico à esquerda; botões de golpe à direita (toque = mira automática, arrastar = mirar); A fala, ☰ abre o menu.
Controle: Start abre o menu.

## Sprites

- **Pokémon:** estilo Pokémon Mystery Dungeon, do acervo de fãs [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab)
  (CC BY-NC 4.0; créditos por espécie em `assets/pmd/CREDITOS.md`). Ficam em `assets/pmd/<dex 4 dígitos>/`.
  Baixar/atualizar: `python3 -I tools/pmd_baixar.py tudo <pasta-nova-vazia>` (lê as espécies de `src/data/species.js`,
  baixa com pausas e novas tentativas, valida e gera `frames.json`, `index.json`, `fontes.json` e `CREDITOS.md`).
  Só refazer os índices: `python3 -I tools/pmd_baixar.py processar`.
- **Ancoragem:** `frames.json` guarda, por quadro, o ponto do chão (pixel branco do `*-Shadow.png`) e os pontos do
  `*-Offsets.png` (cabeça, centro, mãos). `frameOf()` em `src/sprites/pmd.js` devolve `ax/ay` (âncora do sprite),
  `head`, `mouth`, `hand` e `center`; os golpes à distância saem de `PokeEntity.emitPoint()`.
- **Carga sob demanda:** cada espécie só é baixada quando aparece (Idle e Walk antes; o resto em segundo plano), com cache.
  `portraitOf(dex)` dá o ícone (1º quadro do Idle, de frente) para os menus.
- **Humanos:** desenhados por código em `src/sprites/charart.js` (24x32, 4 direções; andar, correr e lançar), com cores
  trocáveis. `makeCharacterFrames(look)` em `src/sprites/characters.js`; opções do criador em `LOOK_OPTIONS`;
  NPCs prontos em `PRESETS` (professor, mae, rival, treinador, treinadora, montanhista).
- **Vitrine:** `tools/vitrine.html` (todas as espécies paradas e andando; `?pts=1` mostra cabeça/boca/mão; `?modo=humanos`).

## Modo online (P2P)

Botão **Online** (ou tecla O): criar sala, entrar, jogadores, chat (T), emotes (5 a 0), trocar, desafiar e sair.
Perto de outro treinador, E (ou o botão A no celular) abre trocar/desafiar.

- **Rede:** WebRTC com [PeerJS](https://peerjs.com) 1.5.5 (ESM pelo jsDelivr, carregado só ao entrar no online) e o
  servidor público de sinalização do PeerJS. Sem conta e sem chave. Funciona num site estático (GitHub Pages).
- **Sala em estrela:** o anfitrião cria a sala (código `ALV-1234`) e define a senha; até 8 jogadores, todos ligados só
  a ele, que repassa as mensagens e carimba quem mandou. A senha nunca trafega: o anfitrião manda um desafio aleatório
  e o amigo responde `SHA-256(desafio|código|senha)`. Senha errada = recusa (com atraso, contra chute).
- **Quedas:** ping a cada 2,5 s; 11 s sem nada = caiu. Quem caiu tenta voltar 6 vezes para a mesma vaga (o anfitrião
  guarda a vaga por 30 s e mostra "caiu…"). Anfitrião saindo encerra a sala com aviso para todos.
- **Camadas** (`src/net/`): `transport.js` (contrato + PeerJS, BroadcastChannel de teste e esboço WebSocket) →
  `room.js` (sala, senha, repasse, reconexão) → `online.js` (liga ao jogo) → `remotes.js` (outros jogadores),
  `trade.js`, `duel.js` + `arbiter.js` (PvP). Interface em `src/ui/online.js`. Validação de tudo que chega em
  `validate.js` (espécie, nível 1–100, golpes, IVs, natureza, visual, textos).
- **Mundo compartilhado:** posição 10x/s (20x/s no duelo), mostrada ~130 ms no passado e interpolada. Cada um aparece
  com o visual do criador de personagem (`look`, enviado no aperto de mão e no `info`), nome, balão de fala e emotes.
  Os golpes dos outros aparecem, mas fora do duelo não acertam nada (lado `peer`).
- **Selvagens locais:** cada jogador tem os seus. Sem disputa de quem capturou ou derrotou, sem tráfego de IA e
  funciona com os amigos longe uns dos outros. O custo: você não vê o selvagem que o amigo está enfrentando.
- **Troca:** pedido → os dois escolhem (o outro valida e vê espécie, nível, tipos, HP, golpes, IVs e natureza) →
  os dois confirmam (a confirmação vale para aquele par de ofertas) → efetivação em duas fases: quem pediu manda
  `commit`, o outro confere e fica pronto (`ack`), só então os dois efetivam. Se cair no meio, quem ficou pronto
  pergunta ao voltar. Evolução por troca: `tradeHooks.onTraded(mon)` em `src/net/trade.js` (ou `game.onTraded`),
  que devolve `{ evolve: dex }`.
- **PvP:** desafio → aceitar → até 3 Pokémon cada → arena desenhada no chão onde os dois estão → contagem → combate
  em tempo real normal → resultado e revanche. Sem XP; a equipe do duelo é uma cópia curada e a sua volta como estava.
  **Autoridade:** cada um simula os próprios golpes; quando um golpe seu encosta no rival, vai um pedido ao árbitro,
  que roda no anfitrião da sala. Ele confere golpe (pela equipe validada), recarga, nº de acertos por uso e distância,
  recalcula o dano com `calcDamage` (a fórmula do jogo) e manda o resultado aos dois. Desmaio e fim também são dele.
- **Teste com duas "abas":** `tools/online-teste.html` abre dois jogos lado a lado (`?perfil=a` e `?perfil=b`
  separam o armazenamento). Marque "Rede de teste local" (ou use `?rede=local`) para testar sem internet, via
  BroadcastChannel.
- **Servidor próprio (depois):** escrever o relé descrito em `WsTransport` (transport.js) num VPS e usar
  `createTransport('ws', { url })`. O resto não muda. Num segundo passo, o árbitro (`arbiter.js`, só lógica) pode ir
  para o servidor, que vira o anfitrião permanente; aí a fórmula de dano precisa sair de `combat.js` para um arquivo
  sem PixiJS.
Interface e história (ramo `interface`):
- `src/ui/` título com contas locais e criador de personagem, HUD, diálogo clássico, menu (Pokédex, equipe, mochila, mapa, cartão, opções, salvar, PC).
- `src/net/auth.js` contas locais (hash PBKDF2) e código de transferência do save; ponto de entrada para um servidor futuro.
- `src/story/` capítulo 1 (Prof. Jatobá, Téo, treinadores, Cidade Campina, Líder Tomé). Posições por pontos nomeados: o mapa pode definir `map.spots` (ver `src/story/spots.js`).
- **Motor de roteiro** (`src/story/roteiro.js`): executa os capítulos escritos em dados (`src/story/script/capNN.js`,
  formato na seção 8 de `docs/historia-completa.md`). O capítulo 1 segue no `story.js`; quando ele termina
  (`flags.ch1Done`), o motor toca o 2 e o 3 (`JOGAVEIS` em roteiro.js). Gatilhos de lugar, zona, fala, treinador
  que avista, vitória, derrota, interrupção de batalha e flag; falas com escolhas; batalhas no mapa (`battle.js`,
  com chefe Alfa sem treinador); insígnia, MT, itens, montaria (`game.unlockMount`, ou `map.setMount` se faltar),
  hora do dia e objetivo do HUD com seta. Perdendo uma luta da história, volta ao último Centro Pokémon e a cena
  pode ser tentada de novo. Quem aparece no mapa: `src/story/elenco.js`; itens-chave: `src/story/itens.js`.
  Para jogar um capítulo novo: elenco + pontos no mapa + o id em `JOGAVEIS`.
- `src/save.js` save por conta no localStorage, automático a cada 30 s.
- PWA: `manifest.webmanifest`, `sw.js` (rede primeiro), ícones em `assets/icons` (`python3 tools/make_icons.py`).

## Mundo (ramo `mundo`)

- **Região:** `assets/maps/alvorada.json`, desenhado à mão (formato em `assets/maps/LEIAME.md`), por cima do esboço
  gerado da planta `docs/mapa-alvorada.json` (`python3 -I tools/gerar-esboco.py` → `assets/maps/esboco.json`;
  1 unidade da planta = 6 blocos). 600x480 blocos de 16 px por fora + faixa isolada de interiores.
  Prontos: Vila Alvorada, Rota 1, Cidade Campina com o ginásio (milharal-labirinto), Fazenda do Tomé, Rota 2,
  Bosque Sussurrante, Vila Sussurro, Toca do Absol, Rota 3 (Margem das Garças) e Porto Espelho (Centro, Casa do Nestor e
  o Galpão de Barcos, ginásio da Marina), com interiores. O resto está esboçado (terreno, cidades, rotas).
- **Arte:** blocos e objetos do Tuxemon (CC BY-SA 4.0, `assets/CREDITOS.md`) + prédios, árvores e móveis desenhados por
  código (`src/world/art.js`, `buildings.js`). Bordas do chão por compositor (`ground.js`).
- **Código:** `map.js` (GameMap: setores de 16x16 montados sob demanda, colisão, mato alto, `setTile`, `resolve`,
  `solidAt`), `build.js` (lê o JSON), `objects.js` (catálogo), `life.js` (`game.mundo`: dia e noite, portas, bichinhos,
  itens, frutas, placas, porteiras e fardos), `minimap.js`.
- **Para a história:** `map.spots.<nome>` = `{x, y, dir, r?, map}` em pixels; `map` é `'mundo'` ou o id do interior
  (ex.: `nurse` está em `centro_campina`). Portas criam `porta_<id>` e `dentro_<id>`. `game.mundo.warpTo(bx, by, dir)`
  teleporta com fade; `fadeOut/fadeIn`; `isNight()`, `setHour(h)`, `hour`; `saveState()/loadState()` (hora, itens
  pegos, frutas colhidas, setores visitados).
- **Montarias:** `map.setMount('correr' | 'nadar' | 'escalar', true)` libera lama, água e paredão com trepadeira.
  Toras da Mata dos Jequitibás têm `jump: true` (para a montaria Correr saltar).

## Montarias do treinador (`src/world/mounts.js`)

Como em Legends Arceus, na vista de cima. **X** (no celular, o botão de sela ao lado dos golpes; no controle, Select/Back)
chama ou dispensa a montaria conforme o terreno; **segurar X** levanta voo. No modo Pokémon o X continua sendo o pulo do combate.

| Tipo | Pokémon | Como chamar | O que faz |
|---|---|---|---|
| `correr` | Mudbray (749) | X em terra (padrão) | ~1,8x mais rápido, atravessa lama (Rota 2), salta toras (`jump: true`), tocos e cercas baixas (sozinho ou com Espaço) |
| `nadar` | Lapras (131) | X de frente para a água | anda na água; X de frente para a margem desce |
| `escalar` | Sneasler (903) | X de frente para o paredão com trepadeira | sobe pelo paredão (leva o treinador nas costas) |
| `voar` | Corviknight (823) | segurar X | voa por cima de tudo (sem colisão, portas desligadas), sombra no chão, câmera e minimapa afastam; X pousa no lugar livre mais perto (na água vira Lapras) |
| `mergulhar` | Mantine (226) | X navegando sobre um redemoinho escuro | mostra o fundo (areia, pedras, algas, luz da superfície); X volta à superfície |

- **Desbloqueio:** flags `mounts.<tipo>` (ou `'mounts.<tipo>'`). `game.unlockMount('mudbray' | 'correr' | ...)` grava a flag e mostra o aviso
  "Nova montaria"; flags ligadas por fora também ganham o aviso (uma vez). Com `?teste=1` todas ficam liberadas.
- **Redemoinhos:** água funda (`W`) cercada de água funda, numa grade de 14 blocos, e os pontos do mapa `mergulho_*` / `redemoinho_*`.
- **Q montado:** desce primeiro (no voo, pousa) e depois joga a Poké Bola do Pokémon.
- **Desenho:** `MountRig` (sprite PMD na direção certa, Walk/Idle, escala real de `scale.js`) com o treinador sentado (pose `ride`
  de `charart.js`) no ponto da sela calculado pelos offsets do PMD (`frameOf().center`/`box`); de frente para a câmera o treinador fica
  atrás da cabeça da montaria. Poeira, lama, espirro, rastro na água, bolhas e vento.
- **Online:** o estado de posição leva `m` (tipo), `z` (altura do voo) e `u` (mergulhado); os outros jogadores aparecem montados.
- **Minimapa:** canto da tela; clique nele ou tecla N alterna "gira com você" / "norte para cima".
  Mapa completo para o menu: `game.mundo.renderRegionMap(canvas, { fog: true })` (setores visitados).
- **Teste:** no console, `await import('/tools/mundo-teste.js')` dá `vista(nome, bx, by, zoom, hora)` e `mapaInteiro()`,
  que salvam imagens em `tools/shots/`.
## Combate (ramo `combate`)

No modo Pokémon (Q joga a bola e você controla o Pokémon): **C** voa/pousa (voadores), mergulha (Pokémon de Água perto
da água) ou cava (os demais); **X** pula; **Espaço** esquiva com invencibilidade e rastro. No celular aparecem os botões ⇅ e ⤒.

- **Animação por golpe** (`src/combat/anims/`): uma receita por golpe, em fases (carga → saída → viagem → impacto → resto
  no chão), montada com os blocos de `anims/kit.js`. Arquivos por tipo (`fire.js`, `water.js`…). Golpes que ainda não
  existem em `src/data/moves.js` entram com dados mínimos da receita (os oficiais, quando chegarem, têm prioridade).
  Formas: `proj`, `melee`, `multi`, `dash`, `cone`, `wave`, `quake`, `cloud`, `rain` e as novas `bolt` (raio direto),
  `sky` (raio do céu), `surf` (onda), `target` (efeito no alvo), `line` (pedras em linha), `shield` (escudo), além de
  feixes contínuos (`beam` na receita: Lança-Chamas, Hidro Bomba, Raio Congelante, Raio Solar, Hiper-Raio…).
- **Efeitos** (`src/engine/fx.js` + `fxtex.js`): atlas único desenhado por código (chamas, gotas, folhas, pedras,
  estilhaços, fumaça, marcas no chão e uma fonte pixel com acentos), partículas em `ParticleContainer` com pool,
  anéis de choque, raios, luzes aditivas, clarão de tela, tremor e pausa no impacto.
- **Choques:** projéteis de força parecida travam e disputam no ar antes de explodir; feixes que se encontram entram em
  disputa (apertar o golpe empurra); corpo a corpo e investidas frente a frente se repelem.
- **Leitura do perigo:** o selvagem telegrafa (faixa, leque ou círculo no chão; vermelho = dano, amarelo = só efeito)
  e pisca antes de soltar o golpe. Esquiva perfeita (perto do acerto) dá câmera lenta curta.
- **IA** (`src/combat/ai.js`): temperamentos, bandos com alfa (maior, olhos vermelhos, chama o bando), acordar com
  barulho, esquiva de projéteis, circular o alvo, um selvagem por vez preparando golpe contra o mesmo alvo (dois num bando), rivais que brigam.
- **Arena** (`src/combat/arena.js`): crateras, terra revirada, mato cortado, fogo que se espalha pelo mato alto e deixa
  chão queimado, arbustos e pedras que quebram em detritos, árvores que tremem e soltam folhas.
- **Dano:** ponto único em `src/combat/damage.js` (`computeDamage`; `calcDamage` em combat.js é a versão pura do PvP).
  Relevo: Água mais forte na água, Planta no mato alto, Elétrico em alvo molhado, Fogo fraco em alvo na água.
- **Testes:** `combat.showNames = true` mostra o nome do golpe ao usar.

## Equilíbrio, economia e captura (ramo `qa-jogo`)

- **Ritmo do dano** (`src/combat/damage.js`): `DMG = 0.34` para todos e `FOE_DMG = 1.5` a mais quando um selvagem
  ou Pokémon de treinador acerta o seu (eles telegrafam e você pode esquivar; o PvP online não usa esse peso).
  Alfa bate ×1,25. Estágios de status se desfazem 1 nível a cada 6 s (`STAGE_DECAY` em combat.js). Um selvagem por
  vez prepara golpe contra o mesmo alvo (dois num bando com alfa). Medido com um robô no combate real: selvagem do
  mesmo nível cai em 3 a 30 s (mediana ~10 s); jogando parado sem esquivar, perde-se 0 a 70% do HP por luta.
- **XP**: quem lutou ganha tudo; o resto da equipe ganha metade (`XP_SHARE` em main.js). Com 4 golpes, aprender um
  novo abre a tela clássica de esquecer (`menu.askLearn`). Evolução com a cena clássica (`src/ui/evolucao.js`),
  inclusive por pedra; avisos que param o jogo passam pela fila `ui.queue`.
- **Encontros**: tabela da área (`encounters`), a da área de mesmo nome no esboço ou a da área vizinha (até 24
  blocos); à noite entram os noturnos do bioma no nível da área. Alfa: 7% dos selvagens (`ALPHA_ODDS` em ai.js),
  +3 níveis, PS ×1,5, não foge; vencido dá XP em dobro e deixa cair um item (`ALPHA_DROPS` em main.js).
- **Captura**: a bola escolhida (Mochila → Preparar, ou G) entra na fórmula oficial; sacudidas seguidas; "Capturado!",
  registro na Pokédex, Bola de Cura e Bola Amiga funcionam. Dormindo, distraído e com pouco HP ajudam.
- **Mercado** (`src/world/lojas.js`): falar com o balconista abre comprar/vender; o estoque cresce com as insígnias
  (Grande Bola e Superpoção com 1, Reviver com 2, Ultra Bola com 3…), cada cidade tem extras. Vender = metade do
  preço. Tesouros (Pérola, Pepita, Cogumelos, Pó Estelar) só servem para vender. O PC de qualquer Centro abre a caixa.
- **Itens escondidos**: `hidden: true` nos `items` do mapa (só um brilho fraco de perto).


## Acabamento (ramo `acabamento`)

- **Qualidade gráfica** (`src/engine/quality.js`, opção em Opções): Automática, Alta ou Baixa. A automática começa em
  baixa em aparelho de toque fraco (≤ 3 GB ou ≤ 4 núcleos) e cai para baixa se ficar abaixo de 45 FPS (celular) ou
  50 FPS (computador) por 6 s. Baixa = 40% das partículas, sem luzes grandes/halos de janela, desenho a 75%.
- **F3** mostra FPS, tempo de lógica, partículas e o nível de qualidade.
- **Carregamento:** barra real em `index.html` (conta os arquivos; o total da última visita fica em
  `localStorage['alvorada.boot.n']`) e etapas do `main.js` via `window.__boot(fração, texto)` / `window.__bootDone()`.
- **Service worker** (`sw.js`): código em rede primeiro (6 s de limite, depois a cópia guardada); sprites em cache
  próprio (`alvorada-sprites-v1`), cache primeiro e só do que aparece. Na primeira visita a página manda ao SW a
  lista do que já carregou (`{ type: 'guardar', urls }`) para o jogo abrir offline na visita seguinte. Ao mudar a
  estrutura do cache, troque o nome em `CODE`/`SPR`.
- **HUD:** objetivo recolhível (toque/clique ou J; no celular fica recolhido e abre 6 s quando muda); minimapa com
  tamanho e posição no CSS (`#minimapa`); no computador com tela grande a interface cresce pelo `--k` (zoom do CSS).
- **Som:** faixas `title` (tela de título) e `forest` (bosques) além de `town`, `route` e `battle`; o menu abaixa a
  música (`audio.duck(k)`); compressor no fim da cadeia.
