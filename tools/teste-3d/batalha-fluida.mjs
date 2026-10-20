// Batalha fluida: grava uma sequência de quadros de uma luta (selvagem ou de ginásio) e mede o FPS durante a luta.
// Só desenvolvimento.  python3 tools/serve.py 8763   e depois:
//   PORT=8763 node tools/teste-3d/batalha-fluida.mjs selvagem|ginasio [quadros=20] [fps=10]
// Variáveis: CEL=1 (padrão; celular deitado 844x390, toque), LENT=4 (CPU 4x mais lenta na medida de FPS),
//   SEG=10 (segundos medidos), OUT=pasta das fotos (padrão tools/shots/fluida), TAG=prefixo dos arquivos,
//   SOFPS=1 (só mede), SOFOTO=1 (só grava), KO=1 (deixa o adversário desmaiar durante a gravação).
// Saída: <OUT>/<TAG>-<modo>-NN.jpg, uma tira <OUT>/<TAG>-<modo>-tira.jpg (ffmpeg) e uma linha JSON com o FPS.
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [modo = 'selvagem', nq = '20', fq = '10'] = process.argv.slice(2);
const CEL = process.env.CEL !== '0', W = +(process.env.W ?? (CEL ? 844 : 1280)), H = +(process.env.H ?? (CEL ? 390 : 720));
const OUT = process.env.OUT ?? 'tools/shots/fluida', TAG = process.env.TAG ?? 'depois';
mkdirSync(OUT, { recursive: true });

// piloto de teste: o seu Pokémon anda o tempo todo (aproxima, contorna, recua) e usa os golpes em rodízio pela
// mesma porta do jogador (combat.use com mira no alvo). Assim a gravação mostra a luta andando, sem teletransporte.
const PILOTO = () => `(() => {
  const G = window.game; let slot = 0, tG = 0, lado = 1, tL = 0, t0 = G.time;
  clearInterval(window.__piloto);
  window.__piloto = setInterval(() => {
    const dt = G.time - t0; t0 = G.time; if (dt <= 0) return; // relógio do jogo (a gravação roda em câmera lenta)
    const L = G.lead, inp = G.input; if (!L?.alive) { inp.move.x = inp.move.y = 0; return; }
    const b = G.story?.battle, alvos = (b ? b.active : G.entities).filter((e) => e.alive && !e.dead && e.side !== 'ally' && e.mon);
    if (!alvos.length) { inp.move.x = inp.move.y = 0; return; }
    const w = alvos.reduce((m, e) => (Math.hypot(e.x - L.x, e.y - L.y) < Math.hypot(m.x - L.x, m.y - L.y) ? e : m));
    const dx = w.x - L.x, dy = w.y - L.y, d = Math.hypot(dx, dy) || 1;
    if ((tL -= dt) <= 0) { tL = 1 + Math.random() * 1.4; lado = Math.random() < 0.5 ? 1 : -1; }
    let mx = -dy / d * 0.8 * lado, my = dx / d * 0.8 * lado;
    if (d > 80) { mx += dx / d; my += dy / d; } else if (d < 40) { mx -= dx / d; my -= dy / d; }
    const l = Math.hypot(mx, my) || 1; inp.move.x = mx / l; inp.move.y = my / l;
    if ((tG -= dt) <= 0) { tG = 0.7 + Math.random() * 0.5; const n = L.mon.moves.length || 1; for (let k = 0; k < n; k++) { const s = (slot++) % n; if (!L.cds[s]) { G.combat.use(L, s, w.x, w.y - 8); break; } } }
    if (!${process.env.KO === '1'}) for (const e of alvos) if (e.mon.hp < e.mon.stats.hp * 0.25) e.mon.hp = e.mon.stats.hp; // a luta não acaba no meio da gravação
    if (L.mon.hp < L.mon.stats.hp * 0.3) L.mon.hp = L.mon.stats.hp;
  }, 33);
  return 1;
})()`;

const SELVAGEM = () => `(async () => {
  const G = window.game, espera = (ms) => new Promise((r) => setTimeout(r, ms));
  G.player.x = 318 * 16; G.player.y = 292 * 16; G.cam.x = G.player.x; G.cam.y = G.player.y; G.mundo.setHour(11);
  const { Mon } = await import('/src/data/mon.js');
  const VIT = ${modo === 'vitrine'};
  G.party = VIT ? [new Mon(6, 40), new Mon(25, 30)] : [new Mon(25, 30), new Mon(4, 28)]; G.leadIdx = 0; G.hudLead(); G.hudMoves();
  if (VIT) { G.party[0].item = 'charizarditeX'; G.bag.megaBracelet = 1; }
  for (let k = 0; k < 6 && !G.wilds.some((q) => q.alive); k++) await G.spawnWild();
  const w = G.wilds.find((q) => q.alive);
  for (const o of G.wilds) if (o !== w) o.x += 4000;
  w.x = G.player.x + 80; w.y = G.player.y - 30; w.mon.level = VIT ? 50 : 28; w.mon.calc?.(); w.mon.hp = w.mon.stats.hp;
  w.ai.state = 'aggro'; w.aggroTarget = G.player;
  G.throwMon(0, G.player.x + 30, G.player.y - 10); await espera(1500);
  w.aggroTarget = G.lead; w.provoke?.(G.lead);
  // vitrine: Mega Evolução logo de cara e o selvagem fraco (desmaia na gravação: quadro de impacto + faixa)
  return w.mon.name;
})()`;

const GINASIO = `(async () => {
  const G = window.game;
  await import(location.origin + '/tools/jornadas-teste.js');
  const { Mon } = await import('/src/data/mon.js');
  G.party = [[66, 24], [4, 23], [7, 23]].map(([d, l]) => new Mon(d, l)); G.leadIdx = 0; G.hudLead(); G.hudMoves();
  G.mundo.setHour(11); tp(128, 383); await new Promise((r) => setTimeout(r, 1200));
  const { montarEquipe, nomeBatalha } = await import('/src/story/especies.js');
  const L1 = (await import('/src/story/chapter1.js')).LEADER1;
  const team = montarEquipe(L1.team, G.flags.rivalStarter ?? 7);
  const def = { id: L1.id, name: nomeBatalha(L1.name, L1.team), money: 0, team: L1.team };
  const x = 128.5 * 16 + 8, y = 375.2 * 16 + 8;
  const npc = { x, y, h: 20, dir: 'down', faceTo() {}, throwPose() {}, goHome() {}, exclaim() {}, place(x, y, d) { this.x = x; this.y = y; this.dir = d; } };
  G.story.busy = false; window.__lutaP = G.story.fight(npc, def, { team });
  return 'ok';
})()`;

const b = await launch();
try {
  const P = await open(b, `http://127.0.0.1:${process.env.PORT ?? 8763}/index.html?teste=1&nosw`, 'p');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: CEL ? 2 : 1, mobile: CEL });
  if (CEL) { await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await P.raw('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' }); await P.raw('Page.reload', {}); await sleep(1500); }
  await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 90000, 300);
  await sleep(2500);
  // cena de abertura do teste (diálogo): Enter até sumir
  for (let k = 0; k < 60; k++) { const d = await P.ev('!!(game.ui.dialog?.open || game.ui.dialog?.d || game.story?.busy)'); if (!d) break; await P.ev("dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })), 1"); await sleep(250); }
  console.log('montando', modo, await P.ev(modo === 'ginasio' ? GINASIO : SELVAGEM()));
  if (modo === 'vitrine') process.env.KO = '1';
  if (modo === 'ginasio') { await until(() => P.ev('window.game.arenaGinasio?.contem === true && !!window.game.lead?.alive'), 40000, 300); await sleep(2500); }
  await P.ev(PILOTO());
  await sleep(2500);
  const res = { modo, tela: `${W}x${H}` };
  if (process.env.SOFOTO !== '1') {
    // FPS com a CPU mais lenta (celular): quadros do navegador (rAF), mediana e piores intervalos
    await P.raw('Emulation.setCPUThrottlingRate', { rate: +(process.env.LENT ?? 4) });
    await sleep(1500);
    await P.ev(`(() => { window.__fps = { n: 0, t0: performance.now(), q: [] }; let ant = performance.now();
      const f = () => { const a = performance.now(); const F = window.__fps; F.n++; F.q.push(a - ant); ant = a; if (!F.fim) requestAnimationFrame(f); }; requestAnimationFrame(f);
      window.v3d?.medir(); window.__prog0 = window.v3d?.renderer.info.programs.length; window.__progs0 = new Set(window.v3d?.renderer.info.programs);
      // tempo de CPU do quadro do jogo (lógica) e da camada de espetáculo (textos, quadro de impacto)
      const G = game, M = window.__ms = { fr: 0, show: 0, n: 0, frMax: 0 };
      if (!G.__frOrig) { G.__frOrig = G.frame.bind(G); G.frame = (dt) => { const a = performance.now(); G.__frOrig(dt); const d = performance.now() - a; window.__ms.fr += d; window.__ms.n++; window.__ms.frMax = Math.max(window.__ms.frMax, d); }; }
      if (G.show && !G.show.__orig) { G.show.__orig = G.show.update.bind(G.show); G.show.update = (a, b) => { const t = performance.now(); G.show.__orig(a, b); window.__ms.show += performance.now() - t; }; }
      return 1; })()`);
    if (process.env.PROF === '1') { await P.raw('Profiler.enable'); await P.raw('Profiler.setSamplingInterval', { interval: 200 }); await P.raw('Profiler.start'); }
    await sleep(+(process.env.SEG ?? 10) * 1000);
    if (process.env.PROF === '1') { // funções com mais tempo próprio (amostras)
      const { result } = await P.raw('Profiler.stop'); const pr = result.profile, self = new Map(), por = new Map(pr.nodes.map((n) => [n.id, n]));
      const dt = pr.timeDeltas, tot = dt.reduce((a, b) => a + b, 0);
      pr.samples.forEach((id, i) => { const n = por.get(id), f = n.callFrame, k = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber + 1}`; self.set(k, (self.get(k) ?? 0) + (dt[i] ?? 0)); });
      const pai = new Map(); for (const n of pr.nodes) for (const c of n.children ?? []) pai.set(c, n);
      const cadeia = new Map(); // para cada função: quem chamou (3 níveis), a mais comum
      pr.samples.forEach((id, i) => { const n = por.get(id), f = n.callFrame, k = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber + 1}`; let p = pai.get(n.id), c = []; for (let j = 0; j < 4 && p; j++) { c.push(p.callFrame.functionName || '(anon)'); p = pai.get(p.id); } const m = cadeia.get(k) ?? new Map(); const ck = c.join('<'); m.set(ck, (m.get(ck) ?? 0) + (dt[i] ?? 0)); cadeia.set(k, m); });
      res.perfil = [...self].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${(v / tot * 100).toFixed(1)}% ${k}  <= ${[...(cadeia.get(k) ?? new Map())].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''}`);
    }
    Object.assign(res, await P.ev(`(() => { const F = window.__fps; F.fim = 1; const dt = (performance.now() - F.t0) / 1000, q = F.q.slice(5).sort((a, b) => a - b);
      return { fps: +(F.n / dt).toFixed(1), p50: +q[Math.floor(q.length * 0.5)].toFixed(1), p95: +q[Math.floor(q.length * 0.95)].toFixed(1), pior: +q[q.length - 1].toFixed(1),
        acima50ms: q.filter((x) => x > 50).length, logicaMs: +(window.__ms.fr / Math.max(1, window.__ms.n)).toFixed(2), logicaMax: +window.__ms.frMax.toFixed(1), showMs: +(window.__ms.show / Math.max(1, window.__ms.n)).toFixed(3), quadros: q.length, qualidade: game.quality.level, ms3d: window.v3d?.medir(), programas: [window.__prog0, window.v3d?.renderer.info.programs.length], novos: (window.v3d?.renderer.info.programs ?? []).filter((p) => !window.__progs0.has(p)).map((p) => p.name + ' | ' + String(p.cacheKey).slice(0, 160)), particulas: game.fx.count, draw: window.v3d?.ultInfo?.calls }; })()`));
    await P.raw('Emulation.setCPUThrottlingRate', { rate: 1 });
    await sleep(800);
  }
  if (process.env.SOFPS !== '1') {
    // a captura de tela do Chrome sem interface é lenta (~1 s): o jogo roda em câmera lenta (ticker.speed) e cada foto
    // sai a cada 1/fps s de TEMPO DE JOGO, então a tira mostra o movimento como ele é
    const n = +nq, passo = 1000 / +fq, arqs = [], LENTO = +(process.env.LENTO ?? 0.04);
    await P.ev(`(() => { game.app.ticker.speed = ${LENTO}; window.__tj = 0; game.app.ticker.add((t) => { window.__tj += t.deltaMS; }); return 1; })()`);
    // vitrine: a Mega acontece já gravando; 2,6 s de jogo depois o selvagem fica fraco e desmaia na frente da câmera
    if (modo === 'vitrine') await P.ev(`(() => { const G = game; G.poder.usar(); G.later(1.6, () => { if (G.lead) G.lead.critBoost = 99; }); G.later(2.6, () => { const w = G.wilds.find((q) => q.alive); if (w) w.mon.hp = Math.max(1, Math.round(w.mon.stats.hp * 0.15)); }); return 1; })()`);
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await until(() => P.ev(`window.__tj >= ${i * passo}`), 60000, 20);
      await P.ev('game.app.ticker.speed = 0, 1');
      const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
      await P.ev(`game.app.ticker.speed = ${LENTO}, 1`);
      const f = `${OUT}/${TAG}-${modo}-${String(i).padStart(2, '0')}.jpg`; writeFileSync(f, Buffer.from(s.result.data, 'base64')); arqs.push(f);
    }
    await P.ev('game.app.ticker.speed = 1, 1');
    res.gravacao = { quadros: n, segundos: +((Date.now() - t0) / 1000).toFixed(1) };
    const tira = `${OUT}/${TAG}-${modo}-tira.jpg`;
    const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '10', '-i', `${OUT}/${TAG}-${modo}-%02d.jpg`, '-vf', `scale=422:-1,tile=4x${Math.ceil(n / 4)}`, '-frames:v', '1', tira]);
    if (r.status === 0) res.tira = tira;
  }
  const errs = P.logs.filter((l) => /EXC|rror/.test(l) && !/favicon|net::/.test(l));
  res.erros = [...new Set(errs)].slice(0, 8);
  console.log(JSON.stringify(res));
} finally { b.kill(); }
