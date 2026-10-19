// Jogo novo do começo até escolher o inicial, só com o teclado (toques de tecla de verdade) e o caminho pela grade.
//   python3 tools/serve.py 8793 ; PORT=8793 node tools/teste-3d/grade-novo.mjs
import { launch, open, sleep, until } from './chrome.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { util } from './grade-util.mjs';
const PORT = process.env.PORT ?? 8793;
const out = new URL('../shots/grade/', import.meta.url); mkdirSync(out, { recursive: true });
const nome = 'Gr' + randomBytes(2).toString('hex'), senha = randomBytes(9).toString('base64url');
const b = await launch(); let P;
try {
  P = await open(b, 'about:blank', 'n'); globalThis.P = P;
  await P.raw('Page.enable'); await P.raw('Page.bringToFront'); await P.raw('Emulation.setFocusEmulationEnabled', { enabled: true });
  await P.raw('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  await P.raw('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html${process.env.Q ?? ''}` });
  await until(() => P.ev('!!document.querySelector("#title .tt-panel button")'), 90000, 400);
  await sleep(1500);
  await P.ev(`document.querySelector('#title [data-a=create]').click(), 1`); await sleep(600);
  await P.ev(`(() => { const q = (s) => document.querySelector('#title ' + s); q('.nm').value = ${JSON.stringify(nome)}; q('.p1').value = ${JSON.stringify(senha)}; q('.p2').value = ${JSON.stringify(senha)}; q('.tt-go').click(); return 1; })()`);
  await until(() => P.ev('!!document.querySelector("#title .cc")'), 15000, 300); await sleep(800);
  await P.ev(`document.querySelector('#title .tt-go').click(), 1`);
  await until(() => P.ev('!!(window.game && game.ui?.state === "play")'), 60000, 400);
  const u = await util({ P, sleep, out });
  await sleep(1500);
  const log = [];
  // passa os diálogos como o jogador (Enter), anotando as falas
  const falas = async () => { let n = 0; while (await P.ev('!!game.ui.dialog.open') && n++ < 80) { const l = await P.ev(`(() => { const d = game.ui.dialog.d; return d ? (d.name ?? '') + ': ' + (d.lines?.[d.i] ?? '') : ''; })()`); if (l && log[log.length - 1] !== l) log.push(l); if (await P.ev('!!document.querySelector(".dlg-choices:not([hidden])")')) await u.hold('enter', 60); else await u.hold('enter', 60); await sleep(350); } };
  const espera = async () => { for (let i = 0; i < 80 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping || game.viagem?.ocupada)'); i++) { await falas(); await sleep(300); } };
  const rota = (tx, ty) => P.ev(`game.grade.rota(game.player, ${tx} * 16 + 8, ${ty} * 16 + 10, false)`);
  const KEY = { up: 'w', down: 's', left: 'a', right: 'd' };
  let aliasLog = 0;
  const andar = async (tx, ty, ms = 90000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      await espera();
      const e = await u.est();
      if (e.tx === tx && e.ty === ty && !e.an) return true;
      const d = await rota(tx, ty);
      if (!d) { await sleep(150); const e2 = await u.est(); if (e2.tx === tx && e2.ty === ty) return true; continue; }
      await u.hold(KEY[d], e.dir === d ? 140 : 160); await sleep(30);
    }
    return false;
  };
  const olhar = async (dir) => { await u.hold(KEY[dir], 60); await sleep(150); };
  await u.foto('20-novo-inicio'); await espera();
  console.log('objetivo:', await P.ev('document.querySelector(".objective")?.innerText?.replace(/\\s+/g, " ")'));
  console.log('começa em:', JSON.stringify(await u.est()));
  // sai de casa: a porta é o aviso de saída do cômodo atual
  const porta = async (pred) => JSON.parse(await P.ev(`JSON.stringify((() => { const m = game.map, p = game.player; const here = m.interiorAt(p.x, p.y); for (const [k, v] of m.warpAt) { const x = k % m.w, y = Math.floor(k / m.w); const dentro = m.interiorAt(x * 16 + 8, y * 16 + 8); const dest = m.interiorAt(v.to.x * 16 + 8, v.to.y * 16 + 8); if (${pred}) return [x, y, dest?.name ?? null, dentro?.name ?? null]; } return null; })())`));
  const casa = await porta('here && dentro === here && !dest');
  console.log('saída da sala:', JSON.stringify(casa));
  if (casa) { const ok = await andar(casa[0], casa[1], 60000); console.log('foi até a porta de saída:', ok); await espera(); await sleep(1500); }
  console.log('depois da porta:', JSON.stringify(await u.est()));
  await u.foto('21-fora');
  // o professor espera na praça, na frente do laboratório: fala com ele (bloco à frente), depois escolhe o inicial na mesa
  const prof = JSON.parse(await P.ev(`JSON.stringify((() => { const n = game.story.npc('prof'); return [Math.floor(n.x / 16), Math.floor((n.y - 2) / 16)]; })())`));
  console.log('professor em', JSON.stringify(prof));
  const okProf = await andar(prof[0], prof[1] + 1, 150000); console.log('chegou na frente do professor:', okProf, JSON.stringify(await u.est()));
  await olhar('up'); await sleep(300); await u.foto('22-frente-prof');
  await u.hold('e', 80); await sleep(600); await falas(); await espera();
  console.log('falou com o professor? talkedProf =', await P.ev('game.flags.talkedProf'));
  const mesa = JSON.parse(await P.ev(`JSON.stringify((() => { const s = game.story.table, b = game.story.balls[1]; return [Math.floor((s.x + b.x) / 16), Math.floor((s.y + 2 - 2) / 16)]; })())`));
  console.log('mesa dos iniciais (Charmander) em bloco', JSON.stringify(mesa));
  const okMesa = await andar(mesa[0], mesa[1] + 1, 90000); console.log('chegou na frente da mesa:', okMesa, JSON.stringify(await u.est()));
  await olhar('up'); await sleep(300); await u.foto('23-escolha');
  await u.hold('e', 80); await sleep(700);
  console.log('pergunta aberta?', await P.ev('!!game.ui.dialog.open'), JSON.stringify(await P.ev('game.ui.dialog.d?.lines?.[game.ui.dialog.d?.i] ?? null')));
  await u.hold('enter', 60); await sleep(400); await falas(); await espera();
  console.log('equipe:', await P.ev('game.party.map((m) => m.name).join(",")'), 'inicial =', await P.ev('game.flags.starter'));
  await u.foto('24-inicial');
  console.log('falas:\n  ' + log.slice(0, 40).join('\n  '));
  const er = P.logs.filter((l) => /EXC|rror|Uncaught/.test(l)); console.log(er.length ? 'CONSOLE com erros: ' + er.slice(0, 6).join(' | ') : 'console sem erros');
} catch (e) { console.log('ERRO', e.message); } finally { b.kill(); }
