// Teste do Editor de golpes: abre pelo menu da equipe, troca/reordena, salva, recarrega e confere; capturas em tools/shots/rb/.
//   python3 tools/serve.py 8796 ; PORT=8796 node tools/teste-3d/editar-golpes.mjs [W H cel]
import { sessao, sleep } from './rb-lib.mjs';
const [W, H, cel] = [+(process.argv[2] ?? 1280), +(process.argv[3] ?? 720), process.argv[4] === 'cel'];
const tag = `eg-${W}x${H}`;
const s = await sessao({ W, H, cel });
const { P } = s;
const ev = (x) => P.ev(x);
const click = (sel, i = 0) => ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})][${i}]; if (!e) return false; e.click(); return true; })()`);
const key = (code) => ev(`(window.dispatchEvent(new KeyboardEvent('keydown', { code: ${JSON.stringify(code)}, bubbles: true })), 1)`);
try {
  console.log('equipe', await ev(`game.party.map((m) => m.name + ' ' + m.level + ' ' + m.moves.join('/')).join(' | ')`));
  await ev(`(() => { const m = game.party[0]; m.level = 30; m.xp = m.xpFloor(); m.calc(); m.learned = []; m.moves = m.moves.slice(0, 2); m.noteMoves(); return 1; })()`);
  await ev(`(game.ui.menu.open(), 1)`); await sleep(400);
  await click('#gmenu .gm-main[data-id=party]'); await sleep(400);
  await click('#gmenu .gm-pcard', 0); await sleep(300);
  console.log('opções', await ev(`[...document.querySelectorAll('#gmenu .gm-pop .nav')].map((e) => e.textContent.trim()).join(' / ')`));
  const ops = await ev(`[...document.querySelectorAll('#gmenu .gm-pop .nav')].findIndex((e) => /Editar golpes/.test(e.textContent))`);
  await click('#gmenu .gm-pop .nav', ops); await sleep(500);
  await s.foto(`${tag}-1-aberto`);
  console.log('lista', await ev(`[...document.querySelectorAll('#gmenu .eg-opt')].map((e) => e.dataset.id).join(',')`));
  // teclado: Enter no golpe 1 → Trocar; escolhe o 1º da lista
  await key('Enter'); await sleep(250); await s.foto(`${tag}-2-opcoes`);
  await key('Enter'); await sleep(250);                 // Trocar por outro golpe
  await s.foto(`${tag}-3-escolhendo`);
  const alvo = await ev(`document.querySelector('#gmenu .eg-opt.sel')?.dataset.id`);
  await key('Enter'); await sleep(250); if (cel) { await key('Enter'); await sleep(250); }
  await s.foto(`${tag}-4-trocado`);
  await key('Enter'); await sleep(250);                  // fecha a mensagem
  console.log('alvo', alvo, 'golpes agora', await ev(`game.party[0].moves.join('/')`));
  // reordenar: golpe 2 sobe
  await ev(`(document.querySelectorAll('#gmenu .eg-slot')[1].click(), 1)`); await sleep(250);
  console.log('menu do golpe', await ev(`[...document.querySelectorAll('#gmenu .gm-pop .nav')].map((e) => e.textContent.trim()).join(' / ')`));
  await ev(`(() => { const e = [...document.querySelectorAll('#gmenu .gm-pop .nav')].find((e) => /Subir/.test(e.textContent)); e && e.click(); return 1; })()`); await sleep(250);
  console.log('após subir', await ev(`game.party[0].moves.join('/')`));
  // filtros
  await ev(`(document.querySelector('#gmenu .eg-chip[data-f=novos]')?.click(), 1)`); await sleep(250); await s.foto(`${tag}-5-novos`);
  await ev(`(document.querySelector('#gmenu .eg-chip[data-f=todos]')?.click(), 1)`); await sleep(150);
  // esvaziar até restar 1
  for (let i = 0; i < 4; i++) { await ev(`(document.querySelectorAll('#gmenu .eg-slot')[0].click(), 1)`); await sleep(200); const t = await ev(`[...document.querySelectorAll('#gmenu .gm-pop .nav')].map((e) => e.textContent.trim())`); const j = t.findIndex((x) => /vazio/.test(x)); if (j < 0) { await key('Escape'); break; } await click('#gmenu .gm-pop .nav', j); await sleep(200); }
  console.log('após esvaziar', await ev(`game.party[0].moves.join('/')`));
  // salvar → recarregar
  const json = await ev(`JSON.stringify(game.party[0].toJSON())`);
  const m1 = await ev(`(() => { const j = JSON.parse(${JSON.stringify(json)}); const r = game.party[0].constructor.from(j); return r.moves.join('/') + ' learned=' + r.learned.length; })()`);
  console.log('recarga (Mon.from)', m1);
  console.log('combate lê o golpe novo', await ev(`(() => { const l = game.lead; if (!l) return 'sem lead'; l.mon.moves[0] = 'flamethrower'; return game.combat.moveAt(l, 0).id + ' cd ' + game.combat.moveAt(l, 0).mv.cd; })()`));
  // evolução: os golpes da forma evoluída entram na lista; validação online aceita os golpes lembrados
  console.log('evolução', await ev(`(async () => { const { rememberable } = await import('/src/mechanics/learn.js'); const { validateMon } = await import('/src/net/validate.js'); const m = game.party[0];
    const a = rememberable(m).length; m.evolveTo(5); const l = rememberable(m).map((x) => x.id); const v = validateMon(JSON.parse(JSON.stringify(m.toJSON()))); return 'antes ' + a + ' depois ' + l.length + ' (' + m.name + ') validate ' + v.ok + ' learned ' + (v.mon?.learned.length); })()`));
  await ev(`(game.ui.menu.close(), 1)`);
  console.log('erros', JSON.stringify(s.erros()));
} finally { s.kill(); }
