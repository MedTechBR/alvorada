// Auditoria dos falantes das cenas: para CADA fala de cada cena (src/story/jornada/*.js e src/story/script/mantidas.js),
// confere se quem fala está na tela quando fala. Rodar da raiz:   node tools/auditar-falantes.mjs   (-v lista tudo)
// Categorias de cada (cena, falante):
//   exceção   narrador, jogador, rádio, Pokédex, o Pokémon do jogador ('inicial'): falam sem corpo no mapa
//   voz       cena declara `telefone: [quem]` (ligação, rádio) ou `fora: [quem]` (voz fora de cena): ninguém na tela de propósito
//   declarado a cena traz o ator em `atores` (o motor o põe de 2 a 5 blocos do jogador, de frente para ele)
//   genérico  'treinador'/'aprendiz'/'vigilante': o motor usa quem puxou a cena (avistar, falar, luta) ou o ator declarado
//   fixo      morador do elenco fixo (sem `cena`) com spot no MESMO lugar da cena (sala ou até 16 blocos no mapa aberto)
//   FALTA     nada acima: o motor ainda invocaria alguém com esse papel (roteiro.js #garantir), mas a cena não diz quem
// Sai com erro (1) se houver FALTA.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const abrir = (p) => import(pathToFileURL(join(raiz, p)).href);
const { JORNADA } = await abrir('src/story/jornada/index.js');
const MANTIDAS = (await abrir('src/story/script/mantidas.js')).default;
const { ELENCO_ATIVO } = await abrir('src/story/elenco-ativo.js');
const { PERSONAGENS } = await abrir('src/story/script/personagens.js');
const verbose = process.argv.includes('-v');

const SEM_CORPO = new Set(['narrador', 'jogador', 'radio', 'pokedex', 'inicial']);
// moradores que o story.js põe no mapa (fora do elenco do roteiro): papel -> ponto onde ficam
const NPC_ANTIGO = { mae: 'mom', prof: 'lab', teo: 'rival', tome: 'leader_tome' };
const GENERICOS = new Set(['treinador', 'aprendiz', 'vigilante']);

// ---- onde fica cada ponto nomeado: sala (id do interior) ou mundo + bloco
const lugarDe = new Map(); // nome -> { sala, x, y }
const arqs = ['assets/maps/alvorada.json', 'assets/maps/esboco.json', ...readdirSync(join(raiz, 'assets/maps/regioes')).filter((f) => f.endsWith('.json')).map((f) => 'assets/maps/regioes/' + f), 'assets/maps/ocaso/leste.json', 'assets/maps/ocaso/oeste.json'];
const salas = new Set();
for (const a of arqs) {
  const M = JSON.parse(readFileSync(join(raiz, a), 'utf8'));
  for (const [k, v] of Object.entries(M.spots ?? {})) lugarDe.set(k, { sala: 'mundo', x: v[0], y: v[1] });
  for (const o of M.objects ?? []) if (o.predio) { salas.add(o.predio); lugarDe.set('dentro_' + o.predio, { sala: o.predio }); lugarDe.set('porta_' + o.predio, { sala: 'mundo', x: o.x, y: o.y }); }
  for (const r of M.interiors ?? []) {
    salas.add(r.id); lugarDe.set('dentro_' + r.id, { sala: r.id }); lugarDe.set('porta_' + r.id, { sala: 'mundo' });
    for (const [k, v] of Object.entries(r.spots ?? {})) lugarDe.set(k, { sala: r.id, x: v[0], y: v[1] });
  }
}
const lugar = (nome) => {
  if (!nome) return null;
  if (salas.has(nome)) return { sala: nome };
  return lugarDe.get(nome) ?? lugarDe.get(String(nome).split('__')[0]) ?? null;
};
const mesmoLugar = (a, b) => {
  if (!a || !b) return false;
  if (a.sala !== b.sala) return false;
  if (a.sala !== 'mundo') return true;
  return a.x == null || b.x == null ? false : Math.hypot(a.x - b.x, a.y - b.y) <= 16;
};

const porId = new Map(ELENCO_ATIVO.map((e) => [e.id, e]));
const cont = { exceção: 0, voz: 0, declarado: 0, genérico: 0, fixo: 0, FALTA: 0 };
const faltas = [];
for (const seg of [...JORNADA, MANTIDAS]) for (const s of seg.cenas) {
  const falas = [...(s.falas ?? []), ...(s.escolhas ?? []).flatMap((e) => e.falas ?? []), ...(s.escolhas ?? []).flatMap((e) => e.depois?.falas ?? [])];
  const falantes = new Set(falas.map((f) => f[0]));
  const gt = s.gatilho ?? {};
  const aqui = lugar(s.local) ?? (['entrar', 'pisar'].includes(gt.tipo) ? lugar([].concat(gt.alvo)[0]) : null)
    ?? (gt.tipo === 'falar' && porId.get(gt.alvo)?.spot ? lugar(porId.get(gt.alvo).spot) : null);
  for (const q of falantes) {
    let cat;
    if (SEM_CORPO.has(q) || PERSONAGENS[q]?.papel === 'narrador') cat = 'exceção';
    else if (s.telefone?.includes(q) || s.fora?.includes(q)) cat = 'voz';
    else if ((s.atores ?? []).some((a) => a.quem === q)) cat = 'declarado';
    else if (GENERICOS.has(q)) {
      const alvo = porId.get(gt.alvo), bid = s.depois?.batalha?.id;
      const veioDe = ['avistar', 'falar', 'vencer', 'perder', 'interromper'].includes(gt.tipo) && (alvo || batalhaConhecida(gt.alvo)) || (bid && porId.get(bid)) || (s.atores ?? []).some((a) => GENERICOS.has(a.quem));
      cat = veioDe ? 'genérico' : 'FALTA';
    } else if (['falar', 'avistar', 'vencer', 'perder', 'interromper'].includes(gt.tipo) && [porId.get(gt.alvo), porId.get(s.depois?.batalha?.id)].some((a) => a?.quem === q)) cat = 'fixo'; // quem puxou a cena (o jogador fala com ele ou ele avistou o jogador)
    else if (NPC_ANTIGO[q] && aqui && mesmoLugar(aqui, lugar(NPC_ANTIGO[q]))) cat = 'fixo'; // moradores do story.js (Mãe, Professor, Téo, Tomé)
    else {
      const fixos = ELENCO_ATIVO.filter((e) => e.quem === q && !e.cena && !e.pokemon);
      cat = aqui && fixos.some((e) => e.spot && mesmoLugar(aqui, lugar(e.spot))) ? 'fixo' : 'FALTA';
    }
    cont[cat]++;
    if (cat === 'FALTA') faltas.push(`${s.id}: ${q} (lugar ${s.local ?? gt.alvo ?? '?'}, gatilho ${gt.tipo})`);
    else if (verbose) console.log(`${cat.padEnd(9)} ${s.id} ${q}`);
  }
}
function batalhaConhecida(id) { return JORNADA.concat([MANTIDAS]).some((seg) => seg.cenas.some((c) => c.depois?.batalha?.id === id)); }
console.log('falantes por categoria:', JSON.stringify(cont));
for (const f of faltas) console.log('FALTA', f);
console.log(faltas.length ? `FALHOU: ${faltas.length} falante(s) sem presença declarada` : 'OK: todo falante tem presença declarada (0 faltando)');
process.exitCode = faltas.length ? 1 : 0;
if (process.argv.includes('-d')) for (const f of faltas) {
  const [, id, q] = /^(\S+): (\S+)/.exec(f);
  const fx = ELENCO_ATIVO.filter((e) => e.quem === q && !e.cena && !e.pokemon).map((e) => `${e.id}@${e.spot ?? '-'}${e.spot ? JSON.stringify(lugar(e.spot)) : ''}`);
  console.log('  ', id, q, '->', fx.join(' ') || '(nenhum fixo)');
}
