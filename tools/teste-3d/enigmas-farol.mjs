// Joga o Farol Coral como o jogador: anda pela grade até cada peça do circuito e gira com E.
//   PORT=8797 node tools/teste-3d/enigmas-farol.mjs [andar=farol_coral] [celular]
import { sessao, sleep } from './rb-lib.mjs';
import { util } from './grade-util.mjs';
import { mkdirSync } from 'node:fs';
const sala = process.argv[2] ?? 'farol_coral', cel = process.argv.includes('celular');
const out = new URL('../shots/enigmas/', import.meta.url); mkdirSync(out, { recursive: true });
const s = await sessao({ qs: 'ir=farol_coral', ...(cel ? { W: 740, H: 360, cel: true } : {}) });
const { P } = s;
try {
  const u = await util({ P, sleep, out });
  const KEY = { up: 'w', down: 's', left: 'a', right: 'd' };
  const rota = (tx, ty) => P.ev(`game.grade.rota(game.player, ${tx} * 16 + 8, ${ty} * 16 + 10, false)`);
  const andar = async (tx, ty) => { for (let i = 0; i < 60; i++) { await livre(); const e = await u.est(); if (e.tx === tx && e.ty === ty && !e.an) return true; const d = await rota(tx, ty); if (!d) { await sleep(150); continue; } await u.hold(KEY[d], e.dir === d ? 140 : 160); await sleep(30); } return false; };
  const prompt = () => P.ev('game.ui.hud.promptKey');
  const livre = async () => { for (let i = 0; i < 120 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping || game.viagem?.ocupada || game.story.roteiro.rodando)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await u.hold('enter', 60); await sleep(400); } };
  await livre(); await sleep(1500);
  // entra no andar pela escada (ponto de chegada dos portais do enigmas.js)
  const ENTRADA = { farol_coral: null, farol_coral_2: [13, 10, 'up'], farol_topo: [2, 8, 'up'] }[sala];
  if (ENTRADA) { await P.ev(`(() => { const r = game.map.interiors.find((x) => x.id === ${JSON.stringify(sala)}); game.mundo.warpTo(r.x + ${ENTRADA[0]}, r.y + ${ENTRADA[1]}, ${JSON.stringify(ENTRADA[2])}); return 1; })()`); await sleep(2500); await livre(); }
  await u.foto(`${sala}-0-antes`);
  const c = JSON.parse(await P.ev(`JSON.stringify((() => { const E = game.story.roteiro.enigmas; const c = E.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}); return { id: c.d.id, x: c.d.x, y: c.d.y, w: c.d.w, h: c.d.h, rots: c.rots, tipos: c.cells.map((q) => q.tipo), sol: c.d.caminho, sala: [E.salas[c.d.sala].x, E.salas[c.d.sala].y] }; })())`));
  console.log('circuito', c.id, 'dark antes:', await P.ev(`game.map.interiorAt(game.player.x, game.player.y).dark`));
  // acha por tentativa: gira cada peça do caminho até o circuito ligar (testa 0..3 em cada peça sequencialmente)
  const rot = (m, r) => { let o = m; for (let i = 0; i < r; i++) o = ((o << 1) | (o >> 3)) & 15; return o; };
  const PECA = { I: 5, L: 3, T: 7, X: 15 };
  // solução = rotação final de cada célula do caminho, calculada pelo mesmo critério do jogo
  const sol = JSON.parse(await P.ev(`JSON.stringify((() => { const E = game.story.roteiro.enigmas, c = E.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}); const d = c.d, N=1,Ea=2,S=4,W=8; const lado=(a,b)=> b[0]>a[0]?Ea:b[0]<a[0]?W:b[1]>a[1]?S:N; const f=[d.fonte[0]-d.x,d.fonte[1]-d.y], g=[d.gerador[0]-d.x,d.gerador[1]-d.y]; const out=[]; d.caminho.forEach((q,n)=>{ const prev=n?d.caminho[n-1]:f, next=d.caminho[n+1]??g; out.push([q[0],q[1],lado(q,prev)|lado(q,next)]); }); return out; })())`));
  let giros = 0;
  for (const [i, j, m] of sol) {
    const k = j * c.w + i; const rots = JSON.parse(await P.ev(`JSON.stringify(game.story.roteiro.enigmas.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}).rots)`));
    let n = 0; while (rot(PECA[c.tipos[k]], (rots[k] + n) % 4) !== m && n < 4) n++;
    if (n === 0) continue;
    console.log('peça', i, j, 'girar', n);
    const ok = await andar(c.sala[0] + c.x + i, c.sala[1] + c.y + j); if (!ok) { console.log('NÃO CHEGOU à peça', i, j); continue; }
    for (let t = 0; t < n; t++) { const pr = await prompt(); if (!/Girar/.test(pr ?? '')) console.log('sem prompt na peça', i, j, JSON.stringify(pr)); await u.hold('e', 70); await sleep(350); giros++; }
    if (await P.ev(`game.story.roteiro.enigmas.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}).ligado`)) break;
  }
  await sleep(1500);
  console.log('giros:', giros, 'ligado:', await P.ev(`game.story.roteiro.enigmas.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}).ligado`), 'dark depois:', await P.ev(`game.map.interiorAt(game.player.x, game.player.y).dark`));
  await sleep(2500); await u.foto(`${sala}-1-depois`);
  console.log('erros:', s.erros());
} finally { s.kill(); }
