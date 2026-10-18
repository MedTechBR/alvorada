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
- `items`: Poké Bolas no chão `{x,y,item}` (brilham; pegar ao passar por cima).

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
