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

`tools/teste-3d/visual-restante.mjs` verifica cidades com climas distintos, uma casa, Centro, ginásio, gruta, mata e ruína, em 844×390 com DPR 2. Confere apresentação ativa, nome correto, botões dentro da tela, caches limitados e liberação dos lotes Three. Fotos em `tools/shots/visual-restante/`.

`tools/teste-3d/exploracao-rotas.mjs` percorre entrada e saída reais dos três desvios, interage com baús e alavanca e confere coleta única. Os registros ficam em `tools/resultados/cidades-compactas/`.

iPhone físico/Safari e uma revisão manual completa de cada ambiente continuam pendentes. As mudanças permanecem locais no branch `cidades-compactas`.
