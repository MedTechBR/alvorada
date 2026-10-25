# Arte original da amostra de aventura em Coral

Gerada em 25/10/2026 com `image_gen.imagegen`, ferramenta integrada, sem CLI/API externa. Nenhum sprite ou cenário foi extraído de Sea of Stars. A referência orientou proporções e composição; o resultado é uma primeira aproximação própria.

- `objetos.png` / `atlas.json`: oito objetos separados em um atlas RGBA de 640×448.
- `terrenos.png`: oito materiais em um atlas de 512×256.
- `treinador.png`, `marinheiro.png`, `pescador.png`: cada folha tem 200×208; quatro direções, quatro poses de caminhada e uma pose parada por direção.
- `treinador.json`: células 40×52, linha do pé em 49 e altura útil de referência de 48 px.
- `prompts.json`: os cinco prompts completos, incluindo a correção das passadas do treinador.

A preparação com `tools/preparar-amostra-coral.py` recorta os desenhos, remove a franja de alfa semitransparente, reduz por vizinho mais próximo e empacota os quadros. Não cria poses intermediárias nem desenha membros por código. A corrida ainda reutiliza as poses de caminhada no ritmo nativo.

Originais preservados fora do repositório, na pasta de imagens geradas desta conversa:

- Treinador inicial: `exec-affd6193-43bf-4b78-b21d-ae63f7be12ee.png`.
- Treinador com passadas corrigidas: `exec-d0034e06-86c1-40bd-94cb-ee9c04d0ce6f.png`.
- Objetos: `exec-21897f9a-d1b1-4c5a-a4bf-0e6750b8edac.png`.
- Materiais: `exec-b1ac4feb-503b-4fe3-95c3-03dde1087c8b.png`.
- Dois moradores: `exec-4170b2a4-4070-4964-824c-0ae60dab300a.png`.

Somente `?coral=aventura` usa este conjunto. As cores e roupas do save não são alteradas; o figurino do treinador é fixo nesta amostra.
