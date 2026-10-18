import { IS_TOUCH } from '../engine/input.js';
import { MOVES } from '../data/moves.js';

// Complementos do controle do Pokémon (o controle direto em si fica em main.js: treinador ↔ Pokémon):
// - ações de altura no modo Pokémon: C = voar / pousar, mergulhar ou cavar; X = pular;
// - Pokémon de Água controlado entra e sai da água; velocidade muda voando, mergulhado ou cavando;
// - mira para os golpes contínuos (feixes acompanham a mira);
// - recargas visíveis (segundos no computador, anel nos botões do celular) e anel sob o Pokémon controlado.

const CSS = `
#moves .mv .cdn { position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; font:900 18px system-ui; color:#fff; text-shadow:0 2px 0 #0008; pointer-events:none; }
#moves .mv.ready { animation: mvready .35s ease-out; }
@keyframes mvready { 0% { box-shadow:0 0 0 0 #ffe27a; transform:scale(1.08); } 100% { box-shadow:0 0 0 10px #ffe27a00; transform:scale(1); } }
.tb.move { background-image: conic-gradient(rgba(20,30,24,.62) calc(var(--cd,0) * 1turn), transparent 0); }
.tb.move.ready { animation: mvready .35s ease-out; }
#t-alt { right: 226px; bottom: 50px; } #t-jump { right: 176px; bottom: 214px; }
#t-alt, #t-jump { display: none; } body.mode-pokemon #t-alt, body.mode-pokemon #t-jump { display: block; }
`;

export class Pilot {
  constructor(g, c) {
    this.g = g; this.c = c; this.cdPrev = [];
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const box = document.getElementById('tbtns');
    if (box && IS_TOUCH) {
      const mk = (id, label, act, aria) => {
        const b = document.createElement('button'); b.className = 'tb small'; b.id = id; b.textContent = label; b.setAttribute('aria-label', aria); box.appendChild(b);
        b.addEventListener('touchstart', (e) => { g.input.taps.add(act); e.preventDefault(); }, { passive: false });
      };
      mk('t-alt', '⇅', 'alt', 'Voar, mergulhar ou cavar'); mk('t-jump', '⤒', 'jump', 'Pular');
    }
  }
  get active() { return this.g.mode === 'pokemon' && !!this.g.lead?.alive; }

  // mira: mouse > analógico/arrasto > mira automática no inimigo mais perto (de preferência à frente)
  aimPoint(from) {
    const g = this.g, inp = g.input, lead = from ?? g.lead ?? g.player;
    if (inp.releasedAim?.dir) { const d = inp.releasedAim.dir, l = Math.hypot(d.x, d.y) || 1; return { x: lead.x + d.x / l * 140, y: lead.y + d.y / l * 140 }; }
    if (inp.aimStick) return { x: lead.x + inp.aimStick.x * 140, y: lead.y + inp.aimStick.y * 140 };
    if (!IS_TOUCH && !inp.usingPad && inp.mouse.inside) return g.screenToWorld(inp.mouse.x, inp.mouse.y);
    let best = null, bs = 1e9;
    const fa = lead.angle ?? 0;
    for (const w of g.entities ?? []) {
      if (!w.alive || !this.c.hostile(lead, w) || this.c.alt.hidden(w)) continue;
      const d = Math.hypot(w.x - lead.x, w.y - lead.y); if (d > 230) continue;
      const a = Math.atan2(w.y - lead.y, w.x - lead.x), da = Math.abs(Math.atan2(Math.sin(a - fa), Math.cos(a - fa)));
      const s = d * (1 + da * 0.5) * (w.aggroTarget === lead ? 0.7 : 1);
      if (s < bs) { bs = s; best = w; }
    }
    if (best) return { x: best.x, y: best.y - 6 };
    return { x: lead.x + Math.cos(fa) * 120, y: lead.y + Math.sin(fa) * 120 };
  }

  // gancho no fim do controle do jogo (main.js); pk = está controlando o Pokémon
  control(dt, pk) {
    const g = this.g, inp = g.input, l = g.lead;
    document.body.classList.toggle('mode-pokemon', !!pk);
    if (l) l.amphibious = !!pk;
    if (!pk || !l?.alive) return;
    if (inp.pressed('alt')) { const a = this.aimPoint(l); this.c.alt.action(l, a.x, a.y); }
    if (inp.pressed('jump')) this.c.alt.jump(l);
    const mode = l.alt?.mode;
    if (mode) { const k = mode === 'fly' ? 1.25 : mode === 'dive' ? 1.3 : 0.85; l.vx *= k; l.vy *= k; }
  }

  // anel sob o Pokémon controlado
  drawWorld(G) {
    if (!this.active) return;
    const l = this.g.lead; if (this.c.alt.hidden(l)) return;
    const k = 0.5 + 0.5 * Math.sin(this.g.time * 6);
    G.ellipse(l.x, l.y + 1, l.r + 5 + k, (l.r + 5 + k) * 0.5).stroke({ width: 1, color: 0xffe27a, alpha: 0.55 + 0.3 * k });
  }

  // recargas visíveis
  hud(dt) {
    this.hudT = (this.hudT ?? 0) - dt; if (this.hudT > 0) return; this.hudT = 0.05;
    const l = this.g.lead; if (!l) return;
    const moves = l.mon.moves;
    const els = document.querySelectorAll('#moves .mv'), tbs = document.querySelectorAll('.tb.move');
    for (let i = 0; i < 4; i++) {
      const mv = MOVES[moves[i]]; if (!mv) continue;
      const cd = Math.max(0, l.cds[i]), k = cd / (mv.cd || 1);
      const el = els[i];
      if (el) {
        let n = el.querySelector('.cdn'); if (!n) { n = document.createElement('i'); n.className = 'cdn'; el.appendChild(n); }
        n.textContent = cd > 0.05 ? cd.toFixed(1) : '';
      }
      let tb = null; for (const b of tbs) if (+b.dataset.slot === i) tb = b;
      if (tb) tb.style.setProperty('--cd', k.toFixed(3));
      if ((this.cdPrev[i] ?? 0) > 0 && cd <= 0) { for (const e of [el, tb]) if (e) { e.classList.remove('ready'); void e.offsetWidth; e.classList.add('ready'); } }
      this.cdPrev[i] = cd;
    }
  }
}
