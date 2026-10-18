import { MOVES } from '../../data/moves.js';
import { SPECIES } from '../../data/species.js';
import { itemName } from '../../data/items.js';
import { dexMark } from '../../ui/menu.js';

// NPCs vivos: o que cada pessoa faz além das missões. Dados em NPCS (regiao-*.js), por id do NPC:
//   presente  { itens, dinheiro, pokemon, falas, depois, requer }   dá uma vez só e lembra disso
//   diario    { itens | sorteio, falas, jaDeu, requer }            presente de todo dia (frutas)
//   troca     { quer, da, falas: { pede, aceita, recusa, falta, depois }, repetivel }   troca de jogo
//   tutor     { golpes: [{ golpe, dinheiro } | { golpe, item: [id, n] }], falas: { ola, tchau, naoPode, semPagar } }
//   reage     { especie: { dex: falas }, tipo: { tipo: falas }, qualquer: falas }   Pokémon que está fora da bola
//   falas     [{ se: condição, linhas, id? }]   a primeira que vale; sem `se` = fala padrão (no lugar das do mapa)
// Ordem numa conversa: presente → diário → troca → tutor → reação ao Pokémon em campo → falas.

const lista = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const mem = (M, id) => (M.s.npcs[id] ??= {});

// tem algo novo para dizer? (ícone "…" sobre a cabeça)
export function novidadeNpc(M, id, def) {
  const s = mem(M, id);
  if (def.presente && !s.p && M.cond(def.presente.requer)) return true;
  if (def.diario && s.d !== M.hoje() && M.cond(def.diario.requer)) return true;
  if (def.troca && (!s.t || def.troca.repetivel) && M.cond(def.troca.requer) && !s.tv) return true;
  const f = falaAtual(M, def);
  return !!(f && f.se && !s.o?.[f.k]);
}
function falaAtual(M, def) {
  const L = def.falas ?? [];
  for (let i = 0; i < L.length; i++) if (L[i].se && M.cond(L[i].se)) return { ...L[i], k: L[i].id ?? String(i) };
  const d = L.findIndex((x) => !x.se);
  return d >= 0 ? { ...L[d], k: L[d].id ?? String(d) } : null;
}

// devolve a função da conversa, ou null se esta pessoa não tem nada especial agora
export function servicos(M, n, id, def) {
  const s = mem(M, id), g = M.g;
  if (def.presente && !s.p && M.cond(def.presente.requer)) return async () => {
    const p = def.presente;
    await M.say(n, p.falas ?? ['Tome, é para você!']);
    s.p = M.hoje();
    await M.dar(p, n);
    if (p.depois) await M.say(n, p.depois);
  };
  if (def.diario && s.d !== M.hoje() && M.cond(def.diario.requer)) return async () => {
    const d = def.diario;
    await M.say(n, d.falas ?? ['Colhi agora de manhã. Leve!']);
    s.d = M.hoje();
    let itens = d.itens;
    if (d.sorteio) { const k = d.sorteio[Math.floor(Math.random() * d.sorteio.length)]; itens = [k]; }
    await M.dar({ itens }, n);
    if (d.depois) await M.say(n, d.depois);
  };
  if (def.troca && (!s.t || def.troca.repetivel) && M.cond(def.troca.requer)) return () => troca(M, n, id, def.troca);
  if (def.tutor && M.cond(def.tutor.requer)) return () => tutor(M, n, def.tutor);
  if (def.reage && g.lead?.alive) {
    const mon = g.lead.mon, r = def.reage;
    const falas = r.especie?.[mon.dex] ?? mon.types.map((t) => r.tipo?.[t]).find(Boolean) ?? r.qualquer;
    if (falas) return () => M.say(n, falas, { portrait: mon.dex, vars: M.vars({ pokemon: mon.name }) });
  }
  if (def.troca && s.t && def.troca.falas?.depois) {
    // já trocou: fala do Pokémon que foi com você (se não houver outra fala nova)
    const f = falaAtual(M, def);
    if (!f || !f.se || s.o?.[f.k]) return () => M.say(n, def.troca.falas.depois);
  }
  const f = falaAtual(M, def);
  if (f) return async () => { (s.o ??= {})[f.k] = 1; await M.say(n, f.linhas); };
  if (def.troca && s.t) return () => M.say(n, def.troca.falas?.depois ?? ['Como vai o Pokémon que trocamos?']);
  return null;
}

// ---------------- troca de jogo (Pokémon com apelido e de outro treinador original) ----------------
async function troca(M, n, id, t) {
  const g = M.g, s = mem(M, id), F = t.falas ?? {};
  s.tv = 1; // já ouviu a proposta (o "…" some)
  const quer = t.quer ?? {}, nomeQuer = quer.nome ?? (quer.especie != null ? SPECIES[lista(quer.especie)[0]]?.name : 'um Pokémon');
  const da = t.da, nomeDa = da.apelido ?? SPECIES[da.dex]?.name;
  const vars = M.vars({ quer: nomeQuer, da: nomeDa, especie: SPECIES[da.dex]?.name ?? '' });
  const r = await M.say(n, F.pede ?? [`Estou procurando ${nomeQuer}. Troca comigo? Dou o meu ${nomeDa} em troca!`], { choices: ['Trocar', 'Não'], portrait: da.dex, vars });
  if (r !== 0) { await M.say(n, F.recusa ?? ['Que pena… Se mudar de ideia, volte aqui!'], { vars }); return; }
  const ok = g.party.filter((m) => M.combina(quer, m));
  if (!ok.length) { await M.say(n, F.falta ?? [`Você não tem ${nomeQuer} na equipe. Volte quando tiver!`], { vars }); return; }
  let mon = ok[0];
  if (ok.length > 1) {
    const c = await M.say(n, ['Qual deles você vai trocar?'], { choices: [...ok.map((m) => `${m.name} Nv. ${m.level}`), 'Cancelar'], vars });
    if (c == null || c < 0 || c >= ok.length) return;
    mon = ok[c];
  }
  const novo = M.criarPokemon({ ot: n?.name ?? 'Treinador', ...da });
  novo.metLevel = novo.level;
  if (g.lead?.mon === mon) g.recall?.(true);
  const i = g.party.indexOf(mon), cur = g.party[g.leadIdx];
  g.party[i] = novo;
  g.leadIdx = Math.max(0, cur === mon ? i : g.party.indexOf(cur));
  if (mon.item) { g.bag[mon.item] = (g.bag[mon.item] ?? 0) + 1; mon.item = null; } // o item equipado volta para a mochila
  dexMark(g, novo.dex, 2);
  s.t = M.hoje();
  g.audio?.sfx?.('caught');
  g.ui?.partyChanged?.();
  await g.ui.say([`${mon.name} foi para ${n?.name ?? 'o outro treinador'}…`, `…e ${novo.name} chegou! Cuide bem dele!`], { name: '', portrait: novo.dex });
  await M.say(n, F.aceita ?? ['Obrigado! Ele é danado, mas é muito carinhoso.'], { vars: M.vars({ quer: mon.name, da: novo.name }) });
}

// ---------------- tutor de golpe (por dinheiro ou item; tela de aprender golpe do menu) ----------------
async function tutor(M, n, t) {
  const g = M.g, F = t.falas ?? {};
  const preco = (x) => (x.item ? `${x.item[1] > 1 ? x.item[1] + '× ' : ''}${itemName(x.item[0])}` : `₽${(x.dinheiro ?? 0).toLocaleString('pt-BR')}`);
  const golpes = t.golpes.filter((x) => MOVES[x.golpe]);
  const r = await M.say(n, F.ola ?? ['Eu ensino golpes. Quer aprender algum?'], { choices: [...golpes.map((x) => `${MOVES[x.golpe].name} · ${preco(x)}`), 'Não, obrigado'] });
  if (r == null || r < 0 || r >= golpes.length) { await M.say(n, F.tchau ?? ['Volte quando quiser!']); return; }
  const x = golpes[r], mv = MOVES[x.golpe];
  const podePagar = x.item ? (g.bag[x.item[0]] ?? 0) >= x.item[1] : (g.money ?? 0) >= (x.dinheiro ?? 0);
  if (!podePagar) { await M.say(n, F.semPagar ?? [`Para ${mv.name} eu cobro ${preco(x)}. Volte quando puder pagar!`]); return; }
  const pode = (m) => !m.moves.includes(x.golpe) && (t.todos || x.todos || (typeof m.canLearn === 'function' ? m.canLearn(x.golpe) : true));
  const c = await M.say(n, [`${mv.name}! Quem vai aprender?`], { choices: [...g.party.map((m) => `${m.name}${m.moves.includes(x.golpe) ? ' (já sabe)' : pode(m) ? '' : ' (não pode)'}`), 'Cancelar'] });
  if (c == null || c < 0 || c >= g.party.length) return;
  const m = g.party[c];
  if (!pode(m)) { await M.say(n, F.naoPode ?? [m.moves.includes(x.golpe) ? `${m.name} já sabe ${mv.name}!` : `Hmm… ${m.name} não leva jeito para ${mv.name}.`]); return; }
  let ok = true;
  if (m.moves.length < 4) m.learn(x.golpe);
  else ok = await g.ui.menu.askLearn(m, x.golpe);
  if (!ok) { await M.say(n, ['Tudo bem, fica para outra vez.']); return; }
  if (x.item) { g.bag[x.item[0]] -= x.item[1]; if (g.bag[x.item[0]] <= 0) delete g.bag[x.item[0]]; } else g.money -= x.dinheiro ?? 0;
  g.audio?.sfx?.('levelup'); g.ui?.partyChanged?.();
  await M.say(n, [`${m.name} aprendeu ${mv.name}!`, ...(F.tchau ?? ['Use com sabedoria!'])]);
}
