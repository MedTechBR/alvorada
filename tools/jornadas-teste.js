// Ajudantes de teste das jornadas (só para desenvolvimento): no console, `await import('/tools/jornadas-teste.js')`.
// motor(): faz o jogo andar (game.frame) mesmo com o painel oculto e passa os diálogos sozinho, guardando tudo em
// window.falas. escolhas.push(i) responde a próxima pergunta com a opção i (padrão 0).
// tp(bx, by): leva o jogador a um bloco. ate(fn, s): espera fn() ficar verdadeira (s segundos no máximo).
// lutar(s): o Pokémon do jogador ataca o inimigo mais perto com o golpe 1 a 4 (luta de verdade, sem dano forçado).
const g = () => window.game;
window.falas = [];
window.escolhas = [];
const tecla = (code) => dispatchEvent(new KeyboardEvent('keydown', { code, key: code === 'Enter' ? 'Enter' : code, bubbles: true }));
window.motor = (on = true) => {
  clearInterval(window.__motor);
  if (!on) return;
  let ultimo = null, antes = performance.now();
  // com o painel oculto o navegador segura os timers (1 vez por segundo): roda os quadros que faltaram de uma vez
  window.__motor = setInterval(() => {
    const G = g(); if (!G) return;
    const agora = performance.now(), n = Math.max(1, Math.min(90, Math.round((agora - antes) / 16.7))); antes = agora;
    for (let i = 0; i < n; i++) {
      G.frame(1 / 60);
      if (i % 20 === 0) window.passoLuta?.();
      const d = G.ui?.dialog?.d;
      // telas que esperam o jogador (aprender golpe, evolução): Enter aceita
      if (!d && i % 30 === 0 && document.querySelector('.gm-learn, .evo, .evolucao')?.offsetParent) tecla('Enter');
      if (!d) continue;
      const k = d.name + '|' + d.lines?.[d.i];
      if (k !== ultimo) { ultimo = k; window.falas.push(`${d.name ? d.name + ': ' : ''}${d.lines?.[d.i] ?? ''}`); }
      const box = document.querySelector('.dlg-choices');
      if (d.choices && box && !box.hidden) { d.sel = window.escolhas.length ? window.escolhas.shift() : 0; window.falas.push(`  [escolha] ${d.choices[d.sel]}`); }
      if (i % 4 === 0) tecla('Enter');
    }
  }, 16);
};
window.tp = (bx, by) => {
  const G = g(), p = G.player; p.x = bx * 16 + 8; p.y = by * 16 + 8; p.vx = p.vy = 0;
  if (G.lead) { G.lead.x = p.x + 14; G.lead.y = p.y + 6; }
  G.cam.x = p.x; G.cam.y = p.y;
};
window.ate = async (fn, s = 20) => { const t0 = performance.now(); while (!fn()) { if (performance.now() - t0 > s * 1000) return false; await new Promise((r) => setTimeout(r, 100)); } return true; };
window.espera = (s) => new Promise((r) => setTimeout(r, s * 1000));
// combate (lutar()): o Pokémon do jogador vai até o inimigo mais perto e usa os golpes em rodízio, como o jogador
// faria; se desmaiar, manda o próximo. Roda dentro do motor() (a cada 20 quadros).
window.lutar = (on = true) => {
  let i = 0;
  window.passoLuta = !on ? null : () => {
    const G = g(), b = G.story?.battle; if (!b) return;
    const alvo = b.active.find((e) => e.alive && !e.dead); if (!alvo) return;
    const L = G.lead;
    if (!L?.alive) { if (!G.throwingMon && !(G.sendingOut > 0)) { const k = G.party.findIndex((m) => !m.fainted); if (k >= 0) G.throwMon(k, alvo.x, alvo.y); } return; }
    const dx = alvo.x - L.x, dy = alvo.y - L.y, d = Math.hypot(dx, dy) || 1;
    if (d > 120) { const p = G.player, px = alvo.x - p.x, py = alvo.y - p.y, pd = Math.hypot(px, py) || 1; L.x = p.x + px / pd * Math.min(pd - 30, 60); L.y = p.y + py / pd * Math.min(pd - 30, 60); return; }
    if (d > 36) { L.x += dx / d * 6; L.y += dy / d * 6; }
    G.combat.use(L, i++ % Math.max(1, L.mon.moves.length), alvo.x, alvo.y);
  };
};
// fala com um personagem (como apertar E perto dele)
window.falar = async (quem) => {
  const G = g(), r = G.story.roteiro;
  const n = [...r.atores.values()].find((a) => (a.e.id === quem || a.e.quem === quem) && a.visible) ?? G.story.npc(quem);
  if (!n) return 'sem ator';
  const p = G.player; p.x = n.x; p.y = n.y + 14; p.dir = 'up'; G.cam.x = p.x; G.cam.y = p.y;
  const it = G.story.interactions().find((x) => x.o === n); if (!it) return 'sem interação';
  await G.story.cut(it.fn); return 'ok';
};
window.flagsDe = (...ks) => Object.fromEntries(ks.map((k) => [k, k.split('.').reduce((o, p) => o?.[p], g().flags)]));
export default true;
