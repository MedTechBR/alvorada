// Capturas do polimento visual: título, criador, exploração, diálogo, batalhas, menus, loja. Só desenvolvimento.
//   python3 tools/serve.py 8830 & PORT=8830 node tools/teste-3d/polimento.mjs antes|depois [WxH ...]
// Saída: tools/shots/pol/<prefixo>-<WxH>-<nn>-<tela>.jpg. Um Chrome por vez; mata o Chrome ao fim.
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const pre = process.argv[2] ?? 'depois';
const TAM = process.argv.length > 3 ? process.argv.slice(3) : ['844x390'];
const PORT = process.env.PORT ?? 8830, SO = process.env.SO?.split(',');
const out = new URL('../shots/pol/', import.meta.url); mkdirSync(out, { recursive: true });
async function sessao(W, H, cel, qs) {
  const b = await launch();
  const P = await open(b, 'about:blank', 'pol');
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: cel ? 2 : 1, mobile: cel });
  if (cel) await P.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await P.raw('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html${qs}` });
  return { b, P };
}
const quer = (n) => !SO || SO.some((s) => n.includes(s));
for (const t of TAM) {
  const [W, H] = t.split('x').map(Number), cel = W < 900;
  const n0 = () => `${pre}-${t}-`;
  // ---- sessão A: título e criador (sem ?teste=1) ----
  if (quer('titulo') || quer('criador')) {
    const { b, P } = await sessao(W, H, cel, '');
    const foto = async (n) => { await sleep(700); const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 86 }); writeFileSync(new URL(n0() + n + '.jpg', out), Buffer.from(s.result.data, 'base64')); };
    try {
      await until(() => P.ev('!!document.querySelector("#title [data-a=create]")'), 90000, 400);
      await sleep(1200); await foto('01-titulo');
      const s = randomBytes(9).toString('base64url');
      await P.ev(`document.querySelector('#title [data-a=create]').click(), 1`); await sleep(500); await foto('01b-conta');
      await P.ev(`(() => { const q = (x) => document.querySelector('#title ' + x); q('.nm').value = 'Aurora'; q('.p1').value = ${JSON.stringify(s)}; q('.p2').value = ${JSON.stringify(s)}; q('.tt-go').click(); return 1; })()`);
      await until(() => P.ev('!!document.querySelector("#title .cc")'), 15000, 300); await sleep(500); await foto('02-criador');
      console.log(t, 'titulo/criador erros', JSON.stringify([...new Set(P.logs.filter((l) => /EXC|rror/.test(l)))]));
    } catch (e) { console.log('ERRO A', e.message.slice(0, 200)); } finally { b.kill(); }
    await sleep(600);
  }
  // ---- sessão B: o resto, em modo teste ----
  if (TAM && (!SO || SO.some((s) => !['titulo', 'criador'].includes(s)))) {
    const { b, P } = await sessao(W, H, cel, '?teste=1');
    const foto = async (n, ms = 450) => { await sleep(ms); const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 86 }); writeFileSync(new URL(n0() + n + '.jpg', out), Buffer.from(s.result.data, 'base64')); };
    const ev = (x) => P.ev(x);
    const click = (sel, i = 0) => ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})][${i}]; if (!e) return false; e.click(); return true; })()`);
    try {
      await until(() => P.ev('!!(window.game && game.ui && game.ui.state === "play")'), 120000, 300);
      await ev(`import('/tools/jornadas-teste.js').then(() => 1)`);
      await sleep(2500);
      if (cel) await click('#rotate button, .rotate-ok, [data-a=rotate-ok]');
      await ev(`(() => { const g = game; g.party.forEach((m, i) => { m.level = 20 + i * 8; m.xp = m.xpFloor() + Math.round((m.xpToNext() - m.xpFloor()) * (.3 + i * .2)); m.calc(); }); g.party[1].hp = Math.round(g.party[1].stats.hp * .45); g.party[2].hp = Math.round(g.party[2].stats.hp * .12); g.party[2].status = 'par';
        Object.assign(g.bag, { potion: 5, superPotion: 2, antidote: 3, paralyzeHeal: 2, awakening: 1, burnHeal: 2, iceHeal: 1, fullHeal: 1, revive: 1, greatBall: 6, ultraBall: 3, pokeBall: 12, oranBerry: 4, sitrusBerry: 2, tm001: 1, tm036: 1, tm_bite: 1, repel: 2 });
        for (const d of [1,2,4,7,10,16,19,25,39,52,54,63,66,74,92]) (g.flags.dex ??= {})[d] = d % 3 ? 2 : 1; return 1; })()`);
      // exploração
      await ev(`(() => { const s = game.map.spots.inicio; game.player.x = s.x; game.player.y = s.y + 20; game.cam.x = game.player.x; game.cam.y = game.player.y; game.mundo.setHour(10); return 1; })()`);
      await sleep(2000); await foto('03-explorando', 600);
      // diálogo
      ev(`game.ui.say(['Seja bem-vindo à região Alvorada! Aqui, Pokémon e treinadores vivem em harmonia.', 'Antes de partir, leve estas Poké Bolas.'], { name: 'Professor Carvalho', portrait: 25 })`).catch(() => {});
      await sleep(1800); await foto('04-dialogo', 900);
      await ev(`(game.ui.dialog.d && game.ui.dialog.d.res?.(0), game.ui.dialog.d = null, game.ui.dialog.el.hidden = true, document.body.classList.remove('dlg-open'), 1)`);
      await sleep(300);
      // batalha selvagem
      await ev(`(async () => { const g = game; g.player.x = 318 * 16; g.player.y = 292 * 16; g.cam.x = g.player.x; g.cam.y = g.player.y;
        for (let k = 0; k < 6 && !g.wilds.some((q) => q.alive); k++) await g.spawnWild(); const w = g.wilds.find((q) => q.alive); if (w) { w.x = g.player.x + 70; w.y = g.player.y - 50; w.ai.state = 'aggro'; w.aggroTarget = g.player; }
        g.throwMon(0, g.player.x + 20, g.player.y - 10); await new Promise((r) => setTimeout(r, 1500)); if (w) { w.x = g.player.x + 60; w.y = g.player.y - 50; w.hpShow = 9; w.mon.hp = Math.round(w.mon.stats.hp * .6); }
        const L = g.lead; if (L && w?.alive) { L.cds = [0, 0, 0, 0]; g.combat.use(L, 0, w.x, w.y - 8); } return 1; })()`);
      await foto('05-batalha-selvagem', 700);
      await ev(`(game.wilds.forEach((w) => w.alive && (w.mon.hp = 0)), 1)`); await sleep(1500);
      // batalha de treinador
      const tr = await ev(`(async () => { const g = game; const t = g.story.trainers.find((q) => !g.story.flags.trainers?.[q.def.id]); if (!t) return 'sem treinador';
        window.__trId = t.def.id; g.player.x = t.x; g.player.y = t.y + 26; g.player.dir = 'up'; g.cam.x = g.player.x; g.cam.y = g.player.y; return t.def.id; })()`);
      console.log('treinador', tr);
      await sleep(1500);
      ev(`(async () => { const g = game; const t = g.story.trainers.find((q) => q.def.id === window.__trId); const it = g.story.interactions().find((x) => x.o === t); if (it) await g.story.cut(it.fn); return 1; })()`).catch((e) => console.log('trainer', e.message.slice(0, 120)));
      await sleep(900); await foto('06a-treinador-fala', 200);
      await ev(`(() => { window.lutar(true); clearInterval(window.__auto); window.__auto = setInterval(() => { const d = game.ui.dialog.d; if (d) dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); window.passoLuta?.(); }, 150); return 1; })()`);
      await until(() => P.ev('!!(game.story.battle && !game.story.battle.done && game.story.battle.active.some((e) => e.alive))'), 40000, 400).catch(() => 0);
      await sleep(2500); await foto('06-batalha-treinador', 300);
      await ev(`(clearInterval(window.__auto), window.passoLuta = null, 1)`);
      // menus
      await ev(`(() => { game.story.battle?.finish?.('win'); game.wilds.forEach((w) => w.alive && (w.mon.hp = 0)); return 1; })()`).catch(() => 0);
      const raiz = async () => { await ev(`(game.ui.menu.close(), 1)`); await sleep(350); await ev(`(game.ui.menu.open(), 1)`); await sleep(500); };
      const abrir = async (id) => { await raiz(); await click(`#gmenu .gm-main[data-id=${id}]`); await sleep(400); };
      await raiz(); await foto('07-menu');
      await abrir('party'); await foto('08-equipe');
      await click('#gmenu .gm-pcard', 0); await sleep(300); await click('#gmenu .gm-pop .nav', 0); await foto('09-resumo');
      await abrir('bag'); await foto('10-mochila');
      await abrir('dex'); await foto('11-pokedex');
      await ev(`(game.ui.menu.close(), 1)`); await sleep(400);
      await ev(`(game.ui.menu.openShop(['potion', 'antidote', 'pokeBall', 'greatBall', 'tm001', 'tm036']), 1)`); await sleep(500);
      await click('#gmenu .gm-shopmain .nav', 0); await foto('12-loja');
      console.log(t, 'erros', JSON.stringify([...new Set(P.logs.filter((l) => /EXC|rror/.test(l)))]));
    } catch (e) { console.log(t, 'ERRO B', e.message.slice(0, 300)); } finally { b.kill(); }
  }
}
