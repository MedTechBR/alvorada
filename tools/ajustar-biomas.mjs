// Ajusta as espécies e os níveis das áreas de encontro (src/data/habitats.js, AREAS_ENCONTROS) e o campo
// "selvagem" de ONDE. Roda sozinho ou no fim de tools/gerar-mundo.mjs (que grava habitats.js antes), então
// regerar o mundo reproduz o resultado:
//   node tools/ajustar-biomas.mjs            grava src/data/habitats.js (a partir do que está lá)
//   node tools/ajustar-biomas.mjs --simular  só mostra o resumo, não grava
// Regras: troca espécie fora do bioma por outra do mesmo bioma (parecida em status, taxa de captura e estágio
// evolutivo); cada tabela (dia e noite separadas) fica com 6 a 12 espécies e a área com até 18 na união; uma rara
// por tabela de dia; cobertura: toda espécie que era selvagem na entrada continua selvagem em alguma área que
// combine com o bioma (vai para a área mais próxima do segmento original). Níveis pela ordem do jogo
// (tools/biomas-regras.mjs). Alfa não muda (regra de missão).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { arq, carregarDados, analisar, desviosDaArea, tiposOk, bst, criarEstagio } from './biomas-analise.mjs';
import { faixaDoSegmento, segmentoDe } from './biomas-regras.mjs';

export const CAP_TABELA = 12, CAP_AREA = 18, MIN_TABELA = 6;
const LEG = ['lendario', 'errante', 'evento', 'ultrafera', 'fossil', 'presente', 'troca', 'inicial', 'clube'];
const segNum = (s) => (s === 'PJ' ? 15 : +s);

export async function ajustarBiomas({ escrever = true } = {}) {
  const dados = await carregarDados();
  const { AREAS, ONDE, BIOMAS_PADRAO, BIOMAS_NOITE, ESPECIES } = dados;
  const analise = analisar(dados);
  const estagio = criarEstagio(ESPECIES);
  const selvagem = (d) => (ONDE[d] || []).some((e) => e.como === 'selvagem');
  const legendario = (d) => (ONDE[d] || []).some((e) => LEG.includes(e.como));

  // Entrada: quem era selvagem, em que tabelas, peso máximo, segmento de origem e bioma(s) de origem
  const entrada = new Map();
  for (const l of analise.linhas) for (const t of ['dia', 'noite']) for (const r of AREAS[l.id][t] || []) {
    const seg = segNum(l.seg || segmentoDe(l.id, l.regiao));
    const cur = entrada.get(r[0]);
    if (!cur) entrada.set(r[0], { anc: seg, tabelas: new Set([t]), peso: r[3], biomas: new Set([l.efetivo]) });
    else { cur.tabelas.add(t); cur.peso = Math.max(cur.peso, r[3]); cur.biomas.add(l.efetivo); }
  }

  const usoPorBioma = {};
  for (const l of analise.linhas) for (const t of ['dia', 'noite']) for (const r of AREAS[l.id][t] || []) {
    (usoPorBioma[l.efetivo] ||= new Map()).set(r[0], (usoPorBioma[l.efetivo].get(r[0]) || 0) + r[3]);
  }
  const poolCache = {};
  const pool = (biome) => (poolCache[biome] ||= (() => {
    const s = new Set([...(BIOMAS_PADRAO[biome] || []).map((r) => r[0]), ...(BIOMAS_NOITE[biome] || []).map((r) => r[0]), ...(usoPorBioma[biome] || new Map()).keys()]);
    return [...s].filter((d) => ESPECIES[d] && tiposOk(d, biome, ESPECIES) && !legendario(d));
  })());
  const fallbackCache = {};
  const fallback = (biome) => (fallbackCache[biome] ||= Object.keys(ESPECIES).map(Number).filter((d) => selvagem(d) && tiposOk(d, biome, ESPECIES) && !legendario(d)));

  const contaUso = {};
  function escolher(biome, dexMisfit, excluir, areaId) {
    const m = ESPECIES[dexMisfit];
    const alvoEst = estagio(dexMisfit), alvoBst = bst(m), alvoCatch = m.catchRate;
    const cands = pool(biome).filter((d) => !excluir.has(d) && d !== dexMisfit);
    const lista = cands.length ? cands : fallback(biome).filter((d) => !excluir.has(d) && d !== dexMisfit);
    let melhor = null, nota = Infinity;
    for (const d of lista) {
      const c = ESPECIES[d];
      const n = Math.abs(bst(c) - alvoBst) / 40 + Math.abs(c.catchRate - alvoCatch) / 60 + (estagio(d) === alvoEst ? 0 : 1.5) + (contaUso[biome + ':' + d] || 0) * 0.3;
      if (n < nota || (n === nota && d < melhor)) { nota = n; melhor = d; }
    }
    if (melhor == null) throw new Error(`sem substituto para #${dexMisfit} em ${biome} (${areaId})`);
    contaUso[biome + ':' + melhor] = (contaUso[biome + ':' + melhor] || 0) + 1;
    return melhor;
  }

  const posJogo = analise.linhas.filter((l) => l.seg === 'PJ');
  const custoMin = Math.min(...posJogo.map((l) => l.custo)), custoMax = Math.max(...posJogo.map((l) => l.custo));

  const log = [];
  const novo = {}, faixas = {};
  let trocas = 0;
  for (const l of analise.linhas) {
    const a = AREAS[l.id];
    const seg = l.seg || segmentoDe(l.id, l.regiao);
    if (!seg) throw new Error(`área sem segmento: ${l.id}`);
    const [lo, hi] = faixaDoSegmento(seg, a.custo, custoMin, custoMax);
    faixas[l.id] = [lo, hi];
    const area = { nivel: [lo, hi], custo: a.custo, bioma: a.bioma };
    if (a.alfa) area.alfa = a.alfa;
    for (const t of ['dia', 'noite']) {
      let linhas = (a[t] || []).map((r) => ({ dex: r[0], w: r[3], extra: r.length > 4 ? r.slice(4) : null }));
      // 1) troca espécie fora do bioma
      const misses = new Set(desviosDaArea(dados, l, t).map((x) => x.dex));
      const presentes = new Set(linhas.map((r) => r.dex));
      linhas = linhas.map((r) => {
        if (!misses.has(r.dex)) return r;
        const d = escolher(l.efetivo, r.dex, new Set(presentes), l.id);
        log.push({ area: l.id, tabela: t, de: r.dex, para: d, bioma: l.efetivo, motivo: 'fora do bioma' });
        trocas++;
        presentes.delete(r.dex); presentes.add(d);
        return { dex: d, w: r.w, extra: null };
      });
      // 2) junta repetidos e limita a 12 (guarda a mais rara)
      const soma = new Map();
      for (const r of linhas) { const cur = soma.get(r.dex); soma.set(r.dex, cur ? { ...cur, w: cur.w + r.w } : { ...r }); }
      let u = [...soma.values()];
      if (u.length > CAP_TABELA) {
        const ord = [...u].sort((x, y) => y.w - x.w || x.dex - y.dex);
        const raro = ord[ord.length - 1];
        u = [...ord.slice(0, CAP_TABELA - 1)];
        if (!u.some((r) => r.dex === raro.dex)) u.push(raro);
      }
      // 3) mínimo de 6 espécies
      while (u.length < MIN_TABELA) {
        const d = escolher(l.efetivo, u[0] ? u[0].dex : 0, new Set(u.map((r) => r.dex)), l.id);
        u.push({ dex: d, w: 2, extra: null });
      }
      // 4) rara por tabela de dia
      if (t === 'dia' && !u.some((r) => r.w <= 1)) {
        const d = escolher(l.efetivo, u[0].dex, new Set(u.map((r) => r.dex)), l.id);
        if (u.length < CAP_TABELA) u.push({ dex: d, w: 1, extra: null });
        else { const min = u.reduce((p, q) => (q.w < p.w ? q : p)); min.dex = d; min.w = 1; }
      }
      area[t] = u.map((r) => (r.extra ? [r.dex, lo, hi, r.w, ...r.extra] : [r.dex, lo, hi, r.w]));
    }
    novo[l.id] = area;
  }

  // 5) cobertura: quem era selvagem na entrada volta a ter fonte selvagem onde combina com o bioma
  const uniao = (id) => new Set([...novo[id].dia, ...novo[id].noite].map((r) => r[0]));
  const distintas = (id, t) => new Set(novo[id][t].map((r) => r[0])).size;
  const temFonte = new Set();
  for (const id of Object.keys(novo)) for (const d of uniao(id)) temFonte.add(d);
  const faltam = [...entrada.keys()].filter((d) => !temFonte.has(d)).sort((p, q) => p - q);
  const semLugar = [];
  let adicionadas = 0;
  for (const d of faltam) {
    const info = entrada.get(d);
    const cands = [];
    for (const l of analise.linhas) {
      if (!tiposOk(d, l.efetivo, ESPECIES, l.id)) continue;
      const id = l.id;
      if (uniao(id).has(d) || uniao(id).size >= CAP_AREA) continue;
      const seg = segNum(l.seg || segmentoDe(l.id, l.regiao));
      const pref = info.tabelas.has('dia') ? 'dia' : 'noite';
      const outra = pref === 'dia' ? 'noite' : 'dia';
      const tab = distintas(id, pref) < CAP_TABELA ? pref : (distintas(id, outra) < CAP_TABELA ? outra : null);
      if (!tab) continue;
      const mesmoBioma = info.biomas.has(l.efetivo) ? 0 : 50;
      cands.push({ id, tab, nota: mesmoBioma + Math.abs(seg - info.anc) });
    }
    cands.sort((p, q) => p.nota - q.nota || (p.id < q.id ? -1 : 1));
    if (!cands.length) { semLugar.push(d); continue; }
    const esc = cands[0];
    const [lo, hi] = faixas[esc.id];
    novo[esc.id][esc.tab].push([d, lo, hi, info.peso]);
    log.push({ area: esc.id, tabela: esc.tab, de: null, para: d, bioma: analise.linhas.find((x) => x.id === esc.id).efetivo, motivo: 'cobertura' });
    adicionadas++;
  }

  // ONDE: o campo "selvagem" passa a vir das áreas novas
  const selvDe = {};
  for (const id of Object.keys(novo)) for (const d of uniao(id)) (selvDe[d] ||= []).push(id);
  const ondeNovo = {};
  for (const [k, lista] of Object.entries(ONDE)) {
    const d = +k;
    const outras = lista.filter((e) => e.como !== 'selvagem');
    const iSel = lista.findIndex((e) => e.como === 'selvagem');
    const sel = selvDe[d] ? [{ como: 'selvagem', onde: selvDe[d], exclusiva: selvDe[d].length === 1 }] : [];
    ondeNovo[d] = sel.length && iSel >= 0 ? [...outras.slice(0, iSel), ...sel, ...outras.slice(iSel)] : [...sel, ...outras];
  }

  const resumo = { areas: Object.keys(novo).length, trocas, cobertura: adicionadas, semLugar, entradaSelvagens: entrada.size, selvagensFinal: Object.keys(selvDe).length, log };
  if (!escrever) return resumo;

  // Gravação: troca só os blocos AREAS_ENCONTROS e ONDE de src/data/habitats.js
  const arquivo = arq('src/data/habitats.js');
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
  const fmtArea = (id, x) => {
    const extra = x.alfa ? `, alfa: ${JSON.stringify(x.alfa)}` : '';
    return `  ${id}: { nivel: [${x.nivel[0]},${x.nivel[1]}], custo: ${x.custo}, bioma: ${JSON.stringify(x.bioma)}${extra},\n    dia: ${JSON.stringify(x.dia)},\n    noite: ${JSON.stringify(x.noite)} },`;
  };
  const blocoArea = Object.entries(novo).map(([id, x]) => fmtArea(id, x));
  const blocoOnde = Object.keys(ondeNovo).sort((p, q) => p - q).map((d) => `  ${d}: ${JSON.stringify(ondeNovo[d])},`);
  const trocar = (ls, marca, bloco) => {
    const ini = ls.findIndex((x) => x.startsWith(marca));
    if (ini < 0) throw new Error('marca não achada: ' + marca);
    const fim = ls.findIndex((x, i) => i > ini && x === '};');
    return [...ls.slice(0, ini + 1), ...bloco, ...ls.slice(fim)];
  };
  let saida = trocar(linhas, 'export const AREAS_ENCONTROS = {', blocoArea);
  saida = trocar(saida, 'export const ONDE = {', blocoOnde);
  fs.writeFileSync(arquivo, saida.join('\n'));
  return resumo;
}

// Execução direta: node tools/ajustar-biomas.mjs [--simular]
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = await ajustarBiomas({ escrever: !process.argv.includes('--simular') });
  console.log(`trocas de espécie: ${r.trocas}; cobertura: ${r.cobertura} espécies de volta; sem lugar: ${r.semLugar.length}`);
  console.log(`áreas: ${r.areas}; selvagens na entrada: ${r.entradaSelvagens}; selvagens na saída: ${r.selvagensFinal}`);
  if (!process.argv.includes('--simular')) console.log('gravado: src/data/habitats.js');
}
