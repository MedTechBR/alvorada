import { BUILDINGS } from './buildings.js';

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
};
// decoração plana (sem colisão, sem y-sort): fica na camada logo acima do chão
export const DECOR = { rug: 'rug', courtlines: 'courtlines', window: 'window', pebble: 'pebble', pebble2: 'pebble2', mush: 'mush', mush2: 'mush2', wheat: 'wheat' };
