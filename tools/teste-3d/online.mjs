// Dois clientes na rede de teste local (BroadcastChannel) com o visual 3D: um vê o outro. Só desenvolvimento.
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync } from 'node:fs';
const base = `http://127.0.0.1:${process.env.PORT ?? 8750}/index.html?teste=1&online=1&rede=local&visual=3d`;
const b = await launch();
try {
  const B = await open(b, `${base}&perfil=b&nome=Bia`, 'b'); await sleep(2500);
  const A = await open(b, `${base}&perfil=a&nome=Ana`, 'a');
  for (const p of [A, B]) { await until(() => p.ev('!!window.game?.net'), 60000); await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`); }
  await A.raw('Page.enable'); await A.raw('Page.bringToFront');
  await A.raw('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  const ok = await until(async () => (await A.ev('game.net.room?.players.size')) === 2 && (await B.ev('game.net.room?.players.size')) === 2, 60000, 500);
  const pos = await A.ev('({ x: game.player.x, y: game.player.y })');
  await B.ev(`(() => { game.player.x = ${pos.x + 30}; game.player.y = ${pos.y + 8}; return 1; })()`);
  await sleep(3000);
  await A.ev(`(game.net.emote?.('wave'), 1)`); await B.ev(`(game.net.emote?.('heart'), 1)`); await sleep(500);
  const shot = await A.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
  writeFileSync(new URL('../shots/cena-online.jpg', import.meta.url), Buffer.from(shot.result.data, 'base64'));
  console.log('ok sala', ok, 'remotos visíveis:', await A.ev('game.ents.children.filter((c) => c.visible && c.children.some((q) => q.text)).length'));
  const errs = [...A.logs, ...B.logs].filter((l) => /EXC|rror/.test(l)); if (errs.length) console.log('console:', [...new Set(errs)].slice(0, 6).join('\n'));
} finally { b.kill(); }
