# Apresentação compartilhada no restante do jogo

O acabamento de Coral passa a ser a apresentação padrão de cidades, rotas e interiores, nos dois continentes. A implementação reutiliza o compositor Pixi existente; não cria outro mapa nem muda colisões, portas, campanha, encontros ou equilíbrio.

## O que foi aplicado

- Câmera fixa com a escala e o enquadramento do piloto; posições arredondadas para os pixels.
- Nome do lugar atual no canto, minimapa ao norte e menu compacto. A placa transitória duplicada do nome da área sai da apresentação nova.
- Botões agrupados, com equipe e montaria preservadas. Informações de combate aparecem durante a luta.
- Centro, loja, casas, iluminação e peças compatíveis usam o atlas compartilhado; construções regionais específicas mantêm seus desenhos próprios.
- Humanos continuam nas folhas FRLG/HGSS e na seleção por identidade já revisada. Não foram reintroduzidos os personagens alongados da amostra.
- Água e materiais básicos usam o atlas aprovado. Trilhas fora de Coral, neve, gelo, lava, cavernas, ruínas e pisos internos mantêm os materiais nativos: não são convertidos em praia. As animações e a decoração dos biomas permanecem visíveis.

## Limites

A linguagem de câmera, interface e apresentação agora é compartilhada. Isso não significa que todas as peças do jogo receberam arte nova: ginásios, construções especiais, objetos pequenos e materiais regionais ainda usam parte do acervo anterior. O redesenho autoral de cada cidade e de cada rota também precisa de trabalho próprio; aplicar o compositor não substitui essa composição.

## Recursos

Os mesmos dois atlas são carregados uma vez. Só os setores próximos têm canvas de 256², destruídos ao sair do enquadramento. Folhas humanas sem uso saem do cache. Lotes e texturas próprios do espelho 3D são liberados quando a apresentação Pixi entra.

`?coral=3d` mantém o renderer anterior para diagnóstico. `?coral=local` limita o compositor ao piloto para verificar a alternância e o descarte dos dois renderers. Não há um novo seletor de câmera na interface do jogador.

## Verificação

`tools/teste-3d/visual-restante.mjs` verifica cidades com climas distintos, uma casa, Centro, ginásio, gruta, mata e ruína, em 844×390 com DPR 2. Confere apresentação ativa, nome correto, botões dentro da tela, caches limitados e liberação dos lotes Three. Também troca para o Ocaso e confere o enquadramento após a viagem. Fotos e galeria em `tools/shots/visual-restante/`.

`tools/teste-3d/exploracao-rotas.mjs` percorre entrada e saída reais dos três desvios, interage com baús e alavanca e confere coleta única. Os registros ficam em `tools/resultados/cidades-compactas/`.

iPhone físico/Safari e uma revisão manual completa de cada ambiente continuam pendentes. A revisão `5f63bcaa` foi publicada em 26/10/2026 com autorização do dono, a partir do branch `cidades-compactas`, atualizando `main`. As pendências de desempenho e de validação em iPhone/Safari permanecem abertas.

## Medição nas regiões

Chrome em 844×390, DPR 2, CPU 4× mais lenta, qualidade alta. Antes: versão publicada `fcde2264`; depois: revisão local. Percurso de ida e volta com as mesmas condições de cada medidor, sem encontros aleatórios. P95 significa o valor abaixo do qual ficam 95% das amostras.

| Trecho | CPU P95 antes → depois (ms) | Quadro P95 antes → depois (ms) | Heap após GC antes → depois (MiB) | Geometrias / texturas Three antes → depois |
|---|---:|---:|---:|---:|
| Campina | 19,4 → 10,1 | 28,6 → 10,8 | 289,7 → 192,9 | 110 / 77 → 16 / 16 |
| Sussurro | 15,4 → 11,4 | 22,6 → 15,4 | 297,5 → 195,1 | 103 / 80 → 16 / 16 |
| Rota | 16,0 → 9,2 | 21,6 → 12,4 | 296,5 → 221,3 | 99 / 85 → 16 / 16 |

Os atlas, setores e humanos Pixi foram estimados separadamente em 6,0 / 5,1 / 5,8 MiB depois; `renderer.info` só conta recursos Three. O pico de heap também caiu nos três trechos (306,6 / 310,6 / 308,5 → 205,3 / 201,9 / 229,6 MiB). Estas medidas não representam a memória total do navegador ou da GPU. Dados brutos em `tools/resultados/cidades-compactas/visual-restante-desempenho.json`.

A auditoria final avaliou 181 NPCs sem bloqueio de passagem. O teste de paredes percorreu 24 lutas e 19.743 quadros sem atravessar paredes; a gravação de batalha selvagem não registrou erros de página. Isso verifica regressões técnicas, não substitui a revisão manual do acabamento de cada cidade.

Em Coral, a caminhada melhorou, mas os pontos parados de praça e farol regrediram na CPU (5,2 → 6,2 ms e 5,3 → 7,0 ms P95). O requisito estrito de nenhum trecho piorar ainda não passou; dados e tabela em [Cidades compactas](cidades-compactas.md).
