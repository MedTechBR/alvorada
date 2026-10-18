import * as PIXI from 'pixi.js';
import { SPR, canvas, texOf } from './art.js';

// Tipos de bloco (16 px). Os números de 0 a 8 são os mesmos da versão anterior (o combate usa TILE.*).
export const T = 16;
export const TILE = {
  GRASS: 0, GRASS2: 1, TALL: 2, PATH: 3, WATER: 4, SAND: 5, FLOWERS: 6, DEEP: 7, CLIFF: 8,
  VOID: 9, STAIRS: 10, BRIDGE: 11, PLAZA: 12, FLOOR: 13, WALL: 14, FOREST: 15, COURT: 16, DARK: 17, TILEFLOOR: 18, MAT: 19, BRIDGEV: 20, CAVE: 21, ROCK: 22, CAVEDOOR: 23,
  GOLD: 24, MUD: 25, CORN: 26, CLIMB: 27, WEBG: 28, WEBS: 29, SNOW: 30, DOCK: 31,
  // biomas (ramo biomas): gelo e neve
  SNOWFIELD: 32, DEEPSNOW: 33, ICE: 34, FROZEN: 35, ICEWALL: 36, ICEFLOOR: 37, TALLSNOW: 38,
  // vulcão
  BASALT: 39, ASH: 40, LAVA: 41, OBSIDIAN: 42, HOTSPRING: 43, LAVAFLOOR: 44, LAVAWALL: 45,
  // deserto e sertão
  DUNE: 46, QUICKSAND: 47, CRACKED: 48, CANYON: 49, CAATINGA: 50, TALLDRY: 51,
  // praia tropical e mangue
  WETSAND: 52, TIDE: 53, ROOTS: 54, MANGMUD: 55, REEF: 56, CUR_E: 57, CUR_W: 58, CUR_N: 59, CUR_S: 60,
  // templos, ruínas e masmorras
  TEMPLEFLOOR: 61, MOSAIC: 62, OLDSTONE: 63, TEMPLEWALL: 64, STAIRUP: 65, STAIRDOWN: 66, HOLE: 67, CRACK: 68,
  // cavernas
  DARKCAVE: 69, CRYSTALFLOOR: 70, CRYSTALWALL: 71, RAIL: 72,
};
export const SOLID = new Set([TILE.WATER, TILE.DEEP, TILE.CLIFF, TILE.VOID, TILE.WALL, TILE.FOREST, TILE.ROCK, TILE.MUD, TILE.CORN, TILE.CLIMB,
  TILE.ICEWALL, TILE.LAVA, TILE.LAVAWALL, TILE.CANYON, TILE.ROOTS, TILE.TEMPLEWALL, TILE.CRYSTALWALL, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S]);
// Barreiras que as montarias vencem (map.setMount): lama funda (Correr), água (Nadar), paredão com trepadeira (Escalar)
export const MOUNT_PASS = { correr: [TILE.MUD], nadar: [TILE.WATER, TILE.DEEP], escalar: [TILE.CLIMB] };
export const SWIMMABLE = new Set([TILE.WATER, TILE.DEEP, TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S]);
MOUNT_PASS.nadar.push(TILE.CUR_E, TILE.CUR_W, TILE.CUR_N, TILE.CUR_S);
// Terrenos dos biomas (comportamento em src/world/masmorra.js):
// velocidade de quem anda por cima (1 = normal)
export const SLOW = { [TILE.DEEPSNOW]: 0.55, [TILE.QUICKSAND]: 0.45, [TILE.MANGMUD]: 0.75, [TILE.HOTSPRING]: 0.6, [TILE.REEF]: 0.62, [TILE.TIDE]: 0.82, [TILE.DUNE]: 0.88, [TILE.SNOWFIELD]: 0.94, [TILE.ASH]: 0.95, [TILE.TALLSNOW]: 0.85 };
export const SLIDE = new Set([TILE.ICE, TILE.FROZEN]);              // escorrega até bater
export const CURRENT = { [TILE.CUR_E]: [1, 0], [TILE.CUR_W]: [-1, 0], [TILE.CUR_N]: [0, -1], [TILE.CUR_S]: [0, 1] };
// mato alto de outros biomas (selvagens aparecem, balança, esconde o pé) e o chão que fica quando é cortado
export const TALLS = new Set([TILE.TALL, TILE.TALLSNOW, TILE.TALLDRY]);
export const TALL_BASE = { [TILE.TALL]: TILE.GRASS, [TILE.TALLSNOW]: TILE.SNOWFIELD, [TILE.TALLDRY]: TILE.CAATINGA };
// paredes com face e topo (desenho em ground.js) e pisos que ganham sombra embaixo delas
export const WALLS = new Set([TILE.WALL, TILE.ROCK, TILE.ICEWALL, TILE.LAVAWALL, TILE.CANYON, TILE.TEMPLEWALL, TILE.CRYSTALWALL]);
// Caracteres do formato de mapa em texto (assets/maps/alvorada.json, campo "rows" dos carimbos)
export const CHARS = {
  '.': TILE.GRASS, ',': TILE.GRASS2, '"': TILE.TALL, '=': TILE.PATH, '~': TILE.WATER, ':': TILE.SAND, '*': TILE.FLOWERS, 'W': TILE.DEEP,
  '#': TILE.CLIFF, '_': TILE.VOID, '^': TILE.STAIRS, 'B': TILE.BRIDGE, 'b': TILE.BRIDGEV, 'P': TILE.PLAZA, 'f': TILE.FLOOR, 'w': TILE.WALL,
  'F': TILE.FOREST, 'c': TILE.COURT, 'd': TILE.DARK, 't': TILE.TILEFLOOR, 'm': TILE.MAT, 'k': TILE.CAVE, 'r': TILE.ROCK, 'O': TILE.CAVEDOOR,
  'g': TILE.GOLD, 'L': TILE.MUD, 'M': TILE.CORN, 'V': TILE.CLIMB, 'y': TILE.WEBG, 'x': TILE.WEBS, 's': TILE.SNOW, 'D': TILE.DOCK,
  // biomas (tabela completa em assets/maps/LEIAME.md)
  'n': TILE.SNOWFIELD, 'N': TILE.DEEPSNOW, 'i': TILE.ICE, 'I': TILE.FROZEN, 'G': TILE.ICEWALL, 'e': TILE.ICEFLOOR, 'J': TILE.TALLSNOW,
  'v': TILE.BASALT, 'a': TILE.ASH, 'l': TILE.LAVA, 'o': TILE.OBSIDIAN, 'q': TILE.HOTSPRING, 'u': TILE.LAVAFLOOR, 'U': TILE.LAVAWALL,
  'z': TILE.DUNE, 'Q': TILE.QUICKSAND, 'h': TILE.CRACKED, 'C': TILE.CANYON, 'K': TILE.CAATINGA, 'j': TILE.TALLDRY,
  'A': TILE.WETSAND, 'T': TILE.TIDE, 'R': TILE.ROOTS, 'p': TILE.MANGMUD, '%': TILE.REEF, '→': TILE.CUR_E, '←': TILE.CUR_W, '↑': TILE.CUR_N, '↓': TILE.CUR_S,
  'E': TILE.TEMPLEFLOOR, 'Y': TILE.MOSAIC, 'X': TILE.OLDSTONE, 'H': TILE.TEMPLEWALL, '<': TILE.STAIRUP, '>': TILE.STAIRDOWN, '0': TILE.HOLE, '!': TILE.CRACK,
  'S': TILE.DARKCAVE, 'Z': TILE.CRYSTALFLOOR, '$': TILE.CRYSTALWALL, '+': TILE.RAIL,
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
