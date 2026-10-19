// Sequência de capturas do movimento em grade (vira, anda, corre, esbarra) e GIF em tools/shots/grade/passos.gif
// O tempo é virtual: o ticker do jogo é parado e avançado a 60 quadros/s por "ticker.update", e uma captura sai a cada 3 quadros
// (20 por segundo de jogo), então o GIF sai suave mesmo com a máquina cheia.
import { util } from './grade-util.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export default async function (ctx) {
  const { P, sleep, out } = ctx; const u = await util(ctx);
  for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open)'); i++) await sleep(500);
  const dir = fileURLToPath(new URL('quadros/', out)); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await P.ev(`document.getElementById('hud')?.style && (document.getElementById('hud').style.display = 'none'); document.querySelectorAll('#hints, .keys, #moves, #lead, .objective, #minimap').forEach((e) => e.style.display = 'none'); 1`);
  await u.tp(299, 354, 'down'); await sleep(800);
  await P.ev(`game.app.ticker.stop(); window.__t = performance.now(); window.__avanca = (n) => { for (let i = 0; i < n; i++) { __t += 1000 / 60; game.app.ticker.update(__t); } return 1; }; window.__avanca(30); 1`);
  let n = 0;
  const cap = async () => { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 72, clip: { x: 230, y: 130, width: 500, height: 280, scale: 1 } }); writeFileSync(`${dir}/f${String(n++).padStart(4, '0')}.jpg`, Buffer.from(s.result.data, 'base64')); };
  const frames = async (k) => { for (let i = 0; i < k; i += 3) { await P.ev('__avanca(3)'); await cap(); } };
  const down = (c) => P.ev(`__k(${JSON.stringify(c)}, true)`), up = (c) => P.ev(`__k(${JSON.stringify(c)}, false)`);
  await frames(15);
  await down('KeyD'); await frames(6); await up('KeyD'); await frames(24);             // toque curto: só vira para a direita
  await down('KeyD'); await frames(48); await up('KeyD'); await frames(18);             // segura: anda bloco a bloco e termina o passo ao soltar
  await down('ShiftLeft'); await down('KeyD'); await frames(33); await up('KeyD'); await up('ShiftLeft'); await frames(18); // corre
  await down('KeyS'); await frames(6); await up('KeyS'); await frames(18);              // vira para baixo
  await down('KeyS'); await frames(36); await up('KeyS'); await frames(24);             // anda para baixo
  console.log(`capturas: ${n} (20 por segundo de jogo)`);
  const gif = fileURLToPath(new URL('passos.gif', out));
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '20', '-i', `${dir}/f%04d.jpg`, '-vf', 'scale=500:-1:flags=neighbor,split[a][b];[a]palettegen[p];[b][p]paletteuse', gif]);
  console.log('gif:', r.status === 0 ? gif : 'falhou ' + r.stderr);
  // folha de contato: um quadro a cada 4 capturas
  const py = `
from PIL import Image
import glob
fs = sorted(glob.glob(${JSON.stringify(dir)} + '/f*.jpg'))[::4][:24]
ims = [Image.open(f).resize((250, 140)) for f in fs]
W = 4; H = (len(ims) + W - 1) // W
sheet = Image.new('RGB', (250 * W, 140 * H))
for i, im in enumerate(ims): sheet.paste(im, ((i % W) * 250, (i // W) * 140))
sheet.save(${JSON.stringify(fileURLToPath(new URL('passos-folha.jpg', out)))}, quality=85)
`;
  spawnSync('python3', ['-I', '-c', py]);
  await P.ev('game.app.ticker.start(); 1');
}
