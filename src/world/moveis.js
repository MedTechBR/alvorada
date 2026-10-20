import { KINDS } from './objects.js';

// Móveis dos interiores (Centro Pokémon, Mercado, casas, laboratório) no catálogo do mapa: pegada e colisão.
// O desenho 3D de cada um está em src/visual3d/kit/moveis.js; no 2D eles usam a arte mais próxima que já existe.
// A pegada sólida é exatamente a do modelo: ninguém entra num móvel nem fica preso atrás dele.
// solidCells: [] = peça de parede, sem colisão (fica atrás de quem está no bloco).
const M = (name, tex, fw, fh, extra = {}) => { KINDS[name] = { tex, fw, fh, oy: 0, ...extra }; };

// Centro Pokémon
M('counterJoy', 'counter', 8, 2, { solidCells: [[0, 0], [7, 0], ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i, 1])] });
M('counterTroca', 'counter', 2, 1);
M('maquinaCura', 'machine', 2, 1);
M('armarioCentro', 'shelf', 2, 1);
M('escadaRolante', 'shelf', 2, 2);
M('sofaCentro', 'bench', 2, 1);
M('sofaCentroN', 'bench', 2, 1);
M('sofaLadoL', 'bench', 1, 2);
M('sofaLadoR', 'bench', 1, 2);
M('mesaRevistas', 'flowerpot', 1, 1);
M('tvRack', 'tv', 2, 1);
M('plantaGrande', 'plant', 1, 1);
// Mercado
M('counterLoja', 'counter', 4, 1);
M('prateleiraParede', 'shelf', 3, 1, { solidCells: [] });
M('vitrineFria', 'shelf', 2, 1);
M('gondola', 'shelf', 4, 1);
M('gondola3', 'shelf', 3, 1);
M('expositor', 'table', 2, 1);
M('cestas', 'crate', 1, 1);
// casas
M('tvConsole', 'tv', 2, 1);
M('sofaCasa', 'bench', 2, 1);
M('sofaCasaN', 'bench', 2, 1);
M('sofaCasaLadoL', 'bench', 1, 2);
M('vaso', 'flowerpot', 1, 1);
M('poltronaCasa', 'bench', 1, 1);
M('mesaJantar', 'table', 2, 1);
M('cadeira', 'crate', 1, 1);
M('cadeiraL', 'crate', 1, 1);
M('cadeiraR', 'crate', 1, 1);
M('pia', 'obj_fogao', 2, 1);
M('fogaoMod', 'crate', 1, 1);
M('estanteAlta', 'shelf', 1, 1);
M('estanteLarga', 'shelf', 2, 1);
M('criado', 'crate', 1, 1);
M('piano', 'table', 2, 1);
M('aquario', 'tv', 1, 1);
M('relogioPe', 'shelf', 1, 1);
M('lareira', 'obj_fogao', 2, 1);
M('mesaCentroCasa', 'table', 2, 1);
// laboratório
M('maquinaLab', 'machine', 2, 1);
M('computadorLab', 'pc', 2, 1);
M('mesaPapeis', 'table', 2, 1);
M('tanque', 'machine', 1, 1);
