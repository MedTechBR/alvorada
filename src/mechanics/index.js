// Mecânicas dos jogos tradicionais, em funções puras, para o combate em tempo real e a interface usarem.
export * from './stats.js';
export { calcDamage, resolveHit, hiddenPowerType, pokeRound } from './damage.js';
export { catchChance, ballModifier, rollShakes, QUICK_S, UNAWARE_BONUS } from './capture.js';
export { learnMethod, canLearn, learnMove, useTM, defaultMoves, movesAtLevel, compatibleTMs } from './learn.js';
export { evolutionFor, describeEvolution, FRIENDSHIP_EVOLVE } from './evolve.js';
export { useItem, giveItem, heldTick, statusTick } from './items.js';
export { abilityImmunity, statusImmune, blocksStatDrop, onEntry, onContact, speedMult, weightOf, grounded } from './abilities.js';
export { setAmbiente, getAmbiente, timeOfDay, isNight, weather, terrain } from './ambiente.js';
export { TURNO_S, turnos } from './tempo.js';
