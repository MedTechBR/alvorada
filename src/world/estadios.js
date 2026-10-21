// Estádios das lutas de líder (pedido do dono: "as arenas de ginásio ainda estão muito pequenas, preciso que elas
// sejam realmente enormes"). Cada líder, a Elite, a Campeã, a Dra. Véspera e o Necrozma lutam num estádio próprio,
// uma sala grande "atrás do ginásio": quando a luta começa, o líder leva o jogador para lá (escurece a tela) e, no fim,
// todo mundo volta para onde estava (src/combat/arena-ginasio.js: abertura/voltar). O ginásio continua como era
// (entradas, quebra-cabeças, treinadores e cenas não mudam).
//
// Todos têm a mesma planta: 50 x 36 blocos com parede em volta; as duas fileiras de cima são a arquibancada (objetos
// "stands", onde a plateia da arena torce) e a luta ocupa 48 x 32 blocos por dentro (ARENA_ESTADIO). O chão, os
// obstáculos (cobertura, pedras e caixotes onde dá para subir, água, lava, teia...) e o estilo das paredes mudam com o
// tipo do ginásio. As peças da arena (perigos, plataformas, alavancas) estão em src/data/arenas.js, nas mesmas
// coordenadas da sala; tools/teste-3d/ginasios-tamanho.mjs confere que nenhuma peça cai em cima de um obstáculo.
//
// As salas não ficam nos arquivos de mapa: o montador do mundo (src/world/mundos.js) chama salasEstadios() e as põe
// numa fileira na faixa de interiores do núcleo, abaixo das salas que já existem (y 1162, nada encosta nelas).

export const ESTADIO_W = 50, ESTADIO_H = 36;
export const ARENA_ESTADIO = [1, 3, 48, 32]; // x, y, w, h relativos à sala
export const ESTADIO_Y = 1162;              // linha da faixa do núcleo onde a fileira de estádios começa (absoluto)
const PASSO = ESTADIO_W + 20;                // 20 blocos de vazio entre salas (como o alocador de mundos.js)

// espelho esquerda ↔ direita (a arena vai do bloco 1 ao 48): bloco x → 49 - x; retângulo [x, y, w, h] → [50 - x - w, ...]
export const espX = (x, w = 1) => 50 - x - w;

// tema de cada estádio: id da luta (chave em src/data/arenas.js) → nome, chão, estilo das paredes e montagem
export const ESTADIOS = [
  { id: 'tome', luta: 'leader_tome', nome: 'Estádio do Milharal', piso: '.', estilo: 'casa', papel: 'madeira', volta: [128.5, 383.2], montar: tome },
  { id: 'lia', luta: 'leader_lia', nome: 'Estádio da Estufa-Teia', piso: 'x', estilo: 'lab', volta: ['estufa_lia', 11, 14.6], montar: lia },
  { id: 'marina', luta: 'leader_marina', nome: 'Estádio das Marés', piso: 'D', estilo: 'casa', papel: 'azul', volta: ['galpao_barcos', 10, 13], montar: marina },
  { id: 'marina_pier', luta: 'leader_marina_pier', nome: 'Estádio do Píer', piso: 'D', estilo: 'casa', papel: 'azul', volta: [435, 308.6], montar: pier },
  { id: 'jonas', luta: 'leader_jonas', nome: 'Estádio da Lanterna', piso: 't', estilo: 'lab', dark: true, volta: ['farol_topo', 4, 12.6], montar: jonas },
  { id: 'zelia', luta: 'leader_zelia', nome: 'Estádio do Luar', piso: 'f', estilo: 'casa', papel: 'listrado', dark: true, volta: ['casarao_velas', 55, 12.6], montar: zelia },
  { id: 'bras', luta: 'leader_bras', nome: 'Estádio da Roda', piso: ':', estilo: 'casa', papel: 'madeira', volta: ['roda_capoeira', 10, 3.5], montar: bras },
  { id: 'graca', luta: 'leader_graca', nome: 'Estádio da Mina', piso: 'k', estilo: 'caverna', volta: ['mina_velha', 10, 3.5], montar: graca },
  { id: 'celeste', luta: 'leader_celeste', nome: 'Estádio do Céu', piso: 'E', estilo: 'templo', volta: ['torre_vento', 10, 3.5], montar: celeste },
  { id: 'vespera', luta: 'c12_vespera', nome: 'Estádio dos Menires', piso: '.', estilo: 'templo', volta: [300, 76.4], montar: vespera },
  { id: 'necrozma', luta: 'c12_necrozma', nome: 'Estádio do Coração', piso: 'Z', estilo: 'templo', dark: true, volta: ['camara_coracao', 9.5, 11.2], montar: necrozma },
  { id: 'aurelio', luta: 'elite_aurelio', nome: 'Estádio da Madrugada', piso: 'X', estilo: 'templo', dark: true, volta: ['sala_madrugada', 9.5, 11.2], montar: aurelio },
  { id: 'clarice', luta: 'elite_clarice', nome: 'Estádio da Manhã', piso: '.', estilo: 'casa', papel: 'rosa', volta: ['sala_manha', 9.5, 11.2], montar: clarice },
  { id: 'brasa', luta: 'elite_brasa', nome: 'Estádio do Meio-dia', piso: 'v', estilo: 'caverna', volta: ['sala_meio_dia', 9.5, 11.2], montar: brasa },
  { id: 'ibere', luta: 'elite_ibere', nome: 'Estádio do Entardecer', piso: 'X', estilo: 'templo', volta: ['sala_entardecer', 9.5, 11.2], montar: ibere },
  { id: 'dalva', luta: 'campea_dalva', nome: 'Estádio da Campeã', piso: 'Y', estilo: 'templo', volta: ['salao_campea', 9.5, 11.2], montar: dalva },
];
export const estadioDaLuta = (luta) => ESTADIOS.find((e) => e.luta === luta) ?? null;
export const salaDoEstadio = (id) => 'estadio_' + id;

// ---------------------------------------------------------------- montagem (grade de caracteres + objetos)
class Planta {
  constructor(piso) {
    this.g = Array.from({ length: ESTADIO_H }, (_, y) => Array.from({ length: ESTADIO_W }, (_, x) => (x === 0 || y === 0 || x === ESTADIO_W - 1 || y === ESTADIO_H - 1 ? 'w' : piso)));
    this.objs = []; this.decor = [];
  }
  ret(ch, x, y, w = 1, h = 1) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i > 0 && j > 2 && i < ESTADIO_W - 1 && j < ESTADIO_H - 1) this.g[j][i] = ch; return this; }
  espRet(ch, x, y, w = 1, h = 1) { return this.ret(ch, x, y, w, h).ret(ch, espX(x, w), y, w, h); }
  ch(x, y) { return this.g[y]?.[x]; }
  obj(kind, x, y, fw = 1, extra = {}) { this.objs.push({ kind, x, y, ...extra }); void fw; return this; }
  espObj(kind, x, y, fw = 1, extra = {}) { this.obj(kind, x, y, fw, extra); if (espX(x, fw) !== x) this.obj(kind, espX(x, fw), y, fw, extra); return this; }
  // disco (centro em blocos, raio): pinta o caractere
  disco(ch, cx, cy, r) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if (Math.hypot(x - cx, y - cy) <= r) this.ret(ch, x, y); return this; }
  linhas() { return this.g.map((l) => l.join('')); }
}

// arquibancada: oito blocos de "stands" (6 x 2) ocupam as fileiras 1 e 2, de ponta a ponta
function arquibancada(P) { for (let x = 1; x + 6 <= ESTADIO_W - 1; x += 6) P.obj('stands', x, 1, 6); }

function tome(P) { // milharal: chão de grama listrada, dois açudes, pedras onde dá para subir
  for (let y = 3; y < 35; y++) if (Math.floor(y / 2) % 2) P.ret(',', 1, y, 48, 1);
  P.espRet('~', 4, 16, 4, 4);                 // açudes (cobertura de chão: só quem voa ou nada atravessa)
  P.espObj('boulder', 12, 10, 2).espObj('boulder', 12, 27, 2); // pedras: lugar alto
  P.espObj('haybale', 3, 5).espObj('haybale', 3, 31);
}
function lia(P) { // teia prateada por toda parte, passarelas douradas em grade
  for (const y of [8, 18, 28]) P.ret('y', 1, y, 48, 2);
  for (const x of [7, 24, 41]) P.ret('y', x, 3, 2, 32);
  P.ret('y', 1, 32, 48, 3); P.ret('y', 1, 3, 48, 2);  // chão firme na frente de cada treinador
  P.espObj('folhaGigante', 13, 13, 2).espObj('folhaGigante', 13, 23, 2);
  P.espObj('bush', 4, 13).espObj('bush', 4, 23).espObj('bush', 31, 6).espObj('bush', 31, 30);
}
function marina(P) { // galpão: piscina no meio (água funda no centro), ponte e ilhas
  P.ret('~', 13, 11, 24, 16).ret('W', 17, 14, 16, 10);
  P.espRet('D', 16, 14, 3, 3).espRet('D', 16, 21, 3, 3); // ilhas (nunca alagam: são as "altas" da inundação)
  P.ret('b', 24, 11, 2, 16);                             // ponte no meio (divide a piscina em duas metades)
  P.ret('B', 13, 18, 24, 2);                             // e a passarela de través: nenhum ponto da água fica a mais de 4 blocos do chão
  P.espObj('crate', 6, 12).espObj('crate', 6, 25).espObj('barrel', 7, 18).espObj('crate', 10, 4).espObj('crate', 10, 33);
}
function pier(P) { // píer comprido: deque de madeira cortado por três canais de água
  for (const x of [9, 23, 37]) P.ret('~', x, 6, 4, 26);
  P.ret('W', 24, 10, 2, 18);
  P.espObj('crate', 4, 10).espObj('crate', 4, 26).espObj('barrel', 16, 8).espObj('barrel', 16, 28).espObj('crate', 19, 18);
}
function jonas(P) { // lanterna do farol: piso de metal, máquinas e caixotes como cobertura
  P.espObj('machine', 9, 10, 2).espObj('machine', 9, 26, 2).espObj('crate', 18, 17).espObj('crate', 18, 19);
  P.espObj('crate', 4, 18);
  P.obj('cristal', 24, 18).obj('cristal', 25, 18); // a lente do farol no centro
}
function zelia(P) { // salão do luar: colunatas dos dois lados, estátuas
  for (const y of [8, 14, 22, 28]) P.espObj('column', 12, y);
  P.espObj('statue', 20, 11, 2).espObj('statue', 20, 26, 2);
  P.espObj('pot', 3, 4).espObj('pot', 3, 33);
}
function bras(P) { // roda: areia, a roda de quadra no meio e tábuas
  P.disco('c', 24.5, 18.5, 9.5);
  P.espObj('barrel', 6, 8).espObj('barrel', 6, 29).espObj('log', 3, 18, 4);
  P.espObj('bell', 15, 4, 2);
}
function graca(P) { // mina: chão de caverna, três linhas de trilho, pedras e estalagmites
  for (const y of [9, 19, 29]) P.ret('+', 1, y, 48, 1);
  P.espObj('boulder', 6, 14, 2).espObj('boulder', 6, 24, 2).espObj('boulder', 19, 5, 2).espObj('boulder', 19, 33, 2);
  P.espObj('stalagmite', 14, 12).espObj('stalagmite', 14, 26).espObj('crystal', 3, 4).espObj('crystal', 3, 33);
}
function celeste(P) { // topo da torre: tudo é céu fora das plataformas (a peça "queda" da arena desenha o céu)
  P.espObj('column', 2, 9).espObj('column', 2, 28);
}
function vespera(P) { // anel dos menires: grama com o círculo escuro, o relógio de sol no meio
  P.disco('d', 24.5, 18.5, 13);
  P.disco('.', 24.5, 18.5, 9);
  P.obj('sundial', 24, 18, 2);
  P.espObj('menhir', 4, 6).espObj('menhir', 4, 31).espObj('menhir', 10, 4).espObj('menhir', 10, 33);
}
function necrozma(P) { // câmara do coração: chão de cristal, cristais altos em volta
  for (const [x, y] of [[8, 8], [8, 29], [16, 12], [16, 25], [6, 18], [20, 6], [20, 31]]) P.espObj('crystal', x, y);
  P.espObj('obelisk', 13, 18);
}
function aurelio(P) { // madrugada: pedra velha, colunas e estátuas
  for (const y of [9, 16, 21, 28]) P.espObj('column', 11, y);
  P.espObj('statue', 19, 10, 2).espObj('statue', 19, 27, 2);
}
function clarice(P) { // manhã: jardim florido, laguinhos e arbustos
  for (let y = 3; y < 35; y++) for (let x = 1; x < 49; x++) if ((x * 7 + y * 13) % 5 === 0) P.ret('*', x, y);
  P.espRet('~', 5, 16, 5, 4);
  P.espObj('roundbush', 13, 9, 3).espObj('roundbush', 13, 28, 3).espObj('flowerpot', 3, 4).espObj('flowerpot', 3, 33);
}
function brasa(P) { // meio-dia: basalto e quatro poças de lava (só quem voa passa por cima)
  P.espRet('l', 8, 9, 4, 3).espRet('l', 8, 26, 4, 3).ret('l', 23, 17, 4, 3);
  P.espObj('lavaRock', 17, 6, 2).espObj('lavaRock', 17, 31, 2).espObj('brazier', 3, 4).espObj('brazier', 3, 33);
}
function ibere(P) { // entardecer: pedra velha com areia, pedras grandes e colunas quebradas
  P.disco(':', 24.5, 18.5, 11);
  P.espObj('boulder', 9, 9, 2).espObj('boulder', 9, 28, 2).espObj('boulder', 3, 18, 2);
  for (const y of [7, 30]) P.espObj('brokenColumn', 17, y);
}
function dalva(P) { // salão da campeã: mosaico, colunas e as estátuas da estrela-d'alva
  for (const y of [8, 29]) for (const x of [8, 16]) P.espObj('column', x, y);
  P.espObj('statue', 21, 5, 2).espObj('lamp', 3, 4).espObj('lamp', 3, 33);
}

// As salas dos estádios, prontas para a lista de interiores do mundo (posição absoluta na faixa do núcleo)
export function salasEstadios() {
  return ESTADIOS.map((E, i) => {
    // Líderes: quadra ampla e desimpedida. Elite e chefes da história mantêm seus cenários.
    const simples = E.luta.startsWith('leader_');
    const P = new Planta(simples ? 't' : E.piso);
    arquibancada(P);
    if (!simples) E.montar(P);
    return {
      id: salaDoEstadio(E.id), name: E.nome, x: 4 + i * PASSO, y: ESTADIO_Y, rows: P.linhas(), objects: P.objs, decor: P.decor,
      spots: {}, people: [], receita: false, estilo: E.estilo, ...(E.papel ? { papel: E.papel } : {}), ...(!simples && E.dark ? { dark: true } : {}),
      estadio: { simples, id: E.id, luta: E.luta, volta: E.volta },
    };
  });
}
