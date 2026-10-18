import { BUILDINGS } from './buildings.js';
import './arte-biomas.js'; // desenha as texturas dos biomas (SPR.*) antes do catálogo ser usado

// Catálogo de objetos do cenário: textura, pegada em blocos (fw x fh, a partir do canto de cima à esquerda),
// deslocamento do desenho, se é sólido, quebrável, luz à noite e porta.
// Posição no mapa = bloco do canto superior esquerdo da pegada; o desenho fica centrado na pegada,
// com a base no fim dela (y-sort pelo pé).

const tree = (tex, extra = {}) => ({ tex, fw: 2, fh: 1, oy: 4, ...extra });
export const KINDS = {
  tree: tree('tree'), tree2: tree('tree2'), pine: tree('pine'), pine2: tree('pine2'), autumn: tree('autumn'), pineT: tree('pineT'),
  bigtree: tree('bigtree', { oy: 2 }), bigautumn: tree('bigautumn', { oy: 2 }),
  ipe: tree('ipe', { oy: 2 }), paineira: tree('paineira', { oy: 2 }), jequitiba: { tex: 'jequitiba', fw: 3, fh: 1, oy: 4 },
  oran: tree('oran', { oy: 2, berry: 'oran' }), pecha: tree('pecha', { oy: 2, berry: 'pecha' }),
  palm: { tex: 'palmBig', fw: 1, fh: 1, oy: 2 }, palmSmall: { tex: 'palm', fw: 1, fh: 1, oy: 1 },
  roundbush: { tex: 'roundbush', fw: 3, fh: 1, oy: 2 }, cone: { tex: 'cone', fw: 2, fh: 1, oy: 2 },
  boulder: { tex: 'boulder', fw: 2, fh: 1, oy: 2 }, boulder2: { tex: 'rock2', fw: 2, fh: 1, oy: 2 }, grayrock: { tex: 'grayrock', fw: 2, fh: 1, oy: 2 },
  log: { tex: 'log', fw: 4, fh: 1, oy: 0 }, stump: { tex: 'stump', fw: 2, fh: 1, oy: 2 },
  bush: { tex: 'bush', fw: 1, fh: 1, oy: 1, breakable: true, hp: 1 },
  rock: { tex: 'smallrock', fw: 1, fh: 1, oy: 1, breakable: true, hp: 3 },
  sign: { tex: 'sign', fw: 1, fh: 1, oy: 0 }, mailbox: { tex: 'mailbox', fw: 1, fh: 1, oy: 0 },
  lamp: { tex: 'lamp', fw: 1, fh: 1, oy: 0, lights: [[5, 5, 1.3]] },
  flowerpot: { tex: 'flowerpot', fw: 1, fh: 1, oy: 0 }, crate: { tex: 'crate', fw: 1, fh: 1, oy: 0 },
  fence: { tex: 'fenceM', fw: 1, fh: 1, oy: 2 }, fenceV: { tex: 'fenceV', fw: 1, fh: 1, oy: 2 },
  wfence: { tex: 'wfenceM', fw: 1, fh: 1, oy: 2 }, wfenceV: { tex: 'wfenceV', fw: 1, fh: 1, oy: 2 },
  // prédios (porta = coluna dx na última linha da pegada)
  // prédios desenhados por código (src/world/buildings.js); os do Tuxemon ficam como 'tux*'
  ...BUILDINGS,
  tuxHouse: { tex: 'houseA', fw: 5, fh: 3, oy: 0, door: 3 }, tuxCenter: { tex: 'center', fw: 5, fh: 3, oy: 0, door: 2 },
  haybale: { tex: 'haybale', fw: 1, fh: 1, oy: 0, breakable: true, hp: 1 }, bale: { tex: 'haybale', fw: 1, fh: 1, oy: 0, push: true },
  varal: { tex: 'varal', fw: 3, fh: 1, oy: 0, anim: 'varal', solidCells: [[0, 0], [2, 0]] },
  gate: { tex: 'gate', fw: 2, fh: 1, oy: 1 }, menhir: { tex: 'menhir', fw: 1, fh: 1, oy: 1 }, column: { tex: 'column', fw: 1, fh: 1, oy: 1 }, windmill: { tex: 'windmill', fw: 3, fh: 2, oy: 0 },
  bench: { tex: 'bench', fw: 2, fh: 1, oy: 0 }, well: { tex: 'well', fw: 2, fh: 1, oy: 0 },
  sundial: { tex: 'sundial', fw: 2, fh: 1, oy: 0 },
  portico: { tex: 'portico', fw: 4, fh: 1, oy: 0, solidCells: [[0, 0], [3, 0]] },
  stands: { tex: 'stands', fw: 6, fh: 2, oy: 0 },
  // interior
  radio: { tex: 'radio', fw: 1, fh: 1, oy: 0 }, luzita: { tex: 'luzita', fw: 1, fh: 1, oy: 0, lights: [[7, 8, 0.8]], tint: 0x9afff4 },
  bed: { tex: 'bed', fw: 1, fh: 2, oy: 0 }, table: { tex: 'table', fw: 2, fh: 1, oy: 0 }, tv: { tex: 'tv', fw: 1, fh: 1, oy: 0 },
  shelf: { tex: 'shelf', fw: 1, fh: 1, oy: 0 }, plant: { tex: 'plant', fw: 1, fh: 1, oy: 0 }, pc: { tex: 'pc', fw: 1, fh: 1, oy: 0 },
  machine: { tex: 'machine', fw: 2, fh: 1, oy: 0 }, counter: { tex: 'counter', fw: 4, fh: 1, oy: 0 }, balltable: { tex: 'balltable', fw: 3, fh: 1, oy: 0 },
  // ---------- biomas (arte em arte-biomas.js; mecânicas em masmorra.js; lista em assets/maps/LEIAME.md) ----------
  // plantas
  snowPine: tree('snowPine'), snowPineBig: tree('snowPineBig', { oy: 2 }), cactus: { tex: 'cactus', fw: 1, fh: 1, oy: 1 }, mandacaru: { tex: 'mandacaru', fw: 2, fh: 1, oy: 2 },
  coqueiro: { tex: 'coqueiro', fw: 1, fh: 1, oy: 2 }, palmeira: { tex: 'palmeira', fw: 1, fh: 1, oy: 2 }, mangue: { tex: 'mangue', fw: 3, fh: 1, oy: 2 },
  // pedras (cristais e rocha de lava têm luz própria à noite e no escuro)
  lavaRock: { tex: 'lavaRock', fw: 2, fh: 1, oy: 2, lights: [[14, 12, 0.7]], tint: 0xff7a2a, glow: 'glowLava' },
  stalagmite: { tex: 'stalagmite', fw: 1, fh: 1, oy: 1 }, stalagmiteIce: { tex: 'stalagmiteIce', fw: 1, fh: 1, oy: 1 },
  crystal: { tex: 'crystal', fw: 1, fh: 1, oy: 1, glow: 'glowCyan' }, crystalPink: { tex: 'crystalPink', fw: 1, fh: 1, oy: 1, glow: 'glowPink' },
  obsidianRock: { tex: 'obsidianRock', fw: 1, fh: 1, oy: 1 },
  // templo
  statue: { tex: 'statue', fw: 2, fh: 1, oy: 1 }, altar: { tex: 'altar', fw: 2, fh: 1, oy: 1 }, brokenColumn: { tex: 'brokenColumn', fw: 1, fh: 1, oy: 1 },
  obelisk: { tex: 'obelisk', fw: 1, fh: 1, oy: 1 }, pot: { tex: 'pot', fw: 1, fh: 1, oy: 0, breakable: true, hp: 1 },
  torch: { tex: 'torch', fw: 1, fh: 1, oy: 1, fire: 'torchLit' }, brazier: { tex: 'brazier', fw: 1, fh: 1, oy: 1, fire: 'brazierLit' },
  chest: { tex: 'chest', fw: 1, fh: 1, oy: 0, chest: true }, bell: { tex: 'bell', fw: 2, fh: 1, oy: 1, bell: true },
  // casas (porta = coluna dx na última linha; "to" liga a um interior)
  igloo: { tex: 'igloo', fw: 3, fh: 2, oy: 1, door: 1 }, cabin: { tex: 'cabin', fw: 5, fh: 3, oy: 1, door: 2, lights: [[17, 48], [63, 48]], smoke: [60, 8] },
  taipa: { tex: 'taipa', fw: 5, fh: 3, oy: 1, door: 2, lights: [[18, 41]] },
  // praia e extras
  beachStall: { tex: 'beachStall', fw: 3, fh: 1, oy: 1 }, surfboard: { tex: 'surfboard', fw: 1, fh: 1, oy: 1 }, driftwood: { tex: 'driftwood', fw: 2, fh: 1, oy: 0 },
  jangada: { tex: 'jangada', fw: 3, fh: 1, oy: 1 }, skull: { tex: 'skull', fw: 1, fh: 1, oy: 0 }, snowman: { tex: 'snowman', fw: 1, fh: 1, oy: 1 },
  barrel: { tex: 'barrel', fw: 1, fh: 1, oy: 0, breakable: true, hp: 2 }, fumarola: { tex: 'fumarola', fw: 1, fh: 1, oy: 0, steam: true },
  // mecânicas de masmorra (masmorra.js)
  strengthRock: { tex: 'strengthRock', fw: 1, fh: 1, oy: 1, strength: true }, iceBlock: { tex: 'iceBlock', fw: 1, fh: 1, oy: 1, strength: true, light: true },
  cart: { tex: 'cart', fw: 1, fh: 1, oy: 0, cart: true },
  plate: { tex: 'plate', fw: 1, fh: 1, oy: 0, flat: true, solidCells: [] }, lever: { tex: 'lever', fw: 1, fh: 1, oy: 0, lever: true },
  stoneDoor: { tex: 'stoneDoor', fw: 1, fh: 1, oy: 0, gate: true }, barsGate: { tex: 'barsGate', fw: 1, fh: 1, oy: 0, gate: true },
  lockedDoor: { tex: 'lockedDoor', fw: 1, fh: 1, oy: 0, gate: true, locked: true },
  raioGate: { tex: 'raioGateA', fw: 1, fh: 1, oy: 0, gate: true, raio: true },
  crackedWall: { tex: 'crackedWall', fw: 1, fh: 1, oy: 0, cracked: true }, crackedRock: { tex: 'crackedRock', fw: 1, fh: 1, oy: 0, cracked: true },
  crackedIce: { tex: 'crackedIce', fw: 1, fh: 1, oy: 0, cracked: true }, crackedLava: { tex: 'crackedLava', fw: 1, fh: 1, oy: 0, cracked: true },
  crackedCanyon: { tex: 'crackedCanyon', fw: 1, fh: 1, oy: 0, cracked: true },
  // biomas do plano do mundo (docs/mundo-expandido.md, seção 6)
  xiquexique: { tex: 'xiquexique', fw: 2, fh: 1, oy: 1 }, juazeiro: { tex: 'juazeiro', fw: 3, fh: 1, oy: 2 }, umbu: { tex: 'umbu', fw: 3, fh: 1, oy: 2 },
  araucaria: { tex: 'araucaria', fw: 2, fh: 1, oy: 2 }, bambu: { tex: 'bambu', fw: 2, fh: 1, oy: 1 }, lanternaPedra: { tex: 'lanternaPedra', fw: 1, fh: 1, oy: 1, lights: [[8, 14, 0.8]] },
  folhaGigante: { tex: 'folhaGigante', fw: 2, fh: 1, oy: 1 }, arvoreSelva: { tex: 'arvoreSelva', fw: 4, fh: 1, oy: 2 }, boia: { tex: 'boia', fw: 1, fh: 1, oy: 2 },
  mural: { tex: 'mural', fw: 3, fh: 1, oy: 0 }, cercaVara: { tex: 'cercaVara', fw: 1, fh: 1, oy: 2 }, sucata: { tex: 'sucata', fw: 2, fh: 1, oy: 1 },
};
// decoração plana (sem colisão, sem y-sort): fica na camada logo acima do chão
export const DECOR = { rug: 'rug', courtlines: 'courtlines', window: 'window', pebble: 'pebble', pebble2: 'pebble2', mush: 'mush', mush2: 'mush2', wheat: 'wheat' };
