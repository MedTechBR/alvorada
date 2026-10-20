// Segmento 02 · Vila Sussurro (Líder Lia, Inseto, ás 19). Ordem: docs/jornada-classica.md, seção 2, linha 2.
// Rota 2 → Bosque Sussurrante → Toca do Absol (Ariados Alfa; Sina guia o jogador) → Vila Sussurro → estufa
// (evento da Crepúsculo, com a Dra. Véspera ao longe) → rival 2 (Téo) → aprendizes Nando e Bel → Líder Lia.
// Libera a Rota 3 (ponte reconstruída). Primeiro contato com a luzita: a Lia diz que o bosque está secando
// perto dos veios (a pista da reviravolta 3, que só se explica no Sertão).
// Missão secundária: o Pipoca, Skwovet do Tito (começo, meio e fim). Usa o campo `secundaria` (texto para o diário),
// não o painel principal.
// Treinadores de rota (Márcia, Otávio), aprendizes (Nando, Bel) e a Lia são os mesmos ids do cap02.js.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova02',
  jornada: 'sussurro',
  titulo: 'Sussurros no bosque',
  sol: '6h19',
  cenas: [
    {
      id: 'j02_chegada',
      local: 'vila_sussurro',
      gatilho: { tipo: 'entrar', alvo: 'vila_sussurro', requer: ['badges.campina'], semFlag: ['nh.chegouSussurro'] },
      falas: [
        ['narrador', 'Vila Sussurro: casas entre as raízes dos jequitibás, passarelas de corda e lanternas de vaga-lume nos galhos.'],
        ['narrador', 'Você veio para a Insígnia Casulo. A Lia é a líder, mas o motivo de você estar aqui está escrito no mapa: a pedra da Lia fica na estufa.'],
        ['lia', 'Cuidado com a passarela! Tem um Wurmple atravessando. Ele está nisso desde ontem.'],
        ['lia', 'Eu sou a Lia, pesquisadora, bióloga e babá de lagarta. Também sou a líder do ginásio. Ouvi falar de você: o Tomé me mandou um bilhete.'],
        ['lia', 'Tem gente de capa roxa rondando minha estufa. Eles perguntaram da "pedra da Lia". Pedra! Como se eu fosse uma pedreira!'],
        ['jogador', 'Então eu vou ver a estufa. Mas antes me diz: você sabe quem são esses sujeitos de capa roxa?'],
      ],
      depois: {
        flags: { 'nh.chegouSussurro': true },
        objetivo: { texto: 'Entre no Bosque Sussurrante, a oeste, e descubra quem está rondando a estufa', alvo: 'bosque_sussurrante' },
      },
    },
    {
      id: 'j02_recrutas',
      local: 'bosque_sussurrante',
      gatilho: { tipo: 'pisar', alvo: 'trilha_jequitiba', requer: ['nh.chegouSussurro'], semFlag: ['nh.ouviuRecrutas'] },
      falas: [
        ['narrador', 'Atrás de um jequitibá, duas pessoas de capa roxa cochicham. A capa de um deles tem uma lua minguante bordada.'],
        ['recruta', 'A pedra da Lia fica na estufa. Hoje à noite, quando a vila dormir.'],
        ['recruta2', 'E se o tal Absol aparecer de novo? Ele me olhou ontem. Me olhou com julgamento.'],
        ['recruta', 'Absol não morde. Só avisa. E a gente já sabe o aviso. Vamos.'],
        ['narrador', 'Eles somem entre as árvores. Você corre de volta para a vila.'],
      ],
      depois: {
        flags: { 'nh.ouviuRecrutas': true },
        objetivo: { texto: 'Avise a Lia na Vila Sussurro: a estufa será roubada hoje à noite', alvo: 'vila_sussurro' },
      },
      atores: [
        { id: 'recruta_trilha', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'trilha_jequitiba', longe: 4 },
        { id: 'recruta2_trilha', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'trilha_jequitiba', longe: 4 },
      ],
    },
    {
      // Sina: o Absol branco aparece antes do perigo e guia o jogador até a gruta
      id: 'j02_sina_trilha',
      local: 'bosque_sussurrante',
      gatilho: { tipo: 'pisar', alvo: 'bifurcacao', requer: ['nh.ouviuRecrutas'], semFlag: ['nh.seguiuAbsol'] },
      falas: [
        ['narrador', 'O vento para. As folhas param de sussurrar. Na trilha da esquerda, um Absol branco espera, olhando para você.'],
        ['absol', '…'],
        ['narrador', 'Ele dá alguns passos para dentro do mato e olha para trás. Ele quer que você o siga.'],
        ['jogador', 'Ele não é selvagem. Parece que sabe exatamente onde está o perigo.'],
      ],
      depois: {
        flags: { 'nh.seguiuAbsol': true },
        objetivo: { texto: 'Siga o Absol até a gruta de musgo (Toca do Absol), ao norte', alvo: 'toca_absol' },
      },
      atores: [
        { id: 'absol_bosque', quem: 'absol', pokemon: 359, nome: 'Absol', spot: 'absol_bosque', cena: ['j02_sina_trilha'] },
      ],
    },
    {
      id: 'j02_toca_entrada',
      local: 'toca_absol',
      gatilho: { tipo: 'entrar', alvo: 'toca_absol', requer: ['nh.seguiuAbsol'], semFlag: ['nh.tocaEntrou'] },
      falas: [
        ['narrador', 'Uma gruta coberta de musgo. Nas paredes, veios de cristal brilham com a mesma luz morna do chaveiro da Aurora.'],
        ['narrador', 'Só que aqui a luz pulsa. Devagar. Como se respirasse.'],
        ['narrador', 'Lá do fundo vem um barulho de teia rasgando.'],
        ['jogador', 'Esse barulho não é normal. Eu vou até o fundo.'],
        ['absol', 'Absol.'],
      ],
      depois: {
        flags: { 'nh.tocaEntrou': true },
        objetivo: { texto: 'Vá até o fundo da Toca do Absol', alvo: 'toca_absol' },
      },
    },
    {
      id: 'j02_ariados_alfa',
      local: 'toca_absol',
      gatilho: { tipo: 'pisar', alvo: 'toca_absol', requer: ['nh.tocaEntrou'], semFlag: ['nh.ariadosVencido'] },
      falas: [
        ['narrador', 'No fundo, um Ariados enorme se debate entre as teias. Os olhos estão vermelhos. Ele não parece bravo, parece assustado.'],
        ['absol', 'Absol.'],
        ['narrador', 'O cristal atrás dele pulsa mais forte a cada vez que ele se mexe. O Absol se põe entre você e o Ariados.'],
      ],
      depois: {
        batalha: { id: 'alfa_ariados', nome: 'Ariados Alfa', alfa: true, perder: 'repete', equipe: [[168, 20, ['poisonSting', 'nightShade', 'stringShot', 'bugBite']]] },
        flags: { 'nh.ariadosVencido': true },
      },
    },
    {
      id: 'j02_ariados_depois',
      local: 'toca_absol',
      gatilho: { tipo: 'vencer', alvo: 'alfa_ariados' },
      falas: [
        ['narrador', 'O Ariados se encolhe. O vermelho dos olhos vai sumindo até virar um amarelo cansado. Ele foge pela fresta do teto.'],
        ['narrador', 'O Absol encosta o chifre num veio de cristal. A luz treme. Depois ele olha para você por um bom tempo, e some no mato.'],
        ['jogador', 'As árvores daqui estão mesmo morrendo perto dessa luz? Eu preciso contar isso para a Lia.'],
        ['pokedex', 'Bzzz… Registro novo: veio de cristal luminoso. A luz não é igual à de nenhuma pedra conhecida.'],
      ],
      depois: {
        flags: { 'nh.viuCristal': true },
        objetivo: { texto: 'Leve o que viu da gruta de volta à Lia, na Vila Sussurro', alvo: 'vila_sussurro' },
      },
    },
    {
      // a noite da estufa: os recrutas tentam roubar a pedra e a Véspera observa de longe
      id: 'j02_estufa_noite',
      local: 'estufa_lia',
      gatilho: { tipo: 'entrar', alvo: 'estufa_lia', hora: 'noite', requer: ['nh.ouviuRecrutas'], semFlag: ['nh.defendeuEstufa'] },
      falas: [
        ['narrador', 'A estufa está escura. Dois vultos de capa roxa abrem o cofre de vidro onde a Lia guarda o fragmento.'],
        ['recruta', 'Pronto, peguei. Que pedra mais sem graça, parece pedaço de telha.'],
        ['recruta2', 'Ih. Tem um moleque olhando pra gente.'],
        ['recruta', 'Moleque, a Equipe Crepúsculo não tem nada contra você. A gente só quer guardar a noite. Sai da frente.'],
        ['jogador', 'Guardar a noite? Isso aí é da Lia.'],
        ['recruta', 'Então vem pegar!'],
      ],
      depois: {
        batalha: {
          id: 'c2_recruta', nome: 'Recruta Crepúsculo', dinheiro: 500, perder: 'repete',
          equipe: [[41, 17, ['leechLife', 'supersonic', 'astonish']], [198, 17, ['peck', 'astonish', 'pursuit']]],
        },
      },
      atores: [
        { id: 'recruta_estufa_n', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_estufa_lia', longe: 3 },
        { id: 'recruta2_estufa_n', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'dentro_estufa_lia', longe: 3 },
      ],
    },
    {
      id: 'j02_estufa_fim',
      local: 'estufa_lia',
      gatilho: { tipo: 'vencer', alvo: 'c2_recruta' },
      falas: [
        ['recruta2', 'Deixa comigo! Houndour, morde a canela dele! Com carinho, que ele é criança!'],
        ['recruta', 'Agora você me deixou sem graça. Vou dar o troco na Lia!'],
        ['jogador', 'Então vem. Aqui a gente não precisa de capa roxa para proteger o que é da Lia.'],
      ],
      depois: {
        batalha: {
          id: 'c2_recruta2', nome: 'Recruta Crepúsculo', dinheiro: 500, perder: 'repete',
          equipe: [[228, 17, ['ember', 'leer', 'bite']], [92, 18, ['lick', 'hypnosis']]],
        },
      },
    },
    {
      id: 'j02_estufa_vespera',
      local: 'estufa_lia',
      gatilho: { tipo: 'vencer', alvo: 'c2_recruta2' },
      falas: [
        ['recruta', 'Tá bom! Fica com a telha! Mas escuta: a gente não é o problema. O problema está brilhando no seu bolso.'],
        ['narrador', 'Os recrutas fogem pela janela. Na copa de uma árvore lá fora, uma mulher de casaco longo observa a cena. Um Absol está ao lado dela.'],
        ['vespera', 'Bom trabalho, menino. A Lia tem sorte de ter alguém que se importa com a pedra. Espero que a sorte dure.'],
        ['vespera', 'Mas a luz do bosque não espera ninguém. Pergunte à Lia o que ela viu nas raízes.'],
        ['narrador', 'Ela some entre os galhos. Só a voz fica.'],
      ],
      depois: {
        flags: { 'nh.defendeuEstufa': true, 'nh.viuVespera': true },
        objetivo: { texto: 'Vença os aprendizes Nando e Bel e desafie a Líder Lia na Estufa-Teia', alvo: 'lia', treinadores: ['g2_nando', 'g2_bel'], rotulo: 'Aprendizes' },
      },
      atores: [
        { id: 'vespera_estufa', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'dentro_estufa_lia', longe: 4 },
      ],
    },
    {
      id: 'j02_nando',
      local: 'estufa_lia',
      gatilho: { tipo: 'avistar', alvo: 'g2_nando' },
      falas: [['aprendiz', 'Pisou no fio prateado? Não? Então ainda dá pra me enfrentar! Fio dourado é seguro, fio prateado é encrenca.']],
      depois: { batalha: { id: 'g2_nando', nome: 'Caçador Nando', dinheiro: 520, equipe: [[664, 16, ['tackle', 'stringShot', 'struggleBug']], [401, 17, ['growl', 'bide', 'furyCutter']]] } },
    },
    {
      id: 'j02_bel',
      local: 'estufa_lia',
      gatilho: { tipo: 'avistar', alvo: 'g2_bel' },
      falas: [['aprendiz', 'Os casulos apontam para a próxima folha. Eu não devia ter falado isso. Agora vou ter que te vencer pra compensar!']],
      depois: { batalha: { id: 'g2_bel', nome: 'Caçadora Bel', dinheiro: 560, equipe: [[595, 17, ['stringShot', 'absorb', 'thunderShock']], [415, 18, ['gust', 'bugBite', 'sweetScent']]] } },
    },
    {
      // rival 2: o Téo chega à vila depois da estufa e a luta é a dele, não só a da Lia
      id: 'j02_rival2',
      local: 'vila_sussurro',
      gatilho: { tipo: 'entrar', alvo: 'vila_sussurro', requer: ['nh.defendeuEstufa'], semFlag: ['nh.rival2'] },
      falas: [
        ['teo', 'Ei! Você está na minha frente de novo. Eu passei a semana toda ouvindo que você tem sorte.'],
        ['jogador', 'Sorte não ganha ginásio, Téo.'],
        ['teo', 'Então vamos ver o que ganha. Meu {rival_inicial} está pronto desde o laboratório!'],
      ],
      depois: {
        batalha: {
          id: 'nh_rival2', nome: 'Rival Téo', dinheiro: 1800, perder: 'continua',
          equipe: [[397, 14, ['wingAttack', 'quickAttack', 'doubleTeam']], [58, 14, ['ember', 'bite', 'roar']], [133, 15, ['quickAttack', 'bite', 'sandAttack']], ['rival:2', 17, []]],
        },
        flags: { 'nh.rival2': true },
      },
      atores: [
        { id: 'teo_sussurro', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'vila_sussurro', longe: 3 },
      ],
    },
    {
      id: 'j02_lia_ginasio',
      local: 'estufa_lia',
      gatilho: { tipo: 'falar', alvo: 'lia', requer: ['nh.defendeuEstufa', 'trainers.g2_nando', 'trainers.g2_bel'], semFlag: ['badges.sussurro'] },
      falas: [
        ['lia', 'Chegou ao centro da teia! Pouca gente chega sem ser puxada de volta pelo Spinarak. Ele está meio decepcionado.'],
        ['lia', 'Inseto é pequeno, é quieto, é fácil de ignorar. E é por isso que ganha. Vamos lá!'],
        ['jogador', 'Eu estou pronto, Lia. Mas antes me diz: a sua estufa sempre foi assim, tão escura?'],
        ['lia', 'Não. Antes de a Aurora pedir o cristal, a estufa tinha sol de manhã. Agora tem só essa penumbra.'],
      ],
      depois: {
        batalha: {
          id: 'leader_lia', nome: 'Líder Lia', dinheiro: 1800,
          equipe: [
            [415, 17, ['bugBite', 'gust', 'sweetScent']],
            [167, 18, ['stringShot', 'poisonSting', 'absorb', 'nightShade']],
            [48, 18, ['confusion', 'poisonPowder', 'supersonic']],
            [123, 19, ['quickAttack', 'furyCutter', 'leer', 'wingAttack']],
          ],
        },
      },
      atores: [
        { id: 'lia_estufa', quem: 'lia', nome: 'Líder Lia', look: LOOKS.lia, spot: 'dentro_estufa_lia', permanente: true, padrao: ['Os casulos da estufa dormem de dia. De noite eles conversam. Bem baixinho.'] },
      ],
    },
    {
      id: 'j02_lia_insignia',
      local: 'estufa_lia',
      gatilho: { tipo: 'vencer', alvo: 'leader_lia' },
      falas: [
        ['lia', 'Você foi rápido como um Yanma! A Insígnia Casulo é sua. Ela lembra que toda mudança começa quietinha, por dentro.'],
        ['narrador', '{jogador} recebeu a Insígnia Casulo!'],
        ['lia', 'E esta MT: Picada. Pega o Pokémon desprevenido e ainda come a fruta dele. Grosseiro, mas eficiente.'],
        ['lia', 'Você viu a gruta. Eu sabia que o bosque estava doente perto daqueles veios. As árvores com raiz em cima deles estão secando.'],
        ['lia', 'A Aurora diz que a luzita é limpa. Mas o bosque não concorda, e eu confio mais no bosque. Vai até a Rota 3, perto de Porto Espelho. Lá a gente conversa de novo.'],
      ],
      depois: {
        insignia: 'sussurro', mt: 'bugBite',
        flags: { 'nh.luzitaSussurro': true },
        objetivo: { texto: 'Siga pela Rota 3 (ponte reconstruída) até Porto Espelho, a leste', alvo: 'porto_espelho' },
      },
      atores: [
        { id: 'lia_estufa', quem: 'lia', nome: 'Líder Lia', look: LOOKS.lia, spot: 'dentro_estufa_lia', permanente: true },
      ],
    },
    {
      // a Bia analisa o cristal pela Pokédex do professor e confirma: a luz vaza de outro lugar
      id: 'j02_bia_luz',
      gatilho: { tipo: 'apos', cena: 'j02_lia_insignia' },
      falas: [
        ['bia', '{jogador}! É a Bia! Analisei o registro do cristal da gruta. A luz dele não brilha, ela vaza. Como se viesse de outro lugar.'],
        ['bia', 'Nenhuma pedra que eu conheço faz isso. O Professor ficou branco quando eu contei. Disse "deve ser nada" e foi tomar banho.'],
        ['bia', 'Ele nunca toma banho por tanto tempo. Fica de olho nele e me avisa se alguém perguntar da luzita.'],
        ['jogador', 'Então ela não é só luz. É algo que vem de fora da terra.'],
        ['bia', 'Isso mesmo. Eu vou tentar descobrir de onde.'],
      ],
      depois: { ambiente: true },
    },
    {
      id: 'j02_boletim2',
      gatilho: { tipo: 'flag', alvo: 'badges.sussurro', semFlag: ['nh.boletim.2'] },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e dezenove minutos. O atraso já passa de quinze minutos desde o começo da semana.'],
        ['mae', 'Ravi, seis e dezenove. Você está ganhando insígnias, e o sol está ficando mais preguiçoso. Isso não é normal.'],
        ['jogador', 'Então o sol atrasa desde a primeira vitória. Foi isso que eu vi no Sussurro.'],
      ],
      depois: { flags: { 'nh.boletim.2': true, 'nh.sol': '6h19' }, ambiente: true },
    },
    {
      // side quest: o Pipoca, Skwovet do Tito. Começo: o Tito fala. Meio: achar o Pipoca no bosque. Fim: devolver.
      id: 'j02_sq_pipoca_inicio',
      local: 'vila_sussurro',
      gatilho: { tipo: 'falar', alvo: 'tito', semFlag: ['nh.sqPipoca'] },
      falas: [
        ['tito', 'O Pipoca sumiu! Ele é um Skwovet e foi buscar noz no bosque e não voltou. Ele sempre volta. Sempre.'],
        ['tito', 'Se você achar ele, fala que eu não tô bravo. Só um pouquinho.'],
        ['jogador', 'Acho que vi um Skwovet correndo para a mata. Pode ser ele?'],
        ['tito', 'Pode, sim! Ele adora a mata de jequitibá. Se achar, traga de volta com cuidado.'],
      ],
      secundaria: { texto: 'Procure o Pipoca, o Skwovet do Tito, na Mata dos Jequitibás, no bosque', alvo: 'mata_jequitibas' },
      depois: { flags: { 'nh.sqPipoca': true }, ambiente: true },
      atores: [
        { id: 'tito_vila', quem: 'tito', nome: 'Tito', look: LOOKS.jandira, spot: 'vila_sussurro', permanente: true, padrao: ['O Pipoca ainda não voltou. Ele sempre volta. Sempre.'] },
      ],
    },
    {
      id: 'j02_sq_pipoca_achado',
      local: 'bosque_sussurrante',
      gatilho: { tipo: 'pisar', alvo: 'mata_jequitibas', requer: ['nh.sqPipoca'], semFlag: ['nh.achouPipoca'] },
      falas: [
        ['narrador', 'Entre as raízes de um jequitibá, um Skwovet roliço segura uma noz quase do tamanho dele. Ele vira a cabeça e reconhece a cara de quem o procura.'],
        ['narrador', 'Ele tem uma coleira de barbante com um pequeno sino. Está faltando um pedaço. Parece que alguém tentou puxar o pelo dele, lá na estufa.'],
        ['jogador', 'Vem comigo, Pipoca. O Tito está preocupado.'],
        ['narrador', 'O Skwovet ouve o seu nome e para de roer a noz. Ele dá dois passos na sua direção, desconfiado.'],
      ],
      secundaria: { texto: 'Leve o Pipoca de volta ao Tito, na Vila Sussurro', alvo: 'vila_sussurro' },
      depois: { flags: { 'nh.achouPipoca': true }, ambiente: true },
    },
    {
      id: 'j02_sq_pipoca_fim',
      local: 'vila_sussurro',
      gatilho: { tipo: 'falar', alvo: 'tito', requer: ['nh.achouPipoca'], semFlag: ['nh.sqPipocaFim'] },
      falas: [
        ['tito', 'Pipoca! Seu maluco! Eu não estava bravo. Eu estava só um pouquinho bravo, mas agora passou.'],
        ['tito', 'Tome, leve esta noz de ouro. Ela é a melhor noz da vila. Guardo desde que nasci. Não conta pra minha mãe.'],
        ['narrador', 'O Pipoca sobe no ombro do Tito e começa a roer a orelha dele. Os dois estão felizes.'],
        ['jogador', 'Ele fez um bom trabalho. Mas agora eu quero saber se o Tito sabe mesmo guardar segredo.'],
      ],
      depois: {
        itens: [['rareCandy', 1]],
        flags: { 'nh.sqPipocaFim': true },
        ambiente: true,
      },
    },
  ],
};
