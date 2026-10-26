# Exploração entre cidades

## Referências consultadas

A viagem deve ter conteúdo e escolhas, além de uma distância adequada. Abaixo, fatos das fontes oficiais separados da proposta de desenho para o Alvorada.

| Referência | O que foi observado/confirmado | Aplicação ao Alvorada |
|---|---|---|
| [Sea of Stars — travessia](https://seaofstarsgame.co/) | A apresentação oficial descreve nado, escalada, salto e desníveis. Nas imagens oficiais Traversal-5 e Traversal-10, um tronco sobre água e uma ponte entre paredões fazem o trajeto participar do cenário. | Cada trecho precisa de uma ação ou de um marco próprio. A mata deve ser uma travessia reconhecível, com margens e pontes; não apenas chão verde pontilhado de árvores. |
| [Pokémon Sword/Shield — Wild Area](https://www.pokemon.co.jp/ex/sword_shield/system/190605_03.html) | Área natural conectada a várias cidades, com encontros diferentes conforme lugar e clima. | Explorar um ambiente diferente deve trazer descobertas. Preservar os encontros regionais existentes; não aumentar quantidade de inimigos ou agressividade para preencher terreno. |
| [Octopath Traveler II — sistemas](https://www.jp.square-enix.com/octopathtraveler2/system/) | Canoa, navio e guildas espalhadas em cidades e arredores dão motivos concretos para procurar outros lugares. | Um desvio precisa levar a algo que o jogador possa usar ou descobrir, com retorno claro. |

Imagens examinadas: [ponte e paredões](https://seaofstarsgame.co/wp-content/uploads/2023/08/Traversal-10-640x360.png), [tronco sobre água](https://seaofstarsgame.co/wp-content/uploads/2023/08/Traversal-5-640x360.png). Não foi feita análise quadro a quadro de vídeos nesta rodada.

## Direção de desenho

Esta é a interpretação de projeto a partir das referências, não uma descrição literal dos mapas desses jogos:

**Cidade → saída legível → trecho com identidade → escolha de desvio → ponto marcante → chegada à próxima cidade.**

O caminho principal deve continuar claro para quem quer avançar. A exploração opcional pode alongar a viagem com decisões e descobertas, sem obrigar o jogador a atravessar terreno vazio ou fazer batalhas adicionais. Distância em blocos não mede a qualidade nem a duração da exploração.

## Primeiro conjunto jogável

Três recantos existentes passam a ter destinos próprios, usando os sistemas de salas, colisões, baús e alavancas já presentes:

- **Campos de Lúmen: Gruta de Lúmen.** Circuito em duas alas, lago central, cristais como marcos e um baú com duas Poções.
- **Bosque Sussurrante: Clareira das Raízes.** Riacho com duas pontes, árvore no alto, pomar na volta e um baú com três Poké Bolas.
- **Caminho do Espelho: Ruína do Pomar.** Alavanca alcançável pela ala esquerda abre a alcova do baú com uma Superpoção. A saída funciona antes e depois do mecanismo.

Os acessos recebem boca visível, placa e trilha curta até uma estrada já existente. A busca da trilha só usa piso atravessável; não corta floresta sólida, rio, cerca ou barreira. Cada interior retorna ao seu próprio recanto e não conecta duas regiões da campanha. Os IDs dos baús e da alavanca são estáveis; a coleta é única e persiste em `flags.dg`.

Esses destinos são um primeiro conjunto funcional. Não equivalem a uma reformulação de todas as rotas. Ainda faltam composições próprias para as demais viagens, integração mais forte dos marcos ao caminho principal, atividades regionais e revisão visual dos ambientes de exploração. Não houve alteração de dano, níveis, encontros ou roteiro.

## Arquivos

- `src/world/exploracao-rotas.js`: plantas distintas, objetos, mecanismos e recompensas.
- `src/world/mundos.js`: acrescenta as salas após as existentes para preservar a alocação anterior.
- `src/world/paisagem.js`: acessos, sinalização e trilhas de ligação, geradas uma vez na montagem.
- `tools/teste-exploracao-rotas.mjs`: alcance real com progressão, saída livre, recompensa alcançável e alcova fechada antes do mecanismo.
- `tools/teste-3d/exploracao-rotas.mjs`: entrada e saída reais no navegador, interação com alavanca e baú, coleta única e capturas.

Os resultados da validação estão em `tools/resultados/cidades-compactas/`. As capturas ficam em `tools/shots/exploracao-rotas/`. Publicação e validação em iPhone físico não realizadas.
