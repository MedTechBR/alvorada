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

// ---------------------------------------------------------------- os passos (estado ao COMEÇAR cada um)
// f: flags do save; caps: montarias liberadas; alvos: o que o passo precisa alcançar; proibidos: o que só abre depois;
// segs: segmentos da história (src/story/jornada) cujas cenas acontecem neste passo; painel: chave esperada em proximoPasso
const B8 = ['campina', 'sussurro', 'espelho', 'coral', 'lamparina', 'rochedo', 'escarpa', 'mirante'];
const PASSOS = [
  { id: 'campina', badges: 0, nh: {}, caps: { correr: true }, segs: ['nova00', 'nova01'], painel: 'campina',
    alvos: ['leader_tome', 'g1_icaro', 'g1_rui', 'fazenda_tome', 'r1_caio', 'r1_davi', 'r1_pedro', 'centro_campina'],
    proibidos: ['vila_sussurro', 'estufa_lia', 'toca_absol'] },
  { id: 'sussurro', badges: 1, nh: {}, caps: { correr: true }, segs: ['nova02'], painel: 'sussurro',
    alvos: ['vila_sussurro', 'estufa_lia', 'toca_absol', 'trilha_jequitiba', 'bifurcacao', 'mata_jequitibas', 'r2_marcia', 'r2_otavio'],
    proibidos: ['porto_espelho', 'galpao_barcos'] },
  { id: 'espelho', badges: 2, nh: {}, caps: { correr: true }, segs: ['nova03'], painel: 'espelho',
    alvos: ['porto_espelho', 'galpao_barcos', 'jandira', 'manguezal', 'r3_seu_bigode', 'r3_carol'],
    proibidos: ['cidade_coral', 'farol_coral', 'vila_lamparina'] },
  { id: 'coral', badges: 3, nh: {}, caps: { correr: true, nadar: true }, segs: ['nova04'], painel: 'coral',
    alvos: ['cidade_coral', 'praca_coral', 'farol_coral', 'farol_topo', 'cais_coral', 'r4_kaua', 'r4_sandra'],
    proibidos: ['vila_jandaia', 'templo_raizes_1', 'vila_lamparina', 'casarao_velas'] },
  { id: 'jandaias', badges: 4, nh: {}, caps: { correr: true, nadar: true }, segs: ['nova05'], painel: 'jandaias',
    alvos: ['vila_jandaia', 'templo_raizes_porta', 'templo_raizes_1', 'selva_grande', 'ninho_acampamento_selva'],
    proibidos: ['vila_lamparina', 'casarao_velas', 'cemiterio_velas'] },
  { id: 'lamparina', badges: 4, nh: { teoDuvida: true }, caps: { correr: true, nadar: true }, segs: ['nova06'], painel: 'lamparina',
    alvos: ['vila_lamparina', 'casarao_velas', 'cemiterio_velas', 'benta', 'r5_ofelia', 'r5_guto', 'cemiterio_porta'],
    proibidos: ['cidade_aurora', 'rota6', 'torre_aurora', 'r6_wagner'] },
  { id: 'aurora', badges: 5, nh: { teoDuvida: true }, caps: { correr: true, nadar: true }, segs: [], painel: 'rochedo',
    alvos: ['cidade_aurora', 'torre_aurora', 'r6_wagner', 'r6_yara', 'pipa_aurora', 'aurora_praca'],
    proibidos: ['forte_rochedo', 'roda_capoeira', 'vila_mandacaru', 'cidade_escarpa'] },
  { id: 'mina', badges: 5, nh: { teoDuvida: true, lucioVencido: true, sirene: true }, minaN2: true, caps: { correr: true, nadar: true }, segs: [], painel: 'rochedo',
    alvos: ['mina_aurora_n1', 'mina_aurora_n2', 'mina_aurora_n3', 'mina_aurora_n4'],
    proibidos: ['forte_rochedo', 'roda_capoeira', 'vila_mandacaru'] },
  { id: 'rochedo', badges: 5, nh: { teoDuvida: true, lucioVencido: true, reviravolta1: true }, caps: { correr: true, nadar: true }, segs: ['nova07'], painel: 'rochedo',
    alvos: ['forte_rochedo', 'arquivo_forte', 'roda_capoeira', 'r7_jairo', 'r7_soraia', 'r7_b', 'r7_g'],
    proibidos: ['vila_mandacaru', 'cidade_escarpa', 'mina_velha'] },
  { id: 'sertao', badges: 6, nh: { teoDuvida: true, lucioVencido: true, reviravolta1: true, reviravolta2: true }, caps: { correr: true, nadar: true, escalar: true }, segs: ['nova08'], painel: 'sertao',
    alvos: ['vila_mandacaru', 'sertao_praca_mandacaru', 'sertao_ruinas_entrada', 'ruinas_pintada_1', 'ruinas_pintada_2', 'museu_sertao'],
    proibidos: ['cidade_escarpa', 'mina_velha', 'leader_graca', 'r8_ricardo'] },
  { id: 'escarpa', badges: 6, nh: { teoDuvida: true, lucioVencido: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true }, caps: { correr: true, nadar: true, escalar: true }, segs: ['nova09'], painel: 'escarpa',
    alvos: ['paredao_base', 'r8_ricardo', 'r8_lena', 'cidade_escarpa', 'mina_velha', 'cova_paredao'],
    proibidos: ['vila_termas', 'ilha_basalto', 'templo_chama_1', 'mirante_ventos', 'torre_vento'] },
  { id: 'brasas', badges: 7, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true }, caps: { correr: true, nadar: true, escalar: true, voar: true }, segs: ['nova10'], painel: 'brasas',
    alvos: ['vila_termas', 'ilha_basalto', 'vulcao_ticao', 'templo_chama_1', 'casa_vulcanologa'],
    proibidos: ['mirante_ventos', 'torre_vento', 'relogio_pedra', 'camara_coracao'] },
  { id: 'mirante', badges: 7, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true }, brasas: true, caps: { correr: true, nadar: true, escalar: true, voar: true }, segs: ['nova11'], painel: 'mirante',
    alvos: ['mirante_ventos', 'torre_vento', 'r9_a', 'r9_b', 'r11_a', 'ruinas_vigias', 'estepe_inicio'],
    proibidos: ['relogio_pedra', 'camara_coracao', 'vila_geada', 'portao_liga'] },
  { id: 'relogio', badges: 8, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true, reviravolta5: true }, brasas: true, caps: { correr: true, nadar: true, escalar: true, voar: true, mergulhar: true }, segs: ['nova12'], painel: 'relogio',
    alvos: ['relogio_pedra', 'camara_coracao', 'vig1', 'vig2', 'escadaria_base'],
    proibidos: ['vila_geada', 'geada_entrada_oeste', 'caverna_gelo_1', 'portao_liga'] },
  { id: 'geada', badges: 8, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true, reviravolta5: true, seloFechado: true }, brasas: true, relogio: true, caps: { correr: true, nadar: true, escalar: true, voar: true, mergulhar: true }, segs: ['nova13'], painel: 'geada',
    alvos: ['geada_entrada_oeste', 'ninho_vila_geada', 'caverna_gelo_1', 'caverna_gelo_3', 'cume_vento_branco', 'ninho_cume'],
    proibidos: ['portao_liga', 'sala_madrugada', 'salao_campea', 'ninho_liga_zenite'] },
  { id: 'liga', badges: 8, nh: { teoDuvida: true, reviravolta1: true, reviravolta2: true, sina: true, mapaParedao: true, tempestadeFim: true, reviravolta5: true, seloFechado: true, teoFinalPronto: true }, brasas: true, relogio: true, geada: true, caps: { correr: true, nadar: true, escalar: true, voar: true, mergulhar: true }, segs: ['nova14'], painel: 'liga',
    alvos: ['zenite_entrada', 'r12_sonia', 'r12_osvaldo', 'portao_liga', 'sala_madrugada', 'sala_manha', 'sala_meio_dia', 'sala_entardecer', 'salao_campea'],
    proibidos: ['ilha_farol_morto', 'estacao_austral', 'mar_do_sul'] },
];

// treinadores já vencidos ao fim de cada passo: os das batalhas dos segmentos até ele (inclusive), os de Campina
// (src/story/chapter1.js) e os das cenas mantidas da rota; abrem as porteiras e os portões dos ginásios
const { GYM_TRAINERS, ROUTE_TRAINERS } = await abrir('src/story/chapter1.js');
const batalhasAte = (i) => {
  const ids = [...GYM_TRAINERS, ...ROUTE_TRAINERS].map((t) => t.id);
  for (const P of PASSOS.slice(0, i + 1)) for (const sid of P.segs) for (const c of JORNADA.find((s) => s.id === sid)?.cenas ?? []) if (c.depois?.batalha) ids.push(c.depois.batalha.id);
  return Object.fromEntries(ids.map((id) => [id, true]));
};
const flagsDe = (P, i = PASSOS.indexOf(P)) => {
  const f = { balls: true, starter: 4, badges: B8.slice(0, P.badges), nh: { ...P.nh }, trainers: batalhasAte(i) };
  if (P.minaN2 || i > PASSOS.findIndex((q) => q.id === 'mina')) f.minaN2 = true;
  if (P.brasas) f.brasas_resolvido = true;
  if (P.relogio) f.relogio_vencido = true;
  if (P.geada) f.geada_vencida = true;
  if (P.liga) f.liga_campeao = true;
  return f;
};

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
