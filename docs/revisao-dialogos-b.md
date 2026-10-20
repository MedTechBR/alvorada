# Revisão de diálogos, segmentos 04 a 07 e mantidas (Cidade Coral, Jandaias, Lamparina, Aurora)

Pedido do Matheus: "muitas frases nem fazem sentido ou não conversam com as frases anteriores. A história precisa ser
envolvente e fazer sentido, com diálogos conversando entre si."

Escopo: só texto de falas, `padrao` dos atores e textos de objetivo. Não mexi em ids de cena, gatilhos, flags, atores,
batalhas, posições nem em alvos (`alvo`, `spot`). O `{jogador}` e o "Ravi" da Mãe foram mantidos como estão no código.

## 1. Problemas encontrados (arquivo · cena · antes → depois · por quê)

### 04-coral.js (Cidade Coral, Farol, Jonas)

1. `j04_chegada` · "as luzes do farol estão apagadas há dois dias" → "as luzes piscam fora de hora há dois dias". Por quê: nas
   cenas seguintes o farol gira, pisca e tem gerador girando sozinho. "Apagado" contradiz tudo.
2. `j04_chegada` · "Um farol apagado e um líder que não quer falar" → "Um farol que pisca sozinho e uma cidade que faz silêncio".
   Por quê: o Jonas ainda não recusou nada; ele diz depois que já ia pedir ajuda.
3. `j04_chegada` · ordem das falas. A descrição da chegada vinha depois das reações do jogador. Agora a chegada vem primeiro.
4. `j04_farol_entrada` · recruta: "Quando o sol parar de nascer, todo mundo vai entender por quê." → "Quando o sol deixar de nascer, você vai entender por quê." Por quê: a frase falava com "todo mundo" e não com o jogador.
5. `j04_farol_entrada` · Ébano: "Se você está aqui, então ouviu o rádio." removido. Por quê: o rádio nunca foi citado na cena.
6. `j04_farol_entrada` · Ébano: "Então vem pegar a pedra!" → "Então vem tirar a pedra de mim!". Por quê: "pegar" era genérico; agora a briga é pessoal.
7. `j04_pedra_recuperada` · "Ao cair, a pedra do farol rola pela escada" → "A pedra escapa da mão do recruta". Por quê: a pedra não tinha motivo para cair "ao cair" o Ébano.
8. `j04_pedra_recuperada` · "estão do mesmo lado?" → "estão trabalhando juntas aqui?". Por quê: pergunta com base na cena (a troca do gerador).
9. `j04_saulo` · "O Jonas usa um Lanturn no final" → "O Jonas fecha com um Ampharos". Por quê: o Lanturn não está na equipe do Jonas (309, 125, 81, 181). O aviso tinha que bater com a batalha.
10. `j04_duda` · "A ordem? A Iracema sabe. Ela sabe tudo deste farol." → "Os três geradores precisam girar na mesma ordem. Só a Iracema sabe qual é". Por quê: a dica da ordem agora explica o puzzle.
11. `j04_jonas_ginasio` · "Eu já ia pedir ajuda. Mas vamos batalhar primeiro. Eu sou eletricidade, e eletricidade não espera..." → versão curta. Por quê: frase inchada; a segunda fala repetia a quarta.
12. `j04_jonas_ginasio` · jogador: "trouxe também os recados da Iracema e do Solano" → "a Iracema mandou dizer que a Aurora trocou o gerador três". Por quê: o jogador nunca recebeu recado do Solano; o recado da Iracema é o que a cena contou.
13. `j04_jonas_ginasio` · Jonas: "Não quero conversa sem eletricidade." (repetia "batalhar primeiro") → "Então me mostra o que você aprendeu. Depois a gente conversa."
14. `j04_jonas_ginasio` · `padrao` do Jonas: "Religue os três geradores" → "Ajuste os três geradores". Por quê: os geradores estão girando errado, não desligados.
15. `j04_sq_diario_inicio` · "Quarenta anos de caderno" → "Trinta anos de caderno". Por quê: na inauguração a Iracema disse "trinta anos cuidando daquela luz".
16. `j04_sq_diario_achado` · "Dia 14: a luz gira sozinha. Acende mais cedo lá embaixo e mais tarde aqui em cima." → "Dia 14: o farol gira no horário que a Aurora mandou, não no do sol... É o sol que está atrasado." Por quê: a versão antiga era confusa, e esta frase é a pista da reviravolta 1.
17. `j04_sq_diario_achado` · jogador: "Então era isso que a Iracema ouvia pelo rádio." → "Então é isso que faz o farol piscar fora de hora." Por quê: o rádio nunca apareceu na cena.
18. `j04_sq_diario_fim` · "deixou o nome no meu diário" → "assinou a troca no meu próprio caderno". Por quê: o diário diz "Assinado: A. Solano", então a troca de palavra fica precisa.
19. `j04_sq_diario_fim` · Iracema: "eu pensando que era o rádio" → "achando que era interferência"; e a frase sobre "gente presa na luz" foi reduzida a "Cuide dele, por favor." Por quê: a frase antiga era genérica e longa.
20. `j04_sq_diario_fim` · jogador: "Ele disse que quer ajudar" → "Eu levo o diário ao Jonas". Por quê: o Jonas ainda não tinha dito nada na ordem da cena.
21. `j04_boletim4` · jogador: "estou voltando para casa" → "prometo voltar para casa quando o sol estiver no lugar". Por quê: o jogador segue para as Jandaias, não para casa.
22. `j04_boletim4` · radio: "O farol voltou a piscar, mas com atraso, segundo os marinheiros." → "segue piscando fora de hora". Por quê: coerência com o farol que continua estranho.

### 05-jandaias.js (Jandaias, Templo, Téo)

23. `j05_chegada` · "Ninguém aqui tem insígnia para mostrar. Mas a Monja Aruã..." → "A Monja Aruã, do templo, disse ao rádio...". Por quê: a frase sobre insígnia não tinha função.
24. `j05_templo_ebano` · Ébano: "A Dra. Véspera precisa dela para fechar a noite." → "para manter a noite". Por quê: "fechar a noite" não tinha sentido.
25. `j05_templo_ebano` · Ébano: "Você é bom em impedir coisas, pelo que o Téo conta." → "Você já atrapalhou a Crepúsculo em três cidades." Por quê: o Téo não conta nada ao Ébano; as três cidades (Campina, Porto Espelho, Coral) são fatos do jogo.
26. `j05_templo_fim` · Ébano: "A Dra. Véspera disse que a Aurora vai cobrar..." → "A Aurora vai querer de volta, e a Aurora cobra caro." Por quê: o trecho repetia a Véspera sem que ela estivesse na cena.
27. `j05_templo_fim` · Aruã: "leve esta raiz de volta para a Lia, no bosque" → a raiz fica no templo ("Enquanto estiver no lugar, a selva resiste ao cabo"). Por quê: o pedido para a Lia não tinha retorno em cena nenhuma. Ver item D, resolvido na revisão de 20/10.
28. `j05_rival3` · jogador: "a Crepúsculo estava roubando a raiz da Aurora" → "a Aurora passou um cabo por dentro do templo, e a Crepúsculo tentou levar a raiz". Por quê: a frase anterior citava a Crepúsculo como se a Aurora fosse a dona da raiz, e o cabo é a prova do templo.
29. `j05_rival3` · Téo: "ele manda dinheiro todo mês" → "meu pai trabalha na Mina Aurora". Por quê: detalhe que a cena não precisa e que cria uma dúvida nova.
30. `j05_rival3_fim` · "O Seu Nestor, do porto, achou uma garrafa no manguezal." → "Achei uma garrafa no manguezal, perto do porto." Por quê: quem achou a garrafa foi o jogador (cena `j03_sq_garrafa_achada`).
31. `j05_rival3_fim` · a prova não existia sem a missão secundária, e a fala do Téo ficava solta. Adicionada uma fala sem condição ("Sem prova, eu continuo do lado da Aurora"), com `semFlag: nh.bilheteHeitor`. Por quê: se o jogador não fizer a garrafa, a conversa ainda fecha. Antes ficava sem resposta.
32. `j05_rival3_fim` · Téo: "Ele escreve assim no escuro, desde que eu era pequeno… Ele nunca me contou nada de nível quatro." → versão mais curta e clara. Por quê: o bilhete diz "de quem escreve no escuro"; a frase antiga repetia isso com outras palavras.

### 06-lamparina.js (Lamparina, Casarão, Cemitério, Vela, Zélia)

33. `j06_casarao_ataque` · recruta2: "Pode trazer o treinador, Admin Ébano. Ele quer ver a cara dele." → "Avisa o Admin Ébano. Ele disse que o garoto ia aparecer por aqui." Por quê: o Ébano já está na cena; a fala antiga pedia que ele viesse.
34. `j06_casarao_ataque` · jogador: "Você está fazendo isso no escuro" → "Você rouba pedras no escuro". Por quê: frase mais clara e com a acusação que a cena pede.
35. `j06_casarao_fim` · Zélia: "Você fica com a pedra, querido. Se eles voltarem, eu não tenho mais força para segurar a porta." → "Deixe a pedra onde está, querido. Eu não tenho mais força para segurar a porta se eles voltarem." Por quê: a pedra fica na lanterna, com a Zélia. A frase antiga dava a pedra ao jogador, e a cena não tem nada que faça essa entrega.
36. `j06_cemiterio_vespera` · Véspera: "Péssimo para quem quer dormir." → "Isso atrapalha quem quer que a noite dure". Por quê: "dormir" não conversa com a fala anterior sobre roubar pedras.
37. `j06_cemiterio_vespera` · Véspera: "Pergunte à Dona Zélia pela vela que ela guarda desde o ano passado" → "pela vela que a família dela guarda. E depois pergunte quem mais anda atrás dela." Por quê: a Zélia diz depois que a vela está na família desde antes da estrada de ferro (contradição). A segunda parte prepara o homem de branco.
38. `j06_cemiterio_vespera` · "a luz é uma dívida, e a dívida sempre cobra quem não sabe quem empresta" → "Toda luz é uma dívida, e quem toma emprestado sem saber quem cobra paga caro." Por quê: a versão antiga era enigmática demais para a fala.
39. `j06_zelia_vela` · Zélia: "Você perguntou pela vela, querido." → "Pela vela, então." Por quê: o jogador nunca perguntou pela vela; quem mandou foi a Véspera.
40. `j06_zelia_vela` · narrador: "A chama é pequena, azulada" enquanto a Zélia diz para não acender. → "O pavio está apagado, mas a cera ainda está morna." Por quê: contradição interna (chama acesa e vela para não acender).
41. `j06_zelia_vela` · jogador: "Uma vela que não treme com o vento." → "Uma vela que parece estar esperando alguma coisa." Por quê: a cena não fala mais de vento; a fala nova prepara o final.
42. `j06_odete` · aprendiz: "A Zélia usa Lampent no fim" → "começa com um Lampent e termina com um Chandelure". Por quê: o Lampent é o primeiro da equipe, não o último.
43. `j06_ciro` · aprendiz: "Gire os espelhos: a luz da lua acende as velas. A Dona Zélia adora uma charada." → "A Dona Zélia tem um Dusknoir que segura a porta. Golpe Sombrio atravessa a defesa dele." Por quê: não há espelho nem charada no jogo; a dica nova bate com a equipe da Zélia (477 Dusknoir).
44. `j06_zelia_ginasio` · "Eu já vi a sua cara de noite, e ela é de quem vai vencer." → "Pelo seu jeito, acho que está. Vamos ver se está mesmo." Por quê: a frase antiga sugeria que o jogador ia vencer, e isso é o contrário do combate.
45. `j06_zelia_insignia` · "quem perguntou pela vela não foi a Crepúsculo" → "A Véspera mandou você perguntar pela vela, mas quem já perguntou foi um homem de branco." Por quê: a Véspera mandou o jogador perguntar, então a frase antiga se contradizia.
46. `j06_zelia_insignia` · "Guarde a vela e não a acenda. A Rota 6 segue..." → versão encurtada e com o aviso dos trilhos no mesmo bloco. Por quê: a instrução de guardar aparecia duas vezes na mesma fala.
47. `j06_boletim5` · "Isso já é quase meia hora de atraso em cinco dias." → "Quase quarenta minutos de atraso desde o primeiro boletim." Por quê: 6h05 para 6h42 são 37 minutos, e a Mãe no primeiro boletim já falava em "quinto dia seguido".
48. `j06_boletim5` · jogador: "Dona Zélia disse que a noite foi a mais longa da região. Eu acredito nela." (repetia o rádio logo antes) → "Mãe, a Dona Zélia me deu uma vela para guardar. Ela parece saber mais do que diz." Por quê: a fala antiga só repetia o boletim; a nova prepara a Vela e a reviravolta 5.

### 07-aurora.js (Aurora, Mina, Rota 7, Forte Rochedo, Brás)

49. `j07_chegada` · jogador: "Não sei qual dos dois está mais disposto a me enganar." → "Vou prestar atenção no que eles não mostram." Por quê: mais útil ao jogador e ao tom de investigação.
50. `j07_lucio_bloqueia` · jogador: "Tem gente presa lá embaixo. Você ouviu a sirene." → "Você não quer que ninguém veja o que tem lá embaixo. Por quê?". Por quê: a sirene só toca depois desta batalha (`j07_sirene`). A fala antiga citava um evento que ainda não aconteceu.
51. `j07_sirene` · jogador: "a Aurora não ia deixar ninguém descer sem autorização" → "por que a sirene só tocou agora, se o desabamento foi antes?". Por quê: a pergunta sobre o atraso da sirene prepara a fala do Téo sobre a sirene atrasada, e a frase antiga repetia o Lúcio.
52. `j07_mina_entrada` · Téo: "O elevador do nível três é o único caminho. Se ele estiver quebrado, vamos pela escada." → "O elevador do nível três caiu com o desabamento. A escada do fundo é o único caminho." Por quê: o nível três já desabou; o elevador não podia ser o caminho.
53. `j07_mina_medidor` · Heitor: "Eu disse que eles não iam tirar a gente daqui antes da cota do dia." → "Eles disseram que o resgate só chegaria depois da cota do dia. Ainda bem que você veio." Por quê: o Heitor não tinha dito nada antes, e a fala antiga não fazia sentido com o Téo chegando agora.
54. `j07_mina_medidor` · jogador: "O sol nasce mais tarde por causa do que vocês tiram daqui?" → "por causa do que a Aurora tira daqui?". Por quê: "vocês" misturava a Crepúsculo com a Aurora; a pergunta é sobre a empresa.
55. `j07_mina_medidor` · Véspera: "Eu roubava as pedras... Não para deixar a noite durar." → "Eu roubava as pedras dos ginásios para tirá-las das mãos da Aurora. Se quer saber quem descobriu essa luz, pergunte ao seu professor." Por quê: a versão antiga contradizia a Véspera das cenas 03 ("Para que a noite não acabe") e 06 ("Quero que a noite fique como está"). A nova fala aponta o Prof. Jatobá, o que prepara a reviravolta 2.
56. `j07_mina_medidor` · objetivo da reviravolta 1: "Vá ao Forte Rochedo, a oeste pela Rota 7, e procure as cartas antigas do Prof. Jatobá no arquivo" → "Vá ao Forte Rochedo, pela Rota 7, e procure as cartas do Prof. Jatobá no arquivo". Por quê: a direção "a oeste" não tem base no mapa, e "cartas antigas" é termo que o jogador ainda não ouviu.
57. `j07_mina_medidor` · Téo: "com uma sirene que demorou para tocar" → "com uma sirene atrasada" (e reescrita da fala). Por quê: frase mais clara; a sirene aqui é a ponte com a fala do jogador na cena da sirene.
58. `j07_mina_medidor` · Téo: "Vou ficar do lado de quem está tirando vocês daqui." Por quê: "A partir de agora" pesava a fala; a versão nova é a virada do Téo, sem exagero.
59. `j07_saida_mina` · Solano: "Heitor, Téo. Vocês fizeram um bom trabalho em manter a produção." → "Téo, seu pai já está subindo com a equipe de resgate. Agora volte para a superfície..." Por quê: o Heitor não está na cena. O Solano falava com quem não estava ali. A nova fala também é coerente com a versão de que o resgate é da Aurora.
60. `j07_rota7_soraia` · "A capoeira aqui é de graça, mas a luta é cobrada." → "Você veio da mina e ainda quer passar pela Rota 7? Ginga antes de lutar." Por quê: a frase antiga não tinha lógica com a luta.
61. `j07_arquivo` · "Um rádio antigo está ligado num canto, sem som." → "Um telefone antigo começa a tocar num canto da sala." Por quê: a ligação do Prof. vem logo depois (`j07_prof_telefone`); o telefone é a ponte entre as duas cenas.
62. `j07_arquivo` · objetivo: "Espere o Prof. Jatobá ligar, ou procure-o no laboratório" → "Descubra o que o Prof. Jatobá sabe sobre estas cartas. Ele está no laboratório de Vila Alvorada". Por quê: a ligação acontece logo após a cena, então "esperar" não era o próximo passo. O alvo `lab` foi mantido.
63. `j07_prof_telefone` · "A Véspera saiu da empresa e passou a tirar as pedras das mãos da Aurora." → "A Véspera rompeu com a Aurora e passou a tirar as pedras das mãos deles." Por quê: a Véspera nunca foi funcionária da Aurora. "Rompeu" deixa a relação clara.
64. `j07_prof_telefone` · objetivo: "Vá à Roda de Capoeira, no Forte Rochedo" → "Na Roda de Capoeira, vença os faixas-pretas". Por quê: o jogador já está no Forte Rochedo.
65. `j07_dandara` (`apos`): "O portão da roda abriu porque eu perdi. Agora ele fica aberto pra todo mundo." → "Você me venceu, e o portão da roda abriu. Agora o Brás está esperando você." Por quê: o portão abre pela derrota, e a frase antiga não dizia isso com clareza.
66. `j07_tiao` (`apos`): "Ele ginga de lado. Porque ele é caranguejo." → "Ele anda de lado, claro, porque é caranguejo." Por quê: tom e frase mais limpos.
67. `j07_bras_ginasio` · "Abriu os três portões!" → "Passou pelos dois portões da roda!"; e jogador: "seus três portões" → "seus dois portões". Por quê: só existem dois portões (Dandara e Tião), como diz o `roda_portoes` em `cap07.js`.
68. `j07_bras_ginasio` · Brás: "Eu sou o último degrau antes da escalada. Quem passa daqui sobe o Paredão sem medo." → "Quem passa por mim está pronto para o Sertão e para o Paredão." Por quê: a escalada do Paredão só vem depois do Sertão (cena 08 e `progressao.js`).
69. `j07_bras_insignia` · Brás: "O Paredão está lá atrás da Rota 8, e a Graça espera você na Cidade Escarpa." → "Vá ao Sertão do Levante, pela Vila Mandacaru. Lá você acha o mapa do Paredão, e depois a Graça espera você em Escarpa." Por quê: a ordem certa é Sertão → Paredão → Escarpa. A Escarpa exige `nh.sina` e `nh.mapaParedao`, que só saem do Sertão (`j09_chegada`).
70. `j07_bras_insignia` · objetivo: "Siga pela Rota 8 (escalada do Paredão) até a Cidade Escarpa" → "Siga pela Rota 14 até a Vila Mandacaru, no Sertão do Levante". Por quê: o texto novo segue a ordem da história. **O alvo continua `ninho_cidade_escarpa`; ver seção 2, item A.**
71. `j07_boletim6` · Mãe: "Cuidado com o que você ouve." → "Filho, quem nega assim é porque tem alguma coisa a esconder." Por quê: a Mãe dá uma pista concreta.
72. `j07_boletim6` · jogador: "Se a Aurora nega... Eu vou descobrir o que é." → "Já descobri uma parte, mãe. A Aurora mede cada tonelada..." Por quê: o jogador já descobriu a reviravolta 1; "vou descobrir" não tinha sentido.

### script/mantidas.js (Mina Aurora, nível 2)

73. `MINA[0]` (`m_cap06_mina_alfas`) · Téo: "A luz daqui está deixando todo mundo Alfa!" → "Essa luz está deixando tudo Alfa, até os bichos!". Por quê: frase mais natural e menos repetida.
74. `MINA[0]` · narrador: "Lute junto com o Téo: o Pokémon dele luta ao lado do seu." → "Lute ao lado do Téo: o Pokémon dele entra na batalha junto com o seu." Por quê: texto de instrução mais claro.
75. `MINA[1]` (`m_cap06_mina_alfas_depois`) · Téo: "Vamos, a rampa para o nível 3 abriu." → "O nível três desabou, então a escada do fundo é o caminho até o meu pai." Por quê: o nível três já desabou na cena da sirene; dizer que "a rampa abriu" contradizia isso.

Gates de ginásio em `mantidas.js`: `roda_portoes` (Forte Rochedo, Brás) foi revisado no texto de origem e já diz "os dois portões", então não precisou de alteração em `mantidas.js`. `mina_paredes` (Mina Velha, Graça) e `torre_catavento` (Mirante) não ficam nestas cidades e não foram tocados.

## 2. Inconsistências que o texto sozinho não resolve

A. **Alvo do objetivo em `j07_bras_insignia`.** O texto agora manda para a Vila Mandacaru (Sertão), mas o `alvo` ainda é
   `ninho_cidade_escarpa`. A cena `j08_chegada` começa em `vila_mandacaru`, e `src/story/progressao.js` usa
   `ninho_vila_mandacaru` para o Sertão. Quem edita os alvos precisa trocar para `ninho_vila_mandacaru`. Sem isso, o painel
   aponta para a Escarpa com o texto do Sertão.

B. **Bilhete do Heitor depende de uma missão opcional.** As falas com a prova (`nh.bilheteHeitor`) só existem se o jogador
   devolver a garrafa ao Seu Nestor. Acrescentei uma fala de fallback, mas o arco do Téo fica mais fraco sem a prova.
   Se a história precisar dessa prova, a missão deveria ser obrigatória ou a flag deveria ser setada na pista.

C. **Nome do jogador.** A Mãe, o Prof. Jatobá e outros personagens chamam o jogador de "Ravi" literalmente em todos os
   segmentos. Só o `{jogador}` nas narrações e no "recebeu a insígnia" acompanha o nome escolhido. Se o nome for trocado,
   as falas com "Ravi" continuam com "Ravi". Corrigir exige trocar essas falas por `{jogador}` em todo o projeto.

D. **Raiz de cristal (resolvido).** A Monja Aruã não pede mais que a raiz vá para a Lia. A raiz fica no templo, e a cena
   `j05_templo_fim` diz por quê (ela segura a selva contra o cabo).

E. **Pedra da Lamparina (resolvido).** Em `j11_vela_revelada` a Zélia diz que a pedra da lanterna é a de Lamparina, que o
   Ébano tentou levar e que ficou com ela. A fala sobre as pedras de Solano foi ajustada para "as pedras dos outros
   ginásios". Ainda vale conferir a conta das pedras: 7 pedras + Vela Eterna contra as 8 chaves do doc.

F. **Tamanho das falas.** Ainda há cerca de 45 textos de mais de 120 caracteres nos quatro arquivos, porque algumas cenas
   precisam de dois fatos numa mesma fala. O teste aceita até 260. A maior ficou em 144 caracteres.

G. **Numeração de linhas.** Em `mantidas.js`, a linha 77 (`r9_e`, Observadora Ivone, Rota 9) tem reticências "…". Não é desta
   parte, e não foi alterada.

## 3. Verificação

- `node tools/teste-jornada.mjs`: OK (só os avisos que já existiam, como "cena de uma caixa só" e um objetivo da cena 10).
- `node tools/teste-jornada-completa.mjs`: OK, a jornada inteira segue jogável na ordem.
- `node tools/verificar_dados.mjs`: OK.
- Nenhum emoji e nenhum travessão nas falas alteradas.
