// Espelho (Casarão), alavancas (Mina nível 1 e 3): fica no bloco ao lado, vira para a peça com a tecla (grade) e aperta E.
//   PORT=8797 node tools/teste-3d/enigmas-alavancas.mjs [celular]
import { sessao, sleep } from './rb-lib.mjs';
import { util } from './grade-util.mjs';
const cel = process.argv.includes('celular');
const out = new URL('../shots/enigmas/', import.meta.url);
const s = await sessao({ qs: 'ir=casarao_velas', ...(cel ? { W: 740, H: 360, cel: true } : {}) });
const { P } = s;
try {
  const u = await util({ P, sleep, out });
  const livre = async () => { for (let i = 0; i < 120 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping || game.story.roteiro.rodando)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await u.hold('enter', 60); await sleep(400); } };
  for (let i = 0; i < 100 && !(await P.ev(`game.map?.interiorAt(game.player.x, game.player.y)?.id === 'casarao_velas'`)); i++) await sleep(500); // espera o ?ir= chegar
  await livre();
  await P.ev('game.mundo.setHour(21), 1'); // o Casarão só abre das 18h às 6h
  const KEY = { up: 'w', down: 's', left: 'a', right: 'd' };
  const caso = async (sala, [bx, by], dir, ler, nome) => {
    for (let t = 0; t < 4; t++) {
      await livre();
      await P.ev(`(() => { const r = game.map.interiors.find((x) => x.id === ${JSON.stringify(sala)}); game.mundo.warpTo(r.x + ${bx}, r.y + ${by}, 'down'); return 1; })()`);
      await sleep(2500); await livre();
      const pos = await P.ev(`(() => { const r = game.map.interiors.find((x) => x.id === ${JSON.stringify(sala)}); return Math.floor(game.player.x / 16) - r.x === ${bx} && Math.floor((game.player.y - 2) / 16) - r.y === ${by}; })()`);
      console.log('  tentativa', t, 'pos ok:', pos, await P.ev(`JSON.stringify([game.player.x/16, game.player.y/16, game.map.interiorAt(game.player.x, game.player.y)?.id])`));
      if (pos) break;
    }
    await u.hold(KEY[dir], 70); await sleep(300); // toque curto só vira, como o jogador
    const pr = await P.ev('game.ui.hud.promptKey'); console.log('  jogador', await P.ev(`JSON.stringify([Math.floor(game.player.x/16)-game.map.interiors.find((x)=>x.id===${JSON.stringify(sala)}).x, Math.floor((game.player.y-2)/16)-game.map.interiors.find((x)=>x.id===${JSON.stringify(sala)}).y, game.player.dir, game.story.busy, game.ui.dialog.open])`)); const a = await P.ev(ler);
    await u.hold('e', 70); await sleep(700); await livre();
    const d = await P.ev(ler);
    console.log(nome, '| prompt:', pr, '| antes:', a, '| depois:', d, '| mudou:', a !== d);
    await u.foto(nome);
  };
  const E = 'game.story.roteiro.enigmas';
  await caso('casarao_velas', [40, 5], 'up', `${E}.esp.oris.join('')`, 'espelho');
  await caso('mina_aurora_n1', [19, 15], 'up', `JSON.stringify(Object.values(${E}.portoes).filter((p) => p.d.sala === 'mina_aurora_n1').map((p) => p.aberto))`, 'alavanca-n1');
  await caso('mina_aurora_n1', [3, 4], 'up', `JSON.stringify(Object.values(${E}.portoes).filter((p) => p.d.sala === 'mina_aurora_n1').map((p) => p.aberto))`, 'alavanca-rampa');
  await caso('mina_aurora_n3', [2, 14], 'up', `JSON.stringify(${E}.carrinhos.map((c) => [c.o.tx, c.o.ty]))`, 'alavanca-manobra');
  console.log('erros:', s.erros());
} finally { s.kill(); }
