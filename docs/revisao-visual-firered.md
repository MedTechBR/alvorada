# Revisão visual FireRed — 27/10/2026

Comparação com a publicação `c11d2232`. Implementação em `revisao-visual-firered`.

[Galeria com 27 comparações nos mesmos pontos](../tools/shots/revisao-visual/index.html).
As imagens são capturas reais em 844 × 390. Não são ilustrações de um resultado futuro.

## O que as fotos revelaram e o que foi corrigido

| Problema | Diagnóstico e correção |
| --- | --- |
| Pedras com uma base quadrada de água | O recorte antigo incluía peças de água. Pedra e rochedo agora usam os objetos originais transparentes do FireRed. Há teste de pixels para impedir o retorno desse erro. |
| Pontos azuis regulares na areia | Os três recortes de areia seca tinham pixels azuis na paleta. Apenas esses pixels foram convertidos em grãos de areia; margens e água mantêm suas cores. |
| Caixas, bancos e decoração com aparência errada | Caixas não viram placas, bancos não viram cercas e palmeiras não viram moitas. Peças sem equivalente conservam seu desenho e sua função. Objetos de puzzle preservam os estados ligado/desligado e aberto/fechado. |
| Enfermeira e atendente invisíveis | Confirmada oclusão: balcão alto e máquina larga cobriam os corpos. O tampo ficou mais baixo e a máquina se alinha ao próprio espaço. Mesas e móveis pequenos preservam a proporção. |
| Invisibilidade no iPhone | O problema sem oclusão não foi reproduzido no Chrome. A carga WebP agora passa por imagem decodificada e Canvas RGBA, evitando enviar o bitmap WebP diretamente ao WebGL. Falha de rede conserva um corpo visível e tenta novamente com intervalo. Precisa de confirmação no Safari físico. |
| Treinador solto sobre a montaria | A cintura fica no ponto do assento, sem o deslocamento vertical adicional. O corte conserva a parte útil do tronco. A ordem entre corpo e animal foi conferida nas oito direções. |
| Caverna preta, escada parecendo pedra e ponte parecendo telhado | Corrigidas as escolhas de piso e escada. Pontes e trilhos usam um único banco pequeno de 256 × 16, com madeira e metal. Paredes de caverna usam rocha. |
| Vidas espalhadas e repetidas na arena | Dois painéis no topo em batalhas selvagens e de treinador/ginásio, com nome, nível e PS atual/máximo. Não há barras duplicadas sobre os corpos. O alvo continua identificado à distância e durante a troca de Pokémon. |
| Todos os ginásios como um campo verde | Paleta discreta por tipo. O elétrico usa azul e aço. O piso é estático e é destruído ao encerrar a arena. Equipe, dano, avisos, perigos e colisões não mudaram. |

Os personagens continuam nas folhas clássicas. Não foi introduzido outro desenho de treinador ou uma mudança automática para uma versão visual antiga.

No Centro, uma comparação com o corpo temporariamente oculto contou **880 pixels visíveis da enfermeira, 840 do atendente e 712 do banhista**. A checagem considera o corpo, não a sombra. Na montaria, o erro de alinhamento da cintura foi **0 px nas oito direções**. O piso do ginásio foi conferido como liberado após a saída.

## Cobertura e limites do cenário

Foram inspecionadas 27 vistas: Coral e seu Centro, três andares do Farol, casa, mercado, caverna, templo, Campina, Escarpa, Alvorada, Sussurro, Porto Espelho, Lamparina, Aurora, Geada, Buriti, Mandacaru, Siri, Jandaia e praias. A captura do Farol usa o estado inicial do puzzle, com luz reduzida quando os geradores estão desligados.

As correções de recorte e identidade valem para as famílias de objetos no continente, não só para Coral. O mapa grande também desenha as peças preservadas, com seus recortes reais. O minimapa inclui essas peças e evita salvar/restaurar transformações para objetos sem rotação.

**Escarpa, Aurora, Lamparina, Geada e Jandaia receberam canteiros autorais de piso** no lugar de parte das grandes lajes: jardim assimétrico em Escarpa, passeio central em Aurora, recortes alternados em Lamparina e Jandaia e áreas de neve em Geada. O eixo de passagem e os caminhos existentes permanecem livres. A mudança é visual, aplicada apenas a piso caminhável; não cria obstáculos, encontros ou mudanças de posição salva. As cinco praças são testadas para preservar caminhos, sólidos e arenas. Uma recomposição mais profunda dos prédios e das áreas úteis continua fora desta rodada; não foram espalhados objetos aleatórios para simular densidade.

## Testes

- 24 verificações Node/camada vestir, com resultados individuais em `tools/resultados/revisao-visual/node.json`.
- Navegador: cenário/visibilidade, oito direções da montaria, dois painéis de PS, retirada das duplicatas, troca/saída da arena, liberação do piso, mapa grande, montaria aquática, acompanhante, bolsa, batalha fluida, combate contra paredes e passagens de NPCs. Resultado final em `navegador-entrega.json`; as capturas comparativas estão em `depois-cenas.json`.
- Recortes de rocha: `python3 tools/firered/verificar-objetos.py`.
- Módulos iniciais: `python3 tools/precarregar-modulos.py --verificar`.
- Chrome sem interface, um processo principal de cada vez, com áudio silenciado. Não houve teste em iPhone/Safari físico.
- Não foram alterados os cálculos de dano, recargas, IA, dados dos Pokémon ou avisos de ataque.

## Desempenho e memória

Antes: servidor separado com código e bancos FireRed congelados em `c11d2232`. Depois: código atual. CPU do Chrome 4× mais lenta, 844 × 390, DPR 2, 240 quadros e o mesmo percurso por local. Há coleta de lixo antes e depois das amostras. Os resultados incluem tempo de lógica/renderização, intervalo entre quadros, pico de heap, heap após coleta e estimativa RGBA das texturas Pixi.

O renderizador desta versão é Pixi/WebGL; os contadores do three.js são zero e não representam toda a memória gráfica. A memória das texturas Pixi é uma estimativa das bases, não a memória total do aparelho.

As três amostras iniciais identificaram uma regressão de aproximadamente 2,6 MiB na rota: tratar uma moita chamada `cone` como objeto independente ativava uma folha de sprites inteira. Foi mantido o recorte pequeno de arbusto. A comparação após essa correção está separada das amostras de diagnóstico; não foram descartados os resultados anteriores.

| Local | CPU P95 antes → depois (ms) | Quadro P95 antes → depois (ms) | Pico heap antes → depois (MiB) | Heap após GC antes → depois (MiB) | Texturas Pixi antes → depois (MiB) |
| --- | --- | --- | --- | --- | --- |
| coral | 5.50 → 4.20 | 6.70 → 5.40 | 163.60 → 163.67 | 159.67 → 160.14 | 57.40 → 57.67 |
| campina | 4.10 → 3.90 | 5.20 → 5.40 | 164.39 → 165.01 | 161.44 → 161.88 | 58.20 → 58.46 |
| rota | 4.70 → 4.10 | 5.10 → 5.00 | 165.68 → 166.88 | 162.85 → 162.98 | 57.96 → 58.22 |

**A exigência estrita de não piorar nenhum indicador não foi demonstrada.** Há locais com aumento no tempo P95, apesar da retirada da folha de 2,6 MiB. A comparação final, incluindo os canteiros, está em `entrega/desempenho-controlado.json`. Os valores de heap oscilaram entre amostras. Portanto, os testes funcionais passaram, mas o orçamento estrito de desempenho e memória continua pendente; não deve ser confundido com uma validação física no iPhone. Os dados brutos anteriores e as tentativas de cache de lista e de grupo de renderização, não adotadas foram preservados para auditoria.


## Arquivos

- `src/visual2d/firered/objetos.js`: correspondência semântica, proporções, tampo do balcão e preservação dos estados de puzzle.
- `src/visual2d/firered/terreno.js` e `pisos.js`: areia variada, caverna, escadas, pontes e trilhos.
- `src/visual2d/firered/pracas.js`: cinco planos de canteiros, com caminhos, arena e grade lógica preservados.
- `src/visual2d/firered/index.js`: paleta da areia seca, posição da máquina, mapa detalhado, desenho da decoração preservada e HUD criado apenas quando necessário.
- `src/visual2d/firered/interface.css`: dois painéis compactos de PS, mantendo os controles existentes.
- `src/visual2d/coral-pessoas.js`: carga RGBA, tratamento de falha, descarte e ancoragem temporária restaurada após desenhar.
- `src/world/mounts.js`: ordem de desenho entre treinador e animal no visual 2D.
- `src/ui/hud-batalha.js`: reutilização do HUD, variante compacta, alvo fixo e PS numéricos.
- `src/ui/espetaculo.js` e `src/entities/pokemon.js`: não repetir as vidas sobre os personagens quando os painéis estão ativos.
- `src/combat/arena-ginasio.js`: apenas desenho do piso, com geometria reaproveitada e descarte.
- `assets/firered/objetos.png`, `indice.json`, `assets/CREDITOS.md`, `tools/firered/baixar.py`, `preparar.py` e `verificar-objetos.py`: recortes originais, extração reproduzível, origem e regressão dos pixels.
- `index.html` e `sw.js`: dependências da abertura e atualização do cache de código v8, preservando o cache de espécies PMD.
- Ferramentas de diagnóstico, desempenho, testes e publicação em `tools/teste-3d/`; evidências em `tools/resultados/revisao-visual/` e `tools/shots/revisao-visual/`.
