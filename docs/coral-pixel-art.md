# Coral em pixel art: bairro e encontros

Piloto implementado no branch `coral-pixel-art`, com publicação autorizada pelo dono em 25/10/2026. A imagem aprovada orienta composição, escala, câmera e interface; ela não é usada como fundo estático do jogo.

## O que foi implementado

- Fachadas separadas em pixel art, telhas de barro, paredes claras, madeira azul-petróleo, palmeiras, canteiros e postes náuticos. A câmera fica fixa para o norte, com o personagem abaixo do centro e mais cenário à frente.
- Um bairro compacto junto ao mar: oito prédios reais reposicionados, seus acessos e placas, praça, rua dos serviços, farol, falésia visível, escadaria, praia e passadiço. O porto regional continua com as viagens existentes.
- As portas continuam levando às mesmas salas. Os pontos nomeados do palco, do calçadão, da Iracema e do farol acompanham o bairro; nenhuma fala, condição de progressão, insígnia ou puzzle foi reescrito.
- Na exploração: nome da cidade, minimapa retangular fixo no norte com a arte dos objetos, menu, analógico discreto e dois botões juntos. A ação contextual aparece quando há algo para interagir. Equipe e montarias seguem disponíveis pelo menu.
- Painéis grandes de Pokémon e missão ficam ocultos no passeio. A busca do guia continua funcionando e o trajeto permanece no minimapa. Na luta, os indicadores e ações de combate reaparecem.
- Treinador e moradores usam as folhas prontas FRLG/HGSS que já existem em `assets/hgss/personagens/` e já eram usadas pelo renderer 3D. O piloto agora liga esse acervo ao Pixi em vez de mostrar os bonecos por código. Oito papéis de Coral têm seleção estável, incluindo pescador, marinheiro e músico; adultos têm altura útil de 36 px e crianças de 30 px, com pés alinhados ao chão. As cores do jogador continuam usando o recoloridor existente e as quatro direções/ciclos de caminhada e corrida seguem o movimento nativo.
- O impacto mantém o tranco curto de câmera já existente. O piloto não cria efeitos de tela inteira nem palavras de efeito sonoro.

## Encontros separados

Encontros comuns de Coral levam à cena temporária de uma pequena praia. O combate continua em tempo real, com os mesmos Pokémon, PS, atributos, golpes, recargas e avisos. Não foram modificados os dados das espécies ou a fórmula de dano.

A transição usa 140 ms de entrada e 140 ms de saída. O continente fica guardado e suas interações são suspensas durante a cena. Vitória, captura e fuga retornam ao ponto de exploração; derrota entrega o fluxo ao mecanismo de recuperação já existente. Salvar durante o encontro grava o ponto no continente, nunca a arena descartável.

Treinadores trocam de Pokémon sem remontar a praia ou interromper a luta. O botão de fuga respeita `noFlee`. Ginásios, reides, chefes sem treinador, bandos e sessões online continuam com o fluxo anterior.

## Evidência visual

Galeria: [tools/shots/coral-pixel/index.html](../tools/shots/coral-pixel/index.html).

- `referencia.jpg`: conceito enviado pelo usuário; não é prova do resultado implementado.
- `fachadas-depois-844.jpg`, `praca-depois-844.jpg`, `farol-depois-844.jpg`, `cais-depois-844.jpg`: capturas reais de viewport 844×390.
- `arena-selvagem-844.jpg`, `arena-treinador-844.jpg`, `arena-acao-0-844.jpg` a `arena-acao-2-844.jpg`: encontros e três momentos de uma ação selvagem real.
- Os originais de captura têm 1688×780, correspondentes ao DPR 2. As cópias de entrega têm 844×390.
- `piloto-anterior-844.jpg`: registro histórico do piloto 3D, com outro enquadramento.
- `*-antes-844.jpg`: o renderer 3D anterior **na mesma planta reorganizada**, para comparar a apresentação e seu custo. Não é uma restauração do mapa antigo.

## Recursos e memória

A arte carrega somente perto de Coral. O chão é composto por setores de 256², descartados quando saem do enquadramento. Os objetos compartilham um atlas RGBA 768×512; os oito terrenos compartilham um atlas RGB 512×256. Não há uma textura nova por casa ou por palmeira.

No enquadramento medido, até 15 setores e os dois atlas representam aproximadamente **5,75 MiB de pixels RGBA**. Esse valor é uma estimativa de armazenamento das texturas locais, sem mipmaps, e não uma leitura da memória total da GPU. Os quadros do minimapa reutilizam os mesmos desenhos. Cada folha humana de 96×128 compartilha 12 quadros, cerca de 0,047 MiB de pixels RGBA; a corrida do jogador usa a folha correspondente. As identidades saem do cache após 1,5 s fora do enquadramento e são liberadas junto com o piloto; a tabela registra também esse custo.

Ao sair do piloto por quatro segundos, fontes de textura, setores, sprites substitutos e ImageBitmaps são liberados. O teste de navegação confirma o descarte e a recarga ao voltar do Centro Pokémon, tanto no modo padrão quanto em `?visual=2d`.

## Medição de desempenho

Chrome sem interface, CPU 4× mais lenta, viewport 844×390, DPR do dispositivo 2, qualidade alta, horário 15h e cadência normal. O renderer anterior mantém seu limite interno habitual de DPR. Um Chrome por vez. Quatro pontos estáticos aquecidos e um percurso de 3,2 s descendo e voltando pelo calçadão com entrada real de movimento. O roteiro e novos spawns ficam suspensos para manter a comparação; os moradores existentes continuam na cena.

A CPU soma lógica e desenho. O pico de heap usa `performance.memory`; o heap retido é lido após GC. As contagens de geometria/textura são de `renderer.info.memory` do Three e **não incluem** as texturas Pixi, contabilizadas separadamente acima. As duas apresentações usam a mesma planta e os mesmos pontos absolutos.

| Ponto | Quadro p95 ms | CPU p95 ms | Pico de heap MiB | Heap após GC MiB | Geometrias Three | Texturas Three | Folhas humanas / texturas Pixi MiB depois |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fachadas | 16.8 → 16.8 | 8.7 → 5.5 | 292.48 → 288.06 | 284.06 → 282.04 | 104 → 60 | 86 → 50 | 8 / 6.125 |
| praca | 16.7 → 16.8 | 7.4 → 5.6 | 291.80 → 289.91 | 284.30 → 283.21 | 108 → 60 | 89 → 50 | 7 / 4.828 |
| farol | 16.7 → 16.8 | 7.4 → 5.5 | 291.71 → 289.39 | 284.56 → 283.18 | 112 → 60 | 93 → 50 | 7 / 6.078 |
| cais | 16.7 → 16.8 | 10.3 → 6.2 | 293.75 → 290.44 | 285.61 → 283.91 | 110 → 60 | 88 → 50 | 4 / 5.938 |
| caminhada | 16.8 → 16.7 | 8.9 → 6.3 | 294.09 → 289.98 | 285.59 → 283.53 | 114 → 60 | 88 → 50 | 8 / 6.125 |

Os valores são amostras locais, sujeitos a variação. A cadência ficou próxima de 60 quadros/s; diferenças de 0,1 ms no p95 de parede não distinguem uma regressão de variação de sincronismo. O heap e a CPU observados são comparados ponto a ponto. Isso não prova consumo total de GPU ou estabilidade no Safari de um iPhone físico.

## Teste de equilíbrio

12 lutas automáticas: sementes 31, 73 e 137; Pikachu × Eevee e Charmander × Squirtle, nível 20, em modos selvagem e rival. Mesmas coordenadas absolutas, distância inicial, geometria, movimentos de entrada e passos de 1/60 s. Sem cura ou ressurreição durante a amostra. O controle usa um campo temporariamente preparado apenas na sessão de teste; o “depois” usa o controlador e o mapa real de `encontro-coral`. A IA de batalha atualiza uma vez por quadro pelo fluxo da UI.

| Luta | PS perdidos/min antes → depois | Duração média s | Golpes/min jogador | Golpes/min adversário |
| --- | --- | --- | --- | --- |
| selvagem | 9.26 → 6.89 | 17.28 → 17.42 | 75.22 → 74.64 | 15.62 → 14.93 |
| rival | 9.10 → 5.67 | 17.58 → 17.65 | 77.35 → 75.35 | 19.34 → 15.86 |

O teste exige vida perdida por minuto sem aumento **em cada par/semente**, além do agregado de cada grupo; todas as lutas terminaram em até 90 s. O dano individual, avisos e recargas não foram alterados.

Um ensaio preliminar preservava a distância inicial, mas mudava as coordenadas absolutas; isso muda a fase espacial usada pela circulação da IA e produziu mais acertos em alguns pares. O diagnóstico foi preservado em `equilibrio/diagnostico-coordenadas/`. A comparação final mantém a geometria e as coordenadas iguais para isolar a troca de cena. Ela não garante equivalência para toda configuração possível de obstáculos, clima ou terreno no continente.

Os metadados de commit nos resultados apontam a base do checkout; as execuções ocorreram com as alterações locais desta entrega, antes de seus commits finais.

## Validação

Os resultados completos e logs estão em `tools/resultados/coral-pixel/`.

- 18 verificações Node: dados, jornada, jornada completa, progressão, alvos, guia, guia caminhando, sólidos, saídas, falantes, obtenção, invisíveis, geografia, Coral, pintura, os testes locais de cena e personagens e `vestir --verificar`.
- Auditoria de invisíveis: zero achados nos dois mundos. Auditoria de sólidos: zero sobreposições de personagens, pontos e portas.
- `teste-personagens-coral.mjs`: oito papéis estáveis, folhas existentes em formato WebP, quatro direções e ciclos coerentes com o catálogo. A navegação no Chrome confirma o sprite pronto do jogador e o descarte das fontes.
- `coral-navegacao.mjs`: dois botões de exploração dentro da tela, HUD compacto, entrada real pela porta do Centro, descarte da arte e retorno, incluindo as folhas dos humanos; modos 3D padrão e 2D.
- `coral-encontro.mjs`: encontro real provocado, atributos preservados, borda sólida visível, projeção de mira reversível, save no continente, fuga, vitória, captura com alvo atordoado, derrota, treinador com duas entradas contínuas e respeito a luta obrigatória.
- `auditar-passagens-npc.mjs`: 179 NPCs, nenhum fecha passagem.
- `combate-paredes.mjs`: 24 lutas, 20.160 quadros; nenhum Pokémon ou treinador atravessou parede.
- O novo teste de bairro percorre a planta real até as oito portas, palco, calçadão e farol e remonta o mesmo mundo para conferir estabilidade das posições.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `assets/coral-pixel/objetos.png`, `terrenos.png`, `atlas.json`, `LEIA-ME.md` | Arte compartilhada, metadados e procedência |
| `src/visual2d/coral.js` | Renderização local, câmera fixa, substituição de objetos, sombras leves, minimapa e descarte |
| `src/sprites/pessoas-coral.js` | Seleção estável dos papéis no acervo pronto existente |
| `src/visual2d/coral-pessoas.js` | Carrega as folhas prontas, normaliza escala/pés, acompanha passos e descarta fontes próximas |
| `src/visual2d/coral-terreno.js` | Piso por setor, materiais, escadas, falésia e espuma estreita na margem |
| `src/visual2d/coral.css` | Localização, minimapa e ações compactas; painéis de combate contextuais |
| `src/world/coral-bairro.js` | Composição do bairro, portas e placas reais, acessos, NPCs e pontos nomeados |
| `src/world/coral-piloto.js` | Integra a composição ao piloto existente |
| `src/world/minimap.js` | Recorte retangular e arte do piloto, mantendo norte fixo e clique para abrir o mapa |
| `src/visual3d/index.js` | Alterna apresentação e projeção somente no escopo de Coral |
| `src/combat/encontro-coral.js` | Entrada e saída da cena, preservação do continente e recuperação |
| `src/combat/encontro-coral-dados.js` | Planta temporária da praia, sem novos perigos |
| `src/world/map.js` | Montagem de dados transitórios sem substituir o catálogo regional; descarte da cena |
| `src/main.js` | Ciclo do encontro, câmera, contenção e congelamento das interações do continente |
| `src/story/battle.js`, `story.js` | Integração dos treinadores e suspensão de gatilhos de campanha na praia |
| `src/save.js` | Grava posição original durante o encontro |
| `src/ui/hud.js`, `toque.js` | Informações e controles conforme exploração ou combate |
| `tools/teste-personagens-coral.mjs` | Papéis estáveis, existência das folhas, dimensões do catálogo e ciclos de caminhada/corrida |
| `tools/teste-coral-pixel.mjs` | Planta, acessos reais, remontagem, atlas e save |
| `tools/teste-3d/coral-pixel.mjs` | Capturas e medição estática/caminhando |
| `tools/teste-3d/coral-navegacao.mjs`, `coral-encontro.mjs` | Fluxos reais no navegador |
| `tools/teste-3d/coral-equilibrio.mjs` | Lutas automáticas com sementes fixas |
| `docs/cidade-coral-piloto.md` | Identifica o relatório 3D anterior como histórico |
| `tools/shots/coral-pixel/` | Galeria e evidência visual |

## Procedência da arte

Ferramenta integrada `image_gen.imagegen`, sem API/CLI externa. Foram produzidos dois recursos novos: uma folha de objetos separados com fundo transparente e uma folha de oito terrenos. A preparação recortou, reduziu por vizinho mais próximo e empacotou as peças. Não houve pintura de uma imagem inteira de cidade por cima da jogabilidade.

Direção usada no pedido dos objetos: pixel art de RPG costeiro, perspectiva frontal elevada, construções caiadas com telhas de barro, madeira azul-petróleo, iluminação consistente, contorno legível, portas centrais; Centro Pokémon, loja, casa, farol, palmeira, canteiro, fonte e poste náutico separados, sem chão ou personagens, transparência ao redor das peças.

Direção usada no pedido dos terrenos: oito materiais repetíveis vistos de cima em grade 4×2 — areia clara, calçada de pedra, grama, água turquesa, madeira de cais, rocha de falésia, gramado florido e terra — sem edifícios, personagens, rótulos ou perspectiva de cena completa.

Os humanos reutilizam o acervo FRLG/HGSS já adotado pelo projeto (`docs/visual-3d-hgss.md`, conversão em `tools/hgss/personagens.py`). A recoloração do jogador usa `src/sprites/treinador-hgss.js`, a mesma do 3D. Não foram baixadas novas cópias desses jogos nesta rodada. Os Pokémon, animações PMD e parte dos pequenos objetos existentes são reutilizados com os créditos do projeto. A imagem conceitual não substitui esses recursos.

## Limites e próxima rodada

- O piloto é uma aproximação jogável da direção aprovada, não uma reprodução idêntica de cada detalhe do conceito. Alguns objetos pequenos ainda usam a arte anterior; os humanos já usam o acervo pronto no bairro.
- As folhas prontas usadas aqui cobrem caminhada e corrida; o arremesso mantém a animação nativa da Poké Bola, sem folha exclusiva do braço. Montarias conservam as poses sentadas anteriores.
- As outras cidades, interiores, Centro por dentro, puzzle e ginásio não receberam essa apresentação. A passagem para o restante do mundo ainda revela a diferença entre estilos do piloto.
- A praia de encontros foi aplicada apenas aos encontros comuns de Coral e treinadores elegíveis. Clareiras, cavernas e demais biomas ficam para uma etapa posterior; online, bandos, reides e ginásios mantêm o fluxo anterior.
- Faltam revisão visual do dono e teste prolongado em iPhone/Safari físico, incluindo memória total de GPU e várias idas e voltas. Os contadores do Chrome não eliminam essa pendência.
- A publicação desta versão foi autorizada pelo dono em 25/10/2026. Os pacotes externos da pesquisa posterior não foram incorporados. O arquivo preexistente `tools/teste-3d/inicial-tmp.mjs` não foi alterado.

## Reprodução

```sh
python3 tools/serve.py 8700
```

Abrir `http://127.0.0.1:8700/?teste&nosw&ir=1720,1968` ou a galeria em `http://127.0.0.1:8700/tools/shots/coral-pixel/index.html`.

```sh
node tools/teste-coral-pixel.mjs
node tools/teste-personagens-coral.mjs
FPS_LIVRE=0 node tools/teste-3d/coral-pixel.mjs antes
FPS_LIVRE=0 node tools/teste-3d/coral-pixel.mjs depois
FPS_LIVRE=0 node tools/teste-3d/coral-navegacao.mjs
FPS_LIVRE=0 node tools/teste-3d/coral-encontro.mjs
PORT=8700 FPS_LIVRE=0 node tools/teste-3d/coral-equilibrio.mjs antes
PORT=8700 FPS_LIVRE=0 node tools/teste-3d/coral-equilibrio.mjs depois
PORTA=8700 FPS_LIVRE=0 node tools/auditar-passagens-npc.mjs
PORT=8700 FPS_LIVRE=0 node tools/teste-3d/combate-paredes.mjs
```
