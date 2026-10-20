// Teste da história nova (src/story/jornada/): estrutura, ids, flags, elenco, lugares, batalhas e objetivos.
// Rodar da raiz do repositório, sem Chrome:   node tools/teste-jornada.mjs
// Erros reprovam (exit 1). Avisos são de conteúdo (ex.: cena sem objetivo) e não reprovam.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(raiz, p)).href);

const { JORNADA, CENAS, ELENCO_JORNADA } = await abrir('src/story/jornada/index.js');
const { PERSONAGENS } = await abrir('src/story/script/personagens.js');
const { ELENCO } = await abrir('src/story/elenco.js');
const { SPECIES } = await abrir('src/data/species.js');
const { MOVES } = await abrir('src/data/moves.js');
const { ITEMS, itemId } = await abrir('src/data/items.js');
const { BADGES } = await abrir('src/story/names.js');

const erros = [];
const avisos = [];
const erro = (m) => erros.push(m);
const aviso = (m) => avisos.push(m);

// ---------------------------------------------------------------- lugares do mapa (spots, áreas, salas)
// Lê os arquivos de mapa. Um nome vale se for ponto nomeado, área, sala (e seus dentro_/porta_) ou ponto de sala.
const arquivosMapa = ['assets/maps/alvorada.json',
  ...readdirSync(join(raiz, 'assets/maps/regioes')).filter((f) => f.endsWith('.json')).map((f) => 'assets/maps/regioes/' + f),
  'assets/maps/ocaso/leste.json', 'assets/maps/ocaso/oeste.json'];
const lugares = new Set();
for (const arq of arquivosMapa) {
  const M = JSON.parse(readFileSync(join(raiz, arq), 'utf8'));
  for (const k of Object.keys(M.spots ?? {})) lugares.add(k);
  for (const a of M.areas ?? []) lugares.add(a.id);
  for (const r of M.interiors ?? []) {
    lugares.add(r.id); lugares.add('dentro_' + r.id); lugares.add('porta_' + r.id);
    for (const k of Object.keys(r.spots ?? {})) lugares.add(k);
  }
}
// zonas de pisar/entrar podem usar o nome base de um ponto com sufixo (alvo__qualquer); aceita o base
const lugarValido = (nome) => lugares.has(nome) || lugares.has(nome.split('__')[0]);

// ---------------------------------------------------------------- conjuntos de referência
const TIPOS_GATILHO = new Set(['inicio', 'apos', 'entrar', 'pisar', 'falar', 'avistar', 'vencer', 'perder', 'interromper', 'flag']);
const BADGE_IDS = new Set(BADGES.map((b) => b.id));
const MONTARIAS = new Set(['lapras', 'sneasler', 'corviknight', 'mantine', 'mudbray', 'correr', 'nadar', 'escalar', 'voar', 'mergulhar']);
const FLAG_RE = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*(=[^=]+)?$/;
const INSIGNIA_RE = /^insignias\s*(>=|<=|==|>|<)\s*\d+$/;
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const VERBO_RE = /(?<!\p{L})(Vá|Volte|Siga|Suba|Desça|Entre|Procure|Enfrente|Vença|Desafie|Pegue|Leve|Atravesse|Passe|Veja|Espere|Fale|Chegue|Acenda|Avise|Recupere|Descoberta|Encontre|Saia|Fique|Descubra|Explore|Vá)(?!\p{L})/u;

const ids = new Map(); // id de cena -> segmento
const batalhas = new Set();
const battleIdsDoc = [];
for (const seg of JORNADA) {
  for (const s of seg.cenas) {
    if (ids.has(s.id)) erro(`cena com id repetido: ${s.id} (em ${ids.get(s.id)} e ${seg.id})`);
    ids.set(s.id, seg.id);
    const b = s.depois?.batalha; if (b) { battleIdsDoc.push(b.id); batalhas.add(b.id); }
  }
}
const repetidas = battleIdsDoc.filter((x, i) => battleIdsDoc.indexOf(x) !== i);
for (const r of new Set(repetidas)) erro(`batalha com id repetido: ${r}`);
const elencoIds = new Set([...ELENCO.map((e) => e.id), ...ELENCO_JORNADA.map((e) => e.id)]);

// ---------------------------------------------------------------- validações de condição (requer / semFlag)
function checarCond(lista, onde) {
  for (const x of lista ?? []) {
    if (INSIGNIA_RE.test(x)) continue;
    if (!FLAG_RE.test(x)) { erro(`${onde}: flag mal formada "${x}"`); continue; }
    if (x.startsWith('badges.') && !BADGE_IDS.has(x.slice(7))) erro(`${onde}: insígnia desconhecida "${x}"`);
    if (x.startsWith('trainers.') && !batalhas.has(x.slice(9)) && !elencoIds.has(x.slice(9)))
      erro(`${onde}: treinador sem batalha no roteiro "${x}"`);
  }
}
function checarFlagsSet(obj, onde) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (!FLAG_RE.test(k)) erro(`${onde}: chave de flag mal formada "${k}"`);
    if (!['boolean', 'string', 'number'].includes(typeof v) && v !== null) erro(`${onde}: valor de flag inválido em ${k}`);
  }
}

// ---------------------------------------------------------------- por cena
const ITEM_OK = (k) => !!(ITEMS[k] || ITEMS[itemId(k)]);
function checarEquipe(equipe, onde) {
  for (const linha of equipe ?? []) {
    const [dex, lv, golpes, opts] = linha;
    if (typeof dex === 'string') { if (!/^rival:\d+$/.test(dex)) erro(`${onde}: espécie inválida "${dex}"`); }
    else if (!SPECIES[dex]) erro(`${onde}: espécie inexistente #${dex}`);
    if (typeof lv !== 'number' || lv < 1 || lv > 100) erro(`${onde}: nível inválido ${lv}`);
    for (const g of golpes ?? []) if (!MOVES[g]) erro(`${onde}: golpe inexistente "${g}" (espécie ${dex})`);
    if (opts?.forma && SPECIES[dex] && !SPECIES[dex].forms?.[opts.forma]) aviso(`${onde}: forma "${opts.forma}" não achada em #${dex}`);
    if (opts?.item && !ITEM_OK(opts.item)) erro(`${onde}: item de batalha inexistente "${opts.item}"`);
  }
}

const cenasComObjetivoSemTexto = [];
let totalFalas = 0;
for (const seg of JORNADA) {
  const onde0 = `${seg.id}`;
  if (!seg.id || !seg.jornada || !seg.titulo || !Array.isArray(seg.cenas) || !seg.cenas.length) erro(`${onde0}: segmento sem id, jornada, título ou cenas`);
  const primeira = seg.cenas[0];
  if (primeira && !['entrar', 'flag', 'pisar', 'inicio'].includes(primeira.gatilho?.tipo))
    erro(`${onde0}: a primeira cena deve abrir a cidade (entrar, pisar ou flag), não ${primeira.gatilho?.tipo}`);
  for (const s of seg.cenas) {
    const onde = `${s.id}`;
    if (!/^(j\d\d|pj)_[a-z0-9_]+$/.test(s.id)) erro(`${onde}: id de cena fora do padrão jNN_nome`);
    const gt = s.gatilho ?? {};
    if (!TIPOS_GATILHO.has(gt.tipo)) { erro(`${onde}: gatilho desconhecido "${gt.tipo}"`); continue; }
    // alvo obrigatório, conforme o tipo
    if (['entrar', 'pisar'].includes(gt.tipo)) {
      if (!gt.alvo) erro(`${onde}: gatilho ${gt.tipo} sem alvo`);
      else if (!lugarValido(gt.alvo)) erro(`${onde}: lugar desconhecido no mapa "${gt.alvo}" (gatilho ${gt.tipo})`);
    }
    if (gt.tipo === 'falar' && !PERSONAGENS[gt.alvo]) erro(`${onde}: personagem desconhecido em "falar": ${gt.alvo}`);
    if (gt.tipo === 'avistar') {
      const e = [...ELENCO, ...ELENCO_JORNADA].find((x) => x.id === gt.alvo);
      if (!e) erro(`${onde}: treinador desconhecido em "avistar": ${gt.alvo}`);
      else if (!e.visao) erro(`${onde}: "avistar" em ${gt.alvo}, mas o elenco não tem visão (campo visao)`);
    }
    if (['vencer', 'perder', 'interromper'].includes(gt.tipo) && !batalhas.has(gt.alvo))
      erro(`${onde}: "${gt.tipo}" em batalha que não existe no roteiro: ${gt.alvo}`);
    if (gt.tipo === 'apos' && !ids.has(gt.cena)) erro(`${onde}: "apos" de cena inexistente: ${gt.cena}`);
    if (gt.tipo === 'flag' && !FLAG_RE.test(gt.alvo ?? '')) erro(`${onde}: flag mal formada no gatilho "${gt.alvo}"`);
    if (gt.hora && !['dia', 'noite'].includes(gt.hora)) erro(`${onde}: hora inválida "${gt.hora}"`);
    checarCond(gt.requer, `${onde} (gatilho.requer)`);
    checarCond(gt.semFlag, `${onde} (gatilho.semFlag)`);
    checarCond(s.requer, `${onde} (requer)`);

    // falas: personagem conhecido, texto sem emoji, tamanho de caixa
    for (const f of s.falas ?? []) {
      const [quem, texto, cond] = f;
      if (!PERSONAGENS[quem]) erro(`${onde}: personagem de fala desconhecido "${quem}"`);
      if (typeof texto !== 'string' || !texto.trim()) erro(`${onde}: fala vazia de ${quem}`);
      else {
        totalFalas++;
        if (EMOJI_RE.test(texto)) erro(`${onde}: emoji na fala de ${quem}`);
        if (texto.length > 260) aviso(`${onde}: fala longa de ${quem} (${texto.length} caracteres)`);
      }
      if (cond) { checarCond(cond.requer, `${onde} (fala)`); checarCond(cond.semFlag, `${onde} (fala)`); }
    }
    // caixas = grupos de falas seguidas do mesmo personagem (é assim que o motor as mostra)
    const caixas = (s.falas ?? []).reduce((n, f, i, arr) => n + (i === 0 || arr[i - 1][0] !== f[0] ? 1 : 0), 0);
    const limite = s.reviravolta ? 10 : 8; // reviravoltas podem ter mais caixas (é a cena que explica tudo)
    if (caixas > limite) aviso(`${onde}: ${caixas} caixas de fala (o combinado é de 3 a 8)`);
    if (caixas === 1 && !s.depois?.objetivo) aviso(`${onde}: cena de uma caixa só (ok se for treinador que avista o jogador)`);

    // depois: batalha, flags, itens, insígnia, montaria, mt, objetivo
    const d = s.depois ?? {};
    checarFlagsSet(d.flags, `${onde} (flags)`);
    if (d.batalha) {
      checarEquipe(d.batalha.equipe, `${onde} (batalha ${d.batalha.id})`);
      if (d.batalha.aliado && !d.batalha.dupla && !Array.isArray(d.batalha.aliado) && !d.batalha.aliado.nome)
        erro(`${onde}: aliado mal formado na batalha ${d.batalha.id}`);
      if (d.batalha.perder && !['repete', 'continua', 'centro'].includes(d.batalha.perder)) erro(`${onde}: valor de perder inválido`);
    }
    for (const [item, n] of d.itens ?? []) {
      if (!ITEM_OK(item)) erro(`${onde}: item inexistente "${item}"`);
      if (!(n >= 1)) erro(`${onde}: quantidade inválida de ${item}`);
    }
    if (d.insignia && !BADGE_IDS.has(d.insignia)) erro(`${onde}: insígnia inexistente "${d.insignia}"`);
    if (d.montaria && !MONTARIAS.has(d.montaria)) erro(`${onde}: montaria desconhecida "${d.montaria}"`);
    if (d.mt && !MOVES[d.mt]) erro(`${onde}: MT com golpe inexistente "${d.mt}"`);

    // objetivo do painel: texto concreto e lugar real
    const o = d.objetivo;
    if (o) {
      if (typeof o.texto !== 'string' || !o.texto.trim()) erro(`${onde}: objetivo sem texto`);
      else {
        if (o.texto.length > 190) aviso(`${onde}: objetivo longo (${o.texto.length} caracteres)`);
        if (!VERBO_RE.test(o.texto)) aviso(`${onde}: objetivo sem verbo de ação: "${o.texto.slice(0, 60)}"`);
      }
      if (!o.alvo) erro(`${onde}: objetivo sem alvo (lugar)`);
      else if (!lugarValido(o.alvo) && !elencoIds.has(o.alvo)) erro(`${onde}: alvo do objetivo desconhecido "${o.alvo}"`);
      for (const t of o.treinadores ?? []) if (!batalhas.has(t) && !elencoIds.has(t)) erro(`${onde}: treinador do objetivo desconhecido "${t}"`);
      if (s.reviravolta && !/^Descoberta: /.test(o.texto ?? '')) erro(`${onde}: reviravolta sem resumo "Descoberta: ..." no objetivo`);
    } else if (!d.ambiente && !d.fimJornada && !s.secundaria && !d.batalha && !s.reviravolta) {
      cenasComObjetivoSemTexto.push(onde);
    }
    if (s.secundaria) {
      if (!s.secundaria.texto) erro(`${onde}: missão secundária sem texto`);
      if (!lugarValido(s.secundaria.alvo ?? '') && !elencoIds.has(s.secundaria.alvo ?? '')) erro(`${onde}: alvo da missão secundária desconhecido "${s.secundaria.alvo}"`);
      if (d.objetivo) erro(`${onde}: missão secundária não pode mexer no painel principal (use só secundaria)`);
    }
    if (d.fimJornada && !d.objetivo) aviso(`${onde}: fim de jornada sem objetivo para o pós-jogo`);
  }
}
if (cenasComObjetivoSemTexto.length) aviso(`cenas sem objetivo próprio (passo intermediário; a próxima cena leva ao objetivo): ${cenasComObjetivoSemTexto.join(', ')}`);

// ---------------------------------------------------------------- reviravoltas: uma por número, cada uma com cena própria
const reviravoltas = CENAS.filter((s) => s.reviravolta).map((s) => [s.reviravolta, s.id]).sort((a, b) => a[0] - b[0]);
const nums = reviravoltas.map((x) => x[0]);
for (let n = 1; n <= 7; n++) if (!nums.includes(n)) erro(`falta a cena da reviravolta ${n}`);
if (nums.length !== 7) erro(`reviravoltas: ${nums.length} marcadas, o esperado são 7`);
const repeteRev = nums.filter((x, i) => nums.indexOf(x) !== i);
if (repeteRev.length) erro(`reviravolta repetida: ${repeteRev.join(',')}`);

// ---------------------------------------------------------------- boletins da Mãe: o sol atrasa até o 8º e volta no Relógio
const boletins = CENAS.filter((s) => s.id.includes('boletim') && s.falas?.some(([q]) => q === 'radio'));
const horas = [];
for (const s of boletins) {
  const sol = s.depois?.flags?.['nh.sol'];
  if (!sol) erro(`${s.id}: boletim sem o horário do sol (flag nh.sol)`);
  else horas.push(sol);
}
const mins = (h) => { const [a, b] = h.split('h').map(Number); return a * 60 + b; };
const ate8 = horas.filter((h) => mins(h) > 6 * 60 + 4 || true).slice(0, 9); // ordem dos boletins
for (let i = 1; i < 8; i++) {
  if (ate8[i] && ate8[i - 1] && !(mins(ate8[i]) > mins(ate8[i - 1]))) erro(`boletim ${i + 1}: o sol não atrasou em relação a ${ate8[i - 1]} (está ${ate8[i]})`);
}
const finalSol = horas.at(-1);
if (finalSol && mins(finalSol) >= mins('7h00')) erro('o último boletim deve trazer o sol de volta ao horário normal (depois do Relógio)');

// ---------------------------------------------------------------- elenco da jornada
for (const e of ELENCO_JORNADA) {
  if (!PERSONAGENS[e.quem]) erro(`ator ${e.id}: personagem desconhecido "${e.quem}"`);
  if (e.spot && !lugarValido(e.spot)) erro(`ator ${e.id}: ponto do mapa desconhecido "${e.spot}"`);
  if (e.cena) for (const c of e.cena) if (!ids.has(c)) erro(`ator ${e.id}: cena inexistente "${c}"`);
  if (e.pokemon && !SPECIES[e.pokemon]) erro(`ator ${e.id}: espécie inexistente #${e.pokemon}`);
}
const idsElenco = ELENCO_JORNADA.map((e) => e.id);
for (const id of new Set(idsElenco.filter((x, i) => idsElenco.indexOf(x) !== i))) erro(`ator repetido no elenco: ${id}`);
const colisao = ELENCO.filter((e) => ELENCO_JORNADA.some((j) => j.id === e.id)).map((e) => e.id);
if (colisao.length) erro(`ids do elenco que já existem no elenco antigo: ${colisao.join(', ')}`);

// ---------------------------------------------------------------- lugares que ainda faltam no mapa (pendências do solidos)
// Pontos do mapa que a história pede e que ainda não existem em assets/maps (a cargo do agente 'solidos').
// O teste aceita só estes; qualquer outro nome desconhecido reprova.
const PENDENTES = new Set(['relogio_pedra']);
const faltam = [...new Set(erros.filter((m) => /lugar desconhecido|ponto do mapa desconhecido|alvo do objetivo desconhecido|alvo da missão secundária desconhecido/.test(m)))];
const pendentesEncontrados = [];
const errosReais = [];
for (const m of erros) {
  const nome = (m.match(/"([^"]+)"/) ?? [])[1];
  if (/lugar desconhecido|ponto do mapa desconhecido|alvo do objetivo desconhecido|alvo da missão secundária desconhecido/.test(m) && nome && PENDENTES.has(nome)) pendentesEncontrados.push(nome);
  else errosReais.push(m);
}
void faltam;

// ---------------------------------------------------------------- relatório
const totalCenas = CENAS.length;
console.log(`História nova: ${JORNADA.length} segmentos, ${totalCenas} cenas, ${totalFalas} falas, ${ELENCO_JORNADA.length} atores, ${batalhas.size} batalhas.`);
console.log(`Reviravoltas: ${reviravoltas.map(([n, id]) => `${n}=${id}`).join(' · ')}`);
console.log(`Boletins do sol: ${horas.join(' → ')}`);
if (pendentesEncontrados.length) console.log(`Pendências do mapa (solidos) aceitas: ${[...new Set(pendentesEncontrados)].join(', ')}`);
if (avisos.length) { console.log(`\nAvisos (${avisos.length}):`); for (const a of avisos) console.log('  - ' + a); }
if (errosReais.length) { console.log(`\nERROS (${errosReais.length}):`); for (const e of errosReais) console.log('  x ' + e); process.exitCode = 1; }
else console.log('\nOK: nenhum erro estrutural.');
