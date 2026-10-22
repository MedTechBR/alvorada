> A composição e o mapa do menu foram revistos em 22/10/2026. Consulte [Mapa recomposto](mapa-recomposto.md) para o estado atual; os tempos abaixo registram a primeira expansão publicada.

# Expansão geográfica de Alvorada

## Resultado e duração

O alvo solicitado é **10–15 minutos entre cidades com exploração e encontros**. A área externa passou de 1200×960 para 4200×3360 blocos (12,25 vezes a área). As coordenadas do núcleo foram ampliadas 5 vezes; as extensões, 2 vezes. Edifícios, personagens e interiores mantêm seu tamanho. Ocaso mantém sua geografia.

O teste automático mede o menor caminho a pé, com passagens liberadas, sem voo, exploração ou batalhas. Não foi realizada uma sessão humana completa de 10–15 minutos por ligação: esse tempo continua sendo um alvo de experiência, não uma duração comprovada. Correr reduz aproximadamente à metade os tempos abaixo. Não houve redução da velocidade nem inclusão de combates obrigatórios para prolongar o percurso.

| Percurso | Antes, andando | Depois, andando |
|---|---:|---:|
| Início → Campina | 41 s | 3 min 15 s |
| Campina → Sussurro | 41 s | 3 min 32 s |
| Sussurro → Porto | 1 min 28 s | 7 min 30 s |
| Porto → Coral | 43 s | 3 min 40 s |
| Coral → Lamparina | 52 s | 4 min 9 s |
| Lamparina → Aurora | 44 s | 3 min 27 s |

As estradas principais têm seis blocos de largura e gramado transitável nas laterais. A expansão amplia os biomas existentes; não acrescenta novos capítulos ou diálogos. Quatro encontros normais e até seis habitantes tranquilos povoam as áreas próximas. Extras podem ser capturados, mas não atacam espontaneamente. O limite permanece quatro agressores, sem reposição durante a luta.

## Alterações por arquivo

- `src/world/geografia.js`: transformação de coordenadas, portas, objetos, regiões e migração idempotente dos saves para layout 3; preserva itens coletados e alterações persistentes de cenário.
- `src/world/mundos.js`: montagem ampliada de Alvorada e ligação de Ocaso; opção de carregar a planta original para ferramentas.
- `src/world/build.js`: execução das operações na planta original, expansão do terreno, acessos das portas e reinicialização das regiões ao retornar a um mundo.
- `src/world/caminhos-ampliados.js`: mantém estradas legíveis com gramado nas laterais, sem transformar cada caminho em uma avenida vazia.
- `src/world/floresta-setor.js` e `src/world/map.js`: árvores naturais por setor visível, descarregadas à distância; encontros também no gramado dos campos ampliados.
- `src/world/guia.js`: direção correta em campos abertos e armazenamento esparso da busca para reduzir alocações no mapa maior.
- `src/world/barreiras-dados.js` e `src/world/barreiras-cenario.js`: barreiras nas novas posições e representação visível dos trechos bloqueados.
- `src/save.js` e `src/world/life.js`: integração da migração de posições, interiores e coleta antiga.
- `src/story/missoes/index.js`: conversão técnica das coordenadas externas, preservando roteiro, ordem e recompensas.
- `src/combat/combat.js`: proteção da esquiva do jogador de 0,32 para 0,40 s nas lutas abrangidas, mantendo a recarga e os parâmetros adversários.
- `tools/alcance.mjs`, `tools/vestir.mjs`, `tools/vestir/mundo.mjs` e `tools/teste-progressao.mjs`: ferramentas compatíveis com planta original e mundo ampliado.
- `tools/medir-viagens.mjs`, `tools/teste-geografia.mjs`, `tools/teste-3d/geografia.mjs` e fixtures de combate: medição dos percursos, migração de saves, retorno entre mundos e testes nas novas coordenadas.

## Equilíbrio reproduzível

Doze lutas com os mesmos pares, níveis e sementes da referência anterior. Médias por grupo; golpes A são do jogador, B do adversário. Nenhuma comparação individual aumentou a vida perdida por minuto. Estes ensaios não cobrem todas as espécies e situações do jogo.

| Luta | PS perdidos/min antes → depois | Duração antes → depois | Golpes A/min antes → depois | Golpes B/min antes → depois |
|---|---:|---:|---:|---:|
| Selvagem | 10,83 → 2,89 | 17,55 → 17,28 s | 75,21 → 75,22 | 15,95 → 15,62 |
| Rival | 14,52 → 5,32 | 17,22 → 16,92 s | 79,57 → 79,80 | 25,56 → 25,42 |

Resultados completos em `tools/resultados/geografia/`. Testes de navegador confirmaram migração de posição externa e de interior, equipe, dinheiro e insígnias; retorno Ocaso–Alvorada; montaria aquática; Gyarados; regras de fluidez e equilíbrio. Auditoria de paredes: 24 lutas, 20.160 quadros, nenhuma travessia. Auditoria de NPCs: 1.750 passagens bloqueadas corretamente.

No ensaio curto em Chrome 844×390 com CPU 4× e dez selvagens, p95 de 13,9 ms por quadro; nenhum erro de página. Isso não substitui teste no Safari ou em iPhone físico, ainda não realizados. A dimensão maior também aumenta a memória de terreno e navegação.

Capturas de exploração: `tools/shots/exploracao-aberta/{campos,bosque,margem}.jpg`. Três capturas de combate selvagem 844×390: `tools/shots/geografia/acao-selvagem-{00,01,02}.jpg`.

A bateria final de 12 testes Node passou, incluindo jornada completa, progressão, guia, caminhada, sólidos, saídas, falantes, obtenção e invisíveis. A auditoria final encontrou zero blocos sólidos sem representação visível.
