// Análise de biomas das áreas de encontro (src/data/habitats.js). Usado por tools/auditar-biomas.mjs e
// tools/ajustar-biomas.mjs. Só Node, sem Chrome. Lê os mapas (assets/maps) para o chão de cada área.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  TIPOS_POR_BIOMA, EXTRA_POR_BIOMA, PERMITIDO_EXTRA, REGRAS_NOME, BIOMA_POR_TILE, SEGMENTOS, ASSINATURA,
  segmentoDe, faixaDoSegmento, ARQUIVO_DA_REGIAO,
} from './biomas-regras.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const arq = (p) => path.join(RAIZ, p);
const txt = (p) => fs.readFileSync(arq(p), 'utf8');
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export async function carregarDados() {
  const H = await import(pathToFileURL(arq('src/data/habitats.js')).href);
  const E = await import(pathToFileURL(arq('src/data/gen/especies.js')).href);
  return { AREAS: H.AREAS_ENCONTROS, ONDE: H.ONDE, BIOMAS_PADRAO: H.BIOMAS_PADRAO, BIOMAS_NOITE: H.BIOMAS_NOITE, ESPECIES: E.ESPECIES };
}

// Nome, região e custo de cada área (tools/mundo/plano.mjs e lugares.mjs)
export function lerNomesERegioes() {
  const info = {};
  const linhas = (txt('tools/mundo/plano.mjs') + '\n' + txt('tools/mundo/lugares.mjs')).split('\n');
  for (const l of linhas) {
    const id = /id: '([a-z_0-9]+)'/.exec(l);
    if (!id) continue;
    const nome = /nome: '([^']*)'/.exec(l);
    const reg = /regiao: '([a-z_0-9]+)'/.exec(l);
    info[id[1]] = { nome: nome ? nome[1] : id[1], regiao: reg ? reg[1] : null };
  }
  return info;
}

// Mapas: áreas com rect e as operações de chão (ops), para contar os tiles dentro de cada retângulo
export function lerMapas() {
  const mapas = [];
  const esboco = JSON.parse(txt('assets/maps/esboco.json'));
  const alvorada = JSON.parse(txt('assets/maps/alvorada.json'));
  mapas.push({ arquivo: 'assets/maps/alvorada.json', base: alvorada.base || 'void', ops: [...(esboco.ops || []), ...(alvorada.ops || [])], areas: alvorada.areas || [] });
  for (const dir of ['assets/maps/regioes', 'assets/maps/ocaso']) {
    for (const f of fs.readdirSync(arq(dir))) {
      if (!f.endsWith('.json')) continue;
      const j = JSON.parse(txt(path.join(dir, f)));
      mapas.push({ arquivo: path.join(dir, f), base: j.base || 'void', ops: j.ops || [], areas: j.areas || [] });
    }
  }
  return mapas;
}

// Amostragem do chão: a cada STEP blocos dentro do retângulo, o último op que cobre o ponto define o tile.
// Ignorados: blobs, scatter, stamp, fence, line e set (são ruído ou detalhe; a amostra cobre o essencial).
const STEP = 4;
function cobre(o, x, y) {
  switch (o.op) {
    case 'rect': return x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h;
    case 'border': {
      if (x < o.x || x >= o.x + o.w || y < o.y || y >= o.y + o.h) return false;
      const b = Math.min(x - o.x, o.x + o.w - 1 - x, y - o.y, o.y + o.h - 1 - y);
      return b < (o.width || 2);
    }
    case 'ellipse': {
      const dx = (x - o.cx) / o.rx, dy = (y - o.cy) / o.ry;
      return dx * dx + dy * dy <= 1;
    }
    case 'poly': return dentroPoligono(x, y, o.pts);
    case 'path': {
      const raio = (o.width || 4) / 2;
      for (let i = 0; i + 1 < o.pts.length; i++) if (distSeg(x, y, o.pts[i], o.pts[i + 1]) <= raio) return true;
      return false;
    }
    default: return false;
  }
}
function dentroPoligono(x, y, pts) {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}
function distSeg(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function caixaOp(o) {
  switch (o.op) {
    case 'rect': case 'border': return [o.x, o.y, o.x + o.w, o.y + o.h];
    case 'ellipse': return [o.cx - o.rx, o.cy - o.ry, o.cx + o.rx, o.cy + o.ry];
    case 'poly': case 'path': {
      const xs = o.pts.map((p) => p[0]), ys = o.pts.map((p) => p[1]), m = o.width || 4;
      return [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m];
    }
    default: return null;
  }
}
export function contarTiles(mapa, [rx, ry, rw, rh]) {
  const ops = mapa.ops.filter((o) => {
    const c = caixaOp(o);
    return c && c[2] > rx && c[0] < rx + rw && c[3] > ry && c[1] < ry + rh;
  });
  const cont = {};
  for (let y = ry; y < ry + rh; y += STEP) {
    for (let x = rx; x < rx + rw; x += STEP) {
      let t = mapa.base;
      for (const o of ops) if (cobre(o, x, y)) t = o.t;
      cont[t] = (cont[t] || 0) + 1;
    }
  }
  return cont;
}

// Bioma pelo chão: maioria dos tiles que têm bioma definido
export function biomaDoChao(cont) {
  const votos = {};
  let total = 0;
  for (const [t, n] of Object.entries(cont)) {
    const b = BIOMA_POR_TILE[t];
    if (!b) continue;
    votos[b] = (votos[b] || 0) + n;
    total += n;
  }
  const ord = Object.entries(votos).sort((a, b) => b[1] - a[1]);
  if (!ord.length) return { bioma: null, parte: 0 };
  return { bioma: ord[0][0], parte: ord[0][1] / total };
}

// Bioma pelo nome (regras em biomas-regras.mjs)
export function biomaDoNome(nome) {
  const n = semAcento(nome);
  for (const [re, b] of REGRAS_NOME) if (re.test(n)) return b;
  return null;
}

export function tiposOk(dex, biome, ESPECIES, area = null) {
  const sp = ESPECIES[dex];
  if (!sp) return false;
  const permitidos = [...(TIPOS_POR_BIOMA[biome] || []), ...((EXTRA_POR_BIOMA[biome] || []).includes(dex) ? ['flying'] : []), ...((area && PERMITIDO_EXTRA[area]) || [])];
  return sp.types.some((t) => permitidos.includes(t));
}

export const bst = (sp) => sp.base.reduce((a, b) => a + b, 0);
const PREVO = (ESPECIES) => {
  const m = new Map();
  for (const [d, sp] of Object.entries(ESPECIES)) for (const e of sp.evo || []) m.set(+e.to, +d);
  return m;
};
export function criarEstagio(ESPECIES) {
  const pre = PREVO(ESPECIES);
  return (dex) => {
    const sp = ESPECIES[dex];
    const temPre = pre.has(dex), temEvo = (sp.evo || []).length > 0;
    if (temPre) return temEvo ? 'meio' : 'final';
    return temEvo ? 'basico' : 'unico';
  };
}

// Análise completa: uma entrada por área
export function analisar(dados) {
  const { AREAS, ESPECIES, BIOMAS_PADRAO, BIOMAS_NOITE } = dados;
  const nomes = lerNomesERegioes();
  const mapas = lerMapas();
  const achar = (id) => {
    for (const m of mapas) { const a = m.areas.find((x) => x.id === id && x.rect); if (a) return { mapa: m, rect: a.rect }; }
    return null;
  };
  const estagio = criarEstagio(ESPECIES);
  const linhas = [];
  for (const id of Object.keys(AREAS)) {
    const a = AREAS[id];
    const info = nomes[id] || { nome: id, regiao: null };
    const seg = segmentoDe(id, info.regiao);
    const alvo = achar(id);
    const cont = alvo ? contarTiles(alvo.mapa, alvo.rect) : null;
    const chao = cont ? biomaDoChao(cont) : { bioma: null, parte: 0 };
    const nomeB = biomaDoNome(info.nome);
    // Rótulo do arquivo da própria região (o mapa da região diz o cenário dela)
    let rotuloRegiao = null;
    const arqReg = ARQUIVO_DA_REGIAO[info.regiao];
    if (arqReg) { const r = mapas.find((m) => m.arquivo === arqReg)?.areas.find((x) => x.id === id); if (r?.biome) rotuloRegiao = r.biome; }
    const efetivo = nomeB || rotuloRegiao || a.bioma;
    const todas = [...new Set([...(a.dia || []), ...(a.noite || [])].map((r) => r[0]))];
    linhas.push({
      id, nome: info.nome, regiao: info.regiao, seg, custo: a.custo, rotulo: a.bioma, nomeBioma: nomeB, rotuloRegiao,
      chao: chao.bioma, chaoParte: chao.parte, chaoTop: cont ? Object.entries(cont).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([t, n]) => t + ' ' + Math.round((100 * n) / Object.values(cont).reduce((p, q) => p + q, 0)) + '%').join(', ') : '(sem rect)',
      efetivo, especies: todas,
    });
  }
  return { linhas, estagio, nomes };
}

// Desvios: espécies de uma área que não combinam com o bioma efetivo
export function desviosDaArea(dados, lin, tabela = null) {
  const { AREAS, ESPECIES } = dados;
  const a = AREAS[lin.id];
  const tabelas = tabela ? [tabela] : ['dia', 'noite'];
  const out = [];
  for (const t of tabelas) {
    for (const r of a[t] || []) if (!tiposOk(r[0], lin.efetivo, ESPECIES, lin.id)) out.push({ tabela: t, dex: r[0], nome: ESPECIES[r[0]].name, tipos: ESPECIES[r[0]].types });
  }
  if (a.alfa && !tiposOk(a.alfa[0], lin.efetivo, ESPECIES, lin.id)) out.push({ tabela: 'alfa', dex: a.alfa[0], nome: ESPECIES[a.alfa[0]].name, tipos: ESPECIES[a.alfa[0]].types });
  return out;
}

export { SEGMENTOS, ASSINATURA, faixaDoSegmento, segmentoDe, TIPOS_POR_BIOMA };
