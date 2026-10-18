// Verificação dos dados e das mecânicas. Rodar da raiz do repositório:
//   node tools/verificar_dados.mjs
// (também roda no navegador: <script type="module" src="tools/verificar_dados.mjs"></script>, saída no console)
import { SPECIES, BIOME_ENCOUNTERS, NIGHT_ENCOUNTERS } from '../src/data/species.js';
import { MOVES, KINDS } from '../src/data/moves.js';
import { ITEMS } from '../src/data/items.js';
import { ABILITIES } from '../src/data/abilities.js';
import { TYPE_PT } from '../src/data/types.js';
import { NATURES } from '../src/data/natures.js';
import { Mon } from '../src/data/mon.js';
import { calcDamage, calcStats, catchChance, expForLevel, evolutionFor, useItem, learnMethod } from '../src/mechanics/index.js';

const erros = [], avisos = [];
const falha = (m) => erros.push(m);
const ok = (cond, m) => { if (!cond) falha(m); };
const IV31 = [31, 31, 31, 31, 31, 31];

// ---------------------------------------------------------------- espécies
const dexes = Object.keys(SPECIES).map(Number);
for (const d of dexes) {
  const s = SPECIES[d], n = `#${d} ${s.name}`;
  ok(s.name && s.types?.length >= 1 && s.types.every((t) => TYPE_PT[t]), `${n}: tipos inválidos`);
  ok(s.base?.length === 6 && s.base.every((v) => v > 0), `${n}: status base`);
  ok(s.evs?.length === 6 && s.evs.reduce((a, b) => a + b, 0) >= 1, `${n}: EVs ao ser derrotado`);
  ok(s.catchRate >= 1 && s.catchRate <= 255, `${n}: taxa de captura`);
  ok(['s', 'mf', 'f', 'ms', 'e', 'fl'].includes(s.growth), `${n}: curva de crescimento`);
  ok(s.learn.length > 0, `${n}: sem golpes por nível`);
  for (const [lv, id] of s.learn) ok(MOVES[id] && lv >= 0 && lv <= 100, `${n}: golpe por nível inválido ${id}`);
  for (const id of [...s.tm, ...s.tutor]) ok(MOVES[id], `${n}: golpe de MT/ensino inválido ${id}`);
  for (const a of [...s.abilities, s.hidden].filter(Boolean)) ok(ABILITIES[a], `${n}: habilidade ${a} sem dados`);
  ok(s.abilities.length >= 1, `${n}: sem habilidade`);
  ok(Mon.defaultMoves(d, 5).length >= 1, `${n}: nenhum golpe no nível 5`);
  for (const e of s.evo) {
    ok(SPECIES[e.to], `${n}: evolui para espécie inexistente ${e.to}`);
    if (e.item) ok(ITEMS[e.item], `${n}: item de evolução inexistente ${e.item}`);
    if (e.move) ok(MOVES[e.move] && learnMethod(d, e.move), `${n}: golpe de evolução ${e.move} não existe ou não é aprendido`);
    ok(e.level || e.item || e.friendship || e.move || e.moveType, `${n}: evolução sem condição`);
  }
  if (!s.pmd) avisos.push(`${n} não tem sprite no PMD SpriteCollab`);
}
for (const tab of [BIOME_ENCOUNTERS, NIGHT_ENCOUNTERS]) for (const [b, rows] of Object.entries(tab)) for (const [d] of rows) ok(SPECIES[d], `encontro ${b}: espécie ${d} não existe`);

// ---------------------------------------------------------------- golpes
for (const [id, m] of Object.entries(MOVES)) {
  const n = `golpe ${id}`;
  ok(m.name && m.en, `${n}: sem nome`);
  ok(TYPE_PT[m.type], `${n}: tipo ${m.type}`);
  ok(['phys', 'spec', 'status'].includes(m.cat), `${n}: categoria`);
  ok(KINDS.includes(m.kind), `${n}: kind "${m.kind}" não executável`);
  ok(m.cd > 0 && m.cd <= 12, `${n}: cd ${m.cd}`);
  if (m.kind !== 'self') ok(m.range > 0, `${n}: sem alcance`);
  if (m.kind === 'proj') ok(m.speed > 0, `${n}: projétil sem velocidade`);
  if (m.cat !== 'status') ok(m.power > 0 || m.fixed != null || m.eff?.ohko, `${n}: golpe de dano sem poder`);
  ok(m.acc === null || (m.acc > 0 && m.acc <= 1), `${n}: precisão`);
  ok(m.pp > 0, `${n}: PP`);
  if (m.name === m.en && !/^[A-Z][a-z]+$/.test(m.en)) avisos.push(`${n}: sem nome em português`);
}

// ---------------------------------------------------------------- itens
for (const [id, it] of Object.entries(ITEMS)) {
  ok(it.name && it.cat, `item ${id}: sem nome/categoria`);
  if (it.cat === 'tm') ok(MOVES[it.move], `item ${id}: MT de golpe inexistente ${it.move}`);
  if (it.cat === 'ball') ok(it.ball != null, `item ${id}: bola sem regra`);
}

// ---------------------------------------------------------------- fórmulas (casos calculados à mão)
const P = { weather: null, terrain: null, crit: false, perHit: false };
function caso(nome, got, want) {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${pass ? 'OK ' : 'ERRO'} ${nome}: ${JSON.stringify(got)}${pass ? '' : ' (esperado ' + JSON.stringify(want) + ')'}`);
  if (!pass) falha(`${nome}: obtido ${JSON.stringify(got)}, esperado ${JSON.stringify(want)}`);
}
// Status: exemplo do Bulbapedia (Garchomp nível 78, Firme)
caso('Status de Garchomp Nv78 (Bulbapedia)', calcStats(SPECIES[445].base, [24, 12, 30, 16, 23, 5], [74, 190, 91, 48, 84, 23], 78, 'adamant'),
  { hp: 289, atk: 278, def: 193, spa: 135, spd: 171, spe: 171 });
// 1) Charizard Nv50 Modesta 252 AtqE (AtqE 177) Lança-Chamas (90) em Venusaur Nv50 (DefE 120):
//    ⌊2·50/5+2⌋ = 22; ⌊⌊22·90·177/120⌋/50⌋+2 = ⌊2920/50⌋+2 = 60; STAB 1,5; Fogo × Planta/Veneno = 2
//    máximo: 60 → 90 → 180; mínimo: ⌊60·85/100⌋ = 51 → 76,5 ⇒ 76 → 152
const zard = new Mon(6, 50, { ivs: IV31, evs: [0, 0, 0, 252, 0, 0], nature: 'modest', ability: 'blaze' });
const venu = new Mon(3, 50, { ivs: IV31, nature: 'hardy', ability: 'overgrow' });
caso('1) Lança-Chamas: Charizard → Venusaur (mín, máx)', [calcDamage(zard, venu, 'flamethrower', { ...P, roll: 0.85 }).damage, calcDamage(zard, venu, 'flamethrower', { ...P, roll: 1 }).damage], [152, 180]);
// 2) Garchomp Nv100 Alegre 252 Atq (Atq 359) Terremoto (100) em Aggron Nv100 (Def 396), Aço/Pedra (×4):
//    ⌊2·100/5+2⌋ = 42; ⌊⌊42·100·359/396⌋/50⌋+2 = ⌊3807/50⌋+2 = 78; STAB → 117 → ×4 = 468;
//    mínimo: ⌊78·0,85⌋ = 66 → 99 → 396
const chomp = new Mon(445, 100, { ivs: IV31, evs: [0, 252, 0, 0, 4, 252], nature: 'jolly', ability: 'roughSkin' });
const aggron = new Mon(306, 100, { ivs: IV31, nature: 'hardy', ability: 'rockHead' });
caso('2) Terremoto: Garchomp → Aggron (mín, máx)', [calcDamage(chomp, aggron, 'earthquake', { ...P, roll: 0.85 }).damage, calcDamage(chomp, aggron, 'earthquake', { ...P, roll: 1 }).damage], [396, 468]);
//    mesmo golpe com Robustez e PS cheios: fica com 1 PS (281 − 1 = 280)
const aggronS = new Mon(306, 100, { ivs: IV31, nature: 'hardy', ability: 'sturdy' });
caso('2b) Robustez segura o golpe com 1 PS', calcDamage(chomp, aggronS, 'earthquake', { ...P, roll: 1 }).damage, aggronS.stats.hp - 1);
// 3) Gengar Nv50 Tímida 252 AtqE (182) Bola Sombria (80) crítico, Orbe da Vida, em Alakazam Nv50 (DefE 115):
//    ⌊⌊22·80·182/115⌋/50⌋+2 = ⌊2785/50⌋+2 = 57; crítico ⌊57·1,5⌋ = 85; STAB 127,5 ⇒ 127; ×2 = 254;
//    Orbe da Vida 254·5324/4096 = 330,15 ⇒ 330
const gengar = new Mon(94, 50, { ivs: IV31, evs: [0, 0, 0, 252, 0, 0], nature: 'timid', ability: 'cursedBody', item: 'lifeOrb' });
const zam = new Mon(65, 50, { ivs: IV31, nature: 'hardy', ability: 'synchronize' });
caso('3) Bola Sombria crítica com Orbe da Vida: Gengar → Alakazam', calcDamage(gengar, zam, 'shadowBall', { ...P, roll: 1, crit: true }).damage, 330);
caso('3b) Orbe da Vida tira 1/10 dos PS de quem usa', calcDamage(gengar, zam, 'shadowBall', { ...P, roll: 1, crit: true }).recoil, Math.floor(gengar.stats.hp / 10));
// imunidades
caso('Levitação anula Terra (Mismagius)', calcDamage(chomp, new Mon(429, 50, { ability: 'levitate' }), 'earthquake', P).eff, 0);
caso('Normal não acerta Fantasma', calcDamage(zard, gengar, 'tackle', P).damage, 0);
// ritmo do tempo real: o dano final é multiplicado pelo DMG do combate
caso('Ritmo 0,55 no caso 1 (máx)', calcDamage(zard, venu, 'flamethrower', { ...P, roll: 1, pace: 0.55 }).damage, Math.round(180 * 0.55));
// experiência: totais no nível 100 de cada curva
caso('XP no nível 100 (errática, rápida, média-rápida, média-lenta, lenta, flutuante)',
  ['e', 'f', 'mf', 'ms', 's', 'fl'].map((g) => expForLevel(g, 100)), [600000, 800000, 1000000, 1059860, 1250000, 1640000]);
// captura: taxa 45, PS cheios, Poké Bola, nível 30, sem estado → a = 15; chance = (15/255)^(3/4)
const sel = new Mon(1, 30, { ivs: IV31, nature: 'hardy' });
caso('Captura de Bulbasaur Nv30 com PS cheios (Poké Bola)', Math.round(catchChance(sel, 'pokeBall').chance * 1e4) / 1e4, Math.round(Math.pow(15 / 255, 0.75) * 1e4) / 1e4);
caso('Ultra Bola dobra o "a"', catchChance(sel, 'ultraBall').a, 30);
caso('Bola Mestra sempre captura', catchChance(sel, 'masterBall').chance, 1);
caso('Bola de Rede ×3,5 em Água', catchChance(new Mon(7, 30, { ivs: IV31 }), 'netBall').a, 52.5);

// ---------------------------------------------------------------- Mon: EVs, evolução, itens, save
const m = new Mon(4, 15, { ivs: IV31, nature: 'hardy', ability: 'blaze' });
m.gainEvs([300, 300, 0, 0, 0, 0]);
caso('EVs: 252 por status, 510 no total', [m.evs[0], m.evs[1], m.evs.reduce((a, b) => a + b, 0)], [252, 252, 504]);
m.gainEvs([0, 0, 10, 0, 0, 0]);
caso('EVs param em 510', m.evs.reduce((a, b) => a + b, 0), 510);
const ev = new Mon(4, 15, { ivs: IV31 }).gainXp(expForLevel('ms', 16) - expForLevel('ms', 15));
caso('Charmander evolui no nível 16', ev.find((e) => e.type === 'evolve')?.to, 5);
const pika = new Mon(25, 10);
caso('Pedra do Trovão em Pikachu', useItem(pika, 'thunderStone').events[0]?.to, 26);
const eevee = new Mon(133, 20, { friendship: 200 });
caso('Eevee com amizade, de dia → Espeon; de noite → Umbreon',
  [evolutionFor(eevee, 'level', { time: 'day' })?.to, evolutionFor(eevee, 'level', { time: 'night' })?.to], [196, 197]);
const onix = new Mon(95, 20);
caso('Onix + Revestimento Metálico (troca adaptada) → Steelix', useItem(onix, 'metalCoat').events[0]?.to, 208);
const leg = Mon.from({ dex: 4, level: 8, ivs: [1, 2, 3, 4, 5, 6], nick: null, xp: 300, moves: ['scratch', 'golpeQueNaoExiste'], status: null, hp: 10, uid: 'abc' });
caso('Save antigo migra (IVs, golpes válidos, EVs zerados, não shiny)', [leg.ivs, leg.moves, leg.evs, leg.shiny, leg.hp, leg.uid], [[1, 2, 3, 4, 5, 6], ['scratch'], [0, 0, 0, 0, 0, 0], false, 10, 'abc']);
const back = Mon.from(JSON.parse(JSON.stringify(m)));
caso('toJSON → from preserva tudo', JSON.stringify(back.toJSON()), JSON.stringify(m.toJSON()));
ok(Object.keys(NATURES).length === 25, '25 naturezas');

// ---------------------------------------------------------------- resumo
const kinds = {};
for (const mv of Object.values(MOVES)) kinds[mv.kind] = (kinds[mv.kind] ?? 0) + 1;
console.log(`\n${dexes.length} espécies, ${Object.keys(MOVES).length} golpes, ${Object.keys(ITEMS).length} itens (${Object.values(ITEMS).filter((i) => i.cat === 'tm').length} MTs), ${Object.keys(ABILITIES).length} habilidades`);
console.log('golpes por kind:', JSON.stringify(kinds));
if (avisos.length) console.log(`\n${avisos.length} aviso(s):\n  ` + avisos.join('\n  '));
if (erros.length) {
  console.log(`\n${erros.length} ERRO(S):\n  ` + erros.slice(0, 80).join('\n  '));
  globalThis.process?.exit?.(1);
} else console.log('\nTudo certo.');
