import * as PIXI from 'pixi.js';

// Treinador provisório em pixel art (4 direções x 3 quadros), até chegar o sprite definitivo.
const C = { skin: '#f4c9a0', hair: '#2a1c14', cap: '#e5383b', brim: '#ffffff', shirt: '#2f6fe4', pants: '#2b2f45', shoe: '#e5383b', bag: '#f2c335' };

function draw(x, dir, step) {
  const p = (c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
  const leg = step === 1 ? 1 : step === 2 ? -1 : 0;
  // pernas
  p(C.pants, 5, 15, 3, 5 + Math.max(0, -leg)); p(C.pants, 9, 15, 3, 5 + Math.max(0, leg));
  p(C.shoe, 5, 20 + Math.max(0, -leg), 3, 2); p(C.shoe, 9, 20 + Math.max(0, leg), 3, 2);
  // corpo
  p(C.shirt, 4, 9, 9, 7); p(C.skin, 3, 10 + (leg > 0 ? 1 : 0), 1, 4); p(C.skin, 13, 10 + (leg < 0 ? 1 : 0), 1, 4);
  if (dir === 'up') p(C.bag, 5, 9, 7, 6);
  else if (dir !== 'down') p(C.bag, dir === 'left' ? 10 : 4, 9, 3, 6);
  // cabeça
  p(C.skin, 4, 3, 9, 7); p(C.hair, 4, 7, 9, 2);
  if (dir === 'up') p(C.hair, 4, 3, 9, 7);
  else {
    if (dir === 'down') { p('#222', 6, 6, 1, 2); p('#222', 10, 6, 1, 2); }
    if (dir === 'left') { p('#222', 5, 6, 1, 2); p(C.hair, 10, 3, 3, 6); }
    if (dir === 'right') { p('#222', 11, 6, 1, 2); p(C.hair, 4, 3, 3, 6); }
  }
  p(C.cap, 3, 1, 11, 3);
  if (dir === 'down') p(C.brim, 4, 4, 9, 1);
  if (dir === 'left') p(C.brim, 1, 3, 4, 1);
  if (dir === 'right') p(C.brim, 12, 3, 4, 1);
}

export function makeTrainerFrames() {
  const out = {};
  for (const dir of ['down', 'up', 'left', 'right']) {
    out[dir] = [0, 1, 0, 2].map((step) => {
      const c = document.createElement('canvas'); c.width = 17; c.height = 23;
      const x = c.getContext('2d'); draw(x, dir, step);
      const t = PIXI.Texture.from(c); t.source.scaleMode = 'nearest'; return t;
    });
  }
  return out;
}
export function dir4(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'; }
