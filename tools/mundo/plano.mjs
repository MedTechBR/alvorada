// Plano do mundo ampliado de Alvorada (mundo aberto). Fonte dos dados de docs/mundo-expandido.json e da distribuição
// de src/data/habitats.js; o gerador é tools/gerar-mundo.mjs (rode `node tools/gerar-mundo.mjs` depois de editar).
//
// Coordenadas em blocos de 16 px, x para a direita e y para baixo, como em assets/maps/alvorada.json.
// Mundo aberto: nada fecha por capítulo ou insígnia. O que separa os lugares é o terreno (água, paredão, céu, neve
// funda, redemoinho) e as montarias, que se liberam ao ter um Pokémon capaz daquele modo. A dificuldade de cada lugar
// sai do CUSTO de chegar lá a partir da Vila Alvorada (ver CUSTO e CURVA abaixo), não de uma ordem da história.

export const ORIGEM = { mundo: 'alvorada', x: 297, y: 347, nome: 'Vila Alvorada (casa do jogador)' };

// Custo extra, em blocos equivalentes, de cada exigência de terreno. Somado à distância de caminho.
export const CUSTO = {
  correr: 30,      // lama funda, areia fofa, tocos (Mudbray e afins)
  nadar: 60,       // água profunda (Lapras e afins)
  escalar: 200,    // paredão com trepadeira ou rachadura, paredes de gelo (Sneasler e afins)
  voar: 300,       // só se chega pelo ar (picos, ilhas sem praia)
  mergulhar: 300,  // redemoinho escuro (Mantine e afins)
  neve: 200,       // neve funda (Wyrdeer e afins)
  escondido: 150,  // lugar secreto, sem placa nem trilha
  andar: 80,       // cada andar abaixo da entrada de uma dungeon
  navio: 1700,     // travessia até o continente do Ocaso (a partir do Terminal de Cidade Coral)
};
export const SINUOSIDADE = 1.25; // caminho real ≈ 1,25 × linha reta dentro das regiões ainda não desenhadas

// Curva de dificuldade: custo (blocos) -> nível médio dos selvagens. Faixa de uma área = média ± 2.
export const CURVA = [[0, 2], [100, 7], [200, 14], [300, 20], [450, 26], [600, 31], [800, 36], [1000, 41], [1300, 47],
  [1700, 54], [2200, 62], [2800, 71], [3500, 80]];
export const LARGURA_FAIXA = 2;  // nível médio ± 2
export const TOLERANCIA = 4;     // diferença aceita entre a faixa declarada (mapa ou plano) e a do modelo

// ------------------------------------------------------------------------------------------------ mundos e regiões
export const MUNDOS = {
  alvorada: {
    nome: 'Continente de Alvorada', arquivo: 'assets/maps/alvorada.json', w: 1200, outdoorH: 960, h: 2080,
    nota: 'Um arquivo só (com include de um arquivo por região). Hoje: 600 x 480 externos + interiores em y 480-675.',
  },
  ocaso: {
    nome: 'Terras do Ocaso', arquivo: 'assets/maps/ocaso.json', w: 960, outdoorH: 720, h: 1040,
    nota: 'Outro continente, a oeste, além do Mar do Poente. Arquivo próprio, carregado ao chegar de navio ou voando.',
  },
};

// Retângulos de construção [x, y, w, h], sem sobreposição. Cada região é um arquivo de mapa próprio (include) e só
// pinta dentro do próprio retângulo; os interiores de cada região ficam na faixa dela, abaixo de outdoorH.
export const REGIOES = [
  { id: 'nucleo', mundo: 'alvorada', nome: 'Núcleo de Alvorada', rect: [0, 0, 600, 480], interiores: [0, 960, 1200, 320],
    arquivo: 'assets/maps/alvorada.json (+ esboco.json)', estado: 'desenhado (capítulos 1 a 6); falta o resto do esboço',
    resumo: 'A região da história: Campos de Lúmen, Bosque, Lago Espelho, Costa Coral, Brejo, Aurora, Paredão, Planalto e Zênite.' },
  { id: 'geada', mundo: 'alvorada', nome: 'Cordilheira Geada', rect: [600, 0, 600, 200], interiores: [0, 1280, 1200, 160],
    arquivo: 'assets/maps/regioes/geada.json', estado: 'planejado',
    resumo: 'O Planalto dos Ventos sobe para leste até virar neve: passo ventoso, vila de pescadores de gelo, lago congelado, geleira, caverna de gelo e um fiorde.' },
  { id: 'sertao', mundo: 'alvorada', nome: 'Sertão do Levante', rect: [600, 200, 600, 280], interiores: [0, 1440, 1200, 160],
    arquivo: 'assets/maps/regioes/sertao.json', estado: 'planejado',
    resumo: 'A leste de Cidade Aurora: caatinga, lajedos, cânion vermelho, dunas douradas, oásis de buritis e, no litoral sul, o Mangue do Siri.' },
  { id: 'jandaia', mundo: 'alvorada', nome: 'Arquipélago das Jandaias', rect: [0, 480, 400, 480], interiores: [0, 1600, 1200, 160],
    arquivo: 'assets/maps/regioes/jandaia.json', estado: 'planejado',
    resumo: 'Mar do Sul a sudoeste: ilha tropical com vila e creche, ilhas gêmeas, a Ilha da Selva Grande com cachoeira e templo, e uma ilhota que só aparece na lua cheia.' },
  { id: 'austral', mundo: 'alvorada', nome: 'Mar do Sul e Ilhas Austrais', rect: [400, 480, 400, 480], interiores: [0, 1760, 1200, 160],
    arquivo: 'assets/maps/regioes/austral.json', estado: 'planejado',
    resumo: 'Mar aberto ao sul: Recife Grande para mergulho, a Ilha do Farol Morto com um templo afundado, a Fossa Abissal e, no extremo sul, as ilhas geladas.' },
  { id: 'brasas', mundo: 'alvorada', nome: 'Arquipélago das Brasas', rect: [800, 480, 400, 480], interiores: [0, 1920, 1200, 160],
    arquivo: 'assets/maps/regioes/brasas.json', estado: 'planejado',
    resumo: 'Ilhas vulcânicas a sudeste: praia de areia preta, vila de fontes termais, campos de cinza, o Vulcão Tição com o Templo da Chama e uma ilhota que solta fumaça.' },
  { id: 'poente_leste', mundo: 'ocaso', nome: 'Ocaso Leste: Pampa e Pantanal', rect: [480, 0, 480, 720], interiores: [0, 720, 960, 160],
    arquivo: 'assets/maps/ocaso/leste.json', estado: 'planejado',
    resumo: 'Onde o navio chega: Porto Rubro, coxilhas do pampa, o Pantanal alagado, as Cataratas do Trovão, o delta das garças e a Cidadela do Poente.' },
  { id: 'poente_oeste', mundo: 'ocaso', nome: 'Ocaso Oeste: Cordilheira e Desertos', rect: [0, 0, 480, 720], interiores: [0, 880, 960, 160],
    arquivo: 'assets/maps/ocaso/oeste.json', estado: 'planejado',
    resumo: 'O teto do mundo: cordilheira com vulcão, altiplano, salar branco, o Deserto do Silêncio com a Cratera do Tempo e os campos de gelo do sul.' },
];

// ------------------------------------------------------------------------------------------------ passagens
// Divisas combinadas dos dois lados. `celulas`: [x0, y0, x1, y1] inclusivo; os dois arquivos pintam exatamente essas
// células com `terreno` e deixam 4 blocos livres de cada lado. Nas divisas de mar, quem estiver dos dois lados pinta
// água funda (deep) nas 4 linhas ou colunas vizinhas, salvo onde uma passagem diga outra coisa.
export const PASSAGENS = [
  { id: 'p_uivo', nome: 'Passo do Uivo (Rota 9 -> Rota 15)', entre: ['nucleo', 'geada'], celulas: [599, 66, 600, 77], terreno: 'path',
    lados: { nucleo: 'estender a trilha da Rota 9 do Mirante (516, 72) até (599, 72), largura 6; a borda leste do planalto já é capim',
      geada: 'Rota 15 começa em (600, 66-77) com trilha de 6 blocos e cata-ventos de pedra' }, exige: [], custoCelula: [597, 71] },
  { id: 'p_sertao', nome: 'Estrada do Sertão (Cidade Aurora -> Rota 14)', entre: ['nucleo', 'sertao'], celulas: [598, 200, 600, 207], terreno: 'path',
    lados: { nucleo: 'abrir a borda de mata (op border 125) em x 598-599, y 200-207 e ligar o portão leste de Aurora (553, 186) a (599, 203) com estrada de terra e uma passagem de nível na ferrovia',
      sertao: 'Rota 14 entra em (600, 200-207); porteira de madeira e placa "Sertão do Levante"' }, exige: [], custoCelula: [597, 203] },
  { id: 'p_siri', nome: 'Costa do Siri (mar entre a Costa Coral e o Mangue)', entre: ['nucleo', 'sertao'], celulas: [598, 416, 600, 477], terreno: 'deep',
    lados: { nucleo: 'pintar deep em x 598-599, y 416-477 (hoje é a borda de mata)', sertao: 'água funda em x 600-603, y 416-477, abrindo para o mangue' },
    exige: ['nadar'], custoCelula: [597, 440] },
  { id: 'p_sul', nome: 'Mar do Sul (toda a costa sul do núcleo)', entre: ['nucleo', 'jandaia', 'austral'], celulas: [2, 478, 597, 480], terreno: 'deep',
    lados: { nucleo: 'pintar deep em y 478-479, x 2-597 (hoje é a borda de mata)', jandaia: 'deep em y 480-483, x 0-399', austral: 'deep em y 480-483, x 400-599' },
    exige: ['nadar'], custoLinha: { y: 477, x0: 2, x1: 597 } },
  { id: 'p_r2_r1_terra', nome: 'Desfiladeiro Branco (Chapada Vermelha -> Geleira)', entre: ['sertao', 'geada'], celulas: [1020, 199, 1031, 200], terreno: 'climb',
    lados: { sertao: 'paredão com trepadeira em x 1020-1031, y 200-215 subindo da Chapada Vermelha', geada: 'trilha de neve em x 1020-1031, y 184-199 até a Geleira do Uivo' }, exige: ['escalar'] },
  { id: 'p_r2_r1_mar', nome: 'Mar do Levante (costa leste)', entre: ['sertao', 'geada'], celulas: [1140, 199, 1199, 200], terreno: 'deep',
    lados: { sertao: 'mar do levante em x 1140-1199', geada: 'fiorde em x 1140-1199' }, exige: ['nadar'] },
  { id: 'p_r2_r4', nome: 'Saída sul do Mangue', entre: ['sertao', 'austral'], celulas: [600, 479, 799, 480], terreno: 'deep', exige: ['nadar'],
    lados: { sertao: 'deep em y 476-479, x 600-799', austral: 'deep em y 480-483, x 600-799' } },
  { id: 'p_r2_r5', nome: 'Rota Marítima 19 (Praia do Levante -> Brasas)', entre: ['sertao', 'brasas'], celulas: [800, 479, 1199, 480], terreno: 'deep', exige: ['nadar'],
    lados: { sertao: 'deep em y 476-479, x 800-1199; boias em x 900-940', brasas: 'deep em y 480-483, x 800-1199' } },
  { id: 'p_r3_r4', nome: 'Mar entre Jandaias e Recife', entre: ['jandaia', 'austral'], celulas: [399, 480, 400, 959], terreno: 'deep', exige: ['nadar'],
    lados: { jandaia: 'deep em x 396-399', austral: 'deep em x 400-403' } },
  { id: 'p_r4_r5', nome: 'Mar entre Recife e Brasas', entre: ['austral', 'brasas'], celulas: [799, 480, 800, 959], terreno: 'deep', exige: ['nadar'],
    lados: { austral: 'deep em x 796-799', brasas: 'deep em x 800-803' } },
  { id: 'p_ocaso_leste', nome: 'Divisa interna do Ocaso (Pampa -> Altiplano)', entre: ['poente_leste', 'poente_oeste'], celulas: [479, 300, 480, 315], terreno: 'path', exige: [],
    lados: { poente_leste: 'estrada das tropas sobe do Pampa em (480, 300-315)', poente_oeste: 'Rota O-6 começa em (479, 300-315)' } },
  { id: 'p_ocaso_rio', nome: 'Rio do Poente (Pantanal -> Salar)', entre: ['poente_leste', 'poente_oeste'], celulas: [479, 120, 480, 160], terreno: 'deep', exige: ['nadar'],
    lados: { poente_leste: 'rio largo do Pantanal', poente_oeste: 'rio que desce da cordilheira' } },
  { id: 'p_ocaso_sul', nome: 'Costa austral do Ocaso', entre: ['poente_leste', 'poente_oeste'], celulas: [479, 600, 480, 719], terreno: 'deep', exige: ['nadar'],
    lados: { poente_leste: 'mar do delta', poente_oeste: 'mar dos campos de gelo' } },
];

// ------------------------------------------------------------------------------------------------ viagens
export const VIAGENS = {
  balsas: [
    { id: 'balsa_jandaia', nome: 'Balsa Coral–Jandaia', de: 'cidade_coral', para: 'vila_jandaia', horarios: ['8h', '13h', '18h'], preco: 300, duracao: 'uma cena de 20 s com o mar passando' },
    { id: 'balsa_brasas', nome: 'Barco das Brasas', de: 'vila_siri', para: 'vila_termas', horarios: ['7h', '15h'], preco: 500, nota: 'parada na Ilha do Basalto às 15h' },
    { id: 'balsa_austral', nome: 'Navio de Pesquisa Austral', de: 'cidade_coral', para: 'estacao_austral', horarios: ['10h (seg, qua, sex)'], preco: 800, nota: 'passa pelo Recife Grande e pela Ilha do Farol Morto' },
    { id: 'balsa_veu', nome: 'Bote do Seu Nestor', de: 'porto_espelho', para: 'ilha_veu', horarios: ['ao pedir, de dia'], preco: 0 },
    { id: 'navio_ocaso', nome: 'Cargueiro Estrela-d’Alva (do Capitão Ivo)', de: 'cidade_coral', para: 'porto_rubro', horarios: ['10h', '22h'], preco: 0,
      nota: 'o pai do jogador comanda o cargueiro; a travessia é uma cena de noite no convés. Antes de o pai voltar, um mestre de navio mercante faz a rota por ₽2000.' },
  ],
  trem: { nome: 'Trem da Aurora', estacoes: ['estacao_lamparina (Vila Lamparina)', 'estacao_aurora (Cidade Aurora)', 'estacao_mandacaru (Vila Mandacaru)'],
    nota: 'trem animado na ferrovia da Rota 6 e da Rota 14: passa de 10 em 10 minutos de jogo; viagem rápida entre as três estações por ₽200.' },
  voo: { nome: 'Ninhos de pouso', regra: 'Voar leva a qualquer Ninho já visitado. Cada cidade e vila tem um Ninho; dungeons de ilha também. Entre continentes, só depois de chegar uma vez de navio.' },
  mergulho: { regra: 'Redemoinhos escuros levam a mapas submersos (interiores com bioma recife ou abismo): Recife Afundado, Recife Grande, Gruta da Maré (fundo), Santuário do Crepúsculo, Templo das Marés, Fossa Abissal.' },
};

// ------------------------------------------------------------------------------------------------ áreas
// Campos: id, nome, mundo, regiao, bioma, rect (externas), tipo, mapa ('existe' = já está em alvorada.json ou no esboço),
// via (passagens para as áreas ainda não desenhadas), acesso (exigências de terreno próprias), escondido, andar,
// extra (custo a mais, com motivo), selvagem: false para cidades.
// Interiores (andares de dungeon) usam `entrada` (área de onde se entra) e `andar` (1 = primeiro andar).
const A = (o) => ({ mundo: 'alvorada', tipo: 'area', ...o });
const O = (o) => ({ mundo: 'ocaso', tipo: 'area', ...o });

export const AREAS = [
  // ---------------- núcleo: o que já existe (ids do mapa; os sem id ganham um aqui)
  A({ id: 'vila_alvorada', nome: 'Vila Alvorada', regiao: 'nucleo', bioma: 'vila', rect: [285, 333, 44, 36], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'rota1', nome: 'Rota 1, Campos de Lúmen', regiao: 'nucleo', bioma: 'campo', rect: [180, 318, 106, 56], tipo: 'rota', mapa: 'existe', idNovo: true }),
  A({ id: 'campos_norte', nome: 'Campos ao norte da Rota 1', regiao: 'nucleo', bioma: 'campo', rect: [140, 276, 170, 48], mapa: 'existe', idNovo: true }),
  A({ id: 'lagoa_dourada', nome: 'Lagoa Dourada', regiao: 'nucleo', bioma: 'margem', rect: [202, 299, 23, 21], mapa: 'existe', escondido: true }),
  A({ id: 'cidade_campina', nome: 'Cidade Campina', regiao: 'nucleo', bioma: 'vila', rect: [116, 334, 64, 64], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'fazenda_tome', nome: 'Fazenda do Tomé', regiao: 'nucleo', bioma: 'vila', rect: [94, 298, 31, 23], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'rota2', nome: 'Rota 2, Trilha das Paineiras', regiao: 'nucleo', bioma: 'floresta', rect: [94, 262, 44, 36], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'bosque_sussurrante', nome: 'Bosque Sussurrante', regiao: 'nucleo', bioma: 'floresta', rect: [60, 168, 252, 108], mapa: 'existe' }),
  A({ id: 'toca_absol', nome: 'Toca do Absol (Gruta do Musgo)', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', mapa: 'existe', interior: true, entrada: 'bosque_sussurrante', andar: 1 }),
  A({ id: 'vila_sussurro', nome: 'Vila Sussurro', regiao: 'nucleo', bioma: 'vila', rect: [162, 231, 21, 17], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'mata_jequitibas', nome: 'Mata dos Jequitibás', regiao: 'nucleo', bioma: 'floresta', rect: [12, 168, 42, 36], mapa: 'existe', acesso: ['correr'], escondido: true }),
  A({ id: 'rota3', nome: 'Rota 3, Margem das Garças', regiao: 'nucleo', bioma: 'margem', rect: [329, 326, 104, 40], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'porto_espelho', nome: 'Porto Espelho', regiao: 'nucleo', bioma: 'vila', rect: [414, 290, 38, 48], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'lago_espelho', nome: 'Lago Espelho', regiao: 'nucleo', bioma: 'margem', rect: [396, 216, 168, 92], mapa: 'existe' }),
  A({ id: 'manguezal', nome: 'Campos do Manguezal', regiao: 'nucleo', bioma: 'campo', rect: [372, 324, 64, 44], mapa: 'existe' }),
  A({ id: 'rota4', nome: 'Rota 4, Rio Lúmen', regiao: 'nucleo', bioma: 'margem', rect: [436, 324, 44, 50], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'restinga', nome: 'Restinga', regiao: 'nucleo', bioma: 'praia', rect: [400, 370, 50, 16], mapa: 'existe' }),
  A({ id: 'praia_corais', nome: 'Praia dos Corais', regiao: 'nucleo', bioma: 'praia', rect: [401, 386, 49, 28], mapa: 'existe' }),
  A({ id: 'praia_oeste', nome: 'Praia Oeste', regiao: 'nucleo', bioma: 'praia', rect: [238, 370, 62, 44], mapa: 'existe' }),
  A({ id: 'cidade_coral', nome: 'Cidade Coral', regiao: 'nucleo', bioma: 'vila', rect: [300, 370, 86, 44], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'gruta_mare', nome: 'Gruta da Maré', regiao: 'nucleo', bioma: 'caverna', rect: [252, 396, 18, 12], tipo: 'dungeon', mapa: 'existe', pendente: true }),
  A({ id: 'gruta_mare_2', nome: 'Gruta da Maré — Galeria das Conchas', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', interior: true, entrada: 'gruta_mare', andar: 1 }),
  A({ id: 'gruta_mare_fundo', nome: 'Gruta da Maré — Câmara Submersa', regiao: 'nucleo', bioma: 'recife', tipo: 'dungeon', interior: true, entrada: 'gruta_mare', andar: 2, acesso: ['mergulhar'] }),
  A({ id: 'ilhas_coral', nome: 'Ilhas Coral', regiao: 'nucleo', bioma: 'praia', rect: [132, 420, 72, 24], mapa: 'existe', pendente: true }),
  A({ id: 'rota13', nome: 'Rota Marítima 13', regiao: 'nucleo', bioma: 'mar', rect: [120, 420, 480, 56], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'recife_afundado', nome: 'Recife Afundado', regiao: 'nucleo', bioma: 'recife', rect: [240, 432, 24, 18], mapa: 'existe', acesso: ['mergulhar'], pendente: true }),
  A({ id: 'rota5', nome: 'Rota 5, Brejo das Lamparinas', regiao: 'nucleo', bioma: 'brejo', rect: [312, 232, 101, 55], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'vila_lamparina', nome: 'Vila Lamparina', regiao: 'nucleo', bioma: 'vila', rect: [312, 206, 45, 26], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'cemiterio_velas', nome: 'Cemitério das Velas', regiao: 'nucleo', bioma: 'floresta', rect: [315, 190, 38, 16], mapa: 'existe' }),
  A({ id: 'rota6', nome: 'Rota 6, Ferrovia da Aurora', regiao: 'nucleo', bioma: 'campo', rect: [356, 168, 120, 46], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'cidade_aurora', nome: 'Cidade Aurora', regiao: 'nucleo', bioma: 'vila', rect: [476, 160, 77, 52], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'mina_aurora', nome: 'Pé do Paredão (Mina Aurora)', regiao: 'nucleo', bioma: 'planalto', rect: [380, 144, 32, 6], mapa: 'existe' }),
  A({ id: 'mina_aurora_n1', nome: 'Mina Aurora — Nível 1', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', mapa: 'existe', interior: true, entrada: 'mina_aurora', andar: 1 }),
  A({ id: 'mina_aurora_n2', nome: 'Mina Aurora — Nível 2', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', mapa: 'existe', interior: true, entrada: 'mina_aurora', andar: 2 }),
  A({ id: 'mina_aurora_n3', nome: 'Mina Aurora — Nível 3', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', mapa: 'existe', interior: true, entrada: 'mina_aurora', andar: 3 }),
  A({ id: 'mina_aurora_n4', nome: 'Mina Aurora — Nível 4', regiao: 'nucleo', bioma: 'cristal', tipo: 'dungeon', mapa: 'existe', interior: true, entrada: 'mina_aurora', andar: 4 }),
  A({ id: 'mina_abandonada', nome: 'Mina Abandonada (Nível 5)', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', interior: true, entrada: 'mina_aurora', andar: 5, escondido: true }),
  A({ id: 'rota7', nome: 'Rota 7, Ravina do Rochedo', regiao: 'nucleo', bioma: 'canion', rect: [300, 150, 156, 18], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'forte_rochedo', nome: 'Forte Rochedo', regiao: 'nucleo', bioma: 'vila', rect: [264, 156, 42, 24], tipo: 'cidade', mapa: 'existe', selvagem: false, pendente: true, custoManual: 320 }),
  A({ id: 'paredao', nome: 'Paredão', regiao: 'nucleo', bioma: 'planalto', rect: [48, 132, 528, 12], mapa: 'existe' }),
  A({ id: 'rota8', nome: 'Rota 8, Escalada do Paredão', regiao: 'nucleo', bioma: 'planalto', rect: [156, 96, 60, 48], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'planalto_ventos', nome: 'Planalto dos Ventos', regiao: 'nucleo', bioma: 'planalto', rect: [0, 12, 600, 108], mapa: 'existe' }),
  A({ id: 'cidade_escarpa', nome: 'Cidade Escarpa', regiao: 'nucleo', bioma: 'vila', rect: [132, 84, 42, 30], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'rota9', nome: 'Rota 9, Estepe dos Ventos', regiao: 'nucleo', bioma: 'planalto', rect: [168, 48, 348, 48], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'mirante_ventos', nome: 'Mirante dos Ventos', regiao: 'nucleo', bioma: 'vila', rect: [516, 24, 42, 24], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'ruinas_vigias', nome: 'Ruínas dos Vigias', regiao: 'nucleo', bioma: 'ruina', rect: [216, 36, 24, 18], tipo: 'dungeon', mapa: 'existe', escondido: true }),
  A({ id: 'ruinas_vigias_sub', nome: 'Ruínas dos Vigias — Sala dos Murais', regiao: 'nucleo', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'ruinas_vigias', andar: 1 }),
  A({ id: 'rota10', nome: 'Rota 10, Águas do Véu', regiao: 'nucleo', bioma: 'margem', rect: [444, 240, 84, 60], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'ilha_veu', nome: 'Ilha do Véu', regiao: 'nucleo', bioma: 'praia', rect: [504, 240, 24, 18], mapa: 'existe', escondido: true }),
  A({ id: 'santuario_crepusculo', nome: 'Santuário do Crepúsculo', regiao: 'nucleo', bioma: 'recife', rect: [480, 264, 18, 18], tipo: 'dungeon', mapa: 'existe', acesso: ['mergulhar'] }),
  A({ id: 'rota11', nome: 'Rota 11, Escadaria dos Vigias', regiao: 'nucleo', bioma: 'ruina', rect: [276, 72, 24, 36], tipo: 'rota', mapa: 'existe' }),
  A({ id: 'relogio_pedra', nome: 'Relógio de Pedra', regiao: 'nucleo', bioma: 'vila', rect: [288, 60, 24, 24], mapa: 'existe', selvagem: false }),
  A({ id: 'fenda_prismatica', nome: 'Fenda Prismática', regiao: 'nucleo', bioma: 'cristal', rect: [288, 72, 18, 18], tipo: 'dungeon', mapa: 'existe', escondido: true, extra: 700, motivo: 'covil do Necrozma; só se desce depois da trama principal (8 insígnias e o Relógio)' }),
  A({ id: 'fenda_prismatica_3', nome: 'Fenda Prismática — Salão dos Espelhos', regiao: 'nucleo', bioma: 'cristal', tipo: 'dungeon', interior: true, entrada: 'fenda_prismatica', andar: 3 }),
  A({ id: 'rota12', nome: 'Rota 12, Caminho do Zênite', regiao: 'nucleo', bioma: 'pico', rect: [276, 12, 36, 48], tipo: 'rota', mapa: 'existe', extra: 450, motivo: 'estrada da vitória: só a usa quem tem 8 insígnias; nível próximo da Liga' }),
  A({ id: 'caminho_zenite', nome: 'Caminho do Zênite — Caverna', regiao: 'nucleo', bioma: 'caverna', tipo: 'dungeon', interior: true, entrada: 'rota12', andar: 1 }),
  A({ id: 'liga_zenite', nome: 'Liga Alvorada (Cidadela do Zênite)', regiao: 'nucleo', bioma: 'vila', rect: [288, 0, 36, 18], tipo: 'cidade', mapa: 'existe', selvagem: false }),
  A({ id: 'pico_geada', nome: 'Pico Geada', regiao: 'nucleo', bioma: 'neve', rect: [24, 0, 36, 24], mapa: 'existe', escondido: true, acesso: ['neve'] }),
  A({ id: 'ilha_sol_nascente', nome: 'Ilha do Sol Nascente', regiao: 'nucleo', bioma: 'vulcao', rect: [576, 384, 24, 24], mapa: 'existe', escondido: true, extra: 600, motivo: 'só aparece seguindo o rastro de luz do Solgaleo de madrugada' }),

  // ---------------- R1 Cordilheira Geada
  A({ id: 'rota15', nome: 'Rota 15, Passo do Uivo', regiao: 'geada', bioma: 'planalto', rect: [600, 40, 160, 70], tipo: 'rota', via: ['p_uivo'] }),
  A({ id: 'vila_geada', nome: 'Vila Geada', regiao: 'geada', bioma: 'vila', rect: [760, 100, 60, 50], tipo: 'cidade', via: ['p_uivo'], selvagem: false }),
  A({ id: 'lago_congelado', nome: 'Lago Congelado', regiao: 'geada', bioma: 'gelo', rect: [680, 120, 80, 70], via: ['p_uivo'] }),
  A({ id: 'rota16', nome: 'Rota 16, Campos Nevados', regiao: 'geada', bioma: 'neve', rect: [820, 80, 160, 90], tipo: 'rota', via: ['p_uivo'] }),
  A({ id: 'geleira_uivo', nome: 'Geleira do Uivo', regiao: 'geada', bioma: 'neve', rect: [980, 20, 160, 160], via: ['p_uivo'], acesso: ['escalar'] }),
  A({ id: 'caverna_gelo_1', nome: 'Caverna de Gelo Cristalino — Saguão', regiao: 'geada', bioma: 'gelo', tipo: 'dungeon', interior: true, entrada: 'geleira_uivo', andar: 1 }),
  A({ id: 'caverna_gelo_2', nome: 'Caverna de Gelo Cristalino — Rio Congelado', regiao: 'geada', bioma: 'gelo', tipo: 'dungeon', interior: true, entrada: 'geleira_uivo', andar: 2 }),
  A({ id: 'caverna_gelo_3', nome: 'Caverna de Gelo Cristalino — Coração Azul', regiao: 'geada', bioma: 'gelo', tipo: 'dungeon', interior: true, entrada: 'geleira_uivo', andar: 3 }),
  A({ id: 'cume_vento_branco', nome: 'Cume do Vento Branco', regiao: 'geada', bioma: 'pico', rect: [1040, 0, 100, 20], via: ['p_uivo'], acesso: ['escalar', 'neve'], escondido: true }),
  A({ id: 'fiorde_levante', nome: 'Fiorde do Levante', regiao: 'geada', bioma: 'mar', rect: [1140, 0, 60, 200], via: ['p_uivo'], acesso: ['nadar'] }),

  // ---------------- R2 Sertão do Levante
  A({ id: 'rota14', nome: 'Rota 14, Estrada do Sertão', regiao: 'sertao', bioma: 'sertao', rect: [600, 200, 150, 60], tipo: 'rota', via: ['p_sertao'] }),
  A({ id: 'vila_mandacaru', nome: 'Vila Mandacaru', regiao: 'sertao', bioma: 'vila', rect: [750, 210, 60, 45], tipo: 'cidade', via: ['p_sertao'], selvagem: false }),
  A({ id: 'rota20', nome: 'Rota 20, Caatinga do Lajedo', regiao: 'sertao', bioma: 'sertao', rect: [810, 250, 170, 40], tipo: 'rota', via: ['p_sertao'] }),
  A({ id: 'canion_rio_seco', nome: 'Cânion do Rio Seco', regiao: 'sertao', bioma: 'canion', rect: [620, 270, 200, 90], via: ['p_sertao'], acesso: ['escalar'] }),
  A({ id: 'fundo_canion', nome: 'Fundo do Cânion', regiao: 'sertao', bioma: 'canion', rect: [680, 300, 110, 40], via: ['p_sertao'], acesso: ['escalar'], escondido: true }),
  A({ id: 'chapada_vermelha', nome: 'Chapada Vermelha', regiao: 'sertao', bioma: 'canion', rect: [990, 200, 150, 50], via: ['p_sertao'], acesso: ['escalar'] }),
  A({ id: 'dunas_douradas', nome: 'Dunas Douradas', regiao: 'sertao', bioma: 'deserto', rect: [860, 290, 200, 100], via: ['p_sertao'], acesso: ['correr'] }),
  A({ id: 'cratera_estrela', nome: 'Cratera da Estrela', regiao: 'sertao', bioma: 'deserto', rect: [930, 330, 30, 30], via: ['p_sertao'], acesso: ['correr'], escondido: true }),
  A({ id: 'cidade_buriti', nome: 'Cidade Buriti', regiao: 'sertao', bioma: 'vila', rect: [1000, 250, 80, 40], tipo: 'cidade', via: ['p_sertao'], selvagem: false }),
  A({ id: 'oasis_buriti', nome: 'Oásis do Buriti', regiao: 'sertao', bioma: 'margem', rect: [1080, 250, 60, 50], via: ['p_sertao'] }),
  A({ id: 'ruinas_pintada_1', nome: 'Ruínas de Pedra Pintada — Pátio das Pinturas', regiao: 'sertao', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'dunas_douradas', andar: 1 }),
  A({ id: 'ruinas_pintada_2', nome: 'Ruínas de Pedra Pintada — Galeria da Areia', regiao: 'sertao', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'dunas_douradas', andar: 2 }),
  A({ id: 'ruinas_pintada_3', nome: 'Ruínas de Pedra Pintada — Câmara do Sol', regiao: 'sertao', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'dunas_douradas', andar: 3 }),
  A({ id: 'mangue_siri', nome: 'Mangue do Siri', regiao: 'sertao', bioma: 'mangue', rect: [600, 390, 220, 86], via: ['p_siri'] }),
  A({ id: 'vila_siri', nome: 'Vila Siri', regiao: 'sertao', bioma: 'vila', rect: [690, 370, 50, 30], tipo: 'cidade', via: ['p_siri'], selvagem: false }),
  A({ id: 'praia_levante', nome: 'Praia do Levante', regiao: 'sertao', bioma: 'praia', rect: [840, 420, 240, 56], via: ['p_sertao', 'p_siri'] }),
  A({ id: 'mar_levante', nome: 'Mar do Levante', regiao: 'sertao', bioma: 'mar', rect: [1140, 200, 60, 280], via: ['p_sertao', 'p_siri'], acesso: ['nadar'] }),

  // ---------------- R3 Arquipélago das Jandaias
  A({ id: 'rota17', nome: 'Rota Marítima 17', regiao: 'jandaia', bioma: 'mar', rect: [100, 480, 200, 100], tipo: 'rota', via: ['p_sul'] }),
  A({ id: 'ilha_jandaia', nome: 'Ilha Jandaia', regiao: 'jandaia', bioma: 'praia', rect: [30, 560, 140, 90], via: ['p_sul'] }),
  A({ id: 'vila_jandaia', nome: 'Vila Jandaia', regiao: 'jandaia', bioma: 'vila', rect: [60, 590, 50, 40], tipo: 'cidade', via: ['p_sul'], selvagem: false }),
  A({ id: 'ilhas_gemeas', nome: 'Ilhas Gêmeas', regiao: 'jandaia', bioma: 'praia', rect: [230, 600, 110, 70], via: ['p_sul'] }),
  A({ id: 'mar_jandaias', nome: 'Mar das Jandaias', regiao: 'jandaia', bioma: 'mar', rect: [0, 660, 400, 300], via: ['p_sul'] }),
  A({ id: 'praia_cipo', nome: 'Praia do Cipó', regiao: 'jandaia', bioma: 'praia', rect: [150, 880, 140, 40], via: ['p_sul'] }),
  A({ id: 'selva_grande', nome: 'Selva Grande', regiao: 'jandaia', bioma: 'selva', rect: [40, 700, 250, 180], via: ['p_sul'], acesso: ['escalar'] }),
  A({ id: 'cachoeira_veu_verde', nome: 'Cachoeira do Véu Verde', regiao: 'jandaia', bioma: 'margem', rect: [180, 720, 60, 60], via: ['p_sul'], acesso: ['escalar'], escondido: true }),
  A({ id: 'templo_raizes_1', nome: 'Templo das Raízes — Átrio', regiao: 'jandaia', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'selva_grande', andar: 1 }),
  A({ id: 'templo_raizes_2', nome: 'Templo das Raízes — Galerias Inundadas', regiao: 'jandaia', bioma: 'selva', tipo: 'dungeon', interior: true, entrada: 'selva_grande', andar: 2 }),
  A({ id: 'templo_raizes_3', nome: 'Templo das Raízes — Câmara da Semente', regiao: 'jandaia', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'selva_grande', andar: 3 }),
  A({ id: 'ilha_miragem', nome: 'Ilha Miragem', regiao: 'jandaia', bioma: 'praia', rect: [330, 880, 40, 40], via: ['p_sul'], acesso: ['voar'], escondido: true }),

  // ---------------- R4 Mar do Sul e Ilhas Austrais
  A({ id: 'rota18', nome: 'Rota Marítima 18', regiao: 'austral', bioma: 'mar', rect: [400, 480, 200, 120], tipo: 'rota', via: ['p_sul'] }),
  A({ id: 'recife_grande', nome: 'Recife Grande', regiao: 'austral', bioma: 'mar', rect: [450, 600, 220, 100], via: ['p_sul'] }),
  A({ id: 'recife_grande_fundo', nome: 'Recife Grande — Fundo (mergulho)', regiao: 'austral', bioma: 'recife', tipo: 'dungeon', interior: true, entrada: 'recife_grande', andar: 1, acesso: ['mergulhar'] }),
  A({ id: 'mar_do_sul', nome: 'Mar do Sul Profundo', regiao: 'austral', bioma: 'mar', rect: [400, 700, 400, 100], via: ['p_sul'] }),
  A({ id: 'ilha_farol_morto', nome: 'Ilha do Farol Morto', regiao: 'austral', bioma: 'praia', rect: [680, 620, 80, 60], via: ['p_sul'] }),
  A({ id: 'templo_mares_1', nome: 'Templo das Marés — Nave Alta', regiao: 'austral', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'ilha_farol_morto', andar: 1 }),
  A({ id: 'templo_mares_2', nome: 'Templo das Marés — Nave Afundada', regiao: 'austral', bioma: 'recife', tipo: 'dungeon', interior: true, entrada: 'ilha_farol_morto', andar: 2, acesso: ['mergulhar'] }),
  A({ id: 'templo_mares_3', nome: 'Templo das Marés — Altar da Maré', regiao: 'austral', bioma: 'recife', tipo: 'dungeon', interior: true, entrada: 'ilha_farol_morto', andar: 3, acesso: ['mergulhar'] }),
  A({ id: 'fossa_abissal', nome: 'Fossa Abissal', regiao: 'austral', bioma: 'abismo', tipo: 'dungeon', interior: true, entrada: 'mar_do_sul', andar: 3, acesso: ['mergulhar'], escondido: true }),
  A({ id: 'ilhas_austrais', nome: 'Ilhas Austrais', regiao: 'austral', bioma: 'neve', rect: [420, 800, 380, 160], via: ['p_sul'] }),
  A({ id: 'estacao_austral', nome: 'Estação Austral', regiao: 'austral', bioma: 'vila', rect: [520, 850, 40, 30], tipo: 'cidade', via: ['p_sul'], selvagem: false }),
  A({ id: 'caverna_iceberg_1', nome: 'Caverna do Iceberg — Túnel Azul', regiao: 'austral', bioma: 'gelo', tipo: 'dungeon', interior: true, entrada: 'ilhas_austrais', andar: 1 }),
  A({ id: 'caverna_iceberg_2', nome: 'Caverna do Iceberg — Salão Polar', regiao: 'austral', bioma: 'gelo', tipo: 'dungeon', interior: true, entrada: 'ilhas_austrais', andar: 2 }),

  // ---------------- R5 Arquipélago das Brasas
  A({ id: 'rota19', nome: 'Rota Marítima 19', regiao: 'brasas', bioma: 'mar', rect: [800, 480, 400, 100], tipo: 'rota', via: ['p_siri', 'p_sul'] }),
  A({ id: 'ilha_basalto', nome: 'Ilha do Basalto', regiao: 'brasas', bioma: 'praia', rect: [840, 600, 120, 80], via: ['p_siri', 'p_sul'] }),
  A({ id: 'vila_termas', nome: 'Vila Termas', regiao: 'brasas', bioma: 'vila', rect: [960, 640, 60, 40], tipo: 'cidade', via: ['p_siri', 'p_sul'], selvagem: false }),
  A({ id: 'fontes_termais', nome: 'Fontes Termais do Vapor', regiao: 'brasas', bioma: 'termal', rect: [1020, 630, 90, 70], via: ['p_siri', 'p_sul'] }),
  A({ id: 'campos_cinza', nome: 'Campos de Cinza', regiao: 'brasas', bioma: 'vulcao', rect: [930, 700, 170, 70], via: ['p_siri', 'p_sul'] }),
  A({ id: 'vulcao_ticao', nome: 'Vulcão Tição', regiao: 'brasas', bioma: 'vulcao', rect: [990, 770, 150, 110], via: ['p_siri', 'p_sul'], acesso: ['escalar'] }),
  A({ id: 'templo_chama_1', nome: 'Templo da Chama — Portal de Basalto', regiao: 'brasas', bioma: 'vulcao', tipo: 'dungeon', interior: true, entrada: 'vulcao_ticao', andar: 1 }),
  A({ id: 'templo_chama_2', nome: 'Templo da Chama — Rio de Lava', regiao: 'brasas', bioma: 'vulcao', tipo: 'dungeon', interior: true, entrada: 'vulcao_ticao', andar: 2 }),
  A({ id: 'templo_chama_3', nome: 'Templo da Chama — Forja Antiga', regiao: 'brasas', bioma: 'vulcao', tipo: 'dungeon', interior: true, entrada: 'vulcao_ticao', andar: 3 }),
  A({ id: 'cratera_ticao', nome: 'Cratera do Tição', regiao: 'brasas', bioma: 'vulcao', rect: [1040, 800, 50, 40], via: ['p_siri', 'p_sul'], acesso: ['escalar', 'voar'], escondido: true }),
  A({ id: 'mar_brasas', nome: 'Mar das Brasas', regiao: 'brasas', bioma: 'mar', rect: [800, 880, 400, 80], via: ['p_siri', 'p_sul'] }),
  A({ id: 'ilhota_fumegante', nome: 'Ilhota Fumegante', regiao: 'brasas', bioma: 'termal', rect: [1150, 900, 40, 40], via: ['p_siri', 'p_sul'], acesso: ['voar'], escondido: true }),

  // ---------------- Ocaso Leste (porto de chegada em 880, 360)
  O({ id: 'porto_rubro', nome: 'Porto Rubro', regiao: 'poente_leste', bioma: 'vila', rect: [860, 330, 70, 60], tipo: 'cidade', selvagem: false }),
  O({ id: 'restinga_poente', nome: 'Restinga do Poente', regiao: 'poente_leste', bioma: 'praia', rect: [900, 400, 60, 320] }),
  O({ id: 'pampa_coxilhas', nome: 'Pampa das Coxilhas', regiao: 'poente_leste', bioma: 'pampa', rect: [600, 250, 260, 200] }),
  O({ id: 'estancia_ventania', nome: 'Estância Ventania', regiao: 'poente_leste', bioma: 'vila', rect: [700, 300, 50, 40], tipo: 'cidade', selvagem: false }),
  O({ id: 'pantanal', nome: 'Pantanal do Poente', regiao: 'poente_leste', bioma: 'brejo', rect: [560, 90, 300, 160], acesso: ['nadar'] }),
  O({ id: 'cataratas_trovao', nome: 'Cataratas do Trovão', regiao: 'poente_leste', bioma: 'margem', rect: [760, 0, 200, 90], acesso: ['nadar'] }),
  O({ id: 'gruta_cataratas_1', nome: 'Gruta das Cataratas — Cortina d’Água', regiao: 'poente_leste', bioma: 'caverna', tipo: 'dungeon', interior: true, entrada: 'cataratas_trovao', andar: 1 }),
  O({ id: 'gruta_cataratas_2', nome: 'Gruta das Cataratas — Abismo do Silêncio', regiao: 'poente_leste', bioma: 'caverna', tipo: 'dungeon', interior: true, entrada: 'cataratas_trovao', andar: 3, escondido: true }),
  O({ id: 'delta_garcas', nome: 'Delta das Garças Rubras', regiao: 'poente_leste', bioma: 'mangue', rect: [560, 560, 340, 160], acesso: ['nadar'] }),
  O({ id: 'cidadela_poente', nome: 'Cidadela do Poente', regiao: 'poente_leste', bioma: 'vila', rect: [760, 470, 60, 60], tipo: 'cidade', selvagem: false }),
  O({ id: 'mata_araucarias', nome: 'Mata das Araucárias', regiao: 'poente_leste', bioma: 'floresta', rect: [480, 400, 120, 160] }),

  // ---------------- Ocaso Oeste
  O({ id: 'rota_tropas', nome: 'Estrada das Tropas', regiao: 'poente_oeste', bioma: 'planalto', rect: [380, 280, 100, 60], tipo: 'rota' }),
  O({ id: 'altiplano_condor', nome: 'Altiplano do Condor', regiao: 'poente_oeste', bioma: 'planalto', rect: [200, 150, 180, 200], acesso: ['escalar'] }),
  O({ id: 'vila_altiplana', nome: 'Vila Altiplana', regiao: 'poente_oeste', bioma: 'vila', rect: [280, 230, 50, 40], tipo: 'cidade', acesso: ['escalar'], selvagem: false }),
  O({ id: 'salar_branco', nome: 'Salar Branco', regiao: 'poente_oeste', bioma: 'salar', rect: [220, 360, 240, 140] }),
  O({ id: 'mina_sal_1', nome: 'Mina de Sal — Galerias Brancas', regiao: 'poente_oeste', bioma: 'caverna', tipo: 'dungeon', interior: true, entrada: 'salar_branco', andar: 1 }),
  O({ id: 'mina_sal_2', nome: 'Mina de Sal — Poço Profundo', regiao: 'poente_oeste', bioma: 'cristal', tipo: 'dungeon', interior: true, entrada: 'salar_branco', andar: 2 }),
  O({ id: 'deserto_silencio', nome: 'Deserto do Silêncio', regiao: 'poente_oeste', bioma: 'deserto', rect: [20, 320, 200, 200], acesso: ['correr'] }),
  O({ id: 'templo_poente_1', nome: 'Templo do Poente — Escadaria do Sol', regiao: 'poente_oeste', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'deserto_silencio', andar: 1 }),
  O({ id: 'templo_poente_2', nome: 'Templo do Poente — Salão dos Dois Céus', regiao: 'poente_oeste', bioma: 'ruina', tipo: 'dungeon', interior: true, entrada: 'deserto_silencio', andar: 2 }),
  O({ id: 'cratera_tempo_1', nome: 'Cratera do Tempo — Borda', regiao: 'poente_oeste', bioma: 'cratera', tipo: 'dungeon', interior: true, entrada: 'deserto_silencio', andar: 2, escondido: true }),
  O({ id: 'cratera_tempo_2', nome: 'Cratera do Tempo — Fundo (Passado e Futuro)', regiao: 'poente_oeste', bioma: 'cratera', tipo: 'dungeon', interior: true, entrada: 'deserto_silencio', andar: 4, escondido: true }),
  O({ id: 'cordilheira_poente', nome: 'Cordilheira do Poente', regiao: 'poente_oeste', bioma: 'pico', rect: [0, 0, 200, 300], acesso: ['escalar'] }),
  O({ id: 'vulcao_sentinela', nome: 'Vulcão Sentinela', regiao: 'poente_oeste', bioma: 'vulcao', rect: [60, 40, 100, 100], acesso: ['escalar'], escondido: true }),
  O({ id: 'campos_gelo_sul', nome: 'Campos de Gelo do Sul', regiao: 'poente_oeste', bioma: 'neve', rect: [0, 520, 480, 200], acesso: ['nadar'] }),
  O({ id: 'vila_fim_mundo', nome: 'Vila Fim-do-Mundo', regiao: 'poente_oeste', bioma: 'vila', rect: [320, 600, 50, 40], tipo: 'cidade', acesso: ['nadar'], selvagem: false }),
  O({ id: 'glaciar_fim_1', nome: 'Glaciar do Fim do Mundo — Fendas', regiao: 'poente_oeste', bioma: 'gelo', tipo: 'dungeon', interior: true, entrada: 'campos_gelo_sul', andar: 1 }),
  O({ id: 'glaciar_fim_2', nome: 'Glaciar do Fim do Mundo — Mundo Avesso', regiao: 'poente_oeste', bioma: 'cristal', tipo: 'dungeon', interior: true, entrada: 'campos_gelo_sul', andar: 3, escondido: true }),
];

// Ocaso: custo = custo do Terminal de Cidade Coral + navio + caminho a partir do Porto Rubro
export const OCASO_CHEGADA = { area: 'porto_rubro', x: 895, y: 360, terminal: 'cidade_coral' };

// ------------------------------------------------------------------------------------------------ biomas
// Identidade visual (para o ramo `biomas`) e regras de encontro. `base` diz de qual bioma atual o novo herda a arte
// enquanto a arte própria não existe.
export const BIOMAS = {
  vila: { nome: 'Cidades e vilas', selvagens: false, visual: 'sem selvagens' },
  campo: { nome: 'Campos', visual: 'capim, mato alto, cercas, ipês amarelos, girassóis' },
  floresta: { nome: 'Floresta', visual: 'jequitibás, chão de folhas, raios de luz verde, cogumelos' },
  margem: { nome: 'Lagos e rios', visual: 'junco, vitória-régia, garças, píer de madeira' },
  praia: { nome: 'Praias e ilhas', visual: 'areia branca, coqueiros, piscinas naturais, conchas' },
  planalto: { nome: 'Planalto com vento', visual: 'capim que ondula, pedras soltas, cata-ventos de pedra, rajadas que empurram' },
  neve: { nome: 'Neve', base: 'planalto', visual: 'neve rala e funda, pinheiros nevados, nevasca que reduz a visão, pegadas que somem', tiles: ['snow', 'snowdeep (neve funda: Wyrdeer)', 'ice'] },
  gelo: { nome: 'Gelo e cavernas de gelo', base: 'planalto', visual: 'chão de gelo azul que escorrega até bater, estalactites, paredes de cristal translúcido', tiles: ['ice (escorrega)', 'icewall', 'crack (rachadura: cai para o andar de baixo)'] },
  vulcao: { nome: 'Vulcão e cinzas', base: 'planalto', visual: 'basalto preto, rios de lava que brilham à noite, chuva de cinza, árvores queimadas, fumarolas', tiles: ['basalt', 'lava (sólido; queima)', 'ash (cinza: pegadas)', 'magma frio (ponte criada por pedra empurrada)'] },
  termal: { nome: 'Fontes termais', base: 'margem', visual: 'piscinas que soltam vapor, terraços de calcário branco, bambus, lanternas de papel', tiles: ['hotspring (cura um pouco ao nadar)', 'travertino'] },
  sertao: { nome: 'Sertão (caatinga)', base: 'campo', visual: 'terra rachada, mandacaru, xique-xique, juazeiro, lajedos de pedra, cercas de vara', tiles: ['dirt', 'cracked', 'cactus (sólido; espinho)'] },
  canion: { nome: 'Cânion', base: 'planalto', visual: 'paredões vermelhos em camadas, leito seco de rio, pontes de corda, eco', tiles: ['redrock', 'redcliff', 'dryriver'] },
  deserto: { nome: 'Deserto e dunas', base: 'praia', visual: 'dunas douradas que mudam com o vento, oásis, tempestade de areia, miragens', tiles: ['dune (areia fofa: Correr)', 'quicksand (puxa para um andar de baixo)'] },
  salar: { nome: 'Salar', base: 'praia', visual: 'crosta branca em hexágonos, espelho d’água depois da chuva, flamingos', tiles: ['salt', 'saltmirror'] },
  mangue: { nome: 'Mangue', base: 'margem', visual: 'raízes aéreas sobre água rasa, lama com caranguejos, maré que sobe e desce (muda o caminho)', tiles: ['mud', 'roots (sólido)', 'shallow (água rasa andável)'] },
  brejo: { nome: 'Brejo e Pantanal', base: 'floresta', visual: 'névoa, pontes de tábua, árvores secas, vaga-lumes, campos alagados', tiles: ['shallow', 'reeds'] },
  selva: { nome: 'Selva', base: 'floresta', visual: 'cipós, folhas gigantes, raízes tabulares, chuva súbita, flores enormes, araras', tiles: ['jungle (mata fechada)', 'vine (Escalar)', 'bigleaf'] },
  mar: { nome: 'Mar aberto', base: 'praia', visual: 'ondas, boias, cardumes, bancos de areia, redemoinhos escuros (Mergulhar)' },
  recife: { nome: 'Recife (submerso)', base: 'margem', visual: 'luz azul que dança no fundo, corais, algas que balançam, bolhas; só se entra mergulhando', tiles: ['seabed', 'coral (sólido)', 'kelp (mato alto submerso)'] },
  abismo: { nome: 'Abismo (submerso fundo)', base: 'margem', visual: 'escuro total, só a luz da Vela Eterna e de Pokémon luminosos', tiles: ['seabed escuro'] },
  caverna: { nome: 'Caverna', base: 'planalto', visual: 'rocha, estalagmites, poças, morcegos; salas escuras precisam de luz', tiles: ['cave', 'rock', 'cavedoor'] },
  ruina: { nome: 'Ruínas e templos', base: 'planalto', visual: 'blocos de pedra esculpida, murais, colunas caídas, portas com símbolos' },
  cristal: { nome: 'Cristal (luzita e prisma)', base: 'planalto', visual: 'cristais que dividem a luz em cores, chão de espelho, veios que pulsam' },
  pico: { nome: 'Alta montanha', base: 'planalto', visual: 'rocha nua acima das nuvens, neve nos topos, vento forte' },
  pampa: { nome: 'Pampa', base: 'campo', visual: 'coxilhas verdes onduladas, taipas de pedra, umbu solitário, céu enorme ao entardecer' },
  cratera: { nome: 'Cratera do Tempo', base: 'floresta', visual: 'cratera funda com selva primitiva embaixo e instalações de metal abandonadas; o céu muda de cor' },
};
