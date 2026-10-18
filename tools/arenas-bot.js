// Robô de luta para testar as arenas dos ginásios (só desenvolvimento): no console, `await import('/tools/arenas-bot.js')`.
// Joga como uma pessoa: só usa o que aparece na tela (avisos da arena e a telegrafia dos golpes), com tempo de reação,
// e mexe no jogo pelo CONTROLE (movimento, mira, golpes e esquiva entram como entrada do teclado/analógico).
// Nada de dano forçado nem de teleporte: se o robô perde, o teste mostra que perdeu.
// window.bot.ligar({ reacao: 0.3, acerto: 0.85 }) · bot.desligar() · bot.stats (esquivas, golpes, tempo em perigo)
const G = () => window.game;
const bot = (window.bot ??= { on: false, stats: null });
bot.ligar = (o = {}) => {
  const g = G(), inp = g.input;
  bot.o = { reacao: o.reacao ?? 0.3, acerto: o.acerto ?? 0.85, ...o };
  bot.on = true; bot.st = { perigoT: 0, alvoT: 0, desv: null, dodgeId: null, slot: 0, golpeT: 0, lado: 1, ladoT: 0 };
  bot.stats = { esquivas: 0, golpes: 0, fugas: 0, emPerigo: 0, quadros: 0 };
  if (!inp.__botPoll) { const orig = inp.poll.bind(inp); inp.poll = () => { orig(); if (bot.on) try { bot.passo(); } catch (e) { console.warn('bot', e); } }; inp.__botPoll = true; }
};
bot.desligar = () => { bot.on = false; const inp = G()?.input; if (inp) { inp.move.x = inp.move.y = 0; inp.aimStick = null; inp.held.delete('run'); } };

bot.passo = () => {
  const g = G(), inp = g.input, b = g.story?.battle, L = g.lead, A = g.arenaGinasio, s = bot.st, dt = 1 / 60;
  inp.aimStick = null; inp.held.delete('run');
  if (!b || b.done || g.mode !== 'pokemon' || !L?.alive) { inp.move.x = inp.move.y = 0; return; }
  bot.stats.quadros++;
  const alvos = [...b.active.filter((e) => e.alive), ...(A?.ajudantes ?? []).filter((e) => e.alive)];
  if (!alvos.length) { inp.move.x = inp.move.y = 0; return; }
  const alvo = alvos.reduce((m, e) => (Math.hypot(e.x - L.x, e.y - L.y) < Math.hypot(m.x - L.x, m.y - L.y) ? e : m));
  const dx = alvo.x - L.x, dy = alvo.y - L.y, d = Math.hypot(dx, dy) || 1;
  let mx = 0, my = 0;
  // 1) perigo da arena no lugar onde está: reage depois do tempo de reação humano, corre para o lugar seguro
  const pg = A ? A.perigo(L.x, L.y, L) : 0;
  if (pg >= 0.45) { s.perigoT += dt; bot.stats.emPerigo++; } else { s.perigoT = 0; s.desv = null; }
  if (pg >= 0.45 && s.perigoT >= bot.o.reacao) {
    if (!s.desv || A.perigo(s.desv.x, s.desv.y, L) >= 0.3) { s.desv = A.seguro(L, alvo); if (s.desv) bot.stats.fugas++; }
    if (s.desv) { const ex = s.desv.x - L.x, ey = s.desv.y - L.y, el = Math.hypot(ex, ey) || 1; mx = ex / el; my = ey / el; inp.held.add('run'); }
    // aviso quase no fim e ainda dentro: esquiva (a esquiva também livra dos perigos)
    const av = A.avisos.find((a) => a.dano !== false && A.cobre(a, L.x, L.y, L.r) && a.t > a.dur - 0.22);
    if (av && (L.dodgeCd ?? 0) <= 0 && s.dodgeId !== 'a' + av.id && Math.random() < bot.o.acerto) { s.dodgeId = 'a' + av.id; inp.taps.add('dodge'); bot.stats.esquivas++; }
  } else {
    // 2) distância de luta: perto para golpe corpo a corpo, longe para golpe à distância; anda de lado
    const mvs = L.mon.moves.map((id) => g.combat.move(id)).filter(Boolean);
    const melee = mvs.some((m) => ['melee', 'multi', 'dash'].includes(m.kind)) && !mvs.some((m) => m.cat !== 'status' && ['proj', 'beam', 'cone', 'line', 'bolt'].includes(m.kind));
    const quer = melee ? L.r + alvo.r + 10 : 64;
    if ((s.ladoT -= dt) <= 0) { s.ladoT = 1.2 + Math.random() * 1.5; s.lado = Math.random() < 0.5 ? 1 : -1; }
    if (d > quer + 12) { mx = dx / d; my = dy / d; } else if (d < quer - 14) { mx = -dx / d * 0.7; my = -dy / d * 0.7; }
    mx += -dy / d * 0.5 * s.lado; my += dx / d * 0.5 * s.lado;
    // não entra andando num aviso
    if (A && A.perigo(L.x + mx * 22, L.y + my * 22, L) >= 0.45) { const t = mx; mx = -my; my = t; if (A.perigo(L.x + mx * 22, L.y + my * 22, L) >= 0.45) { mx = -mx; my = -my; } }
  }
  // 3) golpe do Pokémon do líder carregando contra você: esquiva na hora certa (fim da carga)
  for (const e of alvos) {
    const c = e.charging; if (!c || c.t < bot.o.reacao) continue;
    const id = e.mon.uid + ':' + c.slot + ':' + Math.round(e.cds[c.slot] * 10);
    if (s.dodgeId === id || c.t < c.W - 0.24 || (L.dodgeCd ?? 0) > 0) continue;
    const ang = Math.atan2(L.y - e.y, L.x - e.x), da = Math.abs(Math.atan2(Math.sin(ang - c.ang), Math.cos(ang - c.ang))), de = Math.hypot(L.x - e.x, L.y - e.y);
    if (de > 150 || (da > 0.6 && de > 40)) continue;
    s.dodgeId = id;
    if (Math.random() < bot.o.acerto) { mx = -Math.sin(c.ang) * s.lado; my = Math.cos(c.ang) * s.lado; inp.taps.add('dodge'); bot.stats.esquivas++; }
  }
  const ml = Math.hypot(mx, my); inp.move.x = ml > 0.01 ? mx / ml : 0; inp.move.y = ml > 0.01 ? my / ml : 0;
  // 4) golpes em rodízio, mirando no alvo (como o analógico da direita)
  inp.aimStick = { x: dx / d, y: dy / d };
  if ((s.golpeT -= dt) <= 0 && L.lock <= 0 && L.stun <= 0) {
    for (let k = 0; k < 4; k++) {
      const i = (s.slot + k) % 4, id = L.mon.moves[i], mv = g.combat.move(id);
      if (!mv || L.cds[i] > 0 || (mv.cat === 'status' && Math.random() < 0.6)) continue;
      if (!g.combat.inRange(L, mv, d, id)) continue;
      inp.taps.add('m' + i); s.slot = i + 1; s.golpeT = 0.18 + Math.random() * 0.2; bot.stats.golpes++; break;
    }
  }
};
export default bot;
