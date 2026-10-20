// Segmento 10 · Arquipélago das Brasas (arco de região, sem ginásio). Ordem: docs/jornada-classica.md, seção 2, linha 10.
// Cais de Cidade Escarpa → Ilha do Basalto → Fontes Termais → Vulcão Tição (o Admin Ébano tenta acordar o vulcão,
// com a equipe de perfuração) → Casa da Vulcanóloga (explica a tempestade sobre o Planalto: é o ar que o Relógio
// puxa; o calor do vulcão é o contrapeso) → Templo da Chama (3 andares) → a tempestade do Planalto acaba.
// Treinadores de rota e templos gerados em regiao-brasas.js (ids br_*); este arquivo não os repete.
// Níveis: Ébano 40–42.
import { LOOKS } from '../elenco.js';

export default {
  id: 'nova10',
  jornada: 'brasas',
  titulo: 'Brasas no vulcão',
  sol: '7h03',
  cenas: [
    {
      id: 'j10_chegada',
      local: 'ilha_basalto',
      gatilho: { tipo: 'entrar', alvo: 'ilha_basalto', requer: ['badges.escarpa'], semFlag: ['nh.chegouBrasas'] },
      falas: [
        ['narrador', 'Ilha do Basalto: rochas negras, fontes de água quente saindo do chão e um cheiro forte de enxofre que chega até o barco.'],
        ['narrador', 'Lá em cima, o vulcão Tição solta uma fumaça fina. Os moradores dizem que, desde a semana passada, o ronco do vulcão não para mais.'],
        ['jogador', 'Se o Ébano está aqui, deve ser para o vulcão. A Graça disse que ele quer acordá-lo.'],
        ['jogador', 'Se o vulcão está acordando, a Graça não exagerava quando falou do vento.'],
        ['narrador', 'Uma nuvem de vapor sobe das fontes quentes e se espalha pelas rochas, molhando as suas botas.'],
      ],
      depois: {
        flags: { 'nh.chegouBrasas': true },
        objetivo: { texto: 'Suba ao Vulcão Tição e veja a equipe de perfuração da Crepúsculo', alvo: 'vulcao_ticao' },
      },
    },
    {
      id: 'j10_ebano_vulcao',
      local: 'vulcao_ticao',
      gatilho: { tipo: 'entrar', alvo: 'vulcao_ticao', requer: ['nh.chegouBrasas'], semFlag: ['nh.ebanoBrasas'] },
      falas: [
        ['narrador', 'Na borda da cratera, um trator de perfuração treme sobre o chão quente. Dois recrutas empurram um tubo de metal para dentro da rocha.'],
        ['recruta', 'Mais uma camada e o vulcão acorda. Aí a nuvem vai para o alto e o vento do planalto muda de direção.'],
        ['ebano', 'Admin Ébano. Você é insistente. Se o vulcão acordar, o ar quente sobe e a tempestade do Planalto cai sobre o Relógio. Não há mais nada para segurar a noite.'],
        ['jogador', 'A tempestade é a sua obra? Por que vocês querem o ar do Relógio em movimento?'],
        ['ebano', 'Porque a Véspera precisa da tempestade parada para o Relógio ficar fechado. Ou abri-lo sem ninguém vendo. Agora, saia do caminho.'],
      ],
      depois: {
        batalha: {
          id: 'c10_ebano', nome: 'Admin Ébano', dinheiro: 3000, perder: 'repete',
          equipe: [[302, 40, ['shadowClaw', 'foulPlay', 'willOWisp']], [430, 41, ['nightSlash', 'braveBird', 'suckerPunch']], [229, 42, ['flamethrower', 'darkPulse', 'nastyPlot']]],
        },
        flags: { 'nh.ebanoBrasas': true },
      },
      atores: [
        { id: 'ebano_vulcao', quem: 'ebano', nome: 'Admin Ébano', look: LOOKS.ebano, spot: 'ninho_vulcao', longe: 3 },
        { id: 'recruta_vulcao', quem: 'recruta', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'ninho_vulcao', longe: 4 },
        { id: 'recruta2_vulcao', quem: 'recruta2', nome: 'Recruta Crepúsculo', look: LOOKS.crepusculo, spot: 'ninho_vulcao', longe: 4 },
      ],
    },
    {
      id: 'j10_vulcanologa',
      local: 'casa_vulcanologa',
      gatilho: { tipo: 'vencer', alvo: 'c10_ebano' },
      falas: [
        ['vulcanologa', 'Eu registro o vulcão há vinte anos. Essa tempestade sobre o Planalto nunca foi do vulcão, e é isso que me preocupa.'],
        ['vulcanologa', 'O Relógio puxa o ar frio de cima para dentro dele, todas as noites. O calor do Tição é o contrapeso que empurra o ar de volta. Sem ele, o vento para e a tempestade fica parada.'],
        ['vulcanologa', 'O Templo da Chama é o lugar onde o calor do vulcão chega mais perto da superfície. Se alguém acender a chama lá em cima, o contrapeso volta e a tempestade se desfaz.'],
        ['jogador', 'Então o Ébano queria acordar o vulcão para manter a tempestade no lugar.'],
        ['vulcanologa', 'Ou para fazer tudo cair de uma vez. Não sei qual dos dois é pior. Vá ao Templo, leve a chama e não deixe ninguém apagar.'],
      ],
      depois: {
        flags: { 'nh.explicouTempestade': true },
        objetivo: { texto: 'Suba ao Templo da Chama e acenda a chama do topo, para desfazer a tempestade do Planalto', alvo: 'templo_chama_1' },
      },
      atores: [
        { id: 'vulcanologa_casa', quem: 'vulcanologa', nome: 'Vulcanóloga Jaciara', look: LOOKS.benta, spot: 'dentro_casa_vulcanologa', permanente: true },
      ],
    },
    {
      id: 'j10_templo_chama',
      local: 'templo_chama_1',
      gatilho: { tipo: 'entrar', alvo: 'templo_chama_1', requer: ['nh.explicouTempestade'], semFlag: ['nh.temploChama'] },
      falas: [
        ['narrador', 'O Templo da Chama é uma escada de pedra negra que sobe pelo lado de dentro do vulcão. Em cada andar, uma fresta mostra o brilho laranja da lava lá embaixo.'],
        ['narrador', 'No topo, uma pira de pedra está apagada há séculos. Ao lado dela, um Pokémon de fogo, pequeno e com a respiração ofegante, espera por alguém que acenda a chama.'],
        ['jogador', 'Vou acender a chama. Vamos juntos.'],
        ['narrador', 'A pira se acende de uma vez, com um estalo grave. O calor sobe pelas paredes, e a tempestade lá em cima, no Planalto, começa a girar ao contrário.'],
      ],
      depois: {
        flags: { 'nh.temploChama': true, 'nh.tempestadeFim': true },
        objetivo: { texto: 'Volte ao barco e siga para o Mirante dos Ventos, no Planalto, agora que a tempestade acabou', alvo: 'ninho_mirante_ventos' },
      },
    },
    {
      id: 'j10_tempestade_fim',
      local: 'ilha_basalto',
      gatilho: { tipo: 'apos', cena: 'j10_templo_chama' },
      falas: [
        ['vulcanologa', 'Olha lá em cima! O céu do Planalto abriu. Pela primeira vez em duas semanas dá para ver o topo do Relógio.'],
        ['jogador', 'E o Relógio, ainda está fechado?'],
        ['vulcanologa', 'Está. Mas agora dá para ver que o cadeado está girando. Não tem mais o vento para segurar.'],
      ],
      depois: { ambiente: true },
    },
  ],
};
