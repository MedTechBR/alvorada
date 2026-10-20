# Revisão de diálogos (branch dialogos-e)

Pedido do Matheus: "muitas frases nem fazem sentido ou não conversam com as frases anteriores. A história precisa ser
envolvente e fazer sentido, com diálogos conversando entre si."

Escopo: só texto. Nenhum id, flag, condição, posição, recompensa, passo de missão ou nível foi alterado. Sem emoji e sem
travessão em fala. Fonte da história: `docs/jornada-classica.md` e, por capítulo, `docs/jornada-roteiro.md`.

Testes (todos passam no fim): `verificar_dados`, `teste-jornada`, `teste-jornada-completa`, `auditar-obtencao`,
`auditar-solidos`, `vestir --verificar`.

## Commits e o que cada um cobre

| Commit | Grupo | Arquivos | Trocas (aprox.) |
|---|---|---|---|
| d4b55077 | Missões de Alvorada, Campina, Sussurro, Espelho e Coral | `missoes/regiao-alvorada.js`, `regiao-campina.js`, `regiao-sussurro.js`, `regiao-espelho.js`, `regiao-sul.js` | ~108 strings |
| af0de5e7 | Missões e moradores de Jandaias, Brasas e Geada | `missoes/regiao-jandaia.js`, `regiao-brasas.js`, `regiao-geada.js` | ~155 strings |
| c8b39180 | Missão do anel e moradores/treinadores do Sertão | `missoes/regiao-sertao.js` | ~175 strings |
| f6ee53ca | Moradores de Alvorada, Ocaso, Núcleo e Austral | `assets/maps/alvorada.json`, `ocaso/leste.json`, `regioes/nucleo.json`, `tools/gerar-regioes.mjs` | ~40 strings, 3 nomes |
| f83a3e5b | Moradores de Brasas, Geada, Jandaias e Sertão | `assets/maps/regioes/geada.json`, `sertao.json`, `brasas.json`, `jandaia.json` + geradores em `tools/` | ~70 falas (inclui 37 treinadores da Geada) |
| d17cadba | Falas de elenco, moradores e treinadores de rota | `src/story/elenco.js`, `elenco-jandaia.js` | ~160 strings |
| bdcab208 | Falas de interiores e textos de móveis | `src/world/interiores.js`, `src/world/receitas.js` | ~14 strings |
| d98ecae4 | Barreiras e falas de lendários | `src/world/barreiras-dados.js`, `src/data/lendarios.js` | 17 `msg`, 29 intros e rumores |

Por grupo, o que foi feito:

### 1. Missões (11 do motor + 3 de cena)

Reescritas por completo (resumo, oferta, aceita, lembrete, etapas, conclusão): `sq_relogios`, `sq_tauros`, `sq_viola`,
`sq_solano`, `sq_ybi`, `sq_tapu_bulu`, `sq_sismografo`, `sq_heatran`, `sq_avalanche`, `sq_aurora_boreal`, `sq_hoopa`.
Missões de cena (`sq_pipoca`, `sq_garrafa`, `sq_diario_farol`): só resumo e textos das etapas, porque as falas ficam em
`src/story/jornada/*.js`, que não foi tocado.

Principais problemas corrigidos:
- `sq_relogios`: a oferta mandava ir "de manhã", mas a trava de horário já tinha sido removida. Agora manda ir à Lagoa
  Dourada e olhar o céu. A entrega do relógio do pai foi quebrada em caixas curtas e com lógica.
- `sq_viola`: a conclusão se contradizia ("eu toco de ouvido" depois de dar a viola). Agora o Juca diz que faz outra viola,
  que bate com o ofício dele.
- `sq_solano`: a Vó Benta agora liga o Augusto ao homem do rádio visto em Coral, sem spoiler da Aurora.
- `sq_tauros`: a pergunta vaga "Acha o quê?" virou uma instrução clara; a entrega ao Seu Bento ganhou sequência.
- `sq_ybi`, `sq_tapu_bulu`: a oferta do decalque era confusa; a entrega explicava "Eu sei de quem é a casa" sem contexto.
- `sq_sismografo`: a oferta liga com a cena anterior (o Ébano tentou acordar o vulcão); Jaciara empurra para a missão seguinte.
- `sq_avalanche`: Bruno e Clara se contradiziam sobre a briga; a fala da Dona Inês contradizia o Jacinto.
- `sq_diario_farol`: o resumo dizia "quarenta anos", a cena diz "trinta". Virou "décadas".
- Sertão: `sq_hoopa` refeita na ordem do roteiro (riso, poço seco, seis anéis, espelho, Hoopa).
- Geada: os 33 treinadores tinham a fala de vitória reaproveitada como "depois". Cada um ganhou voz própria.

### 2. Moradores e NPCs de idle (mapas e elenco)

- Frases sobre missões removidas, "vá a qualquer ginásio", chat e multiplayer saíram. Exemplo: a banhista de Coral e o
  pescador de Campina, que citavam uma missão de "vença 3".
- O sol atrasado aparece em toda cidade com um detalhe concreto: Alvorada (Rita: o sol só apareceu às seis e onze),
  Campina (galo da feira canta atrasado), Lamparina (lampião apagado cada vez mais tarde), Sertão (mandacaru floresce de dia),
  Geada (o sol voltou a nascer na hora certa, depois do Relógio).
- Os líderes passaram a ser citados pelo nome nas cidades certas (Brás em Aurora, Lia em Sussurro, Zélia em Coral).
- Nomes repetidos ou que colidiam com personagens principais foram trocados (Dona Cida de Coral virou Marlene; Pescadora
  Iara virou Nalva; Barqueira Dalva virou Cora; Explorador Heitor virou Hermes; Patinador Ravi virou Rui; Alpinista Zélia
  virou Zilda; Pesquisador Tomé virou Teodoro).
- Não há spoiler: antes da Mina Aurora, ninguém culpa a Aurora. O editor do Jornal Farol passou de "o que a Pipa descobriu"
  para "o que a Pipa anda apurando".
- Treinadores de rota: as 14 falas idênticas de Rota 9 e Rota 11 viraram falas individuais; falas de Sertão e Geada
  ganharam voz própria. Treinadores do Sertão ganharam falas de abertura (1 a 2 linhas) e derrota.
- Elenco: falas de "após a vitória" que não respondiam ao resultado ganharam reação de derrota (Pescador Bigode, Nadadora Nara).

### 3. Interiores e móveis

Mudanças pequenas, porque quase não há enredo nesses arquivos: novas falas de TV e rádio ligadas ao sol atrasado; o vendedor
genérico ganhou duas linhas encadeadas; o clube de trocas do Centro Pokémon deixou de sugerir batalhas com amigos.

### 4. Barreiras e lendários

- As 17 `msg` de barreira agora dizem o motivo real: a mata perigosa até o Tomé, a ponte em reforma até a Lia, a correnteza
  de Jandaias até o Jonas, a tempestade do Planalto como efeito da Crepúsculo, e assim por diante.
- Os 29 lendários de pós-jogo que tinham a frase genérica ("O ar fica pesado. Algo antigo desperta.") agora têm intro própria
  por espécie (2 linhas) e um rumor específico, com lugar e detalhe concreto. Os rumores de Regigigas, Landorus e Tapu Koko
  também dizem o que é preciso fazer.

## Campos novos (atenção)

Dois grupos acrescentaram campos. O Matheus pediu só texto, então o ideal é revisar:
- `src/story/missoes/regiao-jandaia.js`: `aceita` em `sq_ybi` e `sq_tapu_bulu` (o motor trata como opcional).
- `src/story/missoes/regiao-sertao.js`: `derrota` nos 36 treinadores (o motor lê o campo em `npcs.js:104` e `motor.js:337`;
  sem ele, a fala de derrota cai no `vitoria`). Também `sq_hoopa` não tem `aceita` nem `conclusao`.
- `regiao-sertao.js` foi regravado com `JSON.stringify`; o agente conferiu que o round-trip saiu idêntico ao original antes
  de trocar o texto.

## O que o texto não resolve (pendências para o Matheus)

1. **Geradores (alinhados na etapa 2 da revisão).**
   - `src/story/elenco-jandaia.js`: `tools/regioes/jandaia-treinadores.mjs` agora tem as falas revisadas (`apos`) e reproduz
     o arquivo exatamente (conferido).
   - `src/story/missoes/regiao-sertao.js`: `tools/regioes/sertao-missoes.py` (chamado por `gerar-sertao.py`) aplica por cima
     o `tools/regioes/sertao-dialogos.json` (missão do anel, falas de treinadores, Zuleica) e reproduz o arquivo exatamente.
     Edite os textos nesse JSON.
   - `tools/brasas/povoado.py`, `tools/regioes/jandaia-vila.mjs`, `sertao-cidades.py`, `sertao-missoes.py`, `sertao-ruinas.py`
     e `tools/gerar-regioes.mjs` já carregam as falas novas. Os mapas gerados (`jandaia.json`, `sertao.json`) divergiram em
     estrutura (salas, objetos) por outros trabalhos, então **não regenerar os JSON de mapa sem revisar o diff**.
   - Textos que só existem no JSON (sem gerador; não regenerar nem sobrescrever):
     `assets/maps/alvorada.json` (todos os moradores revisados); `assets/maps/regioes/nucleo.json` (placas de Rota 6, Roda
     de Capoeira, Mina Velha, Torre do Vento e as salas da Elite/Campeã); `assets/maps/regioes/geada.json` (todos os
     moradores e treinadores, incluindo a Dona Inês e o mural); `assets/maps/regioes/brasas.json` (rumor do Templo da Chama
     e a cratera do Tição); `assets/maps/regioes/jandaia.json` (rumores do guardião da selva e da gente de preto no Templo
     das Raízes); `assets/maps/ocaso/leste.json` (1 fala).
2. **Rumores nunca são ditos.** Em `lendarios.js`, `rumorCidade` está `null` nas 29 entradas reescritas, então nenhum morador
   fala o rumor no jogo. Falta o id da cidade em cada entrada (lógica, não texto).
3. **22 lendários de pós-jogo continuam sem texto.** Kyogre, Groudon, Rayquaza, Lugia, Mewtwo, Arceus e outros (lista
   completa no relatório do agente) têm `falas: []` e `rumor: ""`. Não estavam no pedido, mas se a caixa aparecer vazia
   precisam de texto.
4. **Falas de cidade com template.** As falas de morador geradas em `interiores.js` (`falas()`) dependem de `cidades.js` e de
   `docs/mundo-expandido.json` (campos `boatos`, `dentro`, `moradores`). A fala "Já foi ao ginásio?" aparece em qualquer casa,
   mesmo para quem acabou de chegar. O pool do morador `jovem` não depende do progresso.
5. **Clube de trocas.** O móvel `counterTroca` ainda existe, apesar de a troca online ter saído. O texto foi ajustado; o móvel
   sairia pela lógica.
6. **Flags de cidade (resolvido).** `cap456` e `cap456b` só aparecem como chave de objetos de cenário em `alvorada.json`
   (placas, casas, postes, barracas). Nenhum NPC usa essas chaves e nada no jogo as lê, então não afetam o aparecimento
   de ninguém. Ficam como dado morto; `assets/maps/LEIAME.md` ainda as descreve.
7. **Ids repetidos entre mapas.** `seu_ze`, `juca`, `quinzinho`, `rita` e outros aparecem em `assets/maps/alvorada.json` sem
   pertencer a essa cidade. As falas novas assumem o contexto de cada missão.
8. **Falas de elenco sem uso.** `padrao` em `pipa_cidade`, `pipa_redacao`, `teo_mina`, `heitor_mina`, `heitor_torre`,
   `lucio_elevador` e `duskull_solano` está em `MOSTRAR_ANTIGO` e não aparece no mapa. Essas falas ainda citam flags antigas.
9. **Condição frouxa.** `sq_aurora_boreal` tem `requer: { insignias: 2 }`, mas Geada fica depois do Relógio. Não é do texto.
10. **Nomes duplicados.** "Tiago" é o treinador da Rota 1 e também o irmão do Augusto na Lamparina. "Surfista Lúcio" e
    "Guarda Dora" também colidem. Vale renomear em um dos lados.
11. **Cenas da história.** As falas de `sq_pipoca`, `sq_garrafa` e `sq_diario_farol` ficam em `src/story/jornada/*.js`, que
    não foram editadas. Confirmar se batem com os textos novos de etapa e com a recompensa (o bilhete do Heitor).

## Rodada 2 (correções pedidas pelo coordenador)

- **Rumores:** `rumorCidade` agora é id real de cidade nos 51 lendários (29 reescritos e 22 novos). Os 22 que estavam
  vazios ganharam intro e rumor. O rumor aparece em dois lugares: na Pokédex, como "Pista:", e agora também na conversa
  com um morador da cidade (o primeiro adulto da primeira casa gerada, em `src/world/interiores.js` e `src/world/people.js`).
  O rumor só é dito enquanto o lendário não foi resolvido e enquanto as flags de `requer` estão setadas.
- **Geradores:** `tools/regioes/jandaia-treinadores.mjs` reproduz `elenco-jandaia.js`. Os textos de Sertão, que estavam
  só no gerador, foram levados para `tools/regioes/sertao-dialogos.json`, lido por `sertao-missoes.py`.
  O cabeçalho de `regiao-sertao.js` aponta para esse JSON. Os textos que ficaram só no JSON (alvorada, placas do
  núcleo, geada inteira, dois rumores de brasas e de jandaias, uma fala de ocaso/leste) não devem ser regenerados.
- **Nomes repetidos:** Tiago (Rota 1) virou Rafa; Surfista Lúcio virou Surfista Zeno; Guarda Dora virou Guarda Ênio;
  Alpinista Zélia virou Alpinista Berta; Catador Lúcio virou Catador Edson; Cangaceira Dalva virou Cangaceira Maura;
  Ciclista Tomé virou Ciclista Rômulo. Os ids não mudaram.
- **sq_aurora_boreal:** `requer: { insignias: 2 }` virou `requer: { flags: ['relogio_vencido'] }`, flag setada depois
  do Necrozma e das oito insígnias (`src/story/jornada/12-relogio.js`).
