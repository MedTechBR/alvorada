# Revisão dos diálogos, segmentos 08 a 11 e gates de Escarpa e Mirante

Branch `dialogos-c`. Base de comparação: `e0fcf37e`. Pedido do Matheus: "muitas frases nem fazem sentido ou não conversam
com as frases anteriores. A história precisa ser envolvente e fazer sentido, com diálogos conversando entre si."

Escopo: `src/story/jornada/08-sertao.js`, `09-escarpa.js`, `10-brasas.js`, `11-mirante.js` e as cenas `mina_paredes` e
`torre_catavento` em `src/story/script/mantidas.js`. Só mudaram textos de falas e de objetivo. Ids, gatilhos, flags,
atores, batalhas, posições e estrutura foram conferidos por comparação com a base (tudo igual, exceto o texto).

## Quantas linhas mudaram

| Arquivo | Falas alteradas | Objetivos alterados | Cenas com texto alterado |
|---|---|---|---|
| 08-sertao.js | 21 | 1 | 6 de 6 |
| 09-escarpa.js | 27 | 1 | 8 de 8 |
| 10-brasas.js | 19 | 1 | 5 de 5 |
| 11-mirante.js | 25 | 1 | 9 de 11 |
| mantidas.js | 3 | 0 | 2 gates |

Na fala do "…" do Absol (cena `j08_sina_revela`), o personagem passou a ser narração. Não é ator nem gatilho.

## Problemas e correções

Formato: arquivo, cena, antes → depois, motivo.

### 08-sertao.js

1. `j08_chegada`, narração: "a Aurora diz que não é nada" → "Ninguém na vila sabe o que eles procuram". A Aurora não aparece
   nas ruínas; era uma referência sem cena.
2. `j08_escavacao`, recruta: "a gente leva a pedra da cidade para o Relógio" → "Quando essa pedra sair, a gente leva para o Relógio".
   "Pedra da cidade" não tinha referência.
3. `j08_escavacao`, Ébano: "Vá pegar sua lanterna e aprenda a ler as paredes" → "Quem quiser ler essa parede vai ter que passar por mim".
   Não tinha ligação com a pergunta do jogador, e a nova fala prepara a batalha.
4. `j08_pinturas`, jogador: "Quem é ele?" → "Ele está em todas as pinturas, sempre ao lado da Véspera". A cena já mostra a Véspera;
   a pergunta fica respondível.
5. `j08_sina_revela`, absol "…" → narração "O Absol levanta a cabeça devagar...". Linha vazia de personagem.
6. `j08_sina_revela`, Sina: "levo quem pode ajudar até a pedra ameaçada" → "aviso antes de cada desastre" (fala mais curta).
7. `j08_sina_revela`, Sina: "Eu estava guiando você às pedras. Ninguém mais estava." → "às pedras que estavam sendo roubadas". Explica por que
   a Sina ajudava, sem o tom de exagero.
8. `j08_sina_revela`, Sina: "a única coisa que mantém a sua cidade acordada" → "ninguém deve mexer nele antes de saber o que ele prende".
   A frase antiga era solta; a nova prepara a reviravolta 4 (o cadeado abre).
9. `j08_sina_revela`, objetivo (reviravolta 3): "Vá ao Paredão, na Cidade Escarpa, e procure a Líder Graça" → "Enfrente o Téo na
   praça de Mandacaru e pegue o mapa do Paredão no Museu". Sem o mapa, a Escarpa não abre (`nh.mapaParedao` é exigido em
   `j09_chegada`). **Alvo não alterado, ver inconsistências.**
10. `j08_teo_rival4`, Téo: "Eu não estou com ciúme, mas quero ver o seu time" → "Fiquei do seu lado na mina, mas quero ver o seu time".
    A piada de ciúme não combinava com o Téo que acabou de mudar de lado. Ele duvida da Aurora, não do jogador.
11. `j08_mapa_paredao`, Téo: "o Paredão era o caminho para o Relógio" → "o Paredão levava ao Relógio". Só ajuste de clareza.
12. `j08_mapa_paredao`, jogador: "Então o caminho do Paredão é o mesmo que o seu pai desenhou." → "Então seu pai também procurava o Relógio. Não é coincidência
    ele ter acabado no fundo da mina da Aurora." A frase antiga não acrescentava nada; a nova liga o Heitor à Aurora.

### 09-escarpa.js

13. `j09_chegada`, jogador: "Mas a Sina me disse que ela já foi levada" → "Se a Crepúsculo chegou primeiro, preciso saber disso agora".
    A Sina não disse isso em nenhuma cena.
14. `j09_traicao`, Véspera: "a noite finalmente vai ter fim para quem merece" → "Com as oito no Relógio, a Aurora não vai ter mais luz para vender".
    A frase antiga contradizia a cena 07 (ela roubou as pedras para tirá-las da Aurora, "não para deixar a noite durar").
15. `j09_traicao`, Sereno: "Ou o cadeado vai abrir de vez" → "Falta só a da Lamparina, e a Dona Zélia nunca quis entregá-la".
    A pista da traição fica legível e prepara a Vela (reviravolta 5).
16. `j09_traicao`, Sereno: "E os cristais também." → "E diz que a luz agora é dele." A frase antiga não tinha sentido.
17. `j09_traicao`, jogador: "Eu vi o nome do Solano em todas as cartas." → "...em todas as cartas do Forte Rochedo". Só as cartas do arquivo
    citam o Solano; "todas" era exagero.
18. `j09_traducoes`, Véspera: "as oito pedras fariam o sol dormir" → "as oito pedras fechariam o cadeado". Era a motivação mais
    contraditória da história. Agora: fechar o cadeado afastaria a Aurora da luz, e a tradução trocada inverte o sentido.
19. `j09_traducoes`, Véspera: "Ele trocou as palavras de 'fechar' por 'abrir'. E eu não li de novo" → "copiou as traduções para a
    equipe e trocou 'fechar' por 'abrir'. Eu não conferi, porque confiava nele." Explica como a falsificação chegou até ela.
20. `j09_traducoes`, jogador: "não fecha a noite" → "não fecha nada". Sem a motivação "noite", a fala fica exata.
21. `j09_traducoes`, Véspera: "A Crepúsculo foi só a faca que cortou a corda..." → "A Crepúsculo foi só a mão que girou a chave. Quem mandava
    era a Aurora". Metáfora trocada por outra mais simples.
22. `j09_traducoes`, Véspera: "vá ao Relógio antes do Solano" → "Desconfie de quem sorrir demais lá em cima". O objetivo seguinte
    manda ao Graça e aos mineiros, então "vá ao Relógio agora" contradizia o caminho.
23. `j09_traducoes`, objetivo (reviravolta 4): "Vá à Mina Velha, ao fundo da cidade, vença os mineiros..." → "Vá à Mina Velha,
    vença os mineiros e enfrente a Líder Graça". Mais enxuto.
24. `j09_juvenal` e `j09_rita` (avistar): "A Graça não perde uma luta de pé. Ela cai, levanta e bate de novo. Pedra não se cansa."
    → "A Graça não cai fácil. Antes de chegar nela, você vai ter que passar por mim." E "Subir a Mina Velha é fácil. Descer é que é a
    parte difícil." → "A Graça mandou a gente guardar a mina...". Frases vagas sem ligação com a cena.
25. `j09_graca_ginasio`, Graça: "Então agora você vai levar uma pancada de rocha." → "O Sereno levou a pedra da minha cidade. Não vou negar que estou
    com raiva, e vou descontar em você." O "então" não tinha causa. Também tirei "ontem": a traição aconteceu na mesma visita.
26. `j09_graca_ginasio`, Graça: "não deixa o Sereno enganar você com cara de bonzinho" → "não deixe o Sereno enganar você com sorriso. Ele sorri até para
    quem vai trair." Liga à cena 09 em que o Sereno sorri.
27. `j09_graca_insignia`, Graça: "leve a pedra da cidade de volta... Se o vulcão acordar, o vento do planalto vai para cima da cidade"
    → "A pedra servia de chave para o Relógio. Se ela aparecer, traga de volta" e "Se ele acordar, a cinza cobre o Planalto". A
    versão nova bate com o plano do Ébano na cena 10.
28. `j09_boletim7`, jogador: "Se o sol atrasou por isso, quero ver com meus próprios olhos" → "A Aurora está mentindo, mãe. Vou ao Relógio ver com os meus
    próprios olhos". O jogador já sabe do atraso; a dúvida antiga não tinha mais sentido.
29. `j09_boletim7`, rádio: "Pela primeira vez, a Companhia Aurora fala no rádio..." → "A Companhia Aurora diz, pela primeira vez, que é uma 'variação passageira'". Só clareza.
30. Atores `g7_juvenal` (apos): "ele ainda acha que o Relógio é um bom lugar para dormir" → "Eu caí, mas a Graça ainda está de pé..." Frase sem ligação.
    `g7_rita` (apos): versão com uma dica útil sobre a Graça.

### 10-brasas.js

31. `j10_chegada`, jogador: "a Graça não exagerava quando falou do vento" → "quando falou da cinza". Ajuste para bater com o Ébano.
32. `j10_ebano_vulcao`, recruta: "a nuvem vai para o alto e o vento do planalto muda de direção" → "a cinza sobe para o céu e o Planalto some no escuro".
    Plano visível e coerente com a Graça.
33. `j10_ebano_vulcao`, Ébano: "o ar quente sobe e a tempestade do Planalto cai sobre o Relógio. Não há mais nada para segurar a noite." → "Quando o Tição
    acordar, a cinza cobre o Planalto e ninguém sobe ao Relógio". A versão antiga dizia que o vulcão derrubaria a tempestade, o que
    contradizia a Vulcanóloga (o calor desfaz a tempestade).
34. `j10_ebano_vulcao`, Ébano: "Porque a Véspera precisa da tempestade parada para o Relógio ficar fechado. Ou abri-lo sem ninguém vendo."
    → "Porque a Véspera quer o Relógio longe de quem vai abri-lo." A frase antiga dizia "fechado" e "aberto" ao mesmo tempo.
35. `j10_ebano_vulcao`, jogador: "Por que vocês querem o ar do Relógio em movimento?" → "Por que a Crepúsculo quer o Planalto no escuro?". Pergunta que
    a resposta do Ébano responde.
36. `j10_vulcanologa` (3 falas): "Sem ele, o vento para..." → "Sem calor, a tempestade fica parada"; "o contrapeso volta" → "o ar
    volta a girar"; "Vá ao Templo, leve a chama" → "Vá ao Templo e acenda a pira". O jogador não tem chama nenhuma; a pira fica no topo.
37. `j10_vulcanologa`, jogador: "Então o Ébano queria acordar o vulcão para manter a tempestade no lugar." → "Então o Ébano quer o Planalto
    no escuro, e a tempestade é a cortina dele." Resume o que o jogador acabou de ouvir.
38. `j10_templo_chama`, narração: "Um Pokémon de fogo... espera por alguém que acenda a chama" → versão curta. Só encurtado.
39. `j10_templo_chama`, objetivo: "Voe com o Corviknight até o Mirante dos Ventos" → "Suba ao Planalto dos Ventos pela Rota 9 e chegue ao Mirante". O
    voo só vale para ninhos já visitados (regra do roteiro), e o Mirante ainda não foi visitado.
40. `j10_tempestade_fim`, vulcanologa: "Mas agora dá para ver que o cadeado está girando. Não tem mais o vento para segurar."
    → "Está fechado, mas o cadeado está girando sozinho. Quem estiver lá em cima vai sentir isso." Prepara o Mirante.

### 11-mirante.js

41. `j11_chegada`, narração: "Ele disse, pelo rádio, que queria mostrar a pedra da Celeste" → "Pelo celular, ele disse que tinha algo importante para mostrar
    antes do Relógio". Não existe "pedra da Celeste", e o Solano liga no celular depois.
42. `j11_prof_sequestrado`, narração: o helicóptero aparecia sem ter sido introduzido → "um helicóptero começa a pousar", já na
    primeira cena do sequestro.
43. `j11_prof_sequestrado`, Jatobá: "Eles não vieram me ajudar, vieram me buscar!" → "Eles não vieram conversar, vieram me buscar!". "Me ajudar" não fazia sentido.
44. `j11_prof_sequestrado`, jogador: "Ele é o professor da região!" → "Ele ainda tem muito a contar, e a Aurora não vai calá-lo." Dá
    motivo ao jogador para enfrentar o Lúcio.
45. `j11_solano_liga`, Solano: "Eu sequestrei o professor porque ele sabia onde a vela estava. Ele me contou tudo, por telefone, há
    dezesseis anos." → "O professor conhece a história dessa vela tão bem quanto eu. Há dezesseis anos, me contou tudo o que sabia".
    A cena 07 mostra o professor confessando a amostra, não a vela. Nenhuma cena mostra que ele sabia onde ela estava.
46. `j11_solano_liga`, Solano: "da senhora Zélia" → "da Dona Zélia", o tratamento usado no resto do jogo.
47. `j11_vela_revelada`, Zélia: "o Solano falou comigo também, ontem à noite" → "o Solano me ligou antes de você". "Ontem à noite" não batia
    com o sequestro, que acabou de acontecer.
48. `j11_vela_revelada`, Zélia: "Quando o Relógio foi fechado, a chama passou a ser guardada." → "a chama ficou com a minha família desde que o Relógio foi fechado".
49. `j11_vela_revelada`, Zélia: "Eu dei porque você tinha cara de quem não ia acender." → "Dei porque achei que você guardaria melhor do que eu." A lógica
    antiga não fechava.
50. `j11_vela_revelada`, Zélia: "as pedras da Véspera já estão com ele" → "as sete pedras já estão com ele". Número explícito.
51. `j11_vela_revelada`, objetivo (reviravolta 5): "Vá ao Relógio de Pedra... antes que o Solano chegue" → "Enfrente a Líder Celeste
    no Mirante e suba ao Relógio antes do Solano". A Celeste é obrigatória antes do Relógio (gatilho `nh.velaSelo` e insígnias).
    **Alvo não alterado, ver inconsistências.**
52. `j11_celeste_ginasio`, Celeste: "Não é para te assustar. É porque a torre só aceita voadores que estão de pé." → "A torre só responde a quem
    luta de verdade, e eu não vou poupar você." A frase antiga se contradizia.
53. `j11_celeste_insignia`, Celeste: "Eu conheço o caminho pelo vento: ele passa pela ponte..." → "O vento passa pela ponte de pedra, à esquerda." E "Ele é um dos
    poucos que ainda acredita que o céu tem dono" → "Ele não merece acabar presa numa torre de cristal". Liga o professor à Aurora.
54. `j11_boletim8`, Mãe: "Por favor, me diga que você vai trazê-lo para casa" → "Por favor, traga ele para casa." Mais natural.
55. `j11_boletim8`, rádio: "A tempestade do Planalto acabou ontem à noite" → "acabou". A Brasas e o Mirante acontecem no mesmo dia.
56. `j11_boletim8`, jogador: "eu prometo que volto com ele" → "volto com o professor". Mais claro.
57. Atores `r9_bruno` e `r9_celia` (apos): a mesma fala nos dois ("A próxima subida é mais alta") → falas diferentes.
    `g8_gael` (aprendiz): "Pelo menos sabia." removido, era uma frase vaga.

### mantidas.js (gates)

58. `mina_paredes` (gate de Escarpa), narração: "O eco ecoa pelo túnel inteiro" → "O barulho ecoa pelo túnel inteiro". Repetição de "eco".
59. `mina_paredes`, Graça: "Pronto, camará. A montanha abriu caminho..." → "Pronto, a montanha abriu caminho. Agora a conversa é lá dentro,
    e ela não vai ser fácil." "Camará" é o jeito de falar do Brás, não da Graça.
60. `torre_catavento` (gate do Mirante), Celeste: "Você chegou ao topo com o vento a favor. Agora a Torre é sua conversa." →
    "Você passou pelos meus pilotos e chegou ao topo. Agora o vento decide só metade da luta. A outra metade é sua." A frase antiga
    não dizia nada, e a nova prepara a batalha com a Celeste.

## Inconsistências que o texto não resolve

Estas precisam de mudança de dados (alvo, ator ou cena que não é minha). Não foram alteradas.

- **Alvo do objetivo da reviravolta 3** (`j08_sina_revela`): o alvo é `ninho_cidade_escarpa`, mas o texto manda para a praça de
  Mandacaru e o Museu do Sertão. Sugestão: alvo `sertao_praca_mandacaru`.
- **Painel após o mapa** (`j08_mapa_paredao`): a cena não tem objetivo. O painel continua pedindo o Museu até a próxima cena.
  Sugestão: um objetivo com o próximo passo ("Suba ao Paredão pela Rota 8 até a Cidade Escarpa").
- **Alvo do objetivo da reviravolta 5** (`j11_vela_revelada`): o alvo é `relogio_pedra`, mas a Celeste precisa ser vencida antes.
  Sugestão: alvo `ninho_mirante_ventos`.
- **Cais das Brasas** (`j09_graca_insignia`): o alvo é `sertao_cais_siri` (Vila Siri, no Sertão), mas o cabeçalho de
  `10-brasas.js` diz que o barco parte do cais de Cidade Escarpa. Escolher um dos dois e ajustar o cabeçalho ou o alvo.
- **Graça e a Mina Velha** (`j09_traducoes`, `j09_graca_ginasio`): o objetivo manda à Mina Velha, mas o ator da Graça está em
  `ninho_cidade_escarpa`, e o gate `mina_paredes` usa `mina_velha`. Confirmar onde a Graça espera o jogador.
- **Solano no Relógio** (`j12_chegada`, fora do meu escopo): "O Relógio fecha o sol quando as oito estão acesas, e abre o
  cadeado quando alguém sopra a chama" contradiz a reviravolta 4 (juntar as oito abre o cadeado). Se for mentira deliberada
  do Solano, a fala precisa dizer isso; se não for, deve ser trocada.
- **Mãe e a Brasas**: a Mãe diz no boletim 8 que o professor não atende "desde ontem". O sequestro acontece no mesmo dia do
  boletim, então o "desde ontem" pode estar errado. Mantido porque o boletim 8 vem depois do Mirante; se o dia for o mesmo, trocar por "desde cedo".

## Testes

- `node tools/teste-jornada.mjs`: OK, sem erros estruturais. Os 18 avisos são os de cena de uma caixa só, já existentes.
- `node tools/teste-jornada-completa.mjs`: OK, 16 passos, 346 verificações.
- `node tools/verificar_dados.mjs`: OK.
- Nenhuma fala passa de 260 caracteres. Nenhum objetivo passa de 190. Não há emoji nem travessão nas falas novas.
- Algumas narrações ainda passam de 100 caracteres (são cerca de 50 linhas entre 100 e 150). O limite é "cerca de 100", e a
  maioria das falas das cenas de personagem já está dentro dele.
