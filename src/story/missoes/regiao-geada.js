// Missões e NPCs vivos da Cordilheira Geada (Vila Geada, Lago Congelado, Rotas 15 e 16, Geleira do Uivo, Caverna de Gelo
// Cristalino, Cume do Vento Branco e Fiorde do Levante). Formato: docs/missoes.md.
// Os moradores estão em assets/maps/regioes/geada.json ("people", também dentro das salas).
// Os treinadores das rotas são missões de uma etapa só (batalha na conversa): TREINADORES, mais abaixo, gera todas.

export const ITENS = {
  vara_de_gelo: { name: 'Vara de Gelo', color: '#8ad8f0', desc: 'Vara curta de pesca que fura o gelo sozinha, presente do Seu Olavo. Com ela se pesca através do gelo do lago.' },
  fossil_vela: { name: 'Fóssil Vela', color: '#a8c8d8', desc: 'Fóssil de uma vela de gelo, achado na Caverna de Gelo Cristalino. Dizem que é de um Amaura.' },
  lasca_prisma_gelo: { name: 'Lasca de Prisma Azul', color: '#6ae0ff', desc: 'Uma lasca de prisma que respira uma luz azul fria. A Dona Pedrina, de Cidade Escarpa, sabe lapidar.' },
  leitura_boreal: { name: 'Caderno de Leituras', color: '#9ad8f0', desc: 'O caderno da Dra. Hanna, com as leituras de luz dos picos. Anote uma por pico, de noite.' },
};

// ----------------------------------------------------------------------------------------------------------------------
// Missões de verdade
// ----------------------------------------------------------------------------------------------------------------------
export const MISSOES = [
  {
    id: 'sq_pesca_gelo', titulo: 'Pesca no buraco', regiao: 'Vila Geada', de: 'olavo',
    resumo: 'O Seu Olavo quer ver três peixes do gelo: um Seel, um Barboach e um Relicanth. Em troca, dá a vara que pesca através do gelo.',
    oferta: [
      'Moço, você tem cara de quem pesca. Eu sou o Olavo, pescador de gelo.',
      'Quero ver com meus olhos um Seel, um Barboach e um Relicanth. Os dois primeiros vivem no Lago Congelado, nas frestas.',
      'O Relicanth é raro: vive no fundo do mar, bem longe. Se me mostrar os três, a vara de gelo é sua. Topa?',
    ],
    aceita: ['Boa! Os buracos de pesca do lago dão para o fundo. Fique de olho nas frestas escuras.'],
    lembrete: ['Um Seel, um Barboach e um Relicanth. Mostre cada um e a vara é sua!'],
    etapas: [
      { tipo: 'mostrar', npc: 'olavo', especie: 86, texto: 'Mostre um Seel ao Seu Olavo', falta: ['Ainda não tem um Seel? Eles gostam das frestas do lago.'], falas: ['Olha só o {pokemon}! Focinho de quem sabe nadar embaixo do gelo.'] },
      { tipo: 'mostrar', npc: 'olavo', especie: 339, texto: 'Mostre um Barboach ao Seu Olavo', falta: ['O Barboach é o bigodudo do lodo. Busque nas frestas do lago.'], falas: ['Um {pokemon}! Esse bigode sente o gelo rachando antes de mim.'] },
      { tipo: 'mostrar', npc: 'olavo', especie: 369, texto: 'Mostre um Relicanth ao Seu Olavo', falta: ['O Relicanth mora no fundo do mar, onde ninguém vai. Vale a viagem!'], falas: ['Um {pokemon}! Eu achei que nunca veria um desses vivo.', 'Prometeu, cumpriu: a vara é sua.'] },
    ],
    recompensa: { itens: [['vara_de_gelo', 1], ['neverMeltIce', 1]] },
  },
  {
    id: 'sq_avalanche', titulo: 'Alpinistas perdidos', regiao: 'Vila Geada', de: 'estalajadeira',
    resumo: 'Três alpinistas do mural da estalagem ficaram presos na Geleira do Uivo depois de uma avalanche. Ache os três e avise a Dona Inês.',
    oferta: [
      'Você viu o mural? Bruno, Clara e Josué subiram a Geleira e não desceram. A avalanche foi há dois dias.',
      'Os guardas não conseguem subir com a neve nova. Se você escala, talvez ache os três. Aceita?',
    ],
    aceita: ['Que Deus guie seus passos! Procure acampamentos e fumaça, o gelo esconde tudo o mais.'],
    lembrete: ['Bruno, Clara e Josué. Ache os três na Geleira do Uivo, e depois me avise.'],
    etapas: [
      { tipo: 'falar', npc: 'alp_bruno', texto: 'Ache o Bruno Tavares, na Geleira do Uivo', falas: ['Você veio da vila? Que alívio! A perna está torcida, mas eu aguento. Veja se acha a Clara e o Josué.'] },
      { tipo: 'falar', npc: 'alp_clara', texto: 'Ache a Clara Meirelles, a leste da geleira', falas: ['Bruno está vivo? Graças a Deus! Eu desci errado e fiquei sem trilha. Pode avisar que estou bem.'] },
      { tipo: 'falar', npc: 'alp_josue', texto: 'Ache o Josué, no sul da geleira', falas: ['Eu só queria ver o gelo azul. Obrigado! Já estou descendo pelo Desfiladeiro, com o Snorunt.'] },
      { tipo: 'falar', npc: 'estalajadeira', texto: 'Conte à Dona Inês que os três estão vivos', falas: ['Os três vivos! Vou riscar os nomes do mural agora mesmo.', 'Tome. Não é pagamento: é gratidão de uma estalajadeira.'] },
    ],
    recompensa: { itens: [['iceStone', 1], ['maxRevive', 3]] },
  },
  {
    id: 'sq_aurora_boreal', titulo: 'A luz que dança', regiao: 'Vila Geada', de: 'hanna',
    requer: { insignias: 2 },
    resumo: 'A Dra. Hanna quer leituras de luz em três picos (Cume do Vento Branco, Pico Geada e Geleira do Uivo), numa noite de aurora. As leituras mostram o Coração respirando.',
    oferta: [
      'Sou a Hanna. Estudo as auroras há onze anos e algo muda: a luz sobe e desce a cada três minutos, como um pulmão.',
      'Preciso de leituras em três pontos altos, de noite, quando a aurora dança: o Cume do Vento Branco, o Pico Geada e a Geleira do Uivo.',
      'Leva este caderno e anota o que o céu mostrar. Aceita?',
    ],
    aceita: ['Ótimo! Só de noite, hein: de dia a luz do sol apaga tudo. Use os pontos altos da trilha.'],
    lembrete: ['Três picos, de noite: o Cume, o Pico Geada e a Geleira. O caderno anota sozinho se você chegar perto.'],
    itensIniciais: [['leitura_boreal', 1]],
    etapas: [
      { tipo: 'chegar', x: 1060, y: 100, r: 8, se: { hora: 'noite' }, texto: 'De noite, faça a leitura na Geleira do Uivo', falas: ['O caderno estala. No céu, a aurora acende em ondas e a luz parece respirar sob a geleira.'] },
      { tipo: 'chegar', x: 1090, y: 8, r: 6, se: { hora: 'noite' }, texto: 'De noite, faça a leitura no Cume do Vento Branco', falas: ['No alto, o céu está tão perto que dá para tocar. A aurora pulsa em verde, e a neve responde.'] },
      { tipo: 'chegar', x: 42, y: 12, r: 8, se: { hora: 'noite' }, texto: 'De noite, faça a leitura no Pico Geada', falas: ['O Pico Geada também pulsa, no mesmo ritmo. Os três picos respiram juntos.'] },
      { tipo: 'falar', npc: 'hanna', texto: 'Leve o caderno à Dra. Hanna', falas: ['Os três no mesmo compasso! Então não é coincidência: o Coração respira por baixo de toda a Geleira.', 'Isto é para você. Uma pedra do alvorecer e uma lasca de gelo que aprendeu a refletir luz.'] },
    ],
    recompensa: { itens: [['dawnStone', 1], ['glalitite', 1]], flags: { hannaCoracao: true } },
  },
  {
    id: 'sq_vento_branco', titulo: 'A ave de cristal', regiao: 'Cume do Vento Branco', de: 'alpinista_veterano',
    requer: { insignias: 6, missoes: ['sq_aurora_boreal'] },
    resumo: 'No topo do Cume do Vento Branco, onde a neve engole a perna, mora uma ave que congela o vento. O Teodoro quer que alguém a veja.',
    oferta: [
      'Eu subi o Cume há quarenta anos e vi uma ave de cristal pousada num altar de gelo.',
      'O vento virou gelo quando ela bateu as asas. Nunca mais subi. Mas você, com essa pedra do alvorecer no bolso, talvez devesse.',
      'Suba até o altar, no topo. Quer tentar?',
    ],
    aceita: ['Leve um Pokémon que saiba andar na neve funda. E agasalho. E coragem.'],
    lembrete: ['O altar de gelo fica no alto do Cume. Cuidado com o vento.'],
    etapas: [
      { tipo: 'chegar', lugar: 'cume_articuno', r: 12, texto: 'Suba o Cume do Vento Branco', falas: ['A neve vai até os joelhos. No fim do rastro, um altar de gelo e um frio que não é do clima.'] },
      { tipo: 'vencer', texto: 'Enfrente a ave de cristal',
        alfa: { dex: 144, nivel: 70, x: 1090, y: 5, golpes: ['blizzard', 'iceBeam', 'airSlash', 'icyWind'], aviso: 'O vento muda de lado. Uma ave de cristal pousa no altar!' } },
      { tipo: 'falar', npc: 'alpinista_veterano', texto: 'Conte ao Teodoro o que viu', falas: ['Você viu! Eu jurava que tinha sonhado. Obrigado por me devolver o céu.'] },
    ],
    recompensa: { itens: [['rareCandy', 3], ['maxRevive', 2]] },
  },
  {
    id: 'sq_zero_absoluto', titulo: 'O zero absoluto', regiao: 'Caverna de Gelo Cristalino', de: 'hanna',
    requer: { insignias: 7, missoes: ['sq_aurora_boreal'] },
    resumo: 'Atrás de uma parede de gelo grosso, no Coração Azul, existe uma câmara onde nada se move. A Dra. Hanna quer saber o que a mantém fria.',
    oferta: [
      'A luz que respira vem de um lugar frio demais para ser natural: atrás de uma parede de gelo grosso, no fundo da caverna.',
      'Os três braseiros do salão azul abrem o altar, mas a câmara só se abre com golpes de peso: Lutador, Pedra, Terra ou Aço.',
      'Vá até a Câmara do Zero Absoluto e veja o que dorme lá. Cuidado: a ave é fria demais.',
    ],
    aceita: ['Quebre as três camadas de gelo do salão azul. A câmara é depois.'],
    lembrete: ['A câmara fica atrás de três camadas de gelo grosso, no leste do salão azul.'],
    etapas: [
      { tipo: 'chegar', sala: 'camara_zero', x: 12, y: 8, r: 5, texto: 'Entre na Câmara do Zero Absoluto', falas: ['O ar é um espelho. Não há vento, não há som. O frio vem de uma única criatura enorme, dormindo de pé.'] },
      { tipo: 'vencer', texto: 'Enfrente o dragão do gelo',
        alfa: { dex: 646, nivel: 70, sala: 'camara_zero', x: 12, y: 4, golpes: ['glaciate', 'dragonPulse', 'iceBeam', 'earthquake'], aviso: 'O ar congela. Kyurem desperta!' } },
      { tipo: 'falar', npc: 'hanna', texto: 'Conte à Dra. Hanna o que viu', falas: ['Um dragão feito de frio absoluto, escondido atrás de gelo. Então era isso que mantinha a luz comprimida.', 'Obrigada. Vou anotar com o seu nome.'] },
    ],
    recompensa: { itens: [['rareCandy', 3], ['maxElixir', 3]] },
  },
  {
    id: 'sq_banquisa', titulo: 'O Cloyster do fiorde', regiao: 'Fiorde do Levante', de: 'aldo',
    resumo: 'O Aldo jura que o avô viu um Cloyster do tamanho de uma casa. Ele quer ver qualquer Cloyster do fiorde.',
    requer: { insignias: 4 },
    oferta: [
      'Dizem que no fiorde vive um Cloyster do tamanho de uma casa. Meu avô jurava.',
      'Nunca vi nenhum. Mas se você capturar um Cloyster do fiorde e me mostrar, eu aposento a minha vara de tanta alegria.',
    ],
    aceita: ['Boa sorte! Eles aparecem quando a maré dá sossego.'],
    lembrete: ['Um Cloyster, só um, capturado no fiorde.'],
    etapas: [
      { tipo: 'capturar', especie: 91, lugar: 'fiorde_levante', texto: 'Capture um Cloyster no Fiorde do Levante' },
      { tipo: 'mostrar', npc: 'aldo', especie: 91, texto: 'Mostre o Cloyster ao Aldo', falta: ['Quero ver o bichinho!'], falas: ['Um {pokemon} de verdade! Meu avô tinha razão (menos no tamanho).', 'Pegue. Tirei esta pérola do fundo em 1998.'] },
    ],
    recompensa: { itens: [['bigPearl', 2]] },
  },
];

// ----------------------------------------------------------------------------------------------------------------------
// Treinadores: [id (igual ao do mapa), nome, região no diário, oferta, vitória, derrota, [[espécie, nível, golpes]]]
// O dinheiro sai do nível médio da equipe (a batalha em si paga 0: o prêmio vem da recompensa da missão).
// ----------------------------------------------------------------------------------------------------------------------
const TREINADORES = [
  // Rota 15, Passo do Uivo (38 a 42)
  ['gt_esq1', 'Esquiador Caio', 'Rota 15, Passo do Uivo', 'Opa! Alguém na minha pista. Quer correr ou batalhar?', 'Perdi a pista e a corrida.', 'Pista é minha! Mais um treino e a gente se vê.',
    [[225, 39, ['iceShard', 'aerialAce', 'quickAttack']], [459, 40, ['iceShard', 'energyBall', 'powderSnow']]]],
  ['gt_pat1', 'Patinadora Lúcia', 'Rota 15, Passo do Uivo', 'O gelo da Rota 15 é fino de manhã. Quer escorregar numa batalha?', 'Uau! Você patina bem.', 'Cheguei primeiro! Tente de novo.',
    [[215, 40, ['iceShard', 'nightSlash', 'quickAttack']], [124, 41, ['icyWind', 'psychic', 'confusion']]]],
  ['gt_alp1', 'Mochileira Dani', 'Rota 15, Passo do Uivo', 'Estou indo para a vila, mas parar numa batalha não atrasa ninguém.', 'Perdi! Mas ganhei uma boa história.', 'Boa tentativa! Até na próxima.',
    [[220, 38, ['powderSnow', 'tackle', 'bite']], [221, 41, ['iceFang', 'earthquake', 'rockSlide']], [361, 39, ['iceShard', 'bite', 'icyWind']]]],
  ['gt_esq2', 'Esquiadora Ísis', 'Rota 15, Passo do Uivo', 'Cuidado: o vento aqui joga a gente de lado. Quer ver quem se segura mais?', 'Você ficou de pé até o fim!', 'O vento ajudou, juro.',
    [[361, 40, ['iceShard', 'bite', 'icyWind']], [86, 41, ['icyWind', 'aquaJet', 'headbutt']]]],
  ['gt_camp1', 'Campista Rubem', 'Rota 15, Passo do Uivo', 'Fogo e frio dão um bom chá. Quer provar numa batalha?', 'Meu chá esfriou!', 'Tá quente! Volte para tomar um chá.',
    [[58, 40, ['bite', 'flamethrower', 'crunch']], [37, 40, ['ember', 'quickAttack', 'flamethrower']], [59, 42, ['flamethrower', 'crunch', 'bodySlam']]]],
  // Lago Congelado (40 a 44)
  ['gt_pesc1', 'Pescador Nando', 'Lago Congelado', 'Silêncio! Estou esperando o peixe morder. Mas uma batalha também vale.', 'Fiz barulho demais e fugiu tudo.', 'O peixe mordeu e você também!',
    [[340, 43, ['surf', 'earthquake', 'bodySlam']], [87, 42, ['icyWind', 'surf', 'headbutt']]]],
  ['gt_pat2', 'Patinador Ravi', 'Lago Congelado', 'No gelo eu sou rei. Vem ver!', 'O rei caiu do gelo...', 'Rei do gelo outra vez!',
    [[87, 43, ['icyWind', 'surf', 'headbutt']], [365, 44, ['iceBeam', 'surf', 'bodySlam']]]],
  ['gt_pesc2', 'Pescadora Marta', 'Lago Congelado', 'Meu marido pesca, eu batalho. Divisão de trabalho.', 'Ele ia dizer que perdi de propósito.', 'Marido, vem ver!',
    [[131, 44, ['iceBeam', 'surf', 'bodySlam']], [363, 41, ['powderSnow', 'surf', 'bodySlam']], [340, 42, ['surf', 'earthquake', 'bodySlam']]]],
  ['gt_clar1', 'Gêmea Nina', 'Lago Congelado', 'Meu irmão está na vila, eu estou aqui. Batalhe comigo enquanto ele não vem!', 'Perdi! Meu irmão não vai acreditar!', 'Ganhei! O Tor vai ficar com inveja.',
    [[363, 41, ['powderSnow', 'surf', 'bodySlam']], [362, 44, ['iceFang', 'crunch', 'blizzard']]]],
  // Rota 16, Campos Nevados (44 a 48)
  ['gt_alp2', 'Alpinista Otto', 'Rota 16, Campos Nevados', 'Antes da Geleira, um aquecimento: uma batalha rápida!', 'Estou aquecido, obrigado.', 'Aqueceu pouco. Vá devagar na Geleira.',
    [[460, 45, ['blizzard', 'energyBall', 'iceShard']], [614, 46, ['iceHammer', 'slash', 'bodySlam']]]],
  ['gt_esq3', 'Esquiadora Bruna', 'Rota 16, Campos Nevados', 'Você está parado no meio da minha descida! Batalhe ou saia.', 'Perdi a descida...', 'Descida limpa! Tchau.',
    [[461, 46, ['iceShard', 'nightSlash', 'aerialAce']], [471, 47, ['iceBeam', 'shadowBall', 'quickAttack']]]],
  ['gt_camp2', 'Campista Tadeu', 'Rota 16, Campos Nevados', 'Acampar na neve exige fogo. O meu é de estimação.', 'Meu fogo apagou!', 'O fogo é do tamanho do coração.',
    [[59, 47, ['flamethrower', 'crunch', 'extremeSpeed']], [38, 46, ['flamethrower', 'psychic', 'confusion']]]],
  ['gt_cien1', 'Cientista Elias', 'Rota 16, Campos Nevados', 'Estudo como o gelo muda de forma. Quer ser meu experimento?', 'Interessante! Meus dados mudaram.', 'Dado confirmado: gelo vence.',
    [[615, 46, ['icyWind', 'auroraBeam', 'flashCannon']], [584, 47, ['blizzard', 'icyWind', 'freezeDry']], [866, 47, ['iceBeam', 'psychic', 'knockOff']]]],
  ['gt_pat3', 'Patinadora Cléo', 'Rota 16, Campos Nevados', 'O riacho congelado escorrega até a gente bater. Quer bater em mim?', 'Bati em você e deu azar.', 'Escorreguei até a vitória!',
    [[478, 47, ['iceBeam', 'shadowBall', 'hex']], [87, 46, ['icyWind', 'surf', 'headbutt']]]],
  ['gt_alp3', 'Alpinista Zélia', 'Rota 16, Campos Nevados', 'Em frente fica o paredão. Antes, mostre que escala!', 'Escalou bem! Boa subida.', 'Ainda falta fôlego. Treine mais.',
    [[221, 46, ['iceFang', 'earthquake', 'rockSlide']], [473, 48, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_guarda1', 'Guarda Dora', 'Rota 16, Campos Nevados', 'Em nome do parque: ninguém passa sem treino. Mostre o que sabe!', 'Pode seguir. Cuidado lá em cima.', 'Treine mais. A Geleira não perdoa.',
    [[713, 46, ['avalanche', 'crunch', 'bodySlam']], [362, 47, ['blizzard', 'crunch', 'iceFang']]]],
  ['gt_lenhador', 'Lenhador Ivo', 'Atalho do Lenhador', 'Você achou o meu atalho! Quem acha, enfrenta.', 'Perdi o atalho. Pode usar.', 'O atalho é meu! Volte pela Rota 16.',
    [[68, 46, ['closeCombat', 'rockSlide', 'earthquake']], [460, 47, ['blizzard', 'energyBall', 'iceShard']]]],
  // Geleira do Uivo (47 a 51)
  ['gt_alp4', 'Alpinista Hugo', 'Geleira do Uivo', 'A neve aqui é dura. Quer testar a sua?', 'A neve cedeu debaixo de mim...', 'Firme como gelo!',
    [[713, 48, ['avalanche', 'crunch', 'bodySlam']], [975, 50, ['iceSpinner', 'earthquake', 'bodySlam']]]],
  ['gt_esq4', 'Esquiador Léo', 'Geleira do Uivo', 'Descer a Geleira é mais fácil do que subir. Quer ver quem sobe mais rápido?', 'Perdi a corrida e a batalha.', 'Subi mais rápido!',
    [[461, 50, ['iceShard', 'nightSlash', 'iceFang']], [473, 50, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_cien2', 'Cientista Vera', 'Geleira do Uivo', 'A luz da aurora muda o comportamento dos Pokémon. Quero medir o seu!', 'Mediu bem, treinou melhor.', 'Hipótese confirmada!',
    [[615, 48, ['icyWind', 'auroraBeam', 'flashCannon']], [584, 50, ['blizzard', 'icyWind', 'freezeDry']], [866, 51, ['iceBeam', 'psychic', 'knockOff']]]],
  ['gt_alp5', 'Alpinista Nilo', 'Geleira do Uivo', 'Subi sem cordas e sem plano. Agora quero sem derrota.', 'Sem derrota? Perdi.', 'Sem derrota, ainda!',
    [[614, 49, ['iceHammer', 'closeCombat', 'slash']], [460, 50, ['blizzard', 'energyBall', 'iceShard']]]],
  ['gt_esq5', 'Esquiadora Tati', 'Geleira do Uivo', 'A neve aqui é pó puro, fofa feito nuvem. Vem escorregar!', 'Fui varrida!', 'Escorreguei até a vitória!',
    [[478, 50, ['iceBeam', 'shadowBall', 'hex']], [471, 51, ['iceBeam', 'shadowBall', 'quickAttack']], [873, 49, ['icyWind', 'airSlash', 'blizzard']]]],
  ['gt_guarda2', 'Guarda Bento', 'Geleira do Uivo', 'Patrulha da Geleira. Se quer passar por mim, convença com a batalha!', 'Convenceu. Pode seguir.', 'Não convenceu.',
    [[131, 51, ['iceBeam', 'surf', 'psychic']], [713, 50, ['avalanche', 'crunch', 'bodySlam']]]],
  ['gt_pat4', 'Patinadora Gabi', 'Geleira do Uivo', 'O gelo azul é o mais liso. Quer escorregar numa luta?', 'Escorreguei e perdi.', 'Gelo azul, vitória azul!',
    [[997, 50, ['iceFang', 'dragonClaw', 'crunch']], [471, 49, ['iceBeam', 'shadowBall', 'quickAttack']]]],
  // Cume do Vento Branco (54 a 58)
  ['gt_guardiao', 'Guardião Hakon', 'Cume do Vento Branco', 'Poucos chegam aqui. Menos ainda saem sem lutar comigo.', 'O vento escolheu você.', 'O vento não escolheu você. Ainda.',
    [[362, 56, ['blizzard', 'crunch', 'iceFang']], [473, 57, ['earthquake', 'iceShard', 'stoneEdge']], [975, 57, ['iceSpinner', 'earthquake', 'bodySlam']], [998, 58, ['glaciate', 'dragonClaw', 'iceFang']]]],
  // Fiorde do Levante (50 a 54)
  ['gt_mar1', 'Marinheiro Beto', 'Fiorde do Levante', 'Marinheiro de gelo! Sem barco, mas com muito Pokémon.', 'Afundei sem barco!', 'Navegando em vitória!',
    [[91, 52, ['iceBeam', 'surf', 'iceShard']], [130, 53, ['surf', 'crunch', 'iceFang']], [87, 51, ['icyWind', 'surf', 'headbutt']]]],
  ['gt_mar2', 'Nadadora Iris', 'Fiorde do Levante', 'A água do fiorde é fria, mas me faz bem. Quer testar a sua coragem?', 'Mergulhei fundo e perdi.', 'Você é rápida, mas eu sou mais!',
    [[131, 52, ['iceBeam', 'surf', 'psychic']], [365, 53, ['iceBeam', 'surf', 'bodySlam']], [226, 52, ['surf', 'airSlash', 'icyWind']]]],
  // Caverna de Gelo Cristalino (54 a 60)
  ['gt_cav1', 'Espeleólogo Raul', 'Caverna de Gelo Cristalino', 'Um passo errado no gelo e a gente desliza até a parede. Prefere a minha parede?', 'Bati na parede.', 'Escorreguei até você!',
    [[713, 55, ['avalanche', 'bodySlam', 'crunch']], [615, 55, ['icyWind', 'auroraBeam', 'flashCannon']]]],
  ['gt_cav2', 'Espeleóloga Sara', 'Caverna de Gelo Cristalino', 'As colunas de gelo servem de parada. Servem também de esconderijo.', 'Você me achou!', 'Não achou!',
    [[478, 56, ['iceBeam', 'shadowBall', 'hex']], [584, 56, ['blizzard', 'icyWind', 'freezeDry']]]],
  ['gt_cav3', 'Pesquisador Tomé', 'Caverna de Gelo Cristalino', 'Estudo as rachaduras do rio congelado. Uma delas dá aqui perto.', 'Minha pesquisa não previa derrota.', 'Pesquisa confirmada: eu ganho!',
    [[866, 57, ['iceBeam', 'psychic', 'knockOff']], [615, 57, ['icyWind', 'auroraBeam', 'flashCannon']], [473, 56, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_cav4', 'Esquiador Ugo', 'Caverna de Gelo Cristalino', 'Dentro da caverna o gelo é mais liso. Quer ver como eu esquio?', 'Esqui nenhum me salvou.', 'Esqui de campeão!',
    [[461, 58, ['iceShard', 'nightSlash', 'iceFang']], [473, 58, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_cav5', 'Guarda Henrique', 'Caverna de Gelo Cristalino', 'Guardo o salão azul. Quem acende os braseiros e abre o altar me enfrenta antes.', 'Pode abrir o altar.', 'O altar é meu!',
    [[713, 58, ['avalanche', 'crunch', 'bodySlam']], [362, 58, ['blizzard', 'crunch', 'iceFang']], [975, 59, ['iceSpinner', 'earthquake', 'bodySlam']]]],
  ['gt_cav6', 'Sacerdotisa do Gelo Brenda', 'Caverna de Gelo Cristalino', 'A luz do Coração me escolheu como guardiã. Prove que merece vê-la.', 'A luz escolheu você.', 'A luz não escolheu você.',
    [[478, 59, ['iceBeam', 'shadowBall', 'hex']], [866, 59, ['iceBeam', 'psychic', 'knockOff']], [471, 60, ['iceBeam', 'shadowBall', 'quickAttack']], [365, 58, ['iceBeam', 'surf', 'bodySlam']]]],
];

for (const [id, nome, regiao, oferta, vitoria, derrota, equipe] of TREINADORES) {
  const media = equipe.reduce((s, e) => s + e[1], 0) / equipe.length;
  const dinheiro = Math.round((media * equipe.length * 14) / 10) * 10;
  MISSOES.push({
    id: 'tr_' + id, titulo: nome, regiao, de: id,
    resumo: `${nome} desafia quem passa por ${regiao}.`,
    oferta: [oferta], aceita: ['Vamos!'], recusa: ['Quando quiser.'],
    etapas: [
      { tipo: 'vencer', npc: id, agora: true, perguntar: false, texto: `Vença ${nome}`,
        batalha: { id, nome, dinheiro: 0, equipe },
        falas: ['Vamos ver o que você sabe!'], vitoria: [vitoria], derrota: [derrota] },
    ],
    recompensa: { dinheiro },
  });
}

// ----------------------------------------------------------------------------------------------------------------------
// NPCs vivos
// ----------------------------------------------------------------------------------------------------------------------
export const NPCS = {
  dona_branca: {
    diario: { itens: [['iceHeal', 1], ['superPotion', 1]], falas: ['Seu sorvete do dia! De Vanillite, gelado, sem corante, sem pena.', 'Coma e se cuide: ele tira o gelo do corpo.'], depois: ['Hoje o sorvete já foi. Volte amanhã, e traga fome!'] },
    falas: [
      { se: { hora: 'noite' }, linhas: ['À noite a Vanillite trabalha mais devagar. O sorvete sai mais cremoso.'] },
      { linhas: ['Bem-vindo à Sorveteria! O sorvete é feito por Vanillite, e só por eles.'] },
    ],
  },
  tor: {
    troca: {
      quer: { especie: 215, nome: 'um Sneasel comum' },
      da: { dex: 215, forma: 'hisui', nivel: 40, apelido: 'Ciscos' },
      repetivel: false,
      falas: {
        pede: ['Eu tenho um Sneasel de Hisui, mas a Tora tem inveja. Troco por um Sneasel comum, pode ser?'],
        aceita: ['Fechado! Cuida bem do Ciscos: ele só arranha quem merece.'],
        recusa: ['Tá bom. O Ciscos fica comigo mesmo.'],
        falta: ['Você não tem um Sneasel? Procura na Rota 16!'],
        depois: ['O Ciscos agora é seu. Mande um oi para ele por mim!'],
      },
    },
  },
  tora: {
    troca: {
      quer: { especie: 713, nome: 'um Avalugg comum' },
      da: { dex: 713, forma: 'hisui', nivel: 45, apelido: 'Pedrinho' },
      repetivel: false,
      falas: {
        pede: ['Eu tenho um Avalugg de Hisui. O Tor tem um Sneasel e eu quero um Avalugg do normal. Aceita trocar?'],
        aceita: ['Que bom! Ele é pesado, mas é um fofo.'],
        recusa: ['Tudo bem. A gente tenta de novo outro dia.'],
        falta: ['Um Avalugg comum! Ele vive na Geleira.'],
        depois: ['Agora eu tenho um Avalugg comum! O Pedrinho vai gostar da cama.'],
      },
    },
  },
  hanna: {
    presente: { itens: [['alakazite', 1]], requer: { insignias: 3 }, falas: ['Você tem cara de quem treina com carinho. Esta pedra é de um Alakazam que me ajudou no começo dos estudos.', 'Ele agora vive no campo, mas deixou a pedra. Cuide dela.'], depois: ['A pedra do Alakazam está em boas mãos.'] },
    falas: [
      { se: { missoes: ['sq_aurora_boreal'] }, linhas: ['O Coração respira cada vez mais forte. Se você descer à caverna, leve proteção. E fogo.'] },
      { se: { hora: 'noite' }, linhas: ['A aurora está dançando agora. Veja pela lente do telescópio: ela pulsa a cada três minutos.'] },
    ],
  },
  estalajadeira: {
    falas: [
      { se: { missoes: ['sq_avalanche'] }, linhas: ['O mural já está sem nomes riscados. Obrigada por trazer a minha paz de volta.'] },
    ],
  },
  aldo: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['De noite o fiorde canta. É o vento passando pelo gelo marinho. Dá um calafrio gostoso.'] },
    ],
  },
  olavo: {
    falas: [
      { se: { missoes: ['sq_pesca_gelo'] }, linhas: ['A vara de gelo é sua! Pesque nos buracos do lago e me conte o que vier.'] },
    ],
  },
};
