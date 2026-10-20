import { launch, open, until, sleep } from './chrome.mjs';
const PORTA = process.env.PORTA ?? 8793;
const b = await launch(+(process.env.CDP ?? 9481));
try {
  const p = await open(b, `http://127.0.0.1:${PORTA}/?teste&nosw`, 'sonda');
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
  await p.raw('Page.reload', {});
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`);
  const r = await p.ev(`(async () => {
    const G = window.game, R = G.story.roteiro, { JORNADA } = await import('/src/story/jornada/index.js'), { Mon } = await import('/src/data/mon.js');
    G.party = [new Mon(5, 20)]; G.leadIdx = 0; Object.assign(G.flags, { balls: true, starter: 4, badges: ['campina'] });
    G.flags.nh = { ...(G.flags.nh ?? {}), contouCristal: true };
    G.mundo.setHour(21);
    const seg = JORNADA.find((s) => s.id === 'nova02'), cena = seg.cenas.find((s) => s.id === 'j02_estufa_noite');
    const rm = G.map.interiors.find((q) => q.id === 'estufa_lia'); tp(rm.x + 9, rm.y + 6);
    const out = { sp: G.map.spots.dentro_estufa_lia, rm: [rm.x, rm.y, rm.w, rm.h], atores: [...R.atores.values()].filter(n=>n.e.id.includes('estufa_n')).map(n=>({id:n.e.id, e:n.e.cena, v:n.visible})) };
    motor(true);
    const pr = R.tocar(seg, cena);
    await espera(1.5);
    out.dur = [...R.atores.values()].filter(n=>n.e.id.includes('estufa_n')).map(n=>({id:n.e.id, v:n.visible, x:n.x/16, y:n.y/16, px:G.player.x/16, py:G.player.y/16}));
    return out;
  })()`);
  console.log(JSON.stringify(r, null, 1));
  await p.close();
} finally { b.kill(); }
