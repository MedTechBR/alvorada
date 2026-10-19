// Farol Coral no celular deitado (844x390, toque): resolve o circuito tocando nas peças na tela e luta com a
// Técnica Duda, conferindo que a luta vai para um lugar com espaço e que os dois Pokémon ficam na tela e dentro
// das paredes. Capturas em tools/shots/farol-toque/.
//   PORT=8811 node tools/teste-3d/farol-toque.mjs [andar=farol_coral_2] [sem-luta]
import { sessao, sleep } from './rb-lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const sala = process.argv[2] && !process.argv[2].startsWith('sem') ? process.argv[2] : 'farol_coral_2';
const semLuta = process.argv.includes('sem-luta');
const out = new URL('../shots/farol-toque/', import.meta.url); mkdirSync(out, { recursive: true });
const s = await sessao({ qs: 'ir=farol_coral', W: 844, H: 390, cel: true });
const { P } = s;
const foto = async (n) => { const r = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); writeFileSync(new URL(n + '.jpg', out), Buffer.from(r.result.data, 'base64')); console.log('  foto', n); };
const J = async (expr) => JSON.parse(await P.ev(`JSON.stringify(${expr})`));
const toque = async (x, y, ms = 80) => { await P.raw('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 3 }] }); await sleep(ms); await P.raw('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
let falhas = 0; const confere = (ok, msg) => { console.log(ok ? '  ok  ' : '  FALHA', msg); if (!ok) falhas++; };
try {
  const livre = async () => { for (let i = 0; i < 60 && await P.ev('!!(game.story.busy || game.ui.dialog.open || game.mundo.warping || game.story.roteiro.rodando)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }))`); await sleep(350); } };
  await livre(); await sleep(1200);
  console.log('toque:', await P.ev('document.body.classList.contains("touch") || matchMedia("(pointer: coarse)").matches'));
  // entra no andar: no 1º andar pela escada (chegada do portal) e anda até a sala do circuito; no térreo já está lá
  const R = await J(`(() => { const r = game.map.interiors.find((x) => x.id === ${JSON.stringify(sala)}); return { x: r.x, y: r.y }; })()`);
  const perto = sala === 'farol_coral_2' ? [5, 9] : [6, 8];
  await P.ev(`(() => { game.mundo.warpTo(${R.x + perto[0]}, ${R.y + perto[1]}, 'up'); return 1; })()`); await sleep(2500); await livre(); await sleep(800);
  const circ = () => J(`(() => { const E = game.story.roteiro.enigmas, c = E.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}); return { ligado: c.ligado, rots: c.rots, w: c.d.w, cells: c.cells.map((q) => ({ i: q.i, j: q.j, x: q.x, y: q.y, tipo: q.tipo })) }; })()`);
  const dudaPos = () => J(`(() => { const n = [...game.story.roteiro.atores.values()].find((a) => a.e.id === 'g4_duda'); return n ? { x: +(n.x / 16 - ${R.x}).toFixed(1), y: +(n.y / 16 - ${R.y}).toFixed(1), vis: n.visible, walk: !!n.walk } : null; })()`);
  console.log('Duda ao entrar:', await dudaPos());
  let c = await circ();
  // solução (mesmo critério do jogo): rotação que liga cada peça do caminho
  const sol = await J(`(() => { const E = game.story.roteiro.enigmas, c = E.circ.find((c) => c.d.sala === ${JSON.stringify(sala)}), d = c.d, N=1,Ea=2,S=4,W=8; const lado=(a,b)=> b[0]>a[0]?Ea:b[0]<a[0]?W:b[1]>a[1]?S:N; const f=[d.fonte[0]-d.x,d.fonte[1]-d.y], g=[d.gerador[0]-d.x,d.gerador[1]-d.y]; return d.caminho.map((q,n)=>{ const prev=n?d.caminho[n-1]:f, next=d.caminho[n+1]??g; return [q[0],q[1],lado(q,prev)|lado(q,next)]; }); })()`);
  const rot = (m, r) => { let o = m; for (let i = 0; i < r; i++) o = ((o << 1) | (o >> 3)) & 15; return o; };
  const PECA = { I: 5, L: 3, T: 7, X: 15 };
  const faltam = sol.map(([i, j, m]) => { const k = j * c.w + i; let n = 0; while (rot(PECA[c.cells[k].tipo], (c.rots[k] + n) % 4) !== m && n < 4) n++; return { i, j, k, n }; }).filter((q) => q.n);
  console.log(`circuito ${sala}: ${c.cells.length} peças, ${faltam.length} fora do lugar, ${faltam.reduce((a, q) => a + q.n, 0)} toques para resolver`);
  confere(faltam.length > 0 && faltam.length <= 6, 'poucas peças fora do lugar (1 a 6)');
  await foto(`${sala}-0-antes`);
  let toques = 0, primeira = true;
  for (const q of faltam) {
    for (let t = 0; t < q.n; t++) {
      const cell = c.cells[q.k];
      const sp = await J(`game.worldToScreen(${cell.x}, ${cell.y}, 0)`);
      const alvo = await P.ev(`game.input.alvoToque?.(${sp.x}, ${sp.y}) ?? 'sem alvoToque'`);
      const el = await P.ev(`document.elementFromPoint(${sp.x}, ${sp.y})?.id || document.elementFromPoint(${sp.x}, ${sp.y})?.tagName`);
      const antes = (await circ()).rots[q.k];
      await toque(sp.x, sp.y); await sleep(primeira ? 60 : 250); toques++;
      if (primeira) { await foto(`${sala}-1-tocando`); primeira = false; await sleep(200); }
      const depois = (await circ()).rots[q.k];
      if (depois !== (antes + 1) % 4) console.log(`  peça ${q.i},${q.j} em (${sp.x.toFixed(0)},${sp.y.toFixed(0)}) [${el}] alvo=${alvo}: não girou (${antes} -> ${depois})`);
    }
  }
  await sleep(1200);
  c = await circ();
  confere(c.ligado, `circuito ligado por toque (${toques} toques)`);
  confere(!(await P.ev(`game.map.interiorAt(game.player.x, game.player.y).dark`)), 'andar aceso');
  await foto(`${sala}-2-resolvido`);
  // o teclado continua valendo: em cima de uma peça, o botão A aparece (Girar peça)
  console.log('erros até aqui:', s.erros(), 'Duda:', await dudaPos());

  if (!semLuta && sala === 'farol_coral_2') {
    // luta com a Duda: o jogador sobe o corredor da direita e passa o último portão de raio; ela avista e vem
    console.log('Duda antes da luta:', await dudaPos());
    await P.ev(`(() => { game.mundo.warpTo(${R.x + 13}, ${R.y + 4}, 'up'); return 1; })()`);
    let antesLuta = null;
    for (let i = 0; i < 40 && !(await P.ev('!!game.story.battle')); i++) { if (!antesLuta && !(await P.ev('game.mundo.warping'))) antesLuta = await J(`({ x: game.player.x, y: game.player.y })`); if (await P.ev('!!game.ui.dialog.open')) await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }))`); await sleep(300); }
    console.log('Duda na hora da luta:', await dudaPos(), 'jogador antes:', antesLuta && [+(antesLuta.x / 16 - R.x).toFixed(1), +(antesLuta.y / 16 - R.y).toFixed(1)]);
    for (let i = 0; i < 40 && !(await P.ev('!!game.story.battle')); i++) { if (await P.ev('!!game.ui.dialog.open')) await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }))`); await sleep(300); }
    confere(await P.ev('!!game.story.battle'), 'batalha com a Duda começou');
    const lugar = await J(`({ p: { x: game.player.x, y: game.player.y }, sala: game.map.interiorAt(game.player.x, game.player.y)?.id })`);
    confere(Math.hypot(lugar.p.x - antesLuta.x, lugar.p.y - antesLuta.y) > 32, `luta foi para outro lugar (bloco ${(lugar.p.x / 16 - R.x).toFixed(1)}, ${(lugar.p.y / 16 - R.y).toFixed(1)} da sala) em ${lugar.sala}`);
    // manda o Pokémon e luta pelo toque: Enviar (golpe 1 do treinador) e depois os golpes
    await sleep(1500);
    const centro = async (sel) => J(`(() => { const r = document.querySelector('${sel}')?.getBoundingClientRect(); return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; })()`);
    let b0 = await centro('.tb.move[data-slot="0"]'); if (b0) await toque(b0.x, b0.y, 90);
    await sleep(2500);
    let pior = { fora: 0, parede: 0 }, n = 0, fotoLuta = false;
    for (let t = 0; t < 60 && await P.ev('!!game.story.battle'); t++) {
      const st = await J(`(() => {
        const g = game, b = g.story.battle, W = innerWidth, H = innerHeight, L = g.lead;
        const tela = (e) => { const s = g.worldToScreen(e.x, e.y, 10); return s.x > 0 && s.x < W && s.y > 0 && s.y < H; };
        const dentro = (e) => { const f = g.combat.alt.solido(e); return !f(Math.floor(e.x / 16), Math.floor(e.y / 16)); };
        const ents = [L, ...(b?.active ?? [])].filter((e) => e?.alive && !e.dead);
        return { n: ents.length, fora: ents.filter((e) => !tela(e)).map((e) => e.mon.name), parede: ents.filter((e) => !dentro(e)).map((e) => e.mon.name), lead: !!L?.alive };
      })()`);
      n++; if (st.fora.length) pior.fora++; if (st.parede.length) pior.parede++;
      if (st.fora.length || st.parede.length) console.log('   t', t, JSON.stringify(st));
      if (!st.lead) { b0 = await centro('.tb.move[data-slot="0"]'); if (b0) await toque(b0.x, b0.y, 90); await sleep(1200); continue; }
      // golpe: toque num botão de golpe (mira automática)
      const slot = t % 3, bt = await centro(`.tb.move[data-slot="${slot}"]:not(.tq-off)`);
      if (bt) await toque(bt.x, bt.y, 60);
      if (!fotoLuta && st.n >= 2 && t >= 3) { await foto(`${sala}-3-luta-duda`); fotoLuta = true; }
      await sleep(700);
    }
    confere(pior.parede === 0, `nenhum Pokémon dentro da parede (${n} amostras)`);
    confere(pior.fora <= 1, `os dois Pokémon na tela (${pior.fora} de ${n} amostras com alguém fora)`);
    for (let i = 0; i < 30 && await P.ev('!!(game.story.battle || game.story.busy || game.ui.dialog.open)'); i++) { if (await P.ev('!!game.ui.dialog.open')) await P.ev(`dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }))`); await sleep(400); }
    const fim = await J(`({ x: game.player.x, y: game.player.y, venceu: !!game.flags.trainers?.g4_duda })`);
    console.log('fim da luta:', fim);
    if (fim.venceu) confere(Math.hypot(fim.x - antesLuta.x, fim.y - antesLuta.y) < 3 * 16 && fim.x / 16 - R.x > 10.5, `depois da luta o jogador volta ao corredor (${(fim.x / 16 - R.x).toFixed(1)}, ${(fim.y / 16 - R.y).toFixed(1)})`);
    await foto(`${sala}-4-depois`);
  }
  console.log('erros:', s.erros());
  console.log(falhas ? `${falhas} FALHA(S)` : 'TUDO OK');
} finally { s.kill(); }
