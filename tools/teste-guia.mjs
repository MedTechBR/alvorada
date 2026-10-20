// Teste do guia do objetivo (src/world/guia.js) no mapa de verdade, sem navegador.
// Para cada passo da jornada (tools/jornada-passos.mjs, os mesmos de tools/teste-jornada-completa.mjs), com as flags e
// as montarias daquele passo, parte do lugar onde o passo começa (a chegada: o alvo do passo anterior) e confere, para
// o alvo do painel (progressao.js: proximoPasso) e para cada lugar que o passo pede:
//   1. o guia acha um caminho (a busca ao contrário, do alvo para fora, chega ao jogador);
//   2. o caminho é contínuo e termina numa semente do alvo (cada passo é vizinho andável ou uma passagem de verdade);
//   3. o ponto de passagem (para onde a seta aponta) fica MAIS PERTO do alvo pelo caminho do que o jogador;
//   4. conta quantas vezes a linha reta (a seta antiga) apontava para o lado errado (> 90° do caminho).
// Também confere os lugares das etapas das missões que ficaram (com o jogo no fim) e que nenhum alvo de área cai em
// bloco sólido. Rodar da raiz:  node tools/teste-guia.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const t0 = Date.now();
const { montarAlcance, buscar, lugar } = await abrir('tools/alcance.mjs');
const { PASSOS, flagsDe } = await abrir('tools/jornada-passos.mjs');
const { proximoPasso } = await abrir('src/story/progressao.js');
const { CampoGuia, grafoDe, saltosDe, sementesDe, pontoDePassagem, recuoDeSala } = await abrir('src/world/guia.js');
const { TILE, SOLID, MOUNT_PASS } = await abrir('src/world/tiles.js');
const { MISSOES } = await abrir('src/story/missoes/index.js');

const A = await montarAlcance('alvorada');
const { W, H } = A;
const ALTO = new Set([TILE.TALL, TILE.TALLSNOW, TILE.TALLDRY, TILE.REED]);
const JUMPABLE = new Set(['log', 'stump', 'fence', 'fenceV', 'wfence', 'wfenceV']);
const saltaveis = [...A.cellObj].filter(([, o]) => o.jump || JUMPABLE.has(o.kind)).map(([k]) => k);
const erros = [], linhas = [];
let n = 0, retaErrada = 0, totalAlvos = 0;
const ok = (c, m) => { n++; if (!c) erros.push(m); return c; };

// o grafo do guia com o mapa de colisão daquele passo (barreiras e portões pelas flags, como buscar() de alcance.mjs)
function grafo(f, caps) {
  const B = buscar(A, f, caps, A.spots.inicio); // só para o mapa de blocos com as barreiras do passo
  const passa = new Set(); for (const [k, l] of Object.entries(MOUNT_PASS)) if (caps[k]) for (const t of l) passa.add(t);
  const D = { W, H, tiles: A.tiles, block: B.block, passa, SOLID, TIDE: TILE.TIDE, flags: f,
    ehEnigma: (k) => A.puzzle[k] === 1 && A.salaIdx[k] >= 0, salaDe: (k) => A.salaIdx[k], objeto: (k) => A.cellObj.has(k),
    passagens: A.warps.map((w) => ({ x: w.x, y: w.y, to: w.to, requer: w.requer })), barcos: A.barcos };
  let G = grafoDe(D);
  if (caps.correr) { D.saltos = saltosDe(D, saltaveis, G.livre); G = grafoDe(D); }
  return G;
}
// alvo por nome: { x, y, area? } em blocos
function alvoDe(nome) {
  const as = A.areas.filter((a) => a.id === nome);
  if (as.length && !A.spots[nome]) { const a = as[0], [cx, cy] = a.rect ? [a.rect[0] + a.rect[2] / 2, a.rect[1] + a.rect[3] / 2] : [a.ellipse[0], a.ellipse[1]]; return { x: Math.floor(cx), y: Math.floor(cy), area: a }; }
  if (A.spots['dentro_' + nome]) { const [x, y] = A.spots['dentro_' + nome]; return { x, y }; }
  const L = lugar(A, nome); return L ? { x: L.x, y: L.y } : null;
}
const C = new CampoGuia(W, H);
// guia do ponto (sx, sy) até o alvo: { ok, dist, wpDist, reta } ou { ok: false, motivo }
function guiar(G, alvo, sx, sy) {
  const sem = sementesDe({ W, H, OH: A.OH, tiles: A.tiles, ALTO }, G, alvo.x, alvo.y, alvo.area);
  if (!sem.length) return { ok: false, motivo: 'sem semente andável perto do alvo' };
  if (alvo.area) for (const k of sem) if (!G.anda(k)) return { ok: false, motivo: `semente sólida em ${k % W},${Math.floor(k / W)}` };
  // como o jogo: se o alvo está atrás de um quebra-cabeça de masmorra, mira a entrada da sala (e a anterior...)
  let k = -1, nivel = 0, salas = new Set(sem.map((q) => G.salaDe(q)).filter((r) => r >= 0)), semente = sem;
  for (;;) {
    C.iniciar(G, semente);
    while (!C.terminou) { C.expandir(50000); k = C.achar(sx, sy, 2); if (k >= 0) break; }
    if (k < 0) k = C.achar(sx, sy, 2);
    if (k >= 0 || !salas.size || nivel >= 5) break;
    const r = recuoDeSala(G, salas); if (!r.sementes.length) break;
    semente = r.sementes; salas = r.salas; nivel++;
  }
  if (k < 0) return { ok: false, motivo: 'sem caminho' };
  const cam = C.caminho(k, 70000), pts = cam.pts;
  // continuidade: cada passo é vizinho (andando) ou a passagem registrada
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], ax = a % W, ay = (a - ax) / W, bx = b % W, by = (b - bx) / W;
    if (Math.abs(ax - bx) + Math.abs(ay - by) === 1) { if (!G.no(b)) return { ok: false, motivo: `passo para bloco que não é nó em ${bx},${by}` }; continue; }
    if (C.dir[a] !== 5) return { ok: false, motivo: `salto sem passagem de ${ax},${ay} para ${bx},${by}` };
  }
  const fim = pts.at(-1);
  if (C.dist[fim] !== 1) return { ok: false, motivo: 'caminho não termina no alvo' };
  const wp = pontoDePassagem(cam, 12);
  const dist = C.dist[k] - 1, wpDist = C.dist[wp.k] - 1;
  // a seta antiga: linha reta até o alvo; a nova: até o ponto de passagem
  const kx = k % W, ky = (k - kx) / W, wx = wp.k % W, wy = (wp.k - wx) / W;
  const rx = alvo.x - kx, ry = alvo.y - ky, vx = wx - kx, vy = wy - ky;
  const reta = (rx * vx + ry * vy) < 0 && !wp.porta && Math.hypot(vx, vy) > 3;
  return { ok: true, dist, wpDist, reta, porta: wp.porta, nivel };
}

// ---------------------------------------------------------------- os passos da jornada
let chegada = A.spots.inicio, nomeChegada = 'inicio';
for (let i = 0; i < PASSOS.length; i++) {
  const P = PASSOS[i], f = flagsDe(P), G = grafo(f, P.caps);
  const passo = proximoPasso(f);
  const nomes = [...new Set([passo?.alvo, ...P.alvos].filter(Boolean))];
  const L = { passo: P.id, de: nomeChegada, alvos: 0, mediaDist: 0, reta: 0 };
  for (const nome of nomes) {
    const alvo = alvoDe(nome);
    if (!ok(!!alvo, `[${P.id}] alvo desconhecido: ${nome}`)) continue;
    totalAlvos++;
    const r = guiar(G, alvo, chegada[0], chegada[1]);
    if (!ok(r.ok, `[${P.id}] de ${nomeChegada} até ${nome}: ${r.motivo}`)) continue;
    ok(r.dist <= 1 || r.wpDist < r.dist, `[${P.id}] ${nome}: o ponto de passagem não fica mais perto (${r.wpDist} >= ${r.dist})`);
    L.alvos++; L.mediaDist += r.dist; if (r.reta) { L.reta++; retaErrada++; }
  }
  L.mediaDist = Math.round(L.mediaDist / Math.max(1, L.alvos));
  linhas.push(L);
  // o próximo passo começa onde este termina: no alvo do painel
  const a = alvoDe(passo?.alvo ?? nomes[0]); if (a) { chegada = [a.x, a.y]; nomeChegada = passo?.alvo ?? nomes[0]; }
}

// ---------------------------------------------------------------- casos de interior: saindo de casa e entrando no prédio
{
  const P = PASSOS[0], f = flagsDe(P), G = grafo(f, P.caps);
  for (const [de, para, rotulo] of [['dentro_casa_jogador', 'laboratorio', 'casa do jogador → laboratório'], ['dentro_laboratorio', 'leader_tome', 'laboratório → Líder Tomé'], ['dentro_centro_campina', 'gym', 'Centro de Campina → ginásio']]) {
    const s = A.spots[de], alvo = alvoDe(para);
    if (!ok(!!s && !!alvo, `interior: ${rotulo}: ponto desconhecido`)) continue;
    const r = guiar(G, alvo, s[0], s[1]);
    if (!ok(r.ok, `interior: ${rotulo}: ${r.motivo}`)) continue;
    ok(r.porta, `interior: ${rotulo}: de dentro, a seta deveria mirar a porta de saída primeiro`);
  }
}

// ---------------------------------------------------------------- missões que ficaram: cada lugar de etapa alcançável no fim do jogo
{
  const P = PASSOS.at(-1), f = { ...flagsDe(P), liga_campeao: true }, G = grafo(f, P.caps);
  let k = 0;
  for (const m of MISSOES) for (const e of m.etapas) {
    let alvo = null;
    if (e.lugar) alvo = alvoDe(e.lugar);
    else if (e.x != null && e.sala) { const r = A.salas.find((q) => q.id === e.sala); if (r) alvo = { x: r.x + e.x, y: r.y + e.y }; }
    else if (e.x != null) alvo = { x: e.x, y: e.y };
    if (!alvo) continue;
    const r = guiar(G, alvo, A.spots.inicio[0], A.spots.inicio[1]);
    ok(r.ok, `missão ${m.id}: "${e.texto}" (${e.lugar ?? e.sala ?? ''} ${alvo.x},${alvo.y}): ${r.motivo}`);
    k++;
  }
  linhas.push({ passo: 'missões', de: 'inicio', alvos: k, mediaDist: 0, reta: 0 });
}

console.log(`Guia do objetivo: ${totalAlvos} alvos da jornada, ${n} verificações, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
for (const l of linhas) console.log(`  ${l.passo.padEnd(9)} de ${String(l.de).padEnd(22)} alvos ${String(l.alvos).padStart(2)}  caminho médio ${String(l.mediaDist).padStart(4)} blocos  reta errada ${l.reta}`);
console.log(`  a linha reta (seta antiga) apontava para o lado oposto ao caminho em ${retaErrada} de ${totalAlvos} alvos`);
if (erros.length) { console.log(`\nFALHOU (${erros.length}):`); for (const e of erros) console.log('  x ' + e); process.exitCode = 1; }
else console.log('\nOK: de cada chegada há caminho até cada alvo, e a seta aponta para o próximo trecho dele.');
