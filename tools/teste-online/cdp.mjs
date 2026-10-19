// Driver mínimo de teste (ver mundo.mjs). Abre o Google Chrome do macOS sem interface.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch(port = 9333) {
  const dir = mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chr-'));
  const p = spawn(CHROME, [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1', `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', '--mute-audio', '--no-default-browser-check',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--window-size=1200,800', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 150; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  return { port, proc: p, kill: () => p.kill('SIGKILL') };
}

export async function open(b, url, tag = '') {
  const t = await (await fetch(`http://127.0.0.1:${b.port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const wait = new Map(); const logs = [];
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
    if (m.method === 'Runtime.consoleAPICalled') { const s = m.params.args.map((a) => a.value ?? a.description ?? '').join(' '); logs.push(s); if (process.env.LOGS) console.log(`[${tag}]`, s); }
    if (m.method === 'Runtime.exceptionThrown') { const s = 'EXC ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text); logs.push(s); console.log(`[${tag}]`, s.slice(0, 400)); }
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(`[${tag}] ` + (r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text));
    return r.result?.result?.value;
  };
  return { ev, raw: send, logs, tag, close: () => fetch(`http://127.0.0.1:${b.port}/json/close/${t.id}`), id: t.id };
}

export async function until(fn, ms = 20000, step = 250) {
  const t0 = Date.now();
  for (;;) { try { const v = await fn(); if (v) return v; } catch (e) { if (Date.now() - t0 > ms) throw e; } if (Date.now() - t0 > ms) return false; await sleep(step); }
}
