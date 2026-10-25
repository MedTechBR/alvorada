# Arte do piloto de Coral

Recursos novos gerados para Pokémon Alvorada com a ferramenta integrada de geração de imagens em 24/10/2026. Não são recortes de jogos comerciais. Os sprites dos Pokémon e do treinador continuam com os créditos já registrados no projeto.

- `objetos.png`: atlas RGBA 768×512 com oito peças separadas. Os recortes e a redução por vizinho mais próximo só preparam os sprites para uso no jogo; `atlas.json` registra os retângulos.
- `terrenos.png`: atlas RGB 512×256, quatro colunas por duas linhas. Areia, calçada, grama, água, madeira, rocha, flores e terra.
- Filtro de ampliação: nearest. Prédios e plantas têm ordem de desenho pelo pé. As peças são compartilhadas, não uma textura por objeto.

Ferramenta usada: `image_gen.imagegen`, modo integrado, sem CLI/API externa. O pedido dos objetos especificou pixel art costeira, telhas de barro, paredes claras, madeira azul-petróleo, luz consistente, portas centrais e fundo transparente; Centro, loja, casa, farol, palmeira, canteiro, fonte e poste separados. O pedido do terreno especificou oito materiais repetíveis vistos de cima, sem prédios ou personagens. A direção de arte dos pedidos e a integração estão no relatório `docs/coral-pixel-art.md`.

A imagem conceitual aprovada é uma referência artística; estes arquivos são os recursos efetivamente usados na cena jogável.
