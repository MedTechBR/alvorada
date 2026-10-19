// Joga o Farol Coral como o jogador: anda pela grade até cada peça do circuito e gira com E.
//   PORT=8797 node tools/teste-3d/enigmas-farol.mjs [andar=farol_coral] [celular]
import { sessao, sleep } from './rb-lib.mjs';
import { util } from './grade-util.mjs';
import { mkdirSync } from 'node:fs';
const sala = 'farol_topo', cel = process.argv.includes('celular');
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
  await u.foto('topo-0-antes');
  const gens = JSON.parse(await P.ev(`JSON.stringify(game.story.roteiro.enigmas.gens.cells.map((c) => [Math.floor(c.x / 16), Math.floor(c.y / 16), c.tipo]))`));
  console.log('geradores', JSON.stringify(gens), 'dark antes:', await P.ev(`game.map.interiorAt(game.player.x, game.player.y).dark`));
  // curto-longo-curto = 0,1,2; fica no bloco de baixo, de frente para cima
  for (const i of [0, 1, 2]) {
    const [gx, gy] = gens[i]; const ok = await andar(gx, gy + 1);
    await u.hold('w', 60); await sleep(250);
    console.log('gerador', i, 'chegou', ok, 'prompt:', await prompt());
    await u.hold('e', 70); await sleep(600);
    for (let k = 0; k < 20 && await P.ev('!!game.ui.dialog.open'); k++) { await u.hold('enter', 60); await sleep(300); }
  }
  await sleep(2000);
  console.log('flag geradoresLigados:', await P.ev('game.flags.geradoresLigados'), 'dark depois:', await P.ev(`game.map.interiorAt(game.player.x, game.player.y).dark`));
  await u.foto('topo-1-depois');
  console.log('erros:', s.erros());
} finally { s.kill(); }
