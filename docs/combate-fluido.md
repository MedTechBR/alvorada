# Combate fluido — revisão local

Branch `combate-fluido`. Sem push. Referência visual: https://www.youtube.com/watch?v=J_JhLHfqZXY.

## Mudanças por arquivo

| Arquivo | Mudança |
|---|---|
| `src/combat/fluidez.js` | Delimita o ritmo novo a selvagens e Téo; identifica golpes leves (potência até 50). |
| `src/combat/combat.js` | Recarga leve de até 0,8 s, recuperação andando, esquiva de 0,45 s, janela de resposta de 0,65 s, contato, choque físico, proteção na queda e margem de 10% no dano inimigo. Avisos e recargas adversárias preservados. |
| `src/entities/pokemon.js` | Avanço curto de contato com colisão, Hurt, Rotate e recuperação automática com Hop. |
| `src/main.js` | Controle móvel durante golpes leves; esquiva compartilhada por teclado e toque; separação de corpos respeitando paredes. |
| `src/story/battle.js` | O Téo se move na recuperação sem antecipar o próximo ataque. |
| `src/world/grade.js` | Separação entre pessoas/corpos usa deslocamento com colisão, em vez de escrever a posição através da parede. |
| `src/combat/vfx.js` | Acentos locais na cor do tipo e indicação visual de contra-ataque, reaproveitando anéis, luz e sprites. |
| `src/combat/altitude.js` | Remove Cavar da ação genérica de altura; Cavar continua entrando na terra pelo golpe e acionando a interação do terreno. |
| `src/combat/pilot.js` | Descrição do botão e indicador de recarga ajustados. |
| `src/ui/toque.js` | Esconde o botão de altura quando não há voo/mergulho disponível. |
| `src/ui/menu.js` | Ajuda informa que Cavar é um golpe. |
| `src/world/estadios.js` | Nove estádios de líderes com piso uniforme e área livre de 48×32 blocos; sem obstáculos decorativos sólidos. |
| `src/combat/arena-ginasio.js` | Quadra simples; retira peças/perigos automáticos e fases que fechavam a arena, aproxima posições iniciais. Equipes, golpes, avisos e troca contínua mantidos. |
| `src/visual3d/camera.js` | Aproxima enquadramento dos lutadores na quadra simples. |
| `src/visual3d/quadra.js` | Piso three.js estático, com uma textura e uma malha; libera recursos ao sair. |
| `src/visual3d/index.js` | Integra a quadra ao desenho 3D. |
| `tools/teste-3d/equilibrio.mjs` | Lutas automáticas reais a 60 passos/s, sementes fixas, referência antes/depois e falha por aumento de perda/min em qualquer par. |
| `tools/teste-3d/fluidez-regras.mjs` | Regras de escopo, movimento, esquiva, contra-ataque, queda, choque físico, Cavar e ginásios. |
| `tools/teste-3d/combate-paredes.mjs` | Alterna treinador comum/Téo para exercitar também o contato novo. |
| `tools/teste-3d/batalha-fluida.mjs` | Capturas em 844×390 mantendo DPR 2 na medição de desempenho. |
| `tools/resultados/combate/` | Medições brutas e logs dos testes. |

## Equilíbrio

12 lutas: selvagem/Téo × sementes 31, 73, 137 × Pikachu–Eevee e Charmander–Squirtle, todos nível 20.
As duas versões usam as mesmas espécies, níveis, IVs, movimentos, semente por quadro, posição inicial e roteiro de controle.
O teste chama `game.frame`, `Combat`, `PokeEntity` e a atualização oficial de `TrainerBattle`.
Relógios de moradores/cenas externas e decisões de subir no cenário ficam isolados; dano, colisão, recargas, movimento, IA de combate e hitstop são reais.
Não há cura durante as medições. Duração é tempo simulado de parede, incluindo hitstop, até o primeiro nocaute.
Golpes/min contam usos aceitos, não tiques de dano. A taxa do grupo divide a perda acumulada pelo tempo total de exposição.
A referência foi executada duas vezes antes de alterar o combate: resultados idênticos (`antes.json`, `antes-repetido.json`).
Além das médias abaixo, cada uma das 12 comparações individuais exige perda/min não maior.

| Luta | PS perdidos/min antes → depois | Duração média (s) | Golpes/min jogador | Golpes/min adversário |
|---|---:|---:|---:|---:|
| selvagem | 75.40 → 39.50 | 19.50 → 17.22 | 45.65 → 75.51 | 25.13 → 15.68 |
| rival | 78.84 → 37.83 | 18.64 → 16.92 | 45.05 → 79.80 | 30.04 → 24.24 |

## Reprodução

```sh
python3 tools/serve.py 8700
PORT=8700 node tools/teste-3d/equilibrio.mjs depois
PORT=8700 node tools/teste-3d/fluidez-regras.mjs
PORT=8700 node tools/teste-3d/combate-paredes.mjs
PORTA=8700 node tools/auditar-passagens-npc.mjs
PORT=8700 OUT=tools/shots/combate-fluido node tools/teste-3d/batalha-fluida.mjs selvagem 3 2
```

Para gerar uma nova referência `antes`, use a revisão anterior ao combate (`10d274a9`), que já contém o teste determinístico, em checkout separado. Não substitua a referência pelo código novo.

## Limites

- Equilíbrio demonstrado nos 12 cenários automatizados, não em todas as combinações de espécies, habilidades, níveis e terreno.
- Chrome com viewport/toque móvel e CPU 4× mais lenta; não houve teste em Safari nem em iPhone físico.
- As fotos são da luta automatizada; o piloto da gravação repõe PS para manter a ação. Essa reposição não existe no teste de equilíbrio.
- Elite, Campeã, chefes da história, PvP e ritmo de combate dos ginásios não foram reformulados. As quadras simples valem apenas para líderes, incluindo o píer de Marina.
- Interações existentes dos golpes com o cenário foram reaproveitadas, não houve reescrita de todas as habilidades.
- `tools/teste-3d/inicial-tmp.mjs` já existia e foi preservado fora dos commits.

## Validação concluída

- Os 12 testes Node solicitados passaram: dados, jornada, jornada completa, progressão, alvos/passos, guia, guia caminhada, sólidos, saídas, falantes, obtenção e invisíveis.
- Passagens: 181 NPCs avaliados, nenhuma passagem bloqueada.
- Paredes: 24 lutas, 20.160 quadros, 643 golpes, nenhuma violação de colisão.
- Regras funcionais: 39 verificações aprovadas, incluindo os nove ginásios.
- Batalha fluida: 49 FPS com CPU do Chrome limitada a 4×, viewport 844×390, p95 de 37,3 ms, nenhum erro de página e nenhum programa de shader novo durante a medição. Isso não substitui medição em iPhone físico.
- Capturas reais em `tools/shots/combate-fluido/acao-selvagem-00.jpg`, `01.jpg` e `02.jpg` (844×390); quadra em `quadra-ginasio-00.jpg`. Espécie fixada com `DEX=7` apenas para a gravação.

Logs completos em `tools/resultados/combate/logs/`. O servidor local pode ser aberto em http://127.0.0.1:8700/?teste&nosw.

## Retorno automático e câmera girável

- `src/main.js`: depois de derrotar um selvagem, aguarda 1,2 s e recolhe o Pokémon se não houver outro vivo a menos de 14 blocos. Adia durante golpes e não interfere em batalhas de treinador/reides. Explorar sem lutar não dispara o retorno. Movimento livre, grade e mira por analógico acompanham o giro da câmera.
- `src/visual3d/giro.js`: botões ↶ / N / ↷ no topo central, utilizáveis por mouse ou toque, com passos de 90° e restauração da vista inicial.
- `src/visual3d/camera.js`: giro suave e detecção de obstáculos na direção atual da câmera.
- `tools/teste-3d/retorno-camera.mjs`: testa espera, adversário restante, vitória, proteção das lutas de treinador, giro, restauração e transformação das direções. Teste de jornada também passou.
