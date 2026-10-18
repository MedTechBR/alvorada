import { makeCharacterFrames, LOOK_OPTIONS, DEFAULT_LOOK, FW, FH } from '../sprites/characters.js';

// Visual do jogador no formato do criador de src/sprites/characters.js
// ({ sexo, pele, cabelo, corCabelo, roupa, calca, bone, chapeu, name }).
// Converte também o formato provisório antigo ({ gender, skin, hair, hairStyle, shirt, pants, cap }).
export { LOOK_OPTIONS, FW, FH };
const OLD_HAIR = { short: 'curto', spiky: 'espetado', long: 'comprido', ponytail: 'rabo' };
export function toCharLook(look) {
  if (look?.sexo) return { ...DEFAULT_LOOK[look.sexo === 'menina' ? 'menina' : 'menino'], ...look };
  if (look?.gender) {
    const sexo = look.gender === 'f' ? 'menina' : 'menino';
    return { ...DEFAULT_LOOK[sexo], sexo, pele: look.skin, cabelo: OLD_HAIR[look.hairStyle] ?? DEFAULT_LOOK[sexo].cabelo, corCabelo: look.hair,
      roupa: look.shirt, calca: look.pants, ...(look.cap === 'none' ? { chapeu: 'nenhum' } : { bone: look.cap }), name: look.name };
  }
  return { ...DEFAULT_LOOK.menino, ...(look ?? {}) };
}
const DIRS = ['down', 'up', 'left', 'right'];
// Desenha um quadro de andar num canvas 2D de FW x FH (prévias em HTML)
export function drawLook(ctx, look, dir = 'down', step = 0) {
  const { name, ...l } = toCharLook(look);
  const sheet = makeCharacterFrames(l).canvas;
  ctx.clearRect(0, 0, FW, FH);
  ctx.drawImage(sheet, step * FW, DIRS.indexOf(dir) * FH, FW, FH, 0, 0, FW, FH);
}
export function lookFrames(look) { const { name, ...l } = toCharLook(look); return makeCharacterFrames(l); }
