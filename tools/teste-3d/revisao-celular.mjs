// Revisão completa no celular simulado (740x360 deitado, toque, GPU de verdade), do jogo novo ao save:
// título → conta de teste → criador → história (professor, inicial, primeira batalha) → captura → Centro →
// Mercado → montaria → menus (Pokédex, missões) → salvar → recarregar e continuar. Capturas em tools/shots/rev-*.jpg.
// A conta é local (deste navegador de teste, apagado no fim) e a senha é gerada aqui; nada é mostrado.
//   python3 tools/serve.py 8760 ; PORT=8760 node tools/teste-3d/revisao-celular.mjs
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const PORT = process.env.PORT ?? 8760, URL0 = `http://127.0.0.1:${PORT}/index.html`;
const out = new URL('../shots/', import.meta.url); mkdirSync(out, { recursive: true });
const nome = 'Rev' + randomBytes(2).toString('hex'), senha = randomBytes(9).toString('base64url');
const res = [];
const b = await launch();
try {
  const P = await open(b, 'about:blank', 'rev');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 740, height: 360, deviceScaleFactor: 2, mobile: true });
  await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await P.raw('Page.navigate', { url: URL0 });
  const foto = async (n) => { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); writeFileSync(new URL(`rev-${n}.jpg`, out), Buffer.from(s.result.data, 'base64')); res.push(n); };
  const passo = async (n, fn) => { try { const r = await fn(); console.log('ok ', n, r ?? ''); } catch (e) { console.log('ERRO', n, e.message.slice(0, 200)); } };
  await until(() => P.ev('!!document.querySelector("#title .tt-panel button")'), 90000, 400);
  await sleep(1500); await foto('1-titulo');
  await passo('conta', async () => {
    await P.ev(`document.querySelector('#title [data-a=create]').click(), 1`); await sleep(600);
    await P.ev(`(() => { const q = (s) => document.querySelector('#title ' + s); q('.nm').value = ${JSON.stringify(nome)}; q('.p1').value = ${JSON.stringify(senha)}; q('.p2').value = ${JSON.stringify(senha)}; q('.tt-go').click(); return 1; })()`);
    await until(() => P.ev('!!document.querySelector("#title .cc")'), 15000, 300); await sleep(800); await foto('2-criador');
    await P.ev(`document.querySelector('#title .tt-go').click(), 1`);
  });
  await until(() => P.ev('!!(window.game && game.ui?.state === "play")'), 60000, 400);
  await P.ev(`import('/tools/jornadas-teste.js').then(() => 1)`);
  await sleep(2500); await foto('3-inicio');
  await passo('historia', async () => {
    await P.ev('(motor(), 1)');
    // a história pede para ir ao laboratório: leva o jogador até a porta de dentro (o resto a cena faz)
    await sleep(3000);
    await P.ev(`(() => { const s = Object.keys(game.map.spots).find((k) => k.startsWith('dentro_lab')); const p = game.map.spots[s]; if (p) { game.player.x = p.x; game.player.y = p.y; game.cam.x = p.x; game.cam.y = p.y; } return s; })()`);
    const ok = await until(() => P.ev('game.party.length > 0'), 150000, 1000);
    await sleep(1500); await foto('4-inicial');
    return 'equipe ' + (await P.ev('game.party.map((m) => m.name).join(",")')) + (ok ? '' : ' (sem inicial)');
  });
  await passo('primeira batalha', async () => {
    const r = await until(() => P.ev('!!(game.story?.battle && !game.story.battle.done) || !!game.flags.rival1'), 90000, 800);
    if (await P.ev('!!(game.story?.battle && !game.story.battle.done)')) { await P.ev('(window.lutar?.(60), 1)'); await sleep(2500); await foto('5-batalha'); }
    await until(() => P.ev('!!game.flags.rival1'), 120000, 1000);
    return 'rival1=' + (await P.ev('game.flags.rival1 ?? "—"')) + (r ? '' : ' (não começou)');
  });
  await passo('captura', async () => {
    await P.ev(`(async () => { const g = game; g.bag.pokeball = (g.bag.pokeball ?? 0) + 10; tp(318, 292); await new Promise((r) => setTimeout(r, 800));
      for (let k = 0; k < 6 && !g.wilds.some((w) => w.alive); k++) await g.spawnWild();
      const w = g.wilds.find((q) => q.alive); if (!w) return 'sem selvagem'; w.x = g.player.x + 40; w.y = g.player.y - 10; w.mon.hp = 1; w.ai.state = 'sleep';
      g.mode = 'trainer'; g.throwBall(w.x, w.y - 6); return 1; })()`);
    await sleep(1200); await foto('6-captura');
    await sleep(3000);
    return 'equipe ' + (await P.ev('game.party.length')) + ', caixa ' + (await P.ev('game.box.length'));
  });
  await passo('Centro', async () => { const k = await P.ev(`(() => { const s = Object.keys(game.map.spots).find((q) => q.startsWith('dentro_centro')); const p = game.map.spots[s]; game.player.x = p.x; game.player.y = p.y; game.cam.x = p.x; game.cam.y = p.y; return s; })()`); await sleep(2500); await foto('7-centro'); return k; });
  await passo('Mercado', async () => { const k = await P.ev(`(() => { const s = Object.keys(game.map.spots).find((q) => q.startsWith('dentro_loja')); const p = game.map.spots[s]; game.player.x = p.x; game.player.y = p.y; game.cam.x = p.x; game.cam.y = p.y; return s; })()`); await sleep(2500); await foto('8-mercado'); return k; });
  await passo('montaria', async () => { await P.ev(`(async () => { tp(318, 292); await new Promise((r) => setTimeout(r, 700)); game.unlockMount('correr', { silent: true }); await game.mount.call('correr'); return 1; })()`); await sleep(2000); await foto('9-montaria'); });
  await passo('menus', async () => {
    await P.ev('(game.mount.active && game.mount.dismount(), 1)'); await sleep(800);
    await P.ev('(game.ui.openMenu(), 1)'); await sleep(900); await foto('10-menu');
    const abas = await P.ev(`[...document.querySelectorAll('#ui .gm-tile, #ui [data-go], #ui .nav')].slice(0, 30).map((e) => e.dataset.go ?? e.dataset.k ?? e.textContent.trim().slice(0, 18))`);
    const clica = async (re) => P.ev(`(() => { const e = [...document.querySelectorAll('#ui button, #ui .nav, #ui [data-go]')].find((q) => ${re}.test(q.textContent)); if (!e) return 0; e.click(); return 1; })()`);
    if (await clica('/Pok[eé]dex/i')) { await sleep(900); await foto('11-pokedex'); await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })), 1`); await sleep(500); }
    if (await clica('/Miss/i')) { await sleep(900); await foto('12-missoes'); await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })), 1`); await sleep(500); }
    await P.ev(`(game.ui.closeMenu?.() ?? dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })), 1)`);
    return abas.length + ' itens no menu';
  });
  await passo('salvar e recarregar', async () => {
    const antes = await P.ev('({ x: Math.round(game.player.x), n: game.party.length })');
    await P.ev('(game.ui.save?.() ?? game.ui.saveGame?.(), 1)'); await sleep(1200);
    await P.raw('Page.reload', {}); await until(() => P.ev('!!document.querySelector("#title .tt-acc")'), 60000, 500);
    await P.ev(`document.querySelector('#title .tt-acc').click(), 1`); await sleep(500);
    await P.ev(`(() => { const i = document.querySelector('#title input[type=password]'); i.value = ${JSON.stringify(senha)}; document.querySelector('#title .tt-go').click(); return 1; })()`); await sleep(1200);
    await P.ev(`(() => { const c = [...document.querySelectorAll('#title button')].find((q) => /Continuar/i.test(q.textContent)); c?.click(); return !!c; })()`);
    await until(() => P.ev('!!(window.game && game.ui?.state === "play")'), 60000, 500); await sleep(2500); await foto('13-continuou');
    const depois = await P.ev('({ x: Math.round(game.player.x), n: game.party.length })');
    return `antes ${JSON.stringify(antes)} depois ${JSON.stringify(depois)}`;
  });
  const erros = [...new Set(P.logs.filter((l) => /EXC|rror/.test(l)))];
  console.log('console:', erros.length ? erros.slice(0, 12).join('\n') : 'sem erros');
  console.log('capturas:', res.join(', '));
} finally { b.kill(); }
