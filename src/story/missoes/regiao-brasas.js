// Missões e NPCs vivos do Arquipélago das Brasas (Vila Termas, Ilha do Basalto, Campos de Cinza, Vulcão Tição, Templo da Chama).
// Formato: docs/missoes.md. Plano: docs/mundo-expandido.md (seção 10, Vila Termas, e seção 12, lendários).
// Os moradores estão em assets/maps/regioes/brasas.json (gerado por tools/brasas/gerar.py); as salas do templo são
// templo_chama_1 (Portal de Basalto), templo_chama_2 (Rio de Lava) e templo_chama_3 (Forja Antiga).

export const ITENS = {
  sensor_sismico: { name: 'Sensor sísmico', color: '#e8643a', desc: 'Aparelho da Vulcanóloga Jaciara: uma haste com agulha que mede os tremores do Tição. Precisa ser fincado no chão.' },
};

// Brasas: duas missões encadeadas da Vulcanóloga Jaciara (a mesma da cena j10_vulcanologa). Armaduras, ovo no vapor, Camerupt,
// Moltres, Volcanion, Tapu Lele e pérolas negras saíram (docs/jornada-roteiro.md). Os dois Charcadet-armaduras agora são vendidos
// no Mercado de Vila Termas (src/world/lojas.js).
export const MISSOES = [
  {
    id: 'sq_sismografo', titulo: 'O vulcão acordado', regiao: 'Vulcão Tição', de: 'vulcanologa',
    requer: { flags: ['nh.explicouTempestade'] },
    versao: 2,
    resumo: 'Há vinte anos Jaciara registra o Tição e nunca o viu tremer assim. Ela já mediu a borda da cratera e o Rio de Lava; falta o ponto mais fundo, a Forja Antiga.',
    oferta: [
      'O Ébano tentou acordar o vulcão e não conseguiu. Mas, desde então, algo lá embaixo se mexe sozinho. Os meus instrumentos nunca mentiram.',
      'A borda da cratera e o Rio de Lava tremem no mesmo ritmo, e o ritmo vem de baixo: da Forja Antiga, no 3º andar do Templo da Chama.',
      'Falta medir o fundo. Eu tenho vertigem e medo de lava, e você não. Finca este sensor lá por mim?',
    ],
    aceita: ['Finque no chão, firme, perto da porta da câmara do fundo. A agulha faz o resto.'],
    lembrete: ['Forja Antiga, no 3º andar do Templo da Chama, perto da porta da câmara do fundo.'],
    itensIniciais: [['sensor_sismico', 1]],
    etapas: [
      { tipo: 'chegar', sala: 'templo_chama_3', x: 18, y: 5, r: 3, texto: 'Finque o sensor na Forja Antiga (3º andar do Templo da Chama)',
        falas: ['Você finca o sensor e a agulha tremula. De repente, ela desenha um pico alto.', 'Atrás da porta da câmara do fundo, algo grande solta o ar devagar.'] },
      { tipo: 'falar', npc: 'vulcanologa', texto: 'Volte à Jaciara, na casa dela em Vila Termas, com a medição',
        falas: ['Um pico que não devia existir, no mesmo compasso da cratera e do rio.', 'Isso não é tremor de vulcão. É coisa viva se espreguiçando no fundo da Forja Antiga.', 'Eu não sei o que é. Mas você sabe como descobrir.'] },
    ],
    recompensa: { itens: [['heatRock', 1], ['charizarditeY', 1]] },
    proxima: 'sq_heatran',
  },
  {
    id: 'sq_heatran', titulo: 'O coração do vulcão', regiao: 'Templo da Chama', de: 'vulcanologa',
    resumo: 'O sensor deixado na Forja Antiga mostra algo vivo e pesado respirando na câmara do fundo. Jaciara quer saber o que é.',
    oferta: [
      'O sensor da Forja Antiga continua mandando leituras. Algo grande, quente e pesado respira na câmara do fundo, no ritmo do vulcão.',
      'Vinte anos de caderno, e o que eu mais quis ver está a um lance de escada. Eu não consigo descer lá. Você vai?',
    ],
    aceita: ['Boa sorte. A câmara fica depois dos sinos e dos braseiros da Forja Antiga. Cuidado com o calor.'],
    lembrete: ['A câmara do fundo da Forja Antiga, depois dos sinos e dos quatro braseiros.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_chama_3', x: 18, y: 5, r: 3, texto: 'Entre na câmara do fundo da Forja Antiga',
        falas: ['A câmara é iluminada por um lago de lava. Sobre uma ilha de obsidiana, algo enorme abre os olhos.'] },
      { tipo: 'vencer', alfa: { dex: 485, nivel: 70, sala: 'templo_chama_3', x: 18, y: 3, golpes: ['magmaStorm', 'flashCannon', 'earthPower', 'heatWave'], aviso: 'Heatran desperta da forja!' },
        texto: 'Enfrente (ou capture) o Pokémon que desperta na câmara' },
      { tipo: 'falar', npc: 'vulcanologa', texto: 'Conte à Jaciara o que viu',
        falas: ['Heatran! O coração do vulcão! Então os tremores eram ele respirando.', 'Vinte anos de caderno, e era um bicho de aço e lava. Obrigada, de verdade. Vou escrever o seu nome ao lado do dele.'] },
    ],
    recompensa: { itens: [['maxRevive', 2]], dinheiro: 5000, texto: 'Heatran (nv 70), capturado ou vencido na câmara' },
  },
];

export const NPCS = {
  vulcanologa: {
    falas: [
      { se: { missoes: ['sq_heatran'] }, linhas: ['Heatran existe, e o sismógrafo conta a história dele. Agora o vulcão ronca como quem ressona.'] },
      { se: { missoes: ['sq_sismografo'] }, linhas: ['Os dados não mentem: algo vivo respira na Forja Antiga. A câmara do fundo espera, se você quiser ver.'] },
    ],
  },
  ferreiro_brasao: {
    reage: { especie: { 935: ['Um Charcadet! As armaduras estão à venda no Mercado de Vila Termas. Cada um escolhe a sua.'], 936: ['Uma Armarouge! A armadura Auspiciosa nunca ficou tão bem num Pokémon.'], 937: ['Um Ceruledge! A armadura Maliciosa tem lâmina própria, e ele sabe usá-la.'] } },
  },
  dona_vapor: {
    reage: { tipo: { fire: ['Pokémon de fogo adora o vapor da pousada. Passam o dia inteiro aqui na fenda.'], water: ['Um Pokémon de água! Está quente demais para ele, mas ele aguenta por educação.'] } },
  },
  dona_hana: {
    reage: { especie: { 79: ['Um Slowpoke! Os das fontes têm primos em Galar, de óculos e tudo.'], 80: ['Um Slowbro! Ele deve conhecer o meu banho melhor do que eu.'] } },
  },
  faroleiro_tobias: {
    falas: [
      { linhas: ['Acendo a luz toda noite para os barcos. De longe o vulcão parece outro farol, mas esse não obedece ninguém.'] },
    ],
  },
  pescador_gaudencio: {
    diario: { sorteio: [['oranBerry', 2], ['pechaBerry', 2], ['cheriBerry', 2]], falas: ['Colhi fruta demais no mato da ilha. Leve algumas, que comigo estraga.'], depois: ['A árvore dá de novo amanhã. Volte, que a conversa também é de graça.'] },
  },
};
