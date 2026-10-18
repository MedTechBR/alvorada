import { ITEMS, ITEM_INFO, TM_BY_MOVE, itemName } from '../data/items.js';
import { MOVES } from '../data/moves.js';

// Itens que o roteiro entrega (itens-chave da história) e MTs. Os itens-chave entram no catálogo oficial
// (src/data/items.js) só se o mesmo id ainda não existir: assim a mochila mostra nome e descrição certos.
const HISTORIA = {
  apito_montaria: { name: 'Apito de Montaria', cat: 'key', key: true, color: '#c8a040', desc: 'Presente da Lili e do Tomé. Chama a montaria certa para o obstáculo à frente.' },
  chaveiro_luzita: { name: 'Chaveiro de Luzita', cat: 'key', key: true, color: '#9afff4', desc: 'Brinde da Companhia Aurora. O cristal brilha sozinho, morno na palma da mão.' },
  bolo_laranja: { name: 'Bolo de Laranja', cat: 'medicine', heal: 60, color: '#f2a03a', desc: 'Feito pela sua mãe. Recupera 60 PS (e um pouco da saudade).' },
};
const POCKET = { key: 'chave', medicine: 'remedios', tm: 'tms' };
for (const [k, v] of Object.entries(HISTORIA)) {
  if (!ITEMS[k]) ITEMS[k] = { en: v.name, price: 0, ...v };
  if (!ITEM_INFO[k]) ITEM_INFO[k] = { id: k, ...v, pocket: POCKET[v.cat] ?? 'itens', usable: v.cat === 'medicine' };
}

// MT de um golpe: a oficial (tm001…tm229, Scarlet/Violet) ou uma extra da história (tm_<golpe>)
export function registrarMT(golpe) {
  if (TM_BY_MOVE?.[golpe]) return TM_BY_MOVE[golpe];
  const k = 'tm_' + golpe, mv = MOVES[golpe], name = 'MT ' + (mv?.name ?? golpe);
  const v = { name, cat: 'tm', move: golpe, reusable: true, extra: true, type: mv?.type, desc: `Ensina ${mv?.name ?? golpe}. Pode ser usada quantas vezes quiser.` };
  if (!ITEMS[k]) ITEMS[k] = { en: 'TM', price: 0, ...v };
  if (!ITEM_INFO[k]) ITEM_INFO[k] = { id: k, name, pocket: 'tms', tm: golpe, color: '#7a8aa0', desc: v.desc, cat: 'tm' };
  return k;
}
export const nomeItem = (k) => itemName(k) || k;
