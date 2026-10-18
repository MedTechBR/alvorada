// Regras puras (sem PixiJS) de Mega Evolução, Reversão Primitiva, Dynamax e Gigantamax. Usadas pelo combate local
// (src/combat/poder.js), pelo árbitro do PvP (src/net/arbiter.js) e pelas Tocas de Luz (src/world/tocas.js).
//
// Tempo real: 1 "turno" dos jogos = TURNO_S (3 s, src/mechanics/tempo.js).
// - Dynamax dura 3 turnos nos jogos (3 Max Golpes). Aqui: DMAX_S = 3 turnos + 3 s = 12 s. Os 9 s secos ficavam curtos
//   no tempo real: o crescimento leva ~1,4 s em que ninguém age, e entre um Max Golpe e outro o jogador ainda esquiva
//   e se posiciona. Com a recarga única de MAX_CD (= 1 turno, 3 s) entre Max Golpes, dá 3 golpes jogando normal e
//   4 jogando perfeito, o mesmo "peso" dos 3 turnos dos jogos.
// - PS do Dynamax: ×2 (nível Dynamax 10 dos jogos: 1,5 + 0,05 × 10), mantendo a fração de PS ao entrar e ao sair.
// - Clima e campo dos Max Golpes: 5 turnos = 15 s.
import { SPECIES } from '../data/species.js';
import { MOVES } from '../data/moves.js';
import { ITEMS } from '../data/items.js';
import { TURNO_S, turnos } from './tempo.js';

export const DMAX_S = turnos(3) + 3;   // 12 s
export const DMAX_HP = 2;              // PS ×2
export const MAX_CD = TURNO_S;         // recarga única entre Max Golpes (s)
export const CAMPO_S = turnos(5);      // clima/campo dos Max Golpes (s)
// Espécies que não usam Dynamax nos jogos
const SEM_DMAX = new Set([888, 889, 890]);

const itemOf = (mon) => (mon?.item ? ITEMS[mon.item] : null);
const formsOf = (dex) => SPECIES[dex]?.forms ?? {};

// Forma Mega que o Pokémon assume agora (ou null). Pela Mega Pedra segurada (X/Y pela pedra; Meowstic, Tatsugiri
// e Magearna pela forma: 'femaleMega', 'droopyMega'...) ou, no Rayquaza, por saber Ascensão do Dragão (sem pedra).
export function megaFormFor(mon) {
  if (!mon || mon.tempForm) return null;
  const F = formsOf(mon.dex);
  for (const [id, f] of Object.entries(F)) if (f.kind === 'mega' && f.megaMove && mon.moves?.includes(f.megaMove)) return id;
  const it = itemOf(mon); if (!it?.mega) return null;
  const cands = it.mega.filter(([d, f]) => d === mon.dex && F[f]?.kind === 'mega').map(([, f]) => f);
  if (!cands.length) return null;
  if (mon.form && cands.includes(mon.form + 'Mega')) return mon.form + 'Mega';
  return cands[0];
}
// Reversão Primitiva (Groudon com o Orbe Vermelho, Kyogre com o Orbe Azul): acontece sozinha ao entrar em campo
export function primalFormFor(mon) {
  if (!mon || mon.tempForm) return null;
  const it = itemOf(mon);
  const p = it?.primal?.find(([d]) => d === mon.dex);
  return p && formsOf(mon.dex)[p[1]] ? p[1] : null;
}
// Mega e Primitiva são formas de batalha que valem até o fim da luta (ou o desmaio)
export const isMegaKind = (mon) => ['mega', 'primal'].includes(mon?.formKind);

export function canDynamax(mon) {
  if (!mon || mon.fainted || mon.dmaxK || SEM_DMAX.has(mon.dex)) return false;
  return !isMegaKind(mon);
}
// Forma Gigantamax (Pokémon com fator G: mon.gmax). Toxtricity Grave e Urshifu Fluxo têm a própria.
export function gmaxFormFor(mon) {
  if (!mon?.gmax) return null;
  const F = formsOf(mon.dex);
  if (mon.form && F[mon.form + 'Gmax']?.kind === 'gmax') return mon.form + 'Gmax';
  return F.gmax?.kind === 'gmax' ? 'gmax' : null;
}
export const hasGmaxForm = (dex) => Object.values(formsOf(dex)).some((f) => f.kind === 'gmax');

// ---------- Max Golpes ----------
export const MAX_BY_TYPE = {
  normal: 'maxStrike', fire: 'maxFlare', water: 'maxGeyser', grass: 'maxOvergrowth', electric: 'maxLightning', ice: 'maxHailstorm',
  fighting: 'maxKnuckle', poison: 'maxOoze', ground: 'maxQuake', flying: 'maxAirstream', psychic: 'maxMindstorm', bug: 'maxFlutterby',
  rock: 'maxRockfall', ghost: 'maxPhantasm', dragon: 'maxWyrmwind', dark: 'maxDarkness', steel: 'maxSteelspike', fairy: 'maxStarfall',
};
// Efeito em campo de cada Max Golpe (o tipo define): clima, campo, ou estágios nos adversários/aliados por perto
export const MAX_FX = {
  maxFlare: { weather: 'sun' }, maxGeyser: { weather: 'rain' }, maxRockfall: { weather: 'sand' }, maxHailstorm: { weather: 'snow' },
  maxLightning: { terrain: 'electric' }, maxOvergrowth: { terrain: 'grassy' }, maxMindstorm: { terrain: 'psychic' }, maxStarfall: { terrain: 'misty' },
  maxStrike: { foes: { spe: -1 } }, maxFlutterby: { foes: { spa: -1 } }, maxPhantasm: { foes: { def: -1 } }, maxDarkness: { foes: { spd: -1 } }, maxWyrmwind: { foes: { atk: -1 } },
  maxKnuckle: { allies: { atk: 1 } }, maxAirstream: { allies: { spe: 1 } }, maxOoze: { allies: { spa: 1 } }, maxQuake: { allies: { spd: 1 } }, maxSteelspike: { allies: { def: 1 } },
  maxGuard: { guard: true },
};
// Poder do Max Golpe pelo poder do golpe de base (tabela da geração 8; Lutador e Venenoso têm a própria)
export function maxPower(base) {
  const p = base.power ?? 0, low = base.type === 'fighting' || base.type === 'poison';
  if (!p || base.varPower || base.fixed) return low ? 75 : 100;
  const T = low ? [70, 75, 80, 85, 90, 95, 100] : [90, 100, 110, 120, 130, 140, 150];
  return T[p <= 40 ? 0 : p <= 50 ? 1 : p <= 60 ? 2 : p <= 70 ? 3 : p <= 100 ? 4 : p <= 140 ? 5 : 6];
}
// Max Golpe que ocupa o espaço `slot` de um Pokémon em Dynamax: { id, mv } (mv = cópia ajustada: poder, categoria
// e recarga do golpe de base; `maxFx` = efeito em campo). G-Max Golpe quando a forma Gigantamax tem um do mesmo tipo.
const CACHE = new Map();
export function maxMoveFor(mon, slot) {
  const baseId = mon?.moves?.[slot], base = MOVES[baseId];
  if (!base) return null;
  const gm = mon.formKind === 'gmax' ? mon.sp.gmaxMove : null;
  let id;
  if (base.cat === 'status') id = 'maxGuard';
  else if (gm && MOVES[gm]?.type === base.type) id = gm;
  else id = MAX_BY_TYPE[base.type] ?? 'maxStrike';
  const key = id + ':' + baseId;
  if (CACHE.has(key)) return CACHE.get(key);
  const M = MOVES[id];
  const power = id === 'maxGuard' ? 0 : M.gmax && M.power > 140 ? M.power : maxPower(base);
  const mv = { ...M, id, power, cat: id === 'maxGuard' ? 'status' : base.cat, cd: MAX_CD, range: M.range ?? 7, maxBase: baseId, maxFx: MAX_FX[id] ?? M.eff ?? null, eff: undefined, max: true };
  if (id === 'maxGuard') mv.kind = 'self';
  const out = { id, mv };
  CACHE.set(key, out);
  return out;
}
