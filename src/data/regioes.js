// Região de forma regional: as evoluções que só valem "na região de Alola/Hisui/Galar" (Pikachu → Raichu de Alola,
// Cubone → Marowak de Alola, Quilava → Typhlosion de Hisui...) perguntam ao mundo onde o jogador está
// (src/mechanics/ambiente.js → regiao(); src/mechanics/evolve.js confere `e.region`).
//
// Quem decide, na ordem:
//  1. o interior ou a área do mapa com "formaRegional": "alola" (assets/maps/*.json, campo opcional);
//  2. o mapa inteiro com "formaRegional" (ex.: um arquivo de região que é todo Hisui);
//  3. a região de construção (tools/mundo/plano.mjs, REGIOES) onde o ponto cai, pela tabela abaixo.
// Pelo plano (docs/mundo-expandido.md, seção 16): as formas de Alola evoluem nas Jandaias e as de Hisui no Ocaso.
// Galar ainda não tem lugar: fica sem região até o plano dizer onde.
const T = 16; // bloco em px (o mesmo de src/world/tiles.js; aqui sem importar o desenho)

export const FORMA_REGIONAL = { jandaia: 'alola', poente_leste: 'hisui', poente_oeste: 'hisui' };

// Retângulos (em blocos) das regiões de construção que têm forma regional: [x, y, w, h] externo e a faixa dos interiores
// (os mesmos de tools/mundo/plano.mjs). mundo = o arquivo de mapa (assets/maps/<mundo>.json).
const RECTS = [
  { id: 'jandaia', mundo: 'alvorada', rect: [0, 480, 400, 480], interiores: [0, 1600, 1200, 160] },
  { id: 'poente_leste', mundo: 'ocaso', rect: [480, 0, 480, 720], interiores: [0, 720, 960, 160] },
  { id: 'poente_oeste', mundo: 'ocaso', rect: [0, 0, 480, 720], interiores: [0, 880, 960, 160] },
];
const dentro = ([x, y, w, h], tx, ty) => tx >= x && ty >= y && tx < x + w && ty < y + h;

// 'alola' | 'hisui' | 'galar' | null no ponto (px, py) do mapa `map` (GameMap)
export function formaRegionalEm(map, px, py, mapId = 'alvorada') {
  if (!map) return null;
  const z = map.interiorAt?.(px, py) ?? map.areaAt?.(px, py);
  if (z?.formaRegional) return z.formaRegional;
  // motor de mundos (src/world/map.js): a região de construção do ponto, com o "formaRegional" do arquivo de região
  if (map.regionAt) { const r = map.regionAt(px, py); if (r?.formaRegional) return r.formaRegional; if (map.region?.partes) return map.region.formaRegional ?? null; }
  if (map.region?.formaRegional) return map.region.formaRegional;
  const tx = px / T, ty = py / T, fora = ty < (map.outdoorH ?? Infinity); // abaixo de outdoorH só há interiores
  for (const r of RECTS) if (r.mundo === mapId && dentro(fora ? r.rect : r.interiores, tx, ty)) return FORMA_REGIONAL[r.id] ?? null;
  return null;
}
