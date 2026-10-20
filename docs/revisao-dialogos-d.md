# Revisão dos diálogos, parte D (segmentos 12 a 14 e pós-jogo)

Escopo: `src/story/jornada/12-relogio.js`, `13-geada.js`, `14-liga.js` e `pos-jogo.js`. Só mudou o texto das falas
(e as frases de objetivo). Ids, gatilhos, flags, atores, batalhas, posições e a estrutura das cenas ficaram como estavam.
Falas a mais: uma narração em `j12_vela_acesa` (item 18) e uma caixa longa dividida em duas em `j14_irma_revela`
(itens 48 e 49). Todo o resto é troca de texto. Comentários de cabeçalho também foram atualizados.

Pedido do Matheus: "muitas frases nem fazem sentido ou não conversam com as frases anteriores". Por isso a lista
abaixo está em ordem de cena, e cada item diz qual frase anterior ela precisa conversar.

## Problemas encontrados e correções

### 12-relogio.js (Relógio de Pedra)

| # | Cena | Antes → Depois | Por quê |
|---|---|---|---|
| 1 | `j12_chegada` (Solano) | "O Relógio fecha o sol quando as oito estão acesas, e abre o cadeado quando alguém sopra a chama." → "Quando as oito chaves estiverem acesas, o cadeado se abre. Você não precisa entender. Só precisa me entregar a chama." | Contradizia `j09_traducoes` (juntar as oito pedras ABRE o cadeado). |
| 2 | `j12_chegada` (Sereno) | "Ele trouxe a vela, Senhor Solano? Eu trouxe as sete. Já estão nos pedestais." → "Senhor Solano, as sete pedras já estão nos pedestais. Falta só a chama do oitavo." | A pergunta não tinha resposta na fala seguinte. |
| 3 | `j12_chegada` (narração) | "Em cada pedestal, um padrão de luz gira devagar..." → "Sete pedestais já brilham, cada um com a cor de um ginásio." | Frase mais direta; o oitavo continua apagado, como no `j12_solano_cai`. |
| 4 | `j12_chegada` (objetivo) | "Enfrente a Dra. Véspera, que bloqueia a escada do Relógio" → "Suba a escada do Relógio e enfrente a Dra. Véspera, que quer saber quem você é" | Na cena, a Véspera não bloqueia nada; a motivação dela é o que a cena mostra. |
| 5 | `j12_vespera_desafio` (Véspera) | "Antes de você acender qualquer coisa, eu quero saber quem está do outro lado da chama." / "Vamos ver se você segura a luz quando ela pesa." → "Eu me enganei sobre este Relógio por dezesseis anos. Não vou deixar a Aurora usar o meu erro." / "Antes de tocar na chama, quero ver se você aguenta a pressão." | A metáfora da "luz que pesa" era vaga. Agora a Véspera diz por que desconfia: ela se enganou sobre o Relógio (ver `j09_traducoes`). |
| 6 | `j12_vespera_desafio` (jogador) | "Então eu vou segurar a luz com a mão aberta. Não vou fechar o punho." → "Eu não trouxe a vela para o Solano. Ela está comigo desde Lamparina, e eu vou protegê-la." | A resposta agora responde à pergunta da Véspera e liga com a vela de Lamparina (`j06`, `j11_vela_revelada`). |
| 7 | `j12_vespera_desafio` (Véspera) | "Esse é o primeiro pensamento sensato que eu ouço hoje." → "Boa resposta. Então prove, porque eu já vi muita gente prometer e deixar a chama apagar." | Mantém o desafio e prepara a luta. |
| 8 | `j12_vespera_aliada` (Véspera) | "Quando o Necrozma sair, ele vai comer toda a luz do Planalto..." (repete o que a Zélia disse no Mirante) → "Ele quer capturar o Necrozma e vender a luz do Planalto. O Sereno trocou as minhas traduções para isso." | A primeira versão repetia `j11_solano_liga` e `j11_vela_revelada`. Agora a fala traz o motivo novo (vender a luz) e liga com a traição do Sereno. |
| 9 | `j12_vespera_aliada` (Véspera) | "Eu estou do seu lado agora. Não por você. Por ela, por mim e pelo sol que eu deixei de ver." → "É pela Sina, por mim e pelo sol que eu deixei de ver." | "Ela" não tinha antecedente; agora é a Sina, que aparece em `j08` e no epílogo. |
| 10 | `j12_vespera_aliada` (Téo, Heitor) | "Eu e o meu pai! A gente saiu da mina pelo túnel do nível quatro e vim direto." / "...e depois da mina, eu entendi o porquê." → "Eu e meu pai saímos da mina pelo túnel do nível quatro. Eu não aguentei esperar." / "...agora eu entendo por quê." | Ficou mais direto e fiel à mina de `j07`. "Depois da mina" era confuso. |
| 11 | `j12_solano_batalha` (Solano) | "A luz é a única coisa que nunca deixou ninguém no escuro." → "Eu já tenho contratos com metade do Planalto." | Contradizia o plano do Solano (vender a luz e fazer o escuro render lucro). |
| 12 | `j12_solano_batalha` (Solano) | "Lúcio, Sereno, às pedras." → "Lúcio, Sereno, protejam as pedras." | Frase sem sentido sozinha. |
| 13 | `j12_solano_batalha` (Véspera) | "...a noite é ela que nos protege da sua luz..." → "Eu sonhava com uma noite que protegesse as pessoas. Você só quer uma noite que dê lucro, Solano." | Reconta a virada: a Véspera queria a noite para proteger, e o Solano quer a noite para lucrar. |
| 14 | `j12_solano_batalha` (narração) | "O Téo e o Heitor ficam de pé ao seu lado, sem dizer nada." → "O Téo entra ao seu lado, com a Poké Bola já na mão." | A batalha é em dupla com o Téo (`dupla: 'teo'`). O Téo precisa aparecer lutando. |
| 15 | `j12_solano_cai` (jogador, Solano) | "Ele ainda tem medo do escuro, Solano?" → "A última página tem o desenho de um menino segurando o sol." / "Quem deixou você entrar naquela casa? Eu prometi ao Tiago que ninguém mais ficaria no escuro." | O Tiago morreu de febre aos 6 anos (`cap04.js`). A pergunta original tratava o menino como vivo e era cruel sem motivo. A nova versão usa o desenho do diário (`cap12.js`). |
| 16 | `j12_solano_cai` (narração) | "O Sereno deixa cair a caixa com as sete pedras, e elas rolam até os pedestais." → "O Sereno larga a caixa vazia no chão. Ninguém tenta recuperar nada." | Contradizia o `j12_chegada`, em que as sete pedras já estavam nos pedestais. |
| 17 | `j12_solano_cai` (Prof) | "A chave da gaiola está no bolso do Lúcio, ele não vai reagir." → "A chave da gaiola está no bolso do Lúcio. Ele não vai reagir, pode pegar." | Mais natural. |
| 18 | `j12_vela_acesa` (Zélia) | "Você está aqui, pelo rádio" / "...a chama é a última coisa que segura a noite." → Narração: "Pelo rádio, a voz da Dona Zélia chega baixinha..." / "Essa chama mostra se o Relógio está aberto ou fechado. Mantenha ela acesa só para fechar." | "Ela está aqui, pelo rádio" se contradizia. A Zélia já tinha dito, em `j11_vela_revelada`, que a chama mostra se o Relógio está aberto ou fechado. Agora a fala segue isso. |
| 19 | `j12_vela_acesa` (narração) | "Você coloca a Vela Eterna no oitavo pedestal e sopra a chama. Ela não apaga..." → "...acende o pavio. A chama se firma, azul, sem tremer e sem aquecer nada." | Soprar a chama apaga a vela, e o `j11` pedia a vela acesa. Também é o que o Solano pediu no Mirante. |
| 20 | `j12_necrozma` (Necrozma, narração) | "O Necrozma sai do Relógio, pequeno e escuro..." / "KRRRRAAAAAA!" (repetido) → "O Necrozma sai do Relógio. A juba de cristal está rachada..." / "Krrr… luz… luz…" | O rugido já tinha sido usado na cena anterior. "Pequeno" enfraquecia o chefe. |
| 21 | `j12_necrozma` (narração) | "Lunala pousa ao seu lado e abre as asas..." → "A chama azul sobe pelo pedestal e envolve o Necrozma por um instante..." | A Lunala nunca apareceu antes na história. Ela ficou para o pós-jogo (ver pendências). |
| 22 | `j12_necrozma` (jogador) | "Você só está preso desde que o Relógio foi fechado." → "Você só está com fome, porque ficou preso no escuro tempo demais." | A fome de luz é o motivo do Necrozma. A frase original não dizia nada sobre isso. |
| 23 | `j12_necrozma_foge` (narração) | "...pequeno de novo..." → removido; "A juba... Afunda numa fenda..." → "A armadura se parte, e o Necrozma cai numa fenda... Olha para você e some na terra." | Frase mais clara e sem o "pequeno" do item 20. |
| 24 | `j12_necrozma_foge` (Véspera) | "Talvez ele nunca volte, se as oito insígnias estiverem fechadas." → "Se o Relógio ficar fechado, talvez nunca volte." | A frase falava das insígnias antes de elas aparecerem na cena seguinte. |
| 25 | `j12_necrozma_foge` (Véspera, captura) | "Cuida dele: ele passou mil anos com fome de luz." → "Cuide bem dele. Ele passou tempo demais preso no escuro para confiar em alguém." | "Mil anos" era uma referência de lore que o jogo nunca apresentou. |
| 26 | `j12_necrozma_foge` (narração) | "As raízes de luz param de puxar. Elas começam a brilhar ao contrário: para fora." → "A luz que descia pelas raízes de cristal se inverte e volta para o céu..." | "Raízes de luz" é o termo do `j05`, e a frase final agora fica clara. |
| 27 | `j12_selo_insignias` (narração) | "Tomé, Lia, Marina, Jonas, Lamparina, Brás, Graça, Celeste." → "Tomé, Lia, Marina, Jonas, Zélia, Brás, Graça e Celeste." | **Erro de fato.** Lamparina é a cidade; quem lidera o ginásio é a Zélia. |
| 28 | `j12_selo_insignias` (narração) | "Oito fios, uma pedra em cada." → "São oito fios." | A Zélia não entrega uma pedra, entrega a chama. |
| 29 | `j12_selo_insignias` (Véspera) | "Pela primeira vez em dezesseis anos, o Relógio está fechado, e não aberto." → "Depois de tudo que a Aurora tirou daqui, o Relógio volta a ficar fechado, do jeito que deveria." | O Relógio já estava fechado antes (a Zélia diz isso no `j11`). A frase original misturava as datas. |
| 30 | `j12_boletim_final` (mãe) | "...que o bolo está quentinho." → removido (fica no epílogo). | O bolo aparecia duas vezes seguidas. |
| 31 | `j12_boletim_final` (jogador) | "Eu volto amanhã cedo, mãe. Mas antes eu preciso atravessar..." → "Eu chego amanhã cedo, mãe. Antes, preciso atravessar a Cordilheira Geada. A Liga não espera." | "Volto" soava como se ele fosse para casa agora, e o objetivo manda para a Geada. |

### 13-geada.js (Cordilheira Geada)

| # | Cena | Antes → Depois | Por quê |
|---|---|---|---|
| 32 | `j13_vila_geada` (Prof) | "Ravi, está me ouvindo? Eu estou no observatório... Um rapaz da estalagem me emprestou o telefone." → "Ravi! Depois do Relógio eu não podia ficar parado. A aurora daqui é a melhor medição que eu tenho." | O professor está fisicamente no observatório (ator `prof_geada`). Telefone não fazia sentido, e a volta dele ao Norte ficou sem explicação. |
| 33 | `j13_vila_geada` (Prof) | "...e ninguém volta sem ouvir a própria voz de volta." → "...e às vezes não dá para saber quem responde." | Liga com o eco da cena `j13_caverna_gelo`. |
| 34 | `j13_vila_geada` (jogador) | "O professor no observatório. Eu não imaginava..." → "O senhor não parece cansado depois de tudo. Fico feliz de ver." | Fala de reação humana, ligada ao que o Prof. acabou de dizer. |
| 35 | `j13_teo_cume` (Téo) | "Eu quero entrar na Liga e ver se a Aurora ainda tem poder sobre quem trabalha lá embaixo..." → "Mudei de lado na mina e não sei se aguento ficar do lado certo. Quero uma luta de verdade antes da Elite." | **Contradição.** Depois do Relógio o Téo já está do lado do jogador. A versão anterior o fazia defender a Aurora. Agora o motivo é a mudança de lado (`j07_mina_medidor`). |
| 36 | `j13_teo_cume` (Téo) | "Se eu ganhar, eu falo. Se você ganhar, eu falo também..." → "Se eu ganhar, eu falo. Se perder, falo do mesmo jeito..." | Frase mais limpa. |
| 37 | `j13_teo_fim` (Téo) | "Meu pai vai sair da mina e voltar para casa..." → "Meu pai já saiu da mina, e eu vou com ele para casa. Nenhuma companhia manda mais em nós dois." | **Contradição.** O Heitor já saiu da mina no `j12`. |
| 38 | `j13_teo_fim` (Téo) | "Eu estou lá antes de você, no Portão da Liga." → "Eu estou no Portão da Liga, esperando você." | Mais direto e ligado ao `j14_portao`. |
| 39 | `j13_teo_fim` (jogador) | "Eu aperto, Téo. Até a Liga." (repetia "Até a Liga") → "Até a Liga, Téo." | Remove a repetição. |
| 40 | `j13_teo_fim` (objetivo) | "Volte ao Planalto e suba o Caminho do Zênite (Rota 12), ao norte do Relógio de Pedra, até a Liga" → "Desça ao Planalto e suba o Caminho do Zênite, na Rota 12, até a Liga do Zênite" | Ordem do caminho mais clara. |

### 14-liga.js (Liga do Zênite)

| # | Cena | Antes → Depois | Por quê |
|---|---|---|---|
| 41 | `j14_portao` (Téo) | "Eu disse o meu e ele fez uma cara engraçada. Acho que ele tinha lido sobre a Aurora nos jornais." → "Quando o Aurélio perguntar quem te trouxe até aqui, diga o meu nome. Eu fiz essa promessa lá em cima." | A frase original trazia um detalhe novo (jornais) que não levava a lugar nenhum. Agora cumpre a promessa do `j13_teo_fim`. |
| 42 | `j14_aurelio` (Aurélio) | "Ah, o sol. Eu cresci vendo o sol nascer nesta região. Se ele voltou, foi por quem chegou até aqui sem desistir..." → "Eu cresci vendo o sol nascer por aqui. Se ele voltou, foi por gente que não desistiu. Veremos se você sustenta isso." | Mais firme, e a personalidade do Aurélio (madrugada, sóbrio) fica mais clara. |
| 43 | `j14_clarice` (Clarice) | "...Se você não tem fôlego, a manhã termina antes do sol." → "...a manhã termina antes de você." | "Antes do sol" não tinha ligação com a luta. |
| 44 | `j14_brasa` (Brasa) | "...o meu fogo é do tamanho do seu medo." → "...o meu fogo não tem medo de ninguém." | Mais gruta e menos efeito de frase. Combina com o "não falei" que vem depois. |
| 45 | `j14_brasa` (Brasa) | "Eu sabia que o sol devia estar... Sabia, e não falei." → "Sabia que o sol devia estar às doze, e não às sete. Sabia e não falei. Por isso estou aqui, para ouvir você." | Mesma ideia, uma frase a menos de peso. |
| 46 | `j14_ibere` (Iberê) | "...e o entardecer é a parte da luta em que o dragão finalmente tem razão." → "...No entardecer a luz cai devagar, e quem se distrai perde o dragão." | A frase original não dizia nada. A nova leva à ideia de que o Iberê é paciente. |
| 47 | `j14_irma_revela` (narração) | "O salão da Campeã é um anfiteatro de vidro..." → "Um anfiteatro de vidro, com o céu aberto no teto..." | Mais curta. |
| 48 | `j14_irma_revela` (Dalva) | "Somos gêmeas. Véspera é a estrela-vésper..." → duas falas: "Somos gêmeas. Ela é a estrela-vésper, que aparece ao anoitecer." / "Eu sou a estrela-d'alva..." | Caixa mais curta e a ideia fica separada. |
| 49 | `j14_irma_revela` (Dalva) | "...achando que ninguém acreditaria numa campeã que duvida da própria região." → "Eu escolhi o silêncio." + "Denunciar a região arruinaria a minha carreira. Eu preferi ficar calada e vencer." | O motivo do silêncio era confuso. Agora é a carreira. |
| 50 | `j14_irma_revela` (Dalva) | "A minha irmã foi quem descobriu a luzita com o professor..." → "Minha irmã descobriu a luzita com o professor" | Mesma informação, mais curta. |
| 51 | `j14_dalva_luta` (Dalva) | "Você chegou ao fim da Liga, e ainda tem o sol nas costas." → "Você chegou até aqui com o sol de volta nas costas." | Frase mais limpa. |
| 52 | `j14_dalva_vencida` (Dalva) | "...e a região tem um sol que volta na hora. Eu acho que isso é um acordo justo." → "Você venceu. A Liga tem um novo campeão, e o sol nasce na hora. Não é pouca coisa." | "Acordo justo" não fazia sentido. |
| 53 | `j14_epilogo` (mãe) | "Eu vi tudo na televisão..." → "Eu ouvi tudo no rádio..." | No jogo a mídia é o rádio (Rádio Alvorada); não há televisão. |
| 54 | `j14_epilogo` (Heitor) | "...e a minha garrafa de mensagem chegou ao lugar certo." → "Estou bem, filho, e estou em casa. Obrigado, Ravi, por ter encontrado a verdade antes de todo mundo." | "Garrafa de mensagem" era uma referência a uma missão que não existe nesta trama. |
| 55 | `j14_epilogo` (Téo) | "A Aurora fechou a mina, e o Senhor Solano foi levado..." → "...e o Senhor Solano vai responder pelo medidor e pelo sequestro." | A prisão do Solano não aparece em cena, então o texto não pode afirmar que ele foi levado. |
| 56 | `j14_epilogo` (Prof) | "Eu devo desculpas a todos vocês..." → "Devo desculpas à Lia, ao Tomé, à Iracema e à Dona Zélia..." | Mais direto e sem o "todos vocês" vago. |
| 57 | `j14_epilogo` (narração) | Sem a Sina; a narração final só falava do mar. → "No Planalto, a Sina olha para o sol e, pela primeira vez, não traz aviso nenhum..." | **Fecha o arco da Sina** (`j08_sina_revela`, "aviso antes de cada desastre"). |
| 58 | `j14_*` (Elite, pós-batalha) | As falas de depois da vitória eram a mesma fala de antes ("Madrugada é a hora em que a gente aprende a esperar..."). → Cada integrante ganhou uma fala de pós-batalha no campo `padrao`: Aurélio ("Perdi para quem não desistiu..."), Clarice ("Bem ganho. Agora vá ao Brasa..."), Brasa ("Passei anos calado, e você me fez falar..."), Iberê ("A luz foi embora devagar, como eu gosto...") | O brief pedia uma linha pré e uma pós-batalha por integrante. O `padrao` é a fala que o motor mostra quando nenhuma cena responde (`roteiro.js`). Cada personalidade fica distinta: sóbrio, enérgico, rude e poético. |

### pos-jogo.js

| # | Cena | Antes → Depois | Por quê |
|---|---|---|---|
| 59 | `pj_neblina` (narração) | "...parece cada manhã mais densa..." / "...começou a recuar" → "...parece mais clara a cada manhã. Dizem os pescadores que ela recua desde o Relógio." | Contradição interna: "mais densa" e "recuar" na mesma frase. |
| 60 | `pj_neblina` (narração) | "...desde a queda do Relógio" → "...desde o Relógio" | O Relógio foi selado, não caiu. |
| 61 | `pj_farol_morto` (narração) | "Dentro da torre, porém, uma lâmpada..." → "Mas dentro da torre, uma lâmpada de cristal brilha, quente e dourada." | Mais curta. |
| 62 | `pj_ocaso` (narração, jogador) | "Ninguém aqui conhece o Relógio. Mas todos sabem que o sol nasce aqui uma hora depois de Alvorada..." → "Ninguém aqui conhece o Relógio, mas todos contam as horas pelo sol. E concordam que ele anda devagar." | A versão antiga afirmava que o sol nasce depois de Alvorada numa região a oeste, o que não faz sentido na geografia do jogo, e a frase "o horário é o mais justo do mundo" não levava a lugar nenhum. |
| 63 | `pj_relogio` (pokédex, jogador) | "Solgaleo. Ele estava na armadura do Necrozma, e agora está livre." → Pokédex: "Registro: Solgaleo, Pokémon do sol. Origem desconhecida. Ele não está preso. Ele escolheu ficar." / Jogador: "Um Pokémon que veio até aqui por vontade própria." | A armadura do Necrozma nunca apareceu na história. O nome agora vem da Pokédex, como acontece com os lendários. |
| 64 | `pj_lunala` (narração, jogador) | "O santuário sem nome é o lado escuro do que você viu no Relógio..." → "O santuário sem nome fica do lado oposto ao Relógio..." / "Lunala. Se o Solgaleo guardava o dia, ela deve ter guardado a noite. E a noite também ficou presa." | "Lado escuro" era vago. A dupla dia/noite agora tem lógica. |

## Pendências que o texto não resolve

1. **Lunala na luta do Necrozma.** O cabeçalho do `12-relogio.js` dizia que ela ajudava o jogador, mas a batalha não tem
   `aliado` ligado (o motor só usa `aliado` com `dupla`, ver pendência 4 de `docs/jornada-roteiro.md`). A narração que
   a colocava em campo foi removida (item 21). Se o Matheus quiser a Lunala como aliada na luta, é preciso ligar o campo no motor.
2. **Captura do Necrozma.** `captura: true` é só anotação; o texto cobre os dois finais (vencer e fugir, ou capturar), mas
   o motor precisa confirmar que a bola funciona nessa batalha.
3. **Elite e `padrao`.** As falas pós-batalha ficam no campo `padrao` do ator permanente, porque o elenco da Elite não tem
   `apos`. Testar no jogo que a fala aparece depois da vitória.
4. **Véspera na Liga.** O epílogo põe a Véspera no salão da Liga sem mostrar a viagem. Só uma cena nova resolveria isso;
   o texto não consegue.
5. **Prisão do Solano.** Não há cena da prisão. O epílogo fala que ele "vai responder", sem afirmar que foi preso.
6. **Dezesseis anos.** A data aparece em três lugares (`j07`, `j09`, `j14`), todos de acordo com a descoberta da luzita. Não há
   contradição no texto novo, mas vale checar as datas de `j11_solano_liga` se o Matheus mudar esse número.
7. **Mapa.** O objetivo do pós-jogo cita `santuario_crepusculo` (santuário sem nome) e `relogio_pedra`. Os pontos ainda
   dependem do agente de mapas (`solidos`), como já estava na lista de pendências do roteiro.

## Testes

- `node tools/teste-jornada.mjs`: sem erros estruturais. Os avisos (cenas de uma caixa só em treinadores que avistam o
  jogador, e um objetivo sem verbo em `10-brasas.js`, que não é deste trabalho) já existiam antes.
- `node tools/teste-jornada-completa.mjs`: "OK: a jornada inteira é jogável na ordem, sem atalhos."
- `node tools/verificar_dados.mjs`: "Tudo certo."
