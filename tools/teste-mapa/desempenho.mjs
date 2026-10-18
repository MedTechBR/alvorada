// Mede carregamento, memória e quadros por segundo (Chrome sem interface via CDP), em computador e em celular
// simulado (740x360, toque, CPU 4x mais lenta). Só para desenvolvimento.
//   node tools/teste-mapa/desempenho.mjs [porta]          (padrão 8748)
// O que mede: tempo até o jogo abrir e montagem do mapa (map.tempoCarga); memória JS (performance.memory);
// setores montados; FPS e o pior quadro andando pelo núcleo, cruzando para uma região montada sob demanda e no Ocaso.
import { open, sleep, until } from '../teste-online/cdp.mjs';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Chrome sem interface com a placa de vídeo de verdade (Metal no Mac); GPU=0 usa o SwiftShader (software) do cdp.mjs
async function launch(port) {
  const dir = mkdtempSync(join(process.env.SCRATCH ?? tmpdir(), 'chr-'));
  const gpu = process.env.GPU !== '0' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  const p = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [`--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new', '--no-first-run', ...gpu,
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  return { port, kill: () => p.kill('SIGKILL') };
}
const PORT = process.argv[2] ?? process.env.PORTA ?? 8748;
const b = await launch(9381 + Math.floor(Math.random() * 10));
const MB = (v) => Math.round(v / 1048576);
async function rodada(nome, celular) {
  const t0 = Date.now();
  const P = await open(b, `http://127.0.0.1:${PORT}/index.html?teste=1`, nome);
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); // a aba precisa estar visível para o requestAnimationFrame rodar
  console.error('[' + nome + '] aberta');
  if (celular) {
    await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 2, mobile: true });
    await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await P.raw('Emulation.setCPUThrottlingRate', { rate: 4 });
    await P.raw('Page.reload', {});
  }
  await until(() => P.ev('!!(window.game?.map && game.ui?.state === "play")'), 120000, 300);
  const abrir = Date.now() - t0; console.error('[' + nome + '] jogo aberto em', abrir, 'ms');
  await P.ev(`import('/tools/jornadas-teste.js').then(() => 1)`);
  await sleep(2000);
  // anda (teleporte suave a cada quadro) e mede o tempo de cada quadro do próprio jogo
  const andar = (x0, y0, x1, y1, s) => P.ev(`new Promise((ok) => {
    const G = game, p = G.player, T0 = performance.now(), dts = [], logs = [];
    let last = T0; tp(${x0}, ${y0});
    const fr = G.frame; let n = 0; G.frame = function (dt) { const a = performance.now(); fr.call(this, dt); if (++n > 40) logs.push(performance.now() - a); }; // os primeiros quadros depois do teleporte não contam
    const f = () => { const t = performance.now(), k = Math.min(1, (t - T0) / ${s * 1000}); if (t - T0 > 700) dts.push(t - last); last = t;
      p.x = (${x0} + (${x1} - ${x0}) * k) * 16 + 8; p.y = (${y0} + (${y1} - ${y0}) * k) * 16 + 8; G.cam.x = p.x; G.cam.y = p.y;
      if (k < 1) requestAnimationFrame(f); else { G.frame = fr; dts.shift(); dts.sort((a, b) => a - b); logs.sort((a, b) => a - b); ok({ logica_ms: +(logs.reduce((a, b) => a + b, 0) / logs.length).toFixed(2), logica_pior: Math.round(logs[logs.length - 1]), fps: Math.round(1000 / (dts.reduce((a, b) => a + b, 0) / dts.length)), p95: Math.round(dts[Math.floor(dts.length * 0.95)]), pior: Math.round(dts[dts.length - 1]), setores: G.map.chunks.filter((c) => c.built).length, regioes: G.map.nPend }); } };
    requestAnimationFrame(f); })`);
  const mem = async () => P.ev(`(performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1)`);
  const r = { nome, abrir_ms: abrir, monta_ms: await P.ev('game.map.tempoCarga'), mem_mb: await mem() };
  r.nucleo = await andar(250, 340, 322, 330, 6); // ~12 blocos/s (montado, correndo)
  r.para_regiao = await P.ev('game.map.nPend') != null ? await andar(470, 203, 650, 205, 15) : null; // Aurora → Sertão (montado sob demanda)
  r.montagens = await P.ev('game.map.estat ?? []');
  r.mem_depois_mb = await mem();
  const t1 = Date.now();
  if (await P.ev('!!game.viagem')) {
    await P.ev(`game.viagem.ir('ocaso', 'porto_rubro_cais').then(() => 1)`);
    await until(() => P.ev(`game.map.id === 'ocaso' && !game.viagem.ocupada`), 60000, 100);
    r.troca_ocaso_ms = Date.now() - t1; r.troca = await P.ev('game.viagem.ultimaTroca');
    r.ocaso = await andar(925, 360, 865, 340, 5);
    r.mem_ocaso_mb = await mem();
  }
  console.log(JSON.stringify(r));
  await P.close();
}
try { await rodada('computador', false); await rodada('celular', true); } finally { b.kill(); }
