// Auditoria de obtenção: para cada uma das 1025 espécies da Pokédex nacional, diz de onde ela pode sair no jogo.
// Rodar da raiz do repositório (só Node, sem Chrome):
//   node tools/auditar-obtencao.mjs            confere tudo, imprime os totais e grava docs/obtencao.md
//   node tools/auditar-obtencao.mjs --so-contar  só imprime os totais (não grava)
//
// Fontes (as mesmas que o jogo usa, lidas direto):
//   - selvagem / alfa / errante: tabelas de encontro das áreas (src/data/habitats.js → AREAS_ENCONTROS)
//   - tocas (Gigantamax): src/data/habitats.js → GIGANTAMAX
//   - estáticas: presentes, trocas com NPC, iniciais, lendários, eventos, fósseis, Ultra-Feras, evoluções locais
//     (tools/mundo/especiais.mjs → OBTENCAO) e a Creche (OVOS)
//   - evoluções: grafo de src/data/species.js (SPECIES[dex].evo). Uma evolução só conta se o jeito de evoluir existe
//     no jogo: por nível, pedra/item (o item existe em src/data/items.js), amizade, hora, golpe, clima, equipe,
//     natureza, região, e as regras novas (segurar item, lugar, golpes de um tipo). Troca SÓ online não conta.
// Uma espécie é obtível se tem uma fonte, ou se evolui de uma espécie obtível por um jeito que o jogo suporta.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SO_CONTAR = process.argv.includes('--so-contar');

const H = await import('../src/data/habitats.js');
const S = await import('../src/data/species.js');
const I = await import('../src/data/items.js');
const ESP = await import('./mundo/especiais.mjs');
const { SPECIES } = S;
const { ITEMS } = I;
// ids de lugar que as regras de evolução usam (place): têm de existir como área ou sala nos mapas
const IDS_MAPA = new Set();
{
  const pastaMapas = path.join(RAIZ, 'assets/maps');
  const varre = (dir) => { for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) varre(p);
    else if (f.name.endsWith('.json')) { try { const d = JSON.parse(fs.readFileSync(p, 'utf8')); for (const k of ['areas', 'interiors']) for (const a of d[k] ?? []) if (a?.id) IDS_MAPA.add(a.id); } catch { /* ignora */ } }
  } };
  varre(pastaMapas);
}
const LUGARES_USADOS = new Set();
for (const s of Object.values(SPECIES)) for (const v of [s, ...Object.values(s.forms)]) for (const r of v.evo ?? []) for (const l of r.place ?? []) LUGARES_USADOS.add(l);
// salas que a história e as obtenções precisam: Laboratório de Fósseis (Cidade Buriti) e a Creche da Vó Iara
const SALAS_OBRIGATORIAS = ['lab_fosseis', 'creche_iara'];
// lendários fixos (src/data/lendarios.js): o lugar tem de existir no mapa, e o id da espécie tem de existir
const { LENDARIOS } = await import('../src/data/lendarios.js');
// fontes de OBTENCAO com lugar que não existe no mapa (ex.: 'cratera_tempo_2'): a espécie conta como obtível,
// mas o lugar ainda precisa ser construído. Só aviso: o relatório lista quantas.
const ONDE_SEM_MAPA = [];
for (const [chave, lista] of Object.entries(ESP.OBTENCAO)) for (const o of lista) {
  const id = String(o.onde ?? '').split(/[ (]/)[0];
  if (id && !id.startsWith('(') && !IDS_MAPA.has(id) && !['laboratorio', 'clube'].includes(id)) ONDE_SEM_MAPA.push(`${chave}:${id}`);
}
const LEND_COM_LUGAR = LENDARIOS.filter((l) => l.lugar);
const LEND_SO_NO_PAPEL = [];
const LEND_SEM_MAPA = LEND_COM_LUGAR.filter((l) => !IDS_MAPA.has(l.lugar)).map((l) => `${l.id}@${l.lugar}`);
const LEND_SEM_ESPECIE = LENDARIOS.filter((l) => !SPECIES[l.dex]).map((l) => l.id);
const LUGARES_SEM_MAPA = [...LUGARES_USADOS, ...SALAS_OBRIGATORIAS, ...LEND_SEM_MAPA.map((x) => x.split('@')[1])].filter((l) => !IDS_MAPA.has(l));

const TOTAL = 1025;
const CATEGORIAS = {
  selvagem: 'Selvagem (área, dia/noite)',
  alfa: 'Alfa (área)',
  errante: 'Errante (aparece pelo mapa)',
  toca: 'Toca de Luz (Gigantamax)',
  lendario: 'Lendário/mítico fixo',
  evento: 'Evento / missão',
  presente: 'Presente / missão',
  troca: 'Troca com NPC',
  inicial: 'Inicial',
  clube: 'Clube dos Iniciais',
  fossil: 'Fóssil revivido',
  ovo: 'Ovo (Creche)',
  ultrafera: 'Ultra-Fera (Fenda Ultra)',
  evolucao_local: 'Evolução local (item/hora no mundo)',
  evolucao: 'Evolução de espécie obtível',
};

// formas: id da PokéAPI → dex
const FORMA_DEX = {};
for (const [k, v] of Object.entries(H.FORMAS ?? {})) FORMA_DEX[k] = v.dex;
for (const s of Object.values(SPECIES)) for (const f of Object.values(s.forms)) if (f.api) FORMA_DEX[f.api] = s.dex;
const dexDe = (x) => (typeof x === 'number' ? x : /^\d+$/.test(x) ? +x : FORMA_DEX[x] ?? null);

// fontes diretas: dex → [{ como, onde }]
const fontes = new Map();
const add = (dex, como, onde = '') => {
  if (dex == null) return;
  if (!fontes.has(dex)) fontes.set(dex, []);
  fontes.get(dex).push({ como, onde });
};

// 1) tabelas de encontro das áreas
const CHAVE_ENC = { dia: 'selvagem', noite: 'selvagem' };
for (const [area, t] of Object.entries(H.AREAS_ENCONTROS)) {
  for (const k of ['dia', 'noite']) for (const row of t[k] ?? []) add(dexDe(row[0]), CHAVE_ENC[k], area);
  if (t.alfa) add(dexDe(t.alfa[0]), 'alfa', area);
}
// 2) tocas Gigantamax
for (const [forma, info] of Object.entries(H.GIGANTAMAX ?? {})) add(info.dex, 'toca', info.tocas?.join(',') ?? forma);
// 3) fontes estáticas (OBTENCAO) e Creche (OVOS)
const MAPA_COMO = { inicial: 'inicial', presente: 'presente', troca: 'troca', fossil: 'fossil', lendario: 'lendario', evento: 'evento', errante: 'errante', ultrafera: 'ultrafera', 'evolucao-local': 'evolucao_local', alfa: 'alfa' };
for (const [chave, lista] of Object.entries(ESP.OBTENCAO)) {
  if (chave === 'clube') { for (const d of lista) add(d, 'clube', 'Porto Rubro'); continue; }
  const dex = dexDe(/^\d+$/.test(chave) ? +chave : chave);
  for (const o of lista) {
    const como = MAPA_COMO[o.como];
    if (!como) { console.warn(`aviso: como desconhecido em OBTENCAO[${chave}]: ${o.como}`); continue; }
    // lendário só conta se tiver encontro de verdade em src/data/lendarios.js (ou for o Necrozma da história)
    if (como === 'lendario' && dex !== 800 && !LENDARIOS.some((l) => l.dex === dex)) { LEND_SO_NO_PAPEL.push(dex); continue; }
    add(dex, como, o.onde);
  }
}
for (const d of ESP.OVOS) add(d, 'ovo', 'Creche');

// 4) evoluções: suportadas offline?
const ITEM_OK = (k) => !!ITEMS[k];
function evoSuportada(rule) {
  if (rule.trade && !rule.hold && !rule.place && !rule.movesOfType) return false; // troca só online
  if (rule.item && !rule.trade && !ITEM_OK(rule.item)) return false;
  if (rule.hold && !ITEM_OK(rule.hold)) return false;
  return true;
}

// Chave: 'dex' → fontes diretas. Resolve cadeia de evoluções até fechar.
const obtivel = new Map(); // dex → metodo principal
const ORDEM = ['inicial', 'clube', 'selvagem', 'alfa', 'errante', 'toca', 'lendario', 'evento', 'presente', 'troca', 'fossil', 'ovo', 'ultrafera', 'evolucao_local'];
for (const [dex, lista] of fontes) {
  const c = lista.map((f) => MAPA_COMO[f.como] ?? f.como);
  const como = [...ORDEM].find((o) => c.includes(o)) ?? c[0];
  obtivel.set(dex, como);
}
// evoluções
let mudou = true;
const evoDe = new Map(); // dex → [{ de, regra }] para diagnóstico
while (mudou) {
  mudou = false;
  // espécie base e formas com evolução própria (ex.: Zigzagoon de Galar → Linoone → Obstagoon); a forma segue a base
  for (const s of Object.values(SPECIES)) for (const v of [s, ...Object.values(s.forms).filter((f) => f.evo !== s.evo)]) {
    for (const regra of v.evo ?? []) {
      const alvo = regra.to;
      if (!SPECIES[alvo] || obtivel.has(alvo)) continue;
      if (!obtivel.has(v.dex)) continue;
      if (!evoSuportada(regra)) continue;
      obtivel.set(alvo, 'evolucao');
      evoDe.set(alvo, { de: v.dex, regra, forma: v.form });
      mudou = true;
    }
  }
}

// contagens
const inativos = [];
const porMetodo = {};
for (let d = 1; d <= TOTAL; d++) {
  const m = obtivel.get(d);
  if (!m) { inativos.push(d); continue; }
  porMetodo[m] = (porMetodo[m] ?? 0) + 1;
}
const obtiveis = TOTAL - inativos.length;
// formas: contagem para o relatório (as formas seguem a espécie base na auditoria)
const formasTotal = Object.values(SPECIES).reduce((n, s) => n + Object.keys(s.forms).length, 0);

// babies sem ovo
const BEBES = JSON.parse(fs.readFileSync(path.join(RAIZ, 'tools/mundo/especies.json'), 'utf8')).filter((x) => x.bebe).map((x) => x.dex);
const bebesFora = BEBES.filter((d) => !ESP.OVOS.includes(d));

// regras de troca: origem → alternativa
const linhasTroca = [];
for (const s of Object.values(SPECIES)) {
  const tr = (s.evo ?? []).filter((r) => r.trade);
  for (const r of tr) {
    const alt = (s.evo ?? []).filter((x) => x.to === r.to && !x.trade && (x.hold || x.place || x.movesOfType || x.partySpecies || x.friendship || x.level));
    const txt = alt.map((x) => {
      const p = [];
      if (x.level) p.push(`nível ${x.level}`);
      if (x.hold) p.push(`segurando ${ITEMS[x.hold]?.name ?? x.hold}`);
      if (x.place) p.push(`em ${x.place.join(' ou ')}`);
      if (x.movesOfType) p.push(`sabendo ${x.movesOfType.n} golpes ${x.movesOfType.type}`);
      if (x.partySpecies) p.push(`com ${SPECIES[x.partySpecies]?.name} na equipe`);
      if (x.friendship) p.push('amizade alta');
      if (x.time) p.push(x.time === 'night' ? 'de noite' : x.time);
      return p.join(', ');
    }).join(' | ');
    linhasTroca.push({ de: s.dex, nome: s.name, para: r.to, nomePara: SPECIES[r.to]?.name, troca: `${ITEMS[r.item]?.name ?? r.item} (troca)`, alternativa: txt || 'SEM ALTERNATIVA' });
  }
}
const semAlternativa = linhasTroca.filter((l) => l.alternativa === 'SEM ALTERNATIVA');
// espécies que, antes destas regras, só evoluíam por troca (sem nenhuma evolução de outro jeito): para o relatório
// (lê os dados originais da PokéAPI, em src/data/gen/especies.js, antes dos acréscimos de species.js)
const { ESPECIES: ORIGINAL } = await import('../src/data/gen/especies.js');
const SO_TROCA = [];
for (const l of linhasTroca) {
  const outras = Object.values(ORIGINAL).some((s) => [s, ...Object.values(s.forms ?? {})].some((v) => (v.evo ?? s.evo ?? []).some((r) => r.to === l.para && !r.trade)));
  if (!outras && !SO_TROCA.includes(l.para)) SO_TROCA.push(l.para);
}

// relatório
const nomeDe = (d) => SPECIES[d]?.name ?? `#${d}`;
const linhas = [];
linhas.push('# Obtenção das espécies (auditoria)', '');
linhas.push('Gerado por `node tools/auditar-obtencao.mjs`. Não edite à mão: mude as fontes (tools/mundo, src/data/species.js, src/mechanics/evolve.js) e rode de novo.', '');
linhas.push(`- Espécies na Pokédex nacional: **${TOTAL}**`);
linhas.push(`- Obteníveis no jogo: **${obtiveis}**`);
linhas.push(`- **Inativas: ${inativos.length}**`, '');
linhas.push('## Por como se obtém (primeiro método da lista de prioridade)', '', '| Método | Espécies |', '|---|---:|');
for (const [k, v] of Object.entries(porMetodo).sort((a, b) => b[1] - a[1])) linhas.push(`| ${CATEGORIAS[k] ?? k} | ${v} |`);
linhas.push('', `## Babies\n\n- Babies na lista nacional: ${BEBES.length}; na Creche (OVOS): ${BEBES.length - bebesFora.length}. ${bebesFora.length ? 'Faltando: ' + bebesFora.map(nomeDe).join(', ') : 'Todos cobertos.'}`, '');
linhas.push('## Trocas (evoluções que pedem troca)', '', 'Online, a troca continua valendo. Offline, cada uma tem o jeito abaixo.', '', '| Origem | Evolui para | Troca (original) | Como sem troca |', '|---|---|---|---|');
for (const l of linhasTroca) linhas.push(`| ${l.nome} (#${l.de}) | ${l.nomePara} (#${l.para}) | ${l.troca} | ${l.alternativa} |`);
linhas.push('', `Trocas sem alternativa: **${semAlternativa.length}**`, '');
linhas.push('## Lendários fixos (src/data/lendarios.js)', '', '| Espécie | Nível | Lugar | Etapa |', '|---|---:|---|---|');
for (const l of LENDARIOS) linhas.push(`| ${l.nome} (#${l.dex}) | ${l.nivel} | ${l.lugar ?? 'sem lugar ainda'} | ${l.etapa} |`);
linhas.push('', '## Espécies inativas', '');
linhas.push(inativos.length ? inativos.map((d) => `- #${d} ${nomeDe(d)}`).join('\n') : 'Nenhuma.', '');
linhas.push(`## Formas\n\nFormas cadastradas (regionais, de gênero, alternativas, mega, Gigantamax): ${formasTotal}. A auditoria conta a espécie; cada forma regional tem a sua fonte em tools/mundo/especiais.mjs (OBTENCAO) ou nas tabelas de área.`, '');

const destino = path.join(RAIZ, 'docs/obtencao.md');
if (!SO_CONTAR) fs.writeFileSync(destino, linhas.join('\n') + '\n', 'utf8');

console.log(`Espécies: ${TOTAL}; obteníveis: ${obtiveis}; inativas: ${inativos.length}`);
console.log('Por método:', JSON.stringify(porMetodo));
console.log(`Trocas: ${linhasTroca.length} regras de troca; sem alternativa: ${semAlternativa.length}; espécies que só evoluíam por troca (agora têm jeito): ${SO_TROCA.length}`);
console.log(`Babies fora da Creche: ${bebesFora.length}`);
if (inativos.length) console.log('Inativas:', inativos.map((d) => `${d} ${nomeDe(d)}`).join(', '));
if (!SO_CONTAR) console.log(`Gravado: ${path.relative(RAIZ, destino)}`);
if (LEND_SEM_ESPECIE.length) console.log(`ERRO: lendários com espécie inexistente: ${LEND_SEM_ESPECIE.join(', ')}`);
console.log(`Lendários: ${LENDARIOS.length} cadastrados, ${LEND_COM_LUGAR.length} com lugar, ${LENDARIOS.length - LEND_COM_LUGAR.length} sem lugar ainda`);
if (LUGARES_SEM_MAPA.length) console.log(`ERRO: lugares das regras de evolução que não existem nos mapas: ${LUGARES_SEM_MAPA.join(', ')}`);
console.log(`Fontes de OBTENCAO em lugares que ainda não existem no mapa: ${ONDE_SEM_MAPA.length} (ex.: ${[...new Set(ONDE_SEM_MAPA)].join(', ')})`);
console.log(`Lugares das regras de evolução: ${LUGARES_USADOS.size} ids, ${LUGARES_SEM_MAPA.length} sem mapa`);
if (LEND_SO_NO_PAPEL.length) console.log(`Lendários só no papel (sem encontro em lendarios.js): ${LEND_SO_NO_PAPEL.join(', ')}`);
process.exitCode = LEND_SO_NO_PAPEL.length || inativos.length || semAlternativa.length || LUGARES_SEM_MAPA.length || LEND_SEM_ESPECIE.length ? 1 : 0;
