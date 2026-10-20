// Segmento 08 · Sertão do Levante (arco de região, sem ginásio). Ordem: docs/jornada-classica.md, seção 2, linha 8.
// Forte Rochedo → Estrada do Sertão (Vila Mandacaru) → Cânion → Ruínas de Pedra Pintada (Crepúsculo escava, com
// o Admin Ébano) → pinturas → REVIRAVOLTA 3: o Absol que aparece antes dos desastres é a Sina, a parceira da
// Dra. Véspera, presa à luz do Relógio → rival 4 (Téo, já do lado do jogador, mas quer medir o time) → Museu do Sertão:
// o mapa do Paredão (libera a Rota 8).
// Níveis: Ébano 35; rival 4 (Téo) 28–30. Os treinadores de rota do Sertão estão em missoes/regiao-sertao.js.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova08',
  jornada: 'sertao',
  titulo: 'Pedra pintada',
  sol: '6h51',
  cenas: [
    {
      id: 'j08_chegada',
      local: 'vila_mandacaru',
      gatilho: { tipo: 'entrar', alvo: 'vila_mandacaru', requer: ['nh.reviravolta2'], semFlag: ['nh.chegouSertao'] },
      falas: [
        ['narrador', 'Vila Mandacaru: casas de barro, uma cacimba no centro da praça e um vento seco que levanta areia até o meio da rua.'],
        ['narrador', 'A Crepúsculo escava as Ruínas de Pedra Pintada há uma semana, e a Aurora diz que não é nada. Ninguém na vila acredita na Aurora.'],
        ['jogador', 'Eu preciso chegar às ruínas antes deles. O Prof. Jatobá disse que a pedra daqui é ligada ao Relógio.'],
      ],
      depois: {
        flags: { 'nh.chegouSertao': true },
        objetivo: { texto: 'Atravesse o Cânion e chegue às Ruínas de Pedra Pintada, ao norte', alvo: 'sertao_ruinas_entrada' },
      },
    },
    {
      id: 'j08_escavacao',
      local: 'sertao_ruinas_entrada',
      gatilho: { tipo: 'entrar', alvo: 'sertao_ruinas_entrada', requer: ['nh.chegouSertao'], semFlag: ['nh.ebanoSertao'] },
      falas: [
        ['narrador', 'Na entrada das ruínas, a parede de pedra está riscada com linhas de escavação. Uma máquina de perfuração está parada ao lado de um buraco fundo.'],
        ['recruta', 'Só falta uma camada, Admin. Quando a pedra sair, a gente leva a pedra da cidade para o Relógio.'],
        ['ebano', 'Admin Ébano. A pedra tem o desenho do cadeado. Quem vê o desenho sabe onde encaixar a chave. Eu não vou deixar ninguém atrapalhar.'],
        ['jogador', 'O cadeado do Relógio está escondido na parede de vocês? Desde quando?'],
        ['ebano', 'Desde antes de a Aurora pensar em luz. Vá pegar sua lanterna e aprenda a ler as paredes.'],
      ],
      depois: {
        batalha: {
          id: 'c8_ebano', nome: 'Admin Ébano', dinheiro: 2400, perder: 'repete',
          equipe: [[302, 35, ['shadowClaw', 'foulPlay', 'willOWisp']], [430, 35, ['nightSlash', 'braveBird', 'suckerPunch']]],
        },
        flags: { 'nh.ebanoSertao': true },
      },
      atores: [
        { id: 'ebano_ruinas', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'sertao_ruinas_entrada', longe: 3 },
        { id: 'recruta_ruinas', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'sertao_ruinas_entrada', longe: 4 },
      ],
    },
    {
      id: 'j08_pinturas',
      local: 'ruinas_pintada_1',
      gatilho: { tipo: 'vencer', alvo: 'c8_ebano' },
      falas: [
        ['narrador', 'O Ébano some por um corredor de pedra. Atrás dele, a parede abre um salão baixo, com pinturas em vermelho e ocre cobrindo o teto inteiro.'],
        ['narrador', 'Numa das pinturas, um Absol branco fica ao lado de uma mulher de casaco longo. Os dois olham para um relógio gigante, com sete estrelas na borda.'],
        ['narrador', 'Em outra, duas mulheres idênticas aparecem sob a mesma estrela, uma de cada lado do relógio. A legenda está apagada, exceto por uma palavra: "irmãs".'],
        ['jogador', 'O Absol que aparece antes de cada desastre. Ele está em todas as pinturas. Quem é ele?'],
      ],
      depois: {
        flags: { 'nh.pinturas': true },
        objetivo: { texto: 'Procure o Absol branco nas Ruínas de Pedra Pintada: ele está escondido no salão do fundo', alvo: 'ruinas_pintada_2' },
      },
    },
    {
      // REVIRAVOLTA 3: o Absol é a Sina, a parceira da Véspera, presa à luz do Relógio desde então
      id: 'j08_sina_revela',
      local: 'ruinas_pintada_2',
      gatilho: { tipo: 'entrar', alvo: 'ruinas_pintada_2', requer: ['nh.pinturas'], semFlag: ['nh.sina'] },
      reviravolta: 3,
      falas: [
        ['narrador', 'No salão do fundo, o Absol branco está sentado sob um facho de luz dourada que desce do teto. A luz não é de sol. Ela vem de uma fresta, como se houvesse um cristal lá em cima.'],
        ['absol', '…'],
        ['narrador', 'Você estende a mão devagar. O Absol encosta a testa na sua palma. Um calor morno sobe pelo braço, e uma voz de mulher aparece dentro da sua cabeça.'],
        ['absol', 'Sina. Eu sou a Sina. Sou a parceira da Véspera desde antes de a Aurora existir.'],
        ['absol', 'A luz do Relógio me prendeu aqui quando a Véspera tentou fechar o cadeado sozinha. Eu virei sentinela. Desde então, aviso antes de cada desastre e levo quem pode ajudar até a pedra ameaçada.'],
        ['absol', 'Você já me viu no bosque da Lia, na gruta, no templo, na mina. Eu estava guiando você às pedras. Ninguém mais estava.'],
        ['jogador', 'Então você é a Sina. E a Véspera sabe que você está aqui?'],
        ['absol', 'Ela sabe. Ela não pode me tirar daqui sem abrir o cadeado. E o cadeado é a única coisa que mantém a sua cidade acordada.'],
      ],
      depois: {
        flags: { 'nh.sina': true, 'nh.viuSina': true },
        objetivo: { texto: 'Descoberta: o Absol que aparece antes de cada desastre é a Sina, a parceira da Dra. Véspera, presa à luz do Relógio. Vá ao Paredão, na Cidade Escarpa, e procure a Líder Graça', alvo: 'ninho_cidade_escarpa' },
      },
      atores: [
        { id: 'sina_ruinas', quem: 'absol', pokemon: 359, nome: 'Sina', spot: 'ruinas_pintada_2', cena: ['j08_sina_revela'] },
      ],
    },
    {
      id: 'j08_teo_rival4',
      local: 'sertao_praca_mandacaru',
      gatilho: { tipo: 'entrar', alvo: 'sertao_praca_mandacaru', requer: ['nh.sina'], semFlag: ['nh.rival4'] },
      falas: [
        ['teo', 'Você tem andado com um Absol que fala na sua cabeça. Eu não estou com ciúme, mas quero ver o seu time antes de confiar em você.'],
        ['jogador', 'Você mudou de lado na mina, Téo. Por que quer lutar agora?'],
        ['teo', 'Porque eu mudei de lado, e não de cabeça. Quero ter certeza de que você é forte o bastante para parar a Crepúsculo e a Aurora ao mesmo tempo.'],
      ],
      depois: {
        batalha: {
          id: 'nh_rival4', nome: 'Rival Téo', dinheiro: 4200, perder: 'continua',
          equipe: [[397, 28, ['wingAttack', 'aerialAce', 'quickAttack']], [59, 28, ['flameWheel', 'crunch', 'extremeSpeed']], [197, 29, ['feintAttack', 'confuseRay', 'moonlight']], ['rival:3', 30, []]],
        },
        flags: { 'nh.rival4': true },
      },
      atores: [
        { id: 'teo_sertao', quem: 'teo', nome: 'Téo', look: 'rival', spot: 'sertao_praca_mandacaru', longe: 3 },
      ],
    },
    {
      id: 'j08_mapa_paredao',
      local: 'museu_sertao',
      gatilho: { tipo: 'entrar', alvo: 'museu_sertao', requer: ['nh.rival4'], semFlag: ['nh.mapaParedao'] },
      falas: [
        ['narrador', 'O Museu do Sertão guarda um mapa de papel, dobrado em quatro, que mostra o caminho de escalada do Paredão. Uma faixa de cor marca a trilha, e o nome da Cidade Escarpa está escrito em caneta.'],
        ['narrador', 'No verso, um recado de letra miúda: "Quem sobe o Paredão sem mapa cai no vento. Quem sobe com a Sina encontra a pedra certa."'],
        ['teo', 'Eu conheço esse mapa. Meu pai tinha uma cópia parecida na garagem. Ele dizia que o Paredão era o caminho para o Relógio.'],
      ],
      depois: {
        flags: { 'nh.mapaParedao': true },
        ambiente: true,
      },
    },
  ],
};
