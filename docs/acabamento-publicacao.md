# Acabamento e publicação para teste — 25/10/2026

Publicação autorizada pelo dono após a revisão de jogabilidade. Mantida a direção visual aprovada e os sprites humanos originais; não há mudanças de roteiro, mapas permanentes, dados dos Pokémon ou dificuldade. Esta é uma versão para teste, não uma certificação de ausência de bugs em todo o jogo.

## O que mudou

| Arquivo | Acabamento/correção |
|---|---|
| `src/ui/toque.js` | Grade de batalha mais compacta; controles de 44–60 px, sem sobreposição. Captura aparece na arena selvagem e some durante uma captura pendente. |
| `src/visual2d/coral.css` | Botões e painel do aliado no padrão azul do cenário; nomes dos golpes mais contidos e analógico discreto. |
| `src/ui/menu.js` | Identifica o Pokémon escolhido para a próxima batalha, sem dizer que está em campo. |
| `src/ui/espetaculo.js` | Nome do golpe em pílula discreta, sem inclinação, exclamação ou entrada cortada pela borda. |
| `src/visual2d/coral-pessoas.js` | Treinadores com altura visual de 30 px na arena (crianças: 25); demais cenas preservadas. Buffer de restauração reutilizado entre quadros. |
| `src/visual2d/coral.js` | Sombras estáticas só são reconstruídas quando o conjunto de objetos muda; buffer de visibilidade reutilizado. Classe de batalha restaurada corretamente ao reentrar na cena. |
| `src/visual2d/coral-terreno.js` | Detalhes discretos de areia/pedra e flores nas extremidades da clareira; mesma textura, sem novos obstáculos. Listas de direção compartilhadas durante a pintura. |
| `src/main.js` | Captura pendente impede capturas simultâneas do mesmo alvo. Timers de bolas canceladas não concluem em outra cena. |
| `src/combat/encontro-coral.js` | Ao trocar a cena, cancela bolas em voo/captura e restaura o selvagem se a captura foi interrompida. |
| `tools/teste-3d/acabamento-captura.mjs` | Toque real em Capturar, duas bolas no mesmo alvo e fuga durante a captura. |
| `tools/teste-3d/revisao-jogabilidade.mjs` | Confere captura disponível, tamanho, limites e ausência de sobreposição dos botões; permite separar os resultados de cada rodada. |
| `tools/teste-3d/revisao-desempenho.mjs`, `revisao-equilibrio.mjs` | Saída em pasta configurável, preservando os resultados anteriores. |
| `tools/teste-3d/publicacao-acabamento.mjs` | Sessão nova no endereço público: abrir, desafiar pelo toque, capturar disponível e fugir/recolher. |

As melhorias de encontro direto, montaria, descarte de entidades e projeção de PS da rodada anterior também fazem parte desta publicação; detalhes em [revisao-jogabilidade.md](revisao-jogabilidade.md).

## Desempenho

Mesmo protocolo da revisão anterior: Chrome 844×390, DPR 2, CPU 4× lenta, qualidade alta, horário/percurso iguais, sem spawns durante a amostra. Baseline publicada `855089f0` contra esta revisão. Um Chrome por vez, 4 s por ponto.

| Ponto | CPU p95 (ms), antes → depois | Quadro p95 (ms) | Pico JS (MiB) | JS após GC (MiB) |
|---|---:|---:|---:|---:|
| praca | 7.7 → 7.2 | 12.1 → 11.4 | 299.66 → 286.42 | 283.11 → 283.58 |
| farol | 6.1 → 6.5 | 11.0 → 11.4 | 296.67 → 286.16 | 283.24 → 283.50 |
| caminhada | 7.9 → 6.1 | 11.4 → 8.2 | 310.76 → 295.49 | 284.06 → 284.53 |

O pico JS caiu nos três pontos, com 58 geometrias e 48 texturas nas duas versões. A caminhada cobriu aproximadamente 260 px em ambas. Não há novas texturas, malhas ou efeito de tela inteira. O consumo das imagens/canvases de Coral permaneceu igual.

**Ainda não há aprovação estrita de todos os indicadores:** o p95 no farol aumentou 0,4 ms e o heap após GC aumentou entre 0,25 e 0,48 MiB. As amostras são curtas e o Chrome não substitui medição física no iPhone/Safari. A publicação para teste não resolve essa pendência.

## Validação

Os 20 testes Node passaram novamente, incluindo jornada completa, progressão, 110 alvos do guia, caminhada, sólidos, saídas, obtenção, invisíveis, geografia, personagens e decoração. A auditoria do navegador conferiu 179 NPCs sem fechar passagens. A montaria aquática voltou a passar no embarque e na navegação. As gravações de batalha selvagem e de ginásio terminaram sem erros da página.

O teste de equilíbrio repetiu os 12 confrontos sem aumento de PS perdidos/minuto: selvagens 6,89 → 6,89; rival 5,67 → 5,67. Duração e cadência também ficaram iguais. Os testes de navegação confirmam entrada/saída de interiores, descarte da arte e retorno; o teste de encontros cobre vitória, captura, fuga e derrota.

O teste específico de captura usa o botão real, garante uma única captura com duas bolas e confirma que fugir cancela a captura pendente sem adicionar o Pokémon à equipe. A grade de batalha mede 188 px de altura, com botões de pelo menos 44 px e sem sobreposição no dispositivo alvo.

Resultados completos: `tools/resultados/acabamento-publicacao/`. Fotos: `tools/shots/acabamento-publicacao/index.html`.

## Publicação e reversão

Destino: https://medtechbr.com.br/alvorada/. Publicar os commits revisados em `main`, aguardar o GitHub Pages e comparar os arquivos públicos aos locais. O teste `publicacao-acabamento.mjs` verifica os fluxos no endereço público com um perfil novo, sem alterar saves do dono.

Se a versão impedir abertura, montagem ou entrada/saída de batalha, reverter os commits da revisão até o estado `855089f0` por commits de reversão, sem reescrever o histórico e sem apagar saves. Não há migração de banco ou mudança no formato de save.

Pendências: validação física no iPhone, sessão prolongada, multiplayer/reides e revisão artística completa das demais regiões. Esta rodada dá acabamento ao padrão e aos fluxos existentes.

## Conferência no site público

Publicação de código `acc318c0acff2900b7dd73783c3a957a6eb585f2` confirmada no GitHub Pages. Os 19 arquivos de execução alterados foram baixados do endereço público e comparados byte a byte com os locais: todos iguais.

Em uma sessão nova, 844×390 e DPR 2, o site abriu com o service worker registrado, ativo e controlando a página. O toque em Batalhar enviou o Pokémon diretamente à arena; Capturar ficou disponível; Fugir retornou ao mesmo ponto, com distância de retorno zero e Pokémon recolhido. Nenhum erro de execução ou shader foi registrado no teste. A etiqueta Escolhido também foi conferida na equipe.

Provas: `arquivos-publicos.json`, `publicacao.json`, `publicacao.log` e `publico-arena.jpg` em `tools/resultados/acabamento-publicacao/`. O commit posterior acrescenta apenas este registro e as provas da publicação; não altera o jogo.
