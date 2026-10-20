// Segmento 12 · Relógio de Pedra (clímax). Ordem: docs/jornada-classica.md, seção 2, linha 12.
// Topo do Planalto: o Solano tem as sete pedras (vindas do Sereno) e quer a Vela Eterna para abrir o cadeado.
// A Dra. Véspera (48) desafia o jogador primeiro, para ver se ele segura a luz; depois vira aliada. O Téo chega com o
// Heitor, resgatado da mina. Batalha com o Solano (46–47). O cadeado abre: o Necrozma (50) é derrotado e foge pela
// fenda (capturável: é uma luta de chefe, sem treinador, como o Necrozma do cap11.js). As oito insígnias do jogador
// fecham o cadeado de novo. O sol volta ao horário normal. Libera a Rota 12, até a Cordilheira Geada.
// Níveis: Véspera 48; Solano 46–47; Necrozma 50. A Lunala não entra nesta luta: ela fica para o pós-jogo.
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
        ['narrador', 'O topo do Planalto: um círculo de pedra com sete pedestais e, no centro, o Relógio de Pedra.'],
        ['narrador', 'Um cadeado de cristal dourado prende a porta de rocha. Sete pedestais já brilham, cada um com a cor de um ginásio.'],
        ['solano', 'Ravi, chegou na hora certa. Eu gosto de gente pontual. Traga a vela, e o professor volta para casa.'],
        ['narrador', 'O professor está numa gaiola de metal, ao lado do Lúcio, com o rosto pálido e os olhos fixos em você.'],
        ['sereno', 'Senhor Solano, as sete pedras já estão nos pedestais. Falta só a chama do oitavo.'],
        ['jogador', 'Não entrego a vela enquanto o professor não sair daí. E não acendo nada antes de entender o Relógio.'],
        ['solano', 'Quando as oito chaves estiverem acesas, o cadeado se abre. Você não precisa entender. Só precisa me entregar a chama.'],
      ],
      depois: {
        flags: { 'nh.chegouRelogio': true },
        objetivo: { texto: 'Suba a escada do Relógio e enfrente a Dra. Véspera, que quer saber quem você é', alvo: 'relogio_pedra' },
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
        ['vespera', 'Eu me enganei sobre este Relógio por dezesseis anos. Não vou deixar a Aurora usar o meu erro.'],
        ['vespera', 'Você viu o cadeado e sabe o que o Solano quer. Antes de tocar na chama, quero ver se você aguenta a pressão.'],
        ['jogador', 'Eu não trouxe a vela para o Solano. Ela está comigo desde Lamparina, e eu vou protegê-la.'],
        ['vespera', 'Boa resposta. Então prove, porque eu já vi muita gente prometer e deixar a chama apagar.'],
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
        ['vespera', 'Você segurou a chama. Agora escuta, porque eu não vou repetir: o Solano não quer só o cadeado aberto.'],
        ['vespera', 'Ele quer capturar o Necrozma e vender a luz do Planalto. O Sereno trocou as minhas traduções para isso.'],
        ['vespera', 'Eu estou do seu lado agora. Não é por você. É pela Sina, por mim e pelo sol que eu deixei de ver.'],
        ['narrador', 'Lá embaixo, na escada, o Téo chega correndo. Atrás dele vem um homem de capacete sujo de pó, com um lampião na mão.'],
        ['teo', 'Estamos aqui! Eu e meu pai saímos da mina pelo túnel do nível quatro. Eu não aguentei esperar.'],
        ['heitor', 'Ravi, obrigado por ter ido atrás do meu filho. Ele não parava de falar de você, e agora eu entendo por quê.'],
      ],
      depois: {
        flags: { 'nh.chegaramAliados': true, 'nh.veraAliada': true },
        objetivo: { texto: 'Descoberta: Véspera e Téo se unem a você contra o Solano, que quer o Necrozma. Enfrente o Solano no topo do Relógio', alvo: 'relogio_pedra' },
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
        ['solano', 'Acham que uma pedra e um garoto vão deter a Aurora? Eu já tenho contratos com metade do Planalto.'],
        ['solano', 'Lúcio, Sereno, protejam as pedras. Eu cuido do garoto pessoalmente. A Véspera pode continuar sonhando.'],
        ['vespera', 'Eu sonhava com uma noite que protegesse as pessoas. Você só quer uma noite que dê lucro, Solano.'],
        ['narrador', 'Lúcio e Sereno recuam para as bordas do círculo. O Téo entra ao seu lado, com a Poké Bola já na mão.'],
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
        ['solano', 'Não… Eu comprei o amanhecer de cada cidade. Eu não posso perder agora.'],
        ['jogador', 'Eu li o diário do Tiago, em Lamparina. A última página tem o desenho de um menino segurando o sol.', { requer: ['sq_solano_completa'] }],
        ['solano', 'Quem deixou você entrar naquela casa? Eu prometi ao Tiago que ninguém mais ficaria no escuro.', { requer: ['sq_solano_completa'] }],
        ['narrador', 'O Solano cai de joelhos. O Sereno, ao lado dele, larga a caixa vazia no chão. Ninguém tenta recuperar nada.'],
        ['prof', 'Ravi! A chave da gaiola está no bolso do Lúcio. Ele não vai reagir, pode pegar.'],
        ['narrador', 'O Lúcio levanta as mãos sem olhar para ninguém. A gaiola abre, e o professor corre até você e segura seu braço.'],
        ['prof', 'Eu sinto muito, Ravi. Pelo telefone, pelo arquivo, por tudo. Mas agora vamos fechar isso de uma vez.'],
        ['narrador', 'As sete pedras brilham com a cor de cada ginásio. O oitavo pedestal ainda espera a chama.'],
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
        ['jogador', 'A Dona Zélia me disse para acender a chama só aqui, no Relógio. Chegou a hora.'],
        ['narrador', 'Pelo rádio, a voz da Dona Zélia chega baixinha, como se ela estivesse ao seu lado.'],
        ['zelia', 'Pode acender, querido. Essa chama mostra se o Relógio está aberto ou fechado. Mantenha ela acesa só para fechar.'],
        ['narrador', 'Você coloca a Vela Eterna no oitavo pedestal e acende o pavio. A chama se firma, azul, sem tremer e sem aquecer nada.'],
        ['narrador', 'O cadeado de cristal estala. A porta de rocha se abre, e um rugido sai de dentro, como se o céu estivesse rachando.'],
        ['necrozma', 'KRRRRAAAAAA!'],
      ],
      depois: {
        flags: { 'nh.velaAcesa': true },
        ambiente: true,
      },
    },
    {
      // o Necrozma: chefe alfa sem treinador, como no cap11.js
      id: 'j12_necrozma',
      local: 'camara_coracao',
      gatilho: { tipo: 'apos', cena: 'j12_vela_acesa' },
      falas: [
        ['narrador', 'O Necrozma sai do Relógio. A juba de cristal está rachada, e o disco de sol no peito pulsa fraco.'],
        ['necrozma', 'Krrr… luz… luz…'],
        ['narrador', 'A chama azul sobe pelo pedestal e envolve o Necrozma por um instante, como se quisesse convencê-lo a ficar.'],
        ['jogador', 'Você não quer destruir nada. Você só está com fome, porque ficou preso no escuro tempo demais.'],
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
      // Necrozma foge pela fenda (ou fica com o jogador, se a captura der certo)
      id: 'j12_necrozma_foge',
      local: 'camara_coracao',
      gatilho: { tipo: 'vencer', alvo: 'c12_necrozma' },
      falas: [
        ['narrador', 'O Necrozma cambaleia. A juba de cristal racha de vez, e o disco de sol no peito acende, dourado e forte.'],
        ['narrador', 'A armadura se parte, e o Necrozma cai numa fenda aberta no chão do Relógio. Olha para você e some na terra.', { semFlag: ['lend.necrozma=capturado'] }],
        ['narrador', 'A Poké Bola para de tremer. O Necrozma, quieto lá dentro, não come mais luz nenhuma. Agora ele está com você.', { requer: ['lend.necrozma=capturado'] }],
        ['vespera', 'Ele foi para a terra e vai demorar muito para voltar a comer a luz. Se o Relógio ficar fechado, talvez nunca volte.', { semFlag: ['lend.necrozma=capturado'] }],
        ['vespera', 'Você capturou o Necrozma. Cuide bem dele. Ele passou tempo demais preso no escuro para confiar em alguém.', { requer: ['lend.necrozma=capturado'] }],
        ['narrador', 'A luz que descia pelas raízes de cristal se inverte e volta para o céu, como se o sol pudesse respirar de novo.'],
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
        ['narrador', 'Cada ginásio envia um fio de luz ao círculo: Tomé, Lia, Marina, Jonas, Zélia, Brás, Graça e Celeste. São oito fios.'],
        ['narrador', 'Os fios se trançam no cadeado. A porta de rocha range e volta a fechar, com um estalo baixo, como uma tampa que encaixa.'],
        ['vespera', 'Ele fechou. Depois de tudo que a Aurora tirou daqui, o Relógio volta a ficar fechado, do jeito que deveria.'],
        ['teo', 'E o sol? Ele vai nascer na hora de novo?'],
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
        ['radio', 'Boletim da Rádio Alvorada: o sol nasceu às seis e quatro. A Companhia Aurora anunciou o fim da extração no Planalto.'],
        ['mae', 'Ravi! Seis e quatro! O sol voltou no horário. Você está aí em cima, não está? Volta logo para casa.'],
        ['jogador', 'Eu chego amanhã cedo, mãe. Antes, preciso atravessar a Cordilheira Geada. A Liga não espera.'],
      ],
      depois: {
        flags: { 'nh.boletim.final': true, 'nh.sol': '6h04' },
        objetivo: { texto: 'Siga para o leste pelo Planalto, depois do Mirante dos Ventos, e entre na Cordilheira Geada pela Rota 15', alvo: 'geada_entrada_oeste' },
      },
    },
  ],
};
