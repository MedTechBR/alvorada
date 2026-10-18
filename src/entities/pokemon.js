import * as PIXI from 'pixi.js';
import { frameOf, dir8, loadPokemonSprites } from '../sprites/pmd.js';
import { TEMPER } from '../data/species.js';

// Um Pokémon no mapa (do jogador ou selvagem). Não existe "modo batalha": ele sempre pode
// atacar e ser atacado; os selvagens reagem conforme o temperamento.
export class PokeEntity {
  constructor(g, mon, side, x, y) {
    this.g = g; this.mon = mon; this.side = side;
    this.x = x; this.y = y; this.z = 0; this.vz = 0;
    this.vx = 0; this.vy = 0; this.kx = 0; this.ky = 0;
    this.dir = 2; this.angle = Math.PI / 2;
    this.anim = 'Idle'; this.animT = Math.random(); this.animLoop = true;
    this.cds = [0, 0, 0, 0]; this.lock = 0; this.iframes = 0; this.stun = 0; this.flash = 0;
    this.hpShow = 0; this.dead = false; this.alpha = 1; this.scale = 1;
    this.temper = TEMPER[mon.dex] ?? 'neutral';
    this.ai = { state: 'idle', t: Math.random() * 2, tx: x, ty: y, home: { x, y } };
    this.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.view = new PIXI.Container();
    this.shadow = new PIXI.Sprite(g.tx.shadow); this.shadow.anchor.set(0.5);
    this.body = new PIXI.Sprite(); this.body.anchor.set(0.5);
    this.bar = new PIXI.Graphics();
    this.view.addChild(this.shadow, this.body, this.bar);
    this.r = 6;
    this.ready = loadPokemonSprites(mon.dex).then((set) => { this.set = set; this.r = Math.max(5, Math.min(18, set.size * 0.22)); this.shadow.scale.set(0.6 + set.shadow * 0.35); });
  }

  get alive() { return !this.dead && this.mon.hp > 0; }
  stat(k) { const s = this.stages[k] ?? 0; return this.mon.stats[k] * (s >= 0 ? (2 + s) / 2 : 2 / (2 - s)); }

  play(name, loop = false) { if (this.anim === name && loop && this.animLoop) return; this.anim = name; this.animT = 0; this.animLoop = loop; }
  face(dx, dy) { if (Math.abs(dx) + Math.abs(dy) < 1e-3) return; this.angle = Math.atan2(dy, dx); this.dir = dir8(dx, dy); }

  // Comportamento do selvagem: passeia, percebe, foge ou ataca
  think(dt) {
    const g = this.g, ai = this.ai;
    const pl = g.player, lead = g.lead;
    const target = this.aggroTarget?.alive !== false && this.aggroTarget ? this.aggroTarget : null;
    ai.t -= dt;
    const dP = Math.hypot(pl.x - this.x, pl.y - this.y);
    if (ai.state === 'sleep') { if (dP < 18 && pl.speed > 60) this.wake(); return { vx: 0, vy: 0 }; }
    if (ai.state === 'flee') {
      const fx = this.x - pl.x, fy = this.y - pl.y, l = Math.hypot(fx, fy) || 1;
      if (ai.t <= 0 || dP > 260) { ai.state = 'idle'; ai.t = 2; ai.home = { x: this.x, y: this.y }; }
      return { vx: (fx / l) * this.speed(1.35), vy: (fy / l) * this.speed(1.35) };
    }
    if (ai.state === 'aggro' && target) {
      const dx = target.x - this.x, dy = target.y - this.y, d = Math.hypot(dx, dy) || 1;
      this.face(dx, dy);
      if (d > 420 || ai.t <= 0 && d > 260) { ai.state = 'idle'; this.aggroTarget = null; ai.t = 2; return { vx: 0, vy: 0 }; }
      // escolhe golpe
      if (this.lock <= 0 && this.stun <= 0) {
        const opts = this.mon.moves.map((id, i) => ({ id, i, mv: g.combat.move(id) })).filter((o) => o.mv && this.cds[o.i] <= 0 && g.combat.inRange(this, o.mv, d));
        if (opts.length && Math.random() < dt * 2.2) {
          const o = opts[Math.floor(Math.random() * opts.length)];
          g.combat.use(this, o.i, target.x, target.y);
        }
      }
      const ranged = this.mon.moves.some((id) => ['proj', 'cone', 'wave', 'cloud', 'rain'].includes(g.combat.move(id)?.kind));
      const want = ranged ? 80 : 18 + this.r + (target.r ?? 6);
      const side = Math.sin(g.time * 1.3 + this.x * 0.01) > 0 ? 1 : -1;
      let vx = 0, vy = 0;
      if (d > want + 10) { vx = (dx / d); vy = (dy / d); }
      else if (d < want - 20) { vx = -(dx / d); vy = -(dy / d); }
      vx += (-dy / d) * 0.45 * side; vy += (dx / d) * 0.45 * side; // circula o alvo
      const s = this.speed(1.05);
      return { vx: vx * s, vy: vy * s };
    }
    // ocioso / passeando; agressivos percebem quem chega perto
    if (this.temper === 'aggressive' && lead && dP < 70) { this.provoke(pl.x < 1e9 ? lead : pl); g.fx.number(this.x, this.y - 26, '!', '#ff5a4a', true); }
    if (ai.state === 'idle' && ai.t <= 0) { ai.state = 'wander'; ai.t = 2 + Math.random() * 3; ai.tx = ai.home.x + (Math.random() - 0.5) * 120; ai.ty = ai.home.y + (Math.random() - 0.5) * 120; }
    if (ai.state === 'wander') {
      const dx = ai.tx - this.x, dy = ai.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 4 || ai.t <= 0) { ai.state = 'idle'; ai.t = 1 + Math.random() * 3; return { vx: 0, vy: 0 }; }
      return { vx: (dx / d) * this.speed(0.45), vy: (dy / d) * this.speed(0.45) };
    }
    return { vx: 0, vy: 0 };
  }
  speed(k = 1) { return (38 + this.stat('spe') * 0.42) * k * (this.mon.status === 'par' ? 0.6 : 1); }
  provoke(by) {
    if (this.side !== 'wild' || !this.alive) return;
    if (this.ai.state === 'sleep') this.wake();
    if (this.temper === 'timid' && this.mon.hp > this.mon.stats.hp * 0.3) { this.ai.state = 'flee'; this.ai.t = 4; return; }
    this.ai.state = 'aggro'; this.ai.t = 10; this.aggroTarget = by;
  }
  wake() { this.ai.state = 'idle'; this.ai.t = 0.6; this.g.fx.number(this.x, this.y - 26, '!', '#ffd84a', true); }

  update(dt) {
    if (!this.set) return;
    this.animT += dt;
    this.cds = this.cds.map((c) => Math.max(0, c - dt));
    this.lock -= dt; this.iframes -= dt; this.stun -= dt; this.flash -= dt; this.hpShow -= dt;
    // efeitos de estado contínuos
    if ((this.mon.status === 'brn' || this.mon.status === 'psn') && this.alive) {
      this.dot = (this.dot ?? 0) + dt;
      if (this.dot > 1.5) { this.dot = 0; this.g.combat.hurt(this, Math.max(1, Math.round(this.mon.stats.hp / 16)), null, { silent: true }); }
    }
    // movimento (quem controla define vx/vy antes)
    this.x += (this.vx + this.kx) * dt; this.y += (this.vy + this.ky) * dt;
    this.kx *= 1 - Math.min(1, dt * 7); this.ky *= 1 - Math.min(1, dt * 7);
    this.g.map.resolve(this, this.r * 0.8, this.swim);
    this.z = Math.max(0, this.z + this.vz * dt); this.vz -= 500 * dt; if (this.z === 0) this.vz = 0;
    const moving = Math.hypot(this.vx, this.vy) > 8;
    if (this.animLoop || this.anim === 'Idle' || this.anim === 'Walk') {
      if (this.ai.state === 'sleep' && this.set.anims.Sleep) this.play('Sleep', true);
      else this.play(moving ? 'Walk' : 'Idle', true);
    }
    const f = frameOf(this.set, this.anim, this.dir, this.animT * (this.anim === 'Walk' ? Math.max(0.7, Math.hypot(this.vx, this.vy) / 45) : 1), this.animLoop);
    if (!this.animLoop && f.done) this.play('Idle', true);
    this.body.texture = f.tex;
    // posição na tela (y-sort pelo pé)
    const bob = this.dead ? 0 : 0;
    this.view.x = Math.round(this.x); this.view.y = Math.round(this.y);
    this.body.y = -this.set.size * 0.28 - this.z + bob;
    this.shadow.y = 0; this.shadow.alpha = 0.9 - Math.min(0.6, this.z / 40);
    this.body.tint = this.flash > 0 ? 0xffffff : this.mon.status === 'par' && Math.sin(this.animT * 30) > 0.6 ? 0xfff27a : 0xffffff;
    this.body.alpha = this.alpha * (this.iframes > 0 && Math.sin(this.animT * 50) > 0 ? 0.55 : 1);
    if (this.flash > 0) this.body.tint = 0xff9a9a;
    this.view.scale.set(this.scale);
    // barra de vida (selvagens atingidos e o seu Pokémon em combate)
    this.bar.clear();
    if ((this.hpShow > 0 || this.side === 'wild' && this.mon.hp < this.mon.stats.hp) && this.alive) {
      const w = 22, k = this.mon.hp / this.mon.stats.hp, y = -this.set.size * 0.55 - 6 - this.z;
      this.bar.rect(-w / 2 - 1, y - 1, w + 2, 5).fill(0x1b1b1b);
      this.bar.rect(-w / 2, y, w * k, 3).fill(k > 0.5 ? 0x4cd06a : k > 0.2 ? 0xf2c94c : 0xef5b4b);
    }
  }
}
