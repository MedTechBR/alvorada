// Cálculo de dano completo das gerações 5+ (com os arredondamentos oficiais), adaptado ao tempo real
// só no fim, pelo multiplicador de ritmo `pace` (o DMG do combate).
//
// Dano base = ⌊⌊⌊2·Nível/5 + 2⌋ · Poder · A / D⌋ / 50⌋ + 2
// depois, nesta ordem: alvos múltiplos (0,75) → clima → crítico (1,5) → aleatório (85–100%) → STAB (1,5)
// → efetividade → queimadura (0,5) → outros (itens, habilidades, barreiras, frutas) → mínimo 1 → ritmo.
//
// `atk` e `def` podem ser a entidade do mapa ({ mon, stages, … }) ou um Mon direto.
import { MOVES, powerPerHit } from '../data/moves.js';
import { effectiveness } from '../data/types.js';
import { itemInfo } from '../data/items.js';
import { SPECIES } from '../data/species.js';
import { stageMult, CRIT_CHANCE } from './stats.js';
import { abilityImmunity, abilityOf, typesOf, weightOf, grounded, onContact, statusImmune } from './abilities.js';
import * as amb from './ambiente.js';
import { REALTIME_PACE } from './tempo.js';

// arredonda para o inteiro mais próximo, com .5 para baixo (pokeRound dos jogos)
export const pokeRound = (x) => (x - Math.floor(x) > 0.5 ? Math.ceil(x) : Math.floor(x));
const apply = (v, mod) => pokeRound((v * Math.round(mod * 4096)) / 4096);

const HP_ORDER = ['fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark'];
// Tipo do Poder Oculto pelos IVs (fórmula das gerações 3–7). IVs na ordem [PS, Atq, Def, AtqE, DefE, Vel].
export function hiddenPowerType(ivs) {
  const [hp, at, df, sa, sd, sp] = ivs.map((v) => v & 1);
  return HP_ORDER[Math.floor(((hp + 2 * at + 4 * df + 8 * sp + 16 * sa + 32 * sd) * 15) / 63)];
}

const PINCH = { overgrow: 'grass', blaze: 'fire', torrent: 'water', swarm: 'bug' };
const SLICING = ['slash', 'cut', 'airSlash', 'airCutter', 'leafBlade', 'nightSlash', 'psychoCut', 'xScissor', 'sacredSword', 'razorShell', 'aquaCutter', 'stoneAxe', 'solarBlade', 'furyCutter', 'razorLeaf', 'crossPoison', 'kowtowCleave', 'bitterBlade', 'ceaselessEdge', 'behemothBlade', 'psyblade'];

function side(x) {
  const mon = x?.mon ?? x;
  return {
    x, mon, stages: x?.stages ?? {}, ab: mon.ability ?? null, it: itemInfo(mon.item), types: typesOf(x),
    hp: mon.hp, max: mon.stats.hp, level: mon.level, status: mon.status,
  };
}

function statOf(S, key, stage, crit, attacking) {
  let st = S.stages[key] ?? 0;
  if (stage === false) st = 0;
  if (crit) st = attacking ? Math.max(0, st) : Math.min(0, st);
  return Math.floor(S.mon.stats[key] * stageMult(st));
}

function moveType(mv, A, weather, terrain) {
  if (mv.varPower === 'hiddenPower') return hiddenPowerType(A.mon.ivs ?? [31, 31, 31, 31, 31, 31]);
  if (mv.varPower === 'weatherBall') return { rain: 'water', sun: 'fire', sand: 'rock', snow: 'ice' }[weather] ?? 'normal';
  if (mv.varPower === 'terrainPulse' && grounded(A.x)) return { electric: 'electric', grassy: 'grass', misty: 'fairy', psychic: 'psychic' }[terrain] ?? 'normal';
  if (mv.type === 'normal' && A.ab === 'pixilate') return 'fairy';
  if (mv.type === 'normal' && A.ab === 'refrigerate') return 'ice';
  return mv.type;
}

function basePower(mv, A, D, opts, rng) {
  let p = (opts.perHit === false ? mv.power : powerPerHit(mv)) || mv.power || 60;
  const ratio = (a, b) => a / Math.max(1, b);
  switch (mv.varPower) {
    case 'weight': { const w = weightOf(D.x); p = w < 10 ? 20 : w < 25 ? 40 : w < 50 ? 60 : w < 100 ? 80 : w < 200 ? 100 : 120; break; }
    case 'weightRatio': { const r = ratio(weightOf(A.x), weightOf(D.x)); p = r >= 5 ? 120 : r >= 4 ? 100 : r >= 3 ? 80 : r >= 2 ? 60 : 40; break; }
    case 'gyro': p = Math.min(150, Math.floor((25 * statOf(D, 'spe')) / Math.max(1, statOf(A, 'spe'))) + 1); break;
    case 'electro': { const r = ratio(statOf(A, 'spe'), statOf(D, 'spe')); p = r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40; break; }
    case 'hpHigh': p = Math.max(1, Math.floor((150 * A.hp) / A.max)); break;
    case 'hpLow': { const k = Math.floor((48 * A.hp) / A.max); p = k <= 1 ? 200 : k <= 4 ? 150 : k <= 9 ? 100 : k <= 16 ? 80 : k <= 32 ? 40 : 20; break; }
    case 'friendship': p = Math.max(1, Math.floor((A.mon.friendship ?? 70) / 2.5)); break;
    case 'unfriendship': p = Math.max(1, Math.floor((255 - (A.mon.friendship ?? 70)) / 2.5)); break;
    case 'magnitude': { const r = rng() * 100; p = r < 5 ? 10 : r < 15 ? 30 : r < 35 ? 50 : r < 65 ? 70 : r < 85 ? 90 : r < 95 ? 110 : 150; break; }
    case 'present': { const r = rng(); p = r < 0.4 ? 40 : r < 0.7 ? 80 : 120; break; }
    case 'boosts': p = 20 + 20 * Object.values(A.stages).reduce((s, v) => s + Math.max(0, v | 0), 0); break;
    case 'boostsTarget': p = Math.min(200, 60 + 20 * Object.values(D.stages).reduce((s, v) => s + Math.max(0, v | 0), 0)); break;
    case 'hex': if (D.status) p *= 2; break;
    case 'facade': if (A.status) p *= 2; break;
    case 'acrobatics': if (!A.mon.item) p *= 2; break;
    case 'venoshock': if (D.status === 'psn' || D.status === 'tox') p *= 2; break;
    case 'brine': if (D.hp * 2 <= D.max) p *= 2; break;
    case 'knockOff': if (D.mon.item) p *= 1.5; break;
    case 'rageFist': p = Math.min(350, 50 + 50 * (A.x?.timesHit ?? 0)); break;
    case 'weatherBall': if (opts.weather) p = 100; break;
    case 'terrainPulse': if (opts.terrain && grounded(A.x)) p = 100; break;
    case 'hpTarget': p = Math.max(1, Math.floor((100 * D.hp) / D.max)); break;
    case 'tripleAxel': p = 40; break; // 20/40/60 por acerto → média
    default: break;
  }
  return p;
}

function fixedDamage(mv, A, D) {
  const f = mv.fixed;
  if (typeof f === 'number') return f;
  switch (f) {
    case 'level': return A.level;
    case 'half': return Math.max(1, Math.floor(D.hp / 2));
    case 'endeavor': return Math.max(0, D.hp - A.hp);
    case 'gambit': return A.hp;
    case 'counter': return Math.max(A.level, Math.floor((A.x?.lastHurt ?? 0) * 1.5));
    default: return A.level;
  }
}

/**
 * Calcula o dano de `mv` (id ou objeto) de `atk` em `def`. Não muda nada (função pura).
 * opts: { rng, crit (forçar), roll (0,85–1), pace (ritmo do tempo real), weather, terrain, spread, screens: { phys, spec },
 *         perHit (false = poder oficial inteiro, sem dividir entre os projéteis do tempo real) }
 * Devolve { damage, raw, eff, crit, stab, type, immune, absorb, survive, consume[], recoil, heal, flinch, contact, secondary, notes[] }
 */
export function calcDamage(atk, def, mv, opts = {}) {
  if (typeof mv === 'string') mv = MOVES[mv];
  const rng = opts.rng ?? Math.random;
  const pace = opts.pace ?? 1;
  const weather = opts.weather !== undefined ? opts.weather : amb.weather();
  const terrain = opts.terrain !== undefined ? opts.terrain : amb.terrain();
  const A = side(atk), D = side(def);
  const r = { damage: 0, raw: 0, eff: 1, crit: false, stab: 1, type: mv?.type, immune: null, absorb: null, survive: null,
    consume: [], recoil: 0, heal: 0, flinch: false, contact: null, secondary: mv?.eff, notes: [] };
  if (!mv || mv.cat === 'status') return r;
  const type = r.type = moveType(mv, A, weather, terrain);
  const phys = mv.cat === 'phys';
  const flags = mv.flags ?? [];
  const contact = flags.includes('contact') && !A.it?.noContactEffects;

  // ---- imunidades
  const imm = abilityImmunity(def, type, mv);
  if (imm) { r.eff = 0; r.immune = 'ability'; r.absorb = imm; r.notes.push(imm.note); return r; }
  if (type === 'ground' && D.it?.balloon) { r.eff = 0; r.immune = 'item'; r.notes.push('Balão de Ar'); return r; }
  let eff = effectiveness(type, D.types);
  if (eff === 0 && A.ab === 'scrappy' && (type === 'normal' || type === 'fighting') && D.types.includes('ghost')) {
    eff = effectiveness(type, D.types.filter((t) => t !== 'ghost'));
  }
  if (mv.en === 'Freeze-Dry' && D.types.includes('water')) eff *= 4; // Liofilização: super efetivo em Água
  r.eff = eff;
  if (eff === 0) { r.immune = 'type'; return r; }

  // ---- dano fixo e nocaute em um golpe
  if (mv.eff?.ohko) {
    if (D.ab === 'sturdy' || A.level < D.level || rng() * 100 >= 30 + A.level - D.level) { r.immune = 'miss'; r.eff = eff; r.notes.push('Errou!'); r.damage = 0; return r; }
    r.raw = D.hp; r.damage = D.hp; r.notes.push('Nocaute!'); return r;
  }
  if (mv.fixed != null) {
    r.raw = fixedDamage(mv, A, D);
    r.damage = Math.max(1, Math.round(r.raw * pace));
    return finish(r, A, D, mv, contact, rng);
  }

  // ---- poder
  let power = basePower(mv, A, D, { ...opts, weather, terrain }, rng);
  let pm = 1; // modificadores de poder
  if (A.ab === 'technician' && power <= 60) pm *= 1.5;
  if (A.ab === 'ironFist' && flags.includes('punch')) pm *= 1.2;
  if (A.ab === 'strongJaw' && flags.includes('bite')) pm *= 1.5;
  if (A.ab === 'megaLauncher' && flags.includes('pulse')) pm *= 1.5;
  if (A.ab === 'toughClaws' && contact) pm *= 1.3;
  if (A.ab === 'sharpness' && SLICING.includes(camelName(mv))) pm *= 1.5;
  if (A.ab === 'reckless' && mv.eff?.recoil) pm *= 1.2;
  if (A.ab === 'sheerForce' && hasSecondary(mv)) pm *= 1.3;
  if ((A.ab === 'pixilate' || A.ab === 'refrigerate') && mv.type === 'normal') pm *= 1.2;
  if (A.ab === 'sandForce' && weather === 'sand' && ['rock', 'ground', 'steel'].includes(type)) pm *= 1.3;
  if (D.ab === 'drySkin' && type === 'fire') pm *= 1.25;
  if (A.it?.typeBoost === type) pm *= 4915 / 4096;
  if (A.it?.powerMult?.[mv.cat]) pm *= A.it.powerMult[mv.cat];
  if (A.x?.metronomeChain && A.it?.metronome) pm *= Math.min(2, 1 + 0.2 * A.x.metronomeChain);
  if (terrain && grounded(atk)) {
    if ((terrain === 'electric' && type === 'electric') || (terrain === 'grassy' && type === 'grass') || (terrain === 'psychic' && type === 'psychic')) pm *= 5325 / 4096;
  }
  if (terrain === 'misty' && type === 'dragon' && grounded(def)) pm *= 0.5;
  if (terrain === 'grassy' && ['earthquake', 'bulldoze', 'magnitude'].includes(camelName(mv)) && grounded(def)) pm *= 0.5;
  power = Math.max(1, apply(power, pm));

  // ---- crítico
  let cs = (mv.critUp ?? 0) + (A.it?.critUp ?? 0) + (A.ab === 'superLuck' ? 1 : 0) + (atk?.critStage ?? A.stages.crit ?? 0) + ((atk?.critBoost ?? 0) > 0 ? 2 : 0);
  let crit = opts.crit ?? rng() < CRIT_CHANCE[Math.min(3, Math.max(0, cs))];
  if (D.ab === 'battleArmor' || D.ab === 'shellArmor') crit = false;
  r.crit = crit;

  // ---- status de ataque e defesa
  let atkKey = phys ? 'atk' : 'spa', defKey = phys ? 'def' : 'spd';
  const id = camelName(mv);
  if (id === 'psyshock' || id === 'psystrike' || id === 'secretSword') defKey = 'def';
  let attacker = A;
  if (id === 'foulPlay') attacker = D;
  if (id === 'bodyPress') atkKey = 'def';
  let a = statOf(attacker, atkKey, D.ab === 'unaware' ? false : undefined, crit, true);
  let d = statOf(D, defKey, A.ab === 'unaware' ? false : undefined, crit, false);
  // modificadores de ataque
  let am = 1;
  if (phys && (A.ab === 'hugePower' || A.ab === 'purePower')) am *= 2;
  if (phys && A.ab === 'hustle') am *= 1.5;
  if (phys && A.ab === 'guts' && A.status) am *= 1.5;
  if (A.it?.statMult?.[atkKey] && atkKey !== 'def') am *= A.it.statMult[atkKey];
  if (!phys && A.ab === 'solarPower' && weather === 'sun') am *= 1.5;
  if (type === 'fire' && atk?.flashFire) am *= 1.5;
  if (PINCH[A.ab] === type && A.hp * 3 <= A.max) am *= 1.5;
  if (D.ab === 'thickFat' && (type === 'fire' || type === 'ice')) am *= 0.5;
  a = Math.max(1, apply(a, am));
  // modificadores de defesa
  let dm = 1;
  if (defKey === 'def' && D.ab === 'furCoat') dm *= 2;
  if (defKey === 'def' && D.ab === 'marvelScale' && D.status) dm *= 1.5;
  if (D.it?.statMult?.[defKey]) dm *= D.it.statMult[defKey];
  if (D.it?.eviolite && SPECIES[D.mon.dex]?.evo?.length) dm *= 1.5;
  if (defKey === 'spd' && weather === 'sand' && D.types.includes('rock')) dm *= 1.5;
  if (defKey === 'def' && weather === 'snow' && D.types.includes('ice')) dm *= 1.5;
  d = Math.max(1, apply(d, dm));

  // ---- fórmula
  let dmg = Math.floor(Math.floor((Math.floor((2 * A.level) / 5 + 2) * power * a) / d) / 50) + 2;
  if (opts.spread) dmg = apply(dmg, 0.75);
  if (weather === 'rain' && type === 'water' || weather === 'sun' && type === 'fire') dmg = apply(dmg, 1.5);
  else if (weather === 'rain' && type === 'fire' || weather === 'sun' && type === 'water') dmg = apply(dmg, 0.5);
  if (crit) dmg = apply(dmg, A.ab === 'sniper' ? 2.25 : 1.5);
  const roll = opts.roll != null ? Math.round(opts.roll * 100) : 85 + Math.floor(rng() * 16);
  dmg = Math.floor((dmg * roll) / 100);
  if (A.types.includes(type)) { r.stab = A.ab === 'adaptability' ? 2 : 1.5; dmg = apply(dmg, r.stab); }
  dmg = Math.floor(dmg * eff);
  if (phys && A.status === 'brn' && A.ab !== 'guts' && mv.varPower !== 'facade') dmg = apply(dmg, 0.5);
  // outros
  let om = 1;
  const scr = opts.screens ?? def?.screens;
  if (!crit && scr && (scr[mv.cat] || scr.both)) om *= 0.5;
  if (D.ab === 'multiscale' && D.hp >= D.max) om *= 0.5;
  if ((D.ab === 'filter' || D.ab === 'solidRock') && eff > 1) om *= 0.75;
  if (A.ab === 'tintedLens' && eff < 1) om *= 2;
  if (A.it?.superMult && eff > 1) om *= A.it.superMult;
  if (A.it?.damageMult) om *= A.it.damageMult;
  const berry = D.it?.berry;
  if (berry?.when === 'hit' && berry.resist === type && (eff > 1 || berry.any)) {
    om *= 0.5; r.consume.push({ who: 'def', item: D.mon.item }); r.notes.push(D.it.name);
  }
  if (om !== 1) dmg = apply(dmg, om);
  dmg = Math.max(1, dmg);
  r.raw = dmg;
  r.damage = Math.max(1, Math.round(dmg * pace));
  return finish(r, A, D, mv, contact, rng);
}

// sobrevivência (Robustez, Faixa do Foco, Bandana do Foco) e efeitos de item/habilidade depois do golpe
function finish(r, A, D, mv, contact, rng) {
  if (r.damage >= D.hp && D.hp > 0) {
    if (D.hp >= D.max && D.ab === 'sturdy') { r.damage = D.hp - 1; r.survive = 'sturdy'; r.notes.push('Robustez'); }
    else if (D.hp >= D.max && D.it?.sash) { r.damage = D.hp - 1; r.survive = 'focusSash'; r.consume.push({ who: 'def', item: D.mon.item }); r.notes.push(D.it.name); }
    else if (D.it?.band && rng() < D.it.band) { r.damage = D.hp - 1; r.survive = 'focusBand'; r.notes.push(D.it.name); }
  }
  if (D.it?.balloon && r.damage > 0) { r.consume.push({ who: 'def', item: D.mon.item }); r.notes.push('O balão estourou!'); }
  if (A.it?.recoilFrac && A.ab !== 'magicGuard' && r.damage > 0) r.recoil += Math.max(1, Math.floor(A.max * A.it.recoilFrac));
  if (A.it?.healOnHit && r.damage > 0) r.heal += Math.max(1, Math.floor(r.damage * A.it.healOnHit));
  if (A.it?.flinch && r.damage > 0 && !mv.eff?.flinch && rng() < A.it.flinch) r.flinch = true;
  if (contact && r.damage > 0) {
    r.contact = onContact(A.x, D.x, rng);
    if (r.contact?.recoilFrac && A.ab !== 'magicGuard') r.recoil += Math.max(1, Math.floor(A.max * r.contact.recoilFrac));
    if (D.it?.contactDamage && A.ab !== 'magicGuard') r.recoil += Math.max(1, Math.floor(A.max * D.it.contactDamage));
    if (A.ab === 'poisonTouch' && !r.contact && rng() < 0.3) r.contact = { status: 'psn', target: 'def', note: 'Toque Venenoso' };
  }
  // efeitos secundários: Força Bruta tira, Pó Protetor protege o alvo
  if (A.ab === 'sheerForce' && hasSecondary(mv)) r.secondary = stripSecondary(mv.eff);
  else if (D.ab === 'shieldDust' && mv.eff) r.secondary = stripSecondary(mv.eff, true);
  if (A.ab === 'rockHead' && r.secondary?.recoil) r.secondary = { ...r.secondary, recoil: 0 };
  return r;
}

function camelName(mv) {
  if (mv.id) return mv.id;
  const en = (mv.en ?? '').replace(/[’'.]/g, '').split(/[\s-]+/).filter(Boolean);
  return en.map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('');
}
const hasSecondary = (mv) => { const e = mv.eff ?? {}; return !!(e.status || e.flinch || e.confuse || (e.stat && (!e.self || e.by > 0))); };
// tira os efeitos extras (targetOnly: só os que caem no alvo, para Pó Protetor)
function stripSecondary(e = {}, targetOnly = false) {
  const o = { ...e };
  delete o.status; delete o.chance; delete o.toxic; delete o.flinch; delete o.confuse;
  if (!o.self || (!targetOnly && o.by > 0)) { delete o.stat; delete o.by; delete o.stats; delete o.statChance; }
  return o;
}

/**
 * calcDamage + o que precisa acontecer no mesmo instante do golpe (para o combate em tempo real):
 * gasta itens (frutas de resistência, Faixa do Foco, balão), come a fruta de PS se o golpe deixar o alvo
 * abaixo do limite, aplica absorções (Absorção de Água, Para-raios, Fogo Repentino) e estados de contato.
 * O combate continua aplicando o dano (hurt), r.recoil no atacante, r.heal no atacante e r.flinch.
 */
export function resolveHit(atk, def, mv, opts = {}) {
  const r = calcDamage(atk, def, mv, opts);
  const am = atk?.mon ?? atk, dm = def?.mon ?? def;
  for (const c of r.consume) { const m = c.who === 'def' ? dm : am; if (m.item === c.item) m.item = null; }
  if (r.absorb) {
    if (r.absorb.heal) dm.hp = Math.min(dm.stats.hp, dm.hp + Math.floor(dm.stats.hp * r.absorb.heal));
    if (r.absorb.flashFire && def) def.flashFire = true;
    if (r.absorb.boost && def?.stages) for (const [k, v] of Object.entries(r.absorb.boost)) def.stages[k] = Math.min(6, (def.stages[k] ?? 0) + v);
  }
  // fruta de PS (Oran, Sitrus, Figy…): comida no instante do golpe se ele deixar o alvo no limite
  const it = itemInfo(dm.item), b = it?.berry;
  if (b && r.damage > 0 && (b.when === 'hp50' || b.when === 'hp25')) {
    const after = dm.hp - r.damage, lim = b.when === 'hp50' ? 0.5 : (dm.ability === 'gluttony' ? 0.5 : 0.25);
    if (after > 0 && after <= dm.stats.hp * lim) {
      let heal = b.heal ?? Math.floor(dm.stats.hp * (b.healFrac ?? 0));
      if (dm.ability === 'cheekPouch') heal += Math.floor(dm.stats.hp / 3);
      if (heal) dm.hp += heal; // somado antes do dano: o resultado final é o mesmo
      if (b.boost && def?.stages) def.stages[b.boost] = Math.min(6, (def.stages[b.boost] ?? 0) + 1);
      r.notes.push(it.name); r.berryHeal = heal; dm.item = null;
    }
  }
  // estado por contato (Estática etc. pegam no atacante; Toque Venenoso pega no alvo)
  if (r.contact?.status) {
    const tgt = r.contact.target === 'def' ? dm : am;
    if (!tgt.status && !statusImmune(r.contact.target === 'def' ? def : atk, r.contact.status)) { tgt.status = r.contact.status; r.notes.push(r.contact.note); }
  }
  if (r.contact?.stat && atk?.stages) for (const [k, v] of Object.entries(r.contact.stat)) atk.stages[k] = Math.max(-6, (atk.stages[k] ?? 0) + v);
  if (def && r.damage > 0) def.timesHit = (def.timesHit ?? 0) + 1;
  return r;
}

/**
 * Versão compacta para o tempo real e para o árbitro do PvP (sem efeitos colaterais):
 * devolve { dmg, eff, crit } como o calcDamage antigo do combate, mais `r` com o resultado completo.
 */
export function realtimeDamage(atk, def, mv, { rng = Math.random, pace = REALTIME_PACE, ...opts } = {}) {
  const r = calcDamage(atk, def, mv, { ...opts, rng, pace });
  return { dmg: r.immune ? 0 : r.damage, eff: r.eff, crit: r.crit, r };
}
