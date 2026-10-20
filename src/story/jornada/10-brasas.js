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
      gatilho: { tipo: 'entrar', alvo: ['ilha_basalto', 'vila_termas'], requer: ['badges.escarpa'], semFlag: ['nh.chegouBrasas'] },
      falas: [
        ['narrador', 'Ilha do Basalto: rochas negras, fontes de água quente e um cheiro forte de enxofre que chega até o barco.'],
        ['narrador', 'Lá em cima, o vulcão Tição solta uma fumaça fina. Os moradores dizem que o ronco não para desde a semana passada.'],
        ['jogador', 'Se o Ébano está aqui, deve ser por causa do vulcão. A Graça disse que ele quer acordá-lo.'],
        ['jogador', 'Se o vulcão está acordando, a Graça não exagerava quando falou da cinza.'],
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
        ['narrador', 'Na borda da cratera, um trator de perfuração treme sobre o chão quente. Dois recrutas empurram um tubo para dentro da rocha.'],
        ['recruta', 'Mais uma camada e o vulcão acorda. Aí a cinza sobe para o céu e o Planalto some no escuro.'],
        ['ebano', 'Admin Ébano. Você é insistente. Quando o Tição acordar, a cinza cobre o Planalto e ninguém sobe ao Relógio.'],
        ['jogador', 'A cinza é obra sua? Por que a Crepúsculo quer o Planalto no escuro?'],
        ['ebano', 'Porque a Véspera quer o Relógio longe de quem vai abri-lo. Agora, saia do caminho.'],
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
        ['vulcanologa', 'Eu registro o vulcão há vinte anos. A tempestade sobre o Planalto nunca veio do Tição, e isso me preocupa.'],
        ['vulcanologa', 'O Relógio puxa o ar de cima para dentro dele, toda noite. O calor do Tição empurra esse ar de volta. Sem calor, a tempestade fica parada.'],
        ['vulcanologa', 'O Templo da Chama fica onde o calor do vulcão chega mais perto da superfície. Se alguém acender a pira, o ar volta a girar.'],
        ['jogador', 'Então o Ébano quer o Planalto no escuro, e a tempestade é a cortina dele.'],
        ['vulcanologa', 'Ou quer que ninguém chegue ao Relógio antes dele. Não sei qual dos dois é pior. Vá ao Templo e acenda a pira.'],
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
        ['narrador', 'O Templo da Chama é uma escada de pedra negra por dentro do vulcão. Em cada andar, uma fresta mostra a lava lá embaixo.'],
        ['narrador', 'No topo, uma pira está apagada há séculos. Um Pokémon de fogo, pequeno e ofegante, espera por alguém que a acenda.'],
        ['jogador', 'Vou acender a chama. Vamos juntos.'],
        ['narrador', 'A pira se acende de uma vez, com um estalo grave. O calor sobe pelas paredes, e a tempestade lá em cima começa a girar ao contrário.'],
      ],
      depois: {
        flags: { 'nh.temploChama': true, 'nh.tempestadeFim': true, brasas_resolvido: true },
        objetivo: { texto: 'Suba ao Planalto dos Ventos pela Rota 9 e chegue ao Mirante dos Ventos: a tempestade acabou', alvo: 'ninho_mirante_ventos' },
      },
    },
    {
      id: 'j10_tempestade_fim',
      local: 'ilha_basalto',
      gatilho: { tipo: 'apos', cena: 'j10_templo_chama' },
      falas: [
        ['vulcanologa', 'Olha lá em cima! O céu do Planalto abriu. Pela primeira vez em duas semanas dá para ver o topo do Relógio.'],
        ['jogador', 'E o Relógio? Ainda está fechado?'],
        ['vulcanologa', 'Está fechado, mas o cadeado está girando sozinho. Quem estiver lá em cima vai sentir isso.'],
      ],
      depois: { ambiente: true },
    },
  ],
};
