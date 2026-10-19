import { T, TILE } from '../world/tiles.js';

// Espaço para a batalha contra treinador. A luta acontece no mapa, onde o treinador está; quando ele está num
// lugar apertado (corredor do Farol Coral, entre estantes, ao lado da escada), os dois Pokémon brigavam meio
// atrás da parede e fora da tela (pedido do dono: "a arena é totalmente inadequada, não tem espaço").
// Aqui: o lugar tem espaço se cabe um retângulo livre de LARGO x ALTO blocos (deitado, 9 x 7) em volta do meio
// entre o jogador e o treinador. Se não cabe, acha o retângulo livre mais perto (na mesma sala; fora, num raio)
// e a luta vai para lá; no fim, todo mundo volta para onde estava (src/story/story.js).
// Usado também pela auditoria dos pontos de treinador (tools/teste-3d/treinadores-espaco.mjs).

export const LARGO = 9, ALTO = 7;
// chão onde não se luta: escada e porta (levariam para outro lugar), buraco, areia movediça, gelo, maré
const RUINS = new Set([TILE.STAIRS, TILE.STAIRUP, TILE.STAIRDOWN, TILE.HOLE, TILE.CRACK, TILE.QUICKSAND, TILE.ICE, TILE.TIDE, TILE.CAVEDOOR].filter((t) => t != null));

// blocos livres para lutar, em volta de (tx, ty), num quadrado de lado 2R+1; extra(k) = bloco proibido a mais
function grade(map, tx, ty, R, extra) {
  const W = 2 * R + 1, x0 = tx - R, y0 = ty - R, sala = map.interiorAt(tx * T + 8, ty * T + 8);
  const ok = new Uint8Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const x = x0 + i, y = y0 + j;
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
    const px = x * T + 8, py = y * T + 8, k = x + y * map.w;
    if (map.solidAt(px, py) || RUINS.has(map.at(x, y)) || map.warpAt?.get(k) || extra?.(k)) continue;
    if (map.interiorAt(px, py) !== sala) continue;
    ok[i + j * W] = 1;
  }
  // tabela de somas: soma de qualquer retângulo em O(1)
  const S = new Int32Array((W + 1) * (W + 1));
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) S[(i + 1) + (j + 1) * (W + 1)] = ok[i + j * W] + S[i + (j + 1) * (W + 1)] + S[(i + 1) + j * (W + 1)] - S[i + j * (W + 1)];
  const soma = (i, j, w, h) => S[(i + w) + (j + h) * (W + 1)] - S[i + (j + h) * (W + 1)] - S[(i + w) + j * (W + 1)] + S[i + j * (W + 1)];
  return { W, x0, y0, soma };
}

// retângulo livre w x h que contém o bloco (tx, ty)?
export function temEspaco(map, tx, ty, { w = LARGO, h = ALTO, extra } = {}) {
  const G = grade(map, tx, ty, Math.max(w, h), extra), ci = tx - G.x0, cj = ty - G.y0;
  for (let j = cj - h + 1; j <= cj; j++) for (let i = ci - w + 1; i <= ci; i++) {
    if (i < 0 || j < 0 || i + w > G.W || j + h > G.W) continue;
    if (G.soma(i, j, w, h) === w * h) return true;
  }
  return false;
}

// retângulo livre mais perto de (tx, ty): { x0, y0, w, h, cx, cy } em blocos, ou null
export function acharEspaco(map, tx, ty, { raio = 22, extra, tamanhos = [[LARGO, ALTO], [8, 6], [7, 6]] } = {}) {
  const G = grade(map, tx, ty, raio, extra);
  for (const [w, h] of tamanhos) {
    let best = null, bd = 1e9;
    for (let j = 0; j + h <= G.W; j++) for (let i = 0; i + w <= G.W; i++) {
      if (G.soma(i, j, w, h) !== w * h) continue;
      const cx = G.x0 + i + (w - 1) / 2, cy = G.y0 + j + (h - 1) / 2, d = Math.hypot(cx - tx, cy - ty);
      if (d < bd) { bd = d; best = { x0: G.x0 + i, y0: G.y0 + j, w, h, cx, cy }; }
    }
    if (best) return best;
  }
  return null;
}

// Onde cada um fica no retângulo: jogador numa ponta, treinador na outra (deitado: lado a lado, como a tela);
// o lado de cada um segue o lado em que estavam antes.
export function lugares(r, jogadorAEsquerda = true) {
  const yy = Math.round(r.cy), xe = r.x0 + 1, xd = r.x0 + r.w - 2;
  const [jx, nx] = jogadorAEsquerda ? [xe, xd] : [xd, xe];
  const px = (x) => x * T + 8, py = (y) => y * T + 10;
  return { jogador: { x: px(jx), y: py(yy), dir: jogadorAEsquerda ? 'right' : 'left' }, treinador: { x: px(nx), y: py(yy), dir: jogadorAEsquerda ? 'left' : 'right' } };
}
