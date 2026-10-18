# Pokémon Alvorada 2D: história completa

Projeto pessoal de fã, sem fins comerciais. Este documento é a "bíblia" do jogo 2D: premissa, mistério,
personagens, os 12 capítulos, o mapa da região, os ginásios, a Liga, as missões secundárias e as regras
que os arquivos de diálogo (`src/story/script/cap01.js` … `cap12.js`) seguem.

Base: o roteiro do 3D (`pokemon-3d/docs/historia.md`) e o capítulo 1 já jogável lá. Tudo o que existia foi
mantido (Prof. Jatobá, Téo, Tomé, Dra. Véspera, Equipe Crepúsculo, Absol, Fragmentos do Alvorecer, os 8 líderes
e as cidades), e a história foi aprofundada e amarrada. Espécies sempre pelo **número da Pokédex nacional**.

Mapa e coordenadas para o agente do mundo: seção 6 e `docs/mapa-alvorada.json`.

---

## 1. Premissa, tema e mistério

### Premissa (o que o jogador sabe no começo)

Alvorada é uma região de campos dourados, um bosque antigo, um lago que espelha o céu, uma costa de corais e,
ao norte, um paredão de pedra que segura o Planalto dos Ventos. No alto do planalto fica o **Relógio de Pedra**:
oito menires em roda e, no centro, um cristal escuro do tamanho de uma casa, o **Coração**. A lenda diz que o
Relógio "acende o sol" toda manhã.

Há meses o sol nasce cada dia um pouco mais tarde. A Mãe do jogador apresenta o programa matinal da **Rádio
Alvorada** e anuncia, todo dia, a hora do nascer do sol: no primeiro capítulo, 6h11; ele deveria nascer às 5h58.
Os **Pokémon Alfa** (olhos vermelhos, maiores e mais fortes) se multiplicam. Sujeitos de capa roxa, a **Equipe
Crepúsculo**, perguntam pelos **Fragmentos do Alvorecer** que cada ginásio guarda por tradição. E um **Absol**
branco feito neblina aparece perto de cada lugar onde algo vai dar errado.

Ao mesmo tempo, a **Companhia Aurora**, de Cidade Aurora, leva "luz limpa" para a região: postes, faróis e casas
iluminados por **luzita**, um cristal que brilha sozinho. Todo mundo adora a Aurora. Ninguém associa uma coisa à
outra.

### Tema

**Luz e sombra não são bem e mal.** O dia precisa da noite para descansar, e a noite precisa do dia para acabar.
Quem tenta ter só um dos dois (luz para sempre, noite para sempre) destrói os dois. O jogo fala de culpa e de
reparação (o professor), de raiva justa que escolhe o caminho errado (Véspera e Téo), de progresso que cobra um
preço escondido (Solano) e de vínculos que valem mais que pedra (as insígnias).

O nome dos dois polos está nas próprias personagens: **Véspera** e **Dalva** são os dois nomes populares do mesmo
astro, Vênus. A "estrela-vésper" aparece ao entardecer; a "estrela-d'alva", de madrugada. Duas irmãs gêmeas, a
mesma estrela, em lados opostos do dia.

### A verdade (o que o jogador descobre aos poucos)

1. Há milênios, uma luz caiu do céu sobre Alvorada: **Necrozma** (#800), o "Prisma Faminto", um ser de cristal
   que devora luz. Veio a **Noite Antiga**. **Solgaleo** (#791), que carrega o sol pelo céu, e **Lunala** (#792),
   que guarda a lua, lutaram com ele. Com a ajuda dos **Vigias**, o povo antigo do planalto, prenderam o
   Necrozma dentro de um cristal, o Coração, e ergueram o Relógio de Pedra em volta como cadeado.
2. A chave do cadeado era uma única pedra-prisma, a **Pedra do Alvorecer**. Para que ninguém abrisse o Coração
   sozinho, os Vigias a partiram em **oito fragmentos** e os confiaram a oito famílias guardiãs. Essas famílias,
   com o tempo, viraram os oito ginásios. As insígnias são lapidadas de lascas desses fragmentos.
3. O Relógio não acende o sol. Ele **acorrenta o que come o sol**. O cadeado tem raízes: veios de cristal que
   descem do planalto e se espalham sob o Paredão. Esses veios são a **luzita**.
4. A Companhia Aurora minera a luzita. Cada tonelada arrancada afrouxa o cadeado, o Necrozma "bebe" um pouco
   mais de luz a cada madrugada e o Solgaleo, cansado, traz o sol mais tarde. Os Alfa são Pokémon tocados pela
   luz que vaza.
5. Dezesseis anos atrás, os jovens pesquisadores **Jatobá** e **Véspera** descobriram a luzita numa gruta do
   Paredão e tiraram a primeira amostra grande. Naquela noite o sol não nasceu por **30 horas**: a **Noite Longa
   de Lamparina**. Véspera quis esconder a descoberta para sempre. Jatobá, sem dinheiro para o laboratório,
   levou a amostra para um empresário de Lamparina, **Augusto Solano**. Nasceu a Companhia Aurora, e os dois
   pesquisadores romperam. Na Noite Longa, a Absol de Véspera, **Sina**, entrou na gruta para tirar mineiros de
   lá, ficou banhada de luz e nunca mais voltou para a dona: virou a sentinela do cadeado.

### As reviravoltas

| # | Quando | Reviravolta |
|---|---|---|
| 1 | Cap. 6, Mina Aurora | **Não é a Equipe Crepúsculo que rouba o sol.** É a luz "limpa" da Aurora. A luzita é a raiz do cadeado do Relógio; a mina pulsa como um coração, e o medidor da própria empresa mostra que cada carga extraída atrasa a madrugada. A Crepúsculo rouba os fragmentos para tirá-los do alcance da Aurora. |
| 2 | Cap. 7, Arquivo do Forte | **O Prof. Jatobá ajudou a criar a Aurora.** Cartas antigas mostram que ele e Véspera descobriram a luzita e que foi ele quem entregou a amostra a Solano. A Noite Longa foi a primeira extração. E o Absol que persegue o jogador é Sina, a parceira de Véspera. |
| 3 | Cap. 10, Base Crepúsculo | **Sereno, o braço direito de Véspera, trabalha para Solano.** As traduções das tábuas dos Vigias que guiavam o plano da Crepúsculo foram falsificadas: juntar os oito fragmentos no Relógio não faz o sol dormir, **abre o Coração**. Solano deixou a Crepúsculo fazer o trabalho sujo para depois capturar o Necrozma e "fabricar o dia". |
| 4 | Cap. 11, Relógio de Pedra | **As insígnias do jogador são o que fecha o cadeado.** Cada insígnia carrega uma lasca da Pedra do Alvorecer e a luz do vínculo entre treinador e Pokémon. A oitava chave, que Solano não tinha, estava o tempo todo com o jogador: a chama da Vela Eterna que a Dona Zélia lhe deu no cap. 5 é o fragmento de Lamparina. |
| 5 | Cap. 12, Salão da Campeã | **A Campeã Dalva é a irmã gêmea de Véspera.** A estrela-d'alva e a estrela-vésper. Dalva sabia da Aurora desde o começo e escolheu o silêncio; Véspera escolheu a guerra. O jogador é quem as coloca frente a frente. |

---

## 2. Personagens

### Protagonista e família

| Id no roteiro | Nome | Quem é |
|---|---|---|
| `jogador` | **Ravi** (padrão; o criador de personagem troca, use `{jogador}`) | 12 anos, da Vila Alvorada. Curioso, teimoso, bom ouvinte. Recebe o primeiro Pokémon no dia em que a história começa. |
| `mae` | **Helena**, a Mãe | Apresenta o "Bom Dia, Alvorada!" na rádio da vila. Cura a equipe em casa com sua **Audino** (#531), a Dona Fofa. A cada capítulo anuncia a hora do nascer do sol (o "relógio do atraso"). Brincalhona, mas segura o choro quando o filho parte. |
| `benta` | **Vó Benta** | Mãe da Helena, mora em Vila Lamparina. Viveu a Noite Longa. Conta as lendas dos Vigias e faz o melhor bolo de fubá da região. Tem um Noctowl (#164) velho e meio surdo, o Coronel. |
| `pai` | **Capitão Ivo** | Pai do jogador, marinheiro de um navio cargueiro, longe há dois anos. Aparece por cartas (missão "Cartas na garrafa") e chega no epílogo, no primeiro amanhecer verdadeiro. |

### O professor e o laboratório

| Id | Nome | Quem é |
|---|---|---|
| `prof` | **Prof. Jatobá** | 50 anos, barba grisalha, sandálias. Estuda os Pokémon de Alvorada e o atraso do alvorecer. Gentil, entusiasmado, esquece a hora do almoço. Carrega uma culpa de 16 anos: foi ele quem levou a luzita a Solano. Seu parceiro é um **Tropius** (#357) que dá cachos de fruta no pescoço. Arco: esconde → é desmascarado (cap. 7) → confessa ao jogador (cap. 9) → repara, segurando o Relógio ao lado de todos (cap. 11) e depondo contra a Aurora (epílogo). |
| `bia` | **Bia** | Assistente do laboratório, 19 anos. Fala rápido, inventa apelidos para Pokémon, atualiza a Pokédex do jogador ao longo da história (lanterna, mapa, rastreador de Alfa). Alívio cômico e, no fim, quem descobre o cálculo do alinhamento do Relógio. |

### O rival

| Id | Nome | Quem é |
|---|---|---|
| `teo` | **Téo** | Vizinho da casa azul, filho de **Dona Rosa** (padaria "Pão do Sol"). Competitivo, impulsivo, sempre um passo à frente. Fala alto para esconder que se sente pequeno: o pai, **Heitor**, chefe de turma na Mina Aurora, quase nunca volta para casa e promete ver as batalhas do filho, mas não aparece. |
| `rosa` | **Dona Rosa** | Mãe do Téo. Dá pão de queijo (Poção pequena) sempre que o jogador passa. Torce pelos dois "como se fossem irmãos". |
| `heitor` | **Heitor** | Pai do Téo. Mineiro bom e cansado, que sabe que a mina "chora luz" e cala porque precisa do emprego. Preso no desabamento do cap. 6; depois, demitido e culpado pela empresa. |

**Arco do Téo, capítulo por capítulo**

1. Cap. 1: escolhe o inicial com vantagem, vence ou perde, sai correndo na frente.
2. Cap. 4: em Cidade Coral, segunda batalha. Ele vence o Jonas antes do jogador e diz que o pai vai vir ver a
   próxima. O pai não vem. Depois da luta, o jogador o encontra sentado no píer.
3. Cap. 6: na Mina Aurora, os dois tiram Heitor dos escombros juntos. Primeira vez que Téo pede ajuda.
4. Cap. 8: a Aurora demite Heitor e o culpa pelo desabamento. Téo veste a capa da Crepúsculo, que promete fechar a
   mina. Terceira batalha, em Cidade Escarpa, com o Eevee dele já evoluído em **Umbreon** ("ele evoluiu numa noite
   em que eu não dormi"). Ele leva o fragmento de Escarpa.
5. Cap. 10: na Base Crepúsculo, Téo descobre com o jogador que Sereno trabalha para Solano, ou seja, para a mesma
   empresa que destruiu o pai dele. Tira a capa, abre a cela do jogador e os dois fogem juntos.
6. Cap. 11: luta em dupla com o jogador contra Solano no Relógio de Pedra.
7. Cap. 12: espera o jogador no portão da Liga para a última batalha, "sem vantagem de tipo, só a gente". Perde,
   ri e promete estar na arquibancada. No epílogo, viaja com o pai para replantar a encosta da mina.

Inicial do Téo (`flags.rivalStarter`): Charmander se o jogador pegar Bulbasaur, Squirtle se pegar Charmander,
Bulbasaur se pegar Squirtle. Nos arquivos de diálogo, `'rival:1'`, `'rival:2'` e `'rival:3'` indicam o estágio
da linha evolutiva dele (1 = #1/#4/#7, 2 = #2/#5/#8, 3 = #3/#6/#9).

### Antagonistas

**Dra. Véspera** (`vespera`), líder da Equipe Crepúsculo. 40 anos, cabelo preto com uma mecha branca, casaco
violeta, um broche de estrela no peito. Ex-parceira de pesquisa do Jatobá e gêmea da Campeã Dalva.
*Motivação real:* ela viu a Noite Longa de perto, viu mineiros e Pokémon sufocarem no escuro, perdeu Sina para a
gruta e depois viu o melhor amigo vender a descoberta e a Aurora comprar a imprensa e a câmara de vereadores. Viu
Pokémon Alfa serem caçados para arrancar "núcleos de luzita" do corpo. Concluiu que os humanos não sabem guardar
a luz. Seu plano: juntar os oito fragmentos e fazer o Relógio "dormir" por uma estação inteira. Sem alvorecer, a
luzita apaga, a Aurora quebra, o Necrozma passa fome e volta ao sono profundo, e os Pokémon ficam livres por um
tempo. Ela aceita o preço (colheitas perdidas, frio, medo) porque acha que é o único jeito. Está errada sobre o
efeito, não sobre o problema. *Equipe:* Umbreon (#197), Honchkrow (#430), Houndoom (#229), Mismagius (#429),
Zoroark (#571), Weavile (#461).
*Arco:* inimiga (cap. 3 a 9) → traída (cap. 10) → aliada a contragosto (cap. 11) → se entrega no epílogo, depois
de reencontrar Sina e a irmã.

**Augusto Solano** (`solano`), fundador e presidente da Companhia Aurora. 55 anos, terno branco, gravata dourada,
sorriso de cartaz. Nasceu em Vila Lamparina, pobre; o irmão caçula, Tiago, morreu de febre num inverno em que a
vila ficou três semanas sem luz e o médico não conseguiu chegar no escuro. Solano jurou que nenhuma criança de
Alvorada viveria no escuro de novo e cumpriu: a Aurora iluminou cada casa. *Motivação real:* ele sabe que a mina
atrasa o sol e acha que vale a pena. "Por que esperar o sol nascer, se podemos fabricar o dia?" Seu plano é usar
os oito fragmentos para abrir o Coração e prender o Necrozma numa **Bola Prisma**: luz infinita, para sempre, nas
mãos da empresa. Não é cruel por prazer; é cego pela própria história. *Equipe:* aço e cristal: Bronzong (#437),
Magnezone (#462), Klinklang (#601), Glimmora (#970), Carbink (#703), Metagross (#376).
*Arco:* benfeitor querido (cap. 4) → suspeito (cap. 6) → vilão revelado (cap. 10) → derrotado e humilhado quando a
Bola Prisma falha (cap. 11) → preso no epílogo, onde pede para ver uma madrugada de verdade.

**Equipe Crepúsculo** (`recruta`, `ebano`, `sereno`). Capas roxas com capuz e uma lua minguante bordada. Muitos
são ex-mineiros, ex-moradores despejados pela Aurora, gente com raiva. Usam Pokémon da noite: Zubat (#41)/Golbat
(#42), Murkrow (#198), Houndour (#228), Gastly (#92)/Haunter (#93), Poochyena (#261)/Mightyena (#262), Purrloin
(#509)/Liepard (#510), Stunky (#434), Zorua (#570). Lema: "Que a noite descanse o mundo."

- **Ébano**: administrador grandalhão e ranzinza, ex-mineiro, leal a Véspera até o fim. Fala pouco, perde com
  dignidade, e é engraçado sem querer ("Eu não grito. Eu falo com ênfase."). Sableye (#302), Honchkrow, Houndoom.
- **Sereno**: administrador elegante, voz mansa, sempre de luvas. Traduz as tábuas dos Vigias para Véspera.
  É o espião de Solano. Gengar (#94), Banette (#354), Liepard (#510), Weavile (#461).

**Companhia Aurora** (`vigilante`, `lucio`). Uniformes brancos com faixa dourada. Vigilantes com Magnemite (#81),
Klink (#599), Bronzor (#436), Nosepass (#299), Voltorb (#100), Glimmet (#969). **Gerente Lúcio** é o puxa-saco de
Solano: ambicioso, atrapalhado, morre de medo de Pokémon fantasma. Magneton (#82), Klang (#600), Glimmet/Glimmora.

### O lendário: Solgaleo, Lunala e Necrozma

| Pokémon | Nome em Alvorada | Papel |
|---|---|---|
| **Solgaleo** (#791) | "o Leão da Alvorada" | Corre pelo céu carregando o sol, de leste a oeste. Nasce na Ilha do Sol Nascente. Cansado pela fome do Necrozma, traz o dia cada vez mais tarde. Capturável no pós-jogo, nível 70. |
| **Lunala** (#792) | "a Asa do Crepúsculo" | Dorme no **Santuário do Crepúsculo**, no fundo do Lago Espelho, de onde guarda a lua. O jogador a acorda no cap. 10; ela luta ao lado dele no cap. 11 e depois pode ser capturada no santuário, nível 60. |
| **Necrozma** (#800) | "o Prisma Faminto" | Preso no Coração do Relógio. No cap. 11 absorve o Solgaleo e vira **Necrozma Juba do Crepúsculo** (forma Dusk Mane): o céu fica violeta, o sol para no horizonte. Chefe final da trama, nível 60. Depois de vencido, foge para a **Fenda Prismática**, sob o Relógio, onde pode ser capturado no pós-jogo, nível 72. |
| **Absol** (#359) | "Sina" | A sentinela. Não causa desastres: aparece para avisar. No cap. 11, tomada pela luz do Necrozma, vira **Absol Alfa** (nível 52) e precisa ser vencida. Depois volta para Véspera; no pós-jogo, Véspera pede que o jogador leve Sina na jornada ("ela escolheu você muito antes de mim"). |

O nome "Juba do Crepúsculo" é a ponte perfeita com o título da região: o vilão final é, literalmente, o
crepúsculo que engoliu o sol.

### Personagens marcantes por cidade

| Lugar | Personagem (id) | Quem é e por que se lembra dele |
|---|---|---|
| Vila Alvorada | **Seu Zé do Rádio** (`ze`) | Técnico da rádio, coleciona relógios. Cada relógio da casa dele marca uma hora diferente "porque ninguém sabe mais quando é de manhã". |
| Cidade Campina | **Lili** (`lili`) | Filha do Tomé, 10 anos, cuida dos Mudbray da fazenda. Entrega a primeira montaria e desafia o jogador para corridas. |
| Cidade Campina | **Seu Quinzinho** (`quinzinho`) | Vende milho cozido na praça e "sabe tudo de todo mundo". Fonte de boatos que acabam sendo verdade. |
| Vila Sussurro | **Seu Juca** (`juca`) | Luthier que só faz violas com madeira caída. Fala com as árvores. Missão da viola. |
| Vila Sussurro | **Tito** (`tito`) | Menino de 7 anos que perdeu o Skwovet (#819) Pipoca. |
| Porto Espelho | **Seu Nestor** (`nestor`) | Pescador velho, avô da Marina, fala com Mantine. Dá a montaria de mergulho no cap. 10. |
| Porto Espelho | **Tia Jandira** (`jandira`) | Dona do quiosque da moqueca. Tem opinião sobre tudo e um Slowpoke (#79) chamado Doutor. |
| Cidade Coral | **Iracema** (`iracema`) | Faroleira aposentada, 80 anos. Ficou sem emprego quando a Aurora automatizou o farol. Sabe código Morse. |
| Cidade Coral | **Kauã** (`kaua`) | Surfista e treinador de Wingull, sempre "de boa". Fala gíria de praia. |
| Cidade Aurora | **Pipa** (`pipa`) | Repórter do jornal "O Farol", investiga a Aurora com uma Rotom (#479) câmera. Aliada a partir do cap. 6. |
| Vila Lamparina | **Seu Lázaro** (`lazaro`) | Coveiro do Cemitério das Velas, gentilíssimo, morre de rir das próprias piadas de defunto. |
| Forte Rochedo | **Mestre Cobra** (`cobra`) | Velho mestre de capoeira do Brás, cego, toca berimbau. Ensina o ritmo do quebra-cabeça do ginásio. |
| Cidade Escarpa | **Dona Pedrina** (`pedrina`) | Lapidária que corta as insígnias da região há 40 anos. É ela quem conta, no cap. 8, que toda insígnia tem uma lasca da Pedra do Alvorecer. |
| Mirante dos Ventos | **Nina** (`nina`) | Aprendiz de Celeste, 14 anos, cria filhotes de Rookidee (#821) no viveiro. |
| Planalto | **O Último Vigia** (`vigia`) | Ermitão de túnica laranja que vive nas Ruínas dos Vigias. Fala por enigmas, mas sempre diz a verdade. Descendente dos Vigias. |

---

## 3. Montarias

As montarias destravam a região aos poucos. Cada uma é chamada com o **Apito de Montaria** (item-chave do cap. 2).
No mapa, obstáculos marcados mostram o que falta: lama funda, água, paredes com rachaduras e trepadeiras, penhascos
com ninhos e redemoinhos escuros na água.

| Ordem | Capacidade | Pokémon | Capítulo | Quem dá | O que abre no mapa |
|---|---|---|---|---|---|
| 1 | **Correr** | Mudbray (#749) | 2 | Lili e Tomé, na Fazenda do Tomé | Galope (velocidade ×1,8), atravessa **lama funda** e **areia fofa**, salta **tocos e cercas baixas**. Abre a Rota 2 e o atalho da Lagoa Dourada. |
| 2 | **Nadar** | Lapras (#131) | 3 | Marina, Líder de Porto Espelho | Navega em **água profunda**: Lago Espelho, Rio Lúmen, Mar do Sul. Abre a Rota 4, as Ilhas Coral e os canais do Brejo. |
| 3 | **Escalar** | Sneasler (#903) | 7 | Brás, Líder de Forte Rochedo | Sobe **paredes com trepadeira ou rachadura**. Abre a Escalada do Paredão (Rota 8) e o Planalto. |
| 4 | **Voar** | Corviknight (#823) | 9 | Celeste e Nina, no Mirante | Voo livre sobre o mapa e **viagem rápida** para qualquer "Ninho" (um por cidade). Abre o Mirante Alto, a Ilha do Véu pelo ar e as áreas secretas no alto. |
| 5 | **Mergulhar** | Mantine (#226) | 10 | Seu Nestor, em Porto Espelho | Mergulha em **redemoinhos escuros**: Santuário do Crepúsculo, Recife Afundado, Gruta da Maré submersa. |
| Secreta | Andar na neve funda | Wyrdeer (#899) | pós-jogo | missão "O cervo da neve" | Pico Geada. |

Regra de desenho: toda área nova tem pelo menos um obstáculo visível **antes** de o jogador ter a montaria que
o vence, para ele lembrar de voltar ("hum, aquela parede com trepadeira...").

---

## 4. Estrutura em 12 capítulos

Níveis de referência: a curva dos selvagens sobe ~3 níveis por capítulo. O ás de cada líder fica 2 níveis acima.

| Cap. | Título | Onde | Ginásio | Montaria | Sol nasce às |
|---|---|---|---|---|---|
| 1 | O primeiro alvorecer | Vila Alvorada, Rota 1, Cidade Campina | Tomé (Normal) | — | 6h11 |
| 2 | Sussurros no bosque | Fazenda do Tomé, Rota 2, Bosque Sussurrante, Toca do Absol, Vila Sussurro | Lia (Inseto) | Correr | 6h19 |
| 3 | O espelho partido | Vila Alvorada, Rota 3, Porto Espelho | Marina (Água) | Nadar | 6h28 |
| 4 | Faísca na Costa Coral | Rota 4, Restinga, Cidade Coral, Farol Coral | Jonas (Elétrico) | — | 6h40 |
| 5 | A noite que não acaba | Rota 5 (Brejo das Lamparinas), Vila Lamparina | Dona Zélia (Fantasma) | — | 6h55 |
| 6 | O preço da luz | Rota 6, Cidade Aurora, Torre Aurora, Mina Aurora | — | — | 7h12 |
| 7 | Cartas no forte | Rota 7, Forte Rochedo, Arquivo do Forte | Brás (Lutador) | Escalar | 7h31 |
| 8 | Acima do Paredão | Rota 8 (Escalada), Planalto dos Ventos, Cidade Escarpa | Graça (Pedra) | — | 7h55 |
| 9 | Asas do Mirante | Rota 9 (Estepe dos Ventos), Mirante dos Ventos | Celeste (Voador) | Voar | 8h22 |
| 10 | O que o espelho guarda | Ilha do Véu (Base Crepúsculo), Lago Espelho, Santuário do Crepúsculo | — | Mergulhar | 9h04 |
| 11 | O Relógio de Pedra | Escadaria dos Vigias, Relógio de Pedra, Câmara do Coração | — | — | não nasce |
| 12 | Zênite | Caminho do Zênite, Liga Alvorada (Cidadela do Zênite) | Elite e Campeã | — | 6h02 (5h58 no epílogo) |

### Capítulo 1: O primeiro alvorecer

- **Onde:** Casa do jogador → Praça de Vila Alvorada → Laboratório do Prof. Jatobá → Rota 1 (Campos de Lúmen) →
  Cidade Campina (Centro Pokémon, Mercado, Ginásio).
- **O que acontece:** a Mãe acorda o jogador ao vivo na rádio ("e o sol de hoje nasceu às seis e onze, o que é
  um absurdo"). No laboratório, o Prof. Jatobá apresenta Bia, fala do atraso do sol e dos Alfa, e o jogador
  escolhe Bulbasaur, Charmander ou Squirtle. Téo entra correndo, pega o inicial com vantagem e desafia na hora
  (perder não leva para casa). O professor dá 5 Poké Bolas, 3 Poções e a Pokédex. Na saída da vila, um Absol
  observa do alto de uma cerca e some. Na Rota 1, três treinadores. Em Campina, Téo sai do ginásio com a
  insígnia. Ginásio de Tomé com os aprendizes Ícaro e Rui. Ao final, o Pokédex vibra: o professor conta que viram
  um Absol no Bosque Sussurrante.
- **Objetivo jogável:** escolher o inicial, vencer o Téo (opcional vencer), atravessar a Rota 1, vencer os
  aprendizes e o Líder Tomé.
- **Enfrenta:** Téo (rival:1 nv. 5), Jovem Caio, Caçador Davi, Jovem Pedro, aprendizes Ícaro e Rui, Líder Tomé.
- **Recompensa:** Insígnia Espiga, MT01 Ataque Rápido, ₽1200, 3 Poções, 5 Poké Bolas, Pokédex.

### Capítulo 2: Sussurros no bosque

- **Onde:** Fazenda do Tomé → Rota 2 (Trilha das Paineiras) → Bosque Sussurrante → Toca do Absol (Gruta do Musgo)
  → Vila Sussurro.
- **O que acontece:** Lili e Tomé dão o Mudbray e o Apito de Montaria, porque a Rota 2 tem um lamaçal que só um
  Mudbray atravessa. No bosque, o jogador cruza com dois **agrimensores da Aurora**, simpáticos, medindo "veios" e
  distribuindo chaveiros de luzita (primeira pista). Logo depois, dois **recrutas da Crepúsculo** discutem sobre
  "a pedra da Lia". O Absol aparece na trilha e leva o jogador à Toca do Absol, uma gruta de musgo onde a luzita
  brilha nas paredes e um Alfa (Ariados #168) está enlouquecido pela luz. Em Vila Sussurro, a Crepúsculo tenta
  roubar o fragmento da Lia durante a noite; o jogador ajuda a impedir. Ginásio da Lia.
- **Objetivo jogável:** atravessar o lamaçal com o Mudbray, seguir o Absol, vencer o Ariados Alfa, defender a
  estufa da Lia, vencer o ginásio.
- **Enfrenta:** Caçadores e Picnickers da Rota 2, Ariados Alfa nv. 16, 2 recrutas da Crepúsculo, aprendizes do
  ginásio, Líder Lia.
- **Recompensa:** montaria **Mudbray (Correr)**, Apito de Montaria, Insígnia Casulo, MT02 Picada.

### Capítulo 3: O espelho partido

- **Onde:** Vila Alvorada (visita rápida) → Rota 3 (Margem das Garças, pontes de madeira) → Porto Espelho (feira,
  píer, estaleiro, ginásio no galpão de barcos).
- **O que acontece:** a ponte da Rota 3, quebrada no cap. 1, foi consertada pela Aurora com postes de luzita.
  Em Porto Espelho, Marina recebe o jogador e o desafio vira o caos: no meio da batalha, a Crepúsculo invade o
  galpão. **Primeira aparição da Dra. Véspera**: calma, educada, rouba o Fragmento da Gota e diz ao jogador que ele
  "está do lado certo pelas razões erradas". Ébano segura o jogador enquanto ela foge num bote. Marina termina a
  batalha no píer, entrega a insígnia "porque fragmento é pedra, e insígnia é gente" e empresta o Lapras.
  Notícia pelo rádio: o fragmento de Campina também foi roubado na mesma noite.
- **Objetivo jogável:** atravessar a Rota 3, resolver as comportas do ginásio, vencer Ébano, vencer Marina.
- **Enfrenta:** pescadores e nadadores da Rota 3, aprendizes do ginásio, Admin Ébano (primeira vez), Líder Marina.
- **Recompensa:** Insígnia Gota, montaria **Lapras (Nadar)**, MT03 Hidro Pulso.

### Capítulo 4: Faísca na Costa Coral

- **Onde:** Rota 4 (descendo o Rio Lúmen de Lapras, depois a Restinga) → Cidade Coral → Farol Coral (ginásio) →
  Praia dos Corais (ataque da Crepúsculo).
- **O que acontece:** Cidade Coral está em festa: Solano inaugura os novos holofotes de luzita do farol, com
  discurso bonito sobre o irmão e "nenhuma criança no escuro". Iracema, a faroleira aposentada, resmunga que o
  farol novo "pisca errado". Téo já venceu o Jonas e desafia o jogador no calçadão: o pai prometeu vir e não veio.
  Ginásio no farol: circuitos e geradores. À noite, a Crepúsculo ataca a praia para levar o Fragmento da Faísca;
  dessa vez o jogador vence Ébano e **recupera o fragmento**. Jonas, agradecido, dá a **Lente Prisma** (vê
  rastros de luz que ninguém mais vê).
- **Objetivo jogável:** descer o Rio Lúmen, vencer o Téo, religar os geradores do farol, vencer Jonas, defender
  a praia.
- **Enfrenta:** surfistas e banhistas da Rota 4, Téo (2.ª batalha), aprendizes técnicos, Líder Jonas, recrutas,
  Admin Ébano.
- **Recompensa:** Insígnia Faísca, MT04 Faísca, Lente Prisma (item-chave), Isca de Luz (atrai Pokémon de noite).

### Capítulo 5: A noite que não acaba

- **Onde:** Rota 5 (Brejo das Lamparinas, canais de Lapras, pontes de tábua que só aparecem com a Lente Prisma)
  → Vila Lamparina (casas de pedra, lampiões a óleo) → Casa da Vó Benta → Cemitério das Velas → Ginásio (Casarão
  das Velas, só abre das 18h às 6h).
- **O que acontece:** Lamparina recusou a luz da Aurora: ainda usa lampião. Vó Benta recebe o neto com bolo de
  fubá e conta a **Noite Longa**: 16 anos atrás, a noite durou 30 horas, e "os bichos ficaram de olho vermelho".
  O jogador encontra, no cemitério, o túmulo de **Tiago Solano** com flores frescas. O Absol leva o jogador até
  o lago do cemitério, onde **Véspera** está sozinha, olhando a lua. Conversa tensa e sem luta: "Não fomos nós
  que roubamos o sol. Pergunte à sua Aurora de onde vem a luz dela." Ginásio da Dona Zélia, no escuro. Depois da
  vitória, Zélia dá a **Vela Eterna**, "que não apaga nem com vento nem com mentira".
- **Objetivo jogável:** atravessar o brejo de noite, falar com a Vó Benta, seguir o Absol, resolver o casarão
  escuro, vencer Zélia.
- **Enfrenta:** médiuns e caçadores noturnos da Rota 5, aprendizes do ginásio, Líder Zélia.
- **Recompensa:** Insígnia Vela, MT05 Bola Sombria, **Vela Eterna** (ilumina cavernas escuras; segredo: a chama
  é o Fragmento de Lamparina, que Zélia escondeu ali).

### Capítulo 6: O preço da luz

- **Onde:** Rota 6 (estrada de ferro, torres de transmissão) → Cidade Aurora (avenidas iluminadas, outdoors,
  Megaloja Aurora) → Torre Aurora (visita guiada) → Mina Aurora (4 níveis).
- **O que acontece:** a Pipa, repórter do "O Farol", pede ajuda para entrar na mina. Visita guiada à Torre Aurora
  com Gerente Lúcio, que mostra a maquete e mente com entusiasmo. No meio da visita, sirene: desabamento no nível 3.
  Heitor está preso lá. Téo aparece desesperado. Os dois descem juntos (batalhas em dupla contra Pokémon Alfa de
  cristal). No nível 4, o jogador vê a verdade: uma garra de cristal gigante atravessa a rocha e as paredes de
  luzita **pulsam como um coração**. Com a Lente Prisma, ele vê a luz escorrendo dos veios para cima, em direção
  ao planalto. O painel da própria Aurora mostra "consumo de alvorada" em minutos. **Reviravolta 1.** Heitor sai
  vivo, ferido. Solano aparece no elevador, abraça Téo diante das câmeras e promete "apurar tudo".
- **Objetivo jogável:** infiltrar-se com a Pipa, descer os 4 níveis, resgatar Heitor, fotografar o painel.
- **Enfrenta:** Vigilantes Aurora, Gerente Lúcio, Pokémon Alfa de cristal (Glimmet, Carbink, Boldore), luta em
  dupla com o Téo contra um Steelix Alfa (#208, nv. 32).
- **Recompensa:** MT06 Canhão de Luz (Flash Cannon), Foto do Painel (item-chave),
  Crachá Aurora (abre portas de serviço até o cap. 9).

### Capítulo 7: Cartas no forte

- **Onde:** Rota 7 (ravina ao pé do Paredão, ruínas de muralha) → Forte Rochedo (fortaleza antiga virada vila) →
  Arquivo do Forte → Roda de Capoeira (ginásio).
- **O que acontece:** o Forte guarda o arquivo histórico da região. Brás pede ajuda para expulsar "um sujeito
  de luva" que entrou no arquivo: é **Sereno**, que leva o Fragmento do Punho com uma calma assustadora. No
  arquivo bagunçado, o jogador acha uma caixa com **cartas de Véspera a Jatobá**, de 16 anos atrás.
  **Reviravolta 2:** Jatobá e Véspera descobriram a luzita; Jatobá levou a amostra a Solano; a Noite Longa foi a
  primeira extração; Sina, a Absol de Véspera, ficou na gruta. Uma carta também menciona "a Dalva não atende mais
  minhas ligações". O jogador liga para o professor, que desliga sem conseguir falar. Ginásio do Brás (ritmo).
  Brás dá o Sneasler: "Quem sabe a verdade precisa subir para ver de cima."
- **Objetivo jogável:** vencer Sereno (ele foge mesmo perdendo), arrumar o arquivo e ler as cartas, aprender o
  ritmo com Mestre Cobra, vencer Brás.
- **Enfrenta:** faixas-pretas da Rota 7, recrutas, Admin Sereno, aprendizes, Líder Brás.
- **Recompensa:** Insígnia Punho, montaria **Sneasler (Escalar)**, MT07 Quebra-Tijolo, Cartas de Véspera
  (item-chave).

### Capítulo 8: Acima do Paredão

- **Onde:** Rota 8 (Escalada do Paredão: paredes com trepadeira, ninhos, cachoeiras) → Planalto dos Ventos (campo
  de capim alto e pedras) → Cidade Escarpa (cidade mineira tradicional, casas em degraus) → Ateliê da Dona Pedrina
  → Ginásio na mina velha.
- **O que acontece:** na subida, o jogador vê o Relógio de Pedra pela primeira vez, ao longe, com o Coração
  emitindo um brilho doentio. Em Escarpa, Graça (mineradora "à moda antiga", que se recusa a cavar luzita) fala da
  briga com a Aurora. Dona Pedrina, lapidária, conta que toda insígnia tem uma lasca da Pedra do Alvorecer
  ("cuidado com isso aí, menino: é o pedaço de uma chave"). Ginásio da Graça. Ao sair, a Crepúsculo invade a
  cidade e quem lidera é **Téo, de capa roxa**. Heitor foi demitido e culpado pelo desabamento. Terceira batalha
  com o rival, a mais triste. Ele leva o Fragmento da Rocha e diz: "Seu professor vendeu o sol. Eu só tô
  devolvendo a noite."
- **Objetivo jogável:** escalar o Paredão, chegar a Escarpa, ouvir Pedrina, vencer a mina-ginásio, enfrentar Téo.
- **Enfrenta:** alpinistas e montanhistas, Pokémon Alfa do Planalto (Stantler #234, Mudsdale #750), aprendizes
  mineiros, Líder Graça, Téo de capa (3.ª batalha).
- **Recompensa:** Insígnia Rocha, MT08 Deslize de Pedra, upgrade da Pokédex (rastreador de Alfa).

### Capítulo 9: Asas do Mirante

- **Onde:** Rota 9 (Estepe dos Ventos: rajadas empurram o jogador, cata-ventos de pedra) → Mirante dos Ventos
  (cidade nas falésias, pontes de corda) → Viveiro de Corviknight → Torre do Vento (ginásio).
- **O que acontece:** a Aurora chega com helicópteros: Gerente Lúcio quer o Fragmento da Pluma e "comprar" o
  viveiro. Os filhotes de Rookidee fogem em pânico pelas falésias. O jogador ajuda Nina a resgatá-los; o
  Corviknight-mãe, Ventania, passa a confiar nele. Lúcio leva o fragmento à força. O **Prof. Jatobá chega** de
  carona num Corviknight-táxi e, no alto do mirante, confessa tudo ao jogador. Escolha de diálogo (perdoar,
  cobrar ou ficar calado): muda falas do epílogo, não a história. Ginásio da Celeste.
- **Objetivo jogável:** atravessar a estepe com o vento, resgatar 5 filhotes, vencer Lúcio, ouvir o professor,
  subir a Torre do Vento, vencer Celeste.
- **Enfrenta:** pilotos de asa-delta, Vigilantes, Gerente Lúcio, aprendizes, Líder Celeste.
- **Recompensa:** Insígnia Pluma, montaria **Corviknight (Voar)**, MT09 Golpe Aéreo.

### Capítulo 10: O que o espelho guarda

- **Onde:** Lago Espelho de madrugada → Ilha do Véu, coberta de neblina (Base Crepúsculo, num observatório
  abandonado dos Vigias) → Porto Espelho (Seu Nestor) → Santuário do Crepúsculo (no fundo do lago).
- **O que acontece:** com a Foto do Painel e as Cartas, Pipa publica a reportagem e a cidade se divide. Absol leva
  o jogador à neblina do lago. Ele invade a base, é capturado, e na cela ouve Sereno falando com Solano por rádio.
  **Reviravolta 3:** Sereno é espião, as traduções eram falsas, juntar os fragmentos abre o Coração, e Solano já
  tem 7 fragmentos (os 4 da Crepúsculo, levados por Sereno, mais os que ele "comprou" das câmaras municipais e o
  da Pluma). Téo, que estava de guarda, ouve tudo. Ele tira a capa, abre a cela e os dois fogem lutando juntos.
  Véspera, traída, confronta Sereno e é derrotada; Sereno foge num helicóptero da Aurora. O jogador vence Véspera
  (que, ferida no orgulho, ainda tenta segurá-lo) e ela entende tarde demais. Seu Nestor empresta o Mantine. No
  fundo do lago, o Santuário do Crepúsculo: o jogador acorda **Lunala** com a Vela Eterna e com a Lente Prisma.
- **Objetivo jogável:** atravessar a neblina, infiltrar a base, fugir da cela com o Téo, vencer Sereno e Véspera,
  receber o Mantine, mergulhar e acordar Lunala.
- **Enfrenta:** recrutas e Admin Ébano (que deixa passar quando entende), Admin Sereno, Dra. Véspera, guardiões do
  santuário (Pokémon fantasma e água: Jellicent #593, Lanturn #171, Lumineon #457).
- **Recompensa:** montaria **Mantine (Mergulhar)**, MT10 Pulso Sombrio (de Véspera), Escama Lunar (item-chave).

### Capítulo 11: O Relógio de Pedra

- **Onde:** Escadaria dos Vigias → Relógio de Pedra (a céu aberto, oito menires) → Câmara do Coração (interior,
  sob o Relógio).
- **O que acontece:** a madrugada não acaba: são 9h, 10h, meio-dia, e o céu continua escuro. Solano encaixa os
  sete fragmentos e uma "oitava" falsa de luzita prensada, e abre o Coração para capturar o Necrozma com a Bola
  Prisma. Batalha em dupla (jogador e Téo) contra Solano e Lúcio. A bola estoura. O Necrozma acorda inteiro, o
  Solgaleo chega correndo do leste para conter o Necrozma e **é absorvido**: nasce o **Necrozma Juba do
  Crepúsculo**. Céu violeta, sol parado no horizonte, como um olho entreaberto. Sina, tocada pela luz, vira
  **Absol Alfa** e ataca. Depois de vencê-la, Véspera chega e reconhece a parceira. Todos seguram o Relógio: os
  oito líderes (cada um num menir, devolvendo o fragmento que Solano tinha arrancado), o professor com o Tropius,
  Téo, Véspera, Ébano. **Reviravolta 4:** a chama da Vela Eterna é o oitavo fragmento, e as oito insígnias do
  jogador acendem uma a uma. Lunala chega do lago. Batalha final contra o Necrozma Juba do Crepúsculo, com Lunala
  ao lado. Vencido, o Necrozma solta o Solgaleo e afunda na Fenda Prismática. **O sol nasce de uma vez** e o céu
  inteiro fica laranja.
- **Objetivo jogável:** subir a escadaria, vencer Solano em dupla, vencer o Absol Alfa, vencer o Necrozma.
- **Enfrenta:** Vigilantes de elite, Gerente Lúcio e Solano (dupla), Absol Alfa nv. 52, Necrozma Juba do
  Crepúsculo nv. 60 (com Lunala aliada).
- **Recompensa:** MT11 Raio Solar, Prisma do Alvorecer (item-chave do pós-jogo), sol de volta (o DayNight volta ao
  normal), Lunala capturável no santuário.

### Capítulo 12: Zênite

- **Onde:** Caminho do Zênite (caverna com todos os obstáculos de montaria, a "Estrada da Vitória") → Portão da
  Liga → Cidadela do Zênite (4 salas da Elite e o Salão da Campeã) → epílogo em Vila Alvorada e Cidade Coral.
- **O que acontece:** a região amanhece diferente, mas ainda há cicatrizes. Téo espera no portão para a última
  batalha. A Elite: Aurélio (Sombrio, a madrugada), Clarice (Fada, a manhã), Seu Brasa (Fogo, o meio-dia) e
  Iberê (Dragão, o entardecer). No Salão da Campeã, de frente para a janela do leste, **Dalva**. Ela reconhece o
  broche de estrela que Véspera deu ao jogador e conta, depois da batalha, que é a irmã gêmea dela.
  **Reviravolta 5.** Véspera, que veio se entregar, sobe ao salão. As duas se encaram em silêncio e Dalva pede
  desculpas primeiro. Epílogo: Solano preso pede para ver a madrugada; o professor depõe contra a Aurora e começa
  a replantar a encosta da mina com Heitor; o pai do jogador desce do navio em Cidade Coral; a Mãe abre o
  programa: "Bom dia, Alvorada! O sol de hoje nasceu às cinco e cinquenta e oito. Na hora certa."
- **Objetivo jogável:** atravessar o Caminho do Zênite, vencer o Téo, a Elite e a Campeã.
- **Enfrenta:** treinadores veteranos, Téo (batalha final), Aurélio, Clarice, Seu Brasa, Iberê, Campeã Dalva.
- **Recompensa:** título de Campeão, Hall da Fama, MT12 Clarão Lunar (Moonblast), pós-jogo: Fenda Prismática,
  Ilha do Sol Nascente, Pico Geada, revanches.

### Batalhas com o rival

| Quando | Onde | Equipe do Téo |
|---|---|---|
| Cap. 1 | Laboratório | rival:1 nv. 5 |
| Cap. 4 | Calçadão de Cidade Coral | Staravia (#397) 22, Growlithe (#58) 22, Eevee (#133) 23, rival:2 25 |
| Cap. 6 | Mina Aurora (aliado, dupla) | luta junto contra o Steelix Alfa |
| Cap. 8 | Cidade Escarpa (de capa) | Staraptor (#398) 36, Arcanine (#59) 36, Umbreon (#197) 37, rival:3 38 |
| Cap. 11 | Relógio de Pedra (aliado, dupla) | Staraptor 48, Arcanine 48, Umbreon 49, rival:3 50 |
| Cap. 12 | Portão da Liga | Staraptor 57, Arcanine 57, Umbreon 58, Lucario (#448) 58, Gyarados (#130) 58, rival:3 60 |

### Linha do "relógio do atraso" (Rádio Alvorada)

A Mãe anuncia a hora no início de cada capítulo (`cena: radio`). Sugestão para o `DayNight`: o amanhecer do jogo
começa nessa hora a partir do capítulo. No cap. 11 não há amanhecer até a vitória sobre o Necrozma.

---

## 5. Os ginásios, a Elite e a Campeã

Golpes com ids no estilo de `src/data/moves.js` (camelCase em inglês); o nome em português vem entre parênteses
na primeira vez. Os agentes de mecânica podem trocar golpes que não existirem, mantendo o tipo e a função.

### Ginásio 1: Tomé, Cidade Campina (Normal) — Insígnia Espiga

- **Personalidade:** agricultor tranquilo, chapéu de palha, fala em ditados da roça. Paciente e justo.
- **Quebra-cabeça:** arena a céu aberto cercada por um **milharal-labirinto**. Três porteiras de madeira; cada
  aprendiz vencido abre uma. Fardos de feno podem ser empurrados para abrir atalhos; dois Lechonk fogem pelos
  corredores e, se alcançados, mostram o caminho.
- **Aprendizes:** Ícaro (Lechonk #915 7, Buneary #427 8), Rui (Starly #396 8, Meowth #52 9).
- **Equipe:** Bunnelby (#659) 9 [tackle, mudSlap, quickAttack]; Lechonk (#915) 10 [tackle, tailWhip, takeDown];
  **Teddiursa (#216) 12** [scratch, leer, furySwipes, lick].
- **Vitória (dele):** "Ainda não está maduro, mas a semente é boa. Volte quando quiser."
- **Derrota (dele):** "Ha! Que colheita! Você venceu de forma justa, como chuva no tempo certo."
- **Recompensa:** Insígnia Espiga, MT01 Ataque Rápido, ₽1200.

### Ginásio 2: Lia, Vila Sussurro (Inseto) — Insígnia Casulo

- **Personalidade:** pesquisadora de insetos, óculos de lupa, fala depressa e se distrai com qualquer besouro.
  Doce, mas fica feroz quando alguém ameaça o bosque.
- **Quebra-cabeça:** **estufa-teia**. O chão é uma grande teia. Fios **dourados** são seguros; pisar num fio
  **prateado** faz a teia vibrar e um Spinarak puxa o jogador de volta à entrada (ou chama um aprendiz). Folhas
  gigantes giram como pontes quando o jogador bate numa flor-alavanca. Para chegar à Lia é preciso girar três
  folhas na ordem certa (dica: os casulos pendurados "apontam" para a próxima).
- **Aprendizes:** Caçador Nando (Scatterbug #664 13, Kricketot #401 14), Caçadora Bel (Joltik #595 14, Combee
  #415 15).
- **Equipe:** Combee (#415) 15 [bugBite, gust, sweetScent]; Spinarak (#167) 16 [stringShot, poisonSting, absorb,
  nightShade]; Venonat (#48) 16 [confusion, poisonPowder, supersonic]; **Scyther (#123) 18** [quickAttack,
  furyCutter, leer, wingAttack].
- **Vitória:** "Viu? Inseto pequeno também derruba árvore grande. Uma folha por vez."
- **Derrota:** "Você foi rápido como um Yanma! A Insígnia Casulo é sua. Ela lembra que toda mudança começa
  quietinha."
- **Recompensa:** Insígnia Casulo, MT02 Picada.

### Ginásio 3: Marina, Porto Espelho (Água) — Insígnia Gota

- **Personalidade:** pescadora e velejadora, 25 anos, riso largo, voz de quem grita contra o vento. Neta do Seu
  Nestor. Não perde a calma nem com o ginásio sendo assaltado.
- **Quebra-cabeça:** **galpão de barcos com comportas**. Três alavancas (vermelha, azul, verde) sobem e descem o
  nível da água em três tanques ligados. Barcos-plataforma só ficam alcançáveis no nível certo. Uma correnteza
  empurra o jogador num canal; é preciso fechar a comporta azul para parar a correnteza e abrir a verde para o
  barco da líder descer até o jogador.
- **Aprendizes:** Pescador Zeca (Magikarp #129 16, Barboach #339 18), Nadadora Tainá (Wingull #278 17, Marill
  #183 18).
- **Equipe:** Psyduck (#54) 19 [waterGun, confusion, scratch]; Buizel (#418) 20 [aquaJet, quickAttack, waterGun];
  Slowpoke (#79) 20 [waterGun, confusion, yawn]; **Basculin (#550) 22** [aquaJet, bite, waterPulse, headbutt].
- **Vitória:** "A maré vai e volta, treinador. Você volta também!"
- **Derrota:** "Fragmento é pedra. Insígnia é gente. Toma: essa é sua, e ninguém rouba."
- **Recompensa:** Insígnia Gota, MT03 Hidro Pulso, montaria Lapras.

### Ginásio 4: Jonas, Cidade Coral (Elétrico) — Insígnia Faísca

- **Personalidade:** engenheiro do farol, 35 anos, macacão cheio de bolsos, fala com as máquinas. Desconfiado da
  luzita, mas a prefeitura obrigou a troca.
- **Quebra-cabeça:** **o farol apagado**. Ginásio em espiral dentro do Farol Coral, escuro. Em cada andar, um
  gerador e peças de circuito no chão que giram ao toque (ligar a fonte ao gerador). Com o gerador ligado, as
  luzes acendem e **portões de raio** alternam a cada 2 s. No último andar, os três geradores precisam estar ligados
  na ordem que a lanterna do topo pisca (curto-longo-curto: Morse, dica da Iracema).
- **Aprendizes:** Técnico Saulo (Magnemite #81 21, Voltorb #100 22), Técnica Duda (Electrike #309 22, Helioptile
  #694 23).
- **Equipe:** Magnemite (#81) 23 [thunderShock, sonicBoom, thunderWave]; Flaaffy (#180) 24 [thunderShock,
  cottonSpore, takeDown]; Pachirisu (#417) 24 [spark, quickAttack, sweetKiss]; Luxio (#404) 25 [spark, bite,
  leer]; **Lanturn (#171) 27** [spark, waterGun, confuseRay, bubbleBeam].
- **Vitória:** "Curto-circuito! Volte com mais carga."
- **Derrota:** "Você acendeu o farol inteiro. Toma a Faísca, e cuidado com essa luz nova. Ela não pisca direito."
- **Recompensa:** Insígnia Faísca, MT04 Faísca, Lente Prisma.

### Ginásio 5: Dona Zélia, Vila Lamparina (Fantasma) — Insígnia Vela

- **Personalidade:** contadora de histórias, 70 anos, xale de crochê, risada de fazer arrepiar. Amiga de infância
  da Vó Benta. Guardiã do fragmento e da memória da Noite Longa.
- **Quebra-cabeça:** **o Casarão das Velas**, só aberto de noite. Escuro total; o jogador carrega uma vela
  (raio de luz pequeno). **Espelhos giratórios** refletem um raio de luar que entra por uma claraboia: girar os
  espelhos para que o raio acenda os três candelabros abre a porta do salão. **Quadros mudam de lugar** quando o
  jogador sai de uma sala pela porta errada (a sala "certa" tem o quadro da Vó Benta sorrindo). Pokémon fantasma
  só aparecem nas sombras e somem na luz.
- **Aprendizes:** Médium Odete (Gastly #92 25, Shuppet #353 26), Médium Ciro (Greavard #971 26, Duskull #355
  27). Só aparecem de noite.
- **Equipe:** Shuppet (#353) 27 [shadowSneak, nightShade, willOWisp]; Drifloon (#425) 28 [ominousWind, gust,
  astonish]; Phantump (#708) 28 [hex, leechSeed, astonish]; Litwick (#607) 28 [ember, hex, confuseRay];
  **Lampent (#608) 30** [hex, flameBurst, willOWisp, confuseRay].
- **Vitória:** "Buuu! Brincadeira. Volte quando a sua vela estiver mais firme, querido."
- **Derrota:** "Você não teve medo do escuro. Teve respeito. É diferente. Leve a Vela, e leve esta outra também."
- **Recompensa:** Insígnia Vela, MT05 Bola Sombria, Vela Eterna.

### Ginásio 6: Brás, Forte Rochedo (Lutador) — Insígnia Punho

- **Personalidade:** mestre de capoeira, 40 anos, sorriso aberto, fala cantando. Acredita que luta é conversa.
- **Quebra-cabeça:** **a roda**. Um salão circular com placas de pressão. Mestre Cobra toca uma sequência no
  berimbau (3, depois 4, depois 5 notas); cada nota corresponde a uma placa (grave, médio, agudo). O jogador pisa
  nas placas no ritmo para abrir os portões da roda. Errar o ritmo chama um faixa-preta para a quadra. No meio,
  blocos de pedra para empurrar abrem a passagem para a roda interna.
- **Aprendizes:** Faixa-preta Dandara (Meditite #307 29, Mienfoo #619 30), Faixa-preta Tião (Timburr #532 30,
  Crabrawler #739 31).
- **Equipe:** Machoke (#67) 31 [karateChop, lowKick, focusEnergy]; Hawlucha (#701) 32 [wingAttack, karateChop,
  roost]; Riolu (#447) 32 [forcePalm, quickAttack, counter]; Heracross (#214) 33 [brickBreak, hornAttack,
  bulletSeed]; **Hitmontop (#237) 34** [rapidSpin, tripleKick, quickAttack, detect].
- **Vitória:** "Ê, camará! A roda gira. Volte que ela gira de novo."
- **Derrota:** "Você tem ginga! A Insígnia Punho é sua. E leva o Sneasler, que lá em cima você vai precisar."
- **Recompensa:** Insígnia Punho, MT07 Quebra-Tijolo, montaria Sneasler.

### Ginásio 7: Graça, Cidade Escarpa (Pedra) — Insígnia Rocha

- **Personalidade:** mineradora de família, 45 anos, capacete com lanterna, braços de pedreira. Seca, honesta,
  odeia a Aurora "porque ela cava sem pedir licença à montanha".
- **Quebra-cabeça:** **a mina velha**. Carrinhos de mina sobre trilhos. Alavancas desviam os trilhos; o carrinho
  empurrado com força quebra paredes de rocha rachada no fim da linha. Pedras caem do teto em pontos marcados por
  poeira (use a esquiva). A líder fica no fundo, num salão aberto por três paredes quebradas.
- **Aprendizes:** Mineiro Juvenal (Roggenrola #524 33, Rolycoly #837 34), Alpinista Rita (Nacli #932 34, Rockruff
  #744 35).
- **Equipe:** Boldore (#525) 35 [rockBlast, headbutt, sandAttack]; Naclstack (#933) 36 [rockSlide, saltCure,
  headbutt]; Onix (#95) 36 [rockSlide, bind, dragonBreath]; Probopass (#476) 37 [rockSlide, thunderWave,
  ironDefense]; **Lycanroc Forma Crepúsculo (#745) 38** [accelerock, rockSlide, crunch, quickAttack].
- **Vitória:** "A montanha não tem pressa. Você também não precisa ter."
- **Derrota:** "O crepúsculo não é vilão, sabe? É a hora em que o dia descansa. Toma a Rocha. Você mereceu."
- **Recompensa:** Insígnia Rocha, MT08 Deslize de Pedra.

### Ginásio 8: Celeste, Mirante dos Ventos (Voador) — Insígnia Pluma

- **Personalidade:** guardiã do mirante, 30 anos, cabelo curto branco, cachecol enorme. Fala pouco e olha muito
  para o céu. Brava como a ventania quando defende os ninhos.
- **Quebra-cabeça:** **a Torre do Vento**. Torre aberta no alto da falésia. **Tubos de vento** empurram o jogador
  para cima entre plataformas; **cata-ventos** giram a direção das correntes (cada um gira 90°). Plataformas
  ligadas por cordas balançam com o vento. O topo só se alcança quando os quatro cata-ventos apontam para o
  centro.
- **Aprendizes:** Piloto Gael (Swablu #333 38, Fletchinder #662 39), Piloto Íris (Pidgeotto #17 39, Noctowl #164
  40).
- **Equipe:** Swellow (#277) 40 [aerialAce, quickAttack, endeavor]; Skarmory (#227) 41 [steelWing, airCutter,
  spikes]; Altaria (#334) 42 [dragonPulse, cottonGuard, airSlash]; Talonflame (#663) 42 [flameCharge, acrobatics,
  quickAttack]; **Braviary (#628) 44** [braveBird, crushClaw, airSlash, superpower].
- **Vitória:** "O vento muda. Volte quando ele estiver a seu favor."
- **Derrota:** "Você voou mais alto que o meu Braviary. A Pluma é sua, e o céu também."
- **Recompensa:** Insígnia Pluma, MT09 Golpe Aéreo.

### A Elite da Liga Alvorada (as quatro horas do dia)

Cada sala da Cidadela do Zênite tem uma janela que mostra o céu numa hora diferente. A ordem é livre, mas o
salão final só abre depois das quatro.

**Aurélio, a Madrugada (Sombrio).** Ex-ladrão de joias regenerado, 60 anos, elegante, fala baixo. Sala escura com
estrelas no teto. "Eu roubava coisas que brilham. Hoje eu só guardo o escuro."
Equipe: Mightyena (#262) 55 [crunch, suckerPunch, playRough]; Liepard (#510) 55 [nightSlash, fakeOut, uTurn];
Sableye (#302) 56 [shadowClaw, foulPlay, willOWisp]; Honchkrow (#430) 56 [nightSlash, braveBird, suckerPunch];
Weavile (#461) 57 [iceShard, nightSlash, iceFang]; **Grimmsnarl (#861) 59** [spiritBreak, darkestLariat,
thunderWave, suckerPunch].
Vitória: "Até o escuro tem dono, e não é você." Derrota: "Que bom. Ainda existe quem acenda a luz sem roubar."

**Clarice, a Manhã (Fada).** Florista, 28 anos, cheia de energia, chega de patins. Sala cheia de flores e luz rosa.
"Bom dia! Já tomou café? Então apanha de barriga cheia!"
Equipe: Dachsbun (#927) 55 [playRough, crunch, bodyPress]; Whimsicott (#547) 56 [moonblast, energyBall,
tailwind]; Mawile (#303) 56 [playRough, ironHead, suckerPunch]; Florges (#671) 57 [moonblast, petalBlizzard,
psychic]; Tinkaton (#959) 57 [gigatonHammer, playRough, stoneEdge]; **Sylveon (#700) 59** [moonblast, hyperVoice,
drainingKiss, calmMind].
Vitória: "Manhã ruim pra você, né? Amanhã tem outra!" Derrota: "Que dia lindo pra perder! Sério!"

**Seu Brasa, o Meio-dia (Fogo).** Sertanejo, 65 anos, chapéu de couro, fala devagar como sol quente. Sala de chão
de terra rachada e calor que distorce o ar.
Equipe: Torkoal (#324) 56 [heatWave, bodyPress, stealthRock]; Scovillain (#952) 56 [flamethrower, gigaDrain,
crunch]; Camerupt (#323) 57 [earthPower, flamethrower, rockSlide]; Centiskorch (#851) 57 [fireLash, leechLife,
crunch]; Armarouge (#936) 58 [armorCannon, psyshock, flameCharge]; **Arcanine (#59) 60**
[flareBlitz, extremeSpeed, crunch, wildCharge].
Vitória: "No sertão, quem não aguenta o sol vira sombra." Derrota: "Oxente. Esse aí não derrete."

**Iberê, o Entardecer (Dragão).** O mais velho, 80 anos, ex-carteiro que entregava cartas de Dragonite pelo
planalto. Sala com janela para o pôr do sol eterno.
Equipe: Flygon (#330) 57 [dragonClaw, earthquake, uTurn]; Kingdra (#230) 58 [dragonPulse, surf, focusEnergy];
Goodra (#706) 58 [dragonPulse, sludgeBomb, thunderbolt]; Haxorus (#612) 59 [outrage, dragonDance, earthquake];
Noivern (#715) 59 [dragonPulse, airSlash, boomburst]; **Dragonite (#149) 61** [dragonClaw, extremeSpeed, hurricane,
dragonDance].
Vitória: "Tô velho, mas ainda entrego." Derrota: "Hoje o entardecer é seu, menino. Vai lá ver a estrela."

### A Campeã: Dalva (mista, a estrela-d'alva)

- **Quem é:** 40 anos, campeã há dez, roupa clara com capa azul-madrugada e um broche de estrela igual ao de
  Véspera. Calma, generosa, dona de uma tristeza educada. Sabia da Aurora e da Noite Longa e escolheu o silêncio
  "para não destruir a irmã nem a região". Arrepende-se.
- **Salão:** no alto da cidadela, voltado para o leste. Durante a batalha, a janela mostra o céu clareando
  (a luta acontece na hora exata da alvorada).
- **Equipe:** Espeon (#196) 62 [psychic, dazzlingGleam, shadowBall, morningSun]; Togekiss (#468) 62 [airSlash,
  dazzlingGleam, auraSphere, roost]; Lycanroc Forma Diurna (#745) 63 [accelerock, stoneEdge, crunch,
  closeCombat]; Gardevoir (#282) 63 [moonblast, psychic, mysticalFire]; Garchomp (#445) 64 [earthquake,
  dragonClaw, stoneEdge, swordsDance]; **Volcarona (#637) 66** [fieryDance, bugBuzz, quiverDance, gigaDrain].
- **Vitória (dela):** "A alvorada não tem pressa. Volte quando o céu estiver pronto."
- **Derrota (dela):** "Então é assim que o dia começa de verdade. Bem-vindo ao Hall da Fama, Campeão de Alvorada."

### Outras batalhas de chefe

| Quem | Onde | Equipe |
|---|---|---|
| Admin Ébano (cap. 3) | Galpão de Porto Espelho | Zubat (#41) 19, Houndour (#228) 20, Sableye (#302) 21 |
| Admin Ébano (cap. 4) | Praia dos Corais | Murkrow (#198) 24, Houndour 24, Sableye 26 |
| Gerente Lúcio (cap. 6) | Torre Aurora | Magneton (#82) 30, Klang (#600) 30, Glimmet (#969) 31 |
| Steelix Alfa (cap. 6, dupla com Téo) | Mina Aurora, nível 4 | Steelix (#208) 32 |
| Admin Sereno (cap. 7) | Arquivo do Forte | Haunter (#93) 31, Liepard (#510) 32, Banette (#354) 33 |
| Gerente Lúcio (cap. 9) | Viveiro do Mirante | Magnezone (#462) 41, Klinklang (#601) 41, Glimmora (#970) 42 |
| Admin Sereno (cap. 10) | Base Crepúsculo | Banette 44, Liepard 44, Weavile (#461) 45, Gengar (#94) 46 |
| Dra. Véspera (cap. 10) | Observatório do Véu | Zoroark (#571) 44, Honchkrow (#430) 45, Houndoom (#229) 45, Mismagius (#429) 45, Weavile 45, Umbreon (#197) 47 |
| Solano e Lúcio (cap. 11, dupla) | Relógio de Pedra | Solano: Bronzong (#437) 49, Klinklang 49, Carbink (#703) 50, Glimmora 50, Magnezone 50, **Metagross (#376) 52**. Lúcio: Magnezone 47, Glimmora 47 |
| Absol Alfa "Sina" (cap. 11) | Relógio de Pedra | Absol (#359) 52 |
| Necrozma Juba do Crepúsculo (cap. 11) | Câmara do Coração | Necrozma (#800) 60 [sunsteelStrike, photonGeyser, dragonDance, shadowClaw] |

---

## 6. Mapa da região de Alvorada

### Visão geral

Alvorada tem forma de escudo: o **Planalto dos Ventos** ao norte, separado do resto por um **Paredão** de
pedra que corta a região de oeste a leste. No meio, o **Bosque Sussurrante** a oeste e o **Lago Espelho** a
leste. No sul, os **Campos de Lúmen**, a vila inicial e a **Costa Coral**, aberta para o **Mar do Sul**. No
extremo norte, o **Monte Zênite** com a Liga.

Grade de coordenadas: **x de 0 a 100 (oeste → leste), y de 0 a 80 (norte → sul)**. 1 unidade ≈ 1 tela do jogo
(o agente do mundo pode escalar). As coordenadas exatas de cada lugar estão em `docs/mapa-alvorada.json`.

### Esboço em ASCII

Cada caractere ≈ 1 unidade em x; cada linha ≈ 2 unidades em y.

```
x: 0         10        20        30        40        50        60        70        80        90       100
 0 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^[Z]^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 2 ^^ **PG** ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 4 ^^ *  * ^^^ planalto  ,  ,  ,  ,  ,  , ^^^^^^ CZ ^^^ ,  ,  ,  ,  ,  ,  ,  ,  , [MV]~~~ falésia ~~~~
 6 ^^ ***  ,  ,  ,  ,  ,  ,  ,  ,  ,  [RV] ,  ,  | ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , | ,  ,  ,  ,  ,  ~~
 8  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  |  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , |  ,  ,  ,  ,  ~~
10  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , ===== (RP) =====  R9 Estepe dos Ventos ======   ,  ,  ,  ,  , ~~
12  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , [FP]  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ~~
14  ,  ,  , [ESC]======== R9a ============== |  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ~~
16  ,  ,  ,  ,  ,  ,  , |  ,  ,  ,  ,  ,  ,  |  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  , ~~
18  ,  ,  ,  ,  ,  ,  ,  R8 Escalada  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ~~
20  ,  ,  ,  ,  ,  ,  ,  ,  |  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ,  ~~
22 #########################|################ P A R E D Ã O ###########################################
24 #########################|##########################[MA]#############################################
26          T T T T T T T [FR]=========== R7 Ravina ============#   [CA] (Cidade Aurora)  ...........
28       T T T T T T T T T T T T T T T T |  .  .  .  .  .  .  .  .  .  . ||  .  .  .  .  .  .  .  .
30    [MJ] T T T T T T T T T T T T T T T T T T T T T . . R6 ferrovia . . . ||  .  .  .  .  .  .  . .
32  T T T T T T T T T [TA] T T T T T T T T T T T T T T . . . . . . . . . . //  .  .  .  .  .  .  . .
34  T T T T T T T T T T T T T T T T T T T T T T T T T T . . . . . . . . //  .  .  .  .  .  .  .  .
36  T T T T T T T [VS] T T T T T T T T T T T T T T T T [VL]. . . . . . ~~~~~~~~~~~~~~~~~~~~~~~ . .
38  T T T T T T T T T T T T T T T T T T T T T T T T T T T ''R5 Brejo'' ~~~~~~~~~~~~~~~~~~~~~~~~~~ .
40  T T T T T T T T T T T T T T T T T T T T T T T T T T T '' '' '' '' ~~~~~~~~ LAGO ~~~ (IV) ~~~~ .
42  T T T T T T T T T T T T T T T T T T T T T T T T T T T '' '' '' '' ~~~~~~ ESPELHO ~~~~~~~~~~~~ .
44     T T T T T T T T T T T T T T T T T T T T T T T T  '' '' '' '' '' ~~~~~~(SC)~~~~~~~~~~~~~~~ .
46       T T T T T T T T T T T T T T T T T T T T T T   .  .  .  .  .  .  ~~~~~~~~~~~~~~~~~~~~~ .  .
48        |R2  [FT]  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  ~~~~~~~~~~~~~~~~ .  .  .
50        |  .  .  .  .  .  .  .  (LD)  .  .  .  .  .  .  .  .  .  .  .  .  .  ~~~~~~~~ .  .  .  .
52        |  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . [PE]~~~~ .  .  .  .  .
54        |  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  ~~ .  .  .  .  .
56     [CC]==== R1 Campos de Lúmen ===== [VA] ===== R3 Margem das Garças ====== ~~ rio .  .  .  .
58        .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  ~~ Lúmen .  .
60        .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  ~~ .  .  .
62        .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . R4 Restinga ======== ~~  .  .   ~ ~ ~
64        .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . : : : : : : : : : ~~ : :   ~ [SN] ~
66        .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  . : : : : : : : : : : : : ~~ : :   ~ ~ ~
68                                         : : : [GM] : : : [CO]  [FC]: : : : : : : ~~~~~~~~~~~~~~~~~
70  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
72  ~~~~~~~~~~~~~~~~~~~~~ (IC) ~~ (IC) ~~~~~ (RA) ~~~~~~~~ M A R   D O   S U L ~~~~~~~~~~~~~~~~~~~~~~
74  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ (IC) ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

**Legenda.** `^` montanha / neve, `,` capim do planalto, `#` Paredão (só com Escalar), `T` floresta, `.` campo,
`''` brejo, `~` água (Nadar), `:` areia e restinga, `=` rota principal, `|` e `//` trilhas e ferrovia.

| Sigla | Lugar | Sigla | Lugar |
|---|---|---|---|
| [VA] | Vila Alvorada | [CC] | Cidade Campina |
| [FT] | Fazenda do Tomé | (LD) | Lagoa Dourada (secreta) |
| [VS] | Vila Sussurro | [TA] | Toca do Absol |
| [MJ] | Mata dos Jequitibás (secreta) | [PE] | Porto Espelho |
| (IV) | Ilha do Véu (Base Crepúsculo) | (SC) | Santuário do Crepúsculo (submerso) |
| [VL] | Vila Lamparina | [CO] | Cidade Coral |
| [FC] | Farol Coral | [GM] | Gruta da Maré |
| (IC) | Ilhas Coral | (RA) | Recife Afundado (mergulho) |
| [SN] | Ilha do Sol Nascente (secreta) | [CA] | Cidade Aurora |
| [MA] | Mina Aurora | [FR] | Forte Rochedo |
| [ESC] | Cidade Escarpa | [RV] | Ruínas dos Vigias (secretas) |
| (RP) | Relógio de Pedra | [FP] | Fenda Prismática (pós-jogo, sob o Relógio) |
| [MV] | Mirante dos Ventos | CZ | Caminho do Zênite |
| [Z] | Monte Zênite, Liga Alvorada | **PG** | Pico Geada (secreto) |

### Cidades

**Vila Alvorada (VA)** · (48, 56) · vila inicial.
Vila pequena numa colina suave, praça com coreto, um ipê-amarelo enorme no centro, casas de telha com varanda e
hortas. A Rádio Alvorada é uma casinha com antena de bambu. Ao sul, o laboratório: prédio branco com estufa de
vidro anexa.
Interiores: **Casa do jogador** (2 andares; quarto com janela para o leste, cozinha, estúdio de rádio caseiro),
**Casa do Téo / Padaria Pão do Sol**, **Laboratório do Prof. Jatobá** (salão com 3 pedestais, estantes, estufa
com Pokémon planta, mesa da Bia, porão trancado que só abre no pós-jogo, com os cadernos de 16 anos atrás), **Rádio
Alvorada** (Seu Zé e os relógios).
Pokémon nos arredores: Starly (#396), Bidoof (#399), Lechonk (#915), Wooloo (#831).

**Cidade Campina (CC)** · (20, 56) · Ginásio 1 (Normal).
Cidade agrícola cercada de trigais e girassóis. Silos, moinho de vento, feira na praça, carroças. O ginásio é uma
arena ao ar livre no meio de um milharal-labirinto, com arquibancada de madeira e pórtico de espigas.
Interiores: **Centro Pokémon** (padrão), **Mercado Pokémon** (padrão), **Casa do Seu Quinzinho**, **Celeiro da
Fazenda do Tomé** (estábulo dos Mudbray, a 4 unidades ao norte), **Arena de Campina** (ver ginásio 1).

**Vila Sussurro (VS)** · (24, 36) · Ginásio 2 (Inseto).
Vila construída entre as raízes de jequitibás gigantes; casas na altura dos galhos, ligadas por passarelas de
corda e escadas em espiral. Lanternas de vaga-lume (Volbeat #313 e Illumise #314 à noite). Cheiro de musgo.
Interiores: **Centro Pokémon** (dentro de um tronco oco), **Mercado**, **Oficina do Seu Juca** (violas penduradas),
**Estufa-Teia da Lia** (ginásio), **Casa do Tito**.

**Porto Espelho (PE)** · (72, 52) · Ginásio 3 (Água).
Porto na margem sul do lago: palafitas coloridas, píer comprido, barcos a vela, redes secando. A água é tão parada
que reflete o céu inteiro. Feira de peixe de manhã.
Interiores: **Centro Pokémon**, **Feira do Porto** (loja com iscas, varas e Poções), **Quiosque da Tia Jandira**,
**Casa do Seu Nestor** (cheia de garrafas e fotos antigas), **Galpão de Barcos** (ginásio), **Estaleiro** (onde
Véspera foge no cap. 3).

**Cidade Coral (CO)** · (54, 68) · Ginásio 4 (Elétrico).
Cidade de praia, calçadão de pedra portuguesa ondulada, coqueiros, barracas, casas pastel. No alto de um morro de
pedra, o **Farol Coral** listrado de vermelho e branco, com holofotes novos de luzita.
Interiores: **Centro Pokémon**, **Loja de Praia** (Poções, Repelentes, roupas de banho), **Casa da Iracema**,
**Farol Coral** (ginásio em espiral, 4 andares), **Escola de Surfe do Kauã**.

**Vila Lamparina (VL)** · (54, 36) · Ginásio 5 (Fantasma).
Vila de pedra escura na borda leste do bosque, sobre o brejo. Lampiões a óleo, varais, gatos. Sempre parece fim
de tarde. Ao norte, o **Cemitério das Velas**, com velas acesas em cada túmulo e um laguinho redondo.
Interiores: **Centro Pokémon** (iluminado a lampião), **Mercado**, **Casa da Vó Benta** (fogão a lenha, Noctowl
Coronel no poleiro), **Capela das Velas**, **Casarão das Velas** (ginásio, abre das 18h às 6h), **Casa abandonada
dos Solano** (missão secundária).

**Cidade Aurora (CA)** · (80, 28) · cidade industrial, sem ginásio.
A cidade mais moderna da região: avenidas largas, prédios de vidro, outdoors luminosos, trem elétrico. Tudo brilha
com a luz dourada da luzita, até de dia. Nos fundos, bairros de mineiros com casas iguais.
Interiores: **Centro Pokémon**, **Megaloja Aurora** (5 andares: itens, MTs, roupas, terraço com vista para a
mina), **Torre Aurora** (sede: recepção, maquete, sala de controle com o painel de "consumo de alvorada",
cobertura de Solano), **Redação do "O Farol"** (Pipa), **Hospital dos Mineiros** (Heitor, cap. 7 a 9).

**Forte Rochedo (FR)** · (44, 26) · Ginásio 6 (Lutador).
Fortaleza colonial de pedra encostada no Paredão, com muralhas, canhões velhos e uma vila dentro. Uma escadaria
esculpida sobe pela muralha até onde o Paredão começa.
Interiores: **Centro Pokémon** (antigo quartel), **Mercado**, **Arquivo do Forte** (estantes altas, mapas antigos,
caixa de cartas), **Roda de Capoeira** (ginásio, salão circular), **Casa do Mestre Cobra**.

**Cidade Escarpa (ESC)** · (22, 14) · Ginásio 7 (Pedra).
Cidade mineira no planalto oeste, casas em degraus na encosta, telhados de ardósia, trilhos de mina pelas ruas,
igreja de pedra. Ventania fria.
Interiores: **Centro Pokémon**, **Mercado**, **Ateliê da Dona Pedrina** (lapidação; aqui ela melhora o estojo de
insígnias), **Mina Velha** (ginásio), **Pousada do Planalto**.

**Mirante dos Ventos (MV)** · (86, 4) · Ginásio 8 (Voador).
Cidade pendurada nas falésias do nordeste, casas de madeira presas na rocha por vigas, pontes de corda,
bandeirolas, cata-ventos por toda parte. Embaixo, a névoa do mar.
Interiores: **Centro Pokémon**, **Mercado**, **Viveiro de Corviknight** (ninhos, Nina), **Torre do Vento**
(ginásio).

**Liga Alvorada / Cidadela do Zênite (Z)** · (48, 0) · Elite e Campeã.
Cidadela branca e dourada no pico do Monte Zênite, acima das nuvens. Escadaria final com estátuas dos Vigias.
Interiores: **Portão da Liga** (Centro Pokémon e loja), **Sala da Madrugada**, **Sala da Manhã**, **Sala do
Meio-dia**, **Sala do Entardecer**, **Salão da Campeã** (janela ao leste), **Hall da Fama**.

### Rotas

| Rota | De → para | Bioma e visual | Pokémon típicos (nº nacional) | Obstáculo |
|---|---|---|---|---|
| **Rota 1, Campos de Lúmen** | VA → CC | Campo dourado, mato alto, cercas, um riacho raso, ipês | Starly 396, Rookidee 821, Pidgey 16, Lechonk 915, Bunnelby 659, Yungoos 734, Sentret 161, Fidough 926, Shinx 403, Mareep 179, Scatterbug 664, Weedle 13 | — |
| **Rota 2, Trilha das Paineiras** | CC → Bosque | Bordas do bosque, paineiras de flor rosa, lamaçal | Caterpie 10, Combee 415, Nincada 290, Skwovet 819, Pikipek 731, Budew 406, Cottonee 546, Wooper 194, Mudbray 749 | lamaçal (Correr) |
| **Rota 3, Margem das Garças** | VA → PE | Margem do lago com junco, pontes de madeira, garças | Psyduck 54, Wingull 278, Marill 183, Surskit 283, Lotad 270, Ducklett 580, Wooper 194, Flamigo 973, Magikarp 129 (vara) | ponte (consertada no cap. 3) |
| **Rota 4, Rio Lúmen e Restinga** | PE → CO | Rio largo com mangue; depois dunas, cajueiros, restinga | Buizel 418, Shellos 422, Corphish 341, Krabby 98, Wiglett 960, Sandile 551, Silicobra 843, Trapinch 328, Wingull 278, Tentacool 72 (água) | água (Nadar) |
| **Rota 5, Brejo das Lamparinas** | PE / Bosque → VL | Brejo enevoado, pontes de tábua, vaga-lumes, árvores secas | Croagunk 453, Tympole 535, Stunfisk 618, Shroodle 944, Foongus 590, Morelull 755, Hoothoot 163, Gastly 92, Misdreavus 200 (noite), Duskull 355 (noite) | canais (Nadar), pontes invisíveis (Lente Prisma) |
| **Rota 6, Ferrovia da Aurora** | VL → CA | Estrada de terra ao lado da ferrovia, torres de transmissão, eucaliptos | Electrike 309, Blitzle 522, Magnemite 81, Voltorb 100, Tadbulb 938, Pawmi 921, Yamper 835, Trubbish 568, Grimer 88 | — |
| **Rota 7, Ravina do Rochedo** | CA → FR | Ravina de pedra vermelha ao pé do Paredão, ruínas de muralha | Machop 66, Mankey 56, Timburr 532, Makuhita 296, Geodude 74, Roggenrola 524, Dwebble 557, Gligar 207, Riolu 447 (raro) | rochas (Correr salta) |
| **Rota 8, Escalada do Paredão** | FR → Planalto | Parede vertical com trepadeiras, ninhos, cachoeiras, platôs | Hawlucha 701, Rufflet 627, Vullaby 629, Aron 304, Nacli 932, Sneasel 215, Noibat 714, Woobat 527, Gible 443 (raro) | paredes (Escalar) |
| **Rota 9, Estepe dos Ventos** | ESC → RP → MV | Capim alto do planalto, pedras soltas, cata-ventos de pedra, rajadas | Stantler 234, Mudsdale 750, Tauros 128, Rockruff 744, Swablu 333, Fletchinder 662, Skiddo 672, Larvitar 246, Hippopotas 449, Minior 774 (noite) | rajadas de vento |
| **Rota 10, Águas do Véu** | PE → Ilha do Véu | Lago aberto, neblina, boias velhas | Lapras 131 (raro), Finneon 456, Basculin 550, Lumineon 457, Feebas 349 (vara, raro), Gyarados 130 | água (Nadar), neblina |
| **Rota 11, Escadaria dos Vigias** | Planalto → RP | Escada de pedra esculpida, estátuas, menires menores | Bronzor 436, Baltoy 343, Sigilyph 561, Lunatone 337 (noite), Solrock 338 (dia), Unown 201 | — |
| **Rota 12, Caminho do Zênite** | RP → Z | Caverna e trilha de pico, todos os obstáculos | Garchomp 445 (Alfa), Gabite 444, Pupitar 247, Lucario 448, Golem 76, Steelix 208, Sneasler 903, Hydreigon 635 (raro), Frigibax 996 | todas as montarias |
| **Rota Marítima 13** | CO → Ilhas Coral → Sol Nascente | Mar aberto, recifes rasos, bancos de areia | Wailmer 320, Mantyke 458, Finizen 963, Remoraid 223, Corsola 222, Luvdisc 370, Pyukumuku 771, Sharpedo 319, Staryu 120 | água (Nadar), redemoinhos (Mergulhar) |

### Florestas, cavernas, lagos, montanhas e ilhas

| Lugar | Tipo | Coord. | Visual | Pokémon típicos | Acesso |
|---|---|---|---|---|---|
| **Bosque Sussurrante** | floresta | (10–52, 28–46) | Jequitibás e ipês gigantes, raios de luz verde, folhas que sussurram com o vento, clareiras com flores | Weedle 13, Caterpie 10, Combee 415, Spinarak 167, Venonat 48, Pineco 204, Petilil 548, Shroomish 285, Foongus 590, Teddiursa 216, Zorua 570, Phantump 708, Scyther 123 (raro), Heracross 214 (raro), Pinsir 127, Applin 840, Blipbug 824 | livre |
| **Toca do Absol (Gruta do Musgo)** | caverna | (32, 32) | Gruta de musgo verde-azulado, primeiro lugar onde se vê luzita brilhando nas paredes | Zubat 41, Woobat 527, Morelull 755, Paras 46, Glimmet 969 (raro), Ariados Alfa 168 (cap. 2) | livre |
| **Mata dos Jequitibás** | floresta secreta | (5, 30) | Mata primária, árvores tão altas que é noite ao meio-dia, cogumelos luminosos | Shiinotic 756, Trevenant 709, Leavanny 542, Kleavor 900 (Alfa), Ursaluna 901 (pós-jogo) | Correr (salta toras) |
| **Lago Espelho** | lago | (66–94, 36–54) | Lago enorme e parado que reflete o céu; ao centro, neblina perpétua | ver Rota 10 | Nadar |
| **Ilha do Véu** | ilha + interior | (84, 40) | Ilha rochosa escondida na neblina, com um observatório de pedra dos Vigias (Base Crepúsculo) | Murkrow 198, Houndour 228, Zorua 570 (só da Crepúsculo) | Nadar ou Voar |
| **Santuário do Crepúsculo** | templo submerso | (80, 44) | Templo de pedra azul no fundo do lago, colunas cobertas de algas que brilham como luar | Jellicent 593, Lanturn 171, Lumineon 457, Relicanth 369, **Lunala 792** | Mergulhar |
| **Brejo das Lamparinas** | pântano | (56–68, 36–46) | ver Rota 5 | ver Rota 5 | Nadar |
| **Lagoa Dourada** | lago secreto | (34, 50) | Lagoa redonda escondida nos campos; ao pôr do sol fica cor de mel | Goldeen 118, Seaking 119, Sunkern 191, Sunflora 192, Cherubi 420, Volbeat 313 e Illumise 314 (noite), Milotic 350 (raríssimo) | Correr (atalho pela cerca) |
| **Mina Aurora** | caverna industrial | (64, 24) | 4 níveis: trilhos, andaimes, lâmpadas; no fundo, paredes de luzita que pulsam e uma garra de cristal gigante | Glimmet 969, Carbink 703, Roggenrola 524, Boldore 525, Drilbur 529, Rolycoly 837, Steelix Alfa 208 | livre (cap. 6) |
| **Paredão** | montanha | faixa y=22–24 | Parede de pedra cinza e vermelha, cachoeiras, ninhos | ver Rota 8 | Escalar |
| **Planalto dos Ventos** | planalto | (0–100, 2–20) | Campo de capim que ondula com o vento, pedras soltas, céu enorme | ver Rota 9 | Escalar |
| **Ruínas dos Vigias** | ruína secreta | (36, 6) | Colunas caídas, inscrições, uma sala subterrânea com murais da Noite Antiga | Unown 201 (26 formas), Bronzong 437, Golett 622, Sigilyph 561 | Escalar + Lente Prisma |
| **Relógio de Pedra** | santuário | (48, 10) | Oito menires em roda num platô, Coração de cristal escuro no centro; à noite, as pedras brilham fraco | — | Escalar ou Voar |
| **Câmara do Coração** | interior do templo | sob o Relógio | Salão circular de cristal, raízes de luzita descendo pelas paredes | — | cap. 11 |
| **Fenda Prismática** | caverna secreta | sob o Relógio | Caverna de cristais que dividem a luz em cores, chão de espelho | Necrozma 800 (pós-jogo), Minior 774, Carbink 703, Glimmora 970 | pós-jogo |
| **Monte Zênite** | montanha | (48, 0–6) | Pico nevado acima das nuvens | ver Rota 12 | pós-cap. 11 |
| **Pico Geada** | montanha secreta | (6, 2) | Pico de neve funda no extremo noroeste, vento uivante, cristais de gelo | Snorunt 361, Snover 459, Cubchoo 613, Bergmite 712, Snom 872, Cetoddle 974, Frigibax 996, Wyrdeer 899 | Voar (pós-jogo) |
| **Costa Coral e Praia dos Corais** | praia | (40–70, 64–68) | Areia branca, corais à vista, piscinas naturais na maré baixa | Corsola 222, Staryu 120, Shellder 90, Binacle 688, Clauncher 692, Wimpod 767, Sandygast 769, Pyukumuku 771 | livre |
| **Gruta da Maré** | caverna marinha | (42, 66) | Gruta sob o morro do farol, só entra na maré baixa; câmara submersa ao fundo | Zubat 41, Krabby 98, Shuckle 213, Dwebble 557, Clamperl 366 (submersa) | maré baixa; Mergulhar para o fundo |
| **Ilhas Coral** | arquipélago | (22–34, 70–74) | Três ilhotas com coqueiros, uma vila de pescadores, recife ao redor | Wingull 278, Pelipper 279, Cramorant 845, Tropius 357, Oricorio 741, Exeggcute 102, Comfey 764 | Nadar |
| **Recife Afundado** | área submersa | (40, 72) | Navio naufragado entre corais, cardumes | Wishiwashi 746, Relicanth 369, Mantine 226, Clamperl 366, Bruxish 779, Alomomola 594 | Mergulhar |
| **Ilha do Sol Nascente** | ilha secreta | (96, 64) | Ilha de rocha vermelha no extremo leste, onde o sol nasce primeiro; templo aberto no topo | Volcarona 637 (raro), Larvesta 636, Solrock 338, Salandit 757, Turtonator 776, **Solgaleo 791** | Nadar + rastro de luz (Lente Prisma) |

### Interiores importantes (resumo para o agente do mundo)

| Interior | Cidade | Notas |
|---|---|---|
| Casa do jogador | VA | 2 andares; a Mãe cura a equipe; rádio na sala |
| Laboratório do Prof. Jatobá | VA | 3 pedestais; estufa; porão trancado (pós-jogo) |
| Centro Pokémon (modelo único) | todas | balcão da Enfermeira Joy, PC, mesa de troca, sofá; muda só a decoração por cidade |
| Mercado Pokémon (modelo único) | todas | balcão com 2 vendedores (comum e especial da cidade) |
| Megaloja Aurora | CA | 5 andares, elevador |
| 8 ginásios | ver seção 5 | quebra-cabeças descritos |
| Torre Aurora | CA | recepção, maquete, sala de controle, cobertura |
| Mina Aurora | CA | 4 níveis |
| Arquivo do Forte | FR | caixa de cartas |
| Base Crepúsculo (Observatório do Véu) | Ilha do Véu | cúpula com telescópio quebrado, alojamentos, celas, sala de tábuas, heliponto improvisado |
| Santuário do Crepúsculo | Lago Espelho | templo submerso com 3 salões e o altar de Lunala |
| Templo do Relógio / Câmara do Coração | Planalto | escadaria interna, salão do Coração |
| Ruínas dos Vigias | Planalto | murais da Noite Antiga, câmara de Unown |
| Cidadela do Zênite | Z | 4 salas da Elite + salão da Campeã + Hall da Fama |
| Casa da Vó Benta | VL | fogão a lenha, receita |
| Casarão das Velas | VL | ginásio de noite |

### Itens-chave da história

| Item | Cap. | Efeito |
|---|---|---|
| Pokédex | 1 | registra espécies; ganha lanterna (cap. 5), mapa de Alfa (cap. 8) |
| Apito de Montaria | 2 | chama a montaria certa para o obstáculo à frente |
| Lente Prisma | 4 | revela rastros de luz, pontes invisíveis no brejo, inscrições escondidas |
| Vela Eterna | 5 | ilumina cavernas escuras (raio de luz em volta do jogador); é o 8.º fragmento |
| Foto do Painel | 6 | prova contra a Aurora |
| Crachá Aurora | 6 | abre portas de serviço da Aurora até o cap. 9 |
| Cartas de Véspera | 7 | lore; mostrar a Jatobá no cap. 9 |
| Escama Lunar | 10 | chama Lunala no cap. 11 |
| Broche de Estrela | 11 | presente de Véspera; Dalva reconhece no cap. 12 |
| Prisma do Alvorecer | 11 | abre a Fenda Prismática e a Ilha do Sol Nascente no pós-jogo |

### MTs da história

MT01 Ataque Rápido (Tomé) · MT02 Picada (Lia) · MT03 Hidro Pulso (Marina) · MT04 Faísca (Jonas) · MT05 Bola
Sombria (Zélia) · MT06 Canhão de Luz (Mina Aurora) · MT07 Quebra-Tijolo (Brás) · MT08 Deslize de Pedra (Graça) ·
MT09 Golpe Aéreo (Celeste) · MT10 Pulso Sombrio (Véspera) · MT11 Raio Solar (Relógio) · MT12 Clarão Lunar
(Campeã Dalva).

---

## 7. Missões secundárias

Curtas, cada uma com começo, meio e uma recompensa que o jogador sente. Ids sugeridos para flags entre crases.

| # | Missão (id) | Onde / quando | O que é | Recompensa |
|---|---|---|---|---|
| 1 | **O Lechonk guloso** `sq_lechonk` | Campina, cap. 1+ | Um Lechonk está comendo a horta da Dona Cida. Seguir as pegadas pela cidade e achá-lo dormindo dentro de um silo, roncando em cima das abóboras. Escolha: levá-lo de volta (ele vira o "mascote da horta") ou capturá-lo com a bênção dela. | Lechonk (#915) com o golpe Mud Shot, ou 5 Bagas Oran |
| 2 | **A viola do Seu Juca** `sq_viola` | Sussurro, cap. 2+ | Seu Juca precisa de três cordas: seda de Spinarak (Bosque), fio de Joltik (Rota 6, noite) e cera de Combee (estufa da Lia). Quando a viola fica pronta, ele toca e todas as árvores do bosque "respondem". | Viola de Seu Juca (item: toca música que acalma Alfa por 10 s) |
| 3 | **Cadê o Pipoca?** `sq_pipoca` | Bosque, cap. 2+ | Tito perdeu o Skwovet Pipoca. Seguir a trilha de nozes, que cada Pokémon do bosque "rouba" um pouco; o último pedaço está com um Greedent (#820) enorme que é... a mãe do Pipoca. | Ovo da Sorte (mais experiência) |
| 4 | **O Tauros de olhos vermelhos** `sq_tauros` | Rota 1, depois do cap. 2 | Um Tauros Alfa (#128, nv. 22) derruba as cercas dos Campos de Lúmen. Cansar o Tauros correndo de Mudbray ao lado dele até ele parar, e depois vencê-lo. | Tauros Alfa capturável, ₽3000 |
| 5 | **Cartas na garrafa** `sq_garrafas` | Lago e mar, cap. 3+ | Seis garrafas boiam pelo Lago Espelho e pelo Mar do Sul. São cartas do Capitão Ivo, o pai do jogador, que ele jogava ao mar sem esperança de chegar. A última diz "quando o sol voltar à hora certa, eu volto também". | Concha Bonita, falas novas da Mãe, cena do pai no epílogo |
| 6 | **O farol pisca errado** `sq_farol` | Coral, cap. 4+ | Iracema garante que o farol novo pisca uma mensagem em Morse. Anotar a sequência à noite: "S-O-C-O-R-R-O". Era o Rotom preso na máquina de luzita. Libertá-lo no topo do farol. | Rotom (#479) |
| 7 | **Os 26 Unown** `sq_unown` | Ruínas dos Vigias, cap. 8+ | Encontrar os 26 Unown (#201) espalhados pelas ruínas e pelo Planalto. Cada forma revela uma letra do mural; juntas: a história da Noite Antiga e a frase "O RELÓGIO NÃO ACENDE O SOL". | Lore, Pedra do Sol (item de evolução) |
| 8 | **O bolo da Vó Benta** `sq_bolo` | Lamparina, cap. 5+ | Vó Benta quer fazer o bolo de fubá da Noite Longa, mas falta: fubá de Campina, leite de Miltank (#241) das Ilhas Coral, ovo de Chansey (#113) e mel de Combee. Entrega tudo e ela conta, com o bolo na mesa, como a Helena nasceu na noite em que a luz acabou. | Bolo de Fubá (cura total), Doce Raro ×2 |
| 9 | **A casa dos Solano** `sq_solano` | Lamparina, cap. 6+ | Um Yamask (#562) vaga pela casa abandonada dos Solano segurando uma máscara de menino. Achar o diário de Tiago Solano no sótão. A última página tem um desenho do irmão "que vai acender o mundo". Mostrar a Solano no epílogo. | o Yamask (#562) se junta à equipe; fala extra de Solano no epílogo |
| 10 | **Corrida da Lili** `sq_corrida` | Campina, cap. 2+ | Três corridas de Mudbray pelos Campos de Lúmen contra a Lili, cada uma mais difícil. | Sela de Couro (Mudbray mais rápido), Mudbray vira Mudsdale (#750) como montaria |
| 11 | **O Steelix de cristal** `sq_steelix` | Mina Abandonada (nível 5 da Mina Aurora), pós-cap. 6 | Um Steelix Alfa coberto de luzita, mais forte que o da história, dorme no fundo da mina fechada. Precisa da Vela Eterna para enxergar. | Steelix Alfa (#208) capturável, Pedra Dura |
| 12 | **O carteiro do céu** `sq_carteiro` | Mirante, cap. 9+ | O Corviknight-carteiro torceu a asa. Entregar 5 cartas, uma em cada Ninho, dentro do tempo, usando o voo. A última é para o Iberê, que ainda não é da Elite: é o aviso da própria aposentadoria. | MT Asa de Aço, 5 Penas de Saúde |
| 13 | **O Gyarados da tempestade** `sq_gyarados` | Lago Espelho, chuva, cap. 3+ | Em dia de chuva, um Gyarados Alfa (#130, nv. 40) vira barcos no lago. Vencê-lo nadando de Lapras entre ondas. Seu Nestor conta que é o mesmo Magikarp que a Marina devolveu à água quando era criança. | Gyarados Alfa capturável |
| 14 | **Estrelas cadentes** `sq_minior` | Planalto, noite, cap. 8+ | Nas noites claras, Minior (#774) caem do céu no Planalto. Coletar 7 cores de núcleo. O Último Vigia conta que os Minior vêm "do mesmo céu de onde o Prisma caiu". | Pó Estelar ×7, lore do Necrozma |
| 15 | **A reportagem da Pipa** `sq_pipa` | toda a região, cap. 6 a 10 | Fotografar 10 Pokémon Alfa diferentes com a Rotom câmera da Pipa. As fotos viram a matéria que derruba a Aurora. Se completar antes do cap. 10, a cidade inteira aparece no Relógio para ajudar no cap. 11 (fala extra). | Câmera Rotom (modo foto), fala extra no cap. 11 |
| 16 | **O mergulho do Seu Nestor** `sq_anel` | Recife Afundado, cap. 10+ | Seu Nestor perdeu a aliança da finada esposa no naufrágio. Mergulhar no navio afundado, resolver as portas inundadas e achá-la dentro do baú do capitão, guardada por um Dhelmise (#781). | Dhelmise capturável, Concha Grande |
| 17 | **O rastro do sol** `sq_solnascente` | Ilha do Sol Nascente, pós-jogo | Com o Prisma do Alvorecer e a Lente Prisma, seguir o rastro de luz que o Solgaleo deixa toda madrugada pelo mar até a Ilha do Sol Nascente. No topo, ele espera o jogador ao nascer do sol. | Solgaleo (#791) nv. 70 |
| 18 | **Sina e Véspera** `sq_sina` | Prisão de Cidade Aurora, pós-jogo | Véspera, presa, pede que o jogador visite Sina, que ficou no Cemitério das Velas. A Absol só aceita ir com ele depois de uma batalha. | Absol "Sina" (#359) nv. 55, com o golpe Corte Noturno |
| 19 | **O cervo da neve** `sq_wyrdeer` | Pico Geada, pós-jogo | Um velho Wyrdeer guia os viajantes perdidos na neve. Seguir as pegadas dele até o filhote preso numa fenda. | montaria secreta Wyrdeer (#899) |
| 20 | **O Prisma Faminto** `sq_necrozma` | Fenda Prismática, pós-jogo | Descer a Fenda resolvendo prismas que dividem a luz em cores (cada cor abre uma porta). No fundo, o Necrozma, enfraquecido e com fome. | Necrozma (#800) nv. 72 |

---

## 8. Formato dos arquivos de diálogo

Os capítulos ficam em `src/story/script/cap01.js` … `cap12.js`. O índice é `src/story/script/index.js` e os
nomes de quem fala ficam em `src/story/script/personagens.js`.

```js
export default {
  id: 'cap01',
  titulo: 'O primeiro alvorecer',
  sol: '6h11',                  // hora do nascer do sol neste capítulo (Rádio Alvorada)
  cenas: [
    {
      id: 'acordar',
      local: 'casa_jogador',      // id de lugar do mapa-alvorada.json ou de interior
      gatilho: { tipo: 'inicio' },
      falas: [['mae', 'Texto...'], ['jogador', '...']],
      escolhas: [                 // opcional: o motor mostra os textos e segue o ramo escolhido
        { texto: 'Opção A', falas: [['mae', '...']], flags: { x: true } },
      ],
      depois: {                   // opcional
        flags: { intro: true },
        itens: [['pokeball', 5]],
        batalha: { id: 'rival1', nome: 'Rival Téo', equipe: [['rival:1', 5, ['tackle']]], perder: 'continua' },
        insignia: 'campina', mt: 'quickAttack', montaria: 'mudbray', dinheiro: 1200,
        objetivo: 'Vá ao laboratório',
        fimCapitulo: true,
      },
    },
  ],
};
```

**Quem fala:** ids de `personagens.js` (`mae`, `prof`, `teo`…). `narrador` é texto sem nome (caixa cinza).
`jogador` é o protagonista e aparece com o nome escolhido.

**Variáveis no texto:** `{jogador}` (nome do protagonista), `{inicial}` (nome do Pokémon inicial do jogador),
`{rival_inicial}` (nome do inicial do Téo), `{hora}` (hora atual do jogo).

**Gatilhos (`gatilho.tipo`):**

| tipo | campos | quando dispara |
|---|---|---|
| `inicio` | — | início do capítulo |
| `apos` | `cena` | logo depois que a cena citada termina |
| `entrar` | `alvo` (id de lugar), `hora?` (`'noite'`/`'dia'`) | o jogador entra no lugar |
| `falar` | `alvo` (id de personagem) | o jogador interage com o personagem |
| `pisar` | `alvo` (id de zona) | o jogador pisa numa zona marcada |
| `vencer` | `alvo` (id da batalha) | depois de vencer aquela batalha |
| `avistar` | `alvo` (id do treinador) | um treinador vê o jogador (o "!") |
| `item` | `alvo` (id do item ou objeto) | o jogador usa um item ou interage com um objeto (pedestal, caixa) |
| `perder` | `alvo` (id da batalha) | depois de perder aquela batalha |
| `flag` | `alvo` (flag), `valor?` | quando a flag fica verdadeira (ou igual a `valor`) |
| `interromper` | `alvo` (id da batalha) | no meio da batalha, quando ela tem `interrompe: '<id da cena>'` (cap. 3) |

Todo gatilho pode ter `requer: ['flag1', 'flag2']` (flags verdadeiras) e `semFlag: ['flagX']` (não pode estar
setada). Cenas com `repete: true` podem tocar de novo (falas de NPC parado).

Convenções de flag: `badges.campina` = a lista `badges` contém `'campina'`; `trainers.g1_icaro` = aquele
treinador foi vencido; `mounts.correr` = montaria liberada; `'profPerdao=cobrou'` em `requer` compara o valor; em
`depois.flags`, o valor `'+1'` soma 1 (contador) e `null` apaga. Missões secundárias usam `sq_<id>` com
`'disponivel'`, `'ativa'` e a flag `sq_<id>_completa` quando terminadas.

**Equipe de batalha:** `[dex, nivel, golpes?, extra?]`. `dex` pode ser `'rival:1'`, `'rival:2'` ou `'rival:3'`;
golpes vazios = golpes padrão do nível; `extra` = `{ forma: 'crepusculo' | 'diurna' | 'juba_do_crepusculo' }`.
`perder: 'continua'` (a história segue), `'centro'` (volta ao último Centro Pokémon, padrão), `'repete'` (a cena
recomeça). `alfa: true` marca Pokémon Alfa, `chefe: true` a luta final. `dupla: 'teo'` indica luta com aliado;
`aliado` e `inimigoDupla` trazem as equipes extras (cap. 11).

**Outros campos de `depois`:** `arena` (leva o jogador a um ponto antes da luta), `fade: 'preto'` (escurece a
tela), `creditos: true`, `mt` (id do golpe), `montaria` (`mudbray`, `lapras`, `sneasler`, `corviknight`,
`mantine`), `insignia` (id da lista `BADGES`), `dinheiro`, `objetivo` (texto do HUD), `fimCapitulo`.
A flag `ceu` (`'noite_sem_fim'`, `'crepusculo_eterno'`, `'normal'`) diz ao `DayNight` como pintar o céu no cap. 11.

**Motor (`src/story/roteiro.js`), detalhes que valem para os capítulos jogáveis:**
- `objetivo` pode ser texto ou `{ texto, alvo, treinadores?, rotulo? }`: `alvo` é um ponto do mapa, um interior, uma
  área ou um personagem do elenco (a seta do HUD aponta para ele, ou para a porta do prédio); `treinadores` mostra
  "Aprendizes: 1/2" e aponta para o próximo que falta.
- `depois.hora` (número) faz o tempo passar até aquela hora (ex.: esperar a noite na estufa da Lia).
- `antes: { flags }` aplica flags no começo da cena. Escolhas aceitam `falas`, `flags` e `depois`.
- `interrompe` numa batalha: depois de 2 Pokémon do treinador desmaiarem, a luta para e a cena do gatilho
  `interromper` toca. `alfa: true` sem treinador: o Pokémon aparece no ponto `*alfa*` mais perto.
- Uma cena com batalha só conta como feita se a batalha for vencida (ou com `perder: 'continua'`, que marca o
  treinador como enfrentado). Perdendo, o jogador volta ao último Centro Pokémon e pode tentar de novo.
- Falas de `treinador`/`aprendiz` saem com o nome do treinador da cena (do elenco).

**Números do roteiro:** 12 capítulos, 270 cenas, cerca de 980 falas e 78 batalhas definidas. Para conferir a
estrutura: todo `apos` aponta para uma cena do mesmo capítulo, todo `vencer`/`perder` aponta para uma batalha
existente e todo `quem` existe em `personagens.js`.

**Flags compatíveis com o 3D:** `intro`, `talkedProf`, `starter`, `rivalStarter`, `rival1`, `balls`,
`rivalGone`, `campina`, `rivalCampina`, `trainers`, `badges`, `ch1Done`, `chapter`, `profBadge`, `momBadge`,
`playerName`. Novos capítulos seguem o padrão `ch2Done` … `ch12Done`, e montarias em `mounts: { correr, nadar,
escalar, voar, mergulhar }`.
