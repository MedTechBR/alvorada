# Personagens originais e identidade visual

25/10/2026, branch `amostra-aventura-coral`. Correção local, sem publicação.

O treinador, o marinheiro e o pescador alongados foram retirados da apresentação jogável. Tanto `coral=pixel` quanto `coral=aventura` agora usam os sprites originais FRLG/HGSS, com alturas de apresentação de 36 para adultos e 30 para crianças, mantendo o ajuste já existente da escala do corpo. O cenário da amostra não foi alterado. Os PNGs gerados permanecem apenas como histórico; o carregador de pessoas não os importa nem os baixa.

## Causa e correção

O seletor 3D ignorava looks em formato de objeto, mesmo com `preset`, e sorteava qualquer morador do acervo. Também misturava sexo e idade nos looks genéricos. O seletor de Coral consultava esse resultado antes da predefinição. Além disso, o cache só considerava o texto do look, sem os campos dos objetos.

- Um único seletor agora atende Coral e o 3D, respeitando a predefinição e as folhas escolhidas explicitamente.
- Cabelo grisalho definido nos dados e identidades conhecidas usam idosos; papéis recorrentes e cópias de cena mantêm sua identidade.
- Seu Zé, Vovô Bento, Vô Lino, Seu Quinzinho, Seu Abel e Seu Orlando usam homens idosos.
- Vó Benta, Iracema, Dona Zélia, Dona Pedrina e Anciã Iara usam uma senhora idosa do acervo existente, conferida visualmente (`npc_076`).
- Bia usa uma cientista, e as mineiras Ana e Rosa deixam de herdar um homem do preset montanhista. Crianças continuam em folhas infantis.
- O cache considera todos os campos do look, o id e o nome. Nenhuma seleção mistura perfis por sorteio.

Não houve mudança de roteiro, falas, posições, colisões, dificuldade ou dados de Pokémon.

## Arquivos

| Arquivo | Mudança |
| --- | --- |
| `src/sprites/pessoas.js` | Seleção compartilhada por identidade e predefinição |
| `src/sprites/pessoas-coral.js` | Delega à mesma regra usada pelo 3D |
| `src/visual3d/personagens.js` | Remove sorteio entre perfis e corrige a chave do cache |
| `src/visual2d/coral-pessoas.js` | Retira os três humanos gerados e usa somente o acervo original |
| `src/visual2d/coral.js` | Não solicita pessoas da amostra |
| `tools/teste-identidade-personagens.mjs` | Regressões de idade, sexo, objeto, cópias e catálogo completo |
| `tools/teste-3d/identidade-personagens.mjs` | Identidade no renderizador real, proporções e Seu Zé fora de Coral |
| `tools/teste-3d/coral-aventura.mjs` | Espera os sprites originais nos dois modos |
| `tools/shots/coral-personagens/` | Capturas reais em 844×390 |
| `tools/shots/coral-aventura/index.html` | Revisão atualizada com os personagens originais |

## Validação

- 464 definições de humanos dos mapas e elenco ativo: folhas existentes e mesma identidade em Coral/3D. Passou.
- Regressões de idosos, crianças, mulheres, homens, objetos, cópias e 200 identificadores genéricos. Passaram.
- Teste de personagens de Coral, planta de Coral e isolamento da apresentação pixel. Passaram.
- Navegador 844×390, DPR 2: dois modos, caminhada nas quatro direções, pés alinhados, restauração de textura, entrada no Centro e descarte das fontes e setores. Passou, sem erros de execução.
- Renderizador real: cache distingue dois looks de objeto no mesmo id; todos os humanos visíveis usam 12 quadros originais, sem fontes `A:`; Seu Zé fora de Coral é efetivamente renderizado com `frlg_oldman.webp`. Passou.

Resultados em `tools/resultados/coral-personagens/`. As medições curtas do teste de navegação ficam registradas, mas não estabelecem melhoria de desempenho nem substituem uma caminhada prolongada ou teste físico no iPhone. A pendência de desempenho do cenário da amostra continua aberta. A bateria completa de jornada/progressão não foi repetida nesta correção de seleção e apresentação; a execução anterior está em `tools/resultados/coral-aventura/testes.json`.
