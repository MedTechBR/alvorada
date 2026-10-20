# Arenas dinâmicas dos ginásios

Pedido do dono: "a arenas de gym devem ser bem dinamicas". A luta contra cada líder acontece num palco vivo, montado
**por dados** em cima da sala (ou do pedaço de mapa) do ginásio. Os quebra-cabeças de antes da luta continuam iguais:
a arena só existe durante a batalha do líder e devolve o mapa como estava no fim (blocos, bloqueios, escuro).

| Arquivo | O que tem |
|---|---|
| `src/combat/arena-ginasio.js` | motor: geometria, avisos, fases, cenas, IA do líder, dificuldade, ganchos, `estado()` |
| `src/combat/arena-pecas.js` | biblioteca de peças (perigos e peças interativas), uma classe por tipo |
| `src/data/arenas.js` | as 16 arenas (8 líderes, píer, Véspera, Necrozma, Elite e Campeã) e `arenaEm()` |
| `src/world/estadios.js` | os 16 estádios (salas de 50×36, luta em 48×32) |
| `tools/arenas-bot.js`, `tools/arenas-teste.mjs` | robô que luta como gente e o teste via Chrome sem interface |

## Estádios (outubro de 2026)

Pedido do dono, jogando no iPhone: "as arenas de ginásio ainda estão muito pequenas, preciso que elas sejam realmente
enormes" e "o personagem principal deve sempre ficar dentro da área da arena; quando um Pokémon meu morreu, o outro foi
solto fora da arena". Desde então **toda** luta com arena (8 líderes, revanche do píer, Dra. Véspera, Necrozma como
chefe, os 4 da Elite e a Campeã) acontece num **estádio próprio** (`src/world/estadios.js`):

- sala de 50×36 blocos, montada pelo código (não está nos JSON de mapa: `src/world/mundos.js` põe as 16 numa fileira
  da faixa de interiores do núcleo, y 1162, abaixo de todas as outras salas); duas fileiras de arquibancada em cima
  (objetos `stands`, onde a plateia torce) e a luta em **48×32 blocos** (antes 18×12). Cada estádio tem chão e
  obstáculos do tema (água, lava, teia, trilhos, pedras e caixotes onde dá para subir, colunas, cristais);
- a abertura da arena escurece a tela e leva o jogador (e o Pokémon dele, e o do Téo, se houver) e o líder para o
  estádio; no fim, `story.js` chama `arena.voltar()` e todo mundo volta para onde estava no ginásio (se o jogador
  desmaiou e foi para o Centro Pokémon, só o líder volta). Quebra-cabeças, portões, treinadores e cenas do ginásio
  não mudam. Jogo salvo e carregado dentro de um estádio, sem luta: o jogador volta ao ginásio (`estadio.volta`);
- **contenção**: enquanto a luta vale (`arena.contem`), o retângulo da arena é parede invisível para o treinador e
  para todo Pokémon da luta (`map.limite`, conferido a cada passo curto de colisão em `map.andar`, no passo de grade do
  treinador e no teleporte/cavar de `map.ateLivre`) e `conterTodos()`, no fim de cada quadro (main.js), devolve para
  dentro quem saiu por outro caminho. Quem entra na luta nasce dentro: o Pokémon do líder (`#spot`, `#appear`), o seu
  (`main.js #sendOut`: bola, troca, o próximo depois do desmaio, a no máximo 3 blocos do treinador) e os ajudantes.
  O treinador que acompanha o Pokémon (`#seguir`) mira um ponto livre dentro da arena, a 1,5 bloco da borda. A borda
  aparece durante a luta (faixa na cor do ginásio e postes com corda; no Brás, a corda do ringue). No estádio não há
  fuga (o líder fica a mais de 26 blocos às vezes);
- **câmera**: no 3D, `visual3d/camera.js #estadio` enquadra o seu Pokémon e os do líder (afasta até 2,2×, foco preso à
  arena); no 2D, `camK` segue a distância entre os dois (`poder.js #kEstadio`). Quem não cabe na tela (celular deitado)
  ganha **seta na borda** com nome e barra de PS (`arena-ginasio.js #setas`).

| Estádio | Chão e terreno | Perigos e peças (o que cresceu) |
|---|---|---|
| Tomé (milharal) | grama listrada, 2 açudes, 4 pedras para subir, fardos de feno | 13 moitas de milho, 14 fardos que rolam, debulhadoras simultâneas, trator vertical na colheita, 5 anéis de colheita |
| Lia (estufa-teia) | teia prateada com passarelas douradas em grade, folhas gigantes e arbustos | 14 plantas carnívoras, 8 casulos (até 4 ajudantes) |
| Marina (marés) | piscina 24×16 com água funda, ponte no meio, 4 ilhas altas, caixotes | 4 barcos (2 por metade), 4 comportas, inundação com 10 áreas altas, correnteza em giro |
| Píer | deque cortado por 3 canais de água | 3 barcos, ondas simultâneas, correnteza, ressaca com 6 pontos altos |
| Jonas (lanterna) | metal, máquinas e caixotes de cobertura, lente no meio | painéis 2×2 em 7 padrões pela arena toda, 8 geradores, 4 para-raios, tempestade |
| Zélia (luar) | madeira escura, 2 colunatas, estátuas | 8 candelabros, 3 pares de portas, móveis voando de 11–14 blocos, 3 sombras |
| Brás (roda) | areia com a roda de quadra no meio, barris e troncos | 11 tablados que racham, berimbau, corda do ringue na borda |
| Graça (mina) | caverna, 3 trilhos, pedras e estalagmites | vagonetes nos 3 trilhos, 14 pilares, desabamentos com entulho |
| Celeste (céu) | 5 plataformas e 4 pontes no céu | 4 plataformas que andam, rajadas simultâneas, tornado |
| Véspera (menires) | grama com anel escuro, relógio de sol no meio, menires | 12 menires-cobertura em anel, sombras, vento |
| Necrozma (coração) | cristal, 14 cristais, obeliscos | raios 2–4 por vez, feixes de luz horizontais e verticais |
| Aurélio (madrugada) | pedra velha, colunas, estátuas | 8 candelabros, móveis, 3 sombras |
| Clarice (manhã) | jardim florido, 2 laguinhos, arbustos | 14 plantas, pétalas |
| Brasa (meio-dia) | basalto com 5 poças de lava | labaredas simultâneas, fagulhas, 10 pilares |
| Iberê (entardecer) | pedra velha e areia, pedras e colunas quebradas | rajadas verticais e horizontais, tornado, pedras |
| Dalva (campeã) | mosaico, colunas, estátuas | estrelas cadentes, rajadas, 6 colunas, giro |

Conferências: `node tools/teste-3d/estadios-pecas.mjs` (sem navegador: 40×28 ou mais e nenhuma peça em cima de
obstáculo) e `node tools/teste-3d/ginasios-tamanho.mjs` (mapa vivo). As descrições de cada arena abaixo são do
desenho original; os números de peças da tabela acima valem.

## Como liga

`TrainerBattle` (src/story/battle.js) chama `arenaPara(batalha)`: se o id da batalha (`leader_tome`, `leader_lia`...)
está em `ARENAS`, ou o `def` traz `arenaGinasio`, a arena nasce. `opts.semArena` desliga. Ganchos no jogo, todos de
uma linha e opcionais (`g.arenaGinasio?.…`):

- `combat/arena.js`: projéteis (`bloqueia`), impactos e explosões (`impacto`), investidas (`pisoteio`);
- `combat/combat.js`: `aoUsar` (ritmo do berimbau);
- `combat/damage.js`: chão alagado conta como água; `modDano` (carga do gerador, golpe no ritmo);
- `entities/pokemon.js`: `speed()` × `arenaVel` (teia, água);
- `main.js`: `g.camFocus` (a câmera da cena); `world/masmorra.js`: `luzes()` no escuro; `ui/hud.js`: nome da fase.

## Regras

1. **Todo perigo que tira PS é avisado antes.** O único caminho do dano é `A.avisar({...depois})` → `A.ferir()`. O aviso
   tem forma (círculo, faixa com setas, células, linha, anel), cresce até a hora e pisca no último quarto. Tempo mínimo
   `AVISO_MIN = 0,75 s`, mesmo no ginásio mais difícil. Exceções, todas visíveis o tempo todo e anunciadas pela fase:
   terreno (água funda na maré alta, anel cortado da colheita, queda das plataformas) e consequência de golpe (fardo
   que rolou, corda que lançou). O teste conta golpes sem aviso: tem que dar 0. A esquiva também livra dos perigos.
2. **A dificuldade sai do nível do ginásio** (o nível do ás), nunca do jogador: `d = (nível − 10) / 34`, de 0 a 1.

| curva (`DIFICULDADE`) | d = 0 (Jonas, ás 11) | d = 0,32 (Lia, 21) | d = 1 (ás 44) |
|---|---|---|---|
| × tempo de aviso | 1,30 | 1,17 | 0,90 |
| × dano (fração dos PS máximos) | 0,75 | 0,91 | 1,25 |
| × intervalo entre perigos | 1,10 | 0,99 | 0,75 |
| × PS máximos dos Pokémon do líder (equipe de 3 / 4 / 5+) | 1,70 / 1,45 / 1,30 | +0,06 | +0,20 |
| reação da IA ao aviso | 0,55 s | 0,44 s | 0,20 s |
| chance de a IA usar a arena | 40% | 56% | 90% |
| líder aciona um perigo a cada | 9 s | 8 s | 6 s |

O dano dos perigos é **fração dos PS máximos** de quem apanha (6% a 12% na base), com o quadro de tipos (super efetivo
×1,25, resistido ×0,75, imune 0): justo em qualquer nível, e o perigo do tipo do líder costuma resistir no Pokémon dele.
Perigos acertam os **dois lados**: o Pokémon do líder também apanha da debulhadora se ficar na faixa.

## Fases e cenas

`fases[0]` vale desde o começo. As outras entram quando `quando` vale: `desmaios` (Pokémon do líder vencidos),
`psEquipe` (fração dos PS da equipe inteira), `as` (o último está em campo), `asPS` (o último com essa fração). Ao
entrar: liga/desliga peças, ajusta parâmetros, roda `evento` em peças (a teia sobe, as portas trocam), troca a música
(`gymFinal` na fase final) e toca uma **cena curta** (1,5 a 1,8 s): câmera vai ao centro (ou ao líder), faixa com o
título, fala do líder, plateia, tremor. Na cena ninguém age nem apanha (lock + invencibilidade) e os perigos esperam.

**O ás:** antes do último arremesso, cena no líder ("O ás de Tomé"), depois a entrada com clarão, onda de choque,
fagulhas da cor do líder, nome em faixa e 1,1 s de pausa justa. Se o ramo `mega` estiver no jogo (`g.poder`), a arena
escolhe a hora da Mega/Dynamax (`poder: { tipo, quando: 'entrada' | 'ps', ps }`) e trava a IA própria do poder.js.

## IA do líder

`guiar(e, v)` roda depois do `think()` de cada Pokémon do líder: (1) se está num aviso, depois do tempo de reação foge
para o ponto seguro mais perto (anéis de amostras); (2) com a chance de esperteza, vai ao melhor objetivo que as peças
oferecem (`objetivo(e)`): cobertura entre ele e o seu Pokémon quando ferido ou sem golpe pronto, gerador livre quando
tem golpe Elétrico, para-raios na tempestade, água quando nada (e terra firme quando não nada) na maré, teia quando é
Inseto, escuro quando é Fantasma, porta que sai atrás do seu Pokémon, alavanca útil; (3) não entra andando num aviso.
O **líder** (o treinador) aciona perigos de tempos em tempos gritando antes (`gritos`): debulhadora na faixa do seu
Pokémon, painel que pega o seu quadrado, teia em volta, vela soprada, cadeira voando, comporta aberta.

## Peças (src/combat/arena-pecas.js)

| tipo | o que faz | usado em |
|---|---|---|
| `plateia` | torcida desenhada (gente, marujos, insetos, fantasmas) que pula e grita nos lances | todas |
| `milho` | milho sólido que segura projéteis; golpe forte, corte, fogo, investida e atropelo derrubam; o líder replanta | Tomé |
| `faixa` | máquina que varre uma faixa (debulhadora, onda, vagonete com trilhos, rajada que empurra) | Tomé, píer, Graça, Celeste |
| `encolher` | colheita: anel cortado que avança e empurra para dentro | Tomé f2 |
| `cobertura` | fardo (rola quando apanha), pilar, móvel; segura golpes, tem PS, quebra, renasce | Tomé, Graça |
| `teia` | fios que deixam lento e prendem; fogo e corte destroem; Fio de Seda tece; imune: Inseto e quem voa | Lia |
| `planta` | carnívora: quem chega perto vê o círculo verde e leva a mordida; fogo/gelo/voador murcham | Lia |
| `casulo` | eclode um ajudante do líder (avisa 2,4 s antes); dois golpes rompem antes | Lia |
| `inundacao` | a água sobe e desce em ciclos por alturas do chão; alagado = lento e molhado; na maré alta afoga quem não nada | Marina |
| `correnteza` | empurra quem está na água (reta ou girando), vira com aviso | Marina, píer |
| `plataforma` | barcos/plataformas que andam numa rota e carregam quem está em cima | Marina, píer, Celeste |
| `alavanca` | pisar 0,5 s ou acertar com golpe: comporta que sobe a água, que inverte a correnteza | Marina |
| `paineis` | chão em placas 2×2 que eletrificam em padrão (xadrez, linhas, anel, cruz...) | Jonas |
| `gerador` | ficar 1,3 s perto carrega o próximo golpe Elétrico (×1,5) | Jonas |
| `pararaio` | puxa os raios que cairiam perto (zona segura) e dá carga | Jonas |
| `marcas` | algo cai do alto onde a marca aparece (raio, pedra com sombra crescendo e entulho) | Jonas f2, Graça |
| `escuro` | a sala escurece; só candelabros iluminam; o Fantasma some fora da luz; o líder sopra velas, você reacende | Zélia |
| `poltergeist` | quadro, cadeira, vaso, livro sobem e voam na linha roxa | Zélia |
| `portas` | pares de portas (cor = par) que teleportam; trocam de par na fase 2 | Zélia |
| `giro` | o salão gira: tudo no chão é arrastado em volta do centro (vira com aviso) | Zélia f2, Celeste f2 |
| `sombras` | cópias do Pokémon da Zélia sem sombra no chão; um golpe as desfaz (e gasta o golpe) | Zélia f2 |
| `ritmo` | berimbau marca o tempo; golpe no tempo (±0,14 s) vale ×1,3 | Brás |
| `tabuas` | tábuas racham quando pisadas (o rachado é o aviso) e viram buraco | Brás |
| `corda` | quem é jogado contra a corda volta lançado e acerta quem estiver no caminho | Brás |
| `queda` | plataformas no alto; fora delas é queda (10% e volta à plataforma; a segunda em 3 s não tira PS) | Celeste |

Peça nova: uma classe com os ganchos que precisar (lista no topo do arquivo) e uma linha em `PECAS`.

## As arenas

**Tomé — Arena do Milharal** (Normal, quadra cercada de Campina, 12×11). Fase 1: milho plantado em quatro moitas, três
fardos que rolam quando levam golpe forte, debulhadora cruzando uma faixa de 2 blocos a cada 9–13 s. Fase 2 (1º
desmaio ou equipe a 55%): "A colheita começou!", a colheitadeira corta dois anéis (o campo encolhe para 8×7) e a
debulhadora passa mais. Final (ás a 50%): debulhadora mais rápida, música final.

**Lia — Estufa-Teia** (Inseto, 21×15). Fase 1: 30% dos fios prateados com teia, quatro plantas carnívoras, quatro casulos
pendurados. Fase 2 (2 desmaios ou 50%): "A teia subiu!": todo fio prateado vira teia e só os dourados (passarelas)
ficam livres; casulos eclodem mais (até 3 ajudantes), plantas mordem mais. Os Pokémon da Lia (todos Inseto) andam na
teia sem problema e a IA deles fica nela. Final: Metamorfose.

**Marina — Galpão das Marés** (Água, 19×13). Alturas: bordas dos píeres alagam primeiro, o meio depois; palco da Marina,
centro de baixo e o meio dos píeres laterais são altos. Ciclo 0 → 1 → 2 → 1. Dois barcos giram pela piscina e deixam
atravessar. Correnteza girando na água. Comporta vermelha (sobe a água) e azul (inverte a correnteza), dos dois
lados. Fase 2 = maré alta (1º desmaio ou 60%): quase tudo alaga e quem não nada afunda (3,5%/s) fora dos barcos e
pontos altos; música final (a luta é interrompida pelo assalto depois do 2º desmaio, como já era).
**Revanche no píer** (`leader_marina_pier`): píer de 3 blocos com barcos dos dois lados, ondas que varrem e empurram,
correnteza para a margem; final (Basculin a 50%): ressaca alaga o píer.

**Jonas — Lanterna do Farol** (Elétrico, 13×8). Placas 2×2 em padrão a cada 4,5–6,5 s, três geradores (os do quebra-
cabeça) que carregam golpe Elétrico, dois para-raios. Fase 2 (2 desmaios ou 50%): tempestade: céu escuro, 1–2 raios
por vez (metade mira os lutadores, alternando os lados) e o para-raios vira abrigo. Final: 2–3 raios por vez.

**Zélia — Salão do Luar** (Fantasma; a luta sobe para o salão do luar do Casarão, 13×12, com os espelhos de cobertura).
Escuro 82%: só os três candelabros e o seu Pokémon iluminam; o Fantasma dela some fora da luz (golpe carregando
brilha). Ela sopra velas, você reacende (fogo ou 1,5 s perto). Móveis voam, duas portas em par. Fase 2: o salão gira,
as portas trocam de par, aparecem duas sombras falsas. Final: Noite Longa (escuro 90%, giro mais forte).

### Planejadas (dados prontos, `planejada: true`)

Testadas num campo aberto com `arenaEm(id, { sala, area, posicoes })`, que desloca todas as posições. Quem construir a
região troca `sala`, `area` e `posicoes` pelos do mapa novo.

- **Brás — A Roda** (Lutador, 14×12): plateia nos quatro lados, berimbau a 96 bpm (golpe no tempo ×1,3), quatro
  tablados que racham, corda do ringue que lança. Fase 2: "A roda fechou!", 120 bpm, corda ×1,8. Final: São Bento Grande, 132 bpm.
- **Graça — A Mina Velha** (Pedra, 16×12): desabamentos (pedra com sombra crescendo, deixa entulho que vira cobertura),
  cinco pilares que quebram, vagonetes em dois trilhos fixos. Fase 2: a mina treme (2–3 pedras). Dynamax do Lycanroc a 60%.
- **Celeste — Topo da Torre do Vento** (Voador, 16×13): cinco plataformas no céu e duas que andam, queda tira 12%,
  rajadas que empurram para fora. Fase 2: ventania com tornado (giro). Dynamax do Braviary na entrada.

## Elite e Campeã (ideias, uma por sala)

- **Aurélio, Madrugada (Sombrio)**: sala escura com estrelas no teto. Escuro total com holofotes que varrem (faixa de
  luz: dentro dela você vê e é visto), joias que brilham e atraem golpes (cobertura-isca), o Sombrio dele rouba o
  candelabro mais perto. Fase 2: as estrelas caem (marcas) e a sala só se ilumina no clarão.
- **Clarice, Manhã (Fada)**: flores e luz rosa, ela de patins. Canteiros que soltam pólen (zona que adormece, com
  aviso amarelo), pétalas em rajada, a própria Clarice patinando em volta como faixa móvel que a plateia aplaude. Fase 2:
  o sol nasce na janela e o chão vira campo de névoa (cura leve para quem fica parado).
- **Seu Brasa, Meio-dia (Fogo)**: chão de terra rachada e ar tremendo. Rachaduras que soltam gêiser de fogo em padrão
  (painéis), sol a pino que encolhe as sombras seguras (encolher ao contrário: só a sombra das pilastras é segura),
  pilastras de barro que quebram. Fase 2: o chão vira brasa e só as pedras ficam frias.
- **Iberê, Entardecer (Dragão)**: pôr do sol eterno. Cartas de Dragonite caindo do céu (marcas), vento de asa em faixa,
  pilares de pedra antiga. Fase 2: o sol desce e a sala alonga as sombras: a luz corta a arena em faixas que mudam.
- **Dalva, a Campeã (tudo)**: o salão leste com a janela clareando. Uma fase por hora do dia, na ordem da alvorada:
  madrugada (escuro e holofotes), manhã (pólen), meio-dia (gêiseres), entardecer (cartas e vento). Cada Pokémon dela
  traz a fase da hora dele; o ás (Volcarona) entra quando o sol nasce de vez: a janela abre e todas as peças valem
  juntas, em ritmo mais lento, com música própria.

## Interface para outros desenhos (ramo `visual3d`)

`g.arenaGinasio` existe só durante a luta do líder (null fora dela). Leitura por quadro, sem efeito colateral:

```js
const A = game.arenaGinasio;
A.estado() // →
{
  id, nome, tipo, nivel, dificuldade,             // dificuldade = d (0..1)
  fase: { i, id, nome, final } | null,
  area: { x0, y0, x1, y1, cx, cy },               // px do mundo (1 bloco = 16 px)
  cena: { resta, foco: { x, y } } | null,         // câmera da cena curta
  avisos: [{ id, forma, progresso (0..1), dur, cor, fonte,
             x, y, r | a, b, w | celulas | x0, y0, x1, y1, i?, dir? }],
  pecas: [{ id, tipo, ativo, ...estado da peça }], // ex.: inundacao { nivel, inundadas }, faixa { maquinas },
                                                   // cobertura { itens }, escuro { candelabros }, plataforma { barcos }
  ajudantes: [{ nome, x, y }],
}
const off = A.onEvento((ev) => {}); // ev.tipo: 'aviso' | 'golpe' | 'fase' | 'lider' | 'peca' | 'as' | 'poder' | 'fim'; ev.t = tempo da arena
```

Os desenhos 2D da arena ficam em `A.G0` (chão, embaixo das entidades), `A.G1` (topo) e em `A.gfxs` (objetos com y-sort);
um desenho 3D pode escondê-los e desenhar a partir de `estado()`. Mudanças de bloco (milho, barcos) vão para o mapa
pelo `setTile` normal e são desfeitas no fim.

## Teste

Estádios e contenção: `python3 tools/serve.py 8752` e `node tools/arenas-teste-3d.mjs todos` (ou nomes separados por
vírgula; `--paisagem` celular deitado 844×390, `--fotos` capturas em tools/shots, `--troca` joga o seu Pokémon contra
a borda e derruba ele duas vezes). A cada quadro confere que o treinador e todo Pokémon da luta estão dentro da arena
e que cada Pokémon que entra nasce dentro (violações têm de dar 0), se a luta foi ao estádio e voltou, e as setas.

Antigo (2D): `python3 tools/serve.py 8752` e `node tools/arenas-teste.mjs todos --fotos` (ou um nome; `--celular` para celular
simulado com CPU 4× mais lenta; `--vezes=N`). O robô (tools/arenas-bot.js) entra pelo controle: anda, mira, golpeia em
rodízio, reage aos avisos depois de 0,3 s e esquiva na hora certa com 85% de acerto. Nada de dano forçado.
