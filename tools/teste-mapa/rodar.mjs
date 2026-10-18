// Abre o jogo no Chrome sem interface e roda um trecho de JS na página (só para desenvolvimento).
//   node tools/teste-mapa/rodar.mjs '<url extra>' '<expressão JS (pode ser async)>'
// Ex.: node tools/teste-mapa/rodar.mjs '&ir=porto_rubro_cais' 'game.map.id'
import { launch as lancarSoft, open, sleep, until } from '../teste-online/cdp.mjs';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// GPU=1: Chrome sem interface com a placa de vídeo de verdade (Metal); senão o SwiftShader do cdp.mjs
async function launch(port) {
  if (process.env.GPU !== '1') return lancarSoft(port);
  const dir = mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chr-'));
  const p = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  return { port, kill: () => p.kill('SIGKILL') };
}
const PORT = process.env.PORTA ?? 8748;
const [extra = '', expr = '1'] = process.argv.slice(2);
const b = await launch(9350 + Math.floor(Math.random() * 40));
try {
  const P = await open(b, `http://127.0.0.1:${PORT}/index.html?teste=1${extra}`, 'p');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront');
  const ok = await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 60000, 300);
  if (!ok) console.log('o jogo não abriu');
  await P.ev(`(window.__pump ??= setInterval(() => { if (document.hidden) game.frame(1 / 30); }, 33), 1)`);
  await sleep(800);
  await P.ev(`import('/tools/mundo-teste.js').then(() => import('/tools/jornadas-teste.js')).then(() => 1)`);
  const r = await P.ev(`(async () => { ${expr.includes('return') ? expr : 'return ' + expr} })()`);
  console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1));
  const erros = P.logs.filter((l) => /EXC|Error|erro|warn|mapa:/i.test(l));
  if (erros.length) console.log('console:', erros.slice(0, 25).join('\n'));
} finally { b.kill(); }
