// Migração do núcleo para o continente grande (docs/mundo-expandido.md, seção 2). Idempotente: pode rodar de novo
// depois de juntar outro ramo que ainda mexia no alvorada.json antigo (só o que estiver no formato velho muda).
//
//   node tools/migrar-nucleo.mjs            (reescreve assets/maps/alvorada.json)
//   node tools/migrar-nucleo.mjs --conferir (só diz o que mudaria)
//
// O que faz:
// - w 600 → 1200, outdoorH 480 → 960, h → 2080; a operação de vazio da faixa de interiores vira rect void 0 960 1200 1120.
// - Tudo o que estava na faixa antiga de interiores (y de 480 a 959: salas, pontos, passagens, itens, moradores e
//   Pokémon soltos) desce 480 blocos. Lá fora (y < 480) nada muda. Em y 480–959 não há nada do núcleo no formato
//   novo (é o mar das regiões do sul), então qualquer coisa ali só pode ser do formato velho.
// - Liga as regiões ("regioes": um arquivo por região, desenhados depois do núcleo) e o retângulo/faixa do núcleo.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ARQ = new URL('../assets/maps/alvorada.json', import.meta.url);
const so = process.argv.includes('--conferir');
const J = JSON.parse(readFileSync(ARQ, 'utf8'));
const DY = 480, A0 = 480, A1 = 960; // faixa velha: y em [480, 960)
const velho = (y) => y >= A0 && y < A1;
const log = [];
const muda = (o, k, v, oque) => { if (o[k] !== v) { log.push(`${oque}: ${k} ${o[k]} → ${v}`); o[k] = v; } };

muda(J, 'w', 1200, 'mapa'); muda(J, 'outdoorH', 960, 'mapa'); muda(J, 'h', 2080, 'mapa');
// operação do vazio da faixa de interiores
for (const o of J.ops ?? []) if (o.op === 'rect' && o.t === 'void' && o.x === 0 && o.y === 480 && o.w === 600) { Object.assign(o, { y: 960, w: 1200, h: 1120 }); log.push('op void da faixa → rect void 0 960 1200 1120'); }
// salas
for (const r of J.interiors ?? []) if (velho(r.y)) { log.push(`sala ${r.id}: y ${r.y} → ${r.y + DY}`); r.y += DY; }
// pontos nomeados (os de dentro das salas, em coordenadas absolutas)
for (const [k, v] of Object.entries(J.spots ?? {})) if (Array.isArray(v) && velho(v[1])) { log.push(`ponto ${k}: y ${v[1]} → ${v[1] + DY}`); v[1] += DY; }
// passagens: origem e destino
for (const w of J.warps ?? []) {
  if (velho(w.y)) { log.push(`passagem (${w.x}, ${w.y}): y → ${w.y + DY}`); w.y += DY; }
  if (Array.isArray(w.to) && typeof w.to[0] === 'number' && velho(w.to[1])) { log.push(`passagem para (${w.to[0]}, ${w.to[1]}): y → ${w.to[1] + DY}`); w.to[1] += DY; }
}
// itens, moradores e Pokémon soltos com posição absoluta na faixa
for (const k of ['items', 'people', 'pets', 'objects', 'decor']) for (const o of J[k] ?? []) if (velho(o.y)) { log.push(`${k} (${o.x}, ${o.y}) → y ${o.y + DY}`); o.y += DY; }
for (const n of J.noTrees ?? []) if (velho(n[1])) { n[1] += DY; log.push('noTrees na faixa'); }
// núcleo e regiões
if (!J.rect) { J.rect = [0, 0, 600, 480]; log.push('rect do núcleo'); }
if (!J.faixa) { J.faixa = [0, 960, 1200, 320]; log.push('faixa de interiores do núcleo'); }
const REG = ['regioes/nucleo.json', 'regioes/geada.json', 'regioes/sertao.json', 'regioes/jandaia.json', 'regioes/austral.json', 'regioes/brasas.json'];
J.regioes ??= [];
for (const f of REG) if (!J.regioes.includes(f)) { J.regioes.push(f); log.push('região ' + f); }

if (!log.length) { console.log('alvorada.json já está no formato novo (nada a fazer).'); process.exit(0); }
console.log(log.join('\n'));
console.log(`${log.length} mudança(s).`);
if (so) process.exit(0);
// grava na ordem de campos de sempre e passa o formatador do mapa
const ordem = ['name', 'comment', 'w', 'h', 'outdoorH', 'rect', 'faixa', 'base', 'include', 'regioes'];
const out = {}; for (const k of ordem) if (k in J) out[k] = J[k]; for (const k of Object.keys(J)) if (!(k in out)) out[k] = J[k];
writeFileSync(ARQ, JSON.stringify(out, null, 2) + '\n');
try { execFileSync('python3', [new URL('formatar-mapa.py', import.meta.url).pathname, ARQ.pathname], { stdio: 'inherit' }); } catch { console.warn('formatar-mapa.py falhou (o arquivo ficou válido, só sem a formatação compacta)'); }
console.log('assets/maps/alvorada.json migrado.');
