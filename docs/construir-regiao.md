# Como construir uma região

Manual curto para quem vai desenhar uma região do mundo grande. Plano completo: `docs/mundo-expandido.md` (seções 4 a
7, 10 e 11) e `docs/mundo-expandido.json` (áreas com `rect`, `bioma` e `id`; cidades com os prédios). Formato do mapa:
`assets/maps/LEIAME.md` (blocos, objetos, biomas, **masmorras**: placas, alavancas, portões, sala escura, buracos,
`mecanismos`, `enigmas`, warps com `requer`). Missões: `docs/missoes.md`.

## Onde está o seu arquivo

| Região | Arquivo | Mundo | Retângulo [x, y, w, h] | Faixa de interiores | Forma regional |
|---|---|---|---|---|---|
| Núcleo (acréscimos) | `assets/maps/regioes/nucleo.json` | alvorada | [0, 0, 600, 480] | [0, 960, 1200, 320] | — |
| Cordilheira Geada | `assets/maps/regioes/geada.json` | alvorada | [600, 0, 600, 200] | [0, 1280, 1200, 160] | — |
| Sertão do Levante | `assets/maps/regioes/sertao.json` | alvorada | [600, 200, 600, 280] | [0, 1440, 1200, 160] | — |
| Arquipélago das Jandaias | `assets/maps/regioes/jandaia.json` | alvorada | [0, 480, 400, 480] | [0, 1600, 1200, 160] | alola |
| Mar do Sul e Ilhas Austrais | `assets/maps/regioes/austral.json` | alvorada | [400, 480, 400, 480] | [0, 1760, 1200, 160] | — |
| Arquipélago das Brasas | `assets/maps/regioes/brasas.json` | alvorada | [800, 480, 400, 480] | [0, 1920, 1200, 160] | — |
| Ocaso Leste | `assets/maps/ocaso/leste.json` | ocaso | [480, 0, 480, 720] | [0, 720, 960, 160] | hisui |
| Ocaso Oeste | `assets/maps/ocaso/oeste.json` | ocaso | [0, 0, 480, 720] | [0, 880, 960, 160] | hisui |

O arquivo já existe com o ponto de partida (gerado por `node tools/gerar-regioes.mjs`): contorno de terra e mar, o chão
de cada área pelo bioma, as passagens, as áreas com os ids do plano, um Ninho por cidade e, onde há, o cais.
**Edite só o seu arquivo.** Não mexa em `alvorada.json`, `esboco.json` nem nos arquivos dos outros.

## Regras que o motor garante (e as que são suas)

- Coordenadas **absolutas** do mundo lá fora. Pintar fora do seu retângulo não tem efeito (o motor recorta) e o
  console avisa objeto ou área fora dele. A sua região tem semente de ruído própria: nada do que você fizer muda as
  outras.
- **Salas**: ponha em `interiors` sem `x`/`y` e o motor aloca na sua faixa, sem encostar em nenhuma outra. Com `x`/`y`,
  eles são relativos à sua faixa. Tudo dentro da sala (objetos, moradores, pontos, itens, warps) usa coordenadas da
  sala. Para ligar salas entre si use `["outra_sala", x, y]` ou um ponto com nome, nunca a coordenada absoluta.
- **Prédios**: todo prédio com porta e sem `"to"` ganha interior gerado (casa, sobrado, loja, Centro, oficina…), sempre o
  mesmo pela posição. Para fazer à mão, crie a sala e ponha `"to": "<id>"`. Para usar o nome e o conteúdo do plano,
  `"predio": "<id do plano>"`. Para um NPC de missão morar numa casa gerada:
  `"interior": { "npc": { "id": "sr_fulano", "name": "Seu Fulano", "look": "montanhista", "lines": ["…"] } }`.
- **Passagens** (seção 5 do plano): já pintadas do seu lado no ponto de partida. Não as feche; deixe 4 blocos livres de
  cada lado e água funda nas 4 linhas/colunas da divisa de mar.
- **Selvagens**: use os ids de área do plano; o motor lê a tabela de `src/data/habitats.js` (dia, noite, formas) pelo id
  da área ou da sala. Só ponha `encounters` se quiser trocar a do plano.
- Toda área com montaria em `acesso` mostra o obstáculo antes (trepadeira, redemoinho, neve funda, lama).
- Pontos com nome (`spots`) são globais no mundo: prefixe com algo seu (`geada_…`). O console avisa repetido.
- Tocas de Luz da região: `"tocas": [{ "id", "x", "y", "gmax": [...] }]` no seu arquivo (`src/data/tocas.js` explica).

## Checklist de uma região pronta

- [ ] Terreno de cada área do plano, com o bioma certo (`areas[].biome`) e os ids do plano.
- [ ] Cada cidade e vila: todos os prédios da seção 10 (com interior: gerado, `predio` ou à mão), um **Centro Pokémon**
      (id começando com `centro_` para o desmaio voltar a ele), um **Mercado** e o **Ninho de pouso** (`ninhos`).
- [ ] Moradores da seção 10 com as falas e os ids que as missões usam.
- [ ] Cavernas, templos e dungeons da seção 11 como salas na sua faixa, ligadas por warps; andares mais fundos mais
      fortes (`encounters` vêm do plano por id: `caverna_gelo_1`, `caverna_gelo_2`…).
- [ ] Obstáculos de montaria antes de cada área que pede montaria.
- [ ] Passagens abertas e conferidas a pé ou nadando (`caminho()` abaixo).
- [ ] Missões da região: `src/story/missoes/regiao-<id>.js` (exporta `MISSOES`, `NPCS`, `ITENS`) e uma linha em
      `src/story/missoes/index.js` (`import * as <id> from './regiao-<id>.js'` e o nome na lista `REGIOES`). Formato em
      `docs/missoes.md`. Coordenadas de etapa (`x`, `y`) no Ocaso levam `"mundo": "ocaso"`.
- [ ] Navios, balsas e trens da região: morador com `"viagem": "<id>"` e a viagem em `viagens` (formato no LEIAME,
      seção Viagens). O cais de chegada é um ponto com nome.
- [ ] Console sem erros nem avisos `mapa:` com `?teste=1`.

## Testar só a sua região

```
cd ~/Documents/Claude/pokemon-2d/<sua pasta> && python3 tools/serve.py 8748
```

- `http://localhost:8748/index.html?teste=1&ir=<lugar>` começa direto lá, em qualquer mundo: um ponto com nome
  (`?ir=porto_rubro_cais`), uma área do plano (`?ir=vila_geada`), uma sala (`?ir=caverna_gelo_1`), um bloco
  (`?ir=700,120`) ou `?ir=ocaso:640,300`. `?mundo=ocaso` abre o Ocaso. `?teste=1` libera o voo (tecla V).
- No console: `await import('/tools/mundo-teste.js')` dá `vista('nome', x, y, zoom)` (captura num bloco),
  `recorte('nome', x, y, w, h, k)` (o mapa de um retângulo, k px por bloco) e `mapaInteiro('nome', 1)`; as capturas vão
  para `tools/shots/`. `await import('/tools/teste-mapa/passagens.js')` dá `caminho([x0, y0], [x1, y1], ['nadar'])`
  (passos a pé, ou -1 sem caminho). `game.map.regionAt(x * 16, y * 16)` diz de que região é um ponto.
- Antes de entregar: `node tools/teste-mapa/nucleo.mjs` (o núcleo não mudou) e `node tools/teste-mapa/viagens.mjs`
  (navio, voo, save no outro continente). Feche os Chromes de teste ao fim (a máquina é dividida com outros agentes).
