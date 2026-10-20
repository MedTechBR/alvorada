// Gera o plano do mundo ampliado e a distribuição das espécies, e confere tudo. Rodar da raiz do repositório:
//   node tools/gerar-mundo.mjs            gera docs/mundo-expandido.json, src/data/habitats.js e as tabelas do .md
//                                         (no fim, ajusta espécies e níveis das áreas: tools/ajustar-biomas.mjs)
//   node tools/gerar-mundo.mjs --conferir só confere e imprime o relatório (não grava nada)
//
// Entradas: tools/mundo/*.mjs (plano, cidades, dungeons, lugares, especiais), tools/mundo/especies.json (lista
// nacional; refaça com `python3 tools/mundo/extrair-especies.py` quando a lista crescer) e o mapa atual
// (assets/maps/alvorada.json + includes), de onde saem as tabelas que já existem e as distâncias reais a pé, nadando
// e escalando a partir da casa do jogador. Sem o mapa (ou se ele não montar), usa tools/mundo/distancias.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ajustarBiomas } from './ajustar-biomas.mjs'; // pós-passo: espécies e níveis das áreas (ver ajustar-biomas.mjs)
import * as modulo from 'node:module';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arq = (...p) => path.join(RAIZ, ...p);
const SO_CONFERIR = process.argv.includes('--conferir');

const PLANO = await import('./mundo/plano.mjs');
const { CIDADES, GINASIOS, ELITE, NIVEL_LIGA } = await import('./mundo/cidades.mjs');
const { DUNGEONS } = await import('./mundo/dungeons.mjs');
const { LUGARES, ALFAS } = await import('./mundo/lugares.mjs');
const ESP = await import('./mundo/especiais.mjs');
const JOGO = await import('../src/data/species.js');      // nomes das Mega Pedras e formas, como o jogo usa
const JOGO_ITENS = await import('../src/data/items.js');
const LISTA = JSON.parse(fs.readFileSync(arq('tools/mundo/especies.json'), 'utf8'));

const erros = [], avisos = [];
const erro = (m) => erros.push(m), aviso = (m) => avisos.push(m);

// ------------------------------------------------------------------------------------------------ espécies
const SP = new Map(LISTA.map((e) => [e.dex, e]));
const FORMA = new Map(); // id da forma -> { dex, classe, tipos }
for (const e of LISTA) for (const f of e.formas) FORMA.set(f.id, { dex: e.dex, ...f });
const FILHOS = new Map();
for (const e of LISTA) if (e.de) (FILHOS.get(e.de) ?? FILHOS.set(e.de, []).get(e.de)).push(e.dex);
// evoluções que só a forma regional faz (a forma comum não evolui nelas)
const EVO_REGIONAL = { 862: 'galar', 863: 'galar', 864: 'galar', 865: 'galar', 866: 'galar', 867: 'galar', 903: 'hisui', 904: 'hisui', 980: 'paldea' };
const ULTRA = new Set([793, 794, 795, 796, 797, 798, 799, 803, 804, 805, 806]);
const PARADOXO = new Set([984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 1005, 1006, 1009, 1010, 1020, 1021, 1022, 1023]);
const PSEUDO = new Set([147, 246, 371, 374, 443, 610, 633, 704, 782, 885, 996]);
const INICIAIS = new Set(ESP.OBTENCAO.clube);
const ehLendario = (d) => SP.get(d)?.lendario || SP.get(d)?.mitico || ULTRA.has(d);
const nivelEvo = (d) => { const e = SP.get(d)?.evo; return e && e.gatilho === 'level-up' && e.nivel && !e.item && !e.segurando ? e.nivel : null; };
const evoTroca = (d) => SP.get(d)?.evo?.gatilho === 'trade';

// ------------------------------------------------------------------------------------------------ mapa e distâncias
const CACHE = arq('tools/mundo/distancias.json');
async function medirNucleo() {
  const J = JSON.parse(fs.readFileSync(arq('assets/maps/alvorada.json'), 'utf8'));
  const areasMapa = [];
  for (const inc of J.include ?? []) {
    const I = JSON.parse(fs.readFileSync(arq('assets/maps', inc), 'utf8'));
    J.ops = [...(I.ops ?? []), ...(J.ops ?? [])]; areasMapa.push(...(I.areas ?? []));
  }
  areasMapa.push(...(J.areas ?? []));
  const tabelasMapa = {};
  for (const a of [...areasMapa, ...(J.interiors ?? [])]) if (a.id && a.encounters?.length) tabelasMapa[a.id] = a.encounters;
  let dist = null;
  try {
    // o build.js importa o PIXI (pela arte); para medir só os blocos, troca os módulos de arte por vazios
    const vazio = 'data:text/javascript,' + encodeURIComponent('const P=new Proxy(function(){},{get:(t,k)=>k==="then"?undefined:P,apply:()=>P,construct:()=>P});export default P;export const SPR=P,canvas=P,texOf=P,outline=P,Texture=P,Rectangle=P,WATER_FRAMES=[],FLOWERS=[],LILY=P,TALL=P,CORN=P;');
    const ganchos = { resolve(spec, ctx, next) { if (spec === 'pixi.js' || /\/art\.js$|^\.\/art\.js$/.test(spec)) return { url: vazio, shortCircuit: true }; return next(spec, ctx); } };
    if (modulo.registerHooks) modulo.registerHooks(ganchos);
    else modulo.register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,n){if(s==='pixi.js'||/\\/art\\.js$/.test(s))return{url:${JSON.stringify(vazio)},shortCircuit:true};return n(s,c)}`));
    const { buildRegion } = await import(arq('src/world/build.js'));
    const { TILE } = await import(arq('src/world/tiles.js'));
    const avisoConsole = console.warn; console.warn = () => {}; const logConsole = console.log; console.log = () => {};
    let R;
    try { R = buildRegion({ ...J, objects: [], trees: [], forestKinds: 0, ops: J.ops.filter((o) => !['trees', 'fence'].includes(o.op)) }); }
    finally { console.warn = avisoConsole; console.log = logConsole; }
    const W = R.W, H = J.outdoorH ?? R.H;
    const SOL = new Set([TILE.WATER, TILE.DEEP, TILE.CLIFF, TILE.VOID, TILE.WALL, TILE.FOREST, TILE.ROCK, TILE.MUD, TILE.CORN, TILE.CLIMB]);
    const PASSA = { correr: [TILE.MUD], nadar: [TILE.WATER, TILE.DEEP], escalar: [TILE.CLIMB] };
    const CONJ = [[], ['correr'], ['nadar'], ['correr', 'nadar'], ['escalar'], ['correr', 'escalar'], ['correr', 'nadar', 'escalar']];
    const { x: ox, y: oy } = PLANO.ORIGEM;
    const bfs = (caps) => {
      const ok = new Uint8Array(256); for (let t = 0; t < 256; t++) ok[t] = SOL.has(t) ? 0 : 1;
      for (const c of caps) for (const t of PASSA[c]) ok[t] = 1;
      const d = new Int32Array(W * H).fill(-1), q = new Int32Array(W * H); let h = 0, n = 0;
      d[ox + oy * W] = 0; q[n++] = ox + oy * W;
      while (h < n) {
        const i = q[h++], x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const j = X + Y * W; if (d[j] >= 0 || !ok[R.tiles[j]]) continue; d[j] = d[i] + 1; q[n++] = j;
        }
      }
      return d;
    };
    const D = CONJ.map(bfs);
    const medir = ([x0, y0, w, h]) => {
      const res = D.map((d) => { const v = []; for (let y = y0; y < Math.min(H, y0 + h); y++) for (let x = x0; x < Math.min(W, x0 + w); x++) { const q = d[x + y * W]; if (q >= 0) v.push(q); } v.sort((a, b) => a - b); return { n: v.length, med: v.length ? v[v.length >> 1] : null }; });
      const k = res.findIndex((r) => r.n > 0 && r.n >= res[6].n * 0.5);
      return k < 0 ? null : { exige: CONJ[k], dist: res[k].med };
    };
    const celula = (x, y, raio = 6) => { // ponto acessível mais perto da célula (a borda de mata ainda fecha as passagens)
      for (const [k, d] of D.entries()) {
        let m = null;
        for (let yy = y - raio; yy <= y + raio; yy++) for (let xx = x - raio; xx <= x + raio; xx++) {
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const v = d[xx + yy * W];
          if (v >= 0) { const t = v + Math.abs(xx - x) + Math.abs(yy - y); if (m === null || t < m) m = t; }
        }
        if (m !== null) return { exige: CONJ[k], dist: m };
      }
      return null;
    };
    dist = { areas: {}, passagens: {}, linhas: {} };
    for (const a of PLANO.AREAS) if (a.mapa === 'existe' && a.rect && !a.interior) { const r = medir(a.rect); if (r) dist.areas[a.id] = r; }
    for (const p of PLANO.PASSAGENS) {
      if (p.custoCelula) { const r = celula(...p.custoCelula); if (r) dist.passagens[p.id] = r; }
      if (p.custoLinha) { const { y, x0, x1 } = p.custoLinha; const l = []; for (let x = x0; x <= x1; x += 4) { const r = celula(x, y, 3); if (r) l.push([x, r.dist, r.exige]); } dist.linhas[p.id] = l; }
    }
    if (!SO_CONFERIR) fs.writeFileSync(CACHE, JSON.stringify(dist));
    dist.fonte = 'mapa';
  } catch (e) {
    if (fs.existsSync(CACHE)) { dist = { ...JSON.parse(fs.readFileSync(CACHE, 'utf8')), fonte: 'cache' }; aviso(`mapa não montou (${e.message}); usei ${path.relative(RAIZ, CACHE)}`); }
    else { dist = { areas: {}, passagens: {}, linhas: {}, fonte: 'nenhuma' }; aviso(`mapa não montou (${e.message}) e não há cache: custos do núcleo ficam estimados`); }
  }
  return { tabelasMapa, dist };
}
const { tabelasMapa, dist } = await medirNucleo();

// ------------------------------------------------------------------------------------------------ custo e nível
const C = PLANO.CUSTO;
const nivelDe = (custo) => {
  const K = PLANO.CURVA; if (custo <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (custo <= K[i][0]) { const [a, la] = K[i - 1], [b, lb] = K[i]; return la + ((lb - la) * (custo - a)) / (b - a); }
  return K[K.length - 1][1];
};
const AREA = new Map(PLANO.AREAS.map((a) => [a.id, a]));
const PASS = new Map(PLANO.PASSAGENS.map((p) => [p.id, p]));
const centro = (a) => (a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : null);
const penal = (lista) => [...new Set(lista)].reduce((s, k) => s + (C[k] ?? 0), 0);
const CUSTO = new Map();
function custoDe(id, pilha = []) {
  if (CUSTO.has(id)) return CUSTO.get(id);
  const a = AREA.get(id); if (!a) { erro(`área desconhecida: ${id}`); return { custo: 0, exige: [] }; }
  if (pilha.includes(id)) { erro(`ciclo de entradas em ${id}`); return { custo: 0, exige: [] }; }
  let base = 0, exige = [], como = '';
  if (a.custoManual != null) { base = a.custoManual; como = 'manual'; }
  else if (a.interior || a.entrada) {
    const e = custoDe(a.entrada, [...pilha, id]); base = e.custo + (a.andar ?? 1) * C.andar; exige = [...e.exige]; como = `entrada ${a.entrada}, andar ${a.andar ?? 1}`;
  } else if (a.mundo === 'ocaso') {
    const t = custoDe(PLANO.OCASO_CHEGADA.terminal, [...pilha, id]); const [cx, cy] = centro(a);
    base = t.custo + C.navio + PLANO.SINUOSIDADE * Math.hypot(cx - PLANO.OCASO_CHEGADA.x, cy - PLANO.OCASO_CHEGADA.y); exige = []; como = 'navio + caminho no Ocaso';
  } else if (a.via) {
    let melhor = null; const [cx, cy] = centro(a);
    for (const pid of a.via) {
      const p = PASS.get(pid); if (!p) { erro(`${id}: passagem ${pid} não existe`); continue; }
      const [x0, y0, x1, y1] = p.celulas;
      let cand = null;
      if (p.custoLinha && dist.linhas[pid]?.length) {
        for (const [x, d, ex] of dist.linhas[pid]) { const c = d + penal([...ex, ...p.exige]) + PLANO.SINUOSIDADE * Math.hypot(cx - x, cy - y1); if (!cand || c < cand.c) cand = { c, ex: [...ex, ...p.exige] }; }
      } else {
        const r = dist.passagens[pid] ?? { dist: 400, exige: [] };
        const px = Math.max(x0, Math.min(x1, cx)), py = Math.max(y0, Math.min(y1, cy));
        cand = { c: r.dist + penal([...r.exige, ...p.exige]) + PLANO.SINUOSIDADE * Math.hypot(cx - px, cy - py), ex: [...r.exige, ...p.exige] };
      }
      if (cand && (!melhor || cand.c < melhor.c)) melhor = { ...cand, pid };
    }
    base = melhor?.c ?? 600; exige = melhor?.ex ?? []; como = `pela passagem ${melhor?.pid}`;
    base -= penal(exige); // as penalidades entram uma vez só, abaixo
  } else if (a.mapa === 'existe') {
    const r = dist.areas[id];
    if (r) { base = r.dist; exige = [...r.exige]; como = `caminho medido no mapa (${dist.fonte})`; }
    else { base = 300; aviso(`${id}: sem distância medida no mapa; usei 300`); como = 'estimado'; }
  }
  exige = [...new Set([...exige, ...(a.acesso ?? [])])];
  const custo = Math.round(base + penal(exige) + (a.escondido ? C.escondido : 0) + (a.extra ?? 0));
  const r = { custo, exige, como };
  CUSTO.set(id, r); return r;
}
const FAIXA = new Map();
for (const a of PLANO.AREAS) {
  const { custo } = custoDe(a.id); const m = Math.round(nivelDe(custo));
  FAIXA.set(a.id, [Math.max(2, m - PLANO.LARGURA_FAIXA), Math.min(100, m + PLANO.LARGURA_FAIXA)]);
}

// ------------------------------------------------------------------------------------------------ tabelas de encontro
const PESO = { c: 20, i: 10, r: 4, m: 1 };
function lerFicha(f, area) {
  const [esp, marcas = ''] = f.split('/');
  let dex, forma = null;
  if (/^\d+$/.test(esp)) dex = +esp;
  else { const F = FORMA.get(esp); if (!F) { erro(`${area}: forma desconhecida "${esp}"`); return null; } dex = F.dex; forma = F.id; }
  if (!SP.has(dex)) { erro(`${area}: dex inválido ${esp}`); return null; }
  const cls = marcas.match(/[cirm]/)?.[0] ?? 'c', hora = marcas.match(/[nd]/)?.[0] ?? null;
  if (marcas.replace(/[cirmnd]/g, '')) erro(`${area}: marca inválida em "${f}"`);
  return { dex, forma, peso: PESO[cls], cls, hora };
}
// a linha evolutiva a partir de uma espécie (com a forma regional, quando houver), estágio por estágio
function linha(dex, forma, alto) {
  const out = [[{ dex, forma, metodo: 'base' }]];
  let atual = [{ dex, forma }];
  for (let estagio = 0; estagio < 2; estagio++) {
    const prox = [];
    for (const { dex: d, forma: f } of atual) for (const filho of FILHOS.get(d) ?? []) {
      const reg = EVO_REGIONAL[filho], cl = f ? FORMA.get(f).classe : null;
      if (cl ? !(reg === cl || SP.get(filho).formas.some((x) => x.classe === cl)) : reg) continue;
      const nf = cl ? SP.get(filho).formas.find((x) => x.classe === cl)?.id ?? null : null;
      const nv = nivelEvo(filho);
      if (!nv && !(alto >= 40) ) continue;
      if (evoTroca(filho) && !(alto >= 55)) continue;
      prox.push({ dex: filho, forma: nf, metodo: nv ? 'nivel' : 'outro', nivel: nv });
    }
    if (!prox.length) break;
    out.push(prox); atual = prox;
  }
  return out;
}
function entradas(ficha, [lo, hi], expandir) {
  const res = [], meio = (lo + hi) / 2;
  let estagios = expandir ? linha(ficha.dex, ficha.forma, meio) : [[{ dex: ficha.dex, forma: ficha.forma, metodo: 'base' }]];
  // muito raros, iniciais e pseudolendários não aparecem já no último estágio
  if (ficha.cls === 'm' || PSEUDO.has(ficha.dex) || INICIAIS.has(ficha.dex)) estagios = estagios.slice(0, 2);
  let incluidos = 0;
  for (const grupo of estagios) {
    let algum = false;
    for (const s of grupo) {
      const prox = (FILHOS.get(s.dex) ?? []).map(nivelEvo).filter(Boolean);
      const teto = expandir && prox.length ? Math.min(...prox) + 5 : 100;
      const piso = s.metodo === 'nivel' ? s.nivel : 1;
      let a = Math.max(lo, piso), b = Math.min(hi, teto);
      if (a > b) { if (!expandir || incluidos === 0) { a = lo; b = hi; } else continue; }
      const fator = [1, 0.4, 0.15][incluidos] ?? 0.1, extra = s.metodo === 'outro' ? 0.25 : 1;
      res.push([s.dex, a, b, Math.max(1, Math.round(ficha.peso * fator * extra)), ...(s.forma ? [{ forma: s.forma }] : [])]);
      algum = true;
    }
    if (algum) incluidos++;
  }
  return res;
}
const TABELAS = {};
const usados = new Set();
for (const a of PLANO.AREAS) {
  if (a.selvagem === false) { if (LUGARES[a.id]) erro(`${a.id} é cidade, mas tem espécies em lugares.mjs`); continue; }
  const faixa = FAIXA.get(a.id), dia = [], noite = [];
  const fichas = (LUGARES[a.id] ?? '').split(/\s+/).filter(Boolean).map((f) => lerFicha(f, a.id)).filter(Boolean);
  if (LUGARES[a.id] !== undefined) usados.add(a.id);
  for (const [d, , , w] of tabelasMapa[a.id] ?? []) {
    if (!SP.has(d)) { erro(`${a.id}: o mapa tem dex inválido ${d}`); continue; }
    if (!fichas.some((f) => f.dex === d && !f.forma)) fichas.push({ dex: d, forma: null, peso: w, cls: 'mapa', hora: null, doMapa: true });
  }
  for (const f of fichas) {
    if (ehLendario(f.dex)) erro(`${a.id}: lendário/mítico/Ultra-Fera #${f.dex} na tabela de selvagens (vai em especiais.mjs)`);
    if ((PSEUDO.has(f.dex) || INICIAIS.has(f.dex)) && !['r', 'm', 'mapa'].includes(f.cls)) aviso(`${a.id}: #${f.dex} (inicial ou pseudolendário) deveria ser raro (r ou m)`);
    const es = entradas(f, faixa, !f.doMapa);
    if (f.hora !== 'n') dia.push(...es);
    if (f.hora !== 'd') noite.push(...es.map(([d, lo, hi, w, x]) => [d, lo, Math.min(100, hi + 1), f.hora === 'n' ? Math.round(w * 1.5) : w, ...(x ? [x] : [])]));
  }
  const junta = (t) => { const m = new Map(); for (const e of t) { const k = e[0] + (e[4]?.forma ?? ''); const o = m.get(k); if (o) { o[1] = Math.min(o[1], e[1]); o[2] = Math.max(o[2], e[2]); o[3] += e[3]; } else m.set(k, [...e]); } return [...m.values()]; };
  const t = { dia: junta(dia), noite: junta(noite) };
  if (!t.dia.length && !t.noite.length) { erro(`área sem selvagens: ${a.id} (${a.nome})`); continue; }
  const al = ALFAS[a.id];
  if (al) { const [esp] = al; const dx = typeof esp === 'number' ? esp : FORMA.get(esp)?.dex; t.alfa = [dx, faixa[1] + 5, ...(typeof esp === 'string' ? [{ forma: esp }] : []), al[1]]; }
  TABELAS[a.id] = t;
}
for (const k of Object.keys(LUGARES)) if (!AREA.has(k)) erro(`lugares.mjs: área "${k}" não existe no plano`);
for (const k of Object.keys(ALFAS)) if (!AREA.has(k)) erro(`ALFAS: área "${k}" não existe no plano`);

// ------------------------------------------------------------------------------------------------ cobertura
const SELVAGEM = new Map(); // dex -> Set(áreas)
const FORMA_SELV = new Map();
for (const [id, t] of Object.entries(TABELAS)) for (const e of [...t.dia, ...t.noite]) {
  if (e[4]?.forma) { const fid = e[4].forma; (FORMA_SELV.get(fid) ?? FORMA_SELV.set(fid, new Set()).get(fid)).add(id); }
  else (SELVAGEM.get(e[0]) ?? SELVAGEM.set(e[0], new Set()).get(e[0])).add(id);
}
const COMO = new Map(); // dex -> [{como, onde, ...}]
const add = (d, o) => (COMO.get(d) ?? COMO.set(d, []).get(d)).push(o);
for (const [k, v] of Object.entries(ESP.OBTENCAO)) if (/^\d+$/.test(k)) for (const o of v) add(+k, o);
for (const d of ESP.OBTENCAO.clube) add(d, { como: 'clube', onde: 'porto_rubro', nota: 'Clube dos Iniciais' });
for (const d of ESP.OVOS) add(d, { como: 'ovo', onde: 'vila_jandaia', nota: 'Creche da Vó Iara' });
for (const [d, s] of SELVAGEM) add(d, { como: 'selvagem', onde: [...s] });
// evolução: se o pai se obtém, o filho também (forma comum)
let mudou = true;
while (mudou) {
  mudou = false;
  for (const e of LISTA) {
    if (!e.de || COMO.has(e.dex) && COMO.get(e.dex).some((o) => o.como !== 'evolucao')) continue;
    if (EVO_REGIONAL[e.dex]) continue;
    if (COMO.has(e.de) && !COMO.get(e.dex)?.some((o) => o.como === 'evolucao')) { add(e.dex, { como: 'evolucao', de: e.de }); mudou = true; }
  }
}
// formas regionais: selvagem, especial, ou evolução de uma forma que se obtém
const FORMAS_OUT = {};
for (const f of FORMA.values()) {
  if (f.classe === 'mega' || f.classe === 'gmax') continue;
  const como = [];
  if (FORMA_SELV.has(f.id)) como.push({ como: 'selvagem', onde: [...FORMA_SELV.get(f.id)] });
  for (const o of ESP.OBTENCAO[f.id] ?? []) como.push(o);
  FORMAS_OUT[f.id] = { dex: f.dex, classe: f.classe, tipos: f.tipos, como };
}
mudou = true;
while (mudou) {
  mudou = false;
  for (const [fid, F] of Object.entries(FORMAS_OUT)) {
    if (F.como.length) continue;
    const pai = SP.get(F.dex).de; if (!pai) continue;
    const pf = Object.entries(FORMAS_OUT).find(([, x]) => x.dex === pai && x.classe === F.classe && x.como.length);
    if (pf) { F.como.push({ como: 'evolucao', de: pf[0] }); mudou = true; }
  }
}
// evoluções exclusivas de forma regional (Perrserker, Sneasler…): vêm da forma
for (const [d, cl] of Object.entries(EVO_REGIONAL)) {
  const pai = SP.get(+d).de; const pf = Object.entries(FORMAS_OUT).find(([, x]) => x.dex === pai && x.classe === cl && x.como.length);
  if (pf && !COMO.has(+d)) add(+d, { como: 'evolucao', de: pf[0] });
}
// Mega e Gigantamax
const MEGA_OUT = {}, GMAX_OUT = {};
for (const f of FORMA.values()) {
  if (f.classe === 'mega') {
    // a pedra é a do jogo (src/data/species.js → forms[f].megaStone, o id do item em src/data/items.js); montar o nome
    // pela espécie errava 55 delas (blastoiseite em vez de blastoisinite). Rayquaza não tem pedra (Ascensão do Dragão).
    const gf = JOGO.formFromApi(f.id), jf = gf && JOGO.SPECIES[gf.dex]?.forms[gf.form];
    if (!jf) erro(`forma Mega sem dados no jogo: ${f.id}`);
    const pedra = jf?.megaStone ?? null;
    if (jf && !pedra && !jf.megaMove) erro(`forma Mega sem pedra no jogo: ${f.id}`);
    if (pedra && !JOGO_ITENS.ITEMS[pedra]) erro(`Mega Pedra sem item no jogo: ${pedra} (${f.id})`);
    const fixo = ESP.MEGA.pedras[f.id];
    const onde = fixo ? fixo[0] : ESP.TESOURO_POR_TIPO[SP.get(f.dex).tipos[0]];
    MEGA_OUT[f.id] = { dex: f.dex, pedra, onde, como: fixo ? fixo[1] : 'tesouro escondido da dungeon do tipo', tipos: f.tipos };
  }
  if (f.classe === 'gmax') {
    const tocas = ESP.DYNAMAX.tocas.filter((t) => t.gmax.includes(f.id)).map((t) => t.id);
    GMAX_OUT[f.id] = { dex: f.dex, tocas };
    if (!tocas.length) erro(`Gigantamax sem toca: ${f.id}`);
  }
}
for (const t of ESP.DYNAMAX.tocas) { if (!AREA.has(t.area)) erro(`toca ${t.id}: área ${t.area} não existe`); for (const g of t.gmax) if (!FORMA.has(g)) erro(`toca ${t.id}: forma ${g} não existe`); }
for (const k of Object.keys(ESP.MEGA.pedras)) if (!FORMA.has(k)) erro(`Mega Pedra para forma inexistente: ${k}`);

const SEM = LISTA.filter((e) => !COMO.has(e.dex));
const FORMAS_SEM = Object.entries(FORMAS_OUT).filter(([, f]) => !f.como.length).map(([k]) => k);
for (const e of SEM) aviso(`sem lugar: #${e.dex} ${e.nome}`);
for (const k of FORMAS_SEM) aviso(`forma sem lugar: ${k}`);
for (const [k, v] of Object.entries(ESP.OBTENCAO)) {
  if (k === 'clube') continue;
  for (const o of v) { const onde = String(o.onde ?? '').split(/[ (]/)[0]; if (onde && !AREA.has(onde) && !CIDADES.some((c) => c.predios.some((p) => p.id === onde)) && !['ocaso', 'laboratorio', 'torre_vento', 'farol_coral'].includes(onde)) aviso(`obtenção de ${k}: lugar "${o.onde}" não é área nem prédio do plano`); }
}

// exclusivas: aparecem selvagens numa área só
const EXCLUSIVAS = {};
for (const [d, s] of SELVAGEM) if (s.size === 1) EXCLUSIVAS[d] = [...s][0];
for (const [f, s] of FORMA_SELV) if (s.size === 1) EXCLUSIVAS[f] = [...s][0];

// ------------------------------------------------------------------------------------------------ coerência de nível
const rebalancear = [];
for (const [id, tab] of Object.entries(tabelasMapa)) {
  if (!AREA.has(id)) continue;
  const lo = Math.min(...tab.map((e) => e[1])), hi = Math.max(...tab.map((e) => e[2])), [mlo, mhi] = FAIXA.get(id);
  if (Math.abs((lo + hi) / 2 - (mlo + mhi) / 2) > PLANO.TOLERANCIA) rebalancear.push({ id, mapa: [lo, hi], modelo: [mlo, mhi] });
}
for (const [id, t] of Object.entries(TABELAS)) {
  const [lo, hi] = FAIXA.get(id);
  for (const e of [...t.dia, ...t.noite]) if (e[1] < 1 || e[2] > 100 || e[1] > e[2]) erro(`${id}: nível inválido em #${e[0]} (${e[1]}–${e[2]})`);
  for (const e of t.dia) if (e[2] > hi + 1 || e[1] < lo - 1) { if (!(nivelEvo(e[0]) && e[1] >= nivelEvo(e[0]))) erro(`${id}: #${e[0]} fora da faixa da área (${e[1]}–${e[2]} vs ${lo}–${hi})`); }
  if (t.alfa && t.alfa[1] > hi + 10) erro(`${id}: Alfa acima de faixa + 10`);
}
// cada área: nível de acordo com o custo; quem pede mais montarias ou é mais escondido não pode ser mais fraco que a
// área de onde se entra (dungeons crescem para baixo)
for (const a of PLANO.AREAS) if (a.entrada) {
  const [lo] = FAIXA.get(a.id), [elo] = FAIXA.get(a.entrada);
  if (lo < elo) erro(`${a.id}: andar mais fraco que a entrada ${a.entrada}`);
}
// lugares de saída fácil (a pé, perto de casa) não passam de nível 15; outro continente não fica abaixo de 55
for (const a of PLANO.AREAS) {
  const { custo, exige } = custoDe(a.id), [lo, hi] = FAIXA.get(a.id);
  if (custo < 150 && !exige.length && hi > 15) erro(`${a.id}: perto de casa e a pé, mas nível até ${hi}`);
  if (a.mundo === 'ocaso' && (lo + hi) / 2 < 55) erro(`${a.id}: Ocaso com nível médio ${(lo + hi) / 2} (mínimo 55)`);
  if (a.mundo === 'alvorada' && hi > 80) erro(`${a.id}: nível acima de 80`);
}
// escada dos ginásios (nível fixo pelo lugar)
const ESCADA = GINASIOS.map((g) => {
  const { custo, exige } = custoDe(g.cidade); const media = Math.round(nivelDe(custo));
  return { ...g, custo, exige, as: media + 4, equipe: [media, media + 4] };
}).sort((a, b) => a.custo - b.custo);
ESCADA.forEach((g, i) => { if (i && g.as < ESCADA[i - 1].as) erro('escada de ginásios fora de ordem'); });
if (ESCADA[ESCADA.length - 1].as >= NIVEL_LIGA.elite[0]) erro('o último ginásio passa do nível da Liga');

// ------------------------------------------------------------------------------------------------ tabelas padrão por bioma
const BIOMAS_PADRAO = {}, BIOMAS_NOITE = {};
for (const b of Object.keys(PLANO.BIOMAS)) {
  if (b === 'vila') continue;
  const areas = PLANO.AREAS.filter((a) => a.bioma === b && TABELAS[a.id]);
  if (!areas.length) continue;
  const prim = areas.reduce((m, a) => (custoDe(a.id).custo < custoDe(m.id).custo ? a : m));
  const [lo, hi] = FAIXA.get(prim.id);
  for (const [chave, alvo] of [['dia', BIOMAS_PADRAO], ['noite', BIOMAS_NOITE]]) {
    const soma = new Map();
    for (const a of areas) { const t = TABELAS[a.id][chave]; const tot = t.reduce((s, e) => s + e[3], 0) || 1; for (const e of t) if (!e[4]) soma.set(e[0], (soma.get(e[0]) ?? 0) + e[3] / tot); }
    const top = [...soma.entries()].filter(([d]) => !nivelEvo(d) || nivelEvo(d) <= hi).sort((x, y) => y[1] - x[1]).slice(0, 16);
    alvo[b] = top.map(([d, w]) => [d, Math.max(lo, nivelEvo(d) ?? 1), hi + (chave === 'noite' ? 1 : 0), Math.max(1, Math.round(w * 20))]);
  }
}

// ------------------------------------------------------------------------------------------------ saída
const ONDE = {};
for (const e of LISTA) {
  const c = COMO.get(e.dex) ?? [];
  ONDE[e.dex] = c.map((o) => (o.como === 'selvagem' ? { como: 'selvagem', onde: o.onde, exclusiva: o.onde.length === 1 } : o));
}
const resumoArea = (a) => {
  const { custo, exige } = custoDe(a.id), nivel = FAIXA.get(a.id);
  return { id: a.id, nome: a.nome, mundo: a.mundo, regiao: a.regiao, bioma: a.bioma, tipo: a.tipo, rect: a.rect ?? null, entrada: a.entrada ?? null, andar: a.andar ?? null,
    via: a.via ?? null, acesso: exige, escondido: !!a.escondido, custo, nivel, equipe: nivel[1] + 3, mapa: a.mapa ?? 'planejado', pendente: !!a.pendente,
    especies: TABELAS[a.id] ? [...new Set([...TABELAS[a.id].dia, ...TABELAS[a.id].noite].map((e) => (e[4] ? e[4].forma : e[0])))] : [] };
};
const json = {
  gerado: 'node tools/gerar-mundo.mjs (não editar à mão; a fonte é tools/mundo/*.mjs)',
  mundoAberto: 'Nenhuma região fecha por capítulo ou insígnia; só o terreno e as montarias. A Liga pede 8 insígnias.',
  origem: PLANO.ORIGEM, custo: PLANO.CUSTO, curva: PLANO.CURVA, mundos: PLANO.MUNDOS, regioes: PLANO.REGIOES,
  passagens: PLANO.PASSAGENS.map((p) => ({ ...p, custoMedido: dist.passagens[p.id] ?? null })), viagens: PLANO.VIAGENS, biomas: PLANO.BIOMAS,
  areas: PLANO.AREAS.map(resumoArea), cidades: CIDADES, ginasios: ESCADA, elite: ELITE, liga: NIVEL_LIGA, dungeons: DUNGEONS,
  mega: { pulseira: ESP.MEGA.pulseira, pedras: MEGA_OUT }, dynamax: { bracelete: ESP.DYNAMAX.bracelete, regras: ESP.DYNAMAX.regras, tocas: ESP.DYNAMAX.tocas, gigantamax: GMAX_OUT },
};
const fmt = (v) => JSON.stringify(v);
const tabJs = (t) => '[' + t.map(fmt).join(', ') + ']';
const habitats = `// GERADO por tools/gerar-mundo.mjs a partir de tools/mundo/*.mjs e da lista nacional (tools/mundo/especies.json).
// Não edite à mão: mude tools/mundo/lugares.mjs (onde cada espécie vive), tools/mundo/plano.mjs (áreas, custos e curva)
// ou tools/mundo/especiais.mjs (presentes, lendários, fósseis, Mega e Dynamax) e rode \`node tools/gerar-mundo.mjs\`.
//
// FORMATO
// - AREAS_ENCONTROS[id] = { dia, noite, nivel: [mín, máx], custo, bioma, alfa? }
//   dia/noite: [[dex, nível mín., nível máx., peso], …] como \`areas[].encounters\` do mapa. Quinto campo opcional
//   { forma: '<id da forma na PokéAPI>' } para formas regionais, ex. { forma: 'vulpix-alola' } ou
//   { forma: 'tauros-paldea-blaze-breed' } (o motor ainda ignora o quinto campo; ver docs/mundo-expandido.md).
//   noite substitui dia das 18h às 6h (igual a \`night\` de uma área do mapa). alfa: [dex, nível, {forma}?, nota].
//   O id é o da área no mapa (areas[].id) ou do interior (interiors[].id); as áreas ainda não desenhadas usam os ids
//   de docs/mundo-expandido.json.
// - BIOMAS_PADRAO / BIOMAS_NOITE: tabela de cada bioma para áreas sem tabela própria (mesmo formato), com o nível do
//   lugar mais fácil daquele bioma. src/data/species.js junta as dos biomas novos a BIOME_ENCOUNTERS/NIGHT_ENCOUNTERS.
// - ONDE[dex]: como se obtém cada uma das ${LISTA.length} espécies: selvagem (áreas; exclusiva = uma só), evolucao, presente,
//   troca, fossil, ovo, lendario, evento, errante, ultrafera, clube, inicial.
// - FORMAS[id]: formas regionais e como se obtêm. MEGA_PEDRAS[id da forma Mega]: pedra e lugar. GIGANTAMAX[id]: tocas.
// - ESCADA_GINASIOS: nível fixo de cada ginásio pelo custo de chegar (mundo aberto: qualquer ordem).
export const CURVA = ${fmt(PLANO.CURVA)};

export const AREAS_ENCONTROS = {
${Object.entries(TABELAS).map(([id, t]) => `  ${id}: { nivel: ${fmt(FAIXA.get(id))}, custo: ${custoDe(id).custo}, bioma: ${fmt(AREA.get(id).bioma)},${t.alfa ? ` alfa: ${fmt(t.alfa)},` : ''}\n    dia: ${tabJs(t.dia)},\n    noite: ${tabJs(t.noite)} },`).join('\n')}
};

export const BIOMAS_PADRAO = {
${Object.entries(BIOMAS_PADRAO).map(([b, t]) => `  ${b}: ${tabJs(t)},`).join('\n')}
};
export const BIOMAS_NOITE = {
${Object.entries(BIOMAS_NOITE).map(([b, t]) => `  ${b}: ${tabJs(t)},`).join('\n')}
};

export const ONDE = {
${Object.entries(ONDE).map(([d, v]) => `  ${d}: ${fmt(v)},`).join('\n')}
};

export const FORMAS = ${JSON.stringify(FORMAS_OUT, null, 0)};

export const MEGA_PEDRAS = ${JSON.stringify(MEGA_OUT, null, 0)};

export const GIGANTAMAX = ${JSON.stringify(GMAX_OUT, null, 0)};

export const ESCADA_GINASIOS = ${JSON.stringify(ESCADA.map(({ cidade, lider, tipo, insignia, custo, as, equipe }) => ({ cidade, lider, tipo, insignia, custo, as, equipe })))};

// Tabela de uma área (ou null): o motor pode usar quando a área do mapa não tiver \`encounters\` próprio.
export function encontrosDaArea(id, noite = false) {
  const a = AREAS_ENCONTROS[id];
  return a ? (noite ? a.noite : a.dia) : null;
}
`;

// tabelas do .md
const TIPO_PT = { normal: 'Normal', fire: 'Fogo', water: 'Água', grass: 'Planta', electric: 'Elétrico', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso', ground: 'Terrestre', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto', rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio', steel: 'Aço', fairy: 'Fada' };
const nomeMont = (l) => (l.length ? l.join(' + ') : 'a pé');
const linhasNivel = PLANO.AREAS.filter((a) => a.selvagem !== false).map((a) => resumoArea(a)).sort((x, y) => x.custo - y.custo)
  .map((r) => `| ${r.nome} | ${PLANO.REGIOES.find((g) => g.id === r.regiao)?.nome ?? r.regiao} | ${r.bioma} | ${r.custo} | ${nomeMont(r.acesso)}${r.escondido ? ', escondido' : ''} | ${r.nivel[0]}–${r.nivel[1]} | ${r.equipe} |`);
const mdNiveis = ['| Área | Região | Bioma | Custo | Acesso | Selvagens (nível) | Equipe recomendada |', '|---|---|---|---:|---|---|---:|', ...linhasNivel].join('\n');
const mdGin = ['| # | Ginásio | Líder | Tipo | Custo | Acesso | Equipe do líder | Ás |', '|---:|---|---|---|---:|---|---|---:|',
  ...ESCADA.map((g, i) => `| ${i + 1} | ${CIDADES.find((c) => c.id === g.cidade)?.nome} | ${g.lider} | ${TIPO_PT[g.tipo]} | ${g.custo} | ${nomeMont(g.exige)} | ${g.equipe[0]}–${g.equipe[1]} | ${g.as} |`),
  `| — | Liga Alvorada (8 insígnias) | Elite | — | — | todas | ${NIVEL_LIGA.elite[0]}–${NIVEL_LIGA.elite[1]} | Campeã ${NIVEL_LIGA.campea[1]} |`].join('\n');
const rebal = rebalancear.length ? ['| Área do mapa | Hoje (mapa) | Modelo |', '|---|---|---|', ...rebalancear.map((r) => `| ${r.id} | ${r.mapa.join('–')} | ${r.modelo.join('–')} |`)].join('\n') : 'Nenhuma.';
const contagem = { selvagens: SELVAGEM.size, exclusivas: Object.keys(EXCLUSIVAS).filter((k) => /^\d+$/.test(k)).length, outro: LISTA.filter((e) => COMO.has(e.dex) && !SELVAGEM.has(e.dex)).length, sem: SEM.length };
const mdCont = `- Espécies na lista nacional: **${LISTA.length}**; selvagens em pelo menos uma área: **${contagem.selvagens}**; exclusivas de uma área só: **${contagem.exclusivas}**; obtidas de outro jeito (evolução, presente, troca, fóssil, ovo, lendário, evento): **${contagem.outro}**; sem lugar: **${contagem.sem}**.\n- Formas regionais: **${Object.keys(FORMAS_OUT).length}** (sem lugar: ${FORMAS_SEM.length}); Mega: **${Object.keys(MEGA_OUT).length}** pedras; Gigantamax: **${Object.keys(GMAX_OUT).length}** formas em **${ESP.DYNAMAX.tocas.length}** tocas.\n- Áreas com selvagens: **${Object.keys(TABELAS).length}**; distâncias do núcleo: ${dist.fonte === 'mapa' ? 'medidas no mapa atual' : dist.fonte}.`;
const PREDIO = new Map(CIDADES.flatMap((c) => c.predios.map((p) => [p.id, `${p.nome.replace(/ \(.*\)$/, '')} (${c.nome})`])));
const nomeArea = (id) => AREA.get(id)?.nome ?? PREDIO.get(id) ?? id;
const nomeEsp = (k) => (/^\d+$/.test(String(k)) ? `${SP.get(+k).nome} (#${k})` : `${SP.get(FORMA.get(k)?.dex)?.nome ?? k} (${k})`);
const mdRec = (r) => r.replace(/^item:/, 'item ').replace(/^mt:/, 'MT ').replace(/^dinheiro:/, '₽').replace(/^pokemon:/, 'Pokémon #').replace(/^pedra-mega:/, 'Mega Pedra ').replace(/^chave:/, 'item-chave ').replace(/^tutor:/, 'tutor ');
const mdCidades = CIDADES.map((c) => {
  const g = c.ginasio ? ` · Ginásio: **${c.ginasio.lider}** (${TIPO_PT[c.ginasio.tipo]}), Insígnia ${c.ginasio.insignia}, ${c.ginasio.local}` : '';
  return [`#### ${c.nome}`, `Região: ${PLANO.REGIOES.find((r) => r.id === c.regiao)?.nome}${g}.`, '',
    '**Prédios (todos com interior):**', ...c.predios.map((p) => `- ${p.nome}${p.existe ? ' *(já no mapa)*' : ''}: ${p.dentro}.`), '',
    `**Moradores:** ${c.moradores.join('; ')}.`, '', '**Missões:**',
    ...c.missoes.map((m) => `- **${m.nome}** \`${m.id}\` (${m.tipo}${m.depois ? `, depois de \`${m.depois}\`` : ''}): ${m.resumo} Recompensa: ${m.recompensa.map(mdRec).join(', ')}.`), ''].join('\n');
}).join('\n');
const mdDungeons = DUNGEONS.map((d) => {
  const andares = d.andares.map((a) => {
    const f = FAIXA.get(a.id);
    return [`- **${a.nome}**${f ? ` (selvagens ${f[0]}–${f[1]})` : ''}: ${a.enigma ?? ''}`, ...(a.mapa ? ['', '  ```', ...a.mapa.map((l) => '  ' + l), '  ```'] : [])].join('\n');
  }).join('\n');
  const excl = d.andares.flatMap((a) => Object.entries(EXCLUSIVAS).filter(([, v]) => v === a.id).map(([k]) => nomeEsp(k)));
  return [`#### ${d.nome}`, `Região: ${PLANO.REGIOES.find((r) => r.id === d.regiao)?.nome}. Entrada: ${d.entrada}. Acesso: ${d.acesso}.${d.estado ? ` Estado: ${d.estado}.` : ''}`, '', andares, '',
    `**Chefe ou alfa:** ${d.chefe.replace(/\.$/, '')}.`, `**Tesouros:** ${d.tesouros.join(', ')}.`, excl.length ? `**Só aqui:** ${excl.join(', ')}.` : '', ''].join('\n');
}).join('\n');
const especiaisLinhas = [];
for (const e of LISTA) {
  const c = (COMO.get(e.dex) ?? []).filter((o) => ['lendario', 'evento', 'errante', 'ultrafera'].includes(o.como));
  for (const o of c) especiaisLinhas.push(`| ${e.nome} (#${e.dex}) | ${o.como} | ${nomeArea(String(o.onde).split(' ')[0])}${String(o.onde).includes(' ') ? ' ' + String(o.onde).split(' ').slice(1).join(' ') : ''} | ${o.nivel ?? ''} | ${o.nota ?? ''} |`);
}
for (const [fid, F] of Object.entries(FORMAS_OUT)) for (const o of F.como) if (['errante', 'lendario'].includes(o.como)) especiaisLinhas.push(`| ${nomeEsp(fid)} | ${o.como} | ${nomeArea(o.onde)} | ${o.nivel ?? ''} | ${o.nota ?? ''} |`);
const mdLendarios = ['| Espécie | Como | Onde | Nível | Nota |', '|---|---|---|---:|---|', ...especiaisLinhas].join('\n');
const mdMega = [`Pulseira Mega: ${nomeArea(ESP.MEGA.pulseira.onde)}, ${ESP.MEGA.pulseira.como}.`, '',
  '| Forma Mega | Pedra | Onde | Como |', '|---|---|---|---|',
  ...Object.entries(MEGA_OUT).map(([k, m]) => `| ${k} | ${m.pedra ?? '—'} | ${nomeArea(m.onde.split(' ')[0])}${m.onde.includes(' ') ? ' ' + m.onde.split(' ').slice(1).join(' ') : ''} | ${m.como} |`), '',
  `Bracelete Dynamax: ${nomeArea(ESP.DYNAMAX.bracelete.onde)}, ${ESP.DYNAMAX.bracelete.como}. ${ESP.DYNAMAX.regras}`, '',
  '| Toca de Luz | Área | Gigantamax | Nota |', '|---|---|---|---|',
  ...ESP.DYNAMAX.tocas.map((t) => `| ${t.id} | ${nomeArea(t.area)} | ${t.gmax.join(', ') || '(sorteio)'} | ${t.nota ?? ''} |`)].join('\n');
const porRegiao = PLANO.REGIOES.map((r) => {
  const ex = Object.entries(EXCLUSIVAS).filter(([, a]) => AREA.get(a)?.regiao === r.id).map(([k]) => nomeEsp(k));
  return `- **${r.nome}** (${ex.length}): ${ex.join(', ')}.`;
}).join('\n');
const trocaBloco = (txt, nome, novo) => { const re = new RegExp(`(<!-- gerado:${nome} -->)[\\s\\S]*?(<!-- /gerado:${nome} -->)`); return re.test(txt) ? txt.replace(re, `$1\n${novo}\n$2`) : txt; };

if (!SO_CONFERIR) {
  fs.writeFileSync(arq('docs/mundo-expandido.json'), JSON.stringify(json, null, 1) + '\n');
  fs.writeFileSync(arq('src/data/habitats.js'), habitats);
  // pós-passo: mesmo resultado de `node tools/ajustar-biomas.mjs` (troca fora do bioma, cobertura, níveis, ONDE)
  const ajuste = await ajustarBiomas();
  console.log(`Ajuste de biomas: ${ajuste.trocas} trocas, ${ajuste.cobertura} espécies de volta à selvagem, sem lugar ${ajuste.semLugar.length}`);
  // versão pequena só com os biomas, que o jogo carrega ao abrir (src/main.js usa nos biomas que species.js não tem)
  fs.writeFileSync(arq('src/data/habitats-biomas.js'), `// GERADO por tools/gerar-mundo.mjs (o mesmo conteúdo de BIOMAS_PADRAO e BIOMAS_NOITE de src/data/habitats.js).
// Tabela de selvagens de cada bioma novo do mundo ampliado, para áreas sem \`encounters\` próprio. Os cinco biomas de
// src/data/species.js (campo, floresta, margem, praia, planalto) continuam valendo como estão: src/main.js só usa
// estas quando BIOME_ENCOUNTERS não tem o bioma.
export const BIOMAS_PADRAO = {
${Object.entries(BIOMAS_PADRAO).map(([b, t]) => `  ${b}: ${tabJs(t)},`).join('\n')}
};
export const BIOMAS_NOITE = {
${Object.entries(BIOMAS_NOITE).map(([b, t]) => `  ${b}: ${tabJs(t)},`).join('\n')}
};
`);
  const MD = arq('docs/mundo-expandido.md');
  if (fs.existsSync(MD)) {
    let t = fs.readFileSync(MD, 'utf8');
    t = trocaBloco(t, 'niveis', mdNiveis); t = trocaBloco(t, 'ginasios', mdGin); t = trocaBloco(t, 'rebalancear', rebal); t = trocaBloco(t, 'contagem', mdCont);
    t = trocaBloco(t, 'cidades', mdCidades); t = trocaBloco(t, 'dungeons', mdDungeons); t = trocaBloco(t, 'lendarios', mdLendarios); t = trocaBloco(t, 'mega', mdMega);
    t = trocaBloco(t, 'exclusivas', porRegiao);
    fs.writeFileSync(MD, t);
  }
}

// ------------------------------------------------------------------------------------------------ relatório
const tiposOnde = {};
for (const e of LISTA) for (const o of COMO.get(e.dex) ?? []) tiposOnde[o.como] = (tiposOnde[o.como] ?? 0) + 1;
console.log(`Mundo ampliado de Alvorada: ${PLANO.AREAS.length} áreas (${Object.keys(TABELAS).length} com selvagens), ${CIDADES.length} cidades, ${DUNGEONS.length} dungeons, ${PLANO.REGIOES.length} regiões`);
console.log(`Distâncias do núcleo: ${dist.fonte}`);
console.log(`Espécies: ${LISTA.length} | selvagens ${contagem.selvagens} | exclusivas ${contagem.exclusivas} | só de outro jeito ${contagem.outro} | sem lugar ${contagem.sem}`);
console.log(`Como se obtêm (uma espécie pode ter vários): ${Object.entries(tiposOnde).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`Formas regionais: ${Object.keys(FORMAS_OUT).length} (sem lugar ${FORMAS_SEM.length}) | Mega ${Object.keys(MEGA_OUT).length} | Gigantamax ${Object.keys(GMAX_OUT).length}`);
console.log('Escada dos ginásios: ' + ESCADA.map((g) => `${g.lider} ${g.as} (custo ${g.custo})`).join(' < ') + ` < Liga ${NIVEL_LIGA.elite[0]}–${NIVEL_LIGA.campea[1]}`);
const faixas = PLANO.AREAS.filter((a) => TABELAS[a.id]).map((a) => FAIXA.get(a.id));
console.log(`Níveis dos selvagens: de ${Math.min(...faixas.map((f) => f[0]))} a ${Math.max(...faixas.map((f) => f[1]))}`);
if (rebalancear.length) console.log(`Tabelas do mapa a rebalancear para o mundo aberto (${rebalancear.length}): ${rebalancear.map((r) => `${r.id} ${r.mapa.join('-')}→${r.modelo.join('-')}`).join(', ')}`);
if (avisos.length) { console.log(`\nAvisos (${avisos.length}):`); for (const a of avisos.slice(0, 400)) console.log('  - ' + a); if (avisos.length > 80) console.log(`  … e mais ${avisos.length - 80}`); }
if (erros.length) { console.log(`\nERROS (${erros.length}):`); for (const e of erros) console.log('  ✗ ' + e); process.exitCode = 1; }
else console.log('\nOK: nenhum erro.');
