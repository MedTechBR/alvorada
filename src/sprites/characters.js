import * as PIXI from 'pixi.js';
import { buildCharacter, resolveLook, PRESETS, LOOK_OPTIONS, DEFAULT_LOOK, DIRS, FW, FH, GROUND_Y } from './charart.js';

// Humanos do jogo (protagonista menino/menina, professor, mãe, rival, treinadores), desenhados por código
// em src/sprites/charart.js, com as cores escolhidas no criador de personagem.
//
//   makeCharacterFrames(look) -> {
//     walk:  { down: [4 texturas], up, left, right },   // quadro 0 = parado
//     run:   { down: [4], ... },
//     throw: { down: [3], ... },                        // preparo, soltura, acompanhamento
//     ride:  { down: [2], ... },                        // montado (sentado, pernas abertas); 1 = inclinado na corrida
//     idle:  { down: textura, ... },
//     down/up/left/right: atalhos para walk (compatível com o makeTrainerFrames antigo),
//     fw, fh, groundY, look, canvas (folha completa, útil para prévia no criador)
//   }
//   look = { sexo, pele, cabelo, corCabelo, roupa, calca, bone, chapeu? }  (ver LOOK_OPTIONS)
//          ou o nome de uma predefinição: 'menino', 'menina', 'professor', 'mae', 'rival', 'treinador', ...

export { LOOK_OPTIONS, DEFAULT_LOOK, PRESETS, FW, FH, GROUND_Y };
export const NPC_PRESETS = Object.keys(PRESETS);
const ANIMS = ['walk', 'run', 'throw', 'ride'];
const cache = new Map();

export function makeCharacterFrames(look = 'menino') {
  const key = JSON.stringify(look);
  if (cache.has(key)) return cache.get(key);
  const c = buildCharacter(look);
  // tudo numa folha só (uma textura na GPU): linhas = direção x animação, colunas = quadros
  const cols = 4, rows = DIRS.length * ANIMS.length;
  const canvas = document.createElement('canvas'); canvas.width = cols * FW; canvas.height = rows * FH;
  const ctx = canvas.getContext('2d');
  let r = 0;
  const where = {};
  for (const anim of ANIMS) for (const dir of DIRS) {
    c.sets[anim][dir].forEach((rgba, i) => ctx.putImageData(new ImageData(rgba, FW, FH), i * FW, r * FH));
    (where[anim] ??= {})[dir] = { row: r, n: c.sets[anim][dir].length }; r++;
  }
  const source = PIXI.Texture.from(canvas).source; source.scaleMode = 'nearest';
  const out = { fw: FW, fh: FH, groundY: GROUND_Y, look: c.look, canvas };
  for (const anim of ANIMS) {
    out[anim] = {};
    for (const dir of DIRS) {
      const { row, n } = where[anim][dir];
      out[anim][dir] = Array.from({ length: n }, (_, i) => new PIXI.Texture({ source, frame: new PIXI.Rectangle(i * FW, row * FH, FW, FH) }));
    }
  }
  out.idle = Object.fromEntries(DIRS.map((d) => [d, out.walk[d][0]]));
  for (const d of DIRS) out[d] = out.walk[d];
  cache.set(key, out);
  return out;
}

// Compatível com o treinador provisório: frames[dir][passo], 4 passos por direção.
// Âncora sugerida: (0.5, 1) com body.y = 2 (o pé fica sobre o centro da sombra).
export function makeTrainerFrames(look = 'menino') { return makeCharacterFrames(look); }

export function dir4(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'; }

// Imagem (data URL) de um quadro, para o criador de personagem em HTML
export function characterPreviewURL(look, dir = 'down', anim = 'walk', i = 0, scale = 4) {
  const c = buildCharacter(look);
  const src = document.createElement('canvas'); src.width = FW; src.height = FH;
  src.getContext('2d').putImageData(new ImageData(c.sets[anim][dir][i], FW, FH), 0, 0);
  const big = document.createElement('canvas'); big.width = FW * scale; big.height = FH * scale;
  const x = big.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, big.width, big.height);
  return big.toDataURL('image/png');
}

export { resolveLook };
