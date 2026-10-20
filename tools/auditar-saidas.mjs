// Auditoria das portas de saída dos interiores (todas as salas: Centros, Mercados, casas, laboratório, ginásios,
// estádios, cavernas, salas geradas). Monta o mundo como o jogo (tools/vestir/mundo.mjs) e, para cada sala, confere:
//   1. cada passagem de saída (tapete "m" das linhas e passagens do mapa que saem da sala) tem um tapete de saída
//      em cima (src/world/saidas.js: tapetesDeSaida, o que o 3D desenha);
//   2. nenhum tapete de saída (nem capacho de receita) fica fora de uma passagem;
//   3. saída na parede da frente: a parede baixa tem a abertura naquela coluna (aberturasDaFrente);
//   4. nenhum móvel cobre o tapete de saída nem trava o bloco de entrada dele (o de cima, de onde se pisa na porta).
// Rodar da raiz:  node tools/auditar-saidas.mjs   (sai com código 1 se achar problema)
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const { carregarMundo } = await abrir('tools/vestir/mundo.mjs');
const { tapetesDeSaida, aberturasDaFrente } = await abrir('src/world/saidas.js');
const { KINDS } = await abrir('src/world/objects.js');

const M = await carregarMundo('alvorada');
const { R, S } = M;
const OH = R.outdoorH ?? M.H;
const probs = [];
let nSaidas = 0, nSalas = 0;
// passagens do mapa (absolutas) que saem de uma sala para o ar livre
const destino = (w) => (typeof w.to === 'string' ? R.spots?.[w.to] : w.to);
const objs = [...S.placed, ...(S.novos ?? [])];
for (const r of R.interiors) {
  if (r.x == null || !r.rows) continue;
  nSalas++;
  const dentro = (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
  const saidas = new Set();
  r.rows.forEach((row, j) => [...row].forEach((c, i) => { if (c === 'm') saidas.add(i + ',' + j); }));
  for (const w of R.warps ?? []) {
    if (w.mundo || !dentro(w.x, w.y)) continue;
    const to = destino(w); if (!Array.isArray(to) || to[1] >= OH) continue; // escada/buraco para outra sala
    saidas.add((w.x - r.x) + ',' + (w.y - r.y));
  }
  nSaidas += saidas.size;
  const tapetes = tapetesDeSaida(r), naSaida = new Set(tapetes.map((t) => t.x + ',' + t.y));
  // 1. saída sem tapete
  for (const k of saidas) if (!naSaida.has(k)) probs.push(`${r.id}: saída em ${k} sem tapete de saída`);
  // 2. tapete fora de saída (o de saída e os capachos que alguma receita ainda pusesse)
  for (const t of tapetes) if (!saidas.has(t.x + ',' + t.y)) probs.push(`${r.id}: tapete de saída em ${t.x},${t.y} sem passagem`);
  for (const t of r.tapetes ?? []) if (/^capacho|^saida/.test(t.estilo)) probs.push(`${r.id}: capacho de receita "${t.estilo}" em ${t.x},${t.y} (${t.w}x${t.h}) não bate com a porta`);
  // 3. abertura na parede da frente
  const ab = aberturasDaFrente(r);
  for (const k of saidas) {
    const [x, y] = k.split(',').map(Number), baixo = r.rows[y + 1]?.[x];
    const frente = baixo === undefined || baixo === 'w' || baixo === ' ' || baixo === 'v' || baixo === '~';
    if (frente && !ab.has(x)) probs.push(`${r.id}: saída ${k} na parede da frente sem abertura`);
  }
  // 4. móveis em cima do tapete ou travando a entrada dele
  for (const o of objs) {
    if (!dentro(o.x, o.y)) continue;
    const K = KINDS[o.kind]; if (!K) continue;
    const solid = new Set((o.cells ?? []).map((c) => { const x = c % M.W, y = (c - x) / M.W; return (x - r.x) + ',' + (y - r.y); }));
    for (let j = 0; j < K.fh; j++) for (let i = 0; i < K.fw; i++) {
      const k = (o.x - r.x + i) + ',' + (o.y - r.y + j);
      if (saidas.has(k)) probs.push(`${r.id}: ${o.kind} em ${o.x - r.x},${o.y - r.y} cobre o tapete de saída ${k}`);
    }
    for (const k of saidas) { const [x, y] = k.split(',').map(Number); if (solid.has(x + ',' + (y - 1))) probs.push(`${r.id}: ${o.kind} trava a entrada da saída ${k} (bloco ${x},${y - 1})`); }
  }
}
console.log(`${nSalas} salas, ${nSaidas} saídas conferidas`);
if (probs.length) { console.log(`${probs.length} problema(s):`); for (const p of probs) console.log('  ' + p); process.exit(1); }
console.log('0 problemas: todo tapete de saída está numa porta, toda porta tem tapete e abertura, nenhum móvel no caminho');
