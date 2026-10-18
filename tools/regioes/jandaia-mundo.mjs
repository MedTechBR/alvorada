// O resto do mundo externo: selva, cachoeira, praias, ilhas gêmeas, Miragem, mar; itens, Ninhos e a Toca de Luz.
import { perto } from './jandaia-terreno.mjs';
import { LOOK } from './jandaia-util.mjs';

const CHAO = ['grass', 'grass2', 'sand', 'path', 'dark', 'tall', 'flowers', 'plaza', 'wetsand'];
export const COCOS = []; // posições dos coqueiros da missão "Coco verde" (preenchido ao gerar)

export function mundo(M, C, J) {
  const snap = (x, y, r = 14) => perto(M, CHAO, x, y, r) ?? [x, y];
  const livreAo = (x, y) => { for (let r = 0; r < 12; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.max(Math.abs(i), Math.abs(j)) === r && M.livre(x + i, y + j, 1, 1) && !M.occ[x + i - M.rx + (y + j - M.ry) * M.rw]) return [x + i, y + j]; return [x, y]; };
  const P = (x, y, t) => { const [a, b] = livreAo(x, y); return C.poe('sign', a, b, { text: t }); };

  // ============ Ilha Jandaia: coqueiros da missão (balançam quando um Pokémon forte os sacode), orla e conchas ============
  const cocoAlvos = [[46, 588], [60, 579], [78, 574], [112, 575], [128, 580], [150, 585], [162, 600], [158, 620], [130, 640], [100, 646], [76, 642], [48, 628], [40, 612]];
  for (const [x, y] of cocoAlvos) { const [a, b] = livreAo(...snap(x, y, 8)); if (C.poe('coqueiro', a, b, { text: 'Um coqueiro carregado de cocos verdes.' }, { aviso: false })) COCOS.push([a, b]); }
  C.espalha('driftwood', 6, [36, 570, 134, 82], { tipos: ['sand'], dist: 8, margem: 0 });
  C.espalha('boulder', 8, [34, 568, 138, 84], { tipos: ['sand', 'grass'], dist: 9, margem: 1 });
  C.espalha('rock', 14, [34, 568, 138, 84], { tipos: ['sand', 'grass'], dist: 5 });
  C.espalha('bush', 16, [58, 575, 100, 70], { tipos: ['grass'], dist: 4 });

  // ============ Ilhas Gêmeas: um santuário em cada ilhota, palmeiras e pedra ============
  for (const [cx, cor, nome, quem] of [[258, 'azul', 'Latios', 'oeste'], [318, 'vermelho', 'Latias', 'leste']]) {
    C.poe('altar', cx - 1, 631, { text: `Um altar baixo de pedra pintado de ${cor}. Na lateral, uma estrela de cinco pontas. Quem vive aqui só aparece para quem viu as duas ilhas no mesmo dia.` });
    C.poe('statue', cx - 5, 632); C.poe('statue', cx + 4, 632); C.poe('obelisk', cx - 1, 628); C.poe('lanternaPedra', cx - 3, 636); C.poe('lanternaPedra', cx + 2, 636);
    C.espalha('palmeira', 7, [cx - 22, 623, 44, 34], { tipos: ['sand', 'grass'], dist: 4, margem: 0 });
    C.espalha('rock', 4, [cx - 22, 623, 44, 34], { tipos: ['sand', 'grass'], dist: 5 });
  }
  P(272, 641, 'ILHAS GÊMEAS\nDuas ilhotas iguais, um banco de areia no meio que a maré cobre e descobre.\nOeste: Latios. Leste: Latias.');
  P(300, 641, 'Marca na areia, feita com a ponta de um graveto: "ele chega primeiro, ela chega depois".');

  // ============ Selva Grande ============
  C.espalha('arvoreSelva', 16, [48, 706, 232, 168], { tipos: ['dark'], dist: 10, margem: 1 });
  C.espalha('folhaGigante', 70, [46, 706, 236, 168], { tipos: ['dark', 'tall'], dist: 4, margem: 0 });
  C.espalha('bambu', 24, [46, 706, 236, 168], { tipos: ['dark'], dist: 6, margem: 0 });
  C.espalha('rock', 22, [46, 706, 236, 168], { tipos: ['dark'], dist: 6 });
  C.espalha('boulder2', 8, [46, 706, 236, 168], { tipos: ['dark'], dist: 12, margem: 1 });
  C.espalha('coqueiro', 22, [34, 700, 258, 190], { tipos: ['sand'], dist: 5 });
  // acampamento: barracas, varal, caixas
  C.poeProx('barraca', 85, 772); C.poe('barraca', 103, 771); C.poe('varal', 98, 774); C.poe('crate', 87, 775); C.poe('crate', 88, 775); C.poeProx('barrel', 106, 773); C.poe('lamp', 91, 772);
  // mirante noroeste (Papagaio) e mirante sudeste
  M.ellipse('dark', 112, 735, 7, 5, 0.4, ['forest', 'dark']); M.ellipse('grass', 112, 735, 5, 3.5, 0.4, ['dark']);
  C.poe('bench', 110, 736); P(114, 733, 'MIRANTE DO PAPAGAIO\nDaqui se vê a Ilha Jandaia, o mar e, em dia limpo, a fumaça da Costa Coral.');
  M.ellipse('dark', 230, 845, 8, 5, 0.4, ['forest', 'dark']); M.ellipse('grass', 230, 845, 5, 3.5, 0.4, ['dark']);
  C.poe('bench', 228, 846); P(232, 843, 'MIRANTE DA LAGARTIXA\nDaqui se vê a Praia do Cipó. E uma lagartixa. Ela não se importa.');
  // topo da cachoeira
  M.ellipse('dark', 201, 727, 7, 5, 0.4, ['forest', 'dark']); M.ellipse('grass', 201, 727, 5, 3.5, 0.4, ['dark']);
  C.poe('bench', 199, 728); P(203, 724, 'TOPO DA CACHOEIRA\nO paredão de cipó vem do poço. Quem subiu até aqui merece sentar.');
  C.poe('chest', 205, 728, { item: 'nugget', itemNome: 'Pepita', id: 'bau_topo_cachoeira' }, { aviso: true });

  // ============ Cachoeira do Véu Verde ============
  C.espalha('rock', 5, [186, 740, 50, 40], { tipos: ['grass', 'flowers', 'sand'], dist: 5 });
  C.espalha('bush', 8, [186, 740, 50, 40], { tipos: ['grass', 'flowers'], dist: 4 });
  C.poe('bench', 204, 761);
  // ============ Praia do Cipó ============
  C.espalha('coqueiro', 10, [156, 882, 140, 40], { tipos: ['sand'], dist: 5 });
  C.espalha('driftwood', 6, [156, 882, 140, 40], { tipos: ['sand'], dist: 8 });
  C.espalha('rock', 8, [156, 882, 140, 40], { tipos: ['sand'], dist: 6 });
  C.poe('beachStall', 190, 896, { text: 'Barraca do Dito: cipó doce, coco gelado e uma fila inexistente.' }); C.poe('guardaSol', 196, 898); C.poe('surfboard', 188, 900); C.poe('jangada', 236, 899, { text: 'Uma jangada encalhada. O nome na proa: "Quase Lá".' });
  P(176, 893, 'PRAIA DO CIPÓ\nCuidado com os Pokémon de areia debaixo do chão: eles puxam o pé.');
  // ============ Ilha Miragem (só voando): ruína e fonte ============
  C.poe('altar', 349, 896, { text: 'Um altar de pedra branca, liso como osso. Sobre ele, uma gota de luz parece suspensa.' });
  C.poe('statue', 343, 898); C.poe('statue', 355, 898); C.poe('obelisk', 349, 892); C.poe('lanternaPedra', 347, 901); C.poe('lanternaPedra', 353, 901);
  C.poe('chest', 350, 893, { item: 'clefablite', itemNome: 'Clefablita', id: 'bau_miragem' });
  C.espalha('palmeira', 5, [336, 888, 28, 26], { tipos: ['grass', 'sand'], dist: 5 });
  C.espalha('rock', 3, [336, 888, 28, 26], { tipos: ['grass'], dist: 5 });
  P(346, 903, 'Uma placa de pedra, sem nome. Só um desenho: uma ilha, uma lua cheia e um Pokémon rosa de cabeça para baixo.');

  // ============ Rota Marítima 17 e Mar das Jandaias: boias e rochedos ============
  for (let k = 0; k < 16; k++) { const x = 90 + k * 14, y = 540 + Math.round(Math.sin(k * 0.7) * 22); C.poe('boia', x, y, {}, { terra: false, aviso: false }); }
  for (const [x, y] of [[110, 500], [240, 492], [300, 520], [130, 600], [180, 680], [320, 700], [60, 840], [350, 840], [120, 920], [250, 950], [300, 880], [20, 690]]) C.poe('boia', x, y, {}, { terra: false, aviso: false });
  P(212, 531, 'ROTA MARÍTIMA 17\n← Costa Coral    Ilhas Jandaia →\nSe a balsa não serve, tem a nado. (Leve um Lapras.)');
  P(215, 693, 'MAR DAS JANDAIAS\nPassando daqui o mar fica fundo. Quem tem Mantine ouve coisas no fundo.');

  // ============ Itens: no chão e escondidos ============
  const I = J.items;
  const it = (x, y, item, n = 1, hidden = false) => { const [a, b] = snap(x, y, 6); I.push({ x: a, y: b, item, ...(n > 1 ? { n } : {}), ...(hidden ? { hidden: true } : {}) }); };
  // Ilha Jandaia
  it(120, 590, 'superPotion'); it(56, 612, 'greatBall', 2); it(150, 640, 'oranBerry', 3, true); it(118, 604, 'nestBall', 3); it(92, 585, 'potion', 2);
  it(160, 606, 'pearl', 1, true); it(36, 598, 'sitrusBerry', 2); it(104, 645, 'quickBall', 2, true); it(135, 575, 'heartScale', 1, true);
  // Rota 17 e mar
  it(210, 526, 'pearl', 1, true); it(150, 543, 'bigPearl', 1, true); it(262, 550, 'revive', 1); it(318, 513, 'diveBall', 2); it(60, 518, 'superPotion', 2);
  it(215, 688, 'netBall', 3); it(350, 758, 'bigPearl', 1, true); it(110, 698, 'revive'); it(330, 828, 'ultraBall', 2); it(70, 903, 'pearl', 2, true); it(140, 938, 'maxRevive', 1, true); it(290, 933, 'rareCandy', 1, true); it(30, 758, 'stardust', 2, true); it(370, 698, 'greatBall', 2);
  // Gêmeas e Miragem
  it(252, 645, 'miracleSeed', 1, true); it(324, 645, 'mysticWater', 1, true); it(344, 908, 'bigPearl', 1, true); it(356, 905, 'rareCandy', 1, true);
  // Selva, cachoeira e Praia do Cipó
  it(150, 716, 'ultraBall', 2); it(130, 775, 'superPotion', 3); it(180, 786, 'lumBerry', 3); it(236, 799, 'revive'); it(96, 815, 'leppaBerry', 3, true); it(113, 737, 'tinyMushroom', 2, true);
  it(231, 846, 'bigMushroom', 1, true); it(205, 756, 'leafStone', 1, true); it(214, 748, 'mysticWater', 1, true); it(201, 728, 'rareCandy', 1, true); it(172, 892, 'pearl', 2, true); it(240, 898, 'shellBell', 1, true); it(260, 905, 'ultraBall', 3);
  it(60, 800, 'pechaBerry', 3); it(260, 790, 'oranBerry', 3);

  // ============ Ninhos (pontos de voo) ============
  const spot = (id, x, y) => { const [a, b] = snap(x, y, 8); J.spots[id] = [a, b, 'down']; };
  spot('ninho_acampamento_selva', 100, 775); spot('ninho_praia_cipo', 228, 896); spot('ninho_ilhas_gemeas', 288, 642); spot('ninho_ilha_miragem', 350, 905);
  J.ninhos.push({ id: 'acampamento_selva', nome: 'Acampamento da Selva Grande', spot: 'ninho_acampamento_selva' }, { id: 'praia_cipo', nome: 'Praia do Cipó', spot: 'ninho_praia_cipo' },
    { id: 'ilhas_gemeas', nome: 'Ilhas Gêmeas', spot: 'ninho_ilhas_gemeas' }, { id: 'ilha_miragem', nome: 'Ilha Miragem', spot: 'ninho_ilha_miragem' });
  // pontos para as missões e as cenas
  J.spots.altar_koko = [146, 599, 'down'];

  // ============ Toca de Luz (Reide Max) ============
  J.tocas = [{ id: 'toca_jandaia', x: 126, y: 628, gmax: ['meowth-gmax'] }];
  J.forestZones = [{ x: 40, y: 700, w: 250, h: 190, kinds: ['bigtree', 'tree2', 'ipe', 'paineira', 'bigtree', 'tree2'] }];
}
