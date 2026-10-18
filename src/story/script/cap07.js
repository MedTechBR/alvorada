// Capítulo 7: Cartas no forte
// Rota 7 (Ravina do Rochedo) → Forte Rochedo → Arquivo do Forte (Sereno, cartas) → Roda de Capoeira (ginásio do Brás) → Sneasler.
// Reviravolta 2: Jatobá e Véspera descobriram a luzita; foi ele quem a levou a Solano. Sina é a Absol de Véspera.

export default {
  id: 'cap07',
  titulo: 'Cartas no forte',
  sol: '7h31',
  cenas: [
    {
      id: 'titulo',
      local: 'rota7',
      gatilho: { tipo: 'inicio', requer: ['ch6Done'] },
      falas: [['narrador', 'Capítulo 7: Cartas no forte']],
      depois: { flags: { chapter: 7 } },
    },
    {
      id: 'radio',
      local: 'rota7',
      gatilho: { tipo: 'apos', cena: 'titulo' },
      falas: [
        ['radio', 'Bom dia, Alvorada. Sete e trinta e um.'],
        ['radio', 'O jornal "O Farol" publicou hoje uma foto de um painel da Companhia Aurora com uma coluna chamada "consumo de alvorada". A Aurora diz que é montagem.'],
        ['radio', 'Eu conheço a moça que tirou. Não é montagem. Pronto, falei. Se me demitirem, eu abro uma rádio pirata no quintal.'],
      ],
    },
    {
      id: 'ravina',
      local: 'rota7',
      gatilho: { tipo: 'pisar', alvo: 'ravina_inicio', semFlag: ['viuRavina'] },
      falas: [
        ['narrador', 'A Ravina do Rochedo corre ao pé do Paredão. A pedra é vermelha, cheia de ruínas de uma muralha antiga.'],
        ['narrador', 'Lá no alto, a parede do Paredão sobe até sumir nas nuvens. Em alguns trechos, trepadeiras grossas descem pela rocha. Daria para subir… com as garras certas.'],
      ],
      depois: { flags: { viuRavina: true } },
    },
    {
      id: 'faixa_rota7',
      local: 'rota7',
      gatilho: { tipo: 'avistar', alvo: 'r7_jairo' },
      falas: [['treinador', 'Eu treino socando pedra. As pedras estão ganhando, mas eu não desisto!']],
      depois: { batalha: { id: 'r7_jairo', nome: 'Lutador Jairo', dinheiro: 1300, equipe: [[66, 30, ['karateChop', 'lowKick', 'leer']], [296, 31, ['armThrust', 'fakeOut', 'knockOff']]] } },
    },
    {
      id: 'faixa_rota7b',
      local: 'rota7',
      gatilho: { tipo: 'avistar', alvo: 'r7_soraia' },
      falas: [['treinador', 'Ginga! Ginga! Se você não ginga, você apanha. Primeira lição grátis!']],
      depois: { batalha: { id: 'r7_soraia', nome: 'Capoeirista Soraia', dinheiro: 1300, equipe: [[532, 30, ['lowKick', 'rockThrow', 'bulkUp']], [619, 31, ['forcePalm', 'fakeOut', 'uTurn']]] } },
    },
    {
      id: 'forte_chegada',
      local: 'forte_rochedo',
      gatilho: { tipo: 'entrar', alvo: 'forte_rochedo', semFlag: ['rochedo'] },
      falas: [
        ['narrador', 'Forte Rochedo: muralhas de pedra, canhões enferrujados virados para o nada e uma vila inteira morando dentro da fortaleza.'],
        ['bras', 'Ê, chegou visita! Bem-vindo ao Forte, camará! Eu sou o Brás. Líder do ginásio, mestre de capoeira e cozinheiro de feijão nas horas vagas.'],
        ['bras', 'Mas antes de qualquer roda, me ajuda numa coisa? Tem um sujeito de luva lá no arquivo. Entrou dizendo que era historiador. Historiador não tranca a porta por dentro.'],
      ],
      depois: { flags: { rochedo: true }, objetivo: 'Vá ao Arquivo do Forte' },
    },
    {
      id: 'arquivo_sereno',
      local: 'arquivo_forte',
      gatilho: { tipo: 'entrar', alvo: 'arquivo_forte', semFlag: ['trainers.c7_sereno'] },
      falas: [
        ['narrador', 'Estantes altas, mapas enrolados, poeira dançando na luz. No meio da sala, um homem de capa roxa e luvas brancas guarda algo numa caixa de veludo.'],
        ['sereno', 'Ah. O famoso {jogador}. O Ébano fala de você com uma ênfase que eu nunca tinha visto.'],
        ['sereno', 'Sou Sereno. Cuido dos documentos da Equipe Crepúsculo. Das traduções. Das tábuas antigas. Coisas chatas, que alguém precisa fazer.'],
        ['sereno', 'Isto aqui é o Fragmento do Punho, que o Brás guardava neste arquivo, embaixo de um mapa de 1740. Muito poético. Pouco seguro.'],
        ['jogador', 'Devolve.'],
        ['sereno', 'Não. Mas eu posso te dar uma batalha, para você não ir embora de mãos vazias. Sou educado.'],
      ],
      depois: { batalha: { id: 'c7_sereno', nome: 'Admin Sereno', dinheiro: 2600, equipe: [[93, 31, ['shadowPunch', 'hypnosis', 'suckerPunch']], [510, 32, ['nightSlash', 'fakeOut', 'uTurn']], [354, 33, ['shadowSneak', 'willOWisp', 'feintAttack', 'curse']]] } },
    },
    {
      id: 'sereno_foge',
      local: 'arquivo_forte',
      gatilho: { tipo: 'vencer', alvo: 'c7_sereno' },
      falas: [
        ['sereno', 'Muito bom. De verdade. Mas ganhar uma batalha não é ganhar a pedra.'],
        ['narrador', 'O Banette de Sereno estoura numa nuvem de sombra. Quando ela some, Sereno, a caixa de veludo e o Fragmento do Punho sumiram também.'],
        ['narrador', 'Na pressa, ele derrubou uma estante inteira. Entre os papéis no chão, há uma caixa de lata com a tampa aberta. Cartas.'],
      ],
      depois: { flags: { punhoRoubado: true }, objetivo: 'Leia as cartas caídas no arquivo' },
    },
    {
      id: 'cartas',
      local: 'arquivo_forte',
      gatilho: { tipo: 'falar', alvo: 'caixa_cartas', requer: ['punhoRoubado'], semFlag: ['leuCartas'] },
      falas: [
        ['narrador', 'Uma caixa de lata. Na tampa, em letra caprichada: "Para o Jatobá. Se um dia ele quiser lembrar." As cartas são de dezesseis anos atrás.'],
        ['narrador', 'Carta 1. "Jatobá, você não vai acreditar. A gruta do Paredão brilha por dentro. O cristal é morno. A Sina não para de rosnar para ele. Venha ver amanhã. V."'],
        ['narrador', 'Carta 2. "Tiramos a amostra. É linda. Mas desde ontem a Sina não dorme e o sol nasceu quatro minutos atrasado. Pode ser coincidência. Eu não acredito em coincidência. V."'],
        ['narrador', 'Carta 3. A letra está tremida. "A noite não acabou. Faz trinta horas. Os Pokémon da vila estão de olho vermelho. A Sina entrou na gruta para tirar os mineiros e não voltou. Jatobá, nós fizemos isso. Nós dois."'],
        ['narrador', 'Carta 4. "O sol voltou. A Sina não. Ela está viva: vi o vulto dela no alto do Paredão, branca. Ela não vem quando eu chamo. Acho que ela ficou guardando alguma coisa."'],
        ['narrador', 'Carta 5. "Você levou a amostra para o Augusto Solano. Ele me contou rindo, como se fosse boa notícia. Você disse que era para pagar o laboratório. Você vendeu a noite em que a Sina se perdeu."'],
        ['narrador', 'Carta 6. "Não vou mais te escrever. A Dalva também não atende mais minhas ligações; ela diz que eu preciso descansar. Ninguém quer ouvir. Então eu vou parar de pedir para ouvirem. V."'],
        ['jogador', '(O Professor… levou a luzita para o Solano. A Noite Longa foi a primeira extração.)'],
        ['jogador', '(E o Absol… é a Sina. É a Absol da Véspera.)'],
      ],
      depois: { flags: { leuCartas: true, reviravolta2: true }, itens: [['cartas_vespera', 1]] },
    },
    {
      id: 'ligacao_prof',
      local: 'arquivo_forte',
      gatilho: { tipo: 'apos', cena: 'cartas' },
      falas: [
        ['pokedex', 'Bzzz…'],
        ['prof', '{jogador}? Aqui é o Jatobá. A Pipa disse que você estava no Forte. Está tudo bem? Achou alguma coisa no arquivo?'],
      ],
      escolhas: [
        {
          texto: 'Achei as cartas da Véspera.',
          falas: [
            ['prof', '…'],
            ['prof', 'Eu… eu não consigo falar disso pelo telefone. Me desculpe. Me desculpe, {jogador}.'],
            ['narrador', 'A ligação cai.'],
          ],
          flags: { contouProf: true },
        },
        {
          texto: 'Não achei nada.',
          falas: [
            ['prof', 'Ah. Está bem. Então… tome cuidado aí em cima.'],
            ['narrador', 'Pela voz dele, ele sabe que você mentiu. E sabe por quê.'],
          ],
        },
      ],
    },
    {
      id: 'bras_depois',
      local: 'forte_rochedo',
      gatilho: { tipo: 'falar', alvo: 'bras', requer: ['leuCartas'], semFlag: ['brasConversou'] },
      falas: [
        ['bras', 'Ele levou a pedra, né? Eu vi a cara dele saindo. Cara de quem não suou. Desconfio de quem não sua.'],
        ['bras', 'Tudo bem, camará. Pedra a gente recupera. Agora, ginga perdida é que não volta. Bora pra roda?'],
        ['bras', 'Mas antes passa no Mestre Cobra. O ginásio é de ritmo, e quem me ensinou ritmo foi ele.'],
      ],
      depois: { flags: { brasConversou: true }, objetivo: 'Aprenda o ritmo com o Mestre Cobra e entre na Roda' },
    },
    {
      id: 'cobra',
      local: 'casa_cobra',
      gatilho: { tipo: 'falar', alvo: 'cobra' },
      repete: true,
      falas: [
        ['cobra', 'Senta, menino. Eu não enxergo, mas eu escuto teu coração. Tá batendo torto. Coisa pesada no peito, hein?'],
        ['cobra', 'Na roda, o berimbau fala três coisas: o grave, o médio e o agudo. Grave é chão. Médio é corpo. Agudo é céu.'],
        ['cobra', 'Escuta a sequência, depois pisa. Não corre na frente da música. A música sempre chega na hora certa. O sol também chegava.'],
      ],
    },
    {
      id: 'roda_entrada',
      local: 'roda_capoeira',
      gatilho: { tipo: 'entrar', alvo: 'roda_capoeira', semFlag: ['rodaDentro'] },
      falas: [
        ['narrador', 'Um salão redondo de pedra, com placas no chão em três tons. No centro, atrás de três portões, a roda interna. Um berimbau toca sozinho, gravado.'],
        ['narrador', 'Grave, médio, grave. Pise nas placas no mesmo ritmo para abrir o primeiro portão.'],
      ],
      depois: { flags: { rodaDentro: true } },
    },
    {
      id: 'aprendiz_bras1',
      local: 'roda_capoeira',
      gatilho: { tipo: 'avistar', alvo: 'g6_dandara' },
      falas: [['aprendiz', 'Errou o compasso? Então entra na roda comigo!']],
      depois: { batalha: { id: 'g6_dandara', nome: 'Faixa-preta Dandara', dinheiro: 1400, equipe: [[307, 29, ['meditate', 'forcePalm', 'confusion']], [619, 30, ['forcePalm', 'uTurn', 'fakeOut']]] } },
    },
    {
      id: 'aprendiz_bras2',
      local: 'roda_capoeira',
      gatilho: { tipo: 'avistar', alvo: 'g6_tiao' },
      falas: [['aprendiz', 'Meu Crabrawler aprendeu capoeira só de olhar. Ele ginga de lado. Porque ele é caranguejo.']],
      depois: { batalha: { id: 'g6_tiao', nome: 'Faixa-preta Tião', dinheiro: 1450, equipe: [[532, 30, ['lowKick', 'rockThrow', 'focusEnergy']], [739, 31, ['powerUpPunch', 'bubbleBeam', 'payback']]] } },
    },
    {
      id: 'bras_desafio',
      local: 'roda_capoeira',
      gatilho: { tipo: 'falar', alvo: 'bras', requer: ['portoesRoda', 'trainers.g6_dandara', 'trainers.g6_tiao'], semFlag: ['badges.rochedo'] },
      falas: [
        ['bras', 'Ê, camará! Abriu os três portões! O berimbau gostou de você.'],
        ['bras', 'Na capoeira, luta é conversa. A gente pergunta com o pé e responde com a esquiva. Bora conversar!'],
      ],
      depois: {
        batalha: {
          id: 'leader_bras', nome: 'Líder Brás', dinheiro: 3400,
          equipe: [
            [67, 31, ['karateChop', 'lowKick', 'focusEnergy']],
            [701, 32, ['wingAttack', 'karateChop', 'roost']],
            [447, 32, ['forcePalm', 'quickAttack', 'counter']],
            [214, 33, ['brickBreak', 'hornAttack', 'bulletSeed']],
            [237, 34, ['rapidSpin', 'tripleKick', 'quickAttack', 'detect']],
          ],
        },
      },
    },
    {
      id: 'bras_perdeu_jogador',
      local: 'roda_capoeira',
      gatilho: { tipo: 'perder', alvo: 'leader_bras' },
      falas: [['bras', 'Ê, camará! A roda gira. Volte que ela gira de novo.']],
    },
    {
      id: 'bras_vencido',
      local: 'roda_capoeira',
      gatilho: { tipo: 'vencer', alvo: 'leader_bras' },
      falas: [
        ['bras', 'Que ginga! A Insígnia Punho é sua.'],
        ['narrador', '{jogador} recebeu a Insígnia Punho!'],
        ['bras', 'E a MT Quebra-Tijolo. Pra parede, pra escudo e pra teimosia.'],
        ['bras', 'Escuta. Eu sei que você leu alguma coisa pesada lá no arquivo. Não precisa me contar.'],
        ['bras', 'Quem sabe a verdade precisa subir pra ver de cima. E pra subir o Paredão, só com ela.'],
        ['narrador', 'Uma Sneasler desce de uma viga do teto, girando, e cai de pé na sua frente. As garras são longas e curvas como ganchos.'],
        ['bras', 'Essa é a Garra. Ela sobe parede como quem sobe escada. Agora o Paredão é seu.'],
        ['narrador', 'Agora a Sneasler pode levar {jogador} para ESCALAR paredes com trepadeiras e rachaduras!'],
      ],
      depois: { insignia: 'rochedo', mt: 'brickBreak', montaria: 'sneasler', flags: { 'badges.rochedo': true, 'mounts.escalar': true } },
    },
    {
      id: 'fim',
      local: 'forte_rochedo',
      gatilho: { tipo: 'apos', cena: 'bras_vencido' },
      falas: [
        ['pokedex', 'Bzzz…'],
        ['bia', '{jogador}… É a Bia. O Professor saiu do laboratório ontem à noite e não voltou. Deixou um bilhete: "Fui consertar uma coisa."'],
        ['bia', 'Ele levou o Seu Cacho. E o caderno velho do porão, aquele que ele nunca deixa ninguém ler.'],
        ['bia', 'Você sabe de alguma coisa, né? Tudo bem. Quando puder, me conta.'],
        ['bia', 'O próximo ginásio é em Cidade Escarpa, lá em cima do Paredão. A Graça é dura, mas é justa. Toma cuidado na subida.'],
        ['narrador', 'Fim do Capítulo 7'],
      ],
      depois: { flags: { ch7Done: true, chapter: 8 }, objetivo: 'Escale o Paredão pela Rota 8 até Cidade Escarpa', fimCapitulo: true },
    },
  ],
};
