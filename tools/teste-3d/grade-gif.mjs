// Sequência de capturas do movimento em grade (vira, anda, corre, esbarra) e GIF em tools/shots/grade/passos.gif
import { util } from './grade-util.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export default async function (ctx) {
  const { P, sleep, out } = ctx; const u = await util(ctx);
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open)'); i++) await sleep(500);
  const dir = fileURLToPath(new URL('quadros/', out)); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await P.ev(`document.getElementById('hud')?.style && (document.getElementById('hud').style.display = 'none'); document.querySelectorAll('.hint, #hints, .keys').forEach((e) => e.style.display = 'none'); 1`);
  await u.tp(299, 353, 'down'); await sleep(500);
  let n = 0, rodando = true; const t0 = Date.now();
  const cap = (async () => { while (rodando) { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 70, clip: { x: 230, y: 100, width: 500, height: 280, scale: 1 } }); writeFileSync(`${dir}/f${String(n++).padStart(4, '0')}.jpg`, Buffer.from(s.result.data, 'base64')); } })();
  await sleep(400);
  await u.hold('d', 60); await sleep(500);                 // toque curto: só vira para a direita
  await u.hold('d', 780); await sleep(400);                // segura: anda bloco a bloco, termina o passo ao soltar
  await u.hold(['shift', 'd'], 560); await sleep(300);     // corre
  await u.hold('s', 60); await sleep(400);                 // vira para baixo
  await u.hold('s', 520); await sleep(500);                // anda para baixo
  rodando = false; await cap;
  const seg = (Date.now() - t0) / 1000, fps = Math.max(4, Math.min(20, Math.round(n / seg)));
  console.log(`capturas: ${n} em ${seg.toFixed(1)} s (~${fps} quadros/s)`);
  const gif = fileURLToPath(new URL('passos.gif', out));
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', `${dir}/f%04d.jpg`, '-vf', 'fps=12,scale=500:-1:flags=neighbor,split[a][b];[a]palettegen[p];[b][p]paletteuse', gif]);
  console.log('gif:', r.status === 0 ? gif : 'falhou ' + r.stderr);
}
