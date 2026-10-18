// Vila Jandaia e a Ilha Jandaia: prédios, salas feitas à mão, moradores, enfeites e a colina do altar.
import { sala, LOOK } from './jandaia-util.mjs';
import { perto } from './jandaia-terreno.mjs';

const placa = (t) => ({ text: t });

export function vila(M, C, J) {
  // ---------------- prédios ----------------
  const pr = (kind, x, y, to, col = 3, extra = {}) => C.predio(kind, x, y, to ? { to, ...extra } : { ...extra }, col);
  pr('center', 62, 592, 'centro_jandaia', 4);
  pr('mart', 74, 592, 'loja_jandaia');
  pr('houseB', 96, 592, 'creche_iara');
  pr('houseYellow', 106, 592, 'pousada_praia');
  pr('houseC', 62, 607, 'casa_tupa');
  pr('houseA', 76, 607, null, 3, { interior: { tipo: 'casa', npc: { id: 'seu_cacau', name: 'Seu Cacau', look: LOOK.pescador, lines: ['Cacau é meu apelido. Meu nome verdadeiro é Cacilda, mas ninguém acredita.', 'Aqui na ilha a gente acorda com os Wingull e dorme com as ondas.'] } } });
  pr('houseBlue', 100, 607, null, 3, { interior: { tipo: 'sobrado' } });
  pr('houseC', 113, 607, null, 3);
  pr('houseA', 97, 573, 'terminal_jandaia');        // Píer da Balsa
  M.path('path', [[100, 577], [93, 579]], 2, 0);
  // acampamento dos pesquisadores, na Selva Grande, ao lado da trilha para o templo
  pr('houseMiner', 92, 766, 'acampamento_selva');
  M.comment('o acampamento: um chão limpo na selva à frente da casa-base');
  M.ellipse('dark', 96, 770, 13, 7, 0.4, ['forest', 'dark', 'tall', 'path']);
  M.path('path', [[95, 770], [96, 775], [104, 772]], 3, 0.5);

  // ---------------- placas ----------------
  const P = (x, y, t) => C.poeProx('sign', x, y, placa(t), 6);
  P(92, 580, 'PÍER DA BALSA\nBalsa para Cidade Coral: 9h, 14h e 19h.\nO barqueiro cobra ₽300 e conta histórias de graça.');
  P(88, 596, 'VILA JANDAIA\n"Aqui o dia é comprido e a rede é curta."');
  P(60, 597, 'CENTRO POKÉMON\nTelhado de palha, rede para quem cansou e uma enfermeira que nunca cansa.');
  P(83, 597, 'MERCADO JANDAIA\nFrutas tropicais, Bola Rápida e Bola Ninho.');
  P(94, 597, 'CRECHE DA VÓ IARA\n"Um ovo por dia. Não mexa no cesto sem pedir."');
  P(105, 597, 'POUSADA DA PRAIA\nQuartos com vista. O mural de surfe é de graça.');
  P(60, 612, 'CASA DO PESCADOR TUPÃ\n"Se a jangada não está, eu estou pescando."');
  P(131, 614, 'COLINA DO ALTAR\nSó sobe quem os quatro Capitães já reconheceram. (Dizem. Ninguém nunca perguntou ao morro.)');
  P(88, 764, 'ACAMPAMENTO DOS PESQUISADORES\nDra. Ybi, arqueóloga. Favor não mexer nas tabuletas.');
  P(121, 761, 'TEMPLO DAS RAÍZES\nAs raízes crescem e recuam. Não é a placa que está torta.');
  P(148, 714, 'SELVA GRANDE\nParedão de cipó: só se sobe com um Pokémon que escale.');
  P(203, 745, 'CACHOEIRA DO VÉU VERDE\nA água cai tão devagar que parece cortina.');
  P(204, 872, 'PRAIA DO CIPÓ\nCuidado: o cipó puxa para cima. A maré, para baixo.');

  // ---------------- praça e rua ----------------
  C.poe('well', 80, 601); C.poe('bench', 70, 601); C.poe('bench', 102, 601); C.poe('lamp', 84, 597); C.poe('lamp', 90, 597); C.poe('lamp', 74, 597); C.poe('lamp', 100, 597);
  for (const x of [60, 82, 94, 104, 112]) C.poe('flowerpot', x, 596);
  C.poe('guardaSol', 66, 602); C.poe('beachStall', 104, 603, { text: 'Barraca do Zeca: água de coco, tapioca e protetor solar sabor goiaba.' });
  C.poe('surfboard', 70, 606); C.poe('surfboard', 71, 606); C.poe('crate', 108, 606); C.poe('barrel', 109, 606);
  C.poe('varal', 67, 614); C.poe('jangada', 66, 619, placa('Jangada do Tupã, "A Rebelde". Ela rebela contra qualquer maré.'));
  // coqueiros na vila e na orla
  C.espalha('coqueiro', 90, [34, 570, 134, 82], { tipos: ['sand', 'grass'], dist: 3, margem: 0 });
  C.espalha('coqueiro', 22, [34, 570, 134, 82], { tipos: ['sand'], dist: 2 });

  // ---------------- colina do altar ----------------
  C.poe('altar', 145, 598, { id: 'altar_koko', text: 'Um altar de pedra entalhado com um relâmpago. Quatro buracos redondos, um para cada Capitão.' });
  C.poe('statue', 140, 599); C.poe('statue', 151, 599); C.poe('lanternaPedra', 141, 603); C.poe('lanternaPedra', 150, 603);
  C.poe('torch', 143, 596); C.poe('torch', 148, 596);
  // ---------------- cabo ao sul ----------------
  C.poe('beachStall', 119, 641, { text: 'Barraca fechada. O bilhete diz "volto já". O bilhete está aí desde sábado.' });

  // ---------------- moradores ----------------
  const ppl = J.people;
  ppl.push(
    { id: 'pescador_tupa_fora', name: 'Pescador Tupã', look: LOOK.pescador, x: 67, y: 616, dir: 'down', wander: 2, lines: ['Estou secando a rede. A rede está secando a paciência.', 'Quem for à Selva Grande: leve um Pokémon que suba. O resto é só coragem, e coragem não escala.'] },
    { id: 'turista_praia', name: 'Turista', look: LOOK.turista, x: 76, y: 603, dir: 'right', wander: 3, lines: ['Vim passar um fim de semana. Faz seis meses.', 'Os Oricorio daqui dançam o dia todo. Eu tento imitar. Não tem como.'] },
    { id: 'surfista_jandaia', name: 'Surfista Maruê', look: LOOK.surf, x: 104, y: 606, dir: 'left', wander: 2, lines: ['A onda boa vem às sete da manhã e às quatro da tarde. A mais ou menos vem toda hora.', 'Se o mar ficar quieto demais, é porque tem algo grande debaixo dele. Ou é só o mar descansando.'] },
    { id: 'menina_ovo', name: 'Menina Cacá', look: 'menina', kid: true, x: 99, y: 599, dir: 'down', wander: 2, lines: ['A Vó Iara deixa eu contar os ovos. Hoje estão todos aí. Ontem faltou um. Era o dela.', 'O Chansey faz sopa de ovo. Não pergunte de quem são os ovos.'] },
  );
  // os 4 Capitães da ilha: um em cada praia (a missão "O guardião da ilha" os usa)
  const cap = (id, nome, look, x, y, dir, fala) => { const [px, py] = perto(M, ['sand'], x, y, 14) ?? [x, y]; ppl.push({ id, name: nome, look, x: px, y: py, dir, lines: fala }); };
  cap('cap_jandaia_norte', 'Capitã Sereia', LOOK.capitaoa, 70, 572, 'down', ['Eu sou a Capitã do Norte. O mar aqui é manso, mas o meu time não é.', 'Só passa pelo guardião quem passa por nós quatro.']);
  cap('cap_jandaia_oeste', 'Capitão Pôr-do-Sol', LOOK.capitao, 36, 606, 'right', ['O oeste é onde o dia acaba. O meu time, não.', 'Quer subir a colina? Primeiro, o Pôr-do-Sol.']);
  cap('cap_jandaia_sul', 'Capitã Maré Cheia', LOOK.capitaoa, 112, 643, 'up', ['No sul a maré sobe duas vezes ao dia. Meus Pokémon sobem mais vezes.', 'Respeite o regulamento: um Pokémon de cada vez.']);
  cap('cap_jandaia_leste', 'Capitão Nascente', LOOK.capitao, 164, 604, 'left', ['O sol nasce aqui primeiro, depois nasce no resto do mundo.', 'Eu sou o último dos quatro. Depois de mim, só o morro.']);
}

// ======================== salas feitas à mão ========================
export function salasVila(J) {
  const I = J.interiors;
  const livro = (x, y, t) => ({ kind: 'shelf', x, y, text: t });

  // ----- Centro Pokémon: telhado de palha, redes -----
  I.push({
    id: 'centro_jandaia', name: 'Centro Pokémon da Vila Jandaia', rows: sala(17, 10, { chao: 't' }),
    objects: [
      { kind: 'counter', x: 6, y: 3 }, { kind: 'pc', x: 10, y: 2 }, { kind: 'machine', x: 12, y: 2, text: 'A máquina de cura. Ela toca uma musiquinha de ukulele.' },
      { kind: 'bed', x: 1, y: 3, text: 'Uma rede de pescador esticada entre dois pilares. Balança sozinha, de tão macia.' }, { kind: 'bed', x: 1, y: 5, text: 'Outra rede. Tem um Pokémon dormindo nela, enrolado.' },
      { kind: 'plant', x: 15, y: 2 }, { kind: 'plant', x: 15, y: 7 }, { kind: 'plant', x: 3, y: 2 },
      livro(14, 2, 'Revistas: "Surfe & Saúde", "Guia das Jandaias", "Receitas de Tapioca para Treinadores".'),
      { kind: 'table', x: 11, y: 6, text: 'Um cesto com cocos geladinhos. Cortesia da casa.' },
    ],
    decor: [{ kind: 'rug', x: 8, y: 6 }],
    people: [
      { id: 'joy_centro_jandaia', name: 'Enfermeira Joy', look: LOOK.joy, x: 7.5, y: 2.6, dir: 'down', lines: ['Bem-vindo ao Centro Pokémon da Vila Jandaia!', 'Prontinho! Seus Pokémon estão descansados e com cheiro de coco.'], heal: true, all: true },
      { id: 'hospede_centro_j', name: 'Mochileiro', look: LOOK.explorador, x: 4, y: 6, dir: 'right', lines: ['Vim do continente de balsa. Enjoei três vezes. Valeu cada onda.'] },
    ],
  });

  // ----- Mercado: frutas tropicais, Bola Rápida, Bola Ninho -----
  I.push({
    id: 'loja_jandaia', name: 'Mercado da Vila Jandaia', rows: sala(14, 9, { chao: 't' }),
    objects: [
      { kind: 'counter', x: 1, y: 3 },
      ...[7, 8, 9, 10].map((x) => livro(x, 2, 'Bolas Rápidas e Bolas Ninho em pilhas. Embaixo, uma cesta de cocos e mangas.')),
      livro(9, 5, 'Frutas tropicais: manga, caju, graviola e coco verde. A etiqueta diz "fresquinhas, colhidas hoje de manhã".'), livro(10, 5, 'Frutas tropicais: manga, caju, graviola e coco verde. A etiqueta diz "fresquinhas, colhidas hoje de manhã".'),
      { kind: 'plant', x: 12, y: 2 }, { kind: 'crate', x: 12, y: 6, text: 'Uma caixa de mangas. Cheiro maravilhoso. Não é de graça.' },
    ],
    decor: [],
    people: [
      { id: 'vendedor_jandaia', name: 'Vendedor', look: LOOK.vendedor, x: 2, y: 2.6, dir: 'down', lines: ['Bem-vindo ao Mercado da Vila Jandaia!'] },
      { id: 'cliente_lj', name: 'Pescadora', look: LOOK.nadadora, x: 8, y: 6, dir: 'down', wander: 1, lines: ['Aqui eu compro Bola Ninho. Pokémon de selva gosta de ninho. Pergunte a qualquer Passimian.'] },
    ],
  });

  // ----- Creche da Vó Iara: ovos, ninhos, Chansey ajudante -----
  I.push({
    id: 'creche_iara', name: 'Creche da Vó Iara', rows: sala(17, 11, { chao: 'f' }),
    objects: [
      { kind: 'crate', x: 3, y: 3, text: 'Um cesto forrado de palha, cheio de ovos de todas as cores. Cada um tem um nome escrito a lápis.' }, { kind: 'crate', x: 4, y: 3, text: 'Mais um cesto de ovos. Este está quentinho.' },
      { kind: 'bale', x: 12, y: 3, text: 'Um ninho de palha trançada. Vazio. Ainda quente.' }, { kind: 'bale', x: 13, y: 3, text: 'Um ninho de palha. Tem uma penugem amarela dentro.' }, { kind: 'bale', x: 14, y: 3, text: 'Um ninho de palha. Tem uma casquinha rachada.' },
      { kind: 'table', x: 7, y: 5, text: 'Uma mesa com xícaras, um bule e uma lista: "ovos de hoje", "ovos de amanhã" e "ovos de quando o Chansey quiser".' },
      { kind: 'shelf', x: 1, y: 2, text: 'Livros de criação: "Como Chocar sem Perder a Cabeça", "Cantigas para Ovo", "Guia dos Bebês Pokémon".' }, { kind: 'plant', x: 15, y: 2 }, { kind: 'plant', x: 1, y: 8 },
    ],
    decor: [{ kind: 'rug', x: 8, y: 7 }, { kind: 'window', x: 6, y: 1, oy: 3 }, { kind: 'window', x: 10, y: 1, oy: 3 }],
    people: [{ id: 'vo_iara', name: 'Vó Iara', look: LOOK.vovo, x: 9, y: 5, dir: 'down', lines: ['Eu cuido dos ovos desde antes de a balsa ter horário.', 'Cada ovo escolhe a hora de abrir. A gente só segura a mão.'] }],
    pets: [{ dex: 113, x: 5, y: 6, wander: 2, say: 'Chansey! (ela te entrega um ovo imaginário)' }, { dex: 175, x: 13, y: 5, wander: 1, sleep: true, say: 'Togepi dorme com um sorriso.' }, { dex: 172, x: 3, y: 7, wander: 2, say: 'Pichu!' }],
  });

  // ----- Casa do Pescador Tupã -----
  I.push({
    id: 'casa_tupa', name: 'Casa do Pescador Tupã', rows: sala(15, 9, { chao: 'f' }),
    objects: [
      { kind: 'bed', x: 1, y: 3, text: 'Uma rede de verdade, trançada à mão. Cheira a sal.' }, { kind: 'bed', x: 3, y: 3, text: 'Outra rede. Esta tem um cobertor de crochê.' },
      { kind: 'jangada', x: 8, y: 2, text: 'Uma jangada pequena sendo remendada dentro de casa. "Para dias de chuva", diz o Tupã.' },
      { kind: 'table', x: 6, y: 5, text: 'Peixe seco, farinha e um mapa das Jandaias rabiscado com marcas de anzol.' }, { kind: 'shelf', x: 12, y: 2, text: 'Carretéis, anzóis, boias e uma foto de um Wailmer gigante. "Esse escapou", diz a legenda.' }, { kind: 'plant', x: 13, y: 6 },
    ],
    decor: [{ kind: 'rug', x: 5, y: 6 }, { kind: 'window', x: 5, y: 1, oy: 3 }],
    people: [{ id: 'pescador_tupa', name: 'Pescador Tupã', look: LOOK.pescador, x: 9, y: 5, dir: 'left', lines: ['Aqui o relógio é a maré. Quando sobe, eu vou pescar. Quando desce, eu volto.', 'Tem um Exeggutor de Alola que eu crio aqui na ilha. Tem um jeito de ele andar que é mais coqueiro que Pokémon.'] }],
  });

  // ----- Pousada da Praia -----
  I.push({
    id: 'pousada_praia', name: 'Pousada da Praia', rows: sala(19, 10, { chao: 'f' }),
    objects: [
      { kind: 'bed', x: 2, y: 3, text: 'Um quarto da pousada. Lençóis com estampa de onda.' }, { kind: 'bed', x: 5, y: 3, text: 'Quarto 2. Tem uma toalha em forma de cisne.' }, { kind: 'bed', x: 14, y: 3, text: 'Quarto 3, vista para o mar. A janela está aberta.' }, { kind: 'bed', x: 16, y: 3, text: 'Quarto 4, só para quem acordar cedo.' },
      { kind: 'mural', x: 8, y: 2, text: 'Mural de surfe: três ondas pintadas, uma com um Pokémon d’água de prancha. Na assinatura se lê "Maruê, aos dezesseis".' },
      { kind: 'surfboard', x: 12, y: 3 }, { kind: 'surfboard', x: 13, y: 3 },
      { kind: 'table', x: 8, y: 6, text: 'Livro de visitas: "Muito bom! Volto!", "Os Pokémon daqui são simpáticos", "Cadê o Wi-Fi? (escrito por um Rotom)".' }, { kind: 'plant', x: 1, y: 8 }, { kind: 'plant', x: 17, y: 8 },
    ],
    decor: [{ kind: 'rug', x: 7, y: 7 }, { kind: 'window', x: 4, y: 1, oy: 3 }, { kind: 'window', x: 12, y: 1, oy: 3 }],
    people: [
      { id: 'recepcionista_pousada', name: 'Dona Nalva', look: 'mae', x: 10, y: 5, dir: 'down', lines: ['Bem-vindo à Pousada da Praia! O café da manhã é às oito. O almoço é às duas. O jantar é quando a fome bater.', 'Os quartos são todos com vista para o mar. Os fundos também.'] },
      { id: 'hospede_pousada', name: 'Casal de Turistas', look: LOOK.turista, x: 15, y: 6, dir: 'left', wander: 1, lines: ['Viemos pelos Pokémon de Alola. O Rattata daqui usa óculos de sol, eu juro.'] },
    ],
  });

  // ----- Píer da Balsa -----
  I.push({
    id: 'terminal_jandaia', name: 'Píer da Balsa', rows: sala(15, 8, { chao: 'f' }),
    objects: [
      { kind: 'sign', x: 6, y: 2, text: 'QUADRO DE HORÁRIOS\nVila Jandaia → Cidade Coral: 9h, 14h e 19h.\nCidade Coral → Vila Jandaia: 8h, 13h e 18h.\nPasse na bilheteira ou fale com o barqueiro, no fim do píer.' },
      { kind: 'bench', x: 2, y: 5 }, { kind: 'bench', x: 10, y: 5 }, { kind: 'crate', x: 12, y: 2, text: 'Caixas de mangas para o continente. Estão marcadas com "FRÁGIL: É FRUTA".' }, { kind: 'plant', x: 1, y: 2 },
      { kind: 'table', x: 3, y: 2, text: 'Uma vitrine de conchas catalogadas. Todas com nome. Uma delas se chama "Marta".' },
    ],
    decor: [{ kind: 'rug', x: 6, y: 5 }],
    people: [{ id: 'bilheteira_jandaia', name: 'Bilheteira Lídia', look: LOOK.vovo, x: 8, y: 3, dir: 'down', lines: ['As balsas saem às nove, às duas e às sete. Se perder, tem a próxima. Se perder todas, tem a pousada.', 'O barqueiro está no fim do píer. Ele não morde. Só conversa.'] }],
  });

  // ----- Acampamento dos Pesquisadores -----
  I.push({
    id: 'acampamento_selva', name: 'Acampamento dos Pesquisadores', rows: sala(17, 10, { chao: 'f' }),
    objects: [
      { kind: 'table', x: 7, y: 3, text: 'MAPA DO TEMPLO: três andares riscados a carvão. No átrio: "regar a flor-interruptor"; nas galerias: "correnteza, comportas"; na câmara: "raízes de luz, só com golpe de Planta".' },
      { kind: 'table', x: 11, y: 3, text: 'Três encaixes vazios na madeira, do formato de tabuletas de pedra. Um bilhete: "faltam as tabuletas, uma por andar".' },
      { kind: 'shelf', x: 1, y: 2, text: 'Cadernos de campo, lupas e um pote com sementes que brilham no escuro.' }, { kind: 'shelf', x: 2, y: 2, text: 'Fragmentos de cerâmica etiquetados: "raiz, séc. ?", "raiz, séc. ??", "raiz, séc. não sei".' },
      { kind: 'crate', x: 14, y: 2, text: 'Equipamento de escalada. Corda, grampos e um bilhete: "NÃO USAR COMO VARAL".' }, { kind: 'plant', x: 15, y: 6 }, { kind: 'bed', x: 1, y: 6, text: 'Um colchonete de campanha. Dobrado com capricho.' },
    ],
    decor: [{ kind: 'rug', x: 7, y: 6 }, { kind: 'window', x: 5, y: 1, oy: 3 }],
    people: [
      { id: 'dra_ybi', name: 'Dra. Ybi', look: LOOK.pesquisadora, x: 8, y: 5, dir: 'down', lines: ['Sou arqueóloga. Estudo as raízes do templo, que são mais antigas que a ilha e mais teimosas que eu.', 'O templo tem três andares. Cada um guarda uma tabuleta. Sem as três, o mapa não fecha.'] },
      { id: 'pesq_ybi_1', name: 'Assistente Gil', look: LOOK.explorador, x: 13, y: 6, dir: 'left', wander: 1, lines: ['Eu carrego as caixas. A Dra. Ybi carrega o raciocínio. Divisão justa.'] },
    ],
  });
}
