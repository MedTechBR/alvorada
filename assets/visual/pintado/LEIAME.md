# Atlas da vila pintada

`vila.png`: 512×512 RGBA, compartilhado entre modelos, sombras e chão.
O arquivo ocupa aproximadamente 438 KiB; a imagem descomprimida com mipmaps ocupa cerca de 1,33 MiB, antes de custos do driver.

Criado com imagegen em 22/10/2026 a partir do conceito da vila aprovado pelo usuário. A imagem conceitual não é uma captura do motor. O jogo usa malhas com profundidade e colisão próprias; não usa a imagem conceitual como fundo.

Layout em coordenadas da imagem:

- Metade superior: árvore de folhas largas e conífera, recortadas com transparência.
- Terceiro quarto: telhas vermelhas, azuis, reboco e pedra.
- Último quarto: gramado, madeira, flores e folhagem.

O render amostra cada célula com margem de um texel. Árvores usam descarte por alfa também na sombra; malhas antigas não recebem UV nem textura. O atlas fica vivo por toda a sessão e não é duplicado por setor. As geometrias mescladas e máscaras locais seguem o descarte dos setores.

Prompt usado (resumo fiel): atlas quadrado sem rótulos, duas árvores ortográficas completas sobre transparência na metade superior; oito materiais pintados, sem perspectiva, em grade 4×2 na metade inferior; luz superior esquerda, folhas agrupadas e silhueta irregular; paleta e materiais da vila aprovada, sem desenhar uma cena ou interface.
