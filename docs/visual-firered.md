# Exploração FireRed

Implementação local no branch `visual-firered`, a partir do publicado `b307145e`. Esta rodada não foi publicada.

## Direção adotada

A exploração passa a ser 2D no Pixi, com câmera fixa, escala inteira e pixels sem filtragem. O padrão inicial deixa de carregar o renderizador Three. A opção `?visual=3d` permanece disponível para diagnóstico.

Chão, caminhos, praças, paredes, casas comuns, Centro Pokémon, loja, laboratório, árvores e mobiliário usam peças gráficas prontas de FireRed. Os edifícios conservam as proporções originais; seus lotes maiores no Alvorada recebem arbustos, mantendo a porta na coluna da passagem real. Não foram importados mapas de Kanto.

Os humanos usam folhas FireRed, sem misturar o tamanho dos personagens HGSS. Crianças, adultos e idosos conservam suas identidades e alturas próprias. O jogador mantém as cores escolhidas, direção, passos, pose de montaria e avatar online.

As caixas de localização, diálogo, menu, minimapa e botões de toque recebem acabamento claro com moldura escura. O minimapa continua fixo ao norte e abre o mapa detalhado. O botão de montaria permanece disponível onde a montaria é permitida. Salas pequenas ficam centralizadas; salas maiores limitam a câmera às suas bordas.

## Arte e procedência

Fontes gráficas: [pret/pokefirered](https://github.com/pret/pokefirered), revisão `ce6406d8c2eaf46d543c8a2606de0c3cb1951982`. O preparo decodifica metatiles de 16 pixels, paletas e espelhamento e converte folhas de personagens para a leitura existente. O índice guarda os hashes dos arquivos utilizados. Créditos em `assets/CREDITOS.md`.

Os arquivos do pacote novo somam aproximadamente 322 KiB (640 KiB ocupados no disco desta máquina). Os atlas têm 256 pixels de largura; o de objetos, 512×512. Neve, lama e lava reaproveitam pixels com paletas curtas. Elementos exclusivos sem correspondente pronto — como o farol, mecanismos de masmorra e alguns monumentos — conservam seus sprites funcionais do Alvorada. Pokémon continuam usando o acervo PMD existente.

Reprodução das peças:

```sh
python3 tools/firered/baixar.py
python3 tools/firered/preparar.py
```

## Combate preservado

Encontros, lutas de treinador, ginásios, reides, duelos online e um confronto hostil já em curso no campo usam o compositor anterior. Dano, recarga global, cura, IA, esquiva, dificuldade e regras de entrada/saída não foram reformulados. A mudança de apresentação restaura as camadas nativas ao entrar na luta e libera os setores, objetos e personagens da arena ao retornar. Barreiras próximas continuam aparecendo quando o confronto usa o próprio mapa; não são copiadas para uma arena separada.

Cada compositor passa a ter seu próprio bitmap do jogador. Isso corrige o caso em que a limpeza da arena destruía a textura compartilhada pelo avatar da exploração.

## Memória e fluidez

A inspeção do heap identificou um problema anterior do desenho 2D: as barreiras do continente inteiro eram trianguladas juntas. Uma amostra continha 35.794 peças e 109.608 instruções gráficas, mesmo estando longe da câmera. Agora somente os setores próximos recebem desenho; as 385.619 células de colisão dessa amostra permaneceram iguais no teste.

O chão clássico adianta somente quatro setores próximos, evitando montar e descartar repetidamente todo o anel externo. A decoração antiga, que não aparece no novo compositor, deixa de ser instanciada. Objetos e mato mantêm texturas estáveis; camadas ocultas só mudam de visibilidade ao trocar de modo ou mapa. A margem de água usa cópia direta de pixels, evitando alocações por pixel.

Na exploração clássica, os itens no chão também passam a ser consultados por setor. Distância de coleta, quantidade e chaves atuais e legadas do save permanecem iguais. O teste no navegador verifica a coleta real e que esperar no mesmo ponto não duplica o item.

Ensaio comparativo: publicado `b307145e` servido em 8701 e branch atual em 8700, Chrome com CPU 4× mais lenta, viewport 844×390, DPR 2, qualidade alta, mesmos pontos e comandos de caminhada, um navegador por vez. Cada amostra tem 3,6 s, após estabilização e coleta de lixo. Os pequenos desvios de distância decorrem do passo por quadro: Coral 232,7 → 229,3 px, Campina 96 → 96 px e rota 224,1 → 227,9 px.

| Percurso | CPU p95 antes → depois | Intervalo de quadro p95 antes → depois | Heap após GC antes → depois | Pico de heap antes → depois |
| --- | --- | --- | --- | --- |
| Coral | 12,4 → 10,2 ms | 14,2 → 13,0 ms | 192,4 → 172,5 MiB | 198,2 → 177,6 MiB |
| Campina | 9,6 → 5,3 ms | 11,1 → 6,4 ms | 195,1 → 174,0 MiB | 202,5 → 178,0 MiB |
| Rota | 10,5 → 5,0 ms | 13,1 → 6,5 ms | 195,8 → 174,0 MiB | 207,4 → 180,2 MiB |

Todos os três percursos melhoraram nesta execução. As amostras são curtas e não certificam o jogo inteiro. Dados brutos em `tools/resultados/firered/desempenho.json`. O renderizador Three da referência mantinha 16 geometrias e 15 texturas; na nova exploração nenhum é instanciado. As imagens/canvases próprios estimados passaram de 6,13 para 4,89 MiB em Coral, de 5,23 para 5,61 MiB em Campina e de 5,84 para 4,60 MiB na rota. Esse contador parcial de pixels aumentou em Campina, embora o heap total e seu pico tenham caído. Ele não representa toda a memória de GPU.

Para repetir a comparação, manter o servidor atual em 8700 e iniciar a referência em outro terminal:

```sh
REFERENCIA=b307145e PORTA=8701 python3 tools/teste-3d/cidades-baseline.py
node tools/teste-3d/firered-desempenho.mjs
```


## Verificação e imagens

Resultados em `tools/resultados/firered/`. O teste específico de terreno cobre os 79 tipos, sólidos visíveis, recorte incremental, limites dos atlas e identidades dos personagens.

Os 23 testes em Node passaram: os 14 exigidos para dados, jornada, progressão, guia, sólidos, saídas, falantes, obtenção, invisíveis, geografia e vestimenta; mais os testes existentes de Coral, pintura, compositor pixel, personagens, identidade, revisão de combate, exploração de rotas e rotas compactas, e o novo `teste-firered.mjs`. A auditoria de invisíveis terminou com zero achados em Alvorada e Ocaso.

O teste no navegador visita seis cidades, laboratório, casa, Centro, ginásio, gruta, mata, ruína e Ocaso. Verifica escala, botões dentro da tela, montaria terrestre, movimento na água, troca para a arena e retorno ao mapa original sem invalidar texturas. Também verifica a seleção local das barreiras sem alterar colisões.

No navegador, passaram `firered-jogo.mjs`, `firered-interface.mjs`, `auditar-passagens-npc.mjs`, `batalha-fluida.mjs`, `combate-paredes.mjs` e `exploracao-rotas.mjs`. A auditoria avaliou 181 NPCs parados sem passagem fechada. O teste de paredes executou 24 lutas, 20.160 quadros e 643 golpes, com dano real e zero violações. O teste de rotas entrou nos três desvios, abriu os baús, operou a alavanca da ruína e retornou pelos portais. O teste de interface abriu o mapa pelo minimapa, verificou o desenho, aproximou e fechou sem erros de página.

Comandos de navegador desta rodada (servidor em 8700; executar um por vez):

```sh
node tools/teste-3d/firered-jogo.mjs
node tools/teste-3d/firered-interface.mjs
PORTA=8700 node tools/auditar-passagens-npc.mjs
PORT=8700 SEG=6 SOFPS=1 OUT=tools/shots/firered/fluida node tools/teste-3d/batalha-fluida.mjs selvagem 3 4
PORT=8700 node tools/teste-3d/combate-paredes.mjs
node tools/teste-3d/exploracao-rotas.mjs
```

Fotos reais e comparação dos mesmos pontos: [galeria FireRed](../tools/shots/firered/index.html). Gerar as cópias em 844×390 após os testes:

```sh
python3 tools/firered/galeria.py
```

## Limites desta rodada

O visual foi reconstruído sobre os mapas, conteúdo e progressão do Alvorada. Não é uma reprodução de Kanto, nem substitui cada objeto exclusivo por um equivalente FireRed inexistente. Os elementos preservados podem receber uma rodada posterior de acabamento no mesmo padrão.

Não houve teste em iPhone físico/Safari nem uma sessão online entre dois aparelhos. A seleção de apresentação de duelos e reides possui teste de estado; isso não substitui a validação completa dessas sessões. As medições do Chrome ajudam a comparar as versões, mas não certificam a memória total do aparelho ou a eliminação dos fechamentos no iPhone.

## Arquivos principais

| Arquivo | Mudança |
| --- | --- |
| `assets/firered/`, `assets/CREDITOS.md` | Atlas, personagens, identidades e procedência. |
| `tools/firered/baixar.py`, `preparar.py`, `galeria.py` | Obtenção reproduzível da arte, conversão e fotos de revisão. |
| `src/visual2d/firered/index.js` | Novo compositor de exploração, câmera e troca para o combate existente. |
| `src/visual2d/firered/estado.js` | Seleção da apresentação para todas as modalidades de combate. |
| `src/visual2d/firered/terreno.js` | Correspondência dos terrenos e pintura incremental com os blocos originais. |
| `src/visual2d/firered/objetos.js` | Montagem das peças e alinhamento das portas sem esticar edifícios. |
| `src/visual2d/firered/interface.css` | Molduras, tipografia e controles da exploração. |
| `src/visual2d/coral-pessoas.js` | Leitura FireRed, escala original, avatares e propriedade das texturas. |
| `src/visual2d/coral.js` | Liberação dos recursos da arena conservando o atlas de entrada. |
| `src/main.js` | Exploração 2D como padrão, carga do compositor e preferência própria de zoom. |
| `src/world/map.js` | Pintura e água configuráveis, cache e pré-carga limitada no modo clássico. |
| `src/world/barreiras.js` | Desenho de barreiras limitado à câmera, com colisões preservadas. |
| `src/world/life.js` | Busca local dos itens no chão durante a exploração clássica. |
| `src/world/minimap.js`, `src/ui/mapa-detalhado.js` | Mapas usam o mesmo desenho da exploração. |
| `src/ui/menu.js`, `src/ui/options.js` | Padrão 2D e remoção do seletor antigo. |
| `tools/teste-firered.mjs`, `tools/teste-3d/firered-*.mjs` | Testes de terreno, exploração e comparação de desempenho. |
| `tools/teste-3d/cidades-baseline.py` | Referência e porta configuráveis para comparar com o publicado. |
| `tools/vestir/hooks.mjs`, `tools/vestir/stubs/biomas.mjs` | Interface de biomas completa nos testes de dados sem navegador. |
| `tools/resultados/firered/`, `tools/shots/firered/` | Resultados e fotos reais de revisão. |
| `tools/shots/exploracao-rotas/*.jpg` | Fotos atualizadas da entrada, exploração e destino dos três desvios. |
