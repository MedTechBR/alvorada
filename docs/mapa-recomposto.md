# Mapa recomposto e leitura do combate — 22/10/2026

A expansão anterior aumentou as distâncias sem manter a escala dos quarteirões. Esta revisão mantém o continente externo de 4200×3360 blocos, aproxima as construções dentro de 14 núcleos e recompõe o terreno ao redor delas. Não reduz a velocidade do jogador nem acrescenta adversários.

## Cenário

As ruas, praças, casas, portas, cercas, moradores e pontos das cenas acompanham os núcleos compactos. Uma transição contínua encontra as estradas externas. As áreas usam a posição inversa dessa transformação para reconhecer corretamente cidade, ginásio e bioma; o centro de Campina deixa de ser identificado como ginásio.

Vegetação baixa, flores, cogumelos e seixos preenchem manchas irregulares nas clareiras. Esse preenchimento é atravessável: uma tentativa com árvores sólidas foi descartada porque bloqueava esquivas e aumentava o dano recebido no ensaio automático. As árvores preexistentes continuam sólidas.

Quatro recantos novos têm composição própria e pequenos recursos, sem alterar roteiro ou níveis:

- Recanto do Ipê: ipê, banco, árvores Oran e Pecha, uma Poção.
- Jardim dos Cogumelos: árvore grande, cogumelos, banco e uma Oran.
- Pomar do Espelho: três árvores de fruta, poço, banco e uma Poção.
- Clareira dos Ventos: moinho, banco, árvore Pecha e três Poké Bolas.

Eles ocupam clareiras transitáveis já existentes, sem abrir passagens em rios, mata fechada ou barreiras da campanha. As posições são estáveis ao recarregar e ao voltar de outro continente. Não são novos capítulos ou regiões completas: a revisão concentra-se na composição das cidades e nas rotas existentes.

Saves dos layouts 2 e 3 migram para o layout 4. Equipe, dinheiro, insígnias, interiores, outros continentes e coleta anterior são preservados; a migração é idempotente. Uma posição que ficou sobre obstáculo procura chão livre próximo antes de recorrer à posição inicial.

## Mapa do menu e minimapa

O mapa abre centrado no jogador, com zoom, arraste, pinça, roda do mouse, teclas +/− e botões Você/Região. Perto, desenha o terreno e os sprites reais das construções, árvores, postes, bancos, cercas e demais objetos. Não usa apenas retângulos coloridos para representar os objetos. A névoa continua cobrindo setores não explorados.

Os detalhes são desenhados apenas no recorte visível; o panorama tem largura máxima de 1536 pixels. Outros continentes usam uma fonte própria de terreno e objetos, sem trocar o mundo em que o jogador está.

O minimapa fica sempre orientado ao norte, ignora a preferência antiga de rotação e abre o mapa grande ao tocar, clicar ou usar Enter/Espaço quando estiver focado. A tecla N deixou de alternar a rotação.

## Farol e efeitos

Os circuitos do farol só aparecem na sala correspondente e ficam ocultos durante batalhas de treinador. Ao terminar, voltam com a mesma solução. No estádio, a camada de puzzles de outros andares fica oculta. Os raios que representam barreiras físicas continuam sinalizados dentro da sua própria sala.

Partículas de fogo, água, eletricidade e outros tipos, além das cabeças dos projéteis, passam a ser billboards em 3D com altura e profundidade. Antes eram achatadas na sobreposição do chão. O desenho reaproveita o atlas e os lotes do espelho, com limite de partículas no celular; anéis e marcas de terreno continuam no chão. Não foram alterados dano, recarga, aviso dos golpes, animações de lógica ou quantidade de inimigos.

Essa correção trata uma limitação estrutural da apresentação. Não representa uma recriação de todas as receitas de golpe ou equivalência artística comprovada ao vídeo de referência.

## Equilíbrio

Referência: versão publicada `72c6adb0`, arquivo `tools/resultados/geografia/equilibrio-depois.json`. Doze lutas, mesmos pares, níveis, sementes e entradas. Todas repetiram os resultados, incluindo cada comparação individual.

| Luta | PS perdidos/min antes → depois | Duração antes → depois | Golpes jogador/min antes → depois | Golpes adversário/min antes → depois |
|---|---:|---:|---:|---:|
| Selvagem | 2,89 → 2,89 | 17,28 → 17,28 s | 75,22 → 75,22 | 15,62 → 15,62 |
| Rival | 5,32 → 5,32 | 16,92 → 16,92 s | 79,80 → 79,80 | 25,42 → 25,42 |

Essas lutas não cobrem todas as espécies, cenários e combinações possíveis.

## Arquivos

- `src/world/nucleos.js`: composição dos núcleos e transformação inversa.
- `src/world/geografia.js`: coordenadas, áreas, raios de cenas e migração para layout 4.
- `src/world/paisagem.js`: recomposição do piso, vegetação e quatro recantos.
- `src/world/build.js`, `caminhos-ampliados.js`: terreno, cercas e acessos coerentes com os núcleos.
- `src/world/map.js`: identificação das áreas e índice espacial nas transições.
- `src/world/barreiras-dados.js`: guardas acompanham o referencial das barreiras.
- `src/save.js`, `src/world/life.js`: posição livre próxima e aliases de coleta antiga.
- `src/world/minimap.js`, `src/ui/ui.js`: norte fixo e abertura direta do mapa.
- `src/ui/menu.js`, `menu.css`, `mapa-detalhado.js`: mapa navegável com os objetos reais e recorte limitado.
- `src/world/viagem.js`: fonte detalhada de outros continentes e panorama menor.
- `src/story/enigmas.js`: visibilidade dos circuitos durante as lutas e por sala.
- `src/visual3d/espelho.js`, `sobreposicao.js`: partículas e projéteis em 3D, sem duplicá-los na camada plana.
- `tools/teste-geografia.mjs`, `tools/teste-3d/geografia.mjs`: migração antiga, coleta e estabilidade dos recantos.
- `tools/teste-3d/mapa-detalhado.mjs`: acesso pelo minimapa, norte, zoom, arraste e pinça reais de toque, névoa e fonte de outro continente.
- `tools/teste-3d/farol-camadas.mjs`: circuito antes/durante/depois da batalha e partículas nos lotes 3D.

Resultados em `tools/resultados/mapa-recomposto/`. Capturas 844×390 em `tools/shots/mapa-recomposto/`: cidades, recantos, mapa em detalhe e zoom, batalha no farol e três quadros de uma luta selvagem.

Safari e iPhone físico não foram testados. O ensaio de CPU 4× em Chrome é uma amostra curta, não uma garantia de desempenho sustentado no aparelho. A meta de 10–15 minutos de exploração entre cidades continua dependendo de validação humana; o teste de viagem mede apenas o trajeto direto.

## Verificação final

Os 12 testes Node solicitados passaram, incluindo jornada completa, progressão, guia, caminhada e auditorias de sólidos, saídas, falantes, obtenção e invisíveis. A última auditoria encontrou zero blocos sólidos sem representação visível e zero sobreposições sólidas.

No navegador: 44 regras de fluidez, 12 comparações de equilíbrio, 24 lutas contra paredes (20.018 quadros), migração real de save, persistência da coleta, retorno entre continentes, mapa com gestos de toque e restauração do circuito do farol. Nenhum erro de página nesses ensaios.

A amostra de combate em 844×390 com CPU 4× teve p95 de 16,4 ms, nenhum quadro acima de 50 ms e nenhum shader novo durante a medição. A amostra curta de exploração com dez selvagens teve p95 de 31,4 ms e cerca de 306 MB de heap. Esses são cenários diferentes; não representam uma medição de iPhone físico.
