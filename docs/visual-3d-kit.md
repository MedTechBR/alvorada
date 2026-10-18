# Kit de modelos 3D (HD-2D)

Modelos low-poly em blocos, gerados por código, para o visual 3D (`docs/visual-3d.md`). Nada é copiado de jogos ou do
protótipo de fã, e não há arquivo de modelo: cada tipo é uma função em `src/visual3d/kit/`. As cores saem do desenho 2D:
das casas e dos salões a partir do `estilo` que `buildings.js` guarda no catálogo, e dos outros objetos a partir das
mesmas cores hexadecimais de `art.js`, `arte-biomas.js` e `story/cenario.js`. Para os sprites do Tuxemon, as cores
foram amostradas das folhas.

## Arquivos
| Arquivo | Papel |
|---|---|
| `kit/construtor.js` | `Malha` (caixa, bloco, octa, cil, cone, aguas, poli), cor por vértice com luz falsa, AO, descarte de faces escondidas, `mesclar`, `criarMaterial`, `EY` |
| `kit/natureza.js` | árvores, coníferas, palmeiras, arbustos, cactos, pedras, cristais, troncos |
| `kit/predios.js` | casa de duas águas, salão de laje, Centro, Mercado, Laboratório, celeiro, estufa, farol, casarão, torre, iglu, cabana, taipa, galpão de barcos; peças `janela`, `porta`, `placa`, `pokebola` |
| `kit/objetos.js` | placas, postes, cercas, praça, templo, praia, mecânicas das masmorras, objetos dos capítulos 4 a 6 |
| `kit/interior.js` | móveis de casa de boneca e `paredeInterior` |
| `kit/index.js` | `kit`: registro, cache, variantes, estado, medidas |
| `kit/modelos-setor.js` | `ModelosKit`: ponte com `setores.js` (ver `kit/integrar.md`) |
| `tools/vitrine-3d.html` | vitrine com todos os modelos, câmera do jogo, dia e noite, triângulos e tempo por modelo |
| `tools/vitrine-3d-foto.mjs` | capturas da vitrine no Chrome sem interface |

## Interface
```js
import { kit } from './kit/index.js';
kit.temModelo(kind)           // true se o tipo tem modelo; os outros seguem como billboard do sprite 2D
kit.modelo(kind, obj)         // { geometry, topo, variante, tris, altura, chave }
kit.chave(kind, obj)          // "kind|variante|estado": se mudar, troque a geometria
kit.dinamico(kind)            // o modelo depende do estado do objeto
kit.mesclar([{ geometry, x, y, z, k }])   // uma BufferGeometry só (malha do setor)
kit.material(); kit.noite(0..1)           // material único; acende janelas à noite
kit.parede(w, h, opções)                  // parede de interior (geometria nova, sem cache)
kit.ficha(kind); kit.tipos(); kit.medidas()
```
- **Origem** = ponto do pé do objeto no 2D (`o.x`, chão, `o.y`). A pegada fica de `x = -fw*8` a `fw*8` e de
  `z = -fh*16` a `0`: é a mesma colisão do 2D. Os telhados e as copas podem passar dela, como o desenho 2D passa.
- **Atributos**: `position`, `normal`, `color` (linear) e `aBrilho`. Com `aBrilho > 0`, a luz quente de janela ou
  lampião aparece à noite. Com `aBrilho < 0`, a face tem brilho próprio na sua cor (cristal, lava, fogo, telas).
- **Topo** `{ y, x0, x1, z0, z1 }`, em coordenadas locais: é a área de cima onde dá para pisar (cumeeira, laje, copa),
  pensada para Pokémon subirem no futuro.
- **Variantes**: árvores e pedras têm de 2 a 3 formas, sorteadas por `hash(tx, ty)` e estáveis.
- **Estados**: as pontas de cerca (`o.end`), o baú aberto, a alavanca, a placa de pressão, a tocha e o braseiro acesos
  e a frutífera colhida são lidos do objeto ou da textura do sprite 2D, que é a fonte da verdade.
- **A geometria é do cache**: não altere nem descarte.

## Estilo
- Tudo em blocos, como no protótipo: as copas são cubos em anéis (embaixo escuro, no meio, em cima claro, com o topo
  de cada cubo um tom acima), as coníferas são andares de blocos, os arbustos são cubos fofos e as flores são cubinhos.
- A luz é falsa e fica nos vértices: topo 1, frente (sul) 0,82, lados 0,6 a 0,7. O chão escurece o pé das coisas
  (AO até 12 px). O Lambert da cena soma o sol por cima.
- `EY = 1,4`: as alturas são escritas em "px do 2D" e esticadas. A câmera a 55° encurta o vertical para 0,57 e o chão
  para 0,82; com o esticão, a porta fica do tamanho do treinador e o cubo continua parecendo cubo.
- Faces viradas para o norte ou para baixo são descartadas na montagem, porque a câmera não gira. Uma caixa custa 8
  triângulos.

## Números (vitrine, Chrome sem interface com SwiftShader, sem cache)
- São 189 modelos, cobrindo todos os tipos do catálogo, mais 1 prédio e 15 móveis novos. A vitrine soma 18,4 mil
  triângulos.
- Triângulos: árvores de 60 a 192 (média 88 na natureza); casas de 228 a 292; salões de 198 a 378; o casarão,
  maior prédio, tem 470. Objetos têm média de 51 e interiores, de 56.
- Gerar: de 0,1 a 1 ms por modelo, e só uma vez por tipo, variante e estado (fica em cache). Os 189 modelos levam
  cerca de 45 ms.
- Mesclar: cerca de 6 ms para os 189 juntos; um setor típico com dezenas de objetos leva menos de 1 ms.

## Em aberto
- Ginásios: o celeiro, a estufa, o farol e o casarão existem. O `galpaoBarcos` está pronto, mas ainda não tem sprite
  nem lugar no mapa.
- Animação: as pás do moinho, o varal ao vento e o balanço das copas ficam parados. Um shader de vento por altura
  (aBrilho livre, `position.y`) resolve.
- Os móveis novos (sofá, poltronas, mesa de centro, prateleira da loja, janela interna, tela do Centro, cruz da Joy)
  ainda precisam entrar nos mapas dos interiores.
