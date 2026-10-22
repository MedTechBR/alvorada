import { TILE } from './tiles.js';

// Modelo de composição: Vila Alvorada e Rota 1. Não altera sólidos, encontros, portas ou progressão.
const CIDADE = [1425, 1665, 220, 180], ROTA = [900, 1590, 530, 280];
const dentro = (r, x, y) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
export function noPilotoVisual(map, px, py) {
  return map.id === 'alvorada' && (dentro(CIDADE, px / 16, py / 16) || dentro(ROTA, px / 16, py / 16));
}
const JARDINS = [
  [1515,1745,4,5], [1527,1745,4,4], [1536,1745,4,4], [1547,1745,4,5],
  [1510,1762,3,6], [1516,1768,4,3], [1548,1764,4,7], [1532,1754,5,3],
];
const VERDES = new Set([TILE.GRASS, TILE.GRASS2, TILE.FLOWERS]);
export function comporPilotoVisual(S, P) {
  if (!S.J.layoutGeografico || P.i !== S.J.partes.filter(p => !p.lazy).at(-1)?.i) return;
  const W = S.W, t = S.tiles;
  // Jardins junto às fachadas, gramado contínuo na circulação. O mato de encontros fica intocado.
  for (let y = CIDADE[1]; y < CIDADE[1] + CIDADE[3]; y++) for (let x = CIDADE[0]; x < CIDADE[0] + CIDADE[2]; x++) {
    const k = x + y * W; if (!VERDES.has(t[k]) || S.block[k]) continue;
    const jardim = JARDINS.find(r => dentro(r,x,y));
    t[k] = jardim ? (y === jardim[1] || y === jardim[1] + jardim[3] - 1 ? TILE.FLOWERS : TILE.GRASS2) : TILE.GRASS;
  }
  // Na rota, as flores acompanham trechos da estrada: não repetem ilhas na malha inteira do terreno.
  for (let y = ROTA[1]; y < ROTA[1] + ROTA[3]; y++) for (let x = ROTA[0]; x < ROTA[0] + ROTA[2]; x++) {
    const k = x + y * W; if (!VERDES.has(t[k]) || S.block[k] || S.nearSpot.has(k)) continue;
    let beira = false;
    for (const [dx,dy] of [[0,-3],[0,3],[-3,0],[3,0]]) if (t[x+dx+(y+dy)*W] === TILE.PATH) { beira = true; break; }
    let junto = false;
    for (const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0],[0,-2],[0,2],[-2,0],[2,0]]) if (t[x+dx+(y+dy)*W] === TILE.PATH) { junto = true; break; }
    const trecho = Math.floor((x + y * .4) / 8) % 8;
    t[k] = beira && !junto && trecho === 0 ? TILE.FLOWERS : beira ? TILE.GRASS2 : TILE.GRASS;
  }
}
