# Assets HGSS para o visual 3D (assets/hgss/)

Tudo carregado por `src/visual3d/hgss/carregar.js` (`const h = await carregarHGSS()`). Imagens com filtro
`nearest`, sem mipmaps. Créditos em `assets/CREDITOS.md`. Tamanho total: ~41 MB (pokemon 20, modelos 18, personagens 1,2, texturas 0,1).

## Texturas (`texturas/`)
- `atlas.png` (256x160, 156 texturas de 16x16, 16 colunas) e `indice.json`: `tex[nome] = {x,y,u0,v0,u1,v1}` (UV com
  recuo de meio texel, origem embaixo, convenção `flipY` do three), `tipos[<tile em minúsculas>] = {id, topo, lado?, anim?, altura?}`
  para os 79 tipos de `src/world/tiles.js` (todos cobertos).
- `h.texturas.uv('grass')` topo; `uv('wall','lado')` lateral; `uvNome('telhado_azul')`; `quadroAnim('water', tSeg)` devolve
  o nome do quadro (água, lava, maré, correntes, fonte quente), 4 fps.
- Do demo (idênticas): grama, trilha, telhado vermelho e azul, parede creme, parede de laboratório, piso de madeira,
  piso de azulejo, cerca, lâmina de mato, papel de parede. As outras foram desenhadas por `tools/hgss/texturas.py` (biomas,
  9 cores de telhado, 6 de parede, janelas dia/noite, portas, copas e troncos, arbustos de cubo).
  Lateral e topo de copa/arbusto: `copa_lado/topo`, `arbusto_lado/topo`, `tronco_lado/topo`.
- `interior/`: texturas de 32/64 px do demo (livros, pisos do Centro/Mercado/lab, mapa da cidade...): `h.texturas.interior('floor_center')`.

## Personagens (`personagens/`)
- 307 folhas de 96x128: 3 colunas x 4 linhas de 32x32 (colunas: parado, passo 1, passo 2; linhas já na ordem do jogo:
  down, up, left, right). Ciclo de andar `[0,1,0,2]`. `indice.json`: `personagens[id] = {n, grupo, pe}` (pe = linha do chão no
  quadro), `looks` (nossos `look` -> id), `jogador` (`m`/`f` x `frlg`|`hgss`|`rse`).
- `h.personagem(look)` aceita o look do mapa (`'menino'`, `'rival'`...), um id (`'npc_136_prof_oak'`) ou objeto `{sexo|gender}`;
  look desconhecido cai num aldeão estável. Devolve `{textura, quadro(dir, andando, tSeg), pe, fw, fh, aspecto}`.
  Use um ator (textura) por entidade: o recorte é feito com `offset/repeat` numa textura própria.
- `h.jogador('m'|'f', 'frlg')`: Red/Leaf; `'hgss'`: Ethan/Lyra; `'rse'`: Brendan/May (folhas de corrida).

## Pokémon (`pokemon/`)
- `frente/<chave>.webp` e `costas/<chave>.webp`; chave `0025` ou `0006-megaX` (mesmas chaves de forma do jogo).
  `indice.json`: `sprites[chave] = {n, f:{w,h,n,d,src,c?}, b:{...}}`; `d` é a duração em ms (número único ou lista por
  quadro); `c` = colunas quando a tira virou grade (passava de 16000 px); `src` = `demo`, `gif` (PokeAPI Black/White animado)
  ou `png` (estático, `n` = 1).
- 1305 entradas (1025 espécies + 280 formas); só `0718-mega` ficou sem sprite (a PokeAPI não tem).
  51 do demo, 689 animadas B/W (dex 1-649 e formas), 565 estáticas (650+).
- `h.pokemon(25, {forma:'megaX', lado:'f'|'b'})` -> `{w, h, n, clone(), aplicar(textura, tMs)}`; sem forma ou sem sprite
  da forma cai na espécie (a chave sem forma); `null` se não existe. **Atenção à escala**: B/W animado tem o tamanho de
  jogo (~40-100 px) e os estáticos da 6ª geração em diante são renders de 96 px recortados; ajuste a altura pela espécie.
- Reproduzir: `python3 -I tools/hgss/sprites-pokemon.py tudo` (baixa só o que falta, em lotes com pausa; ~25 min na primeira vez).

## Modelos (`modelos/`)
- 729 `.glb` (17,8 MB) convertidos dos `.scn` do demo com o Godot 4.4.1 oficial (`tools/hgss/modelos-glb.py`):
  `hgss/pallet` (casa do jogador e do rival, laboratório), `hgss/pewter_city` (ginásio, casa, museu, Centro, Mercado, poste),
  `hgss/viridian_city`, `hgss/route_*`, `hgss/viridian_forest`, `hgss/common` (árvore, arbusto, mato, pedra, cerca, fonte,
  poste, placa, caixa de correio), `pokemon/oaks_lab` e os kits Kenney (`kenney/furniture|nature|suburban|town`).
  `_lista.json` traz todos os nomes. `h.modelo('hgss/pewter_city/pokecenter')` devolve um clone novo do grupo (Promise).
- Falhou: `pokedex.scn` (a textura `.jpg` não veio no demo). A cena `kenney/town` aponta para um `colormap.png` que o
  demo não trouxe: usamos o da `suburban` (as cores dos modelos town podem diferir do original).
- Escala: os prédios HGSS saem em unidades do Godot (1 = 1 bloco do HGSS); ajuste com `scale` ao encaixar.

## Vitrine e teste
`python3 tools/serve.py 8650` e abra `http://127.0.0.1:8650/tools/vitrine-hgss.html?parte=personagens|texturas|pokemon|modelos`.
Foto sem interface (Chrome via CDP): `node tools/hgss/foto-vitrine.mjs <parte> <saida.png>`.
