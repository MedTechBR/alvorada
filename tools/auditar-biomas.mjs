// Auditoria de biomas das áreas de encontro. Só Node, sem Chrome. Uso (na raiz do repositório):
//   node tools/auditar-biomas.mjs            confere o estado atual e grava docs/auditoria-biomas.md
//   node tools/auditar-biomas.mjs --sem-gravar   só mostra o resumo
// "Antes" = src/data/habitats.js no commit base (595e4836). Regras em tools/biomas-regras.mjs.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { arq, carregarDados, analisar, desviosDaArea, bst } from './biomas-analise.mjs';
import { SEGMENTOS, ASSINATURA, faixaDoSegmento, segmentoDe } from './biomas-regras.mjs';

const SEM_GRAVAR = process.argv.includes('--sem-gravar');
const BASE = '595e4836';

async function dadosDoCommit(rev) {
  const src = execSync(`git -C "${arq('.')}" show ${rev}:src/data/habitats.js`, { encoding: 'utf8', maxBuffer: 64 << 20 });
  const H = await import('data:text/javascript,' + encodeURIComponent(src));
  return H;
}

const atual = await carregarDados();
const antigo = await dadosDoCommit(BASE);
const analiseAtual = analisar(atual);
const linhas = analiseAtual.linhas;

// desvios antes (commit base) e depois (estado atual), por área
const antesDados = { ...atual, AREAS: antigo.AREAS_ENCONTROS };
const analiseAntes = analisar({ ...antesDados });
const antesPorArea = {};
let antesLinhas = 0, antesAreas = 0;
for (const l of analiseAntes.linhas) {
  const m = desviosDaArea(antesDados, l);
  antesPorArea[l.id] = m.length; antesLinhas += m.length; if (m.length) antesAreas++;
}
let depoisLinhas = 0, depoisAreas = 0;
const detalhe = {};
for (const l of linhas) {
  const m = desviosDaArea(atual, l);
  detalhe[l.id] = m; depoisLinhas += m.length; if (m.length) depoisAreas++;
}

// Variedade: distintas por tabela (6 a 12)
const variedade = [];
for (const l of linhas) {
  for (const t of ['dia', 'noite']) {
    const n = new Set((atual.AREAS[l.id][t] || []).map((r) => r[0])).size;
    if (n < 6 || n > 12) variedade.push(`${l.id} ${t}: ${n}`);
  }
}
// União por área (dia + noite): até 18
const uniaoAcima = [];
for (const l of linhas) {
  const u = new Set([...atual.AREAS[l.id].dia, ...atual.AREAS[l.id].noite].map((r) => r[0])).size;
  if (u > 18) uniaoAcima.push(`${l.id} ${u}`);
}
// Cobertura: toda espécie que era selvagem no commit base (dia ou noite) tem de continuar selvagem em alguma área
const selvBase = new Set();
for (const a of Object.values(antigo.AREAS_ENCONTROS)) for (const t of ["dia", "noite"]) for (const r of a[t] || []) selvBase.add(r[0]);
const selvAgora = new Set();
for (const l of linhas) for (const t of ["dia", "noite"]) for (const r of atual.AREAS[l.id][t] || []) selvAgora.add(r[0]);
const semFonte = [...selvBase].filter((d) => !selvAgora.has(d)).sort((p, q) => p - q);
// Rara: ao menos uma espécie de peso 1 na tabela de dia
const semRara = linhas.filter((l) => !(atual.AREAS[l.id].dia || []).some((r) => r[3] <= 1)).map((l) => l.id);
// Níveis: cada área dentro da faixa do seu segmento
const pj = linhas.filter((l) => l.seg === 'PJ');
const cMin = Math.min(...pj.map((l) => l.custo)), cMax = Math.max(...pj.map((l) => l.custo));
const foraDaFaixa = [];
for (const l of linhas) {
  const seg = l.seg || segmentoDe(l.id, l.regiao);
  const [lo, hi] = faixaDoSegmento(seg, atual.AREAS[l.id].custo, cMin, cMax);
  const niv = atual.AREAS[l.id].nivel;
  if (niv[0] !== lo || niv[1] !== hi) foraDaFaixa.push(l.id);
  for (const t of ['dia', 'noite']) for (const r of atual.AREAS[l.id][t] || []) if (r[1] !== lo || r[2] !== hi) foraDaFaixa.push(`${l.id}/${t}`);
}

// Assinatura de cada região: a região tem os tipos que a identificam?
const grupos = {
  geada: (l) => l.regiao === 'geada', brasas: (l) => l.regiao === 'brasas', sertao: (l) => l.regiao === 'sertao',
  jandaia: (l) => l.regiao === 'jandaia', costa: (l) => ['praia', 'mar', 'recife'].includes(l.efetivo),
  brejo: (l) => l.efetivo === 'brejo', caverna: (l) => l.efetivo === 'caverna', planalto: (l) => l.efetivo === 'planalto',
};
const assinatura = [];
for (const [g, f] of Object.entries(grupos)) {
  const ids = linhas.filter(f).map((l) => l.id);
  const tipos = {};
  for (const id of ids) for (const t of ['dia', 'noite']) for (const r of atual.AREAS[id][t] || []) for (const ty of atual.ESPECIES?.[r[0]]?.types || []) tipos[ty] = (tipos[ty] || 0) + 1;
  const sig = ASSINATURA[g];
  const achou = sig.tipos.filter((t) => tipos[t]);
  assinatura.push({ g, nome: sig.nome, areas: ids.length, esperado: sig.tipos, achou, ok: achou.length > 0 });
}
const ocaso = linhas.filter((l) => ['poente_leste', 'poente_oeste'].includes(l.regiao));
const raroOcaso = ocaso.filter((l) => (atual.AREAS[l.id].dia || []).some((r) => r[3] <= 1)).length;

// Alfa: espécie do alfa fora do bioma (mantida por regra de missão)
const alfaFora = linhas.filter((l) => detalhe[l.id].some((x) => x.tabela === 'alfa')).map((l) => `${l.id} (#${atual.AREAS[l.id].alfa[0]})`);

const resumo = {
  areas: linhas.length, antesLinhas, antesAreas, depoisLinhas, depoisAreas,
  variedade: variedade.length, uniaoAcima: uniaoAcima.length, semRara: semRara.length, coberturaPerdida: semFonte.length, selvBase: selvBase.size, foraDaFaixa: foraDaFaixa.length,
  assinaturaOk: assinatura.filter((x) => x.ok).length, assinatura: assinatura.length, alfaFora: alfaFora.length,
};
console.log(JSON.stringify(resumo));
if (SEM_GRAVAR) process.exit(0);

// ---------------- relatório
const L = [];
L.push('# Auditoria de biomas das áreas de encontro', '');
L.push('Gerado por `node tools/auditar-biomas.mjs` (Node, sem Chrome). Regras em `tools/biomas-regras.mjs`; análise em `tools/biomas-analise.mjs`; ajuste em `tools/ajustar-biomas.mjs`.', '');
L.push('## Resumo', '');
L.push('| Medida | Antes (commit 595e4836) | Depois |', '|---|---|---|');
L.push(`| Linhas fora do bioma (dia, noite e alfa) | ${antesLinhas} | ${depoisLinhas} |`);
L.push(`| Áreas com ao menos um desvio | ${antesAreas} de ${linhas.length} | ${depoisAreas} de ${linhas.length} |`);
L.push(`| Áreas com tabela de dia/noite fora de 6–12 espécies | — | ${variedade.length} |`);
L.push(`| Áreas sem espécie rara (peso 1) no dia | — | ${semRara.length} |`);
L.push(`| Áreas com união dia+noite acima de 18 | — | ${uniaoAcima.length} |`);
L.push(`| Espécies selvagens no commit base sem nenhuma fonte selvagem | ${selvBase.size} espécies selvagens | ${semFonte.length} |`);
L.push(`| Níveis fora da faixa do segmento | — | ${foraDaFaixa.length} |`);
L.push(`| Regiões com a assinatura de tipos | — | ${resumo.assinaturaOk} de ${assinatura.length} |`);
L.push(`| Alfas fora do bioma (mantidos por regra de missão) | — | ${alfaFora.length} |`, '');
if (depoisLinhas === 0) L.push('Resultado: 0 desvios de espécie fora do bioma nas tabelas de dia e noite.', '');
L.push('Regra do bioma: nome da área primeiro (ex.: "Rota 15, Passo do Uivo" fica neve pelo mapa da Geada); senão, o rótulo do arquivo da própria região; senão, o `bioma` de `src/data/habitats.js`. O chão dos mapas (contagem de tiles, amostra a cada 4 blocos) é a conferência: divergências aparecem na tabela.', '');
L.push('## Áreas: bioma, segmento e faixa de nível', '');
L.push('| Área | Região | Segmento | Bioma usado | Rótulo do mapa | Chão (tiles) | Nível antes | Nível depois | Espécies dia/noite | Desvios antes → depois |', '|---|---|---|---|---|---|---|---|---|---|');
const nivelAntes = (id) => antigo.AREAS_ENCONTROS[id].nivel.join('–');
for (const l of linhas) {
  const a = atual.AREAS[l.id];
  const seg = l.seg || segmentoDe(l.id, l.regiao);
  const segTxt = seg === 'PJ' ? 'PJ' : String(seg);
  const chao = l.chao ? `${l.chao} (${Math.round(l.chaoParte * 100)}%)` : (l.chaoTop || '—');
  const rot = l.rotuloRegiao ? `${l.rotuloRegiao} (região)` : (l.rotulo + ' (hab.)');
  const dia = new Set(a.dia.map((r) => r[0])).size, noi = new Set(a.noite.map((r) => r[0])).size;
  L.push(`| ${l.nome} (\`${l.id}\`) | ${l.regiao || '—'} | ${segTxt} | ${l.efetivo}${l.nomeBioma ? ' (nome)' : ''} | ${rot} | ${chao} | ${nivelAntes(l.id)} | ${a.nivel.join('–')} | ${dia}/${noi} | ${antesPorArea[l.id] || 0} → ${detalhe[l.id].length} |`);
}
L.push('', '## Segmentos da ordem do jogo', '', '| Segmento | Trecho | Ace (líder) | Faixa de selvagens |', '|---|---|---|---|');
for (const [k, s] of Object.entries(SEGMENTOS)) {
  const faixa = k === 'PJ' ? '55–75 (pelo custo)' : `${s.ace - 6}–${s.ace - 2}`;
  L.push(`| ${k} | ${s.nome} | ${s.lider}${s.ace ? ' ' + s.ace : ''} | ${faixa} |`);
}
L.push('', '## Assinatura de cada região', '', '| Região | Áreas | Tipos esperados | Tipos presentes | OK |', '|---|---|---|---|---|');
for (const x of assinatura) L.push(`| ${x.nome} | ${x.areas} | ${x.esperado.join(', ')} | ${x.achou.join(', ') || '—'} | ${x.ok ? 'sim' : 'NÃO'} |`);
L.push('', `Ocaso (pós-jogo): ${raroOcaso} de ${ocaso.length} áreas com espécie rara (peso 1) no dia.`, '');
L.push('## Desvios que sobraram', '');
const sobra = Object.entries(detalhe).filter(([, v]) => v.length);
if (!sobra.length) L.push('Nenhum.', '');
else for (const [id, v] of sobra) L.push(`- \`${id}\`: ${v.map((x) => `${x.tabela} #${x.dex} ${x.nome} (${x.tipos.join('/')})`).join('; ')}`);
L.push('', '## Alfas', '', 'Alfa não muda de espécie (regra de missão). Quando a espécie do alfa não combina com o bioma, aparece aqui para decisão.', '');
for (const x of alfaFora) L.push(`- ${x}`);
if (!alfaFora.length) L.push('Nenhum alfa fora do bioma.');
L.push('', '## Cobertura', '');
L.push(semFonte.length ? 'Sem fonte selvagem (deveria ser 0): ' + semFonte.map((d) => `#${d} ${atual.ESPECIES[d].name}`).join(', ') : `Todas as ${selvBase.size} espécies que eram selvagens no commit base continuam selvagens em alguma área que combina com o bioma.`, '');
L.push('', '## Variedade e raridade', '');
L.push(variedade.length ? variedade.map((x) => `- ${x}`).join('\n') : 'Todas as tabelas têm de 6 a 12 espécies distintas.');
L.push('', semRara.length ? `Áreas sem rara no dia: ${semRara.join(', ')}` : 'Toda área tem uma espécie rara (peso 1) na tabela de dia.', '');
fs.writeFileSync(arq('docs/auditoria-biomas.md'), L.join('\n') + '\n');
console.log('gravado: docs/auditoria-biomas.md');
