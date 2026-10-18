import { TILE, WALLS } from './tiles.js';
import { canvas, texOf, outline, SPR, TALL } from './art.js';

// Arte dos biomas novos (gelo, vulcão, deserto e sertão, praia tropical e mangue, templos e cavernas), toda
// desenhada por código no estilo do resto (cores vivas, contorno escuro suave, blocos de 16 px).
// - FAMILIAS: terrenos "macios" do compositor do chão (ground.js): cada família tem uma camada (rank) e uma
//   função de cor em coordenadas globais de pixel, então o desenho não repete a cada bloco e as bordas
//   entre terrenos saem orgânicas, como as da grama e da areia.
// - DURO: blocos desenhados um a um (paredes com face e topo, pisos de templo e caverna, buraco, trilho...).
// - ANIM: quadros animados por cima de certos blocos (lava, areia movediça, correnteza, fonte termal, maré).
// - objetos do cenário: SPR.* (catálogo em objects.js).

// ---------------------------------------------------------------- ruído
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vn(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, s) => vn(x, y, s) * 0.62 + vn(x * 2.1, y * 2.1, s + 7) * 0.38;
// células de Voronoi (rachaduras, placas, pedras): devolve distância ao centro, distância à borda e id da célula
function vor(x, y, cell, s = 0) {
  const X = x / cell, Y = y / cell, xi = Math.floor(X), yi = Math.floor(Y);
  let d1 = 9, d2 = 9, id = 0, cx = 0, cy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = xi + i, gy = yi + j, px = gx + 0.15 + hash(gx, gy, s) * 0.7, py = gy + 0.15 + hash(gx, gy, s + 3) * 0.7;
    const d = Math.hypot(px - X, py - Y);
    if (d < d1) { d2 = d1; d1 = d; id = hash(gx, gy, s + 5); cx = px - X; cy = py - Y; } else if (d < d2) d2 = d;
  }
  return { d: d1 * cell, edge: (d2 - d1) * cell, id, cx, cy };
}
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const clamp01 = (k) => (k < 0 ? 0 : k > 1 ? 1 : k);

// ---------------------------------------------------------------- famílias do compositor
// rank: 0 = líquido (água, lava), 1 = areia, 2 = terra/trilha, 3 = grama, 4 = acima da grama (neve funda).
// rim = cor do contorno de fora; shore = faixas da beira (só líquidos: [limiar de f1, cor]); foam = espuma na beira d'água.
export const FAM = {};
let famN = 10;
function fam(name, rank, o) { const id = famN++; FAM[name] = { id, rank, ...o }; return id; }
const F = {};
F.snow = fam('snow', 3, {
  rim: [148, 168, 198], hi: [255, 255, 255],
  px(x, y) {
    const n = fbm(x / 7, y / 7, 1), c = mix([212, 224, 240], [246, 250, 255], clamp01(n * 1.5 - 0.2));
    const h = hash(x, y, 4); if (h > 0.992) return [255, 255, 255]; if (h > 0.975) return mul(c, 0.9);
    return c;
  },
});
F.deepsnow = fam('deepsnow', 4, {
  rim: [132, 152, 188], hi: [255, 255, 255],
  px(x, y) {
    const w = Math.sin(x * 0.22 + fbm(x / 9, y / 9, 2) * 5 + y * 0.05) * 0.5 + 0.5;
    let c = mix([226, 236, 250], [252, 254, 255], clamp01(fbm(x / 6, y / 6, 3) * 1.3));
    if (w > 0.82) c = mix(c, [196, 212, 236], (w - 0.82) * 3.5);
    if (hash(x, y, 9) > 0.993) return [255, 255, 255];
    return c;
  },
});
F.ash = fam('ash', 3, {
  rim: [64, 58, 62], hi: [172, 166, 166],
  px(x, y) {
    const c = mix([112, 106, 110], [150, 144, 144], clamp01(fbm(x / 6, y / 6, 11)));
    const h = hash(x, y, 12); if (h > 0.997) return [255, 148, 64]; if (h > 0.94) return mul(c, 0.78); if (h < 0.03) return mul(c, 1.12);
    return c;
  },
});
F.dune = fam('dune', 3, {
  rim: [184, 132, 76], hi: [252, 226, 166],
  px(x, y) {
    const r = Math.sin((y + fbm(x / 14, y / 14, 21) * 9 + x * 0.18) * 0.85);
    let c = mix([228, 186, 116], [244, 208, 142], clamp01(fbm(x / 8, y / 8, 22)));
    if (r > 0.55) c = mix(c, [204, 154, 90], (r - 0.55) * 1.6); else if (r < -0.75) c = mix(c, [252, 226, 170], 0.6);
    if (hash(x, y, 23) > 0.995) return [255, 240, 200];
    return c;
  },
});
F.caatinga = fam('caatinga', 3, {
  rim: [112, 74, 48], hi: [206, 156, 110],
  px(x, y) {
    let c = mix([166, 112, 76], [190, 134, 92], clamp01(fbm(x / 6, y / 6, 31)));
    const v = vor(x, y, 11, 32); if (v.edge < 0.7 && hash(Math.floor(x / 11), Math.floor(y / 11), 33) > 0.5) c = mul(c, 0.78);
    // tufos de capim seco
    const cx = Math.floor(x / 7), cy = Math.floor(y / 7), hs = hash(cx, cy, 34);
    if (hs > 0.72) {
      const lx = x - cx * 7, ly = y - cy * 7;
      if (ly >= 2 && ly <= 5 && (lx === 2 && ly >= 3 || lx === 3 || lx === 4 && ly >= 3 || (lx === 1 || lx === 5) && ly === 5)) return ly < 3 ? [222, 204, 120] : hs > 0.86 ? [168, 150, 70] : [196, 178, 96];
    }
    if (hash(x, y, 35) > 0.993) return [222, 206, 186];
    return c;
  },
});
F.basalt = fam('basalt', 2, {
  rim: [36, 30, 34], hi: [104, 94, 98],
  px(x, y) {
    const v = vor(x, y, 9, 41), base = mix([64, 56, 60], [86, 76, 80], v.id);
    if (v.edge < 0.9) return [40, 34, 38];
    if (v.edge < 1.9 && v.cy > 0) return mul(base, 1.16); // brilho na borda de cima da placa
    return hash(x, y, 42) > 0.97 ? mul(base, 0.85) : base;
  },
});
F.cracked = fam('cracked', 2, {
  rim: [140, 92, 56], hi: [232, 186, 132],
  px(x, y) {
    const v = vor(x + fbm(x / 5, y / 5, 51) * 3, y, 7.5, 52), base = mix([200, 144, 92], [218, 164, 108], v.id * 0.8 + fbm(x / 4, y / 4, 53) * 0.2);
    if (v.edge < 0.75) return [122, 78, 48];
    if (v.edge < 1.5) return mul(base, 1.08);
    return base;
  },
});
F.mangmud = fam('mangmud', 2, {
  rim: [48, 38, 28], hi: [120, 100, 76],
  px(x, y) {
    const n = fbm(x / 13, y / 13, 61);
    if (n > 0.64) { if (n < 0.665) return [64, 52, 38]; return hash(x, y, 62) > 0.96 ? [190, 214, 222] : mix([84, 112, 112], [106, 136, 134], fbm(x / 4, y / 4, 63)); }
    let c = mix([92, 74, 52], [118, 94, 64], clamp01(fbm(x / 5, y / 5, 64)));
    if (n > 0.6) c = mul(c, 0.82);
    if (hash(Math.floor(x / 4), Math.floor(y / 4), 65) > 0.988 && (x & 3) === 1 && (y & 3) === 1) return [40, 30, 22];
    return c;
  },
});
F.obsidian = fam('obsidian', 2, {
  rim: [12, 10, 18], hi: [70, 56, 104],
  px(x, y) {
    const v = vor(x, y, 8, 221), base = mix([26, 22, 36], [42, 34, 60], v.id);
    if (v.edge < 0.8) return [12, 10, 18];
    if (v.cx > 0.05 && v.cy > 0.05 && v.d < 3.2 && v.d > 1.7) return [92, 74, 136];
    if (hash(x, y, 222) > 0.994) return [210, 180, 255];
    return base;
  },
});
// chão de pedra (sem bloco próprio: é o que os pisos de templo emprestam às bordas de lava, água e areia)
F.stone = fam('stone', 2, {
  rim: [96, 88, 76], hi: [196, 188, 170],
  px(x, y) { const v = vor(x, y, 6, 231); return v.edge < 0.8 ? [110, 102, 90] : mix([150, 142, 126], [176, 168, 150], v.id); },
});
F.wetsand = fam('wetsand', 1, {
  rim: [150, 126, 86], foam: true,
  px(x, y) {
    let c = mix([184, 160, 114], [204, 180, 132], clamp01(fbm(x / 6, y / 6, 71)));
    const s = Math.sin(y * 0.9 + fbm(x / 12, y / 12, 72) * 7); if (s > 0.9) c = mix(c, [226, 212, 176], 0.6);
    if (hash(x, y, 73) > 0.996) return [252, 236, 226];
    return c;
  },
});
F.tide = fam('tide', 1, {
  rim: [140, 118, 82], foam: true,
  px(x, y) {
    let c = mix([168, 148, 108], [186, 166, 122], clamp01(fbm(x / 6, y / 6, 81)));
    const s = Math.sin(x * 0.7 + Math.sin(y * 0.4) * 2); if (s > 0.8) c = mul(c, 0.9);
    return c;
  },
});
F.ice = fam('ice', 1, {
  rim: [112, 164, 204], foam: [236, 248, 255],
  px(x, y) {
    let c = mix([160, 214, 238], [196, 234, 250], clamp01(fbm(x / 10, y / 10, 91)));
    const st = ((x + y + Math.floor(fbm(x / 9, y / 9, 92) * 8)) % 19 + 19) % 19; if (st < 1) c = [236, 250, 255]; else if (st < 2) c = mix(c, [236, 250, 255], 0.5);
    const v = vor(x, y, 13, 93); if (v.edge < 0.6 && v.id > 0.55) c = [124, 182, 216];
    return c;
  },
});
F.quicksand = fam('quicksand', 1, {
  rim: [136, 100, 58],
  px(x, y) {
    const v = vor(x, y, 22, 103), d = v.d * (1 + (fbm(x / 6, y / 6, 102) - 0.5) * 0.5);
    let c = mix([176, 136, 84], [196, 156, 98], clamp01(fbm(x / 5, y / 5, 101)));
    if (Math.sin(d * 0.9) > 0.72) c = mul(c, 0.86); else if (Math.sin(d * 0.9) < -0.85) c = mix(c, [214, 180, 122], 0.5);
    if (v.d < 2.2) c = [128, 94, 56];
    return c;
  },
});
F.lava = fam('lava', 0, {
  shore: [[0.42, [40, 22, 22]], [0.36, [96, 28, 18]], [0.31, [170, 48, 20]]],
  px(x, y) {
    const n = fbm(x / 8, y / 8, 111) * 0.7 + vn(x / 3, y / 3, 112) * 0.3;
    if (n < 0.3) return mix([108, 26, 16], [150, 36, 18], n / 0.3);
    if (n > 0.6 && n < 0.66) return [255, 214, 92];
    if (n > 0.66) return [255, 168, 52];
    return mix([214, 70, 22], [244, 112, 32], (n - 0.3) / 0.3);
  },
});
F.frozen = fam('frozen', 0, {
  shore: [[0.42, [228, 244, 252]], [0.35, [170, 212, 238]]],
  px(x, y) {
    let c = mix([92, 146, 204], [128, 182, 228], clamp01(fbm(x / 9, y / 9, 121)));
    const v = vor(x, y, 12, 122); if (v.edge < 0.6) return [214, 236, 250];
    if (v.d < 1.4 && v.id > 0.7) return [196, 226, 246]; // bolhas presas no gelo
    if (((x - y) % 23 + 23) % 23 < 1) c = mix(c, [220, 240, 252], 0.6);
    return c;
  },
});
F.hotspring = fam('hotspring', 0, {
  shore: [[0.42, [226, 214, 186]], [0.36, [196, 182, 148]], [0.32, [150, 206, 200]]],
  px(x, y) {
    const n = fbm(x / 6 + Math.sin(y / 5), y / 6, 131);
    return n > 0.62 ? [176, 236, 230] : mix([96, 196, 200], [132, 218, 216], n);
  },
});
F.reef = fam('reef', 0, {
  shore: [[0.42, [200, 240, 236, 150]]], clear: true,
  px(x, y) {
    const v = vor(x, y, 7, 141), r = 1.4 + v.id * 2.2, cl = fbm(x / 16, y / 16, 144);
    if (v.id > 0.55 && cl > 0.42 && v.d < r) {
      const cs = [[236, 112, 138], [240, 146, 84], [160, 112, 204], [232, 200, 104], [92, 196, 160]][Math.floor(hash(Math.round(v.id * 999), 0, 142) * 5)];
      const lit = v.cy > 0.08 && v.cx > -0.05; // luz de cima à esquerda
      if (v.d > r - 0.9) return [...mul(cs, 0.62), 255];
      return [...(lit ? mix(cs, [255, 255, 255], 0.35) : cs), 255];
    }
    const n = fbm(x / 9, y / 9, 143);
    if (cl > 0.42 && v.id > 0.3 && v.d < 3) return [70, 150, 150, 120]; // sombra do coral
    return n > 0.55 ? [222, 214, 168, 120] : [120, 226, 218, 90];
  },
});

// ---------------------------------------------------------------- blocos "duros"
// cada função de piso devolve a cor do pixel global (gx, gy); as paredes usam face (pixel local) e topo
const FLOOR = {};
FLOOR[TILE.ICEFLOOR] = (x, y) => {
  let c = mix([172, 196, 220], [204, 224, 242], clamp01(fbm(x / 7, y / 7, 201)));
  const v = vor(x, y, 10, 202); if (v.edge < 0.7) c = [148, 174, 204];
  if (hash(x, y, 203) > 0.992) return [255, 255, 255];
  return c;
};
FLOOR[TILE.LAVAFLOOR] = (x, y) => {
  const v = vor(x, y, 10, 211), base = mix([54, 42, 44], [74, 58, 58], v.id * 0.6 + fbm(x / 4, y / 4, 212) * 0.4);
  const hot = v.id > 0.45;
  if (v.edge < 0.8) return hot ? [255, 132, 44] : [34, 26, 28];
  if (v.edge < 1.7) return hot ? [160, 52, 28] : mul(base, 0.8);
  return base;
};
FLOOR[TILE.TEMPLEFLOOR] = (x, y) => {
  const row = Math.floor(y / 8), ox = (row % 2) * 4, lx = ((x + ox) % 8 + 8) % 8, ly = ((y % 8) + 8) % 8, sid = hash(Math.floor((x + ox) / 8), row, 231);
  let c = mix([206, 184, 138], [226, 206, 160], sid);
  if (lx === 7 || ly === 7) return [146, 124, 88];
  if (lx === 0 || ly === 0) c = mix(c, [244, 230, 194], 0.6); else if (lx === 6 || ly === 6) c = mul(c, 0.86);
  if (sid > 0.88 && fbm(x / 3, y / 3, 232) > 0.62) c = mix(c, [120, 150, 84], 0.65); // musgo
  if (sid < 0.08 && Math.abs(lx - ly) < 1) c = mul(c, 0.7);                         // trinca
  return c;
};
const MOS = [[188, 92, 60], [52, 138, 140], [230, 190, 92], [236, 222, 196]];
FLOOR[TILE.MOSAIC] = (x, y) => {
  const lx = ((x % 16) + 16) % 16, ly = ((y % 16) + 16) % 16;
  if (lx % 4 === 3 || ly % 4 === 3) return [96, 74, 62];
  const tx = Math.floor(lx / 4), ty = Math.floor(ly / 4), d = Math.abs(tx - 1.5) + Math.abs(ty - 1.5);
  let c = d < 1.1 ? MOS[0] : d < 2.1 ? MOS[1] : d < 2.9 ? MOS[3] : MOS[2];
  c = mul(c, 0.92 + hash(Math.floor(x / 4), Math.floor(y / 4), 241) * 0.16);
  if (lx % 4 === 0 && ly % 4 === 0) c = mix(c, [255, 255, 255], 0.3);
  return c;
};
FLOOR[TILE.OLDSTONE] = (x, y) => {
  const v = vor(x, y, 5.5, 251), base = mix([136, 134, 120], [170, 166, 148], v.id);
  if (v.edge < 0.8) return fbm(x / 5, y / 5, 252) > 0.55 ? [88, 120, 66] : [84, 80, 72];
  return mul(base, 1.1 - (v.d / 5.5) * 0.35);
};
FLOOR[TILE.DARKCAVE] = (x, y) => {
  const c = mix([46, 40, 46], [60, 52, 58], clamp01(fbm(x / 6, y / 6, 261)));
  const h = hash(Math.floor(x / 2), Math.floor(y / 2), 262); if (h > 0.97) return [78, 70, 76]; if (h < 0.02) return [30, 26, 30];
  return c;
};
FLOOR[TILE.CRYSTALFLOOR] = (x, y) => {
  let c = mix([50, 42, 72], [66, 54, 92], clamp01(fbm(x / 6, y / 6, 271)));
  const cx = Math.floor(x / 8), cy = Math.floor(y / 8), h = hash(cx, cy, 272);
  if (h > 0.7) {
    const lx = x - cx * 8 - 4, ly = y - cy * 8 - 4, d = Math.abs(lx) * 1.6 + Math.abs(ly);
    const col = h > 0.85 ? [120, 244, 236] : [236, 128, 232];
    if (d < 3.2) return lx < 0 && ly < 0 ? mix(col, [255, 255, 255], 0.55) : lx > 0 ? mul(col, 0.7) : col;
    if (d < 4.2) return mul(c, 0.7);
  }
  return c;
};
FLOOR[TILE.RAIL] = (x, y) => FLOOR[TILE.DARKCAVE](x, y);
export const FLOORS = new Set(Object.keys(FLOOR).map(Number).concat([TILE.CRACK, TILE.HOLE, TILE.STAIRUP, TILE.STAIRDOWN]));
// chão das cavernas antigas (k) também conta como piso para a rachadura/buraco herdar o desenho
const CAVE_PX = (x, y) => { const c = mix([102, 84, 72], [120, 100, 86], clamp01(fbm(x / 6, y / 6, 281))); return hash(Math.floor(x / 2), Math.floor(y / 2), 282) > 0.96 ? mul(c, 0.8) : c; };

// paredes: texturas de face (2 variantes 16x16) e cor de topo
function rgba(draw) { const c = canvas(16, 16, draw); return c.getContext('2d').getImageData(0, 0, 16, 16).data; }
const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
const faceFrom = (f) => { const o = new Uint8ClampedArray(1024); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const [r, g, b] = f(x, y); const k = (y * 16 + x) * 4; o[k] = r; o[k + 1] = g; o[k + 2] = b; o[k + 3] = 255; } return o; };
const WALL = {};
WALL[TILE.ICEWALL] = { top: [36, 62, 96], edge: [96, 150, 196], faces: [0, 1].map((v) => faceFrom((x, y) => {
  const bx = Math.floor((x + (Math.floor(y / 6) % 2) * 5 + v * 3) / 8), by = Math.floor(y / 6), lx = (x + (by % 2) * 5 + v * 3) % 8, ly = y % 6, h = hash(bx, by, 300 + v);
  let c = mix([132, 186, 222], [168, 214, 240], h);
  if (ly === 0) c = [214, 240, 252]; else if (ly === 5 || lx === 7) c = [86, 136, 186]; else if (lx + ly < 3) c = mix(c, [236, 248, 255], 0.7);
  if (y >= 14) c = mul(c, 0.7);
  return c;
})) };
WALL[TILE.LAVAWALL] = { top: [30, 22, 24], edge: [84, 70, 72], faces: [0, 1].map((v) => faceFrom((x, y) => {
  const col = Math.floor((x + v * 2) / 4), lx = (x + v * 2) % 4, h = hash(col, v, 310), top = Math.floor(h * 4);
  let c = mix([62, 50, 52], [82, 68, 70], h);
  if (lx === 0) c = mix(c, [110, 96, 98], 0.7); else if (lx === 3) c = [40, 32, 34];
  if (y === top) c = [116, 100, 100];
  if (h > 0.7 && lx === 3 && y > 6) c = [236, 104, 36]; // fresta com brasa
  if (y >= 14) c = mul(c, 0.7);
  return c;
})) };
WALL[TILE.CANYON] = { top: [196, 136, 90], edge: [150, 92, 58], faces: [0, 1].map((v) => faceFrom((x, y) => {
  const band = Math.floor((y + Math.round(Math.sin(x * 0.5 + v) * 0.8)) / 3);
  const C = [[204, 116, 72], [222, 148, 96], [184, 98, 62], [232, 176, 116], [196, 124, 80]];
  let c = C[(((band + v) % C.length) + C.length) % C.length];
  if ((y + Math.round(Math.sin(x * 0.5 + v) * 0.8)) % 3 === 0) c = mix(c, [246, 196, 140], 0.35);
  if (hash(x, y, 320 + v) > 0.93) c = mul(c, 0.82);
  if ((x === 5 + v * 4) && y > 3 && y < 12) c = [140, 78, 48];
  if (y >= 14) c = mul(c, 0.72);
  return c;
})) };
WALL[TILE.TEMPLEWALL] = { top: [60, 50, 46], edge: [150, 126, 96], faces: [0, 1].map((v) => faceFrom((x, y) => {
  // blocos grandes com uma faixa de glifos entalhados no meio
  if (y >= 5 && y <= 9) {
    const g = (x + v * 8) % 8, gy = y - 5;
    if (gy === 0 || gy === 4) return [168, 140, 98];
    const glyph = [[0, 1, 1, 0, 0, 1, 0, 0], [0, 1, 0, 0, 1, 1, 1, 0], [0, 1, 1, 0, 0, 1, 0, 0]][gy - 1];
    return glyph[g] ? [120, 96, 66] : [214, 186, 136];
  }
  const by = y < 5 ? 0 : 1, lx = (x + by * 8 + v * 4) % 16, ly = y < 5 ? y : y - 10;
  let c = mix([200, 172, 124], [218, 192, 142], hash(Math.floor((x + by * 8 + v * 4) / 16), by + v, 330));
  if (lx === 15 || ly === 4 || (by === 1 && ly === 5)) c = [150, 124, 88]; else if (ly === 0) c = mix(c, [240, 222, 182], 0.6);
  if (y >= 14) c = mul(c, 0.72);
  return c;
})) };
WALL[TILE.CRYSTALWALL] = { top: [34, 26, 50], edge: [90, 72, 126], faces: [0, 1].map((v) => faceFrom((x, y) => {
  let c = mix([66, 54, 92], [84, 70, 114], fbm(x / 4 + v * 5, y / 4, 340));
  // cachos de cristal saindo da rocha
  for (const [cx, cy, h, col] of v ? [[4, 9, 7, [120, 244, 236]], [11, 11, 5, [236, 128, 232]]] : [[10, 8, 8, [236, 128, 232]], [3, 12, 4, [120, 244, 236]]]) {
    const dx = x - cx, dy = cy - y;
    if (dy >= 0 && dy < h && Math.abs(dx) <= (h - dy) * 0.4) c = dx < 0 ? mix(col, [255, 255, 255], 0.5) : dx > 0 ? mul(col, 0.7) : col;
  }
  if (y >= 14) c = mul(c, 0.72);
  return c;
})) };

// raízes de mangue (sólido): lama escura com raízes em arco por cima
function rootsPx(x, y) {
  const tx = Math.floor(x / 16), ty = Math.floor(y / 16), lx = x - tx * 16, ly = y - ty * 16;
  let c = fbm(x / 6, y / 6, 352) > 0.5 ? mix([52, 74, 70], [64, 90, 86], fbm(x / 3, y / 3, 351)) : mix([58, 48, 36], [74, 60, 44], fbm(x / 4, y / 4, 351));
  let shade = false;
  for (let k = 0; k < 3; k++) {
    const cx = 3 + hash(tx, ty, 353 + k) * 10, w = 7 + hash(tx, ty, 360 + k) * 7, h = 8 + hash(tx, ty, 370 + k) * 7, base = 15 - (k & 1);
    const u = (lx - cx) / (w / 2); if (Math.abs(u) > 1) continue;
    const yy = base - h * (1 - u * u), d = Math.abs(ly - yy);
    if (d < 1.3) return d < 0.5 && u < 0.3 ? [168, 128, 84] : d < 0.9 ? [126, 90, 58] : [84, 58, 38];
    if (d < 1.8 && ly > yy) shade = true;
  }
  return shade ? mul(c, 0.7) : c;
}
// desenha um bloco duro novo; devolve false se não é dele
export function drawBiomeHard(t, at, tx, ty, put) {
  const gx0 = tx * 16, gy0 = ty * 16;
  const W = WALL[t];
  if (W) {
    const same = (d) => d === t, below = at(0, 1);
    if (!same(below) && below !== TILE.VOID) {
      // face da parede (vista de frente); a de cima é rocha (topo) quando a parede continua para cima
      const f = W.faces[(tx * 7 + ty * 3) & 1];
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const k = (y * 16 + x) * 4; let r = f[k], g = f[k + 1], b = f[k + 2]; if (!same(at(-1, 0)) && x === 0 || !same(at(1, 0)) && x === 15) { r *= 0.72; g *= 0.72; b *= 0.72; } put(x, y, r, g, b); }
    } else {
      // topo: rocha escura com borda clara onde termina
      const N = !same(at(0, -1)) && !WALLS.has(at(0, -1)), Wl = !same(at(-1, 0)), E = !same(at(1, 0));
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let c = mul(W.top, 0.86 + fbm((gx0 + x) / 5, (gy0 + y) / 5, 361) * 0.24 + (hash(gx0 + x >> 1, gy0 + y >> 1, 360) > 0.93 ? 0.12 : 0));
        if ((N && y < 2) || (Wl && x < 2) || (E && x > 13)) c = (N && y === 0) || (Wl && x === 0) || (E && x === 15) ? mul(W.edge, 0.7) : W.edge;
        put(x, y, c[0], c[1], c[2]);
      }
    }
    return true;
  }
  if (t === TILE.ROOTS) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = rootsPx(gx0 + x, gy0 + y); put(x, y, c[0], c[1], c[2]); } return true; }
  // pisos: sombra embaixo de parede (a face fica "em pé" sobre o chão)
  const shade = (y, x) => { let k = 1; if (WALLS.has(at(0, -1))) k *= [0.55, 0.68, 0.8, 0.9][y] ?? 1; if (WALLS.has(at(-1, 0)) && x === 0) k *= 0.82; if (WALLS.has(at(1, 0)) && x === 15) k *= 0.82; return k; };
  // rachadura, buraco e escadas herdam o piso dos vizinhos
  const baseOf = () => { for (const d of [at(0, 1), at(0, -1), at(-1, 0), at(1, 0)]) { if (FLOOR[d] && d !== TILE.RAIL) return FLOOR[d]; if (d === TILE.CAVE) return CAVE_PX; } return FLOOR[TILE.TEMPLEFLOOR]; };
  let fn = FLOOR[t];
  if (fn && t !== TILE.RAIL) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = fn(gx0 + x, gy0 + y), k = shade(y, x); put(x, y, c[0] * k, c[1] * k, c[2] * k); } return true; }
  if (t === TILE.RAIL) {
    const R = (d) => d === TILE.RAIL || d === TILE.CRACK;
    const n = R(at(0, -1)), s = R(at(0, 1)), w = R(at(-1, 0)), e = R(at(1, 0));
    const horiz = (w || e) && !(n || s), vert = !horiz && !((w || e) && (n || s));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let c = FLOOR[TILE.DARKCAVE](gx0 + x, gy0 + y);
      // trilho reto ou curva (quarto de círculo em volta do canto)
      let u, v2;
      if (horiz) { u = y; v2 = x; } else if (vert) { u = x; v2 = y; } else {
        const cx = e ? 16 : 0, cy = s ? 16 : 0, d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        u = d - 0; v2 = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) * 10;
        if (Math.abs(d - 8) < 6.5 && ((Math.floor(v2) % 4) + 4) % 4 < 2 && Math.abs(d - 8) > 0) c = [118, 82, 50];
        if (Math.abs(d - 4.5) < 0.8 || Math.abs(d - 11.5) < 0.8) c = Math.abs(d - 4.5) < 0.35 || Math.abs(d - 11.5) < 0.35 ? [214, 214, 226] : [140, 140, 152];
        put(x, y, c[0], c[1], c[2]); continue;
      }
      if (u >= 2 && u <= 13 && v2 % 4 < 2) c = v2 % 4 === 0 ? [140, 100, 62] : [108, 74, 46];      // dormentes
      if (u === 4 || u === 11) c = [214, 214, 226]; else if (u === 5 || u === 12) c = [120, 120, 134]; // trilhos de aço
      put(x, y, c[0], c[1], c[2]);
    }
    return true;
  }
  fn = baseOf();
  if (t === TILE.CRACK) {
    const s0 = hash(tx, ty, 370);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let c = fn(gx0 + x, gy0 + y);
      // trincas em zigue-zague saindo do centro
      for (let k = 0; k < 3; k++) {
        const a = s0 * 6 + k * 2.1, dx = x - 8, dy = y - 8, along = dx * Math.cos(a) + dy * Math.sin(a), off = -dx * Math.sin(a) + dy * Math.cos(a);
        const wob = Math.sin(along * 1.3 + k) * 1.2;
        if (along > 0 && along < 7 - k) { if (Math.abs(off - wob) < 0.5) c = mul(c, 0.42); else if (Math.abs(off - wob - 1) < 0.5) c = mix(c, [255, 255, 255], 0.25); }
      }
      if (Math.hypot(x - 8, y - 8) < 1.2) c = mul(c, 0.35);
      const k2 = shade(y, x); put(x, y, c[0] * k2, c[1] * k2, c[2] * k2);
    }
    return true;
  }
  if (t === TILE.HOLE) {
    const H = (d) => d === TILE.HOLE, N = !H(at(0, -1)), S = !H(at(0, 1)), Wh = !H(at(-1, 0)), E = !H(at(1, 0));
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let c = [10, 8, 12];
      const e = Math.min(Wh ? x : 99, E ? 15 - x : 99, S ? 15 - y : 99) + (fbm((gx0 + x) / 3, (gy0 + y) / 3, 371) - 0.5) * 2;
      if (e < 1.4) c = fn(gx0 + x, gy0 + y);
      else if (e < 2.2) c = [40, 32, 30];
      if (N) { const wy = y + (fbm((gx0 + x) / 3, gy0 / 3, 372) - 0.5) * 2; if (wy < 1.5) c = fn(gx0 + x, gy0 + y); else if (wy < 8) c = mix([96, 80, 70], [22, 18, 20], (wy - 1.5) / 6.5); }
      put(x, y, c[0], c[1], c[2]);
    }
    return true;
  }
  if (t === TILE.STAIRUP || t === TILE.STAIRDOWN) {
    const up = t === TILE.STAIRUP;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let c;
      if (x < 2 || x > 13) c = x === 0 || x === 15 ? [70, 58, 52] : [124, 108, 92];
      else {
        const step = Math.floor(y / 4), ly = y % 4, k = up ? 1.08 - step * 0.06 : 0.55 + step * 0.12;
        c = ly === 0 ? [228, 214, 186] : ly === 3 ? [110, 92, 76] : [192, 174, 142];
        c = mul(c, up ? 1.16 - step * 0.1 : k);
      }
      put(x, y, c[0], c[1], c[2]);
    }
    return true;
  }
  return false;
}

// "rank" e família que cada bloco duro novo empresta aos vizinhos macios (o compositor mistura as bordas)
export const BLEED = {
  [TILE.ICEWALL]: ['snow', 3], [TILE.ICEFLOOR]: ['snow', 3], [TILE.LAVAWALL]: ['basalt', 2], [TILE.LAVAFLOOR]: ['basalt', 2],
  [TILE.CANYON]: ['dune', 3], [TILE.ROOTS]: ['mangmud', 2], [TILE.CRYSTALWALL]: ['basalt', 2],
  [TILE.CRYSTALFLOOR]: ['basalt', 2], [TILE.DARKCAVE]: ['basalt', 2], [TILE.RAIL]: ['basalt', 2],
  [TILE.TEMPLEFLOOR]: ['stone', 2], [TILE.MOSAIC]: ['stone', 2], [TILE.OLDSTONE]: ['stone', 2], [TILE.TEMPLEWALL]: ['stone', 2],
  [TILE.STAIRUP]: ['stone', 2], [TILE.STAIRDOWN]: ['stone', 2], [TILE.HOLE]: ['stone', 2], [TILE.CRACK]: ['stone', 2],
};
// bloco macio → família
export const SOFT = {
  [TILE.SNOWFIELD]: 'snow', [TILE.TALLSNOW]: 'snow', [TILE.DEEPSNOW]: 'deepsnow', [TILE.ASH]: 'ash', [TILE.DUNE]: 'dune', [TILE.CAATINGA]: 'caatinga', [TILE.TALLDRY]: 'caatinga',
  [TILE.BASALT]: 'basalt', [TILE.CRACKED]: 'cracked', [TILE.MANGMUD]: 'mangmud', [TILE.WETSAND]: 'wetsand', [TILE.TIDE]: 'tide', [TILE.ICE]: 'ice', [TILE.QUICKSAND]: 'quicksand',
  [TILE.OBSIDIAN]: 'obsidian', [TILE.LAVA]: 'lava', [TILE.FROZEN]: 'frozen', [TILE.HOTSPRING]: 'hotspring', [TILE.REEF]: 'reef',
};

// ---------------------------------------------------------------- quadros animados por cima dos blocos
const frames = (n, w, h, f) => Array.from({ length: n }, (_, i) => texOf(canvas(w, h, (x) => f(x, i))));
const radial = (x, cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
// lava: manchas claras que andam devagar (soma de luz), só nos blocos do meio da poça
const LAVA_F = frames(8, 16, 16, (x, i) => {
  for (let k = 0; k < 3; k++) { const a = (i / 8 + k / 3) * Math.PI * 2; radial(x, 8 + Math.cos(a) * 5, 8 + Math.sin(a * 2) * 4, 4.5 - k, '255,214,110', 0.55); }
  if (i === 3 || i === 4) { px(x, 'rgba(255,240,180,0.9)', 5, 6, 2, 2); px(x, 'rgba(255,220,140,0.6)', 4, 5, 4, 1); }
});
// areia movediça: anéis entrando para o meio
const SINK_F = frames(8, 16, 16, (x, i) => {
  x.strokeStyle = 'rgba(96,64,32,0.42)'; x.lineWidth = 1;
  for (let k = 0; k < 2; k++) { const r = 7.5 - ((i / 8 + k / 2) % 1) * 6.5; x.beginPath(); x.ellipse(8, 8, r, r * 0.8, 0, 0, 7); x.stroke(); }
  px(x, 'rgba(60,40,20,0.5)', 7, 7, 2, 2);
});
// correnteza: riscos de espuma correndo na direção da água (desenhados para leste e girados)
function curFrames(rot) {
  return frames(8, 16, 16, (x, i) => {
    x.translate(8, 8); x.rotate(rot); x.translate(-8, -8);
    for (const [y, l, o] of [[3, 5, 0], [8, 4, 6], [12, 6, 11]]) { const X = (i * 2 + o) % 16; px(x, 'rgba(255,255,255,0.75)', X, y, l, 1); px(x, 'rgba(255,255,255,0.35)', X - 2, y, 2, 1); if (X + l > 16) px(x, 'rgba(255,255,255,0.75)', 0, y, X + l - 16, 1); }
  });
}
const CUR_F = { [TILE.CUR_E]: curFrames(0), [TILE.CUR_S]: curFrames(Math.PI / 2), [TILE.CUR_W]: curFrames(Math.PI), [TILE.CUR_N]: curFrames(-Math.PI / 2) };
// fonte termal: bolhas subindo
const BUBBLE_F = frames(8, 16, 16, (x, i) => {
  for (const [bx, ph] of [[4, 0], [11, 0.45], [8, 0.75]]) { const k = (i / 8 + ph) % 1, y = 13 - k * 10, a = (1 - k) * 0.8; x.strokeStyle = `rgba(240,255,252,${a})`; x.beginPath(); x.arc(bx, y, 1 + k * 1.2, 0, 7); x.stroke(); }
});
// maré: lâmina d'água rasa (a transparência segue o relógio, ver masmorra.js)
const TIDE_F = frames(4, 16, 16, (x, i) => {
  px(x, 'rgba(70,160,214,0.62)', 0, 0, 16, 16);
  for (const [y, o] of [[3, 0], [9, 7], [14, 3]]) { const X = (i * 4 + o) % 16; px(x, 'rgba(220,244,255,0.75)', X, y, 5, 1); if (X + 5 > 16) px(x, 'rgba(220,244,255,0.75)', 0, y, X + 5 - 16, 1); }
});
// tipo de bloco → { frames, blend, alpha, fps, interior (só se os 4 vizinhos forem do mesmo tipo) }
export const ANIM = {
  [TILE.LAVA]: { frames: LAVA_F, blend: 'add', alpha: 0.9, fps: 5, interior: true },
  [TILE.QUICKSAND]: { frames: SINK_F, alpha: 1, fps: 6, chance: 0.35 },
  [TILE.HOTSPRING]: { frames: BUBBLE_F, alpha: 0.9, fps: 6, chance: 0.45 },
  [TILE.TIDE]: { frames: TIDE_F, alpha: 1, fps: 3, tide: true },
  ...Object.fromEntries(Object.entries(CUR_F).map(([k, f]) => [k, { frames: f, alpha: 0.85, fps: 10 }])),
};

// ---------------------------------------------------------------- objetos
const blob = (x, cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
const ell = (x, cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
const poly = (x, c, pts) => { x.fillStyle = c; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
const art = (w, h, f, col) => texOf(outline(canvas(w, h, f), col));
const shadow = (x, cx, cy, rx, ry = 2.5) => ell(x, cx, cy, rx, ry, 'rgba(0,0,0,.22)');

// pinheiro nevado
SPR.snowPine = art(32, 50, (x) => {
  shadow(x, 16, 47, 12, 3);
  px(x, '#5a3a22', 14, 38, 4, 10); px(x, '#7a5236', 14, 38, 1, 10);
  for (const [y, w] of [[36, 14], [28, 12], [20, 10], [12, 7]]) {
    poly(x, '#1f5a3a', [[16 - w, y + 3], [16, y - 10], [16 + w, y + 3]]);
    poly(x, '#2f7a48', [[16 - w + 3, y + 1], [16, y - 9], [16 + 2, y + 1]]);
    // neve nos galhos
    poly(x, '#f4f8ff', [[16 - w + 1, y + 2], [16 - w + 5, y - 1], [16, y - 9], [16 + w - 5, y - 1], [16 + w - 1, y + 2], [16 + w - 4, y], [16, y - 5], [16 - w + 4, y]]);
    px(x, '#cfdcf0', 16 + 2, y - 2, w - 4, 1);
  }
  blob(x, 16, 2.5, 2, '#ffffff');
}, [24, 40, 52]);
SPR.snowPineBig = art(40, 64, (x) => {
  shadow(x, 20, 61, 15, 3.5);
  px(x, '#5a3a22', 18, 50, 5, 12);
  for (const [y, w] of [[48, 18], [39, 15], [30, 12], [21, 9], [12, 6]]) {
    poly(x, '#1a4e34', [[20 - w, y + 4], [20, y - 12], [20 + w, y + 4]]);
    poly(x, '#2a6e44', [[20 - w + 4, y + 2], [20, y - 11], [22, y + 2]]);
    poly(x, '#f4f8ff', [[20 - w + 1, y + 3], [20 - w + 6, y], [20, y - 11], [20 + w - 6, y], [20 + w - 1, y + 3], [20 + w - 5, y + 1], [20, y - 6], [20 - w + 5, y + 1]]);
  }
}, [24, 40, 52]);
// cacto (saguaro) e mandacaru (candelabro do sertão, com flor)
SPR.cactus = art(20, 32, (x) => {
  shadow(x, 10, 30, 7);
  const g = '#3e9a4a', d = '#2a7038', l = '#7ad06a';
  px(x, g, 7, 4, 6, 26); px(x, d, 11, 4, 2, 26); px(x, l, 8, 5, 1, 24); blob(x, 10, 5, 3, g); px(x, l, 8, 3, 2, 1);
  px(x, g, 2, 12, 3, 9); px(x, g, 2, 19, 6, 3); blob(x, 3.5, 12, 1.5, g); px(x, l, 2, 13, 1, 6);
  px(x, g, 15, 9, 3, 9); px(x, g, 12, 16, 6, 3); blob(x, 16.5, 9, 1.5, g); px(x, d, 17, 10, 1, 8);
  for (let y = 7; y < 28; y += 4) { px(x, '#e8f0c0', 7, y, 1, 1); px(x, '#e8f0c0', 12, y + 2, 1, 1); }
}, [20, 52, 26]);
SPR.mandacaru = art(36, 46, (x) => {
  shadow(x, 18, 44, 13, 3);
  const g = '#4a9a6a', d = '#2e6e4a', l = '#8ad09a';
  px(x, '#6a8a4a', 15, 34, 6, 10);
  const arm = (X, top, base) => { px(x, g, X, top, 5, base - top); px(x, d, X + 3, top, 2, base - top); px(x, l, X + 1, top + 1, 1, base - top - 2); blob(x, X + 2.5, top, 2.5, g); px(x, l, X + 1, top - 1, 2, 1); };
  px(x, g, 6, 28, 26, 5); px(x, d, 6, 31, 26, 2);
  arm(15, 4, 36); arm(6, 12, 32); arm(25, 9, 32); arm(1, 20, 30); arm(30, 18, 30);
  px(x, g, 1, 27, 10, 4); px(x, g, 27, 26, 9, 4);
  blob(x, 17.5, 3, 2.5, '#ff7ab0'); px(x, '#ffd0e4', 17, 2, 1, 1); blob(x, 8.5, 11, 1.8, '#ffffff');
}, [20, 48, 30]);
// coqueiro (tronco inclinado, cocos) e palmeira (tronco reto)
SPR.coqueiro = art(48, 64, (x) => {
  shadow(x, 22, 61, 12, 3);
  for (let i = 0; i < 11; i++) { const k = i / 11, X = Math.round(20 + Math.pow(1 - k, 2) * 0 + k * 0 + Math.sin(k * 1.6) * 8 - 4); px(x, i % 2 ? '#a8784a' : '#8a5a34', X, 58 - i * 4, 6, 4); px(x, '#c89a62', X + 1, 58 - i * 4, 1, 3); }
  const cx = 28, cy = 16;
  const leaf = (ang, len, c) => { x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = c; x.beginPath(); x.moveTo(0, -2); x.quadraticCurveTo(len * 0.5, -8, len, 3); x.quadraticCurveTo(len * 0.5, 0, 0, 3); x.fill(); x.restore(); };
  [[-2.7, 22], [-0.4, 22], [2.5, 18], [0.6, 19], [-1.7, 17], [3.5, 15], [1.6, 14]].forEach(([a, l]) => leaf(a, l, '#2a8a3a'));
  [[-2.5, 17], [-0.6, 17], [-1.5, 13], [2.6, 13]].forEach(([a, l]) => leaf(a, l, '#4cc25a'));
  for (const [a, b] of [[25, 19], [29, 20], [27, 22]]) { blob(x, a, b, 2.6, '#6a4a22'); px(x, '#9a7a4a', a - 1, b - 1, 1, 1); }
}, [22, 48, 26]);
SPR.palmeira = art(40, 68, (x) => {
  shadow(x, 20, 65, 10, 3);
  px(x, '#9a8a7a', 17, 22, 6, 44); px(x, '#c8b8a4', 18, 22, 2, 44); for (let y = 24; y < 64; y += 5) px(x, '#7a6a5a', 17, y, 6, 1);
  px(x, '#5a9a3a', 17, 16, 6, 7);
  const leaf = (ang, len, c) => { x.save(); x.translate(20, 15); x.rotate(ang); x.fillStyle = c; x.beginPath(); x.moveTo(0, -1.5); x.quadraticCurveTo(len * 0.55, -6, len, 4); x.quadraticCurveTo(len * 0.5, 1, 0, 2); x.fill(); x.restore(); };
  for (let i = 0; i < 9; i++) leaf(-Math.PI + i * (Math.PI / 8) + (i % 2) * 0.1, 16 + (i % 3) * 2, '#2f8a3a');
  for (let i = 0; i < 5; i++) leaf(-Math.PI * 0.9 + i * 0.6, 12, '#5ac25a');
}, [22, 48, 26]);
// árvore de mangue: copa sobre raízes em arco
SPR.mangue = art(48, 52, (x) => {
  ell(x, 24, 49, 18, 3, 'rgba(40,60,70,.35)');
  x.strokeStyle = '#6a4a2e'; x.lineWidth = 2;
  for (const [a, b] of [[6, 18], [12, 21], [20, 23], [28, 25], [36, 27], [42, 30]]) { x.beginPath(); x.moveTo(a, 50); x.quadraticCurveTo((a + 24) / 2, 30, b, 30); x.stroke(); }
  x.strokeStyle = '#8a6440'; x.lineWidth = 1; for (const a of [9, 23, 39]) { x.beginPath(); x.moveTo(a, 50); x.quadraticCurveTo((a + 24) / 2, 32, 24, 30); x.stroke(); }
  px(x, '#5a3a22', 21, 22, 6, 10);
  const g = ['#1e5a34', '#2a7a40', '#48a050', '#7ad070'];
  [[24, 16, 15], [11, 20, 9], [37, 20, 9], [18, 9, 9], [31, 9, 9]].forEach(([a, b, r]) => blob(x, a, b, r, g[0]));
  [[24, 15, 12], [13, 18, 6], [35, 18, 6], [19, 9, 6], [30, 8, 6]].forEach(([a, b, r]) => blob(x, a, b, r, g[1]));
  [[20, 10, 5], [30, 7, 4], [14, 16, 3]].forEach(([a, b, r]) => blob(x, a, b, r, g[2]));
  [[18, 7, 2], [28, 5, 1.5]].forEach(([a, b, r]) => blob(x, a, b, r, g[3]));
}, [20, 40, 30]);
// pedras: rocha de lava, estalagmite (pedra e gelo), cristal (dois tons), obsidiana
SPR.lavaRock = art(28, 22, (x) => {
  shadow(x, 14, 19, 12);
  poly(x, '#3a2e30', [[2, 19], [4, 9], [10, 3], [19, 4], [26, 11], [26, 19]]);
  poly(x, '#544446', [[5, 12], [10, 5], [18, 6], [14, 11]]);
  x.strokeStyle = '#ff8a2a'; x.lineWidth = 1; x.beginPath(); x.moveTo(8, 18); x.lineTo(11, 12); x.lineTo(16, 10); x.lineTo(19, 14); x.moveTo(16, 10); x.lineTo(21, 7); x.stroke();
  px(x, '#ffd060', 11, 12, 1, 1); px(x, '#ffd060', 19, 14, 1, 1);
}, [24, 14, 14]);
function spike(col, hi, dk) {
  return art(16, 30, (x) => {
    shadow(x, 8, 28, 6, 2);
    poly(x, col, [[2, 28], [6, 6], [8, 1], [10, 6], [14, 28]]); poly(x, hi, [[4, 26], [7, 6], [8, 3], [8, 26]]); poly(x, dk, [[11, 27], [9, 10], [13, 27]]);
    for (const y of [12, 18, 23]) px(x, dk, 5, y, 7, 1);
  });
}
SPR.stalagmite = spike('#8a7868', '#b09c88', '#5e4e44');
SPR.stalagmiteIce = spike('#8ac4e8', '#d8f2ff', '#5a96c8');
function crystal(c1, c2, c3) {
  return art(22, 28, (x) => {
    shadow(x, 11, 26, 9);
    const sh = (cx, h, w, a) => { x.save(); x.translate(cx, 26); x.rotate(a); poly(x, c1, [[-w, 0], [-w, -h + w], [0, -h], [w, -h + w], [w, 0]]); poly(x, c2, [[-w, 0], [-w, -h + w], [0, -h], [0, 0]]); px(x, c3, -1, -h + 2, 1, h - 4); x.restore(); };
    sh(6, 14, 3, -0.35); sh(16, 12, 3, 0.4); sh(11, 22, 4, 0);
  }, [30, 30, 60]);
}
SPR.crystal = crystal('#4ad8d8', '#a8fff8', '#ffffff');
SPR.crystalPink = crystal('#d85ad8', '#ffb0f4', '#ffffff');
SPR.obsidianRock = art(24, 22, (x) => {
  shadow(x, 12, 20, 10);
  poly(x, '#1a1624', [[2, 20], [3, 10], [9, 2], [16, 5], [22, 12], [21, 20]]); poly(x, '#3a2e56', [[5, 11], [9, 4], [12, 8], [8, 13]]); px(x, '#c8b0ff', 9, 5, 1, 2);
}, [12, 8, 18]);

// templo: estátua, tocha (apagada/acesa), braseiro, altar, baú, sino, coluna quebrada, obelisco, vaso
SPR.statue = art(26, 42, (x) => {
  shadow(x, 13, 40, 11);
  px(x, '#8a8478', 2, 30, 22, 10); px(x, '#b4aea0', 2, 30, 22, 2); px(x, '#6a645a', 2, 39, 22, 1); px(x, '#a09a8c', 4, 33, 18, 1);
  // guardião sentado (uma fera de pedra com orelhas e cauda)
  ell(x, 13, 22, 8, 8, '#a8a294'); ell(x, 13, 12, 6.5, 6, '#b8b2a4');
  poly(x, '#b8b2a4', [[7, 9], [6, 1], [10, 6]]); poly(x, '#b8b2a4', [[19, 9], [20, 1], [16, 6]]);
  px(x, '#8a8478', 7, 26, 4, 4); px(x, '#8a8478', 15, 26, 4, 4); px(x, '#d4cec0', 9, 9, 3, 2);
  px(x, '#5ad8e8', 10, 12, 2, 1); px(x, '#5ad8e8', 15, 12, 2, 1); px(x, '#6a645a', 12, 16, 3, 1);
  x.strokeStyle = '#a8a294'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 26); x.quadraticCurveTo(26, 22, 22, 16); x.stroke();
  px(x, '#6aa050', 3, 29, 4, 2); px(x, '#6aa050', 20, 36, 3, 2);
}, [40, 38, 36]);
function torch(lit, f = 0) {
  return art(12, 30, (x) => {
    shadow(x, 6, 28, 4, 1.5);
    px(x, '#5a4030', 5, 10, 2, 18); px(x, '#7a5a40', 5, 10, 1, 18); px(x, '#3a2a20', 3, 26, 6, 2);
    px(x, '#6a6a72', 2, 7, 8, 4); px(x, '#9a9aa4', 2, 7, 8, 1); px(x, '#4a4a52', 3, 10, 6, 1);
    if (lit) { const k = [0, 1, -1][f]; poly(x, '#ff7a1a', [[2, 7], [4 + k, 1], [6 + k, -1], [8, 2], [10, 7]]); poly(x, '#ffd24a', [[4, 7], [5 + k, 3], [6 + k, 1], [7, 4], [8, 7]]); px(x, '#fff6c0', 5 + (k > 0 ? 1 : 0), 5, 2, 2); }
    else px(x, '#3a3030', 3, 6, 6, 1);
  });
}
SPR.torch = torch(false); SPR.torchLit = [0, 1, 2].map((f) => torch(true, f));
function brazier(lit, f = 0) {
  return art(22, 22, (x) => {
    shadow(x, 11, 20, 8);
    px(x, '#5a5a62', 4, 14, 2, 6); px(x, '#5a5a62', 16, 14, 2, 6); px(x, '#5a5a62', 10, 15, 2, 5);
    ell(x, 11, 11, 9, 4, '#8a6a3a'); ell(x, 11, 10, 8, 3, '#2a2020'); px(x, '#c89a5a', 3, 11, 16, 1); px(x, '#6a4a2a', 4, 14, 14, 1);
    if (lit) { const k = [0, 1, -1][f]; poly(x, '#ff6a1a', [[4, 10], [7 + k, 2], [10, 5], [12 + k, -1], [15, 4], [18, 10]]); poly(x, '#ffcf4a', [[7, 10], [9 + k, 5], [11, 7], [13 + k, 3], [15, 10]]); px(x, '#fff6c0', 10, 7, 2, 2); }
    else { px(x, '#4a4040', 6, 9, 3, 1); px(x, '#5a4a40', 12, 9, 4, 1); }
  });
}
SPR.brazier = brazier(false); SPR.brazierLit = [0, 1, 2].map((f) => brazier(true, f));
SPR.altar = art(34, 26, (x) => {
  shadow(x, 17, 24, 15);
  px(x, '#a8a090', 3, 12, 28, 12); px(x, '#c8c0b0', 3, 12, 28, 2); px(x, '#888070', 3, 23, 28, 1);
  px(x, '#8a2a3a', 8, 12, 18, 9); px(x, '#b84a5a', 8, 12, 18, 1); px(x, '#f2c94c', 8, 19, 18, 1);
  px(x, '#d8d0c0', 1, 9, 32, 4); px(x, '#f2ece0', 1, 9, 32, 1);
  blob(x, 17, 5, 3.5, '#9ae8ff'); px(x, '#ffffff', 16, 3, 1, 2); px(x, '#c89a2a', 14, 7, 7, 2);
  px(x, '#f4ead2', 4, 4, 2, 5); px(x, '#ffb84a', 4, 2, 2, 2); px(x, '#f4ead2', 28, 4, 2, 5); px(x, '#ffb84a', 28, 2, 2, 2);
});
function chest(open) {
  return art(18, 16, (x) => {
    shadow(x, 9, 14, 8, 2);
    px(x, '#8a5a2a', 1, 6, 16, 8); px(x, '#a8743a', 1, 6, 16, 2); px(x, '#5a3a1a', 1, 13, 16, 1);
    px(x, '#c8a040', 1, 9, 16, 1); px(x, '#c8a040', 4, 6, 1, 8); px(x, '#c8a040', 13, 6, 1, 8);
    if (open) { px(x, '#3a2414', 2, 3, 14, 3); px(x, '#a8743a', 1, 0, 16, 3); px(x, '#ffe27a', 5, 4, 8, 2); }
    else { px(x, '#9a6a32', 1, 2, 16, 5); px(x, '#b8843e', 1, 2, 16, 1); px(x, '#c8a040', 1, 5, 16, 1); px(x, '#f2d24c', 8, 6, 2, 3); px(x, '#3a2a1a', 8, 7, 2, 1); }
  });
}
SPR.chest = chest(false); SPR.chestOpen = chest(true);
SPR.bell = art(24, 32, (x) => {
  shadow(x, 12, 30, 10);
  px(x, '#6b4428', 1, 4, 3, 26); px(x, '#6b4428', 20, 4, 3, 26); px(x, '#8a5a34', 0, 2, 24, 4); px(x, '#a8744a', 0, 2, 24, 1);
  poly(x, '#c8902a', [[6, 22], [7, 12], [9, 8], [15, 8], [17, 12], [18, 22]]); px(x, '#f2c94c', 8, 10, 2, 11); px(x, '#8a5a1a', 5, 21, 14, 2);
  px(x, '#5a4030', 11, 6, 2, 3); blob(x, 12, 24, 1.5, '#8a5a1a');
});
SPR.brokenColumn = art(18, 26, (x) => {
  shadow(x, 9, 24, 8);
  px(x, '#c8c0b0', 1, 20, 16, 4); px(x, '#d8d0c0', 3, 6, 12, 15); px(x, '#f2ece0', 4, 6, 2, 15); px(x, '#a8a090', 12, 6, 2, 15);
  poly(x, '#d8d0c0', [[3, 7], [5, 3], [8, 6], [11, 2], [15, 7]]); px(x, '#5ab45a', 2, 19, 4, 2); px(x, '#5ab45a', 12, 10, 2, 3);
});
SPR.obelisk = art(16, 46, (x) => {
  shadow(x, 8, 44, 7);
  poly(x, '#8a8478', [[3, 44], [4, 6], [8, 1], [12, 6], [13, 44]]); poly(x, '#b4aea0', [[4, 42], [5, 6], [8, 2], [8, 42]]);
  for (let y = 12; y < 40; y += 6) { px(x, '#5ad8e8', 7, y, 2, 2); px(x, '#6a645a', 6, y + 3, 4, 1); }
});
SPR.pot = art(14, 16, (x) => { shadow(x, 7, 14, 6, 2); ell(x, 7, 9, 6, 5, '#b8643a'); ell(x, 6, 8, 4, 3, '#d8844a'); px(x, '#8a4a2a', 4, 2, 6, 3); px(x, '#5a2a1a', 5, 2, 4, 1); px(x, '#f2c94c', 2, 9, 10, 1); });

// casas: iglu, cabana de madeira nevada, casa de taipa
SPR.igloo = art(52, 40, (x) => {
  shadow(x, 26, 37, 24, 3);
  x.fillStyle = '#e8f2fc'; x.beginPath(); x.ellipse(26, 36, 24, 26, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(22, 34, 18, 22, 0, Math.PI, Math.PI * 1.6); x.lineTo(22, 34); x.fill();
  for (const [y, o] of [[16, 0], [24, 5], [31, 0]]) { x.strokeStyle = '#b8cce4'; x.beginPath(); const w = Math.sqrt(Math.max(0, 1 - ((36 - y) / 26) ** 2)) * 24; x.moveTo(26 - w, y); x.lineTo(26 + w, y); x.stroke(); for (let X = 26 - w + 6 + o; X < 26 + w; X += 10) px(x, '#b8cce4', Math.round(X), y - 7, 1, 7); }
  x.fillStyle = '#d4e2f2'; x.beginPath(); x.ellipse(26, 36, 9, 12, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#1a2a3a'; x.beginPath(); x.ellipse(26, 37, 6, 9, 0, Math.PI, 0); x.fill();
}, [40, 60, 90]);
SPR.cabin = art(80, 70, (x) => {
  shadow(x, 40, 67, 38, 3);
  // paredes de troncos
  for (let y = 34; y < 66; y += 4) { px(x, '#8a5a34', 6, y, 68, 4); px(x, '#a8744a', 6, y, 68, 1); px(x, '#5a3a22', 6, y + 3, 68, 1); blob(x, 6, y + 2, 2, '#c08a56'); blob(x, 74, y + 2, 2, '#c08a56'); }
  // porta e janelas
  px(x, '#4e301c', 28, 40, 24, 26); px(x, '#6b4428', 30, 42, 20, 24); px(x, '#8a5a34', 31, 43, 8, 22); px(x, '#8a5a34', 41, 43, 8, 22); px(x, '#f2c94c', 46, 54, 2, 2);
  for (const X of [10, 56]) { px(x, '#4e301c', X, 42, 14, 12); px(x, '#ffe39a', X + 1, 43, 12, 10); px(x, '#4e301c', X + 6, 43, 1, 10); px(x, '#4e301c', X + 1, 47, 12, 1); px(x, '#f4f8ff', X - 1, 54, 16, 2); }
  // telhado com neve
  poly(x, '#6a3a2a', [[0, 36], [40, 8], [80, 36]]); poly(x, '#f4f8ff', [[0, 34], [40, 6], [80, 34], [76, 36], [70, 32], [64, 35], [58, 30], [50, 33], [44, 28], [36, 32], [28, 29], [20, 34], [12, 31], [6, 35]]);
  px(x, '#cfdcf0', 6, 30, 68, 1); px(x, '#8a4a3a', 56, 10, 8, 14); px(x, '#f4f8ff', 55, 8, 10, 3);
}, [40, 30, 30]);
SPR.taipa = art(80, 64, (x) => {
  shadow(x, 40, 61, 38, 3);
  // paredes de barro com a trama de varas aparecendo
  px(x, '#c8925c', 6, 30, 68, 31); for (let i = 0; i < 40; i++) px(x, '#b07a48', 6 + Math.floor(hash(i, 1, 400) * 66), 31 + Math.floor(hash(i, 2, 400) * 28), 3, 1);
  for (const [X, Y, w, h] of [[58, 36, 12, 9], [10, 48, 10, 8]]) { px(x, '#9a6a3a', X, Y, w, h); for (let k = 0; k < w; k += 3) px(x, '#6a4428', X + k, Y, 1, h); for (let k = 0; k < h; k += 3) px(x, '#7a5432', X, Y + k, w, 1); }
  px(x, '#a8744a', 6, 58, 68, 3);
  px(x, '#4e301c', 30, 38, 20, 23); px(x, '#6a4a2a', 32, 40, 16, 21); px(x, '#5a3a22', 39, 40, 2, 21);
  for (const X of [12, 54]) if (X === 12) { px(x, '#4e301c', X, 36, 12, 10); px(x, '#2a1a10', X + 1, 37, 10, 8); px(x, '#6b4428', X + 1, 41, 10, 1); }
  // telhado de telha de barro
  poly(x, '#b8502a', [[0, 32], [10, 12], [70, 12], [80, 32]]);
  for (let y = 15; y < 31; y += 4) { const k = (y - 12) / 20, l = 10 - 10 * k, r = 70 + 10 * k; px(x, '#8a3a1e', Math.round(l), y, Math.round(r - l), 1); for (let X = Math.round(l) + (y % 8 ? 2 : 5); X < r; X += 6) px(x, '#d8703a', X, y + 1, 3, 2); }
  px(x, '#e8905a', 10, 12, 60, 2); px(x, '#6a2a14', 0, 31, 80, 2);
}, [50, 30, 20]);

// praia e extras
SPR.beachStall = art(56, 46, (x) => {
  shadow(x, 28, 43, 26, 3);
  px(x, '#8a5a34', 4, 14, 3, 30); px(x, '#8a5a34', 49, 14, 3, 30);
  px(x, '#c08a56', 2, 28, 52, 14); px(x, '#d9a46c', 2, 28, 52, 2); for (let i = 4; i < 54; i += 6) px(x, '#a8744a', i, 30, 1, 12);
  for (let i = 0; i < 7; i++) poly(x, i % 2 ? '#ffffff' : '#e8584a', [[i * 8, 4], [i * 8 + 8, 4], [i * 8 + 8, 14], [i * 8 + 4, 17], [i * 8, 14]]);
  px(x, '#c84a3c', 0, 2, 56, 3);
  for (const [a, b] of [[12, 25], [18, 25], [40, 25]]) { blob(x, a, b, 3, '#5a8a2a'); px(x, '#8ac04a', a - 1, b - 2, 2, 1); }
  px(x, '#f2c94c', 28, 21, 6, 7); px(x, '#e8584a', 29, 19, 4, 2); px(x, '#4c9ae8', 22, 22, 4, 6);
});
SPR.surfboard = art(12, 34, (x) => { shadow(x, 6, 32, 5, 1.5); ell(x, 6, 16, 5, 15, '#4cc0e8'); ell(x, 5, 15, 3, 13, '#9ae8ff'); px(x, '#e8584a', 5, 3, 2, 26); });
SPR.driftwood = art(40, 14, (x) => { shadow(x, 20, 12, 18, 2); x.strokeStyle = '#b8a48a'; x.lineWidth = 5; x.beginPath(); x.moveTo(2, 10); x.quadraticCurveTo(20, 4, 38, 8); x.stroke(); x.strokeStyle = '#d8c8b0'; x.lineWidth = 1; x.beginPath(); x.moveTo(4, 8); x.quadraticCurveTo(20, 2, 36, 6); x.stroke(); px(x, '#9a8670', 30, 2, 2, 5); });
SPR.jangada = art(48, 34, (x) => {
  ell(x, 24, 31, 22, 3, 'rgba(0,40,60,.3)');
  for (let i = 0; i < 6; i++) { px(x, '#a8784a', 2 + i * 7, 22, 6, 8); px(x, '#c89a62', 3 + i * 7, 22, 1, 8); }
  px(x, '#6b4428', 23, 0, 2, 24); poly(x, '#f4ead2', [[25, 2], [44, 18], [25, 20]]); px(x, '#c84a3c', 26, 16, 14, 2);
});
SPR.skull = art(22, 14, (x) => { shadow(x, 11, 12, 9, 2); ell(x, 11, 8, 5, 4, '#ece4d4'); px(x, '#3a3030', 8, 7, 2, 2); px(x, '#3a3030', 12, 7, 2, 2); x.strokeStyle = '#ece4d4'; x.lineWidth = 2; x.beginPath(); x.moveTo(7, 6); x.quadraticCurveTo(1, 5, 2, 1); x.moveTo(15, 6); x.quadraticCurveTo(21, 5, 20, 1); x.stroke(); });
SPR.snowman = art(20, 30, (x) => { shadow(x, 10, 28, 8); blob(x, 10, 21, 7, '#f4f8ff'); blob(x, 10, 10, 5, '#ffffff'); px(x, '#2a2a2a', 8, 8, 1, 1); px(x, '#2a2a2a', 12, 8, 1, 1); px(x, '#ff8a2a', 10, 10, 3, 1); px(x, '#e8584a', 5, 14, 10, 2); px(x, '#2a2a2a', 6, 2, 8, 3); px(x, '#2a2a2a', 4, 5, 12, 1); px(x, '#2a2a2a', 10, 18, 1, 1); px(x, '#2a2a2a', 10, 22, 1, 1); }, [60, 80, 110]);
SPR.barrel = art(16, 20, (x) => { shadow(x, 8, 18, 7, 2); px(x, '#8a5a34', 2, 3, 12, 15); px(x, '#a8744a', 3, 3, 3, 15); px(x, '#5a5a62', 1, 5, 14, 2); px(x, '#5a5a62', 1, 13, 14, 2); ell(x, 8, 3, 6, 2, '#6b4428'); });
SPR.fumarola = art(20, 14, (x) => { shadow(x, 10, 12, 9, 2); poly(x, '#5a4a40', [[1, 12], [5, 4], [15, 4], [19, 12]]); ell(x, 10, 5, 5, 2, '#2a1e1a'); px(x, '#c8b84a', 4, 8, 3, 1); px(x, '#e8d85a', 13, 9, 3, 1); });

// mecânicas: pedra de Força, bloco de gelo, vagonete, placa de pressão, alavanca, portas, paredes rachadas
SPR.strengthRock = art(22, 22, (x) => {
  shadow(x, 11, 20, 10);
  ell(x, 11, 12, 10, 9, '#8e8a98'); ell(x, 9, 9, 7, 6, '#aeaab8'); px(x, '#d4d0e0', 6, 5, 4, 1);
  x.strokeStyle = '#6a6676'; x.lineWidth = 1; x.beginPath(); x.moveTo(13, 4); x.lineTo(12, 9); x.lineTo(16, 13); x.moveTo(5, 14); x.lineTo(9, 16); x.stroke();
});
SPR.iceBlock = art(16, 20, (x) => {
  shadow(x, 8, 18, 7, 2);
  px(x, '#8ac8ec', 1, 4, 14, 14); px(x, '#c8ecff', 1, 1, 14, 5); px(x, '#5a9ad0', 1, 16, 14, 2); px(x, '#ffffff', 3, 2, 5, 1); px(x, '#e8f8ff', 3, 7, 1, 6); px(x, '#6aaee0', 11, 8, 2, 6);
}, [40, 80, 120]);
SPR.cart = art(18, 18, (x) => {
  shadow(x, 9, 16, 8, 2);
  poly(x, '#7a7e86', [[1, 5], [17, 5], [15, 14], [3, 14]]); px(x, '#a4a8b0', 1, 5, 16, 2); px(x, '#5a5e66', 3, 12, 12, 2);
  px(x, '#8a6a4a', 4, 2, 4, 3); px(x, '#6a6a72', 9, 1, 5, 4); px(x, '#c8a24a', 10, 2, 2, 1);
  blob(x, 5, 15, 2, '#2a2a30'); blob(x, 13, 15, 2, '#2a2a30');
});
function plate(down) { return texOf(canvas(16, 16, (x) => { px(x, 'rgba(0,0,0,.25)', 2, 3, 13, 12); px(x, down ? '#6a6458' : '#8a8478', 2, 2, 12, 12); px(x, down ? '#7a7466' : '#b4aea0', 3, 3, 10, down ? 1 : 2); px(x, '#5a544a', 2, 13, 12, 1); px(x, down ? '#e8b84a' : '#c89a2a', 6, 6, 4, 4); if (!down) px(x, '#ffe27a', 6, 6, 2, 1); })); }
SPR.plate = plate(false); SPR.plateDown = plate(true);
function lever(on) { return art(16, 20, (x) => { shadow(x, 8, 18, 6, 2); px(x, '#5a5e66', 2, 12, 12, 6); px(x, '#8a8e98', 2, 12, 12, 1); x.strokeStyle = '#8a6a4a'; x.lineWidth = 2; x.beginPath(); const a = on ? 0.6 : -0.6; x.moveTo(8, 13); x.lineTo(8 + Math.sin(a) * 10, 13 - Math.cos(a) * 10); x.stroke(); blob(x, 8 + Math.sin(a) * 10, 13 - Math.cos(a) * 10, 2.5, on ? '#5ac85a' : '#e8584a'); }); }
SPR.lever = lever(false); SPR.leverOn = lever(true);
SPR.stoneDoor = art(16, 32, (x) => {
  px(x, '#7a6e60', 0, 0, 16, 32); px(x, '#9a8c7a', 1, 1, 14, 30); px(x, '#b4a690', 1, 1, 14, 2);
  px(x, '#6a5e50', 7, 2, 2, 29); for (const y of [9, 17, 25]) px(x, '#6a5e50', 1, y, 14, 1);
  blob(x, 8, 13, 3, '#5ad8e8'); blob(x, 8, 13, 1.5, '#d8ffff');
}, [40, 34, 30]);
SPR.barsGate = art(16, 30, (x) => {
  px(x, '#4a4a52', 0, 0, 16, 3); px(x, '#4a4a52', 0, 27, 16, 3);
  for (let i = 1; i < 16; i += 4) { px(x, '#8a8e98', i, 2, 2, 26); px(x, '#c4c8d0', i, 2, 1, 26); }
  px(x, '#6a6e78', 0, 12, 16, 2);
}, [24, 24, 30]);
SPR.lockedDoor = art(16, 32, (x) => {
  px(x, '#5a3a22', 0, 0, 16, 32); px(x, '#8a5a34', 1, 1, 14, 30); px(x, '#a8744a', 1, 1, 14, 2);
  for (const X of [4, 11]) px(x, '#6b4428', X, 2, 1, 29); px(x, '#5a5a62', 1, 8, 14, 2); px(x, '#5a5a62', 1, 23, 14, 2);
  px(x, '#f2c94c', 5, 13, 6, 7); px(x, '#c89a2a', 5, 19, 6, 1); px(x, '#2a1a10', 7, 15, 2, 2); px(x, '#2a1a10', 7.5, 17, 1, 2);
}, [40, 26, 16]);
function crackOver(base, seed) {
  return texOf(canvas(16, 16, (x) => {
    const im = x.createImageData(16, 16); im.data.set(base); x.putImageData(im, 0, 0);
    x.strokeStyle = 'rgba(30,20,20,0.9)'; x.lineWidth = 1; x.beginPath();
    x.moveTo(8, 1); x.lineTo(6, 5); x.lineTo(9, 8); x.lineTo(5, 12); x.lineTo(7, 15); x.moveTo(9, 8); x.lineTo(13, 10); x.lineTo(14, 14); x.moveTo(6, 5); x.lineTo(2, 6); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(9, 1); x.lineTo(7, 5); x.lineTo(10, 8); x.stroke();
    void seed;
  }));
}
SPR.crackedWall = crackOver(WALL[TILE.TEMPLEWALL].faces[0], 1);
SPR.crackedIce = crackOver(WALL[TILE.ICEWALL].faces[0], 2);
SPR.crackedLava = crackOver(WALL[TILE.LAVAWALL].faces[0], 3);
SPR.crackedCanyon = crackOver(WALL[TILE.CANYON].faces[0], 4);
// a da gruta antiga usa a mesma face de rocha do bloco ROCK
SPR.crackedRock = texOf(canvas(16, 16, (x) => {
  x.fillStyle = '#8a7262'; x.fillRect(0, 0, 16, 16); x.fillStyle = '#a48a76'; x.fillRect(0, 0, 16, 2);
  for (const [X, Y, w] of [[1, 4, 6], [8, 3, 7], [3, 9, 8], [12, 8, 4], [0, 13, 5], [7, 13, 8]]) { px(x, '#6a5448', X, Y + 2, w, 1); px(x, '#b09682', X, Y, w - 1, 1); }
  x.strokeStyle = 'rgba(30,20,20,0.9)'; x.beginPath(); x.moveTo(8, 1); x.lineTo(6, 5); x.lineTo(9, 8); x.lineTo(5, 12); x.lineTo(7, 15); x.moveTo(9, 8); x.lineTo(13, 10); x.lineTo(14, 14); x.stroke();
}));
// luz própria (cristais e lava), suave, para somar na cena escura
SPR.glowCyan = texOf(canvas(64, 64, (x) => radial(x, 32, 32, 32, '140,255,250', 0.9)));
SPR.glowPink = texOf(canvas(64, 64, (x) => radial(x, 32, 32, 32, '255,150,240', 0.9)));
SPR.glowLava = texOf(canvas(64, 64, (x) => radial(x, 32, 32, 32, '255,120,40', 0.9)));
for (const k of ['glowCyan', 'glowPink', 'glowLava']) SPR[k].source.scaleMode = 'linear';

// mato alto dos biomas: o mesmo desenho do mato, repintado (com geada; capim seco do sertão)
function recolor(tex, f) {
  const src = tex.source.resource, c = canvas(src.width, src.height, (x) => x.drawImage(src, 0, 0));
  const x = c.getContext('2d'), im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 10) continue; const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255, [r, g, b] = f(l, i / 4 % c.width, (i / 4 / c.width) | 0); d[i] = r; d[i + 1] = g; d[i + 2] = b; }
  x.putImageData(im, 0, 0); return texOf(c);
}
export const TALL_SNOW = TALL.map((t) => recolor(t, (l, x, y) => (l < 0.2 ? [58, 92, 104] : y < 7 && l > 0.45 ? [250, 252, 255] : l > 0.55 ? [214, 232, 244] : mix([84, 132, 128], [150, 196, 196], l * 1.4))));
export const TALL_DRY = TALL.map((t) => recolor(t, (l) => (l < 0.2 ? [92, 64, 30] : l > 0.6 ? [246, 222, 140] : mix([170, 128, 56], [226, 190, 104], l * 1.3))));
