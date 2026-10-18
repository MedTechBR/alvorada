import { TILE, WALLS } from '../world/tiles.js';

// Relevo deduzido do mapa 2D (o mapa não guarda altura; a lógica continua plana).
// - Penhascos (CLIFF, CLIMB) e escadas separam o chão andável em regiões. Cada faixa de penhasco diz que a
//   região ao norte fica um degrau acima da região ao sul (a face do 2D olha para o sul, para a câmera).
//   As restrições vão para uma união-busca com deslocamento; se a mesma região estiver dos dois lados, ou as
//   faixas se contradizem, a faixa vira mureta (sobe e desce).
// - A face ocupa exatamente os blocos do penhasco no 2D, inclinada do pé ao topo: a colisão não muda.
// - Cada bloco tem altura na borda norte (n) e na borda sul (s); fora das faces as duas são iguais.
// - Calculado por zonas grandes (com margem), sob demanda: mundos montados aos pedaços continuam funcionando.
export const DEGRAU = 24;
const BARREIRA = new Uint8Array(256); for (const t of [TILE.CLIFF, TILE.CLIMB, TILE.STAIRS]) BARREIRA[t] = 1;
const FACE = new Uint8Array(256); FACE[TILE.CLIFF] = 1; FACE[TILE.CLIMB] = 1;
// altura das paredes (bloco cheio); a linha de baixo da parede é a face
export const PAREDE = new Float32Array(256);
for (const t of WALLS) PAREDE[t] = 40;
PAREDE[TILE.ICEWALL] = 34; PAREDE[TILE.LAVAWALL] = 34; PAREDE[TILE.CANYON] = 48; PAREDE[TILE.ROCK] = 36;
const ZONA = 512, MARGEM = 96;

export class Relevo {
  constructor(L) { this.L = L; this.zonas = new Map(); }
  limpar() { this.zonas.clear(); }
  #zona(x, y) {
    const zx = Math.floor(x / ZONA), zy = Math.floor(y / ZONA), k = zx + zy * 4096;
    let z = this.zonas.get(k);
    if (!z) { z = this.#calcular(zx * ZONA, zy * ZONA); this.zonas.set(k, z); }
    return z;
  }
  // altura (px) da borda norte e sul do bloco
  n(x, y) { const z = this.#zona(x, y); return z.hn[(x - z.x0) + (y - z.y0) * z.W] ?? 0; }
  s(x, y) { const z = this.#zona(x, y); return z.hs[(x - z.x0) + (y - z.y0) * z.W] ?? 0; }
  // altura do chão num ponto qualquer (px de mundo)
  em(px, py) {
    const x = Math.floor(px / 16), y = Math.floor(py / 16);
    if (x < 0 || y < 0 || x >= this.L.w || y >= this.L.h) return 0;
    const z = this.#zona(x, y), i = (x - z.x0) + (y - z.y0) * z.W, f = py / 16 - y;
    return z.hn[i] + (z.hs[i] - z.hn[i]) * f;
  }
  #calcular(cx0, cy0) {
    const L = this.L, MW = L.w, MH = L.h;
    const x0 = Math.max(0, cx0 - MARGEM), y0 = Math.max(0, cy0 - MARGEM), x1 = Math.min(MW, cx0 + ZONA + MARGEM), y1 = Math.min(MH, cy0 + ZONA + MARGEM);
    const W = x1 - x0, H = y1 - y0, N = W * H;
    const tiles = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) tiles[x + y * W] = L.blocoCru(x0 + x, y0 + y);
    // 1) regiões: componentes ligados do chão que não é penhasco nem escada
    const comp = new Int32Array(N).fill(-1), size = [];
    const stack = new Int32Array(N);
    let nc = 0;
    for (let i = 0; i < N; i++) {
      if (comp[i] >= 0 || BARREIRA[tiles[i]]) continue;
      let sp = 0, cnt = 0; stack[sp++] = i; comp[i] = nc;
      while (sp) {
        const k = stack[--sp]; cnt++;
        const x = k % W, y = (k / W) | 0;
        if (x > 0) { const j = k - 1; if (comp[j] < 0 && !BARREIRA[tiles[j]]) { comp[j] = nc; stack[sp++] = j; } }
        if (x < W - 1) { const j = k + 1; if (comp[j] < 0 && !BARREIRA[tiles[j]]) { comp[j] = nc; stack[sp++] = j; } }
        if (y > 0) { const j = k - W; if (comp[j] < 0 && !BARREIRA[tiles[j]]) { comp[j] = nc; stack[sp++] = j; } }
        if (y < H - 1) { const j = k + W; if (comp[j] < 0 && !BARREIRA[tiles[j]]) { comp[j] = nc; stack[sp++] = j; } }
      }
      size.push(cnt); nc++;
    }
    // 2) faixas de penhasco por coluna: (norte, sul) com votos
    const runs = [], votos = new Map();
    for (let x = 0; x < W; x++) {
      let y = 0;
      while (y < H) {
        if (!BARREIRA[tiles[x + y * W]]) { y++; continue; }
        const ya = y; let face = false;
        while (y < H && BARREIRA[tiles[x + y * W]]) { if (FACE[tiles[x + y * W]]) face = true; y++; }
        const yb = y - 1;
        const cn = ya > 0 ? comp[x + (ya - 1) * W] : -1, cs = yb < H - 1 ? comp[x + (yb + 1) * W] : -1;
        const r = { x, ya, yb, cn, cs, face, lateral: yb - ya >= 3 && face };
        runs.push(r);
        if (cn >= 0 && cs >= 0 && !r.lateral) { const k = cn * 1e6 + cs; votos.set(k, (votos.get(k) ?? 0) + 1); }
      }
    }
    // 3) união-busca com deslocamento: nível(norte) = nível(sul) + 1
    const par = new Int32Array(nc), off = new Int32Array(nc);
    for (let i = 0; i < nc; i++) par[i] = i;
    const find = (a) => { let o = 0, r = a; while (par[r] !== r) { o += off[r]; r = par[r]; } // compressão
      let b = a, ob = o; while (par[b] !== b) { const nx = par[b], ox = off[b]; par[b] = r; off[b] = ob; ob -= ox; b = nx; } return [r, o]; };
    const ruim = new Set();
    const pares = [...votos.entries()].sort((a, b) => b[1] - a[1]);
    for (const [k] of pares) {
      const cn = Math.floor(k / 1e6), cs = k % 1e6;
      if (cn === cs) { ruim.add(k); continue; }
      const [rn, on] = find(cn), [rs, os] = find(cs);
      if (rn === rs) { if (on - os !== 1) ruim.add(k); continue; }
      par[rn] = rs; off[rn] = os + 1 - on;
    }
    // 4) nível por região: o da maior região de cada grupo é 0
    const lvl = new Int32Array(nc), base = new Map();
    for (let c = 0; c < nc; c++) { const [r, o] = find(c); lvl[c] = o; const b = base.get(r); if (!b || size[c] > b.s) base.set(r, { s: size[c], o }); }
    for (let c = 0; c < nc; c++) { const [r] = find(c); lvl[c] = Math.max(-4, Math.min(8, lvl[c] - base.get(r).o)); }
    // 5) alturas por bloco
    const hn = new Float32Array(N), hs = new Float32Array(N);
    for (let i = 0; i < N; i++) if (comp[i] >= 0) hn[i] = hs[i] = lvl[comp[i]] * DEGRAU;
    for (const r of runs) {
      let a = r.cs >= 0 ? lvl[r.cs] * DEGRAU : null, b = r.cn >= 0 ? lvl[r.cn] * DEGRAU : null; // a = pé (sul), b = topo (norte)
      if (a == null && b == null) a = b = 0; else if (a == null) a = b - DEGRAU; else if (b == null) b = a + DEGRAU;
      const n = r.yb - r.ya + 1;
      if (r.lateral) { const top = Math.max(a, b) + 10; for (let y = r.ya; y <= r.yb; y++) { const i = r.x + y * W; hn[i] = hs[i] = top; } continue; }
      const k = r.cn * 1e6 + r.cs;
      if (r.cn >= 0 && r.cs >= 0 && (ruim.has(k) || b <= a)) b = Math.max(a, b) + (r.face ? DEGRAU : 0); // mureta (ou escada solta)
      for (let y = r.ya; y <= r.yb; y++) { const i = r.x + y * W; hn[i] = a + (b - a) * (r.yb + 1 - y) / n; hs[i] = a + (b - a) * (r.yb - y) / n; }
    }
    return { x0, y0, W, H, hn, hs };
  }
}
