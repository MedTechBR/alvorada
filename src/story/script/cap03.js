// Jornada de Porto Espelho: "O espelho partido" (era o capítulo 3).
// Rota 3 (Margem das Garças) → Porto Espelho → Galpão de Barcos (ginásio) → assalto da Crepúsculo → Lapras.
// Mundo aberto: começa na ponte da Rota 3 ou ao chegar ao porto, em qualquer ordem (o bolo da Mãe foi para a trama).
// Jogável pelo motor src/story/roteiro.js. Níveis do lugar (escada por distância): selvagens 5–9 na Rota 3 e 19–23 no lago, treinadores 6–12, Ébano 12–14, Marina 12–15 (~15).

export default {
  id: 'cap03',
  jornada: 'espelho',
  titulo: 'O espelho partido',
  sol: '6h28',
  cenas: [
    {
      id: 'ponte',
      local: 'rota3',
      gatilho: { tipo: 'pisar', alvo: 'ponte_leste', semFlag: ['viuPonte'] },
      falas: [
        ['narrador', 'A ponte velha foi trocada por uma nova, de madeira clara. Nos dois lados, postes com cristais de luzita brilham mesmo de dia.'],
        ['narrador', 'Uma placa diz: "Reconstruída pela Companhia Aurora. A luz que Alvorada merece."'],
        ['narrador', 'Embaixo da ponte, um grupo de Psyduck segura a cabeça com as duas mãos. Mais do que o normal.'],
      ],
      depois: { flags: { viuPonte: true }, objetivo: { texto: 'Siga a Margem das Garças até Porto Espelho', alvo: 'porto_espelho' } },
    },
    {
      id: 'pescador_rota3',
      local: 'rota3',
      gatilho: { tipo: 'avistar', alvo: 'r3_seu_bigode' },
      falas: [['treinador', 'Quarenta anos pescando aqui e nunca vi o lago tão quieto. Até o Magikarp anda triste. Vamos batalhar pra animar!']],
      depois: { batalha: { id: 'r3_seu_bigode', nome: 'Pescador Bigode', dinheiro: 640, equipe: [[129, 6, ['splash', 'tackle']], [129, 6, ['splash', 'tackle']], [339, 8, ['mudSlap', 'waterGun', 'watersport']]] } },
    },
    {
      id: 'nadadora_rota3',
      local: 'rota3',
      gatilho: { tipo: 'avistar', alvo: 'r3_carol' },
      falas: [['treinador', 'Sabe por que o lago se chama Espelho? Olha pra água. Olhou? Pronto, batalha!']],
      depois: { batalha: { id: 'r3_carol', nome: 'Garota da Praia Carol', dinheiro: 660, equipe: [[283, 7, ['bubble', 'quickAttack', 'sweetScent']], [580, 8, ['waterGun', 'wingAttack', 'defog']]] } },
    },
    {
      id: 'porto_chegada',
      local: 'porto_espelho',
      gatilho: { tipo: 'entrar', alvo: 'porto_espelho', semFlag: ['espelho'] },
      falas: [
        ['narrador', 'Porto Espelho. Palafitas coloridas, redes secando ao vento e um lago tão parado que o céu parece estar duas vezes no mundo.'],
        ['jandira', 'Ô, menino! Primeira vez no porto? Dá pra ver pela cara de quem nunca comeu a minha moqueca.'],
        ['jandira', 'Eu sou a Jandira. Esse aqui é o Doutor. É um Slowpoke. Ele está pensando numa resposta desde terça-feira.'],
        ['jandira', 'Se você veio pela Marina, ela está no galpão de barcos, no fim do píer. Mas cuidado, que hoje está cheio de gente estranha no porto.'],
      ],
      depois: { flags: { espelho: true }, objetivo: { texto: 'Desafie a Líder Marina no galpão de barcos, no fim do píer', alvo: 'marina_galpao', treinadores: ['g3_zeca', 'g3_taina'], rotulo: 'Aprendizes' } },
    },
    {
      id: 'nestor_porto',
      local: 'casa_nestor',
      gatilho: { tipo: 'falar', alvo: 'nestor', semFlag: ['conheceuNestor'] },
      falas: [
        ['nestor', 'Entra, entra. Não repara nas garrafas. Cada uma tem uma história. Algumas têm só areia, mas a maioria tem história.'],
        ['nestor', 'A Marina é minha neta. Desde pequena bate de frente com o vento. Ganhou do vento tantas vezes que ele agora pede licença.'],
        ['nestor', 'Antigamente tinha uma Mantine que me acompanhava pelo lago. Ela mergulhava até o fundo, onde dizem que dorme a Asa do Crepúsculo.'],
        ['nestor', 'Lenda de velho. Mas lenda de velho às vezes é só verdade que ficou cansada.'],
      ],
      depois: { flags: { conheceuNestor: true } },
    },
    {
      // montaria Mergulhar: a velha Mantine do Seu Nestor (para treinador com a Gota e quatro insígnias)
      id: 'nestor_mantine',
      local: 'casa_nestor',
      gatilho: { tipo: 'falar', alvo: 'nestor', requer: ['badges.espelho', 'insignias>=4'], semFlag: ['mounts.mergulhar'] },
      falas: [
        ['nestor', 'A Marina não para de falar de você. {insignias_ext} insígnias! No meu tempo, quem tinha quatro já era chamado de doutor.'],
        ['nestor', 'Lembra da Mantine que eu falei? A Maré. Ela voltou pro lago faz uns dias. Fica rodando em volta do píer, olhando pra água funda.'],
        ['nestor', 'Eu já não mergulho, menino. Os ouvidos não deixam. Mas ela precisa de alguém que desça com ela.'],
        ['narrador', 'Uma Mantine sobe à superfície perto da janela, bate as asas na água e espirra o Seu Nestor inteiro.'],
        ['nestor', 'Viu? Ela gostou de você. Leva a Maré. Onde a água gira escura, ela desce até o fundo.'],
        ['narrador', 'Agora a Mantine pode levar {jogador} para MERGULHAR nos redemoinhos escuros!'],
      ],
      depois: { montaria: 'mantine', flags: { 'mounts.mergulhar': true } },
    },
    {
      id: 'galpao_entrada',
      local: 'galpao_barcos',
      gatilho: { tipo: 'entrar', alvo: 'galpao_barcos', semFlag: ['galpaoDentro'] },
      falas: [
        ['narrador', 'Um galpão enorme sobre a água. Três tanques ligados por comportas, barcos-plataforma boiando em níveis diferentes e três alavancas: vermelha, azul e verde.'],
        ['aprendiz', 'Bem-vindo! Regra do galpão: a correnteza leva quem não pensa. Fecha a azul pra acalmar a água, abre a verde pra trazer o barco da Marina.'],
        ['aprendiz', 'A vermelha? Ninguém sabe o que a vermelha faz. Brincadeira. Ela enche o tanque do meio. Mas é mais divertido não saber.'],
      ],
      depois: { flags: { galpaoDentro: true } },
    },
    {
      id: 'aprendiz_marina1',
      local: 'galpao_barcos',
      gatilho: { tipo: 'avistar', alvo: 'g3_zeca' },
      falas: [['aprendiz', 'Peixe que nada contra a corrente fica forte! Peixe que nada a favor chega antes. Eu sou dos dois!']],
      depois: { batalha: { id: 'g3_zeca', nome: 'Pescador Zeca', dinheiro: 700, equipe: [[129, 10, ['splash', 'tackle', 'flail']], [339, 11, ['mudSlap', 'waterGun', 'amnesia']]] } },
    },
    {
      id: 'aprendiz_marina2',
      local: 'galpao_barcos',
      gatilho: { tipo: 'avistar', alvo: 'g3_taina' },
      falas: [['aprendiz', 'Quer chegar na Marina? Primeiro aprende a ficar molhado!']],
      depois: { batalha: { id: 'g3_taina', nome: 'Nadadora Tainá', dinheiro: 740, equipe: [[278, 11, ['waterGun', 'wingAttack', 'supersonic']], [183, 12, ['bubble', 'rollout', 'defenseCurl']]] } },
    },
    {
      id: 'marina_desafio',
      local: 'galpao_barcos',
      gatilho: { tipo: 'falar', alvo: 'marina', requer: ['trainers.g3_zeca', 'trainers.g3_taina'], semFlag: ['badges.espelho'] },
      falas: [
        ['marina', 'Olha só! Chegou seco até aqui? Isso nem eu consigo!'],
        ['marina', 'Eu sou a Marina. Pescadora, velejadora, e quem segura o leme deste ginásio. Meu avô diz que eu grito com o vento. Mentira. Eu converso alto.'],
        ['marina', 'Vamos ver se você boia! Valendo a Insígnia Gota!'],
      ],
      depois: {
        batalha: {
          id: 'leader_marina', nome: 'Líder Marina', dinheiro: 2200, perder: 'centro',
          interrompe: 'assalto', // depois do segundo Pokémon dela, a cena "assalto" interrompe a luta
          equipe: [
            [54, 12, ['waterGun', 'confusion', 'scratch']],
            [418, 13, ['aquaJet', 'quickAttack', 'waterGun']],
            [79, 13, ['waterGun', 'confusion', 'yawn']],
            [550, 15, ['aquaJet', 'bite', 'waterPulse', 'headbutt']],
          ],
        },
      },
    },
    {
      id: 'assalto',
      local: 'galpao_barcos',
      gatilho: { tipo: 'interromper', alvo: 'leader_marina' },
      falas: [
        ['narrador', 'BUM! A porta do galpão abre de uma vez. A luz de fora entra junto com uma dúzia de capas roxas.'],
        ['ebano', 'Ninguém se mexe. Ninguém se machuca. Eu não grito. Eu falo com ênfase.'],
        ['marina', 'Quem você pensa que é pra entrar no MEU ginásio no meio da MINHA batalha?!'],
        ['narrador', 'Por entre os recrutas, entra uma mulher de casaco violeta. Cabelo preto com uma mecha branca. Um broche de estrela no peito. Passos sem pressa.', { semFlag: ['falouVespera1'] }],
        ['narrador', 'Por entre os recrutas, entra a mulher de casaco violeta do cemitério de Lamparina. A mesma mecha branca, o mesmo broche de estrela.', { requer: ['falouVespera1'] }],
        ['vespera', 'Desculpe a interrupção, Marina. Sei o que essa batalha significa. Também já fui jovem e já tive um ginásio para vencer.'],
        ['vespera', 'Mas a sua pedra não pode ficar aqui. Não com o que vem por aí.'],
        ['marina', 'O fragmento da Gota está com a minha família há duzentos anos!'],
        ['vespera', 'E está seguro há duzentos anos. Hoje não está mais. Eu sinto muito, de verdade.'],
        ['narrador', 'Véspera abre o cofre embaixo do leme da Marina sem tocar nele. Um Zorua sai de dentro com o fragmento na boca.'],
        ['vespera', 'E você deve ser o {jogador}. O Jatobá falou de você? Não, imagino que não. Ele não fala de muita coisa.', { semFlag: ['falouVespera1'] }],
        ['vespera', 'De novo você, {jogador}. Eu disse que hoje não ia lutar. Hoje é outro dia.', { requer: ['falouVespera1'] }],
        ['vespera', 'Você está do lado certo pelas razões erradas, menino. Um dia vai entender. Ébano, segure-o.'],
      ],
      depois: {
        batalha: { id: 'c3_ebano', nome: 'Admin Ébano', dinheiro: 1500, perder: 'continua', equipe: [[41, 12, ['bite', 'supersonic', 'wingAttack']], [228, 13, ['ember', 'bite', 'roar']], [302, 14, ['furySwipes', 'astonish', 'detect']]] },
      },
    },
    {
      id: 'ebano_depois',
      local: 'galpao_barcos',
      gatilho: { tipo: 'apos', cena: 'assalto' },
      falas: [
        ['ebano', 'Hm. Forte, o moleque. Vou falar com ênfase sobre você pra chefe.'],
        ['narrador', 'Lá fora, um bote a motor se afasta pelo lago e some na neblina do meio, onde ninguém do porto gosta de ir.'],
        ['marina', 'Eles levaram… duzentos anos… num bote alugado.'],
        ['marina', 'Tá. Respira, Marina. Respira.'],
        ['marina', 'A gente não terminou a nossa batalha. Vem pro píer. Batalha que começa tem que acabar, nem que seja no meio do caos.'],
      ],
      depois: { objetivo: { texto: 'Termine a batalha com a Marina no píer', alvo: 'marina_pier' } },
    },
    {
      id: 'marina_pier',
      local: 'porto_espelho',
      gatilho: { tipo: 'falar', alvo: 'marina', requer: ['trainers.c3_ebano'], semFlag: ['badges.espelho'] },
      falas: [['marina', 'Onde a gente estava? Ah, é. Eu ganhando. Continua!']],
      depois: {
        batalha: {
          id: 'leader_marina_pier', nome: 'Líder Marina', dinheiro: 2200,
          equipe: [
            [418, 13, ['aquaJet', 'quickAttack', 'waterGun']],
            [79, 13, ['waterGun', 'confusion', 'yawn']],
            [550, 15, ['aquaJet', 'bite', 'waterPulse', 'headbutt']],
          ],
        },
      },
    },
    {
      id: 'marina_perdeu_jogador',
      local: 'porto_espelho',
      gatilho: { tipo: 'perder', alvo: 'leader_marina_pier' },
      falas: [['marina', 'A maré vai e volta, treinador. Você volta também!']],
    },
    {
      id: 'marina_vencida',
      local: 'porto_espelho',
      gatilho: { tipo: 'vencer', alvo: 'leader_marina_pier' },
      falas: [
        ['marina', 'Ufa! Que dia! Você me venceu no meio de um assalto. Isso vai pra história do porto.'],
        ['marina', 'Toma: a Insígnia Gota. Fragmento é pedra. Insígnia é gente. Essa é sua, e ninguém rouba.'],
        ['narrador', '{jogador} recebeu a Insígnia Gota!'],
        ['marina', 'E a MT Hidro Pulso. Água que bate e confunde. Igual conversa com o meu avô.'],
        ['marina', 'Mais uma coisa. Eles fugiram pela água, e você vai precisar ir aonde a água vai. Esta é a Bruma.'],
        ['narrador', 'Um Lapras encosta no píer e esfrega a cabeça na mão da Marina. Depois, devagar, encosta em você.'],
        ['marina', 'Ela atravessa o lago, o rio e o mar. Cuida dela que ela cuida de você.'],
        ['narrador', 'Agora o Lapras pode levar {jogador} para NADAR em águas profundas!'],
      ],
      depois: { insignia: 'espelho', mt: 'waterPulse', montaria: 'lapras', flags: { 'badges.espelho': true, 'mounts.nadar': true } },
    },
    {
      id: 'radio_noticia',
      local: 'porto_espelho',
      gatilho: { tipo: 'apos', cena: 'marina_vencida' },
      falas: [
        ['radio', 'Interrompemos a programação com uma notícia de Cidade Campina.'],
        ['radio', 'Na madrugada de hoje, o fragmento histórico guardado pelo Líder Tomé foi levado por pessoas de capa roxa. Ninguém se feriu. A Lili diz que um dos Mudbray mordeu um deles.'],
        ['radio', 'Atenção, ouvintes: a Equipe Crepúsculo já levou dois fragmentos. Se você vir alguém de capa roxa…'],
        ['radio', 'O de Cidade Coral, pelo menos, continua com o Jonas. Graças a um treinador teimoso que eu conheço.', { requer: ['defendeuPraia'] }],
        ['radio', '…e eu sei que você está me ouvindo, {jogador}: não se meta em encrenca. Mas se se meter, ganha.'],
      ],
    },
    {
      id: 'ligacao_fim',
      local: 'porto_espelho',
      gatilho: { tipo: 'apos', cena: 'radio_noticia' },
      falas: [
        ['pokedex', 'Bzzz…'],
        ['prof', '{jogador}, você está bem? A Marina me ligou. Você… você viu a Véspera?'],
        ['jogador', 'Ela disse que o senhor não fala de muita coisa.'],
        ['prof', '…'],
        ['prof', 'A Véspera e eu trabalhamos juntos, há muito tempo. Ela era a pessoa mais inteligente que eu já conheci. Depois as coisas mudaram.'],
        ['prof', 'Escute: com o Lapras você vai aonde a água vai. O Rio Lúmen desce até a costa, e o Brejo das Lamparinas tem canais fundos que levam a Lamparina.'],
        ['prof', 'Vá aonde quiser. Só fique longe dela, por favor.'],
      ],
      depois: { fimJornada: true },
    },
  ],
};
