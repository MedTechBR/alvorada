import { TILE } from '../../world/tiles.js';
import { PAREDE } from '../relevo.js';

// Ondulação suave do chão no estilo Let's Go (só visual: a lógica do jogo continua plana).
// A altura extra é definida nos CANTOS dos blocos e interpolada dentro deles; o chão do 3D, os sprites, os modelos e a
// câmera usam a mesma conta (Visual3D.altura), então ninguém flutua nem afunda.
// A ondulação some perto do que não é grama (trilhas, praças, água, penhascos, casas) e fora da zona: as emendas com
// os penhascos e com os setores voxel ficam exatas (altura extra 0 nos cantos da borda).
const AMP = 7;   // px de mundo (bloco = 16)
const RAIO = 4;  // blocos: até onde se procura o que achata
const GRAMA = new Uint8Array(256); for (const t of [TILE.GRASS, TILE.GRASS2, TILE.TALL, TILE.FLOWERS, TILE.DARK, TILE.GOLD, TILE.FOREST]) GRAMA[t] = 1;
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const ondaLG = (cx, cy) => 0.62 * Math.sin(cx * 0.29 + 1.0) * Math.cos(cy * 0.23 + 0.4) + 0.38 * Math.sin(cx * 0.17 - cy * 0.21 + 2.1) + 0.18 * Math.sin(cx * 0.61 + cy * 0.47);

export class RelevoLG {
  constructor(v, zona) { this.v = v; this.zona = zona; this.cantos = new Map(); this.grandes = null; }
  limpar() { this.cantos.clear(); this.grandes = null; }
  // um bloco mudou: refaz os cantos dos setores em volta
  sujo(x, y) { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) this.cantos.delete(((x >> 4) + i) + ((y >> 4) + j) * 4096); }
  // pegada dos objetos grandes (casas, salões, ginásio): o chão embaixo fica plano
  #grandes() {
    if (this.grandes) return this.grandes;
    const G = this.grandes = new Set(), m = this.v.g.map;
    for (const o of m.objects ?? []) {
      const fw = o.fw ?? 1, fh = o.fh ?? 1; if (fw * fh < 6 && o.doorX === undefined) continue;
      for (let y = o.ty - 1; y <= o.ty + fh; y++) for (let x = o.tx - 1; x <= o.tx + fw; x++) G.add(x + y * 65536);
    }
    return G;
  }
  // o bloco aceita ondulação?
  #ondula(x, y) {
    const L = this.v.L, R = this.v.relevo, t = L.blocoCru(x, y);
    if (!GRAMA[t] || PAREDE[t]) return false;
    if (!this.zona.emBloco(x, y)) return false;
    const h = R.n(x, y); if (Math.abs(R.s(x, y) - h) > 0.01) return false;
    // vizinho em outra altura (beira de penhasco): plano
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = L.blocoCru(x + a, y + b); if (PAREDE[q] || Math.abs(R.n(x + a, y + b) - h) > 0.01) return false; }
    return !this.#grandes().has(x + y * 65536);
  }
  // alturas extras dos cantos de um setor (17x17), calculadas uma vez
  #setor(sx, sy) {
    const k = sx + sy * 4096; let c = this.cantos.get(k); if (c) return c;
    const x0 = sx * 16 - RAIO, y0 = sy * 16 - RAIO, W = 16 + RAIO * 2, ok = new Uint8Array(W * W);
    for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) ok[i + j * W] = this.#ondula(x0 + i, y0 + j) ? 1 : 0;
    c = new Float32Array(17 * 17);
    for (let j = 0; j <= 16; j++) for (let i = 0; i <= 16; i++) {
      // canto (cx, cy) = canto noroeste do bloco (cx, cy); distância até o bloco mais perto que não ondula
      const cx = sx * 16 + i, cy = sy * 16 + j; let d = RAIO;
      for (let b = -RAIO; b < RAIO; b++) for (let a = -RAIO; a < RAIO; a++) {
        if (ok[(cx + a - x0) + (cy + b - y0) * W]) continue;
        const dd = Math.hypot(a + 0.5, b + 0.5) - 0.5; if (dd < d) d = dd;
      }
      c[i + j * 17] = AMP * ss(0.35, 3.2, d) * ondaLG(cx, cy);
    }
    this.cantos.set(k, c);
    return c;
  }
  // altura extra no canto (cx, cy) (em blocos)
  canto(cx, cy) { const sx = Math.floor(cx / 16), sy = Math.floor(cy / 16); return this.#setor(sx, sy)[(cx - sx * 16) + (cy - sy * 16) * 17]; }
  // altura extra num ponto (px de mundo)
  em(px, py) {
    const x = px / 16, y = py / 16, cx = Math.floor(x), cy = Math.floor(y);
    if (!this.zona.emBloco(cx, cy)) return 0;
    const fx = x - cx, fy = y - cy, sx = cx >> 4, sy = cy >> 4, c = this.#setor(sx, sy), i = cx - sx * 16, j = cy - sy * 16;
    const a = c[i + j * 17], b = c[i + 1 + j * 17], d = c[i + (j + 1) * 17], e = c[i + 1 + (j + 1) * 17];
    return a + (b - a) * fx + (d - a) * fy + (a - b - d + e) * fx * fy;
  }
  // inclinação no canto (para a normal suave do chão): [dh/dx, dh/dz] por px
  grad(cx, cy) { return [(this.canto(cx + 1, cy) - this.canto(cx - 1, cy)) / 32, (this.canto(cx, cy + 1) - this.canto(cx, cy - 1)) / 32]; }
}
