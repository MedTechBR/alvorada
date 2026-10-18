// As 25 naturezas: +10% em um status e −10% em outro (as 5 neutras não mudam nada).
// Valores conferidos com a PokéAPI (natures.csv). Nomes em português: tradução cuidadosa.
// up/down: atk, def, spa, spd, spe (null = neutra).

export const NATURES = {
  hardy:   { name: 'Resistente', up: null, down: null },
  lonely:  { name: 'Solitária', up: 'atk', down: 'def' },
  brave:   { name: 'Corajosa', up: 'atk', down: 'spe' },
  adamant: { name: 'Firme', up: 'atk', down: 'spa' },
  naughty: { name: 'Travessa', up: 'atk', down: 'spd' },
  bold:    { name: 'Ousada', up: 'def', down: 'atk' },
  docile:  { name: 'Dócil', up: null, down: null },
  relaxed: { name: 'Relaxada', up: 'def', down: 'spe' },
  impish:  { name: 'Marota', up: 'def', down: 'spa' },
  lax:     { name: 'Desleixada', up: 'def', down: 'spd' },
  timid:   { name: 'Tímida', up: 'spe', down: 'atk' },
  hasty:   { name: 'Apressada', up: 'spe', down: 'def' },
  serious: { name: 'Séria', up: null, down: null },
  jolly:   { name: 'Alegre', up: 'spe', down: 'spa' },
  naive:   { name: 'Ingênua', up: 'spe', down: 'spd' },
  modest:  { name: 'Modesta', up: 'spa', down: 'atk' },
  mild:    { name: 'Suave', up: 'spa', down: 'def' },
  quiet:   { name: 'Quieta', up: 'spa', down: 'spe' },
  bashful: { name: 'Acanhada', up: null, down: null },
  rash:    { name: 'Precipitada', up: 'spa', down: 'spd' },
  calm:    { name: 'Calma', up: 'spd', down: 'atk' },
  gentle:  { name: 'Gentil', up: 'spd', down: 'def' },
  sassy:   { name: 'Atrevida', up: 'spd', down: 'spe' },
  careful: { name: 'Cuidadosa', up: 'spd', down: 'spa' },
  quirky:  { name: 'Peculiar', up: null, down: null },
};

export const NATURE_IDS = Object.keys(NATURES);

// Multiplicador da natureza para um status (1,1 / 0,9 / 1)
export function natureMult(nature, stat) {
  const n = NATURES[nature];
  if (!n || !n.up || n.up === n.down) return 1;
  return stat === n.up ? 1.1 : stat === n.down ? 0.9 : 1;
}

export function randomNature(rng = Math.random) {
  return NATURE_IDS[Math.floor(rng() * NATURE_IDS.length)];
}
