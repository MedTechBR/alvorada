# Revisão de bugs (18/10/2026)

Ramo `revisao-bugs` (a partir de `main`, com o movimento em grade já mesclado). Jogado no Chrome sem interface com GPU, no celular simulado
(740×360 e 844×390, toque, CPU 4× mais lenta nas medidas de desempenho) e no computador (1280×720), em 3D (padrão) e em `?visual=2d`.
Ajudantes novos: `tools/teste-3d/rb-lib.mjs` (abre o jogo em modo teste no tamanho pedido, com capturas e `LAT=<ms>` para simular rede lenta).
As capturas ficam em `tools/shots/rb/` (fora do git); as que provam as correções estão em `docs/revisao-bugs/`.

Gravidade: **bloqueia** (impede de jogar), **ruim** (atrapalha ou quebra algo), **cosmético**.

## Resumo

| | achados | corrigidos | em aberto |
|---|---|---|---|
| bloqueia | 0 | 0 | 0 |
| ruim | 4 | 3 | 1 |
| cosmético | 7 | 3 | 4 |

## Corrigidos

### 1. Golpes de terra (Terremoto, Escavar…) lançavam TypeError em batalha. Ruim
- **Passos:** qualquer Pokémon usa um golpe do tipo Terra com raio ≥ 12 px (ex.: Rota 2, selvagem, `combat.arena.blast(x, y, 24, { type: 'ground' })`).
- **Captura:** console: `TypeError: this.vivo?.fendas is not a function at Arena.blast (arena.js:133)`, dentro de `Game.frame` (aparecia no teste de desmaio da equipe).
- **Causa:** em `src/world/vivo.js` a lista de fendas (`this.fendas = []`) tinha o mesmo nome do método `fendas(x, y, r)`; o campo da instância escondia o método.
- **Correção:** a lista passou a se chamar `listaFendas`. Varredura com os 827 golpes do jogo depois disso: nenhum erro no console. Commit "Terremoto, Escavar e golpes de terra travavam…".

### 2. Mais selvagens que o limite (até 9 juntos, 13 no total) com rede lenta. Ruim
- **Passos:** `LAT=1500 node …densidade` (ou jogar com internet fraca): ficar parado na Rota 1 por ~80 s. Antes: máx. 9 vivos, 5 a menos de 16 blocos; depois: máx. 4 vivos.
- **Causa:** `spawnWild` é assíncrono (espera o sprite baixar). O sorteio de 4–7 s reiniciava, mas a checagem de `WILD_MAX` só valia na hora de começar, então vários nasciam ao mesmo tempo quando os sprites chegavam.
- **Correção (`src/main.js`):** um nascimento por vez (`spawnPend`) e nova conferência depois do `await w.ready` (descarta se a área já encheu, com folga de 2 para o bando do alfa). Restam fontes que contam à parte e são raras: bando do alfa (alfa + 1 ou 2), Pokémon que caem de árvore ou saem do mato cortado (teto 12), aves nos telhados da vila (máx. 2).

### 3. Moradores e personagens nascendo em cima de poste, banco, palmeira ou água. Ruim
- **Passos:** Cidade Campina, `guia_gym` em cima de um poste e `vovo_camp` em cima de um banco; Cidade Coral, `coral_velho` na palmeira; Ilha Jandaia, `ij_bia` no coqueiro; Rota 5, o Pescador Guto na água (varredura de todos os moradores, NPCs e atores contra `map.solidAt`).
- **Causa:** as posições vêm direto do JSON/spots e ninguém conferia se o bloco é livre. Com a grade, o jogador não pode chegar nem falar com quem está dentro de um bloco sólido.
- **Correção:** `GameMap.livreMaisPerto()` (`src/world/map.js`), usado em `people.js` e `roteiro.js` (atores com `spot`). Balcão e mesa dentro das salas ficam como estão (o atendente fica atrás do balcão de propósito). Depois da correção só sobram atendentes em balcões e o `hospede_1`/`benta` em mesas.

### 4. Marcador do objetivo dentro de uma sala apontava para o mapa lá fora. Cosmético
- **Passos:** entrar numa casa, Centro ou laboratório com um objetivo ativo: a seta/diamante mostrava "649 m" (as salas ficam numa faixa longe do mapa de fora).
- **Causa:** `Hud.frame` comparava a posição do jogador na faixa das salas com o alvo no mapa externo (mesmo tipo de erro do bug do laboratório na regra "sem Pokémon não sai da vila").
- **Correção (`src/ui/hud.js`):** `#alvoNaTela`: de dentro, o marcador aponta a porta de saída da sala; de fora, a porta da sala onde está o alvo. Captura: `docs/revisao-bugs/marcador-dentro.jpg`.
- **Auditoria das outras regras de distância contra pontos do mapa externo:** `story.js` (sair da vila, já corrigido), música (`#music`: sala usa o bioma da sala), chegada a Campina (só dispara de fora), `battle.js` (fuga a 26 blocos do treinador, vale dentro do ginásio), `life.js`/`main.js` (selvagens somem a 30/44 blocos, aceitável depois de entrar numa sala). Nada mais quebrava em interiores.

### 5. Partículas de ambiente no 3D ignoravam a região (pétalas na neve). Cosmético
- **Passos:** Vila Geada: pétalas rosa e folhas caindo na neve (a vila tem bioma `vila`, e o filtro olhava só o bioma da área).
- **Correção (`src/visual3d/ceu.js`, `ambiente/particulas.js`):** a região manda. Geada: neve; Brasas (e vulcão, termas): cinzas e, no vulcão, brasas subindo; Sertão: poeira dourada, sem folhas nem pétalas; Jandaias, praia, mangue, selva: sem pétalas; pétalas só em campo, floresta, vila, margem, pampa e planalto. Três tipos novos (neve, cinzas, brasas) só ligam quando o bioma pede. Conferido em 12 lugares. Capturas: `geada-antes.jpg`, `geada-depois.jpg`, `brasas-depois.jpg`.

### 6. Feixe de sol deixava o boneco branco dentro das salas. Cosmético
- **Passos:** entrar em qualquer sala com janela (Centro, Mercado): quem ficava na faixa de luz virava uma silhueta branca, sem cor.
- **Causa:** os dois planos aditivos do feixe (`salas.js luzDasJanelas`) são desenhados depois dos sprites e passam na frente deles.
- **Correção:** ficam só as manchas no piso. Capturas: `centro-feixe-antes.jpg`, `centro-feixe-depois.jpg`.

### 7. `tools/arenas-teste-3d.mjs` não achava os ajudantes. Ferramenta
- Importa `jornadas-teste.js` e `arenas-bot.js` pela origem da página. (Rodar várias cópias do Chrome ao mesmo tempo fazia o jogo não carregar a tempo; rode um teste por vez.)

## Em aberto (com sugestão)

### A. Morador parado em sala às vezes não aparece. Ruim
- **Passos:** `rb-lib` → teleportar para `dentro_centro_campina`, esperar 3 s: "Treinadora Ana" (`ana`, folha `npc_123_magnus`) fica sem corpo, só sombra e balão de fala. Em outra rodada, antes da mescla da grade, também sumiam a enfermeira e o vendedor do Mercado de Campina; depois da mescla a enfermeira e o vendedor passaram a aparecer, a Ana continua variando.
- **Captura:** `docs/revisao-bugs/ana-invisivel.jpg`.
- **O que já foi descartado:** o corpo está em `pers.corpos` com a textura carregada, `view.visible`, `alpha` e posição corretos, folha sem problema, não é objeto com modelo 3D (`donosDeSprite`). Parece o quadro não sendo desenhado em alguns quadros/posições (suspeita: ordem/profundidade do lote de sprites HGSS ou mato alto em volta). Precisa de alguém com o depurador do three: comparar o quadro enviado ao `Lote` com o que o `Lote` desenha.

### B. Poste marrom sob a montaria voadora. Cosmético
- Visto uma vez em `cenas.mjs voar` e em dois pontos da Vila (um bloco de ~16 px de largura do chão até o Corviknight); não reproduziu depois. Provável sombra ou plano de relevo esticado enquanto a montaria sobe. Capturas em `tools/shots/cena-voar.jpg`, `tools/shots/rb/voar-A.jpg` e `voar-B.jpg`.

### C. Dynamax pouco gigante. Cosmético / decisão
- `PK_MAX = 64` limita a altura: o Charmander em Dynamax fica só ~2× o normal (`tools/shots/cena-dynamax.jpg`). Sugestão: no Dynamax subir o teto para ~110 px só enquanto dura.

### D. Ícone igual para vários remédios na loja e retratos em silhueta no menu. Cosmético
- Poção, Antídoto, Antiparalisia, Despertar e Antiqueimadura usam o mesmo frasco roxo (`loja-qtd`). No menu Pokémon e no PC os retratos aparecem como silhueta até o sprite baixar (com rede lenta demora vários segundos); ao baixar, atualizam. Sugestão: ícones por item e retrato guardado no save.

### E. Movimento em grade: números diferentes do esperado pelo teste do outro ramo. Para o agente do movimento
- Em `tools/teste-3d/grade.mjs` (computador): "toque de frente: andou 0 blocos, esperado -1", "correr 750 ms: 4 blocos, esperado 6", velocidade andando 100 px/s (esperado 64). Medido à parte (`rb`: segurar D por 1,5 s na Vila): andando 7,7 blocos (CPU 1×) e 6,4 (CPU 6×); correndo ~17 blocos (≈11 blocos/s, o comentário de `grade.js` diz ~8). O passo fica dentro da grade em 8 lugares, sem ficar em bloco sólido nem fora do centro (bot de 70 toques aleatórios por lugar: Rota 1, Vila, casa, Vila Geada, Caverna de Gelo, lago congelado, geleira, Centro). O gelo desliza e termina no centro. Sugestão: conferir a velocidade de corrida real contra `VEL.corre` e o teste de "toque de frente".
- Moradores: 3 vilas observadas por 40 s cada, nenhum deslocamento diagonal em morador parado; o empurrão de `map.resolve` só age nos Pokémon de passeio (`people.js #updatePet`), que seguem em movimento livre.

## O que foi conferido e está bom

- Jogo novo até a primeira batalha (`primeira-batalha.mjs`, celular 740×360): rival vencido em 115 s, console limpo. Revisão do celular (`revisao-celular.mjs`): conta, criador, salvar, recarregar e "Continuar" voltam ao mesmo lugar e à mesma equipe.
- Escala dos Pokémon no 3D (PK_3D/PK_MAX): Caterpie, Pikachu, Eevee, Snorlax, Onix, Gyarados, Wailord, Mewtwo, Rayquaza, Tyranitar, Metagross lado a lado: todos reconhecíveis e proporcionais ao treinador. Alfa, Dynamax e montarias (correr, nadar, escalar, voar, mergulhar) desenham certo.
- 165 salas: todas com entrada e saída, exceto andares de masmorra que se ligam por escada; nenhum destino de porta num bloco sólido (os de escada caem num bloco livre ao lado).
- Cura (Centros de Campina, Porto, Coral, Aurora, Lamparina, Jandaia), compra e venda no Mercado, PC (equipe e caixa), desmaio de toda a equipe (volta ao Centro com PS cheio).
- Menus (equipe, montarias, mochila, Pokédex, missões, mapa, treinador, opções) sem estourar a tela nem erro de console em 740×360.
- 827 golpes usados em campo, 0 erros de console depois da correção 1. Arena de ginásio Tomé vencida pelo robô, 0 golpes sem aviso.
- Desempenho no celular simulado (844×390, CPU 4×, sem limite de quadros): Vila Alvorada p95 42 ms (primeiro carregamento tem um engasgo de 1,7 s), Campina p95 32 ms, Rota 2 com 4 selvagens p95 29 ms, batalha com 4 selvagens p95 29 ms, interior p95 6 ms.
- `?visual=2d`: Vila, Rota 2, Geada (com neve), Brasas e Centro sem erro no console.
