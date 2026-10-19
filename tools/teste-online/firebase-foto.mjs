// Duas capturas 844x390 (celular na horizontal) do jogador A vendo o B pelo Firebase. Uso: node tools/teste-online/firebase-foto.mjs <pasta-de-saida>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, open, sleep, until } from './cdp.mjs';
const out = process.argv[2] ?? '.'; mkdirSync(out, { recursive: true });
const PORT = 8762;
const srv = spawn('python3', ['tools/serve.py', String(PORT)], { stdio: 'ignore' });
await sleep(1500);
const b = await launch(9362);
const bye = () => { try { b.kill(); } catch {} try { srv.kill('SIGKILL'); } catch {} };
for (const sg of ['SIGINT', 'SIGTERM', 'exit']) process.on(sg, () => { bye(); if (sg !== 'exit') process.exit(1); });
setTimeout(() => { bye(); process.exit(2); }, 240000).unref();
try {
  const P = {};
  for (const k of ['a', 'b']) {
    P[k] = await open(b, `http://127.0.0.1:${PORT}/index.html?teste=1&online=1&backend=fire&perfil=${k}`, k); await sleep(2500);
    await P[k].raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: false });
  }
  for (const p of Object.values(P)) { await until(() => p.ev('!!window.game?.net'), 30000); await p.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`); }
  await until(async () => (await Promise.all(Object.values(P).map((p) => p.ev('game.net.on')))).every(Boolean), 45000, 500);
  const idB = await P.b.ev('game.net.selfId');
  const pos = await P.a.ev('({ x: game.player.x, y: game.player.y })');
  await P.b.ev(`(game.player.x = ${pos.x + 60}, game.player.y = ${pos.y + 6}, 1)`);
  await until(() => P.a.ev(`!!game.net.remotes.get('${idB}')?.view.visible`), 20000, 300);
  await sleep(2500);
  const shot = async (name) => { const r = await P.a.raw('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
  await shot('A-ve-B-1');
  // B anda para a direita e A vê o movimento
  await P.b.ev(`(game.player.x += 40, game.player.y -= 10, game.player.dir = 'left', 1)`);
  await sleep(2500);
  await shot('A-ve-B-2');
  console.log('B visto por A em', await P.a.ev(`(r => ({ x: Math.round(r.x), y: Math.round(r.y), nome: r.name }))(game.net.remotes.get('${idB}'))`), 'A em', await P.a.ev('({ x: Math.round(game.player.x), y: Math.round(game.player.y) })'));
} finally { bye(); }
