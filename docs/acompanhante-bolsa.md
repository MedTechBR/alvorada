# Acompanhante e bolsa rápida de combate

Implementação no branch `acompanhante-e-bolsa`, preservando a apresentação FireRed e o combate em tempo real.

## Acompanhante

Em **Equipe → Pokémon → Acompanhar treinador**, escolha qualquer integrante vivo. A seleção é independente do Pokémon escolhido para lutar. **Parar de acompanhar** o recolhe.

O acompanhante usa Walk/Idle e a escala PMD da espécie, segue as pegadas nas curvas e não ocupa blocos nem participa da IA, dos alvos ou do dano. Espera durante combates, montarias e viagens; retorna ao terminar. Portas e mudanças de mapa reiniciam o trajeto no novo local. Se uma passagem deixa de ser livre, ele some e se reposiciona em chão seguro, sem caminhar através da parede. Ao sair da equipe, a escolha e os objetos visuais são liberados. Evoluções e mudanças de forma atualizam a folha exibida.

A escolha é salva pelo UID do Pokémon, preservando sua identidade ao reorganizar a equipe. Saves antigos continuam sem acompanhante até o jogador escolher um.

## Bolsa de combate

**Itens** abre uma bandeja curta, com as abas **Itens** e **Poké Bolas**. No computador também funciona pela tecla **I**; Esc, o botão fechar ou um toque fora fecham a bandeja. A escolha pausa apenas o combate offline, assim como a mochila existente. A bandeja não está disponível no modo online.

- Remédios e frutas mostram descrição e quantidade. Toque no item e em quem deve recebê-lo. As regras existentes de `useItemOn` decidem o efeito; falhas não consomem o item e deixam uma explicação.
- Poké Bolas mostram cor, modelo e quantidade. Toque no modelo para lançar no selvagem disponível. O botão de captura direta continua lançando a bola preparada com um toque e mostra sua quantidade.
- Contra treinadores, as bolas não podem ser utilizadas. Sem um selvagem disponível, outra bola não é consumida.
- A captura na arena selvagem agora cobre a extensão da própria arena: o recuo automático do treinador podia deixá-lo além dos antigos 260 pixels. A chance de captura, o custo e os atributos dos Pokémon não mudaram. Fora da arena, permanece o alcance anterior.
- O inventário longo rola por toque. A bandeja fecha ao sair da luta; não carrega uma ação pendente para outra cena.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/world/acompanhante.js` | Sprite compartilhado, animação, trilha, colisão e ciclo de vida do acompanhante. |
| `src/main.js` | Atualização do acompanhante e alcance da bola na arena selvagem. |
| `src/world/viagem.js` | Liberação do visual antes de guardar o continente antigo. |
| `src/save.js` | Persistência opcional do UID escolhido. |
| `src/ui/menu.js` | Escolha, recolhimento e identificação na equipe. |
| `src/ui/bolsa-combate.js` | Bandeja, seleção de alvo, inventário real, captura e teclado. |
| `src/ui/ui.js` | Pausa, atalhos e limpeza ao iniciar outro jogo. |
| `src/ui/toque.js` | Lugar do botão Itens no grupo de controles. |
| `src/visual2d/firered/interface.css` | Painel compacto, quantidades e rolagem. |
| `index.html` | Descoberta antecipada dos dois novos módulos. |

## Verificação

`tools/teste-3d/acompanhante-bolsa.mjs`: opção pela interface de toque, percurso com curvas sem pisar em sólidos, fila limitada, ausência na lista de combatentes, save/restauração por UID, reordenação, ida e volta ao Ocaso com liberação do visual anterior, passagem obstruída, espera e retorno após captura, liberação ao sair da equipe, cura, item sem efeito, pausa, Esc, captura selecionada, bloqueio contra treinador, inventário longo com gesto real e abertura por mouse no computador. Layout em 844 × 390, com botões de pelo menos 44 pixels; também abertura em 1280 × 720 sem toque. [Resultado](../tools/resultados/acompanhante-bolsa/funcional.json).

15 testes Node passaram: dados, jornadas, progressão, alvos, guias, caminhadas, sólidos, saídas, falantes, obtenção, invisíveis, geografia, FireRed e revisão de combate. [Resultados](../tools/resultados/acompanhante-bolsa/node.json).

O teste de regressão de captura confirmou lançamento pelo botão real, uma única captura por alvo e cancelamento ao fugir. Não houve alteração de dano, recarga, antecipação ou agressividade. A validação desta rodada é local, no Chrome; iPhone físico/Safari não foi testado.

[Imagens reais e acesso ao jogo local](../tools/shots/acompanhante-bolsa/index.html).
