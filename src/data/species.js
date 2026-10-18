// Espécies do trecho Pallet → Pewter. Status-base oficiais (HP, Atq, Def, AtqE, DefE, Vel).
// Golpes por nível seguem FireRed/LeafGreen. "body" orienta a animação procedural.
// "height" é a altura oficial em metros; o jogo amplia um pouco os pequenos para ficarem legíveis.

export const SPECIES = {
  1: { name: 'Bulbasaur', types: ['grass', 'poison'], base: [45, 49, 49, 65, 65, 45], catchRate: 45, baseExp: 64,
    growth: 'ms', height: 0.7, body: 'quad', evolve: { level: 16, to: 2 },
    learn: [[1, 'tackle'], [4, 'growl'], [7, 'leechSeed'], [10, 'vineWhip'], [15, 'poisonPowder'], [15, 'sleepPowder'], [20, 'razorLeaf']] },
  2: { name: 'Ivysaur', types: ['grass', 'poison'], base: [60, 62, 63, 80, 80, 60], catchRate: 45, baseExp: 142,
    growth: 'ms', height: 1.0, body: 'quad', evolve: { level: 32, to: 3 },
    learn: [[1, 'tackle'], [1, 'growl'], [7, 'leechSeed'], [10, 'vineWhip'], [15, 'poisonPowder'], [15, 'sleepPowder'], [22, 'razorLeaf']] },
  4: { name: 'Charmander', types: ['fire'], base: [39, 52, 43, 60, 50, 65], catchRate: 45, baseExp: 62,
    growth: 'ms', height: 0.6, body: 'biped', evolve: { level: 16, to: 5 },
    learn: [[1, 'scratch'], [1, 'growl'], [7, 'ember'], [13, 'metalClaw'], [19, 'smokescreen']] },
  5: { name: 'Charmeleon', types: ['fire'], base: [58, 64, 58, 80, 65, 80], catchRate: 45, baseExp: 142,
    growth: 'ms', height: 1.1, body: 'biped', evolve: { level: 36, to: 6 },
    learn: [[1, 'scratch'], [1, 'growl'], [7, 'ember'], [13, 'metalClaw'], [20, 'smokescreen']] },
  7: { name: 'Squirtle', types: ['water'], base: [44, 48, 65, 50, 64, 43], catchRate: 45, baseExp: 63,
    growth: 'ms', height: 0.5, body: 'biped', evolve: { level: 16, to: 8 },
    learn: [[1, 'tackle'], [4, 'tailWhip'], [7, 'bubble'], [10, 'withdraw'], [13, 'waterGun'], [18, 'bite']] },
  8: { name: 'Wartortle', types: ['water'], base: [59, 63, 80, 65, 80, 58], catchRate: 45, baseExp: 142,
    growth: 'ms', height: 1.0, body: 'biped', evolve: { level: 36, to: 9 },
    learn: [[1, 'tackle'], [1, 'tailWhip'], [7, 'bubble'], [10, 'withdraw'], [13, 'waterGun'], [19, 'bite']] },
  10: { name: 'Caterpie', types: ['bug'], base: [45, 30, 35, 20, 20, 45], catchRate: 255, baseExp: 39,
    growth: 'mf', height: 0.3, body: 'worm', evolve: { level: 7, to: 11 },
    learn: [[1, 'tackle'], [1, 'stringShot']] },
  11: { name: 'Metapod', types: ['bug'], base: [50, 20, 55, 25, 25, 30], catchRate: 120, baseExp: 72,
    growth: 'mf', height: 0.7, body: 'blob', evolve: { level: 10, to: 12 },
    learn: [[1, 'harden'], [1, 'tackle']] },
  12: { name: 'Butterfree', types: ['bug', 'flying'], base: [60, 45, 50, 90, 80, 70], catchRate: 45, baseExp: 178,
    growth: 'mf', height: 1.1, body: 'flyer',
    learn: [[1, 'confusion'], [13, 'poisonPowder'], [14, 'stunSpore'], [15, 'sleepPowder'], [18, 'supersonic'], [23, 'whirlwind']] },
  13: { name: 'Weedle', types: ['bug', 'poison'], base: [40, 35, 30, 20, 20, 50], catchRate: 255, baseExp: 39,
    growth: 'mf', height: 0.3, body: 'worm', evolve: { level: 7, to: 14 },
    learn: [[1, 'poisonSting'], [1, 'stringShot']] },
  14: { name: 'Kakuna', types: ['bug', 'poison'], base: [45, 25, 50, 25, 25, 35], catchRate: 120, baseExp: 72,
    growth: 'mf', height: 0.6, body: 'blob', evolve: { level: 10, to: 15 },
    learn: [[1, 'harden'], [1, 'poisonSting']] },
  15: { name: 'Beedrill', types: ['bug', 'poison'], base: [65, 90, 40, 45, 80, 75], catchRate: 45, baseExp: 178,
    growth: 'mf', height: 1.0, body: 'flyer',
    learn: [[1, 'poisonSting'], [10, 'furyAttack'], [15, 'focusEnergy'], [20, 'twineedle']] },
  16: { name: 'Pidgey', types: ['normal', 'flying'], base: [40, 45, 40, 35, 35, 56], catchRate: 255, baseExp: 50,
    growth: 'ms', height: 0.3, body: 'bird', evolve: { level: 18, to: 17 },
    learn: [[1, 'tackle'], [5, 'sandAttack'], [9, 'gust'], [13, 'quickAttack'], [19, 'whirlwind']] },
  17: { name: 'Pidgeotto', types: ['normal', 'flying'], base: [63, 60, 55, 50, 50, 71], catchRate: 120, baseExp: 122,
    growth: 'ms', height: 1.1, body: 'bird',
    learn: [[1, 'tackle'], [1, 'sandAttack'], [9, 'gust'], [13, 'quickAttack'], [20, 'whirlwind']] },
  19: { name: 'Rattata', types: ['normal'], base: [30, 56, 35, 25, 35, 72], catchRate: 255, baseExp: 51,
    growth: 'mf', height: 0.3, body: 'quad', evolve: { level: 20, to: 20 },
    learn: [[1, 'tackle'], [1, 'tailWhip'], [7, 'quickAttack'], [13, 'hyperFang'], [20, 'focusEnergy']] },
  20: { name: 'Raticate', types: ['normal'], base: [55, 81, 60, 50, 70, 97], catchRate: 127, baseExp: 145,
    growth: 'mf', height: 0.7, body: 'quad',
    learn: [[1, 'tackle'], [1, 'tailWhip'], [7, 'quickAttack'], [13, 'hyperFang'], [20, 'scaryFace']] },
  21: { name: 'Spearow', types: ['normal', 'flying'], base: [40, 60, 30, 31, 31, 70], catchRate: 255, baseExp: 52,
    growth: 'mf', height: 0.3, body: 'bird',
    learn: [[1, 'peck'], [1, 'growl'], [7, 'leer'], [13, 'furyAttack'], [19, 'pursuit']] },
  25: { name: 'Pikachu', types: ['electric'], base: [35, 55, 40, 50, 50, 90], catchRate: 190, baseExp: 112,
    growth: 'mf', height: 0.4, body: 'biped',
    learn: [[1, 'thunderShock'], [1, 'growl'], [6, 'tailWhip'], [8, 'thunderWave'], [11, 'quickAttack'], [15, 'doubleTeam']] },
  56: { name: 'Mankey', types: ['fighting'], base: [40, 80, 35, 35, 45, 70], catchRate: 190, baseExp: 61,
    growth: 'mf', height: 0.5, body: 'biped',
    learn: [[1, 'scratch'], [1, 'leer'], [6, 'lowKick'], [11, 'karateChop'], [16, 'furySwipes']] },
  74: { name: 'Geodude', types: ['rock', 'ground'], base: [40, 80, 100, 30, 30, 20], catchRate: 255, baseExp: 60,
    growth: 'ms', height: 0.4, body: 'blob',
    learn: [[1, 'tackle'], [1, 'defenseCurl'], [6, 'mudSport'], [11, 'rockThrow'], [16, 'magnitude']] },
  95: { name: 'Onix', types: ['rock', 'ground'], base: [35, 45, 160, 30, 45, 70], catchRate: 45, baseExp: 77,
    growth: 'mf', height: 8.8, body: 'serpent',
    learn: [[1, 'tackle'], [1, 'screech'], [9, 'bind'], [13, 'rockThrow'], [19, 'rage'], [25, 'slam']] },
};

// Comportamento no mapa: timid foge, neutral ignora, aggressive vem para a briga.
export const TEMPER = { 10: 'neutral', 11: 'neutral', 13: 'neutral', 14: 'neutral', 16: 'timid', 17: 'timid', 19: 'aggressive',
  20: 'aggressive', 21: 'aggressive', 25: 'timid', 56: 'aggressive', 74: 'neutral', 95: 'aggressive', 12: 'timid', 15: 'aggressive' };


// ---- Espécies da região Alvorada (modelos do Legends Z-A / Scarlet-Violet) ----
Object.assign(SPECIES, {
  3: { name: 'Venusaur', types: ['grass', 'poison'], base: [80, 82, 83, 100, 100, 80], catchRate: 45, baseExp: 236, growth: 'ms', height: 2.0, body: 'quad',
    learn: [[1, 'tackle'], [1, 'vineWhip'], [1, 'leechSeed'], [15, 'poisonPowder'], [15, 'sleepPowder'], [22, 'razorLeaf'], [32, 'megaDrain']] },
  6: { name: 'Charizard', types: ['fire', 'flying'], base: [78, 84, 78, 109, 85, 100], catchRate: 45, baseExp: 240, growth: 'ms', height: 1.7, body: 'biped',
    learn: [[1, 'scratch'], [1, 'ember'], [13, 'metalClaw'], [20, 'smokescreen'], [36, 'wingAttack'], [40, 'flamethrower'], [46, 'airSlash'], [50, 'dragonPulse'], [56, 'fireBlast']] },
  9: { name: 'Blastoise', types: ['water'], base: [79, 83, 100, 85, 105, 78], catchRate: 45, baseExp: 239, growth: 'ms', height: 1.6, body: 'biped',
    learn: [[1, 'tackle'], [1, 'waterGun'], [10, 'withdraw'], [19, 'bite'], [36, 'waterPulse'], [42, 'iceShard'], [48, 'aquaJet'], [55, 'hydroPump']] },
  54: { name: 'Psyduck', types: ['water'], base: [50, 52, 48, 65, 50, 55], catchRate: 190, baseExp: 64, growth: 'mf', height: 0.8, body: 'biped',
    learn: [[1, 'scratch'], [1, 'tailWhip'], [3, 'waterGun'], [9, 'confusion'], [12, 'furySwipes']] },
  59: { name: 'Arcanine', types: ['fire'], base: [90, 110, 80, 100, 80, 95], catchRate: 75, baseExp: 194, growth: 's', height: 1.9, body: 'quad',
    learn: [[1, 'ember'], [1, 'bite'], [1, 'roar'], [1, 'flameWheel'], [1, 'takeDown']] },
  123: { name: 'Scyther', types: ['bug', 'flying'], base: [70, 110, 80, 55, 80, 105], catchRate: 45, baseExp: 100, growth: 'mf', height: 1.5, body: 'biped',
    learn: [[1, 'quickAttack'], [1, 'leer'], [4, 'furyCutter'], [8, 'wingAttack'], [12, 'doubleTeam']] },
  129: { name: 'Magikarp', types: ['water'], base: [20, 10, 55, 15, 20, 80], catchRate: 255, baseExp: 40, growth: 's', height: 0.9, body: 'fish', evolve: { level: 20, to: 130 },
    learn: [[1, 'splash'], [15, 'tackle']] },
  130: { name: 'Gyarados', types: ['water', 'flying'], base: [95, 125, 79, 60, 100, 81], catchRate: 45, baseExp: 189, growth: 's', height: 6.5, body: 'serpent',
    learn: [[1, 'bite'], [1, 'twister'], [21, 'waterPulse'], [24, 'takeDown']] },
  133: { name: 'Eevee', types: ['normal'], base: [55, 55, 50, 45, 65, 55], catchRate: 45, baseExp: 65, growth: 'mf', height: 0.3, body: 'quad',
    learn: [[1, 'tackle'], [1, 'tailWhip'], [5, 'sandAttack'], [10, 'quickAttack'], [15, 'bite']] },
  183: { name: 'Marill', types: ['water', 'fairy'], base: [70, 20, 50, 20, 50, 40], catchRate: 190, baseExp: 88, growth: 'f', height: 0.4, body: 'biped',
    learn: [[1, 'tackle'], [1, 'waterGun'], [3, 'tailWhip'], [6, 'bubble'], [9, 'defenseCurl']] },
  194: { name: 'Wooper', types: ['water', 'ground'], base: [55, 45, 45, 25, 25, 15], catchRate: 255, baseExp: 42, growth: 'mf', height: 0.4, body: 'biped',
    learn: [[1, 'waterGun'], [1, 'tailWhip'], [4, 'mudShot'], [12, 'slam']] },
  234: { name: 'Stantler', types: ['normal'], base: [73, 95, 62, 85, 65, 85], catchRate: 45, baseExp: 163, growth: 's', height: 1.4, body: 'quad',
    learn: [[1, 'tackle'], [1, 'leer'], [3, 'astonish'], [7, 'hypnosis'], [10, 'stomp']] },
  396: { name: 'Starly', types: ['normal', 'flying'], base: [40, 55, 30, 30, 30, 60], catchRate: 255, baseExp: 49, growth: 'ms', height: 0.3, body: 'bird',
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'quickAttack'], [9, 'wingAttack']] },
  403: { name: 'Shinx', types: ['electric'], base: [45, 65, 34, 40, 34, 45], catchRate: 235, baseExp: 53, growth: 'ms', height: 0.5, body: 'quad',
    learn: [[1, 'tackle'], [1, 'leer'], [4, 'thunderShock'], [8, 'bite'], [12, 'spark']] },
  415: { name: 'Combee', types: ['bug', 'flying'], base: [30, 30, 42, 30, 42, 70], catchRate: 120, baseExp: 49, growth: 'ms', height: 0.3, body: 'flyer',
    learn: [[1, 'gust'], [1, 'bugBite']] },
  427: { name: 'Buneary', types: ['normal'], base: [55, 66, 44, 44, 56, 85], catchRate: 190, baseExp: 70, growth: 'mf', height: 0.4, body: 'biped',
    learn: [[1, 'pound'], [1, 'splash'], [4, 'defenseCurl'], [8, 'quickAttack'], [12, 'doubleKick']] },
  548: { name: 'Petilil', types: ['grass'], base: [45, 35, 50, 70, 50, 30], catchRate: 190, baseExp: 56, growth: 'mf', height: 0.5, body: 'blob',
    learn: [[1, 'absorb'], [3, 'growth'], [6, 'leechSeed'], [9, 'sleepPowder'], [12, 'megaDrain']] },
  570: { name: 'Zorua', types: ['dark'], base: [40, 65, 40, 80, 40, 65], catchRate: 75, baseExp: 66, growth: 'ms', height: 0.7, body: 'quad',
    learn: [[1, 'scratch'], [1, 'leer'], [4, 'pursuit'], [8, 'furySwipes']] },
  628: { name: 'Braviary', types: ['normal', 'flying'], base: [100, 123, 75, 57, 75, 80], catchRate: 60, baseExp: 179, growth: 's', height: 1.5, body: 'bird',
    learn: [[1, 'peck'], [1, 'leer'], [1, 'wingAttack'], [1, 'crushClaw']] },
  659: { name: 'Bunnelby', types: ['normal'], base: [38, 36, 38, 32, 36, 57], catchRate: 255, baseExp: 47, growth: 'mf', height: 0.4, body: 'biped',
    learn: [[1, 'tackle'], [1, 'agility'], [3, 'mudSlap'], [6, 'quickAttack'], [9, 'doubleKick']] },
  734: { name: 'Yungoos', types: ['normal'], base: [48, 70, 30, 30, 30, 45], catchRate: 255, baseExp: 51, growth: 'mf', height: 0.4, body: 'quad',
    learn: [[1, 'tackle'], [1, 'leer'], [3, 'pursuit'], [7, 'sandAttack'], [10, 'bite']] },
  750: { name: 'Mudsdale', types: ['ground'], base: [100, 125, 100, 55, 85, 35], catchRate: 60, baseExp: 175, growth: 'ms', height: 2.5, body: 'quad',
    learn: [[1, 'mudSlap'], [1, 'rockSmash'], [1, 'doubleKick'], [1, 'bulldoze']] },
  903: { name: 'Sneasler', types: ['fighting', 'poison'], base: [80, 130, 60, 40, 80, 120], catchRate: 20, baseExp: 102, growth: 'ms', height: 1.3, body: 'biped',
    learn: [[1, 'scratch'], [1, 'leer'], [1, 'rockSmash'], [1, 'quickAttack'], [1, 'poisonJab']] },
  915: { name: 'Lechonk', types: ['normal'], base: [54, 45, 40, 35, 45, 35], catchRate: 255, baseExp: 51, growth: 'mf', height: 0.5, body: 'quad',
    learn: [[1, 'tackle'], [1, 'tailWhip'], [3, 'disarmingVoice'], [6, 'mudShot'], [12, 'takeDown']] },
});
Object.assign(TEMPER, { 3: 'neutral', 6: 'aggressive', 9: 'neutral', 54: 'neutral', 59: 'aggressive', 123: 'aggressive', 129: 'neutral', 130: 'aggressive',
  133: 'timid', 183: 'neutral', 194: 'neutral', 234: 'timid', 396: 'timid', 403: 'aggressive', 415: 'aggressive', 427: 'timid', 548: 'timid',
  570: 'aggressive', 628: 'aggressive', 659: 'timid', 734: 'aggressive', 750: 'neutral', 903: 'aggressive', 915: 'neutral' });

// Quem vive em cada bioma da região (nível mínimo/máximo e peso)
export const BIOME_ENCOUNTERS = {
  campo: [[396, 3, 6, 30], [915, 3, 6, 25], [659, 3, 6, 20], [403, 4, 7, 15], [427, 4, 7, 15], [734, 3, 6, 15], [16, 3, 6, 15], [25, 5, 7, 5], [133, 5, 7, 3]],
  floresta: [[13, 3, 5, 25], [14, 6, 7, 8], [415, 4, 6, 20], [548, 4, 7, 18], [570, 6, 8, 8], [25, 5, 7, 10], [123, 8, 10, 3], [17, 8, 10, 5]],
  margem: [[54, 4, 7, 30], [194, 4, 7, 30], [183, 4, 7, 25], [129, 3, 6, 15]],
  planalto: [[234, 10, 13, 30], [750, 12, 14, 15], [17, 10, 12, 20], [59, 14, 16, 4], [903, 13, 15, 5], [628, 14, 16, 5], [123, 10, 12, 8]],
  praia: [[194, 5, 7, 30], [54, 5, 7, 30], [129, 4, 6, 30], [130, 15, 18, 2]],
};


// ---- Lote 2: mais vida na região (dia e noite) ----
const S = (name, types, base, catchRate, baseExp, growth, height, body, learn, extra = {}) => ({ name, types, base, catchRate, baseExp, growth, height, body, learn, ...extra });
Object.assign(SPECIES, {
  179: S('Mareep', ['electric'], [55, 40, 40, 65, 45, 35], 235, 56, 'ms', 0.6, 'quad', [[1, 'tackle'], [1, 'growl'], [4, 'thunderShock'], [8, 'thunderWave']]),
  280: S('Ralts', ['psychic', 'fairy'], [28, 25, 25, 45, 35, 40], 235, 40, 's', 0.4, 'biped', [[1, 'disarmingVoice'], [1, 'teleport'], [3, 'confusion']]),
  52: S('Meowth', ['normal'], [40, 45, 35, 40, 40, 90], 255, 58, 'mf', 0.4, 'biped', [[1, 'scratch'], [1, 'growl'], [8, 'bite'], [12, 'furySwipes']]),
  417: S('Pachirisu', ['electric'], [60, 45, 70, 45, 90, 95], 200, 142, 'mf', 0.4, 'quad', [[1, 'growl'], [1, 'quickAttack'], [5, 'thunderShock'], [13, 'spark']]),
  821: S('Rookidee', ['flying'], [38, 47, 35, 33, 35, 57], 255, 49, 'ms', 0.2, 'bird', [[1, 'peck'], [1, 'leer'], [12, 'wingAttack']]),
  926: S('Fidough', ['fairy'], [37, 55, 70, 30, 55, 65], 190, 62, 'ms', 0.3, 'quad', [[1, 'tackle'], [1, 'tailWhip'], [3, 'disarmingVoice'], [6, 'bite']]),
  63: S('Abra', ['psychic'], [25, 20, 15, 105, 55, 90], 200, 62, 'ms', 0.9, 'biped', [[1, 'teleport']]),
  48: S('Venonat', ['bug', 'poison'], [60, 55, 50, 40, 55, 45], 190, 61, 'mf', 1.0, 'biped', [[1, 'tackle'], [5, 'supersonic'], [11, 'confusion'], [13, 'poisonPowder']]),
  167: S('Spinarak', ['bug', 'poison'], [40, 60, 40, 40, 40, 30], 255, 50, 'f', 0.5, 'quad', [[1, 'poisonSting'], [1, 'stringShot'], [5, 'absorb']]),
  204: S('Pineco', ['bug'], [50, 65, 90, 35, 35, 15], 190, 58, 'mf', 0.6, 'blob', [[1, 'tackle'], [1, 'harden'], [6, 'bugBite']]),
  214: S('Heracross', ['bug', 'fighting'], [80, 125, 75, 40, 95, 85], 45, 175, 's', 1.5, 'biped', [[1, 'tackle'], [1, 'leer'], [1, 'furyAttack'], [1, 'rockSmash']]),
  216: S('Teddiursa', ['normal'], [60, 80, 50, 50, 50, 40], 120, 66, 'mf', 0.6, 'biped', [[1, 'scratch'], [1, 'leer'], [8, 'lick'], [13, 'furySwipes']]),
  285: S('Shroomish', ['grass'], [60, 40, 60, 40, 60, 35], 255, 59, 'mf', 0.4, 'blob', [[1, 'absorb'], [1, 'tackle'], [8, 'stunSpore'], [12, 'leechSeed']]),
  406: S('Budew', ['grass', 'poison'], [40, 30, 35, 50, 70, 55], 255, 56, 'ms', 0.2, 'blob', [[1, 'absorb'], [1, 'growth'], [4, 'stunSpore']]),
  590: S('Foongus', ['grass', 'poison'], [69, 55, 45, 55, 55, 15], 190, 59, 'mf', 0.2, 'blob', [[1, 'absorb'], [1, 'growth'], [4, 'astonish'], [8, 'poisonPowder']]),
  664: S('Scatterbug', ['bug'], [38, 35, 40, 27, 25, 35], 255, 40, 'mf', 0.3, 'worm', [[1, 'tackle'], [1, 'stringShot']]),
  708: S('Phantump', ['ghost', 'grass'], [43, 70, 48, 50, 60, 38], 120, 62, 'mf', 0.4, 'flyer', [[1, 'tackle'], [1, 'astonish'], [4, 'leafage'], [8, 'leechSeed']]),
  79: S('Slowpoke', ['water', 'psychic'], [90, 65, 65, 40, 40, 15], 190, 63, 'mf', 1.2, 'quad', [[1, 'tackle'], [1, 'growl'], [6, 'waterGun'], [9, 'confusion']]),
  278: S('Wingull', ['water', 'flying'], [40, 30, 30, 55, 30, 85], 190, 54, 'mf', 0.6, 'bird', [[1, 'growl'], [1, 'waterGun'], [10, 'wingAttack']]),
  283: S('Surskit', ['bug', 'water'], [40, 30, 32, 50, 52, 65], 200, 54, 'mf', 0.5, 'quad', [[1, 'bubble'], [1, 'quickAttack'], [6, 'aquaJet']]),
  418: S('Buizel', ['water'], [55, 65, 35, 60, 30, 85], 190, 66, 'mf', 0.7, 'biped', [[1, 'tackle'], [1, 'growl'], [4, 'waterGun'], [7, 'quickAttack'], [11, 'aquaJet']]),
  422: S('Shellos', ['water'], [76, 48, 48, 57, 62, 34], 190, 65, 'mf', 0.3, 'worm', [[1, 'mudSlap'], [2, 'harden'], [9, 'waterPulse']]),
  550: S('Basculin', ['water'], [70, 92, 65, 80, 55, 98], 25, 161, 'mf', 1.0, 'fish', [[1, 'tackle'], [1, 'tailWhip'], [1, 'waterGun'], [1, 'bite'], [1, 'aquaJet']]),
  656: S('Froakie', ['water'], [41, 56, 40, 62, 44, 71], 45, 63, 'ms', 0.3, 'biped', [[1, 'pound'], [1, 'growl'], [5, 'bubble'], [8, 'quickAttack']]),
  349: S('Feebas', ['water'], [20, 15, 20, 10, 55, 80], 255, 40, 'mf', 0.6, 'fish', [[1, 'splash'], [15, 'tackle']]),
  66: S('Machop', ['fighting'], [70, 80, 50, 35, 35, 35], 180, 61, 'ms', 0.8, 'biped', [[1, 'lowKick'], [1, 'leer'], [7, 'karateChop'], [10, 'rockSmash']]),
  228: S('Houndour', ['dark', 'fire'], [45, 60, 30, 80, 50, 65], 120, 66, 's', 0.6, 'quad', [[1, 'leer'], [1, 'ember'], [4, 'smog'], [13, 'bite']]),
  447: S('Riolu', ['fighting'], [40, 70, 40, 35, 40, 60], 75, 57, 'ms', 0.7, 'biped', [[1, 'quickAttack'], [1, 'rockSmash'], [8, 'bite']]),
  744: S('Rockruff', ['rock'], [45, 65, 40, 30, 40, 60], 190, 56, 'mf', 0.5, 'quad', [[1, 'tackle'], [1, 'leer'], [4, 'sandAttack'], [8, 'bite'], [12, 'rockThrow']]),
  246: S('Larvitar', ['rock', 'ground'], [50, 64, 50, 45, 50, 41], 45, 60, 's', 0.6, 'biped', [[1, 'tackle'], [1, 'leer'], [6, 'rockThrow'], [9, 'bite']]),
  227: S('Skarmory', ['steel', 'flying'], [65, 80, 140, 40, 70, 70], 25, 163, 's', 1.7, 'bird', [[1, 'peck'], [1, 'leer'], [1, 'metalClaw'], [1, 'wingAttack']]),
  443: S('Gible', ['dragon', 'ground'], [58, 70, 45, 40, 45, 42], 45, 60, 's', 0.7, 'biped', [[1, 'tackle'], [1, 'sandAttack'], [6, 'dragonBreath'], [10, 'bite']]),
  701: S('Hawlucha', ['fighting', 'flying'], [78, 92, 75, 74, 63, 118], 100, 175, 'mf', 0.8, 'biped', [[1, 'karateChop'], [1, 'wingAttack'], [1, 'rockSmash'], [1, 'quickAttack']]),
  41: S('Zubat', ['poison', 'flying'], [40, 45, 35, 30, 40, 55], 255, 49, 'mf', 0.8, 'flyer', [[1, 'absorb'], [1, 'supersonic'], [5, 'astonish'], [11, 'bite']]),
  92: S('Gastly', ['ghost', 'poison'], [30, 35, 30, 100, 35, 80], 190, 62, 'ms', 1.3, 'flyer', [[1, 'lick'], [4, 'hypnosis'], [8, 'shadowSneak']]),
  198: S('Murkrow', ['dark', 'flying'], [60, 85, 42, 85, 42, 91], 30, 81, 'ms', 0.5, 'bird', [[1, 'peck'], [1, 'astonish'], [5, 'pursuit'], [11, 'wingAttack']]),
  200: S('Misdreavus', ['ghost'], [60, 60, 60, 85, 85, 85], 45, 87, 'f', 0.7, 'flyer', [[1, 'astonish'], [1, 'growl'], [5, 'confusion'], [10, 'shadowSneak']]),
  425: S('Drifloon', ['ghost', 'flying'], [90, 50, 34, 60, 44, 70], 125, 70, 'mf', 0.4, 'flyer', [[1, 'astonish'], [1, 'gust'], [10, 'shadowSneak']]),
  607: S('Litwick', ['ghost', 'fire'], [50, 30, 55, 65, 55, 20], 190, 55, 'ms', 0.3, 'blob', [[1, 'ember'], [1, 'astonish'], [4, 'smog']]),
  359: S('Absol', ['dark'], [65, 130, 60, 75, 60, 75], 30, 163, 'ms', 1.2, 'quad', [[1, 'quickAttack'], [1, 'leer'], [1, 'bite'], [1, 'crushClaw']]),
  215: S('Sneasel', ['dark', 'ice'], [55, 95, 55, 35, 75, 115], 60, 86, 'ms', 0.9, 'biped', [[1, 'scratch'], [1, 'leer'], [1, 'quickAttack'], [6, 'iceShard'], [12, 'furySwipes']]),
});
Object.assign(TEMPER, { 179: 'timid', 280: 'timid', 52: 'aggressive', 417: 'timid', 821: 'aggressive', 926: 'neutral', 63: 'timid', 48: 'neutral',
  167: 'aggressive', 204: 'neutral', 214: 'aggressive', 216: 'aggressive', 285: 'neutral', 406: 'timid', 590: 'neutral', 664: 'neutral', 708: 'aggressive',
  79: 'neutral', 278: 'timid', 283: 'timid', 418: 'aggressive', 422: 'neutral', 550: 'aggressive', 656: 'timid', 349: 'timid', 66: 'aggressive',
  228: 'aggressive', 447: 'neutral', 744: 'aggressive', 246: 'neutral', 227: 'aggressive', 443: 'aggressive', 701: 'aggressive', 41: 'aggressive',
  92: 'aggressive', 198: 'aggressive', 200: 'neutral', 425: 'neutral', 607: 'timid', 359: 'neutral', 215: 'aggressive' });

// Tabelas completas por bioma: [dex, nívelMín, nívelMáx, peso]. "noite" substitui de 18h às 6h.
Object.assign(BIOME_ENCOUNTERS, {
  campo: [[396, 3, 6, 22], [915, 3, 6, 20], [659, 3, 6, 16], [403, 4, 7, 12], [427, 4, 7, 12], [734, 3, 6, 12], [16, 3, 6, 12], [179, 4, 7, 14],
    [52, 4, 7, 10], [417, 5, 7, 8], [821, 4, 6, 12], [926, 4, 6, 10], [25, 5, 7, 5], [133, 5, 7, 3], [280, 6, 8, 3], [63, 6, 8, 3]],
  floresta: [[13, 3, 5, 18], [14, 6, 7, 6], [415, 4, 6, 14], [548, 4, 7, 12], [570, 6, 8, 6], [25, 5, 7, 8], [123, 8, 10, 3], [17, 8, 10, 5],
    [48, 5, 8, 12], [167, 4, 7, 12], [204, 5, 8, 10], [216, 6, 9, 10], [285, 5, 7, 12], [406, 4, 6, 12], [590, 5, 8, 10], [664, 3, 5, 14], [708, 7, 9, 6], [214, 10, 12, 2]],
  margem: [[54, 4, 7, 20], [194, 4, 7, 20], [183, 4, 7, 18], [129, 3, 6, 10], [79, 5, 8, 14], [283, 4, 7, 12], [418, 6, 9, 12], [422, 5, 8, 12],
    [550, 9, 12, 4], [656, 7, 9, 3], [349, 6, 9, 2]],
  planalto: [[234, 10, 13, 20], [750, 12, 14, 12], [17, 10, 12, 14], [59, 14, 16, 3], [903, 13, 15, 4], [628, 14, 16, 4], [123, 10, 12, 6],
    [66, 10, 13, 14], [744, 10, 13, 14], [701, 13, 15, 5], [246, 12, 14, 3], [443, 12, 14, 3], [227, 14, 16, 3], [447, 11, 13, 4]],
  praia: [[194, 5, 7, 20], [54, 5, 7, 20], [129, 4, 6, 18], [130, 15, 18, 2], [278, 5, 8, 22], [422, 5, 8, 16], [418, 6, 9, 10]],
});
export const NIGHT_ENCOUNTERS = {
  campo: [[41, 4, 7, 26], [198, 6, 9, 10], [228, 6, 9, 10], [16, 3, 6, 8], [52, 4, 7, 12], [92, 6, 8, 8], [425, 6, 9, 8], [359, 10, 12, 2]],
  floresta: [[92, 6, 9, 18], [200, 7, 10, 12], [425, 6, 9, 10], [607, 5, 8, 12], [41, 5, 8, 16], [198, 7, 10, 10], [167, 5, 8, 12], [708, 7, 10, 10], [570, 7, 9, 6]],
  margem: [[79, 6, 9, 20], [41, 5, 8, 16], [550, 10, 13, 8], [129, 4, 7, 14], [607, 6, 8, 8], [92, 7, 9, 8]],
  planalto: [[215, 12, 14, 16], [228, 12, 14, 16], [41, 10, 12, 16], [198, 12, 14, 12], [359, 14, 16, 4], [744, 11, 13, 10], [246, 12, 14, 4]],
  praia: [[278, 5, 8, 14], [41, 5, 8, 14], [422, 6, 9, 14], [129, 5, 7, 14]],
};

// Altura usada na cena (m): legível para os pequenos, contida para os gigantes.
export function displayHeight(dex) {
  const h = SPECIES[dex]?.height ?? 0.6;
  return Math.min(6.5, Math.max(0.8, h * 1.5 + 0.35)); // Onix ~6,5 m, Charmander ~1,25 m, Rattata ~0,8 m
}

export function expForLevel(growth, n) {
  if (n <= 1) return 0;
  if (growth === 'ms') return Math.max(0, Math.floor(1.2 * n ** 3 - 15 * n ** 2 + 100 * n - 140));
  if (growth === 's') return Math.floor(1.25 * n ** 3);
  if (growth === 'f') return Math.floor(0.8 * n ** 3);
  return n ** 3; // médio-rápido
}
