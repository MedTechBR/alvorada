import { KINDS } from './objects.js';

// Camada "vestir": o enfeite das áreas ao ar livre (rotas com corredor, paredões de mata e rocha, mato alto em
// blocos, marcos, nichos com item, cidades com praça e canteiros, peças de cada bioma). Gerada por tools/vestir.mjs e
// guardada em assets/maps/vestir/<id da região>.json, separada dos JSON de mapa para não colidir com quem edita NPCs
// e barreiras. Formato:
//   { "regiao": "<id>", "tiles": [{ "t": "tall", "xy": [x, y, x, y, ...] }],
//     "objs": { "tipos": ["tree", ...], "d": [tipo, x, y, ss, tipo, x, y, ss, ...] },   (ss = 1: sem sombra de contato)
//     "objects": [{ kind, x, y, text }], "decor": [{ kind, x, y }], "items": [...] }
// mesclarVestir junta a camada ao arquivo da região ANTES de a região ser montada: os blocos da camada entram como
// operações "set" depois das operações da própria região, e os objetos, a decoração e os itens entram nas listas dela.
export function mesclarVestir(F, V) {
  if (!V) return F;
  const pares = (xy) => { const p = new Array(xy.length >> 1); for (let i = 0; i < p.length; i++) p[i] = [xy[2 * i], xy[2 * i + 1]]; return p; };
  F.ops = [...(F.ops ?? []), ...(V.tiles ?? []).map((g) => ({ op: 'set', t: g.t, pts: g.pts ?? pares(g.xy) }))];
  const objs = [];
  if (V.objs) { const { tipos, d } = V.objs; for (let i = 0; i < d.length; i += 4) objs.push(d[i + 3] ? { kind: tipos[d[i]], x: d[i + 1], y: d[i + 2], ss: 1 } : { kind: tipos[d[i]], x: d[i + 1], y: d[i + 2] }); }
  F.objects = [...(F.objects ?? []), ...objs, ...(V.objects ?? [])];
  F.decor = [...(F.decor ?? []), ...(V.decor ?? [])];
  F.items = [...(F.items ?? []), ...(V.items ?? [])];
  return F;
}

// Peças novas do vestir no catálogo (o modelo 3D de cada uma está em src/visual3d/kit/vestir.js). "tex" é o desenho
// usado só no visual 2D (uma textura parecida que já existe). solidCells: [] = dá para passar por cima (concha, fenda).
const K = (tex, fw, fh, extra = {}) => ({ tex, fw, fh, oy: 1, vestir: true, ...extra });
export const VESTIR_KINDS = {
  degrau: K('fenceM', 1, 1), degrauNeve: K('fenceM', 1, 1), degrauAreia: K('fenceM', 1, 1),
  moita: K('bush', 1, 1), moitaNeve: K('bush', 1, 1),
  // seixo é enfeite miúdo: dá para pisar por cima (ninguém fica preso numa pedrinha que mal se vê)
  pedrinha: K('smallrock', 1, 1, { solidCells: [] }), pedrinhaVerm: K('smallrock', 1, 1, { solidCells: [] }), pedrinhaBasalto: K('smallrock', 1, 1, { solidCells: [] }),
  escarpa: K('grayrock', 3, 2), escarpaNeve: K('grayrock', 3, 2), escarpaVerm: K('rock2', 3, 2), escarpaBasalto: K('obsidianRock', 3, 2),
  monteNeve: K('rock2', 2, 1), pedraGelo: K('grayrock', 2, 1), galhoNevado: K('snowPine', 2, 1),
  pinheiroAlto: K('pine', 2, 1), pinheiroNevado: K('snowPine', 2, 1),
  mesa: K('rock2', 3, 2), pilarRocha: K('stalagmite', 1, 1), ossada: K('skull', 2, 1, { solidCells: [] }),
  arbustoSeco: K('bush', 1, 1), cactoBarril: K('cactus', 1, 1), duna: K('rock2', 3, 2),
  pinaculo: K('stalagmite', 1, 1), basaltoColunas: K('obsidianRock', 2, 1), arvoreCinza: K('stalagmite', 2, 1), fendaLava: K('skull', 2, 1, { solidCells: [] }),
  concha: K('skull', 1, 1, { solidCells: [] }), pedraMar: K('grayrock', 2, 1), barco: K('jangada', 3, 1), redePesca: K('varal', 2, 1),
  pocaMare: K('skull', 2, 1, { solidCells: [] }),
  samambaia: K('bush', 1, 1, { solidCells: [] }), cogumelos: K('skull', 1, 1, { solidCells: [] }), arvoreGigante: K('bigtree', 4, 2),
  cachoeira: K('grayrock', 4, 2), taboa: K('bush', 1, 1), vitoriaRegia: K('skull', 1, 1, { solidCells: [] }),
  arcoPedra: K('portico', 4, 1, { solidCells: [[0, 0], [3, 0]] }), arvoreVento: K('tree', 2, 1), ruina: K('mural', 3, 1), santuario: K('altar', 2, 1),
  espantalho: K('statue', 1, 1), horta: K('bush', 1, 1), celeiro: K('cabin', 5, 3), fonte: K('well', 3, 2), canteiro: K('flowerpot', 2, 1),
  caixotes: K('crate', 2, 1),
};
for (const [k, v] of Object.entries(VESTIR_KINDS)) if (!KINDS[k]) KINDS[k] = v;
