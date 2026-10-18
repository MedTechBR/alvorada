// Pixel art dos humanos (treinador, NPCs), desenhada por código, sem dependências.
// Quadro de 24x32: cabeça grande (estilo DS), 4 direções, caminhada (4), corrida (4) e lançamento (3).
// As cores são trocáveis (pele, cabelo, boné, roupa, calça, sapato, mochila) para o futuro criador de personagem:
// sombra, brilho e contorno saem da cor base, então basta passar um hex por parte.
// Saída: RGBA puro (Uint8ClampedArray), usado pelo characters.js (PixiJS) e pela prévia em Node.

export const FW = 24, FH = 32;
export const GROUND_Y = 31;          // linha do chão (o pé encosta aqui)
export const DIRS = ['down', 'up', 'left', 'right'];

// ---------------------------------------------------------------- cores
function hexRgb(h) { const n = parseInt(String(h).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
  }
  return [h, s, l];
}
function hslRgb([h, s, l]) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255));
}
// sombra puxa o tom para o azul/roxo (como no PMD), brilho para o amarelo
function shade(rgb, k = 0.24) { const [h, s, l] = rgbHsl(rgb); const ht = h + (h > 0.08 && h < 0.6 ? 0.02 : -0.02); return hslRgb([(ht + 1) % 1, Math.min(1, s * 1.05 + 0.04), Math.max(0, l - k)]); }
function light(rgb, k = 0.12) { const [h, s, l] = rgbHsl(rgb); return hslRgb([h, s, Math.min(0.97, l + k)]); }
function outlineOf(rgb) { const [h, s, l] = rgbHsl(rgb); return hslRgb([h, Math.min(1, s * 0.8 + 0.1), Math.min(0.2, l * 0.28 + 0.04)]); }

// ---------------------------------------------------------------- predefinições (protagonistas e NPCs)
const BASE = { skin: '#f6c9a2', hair: '#3b2a22', cap: '#e8413c', capLogo: '#ffffff', top: '#3466d8', trim: '#f2f2f2',
  pants: '#2d3550', shoes: '#d8423a', bag: '#f2b632', eyes: '#2a2238',
  hairStyle: 'short', hat: null, outfit: 'shirt', legs: 'pants', bagStyle: 'pack' };
export const PRESETS = {
  menino:     { hairStyle: 'short', hat: 'cap', cap: '#e8413c', top: '#3466d8', outfit: 'jacket', trim: '#f2f2f2', pants: '#2d3550', shoes: '#d8423a', bag: '#f2b632' },
  menina:     { hairStyle: 'long', hair: '#5a3424', hat: 'beanie', cap: '#f5f5f5', capLogo: '#e8413c', top: '#e8455a', outfit: 'shirt', legs: 'skirt', pants: '#2b2f45', shoes: '#f0f0f0', bag: '#f2d64a', bagStyle: 'shoulder' },
  professor:  { hairStyle: 'short', hair: '#b9b4ae', skin: '#efc19b', outfit: 'coat', top: '#5a8a4a', trim: '#f4f4f0', pants: '#6a4a34', shoes: '#4a3428', bagStyle: null },
  mae:        { hairStyle: 'bun', hair: '#7a4a2e', outfit: 'apron', top: '#e58fb0', trim: '#fff6e8', legs: 'skirt', pants: '#5a6aa8', shoes: '#9a5a3a', bagStyle: null },
  rival:      { hairStyle: 'spiky', hair: '#d8762e', outfit: 'jacket', top: '#3d3550', trim: '#9a7ae0', pants: '#24242e', shoes: '#4a8ae0', bag: '#8a2a3a' },
  treinador:  { hairStyle: 'short', hair: '#2a2a2a', hat: 'cap', cap: '#3a8ad8', capLogo: '#ffffff', outfit: 'shirt', top: '#f2c03a', legs: 'shorts', pants: '#3a5a9a', shoes: '#e05a3a', bag: '#3a9a5a' },
  treinadora: { hairStyle: 'ponytail', hair: '#e0b04a', outfit: 'shirt', top: '#4ab0a0', legs: 'skirt', pants: '#d84a7a', shoes: '#ffffff', bagStyle: 'shoulder', bag: '#d84a7a' },
  montanhista:{ hairStyle: 'short', hair: '#4a3428', hat: 'beanie', cap: '#c84a3a', capLogo: '#c84a3a', skin: '#e0a880', outfit: 'jacket', top: '#8a6a3a', trim: '#5a4a2a', pants: '#4a5a3a', shoes: '#5a3a24', bag: '#3a6a8a', bagStyle: 'big' },
};

// ---------------------------------------------------------------- moldes da cabeça (14 x 14, posição x=5, y=1 no quadro)
// letras: s pele, S pele sombra, e olho, m boca, h cabelo, H cabelo sombra, j cabelo brilho, c chapéu, C chapéu sombra,
//         w logo/detalhe do chapéu, '.' = não mexe
const FACE = {
  down: [
    '..............',
    '..............',
    '...ssssssss...',
    '..ssssssssss..',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '.sssessssesss.',
    '.sssessssesss.',
    '.ssssssssssss.',
    '..SsssmmsssS..',
    '...SSssssSS...',
    '.....SSSS.....',
    '.....SSSS.....',
  ],
  side: [
    '..............',
    '..............',
    '....ssssssss..',
    '...ssssssssss.',
    '..sssssssssss.',
    '..sssssssssss.',
    '..sssssssssss.',
    '.sssesssssssS.',
    '.sssesssssssS.',
    'sssssssssssS..',
    '.smsssssssSS..',
    '..SSssssSSS...',
    '.....SSSS.....',
    '.....SSSS.....',
  ],
  up: [
    '..............',
    '..............',
    '...ssssssss...',
    '..ssssssssss..',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '.ssssssssssss.',
    '..SssssssssS..',
    '...SSSSSSSS...',
    '.....SSSS.....',
    '.....SSSS.....',
  ],
};

const HAIR = {
  short: {
    down: ['..............', '....hhhhhh....', '..hhhhjjhhhh..', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hHhhhhhhhhHh.',
      '.hhhHhhhHhhhh.', '.hh........hh.', '.H..........H.'],
    side: ['..............', '.....hhhhhh...', '...hhhhjjhhhh.', '..hhhhhhhhhhhh', '..hhhhhhhhhhhh', '..hhhhhhhhhhhh',
      '..hh...Hhhhhhh', '.........hhhhh', '.........ShhH.', '..........hH..'],
    up: ['..............', '....hhhhhh....', '..hhhhjjhhhh..', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.',
      '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.HhhhhhhhhhhH.', '..HhhhhhhhhH..', '...HHHHHHHH...'],
  },
  spiky: {
    down: ['..h...h..h....', '..hh.hhhhhh.h.', '.hhhhhhjjhhhh.', 'hhhhhhhhhhhhhh', '.hhhhhhhhhhhh.', 'hhHhhhhhhhhHhh',
      '.hhhHh.hHhhhh.', '.hh.h....h.hh.', '.H..........H.'],
    side: ['......h..h....', '....hhhhhhhh.h', '...hhhhjjhhhhh', '..hhhhhhhhhhhh', '.hhhhhhhhhhhhh', 'hhhhhhhhhhhhhh',
      '..hh.h.Hhhhhhh', '.........hhhhh', '.........ShhhH', '..........hHh.'],
    up: ['..h...h..h....', '..hh.hhhhhh.h.', '.hhhhhhjjhhhh.', 'hhhhhhhhhhhhhh', '.hhhhhhhhhhhh.', 'hhhhhhhhhhhhhh',
      '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', 'hhhhhhhhhhhhhh', '.HhhhhhhhhhhH.', '..HhHhhhHhhH..', '...H.HHHH.H...'],
  },
  long: { // cabelo comprido: a parte de trás (back) é desenhada antes do corpo
    down: ['..............', '....hhhhhh....', '..hhhhjjhhhh..', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.',
      '.hhhHhhhhHhhh.', '.hh........hh.', '.hh........hh.', '.hh........hh.', '.hH........Hh.'],
    downBack: ['', '', '', '', '', '', '', '', '', '', '.hh........hh.', 'hhh........hhh', 'hhH........Hhh', 'hHH........HHh',
      'hH..........Hh', 'H............H', '', ''],
    side: ['..............', '.....hhhhhh...', '...hhhhjjhhhh.', '..hhhhhhhhhhhh', '..hhhhhhhhhhhh', '..hhhhhhhhhhhh',
      '..hh...Hhhhhhh', '........hhhhhh', '........Shhhhh', '.........hhhhh', '.........hhhhh', '.........hhhhH',
      '.........hhhHH', '..........hHH.', '..........HH..', '...........H..'],
    up: ['..............', '....hhhhhh....', '..hhhhjjhhhh..', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.',
      '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.',
      '.hhhhhhhhhhhh.', '.hhhhhhhhhhhh.', '.hHhhhhhhhhHh.', '..HHhhhhhhHH..', '...HHHhhHHH...'],
  },
};
// rabo de cavalo e coque: cabelo curto + um tufo
HAIR.ponytail = { ...HAIR.short,
  side: [...HAIR.short.side.slice(0, 7), '.........hhhhh', '.........Shhhhh'.slice(0, 14), '..........hhhh', '...........hhh', '...........hhH', '............HH'],
  up: [...HAIR.short.up, '.....hhhh.....', '.....hhhh.....', '......hH......', '......HH......'] };
HAIR.bun = { ...HAIR.short,
  down: ['.....hhhh.....', '....hjjhhh....', ...HAIR.short.down.slice(2)],
  side: ['.........hhh..', '........hjjhh.', ...HAIR.short.side.slice(2)],
  up: ['.....hhhh.....', '....hhjjhh....', ...HAIR.short.up.slice(2)] };

const HATS = {
  cap: {
    down: ['....cccccc....', '..ccccwwcccc..', '.cccccwwccccc.', '.cccccccccccc.', '.cccccccccccc.', 'CCCCCCCCCCCCCC'],
    side: ['.....cccccc...', '...ccccccwwcc.', '..ccccccccccc.', '..cccccccccccc', 'CCCCcccccccccc', 'CCCC..........'],
    up: ['....cccccc....', '..cccccccccc..', '.cccccccccccc.', '.cccccccccccc.', '.CCCCwwwwCCCC.', '..............'],
  },
  beanie: {
    down: ['.....cccc.....', '...cccccccc...', '..cccccccccc..', '.cccccccccccc.', '.CCCCCCCCCCCC.', '.wwwwwwwwwwww.'],
    side: ['......cccc....', '....cccccccc..', '...cccccccccc.', '..cccccccccccc', '..CCCCCCCCCCCC', '..wwwwwwwwwwww'],
    up: ['.....cccc.....', '...cccccccc...', '..cccccccccc..', '.cccccccccccc.', '.CCCCCCCCCCCC.', '.wwwwwwwwwwww.'],
  },
};

// ---------------------------------------------------------------- tela de índices
class Grid {
  constructor() { this.k = new Array(FW * FH).fill(null); }
  set(x, y, key) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < FW && y < FH && key) this.k[y * FW + x] = key; }
  get(x, y) { return x >= 0 && y >= 0 && x < FW && y < FH ? this.k[y * FW + x] : null; }
  rect(x, y, w, h, key) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, key); }
  map(rows, x0, y0, mirror = false, remap = null) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i]; if (ch === '.' || ch === ' ') continue;
        const key = remap?.[ch] ?? ch;
        this.set(mirror ? x0 + 13 - i : x0 + i, y0 + j, key);
      }
    });
  }
  // traço grosso de (x0,y0) até (x1,y1)
  line(x0, y0, x1, y1, w, key, endKey = null, endLen = 0) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let t = 0; t <= n; t++) {
      const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n;
      const k = endKey && t > n - endLen ? endKey : key;
      for (let i = 0; i < w; i++) this.set(Math.floor(x) + i - Math.floor(w / 2), y, k);
    }
  }
}

// paleta de chaves -> rgb a partir das cores escolhidas
function paletteOf(o) {
  const c = (h) => hexRgb(h);
  const skin = c(o.skin), hair = c(o.hair), cap = c(o.cap), top = c(o.top), trim = c(o.trim), pants = c(o.pants), shoes = c(o.shoes), bag = c(o.bag);
  return {
    s: skin, S: shade(skin, 0.13), m: shade(skin, 0.3), e: c(o.eyes),
    h: hair, H: shade(hair, 0.16), j: light(hair, 0.16),
    c: cap, C: shade(cap, 0.18), w: c(o.capLogo),
    t: top, T: shade(top, 0.16), u: light(top, 0.1), a: trim, A: shade(trim, 0.14),
    p: pants, P: shade(pants, 0.14), o: shoes, O: shade(shoes, 0.2), q: light(shoes, 0.14),
    b: bag, B: shade(bag, 0.2), k: outlineOf(top),
  };
}

// ---------------------------------------------------------------- corpo
// pose: { bob, legs: [{dx, lift}, {dx, lift}], arms: [{a, len}, {a, len}], lean, throwArm }
function drawFrame(o, dir, pose) {
  const g = new Grid();
  const side = dir === 'left' || dir === 'right';
  const mirror = dir === 'right';
  const view = side ? 'side' : dir;
  const bob = pose.bob ?? 0, lean = side ? (pose.lean ?? 0) : 0;
  const X = (x) => (mirror ? FW - 1 - x : x);      // espelha o lado direito
  const set = (x, y, k) => g.set(X(x), y, k);
  const rect = (x, y, w, h, k) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, k); };
  const line = (x0, y0, x1, y1, w, k, ek, el) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let t = 0; t <= n; t++) {
      const x = x0 + (x1 - x0) * t / n, y = y0 + (y1 - y0) * t / n, kk = ek && t > n - el ? ek : k;
      for (let i = 0; i < w; i++) set(Math.round(x - (w - 1) / 2) + i, Math.round(y), kk);
    }
  };
  const hipY = 22 + bob, shY = 15 + bob, headY = 1 + bob;
  const skirt = o.legs === 'skirt', shorts = o.legs === 'shorts', coat = o.outfit === 'coat';
  const longHair = HAIR[o.hairStyle] ?? HAIR.short;

  // cabelo comprido atrás do corpo (vista de frente)
  if (view === 'down' && longHair.downBack) g.map(longHair.downBack, 5, headY, false);

  // ----- pernas
  const legKey = (i) => (shorts ? (i ? 'S' : 's') : (i ? 'P' : 'p'));
  if (!side) {
    pose.legs.forEach((L, i) => {
      const x = i === 0 ? 8 : 12, foot = 30 - (L.lift ?? 0);
      const top = hipY, len = foot - 1 - top;
      if (shorts) { rect(x, top, 4, 2, 'p'); rect(x, top + 2, 4, Math.max(1, len - 2), i ? 'S' : 's'); rect(i ? x + 3 : x, top, 1, len, i ? 'P' : 'P'); }
      else { rect(x, top, 4, len, 'p'); rect(i === 0 ? x + 3 : x, top, 1, len, 'P'); }
      rect(x, foot - 1, 4, 2, dir === 'up' ? 'O' : 'o'); set(x + (i ? 0 : 3), foot - 1, 'O');
      if (dir === 'down') set(x + (i ? 1 : 2), foot - 1, 'q');
    });
  } else {
    // de lado: perna de trás (mais escura) primeiro
    const order = [1, 0];
    for (const i of order) {
      const L = pose.legs[i], far = i === 1;
      const fx = 12 - (L.dx ?? 0) + lean * 0, foot = 30 - (L.lift ?? 0);
      const hx = 12 + lean;
      const k = shorts ? (far ? 'S' : 's') : (far ? 'P' : 'p');
      line(hx, hipY, fx, foot - 2, 3, k);
      if (shorts) line(hx, hipY, hx + (fx - hx) * 0.3, hipY + 2, 3, far ? 'P' : 'p');
      rect(fx - 2, foot - 1, 4, 2, far ? 'O' : 'o'); set(fx - 2, foot - 1, far ? 'O' : 'q');
    }
  }

  // ----- braço de trás (atrás do tronco)
  const arm = (A, near) => {
    // A.a = ângulo em graus (0 = para baixo, positivo = para frente), A.len
    const len = A.len ?? 6;
    let sx, sy = shY + 1, ex, ey;
    if (side) {
      sx = 12 + lean; const r = (A.a ?? 0) * Math.PI / 180;
      ex = sx - Math.sin(r) * len; ey = sy + Math.cos(r) * len;
      line(sx, sy, ex, ey, 2, near ? 't' : 'T', near ? 's' : 'S', 2);
    } else {
      // de frente/costas: o braço sobe/desce (A.a > 0 encurta, mão à frente)
      sx = A.x; const r = (A.a ?? 0) * Math.PI / 180;
      ex = sx + (A.out ?? 0); ey = sy + Math.cos(r) * len;
      line(sx, sy, ex, ey, 2, near ? 't' : 'T', near ? 's' : 'S', 2);
    }
  };
  if (side) arm(pose.arms[1], false);

  // ----- tronco
  if (!side) {
    const tx = 7, w = 10, h = hipY - shY + (coat ? 4 : 0);
    rect(tx + 1, shY - 1, w - 2, 1, 't');
    rect(tx, shY, w, h, 't');
    rect(tx + w - 1, shY, 1, h, 'T'); rect(tx, shY + h - 1, w, 1, 'T');
    if (dir === 'down') {
      if (o.outfit === 'jacket') { rect(11, shY, 2, h, 'a'); set(12, shY, 'A'); rect(tx, hipY - 1, w, 1, 'A'); }
      if (o.outfit === 'coat') { rect(11, shY, 2, h, 'a'); rect(tx, shY, w, h, 'a'); rect(tx + w - 1, shY, 1, h, 'A'); rect(10, shY, 4, 4, 't'); set(11, shY + 3, 'T'); set(12, shY + 3, 'T'); }
      if (o.outfit === 'apron') { rect(9, shY + 2, 6, h - 2, 'a'); rect(14, shY + 2, 1, h - 2, 'A'); }
      if (o.outfit === 'shirt') { rect(10, shY - 1, 4, 1, 'u'); }
      if (o.bagStyle === 'pack' || o.bagStyle === 'big') { rect(8, shY, 1, 4, 'B'); rect(15, shY, 1, 4, 'B'); }
      if (o.bagStyle === 'shoulder') { for (let i = 0; i < 6; i++) set(8 + i, shY + i, 'B'); }
    } else {
      if (o.outfit === 'coat') { rect(tx, shY, w, h, 'a'); rect(tx + w - 1, shY, 1, h, 'A'); rect(tx, shY + h - 1, w, 1, 'A'); }
      if (o.bagStyle === 'pack') { rect(8, shY + 1, 8, 6, 'b'); rect(8, shY + 6, 8, 1, 'B'); rect(15, shY + 1, 1, 6, 'B'); rect(10, shY + 3, 4, 1, 'B'); }
      if (o.bagStyle === 'big') { rect(7, shY - 1, 10, 9, 'b'); rect(7, shY + 7, 10, 1, 'B'); rect(16, shY - 1, 1, 9, 'B'); rect(9, shY + 2, 6, 1, 'B'); }
      if (o.bagStyle === 'shoulder') { for (let i = 0; i < 6; i++) set(15 - i, shY + i, 'B'); }
    }
    if (skirt) { rect(6, hipY - 1, 12, 4, 'p'); rect(6, hipY + 2, 12, 1, 'P'); rect(17, hipY - 1, 1, 4, 'P'); }
  } else {
    const tx = 9 + lean, w = 7, h = hipY - shY + (coat ? 4 : 0);
    rect(tx + 1, shY - 1, w - 2, 1, 't');
    rect(tx, shY, w, h, 't'); rect(tx + w - 1, shY, 1, h, 'T'); rect(tx, shY + h - 1, w, 1, 'T');
    if (o.outfit === 'jacket') { rect(tx, shY, 1, h, 'a'); }
    if (o.outfit === 'coat') { rect(tx, shY, w, h, 'a'); rect(tx + w - 1, shY, 1, h, 'A'); rect(tx, shY, 2, 4, 't'); }
    if (o.outfit === 'apron') { rect(tx, shY + 2, 2, h - 2, 'a'); }
    if (o.bagStyle === 'pack') { rect(tx + w, shY + 1, 2, 6, 'b'); rect(tx + w + 1, shY + 1, 1, 6, 'B'); rect(tx + 2, shY, 1, 3, 'B'); }
    if (o.bagStyle === 'big') { rect(tx + w - 1, shY - 2, 4, 10, 'b'); rect(tx + w + 2, shY - 2, 1, 10, 'B'); rect(tx + w - 1, shY + 7, 4, 1, 'B'); }
    if (o.bagStyle === 'shoulder') { rect(tx + w - 1, hipY - 2, 3, 3, 'b'); rect(tx + w + 1, hipY - 2, 1, 3, 'B'); for (let i = 0; i < 5; i++) set(tx + 2 + Math.floor(i / 2), shY + i, 'B'); }
    if (skirt) { rect(tx - 1, hipY - 1, w + 2, 4, 'p'); rect(tx - 1, hipY + 2, w + 2, 1, 'P'); }
  }

  // ----- braços de frente/costas (ao lado do tronco)
  if (!side) {
    const [a0, a1] = pose.arms;
    arm({ ...a0, x: 6 }, true);
    arm({ ...a1, x: 18 }, dir !== 'up');
  }

  // ----- cabeça
  const hx = 5 + lean, hy = headY;
  g.map(FACE[view], mirror ? FW - 14 - hx : hx, hy, mirror);
  const hair = longHair[view];
  if (hair) g.map(hair, mirror ? FW - 14 - hx : hx, hy, mirror);
  if (o.hat && HATS[o.hat]) g.map(HATS[o.hat][view], mirror ? FW - 14 - hx : hx, hy, mirror);

  // ----- braço da frente (de lado) por cima de tudo
  if (side) arm(pose.arms[0], true);
  // braço de lançamento de frente/costas levantado por cima da cabeça
  if (!side && pose.throwUp) {
    const x = dir === 'up' ? 6 : 18;
    line(x, shY, x + (dir === 'up' ? -1 : 1), shY - pose.throwUp, 2, 't', 's', 2);
  }
  return g;
}

// contorno seletivo (cor escura derivada da parte vizinha) + conversão para RGBA
function toRGBA(g, pal) {
  const out = new Uint8ClampedArray(FW * FH * 4);
  const N = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const k = g.get(x, y), i = (y * FW + x) * 4;
    if (k) { const c = pal[k] ?? [255, 0, 255]; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; continue; }
    let nk = null;
    for (const [dx, dy] of N) { const v = g.get(x + dx, y + dy); if (v) { nk = v; if (dy === -1) break; } }
    if (nk) { const c = outlineOf(pal[nk] ?? [0, 0, 0]); out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255; }
  }
  // contorno interno leve entre cabeça e corpo/cabelo e rosto não é necessário; olhos já são escuros
  return out;
}

// ---------------------------------------------------------------- poses
const P = (bob, l0, l1, a0, a1, extra = {}) => ({ bob, legs: [l0, l1], arms: [a0, a1], ...extra });
function poses(dir) {
  const side = dir === 'left' || dir === 'right';
  if (side) {
    return {
      // 0 parado/passagem, 1 contato A, 2 passagem, 3 contato B
      walk: [
        P(0, { dx: 0 }, { dx: 0 }, { a: 0 }, { a: 0 }),
        P(1, { dx: 3 }, { dx: -3 }, { a: -25 }, { a: 25 }),
        P(0, { dx: 0 }, { dx: 1, lift: 1 }, { a: 0 }, { a: 0 }),
        P(1, { dx: -3 }, { dx: 3 }, { a: 25 }, { a: -25 }),
      ],
      run: [
        P(0, { dx: 1 }, { dx: -2, lift: 2 }, { a: 35, len: 5 }, { a: -40, len: 5 }, { lean: -1 }),
        P(1, { dx: 4 }, { dx: -4, lift: 1 }, { a: -45, len: 5 }, { a: 50, len: 5 }, { lean: -1 }),
        P(0, { dx: -2, lift: 2 }, { dx: 1 }, { a: -40, len: 5 }, { a: 35, len: 5 }, { lean: -1 }),
        P(1, { dx: -4, lift: 1 }, { dx: 4 }, { a: 50, len: 5 }, { a: -45, len: 5 }, { lean: -1 }),
      ],
      throw: [
        P(0, { dx: 2 }, { dx: -2 }, { a: -150, len: 6 }, { a: 20 }, { lean: 1 }),
        P(1, { dx: 4 }, { dx: -3 }, { a: 100, len: 7 }, { a: -30 }, { lean: -1 }),
        P(1, { dx: 4 }, { dx: -3 }, { a: 50, len: 7 }, { a: -20 }, { lean: -1 }),
      ],
    };
  }
  return {
    walk: [
      P(0, {}, {}, { len: 6 }, { len: 6 }),
      P(1, { lift: 2 }, {}, { len: 5 }, { len: 7 }),
      P(0, {}, {}, { len: 6 }, { len: 6 }),
      P(1, {}, { lift: 2 }, { len: 7 }, { len: 5 }),
    ],
    run: [
      P(0, { lift: 1 }, {}, { len: 5, a: 30 }, { len: 6 }),
      P(1, { lift: 3 }, {}, { len: 4, a: 50 }, { len: 7 }),
      P(0, {}, { lift: 1 }, { len: 6 }, { len: 5, a: 30 }),
      P(1, {}, { lift: 3 }, { len: 7 }, { len: 4, a: 50 }),
    ],
    throw: [
      P(0, {}, {}, { len: 6 }, { len: 0 }, { throwUp: 8 }),
      P(1, {}, { lift: 1 }, { len: 6 }, { len: 7, out: 1 }),
      P(1, {}, {}, { len: 6 }, { len: 6, out: 1 }),
    ],
  };
}

// ---------------------------------------------------------------- criador de personagem
// look do criador: { sexo, pele, cabelo, corCabelo, roupa, calca, bone, chapeu? }
//  - sexo: 'menino' | 'menina'          - pele: hex (ou índice em LOOK_OPTIONS.pele)
//  - cabelo: estilo (LOOK_OPTIONS.cabelo) - corCabelo, roupa, calca, bone: hex
//  - chapeu (opcional): 'bone' | 'gorro' | 'nenhum' (padrão: boné no menino, gorro na menina)
export const LOOK_OPTIONS = {
  sexo: [{ id: 'menino', nome: 'Menino' }, { id: 'menina', nome: 'Menina' }],
  pele: ['#fbe0c8', '#f6c9a2', '#e8b088', '#c98d62', '#a06a44', '#74472c'],
  cabelo: [
    { id: 'curto', nome: 'Curto' }, { id: 'espetado', nome: 'Espetado' }, { id: 'comprido', nome: 'Comprido' },
    { id: 'rabo', nome: 'Rabo de cavalo' }, { id: 'coque', nome: 'Coque' },
  ],
  corCabelo: ['#2a211c', '#3b2a22', '#6a4028', '#a0602e', '#d8762e', '#e8c060', '#b9b4ae', '#3a4a8a', '#c04a6a'],
  roupa: ['#3466d8', '#e8455a', '#3a9a5a', '#f2c03a', '#8a4ac0', '#2d2d36', '#f0f0f0', '#e0782e', '#4ab0c0'],
  calca: ['#2d3550', '#2b2f45', '#5a4a3a', '#3a5a9a', '#d84a7a', '#4a5a3a', '#e8e0d0', '#202024'],
  bone: ['#e8413c', '#f5f5f5', '#3a8ad8', '#2d2d36', '#3a9a5a', '#f2c03a', '#e58fb0', '#8a4ac0'],
  chapeu: [{ id: 'bone', nome: 'Boné' }, { id: 'gorro', nome: 'Gorro' }, { id: 'nenhum', nome: 'Sem chapéu' }],
};
export const DEFAULT_LOOK = {
  menino: { sexo: 'menino', pele: '#f6c9a2', cabelo: 'curto', corCabelo: '#3b2a22', roupa: '#3466d8', calca: '#2d3550', bone: '#e8413c', chapeu: 'bone' },
  menina: { sexo: 'menina', pele: '#f6c9a2', cabelo: 'comprido', corCabelo: '#6a4028', roupa: '#e8455a', calca: '#2b2f45', bone: '#f5f5f5', chapeu: 'gorro' },
};
const HAIR_ID = { curto: 'short', espetado: 'spiky', comprido: 'long', rabo: 'ponytail', coque: 'bun' };
const HAT_ID = { bone: 'cap', gorro: 'beanie', nenhum: null };
const pick = (v, list, def) => (typeof v === 'number' ? list[v] ?? def : v || def);

function fromCreator(l) {
  const sexo = l.sexo === 'menina' ? 'menina' : 'menino';
  const d = DEFAULT_LOOK[sexo];
  const chapeu = l.chapeu ?? (l.bone === null || l.bone === 'nenhum' ? 'nenhum' : d.chapeu);
  const bone = l.bone && l.bone !== 'nenhum' ? pick(l.bone, LOOK_OPTIONS.bone, d.bone) : d.bone;
  return { ...PRESETS[sexo],
    skin: pick(l.pele, LOOK_OPTIONS.pele, d.pele),
    hairStyle: HAIR_ID[l.cabelo] ?? HAIR_ID[d.cabelo],
    hair: pick(l.corCabelo, LOOK_OPTIONS.corCabelo, d.corCabelo),
    top: pick(l.roupa, LOOK_OPTIONS.roupa, d.roupa),
    pants: pick(l.calca, LOOK_OPTIONS.calca, d.calca),
    cap: bone, capLogo: chapeu === 'gorro' ? light(hexRgb(bone), 0.1).reduce((s, v) => s + v.toString(16).padStart(2, '0'), '#') : (bone.toLowerCase() === '#f5f5f5' ? '#e8413c' : '#ffffff'),
    hat: HAT_ID[chapeu] === undefined ? 'cap' : HAT_ID[chapeu],
  };
}

// ---------------------------------------------------------------- API
// look: nome de predefinição ('menino', 'professor', ...), look do criador ({ sexo, ... }) ou cores internas
export function resolveLook(look = 'menino') {
  let o;
  if (typeof look === 'string') o = { ...(PRESETS[look] ?? PRESETS.menino) };
  else if (look && look.sexo) o = fromCreator(look);
  else o = { ...(PRESETS[look?.preset] ?? {}), ...look };
  return { ...BASE, ...o };
}

// Devolve { look, sets: { walk: {down:[rgba..]...}, run: {...}, throw: {...} } }
export function buildCharacter(look = 'menino') {
  const o = resolveLook(look);
  const pal = paletteOf(o);
  const sets = {};
  for (const dir of DIRS) {
    const ps = poses(dir);
    for (const [anim, list] of Object.entries(ps)) {
      sets[anim] ??= {};
      sets[anim][dir] = list.map((pose) => toRGBA(drawFrame(o, dir, pose), pal));
    }
  }
  return { look: o, sets, fw: FW, fh: FH, groundY: GROUND_Y };
}
