// Chrome sem interface com a GPU de verdade (o driver de teste-online usa SwiftShader, que desenha na CPU).
// GPU=sw usa o SwiftShader (pessimista, bom para achar gargalo de GPU).
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
export { open, sleep, until } from '../teste-online/cdp.mjs';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export async function launch(port = 9500 + Math.floor(Math.random() * 300)) {
  // Reutilização explícita apenas de um perfil descartável criado por este ajudante.
  const cache=process.env.CACHE_CROME;if(cache&&!basename(cache).startsWith('chr3d-'))throw Error('O cache precisa ser um perfil descartável chr3d-');
  const dir = cache??mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chr3d-'));
  const gpu = process.env.GPU === 'sw' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];
  const p = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', '--mute-audio', '--no-default-browser-check', '--disable-component-update', '--disable-background-networking', ...gpu, ...(process.env.HTTP1==='1'?['--disable-http2','--disable-quic']:[]),
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    ...(process.env.FPS_LIVRE === '0' ? [] : ['--disable-gpu-vsync', '--disable-frame-rate-limit']),
    '--window-size=1280,800', 'about:blank'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 150; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await espera(200); } }
  return { port, proc: p, kill: () => { try { process.kill(-p.pid, 'SIGKILL'); } catch { p.kill('SIGKILL'); } } };
}
