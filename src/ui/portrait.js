import { loadPokemonSprites, portraitOf } from '../sprites/pmd.js';

// Retratos dos menus: usa portraitOf(dex) do ramo `sprites` (src/sprites/pmd.js, 1º quadro do Idle
// recortado). Se falhar, recorta o quadro aqui mesmo; sem sprite, o menu mostra uma silhueta.
const cache = new Map();

export function portraitURL(dex) {
  if (!cache.has(dex)) cache.set(dex, (async () => {
    try { const p = await portraitOf(dex, 1); if (p?.url) return p.url; } catch { /* usa o recorte próprio */ }
    return make(dex);
  })().catch(() => null));
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
  const c = document.createElement('canvas'); c.width = f.width; c.height = f.height;
  c.getContext('2d').drawImage(src, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
  return c.toDataURL('image/png');
}

// Silhueta genérica (Pokémon sem sprite ou ainda não capturado)
export const SILHOUETTE = '<svg class="sil" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 40c-4 0-6-3-5-7l2-8c-3-2-4-6-2-10 1-3 4-4 6-3l2-6c1-2 3-2 4 0l2 5h6l2-5c1-2 3-2 4 0l2 6c2-1 5 0 6 3 2 4 1 8-2 10l2 8c1 4-1 7-5 7z" fill="currentColor"/><circle cx="19" cy="22" r="2" fill="#fff" opacity=".35"/><circle cx="29" cy="22" r="2" fill="#fff" opacity=".35"/></svg>';
