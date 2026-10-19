// Capturas de uma sala de enigma: PORT=8797 node tools/teste-3d/enigmas-foto.mjs <sala> <bx> <by> [dir] [nome] [celular]
import { sessao, sleep } from './rb-lib.mjs';
const [sala, bx, by, dir = 'down', nome = sala] = process.argv.slice(2);
const cel = process.argv.includes('celular');
const s = await sessao({ qs: 'ir=' + sala, ...(cel ? { W: 740, H: 360, cel: true } : {}) });
try {
  const { P } = s;
  for (let i = 0; i < 100 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await P.ev(`window.dispatchEvent(new KeyboardEvent('keydown',{code:'Enter'})), 1`); await sleep(400); }
  for (let i = 0; i < 100 && !(await P.ev(`!!game.map.interiors?.find((x) => x.id === ${JSON.stringify(sala)})`)); i++) await sleep(500);
  await P.ev(`(() => { const r = game.map.interiors.find((x) => x.id === ${JSON.stringify(sala)}); game.mundo.warpTo(r.x + ${bx}, r.y + ${by}, ${JSON.stringify(dir)}); return 1; })()`);
  await sleep(3500);
  await s.foto('enigmas-' + nome);
  console.log('erros:', s.erros());
} finally { s.kill(); }
