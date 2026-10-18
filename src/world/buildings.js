import { canvas, texOf, outline, SPR } from './art.js';

// Prédios em pixel art desenhados por código, na escala dos personagens de 24x32 px:
// portas de ~20x30 px, janelas de 16 px, telhados com telhas e beiral, contorno escuro suave.
// Cada prédio exporta textura + catálogo (pegada, coluna da porta e luzes das janelas à noite).

const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
const ell = (x, cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
const poly = (x, c, pts) => { x.fillStyle = c; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };

// fonte 3x5 para letreiros
const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', E: '111100110100111', I: '111010010010111', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', R: '110101110101101', T: '111010010010010', G: '011100101101011', S: '011100010001110', K: '101101110101101', U: '101101101101111', D: '110101101101110', H: '101101111101101' };
function text(x, s, X, Y, c) { [...s].forEach((ch, i) => { const f = FONT[ch]; if (!f) return; for (let k = 0; k < 15; k++) if (f[k] === '1') px(x, c, X + i * 4 + (k % 3), Y + Math.floor(k / 3)); }); }

function window1(x, X, Y, w = 14, h = 14, frame = '#5a3a22', lit = false) {
  px(x, frame, X - 1, Y - 1, w + 2, h + 2);
  px(x, lit ? '#ffe39a' : '#8fd0f8', X, Y, w, h);
  px(x, lit ? '#fff3c8' : '#c8ecff', X + 1, Y + 1, Math.floor(w / 2) - 1, Math.floor(h / 2) - 1);
  px(x, frame, X + Math.floor(w / 2) - 1, Y, 2, h); px(x, frame, X, Y + Math.floor(h / 2) - 1, w, 1);
  px(x, '#f4eee2', X - 2, Y + h + 1, w + 4, 2); px(x, '#c8bca8', X - 2, Y + h + 2, w + 4, 1);
}
function woodDoor(x, X, Y, w, h, c = '#8a5a34') {
  px(x, '#4e301c', X - 2, Y - 2, w + 4, h + 2);
  px(x, c, X, Y, w, h); px(x, '#a8744a', X + 1, Y + 1, w - 2, 2);
  px(x, '#6b4428', X + 3, Y + 5, w - 6, Math.floor(h / 2) - 5); px(x, '#6b4428', X + 3, Y + Math.floor(h / 2) + 3, w - 6, Math.floor(h / 2) - 6);
  px(x, '#f2c94c', X + w - 5, Y + Math.floor(h / 2), 2, 2);
}
function glassDoor(x, X, Y, w, h) {
  px(x, '#5a6470', X - 2, Y - 2, w + 4, h + 2);
  px(x, '#7ac0e8', X, Y, w, h); px(x, '#5a9ac8', X, Y + h - 6, w, 6);
  px(x, '#d8f0ff', X + 2, Y + 2, 3, h - 8); px(x, '#d8f0ff', X + w / 2 + 2, Y + 2, 3, h - 8);
  px(x, '#5a6470', X + w / 2 - 1, Y, 2, h);
}

// casa com telhado de duas águas visto de cima/frente
function house({ w = 112, h = 96, roof = ['#c84a3c', '#a83a30', '#e87a5c'], wall = ['#f4ead2', '#dccfb0', '#fffaf0'], door = 'wood', chimney = true }) {
  const lights = [];
  const c = canvas(w, h, (x) => {
    const base = h - 3, wallH = 40, y0 = base - wallH, cx = w / 2;
    ell(x, cx, base, w * 0.47, 3, 'rgba(0,0,0,.22)');
    // paredes
    px(x, wall[0], 8, y0, w - 16, wallH);
    for (let y = y0 + 4; y < base - 6; y += 5) px(x, wall[1], 8, y, w - 16, 1);
    px(x, wall[2], 8, y0, 2, wallH); px(x, wall[1], w - 11, y0, 3, wallH);
    px(x, '#8a8478', 8, base - 6, w - 16, 6); px(x, '#b4aea0', 8, base - 6, w - 16, 1);
    // telhado
    const rt = 6, rb = y0 + 3;
    if (chimney) { px(x, '#8a4a3a', w - 34, rt - 2, 12, 20); px(x, '#a85a48', w - 34, rt - 2, 12, 3); px(x, '#5a3028', w - 35, rt - 4, 14, 3); }
    poly(x, roof[0], [[2, rb], [w - 2, rb], [w - 16, rt + 4], [16, rt + 4]]);
    for (let y = rt + 9; y < rb - 3; y += 6) {
      const k = (y - rt) / (rb - rt), l = 16 - 14 * k, r = w - 16 + 14 * k;
      px(x, roof[1], Math.round(l), y, Math.round(r - l), 1);
      for (let i = Math.round(l) + ((y / 6) % 2 ? 3 : 7); i < r - 2; i += 9) px(x, roof[1], i, y + 1, 1, 4);
    }
    px(x, roof[2], 17, rt + 4, w - 34, 3); px(x, roof[2], 18, rt + 2, w - 36, 2);
    px(x, roof[1], 2, rb - 3, w - 4, 3); px(x, '#3a2420', 2, rb, w - 4, 1);
    // porta e janelas
    const dw = 20, dh = 30, dx = Math.round(Math.floor(w / 32) * 16 + 8 - dw / 2), dy = base - dh;
    if (door === 'wood') woodDoor(x, dx, dy, dw, dh); else glassDoor(x, dx, dy, dw, dh);
    px(x, '#c84a3c', dx - 2, base - 1, dw + 4, 2);
    for (const wx of [Math.min(20, dx - 24), Math.max(w - 36, dx + dw + 6)]) { window1(x, wx, y0 + 9, 16, 14); lights.push([wx + 8, y0 + 16]); }
    px(x, '#5ab45a', 18, y0 + 26, 20, 3); px(x, '#ff7aa8', 21, y0 + 25, 2, 2); px(x, '#ffd84a', 27, y0 + 25, 2, 2); px(x, '#ff7aa8', 33, y0 + 25, 2, 2);
  });
  return { tex: texOf(outline(c)), lights };
}

// prédio de telhado plano com letreiro (Centro Pokémon, loja, laboratório)
function hall({ w, h, roof, wall, band, sign, door = 'glass', wins = [], skylight = false }) {
  const lights = [];
  const c = canvas(w, h, (x) => {
    const base = h - 3, wallH = 50, y0 = base - wallH;
    ell(x, w / 2, base, w * 0.47, 3, 'rgba(0,0,0,.22)');
    px(x, wall[0], 6, y0, w - 12, wallH);
    px(x, wall[2], 6, y0, 2, wallH); px(x, wall[1], w - 9, y0, 3, wallH);
    px(x, band, 6, y0 + 4, w - 12, 4); px(x, band, 6, base - 12, w - 12, 3);
    px(x, '#8a8478', 6, base - 6, w - 12, 6); px(x, '#b4aea0', 6, base - 6, w - 12, 1);
    // telhado plano com beiral arredondado
    const rt = 4, rb = y0 + 2;
    x.fillStyle = roof[0]; x.beginPath(); x.roundRect(2, rt, w - 4, rb - rt, 6); x.fill();
    px(x, roof[2], 8, rt + 2, w - 16, 3); px(x, roof[1], 2, rb - 7, w - 4, 7); px(x, '#3a2420', 3, rb, w - 6, 1);
    for (let i = 10; i < w - 10; i += 12) px(x, roof[1], i, rt + 7, 6, rb - rt - 16);
    if (skylight) { px(x, '#5a6470', w / 2 - 22, rt + 5, 44, rb - rt - 14); px(x, '#bfe4ff', w / 2 - 20, rt + 7, 40, rb - rt - 18); px(x, '#eaf7ff', w / 2 - 18, rt + 8, 10, 4); }
    // porta
    const dw = door === 'double' ? 30 : 22, dh = 30, dx = Math.round(w / 2 - dw / 2), dy = base - dh;
    glassDoor(x, dx, dy, dw, dh);
    px(x, '#d8d0c0', dx - 3, base - 1, dw + 6, 2);
    // janelas
    for (const wx of wins) { window1(x, wx, y0 + 18, 16, 14, '#4a5a6a'); lights.push([wx + 8, y0 + 25]); }
    sign?.(x, w, y0, rt, rb, dx, dy, dw);
  });
  return { tex: texOf(outline(c)), lights };
}

const ball = (x, cx, cy, r) => {
  ell(x, cx, cy, r + 1, r + 1, '#3a2a2a'); ell(x, cx, cy, r, r, '#f4f4f4');
  x.fillStyle = '#e5383b'; x.beginPath(); x.arc(cx, cy, r, Math.PI, 0); x.fill();
  px(x, '#3a2a2a', cx - r, cy, r * 2, 1); ell(x, cx, cy + 0.5, 2.2, 2.2, '#3a2a2a'); ell(x, cx, cy + 0.5, 1.2, 1.2, '#fff');
};

const B = {};
const mk = (name, r, fw, fh, door) => { SPR['bld_' + name] = r.tex; B[name] = { tex: 'bld_' + name, fw, fh, oy: 3, door, lights: r.lights }; };
mk('houseA', house({ roof: ['#9a5a3a', '#7a4228', '#c07a52'] }), 7, 3, 3);
mk('houseB', house({ roof: ['#c84a3c', '#a03a30', '#ee7a5e'], wall: ['#f2e4c4', '#d8c8a2', '#fff8e8'] }), 7, 3, 3);
mk('houseC', house({ roof: ['#6a8a5a', '#4e6e42', '#90b07a'], wall: ['#efe6d4', '#d4c8b0', '#fffaf0'], chimney: false }), 7, 3, 3);
mk('houseBlue', house({ roof: ['#3a6ad8', '#2a4eaa', '#6a9af2'], wall: ['#f4f0e6', '#d8d2c2', '#ffffff'] }), 7, 3, 3);
mk('center', hall({ w: 144, h: 112, roof: ['#e8483a', '#b83228', '#ff8a6a'], wall: ['#f8f6f2', '#d8d4cc', '#ffffff'], band: '#e8483a', door: 'double', wins: [18, 40, 88, 110],
  sign: (x, w, y0, rt, rb, dx, dy) => { ball(x, w / 2, rt + 12, 8); px(x, '#ffffff', w / 2 - 20, dy - 9, 40, 7); text(x, 'POKE', w / 2 - 18, dy - 8, '#e8483a'); text(x, 'MON', w / 2 + 0, dy - 8, '#3a3a5a'); } }), 9, 3, 4);
mk('mart', hall({ w: 112, h: 104, roof: ['#3a7ae8', '#2a58b8', '#7aaaf8'], wall: ['#f4f6f8', '#d4d8dc', '#ffffff'], band: '#3a7ae8', wins: [14, 82],
  sign: (x, w, y0, rt, rb, dx, dy) => { px(x, '#2a58b8', w / 2 - 14, rt + 6, 28, 11); px(x, '#ffffff', w / 2 - 13, rt + 7, 26, 9); text(x, 'MART', w / 2 - 8, rt + 9, '#2a58b8'); } }), 7, 3, 3);
mk('lab', hall({ w: 176, h: 112, roof: ['#8a94a4', '#6a7484', '#b4bccc'], wall: ['#f0f4f8', '#cfd6de', '#ffffff'], band: '#4ab0a0', wins: [14, 36, 58, 104, 126, 148], skylight: true,
  sign: (x, w, y0, rt, rb, dx, dy) => { px(x, '#2a7a70', w / 2 - 9, dy - 10, 18, 8); text(x, 'LAB', w / 2 - 6, dy - 9, '#ffffff'); } }), 11, 3, 5);

// celeiro da Fazenda do Tomé
function barn() {
  const lights = [];
  const c = canvas(112, 100, (x) => {
    const base = 97, y0 = 52;
    ell(x, 56, base, 52, 3, 'rgba(0,0,0,.22)');
    px(x, '#b8402e', 8, y0, 96, base - y0); for (let i = 10; i < 104; i += 6) px(x, '#9a3426', i, y0, 1, base - y0);
    px(x, '#f4ead2', 8, y0, 96, 3); px(x, '#f4ead2', 8, base - 4, 96, 2);
    poly(x, '#7a4a32', [[2, y0 + 2], [56, 6], [110, y0 + 2]]); poly(x, '#9a6040', [[10, y0], [56, 12], [102, y0]]);
    for (let y = 18; y < y0; y += 6) { const k = (y - 12) / (y0 - 12); px(x, '#7a4a32', Math.round(56 - 46 * k), y, Math.round(92 * k), 1); }
    px(x, '#f4ead2', 48, 26, 16, 14); px(x, '#3a2a1a', 50, 28, 12, 10); px(x, '#f4ead2', 55, 28, 2, 10);
    // portão grande
    px(x, '#4e301c', 38, base - 36, 36, 36); px(x, '#8a5a34', 40, base - 34, 15, 33); px(x, '#8a5a34', 57, base - 34, 15, 33);
    x.strokeStyle = '#f4ead2'; x.lineWidth = 2; x.beginPath(); x.moveTo(40, base - 34); x.lineTo(55, base - 1); x.moveTo(55, base - 34); x.lineTo(40, base - 1); x.moveTo(57, base - 34); x.lineTo(72, base - 1); x.moveTo(72, base - 34); x.lineTo(57, base - 1); x.stroke();
    window1(x, 16, y0 + 12, 14, 12, '#f4ead2'); window1(x, 82, y0 + 12, 14, 12, '#f4ead2'); lights.push([23, y0 + 18], [89, y0 + 18]);
  });
  return { tex: texOf(outline(c)), lights };
}
// jequitibá com porta no tronco: Centro Pokémon de Vila Sussurro e casas nas árvores
function treeBuilding(kind) {
  const lights = [];
  const c = canvas(112, 128, (x) => {
    const base = 125;
    ell(x, 56, base, 46, 4, 'rgba(0,0,0,.25)');
    // tronco e raízes
    px(x, '#5a3a22', 34, 50, 44, base - 50); px(x, '#7a5236', 38, 50, 10, base - 50); px(x, '#3e2616', 70, 56, 4, base - 60);
    for (const [a, w] of [[22, 16], [74, 18], [14, 10], [90, 10]]) { px(x, '#5a3a22', a, base - 12, w, 12); px(x, '#7a5236', a + 2, base - 12, 3, 10); }
    // copa
    const g = ['#1a5a2c', '#277a38', '#3aa04a', '#7ad86a'];
    [[56, 30, 34], [22, 40, 18], [90, 40, 18], [30, 16, 18], [82, 16, 18]].forEach(([a, b, r]) => ell(x, a, b, r, r * 0.8, g[0]));
    [[56, 28, 28], [26, 38, 13], [86, 38, 13], [34, 16, 13], [78, 16, 13]].forEach(([a, b, r]) => ell(x, a, b, r, r * 0.8, g[1]));
    [[46, 18, 12], [70, 14, 9], [26, 30, 6]].forEach(([a, b, r]) => ell(x, a, b, r, r * 0.8, g[2]));
    // porta em arco no tronco
    const dx = 46, dw = 20, dh = 30, dy = base - dh;
    px(x, '#2e1c10', dx - 2, dy - 2, dw + 4, dh + 2); x.fillStyle = '#2e1c10'; x.beginPath(); x.arc(dx + dw / 2, dy, dw / 2 + 2, Math.PI, 0); x.fill();
    if (kind === 'center') { glassDoor(x, dx, dy, dw, dh); }
    else { woodDoor(x, dx, dy, dw, dh); }
    x.fillStyle = kind === 'center' ? '#7ac0e8' : '#8a5a34'; x.beginPath(); x.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0); x.fill();
    // lanternas de vaga-lume e janela redonda
    ell(x, 56, 66, 8, 8, '#3e2616'); ell(x, 56, 66, 6, 6, '#ffe39a'); lights.push([56, 66]);
    px(x, '#3e2616', 30, 74, 1, 10); ell(x, 30, 86, 3, 4, '#ffe08a'); px(x, '#3e2616', 82, 74, 1, 10); ell(x, 82, 86, 3, 4, '#ffe08a'); lights.push([30, 86], [82, 86]);
    if (kind === 'center') { px(x, '#ffffff', 40, 40, 32, 14); ball(x, 50, 47, 5); text(x, 'PC', 58, 45, '#e8483a'); }
    else { px(x, '#8a5a34', 24, 44, 64, 3); px(x, '#c08a56', 26, 36, 6, 8); px(x, '#c08a56', 80, 36, 6, 8); }
  });
  return { tex: texOf(outline(c)), lights };
}
// estufa de vidro (Laboratório anexo e ginásio da Lia, a Estufa-Teia)
function greenhouse(w = 128, h = 100) {
  const lights = [];
  const c = canvas(w, h, (x) => {
    const base = h - 3, y0 = 40;
    ell(x, w / 2, base, w * 0.46, 3, 'rgba(0,0,0,.22)');
    px(x, '#2f7a3a', 6, y0, w - 12, base - y0); px(x, '#bfe8d0', 8, y0 + 2, w - 16, base - y0 - 8);
    for (let i = 8; i < w - 8; i += 12) px(x, '#2f7a3a', i, y0, 2, base - y0);
    px(x, '#2f7a3a', 6, y0 + 22, w - 12, 2);
    // folhagem lá dentro
    for (let i = 14; i < w - 14; i += 16) { ell(x, i, base - 14, 7, 6, '#3aa04a'); ell(x, i + 4, base - 18, 4, 3, '#7ad86a'); }
    // telhado curvo de vidro
    x.fillStyle = '#2f7a3a'; x.beginPath(); x.ellipse(w / 2, y0 + 2, w / 2 - 4, 36, 0, Math.PI, 0); x.fill();
    x.fillStyle = '#d8f4e4'; x.beginPath(); x.ellipse(w / 2, y0 + 2, w / 2 - 8, 32, 0, Math.PI, 0); x.fill();
    for (let i = 1; i < 6; i++) { x.strokeStyle = '#2f7a3a'; x.lineWidth = 2; x.beginPath(); x.moveTo(w / 2, y0 - 30); x.lineTo(8 + i * (w - 16) / 6, y0 + 2); x.stroke(); }
    px(x, '#ffffff', 26, y0 - 18, 10, 3);
    // teia no vidro
    x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1; x.beginPath(); for (let a = 0; a < 6; a++) { x.moveTo(w - 30, y0 - 10); x.lineTo(w - 30 + Math.cos(a) * 12, y0 - 10 + Math.sin(a) * 12); } x.stroke();
    const dw = 24, dh = 30, dx = 72 - dw / 2; glassDoor(x, dx, base - dh, dw, dh);
    lights.push([24, y0 + 12], [w - 24, y0 + 12]);
  });
  return { tex: texOf(outline(c)), lights };
}
// Rádio Alvorada: casinha com antena de bambu
function radio() {
  const r = house({ w: 96, roof: ['#d8902a', '#b0701a', '#f2b85a'], wall: ['#f4ead2', '#dccfb0', '#fffaf0'], chimney: false });
  return r;
}
mk('barn', barn(), 7, 3, 3);
mk('treeCenter', treeBuilding('center'), 7, 3, 3);
mk('treeHouse', treeBuilding('house'), 7, 3, 3);
mk('greenhouse', greenhouse(), 8, 3, 4);
mk('radioStation', radio(), 6, 3, 3);
export const BUILDINGS = B;
