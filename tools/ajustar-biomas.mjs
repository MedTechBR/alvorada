// Ajusta as espécies e os níveis das áreas de encontro (src/data/habitats.js, AREAS_ENCONTROS) e o campo
// "selvagem" de ONDE. Uso (na raiz do repositório):
//   node tools/ajustar-biomas.mjs            grava src/data/habitats.js
//   node tools/ajustar-biomas.mjs --simular  só mostra o resumo, não grava
// Regras: troca espécie fora do bioma por outra do mesmo bioma (parecida em status, taxa de captura e estágio
// evolutivo), mantém 6 a 12 espécies por tabela, uma rara por tabela de dia, níveis pela ordem do jogo
// (tools/biomas-regras.mjs). Alfa não muda (regra de missão), só é listado na auditoria.
import fs from 'node:fs';
import { arq, carregarDados, analisar, desviosDaArea, tiposOk, bst, criarEstagio } from './biomas-analise.mjs';
import { faixaDoSegmento, segmentoDe } from './biomas-regras.mjs';

const SIMULAR = process.argv.includes('--simular');
const dados = await carregarDados();
const { AREAS, ONDE, BIOMAS_PADRAO, BIOMAS_NOITE, ESPECIES } = dados;
const analise = analisar(dados);
const estagio = criarEstagio(ESPECIES);
const LEG = ['lendario', 'errante', 'evento', 'ultrafera', 'fossil', 'presente', 'troca', 'inicial', 'clube'];
const selvagem = (d) => (ONDE[d] || []).some((e) => e.como === 'selvagem');
const legendario = (d) => (ONDE[d] || []).some((e) => LEG.includes(e.como));

// Espécies que já aparecem em áreas do mesmo bioma (as áreas são a referência)
const usoPorBioma = {};
for (const l of analise.linhas) {
  for (const t of ['dia', 'noite']) for (const r of AREAS[l.id][t] || []) {
    (usoPorBioma[l.efetivo] ||= new Map()).set(r[0], (usoPorBioma[l.efetivo].get(r[0]) || 0) + r[3]);
  }
}
const poolCache = {};
function pool(biome) {
  if (poolCache[biome]) return poolCache[biome];
  const s = new Set([...(BIOMAS_PADRAO[biome] || []).map((r) => r[0]), ...(BIOMAS_NOITE[biome] || []).map((r) => r[0]), ...(usoPorBioma[biome] || new Map()).keys()]);
  return (poolCache[biome] = [...s].filter((d) => ESPECIES[d] && tiposOk(d, biome, ESPECIES) && !legendario(d)));
}
const fallbackCache = {};
const fallback = (biome) => (fallbackCache[biome] ||= Object.keys(ESPECIES).map(Number).filter((d) => selvagem(d) && tiposOk(d, biome, ESPECIES) && !legendario(d)));

const contaUso = {};
function escolher(biome, dexMisfit, excluir, areaId) {
  const m = ESPECIES[dexMisfit];
  const alvoEst = estagio(dexMisfit);
  const alvoBst = bst(m), alvoCatch = m.catchRate;
  const candidatos = pool(biome).filter((d) => !excluir.has(d) && d !== dexMisfit);
  const lista = candidatos.length ? candidatos : fallback(biome).filter((d) => !excluir.has(d) && d !== dexMisfit);
  let melhor = null, nota = Infinity;
  for (const d of lista) {
    const c = ESPECIES[d];
    const n = Math.abs(bst(c) - alvoBst) / 40 + Math.abs(c.catchRate - alvoCatch) / 60 + (estagio(d) === alvoEst ? 0 : 1.5)
      + ((contaUso[biome + ':' + d] || 0) * 0.3);
    if (n < nota || (n === nota && d < melhor)) { nota = n; melhor = d; }
  }
  if (melhor == null) throw new Error(`sem substituto para #${dexMisfit} em ${biome} (${areaId})`);
  contaUso[biome + ':' + melhor] = (contaUso[biome + ':' + melhor] || 0) + 1;
  return melhor;
}

// Faixa de nível: custo mínimo e máximo das áreas de pós-jogo (escala de 55 a 75)
const posJogo = analise.linhas.filter((l) => l.seg === 'PJ');
const custoMin = Math.min(...posJogo.map((l) => l.custo)), custoMax = Math.max(...posJogo.map((l) => l.custo));

const log = []; // trocas registradas (mostradas com --simular)
const novo = {};
let trocas = 0;
for (const l of analise.linhas) {
  const a = AREAS[l.id];
  const seg = l.seg || segmentoDe(l.id, l.regiao);
  if (!seg) throw new Error(`área sem segmento: ${l.id}`);
  const [lo, hi] = faixaDoSegmento(seg, a.custo, custoMin, custoMax);
  const area = { nivel: [lo, hi], custo: a.custo, bioma: a.bioma };
  if (a.alfa) area.alfa = a.alfa;
  const excluirBase = new Set();
  for (const t of ['dia', 'noite']) {
    let linhas = (a[t] || []).map((r) => ({ dex: r[0], w: r[3], extra: r.length > 4 ? r.slice(4) : null }));
    // 1) troca espécie fora do bioma
    const misses = new Set(desviosDaArea(dados, l, t).map((x) => x.dex));
    const presentes = new Set(linhas.map((r) => r.dex));
    linhas = linhas.map((r) => {
      if (!misses.has(r.dex)) return r;
      const ex = new Set([...presentes]);
      const d = escolher(l.efetivo, r.dex, ex, l.id);
      log.push({ area: l.id, tabela: t, de: r.dex, para: d, bioma: l.efetivo });
      trocas++;
      presentes.delete(r.dex); presentes.add(d);
      return { dex: d, w: r.w, extra: null };
    });
    // 2) junta repetidos e limita a 12 espécies (guarda a mais rara)
    const soma = new Map();
    for (const r of linhas) { const cur = soma.get(r.dex); soma.set(r.dex, cur ? { ...cur, w: cur.w + r.w } : { ...r }); }
    let u = [...soma.values()];
    if (u.length > 12) {
      const ord = [...u].sort((x, y) => y.w - x.w || x.dex - y.dex);
      const raro = ord[ord.length - 1];
      u = [...ord.slice(0, 11)];
      if (!u.some((r) => r.dex === raro.dex)) u.push(raro);
    }
    // 3) mínimo de 6 espécies
    while (u.length < 6) {
      const ex = new Set(u.map((r) => r.dex));
      const d = escolher(l.efetivo, u[0] ? u[0].dex : 0, ex, l.id);
      u.push({ dex: d, w: 2, extra: null });
    }
    // 4) rara por tabela de dia
    if (t === 'dia' && !u.some((r) => r.w <= 1)) {
      const ex = new Set(u.map((r) => r.dex));
      const d = escolher(l.efetivo, u[0].dex, ex, l.id);
      if (u.length < 12) u.push({ dex: d, w: 1, extra: null });
      else { const min = u.reduce((p, q) => (q.w < p.w ? q : p)); min.dex = d; min.w = 1; }
    }
    area[t] = u.map((r) => (r.extra ? [r.dex, lo, hi, r.w, ...r.extra] : [r.dex, lo, hi, r.w]));
  }
  novo[l.id] = area;
}
console.log(`trocas de espécie: ${trocas}`);
console.log(`áreas: ${Object.keys(novo).length}; faixas: ` + [...new Set(Object.values(novo).map((x) => x.nivel.join('-')))].sort().join(' '));

// ONDE: o campo "selvagem" passa a vir das áreas novas
const selvDe = {};
for (const id of Object.keys(novo)) {
  const ds = new Set([...(novo[id].dia || []), ...(novo[id].noite || [])].map((r) => r[0]));
  for (const d of ds) (selvDe[d] ||= []).push(id);
}
const ondeNovo = {};
for (const [k, lista] of Object.entries(ONDE)) {
  const d = +k;
  const outras = lista.filter((e) => e.como !== 'selvagem');
  const sel = selvDe[d] ? [{ como: 'selvagem', onde: selvDe[d], exclusiva: selvDe[d].length === 1 }] : [];
  ondeNovo[d] = sel.length && lista.findIndex((e) => e.como === 'selvagem') >= 0 ? [...outras.slice(0, lista.findIndex((e) => e.como === 'selvagem')), ...sel, ...outras.slice(lista.findIndex((e) => e.como === 'selvagem'))] : [...sel, ...outras];
}

if (SIMULAR) { console.log('(simulação: nada gravado)'); console.log(log.slice(0, 40)); process.exit(0); }

// Gravação: troca só os blocos AREAS_ENCONTROS e ONDE de src/data/habitats.js
const arquivo = arq('src/data/habitats.js');
const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
const fmtArea = (id, x) => {
  const extra = x.alfa ? `, alfa: ${JSON.stringify(x.alfa)}` : '';
  return `  ${id}: { nivel: [${x.nivel[0]},${x.nivel[1]}], custo: ${x.custo}, bioma: ${JSON.stringify(x.bioma)}${extra},\n    dia: ${JSON.stringify(x.dia)},\n    noite: ${JSON.stringify(x.noite)} },`;
};
const blocoArea = Object.entries(novo).map(([id, x]) => fmtArea(id, x));
const blocoOnde = Object.keys(ondeNovo).sort((p, q) => p - q).map((d) => `  ${d}: ${JSON.stringify(ondeNovo[d])},`);
function trocar(linhas, marca, bloco) {
  const ini = linhas.findIndex((l) => l.startsWith(marca));
  if (ini < 0) throw new Error('marca não achada: ' + marca);
  const fim = linhas.findIndex((l, i) => i > ini && l === '};');
  return [...linhas.slice(0, ini + 1), ...bloco, ...linhas.slice(fim)];
}
let saida = trocar(linhas, 'export const AREAS_ENCONTROS = {', blocoArea);
saida = trocar(saida, 'export const ONDE = {', blocoOnde);
fs.writeFileSync(arquivo, saida.join('\n'));
console.log(`gravado: ${arquivo}`);
