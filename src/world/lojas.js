// Mercados Pokémon: o que cada balcão vende. O estoque cresce com as insígnias, como nos jogos clássicos.
// Chaves da mochila (src/data/items.js); 'pokeball' é a chave antiga da Poké Bola, usada pela história e pelo save.
// Preços: ITEMS[...].price. Venda: metade do preço (sellPrice).
const TIERS = [
  [0, ['pokeball', 'potion', 'antidote', 'paralyzeHeal', 'awakening', 'burnHeal']],
  [1, ['greatBall', 'superPotion', 'iceHeal']],
  [2, ['revive', 'fullHeal']],
  [3, ['ultraBall', 'hyperPotion']],
  [5, ['maxPotion', 'maxRevive']],
];

// id do vendedor (assets/maps/alvorada.json, "people") → nome da loja e itens próprios da cidade
export const LOJAS = {
  vendedor_c: { nome: 'Mercado Pokémon de Campina', extra: [] },
  vendedor_s: { nome: 'Mercado Pokémon de Vila Sussurro', extra: [[0, ['netBall']], [1, ['nestBall']]] },
  vendedor_p: { nome: 'Balcão do Mercado de Porto Espelho', extra: [[0, ['diveBall', 'netBall']], [1, ['freshWater', 'sodaPop']]] },
  loja_geada_vendedor: { nome: 'Mercado Pokémon de Vila Geada', extra: [[0, ['heavyBall', 'iceHeal']], [2, ['maxRevive']]] },
};

export function estoque(id, badges = 0) {
  const loja = LOJAS[id]; if (!loja) return null;
  const out = [];
  for (const [n, list] of [...TIERS, ...loja.extra]) if (badges >= n) for (const k of list) if (!out.includes(k)) out.push(k);
  return out;
}

// Brasas (src/story/missoes/regiao-brasas.js e assets/maps/regioes/brasas.json)
LOJAS.vendedor_termas = { nome: 'Mercado de Vila Termas', extra: [[0, ['fireStone', 'charcoal']], [1, ['heatRock']]] };
