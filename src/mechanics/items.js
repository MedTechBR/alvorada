// Usar itens e efeitos dos itens equipados no tempo real.
import { ITEMS, itemId, itemInfo } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { useTM } from './learn.js';
import { evolutionFor } from './evolve.js';
import { statusImmune } from './abilities.js';
import { TURNO_S } from './tempo.js';
import { expForLevel } from './stats.js';
import * as amb from './ambiente.js';

const STATUS_PT = { psn: 'envenenamento', tox: 'envenenamento', brn: 'queimadura', par: 'paralisia', slp: 'sono', frz: 'congelamento' };

const curesStatus = (cure, st) => cure === 'all' || (Array.isArray(cure) && cure.includes(st));

/**
 * Usa um item da mochila em `mon` (fora ou dentro da luta). Não mexe na mochila: devolve { ok, consumed, msg, events }.
 * ctx: { entity (a entidade no mapa, para Éter/Elixir), replaceIndex (MT), time, weather, partyTypes }
 * events podem conter { type: 'evolve', to } e { type: 'level' | 'learn' } (Doce Raro / Doce de Exp.).
 */
export function useItem(mon, id, ctx = {}) {
  id = itemId(id);
  const it = ITEMS[id];
  const no = (msg) => ({ ok: false, consumed: false, msg, events: [] });
  if (!it) return no('Item desconhecido.');
  const max = mon.stats.hp;
  const events = [];
  // MT
  if (it.cat === 'tm') {
    const r = useTM(mon, id, ctx.replaceIndex ?? -1);
    if (!r.ok) return no({ cannot: `${mon.name} não pode aprender esse golpe.`, known: `${mon.name} já sabe esse golpe.`, full: `${mon.name} já sabe 4 golpes. Escolha um para esquecer.` }[r.reason] ?? 'Não deu.');
    return { ok: true, consumed: false, msg: `${mon.name} aprendeu ${r.move}!`, events: [{ type: 'learn', move: r.move, replaced: r.replaced }] };
  }
  // evolução
  if (it.cat === 'evolution' || (it.cat === 'held' && SPECIES[mon.dex]?.evo?.some((e) => e.item === id) && !ctx.hold)) {
    const ev = evolutionFor(mon, 'item', { ...ctx, item: id });
    if (!ev) return no('Não teve efeito.');
    return { ok: true, consumed: true, msg: `${mon.name} vai evoluir!`, events: [{ type: 'evolve', to: ev.to, item: id }] };
  }
  // frutas da mochila usadas direto (Oran, Sitrus, Pecha…)
  if (it.cat === 'berry' && it.berry && !it.evs) {
    const b = it.berry;
    let did = false;
    if (mon.fainted) return no('Não teve efeito.');
    const h = b.heal ?? Math.floor(max * (b.healFrac ?? 0));
    if (h && mon.hp < max) { mon.hp = Math.min(max, mon.hp + h); did = true; }
    if (b.cure && mon.status && curesStatus(b.cure, mon.status)) { mon.status = null; did = true; }
    if (!did) return no('Não teve efeito.');
    return { ok: true, consumed: true, msg: `${mon.name} comeu a ${it.name}.`, events };
  }
  // reviver
  if (it.revive) {
    if (!mon.fainted) return no('Não teve efeito.');
    mon.hp = Math.max(1, Math.floor(max * it.revive)); mon.status = null;
    if (it.bitter) mon.addFriendship?.(-it.bitter);
    return { ok: true, consumed: true, msg: `${mon.name} se recuperou!`, events };
  }
  if (mon.fainted && (it.heal || it.cure)) return no('Não teve efeito.');
  // cura de PS e estado
  if (it.heal || it.cure) {
    let did = false;
    if (it.heal && mon.hp < max) { const h = it.heal === 'full' ? max : it.heal; mon.hp = Math.min(max, mon.hp + h); did = true; }
    if (it.cure && mon.status && curesStatus(it.cure, mon.status)) { mon.status = null; did = true; }
    if (it.cure === 'all' && ctx.entity?.confused) { ctx.entity.confused = 0; did = true; }
    if (!did) return no('Não teve efeito.');
    if (it.bitter) mon.addFriendship?.(-it.bitter);
    return { ok: true, consumed: true, msg: `${mon.name} se sentiu melhor.`, events };
  }
  // Éter/Elixir: recarga dos golpes (não existe PP no tempo real)
  if (it.cdReset) {
    const e = ctx.entity;
    if (!e?.cds) return no('Só funciona com o Pokémon em campo.');
    const order = e.cds.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, it.cdReset);
    for (const [, i] of order) e.cds[i] = 0;
    if (it.cdBoost) e.cdBoost = it.cdBoost;
    return { ok: true, consumed: true, msg: 'Os golpes recarregaram!', events };
  }
  // vitaminas e frutas que mexem em EVs
  if (it.evs) {
    const before = mon.evs.reduce((a, b) => a + b, 0);
    if (it.evs.some((v) => v > 0)) mon.gainEvs(it.evs);
    else mon.evs.forEach((v, i) => { mon.evs[i] = Math.max(0, v + it.evs[i]); });
    const changed = mon.evs.reduce((a, b) => a + b, 0) !== before;
    if (it.friendship) mon.addFriendship?.(it.friendship);
    if (!changed && !it.friendship) return no('Não teve efeito.');
    mon.calc();
    return { ok: true, consumed: true, msg: changed ? `Os status de ${mon.name} mudaram.` : `${mon.name} gostou!`, events };
  }
  // doces
  if (it.levelUp || it.exp) {
    if (mon.level >= 100) return no('Não teve efeito.');
    const need = it.levelUp ? expForLevel(mon.sp.growth, mon.level + 1) - mon.xp : it.exp;
    events.push(...mon.gainXp(Math.max(1, need), ctx));
    return { ok: true, consumed: true, msg: `${mon.name} ganhou experiência!`, events };
  }
  if (it.abilitySwap) {
    const abs = SPECIES[mon.dex].abilities;
    if (abs.length < 2) return no('Não teve efeito.');
    mon.ability = abs[(abs.indexOf(mon.ability) + 1) % abs.length];
    return { ok: true, consumed: true, msg: `A habilidade de ${mon.name} mudou!`, events };
  }
  return no('Não dá para usar isso agora.');
}

// Equipar: devolve o item que estava antes
export function giveItem(mon, id) {
  const prev = mon.item ?? null;
  mon.item = id ? itemId(id) : null;
  return prev;
}

/**
 * Efeitos do item equipado e de algumas habilidades ao longo do tempo. Chamar a cada quadro com o dt (s)
 * para o Pokémon em campo. Muda o mon e devolve uma lista de { kind, amount?, note } para mostrar.
 *   - Sobras / Lodo Negro: ±1/16 (ou 1/8) dos PS a cada TURNO_S
 *   - frutas de estado (Cheri, Lum…), de PS (Oran, Sitrus…) e Leppa
 *   - Orbe da Chama / Orbe Tóxico depois de um turno
 *   - Coletor de Chuva, Corpo de Gelo, Cura Venenosa
 */
export function heldTick(mon, dt, ctx = {}) {
  const out = [];
  if (!mon || mon.fainted) return out;
  const it = itemInfo(mon.item);
  const max = mon.stats.hp;
  const t = (mon._tick ??= { turn: 0, orb: 0 });
  t.turn += dt;
  // frutas: na hora em que a condição aparece
  const b = it?.berry;
  if (b) {
    const lim = b.when === 'hp50' || mon.ability === 'gluttony' ? 0.5 : 0.25;
    if ((b.when === 'status' && mon.status && curesStatus(b.cure, mon.status))
      || (b.when === 'confused' && ctx.entity?.confused > 0)
      || ((b.when === 'hp50' || b.when === 'hp25') && mon.hp <= max * lim)
      || (b.when === 'cooldown' && ctx.entity?.cds?.some((c) => c > 4))) {
      if (b.cure && mon.status) mon.status = null;
      if (b.cure && ctx.entity?.confused) ctx.entity.confused = 0;
      let heal = b.heal ?? Math.floor(max * (b.healFrac ?? 0));
      if (heal && mon.ability === 'cheekPouch') heal += Math.floor(max / 3);
      if (heal) mon.hp = Math.min(max, mon.hp + heal);
      if (b.boost && ctx.entity?.stages) ctx.entity.stages[b.boost] = Math.min(6, (ctx.entity.stages[b.boost] ?? 0) + 1);
      if (b.cdReset && ctx.entity?.cds) { const i = ctx.entity.cds.indexOf(Math.max(...ctx.entity.cds)); ctx.entity.cds[i] = 0; }
      out.push({ kind: 'berry', amount: heal, note: it.name });
      mon.item = null;
    }
  }
  // orbes
  if (it?.selfStatus && !mon.status) {
    t.orb += dt;
    if (t.orb >= TURNO_S && !statusImmune(ctx.entity ?? mon, it.selfStatus)) { mon.status = it.selfStatus; out.push({ kind: 'status', note: it.name }); t.orb = 0; }
  }
  // efeitos por turno
  if (t.turn >= TURNO_S) {
    t.turn -= TURNO_S;
    const weather = ctx.weather !== undefined ? ctx.weather : amb.weather();
    let d = 0;
    if (it?.tickHeal) d += it.poisonOnly && !mon.types.includes('poison') ? -Math.floor(max / 8) : Math.floor(max * it.tickHeal);
    if (mon.ability === 'rainDish' && weather === 'rain') d += Math.floor(max / 16);
    if (mon.ability === 'iceBody' && weather === 'snow') d += Math.floor(max / 16);
    if (mon.ability === 'poisonHeal' && (mon.status === 'psn' || mon.status === 'tox')) d += Math.floor(max / 8);
    if (d > 0 && mon.hp < max) { const h = Math.min(max - mon.hp, Math.max(1, d)); mon.hp += h; out.push({ kind: 'heal', amount: h, note: it?.tickHeal ? it.name : '' }); }
    else if (d < 0 && mon.ability !== 'magicGuard') { const l = Math.min(mon.hp, -d); mon.hp -= l; out.push({ kind: 'hurt', amount: l, note: it?.name ?? '' }); }
  }
  return out;
}

// Dano de estado por turno (veneno 1/8, veneno grave crescente, queimadura 1/16), para o combate chamar.
export function statusTick(mon, entity = null) {
  const max = mon.stats.hp;
  if (mon.ability === 'magicGuard' || mon.fainted) return 0;
  if (mon.status === 'psn' && mon.ability !== 'poisonHeal') return Math.max(1, Math.floor(max / 8));
  if (mon.status === 'tox' && mon.ability !== 'poisonHeal') {
    const n = entity ? (entity.toxN = Math.min(15, (entity.toxN ?? 0) + 1)) : 1;
    return Math.max(1, Math.floor((max * n) / 16));
  }
  if (mon.status === 'brn') return Math.max(1, Math.floor(max / 16));
  return 0;
}

export { STATUS_PT };
