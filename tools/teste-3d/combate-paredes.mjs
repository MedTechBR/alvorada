// Muitas lutas em salas estreitas (corredores do Farol Coral, da Mina e de outras salas com parede dos dois lados)
// e a conferência, quadro a quadro, de que nenhum Pokémon nem o treinador acaba dentro de um bloco sólido ou
// atravessa uma parede (empurrão de golpe, investida, esquiva, voo, cavar, teleporte, perseguição da IA).
// A luta roda de verdade (game.frame), sem a mudança para o espaço livre (a TrainerBattle é criada direto, como
// se o lugar fosse esse mesmo), com espécies escolhidas para forçar os casos: voa, cava, teleporta, Água anfíbio,
// investidas fortes. O jogador controla o Pokémon pelo analógico (input.move), esquiva e usa os golpes.
//   PORT=8811 node tools/teste-3d/combate-paredes.mjs [lutas=24] [segundos=14]
import { sessao } from './rb-lib.mjs';
const LUTAS = +(process.argv[2] ?? 24), SEG = +(process.argv[3] ?? 14);
const s = await sessao({ qs: 'ir=farol_coral', W: 844, H: 390, cel: true });
const { P } = s;
try {
  await P.ev(`(async () => { for (let i = 0; i < 60 && (game.story.busy || game.ui.dialog.open || game.mundo.warping); i++) { if (game.ui.dialog.open) dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true })); await new Promise((r) => setTimeout(r, 300)); } return 1; })()`);
  const r = JSON.parse(await P.ev(`(async () => {
    const g = game, T = 16, m = g.map;
    const { TrainerBattle } = await import('/src/story/battle.js');
    const { Mon } = await import('/src/data/mon.js');
    const { MOVES } = await import('/src/data/moves.js');
    const { TILE, WALLS } = await import('/src/world/tiles.js');
    g.app.ticker.stop(); // só os quadros deste teste
    const parede = (tx, ty) => { const t = m.at(tx, ty); return WALLS.has(t) || t === TILE.VOID || t === TILE.CLIFF; };
    // lugares estreitos: bloco livre com parede a até 2 blocos dos DOIS lados (esquerda/direita ou cima/baixo)
    const lugares = [];
    const pref = ['farol_coral_2', 'farol_coral', 'mina_aurora_n1', 'mina_aurora_n2', 'mina_aurora_n3', 'casarao_velas'];
    const salas = [...m.interiors].sort((a, b) => (pref.indexOf(b.id) >= 0) - (pref.indexOf(a.id) >= 0));
    for (const sala of salas) {
      let n = 0;
      for (let y = sala.y + 2; y < sala.y + sala.rows.length - 1 && n < 2; y++) for (let x = sala.x + 1; x < sala.x + sala.rows[0].length - 1 && n < 2; x++) {
        if (m.solidAt(x * T + 8, y * T + 8) || m.warpAt?.get(x + y * m.w)) continue;
        const lr = [1, 2].some((d) => parede(x - d, y)) && [1, 2].some((d) => parede(x + d, y));
        const ud = [1, 2].some((d) => parede(x, y - d)) && [1, 2].some((d) => parede(x, y + d));
        // precisa de 4 blocos livres seguidos no sentido do corredor (para caber os dois)
        const livre = (dx, dy) => [1, 2, 3, 4].every((k) => !m.solidAt((x + dx * k) * T + 8, (y + dy * k) * T + 8));
        if (lr && livre(0, 1)) { lugares.push({ sala: sala.id, x, y, dx: 0, dy: 1 }); n++; y += 3; }
        else if (ud && livre(1, 0)) { lugares.push({ sala: sala.id, x, y, dx: 1, dy: 0 }); n++; x += 4; }
      }
      if (lugares.length >= 16) break;
    }
    // quem luta: [dex, golpes]
    const ok = (l) => l.filter((id) => MOVES[id]);
    const ESP = [
      [16, ok(['quickAttack', 'wingAttack', 'gust', 'fly'])],      // Pidgey: voa
      [50, ok(['dig', 'tackle', 'quickAttack'])],                   // Diglett: cava
      [63, ok(['teleport', 'confusion'])],                          // Abra: teleporta
      [7, ok(['tackle', 'waterGun', 'aquaJet'])],                   // Squirtle: Água (anfíbio quando é o seu)
      [128, ok(['takeDown', 'bodySlam', 'tackle'])],                // Tauros: investidas fortes
      [58, ok(['flameWheel', 'extremeSpeed', 'roar'])],             // Growlithe: investidas longas, rugido
      [309, ok(['spark', 'quickAttack', 'roar'])],                  // Electrike (a da Duda)
      [41, ok(['wingAttack', 'whirlwind', 'quickAttack'])],         // Zubat: voa, vento
    ];
    const viol = [], resumo = { lutas: 0, quadros: 0, golpes: 0, dano: 0, lugares: lugares.length, porSala: {} };
    const solidoDe = (e) => e.isTrainer || !g.combat.alt.solido ? ((tx, ty) => m.solidAt(tx * T + 1, ty * T + 1, !!e.swim)) : g.combat.alt.solido(e); // sem alt.solido = código antigo (para comparar)
    const atravessou = (e, x0, y0) => {
      // algum ponto do caminho (de 2 em 2 px) cai num bloco sólido que nem a partida nem a chegada ocupam?
      const s = solidoDe(e), n = Math.max(1, Math.ceil(Math.hypot(e.x - x0, e.y - y0) / 2));
      for (let i = 1; i < n; i++) { const px = x0 + (e.x - x0) * i / n, py = y0 + (e.y - y0) * i / n; if (s(Math.floor(px / T), Math.floor(py / T))) return true; }
      return false;
    };
    const dentro = (e) => solidoDe(e)(Math.floor(e.x / T), Math.floor(e.y / T));
    for (let n = 0; n < ${LUTAS}; n++) {
      const L0 = lugares[n % lugares.length], [dA, gA] = ESP[n % ESP.length], [dB, gB] = ESP[(n * 3 + 1) % ESP.length];
      // jogador no corredor, treinador 4 blocos adiante
      const p = g.player; p.x = L0.x * T + 8; p.y = L0.y * T + 10; p.vx = p.vy = p.kx = p.ky = 0; p.seguro = null; g.grade?.soltar?.(p);
      g.cam.x = p.x; g.cam.y = p.y;
      if (g.lead) await g.recall?.();
      const mon = new Mon(dA, 30); mon.moves = gA.slice(0, 4); g.party[0] = mon; g.leadIdx = 0;
      for (const q of g.party) { q.heal?.(); }
      await g.sendOut(0, { x: p.x + L0.dx * 18, y: p.y + L0.dy * 18 });
      const npc = { x: (L0.x + L0.dx * 4) * T + 8, y: (L0.y + L0.dy * 4) * T + 10, faceTo() {}, throwPose() {}, goHome() {}, h: 20 };
      const fm = new Mon(dB, 30); fm.moves = gB.slice(0, 4);
      const b = new TrainerBattle(g.story, npc, { id: 'teste_paredes', name: 'Teste', team: [[dB, 30]] }, { team: [fm], semBola: true, noFlee: true, noBlackout: true });
      g.story.battle = b; g.story.busy = false;
      b.start();
      const prev = new Map();
      let t = 0, cd = 0;
      while (t < ${SEG} && !b.done) {
        const L = g.lead, f = b.active.find((e) => e.alive && !e.dead);
        // analógico: vai para o inimigo, às vezes de lado ou para trás (encosta na parede)
        if (L?.alive && f) {
          const dx = f.x - L.x, dy = f.y - L.y, d = Math.hypot(dx, dy) || 1, fase = Math.floor(t * 1.3) % 4;
          const [mx, my] = fase === 0 ? [dx / d, dy / d] : fase === 1 ? [-dy / d, dx / d] : fase === 2 ? [-dx / d, -dy / d] : [dy / d, -dx / d];
          g.input.move.x = mx; g.input.move.y = my;
          if ((cd -= 1 / 60) <= 0) { cd = 0.35; g.combat.use(L, Math.floor(Math.random() * L.mon.moves.length), f.x, f.y); resumo.golpes++; }
          if (Math.random() < 0.02) g.input.taps.add('dodge');
        } else { g.input.move.x = g.input.move.y = 0; }
        const hp0 = f?.mon.hp ?? 0;
        try { g.frame(1 / 60); } catch (err) { viol.push({ erro: String(err).slice(0, 200) }); break; }
        if (f) resumo.dano += Math.max(0, hp0 - f.mon.hp);
        // inimigo e o seu sempre com vida (a luta dura o tempo todo)
        for (const e of b.active) if (e.mon.hp < e.mon.stats.hp * 0.3) e.mon.hp = e.mon.stats.hp;
        if (g.lead?.mon && g.lead.mon.hp < g.lead.mon.stats.hp * 0.3) g.lead.mon.hp = g.lead.mon.stats.hp;
        if (g.ui.dialog.open) dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
        for (const e of [g.player, ...g.entities]) {
          if (!e || e.dead || e.pouso || e.saltando) { prev.delete(e); continue; }
          const q = prev.get(e);
          const nome = e.isTrainer ? 'treinador' : e.mon?.name;
          if (dentro(e)) viol.push({ tipo: 'dentro', quem: nome, modo: e.alt?.mode ?? '', sala: L0.sala, x: +(e.x / T).toFixed(2), y: +(e.y / T).toFixed(2), t: +t.toFixed(2) });
          else if (q && q.modo === (e.alt?.mode ?? '') && atravessou(e, q.x, q.y)) viol.push({ tipo: 'atravessou', quem: nome, modo: e.alt?.mode ?? '', sala: L0.sala, de: [+(q.x / T).toFixed(2), +(q.y / T).toFixed(2)], para: [+(e.x / T).toFixed(2), +(e.y / T).toFixed(2)], t: +t.toFixed(2) });
          prev.set(e, { x: e.x, y: e.y, modo: e.alt?.mode ?? '' });
        }
        t += 1 / 60; resumo.quadros++;
        if (resumo.quadros % 240 === 0) await new Promise((r) => setTimeout(r, 0));
        if (viol.length > 60) break;
      }
      b.finish('flee'); g.story.battle = null; g.story.busy = false;
      g.input.move.x = g.input.move.y = 0;
      resumo.lutas++; resumo.porSala[L0.sala] = (resumo.porSala[L0.sala] ?? 0) + 1;
      if (viol.length > 60) break;
    }
    g.app.ticker.start();
    return JSON.stringify({ resumo, viol: viol.slice(0, 40), total: viol.length, lugares: lugares.map((l) => l.sala + ' ' + l.x + ',' + l.y) });
  })()`));
  console.log('lugares estreitos:', r.lugares.join(' | '));
  console.log('resumo:', JSON.stringify(r.resumo));
  for (const v of r.viol) console.log('  ', JSON.stringify(v));
  console.log('erros da página:', s.erros());
  console.log(r.total === 0 && r.resumo.lutas >= 1 && r.resumo.dano > 0 ? `TUDO OK: ${r.resumo.lutas} lutas, ${r.resumo.quadros} quadros, nenhum Pokémon nem treinador na parede` : `FALHA: ${r.total} violações`);
  process.exitCode = r.total === 0 ? 0 : 1;
} finally { s.kill(); }
