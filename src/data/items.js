// Itens da mochila, por bolso. Campos (todos opcionais; o menu lê de forma tolerante):
//   heal = HP recuperado · cures = estado que cura · hold = pode ser equipado num Pokémon
//   tm = id do golpe que a MT ensina · key = item-chave (não acaba) · ball = multiplicador de captura
// O ramo `mecanicas` traz os dados definitivos (itens equipáveis, MTs, tipos de Poké Bola);
// na junção, basta trocar/mesclar este ITEM_INFO mantendo os mesmos campos.
export const POCKETS = [
  ['itens', 'Itens'],
  ['remedios', 'Remédios'],
  ['bolas', 'Poké Bolas'],
  ['tms', 'MTs'],
  ['frutas', 'Frutas'],
  ['chave', 'Itens-chave'],
];

export const ITEM_INFO = {
  // Poké Bolas
  pokeball: { name: 'Poké Bola', pocket: 'bolas', color: '#e5383b', ball: 1, desc: 'Arremesse perto de um Pokémon selvagem para capturá-lo (Q ou o botão de bola).' },
  greatball: { name: 'Grande Bola', pocket: 'bolas', color: '#3a7be0', ball: 1.5, desc: 'Poké Bola melhor que a comum: captura com mais facilidade.' },
  // Remédios
  potion:   { name: 'Poção', pocket: 'remedios', color: '#9b59d6', heal: 20, desc: 'Remédio em spray. Recupera 20 HP de um Pokémon.' },
  superPotion: { name: 'Super Poção', pocket: 'remedios', color: '#e0662c', heal: 50, desc: 'Remédio em spray mais forte. Recupera 50 HP de um Pokémon.' },
  // Frutas
  oran:     { name: 'Fruta Oran', pocket: 'frutas', color: '#3f6fd8', heal: 10, hold: true, desc: 'Fruta azul e doce. Recupera 10 HP de um Pokémon.' },
  pecha:    { name: 'Fruta Pecha', pocket: 'frutas', color: '#f2a6c4', cures: 'psn', hold: true, desc: 'Fruta macia e muito doce. Cura o envenenamento.' },
  cheri:    { name: 'Fruta Cheri', pocket: 'frutas', color: '#d8344a', cures: 'par', hold: true, desc: 'Fruta picante. Cura a paralisia.' },
  rawst:    { name: 'Fruta Rawst', pocket: 'frutas', color: '#4cae8a', cures: 'brn', hold: true, desc: 'Fruta amarga. Cura queimaduras.' },
  // Itens para equipar
  silkScarf: { name: 'Lenço de Seda', pocket: 'itens', color: '#f4f0e0', hold: true, desc: 'Equipe num Pokémon: fortalece os golpes do tipo Normal.' },
  charcoal:  { name: 'Carvão', pocket: 'itens', color: '#3a3a3a', hold: true, desc: 'Equipe num Pokémon: fortalece os golpes do tipo Fogo.' },
  miracleSeed: { name: 'Semente Milagrosa', pocket: 'itens', color: '#5ab84a', hold: true, desc: 'Equipe num Pokémon: fortalece os golpes do tipo Planta.' },
  mysticWater: { name: 'Água Mística', pocket: 'itens', color: '#4aa0e8', hold: true, desc: 'Equipe num Pokémon: fortalece os golpes do tipo Água.' },
  // MTs
  tm_bite:   { name: 'MT Mordida', pocket: 'tms', tm: 'bite', desc: 'Ensina Mordida a um Pokémon. Pode ser usada de novo.' },
  tm_rockTomb: { name: 'MT Tumba de Pedras', pocket: 'tms', tm: 'rockTomb', desc: 'Ensina Tumba de Pedras a um Pokémon. Pode ser usada de novo.' },
  // Itens-chave
  pokedex:  { name: 'Pokédex', pocket: 'chave', key: true, color: '#e5383b', desc: 'Registra os Pokémon que você vê e captura. Presente do Prof. Jatobá.' },
  townMap:  { name: 'Mapa da Região', pocket: 'chave', key: true, color: '#9fd67a', desc: 'Mapa dobrável da região Alvorada.' },
};

const STATUS_NAME = { psn: 'envenenado', par: 'paralisado', brn: 'queimado', slp: 'dormindo' };

// Usa um item num Pokémon da equipe. Devolve { ok, text }.
export function useItemOn(g, key, m) {
  const it = ITEM_INFO[key];
  if (!it || !(g.bag[key] > 0)) return { ok: false, text: 'Você não tem esse item.' };
  if (it.heal) {
    if (m.fainted) return { ok: false, text: `${m.name} está desmaiado. Isso não vai funcionar.` };
    if (m.hp >= m.stats.hp) return { ok: false, text: `O HP de ${m.name} já está cheio.` };
    const before = m.hp;
    m.hp = Math.min(m.stats.hp, m.hp + it.heal);
    g.bag[key]--;
    return { ok: true, text: `${m.name} recuperou ${m.hp - before} HP!` };
  }
  if (it.cures) {
    if (m.fainted) return { ok: false, text: `${m.name} está desmaiado. Isso não vai funcionar.` };
    if (m.status !== it.cures) return { ok: false, text: `${m.name} não está ${STATUS_NAME[it.cures]}.` };
    m.status = null; g.bag[key]--;
    return { ok: true, text: `${m.name} não está mais ${STATUS_NAME[it.cures]}!` };
  }
  return { ok: false, text: 'Isso não pode ser usado agora.' };
}
export const usableOnMon = (key) => !!(ITEM_INFO[key]?.heal || ITEM_INFO[key]?.cures);
export const holdable = (key) => !!ITEM_INFO[key]?.hold;
export const itemName = (key) => ITEM_INFO[key]?.name ?? (key ? String(key) : '');
