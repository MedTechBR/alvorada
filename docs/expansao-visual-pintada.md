# Expansão do visual pintado

Continuação do piloto aprovado de Vila Alvorada e Rota 1, a partir de `77a4f217`. Trabalho local no branch `visual-referencia`, sem publicação.

## Alcance

O acabamento passa a valer em todo o mapa 3D: cidades, rotas, matas, litoral, regiões áridas, regiões frias, interiores e ginásios. Ocaso usa o mesmo perfil de materiais, inclusive nas grutas. Não foram acrescentados prédios onde os dados do mapa não possuem objetos.

O atlas continua único, com 512×512 pixels. As árvores isoladas mantêm as silhuetas pintadas aprovadas; paredões de mata e árvores encostadas em chão de mata conservam copas opacas em volume, com textura e LOD. Isso evita apresentar células bloqueadas como grama livre. Os 251 modelos genéricos mantêm exatamente posições de vértices e índices: recebem acabamento de madeira, pedra, folhagem, parede ou telhado conforme a superfície existente. Vidros, sinais luminosos, objetos pequenos e superfícies funcionais mantêm suas cores.

A iluminação e o enquadramento estável do piloto foram estendidos. A câmera continua fixa. O chão urbano recebe cantaria; madeira dos interiores reutiliza o atlas. Azulejos, cartazes e papéis de parede mantêm suas artes próprias. Postes repetidos em trechos curtos de calçada foram retirados com as colisões correspondentes, sem remover objetos identificados, portas ou peças de história.

Esta rodada aplica o padrão visual ao conteúdo existente. Não redesenha todas as cidades manualmente, não repovoa áreas vazias e não transforma cada objeto em uma ilustração nova. Água e efeitos de combate conservam seus sistemas existentes. Roteiro, diálogos, Pokémon, dano, IA, puzzles e progressão não foram modificados.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `src/visual3d/letsgo/acabamentos.js` | Classificação dos materiais sobre os volumes existentes |
| `src/visual3d/letsgo/modelos-todos.js` | Registro global do perfil pintado |
| `src/visual3d/letsgo/arvores-lod.js` | Leitura das cores normalizadas nas copas distantes |
| `src/visual3d/letsgo/modelos.js` | Cache separado para mata, acabamento por peça, normais e UV compactados |
| `src/visual3d/kit/construtor.js` | Mescla dos atributos compactados sem aumentar bytes por vértice |
| `src/visual3d/kit/modelos-setor.js` | Perfil global e LOD para copas opacas de mata |
| `src/visual3d/letsgo/pintura.js` | Atlas compartilhado, variantes neutras e amostragem simples de madeira |
| `src/visual3d/letsgo/chao.js` | Acabamento global do chão e pavimento urbano |
| `src/visual3d/letsgo/luz.js` | Tratamento global preservando clima, noite e interiores |
| `src/visual3d/camera.js` | Enquadramento estável fora de batalha/montaria |
| `src/visual3d/salas.js` | Madeira pintada nos pisos de interiores |
| `src/visual3d/setores.js` | Cache de 12 setores no celular, preservando todos os setores necessários à câmera |
| `src/world/organizar-postes.js`, `build.js` | Remoção de postes redundantes e das colisões sem outro dono |
| `tools/teste-pintura.mjs`, `teste-postes.mjs` | Volumes, precisão, orçamento de atributos, mata, estados e colisões compartilhadas |
| `tools/auditar-invisiveis.mjs` | Auditoria do perfil global; planos transparentes não contam como cobertura opaca |
| `tools/teste-3d/pintura-{expansao,mundos,piloto}.mjs` | Capturas equivalentes, cobertura real, shaders, troca de mundo e descarte |
| `tools/teste-3d/referencia-desempenho.mjs` | Porta parametrizável para comparar a base isolada com a versão atual |

## Desempenho e memória

Medição no Chrome sem interface, um processo por vez, com áudio desligado: viewport 844×390, DPR do dispositivo 2, CPU 4× mais lenta. O limite interno de DPR do jogo continua em 1,5. Na comparação com cadência da tela (60 Hz), ambos os lados renderizam cerca de 360 quadros por trecho de seis segundos, em vez de gerar quantidades diferentes de lixo a FPS ilimitado. Mesmo horário, qualidade e percurso, três voltas alternadas por cenário; p95 de tempo por quadro e CPU usam a mediana, pico de heap e recursos usam o máximo, heap após GC usa a mediana. A comparação sem limite de FPS permanece registrada como teste de estresse; ela apresentou picos transitórios maiores, embora o heap retido tenha caído, e não é apresentada como aprovada.

Os atributos extras não aumentam o orçamento por vértice: normal Int16 normalizada (6 bytes) + UV/célula Uint16 (6 bytes) substituem a normal Float32 anterior (12 bytes). A compactação escreve diretamente nas matrizes finais, sem criar listas intermediárias, e a mescla copia normais já compactadas em bloco. Cores dentro de 0..1 usam Uint16 normalizado, com erro menor que 1/65535; tons acima de 1 continuam em float e não são cortados. O atlas é compartilhado e o descarte preserva esse recurso; geometrias próprias dos setores continuam sendo liberadas.

| Local | Quadro p95 (ms) | CPU p95 (ms) | Heap após GC (MiB) | Pico heap (MiB) | Geometrias | Texturas |
| --- | --- | --- | --- | --- | --- | --- |
| cidade | 16.8 → 16.7 | 7.4 → 7.0 | 343.47 → 342.47 | 355.571 → 354.109 | 117 → 97 | 91 → 75 |
| rota | 16.8 → 16.8 | 7.2 → 6.9 | 345.62 → 344.67 | 356.507 → 356.554 | 117 → 98 | 91 → 76 |

Valores antes → depois, sem arredondar os dados usados pelo comparador. Base `77a4f217`; versão medida `8a0cd66c`.

**Aceitação estrita de desempenho ainda pendente:** quadro, CPU, heap retido e recursos caíram ou se mantiveram. O pico transitório da rota aumentou **0,047261 MiB**, e `referencia-comparar.mjs` reprovou esse indicador. A diferença é pequena, mas esta entrega não afirma que toda a exigência de memória foi demonstrada. O log de reprovação e os valores completos foram preservados. Não houve publicação.

## Verificações

- Dados, jornada, jornada completa, progressão, alvos, guia, caminhada do guia, sólidos, saídas, falantes, obtenção, geografia e `vestir --verificar`: aprovados. Códigos em `node.json` e logs individuais.
- Invisíveis: **0 em Alvorada e 0 em Ocaso**, após conservar copas opacas nas bordas de mata. O teste mantém seus limiares e não considera o retângulo transparente das árvores como cobertura.
- Passagens: **179 NPCs**, nenhuma passagem fechada.
- Modelos: **251 tipos genéricos** com posições e índices preservados; cache, estados de frutas, UV, precisão de normais e cores, mesclas com tons fortes e mata conferidos.
- Render: atlas compartilhado **512×512**, **7 malhas com sombra recortada**, **6 de 6 geometrias próprias liberadas**, **1 compartilhada preservada**. Associação de sprites e modo 2D aprovados.
- Exploração real: aceleração/parada, colisão, câmera estável e porta aprovadas; transição **0,325 s de jogo / 0,520 s reais**; **27 de 27 geometrias liberadas**, incluindo janela.
- Cobertura de salas, noite e Ocaso: perfil pintado e shaders conferidos no Chrome. Arenas grandes sem objetos são validadas pelo chão e não recebem objetos artificiais para satisfazer o teste.

Para repetir a comparação a partir da base aprovada: iniciar `python3 tools/serve.py 8700` e executar `python3 tools/teste-3d/pintura-comparar.py`. A base fica numa pasta temporária servida em 8701; a árvore de trabalho não é substituída. Os dois navegadores são executados em sequência. O servidor auxiliar é encerrado no `finally`.

## Evidências e limites

Resultados e logs em `tools/resultados/expansao-pintada/`; percursos em `tools/resultados/referencia/expansao-60-*.json`, com o teste de estresse em `expansao-par-*.json`. Fotos antes/depois em `tools/shots/expansao-pintada/`, com os mesmos pontos e resolução de apresentação 844×390.

As capturas adicionais possuem uma amostra estacionária por local, preservada nos JSONs `antes/depois`. Elas servem como diagnóstico, não como certificação de desempenho de todos os biomas: algumas têm p95 maior e precisam de percursos repetidos próprios numa próxima rodada. Os dois percursos repetidos de cidade e rota da tabela são a medição principal; mesmo neles a aprovação estrita permanece pendente pelo pico transitório da rota.

Não foi testado em iPhone físico/Safari. Heap do Chrome e contagem de geometrias/texturas não medem toda a memória de GPU nem demonstram que o fechamento no aparelho foi eliminado. A equivalência com a referência permanece parcial: preservamos modelos e estrutura do jogo, em vez de refazer toda a direção de arte ou os mapas nesta etapa.

Galeria navegável: [comparações antes/depois](../tools/shots/expansao-pintada/index.html). Todas as fotos individuais foram normalizadas para 844×390; a prancha `comparacao.jpg` reúne as oito duplas.
