import { KINDS } from './objects.js';
import { gerarInteriores } from './interiores.js';
import { mesclarVestir } from './vestir.js';
import { vestirSalas } from './receitas.js';
import { marcarSaidas } from './saidas.js';
import { salasEstadios } from './estadios.js';

// Mundos (continentes) e a montagem dos dados de um mapa a partir dos arquivos de assets/maps/.
//
// - assets/maps/mundos.json lista os mundos: [{ id, arquivo, nome, curto }]. Cada mundo é um mapa próprio
//   (Alvorada, Terras do Ocaso), com as próprias coordenadas; só um fica montado por vez (map.carregar).
// - O arquivo do mundo (ex.: alvorada.json) traz o tamanho, o que ele mesmo desenha e duas listas de arquivos:
//     include  arquivos desenhados ANTES dele (o esboço do núcleo)
//     regioes  um arquivo por região de construção, desenhados DEPOIS (assets/maps/regioes/<id>.json)
// - Cada arquivo de região começa com o cabeçalho "regiao": { id, nome, rect: [x, y, w, h], faixa: [x, y, w, h] }.
//   Ele só pinta dentro do próprio retângulo (o motor recorta), usa coordenadas absolutas do mundo lá fora e
//   põe as salas na própria faixa de interiores: sem x/y a sala ganha lugar sozinha; com x/y, eles são relativos
//   à faixa. Assim dois agentes nunca colidem.
// - Prédios com porta e sem "to" ganham um interior gerado (src/world/interiores.js), alocado na faixa da região.
// Formato completo: assets/maps/LEIAME.md. Manual para quem constrói uma região: docs/construir-regiao.md.

const MAPS = new URL('../../assets/maps/', import.meta.url);
export const MUNDOS = await fetch(new URL('mundos.json', MAPS)).then((r) => r.json()).catch(() => [{ id: 'alvorada', arquivo: 'alvorada.json', nome: 'Alvorada' }]);
// Mundo da lista, ou (só para testes, ?mapa=<nome>) qualquer outro arquivo da pasta: assets/maps/<nome>.json
export const mundoInfo = (id) => MUNDOS.find((m) => m.id === id) ?? (/^[a-z0-9-]{1,40}$/.test(id ?? '') ? { id, arquivo: id + '.json', nome: id, teste: true } : null);

const GAP = 20;        // vazio entre salas (a câmera não pode mostrar a sala vizinha)
const cache = new Map(), brutos = new Map();
// Só o arquivo principal do mundo, como está no disco (para quem lê campos dele na carga dos módulos)
export function lerPrincipal(id) {
  const M = mundoInfo(id); if (!M) return Promise.reject(new Error(`mundo desconhecido: ${id}`));
  if (!brutos.has(id)) brutos.set(id, ler(new URL(M.arquivo, MAPS)).catch((e) => { brutos.delete(id); throw e; }));
  return brutos.get(id);
}
// Dados montados de um mundo (promessa guardada: a segunda chamada não baixa de novo)
export function dadosDoMundo(id) {
  if (!cache.has(id)) cache.set(id, montar(id).catch((e) => { cache.delete(id); throw e; }));
  return cache.get(id);
}

async function ler(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`mapa: não consegui ler ${url} (${r.status})`);
  return r.json();
}
const hashTxt = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const dentro = (r, x, y) => r && x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3];
const tamanho = (r) => ({ w: Math.max(...r.rows.map((s) => s.length)), h: r.rows.length });

async function montar(id) {
  const M = mundoInfo(id);
  if (!M) throw new Error(`mundo desconhecido: ${id}`);
  const base = new URL(M.arquivo, MAPS);
  const J = structuredClone(await lerPrincipal(id));
  const incs = await Promise.all((J.include ?? []).map((f) => ler(new URL(f, base))));
  const regs = (await Promise.all((J.regioes ?? []).map((f) => ler(new URL(f, base)).then((d) => ({ ...d, _arquivo: f })).catch((e) => { console.warn(e.message); return null; })))).filter(Boolean);
  // camada vestir (enfeite gerado por tools/vestir.mjs): assets/maps/vestir/<id da região>.json, se existir
  // ?vestir=0 na URL deixa o mapa sem o enfeite (comparar antes e depois)
  const semVestir = typeof location !== 'undefined' && new URLSearchParams(location.search).get('vestir') === '0';
  const vestires = semVestir ? regs.map(() => null) : await Promise.all(regs.map((F) => fetch(new URL(`vestir/${F.regiao?.id}.json`, MAPS)).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  regs.forEach((F, i) => mesclarVestir(F, vestires[i]));

  const W = J.w, H = J.h, OH = J.outdoorH ?? H;
  const R = {
    id, nome: M.nome ?? J.name ?? id, curto: M.curto ?? M.nome ?? id, w: W, h: H, outdoorH: OH, base: J.base ?? 'grass',
    forestKinds: J.forestKinds, forestZones: [...(J.forestZones ?? [])], flowerRows: J.flowerRows,
    partes: [], objects: [], decor: [], interiors: [], areas: [], spots: {}, radius: { ...(J.radius ?? {}) }, warps: [], items: [],
    people: [...(J.people ?? [])], pets: [...(J.pets ?? [])], signs: [...(J.signs ?? [])], noTrees: [...(J.noTrees ?? [])],
    viagens: [...(J.viagens ?? [])], ninhos: [...(J.ninhos ?? [])], regioes: [], avisos: [],
    mecanismos: [...(J.mecanismos ?? [])], buracos: [...(J.buracos ?? [])], tocas: [...(J.tocas ?? [])], enigmas: J.enigmas, teste: J.teste ?? (M.teste ? {} : undefined), formaRegional: J.formaRegional ?? null,
  };
  // ---- o próprio arquivo do mundo, com os "include" desenhados antes (mesma ordem de sempre: o núcleo não muda) ----
  let ops = J.ops ?? [], trees = J.trees ?? [], objects = J.objects ?? [], decor = J.decor ?? [], areas = J.areas ?? [], items = J.items ?? [], warps = J.warps ?? [], spots = J.spots ?? {};
  for (const I of incs) {
    ops = [...(I.ops ?? []), ...ops];
    trees = [...trees, ...(I.trees ?? [])]; objects = [...objects, ...(I.objects ?? [])]; decor = [...decor, ...(I.decor ?? [])];
    items = [...items, ...(I.items ?? [])]; warps = [...warps, ...(I.warps ?? [])];
    areas = [...(I.areas ?? []), ...areas];
    spots = { ...(I.spots ?? {}), ...spots };
    for (const k of ['people', 'pets', 'noTrees', 'signs']) if (I[k]) R[k].push(...I[k]);
  }
  const rectBase = J.rect ?? null, faixaBase = J.faixa ?? [0, OH, W, H - OH];
  R.partes.push({ id: J.regiao?.id ?? (rectBase ? 'nucleo' : 'base'), nome: J.regiao?.nome ?? (rectBase ? 'Núcleo de Alvorada' : R.nome), formaRegional: J.formaRegional ?? null, rect: rectBase, faixa: faixaBase, ops, trees, seq: true, lazy: false, i: 0 }); // o arquivo principal é montado sempre
  if (rectBase) R.regioes.push({ id: J.regiao?.id ?? 'nucleo', nome: J.regiao?.nome ?? R.nome, rect: rectBase, faixa: faixaBase, formaRegional: J.formaRegional ?? null });
  const comParte = (list, p) => list.map((o) => ({ ...o, parte: p }));
  R.objects.push(...comParte(objects, 0)); R.decor.push(...decor); R.areas.push(...areas); R.items.push(...items);
  R.warps.push(...warps); Object.assign(R.spots, spots);
  const salas = (J.interiors ?? []).map((r) => ({ ...r, parte: 0, ...tamanho(r) }));

  // ---- arquivos de região: cada um num retângulo próprio, desenhado depois ----
  for (const F of regs) {
    const hd = F.regiao;
    if (!hd?.id || !hd.rect) { R.avisos.push(`${F._arquivo}: falta o cabeçalho "regiao" com id e rect`); continue; }
    const pi = R.partes.length, faixa = hd.faixa ?? null;
    // região dentro do retângulo do arquivo principal (ex.: acréscimos ao núcleo) é montada já; as outras, sob demanda
    const sobre = rectBase && hd.rect[0] < rectBase[0] + rectBase[2] && hd.rect[0] + hd.rect[2] > rectBase[0] && hd.rect[1] < rectBase[1] + rectBase[3] && hd.rect[1] + hd.rect[3] > rectBase[1];
    R.partes.push({ id: hd.id, nome: hd.nome ?? hd.id, rect: hd.rect, faixa, formaRegional: hd.formaRegional ?? null, ops: F.ops ?? [], trees: F.trees ?? [], seed: 100000 + (hashTxt(hd.id) % 50000) * 64, lazy: hd.montar === 'sempre' ? false : !sobre, i: pi, arquivo: F._arquivo });
    if (!sobre) R.regioes.push({ id: hd.id, nome: hd.nome ?? hd.id, rect: hd.rect, faixa, formaRegional: hd.formaRegional ?? null });
    const fora = (x, y, o) => { if (!dentro(hd.rect, x, y)) R.avisos.push(`${F._arquivo}: ${o} fora do retângulo da região (${x}, ${y})`); };
    for (const o of F.objects ?? []) { fora(o.x, o.y, `objeto ${o.kind}`); R.objects.push({ ...o, parte: pi }); }
    for (const d of F.decor ?? []) R.decor.push(d);
    for (const a of F.areas ?? []) { const [x, y] = a.rect ?? a.ellipse ?? [0, 0]; fora(x, y, `área ${a.id ?? a.name}`); R.areas.push(a); }
    for (const it of F.items ?? []) R.items.push(it);
    for (const w of F.warps ?? []) R.warps.push(w);
    for (const [k, v] of Object.entries(F.spots ?? {})) { if (R.spots[k]) R.avisos.push(`${F._arquivo}: ponto "${k}" já existe em outro arquivo`); R.spots[k] = v; }
    Object.assign(R.radius, F.radius ?? {});
    for (const k of ['people', 'pets', 'noTrees', 'signs', 'viagens', 'ninhos', 'forestZones', 'mecanismos', 'buracos', 'tocas']) if (F[k]) R[k].push(...F[k]);
    for (const r of F.interiors ?? []) {
      const s = { ...r, parte: pi, ...tamanho(r) };
      if (r.x != null && r.y != null && faixa) { s.x = faixa[0] + r.x; s.y = faixa[1] + r.y; s.relativa = true; } else if (r.x == null || r.y == null) { delete s.x; delete s.y; }
      salas.push(s);
    }
  }
  for (const a of R.avisos) console.warn('mapa:', a);
  // estádios das lutas de líder (src/world/estadios.js): salas grandes, fora dos arquivos de mapa, abaixo das outras
  if (id === 'alvorada') for (const s of salasEstadios()) salas.push({ ...s, parte: 0, ...tamanho(s) });

  // ---- interiores gerados para prédios sem "to" (src/world/interiores.js) e alocação das salas sem posição ----
  const parteDe = (x, y) => { for (let i = R.partes.length - 1; i >= 0; i--) if (dentro(R.partes[i].rect, x, y)) return i; return 0; };
  const ids = new Set(salas.map((r) => r.id));
  const novos = gerarInteriores(R, { KINDS, ids, parteDe });
  for (const s of novos) salas.push({ ...s, ...tamanho(s) });
  vestirSalas(R, salas); // mobília no estilo dos originais (Centro, Mercado, casas, laboratório): src/world/receitas.js
  alocar(R, salas);
  // conteúdo das salas em coordenadas da sala → absolutas (itens, passagens internas)
  const porId = Object.fromEntries(salas.map((r) => [r.id, r]));
  for (const r of salas) {
    for (const it of r.items ?? []) R.items.push({ ...it, x: r.x + it.x, y: r.y + it.y, room: r.id });
    for (const w of r.warps ?? []) R.warps.push({ ...w, x: r.x + w.x, y: r.y + w.y, to: alvoRel(w.to, r, porId) });
  }
  // passagens: [x, y] absoluto, ["sala", x, y] relativo à sala, "ponto" (nome em spots)
  R.warps = R.warps.map((w) => (w.mundo ? w : { ...w, to: Array.isArray(w.to) && typeof w.to[0] === 'string' ? alvoRel(w.to, null, porId) : w.to }));
  R.interiors = salas;
  marcarSaidas(R); // r.saidas: portas de saída de cada sala (tapete, abertura na frente e guia no mesmo bloco)
  return R;
}
function alvoRel(to, sala, porId) {
  if (typeof to === 'string' || !Array.isArray(to)) return to;
  if (typeof to[0] === 'string') { const r = porId[to[0]]; if (!r) { console.warn('mapa: passagem para sala que não existe', to); return [0, 0]; } return [r.x + to[1], r.y + to[2]]; }
  return sala ? [sala.x + to[0], sala.y + to[1]] : to;
}

// Põe cada sala sem posição na faixa de interiores da região dela, em prateleiras, sem encostar em nenhuma outra
// (GAP blocos de vazio). Determinístico: depende só da ordem das salas no arquivo.
function alocar(R, salas) {
  const ocup = salas.filter((r) => r.x != null).map((r) => [r.x, r.y, r.w, r.h]);
  const bate = (x, y, w, h) => ocup.find((o) => x < o[0] + o[2] + GAP && x + w + GAP > o[0] && y < o[1] + o[3] + GAP && y + h + GAP > o[1]);
  const cursor = new Map();
  for (const r of salas) {
    if (r.x != null) continue;
    const P = R.partes[r.parte] ?? R.partes[0], F = P.faixa ?? R.partes[0].faixa;
    let c = cursor.get(P) ?? { x: F[0] + 4, y: F[1] + 12, linha: 0 }; // 12 blocos de folga no topo (a câmera não mostra o lado de fora)
    for (let n = 0; n < 4000; n++) {
      if (c.x + r.w > F[0] + F[2] - 2) { c = { x: F[0] + 4, y: c.y + Math.max(8, c.linha) + GAP, linha: 0 }; continue; }
      if (c.y + r.h > F[1] + F[3] - 1) { R.avisos.push(`faixa de interiores de "${P.id}" cheia: sala ${r.id} ficou fora`); console.warn('mapa: faixa de interiores cheia em', P.id, '(sala', r.id + ')'); break; }
      const o = bate(c.x, c.y, r.w, r.h);
      if (o) { c.x = o[0] + o[2] + GAP; continue; }
      break;
    }
    r.x = c.x; r.y = c.y; r.auto = true;
    ocup.push([r.x, r.y, r.w, r.h]);
    c.x += r.w + GAP; c.linha = Math.max(c.linha, r.h);
    cursor.set(P, c);
  }
}
