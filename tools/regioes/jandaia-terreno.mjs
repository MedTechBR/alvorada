// Terreno do Arquipélago das Jandaias (parte 1 do gerador): mar, ilhas, selva, cachoeira, praias, colina do altar.
// Todas as coordenadas são absolutas do mundo (retângulo da região: [0, 480, 400, 480]).
import { Mapa, rng } from './lib.mjs';

export const RECT = [0, 480, 400, 480];

// polígono orgânico em volta de um centro (raio varia com o ângulo; "pontas" dá enseadas e cabos)
export function blob(cx, cy, rx, ry, { n = 30, jit = 0.16, seed = 1, rot = 0 } = {}) {
  const r = rng(seed), ph = [r() * 6.28, r() * 6.28, r() * 6.28], pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + jit * (Math.sin(a * 2 + ph[0]) * 0.6 + Math.sin(a * 3 + ph[1]) * 0.5 + Math.sin(a * 5 + ph[2]) * 0.3) + (r() - 0.5) * jit * 0.5;
    pts.push([Math.round(cx + Math.cos(a + rot) * rx * k), Math.round(cy + Math.sin(a + rot) * ry * k)]);
  }
  return pts;
}

export function terreno(M) {
  const { rx, ry, rw, rh } = M;
  M.comment('mar_jandaias: o fundo é água funda; as ilhas saem dela');
  M.rect_('deep', rx, ry, rw, rh);

  // ---------------- ilhas: água rasa em volta, areia, capim ----------------
  const ilha = (nome, cx, cy, ax, ay, o) => {
    M.comment(nome);
    M.poly('water', blob(cx, cy, ax + 7, ay + 7, { ...o, seed: o.seed + 50 }), 0.6);
    M.poly('sand', blob(cx, cy, ax, ay, o), 0.9);
    M.poly('grass', blob(cx, cy, ax - 6, ay - 6, o), 0.8);
  };
  ilha('ilha_jandaia: Ilha Jandaia (praia, vila, colina do altar)', 100, 608, 68, 40, { seed: 11, jit: 0.13 });
  ilha('ilhas_gemeas: Ilha do Oeste (Latios)', 262, 640, 25, 20, { seed: 21, jit: 0.1, n: 20 });
  ilha('ilhas_gemeas: Ilha do Leste (Latias)', 314, 640, 25, 20, { seed: 22, jit: 0.1, n: 20 });
  ilha('selva_grande: Ilha da Selva Grande', 165, 792, 126, 90, { seed: 31, jit: 0.15, n: 44 });
  ilha('praia_cipo: Praia do Cipó (língua de areia ao sul da selva)', 225, 903, 72, 20, { seed: 41, jit: 0.1, n: 30 });
  ilha('ilha_miragem: Ilha Miragem (cercada de rochas: só voando)', 350, 902, 23, 22, { seed: 51, jit: 0.12, n: 24 });
}

// acha o bloco de um tipo mais perto de (x, y)
export function perto(M, tipos, x, y, r = 30) {
  const T = [].concat(tipos); let best = null, bd = 1e9;
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = i * i + j * j; if (d < bd && T.includes(M.nome(x + i, y + j))) { bd = d; best = [x + i, y + j]; } }
  return best;
}
// abre uma passagem de trepadeira (V) atravessando o paredão ao longo de um segmento, com largura w
export function trepadeira(M, x0, y0, x1, y1, w = 3) {
  const pts = [], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2), vert = Math.abs(y1 - y0) >= Math.abs(x1 - x0), a = -Math.floor((w - 1) / 2);
  for (let k = 0; k <= n; k++) {
    const x = Math.round(x0 + ((x1 - x0) * k) / n), y = Math.round(y0 + ((y1 - y0) * k) / n);
    for (let d = 0; d < w; d++) { const X = vert ? x + a + d : x, Y = vert ? y : y + a + d; if (M.nome(X, Y) === 'cliff' && !pts.some((p) => p[0] === X && p[1] === Y)) pts.push([X, Y]); }
  }
  if (pts.length) M.setPts('climb', pts);
  return pts;
}

export function detalhes(M) {
  // ===================== ILHA JANDAIA =====================
  M.comment('ilha_jandaia: praia de areia fina, capim da vila e mato alto nas pontas');
  M.blobs('tall', 38, 575, 40, 60, 0.13, 0.6, ['grass']);          // mato alto a oeste
  M.blobs('tall', 112, 575, 55, 70, 0.12, 0.62, ['grass']);        // mato alto a leste e ao sul
  M.scatter('flowers', 40, 572, 130, 78, 0.035, ['grass']);
  M.comment('vila_jandaia: praça, ruas de terra e o píer da balsa');
  M.ellipse('plaza', 86, 600, 24, 4.5, 0.4);                       // praça comprida entre as fileiras de casas
  M.path('path', [[93, 576], [93, 598]], 3, 0);                    // rua do píer à praça
  M.path('path', [[62, 599], [112, 599]], 3, 0.6);
  M.path('path', [[67, 604], [67, 611]], 3, 0.6);                  // até a casa do Tupã
  M.path('path', [[112, 602], [124, 608], [134, 612]], 3, 0.8);    // da vila para a colina do altar
  M.path('path', [[86, 603], [86, 622], [104, 636], [122, 642]], 3, 1); // ao sul, para a praia do Capitão Sul
  M.path('path', [[60, 600], [48, 601], [40, 605]], 3, 0.8);       // oeste, praia do Capitão Oeste
  M.rect_('dock', 93, 563, 2, 14);                                 // o píer (de x 93 a 94)
  M.comment('colina do altar (Tapu Koko): degraus ao sul, altar no topo');
  M.ellipse('cliff', 146, 602, 13, 10, 0.6);
  M.ellipse('grass', 146, 602, 10, 7, 0.5);
  M.ellipse('plaza', 146, 600, 6, 3.5, 0.3);
  for (let y = 604; y <= 616; y++) for (let x = 145; x <= 147; x++) if (M.nome(x, y) === 'cliff') M.setPts('stairs', [[x, y]]);

  // ===================== ILHAS GÊMEAS =====================
  M.comment('ilhas_gemeas: um capinzal no meio de cada ilhota e o banco de areia que a maré descobre');
  M.ellipse('tall', 258, 640, 11, 8, 0.7, ['grass']);
  M.ellipse('tall', 318, 640, 11, 8, 0.7, ['grass']);
  M.path('tide', [[281, 641], [297, 641]], 3, 0.5, ['water', 'deep', 'sand', 'grass']);
  M.ellipse('plaza', 258, 634, 4, 3, 0.3);
  M.ellipse('plaza', 318, 634, 4, 3, 0.3);

  // ===================== SELVA GRANDE =====================
  const S = { seed: 31, jit: 0.15, n: 44 };
  M.comment('selva_grande: paredão de cipó em volta (a ilha só se sobe escalando), chão de selva por dentro');
  M.poly('cliff', blob(165, 792, 117, 81, S), 0.5);
  M.poly('dark', blob(165, 792, 112, 76, S), 0.6);
  M.comment('mata fechada em manchas, com clareiras e trilhas de terra por cima');
  M.blobs('forest', 56, 712, 220, 160, 0.09, 0.53, ['dark']);
  M.blobs('forest', 56, 712, 220, 160, 0.2, 0.7, ['dark']);
  // clareiras
  for (const [x, y, rx, ry] of [[165, 778, 16, 10], [96, 770, 14, 9], [70, 740, 9, 7], [248, 846, 10, 8], [120, 830, 12, 9], [232, 815, 8, 6], [190, 740, 8, 6], [95, 810, 9, 7]]) { M.ellipse('dark', x, y, rx, ry, 0.5, ['forest', 'dark']); M.ellipse('tall', x, y, rx - 3, ry - 3, 0.8, ['dark']); }
  M.comment('trilhas da selva');
  const trilha = (pts, w = 3) => M.path('path', pts, w, 1.2, ['forest', 'dark', 'tall', 'grass', 'sand']);
  trilha([[150, 700], [151, 722], [153, 745], [160, 765], [165, 778]]);                 // portão norte → centro
  trilha([[165, 778], [145, 774], [124, 766], [104, 770], [86, 778], [64, 786], [46, 792]]); // centro → acampamento → portão oeste
  trilha([[165, 778], [200, 786], [236, 795], [280, 797]]);                               // portão leste
  trilha([[165, 778], [182, 764], [200, 756], [210, 760]]);                               // cachoeira
  trilha([[165, 778], [172, 800], [184, 828], [196, 852], [202, 880]]);                   // portão sul → praia do Cipó
  trilha([[96, 770], [92, 790], [95, 810], [108, 826], [120, 830]], 2);                   // trilha estreita ao sudoeste
  trilha([[236, 795], [240, 820], [248, 846]], 2);                                        // trilha estreita ao sudeste
  trilha([[153, 745], [120, 745], [88, 742], [70, 740]], 2);                              // trilha estreita ao mirante noroeste
  M.comment('cachoeira_veu_verde: clareira, poço, queda d’água e o rio até o mar');
  M.ellipse('grass', 210, 750, 25, 20, 0.5, ['forest', 'dark', 'path', 'tall']);
  M.ellipse('flowers', 210, 752, 22, 16, 1.2, ['grass']);
  M.rect_('cliff', 198, 733, 25, 6, ['forest', 'dark', 'grass', 'flowers']);            // a queda
  M.ellipse('sand', 210, 752, 14, 9, 0.5, ['grass', 'flowers', 'path']);
  M.ellipse('water', 210, 752, 11, 6.5, 0.5);
  M.path('water', [[212, 758], [219, 780], [233, 806], [244, 836], [252, 868], [254, 884]], 3, 1.5, ['forest', 'dark', 'tall', 'path', 'sand', 'grass', 'cliff']);
  M.rect_('bridge', 222, 791, 9, 3, ['water']);                                             // ponte da trilha leste
  M.comment('pontes de tábua e o mirante da cachoeira (paredão de cipó de x 200 a 202)');
  trepadeira(M, 201, 722, 201, 740, 3);
  M.comment('os quatro portões de cipó do paredão (norte, oeste, leste, sul): sem Escalar a selva não se alcança');
  trepadeira(M, 151, 698, 151, 730, 3);
  trepadeira(M, 36, 792, 72, 790, 3);
  trepadeira(M, 258, 797, 296, 797, 3);
  trepadeira(M, 202, 858, 202, 884, 3);

  // ===================== TEMPLO DAS RAÍZES: fachada =====================
  M.comment('templo_raizes: fachada de pedra coberta de raízes, degraus no meio');
  M.stamp(111, 744, [
    '  XXXXXXXXXXXXXXXXXX  ',
    ' XHHHHHHHHHHHHHHHHHHX ',
    ' XHHHHHHHHHHHHHHHHHHX ',
    ' XHHHHHHHHHHHHHHHHHHX ',
    ' XHHHHHHHHEE^^EHHHHHX ',
    ' XXXXXXXXXXXYYXXXXXXX ',
    '           YY         ',
  ]);

  // ===================== PRAIA DO CIPÓ =====================
  M.comment('praia_cipo: areia molhada na beira e cipós que descem do paredão');
  M.blobs('wetsand', 160, 880, 140, 40, 0.18, 0.55, ['sand']);
  M.scatter('flowers', 165, 886, 120, 24, 0.02, ['grass']);

  // ===================== ILHA MIRAGEM =====================
  M.comment('ilha_miragem: anel de rochas (só se entra voando), capim, fonte e ruína no meio');
  const MI = { seed: 51, jit: 0.12, n: 24 };
  M.poly('cliff', blob(350, 902, 19, 18, MI), 0.5);
  M.poly('grass', blob(350, 902, 14, 13, MI), 0.5);
  M.ellipse('tall', 350, 906, 7, 5, 0.6, ['grass']);
  M.ellipse('plaza', 350, 897, 4, 3, 0.2);
  M.ellipse('water', 346, 905, 3, 2, 0.2);
  M.scatter('flowers', 332, 886, 36, 32, 0.12, ['grass']);

  // ===================== MAR: bancos de areia, recifes de coral e a Rota 17 =====================
  M.comment('rota17 e mar_jandaias: ilhotas de areia no meio do caminho (descanso, itens e treinadores)');
  for (const [i, [x, y, rx, ry]] of [[210, 528, 9, 6], [150, 545, 7, 5], [262, 552, 8, 5], [318, 515, 7, 5], [60, 520, 8, 5], [335, 566, 6, 4], [215, 690, 9, 6], [350, 760, 10, 7], [110, 700, 7, 5], [330, 830, 8, 6], [70, 905, 9, 6], [140, 940, 10, 6], [290, 935, 9, 6], [30, 760, 6, 5], [370, 700, 6, 5]].entries()) {
    M.poly('water', blob(x, y, rx + 4, ry + 4, { seed: 80 + i, jit: 0.1, n: 14 }), 0.5);
    M.poly('sand', blob(x, y, rx, ry, { seed: 80 + i, jit: 0.1, n: 14 }), 0.6);
    M.ellipse('grass', x, y, rx - 3, ry - 2.5, 0.5, ['sand']);
  }
  M.comment('passagens: mar do sul (x 2–399, y 480–484) e mar entre Jandaias e Recife (x 395–399)');
  M.rect_('deep', 2, 480, 398, 5);
  M.rect_('deep', 395, 480, 5, 480);
}
