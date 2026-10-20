// Passo "Leve o que viu da gruta de volta à Lia" no jogo de verdade (Chrome sem interface, 844x390, toque):
// toca a cena da gruta (j02_ariados_depois), confere que o alvo do painel é a Lia (na estufa) e não a praça, tira as
// fotos (da praça: o guia leva à porta da estufa; dentro: o losango em cima da Lia), fala com a Lia e confere que a cena
// j02_lia_cristal toca, a noite chega e a luta da estufa (c2_recruta) começa.
//   python3 tools/serve.py 8752   e   PORTA=8752 node tools/teste-3d/passo-lia.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, open, until, sleep } from './chrome.mjs';
const PORTA = process.env.PORTA ?? 8752, URL = `http://127.0.0.1:${PORTA}/?teste&nosw`;
const b = await launch(+(process.env.CDP ?? 9474));
const erros = [];
try {
  const p = await open(b, URL, 'lia');
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
  await p.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await p.raw('Page.reload', {});
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`);
  mkdirSync('tools/shots', { recursive: true });
  const foto = async (n) => { const r = await p.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); const arq = `tools/shots/${n}.jpg`; writeFileSync(arq, Buffer.from(r.result.data, 'base64')); return arq; };
  const r1 = await p.ev(`(async () => {
    const G = window.game, R = G.story.roteiro, { JORNADA } = await import('/src/story/jornada/index.js'), { Mon } = await import('/src/data/mon.js');
    G.party = [new Mon(5, 20), new Mon(8, 19)]; G.leadIdx = 0; G.hudLead(); G.hudMoves();
    Object.assign(G.flags, { balls: true, starter: 4, badges: ['campina'] });
    G.flags.nh = { ...(G.flags.nh ?? {}), chegouSussurro: true, ouviuRecrutas: true, seguiuAbsol: true, tocaEntrou: true, ariadosVencido: true };
    G.mundo.setHour(10);
    const seg = JORNADA.find((s) => s.id === 'nova02');
    for (const s of seg.cenas) if (['j02_chegada', 'j02_recrutas', 'j02_sina_trilha', 'j02_toca_entrada', 'j02_ariados_alfa'].includes(s.id)) (G.flags.roteiro ??= {})['nova02.' + s.id] = true;
    tp(162, 233); motor(true);
    await R.jornadas.iniciar('sussurro', { cartao: false });
    await R.tocar(seg, seg.cenas.find((s) => s.id === 'j02_ariados_depois'));
    await ate(() => !G.ui.dialog?.open && !R.rodando, 20);
    G.story.refreshObjective?.(); await espera(1);
    const o = R.objective({}), lia = R.ator('lia');
    return { texto: o?.text, alvo: o?.target && { x: Math.round(o.target.x / 16), y: Math.round(o.target.y / 16), map: o.target.map }, lia: lia && { x: Math.round(lia.x / 16), y: Math.round(lia.y / 16), visivel: lia.visible } };
  })()`);
  console.log('objetivo:', JSON.stringify(r1));
  if (!r1.alvo || !r1.lia || Math.hypot(r1.alvo.x - r1.lia.x, r1.alvo.y - r1.lia.y) > 1) erros.push('o alvo não é a Lia');
  if (r1.alvo?.x === 162 && r1.alvo?.y === 231) erros.push('o alvo ainda é a praça');
  await sleep(2500);
  const g1 = await p.ev(`(() => { const i = window.game.ui.hud.guia.info; return i && { ok: i.ok, dist: i.dist, porta: i.porta, wp: i.wp && [Math.round(i.wp.x / 16), Math.round(i.wp.y / 16)], saida: i.saida && [Math.round(i.saida.x / 16), Math.round(i.saida.y / 16)] }; })()`);
  console.log('guia na praça:', JSON.stringify(g1));
  console.log('foto:', await foto('passo-lia-praca'));
  // dentro da estufa, perto da Lia
  await p.ev(`(() => { const G = window.game, r = G.map.interiors.find((q) => q.id === 'estufa_lia'); tp(r.x + 9, r.y + 6); })()`);
  await sleep(2500);
  const g2 = await p.ev(`(() => { const i = window.game.ui.hud.guia.info; return i && { ok: i.ok, dist: i.dist, fim: i.fim && [Math.round(i.fim.x / 16), Math.round(i.fim.y / 16)] }; })()`);
  console.log('guia na estufa:', JSON.stringify(g2));
  console.log('foto:', await foto('passo-lia-estufa'));
  // fala com a Lia (a mesma porta do botão Falar)
  const r3 = await p.ev(`(async () => {
    const G = window.game, R = G.story.roteiro, lia = R.ator('lia');
    G.player.x = lia.x; G.player.y = lia.y + 20;
    const it = R.interactions().find((q) => q.o === lia); if (!it) return 'sem interação com a Lia';
    it.fn();
    const ok = await ate(() => G.flags.nh?.contouCristal && G.story.battle, 40);
    return { contou: !!G.flags.nh?.contouCristal, hora: Math.floor(G.mundo.hour), noite: G.mundo.isNight(), luta: G.story.battle?.def?.id ?? null, ok, falas: window.falas.slice(-4) };
  })()`);
  console.log('falar com a Lia:', JSON.stringify(r3));
  if (r3.luta !== 'c2_recruta' || !r3.contou) erros.push('falar com a Lia não levou à cena e à luta da estufa');
  await p.close();
} finally { b.kill(); }
console.log(erros.length ? 'FALHOU: ' + erros.join('; ') : 'OK: o passo mira a Lia e falar com ela avança a história');
process.exitCode = erros.length ? 1 : 0;
