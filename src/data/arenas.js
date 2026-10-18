// Arenas dinâmicas dos ginásios: só dados (motor em src/combat/arena-ginasio.js, peças em src/combat/arena-pecas.js,
// documentação completa em docs/arenas.md). A chave é o id da batalha do líder (o mesmo das cenas: batalha.id).
//
// Campos de uma arena:
//   id, nome (faixa da abertura), tipo, cor (faixas), sala (id do interior em assets/maps/alvorada.json; sem sala =
//   coordenadas do mapa aberto), area [x, y, w, h] em blocos relativos à sala, posicoes { jogador, lider } (onde cada
//   um fica durante a luta; opcional), abertura (fala do líder), musica { luta }, gritos { idDaPeca: fala } (quando o
//   líder aciona aquela peça), as { titulo, fala, grito, corFx } (entrada do último Pokémon), poder { tipo:
//   'dynamax' | 'mega', quando: 'entrada' | 'ps', ps } (ramo mega), pecas [ { tipo, id?, ativo?, ...params } ],
//   fases [ { id, nome, quando: { desmaios, psEquipe, as, asPS }, titulo, fala, liga, desliga, ajusta, evento,
//   musica, final } ]. A fase 0 vale desde o início (sem "quando").
// Os números (avisos em s, dano em fração dos PS máximos, períodos em s) são os de um ginásio médio: o motor escala
// tudo pelo nível do ás (DIFICULDADE em arena-ginasio.js). Nenhum perigo acerta com menos de AVISO_MIN (0,75 s) de aviso.
// Planejadas (planejada: true): Brás, Graça e Celeste. As regiões ainda não existem; quem construir troca sala/area/
// posicoes pelos do mapa novo e a arena funciona como está (o motor é o mesmo; testadas num campo aberto).

export const ARENAS = {
  // ------------------------------------------------------------------ Tomé (Normal): arena no meio do milharal
  leader_tome: {
    id: 'tome', nome: 'Arena do Milharal', tipo: 'normal', cor: '#e8c050',
    sala: null, area: [123, 374, 12, 11], posicoes: { jogador: [128.5, 383.2], lider: [128.5, 374.6] },
    abertura: 'Aqui o milho é cobertura, o fardo é arma e a debulhadora não pede licença!',
    gritos: { faixa: ['Liga a debulhadora!', 'Olha a máquina passando!'], milho: 'Planta de novo!', encolher: 'Colhe tudo!' },
    as: { titulo: 'O ás de Tomé', fala: 'Teddiursa! Mostra a força da roça!', grito: 'Teddiursa!', corFx: 0xc89a5a },
    pecas: [
      { tipo: 'plateia', lugares: [[123, 372, 6, 2], [129, 372, 6, 2], [118, 376, 3, 8], [136, 376, 3, 8]], frases: ['Vai, Tomé!', 'Olha o milho!', 'Ê, colheita!', 'Uau!', 'Que fardo!'] },
      { tipo: 'milho', celulas: [[124, 377, 2, 2], [132, 377, 2, 2], [124, 381, 2, 1], [132, 381, 2, 1], [128, 377, 1, 1]] },
      { tipo: 'cobertura', id: 'fardos', visual: 'fardo', rola: true, hp: 3, dano: 0.08, renasce: 14, pos: [[126, 379], [131, 379], [129, 381]] },
      { tipo: 'faixa', id: 'faixa', orient: 'h', largura: 2, vel: 5.5, periodo: [9, 13], primeiro: 6, aviso: 1.5, dano: 0.09, visual: 'debulhadora', cor: 0xff7a2a, rotulo: 'Debulhadora!' },
      { tipo: 'encolher', id: 'encolher', ativo: false, passo: 9, aneis: 2, aviso: 1.9, dano: 0.05 },
    ],
    fases: [
      { id: 'milharal', nome: 'O milharal' },
      { id: 'colheita', nome: 'A colheita', quando: { desmaios: 1, psEquipe: 0.55 }, titulo: 'A COLHEITA COMEÇOU!', fala: 'Hora da colheita! O campo vai encolhendo, colha logo!',
        liga: ['encolher'], ajusta: { faixa: { periodo: [7, 10] } } },
      { id: 'final', nome: 'Reta final', final: true, quando: { asPS: 0.5 }, titulo: 'RETA FINAL!', fala: 'Quem planta paciência colhe vitória. Ainda não acabou!', musica: 'gymFinal',
        ajusta: { faixa: { periodo: [5, 7], vel: 6.5 } } },
    ],
  },

  // ------------------------------------------------------------------ Lia (Inseto): estufa-teia
  leader_lia: {
    id: 'lia', nome: 'Estufa-Teia', tipo: 'bug', cor: '#9ad83a',
    sala: 'estufa_lia', area: [1, 2, 21, 15], posicoes: { jogador: [11, 15], lider: [11, 2.5] },
    abertura: 'Cuidado onde pisa! A teia prende, as plantas mordem e os casulos estão quase prontos.',
    gritos: { teia: ['Fios, agora!', 'Tece, tece!'], casulo: 'Acordem, pequenos!' },
    as: { titulo: 'O ás de Lia', fala: 'Scyther, corta o ar!', grito: 'Scyther!', corFx: 0x7ad83a },
    pecas: [
      { tipo: 'plateia', estilo: 'inseto', lugares: [[2, 1, 8, 1], [13, 1, 8, 1]], cores: [0xe8c040, 0x7ad84a, 0xe86a3a, 0x5a8ae8], frases: ['Bzzz!', 'Zzz-zum!', 'Cri-cri!', 'Bzz!'] },
      { tipo: 'teia', cobre: 0.3, lento: 0.5, prende: 1.4, preso: 0.8, imunes: ['bug'] },
      { tipo: 'planta', pos: [[4, 10], [18, 4], [3, 13], [17, 7]], raio: 1.3, aviso: 0.85, dano: 0.07, prende: 0.6, recarga: 3.5 },
      { tipo: 'casulo', pos: [[5, 2], [17, 2], [1, 9], [21, 12]], eclode: [18, 24], dex: [13, 10, 265, 401], nivel: -7, max: 2, vida: 20, hp: 2 },
    ],
    fases: [
      { id: 'chao', nome: 'O chão da estufa' },
      { id: 'passarelas', nome: 'As passarelas', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'A TEIA SUBIU!', fala: 'Agora só os fios dourados são seguros. Fica nas passarelas, se conseguir!',
        evento: ['teia'], ajusta: { casulo: { eclode: [12, 16], max: 3 }, planta: { recarga: 2.6 } } },
      { id: 'final', nome: 'Metamorfose', final: true, quando: { asPS: 0.5 }, titulo: 'METAMORFOSE!', fala: 'Toda mudança começa quietinha… e termina assim!', musica: 'gymFinal' },
    ],
  },

  // ------------------------------------------------------------------ Marina (Água): galpão de barcos
  leader_marina: {
    id: 'marina', nome: 'Galpão das Marés', tipo: 'water', cor: '#5ab0ff',
    sala: 'galpao_barcos', area: [1, 2, 19, 13], posicoes: { jogador: [10, 13], lider: [10, 2.6] },
    abertura: 'Aqui a maré manda! Quem não nada que arrume um barco.',
    gritos: { inundacao: ['Abre a comporta!', 'Sobe, maré!'], correnteza: 'Vira a correnteza!' },
    pecas: [
      { tipo: 'plateia', estilo: 'marujo', lugares: [[3, 1, 6, 1], [12, 1, 6, 1]], frases: ['Iça a vela!', 'Vai, Marina!', 'Olha a onda!', 'Ê, marujo!'] },
      { tipo: 'inundacao', altas: [[8, 2, 5, 2], [8, 13, 5, 2], [3, 6, 2, 3], [16, 6, 2, 3]], ciclo: [[0, 6], [1, 7], [2, 6], [1, 5]], aviso: 1.6, lento: [1, 0.8, 0.62, 0.5], afoga: 0.035, maxAfoga: 3 },
      { tipo: 'correnteza', modo: 'giro', centro: [10, 7], forca: 55, periodo: 12 },
      { tipo: 'plataforma', barcos: [{ w: 2, h: 2, rota: [[5, 4], [13, 4], [13, 9], [5, 9]], vel: 1.1, pausa: 1.4 }, { w: 2, h: 2, rota: [[13, 9], [5, 9], [5, 4], [13, 4]], vel: 1.1, pausa: 1.4 }] },
      { tipo: 'alavanca', id: 'comporta', pos: [7, 11], alvo: 'inundacao', acao: 'subir', nome: 'Comporta vermelha', cor: 0xe5383b, recarga: 8 },
      { tipo: 'alavanca', id: 'canal', pos: [13, 11], alvo: 'correnteza', acao: 'inverter', nome: 'Comporta azul', cor: 0x3a7ae8, recarga: 5 },
    ],
    fases: [
      { id: 'mares', nome: 'As marés' },
      { id: 'mare_alta', nome: 'Maré alta', final: true, quando: { desmaios: 1, psEquipe: 0.6 }, titulo: 'MARÉ ALTA!', fala: 'Segura firme! Agora a água vem de verdade. Quem não nada, fica no barco!', musica: 'gymFinal',
        ajusta: { inundacao: { ciclo: [[3, 12], [2, 4]] }, correnteza: { forca: 70, periodo: 9 } } },
    ],
  },
  // a revanche no píer, depois do assalto (cap03: leader_marina_pier)
  leader_marina_pier: {
    id: 'marina_pier', nome: 'O Píer Comprido', tipo: 'water', cor: '#5ab0ff',
    sala: null, area: [430, 298, 13, 12], posicoes: { jogador: [435, 308.6], lider: [435, 299.4] },
    abertura: 'Batalha que começa tem que acabar! Aqui no píer, com o lago inteiro olhando.',
    gritos: { onda: ['Lá vem onda!', 'Segura a onda!'] },
    as: { titulo: 'O ás de Marina', fala: 'Basculin! Morde a maré!', grito: 'Basculin!', corFx: 0x5ab0ff },
    pecas: [
      { tipo: 'plateia', lugares: [[430, 310, 4, 2], [437, 310, 5, 2]], frases: ['Vai, Marina!', 'Que onda!', 'Ninguém rouba o porto!'] },
      { tipo: 'plataforma', barcos: [{ w: 2, h: 2, rota: [[431, 300], [431, 307]], vel: 0.9, pausa: 1.6 }, { w: 2, h: 2, rota: [[438, 307], [438, 300]], vel: 0.9, pausa: 1.6 }] },
      { tipo: 'correnteza', dir: [0, 1], forca: 45, periodo: 10 },
      { tipo: 'faixa', id: 'onda', orient: 'h', largura: 1, vel: 4.5, periodo: [8, 11], primeiro: 5, aviso: 1.5, dano: 0.06, empurra: 120, visual: 'onda', cor: 0x5ab0ff, rotulo: 'Onda!', corta: false, tipoDano: 'water', som: 'splash' },
      { tipo: 'inundacao', id: 'inundacao', ativo: false, altas: [[434, 299, 3, 2]], ciclo: [[2, 10], [1, 4]], aviso: 1.6, maxAfoga: 9 },
    ],
    fases: [
      { id: 'pier', nome: 'O píer' },
      { id: 'final', nome: 'Ressaca', final: true, quando: { asPS: 0.5 }, titulo: 'RESSACA!', fala: 'O lago está do meu lado! Molha os pés e vem!', musica: 'gymFinal',
        liga: ['inundacao'], ajusta: { onda: { periodo: [5, 7], vel: 5.5 } } },
    ],
  },

  // ------------------------------------------------------------------ Jonas (Elétrico): lanterna do farol
  leader_jonas: {
    id: 'jonas', nome: 'Lanterna do Farol', tipo: 'electric', cor: '#ffe23a',
    sala: 'farol_topo', area: [1, 2, 13, 8], posicoes: { jogador: [4, 8.6], lider: [12, 2.6] },
    abertura: 'O chão do farol é todo circuito! Pisa onde eu não piso, viu?',
    gritos: { paineis: ['Liga o painel!', 'Corrente no chão!'], marcas: ['Cai, raio!', 'Olha pro céu!'] },
    as: { titulo: 'O ás de Jonas', fala: 'Lanturn! Acende o mar!', grito: 'Lanturn!', corFx: 0xffe23a },
    pecas: [
      { tipo: 'plateia', lugares: [[2, 1, 4, 1], [9, 1, 4, 1]], cores: [0xe8803a, 0x3a7ae8, 0xf2c03a], frases: ['Curto-circuito!', 'Vai, Jonas!', 'Que choque!', 'Uau!'] },
      { tipo: 'paineis', tam: 2, padroes: ['xadrez', 'linhas', 'colunas', 'anel', 'cruz', 'metade'], periodo: [4.5, 6.5], primeiro: 4, aviso: 1.15, ativo: 0.8, dano: 0.07, status: 'par', chance: 0.2, evita: [[3, 5], [7, 4], [11, 5], [2, 9], [1, 7], [13, 7]] },
      { tipo: 'gerador', pos: [[3, 5], [7, 4], [11, 5]], tempo: 1.3, mult: 1.5, recarga: 7, raio: 1.6 },
      { tipo: 'pararaio', pos: [[1, 7], [13, 7]], raio: 2.4 },
      { tipo: 'marcas', id: 'marcas', ativo: false, ceu: true, n: [1, 2], periodo: [2.8, 4.2], aviso: 1.2, raio: 1.2, dano: 0.1, tipo: 'electric', status: 'par', chance: 0.15, visual: 'raio', alvo: 'misto' },
    ],
    fases: [
      { id: 'circuito', nome: 'O circuito' },
      { id: 'tempestade', nome: 'Tempestade', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'TEMPESTADE!', fala: 'Abre a cúpula! Os raios caem onde a marca aparece. O para-raios é seu amigo!',
        liga: ['marcas'], ajusta: { paineis: { periodo: [6, 8] } } },
      { id: 'final', nome: 'Alta voltagem', final: true, quando: { asPS: 0.5 }, titulo: 'ALTA VOLTAGEM!', fala: 'Agora é carga máxima!', musica: 'gymFinal',
        ajusta: { marcas: { n: [2, 3], periodo: [2.4, 3.4] } } },
    ],
  },

  // ------------------------------------------------------------------ Zélia (Fantasma): salão do luar no Casarão das Velas
  leader_zelia: {
    id: 'zelia', nome: 'Salão do Luar', tipo: 'ghost', cor: '#b07aff',
    sala: 'casarao_velas', area: [34, 2, 13, 12], posicoes: { jogador: [40, 13], lider: [41, 2.5] },
    abertura: 'Vamos subir para o salão do luar, querido. Lá as velas contam histórias… e os móveis também.',
    gritos: { escuro: ['Uuuuu…', 'Apaga, vela!'], poltergeist: ['Voa, cadeira!', 'Esse quadro era da minha avó!'] },
    as: { titulo: 'O ás de Zélia', fala: 'Lampent, mostra o caminho das almas!', grito: 'Lampent!', corFx: 0xb07aff },
    pecas: [
      { tipo: 'plateia', estilo: 'fantasma', lugares: [[35, 1, 11, 1]], frases: ['Buuu!', 'Uuuu…', 'Hi hi hi!', 'Arrepiou!'] },
      { tipo: 'escuro', nivel: 0.82, candelabros: [[43, 4], [45, 7], [35, 6]], raio: 3.6, reacende: 1.5 },
      { tipo: 'poltergeist', periodo: [5, 7], primeiro: 5, aviso: 1.15, dano: 0.08, vel: 220, objetos: ['quadro', 'cadeira', 'vaso', 'livro'] },
      { tipo: 'portas', pares: [[[34, 4], [46, 11]], [[34, 12], [46, 3]]], recarga: 1.5 },
      { tipo: 'giro', ativo: false, forca: 42, periodo: 10 },
      { tipo: 'sombras', ativo: false, n: 2, dur: 11, periodo: [15, 19] },
    ],
    fases: [
      { id: 'velas', nome: 'À luz de velas' },
      { id: 'avesso', nome: 'O salão do avesso', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'O SALÃO VIROU DO AVESSO!', fala: 'Hi hi! A casa gira, as portas trocam e as sombras dançam. Qual é a minha?',
        liga: ['giro', 'sombras'], evento: ['portas'], ajusta: { poltergeist: { periodo: [4, 5.5] } } },
      { id: 'final', nome: 'Noite Longa', final: true, quando: { asPS: 0.5 }, titulo: 'NOITE LONGA!', fala: 'Escuro não assusta quem conhece. Você conhece?', musica: 'gymFinal',
        ajusta: { escuro: { nivel: 0.9 }, giro: { forca: 55 } } },
    ],
  },

  // ================================================================== PLANEJADAS (regiões ainda por construir)
  // ------------------------------------------------------------------ Brás (Lutador): a roda de capoeira (Forte Rochedo)
  leader_bras: {
    id: 'bras', planejada: true, nome: 'A Roda', tipo: 'fighting', cor: '#e8803a',
    sala: null, area: [0, 0, 14, 12], posicoes: { jogador: [7, 11.4], lider: [7, 0.6] },
    abertura: 'Ê, camará! Na roda, quem dita o golpe é o berimbau. Bate no tempo que vale mais!',
    gritos: { tabuas: 'Olha o chão!' },
    as: { titulo: 'O ás de Brás', fala: 'Hitmontop! Gira, menino!', grito: 'Hitmontop!', corFx: 0xe8803a },
    pecas: [
      { tipo: 'plateia', lugares: [[0, -2, 14, 2], [-3, 1, 3, 10], [14, 1, 3, 10], [0, 12, 14, 2]], frases: ['Ê, camará!', 'Iê!', 'Joga, joga!', 'Que ginga!'] },
      { tipo: 'ritmo', bpm: 96, janela: 0.14, bonus: 1.3, compasso: 2 },
      { tipo: 'tabuas', celulas: [[3, 3, 3, 2], [8, 3, 3, 2], [3, 7, 3, 2], [8, 7, 3, 2]], quebra: 1.2, buraco: 7, dano: 0.06 },
      { tipo: 'corda', forca: 1.5, dano: 0.06 },
    ],
    fases: [
      { id: 'roda', nome: 'A roda' },
      { id: 'roda_fechada', nome: 'A roda fechou', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'A RODA FECHOU!', fala: 'O berimbau acelerou! Quem perde o tempo, perde a roda!',
        ajusta: { ritmo: { bpm: 120 }, corda: { forca: 1.8 }, tabuas: { quebra: 1 } } },
      { id: 'final', nome: 'São Bento Grande', final: true, quando: { asPS: 0.5 }, titulo: 'SÃO BENTO GRANDE!', fala: 'Agora é jogo de dentro!', musica: 'gymFinal', ajusta: { ritmo: { bpm: 132 } } },
    ],
  },

  // ------------------------------------------------------------------ Graça (Pedra): a mina velha (Cidade Escarpa)
  leader_graca: {
    id: 'graca', planejada: true, nome: 'A Mina Velha', tipo: 'rock', cor: '#c8a070',
    sala: null, area: [0, 0, 16, 12], posicoes: { jogador: [8, 11.4], lider: [8, 0.6] },
    abertura: 'A montanha não tem pressa, mas o teto tem. Onde a poeira cai, a pedra vem atrás.',
    gritos: { marcas: ['Desaba!', 'Olha o teto!'], faixa: 'Solta o vagonete!' },
    as: { titulo: 'O ás de Graça', fala: 'Lycanroc! Uiva pro crepúsculo!', grito: 'Lycanroc!', corFx: 0xe8803a },
    poder: { tipo: 'dynamax', quando: 'ps', ps: 0.6 },
    pecas: [
      { tipo: 'plateia', estilo: 'marujo', lugares: [[0, -2, 16, 2]], cores: [0x8a6a4a, 0x6a6a72, 0xe8c040], frases: ['Força, Graça!', 'Segura o teto!', 'Ê, mineiro!'] },
      { tipo: 'marcas', id: 'marcas', visual: 'pedra', n: [1, 2], periodo: [3.2, 4.6], aviso: 1.3, raio: 1.3, dano: 0.11, tipo: 'rock', entulho: 0.35, alvo: 'misto' },
      { tipo: 'cobertura', id: 'pilares', visual: 'pilar', rola: false, hp: 4, pos: [[4, 4], [11, 4], [4, 8], [11, 8], [8, 6]] },
      { tipo: 'faixa', id: 'faixa', orient: 'h', largura: 1, faixas: [2, 9], trilhos: true, vel: 6, periodo: [7, 10], aviso: 1.4, dano: 0.1, visual: 'vagonete', cor: 0xc8a070, rotulo: 'Vagonete!' },
    ],
    fases: [
      { id: 'mina', nome: 'A mina' },
      { id: 'desabamento', nome: 'Desabamento', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'A MINA TREME!', fala: 'Agora a montanha fala alto. Escuta a poeira!',
        ajusta: { marcas: { n: [2, 3], periodo: [2.6, 3.6] }, faixa: { periodo: [5, 7] } } },
      { id: 'final', nome: 'Coração da pedra', final: true, quando: { asPS: 0.5 }, titulo: 'CORAÇÃO DA PEDRA!', fala: 'O crepúsculo não é vilão. É a hora mais forte do dia!', musica: 'gymFinal' },
    ],
  },

  // ------------------------------------------------------------------ Celeste (Voador): o alto da Torre do Vento (Mirante)
  leader_celeste: {
    id: 'celeste', planejada: true, nome: 'Topo da Torre do Vento', tipo: 'flying', cor: '#9ad0ff',
    sala: null, area: [0, 0, 16, 13], posicoes: { jogador: [8, 11.5], lider: [8, 1.5] },
    abertura: 'Aqui em cima o chão é pouco e o vento é muito. Quem cai, volta… mas volta mais fraco.',
    gritos: { rajada: ['Sopra!', 'Vento de través!'] },
    as: { titulo: 'O ás de Celeste', fala: 'Braviary! O céu é seu!', grito: 'Braviary!', corFx: 0x9ad0ff },
    poder: { tipo: 'dynamax', quando: 'entrada' },
    pecas: [
      { tipo: 'queda', plataformas: [[5, 0, 6, 3], [5, 10, 6, 3], [0, 4, 4, 5], [12, 4, 4, 5], [6, 5, 4, 3]], dano: 0.12 },
      { tipo: 'plataforma', barcos: [{ w: 2, h: 2, rota: [[4, 3], [10, 3]], vel: 1, pausa: 1.5 }, { w: 2, h: 2, rota: [[10, 8], [4, 8]], vel: 1, pausa: 1.5 }] },
      { tipo: 'faixa', id: 'rajada', orient: 'v', largura: 3, vel: 7, periodo: [6, 9], aviso: 1.4, dano: 0.02, empurra: 380, chao: false, corta: false, visual: 'rajada', cor: 0xdff4ff, rotulo: 'Rajada!', som: 'whoosh' },
      { tipo: 'giro', id: 'tornado', ativo: false, forca: 50, periodo: 9 },
    ],
    fases: [
      { id: 'mirante', nome: 'O mirante' },
      { id: 'ventania', nome: 'Ventania', quando: { desmaios: 2, psEquipe: 0.5 }, titulo: 'VENTANIA!', fala: 'O vento mudou. Agora ele gira!', liga: ['tornado'], ajusta: { rajada: { periodo: [4.5, 6.5] } } },
      { id: 'final', nome: 'Olho do furacão', final: true, quando: { asPS: 0.5 }, titulo: 'OLHO DO FURACÃO!', fala: 'Voa mais alto que o meu Braviary, se puder!', musica: 'gymFinal', ajusta: { tornado: { forca: 62 } } },
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
