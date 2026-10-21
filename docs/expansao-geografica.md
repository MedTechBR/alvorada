# Espaço de exploração e tamanho da jornada

## Estado desta etapa

A primeira etapa acrescenta habitantes tranquilos. Ela **não aumenta a distância física entre as cidades**, nem redistribui os ginásios. A ampliação geográfica solicitada depois continua pendente da definição de duração da viagem (opções apresentadas: 5–10, 10–15 ou 15–25 minutos com exploração).

O retângulo externo de Alvorada tem 1200×960 blocos, mas os primeiros destinos estão concentrados no núcleo de 600×480. O tamanho do arquivo não demonstra uma jornada longa: é preciso medir o percurso entre os destinos da campanha.

## Implementado localmente

`src/world/populacao.js`, `src/main.js`, `src/combat/ai.js`: quatro encontros normais e até seis Pokémon tranquilos, mais próximos da tela e com as espécies/níveis da área. Os extras passeiam, podem ser capturados e reagem a ataques diretos; ruído e proximidade não iniciam sua agressão. No máximo quatro selvagens pressionam o jogador. Não há reposição de população durante a luta; moradores tranquilos não impedem o retorno automático após a vitória.

A tentativa de apenas retirar obstáculos da camada de cenário foi descartada: não aumentava a distância entre cidades e alterava a exposição em combates. Nenhuma mudança de terreno dessa tentativa ficou aplicada.

## Ampliação geográfica a executar

1. Medir os percursos reais entre cada par de cidades da campanha, a pé e montado, incluindo atalhos já liberados.
2. Redistribuir cidades e alongar as ligações que hoje permitem passar de um ginásio para outro em poucos minutos. O objetivo é distância nova de exploração, com terrenos diferentes e áreas opcionais conectadas.
3. Construir campos, florestas e margens largas entre esses destinos, com caminhos alternativos que retornem à rota e populações apropriadas ao bioma. A passagem principal deve ser legível.
4. Migrar posições de jogos salvos e atualizar portas, pontos da história, barreiras, NPCs, minimapa, navegação e encontros conforme a nova geografia.
5. Verificar o trajeto completo e medir o tempo de viagem. Não usar redução artificial de velocidade, batalhas obrigatórias repetidas ou aumento de agressividade para preencher duração.

## Evidências

`tools/resultados/mapa/` guarda os testes do povoamento e equilíbrio. Capturas móveis em `tools/shots/exploracao-aberta/`.

A densidade foi testada em Chrome com toque e viewport 844×390. Safari/iPhone físico ainda não foram testados.

- Seis habitantes tranquilos: nenhuma agressão espontânea; ao provocar todos, só quatro entram em combate; sem reposição durante a luta.
- Dez selvagens carregados em 844×390, CPU 4×: p95 de 13,3 ms no ensaio de quatro segundos; nenhum erro de página. É uma amostra de Chrome, não uma garantia de desempenho em iPhone.
- As 12 lutas automáticas mantiveram exatamente os resultados da versão publicada: selvagens 10,83 PS/min e 17,55 s; rival 14,52 PS/min e 17,22 s. Esses cenários não medem todas as combinações do jogo.
