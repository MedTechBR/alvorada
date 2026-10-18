// Captura a tela inteira (com HUD, minimapa e a barra "perto de alguém") de um cliente com outro por perto.
import { launch, open, sleep, until } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const rede = process.argv[2] ?? 'local';
const base = `http://127.0.0.1:8743/index.html?teste=1&online=1${rede === 'local' ? '&rede=local' : ''}`;
const b = await launch(9337);
try {
  const B = await open(b, `${base}&perfil=b&nome=Bia`, 'b'); await sleep(2500);
  const A = await open(b, `${base}&perfil=a&nome=Ana`, 'a');
  for (const p of [A, B]) { await until(() => p.ev('!!window.game?.net'), 30000); await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`); }
  await until(async () => (await A.ev('game.net.room?.players.size')) === 2 && (await B.ev('game.net.room?.players.size')) === 2, 40000, 500);
  const pos = await A.ev('({ x: game.player.x, y: game.player.y })');
  await B.ev(`(() => { game.player.x = ${pos.x + 26}; game.player.y = ${pos.y + 6}; return 1; })()`);
  await sleep(2500);
  await A.ev(`(game.net.emote('wave'), 1)`); await sleep(300);
  const shot = await A.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
  writeFileSync(new URL('../shots/mundo-hud.jpg', import.meta.url), Buffer.from(shot.result.data, 'base64'));
  await A.ev('(game.net.ui.toggleMenu(), 1)'); await sleep(300);
  const shot2 = await A.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
  writeFileSync(new URL('../shots/mundo-menu.jpg', import.meta.url), Buffer.from(shot2.result.data, 'base64'));
  console.log('ok: tools/shots/mundo-hud.jpg e mundo-menu.jpg');
} finally { b.kill(); }
