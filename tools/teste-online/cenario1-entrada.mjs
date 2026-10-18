// Cenário 1: 3 clientes entram sozinhos no canal, um vê o outro andando, reeleição ao fechar o anfitrião
import { launch, open, sleep, until } from './cdp.mjs';
const rede = process.argv[2] ?? 'local';
const base = `http://127.0.0.1:8743/index.html?teste=1&online=1${rede === 'local' ? '&rede=local' : ''}`;
const b = await launch(9333);
const st = (p) => p.ev(`(() => { const n = game.net, w = n.world; return { state: w.state, ch: w.channel, on: n.on, host: n.isHost, id: n.selfId, n: n.room?.players.size, err: w.lastError, rem: [...n.remotes.map.values()].map(r => ({ id: r.id, name: r.name, vis: r.view.visible, x: Math.round(r.x), y: Math.round(r.y), drop: !!r.drop })) }; })()`);
try {
  const P = [];
  for (const k of ['a', 'b', 'c']) { P.push(await open(b, `${base}&perfil=${k}`, k)); await sleep(rede === 'local' ? 1500 : 2500); }
  for (const p of P) await until(() => p.ev('!!window.game?.net'), 30000);
  // abas em segundo plano não rodam requestAnimationFrame: um relógio próprio avança os quadros
  for (const p of P) await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`);
  const ok = await until(async () => { const s = await Promise.all(P.map(st)); return s.every((x) => x.on && x.n === 3) && s; }, 45000, 500);
  console.log('ENTRADA', JSON.stringify(ok ?? (await Promise.all(P.map(st)))));
  // põe todos lado a lado perto do spawn de A e anda A
  const pos = await P[0].ev('({ x: game.player.x, y: game.player.y })');
  for (const [i, p] of P.entries()) await p.ev(`(() => { game.player.x = ${pos.x + i * 30}; game.player.y = ${pos.y}; return 1; })()`);
  await sleep(1500);
  console.log('PERTO', JSON.stringify(await Promise.all(P.map(st))));
  const before = (await st(P[1])).rem.find((r) => r.name.endsWith('a'));
  await P[0].ev(`(() => { game.player.x += 40; game.player.y += 20; return 1; })()`);
  await sleep(1200);
  const after = (await st(P[1])).rem.find((r) => r.name.endsWith('a'));
  console.log('ANDOU (visto por b)', JSON.stringify(before), '->', JSON.stringify(after));
  // UI: indicador e lista
  console.log('HUD', await P[1].ev(`document.getElementById('net-btn').textContent`));
  await P[1].ev(`(game.net.ui.toggleMenu(), document.querySelector('#net-menu').innerText.slice(0, 400))`).then((t) => console.log('MENU', JSON.stringify(t)));
  await P[1].ev(`(async () => { game.net.ui.closeMenu(); game.app.renderer.render(game.app.stage); const b = await (await fetch(game.app.canvas.toDataURL('image/jpeg', 0.85))).blob(); await fetch('/__shot?n=mundo-perto-b', { method: 'POST', body: b }); return 1; })()`);
  // reeleição: fecha o anfitrião
  const s0 = await Promise.all(P.map(st)); const hi = s0.findIndex((x) => x.host);
  console.log('ANFITRIAO', P[hi].tag);
  await P[hi].close(); const rest = P.filter((_, i) => i !== hi);
  const t0 = Date.now();
  const re = await until(async () => { const s = await Promise.all(rest.map(st)); return s.every((x) => x.on && x.n === 2) && s.filter((x) => x.host).length === 1 && s; }, 60000, 300);
  console.log('REELEICAO', ((Date.now() - t0) / 1000).toFixed(1) + 's', JSON.stringify(re ?? (await Promise.all(rest.map(st)))));
  for (const p of P) { const ex = p.logs.filter((l) => /EXC|Error|error/.test(l)); if (ex.length) console.log('LOGS', p.tag, ex.slice(0, 5)); }
} finally { b.kill(); }
