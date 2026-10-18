# Jornadas (mundo aberto)

Pokémon Alvorada não tem mais capítulos em ordem. Depois do primeiro Pokémon a região inteira fica livre: o jogador
vai aonde quiser e enfrenta os ginásios na ordem que quiser, desde que consiga vencer. Os únicos limites são o
terreno (água pede um Pokémon que nade, paredão pede um que escale…) e a força dos selvagens e treinadores de cada
lugar.

A história vira **jornadas**:

- **Jornada de cidade**: o arco local de cada cidade e o ginásio dela. Começa quando o jogador chega lá (ou numa cena
  de lugar do caminho, como a ponte da Rota 3), em qualquer ordem, com o cartão "Jornada: <nome>".
- **Trama principal** ("O sol atrasado", Equipe Crepúsculo e Companhia Aurora): avança por **marcos** — o número de
  insígnias (de qualquer ginásio) e lugares-chave já visitados. Arquivo: `src/story/script/trama.js`.

Código: `src/story/jornadas.js` (definições, estado, objetivo do painel, lista do diário e conversão de save antigo),
`src/story/roteiro.js` (motor das cenas) e `src/story/story.js` (abertura e Cidade Campina).

## As jornadas

| id | Nome | Cidade | Arquivo de cenas | Começa em | Termina |
|---|---|---|---|---|---|
| `alvorada` | O primeiro alvorecer | Vila Alvorada | `story.js` | o começo do jogo | presentes do professor (`balls`) |
| `campina` | Colheita em Campina | Cidade Campina | `story.js` + `quests.js` | `cidade_campina` (ou a Fazenda do Tomé) | Insígnia Espiga |
| `sussurro` | Sussurros no bosque | Vila Sussurro | `cap02.js` | Bosque Sussurrante, Vila Sussurro, Toca do Absol | chamada da Bia depois da Lia |
| `espelho` | O espelho partido | Porto Espelho | `cap03.js` | ponte da Rota 3, Porto Espelho | chamada do professor depois da Marina |
| `coral` | Faísca na Costa Coral | Cidade Coral | `cap04.js` | Rio Lúmen, Cidade Coral, Praia dos Corais | chamada da Bia depois da praia |
| `lamparina` | A noite que não acaba | Vila Lamparina | `cap05.js` | Brejo, Vila Lamparina, cemitério, casarão | chamada da Pipa depois da Zélia |
| `aurora` | O preço da luz | Cidade Aurora | `cap06.js` | Rota 6 (torres), Cidade Aurora | a Pipa na redação |
| `trama` | O sol atrasado | Alvorada | `trama.js` | primeiro marco | (Liga, com as 8 insígnias) |

Cada arquivo de cenas declara `jornada: '<id>'`. Uma cena pode trocar (`jornada: 'campina'` na visita à Fazenda) ou
ficar solta (`solta: true`: missões secundárias como a casa dos Solano). Cenas de lugar (`entrar`, `pisar`, `flag`) e
cenas que dão objetivo começam a jornada delas; a cena final usa `depois.fimJornada: true` (faixa "Jornada concluída").

## Marcos da trama

| Marco | O que acontece |
|---|---|
| 1 insígnia | o professor liga (o Absol do bosque, a capa roxa), rádio das 6h19 |
| 2 insígnias | rádio das 6h28; a Mãe tem bolo (fala da Noite Longa conforme o jogador já ouviu a Vó Benta); **revanche do Téo** |
| 3 insígnias | rádio das 6h40 (a festa da Aurora em Coral, ou o farol que pisca errado) |
| 4 insígnias | rádio das 6h55; **a Pipa liga** (se o jogador ainda não foi a Cidade Aurora); **2ª revanche do Téo** |
| 5 insígnias | rádio das 7h12 (o comunicado da Aurora) |
| 6 insígnias | rádio das 7h31 (o Arquivo do Forte); **3ª revanche do Téo** (com raiva, se já souber da mina) |
| 8 insígnias | a Liga Alvorada abre (é o único requisito da Liga) |
| lugares-chave | Equipe Crepúsculo encontrada (bosque, Porto Espelho, praia, cemitério); a verdade da Mina Aurora (`reviravolta1`) muda as falas do Téo, da rádio e da Pipa |

**Téo:** a revanche acontece na próxima cidade em que o jogador entrar depois do marco (em Cidade Coral, no calçadão,
depois do discurso do Solano). A equipe sobe com o marco, no passo da escada dos ginásios: 2 insígnias ás nível 17,
4 insígnias 23, 6 insígnias 30. Perder não trava nada (`perder: 'continua'`).

**Falas que se adaptam:** uma fala pode ter condição própria, `[quem, texto, { requer, semFlag }]`. Flags especiais:
`insignias>=N` / `insignias<N` / `insignias==N` (número de insígnias), `item.<id>` (item na mochila) e
`jornadas.<id>.feita`. Variáveis de texto: `{insignias}` (número) e `{insignias_ext}` (por extenso: "duas").

## Escada dos ginásios (dificuldade por lugar)

Nível fixo pelo lugar, pela distância real no mapa desde a casa do jogador mais o custo do terreno
(`docs/mundo-expandido.md`, seção 8). As tabelas de selvagens do mapa seguem o mesmo modelo (`src/data/habitats.js`).

| # | Ginásio | Líder | Caminho | Ás (placa "~nível") |
|---:|---|---|---|---:|
| 1 | Cidade Coral | Jonas (Elétrico) | escadaria do Mirante, logo ao sul da vila | 11 |
| 2 | Porto Espelho | Marina (Água) | Rota 3, a leste | 15 |
| 3 | Cidade Campina | Tomé (Normal) | Rota 1, a oeste | 16 |
| 4 | Vila Lamparina | Dona Zélia (Fantasma) | Brejo das Lamparinas (nadar ou tábuas de luz) | 20 |
| 5 | Vila Sussurro | Lia (Inseto) | depois de Campina, Rota 2 e o Bosque | 21 |

A Mina Aurora é uma dungeon: cada andar é mais forte (selvagens 27 a 38, Steelix Alfa 35); a Torre e a Rota 6 ficam
em 19 a 26. A placa na entrada de cada ginásio diz "Força: equipes de nível ~N"; o painel sugere o ginásio mais fraco
que falta quando nenhuma jornada está em andamento; o professor dá a mesma dica.

Não existe limite de obediência por insígnia. O que depende de insígnia conta o **número** delas (estoque do Mercado,
marcos da trama, Mantine do Seu Nestor).

## Montarias por capacidade

`src/world/mounts.js`: um modo fica liberado assim que o jogador tem, na equipe ou no PC, qualquer Pokémon que sirva
para ele (`src/data/montarias.js`), ou quando ganha a montaria da história daquele modo:

| Modo | Montaria da história | Outras formas |
|---|---|---|
| Correr | Mudbray "Paçoca", do professor, logo depois do inicial | Mudbray na Rota 2, e as outras espécies que correm |
| Nadar | Lapras "Bruma", da Marina | Gyarados (Lago Espelho), Floatzel (Rota 4), Starmie (Praia dos Corais)… |
| Escalar | — | Heracross (Bosque), Machoke e Sneasler (Rota 7), Absol… |
| Voar | — | Corviknight (Rota 6), e as evoluções de Rookidee, Pidgey, Starly… |
| Mergulhar | Mantine "Maré", do Seu Nestor (Insígnia Gota + 4 insígnias) | Mantine (Praia dos Corais), Gyarados… |

Sem a montaria da história, vai o Pokémon do jogador que serve (o mais rápido de pé). O aviso "Nova montaria"
aparece ao capturar o primeiro Pokémon de um modo. `game.mount.padrao(modo)` diz se há montaria da história.

## Interface para o diário (aba "Jornadas")

```js
game.jornadas.lista()      // também em story.roteiro.jornadas
// → [{ id, nome, cidade, tipo, etapa, concluida, iniciada, acompanhada, nivel, etapas }]
//   id         'coral', 'trama'…
//   nome       'Faísca na Costa Coral'
//   cidade     'Cidade Coral' ('Alvorada' para a trama)
//   tipo       'cidade' | 'trama'
//   etapa      texto da etapa atual (o objetivo do painel daquela jornada), ou 'Jornada concluída'
//   concluida  true/false
//   iniciada   sempre true (só entram as jornadas já começadas; a trama entra depois do primeiro Pokémon)
//   acompanhada true se é a que o painel de objetivo mostra
//   nivel      força do ginásio da cidade (~nível do ás), ou null
//   etapas     [{ texto, feita, opcional }]
// Ordem: a trama primeiro; depois as em andamento (a mais recente antes) e por fim as concluídas.

game.jornadas.acompanhar(id) // o painel de objetivo passa a mostrar essa jornada
game.jornadas.acompanhada()  // a jornada mostrada no painel (ou null: aí o painel sugere um ginásio)
```

Estado no save: `flags.jornadas.<id> = { inicio, feita, t }`, `flags.objetivos.<id>` (objetivo de cada jornada) e
`flags.jornadaHud`. Para ligar uma missão secundária a uma jornada, uma cena pode gravar `flags.<missão> = 'ativa'`
(o motor de missões grava `'completa'`).

## Save antigo

`migrarSave()` (em `jornadas.js`, chamado pelo roteiro sempre que o objeto de flags muda, ao carregar) converte um save
do tempo dos capítulos:

- cada capítulo vivido vira a jornada da cidade dele (concluída se havia `chNDone`); Campina, pela flag `campina`;
- o objetivo do capítulo em andamento (`flags.objetivo`) vira o objetivo da jornada daquela cidade;
- os marcos da trama que já passaram (chamada do professor, rádios até o número de insígnias, bolo da Mãe, revanche
  do Téo, chamada da Pipa) ficam marcados como vistos;
- quem ainda não tinha a Mudbray (save no meio do capítulo 1) ganha a montaria Correr.

As flags antigas (`chapter`, `chNDone`) continuam no save, mas nada mais as lê.

## Testar

Com o servidor (`python3 tools/serve.py 8747`) e `?teste=1`: no console, `await import('/tools/jornadas-teste.js')`,
`motor(); lutar();` (o jogo anda e as falas passam sozinhas, guardadas em `falas`; `lutar` faz o Pokémon do jogador
atacar de verdade), `tp(bx, by)`, `falar('<id do ator>')`, `ate(fn, s)`.
