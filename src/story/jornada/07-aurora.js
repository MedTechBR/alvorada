// Segmento 07 · Cidade Aurora, Mina Aurora, Rota 7 e Forte Rochedo (Líder Brás, Lutador, ás 37).
// Ordem: docs/jornada-classica.md, seção 2, linha 7. Aqui estão as reviravoltas 1 e 2 (seção 1).
// Cidade Aurora (Torre, visita de Lúcio, a sirene) → Mina Aurora: o desabamento do nível 3 prende o jogador, a
// Dra. Véspera e o Heitor (pai do Téo) no nível 4 → REVIRAVOLTA 1: a Aurora é quem atrasa o sol; o Téo muda de lado.
// → Rota 7 (Jairo e Soraia) → Forte Rochedo, arquivo do professor → REVIRAVOLTA 2: o Prof. Jatobá ajudou a criar a
// Aurora (ele confessa por telefone) → Roda de Capoeira (Brás).
// A Mina de Cidade Aurora libera o caminho para o Forte; a ESCALADA (Sneasler) é liberada aqui, pela insígnia Punho.
// Níveis: Lúcio 33–34; Jairo/Soraia 30–31 (cap07.js); Dandara/Tião 29–30; Brás 33–37.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova07',
  jornada: 'aurora',
  titulo: 'O preço da luz',
  sol: '6h47',
  cenas: [
    {
      id: 'j07_chegada',
      local: 'cidade_aurora',
      gatilho: { tipo: 'entrar', alvo: 'cidade_aurora', requer: ['badges.lamparina'], semFlag: ['nh.chegouAurora'] },
      falas: [
        ['narrador', 'Cidade Aurora: torres de cristal e outdoors com a palavra "limpa" em letras douradas.'],
        ['narrador', 'O sol mal aparece entre os prédios. Todo mundo aqui tem uma lanterna de luzita no bolso, acesa de dia.'],
        ['pipa', 'Você chegou! Eu sou a Pipa, do Jornal Farol. Preciso de alguém de fora da empresa para uma matéria sobre a Torre.'],
        ['pipa', 'O gerente Lúcio faz visitas guiadas na Torre. Ele mostra as tubulações, mas nunca diz de onde vem a luz.'],
        ['jogador', 'Uma repórter e uma visita guiada. Vou reparar no que ele não mostra.'],
      ],
      depois: {
        flags: { 'nh.chegouAurora': true },
        objetivo: { texto: 'Vá à Torre Aurora, no centro da cidade, e acompanhe a visita guiada', alvo: 'torre_aurora' },
      },
      atores: [
        { id: 'pipa_aurora', quem: 'pipa', nome: 'Pipa', look: LOOKS.pipa, spot: 'pipa_aurora', cena: ['j07_chegada', 'j07_torre_visita'] },
      ],
    },
    {
      id: 'j07_torre_visita',
      local: 'torre_aurora',
      gatilho: { tipo: 'entrar', alvo: 'torre_aurora', requer: ['nh.chegouAurora'], semFlag: ['nh.visitaTorre'] },
      falas: [
        ['lucio', 'Bem-vindos à Torre Aurora! Aqui nasce a luz que acende as lâmpadas de Alvorada. É luz limpa, que não depende do céu.'],
        ['lucio', 'O cristal vem da nossa mina, no nível quatro. A luzita não queima, não fumaça e não depende do sol.'],
        ['pipa', 'E de onde vem o cristal, exatamente? O que a Aurora tira de baixo da terra?'],
        ['lucio', 'Isso é segredo da empresa, senhorita. O que importa é que o sol atrasa e nós mantemos a cidade acesa.'],
        ['narrador', 'Quando o Lúcio fala do sol, uma parte das luzes da torre pisca. Ninguém parece notar, exceto você.'],
        ['lucio', 'Agora, se me dão licença, o elevador de serviço é só para a equipe. Os visitantes ficam aqui.'],
      ],
      depois: {
        flags: { 'nh.visitaTorre': true },
        objetivo: { texto: 'Passe pelo Gerente Lúcio, que bloqueia o elevador de serviço, e desça à Mina Aurora', alvo: 'mina_aurora_n1' },
      },
      atores: [
        { id: 'lucio_torre_n', quem: 'lucio', nome: 'Gerente Lúcio', look: LOOKS.lucio, spot: 'dentro_torre_aurora', longe: 3 },
        { id: 'pipa_aurora', quem: 'pipa', nome: 'Pipa', look: LOOKS.pipa, spot: 'pipa_aurora', cena: ['j07_chegada', 'j07_torre_visita'] },
      ],
    },
    {
      id: 'j07_lucio_bloqueia',
      local: 'torre_aurora',
      gatilho: { tipo: 'entrar', alvo: 'torre_aurora', requer: ['nh.visitaTorre'], semFlag: ['nh.lucioVencido'] },
      falas: [
        ['lucio', 'Área restrita! Ninguém desce ao nível quatro sem autorização. O protocolo, o protocolo!'],
        ['jogador', 'Você não quer que ninguém veja o que tem lá embaixo. Por quê?'],
        ['lucio', 'É segredo da empresa. Se quer descer, vai ter que passar pelos meus Pokémon.'],
      ],
      depois: {
        batalha: {
          id: 'c7_lucio', nome: 'Gerente Lúcio', dinheiro: 3400, perder: 'repete',
          equipe: [
            [462, 33, ['flashCannon', 'thunderbolt', 'magnetBomb']],
            [601, 34, ['gearGrind', 'thunderbolt', 'shiftGear']],
            [970, 34, ['powerGem', 'sludgeBomb', 'stealthRock']],
          ],
        },
        flags: { 'nh.lucioVencido': true },
      },
      atores: [
        { id: 'lucio_torre_n', quem: 'lucio', nome: 'Gerente Lúcio', look: LOOKS.lucio, spot: 'dentro_torre_aurora', longe: 3 },
      ],
    },
    {
      // a sirene: o nível 3 da mina desaba. O Téo chega correndo, e a Pipa fica na superfície com a câmera.
      id: 'j07_sirene',
      local: 'mina_aurora',
      gatilho: { tipo: 'vencer', alvo: 'c7_lucio' },
      falas: [
        ['narrador', 'A sirene começa a tocar lá embaixo, e o chão da torre vibra. Um homem de capacete grita pelo rádio que o nível três desabou.'],
        ['teo', 'Meu pai está lá embaixo! Ele trabalha no nível quatro! Eu vou descer agora, com ou sem você!'],
        ['jogador', 'Eu vou com você, Téo. Vamos tirar o seu pai de lá.'],
        ['teo', 'Obrigado. Rápido!'],
      ],
      depois: {
        flags: { 'nh.sirene': true, 'nh.teoJunto': true },
        objetivo: { texto: 'Desça à Mina Aurora e encontre o Heitor, pai do Téo, no nível quatro', alvo: 'mina_aurora_n1' },
      },
      atores: [
        { id: 'teo_mina7', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'dentro_torre_aurora', segue: true, cena: ['j07_sirene', 'j07_mina_entrada', 'j07_mina_medidor', 'j07_saida_mina'] },
      ],
    },
    {
      id: 'j07_mina_entrada',
      local: 'mina_aurora',
      gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n1', requer: ['nh.sirene'], semFlag: ['nh.minaEntrada'] },
      falas: [
        ['narrador', 'O nível um da mina é quente e cheira a ferro. Trilhos de carrinho correm por toda parte, e as lâmpadas de luzita tremem nas paredes.'],
        ['teo', 'Por aqui! O elevador do nível três caiu com o desabamento. A escada do fundo é o único caminho.'],
        ['narrador', 'Um mineiro sai de um corredor lateral, sujo de pó, com a lanterna apagada. Ele aponta para baixo sem dizer nada.'],
      ],
      depois: {
        flags: { 'nh.minaEntrada': true },
        objetivo: { texto: 'Desça pelas escadas até o nível quatro, onde está o Heitor', alvo: 'mina_aurora_n4' },
      },
      atores: [
        { id: 'teo_mina7', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'dentro_torre_aurora', segue: true, cena: ['j07_sirene', 'j07_mina_entrada', 'j07_mina_medidor', 'j07_saida_mina'] },
      ],
    },
    {
      // REVIRAVOLTA 1: o medidor da própria Aurora no nível quatro. A Véspera, presa com eles, conta a versão dela.
      id: 'j07_mina_medidor',
      local: 'mina_aurora_n4',
      gatilho: { tipo: 'entrar', alvo: 'mina_aurora_n4', requer: ['nh.minaEntrada'], semFlag: ['nh.reviravolta1'] },
      reviravolta: 1,
      falas: [
        ['narrador', 'No nível quatro, o desabamento prendeu três mineiros e uma mulher de casaco longo, encostada numa viga, com um Absol aos pés.'],
        ['heitor', 'Téo! Eles disseram que o resgate só chegaria depois da cota do dia. Ainda bem que você veio.'],
        ['teo', 'Pai? Você está ferido? O que a Aurora fez com vocês?'],
        ['vespera', 'Pergunte à sua empresa, Téo. Tem um medidor aqui na parede que mostra quanta luz sai de cada tonelada de cristal.'],
        ['narrador', 'Na parede, uma placa marca a produção da semana. Ao lado, um mostrador mostra a hora do nascer do sol, que atrasa a cada tonelada extraída.'],
        ['jogador', 'O sol nasce mais tarde por causa do que a Aurora tira daqui?'],
        ['vespera', 'A luzita mantém o Relógio de Pedra fechado. Quanto mais a Aurora tira, mais tarde o sol nasce.'],
        ['vespera', 'Eu roubava as pedras para a Aurora não pegá-las. Foi o seu professor que descobriu a luzita.'],
        ['teo', 'Eu defendi a Aurora desde o começo. E ela deixou meu pai preso aqui embaixo, sem nem tocar a sirene a tempo.'],
        ['heitor', 'Eles mandaram cavar mais rápido, Téo. Depois do desabamento, o supervisor disse que a cota não podia parar.'],
        ['teo', 'Chega. Eu não defendo mais a Aurora. Vou ajudar quem está tirando vocês daqui.'],
      ],
      depois: {
        flags: { 'nh.reviravolta1': true, 'nh.teoLadoCerto': true },
        objetivo: { texto: 'Descoberta: a Companhia Aurora é quem atrasa o sol. Vá ao Forte Rochedo, pela Rota 7, e procure as cartas do Prof. Jatobá no arquivo', alvo: 'arquivo_forte' },
      },
      atores: [
        { id: 'vespera_mina', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, longe: 3, permanente: false },
        { id: 'absol_mina', quem: 'absol', pokemon: 359, nome: 'Absol', cena: ['j07_mina_medidor'] },
        { id: 'heitor_mina7', quem: 'heitor', nome: 'Heitor', look: LOOKS.heitor, longe: 3 },
        { id: 'teo_mina7', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'dentro_torre_aurora', segue: true, cena: ['j07_sirene', 'j07_mina_entrada', 'j07_mina_medidor', 'j07_saida_mina'] },
      ],
    },
    {
      id: 'j07_saida_mina',
      local: 'mina_aurora',
      gatilho: { tipo: 'apos', cena: 'j07_mina_medidor' },
      falas: [
        ['narrador', 'Na saída da mina, um homem de terno branco espera de braços cruzados, com um sorriso de quem já sabia o que ia acontecer.'],
        ['solano', 'Téo, seu pai já está subindo com a equipe de resgate. Agora volte para a superfície e esqueça essa conversa.'],
        ['teo', 'Eu não vou esquecer nada, Senhor Solano. Eu vi o medidor. O sol nasce mais tarde por causa da Aurora.'],
        ['solano', 'A luz agora é da Aurora, meu jovem. Quem se meter no nosso caminho vai se arrepender.'],
        ['narrador', 'O Solano dá as costas e sai pela porta da torre. A Pipa, do lado de fora, já está com a câmera apontada para o elevador.'],
      ],
      depois: {
        flags: { 'nh.viuSolanoMina': true },
        ambiente: true,
      },
      atores: [
        { id: 'solano_mina', quem: 'solano', nome: 'Augusto Solano', look: LOOKS.solano, spot: 'aurora_praca', longe: 3 },
        { id: 'teo_mina7', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'dentro_torre_aurora', segue: true, cena: ['j07_sirene', 'j07_mina_entrada', 'j07_mina_medidor', 'j07_saida_mina'] },
      ],
    },
    {
      id: 'j07_rota7_jairo',
      local: 'rota7',
      gatilho: { tipo: 'avistar', alvo: 'r7_jairo' },
      falas: [['treinador', 'Ei, você! Passou pela mina e ainda está de pé? Então merece uma luta de verdade!']],
      depois: { batalha: { id: 'r7_jairo', nome: 'Lutador Jairo', dinheiro: 1300, equipe: [[66, 30, ['karateChop', 'lowKick', 'leer']], [296, 31, ['armThrust', 'fakeOut', 'knockOff']]] } },
    },
    {
      id: 'j07_rota7_soraia',
      local: 'rota7',
      gatilho: { tipo: 'avistar', alvo: 'r7_soraia' },
      falas: [['treinador', 'Você veio da mina e ainda quer passar pela Rota 7? Ginga antes de lutar. Vamos!']],
      depois: { batalha: { id: 'r7_soraia', nome: 'Capoeirista Soraia', dinheiro: 1300, equipe: [[532, 30, ['lowKick', 'rockThrow', 'bulkUp']], [619, 31, ['forcePalm', 'fakeOut', 'uTurn']]] } },
    },
    {
      // REVIRAVOLTA 2 (parte 1): as cartas do arquivo do forte
      id: 'j07_arquivo',
      local: 'arquivo_forte',
      gatilho: { tipo: 'entrar', alvo: 'arquivo_forte', requer: ['nh.reviravolta1'], semFlag: ['nh.arquivo'] },
      falas: [
        ['narrador', 'O Forte Rochedo é uma construção de pedra antiga, com um arquivo no subsolo. Ninguém desce ali há anos, mas a porta está destrancada.'],
        ['narrador', 'Uma pasta de couro está marcada com "Luzita: estudos, 2010". Dentro, cartas escritas à mão por dois autores: o Prof. Jatobá e a Dra. Véspera.'],
        ['narrador', 'As cartas falam de um cristal que vaza luz, e de uma reunião com um homem chamado Augusto Solano, que queria comprar a amostra.'],
        ['jogador', 'Essas cartas são de 16 anos atrás. O professor participou disso desde o começo?'],
        ['narrador', 'O cheiro de papel velho vem das prateleiras. Um telefone antigo começa a tocar num canto da sala.'],
      ],
      depois: {
        flags: { 'nh.arquivo': true },
        objetivo: { texto: 'Atenda o telefone antigo do arquivo: o Prof. Jatobá quer falar com você', alvo: 'lab' },
      },
      atores: [
        { id: 'r7_jairo', quem: 'treinador', nome: 'Lutador Jairo', look: LOOKS.cacador, spot: 'r7_jairo', visao: 6, apos: ['Eu treino socando pedra. As pedras estão ganhando, mas eu não desisto!'] },
        { id: 'r7_soraia', quem: 'treinador', nome: 'Capoeirista Soraia', look: LOOKS.cacadora, spot: 'r7_soraia', visao: 6, apos: ['Ginga! Ginga! Se você não ginga, você apanha. Primeira lição grátis!'] },
        { id: 'g6_dandara', quem: 'aprendiz', nome: 'Faixa-preta Dandara', look: LOOKS.cacadora, spot: 'roda_dandara', visao: 5, apos: ['Você me venceu, e o portão da roda abriu. Agora o Brás está esperando você.'] },
        { id: 'g6_tiao', quem: 'aprendiz', nome: 'Faixa-preta Tião', look: LOOKS.cacador, spot: 'roda_tiao', visao: 5, apos: ['Meu Crabrawler aprendeu a ginga só de olhar. Ele anda de lado, claro, porque é caranguejo.'] },
      ],
    },
    {
      // REVIRAVOLTA 2 (parte 2): o professor confessa por telefone
      id: 'j07_prof_telefone',
      gatilho: { tipo: 'apos', cena: 'j07_arquivo' },
      reviravolta: 2,
      falas: [
        ['prof', '{jogador}? Eu estava esperando você ler as cartas. Eu deveria ter contado antes. Eu queria proteger você.'],
        ['prof', 'Há dezesseis anos, eu e a Véspera descobrimos a luzita. Levei uma amostra ao Solano, e ele a comprou.'],
        ['jogador', 'Então o senhor ajudou a criar a Aurora.'],
        ['prof', 'Ajudei. A Noite Longa de Lamparina foi a primeira extração, com a minha amostra. Eu não sabia o que ela causava.'],
        ['prof', 'Quando eu soube, já era tarde. A Véspera rompeu com a Aurora e passou a roubar as pedras. Eu fiquei calado.'],
        ['jogador', 'Professor, eu não vou fingir que isso não aconteceu. Mas agora eu preciso de você para chegar até o Relógio.'],
      ],
      depois: {
        flags: { 'nh.reviravolta2': true },
        objetivo: { texto: 'Descoberta: o Prof. Jatobá ajudou a criar a Aurora. Na Roda de Capoeira, vença os faixas-pretas e desafie o Líder Brás', alvo: 'leader_bras', treinadores: ['g6_dandara', 'g6_tiao'], rotulo: 'Faixas-pretas' },
      },
    },
    {
      id: 'j07_dandara',
      local: 'ninho_forte_rochedo',
      gatilho: { tipo: 'avistar', alvo: 'g6_dandara' },
      falas: [['aprendiz', 'Na capoeira, luta é conversa. A gente pergunta com o pé e responde com a esquiva.']],
      depois: { batalha: { id: 'g6_dandara', nome: 'Faixa-preta Dandara', dinheiro: 1400, equipe: [[307, 29, ['meditate', 'forcePalm', 'confusion']], [619, 30, ['forcePalm', 'uTurn', 'fakeOut']]] } },
    },
    {
      id: 'j07_tiao',
      local: 'ninho_forte_rochedo',
      gatilho: { tipo: 'avistar', alvo: 'g6_tiao' },
      falas: [['aprendiz', 'Quer chegar no Brás? Primeiro você precisa aprender a dançar com o berimbau.']],
      depois: { batalha: { id: 'g6_tiao', nome: 'Faixa-preta Tião', dinheiro: 1450, equipe: [[532, 30, ['lowKick', 'rockThrow', 'focusEnergy']], [739, 31, ['powerUpPunch', 'bubbleBeam', 'payback']]] } },
    },
    {
      id: 'j07_bras_ginasio',
      local: 'ninho_forte_rochedo',
      gatilho: { tipo: 'falar', alvo: 'bras', requer: ['nh.reviravolta2', 'trainers.g6_dandara', 'trainers.g6_tiao'], semFlag: ['badges.rochedo'] },
      falas: [
        ['bras', 'Ê, camará! Passou pelos dois portões da roda! O berimbau gostou de você.'],
        ['bras', 'Agora a luta é a sério. Quem passa por mim está pronto para o Sertão e para o Paredão.'],
        ['jogador', 'Passei pelos seus dois faixas-pretas. Agora quero a insígnia!'],
        ['bras', 'Então vem, camará! Vamos ver quem ginga melhor.'],
      ],
      depois: {
        batalha: {
          id: 'leader_bras', nome: 'Líder Brás', dinheiro: 3400,
          equipe: [
            [67, 33, ['karateChop', 'lowKick', 'focusEnergy']],
            [701, 34, ['wingAttack', 'karateChop', 'roost']],
            [447, 35, ['forcePalm', 'quickAttack', 'counter']],
            [214, 36, ['brickBreak', 'hornAttack', 'bulletSeed']],
            [237, 37, ['rapidSpin', 'tripleKick', 'quickAttack', 'detect']],
          ],
        },
      },
      atores: [
        { id: 'bras_roda', quem: 'bras', nome: 'Líder Brás', look: LOOKS.tecnico, spot: 'ninho_forte_rochedo', permanente: true, padrao: ['Na capoeira, luta é conversa. Bora conversar!'] },
      ],
    },
    {
      id: 'j07_bras_insignia',
      local: 'ninho_forte_rochedo',
      gatilho: { tipo: 'vencer', alvo: 'leader_bras' },
      falas: [
        ['bras', 'Olha só, que luta! A Insígnia Punho é sua. Com ela, seu Pokémon pode escalar paredões.'],
        ['narrador', '{jogador} recebeu a Insígnia Punho!'],
        ['bras', 'Eu não entendo do sol nem da Aurora. Mas esse problema é grande, então não se arrisque à toa.'],
        ['bras', 'Para ir a Escarpa, você precisa do mapa do Paredão. Ele está na Vila Mandacaru, no Sertão do Levante.'],
      ],
      depois: {
        insignia: 'rochedo', montaria: 'sneasler',
        objetivo: { texto: 'Siga pela Rota 14 até a Vila Mandacaru, no Sertão do Levante, para pegar o mapa do Paredão', alvo: 'ninho_vila_mandacaru' },
      },
      atores: [
        { id: 'bras_roda', quem: 'bras', nome: 'Líder Brás', look: LOOKS.tecnico, spot: 'ninho_forte_rochedo', permanente: true },
      ],
    },
    {
      id: 'j07_boletim6',
      gatilho: { tipo: 'flag', alvo: 'badges.rochedo', semFlag: ['nh.boletim.6'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis e quarenta e sete. A Companhia Aurora nega relação com o atraso.'],
        ['mae', '{jogador}, seis e quarenta e sete. A Aurora nega? Quem nega tanto deve ter algo a esconder.'],
        ['jogador', 'Eu sei por quê, Mãe. Quanto mais luzita a Aurora tira da mina, mais tarde o sol nasce.'],
      ],
      depois: { flags: { 'nh.boletim.6': true, 'nh.sol': '6h47' }, ambiente: true },
    },
  ],
};
