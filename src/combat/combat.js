import * as PIXI from 'pixi.js';
import { MOVES } from '../data/moves.js';
import { BEAMS } from './specialmoves.js';
import { computeDamage } from './damage.js';
import { Vfx, typeHex, meleeStyle, ANIM_PREF } from './vfx.js';
import { Arena } from './arena.js';
import { WildAI } from './ai.js';
import { Altitude } from './altitude.js';
import { Pilot } from './pilot.js';

// Combate contínuo no próprio mapa: qualquer Pokémon pode atacar qualquer alvo a qualquer momento.
// Lados: 'ally' (seu time + você) e 'wild'. Selvagens de bandos/espécies rivais também brigam entre si.
// Golpes de lados opostos se chocam no ar; feixes que se encontram disputam força.
const M = 16;            // 1 m = 16 px
const TAU = Math.PI * 2;
const WARN = 0xff3b2f;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1);
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

export class Combat {
  constructor(g) {
    this.g = g;
    this.projectiles = []; this.zones = []; this.beams = []; this.waves = []; this.falls = []; this.swings = []; this.struggles = [];
    this.layer = new PIXI.Container();
    this.vfx = new Vfx(g);
    this.headsN = new PIXI.Container();
    this.headsA = new PIXI.Container(); this.headsA.blendMode = 'add';
    this.gfx = new PIXI.Graphics(); this.gfx.blendMode = 'add';
    this.layer.addChild(this.vfx.ghosts, this.headsN, this.gfx, this.headsA);
    this.groundG = new PIXI.Graphics();
    g.fx.ground.addChild(this.groundG);
    this.headPool = [];
    this.arena = new Arena(g);
    this.ai = new WildAI(g, this);
    this.alt = new Altitude(g, this);
    this.pilot = new Pilot(g, this);
    this.sfxT = {};
  }
  move(id) { return MOVES[id]; }
  range(mv) { return (mv.range ?? 6) * M; }
  inRange(user, mv, d, id) {
    if (mv.kind === 'self') return true;
    if (mv.kind === 'melee' || mv.kind === 'multi') return d < (mv.range ?? 1.8) * M + 10 + user.r;
    if (mv.kind === 'dash') return d < this.range(mv) * 0.75;
    if (mv.kind === 'wave' || mv.kind === 'quake') return d < this.range(mv) * 0.85;
    const b = BEAMS[id]; if (b) return d < b.range * M * 0.9;
    return d < this.range(mv) * 0.9;
  }

  // ---------- quem é inimigo de quem ----------
  hostile(a, b) {
    if (!b || a === b) return false;
    if (b.isTrainer) return a.side === 'wild' && !a.isTrainer;
    if (b.dead || b.mon?.hp <= 0 || a.isTrainer) return false;
    if (a.side !== 'wild') return b.side === 'wild';
    if (b.side !== 'wild') return true;
    if (a.pack && a.pack === b.pack) return false;
    return a.aggroTarget === b || b.aggroTarget === a;
  }
  targetsOf(user) {
    const out = [];
    for (const o of this.g.entities) if (o.alive && !o.busy && this.hostile(user, o)) out.push(o);
    if (user.side === 'wild' && this.g.player && this.hostile(user, this.g.player)) out.push(this.g.player);
    return out;
  }
  enemiesOf(e) { return this.targetsOf(e); }
  centerY(e) { return e.isTrainer ? e.y - 10 : e.y - (e.midH ?? 12); }

  // ponto de saída do golpe: usa o ponto da boca do quadro, se o sprite trouxer, senão estima
  mouth(user, dx, dy, kind = 'mouth') {
    const ep = user.emitPoint?.(kind);
    if (ep) return { x: ep.x + dx * 2, y: ep.y - ep.h + dy * 2, gy: ep.y + dy * 2, h: ep.h };
    const h = (user.midH ?? 12) + 2;
    return { x: user.x + dx * (user.r * 0.9 + 2), y: user.y - h + dy * user.r * 0.4, gy: user.y, h };
  }
  pickAnim(user, list) { for (const a of list) if (user.set?.anims?.[a]) return a; return 'Attack'; }
  sfx(name, type, gap = 0.035) {
    const now = this.g.time; const k = name + (type ?? '');
    if (now - (this.sfxT[k] ?? -9) < gap) return;
    this.sfxT[k] = now; this.g.audio?.sfx?.(name, type);
  }

  // ---------- telegrafia (selvagens avisam antes de atacar) ----------
  windup(user, slot, target) {
    const id = user.mon.moves[slot], mv = MOVES[id];
    if (!mv || user.cds[slot] > 0 || user.lock > 0 || user.stun > 0 || user.charging || !user.alive) return false;
    user.cds[slot] = mv.cd * 1.5;
    const pw = mv.power ?? 40, melee = mv.kind === 'melee' || mv.kind === 'multi';
    let W = (melee ? 0.36 : 0.5) + pw / 320 + (BEAMS[id] ? 0.25 : 0);
    if (user.temper === 'aggressive') W *= 0.88;
    if (user.isAlpha) W *= 1.1;
    if (mv.kind === 'self') W = 0.25;
    const ang = Math.atan2(target.y - user.y, target.x - user.x);
    user.charging = { slot, id, mv, t: 0, W, ang, tx: target.x, ty: target.y, target, lockAt: W * 0.62 };
    user.lock = W + 0.05;
    user.play(this.pickAnim(user, ['Charge', 'Idle']), true);
    this.sfx('warn', mv.type, 0.15);
    return true;
  }
  #updateCharging(e, dt) {
    const c = e.charging; c.t += dt;
    if (!e.alive || e.stun > 0) { e.charging = null; return; }
    if (c.t < c.lockAt && c.target?.alive !== false) { c.ang = Math.atan2(c.target.y - e.y, c.target.x - e.x); c.tx = c.target.x; c.ty = c.target.y; }
    e.face(Math.cos(c.ang), Math.sin(c.ang));
    // energia convergindo para o corpo
    const col = typeHex(c.mv.type), cy = this.centerY(e);
    if (Math.random() < dt * 30) { const a = Math.random() * TAU, R = 16 + e.r; this.g.fx.emit(e.x + Math.cos(a) * R, cy + Math.sin(a) * R, { tex: 'glow', color: col, size: 3, n: 1, speed: R / 0.22, dir: a + Math.PI, spread: 0, drag: 0, life: 0.22 }); }
    if (c.t >= c.W) {
      e.charging = null; e.lock = 0;
      const d = Math.max(30, Math.hypot(c.tx - e.x, c.ty - e.y));
      this.use(e, c.slot, e.x + Math.cos(c.ang) * d, e.y + Math.sin(c.ang) * d, { forced: true });
    }
  }
  #drawTelegraph(G, e) {
    const c = e.charging, mv = c.mv, k = c.t / c.W, x = e.x, y = e.y;
    const pulse = k > 0.75 ? (Math.sin(this.g.time * 40) > 0 ? 1 : 0.55) : 1;
    const a1 = (0.12 + 0.2 * k) * pulse, edge = { width: 1, color: WARN, alpha: 0.5 + 0.4 * k };
    const ca = Math.cos(c.ang), sa = Math.sin(c.ang);
    const lane = (len, w, prog) => {
      const nx = -sa * w / 2, ny = ca * w / 2;
      G.poly([x + nx, y + ny, x + ca * len + nx, y + sa * len + ny, x + ca * len - nx, y + sa * len - ny, x - nx, y - ny]).fill({ color: WARN, alpha: a1 * 0.7 }).stroke(edge);
      const l2 = len * prog;
      G.poly([x + nx, y + ny, x + ca * l2 + nx, y + sa * l2 + ny, x + ca * l2 - nx, y + sa * l2 - ny, x - nx, y - ny]).fill({ color: WARN, alpha: a1 });
    };
    const wedge = (R, half) => {
      G.moveTo(x, y).arc(x, y, R, c.ang - half, c.ang + half).closePath().fill({ color: WARN, alpha: a1 * 0.7 }).stroke(edge);
      G.moveTo(x, y).arc(x, y, Math.max(1, R * k), c.ang - half, c.ang + half).closePath().fill({ color: WARN, alpha: a1 });
    };
    const circle = (cx, cy, R) => { G.circle(cx, cy, R).fill({ color: WARN, alpha: a1 * 0.6 }).stroke(edge); G.circle(cx, cy, Math.max(1, R * k)).fill({ color: WARN, alpha: a1 }); };
    switch (mv.kind) {
      case 'proj': { const b = BEAMS[c.id]; lane(b ? b.range * M : this.range(mv), b ? b.width + 8 : 10 + (mv.power ?? 40) / 12, k); break; }
      case 'melee': case 'multi': wedge((mv.range ?? 1.8) * M + e.r + 10, 0.85); break;
      case 'dash': lane(this.range(mv) * 0.62 + 16, e.r * 2 + 6, k); break;
      case 'cone': wedge(this.range(mv), 0.55); break;
      case 'wave': case 'quake': circle(x, y, this.range(mv)); break;
      case 'cloud': case 'rain': { const d = Math.min(Math.hypot(c.tx - x, c.ty - y), this.range(mv)); circle(x + ca * d, y + sa * d, 26); break; }
      case 'fly': case 'dig': case 'dive': circle(c.tx, c.ty, 18); break;
    }
  }

  // ---------- usar golpe ----------
  // Usa o golpe do espaço `slot` mirando no ponto (ax, ay)
  use(user, slot, ax, ay, opts = {}) {
    const id = opts.moveId ?? user.mon.moves[slot], mv = MOVES[id];
    if (!mv || !user.alive) return false;
    // disputa de feixes: apertar golpe = empurrar
    const myBeam = this.beams.find((b) => b.user === user && b.struggle);
    if (myBeam) { myBeam.mash = Math.min(2, myBeam.mash + 0.3); this.g.fx.emit(myBeam.hx, myBeam.hy, { tex: 'spark', color: 0xffffff, n: 4, speed: 60, life: 0.15 }); return true; }
    if (user.alt?.mode === 'dive' || user.alt?.mode === 'dig') { this.alt.emerge(user, ax, ay); return true; }
    if (!opts.forced) {
      if (user.cds[slot] > 0 || user.lock > 0 || user.stun > 0 || user.charging) return false;
      user.cds[slot] = mv.cd * (user.side === 'wild' ? 1.5 : 1);
    }
    if (user.mon.status === 'par' && Math.random() < 0.15) { this.g.fx.number(user.x, user.y - 24, 'Paralisado!', '#fff27a'); user.lock = 0.5; return true; }
    let dx = ax - user.x, dy = ay - user.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    user.face(dx, dy);
    const g = this.g, color = typeHex(mv.type);
    const kind = opts.asDash ? 'dash' : mv.kind;
    const melee = kind === 'melee' || kind === 'multi' || kind === 'dash';
    const style = melee ? (kind === 'dash' ? (id === 'flameWheel' ? 'spin' : 'dash') : meleeStyle(id)) : (BEAMS[id] ? 'beam' : mv.kind);
    user.play(this.pickAnim(user, ANIM_PREF[style] ?? ['Attack']));
    user.lock = melee ? 0.3 : 0.2;
    user.faceT = 0.5;
    this.sfx('move-' + kind, mv.type);
    this.ai.noise(user.x, user.y, 50, user);
    const fire = (fn, delay) => g.later(delay, () => user.alive && !user.dead && fn());
    switch (kind) {
      case 'proj': {
        if (BEAMS[id]) { fire(() => this.#beam(user, mv, id, Math.atan2(dy, dx), opts), 0.08); user.lock = BEAMS[id].dur; break; }
        const n = mv.count ?? 1, aimT = this.#aimTarget(user, ax, ay);
        for (let i = 0; i < n; i++) {
          const spread = n > 1 ? (id === 'razorLeaf' ? (i - (n - 1) / 2) * 0.16 : id === 'bubble' ? (Math.random() - 0.5) * 0.3 : 0) : 0;
          const a = Math.atan2(dy, dx) + spread;
          fire(() => this.#projectile(user, mv, id, Math.cos(a), Math.sin(a), color, aimT, i), 0.08 + i * (id === 'razorLeaf' ? 0.05 : 0.1));
        }
        break;
      }
      case 'melee': case 'multi': {
        const hits = mv.hits ?? (mv.kind === 'multi' ? 3 : 1);
        user.kx += dx * 150; user.ky += dy * 150;   // avança no golpe
        for (let i = 0; i < hits; i++) fire(() => this.#arc(user, mv, id, dx, dy, (mv.range ?? 1.8) * M + user.r + 8, 0.9, i), 0.09 + i * 0.12);
        break;
      }
      case 'dash': {
        user.iframes = Math.max(user.iframes, 0.22); user.dashHit = new Set();
        const airborne = user.z > 10;
        fire(() => {
          const sp = this.range(mv) * (airborne ? 4.2 : 3.4);
          user.kx += dx * sp; user.ky += dy * sp; user.dashing = { mv, id, t: airborne ? 0.36 : 0.3, color, dive: airborne };
          this.sfx('whoosh');
        }, 0.06);
        break;
      }
      case 'cone': fire(() => this.#cone(user, mv, id, dx, dy), 0.08); break;
      case 'wave': fire(() => this.#wave(user, mv, id, false), 0.1); break;
      case 'quake': fire(() => this.#wave(user, mv, id, true), 0.16); break;
      case 'cloud': case 'rain': {
        const r = Math.min(d, this.range(mv)), tx = user.x + dx * r, ty = user.y + dy * r;
        fire(() => (mv.kind === 'rain' ? this.#rocks(user, mv, id, tx, ty) : this.#zone(user, mv, id, tx, ty, color)), 0.15); break;
      }
      case 'self': fire(() => this.#self(user, mv, id), 0.1); break;
      case 'fly': this.alt.flyMove(user, mv, id, ax, ay); break;
      case 'dig': this.alt.digMove(user, mv, id, ax, ay); break;
      case 'dive': this.alt.diveMove(user, mv, id, ax, ay); break;
      default: fire(() => this.#projectile(user, mv, id, dx, dy, color, null, 0), 0.1);
    }
    return true;
  }
  #aimTarget(user, ax, ay) {
    let best = null, bd = 28;
    for (const t of this.targetsOf(user)) { const d = Math.hypot(t.x - ax, t.y - ay); if (d < bd) { bd = d; best = t; } }
    return best;
  }

  // ---------- projéteis ----------
  #head(look) {
    const h = this.headPool.pop() ?? { halo: new PIXI.Sprite(), core: new PIXI.Sprite() };
    h.halo.texture = this.g.fx.T.glow; h.halo.anchor.set(0.5); h.halo.tint = look.halo; h.halo.scale.set(look.haloScale); h.halo.visible = true; h.halo.alpha = 0.85;
    h.core.texture = look.frames ? this.g.fx.A.anim[look.frames][0] : this.g.fx.T[look.tex]; h.core.anchor.set(0.5); h.core.tint = look.tint; h.core.scale.set(look.scale); h.core.visible = true; h.core.rotation = 0; h.core.alpha = 1;
    this.headsA.addChild(h.halo); (look.add ? this.headsA : this.headsN).addChild(h.core);
    return h;
  }
  #freeHead(h) { h.halo.visible = false; h.core.visible = false; h.halo.parent?.removeChild(h.halo); h.core.parent?.removeChild(h.core); this.headPool.push(h); }
  #projectile(user, mv, id, dx, dy, color, aimT, i) {
    const big = Math.max(1, (mv.power ?? 40) / 55);
    const look = this.vfx.head(mv, id);
    const m = this.mouth(user, dx, dy, mv.cat === 'phys' ? 'hand' : 'mouth');
    const h0 = m.h;
    const sp = (mv.speed ?? 15) * M;
    const p = { user, side: user.side, mv, id, x: m.x, gy: m.gy, h: h0, hT: aimT ? (aimT.y - this.centerY(aimT)) : Math.max(6, h0 * 0.8),
      vx: dx * sp, vy: dy * sp, left: this.range(mv), color, r: 4 + 2 * big, power: mv.power ?? 30, big, look, head: this.#head(look), t: 0, i,
      wob: id === 'bubble' ? Math.random() * TAU : id === 'razorLeaf' ? (i - 1) * 2.2 : 0 };
    p.y = p.gy - p.h;
    this.projectiles.push(p);
    this.vfx.muzzle(mv.type, m.x, m.y, Math.atan2(dy, dx), mv.power ?? 40);
  }
  #updateProjectile(p, dt) {
    const g = this.g;
    if (p.grind) { // empurra-empurra entre dois projéteis
      p.grind.t -= dt;
      const q = p.grind.q, mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      if (p.head) { p.head.core.x = p.head.halo.x = p.x + (Math.random() - 0.5) * 2; p.head.core.y = p.head.halo.y = p.y + (Math.random() - 0.5) * 2; }
      if (Math.random() < dt * 40) g.fx.emit(mx, my, { tex: 'spark', color: Math.random() < 0.5 ? p.color : q.color, n: 3, speed: 140, life: 0.2, stretch: 0.01, scale: 0.8 });
      if (Math.random() < dt * 12) g.fx.light(mx, my, 0xffffff, 18 + Math.random() * 10, 0.08);
      g.fx.shake = Math.max(g.fx.shake, 0.08);
      if (p.grind.t <= 0 && !p.dead) { this.#clashBoom(mx, my, p, q, true); p.dead = true; q.dead = true; }
      return;
    }
    p.t += dt;
    const st = Math.hypot(p.vx, p.vy) * dt;
    // folhas fazem curva, bolhas balançam
    if (p.id === 'razorLeaf' && p.t < 0.35) { const a = Math.atan2(p.vy, p.vx) - p.wob * dt * (0.35 - p.t) * 3; const s = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
    let ox = 0; if (p.id === 'bubble') { p.wob += dt * 9; ox = Math.sin(p.wob) * 3; }
    p.x += p.vx * dt; p.gy += p.vy * dt; p.left -= st;
    p.h += (p.hT - p.h) * Math.min(1, dt * 6);
    p.y = p.gy - p.h;
    const hd = p.head, L = p.look;
    hd.halo.x = hd.core.x = p.x + ox; hd.halo.y = hd.core.y = p.y;
    if (L.frames) hd.core.texture = g.fx.A.anim[L.frames][Math.floor(p.t * 14) % 4];
    if (L.orient) hd.core.rotation = Math.atan2(p.vy, p.vx) + (L.rotOff ?? 0);
    else if (L.spin) hd.core.rotation += L.spin * dt;
    if (L.tex === 'ring') hd.core.scale.set(L.scale * (1 + 0.3 * Math.sin(p.t * 20)));
    hd.halo.alpha = 0.7 + 0.3 * Math.sin(p.t * 30);
    this.vfx.trail(p, dt);
    if (p.left <= 0) { p.dead = true; this.vfx.impact(p.mv.type, p.x, p.y, 0, 0.5 * p.big, p.gy); this.arena.impact(p.x, p.gy, p.mv, 0.5); return; }
    // choque com projéteis do outro lado
    for (const q of this.projectiles) {
      if (q === p || q.dead || q.grind || !this.hostile(p.user, q.user)) continue;
      if (Math.hypot(q.x - p.x, q.y - p.y) < p.r + q.r + 3) { this.#clashProj(p, q); return; }
    }
    // choque com feixes
    for (const b of this.beams) {
      if (b.dead || !this.hostile(p.user, b.user) || b.len < 4) continue;
      if (segDist(p.x, p.y, b.ox, b.oy, b.hx, b.hy) < b.cfg.width / 2 + p.r) {
        const mx = p.x, my = p.y; p.dead = true;
        this.vfx.impact(p.mv.type, mx, my, 0, 0.9, my + 10); this.vfx.impact(b.mv.type, mx, my, 0, 0.7, my + 10);
        g.fx.kick(0.18, 0.04); this.sfx('clash');
        if (p.power >= (b.mv.power ?? 90) * 0.6) b.t += 0.35;
        return;
      }
    }
    for (const t of this.targetsOf(p.user)) {
      const hz = t.isTrainer ? 10 : t.y - this.centerY(t);
      if (Math.hypot(t.x - p.x, t.y - p.gy) < t.r + p.r + 1 && Math.abs(p.h - hz) < 14 + t.r + (t.alt?.mode === 'fly' ? 40 : 0)) {
        const d = Math.hypot(p.vx, p.vy) || 1;
        if (this.strike(p.user, t, p.mv, p.id, p.vx / d, p.vy / d, { src: 'proj' }) === 'miss') continue;
        p.dead = true;
        this.vfx.impact(p.mv.type, p.x, p.y, Math.atan2(p.vy, p.vx), p.big * 1.1, t.y);
        this.arena.impact(t.x, t.y, p.mv, 0.6);
        return;
      }
    }
    if (this.arena.blockAt(p.x, p.gy, p.mv)) { p.dead = true; this.vfx.impact(p.mv.type, p.x, p.y, 0, 0.8 * p.big, p.gy); this.ai.noise(p.x, p.gy, 70, p.user); }
  }
  #clashProj(p, q) {
    const g = this.g, mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const a = p.power, b = q.power, ratio = Math.min(a, b) / Math.max(a, b);
    g.fx.light(mx, my, 0xffffff, 30, 0.15); g.fx.kick(0.22, 0.05); this.sfx('clash');
    if (ratio > 0.72) { // força parecida: os dois travam e disputam no ar
      p.grind = { q, t: 0.32 }; q.grind = { q: p, t: 0.32 };
      g.fx.number(mx, my - 14, 'CHOQUE!', '#ffffff', true, 'banner');
      return;
    }
    const [win, lose] = a > b ? [p, q] : [q, p];
    lose.dead = true; win.power -= lose.power * 0.8;
    this.vfx.impact(lose.mv.type, mx, my, 0, 1, my + 10); this.vfx.impact(win.mv.type, mx, my, 0, 0.6, my + 10);
    this.ai.noise(mx, my, 110, p.user);
  }
  // explosão grande do choque de golpes
  #clashBoom(x, y, a, b, big = true) {
    const g = this.g, P = big ? 2 : 1.2;
    this.vfx.impact(a.mv.type, x, y, 0, P, y + 12); this.vfx.impact(b.mv.type, x, y, 0, P, y + 12);
    g.fx.shock(x, y + 10, 0xffffff, 60 * P / 2, 0.45);
    g.fx.ring(x, y, a.color ?? 0xffffff, 10, 0.5, { width: 3 }); g.fx.ring(x, y, b.color ?? 0xffffff, 14, 0.6, { width: 2 });
    g.fx.emit(x, y, { tex: 'smoke', n: 8, speed: 60, life: 1, scale: 1, end: 2.4, alpha: 0.5, add: false, color: 0x8a8a8a, drag: 3 });
    g.fx.emit(x, y, { tex: 'spark', color: 0xffffff, n: 30, speed: 220, life: 0.35, stretch: 0.01, drag: 4 });
    g.fx.light(x, y, 0xffffff, 70, 0.3, 1);
    g.fx.screenFlash(0xffffff, 0.35); g.fx.kick(0.5, 0.12);
    this.sfx('boom'); this.ai.noise(x, y, 180, a.user);
    this.arena.blast(x, y + 10, 26, a.mv);
    // empurra quem estiver perto
    for (const e of [...g.entities, g.player]) { const dx = e.x - x, dy = e.y - (y + 10), d = Math.hypot(dx, dy); if (d < 50 && d > 0.1 && e.alive !== false) { e.kx += dx / d * 220; e.ky += dy / d * 220; } }
  }

  // ---------- feixes contínuos ----------
  #beam(user, mv, id, ang) {
    const cfg = BEAMS[id];
    const b = { user, mv, id, cfg, ang, len: 0, t: 0, tick: 0, color: typeHex(mv.type), mash: 0, struggle: null, ox: user.x, oy: user.y, hx: user.x, hy: user.y, maxLen: cfg.range * M };
    this.beams.push(b);
    this.vfx.muzzle(mv.type, user.x, user.y - 10, ang, mv.power);
    this.g.fx.kick(0.12, 0);
  }
  #updateBeam(b, dt) {
    const g = this.g, u = b.user;
    if (!u.alive || u.dead || (u.stun > 0 && !b.struggle)) { this.#endBeam(b); return; }
    // mira acompanha devagar (o jogador pela mira, o selvagem pelo alvo)
    if (!b.struggle) {
      let want = b.ang;
      if (u.side === 'ally') { const a = this.pilot.aimPoint(u); want = Math.atan2(a.y - u.y, a.x - u.x); }
      else if (u.aggroTarget && u.aggroTarget.alive !== false) want = Math.atan2(u.aggroTarget.y - u.y, u.aggroTarget.x - u.x);
      b.ang += clamp(angDiff(want, b.ang), -1.5 * dt, 1.5 * dt);
      b.t += dt;
    }
    const ca = Math.cos(b.ang), sa = Math.sin(b.ang);
    u.face(ca, sa); u.lock = Math.max(u.lock, 0.08); u.vx = u.vy = 0;
    if (u.anim !== 'Shoot' && u.set?.anims?.Shoot) u.play('Shoot');
    if (u.animT > 0.25) u.animT = 0.18; // segura a pose
    const m = this.mouth(u, ca, sa); b.ox = m.x; b.oy = m.y;
    const groundOff = u.y - m.y;
    // comprimento: cresce até o alcance ou até bater em algo sólido
    let L = Math.min(b.maxLen, b.len + b.cfg.speed * dt); b.blocked = false;
    for (let s = 8; s < L; s += 6) { if (this.arena.solidAt(b.ox + ca * s, b.oy + sa * s + groundOff)) { L = s; b.blocked = true; break; } }
    if (b.struggle) L = Math.hypot(b.struggle.mx - b.ox, b.struggle.my - b.oy);
    b.len = L; b.hx = b.ox + ca * L; b.hy = b.oy + sa * L;
    // dano em tiques ao longo do jato
    b.tick -= dt;
    if (b.tick <= 0 && !b.struggle) {
      b.tick = b.cfg.tick;
      for (const t of this.targetsOf(u)) {
        const cy = t.isTrainer ? t.y - 10 : this.centerY(t);
        if (segDist(t.x, cy, b.ox, b.oy, b.hx, b.hy) < b.cfg.width / 2 + t.r + 2) {
          this.strike(u, t, b.mv, b.id, ca, sa, { src: 'beam', scale: b.cfg.share * b.cfg.tick / b.cfg.dur, knock: 0.35 * (b.cfg.knock ?? 1), quiet: true });
        }
      }
      if (b.mv.type === 'fire') this.arena.burnLine(b.ox, b.oy + groundOff, b.hx, b.hy + groundOff);
      if (b.blocked) this.arena.impact(b.hx, b.hy + groundOff, b.mv, 0.5);
      if (b.mv.type === 'water') this.arena.soak(b.hx, b.hy + groundOff);
      g.fx.shake = Math.max(g.fx.shake, 0.06);
      this.ai.noise(b.hx, b.hy, 80, u);
    }
    this.#beamFx(b, dt, ca, sa);
    if (!b.struggle && b.t >= b.cfg.dur) this.#endBeam(b);
  }
  #beamFx(b, dt, ca, sa) {
    const g = this.g, G = this.gfx, t = b.mv.type, w = b.cfg.width, now = g.time;
    const wob = Math.sin(now * 40) * 0.6;
    const outer = t === 'fire' ? 0xff4a10 : t === 'water' ? 0x2a7aff : b.color, mid = t === 'fire' ? 0xff9a2a : t === 'water' ? 0x7ac8ff : b.color, core = t === 'fire' ? 0xfff0a0 : 0xffffff;
    G.moveTo(b.ox, b.oy).lineTo(b.hx, b.hy).stroke({ width: w * 1.9 + wob, color: outer, alpha: 0.28, cap: 'round' });
    G.moveTo(b.ox, b.oy).lineTo(b.hx, b.hy).stroke({ width: w + wob, color: mid, alpha: 0.65, cap: 'round' });
    G.moveTo(b.ox, b.oy).lineTo(b.hx, b.hy).stroke({ width: w * 0.35, color: core, alpha: 0.95, cap: 'round' });
    G.circle(b.hx, b.hy, w * 0.9 + Math.random() * 2).fill({ color: mid, alpha: 0.5 });
    const R = (rate) => Math.floor(dt * rate + Math.random());
    const along = () => Math.random() * b.len;
    if (t === 'fire') {
      for (let i = R(150); i > 0; i--) { const s = along(); g.fx.emit(b.ox + ca * s, b.oy + sa * s, { frames: 'flame', n: 1, speed: 40 + s * 0.6, dir: b.ang, spread: 0.5, life: 0.22, scale: 0.8 + s / b.maxLen, end: 0.4, add: true, jitter: w * 0.4, vz: 20 }); }
      g.fx.emit(b.hx, b.hy, { frames: 'flame', n: R(60), speed: 50, life: 0.35, scale: 1.3, end: 0.3, add: true, vz: 40 });
      g.fx.emit(b.hx, b.hy, { tex: 'ember', n: R(40), speed: 80, life: 0.6, vz: 50, grav: 60 });
      g.fx.emit(b.hx, b.hy, { tex: 'smoke', n: R(8), speed: 15, life: 0.9, scale: 0.8, end: 2, vz: 20, alpha: 0.3, add: false, color: 0x555555 });
    } else if (t === 'water') {
      for (let i = R(90); i > 0; i--) { const s = along(); g.fx.emit(b.ox + ca * s, b.oy + sa * s, { tex: Math.random() < 0.5 ? 'foam' : 'drop', n: 1, speed: 60, dir: b.ang, spread: 0.6, life: 0.25, add: false, jitter: w * 0.4, rot: 'rand' }); }
      g.fx.emit(b.hx, b.hy, { tex: 'drop', n: R(80), speed: 90, life: 0.55, vz: 90, grav: 420, add: false });
      g.fx.emit(b.hx, b.hy, { tex: 'foam', n: R(30), speed: 50, life: 0.3, add: false });
      if (Math.random() < dt * 10) g.fx.ring(b.hx, b.hy + 8, 0xbfe6ff, 5, 0.3, { width: 1.5 });
    } else {
      for (let i = R(80); i > 0; i--) { const s = along(); g.fx.emit(b.ox + ca * s, b.oy + sa * s, { tex: 'glow', color: b.color, n: 1, size: 3, speed: 30, life: 0.2 }); }
    }
    g.fx.light(b.ox, b.oy, mid, 16, 0.05, 0.6);
    if (Math.random() < dt * 20) g.fx.light(b.hx, b.hy, mid, 26, 0.08, 0.7);
    this.sfx('beam-' + t, null, 0.09);
  }
  #endBeam(b) {
    b.dead = true;
    if (b.struggle) b.struggle.done = true;
    this.g.fx.emit(b.hx, b.hy, { tex: 'glow', color: b.color, n: 8, speed: 40, size: 4, life: 0.3 });
  }
  // dois feixes inimigos se encontram: disputa de força no ar
  #checkBeamClash() {
    const B = this.beams;
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i], b = B[j];
      if (a.dead || b.dead || a.struggle || b.struggle || !this.hostile(a.user, b.user)) continue;
      const close = Math.hypot(a.hx - b.hx, a.hy - b.hy) < (a.cfg.width + b.cfg.width) / 2 + 6
        || segDist(a.hx, a.hy, b.ox, b.oy, b.hx, b.hy) < b.cfg.width / 2 + 2 || segDist(b.hx, b.hy, a.ox, a.oy, a.hx, a.hy) < a.cfg.width / 2 + 2;
      if (!close) continue;
      const d = Math.hypot(b.ox - a.ox, b.oy - a.oy) || 1;
      const s = { a, b, k: clamp(Math.hypot(a.hx - a.ox, a.hy - a.oy) / d, 0.2, 0.8), t: 0, max: 3.2, ring: 0, mx: (a.hx + b.hx) / 2, my: (a.hy + b.hy) / 2 };
      a.struggle = b.struggle = s; this.struggles.push(s);
      this.g.fx.number(s.mx, s.my - 22, a.user.side === 'ally' || b.user.side === 'ally' ? 'Aperte o golpe!' : 'Disputa!', '#ffe27a', true, 'banner');
      this.g.fx.kick(0.3, 0.1); this.sfx('clash');
    }
  }
  #updateStruggle(s, dt) {
    const g = this.g, { a, b } = s;
    if (s.done || a.dead || b.dead) { this.#endStruggle(s, a.dead && !b.dead ? null : null); return; }
    s.t += dt;
    const force = (bm) => (bm.mv.power ?? 80) * bm.user.stat(bm.mv.cat === 'phys' ? 'atk' : 'spa') / 40 * (1 + bm.mash) * (0.85 + Math.random() * 0.3) * (0.5 + 0.5 * bm.user.mon.hp / bm.user.mon.stats.hp);
    // o selvagem também "aperta"
    for (const bm of [a, b]) { if (bm.user.side === 'wild' && Math.random() < dt * 3.5) bm.mash = Math.min(1.6, bm.mash + 0.3); bm.mash *= 1 - Math.min(1, dt * 1.6); }
    const fa = force(a), fb = force(b);
    s.k = clamp(s.k + (fa - fb) / (fa + fb) * 0.55 * dt, 0, 1);
    // apontam um para o outro
    a.ang = Math.atan2(b.oy - a.oy, b.ox - a.ox); b.ang = Math.atan2(a.oy - b.oy, a.ox - b.ox);
    s.mx = a.ox + (b.ox - a.ox) * s.k; s.my = a.oy + (b.oy - a.oy) * s.k;
    // efeitos no ponto de encontro
    const steam = (a.mv.type === 'fire' && b.mv.type === 'water') || (a.mv.type === 'water' && b.mv.type === 'fire');
    const R = (rate) => Math.floor(dt * rate + Math.random());
    g.fx.emit(s.mx, s.my, { tex: 'spark', color: a.color, n: R(70), speed: 170, life: 0.25, stretch: 0.01, drag: 3 });
    g.fx.emit(s.mx, s.my, { tex: 'spark', color: b.color, n: R(70), speed: 170, life: 0.25, stretch: 0.01, drag: 3 });
    g.fx.emit(s.mx, s.my, { tex: 'spark', color: 0xffffff, n: R(40), speed: 220, life: 0.18, stretch: 0.012, drag: 2 });
    if (steam) g.fx.emit(s.mx, s.my, { tex: 'smoke', n: R(26), speed: 40, life: 1.1, scale: 0.9, end: 2.6, vz: 30, alpha: 0.6, add: false, color: 0xeeeeee });
    if ((s.ring -= dt) <= 0) { s.ring = 0.12; g.fx.ring(s.mx, s.my, 0xffffff, 8 + Math.random() * 6, 0.25, { width: 2, squash: 1 }); g.fx.light(s.mx, s.my, 0xffffff, 34 + Math.random() * 16, 0.12, 0.9); this.sfx('struggle', null, 0.1); }
    g.fx.shake = Math.max(g.fx.shake, 0.14);
    a.user.lock = b.user.lock = 0.15;
    if (s.k >= 0.94) this.#endStruggle(s, a); else if (s.k <= 0.06) this.#endStruggle(s, b); else if (s.t >= s.max) this.#endStruggle(s, 'draw');
  }
  #endStruggle(s, win) {
    if (s.over) return; s.over = true;
    const g = this.g, { a, b } = s;
    this.struggles.splice(this.struggles.indexOf(s), 1);
    a.struggle = b.struggle = null;
    if (win === a || win === b) {
      const lose = win === a ? b : a, u = lose.user;
      if (u.alive) {
        const dx = u.x - win.user.x, dy = u.y - win.user.y, d = Math.hypot(dx, dy) || 1;
        this.strike(win.user, u, win.mv, win.id, dx / d, dy / d, { src: 'beam', scale: 1.5, knock: 2.2, force: true });
        this.#clashBoom(u.x, this.centerY(u), win, lose, true);
      }
      lose.dead = true; win.t = Math.max(win.t, win.cfg.dur - 0.3);
      g.fx.number(win.user.x, win.user.y - 40, win.user.side === 'ally' ? 'Venceu a disputa!' : 'Perdeu a disputa!', win.user.side === 'ally' ? '#7dff8a' : '#ff7a6a', true, 'banner');
    } else if (win === 'draw') {
      this.#clashBoom(s.mx, s.my, a, b, true);
      for (const bm of [a, b]) { bm.dead = true; const u = bm.user, dx = u.x - s.mx, dy = u.y - s.my, d = Math.hypot(dx, dy) || 1; u.kx += dx / d * 260; u.ky += dy / d * 260; }
    }
  }

  // ---------- corpo a corpo ----------
  #arc(user, mv, id, dx, dy, reach, spread, i) {
    const g = this.g, style = meleeStyle(id);
    // dois golpes corpo a corpo ao mesmo tempo, frente a frente: choque
    const now = g.time;
    this.swings = this.swings.filter((s) => now - s.t < 0.16);
    for (const s of this.swings) {
      if (!this.hostile(user, s.user) || !s.user.alive) continue;
      const d = Math.hypot(s.user.x - user.x, s.user.y - user.y);
      if (d < reach + s.reach && (dx * s.dx + dy * s.dy) < -0.3) { this.#meleeClash(user, s.user); this.swings.splice(this.swings.indexOf(s), 1); return; }
    }
    this.swings.push({ user, mv, t: now, dx, dy, reach });
    this.vfx.melee(user, mv, id, dx, dy, reach, i);
    let any = false;
    for (const t of this.targetsOf(user)) {
      const ex = t.x - user.x, ey = t.y - user.y, d = Math.hypot(ex, ey);
      if (d > reach + t.r) continue;
      if (Math.acos(clamp((ex * dx + ey * dy) / (d || 1), -1, 1)) > spread + 0.2 && d > t.r + 4) continue;
      if (this.strike(user, t, mv, id, dx, dy, { src: 'melee' }) === 'miss') continue;
      any = true;
      const P = Math.min(2.2, 0.6 + (mv.power ?? 40) / 60);
      this.vfx.meleeHit(style, mv.type, (t.x + user.x * 0.3) / 1.3, this.centerY(t), Math.atan2(dy, dx), P);
    }
    if (!any) this.arena.impact(user.x + dx * reach * 0.8, user.y + dy * reach * 0.8, mv, 0.7, true);
  }
  #meleeClash(a, b) {
    const g = this.g, x = (a.x + b.x) / 2, y = (this.centerY(a) + this.centerY(b)) / 2;
    g.fx.emit(x, y, { tex: 'spark', color: 0xffffff, n: 20, speed: 200, life: 0.25, stretch: 0.012, drag: 4 });
    g.fx.emit(x, y, { tex: 'impact', color: 0xffe27a, n: 1, speed: 0, scale: 1.6, end: 2.6, life: 0.14 });
    g.fx.shock(x, y + 8, 0xffffff, 30, 0.3); g.fx.light(x, y, 0xffffff, 40, 0.15);
    g.fx.kick(0.3, 0.1); this.sfx('clash');
    g.fx.number(x, y - 16, 'CHOQUE!', '#ffffff', true, 'banner');
    for (const [e, o] of [[a, b], [b, a]]) { const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 1; e.kx += dx / d * 240; e.ky += dy / d * 240; e.lock = Math.max(e.lock, 0.25); e.play('Hurt'); }
    this.ai.noise(x, y, 120, a);
  }

  #cone(user, mv, id, dx, dy) {
    const g = this.g, R = this.range(mv), a0 = Math.atan2(dy, dx);
    this.vfx.cone(user, mv, id, dx, dy, R);
    for (const t of this.targetsOf(user)) {
      const ex = t.x - user.x, ey = t.y - user.y, d = Math.hypot(ex, ey);
      if (d > R + t.r) continue;
      if (Math.abs(angDiff(Math.atan2(ey, ex), a0)) > 0.6) continue;
      g.later(d / (R * 2.4), () => this.strike(user, t, mv, id, dx, dy, { src: 'cone' }));
    }
    for (let k = 1; k <= 4; k++) { const x = user.x + dx * R * k / 4, y = user.y + dy * R * k / 4; if (mv.type === 'fire' || id === 'dragonBreath') g.scorchTile(x, y); else if (mv.type === 'flying' || mv.type === 'dragon') this.arena.wind(x, y); }
  }

  #wave(user, mv, id, ground) {
    const R = this.range(mv);
    if (ground) { this.vfx.quake(user, mv, R); this.g.fx.kick(0.5, 0.07); this.sfx('quake'); this.arena.blast(user.x, user.y, R * 0.45, mv); this.ai.noise(user.x, user.y, 220, user); }
    else this.vfx.wave(user, mv, id, R);
    this.waves.push({ user, mv, id, x: user.x, y: user.y, R, t: 0, dur: ground ? 0.42 : 0.3, hit: new Set(), ground });
  }
  #updateWave(w, dt) {
    w.t += dt; const r = w.R * Math.min(1, w.t / w.dur);
    if (w.ground && Math.random() < dt * 40) { const a = Math.random() * TAU; this.g.fx.emit(w.x + Math.cos(a) * r, w.y + Math.sin(a) * r, { tex: 'dust', n: 1, speed: 20, life: 0.5, scale: 0.7, end: 1.6, add: false, alpha: 0.7, vz: 20 }); }
    for (const t of this.targetsOf(w.user)) {
      if (w.hit.has(t)) continue;
      const d = Math.hypot(t.x - w.x, t.y - w.y);
      if (d <= r + t.r) { w.hit.add(t); this.strike(w.user, t, w.mv, w.id, (t.x - w.x) / (d || 1), (t.y - w.y) / (d || 1), { src: w.ground ? 'quake' : 'wave' }); }
    }
    if (w.ground && Math.random() < dt * 20) { const an = Math.random() * TAU; this.arena.shakeAt(w.x + Math.cos(an) * r, w.y + Math.sin(an) * r, w.mv); }
    return w.t < w.dur;
  }

  #zone(user, mv, id, x, y, color) {
    this.zones.push({ user, mv, id, x, y, r: 26, t: 3, tick: 0.15, color });
    this.g.fx.emit(x, y, { tex: 'smoke', color: 0xffffff, n: 8, speed: 50, life: 0.5, scale: 0.8, end: 1.6, add: false, alpha: 0.5 });
  }
  // pedras que caem do céu sobre a área (Lançamento de Rocha, Tumba de Rochas)
  #rocks(user, mv, id, x, y) {
    const n = id === 'rockTomb' ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const a = id === 'rockTomb' ? i / n * TAU : Math.random() * TAU, r = id === 'rockTomb' ? 14 : (i === 0 ? 0 : 10 + Math.random() * 8);
      const bigOne = i === 0 && id !== 'rockTomb';
      const look = { tex: bigOne ? 'boulder' : 'rock2', frames: null, scale: bigOne ? 1.2 : 1.6, halo: 0x000000, haloScale: 0.01, add: false, tint: 0xffffff };
      this.falls.push({ user, mv, id, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.7, z: 170 + i * 30, vz: -80, head: this.#head(look), big: bigOne ? 1.3 : 0.9, spin: (Math.random() - 0.5) * 6 });
    }
  }
  #updateFall(f, dt) {
    f.vz -= 900 * dt; f.z += f.vz * dt;
    f.head.core.x = f.x; f.head.core.y = f.y - f.z; f.head.core.rotation += f.spin * dt;
    if (f.z > 0) return true;
    const g = this.g;
    this.#freeHead(f.head);
    this.vfx.impact('rock', f.x, f.y - 4, 0, 1.4 * f.big, f.y);
    g.fx.decal('crater', f.x, f.y + 2, { scale: 0.5 + 0.4 * f.big, life: 25 });
    g.fx.kick(0.25 * f.big, 0.03); this.sfx('thud');
    this.arena.blast(f.x, f.y, 12 * f.big, f.mv);
    this.ai.noise(f.x, f.y, 120, f.user);
    for (const t of this.targetsOf(f.user)) { const d = Math.hypot(t.x - f.x, t.y - f.y); if (d < 14 * f.big + t.r) this.strike(f.user, t, f.mv, f.id, (t.x - f.x) / (d || 1), (t.y - f.y) / (d || 1), { src: 'rain', scale: f.big > 1 ? 1 : 0.55 }); }
    return false;
  }

  #self(user, mv, id) {
    const g = this.g, e = mv.eff ?? {};
    this.vfx.aura(user, mv, id, (e.by ?? 1) > 0);
    if (e.stat) { user.stages[e.stat] = clamp((user.stages[e.stat] ?? 0) + (e.by ?? 1), -6, 6); g.fx.number(user.x, user.y - 30, e.by > 0 ? 'Subiu!' : 'Caiu!', '#9ad0ff'); }
    if (e.crit) { user.critBoost = 20; g.fx.number(user.x, user.y - 30, 'Focado!', '#ffb347'); }
    if (e.splash) g.fx.number(user.x, user.y - 30, 'Nada aconteceu...', '#cccccc');
    if (id === 'doubleTeam') for (let i = 0; i < 6; i++) g.later(i * 0.04, () => { const s = (i % 2 ? 1 : -1) * (6 + i * 2); const ox = user.view.x; user.view.x += s; this.vfx.afterimage(user, 0xffffff, 0.6, 0.5); user.view.x = ox; });
    if (e.teleport) {
      this.vfx.impact('psychic', user.x, this.centerY(user), 0, 1, user.y);
      const a = Math.random() * TAU; user.x += Math.cos(a) * 90; user.y += Math.sin(a) * 90; g.map.resolve(user, user.r);
      this.vfx.impact('psychic', user.x, this.centerY(user), 0, 1, user.y); this.sfx('teleport');
    }
  }

  // ---------- acerto: esquiva, altura, precisão e dano ----------
  // devolve 'miss' se não acertou
  strike(user, t, mv, id, dx = 0, dy = 0, info = {}) {
    if (!t || t.alive === false || (t.mon && t.mon.hp <= 0)) return 'miss';
    const g = this.g;
    if (!info.force) {
      if (this.alt.dodges(t, mv, info, user)) { this.#missText(t, 'Errou!'); return 'miss'; }
      if (t.iframes > 0) { if (t.side === 'ally' || t.isTrainer) this.#missText(t, 'Esquivou!'); return 'miss'; }
    }
    if (t.isTrainer) { t.knock(dx * 220, dy * 220); g.fx.kick(0.2, 0.04); this.vfx.impact(mv.type, t.x, t.y - 10, 0, 0.6, t.y); return 'hit'; }
    // precisão (estágios de precisão do atacante e evasão do alvo)
    const st = (user.stages.acc ?? 0) - (t.stages.eva ?? 0), accM = st >= 0 ? (3 + st) / 3 : 3 / (3 - st);
    if (info.src !== 'beam' && Math.random() > (mv.cat === 'status' ? (mv.acc ?? 1) : 1) * Math.min(1, accM)) { this.#missText(t, 'Errou!'); return 'miss'; }
    if (mv.cat === 'status') { this.#status(user, t, mv); return 'hit'; }
    const r = computeDamage(user, t, mv, { g, scale: info.scale ?? 1, noCrit: info.src === 'beam' && !info.force });
    this.hurt(t, r.dmg, user, { eff: r.eff, crit: r.crit, mv, dx, dy, knock: info.knock ?? 1, quiet: info.quiet, note: r.note, src: info.src });
    if (user.side === 'wild' && t.side === 'wild') t.aggroTarget = user; // revida o rival
    const e = mv.eff ?? {};
    if (!info.quiet || Math.random() < 0.15) {
      if (e.status && !t.mon.status && Math.random() < (e.chance ?? 0.1)) this.#applyStatus(t, e.status);
      if (e.flinch && Math.random() < e.flinch) t.stun = Math.max(t.stun, 0.35);
      if (e.stat && !e.self && Math.random() < (e.chance ?? 1)) { t.stages[e.stat] = clamp((t.stages[e.stat] ?? 0) + (e.by ?? -1), -6, 6); g.fx.number(t.x, t.y - 30, 'Caiu!', '#9ad0ff'); }
      if (e.stat && e.self && Math.random() < (e.chance ?? 1)) { user.stages[e.stat] = clamp((user.stages[e.stat] ?? 0) + (e.by ?? 1), -6, 6); }
      if (e.confuse && Math.random() < e.confuse) t.confused = 3;
      if (e.bind) { t.stun = Math.max(t.stun, e.bind * 0.5); g.fx.ring(t.x, t.y - 6, typeHex(mv.type), 5, 0.6, { squash: 0.5, width: 2 }); }
    }
    if (e.drain) { const hp = Math.max(1, Math.round(r.dmg * e.drain)); user.mon.hp = Math.min(user.mon.stats.hp, user.mon.hp + hp); g.fx.number(user.x, user.y - 28, '+' + hp, '#7dff8a'); g.fx.emit(t.x, this.centerY(t), { tex: 'glow', color: 0x7dff8a, n: 6, size: 3, speed: 60, dir: Math.atan2(user.y - t.y, user.x - t.x), spread: 0.5, life: 0.4, drag: 0 }); }
    if (e.recoil) this.hurt(user, Math.max(1, Math.round(r.dmg * e.recoil)), null, { silent: true });
    return 'hit';
  }
  hit(user, t, mv, id, dx = 0, dy = 0) { return this.strike(user, t, mv, id, dx, dy, {}); }
  #missText(t, s) { if ((t.missT ?? 0) > this.g.time) return; t.missT = this.g.time + 0.35; this.g.fx.number(t.x, t.y - (t.set?.top ?? 16) * (t.scale ?? 1) - (t.z ?? 0) - 10, s, '#d8f0ff'); }

  // dano + reação: recuo proporcional, clarão branco, giro no ar, números e letreiros
  hurt(t, dmg, by, { eff = 1, crit = false, mv = null, dx = 0, dy = 0, silent = false, knock = 1, quiet = false, note = null } = {}) {
    const g = this.g;
    t.mon.hp = Math.max(0, t.mon.hp - dmg);
    t.hpShow = 3;
    const ty = t.y - (t.set?.top ?? 16) * (t.scale ?? 1) - t.z - 10;
    if (!silent) {
      const pw = mv?.power ?? 40;
      const power = Math.min(2.4, 0.55 + pw / 70) * (eff > 1 ? 1.3 : 1) * (crit ? 1.25 : 1);
      const mass = clamp(9 / (t.r + 3), 0.55, 1.4);
      const K = 150 * power * mass * knock;
      t.kx += dx * K; t.ky += dy * K;
      t.react?.({ power: power * knock, eff, crit, quiet, dx, dy });
      if (!quiet) {
        t.lock = Math.max(t.lock, 0.12 + 0.1 * power);
        g.fx.kick(eff > 1 || crit ? 0.34 : 0.12 + 0.05 * power, eff > 1 || crit ? 0.09 : 0.03 + 0.012 * power);
        this.sfx(eff > 1 ? 'hit-super' : eff < 1 ? 'hit-weak' : pw >= 70 ? 'hit-heavy' : 'hit', null, 0.03);
      } else if (Math.random() < 0.3) this.sfx('hit-weak', null, 0.08);
      g.fx.number(t.x + (Math.random() - 0.5) * 6, ty, String(dmg), eff > 1 ? 0xffb347 : eff < 1 ? 0xb8b8b8 : crit ? 0xff6a4a : 0xffffff, eff > 1 || crit || pw >= 80);
      if (eff > 1 && (t.superT ?? 0) < g.time) {
        t.superT = g.time + 0.6;
        g.fx.number(t.x, ty - 16, 'Super efetivo!', 0xffd84a, true, 'banner');
        g.fx.emit(t.x, ty - 16, { tex: 'star', color: 0xffe27a, n: 10, speed: 90, life: 0.5, spin: 6 });
        g.fx.screenFlash(0xffe8a0, 0.22);
        g.fx.light(t.x, this.centerY(t), 0xffd84a, 50, 0.25);
      } else if (eff > 0 && eff < 1 && !quiet) g.fx.number(t.x, ty - 14, 'Pouco efetivo', 0xbbbbbb);
      else if (eff === 0) g.fx.number(t.x, ty - 14, 'Não afeta...', 0xbbbbbb);
      if (crit) { g.fx.number(t.x, ty - 28, 'Crítico!', 0xff7a5a, true, 'banner'); g.fx.screenFlash(0xffffff, 0.15); }
      if (note && (t.noteT ?? 0) < g.time) { t.noteT = g.time + 1.5; g.fx.number(t.x, ty - 40, { água: 'Força da água!', mato: 'Força do mato!', molhado: 'Molhado: choque forte!', apagou: 'A água apagou o fogo' }[note] ?? note, 0x9ad0ff); }
      this.ai.noise(t.x, t.y, 60 + pw, by);
    } else t.flash = 0.08;
    if (by && t.side === 'wild') t.provoke(by.side === 'ally' || by.side === 'wild' ? by : t.aggroTarget);
    if (t.mon.hp <= 0 && !t.dead) this.#faint(t, by, mv);
  }
  #faint(t, by, mv) {
    const g = this.g, cy = this.centerY(t);
    g.fx.kick(0.4, 0.16);
    g.fx.screenFlash(0xffffff, 0.25);
    g.fx.light(t.x, cy, 0xffffff, 60, 0.35);
    g.fx.shock(t.x, t.y, mv ? typeHex(mv.type) : 0xffffff, 34, 0.5);
    g.fx.emit(t.x, cy, { tex: 'spark', color: 0xffffff, n: 18, speed: 160, life: 0.35, stretch: 0.01 });
    this.sfx('faint', null, 0.1);
    this.ai.noise(t.x, t.y, 160, by);
    t.faintT = 0; t.faintDir = (Math.random() < 0.5 ? -1 : 1);
    t.charging = null; t.dashing = null;
    if (t.alt?.mode) this.alt.cancel(t);
    g.onFaint(t, by);
  }

  #status(user, t, mv) {
    const e = mv.eff ?? {};
    if (e.status && !t.mon.status && Math.random() < (e.chance ?? 1)) this.#applyStatus(t, e.status);
    if (e.stat && !e.self) { t.stages[e.stat] = Math.max(-6, (t.stages[e.stat] ?? 0) + (e.by ?? -1)); this.g.fx.number(t.x, t.y - 30, 'Caiu!', '#9ad0ff'); this.vfx.aura(t, mv, null, false); }
    if (e.confuse) { t.confused = 4; this.g.fx.number(t.x, t.y - 34, 'Confuso!', '#ff9adf'); }
    if (e.seed) { t.seeded = { by: user, t: 8, tick: 1 }; this.g.fx.number(t.x, t.y - 34, 'Semeado!', '#7dff8a'); }
    if (e.knock) { const d = Math.hypot(t.x - user.x, t.y - user.y) || 1; t.kx += (t.x - user.x) / d * e.knock * 34; t.ky += (t.y - user.y) / d * e.knock * 34; t.react?.({ power: 1.4, eff: 1, quiet: true, dx: (t.x - user.x) / d, dy: (t.y - user.y) / d }); }
    if (t.side === 'wild') t.provoke(user);
  }
  #applyStatus(t, st) {
    t.mon.status = st;
    const name = { brn: 'Queimado!', psn: 'Envenenado!', par: 'Paralisado!', slp: 'Dormiu!' }[st] ?? st;
    this.g.fx.number(t.x, t.y - 34, name, '#ff9adf');
    this.sfx('status');
    if (st === 'slp') { t.stun = 2.5; t.mon.status = null; t.sleepFx = 2.5; }
  }

  // jogador esquivou (gancho chamado pelo controle)
  onDodge(who) {
    const g = this.g;
    if (!who) return;
    who.dodgeT = 0.32;
    this.sfx('dodge');
    // esquiva perfeita: algo perigoso estava para acertar
    let perfect = false;
    for (const p of this.projectiles) if (!p.dead && this.hostile(p.user, who) && Math.hypot(p.x - who.x, p.gy - who.y) < 46) perfect = true;
    for (const e of g.entities) if (e.charging && this.hostile(e, who) && e.charging.t > e.charging.W - 0.3 && Math.hypot(e.x - who.x, e.y - who.y) < 120) perfect = true;
    if (perfect && (this.perfectT ?? 0) < g.time) {
      this.perfectT = g.time + 1;
      g.fx.number(who.x, who.y - 40, 'Esquiva perfeita!', 0x9ad0ff, true, 'banner');
      g.fx.hitStop = Math.max(g.fx.hitStop, 0.12); g.fx.screenFlash(0x9ad0ff, 0.15);
      this.sfx('perfect');
    }
  }

  // ---------- quadro ----------
  update(dt) {
    const g = this.g;
    this.pilot.hud(dt);
    this.alt.update(dt);
    this.ai.update(dt);
    this.vfx.update(dt);
    const G = this.groundG; G.clear();
    this.gfx.clear();
    this.pilot.drawWorld(G);
    for (const e of g.entities) {
      if (e.charging) { this.#updateCharging(e, dt); if (e.charging) this.#drawTelegraph(G, e); }
      if (e.critBoost > 0) e.critBoost -= dt;
      if (e.seeded && e.alive) {
        const s = e.seeded; s.t -= dt; s.tick -= dt;
        if (s.tick <= 0) { s.tick = 1; const hp = Math.max(1, Math.round(e.mon.stats.hp / 16)); this.hurt(e, hp, null, { silent: true }); if (s.by?.alive) s.by.mon.hp = Math.min(s.by.mon.stats.hp, s.by.mon.hp + hp); g.fx.emit(e.x, this.centerY(e), { tex: 'leaf2', n: 3, speed: 20, life: 0.6, vz: 30, add: false }); }
        if (s.t <= 0) e.seeded = null;
      }
    }
    // investidas acertam o primeiro no caminho
    for (const u of g.entities) if (u.dashing) {
      const dsh = u.dashing; dsh.t -= dt;
      this.vfx.dash(u, dsh.mv, dsh.id, dt);
      if (dsh.dive) u.vz = Math.min(u.vz, -260);
      for (const t of this.targetsOf(u)) if (!u.dashHit.has(t) && Math.hypot(t.x - u.x, t.y - u.y) < t.r + u.r + 4) {
        // duas investidas se cruzando: choque
        if (t.dashing && this.hostile(t, u)) { u.dashHit.add(t); t.dashHit?.add(u); this.#meleeClash(u, t); u.dashing = t.dashing = null; break; }
        u.dashHit.add(t); const d = Math.hypot(u.kx, u.ky) || 1;
        if (this.strike(u, t, dsh.mv, dsh.id, u.kx / d, u.ky / d, { src: 'dash', knock: dsh.dive ? 1.4 : 1 }) !== 'miss') {
          this.vfx.impact(dsh.mv.type, (t.x + u.x) / 2, this.centerY(t), Math.atan2(u.ky, u.kx), 1.2 + (dsh.dive ? 0.6 : 0), t.y);
          if (dsh.dive) { g.fx.shock(t.x, t.y, 0xffffff, 30, 0.3); this.arena.blast(t.x, t.y, 12, dsh.mv); }
          u.kx *= 0.25; u.ky *= 0.25;
        }
      }
      if (!u.dashing) continue;
      if (dsh.t <= 0) { u.dashing = null; if (dsh.dive) g.fx.emit(u.x, u.y, { tex: 'dust', n: 8, speed: 50, life: 0.5, scale: 0.7, end: 1.6, add: false, alpha: 0.7 }); }
      if (dsh.mv?.type === 'fire') g.scorchTile(u.x, u.y);
      else this.arena.trample(u.x, u.y, dsh.mv);
    }
    for (const p of this.projectiles) if (!p.dead) this.#updateProjectile(p, dt);
    for (const p of this.projectiles) if (p.dead && p.head) { this.#freeHead(p.head); p.head = null; }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    this.#checkBeamClash();
    for (const s of this.struggles.slice()) this.#updateStruggle(s, dt);
    for (const b of this.beams) if (!b.dead) this.#updateBeam(b, dt);
    this.beams = this.beams.filter((b) => !b.dead);
    this.waves = this.waves.filter((w) => this.#updateWave(w, dt));
    this.falls = this.falls.filter((f) => this.#updateFall(f, dt));
    // sombra das pedras caindo (aviso no chão)
    for (const f of this.falls) { const k = clamp(1 - f.z / 220, 0.1, 1); G.ellipse(f.x, f.y, 10 * f.big * k + 2, 5 * f.big * k + 1).fill({ color: 0x000000, alpha: 0.25 + 0.25 * k }); }
    // áreas que ficam (nuvem venenosa, pó do sono)
    for (const z of this.zones) {
      z.t -= dt; z.tick -= dt;
      this.vfx.cloud(z, dt);
      if (z.tick <= 0) {
        z.tick = 0.6;
        for (const t of this.targetsOf(z.user)) if (Math.hypot(t.x - z.x, t.y - z.y) < z.r + t.r) {
          if (z.mv.cat === 'status') { if (!t.mon?.status || z.mv.eff?.stat) this.strike(z.user, t, z.mv, z.id, 0, 0, { src: 'zone', quiet: true }); }
          else this.strike(z.user, t, z.mv, z.id, 0, 0, { src: 'zone', scale: 0.45, quiet: true });
        }
      }
    }
    this.zones = this.zones.filter((z) => z.t > 0);
    this.arena.update(dt);
  }

  // Poké Bola: chance pela vida restante, estado e se o alvo estava distraído
  catchChance(e) {
    const m = e.mon, max = m.stats.hp;
    const rate = m.sp.catchRate ?? 45;
    let a = ((3 * max - 2 * m.hp) * rate) / (3 * max);
    if (m.status || e.stun > 0 || e.ai.state === 'sleep') a *= 2;
    if (e.ai.state !== 'aggro' && e.ai.state !== 'flee') a *= 1.6; // não percebeu você
    if (e.isAlpha) a *= 0.5;
    return Math.min(1, a / 255);
  }
}
