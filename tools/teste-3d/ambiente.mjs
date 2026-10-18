// Capturas e FPS da cena de demonstração da ambientação (tools/demo-ambiente.html), no Chrome sem interface com a
// GPU do Mac. Só para desenvolvimento.
//   python3 tools/serve.py 8754   (noutro terminal)
//   node tools/teste-3d/ambiente.mjs foto nome "q=alta&hora=8.3&parar=1"        -> tools/shots/nome.jpg
//   node tools/teste-3d/ambiente.mjs fps "q=baixa"                                -> FPS com CPU 4x mais lenta, 740x360
// Variáveis: W, H (tamanho), PORT (8754), CPU (fator de lentidão no fps, 4), SEG (segundos medidos, 6)
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { open, sleep, until } from '../teste-online/cdp.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const [modo = 'foto', a1 = 'ambiente', a2 = ''] = process.argv.slice(2);
const qs = modo === 'fps' ? a1 : a2, nome = a1;
const W = +(process.env.W ?? (modo === 'fps' ? 740 : 1280)), H = +(process.env.H ?? (modo === 'fps' ? 360 : 720));
const port = 9600 + Math.floor(Math.random() * 300);
const dir = mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chr-'));
const proc = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', '--no-default-browser-check',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-gpu-vsync', '--disable-frame-rate-limit',
  `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
try {
  const Pg = await open({ port }, 'about:blank', 'demo');
  await Pg.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await Pg.raw('Page.enable');
  await Pg.raw('Page.navigate', { url: `http://127.0.0.1:${process.env.PORT ?? 8754}/tools/demo-ambiente.html?${qs}` });
  await until(() => Pg.ev('!!(window.demo && demo.quadros > 30)'), 60000, 300);
  if (modo === 'fps') {
    await Pg.raw('Emulation.setCPUThrottlingRate', { rate: +(process.env.CPU ?? 4) });
    await sleep(2500);
    const seg = +(process.env.SEG ?? 6);
    const q0 = await Pg.ev('demo.quadros'); const t0 = Date.now();
    await sleep(seg * 1000);
    const q1 = await Pg.ev('demo.quadros'); const t1 = Date.now();
    const inf = await Pg.ev('demo.info()');
    console.log(`FPS ${((q1 - q0) * 1000 / (t1 - t0)).toFixed(1)} (${W}x${H}, CPU ${process.env.CPU ?? 4}x, ${qs}) draws ${inf.calls} tri ${inf.tri} tufos ${inf.tufos}`);
  } else {
    if (process.env.EVAL) await Pg.ev(process.env.EVAL);
    await sleep(+(process.env.WAIT ?? 1500));
    const shot = await Pg.raw('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
    const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
    const f = new URL(`${nome}.jpg`, out); writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log('ok', f.pathname);
  }
  const errs = Pg.logs.filter((l) => /EXC|error|Error|WARN|warn/.test(l));
  console.log(errs.length ? 'console:\n' + errs.slice(0, 12).join('\n').slice(0, 3000) : 'console limpo');
} finally { proc.kill('SIGKILL'); }
