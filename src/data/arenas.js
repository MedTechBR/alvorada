// Arenas dinâmicas dos ginásios: só dados (motor em src/combat/arena-ginasio.js, peças em src/combat/arena-pecas.js,
// documentação completa em docs/arenas.md). A chave é o id da batalha do líder (o mesmo das cenas: batalha.id).
//
// Campos de uma arena:
//   id, nome (faixa da abertura), tipo, cor (faixas), sala (id do interior; sem sala = coordenadas do mapa aberto),
//   area [x, y, w, h] em blocos relativos à sala, posicoes { jogador, lider } (onde cada um fica durante a luta;
//   opcional), abertura (fala do líder), musica { luta }, gritos { idDaPeca: fala } (quando o líder aciona aquela
//   peça), as { titulo, fala, grito, corFx } (entrada do último Pokémon), poder { tipo: 'dynamax' | 'mega', quando:
//   'entrada' | 'ps', ps } (src/combat/poder.js), acende (sala escura acende na luta), pecas [ { tipo, id?, ativo?,
//   ...params } ], fases [ { id, nome, quando: { desmaios, psEquipe, as, asPS }, titulo, fala, liga, desliga, ajusta,
//   evento, musica, final } ]. A fase 0 vale desde o início (sem "quando").
// Os números (avisos em s, dano em fração dos PS máximos, períodos em s) são os de um ginásio médio: o motor escala
// tudo pelo nível do ás (DIFICULDADE em arena-ginasio.js). Nenhum perigo acerta com menos de AVISO_MIN (0,75 s) de aviso.
//
// ESTÁDIOS (outubro de 2026, pedido do dono: "as arenas ainda estão muito pequenas, preciso que elas sejam realmente
// enormes"): toda luta de líder, da Elite, da Campeã, da Dra. Véspera e do Necrozma acontece num estádio próprio
// (src/world/estadios.js), uma sala de 50 x 36 com a luta em 48 x 32 blocos (ARENA). A abertura leva o jogador e o
// líder para lá e o fim traz os dois de volta ao ginásio. Os perigos foram multiplicados e espalhados pelo espaço
// (mais plantas, mais coberturas, mais faixas ao mesmo tempo, anéis maiores) e cada estádio tem terreno do tema:
// água, lava, teia, pedras e caixotes onde dá para subir. Coordenadas abaixo: blocos relativos à sala do estádio; a
// arena vai de x 1 a 48 e de y 3 a 34; esp() espelha da esquerda para a direita (bloco x ↔ 49 - x), para a arena
// ficar justa para os dois lados.

const ARENA = [1, 3, 48, 32];
const POS = { jogador: [24.5, 33.2], lider: [24.5, 4.3] };
const esp1 = (p) => (p.length === 4 ? [50 - p[0] - p[2], p[1], p[2], p[3]] : [49 - p[0], ...p.slice(1)]);
// pontos ou retângulos e os espelhados (sem repetir o que cai no meio)
const esp = (...ps) => ps.flatMap((p) => { const q = esp1(p); return q[0] === p[0] ? [p] : [p, q]; });
// n pontos (blocos inteiros) numa elipse em volta de (cx, cy)
const anel = (cx, cy, rx, ry, n, fase = 0) => Array.from({ length: n }, (_, i) => { const a = fase + i / n * Math.PI * 2; return [Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)]; });
// arquibancada de cima (os objetos "stands" das fileiras 1 e 2 de todo estádio)
const TRIBUNA = [[1, 1, 15, 2], [17, 1, 16, 2], [34, 1, 15, 2]];
const est = (id) => ({ sala: 'estadio_' + id, area: ARENA, posicoes: POS });

export const ARENAS = {
  // ------------------------------------------------------------------ Tomé (Normal): estádio do milharal
  leader_tome: {
    id: 'tome', nome: 'Arena do Milharal', tipo: 'normal', cor: '#e8c050', ...est('tome'),
    abertura: 'Aqui o milho é cobertura, o fardo é arma e a debulhadora não pede licença!',
    gritos: { faixa: ['Liga a debulhadora!', 'Olha a máquina passando!'], trator: 'Solta o trator!', milho: 'Planta de novo!', encolher: 'Colhe tudo!' },
    as: { titulo: 'O ás de Tomé', fala: 'Teddiursa! Mostra a força da roça!', grito: 'Teddiursa!', corFx: 0xc89a5a },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, frases: ['Vai, Tomé!', 'Olha o milho!', 'Ê, colheita!', 'Uau!', 'Que fardo!'] },
      { tipo: 'milho', celulas: [...esp([9, 5, 3, 3], [9, 29, 3, 3], [18, 11, 2, 4], [18, 22, 2, 4], [4, 10, 2, 3], [4, 23, 2, 3]), [24, 17, 2, 3]] },
      { tipo: 'cobertura', id: 'fardos', visual: 'fardo', rola: true, hp: 3, dano: 0.08, renasce: 14, pos: [...esp([14, 14], [14, 22], [21, 8], [21, 29], [9, 18], [16, 18]), [24, 13], [25, 23]] },
      { tipo: 'faixa', id: 'faixa', orient: 'h', largura: 2, multiplas: true, vel: 6, periodo: [7, 10], primeiro: 5, aviso: 1.5, dano: 0.09, visual: 'debulhadora', cor: 0xff7a2a, rotulo: 'Debulhadora!' },
      { tipo: 'faixa', id: 'trator', ativo: false, orient: 'v', largura: 2, vel: 5, periodo: [9, 12], primeiro: 3, aviso: 1.6, dano: 0.08, visual: 'debulhadora', cor: 0xffa02a, rotulo: 'Trator!' },
      { tipo: 'encolher', id: 'encolher', ativo: false, passo: 8, aneis: 5, aviso: 1.9, dano: 0.05 },
    ],
    fases: [
      { id: 'milharal', nome: 'O milharal' },
      { id: 'colheita', nome: 'A colheita', quando: { desmaios: 1, psEquipe: 0.55 }, titulo: 'A COLHEITA COMEÇOU!', fala: 'Hora da colheita! O campo vai encolhendo, colha logo!',
        liga: ['encolher', 'trator'], ajusta: { faixa: { periodo: [6, 9] } } },
      { id: 'final', nome: 'Reta final', final: true, quando: { asPS: 0.5 }, titulo: 'RETA FINAL!', fala: 'Quem planta paciência colhe vitória. Ainda não acabou!', musica: 'gymFinal',
        ajusta: { faixa: { periodo: [4.5, 6.5], vel: 7 }, trator: { periodo: [7, 9] } } },
    ],
  },

  // ------------------------------------------------------------------ Lia (Inseto): estádio da estufa-teia
  leader_lia: {
    id: 'lia', nome: 'Estufa-Teia', tipo: 'bug', cor: '#9ad83a', ...est('lia'),
    abertura: 'Cuidado onde pisa! A teia prende, as plantas mordem e os casulos estão quase prontos.',
    gritos: { teia: ['Fios, agora!', 'Tece, tece!'], casulo: 'Acordem, pequenos!' },
    as: { titulo: 'O ás de Lia', fala: 'Scyther, corta o ar!', grito: 'Scyther!', corFx: 0x7ad83a },
    pecas: [
      { tipo: 'plateia', estilo: 'inseto', lugares: TRIBUNA, cores: [0xe8c040, 0x7ad84a, 0xe86a3a, 0x5a8ae8], frases: ['Bzzz!', 'Zzz-zum!', 'Cri-cri!', 'Bzz!'] },
      { tipo: 'teia', cobre: 0.3, lento: 0.5, prende: 1.4, preso: 0.8, imunes: ['bug'] },
      { tipo: 'planta', pos: [...esp([4, 6], [12, 11], [20, 14], [4, 30], [12, 25], [20, 22]), [24, 12], [25, 24]], raio: 1.4, aviso: 0.85, dano: 0.07, prende: 0.6, recarga: 3.5 },
      { tipo: 'casulo', pos: esp([2, 10], [2, 26], [15, 4], [15, 33]), eclode: [24, 32], dex: [13, 10, 265, 401], nivel: -7, max: 2, vida: 20, hp: 2 },
    ],
    fases: [
      { id: 'chao', nome: 'O chão da estufa' },
      { id: 'passarelas', nome: 'As passarelas', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'A TEIA SUBIU!', fala: 'Agora só os fios dourados são seguros. Fica nas passarelas, se conseguir!',
        evento: ['teia'], ajusta: { casulo: { eclode: [16, 22], max: 3 }, planta: { recarga: 2.6 } } },
      { id: 'final', nome: 'Metamorfose', final: true, quando: { asPS: 0.5 }, titulo: 'METAMORFOSE!', fala: 'Toda mudança começa quietinha… e termina assim!', musica: 'gymFinal' },
    ],
  },

  // ------------------------------------------------------------------ Marina (Água): estádio das marés (piscina no meio)
  leader_marina: {
    id: 'marina', nome: 'Galpão das Marés', tipo: 'water', cor: '#5ab0ff', ...est('marina'),
    abertura: 'Aqui a maré manda! Quem não nada que arrume um barco.',
    gritos: { inundacao: ['Abre a comporta!', 'Sobe, maré!'], correnteza: 'Vira a correnteza!' },
    pecas: [
      { tipo: 'plateia', estilo: 'marujo', lugares: TRIBUNA, frases: ['Iça a vela!', 'Vai, Marina!', 'Olha a onda!', 'Ê, marujo!'] },
      // pontos altos espalhados (ilhas, cantos, laterais, frente de cada treinador): em qualquer lugar, um a poucos passos
      { tipo: 'inundacao', altas: [...esp([2, 4, 4, 3], [2, 30, 4, 3], [16, 14, 3, 3], [16, 21, 3, 3], [2, 15, 3, 7], [9, 5, 3, 3], [9, 30, 3, 3]), [21, 4, 8, 2], [21, 32, 8, 2]], ciclo: [[0, 6], [1, 7], [2, 6], [1, 5]], aviso: 1.6, lento: [1, 0.8, 0.62, 0.5], afoga: 0.035, maxAfoga: 3 },
      { tipo: 'correnteza', modo: 'giro', centro: [24.5, 18.5], forca: 55, periodo: 12 },
      { tipo: 'plataforma', barcos: [
        { w: 2, h: 2, rota: [[14, 12], [21, 12], [21, 24], [14, 24]], vel: 1.3, pausa: 1.2 }, { w: 2, h: 2, rota: [[21, 24], [14, 24], [14, 12], [21, 12]], vel: 1.3, pausa: 1.2 },
        { w: 2, h: 2, rota: [[34, 24], [27, 24], [27, 12], [34, 12]], vel: 1.3, pausa: 1.2 }, { w: 2, h: 2, rota: [[27, 12], [34, 12], [34, 24], [27, 24]], vel: 1.3, pausa: 1.2 }] },
      { tipo: 'alavanca', id: 'comporta', pos: [9, 9], alvo: 'inundacao', acao: 'subir', nome: 'Comporta vermelha', cor: 0xe5383b, recarga: 8 },
      { tipo: 'alavanca', id: 'comporta2', pos: [40, 28], alvo: 'inundacao', acao: 'subir', nome: 'Comporta vermelha', cor: 0xe5383b, recarga: 8 },
      { tipo: 'alavanca', id: 'canal', pos: [40, 9], alvo: 'correnteza', acao: 'inverter', nome: 'Comporta azul', cor: 0x3a7ae8, recarga: 5 },
      { tipo: 'alavanca', id: 'canal2', pos: [9, 28], alvo: 'correnteza', acao: 'inverter', nome: 'Comporta azul', cor: 0x3a7ae8, recarga: 5 },
    ],
    fases: [
      { id: 'mares', nome: 'As marés' },
      { id: 'mare_alta', nome: 'Maré alta', final: true, quando: { desmaios: 1, psEquipe: 0.6 }, titulo: 'MARÉ ALTA!', fala: 'Segura firme! Agora a água vem de verdade. Quem não nada, fica no barco!', musica: 'gymFinal',
        ajusta: { inundacao: { ciclo: [[3, 12], [2, 4]] }, correnteza: { forca: 70, periodo: 9 } } },
    ],
  },
  // a revanche no píer, depois do assalto (cap03: leader_marina_pier)
  leader_marina_pier: {
    id: 'marina_pier', nome: 'O Píer Comprido', tipo: 'water', cor: '#5ab0ff', ...est('marina_pier'),
    abertura: 'Batalha que começa tem que acabar! Aqui no píer, com o lago inteiro olhando.',
    gritos: { onda: ['Lá vem onda!', 'Segura a onda!'] },
    as: { titulo: 'O ás de Marina', fala: 'Basculin! Morde a maré!', grito: 'Basculin!', corFx: 0x5ab0ff },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, frases: ['Vai, Marina!', 'Que onda!', 'Ninguém rouba o porto!'] },
      { tipo: 'plataforma', barcos: [{ w: 2, h: 2, rota: [[10, 7], [10, 29]], vel: 1.1, pausa: 1.6 }, { w: 2, h: 2, rota: [[24, 29], [24, 7]], vel: 1.1, pausa: 1.6 }, { w: 2, h: 2, rota: [[38, 7], [38, 29]], vel: 1.1, pausa: 1.6 }] },
      { tipo: 'correnteza', dir: [0, 1], forca: 45, periodo: 10 },
      { tipo: 'faixa', id: 'onda', orient: 'h', largura: 1, multiplas: true, vel: 4.5, periodo: [6, 9], primeiro: 4, aviso: 1.5, dano: 0.06, empurra: 120, visual: 'onda', cor: 0x5ab0ff, rotulo: 'Onda!', corta: false, tipoDano: 'water', som: 'splash' },
      { tipo: 'inundacao', id: 'inundacao', ativo: false, altas: [...esp([2, 3, 5, 3], [2, 32, 5, 3], [15, 14, 4, 8])], ciclo: [[2, 10], [1, 4]], aviso: 1.6, maxAfoga: 9 },
    ],
    fases: [
      { id: 'pier', nome: 'O píer' },
      { id: 'final', nome: 'Ressaca', final: true, quando: { asPS: 0.5 }, titulo: 'RESSACA!', fala: 'O lago está do meu lado! Molha os pés e vem!', musica: 'gymFinal',
        liga: ['inundacao'], ajusta: { onda: { periodo: [4, 6], vel: 5.5 } } },
    ],
  },

  // ------------------------------------------------------------------ Jonas (Elétrico): estádio da lanterna do farol
  leader_jonas: {
    id: 'jonas', nome: 'Lanterna do Farol', tipo: 'electric', cor: '#ffe23a', ...est('jonas'), acende: true,
    abertura: 'O chão do farol é todo circuito! Pisa onde eu não piso, viu?',
    gritos: { paineis: ['Liga o painel!', 'Corrente no chão!'], marcas: ['Cai, raio!', 'Olha pro céu!'] },
    as: { titulo: 'O ás de Jonas', fala: 'Lanturn! Acende o mar!', grito: 'Lanturn!', corFx: 0xffe23a },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, cores: [0xe8803a, 0x3a7ae8, 0xf2c03a], frases: ['Curto-circuito!', 'Vai, Jonas!', 'Que choque!', 'Uau!'] },
      { tipo: 'paineis', tam: 2, padroes: ['xadrez', 'linhas', 'colunas', 'anel', 'cruz', 'metade', 'diagonal'], periodo: [4.5, 6.5], primeiro: 4, aviso: 1.15, ativo: 0.8, dano: 0.07, status: 'par', chance: 0.2,
        evita: esp([7, 6], [14, 14], [14, 23], [7, 31], [3, 12], [3, 25]) },
      { tipo: 'gerador', pos: esp([7, 6], [14, 14], [14, 23], [7, 31]), tempo: 1.3, mult: 1.5, recarga: 7, raio: 1.7 },
      { tipo: 'pararaio', pos: esp([3, 12], [3, 25]), raio: 2.6 },
      { tipo: 'marcas', id: 'marcas', ativo: false, ceu: true, n: [1, 2], periodo: [2.6, 3.8], aviso: 1.2, raio: 1.3, dano: 0.1, tipoDano: 'electric', status: 'par', chance: 0.15, visual: 'raio', alvo: 'misto' },
    ],
    fases: [
      { id: 'circuito', nome: 'O circuito' },
      { id: 'tempestade', nome: 'Tempestade', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'TEMPESTADE!', fala: 'Abre a cúpula! Os raios caem onde a marca aparece. O para-raios é seu amigo!',
        liga: ['marcas'], ajusta: { paineis: { periodo: [6, 8] } } },
      { id: 'final', nome: 'Alta voltagem', final: true, quando: { asPS: 0.5 }, titulo: 'ALTA VOLTAGEM!', fala: 'Agora é carga máxima!', musica: 'gymFinal',
        ajusta: { marcas: { n: [2, 3], periodo: [2.2, 3.2] } } },
    ],
  },

  // ------------------------------------------------------------------ Zélia (Fantasma): estádio do luar
  leader_zelia: {
    id: 'zelia', nome: 'Salão do Luar', tipo: 'ghost', cor: '#b07aff', ...est('zelia'),
    abertura: 'Vamos subir para o salão do luar, querido. Lá as velas contam histórias… e os móveis também.',
    gritos: { escuro: ['Uuuuu…', 'Apaga, vela!'], poltergeist: ['Voa, cadeira!', 'Esse quadro era da minha avó!'] },
    as: { titulo: 'O ás de Zélia', fala: 'Lampent, mostra o caminho das almas!', grito: 'Lampent!', corFx: 0xb07aff },
    pecas: [
      { tipo: 'plateia', estilo: 'fantasma', lugares: TRIBUNA, frases: ['Buuu!', 'Uuuu…', 'Hi hi hi!', 'Arrepiou!'] },
      { tipo: 'escuro', nivel: 0.82, candelabros: [...esp([6, 8], [6, 29], [17, 18]), [24, 6], [25, 31]], raio: 4.4, reacende: 1.5 },
      { tipo: 'poltergeist', periodo: [4, 6], primeiro: 5, aviso: 1.15, dano: 0.08, vel: 230, objetos: ['quadro', 'cadeira', 'vaso', 'livro'] },
      { tipo: 'portas', pares: [[[2, 6], [47, 30]], [[2, 30], [47, 6]], [[16, 18], [33, 18]]], recarga: 1.5 },
      { tipo: 'giro', ativo: false, forca: 42, periodo: 10 },
      { tipo: 'sombras', ativo: false, n: 3, dur: 11, periodo: [14, 18] },
    ],
    fases: [
      { id: 'velas', nome: 'À luz de velas' },
      { id: 'avesso', nome: 'O salão do avesso', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'O SALÃO VIROU DO AVESSO!', fala: 'Hi hi! A casa gira, as portas trocam e as sombras dançam. Qual é a minha?',
        liga: ['giro', 'sombras'], evento: ['portas'], ajusta: { poltergeist: { periodo: [3.2, 4.6] } } },
      { id: 'final', nome: 'Noite Longa', final: true, quando: { asPS: 0.5 }, titulo: 'NOITE LONGA!', fala: 'Escuro não assusta quem conhece. Você conhece?', musica: 'gymFinal',
        ajusta: { escuro: { nivel: 0.9 }, giro: { forca: 55 } } },
    ],
  },

  // ------------------------------------------------------------------ Brás (Lutador): estádio da roda de capoeira
  leader_bras: {
    id: 'bras', nome: 'A Roda', tipo: 'fighting', cor: '#e8803a', ...est('bras'),
    abertura: 'Ê, camará! Na roda, quem dita o golpe é o berimbau. Bate no tempo que vale mais!',
    gritos: { tabuas: 'Olha o chão!' },
    as: { titulo: 'O ás de Brás', fala: 'Hitmontop! Gira, menino!', grito: 'Hitmontop!', corFx: 0xe8803a },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, frases: ['Ê, camará!', 'Iê!', 'Joga, joga!', 'Que ginga!'] },
      { tipo: 'ritmo', bpm: 96, janela: 0.14, bonus: 1.3, compasso: 2 },
      { tipo: 'tabuas', celulas: [...esp([9, 12, 3, 2], [9, 23, 3, 2], [17, 7, 3, 2], [17, 29, 3, 2], [15, 17, 2, 3]), [23, 17, 4, 3]], quebra: 1.2, buraco: 7, dano: 0.06 },
      { tipo: 'corda', forca: 1.5, dano: 0.06 },
    ],
    fases: [
      { id: 'roda', nome: 'A roda' },
      { id: 'roda_fechada', nome: 'A roda fechou', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'A RODA FECHOU!', fala: 'O berimbau acelerou! Quem perde o tempo, perde a roda!',
        ajusta: { ritmo: { bpm: 120 }, corda: { forca: 1.8 }, tabuas: { quebra: 1 } } },
      { id: 'final', nome: 'São Bento Grande', final: true, quando: { asPS: 0.5 }, titulo: 'SÃO BENTO GRANDE!', fala: 'Agora é jogo de dentro!', musica: 'gymFinal', ajusta: { ritmo: { bpm: 132 } } },
    ],
  },

  // ------------------------------------------------------------------ Graça (Pedra): estádio da mina velha
  leader_graca: {
    id: 'graca', nome: 'A Mina Velha', tipo: 'rock', cor: '#c8a070', ...est('graca'),
    abertura: 'A montanha não tem pressa, mas o teto tem. Onde a poeira cai, a pedra vem atrás.',
    gritos: { marcas: ['Desaba!', 'Olha o teto!'], faixa: 'Solta o vagonete!' },
    as: { titulo: 'O ás de Graça', fala: 'Lycanroc! Uiva pro crepúsculo!', grito: 'Lycanroc!', corFx: 0xe8803a },
    poder: { tipo: 'dynamax', quando: 'ps', ps: 0.6 },
    pecas: [
      { tipo: 'plateia', estilo: 'marujo', lugares: TRIBUNA, cores: [0x8a6a4a, 0x6a6a72, 0xe8c040], frases: ['Força, Graça!', 'Segura o teto!', 'Ê, mineiro!'] },
      { tipo: 'marcas', id: 'marcas', visual: 'pedra', n: [1, 2], periodo: [3, 4.4], aviso: 1.3, raio: 1.4, dano: 0.11, tipoDano: 'rock', entulho: 0.35, alvo: 'misto' },
      { tipo: 'cobertura', id: 'pilares', visual: 'pilar', rola: false, hp: 4, pos: [...esp([10, 6], [10, 13], [10, 24], [10, 32], [18, 14], [18, 24]), [24, 14], [25, 24]] },
      { tipo: 'faixa', id: 'faixa', orient: 'h', largura: 1, faixas: [9, 19, 29], trilhos: true, multiplas: true, vel: 6, periodo: [6, 9], aviso: 1.4, dano: 0.1, visual: 'vagonete', cor: 0xc8a070, rotulo: 'Vagonete!' },
    ],
    fases: [
      { id: 'mina', nome: 'A mina' },
      { id: 'desabamento', nome: 'Desabamento', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'A MINA TREME!', fala: 'Agora a montanha fala alto. Escuta a poeira!',
        ajusta: { marcas: { n: [2, 3], periodo: [2.4, 3.4] }, faixa: { periodo: [4.5, 6.5] } } },
      { id: 'final', nome: 'Coração da pedra', final: true, quando: { asPS: 0.5 }, titulo: 'CORAÇÃO DA PEDRA!', fala: 'O crepúsculo não é vilão. É a hora mais forte do dia!', musica: 'gymFinal' },
    ],
  },

  // ------------------------------------------------------------------ Celeste (Voador): estádio do céu (plataformas no alto)
  leader_celeste: {
    id: 'celeste', nome: 'Topo da Torre do Vento', tipo: 'flying', cor: '#9ad0ff', ...est('celeste'),
    abertura: 'Aqui em cima o chão é pouco e o vento é muito. Quem cai, volta… mas volta mais fraco.',
    gritos: { rajada: ['Sopra!', 'Vento de través!'] },
    as: { titulo: 'O ás de Celeste', fala: 'Braviary! O céu é seu!', grito: 'Braviary!', corFx: 0x9ad0ff },
    poder: { tipo: 'dynamax', quando: 'entrada' },
    pecas: [
      { tipo: 'queda', plataformas: [[15, 12, 20, 14], [15, 3, 20, 6], [15, 29, 20, 6], [2, 8, 9, 22], [39, 8, 9, 22], [23, 9, 4, 3], [23, 26, 4, 3], [11, 17, 4, 4], [35, 17, 4, 4]], dano: 0.1 },
      { tipo: 'plataforma', barcos: [{ w: 4, h: 3, rota: [[11, 9], [11, 13]], vel: 1, pausa: 1.5 }, { w: 4, h: 3, rota: [[35, 13], [35, 9]], vel: 1, pausa: 1.5 },
        { w: 4, h: 3, rota: [[11, 25], [11, 21]], vel: 1, pausa: 1.5 }, { w: 4, h: 3, rota: [[35, 21], [35, 25]], vel: 1, pausa: 1.5 }] },
      { tipo: 'faixa', id: 'rajada', orient: 'v', largura: 3, multiplas: true, vel: 7, periodo: [5, 8], aviso: 1.4, dano: 0.02, empurra: 250, chao: false, corta: false, visual: 'rajada', cor: 0xdff4ff, rotulo: 'Rajada!', som: 'whoosh' },
      { tipo: 'giro', id: 'tornado', ativo: false, forca: 50, periodo: 9 },
    ],
    fases: [
      { id: 'mirante', nome: 'O mirante' },
      { id: 'ventania', nome: 'Ventania', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'VENTANIA!', fala: 'O vento mudou. Agora ele gira!', liga: ['tornado'], ajusta: { rajada: { periodo: [4, 6] } } },
      { id: 'final', nome: 'Olho do furacão', final: true, quando: { asPS: 0.5 }, titulo: 'OLHO DO FURACÃO!', fala: 'Voa mais alto que o meu Braviary, se puder!', musica: 'gymFinal', ajusta: { tornado: { forca: 62 } } },
    ],
  },

  // ================================================================== Relógio de Pedra, Elite 4 e Campeã (jornada clássica)
  c12_vespera: {
    id: 'vespera', nome: 'O Anel dos Menires', tipo: 'dark', cor: '#7a3aa8', ...est('vespera'),
    abertura: 'Os menires guardam o Relógio há mil anos. Hoje eles vão ver se você guarda alguma coisa.',
    gritos: { marcas: ['Cai, sombra!', 'A noite desce!'], giro: 'O vento do Planalto!' },
    as: { titulo: 'O ás da Dra. Véspera', fala: 'Grimmsnarl! Mostra o que a noite ensina!', grito: 'Grimmsnarl!', corFx: 0x7a3aa8 },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, cores: [0x4a2068, 0x2a2a3a, 0x7a3aa8], frases: ['Uuh!', 'A noite chegou!', 'Véspera!', 'Que sombra!'] },
      { tipo: 'marcas', id: 'marcas', n: [1, 2], periodo: [3, 4.4], aviso: 1.3, raio: 1.4, dano: 0.1, tipoDano: 'dark', alvo: 'misto' },
      { tipo: 'cobertura', id: 'menires', visual: 'pilar', rola: false, hp: 5, pos: anel(24.5, 18.5, 11, 9, 12, Math.PI / 12) },
      { tipo: 'giro', id: 'giro', ativo: false, forca: 40, periodo: 11 },
      { tipo: 'sombras', ativo: false, n: 3, dur: 10, periodo: [14, 18] },
    ],
    fases: [
      { id: 'menires', nome: 'O anel' },
      { id: 'vento', nome: 'Vento do Planalto', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'O VENTO VIROU!', fala: 'Segura a luz agora, menino. O Planalto empurra para o escuro.', liga: ['giro', 'sombras'] },
      { id: 'final', nome: 'Noite inteira', final: true, quando: { asPS: 0.5 }, titulo: 'NOITE INTEIRA!', fala: 'É assim que a noite pesa. Ainda segura?', musica: 'gymFinal', ajusta: { marcas: { n: [2, 3], periodo: [2.4, 3.4] } } },
    ],
  },
  // o Necrozma é encontro selvagem capturável (lendarios.js, na Câmara do Coração); esta arena vale se ele for lutado
  // como chefe (sem captura) e serve de palco de teste
  c12_necrozma: {
    id: 'necrozma', nome: 'Câmara do Coração', tipo: 'psychic', cor: '#e8c040', ...est('necrozma'), acende: true,
    abertura: 'KRRRRAAAAAA!',
    pecas: [
      { tipo: 'marcas', id: 'raios', n: [2, 3], periodo: [2.6, 3.8], aviso: 1.2, raio: 1.5, dano: 0.11, tipoDano: 'psychic', visual: 'raio', alvo: 'misto' },
      { tipo: 'faixa', id: 'luz', orient: 'h', largura: 1, multiplas: true, vel: 6, periodo: [6, 9], aviso: 1.4, dano: 0.08, visual: 'rajada', cor: 0xffe27a, rotulo: 'Luz!', corta: false },
      { tipo: 'faixa', id: 'luz2', ativo: false, orient: 'v', largura: 1, vel: 6, periodo: [7, 10], aviso: 1.4, dano: 0.08, visual: 'rajada', cor: 0xffe27a, rotulo: 'Luz!', corta: false },
    ],
    fases: [{ id: 'coracao', nome: 'O coração do Relógio' }, { id: 'final', nome: 'Sol rachado', final: true, quando: { psEquipe: 0.5 }, titulo: 'O SOL RACHA!', fala: 'KRRRAAA!', musica: 'gymFinal', liga: ['luz2'], ajusta: { raios: { n: [3, 4] } } }],
  },
  elite_aurelio: {
    id: 'aurelio', nome: 'Sala da Madrugada', tipo: 'dark', cor: '#4a2068', ...est('aurelio'),
    abertura: 'A madrugada é a hora em que ninguém olha. É a minha hora.',
    gritos: { escuro: ['Apaga!', 'Escuridão!'], poltergeist: 'Voa, sombra!' },
    as: { titulo: 'O ás de Aurélio', fala: 'Weavile, corta o frio da madrugada!', grito: 'Weavile!', corFx: 0x4a2068 },
    pecas: [
      { tipo: 'plateia', estilo: 'fantasma', lugares: TRIBUNA, frases: ['Shhh…', 'Uuuu…', 'Aurélio!', 'Arrepiou!'] },
      { tipo: 'escuro', nivel: 0.85, candelabros: esp([5, 6], [5, 31], [16, 18], [22, 8]), raio: 4.4, reacende: 1.5 },
      { tipo: 'poltergeist', periodo: [4, 6], primeiro: 5, aviso: 1.1, dano: 0.08, vel: 240, objetos: ['vaso', 'livro', 'cadeira'] },
      { tipo: 'sombras', ativo: false, n: 3, dur: 10, periodo: [13, 17] },
    ],
    fases: [{ id: 'madrugada', nome: 'Madrugada' }, { id: 'final', nome: 'Hora mais escura', final: true, quando: { desmaios: 3, asPS: 0.5 }, titulo: 'A HORA MAIS ESCURA!', fala: 'Antes do sol, sempre vem isto.', musica: 'gymFinal', liga: ['sombras'], ajusta: { escuro: { nivel: 0.92 }, poltergeist: { periodo: [3, 4.4] } } }],
  },
  elite_clarice: {
    id: 'clarice', nome: 'Sala da Manhã', tipo: 'fairy', cor: '#f0a8d8', ...est('clarice'),
    abertura: 'A manhã é delicada. Mas pisa onde não deve e você vê o espinho da rosa.',
    gritos: { planta: ['Floresce!', 'Espinhos!'] },
    as: { titulo: 'O ás de Clarice', fala: 'Sylveon, abre a manhã!', grito: 'Sylveon!', corFx: 0xf0a8d8 },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, cores: [0xf0a8d8, 0xffffff, 0xf2c03a, 0x9ad0ff], frases: ['Que lindo!', 'Clarice!', 'Floresceu!', 'Uau!'] },
      { tipo: 'planta', pos: [...esp([4, 6], [11, 13], [20, 10], [4, 30], [11, 24], [20, 27]), [24, 17], [25, 20]], raio: 1.4, aviso: 0.9, dano: 0.08, prende: 0.6, recarga: 3.2 },
      { tipo: 'marcas', id: 'petalas', ativo: false, n: [2, 3], periodo: [2.8, 4], aviso: 1.3, raio: 1.3, dano: 0.09, tipoDano: 'fairy', alvo: 'misto' },
    ],
    fases: [{ id: 'jardim', nome: 'O jardim' }, { id: 'final', nome: 'Primeira luz', final: true, quando: { desmaios: 3, asPS: 0.5 }, titulo: 'PRIMEIRA LUZ!', fala: 'Toda manhã tem um sol que machuca os olhos.', musica: 'gymFinal', liga: ['petalas'], ajusta: { planta: { recarga: 2.4 } } }],
  },
  elite_brasa: {
    id: 'brasa', nome: 'Sala do Meio-dia', tipo: 'fire', cor: '#e8603a', ...est('brasa'),
    abertura: 'Meio-dia, sol a pino, chão quente. Aqui ninguém fica parado muito tempo.',
    gritos: { faixa: ['Abre o forno!', 'Lá vem brasa!'], marcas: 'Chove fagulha!' },
    as: { titulo: 'O ás de Seu Brasa', fala: 'Charizard! Meio-dia em ponto!', grito: 'Charizard!', corFx: 0xe8603a },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, cores: [0xe8603a, 0xf2c03a, 0x3a3a3a], frases: ['Quente!', 'Seu Brasa!', 'Que calor!', 'Uau!'] },
      { tipo: 'faixa', id: 'faixa', orient: 'h', largura: 2, multiplas: true, vel: 5.5, periodo: [7, 10], primeiro: 6, aviso: 1.5, dano: 0.1, visual: 'rajada', cor: 0xff7a2a, rotulo: 'Labareda!', tipoDano: 'fire' },
      { tipo: 'marcas', id: 'marcas', n: [1, 2], periodo: [3.2, 4.6], aviso: 1.3, raio: 1.3, dano: 0.09, tipoDano: 'fire', alvo: 'misto' },
      { tipo: 'cobertura', id: 'pilares', visual: 'pilar', rola: false, hp: 4, pos: esp([14, 14], [14, 23], [5, 18], [21, 9], [21, 28]) },
    ],
    fases: [{ id: 'sol', nome: 'Sol a pino' }, { id: 'final', nome: 'Fornalha', final: true, quando: { desmaios: 3, asPS: 0.5 }, titulo: 'FORNALHA!', fala: 'Agora esquenta de verdade!', musica: 'gymFinal', ajusta: { faixa: { periodo: [4.5, 6.5] }, marcas: { n: [2, 3] } } }],
  },
  elite_ibere: {
    id: 'ibere', nome: 'Sala do Entardecer', tipo: 'dragon', cor: '#e8a040', ...est('ibere'),
    abertura: 'O entardecer é o último sopro do dia. Meus dragões sopram forte.',
    gritos: { rajada: ['Sopra!', 'Vento de dragão!'] },
    as: { titulo: 'O ás de Iberê', fala: 'Garchomp! Fecha o dia!', grito: 'Garchomp!', corFx: 0xe8a040 },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, cores: [0xe8a040, 0x7a3a28, 0x3a6ad8], frases: ['Iberê!', 'Dragão!', 'Que sopro!', 'Uau!'] },
      { tipo: 'faixa', id: 'rajada', orient: 'v', largura: 3, multiplas: true, vel: 7, periodo: [5, 8], aviso: 1.4, dano: 0.03, empurra: 240, chao: false, corta: false, visual: 'rajada', cor: 0xffe0b0, rotulo: 'Rajada!', som: 'whoosh' },
      { tipo: 'faixa', id: 'rajada2', ativo: false, orient: 'h', largura: 3, vel: 7, periodo: [7, 10], aviso: 1.4, dano: 0.03, empurra: 240, chao: false, corta: false, visual: 'rajada', cor: 0xffe0b0, rotulo: 'Rajada!', som: 'whoosh' },
      { tipo: 'giro', id: 'tornado', ativo: false, forca: 48, periodo: 9 },
      { tipo: 'marcas', id: 'marcas', n: [1, 2], periodo: [3, 4.2], aviso: 1.3, raio: 1.4, dano: 0.1, tipoDano: 'dragon', visual: 'pedra', alvo: 'misto' },
    ],
    fases: [{ id: 'tarde', nome: 'A tarde' }, { id: 'final', nome: 'Pôr do sol', final: true, quando: { desmaios: 3, asPS: 0.5 }, titulo: 'PÔR DO SOL!', fala: 'O dia acaba. Você acaba junto?', musica: 'gymFinal', liga: ['tornado', 'rajada2'] }],
  },
  campea_dalva: {
    id: 'dalva', nome: 'Salão da Campeã', tipo: 'flying', cor: '#3a6ad8', ...est('dalva'), acende: true,
    abertura: 'Estrela-d’alva e estrela-vésper são o mesmo astro. Vamos ver qual das duas brilha em você.',
    gritos: { marcas: ['Estrela cadente!', 'Do alto!'], rajada: 'Vento da alvorada!' },
    as: { titulo: 'O ás da Campeã Dalva', fala: 'Dragonite! A última luz da manhã é sua!', grito: 'Dragonite!', corFx: 0x3a6ad8 },
    poder: { tipo: 'dynamax', quando: 'ps', ps: 0.6 },
    pecas: [
      { tipo: 'plateia', lugares: TRIBUNA, frases: ['Dalva!', 'Campeã!', 'Que batalha!', 'Uau!'] },
      { tipo: 'marcas', id: 'marcas', n: [1, 2], periodo: [2.8, 4], aviso: 1.2, raio: 1.4, dano: 0.1, tipoDano: 'flying', visual: 'raio', alvo: 'misto' },
      { tipo: 'faixa', id: 'rajada', orient: 'v', largura: 3, multiplas: true, vel: 7, periodo: [6, 9], aviso: 1.4, dano: 0.03, empurra: 230, chao: false, corta: false, visual: 'rajada', cor: 0xdff4ff, rotulo: 'Rajada!', som: 'whoosh' },
      { tipo: 'cobertura', id: 'colunas', visual: 'pilar', rola: false, hp: 5, pos: esp([12, 18], [20, 13], [20, 24]) },
      { tipo: 'giro', id: 'giro', ativo: false, forca: 50, periodo: 9 },
    ],
    fases: [
      { id: 'alvorada', nome: 'A estrela-d’alva' },
      { id: 'vesper', nome: 'A estrela-vésper', quando: { desmaios: 3, psEquipe: 0.5 }, titulo: 'A ESTRELA MUDOU DE LADO!', fala: 'Agora você entende a minha irmã.', liga: ['giro'] },
      { id: 'final', nome: 'Zênite', final: true, quando: { asPS: 0.5 }, titulo: 'ZÊNITE!', fala: 'É aqui que o sol fica mais alto. Sobe comigo!', musica: 'gymFinal', ajusta: { marcas: { n: [2, 3], periodo: [2.2, 3] } } },
    ],
  },
};

// atalho para os testes e para quem constrói as regiões: a mesma arena noutro lugar do mapa
export function arenaEm(id, { sala = null, area, posicoes } = {}) {
  const a = ARENAS[id]; if (!a) return null;
  const dx = area ? area[0] - a.area[0] : 0, dy = area ? area[1] - a.area[1] : 0;
  const mover = (v) => (Array.isArray(v) && typeof v[0] === 'number' ? [v[0] + dx, v[1] + dy, ...v.slice(2)] : Array.isArray(v) ? v.map(mover) : v);
  const pecas = a.pecas.map((p) => {
    const q = { ...p };
    for (const k of ['pos', 'celulas', 'lugares', 'plataformas', 'altas', 'candelabros', 'evita', 'pares']) if (q[k]) q[k] = mover(q[k]);
    if (q.barcos) q.barcos = q.barcos.map((b) => ({ ...b, rota: mover(b.rota) }));
    if (q.centro) q.centro = mover(q.centro);
    return q;
  });
  // faixas fixas (trilhos) e área continuam relativas à arena: só desloca o que é posição
  for (const q of pecas) if (q.faixas) q.faixas = q.faixas.map((f) => f + ((q.orient ?? 'h') === 'h' ? dy : dx));
  return { ...a, sala, area: area ?? a.area, posicoes: posicoes ?? (a.posicoes && { jogador: mover(a.posicoes.jogador), lider: mover(a.posicoes.lider) }), pecas };
}
