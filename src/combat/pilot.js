import { IS_TOUCH } from '../engine/input.js';
import { dir4 } from '../sprites/trainer.js';
import { MOVES } from '../data/moves.js';

// Controle do jogador no combate:
// - modo de controle direto (R ou botão ◎): você anda com o Pokémon; o treinador fica para trás em segurança;
// - mira (mouse, analógico, arrasto no toque ou mira automática);
// - esquiva com rastro, pulo (X), ação de altura (C: voar, mergulhar, cavar);
// - recargas visíveis no HUD (barra + segundos no computador, anel nos botões do celular).

const CSS = `
#moves .mv .cdn { position:absolute; left:0; right:0; top:50%; transform:translateY(-50%); text-align:center; font:900 18px system-ui; color:#fff; text-shadow:0 2px 0 #0008; pointer-events:none; }
#moves .mv.ready { animation: mvready .35s ease-out; }
@keyframes mvready { 0% { box-shadow:0 0 0 0 #ffe27a; transform:scale(1.08); } 100% { box-shadow:0 0 0 10px #ffe27a00; transform:scale(1); } }
.tb.move { background-image: conic-gradient(rgba(20,30,24,.62) calc(var(--cd,0) * 1turn), transparent 0); }
.tb.move.ready { animation: mvready .35s ease-out; }
#pilotchip { position:absolute; top:44px; left:50%; transform:translateX(-50%); background:#e8584aee; color:#fff; font:800 12px system-ui; padding:4px 10px; border-radius:20px; letter-spacing:.4px; display:none; }
#pilotchip.on { display:block; }
#ctlhint { position:absolute; left:12px; bottom:12px; color:#fff; font:700 11px system-ui; opacity:.75; text-shadow:0 1px 0 #000a; line-height:1.4; }
#t-pilot { right: 214px; bottom: 160px; } #t-alt { right: 226px; bottom: 50px; } #t-jump { right: 176px; bottom: 214px; }
#t-pilot.on { background:#ffe39a; }
`;

export class Pilot {
  constructor(g, c) {
    this.g = g; this.c = c; this.active = false; this.cdPrev = [];
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const hud = document.getElementById('hud');
    if (hud) {
      this.chip = document.createElement('div'); this.chip.id = 'pilotchip'; hud.appendChild(this.chip);
      if (!IS_TOUCH) { const h = document.createElement('div'); h.id = 'ctlhint'; h.innerHTML = 'R: controlar o Pokémon · Espaço: esquiva · X: pular<br>C: voar / mergulhar / cavar · mouse: mirar'; hud.appendChild(h); }
    }
    const box = document.getElementById('tbtns');
    if (box && IS_TOUCH) {
      const mk = (id, label, act) => {
        const b = document.createElement('button'); b.className = 'tb small'; b.id = id; b.textContent = label; box.appendChild(b);
        b.addEventListener('touchstart', (e) => { g.input.taps.add(act); e.preventDefault(); }, { passive: false });
        return b;
      };
      this.btnPilot = mk('t-pilot', '◎', 'pilot'); mk('t-alt', '⇅', 'alt'); mk('t-jump', '⤒', 'jump');
    }
  }

  toggle() {
    const g = this.g, l = g.lead;
    if (!this.active && !l?.alive) return;
    this.active = !this.active;
    if (l) l.amphibious = this.active;
    g.camFocus = this.active ? () => (g.lead?.alive ? g.lead : g.player) : null;
    g.toast?.(this.active ? `Controle direto: você é ${l.mon.name}! (R para voltar)` : 'Controle do treinador');
    this.chip?.classList.toggle('on', this.active); if (this.chip) this.chip.textContent = this.active ? `CONTROLANDO ${l.mon.name.toUpperCase()}` : '';
    this.btnPilot?.classList.toggle('on', this.active);
    g.fx.ring(l.x, l.y, 0xffe27a, 8, 0.4, { width: 2 });
    this.c.sfx('blip');
  }

  // mira: mouse > analógico/arrasto > mira automática no inimigo mais perto (de preferência à frente)
  aimPoint(from) {
    const g = this.g, inp = g.input, lead = from ?? g.lead ?? g.player;
    if (inp.releasedAim?.dir) { const d = inp.releasedAim.dir, l = Math.hypot(d.x, d.y) || 1; return { x: lead.x + d.x / l * 140, y: lead.y + d.y / l * 140 }; }
    if (inp.aimStick) return { x: lead.x + inp.aimStick.x * 140, y: lead.y + inp.aimStick.y * 140 };
    if (!IS_TOUCH && !inp.usingPad && inp.mouse.inside) return g.screenToWorld(inp.mouse.x, inp.mouse.y);
    let best = null, bs = 1e9;
    const fa = lead.angle ?? 0;
    for (const w of g.wilds ?? []) {
      if (!w.alive || w.alt?.mode === 'dive' || w.alt?.mode === 'dig') continue;
      const d = Math.hypot(w.x - lead.x, w.y - lead.y); if (d > 230) continue;
      const da = Math.abs(Math.atan2(Math.sin(Math.atan2(w.y - lead.y, w.x - lead.x) - fa), Math.cos(Math.atan2(w.y - lead.y, w.x - lead.x) - fa)));
      const s = d * (1 + da * 0.5) * (w.aggroTarget === lead ? 0.7 : 1);
      if (s < bs) { bs = s; best = w; }
    }
    if (best) return { x: best.x, y: best.y - 6 };
    return { x: lead.x + Math.cos(fa) * 120, y: lead.y + Math.sin(fa) * 120 };
  }

  // chamado no começo do controle do jogo; devolve true quando o modo direto cuidou de tudo
  control(dt) {
    const g = this.g, inp = g.input, l = g.lead;
    if (inp.pressed('pilot')) this.toggle();
    if (this.active && !l?.alive) { this.active = false; g.camFocus = null; this.chip?.classList.remove('on'); this.btnPilot?.classList.remove('on'); }
    if (l?.alive) {
      if (inp.pressed('alt')) { const a = this.aimPoint(l); this.c.alt.action(l, a.x, a.y); }
      if (inp.pressed('jump')) this.c.alt.jump(l);
    }
    if (!this.active) return false;
    const p = g.player;
    p.t += dt; p.iframes -= dt; p.stun = (p.stun ?? 0) - dt; p.roll -= dt;
    // Pokémon anda livre
    const run = inp.down('run');
    const mode = l.alt?.mode;
    const base = (58 + l.stat('spe') * 0.6) * (l.mon.status === 'par' ? 0.6 : 1);
    const want = (l.stun > 0 || l.lock > 0 || l.charging) ? 0 : base * (run ? 1.55 : 1) * (mode === 'fly' ? 1.25 : mode === 'dive' ? 1.3 : mode === 'dig' ? 0.85 : 1);
    const mx = inp.move.x, my = inp.move.y, mag = Math.min(1, Math.hypot(mx, my));
    const tvx = mag > 0.1 ? mx * want : 0, tvy = mag > 0.1 ? my * want : 0;
    const acc = Math.min(1, dt * (mag > 0.1 ? 12 : 16));
    l.vx += (tvx - l.vx) * acc; l.vy += (tvy - l.vy) * acc;
    l.faceT = (l.faceT ?? 0) - dt;
    if (l.faceT <= 0 && Math.hypot(l.vx, l.vy) > 8 && !l.dashing) l.face(l.vx, l.vy);
    if (inp.pressed('dodge') && (this.dodgeCd ?? 0) <= 0 && l.stun <= 0) {
      const dx = mag > 0.1 ? mx : Math.cos(l.angle), dy = mag > 0.1 ? my : Math.sin(l.angle), d = Math.hypot(dx, dy) || 1;
      l.kx += dx / d * 330; l.ky += dy / d * 330; l.iframes = Math.max(l.iframes, 0.36); this.dodgeCd = 0.55;
      if (l.set?.anims?.Hop) l.play('Hop');
      this.c.onDodge(l);
    }
    this.dodgeCd = (this.dodgeCd ?? 0) - dt;
    for (let s = 0; s < 4; s++) if (inp.pressed('m' + s)) { const a = this.aimPoint(l); this.c.use(l, s, a.x, a.y); }
    if (inp.pressed('ball')) { const a = this.aimPoint(l); g.throwBall(a.x, a.y); }
    if (inp.pressed('swap')) { this.toggle(); g.swap(); }
    // treinador fica para trás, seguindo de longe e longe do perigo
    const dx = l.x - p.x, dy = l.y - p.y, d = Math.hypot(dx, dy);
    const far = 70, sp = d > far ? Math.min(118, (d - far) * 3) : 0;
    let tvx2 = d > 0.1 ? dx / d * sp : 0, tvy2 = d > 0.1 ? dy / d * sp : 0;
    if (p.stun > 0) { tvx2 = tvy2 = 0; }
    p.vx += (tvx2 - p.vx) * Math.min(1, dt * 8); p.vy += (tvy2 - p.vy) * Math.min(1, dt * 8);
    p.x += (p.vx + p.kx) * dt; p.y += (p.vy + p.ky) * dt;
    p.kx *= 1 - Math.min(1, dt * 8); p.ky *= 1 - Math.min(1, dt * 8);
    if (d > 420 && !l.alt) { p.x = l.x - dx / d * far; p.y = l.y - dy / d * far; }
    g.map.resolve(p, p.r);
    p.speed = Math.hypot(p.vx, p.vy);
    if (p.speed > 10) p.dir = dir4(p.vx, p.vy); else if (d > 1) p.dir = dir4(dx, dy);
    const step = p.speed > 10 ? Math.floor(p.t * (p.speed > 90 ? 11 : 7.5)) % 4 : 0;
    p.body.texture = ((p.speed > 90 ? p.frames.run : p.frames.walk) ?? p.frames)[p.dir][step];
    p.body.alpha = p.iframes > 0 && Math.sin(p.t * 40) > 0 ? 0.5 : 1;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y;
    return true;
  }

  // anel sob o Pokémon controlado
  drawWorld(G) {
    if (!this.active) return;
    const l = this.g.lead; if (!l?.alive || this.c.alt.hidden(l)) return;
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
      const tb = [...tbs].find((b) => +b.dataset.slot === i);
      if (tb) tb.style.setProperty('--cd', k.toFixed(3));
      if ((this.cdPrev[i] ?? 0) > 0 && cd <= 0) { for (const e of [el, tb]) if (e) { e.classList.remove('ready'); void e.offsetWidth; e.classList.add('ready'); } }
      this.cdPrev[i] = cd;
    }
  }
}
