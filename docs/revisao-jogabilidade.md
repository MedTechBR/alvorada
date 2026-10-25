# Revisão de jogabilidade e acabamento

Trabalho local em `revisao-jogabilidade`, a partir de `855089f0`. A publicação para teste foi autorizada na rodada seguinte; veja [acabamento e medições atualizadas](acabamento-publicacao.md). Mantidos os sprites humanos originais e a direção visual aprovada. A revisão corrige fluxos e problemas reproduzidos; não certifica ausência de bugs em todo o jogo.

## Fluxo de exploração e batalha

O treinador explora sem precisar enviar um Pokémon. O botão principal abre a **Equipe**; perto de um selvagem acessível vira **Batalhar**. Um toque entra na arena e envia o Pokémon escolhido automaticamente. E/Z também desafiam; Q usa a ação principal. Derrotar, capturar ou fugir devolve o treinador ao ponto original e recolhe seu Pokémon. Trocar Pokémon ou substituir um nocaute mantém a mesma arena.

Encontros comuns ao ar livre usam praia, clareira, areia ou campo rochoso conforme a região. Online, reides, chefes especiais e interiores mantêm seus sistemas próprios. Nenhum mapa permanente, roteiro, dado de espécie ou fórmula de dano foi alterado. A reação inicial do selvagem tem pelo menos 0,9 s; o aviso de cada golpe mantém a duração existente.

## Achados e correções

| Prioridade | Local | Problema reproduzido | Correção |
|---|---|---|---|
| Alta | `src/ui/toque.js`, `src/visual2d/coral.css` | Montaria escondida pelas regras do passeio | Atalho próprio restaurado, com área de toque de 48 px e nome acessível atualizado |
| Alta | `src/combat/encontro-coral.js`, `src/combat/ai.js`, `src/combat/combat.js`, `src/world/life.js` | Envio e agressão iniciavam encontros sem uma intenção clara | Desafio explícito, envio dentro da arena e moradores selvagens tranquilos na exploração |
| Alta | `src/main.js` | Corpo anterior apenas removido do palco e restaurado pela lista antiga da cena | Destruição segura; restauração filtra aliados antigos; pedidos assíncronos usam a última seleção |
| Alta | `src/ui/espetaculo.js` | PS e danos usavam a projeção 3D numa cena 2D | Projeção da cena ativa, atualizada depois da câmera; teste lê os pixels da placa |
| Média | `src/engine/input.js`, `src/ui/ui.js`, `src/main.js` | Toque cancelado ou perda de foco deixavam comandos ativos | Limpeza de analógico, mira, corrida e teclas; menu limpa entrada; jogo offline espera em segundo plano |
| Média | `src/combat/encontro-coral.js`, `src/combat/ai.js`, `src/main.js` | Ataques e carregamentos podiam atravessar trocas de cena | Listas de ataques esvaziadas; spawn tardio descarta o corpo se o mapa mudou |
| Média | `src/engine/fx.js`, `src/ui/espetaculo.js` | Código antigo ainda tinha clarão de tela e texto de crítico | Luz local de impacto; frase apenas para eficácia |
| Média | `index.html` | Importação de GLTF falhava por ausência do prefixo three/addons | Mapeamento ao mesmo three.js 0.170.0 já fixado, reutilizando os modelos existentes |
| Baixa | `src/visual2d/coral-terreno.js`, `src/visual2d/coral.js` | Borda de grama reta, espuma larga e enquadramento apertado | Recortes de borda no mesmo atlas, espuma fina, degraus mais legíveis e arena com zoom 2 |
| Baixa | `src/ui/hud.js`, `src/ui/menu.js`, `src/ui/style.css` | Instruções incentivavam envio desnecessário | Equipe seleciona o próximo combatente; ação principal e instruções correspondem ao fluxo direto |

## Arquitetura, dependências e segurança

A cena é temporária e descartada na saída. A lista de entidades do mundo e a da arena não podem compartilhar aliados obsoletos. Os testes cobrem trocas repetidas e descarte, mas ainda não substituem uma sessão longa em Safari/iPhone. Mantivemos as versões de PixiJS/three.js; não foi feita atualização ampla de dependências nem adicionada biblioteca. A correção do importmap resolve um erro de carregamento observado, não uma atualização de segurança. Não foram alterados autenticação, rede ou persistência; esta revisão não é uma auditoria de segurança do multiplayer.

## Verificação

Os 20 testes Node listados em `tools/resultados/revisao-jogabilidade/testes.json` passaram, incluindo jornada completa, progressão, setas/guia, sólidos, saídas, obtenção, personagens, geografia e decoração. A auditoria de invisíveis registrou zero achados.

O teste `revisao-jogabilidade.mjs` usa toques reais em 844×390, DPR 2: montaria, ação principal, escolha de encontro, ausência de agressão no passeio, arena com um adversário, PS visível, troca sem remontagem, substituição após nocaute, recolhimento, descarte, concorrência de envios e cancelamento de entrada. Também confere seis menus sem transbordamento horizontal e uma arena fora de Coral.

Resultados brutos e regressões do navegador estão em `tools/resultados/revisao-jogabilidade/`. As fotos da galeria são capturas do jogo real, reduzidas para 844×390 sem redesenhar elementos.

## Desempenho e memória, antes × depois

Chrome, 844×390, DPR 2, CPU 4× lenta, qualidade alta, mesmo horário e percurso, sem spawns/roteiro durante a medição. Baseline `855089f0` servida em 8701; revisão em 8700. Um Chrome por vez. Amostras curtas de 4 s por ponto; números não equivalem a FPS no iPhone.

| Cena | CPU p95 (ms) | Quadro p95 (ms) | Pico JS (MiB) | JS após GC (MiB) |
|---|---:|---:|---:|---:|
| praca | 7.7 → 8.5 | 12.7 → 14.0 | 300.02 → 299.59 | 284.02 → 283.13 |
| farol | 6.7 → 6.2 | 11.0 → 10.2 | 298.35 → 297.03 | 284.00 → 283.41 |
| caminhada | 7.8 → 5.6 | 12.9 → 8.2 | 302.32 → 314.53 | 284.97 → 284.09 |

58 geometrias e 48 texturas nas duas versões em todos os pontos. As imagens/canvases de Coral ficaram iguais: 6,03 MiB na praça, 6,08 MiB no farol e 4,73 MiB na caminhada. A caminhada percorreu aproximadamente 260 px nas duas versões.

**A condição estrita de nenhum indicador piorar não foi satisfeita:** CPU/quadro na praça e pico JS da caminhada subiram. A memória retida após GC caiu nos três pontos; farol e caminhada tiveram CPU menor. Não declarar desempenho móvel aprovado nem interpretar coleta de lixo como memória total do processo. Não foram feitas repetições até obter um resultado favorável.

## Equilíbrio reproduzível

`revisao-equilibrio.mjs`: 12 confrontos, mesmas sementes 31/73/137, nível 20, pares Pikachu/Eevee e Charmander/Squirtle, mesmos golpes, arena, coordenadas e piloto a 60 Hz. A semente é reiniciada imediatamente antes de criar os Pokémon para que os IVs/naturezas não dependam da limpeza da luta anterior. A reação inicial é zerada nas duas versões do teste para isolar o combate; o jogo final conserva seu respiro de entrada. Cada confronto também exige perda/minuto sem aumento; todos terminaram antes de 90 s.

| Grupo (6 lutas) | PS perdidos/min, antes → depois | Duração média (s) | Golpes jogador/min | Golpes adversário/min |
|---|---:|---:|---:|---:|
| selvagem | 6.89 → 6.89 | 17.42 → 17.42 | 74.64 → 74.64 | 14.93 → 14.93 |
| rival | 5.67 → 5.67 | 17.65 → 17.65 | 75.35 → 75.35 | 15.86 → 15.86 |

Os resultados completos por semente e os eventos de dano estão em `tools/resultados/revisao-jogabilidade/equilibrio/`. O teste passou com taxas e durações iguais em todos os confrontos.

## Reproduzir a comparação

Com o servidor do jogo em 8700, execute `python3 tools/teste-3d/servir-baseline.py` em outro terminal (8701). Esse servidor recupera de `855089f0` os arquivos de execução alterados nesta rodada; os assets são compartilhados, pois não foram modificados. Pare-o ao terminar.

Execute sequencialmente:

```sh
VERSAO=antes PORT=8701 node tools/teste-3d/revisao-equilibrio.mjs
VERSAO=depois PORT=8700 node tools/teste-3d/revisao-equilibrio.mjs
node tools/teste-3d/revisao-desempenho.mjs
node tools/teste-3d/revisao-jogabilidade.mjs
```

Os arquivos novos de teste são `revisao-jogabilidade.mjs` (fluxo/toques/descarte), `revisao-equilibrio.mjs` (12 lutas pareadas), `revisao-desempenho.mjs` (percurso e memória) e `servir-baseline.py`. Os testes existentes `coral-encontro.mjs`, `coral-navegacao.mjs` e `batalha-fluida.mjs` foram ajustados para o fluxo explícito e para a montaria visível. A galeria está em `tools/shots/revisao-jogabilidade/index.html`.

## Limites e próximos riscos

1. **Desempenho móvel:** Chrome com CPU 4× lenta ajuda a detectar regressões, mas não prova estabilidade no iPhone/Safari; faltam sessões prolongadas e medição no aparelho.
2. **Cobertura de sistemas especiais:** interiores, reides e multiplayer precisam de jornadas completas próprias; os testes desta rodada não autorizam chamar todo o jogo de livre de bugs.
3. **Coesão visual:** pequenos reparos de terreno e enquadramento não equivalem a uma reconstrução artística de todas as cidades, interiores e arenas. Essa qualidade ainda exige revisão de cenas, uma a uma, no padrão aprovado.
