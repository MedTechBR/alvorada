import { makeCharacterFrames, LOOK_OPTIONS, DEFAULT_LOOK, FW, FH } from '../sprites/characters.js';
import { folhaTreinador, folhaPronta, MOCHILAS } from '../sprites/treinador-hgss.js';
export { MOCHILAS };

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
// Visual 3D (padrão): o treinador é a folha FireRed recolorida (src/sprites/treinador-hgss.js), desenhada no
// tamanho do canvas; enquanto a folha carrega, desenha de novo quando ficar pronta.
const VISUAL_2D = (() => { const q = new URLSearchParams(location.search).get('visual'); if (q) return q === '2d'; try { return localStorage.getItem('alvorada.visual') === '2d'; } catch { return false; } })();
export const ESTILO_HGSS = !VISUAL_2D;
const COLS = [0, 1, 0, 2];
export function drawLook(ctx, look, dir = 'down', step = 0) {
  if (ESTILO_HGSS) {
    const l = toCharLook(look), cv = folhaPronta(l);
    const c = ctx.canvas; ctx.imageSmoothingEnabled = false;
    if (!cv) { folhaTreinador(l).then(() => drawLook(ctx, look, dir, step)); return; }
    const lin = { down: 0, up: 1, left: 2, right: 3 }[dir] ?? 0, col = COLS[step % 4];
    const s = Math.min(c.width / 32, c.height / 32);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(cv, col * 32, lin * 32, 32, 32, (c.width - 32 * s) / 2, c.height - 32 * s, 32 * s, 32 * s);
    return;
  }
  const { name, ...l } = toCharLook(look);
  const sheet = makeCharacterFrames(l).canvas;
  ctx.clearRect(0, 0, FW, FH);
  ctx.drawImage(sheet, step * FW, DIRS.indexOf(dir) * FH, FW, FH, 0, 0, FW, FH);
}
export function lookFrames(look) { const { name, ...l } = toCharLook(look); return makeCharacterFrames(l); }
