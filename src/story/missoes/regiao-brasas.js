// Missões e NPCs vivos do Arquipélago das Brasas (Vila Termas, Ilha do Basalto, Campos de Cinza, Vulcão Tição, Templo da Chama).
// Formato: docs/missoes.md. Plano: docs/mundo-expandido.md (seção 10, Vila Termas, e seção 12, lendários).
// Os moradores estão em assets/maps/regioes/brasas.json (gerado por tools/brasas/gerar.py); as salas do templo são
// templo_chama_1 (Portal de Basalto), templo_chama_2 (Rio de Lava) e templo_chama_3 (Forja Antiga).

export const ITENS = {
  sensor_sismico: { name: 'Sensor sísmico', color: '#e8643a', desc: 'Aparelho da Dra. Lava: uma haste com agulha que mede os tremores do Tição. Precisa ser fincado no chão.' },
  pena_brasa: { name: 'Pena de brasa', color: '#ff8a3a', desc: 'Uma pena que nunca esfria. Cheira a cinza e a pôr do sol.' },
};

export const MISSOES = [
  {
    id: 'sq_armaduras', titulo: 'As duas armaduras', regiao: 'Vila Termas', de: 'ferreiro_brasao',
    resumo: 'O Ferreiro Brasão forja a Armadura Auspiciosa para o Charcadet, mas precisa de dez Pedras do Fogo.',
    oferta: ['Charcadet nasce sem armadura. Cada um escolhe a sua, e eu forjo.', 'A Auspiciosa, dourada, pede dez Pedras do Fogo. Os Campos de Cinza e as lojas têm. Me traz?'],
    aceita: ['Fechado! A forja já está quente.'],
    lembrete: ['Dez Pedras do Fogo. Acha nos Campos de Cinza, no vulcão ou no Mercado.'],
    etapas: [
      { tipo: 'entregar', npc: 'ferreiro_brasao', item: 'fireStone', n: 10, texto: 'Leve 10 Pedras do Fogo ao Ferreiro Brasão, em Vila Termas',
        pergunta: ['Trouxe as dez pedras?'], falta: ['Ainda faltam pedras. Dez, nem uma a menos.'],
        falas: ['Dez pedras de fogo, uma mais bonita que a outra!', 'Pronto, pelo martelo e pelo brasa! Tome a Armadura Auspiciosa.'] },
    ],
    recompensa: { itens: [['auspiciousArmor', 1]] },
    proxima: 'sq_armaduras_m',
  },
  {
    id: 'sq_armaduras_m', titulo: 'A armadura maliciosa', regiao: 'Vila Termas', de: 'ferreiro_brasao',
    resumo: 'Se o Charcadet prefere a armadura escura, a Maliciosa pede dez Etiquetas Enfeitiçadas.',
    oferta: ['Tem Charcadet que não gosta de ouro. Esses querem a Armadura Maliciosa, escura e cheia de ponta.', 'Dez Etiquetas Enfeitiçadas, e eu forjo mais essa. Topa?'],
    aceita: ['Então traz as etiquetas. Cuidado, elas arrepiam.'],
    lembrete: ['Dez Etiquetas Enfeitiçadas. Os Pokémon fantasma costumam carregar.'],
    etapas: [
      { tipo: 'entregar', npc: 'ferreiro_brasao', item: 'spellTag', n: 10, texto: 'Leve 10 Etiquetas Enfeitiçadas ao Ferreiro Brasão',
        pergunta: ['Trouxe as etiquetas?'], falta: ['Faltam etiquetas. Elas somem quando a gente não está olhando.'],
        falas: ['Arrepiou até a bigorna! Aqui está a Armadura Maliciosa.'] },
    ],
    recompensa: { itens: [['maliciousArmor', 1]] },
  },
  {
    id: 'sq_ovo_vapor', titulo: 'Ovo cozido no vapor', regiao: 'Vila Termas', de: 'dona_vapor', diaria: true,
    resumo: 'A Pousada do Vapor cozinha um ovo por dia na fenda do chão. Cura o cansaço e dá um pouco de experiência.',
    oferta: ['Todo dia eu cozinho ovo na fenda do chão. Fica no ponto, mole por dentro, firme por fora.', 'Quer o de hoje? É por conta da casa.'],
    aceita: ['Pode pegar no cesto, ainda está quentinho.'],
    ofertaRepetida: ['Passou mais um dia! O ovo de hoje já está no cesto, quer?'],
    etapas: [
      { tipo: 'falar', npc: 'dona_vapor', texto: 'Pegue o ovo cozido no vapor com a Dona Cida',
        falas: ['Tome. Come devagar, que a gema escorre.', 'Pronto, agora você está novo em folha!'] },
    ],
    recompensa: { itens: [['expCandyS', 1]] },
    recompensaRepetida: { itens: [['expCandyS', 1]] },
  },
  {
    id: 'sq_camerupt', titulo: 'A montanha que anda', regiao: 'Campos de Cinza', de: 'dra_lava',
    requer: { insignias: 3 },
    resumo: 'Um Camerupt Alfa abre crateras nos Campos de Cinza e a Dra. Lava quer o chão de volta.',
    oferta: ['Os Campos de Cinza viraram queijo suíço. Um Camerupt enorme, de olhos vermelhos, abre uma cratera a cada passo.', 'Ele não é mau, só está agitado com os tremores. Pode acalmá-lo, ou capturá-lo? Eu cubro a recompensa.'],
    aceita: ['Ótimo. Ele aparece perto das crateras novas, mais ao sul dos campos.'],
    lembrete: ['O Camerupt Alfa anda pelos Campos de Cinza, perto das crateras.'],
    etapas: [
      { tipo: 'vencer', alfa: { dex: 323, nivel: 49, lugar: 'brasas_campos_alfa', golpes: ['eruption', 'earthPower', 'rockSlide', 'flamethrower'], aviso: 'O chão treme e um Camerupt Alfa sai da cratera!' },
        texto: 'Vença (ou capture) o Camerupt Alfa nos Campos de Cinza' },
      { tipo: 'falar', npc: 'dra_lava', texto: 'Conte à Dra. Lava',
        falas: ['Os tremores diminuíram! Então era ele que estava agitado.', 'Tome. A pedra é dele, ou de quem o domar. Chama-se Cameruptita.'] },
    ],
    recompensa: { itens: [['cameruptite', 1], ['hyperPotion', 3]] },
  },
  {
    id: 'sq_sismografo', titulo: 'O vulcão acordado', regiao: 'Vulcão Tição', de: 'dra_lava',
    requer: { missoes: ['sq_camerupt'] },
    resumo: 'A Dra. Lava quer três sensores sísmicos fincados: na borda da cratera, no Rio de Lava e na Forja Antiga.',
    oferta: ['O Tição não está só rosnando, está acordando. Preciso de sensores em três pontos: a borda da cratera, o Rio de Lava e a Forja Antiga.', 'Subir ao topo pede escalada, e o templo guarda quebra-cabeças. Mas você já mostrou que dá conta. Topa?'],
    aceita: ['Aqui estão os três sensores. Finque cada um no chão com o pé, firme.'],
    lembrete: ['Três pontos: a borda da cratera, o Rio de Lava (2º andar do templo) e a Forja Antiga (3º).'],
    itensIniciais: [['sensor_sismico', 3]],
    etapas: [
      { tipo: 'chegar', lugar: 'brasas_cratera_borda', r: 4, texto: 'Finque o 1º sensor na borda da cratera do Tição',
        falas: ['Você finca o sensor. A agulha pula e começa a escrever.'] },
      { tipo: 'chegar', sala: 'templo_chama_2', x: 30, y: 8, r: 3, texto: 'Finque o 2º sensor no Rio de Lava (2º andar do Templo da Chama)',
        falas: ['O sensor encosta no basalto morno e a agulha dispara. Aqui o tremor é forte.'] },
      { tipo: 'chegar', sala: 'templo_chama_3', x: 18, y: 5, r: 3, texto: 'Finque o 3º sensor na Forja Antiga (3º andar)',
        falas: ['Você finca o último sensor. A agulha tremula e, de repente, desenha um pico.', 'Algo se mexe na câmara à sua frente.'] },
      { tipo: 'falar', npc: 'dra_lava', texto: 'Volte à Dra. Lava com as medições',
        falas: ['Três pontos, três medições, e o terceiro mostra um pico que não deveria existir.', 'Algo se mexe na câmara da Forja Antiga. Eu não sei o que é. Mas você sabe como descobrir.'] },
    ],
    recompensa: { itens: [['heatRock', 1], ['charizarditeY', 1]] },
    proxima: 'sq_heatran',
  },
  {
    id: 'sq_heatran', titulo: 'O coração do vulcão', regiao: 'Templo da Chama', de: 'dra_lava',
    resumo: 'O terceiro sensor mostrou algo se mexendo na câmara da Forja Antiga. A Dra. Lava quer saber o que é.',
    oferta: ['O sensor da Forja Antiga ainda manda leituras. Algo grande, quente e pesado se mexe na câmara do fundo.', 'Alguém precisa ir lá ver. Eu só tenho vertigem e medo de lava. Você tem outra coisa?'],
    aceita: ['Boa sorte. A câmara fica depois dos sinos e dos braseiros da Forja Antiga.'],
    lembrete: ['A câmara do fundo da Forja Antiga, depois dos sinos e dos quatro braseiros.'],
    etapas: [
      { tipo: 'chegar', sala: 'templo_chama_3', x: 18, y: 5, r: 3, texto: 'Entre na câmara do fundo da Forja Antiga',
        falas: ['A câmara está iluminada por um lago de lava. No centro, sobre uma ilha de obsidiana, algo enorme abre os olhos.'] },
      { tipo: 'vencer', alfa: { dex: 485, nivel: 70, sala: 'templo_chama_3', x: 18, y: 3, golpes: ['magmaStorm', 'flashCannon', 'earthPower', 'heatWave'], aviso: 'Heatran desperta da forja!' },
        texto: 'Enfrente (ou capture) o Pokémon que dorme na câmara' },
      { tipo: 'falar', npc: 'dra_lava', texto: 'Conte à Dra. Lava o que viu',
        falas: ['Heatran! O coração do vulcão! Então os tremores eram ele se espreguiçando.', 'O sismógrafo vai ter muito que contar. Obrigada por ir até lá.'] },
    ],
    recompensa: { itens: [['maxRevive', 2]], dinheiro: 5000, texto: 'Heatran (nv 70), capturado ou vencido na câmara' },
  },
  {
    id: 'sq_moltres', titulo: 'A ave que acende o dia', regiao: 'Cratera do Tição', de: 'dra_lava',
    requer: { missoes: ['sq_sismografo'], insignias: 6 },
    resumo: 'Os moradores falam de uma ave de fogo que pousa numa ilha de obsidiana no meio da cratera, para quem chega sem pressa.',
    oferta: ['As lendas daqui falam de uma ave que acende o dia: Moltres. Ela pousa numa ilha de obsidiana no meio do lago de lava da cratera.', 'Para chegar lá, é preciso encher a lava com pedra firme. Quer tentar?'],
    aceita: ['A ave só aparece para quem chega em paz. E sem pressa.'],
    lembrete: ['Na cratera do Tição, a ilha de obsidiana no lago de lava: as pedras de força tapam a lava.'],
    etapas: [
      { tipo: 'chegar', lugar: 'brasas_moltres', r: 3, texto: 'Chegue à ilha de obsidiana no meio do lago de lava da cratera',
        falas: ['A ilha de obsidiana está quente sob os seus pés.', 'O ar tremula, e uma sombra de asas abertas cobre o céu.'] },
      { tipo: 'vencer', alfa: { dex: 146, nivel: 70, lugar: 'brasas_moltres', golpes: ['fireBlast', 'airSlash', 'heatWave', 'hurricane'], aviso: 'Moltres abre as asas sobre a cratera!' },
        texto: 'Enfrente (ou capture) Moltres' },
    ],
    recompensa: { itens: [['pena_brasa', 1], ['maxRevive', 2]], dinheiro: 4000 },
  },
  {
    id: 'sq_volcanion', titulo: 'O vapor da ilhota', regiao: 'Ilhota Fumegante', de: 'faroleiro_tobias',
    requer: { insignias: 6 },
    resumo: 'O Faroleiro Tobias vê, toda noite, vapor subindo de uma ilhota ao sul que ninguém alcança.',
    oferta: ['Toda noite eu vejo, do alto do farol, uma coluna de vapor subindo ao sul, no meio do Mar das Brasas.', 'É a Ilhota Fumegante. Penhascos em volta, nem uma praia. Só chega quem voa. Vai lá ver o que mora nela?'],
    aceita: ['Siga para o sudeste, bem além do vulcão. Procure o vapor.'],
    lembrete: ['A Ilhota Fumegante fica ao sudeste do vulcão, no Mar das Brasas. Só se chega voando.'],
    etapas: [
      { tipo: 'chegar', lugar: 'brasas_volcanion', r: 4, texto: 'Pouse na Ilhota Fumegante (só se chega voando)',
        falas: ['A ilhota é um caldeirão de fontes quentes. No meio da maior, algo pequeno e raivoso solta vapor pelos braços.'] },
      { tipo: 'vencer', alfa: { dex: 721, nivel: 60, lugar: 'brasas_volcanion', golpes: ['steamEruption', 'flamethrower', 'hydroPump', 'earthPower'], aviso: 'Volcanion sopra um jato de vapor!' },
        texto: 'Enfrente (ou capture) Volcanion' },
    ],
    recompensa: { itens: [['maxRevive', 1]], dinheiro: 3000 },
  },
  {
    id: 'sq_tapu_lele', titulo: 'O canto do morro', regiao: 'Ilha do Basalto', de: 'pescador_gaudencio',
    requer: { insignias: 5 },
    resumo: 'Gaudêncio escuta, de noite, um canto fino vindo do morro florido da ilha.',
    oferta: ['Às vezes escuto um canto fino, de madrugada, vindo do morro das flores. Quem canta, canta bonito, mas nunca vi a cara.', 'Os antigos diziam que é um guardião da ilha. Será que você consegue vê-lo?'],
    aceita: ['Vá ao morro, à noite, e escute com paciência.'],
    lembrete: ['O morro das flores fica no norte da ilha, perto da clareira de estátuas. Vá à noite.'],
    etapas: [
      { tipo: 'chegar', lugar: 'brasas_tapu', r: 4, se: { hora: 'noite' }, texto: 'À noite, vá à clareira das estátuas, no morro florido da Ilha do Basalto',
        falas: ['As estátuas parecem observar. O canto fino começa, doce, vindo do alto.', 'Uma luz cor-de-rosa rodopia por cima do altar e desce.'] },
      { tipo: 'vencer', alfa: { dex: 786, nivel: 60, lugar: 'brasas_tapu', hora: 'noite', golpes: ['moonblast', 'psychic', 'dazzlingGleam', 'drainingKiss'], aviso: 'Tapu Lele desce do alto do morro!' },
        texto: 'Enfrente (ou capture) o guardião da ilha' },
    ],
    recompensa: { itens: [['bigPearl', 2]], dinheiro: 3000 },
  },
  {
    id: 'sq_perolas_negras', titulo: 'Pérolas negras', regiao: 'Ilha do Basalto', de: 'basalto_catador',
    resumo: 'Marlene coleciona pérolas negras da Ilha do Basalto e pede três pérolas comuns para fazer um colar.',
    oferta: ['Faço colares com as pérolas da ilha, mas o fio precisa de três pérolas comuns, branquinhas, para dar contraste.', 'Me traz três? Eu troco por uma pérola negra, a melhor que eu tiver.'],
    aceita: ['Pode trazer quando tiver. O mar está sempre dando.'],
    lembrete: ['Três Pérolas comuns, branquinhas, para o colar da Marlene.'],
    etapas: [
      { tipo: 'entregar', npc: 'basalto_catador', item: 'pearl', n: 3, texto: 'Leve 3 Pérolas à Catadora Marlene, na Ilha do Basalto',
        pergunta: ['Trouxe as pérolas?'], falta: ['Ainda faltam pérolas. Procure nas poças da maré.'],
        falas: ['Perfeitas! O colar vai ficar um sonho, preto e branco.', 'Tome, esta pérola negra é a melhor que eu tinha.'] },
    ],
    recompensa: { itens: [['bigPearl', 1]], dinheiro: 600 },
  },
];

export const NPCS = {
  dra_lava: {
    falas: [
      { se: { missoes: ['sq_heatran'] }, linhas: ['Heatran existe! E o sismógrafo continua a contar a história dele. Agora o vulcão ronca como quem ressona.'] },
      { se: { missoes: ['sq_sismografo'] }, linhas: ['Os sensores continuam mandando dados. O Tição está mais calmo, mas ainda me preocupa.'] },
      { se: { missoes: ['sq_camerupt'] }, linhas: ['Os Campos de Cinza voltaram a ser seguros. Agora preciso entender o que acorda o vulcão.'] },
      { linhas: ['Sou a Dra. Lava, vulcanóloga. Estudo o Tição desde que ele começou a roncar.', 'Os tremores aumentam. Se achar algum sinal estranho, venha me contar.'] },
    ],
  },
  ferreiro_brasao: {
    reage: { especie: { 935: ['Um Charcadet! Esse pequeno tem olho de quem já decidiu qual armadura quer.'], 936: ['Uma Armarouge! A armadura Auspiciosa nunca ficou tão bem.'], 937: ['Um Ceruledge! A Maliciosa tem lâmina própria, e ele sabe usar.'] } },
  },
  dona_vapor: {
    reage: { tipo: { fire: ['Pokémon de fogo adora o vapor da pousada. Ficam o dia inteiro aqui na fenda.'], water: ['Um Pokémon de água! Quente demais para ele, mas ele aguenta a cortesia.'] } },
  },
  dona_hana: {
    reage: { especie: { 79: ['Um Slowpoke! Os das fontes têm primos de Galar, de óculos e tudo.'], 80: ['Um Slowbro! Ele deve conhecer meu banho melhor do que eu.'] } },
  },
  faroleiro_tobias: {
    falas: [
      { se: { missoes: ['sq_volcanion'] }, linhas: ['Hoje o vapor ao sul está mais fraco. Quem sabe agora ele durma.'] },
      { linhas: ['Acendo a luz todas as noites para os barcos. De longe, o vulcão parece outro farol, mas esse não obedece ninguém.'] },
    ],
  },
  pescador_gaudencio: {
    diario: { sorteio: [['oranBerry', 2], ['pechaBerry', 2], ['cheriBerry', 2]], falas: ['Peguei muita fruta no mato da ilha. Leve algumas.'], depois: ['Volte amanhã, a árvore dá de novo.'] },
  },
};
