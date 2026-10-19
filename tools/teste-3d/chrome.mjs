// Chrome sem interface com a GPU de verdade (o driver de teste-online usa SwiftShader, que desenha na CPU).
// GPU=sw usa o SwiftShader (pessimista, bom para achar gargalo de GPU).
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
export { open, sleep, until } from '../teste-online/cdp.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export async function launch(port = 9500 + Math.floor(Math.random() * 300)) {
  const dir = mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chr3d-'));
  const gpu = process.env.GPU === 'sw' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];
  const p = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', '--mute-audio', '--no-default-browser-check', ...gpu,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-gpu-vsync', '--disable-frame-rate-limit',
    '--window-size=1280,800', 'about:blank'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await espera(200); } }
  return { port, proc: p, kill: () => { try { process.kill(-p.pid, 'SIGKILL'); } catch { p.kill('SIGKILL'); } } };
}
