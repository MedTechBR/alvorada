// Golpes: dados oficiais da PokéAPI (src/data/gen/golpes.js) + forma de execução em tempo real.
//
// Campos que o combate lê (formato antigo, mantido):
//   name, type, cat ('phys' | 'spec' | 'status'), power, kind, speed, range, cd, count, hits, critUp, acc, eff
//   kind: melee (avanço curto), dash (investida longa), proj (projétil), cone (sopro em leque),
//         wave (onda ao redor), self (efeito em si), cloud (nuvem/área lenta), rain (cai sobre o alvo),
//         quake (tremor ao redor), multi (vários golpes seguidos)
//   cd: recarga em segundos. eff: efeito secundário ({ status, chance, stat, by, self, flinch, drain, recoil, confuse… }).
// Campos novos (dados oficiais): en, acc (0–1, null = nunca erra), pp, priority, target, flags, effectChance,
//   minHits/maxHits, fixed (dano fixo), varPower (poder variável), effectId, gen, desc (pt-BR).
// Dicas novas de tempo real (o combate pode usar quando quiser): stream (jato contínuo), homing (nunca erra →
//   persegue o alvo), aimSpread (dispersão da mira, vem da precisão), big (tamanho do projétil), surge (onda que
//   avança), eff.semi ('fly' | 'dig' | 'dive' | 'vanish'), eff.charge (segundos carregando), eff.protect (segundos
//   de escudo), eff.recharge (segundos parado depois), eff.switch (troca depois do golpe).
//
// Regras automáticas (tools/pokeapi/importar.py): especial à distância → proj ou cone; contato → melee ou dash;
// "todos os adversários" → wave (ou quake se for de Terra/Pedra físico); clima → rain; campo e armadilhas → cloud;
// estado → self (em si) ou proj de estado; poder alto e PP baixo → cd maior.
import { GOLPES } from './gen/golpes.js';

// Ajustes finos herdados da versão anterior do jogo (já testados no mapa).
const ANTIGOS = {
  tackle: { kind: 'melee', range: 1.8, cd: 1.1 },
  scratch: { kind: 'melee', range: 1.6, cd: 1 },
  growl: { kind: 'wave', range: 6, cd: 4.5 },
  tailWhip: { kind: 'wave', range: 6, cd: 4.5 },
  leer: { kind: 'wave', range: 6, cd: 4.5 },
  screech: { kind: 'wave', range: 7, cd: 6 },
  scaryFace: { kind: 'wave', range: 6, cd: 5.5 },
  quickAttack: { kind: 'dash', range: 6, cd: 1.6 },
  hyperFang: { kind: 'melee', range: 1.8, cd: 2.6 },
  furyAttack: { kind: 'multi', range: 1.8, cd: 2.2 },
  furySwipes: { kind: 'multi', range: 1.7, cd: 2.2 },
  slam: { kind: 'melee', range: 2.6, cd: 2.8 },
  rage: { kind: 'melee', range: 1.8, cd: 1 },
  bind: { kind: 'melee', range: 2.4, cd: 4 },
  harden: { kind: 'self', cd: 4 },
  defenseCurl: { kind: 'self', cd: 4 },
  withdraw: { kind: 'self', cd: 4 },
  focusEnergy: { kind: 'self', cd: 8 },
  doubleTeam: { kind: 'self', cd: 6 },
  smokescreen: { kind: 'cloud', range: 9, cd: 5 },
  supersonic: { kind: 'proj', speed: 14, range: 12, cd: 6 },
  whirlwind: { kind: 'cone', range: 6, cd: 7 },
  sandAttack: { kind: 'cone', range: 5, cd: 4.5 },
  mudSport: { kind: 'self', cd: 9 },
  magnitude: { kind: 'quake', range: 5, cd: 4 },
  ember: { kind: 'proj', speed: 16, range: 13, cd: 1.3 },
  waterGun: { kind: 'proj', speed: 18, range: 13, cd: 1.3 },
  bubble: { kind: 'proj', speed: 9, range: 11, cd: 1.5, count: 3 },
  vineWhip: { kind: 'melee', range: 4.2, cd: 1.3 },
  razorLeaf: { kind: 'proj', speed: 20, range: 14, cd: 1.8, count: 3 },
  leechSeed: { kind: 'proj', speed: 11, range: 11, cd: 7 },
  poisonPowder: { kind: 'cloud', range: 8, cd: 6 },
  sleepPowder: { kind: 'cloud', range: 8, cd: 9 },
  stunSpore: { kind: 'cloud', range: 8, cd: 7 },
  stringShot: { kind: 'proj', speed: 15, range: 11, cd: 4 },
  poisonSting: { kind: 'proj', speed: 20, range: 12, cd: 0.9 },
  twineedle: { kind: 'proj', speed: 22, range: 12, cd: 1.8, count: 2 },
  confusion: { kind: 'proj', speed: 15, range: 12, cd: 1.6 },
  gust: { kind: 'cone', range: 6, cd: 1.4 },
  peck: { kind: 'melee', range: 1.7, cd: 0.9 },
  bite: { kind: 'melee', range: 1.8, cd: 1.8 },
  pursuit: { kind: 'dash', range: 7, cd: 1.8 },
  metalClaw: { kind: 'melee', range: 1.8, cd: 1.6 },
  thunderShock: { kind: 'proj', speed: 26, range: 13, cd: 1.3 },
  thunderWave: { kind: 'proj', speed: 18, range: 11, cd: 7 },
  lowKick: { kind: 'melee', range: 1.8, cd: 1.5 },
  karateChop: { kind: 'melee', range: 1.8, cd: 1.5 },
  rockThrow: { kind: 'rain', range: 13, cd: 2.2 },
  rockTomb: { kind: 'rain', range: 13, cd: 3 },
  wingAttack: { kind: 'dash', range: 5, cd: 1.6 },
  bugBite: { kind: 'melee', range: 1.7, cd: 1.6 },
  furyCutter: { kind: 'melee', range: 1.9, cd: 1 },
  absorb: { kind: 'proj', speed: 14, range: 11, cd: 1 },
  megaDrain: { kind: 'proj', speed: 14, range: 12, cd: 1.6 },
  growth: { kind: 'self', cd: 5 },
  mudSlap: { kind: 'proj', speed: 16, range: 10, cd: 1.1 },
  mudShot: { kind: 'proj', speed: 15, range: 12, cd: 1.8 },
  doubleKick: { kind: 'multi', range: 1.8, cd: 1.7, hits: 2 },
  takeDown: { kind: 'dash', range: 6, cd: 2.8 },
  pound: { kind: 'melee', range: 1.6, cd: 1 },
  splash: { kind: 'self', cd: 2 },
  astonish: { kind: 'melee', range: 1.8, cd: 1.2 },
  hypnosis: { kind: 'proj', speed: 12, range: 11, cd: 8 },
  stomp: { kind: 'melee', range: 2, cd: 2 },
  rockSmash: { kind: 'melee', range: 1.8, cd: 1.3 },
  bulldoze: { kind: 'quake', range: 5, cd: 3 },
  flameWheel: { kind: 'dash', range: 7, cd: 1.9 },
  roar: { kind: 'cone', range: 6, cd: 7 },
  poisonJab: { kind: 'melee', range: 1.9, cd: 2.2 },
  crushClaw: { kind: 'melee', range: 2, cd: 2.2 },
  twister: { kind: 'cone', range: 6, cd: 1.8 },
  disarmingVoice: { kind: 'wave', range: 6, cd: 1.6 },
  agility: { kind: 'self', cd: 6 },
  waterPulse: { kind: 'proj', speed: 17, range: 13, cd: 1.9 },
  spark: { kind: 'dash', range: 6, cd: 1.9 },
  lick: { kind: 'melee', range: 1.7, cd: 1.1 },
  shadowSneak: { kind: 'dash', range: 7, cd: 1.6 },
  smog: { kind: 'cloud', range: 8, cd: 2.4 },
  teleport: { kind: 'self', cd: 4 },
  aquaJet: { kind: 'dash', range: 7, cd: 1.5 },
  iceShard: { kind: 'proj', speed: 26, range: 12, cd: 1.2 },
  dragonBreath: { kind: 'cone', range: 6, cd: 2 },
  leafage: { kind: 'proj', speed: 18, range: 12, cd: 1.2 },
  fireBlast: { kind: 'proj', speed: 17, range: 15, cd: 3.4 },
  dragonPulse: { kind: 'proj', speed: 19, range: 14, cd: 2.4 },
  airSlash: { kind: 'proj', speed: 24, range: 13, cd: 1.6 },
  fairyWind: { kind: 'cone', range: 6, cd: 1.4 },
};

// Golpes famosos corrigidos à mão para ficarem com a cara certa no tempo real.
const FAMOSOS = {
  // Lança-Chamas: jato contínuo de fogo (muitas chamas pequenas; o poder é dividido entre elas)
  flamethrower: { kind: 'proj', stream: true, count: 6, speed: 21, range: 9, cd: 2.4 },
  // Hidro Bomba: um jato só, grosso, lento de recarregar
  hydroPump: { kind: 'proj', count: 1, speed: 16, range: 15, cd: 3.4, big: 2.2 },
  // Terremoto: tremor forte em volta de quem usa
  earthquake: { kind: 'quake', range: 7.5, cd: 4 },
  // Surfar: uma onda que se espalha em volta
  surf: { kind: 'wave', range: 7, cd: 3.2, surge: true },
  muddyWater: { kind: 'wave', range: 6.5, cd: 3, surge: true },
  // Investida: corrida curta contra o alvo
  tackle: { kind: 'dash', range: 4, cd: 1.1 },
  // Voar: sobe (fica intocável), depois mergulha no alvo
  fly: { kind: 'dash', range: 9, cd: 4.5, eff: { charge: 0.7, semi: 'fly' } },
  bounce: { kind: 'dash', range: 8, cd: 4.2, eff: { charge: 0.7, semi: 'fly' } },
  // Cavar: some no chão e surge debaixo do alvo
  dig: { kind: 'dash', range: 9, cd: 4.5, eff: { charge: 0.9, semi: 'dig' } },
  dive: { kind: 'dash', range: 9, cd: 4.5, eff: { charge: 0.9, semi: 'dive' } },
  phantomForce: { kind: 'dash', range: 9, cd: 4.8, eff: { charge: 0.9, semi: 'vanish' } },
  // Proteção / Detectar: escudo de 1,2 s (eff.protect)
  protect: { kind: 'self', cd: 6 },
  detect: { kind: 'self', cd: 6 },
  // Trovão cai do céu sobre o alvo; Relâmpago e raios são quase instantâneos
  thunder: { kind: 'rain', range: 13, cd: 3.6 },
  thunderbolt: { kind: 'proj', speed: 30, range: 13 },
  iceBeam: { kind: 'proj', speed: 30, range: 14 },
  hyperBeam: { kind: 'proj', speed: 30, range: 15, big: 2.2 },
  solarBeam: { kind: 'proj', speed: 30, range: 15, big: 2 },
  // sopros largos
  blizzard: { kind: 'cone', range: 7, cd: 3.4 },
  heatWave: { kind: 'cone', range: 6.5, cd: 2.8 },
  // pedras caindo
  rockSlide: { kind: 'rain', range: 12, cd: 2.6 },
  stoneEdge: { kind: 'rain', range: 12, cd: 3.2 },
  // fúria descontrolada: vários golpes em sequência
  outrage: { kind: 'multi', hits: 3, range: 2.2, cd: 4.2 },
  thrash: { kind: 'multi', hits: 3, range: 2.2, cd: 3.8 },
  petalDance: { kind: 'multi', hits: 3, range: 2.2, cd: 4 },
  // redemoinhos que prendem: área sobre o alvo
  fireSpin: { kind: 'cloud', range: 10, cd: 4 },
  whirlpool: { kind: 'cloud', range: 10, cd: 4 },
  sandTomb: { kind: 'cloud', range: 10, cd: 4 },
  infestation: { kind: 'cloud', range: 10, cd: 4 },
  // chicotes alcançam longe
  powerWhip: { kind: 'melee', range: 4.2, cd: 2.6 },
  // investidas de corpo inteiro
  bodySlam: { kind: 'dash', range: 5, cd: 2.4 },
  extremeSpeed: { kind: 'dash', range: 9, cd: 2 },
  // explosões em volta de quem usa
  explosion: { kind: 'wave', range: 6, cd: 8 },
  selfDestruct: { kind: 'wave', range: 5, cd: 7 },
  // Prensa Dura (geração 9, sem flags na PokéAPI): golpe de contato
  hardPress: { kind: 'melee', range: 1.9, cd: 2.2, flags: ['contact', 'protect'] },
  // Ataque Veloz: estrelas que perseguem o alvo
  swift: { kind: 'proj', count: 5, speed: 18, range: 13, cd: 1.8 },
};

const merge = (a, b) => {
  const o = { ...a, ...b };
  if (a?.eff || b?.eff) o.eff = { ...(a?.eff ?? {}), ...(b?.eff ?? {}) };
  return o;
};

export const MOVES = {};
for (const [id, g] of Object.entries(GOLPES)) {
  const m = merge(merge(g, ANTIGOS[id]), FAMOSOS[id]);
  m.id = id;
  if (m.acc === null && m.cat !== 'status') m.homing = true;
  m.aimSpread = m.acc == null ? 0 : Math.round((1 - m.acc) * 0.8 * 100) / 100;
  if (!m.eff) delete m.eff;
  MOVES[id] = m;
}

export const KINDS = ['proj', 'melee', 'multi', 'cone', 'dash', 'wave', 'quake', 'cloud', 'rain', 'self'];

export function moveInfo(id) { return MOVES[id]; }

// Poder por acerto. Golpes que nos jogos acertam uma vez só, mas aqui saem em vários projéteis ou golpes
// (Lança-Chamas, Folha Navalha, Bolha, Ultraje…), dividem o poder entre eles. Golpes de vários acertos
// de verdade (Projétil de Sementes, Chute Duplo) mantêm o poder oficial por acerto.
export function powerPerHit(mv) {
  const p = mv.power ?? 0;
  const n = mv.kind === 'proj' ? mv.count ?? 1 : mv.kind === 'multi' ? mv.hits ?? 3 : 1;
  if (n <= 1 || (mv.maxHits ?? 1) > 1) return p;
  return Math.max(1, Math.round(p / n));
}
