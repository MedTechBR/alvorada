import { launch, open, until, sleep } from './chrome.mjs';
const PORTA = process.env.PORTA ?? 8793;
const b = await launch(+(process.env.CDP ?? 9483));
try {
  const p = await open(b, `http://127.0.0.1:${PORTA}/?teste&nosw`, 'sonda');
  await p.raw('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
  await p.raw('Page.reload', {});
  await until(() => p.ev('!!window.game?.map && window.game.ui?.state === "play" && !!window.game.player'), 60000);
  await p.ev(`import(location.origin + '/tools/jornadas-teste.js')`);
  console.log(JSON.stringify(await p.ev(`(async () => {
    const G = window.game, R = G.story.roteiro; Object.assign(G.flags, { balls: true, badges: ['campina','sussurro','espelho','coral','lamparina','rochedo','escarpa'] }); await espera(1);
    const sp = G.map.spots.mirante_ventos; tp(sp.tx, sp.ty); const P0 = G.player; await ate(() => !G.map.solidAt(P0.x + 16, P0.y) || !G.map.solidAt(P0.x, P0.y + 16), 20); await espera(1);
    const P = G.player, out = { p: [P.x/16, P.y/16], dir: P.dir, sp: [sp.x/16, sp.y/16] };
    out.solid = {}; for (const [k,[dx,dy]] of Object.entries({up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]})) out.solid[k] = [1,2,3,4,5].map((i) => G.map.solidAt(P.x+dx*16*i, P.y+dy*16*i) ? 1 : 0).join('');
    out.sala = G.map.interiorAt(P.x,P.y)?.id ?? 'mundo';
    const n = R.ator('prof_mirante'); out.prof = n && { spot: n.e.spot, x: n.x/16, y: n.y/16, v: n.visible, cena: n.e.cena };
    out.tiles = []; for (let j=-3;j<=3;j++){ let row=''; for (let i=-5;i<=5;i++) row += String(G.map.at(sp.tx+i, sp.ty+j)).padStart(3)+(G.map.solidAt((sp.tx+i)*16+8,(sp.ty+j)*16+8)?'*':' '); out.tiles.push(row);} out.nPend = G.map.nPend;
    const { JORNADA } = await import('/src/story/jornada/index.js'); const seg = JORNADA.find((q) => q.id === 'nova11'); motor(true); window.segurar = 'Lúcio';
    R.tocar(seg, seg.cenas.find((q) => q.id === 'j11_prof_sequestrado')); await ate(() => G.ui.dialog?.d?.name?.includes('Lúcio'), 30);
    out.depois = ['prof_mirante', 'lucio_mirante'].map((i) => { const a = R.ator(i); return [a.x / 16 - P.x / 16, a.y / 16 - P.y / 16, G.map.solidAt(a.x, a.y)]; });
    return out; })()`)));
  await p.close();
} finally { b.kill(); }
