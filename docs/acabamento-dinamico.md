# Revisão de combate, interface e fluidez — 27/10/2026

Base publicada: `a71ef43d`. Código final de jogo: `6950e944` (os commits seguintes registram evidências). O padrão continua FireRed; as batalhas continuam em tempo real, com arenas separadas. Não houve mudança de roteiro, diálogos, progressão ou dados das espécies.

## Correções verificadas

- **Abertura pública:** a checagem de deploy encontrou uma espera antes de iniciar o motor. PixiJS 8.6.6, a mesma distribuição anteriormente pedida à CDN, agora é servida pelo próprio jogo, com licença e SHA-256 registrados em `vendor/`. O cache v5 inclui essa biblioteca e não antecipa o download do three.js de diagnóstico. Os testes locais de jogo e os 20 casos de acerto foram repetidos com a cópia local.


- **Talho e outros contatos físicos:** reproduzimos um Talho que não acertava ao mirar na parte alta de Wailord. A direção usava o ponto visual como se fosse um ponto no chão. Agora o contato identifica o Pokémon tocado e orienta o golpe até ele. Presa de Fogo foi incluída nos testes, com Growlithe, Arcanine e Gyarados.
- **Jatos e projéteis:** a receita visual de Revólver d’Água encurtava seu alcance. O jogador conserva o alcance dos dados do golpe. Boca, altura visual, colisão e impacto no cenário usam referências coerentes. Projéteis do jogador têm varrimento entre quadros e param na parede.
- **Aparências antigas:** a arena deixou de ativar o compositor pintado anterior. Exploração e batalha usam a mesma apresentação FireRed e pessoas originais. A qualidade baixa mantém a grade dos pixels; o carregamento de uma pose não mostra uma folha de outra apresentação.
- **Montaria:** o torso do treinador ficava escondido pelo Pokémon. A pose sentada foi reposicionada; a montaria de água e sua movimentação também passaram no teste.
- **Movimento:** a fase da passada é integrada à velocidade, evitando reinícios ao acelerar ou frear. A posição visual em combate aceita frações de pixel de mundo.
- **Câmera:** acompanha os participantes vivos e suaviza o enquadramento. Pokémon fora da luta não puxam a câmera do treinador/ginásio. A arena tem chão nativo, bordas visíveis, vegetação e coberturas; golpes realmente atingem e quebram as pedras. Objetos temporários usam reação local e não entram na destruição persistente do continente.
- **Poké Bolas:** contorno, volume, aro, botão e detalhes por modelo numa textura compartilhada de 16 × 16. Lançamento, captura, treinadores e reides reutilizam a imagem.
- **Menus e mapas:** menu principal em duas colunas, alvos de toque acessíveis em 844 × 390, mapa detalhado com rótulos legíveis e minimapa quadrado no norte. Tocar nele abre o mapa. O desenho reutiliza os setores prontos e fica suspenso quando o painel está oculto na batalha.
- **Memória:** Pokémon moradores distantes carregam as folhas PMD por proximidade. Setores e bitmaps temporários conservam a liberação existente; não foram adicionados atlas grandes.

## Equilíbrio antes × depois

Motor real, passo de 1/60 s, sementes 31/73/137, nível 20, mesmos pares (Pikachu/Eevee e Charmander/Squirtle), mesmas coordenadas e piloto. São seis lutas selvagens e seis contra o rival, sem cura durante a medição. Cada uma precisa terminar e **nenhuma pode aumentar a vida perdida por minuto**, além da comparação agregada. Os avisos e recargas dos adversários não foram encurtados.

| Luta | PS perdidos/min antes → depois | Duração média (s) antes → depois | Golpes/min jogador antes → depois | Golpes/min adversário antes → depois |
|---|---:|---:|---:|---:|
| Selvagem | 6,89 → 6,88 | 17,42 → 17,45 | 74,64 → 74,50 | 14,93 → 14,90 |
| Rival | 5,67 → 5,62 | 17,65 → 17,78 | 75,35 → 75,35 | 15,86 → 16,31 |

Os 12 casos passaram individualmente. A contagem observada de ações varia com a circulação e a duração da luta; a cadência configurada do adversário permanece igual. A proteção após dano/queda do jogador é preservada. Isso demonstra os casos medidos; não é uma prova para todas as combinações possíveis de espécies e habilidades.

Dados brutos: [antes](../tools/resultados/acabamento-dinamico/equilibrio/antes.json), [depois](../tools/resultados/acabamento-dinamico/equilibrio/depois.json).

## Desempenho e memória

Chrome, CPU 4× mais lenta, 844 × 390, DPR 2, um navegador por vez. São 240 quadros simulados por ponto, mesmo deslocamento de ida/volta e mesmas posições dos moradores, mantendo suas animações. O roteiro remove encontros aleatórios da sessão de medição. A referência serve **todas** as fontes congeladas de `a71ef43d`; seus bytes foram conferidos com o Git. Assets não foram alterados.

| Cena | CPU P95 (ms) antes → depois | Intervalo de quadro P95 (ms) antes → depois | Heap após GC (MiB) antes → depois | Pico de heap (MiB) antes → depois | Canvases contabilizados (MiB) antes → depois |
|---|---:|---:|---:|---:|---:|
| Coral | 4,10 → 3,70 | 4,90 → 4,50 | 171,93 → 159,53 | 175,27 → 163,24 | 4,94 → 2,94 |
| Campina | 3,40 → 3,40 | 4,50 → 4,50 | 173,34 → 161,30 | 177,09 → 164,22 | 5,61 → 3,61 |
| Rota | 3,20 → 3,30 | 4,20 → 3,80 | 173,33 → 161,27 | 176,63 → 165,17 | 4,59 → 2,61 |

O intervalo P95 não aumentou nos três percursos; a memória diminuiu. A CPU da rota variou +0,1 ms, enquanto o intervalo entre quadros caiu. `renderer.info` do three.js registra 0 geometrias/0 texturas nas duas versões porque o modo padrão é Pixi. A conta de canvases não inclui todos os atlas PMD; `performance.memory` mede heap JavaScript e não a RAM total do iPhone nem toda a memória WebGL.

[Resultado controlado](../tools/resultados/acabamento-dinamico/desempenho-controlado.json) · [Conferência da referência](../tools/resultados/acabamento-dinamico/referencia-congelada.json). Arquivos de medições exploratórias anteriores foram mantidos; as amostras com servidor de base parcial não sustentam esta tabela.

## Cenário e percursos

A composição toma como referência as trilhas estreitas, bordas e agrupamentos do mapa original de Route 1, já extraído na etapa FireRed. O gerador afina faixas retas de estrada de 6–12 para três blocos, com acostamentos livres, e acrescenta pequenos bosquetes onde consegue garantir uma volta livre em todo o perímetro. Protege ligações de moradores, itens, portas e pontos úteis, sem abrir barreiras.

Nesta montagem, 6026 células de estrada foram afinadas e 984 células receberam mata agrupada. [Contagem por trecho](../tools/resultados/acabamento-dinamico/rotas.json). Nem todo trecho permite a composição automática: Rota 3 recebeu ajuste de estrada, mas não novos bosquetes nesta rodada.

As entradas existentes da Gruta de Lúmen, Clareira das Raízes e Ruína do Pomar continuam acessíveis. Não são dungeons novas desta revisão. A recomposição manual dos grandes espaços restantes, inclusive margens e alguns núcleos urbanos, fica para uma rodada específica; esta publicação não apresenta o continente inteiro como redesenhado.

## Validação

- 24 testes Node: dados, jornadas, progressão, alvos, guia, guia caminhando, sólidos, saídas, falantes, obtenção, invisíveis, geografia, Coral, pintura, arena/Coral Pixel, personagens, identidades, combate, exploração, compactação, vestir, FireRed e composição/câmera. [Resultados](../tools/resultados/acabamento-dinamico/node.json).
- 20 cenários direcionados de acerto, incluindo Talho/Presa de Fogo, alvos em movimento, diferenças de tamanho, alcance e um controle negativo fora do alcance. Instrumentação confirma dano causado pelo golpe, sem contar queimadura residual como acerto. Uma pedra é atingida e quebrada pelo jato real. [Detalhes](../tools/resultados/acabamento-dinamico/funcional.json).
- 24 lutas de colisão em corredores, incluindo voo, cavar, teleporte, investidas e empurrões; nenhuma violação. Batalha fluida, entrada/saída, equipe, mapa e conteúdo de rotas também passaram. [Bateria final](../tools/resultados/acabamento-dinamico/validacao-final.json), [bateria adicional](../tools/resultados/acabamento-dinamico/browser.json).
- Auditoria de passagens: 181 NPCs parados, nenhum fechando passagem. Captura por toque, duas bolas no mesmo alvo, cancelamento ao fugir e montaria de água passaram.
- O teste antigo que exigia arena inteiramente vazia foi substituído por faixa central livre, bloqueios internos associados a objetos visíveis e todos os pisos livres conectados. As outras verificações de isolamento, save e acesso às portas continuam.

## Arquivos de jogo

| Arquivo | Mudança |
|---|---|
| `src/combat/combat.js` | Mira física no corpo, emissão/alcance dos jatos, colisão varrida e impacto no chão correto. |
| `src/combat/arena.js` | Índice de objetos do mapa ativo e tratamento dos objetos locais do encontro. |
| `src/combat/encontro-coral.js` | Montagem e inclusão do chão nativo na cena temporária. |
| `src/combat/encontro-coral-dados.js` | Temas, vegetação, coberturas e reação local dos objetos temporários. |
| `src/entities/pokemon.js` | Fase contínua da passada e posição visual fracionária em batalha. |
| `src/visual2d/firered/index.js` | Compositor único, câmera limitada à cena, cache de objetos e reaproveitamento do minimapa. |
| `src/visual2d/firered/camera-batalha.js` | Enquadramento suave somente dos participantes. |
| `src/visual2d/firered/terreno.js` | Piso coerente com os temas rochoso e gelado. |
| `src/visual2d/firered/interface.css` | Acabamento de HUD, controles, menu e mapa. |
| `src/visual2d/coral-pessoas.js` | Pose montada, retenção curta e ausência de troca para folhas antigas durante a carga. |
| `src/engine/pokebola.js` | Imagem compartilhada das bolas. |
| `src/engine/quality.js` | Grade de pixel estável na qualidade baixa. |
| `src/main.js` | Retirada do compositor antigo no modo padrão e uso das novas bolas. |
| `src/story/battle.js` | Bola de envio do treinador; roteiro preservado. |
| `src/world/tocas.js` | Bola de envio dos reides. |
| `src/world/people.js` | Carga dos moradores Pokémon por proximidade. |
| `src/world/rotas-compostas.js` | Trilhas mais estreitas e bosquetes com circulação garantida. |
| `src/world/build.js` | Aplicação da composição antes de montar as árvores. |
| `src/world/minimap.js` | Tamanho correto, moldura do enquadramento e desenho sem trabalho duplicado. |
| `src/ui/menu.js` | Rótulos legíveis no mapa detalhado. |
| `sw.js` | Cache de código v5 e biblioteca local; sprites mantêm o cache compartilhado. |
| `index.html`, `vendor/` | PixiJS 8.6.6 no mesmo domínio, licença MIT e origem registrada. |

Os novos testes e os testes adaptados ficam em `tools/teste-acabamento.mjs`, `tools/teste-coral-pixel.mjs` e `tools/teste-3d/`. O servidor de comparação agora congela todas as fontes, evitando que mudanças posteriores contaminem a referência.

## Fotos e limites

[Galeria antes/depois, menus e três momentos de batalha](../tools/shots/acabamento-dinamico/index.html). As fotos da batalha são capturas reais em 844 × 390, com IA e dano ativos.

Não houve teste em iPhone físico/Safari nesta rodada. O cache PMD é compartilhado e continua retendo espécies já visitadas; a redução medida vale para a abertura e o percurso descrito, não para uma sessão percorrendo todas as espécies. Não afirmamos ausência de qualquer bug em todas as combinações de golpes ou de mapas. A validação pública é feita depois do deploy, com entrada por toque, batalha, retorno, mapa original e service worker.

Para regressão impeditiva no jogo público, o ponto anterior de recuperação é `a71ef43d`; os commits estão separados por finalidade e não exigem reset forçado.

A medição comparativa de quadro usa a mesma distribuição PixiJS 8.6.6; a alteração final troca a origem do arquivo, sem alterar a biblioteca ou as regras de combate.
