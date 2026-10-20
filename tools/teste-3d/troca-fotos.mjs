// Fotos da troca no meio da luta (844x390, toque): luta de ginásio (Lia, no estádio) e o Ariados Alfa (chefe selvagem).
// Derruba um Pokémon do líder e um seu e fotografa logo depois (tem de aparecer só o aviso pequeno, sem faixa VS nem
// texto grande), e depois da vitória (os avisos de XP e de nível ficam na pilha do canto). Conta faixas grandes e VS.
//   python3 tools/serve.py 8752   e   PORTA=8752 node tools/teste-3d/troca-fotos.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, open, until, sleep } from './chrome.mjs';
const PORTA = process.env.PORTA ?? 8752, URL = `http://127.0.0.1:${PORTA}/?teste&nosw`;
const b = await launch(+(process.env.CDP ?? 9475));
const fotos = [], erros = [];
async function luta(nome, cfg) {
  const p = await open(b, URL, nome);
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
  await p.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await p.raw('Page.reload', {});
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`); await p.ev(`import(location.origin + '/tools/arenas-bot.js')`);
  mkdirSync('tools/shots', { recursive: true });
  const foto = async (n) => { const r = await p.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); const arq = `tools/shots/troca-${nome}-${n}.jpg`; writeFileSync(arq, Buffer.from(r.result.data, 'base64')); fotos.push(arq); return arq; };
  // contador de faixas grandes e da faixa VS da barra (MutationObserver: pega até as que duram pouco)
  await p.ev(`(() => { window.__faixas = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('banner')) window.__faixas.push({ t: window.game.time, s: n.textContent }); for (const m of ms) if (m.type === 'attributes' && m.target.classList?.contains('intro') && m.target.classList.contains('go')) window.__faixas.push({ t: window.game.time, s: 'VS da barra' }); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); })()`);
  const ok = await p.ev(`(async () => {
    const G = window.game, { Mon } = await import('/src/data/mon.js'), { CENAS } = await import('/src/story/jornada/index.js'), { montarEquipe, nomeBatalha } = await import('/src/story/especies.js');
    G.party = [new Mon(5, 24), new Mon(8, 23), new Mon(2, 23)]; G.leadIdx = 0; G.hudLead(); G.hudMoves();
    Object.assign(G.flags, { balls: true, starter: 4, badges: ['campina'] }); G.mundo.setHour(11);
    const tk = G.app.ticker, extra = new Set(), rem0 = tk.remove.bind(tk);
    tk.add = (fn) => { extra.add(fn); return tk; }; tk.remove = (fn, ...a) => (extra.delete(fn) ? tk : rem0(fn, ...a));
    const fr0 = G.frame.bind(G); G.frame = (dt) => { fr0(dt); tk.deltaMS = dt * 1000; for (const f of [...extra]) f(tk); };
    motor(true);
    const cena = CENAS.find((c) => c.depois?.batalha?.id === '${cfg.batalha}'), bt = cena.depois.batalha;
    ${cfg.sala ? `const r = G.map.interiors.find((q) => q.id === '${cfg.sala}'); tp(r.x + 11, r.y + 14);` : `tp(${cfg.em[0]}, ${cfg.em[1]});`}
    await espera(1);
    let npc = G.story.roteiro.atores.get('${cfg.npc ?? ''}'); if (!npc?.visible) npc = null;
    if (!npc) { const p = G.player; npc = { x: p.x, y: p.y - 60, h: 20, dir: 'down', faceTo() {}, throwPose() {}, goHome() {}, exclaim() {}, place(x, y, d) { this.x = x; this.y = y; this.dir = d; } }; }
    const def = { id: bt.id, name: nomeBatalha(bt.nome, bt.equipe), money: 0, team: bt.equipe };
    G.story.busy = false;
    window.__luta = G.story.fight(npc, def, { team: montarEquipe(bt.equipe, 7), semBola: ${!!cfg.semBola}, alfa: ${!!cfg.alfa} });
    bot.ligar({ reacao: 0.3, acerto: 0.85 }); lutar(false);
    return 'ok';
  })()`);
  if (ok !== 'ok') { erros.push(nome + ': ' + ok); await p.close(); return; }
  await until(() => p.ev('!!window.game.story.battle?.active?.some((e) => e.alive) && window.game.lead?.alive'), 60000, 300);
  await sleep(4000);
  const t0 = await p.ev('window.game.time');
  if (!cfg.semBola) {
    // o Pokémon do líder desmaia: o próximo vem jogado, sem parar a luta
    await p.ev(`(() => { const G = window.game, e = G.story.battle.active.find((q) => q.alive); G.combat.hurt(e, e.mon.hp + 999, G.lead, { mv: { type: 'normal', power: 999, cat: 'phys' }, dx: 1, dy: 0, knock: 1 }); })()`);
    await sleep(700); await foto('lider-troca');
  }
  // o seu desmaia: o próximo sai sozinho depois de um respiro
  await p.ev(`(() => { const G = window.game, L = G.lead; G.combat.hurt(L, L.mon.hp + 999, null, { mv: { type: 'normal', power: 999, cat: 'phys' }, dx: 1, dy: 0, knock: 1 }); window.__koT = G.time; })()`);
  await sleep(350); await foto('seu-desmaio');
  await until(() => p.ev('window.game.lead?.alive'), 8000, 50);
  const espera = await p.ev('+(window.game.time - window.__koT).toFixed(2)');
  await sleep(500); await foto('seu-proximo');
  // vitória: derruba o resto e fotografa a pilha do canto
  await p.ev(`(() => { const G = window.game; window.__fim = setInterval(() => { const B = G.story.battle; if (!B || B.done) { clearInterval(window.__fim); return; } for (const e of B.active) if (e.alive && !e.dead) { e.lock = 0; G.combat.hurt(e, e.mon.hp + 999, G.lead, { mv: { type: 'normal', power: 999, cat: 'phys' }, dx: 1, dy: 0, knock: 1 }); } }, 400); })()`);
  await until(() => p.ev('!window.game.story.battle'), 60000, 100);
  await sleep(900); await foto('vitoria');
  const r = await p.ev(`(async () => ({ resultado: await Promise.race([window.__luta, new Promise((r) => setTimeout(() => r('?'), 500))]), faixas: window.__faixas, avisos: [...document.querySelectorAll('#toasts div')].map((d) => d.textContent), caixaToasts: (() => { const q = document.getElementById('toasts').getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; })(), barra: Math.round(document.querySelector('#hb .topo').getBoundingClientRect().height) }))()`);
  console.log(nome, JSON.stringify({ ...r, esperaDoProximo: espera, t0 }));
  const meio = r.faixas.filter((f) => f.t > t0);
  if (meio.length) erros.push(`${nome}: faixa grande/VS no meio da luta: ${JSON.stringify(meio)}`);
  await p.ev('motor(false); bot.desligar()').catch(() => {});
  await p.close();
}
try {
  await luta('lia', { batalha: 'leader_lia', sala: 'estufa_lia', npc: 'lia' });
  await luta('alfa', { batalha: 'alfa_ariados', em: [201, 203], semBola: true, alfa: true });
} finally { b.kill(); }
console.log('fotos:', fotos.join(' '));
console.log(erros.length ? 'FALHOU: ' + erros.join(' | ') : 'OK: nenhuma faixa grande nem VS no meio da luta');
process.exitCode = erros.length ? 1 : 0;
