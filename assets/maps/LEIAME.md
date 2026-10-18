# Mapa da região (alvorada.json)

A região inteira, desenhada à mão, num JSON só. Coordenadas em **blocos de 16 px** (x para a direita, y para baixo).
O jogo monta o mapa ao carregar (`src/world/build.js`) e desenha os setores de 16x16 blocos sob demanda.
Depois de editar à mão, `python3 tools/formatar-mapa.py assets/maps/alvorada.json` deixa o arquivo arrumado.

## Campos

- `w`, `h`: tamanho total. `outdoorH`: altura da parte externa; abaixo dela ficam os interiores, isolados por vazio.
- `base`: bloco inicial (`grass`).
- `ops`: operações de pintura, aplicadas na ordem (as últimas ganham):
  - `rect {t,x,y,w,h,on?}` · `ellipse {t,cx,cy,rx,ry,noise?}` · `poly {t,pts,noise?}` · `border {t,x,y,w,h,width,noise}`
  - `path {t,pts,width,wobble?}` (estrada com curvas) · `line {t,pts}` (1 bloco; penhascos) · `set {t,pts}` (blocos soltos)
  - `blobs {t,x,y,w,h,scale,th,on?}` (manchas por ruído, ex.: mato alto) · `scatter {t,x,y,w,h,p,on?}`
  - `stamp {x,y,rows,legend?}` (desenho em texto, 1 caractere por bloco; espaço = não muda)
  - `fence {x,y,len,dir:"h"|"v",white?}` (cerca) · `comment` (só anotação)
  - `on` limita a operação a certos blocos (ex.: `"on": ["water","deep"]` para pontes).
- `trees`: árvores soltas `{x,y,w,h,p,kinds,on?}`; os blocos `forest` ganham árvores em fileiras automaticamente
  (`forestKinds`, `forestZones` escolhem os tipos).
- `objects`: `{kind,x,y,...}`; `x,y` é o canto de cima à esquerda da pegada. Catálogo em `src/world/objects.js`.
  Prédios com `"to": "<id do interior>"` ganham porta com fade. Placas têm `text`.
- `decor`: decoração plana (`courtlines`, `rug`, `wheat` com `w/h` para preencher área, `window`...).
- `interiors`: salas `{id,name,x,y,rows,objects,decor,spots,biome?,wild?,dark?}` desenhadas em texto; o tapete `m`
  é a saída (pisar nele andando para baixo volta para a porta).
- `warps`: passagens extras `{x,y,dir,to:[x,y],face,label}` (gruta, escadas).
- `spots`: pontos nomeados para a história `[x,y,direção]`. Também são criados `porta_<id>` e `dentro_<id>`.
- `areas`: nome e bioma (`vila`, `campo`, `floresta`, `margem`, `praia`, `planalto`) por `rect` ou `ellipse`;
  a última que contém o ponto vence. Bioma `vila` não tem selvagens.
  `id` (opcional) dá nome ao lugar para o roteiro (gatilho `entrar`). `encounters: [[dex, nív. mín., nív. máx., peso], …]`
  troca a tabela de selvagens do bioma por uma própria (vale também num interior, ex.: a Toca do Absol).
- Pontos para o roteiro (`src/story/roteiro.js`): zonas de `pisar` são pontos com o mesmo nome (ou `<nome>__<acesso>`
  quando há mais de uma entrada), raio padrão de 3 blocos (ou `radius`). Treinadores e personagens dos capítulos 2+
  ficam nos pontos citados em `src/story/elenco.js`.
- `items`: Poké Bolas no chão `{x,y,item,n?}` (brilham; pegar ao passar por cima). Com `hidden: true` o item fica escondido: só um brilho fraco de perto (tesouros e pedras pela região).
- `people`: moradores `{id,name,look,x,y,dir,wander,kid?,lines,heal?,all?}` (também dentro de cada interior, em
  coordenadas da sala). `look` é uma predefinição de `src/sprites/charart.js` (`menino`, `menina`, `professor`, `mae`,
  `rival`, `treinador`, `treinadora`, `montanhista`) ou `{preset, ...cores}`. Cada conversa mostra a próxima fala.
- `pets`: Pokémon passivos `{dex,x,y,wander,perch?,sleep?,say}`; `perch: true` = parado num telhado.
- Objetos com `text` (placas e móveis) mostram o texto com E. `noTrees`: retângulos `[x,y,w,h]` sem árvores soltas.
- `include`: arquivos desenhados antes deste (o esboço da região).

## Tipos de bloco (caracteres dos carimbos)

| car. | nome | | car. | nome |
|---|---|---|---|---|
| `.` | grass | | `#` | cliff (penhasco; 2 linhas = penhasco alto) |
| `,` | grass2 | | `^` | stairs |
| `"` | tall (mato alto) | | `B` / `b` | bridge (leste-oeste) / bridgev (norte-sul) |
| `=` | path | | `P` | plaza |
| `~` | water | | `F` | forest (mata fechada, sólida) |
| `W` | deep | | `d` | dark (chão do bosque) |
| `:` | sand | | `c` | court (quadra) |
| `*` | flowers | | `f` / `t` / `w` / `m` | floor / tilefloor / wall / mat (interiores) |
| `_` | void | | `k` / `r` / `O` | cave / rock / cavedoor (gruta) |
| `g` | gold (campo dourado) | | `L` | mud (lamaçal: Correr) |
| `M` | corn (milharal, sólido) | | `V` | climb (paredão com trepadeira: Escalar) |
| `y` / `x` | fio dourado / prateado (Estufa-Teia) | | `s` / `D` | snow / dock (píer) |

## Capítulos 4 a 6

- Objetos novos (catálogo estendido em `src/story/cenario.js`): `farol`, `casarao`, `torre`, `vidro`, `megaloja`, `redacao`,
  `estacao`, `hospital`, `casaMaquinas`, `capela`, casas `houseStone`, `houseStone2`, `housePink`, `houseYellow`, `houseMiner`,
  `houseGlass`; `posteLuzita`, `lampiao`, `lapide`, `lapideVela`, `velas`, `arvoreSeca`, `barraca`, `guardaSol`, `palco`,
  `torreTx`, `outdoor`, `carrinho` (empurrável), `carrinhoParado`, `vigaCaida`, `pedregulho`, `maquete`, `painel`, `elevador`,
  `quadro`, `quadroBenta`, `garra`, `cristal`, `estante`, `fogao`, `poleiro`, `placaAurora`, `conePlast`, `cavalete`, `gerador`.
  Decoração: `trilho`, `trilhoH`, `ondas` (calçadão), `tapeteRoxo`, `luzChao`, `folhas`, `poeira`.
- Entradas marcadas com `"cap456": true` foram geradas para estes capítulos. Os quebra-cabeças usam coordenadas
  relativas às salas (`src/story/enigmas.js`): mudar uma sala de lugar não quebra nada, mudar o desenho dela sim.
- Os interiores ficam na faixa de baixo (y ≥ 480), afastados uns dos outros (≥ 20 blocos) para a câmera não mostrar a sala vizinha.

## Biomas novos: blocos, objetos, mecânicas e clima (ramo `biomas`)

Tudo desenhado por código (`src/world/arte-biomas.js`), no estilo do resto. Para ver tudo funcionando abra
**`?mapa=demo-biomas`** (mapa só de teste, `assets/maps/demo-biomas.json`, gerado por `python3 tools/gerar-demo-biomas.py`;
nesse modo não há save, nem online, nem cenas da história). Outros mapas de teste: `?mapa=<arquivo sem .json>`.

### Blocos (caractere do carimbo → nome → comportamento)

Terrenos "macios" (bordas orgânicas automáticas, como grama/areia) e "duros" (desenho por bloco). A velocidade vale
para o treinador a pé; montado, a neve funda e a lama atrasam menos e o gelo não escorrega.

| car. | nome | bioma | comportamento |
|---|---|---|---|
| `n` | snowfield | neve | chão de neve (macio); 94% da velocidade; deixa pegadas |
| `N` | deepsnow | neve | neve funda em montes (macio, sombra embaixo); 55% da velocidade |
| `J` | tallsnow | neve | mato alto com geada (selvagens, balança, esconde o pé) |
| `i` | ice | gelo | gelo liso: **escorrega** em linha reta até bater em algo sólido ou sair do gelo |
| `I` | frozen | gelo | lago congelado (macio, bordas de geada); também escorrega |
| `G` | icewall | gelo | parede de caverna de gelo (sólida; face embaixo, topo escuro em cima) |
| `e` | icefloor | gelo | chão de caverna de gelo |
| `v` | basalt | vulcão | rocha vulcânica em placas (macio) |
| `a` | ash | vulcão | cinzas (macio), com brasinhas |
| `l` | lava | vulcão | **sólida**, brilha à noite e no escuro, anima; **queima** quem encosta (treinador é empurrado; Pokémon em campo perde 1/12 da vida e pode se queimar, menos os de Fogo); pedra empurrada nela vira basalto |
| `o` | obsidian | vulcão | obsidiana (macio, brilho roxo) |
| `q` | hotspring | vulcão/termal | fonte termal com vapor e bolhas; 60% da velocidade; ficar ~2 s dentro **cura a equipe** (uma vez por hora do jogo) |
| `u` | lavafloor | vulcão | chão de caverna de lava com frestas em brasa (luz no escuro) |
| `U` | lavawall | vulcão | parede de caverna de lava (basalto colunar) |
| `z` | dune | deserto | areia de duna com ondulações; 88% da velocidade |
| `Q` | quicksand | deserto | **areia movediça**: 45% da velocidade, puxa para o meio; parado ~3,4 s **afunda** (vai para `afunda` da área/sala ou volta ao último chão seguro); correndo afunda mais devagar |
| `h` | cracked | sertão | chão rachado |
| `K` | caatinga | sertão | terra vermelha com tufos de capim seco |
| `j` | talldry | sertão | capim seco alto (mato alto do sertão) |
| `C` | canyon | cânion | paredão de cânion em camadas (sólido) |
| `&` | redrock | cânion | chão de rocha vermelha em camadas |
| `-` | dryriver | cânion | leito de rio seco com seixos |
| `;` | salt | salar | crosta de sal em placas |
| `?` | saltmirror | salar | espelho d'água do salar (reflete o céu); 85% da velocidade |
| `A` | wetsand | praia | areia molhada (espuma na beira) |
| `T` | tide | praia/mangue | **maré**: banco de areia seco na maré baixa; na **maré alta (por volta das 6 h e 18 h)** vira água (só nadando) |
| `%` | reef | praia/recife | recife raso com corais (água transparente por cima da água animada); andável, 62% da velocidade |
| `p` | mangmud | mangue | lama com poças; 75% da velocidade |
| `R` | roots | mangue | raízes de mangue (sólido: barreira natural) |
| `/` | shallow | mangue/brejo | água rasa andável (72% da velocidade) |
| `\|` | reed | brejo | junco na água rasa (mato alto do brejo: selvagens, balança) |
| `→` `←` `↑` `↓` | cur_e, cur_w, cur_n, cur_s | mar/rio | **correnteza**: água que leva quem nada (treinador no Lapras, Pokémon na água) na direção da seta; riscos de espuma animados |
| `E` | templefloor | templo | piso de lajes de arenito (musgo e trincas de vez em quando) |
| `Y` | mosaic | templo | mosaico colorido |
| `X` | oldstone | ruína | calçamento antigo com musgo |
| `H` | templewall | templo | parede de templo com faixa de glifos (sólida) |
| `<` / `>` | stairup / stairdown | templo/caverna | escada que sobe / que desce (só desenho: ligue com `warps`) |
| `0` | hole | masmorra | **buraco**: quem pisa cai para o andar de baixo (ver "buracos" abaixo) |
| `!` | crack | masmorra | **rachadura**: andando, cede depois que você sai (vira buraco); correndo ou montado, cede na hora e você cai. Fica salvo |
| `S` | darkcave | caverna | chão de caverna escura |
| `Z` | crystalfloor | cristal | chão com cristais incrustados (luz própria no escuro) |
| `$` | crystalwall | cristal | parede com cachos de cristal (luz própria) |
| `+` | rail | mina | trilho de mina (reto e curvas automáticos pelos vizinhos); o vagonete corre nele |

Notas de desenho: paredes (`G U C H $` e as antigas `w r`) mostram a **face** quando o bloco de baixo não é parede, e o
**topo** quando é; uma parede de 2+ linhas fica com cara de paredão. Pisos ganham sombra embaixo de parede. Os pisos
duros emprestam uma borda às vizinhanças macias (templo → pedra, caverna de gelo → neve, lava/cristal → basalto).
A água rasa, o recife e a correnteza deixam ver a água animada por baixo: só funcionam na parte externa do mapa.

### Objetos (catálogo em `src/world/objects.js`; `x,y` = canto de cima à esquerda da pegada)

- **Plantas:** `snowPine`, `snowPineBig` (pinheiro nevado), `cactus`, `mandacaru`, `xiquexique`, `juazeiro`, `coqueiro`,
  `palmeira`, `mangue` (árvore de mangue, 3 blocos), `arvoreSelva` (4 blocos, raízes tabulares e cipós), `folhaGigante`,
  `bambu`, `umbu`, `araucaria`.
- **Pedras:** `lavaRock` (brilha), `stalagmite`, `stalagmiteIce`, `crystal`, `crystalPink` (luz própria), `obsidianRock`.
- **Templo e ruína:** `statue`, `altar`, `brokenColumn`, `obelisk`, `mural`, `pot` (quebra), `torch` e `brazier` (acendem),
  `chest` (baú), `bell` (sino), `lanternaPedra` (luz à noite).
- **Casas** (com `"to": "<interior>"` ganham porta): `igloo` (3x2, porta na coluna 1), `cabin` (cabana de madeira nevada, 5x3,
  porta 2), `taipa` (casa de taipa, 5x3, porta 2).
- **Extras:** `beachStall` (barraca de praia), `surfboard`, `driftwood`, `jangada`, `boia`, `skull` (crânio de boi), `snowman`,
  `barrel` (quebra), `fumarola` (solta vapor), `cercaVara`, `sucata`.
- **Mecânicas:** `strengthRock`, `iceBlock`, `cart`, `plate`, `lever`, `stoneDoor`, `barsGate`, `raioGate`, `lockedDoor`,
  `crackedWall`, `crackedRock`, `crackedIce`, `crackedLava`, `crackedCanyon` (ver abaixo).

### Mecânicas de masmorra (`src/world/masmorra.js`), configuradas nos objetos do JSON

Todo objeto de mecânica pode ter `id` (senão vira `tipo@x,y`). O que precisa ficar resolvido vai em `flags.dg` do save
(posição das pedras, portas abertas, tochas acesas, baús, rachaduras que cederam, paredes quebradas). Os "alvos" são ids
de portões ou de `mecanismos` (pontes/blocos).

| mecânica | JSON | como funciona |
|---|---|---|
| Pedra de Força | `{"kind":"strengthRock","x","y","id"}` | empurra-se andando contra ela ~0,3 s. O treinador precisa de um Pokémon forte na equipe (Lutador, Pedra, Terra ou Aço, ou que saiba Força) ou do Mudbray; o Pokémon em campo empurra se ele mesmo for forte. **Escorrega no gelo**, **tapa buraco** (vira chão) e **afunda na lava** (vira basalto). |
| Bloco de gelo | `{"kind":"iceBlock",...}` | igual, mas qualquer um empurra; derrete com golpe de Fogo; na lava vira vapor e esfria o bloco. |
| Vagonete | `{"kind":"cart",...}` sobre `+` | empurrado, corre pelo trilho até o fim ou até bater; **quebra parede rachada** no caminho; pesa em placa. |
| Placa de pressão | `{"kind":"plate","x","y","abre":["id",...],"trava":true}` | pressionada pelo treinador, pelo Pokémon em campo, por pedra, bloco de gelo ou vagonete. Sem `trava`, só vale enquanto algo pesa nela. |
| Alavanca | `{"kind":"lever","abre":[...],"alterna":[...],"nome":"..."}` | E/A puxa. `abre` abre enquanto ligada; `alterna` inverte cada alvo (abre o fechado e fecha o aberto), como as de `enigmas.js`. |
| Portões | `{"kind":"stoneDoor"\|"barsGate"\|"raioGate","id","aberto":false,"flag":"x","msg":"..."}` | fechados (sólidos) até um gatilho abrir. `flag` abre quando a flag da história vale (aceita `trainers.id` e `item:<id>`). `raioGate` com `"periodo": 2, "fase": 0\|1` abre e fecha sozinho (raio que se reveza); `"liga": "id"` só começa depois que aquele alvo/flag ligar. Quem estiver no bloco quando fecha é empurrado para o lado. |
| Porta trancada | `{"kind":"lockedDoor","chave":"chave_pequena","gasta":true,"flag":"x","msgTrancado":"..."}` | E/A com a chave na mochila abre (a `chave_pequena` some ao usar; outras chaves ficam). Itens-chave novos: `chave_pequena`, `chave_mestra`. |
| Baú | `{"kind":"chest","item":"rareCandy","n":2,"chave":"...","abre":[...]}` | E/A abre e entrega o item (uma vez). |
| Tocha / braseiro | `{"kind":"torch"\|"brazier","grupo":"g1","abre":[...],"acesa":true,"apaga":12,"msg":"..."}` | acende com golpe de Fogo (de longe) ou E/A com um Pokémon de Fogo na equipe. Todas do mesmo `grupo` acesas → abrem os alvos (fica salvo). `apaga`: segundos até apagar (enigma de acender todas a tempo); golpe de Água ou Gelo apaga. Acesas iluminam salas escuras e a noite. |
| Sino | `{"kind":"bell","grupo":"sinos","ordem":1,"abre":[...]}` | E/A toca. Com `grupo`+`ordem`, tocar na ordem 1, 2, 3… abre os alvos; errar recomeça. Sem grupo, funciona como alavanca. |
| Altar | `{"kind":"altar","pede":"itemId","gasta":true,"abre":[...],"texto":["..."]}` | oferenda: com o item, abre os alvos. |
| Parede rachada | `{"kind":"crackedWall"\|"crackedRock"\|"crackedIce"\|"crackedLava"\|"crackedCanyon","chao":"templefloor","abre":[...],"msg":"..."}` | ponha **em cima** de um bloco de parede. Golpe Lutador, Pedra, Terra ou Aço (ou de poder ≥ 75), ou o vagonete, derruba; o bloco vira `chao` (ou o piso vizinho). |
| Pontes / blocos que aparecem | `"mecanismos": [{"id","tipo":"ponte"\|"blocos","t":"bridge","pts":[[x,y],...] ou "rect":[x,y,w,h],"flag":"x","requerItem":"id","msg":"..."}]` | no topo do mapa (coordenadas do mundo) ou dentro de um interior (coordenadas da sala). Ligado por gatilho, `flag` ou item na mochila (como as tábuas de luz da Lente Prisma); desligado, volta o bloco de antes. |
| Sala escura | interior ou área com `"escuro": true` (ou 0 a 1) | mapa de luz de verdade: o treinador ilumina pouco; um Pokémon de **Fogo ou Elétrico** na equipe ilumina em volta; o Pokémon em campo desses tipos também; tochas acesas, cristais, lava, rocha de lava e chão de cristal brilham. O bioma `abismo` é sempre escuro. (O antigo `dark: true` continua igual.) |
| Buraco para baixo | blocos `0`/`!` + no interior `"abaixo": "id_da_sala"` (mesma posição relativa; ou `{"sala","dx","dy"}`) ou `"buracos": [{"x","y","to":[x,y]}]` (topo: coordenadas do mundo; no interior: da sala) | cai com tremor e aviso; sem destino, volta ao último chão seguro. |
| Areia movediça com destino | área ou interior com `"afunda": {"sala":"id","x","y"}` | quem afunda aparece lá (ex.: uma caverna embaixo do deserto). |
| Escadas | `"warps": [{"x","y","dir","to":[x,y],"face","requer":"flag ou grupo:x ou item:id","msg":"..."}]` | as passagens normais agora aceitam `requer`/`msg` (ideia dos portais de `enigmas.js`). |

Os enigmas dos capítulos 4 a 6 (`src/story/enigmas.js`: circuitos, geradores em ordem, espelhos, quadros, raio
alternante, tábuas de luz) continuam lá; um mapa novo pode trazer os seus no campo `"enigmas"` (mesmo formato do
`ENIGMAS`), e outro mapa que não a Alvorada não herda os da Alvorada.

### Clima, som e música por bioma (`src/world/clima.js`)

`areas[].biome` (ou `biome` de um interior) escolhe o preset; a área pode ajustar com `"clima": {"neve": 0.5, ...}` ou
trocar por outro preset com `"clima": "gelo"`. Chaves: `neve`, `vento`, `cinzas`, `brasas`, `calor` (tremor de calor,
só na qualidade alta e fora do celular), `tempestade` (de areia, vem e vai), `miragem`, `poeira`, `nevoa`, `gotas`
(pingos com respingo), `brilhos`, `chuva` (pancadas que vêm e vão), `eco` (eco nos efeitos sonoros), `escuro`, `tinta`
(cor do ar), `som` (`vento`, `lava`, `mar`, `gotas`, `mangue`, `templo`) e `musica`.

| bioma | clima | música |
|---|---|---|
| `neve`, `gelo`, `pico` | neve caindo, vento com rajadas, ar azulado | snow |
| `vulcao` | cinzas, brasas subindo, calor tremulando, lava brilhando à noite | volcano |
| `termal` | vapor das fontes e fumarolas | temple |
| `sertao`, `canion`, `deserto`, `salar` | poeira, miragem; tempestade de areia no `deserto`; eco no `canion`; brilho no `salar` | desert |
| `mangue`, `brejo` | névoa baixa | mangrove |
| `selva`, `cratera` | pancadas de chuva / cinza leve | forest |
| `mar`, `praia`, `recife` | som do mar | (a de rota) |
| `abismo` | escuro total (mapa de luz) | cave |
| `caverna`, `cristal`, `mina` | gotas, eco, brilhos | cave |
| `ruina`, `templo` | poeira no ar, eco | temple |
| `pampa` | vento leve | (a de rota) |

Os selvagens desses biomas vêm de `BIOMAS_PADRAO` (`src/data/habitats-biomas.js`); `templo` e `mina` têm tabela própria
em `src/data/species.js`. O chão onde podem aparecer sem mato alto inclui neve, cinzas, dunas, cavernas e templos.
Peso no celular: as texturas dos biomas repetem a cada 256 px e são assadas uma vez (nas folgas, logo depois de carregar),
então um setor de bioma custa o mesmo que um de grama; as partículas do clima são um pool fixo que cai pela metade na
qualidade baixa.
