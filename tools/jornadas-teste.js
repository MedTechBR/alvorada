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
  let ultimo = null;
  window.__motor = setInterval(() => {
    const G = g(); if (!G) return;
    G.frame(1 / 60);
    const d = G.ui?.dialog?.d;
    if (d) {
      const k = d.name + '|' + d.lines?.[d.i];
      if (k !== ultimo) { ultimo = k; window.falas.push(`${d.name ? d.name + ': ' : ''}${d.lines?.[d.i] ?? ''}`); }
      const box = document.querySelector('.dlg-choices');
      if (d.choices && box && !box.hidden) { d.sel = window.escolhas.length ? window.escolhas.shift() : 0; window.falas.push(`  [escolha] ${d.choices[d.sel]}`); }
      tecla('Enter');
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
// combate: o Pokémon do jogador mira o inimigo mais perto e usa os golpes em rodízio
window.lutar = (on = true) => {
  clearInterval(window.__luta);
  if (!on) return;
  let i = 0;
  window.__luta = setInterval(() => {
    const G = g(), b = G.story?.battle, L = G.lead;
    if (!b || !L?.alive) return;
    const alvo = b.active.find((e) => e.alive && !e.dead); if (!alvo) return;
    const dx = alvo.x - L.x, dy = alvo.y - L.y, d = Math.hypot(dx, dy) || 1;
    // chega perto (como o jogador faria com o analógico), mira e usa os golpes em rodízio
    if (d > 36) { L.x += dx / d * 6; L.y += dy / d * 6; L.face?.(dx, dy); }
    G.combat.use(L, i++ % Math.max(1, L.mon.moves.length), alvo.x, alvo.y);
  }, 350);
};
window.flagsDe = (...ks) => Object.fromEntries(ks.map((k) => [k, k.split('.').reduce((o, p) => o?.[p], g().flags)]));
export default true;
