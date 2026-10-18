// Cenário 2: troca, aceno, duelo e queda (crash) do anfitrião no meio do duelo
import { launch, open, sleep, until } from './cdp.mjs';
const rede = process.argv[2] ?? 'local';
const base = `http://127.0.0.1:8743/index.html?teste=1&online=1${rede === 'local' ? '&rede=local' : ''}`;
const b = await launch(9335);
const log = (...a) => console.log(...a.map((x) => typeof x === 'string' ? x : JSON.stringify(x)));
try {
  const P = {};
  for (const k of ['a', 'b', 'c']) { P[k] = await open(b, `${base}&perfil=${k}`, k); await sleep(2500); }
  for (const p of Object.values(P)) { await until(() => p.ev('!!window.game?.net'), 30000); await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`); }
  await until(async () => (await Promise.all(Object.values(P).map((p) => p.ev('game.net.room?.players.size ?? 0')))).every((n) => n === 3), 60000, 500);
  const id = {}; for (const [k, p] of Object.entries(P)) id[k] = await p.ev('game.net.selfId');
  const host = Object.keys(P).find((k) => 0) ; 
  const hosts = {}; for (const [k, p] of Object.entries(P)) hosts[k] = await p.ev('game.net.isHost');
  log('ids', id, 'anfitrião', hosts);
  const pos = await P.a.ev('({ x: game.player.x, y: game.player.y })');
  let i = 0; for (const p of Object.values(P)) await p.ev(`(() => { game.player.x = ${pos.x + 24 * i}; game.player.y = ${pos.y + 4}; return 1; })()`), i++;
  await sleep(2000);
  // ---- aceno
  await P.a.ev(`(game.net.emote('wave', '${id.b}'), 1)`);
  await sleep(800);
  log('ACENO visto por b:', await P.b.ev(`game.net.remotes.get('${id.a}').view.bubble?.children[1]?.text ?? null`), '| toast:', await P.b.ev(`[...document.querySelectorAll('#toasts *')].map(e => e.textContent).filter(t => /acenou/.test(t)).slice(-1)[0] ?? null`));
  // ---- troca a(Pikachu, slot 1) <-> b(Squirtle, slot 2)
  log('antes', await P.a.ev('game.party.map(m => m.name)'), await P.b.ev('game.party.map(m => m.name)'));
  await P.a.ev(`(game.net.trade.request('${id.b}'), 1)`);
  await until(() => P.b.ev(`!document.querySelector('#net-ask').hidden`), 10000);
  await P.b.ev(`(document.querySelector('#net-ask button.ok').click(), 1)`);
  await until(() => P.a.ev('!!game.net.trade.t') , 10000);
  await until(() => P.b.ev('!!game.net.trade.t') , 10000);
  await P.a.ev(`(game.net.trade.offer(1), 1)`); await P.b.ev(`(game.net.trade.offer(2), 1)`);
  await until(() => P.a.ev('!!game.net.trade.t?.theirs') , 10000); await until(() => P.b.ev('!!game.net.trade.t?.theirs') , 10000);
  await P.b.ev(`(game.net.trade.confirm(), 1)`); await sleep(400); await P.a.ev(`(game.net.trade.confirm(), 1)`);
  await sleep(5000);
  log('TROCA depois', await P.a.ev('game.party.map(m => m.name)'), await P.b.ev('game.party.map(m => m.name)'));
  await P.a.ev(`(document.querySelector('#net-anim').hidden = true, 1)`); await P.b.ev(`(document.querySelector('#net-anim').hidden = true, 1)`);
  // ---- duelo entre os dois que NÃO são o anfitrião; depois o anfitrião cai (crash)
  const H = Object.keys(hosts).find((k) => hosts[k]); const [X, Y] = Object.keys(P).filter((k) => k !== H);
  await P[X].ev(`(game.net.duel.challenge('${id[Y]}'), 1)`);
  await until(() => P[Y].ev(`!document.querySelector('#net-ask').hidden`), 10000);
  await P[Y].ev(`(document.querySelector('#net-ask button.ok').click(), 1)`);
  for (const k of [X, Y]) { await until(() => P[k].ev(`!document.querySelector('#net-pick').hidden && !!document.querySelector('#net-pick [data-i="0"]')`), 10000); await P[k].ev(`(document.querySelector('#net-pick [data-i="0"]').click(), document.querySelector('#net-pick [data-a="go"]').click(), 1)`); }
  const fight = await until(async () => (await Promise.all([X, Y].map((k) => P[k].ev('game.net.duel.d?.phase ?? null')))).every((x) => x === 'fight'), 20000, 300);
  log('DUELO', X, 'x', Y, 'árbitro =', await P[X].ev('game.net.duel.d?.ref'), '(', id[Y], ') em luta:', !!fight, 'arena', await P[X].ev('game.net.duel.d?.arena'));
  await P[X].ev(`(async () => { game.app.renderer.render(game.app.stage); const b = await (await fetch(game.app.canvas.toDataURL('image/jpeg', 0.85))).blob(); await fetch('/__shot?n=mundo-duelo', { method: 'POST', body: b }); return 1; })()`);
  // um acerto pedido ao árbitro (golpe 0 do ativo do X no ativo do Y)
  const hpBefore = await P[Y].ev('game.lead?.mon.hp');
  // encosta o Pokémon do X no do rival (o árbitro confere a distância) e espera as posições chegarem
  await P[X].ev(`(() => { const d = game.net.duel.d, f = game.net.remotes.get(d.foe).follower; game.lead.x = f.x - 14; game.lead.y = f.y; return 1; })()`);
  await sleep(800);
  await P[X].ev(`(() => { game.net.send('use', { s: 1, ax: Math.round(game.lead.x + 14), ay: Math.round(game.lead.y) }); return 1; })()`);
  await sleep(300);
  await P[X].ev(`(() => { const d = game.net.duel.d, f = game.net.remotes.get(d.foe).follower; game.net.toArbiter(d.ref, 'd-claim', { duel: d.id, slot: 1, tgt: f.mon.uid, dx: 1, dy: 0 }); return 1; })()`);
  await sleep(1000);
  log('ACERTO: PS do rival', hpBefore, '->', await P[Y].ev('game.lead?.mon.hp'), '| visto por X:', await P[X].ev('game.net.remotes.get(game.net.duel.d.foe).follower?.mon.hp'));
  log('CRASH do anfitrião', H);
  P[H].raw('Page.crash').catch(() => {});
  const t0 = Date.now();
  const re = await until(async () => { const s = await Promise.all([X, Y].map((k) => P[k].ev('[game.net.on, game.net.isHost, game.net.room?.players.size, game.net.duel.d?.phase]'))); return s.every((x) => x[0] && x[2] === 2) && s; }, 90000, 500);
  log('REELEICAO depois do crash', ((Date.now() - t0) / 1000).toFixed(1) + 's', re);
  // o duelo segue: X desiste e os dois recebem o fim do árbitro
  await P[X].ev(`(game.net.duel.forfeit(), 1)`);
  await sleep(2000);
  log('FIM', await P[X].ev(`[game.net.duel.d, document.querySelector('#net-msg').innerText]`), await P[Y].ev(`[game.net.duel.d, document.querySelector('#net-msg').innerText]`));
  for (const p of Object.values(P)) { const ex = p.logs.filter((l) => /EXC/.test(l)); if (ex.length) log('LOGS', p.tag, ex.slice(0, 5)); }
} finally { b.kill(); }
