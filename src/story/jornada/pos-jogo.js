// Pós-jogo (docs/jornada-classica.md, seção 2, linha PJ). Depois do epílogo: a neblina do Mar do Sul começa a se mexer.
// Mar do Sul (Templo das Marés, Farol Morto) e Terras do Ocaso (Vila Fim-do-Mundo). Revanches e lendários
// (Solgaleo, Lunala) são cenas do Relógio e do santuário sem nome; os lendários em si vêm de src/data/lendarios.js.
// Níveis: a definir na etapa de conteúdo do pós-jogo.
export default {
  id: 'nova_pj',
  jornada: 'posjogo',
  titulo: 'O mar do sul',
  sol: '6h04',
  cenas: [
    {
      id: 'pj_neblina',
      local: 'mar_do_sul',
      gatilho: { tipo: 'flag', alvo: 'nh.epilogo', semFlag: ['nh.pjNeblina'] },
      falas: [
        ['narrador', 'Do Planalto, a neblina do mar do sul parece mais clara a cada manhã. Dizem os pescadores que ela recua desde o Relógio.'],
        ['pokedex', 'Registro novo: uma luz sem origem conhecida sob as águas do sul. A intensidade cresce a cada hora.'],
        ['jogador', 'Então ainda há algo lá embaixo. Vou descobrir o que é.'],
      ],
      depois: {
        flags: { 'nh.pjNeblina': true },
        objetivo: { texto: 'Siga para o Mar do Sul e chegue à ilha do Farol Morto', alvo: 'ilha_farol_morto' },
      },
    },
    {
      id: 'pj_farol_morto',
      local: 'ilha_farol_morto',
      gatilho: { tipo: 'entrar', alvo: 'ilha_farol_morto', requer: ['nh.pjNeblina'], semFlag: ['nh.pjFarol'] },
      falas: [
        ['narrador', 'O Farol Morto está apagado há décadas. Mas dentro da torre, uma lâmpada de cristal brilha, quente e dourada.'],
        ['narrador', 'Sob a lâmpada, um Pokémon de luz espera imóvel, com as asas abertas. Ele não parece bravo, só curioso.'],
        ['jogador', 'Uma torre apagada e uma luz acesa. Isso não é coisa do vento.'],
        ['narrador', 'O Pokémon inclina a cabeça, como se tivesse entendido, e recua devagar em direção ao mar.'],
      ],
      depois: {
        flags: { 'nh.pjFarol': true },
        objetivo: { texto: 'Passe pela neblina das Terras do Ocaso, a oeste, e procure a Vila Fim-do-Mundo', alvo: 'vila_fim_mundo' },
      },
    },
    {
      id: 'pj_ocaso',
      local: 'vila_fim_mundo',
      gatilho: { tipo: 'entrar', alvo: 'vila_fim_mundo', requer: ['nh.pjFarol'], semFlag: ['nh.pjOcaso'] },
      falas: [
        ['narrador', 'Vila Fim-do-Mundo: casas de pedra no fim de uma estrada que parece não ter fim, com o sol se pondo sobre o vale.'],
        ['narrador', 'Ninguém aqui conhece o Relógio, mas todos contam as horas pelo sol. E concordam que ele anda devagar.'],
        ['jogador', 'Um lugar que nunca ouviu falar do Relógio, mas que percebe o sol. Isso já diz muito.'],
        ['narrador', 'Um pescador ri baixinho e aponta para o vale, onde a luz já começa a dourar a estrada.'],
      ],
      depois: {
        flags: { 'nh.pjOcaso': true },
        ambiente: true,
      },
    },
    {
      id: 'pj_relogio',
      local: 'relogio_pedra',
      gatilho: { tipo: 'entrar', alvo: 'relogio_pedra', requer: ['trainers.c12_solano'], semFlag: ['nh.pjRelogio'] },
      falas: [
        ['narrador', 'Depois do selo, o topo do Relógio ainda amanhece dourado. Um clarão desce do sol e pousa sobre as pedras.'],
        ['pokedex', 'Registro: Solgaleo, Pokémon do sol. Origem desconhecida. Ele não está preso. Ele escolheu ficar.'],
        ['jogador', 'Um Pokémon que veio até aqui por vontade própria. Preciso falar com ele.'],
      ],
      depois: {
        flags: { 'nh.pjRelogio': true },
        objetivo: { texto: 'Vá ao topo do Relógio: o Solgaleo está lá e pode ser capturado. Depois, siga a luz do amanhecer até o santuário sem nome', alvo: 'relogio_pedra' },
      },
    },
    {
      id: 'pj_lunala',
      local: 'santuario_crepusculo',
      gatilho: { tipo: 'entrar', alvo: 'santuario_crepusculo', requer: ['nh.pjRelogio'], semFlag: ['nh.pjLunala'] },
      falas: [
        ['narrador', 'O santuário sem nome fica do lado oposto ao Relógio. Uma luz prateada sobe do chão, acompanhada de um canto baixo.'],
        ['jogador', 'Lunala. Se o Solgaleo guardava o dia, ela deve ter guardado a noite. E a noite também ficou presa.'],
      ],
      depois: {
        flags: { 'nh.pjLunala': true },
        objetivo: { texto: 'Vá ao santuário sem nome: a Lunala está lá e pode ser capturada. O dia e a noite voltam ao equilíbrio', alvo: 'santuario_crepusculo' },
      },
    },
  ],
};
