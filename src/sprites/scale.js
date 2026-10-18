import { SPECIES } from '../data/species.js';

// Os sprites do PMD não estão em escala entre si (um Pikachu é mais alto que um Charizard lá).
// Aqui cada espécie ganha uma altura na tela a partir da altura real (m), comprimida para caber:
// treinador ≈ 32 px; Pikachu (0,4 m) ≈ 15 px; Charizard (1,7 m) ≈ 37 px; Gyarados (6,5 m) ≈ 75 px.
// A escala anda em passos de 0,25 para o pixel art não deformar demais.
export function screenHeight(dex) {
  const h = SPECIES[dex]?.height ?? 0.8;
  return Math.min(80, 10 + 16 * Math.pow(h, 0.85));
}
export function speciesScale(dex, set) {
  const top = set?.top || 24;
  const k = screenHeight(dex) / top;
  return Math.max(0.5, Math.min(3, Math.round(k * 4) / 4));
}
