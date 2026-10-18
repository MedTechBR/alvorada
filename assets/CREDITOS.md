# Créditos da arte do cenário

Projeto pessoal de fã, sem fins comerciais.

## Blocos e objetos do cenário: Tuxemon (assets/tiles/tuxemon/)

Folhas copiadas sem alteração do repositório do projeto livre **Tuxemon**
(https://github.com/Tuxemon/Tuxemon, pasta `mods/tuxemon/gfx/tilesets/`, ramo `development`, baixadas em 18/10/2026).
As licenças abaixo são as declaradas no arquivo `ATTRIBUTIONS.md` do Tuxemon.

| Arquivo | O que usamos | Licença | Autores (segundo o ATTRIBUTIONS.md do Tuxemon) |
|---|---|---|---|
| `core_outdoor_nature.png` | grama, areia, face de penhasco, árvores, pinheiros, pedras, troncos, tocos, flores animadas, folhas, cogumelos | CC BY-SA 4.0 | "Core Outdoor Nature" de rubberduck, baseado em "Updated Ground Tiles" (rubberduck, sobre blocos originais de Buch, encomendados por luke83, com mudanças de luke83 e Past the Future, e de George_), "Sand n Water" (luke83, sobre Kyrodian Legends de Midi, CC BY 3.0), "Grass, Sand, Snow" (PastTheFuture, CC BY 4.0), "Basic Buch Tiles Compiled" (Buch, CC BY 3.0), "Outdoor Tiles - City and Country" (ArMM1998, domínio público), "Terrain" e "Waterfall" (George_, CC BY 3.0), "Waterfall" (ZaPaper, CC BY 3.0) |
| `core_outdoor_water.png` | quadros da água animada | CC BY-SA 4.0 | mesmos autores do "Core Outdoor Nature" |
| `core_outdoor.png` | terra do caminho, cercas de madeira e brancas, vitórias-régias, coqueiro pequeno, cogumelos | CC BY-SA 4.0 (compilação do Tuxemon; inclui peças de domínio público de ArMM1998 e Isaiah658) | compilação "core" do Tuxemon |
| `core_buildings.png` | Centro Pokémon (telhado vermelho), loja (telhado verde), laboratório, casas | CC BY-SA 4.0 | "Core Buildings": "Fancy house" (Kelvin Shadewing, CC BY-SA 4.0), "MK Buildings" (Mircea Kitsune, sobre Kelvin Shadewing; hospital adaptado por Sanglorian), "Kelvin Buildings" (Kelvin Shadewing, XYG Open Source License v1.1), "Kelvin Doors" (Kelvin Shadewing, CC BY 3.0), "Superpowers Assets Ninja Tilesheet" (domínio público), "Inspired 16x16 Tiles" (RedVoxel, telhados adaptados por Jaskrendix, CC BY-SA 4.0) |

Licenças: CC BY-SA 4.0 https://creativecommons.org/licenses/by-sa/4.0/ ·
CC BY 3.0 https://creativecommons.org/licenses/by/3.0/ · XYG https://kelvinshadewing.net/?id=license

Como a CC BY-SA pede, as peças **derivadas** dessas folhas também ficam sob CC BY-SA 4.0: a casa azul (telhado
repintado da casa cinza), as variações de cor da areia, da terra e da grama do bosque e os quadros de água
montados em `src/world/art.js`.

## Desenhado por código para este projeto (src/world/art.js)

Mato alto animado, árvore grande e árvores de frutas (Oran e Pecha), coqueiro grande, arbusto e pedra
quebráveis, placas, caixa de correio, postes, vasos, caixotes, ponte e píer, escadas, praça de pedra, quadra e
arquibancada do ginásio, pórtico, moinho, fardos de feno, trigo, banco, poço, relógio de sol, piso e paredes dos
interiores, móveis, gruta, Poké Bola no chão, borboletas, pássaros, peixe, vaga-lume, brilhos e luzes. O
compositor de bordas (autotile) do chão está em `src/world/ground.js`.

## Biomas (src/world/arte-biomas.js, src/world/clima.js)

Também desenhados por código para este projeto, sem arte de terceiros: chão de neve, gelo, lava, cinzas, basalto,
obsidiana, dunas, areia movediça, chão rachado, caatinga, sal, rocha vermelha, mangue, recife, mosaico, pisos e paredes
de templo e cavernas, trilhos; pinheiro nevado, cactos, mandacaru, xique-xique, coqueiro, palmeira, mangue, árvores da
selva, umbu, araucária, bambu; estátua, tochas, braseiro, altar, baú, sino, mural; iglu, cabana, casa de taipa; partículas
de neve, cinza, areia, chuva e névoa; quadros animados de lava, correnteza, maré e bolhas. As músicas novas (neve,
vulcão, deserto, mangue, caverna e templo) e os sons ambientes também são gerados na hora (src/audio/audio.js).

## Visual 3D HGSS (assets/hgss/)

Projeto pessoal de fã, sem fins comerciais. Pokémon e seus personagens, nomes e sprites são marcas e obras da
Nintendo, Game Freak e The Pokémon Company; aqui entram só como referência de um jogo de fã.

- **Demo de fã "Pokemon Battle Advanced"** (referencias/pba/, extraído pelo dono, que autorizou o uso dos arquivos; o código
  do demo não é usado): texturas de 16 px e de interior (`texturas/`), os 307 sprites de personagens FRLG/HGSS e
  Brendan/May (`personagens/`), os sprites de batalha das 51 espécies do demo (`pokemon/`, marcados `"src": "demo"` no
  índice) e os modelos 3D `.scn` convertidos para `.glb` (`modelos/`): prédios e objetos HGSS e os kits da
  **Kenney** (kenney.nl, domínio público CC0: furniture, nature, suburban, town).
- **PokeAPI/sprites** (https://github.com/PokeAPI/sprites, ramo master, baixados em outubro de 2026): sprites de batalha
  das demais espécies e formas. Dex 1 a 649: animados da 5ª geração (Black/White, `versions/generation-v/black-white/animated`);
  650 em diante e formas sem animado: sprites estáticos padrão. Script reprodutível: `tools/hgss/sprites-pokemon.py`
  (baixa só uma vez, em lotes com pausa; cache em `dados-brutos/`, fora do git).
- **Desenhado por código** (`tools/hgss/texturas.py`): as demais texturas 16x16 do atlas (biomas, telhados de várias
  cores, janelas, portas, copas, troncos), na paleta e no estilo das do demo.
- **Godot 4.4.1** (oficial, github.com/godotengine/godot, SHA512 conferido) só como ferramenta de conversão, em
  `tools/godot/` (fora do git).
