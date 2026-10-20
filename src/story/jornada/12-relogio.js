// Segmento 12 · Relógio de Pedra (clímax). Ordem: docs/jornada-classica.md, seção 2, linha 12.
// Topo do Planalto: o Solano tem as sete pedras (vindas do Sereno) e quer a Vela Eterna para abrir o Coração do Relógio.
// A Dra. Véspera (48) desafia o jogador primeiro, para ver se ele segura a luz; depois vira aliada. O Téo chega com o
// Heitor, resgatado da mina. Batalha com o Solano (46–47). O cadeado abre: o Necrozma (50) é derrotado e foge pela
// fenda (capturável: é uma luta de chefe, sem treinador, como o Necrozma do cap11.js). As oito insígnias do jogador
// fecham o cadeado de novo. O sol volta ao horário normal. Libera a Rota 12, até a Cordilheira Geada.
// Níveis: Véspera 48; Solano 46–47; Necrozma 50 (com Lunala, ajudando o jogador na luta como em cap11.js: aliado).
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova12',
  jornada: 'relogio',
  titulo: 'O Relógio de Pedra',
  sol: '7h11',
  cenas: [
    {
      id: 'j12_chegada',
      local: 'relogio_pedra',
      gatilho: { tipo: 'entrar', alvo: 'relogio_pedra', requer: ['nh.reviravolta5'], semFlag: ['nh.chegouRelogio'] },
      falas: [
        ['narrador', 'O topo do Planalto: um círculo de pedra com sete pedestais vazios, e no centro, o Relógio de Pedra. Um cadeado de cristal dourado prende uma porta de rocha, como se fosse uma caixa de relógio gigante.'],
        ['narrador', 'Em cada pedestal, um padrão de luz gira devagar. Sete estão acesos, com a cor de cada ginásio. O oitavo pedestal está apagado, esperando.'],
        ['solano', 'Ravi, chegou no horário. Eu gosto de gente pontual. A vela, por favor, e o professor volta para casa.'],
        ['narrador', 'O professor está numa gaiola de metal, ao lado do Lúcio, com o rosto pálido e os olhos fixos em você.'],
        ['sereno', 'Ele trouxe a vela, Senhor Solano? Eu trouxe as sete. Já estão nos pedestais.'],
        ['jogador', 'Não entrego a vela sem ver o professor sair. E não acendo nada antes de saber o que o Relógio faz.'],
        ['solano', 'O Relógio fecha o sol quando as oito estão acesas, e abre o cadeado quando alguém sopra a chama. Eu não preciso que você entenda. Só preciso que você obedeça.'],
      ],
      depois: {
        flags: { 'nh.chegouRelogio': true },
        objetivo: { texto: 'Enfrente a Dra. Véspera, que bloqueia a escada do Relógio', alvo: 'relogio_pedra' },
      },
      atores: [
        { id: 'solano_relogio', quem: 'solano', nome: 'Augusto Solano', look: LOOKS.solano, spot: 'relogio_pedra', longe: 4 },
        { id: 'lucio_relogio', quem: 'lucio', nome: 'Gerente Lúcio', look: LOOKS.lucio, spot: 'relogio_pedra', longe: 5 },
        { id: 'sereno_relogio', quem: 'sereno', nome: 'Admin Sereno', look: LOOKS.ebano, spot: 'relogio_pedra', longe: 4 },
        { id: 'prof_relogio', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'relogio_pedra', longe: 5 },
      ],
    },
    {
      // a Véspera desafia primeiro: ela quer ver se o jogador consegue segurar a luz sem apagar
      id: 'j12_vespera_desafio',
      local: 'relogio_pedra',
      gatilho: { tipo: 'apos', cena: 'j12_chegada' },
      falas: [
        ['vespera', 'Antes de você acender qualquer coisa, eu quero saber quem está do outro lado da chama.'],
        ['vespera', 'Eu não sou da Aurora. Mas também não sou sua amiga. Vamos ver se você segura a luz quando ela pesa.'],
        ['jogador', 'Então eu vou segurar a luz com a mão aberta. Não vou fechar o punho.'],
        ['vespera', 'Esse é o primeiro pensamento sensato que eu ouço hoje. Vamos.'],
      ],
      depois: {
        batalha: {
          id: 'c12_vespera', nome: 'Dra. Véspera', dinheiro: 4800, perder: 'repete',
          equipe: [
            [198, 46, ['peck', 'astonish', 'pursuit']],
            [430, 47, ['nightSlash', 'braveBird', 'suckerPunch']],
            [302, 47, ['shadowClaw', 'foulPlay', 'willOWisp']],
            [861, 48, ['spiritBreak', 'darkestLariat', 'thunderWave', 'suckerPunch']],
          ],
        },
      },
      atores: [
        { id: 'vespera_relogio', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'relogio_pedra', longe: 3 },
        { id: 'absol_relogio', quem: 'absol', pokemon: 359, nome: 'Sina', spot: 'relogio_pedra', cena: ['j12_vespera_desafio'] },
      ],
    },
    {
      id: 'j12_vespera_aliada',
      local: 'relogio_pedra',
      gatilho: { tipo: 'vencer', alvo: 'c12_vespera' },
      reviravolta: 6,
      falas: [
        ['vespera', 'Você segurou. Eu não esperava. Agora escuta, porque eu não vou repetir: o Solano planeja abrir o cadeado e capturar o Necrozma.'],
        ['vespera', 'Quando o Necrozma sair, ele vai comer toda a luz do Planalto para a Aurora vender. Eu não vou deixar isso acontecer, nem que eu fique presa aqui com a Sina.'],
        ['vespera', 'Eu estou do seu lado agora. Não por você. Por ela, por mim e pelo sol que eu deixei de ver.'],
        ['narrador', 'Lá embaixo, na escada, o Téo chega correndo. Atrás dele, um homem de capacete sujo de pó segura um lampião: é o Heitor, livre da mina.'],
        ['teo', 'Estamos aqui! Eu e o meu pai! A gente saiu da mina pelo túnel do nível quatro e vim direto.'],
        ['heitor', 'Ravi! Obrigado por ter ido atrás do meu filho. Ele não parava de falar de você, e depois da mina, eu entendi o porquê.'],
      ],
      depois: {
        flags: { 'nh.chegaramAliados': true, 'nh.veraAliada': true },
        objetivo: { texto: 'Descoberta: a Véspera e o Téo se aliam ao jogador, e o Solano quer abrir o cadeado para capturar o Necrozma. Enfrente o Solano no topo do Relógio', alvo: 'relogio_pedra' },
      },
      atores: [
        { id: 'vespera_relogio', quem: 'vespera', nome: 'Dra. Véspera', look: LOOKS.vespera, spot: 'relogio_pedra', longe: 3 },
        { id: 'teo_relogio', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'relogio_pedra', longe: 4 },
        { id: 'heitor_relogio', quem: 'heitor', nome: 'Heitor', look: LOOKS.heitor, spot: 'relogio_pedra', longe: 5 },
      ],
    },
    {
      // Solano luta com a equipe dele. A Véspera e o Téo lutam ao lado do jogador, com aliados.
      id: 'j12_solano_batalha',
      local: 'relogio_pedra',
      gatilho: { tipo: 'apos', cena: 'j12_vespera_aliada' },
      falas: [
        ['solano', 'Vocês acham que uma pedra e um garoto vão deter a luz da Aurora? A luz é a única coisa que nunca deixou ninguém no escuro.'],
        ['solano', 'Lúcio, Sereno, às pedras. Eu vou cuidar do garoto pessoalmente. A Véspera pode continuar sonhando com a noite.'],
        ['vespera', 'Eu sonho com a noite porque é ela que nos protege da sua luz, Solano.'],
        ['narrador', 'O Lúcio e o Sereno se afastam para as bordas do círculo de pedra. O Téo e o Heitor ficam de pé ao seu lado, sem dizer nada.'],
      ],
      depois: {
        batalha: {
          id: 'c12_solano', nome: 'Augusto Solano', dinheiro: 9000, perder: 'repete', dupla: 'teo',
          equipe: [
            [462, 45, ['flashCannon', 'thunderbolt', 'magnetBomb']],
            [601, 45, ['gearGrind', 'thunderbolt', 'shiftGear']],
            [970, 46, ['powerGem', 'sludgeBomb', 'stealthRock']],
            [823, 46, ['airSlash', 'roost', 'braveBird']],
            [461, 47, ['iceShard', 'nightSlash', 'iceFang']],
          ],
        },
      },
      atores: [
        { id: 'solano_relogio', quem: 'solano', nome: 'Augusto Solano', look: LOOKS.solano, spot: 'relogio_pedra', longe: 4 },
        { id: 'lucio_relogio', quem: 'lucio', nome: 'Gerente Lúcio', look: LOOKS.lucio, spot: 'relogio_pedra', longe: 5 },
      ],
    },
    {
      // o Solano cai; o professor sai da gaiola; o cadeado começa a abrir
      id: 'j12_solano_cai',
      local: 'relogio_pedra',
      gatilho: { tipo: 'vencer', alvo: 'c12_solano' },
      falas: [
        ['solano', 'Não… Eu comprei o amanhecer de cada cidade desta região. Não posso perder agora.'],
        ['jogador', 'Eu li o diário do Tiago, em Lamparina. O desenho do menino grande com o sol na mão. Ele ainda tem medo do escuro, Solano?', { requer: ['sq_solano_completa'] }],
        ['solano', 'Quem deixou você entrar naquela casa? … Eu só queria que ninguém no mundo ficasse no escuro de novo.', { requer: ['sq_solano_completa'] }],
        ['narrador', 'O Solano cai de joelhos. O Sereno, ao lado dele, deixa cair a caixa com as sete pedras, e elas rolam até os pedestais.'],
        ['prof', 'Ravi! Me solta, por favor. A chave da gaiola está no bolso do Lúcio, ele não vai reagir.'],
        ['narrador', 'O Lúcio levanta as mãos, sem olhar para ninguém. A gaiola abre. O professor corre até você e segura seu braço com força.'],
        ['prof', 'Eu sinto muito, Ravi. Pelo telefone, pelo arquivo, por tudo. Mas agora vamos fechar isso.'],
        ['narrador', 'No meio do círculo, as sete pedras começam a brilhar com a cor dos ginásios. O oitavo pedestal ainda espera a vela.'],
      ],
      depois: {
        flags: { 'nh.profLivre': true, 'nh.solanoCaiu': true },
        ambiente: true,
      },
      atores: [
        { id: 'solano_relogio', quem: 'solano', nome: 'Augusto Solano', look: LOOKS.solano, spot: 'relogio_pedra', longe: 4 },
        { id: 'prof_relogio', quem: 'prof', nome: 'Prof. Jatobá', look: LOOKS.lazaro, spot: 'relogio_pedra', longe: 5 },
      ],
    },
    {
      // a Vela Eterna no oitavo pedestal: o cadeado abre e o Necrozma aparece
      id: 'j12_vela_acesa',
      local: 'relogio_pedra',
      gatilho: { tipo: 'apos', cena: 'j12_solano_cai' },
      falas: [
        ['jogador', 'A Dona Zélia disse para não acender a vela antes dela mandar. Ela está aqui, pelo rádio. Ela mandou.'],
        ['zelia', 'Pode acender, querido. E cuidado: a chama é a última coisa que segura a noite.'],
        ['narrador', 'Você coloca a Vela Eterna no oitavo pedestal e sopra a chama. Ela não apaga: se acende de vez, azul, com uma luz que não aquece e não ilumina nada além do próprio Relógio.'],
        ['narrador', 'O cadeado de cristal estala. A porta de rocha se abre, e um rugido sai de dentro, como se o próprio céu estivesse rachando.'],
        ['necrozma', 'KRRRRAAAAAA!'],
      ],
      depois: {
        flags: { 'nh.velaAcesa': true },
        ambiente: true,
      },
    },
    {
      // o Necrozma: chefe alfa sem treinador, com Lunala ao lado do jogador (como no cap11.js)
      id: 'j12_necrozma',
      local: 'camara_coracao',
      gatilho: { tipo: 'apos', cena: 'j12_vela_acesa' },
      falas: [
        ['narrador', 'O Necrozma sai do Relógio, pequeno e escuro, com a juba de cristal rachada. O disco do sol no peito dele pulsa fraco, como alguém batendo numa janela por dentro.'],
        ['necrozma', 'KRRRRAAAAAA!'],
        ['narrador', 'Lunala pousa ao seu lado e abre as asas. A luz prateada dela se mistura com a chama azul da vela.'],
        ['jogador', 'Eu sei que você não quer destruir nada. Você só está preso desde que o Relógio foi fechado.'],
      ],
      depois: {
        // a luta é na Câmara do Coração (o jogador entra pela porta do Relógio); o Necrozma é um selvagem lendário de
        // verdade (src/world/lendarios.js: encontro): enfraqueça e capture, ou vença. Perdendo, a cena volta ao entrar na câmara.
        arena: 'camara_entrada',
        batalha: {
          id: 'c12_necrozma', nome: 'Necrozma', perder: 'repete', captura: true, lendario: 'necrozma', ponto: 'necrozma_coracao',
          equipe: [[800, 50, ['sunsteelStrike', 'photonGeyser', 'dragonDance', 'shadowClaw']]],
        },
      },
    },
    {
      // Necrozma foge pela fenda, como no cap11.js (ou fica com o jogador, se a captura der certo)
      id: 'j12_necrozma_foge',
      local: 'camara_coracao',
      gatilho: { tipo: 'vencer', alvo: 'c12_necrozma' },
      falas: [
        ['narrador', 'O Necrozma cambaleia. A juba de cristal racha de vez. O disco do sol no peito dele acende, dourado, cada vez mais forte.'],
        ['narrador', 'CRAC. A armadura se parte e o Necrozma, pequeno de novo, olha para você por um instante. Depois afunda numa fenda aberta no chão do Relógio, e some.', { semFlag: ['lend.necrozma=capturado'] }],
        ['narrador', 'A Poké Bola para de tremer. O Necrozma, quieto lá dentro, não come mais luz nenhuma: agora ele está com você.', { requer: ['lend.necrozma=capturado'] }],
        ['vespera', 'Ele foi embora para a terra. Vai levar muito tempo até ele voltar a comer a luz. Talvez ele nunca volte, se as oito insígnias estiverem fechadas.', { semFlag: ['lend.necrozma=capturado'] }],
        ['vespera', 'Você capturou o Necrozma. Cuida dele: ele passou mil anos com fome de luz.', { requer: ['lend.necrozma=capturado'] }],
        ['narrador', 'As raízes de luz param de puxar. Elas começam a brilhar ao contrário: para fora.'],
      ],
      depois: {
        flags: { 'nh.necrozmaVencido': true },
        ambiente: true,
      },
    },
    {
      // as insígnias do jogador fecham o cadeado de novo: só com as oito
      id: 'j12_selo_insignias',
      local: 'camara_coracao',
      gatilho: { tipo: 'apos', cena: 'j12_necrozma_foge', requer: ['insignias>=8'] },
      falas: [
        ['narrador', 'Cada ginásio envia um fio de luz para o círculo de pedra. Tomé, Lia, Marina, Jonas, Lamparina, Brás, Graça, Celeste. Oito fios, uma pedra em cada.'],
        ['narrador', 'Os fios se trançam no cadeado. A porta de rocha range, e o cadeado volta a fechar, com um estalo baixo, como uma tampa que encaixa.'],
        ['vespera', 'Ele fechou. Pela primeira vez em dezesseis anos, o Relógio está fechado, e não aberto.'],
        ['teo', 'E o sol? Ele vai voltar a nascer na hora?'],
        ['prof', 'Nasce, Téo. Nasce como sempre nasceu, e ninguém precisa comprar o amanhecer de ninguém.'],
      ],
      depois: {
        flags: { 'nh.seloFechado': true, relogio_vencido: true },
        ambiente: true,
      },
    },
    {
      // REVIRAVOLTA 6 (clímax): a Véspera e o Téo voltam para casa; o sol normaliza
      id: 'j12_boletim_final',
      local: 'camara_coracao',
      gatilho: { tipo: 'apos', cena: 'j12_selo_insignias' },
      falas: [
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu hoje às seis horas e quatro minutos. O horário voltou ao normal, e a Companhia Aurora anunciou o fim das atividades de extração no Planalto.'],
        ['mae', 'Ravi! Seis e quatro! O sol voltou. Você está aí em cima, não está? Volta logo para casa, que o bolo está quentinho.'],
        ['jogador', 'Eu chego amanhã cedo, mãe. Mas antes eu preciso atravessar a Cordilheira Geada. A Liga não vai esperar.'],
      ],
      depois: {
        flags: { 'nh.boletim.final': true, 'nh.sol': '6h04' },
        objetivo: { texto: 'Siga para o leste pelo Planalto, depois do Mirante dos Ventos, e entre na Cordilheira Geada pela Rota 15', alvo: 'geada_entrada_oeste' },
      },
    },
  ],
};
