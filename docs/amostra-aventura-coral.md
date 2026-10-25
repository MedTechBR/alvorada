# Amostra de aventura em Coral

Branch `amostra-aventura-coral`, 25/10/2026. Amostra local optativa, sem publicação. A versão publicada permanece no commit `5d611684`.

## Escopo

A direção aprovada foi o acabamento de Sea of Stars. Esta primeira amostra produz arte original e a integra ao trecho da praça e do farol de Coral. Não é uma reprodução do jogo de referência, nem uma ilustração usada como fundo.

- Treinador próprio, com corpo mais alongado, boné, colete, mochila e botas. Quatro direções, quatro passadas distintas e uma pose parada por direção.
- Marinheiro do farol e pescador da praça com folhas próprias no mesmo conjunto. Os demais moradores ainda conservam a arte anterior.
- Oito peças de cenário separadas: Centro, loja, casa, farol, palmeira, canteiro, fonte e poste. A câmera, a planta e as portas reais são preservadas.
- Novos materiais de chão, com pedras maiores e áreas de areia/grama. A composição final e as bordas naturais do bairro ainda não foram reformuladas nesta amostra.
- A opção `?coral=aventura` seleciona os recursos. Sem ela, o jogo continua usando o visual publicado. O figurino da amostra é fixo e não altera o look salvo.
- Não houve mudança de dano, recarga, IA, Pokémon, progressão, diálogos, mapas ou puzzles.

Abrir a [galeria com comparação e folhas animadas](../tools/shots/coral-aventura/index.html) ou jogar em `http://127.0.0.1:8700/?teste&nosw&coral=aventura&ir=1720,1968`.

## Recursos e descarte

Objetos: 640×448 RGBA. Terrenos: 512×256. Cada humano: 200×208, com células 40×52. As três folhas usam 20 quadros cada, compartilhando uma fonte de textura por personagem. Retirar o quadro repetido e empacotar com menos área transparente reduziu o orçamento estimado desse conjunto de 2,141 para 2,070 MiB de pixels RGBA, comparado aos dois atlas e às três folhas anteriores. Isso não mede memória total de GPU.

O chão mantém os setores de 256²; fontes, ImageBitmaps e quadros são liberados ao sair do piloto. O teste confirma entrada real no Centro e descarte completo depois de quatro segundos fora da área, tanto na apresentação publicada quanto na amostra.

## Desempenho observado

Chrome sem interface, um processo por vez, áudio mudo, viewport 844×390, DPR 2, CPU 4× mais lenta, qualidade alta, 15h, mesma posição por comparação. Dois pontos estáticos, amostra de 2,2 s depois do aquecimento; heap retido após GC. São amostras locais curtas, não significância estatística nem validação de Safari.

| Ponto | Quadro p95 ms | CPU p95 ms | Pico heap MiB | Heap após GC MiB | Texturas Pixi estimadas MiB |
| --- | --- | --- | --- | --- | --- |
| praca | 16.7 → 16.7 | 9.9 → 10.7 | 286.90 → 287.47 | 281.62 → 282.17 | 6.031 → 5.960 |
| farol | 16.8 → 16.7 | 9.0 → 10.2 | 286.46 → 287.21 | 281.83 → 282.36 | 6.078 → 6.007 |

As duas apresentações tinham 59 geometrias e 49 texturas Three no momento da leitura. Os contadores Three não incluem as texturas Pixi da última coluna.

**O critério de CPU e heap sem aumento não passou nesta amostra.** A cadência ficou próxima de 60 Hz e o orçamento de pixels diminuiu, mas CPU e heap medidos subiram. A versão fica optativa para avaliação visual; falta otimizar e repetir uma medição mais longa, incluindo caminhada. Não está pronta para virar padrão ou ser expandida. A primeira medição intermediária, com apenas o treinador novo, não representa a versão final com os dois moradores e não é usada nesta tabela.

## Validação

- `tools/verificar-amostra-coral.py`: folhas em quatro direções, quatro passadas diferentes e pose parada, margens, pés, recortes e orçamento de pixels. Passou.
- `tools/teste-3d/coral-aventura.mjs`: apresentação anterior e amostra, erro de alinhamento dos pés <0,001, restauração das texturas nativas, fonte compartilhada, quatro movimentos reais, entrada pela porta, descarte e ausência de erros de execução. Passou.
- Encontros selvagens e de treinador: entrada na arena, fuga com retorno à posição, sequência de dois Pokémon, vitória, captura e recuperação após derrota. Passaram, sem erros. Foi reutilizado `coral-encontro.mjs`, com o parâmetro `coral=aventura` e saídas direcionadas à pasta da amostra.
- Bateria Node: 18/18 comandos passaram, incluindo jornada, progressão, guia e caminhada, sólidos, saídas, falantes, obtenção, invisíveis (0 achados), geografia, Coral, pintura, personagens e `vestir --verificar`. Resultados e logs em `tools/resultados/coral-aventura/`.
- A comparação dos humanos na galeria usa exatamente os PNGs e quadros consumidos no jogo. A captura da praça e a do farol vêm do jogo em viewport 844×390, com cópias reduzidas do buffer DPR 2.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `assets/coral-aventura/` | Arte original, recortes, metadados e prompts completos |
| `src/visual2d/coral-aventura.js` | Carrega uma folha da amostra, compartilhando a fonte entre os quadros |
| `src/visual2d/coral-pessoas.js` | Seleciona os três humanos somente na opção de amostra; mantém pés e quadros nativos fora dela |
| `src/visual2d/coral.js` | Seleciona o atlas alternativo pelo parâmetro de teste |
| `src/story/npc.js` | Posiciona a exclamação acima da altura visual do morador |
| `tools/preparar-amostra-coral.py` | Preparação reproduzível dos recortes e folhas |
| `tools/verificar-amostra-coral.py` | Validação das folhas e do orçamento de texturas |
| `tools/teste-3d/coral-aventura.mjs` | Comparação, capturas, navegação, descarte e desempenho |
| `tools/shots/coral-aventura/` | Galeria, capturas reais e prévia animada |

## Procedência

Ferramenta integrada `image_gen.imagegen`, sem CLI/API externa. [Prompts completos](../assets/coral-aventura/prompts.json) e [preparação/procedência](../assets/coral-aventura/LEIA-ME.md). As peças geradas são próprias do Alvorada; não foram extraídas das capturas de Sea of Stars. Os Pokémon e pequenos objetos que não foram substituídos continuam com os créditos existentes.

## Limites

- Esta é uma primeira aproximação da direção aprovada. Silhuetas, detalhamento e materiais ainda precisam da avaliação do dono.
- A corrida reutiliza a caminhada no ritmo nativo; não há ciclo exclusivo de corrida, nova folha de arremesso, montaria sentada ou criador de personagem nessa arte. A montaria conserva a pose anterior.
- Demais moradores, interiores e outras cidades não receberam esse conjunto. A mudança de estilos é visível fora do trecho mostrado.
- Água, transições de terreno e organização final dos jardins ainda precisam de refinamento.
- Falta teste prolongado no iPhone/Safari e a meta de CPU/heap sem aumento permanece aberta.
- Não houve push, publicação ou alteração do arquivo preexistente `tools/teste-3d/inicial-tmp.mjs`.
