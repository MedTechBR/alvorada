// Teste do movimento clássico (grade de 16 px): teclado e toque emulado, no Chrome com GPU.
//   python3 tools/serve.py 8791 ; PORT=8791 node tools/teste-3d/grade.mjs [cenario]
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const PORT = process.env.PORT ?? 8791;
const out = new URL('../shots/grade/', import.meta.url); mkdirSync(out, { recursive: true });
const touch = process.argv.includes('--toque');
const b = await launch();
const rel = [];
try {
  const P = await open(b, 'about:blank', 'g');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  if (touch) { await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 2, mobile: true }); await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); }
  else await P.raw('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  await P.raw('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html?teste=1${process.env.Q ?? ''}` });
  const pronto = await until(() => P.ev('!!(window.game && game.ui?.state === "play" && game.story)'), 90000, 400);
  if (!pronto) throw new Error('o jogo não ligou: ' + P.logs.slice(-6).join(' | '));
  await sleep(2500);
  globalThis.P = P;
  const mod = await import(process.env.CENARIO ?? './grade-cenarios.mjs');
  await mod.default({ P, sleep, until, out, touch, b });
} catch (e) { console.log('ERRO', e.message); }
finally { const er = (globalThis.P?.logs ?? []).filter((l) => /EXC|rror|Uncaught/.test(l)); if (er.length) console.log('CONSOLE com erros:', er.slice(0, 8).join('\n')); else console.log('console sem erros'); b.kill(); }
