import { launch, sleep } from '../teste-3d/chrome.mjs';
const b = await launch(9300 + Math.floor(Math.random() * 150));
try {
  const t = await (await fetch(`http://127.0.0.1:${b.port}/json/new?${encodeURIComponent(`http://127.0.0.1:8771/index.html?teste=1&ir=${process.env.IR}&${process.env.QS ?? ''}`)}`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const wait = new Map();
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 1000 });
  await sleep(+(process.env.ANTES ?? 8000));
  await send('Profiler.start');
  await sleep(+(process.env.DUR ?? 12000));
  const r = await send('Profiler.stop');
  const P = r.result.profile, dt = P.timeDeltas, self = new Map(), byId = new Map(P.nodes.map((n) => [n.id, n]));
  const cnt = new Map(); for (const s of P.samples) cnt.set(s, (cnt.get(s) ?? 0) + 1);
  for (const [nid, c] of cnt) { const n = byId.get(nid), f = n.callFrame, k = `${f.functionName || '(anon)'} ${f.url.replace(/^.*?:\d+/, '')}:${f.lineNumber + 1}`; self.set(k, (self.get(k) ?? 0) + c); }
  const tot = P.samples.length;
  console.log('amostras', tot);
  for (const [k, c] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(String(Math.round(c / tot * 1000) / 10).padStart(5), '%', k);
} finally { b.kill(); }
