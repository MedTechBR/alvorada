// Evoluções reais (src/data/species.js → evo) e a adaptação ao tempo real:
//   nível → subir de nível; pedra/item → usar o item; troca → usar o Cordão de Ligação (ou o item que ele
//   seguraria na troca, como Revestimento Metálico); amizade → amizade ≥ 160 ao subir de nível;
//   hora do dia → ambiente.timeOfDay(); golpe → subir de nível sabendo o golpe; chuva → clima do mapa.
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { itemId } from '../data/items.js';
import * as amb from './ambiente.js';

export const FRIENDSHIP_EVOLVE = 160;

const splitOf = (mon) => { let h = 0; for (const c of String(mon.uid ?? '')) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2; };

function conditionsOk(mon, e, ctx) {
  const time = ctx.time ?? amb.timeOfDay();
  if (e.level && mon.level < e.level) return false;
  if (e.friendship && (mon.friendship ?? 0) < e.friendship) return false;
  if (e.time) {
    if (e.time === 'fullMoon') { if (!(ctx.fullMoon ?? amb.fullMoon()) && time !== 'night') return false; }
    else if (e.time === 'dusk') { if (time !== 'dusk') return false; }
    else if (e.time !== time) return false;
  }
  if (e.gender && mon.gender !== e.gender) return false;
  if (e.move && !mon.moves.includes(e.move)) return false;
  if (e.moveType && !mon.moves.some((m) => MOVES[m]?.type === e.moveType)) return false;
  if (e.rain && (ctx.weather ?? amb.weather()) !== 'rain') return false;
  if (e.partyType && !(ctx.partyTypes ?? []).includes(e.partyType)) return false;
  // novas condições (todas as espécies): Pokémon na equipe (Mantine), Ataque × Defesa (Tyrogue), natureza (Toxtricity),
  // metade/metade pelo identificador (Wurmple) e região (formas regionais: só onde o mundo disser que é aquela região)
  if (e.partySpecies && !(ctx.partySpecies ?? []).includes(e.partySpecies)) return false;
  if (e.atkDef != null) { const d = Math.sign((mon.stats?.atk ?? 0) - (mon.stats?.def ?? 0)); if (d !== e.atkDef) return false; }
  if (e.natures && !e.natures.includes(mon.nature)) return false;
  if (e.split != null && splitOf(mon) !== e.split) return false;
  if (e.region && e.region !== ctx.region) return false;
  return true;
}

/**
 * Para qual espécie `mon` evolui agora? trigger: 'level' (subiu de nível), 'item' (usou ctx.item) ou
 * 'trade' (foi trocado online; consumeHeld = gasta o item que segurava).
 * ctx: { item, time, weather, partyTypes, partySpecies, fullMoon, region }. Devolve { to, form, rule } ou null
 * (form = forma de destino, ex.: 'alola'; null = padrão).
 */
export function evolutionFor(mon, trigger = 'level', ctx = {}) {
  const sp = mon.sp ?? SPECIES[mon.dex];
  if (!sp?.evo?.length || itemId(mon.item) === 'everstone') return null;
  const item = ctx.item ? itemId(ctx.item) : null;
  for (const e of sp.evo) {
    if (!SPECIES[e.to]) continue;
    if (trigger === 'item') {
      if (!e.item || e.item !== item) continue;
    } else if (trigger === 'trade') {
      // troca de verdade (online): evolui como nos jogos; com item segurado quando a regra pede
      if (!e.trade || (e.item !== 'linkingCord' && itemId(mon.item) !== e.item)) continue;
      return { to: e.to, form: e.form ?? null, rule: e, consumeHeld: e.item !== 'linkingCord' };
    } else if (e.item) continue;
    if (e.shed) continue; // Shedinja: o jogo cria um segundo Pokémon (veja shedFor)
    if (conditionsOk(mon, e, ctx)) return { to: e.to, form: e.form ?? null, rule: e };
  }
  return null;
}

// Nincada → Ninjask também deixa um Shedinja (se houver espaço e uma Poké Bola). Devolve o dex ou null.
export function shedFor(dex) {
  return SPECIES[dex]?.evo?.find((e) => e.shed)?.to ?? null;
}

// Texto curto da condição, para a Pokédex/menu
export function describeEvolution(e) {
  const p = [];
  if (e.level) p.push(`nível ${e.level}`);
  if (e.item) p.push(e.trade ? `usar ${e.item} (troca)` : `usar ${e.item}`);
  if (e.friendship) p.push('amizade alta');
  if (e.time) p.push({ day: 'de dia', night: 'de noite', dusk: 'ao entardecer', fullMoon: 'em noite de lua cheia' }[e.time]);
  if (e.gender) p.push(e.gender === 'm' ? 'macho' : 'fêmea');
  if (e.move) p.push(`sabendo ${MOVES[e.move]?.name ?? e.move}`);
  if (e.moveType) p.push(`sabendo um golpe do tipo ${e.moveType}`);
  if (e.rain) p.push('na chuva');
  if (e.partyType) p.push(`com um Pokémon do tipo ${e.partyType} na equipe`);
  if (e.partySpecies) p.push(`com ${SPECIES[e.partySpecies]?.name ?? 'outro Pokémon'} na equipe`);
  if (e.atkDef != null) p.push(e.atkDef > 0 ? 'Ataque maior que a Defesa' : e.atkDef < 0 ? 'Defesa maior que o Ataque' : 'Ataque igual à Defesa');
  if (e.natures) p.push('conforme a natureza');
  if (e.region) p.push(`na região de ${e.region[0].toUpperCase()}${e.region.slice(1)}`);
  return p.join(', ');
}
