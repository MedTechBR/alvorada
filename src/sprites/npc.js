import * as PIXI from 'pixi.js';

// Personagens da história em pixel art (mesmo formato do treinador: 17x23, 4 direções x 4 quadros).
// Cada visual é uma paleta + alguns detalhes (boné, chapéu de palha, cabelo comprido, jaleco, avental).
export const LOOKS = {
  prof:     { skin: '#f0c49a', hair: '#9a9aa2', shirt: '#f4f4f0', pants: '#5a4a3a', shoe: '#3a2a20', coat: '#ffffff', hairStyle: 'short' },
  mom:      { skin: '#f4c9a0', hair: '#7a3b22', shirt: '#e86a8a', pants: '#e86a8a', shoe: '#7a3b22', apron: '#fff4d8', hairStyle: 'long', dress: true },
  rival:    { skin: '#eebd90', hair: '#8a5a2a', shirt: '#3aa35a', pants: '#2b2f45', shoe: '#222222', hairStyle: 'spiky' },
  youngster:{ skin: '#f4c9a0', hair: '#2a1c14', shirt: '#f2c335', pants: '#3a64c8', shoe: '#ffffff', cap: '#3a64c8', brim: '#3a64c8', shorts: true },
  bugcatcher:{ skin: '#f0c49a', hair: '#3a2a14', shirt: '#7fbf4f', pants: '#c9a46a', shoe: '#5a3a1a', strawHat: true, shorts: true },
  leader:   { skin: '#d9a070', hair: '#3a2a14', shirt: '#c8452f', pants: '#3a5a9a', shoe: '#5a3a1a', strawHat: true, overalls: '#3a5a9a', big: true },
  nurse:    { skin: '#f6d0b0', hair: '#f08ab0', shirt: '#ffffff', pants: '#ffffff', shoe: '#f08ab0', hairStyle: 'long', dress: true, nurseCap: true },
  hiker:    { skin: '#d9a070', hair: '#3a2a14', shirt: '#a0703a', pants: '#5a4a3a', shoe: '#3a2a20', cap: '#2a7a3a', brim: '#2a7a3a' },
};

function draw(x, L, dir, step) {
  const p = (c, X, Y, w = 1, h = 1) => { if (!c) return; x.fillStyle = c; x.fillRect(X, Y, w, h); };
  const leg = step === 1 ? 1 : step === 2 ? -1 : 0;
  // pernas (vestido cobre a parte de cima das pernas)
  if (L.dress) {
    p(L.skin, 6, 17, 2, 4 + Math.max(0, -leg)); p(L.skin, 9, 17, 2, 4 + Math.max(0, leg));
  } else if (L.skirt) {
    p(L.skin, 5, 17, 3, 3 + Math.max(0, -leg)); p(L.skin, 9, 17, 3, 3 + Math.max(0, leg));
    p(L.pants, 4, 15, 9, 3);
  } else {
    p(L.shorts ? L.pants : L.pants, 5, 15, 3, L.shorts ? 3 : 5 + Math.max(0, -leg)); p(L.pants, 9, 15, 3, L.shorts ? 3 : 5 + Math.max(0, leg));
    if (L.shorts) { p(L.skin, 5, 18, 3, 2 + Math.max(0, -leg)); p(L.skin, 9, 18, 3, 2 + Math.max(0, leg)); }
  }
  p(L.shoe, 5, 20 + Math.max(0, -leg), 3, 2); p(L.shoe, 9, 20 + Math.max(0, leg), 3, 2);
  // corpo
  p(L.shirt, 4, 9, 9, 7);
  if (L.dress) p(L.shirt, 3, 13, 11, 5);
  if (L.coat) { p(L.coat, 3, 9, 11, 9); if (dir === 'down') { p(L.shirt === L.coat ? '#cfd8e8' : '#7a9ad0', 7, 10, 3, 6); p('#d0d4dc', 8, 10, 1, 8); } }
  if (L.apron && dir !== 'up') p(L.apron, 5, 11, 7, 6);
  if (L.overalls) { p(L.overalls, 5, 12, 7, 4); if (dir === 'down') { p(L.overalls, 5, 9, 1, 3); p(L.overalls, 11, 9, 1, 3); } }
  p(L.skin, 3, 10 + (leg > 0 ? 1 : 0), 1, 4); p(L.skin, 13, 10 + (leg < 0 ? 1 : 0), 1, 4);
  // cabeça
  p(L.skin, 4, 3, 9, 7);
  if (dir === 'up') p(L.hair, 4, 2, 9, 8);
  else {
    p(L.hair, 4, 2, 9, 2);
    if (dir === 'down') { p('#222', 6, 6, 1, 2); p('#222', 10, 6, 1, 2); p(L.hair, 4, 3, 1, 3); p(L.hair, 12, 3, 1, 3); }
    if (dir === 'left') { p('#222', 5, 6, 1, 2); p(L.hair, 9, 3, 4, 5); }
    if (dir === 'right') { p('#222', 11, 6, 1, 2); p(L.hair, 4, 3, 4, 5); }
  }
  if (L.hairStyle === 'long') { p(L.hair, 3, 4, 1, 8); p(L.hair, 13, 4, 1, 8); if (dir === 'up') p(L.hair, 4, 9, 9, 3); }
  if (L.hairStyle === 'ponytail') { if (dir === 'up') p(L.hair, 7, 9, 3, 4); else if (dir === 'left') p(L.hair, 12, 4, 2, 6); else if (dir === 'right') p(L.hair, 3, 4, 2, 6); else { p(L.hair, 2, 4, 2, 4); p(L.hair, 13, 4, 2, 4); } }
  if (L.hairStyle === 'spiky') { p(L.hair, 3, 1, 2, 2); p(L.hair, 7, 0, 3, 2); p(L.hair, 12, 1, 2, 2); }
  if (L.hairStyle === 'short' && dir !== 'up') { p(L.hair, 4, 2, 9, 1); }
  // chapéus
  if (L.cap) {
    p(L.cap, 3, 1, 11, 3);
    if (dir === 'down') p(L.brim, 4, 4, 9, 1);
    if (dir === 'left') p(L.brim, 1, 3, 4, 1);
    if (dir === 'right') p(L.brim, 12, 3, 4, 1);
  }
  if (L.strawHat) { p('#e8c860', 1, 2, 15, 2); p('#e8c860', 4, 0, 9, 2); p('#b8902a', 4, 2, 9, 1); }
  if (L.nurseCap) { p('#ffffff', 5, 0, 7, 2); p('#e5383b', 8, 0, 1, 2); }
}

const cache = new Map();
export function makeNpcFrames(look) {
  if (cache.has(look)) return cache.get(look);
  const L = LOOKS[look] ?? LOOKS.youngster;
  const out = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    out[dir] = [0, 1, 0, 2].map((step) => {
      const c = document.createElement('canvas'); c.width = 17; c.height = 23;
      const x = c.getContext('2d'); draw(x, L, dir, step);
      const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest'; return t;
    });
  }
  out.big = !!L.big;
  cache.set(look, out);
  return out;
}

// Mesa com as três Poké Bolas do laboratório
export function makeStarterTable() {
  const c = document.createElement('canvas'); c.width = 40; c.height = 18;
  const x = c.getContext('2d');
  const p = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  p('#5a3a1a', 2, 8, 36, 2); p('#a0703a', 1, 5, 38, 4); p('#c8904a', 1, 5, 38, 1);
  p('#5a3a1a', 3, 10, 2, 7); p('#5a3a1a', 35, 10, 2, 7);
  const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest';
  return t;
}
export function makeBallTexture() {
  const c = document.createElement('canvas'); c.width = 7; c.height = 7;
  const x = c.getContext('2d');
  const p = (col, X, Y, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
  p('#222', 1, 0, 5, 7); p('#222', 0, 1, 7, 5);
  p('#e5383b', 1, 1, 5, 2); p('#ffffff', 1, 4, 5, 2); p('#222', 1, 3, 5, 1); p('#ffffff', 3, 3, 1, 1); p('#ffb0b0', 2, 1, 1, 1);
  const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest';
  return t;
}

// Visual do jogador (criador de personagem). Se o ramo `sprites` entregar src/sprites/characters.js,
// o UI usa a função dele; esta é a versão provisória, recolorindo o mesmo desenho dos personagens.
export const DEFAULT_LOOK = { gender: 'm', skin: '#f4c9a0', hair: '#2a1c14', hairStyle: 'short', shirt: '#2f6fe4', pants: '#2b2f45', cap: '#e5383b', name: 'Ravi' };
export function lookToPalette(look = {}) {
  const l = { ...DEFAULT_LOOK, ...look };
  return { skin: l.skin, hair: l.hair, hairStyle: l.hairStyle, shirt: l.shirt, pants: l.pants, shoe: '#e5383b',
    cap: l.cap && l.cap !== 'none' ? l.cap : null, brim: '#ffffff', skirt: l.gender === 'f' && l.hairStyle !== 'spiky', shorts: false };
}
export function makePlayerFrames(look) {
  const L = lookToPalette(look);
  const out = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    out[dir] = [0, 1, 0, 2].map((step) => {
      const c = document.createElement('canvas'); c.width = 17; c.height = 23;
      draw(c.getContext('2d'), L, dir, step);
      const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest'; return t;
    });
  }
  return out;
}
// Desenha um quadro num canvas 2D qualquer (prévia do criador de personagem, sem PixiJS)
export function drawPlayerFrame(ctx, look, dir, step) { draw(ctx, lookToPalette(look), dir, step); }
