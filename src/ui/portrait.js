import { loadPokemonSprites } from '../sprites/pmd.js';

// Retratos dos menus: primeiro quadro da animação parada (de frente) do sprite PMD, em PNG.
// Sem sprite ainda: devolve null e o menu mostra uma silhueta.
const cache = new Map();

export function portraitURL(dex) {
  if (!cache.has(dex)) cache.set(dex, make(dex).catch(() => null));
  return cache.get(dex);
}

async function make(dex) {
  const set = await loadPokemonSprites(dex);
  if (!set || set.placeholder) return null;
  const a = set.anims.Idle ?? set.anims.Walk;
  const tex = a?.frames?.[0]?.[0];
  const src = tex?.source?.resource;
  if (!src) return null;
  const f = tex.frame;
  // corta as bordas vazias para o Pokémon ocupar o retrato
  const c = document.createElement('canvas'); c.width = f.width; c.height = f.height;
  const x = c.getContext('2d');
  x.drawImage(src, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  let box = null;
  try {
    const d = x.getImageData(0, 0, f.width, f.height).data;
    let x0 = f.width, y0 = f.height, x1 = -1, y1 = -1;
    for (let j = 0; j < f.height; j++) for (let i = 0; i < f.width; i++) if (d[(j * f.width + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    if (x1 >= 0) box = { x0, y0, x1, y1 };
  } catch { /* imagem sem permissão de leitura: usa o quadro inteiro */ }
  if (!box) return c.toDataURL('image/png');
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1, s = Math.max(w, h) + 2;
  const out = document.createElement('canvas'); out.width = out.height = s;
  out.getContext('2d').drawImage(c, box.x0, box.y0, w, h, Math.floor((s - w) / 2), Math.floor((s - h) / 2), w, h);
  return out.toDataURL('image/png');
}

// Silhueta genérica (Pokémon sem sprite ou ainda não capturado)
export const SILHOUETTE = '<svg class="sil" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40c-4 0-6-3-5-7l2-8c-3-2-4-6-2-10 1-3 4-4 6-3l2-6c1-2 3-2 4 0l2 5h6l2-5c1-2 3-2 4 0l2 6c2-1 5 0 6 3 2 4 1 8-2 10l2 8c1 4-1 7-5 7z" fill="currentColor"/><circle cx="19" cy="22" r="2" fill="#fff" opacity=".35"/><circle cx="29" cy="22" r="2" fill="#fff" opacity=".35"/></svg>';
