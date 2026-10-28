# Revisão global de cenário e arenas

## Escopo desta versão

As correções estão nos componentes comuns do jogo, não numa cópia especial de Jandaia. Valem para as regiões montadas na abertura e para as carregadas durante a exploração, incluindo interiores que reutilizam o catálogo. A galeria em `tools/shots/arena-pp/` contém 25 pontos fotografados antes e depois, em 844 × 390.

- `tools/firered/preparar.py`, `assets/firered/objetos.png` e `indice.json`: árvores com copa e tronco inteiros; vasos sem piso incorporado; pedras em escala original; balcões completos; cama e computador com as peças correspondentes. O índice identifica a versão da imagem pelo conteúdo.
- `src/visual2d/firered/objetos.js`: desenha objetos completos, conserva as identidades de palmeiras, postes, mecanismos e móveis sem equivalente no atlas. Evita esticar ou repetir colunas de uma copa ou de um balcão.
- `src/visual2d/firered/pisos.js` e `terreno.js`: bordas de areia, paredes sem degraus falsos e desenho de escadaria correspondente ao terreno atravessável. A floresta não desenha uma segunda copa cortada debaixo das árvores por setor.
- `src/world/entradas-escada.js` e `map.js`: entrada ampliada responde em toda a largura real da escada, com os mesmos destinos e requisitos. Objetos substituídos também saem do setor correto e têm o sprite descartado.
- `src/world/ligacoes-piso.js`: aproxima a trilha existente do patamar da entrada, sem atravessar rios, paredes ou objetos.
- `src/world/composicao-natural.js` e `build.js`: reúne decoração dispersa em bosquetes menores, preserva clareiras e protege caminhos, moradores e entradas. Não move objetos de história, frutas, mecanismos ou prédios. O número de enfeites não aumenta. As coordenadas continuam corretas após a instalação do setor.
- `src/combat/pp.js` e `combat.js`: reserva de 100 PP por Pokémon, custos conforme a força do golpe, regeneração gradual e preservação da reserva ao trocar ou recolher. O primeiro golpe do jogador vira um ataque básico gratuito quando falta PP. O adversário espera recuperar energia, sem receber ataques extras. Avisos, recarga compartilhada e esquiva são preservados.
- `src/ui/hud-batalha.js`, `hud.js`, `src/game/pilot.js` e `interface.css`: PS, PP, retratos e equipe no topo durante a luta; custo visível nos golpes e indicação dos indisponíveis.
- `src/visual2d/firered/arena-volume.js` e `index.js`: projeção fixa inclinada, personagens em pé e bordas com volume. Usa o mesmo renderizador Pixi e descarta os elementos ao sair. A mira de contato considera a projeção.
- `sw.js`: nova versão do código em cache, mantendo os sprites compartilhados.

## Verificação

Os registros desta publicação ficam em `tools/resultados/arena-pp/testes-publicacao/`. Incluem os testes de jornada, progressão, guia, geografia, dados, sólidos, saídas, falantes, obtenção, invisíveis, FireRed, PP, entradas, composição e `vestir --verificar`; também os testes reais de golpes, escadas, movimento em batalha, paredes e passagem de NPCs. Consultar os códigos de saída nos JSON, e não apenas a existência do arquivo de log.

O teste de contato usa Talho e Presa de Fogo no motor real. A entrada do Templo das Raízes é percorrida pelas seis colunas. As três escadarias de controle são atravessadas nos dois sentidos. `tools/teste-composicao-cenario.mjs` também cobre a montagem posterior das regiões, objetos protegidos e ligação de piso sem remover paredes.

## Continuação após esta publicação

A composição comum é uma base; ainda falta a revisão manual de enquadramento e organização de cada trecho. As 25 capturas não equivalem a uma inspeção visual de todos os setores e interiores do jogo. A arena ganhou profundidade visual nas bordas, sem novos obstáculos centrais nesta versão.

A rodada final de comparação de equilíbrio e a medição controlada de CPU/memória continuam registradas separadamente em `tools/resultados/arena-pp/`. Não considerar uma medição antiga como aprovação da versão atual. O iPhone físico e o Safari ainda precisam de teste; Chrome com CPU reduzida não substitui essa validação.

## Origem dos gráficos

Peças gráficas de FireRed do repositório público [pret/pokefirered](https://github.com/pret/pokefirered/tree/ce6406d8c2eaf46d543c8a2606de0c3cb1951982), em revisão fixada. A composição da cama foi conferida contra as peças do quarto original; nenhum mapa de Kanto foi transplantado para o jogo. O sistema de PP desta versão é uma implementação do Alvorada inspirada na referência; a fórmula exata do Pokémon Battle Advanced não foi confirmada.
