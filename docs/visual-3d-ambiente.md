# Visual 3D: ambientação HD-2D (`src/visual3d/ambiente/`)

Terreno pintado, grama e capim, arbustos, céu, luz, pós e partículas no tom da referência (o vídeo "Battle
Advanced": trilha creme, campo verde-amarelado, cercas vivas redondas com frutinhas, sol dourado com raios,
colinas e montanhas na névoa, tilt-shift forte). Tudo em arquivos novos; o 3D principal (`index.js`,
`setores.js`, `ceu.js`, `pos.js`) só precisa chamar a interface abaixo. Nada lê o Pixi; o mapa é lido só pela
`MapaLeitura` (`src/world/mapa-leitura.js`), por `L.bloco(x, y)`, `L.w`, `L.h` e `L.objetosDoSetor(sx, sy)`.

Demonstração: `tools/demo-ambiente.html` (cena própria que reproduz a referência, com modelos provisórios).
Parâmetros: `?q=alta|baixa`, `?hora=7.8`, `?cam=ref|jogo`, `?parar=1` (tempo congelado), `?ciclo=1` (o dia
passa), `?andar=1` (o Charizard anda no capim e a grama abre), `?semgrama=1`, `?pos=nenhum|simples|completo`.
Capturas e FPS: `node tools/teste-3d/ambiente.mjs foto <nome> "<parâmetros>"` e
`node tools/teste-3d/ambiente.mjs fps "<parâmetros>"` (CPU 4× mais lenta, 740×360), com `tools/serve.py 8754`.
Lado a lado com a referência: `python3 tools/teste-3d/lado-a-lado.py <captura> <referência> <saída>`.

## Arquivos

| Arquivo | Papel |
|---|---|
| `index.js` | `Ambiente`: o pacote inteiro numa classe (é o que o principal usa) |
| `qualidade.js` | níveis `alta` e `baixa`, ligados a `src/engine/quality.js` |
| `comum.js` | uniformes compartilhados (`U`: tempo, vento, quem empurra a grama, nuvens, manchas) e trechos de GLSL |
| `ruido.js` | sorteio e ruído repetíveis; textura de ruído 128² (manchas, borda, nuvens) |
| `texturas.js` | 16 camadas de chão pintadas por código (pilha `DataArrayTexture` 128², ~1 MB) |
| `terreno.js` | material do chão: mistura das camadas por máscara de blocos, borda tremida, manchas, nuvens, rocha nas faces, lava acesa |
| `grama.js` | grama, capim alto e flores instanciados, com vento e afastando de quem passa |
| `arbustos.js` | arbustos fofos com frutinhas, cerca viva em fileira, folhagem no pé das árvores |
| `ceu.js` | `CeuHD`: cúpula com gradiente e estrelas, nuvens pintadas, 3 camadas de montanhas/colinas na névoa, sol, luz ambiente, névoa, sombras, ciclo do dia |
| `pos.js` | `PosHD`: tilt-shift, bloom, raios de sol, gradação, vinheta (mesma interface do `pos.js` antigo) |
| `particulas.js` | folhas, pétalas, pólen, poeira dourada e vagalumes, todos na GPU |

## Interface de encaixe

```js
import { Ambiente } from './ambiente/index.js';

// no construtor do Visual3D, depois de criar renderer, scene e camera:
this.amb = new Ambiente({ renderer: r, scene: this.scene, camera: this.camera, quality: g.quality, L: this.L });
// O Ambiente cria o próprio sol, hemisfério, névoa e céu: remover o Ceu e o Pos antigos (ou não chamá-los).
```

### Setores (`setores.js`)
```js
// #montar(sx, sy): o chão usa a malha de sempre; só troca o material (mundo lido de modelMatrix * position;
// a cor de vértice, sombra de contato, continua valendo; faces verticais saem em rocha)
s.matChao = this.v.amb.materialChao(sx, sy);
// grama/capim/flores do setor (substitui #geometriaMato; o mato alto TALL vira capim alto e denso)
s.grama = this.v.amb.gramaDoSetor(sx, sy, {
  altura: (px, pz) => this.v.relevo.em(px, pz),          // pé no chão com relevo
  ocupado: (x, y) => blocoTemModelo(x, y),                // opcional: sem grama sob prédios/árvores
  extra: (x, y) => temCercaOuMuro(x, y) ? 0.5 : 0,        // opcional: capim extra (0..1) em volta de cercas
});
s.grupo.add(s.grama.grupo);
// enfeite de chão: folhagem no pé das árvores, arbustos na beira das matas e onde houver 'roundbush'
s.arbustos = this.v.amb.arbustosDoSetor(sx, sy, { altura: (px, pz) => this.v.relevo.em(px, pz) });
s.grupo.add(s.arbustos.grupo);

// #liberar(s):
this.v.amb.liberarSetor(s.matChao, s.grama, s.arbustos);
// L.mudancas() (bloco trocado: mato cortado, chão queimado):
this.v.amb.blocoTrocado(s.matChao, x, y);     // atualiza a máscara do chão; para a grama, refazer s.grama
```
Listas próprias de arbustos (cerca viva de um carimbo, jardim): `Arbustos.fileira(x0, z0, x1, z1, { r, frutas,
altura })`, `Arbustos.folhagemArvore(x, z, raio)`, e `amb.arbustos.lote(lista)` → `{ grupo, liberar() }`.
Cada item: `{ x, z, y, r (raio px), alt, larg, prof, cor (THREE.Color), frutas (quantas), corFruta }`.

### Todo quadro (`Visual3D.quadro`)
```js
// quem empurra a grama (até 8): jogador, Pokémon soltos, montaria, NPCs perto
this.amb.atores([{ x: p.x, y: p.y, raio: 14, forca: 1 }, ...]);
this.amb.update(dt, {
  hora: g.mundo.hour,            // ciclo do dia: manhã, tarde dourada, pôr do sol, noite com estrelas
  foco: this.alvo,               // Vector3 que a câmera olha (centro do mapa de sombra, foco do tilt-shift, caixa das partículas)
  raio: metadeDaPegada,          // px: tamanho do mapa de sombra do sol
  interior: !!sala,              // dentro de casa: sem céu, nuvens nem raios
  nevoa: [D * 1.05, D * 2.9],    // opcional: [perto, longe] da névoa (px)
  zoom: g.zoom / 3,              // opcional: escala das partículas
});
this.amb.render();               // no lugar de this.pos.render(scene, camera)
// resize: this.amb.tamanho()
// troca de qualidade: if (this.amb.nivelar(g.quality)) refazer a grama e os arbustos dos setores
```
Uniformes úteis para quem quiser casar outros materiais: `U.tempo`, `U.vento` (x, y = direção, z = força,
w = rajada), `U.nuvem` (sombra de nuvem), `U.noite`, e os trechos `GLSL_NUVEM`, `GLSL_VENTO`, `GLSL_MANCHA` de
`comum.js` (o kit de modelos pode usar `GLSL_VENTO` nas copas e `GLSL_NUVEM` nos telhados). `amb.luzP` é a cor
de luz do cenário para os billboards (o mesmo papel de `u.luzSprite`). `amb.ceu.sol`, `amb.ceu.hemi` e
`amb.ceu.dirSol` são as luzes; `amb.pos.u` os uniformes da composição (tinta do clima, exposição, vinheta...).

## Qualidade (`qualidade.js`)
| | alta (PC) | baixa (celular) |
|---|---|---|
| terreno pintado, manchas, borda tremida, sombra de nuvem | sim | sim |
| grama | 6 tufos/bloco de campo, 16 no mato alto, 5 lâminas | 38% da densidade, 3 lâminas |
| flores, frutinhas | 100% | 60% |
| sombras do sol (shadow map) | 2048, PCF suave | não |
| céu | 9 nuvens, 3 camadas de montanha | 5 nuvens, 2 camadas |
| pós | tilt-shift, bloom, raios, gradação, vinheta | só gradação e vinheta (1 passada) |
| partículas | 100% | 30% |
| resolução de desenho (`dpr`) | até 2 | 0,75 |

## Medições (Mac M3, Chrome sem interface)
- Baixa, câmera do jogo, 740×360, CPU 4× mais lenta: ~236 FPS (19,7 mil tufos).
- Baixa, câmera da referência (vê até o horizonte), 740×360, CPU 4×: ~65 FPS.
- Alta, câmera do jogo, 740×360, CPU 4×: ~98 FPS; alta, referência, 1280×720, CPU 1×: ~78 FPS (52 mil tufos).
- Console sem erros nem avisos.
A demo monta todos os 35 setores e as árvores provisórias são malhas soltas (centenas de draw calls); no jogo os
setores longe são descartados e os modelos são mesclados por setor.

## Diferenças conhecidas para a referência
- **Câmera**: a referência é baixa (vê o céu); a câmera do jogo (50° acima do horizonte) não vê céu, nuvens nem
  montanhas: o fundo só aparece se o principal baixar a inclinação (ou num modo de foto).
- Os modelos (árvores, casa, poste, quiosque) da demo são provisórios do kit; a referência tem árvores voxel
  claras com topo iluminado e telhados com textura.
- O Charizard da demo está em escala de jogo (a referência é uma arte de capa com ele gigante e o título).
- Os raios de sol da referência são mais fortes; aqui ficaram mais contidos para não lavar o jogo.
