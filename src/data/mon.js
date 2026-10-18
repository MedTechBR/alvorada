import { SPECIES, speciesOf, genderForm, isBattleForm } from './species.js';
import { MOVES } from './moves.js';
import { NATURES, randomNature } from './natures.js';
import { itemInfo } from './items.js';
import { STAT_KEYS, calcStats, randomIvs, addEvs, expForLevel, expYield } from '../mechanics/stats.js';
import { defaultMoves, movesAtLevel, learnMove, canLearn } from '../mechanics/learn.js';
import { evolutionFor } from '../mechanics/evolve.js';
import { useItem } from '../mechanics/items.js';

export const SHINY_ODDS = 1 / 4096;
export const HIDDEN_ABILITY_ODDS = 1 / 50; // selvagens com habilidade oculta (adaptação: raro, não impossível)
export const SAVE_VERSION = 2;

function rollGender(rate, rng = Math.random) {
  if (rate == null || rate < 0) return null;
  if (rate === 0) return 'm';
  if (rate === 8) return 'f';
  return rng() * 8 < rate ? 'f' : 'm';
}
function rollAbility(sp, rng = Math.random) {
  if (sp.hidden && rng() < HIDDEN_ABILITY_ODDS) return sp.hidden;
  const a = sp.abilities ?? [];
  return a[Math.floor(rng() * a.length)] ?? sp.hidden ?? null;
}

// Um Pokémon da equipe ou selvagem: IVs, EVs, natureza, habilidade, gênero, shiny, amizade, item equipado.
// Status pela fórmula das gerações 3+; XP, EVs e evolução como nos jogos.
//
// Formas: `form` é a forma permanente (null = padrão; 'alola', 'galar', 'hisui', 'paldea', 'heat', 'midnight'…), guardada
// no save só quando existe (save antigo sem `form` = forma padrão). `tempForm` é a forma de batalha (Mega, Primitiva,
// Gigantamax, Zen…): não é gravada; quem cuida da mecânica põe e tira com setTempForm(). `sp` já devolve a forma certa
// (tipos, status, habilidades, golpes, evoluções) e `spriteKey` diz qual sprite usar (26 ou "26-alola").
export class Mon {
  constructor(dex, level, opts = {}) {
    if (!SPECIES[dex]) throw new Error(`Espécie desconhecida: ${dex}`);
    const rng = opts.rng ?? Math.random;
    this.dex = dex;
    this.form = opts.form && SPECIES[dex].forms[opts.form] && !isBattleForm(dex, opts.form) ? opts.form : null;
    this.tempForm = null;
    this.gender = opts.gender !== undefined ? opts.gender : rollGender(SPECIES[dex].genderRate, rng);
    if (!this.form) this.form = genderForm(dex, this.gender);
    const sp = this.sp;
    this.level = Math.max(1, Math.min(100, level | 0));
    this.ivs = opts.ivs ?? randomIvs(rng);
    this.evs = opts.evs ?? [0, 0, 0, 0, 0, 0];
    this.nature = NATURES[opts.nature] ? opts.nature : randomNature(rng);
    this.ability = opts.ability ?? rollAbility(sp, rng);
    this.shiny = opts.shiny ?? rng() < SHINY_ODDS;
    this.friendship = opts.friendship ?? sp.friendship ?? 50;
    this.item = opts.item ?? null;
    this.ball = opts.ball ?? 'pokeBall';
    this.metLevel = opts.metLevel ?? this.level;
    this.nick = opts.nick ?? null;
    this.ot = opts.ot ?? null; // treinador original (Pokémon de troca); null = o jogador
    this.xp = opts.xp ?? expForLevel(sp.growth, this.level);
    this.moves = opts.moves ?? Mon.defaultMoves(dex, this.level, this.form);
    this.status = opts.status ?? null; // par | slp | psn | tox | brn | frz
    this.calc();
    this.hp = opts.hp ?? this.stats.hp;
    this.uid = opts.uid ?? Math.random().toString(36).slice(2, 10);
  }

  get sp() { return speciesOf(this.dex, this.tempForm ?? this.form); }
  // chave do sprite (src/sprites/pmd.js): 26 ou "26-alola"; a forma de batalha vale enquanto estiver ativa
  get spriteKey() { return this.sp.key; }
  get formKind() { return this.sp.kind ?? null; }
  // Põe (ou tira, com null) a forma de batalha. Mantém a fração de PS. Devolve true se mudou.
  setTempForm(form) {
    const f = form && SPECIES[this.dex].forms[form] ? form : null;
    if (f === this.tempForm) return false;
    this.tempForm = f;
    this.calc();
    return true;
  }
  get name() { return this.nick || this.sp.name; }
  get types() { return this.sp.types; }
  get fainted() { return this.hp <= 0; }
  get natureName() { return NATURES[this.nature]?.name ?? this.nature; }

  static defaultMoves(dex, level, form = null) { return defaultMoves(dex, level, form); }

  calc() {
    const oldMax = this.stats?.hp;
    this.stats = calcStats(this.sp.base, this.ivs, this.evs, this.level, this.nature);
    if (oldMax != null && this.hp != null) this.hp = Math.max(this.hp > 0 ? 1 : 0, Math.min(this.stats.hp, this.hp + (this.stats.hp - oldMax)));
  }

  xpToNext() { return expForLevel(this.sp.growth, this.level + 1); }
  xpFloor() { return expForLevel(this.sp.growth, this.level); }

  // EVs ganhos (Bracelete Macho dobra; itens do Poder somam 8). Devolve o que entrou.
  gainEvs(gain) {
    const it = itemInfo(this.item);
    const g = gain.map((v, i) => v * (it?.evMult ?? 1) + (it?.evBonus?.[i] ?? 0));
    const got = addEvs(this.evs, g);
    if (got.some((v) => v)) this.calc();
    return got;
  }

  addFriendship(n) {
    const it = itemInfo(this.item);
    let k = n;
    if (n > 0) { if (it?.friendshipMult) k *= it.friendshipMult; if (this.ball === 'luxuryBall') k += 1; }
    this.friendship = Math.max(0, Math.min(255, Math.round(this.friendship + k)));
    return this.friendship;
  }

  // Ganha XP; devolve a lista de eventos: { type: 'level' | 'learn' | 'evolve' }.
  // ctx (opcional): { time, weather, partyTypes } para evoluções por hora, chuva e equipe.
  gainXp(amount, ctx = {}) {
    const events = [];
    if (this.level >= 100) return events;
    this.xp += Math.max(0, Math.floor(amount));
    while (this.level < 100 && this.xp >= this.xpToNext()) {
      this.level++;
      this.calc();
      this.addFriendship(this.friendship < 100 ? 5 : this.friendship < 200 ? 3 : 2);
      events.push({ type: 'level', level: this.level });
      for (const id of movesAtLevel(this.dex, this.level, this.form)) if (!this.moves.includes(id) && MOVES[id]) events.push({ type: 'learn', move: id });
    }
    if (events.length) {
      const ev = evolutionFor(this, 'level', ctx);
      if (ev) events.push({ type: 'evolve', to: ev.to, form: ev.form });
    }
    return events;
  }

  // XP que este Pokémon dá ao ser derrotado. Sem `victor`: fórmula da geração 3 (compatível com o jogo antigo).
  // Com `victor` (o Mon que venceu): fórmula escalonada das gerações 7+, com Ovo da Sorte.
  xpYield(trainer = false, victor = null, { share = 1 } = {}) {
    return expYield(this.sp.baseExp, this.level, {
      trainer, victorLevel: victor?.level ?? null, share,
      luckyEgg: itemInfo(victor?.item)?.expMult > 1,
    });
  }

  // Tudo o que acontece quando este Pokémon derrota `foe`: XP, EVs e amizade. Devolve { xp, evs, events }.
  defeat(foe, ctx = {}) {
    const xp = foe.xpYield(!!ctx.trainer, this, ctx);
    const evs = this.gainEvs(foe.sp.evs ?? [0, 0, 0, 0, 0, 0]);
    this.addFriendship(1);
    const events = this.gainXp(xp, ctx);
    return { xp, evs, events };
  }

  // form: forma de destino (evo[].form, ex.: Rattata de Alola → Raticate de Alola); sem ela, a forma padrão
  // (ou a do gênero, ex.: Espurr fêmea → Meowstic fêmea)
  evolveTo(dex, form = null) {
    if (!SPECIES[dex]) return [];
    this.tempForm = null;
    const oldSp = this.sp, ratio = this.stats.hp ? this.hp / this.stats.hp : 1;
    const slot = oldSp.abilities.indexOf(this.ability);
    this.dex = dex;
    this.form = form && SPECIES[dex].forms[form] ? form : genderForm(dex, this.gender);
    const sp = this.sp;
    if (this.ability === oldSp.hidden && sp.hidden) this.ability = sp.hidden;
    else if (slot >= 0) this.ability = sp.abilities[Math.min(slot, sp.abilities.length - 1)] ?? this.ability;
    this.stats = null;
    this.calc();
    this.hp = Math.max(1, Math.round(this.stats.hp * ratio));
    // golpes aprendidos ao evoluir (nível 0) e no nível atual
    const events = [];
    for (const id of [...movesAtLevel(dex, 0, this.form), ...movesAtLevel(dex, this.level, this.form)]) if (!this.moves.includes(id) && MOVES[id]) events.push({ type: 'learn', move: id });
    return events;
  }

  learn(id, replaceIndex = -1) { return learnMove(this, id, replaceIndex); }
  // Pode aprender (por nível, MT ou ensino)? O menu usa isso para as MTs.
  canLearn(id) { return canLearn(this, id); }

  // Usa um item da mochila neste Pokémon (src/mechanics/items.js). Evolução vem como evento { type: 'evolve' }.
  use(itemId, ctx = {}) { return useItem(this, itemId, ctx); }

  heal() { this.hp = this.stats.hp; this.status = null; }

  // Troca a forma permanente (itens de forma, como o Catálogo Rotom). Recalcula os status mantendo a fração de PS.
  setForm(form) {
    const f = form && SPECIES[this.dex].forms[form] && !isBattleForm(this.dex, form) ? form : null;
    if (f === this.form) return false;
    const ratio = this.stats.hp ? this.hp / this.stats.hp : 1;
    this.form = f;
    this.stats = null;
    this.calc();
    this.hp = this.hp <= 0 ? 0 : Math.max(1, Math.round(this.stats.hp * ratio));
    const ab = this.sp.abilities;
    if (!ab.includes(this.ability) && this.ability !== this.sp.hidden) this.ability = ab[0] ?? this.ability;
    return true;
  }

  toJSON() {
    const o = { v: SAVE_VERSION, dex: this.dex, level: this.level, ivs: this.ivs, evs: this.evs, nature: this.nature,
      ability: this.ability, gender: this.gender, shiny: this.shiny, friendship: this.friendship, item: this.item,
      ball: this.ball, metLevel: this.metLevel, nick: this.nick, ...(this.ot ? { ot: this.ot } : {}), xp: this.xp, moves: this.moves, status: this.status,
      hp: this.hp, uid: this.uid };
    if (this.form) o.form = this.form; // só quando existe: o save de quem não tem forma fica igual ao antigo
    return o;
  }

  // Lê um save. Saves antigos (sem `v`): mantém nível, IVs, XP, golpes, PS e uid; sorteia natureza/gênero/
  // habilidade uma vez; EVs zerados; nunca vira shiny por migração; golpes que não existem mais são trocados.
  static from(o) {
    if (!SPECIES[o.dex]) throw new Error(`Espécie desconhecida no save: ${o.dex}`);
    const opts = { ...o };
    // forma: a gravada, se ainda existir (forma de batalha nunca fica gravada); sem forma = padrão ou a do gênero
    opts.form = o.form && SPECIES[o.dex].forms[o.form] && !isBattleForm(o.dex, o.form) ? o.form : (o.gender != null ? genderForm(o.dex, o.gender) : null);
    const sp = speciesOf(o.dex, opts.form);
    if (!o.v) {
      opts.evs = [0, 0, 0, 0, 0, 0];
      opts.shiny = false;
      opts.friendship = sp.friendship ?? 50;
      opts.item = null;
    }
    if (!Array.isArray(opts.ivs) || opts.ivs.length !== 6) opts.ivs = undefined;
    if (!Array.isArray(opts.evs) || opts.evs.length !== 6) opts.evs = undefined;
    const moves = (o.moves ?? []).filter((id) => MOVES[id]);
    opts.moves = moves.length ? [...new Set(moves)].slice(0, 4) : undefined;
    if (o.ability && !(sp.abilities.includes(o.ability) || sp.hidden === o.ability)) opts.ability = undefined;
    const m = new Mon(o.dex, o.level, opts);
    if (o.hp != null) m.hp = Math.max(0, Math.min(m.stats.hp, o.hp));
    return m;
  }
}

export function moveInfo(id) { return MOVES[id]; }
export { STAT_KEYS };
