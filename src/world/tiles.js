import * as PIXI from 'pixi.js';

// Blocos de 16 px desenhados por código (provisórios até a arte definitiva).
export const T = 16;
export const TILE = { GRASS: 0, GRASS2: 1, TALL: 2, PATH: 3, WATER: 4, SAND: 5, FLOWERS: 6, DEEP: 7, CLIFF: 8 };
export const SOLID = new Set([TILE.WATER, TILE.DEEP, TILE.CLIFF]);

function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; draw(x);
  const tex = PIXI.Texture.from(c); tex.source.scaleMode = 'nearest';
  return tex;
}
function rng(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
const px = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };

export function makeTiles() {
  const tx = {};
  const grass = (seed, base, dots) => canvas(T, T, (x) => {
    px(x, base, 0, 0, T, T); const r = rng(seed);
    for (let i = 0; i < 14; i++) px(x, dots[i % dots.length], Math.floor(r() * T), Math.floor(r() * T), 1, 2);
  });
  tx[TILE.GRASS] = grass(7, '#7cc56a', ['#6ab85a', '#8fd47a']);
  tx[TILE.GRASS2] = grass(19, '#78c066', ['#64b056', '#93d67e', '#6ab85a']);
  tx[TILE.TALL] = canvas(T, T, (x) => {
    px(x, '#5aa84e', 0, 0, T, T);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const bx = i * 4 + (j % 2) * 2, by = j * 8;
      px(x, '#3f8a3c', bx, by + 2, 1, 6); px(x, '#3f8a3c', bx + 2, by + 1, 1, 7); px(x, '#86d06c', bx + 1, by, 1, 7); px(x, '#2f6e30', bx, by + 7, 4, 1);
    }
  });
  tx[TILE.PATH] = canvas(T, T, (x) => { px(x, '#d9c08a', 0, 0, T, T); const r = rng(5); for (let i = 0; i < 10; i++) px(x, r() > 0.5 ? '#c8ad74' : '#e6d09e', Math.floor(r() * T), Math.floor(r() * T), 2, 1); });
  tx[TILE.SAND] = canvas(T, T, (x) => { px(x, '#ecdca2', 0, 0, T, T); const r = rng(9); for (let i = 0; i < 8; i++) px(x, '#d8c486', Math.floor(r() * T), Math.floor(r() * T)); });
  tx[TILE.FLOWERS] = canvas(T, T, (x) => {
    px(x, '#7cc56a', 0, 0, T, T); const cols = ['#ffffff', '#ffd84a', '#ff8fb0', '#a0c8ff'];
    [[3, 3], [11, 5], [6, 11], [13, 12]].forEach(([a, b], i) => { px(x, cols[i], a - 1, b, 3, 1); px(x, cols[i], a, b - 1, 1, 3); px(x, '#f2a03a', a, b); });
  });
  const water = (ph) => canvas(T, T, (x) => {
    px(x, '#4a9ae0', 0, 0, T, T); px(x, '#5aaaf0', 0, 0, T, 3);
    for (let i = 0; i < 3; i++) px(x, '#bfe4ff', ((i * 6 + ph * 3) % T), 5 + i * 4, 3, 1);
  });
  tx[TILE.WATER] = water(0); tx.water2 = water(1);
  tx[TILE.DEEP] = canvas(T, T, (x) => { px(x, '#3a7fc8', 0, 0, T, T); px(x, '#4a8cd4', 4, 6, 4, 1); px(x, '#4a8cd4', 10, 11, 3, 1); });
  tx[TILE.CLIFF] = canvas(T, T, (x) => { px(x, '#8a7a62', 0, 0, T, T); px(x, '#a8977a', 0, 0, T, 4); px(x, '#6e604c', 0, 10, T, 2); px(x, '#6e604c', 5, 4, 1, 6); px(x, '#6e604c', 11, 2, 1, 8); });
  // objetos
  tx.tree = canvas(32, 44, (x) => {
    px(x, 'rgba(0,0,0,.18)', 6, 38, 20, 5);
    px(x, '#6b4a2e', 13, 26, 6, 14); px(x, '#8a6440', 14, 26, 2, 14);
    const blob = (cx, cy, r, c) => { x.fillStyle = c; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); };
    blob(16, 17, 14, '#2f7a3a'); blob(10, 20, 9, '#2f7a3a'); blob(22, 20, 9, '#2f7a3a');
    blob(14, 13, 9, '#3f9a48'); blob(20, 15, 7, '#3f9a48'); blob(12, 10, 4, '#62b860'); blob(19, 9, 3, '#62b860');
  });
  tx.pine = canvas(28, 48, (x) => {
    px(x, 'rgba(0,0,0,.18)', 5, 42, 18, 5); px(x, '#5e4228', 12, 34, 4, 12);
    for (let i = 0; i < 4; i++) { const w = 22 - i * 4, y = 30 - i * 8; x.fillStyle = i % 2 ? '#2c6e3e' : '#24603a'; x.beginPath(); x.moveTo(14 - w / 2, y + 8); x.lineTo(14 + w / 2, y + 8); x.lineTo(14, y - 4); x.fill(); }
  });
  tx.bush = canvas(18, 16, (x) => { px(x, 'rgba(0,0,0,.18)', 2, 12, 14, 3); x.fillStyle = '#3c8c40'; x.beginPath(); x.arc(9, 9, 7, 0, 7); x.fill(); px(x, '#5cae56', 5, 5, 4, 2); px(x, '#5cae56', 10, 7, 3, 2); });
  tx.rock = canvas(18, 15, (x) => { px(x, 'rgba(0,0,0,.18)', 2, 11, 14, 3); x.fillStyle = '#8e8e96'; x.beginPath(); x.ellipse(9, 8, 8, 6, 0, 0, 7); x.fill(); px(x, '#b4b4bc', 5, 4, 5, 2); px(x, '#6e6e76', 9, 10, 6, 1); });
  tx.house = canvas(64, 60, (x) => {
    px(x, 'rgba(0,0,0,.2)', 4, 54, 58, 5);
    px(x, '#f2ead8', 6, 26, 52, 30); px(x, '#d8ccb2', 6, 50, 52, 6);
    x.fillStyle = '#c84a3c'; x.beginPath(); x.moveTo(0, 28); x.lineTo(32, 4); x.lineTo(64, 28); x.fill(); px(x, '#a43a30', 0, 26, 64, 4);
    px(x, '#7a5236', 27, 38, 10, 18); px(x, '#7ab8e8', 12, 34, 10, 8); px(x, '#7ab8e8', 42, 34, 10, 8);
  });
  tx.shadow = canvas(16, 8, (x) => { x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(8, 4, 7.5, 3.5, 0, 0, 7); x.fill(); });
  tx.dot = canvas(4, 4, (x) => { px(x, '#fff', 1, 0, 2, 4); px(x, '#fff', 0, 1, 4, 2); });
  tx.glow = canvas(16, 16, (x) => { const g = x.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 16, 16); });
  return tx;
}
