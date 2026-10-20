import { launch, sleep } from '../teste-3d/chrome.mjs';
const b = await launch(9300 + Math.floor(Math.random() * 150));
try {
  const t = await (await fetch(`http://127.0.0.1:${b.port}/json/new?${encodeURIComponent(`http://127.0.0.1:8771/index.html?teste=1&ir=${process.env.IR}`)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }));
  let feito = false;
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Debugger.paused' && !feito) { feito = true; for (const f of m.params.callFrames.slice(0, 14)) console.log(f.functionName || '(anon)', f.url.replace(/^.*8771/, '').slice(0, 80), f.location.lineNumber + 1); } });
  send('Debugger.enable');
  await sleep(+(process.env.ESPERA ?? 25000));
  send('Debugger.pause');
  await sleep(4000);
  if (!feito) console.log('não pausou');
} finally { b.kill(); }
