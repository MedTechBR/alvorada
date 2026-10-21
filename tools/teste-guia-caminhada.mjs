// Anda com o jogador, de pouco em pouco, pelo caminho do guia (praça da Vila Sussurro -> bifurcação, trilha do
// jequitibá e mata dos jequitibás) e confere, a cada quadro, o que a seta mostraria:
//   1. a direção da seta (jogador -> ponto ~10 blocos à frente no caminho) fica a até 25° do trecho seguinte do caminho
//      (os próximos 3 blocos da rota);
//   2. a distância (caminho restante) nunca aumenta enquanto se anda e cai a cada bloco novo;
//   3. se o jogador sai do caminho (4+ blocos), o guia já tem o caminho de volta, sem esperar 20 s.
// Usa o mesmo campo e o mesmo ponto de passagem do jogo (src/world/guia.js). Rodar da raiz:  node tools/teste-guia-caminhada.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const { montarAlcance, buscar } = await abrir('tools/alcance.mjs');
const { PASSOS, flagsDe } = await abrir('tools/jornada-passos.mjs');
const { CampoGuia, grafoDe, sementesDe, pontoDeVista, linhaLivre, ALCANCE_MAX } = await abrir('src/world/guia.js');
const { TILE, SOLID, MOUNT_PASS } = await abrir('src/world/tiles.js');

const A = await montarAlcance('alvorada'), { W, H } = A;
const P = PASSOS[0], f = flagsDe(P), B = buscar(A, f, P.caps, A.spots.inicio);
const passa = new Set(); for (const [k, l] of Object.entries(MOUNT_PASS)) if (P.caps[k]) for (const t of l) passa.add(t);
const G = grafoDe({ W, H, tiles: A.tiles, block: B.block, passa, SOLID, TIDE: TILE.TIDE, flags: f,
  ehEnigma: (k) => A.puzzle[k] === 1 && A.salaIdx[k] >= 0, salaDe: (k) => A.salaIdx[k], objeto: (k) => A.cellObj.has(k),
  passagens: A.warps.map((w) => ({ x: w.x, y: w.y, to: w.to, requer: w.requer })), barcos: A.barcos });
const ALTO = new Set([TILE.TALL, TILE.TALLSNOW, TILE.TALLDRY, TILE.REED]);
const T = 16, xy = (k) => [k % W, Math.floor(k / W)];
const erros = []; let n = 0;
const ok = (c, m) => { n++; if (!c) erros.push(m); return c; };
const ang = (ax, ay, bx, by) => { let d = Math.abs(Math.atan2(ay, ax) - Math.atan2(by, bx)); if (d > Math.PI) d = 2 * Math.PI - d; return d * 180 / Math.PI; };

// o que a seta mostra com o jogador em (x, y) pixels: o mesmo cálculo de Guia.#info
function seta(C, x, y) {
  const k = C.achar(Math.floor(x / T), Math.floor(y / T), 2); if (k < 0) return null;
  const cam = C.caminho(k, 600), wp = pontoDeVista(G, cam, ALCANCE_MAX), [wx, wy] = xy(wp.k);
  return { k, cam, wp, dist: C.dist[k] - 1, vx: wx * T + 8 - x, vy: wy * T + 8 - y };
}
function campoPara(nome) {
  const [ax, ay] = A.spots[nome], sem = sementesDe({ W, H, OH: A.OH, tiles: A.tiles, ALTO }, G, ax, ay, null);
  const C = new CampoGuia(W, H); C.iniciar(G, sem); C.expandir(W * H); return C;
}
const de = A.spots.vila_sussurro;
for (const alvo of ['bifurcacao', 'trilha_jequitiba', 'bifurcacao__leste']) {
  const C = campoPara(alvo), k0 = C.achar(de[0], de[1], 2);
  if (!ok(k0 >= 0, `${alvo}: sem caminho a partir da praça`)) continue;
  const rota = C.caminho(k0, 5000).pts.map(xy);
  let x = rota[0][0] * T + 8, y = rota[0][1] * T + 8, i = 1, ultDist = Infinity, ultBloco = -1, piorAng = 0, quadros = 0;
  while (i < rota.length) {
    const tx = rota[i][0] * T + 8, ty = rota[i][1] * T + 8, d = Math.hypot(tx - x, ty - y);
    if (d <= 4) { x = tx; y = ty; i++; } else { x += (tx - x) / d * 4; y += (ty - y) / d * 4; }
    const s = seta(C, x, y); if (!s) { ok(false, `${alvo}: sem seta em ${x},${y}`); break; }
    quadros++; ok(linhaLivre(G, s.k, s.wp.k), `${alvo}: a seta aponta para um ponto sem linha livre em ${(x / T) | 0},${(y / T) | 0}`);
    // trecho seguinte do caminho esticado (o ponto mais longe da rota a que se chega em linha reta livre, sem limite)
    let j = Math.min(i, rota.length - 1); for (let q = rota.length - 1; q > i; q--) if (linhaLivre(G, s.k, rota[q][1] * W + rota[q][0])) { j = q; break; }
    const segx = rota[j][0] * T + 8 - x, segy = rota[j][1] * T + 8 - y;
    if (rota.length - i > 4 && !s.cam.passagens.length && Math.hypot(segx, segy) > 3 * T) { const a = ang(s.vx, s.vy, segx, segy); piorAng = Math.max(piorAng, a); if (a > 25) ok(false, `${alvo}: seta ${a.toFixed(0)}° fora do trecho seguinte em ${(x / T) | 0},${(y / T) | 0}`); }
    if (s.dist > ultDist) ok(false, `${alvo}: a distância subiu de ${ultDist} para ${s.dist} em ${(x / T) | 0},${(y / T) | 0}`);
    if (s.k !== ultBloco) { if (ultBloco >= 0 && s.dist >= ultDist) ok(false, `${alvo}: a distância não caiu ao mudar de bloco (${ultDist} -> ${s.dist})`); ultBloco = s.k; }
    ultDist = Math.min(ultDist, s.dist);
  }
  console.log(`  ${alvo.padEnd(18)} ${rota.length} blocos, ${quadros} quadros, pior desvio da seta ${piorAng.toFixed(0)}°, distância final ${ultDist}`);
  ok(ultDist <= 1, `${alvo}: a caminhada terminou longe do alvo (${ultDist})`);
}
// saiu do caminho: o jogador é posto 4-5 blocos de lado; o campo já dá o caminho de volta (o guia refaz a cada bloco)
{
  const C = campoPara('trilha_jequitiba'), rota = C.caminho(C.achar(de[0], de[1], 2), 5000).pts.map(xy), [bx, by] = rota[20];
  let achou = 0;
  for (const [dx, dy] of [[5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, -4]]) {
    const x = bx + dx, y = by + dy, k = y * W + x; if (!C.visto(k) || !G.anda(k)) continue;
    achou++; const s = seta(C, x * T + 8, y * T + 8);
    if (!ok(!!s, `desvio ${dx},${dy}: sem caminho de volta`)) continue;
    ok(s.dist <= C.dist[by * W + bx] + 40, `desvio ${dx},${dy}: o caminho de volta é longo demais (${s.dist})`);
    ok(s.cam.pts.every((q, i, a) => !i || Math.abs(xy(q)[0] - xy(a[i - 1])[0]) + Math.abs(xy(q)[1] - xy(a[i - 1])[1]) === 1 || C.dir[a[i - 1]] === 5), 'o caminho do desvio não é contínuo');
  }
  ok(achou > 0, 'nenhum ponto de desvio andável achado');
}
console.log(`Caminhada do guia: ${n} verificações`);
if (erros.length) { console.log(`FALHOU (${erros.length}):`); for (const e of erros.slice(0, 30)) console.log('  x ' + e); process.exitCode = 1; } else console.log('OK');
