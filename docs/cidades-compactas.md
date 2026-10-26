# Cidades compactas

O problema era de distância e composição: a ampliação do continente também afastava os lotes dentro das cidades. Em Coral, o bairro visual havia sido redesenhado, mas a chegada, o cais e uma casa continuavam longe dele. Em Sussurro, o recorte urbano antigo nem sequer incluía o Centro e a loja.

A referência aprovada reúne casas, serviços, jardins e orla em ruas curtas. Esta rodada aproxima os destinos e organiza as frentes com os recursos visuais existentes. Não reproduz toda a riqueza da ilustração nem altera os sprites humanos aprovados.

## Mudanças

- `src/world/nucleos.js`: os 14 núcleos urbanos de Alvorada voltam à escala original dos lotes no miolo. A borda externa continua no lugar; a transição absorve a ampliação das estradas. Sussurro passa a incluir seus serviços. A inversa analítica evita 22 iterações por amostra de terreno.
- `src/world/coral-bairro.js`: serviços e casas mais próximos, ruas de três a quatro blocos, jardins nas bordas dos lotes e frentes limpas. A casa antes isolada entra no bairro; chegada, cais e moradores de transporte acompanham a orla. Portas, placas e destinos permanecem conectados.
- `src/world/geografia.js`: layout 6, com transformação do layout publicado anterior e migração idempotente dos saves. A geometria histórica continua disponível para localizar corretamente posições e itens antigos, inclusive os serviços de Sussurro que estavam fora do recorte anterior.
- `src/world/life.js`: reconhece itens já coletados em saves do layouts 4 e 5, mesmo quando a migração ocorre primeiro em outro continente.
- `tools/teste-nucleos-compactos.mjs`: 588 verificações de inversa, bordas fixas e preservação de progresso, incluindo o Centro de Sussurro fora do recorte antigo.
- `tools/teste-3d/cidades-distancias.mjs`: caminhos reais em Coral, distância geométrica entre serviços de outras cidades e aplicação de save antigo no navegador.
- `tools/teste-3d/cidades-compactas.mjs`: fotos de Coral, Sussurro e Campina, no jogo real, em viewport 844 × 390 e DPR 2.

Após a confirmação do dono, as rotas externas também foram encurtadas: a ampliação da região inicial caiu de 5× para 3× e a das extensões de 2× para 1×. O exterior de Alvorada passou de 4.200 × 3.360 para 2.400 × 1.920 blocos. Os lotes e os interiores continuam do tamanho original. Coral acompanha a nova posição como um conjunto, sem encolher seus prédios. Ocaso não recebeu uma nova composição nesta rodada. Roteiro, diálogos, níveis, dano e barreiras de progressão não foram alterados.

## Distâncias

Comparação com `fcde2264`, versão publicada antes desta rodada. Em Coral, a busca percorre apenas blocos andáveis e considera paredes e prédios; não usa distância em linha reta. Não foi aumentada a velocidade do personagem.

| Percurso a partir do Centro de Coral | Antes | Depois |
|---|---:|---:|
| Loja | 25 | 16 |
| Farol | 21 | 19 |
| Escola de surfe | 27 | 26 |
| Casa antes isolada a leste | 133 | 27 |
| Cais | 160 | 38 |
| Chegada da cidade | 175 | 9 |

Distância geométrica entre Centro e loja, medida separadamente dos caminhos acima:

| Cidade | Antes | Depois |
|---|---:|---:|
| Sussurro | 100 | 20 |
| Campina | 13 | 10 |
| Lamparina | 13 | 10 |
| Aurora | 38 | 30 |
| Geada | 13 | 10 |
| Mandacaru | 13 | 10 |
| Siri | 12 | 10 |
| Jandaia | 41 | 33 |
| Termas | 12 | 10 |

Resultados brutos em `tools/resultados/cidades-compactas/`. Fotos e galeria em `tools/shots/cidades-compactas/`. A comparação de Coral usa os mesmos pontos relativos ao bairro; nas outras cidades, usa a mesma posição relativa à porta do Centro, pois o prédio mudou de lugar.

## Rotas entre cidades

Medição com o motor real, mesmas flags de progressão e mesmas montarias liberadas. Barcos, voo e passagens de interiores foram desativados apenas no medidor, para comparar o percurso terrestre. Não foi alterada a velocidade do personagem. Os números medem blocos percorridos; não são tempo estimado de exploração.

| Rota | Antes | Depois | Redução |
|---|---:|---:|---:|
| Alvorada → Campina | 852 | 508 | 40,4% |
| Campina → Sussurro | 948 | 567 | 40,2% |
| Sussurro → Porto Espelho | 1.860 | 1.069 | 42,5% |

`tools/teste-rotas-compactas.mjs` aceita `RAIZ_TESTE` para executar contra uma cópia do código anterior e `SAIDA_TESTE` para salvar o resultado. Os mapas e a decoração autoral dos assets são compartilhados, pois não foram editados. Os dados brutos estão em `rotas-antes.json`, `rotas-depois.json` e `rotas-comparacao.json`.

A largura menor também exige remapear os setores explorados dos saves. Posição, coleta, objetos móveis e interiores migram dos layouts 3, 4 e 5. Os outros continentes mantêm seu histórico. Os quatro recantos de exploração foram preservados: a busca por uma clareira usa anéis próximos, sem apagar árvores ou barreiras para forçar um lote. A vegetação gerada respeita a posição dos NPCs.

## Validação

A suíte de 21 testes Node foi executada; foram acrescentados o medidor das três rotas e o teste dos novos destinos de exploração. O teste de geografia foi ajustado para distinguir as três salas opcionais das salas anteriores e reexecutado com sucesso. A auditoria final encontrou zero bloqueios entre 181 NPCs e zero achados de invisibilidade. Os 11 ambientes da verificação visual passaram, assim como a batalha selvagem e as 24 lutas em corredores (19.743 quadros, nenhuma travessia de parede). A expectativa antiga de oito portas de Coral foi atualizada para nove e os testes de perfil visual passaram a usar o deslocamento geográfico do bairro.

Para reproduzir a comparação, mantenha o servidor habitual em 8700 e rode `python3 tools/teste-3d/cidades-baseline.py` em outro terminal. Depois execute, um por vez:

```sh
node tools/teste-3d/cidades-distancias.mjs
node tools/teste-3d/cidades-compactas.mjs antes
node tools/teste-3d/cidades-compactas.mjs depois
RESULTADOS=tools/resultados/cidades-compactas/ node tools/teste-3d/revisao-desempenho.mjs
```

As capturas de Coral usam o mesmo ponto relativo ao bairro, que mudou de posição no continente. Campina e Sussurro usam o mesmo deslocamento em relação à porta do Centro. As capturas originais têm DPR 2; a galeria também oferece cópias em 844 × 390.

## Desempenho e limites

A tabela abaixo compara a versão publicada `fcde2264` à revisão, no mesmo roteiro em Chrome, 844×390, DPR 2, CPU 4× mais lenta. Os números são amostras locais; `renderer.info` não inclui as texturas Pixi. A memória dessas texturas é estimada separadamente. A comparação estrita não está aprovada se houver regressão de CPU em algum ponto; consulte os resultados brutos e a tabela final. O espelho 3D libera os lotes e as texturas próprios quando o compositor Pixi assume a apresentação. O modo de diagnóstico `coral=local` ainda exercita a reconstrução ao sair do bairro. Os setores gráficos continuam sendo descartados ao sair da tela.

| Coral | CPU P95 antes → depois (ms) | Quadro P95 antes → depois (ms) | Heap após GC antes → depois (MiB) | Geometrias / texturas Three antes → depois |
|---|---:|---:|---:|---:|
| praca | 5,2 → 6,2 | 8,9 → 9,6 | 283,6 → 192,0 | 61 / 51 → 16 / 15 |
| farol | 5,3 → 7,0 | 8,6 → 10,1 | 284,0 → 192,2 | 61 / 51 → 16 / 15 |
| caminhada | 6,4 → 6,0 | 9,1 → 8,9 | 284,6 → 192,2 | 61 / 51 → 16 / 15 |

A caminhada melhorou; as amostras paradas de praça e farol tiveram regressão de CPU e de intervalo entre quadros. Portanto, o requisito estrito de não piorar em nenhum trecho permanece pendente. A memória retida e o pico caíram nos três pontos. O pico ficou em 198,7 / 198,8 / 198,1 MiB depois, contra 286,8 / 286,6 / 291,6 MiB antes. As texturas Pixi estimadas ficaram em 5,4 / 6,2 / 5,3 MiB, medidas à parte de `renderer.info`. Campina, Sussurro e a rota melhoraram em CPU, quadro e memória; veja a tabela em [Apresentação compartilhada](visual-compartilhado.md).

A validação usa Chrome emulado. iPhone físico e Safari continuam pendentes. A planta de Ocaso não foi recomposta; sua câmera e interface receberam o padrão compartilhado. Não houve publicação desta rodada; as mudanças ficam no branch `cidades-compactas` para revisão.


## Conteúdo e apresentação

A redução das distâncias não resolve sozinha a monotonia. Foram acrescentados três destinos exploráveis a recantos existentes, descritos em [Exploração entre cidades](exploracao-entre-cidades.md). A aplicação do enquadramento e da interface de Coral às outras regiões está descrita em [Apresentação compartilhada](visual-compartilhado.md). O redesenho autoral de cada rota continua sendo um trabalho próprio.
