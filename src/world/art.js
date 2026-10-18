import * as PIXI from 'pixi.js';

// Arte do cenário: recortes dos conjuntos de blocos do Tuxemon (CC BY-SA 4.0, ver assets/CREDITOS.md)
// e peças em pixel art desenhadas por código no mesmo estilo (cores vivas, contorno escuro suave).
// O módulo carrega as folhas com await no topo: quem importa já recebe tudo pronto.

const BASE = new URL('../../assets/tiles/tuxemon/', import.meta.url).href;

async function sheet(name) {
  // fetch + createImageBitmap: decodifica na hora (Image.onload/decode podem atrasar com a aba em segundo plano)
  const r = await fetch(BASE + name); if (!r.ok) throw new Error('falhou ao carregar ' + name);
  const img = await createImageBitmap(await r.blob());
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const tex = PIXI.Texture.from(c); tex.source.scaleMode = 'nearest';
  return { canvas: c, ctx: x, tex, data: x.getImageData(0, 0, c.width, c.height).data, w: c.width };
}
const [NAT, WAT, OUT, BLD] = await Promise.all(['core_outdoor_nature.png', 'core_outdoor_water.png', 'core_outdoor.png', 'core_buildings.png'].map(sheet));

const sub = (sh, x, y, w, h) => new PIXI.Texture({ source: sh.tex.source, frame: new PIXI.Rectangle(x, y, w, h) });
// 16x16 em RGBA (para o compositor do chão)
function pix(sh, tx, ty, size = 16) {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const s = ((ty * 16 + y) * sh.w + tx * 16 + x) * 4, d = (y * size + x) * 4;
    out[d] = sh.data[s]; out[d + 1] = sh.data[s + 1]; out[d + 2] = sh.data[s + 2]; out[d + 3] = sh.data[s + 3];
  }
  return out;
}
function adjust(p, f) { const o = new Uint8ClampedArray(p.length); for (let i = 0; i < p.length; i += 4) { const [r, g, b] = f(p[i], p[i + 1], p[i + 2]); o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = p[i + 3]; } return o; }

export function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, c);
  return c;
}
export function texOf(c) { const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest'; return t; }
const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
const rng = (seed) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

// Contorno escuro suave em volta de tudo o que foi desenhado (estilo DS / PMD)
export function outline(c, color = [28, 36, 40], a = 230) {
  const x = c.getContext('2d'); const im = x.getImageData(0, 0, c.width, c.height), d = im.data, W = c.width, H = c.height;
  const src = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) src[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const i = y * W + X; if (src[i]) continue;
    if ((X > 0 && src[i - 1]) || (X < W - 1 && src[i + 1]) || (y > 0 && src[i - W]) || (y < H - 1 && src[i + W])) { d[i * 4] = color[0]; d[i * 4 + 1] = color[1]; d[i * 4 + 2] = color[2]; d[i * 4 + 3] = a; }
  }
  x.putImageData(im, 0, 0); return c;
}
const blob = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
const ell = (x, cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };

// ---------------- texturas do chão (para o compositor) ----------------
const lighten = (k) => (r, g, b) => [r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k];
export const GROUND = {
  grass: [pix(NAT, 16, 0), pix(NAT, 17, 0), pix(NAT, 16, 1), pix(NAT, 17, 1)],
  dark: [pix(NAT, 8, 0), pix(NAT, 9, 0), pix(NAT, 8, 1), pix(NAT, 9, 1)].map((p) => adjust(p, (r, g, b) => [r * 0.82 + 6, g * 0.86, b * 0.62])),
  sand: [pix(NAT, 32, 0), pix(NAT, 33, 0), pix(NAT, 32, 1), pix(NAT, 33, 1)].map((p) => adjust(p, lighten(0.18))),
  path: [pix(OUT, 16, 3), pix(OUT, 17, 3), pix(OUT, 21, 3), pix(OUT, 21, 5)].map((p) => adjust(p, (r, g, b) => [r * 1.12 + 22, g * 1.08 + 14, b * 0.95 + 4])),
  cliff: [pix(NAT, 18, 2), pix(NAT, 19, 2), pix(NAT, 20, 2)],
  rim: [pix(NAT, 18, 1), pix(NAT, 19, 1), pix(NAT, 20, 1)],
};

// Peças "duras" do chão desenhadas por código (16x16 RGBA)
function rgba(draw) { const c = canvas(16, 16, draw); return c.getContext('2d').getImageData(0, 0, 16, 16).data; }
GROUND.plaza = [0, 1].map((v) => rgba((x) => {
  px(x, '#c9c3b6', 0, 0, 16, 16);
  const r = rng(11 + v);
  for (const [X, Y, w, h] of [[0, 0, 8, 8], [8, 0, 8, 8], [0, 8, 8, 8], [8, 8, 8, 8]]) {
    const o = (Y / 8 % 2) * 4; px(x, '#ddd8cc', X + 1, Y + 1, w - 2, h - 2); px(x, '#b3ab9c', X, Y + h - 1, w, 1); px(x, '#b3ab9c', X + w - 1, Y, 1, h); px(x, '#efeae0', X + 1, Y + 1, w - 3, 1);
    if (r() > 0.6) px(x, '#cfc8ba', X + 2 + o % 3, Y + 3, 2, 1);
  }
}));
GROUND.stairs = rgba((x) => {
  px(x, '#8c7a66', 0, 0, 16, 16);
  for (let i = 0; i < 4; i++) { px(x, '#d6ccb8', 1, i * 4, 14, 2); px(x, '#b3a690', 1, i * 4 + 2, 14, 1); px(x, '#6b5a48', 1, i * 4 + 3, 14, 1); }
  px(x, '#5a4a3a', 0, 0, 1, 16); px(x, '#5a4a3a', 15, 0, 1, 16);
});
GROUND.bridgeH = rgba((x) => {   // ponte de leste a oeste (tábuas na vertical)
  px(x, '#7a5233', 0, 0, 16, 16);
  for (let i = 0; i < 4; i++) { px(x, '#c08a56', i * 4, 1, 3, 14); px(x, '#d9a46c', i * 4, 1, 1, 14); px(x, '#8f6038', i * 4 + 2, 1, 1, 14); }
});
GROUND.bridgeV = rgba((x) => {   // ponte de norte a sul (tábuas na horizontal)
  px(x, '#7a5233', 0, 0, 16, 16);
  for (let i = 0; i < 4; i++) { px(x, '#c08a56', 1, i * 4, 14, 3); px(x, '#d9a46c', 1, i * 4, 14, 1); px(x, '#8f6038', 1, i * 4 + 2, 14, 1); }
});
GROUND.floor = [0, 1].map((v) => rgba((x) => {
  px(x, '#c7925c', 0, 0, 16, 16);
  for (let i = 0; i < 4; i++) { const o = (i + v) % 2 ? 6 : 0; px(x, '#d9a46c', 0, i * 4, 16, 1); px(x, '#a8744a', 0, i * 4 + 3, 16, 1); px(x, '#a8744a', (o + 9) % 16, i * 4, 1, 3); }
}));
GROUND.tilefloor = rgba((x) => {
  px(x, '#e9eef2', 0, 0, 16, 16); px(x, '#d3dbe2', 8, 0, 8, 8); px(x, '#d3dbe2', 0, 8, 8, 8);
  px(x, '#bcc6cf', 0, 15, 16, 1); px(x, '#bcc6cf', 15, 0, 1, 16);
});
GROUND.wall = rgba((x) => {
  px(x, '#f3e6c4', 0, 0, 16, 16); for (let i = 0; i < 16; i += 4) px(x, '#e6d4a8', i, 0, 2, 11);
  px(x, '#8a5a3a', 0, 11, 16, 5); px(x, '#a8704a', 0, 11, 16, 1); px(x, '#6a4028', 0, 15, 16, 1);
});
GROUND.walltop = rgba((x) => { px(x, '#4a3a4a', 0, 0, 16, 16); px(x, '#5e4c5e', 0, 0, 16, 2); });
GROUND.court = rgba((x) => { px(x, '#d8b48a', 0, 0, 16, 16); const r = rng(3); for (let i = 0; i < 9; i++) px(x, '#cba67a', Math.floor(r() * 16), Math.floor(r() * 16), 2, 1); });
GROUND.void = rgba((x) => px(x, '#121418', 0, 0, 16, 16));
GROUND.cave = [0, 1, 2].map((v) => rgba((x) => { px(x, '#6e5a4e', 0, 0, 16, 16); const r = rng(40 + v); for (let i = 0; i < 7; i++) { const X = Math.floor(r() * 15), Y = Math.floor(r() * 15); px(x, '#806a5c', X, Y, 2, 1); px(x, '#584640', X, Y + 1, 2, 1); } }));
GROUND.rocktop = rgba((x) => { px(x, '#3e3238', 0, 0, 16, 16); const r = rng(9); for (let i = 0; i < 6; i++) px(x, '#4c3e44', Math.floor(r() * 14), Math.floor(r() * 14), 3, 2); });
GROUND.rockface = rgba((x) => {
  px(x, '#8a7262', 0, 0, 16, 16); px(x, '#a48a76', 0, 0, 16, 2);
  for (const [X, Y, w] of [[1, 4, 6], [8, 3, 7], [3, 9, 8], [12, 8, 4], [0, 13, 5], [7, 13, 8]]) { px(x, '#6a5448', X, Y + 2, w, 1); px(x, '#b09682', X, Y, w - 1, 1); }
  px(x, '#4e3c34', 0, 15, 16, 1);
});
GROUND.cavedoor = rgba((x) => { px(x, '#8a7262', 0, 0, 16, 16); px(x, '#1a1214', 2, 3, 12, 13); px(x, '#1a1214', 4, 1, 8, 2); px(x, '#2e2226', 3, 4, 2, 12); });
GROUND.mat = rgba((x) => { px(x, '#c84a3c', 1, 3, 14, 10); px(x, '#e8705c', 2, 4, 12, 1); px(x, '#a43a30', 1, 12, 14, 1); });

// ---------------- água animada ----------------
// Cada quadro é um ladrilho 32x32 montado com os quadros do Tuxemon (linhas 1 e 2, colunas 9 a 14)
export const WATER_FRAMES = [];
for (let k = 0; k < 6; k++) {
  WATER_FRAMES.push(texOf(canvas(32, 32, (x) => {
    const t = (row, i) => x.drawImage(WAT.canvas, (9 + (i % 6)) * 16, row * 16, 16, 16, 0, 0, 16, 16);
    x.save(); t(1, k); x.translate(16, 0); t(1, k + 3); x.translate(-16, 16); t(2, k + 2); x.translate(16, 0); t(2, k + 5); x.restore();
  })));
}

// ---------------- objetos recortados das folhas ----------------
export const SPR = {
  pine: sub(NAT, 704, 0, 32, 48), pine2: sub(NAT, 736, 0, 32, 48), tree: sub(NAT, 768, 0, 32, 48), tree2: sub(NAT, 800, 0, 32, 48),
  autumn: sub(NAT, 768, 64, 32, 48), pineT: sub(NAT, 704, 64, 32, 48),
  rock: sub(NAT, 672, 32, 32, 32), rock2: sub(NAT, 640, 32, 32, 32), pebble: sub(NAT, 656, 0, 16, 16), pebble2: sub(NAT, 688, 0, 16, 16),
  grayrock: sub(NAT, 672, 96, 32, 32),
  log: sub(NAT, 848, 0, 64, 16), stump: sub(NAT, 864, 32, 32, 32),
  palm: sub(OUT, 416, 592, 16, 32), roundbush: sub(OUT, 432, 552, 48, 40), cone: sub(OUT, 384, 560, 32, 32),
  mush: sub(OUT, 448, 464, 16, 16), mush2: sub(OUT, 464, 464, 16, 16),
  center: sub(BLD, 320, 80, 80, 64), mart: sub(BLD, 400, 80, 80, 64), lab: sub(BLD, 0, 0, 112, 80),
  houseA: sub(BLD, 112, 304, 80, 96), houseB: sub(BLD, 192, 304, 80, 96), houseC: sub(BLD, 272, 304, 80, 96),
  hospital: sub(BLD, 0, 416, 112, 128), bluehall: sub(BLD, 160, 80, 80, 64),
  fenceL: sub(OUT, 256, 416, 16, 16), fenceM: sub(OUT, 272, 416, 16, 16), fenceR: sub(OUT, 288, 416, 16, 16), fenceV: sub(OUT, 256, 432, 16, 16),
  wfenceL: sub(OUT, 320, 416, 16, 16), wfenceM: sub(OUT, 336, 416, 16, 16), wfenceR: sub(OUT, 352, 416, 16, 16), wfenceV: sub(OUT, 320, 432, 16, 16),
};
// casa azul do Téo: telhado cinza da casa C repintado de azul
SPR.houseBlue = texOf(canvas(80, 96, (x) => {
  x.drawImage(BLD.canvas, 272, 304, 80, 96, 0, 0, 80, 96);
  const im = x.getImageData(0, 0, 80, 96), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = (i / 4) / 80 | 0, r = d[i], g = d[i + 1], b = d[i + 2];
    if (y > 66 || d[i + 3] < 10) continue;
    if (Math.abs(r - g) < 14 && Math.abs(g - b) < 18 && r > 40 && r < 235) { const l = (r + g + b) / 3 / 255; d[i] = 40 + l * 70; d[i + 1] = 80 + l * 110; d[i + 2] = 150 + l * 105; }
  }
  x.putImageData(im, 0, 0);
}));
export const LILY = [0, 1, 2, 3].map((i) => sub(OUT, 384 + i * 16, 480, 16, 16));
export const LEAVES = [[864, 256], [880, 256], [896, 272], [864, 288], [880, 304], [896, 320]].map(([x, y]) => sub(NAT, x, y, 16, 16));
// flores animadas: cada linha é uma flor, 4 quadros (colunas 60 a 63)
export const FLOWERS = [1, 3, 5, 7, 9, 11, 13, 15].map((row) => [60, 61, 62, 63].map((c) => sub(NAT, c * 16, row * 16, 16, 16)));

// ---------------- peças desenhadas por código ----------------
// mato alto: dois quadros (parado e balançando) — a parte de baixo cobre o pé de quem está dentro
function tallGrass(lean) {
  return canvas(16, 18, (x) => {
    const clump = (cx, by, h, dark) => {
      const k = lean;
      x.fillStyle = dark ? '#2f8a3a' : '#3fa548';
      x.beginPath(); x.moveTo(cx - 4, by); x.lineTo(cx - 3 + k, by - h); x.lineTo(cx - 1, by - 2); x.lineTo(cx + k * 1.4, by - h - 2); x.lineTo(cx + 1, by - 2); x.lineTo(cx + 3 + k, by - h); x.lineTo(cx + 4, by); x.fill();
      px(x, '#7fd65e', cx - 3 + Math.round(k), by - h + 1, 1, 2); px(x, '#9be86e', cx + Math.round(k * 1.4), by - h - 1, 1, 3); px(x, '#7fd65e', cx + 3 + Math.round(k), by - h + 1, 1, 2);
    };
    clump(4, 11, 7, true); clump(12, 11, 7, true); clump(8, 15, 8, false); clump(1, 17, 6, false); clump(15, 17, 6, false);
  });
}
const TALL0 = outline(tallGrass(0), [22, 64, 34]), TALL1 = outline(tallGrass(1.5), [22, 64, 34]), TALL2 = outline(tallGrass(-1.5), [22, 64, 34]);
export const TALL = [texOf(TALL0), texOf(TALL1), texOf(TALL2)];

// árvore grande (48x64) e árvore frutífera — em proporção com Pokémon de até 48 px
function bigTree(fruit, autumn) {
  const c = canvas(48, 66, (x) => {
    ell(x, 24, 61, 17, 4, 'rgba(0,0,0,0.22)');
    px(x, '#6b4428', 20, 40, 9, 22); px(x, '#8a5a34', 21, 40, 3, 22); px(x, '#4e301c', 27, 42, 2, 20);
    px(x, '#6b4428', 16, 58, 4, 3); px(x, '#6b4428', 29, 58, 4, 3);
    const g = autumn ? ['#a8541c', '#d8802a', '#f2b048', '#ffd77a'] : ['#1f6e34', '#2f9a45', '#4cc25a', '#8be37a'];
    [[24, 24, 19], [11, 32, 11], [37, 32, 11], [16, 15, 11], [32, 15, 11], [24, 9, 10]].forEach(([a, b, r]) => blob(x, a, b, r, g[0]));
    [[24, 22, 16], [13, 29, 8], [35, 29, 8], [17, 14, 9], [31, 14, 9], [24, 9, 8]].forEach(([a, b, r]) => blob(x, a, b, r, g[1]));
    [[20, 16, 8], [30, 12, 6], [14, 24, 5], [25, 8, 5]].forEach(([a, b, r]) => blob(x, a, b, r, g[2]));
    [[18, 12, 3], [28, 8, 2], [12, 21, 2]].forEach(([a, b, r]) => blob(x, a, b, r, g[3]));
    px(x, g[0], 9, 36, 3, 2); px(x, g[0], 34, 37, 4, 2);
    if (fruit) for (const [a, b] of [[14, 30], [24, 33], [34, 28], [19, 21], [30, 19], [24, 13], [12, 22], [36, 22]]) { blob(x, a, b, 2.2, fruit[0]); px(x, fruit[1], a - 1, b - 1, 1, 1); }
  });
  return outline(c);
}
SPR.bigtree = texOf(bigTree(null));
SPR.bigautumn = texOf(bigTree(null, true));
SPR.oran = texOf(bigTree(['#3a6ee8', '#bcd4ff']));
SPR.pecha = texOf(bigTree(['#ff7aa8', '#ffe0ec']));
SPR.berryless = SPR.bigtree;
SPR.berry = { oran: texOf(outline(canvas(8, 8, (x) => { blob(x, 4, 4.5, 3, '#3a6ee8'); px(x, '#bcd4ff', 3, 3); px(x, '#2f8a3a', 4, 0, 1, 2); }))),
  pecha: texOf(outline(canvas(8, 8, (x) => { blob(x, 4, 4.5, 3, '#ff7aa8'); px(x, '#ffe0ec', 3, 3); px(x, '#2f8a3a', 4, 0, 1, 2); }))) };

// arbusto quebrável e pedra quebrável (substituem os provisórios)
SPR.bush = texOf(outline(canvas(18, 17, (x) => {
  ell(x, 9, 14, 8, 2.5, 'rgba(0,0,0,.2)');
  blob(x, 9, 9, 7, '#2f8a3a'); blob(x, 5, 10, 4.5, '#2f8a3a'); blob(x, 13, 10, 4.5, '#2f8a3a');
  blob(x, 8, 7, 4.5, '#47b04e'); blob(x, 12, 8, 3, '#47b04e'); px(x, '#8be37a', 6, 5, 2, 1); px(x, '#8be37a', 11, 6, 2, 1);
}))) ;
SPR.smallrock = texOf(outline(canvas(18, 15, (x) => {
  ell(x, 9, 12, 8, 2.5, 'rgba(0,0,0,.2)');
  ell(x, 9, 8, 7.5, 5.5, '#8e8e9c'); ell(x, 8, 6.5, 5.5, 3.5, '#b0b0bf'); px(x, '#d4d4e0', 5, 4, 3, 1); px(x, '#6c6c7a', 9, 11, 6, 1);
})));

// placa de madeira
SPR.sign = texOf(outline(canvas(16, 18, (x) => {
  ell(x, 8, 16, 5, 1.5, 'rgba(0,0,0,.2)');
  px(x, '#6b4428', 7, 9, 2, 8);
  px(x, '#b07a46', 1, 2, 14, 9); px(x, '#d29a5e', 2, 3, 12, 2); px(x, '#8a5a34', 1, 10, 14, 1);
  px(x, '#5a3a22', 4, 6, 8, 1); px(x, '#5a3a22', 4, 8, 6, 1);
})));
SPR.mailbox = texOf(outline(canvas(12, 18, (x) => {
  px(x, '#6b4428', 5, 8, 2, 9); px(x, '#e8584a', 1, 2, 10, 7); px(x, '#ff8a6a', 2, 3, 8, 1); px(x, '#b03a30', 1, 8, 10, 1); px(x, '#f2c94c', 9, 0, 1, 4);
})));
SPR.lamp = texOf(outline(canvas(10, 30, (x) => {
  ell(x, 5, 28, 4, 1.5, 'rgba(0,0,0,.2)');
  px(x, '#3a4048', 4, 6, 2, 22); px(x, '#5a626c', 4, 6, 1, 22); px(x, '#3a4048', 2, 26, 6, 2);
  px(x, '#3a4048', 1, 3, 8, 4); px(x, '#ffe9a8', 2, 4, 6, 2); px(x, '#3a4048', 3, 1, 4, 2);
})));
SPR.flowerpot = texOf(outline(canvas(14, 14, (x) => {
  px(x, '#b8643a', 2, 7, 10, 6); px(x, '#d8844a', 2, 7, 10, 1);
  blob(x, 4, 5, 2.5, '#ff6a8a'); blob(x, 10, 5, 2.5, '#ffd84a'); blob(x, 7, 3, 2.5, '#ff9ad0'); px(x, '#fff', 7, 3);
})));
SPR.crate = texOf(outline(canvas(16, 16, (x) => { px(x, '#b07a46', 1, 2, 14, 13); px(x, '#d29a5e', 1, 2, 14, 2); px(x, '#8a5a34', 1, 8, 14, 1); px(x, '#8a5a34', 7, 2, 1, 13); })));
SPR.pier = texOf(canvas(16, 16, (x) => { px(x, '#7a5233', 0, 0, 16, 16); for (let i = 0; i < 4; i++) { px(x, '#c08a56', 1, i * 4, 14, 3); px(x, '#d9a46c', 1, i * 4, 14, 1); } }));
SPR.railH = texOf(outline(canvas(16, 8, (x) => { px(x, '#8a5a34', 0, 1, 16, 2); px(x, '#c08a56', 0, 1, 16, 1); px(x, '#6b4428', 1, 1, 2, 6); px(x, '#6b4428', 9, 1, 2, 6); })));

// relógio de sol da praça da Vila Alvorada (o "primeiro alvorecer")
SPR.sundial = texOf(outline(canvas(32, 34, (x) => {
  ell(x, 16, 31, 14, 3, 'rgba(0,0,0,.22)');
  px(x, '#9a9488', 4, 24, 24, 7); px(x, '#c8c2b4', 4, 24, 24, 2); px(x, '#7a746a', 4, 30, 24, 1);
  px(x, '#b4aea0', 8, 14, 16, 10); px(x, '#dcd6c8', 8, 14, 16, 2); px(x, '#8a8478', 8, 23, 16, 1);
  ell(x, 16, 12, 11, 5, '#e8e2d4'); ell(x, 16, 12, 9, 3.6, '#f4efe4');
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; px(x, '#8a8478', Math.round(16 + Math.cos(a) * 8), Math.round(12 + Math.sin(a) * 3.2), 1, 1); }
  x.fillStyle = '#f2b23a'; x.beginPath(); x.moveTo(16, 12); x.lineTo(16, 2); x.lineTo(22, 12); x.fill(); px(x, '#ffd86a', 16, 4, 1, 7);
  blob(x, 16, 2, 2.5, '#ffcf4a'); px(x, '#fff3b0', 15, 1, 1, 1);
})));

// fazenda de Campina: fardo de feno, moinho, trigo; banco e poço da praça; coqueiro grande da costa
SPR.haybale = texOf(outline(canvas(16, 16, (x) => {
  ell(x, 8, 14, 7, 2, 'rgba(0,0,0,.2)');
  px(x, '#d8a838', 1, 3, 14, 11); px(x, '#f2cc5a', 1, 3, 14, 3); px(x, '#b88a28', 1, 12, 14, 2);
  for (let i = 0; i < 5; i++) px(x, '#c0922e', 2 + i * 3, 6, 1, 6); px(x, '#8a5a34', 1, 8, 14, 1);
})));
SPR.wheat = texOf(canvas(16, 16, (x) => {
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    const X = i * 4 + 1 + r * 2, Y = r * 8 + 1;
    px(x, '#9a7a2a', X + 1, Y + 3, 1, 5); px(x, '#e8c04a', X, Y, 3, 4); px(x, '#fff0a0', X + 1, Y, 1, 2); px(x, '#b8902a', X, Y + 3, 3, 1);
  }
}));
SPR.windmill = texOf(outline(canvas(56, 80, (x) => {
  ell(x, 28, 76, 20, 4, 'rgba(0,0,0,.22)');
  x.fillStyle = '#e8dcc4'; x.beginPath(); x.moveTo(14, 76); x.lineTo(20, 30); x.lineTo(36, 30); x.lineTo(42, 76); x.fill();
  px(x, '#cfc2a8', 34, 32, 4, 44); px(x, '#f6eedc', 20, 32, 3, 44);
  x.fillStyle = '#c84a3c'; x.beginPath(); x.moveTo(16, 32); x.lineTo(28, 18); x.lineTo(40, 32); x.fill(); px(x, '#8a2a24', 16, 31, 24, 2);
  px(x, '#7a5236', 24, 62, 8, 14); px(x, '#9ad4ff', 25, 42, 6, 6); px(x, '#8a5a34', 27, 42, 2, 6);
  x.save(); x.translate(28, 26);
  for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); px(x, '#6b4428', -1, 0, 3, 24); px(x, '#f4f0e6', 2, 4, 6, 18); px(x, '#c8c0b0', 2, 4, 1, 18); }
  x.restore(); blob(x, 28, 26, 3, '#5a3a22');
})));
SPR.bench = texOf(outline(canvas(32, 16, (x) => {
  px(x, '#8a5a34', 2, 4, 28, 3); px(x, '#c08a56', 2, 4, 28, 1); px(x, '#a8744a', 2, 9, 28, 3); px(x, '#c7925c', 2, 9, 28, 1);
  px(x, '#5a4030', 4, 12, 2, 4); px(x, '#5a4030', 26, 12, 2, 4);
})));
SPR.well = texOf(outline(canvas(24, 30, (x) => {
  ell(x, 12, 27, 10, 2.5, 'rgba(0,0,0,.2)');
  px(x, '#9a9488', 3, 16, 18, 10); px(x, '#c8c2b4', 3, 16, 18, 2); px(x, '#7a746a', 3, 25, 18, 1); px(x, '#3a6ab0', 5, 17, 14, 2);
  px(x, '#6b4428', 4, 4, 2, 13); px(x, '#6b4428', 18, 4, 2, 13);
  x.fillStyle = '#c84a3c'; x.beginPath(); x.moveTo(1, 6); x.lineTo(12, 0); x.lineTo(23, 6); x.fill(); px(x, '#8a2a24', 1, 6, 22, 1);
  px(x, '#5a3a22', 6, 8, 12, 1); px(x, '#8a8a92', 11, 9, 2, 4);
})));
SPR.palmBig = texOf(outline(canvas(44, 60, (x) => {
  ell(x, 22, 57, 12, 3, 'rgba(0,0,0,.22)');
  for (let i = 0; i < 9; i++) { const k = i / 9; px(x, i % 2 ? '#a8784a' : '#8a5a34', Math.round(20 + Math.sin(k * 2.2) * 4), 22 + i * 4, 6, 4); px(x, '#c89a62', Math.round(21 + Math.sin(k * 2.2) * 4), 22 + i * 4, 1, 3); }
  const leaf = (ang, len, c) => { x.save(); x.translate(23, 18); x.rotate(ang); x.fillStyle = c; x.beginPath(); x.moveTo(0, -2); x.quadraticCurveTo(len * 0.5, -7, len, 2); x.quadraticCurveTo(len * 0.5, 1, 0, 3); x.fill(); x.restore(); };
  [[-2.6, 20], [-0.5, 20], [2.4, 16], [0.7, 16], [-1.6, 15], [3.4, 14]].forEach(([a, l]) => leaf(a, l, '#2f8a3a'));
  [[-2.4, 16], [-0.7, 16], [-1.5, 12], [2.6, 12]].forEach(([a, l]) => leaf(a, l, '#4cc25a'));
  blob(x, 21, 21, 2.5, '#7a5236'); blob(x, 25, 21, 2.5, '#7a5236');
})));
SPR.boulder = sub(NAT, 672, 32, 32, 32);

// item no chão: Poké Bola pequena
SPR.itemball = texOf(outline(canvas(10, 10, (x) => {
  blob(x, 5, 5, 4, '#f4f4f4'); x.fillStyle = '#e5383b'; x.beginPath(); x.arc(5, 5, 4, Math.PI, 0); x.fill();
  px(x, '#2a2a2a', 1, 5, 8, 1); blob(x, 5, 5.5, 1.4, '#2a2a2a'); px(x, '#fff', 5, 5); px(x, '#ff9a9a', 3, 2);
})));

// ginásio a céu aberto: quadra pintada, arquibancada e pórtico
SPR.courtlines = texOf(canvas(160, 112, (x) => {
  x.strokeStyle = '#fff8ec'; x.lineWidth = 2; x.strokeRect(5, 5, 150, 102);
  px(x, '#fff8ec', 79, 5, 2, 102);
  x.beginPath(); x.arc(80, 56, 16, 0, 7); x.stroke();
  x.fillStyle = 'rgba(232,88,74,0.55)'; x.beginPath(); x.arc(80, 56, 7, 0, 7); x.fill();
  x.strokeRect(5, 36, 18, 40); x.strokeRect(137, 36, 18, 40);
}));
SPR.stands = texOf(outline(canvas(96, 30, (x) => {
  for (let r = 0; r < 3; r++) { const y = r * 9; px(x, '#5a6a8a', 0, y + 4, 96, 6); px(x, '#7d8fb4', 0, y + 4, 96, 2); px(x, '#3a4660', 0, y + 9, 96, 1); }
  for (let i = 0; i < 12; i++) px(x, ['#e8584a', '#f2c94c', '#4c9ae8'][i % 3], 4 + i * 8, 2, 4, 2);
})));
SPR.portico = texOf(outline(canvas(64, 52, (x) => {
  px(x, '#d8cfc0', 4, 14, 8, 38); px(x, '#d8cfc0', 52, 14, 8, 38); px(x, '#f2ece2', 5, 14, 2, 38); px(x, '#f2ece2', 53, 14, 2, 38);
  px(x, '#a8a090', 4, 48, 8, 4); px(x, '#a8a090', 52, 48, 8, 4);
  px(x, '#c84a3c', 0, 4, 64, 12); px(x, '#e8705c', 0, 4, 64, 2); px(x, '#8a2a24', 0, 15, 64, 1);
  px(x, '#f2c94c', 26, 6, 12, 8); px(x, '#c89a2a', 31, 7, 2, 6); px(x, '#c89a2a', 28, 8, 8, 1); px(x, '#c89a2a', 29, 10, 6, 1);
  px(x, '#5a3a22', 0, 0, 64, 4);
})));

// interior: móveis
const furn = (w, h, f) => texOf(outline(canvas(w, h, f)));
SPR.bed = furn(16, 30, (x) => { px(x, '#8a5a34', 0, 0, 16, 30); px(x, '#f4f4f4', 1, 2, 14, 7); px(x, '#4c7ae8', 1, 10, 14, 18); px(x, '#6e9af2', 1, 10, 14, 3); });
SPR.table = furn(32, 22, (x) => { px(x, '#a8744a', 0, 0, 32, 14); px(x, '#c7925c', 1, 1, 30, 3); px(x, '#6b4428', 2, 14, 3, 8); px(x, '#6b4428', 27, 14, 3, 8); });
SPR.tv = furn(18, 24, (x) => { px(x, '#3a3a44', 0, 0, 18, 14); px(x, '#7ac0e8', 2, 2, 14, 9); px(x, '#b8e2ff', 3, 3, 5, 2); px(x, '#6b4428', 0, 14, 18, 10); px(x, '#8a5a34', 1, 15, 16, 2); });
SPR.shelf = furn(16, 30, (x) => { px(x, '#6b4428', 0, 0, 16, 30); for (let i = 0; i < 3; i++) { px(x, '#4e301c', 1, 2 + i * 9, 14, 7); for (let j = 0; j < 6; j++) px(x, ['#e8584a', '#4c9ae8', '#f2c94c', '#5ab45a'][(i + j) % 4], 2 + j * 2, 3 + i * 9, 2, 6); } });
SPR.plant = furn(14, 22, (x) => { px(x, '#b8643a', 3, 14, 8, 7); blob(x, 7, 9, 5, '#2f9a45'); blob(x, 4, 7, 3, '#4cc25a'); blob(x, 10, 6, 3, '#4cc25a'); });
SPR.pc = furn(16, 26, (x) => { px(x, '#9aa4b0', 0, 4, 16, 22); px(x, '#3a4a5a', 2, 6, 12, 8); px(x, '#7ae8b0', 3, 7, 5, 2); px(x, '#c4ccd6', 1, 16, 14, 2); });
SPR.machine = furn(32, 30, (x) => { px(x, '#c4ccd6', 0, 4, 32, 26); px(x, '#e2e8ee', 1, 5, 30, 3); px(x, '#3a4a5a', 3, 10, 12, 8); px(x, '#7ae8b0', 4, 11, 4, 2); for (let i = 0; i < 4; i++) blob(x, 20 + (i % 2) * 6, 12 + Math.floor(i / 2) * 6, 2, ['#e8584a', '#f2c94c', '#4c9ae8', '#5ab45a'][i]); });
SPR.counter = furn(64, 22, (x) => { px(x, '#e8eef2', 0, 0, 64, 22); px(x, '#ffffff', 0, 0, 64, 4); px(x, '#e8584a', 0, 8, 64, 3); px(x, '#b8c2cc', 0, 20, 64, 2); });
SPR.balltable = furn(40, 22, (x) => { px(x, '#a8744a', 0, 6, 40, 10); px(x, '#c7925c', 1, 7, 38, 2); px(x, '#6b4428', 2, 16, 3, 6); px(x, '#6b4428', 35, 16, 3, 6); for (let i = 0; i < 3; i++) { blob(x, 8 + i * 12, 5, 4, '#f4f4f4'); x.fillStyle = '#e5383b'; x.beginPath(); x.arc(8 + i * 12, 5, 4, Math.PI, 0); x.fill(); px(x, '#2a2a2a', 4 + i * 12, 5, 8, 1); } });
SPR.rug = texOf(canvas(32, 16, (x) => { px(x, '#c84a3c', 0, 0, 32, 16); px(x, '#e8a03a', 2, 2, 28, 12); px(x, '#c84a3c', 4, 4, 24, 8); }));
SPR.window = texOf(canvas(16, 10, (x) => { px(x, '#8a5a34', 0, 0, 16, 10); px(x, '#9ad4ff', 1, 1, 14, 8); px(x, '#d8f0ff', 2, 2, 5, 3); px(x, '#8a5a34', 7, 1, 2, 8); }));

// luz de janela/poste à noite (aditiva)
SPR.glow = texOf(canvas(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(0.4, 'rgba(255,200,110,0.45)'); g.addColorStop(1, 'rgba(255,180,90,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }));
SPR.glow.source.scaleMode = 'linear';
SPR.winlight = texOf(canvas(12, 10, (x) => { px(x, 'rgba(255,214,120,0.95)', 1, 1, 10, 8); px(x, 'rgba(255,240,190,1)', 2, 2, 4, 3); }));

// bichinhos
SPR.butterfly = ['#fff27a', '#ff9ad0', '#9ad4ff', '#ffffff'].map((c) => [0, 1].map((f) => texOf(canvas(8, 6, (x) => {
  if (f === 0) { px(x, c, 0, 0, 3, 3); px(x, c, 5, 0, 3, 3); px(x, c, 1, 3, 2, 2); px(x, c, 5, 3, 2, 2); } else { px(x, c, 2, 0, 1, 4); px(x, c, 5, 0, 1, 4); }
  px(x, '#3a3030', 3, 1, 2, 4);
}))));
SPR.bird = [0, 1, 2].map((f) => texOf(outline(canvas(12, 9, (x) => {
  if (f === 2) { ell(x, 6, 6, 4, 2.5, '#8a6a4a'); blob(x, 9, 4, 2, '#8a6a4a'); px(x, '#f2a03a', 11, 4); px(x, '#1a1a1a', 9, 3); return; }
  ell(x, 6, 5, 3.5, 2, '#5a4a3a'); const wy = f ? 1 : 6; x.fillStyle = '#7a6a5a'; x.beginPath(); x.moveTo(3, 5); x.lineTo(0, wy); x.lineTo(6, 5); x.lineTo(12, wy); x.lineTo(9, 5); x.fill();
}))));
SPR.fish = texOf(outline(canvas(10, 6, (x) => { ell(x, 4, 3, 4, 2, '#9ab4d0'); px(x, '#dce8f4', 2, 2, 3, 1); x.fillStyle = '#9ab4d0'; x.beginPath(); x.moveTo(7, 3); x.lineTo(10, 0); x.lineTo(10, 6); x.fill(); })));
SPR.sparkle = texOf(canvas(7, 7, (x) => { px(x, '#fff', 3, 0, 1, 7); px(x, '#fff', 0, 3, 7, 1); px(x, '#fff8c0', 2, 2, 3, 3); }));
SPR.firefly = texOf(canvas(6, 6, (x) => { const g = x.createRadialGradient(3, 3, 0, 3, 3, 3); g.addColorStop(0, 'rgba(230,255,140,1)'); g.addColorStop(1, 'rgba(230,255,140,0)'); x.fillStyle = g; x.fillRect(0, 0, 6, 6); }));
SPR.foam = texOf(canvas(16, 6, (x) => { for (let i = 0; i < 16; i++) { const y = Math.round(2 + Math.sin(i / 16 * Math.PI * 2) * 1.2); px(x, 'rgba(255,255,255,0.95)', i, y, 1, 2); if (i % 4 === 1) px(x, 'rgba(220,240,255,0.8)', i, y + 2, 1, 1); } }));
SPR.ripple = texOf(canvas(16, 8, (x) => { x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1; x.beginPath(); x.ellipse(8, 4, 7, 3, 0, 0, 7); x.stroke(); }));
