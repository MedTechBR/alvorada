# Jornada clássica: roteiro cena a cena (história nova)

Este documento é o roteiro completo da história nova de *Pokémon Alvorada*, segmento por segmento, na ordem do jogo.
Ele segue `docs/jornada-classica.md` (a fonte da verdade do design). O código está em `src/story/jornada/`, um arquivo por
segmento. A parte cena a cena foi gerada a partir do próprio código (`src/story/jornada/*.js`), então bate com o que roda.

**Status:** o código está pronto e testado (`node tools/teste-jornada.mjs`), mas **ainda não está ligado** ao motor
(`src/story/roteiro.js`). Quem liga é o agente de estrutura ou você, seguindo as instruções no topo de
`src/story/jornada/index.js`. Nada em `roteiro.js`, `jornadas.js` ou `trama.js` foi alterado.

## Como ler cada cena

- **Gatilho:** o que faz a cena começar (entrar num lugar, falar com alguém, vencer uma batalha, uma flag virar verdadeira).
- **Falas:** quem fala e o que diz. A narração aparece em itálico.
- **Batalha:** o id, o prêmio e a equipe (espécie, nível e golpes). "Se perder, volta a esta cena" quer dizer que o jogador repete.
- **Depois:** o que a cena entrega (insígnia, montaria, itens, flags).
- **Objetivo no painel:** o próximo passo concreto, com o lugar (`alvo`).
- **Reviravolta:** marcada no título da cena. Essas cenas explicam uma das sete mudanças da história, e o objetivo delas começa com "Descoberta:".

## Visão geral dos segmentos

| Segmento | Lugar | Ginásio (tipo, ás) | Evento da trama | Sol ao sair |
|---|---|---|---|---|
| 00 | Vila Alvorada | (início) | Boletim da Mãe: o sol está atrasando | 6h05 |
| 01 | Cidade Campina | Tomé (Normal, 14) | Recrutas e Ébano na Fazenda do Tomé | 6h12 |
| 02 | Vila Sussurro | Lia (Inseto, 19) | Recrutas na estufa, Véspera ao longe; Sina guia até a Toca; rival 2 | 6h19 |
| 03 | Porto Espelho | Marina (Água, 24) | Ébano ataca o Galpão de Barcos; Véspera no píer | 6h27 |
| 04 | Cidade Coral | Jonas (Elétrico, 28) | Solano na inauguração da Aurora; Ébano rouba a pedra do farol | 6h34 |
| 05 | Ilhas Jandaias (região) | (sem ginásio) | Ébano no Templo das Raízes; cabo da Aurora sob o templo; rival 3 | 6h34 |
| 06 | Vila Lamparina | Zélia (Fantasma, 32) | Ataque ao Casarão das Velas; Véspera no cemitério; Vela Eterna | 6h42 |
| 07 | Cidade Aurora, Mina Aurora, Rota 7, Forte Rochedo | Brás (Lutador, 37) | Lúcio na torre; desabamento da mina; arquivo do forte | 6h51 |
| 08 | Sertão do Levante (região) | (sem ginásio) | Ébano escava as Ruínas de Pedra Pintada; Sina revelada; rival 4 | 6h51 |
| 09 | Cidade Escarpa | Graça (Pedra, 41) | Sereno trai a Véspera e foge com as sete pedras | 7h03 |
| 10 | Brasas (região) | (sem ginásio) | Ébano tenta acordar o vulcão; Templo da Chama | 7h03 |
| 11 | Mirante dos Ventos | Celeste (Voador, 45) | Prof. Jatobá sequestrado; Solano pede a Vela | 7h11 |
| 12 | Relógio de Pedra | (clímax) | Véspera e Téo se aliam; Solano; Necrozma; selo das insígnias | 6h04 |
| 13 | Cordilheira Geada (região) | (sem ginásio) | Rival 5 (Téo) no Cume | 6h04 |
| 14 | Liga do Zênite | Elite 4 + Dalva | Dalva é a irmã gêmea da Véspera; epílogo | 6h04 |
| PJ | Mar do Sul, Terras do Ocaso | (pós-jogo) | Neblina; Farol Morto; Vila Fim-do-Mundo | 6h04 |

Insígnias (ordem dos ginásios): Espiga (Campina), Casulo (Sussurro), Gota (Espelho), Faísca (Coral), Vela (Lamparina),
Punho (Forte Rochedo), Rocha (Escarpa), Pluma (Mirante). Montarias: Nadar com a Gota (`lapras`), Escalar com o Punho
(`sneasler`), Voar com a Rocha (`corviknight`, só para ninhos já visitados), Mergulhar com a Pluma (`mantine`).

## As sete reviravoltas

| # | Cena que mostra | O que fica explicado | Quem explica |
|---|---|---|---|
| 1 | `j07_mina_medidor` (Mina Aurora, nível 4) | A Companhia Aurora é quem atrasa o sol: o medidor da mina registra o horário a cada tonelada. A luzita é a raiz do cadeado do Relógio. | Véspera, presa no desabamento com o jogador, o Téo e o Heitor |
| 2 | `j07_prof_telefone` (depois de `j07_arquivo`, Forte Rochedo) | O Prof. Jatobá ajudou a criar a Aurora: a amostra da luzita dele foi vendida a Solano. | As cartas do arquivo, e a confissão do professor por telefone |
| 3 | `j08_sina_revela` (Ruínas de Pedra Pintada) | O Absol que aparece antes de cada desastre é a Sina, parceira da Véspera, presa à luz do Relógio. | A pintura da parede e a própria Sina, que deixa o jogador tocá-la |
| 4 | `j09_traducoes` (Cidade Escarpa) | O Sereno é espião de Solano e falsificou as traduções. Juntar as oito pedras no Relógio abre o cadeado; o Solano quer o Necrozma. | Véspera, depois que o Sereno foge com as sete pedras |
| 5 | `j11_vela_revelada` (Mirante) | A Vela Eterna é a oitava chave, e estava com o jogador desde Lamparina. | Dona Zélia, depois da ligação do Solano |
| 6 | `j12_vespera_aliada` (Relógio de Pedra) | A Véspera e o Téo se aliam ao jogador contra o Solano. | A luta com a Véspera e a chegada do Téo com o Heitor |
| 7 | `j14_irma_revela` (Liga do Zênite) | A Campeã Dalva é a irmã gêmea da Véspera (estrela-d'alva e estrela-vésper). Ela sabia da Aurora e escolheu o silêncio. | A própria Dalva, antes da última batalha |

## Vilões

**Crepúsculo (primeira metade):** o Admin Ébano aparece em quase todo evento de cidade (Campina, Espelho, Coral, Jandaias,
Lamparina, Sertão, Brasas). A Dra. Véspera aparece no Sussurro (ao longe), no Espelho (no píer), em Lamparina (no cemitério),
em Escarpa (com o Sereno) e no Relógio. O Sussurro não tem o Ébano: é um desvio de propósito do roteiro, que o revisor pode
querer corrigir.

**Companhia Aurora (segunda metade):** o Solano aparece antes, como benfeitor, na inauguração de Cidade Coral (`j04_inauguracao`).
Na segunda metade ele assume: a Torre e o Gerente Lúcio em Cidade Aurora (`j07_torre_visita`, `j07_lucio_bloqueia`), a saída
da mina (`j07_saida_mina`), o sequestro do professor no Mirante (`j11_prof_sequestrado`, com Lúcio) e a ligação pedindo a
Vela (`j11_solano_liga`). No Relógio ele luta com Lúcio e Sereno (`j12_solano_batalha`). O Sereno é o espião: aparece com a
Véspera em Escarpa e foge com as pedras.

## Téo (rival): as 5 batalhas

| # | Lugar | Cena | Batalha | Como ele está |
|---|---|---|---|---|
| 1 | Laboratório | `rival_batalha` (cap01.js, mantida) | `rival_batalha` | Começa junto do jogador; defende a Aurora |
| 2 | Vila Sussurro | `j02_rival2` | `nh_rival2` (Nv 14–17) | Ainda pró-Aurora, sem entender a luzita |
| 3 | Selva Grande (Jandaias) | `j05_rival3` | `nh_rival3` (Nv 23–26) | Defende a Aurora: o pai trabalha na Mina e o salário vem de lá |
| 4 | Praça de Mandacaru (Sertão) | `j08_teo_rival4` | `nh_rival4` (Nv 28–30) | Já mudou de lado na mina; quer medir o time do jogador |
| 5 | Cume do Vento Branco (Geada) | `j13_teo_cume` | `nh_rival5` (Nv 50–52) | Explica o porquê: quer ver se a Aurora ainda manda na mina |

A mudança de lado acontece na mina (`j07_mina_medidor`, flag `nh.teoLadoCerto`): o Téo ouve o pai dizer que a cota não podia
parar e troca de lado. O Téo acompanha o jogador no Relógio (`j12_vespera_aliada`) e fica no Portão da Liga (`j14_portao`).
As batalhas 2 a 5 usam o estágio do inicial dele (`rival:N`, o mesmo esquema de `trama.js`).

## Missões secundárias

Regra (seção 1b do doc): no máximo duas por cidade, cada uma com começo, meio e fim, ligada a um personagem ou a uma
reviravolta, ou que dê algo marcante. Dentro do roteiro há três missões novas, todas com o texto no campo `secundaria`
(vai para o diário, não mexe no painel principal):

- **Pipoca do Tito** (Vila Sussurro, `j02_sq_pipoca_inicio`, `j02_sq_pipoca_achado`, `j02_sq_pipoca_fim`): o Skwovet
  do Tito some no bosque. Recompensa: noz de ouro (`rareCandy`).
- **Garrafa do Seu Nestor** (Porto Espelho, `j03_sq_garrafa_inicio`, `j03_sq_garrafa_achada`, `j03_sq_garrafa_fim`): a garrafa
  no manguezal traz um bilhete de **Heitor**, pai do Téo, preso no nível 4 da Mina. Recompensa: 2× superRepel.
- **Diário da Iracema** (Cidade Coral, `j04_sq_diario_inicio`, `j04_sq_diario_achado`, `j04_sq_diario_fim`): o diário do farol
  prova que o Solano assinou a troca do gerador. Recompensa: 3× superPoção.

### Missões genéricas a REMOVER do mundo (não apagadas; só listadas)

As missões abaixo são de entrega ou coleta genérica, ou não têm ligação com a trama. Ficam no arquivo, mas saem da lista
das missões do mundo (tirando da lista `MISSOES` de cada região, na etapa de ligação).
O que fica é o que tem história ou algo marcante (até duas por cidade).

| Arquivo | Manter (história ou marcante) | Remover |
|---|---|---|
| `missoes/regiao-alvorada.js` | `sq_relogios` (Seu Zé e o sol) | `sq_cesta`, `sq_pesquisa1`, `sq_pesquisa2`, `sq_isca` |
| `missoes/regiao-campina.js` | `sq_tauros` (Pokémon marcante), `sq_medalhao` (Sol) | `sq_guloso`, `sq_espantalho`, `sq_revanche`, `sq_carta` |
| `missoes/regiao-espelho.js` | `sq_magikarp` (marcante) | `sq_garrafas_lago` (trocada pela garrafa do Nestor), `sq_psyduck`, `sq_moqueca` |
| `missoes/regiao-sul.js` | `sq_farol` (farol de Coral), `sq_solano` (casa dos Solano) | `sq_acaraje`, `sq_lampioes`, `sq_torres` |
| `missoes/regiao-sussurro.js` | `sq_viola` (Seu Juca) | `sq_pipoca` (trocada pela missão nova do segmento 02), `sq_ronda` |
| `missoes/regiao-jandaia.js` | `sq_ybi` (mapa do templo), `sq_tapu_bulu` (guardião das raízes) | `sq_ovos`, `sq_coco`, `sq_tapu_koko`, `sq_troca_tupa`, `sq_gemeas`, `sq_miragem` |
| `missoes/regiao-geada.js` | `sq_aurora_boreal` (marcante), `sq_avalanche` (alpinistas) | `sq_pesca_gelo`, `sq_vento_branco`, `sq_zero_absoluto`, `sq_banquisa` |
| `missoes/regiao-brasas.js` | `sq_sismografo` (o vulcão acordado, ligado ao Ébano), `sq_heatran` (marcante) | `sq_armaduras`, `sq_armaduras_m`, `sq_ovo_vapor`, `sq_camerupt`, `sq_moltres`, `sq_volcanion`, `sq_tapu_lele`, `sq_perolas_negras` |
| `missoes/regiao-sertao.js` | `sq_reviver_ambar`, `sq_reviver_garra` (Dr. Ícaro, fósseis), `sq_hoopa` (anel da rainha) | `sq_tepig`, `sq_cacimba`, `sq_forro`, `sq_tutor_brasa`, `sq_quermesse`, `sq_caravana`, `sq_tempestade`, `sq_caranguejo`, `sq_mare`, `sq_seismitoad`, `sq_canoa`, `sq_alfa_galeria`, `sq_regirock`, e os 31 `sq_tr_sertao_*` ("Desafio: ...") |

Total: **78 missões a remover** (44 delas no Sertão). Os treinadores em si não saem do mapa: só os "desafios" que embrulham
a luta. O arquivo `regiao-sertao.js` é gerado por `tools/regioes/gerar-sertao.py`: a remoção deve ser feita no gerador.

## Pendências (o que falta para a história rodar)

1. **Mapa (agente `solidos`):** o ponto `relogio_pedra` (topo do Planalto, no Relógio) ainda não existe em `assets/maps`.
   Oito atores e três objetivos o usam. É o único nome que o teste aceita como pendência; qualquer outro nome desconhecido reprova.
2. **Salas e áreas como pontos:** os atores dentro de prédios usam `dentro_<sala>`, o ponto de entrada que o `map.js`
   cria (linhas 168 a 172) para cada sala com porta no mapa. Áreas usam um ponto próximo que já existe (`ninho_vulcao`,
   `ninho_cume`, `ninho_acampamento_selva`). O teste aceita qualquer `dentro_<sala>` de um interior do JSON; só confirma no jogo
   que a porta de cada sala gerou o ponto.
3. **Captura do Necrozma:** a batalha `c12_necrozma` é de chefe Alfa sem treinador (como o Necrozma de `cap11.js`), e
   o campo `captura: true` é só anotação. O motor não lê esse campo. Confirmar em `src/story/battle.js` e
   `src/combat/` se a bola funciona nessa batalha; se não, ajustar a regra.
4. **Lunala:** o campo `aliado` da batalha do Necrozma é só dado (o motor usa `aliado` apenas com `dupla`). Para ela lutar,
   é preciso ligar esse campo no motor. O aliado da luta com Solano (`dupla: 'teo'`) usa o inicial do Téo, como em `cap10.js`.
5. **Treinadores de rota e masmorras:** os treinadores de Jandaias, Sertão, Brasas e Geada continuam nos arquivos gerados
   (`regiao-*.js`, `elenco-jandaia.js`). A história não os redescreve. Masmorras citadas no doc que ainda não têm cena
   (Gruta da Maré, Ruínas dos Vigias, Templo das Marés) ficam para a etapa de conteúdo: não há ponto no mapa para elas.
6. **Níveis:** os líderes e a Elite seguem a tabela do doc (Tomé 14, Lia 19, Marina 24, Jonas 28, Zélia 32, Brás 37, Graça 41,
   Celeste 45, Elite 54–58, Dalva 62–66). Os treinadores reaproveitados mantêm o nível de origem. Ébano: 13 a 42, conforme a região.
7. **Pós-jogo:** só a abertura e a passagem (`pos-jogo.js`). Revanches e lendários (Solgaleo, Lunala) ficam para a próxima etapa.
8. **Personagens novos** em `src/story/script/personagens.js` (aditivo): `aruan` (Monja Aruã) e `vulcanologa`
   (Vulcanóloga Jaciara). Nenhuma chave antiga foi alterada.
9. **Elenco:** ids com a mesma base dos antigos foram renomeados para não colidir (ex.: `teo_mina7`, `lucio_torre_n`,
   `marina_galpao_ataque`, `iracema_inauguracao`, `recruta_trilha`, `recruta_estufa_n`). O teste confere colisões com `elenco.js`.

## Teste

`node tools/teste-jornada.mjs` (sem Chrome). Confere: ids de cena únicos e no padrão, gatilhos válidos, flags bem formadas,
insígnias e treinadores que existem, personagens das falas, lugares do mapa (com a lista de pendências acima), espécies,
golpes e itens das batalhas, objetivo com texto e lugar em toda cena que move o painel, reviravoltas (uma por número, com
o resumo "Descoberta:"), a ordem do sol nos boletins (sobe até o 8º e volta depois do Relógio), e o elenco (sem colisão).
Avisos são de conteúdo e não reprovam.

Caixas de fala: 139 cenas. 120 têm de 3 a 8 caixas. A reveal da mina (reviravolta 1) tem 10, por ser a cena que explica
tudo. As 18 restantes são de treinador que avista o jogador (uma caixa, como no cap02): são as únicas abaixo do combinado.

---

## Roteiro cena a cena

Ordem do jogo. Cada segmento abre com a cena da cidade (ou do marco) e segue até o próximo.

## 00 · O primeiro alvorecer
*Jornada `alvorada` · boletim do sol no fim: 6h05 · arquivo `src/story/jornada/00-alvorada.js`*

### `j00_boletim_manha`
*Gatilho:* a flag `balls` virar verdadeira (sem nh.sol)
- **Mãe:** Ravi! Liga o rádio, o boletim do sol está no ar. Você precisa ouvir isso antes de sair.
- **Rádio Alvorada:** Bom dia, Vila Alvorada. Hoje o sol nasceu às seis horas e cinco minutos. Três minutos mais tarde do que ontem.
- **Mãe:** Isso já é o quinto dia seguido. O Seu Zé diz que os relógios dele estão certos. Então quem está atrasado é o sol.
- **Ravi:** Ouvi os vizinhos falando da Equipe Crepúsculo. Dizem que eles roubam as pedras dos ginásios.
- **Mãe:** Então vai com cuidado. E volta para o almoço, que eu não quero você comendo lanche de estrada.
- *Depois:* flags `nh.sol=6h05` · só conta a história

### `j00_laboratorio`
*Gatilho:* entrar `laboratorio` (exige balls, sem nh.explicouRelogio)
- **Prof. Jatobá:** Chegou na hora! Esse sol atrasado está me dando dor de cabeça. Meus instrumentos mostram o mesmo problema que o rádio mostra.
- **Prof. Jatobá:** No alto do Planalto dos Ventos existe um Relógio de Pedra. Dizem as lendas que ele prende o Necrozma, um Pokémon que come luz.
- **Prof. Jatobá:** As oito Pedras do Alvorecer são as chaves desse relógio. Cada ginásio da região guarda uma há séculos.
- **Ravi:** E a Equipe Crepúsculo quer juntar as pedras?
- **Prof. Jatobá:** É o que parece. Por isso você precisa das insígnias: cada líder que vencer também vai te pedir ajuda para proteger a pedra da cidade.
- *Depois:* flags `nh.explicouRelogio=true`
- *Objetivo no painel:* Saia pela Rota 1, a oeste da vila, e chegue à Cidade Campina → `campina`

### `j00_saida`
*Gatilho:* pisar `saida_vila_oeste` (exige balls, sem nh.explicouRelogio)
- *A Rota 1 começa logo depois da última casa. Dá para ver a Cidade Campina lá no fundo, no meio dos campos.*
- *Antes de sair, o Prof. Jatobá gritou da janela: "Passa no laboratório antes! Você ainda não sabe o que é o Relógio!"*
- **Ravi:** Então é melhor ir logo. Mas antes eu quero entender o que o professor quer dizer.
- *Você olha para o céu. O sol ainda está baixo e pálido, como se tivesse esquecido de subir.*
- *Objetivo no painel:* Volte ao laboratório do Prof. Jatobá antes de seguir para a Rota 1 → `lab`

## 01 · Colheita em Campina
*Jornada `campina` · boletim do sol no fim: 6h12 · arquivo `src/story/jornada/01-campina.js`*

### `j01_chegada`
*Gatilho:* entrar `campina` (exige nh.explicouRelogio, sem badges.campina)
- *Cidade Campina: ruas de terra, uma feira de abóboras e, no fim da praça, uma quadra coberta. Ali fica o ginásio.*
- *Você veio pela Rota 1 para conquistar a Insígnia Espiga, a primeira das oito pedras que a Crepúsculo cobiça.*
- **Ravi:** O Líder Tomé é o primeiro desafio. Mas antes preciso saber o que os recrutas estão fazendo por aqui.
- *Um feirante aponta para a Fazenda do Tomé, a leste da cidade: "Tem gente de capa roxa rondando o celeiro desde cedo."*
- *Depois:* flags `nh.chegouCampina=true`
- *Objetivo no painel:* Vá à Fazenda do Tomé, a leste da cidade, e veja o que os recrutas querem → `fazenda_tome`

### `j01_fazenda`
*Gatilho:* entrar `fazenda_tome` (exige nh.chegouCampina, sem nh.ebanoCampina)
- **Líder Tomé:** Ah, você é o treinador do Prof. Jatobá! Chegou bem na hora. Uns sujeitos de capa roxa estão no celeiro.
- **Lili:** Eles pegaram os tambores de leite e falaram que é para a chefe deles. Eu falei que leite é de vaca, não de patrão!
- **Recruta Crepúsculo:** Passa, velho. A pedra não é sua. A pedra vai para quem sabe o que fazer com ela.
- **Líder Tomé:** A pedra é do ginásio! Ela está comigo há quarenta anos, não é nada de outro mundo.
- **Admin Ébano:** Admin Ébano, da Equipe Crepúsculo. A Dra. Véspera quer as oito pedras longe de quem as vende. Você não entende, garoto.
- **Ravi:** Vender? A pedra é do ginásio, não é de vocês.
- **Admin Ébano:** Então prova. Se você vencer, eu levo o recado. Se perder, eu levo a pedra e você explica para o Tomé.
- *Batalha* `c1_ebano`: Admin Ébano, prêmio ₽1200. Se perder, volta a esta cena.
  - Equipe: Houndour Nv 13 (Brasa, Olhar Malicioso, Mordida); Murkrow Nv 14 (Bicada, Assustar, Perseguição)
- *Depois:* flags `nh.ebanoCampina=true`
- *Objetivo no painel:* Vá ao ginásio de Campina e desafie o Líder Tomé → `gym`

### `j01_ebano_fuga`
*Gatilho:* vencer `c1_ebano`
- **Admin Ébano:** Hm. Não deveria ter sido tão rápido. Pode ficar com o celeiro. A Dra. Véspera só queria ver se você se importava.
- *O Admin Ébano recolhe a bola de um Murkrow derrotado e some atrás do celeiro, mas não leva a pedra.*
- **Líder Tomé:** Você segurou eles. Eu já ia pegar o forcado. Mas a minha pedra fica no ginásio, e lá é onde eu quero você amanhã.
- *Depois:* só conta a história

### `j01_tome_ginasio`
*Gatilho:* falar `tome` (exige nh.ebanoCampina, sem badges.campina)
- **Líder Tomé:** Você veio pelo caminho certo, e chegou com a cara de quem pensa que já ganhou. Eu gosto disso.
- **Líder Tomé:** Quarenta anos de colheita me ensinaram uma coisa: a gente planta devagar e colhe rápido. Vamos ver a sua colheita.
- **Ravi:** Não vou pegar leve, Tomé. Prometi à Lili que voltava com a pedra no bolso.
- **Líder Tomé:** Ótimo! Então prepare o seu melhor pão. Eu já estou com o meu pronto.
- *Batalha* `leader_tome`: Líder Tomé, prêmio ₽1400.
  - Equipe: Patrat Nv 12 (Investida, Chicote de Cauda, Ataque Rápido); Lillipup Nv 13 (Investida, Olhar Malicioso, Mordida); Skitty Nv 14 (Pancadinha, Enrolar-se, Ataque Rápido)

### `j01_tome_insignia`
*Gatilho:* vencer `leader_tome`
- **Líder Tomé:** Olha só! A Insígnia Espiga é sua. Ela lembra que, para crescer, a gente precisa de paciência e de chuva.
- *{jogador} recebeu a Insígnia Espiga!*
- **Líder Tomé:** Escuta, vou falar sério. A pedra da cidade é a última coisa que eu guardo para mim. Eu não consigo ficar de olho nela sozinho.
- **Líder Tomé:** Cuida dela com a mesma atenção que você cuidou dessa insígnia. Quando a Crepúsculo voltar, e vai voltar, eu conto com você.
- **Líder Tomé:** A Rota 2 fica para o oeste, depois do lamaçal. Com um Pokémon que tenha patas fortes você passa sem se afundar.
- *Depois:* insígnia **Insígnia Espiga** · flags `nh.pedraCampina=true`
- *Objetivo no painel:* Siga pela Rota 2 (lamaçal) até a Vila Sussurro, ao norte → `vila_sussurro`

### `j01_boletim1`
*Gatilho:* a flag `badges.campina` virar verdadeira (sem nh.boletim.1)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e doze minutos. Sete minutos depois do esperado.
- **Mãe:** Ravi, ouviu? Seis e doze. Você já ganhou uma insígnia e o sol atrasou mais um pouco. Coincidência, não acha?
- **Ravi:** Mãe, eu não acredito em coincidência. Mas ainda não sei o que é.
- *Depois:* flags `nh.boletim.1=true`, `nh.sol=6h12` · só conta a história

## 02 · Sussurros no bosque
*Jornada `sussurro` · boletim do sol no fim: 6h19 · arquivo `src/story/jornada/02-sussurro.js`*

### `j02_chegada`
*Gatilho:* entrar `vila_sussurro` (exige badges.campina, sem nh.chegouSussurro)
- *Vila Sussurro: casas entre as raízes dos jequitibás, passarelas de corda e lanternas de vaga-lume nos galhos.*
- *Você veio para a Insígnia Casulo. A Lia é a líder, mas o motivo de você estar aqui está escrito no mapa: a pedra da Lia fica na estufa.*
- **Líder Lia:** Cuidado com a passarela! Tem um Wurmple atravessando. Ele está nisso desde ontem.
- **Líder Lia:** Eu sou a Lia, pesquisadora, bióloga e babá de lagarta. Também sou a líder do ginásio. Ouvi falar de você: o Tomé me mandou um bilhete.
- **Líder Lia:** Tem gente de capa roxa rondando minha estufa. Eles perguntaram da "pedra da Lia". Pedra! Como se eu fosse uma pedreira!
- **Ravi:** Então eu vou ver a estufa. Mas antes me diz: você sabe quem são esses sujeitos de capa roxa?
- *Depois:* flags `nh.chegouSussurro=true`
- *Objetivo no painel:* Entre no Bosque Sussurrante, a oeste, e descubra quem está rondando a estufa → `bosque_sussurrante`

### `j02_recrutas`
*Gatilho:* pisar `trilha_jequitiba` (exige nh.chegouSussurro, sem nh.ouviuRecrutas)
- *Atrás de um jequitibá, duas pessoas de capa roxa cochicham. A capa de um deles tem uma lua minguante bordada.*
- **Recruta Crepúsculo:** A pedra da Lia fica na estufa. Hoje à noite, quando a vila dormir.
- **Recruta Crepúsculo:** E se o tal Absol aparecer de novo? Ele me olhou ontem. Me olhou com julgamento.
- **Recruta Crepúsculo:** Absol não morde. Só avisa. E a gente já sabe o aviso. Vamos.
- *Eles somem entre as árvores. Você corre de volta para a vila.*
- *Depois:* flags `nh.ouviuRecrutas=true`
- *Objetivo no painel:* Avise a Lia na Vila Sussurro: a estufa será roubada hoje à noite → `vila_sussurro`

### `j02_sina_trilha`
*Gatilho:* pisar `bifurcacao` (exige nh.ouviuRecrutas, sem nh.seguiuAbsol)
- *O vento para. As folhas param de sussurrar. Na trilha da esquerda, um Absol branco espera, olhando para você.*
- **Absol:** …
- *Ele dá alguns passos para dentro do mato e olha para trás. Ele quer que você o siga.*
- **Ravi:** Ele não é selvagem. Parece que sabe exatamente onde está o perigo.
- *Depois:* flags `nh.seguiuAbsol=true`
- *Objetivo no painel:* Siga o Absol até a gruta de musgo (Toca do Absol), ao norte → `toca_absol`

### `j02_toca_entrada`
*Gatilho:* entrar `toca_absol` (exige nh.seguiuAbsol, sem nh.tocaEntrou)
- *Uma gruta coberta de musgo. Nas paredes, veios de cristal brilham com a mesma luz morna do chaveiro da Aurora.*
- *Só que aqui a luz pulsa. Devagar. Como se respirasse.*
- *Lá do fundo vem um barulho de teia rasgando.*
- **Ravi:** Esse barulho não é normal. Eu vou até o fundo.
- **Absol:** Absol.
- *Depois:* flags `nh.tocaEntrou=true`
- *Objetivo no painel:* Vá até o fundo da Toca do Absol → `toca_absol`

### `j02_ariados_alfa`
*Gatilho:* pisar `toca_absol` (exige nh.tocaEntrou, sem nh.ariadosVencido)
- *No fundo, um Ariados enorme se debate entre as teias. Os olhos estão vermelhos. Ele não parece bravo, parece assustado.*
- **Absol:** Absol.
- *O cristal atrás dele pulsa mais forte a cada vez que ele se mexe. O Absol se põe entre você e o Ariados.*
- *Batalha* `alfa_ariados`: Ariados Alfa, Pokémon Alfa. Se perder, volta a esta cena.
  - Equipe: Ariados Nv 20 (Ferrão Venenoso, Sombra Noturna, Fio de Seda, Picada)
- *Depois:* flags `nh.ariadosVencido=true`

### `j02_ariados_depois`
*Gatilho:* vencer `alfa_ariados`
- *O Ariados se encolhe. O vermelho dos olhos vai sumindo até virar um amarelo cansado. Ele foge pela fresta do teto.*
- *O Absol encosta o chifre num veio de cristal. A luz treme. Depois ele olha para você por um bom tempo, e some no mato.*
- **Ravi:** As árvores daqui estão mesmo morrendo perto dessa luz? Eu preciso contar isso para a Lia.
- **Pokédex:** Bzzz… Registro novo: veio de cristal luminoso. A luz não é igual à de nenhuma pedra conhecida.
- *Depois:* flags `nh.viuCristal=true`
- *Objetivo no painel:* Leve o que viu da gruta de volta à Lia, na Vila Sussurro → `vila_sussurro`

### `j02_estufa_noite`
*Gatilho:* entrar `estufa_lia` (só de noite; exige nh.ouviuRecrutas, sem nh.defendeuEstufa)
- *A estufa está escura. Dois vultos de capa roxa abrem o cofre de vidro onde a Lia guarda o fragmento.*
- **Recruta Crepúsculo:** Pronto, peguei. Que pedra mais sem graça, parece pedaço de telha.
- **Recruta Crepúsculo:** Ih. Tem um moleque olhando pra gente.
- **Recruta Crepúsculo:** Moleque, a Equipe Crepúsculo não tem nada contra você. A gente só quer guardar a noite. Sai da frente.
- **Ravi:** Guardar a noite? Isso aí é da Lia.
- **Recruta Crepúsculo:** Então vem pegar!
- *Batalha* `c2_recruta`: Recruta Crepúsculo, prêmio ₽500. Se perder, volta a esta cena.
  - Equipe: Zubat Nv 17 (Sanguessuga, Supersônico, Assustar); Murkrow Nv 17 (Bicada, Assustar, Perseguição)

### `j02_estufa_fim`
*Gatilho:* vencer `c2_recruta`
- **Recruta Crepúsculo:** Deixa comigo! Houndour, morde a canela dele! Com carinho, que ele é criança!
- **Recruta Crepúsculo:** Agora você me deixou sem graça. Vou dar o troco na Lia!
- **Ravi:** Então vem. Aqui a gente não precisa de capa roxa para proteger o que é da Lia.
- *Batalha* `c2_recruta2`: Recruta Crepúsculo, prêmio ₽500. Se perder, volta a esta cena.
  - Equipe: Houndour Nv 17 (Brasa, Olhar Malicioso, Mordida); Gastly Nv 18 (Lambida, Hipnose)

### `j02_estufa_vespera`
*Gatilho:* vencer `c2_recruta2`
- **Recruta Crepúsculo:** Tá bom! Fica com a telha! Mas escuta: a gente não é o problema. O problema está brilhando no seu bolso.
- *Os recrutas fogem pela janela. Na copa de uma árvore lá fora, uma mulher de casaco longo observa a cena. Um Absol está ao lado dela.*
- **Dra. Véspera:** Bom trabalho, menino. A Lia tem sorte de ter alguém que se importa com a pedra. Espero que a sorte dure.
- **Dra. Véspera:** Mas a luz do bosque não espera ninguém. Pergunte à Lia o que ela viu nas raízes.
- *Ela some entre os galhos. Só a voz fica.*
- *Depois:* flags `nh.defendeuEstufa=true`, `nh.viuVespera=true`
- *Objetivo no painel:* Vença os aprendizes Nando e Bel e desafie a Líder Lia na Estufa-Teia → `lia` (treinadores: g2_nando, g2_bel)

### `j02_nando`
*Gatilho:* avistar `g2_nando`
- **Aprendiz:** Pisou no fio prateado? Não? Então ainda dá pra me enfrentar! Fio dourado é seguro, fio prateado é encrenca.
- *Batalha* `g2_nando`: Caçador Nando, prêmio ₽520.
  - Equipe: Scatterbug Nv 16 (Investida, Fio de Seda, Esforço de Inseto); Kricketot Nv 17 (Rosnado, Aguentar, Cortador de Fúria)

### `j02_bel`
*Gatilho:* avistar `g2_bel`
- **Aprendiz:** Os casulos apontam para a próxima folha. Eu não devia ter falado isso. Agora vou ter que te vencer pra compensar!
- *Batalha* `g2_bel`: Caçadora Bel, prêmio ₽560.
  - Equipe: Joltik Nv 17 (Fio de Seda, Absorver, Choque do Trovão); Combee Nv 18 (Lufada de Vento, Picada, Aroma Doce)

### `j02_rival2`
*Gatilho:* entrar `vila_sussurro` (exige nh.defendeuEstufa, sem nh.rival2)
- **Téo:** Ei! Você está na minha frente de novo. Eu passei a semana toda ouvindo que você tem sorte.
- **Ravi:** Sorte não ganha ginásio, Téo.
- **Téo:** Então vamos ver o que ganha. Meu {rival_inicial} está pronto desde o laboratório!
- *Batalha* `nh_rival2`: Rival Téo, prêmio ₽1800. Se perder, a história segue.
  - Equipe: Staravia Nv 14 (Ataque de Asa, Ataque Rápido, Reflexo); Growlithe Nv 14 (Brasa, Mordida, Rugido); Eevee Nv 15 (Ataque Rápido, Mordida, Ataque de Areia); rival:2
- *Depois:* flags `nh.rival2=true`

### `j02_lia_ginasio`
*Gatilho:* falar `lia` (exige nh.defendeuEstufa, exige trainers.g2_nando, exige trainers.g2_bel, sem badges.sussurro)
- **Líder Lia:** Chegou ao centro da teia! Pouca gente chega sem ser puxada de volta pelo Spinarak. Ele está meio decepcionado.
- **Líder Lia:** Inseto é pequeno, é quieto, é fácil de ignorar. E é por isso que ganha. Vamos lá!
- **Ravi:** Eu estou pronto, Lia. Mas antes me diz: a sua estufa sempre foi assim, tão escura?
- **Líder Lia:** Não. Antes de a Aurora pedir o cristal, a estufa tinha sol de manhã. Agora tem só essa penumbra.
- *Batalha* `leader_lia`: Líder Lia, prêmio ₽1800.
  - Equipe: Combee Nv 17 (Picada, Lufada de Vento, Aroma Doce); Spinarak Nv 18 (Fio de Seda, Ferrão Venenoso, Absorver, Sombra Noturna); Venonat Nv 18 (Confusão, Pó Venenoso, Supersônico); Scyther Nv 19 (Ataque Rápido, Cortador de Fúria, Olhar Malicioso, Ataque de Asa)

### `j02_lia_insignia`
*Gatilho:* vencer `leader_lia`
- **Líder Lia:** Você foi rápido como um Yanma! A Insígnia Casulo é sua. Ela lembra que toda mudança começa quietinha, por dentro.
- *{jogador} recebeu a Insígnia Casulo!*
- **Líder Lia:** E esta MT: Picada. Pega o Pokémon desprevenido e ainda come a fruta dele. Grosseiro, mas eficiente.
- **Líder Lia:** Você viu a gruta. Eu sabia que o bosque estava doente perto daqueles veios. As árvores com raiz em cima deles estão secando.
- **Líder Lia:** A Aurora diz que a luzita é limpa. Mas o bosque não concorda, e eu confio mais no bosque. Vai até a Rota 3, perto de Porto Espelho. Lá a gente conversa de novo.
- *Depois:* insígnia **Insígnia Casulo** · MT `bugBite` · flags `nh.luzitaSussurro=true`
- *Objetivo no painel:* Siga pela Rota 3 (ponte reconstruída) até Porto Espelho, a leste → `porto_espelho`

### `j02_bia_luz`
*Gatilho:* depois da cena `j02_lia_insignia`
- **Bia:** {jogador}! É a Bia! Analisei o registro do cristal da gruta. A luz dele não brilha, ela vaza. Como se viesse de outro lugar.
- **Bia:** Nenhuma pedra que eu conheço faz isso. O Professor ficou branco quando eu contei. Disse "deve ser nada" e foi tomar banho.
- **Bia:** Ele nunca toma banho por tanto tempo. Fica de olho nele e me avisa se alguém perguntar da luzita.
- **Ravi:** Então ela não é só luz. É algo que vem de fora da terra.
- **Bia:** Isso mesmo. Eu vou tentar descobrir de onde.
- *Depois:* só conta a história

### `j02_boletim2`
*Gatilho:* a flag `badges.sussurro` virar verdadeira (sem nh.boletim.2)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e dezenove minutos. O atraso já passa de quinze minutos desde o começo da semana.
- **Mãe:** Ravi, seis e dezenove. Você está ganhando insígnias, e o sol está ficando mais preguiçoso. Isso não é normal.
- **Ravi:** Então o sol atrasa desde a primeira vitória. Foi isso que eu vi no Sussurro.
- *Depois:* flags `nh.boletim.2=true`, `nh.sol=6h19` · só conta a história

### `j02_sq_pipoca_inicio`
*Gatilho:* falar `tito` (sem nh.sqPipoca)
- **Tito:** O Pipoca sumiu! Ele é um Skwovet e foi buscar noz no bosque e não voltou. Ele sempre volta. Sempre.
- **Tito:** Se você achar ele, fala que eu não tô bravo. Só um pouquinho.
- **Ravi:** Acho que vi um Skwovet correndo para a mata. Pode ser ele?
- **Tito:** Pode, sim! Ele adora a mata de jequitibá. Se achar, traga de volta com cuidado.
- *Depois:* flags `nh.sqPipoca=true` · só conta a história
- *Missão secundária (diário):* Procure o Pipoca, o Skwovet do Tito, na Mata dos Jequitibás, no bosque → `mata_jequitibas`

### `j02_sq_pipoca_achado`
*Gatilho:* pisar `mata_jequitibas` (exige nh.sqPipoca, sem nh.achouPipoca)
- *Entre as raízes de um jequitibá, um Skwovet roliço segura uma noz quase do tamanho dele. Ele vira a cabeça e reconhece a cara de quem o procura.*
- *Ele tem uma coleira de barbante com um pequeno sino. Está faltando um pedaço. Parece que alguém tentou puxar o pelo dele, lá na estufa.*
- **Ravi:** Vem comigo, Pipoca. O Tito está preocupado.
- *O Skwovet ouve o seu nome e para de roer a noz. Ele dá dois passos na sua direção, desconfiado.*
- *Depois:* flags `nh.achouPipoca=true` · só conta a história
- *Missão secundária (diário):* Leve o Pipoca de volta ao Tito, na Vila Sussurro → `vila_sussurro`

### `j02_sq_pipoca_fim`
*Gatilho:* falar `tito` (exige nh.achouPipoca, sem nh.sqPipocaFim)
- **Tito:** Pipoca! Seu maluco! Eu não estava bravo. Eu estava só um pouquinho bravo, mas agora passou.
- **Tito:** Tome, leve esta noz de ouro. Ela é a melhor noz da vila. Guardo desde que nasci. Não conta pra minha mãe.
- *O Pipoca sobe no ombro do Tito e começa a roer a orelha dele. Os dois estão felizes.*
- **Ravi:** Ele fez um bom trabalho. Mas agora eu quero saber se o Tito sabe mesmo guardar segredo.
- *Depois:* itens 1× rareCandy · flags `nh.sqPipocaFim=true` · só conta a história

## 03 · O espelho partido
*Jornada `espelho` · boletim do sol no fim: 6h27 · arquivo `src/story/jornada/03-espelho.js`*

### `j03_chegada`
*Gatilho:* entrar `porto_espelho` (exige badges.sussurro, sem nh.chegouEspelho)
- *Porto Espelho: um píer comprido, barcos encostados e um lago tão calmo que parece uma lâmina.*
- *Para continuar, você precisa de uma insígnia que deixe usar a água. A Líder Marina tem a Insígnia Gota e fica no Galpão de Barcos.*
- **Tia Jandira:** A moqueca hoje está de lamber os dedos. A Marina está no galpão, no fim do píer. Mas cuidado: ontem estranharam uns barcos sem dono.
- **Ravi:** Barcos sem dono? Quem faria isso?
- **Tia Jandira:** Gente de capa roxa, que chega de madrugada e não fala com ninguém. Eles estão rondando o galpão desde cedo.
- *Depois:* flags `nh.chegouEspelho=true`
- *Objetivo no painel:* Vá ao Galpão de Barcos, no fim do píer, e veja o que a Crepúsculo quer ali → `galpao_barcos`

### `j03_galpao_ataque`
*Gatilho:* entrar `galpao_barcos` (exige nh.chegouEspelho, sem nh.ebanoEspelho)
- *Dentro do galpão, a Marina está de costas para a porta, com um Pokémon de água na frente. Dois recrutas tentam abrir a caixa de ferramentas onde ela guarda uma pedra.*
- **Líder Marina:** Ei! Essa caixa é do ginásio, e a pedra também. Saiam daqui!
- **Admin Ébano:** Admin Ébano, da Equipe Crepúsculo. A Dra. Véspera quer a pedra longe de quem a vende. Fique fora disso, Líder.
- **Líder Marina:** Quem vende é você. Essas tábuas de barco contam a história toda: vocês chegam de noite, e o sol atrasa no dia seguinte.
- **Admin Ébano:** Chega de conversa. Pokémon, para fora!
- *Batalha* `c3_ebano`: Admin Ébano, prêmio ₽1500. Se perder, a história segue.
  - Equipe: Zubat Nv 12 (Mordida, Supersônico, Ataque de Asa); Houndour Nv 13 (Brasa, Mordida, Rugido); Sableye Nv 14 (Golpes de Fúria, Assustar, Detectar)
- *Depois:* flags `nh.ebanoEspelho=true`

### `j03_vespera_pier`
*Gatilho:* vencer `c3_ebano`
- *Quando o Ébano recua, uma mulher de casaco longo aparece na ponta do píer. Ela não tem Pokémon à vista, só um Absol sentado a seus pés.*
- **Dra. Véspera:** Você venceu o meu homem. Isso é raro. Quase tão raro quanto a sua pontualidade.
- **Ravi:** Você é a Dra. Véspera. A Crepúsculo quer as oito pedras para quê?
- **Dra. Véspera:** Para que a noite não acabe, menino. A luz de hoje é só uma moeda: ela compra o amanhecer de quem tem dinheiro.
- **Dra. Véspera:** Vá à Líder Marina e depois siga para o mar, se ainda tiver coragem. A água também tem segredos.
- *Depois:* flags `nh.viuVesperaPier=true`
- *Objetivo no painel:* Vença os aprendizes Zeca e Tainá e desafie a Líder Marina no Galpão de Barcos → `marina` (treinadores: g3_zeca, g3_taina)

### `j03_zeca`
*Gatilho:* avistar `g3_zeca`
- **Aprendiz:** A Marina usa o Basculin no fim. Ele morde forte e nada mais rápido ainda.
- *Batalha* `g3_zeca`: Pescador Zeca, prêmio ₽700.
  - Equipe: Magikarp Nv 10 (Splash, Investida, Esperneio); Barboach Nv 11 (Tapa de Lama, Revólver d'Água, Amnésia)

### `j03_taina`
*Gatilho:* avistar `g3_taina`
- **Aprendiz:** Quer chegar na Marina? Primeiro aprende a ficar molhado!
- *Batalha* `g3_taina`: Nadadora Tainá, prêmio ₽740.
  - Equipe: Wingull Nv 11 (Revólver d'Água, Ataque de Asa, Supersônico); Marill Nv 12 (Bolha, Rolagem, Enrolar-se)

### `j03_marina_ginasio`
*Gatilho:* falar `marina` (exige trainers.g3_zeca, exige trainers.g3_taina, exige nh.viuVesperaPier, sem badges.espelho)
- **Líder Marina:** Você chegou ao fundo do galpão. Pouca gente chega sem ficar molhado. Os meus Pokémon estão bem treinados.
- **Líder Marina:** Água não tem forma. Ela pega o formato de quem a segura. Vamos ver se você sabe segurar.
- **Ravi:** Então eu não vou ficar molhado à toa. Vamos ver quem nada melhor.
- **Líder Marina:** Esse é o espírito! Pode começar com o Basculin, que ele já está ansioso.
- *Batalha* `leader_marina`: Líder Marina, prêmio ₽2200.
  - Equipe: Psyduck Nv 20 (Revólver d'Água, Confusão, Arranhão); Buizel Nv 21 (Jato Aquático, Ataque Rápido, Revólver d'Água); Basculin Nv 22 (Jato Aquático, Mordida, Pulso d'Água, Cabeçada); Staryu Nv 23 (Jato de Bolhas, Escaldar, Recuperação); Mantine Nv 24 (Jato de Bolhas, Cachoeira, Recuperação)

### `j03_marina_insignia`
*Gatilho:* vencer `leader_marina`
- **Líder Marina:** Pronto, a Insígnia Gota é sua. Ela deixa usar a água fora da batalha, com um Pokémon que saiba nadar.
- *{jogador} recebeu a Insígnia Gota!*
- **Líder Marina:** Água ensina a esperar a maré, e a não ter pressa. Agora você pode atravessar o lago.
- **Líder Marina:** A Crepúsculo voltou aqui por causa das tábuas do galpão. Elas guardam um mapa de todas as cargas que saíram daqui este ano. Vá ver o Seu Nestor, ele tem um sino de vento que vê mais que eu.
- *Depois:* insígnia **Insígnia Gota** · montaria `lapras` · flags `nh.nadar=true`
- *Objetivo no painel:* Pegue a Rota 4, na água, e siga para a Cidade Coral, a leste → `cidade_coral`

### `j03_sq_garrafa_inicio`
*Gatilho:* falar `nestor` (sem nh.sqGarrafa)
- **Seu Nestor:** Cada garrafa tem uma história. Essa aqui só tem areia. Mas é uma areia muito bonita.
- **Seu Nestor:** Eu jogo uma garrafa no mar desde o ano em que a Aurora chegou. Uma delas voltou com um bilhete de um mineiro. Você pode achar a outra no manguezal?
- **Ravi:** Uma garrafa no manguezal? Isso parece coisa de pescador com saudade.
- **Seu Nestor:** É saudade, sim, e também de quem não sabe quem chega do mar. Vai lá, filho.
- *Depois:* flags `nh.sqGarrafa=true` · só conta a história
- *Missão secundária (diário):* Ache a garrafa do Seu Nestor no manguezal, a oeste do porto → `manguezal`

### `j03_sq_garrafa_achada`
*Gatilho:* pisar `manguezal` (exige nh.sqGarrafa, sem nh.achouGarrafa)
- *Entre as raízes dos mangues, uma garrafa verde está presa numa rede de pesca. Dentro, um papel enrolado, molhado e pálido.*
- *A letra é torta, de quem escreve no escuro: "Estamos no nível 4. A luz daqui não é limpa, é a mesma que sai dos nossos cabos. Heitor."*
- **Ravi:** Heitor. Esse é o nome do pai do Téo. O Téo disse que ele trabalha na Mina Aurora.
- *O papel está úmido, e a tinta escorre nas bordas. Você guarda o bilhete no bolso com cuidado.*
- *Depois:* flags `nh.achouGarrafa=true` · só conta a história
- *Missão secundária (diário):* Leve o bilhete ao Seu Nestor, no porto de Porto Espelho → `nestor`

### `j03_sq_garrafa_fim`
*Gatilho:* falar `nestor` (exige nh.achouGarrafa, sem nh.sqGarrafaFim)
- **Seu Nestor:** Heitor! Esse nome eu conheço. O menino da Aurora que cantava no barco quando era pequeno. Ele é pai do Téo, não é?
- **Seu Nestor:** Se ele escreveu isso, não é coisa de quem está doente. É coisa de quem está preso lá embaixo. Leve o papel ao Téo, antes que a Aurora o encontre.
- **Ravi:** Eu levo. E eu vou descer até lá.
- *O Seu Nestor guarda o bilhete numa caixa de madeira, junto com as outras garrafas. Parece um pequeno museu do mar.*
- *Depois:* flags `nh.sqGarrafaFim=true`, `nh.bilheteHeitor=true` · só conta a história

### `j03_boletim3`
*Gatilho:* a flag `badges.espelho` virar verdadeira (sem nh.boletim.3)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e vinte e sete minutos. Os pescadores do porto dizem que o lago está mais escuro de manhã.
- **Mãe:** Ravi, seis e vinte e sete. O Capitão Ivo disse que nunca viu o sol tão preguiçoso. Ele mandou um abraço, aliás.
- **Ravi:** Mãe, eu vou ver o lago de manhã. Se o sol atrasar mais, eu conto.
- *Depois:* flags `nh.boletim.3=true`, `nh.sol=6h27` · só conta a história

## 04 · Faísca na Costa Coral
*Jornada `coral` · boletim do sol no fim: 6h34 · arquivo `src/story/jornada/04-coral.js`*

### `j04_chegada`
*Gatilho:* entrar `cidade_coral` (exige nh.nadar, sem nh.chegouCoral)
- *Cidade Coral: um farol enorme na ponta do morro, feira de conchas e um calçadão cheio de turistas.*
- *O Líder Jonas cuida do farol e da insígnia Faísca. Mas as luzes do farol estão apagadas há dois dias, e ninguém sabe dizer por quê.*
- **Ravi:** Antes de falar com o Jonas, preciso ver o que está acontecendo no farol.
- **Ravi:** Um farol apagado e um líder que não quer falar. Isso não cheira bem.
- *Você desce do barco no cais e sente o vento salgado no rosto. A cidade inteira parece estar esperando alguma coisa.*
- *Depois:* flags `nh.chegouCoral=true`
- *Objetivo no painel:* Suba ao Farol Coral, na ponta do morro, e veja o que aconteceu com as luzes → `farol_entrada`

### `j04_inauguracao`
*Gatilho:* entrar `praca_coral` (exige nh.chegouCoral, sem nh.viuSolano)
- *Uma faixa dourada atravessa a praça: "Companhia Aurora. A luz que Alvorada merece."*
- **Augusto Solano:** Amigos de Cidade Coral! Hoje, com a luzita limpa, nenhuma casa desta costa vai depender do sol para acender a noite.
- **Augusto Solano:** O sol, meus amigos, é um vizinho que chega atrasado. A Aurora cuida da luz de vocês em todas as horas.
- **Iracema:** Trinta anos cuidando daquela luz no farol. Agora ela gira sozinha. E gira errado, Senhor Solano.
- **Augusto Solano:** Dona Iracema, a senhora é uma guardiã admirável. Mas guardiã de farol não entende de luz de cidade.
- *O Solano sorri, aperta a mão de algumas pessoas e entra num carro branco. Ninguém repara que a Iracema ficou olhando para o carro até ele sumir.*
- *Depois:* flags `nh.viuSolano=true`
- *Objetivo no painel:* Suba ao Farol Coral: a Iracema disse que o gerador está girando errado → `farol_entrada`

### `j04_farol_entrada`
*Gatilho:* entrar `farol_coral` (exige nh.viuSolano, sem nh.ebanoCoral)
- **Iracema:** Você veio! Olha, o gerador três foi trocado de noite. A peça nova não é do farol. É da Aurora.
- *No topo do farol, dois recrutas de capa roxa seguram a pedra do farol, uma pedra azul do tamanho de uma noz. Um deles tem a outra mão na alavanca dos geradores.*
- **Recruta Crepúsculo:** Tarde demais, velha. A pedra vai pro Relógio. Quando o sol parar de nascer, todo mundo vai entender por quê.
- **Admin Ébano:** Admin Ébano. Se você está aqui, então ouviu o rádio. A Dra. Véspera quer as pedras longe da Aurora. Você não vai entender enquanto não ver o que ela vê.
- **Ravi:** Eu vejo a Aurora trocando geradores em cima de um farol. Esta é a sua explicação?
- **Admin Ébano:** Então vem pegar a pedra!
- *Batalha* `c4_ebano`: Admin Ébano, prêmio ₽1300. Se perder, volta a esta cena.
  - Equipe: Murkrow Nv 13 (Bicada, Assustar, Perseguição); Zubat Nv 14 (Sanguessuga, Supersônico, Assustar)
- *Depois:* flags `nh.ebanoCoral=true`

### `j04_pedra_recuperada`
*Gatilho:* vencer `c4_ebano`
- *O Ébano recua. Ao cair, a pedra do farol rola pela escada, e a Iracema a segura com as duas mãos antes que ela caia no mar.*
- **Iracema:** Pronto. Está comigo de novo. O gerador, porém, continua girando sozinho. Quem mexeu nele foi a Aurora, não a Crepúsculo.
- **Ravi:** Então a Crepúsculo e a Aurora estão do mesmo lado?
- **Iracema:** Não sei. Eu só sei que quem troca peça de farol à noite não é amigo de ninguém. Leve a pedra ao Jonas. Ele precisa saber.
- *Depois:* flags `nh.pedraCoral=true`
- *Objetivo no painel:* Leve a pedra do farol ao Líder Jonas, no ginásio da cidade → `jonas`

### `j04_saulo`
*Gatilho:* avistar `g4_saulo`
- **Aprendiz:** O Jonas usa um Lanturn no final. Ele nada e dá choque ao mesmo tempo. Golpe de Terra resolve, se você tiver.
- *Batalha* `g4_saulo`: Técnico Saulo, prêmio ₽900.
  - Equipe: Electabuzz Nv 22 (Choque do Trovão, Ataque Rápido, Olhar Malicioso); Magnemite Nv 23 (Choque do Trovão, Supersônico, Investida)

### `j04_duda`
*Gatilho:* avistar `g4_duda`
- **Aprendiz:** Lá em cima, os três geradores. A ordem? A Iracema sabe. Ela sabe tudo deste farol.
- *Batalha* `g4_duda`: Técnica Duda, prêmio ₽950.
  - Equipe: Electrike Nv 23 (Choque do Trovão, Mordida, Ataque Rápido); Ampharos Nv 24 (Raio Confuso, Relâmpago, Descarga)

### `j04_jonas_ginasio`
*Gatilho:* falar `jonas` (exige nh.pedraCoral, exige trainers.g4_saulo, exige trainers.g4_duda, sem badges.coral)
- **Líder Jonas:** Você trouxe a pedra de volta, e ainda passou pelos meus aprendizes. Ninguém faz isso sem levar um choque.
- **Líder Jonas:** Eu já ia pedir ajuda. Mas vamos batalhar primeiro. Eu sou eletricidade, e eletricidade não espera ninguém terminar de falar.
- **Ravi:** Eu trouxe a pedra. E trouxe também os recados da Iracema e do Solano.
- **Líder Jonas:** Então é melhor a gente batalhar primeiro. Não quero conversa sem eletricidade.
- *Batalha* `leader_jonas`: Líder Jonas, prêmio ₽2800.
  - Equipe: Electrike Nv 26 (Choque do Trovão, Mordida, Ataque Rápido); Electabuzz Nv 26 (Choque do Trovão, Ataque Rápido, Olhar Malicioso); Magnemite Nv 27 (Choque do Trovão, Supersônico, Investida); Ampharos Nv 28 (Relâmpago, Descarga, Raio Confuso)

### `j04_jonas_insignia`
*Gatilho:* vencer `leader_jonas`
- **Líder Jonas:** Pronto, a Insígnia Faísca é sua. Ela faz a sua equipe andar mais rápido e a cabeça mais esperta.
- *{jogador} recebeu a Insígnia Faísca!*
- **Líder Jonas:** Olha, vou falar uma coisa que eu nunca falei. A pedra do farol é a coisa mais importante da minha vida, e eu não consigo protegê-la sozinho.
- **Líder Jonas:** Se a Crepúsculo voltar, e a Aurora também, eu conto com você. As balsas para as Ilhas Jandaias saem do cais, a leste. Vai com cuidado na água.
- *Depois:* insígnia **Insígnia Faísca** · flags `nh.pedraCoral2=true`
- *Objetivo no painel:* Pegue a balsa no cais de Cidade Coral para as Ilhas Jandaias → `cais_coral`

### `j04_sq_diario_inicio`
*Gatilho:* falar `iracema` (exige nh.viuSolano, sem nh.sqDiario)
- **Iracema:** Eu escrevia tudo que acontecia no farol. Todo dia, desde que me contrataram. O diário está lá no quarto do topo, onde ficam os geradores.
- **Iracema:** Se a Aurora mexeu nas peças, o registro está lá. Eu não consigo subir mais aquela escada com estes joelhos.
- **Ravi:** Um diário de farol? Isso pode ser o que a Iracema estava escondendo.
- **Iracema:** Pode ser. Eu escrevi tudo por medo de esquecer. Agora é hora de lembrar.
- *Depois:* flags `nh.sqDiario=true` · só conta a história
- *Missão secundária (diário):* Encontre o diário da Iracema no quarto do topo do Farol Coral → `farol_topo`

### `j04_sq_diario_achado`
*Gatilho:* entrar `farol_topo` (exige nh.sqDiario, sem nh.diarioFarol)
- *No quarto dos geradores, um caderno de capa verde está preso debaixo de uma caixa de ferramentas. As páginas do fim são de outra letra.*
- *"Dia 3: o gerador três foi trocado por ordem da Companhia Aurora. Peça nova, sem número de série. Assinado: A. Solano."*
- *"Dia 14: a luz gira sozinha. Ela acende mais cedo lá embaixo e mais tarde aqui em cima. Não é o farol que está errado. É o sol."*
- **Ravi:** Então o Solano assinou o diário com as próprias mãos. Ele achou que ninguém leria.
- *Você fecha o caderno. Lá embaixo, o mar bate nas pedras do farol, e a luz do topo ainda gira fora de hora.*
- *Depois:* flags `nh.diarioFarol=true` · só conta a história
- *Missão secundária (diário):* Leve o diário da Iracema de volta a ela, no pé do farol → `farol_entrada`

### `j04_sq_diario_fim`
*Gatilho:* falar `iracema` (exige nh.diarioFarol, sem nh.sqDiarioFim)
- **Iracema:** Eu sabia. O Solano assinou o diário, e ninguém tem direito de assinar no farol da cidade. Agora é só a gente mostrar isso à Cidade Coral.
- **Iracema:** Tome, leve estas poções. São as últimas que eu tenho guardadas. Vai precisar delas no caminho.
- **Ravi:** Eu conto ao Jonas. Ele disse que quer ajudar, mesmo que não queira admitir.
- *A Iracema guarda o diário debaixo do braço e olha para o farol com um sorriso pequeno.*
- *Depois:* flags `nh.sqDiarioFim=true` · só conta a história

### `j04_boletim4`
*Gatilho:* a flag `badges.coral` virar verdadeira (sem nh.boletim.4)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e trinta e quatro minutos. O farol de Cidade Coral voltou a piscar, mas com atraso, segundo os marinheiros.
- **Mãe:** Ravi, seis e trinta e quatro. De manhã a casa fica escura por mais tempo. Anda, filho, volta logo.
- **Ravi:** Mãe, não sei quanto tempo mais essa história dura. Mas estou voltando para casa.
- *Depois:* flags `nh.boletim.4=true`, `nh.sol=6h34` · só conta a história

## 05 · As raízes das Jandaias
*Jornada `jandaias` · boletim do sol no fim: 6h34 · arquivo `src/story/jornada/05-jandaias.js`*

### `j05_chegada`
*Gatilho:* entrar `vila_jandaia` (exige nh.pedraCoral2, sem nh.chegouJandaia)
- *Vila Jandaia: casas de palha sobre estacas, pontes de cipó e um templo de raízes que cresce por cima da pedra.*
- *Ninguém aqui tem insígnia para mostrar. Mas a Monja Aruã do templo disse ao rádio que as raízes estão secando, e que a seiva está escurecendo.*
- **Ravi:** Raízes secando por causa de quê? Será a mesma luz que a Lia viu no bosque?
- *Uma criança aponta para o templo, do outro lado da lagoa: "Tem gente de capa roxa lá dentro desde ontem."*
- *Depois:* flags `nh.chegouJandaia=true`
- *Objetivo no painel:* Atravesse a lagoa até o Templo das Raízes e veja quem está lá dentro → `templo_raizes_porta`

### `j05_templo_ebano`
*Gatilho:* entrar `templo_raizes_porta` (exige nh.chegouJandaia, sem nh.ebanoTemplo)
- *Nas paredes do templo, raízes grossas se abrem como cortinas. No centro, uma raiz de cristal brilha com a mesma luz morna das pedras.*
- **Admin Ébano:** Admin Ébano. Esta raiz de cristal é a mesma luz do cadeado do Relógio. A Dra. Véspera precisa dela para fechar a noite.
- **Monja Aruã:** Afasta-te da raiz, forasteiro! Ela não é tua, nem dele.
- **Admin Ébano:** A monja tem razão, mas a monja não entende o que a raiz faz com a selva. Eu entendo. Por isso eu levo.
- **Ravi:** Você está destruindo o templo para uma luz que não é sua.
- **Admin Ébano:** Então me impede. Você é bom em impedir coisas, pelo que o Téo conta.
- *Batalha* `c5_ebano`: Admin Ébano, prêmio ₽2000. Se perder, volta a esta cena.
  - Equipe: Murkrow Nv 22 (Bicada, Assustar, Perseguição); Honchkrow Nv 23 (Talho Noturno, Pássaro Bravo, Golpe Baixo); Sableye Nv 23 (Garra Sombria, Jogo Sujo, Fogo-Fátuo)
- *Depois:* flags `nh.ebanoTemplo=true`

### `j05_templo_fim`
*Gatilho:* vencer `c5_ebano`
- **Admin Ébano:** Hm. A raiz fica com você, por enquanto. A Dra. Véspera disse que a Aurora vai cobrar, e a Aurora cobra caro.
- *O Ébano recua pelo túnel do templo. Atrás da raiz, uma fresta deixa ver um cabo de metal com uma etiqueta dourada: "Companhia Aurora. Luzita, linha 2."*
- **Monja Aruã:** Está vendo? A luz de vocês atravessa a terra da minha selva. Desde que o cabo chegou, as raízes secam por baixo.
- **Ravi:** Então a Aurora passou um cabo debaixo do templo. E a Crepúsculo tenta levar o que a Aurora deixou.
- **Monja Aruã:** Os dois querem a mesma coisa: a luz que não é deles. Vá embora daqui, e leve esta raiz de volta para a Lia, no bosque.
- *Depois:* flags `nh.cabosAurora=true`
- *Objetivo no painel:* Atravesse a Selva Grande em direção ao leste, onde o Téo está esperando → `selva_grande`

### `j05_rival3`
*Gatilho:* entrar `selva_grande` (exige nh.cabosAurora, sem nh.rival3)
- **Téo:** Você de novo! Achei que o templo ia te engolir. Pelo jeito a selva é que se cansou de você.
- **Ravi:** Téo, a Crepúsculo estava roubando a raiz da Aurora. Você sabe o que é isso?
- **Téo:** Eu sei que meu pai trabalha na Mina Aurora e que ele manda dinheiro todo mês. A Aurora é a única empresa que paga bem aqui em Alvorada.
- **Téo:** Se a Crepúsculo quer acabar com a luz da Aurora, ela quer acabar com o emprego do meu pai. Eu não vou deixar.
- **Ravi:** Então vamos lutar. Mas depois você vai ouvir o que eu vi no templo.
- *Batalha* `nh_rival3`: Rival Téo, prêmio ₽2600. Se perder, a história segue.
  - Equipe: Staravia Nv 23 (Ataque de Asa, Ataque Rápido, Ás Aéreo); Growlithe Nv 23 (Roda de Fogo, Mordida, Rugido); Eevee Nv 24 (Ataque Rápido, Mordida, Ataque Veloz); rival:2
- *Depois:* flags `nh.rival3=true`

### `j05_rival3_fim`
*Gatilho:* vencer `nh_rival3`
- **Téo:** Tá bom, você ganhou. Mas eu não estou convencido. Meu pai nunca mentiu para mim.
- **Ravi:** Eu não disse que ele mentiu. Eu disse que a Aurora cortou a selva para passar um cabo.
- **Téo:** Então me mostra a prova. Mas se eu ver que é mentira, eu vou ser o primeiro a te enfrentar de novo.
- *Depois:* flags `nh.teoDuvida=true`
- *Objetivo no painel:* Volte à Cidade Coral pela balsa e siga pela Rota 5 até a Vila Lamparina, a oeste → `vila_lamparina`

## 06 · A noite que não acaba
*Jornada `lamparina` · boletim do sol no fim: 6h42 · arquivo `src/story/jornada/06-lamparina.js`*

### `j06_chegada`
*Gatilho:* entrar `vila_lamparina` (exige nh.teoDuvida, sem nh.chegouLamparina)
- *Vila Lamparina: casas baixas com janelas de vidro colorido, lampiões acesos mesmo de dia e um cheiro de cera de vela.*
- *A Dona Zélia é a líder da cidade. Ela guarda o casarão com as velas e um ginásio em que a luz só entra quando a noite cai.*
- **Vó Benta:** Chegou! Come mais um pedaço. Aqui a gente janta cedo, porque a noite chega antes do sono.
- **Vó Benta:** Ouvi no rádio que tem gente de capa roxa rondando o casarão. Vá ver. Mas volte antes de dar meia-noite.
- **Ravi:** Vou ao casarão e volto antes da meia-noite. Prometo, Vó Benta.
- *Depois:* flags `nh.chegouLamparina=true`
- *Objetivo no painel:* Vá ao Casarão das Velas depois que escurecer e veja quem está rondando a Dona Zélia → `casarao_velas`

### `j06_casarao_ataque`
*Gatilho:* entrar `casarao_velas` (só de noite; exige nh.chegouLamparina, sem nh.ebanoLamparina)
- *Dentro do casarão, a Dona Zélia segura um candelabro. Dois recrutas tentam arrancar do teto a pedra que fica presa na lanterna do salão.*
- **Dona Zélia:** Saiam da minha casa! Essa pedra acende as velas da cidade há mais tempo do que vocês têm de vida.
- **Recruta Crepúsculo:** Não é pedra de vela, velha. É chave. E a chave vai para quem faz a noite durar.
- **Recruta Crepúsculo:** Pode trazer o treinador, Admin Ébano. Ele quer ver a cara dele.
- **Admin Ébano:** Admin Ébano. Vim buscar a pedra, Dona Zélia. E o garoto que sempre aparece no caminho.
- **Ravi:** Você está fazendo isso no escuro, Ébano. Pelo menos tenha coragem de dizer para quem.
- *Batalha* `c6_recruta`: Recruta Crepúsculo, prêmio ₽1100. Se perder, volta a esta cena.
  - Equipe: Murkrow Nv 24 (Bicada, Assustar, Perseguição); Zubat Nv 24 (Sanguessuga, Supersônico, Assustar)
- *Depois:* flags `nh.ebanoLamparina=true`

### `j06_casarao_fim`
*Gatilho:* vencer `c6_recruta`
- **Admin Ébano:** Você derrubou meus recrutas. Não me faça perder tempo com o resto. A Dra. Véspera vai te encontrar no cemitério.
- *O Ébano recua pela porta dos fundos. A pedra da lanterna continua no lugar, meio solta.*
- **Dona Zélia:** Você fica com a pedra, querido. Se eles voltarem, eu não tenho mais força para segurar a porta.
- *Depois:* flags `nh.casaraoEvento=true`
- *Objetivo no painel:* Siga para o Cemitério das Velas, a noroeste, e veja quem a Dra. Véspera está esperando → `cemiterio_velas`

### `j06_cemiterio_vespera`
*Gatilho:* entrar `cemiterio_velas` (exige nh.casaraoEvento, sem nh.viuVespera6)
- *O cemitério tem velas acesas em cada túmulo, mesmo sem vento. Ao lado de um laguinho escuro, uma mulher de casaco longo está sentada, com um Absol deitado a seus pés.*
- **Dra. Véspera:** Você tem o hábito de aparecer onde não é chamado. Isso é ótimo para quem quer roubar pedras. Péssimo para quem quer dormir.
- **Ravi:** Você é a Dra. Véspera. O que a Crepúsculo quer de verdade?
- **Dra. Véspera:** Quero que a noite fique do jeito que é, menino. A luz é uma dívida, e a dívida sempre cobra quem não sabe quem empresta.
- **Dra. Véspera:** Pergunte à Dona Zélia pela vela que ela guarda desde o ano passado. E pergunte a si mesmo por que o sol atrasa só para quem tem pressa.
- *O Absol levanta a cabeça, olha para você por um instante e volta a dormir. A Dra. Véspera se levanta e some entre as lápides.*
- *Depois:* flags `nh.viuVespera6=true`
- *Objetivo no painel:* Volte ao Casarão das Velas e pergunte à Dona Zélia sobre a vela que ela guarda → `casarao_velas`

### `j06_zelia_vela`
*Gatilho:* falar `zelia` (exige nh.viuVespera6, sem nh.velaEterna)
- **Dona Zélia:** Você perguntou pela vela, querido. Ela é a Vela Eterna. Ficou acesa na minha família desde antes da estrada de ferro.
- **Dona Zélia:** Um homem de terno branco veio aqui ontem, perguntou dela e foi embora sorrindo. Eu não gostei do sorriso dele.
- **Dona Zélia:** Você tem cara de quem sabe guardar uma coisa. Leve a vela e não deixe ninguém acender ela antes de eu mandar.
- *A Dona Zélia coloca uma vela de cera escura nas suas mãos. A chama é pequena, azulada, e não tremeu nem com o vento da porta.*
- **Ravi:** Uma vela que não treme com o vento. Isso não é cera comum.
- *Depois:* flags `nh.velaEterna=true`
- *Objetivo no painel:* Vença os médiuns Odete e Ciro e desafie a Dona Zélia no Casarão das Velas → `zelia` (treinadores: g5_odete, g5_ciro)

### `j06_odete`
*Gatilho:* avistar `g5_odete`
- **Aprendiz:** A Zélia usa Lampent no fim. Fogo e fantasma. Água e Sombrio são seus amigos.
- *Batalha* `g5_odete`: Médium Odete, prêmio ₽1100.
  - Equipe: Gastly Nv 27 (Lambida, Hipnose, Sombra Noturna); Haunter Nv 28 (Lambida, Hipnose, Maldição)

### `j06_ciro`
*Gatilho:* avistar `g5_ciro`
- **Aprendiz:** Gire os espelhos: a luz da lua acende as velas. A Dona Zélia adora uma charada.
- *Batalha* `g5_ciro`: Médium Ciro, prêmio ₽1150.
  - Equipe: Duskull Nv 27 (Sombra Furtiva, Fogo-Fátuo, Ataque Dissimulado); Chandelure Nv 28 (Lança-Chamas, Bola Sombria, Fogo-Fátuo)

### `j06_zelia_ginasio`
*Gatilho:* falar `zelia` (exige nh.velaEterna, exige trainers.g5_odete, exige trainers.g5_ciro, sem badges.lamparina)
- **Dona Zélia:** Você passou pelos meus médiuns. Eles são teimosos, como a vela, e como eu. Agora é a minha vez.
- **Dona Zélia:** Não vou perguntar se você está pronto. Eu já vi a sua cara de noite, e ela é de quem vai vencer.
- **Ravi:** Dona Zélia, antes de começar: a vela ainda está na minha mochila. Ela precisa ficar apagada?
- **Dona Zélia:** Está, querido. E não é hora de acender. Você vai precisar dela quando a noite for mais escura.
- *Batalha* `leader_zelia`: Dona Zélia, prêmio ₽3200.
  - Equipe: Lampent Nv 30 (Lança-Chamas, Bola Sombria, Fogo-Fátuo); Gengar Nv 31 (Bola Sombria, Hipnose, Maldição); Dusknoir Nv 32 (Soco Sombrio, Hipnose, Golpe Baixo); Chandelure Nv 32 (Lança-Chamas, Bola Sombria, Fogo-Fátuo)

### `j06_zelia_insignia`
*Gatilho:* vencer `leader_zelia`
- **Dona Zélia:** A Insígnia Vela é sua. Ela diz que a luz não precisa ser grande para ser teimosa. Só precisa ficar acesa.
- *{jogador} recebeu a Insígnia Vela!*
- **Dona Zélia:** Escuta com atenção: quem perguntou pela vela não foi a Crepúsculo. Foi um homem de branco, e ele já sabe onde ela está guardada.
- **Dona Zélia:** Guarde a vela e não a acenda. A Rota 6 segue pela ferrovia, a leste. Mas olhe para os trilhos antes de pisar: a Aurora colocou carrinhos novos neles.
- *Depois:* insígnia **Insígnia Vela** · flags `nh.velaGuardada=true`
- *Objetivo no painel:* Siga pela Rota 6 (ferrovia) até a Cidade Aurora, a leste → `cidade_aurora`

### `j06_boletim5`
*Gatilho:* a flag `badges.lamparina` virar verdadeira (sem nh.boletim.5)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e quarenta e dois minutos. Os moradores de Vila Lamparina dizem que a noite foi a mais longa da região.
- **Mãe:** Ravi, seis e quarenta e dois. Isso já é quase meia hora de atraso em cinco dias. Eu não gosto nada disso, filho.
- **Ravi:** Dona Zélia disse que a noite foi a mais longa da região. Eu acredito nela.
- *Depois:* flags `nh.boletim.5=true`, `nh.sol=6h42` · só conta a história

## 07 · O preço da luz
*Jornada `aurora` · boletim do sol no fim: 6h51 · arquivo `src/story/jornada/07-aurora.js`*

### `j07_chegada`
*Gatilho:* entrar `cidade_aurora` (exige badges.lamparina, sem nh.chegouAurora)
- *Cidade Aurora: torres de cristal, outdoors com a palavra "limpa" em letras douradas e um silêncio estranho, como se a cidade inteira prendesse a respiração.*
- *O sol mal aparece entre os prédios. Todo mundo aqui tem uma lanterna de luzita no bolso, acesa de dia.*
- **Pipa:** Você chegou! Eu sou a Pipa, repórter do Jornal Farol. Estou fazendo uma matéria sobre a Torre Aurora e preciso de alguém que não seja da empresa.
- **Pipa:** Vamos lá. O gerente Lúcio vai fazer uma visita guiada. Ele adora mostrar as tubulações, principalmente para quem não pergunta de onde vem a luz.
- **Ravi:** Uma repórter e um prédio de cristal. Não sei qual dos dois está mais disposto a me enganar.
- *Depois:* flags `nh.chegouAurora=true`
- *Objetivo no painel:* Vá à Torre Aurora, no centro da cidade, e acompanhe a visita guiada → `torre_aurora`

### `j07_torre_visita`
*Gatilho:* entrar `torre_aurora` (exige nh.chegouAurora, sem nh.visitaTorre)
- **Gerente Lúcio:** Bem-vindos à Torre Aurora! Aqui, cada lâmpada de Alvorada começa a sua vida. A luz limpa sai daqui, e não do céu.
- **Gerente Lúcio:** O cristal vem da nossa mina, nível quatro. Ele não queima, não fumaça, não depende do sol. A luzita é a energia do futuro.
- **Pipa:** E de onde vem o cristal, exatamente? O que a Aurora tira de baixo da terra?
- **Gerente Lúcio:** Da pedra, senhorita. Da pedra e da paciência. O sol atrasa, e nós apenas acendemos a luz que ele deixou para trás.
- *Quando o Lúcio fala do sol, uma parte das luzes da torre pisca. Ninguém parece notar, exceto você.*
- **Gerente Lúcio:** Agora, se me dão licença, o elevador de serviço é só para a equipe. Os visitantes ficam aqui.
- *Depois:* flags `nh.visitaTorre=true`
- *Objetivo no painel:* Passe pelo Gerente Lúcio, que bloqueia o elevador de serviço, e desça à Mina Aurora → `mina_aurora`

### `j07_lucio_bloqueia`
*Gatilho:* entrar `torre_aurora` (exige nh.visitaTorre, sem nh.lucioVencido)
- **Gerente Lúcio:** Área restrita! Ninguém desce ao nível quatro sem autorização. O protocolo, o protocolo!
- **Ravi:** Tem gente presa lá embaixo. Você ouviu a sirene.
- **Gerente Lúcio:** Eu ouvi o protocolo. Se quer descer, vai ter que passar pelos meus Pokémon. Eles são muito bem treinados.
- *Batalha* `c7_lucio`: Gerente Lúcio, prêmio ₽3400. Se perder, volta a esta cena.
  - Equipe: Magnezone Nv 33 (Canhão de Luz, Relâmpago, Bomba Magnética); Klinklang Nv 34 (Engrenagem Dupla, Relâmpago, Troca de Marcha); Glimmora Nv 34 (Gema de Poder, Bomba de Lodo, Rochas Furtivas)
- *Depois:* flags `nh.lucioVencido=true`

### `j07_sirene`
*Gatilho:* vencer `c7_lucio`
- *A sirene começa a tocar lá embaixo, e o chão da torre vibra. Um homem de capacete grita pelo rádio que o nível três desabou.*
- **Téo:** Meu pai está lá embaixo! Ele trabalha no nível quatro! Eu vou descer agora, com ou sem você!
- **Ravi:** Eu vou com você, Téo. Mas a Aurora não ia deixar ninguém descer sem autorização. Por que a sirene soou tão tarde?
- **Téo:** Não interessa. Vamos!
- *Depois:* flags `nh.sirene=true`, `nh.teoJunto=true`
- *Objetivo no painel:* Desça à Mina Aurora e encontre o Heitor, pai do Téo, no nível quatro → `mina_aurora`

### `j07_mina_entrada`
*Gatilho:* entrar `mina_aurora_n1` (exige nh.sirene, sem nh.minaEntrada)
- *O nível um da mina é quente e cheira a ferro. Trilhos de carrinho correm por toda parte, e as lâmpadas de luzita tremem nas paredes.*
- **Téo:** Por aqui! O elevador do nível três é o único caminho. Se ele estiver quebrado, vamos pela escada.
- *Um mineiro sai de um corredor lateral, sujo de pó, com a lanterna apagada. Ele aponta para baixo sem dizer nada.*
- *Depois:* flags `nh.minaEntrada=true`
- *Objetivo no painel:* Desça pelas escadas até o nível quatro, onde está o Heitor → `mina_aurora_n4`

### `j07_mina_medidor` · **REVIRAVOLTA 1**
*Gatilho:* entrar `mina_aurora_n4` (exige nh.minaEntrada, sem nh.reviravolta1)
- *No nível quatro, o desabamento prendeu três mineiros e uma mulher de casaco longo. Ela está encostada numa viga, com um Absol deitado a seus pés.*
- **Heitor:** Téo! Você veio! Eu disse que eles não iam tirar a gente daqui antes da cota do dia.
- **Téo:** Pai? Você está ferido? O que a Aurora fez com vocês?
- **Dra. Véspera:** Pergunte à sua empresa, menino. Ela tem um medidor bem aqui, pregado na parede, para ver quanta luz sai de cada tonelada de cristal.
- *Na parede do fundo, uma placa de metal dourada marca a produção da semana. Ao lado, um mostrador de ponteiros registra o horário em que o sol nasceu em Alvorada. A cada tonelada extraída, o ponteiro anda um pouco mais.*
- **Ravi:** O sol nasce mais tarde por causa do que vocês tiram daqui?
- **Dra. Véspera:** A luzita é a raiz do cadeado do Relógio. Cada tonelada tirada da mina solta um pouco mais do cadeado, e o sol demora mais para vencer a noite.
- **Dra. Véspera:** Eu roubava as pedras dos ginásios para tirá-las do alcance da Aurora. Não para deixar a noite durar. Para impedir que a Aurora chegasse até elas.
- **Téo:** Eu defendi essa empresa desde o começo. Ela pagou o salário do meu pai. Agora ela o deixa preso aqui em baixo, com uma sirene que demorou para tocar.
- **Heitor:** Eles mandaram a gente cavar mais rápido, Téo. Depois que o nível três desabou, o supervisor disse que a cota não podia parar.
- **Téo:** Então eu não sou mais da Aurora. A partir de agora, eu estou do lado de quem está tirando vocês daqui.
- *Depois:* flags `nh.reviravolta1=true`, `nh.teoLadoCerto=true`
- *Objetivo no painel:* Descoberta: a Companhia Aurora é quem atrasa o sol. Vá ao Forte Rochedo, ao sul da Rota 7, e procure as cartas antigas do Prof. Jatobá → `ninho_forte_rochedo`

### `j07_saida_mina`
*Gatilho:* depois da cena `j07_mina_medidor`
- *Na saída da mina, um homem de terno branco espera de braços cruzados, com um sorriso de quem já sabia o que ia acontecer.*
- **Augusto Solano:** Heitor, Téo. Vocês fizeram um bom trabalho em manter a produção. Agora voltem para a superfície e esqueçam essa conversa.
- **Téo:** Eu não vou esquecer nada, Senhor Solano. Eu vi o medidor. O sol nasce mais tarde por causa da Aurora.
- **Augusto Solano:** O sol nasce quando a luz permite, meu jovem. E a luz agora é nossa. Quem não entender isso vai aprender com o tempo.
- *O Solano dá as costas e sai pela porta da torre. A Pipa, do lado de fora, já está com a câmera apontada para o elevador.*
- *Depois:* flags `nh.viuSolanoMina=true` · só conta a história

### `j07_rota7_jairo`
*Gatilho:* avistar `r7_jairo`
- **Treinador:** Ei, você! Passou pela mina e ainda está de pé? Então merece uma luta de verdade!
- *Batalha* `r7_jairo`: Lutador Jairo, prêmio ₽1300.
  - Equipe: Machop Nv 30 (Golpe de Caratê, Chute Baixo, Olhar Malicioso); Makuhita Nv 31 (Empurrão, Golpe Surpresa, Desarmar)

### `j07_rota7_soraia`
*Gatilho:* avistar `r7_soraia`
- **Treinador:** A capoeira aqui é de graça, mas a luta é cobrada. Vamos!
- *Batalha* `r7_soraia`: Capoeirista Soraia, prêmio ₽1300.
  - Equipe: Timburr Nv 30 (Chute Baixo, Lançamento de Rocha, Fortalecer); Mienfoo Nv 31 (Palma de Força, Golpe Surpresa, Meia-Volta)

### `j07_arquivo`
*Gatilho:* entrar `ninho_forte_rochedo` (exige nh.reviravolta1, sem nh.arquivo)
- *O Forte Rochedo é uma construção de pedra antiga, com um arquivo no subsolo. Ninguém desce ali há anos, mas a porta está destrancada.*
- *Uma pasta de couro está marcada com "Luzita: estudos, 2010". Dentro, cartas escritas à mão por dois autores: o Prof. Jatobá e a Dra. Véspera.*
- *As cartas falam de um cristal que vaza luz, e de uma reunião com um homem chamado Augusto Solano, que queria comprar a amostra.*
- **Ravi:** Essas cartas são de 16 anos atrás. O professor participou disso desde o começo?
- *O cheiro de papel velho e de cera vem das prateleiras. Um rádio antigo está ligado num canto, sem som.*
- *Depois:* flags `nh.arquivo=true`
- *Objetivo no painel:* Espere o Prof. Jatobá ligar, ou procure-o no laboratório de Vila Alvorada → `lab`

### `j07_prof_telefone` · **REVIRAVOLTA 2**
*Gatilho:* depois da cena `j07_arquivo`
- **Prof. Jatobá:** Ravi? Eu estava esperando você ler as cartas. Eu deveria ter contado antes. Eu queria proteger você.
- **Prof. Jatobá:** Há dezesseis anos, eu e a Véspera descobrimos a luzita no Planalto. Eu levei a amostra para o Augusto Solano, achando que ele iria estudá-la. Ele comprou.
- **Ravi:** Então o senhor ajudou a criar a Aurora.
- **Prof. Jatobá:** Ajudei. A primeira extração, a Noite Longa de Lamparina, saiu da minha amostra. Eu não sabia que o cristal era a raiz do cadeado.
- **Prof. Jatobá:** Depois que eu soube, já era tarde. A Véspera saiu da empresa e passou a tirar as pedras das mãos da Aurora. Eu fiquei calado.
- **Ravi:** Professor, eu não vou fingir que isso não aconteceu. Mas agora eu preciso de você para chegar até o Relógio.
- *Depois:* flags `nh.reviravolta2=true`
- *Objetivo no painel:* Descoberta: o Prof. Jatobá ajudou a criar a Aurora. Vá à Roda de Capoeira, no Forte Rochedo, e desafie o Líder Brás → `ninho_forte_rochedo`

### `j07_dandara`
*Gatilho:* avistar `g6_dandara`
- **Aprendiz:** Na capoeira, luta é conversa. A gente pergunta com o pé e responde com a esquiva.
- *Batalha* `g6_dandara`: Faixa-preta Dandara, prêmio ₽1400.
  - Equipe: Meditite Nv 29 (Meditar, Palma de Força, Confusão); Mienfoo Nv 30 (Palma de Força, Meia-Volta, Golpe Surpresa)

### `j07_tiao`
*Gatilho:* avistar `g6_tiao`
- **Aprendiz:** Quer chegar no Brás? Primeiro você precisa aprender a dançar com o berimbau.
- *Batalha* `g6_tiao`: Faixa-preta Tião, prêmio ₽1450.
  - Equipe: Timburr Nv 30 (Chute Baixo, Lançamento de Rocha, Energia Focada); Crabrawler Nv 31 (Soco Fortalecedor, Jato de Bolhas, Revide)

### `j07_bras_ginasio`
*Gatilho:* falar `bras` (exige nh.reviravolta2, exige trainers.g6_dandara, exige trainers.g6_tiao, sem badges.rochedo)
- **Líder Brás:** Ê, camará! Abriu os três portões! O berimbau gostou de você.
- **Líder Brás:** Agora a luta é a sério. Eu sou o último degrau antes da escalada. Quem passa daqui sobe o Paredão sem medo.
- **Ravi:** Eu passei pelos seus três portões. Agora quero o último degrau.
- **Líder Brás:** Então sobe, camará. Mas traz o berimbau de volta, que ele é emprestado do Mestre.
- *Batalha* `leader_bras`: Líder Brás, prêmio ₽3400.
  - Equipe: Machoke Nv 33 (Golpe de Caratê, Chute Baixo, Energia Focada); Hawlucha Nv 34 (Ataque de Asa, Golpe de Caratê, Pouso); Riolu Nv 35 (Palma de Força, Ataque Rápido, Contra-Ataque); Heracross Nv 36 (Quebra-Tijolo, Ataque de Chifre, Projétil de Sementes); Hitmontop Nv 37 (Giro Rápido, Chute Triplo, Ataque Rápido, Detectar)

### `j07_bras_insignia`
*Gatilho:* vencer `leader_bras`
- **Líder Brás:** Olha só, o berimbau ficou calado de tanto respeito. A Insígnia Punho é sua. Ela deixa você escalar paredões fora da batalha.
- *{jogador} recebeu a Insígnia Punho!*
- **Líder Brás:** Eu não sei do sol nem da Aurora. Eu sei da luta. Mas o Prof. Jatobá, o Téo e você, vocês estão no meio de uma coisa grande demais para um forte.
- **Líder Brás:** O Paredão está lá atrás da Rota 8, e a Graça espera você na Cidade Escarpa. Sobe com cuidado, que a pedra lá em cima é traiçoeira.
- *Depois:* insígnia **Insígnia Punho** · montaria `sneasler`
- *Objetivo no painel:* Siga pela Rota 8 (escalada do Paredão) até a Cidade Escarpa → `ninho_cidade_escarpa`

### `j07_boletim6`
*Gatilho:* a flag `badges.rochedo` virar verdadeira (sem nh.boletim.6)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e cinquenta e um minutos. A Companhia Aurora nega qualquer relação com o atraso.
- **Mãe:** Ravi, seis e cinquenta e um. A Aurora nega? Filho, isso quer dizer que alguém está fazendo alguma coisa. Cuidado com o que você ouve.
- **Ravi:** Se a Aurora nega, é porque tem alguma coisa para negar. Eu vou descobrir o que é.
- *Depois:* flags `nh.boletim.6=true`, `nh.sol=6h51` · só conta a história

## 08 · Pedra pintada
*Jornada `sertao` · boletim do sol no fim: 6h51 · arquivo `src/story/jornada/08-sertao.js`*

### `j08_chegada`
*Gatilho:* entrar `vila_mandacaru` (exige nh.reviravolta2, sem nh.chegouSertao)
- *Vila Mandacaru: casas de barro, uma cacimba no centro da praça e um vento seco que levanta areia até o meio da rua.*
- *A Crepúsculo escava as Ruínas de Pedra Pintada há uma semana, e a Aurora diz que não é nada. Ninguém na vila acredita na Aurora.*
- **Ravi:** Eu preciso chegar às ruínas antes deles. O Prof. Jatobá disse que a pedra daqui é ligada ao Relógio.
- *Um menino de chapéu de palha vende água de cacimba numa caneca de lata. Ele aponta para o cânion, do outro lado da vila.*
- *Depois:* flags `nh.chegouSertao=true`
- *Objetivo no painel:* Atravesse o Cânion e chegue às Ruínas de Pedra Pintada, ao norte → `sertao_ruinas_entrada`

### `j08_escavacao`
*Gatilho:* entrar `sertao_ruinas_entrada` (exige nh.chegouSertao, sem nh.ebanoSertao)
- *Na entrada das ruínas, a parede de pedra está riscada com linhas de escavação. Uma máquina de perfuração está parada ao lado de um buraco fundo.*
- **Recruta Crepúsculo:** Só falta uma camada, Admin. Quando a pedra sair, a gente leva a pedra da cidade para o Relógio.
- **Admin Ébano:** Admin Ébano. A pedra tem o desenho do cadeado. Quem vê o desenho sabe onde encaixar a chave. Eu não vou deixar ninguém atrapalhar.
- **Ravi:** O cadeado do Relógio está escondido na parede de vocês? Desde quando?
- **Admin Ébano:** Desde antes de a Aurora pensar em luz. Vá pegar sua lanterna e aprenda a ler as paredes.
- *Batalha* `c8_ebano`: Admin Ébano, prêmio ₽2400. Se perder, volta a esta cena.
  - Equipe: Sableye Nv 35 (Garra Sombria, Jogo Sujo, Fogo-Fátuo); Honchkrow Nv 35 (Talho Noturno, Pássaro Bravo, Golpe Baixo)
- *Depois:* flags `nh.ebanoSertao=true`

### `j08_pinturas`
*Gatilho:* vencer `c8_ebano`
- *O Ébano some por um corredor de pedra. Atrás dele, a parede abre um salão baixo, com pinturas em vermelho e ocre cobrindo o teto inteiro.*
- *Numa das pinturas, um Absol branco fica ao lado de uma mulher de casaco longo. Os dois olham para um relógio gigante, com sete estrelas na borda.*
- *Em outra, duas mulheres idênticas aparecem sob a mesma estrela, uma de cada lado do relógio. A legenda está apagada, exceto por uma palavra: "irmãs".*
- **Ravi:** O Absol que aparece antes de cada desastre. Ele está em todas as pinturas. Quem é ele?
- *Você passa a mão pela parede. A tinta ainda está fresca em alguns pontos, como se alguém tivesse pintado ontem.*
- *Depois:* flags `nh.pinturas=true`
- *Objetivo no painel:* Procure o Absol branco nas Ruínas de Pedra Pintada: ele está escondido no salão do fundo → `ruinas_pintada_2`

### `j08_sina_revela` · **REVIRAVOLTA 3**
*Gatilho:* entrar `ruinas_pintada_2` (exige nh.pinturas, sem nh.sina)
- *No salão do fundo, o Absol branco está sentado sob um facho de luz dourada que desce do teto. A luz não é de sol. Ela vem de uma fresta, como se houvesse um cristal lá em cima.*
- **Absol:** …
- *Você estende a mão devagar. O Absol encosta a testa na sua palma. Um calor morno sobe pelo braço, e uma voz de mulher aparece dentro da sua cabeça.*
- **Absol:** Sina. Eu sou a Sina. Sou a parceira da Véspera desde antes de a Aurora existir.
- **Absol:** A luz do Relógio me prendeu aqui quando a Véspera tentou fechar o cadeado sozinha. Eu virei sentinela. Desde então, aviso antes de cada desastre e levo quem pode ajudar até a pedra ameaçada.
- **Absol:** Você já me viu no bosque da Lia, na gruta, no templo, na mina. Eu estava guiando você às pedras. Ninguém mais estava.
- **Ravi:** Então você é a Sina. E a Véspera sabe que você está aqui?
- **Absol:** Ela sabe. Ela não pode me tirar daqui sem abrir o cadeado. E o cadeado é a única coisa que mantém a sua cidade acordada.
- *Depois:* flags `nh.sina=true`, `nh.viuSina=true`
- *Objetivo no painel:* Descoberta: o Absol que aparece antes de cada desastre é a Sina, a parceira da Dra. Véspera, presa à luz do Relógio. Vá ao Paredão, na Cidade Escarpa, e procure a Líder Graça → `ninho_cidade_escarpa`

### `j08_teo_rival4`
*Gatilho:* entrar `sertao_praca_mandacaru` (exige nh.sina, sem nh.rival4)
- **Téo:** Você tem andado com um Absol que fala na sua cabeça. Eu não estou com ciúme, mas quero ver o seu time antes de confiar em você.
- **Ravi:** Você mudou de lado na mina, Téo. Por que quer lutar agora?
- **Téo:** Porque eu mudei de lado, e não de cabeça. Quero ter certeza de que você é forte o bastante para parar a Crepúsculo e a Aurora ao mesmo tempo.
- *Batalha* `nh_rival4`: Rival Téo, prêmio ₽4200. Se perder, a história segue.
  - Equipe: Staravia Nv 28 (Ataque de Asa, Ás Aéreo, Ataque Rápido); Arcanine Nv 28 (Roda de Fogo, Triturar, Velocidade Extrema); Umbreon Nv 29 (Ataque Dissimulado, Raio Confuso, Luz da Lua); rival:3
- *Depois:* flags `nh.rival4=true`

### `j08_mapa_paredao`
*Gatilho:* entrar `museu_sertao` (exige nh.rival4, sem nh.mapaParedao)
- *O Museu do Sertão guarda um mapa de papel, dobrado em quatro, que mostra o caminho de escalada do Paredão. Uma faixa de cor marca a trilha, e o nome da Cidade Escarpa está escrito em caneta.*
- *No verso, um recado de letra miúda: "Quem sobe o Paredão sem mapa cai no vento. Quem sobe com a Sina encontra a pedra certa."*
- **Téo:** Eu conheço esse mapa. Meu pai tinha uma cópia parecida na garagem. Ele dizia que o Paredão era o caminho para o Relógio.
- **Ravi:** Então o caminho do Paredão é o mesmo que o seu pai desenhou.
- *Depois:* flags `nh.mapaParedao=true` · só conta a história

## 09 · Acima do Paredão
*Jornada `escarpa` · boletim do sol no fim: 7h03 · arquivo `src/story/jornada/09-escarpa.js`*

### `j09_chegada`
*Gatilho:* entrar `ninho_cidade_escarpa` (exige nh.sina, exige nh.mapaParedao, sem nh.chegouEscarpa)
- *Cidade Escarpa: casas penduradas na rocha, escadas esculpidas no paredão e um ateliê de pedra com estátuas pela calçada.*
- *Dá para ver o Planalto dos Ventos lá em cima, com o Relógio de Pedra no topo, pequeno, contra o céu. A tempestade está parada sobre ele.*
- **Ravi:** A Líder Graça guarda a pedra da cidade. Mas a Sina me disse que ela já foi levada. Preciso descobrir por quem.
- *Na praça, um ateliê de pedra está com a porta aberta. Uma escultora de avental cinza acena para você, sem sorrir.*
- *Depois:* flags `nh.chegouEscarpa=true`
- *Objetivo no painel:* Procure a Líder Graça na Mina Velha, no fim da rua de pedra → `ninho_cidade_escarpa`

### `j09_traicao`
*Gatilho:* entrar `ninho_cidade_escarpa` (exige nh.chegouEscarpa, sem nh.traicaoSereno)
- *No meio da praça, a Dra. Véspera segura uma caixa de madeira com sete pedras de cores diferentes. O Admin Sereno está ao lado dela, de capa roxa, sorrindo.*
- **Dra. Véspera:** Sete, Sereno. Só falta uma. Com as oito no Relógio, a noite finalmente vai ter fim para quem merece.
- **Admin Sereno:** Claro, Dra. Véspera. Com as oito no Relógio, a noite vai ter fim. Ou o cadeado vai abrir de vez.
- **Dra. Véspera:** O que você disse?
- **Admin Sereno:** Disse que foi um prazer trabalhar com você. O Senhor Solano manda lembranças. E os cristais também.
- *O Sereno puxa a caixa das mãos dela, dá um passo para trás e corre pela escada da escarpa. Atrás dele, dois recrutas abrem caminho com as lanternas apagadas.*
- **Dra. Véspera:** Sereno! Você… você era dele desde o começo?
- **Ravi:** Não era a Crepúsculo que estava mandando. Eu vi o nome do Solano em todas as cartas.
- *Depois:* flags `nh.traicaoSereno=true`
- *Objetivo no painel:* Veja o que a Dra. Véspera sabe sobre as traduções que guiavam a Crepúsculo → `ninho_cidade_escarpa`

### `j09_traducoes` · **REVIRAVOLTA 4**
*Gatilho:* depois da cena `j09_traicao`
- **Dra. Véspera:** Eu traduzi as inscrições do Relógio com as minhas próprias mãos. Dezesseis anos de estudo. Eu tinha certeza de que as oito pedras fariam o sol dormir.
- **Dra. Véspera:** Mas o Sereno cuidou das traduções. Ele trocou as palavras de "fechar" por "abrir". E eu não li de novo, porque confiava nele.
- **Ravi:** Então juntar as oito no Relógio não fecha a noite. Abre o cadeado.
- **Dra. Véspera:** Abre. E o Necrozma, que come a luz, sai do Relógio. O Solano sabe disso. Ele quer capturá-lo e vender luz infinita para todas as cidades.
- **Dra. Véspera:** A Crepúsculo foi só a faca que cortou a corda. Quem segurava a corda era a Aurora, desde a primeira amostra.
- **Ravi:** Então a Dra. Véspera não está do lado da noite. Está tentando impedir a Aurora de capturar a luz.
- **Dra. Véspera:** Eu estou tentando impedir que alguém compre o amanhecer. Se você quiser me acreditar, vá ao Relógio antes do Solano. Eu não tenho mais pedras, só o que sei sobre o Relógio.
- *Depois:* flags `nh.reviravolta4=true`
- *Objetivo no painel:* Descoberta: juntar as oito pedras no Relógio ABRE o cadeado, e o Solano quer o Necrozma. Vá à Mina Velha, ao fundo da cidade, e enfrente a Líder Graça → `ninho_cidade_escarpa`

### `j09_juvenal`
*Gatilho:* avistar `g7_juvenal`
- **Aprendiz:** A Graça não perde uma luta de pé. Ela cai, levanta e bate de novo. Pedra não se cansa.
- *Batalha* `g7_juvenal`: Mineiro Juvenal, prêmio ₽1600.
  - Equipe: Roggenrola Nv 33 (Rajada de Rochas, Cabeçada, Ataque de Areia); Rolycoly Nv 34 (Giro Rápido, Cortina de Fumaça, Poder Ancestral)

### `j09_rita`
*Gatilho:* avistar `g7_rita`
- **Aprendiz:** Subir a Mina Velha é fácil. Descer é que é a parte difícil.
- *Batalha* `g7_rita`: Alpinista Rita, prêmio ₽1650.
  - Equipe: Nacli Nv 34 (Lançamento de Rocha, Cura de Sal, Cabeçada); Rockruff Nv 35 (Lançamento de Rocha, Mordida, Uivo)

### `j09_graca_ginasio`
*Gatilho:* falar `graca` (exige nh.reviravolta4, exige trainers.g7_juvenal, exige trainers.g7_rita, sem badges.escarpa)
- **Líder Graça:** Você chegou ao fundo da Mina Velha, e não ficou com a cara de quem apanhou das pedras. Isso é bom.
- **Líder Graça:** A minha pedra sumiu com o Sereno ontem. Não vou negar que fiquei com raiva. Então agora você vai levar uma pancada de rocha.
- **Ravi:** Eu sinto muito pela pedra, Graça. Eu vou trazer ela de volta.
- **Líder Graça:** Traz mesmo. E não deixa o Sereno enganar você com cara de bonzinho.
- *Batalha* `leader_graca`: Líder Graça, prêmio ₽3800.
  - Equipe: Rhyperior Nv 39 (Terremoto, Gume de Pedra, Cabeçada); Tyranitar Nv 40 (Triturar, Gume de Pedra, Terremoto); Gigalith Nv 39 (Rajada de Rochas, Cabeçada, Giro Rápido); Probopass Nv 41 (Tumba de Rochas, Onda de Trovão, Terremoto)

### `j09_graca_insignia`
*Gatilho:* vencer `leader_graca`
- **Líder Graça:** A Insígnia Rocha é sua. Ela deixa voar sobre as cidades que você já visitou, mas só essas. O céu é de quem conhece o chão.
- *{jogador} recebeu a Insígnia Rocha!*
- **Líder Graça:** Eu não sabia que a pedra estava sendo usada para abrir o Relógio. Se você for ao Relógio, leve a pedra da cidade de volta. É dela, não de nenhum deles.
- **Líder Graça:** Vá ao Brasas, no vulcão ao sul. Dizem que o Ébano tentou acordá-lo na Ilha do Basalto. Se o vulcão acordar, o vento do planalto vai para cima da cidade.
- *Depois:* insígnia **Insígnia Rocha** · montaria `corviknight` · flags `nh.voar=true`
- *Objetivo no painel:* Pegue o barco no cais de Cidade Escarpa e vá à Ilha do Basalto, no arquipélago das Brasas → `cais_basalto`

### `j09_boletim7`
*Gatilho:* a flag `badges.escarpa` virar verdadeira (sem nh.boletim.7)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às sete horas e três minutos. Pela primeira vez, a Companhia Aurora fala no rádio sobre o horário do sol: diz que é uma "variação passageira".
- **Mãe:** Ravi, sete e três. Passageira? Filho, faz mais de uma semana. Você está conseguindo ver o que está acontecendo lá em cima?
- **Ravi:** Eu vou procurar o que a Aurora esconde no Relógio. Se o sol atrasou por isso, quero ver com meus próprios olhos.
- *Depois:* flags `nh.boletim.7=true`, `nh.sol=7h03` · só conta a história

## 10 · Brasas no vulcão
*Jornada `brasas` · boletim do sol no fim: 7h03 · arquivo `src/story/jornada/10-brasas.js`*

### `j10_chegada`
*Gatilho:* entrar `ilha_basalto` (exige badges.escarpa, sem nh.chegouBrasas)
- *Ilha do Basalto: rochas negras, fontes de água quente saindo do chão e um cheiro forte de enxofre que chega até o barco.*
- *Lá em cima, o vulcão Tição solta uma fumaça fina. Os moradores dizem que, desde a semana passada, o ronco do vulcão não para mais.*
- **Ravi:** Se o Ébano está aqui, deve ser para o vulcão. A Graça disse que ele quer acordá-lo.
- **Ravi:** Se o vulcão está acordando, a Graça não exagerava quando falou do vento.
- *Uma nuvem de vapor sobe das fontes quentes e se espalha pelas rochas, molhando as suas botas.*
- *Depois:* flags `nh.chegouBrasas=true`
- *Objetivo no painel:* Suba ao Vulcão Tição e veja a equipe de perfuração da Crepúsculo → `vulcao_ticao`

### `j10_ebano_vulcao`
*Gatilho:* entrar `vulcao_ticao` (exige nh.chegouBrasas, sem nh.ebanoBrasas)
- *Na borda da cratera, um trator de perfuração treme sobre o chão quente. Dois recrutas empurram um tubo de metal para dentro da rocha.*
- **Recruta Crepúsculo:** Mais uma camada e o vulcão acorda. Aí a nuvem vai para o alto e o vento do planalto muda de direção.
- **Admin Ébano:** Admin Ébano. Você é insistente. Se o vulcão acordar, o ar quente sobe e a tempestade do Planalto cai sobre o Relógio. Não há mais nada para segurar a noite.
- **Ravi:** A tempestade é a sua obra? Por que vocês querem o ar do Relógio em movimento?
- **Admin Ébano:** Porque a Véspera precisa da tempestade parada para o Relógio ficar fechado. Ou abri-lo sem ninguém vendo. Agora, saia do caminho.
- *Batalha* `c10_ebano`: Admin Ébano, prêmio ₽3000. Se perder, volta a esta cena.
  - Equipe: Sableye Nv 40 (Garra Sombria, Jogo Sujo, Fogo-Fátuo); Honchkrow Nv 41 (Talho Noturno, Pássaro Bravo, Golpe Baixo); Houndoom Nv 42 (Lança-Chamas, Pulso Sombrio, Plano Maligno)
- *Depois:* flags `nh.ebanoBrasas=true`

### `j10_vulcanologa`
*Gatilho:* vencer `c10_ebano`
- **Vulcanóloga Jaciara:** Eu registro o vulcão há vinte anos. Essa tempestade sobre o Planalto nunca foi do vulcão, e é isso que me preocupa.
- **Vulcanóloga Jaciara:** O Relógio puxa o ar frio de cima para dentro dele, todas as noites. O calor do Tição é o contrapeso que empurra o ar de volta. Sem ele, o vento para e a tempestade fica parada.
- **Vulcanóloga Jaciara:** O Templo da Chama é o lugar onde o calor do vulcão chega mais perto da superfície. Se alguém acender a chama lá em cima, o contrapeso volta e a tempestade se desfaz.
- **Ravi:** Então o Ébano queria acordar o vulcão para manter a tempestade no lugar.
- **Vulcanóloga Jaciara:** Ou para fazer tudo cair de uma vez. Não sei qual dos dois é pior. Vá ao Templo, leve a chama e não deixe ninguém apagar.
- *Depois:* flags `nh.explicouTempestade=true`
- *Objetivo no painel:* Suba ao Templo da Chama e acenda a chama do topo, para desfazer a tempestade do Planalto → `templo_chama_1`

### `j10_templo_chama`
*Gatilho:* entrar `templo_chama_1` (exige nh.explicouTempestade, sem nh.temploChama)
- *O Templo da Chama é uma escada de pedra negra que sobe pelo lado de dentro do vulcão. Em cada andar, uma fresta mostra o brilho laranja da lava lá embaixo.*
- *No topo, uma pira de pedra está apagada há séculos. Ao lado dela, um Pokémon de fogo, pequeno e com a respiração ofegante, espera por alguém que acenda a chama.*
- **Ravi:** Vou acender a chama. Vamos juntos.
- *A pira se acende de uma vez, com um estalo grave. O calor sobe pelas paredes, e a tempestade lá em cima, no Planalto, começa a girar ao contrário.*
- *Depois:* flags `nh.temploChama=true`, `nh.tempestadeFim=true`
- *Objetivo no painel:* Volte ao barco e siga para o Mirante dos Ventos, no Planalto, agora que a tempestade acabou → `ninho_mirante_ventos`

### `j10_tempestade_fim`
*Gatilho:* depois da cena `j10_templo_chama`
- **Vulcanóloga Jaciara:** Olha lá em cima! O céu do Planalto abriu. Pela primeira vez em duas semanas dá para ver o topo do Relógio.
- **Ravi:** E o Relógio, ainda está fechado?
- **Vulcanóloga Jaciara:** Está. Mas agora dá para ver que o cadeado está girando. Não tem mais o vento para segurar.
- *Depois:* só conta a história

## 11 · Asas do Mirante
*Jornada `mirante` · boletim do sol no fim: 7h11 · arquivo `src/story/jornada/11-mirante.js`*

### `j11_chegada`
*Gatilho:* entrar `ninho_mirante_ventos` (exige nh.tempestadeFim, sem nh.chegouMirante)
- *Mirante dos Ventos: uma torre de vidro no topo do Planalto, com o vento vindo de todos os lados. Lá do alto, dá para ver o Relógio de Pedra, pequeno e escuro, do outro lado do vale.*
- *O Prof. Jatobá tinha marcado de encontrar você aqui. Ele disse, pelo rádio, que queria mostrar a pedra da Celeste antes de subir.*
- **Ravi:** O professor não se atrasou nunca. Algo está errado.
- *Um vento frio sobe pelo vale e faz as bandeiras do mirante estalarem como velas de barco.*
- *Depois:* flags `nh.chegouMirante=true`
- *Objetivo no painel:* Procure o Prof. Jatobá no Mirante dos Ventos, perto da torre de vidro → `ninho_mirante_ventos`

### `j11_prof_sequestrado`
*Gatilho:* entrar `ninho_mirante_ventos` (exige nh.chegouMirante, sem nh.profSequestrado)
- *O Prof. Jatobá está sentado no muro do mirante, com uma pasta de papel no colo. Quando você se aproxima, um carro branco com faróis dourados para bem atrás dele.*
- **Prof. Jatobá:** Ravi, fuja! Eles não vieram me ajudar, vieram me buscar!
- **Gerente Lúcio:** Professor, o Senhor Solano pediu que o senhor viesse conosco. Não precisamos fazer barulho.
- **Ravi:** Solte ele, Gerente Lúcio. Ele é o professor da região!
- **Gerente Lúcio:** Ele é a peça que faltava para a Companhia. E você, garoto, tem o que o Senhor Solano realmente quer. Não tente me impedir.
- *Batalha* `c11_lucio`: Gerente Lúcio, prêmio ₽4200. Se perder, volta a esta cena.
  - Equipe: Magnezone Nv 41 (Canhão de Luz, Relâmpago, Bomba Magnética); Klinklang Nv 41 (Engrenagem Dupla, Relâmpago, Troca de Marcha); Glimmora Nv 42 (Gema de Poder, Bomba de Lodo, Rochas Furtivas)
- *Depois:* flags `nh.profSequestrado=true`

### `j11_solano_liga`
*Gatilho:* vencer `c11_lucio`
- *O Lúcio recua até o carro. O helicóptero da Aurora já está no ar, e o professor olha para você pela janela, com a pasta apertada contra o peito.*
- *Seu celular toca. O número não está salvo, mas você reconhece a voz no primeiro segundo.*
- **Augusto Solano:** Ravi, certo? Eu acompanhei você desde a inauguração em Cidade Coral. Você é um rapaz muito eficiente.
- **Augusto Solano:** O professor está sob a minha proteção. Ele vai voltar para casa intacto, desde que você me entregue a Vela Eterna da senhora Zélia, que você guarda desde Lamparina.
- **Ravi:** Você sequestrou um professor para pegar uma vela?
- **Augusto Solano:** Eu sequestrei o professor porque ele sabia onde a vela estava. Ele me contou tudo, por telefone, há dezesseis anos. Não tenha dúvidas de que ele falou.
- **Augusto Solano:** Vinte minutos. Você sabe onde me encontrar: no Relógio de Pedra. E não esqueça de levar a vela acesa.
- *Depois:* flags `nh.solanoLiga=true` · só conta a história

### `j11_vela_revelada` · **REVIRAVOLTA 5**
*Gatilho:* depois da cena `j11_solano_liga`
- **Dona Zélia:** Querido, o Solano falou comigo também, ontem à noite. Eu não queria que você descobrisse assim, pelo telefone de um vilão.
- **Dona Zélia:** A Vela Eterna é a oitava chave do Relógio. As outras sete pedras estavam nos ginásios, e ela ficou acesa na minha família. Quando o Relógio foi fechado, a chama passou a ser guardada.
- **Ravi:** Então eu tenho a oitava chave desde Lamparina. A senhora me deu para guardar.
- **Dona Zélia:** Eu dei porque você tinha cara de quem não ia acender. E você não acendeu. Agora a chama é a única coisa que pode dizer se o Relógio está aberto ou fechado.
- **Ravi:** O Solano quer que eu acenda a vela no Relógio. Ele vai abrir o cadeado e capturar o Necrozma, não vai?
- **Dona Zélia:** Vai, querido. E as pedras da Véspera já estão com ele, por causa do Sereno. Você precisa chegar antes dele ao topo.
- *Depois:* flags `nh.reviravolta5=true`, `nh.velaSelo=true`
- *Objetivo no painel:* Descoberta: a Vela Eterna é a oitava chave do Relógio, e estava com você desde Lamparina. Vá ao Relógio de Pedra, no topo do Planalto, antes que o Solano chegue → `relogio_pedra`

### `j11_bruno`
*Gatilho:* avistar `r9_bruno`
- **Treinador:** Piloto Bruno, do Mirante. Quem voa aqui não tem medo de nada. Vamos ver se você aguenta o vento!
- *Batalha* `r9_bruno`: Piloto Bruno, prêmio ₽1700.
  - Equipe: Swablu Nv 37 (Sopro do Dragão, Golpe Espelho, Guarda de Algodão); Fletchinder Nv 38 (Carga de Chamas, Ataque de Asa, Agilidade)

### `j11_celia`
*Gatilho:* avistar `r9_celia`
- **Treinador:** Vaqueira Célia, de Estepe dos Ventos. Passo a vida entre o vento e os bois. Vamos ver quem aguenta mais.
- *Batalha* `r9_celia`: Vaqueira Célia, prêmio ₽1750.
  - Equipe: Tauros Nv 38 (Cabeçada Zen, Desmantelar, Cara Assustadora); Skiddo Nv 38 (Folha Navalha, Terraplanagem, Semente Sanguessuga)

### `j11_gael`
*Gatilho:* avistar `g8_gael`
- **Aprendiz:** O Gael é o piloto da Celeste. Ele sabe o horário exato em que o vento vira. Pelo menos sabia.
- *Batalha* `g8_gael`: Piloto Gael, prêmio ₽1800.
  - Equipe: Swablu Nv 38 (Sopro do Dragão, Guarda de Algodão, Bicada); Fletchinder Nv 39 (Carga de Chamas, Acrobacia, Agilidade)

### `j11_iris`
*Gatilho:* avistar `g8_iris`
- **Aprendiz:** Quando a Celeste está nervosa, ela fala com o vento. Ele responde. Eu não sei por que ele responde.
- *Batalha* `g8_iris`: Piloto Íris, prêmio ₽1850.
  - Equipe: Pidgeotto Nv 39 (Ataque de Asa, Tornado, Ataque Rápido); Noctowl Nv 40 (Lâmina de Ar, Hipnose, Extrassensorial)

### `j11_celeste_ginasio`
*Gatilho:* falar `celeste` (exige nh.velaSelo, exige trainers.r9_bruno, exige trainers.r9_celia, exige trainers.g8_gael, exige trainers.g8_iris, sem badges.mirante)
- **Líder Celeste:** Você veio até a Torre do Vento, depois de passar por todo o Planalto. Eu vi isso no vento antes de você chegar.
- **Líder Celeste:** Hoje o meu Braviary vai crescer. Não é para te assustar. É porque a torre só aceita voadores que estão de pé.
- **Ravi:** Eu passei por todos os seus pilotos. Agora quero ver o que o vento diz de mim.
- **Líder Celeste:** O vento diz que você ainda tem o que aprender sobre esperar. Vamos ver se ele aguenta a sua pressa.
- *Batalha* `leader_celeste`: Líder Celeste, prêmio ₽4400, Dynamax.
  - Equipe: Pidgeot Nv 43 (Ataque de Asa, Tornado, Ataque Rápido); Pelipper Nv 43 (Lufada de Vento, Lâmina de Ar, Hipnose); Corviknight Nv 45 (Lâmina de Ar, Pouso, Pássaro Bravo); Braviary Nv 45 (Pássaro Bravo, Ataque de Asa, Hipnose)

### `j11_celeste_insignia`
*Gatilho:* vencer `leader_celeste`
- **Líder Celeste:** Eu perdi. A Insígnia Pluma é sua. Ela deixa você mergulhar nos lagos e rios do Planalto, onde o vento não chega.
- *{jogador} recebeu a Insígnia Pluma!*
- **Líder Celeste:** O Relógio está logo ali, do outro lado do vale. Eu conheço o caminho pelo vento: ele passa pela ponte de pedra, à esquerda. Não vá pela direita, que tem a Aurora.
- **Líder Celeste:** E leve o professor de volta, se conseguir. Ele é um dos poucos que ainda acredita que o céu tem dono.
- *Depois:* insígnia **Insígnia Pluma** · montaria `mantine`
- *Objetivo no painel:* Atravesse o vale pela ponte de pedra, à esquerda, e suba ao Relógio de Pedra → `relogio_pedra`

### `j11_boletim8`
*Gatilho:* a flag `badges.mirante` virar verdadeira (sem nh.boletim.8)
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às sete horas e onze minutos. A tempestade do Planalto acabou ontem à noite, mas o horário continua atrasado.
- **Mãe:** Ravi, sete e onze. Eu não entendo mais nada, filho. O Prof. Jatobá não atende o telefone desde ontem. Por favor, me diga que você vai trazê-lo para casa.
- **Ravi:** Mãe, eu vou atrás dele. Ele está no Relógio, e eu prometo que volto com ele.
- *Depois:* flags `nh.boletim.8=true`, `nh.sol=7h11` · só conta a história

## 12 · O Relógio de Pedra
*Jornada `relogio` · boletim do sol no fim: 7h11 · arquivo `src/story/jornada/12-relogio.js`*

### `j12_chegada`
*Gatilho:* entrar `relogio_pedra` (exige nh.reviravolta5, sem nh.chegouRelogio)
- *O topo do Planalto: um círculo de pedra com sete pedestais vazios, e no centro, o Relógio de Pedra. Um cadeado de cristal dourado prende uma porta de rocha, como se fosse uma caixa de relógio gigante.*
- *Em cada pedestal, um padrão de luz gira devagar. Sete estão acesos, com a cor de cada ginásio. O oitavo pedestal está apagado, esperando.*
- **Augusto Solano:** Ravi, chegou no horário. Eu gosto de gente pontual. A vela, por favor, e o professor volta para casa.
- *O professor está numa gaiola de metal, ao lado do Lúcio, com o rosto pálido e os olhos fixos em você.*
- **Admin Sereno:** Ele trouxe a vela, Senhor Solano? Eu trouxe as sete. Já estão nos pedestais.
- **Ravi:** Não entrego a vela sem ver o professor sair. E não acendo nada antes de saber o que o Relógio faz.
- **Augusto Solano:** O Relógio fecha o sol quando as oito estão acesas, e abre o cadeado quando alguém sopra a chama. Eu não preciso que você entenda. Só preciso que você obedeça.
- *Depois:* flags `nh.chegouRelogio=true`
- *Objetivo no painel:* Enfrente a Dra. Véspera, que bloqueia a escada do Relógio → `relogio_pedra`

### `j12_vespera_desafio`
*Gatilho:* depois da cena `j12_chegada`
- **Dra. Véspera:** Antes de você acender qualquer coisa, eu quero saber quem está do outro lado da chama.
- **Dra. Véspera:** Eu não sou da Aurora. Mas também não sou sua amiga. Vamos ver se você segura a luz quando ela pesa.
- **Ravi:** Então eu vou segurar a luz com a mão aberta. Não vou fechar o punho.
- **Dra. Véspera:** Esse é o primeiro pensamento sensato que eu ouço hoje. Vamos.
- *Batalha* `c12_vespera`: Dra. Véspera, prêmio ₽4800. Se perder, volta a esta cena.
  - Equipe: Murkrow Nv 46 (Bicada, Assustar, Perseguição); Honchkrow Nv 47 (Talho Noturno, Pássaro Bravo, Golpe Baixo); Sableye Nv 47 (Garra Sombria, Jogo Sujo, Fogo-Fátuo); Grimmsnarl Nv 48 (Quebra-Espírito, Laço Sombrio, Onda de Trovão, Golpe Baixo)

### `j12_vespera_aliada` · **REVIRAVOLTA 6**
*Gatilho:* vencer `c12_vespera`
- **Dra. Véspera:** Você segurou. Eu não esperava. Agora escuta, porque eu não vou repetir: o Solano planeja abrir o cadeado e capturar o Necrozma.
- **Dra. Véspera:** Quando o Necrozma sair, ele vai comer toda a luz do Planalto para a Aurora vender. Eu não vou deixar isso acontecer, nem que eu fique presa aqui com a Sina.
- **Dra. Véspera:** Eu estou do seu lado agora. Não por você. Por ela, por mim e pelo sol que eu deixei de ver.
- *Lá embaixo, na escada, o Téo chega correndo. Atrás dele, um homem de capacete sujo de pó segura um lampião: é o Heitor, livre da mina.*
- **Téo:** Estamos aqui! Eu e o meu pai! A gente saiu da mina pelo túnel do nível quatro e vim direto.
- **Heitor:** Ravi! Obrigado por ter ido atrás do meu filho. Ele não parava de falar de você, e depois da mina, eu entendi o porquê.
- *Depois:* flags `nh.chegaramAliados=true`, `nh.veraAliada=true`
- *Objetivo no painel:* Descoberta: a Véspera e o Téo se aliam ao jogador, e o Solano quer abrir o cadeado para capturar o Necrozma. Enfrente o Solano no topo do Relógio → `relogio_pedra`

### `j12_solano_batalha`
*Gatilho:* depois da cena `j12_vespera_aliada`
- **Augusto Solano:** Vocês acham que uma pedra e um garoto vão deter a luz da Aurora? A luz é a única coisa que nunca deixou ninguém no escuro.
- **Augusto Solano:** Lúcio, Sereno, às pedras. Eu vou cuidar do garoto pessoalmente. A Véspera pode continuar sonhando com a noite.
- **Dra. Véspera:** Eu sonho com a noite porque é ela que nos protege da sua luz, Solano.
- *O Lúcio e o Sereno se afastam para as bordas do círculo de pedra. O Téo e o Heitor ficam de pé ao seu lado, sem dizer nada.*
- *Batalha* `c12_solano`: Augusto Solano, prêmio ₽9000, com o Téo ao seu lado. Se perder, volta a esta cena.
  - Equipe: Magnezone Nv 45 (Canhão de Luz, Relâmpago, Bomba Magnética); Klinklang Nv 45 (Engrenagem Dupla, Relâmpago, Troca de Marcha); Glimmora Nv 46 (Gema de Poder, Bomba de Lodo, Rochas Furtivas); Corviknight Nv 46 (Lâmina de Ar, Pouso, Pássaro Bravo); Weavile Nv 47 (Caco de Gelo, Talho Noturno, Presa de Gelo)

### `j12_solano_cai`
*Gatilho:* vencer `c12_solano`
- **Augusto Solano:** Não… Eu comprei o amanhecer de cada cidade desta região. Não posso perder agora.
- *O Solano cai de joelhos. O Sereno, ao lado dele, deixa cair a caixa com as sete pedras, e elas rolam até os pedestais.*
- **Prof. Jatobá:** Ravi! Me solta, por favor. A chave da gaiola está no bolso do Lúcio, ele não vai reagir.
- *O Lúcio levanta as mãos, sem olhar para ninguém. A gaiola abre. O professor corre até você e segura seu braço com força.*
- **Prof. Jatobá:** Eu sinto muito, Ravi. Pelo telefone, pelo arquivo, por tudo. Mas agora vamos fechar isso.
- *No meio do círculo, as sete pedras começam a brilhar com a cor dos ginásios. O oitavo pedestal ainda espera a vela.*
- *Depois:* flags `nh.profLivre=true`, `nh.solanoCaiu=true` · só conta a história

### `j12_vela_acesa`
*Gatilho:* depois da cena `j12_solano_cai`
- **Ravi:** A Dona Zélia disse para não acender a vela antes dela mandar. Ela está aqui, pelo rádio. Ela mandou.
- **Dona Zélia:** Pode acender, querido. E cuidado: a chama é a última coisa que segura a noite.
- *Você coloca a Vela Eterna no oitavo pedestal e sopra a chama. Ela não apaga: se acende de vez, azul, com uma luz que não aquece e não ilumina nada além do próprio Relógio.*
- *O cadeado de cristal estala. A porta de rocha se abre, e um rugido sai de dentro, como se o próprio céu estivesse rachando.*
- **Necrozma:** KRRRRAAAAAA!
- *Depois:* flags `nh.velaAcesa=true` · só conta a história

### `j12_necrozma`
*Gatilho:* depois da cena `j12_vela_acesa`
- *O Necrozma sai do Relógio, pequeno e escuro, com a juba de cristal rachada. O disco do sol no peito dele pulsa fraco, como alguém batendo numa janela por dentro.*
- **Necrozma:** KRRRRAAAAAA!
- *Lunala pousa ao seu lado e abre as asas. A luz prateada dela se mistura com a chama azul da vela.*
- **Ravi:** Eu sei que você não quer destruir nada. Você só está preso desde que o Relógio foi fechado.
- *Batalha* `c12_necrozma`: Necrozma Juba do Crepúsculo, Pokémon Alfa. Se perder, volta a esta cena.
  - Equipe: Necrozma Nv 50 (Golpe Aço-Solar, Gêiser de Fótons, Dança do Dragão, Garra Sombria) [forma dusk]

### `j12_necrozma_foge`
*Gatilho:* vencer `c12_necrozma`
- *O Necrozma cambaleia. A juba de cristal racha de vez. O disco do sol no peito dele acende, dourado, cada vez mais forte.*
- *CRAC. A armadura se parte e o Necrozma, pequeno de novo, olha para você por um instante. Depois afunda numa fenda aberta no chão do Relógio, e some.*
- **Dra. Véspera:** Ele foi embora para a terra. Vai levar muito tempo até ele voltar a comer a luz. Talvez ele nunca volte, se as oito insígnias estiverem fechadas.
- *As raízes de luz param de puxar. Elas começam a brilhar ao contrário: para fora.*
- *Depois:* flags `nh.necrozmaVencido=true` · só conta a história

### `j12_selo_insignias`
*Gatilho:* depois da cena `j12_necrozma_foge` (exige insignias>=8)
- *Cada ginásio envia um fio de luz para o círculo de pedra. Tomé, Lia, Marina, Jonas, Lamparina, Brás, Graça, Celeste. Oito fios, uma pedra em cada.*
- *Os fios se trançam no cadeado. A porta de rocha range, e o cadeado volta a fechar, com um estalo baixo, como uma tampa que encaixa.*
- **Dra. Véspera:** Ele fechou. Pela primeira vez em dezesseis anos, o Relógio está fechado, e não aberto.
- **Téo:** E o sol? Ele vai voltar a nascer na hora?
- **Prof. Jatobá:** Nasce, Téo. Nasce como sempre nasceu, e ninguém precisa comprar o amanhecer de ninguém.
- *Depois:* flags `nh.seloFechado=true` · só conta a história

### `j12_boletim_final`
*Gatilho:* depois da cena `j12_selo_insignias`
- **Rádio Alvorada:** Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e quatro minutos. O horário voltou ao normal, e a Companhia Aurora anunciou o fim das atividades de extração no Planalto.
- **Mãe:** Ravi! Seis e quatro! O sol voltou. Você está aí em cima, não está? Volta logo para casa, que o bolo está quentinho.
- **Ravi:** Eu chego amanhã cedo, mãe. Mas antes eu preciso ir para a Cordilheira Geada. A Liga não vai esperar.
- *Depois:* flags `nh.boletim.final=true`, `nh.sol=6h04`
- *Objetivo no painel:* Siga pela Rota 12 até a Cordilheira Geada, a oeste da Vila Alvorada → `geada_entrada_oeste`

## 13 · A Estrada da Vitória
*Jornada `geada` · boletim do sol no fim: 6h04 · arquivo `src/story/jornada/13-geada.js`*

### `j13_chegada`
*Gatilho:* entrar `geada_entrada_oeste` (exige nh.seloFechado, sem nh.chegouGeada)
- *A Cordilheira Geada começa numa estrada de terra batida, com a neve já acumulada nas margens. Ao longe, os picos brancos parecem recortados no céu.*
- *Esta é a Estrada da Vitória. Quem quer chegar à Liga do Zênite precisa atravessar a cordilheira inteira, com frio, vento e uma vila escondida no alto.*
- **Ravi:** Depois do Relógio, o caminho para a Liga é este. Não há outro jeito de chegar lá sem passar pelo gelo.
- *Um vento seco desce do alto da cordilheira e enche a estrada de neve fina, que brilha como açúcar.*
- *Depois:* flags `nh.chegouGeada=true`
- *Objetivo no painel:* Atravesse a Rota 15, pelo lago congelado, até a Vila Geada → `ninho_vila_geada`

### `j13_vila_geada`
*Gatilho:* entrar `ninho_vila_geada` (exige nh.chegouGeada, sem nh.vilaGeada)
- *Vila Geada: casas de madeira com telhado de neve, um observatório com cúpula de vidro e uma estalagem onde o fogo nunca apaga.*
- **Prof. Jatobá:** Ravi, está me ouvindo? Eu estou no observatório da vila. Um rapaz da estalagem me emprestou o telefone.
- **Prof. Jatobá:** Vá com cuidado na Caverna de Gelo. Dizem que o eco do gelo repete as vozes de quem passou por lá, e ninguém volta sem ouvir a própria voz de volta.
- **Prof. Jatobá:** E o Téo subiu para o Cume ontem. Ele disse que quer enfrentar você lá em cima, antes da Liga. Não deixe ele te achar despreparado.
- **Ravi:** O professor no observatório. Eu não imaginava que ele fosse tão animado lá em cima.
- *Depois:* flags `nh.vilaGeada=true`
- *Objetivo no painel:* Siga pela Rota 16 até a Caverna de Gelo, no meio da cordilheira → `caverna_gelo_1`

### `j13_caverna_gelo`
*Gatilho:* entrar `caverna_gelo_1` (exige nh.vilaGeada, sem nh.cavernaGelo)
- *A Caverna de Gelo tem três andares, cada um mais frio que o anterior. As paredes são de gelo azul, e dentro dele dá para ver bolhas de ar presas, como lembranças.*
- *No primeiro andar, o seu próprio eco volta mais grave do que você falou. Parece que alguém está respondendo no fundo, com a sua voz.*
- **Ravi:** Eu vou subir. Não tenho medo de eco.
- *No terceiro andar, uma luz fraca aparece ao fundo: a saída para o Cume do Vento Branco. Alguém está parado ali, de costas, esperando.*
- *Depois:* flags `nh.cavernaGelo=true`
- *Objetivo no painel:* Saia da Caverna de Gelo pelo topo e chegue ao Cume do Vento Branco → `cume_vento_branco`

### `j13_teo_cume`
*Gatilho:* entrar `cume_vento_branco` (exige nh.cavernaGelo, sem nh.rival5)
- **Téo:** Você demorou. Eu fiquei esperando aqui desde ontem, olhando o vento e pensando se você ia mesmo subir.
- **Ravi:** Eu subi. E o seu pai? Eu o vi no Relógio, Téo. Ele está bem.
- **Téo:** Eu sei. Eu não estou aqui por causa dele. Ou melhor, estou, mas não do jeito que você pensa.
- **Téo:** Eu quero entrar na Liga e ver se a Aurora ainda tem poder sobre quem trabalha lá embaixo. Se tiver, eu quero ser o primeiro a dizer isso para a Elite.
- **Ravi:** Então vamos lutar, e você fala depois que ganhar.
- **Téo:** Se eu ganhar, eu falo. Se você ganhar, eu falo também. Mas eu vou falar, Ravi.
- *Batalha* `nh_rival5`: Rival Téo, prêmio ₽5200. Se perder, a história segue.
  - Equipe: Staraptor Nv 50 (Pássaro Bravo, Combate Corpo a Corpo, Meia-Volta, Ataque Rápido); Arcanine Nv 50 (Investida Flamejante, Velocidade Extrema, Triturar, Carga Selvagem); Umbreon Nv 51 (Jogo Sujo, Luz da Lua, Tóxico, Grunhido); rival:4
- *Depois:* flags `nh.rival5=true`

### `j13_teo_fim`
*Gatilho:* vencer `nh_rival5`
- **Téo:** Tá. Você ganhou. Eu não estou com raiva. Eu estou com frio, e isso é pior.
- **Téo:** Então escuta. Meu pai vai sair da mina e voltar para casa, e eu vou com ele, se ele quiser. A Aurora não vai mais dar as ordens lá embaixo.
- **Téo:** Quando você chegar à Liga, a Elite vai te pedir o seu nome. Diga o nome do Téo. Eu estou lá antes de você, no Portão da Liga.
- **Ravi:** Eu digo, Téo. Até lá.
- *O Téo estende a mão sem muita cerimônia. A luta não resolve tudo, mas ajuda a chegar mais perto.*
- **Ravi:** Eu aperto, Téo. Até a Liga.
- *Depois:* flags `nh.teoFinalPronto=true`
- *Objetivo no painel:* Siga pela Rota 12 até a Liga do Zênite, no alto da cordilheira → `ninho_liga_zenite`

## 14 · Zênite
*Jornada `liga` · boletim do sol no fim: 6h04 · arquivo `src/story/jornada/14-liga.js`*

### `j14_portao`
*Gatilho:* entrar `ninho_liga_zenite` (exige nh.teoFinalPronto, sem nh.chegouLiga)
- *O Caminho do Zênite é uma escada de degraus brancos, com bandeiras de todas as regiões. No topo, o Portão da Liga brilha com a luz do fim da manhã.*
- **Téo:** Ravi! Eu cheguei antes, como prometi. Eu fiquei olhando a Elite de longe, e eles são bem mais assustadores do que pareciam em treino.
- **Téo:** Quando o Aurélio perguntar seu nome, diga. Eu disse o meu e ele fez uma cara engraçada. Acho que ele tinha lido sobre a Aurora nos jornais.
- **Ravi:** Eu digo, Téo. E você fica do meu lado durante as batalhas, pelo menos a da Clarice.
- *Depois:* flags `nh.chegouLiga=true`
- *Objetivo no painel:* Entre no Salão da Liga e enfrente o Aurélio da Madrugada, o primeiro da Elite → `ninho_liga_zenite` (treinadores: elite_aurelio)

### `j14_aurelio`
*Gatilho:* falar `aurelio` (exige nh.chegouLiga, sem trainers.elite_aurelio)
- **Aurélio da Madrugada:** Seu nome, desafiante? Eu gosto de saber quem vai cair na minha frente.
- **Ravi:** Eu sou {jogador}. Vim pela insígnia de cada cidade, e pelo sol que estava atrasado.
- **Aurélio da Madrugada:** Ah, o sol. Eu cresci vendo o sol nascer nesta região. Se ele voltou, foi por causa de quem chegou até aqui sem desistir. Vamos ver se você sustenta a fala.
- *Batalha* `elite_aurelio`: Aurélio da Madrugada, prêmio ₽11000. Se perder, volta a esta cena.
  - Equipe: Mightyena Nv 54 (Triturar, Golpe Baixo, Brincadeira Bruta); Liepard Nv 54 (Talho Noturno, Golpe Surpresa, Meia-Volta); Sableye Nv 55 (Garra Sombria, Jogo Sujo, Fogo-Fátuo); Honchkrow Nv 56 (Talho Noturno, Pássaro Bravo, Golpe Baixo); Weavile Nv 57 (Caco de Gelo, Talho Noturno, Presa de Gelo); Grimmsnarl Nv 58 (Quebra-Espírito, Laço Sombrio, Onda de Trovão, Golpe Baixo)

### `j14_clarice`
*Gatilho:* falar `clarice` (exige trainers.elite_aurelio, sem trainers.elite_clarice)
- **Clarice da Manhã:** O Aurélio perdeu para você? Ele vai ficar insuportável no café da manhã. Eu sou a Clarice, e eu acordo cedo para vencer.
- **Clarice da Manhã:** Minha equipe é de treino pesado. Se você não tem fôlego, a manhã termina antes do sol.
- **Ravi:** Eu passei pelo Aurélio. Não sei se aguento outra luta, mas vou tentar.
- **Clarice da Manhã:** Então tenta. A manhã não espera quem dorme no caminho.
- *Batalha* `elite_clarice`: Clarice da Manhã, prêmio ₽11000. Se perder, volta a esta cena.
  - Equipe: Dachsbun Nv 54 (Brincadeira Bruta, Triturar, Prensa Corporal); Whimsicott Nv 55 (Explosão Lunar, Bola de Energia, Vento a Favor); Mawile Nv 55 (Brincadeira Bruta, Cabeça de Ferro, Golpe Baixo); Florges Nv 56 (Explosão Lunar, Nevasca de Pétalas, Psíquico); Tinkaton Nv 57 (Martelo Gigaton, Brincadeira Bruta, Gume de Pedra); Sylveon Nv 58 (Explosão Lunar, Hipervoz, Beijo Drenante, Mente Calma)

### `j14_brasa`
*Gatilho:* falar `brasa` (exige trainers.elite_clarice, sem trainers.elite_brasa)
- **Seu Brasa do Meio-dia:** Ao meio-dia o sol bate no talo. Sem sombra, sem desculpa. Eu sou o Seu Brasa, e o meu fogo é do tamanho do seu medo.
- **Ravi:** O senhor também sabia da luz atrasada?
- **Seu Brasa do Meio-dia:** Eu sabia que o sol devia estar na minha cabeça às doze, e não às sete. Eu sabia, e não falei. Por isso estou aqui, para ouvir você falar.
- *Batalha* `elite_brasa`: Seu Brasa do Meio-dia, prêmio ₽11000. Se perder, volta a esta cena.
  - Equipe: Torkoal Nv 54 (Onda de Calor, Prensa Corporal, Rochas Furtivas); Scovillain Nv 55 (Lança-Chamas, Gigadreno, Triturar); Camerupt Nv 56 (Poder da Terra, Lança-Chamas, Deslizamento de Rochas); Centiskorch Nv 56 (Chicote de Fogo, Sanguessuga, Triturar); Armarouge Nv 57 (Canhão Blindado, Psicochoque, Carga de Chamas); Arcanine Nv 58 (Investida Flamejante, Velocidade Extrema, Triturar, Carga Selvagem)

### `j14_ibere`
*Gatilho:* falar `ibere` (exige trainers.elite_brasa, sem trainers.elite_ibere)
- **Iberê do Entardecer:** Entardecer é quando a luz vai embora devagar. Eu sou o Iberê, o último da Elite. Eu vi o sol atrasar lá do meu jardim.
- **Iberê do Entardecer:** Quem chega até mim com a equipe inteira ainda de pé merece uma luta de dragão. Vamos ver se você aguenta a pressão.
- **Ravi:** Eu vi o Brasa lá fora. Se ele é do meio-dia, o senhor é do fim da tarde?
- **Iberê do Entardecer:** Exato. E o entardecer é a parte da luta em que o dragão finalmente tem razão. Vamos.
- *Batalha* `elite_ibere`: Iberê do Entardecer, prêmio ₽11000. Se perder, volta a esta cena.
  - Equipe: Flygon Nv 54 (Garra de Dragão, Terremoto, Meia-Volta); Kingdra Nv 55 (Pulso do Dragão, Surfar, Energia Focada); Goodra Nv 56 (Pulso do Dragão, Bomba de Lodo, Relâmpago); Haxorus Nv 56 (Ultraje, Dança do Dragão, Terremoto); Noivern Nv 57 (Pulso do Dragão, Lâmina de Ar, Estrondo); Dragonite Nv 58 (Garra de Dragão, Velocidade Extrema, Furacão, Dança do Dragão)

### `j14_irma_revela` · **REVIRAVOLTA 7**
*Gatilho:* a flag `trainers.elite_ibere` virar verdadeira (exige trainers.elite_aurelio, exige trainers.elite_clarice, exige trainers.elite_brasa, sem nh.irmaRevelada)
- *O salão da Campeã é um anfiteatro de vidro, com o céu aberto no teto. No centro, uma mulher de cabelos claros e casaco longo espera de pé. Ela tem o mesmo rosto da Dra. Véspera.*
- **Campeã Dalva:** Campeã Dalva. Você deve estar confuso, porque eu tenho o mesmo rosto da mulher que você conheceu no Relógio.
- **Campeã Dalva:** Somos gêmeas. Ela é a estrela-vésper, que aparece ao anoitecer. Eu sou a estrela-d'alva, que aparece antes do sol. É o mesmo astro, visto de dois lados.
- **Ravi:** Você sabia da Aurora, então. Quando a Véspera estava tentando parar a luz, você ficou aqui, vencendo torneios.
- **Campeã Dalva:** Eu sabia da Aurora desde o começo. A minha irmã foi quem descobriu a luzita com o professor, e eu fui quem escolheu o silêncio, porque achei que ninguém acreditaria numa campeã que duvida da própria região.
- **Campeã Dalva:** Agora você sabe. E antes de você chegar à última batalha, eu quero que saiba uma coisa: a Véspera nunca deixou de me procurar. E eu nunca respondi.
- *Depois:* flags `nh.irmaRevelada=true`
- *Objetivo no painel:* Descoberta: a Campeã Dalva é a irmã gêmea de Véspera. Ela sabia da Aurora e escolheu o silêncio. Vença a Campeã Dalva no Salão da Campeã → `ninho_liga_zenite` (treinadores: campea_dalva)

### `j14_dalva_luta`
*Gatilho:* falar `dalva` (exige nh.irmaRevelada, sem trainers.campea_dalva)
- **Campeã Dalva:** Você chegou ao fim da Liga, e ainda tem o sol nas costas. Isso é mais do que eu esperava.
- **Campeã Dalva:** Agora, a última batalha. Eu não vou pegar leve, porque a minha irmã nunca me perdoaria se eu pegasse.
- **Ravi:** Eu não vou recuar agora, Dalva. Eu vi o que a sua irmã fez e não vou desistir.
- **Campeã Dalva:** Então vem. Espero que você saiba o que está fazendo, porque eu já não sei.
- *Batalha* `campea_dalva`: Campeã Dalva, prêmio ₽20000. Se perder, volta a esta cena.
  - Equipe: Espeon Nv 62 (Psíquico, Brilho Deslumbrante, Bola Sombria, Sol Matinal); Togekiss Nv 62 (Lâmina de Ar, Brilho Deslumbrante, Esfera de Aura, Pouso); Lycanroc Nv 63 (Acelerrocha, Gume de Pedra, Triturar, Combate Corpo a Corpo); Gardevoir Nv 63 (Explosão Lunar, Psíquico, Fogo Místico); Garchomp Nv 64 (Terremoto, Garra de Dragão, Gume de Pedra, Dança das Espadas) [garchompite]; Volcarona Nv 66 (Dança Ardente, Zumbido de Inseto, Dança Vibrante, Gigadreno)

### `j14_dalva_vencida`
*Gatilho:* vencer `campea_dalva`
- **Campeã Dalva:** Você venceu. A Liga tem um campeão de novo, e a região tem um sol que volta na hora. Eu acho que isso é um acordo justo.
- *A Campeã Dalva tira do peito uma medalha de estrela, com um ponto de luz azul no centro, e a coloca na sua mão.*
- **Campeã Dalva:** Esta é a medalha do Zênite. Ela não vale nada para quem perde, e vale tudo para quem chega até aqui sem desistir.
- *{jogador} é o novo Campeão da Liga do Zênite!*
- *Depois:* flags `nh.campeao=true`
- *Objetivo no painel:* Veja a Dra. Véspera, que chegou ao salão. As duas irmãs querem falar com você → `ninho_liga_zenite`

### `j14_epilogo`
*Gatilho:* depois da cena `j14_dalva_vencida`
- **Dra. Véspera:** Dalva. Você deixou eu esperar dezesseis anos por uma resposta. Eu não sei se vou te perdoar hoje.
- **Campeã Dalva:** Eu também não sei, irmã. Mas o sol nasceu na hora hoje, e isso é mais do que a gente conseguiu juntas há muito tempo.
- **Dra. Véspera:** O sol nasceu. E eu vou voltar a ver ele com a minha cara de sempre, sem medo de que ele atrase de novo.
- **Prof. Jatobá:** Eu devo desculpas a todos vocês. À Lia, ao Tomé, à Iracema e à Dona Zélia. Eu escondi a luzita por medo, e o medo custou caro.
- **Téo:** Pai, você está bem? A Aurora fechou a mina, e o Senhor Solano foi levado por causa do medidor e do sequestro.
- **Heitor:** Estou bem, filho. Estou em casa, e a minha garrafa de mensagem chegou ao lugar certo. Obrigado, Ravi.
- **Mãe:** Ravi! Eu vi tudo na televisão. Você ganhou a Liga e o sol nasceu hoje às seis e quatro. Eu fiz bolo, e está quentinho.
- *A Liga do Zênite fica silenciosa por um momento. Lá fora, o sol da manhã bate em cheio no Planalto, e a neblina que cobre o mar ao sul começa a se mexer, como se estivesse esperando você.*
- *Depois:* flags `nh.epilogo=true` · fim da jornada
- *Objetivo no painel:* Vá ao Mar do Sul quando quiser: a neblina ainda cobre a água, e o pós-jogo começa lá → `mar_do_sul`

## PJ · O mar do sul (pós-jogo)
*Jornada `posjogo` · boletim do sol no fim: 6h04 · arquivo `src/story/jornada/pos-jogo.js`*

### `pj_neblina`
*Gatilho:* a flag `nh.epilogo` virar verdadeira (sem nh.pjNeblina)
- *Lá do Planalto, a neblina do mar do sul parece mais densa a cada manhã. Os pescadores dizem que, desde a queda do Relógio, a névoa começou a recuar devagar.*
- **Pokédex:** Bzzz… Registro novo: presença de luz sem origem nas águas do sul. Intensidade crescente.
- **Ravi:** Então ainda há algo lá embaixo. Vou descobrir o que é.
- *Depois:* flags `nh.pjNeblina=true`
- *Objetivo no painel:* Siga para o Mar do Sul e chegue à ilha do Farol Morto → `ilha_farol_morto`

### `pj_farol_morto`
*Gatilho:* entrar `ilha_farol_morto` (exige nh.pjNeblina, sem nh.pjFarol)
- *O Farol Morto está apagado há décadas. Mas, dentro da torre, uma lâmpada de cristal brilha com uma cor que você nunca viu antes, quente e solar.*
- *Sob a lâmpada, um Pokémon de luz espera imóvel, com as asas abertas. A luz é a dele. Ele não parece bravo, só curioso.*
- **Ravi:** Um Pokémon de luz numa torre apagada. Isso não é coisa do vento.
- *O Pokémon inclina a cabeça, como se tivesse entendido, e dá um passo para trás em direção ao mar.*
- *Depois:* flags `nh.pjFarol=true`
- *Objetivo no painel:* Passe pela neblina das Terras do Ocaso, a oeste, e procure a Vila Fim-do-Mundo → `vila_fim_mundo`

### `pj_ocaso`
*Gatilho:* entrar `vila_fim_mundo` (exige nh.pjFarol, sem nh.pjOcaso)
- *Vila Fim-do-Mundo: casas de pedra no fim de uma estrada que parece não ter fim, com o sol se pondo do outro lado do vale.*
- *Ninguém aqui conhece o Relógio. Mas todos sabem que o sol nasce aqui uma hora depois de Alvorada, e que o horário é o mais justo do mundo.*
- **Ravi:** Uma vila onde o sol nasce depois de Alvorada. Isso parece piada, mas eu não estou rindo.
- *Um pescador ri baixinho e aponta para o vale, onde a luz já começa a dourar a estrada.*
- *Depois:* flags `nh.pjOcaso=true` · só conta a história

## Atores (elenco novo)

| id | quem | ponto | aparece |
|---|---|---|---|
| `tome_celeiro` | Líder Tomé | `fazenda_tome` | na cena |
| `lili_celeiro` | Lili | `fazenda_tome` | na cena |
| `recruta_celeiro` | Recruta Crepúsculo | `fazenda_tome` | na cena |
| `recruta2_celeiro` | Recruta Crepúsculo | `fazenda_tome` | na cena |
| `ebano_celeiro` | Admin Ébano | `fazenda_tome` | na cena |
| `tome_ginasio` | Líder Tomé | `leader_tome` | sempre |
| `recruta_trilha` | Recruta Crepúsculo | `trilha_jequitiba` | na cena |
| `recruta2_trilha` | Recruta Crepúsculo | `trilha_jequitiba` | na cena |
| `absol_bosque` | Absol | `absol_bosque` | na cena |
| `recruta_estufa_n` | Recruta Crepúsculo | `dentro_estufa_lia` | na cena |
| `recruta2_estufa_n` | Recruta Crepúsculo | `dentro_estufa_lia` | na cena |
| `vespera_estufa` | Dra. Véspera | `dentro_estufa_lia` | na cena |
| `teo_sussurro` | Téo | `vila_sussurro` | na cena |
| `lia_estufa` | Líder Lia | `dentro_estufa_lia` | sempre |
| `tito_vila` | Tito | `vila_sussurro` | sempre |
| `jandira_porto` | Tia Jandira | `jandira` | sempre |
| `marina_galpao_ataque` | Líder Marina | `dentro_galpao_barcos` | na cena |
| `recruta_galpao` | Recruta Crepúsculo | `dentro_galpao_barcos` | na cena |
| `recruta2_galpao` | Recruta Crepúsculo | `dentro_galpao_barcos` | na cena |
| `ebano_galpao` | Admin Ébano | `dentro_galpao_barcos` | na cena |
| `vespera_pier` | Dra. Véspera | `porto_espelho` | na cena |
| `marina_galpao_lider` | Líder Marina | `dentro_galpao_barcos` | sempre |
| `nestor_porto` | Seu Nestor | `nestor` | sempre |
| `solano_praca` | Augusto Solano | `palco_solano` | na cena |
| `iracema_inauguracao` | Iracema | `iracema_praca` | na cena |
| `iracema_farol` | Iracema | `farol_entrada` | sempre |
| `recruta_farol` | Recruta Crepúsculo | `dentro_farol_topo` | na cena |
| `recruta2_farol` | Recruta Crepúsculo | `dentro_farol_topo` | na cena |
| `ebano_farol` | Admin Ébano | `dentro_farol_topo` | na cena |
| `jonas_ginasio` | Líder Jonas | `jonas` | sempre |
| `ebano_templo` | Admin Ébano | `templo_raizes_porta` | na cena |
| `aruan_templo` | Monja Aruã | `templo_raizes_porta` | sempre |
| `teo_selva` | Téo | `ninho_acampamento_selva` | na cena |
| `benta_vila` | Vó Benta | `benta` | sempre |
| `zelia_casarao` | Dona Zélia | `dentro_casarao_velas` | sempre |
| `recruta_casarao` | Recruta Crepúsculo | `dentro_casarao_velas` | na cena |
| `recruta2_casarao` | Recruta Crepúsculo | `dentro_casarao_velas` | na cena |
| `ebano_casarao` | Admin Ébano | `dentro_casarao_velas` | na cena |
| `vespera_cemiterio` | Dra. Véspera | `cemiterio_porta` | na cena |
| `absol_cemiterio` | Absol | `absol_lago` | na cena |
| `pipa_aurora` | Pipa | `pipa_aurora` | na cena |
| `lucio_torre_n` | Gerente Lúcio | `dentro_torre_aurora` | na cena |
| `teo_mina7` | Téo | `dentro_torre_aurora` | na cena |
| `vespera_mina` | Dra. Véspera | `dentro_mina_aurora_n4` | na cena |
| `absol_mina` | Absol | `dentro_mina_aurora_n4` | na cena |
| `heitor_mina7` | Heitor | `dentro_mina_aurora_n4` | na cena |
| `solano_mina` | Augusto Solano | `aurora_praca` | na cena |
| `r7_jairo` | Treinador | `ninho_forte_rochedo` | treinador |
| `r7_soraia` | Treinador | `ninho_forte_rochedo` | treinador |
| `g6_dandara` | Aprendiz | `ninho_forte_rochedo` | treinador |
| `g6_tiao` | Aprendiz | `ninho_forte_rochedo` | treinador |
| `bras_roda` | Líder Brás | `ninho_forte_rochedo` | sempre |
| `ebano_ruinas` | Admin Ébano | `sertao_ruinas_entrada` | na cena |
| `recruta_ruinas` | Recruta Crepúsculo | `sertao_ruinas_entrada` | na cena |
| `sina_ruinas` | Absol | `dentro_ruinas_pintada_2` | na cena |
| `teo_sertao` | Téo | `sertao_praca_mandacaru` | na cena |
| `vespera_escarpa` | Dra. Véspera | `ninho_cidade_escarpa` | na cena |
| `sereno_escarpa` | Admin Sereno | `ninho_cidade_escarpa` | na cena |
| `recruta_escarpa` | Recruta Crepúsculo | `ninho_cidade_escarpa` | na cena |
| `graca_mina` | Líder Graça | `ninho_cidade_escarpa` | sempre |
| `g7_juvenal` | Aprendiz | `ninho_cidade_escarpa` | treinador |
| `g7_rita` | Aprendiz | `ninho_cidade_escarpa` | treinador |
| `ebano_vulcao` | Admin Ébano | `ninho_vulcao` | na cena |
| `recruta_vulcao` | Recruta Crepúsculo | `ninho_vulcao` | na cena |
| `recruta2_vulcao` | Recruta Crepúsculo | `ninho_vulcao` | na cena |
| `vulcanologa_casa` | Vulcanóloga Jaciara | `dentro_casa_vulcanologa` | sempre |
| `prof_mirante` | Prof. Jatobá | `ninho_mirante_ventos` | na cena |
| `lucio_mirante` | Gerente Lúcio | `ninho_mirante_ventos` | na cena |
| `celeste_torre` | Líder Celeste | `ninho_mirante_ventos` | sempre |
| `r9_bruno` | Treinador | `ninho_mirante_ventos` | treinador |
| `r9_celia` | Treinador | `ninho_mirante_ventos` | treinador |
| `g8_gael` | Aprendiz | `ninho_mirante_ventos` | treinador |
| `g8_iris` | Aprendiz | `ninho_mirante_ventos` | treinador |
| `solano_relogio` | Augusto Solano | `relogio_pedra` | na cena |
| `lucio_relogio` | Gerente Lúcio | `relogio_pedra` | na cena |
| `sereno_relogio` | Admin Sereno | `relogio_pedra` | na cena |
| `prof_relogio` | Prof. Jatobá | `relogio_pedra` | na cena |
| `vespera_relogio` | Dra. Véspera | `relogio_pedra` | na cena |
| `absol_relogio` | Absol | `relogio_pedra` | na cena |
| `teo_relogio` | Téo | `relogio_pedra` | na cena |
| `heitor_relogio` | Heitor | `relogio_pedra` | na cena |
| `prof_geada` | Prof. Jatobá | `dentro_observatorio_boreal` | na cena |
| `teo_cume` | Téo | `ninho_cume` | na cena |
| `teo_portao` | Téo | `ninho_liga_zenite` | na cena |
| `aurelio_liga` | Aurélio da Madrugada | `ninho_liga_zenite` | sempre |
| `clarice_liga` | Clarice da Manhã | `ninho_liga_zenite` | sempre |
| `brasa_liga` | Seu Brasa do Meio-dia | `ninho_liga_zenite` | sempre |
| `ibere_liga` | Iberê do Entardecer | `ninho_liga_zenite` | sempre |
| `dalva_liga` | Campeã Dalva | `ninho_liga_zenite` | sempre |
| `vespera_liga` | Dra. Véspera | `ninho_liga_zenite` | na cena |
| `prof_liga` | Prof. Jatobá | `ninho_liga_zenite` | na cena |
| `heitor_liga` | Heitor | `ninho_liga_zenite` | na cena |
| `teo_liga` | Téo | `ninho_liga_zenite` | na cena |

---

## Saída do teste (`node tools/teste-jornada.mjs`)

```
História nova: 16 segmentos, 139 cenas, 570 falas, 93 atores, 50 batalhas.
Reviravoltas: 1=j07_mina_medidor · 2=j07_prof_telefone · 3=j08_sina_revela · 4=j09_traducoes · 5=j11_vela_revelada · 6=j12_vespera_aliada · 7=j14_irma_revela
Boletins do sol: 6h05 → 6h12 → 6h19 → 6h27 → 6h34 → 6h42 → 6h51 → 7h03 → 7h11 → 6h04
Pendências do mapa (solidos) aceitas: relogio_pedra

Avisos (18):
  - j02_nando: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j02_bel: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j03_zeca: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j03_taina: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j04_saulo: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j04_duda: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j06_odete: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j06_ciro: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j07_rota7_jairo: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j07_rota7_soraia: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j07_dandara: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j07_tiao: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j09_juvenal: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j09_rita: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j11_bruno: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j11_celia: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j11_gael: cena de uma caixa só (ok se for treinador que avista o jogador)
  - j11_iris: cena de uma caixa só (ok se for treinador que avista o jogador)

OK: nenhum erro estrutural.
```
