import * as PIXI from 'pixi.js';
import { SPR, canvas, texOf } from './art.js';

// Tipos de bloco (16 px). Os números de 0 a 8 são os mesmos da versão anterior (o combate usa TILE.*).
export const T = 16;
export const TILE = {
  GRASS: 0, GRASS2: 1, TALL: 2, PATH: 3, WATER: 4, SAND: 5, FLOWERS: 6, DEEP: 7, CLIFF: 8,
  VOID: 9, STAIRS: 10, BRIDGE: 11, PLAZA: 12, FLOOR: 13, WALL: 14, FOREST: 15, COURT: 16, DARK: 17, TILEFLOOR: 18, MAT: 19, BRIDGEV: 20, CAVE: 21, ROCK: 22, CAVEDOOR: 23,
};
export const SOLID = new Set([TILE.WATER, TILE.DEEP, TILE.CLIFF, TILE.VOID, TILE.WALL, TILE.FOREST, TILE.ROCK]);
export const SWIMMABLE = new Set([TILE.WATER, TILE.DEEP]);
// Caracteres do formato de mapa em texto (assets/maps/alvorada.json, campo "rows" dos carimbos)
export const CHARS = {
  '.': TILE.GRASS, ',': TILE.GRASS2, '"': TILE.TALL, '=': TILE.PATH, '~': TILE.WATER, ':': TILE.SAND, '*': TILE.FLOWERS, 'W': TILE.DEEP,
  '#': TILE.CLIFF, '_': TILE.VOID, '^': TILE.STAIRS, 'B': TILE.BRIDGE, 'b': TILE.BRIDGEV, 'P': TILE.PLAZA, 'f': TILE.FLOOR, 'w': TILE.WALL,
  'F': TILE.FOREST, 'c': TILE.COURT, 'd': TILE.DARK, 't': TILE.TILEFLOOR, 'm': TILE.MAT, 'k': TILE.CAVE, 'r': TILE.ROCK, 'O': TILE.CAVEDOOR,
};
export const NAMES = Object.fromEntries(Object.entries(TILE).map(([k, v]) => [k.toLowerCase(), v]));

// Texturas usadas por outros módulos (sombra, partículas) + objetos do cenário
export function makeTiles() {
  const tx = { ...SPR };
  const c = (w, h, f) => texOf(canvas(w, h, f));
  tx.shadow = c(16, 8, (x) => { x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(8, 4, 7.5, 3.5, 0, 0, 7); x.fill(); });
  tx.dot = c(4, 4, (x) => { x.fillStyle = '#fff'; x.fillRect(1, 0, 2, 4); x.fillRect(0, 1, 4, 2); });
  tx.glow = c(16, 16, (x) => { const g = x.createRadialGradient(8, 8, 0, 8, 8, 8); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 16, 16); });
  tx.rock = SPR.smallrock;
  return tx;
}
