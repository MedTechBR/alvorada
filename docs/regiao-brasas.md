# Arquipélago das Brasas: como foi feito

Região `assets/maps/regioes/brasas.json` (retângulo [800, 480, 400, 480], faixa de salas [0, 1920, 1200, 160]). O JSON é
**gerado**: `python3 tools/brasas/gerar.py` (com `--previa` salva imagens de conferência na pasta indicada em
`RASCUNHO`). Editar o JSON à mão funciona, mas a próxima geração sobrescreve; mexa nos módulos de `tools/brasas/`.

| Módulo | O que faz |
|---|---|
| `terreno.py` | contorno das ilhas, praias, zonas (vila, fontes, campos, vulcão), cratera, rios de lava, trilhas; tudo vira um carimbo (`stamp`) no JSON |
| `povoado.py` | Vila Termas (13 prédios, 6 salas feitas à mão), Ilha do Basalto, Ilhote do Farol, bichos, viagens do Barco das Brasas |
| `masmorra_chama.py` | Templo da Chama (`templo_chama_1..3`) e as pedras do ninho de Moltres |
| `rotas.py` | enfeites das rotas, itens, Tocas de Luz, 32 treinadores (gera `src/story/script/regiao-brasas.js`) |
| `conexo.py` | confere a pé, nadando e escalando se tudo é alcançável (`python3 tools/brasas/conexo.py`) |

## Mapa em uma frase por lugar

- **Rota Marítima 19** e **Mar das Brasas**: bancos de areia com nadadores, recifes andáveis, boias (x 900–940) e correntezas.
- **Ilha do Basalto**: praia de areia preta, morro florido de Tapu Lele (`brasas_tapu`), embarcadouro do Barco das Brasas (15h).
- **Ilha da Fornalha**: Vila Termas (norte), Fontes Termais (leste: piscinas em cascata, mirante, ofurô secreto atrás de arbustos),
  Campos de Cinza (crateras do Camerupt, mesetas com escada e item escondido), Vulcão Tição (terraços, rios de lava e a cratera).
- **Cratera do Tição**: só se entra escalando o paredão de cipós a noroeste (outro, escondido, a leste). Na bacia ficam o
  Templo da Chama (porta em (1060, 819)) e o lago de lava com a ilha de Moltres: 4 pedras de Força tapam a lava (coluna x 1080).
- **Ilhota Fumegante**: anel de penhasco fechado, só se pousa voando (`brasas_volcanion`).

## Templo da Chama

1. **Portal de Basalto**: duas pedras na lava criam o chão de magma frio; duas pedras para leste abrem o nicho do Houndoominita;
   uma parede rachada guarda os baús da Emboarita, Delphoxita e Pyroarita.
2. **Rio de Lava**: pedra sobre a placa abre a porta da alavanca, que liga a ponte de basalto; rachaduras no rio são um
   atalho que derruba para a Forja; chave pequena num nicho de parede rachada abre o baú da Charizardita X e a MT Explosão de Chamas.
3. **Forja Antiga** (escura): quatro sinos na ordem leste, sul, oeste, norte (dica no mural); depois quatro braseiros
   acesos em 40 s; câmara do Heatran com a Heatranita.

Testado no jogo: pedras, placa, alavanca, sinos e braseiros (via `game.mundo.masmorra`).

## Missões e quem as dá

`src/story/missoes/regiao-brasas.js`: As duas armaduras (Brasão), Ovo cozido no vapor (diária, Dona Cida), A montanha que
anda (Dra. Lava, Camerupt Alfa), O vulcão acordado e O coração do vulcão (Dra. Lava; Heatran por Alfa), A ave que acende o dia
(Moltres), O vapor da ilhota (Volcanion, Faroleiro Tobias), O canto do morro (Tapu Lele, Pescador Gaudêncio) e Pérolas negras.
Não existe motor de lendário em lugar fixo: os quatro lendários saem como Alfa de missão (`alfa` em etapa `vencer`).

## Pontos em aberto

- `cais_siri` (destino do Barco das Brasas) é do arquivo do Sertão; o barco só funciona quando ele existir.
- Ultra-Feras (Fendas em `brasas_fenda_basalto` e `brasas_fenda_cinza`) só têm o ponto marcado.
- Sem treinadores dentro do templo (o chão é do selvagem e dos quebra-cabeças).
