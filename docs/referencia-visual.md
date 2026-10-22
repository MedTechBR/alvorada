# Referência visual — cidade e rota modelo

> A análise e as primeiras medições abaixo são históricas. A implementação baseada na imagem pintada aprovada está na seção final “Revisão pintada aprovada”.

## Etapa 1 — análise anterior às mudanças do jogo

Data: 22/10/2026. Base publicada: `57e60497`. Trabalho local no branch `visual-referencia`, sem publicar esta etapa.
Referência: [Pocket Champion, vídeo de GameX Ladka](https://www.youtube.com/watch?v=fxpHNIK1AYw), 9min18s, 1280×720, 60 quadros/s no arquivo. Isso não comprova que o jogo rode a 60 fps.

O vídeo foi baixado com yt-dlp, sem erro 403, para `/Users/matheusparente/Documents/Referencias/alvorada-visual-2026-10-22/`, fora do repositório. Foram extraídos 279 quadros, um a cada dois segundos, e 16 quadros adicionais a 2 fps entre 02:34 e 02:42. Não houve acesso a código da referência. Os cortes muito frequentes desse trecho impedem medir aceleração, latência de comando e tempo real de carregamento. As observações de fluidez são qualitativas.

As comparações em `tools/shots/referencia/` retiram apenas as faixas pretas superior/inferior do vídeo e preservam sua proporção, sem mudar cores. Cada painel do Alvorada mede 844×390. Os interiores comparados têm função equivalente, sem pretensão de reproduzir sua planta. A imagem de mata usa a borda arborizada da rota: o vídeo não oferece uma exploração equivalente ao nosso bosque denso. A água visível é um pequeno lago urbano; não permite avaliar rios, espuma ou navegação.

## O que a referência faz melhor

### Visual

- **00:20 e 08:40 — cidade e lago:** piso cinza separado do gramado, telhados com volumes reconhecíveis, sombras sob árvores e beirais. O azul da água se distingue do verde. O Alvorada tem água animada e sombras, mas as estradas ficam amarelas quase brancas, árvores também amarelam e o brilho compete com as portas.
- **06:10–06:20 e 07:20 — rota e borda de mata:** caminho contínuo legível, vegetação alta concentrada em canteiros e árvores fechando a composição. O Alvorada tem setores de mata e LOD, porém flores e pequenos enfeites repetidos atravessam áreas sem função. Não precisamos copiar as árvores como modelos: precisamos organizar as existentes.
- **08:10 — Centro Pokémon; 09:10 — casa:** balcão, entrada e circulação identificáveis; móveis apoiados no piso e contraste entre parede e chão. Nossos interiores já têm esses elementos, mas o desfoque e a luz forte reduzem a leitura dos detalhes.
- **01:30 — arena:** piso amplo e poucos volumes no centro; os lutadores ganham contraste. Nossa arena já tem espaço amplo. Nesta rodada não se altera batalha, puzzle ou equilíbrio.
- **Céu, escala e contorno:** na exploração a referência usa enquadramento alto e quase não mostra céu. A identidade dos lugares vem do chão, dos prédios e das bordas. Os personagens contrastam com o piso. Não há evidência para justificar um céu novo, texturas maiores ou contorno de tela inteira no Alvorada.

### Fluidez

- **06:10–06:20 e 07:18–07:30:** câmera mantém orientação e distância previsíveis enquanto o personagem atravessa a rota. A sequência sugere acompanhamento estável. No Alvorada há amortecimento, mas giro automático e aproximação ao ficar parado deslocam os pontos de referência sem uma ação do jogador.
- **02:34–02:42:** os quadros adicionais mostram ciclos de caminhada e acompanhamento, mas também cortes e reposicionamentos da edição. Não é possível extrair uma curva de aceleração confiável. Nosso movimento clássico começa e termina com velocidade constante; o livre já tem amortecimento.
- **07:32 e 08:04–08:08:** há telas escuras/transições. Sua duração não deve ser interpretada como tempo de carga por causa dos cortes. No Alvorada podemos medir a transição implementada: porta usa 0,22 s para escurecer e 0,28 s para reaparecer. É possível encurtar o fade sem encurtar a proteção contra reentrada.

### Organização do cenário

- **00:20, 08:20 e 09:00:** frente dos prédios limpa e ligada diretamente à rua; jardins em ilhas, árvores na borda e telhados como marcos. O laboratório é reconhecível por forma e posição, sem depender de uma seta.
- **06:10–06:20:** caminho principal contínuo; mato de encontro ao lado, em massas. O vazio no centro serve à circulação. A nossa ampliação mantém travessias longas, mas repete módulos de flores em áreas abertas; espalhar mais objetos agravaria isso.
- **07:20:** borda de coníferas conduz à cidade. Reaproveitar bordas existentes é mais seguro que acrescentar sólidos: conserva as rotas do guia e não cria paredes invisíveis.
- A interface da referência é carregada de chat, nomes e avisos. Isso não é um objetivo visual desta rodada.

## Inventário

| Item | Já existe | Falta / decisão |
|---|---|---|
| Luz e paleta por bioma | Sol, hemisfério, dia/noite, climas | Reduzir amarelo e brilho, preservar identidade dos biomas |
| Sombras | Sombra de contato e volumes | Ganhar leitura com gradação, sem mapa de sombra maior |
| Céu | Céu procedural e horizonte | Manter; não é a principal diferença observada |
| Água | Material animado e margens | Lago da referência é evidência limitada; não refazer água |
| Vegetação | Árvores LOD, grama e sub-bosque | Agrupar no piloto e retirar ruído do eixo principal |
| Personagens e contorno | Sprites PMD e sombras | Manter resolução e retirar desfoque que reduz leitura |
| Caminho principal | Trilhas ampliadas e acessos | Tornar bordas e canteiros intencionais no piloto |
| Frentes de prédios | Portas e alamedas | Faixa visual limpa; não mover porta ou destino |
| Movimento | Grade e movimento livre | Entrada/saída suave na exploração, sem alterar combate |
| Câmera | Amortecimento, enquadramento e oclusão | Tirar deriva e zoom ocioso; preservar câmera de combate |
| Portas | Fade e reposicionamento | Fade mais rápido, enquadrar durante o escuro |
| Memória por setor | Montagem e descarte 3D | Evitar metadados vazios do mundo inteiro; conferir descarte de janelas |
| Pós-processamento | Pirâmide HDR e raios | No celular, usar composição simples já existente, sem buffers extras |

## Oito mudanças em ordem de impacto

| Ordem | Mudança | Arquivos previstos | Porte | Custo no iPhone |
|---|---|---|---|---|
| 1 | Imagem nítida e paleta menos estourada usando o pós simples no toque | `visual3d/ambiente/pos.js`, `visual3d/letsgo/luz.js` | M | Reduz passes e buffers; sem textura nova |
| 2 | Setores vazios sob demanda e descarte de luz de janela | `world/map.js`, `visual3d/setores.js` | M | Reduz heap e evita retenção de geometria |
| 3 | Cidade piloto: frentes limpas e jardins nas bordas | `world/paisagem.js`, `world/build.js` | M | Reaproveita terreno; sem novos sólidos ou malhas |
| 4 | Rota piloto: canteiros ligados às bordas e eixo principal livre | `world/paisagem.js` | M | Menos ruído; quantidade de objetos não aumenta |
| 5 | Câmera estável ao parar e ao caminhar | `visual3d/camera.js` | P | Mesmo número de consultas, menos oscilação |
| 6 | Aceleração/frenagem da exploração clássica | `world/grade.js` | M | Conta escalar por quadro; Pokémon em combate preservado |
| 7 | Porta rápida e câmera assentada no escuro | `world/life.js` | P | Sem recursos adicionais |
| 8 | Aplicar composição ao restante do continente | futuras receitas por região | G | Adiado até comprovar o piloto; sem preenchimento indiscriminado |

## Medição inicial

Chrome sem interface com GPU Metal, CPU limitada em 4×, viewport 844×390, DPR do dispositivo 2 (o renderizador mantém seu limite de resolução de toque). `chrome.mjs` desliga vsync/limite de quadros: os intervalos medem capacidade deste teste, não prometem fps de iPhone. Qualidade alta nas seis amostras. Mesma sequência de quatro comandos de 1,5 s, três voltas alternando cidade/rota, aquecimento de ambas antes da primeira amostra. Os selvagens são retirados e o roteiro suspenso somente no teste para isolar exploração. Os resultados brutos e distância realmente percorrida estão em `tools/resultados/referencia/antes.json`.

| Local | p95 quadro (ms) | p95 lógica CPU (ms) | Pico heap (MB) | Heap após GC (MB) | Geometrias | Texturas |
|---|---:|---:|---:|---:|---:|---:|
| Cidade — antes | 14,00 | 7,20 | 405,94 | 374,61 | 149 | 127 |
| Rota — antes | 10,00 | 6,10 | 404,23 | 375,15 | 149 | 127 |

Valores são medianas das três amostras de cada lugar. `performance.memory` mede heap JS, não toda a memória do processo ou GPU; `renderer.info` informa contagens, não bytes de VRAM. Não equivale a uma medição em Safari/iPhone físico. A tabela final deve manter ou reduzir cada indicador de desempenho e memória; regressão exige ajuste antes da entrega.

## Etapa 2 — resultado do modelo

A composição ficou restrita à Vila Alvorada e à Rota 1. A vila ganhou canteiros junto às fachadas e gramado contínuo na circulação; a rota perdeu a repetição de manchas floridas no terreno inteiro e ganhou pequenos trechos floridos junto à estrada. Mato de encontros, objetos sólidos, portas, destinos e pontos da história foram preservados. A terra ficou mais neutra e com menos manchas claras. A primeira versão dos canteiros estava carregada; a captura levou à redução da faixa de flores antes de fechar o modelo.

No piloto, a câmera conserva orientação e escala ao parar, mantendo o amortecimento e a resposta à oclusão. O treinador ganha velocidade nos primeiros 90 ms e amortece a conclusão do último passo, sem frear a cada bloco. Essa mudança não é aplicada a Pokémon em combate, atores ou montarias. A porta usa fade de 0,14 + 0,18 s e reposiciona a câmera no escuro; a proteção de reentrada continua em 0,5 s.

No celular, o pós simples existente substitui os passes de redução e raios; cinco render targets deixam de ser criados. O mapa não aloca mais metadados para todos os setores vazios do continente. O descarte 3D também libera a geometria da luz de janela, que antes só era liberada ao refazer o setor.

### Capturas e comparações

Todas as capturas normalizadas do jogo têm 844×390. Os pontos do modelo são os mesmos antes/depois: cidade `(1523,1750)` e rota `(1240,1750)`, às 11h. Há animações e moradores em movimento; os atributos aleatórios do Pokémon inicial do modo de teste não foram usados como medida de equilíbrio.

- [Cidade — referência e versão anterior](../tools/shots/referencia/cidade.jpg)
- [Rota — referência e versão anterior](../tools/shots/referencia/rota.jpg)
- [Mata — trecho de rota arborizada e caminho do bosque](../tools/shots/referencia/mata.jpg)
- [Margem — lago da referência e margem do Alvorada](../tools/shots/referencia/margem.jpg)
- [Interior de casa](../tools/shots/referencia/casa.jpg)
- [Centro Pokémon](../tools/shots/referencia/centro.jpg)
- [Ginásio / arena](../tools/shots/referencia/ginasio.jpg)

![Cidade: antes e depois](../tools/shots/referencia/cidade-antes-depois.jpg)

![Rota: antes e depois](../tools/shots/referencia/rota-antes-depois.jpg)

### Desempenho final — antes × depois

Mesmo roteiro de comandos e configuração da medição inicial, três voltas alternadas por local. A medição final foi feita após terminar os testes pesados em Node. As distâncias efetivas estão nos JSON; colisões e moradores podem alterar o deslocamento, por isso também se registra a distância e se exige caminhada real. Não se promete repetição pixel a pixel de NPCs aleatórios.

Nesta tabela, p95 e heap após GC são medianas das três amostras; **pico de heap e contagens de recursos são os máximos** das três, mais conservadores que a mediana da tabela inicial. O comparador reprova qualquer aumento, sem tolerância percentual.

| Local | Versão | p95 quadro (ms) | p95 lógica CPU (ms) | Pico heap (MB) | Heap após GC (MB) | Geometrias máx. | Texturas máx. |
|---|---|---:|---:|---:|---:|---:|---:|
| Cidade | Antes | 14,00 | 7,20 | 408,75 | 374,61 | 151 | 128 |
| Cidade | Depois | 11,60 | 6,30 | 396,31 | 362,01 | 140 | 111 |
| Rota | Antes | 10,00 | 6,10 | 408,30 | 375,15 | 151 | 128 |
| Rota | Depois | 8,40 | 4,20 | 402,96 | 363,49 | 140 | 111 |

Nenhum dos indicadores aumentou. Fontes: `tools/resultados/referencia/antes.json`, `depois.json` e `comparacao.json`. A amostra intermediária foi preservada em `intermediario.json`; não representa o modelo final. Repetir: `node tools/teste-3d/referencia-desempenho.mjs depois` e `node tools/teste-3d/referencia-comparar.mjs`.

### Validação

As 14 verificações solicitadas em Node passaram: dados, jornada, jornada completa, progressão, alvos/passos, guia, caminhada do guia, sólidos, saídas, falantes, obtenção, invisíveis, geografia e vestir `--verificar`. Logs individuais e códigos de saída em `tools/resultados/referencia/`.

- `auditar-invisiveis`: **0 achados** nos dois mundos.
- `PORTA=8700 node tools/auditar-passagens-npc.mjs`: **179 NPCs, nenhum fecha passagem**.
- `referencia-exploracao.mjs`: aceleração intermediária, parada no centro do bloco, nenhuma posição sólida no percurso, orientação e zoom estáveis ao parar, porta chegando ao Centro, shaders sem erro e pós sem buffers de redução no toque.
- Descarte: **70 geometrias próprias liberadas de 70**, incluindo **uma luz de janela real**; o mundo deixou **50.832 setores sem metadados vazios alocados** nessa sessão.
- Porta na execução final: **0,331 s de tempo de jogo / 0,507 s reais**, incluindo montagem da sala. Uma execução anterior com outras auditorias em andamento levou 0,989 s reais: o fade mais curto não elimina custo de primeira montagem ou contenção da máquina.
- Comparador de desempenho: passou nos seis indicadores de cada local.

Chrome sem interface usa `chrome.mjs` e `--mute-audio`; as medições finais foram isoladas. Os navegadores de teste foram encerrados; o Chrome pessoal não foi encerrado. Não foi necessário executar novamente testes de equilíbrio porque não houve edição de lógica de combate, recargas, dano ou dados de Pokémon.

### Mudanças por arquivo

| Arquivo | Resultado |
|---|---|
| `src/world/piloto-visual.js` | Recorte do modelo, jardins da vila e faixas de vegetação da rota, apenas com terrenos transitáveis |
| `src/world/build.js` | Aplica a composição depois da montagem do núcleo |
| `src/visual3d/letsgo/chao.js` | Terra mais neutra no modelo e menos manchas claras, com máscaras existentes |
| `src/visual3d/letsgo/luz.js` | Luz menos amarela, exposição menor e nitidez do modelo; mistura gradual ao entrar/sair |
| `src/visual3d/camera.js` | Remove giro ocioso e variação de escala na exploração do modelo |
| `src/world/grade.js` | Aceleração e conclusão suave do último passo do treinador explorando |
| `src/world/life.js` | Porta mais rápida e reinicialização do foco da câmera no escuro |
| `src/world/map.js` | Metadados dos setores criados sob demanda, com acesso seguro em edição e movimento de objetos |
| `src/world/masmorra.js` | Compatibilidade de objetos móveis com setores ainda não alocados |
| `src/visual3d/ambiente/pos.js` | Composição simples no toque, sem criar pirâmide e alvo radial |
| `src/visual3d/setores.js` | Libera também a geometria de luz das janelas ao descartar um setor |
| `tools/teste-3d/referencia-desempenho.mjs` | Percurso antes/depois com CPU 4×, heap e recursos |
| `tools/teste-3d/referencia-comparar.mjs` | Reprova regressão dos indicadores definidos |
| `tools/teste-3d/referencia-exploracao.mjs` | Verifica controle, câmera, porta, colisão e descarte no navegador |
| `tools/shots/referencia/` | Sete comparações com vídeo e fotos antes/depois do modelo |
| `tools/resultados/referencia/` | Medições, auditorias e resultados reproduzíveis |

### Próxima rodada e limites

Não foi espalhado o novo desenho pelo restante do continente. O modelo melhorou nitidez e hierarquia, mas uma revisão de composição das outras cidades exige trabalhar seus marcos e caminhos individualmente. Também ficaram de fora uma reformulação de mata densa, água, céu, interiores e ginásios; as imagens desses lugares nesta etapa são comparações diagnósticas. A referência não permite medir carregamento real, aceleração exata ou desempenho do jogo filmado.

Não houve teste em iPhone físico/Safari nem medição dos bytes totais de GPU. A redução observada no Chrome é evidência de melhora, não prova de que o fechamento do aplicativo por memória foi eliminado. Permanece necessário um teste longo no aparelho que apresentava o problema.

A revisão anterior `57e60497` foi publicada e conferida no site antes de começar esta etapa. Os commits de `visual-referencia` permanecem locais, **sem push**.

## Revisão pintada aprovada — 22/10/2026

Após a rejeição da tentativa com formas simplificadas, `266c8829` restaurou o desenho anterior. O usuário aprovou um conceito de vila com materiais pintados, árvores folhosas detalhadas, telhas vermelhas, reboco claro, rua de pedra e jardins junto às fachadas. Esta rodada implementa esse direcionamento na vila inicial e no trecho piloto da Rota 1. Continua local, no branch `visual-referencia`, sem push.

O [conceito aprovado](../tools/shots/referencia/pintado-conceito-aprovado.jpg) é uma imagem gerada. As [fotos antes/depois da cidade](../tools/shots/referencia/pintado-cidade-comparacao.jpg), da [rota](../tools/shots/referencia/pintado-rota-comparacao.jpg) e da [borda de mata](../tools/shots/referencia/pintado-mata-comparacao.jpg) são capturas do jogo. Cada painel mede 844×390; as capturas brutas foram feitas em DPR 2 e reduzidas para apresentação, sem alterar cores. O [painel conceito × jogo](../tools/shots/referencia/pintado-conceito-e-jogo.jpg) distingue explicitamente os dois.

### Resultado e escopo

- Atlas único de 512×512 para folhas, telhas, reboco e pedra. Paredes e telhados continuam sendo volumes 3D, com portas, janelas, floreiras e cantaria; o conceito não virou um fundo estático.
- Copas recortadas com detalhe pintado, profundidade e sombra respeitando o alfa. Árvores normais, coníferas, grandes, ipês e paineiras reutilizam o atlas; folhas douradas/rosadas preservam sua identidade por transformação de cor. Oran e Pecha conservam frutos e estado de colheita.
- Rua contínua na quadra inicial, jardins e cercas fora do acesso da porta, árvores em gramado livre para enquadrar a fachada e retirada dos postes redundantes. Ao retirar um poste, sua colisão também é removida, salvo se outro objeto ocupar a célula. As novas árvores/cercas têm pegadas sólidas reais, verificadas pelos testes de navegação.
- Grama menos fluorescente; sem bloom nem raios sobre o piloto. Pequeno deslocamento do foco para mostrar a fachada e suas copas, mantendo orientação, escala e acompanhamento estáveis. Não houve nova alteração de controle, transições ou combate nesta rodada.
- Modelos fora do recorte continuam com seu desenho anterior. Arbustos e flores menores ainda reutilizam modelos existentes; não foi prometida equivalência completa ao conceito em todo o catálogo.

### Memória e desempenho

O atlas é compartilhado por materiais e setores; não há uma cópia por objeto. As árvores pintadas dispensam a segunda malha de LOD: seus recortes têm menos triângulos que os modelos anteriores. Sombras também descartam o fundo transparente, evitando retângulos escuros no chão. A passagem de cor amostra o atlas uma vez; a tabela de associação de sprites usa referências fracas e atualiza os setores visíveis, evitando reconstruir um conjunto completo a cada quadro.

No toque, o cache 3D guarda até 20 setores, sem descartar setores necessários à vista. O cache 2D guarda 16 setores não visíveis. Quando o chão 2D está desativado porque o 3D desenha o terreno, seu buffer transparente ocupa um pixel, em vez de 256²; a escala espacial do setor continua a mesma. O teste adicional confirma que o modo 2D continua com setores de 256 px. **A resolução do render 3D não foi reduzida.** Máscaras, geometrias mescladas, imagens de setores e referências a sprites destruídos são liberadas ao sair do cache. O atlas único permanece vivo durante a sessão.

Protocolo: Chrome/Metal, 844×390, DPR solicitado 2, CPU 4×, qualidade alta, mesmo percurso automatizado e três voltas alternando cidade/rota. O DPR interno segue o limite preexistente do jogo no toque (1,5); não é correto descrever esta execução como render interno a DPR 2. A comparação mede mediana do p95 de quadros/CPU, mediana do heap após GC e máximo dos picos de heap/recursos entre as voltas. As medições finais foram feitas com um único Chrome de teste e sem auditorias concorrentes. Um processo órfão da primeira tentativa de conexão foi identificado e encerrado; aquela amostra foi descartada e o antes foi refeito.

| Local | Etapa | Quadro p95 (ms) | CPU p95 (ms) | Heap após GC (MiB) | Pico de heap (MiB) | Geometrias | Texturas |
|---|---|---:|---:|---:|---:|---:|---:|
| Cidade | Antes | 12,30 | 6,30 | 363,06 | 396,63 | 144 | 113 |
| Cidade | Depois | 10,90 | 5,90 | 345,29 | 384,94 | 118 | 92 |
| Rota | Antes | 8,30 | 3,90 | 363,54 | 395,64 | 144 | 113 |
| Rota | Depois | 7,40 | 3,40 | 347,43 | 385,17 | 118 | 92 |

Resultado: nenhum dos seis indicadores aumentou. Par final: `266c882` → `e1e5aba3`. Fontes: `tools/resultados/referencia/pintado-par-antes.json`, `pintado-par-depois.json` e `pintado-par-comparacao.json`. O depois foi repetido após a correção da sombra dos objetos dinâmicos. As amostras anteriores permanecem identificadas como intermediárias.

Repetir o depois: `node tools/teste-3d/referencia-desempenho.mjs pintado-par-depois`; comparar: `node tools/teste-3d/referencia-comparar.mjs pintado-par-antes pintado-par-depois pintado-par-comparacao`. Para repetir o antes, usar a revisão `266c882` com o mesmo script de medição, em sequência e sem outro Chrome de teste aberto.

As versões intermediárias em `tools/resultados/pintado/` documentam a descoberta do pico de heap maior e as correções de cache/buffers. Não são o resultado final. O comparador reprova qualquer aumento nos seis indicadores.

### Arquivos desta rodada

| Arquivo | Mudança |
|---|---|
| `assets/visual/pintado/vila.png`, `LEIAME.md` | Atlas compartilhado, origem e descrição do recurso |
| `src/visual3d/letsgo/pintura.js` | Amostragem do atlas, cores de folhagem, descarte de alfa no material e na sombra |
| `src/visual3d/letsgo/modelos-pintados.js` | Árvores do piloto, frutos colhíveis e fachada com cantaria |
| `src/visual3d/letsgo/modelos.js` | Perfil separado de modelos, UV por peça e projeção correta nas caixas chanfradas |
| `src/visual3d/letsgo/modelos-todos.js` | Registro do perfil pintado |
| `src/visual3d/kit/construtor.js` | Preserva UV ao mesclar, só aloca o atributo onde necessário |
| `src/visual3d/kit/modelos-setor.js` | Seleciona perfil por localização, usa sombra recortada e evita duplicar LOD das árvores pintadas |
| `src/visual3d/letsgo/index.js` | Integra o atlas ao material compartilhado |
| `src/visual3d/letsgo/chao.js` | Pedra e grama pintadas no recorte piloto; evita amostragem adicional fora dele |
| `src/visual3d/letsgo/luz.js` | Luz e gradação sem lavar detalhes com dourado ou bloom |
| `src/visual3d/camera.js` | Folga de enquadramento ao norte na exploração do piloto |
| `src/world/piloto-visual.js` | Rua, jardins, cercas, moldura de árvores e retirada segura dos postes |
| `src/visual3d/setores.js` | Cache menor no toque, com descarte existente |
| `src/world/map.js` | Buffers transparentes mínimos no 3D, cache 2D menor no toque e liberação das listas de animação |
| `tools/auditar-invisiveis.mjs` | Audita o perfil realmente usado; planos com transparência não contam como paredes opacas |
| `tools/teste-pintura.mjs` | Cache por perfil, UV nas mesclas, economia de triângulos e estado de frutos |
| `tools/teste-3d/pintura-piloto.mjs` | Atlas real carregado, sombra, descarte de malhas e regressão do modo 2D |
| `tools/teste-3d/referencia-{desempenho,comparar,exploracao}.mjs` | Rótulos de comparação, identificação da revisão inicial e saída de resultado separada |
| `tools/shots/referencia/pintado-*`, `tools/resultados/pintado/` | Evidências visuais e registros desta revisão |

### Verificações e limites

As 14 verificações solicitadas em Node passaram, além de `tools/teste-pintura.mjs`; códigos e logs em `tools/resultados/pintado/node.json`. A auditoria de invisíveis foi repetida após os últimos modelos: **0 achados**, nos dois mundos, em `auditar-invisiveis-final.log`.

- Render real: atlas 512×512 carregado e compartilhado, **8 de 8 malhas pintadas** com material de sombra recortada.
- Descarte do piloto: **6 de 6 geometrias próprias** liberadas; **2 geometrias compartilhadas** preservadas, sem `dispose` indevido. A associação de sprites removidos/recriados também passou.
- Buffers: visita a região nova com 3D ativo confirmou buffers transparentes de um pixel. Uma segunda sessão, em 2D, confirmou setores de **256×256**, sem erro de console.
- Exploração: movimento, colisão, câmera estável, porta e shaders passaram. Descarte de **43 de 43 geometrias**, incluindo luz de janela; porta em **0.330 s de jogo / 0.488 s reais** nesta sessão.
- `PORTA=8700 node tools/auditar-passagens-npc.mjs`: **179 NPCs, nenhuma passagem bloqueada**.
- Comparador final: **todos os indicadores passaram**, sem tolerância para aumento.

Pontos das fotos: cidade `(1523,1750)`, estrada `(1240,1750)`, borda de mata `(1238,1705)`, sempre às 11h. As capturas usam `foto.mjs`, com `CEL=1 W=844 H=390 PORT=8700`, `nosw&shaders=1`, roteiro suspenso após o diálogo inicial e diálogo fechado para a foto. Chrome sem interface, `--mute-audio`, um por vez. Somente os processos iniciados nesta tarefa foram encerrados.

Não houve publicação. Não foi alterada a lógica de dano, cooldowns, IA, roteiro, diálogos, dados de Pokémon ou barreiras da progressão. O piloto ainda não equivale integralmente à pintura conceitual: flores menores, arbustos, lavouras, mobiliário e parte das construções conservam modelos anteriores. Água, interiores, ginásios e o restante do continente ficam para outra rodada, depois da avaliação deste modelo. A imagem aprovada não foi usada para alegar desempenho ou fidelidade que só uma captura do motor pode comprovar.

Não foi testado em iPhone físico/Safari. `performance.memory` e contagens do renderer não medem todos os bytes de GPU nem provam que o fechamento por falta de memória foi eliminado. É necessário um teste prolongado no aparelho que apresentava o problema.

### Continuação após a aprovação do piloto

O estilo foi estendido ao restante do jogo em outra rodada. Escopo por arquivo, fotos, medições e limitações estão em [expansao-visual-pintada.md](expansao-visual-pintada.md). A seção anterior permanece como registro do piloto e de seus resultados.
