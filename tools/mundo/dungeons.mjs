// Cavernas, templos e dungeons. Cada andar é um interior (id igual ao da área em plano.mjs, quando tem selvagens).
// Mapas resumidos: E entrada, S saída/escada, B chefe ou alfa, T tesouro, # parede, . chão, ~ água, i gelo
// (escorrega), o pedra para empurrar, x buraco para o andar de baixo, = trilho/ponte, ^ interruptor, | porta,
// L lava, * cristal, ? sala escura (precisa de luz: Vela Eterna ou Pokémon com Flash).
// `acesso` = o que o terreno exige (montarias liberadas por ter um Pokémon capaz); nenhuma depende de insígnia.

export const DUNGEONS = [
  {
    id: 'gruta_mare', nome: 'Gruta da Maré', regiao: 'nucleo', entrada: 'Praia Oeste, sob o morro do farol (252, 396)',
    acesso: 'a pé na maré baixa (6h–10h e 18h–22h); Mergulhar para a Câmara Submersa', estado: 'pendente no núcleo',
    andares: [
      { id: 'gruta_mare', nome: 'Boca da Gruta', mapa: ['#########', '#E..~~..#', '#.o.~~.T#', '#..^..S.#', '#########'],
        enigma: 'poças que enchem com a maré: o interruptor ^ fecha uma comporta e seca o canal por 60 s' },
      { id: 'gruta_mare_2', nome: 'Galeria das Conchas', mapa: ['###########', '#S..~~~..T#', '#.##~o~##.#', '#..x...o..#', '#E########S#'],
        enigma: 'empurrar duas pedras para dentro do canal e criar uma ponte; o buraco x cai direto no fundo (atalho de volta)' },
      { id: 'gruta_mare_fundo', nome: 'Câmara Submersa', mapa: ['~~~~~~~~~', '~E~~*~~B~', '~~~~~~T~~'],
        enigma: 'mergulho com correntes: seguir as bolhas; sem luz, só se vê com a Vela Eterna ou um Lanturn' },
    ],
    chefe: 'Alfa Barbaracle (#689) na Galeria; Dhelmise (#781) guarda a câmara',
    tesouros: ['Fóssil Concha (Omanyte)', 'Fóssil Domo (Kabuto)', 'Pérola Grande', 'Escama Prisma (rara)', 'MT Escaldar'],
  },
  {
    id: 'toca_absol', nome: 'Toca do Absol (Gruta do Musgo)', regiao: 'nucleo', entrada: 'Bosque Sussurrante (201, 201)', acesso: 'a pé', estado: 'desenhada',
    andares: [{ id: 'toca_absol', nome: 'Gruta do Musgo', mapa: ['##########', '#E..**..T#', '#.##..##.#', '#...B....#', '##########'], enigma: 'primeiro lugar com luzita nas paredes; luz e sombra alternam' }],
    chefe: 'Ariados Alfa (#168)', tesouros: ['Pedra da Lua', 'Absolita (com a missão de Sina)'],
  },
  {
    id: 'mina_aurora', nome: 'Mina Aurora (4 níveis) + Mina Abandonada', regiao: 'nucleo', entrada: 'Pé do Paredão, nos fundos de Cidade Aurora', acesso: 'a pé (nível 5: Vela Eterna ou luz)', estado: 'níveis 1-4 desenhados',
    andares: [
      { id: 'mina_aurora_n1', nome: 'Nível 1', enigma: 'trilhos e elevador de carga' },
      { id: 'mina_aurora_n2', nome: 'Nível 2', enigma: 'carrinhos que derrubam paredes' },
      { id: 'mina_aurora_n3', nome: 'Nível 3', enigma: 'desabamento; poço' },
      { id: 'mina_aurora_n4', nome: 'Nível 4', enigma: 'paredes de luzita que pulsam; garra de cristal' },
      { id: 'mina_abandonada', nome: 'Mina Abandonada (Nível 5)', mapa: ['############', '#S?????..T##', '#.#?##?##..#', '#..?..B?...#', '############'],
        enigma: 'escuro total: só a Vela Eterna mostra o caminho; carrinhos parados viram pontes quando empurrados para o vão' },
    ],
    chefe: 'Steelix Alfa (#208) no nível 4; Steelix de cristal Alfa no nível 5', tesouros: ['MT Canhão de Luz', 'Lasca de prisma (Pulseira Mega)', 'Fóssil Crânio', 'Fóssil Escudo', 'Steelixita', 'Registeel (câmara selada no nível 5, com as letras dos Vigias)'],
  },
  {
    id: 'ruinas_vigias', nome: 'Ruínas dos Vigias', regiao: 'nucleo', entrada: 'Planalto dos Ventos (216, 36)', acesso: 'Escalar (o Paredão); Lente Prisma para as inscrições', estado: 'pendente no núcleo',
    andares: [
      { id: 'ruinas_vigias', nome: 'Colunata', mapa: ['#.#.#.#.#', '.E.....T.', '#.#.^.#.#', '....S....'], enigma: 'oito colunas com sombras; ao meio-dia as sombras apontam para a escada' },
      { id: 'ruinas_vigias_sub', nome: 'Sala dos Murais', mapa: ['##########', '#S.|..|.T#', '#.#^##^#.#', '#...B....#', '##########'], enigma: 'portas que abrem quando os Unown certos são mostrados ao mural' },
    ],
    chefe: 'Alfa Bronzong (#437)', tesouros: ['Lasca de prisma (Pulseira Mega)', 'Pedra do Sol', 'MT Psíquico'],
  },
  {
    id: 'caverna_gelo', nome: 'Caverna de Gelo Cristalino', regiao: 'geada', entrada: 'Geleira do Uivo (1000, 60)', acesso: 'Escalar (paredes de gelo da geleira)',
    andares: [
      { id: 'caverna_gelo_1', nome: 'Saguão', mapa: ['###########', '#E.iiiii..#', '#..i#iii.T#', '#.iiiii#iS#', '###########'], enigma: 'gelo escorregadio: o jogador desliza até bater; pedras o servem de parada' },
      { id: 'caverna_gelo_2', nome: 'Rio Congelado', mapa: ['############', '#S..iiix..T#', '#.oo.iiiii.#', '#..^..iix.S#', '############'],
        enigma: 'empurrar blocos de gelo no rio para fazer paradas; rachaduras x quebram depois de pisadas duas vezes e derrubam para o andar de baixo' },
      { id: 'caverna_gelo_3', nome: 'Coração Azul', mapa: ['##########', '#S*.ii.*T#', '#.*i##i*.#', '#..*B*...#', '##########'], enigma: 'espelhos de gelo refletem a luz da Vela Eterna para derreter a parede do altar' },
    ],
    chefe: 'Alfa Avalugg (#713) no Rio Congelado; Glalie Alfa (#362) no Coração Azul. Pós-Liga: a Câmara do Zero Absoluto guarda Kyurem (#646).',
    tesouros: ['Lasca de prisma (Pulseira Mega)', 'Fóssil Vela (Amaura)', 'Pedra de Gelo', 'Glalita', 'Abomasnita', 'Froslassita', 'MT Nevasca'],
  },
  {
    id: 'ruinas_pintada', nome: 'Ruínas de Pedra Pintada', regiao: 'sertao', entrada: 'Dunas Douradas (960, 350)', acesso: 'Correr (areia fofa até a entrada)',
    andares: [
      { id: 'ruinas_pintada_1', nome: 'Pátio das Pinturas', mapa: ['###########', '#E..^...^.#', '#.##.##.#.#', '#..T..|..S#', '###########'], enigma: 'pinturas de Solgaleo: pisar nas placas na ordem do sol (leste, meio-dia, oeste) abre a porta' },
      { id: 'ruinas_pintada_2', nome: 'Galeria da Areia', mapa: ['############', '#S::xx::::T#', '#.::xx::##.#', '#..o..:::.S#', '############'], enigma: 'areia movediça (x) puxa para o andar de baixo; pedras empurradas param a areia que escorre' },
      { id: 'ruinas_pintada_3', nome: 'Câmara do Sol', mapa: ['#########', '#S..*..T#', '#.^.B.^.#', '#########'], enigma: 'dois raios de luz pelo teto precisam acertar o disco do altar ao mesmo tempo (girar espelhos)' },
    ],
    chefe: 'Alfa Krookodile (#553) na Galeria; Regirock (#377) na Câmara do Sol depois da inscrição dos Vigias',
    tesouros: ['Fóssil Garra (Anorith)', 'Fóssil Âmbar (Aerodactyl)', 'Pedra do Sol', 'Aerodactylita', 'Tyranitarita', 'MT Tempestade de Areia'],
  },
  {
    id: 'templo_raizes', nome: 'Templo das Raízes', regiao: 'jandaia', entrada: 'Selva Grande (120, 760)', acesso: 'Escalar (paredões de cipó)',
    andares: [
      { id: 'templo_raizes_1', nome: 'Átrio', mapa: ['###########', '#E.vv.^.vT#', '#.##v##.#.#', '#....|...S#', '###########'], enigma: 'cipós (v) crescem ou recuam quando se rega a flor-interruptor ^' },
      { id: 'templo_raizes_2', nome: 'Galerias Inundadas', mapa: ['############', '#S~~~.~~~.T#', '#.~=~^~=~..#', '#..~~~~~~.S#', '############'], enigma: 'correnteza: canais empurram o jogador (Nadar); comportas de pedra mudam a direção' },
      { id: 'templo_raizes_3', nome: 'Câmara da Semente', mapa: ['#########', '#S.vv..T#', '#.v.B.v.#', '#########'], enigma: 'sala escura: raízes luminosas acendem quando um Pokémon Planta usa um golpe de Planta perto' },
    ],
    chefe: 'Alfa Tangrowth (#465) nas Galerias; Tapu Bulu (#787) desce à Câmara da Semente',
    tesouros: ['Fóssil Raiz (Lileep)', 'Pedra da Folha', 'Venusaurita', 'Sceptilita', 'Tabuletas da Dra. Ybi', 'MT Tempestade de Folhas'],
  },
  {
    id: 'templo_mares', nome: 'Templo das Marés', regiao: 'austral', entrada: 'Ilha do Farol Morto (700, 640)', acesso: 'Nadar até a ilha; Mergulhar para os andares 2 e 3',
    andares: [
      { id: 'templo_mares_1', nome: 'Nave Alta', mapa: ['###########', '#E..~^~..T#', '#.#~~~~~#.#', '#...~~~..S#', '###########'], enigma: 'a maré do salão sobe e desce quando se puxa a corrente do sino ^' },
      { id: 'templo_mares_2', nome: 'Nave Afundada', mapa: ['~~~~~~~~~~~', '~S~~|~~~~T~', '~~~^~~~|~~~', '~~~~~~~~~S~'], enigma: 'portas d’água (|) que só abrem com a maré alta; ar acaba em 60 s (bolsas de ar recarregam)' },
      { id: 'templo_mares_3', nome: 'Altar da Maré', mapa: ['~~~~~~~~~', '~S~*B*~T~', '~~~~~~~~~'], enigma: 'quatro conchas-sino tocadas na ordem das ondas' },
    ],
    chefe: 'Alfa Dragalge (#691); Tapu Fini (#788) no Altar', tesouros: ['Fóssil Casco (Tirtouga)', 'Gyaradosita', 'Sharpedonita', 'Escama de Dragão', 'MT Hidrobomba'],
  },
  {
    id: 'caverna_iceberg', nome: 'Caverna do Iceberg', regiao: 'austral', entrada: 'Ilhas Austrais (600, 900)', acesso: 'Nadar',
    andares: [
      { id: 'caverna_iceberg_1', nome: 'Túnel Azul', mapa: ['##########', '#E.iiii.T#', '#.i#ii#i.#', '#..iiii.S#', '##########'], enigma: 'gelo escorregadio com placas que mudam a direção do deslize' },
      { id: 'caverna_iceberg_2', nome: 'Salão Polar', mapa: ['#########', '#S.ii.^T#', '#.iiBii.#', '#########'], enigma: 'letras dos Vigias no chão: pisar na palavra GELO abre a câmara de Regice' },
    ],
    chefe: 'Alfa Walrein (#365) e Regice (#378)', tesouros: ['Pedra de Gelo', 'Blastoisinita (com a Prof.ª Solveig)', 'Gelo Eterno'],
  },
  {
    id: 'templo_chama', nome: 'Templo da Chama (Vulcão Tição)', regiao: 'brasas', entrada: 'Vulcão Tição (1060, 820)', acesso: 'Escalar (encosta do vulcão)',
    andares: [
      { id: 'templo_chama_1', nome: 'Portal de Basalto', mapa: ['###########', '#E.LLL..T.#', '#.oLLL.o..#', '#...^...S.#', '###########'], enigma: 'empurrar pedras na lava cria chão de magma frio' },
      { id: 'templo_chama_2', nome: 'Rio de Lava', mapa: ['############', '#S=LLLL=LLT#', '#.=L^LL=L..#', '#..LLLL=..S#', '############'], enigma: 'pontes de pedra que afundam depois de 3 s; um interruptor desvia o rio de lava por 30 s' },
      { id: 'templo_chama_3', nome: 'Forja Antiga', mapa: ['#########', '#S.L*L.T#', '#.L.B.L.#', '#########'], enigma: 'quatro braseiros acesos na ordem das brasas pintadas no teto' },
    ],
    chefe: 'Alfa Magmortar (#467) no Rio de Lava; Heatran (#485) na Forja Antiga (missão do sismógrafo)',
    tesouros: ['Charizardita X', 'Houndoominita', 'Pedra do Fogo x3', 'Rocha Quente', 'MT Explosão de Chamas'],
  },
  {
    id: 'santuario_crepusculo', nome: 'Santuário do Crepúsculo', regiao: 'nucleo', entrada: 'redemoinho no Lago Espelho (489, 273)', acesso: 'Mergulhar', estado: 'pendente no núcleo',
    andares: [{ id: 'santuario_crepusculo', nome: 'Três salões e o altar', mapa: ['~~~~~~~~~~~', '~E~~|~~|~B~', '~~T~~~~~~~~'], enigma: 'luz de luar pela água: a Vela Eterna e a Lente Prisma acendem três pilares' }],
    chefe: 'guardiões Jellicent (#593) e Lanturn (#171); Lunala (#792)', tesouros: ['Escama Lunar', 'Bola Lua x5'],
  },
  {
    id: 'fenda_prismatica', nome: 'Fenda Prismática', regiao: 'nucleo', entrada: 'sob o Relógio de Pedra', acesso: 'a trama principal abre a fenda (8 insígnias e o Relógio)',
    andares: [
      { id: 'fenda_prismatica', nome: 'Boca do Prisma', mapa: ['#########', '#E**.**T#', '#.*^*..S#', '#########'], enigma: 'prismas dividem a luz em cores; cada cor abre uma porta da mesma cor' },
      { id: 'fenda_prismatica_3', nome: 'Salão dos Espelhos', mapa: ['###########', '#S*|*|*|*B#', '#.*^*^*^*T#', '###########'], enigma: 'chão de espelho: o jogador só vê o caminho refletido no teto; Fendas Ultra se abrem aqui à noite' },
    ],
    chefe: 'Necrozma (#800) nível 72', tesouros: ['Diancita', 'Bola Ultra-Fera x10', 'Pó Estelar', 'Diancie (#719, evento no salão dos diamantes)'],
  },
  {
    id: 'caminho_zenite', nome: 'Caminho do Zênite', regiao: 'nucleo', entrada: 'Rota 12', acesso: 'todas as montarias; a Liga pede 8 insígnias', estado: 'pendente no núcleo',
    andares: [{ id: 'caminho_zenite', nome: 'Estrada da Vitória', enigma: 'um obstáculo de cada montaria em sequência: lama, rio, paredão, abismo (voar) e redemoinho' }],
    chefe: 'Garchomp Alfa (#445)', tesouros: ['Garchompita', 'Doce Raro x3'],
  },
  {
    id: 'gruta_cataratas', nome: 'Gruta das Cataratas', regiao: 'poente_leste', entrada: 'atrás da cortina das Cataratas do Trovão', acesso: 'Nadar contra a correnteza',
    andares: [
      { id: 'gruta_cataratas_1', nome: 'Cortina d’Água', mapa: ['###########', '#E~~~..~~T#', '#.~=~^~=~.#', '#...~~~..S#', '###########'], enigma: 'subir a cachoeira por dentro: correntes para cima só com o interruptor ^ desligado' },
      { id: 'gruta_cataratas_2', nome: 'Abismo do Silêncio', mapa: ['##########', '#S??????T#', '#.?##?#?.#', '#..??B??.#', '##########'], enigma: 'escuro e silencioso: passos ecoam e mostram as paredes por um instante' },
    ],
    chefe: 'Mewtwo (#150) nível 80, o mais forte do mundo', tesouros: ['Mewtwonita X', 'Mewtwonita Y', 'Bola Mestra'],
  },
  {
    id: 'templo_poente', nome: 'Templo do Poente', regiao: 'poente_oeste', entrada: 'Deserto do Silêncio (120, 400)', acesso: 'Correr (dunas)',
    andares: [
      { id: 'templo_poente_1', nome: 'Escadaria do Sol', mapa: ['#########', '#E^.^.^T#', '#.......#', '#...S...#'], enigma: 'degraus que só aparecem na luz do entardecer (17h–18h)' },
      { id: 'templo_poente_2', nome: 'Salão dos Dois Céus', mapa: ['###########', '#S.*|B|*.T#', '#..^...^..#', '###########'], enigma: 'metade do salão é dia e metade é noite; uma pedra branca e uma preta trocam de lado' },
    ],
    chefe: 'Reshiram (#643) e Zekrom (#644), cada um de um lado; Ho-Oh (#250) no telhado ao pôr do sol', tesouros: ['Pena Arco-Íris', 'Pedra da Alvorada', 'Pedra do Anoitecer'],
  },
  {
    id: 'cratera_tempo', nome: 'Cratera do Tempo', regiao: 'poente_oeste', entrada: 'no meio do Deserto do Silêncio, escondida por uma miragem', acesso: 'Correr e Voar para descer',
    andares: [
      { id: 'cratera_tempo_1', nome: 'Borda', enigma: 'descida em espiral; tempestades que mudam o céu de cor' },
      { id: 'cratera_tempo_2', nome: 'Fundo (Passado e Futuro)', mapa: ['############', '#S..PPPP..T#', '#.PP.**.FF.#', '#..FFFF..B.#', '############'], enigma: 'P = selva antiga (paradoxos do passado), F = instalação abandonada (paradoxos do futuro); duas chaves abrem o laboratório' },
    ],
    chefe: 'Koraidon (#1007), Miraidon (#1008) e Terapagos (#1024)', tesouros: ['Bola Mestra', 'Cápsula de Habilidade', 'pedras de evolução'],
  },
  {
    id: 'mina_sal', nome: 'Mina de Sal', regiao: 'poente_oeste', entrada: 'Salar Branco (330, 430)', acesso: 'a pé',
    andares: [
      { id: 'mina_sal_1', nome: 'Galerias Brancas', enigma: 'blocos de sal empurráveis; poços de salmoura' },
      { id: 'mina_sal_2', nome: 'Poço Profundo', enigma: 'cristais de sal guiam a luz até o fundo' },
    ],
    chefe: 'Alfa Garganacl (#934); Eternatus (#890) dorme no Poço Profundo', tesouros: ['Pedra Dura', 'Bola Cronômetro x10'],
  },
  {
    id: 'glaciar_fim', nome: 'Glaciar do Fim do Mundo', regiao: 'poente_oeste', entrada: 'Campos de Gelo do Sul', acesso: 'Nadar',
    andares: [
      { id: 'glaciar_fim_1', nome: 'Fendas', enigma: 'fendas que se abrem e fecham com a hora; gelo escorregadio' },
      { id: 'glaciar_fim_2', nome: 'Mundo Avesso', enigma: 'o chão vira teto: gravidade invertida em salas marcadas' },
    ],
    chefe: 'Giratina (#487)', tesouros: ['Orbe Grisalho (item a criar)', 'Gelo Eterno', 'Bola do Crepúsculo x10'],
  },
];
