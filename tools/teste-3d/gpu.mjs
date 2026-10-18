import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const flags of [[], ['--use-angle=metal'], ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']]) {
  const port = 9400 + Math.floor(Math.random() * 400);
  const dir = mkdtempSync(join(tmpdir(), 'chr-'));
  const p = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', ...flags, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const r = await new Promise((res) => { ws.addEventListener('message', (e) => res(JSON.parse(e.data))); ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { returnByValue: true, expression: `(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); if (!gl) return 'sem webgl2'; const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); })()` } })); });
  console.log(flags.join(' ') || '(padrão)', '=>', r.result?.result?.value);
  p.kill('SIGKILL');
}
