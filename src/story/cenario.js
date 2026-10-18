import { canvas, texOf, outline, SPR } from '../world/art.js';
import { KINDS, DECOR } from '../world/objects.js';
import { house, hall, px, ell, poly, text, window1, woodDoor, glassDoor } from '../world/buildings.js';

// Cenário dos capítulos 4 a 6 (Cidade Coral, Vila Lamparina, Cidade Aurora e a Mina): prédios e objetos desenhados
// por código no mesmo estilo de src/world/buildings.js, registrados no catálogo do mapa (objects.js) na carga
// do módulo, antes de o mapa ser montado. Usados em assets/maps/alvorada.json pelo nome (kind).

const B = (name, tex, fw, fh, door, extra = {}) => { SPR['bld_' + name] = tex.tex ?? tex; KINDS[name] = { tex: 'bld_' + name, fw, fh, oy: 3, door, lights: tex.lights, smoke: tex.smoke ?? null, estilo: tex.estilo ?? null, ...extra }; };
const O = (name, tex, fw, fh, extra = {}) => { SPR['obj_' + name] = tex; KINDS[name] = { tex: 'obj_' + name, fw, fh, oy: extra.oy ?? 0, ...extra }; };
const D = (name, tex) => { SPR['dec_' + name] = tex; DECOR[name] = 'dec_' + name; };
const art = (w, h, f, col) => texOf(outline(canvas(w, h, f), col));
// letreiros com letras que a fonte dos prédios não tem
const F2 = { F: '111100110100100', J: '001001001101010', V: '101101101101010', Ç: '011100100011010' };
const text2 = (x, s, X, Y, c) => [...s].forEach((ch, i) => { const f = F2[ch]; if (f) { for (let k = 0; k < 15; k++) if (f[k] === '1') px(x, c, X + i * 4 + (k % 3), Y + Math.floor(k / 3)); } else text(x, ch, X + i * 4, Y, c); });

// ---------------- casas por cidade ----------------
B('houseStone', house({ roof: ['#4a4a5a', '#363644', '#6a6a7e'], wall: ['#a8a49a', '#8a867c', '#c4c0b4'] }), 7, 3, 3);
B('houseStone2', house({ roof: ['#5a3a3a', '#422a2a', '#7a5252'], wall: ['#9a968c', '#7e7a70', '#b8b4a8'], chimney: true }), 7, 3, 3);
B('housePink', house({ roof: ['#2a9a9a', '#1e7a7a', '#5ac8c0'], wall: ['#f8d8d0', '#e4bcb2', '#fff0ea'], chimney: false }), 7, 3, 3);
B('houseYellow', house({ roof: ['#e0663a', '#b84e2a', '#ff9a6a'], wall: ['#f8e8a8', '#e4d08a', '#fffadc'], chimney: false }), 7, 3, 3);
B('houseMiner', house({ roof: ['#7a7e86', '#5e626a', '#9ea2aa'], wall: ['#e8dcc4', '#cfc2a8', '#f8f0dc'] }), 7, 3, 3);
B('houseGlass', house({ roof: ['#3a4a5a', '#2a3644', '#5a6e82'], wall: ['#e8f0f4', '#c8d4dc', '#ffffff'], door: 'glass', chimney: false }), 7, 3, 3);

// ---------------- prédios grandes ----------------
B('megaloja', hall({ w: 144, h: 112, roof: ['#f0c040', '#c89a28', '#ffe08a'], wall: ['#f8f8f4', '#d8d8d0', '#ffffff'], band: '#e0a020', door: 'double', wins: [14, 36, 92, 114],
  sign: (x, w, y0, rt) => { px(x, '#c89a28', w / 2 - 28, rt + 6, 56, 12); px(x, '#ffffff', w / 2 - 27, rt + 7, 54, 10); text(x, 'AURORA', w / 2 - 12, rt + 10, '#c89a28'); } }), 9, 3, 4);
B('redacao', hall({ w: 112, h: 104, roof: ['#3a4a6a', '#2a3450', '#5a6e98'], wall: ['#f4f0e6', '#d8d2c2', '#ffffff'], band: '#c8452f', door: 'glass', wins: [14, 82],
  sign: (x, w, y0, rt) => { px(x, '#c8452f', w / 2 - 18, rt + 6, 36, 11); text2(x, 'O FAROL', w / 2 - 14, rt + 9, '#ffffff'); } }), 7, 3, 3);
B('estacao', hall({ w: 144, h: 104, roof: ['#8a3a2a', '#6a2a1e', '#b85a42'], wall: ['#f2e6cc', '#d8c8a8', '#fff8e4'], band: '#3a5a8a', door: 'double', wins: [16, 40, 88, 112],
  sign: (x, w, y0, rt) => { px(x, '#3a5a8a', w / 2 - 20, rt + 6, 40, 11); text2(x, 'ESTAÇAO', w / 2 - 14, rt + 9, '#ffffff'); } }), 9, 3, 4);
B('hospital', hall({ w: 144, h: 112, roof: ['#e8eef2', '#c4ccd4', '#ffffff'], wall: ['#f8fafc', '#d8dde2', '#ffffff'], band: '#3aa0d8', door: 'double', wins: [14, 36, 92, 114],
  sign: (x, w, y0, rt) => { px(x, '#e8483a', w / 2 - 3, rt + 4, 6, 16); px(x, '#e8483a', w / 2 - 8, rt + 9, 16, 6); } }), 9, 3, 4);

// Farol Coral: torre listrada no alto do morro, holofote de luzita no topo
B('farol', (() => {
  const lights = [[32, 18, 2.2]];
  const c = canvas(64, 176, (x) => {
    const base = 173;
    ell(x, 32, base, 28, 3, 'rgba(0,0,0,.25)');
    // corpo cônico listrado
    for (let y = 40; y < base - 4; y++) {
      const k = (y - 40) / (base - 44), hw = 10 + k * 12, band = Math.floor((y - 40) / 18) % 2;
      px(x, band ? '#f4f0ea' : '#d8402e', Math.round(32 - hw), y, Math.round(hw * 2), 1);
      px(x, band ? '#c8c2b8' : '#a82e20', Math.round(32 + hw - 4), y, 4, 1);
      px(x, band ? '#ffffff' : '#f06a52', Math.round(32 - hw + 1), y, 2, 1);
    }
    px(x, '#8a8478', 6, base - 6, 52, 6); px(x, '#b4aea0', 6, base - 6, 52, 1);
    // galeria e lanterna
    px(x, '#3a3a44', 14, 36, 36, 5); px(x, '#5a5a66', 14, 36, 36, 1);
    for (let i = 15; i < 50; i += 4) px(x, '#3a3a44', i, 30, 1, 6);
    px(x, '#3a3a44', 14, 29, 36, 2);
    px(x, '#2a2a34', 20, 12, 24, 18); px(x, '#9afff4', 22, 14, 20, 14); px(x, '#e8fffc', 24, 15, 6, 6); px(x, '#2a2a34', 31, 12, 2, 18);
    poly(x, '#d8402e', [[16, 13], [32, 2], [48, 13]]); px(x, '#3a3a44', 31, 0, 2, 3);
    // janelinhas e porta
    for (const y of [64, 100, 132]) { px(x, '#3a3a44', 29, y, 6, 9); px(x, '#8fd0f8', 30, y + 1, 4, 7); }
    woodDoor(x, 22, base - 30, 20, 26, '#5a6a8a');
  });
  return { tex: texOf(outline(c)), lights };
})(), 4, 3, 2);

// Casarão das Velas: sobrado escuro com torreão, janelas com velas
B('casarao', (() => {
  const lights = [];
  const c = canvas(160, 150, (x) => {
    const base = 147, y0 = 70;
    ell(x, 80, base, 74, 3, 'rgba(0,0,0,.25)');
    px(x, '#4a4050', 8, y0, 144, base - y0); for (let y = y0 + 5; y < base - 6; y += 6) px(x, '#3a3242', 8, y, 144, 1);
    px(x, '#5e5466', 8, y0, 3, base - y0); px(x, '#2e2834', 149, y0, 3, base - y0);
    px(x, '#6a6070', 8, base - 6, 144, 6);
    // telhado de ardósia com águas-furtadas
    poly(x, '#2a2430', [[2, y0 + 2], [158, y0 + 2], [142, 30], [18, 30]]);
    for (let y = 34; y < y0; y += 6) px(x, '#3a3242', 18 - (y - 30) * 0.4, y, 124 + (y - 30) * 0.8, 1);
    // torreão
    px(x, '#4a4050', 64, 18, 32, 54); poly(x, '#2a2430', [[60, 20], [80, 0], [100, 20]]); px(x, '#c8b04a', 79, 0, 2, 4);
    window1(x, 72, 30, 16, 16, '#2a2430', true); lights.push([80, 38]);
    // janelas com velas
    for (const wx of [20, 44, 100, 124]) { window1(x, wx, y0 + 14, 16, 18, '#2a2430', true); lights.push([wx + 8, y0 + 23]); px(x, '#f4ead2', wx + 7, y0 + 24, 2, 6); }
    for (const wx of [20, 124]) { window1(x, wx, y0 + 46, 16, 16, '#2a2430', false); }
    // porta dupla em arco
    const dx = 66, dw = 28, dh = 34, dy = base - dh;
    px(x, '#1e1a22', dx - 3, dy - 3, dw + 6, dh + 3); x.fillStyle = '#1e1a22'; x.beginPath(); x.arc(dx + dw / 2, dy, dw / 2 + 3, Math.PI, 0); x.fill();
    px(x, '#5a2a2a', dx, dy, dw, dh); x.fillStyle = '#5a2a2a'; x.beginPath(); x.arc(dx + dw / 2, dy, dw / 2, Math.PI, 0); x.fill();
    px(x, '#3a1a1a', dx + dw / 2 - 1, dy - 12, 2, dh + 12); px(x, '#c8b04a', dx + dw / 2 - 5, dy + 16, 2, 2); px(x, '#c8b04a', dx + dw / 2 + 3, dy + 16, 2, 2);
    // lampiões da entrada
    for (const lx of [56, 102]) { px(x, '#2a2430', lx, base - 30, 3, 10); px(x, '#ffd27a', lx - 1, base - 36, 5, 6); lights.push([lx + 1, base - 33]); }
  });
  return { tex: texOf(outline(c)), lights };
})(), 10, 3, 5);

// Torre Aurora: prédio branco que termina numa ponta de cristal
B('torre', (() => {
  const lights = [[64, 16, 2.6]];
  const c = canvas(128, 230, (x) => {
    const base = 227;
    ell(x, 64, base, 60, 4, 'rgba(0,0,0,.25)');
    px(x, '#f4f6f8', 24, 60, 80, base - 60); px(x, '#d8dde2', 92, 60, 12, base - 60); px(x, '#ffffff', 24, 60, 3, base - 60);
    for (let y = 70; y < base - 40; y += 14) for (let i = 30; i < 98; i += 12) { px(x, '#7aa8c8', i, y, 8, 9); px(x, '#c8e4f8', i, y, 3, 4); }
    px(x, '#e0b030', 24, base - 44, 80, 4); px(x, '#f2cc5a', 24, base - 44, 80, 1);
    px(x, '#8a8478', 20, base - 6, 88, 6);
    // base larga com marquise
    px(x, '#e8ecf0', 8, base - 40, 112, 34); px(x, '#ffffff', 8, base - 40, 112, 3);
    for (const wx of [14, 34, 82, 102]) { px(x, '#5a6470', wx - 1, base - 31, 14, 18); px(x, '#9ad4f8', wx, base - 30, 12, 16); }
    glassDoor(x, 52, base - 32, 24, 28); px(x, '#e0b030', 46, base - 38, 36, 4);
    // ponta de cristal
    x.fillStyle = '#5ae8e0'; x.beginPath(); x.moveTo(64, 0); x.lineTo(92, 46); x.lineTo(64, 62); x.lineTo(36, 46); x.fill();
    x.fillStyle = '#3ab0c8'; x.beginPath(); x.moveTo(64, 0); x.lineTo(92, 46); x.lineTo(64, 62); x.fill();
    x.fillStyle = '#d8fffa'; x.beginPath(); x.moveTo(60, 12); x.lineTo(52, 40); x.lineTo(58, 42); x.fill();
    px(x, '#e0b030', 30, 56, 68, 5);
    // logo: sol nascendo de um cristal
    ell(x, 64, base - 52, 7, 7, '#f2cc5a'); px(x, '#5ae8e0', 61, base - 52, 6, 8);
  });
  return { tex: texOf(outline(c)), lights };
})(), 8, 3, 4);

// prédio de vidro (sem porta: só cenário) e casa de máquinas do farol
B('vidro', (() => {
  const lights = [];
  const c = canvas(96, 150, (x) => {
    const base = 147;
    ell(x, 48, base, 44, 3, 'rgba(0,0,0,.22)');
    px(x, '#5a7a94', 8, 10, 80, base - 10); px(x, '#3a5670', 76, 10, 12, base - 10);
    for (let y = 14; y < base - 10; y += 10) for (let i = 12; i < 76; i += 10) { px(x, '#9ad4f8', i, y, 8, 7); if ((i * y) % 7 < 3) { px(x, '#ffe39a', i, y, 8, 7); lights.push([i + 4, y + 3]); } }
    px(x, '#2a3a4a', 8, 8, 80, 3); px(x, '#8a8478', 8, base - 6, 80, 6);
  });
  return { tex: texOf(outline(c)), lights: lights.slice(0, 8) };
})(), 6, 3, undefined);
B('casaMaquinas', (() => {
  const c = canvas(64, 64, (x) => {
    const base = 61;
    ell(x, 32, base, 28, 3, 'rgba(0,0,0,.22)');
    px(x, '#a8aab0', 6, 22, 52, base - 22); px(x, '#c8cad0', 6, 22, 52, 2); px(x, '#7a7c84', 6, base - 4, 52, 4);
    px(x, '#5a5c64', 4, 16, 56, 7); px(x, '#7a7c84', 4, 16, 56, 2);
    woodDoor(x, 22, base - 26, 20, 24, '#6a7a8a'); px(x, '#f2c94c', 46, 30, 8, 8); px(x, '#2a2a2a', 49, 31, 2, 5);
  });
  return { tex: texOf(outline(c)), lights: [] };
})(), 4, 2, undefined);
B('capela', house({ w: 96, roof: ['#3a3242', '#2a2430', '#5a5066'], wall: ['#d8d0c4', '#bcb4a8', '#f0e8dc'], chimney: false }), 6, 3, 3);

// ---------------- objetos pequenos ----------------
// poste de luzita (Companhia Aurora): luz azul-esverdeada, forte demais
O('posteLuzita', art(10, 32, (x) => {
  ell(x, 5, 30, 4, 1.5, 'rgba(0,0,0,.2)');
  px(x, '#e8e4dc', 4, 8, 2, 22); px(x, '#c8c2b8', 5, 8, 1, 22); px(x, '#e0b030', 2, 27, 6, 3);
  x.fillStyle = '#5ae8e0'; x.beginPath(); x.moveTo(5, 0); x.lineTo(9, 5); x.lineTo(5, 10); x.lineTo(1, 5); x.fill(); px(x, '#e8fffc', 4, 2, 1, 4);
}), 1, 1, { lights: [[5, 5, 1.5]] });
// lampião a óleo (Lamparina)
O('lampiao', art(10, 28, (x) => {
  ell(x, 5, 26, 4, 1.5, 'rgba(0,0,0,.2)');
  px(x, '#2a2420', 4, 9, 2, 17); px(x, '#2a2420', 2, 24, 6, 2); px(x, '#2a2420', 2, 2, 6, 2); px(x, '#2a2420', 1, 9, 8, 1);
  px(x, '#ffb84a', 2, 4, 6, 5); px(x, '#fff0b0', 4, 5, 2, 3); px(x, '#2a2420', 4, 0, 2, 2);
}), 1, 1, { lights: [[5, 6, 1.2]] });
O('lapide', art(16, 20, (x) => {
  ell(x, 8, 18, 7, 2, 'rgba(0,0,0,.22)');
  px(x, '#8a8a96', 3, 5, 10, 13); ell(x, 8, 6, 5, 4, '#8a8a96'); px(x, '#a8a8b4', 4, 4, 3, 12); px(x, '#6a6a76', 11, 6, 2, 12);
  px(x, '#5a5a66', 6, 8, 4, 1); px(x, '#5a5a66', 6, 10, 4, 1); px(x, '#5a5a66', 7, 12, 2, 1); px(x, '#5ab45a', 3, 16, 3, 2);
}), 1, 1);
O('lapideVela', art(16, 22, (x) => {
  ell(x, 8, 20, 7, 2, 'rgba(0,0,0,.22)');
  px(x, '#7a7a86', 3, 7, 10, 13); px(x, '#9a9aa6', 4, 6, 3, 12); px(x, '#5a5a66', 3, 6, 10, 1);
  px(x, '#5a5a66', 7, 9, 2, 6); px(x, '#5a5a66', 5, 11, 6, 2);
  px(x, '#f4ead2', 12, 2, 2, 5); px(x, '#ffb84a', 12, 0, 2, 2);
}), 1, 1, { lights: [[13, 1, 0.6]] });
O('velas', art(16, 14, (x) => {
  ell(x, 8, 12, 7, 2, 'rgba(0,0,0,.2)');
  for (const [a, h] of [[3, 7], [7, 9], [11, 6]]) { px(x, '#f4ead2', a, 12 - h, 2, h); px(x, '#ffb84a', a, 10 - h, 2, 2); px(x, '#fff0b0', a, 10 - h, 1, 1); }
}), 1, 1, { lights: [[8, 3, 0.7]] });
O('arvoreSeca', art(32, 48, (x) => {
  ell(x, 16, 45, 10, 3, 'rgba(0,0,0,.22)');
  x.strokeStyle = '#4a3a2e'; x.lineCap = 'round';
  const br = (x0, y0, a, l, w) => { if (l < 4) return; const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); br(x1, y1, a - 0.5, l * 0.68, Math.max(1, w - 1)); br(x1, y1, a + 0.45, l * 0.62, Math.max(1, w - 1)); };
  br(16, 45, -Math.PI / 2, 16, 4);
  px(x, '#6a5a4a', 15, 30, 1, 14);
}), 2, 1, { oy: 4 });
O('barraca', art(48, 40, (x) => {
  ell(x, 24, 37, 20, 3, 'rgba(0,0,0,.2)');
  px(x, '#a8744a', 6, 22, 36, 14); px(x, '#c7925c', 6, 22, 36, 3); px(x, '#6b4428', 8, 14, 2, 22); px(x, '#6b4428', 38, 14, 2, 22);
  for (let i = 0; i < 6; i++) poly(x, i % 2 ? '#ffffff' : '#e8584a', [[2 + i * 7.3, 14], [9.3 + i * 7.3, 14], [24, 2]]);
  ell(x, 14, 20, 3, 3, '#7ac04a'); ell(x, 22, 20, 3, 3, '#f2c94c'); ell(x, 30, 20, 3, 3, '#7ac04a');
}), 3, 1);
O('guardaSol', art(24, 34, (x) => {
  ell(x, 12, 32, 9, 2, 'rgba(0,0,0,.2)'); px(x, '#e8e4dc', 11, 8, 2, 24);
  for (let i = 0; i < 4; i++) poly(x, i % 2 ? '#f2c94c' : '#3a8ad8', [[1 + i * 5.5, 10], [6.5 + i * 5.5, 10], [12, 0]]);
}), 1, 1);
O('palco', art(96, 44, (x) => {
  ell(x, 48, 42, 46, 3, 'rgba(0,0,0,.22)');
  px(x, '#7a5233', 2, 26, 92, 16); px(x, '#a8744a', 2, 26, 92, 4); for (let i = 6; i < 92; i += 10) px(x, '#5a3a22', i, 30, 1, 12);
  px(x, '#e8e4dc', 4, 2, 2, 26); px(x, '#e8e4dc', 90, 2, 2, 26);
  px(x, '#f4f4f0', 14, 4, 68, 16); px(x, '#e0b030', 14, 4, 68, 3); px(x, '#e0b030', 14, 17, 68, 3);
  ell(x, 48, 12, 4, 4, '#f2cc5a'); px(x, '#5ae8e0', 46, 12, 4, 5); text(x, 'AURORA', 56, 9, '#c89a28');
  for (let i = 0; i < 12; i++) poly(x, ['#e8584a', '#f2c94c', '#3a8ad8', '#5ab45a'][i % 4], [[6 + i * 7, 22], [12 + i * 7, 22], [9 + i * 7, 26]]);
}), 6, 2, { solidCells: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]] });
O('torreTx', art(32, 84, (x) => {
  ell(x, 16, 82, 13, 2, 'rgba(0,0,0,.2)');
  x.strokeStyle = '#7a7e86'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(4, 82); x.lineTo(14, 6); x.moveTo(28, 82); x.lineTo(18, 6); x.stroke();
  x.lineWidth = 1; for (let y = 14; y < 80; y += 10) { const k = (y - 6) / 76, l = 14 - k * 10, r = 18 + k * 10; x.beginPath(); x.moveTo(l, y); x.lineTo(r, y + 10); x.moveTo(r, y); x.lineTo(l, y + 10); x.stroke(); }
  px(x, '#5a5e66', 0, 12, 32, 2); px(x, '#5a5e66', 4, 24, 24, 2); px(x, '#9afff4', 0, 14, 2, 3); px(x, '#9afff4', 30, 14, 2, 3);
}), 2, 1);
O('outdoor', art(64, 52, (x) => {
  ell(x, 32, 50, 28, 2, 'rgba(0,0,0,.2)');
  px(x, '#5a5e66', 14, 30, 3, 20); px(x, '#5a5e66', 46, 30, 3, 20);
  px(x, '#2a3040', 0, 0, 64, 32); px(x, '#f4f0e0', 2, 2, 60, 28);
  ell(x, 14, 16, 8, 8, '#f2cc5a'); px(x, '#5ae8e0', 11, 14, 6, 10);
  text(x, 'AURORA', 26, 8, '#c89a28'); px(x, '#5ae8e0', 26, 16, 32, 2); px(x, '#9a9488', 26, 21, 26, 2);
}), 4, 1, { lights: [[32, 16, 1.4]] });
O('carrinho', art(16, 18, (x) => {
  ell(x, 8, 16, 7, 2, 'rgba(0,0,0,.25)');
  px(x, '#6a5a4a', 1, 5, 14, 9); px(x, '#8a7a6a', 1, 5, 14, 2); px(x, '#4a3a2e', 1, 12, 14, 2);
  ell(x, 4, 15, 2, 2, '#2a2a2a'); ell(x, 12, 15, 2, 2, '#2a2a2a');
  px(x, '#5ae8e0', 3, 2, 4, 4); px(x, '#3ab0c8', 8, 3, 4, 3);
}), 1, 1, { push: true });
KINDS.carrinhoParado = { ...KINDS.carrinho, push: false };
O('vigaCaida', art(48, 24, (x) => {
  ell(x, 24, 21, 22, 3, 'rgba(0,0,0,.25)');
  x.save(); x.translate(24, 14); x.rotate(-0.18); px(x, '#7a5233', -22, -4, 44, 8); px(x, '#a8744a', -22, -4, 44, 2); px(x, '#5a3a22', -10, -4, 1, 8); px(x, '#5a3a22', 8, -4, 1, 8); x.restore();
  ell(x, 8, 20, 5, 3, '#6a6670'); ell(x, 38, 19, 6, 3, '#7a7680');
}), 3, 1);
O('pedregulho', art(32, 26, (x) => {
  ell(x, 16, 23, 14, 3, 'rgba(0,0,0,.25)');
  ell(x, 16, 14, 14, 10, '#6a6670'); ell(x, 13, 11, 9, 6, '#8a8690'); ell(x, 22, 17, 6, 4, '#5a5660'); px(x, '#a8a4ae', 9, 8, 4, 2);
}), 2, 1);
O('maquete', art(48, 26, (x) => {
  ell(x, 24, 24, 22, 2, 'rgba(0,0,0,.2)');
  px(x, '#8a6a4a', 2, 12, 44, 12); px(x, '#a8744a', 2, 12, 44, 2);
  px(x, '#7a8a6a', 4, 6, 40, 8); poly(x, '#8a8478', [[6, 10], [16, 2], [26, 10]]); poly(x, '#9a948a', [[20, 10], [32, 0], [42, 10]]);
  px(x, '#5ae8e0', 30, 8, 3, 3); px(x, '#5ae8e0', 14, 9, 2, 2); px(x, '#e0b030', 8, 12, 30, 1);
}), 3, 1);
O('painel', art(48, 28, (x) => {
  px(x, '#3a4048', 0, 6, 48, 22); px(x, '#5a626c', 0, 6, 48, 2);
  for (let i = 0; i < 3; i++) { px(x, '#1a2a3a', 3 + i * 15, 9, 13, 9); px(x, '#5ae8e0', 4 + i * 15, 10 + i, 11, 1); px(x, '#f2c94c', 4 + i * 15, 14, 7 - i, 2); px(x, '#e8584a', 12 + i * 15, 12, 2, 4); }
  for (let i = 0; i < 8; i++) px(x, ['#e8584a', '#5ab45a', '#f2c94c'][i % 3], 4 + i * 5, 22, 2, 2);
}), 3, 1, { lights: [[24, 13, 0.9]] });
O('elevador', art(32, 36, (x) => {
  px(x, '#8a9aa8', 0, 0, 32, 36); px(x, '#c8d4dc', 2, 6, 13, 30); px(x, '#c8d4dc', 17, 6, 13, 30); px(x, '#5a6a78', 15, 6, 2, 30);
  px(x, '#2a3a4a', 10, 1, 12, 4); px(x, '#f2c94c', 12, 2, 2, 2); px(x, '#5ae8e0', 18, 2, 2, 2);
}), 2, 1);
O('quadro', art(16, 16, (x) => { px(x, '#8a6a2a', 1, 1, 14, 13); px(x, '#c8a04a', 2, 2, 12, 11); px(x, '#3a3242', 3, 3, 10, 9); ell(x, 8, 7, 3, 3, '#c8a888'); px(x, '#5a3a4a', 5, 10, 6, 2); }), 1, 1);
O('quadroBenta', art(16, 16, (x) => { px(x, '#8a6a2a', 1, 1, 14, 13); px(x, '#e8c86a', 2, 2, 12, 11); px(x, '#f4e8d0', 3, 3, 10, 9); ell(x, 8, 7, 3, 3, '#f0c8a0'); px(x, '#b9b4ae', 5, 3, 6, 2); px(x, '#c84a3c', 7, 8, 3, 1); px(x, '#c84a3c', 6, 7, 1, 1); px(x, '#c84a3c', 10, 7, 1, 1); px(x, '#5a8a4a', 5, 10, 6, 2); }), 1, 1);
O('garra', (() => {
  const t = texOf(outline(canvas(112, 72, (x) => {
    ell(x, 56, 68, 52, 4, 'rgba(0,0,0,.3)');
    const claw = (x0, s) => { x.fillStyle = '#3a2a5a'; x.beginPath(); x.moveTo(x0, 70); x.quadraticCurveTo(x0 + 6 * s, 20, x0 + 30 * s, 4); x.quadraticCurveTo(x0 + 16 * s, 30, x0 + 18 * s, 70); x.fill(); x.fillStyle = '#6a4aa8'; x.beginPath(); x.moveTo(x0 + 4 * s, 66); x.quadraticCurveTo(x0 + 8 * s, 26, x0 + 26 * s, 8); x.quadraticCurveTo(x0 + 12 * s, 32, x0 + 10 * s, 66); x.fill(); };
    claw(10, 1); claw(44, 1); claw(78, 1);
    px(x, '#2a1e44', 0, 60, 112, 10); for (let i = 4; i < 108; i += 9) px(x, '#9afff4', i, 62 + (i % 3), 3, 2);
  }), [16, 8, 30])); return t;
})(), 7, 1, { lights: [[20, 30, 1.6], [56, 26, 1.6], [90, 30, 1.6]], tint: 0xb89aff });
O('cristal', art(20, 26, (x) => {
  ell(x, 10, 24, 8, 2, 'rgba(0,0,0,.25)');
  x.fillStyle = '#5ae8e0'; x.beginPath(); x.moveTo(10, 0); x.lineTo(16, 12); x.lineTo(10, 24); x.lineTo(4, 12); x.fill();
  x.fillStyle = '#3ab0c8'; x.beginPath(); x.moveTo(16, 12); x.lineTo(10, 24); x.lineTo(10, 4); x.fill();
  x.fillStyle = '#4ad0d8'; x.beginPath(); x.moveTo(3, 14); x.lineTo(6, 24); x.lineTo(0, 24); x.fill(); x.beginPath(); x.moveTo(17, 15); x.lineTo(20, 24); x.lineTo(14, 24); x.fill();
  px(x, '#e8fffc', 8, 5, 1, 7);
}, [20, 60, 70]), 1, 1, { lights: [[10, 10, 1.1]] });
O('estante', art(16, 28, (x) => { px(x, '#6b4428', 0, 0, 16, 28); for (let y = 3; y < 26; y += 8) { px(x, '#8a5a34', 1, y + 5, 14, 2); for (let i = 1; i < 15; i += 3) px(x, ['#c84a3c', '#3a6ad8', '#e0b030', '#5ab45a'][(i + y) % 4], i, y, 2, 5); } }), 1, 1);
O('fogao', art(32, 26, (x) => { px(x, '#8a5a34', 0, 8, 32, 18); px(x, '#5a3a22', 0, 8, 32, 2); px(x, '#2a2420', 4, 12, 10, 8); px(x, '#ffb84a', 6, 15, 6, 4); px(x, '#3a3a3a', 18, 4, 10, 6); px(x, '#5a5a5a', 18, 4, 10, 2); px(x, '#6a6a6a', 24, 0, 3, 6); }), 2, 1, { lights: [[9, 17, 0.8]] });
O('poleiro', art(16, 30, (x) => { px(x, '#6b4428', 7, 8, 2, 20); px(x, '#6b4428', 3, 26, 10, 2); px(x, '#6b4428', 2, 8, 12, 2); }), 1, 1);
O('placaAurora', art(16, 20, (x) => {
  ell(x, 8, 18, 5, 1.5, 'rgba(0,0,0,.2)'); px(x, '#c8c2b8', 7, 10, 2, 8);
  px(x, '#f4f4f0', 1, 1, 14, 10); px(x, '#e0b030', 1, 1, 14, 2); ell(x, 5, 7, 2, 2, '#f2cc5a'); px(x, '#5a5e66', 9, 5, 4, 1); px(x, '#5a5e66', 9, 7, 4, 1);
}), 1, 1);
O('conePlast', art(12, 14, (x) => { ell(x, 6, 12, 5, 1.5, 'rgba(0,0,0,.2)'); poly(x, '#f2782e', [[1, 12], [6, 0], [11, 12]]); px(x, '#ffffff', 3, 5, 6, 2); px(x, '#3a3a3a', 0, 12, 12, 2); }), 1, 1);
O('cavalete', art(32, 18, (x) => { px(x, '#3a3a3a', 3, 8, 2, 10); px(x, '#3a3a3a', 27, 8, 2, 10); for (let i = 0; i < 8; i++) px(x, i % 2 ? '#ffffff' : '#e8584a', i * 4, 3, 4, 6); }), 2, 1);
O('gerador', art(16, 22, (x) => { px(x, '#5a626c', 1, 6, 14, 15); px(x, '#7a828c', 1, 6, 14, 2); px(x, '#2a3040', 4, 10, 8, 6); px(x, '#f2c94c', 7, 0, 2, 7); }), 1, 1);

// ---------------- decoração plana ----------------
D('trilho', texOf(canvas(16, 16, (x) => { for (const y of [2, 7, 12]) px(x, '#6b4428', 0, y, 16, 3); px(x, '#9aa0a8', 3, 0, 2, 16); px(x, '#9aa0a8', 11, 0, 2, 16); px(x, '#c8ccd2', 3, 0, 1, 16); px(x, '#c8ccd2', 11, 0, 1, 16); })));
D('trilhoH', texOf(canvas(16, 16, (x) => { for (const xx of [2, 7, 12]) px(x, '#6b4428', xx, 0, 3, 16); px(x, '#9aa0a8', 0, 3, 16, 2); px(x, '#9aa0a8', 0, 11, 16, 2); px(x, '#c8ccd2', 0, 3, 16, 1); px(x, '#c8ccd2', 0, 11, 16, 1); })));
D('ondas', texOf(canvas(16, 16, (x) => { px(x, '#2a2a30', 0, 0, 16, 16); x.strokeStyle = '#f4f0ea'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 8); x.quadraticCurveTo(4, 2, 8, 8); x.quadraticCurveTo(12, 14, 16, 8); x.stroke(); })));
D('tapeteRoxo', texOf(canvas(32, 16, (x) => { px(x, '#4a2a5a', 0, 0, 32, 16); px(x, '#8a6aa8', 2, 2, 28, 12); px(x, '#4a2a5a', 4, 4, 24, 8); })));
D('luzChao', texOf(canvas(16, 16, (x) => { px(x, 'rgba(154,255,244,0.35)', 0, 0, 16, 16); px(x, 'rgba(232,255,252,0.6)', 3, 7, 10, 2); })));
D('folhas', texOf(canvas(16, 16, (x) => { for (let i = 0; i < 6; i++) px(x, ['#8a6a3a', '#a8743a', '#6a5a2a'][i % 3], (i * 5) % 14, (i * 7) % 14, 2, 2); })));
D('poeira', texOf(canvas(16, 16, (x) => { for (let i = 0; i < 5; i++) px(x, 'rgba(224,176,48,0.6)', (i * 7 + 2) % 15, (i * 5 + 3) % 15, 1, 1); })));
