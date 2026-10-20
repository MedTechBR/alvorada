// Missões e NPCs vivos da Cordilheira Geada (Vila Geada, Lago Congelado, Rotas 15 e 16, Geleira do Uivo, Caverna de Gelo
// Cristalino, Cume do Vento Branco e Fiorde do Levante). Formato: docs/missoes.md.
// Os moradores estão em assets/maps/regioes/geada.json ("people", também dentro das salas).
// Os treinadores das rotas lutam na conversa (NPCS[id].treinador, gerados de TREINADORES, mais abaixo). Só duas missões soltas ficam.

export const ITENS = {
  fossil_vela: { name: 'Fóssil Vela', color: '#a8c8d8', desc: 'Fóssil de uma vela de gelo, achado na Caverna de Gelo Cristalino. Dizem que é de um Amaura.' },
  lasca_prisma_gelo: { name: 'Lasca de Prisma Azul', color: '#6ae0ff', desc: 'Uma lasca de prisma que respira uma luz azul fria. A Dona Pedrina, de Cidade Escarpa, sabe lapidar.' },
  leitura_boreal: { name: 'Caderno de Leituras', color: '#9ad8f0', desc: 'O caderno da Dra. Hanna, com as leituras de luz dos picos. Anote uma por pico, de noite.' },
};

// ----------------------------------------------------------------------------------------------------------------------
// Missões de verdade
// ----------------------------------------------------------------------------------------------------------------------
export const MISSOES = [
  {
    id: 'sq_avalanche', titulo: 'Alpinistas perdidos', regiao: 'Vila Geada', de: 'estalajadeira',
    resumo: 'Três alpinistas do mural da estalagem ficaram presos na Geleira do Uivo depois de uma avalanche. Encontre os três e conte à Dona Inês.',
    oferta: [
      'Você viu o mural da estalagem? Bruno, Clara e Josué subiram a Geleira e não desceram. A avalanche foi há dois dias.',
      'Os guardas não sobem com a neve nova. Você escala, talvez os encontre. Eu rezo toda vez que um nome entra no mural.',
    ],
    aceita: ['Deus guie os seus passos! Procure acampamento e fumaça, que o gelo esconde o resto.'],
    lembrete: ['Bruno, Clara e Josué, na Geleira do Uivo. Quando os encontrar, volte e me conte.'],
    etapas: [
      { tipo: 'falar', npc: 'alp_bruno', texto: 'Encontre o Bruno Tavares, na Geleira do Uivo', falas: ['Você veio da vila? Que alívio! A perna torceu, mas eu aguento. Procure a Clara e o Josué, por favor.', 'A Clara e eu discutimos a rota antes da avalanche, e cada um foi para um lado. Diga que não estou mais bravo.'] },
      { tipo: 'falar', npc: 'alp_clara', texto: 'Encontre a Clara Meirelles, a leste da geleira', falas: ['O Bruno está vivo? Graças a Deus! Desci pela trilha errada e fiquei sem rumo. Eu briguei com ele, e a rota era dele.', 'Avise que ele tinha razão e que eu estou bem.'] },
      { tipo: 'falar', npc: 'alp_josue', texto: 'Encontre o Josué, no sul da geleira', falas: ['Eu só queria ver o gelo azul e acabei me perdendo. Obrigado! Já desço pelo Desfiladeiro, com o meu Snorunt.'] },
      { tipo: 'falar', npc: 'estalajadeira', texto: 'Conte à Dona Inês, na estalagem de Vila Geada, que os três estão vivos', falas: ['Os três vivos! Vou riscar os nomes do mural agora mesmo.', 'Só que tem um nome no cantinho que eu nunca risquei: Jacinto, meu marido. Subiu em outro inverno e a Geleira não devolveu.', 'Tome. Não é pagamento, é a gratidão de uma estalajadeira. A neve já levou gente demais.'] },
    ],
    recompensa: { itens: [['iceStone', 1], ['maxRevive', 3]] },
  },
  {
    id: 'sq_aurora_boreal', titulo: 'A luz que dança', regiao: 'Vila Geada', de: 'hanna',
    requer: { flags: ['relogio_vencido'] },
    versao: 2,
    resumo: 'A Dra. Hanna estuda há onze anos uma aurora que pulsa como um pulmão. Ela já mediu a Geleira e o Passo do Uivo; falta a leitura do ponto mais alto, o Cume do Vento Branco.',
    oferta: [
      'Sou a Hanna. Estudo as auroras há onze anos, e algo estranho acontece: a luz sobe e desce a cada três minutos, como um pulmão.',
      'Já tenho a leitura da Geleira do Uivo e a do Passo. Falta a do Cume do Vento Branco, e as minhas pernas não sobem mais aquilo.',
      'Lá em cima o céu é tão perto que a aurora aparece até de dia. Leve este caderno. Se as três leituras baterem no mesmo compasso, eu descubro o que respira.',
    ],
    aceita: ['O cume fica no fim da trilha que sobe da vila. O caderno anota sozinho quando você chegar lá em cima.'],
    lembrete: ['O Cume do Vento Branco, no alto da trilha. O caderno anota sozinho.'],
    itensIniciais: [['leitura_boreal', 1]],
    etapas: [
      { tipo: 'chegar', x: 1090, y: 8, r: 6, texto: 'Leve o caderno da Dra. Hanna ao Cume do Vento Branco', falas: ['No alto, o caderno estala sozinho. A aurora pulsa em verde e a neve responde.', 'O ponteiro marca o mesmo compasso das outras duas leituras.'] },
      { tipo: 'falar', npc: 'hanna', texto: 'Leve o caderno de volta à Dra. Hanna, em Vila Geada', falas: ['O cume no mesmo compasso da Geleira e do Passo! Não é coincidência: o Coração respira por baixo de toda a Geleira.', 'Onze anos achando que era o céu, e era o chão! Isto é seu: uma Pedra da Alvorada e a Glalitita, uma pedra de gelo que aprendeu a refletir luz.'] },
    ],
    recompensa: { itens: [['dawnStone', 1], ['glalitite', 1]], flags: { hannaCoracao: true } },
  },
];

// ----------------------------------------------------------------------------------------------------------------------
// Treinadores: [id (igual ao do mapa), nome, região no diário, oferta, vitória, derrota, [[espécie, nível, golpes]]]
// O dinheiro sai do nível médio da equipe (a batalha em si paga 0: o prêmio vem da recompensa da missão).
// ----------------------------------------------------------------------------------------------------------------------
const TREINADORES = [
  // Rota 15, Passo do Uivo (38 a 42)
  ['gt_esq1', 'Esquiador Caio', 'Rota 15, Passo do Uivo', 'Opa, tem gente na minha pista! Quer correr ou batalhar?', 'Perdi a pista e a corrida. Mas a pista continua sendo minha.', 'Pista minha! Treine mais e a gente se vê.',
    [[225, 39, ['iceShard', 'aerialAce', 'quickAttack']], [459, 40, ['iceShard', 'energyBall', 'powderSnow']]]],
  ['gt_pat1', 'Patinadora Lúcia', 'Rota 15, Passo do Uivo', 'O gelo da Rota 15 é fino de manhã. Quer escorregar numa batalha?', 'Uau, você patina bem. Perdi o equilíbrio e a luta.', 'Cheguei primeiro! Tente de novo.',
    [[215, 40, ['iceShard', 'nightSlash', 'quickAttack']], [124, 41, ['icyWind', 'psychic', 'confusion']]]],
  ['gt_alp1', 'Mochileira Dani', 'Rota 15, Passo do Uivo', 'Estou indo para a vila, mas uma batalha no caminho não atrasa ninguém.', 'Perdi, mas ganhei uma boa história para contar na estalagem.', 'Boa tentativa! Até a próxima.',
    [[220, 38, ['powderSnow', 'tackle', 'bite']], [221, 41, ['iceFang', 'earthquake', 'rockSlide']], [361, 39, ['iceShard', 'bite', 'icyWind']]]],
  ['gt_esq2', 'Esquiadora Ísis', 'Rota 15, Passo do Uivo', 'Cuidado, o vento joga a gente de lado. Quer ver quem se segura mais?', 'Você ficou de pé até o fim. O vento gosta de você.', 'O vento ajudou, juro.',
    [[361, 40, ['iceShard', 'bite', 'icyWind']], [86, 41, ['icyWind', 'aquaJet', 'headbutt']]]],
  ['gt_camp1', 'Campista Rubem', 'Rota 15, Passo do Uivo', 'Fogo e frio dão um bom chá. Quer provar numa batalha?', 'Meu chá esfriou. Passe aqui para tomar outro.', 'Está quente! Volte para tomar um chá.',
    [[58, 40, ['bite', 'flamethrower', 'crunch']], [37, 40, ['ember', 'quickAttack', 'flamethrower']], [59, 42, ['flamethrower', 'crunch', 'bodySlam']]]],
  // Lago Congelado (40 a 44)
  ['gt_pesc1', 'Pescador Nando', 'Lago Congelado', 'Silêncio, estou esperando o peixe morder. Mas uma batalha também vale.', 'Fiz barulho demais e o peixe fugiu. A culpa é sua.', 'O peixe não mordeu, mas você caiu direitinho.',
    [[340, 43, ['surf', 'earthquake', 'bodySlam']], [87, 42, ['icyWind', 'surf', 'headbutt']]]],
  ['gt_pat2', 'Patinador Rui', 'Lago Congelado', 'No gelo eu sou rei. Vem ver!', 'O rei caiu do gelo, mas a coroa fica comigo.', 'Rei do gelo outra vez!',
    [[87, 43, ['icyWind', 'surf', 'headbutt']], [365, 44, ['iceBeam', 'surf', 'bodySlam']]]],
  ['gt_pesc2', 'Pescadora Marta', 'Lago Congelado', 'Meu marido pesca, eu batalho. É divisão de trabalho.', 'Ele vai dizer que perdi de propósito.', 'Marido, vem ver o que eu fiz!',
    [[131, 44, ['iceBeam', 'surf', 'bodySlam']], [363, 41, ['powderSnow', 'surf', 'bodySlam']], [340, 42, ['surf', 'earthquake', 'bodySlam']]]],
  ['gt_clar1', 'Gêmea Nina', 'Lago Congelado', 'Meu primo Tor mora na vila, e eu estou aqui. Batalhe comigo enquanto ele não vem!', 'Perdi! O Tor não vai acreditar.', 'Ganhei! O Tor vai ficar com inveja.',
    [[363, 41, ['powderSnow', 'surf', 'bodySlam']], [362, 44, ['iceFang', 'crunch', 'blizzard']]]],
  // Rota 16, Campos Nevados (44 a 48)
  ['gt_alp2', 'Alpinista Otto', 'Rota 16, Campos Nevados', 'Antes da Geleira, um aquecimento. Uma batalha rápida?', 'Estou aquecido, obrigado.', 'Aqueceu pouco. Vá devagar na Geleira.',
    [[460, 45, ['blizzard', 'energyBall', 'iceShard']], [614, 46, ['iceHammer', 'slash', 'bodySlam']]]],
  ['gt_esq3', 'Esquiadora Bruna', 'Rota 16, Campos Nevados', 'Você está parado no meio da minha descida! Batalhe ou saia da frente.', 'Perdi a descida, e você ainda ficou na frente.', 'Descida limpa! Agora saia.',
    [[461, 46, ['iceShard', 'nightSlash', 'aerialAce']], [471, 47, ['iceBeam', 'shadowBall', 'quickAttack']]]],
  ['gt_camp2', 'Campista Tadeu', 'Rota 16, Campos Nevados', 'Acampar na neve pede fogo. O meu é de estimação.', 'Meu fogo apagou. Vou dormir abraçado no Pokémon.', 'O fogo é do tamanho do meu coração!',
    [[59, 47, ['flamethrower', 'crunch', 'extremeSpeed']], [38, 46, ['flamethrower', 'psychic', 'confusion']]]],
  ['gt_cien1', 'Cientista Elias', 'Rota 16, Campos Nevados', 'Estudo como o gelo muda de forma. Quer ser meu experimento?', 'Interessante. Meus dados acabaram de mudar.', 'Dado confirmado: o gelo vence.',
    [[615, 46, ['icyWind', 'auroraBeam', 'flashCannon']], [584, 47, ['blizzard', 'icyWind', 'freezeDry']], [866, 47, ['iceBeam', 'psychic', 'knockOff']]]],
  ['gt_pat3', 'Patinadora Cléo', 'Rota 16, Campos Nevados', 'O riacho congelado escorrega até a gente bater em alguma coisa. Quer ser essa coisa?', 'Escorreguei, bati em você e ainda perdi.', 'Escorreguei direto para a vitória!',
    [[478, 47, ['iceBeam', 'shadowBall', 'hex']], [87, 46, ['icyWind', 'surf', 'headbutt']]]],
  ['gt_alp3', 'Alpinista Zilda', 'Rota 16, Campos Nevados', 'Adiante fica o paredão. Antes, mostre que sabe escalar!', 'Escalou bem. Boa subida.', 'Ainda falta fôlego. Treine mais.',
    [[221, 46, ['iceFang', 'earthquake', 'rockSlide']], [473, 48, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_guarda1', 'Guarda Ênio', 'Rota 16, Campos Nevados', 'Em nome do parque, ninguém passa sem treino. Mostre o que sabe!', 'Pode seguir. Cuidado lá em cima.', 'Treine mais. A Geleira não perdoa.',
    [[713, 46, ['avalanche', 'crunch', 'bodySlam']], [362, 47, ['blizzard', 'crunch', 'iceFang']]]],
  ['gt_lenhador', 'Lenhador Ivo', 'Atalho do Lenhador', 'Você achou o meu atalho! Quem acha, enfrenta.', 'Perdi o atalho. Pode usar, mas não conte a ninguém.', 'O atalho é meu! Volte pela Rota 16.',
    [[68, 46, ['closeCombat', 'rockSlide', 'earthquake']], [460, 47, ['blizzard', 'energyBall', 'iceShard']]]],
  // Geleira do Uivo (47 a 51)
  ['gt_alp4', 'Alpinista Hugo', 'Geleira do Uivo', 'A neve aqui é dura. Quer testar a sua?', 'A neve cedeu debaixo de mim.', 'Firme como gelo!',
    [[713, 48, ['avalanche', 'crunch', 'bodySlam']], [975, 50, ['iceSpinner', 'earthquake', 'bodySlam']]]],
  ['gt_esq4', 'Esquiador Léo', 'Geleira do Uivo', 'Descer a Geleira é fácil, o difícil é subir. Quer ver quem sobe mais rápido?', 'Perdi a corrida e a batalha.', 'Subi mais rápido!',
    [[461, 50, ['iceShard', 'nightSlash', 'iceFang']], [473, 50, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_cien2', 'Cientista Vera', 'Geleira do Uivo', 'A luz da aurora muda o comportamento dos Pokémon. Quero medir o seu!', 'Mediu bem, treinou melhor.', 'Hipótese confirmada!',
    [[615, 48, ['icyWind', 'auroraBeam', 'flashCannon']], [584, 50, ['blizzard', 'icyWind', 'freezeDry']], [866, 51, ['iceBeam', 'psychic', 'knockOff']]]],
  ['gt_alp5', 'Alpinista Nilo', 'Geleira do Uivo', 'Subi sem corda e sem plano. Agora quero subir sem derrota.', 'Perdi a minha marca, mas valeu a subida.', 'Sem derrota, ainda!',
    [[614, 49, ['iceHammer', 'closeCombat', 'slash']], [460, 50, ['blizzard', 'energyBall', 'iceShard']]]],
  ['gt_esq5', 'Esquiadora Tati', 'Geleira do Uivo', 'A neve aqui é pó puro, fofa feito nuvem. Vem escorregar!', 'Fui varrida como poeira!', 'Nuvem fofa, vitória fofa!',
    [[478, 50, ['iceBeam', 'shadowBall', 'hex']], [471, 51, ['iceBeam', 'shadowBall', 'quickAttack']], [873, 49, ['icyWind', 'airSlash', 'blizzard']]]],
  ['gt_guarda2', 'Guarda Bento', 'Geleira do Uivo', 'Patrulha da Geleira. Para passar por mim, convença na batalha!', 'Convenceu. Pode seguir, mas ande com cuidado.', 'Não convenceu. Treine e volte.',
    [[131, 51, ['iceBeam', 'surf', 'psychic']], [713, 50, ['avalanche', 'crunch', 'bodySlam']]]],
  ['gt_pat4', 'Patinadora Gabi', 'Geleira do Uivo', 'O gelo azul é o mais liso. Quer escorregar numa luta?', 'Escorreguei e perdi.', 'Gelo azul, vitória azul!',
    [[997, 50, ['iceFang', 'dragonClaw', 'crunch']], [471, 49, ['iceBeam', 'shadowBall', 'quickAttack']]]],
  // Cume do Vento Branco (54 a 58)
  ['gt_guardiao', 'Guardião Hakon', 'Cume do Vento Branco', 'Poucos chegam ao cume. Menos ainda saem daqui sem lutar comigo.', 'O vento escolheu você.', 'O vento não escolheu você. Ainda.',
    [[362, 56, ['blizzard', 'crunch', 'iceFang']], [473, 57, ['earthquake', 'iceShard', 'stoneEdge']], [975, 57, ['iceSpinner', 'earthquake', 'bodySlam']], [998, 58, ['glaciate', 'dragonClaw', 'iceFang']]]],
  // Fiorde do Levante (50 a 54)
  ['gt_mar1', 'Marinheiro Beto', 'Fiorde do Levante', 'Marinheiro de gelo! Sem barco, mas com muito Pokémon.', 'Afundei sem barco.', 'Navegando em vitória!',
    [[91, 52, ['iceBeam', 'surf', 'iceShard']], [130, 53, ['surf', 'crunch', 'iceFang']], [87, 51, ['icyWind', 'surf', 'headbutt']]]],
  ['gt_mar2', 'Nadadora Iris', 'Fiorde do Levante', 'A água do fiorde é fria, mas me faz bem. Quer testar a sua coragem?', 'Mergulhei fundo e perdi.', 'Você foi bem, mas eu fui melhor!',
    [[131, 52, ['iceBeam', 'surf', 'psychic']], [365, 53, ['iceBeam', 'surf', 'bodySlam']], [226, 52, ['surf', 'airSlash', 'icyWind']]]],
  // Caverna de Gelo Cristalino (54 a 60)
  ['gt_cav1', 'Espeleólogo Raul', 'Caverna de Gelo Cristalino', 'Um passo errado no gelo e a gente desliza até a parede. Quer escorregar comigo?', 'Bati na parede, mas aprendi a rota.', 'Escorreguei, mas cheguei na frente!',
    [[713, 55, ['avalanche', 'bodySlam', 'crunch']], [615, 55, ['icyWind', 'auroraBeam', 'flashCannon']]]],
  ['gt_cav2', 'Espeleóloga Sara', 'Caverna de Gelo Cristalino', 'As colunas de gelo servem de parada. Servem também de esconderijo.', 'Ei, você me achou atrás da coluna!', 'Nem me viu atrás da coluna!',
    [[478, 56, ['iceBeam', 'shadowBall', 'hex']], [584, 56, ['blizzard', 'icyWind', 'freezeDry']]]],
  ['gt_cav3', 'Pesquisador Teodoro', 'Caverna de Gelo Cristalino', 'Estudo as rachaduras do rio congelado. Uma delas passa aqui perto.', 'Minha pesquisa não previa uma derrota.', 'Pesquisa confirmada: eu ganho!',
    [[866, 57, ['iceBeam', 'psychic', 'knockOff']], [615, 57, ['icyWind', 'auroraBeam', 'flashCannon']], [473, 56, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_cav4', 'Esquiador Ugo', 'Caverna de Gelo Cristalino', 'Dentro da caverna o gelo é mais liso. Quer ver como eu esquio?', 'Esqui nenhum me salvou.', 'Esqui de campeão!',
    [[461, 58, ['iceShard', 'nightSlash', 'iceFang']], [473, 58, ['earthquake', 'iceShard', 'stoneEdge']]]],
  ['gt_cav5', 'Guarda Henrique', 'Caverna de Gelo Cristalino', 'Guardo o salão azul. Quem quer acender os braseiros e abrir o altar enfrenta primeiro a mim.', 'Pode abrir o altar.', 'O altar fica fechado para você.',
    [[713, 58, ['avalanche', 'crunch', 'bodySlam']], [362, 58, ['blizzard', 'crunch', 'iceFang']], [975, 59, ['iceSpinner', 'earthquake', 'bodySlam']]]],
  ['gt_cav6', 'Sacerdotisa do Gelo Brenda', 'Caverna de Gelo Cristalino', 'A luz do Coração me escolheu como guardiã. Prove que merece vê-la.', 'A luz escolheu você.', 'A luz ainda não escolheu você.',
    [[478, 59, ['iceBeam', 'shadowBall', 'hex']], [866, 59, ['iceBeam', 'psychic', 'knockOff']], [471, 60, ['iceBeam', 'shadowBall', 'quickAttack']], [365, 58, ['iceBeam', 'surf', 'bodySlam']]]],
];

// Cada treinador de rota luta uma vez ao conversar (NPCS[id].treinador, src/story/missoes/npcs.js): não é missão e não entra no diário.
const TREINADORES_NPC = {};
for (const [id, nome, , oferta, vitoria, derrota, equipe] of TREINADORES) {
  const media = equipe.reduce((s, e) => s + e[1], 0) / equipe.length;
  const dinheiro = Math.round((media * equipe.length * 14) / 10) * 10;
  TREINADORES_NPC[id] = { treinador: { batalha: { id, nome, equipe }, falas: [oferta], vitoria: [vitoria], derrota: [derrota], depois: [vitoria], dinheiro } };
}

// ----------------------------------------------------------------------------------------------------------------------
// NPCs vivos
// ----------------------------------------------------------------------------------------------------------------------
export const NPCS = {
  ...TREINADORES_NPC,
  dona_branca: {
    diario: { itens: [['iceHeal', 1], ['superPotion', 1]], falas: ['Seu sorvete do dia! De Vanillite, gelado, sem corante e sem pena.', 'Coma logo: ele derrete a friagem do corpo.'], depois: ['O sorvete de hoje já foi. Volte amanhã e traga fome!'] },
    falas: [
      { se: { hora: 'noite' }, linhas: ['À noite as Vanillite trabalham mais devagar, e o sorvete sai mais cremoso.'] },
      { linhas: ['Bem-vindo à Sorveteria! O sorvete é feito por Vanillite, e só por elas.'] },
    ],
  },
  tor: {
    troca: {
      quer: { especie: 215, nome: 'um Sneasel comum' },
      da: { dex: 215, forma: 'hisui', nivel: 40, apelido: 'Ciscos' },
      repetivel: false,
      falas: {
        pede: ['Tenho um Sneasel de Hisui, e a Tora morre de inveja. Troco por um Sneasel comum, topa?'],
        aceita: ['Fechado! Cuide do Ciscos: ele só arranha quem merece.'],
        recusa: ['Tudo bem. O Ciscos fica comigo.'],
        falta: ['Você não tem um Sneasel? Procure na Rota 16.'],
        depois: ['O Ciscos é seu agora. Mande um oi por mim.'],
      },
    },
  },
  tora: {
    troca: {
      quer: { especie: 713, nome: 'um Avalugg comum' },
      da: { dex: 713, forma: 'hisui', nivel: 45, apelido: 'Pedrinho' },
      repetivel: false,
      falas: {
        pede: ['Tenho um Avalugg de Hisui. O Tor ficou com o Sneasel, e eu quero um Avalugg comum. Aceita trocar?'],
        aceita: ['Que bom! Ele é pesado, mas é um fofo.'],
        recusa: ['Sem problema. A gente tenta outro dia.'],
        falta: ['Você ainda não tem um Avalugg comum. Eles vivem na Geleira do Uivo.'],
        depois: ['Agora tenho um Avalugg comum! E o Pedrinho vai gostar de passear com você.'],
      },
    },
  },
  hanna: {
    presente: { itens: [['alakazite', 1]], requer: { insignias: 3 }, falas: ['Você tem cara de quem treina com carinho. Esta pedra é de um Alakazam que me ajudou no começo dos estudos.', 'Ele agora vive no campo, mas deixou a pedra. Cuide dela.'], depois: ['A pedra do Alakazam está em boas mãos.'] },
    falas: [
      { se: { missoes: ['sq_aurora_boreal'] }, linhas: ['O Coração respira cada vez mais forte. Se descer à caverna, leve proteção. E fogo.'] },
      { se: { hora: 'noite' }, linhas: ['A aurora está dançando agora. Veja pela lente do telescópio: ela pulsa a cada três minutos.'] },
    ],
  },
  eremita_gelo: {
    tutor: {
      golpes: [
        { golpe: 'icyWind', dinheiro: 1500 },
        { golpe: 'iceBeam', dinheiro: 3000 },
        { golpe: 'freezeDry', dinheiro: 4000 },
        { golpe: 'avalanche', item: ['neverMeltIce', 1] },
        { golpe: 'blizzard', item: ['iceStone', 1] },
      ],
      todos: false,
      falas: {
        ola: ['Ninguém sobe até aqui sem motivo. Quer aprender um golpe de gelo? Eu ensino por um preço justo.'],
        tchau: ['Volte quando o vento deixar. O vale não vai a lugar nenhum.'],
        naoPode: ['Esse Pokémon não aprende esse golpe. O gelo escolhe quem aprende.'],
        semPagar: ['Sem pagamento, nada de golpe. O frio cobra.'],
      },
    },
  },
  estalajadeira: {
    falas: [
      { se: { missoes: ['sq_avalanche'] }, linhas: ['Os três nomes saíram do mural. O do Jacinto fica, e hoje pesa menos. Obrigada.'] },
    ],
  },
  aldo: {
    falas: [
      { se: { hora: 'noite' }, linhas: ['De noite o fiorde canta. É o vento passando pelo gelo do mar, e dá um calafrio gostoso.'] },
    ],
  },
};
