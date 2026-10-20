// Mede a densidade de objetos ao ar livre (guia de biomas, passo 0): objetos por tela de 15 x 10 blocos, por área e
// por região. Lê os blocos montados pelo próprio motor (no Node, sem navegador).
//   node tools/densidade.mjs                 mede o mundo como está (com os enfeites de assets/maps/vestir/)
//   node tools/densidade.mjs --sem-vestir    mede só os JSON de mapa, sem a camada de enfeite (linha de base)
//   node tools/densidade.mjs --por-area      também lista cada área
//   node tools/densidade.mjs --json <arq>    grava o resumo em JSON
import { writeFileSync } from 'node:fs';
import { carregarMundo } from './vestir/mundo.mjs';
import { densidadePorArea, regiaoDe } from './vestir/analise.mjs';

const args = process.argv.slice(2);
const semVestir = args.includes('--sem-vestir'), porArea = args.includes('--por-area');
const jIdx = args.indexOf('--json'), jsonOut = jIdx >= 0 ? args[jIdx + 1] : null;
const M = await carregarMundo('alvorada', { semVestir });
const { R, OH } = M;
const { lab, blocos, objs } = densidadePorArea(M);
const tela = (o, b) => (b ? (o / b) * 150 : 0);

const porRegiao = {}, porBioma = {}, linhas = [];
R.areas.forEach((a, i) => {
  if (!a.rect || blocos[i] === 0) return;
  const reg = regiaoDe(R, a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2);
  const r = (porRegiao[reg] ??= { blocos: 0, objs: 0 }); r.blocos += blocos[i]; r.objs += objs[i];
  const b = (porBioma[a.biome] ??= { blocos: 0, objs: 0, n: 0 }); b.blocos += blocos[i]; b.objs += objs[i]; b.n++;
  linhas.push({ reg, id: a.id ?? '-', nome: a.name ?? '', bioma: a.biome, blocos: blocos[i], objs: objs[i], tela: tela(objs[i], blocos[i]) });
});
// a área inteira (todas as áreas) para o total
const totB = Object.values(porRegiao).reduce((s, r) => s + r.blocos, 0), totO = Object.values(porRegiao).reduce((s, r) => s + r.objs, 0);
const fmt = (n) => n.toFixed(1).padStart(6);
console.log(semVestir ? 'DENSIDADE: linha de base (sem a camada vestir)' : 'DENSIDADE: com a camada vestir');
console.log('\nPor região (objetos por tela de 15x10):');
for (const [reg, r] of Object.entries(porRegiao)) console.log(`  ${reg.padEnd(10)} blocos ${String(r.blocos).padStart(7)}  objetos ${String(r.objs).padStart(5)}  por tela ${fmt(tela(r.objs, r.blocos))}`);
console.log(`  ${'TOTAL'.padEnd(10)} blocos ${String(totB).padStart(7)}  objetos ${String(totO).padStart(5)}  por tela ${fmt(tela(totO, totB))}`);
console.log('\nPor bioma (objetos por tela):');
for (const [bio, b] of Object.entries(porBioma).sort((a, c) => c[1].blocos - a[1].blocos)) console.log(`  ${bio.padEnd(10)} áreas ${String(b.n).padStart(3)}  blocos ${String(b.blocos).padStart(7)}  por tela ${fmt(tela(b.objs, b.blocos))}`);
if (porArea) {
  console.log('\nPor área:');
  for (const l of linhas.sort((a, b) => (a.reg + a.id).localeCompare(b.reg + b.id))) console.log(`  ${l.reg.padEnd(9)} ${l.id.padEnd(22)} ${l.bioma.padEnd(9)} blocos ${String(l.blocos).padStart(6)} objetos ${String(l.objs).padStart(4)} por tela ${fmt(l.tela)}`);
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ semVestir, porRegiao, porBioma, areas: linhas }, null, 1));
