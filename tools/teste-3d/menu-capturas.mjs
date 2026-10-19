// Capturas de todas as telas do menu nos 4 tamanhos de referência: tools/shots/rb/<prefixo>-<WxH>-<tela>.jpg
//   python3 tools/serve.py 8796 ; PORT=8796 node tools/teste-3d/menu-capturas.mjs antes|depois [WxH ...]
import { sessao, sleep } from './rb-lib.mjs';
import { mkdirSync } from 'node:fs';
import { copyFileSync, existsSync } from 'node:fs';
const pre = process.argv[2] ?? 'depois';
const TAM = (process.argv.length > 3 ? process.argv.slice(3) : ['1280x720', '740x360', '844x390', '390x844']);
for (const t of TAM) {
  const [W, H] = t.split('x').map(Number), cel = W < 900;
  const s = await sessao({ W, H, cel });
  const { P } = s, ev = (x) => P.ev(x);
  const click = (sel, i = 0) => ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})][${i}]; if (!e) return false; e.click(); return true; })()`);
  const foto = async (n) => { await sleep(450); await s.foto(`${pre}-${t}-${n}`); };
  const back = async () => { await ev(`(window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true })), 1)`); await sleep(250); };
  const mover = async (m) => { await ev(`(game.ui.menu.close(), 1)`); await sleep(200); void m; };
  try {
    if (cel) await click('#rotate button, .rotate-ok, [data-a=rotate-ok]');
    await ev(`(() => { const g = game; g.party.forEach((m, i) => { m.level = 20 + i * 8; m.xp = m.xpFloor(); m.calc(); }); g.party[1].hp = Math.round(g.party[1].stats.hp * .45); g.party[2].hp = Math.round(g.party[2].stats.hp * .12); g.party[2].status = 'par';
      Object.assign(g.bag, { potion: 5, superPotion: 2, antidote: 3, paralyzeHeal: 2, awakening: 1, burnHeal: 2, iceHeal: 1, fullHeal: 1, revive: 1, greatBall: 6, ultraBall: 3, pokeBall: 12, oranBerry: 4, sitrusBerry: 2, tm001: 1, tm036: 1, tm_bite: 1, repel: 2 }); for (const m of g.party) for (const d of [1,4,7,25,16,19,10]) g.flags.dex ??= {}; for (const d of [1,2,4,7,10,16,19,25,39,52,54,63,66,74,92]) (g.flags.dex ??= {})[d] = d % 3 ? 2 : 1; return 1; })()`);
    const raiz = async () => { await ev(`(game.ui.menu.close(), 1)`); await sleep(200); await ev(`(game.ui.menu.open(), 1)`); await sleep(300); };
    const abrir = async (id) => { await raiz(); await click(`#gmenu .gm-main[data-id=${id}]`); await sleep(300); };
    await raiz(); await foto('01-principal');
    await abrir('party'); await foto('02-equipe');
    await click('#gmenu .gm-pcard', 0); await foto('03-equipe-opcoes');
    await click('#gmenu .gm-pop .nav', 0); await foto('04-resumo-info');
    for (const [p, n] of [[1, 'status'], [2, 'golpes']]) { await click('#gmenu .gm-extra .gm-tab', p); await foto(`0${5 + p - 1}-resumo-${n}`); }
    await abrir('party'); await click('#gmenu .gm-pcard', 0); await click('#gmenu .gm-pop .nav', 1); await foto('07-editar-golpes');
    await abrir('bag');
    for (let j = 0; j < 6; j++) { await click('#gmenu .gm-pockets .gm-tab', j); await foto(`08-mochila-${j}`); }
    for (const [id, n] of [['dex', '09-pokedex'], ['quests', '10-missoes'], ['map', '11-mapa'], ['card', '12-treinador'], ['mounts', '13-montarias'], ['options', '14-opcoes'], ['save', '15-salvar']]) { await abrir(id); await foto(n); }
    await ev(`(game.ui.menu.close(), 1)`); await sleep(300);
    await ev(`(game.box.push(game.party.pop()), 1)`);
    await ev(`(game.ui.menu.openPC(), 1)`); await foto('16-pc');
    await ev(`(game.ui.menu.close(), 1)`); await sleep(300);
    await ev(`(game.ui.menu.openShop(['potion', 'antidote', 'pokeBall', 'greatBall', 'tm001', 'tm036']), 1)`); await sleep(300);
    await click('#gmenu .gm-shopmain .nav', 0); await foto('17-loja');
    console.log(t, 'erros', JSON.stringify(s.erros()));
  } catch (e) { console.log(t, 'ERRO', e.message.slice(0, 200)); } finally { s.kill(); }
  await sleep(500);
}
