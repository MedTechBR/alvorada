// Teste das arenas dos ginásios lutando de verdade (Chrome sem interface via CDP, robô tools/arenas-bot.js).
// (cópia do arenas-teste.mjs com a GPU de verdade: o 3D no SwiftShader fica lento demais)
//   python3 tools/serve.py 8752      (noutro terminal)
//   node tools/arenas-teste.mjs [tome|lia|marina|marina_pier|jonas|zelia|bras|graca|celeste|todos] [--celular] [--fotos] [--vezes=N]
// Para cada líder: monta a equipe do nível do ginásio, cumpre as condições da cena, fala com o líder e deixa o robô
// lutar (sem dano forçado). Mostra: resultado, duração (tempo de jogo), fases e quando entraram, golpes da arena por
// lado, o menor aviso que um perigo deu antes de acertar, golpes sem aviso (tem que ser 0) e erros do console.
// --fotos: salva capturas de cada fase em tools/shots/arena-<lider>-<fase>.jpg. --celular: tela de celular, toque e
// CPU 4× mais lenta (mede quadros por segundo durante 15 s de luta, sem acelerar o tempo).
import { launch, open, until, sleep } from './teste-3d/chrome.mjs';

const PORTA = process.env.PORTA ?? 8752, URL = `http://127.0.0.1:${PORTA}/?teste&nosw`;
const args = process.argv.slice(2), quem = args.find((a) => !a.startsWith('--')) ?? 'todos';
const CEL = args.includes('--celular'), FOTOS = args.includes('--fotos'), VEZES = +(args.find((a) => a.startsWith('--vezes='))?.split('=')[1] ?? 1);

// equipe do jogador (dex, nível) e como chegar na luta
const CASOS = {
  jonas: { equipe: [[4, 12], [7, 11], [1, 11]], sala: 'farol_topo', em: [4, 8], flags: { 'trainers.g4_saulo': true, 'trainers.g4_duda': true, geradoresLigados: true, farolDentro: true }, falar: 'jonas' },
  marina: { equipe: [[25, 15], [1, 15], [4, 14]], sala: 'galpao_barcos', em: [10, 13], flags: { 'trainers.g3_zeca': true, 'trainers.g3_taina': true }, falar: 'marina' },
  marina_pier: { equipe: [[25, 15], [1, 15], [4, 14]], perto: [435, 305], flags: { 'trainers.c3_ebano': true, 'trainers.g3_zeca': true, 'trainers.g3_taina': true }, cena: ['cap03', 'marina_pier'] },
  tome: { equipe: [[66, 16], [4, 15], [7, 15]], perto: [128, 383], flags: { 'trainers.g1_icaro': true, 'trainers.g1_rui': true, campina: true }, falar: 'leader_tome' },
  zelia: { equipe: [[5, 20], [8, 20], [25, 19]], sala: 'casarao_velas', em: [40, 13], flags: { candelabrosAcesos: true, 'trainers.g5_odete': true, 'trainers.g5_ciro': true }, falar: 'zelia', noite: true },
  lia: { equipe: [[5, 21], [8, 21], [2, 20]], sala: 'estufa_lia', em: [11, 15], flags: { defendeuEstufa: true, 'trainers.g2_nando': true, 'trainers.g2_bel': true }, falar: 'lia' },
  // planejadas: mesma arena num campo aberto (prova de que o motor serve para elas)
  bras: { equipe: [[17, 25], [5, 24], [8, 24]], planejada: { nome: 'Líder Brás', equipe: [[67, 21], [701, 22], [447, 22], [214, 23], [237, 25]], w: 18, h: 12 } },
  graca: { equipe: [[9, 43], [3, 42], [6, 42]], planejada: { nome: 'Líder Graça', equipe: [[525, 39], [933, 40], [95, 40], [476, 41], [745, 43]], w: 18, h: 12 } },
  celeste: { equipe: [[26, 41], [6, 40], [9, 40]], planejada: { nome: 'Líder Celeste', equipe: [[277, 37], [227, 38], [334, 39], [663, 39], [628, 41]], w: 18, h: 12 } },
};
const ORDEM = ['jonas', 'marina', 'marina_pier', 'tome', 'zelia', 'lia', 'bras', 'graca', 'celeste'];
const lista = quem === 'todos' ? ORDEM : quem === 'existentes' ? ORDEM.slice(0, 6) : quem.split(',');

async function caso(b, nome, rodada) {
  const C = CASOS[nome]; if (!C) throw new Error('caso desconhecido ' + nome);
  const p = await open(b, URL, nome);
  if (CEL) {
    await p.raw('Emulation.setDeviceMetricsOverride', { width: 412, height: 860, deviceScaleFactor: 2, mobile: true });
    await p.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await p.raw('Page.reload', {});
  }
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`); await p.ev(`import(location.origin + '/tools/arenas-bot.js')`);
  if (CEL) await p.raw('Emulation.setCPUThrottlingRate', { rate: 4 });
  await sleep(500);
  // equipe, flags e lugar
  await p.ev(`(async () => {
    const G = window.game, { Mon } = await import('/src/data/mon.js');
    G.party = ${JSON.stringify(C.equipe)}.map(([d, l]) => new Mon(d, l));
    G.leadIdx = 0; G.hudLead(); G.hudMoves();
    G.bag.potion = 0; G.bag.superPotion = 0; // sem remédio: a luta é só a luta
    const set = (k, v) => { const ps = k.split('.'); let o = G.flags; while (ps.length > 1) o = (o[ps[0]] ??= {}), ps.shift(); o[ps[0]] = v; };
    for (const [k, v] of Object.entries(${JSON.stringify(C.flags ?? {})})) set(k, v);
    G.flags.badges ??= [];
    ${C.noite ? 'G.mundo.setHour(22);' : 'G.mundo.setHour(11);'}
    window.__arenaUltima = null; window.__fotos = [];
    // aba sem interface: o requestAnimationFrame quase não roda, então as animações presas ao ticker (arremesso da bola)
    // passam a andar junto com os quadros do motor
    const tk = G.app.ticker, extra = new Set(), add0 = tk.add.bind(tk), rem0 = tk.remove.bind(tk);
    tk.add = (fn, ctx, pr) => { extra.add(fn); return tk; }; tk.remove = (fn, ...a) => (extra.delete(fn) ? tk : rem0(fn, ...a));
    const fr0 = G.frame.bind(G); G.frame = (dt) => { fr0(dt); tk.deltaMS = dt * 1000; for (const f of [...extra]) f(tk); };
    window.__foto = (n) => { G.app.renderer.render(G.app.stage); G.app.canvas.toBlob((bl) => fetch('/__shot?n=' + n, { method: 'POST', body: bl }), 'image/jpeg', 0.82); window.__fotos.push(n); };
    motor(true);
  })()`);
  if (C.sala) await p.ev(`(() => { const G = window.game, r = G.map.interiors.find((q) => q.id === '${C.sala}'); tp(r.x + ${C.em?.[0] ?? 2}, r.y + ${C.em?.[1] ?? 2}); })()`);
  if (C.perto) await p.ev(`tp(${C.perto[0]}, ${C.perto[1]})`);
  await sleep(1200);
  // começa a luta
  if (C.planejada) {
    const P = C.planejada;
    const ok = await p.ev(`(async () => {
      const G = window.game, { arenaEm } = await import('/src/data/arenas.js'), m = G.map, p0 = G.player;
      // procura um campo aberto ${P.w}x${P.h} perto do começo
      const livre = (x0, y0) => { for (let y = y0 - 3; y < y0 + ${P.h} + 3; y++) for (let x = x0 - 3; x < x0 + ${P.w} + 3; x++) if (m.solidAt(x * 16 + 8, y * 16 + 8) || m.interiorAt(x * 16 + 8, y * 16 + 8) || m.objectAt?.(x, y)) return false; return true; };
      let at = null; const sx = Math.floor(m.spawn.x / 16), sy = Math.floor(m.spawn.y / 16);
      for (let r = 0; r < 80 && !at; r += 2) for (let a = 0; a < 16 && !at; a++) { const x = sx + Math.round(Math.cos(a / 16 * 6.28) * r), y = sy + Math.round(Math.sin(a / 16 * 6.28) * r); if (livre(x, y)) at = [x, y]; }
      if (!at) return 'sem campo';
      const cfg = arenaEm('leader_${nome}', { area: [at[0], at[1], ${P.w}, ${P.h}] });
      const pl = cfg.posicoes.lider, pj = cfg.posicoes.jogador;
      tp(pj[0], pj[1]);
      const npc = { x: pl[0] * 16 + 8, y: pl[1] * 16 + 8, h: 20, faceTo() {}, throwPose() {}, goHome() {}, exclaim() {}, place(x, y) { this.x = x; this.y = y; } };
      const { Mon } = await import('/src/data/mon.js');
      const def = { id: 'leader_${nome}', name: '${P.nome}', money: 0, team: ${JSON.stringify(P.equipe)}, arenaGinasio: cfg };
      G.story.busy = false;
      window.__lutaP = G.story.fight(npc, def, { team: def.team.map(([d, l]) => new Mon(d, l)) });
      return 'ok ' + at.join(',');
    })()`);
    if (!String(ok).startsWith('ok')) { console.log(nome, ok); await p.close(); return null; }
  } else if (C.cena) { // toca a cena direto (a mesma que falar com a líder no lugar certo tocaria)
    await p.ev(`(async () => { const { CAPITULOS } = await import('/src/story/script/index.js'); const c = CAPITULOS.find((q) => q.id === '${C.cena[0]}'), s = c.cenas.find((q) => q.id === '${C.cena[1]}'); window.game.story.roteiro.tocar(c, s); return 'ok'; })()`);
  } else {
    // a primeira conversa pode ser outra cena (chegada, apresentação): fala de novo até a luta começar
    for (let k = 0; k < 4; k++) {
      const r = await p.ev(`(() => { const x = falar('${C.falar}'); return typeof x === 'string' ? x : 'falando'; })()`);
      if (r !== 'falando') console.log(nome, 'não deu para falar:', r);
      const ok = await until(() => p.ev('!!window.game.story.battle || (!window.game.story.busy && !window.game.story.roteiro.rodando && !window.game.ui.dialog?.open)'), 60000, 400);
      await sleep(600);
      if (await p.ev('!!window.game.story.battle')) break;
      void ok;
    }
  }
  const comecou = await until(() => p.ev('!!window.game.story.battle?.arena'), 60000, 300);
  if (!comecou) { console.log(nome, 'a luta com arena não começou', await p.ev('JSON.stringify({b: !!window.game.story.battle, falas: window.falas.slice(-6)})')); await p.close(); return null; }
  // fotos: ao entrar em cada fase (depois da cena) e no meio da ação
  await p.ev(`(() => {
    const G = window.game, A = G.story.battle.arena, nome = '${nome}';
    const tira = (n, s) => { const t0 = G.time; const f = () => { if (A.done) return; if (G.time - t0 >= s) { if (${FOTOS}) window.__foto('arena-' + nome + '-' + n); } else setTimeout(f, 60); }; f(); };
    A.onEvento((ev) => { if (ev.tipo === 'fase') { tira(ev.fase, 2.6); tira(ev.fase + '-acao', 9); } if (ev.tipo === 'as') tira('as', 0.5); });
    tira('abertura', 0.6); tira('inicio-acao', 7);
    bot.ligar({ reacao: 0.3, acerto: 0.85 }); lutar(false);
    window.__perf = { n: 0, ms: 0, max: 0 };
    const fr = G.frame.bind(G); G.frame = (dt) => { const t = performance.now(); fr(dt); const d = performance.now() - t; const P = window.__perf; P.n++; P.ms += d; P.max = Math.max(P.max, d); };
  })()`);
  let fps = null;
  if (CEL) { // celular simulado (CPU 4× mais lenta): custo da lógica e do desenho de um quadro no meio da luta
    await sleep(4000);
    await p.ev(`(() => { window.__perf = { n: 0, ms: 0, max: 0 }; window.__rend = []; window.__rendT = setInterval(() => { const G = window.game, t = performance.now(); G.app.renderer.render(G.app.stage); window.__rend.push(performance.now() - t); }, 400); })()`);
    await sleep(15000);
    fps = await p.ev(`(() => { clearInterval(window.__rendT); const d = window.__rend.sort((a, b) => a - b), m = d.reduce((a, b) => a + b, 0) / d.length, l = window.__perf.ms / window.__perf.n; return { logicaMs: +l.toFixed(2), desenhoMs: +m.toFixed(1), desenhoP95: +d[Math.floor(d.length * 0.95)].toFixed(1), quadroEstimadoFps: +(1000 / (l + m)).toFixed(0), particulas: window.game.fx.count, qualidade: window.game.quality.level }; })()`);
  }
  const fim = await until(() => p.ev('!!window.__arenaUltima'), CEL ? 600000 : 900000, 1000);
  const r = await p.ev(`(() => { const s = window.__arenaUltima, G = window.game; return s && { ...s, porPerigo: s.porPerigo, minAviso: s.minAviso === Infinity ? null : +s.minAviso.toFixed(2), bot: window.bot.stats, perf: { logicaMs: +(window.__perf.ms / window.__perf.n).toFixed(2), logicaMax: +window.__perf.max.toFixed(1) }, fotos: window.__fotos, equipeViva: G.party.filter((m) => !m.fainted).length }; })()`);
  await sleep(800);
  const erros = p.logs.filter((s) => /EXC|Error|error|falhou|não montou|desconhecida/.test(s) && !/favicon|ERR_|net::/.test(s));
  await p.ev('motor(false); bot.desligar()').catch(() => {});
  await p.close();
  return { nome, rodada, ...r, fps, erros: erros.slice(0, 6), fimOk: !!fim };
}

const b = await launch(+(process.env.CDP ?? 9473)); // porta própria: outros testes usam 9351
const todos = [];
try {
  for (const nome of lista) for (let i = 0; i < VEZES; i++) {
    const t0 = Date.now();
    let r = null; try { r = await caso(b, nome, i + 1); } catch (e) { console.log(nome, 'ERRO', e.message); }
    if (!r) continue;
    todos.push(r);
    console.log(`\n== ${nome}${VEZES > 1 ? ' #' + (i + 1) : ''}: ${r.resultado} em ${r.tempoJogo}s de jogo (${((Date.now() - t0) / 1000).toFixed(0)}s reais), equipe viva ${r.equipeViva}`);
    console.log('   fases:', (r.fases ?? []).map((f) => `${f.fase}@${f.t}s`).join(' → '));
    console.log(`   perigos que acertaram: seu lado ${r.acertos?.ally}, líder ${r.acertos?.foe} · por perigo ${JSON.stringify(r.porPerigo)}`);
    console.log(`   avisos ${r.avisos} · menor aviso antes de acertar ${r.minAviso}s · golpes sem aviso ${r.semAviso}`);
    console.log(`   robô: ${JSON.stringify(r.bot)} · lógica ${JSON.stringify(r.perf)}${r.fps ? ' · celular ' + JSON.stringify(r.fps) : ''}`);
    if (r.fotos?.length) console.log('   fotos:', r.fotos.join(', '));
    if (r.erros.length) console.log('   ERROS:', r.erros);
  }
} finally { b.kill(); }
if (process.env.JSON) console.log(JSON.stringify(todos));
