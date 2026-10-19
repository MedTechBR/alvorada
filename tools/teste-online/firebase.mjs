// Teste do mundo por Firebase (src/net/fire.js): 2 jogadores anônimos, posição, saída (onDisconnect), regras, troca e duelo.
//   (sobe o servidor sozinho na porta 8761)   ·   node tools/teste-online/firebase.mjs
import { spawn } from 'node:child_process';
import { launch, open, sleep, until } from './cdp.mjs';
// sobe o próprio servidor local (e derruba tudo ao sair)
const PORT = 8761;
const srv = spawn('python3', ['tools/serve.py', String(PORT)], { stdio: 'ignore' });
await sleep(1500);
const base = `http://127.0.0.1:${PORT}/index.html?teste=1&online=1&backend=fire`;
const b = await launch(9361);
const bye = () => { try { b.kill(); } catch {} try { srv.kill('SIGKILL'); } catch {} };
for (const sg of ['SIGINT', 'SIGTERM', 'exit']) process.on(sg, () => { bye(); if (sg !== 'exit') process.exit(1); });
setTimeout(() => { console.log('TIMEOUT geral'); bye(); process.exit(2); }, 420000).unref();
const log = (...a) => console.log(...a.map((x) => typeof x === 'string' ? x : JSON.stringify(x)));
const st = (p) => p.ev(`(() => { const n = game.net, w = n.world; return { state: w.state, on: n.on, id: n.selfId, n: n.room?.players.size, err: w.lastError, rem: [...n.remotes.map.values()].map(r => ({ id: r.id, name: r.name, vis: r.view.visible, x: Math.round(r.x), y: Math.round(r.y), has: !!r.has })) }; })()`);
try {
  const P = {};
  for (const k of ['a', 'b']) { P[k] = await open(b, `${base}&perfil=${k}`, k); await sleep(2500); }
  for (const p of Object.values(P)) { await until(() => p.ev('!!window.game?.net'), 30000); await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`); }
  const ok = await until(async () => { const s = await Promise.all(Object.values(P).map(st)); return s.every((x) => x.on) && s; }, 45000, 500);
  log('LOGIN anônimo', ok ? ok.map((x) => ({ id: x.id, state: x.state })) : await Promise.all(Object.values(P).map(st)));
  const id = {}; for (const [k, p] of Object.entries(P)) id[k] = await p.ev('game.net.selfId');
  const pos = await P.a.ev('({ x: game.player.x, y: game.player.y })');
  let i = 0; for (const p of Object.values(P)) await p.ev(`(() => { game.player.x = ${pos.x + 24 * i}; game.player.y = ${pos.y + 4}; return 1; })()`), i++;
  const seen = await until(async () => { const s = await st(P.b); return s.n === 2 && s.rem.find((r) => r.id === id.a && r.vis) && s; }, 20000, 300);
  log('B vê A?', seen ? seen.rem : await st(P.b));
  // anda A e confere a posição vista por B (atraso de rede + interpolação)
  const t0 = Date.now();
  await P.a.ev(`(() => { game.player.x += 80; game.player.y += 30; return 1; })()`);
  const want = await P.a.ev('({ x: Math.round(game.player.x), y: Math.round(game.player.y) })');
  const moved = await until(async () => { const r = (await st(P.b)).rem.find((q) => q.id === id.a); return r && Math.abs(r.x - want.x) <= 2 && Math.abs(r.y - want.y) <= 2 && r; }, 8000, 100);
  log('ANDOU: esperado', want, 'visto por B', moved || (await st(P.b)).rem, 'em', Date.now() - t0, 'ms');
  log('HUD b:', await P.b.ev(`document.getElementById('net-chan').textContent + ' | ' + document.getElementById('net-btn').textContent`));
  // cruza a fronteira de células (640 px): A segue visível para B
  await P.a.ev(`(() => { game.player.x += 700; return 1; })()`); await P.b.ev(`(() => { game.player.x += 690; return 1; })()`);
  await sleep(3000);
  const cross = (await st(P.b)); log('CÉLULA nova: B ainda vê A?', !!cross.rem.find((r) => r.id === id.a && r.vis), 'n', cross.n);
  // ---- troca
  log('antes', await P.a.ev('game.party.map(m => m.name)'), await P.b.ev('game.party.map(m => m.name)'));
  await P.a.ev(`(game.net.trade.request('${id.b}'), 1)`);
  await until(() => P.b.ev(`!document.querySelector('#net-ask').hidden`), 15000);
  await P.b.ev(`(document.querySelector('#net-ask button.ok').click(), 1)`);
  await until(() => P.a.ev('!!game.net.trade.t'), 15000); await until(() => P.b.ev('!!game.net.trade.t'), 15000);
  await P.a.ev(`(game.net.trade.offer(1), 1)`); await P.b.ev(`(game.net.trade.offer(2), 1)`);
  await until(() => P.a.ev('!!game.net.trade.t?.theirs'), 15000); await until(() => P.b.ev('!!game.net.trade.t?.theirs'), 15000);
  await P.b.ev(`(game.net.trade.confirm(), 1)`); await sleep(400); await P.a.ev(`(game.net.trade.confirm(), 1)`);
  await sleep(6000);
  log('TROCA depois', await P.a.ev('game.party.map(m => m.name)'), await P.b.ev('game.party.map(m => m.name)'));
  await P.a.ev(`(document.querySelector('#net-anim').hidden = true, 1)`); await P.b.ev(`(document.querySelector('#net-anim').hidden = true, 1)`);
  // ---- duelo
  await P.a.ev(`(game.net.duel.challenge('${id.b}'), 1)`);
  await until(() => P.b.ev(`!document.querySelector('#net-ask').hidden`), 15000);
  await P.b.ev(`(document.querySelector('#net-ask button.ok').click(), 1)`);
  for (const k of ['a', 'b']) { await until(() => P[k].ev(`!document.querySelector('#net-pick').hidden && !!document.querySelector('#net-pick [data-i="0"]')`), 15000); await P[k].ev(`(document.querySelector('#net-pick [data-i="0"]').click(), document.querySelector('#net-pick [data-a="go"]').click(), 1)`); }
  const fight = await until(async () => (await Promise.all(['a', 'b'].map((k) => P[k].ev('game.net.duel.d?.phase ?? null')))).every((x) => x === 'fight'), 25000, 300);
  log('DUELO em luta:', !!fight, 'árbitro', await P.a.ev('game.net.duel.d?.ref'));
  await P.a.ev(`(game.net.duel.forfeit(), 1)`); await sleep(2500);
  log('DUELO fim', await P.a.ev(`document.querySelector('#net-msg').innerText`), '|', await P.b.ev(`document.querySelector('#net-msg').innerText`));
  // ---- regras: escrever o nó de OUTRO uid tem de ser recusado; o próprio, aceito
  const rules = await P.a.ev(`(async () => {
    const { loadFirebase } = await import('/src/net/fire.js'); const fb = await loadFirebase({ memoryAuth: true }); const { DB } = fb;
    const me = fb.auth.currentUser.uid, other = '${id.b}';
    const node = { n: 'X', k: '{}', x: 10, y: 10, d: 'down', r: false, w: 'alvorada', ts: 1 };
    const tryw = async (path, val) => { try { await DB.set(DB.ref(fb.db, path), val); return 'ACEITO'; } catch (e) { return 'RECUSADO ' + e.code; } };
    const out = {};
    out.outroUid = await tryw('mundo/v1/celulas/teste_0_0/' + other, node);
    out.proprioUid = await tryw('mundo/v1/celulas/teste_0_0/' + me, node);
    out.proprioRemover = await DB.remove(DB.ref(fb.db, 'mundo/v1/celulas/teste_0_0/' + me)).then(() => 'ok', (e) => e.code);
    out.nomeGrande = await tryw('mundo/v1/celulas/teste_0_0/' + me, { ...node, n: 'x'.repeat(40) });
    out.xInvalido = await tryw('mundo/v1/celulas/teste_0_0/' + me, { ...node, x: 999999 });
    out.campoExtra = await tryw('mundo/v1/celulas/teste_0_0/' + me, { ...node, hack: 1 });
    out.celulaInvalida = await tryw('mundo/v1/celulas/Ruim.Cel/' + me, node);
    out.raizMundo = await tryw('mundo/v1/lixo', 1);
    out.caixaForjada = await tryw('mundo/v1/caixa/' + other + '/m1', { f: other, y: 'chat', d: '{}', t: DB.serverTimestamp() });
    out.caixaPropria = await DB.push(DB.ref(fb.db, 'mundo/v1/caixa/' + other), { f: me, y: 'chat', d: '{"text":"oi"}', t: DB.serverTimestamp() }).then(() => 'ACEITO (remetente = eu)', (e) => e.code);
    out.lerCaixaAlheia = await DB.get(DB.ref(fb.db, 'mundo/v1/caixa/' + other)).then(() => 'LEU', (e) => 'RECUSADO ' + e.code);
    out.lerRaiz = await DB.get(DB.ref(fb.db, 'mundo/v1/celulas')).then(() => 'LEU', (e) => 'RECUSADO ' + e.code);
    out.lerCelula = await DB.get(DB.ref(fb.db, 'mundo/v1/celulas/alvorada_0_0')).then(() => 'LEU (autenticado)', (e) => 'RECUSADO ' + e.code);
    return out;
  })()`);
  log('REGRAS', rules);
  // ---- sair: fechar B some para A (onDisconnect / remoção)
  const before = await st(P.a); log('antes de fechar B: A vê', before.n, 'jogadores');
  const t1 = Date.now();
  await P.b.close();
  const gone = await until(async () => (await st(P.a)).n === 1, 40000, 250);
  log('FECHAR B -> A vê só ele mesmo:', !!gone, 'em', Date.now() - t1, 'ms');
  for (const p of Object.values(P)) { const ex = p.logs.filter((l) => /EXC|rror|fire\]/.test(l)); log('CONSOLE', p.tag, ex.length ? ex.slice(0, 8) : 'sem erros'); }
} finally { bye(); }
