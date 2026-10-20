# Revisão de diálogos, segmentos 00 a 03 e textos de Campina (ramo dialogos-a)

Pedido do Matheus: "muitas frases nem fazem sentido ou não conversam com as frases anteriores. A história precisa ser
envolvente e fazer sentido, com diálogos conversando entre si."

Escopo: `src/story/jornada/00-alvorada.js`, `01-campina.js`, `02-sussurro.js`, `03-espelho.js`, e os textos de Campina
em `src/story/chapter1.js` (Líder Tomé, aprendizes, Rota 1) e `src/story/story.js` (presentes do professor, dica e rival
em Campina). Só texto: ids, gatilhos, flags, atores, batalhas, posições e estrutura não mudaram. Os objetivos
(`texto`) mudaram só onde o texto estava errado; `alvo`, `treinadores` e `rotulo` ficaram como estavam.

Testes: `node tools/teste-jornada.mjs`, `node tools/teste-jornada-completa.mjs` e `node tools/verificar_dados.mjs`
passam. Os avisos (cenas de uma caixa só, objetivo sem verbo) são os que já existiam; nenhum erro novo.

## Problemas encontrados e correções

Formato: cena (id) · antes → depois · por quê.

### 00 · Vila Alvorada

- `j00_boletim_manha` · Ravi: "Ouvi os vizinhos falando da Equipe Crepúsculo. Dizem que eles roubam as pedras dos ginásios." → "Ouvi os vizinhos falando de uma tal Equipe Crepúsculo. Dizem que andam de capa roxa pela região." · o jogador ainda não sabe o que são as pedras; a frase já entregava a premissa antes do professor explicar.
- `j00_boletim_manha` · Mãe: "Então vai com cuidado. E volta para o almoço, que eu não quero você comendo lanche de estrada." → "Quem anda de capa roxa só traz encrenca. Vai com cuidado e volta para o almoço!" · a resposta agora responde à capa roxa, que é o que o jogador acabou de dizer.
- `j00_boletim_manha` · Rádio/Mãe: "Ravi! Liga o rádio... Você precisa ouvir isso antes de sair." → "...o boletim do sol já está no ar. Ouve isso, é importante." · a cena dispara pela flag `balls`, então o jogador pode estar no laboratório; a fala não presume que ele está em casa.
- `j00_laboratorio` · Prof.: "Chegou na hora!" → "Bom ver você com seu Pokémon. Este sol atrasado me dá dor de cabeça..." · "chegou na hora" não faz sentido depois do presente de bolas.
- `j00_laboratorio` · Prof.: "Dizem as lendas que ele prende o Necrozma, um Pokémon que come luz." → "No Planalto dos Ventos existe um Relógio de Pedra. A lenda diz que ele prende o Necrozma, um Pokémon que come luz." · frase mais direta e sem repetir "alto do".
- `j00_laboratorio` · Jogador: "E a Equipe Crepúsculo quer juntar as pedras?" → "...quer juntar as pedras para quê?" · a pergunta precisa de motivo, para o professor ter o que responder.
- `j00_laboratorio` · Prof.: "É o que parece. Por isso você precisa das insígnias: cada líder..." → "Ainda não sei. Mas cada líder que você vencer vai pedir sua ajuda para proteger a pedra da cidade dele." · responde à pergunta de verdade ("não sei") e explica o papel das insígnias sem repetir a frase anterior.
- `j00_saida` · Narrador: o professor grita "Passa no laboratório antes!" pela janela → "Atrás de você, o Prof. Jatobá grita da porta do laboratório: 'Espera!...'" · ele está na porta do laboratório, não numa janela de casa.
- `j00_saida` · Jogador: "Então é melhor ir logo. Mas antes eu quero entender..." → "Ele parece preocupado de verdade. Acho melhor voltar e ouvir o que ele tem a dizer." · a frase se contradizia (ir logo / antes entender) e o objetivo manda voltar ao lab.

### 01 · Cidade Campina

- `j01_chegada` · Narrador: "...a primeira das oito pedras que a Crepúsculo cobiça." → "Você veio pela Rota 1 para o primeiro ginásio. O líder guarda a Pedra do Alvorecer da cidade..." · "primeira das oito pedras" soava como se a insígnia fosse uma pedra.
- `j01_chegada` · Jogador: "...preciso saber o que os recrutas estão fazendo por aqui." → "Mas esta cidade parece nervosa. O que está acontecendo por aqui?" · o jogador ainda não sabe quem são os recrutas; a fala agora puxa o feirante, que responde logo depois.
- `j01_fazenda` · Lili: "Eles pegaram os tambores de leite... Eu falei que leite é de vaca, não de patrão!" → "Eles reviraram o celeiro atrás de uma pedra! Eu disse que aqui só tem leite, milho e galinha." · a piada antiga não se sustentava.
- `j01_fazenda` · Recruta: "Passa, velho..." → "Saia da frente, velho..." · mais natural para quem está ameaçando.
- `j01_fazenda` · Tomé: "...não é nada de outro mundo." → "A pedra é do ginásio, e está comigo há quarenta anos. Não vou entregar a ninguém." · a frase original não dizia nada.
- `j01_fazenda` · Ébano: "Você não entende, garoto." → "Você não sabe o que faz." · mais coerente com a fala "não sabe" do Ébano na fuga.
- `j01_fazenda` · Ébano: "Se você vencer, eu levo o recado. Se perder, eu levo a pedra e você explica para o Tomé." → "Então prove. Se você me vencer, eu vou embora e deixo o celeiro em paz. Se perder, a pedra vem comigo." · o "levo o recado" era confuso e a aposta não estava clara.
- `j01_ebano_fuga` · Ébano: "Pode ficar com o celeiro. A Dra. Véspera só queria ver se você se importava." → "Hm. Não esperava tanta resistência. Fique com a pedra por enquanto. A Dra. Véspera só queria ver quem se importa com elas." · a fala anterior prometia "deixar o celeiro em paz", e a pedra não é do celeiro; "por enquanto" deixa a ameaça para depois.
- `j01_ebano_fuga` · Narrador: "...recolhe a bola de um Murkrow derrotado... mas não leva a pedra." → "O Admin Ébano recolhe o Murkrow derrotado e some atrás do celeiro. A pedra continua no lugar." · frase sem a negação dupla.
- `j01_ebano_fuga` · Tomé: "Mas a minha pedra fica no ginásio, e lá é onde eu quero você amanhã." → "Você segurou eles, garoto! Agora vá ao ginásio e mostre se luta tão bem quanto segura um celeiro." · "amanhã" contradizia a luta logo depois, no mesmo dia.
- `j01_tome_insignia` · Tomé: "A pedra da cidade é a última coisa que eu guardo para mim..." → "...é o que eu tenho de mais precioso, e não dou conta de vigiá-la sozinho." · a frase original não fazia sentido.
- `j01_tome_insignia` · Tomé: "Cuida dela com a mesma atenção que você cuidou dessa insígnia." → "Fique de olho nela. Quando a Crepúsculo voltar..." · o jogador não cuidou da insígnia; ela é um prêmio.
- `j01_tome_insignia` · Tomé: "A Rota 2 sai da fazenda para o norte... Com um Pokémon que tenha patas fortes você passa sem se afundar." → "A Rota 2 começa ao norte da fazenda, depois do lamaçal. Cuidado com o barro: ele engole quem anda distraído." · a regra de "patas fortes" não existe no jogo e o lamaçal não exige isso.
- `j01_boletim1` · Rádio: "Sete minutos depois do esperado." → "Sete minutos mais tarde do que ontem." · "esperado" não estava definido; o boletim agora compara com o dia anterior, como no primeiro boletim.

### 02 · Vila Sussurro

- `j02_chegada` · Narrador: "...o motivo de você estar aqui está escrito no mapa: a pedra da Lia fica na estufa." → "Você veio pela Insígnia Casulo. A Líder Lia guarda a pedra da cidade numa estufa de vidro, nos fundos da vila." · "escrito no mapa" não era verdade e o motivo não estava no mapa.
- `j02_chegada` · Lia: "Eu sou a Lia, pesquisadora, bióloga e babá de lagarta. Também sou a líder... Ouvi falar de você..." → "Eu sou a Lia, líder do ginásio, bióloga e babá de lagarta. O Tomé mandou um bilhete falando de você." · frase mais curta, sem "Ouvi falar" repetido.
- `j02_chegada` · Lia: "Como se eu fosse uma pedreira!" → "Eu sou bióloga, não pedreira!" · piada mais clara e no tom dela.
- `j02_chegada` · Jogador: "...você sabe quem são esses sujeitos de capa roxa?" → "Eles são da Equipe Crepúsculo? Você sabe o que querem com a pedra?" + nova fala da Lia: "Não sei quem são, mas o bosque anda estranho. Vá até o Bosque Sussurrante e descubra com seus próprios olhos." · a Lia não respondia à pergunta. A nova fala responde e liga ao objetivo (Bosque Sussurrante). É a única fala acrescentada.
- `j02_recrutas` · Recruta: "Absol não morde. Só avisa. E a gente já sabe o aviso. Vamos." → "Absol não morde. Ele só aparece antes de alguma desgraça. Vamos antes que ele apareça de novo." · o "aviso" ficou explicado, e prepara a cena do Absol.
- `j02_toca_entrada` · narrador: "...brilham com a mesma luz morna do chaveiro da Aurora." → "...brilham com uma luz morna, como a de um lampião." · o chaveiro da Aurora não aparece antes na história.
- `j02_toca_entrada` e `j02_ariados_alfa` · Absol: "Absol." (2 vezes) → "…" · o Absol é um presságio silencioso (o jogo deixa o Absol silencioso, como presságio).
- `j02_ariados_alfa` · Narrador: "O Absol se põe entre você e o Ariados." → "O Absol olha para você e depois para o Ariados, como quem pede ajuda." · a frase original indicava que o Absol impedia a luta, o que contradiz a batalha que vem a seguir.
- `j02_ariados_depois` · Jogador: "As árvores daqui estão mesmo morrendo perto dessa luz?" → "Essa luz vem das raízes. O Absol me trouxe até aqui para eu ver. Preciso contar isso para a Lia." · o jogador não tinha como saber das árvores; a Lia só fala delas depois, na insígnia.
- `j02_estufa_noite` · Narrador: "...abrem o cofre de vidro onde a Lia guarda o fragmento." → "...abrem a vitrine onde a Lia guarda a pedra." · "fragmento" era outro nome para a mesma pedra; ficou uma só palavra.
- `j02_estufa_noite` · Jogador: "Guardar a noite? Isso aí é da Lia." → "Guardar a noite? Essa pedra é da Lia, e ela não está à venda." · responde à frase do recruta e liga à ideia de venda.
- `j02_estufa_fim` · Recruta2: "Houndour, morde a canela dele! Com carinho, que ele é criança!" → "Chega de brincadeira. Houndour, para cima dele!" · a frase original mandava morder e ao mesmo tempo pedia carinho.
- `j02_estufa_fim` · Jogador: "...a gente não precisa de capa roxa para proteger o que é da Lia." → "Então vem. A pedra é da Lia, e esta noite não é de vocês." · tom mais firme e sem ambiguidade.
- `j02_estufa_vespera` · Recruta: "...O problema está brilhando no seu bolso." → "Tá bom, fica com a telha! Mas a gente só cumpre ordem. Quem manda quer saber da luz do bosque, não da pedra." · o jogador não tem nada brilhando no bolso; a frase prepara a luz da gruta.
- `j02_estufa_vespera` · Véspera: "Pergunte à Lia o que ela viu nas raízes." → "...o que ela sabe sobre essas raízes." · a Lia não falou das raízes antes.
- `j02_nando` · Nando: "Pisou no fio prateado? Não? ... Fio dourado é seguro, fio prateado é encrenca." → "Você chegou até aqui sem cair nas teias? Ótimo, agora vai cair nas minhas!" · o aviso sobre o fio não tinha explicação no jogo.
- `j02_bel` · Bel: "Os casulos apontam para a próxima folha..." → "Eu não devia ter falado da Lia com você. Agora vou ter que te vencer para compensar!" · frase enigmática sem consequência.
- `j02_rival2` · Téo: "Você está na minha frente de novo. Eu passei a semana toda ouvindo que você tem sorte." → "Ei! Você está sempre na minha frente. Toda a vila diz que você tem sorte." · a frase original não fazia sentido com a ordem da jornada.
- `j02_lia_ginasio` · Lia: "Antes de a Aurora pedir o cristal, a estufa tinha sol de manhã..." → "Até uns meses atrás a estufa pegava sol de manhã. Depois vieram homens da Companhia Aurora, com a luzita." · é a primeira vez que a Aurora aparece; a frase agora a apresenta por inteiro.
- `j02_lia_insignia` · Lia: "Eu sabia que o bosque estava doente..." → "Eu já desconfiava que o bosque estava doente..." · "sabia" dava certeza demais para uma hipótese.
- `j02_lia_insignia` · Lia: "Vai até a Rota 3, perto de Porto Espelho. Lá a gente conversa de novo." → "Siga pela Rota 3 até Porto Espelho." · a Lia não aparece em Porto Espelho, então "conversa de novo" não se cumpria.
- `j02_bia_luz` · Bia: "O Professor ficou branco... e foi tomar banho." + "Ele nunca toma banho por tanto tempo." → "Quando contei ao Professor, ele ficou branco e disse que devia ser nada." + "Depois saiu sem dizer para onde." · as falas sobre banho eram absurdas e pesavam no professor, que é gentil e precisa parecer só evasivo.
- `j02_boletim2` · Rádio: "O atraso já passa de quinze minutos..." → "São catorze minutos de atraso desde segunda." · 6h19 menos 6h05 dá 14 minutos, não "mais de quinze".
- `j02_boletim2` · Jogador: "Então o sol atrasa desde a primeira vitória. Foi isso que eu vi no Sussurro." → "Ele já atrasava antes da minha primeira insígnia, Mãe. Então não é por causa das minhas vitórias." · o boletim da manhã (00) já mostrava atraso antes de qualquer insígnia; a frase original contrariava isso.
- `j02_sq_pipoca_inicio` · Tito: "...esse sol que atrasa deixa todo bicho do bosque perdido." → "Já é de tarde, e ele nunca se atrasa." · relação causal sem sentido.
- `j02_sq_pipoca_fim` · Tito: "Você passou o dia fora para me trazer isso?" → "Você passou o dia inteiro atrás dele?" · o jogador trouxe o Pipoca, não a noz.

### 03 · Porto Espelho

- `j03_chegada` · Narrador: "Para continuar, você precisa de uma insígnia que deixe usar a água..." → "Para atravessar o lago e chegar ao mar, você precisa da Insígnia Gota. A Líder Marina fica no Galpão de Barcos." · a motivação agora está clara.
- `j03_chegada` · Tia Jandira: "...mas cuidado: ontem estranharam uns barcos sem dono." → "...mas ontem apareceram uns barcos sem dono." · "estranharam" não funcionava como verbo para barcos.
- `j03_galpao_ataque` · Narrador: "...com um Pokémon de água na frente. Dois recrutas tentam abrir a caixa de ferramentas onde ela guarda uma pedra." → "Dentro do galpão, a Marina enfrenta dois recrutas que tentam abrir a caixa onde ela guarda a pedra." · a Marina já aparece enfrentando os recrutas; a frase agora diz isso.
- `j03_galpao_ataque` · Ébano: "Admin Ébano, da Equipe Crepúsculo..." → "Fique fora disso, Líder. A Dra. Véspera quer a pedra longe de quem a vende." · o jogador já conhece o Ébano desde Campina; a apresentação era repetida.
- `j03_galpao_ataque` · Marina: "Quem vende é você. Essas tábuas de barco contam a história toda..." → "Quem vende são vocês, Ébano. Essas tábuas guardam as cargas do porto: vocês chegam de noite, e no dia seguinte o sol atrasa." · concordância ("são") e a tábua guarda as cargas, que a Marina cita depois.
- `j03_vespera_pier` · Véspera: "Quase tão raro quanto a sua pontualidade." → "Você venceu o meu homem, menino. Isso é raro, quase tão raro quanto o sol nascer na hora." · "pontualidade" do jogador não fazia sentido; a frase agora liga ao sol.
- `j03_vespera_pier` · Véspera: "A luz de hoje é só uma moeda: ela compra o amanhecer de quem tem dinheiro." → "A luz já virou moeda: quem tem dinheiro compra o amanhecer, e o resto espera no escuro." · frase mais clara, e a ideia de "luz à venda" conversa com a Aurora que aparece depois.
- `j03_zeca` e `j03_marina_ginasio` · Basculin: "A Marina usa o Basculin no fim..." e "Pode começar com o Basculin..." → "A Marina guarda o Basculin para o fim..." e "Pode começar quando quiser. O Basculin já está ansioso para morder." · o Basculin não é o primeiro Pokémon da Marina, então "começar com ele" estava errado.
- `j03_marina_insignia` · Marina: "...as tábuas do galpão. Elas guardam um mapa de todas as cargas... Vá ver o Seu Nestor, ele tem um sino de vento que vê mais que eu." → "A Crepúsculo voltou aqui por causa das cargas do porto. Vá ver o Seu Nestor: ele conhece cada barco que chega e sai." · o "mapa nas tábuas" e o "sino de vento" não tinham base na cena; o Nestor é o que conhece o porto.
- `j03_sq_garrafa_achada` · Jogador: "Heitor. Esse é o nome do pai do Téo. O Téo disse que ele trabalha na Mina Aurora." → "Heitor. O bilhete fala de cabos e de nível 4. Isso não parece coisa de pescador, parece coisa de mina." · o jogador não sabia que Heitor era pai do Téo, e o Téo nunca disse isso antes. O Nestor é quem revela o vínculo, na cena seguinte.
- `j03_sq_garrafa_fim` · Nestor: "O menino da Aurora que cantava no barco..." → "O menino que cantava nos barcos quando era pequeno. Ele é o pai do Téo, não é?" · "menino da Aurora" pesava uma conclusão antes da hora.
- `j03_sq_garrafa_fim` · Jogador: "Eu levo. E eu vou descer até lá." → "Eu levo para o Téo. E um dia eu vou descer até lá para ver o que está acontecendo." · deixa claro para quem é o bilhete e não promete demais.
- `j03_boletim3` · Jogador: "Mãe, eu vou ver o lago de manhã. Se o sol atrasar mais, eu conto." → "Mãe, amanhã cedo eu vou ver o lago. Se o sol atrasar mais, eu te conto." · pequena correção de tom e de tempo.

### chapter1.js (Tomé, aprendizes, Rota 1)

- `LEADER1.intro` · Tomé: "Então você é o novo treinador que o Prof. Jatobá mandou!..." → "Então você é o treinador que enfrentou a Crepúsculo no meu celeiro!..." · o Tomé já tinha conhecido o jogador na fazenda; a apresentação repetia isso.
- `LEADER1.win` · "Ela foi lapidada de uma lasca da Pedra do Alvorecer de Campina..." → "...de uma lasca da Pedra do Alvorecer, e a pedra inteira continua comigo." · liga com a cena de insígnia, em que o Tomé guarda a pedra.
- `LEADER1.after` · "As oito juntas são as chaves do Relógio de Pedra, lá no Planalto." → "Nenhuma delas deve sair do seu lugar sem um bom motivo." · revelava a chave do Relógio cedo demais (a reviravolta 4 e o Relógio são revelados depois) e repetia o professor.
- `LEADER1.after` · "...o sol tem nascido tarde… e a Equipe Crepúsculo andou rondando a minha fazenda atrás da pedra. Fique de olho." → "Ultimamente o sol nasce tarde, e a Crepúsculo rondou a minha fazenda. Se perguntarem da pedra, não diga onde ela está." · "Fique de olho" repetia a cena de insígnia; a nova fala dá um conselho novo.
- `r1_pedro` (after) · "Não têm fraqueza fácil…" → "Eles não têm fraqueza fácil…" · concordância.

### story.js (Campina, presentes do professor, dica e rival)

- `PROF_MUNDO.mudbray` · "...tem alguém esperando por você: a Paçoca, uma Mudbray da fazenda do Tomé." → "...tem uma amiga esperando por você: a Paçoca, uma Mudbray criada na fazenda do Tomé." · "alguém" para um animal ficava estranho.
- `PROF_MUNDO.mudbray` · "Com este Apito de Montaria, é só chamar." → "Use o Apito de Montaria para chamá-la." · instrução direta.
- `PROF_MUNDO.livre` · "Alvorada é sua... como nos jogos clássicos..." → "A região é sua para explorar, mas tem uma ordem. O primeiro ginásio é o de ${p.cidade}, pela ${p.rota}." · "como nos jogos clássicos" quebrava a imersão; "Alvorada é sua" dizia mal o que queria.
- `PROF_MUNDO.livre` · "Quando você precisar de outro caminho..." → "Sem caminho claro? O painel de objetivo mostra o próximo passo." · a frase anterior falava de caminho; agora a dica é concreta.
- `PROF_MUNDO.livre` · "E a água, os paredões e o céu? ..." → "Água, paredões e céu têm regras. Para atravessá-los, você precisa de Pokémon que nadem, escalem ou voem." · a pergunta retórica foi substituída por uma explicação.
- `PROF_MUNDO.dica` · "Qualquer Pokémon seu que nade, escale ou voe também serve de montaria, quando a insígnia liberar o modo." → "Liberado o modo, um Pokémon que nade, escale ou voe vira montaria." · mais curto e sem repetição.
- `RIVAL_MUNDO.campina` · "...Bom, eu acabei de ganhar a Espiga, então agora eu tô na frente!" → "...Eu acabei de ganhar a Espiga, ouviu?" · "empatados" e "na frente" se contradiziam na mesma fala.

### Textos de Campina trocados em outros pontos (reduções de caixa)

Algumas caixas de narração passaram de 130 caracteres e foram enxutas para cerca de 100 a 125 (ex.: Ariados Alfa,
recrutas na estufa, galpão de barcos, garrafa do Nestor). Nenhum fato da cena foi perdido: os detalhes cortados eram
descrições repetidas ou mecânicas que o jogo não mostra.

## Pendências que o texto sozinho não resolve

1. **Ravi fixo nas falas da Mãe** (00, 01, 02 e 03). `Ravi` está escrito direto nas falas de mãe (boletins e boletim
   da manhã), mas o resto do jogo usa o nome escolhido pelo jogador. Se o jogador escolher outro nome, a Mãe continua
   chamando de Ravi. Correção de código: trocar por `${nome}` ou pelo placeholder que o motor usa (`this.pname`).
2. **O aviso à Lia não tem fala de entrega.** `j02_recrutas` manda avisar a Lia, mas a cena de Sina (`j02_sina_trilha`)
   troca o objetivo para a gruta antes disso, e a Lia não ouve a notícia em nenhuma cena. Para fechar, falta uma fala
   de Lia no começo de `j02_estufa_noite` ou uma cena nova (mudança de estrutura, fora do escopo).
3. **Laboratório, inicial e rival 1 estão em `src/story/dialogs.js`**, não em `story.js`. Esse arquivo não estava no
   escopo deste ramo, então não foi editado. Ele tem as falas de `PROF.intro`, `PROF.gift`, `RIVAL.pick`,
   `RIVAL.challenge`, `RIVAL.leave`, `RIVAL.campina`, `MOM.*`, `WAKE` e `PROF.leave`. Precisa do mesmo tratamento:
   por exemplo, `RIVAL.campina` ("Eu vou seguir para o norte... Pokémon branco") e `PROF.phone` ("onze minutos
   atrasado") conflitam com os boletins da jornada.
4. **Ordem da cena do laboratório.** `j00_laboratorio` depende da flag `balls`, que o presente do professor define.
   O texto agora funciona antes ou depois do presente, mas o motor precisa disparar a cena no lugar certo. Isso é
   gatilho, não texto.
5. **`docs/jornada-roteiro.md` está defasado** para os segmentos 01 a 03: mostra `j01_tome_ginasio` (que não existe no
   código) e diz que a Rota 2 sai "para o oeste" (o código diz norte). O código é a fonte da verdade; o roteiro deve
   ser regenerado depois destas mudanças.
