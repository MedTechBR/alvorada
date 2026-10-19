import { T, TILE } from '../world/tiles.js';

// Espaço para a batalha contra treinador. A luta acontece no mapa, onde o treinador está; quando ele está num
// lugar apertado (corredor do Farol Coral, entre estantes, ao lado da escada), os dois Pokémon brigavam meio
// atrás da parede e fora da tela (pedido do dono: "a arena é totalmente inadequada, não tem espaço").
// Aqui: o lugar tem espaço se cabe um retângulo livre de LARGO x ALTO blocos (deitado, 9 x 7) em volta do meio
// entre o jogador e o treinador. Se não cabe, acha o retângulo livre mais perto (na mesma sala; fora, num raio)
// e a luta vai para lá; no fim, todo mundo volta para onde estava (src/story/story.js).
// Um ou dois objetos soltos dentro do retângulo (estante, gerador, caixa) não atrapalham: o que tira o espaço é
// parede e corredor, então cada tamanho aceita uns poucos blocos ocupados (FOLGA).
// Usado também pela auditoria dos pontos de treinador (tools/teste-3d/treinadores-espaco.mjs).

export const LARGO = 9, ALTO = 7;
const FOLGA = (w, h) => Math.floor(w * h / 20); // 9x7: até 3 blocos ocupados; 8x6: 2; 7x6: 2
// chão onde não se luta: escada e porta (levariam para outro lugar), buraco, areia movediça, gelo, maré
const RUINS = new Set([TILE.STAIRS, TILE.STAIRUP, TILE.STAIRDOWN, TILE.HOLE, TILE.CRACK, TILE.QUICKSAND, TILE.ICE, TILE.TIDE, TILE.CAVEDOOR].filter((t) => t != null));

// blocos livres para lutar, em volta de (tx, ty), num quadrado de lado 2R+1; extra(k) = bloco proibido a mais
function grade(map, tx, ty, R, extra) {
  const W = 2 * R + 1, x0 = tx - R, y0 = ty - R, sala = map.interiorAt(tx * T + 8, ty * T + 8);
  const ok = new Uint8Array(W * W), pe = new Uint8Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const x = x0 + i, y = y0 + j;
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
    const px = x * T + 8, py = y * T + 8, k = x + y * map.w, w = map.warpAt?.get(k);
    if (map.solidAt(px, py) || RUINS.has(map.at(x, y)) || (w && !w.trap) || extra?.(k)) continue;
    if (map.interiorAt(px, py) !== sala) continue;
    ok[i + j * W] = 1;
    pe[i + j * W] = w ? 0 : 1; // teia-armadilha (ginásio da Lia): o Pokémon luta por cima, o treinador não pisa
  }
  // tabela de somas: soma de qualquer retângulo em O(1)
  const S = new Int32Array((W + 1) * (W + 1));
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) S[(i + 1) + (j + 1) * (W + 1)] = ok[i + j * W] + S[i + (j + 1) * (W + 1)] + S[(i + 1) + j * (W + 1)] - S[i + j * (W + 1)];
  const soma = (i, j, w, h) => S[(i + w) + (j + h) * (W + 1)] - S[i + (j + h) * (W + 1)] - S[(i + w) + j * (W + 1)] + S[i + j * (W + 1)];
  return { W, x0, y0, soma, ok: (i, j) => i >= 0 && j >= 0 && i < W && j < W && pe[i + j * W] === 1 };
}

// retângulo livre w x h que contém o bloco (tx, ty)?
export function temEspaco(map, tx, ty, { w = LARGO, h = ALTO, extra } = {}) {
  const G = grade(map, tx, ty, Math.max(w, h), extra), ci = tx - G.x0, cj = ty - G.y0;
  for (let j = cj - h + 1; j <= cj; j++) for (let i = ci - w + 1; i <= ci; i++) {
    if (i < 0 || j < 0 || i + w > G.W || j + h > G.W) continue;
    if (G.soma(i, j, w, h) >= w * h - FOLGA(w, h)) return true;
  }
  return false;
}

// retângulo livre mais perto de (tx, ty): { x0, y0, w, h, cx, cy } em blocos (aperto: true = o melhor que há), ou null
export function acharEspaco(map, tx, ty, { raio = 22, extra, tamanhos = [[LARGO, ALTO], [8, 6], [7, 6]] } = {}) {
  const G = grade(map, tx, ty, raio, extra);
  // todos os tamanhos juntos: o menor custa um pouco mais (prefere 8x6 ali do lado a 9x7 do outro lado do mapa)
  let best = null, bd = 1e9;
  for (const [w, h] of tamanhos) {
    const pena = (tamanhos[0][0] * tamanhos[0][1] - w * h) / 4;
    for (let j = 0; j + h <= G.W; j++) for (let i = 0; i + w <= G.W; i++) {
      const livres = G.soma(i, j, w, h); if (livres < w * h - FOLGA(w, h)) continue;
      const cx = G.x0 + i + (w - 1) / 2, cy = G.y0 + j + (h - 1) / 2, d = Math.hypot(cx - tx, cy - ty) + (w * h - livres) * 1.5 + pena; // prefere o mais limpo
      if (d < bd) { bd = d; best = { x0: G.x0 + i, y0: G.y0 + j, w, h, cx, cy, livre: (x, y) => G.ok(x - G.x0, y - G.y0) }; }
    }
  }
  if (best) return best;
  // nenhum retângulo limpo por perto (sala inteira em corredores: templo, galpão com piscina): o pedaço 9x7 mais
  // aberto da sala, se tiver pelo menos metade livre e for mais aberto do que onde está
  const [w, h] = tamanhos[0]; let bl = Math.ceil(w * h * 0.5) - 1; bd = 1e9;
  for (let j = 0; j + h <= G.W; j++) for (let i = 0; i + w <= G.W; i++) {
    const livres = G.soma(i, j, w, h), cx = G.x0 + i + (w - 1) / 2, cy = G.y0 + j + (h - 1) / 2, d = Math.hypot(cx - tx, cy - ty);
    if (livres > bl || (livres === bl && d < bd)) { bl = livres; bd = d; best = { x0: G.x0 + i, y0: G.y0 + j, w, h, cx, cy, livres, aperto: true, livre: (x, y) => G.ok(x - G.x0, y - G.y0) }; }
  }
  return best;
}

// Onde cada um fica no retângulo: jogador numa ponta, treinador na outra (deitado: lado a lado, como a tela);
// o lado de cada um segue o lado em que estavam antes.
export function lugares(r, jogadorAEsquerda = true) {
  const livre = r.livre ?? (() => true), yy = Math.round(r.cy);
  // bloco livre mais perto de (x, y) dentro do retângulo (anda para dentro e para cima/baixo)
  const perto = (x, y, passo) => {
    for (let a = 0; a < 3; a++) for (const dy of [0, 1, -1, 2, -2, 3, -3]) { const xx = x + a * passo, y2 = y + dy; if (y2 >= r.y0 && y2 < r.y0 + r.h && livre(xx, y2)) return [xx, y2]; }
    return [x, y];
  };
  const esq = perto(r.x0 + 1, yy, 1), dir = perto(r.x0 + r.w - 2, yy, -1);
  const [j, n] = jogadorAEsquerda ? [esq, dir] : [dir, esq];
  const px = (x) => x * T + 8, py = (y) => y * T + 10;
  return { jogador: { x: px(j[0]), y: py(j[1]), dir: jogadorAEsquerda ? 'right' : 'left' }, treinador: { x: px(n[0]), y: py(n[1]), dir: jogadorAEsquerda ? 'left' : 'right' } };
}
