import { IS_TOUCH } from '../engine/input.js';
import { ICONES } from '../ui/toque.js';

// Complementos do controle do Pokémon (o controle direto em si fica em main.js: treinador ↔ Pokémon):
// - ações de altura no modo Pokémon: C = voar / pousar, mergulhar ou cavar; X = pular;
// - Pokémon de Água controlado entra e sai da água; velocidade muda voando, mergulhado ou cavando;
// - mira para os golpes contínuos (feixes acompanham a mira);
// - recargas visíveis (segundos no computador, anel nos botões do celular) e anel sob o Pokémon controlado.

const CSS = `
#moves .mv .cdn { position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; font:900 18px var(--font); color:#fff; text-shadow:0 2px 0 #0008; pointer-events:none; }
#moves .mv.ready { animation: mvready .35s ease-out; }
@keyframes mvready { 0% { box-shadow:0 0 0 0 #ffe27a; transform:scale(1.08); } 100% { box-shadow:0 0 0 10px #ffe27a00; transform:scale(1); } }
.tb.move.ready { animation: mvready .35s ease-out; }
`;

export class Pilot {
  constructor(g, c) {
    this.g = g; this.c = c; this.cdPrev = [];
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const box = document.getElementById('tbtns');
    if (box && IS_TOUCH) {
      // posição, ícone e quando aparecem: src/ui/toque.js
      const mk = (id, icone, act, aria) => {
        const b = document.createElement('button'); b.className = 'tb small'; b.id = id; b.innerHTML = icone; b.setAttribute('aria-label', aria); box.appendChild(b);
        b.addEventListener('touchstart', (e) => { g.input.taps.add(act); e.preventDefault(); }, { passive: false });
      };
      mk('t-alt', ICONES.voar, 'alt', 'Voar ou mergulhar'); mk('t-jump', ICONES.pular, 'jump', 'Pular');
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
    const els = document.querySelectorAll('#moves .mv:not(.power)'), tbs = document.querySelectorAll('.tb.move');
    for (let i = 0; i < 4; i++) {
      const mv = this.c.moveAt(l, i).mv; if (!mv) continue; // em Dynamax, o Max Golpe
      const cd = Math.max(0, l.cds[i]), k = cd / (this.c.recarga(l, mv) || 1);
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
