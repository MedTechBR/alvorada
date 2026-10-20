import { ITEMS, ITEM_INFO } from '../../data/items.js';
import { MOVES } from '../../data/moves.js';
import { SPECIES } from '../../data/species.js';
import * as alvorada from './regiao-alvorada.js';
import * as campina from './regiao-campina.js';
import * as sussurro from './regiao-sussurro.js';
import * as espelho from './regiao-espelho.js';
import * as sul from './regiao-sul.js';
import * as geada from './regiao-geada.js';
import * as brasas from './regiao-brasas.js';
import * as sertao from './regiao-sertao.js';
import * as jandaia from './regiao-jandaia.js';

// Todas as missões secundárias, por região. Para uma região nova: crie regiao-<nome>.js exportando
// MISSOES (lista), NPCS (objeto por id do NPC) e ITENS (itens de missão), e acrescente uma linha aqui.
// Formato completo, com exemplos de cada tipo de etapa: docs/missoes.md.
export const REGIOES = [alvorada, campina, sussurro, espelho, sul, geada, brasas, sertao, jandaia];

export const MISSOES = REGIOES.flatMap((r) => r.MISSOES ?? []);
export const NPCS = {};
for (const r of REGIOES) for (const [id, d] of Object.entries(r.NPCS ?? {})) NPCS[id] = NPCS[id] ? { ...NPCS[id], ...d } : d;
export const ITENS = Object.assign({}, ...REGIOES.map((r) => r.ITENS ?? {}));

// Itens de missão entram no catálogo da mochila (como os itens-chave da história em src/story/itens.js)
const BOLSO = { key: 'chave', medicine: 'remedios', berry: 'frutas', ball: 'bolas' };
for (const [k, v0] of Object.entries(ITENS)) {
  const v = { cat: 'key', color: '#c8a040', ...v0 };
  if (v.cat === 'key') v.key = true;
  if (!ITEMS[k]) ITEMS[k] = { en: v.name, price: 0, ...v };
  if (!ITEM_INFO[k]) ITEM_INFO[k] = { id: k, ...v, pocket: BOLSO[v.cat] ?? 'itens', usable: v.cat === 'medicine' };
}

const TIPOS = ['falar', 'entregar', 'ter', 'capturar', 'mostrar', 'vencer', 'chegar', 'derrotar', 'achar', 'flag', 'sinal'];
// Conferência dos dados (avisos no console ao abrir o jogo): ids repetidos, tipos de etapa, itens, golpes e espécies
export function validar() {
  const out = [], ids = new Set();
  const item = (k, onde) => { if (k && !ITEMS[k] && !ITEM_INFO[k]) out.push(`${onde}: item desconhecido "${k}"`); };
  for (const m of MISSOES) {
    if (!m.id || ids.has(m.id)) out.push(`id repetido ou vazio: ${m.id}`);
    ids.add(m.id);
    if (!m.titulo) out.push(`${m.id}: sem título`);
    if (!m.de && !m.historia) out.push(`${m.id}: sem "de" (quem dá a missão)`);
    if (m.requer?.capitulo != null) out.push(`${m.id}: "capitulo" não vale mais (mundo aberto); use insígnias, flags ou missões`);
    if (!Array.isArray(m.etapas) || !m.etapas.length) out.push(`${m.id}: sem etapas`);
    (m.etapas ?? []).forEach((e, i) => {
      const onde = `${m.id} etapa ${i + 1}`;
      if (!TIPOS.includes(e.tipo)) out.push(`${onde}: tipo desconhecido "${e.tipo}"`);
      if ((e.tipo === 'entregar' || e.tipo === 'ter') && !e.item) out.push(`${onde}: falta "item"`);
      item(e.item, onde);
      if (e.tipo === 'vencer' && !e.treinador && !e.batalha && !e.alfa) out.push(`${onde}: vencer precisa de treinador, batalha ou alfa`);
      if (e.alfa && !SPECIES[e.alfa.dex]) out.push(`${onde}: espécie do alfa desconhecida`);
      if (e.tipo === 'achar' && !e.pontos && e.x == null) out.push(`${onde}: achar precisa de pontos ou x/y`);
      if (!e.texto) out.push(`${onde}: sem "texto" (aparece no HUD e no diário)`);
    });
    const r = m.recompensa ?? {};
    for (const [k] of r.itens ?? []) item(k, `${m.id} recompensa`);
    for (const g of [r.mt ?? []].flat()) if (!MOVES[g]) out.push(`${m.id}: MT de golpe desconhecido "${g}"`);
    for (const p of [r.pokemon ?? []].flat()) if (!SPECIES[p.dex]) out.push(`${m.id}: Pokémon de presente desconhecido ${p.dex}`);
  }
  for (const m of MISSOES) for (const p of [m.proxima ?? []].flat()) if (!ids.has(p)) out.push(`${m.id}: proxima "${p}" não existe`);
  for (const [id, d] of Object.entries(NPCS)) {
    for (const x of d.tutor?.golpes ?? []) if (!MOVES[x.golpe]) out.push(`NPC ${id}: tutor com golpe desconhecido "${x.golpe}"`);
    if (d.troca && !SPECIES[d.troca.da?.dex]) out.push(`NPC ${id}: troca sem Pokémon válido`);
    for (const [k] of [...(d.presente?.itens ?? []), ...(d.diario?.itens ?? []), ...(d.diario?.sorteio ?? [])]) item(k, `NPC ${id}`);
    if (d.treinador) {
      const b = d.treinador.batalha;
      if (!b?.id || !Array.isArray(b.equipe) || !b.equipe.length) out.push(`NPC ${id}: treinador sem batalha (id e equipe)`);
      for (const [dex, , gs] of b?.equipe ?? []) {
        if (!SPECIES[dex]) out.push(`NPC ${id}: treinador com espécie desconhecida ${dex}`);
        for (const x of gs ?? []) if (!MOVES[x]) out.push(`NPC ${id}: treinador com golpe desconhecido "${x}"`);
      }
    }
    for (const f of d.reviver?.fosseis ?? []) { item(f.item, `NPC ${id}`); if (!SPECIES[f.dex]) out.push(`NPC ${id}: reviver com espécie desconhecida ${f.dex}`); }
  }
  return out;
}
