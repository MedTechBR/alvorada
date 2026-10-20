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
    resumo: 'Jaciara registra o Tição há vinte anos e nunca o viu se mexer assim. Ela quer três sensores: na borda da cratera, no Rio de Lava e na Forja Antiga.',
    oferta: [
      'O Ébano não conseguiu acordar o vulcão. Mas, nos últimos dias, alguma coisa lá embaixo começou a se mexer sozinha. Os meus instrumentos nunca mentiram.',
      'Tenho três sensores: um na borda da cratera, um no Rio de Lava e um na Forja Antiga. Os dois últimos ficam dentro do Templo da Chama, no caminho que você já vai subir de qualquer jeito.',
      'Eu tenho vertigem e medo de lava. Você, não. Finca os três por mim?',
    ],
    aceita: ['Aqui estão. Finque cada um no chão com o pé, firme. A agulha faz o resto.'],
    lembrete: ['Três pontos: a borda da cratera, o Rio de Lava (2º andar do templo) e a Forja Antiga (3º).'],
    itensIniciais: [['sensor_sismico', 3]],
    etapas: [
      { tipo: 'chegar', lugar: 'brasas_cratera_borda', r: 4, texto: 'Finque o 1º sensor na borda da cratera do Tição',
        falas: ['Você finca o sensor. A agulha pula e começa a escrever.'] },
      { tipo: 'chegar', sala: 'templo_chama_2', x: 30, y: 8, r: 3, texto: 'Finque o 2º sensor no Rio de Lava (2º andar do Templo da Chama)',
        falas: ['O sensor encosta no basalto morno e a agulha dispara. Aqui o tremor é forte.'] },
      { tipo: 'chegar', sala: 'templo_chama_3', x: 18, y: 5, r: 3, texto: 'Finque o 3º sensor na Forja Antiga (3º andar)',
        falas: ['Você finca o último sensor. A agulha tremula e, de repente, desenha um pico.', 'Algo se mexe na câmara à sua frente.'] },
      { tipo: 'falar', npc: 'vulcanologa', texto: 'Volte à Jaciara com as medições',
        falas: ['Três pontos, três medições, e a terceira mostra um pico que não devia existir.', 'Isso não é tremor de vulcão. É coisa viva se espreguiçando, no fundo da Forja Antiga. Eu não sei o que é. Você sabe como descobrir.'] },
    ],
    recompensa: { itens: [['heatRock', 1], ['charizarditeY', 1]] },
    proxima: 'sq_heatran',
  },
  {
    id: 'sq_heatran', titulo: 'O coração do vulcão', regiao: 'Templo da Chama', de: 'vulcanologa',
    resumo: 'O terceiro sensor mostrou algo vivo e pesado na câmara da Forja Antiga. A Jaciara quer saber o que é.',
    oferta: [
      'O sensor da Forja Antiga ainda manda leituras. Algo grande, quente e pesado respira na câmara do fundo, no mesmo ritmo do vulcão.',
      'Vinte anos de caderno, e a coisa que eu mais quis ver está a um lance de escada. Eu não consigo ir. Você vai?',
    ],
    aceita: ['Boa sorte. A câmara fica depois dos sinos e dos braseiros da Forja Antiga.'],
    lembrete: ['A câmara do fundo da Forja Antiga, depois dos sinos e dos quatro braseiros.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_chama_3', x: 18, y: 5, r: 3, texto: 'Entre na câmara do fundo da Forja Antiga',
        falas: ['A câmara está iluminada por um lago de lava. No centro, sobre uma ilha de obsidiana, algo enorme abre os olhos.'] },
      { tipo: 'vencer', alfa: { dex: 485, nivel: 70, sala: 'templo_chama_3', x: 18, y: 3, golpes: ['magmaStorm', 'flashCannon', 'earthPower', 'heatWave'], aviso: 'Heatran desperta da forja!' },
        texto: 'Enfrente (ou capture) o Pokémon que dorme na câmara' },
      { tipo: 'falar', npc: 'vulcanologa', texto: 'Conte à Jaciara o que viu',
        falas: ['Heatran! O coração do vulcão! Então os tremores eram ele respirando.', 'Vinte anos de caderno e é um bicho de aço e lava. Obrigada, de verdade. Eu vou escrever o seu nome ao lado do dele.'] },
    ],
    recompensa: { itens: [['maxRevive', 2]], dinheiro: 5000, texto: 'Heatran (nv 70), capturado ou vencido na câmara' },
  },
];

export const NPCS = {
  vulcanologa: {
    falas: [
      { se: { missoes: ['sq_heatran'] }, linhas: ['Heatran existe! E o sismógrafo continua a contar a história dele. Agora o vulcão ronca como quem ressona.'] },
      { se: { missoes: ['sq_sismografo'] }, linhas: ['Os sensores continuam mandando dados. Algo vivo respira lá embaixo, e eu ainda não sei dizer o quê.'] },
    ],
  },
  ferreiro_brasao: {
    reage: { especie: { 935: ['Um Charcadet! As armaduras estão à venda no Mercado de Vila Termas. Cada um escolhe a sua.'], 936: ['Uma Armarouge! A armadura Auspiciosa nunca ficou tão bem.'], 937: ['Um Ceruledge! A Maliciosa tem lâmina própria, e ele sabe usar.'] } },
  },
  dona_vapor: {
    reage: { tipo: { fire: ['Pokémon de fogo adora o vapor da pousada. Ficam o dia inteiro aqui na fenda.'], water: ['Um Pokémon de água! Quente demais para ele, mas ele aguenta a cortesia.'] } },
  },
  dona_hana: {
    reage: { especie: { 79: ['Um Slowpoke! Os das fontes têm primos de Galar, de óculos e tudo.'], 80: ['Um Slowbro! Ele deve conhecer meu banho melhor do que eu.'] } },
  },
  faroleiro_tobias: {
    falas: [
      { linhas: ['Acendo a luz todas as noites para os barcos. De longe, o vulcão parece outro farol, mas esse não obedece ninguém.'] },
    ],
  },
  pescador_gaudencio: {
    diario: { sorteio: [['oranBerry', 2], ['pechaBerry', 2], ['cheriBerry', 2]], falas: ['Peguei muita fruta no mato da ilha. Leve algumas.'], depois: ['Volte amanhã, a árvore dá de novo.'] },
  },
};
