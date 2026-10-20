// Teste de ponta a ponta da jornada clássica (docs/jornada-classica.md), sem navegador.
// Simula as flags passo a passo, do jogo novo até a Liga, com as montarias que cada insígnia libera, e faz busca em
// largura no mapa de verdade (regiões, camada vestir, barreiras da progressão, tempestade, neblina, portas, barcos,
// portais dos enigmas e o voo: tools/alcance.mjs). Em cada passo confere:
//   1. o próximo lugar do objetivo (e tudo o que o passo pede) é alcançável;
//   2. o lugar do passo seguinte NÃO é alcançável antes da barreira dele;
//   3. o ponto de cada líder, Elite e batalha da história daquele trecho é alcançável;
//   4. o painel (src/story/progressao.js: proximoPasso) aponta para o passo certo.
// Rodar da raiz do repositório:  node tools/teste-jornada-completa.mjs
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(RAIZ, p)).href);
const t0 = Date.now();
const { montarAlcance, buscar, lugar } = await abrir('tools/alcance.mjs');
const { proximoPasso } = await abrir('src/story/progressao.js');
const { JORNADA } = await abrir('src/story/jornada/index.js');
const { ELENCO_ATIVO } = await abrir('src/story/elenco-ativo.js');
const { CENAS_MANTIDAS } = await abrir('src/story/script/mantidas.js');

const A = await montarAlcance('alvorada');
const erros = [], notas = [];
let n = 0;
const ok = (c, m) => { n++; if (!c) erros.push(m); };

// os passos (estado ao COMEÇAR cada um) e as flags de cada um: tools/jornada-passos.mjs
const { PASSOS, flagsDe } = await abrir('tools/jornada-passos.mjs');

// lugar de uma cena da história: o do gatilho (entrar/pisar), o do ator (falar/avistar) ou o campo "local"
const porQuem = new Map(); for (const e of ELENCO_ATIVO) { if (e.spot && !e.cena) { if (!porQuem.has(e.quem)) porQuem.set(e.quem, []); porQuem.get(e.quem).push(e.spot); } }
const porId = new Map(ELENCO_ATIVO.map((e) => [e.id, e]));
function lugaresDaCena(s) {
  const g = s.gatilho ?? {};
  if (g.tipo === 'entrar' || g.tipo === 'pisar') return [].concat(g.alvo);
  if (g.tipo === 'avistar') { const e = porId.get(g.alvo); return e?.spot ? [e.spot] : []; }
  if (g.tipo === 'falar') { const l = porQuem.get(g.alvo); return l?.length ? [l] : s.local ? [s.local] : []; }
  return s.local ? [s.local] : [];
}

// ---------------------------------------------------------------- roda os passos
const tabela = [];
const PERSONAGENS_SEM_LUGAR = new Set(['mae', 'radio', 'prof', 'pokedex', 'bia', 'narrador', 'jogador', 'zelia']); // falam por rádio/telefone
for (let i = 0; i < PASSOS.length; i++) {
  const P = PASSOS[i], f = flagsDe(P);
  const B = buscar(A, f, P.caps, A.spots.inicio);
  const linha = { passo: P.id, alvos: 0, proibidos: 0, cenas: 0 };
  // 4. o painel
  const p = proximoPasso(f);
  ok(p?.key === P.painel, `[${P.id}] o painel deveria apontar para "${P.painel}", aponta para "${p?.key ?? 'nada'}"`);
  // 1. alvos
  for (const nome of P.alvos) {
    const L = lugar(A, nome);
    if (!L) { erros.push(`[${P.id}] lugar desconhecido no mapa: ${nome}`); continue; }
    const r = L.testa(B); ok(r, `[${P.id}] não alcança ${nome} (${L.tipo} em ${L.x},${L.y})`); if (r) linha.alvos++;
  }
  // 2. proibidos (o próximo trecho)
  for (const nome of P.proibidos) {
    const L = lugar(A, nome);
    if (!L) { erros.push(`[${P.id}] lugar proibido desconhecido no mapa: ${nome}`); continue; }
    const r = L.testa(B);
    if (r) { const c = B.caminho(L.x, L.y, 2); const marcos = c.filter((q, k) => k % 25 === 0).map((q) => q.join(',')).join(' → '); erros.push(`[${P.id}] ${nome} já é alcançável antes da hora (${L.tipo} em ${L.x},${L.y}); caminho: ${marcos}`); }
    else linha.proibidos++;
    n++;
  }
  // 3. cenas da história deste trecho: o lugar de cada batalha e de cada cena de lugar
  for (const sid of P.segs) {
    const seg = JORNADA.find((s) => s.id === sid); if (!seg) { erros.push(`[${P.id}] segmento ${sid} não existe`); continue; }
    for (const s of seg.cenas) {
      if (s.secundaria) continue;
      const ls = lugaresDaCena(s);
      if (!ls.length) { if (s.depois?.batalha && !['apos', 'vencer', 'perder', 'flag'].includes(s.gatilho?.tipo) && !PERSONAGENS_SEM_LUGAR.has(s.gatilho?.alvo)) erros.push(`[${P.id}] cena ${s.id}: batalha sem lugar conhecido`); continue; }
      for (const l of ls) {
        const opcoes = [].concat(l);
        const achou = opcoes.some((nome) => { const L = lugar(A, nome); return L && L.testa(B); });
        const conhecidos = opcoes.filter((nome) => lugar(A, nome));
        if (!conhecidos.length) { erros.push(`[${P.id}] cena ${s.id}: lugar desconhecido ${opcoes.join('/')}`); continue; }
        ok(achou, `[${P.id}] cena ${s.id}${s.depois?.batalha ? ` (batalha ${s.depois.batalha.id})` : ''}: lugar ${opcoes.join('/')} não alcançável`);
        if (achou) linha.cenas++;
      }
    }
  }
  tabela.push(linha);
}
// as cenas mantidas dos capítulos antigos (treinadores de rota, portões dos ginásios): cada treinador tem lugar alcançável
// no fim da jornada (todas as montarias e flags)
{
  const P = PASSOS.at(-1), f = { ...flagsDe(P), liga_campeao: true };
  const B = buscar(A, f, P.caps, A.spots.inicio);
  let k = 0;
  for (const s of CENAS_MANTIDAS) {
    if (s.gatilho?.tipo !== 'avistar') continue;
    const e = porId.get(s.gatilho.alvo);
    if (!e?.spot) { erros.push(`cena mantida ${s.id}: treinador ${s.gatilho.alvo} sem ponto no mapa`); continue; }
    const L = lugar(A, e.spot); if (!L) { erros.push(`cena mantida ${s.id}: ponto ${e.spot} não existe`); continue; }
    ok(L.testa(B), `cena mantida ${s.id}: treinador ${e.id} em ${e.spot} (${L.x},${L.y}) não alcançável nem no fim do jogo`); k++;
  }
  notas.push(`${k} treinadores das cenas mantidas conferidos no fim da jornada`);
}

// pós-jogo (Liga vencida, todas as montarias): o Mar do Sul e as entradas de mergulho das masmorras austrais
{
  const P = PASSOS.at(-1), f = { ...flagsDe(P), liga_campeao: true, nh: { ...P.nh, epilogo: true, pjNeblina: true } };
  const B = buscar(A, f, P.caps, A.spots.inicio);
  for (const nome of ['ilha_farol_morto', 'estacao_austral', 'mares_entrada', 'recife_entrada', 'fossa_entrada']) {
    const L = lugar(A, nome); if (!L) { erros.push(`pós-jogo: lugar desconhecido ${nome}`); continue; }
    ok(L.testa(B), `pós-jogo: ${nome} (${L.tipo} em ${L.x},${L.y}) não alcançável depois da Liga`);
  }
  notas.push('pós-jogo: Mar do Sul, Farol Morto e as três entradas de mergulho alcançáveis depois da Liga');
}

console.log(`Jornada completa: ${PASSOS.length} passos, ${n} verificações, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
for (const l of tabela) console.log(`  ${l.passo.padEnd(10)} alvos ${l.alvos}  bloqueados ${l.proibidos}  lugares de cena ${l.cenas}`);
for (const x of notas) console.log('  ' + x);
if (erros.length) { console.log(`\nFALHOU (${erros.length}):`); for (const e of erros) console.log('  x ' + e); process.exitCode = 1; }
else console.log('\nOK: a jornada inteira é jogável na ordem, sem atalhos.');
