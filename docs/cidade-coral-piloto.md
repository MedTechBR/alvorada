# Cidade Coral: piloto local

> Registro histórico do piloto 3D. A etapa atual está em [Coral em pixel art](coral-pixel-art.md), no branch `coral-pixel-art`; os pontos do bairro foram reorganizados.

Ensaio restrito à cidade do Ginásio do Farol, à praça e ao cais. Branch `cidade-coral-piloto`. Não publicado.

## Experiência

- Fachadas caiadas, madeira azul-petróleo, telhas de barro e pequenos toldos sobre as entradas.
- Piso com paginação mais calma e jardins agrupados nas laterais; portas, moradores e peças da história preservados.
- Krabby procura conchas, Slowpoke descansa e dois Wingull observam o vento. São moradores passivos, sem IA de combate. Os sprites novos carregam ao aproximar.
- Caderno de Coral: observar rua dos serviços, praça e farol entrega três Poké Bolas uma única vez. A atividade é opcional e não altera a campanha.
- Duas composições sintetizadas locais, de dia e de noite, com ambiente de mar. A música de batalha mantém prioridade.
- A ação contextual passa a ser “Observar”; durante essa interação o celular esconde os atalhos de equipe e montaria, que reaparecem ao sair de perto.

Nenhuma mudança em combate, dano, recargas, câmera, roteiro, diálogos de NPC ou dados de espécies. O interior e o puzzle do ginásio não foram redesenhados nesta rodada.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/world/coral-piloto.js` | Composição local, escopo e caderno opcional |
| `src/world/build.js` | Aplica a composição na montagem |
| `src/world/ecologia-coral.js`, `people.js`, `life.js` | Rotinas passivas, interação e carregamento próximo |
| `src/visual3d/letsgo/modelos-coral.js` | Acabamento costeiro e toldos com materiais reutilizados |
| `src/visual3d/letsgo/modelos.js`, `modelos-todos.js`, `src/visual3d/kit/modelos-setor.js` | Registro e seleção do perfil local |
| `src/visual3d/letsgo/chao.js` | Paginação de pedra e paleta vegetal locais |
| `src/audio/partituras.js`, `audio.js`, `src/story/story.js`, `src/world/clima.js` | Partituras de Coral, timbre e seleção contextual |
| `src/ui/toque.js` | Prioriza observação no contexto dos moradores |
| `tools/auditar-invisiveis.mjs` | Audita o perfil efetivamente usado em Coral |
| `tools/teste-coral.mjs`, `tools/teste-3d/coral-*.mjs` | Isolamento, prêmio único, funcionalidade, fotos e medição |

## Evidência visual

Galeria em `tools/shots/coral-piloto/index.html`, com quatro pontos antes/depois e Farol à noite. Capturas de viewport 844×390, DPR 2 (originais de 1688×780 e cópias `-844.jpg` em 844×390). Linha de base: `ac0a018f`.

## Desempenho exploratório

Chrome com CPU 4× mais lenta, viewport 844×390, DPR 2, qualidade alta, cadência normal. Três segundos por ponto após aquecimento e GC. Valores estáticos; não representam um teste físico de iPhone nem uma medição de percurso completo. Recursos do renderer são contagens acumuladas ao visitar os quatro pontos.

| Ponto | Quadro p95 ms antes → depois | CPU p95 ms | Heap após GC MiB | Geometrias | Texturas |
| --- | --- | --- | --- | --- | --- |
| fachadas | 16.7 → 16.8 | 3.1 → 2.9 | 280.09 → 281.49 | 65 → 78 | 65 → 68 |
| praca | 16.7 → 16.8 | 3.2 → 3.3 | 281.65 → 282.37 | 96 → 96 | 75 → 79 |
| farol | 16.7 → 16.7 | 3.1 → 2.4 | 282.10 → 283.38 | 85 → 98 | 77 → 84 |
| cais | 16.7 → 16.7 | 3.6 → 3.0 | 285.19 → 286.18 | 82 → 89 | 77 → 84 |

A cadência permaneceu próxima de 16,7 ms, mas o heap e os recursos aumentaram com os novos moradores e modelos. Portanto, o critério estrito de memória não piorar **não foi atingido**. O piloto precisa de revisão visual e ajuste de orçamento antes de expandir ou publicar. O descarte de setores continua usando o mecanismo existente, sem novos materiais ou texturas grandes no cenário.

Resultados completos em `tools/resultados/coral-piloto/`. Os números são uma amostra única, sujeitos a variação; não sustentam ganho estatístico de desempenho.

## Próxima rodada

Aprovação visual do piloto, orçamento de memória dos sprites e teste físico de Safari/iPhone; depois, caso aprovado, ampliar a direção de arte. Novos sistemas de progressão, habilidades ambientais, redesenho geral da interface e expansão do continente ficam fora deste ensaio. A reformulação por turnos foi descartada conforme solicitado.

## Reprodução local

Com `python3 tools/serve.py 8700`, abrir `http://127.0.0.1:8700/?teste&nosw&ir=1664,1941`. O Farol fica em `?teste&nosw&ir=1965,2014`.

- `node tools/teste-coral.mjs`: isolamento, composição e recompensa única.
- `node tools/teste-pintura.mjs`: perfil local e compartilhamento de cache.
- `FPS_LIVRE=0 node tools/teste-3d/coral-funcional.mjs`: moradores, diálogo, UI contextual e seleção musical.
- `FPS_LIVRE=0 node tools/teste-3d/coral-piloto.mjs depois`: quatro fotos e amostra de desempenho. Para reconstruir a linha de base, usar `ac0a018f` com o mesmo roteiro de captura numa cópia separada.
- Chrome aberto por esses roteiros é encerrado no `finally`; as execuções usam áudio silenciado.

## Validação concluída

Os 16 comandos em Node de `tools/resultados/coral-piloto/testes.json` terminaram com código 0: dados, jornada, jornada completa, progressão, alvos, guia, caminhada do guia, sólidos, saídas, falantes, obtenção, invisíveis, geografia, teste local, pintura e vestir. A caminhada verificou 1.964 condições; a auditoria de invisíveis encontrou zero blocos sem representação visual.

A auditoria com servidor avaliou 179 NPCs e não encontrou passagens fechadas. O teste funcional no Chrome carregou os três moradores observáveis, abriu seus diálogos, comprovou prêmio único, UI contextual e alternância de músicas de dia/noite, sem erros capturados. Não foi realizado teste físico no iPhone nem teste auditivo com alto-falantes do aparelho.
