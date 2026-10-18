// Cenário 3: canal cheio, interior, sala privada, perda do código (id-lost), nome malicioso e inundação
import { launch, open, sleep, until } from './cdp.mjs';
const rede = process.argv[2] ?? 'local';
const base = `http://127.0.0.1:8743/index.html?teste=1&online=1&canal_max=2${rede === 'local' ? '&rede=local' : ''}`;
const b = await launch(9336);
const log = (...a) => console.log(...a.map((x) => typeof x === 'string' ? x : JSON.stringify(x)));
const st = (p) => p.ev('[game.net.world.channel, game.net.isHost, game.net.room?.players.size, game.net.mode, game.net.world.state]');
try {
  const P = {};
  const names = { a: 'Ana', b: '<img src=x onerror=alert(1)>', c: 'Caio' };
  for (const k of ['a', 'b', 'c']) { P[k] = await open(b, `${base}&perfil=${k}&nome=${encodeURIComponent(names[k])}`, k); await sleep(2500); }
  for (const p of Object.values(P)) { await until(() => p.ev('!!window.game?.net'), 30000); await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`); }
  await sleep(6000);
  log('CANAL CHEIO (máx 2):', { a: await st(P.a), b: await st(P.b), c: await st(P.c) });
  log('NOME malicioso visto pelos outros:', await P.a.ev(`game.net.room.roster.map(p => p.name)`), '| img no DOM?', await P.a.ev(`(game.net.ui.toggleMenu(), !!document.querySelector('#net-menu img'))`));
  await P.a.ev('(game.net.ui.closeMenu(), 1)');
  // interior: b entra numa casa; a não deve desenhar b
  const room = await P.b.ev(`(() => { const r = game.map.interiors[0]; return { id: r.id, x: (r.x + Math.floor(r.w / 2)) * 16, y: (r.y + Math.floor(r.h / 2)) * 16 }; })()`);
  const ab = await P.a.ev('[game.net.selfId, game.net.isHost]');
  const aPos = await P.a.ev('({ x: game.player.x, y: game.player.y })');
  await P.b.ev(`(() => { game.player.x = ${aPos.x + 20}; game.player.y = ${aPos.y}; return 1; })()`); await sleep(1500);
  const bid = await P.b.ev('game.net.selfId');
  log('b lá fora perto de a, a desenha b?', await P.a.ev(`game.net.remotes.get('${bid}')?.view.visible`));
  await P.b.ev(`(() => { game.player.x = ${room.x}; game.player.y = ${room.y}; return 1; })()`); await sleep(2500);
  log('b no interior', room.id, '-> a desenha b?', await P.a.ev(`game.net.remotes.get('${bid}')?.view.visible`), '| ponto no minimapa?', await P.a.ev(`game.net.remotes.dots().length`));
  // id-lost: o anfitrião do canal 1 perde o código; os clientes vão para o novo dono
  const H = (await P.a.ev('game.net.isHost')) ? 'a' : 'b', O = H === 'a' ? 'b' : 'a';
  await P[H].ev(`(game.net.room.emit('id-lost'), 1)`);
  const re = await until(async () => { const s = [await st(P.a), await st(P.b)]; return s.every((x) => x[0] === 1 && x[2] === 2) && s.filter((x) => x[1]).length === 1 && s; }, 30000, 300);
  log('ID-LOST: ex-anfitrião', H, 'volta como cliente:', re);
  // sala privada: c cria, a entra; os dois saem do mundo; ao sair, voltam
  const code = await P.c.ev(`game.net.create({ name: 'Caio', password: 'abc123' })`);
  await P.a.ev(`game.net.join({ code: '${code}', name: 'Ana', password: 'abc123' })`);
  await sleep(1500);
  log('PRIVADA', code, { a: await st(P.a), c: await st(P.c) }, 'b no mundo:', await st(P.b));
  const wrong = await P.b.ev(`game.net.join({ code: '${code}', name: 'X', password: 'errada' }).then(() => 'entrou', e => e.message)`);
  log('senha errada ->', wrong, '| b volta ao mundo:', await until(async () => (await st(P.b))[3] === 'world' && (await st(P.b)), 20000));
  await P.a.ev('(game.net.leave(), 1)');
  log('a saiu da privada -> mundo:', await until(async () => (await st(P.a))[3] === 'world' && (await st(P.a)), 30000));
  // inundação: c (cliente no mundo agora? usa a) manda 2000 mensagens de uma vez
  await P.c.ev('(game.net.leave(), 1)'); await until(async () => (await st(P.c))[3] === 'world', 30000);
  const F = (await P.a.ev('game.net.isHost')) ? 'b' : 'a';
  log('flood por', F, 'no canal de', await st(P[F]));
  await P[F].ev(`(() => { for (let i = 0; i < 2000; i++) game.net.room.link.send({ k: 'm', type: 'chat', data: { text: 'x'.repeat(70) } }); return 1; })()`);
  await sleep(3000);
  log('depois do flood:', { [F]: await st(P[F]), err: await P[F].ev('game.net.world.lastError ?? null') }, 'outros:', await st(P[F === 'a' ? 'b' : 'a']));
  for (const p of Object.values(P)) { const ex = p.logs.filter((l) => /EXC/.test(l)); if (ex.length) log('LOGS', p.tag, ex.slice(0, 5)); }
} finally { b.kill(); }
