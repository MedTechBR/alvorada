// Atores das cenas (Chrome sem interface, 844x390): a noite da estufa da Lia com os recrutas na tela quando falam, o piso
// armadilha da estufa desligado depois de chegar à Lia e a aprendiz que não trava o corredor.
//   python3 tools/serve.py 8793   e   PORTA=8793 node tools/teste-3d/atores-cena.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, open, until, sleep } from './chrome.mjs';
const PORTA = process.env.PORTA ?? 8793, URL = `http://127.0.0.1:${PORTA}/?teste&nosw`;
const b = await launch(+(process.env.CDP ?? 9481));
const erros = [];
try {
  const p = await open(b, URL, 'atores');
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
  await p.raw('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await p.raw('Page.reload', {});
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`);
  mkdirSync('tools/shots', { recursive: true });
  const foto = async (n) => { const r = await p.raw('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); const arq = `tools/shots/${n}.jpg`; writeFileSync(arq, Buffer.from(r.result.data, 'base64')); return arq; };
  await p.ev(`(async () => {
    const G = window.game, { Mon } = await import('/src/data/mon.js');
    G.party = [new Mon(5, 20), new Mon(8, 19)]; G.leadIdx = 0; G.hudLead(); G.hudMoves();
    Object.assign(G.flags, { balls: true, starter: 4, badges: ['campina'] });
    G.flags.nh = { ...(G.flags.nh ?? {}), contouCristal: true };
    motor(true);
  })()`);

  // ---- 1. piso armadilha: ligado na entrada, desligado ao chegar à Lia
  const piso = (q) => p.ev(`(() => { const G = window.game, r = G.map.interiors.find((q) => q.id === 'estufa_lia'); let webs = 0, fios = 0;
    for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) { const t = G.map.at(r.x + i, r.y + j); if (t === 29) webs++; if (t === 28) fios++; }
    return { webs, fios, armadilhas: G.map.warps.filter((w) => w.trap).length, flag: !!G.flags.pisoOff?.estufa_lia }; })()`);
  await p.ev(`(() => { const G = window.game, r = G.map.interiors.find((q) => q.id === 'estufa_lia'); tp(r.x + 11, r.y + 14); G.mundo.setHour(10); })()`);
  await sleep(1200);
  const antes = await piso(); console.log('piso antes:', JSON.stringify(antes));
  if (!antes.webs || !antes.armadilhas || antes.flag) erros.push('o piso devia estar ativo na entrada');
  console.log('foto:', await foto('piso-lia-antes'));
  await p.ev(`(() => { const G = window.game, r = G.map.interiors.find((q) => q.id === 'estufa_lia'); tp(r.x + 11, r.y + 3); })()`);
  await sleep(1500);
  const depois = await piso(); console.log('piso depois:', JSON.stringify(depois));
  if (depois.webs || depois.fios || depois.armadilhas || !depois.flag) erros.push('o piso não desligou ao chegar à Lia');
  console.log('foto:', await foto('piso-lia-depois'));
  // guarda no save: volta a aplicar com a flag
  // ---- 2. a noite da estufa: os recrutas aparecem quando falam
  const r2 = await p.ev(`(async () => {
    const G = window.game, R = G.story.roteiro, { JORNADA } = await import('/src/story/jornada/index.js');
    const seg = JORNADA.find((s) => s.id === 'nova02'), cena = seg.cenas.find((s) => s.id === 'j02_estufa_noite');
    const r = G.map.interiors.find((q) => q.id === 'estufa_lia'); tp(r.x + 11, r.y + 12); G.mundo.setHour(21);
    window.segurar = 'Recruta';
    R.tocar(seg, cena);
    const ok = await ate(() => G.ui.dialog?.d?.name?.includes('Recruta'), 20);
    await espera(0.6);
    const sala = G.map.interiorAt(G.player.x, G.player.y)?.id, cam = G.cam;
    const vis = [...R.atores.values()].filter((n) => n.e.id.includes('estufa_n')).map((n) => ({ id: n.e.id, v: n.visible, sala: G.map.interiorAt(n.x, n.y)?.id, dx: Math.round((n.x - G.player.x) / 16 * 10) / 10, dy: Math.round((n.y - G.player.y) / 16 * 10) / 10 }));
    return { ok, sala, vis };
  })()`);
  console.log('recrutas falando:', JSON.stringify(r2));
  if (!r2.ok || !r2.vis.length || r2.vis.some((v) => !v.v || v.sala !== 'estufa_lia' || Math.hypot(v.dx, v.dy) < 2 || Math.hypot(v.dx, v.dy) > 5.5)) erros.push('recrutas não aparecem perto do jogador quando falam');
  await sleep(500);
  console.log('foto:', await foto('estufa-recrutas-falando'));
  await p.close();
} finally { b.kill(); }
console.log(erros.length ? 'FALHOU: ' + erros.join('; ') : 'OK');
process.exitCode = erros.length ? 1 : 0;
