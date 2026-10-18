// Alinha os dados de tempo real dos golpes (kind, range, count) com as receitas de animação do combate
// (src/combat/anims/*). Gera src/data/gen/receitas.js, que src/data/moves.js aplica por cima do mapeamento
// automático. Rodar da raiz do repositório depois de mudar as receitas:
//   node tools/alinhar_receitas.mjs
import { writeFileSync } from 'node:fs';
import { ANIMS } from '../src/combat/anims/index.js';
import { GOLPES } from '../src/data/gen/golpes.js';

// alcance padrão de cada forma (o mesmo de src/combat/anims/kit.js)
const RANGE = { proj: 12, melee: 1.8, multi: 1.8, dash: 6, cone: 6, wave: 6, quake: 5, cloud: 9, rain: 10, self: 0, bolt: 8, sky: 11, surf: 9, target: 9, shield: 0, line: 10, fly: 9, dig: 9, dive: 9 };

function inferir(a, auto) {
  if (a.kind) return a.kind;
  if (a.data?.kind) return a.data.kind;
  if (a.beam) return 'proj';
  if (a.shield) return 'shield';
  if (a.sky) return 'sky';
  if (a.bolt) return 'bolt';
  if (a.target) return 'target';
  if (a.surfColor) return 'surf';
  if (a.melee) return auto === 'multi' ? 'multi' : 'melee';
  if (a.dash || a.dashStart) return 'dash';
  if (a.cone) return 'cone';
  if (a.wave) return auto === 'quake' ? 'quake' : 'wave';
  if (a.self) return 'self';
  if (a.rainTex) return 'rain';
  if (a.cloudColor || a.cloudTex) return 'cloud';
  if (a.head || a.trail) return 'proj';
  return null;
}

const out = {}, mudou = [];
for (const [id, a] of Object.entries(ANIMS)) {
  const g = GOLPES[id];
  if (!g) continue; // golpe sem dado oficial (fica com o dado mínimo da receita)
  const k = inferir(a, g.kind);
  if (!k) continue;
  const o = { kind: k };
  if (k !== g.kind) { o.range = a.data?.range ?? RANGE[k] ?? g.range; mudou.push(`${id}: ${g.kind} → ${k}`); }
  const n = a.count ?? a.data?.count;
  if (n) o.count = n;
  if (a.data?.hits) o.hits = a.data.hits;
  out[id] = o;
}

const linhas = Object.entries(out).map(([id, o]) => `  ${id}: ${JSON.stringify(o)},`);
writeFileSync(new URL('../src/data/gen/receitas.js', import.meta.url),
  `// GERADO por tools/alinhar_receitas.mjs a partir de src/combat/anims/*. Não edite à mão.\n` +
  `// Forma de execução (kind), alcance e quantidade de projéteis que combinam com cada receita de animação.\n` +
  `export const RECEITAS = {\n${linhas.join('\n')}\n};\n`);
console.log(`${Object.keys(out).length} golpes com receita; ${mudou.length} mudaram de forma:\n  ${mudou.join('\n  ')}`);
