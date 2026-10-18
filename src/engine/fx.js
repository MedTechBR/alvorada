import * as PIXI from 'pixi.js';

// Efeitos: partículas (pool), números de dano, tremor de tela, pausa no impacto, marcas no chão.
export class Fx {
  constructor(g) {
    this.g = g;
    this.layer = new PIXI.Container();      // acima das entidades
    this.ground = new PIXI.Container();     // marcas no chão (queimado, cratera)
    this.add = new PIXI.Container(); this.add.blendMode = 'add';
    this.layer.addChild(this.add);
    this.pool = []; this.live = [];
    this.texts = [];
    this.shake = 0; this.hitStop = 0; this.flash = 0;
  }

  // Partícula: cor, tamanho, velocidade, vida, gravidade, aditiva
  emit(x, y, { color = 0xffffff, size = 3, n = 1, speed = 40, life = 0.5, grav = 0, add = true, drag = 2, z = 0, vz = 0, tex = 'glow', spread = Math.PI * 2, dir = 0, grow = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const s = this.pool.pop() ?? new PIXI.Sprite();
      s.texture = this.g.tx[tex] ?? this.g.tx.glow;
      s.anchor.set(0.5); s.tint = color; s.alpha = 1;
      const a = dir + (Math.random() - 0.5) * spread, v = speed * (0.4 + Math.random() * 0.8);
      s.p = { x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: vz * (0.6 + Math.random() * 0.8), life, max: life, size, grav, drag, grow };
      (add ? this.add : this.layer).addChild(s);
      this.live.push(s);
    }
  }
  burst(x, y, color, power = 1) {
    this.emit(x, y, { color, n: Math.round(14 * power), speed: 90 * power, size: 4, life: 0.35 });
    this.emit(x, y, { color: 0xffffff, n: Math.round(5 * power), speed: 50, size: 6, life: 0.18 });
    this.ring(x, y, color, 14 * power);
  }
  ring(x, y, color, r, life = 0.3) {
    const gfx = new PIXI.Graphics(); gfx.circle(0, 0, r).stroke({ width: 2, color }); gfx.x = x; gfx.y = y;
    gfx.p = { ring: true, life, max: life }; this.layer.addChild(gfx); this.live.push(gfx);
  }
  scorch(x, y, r, color = 0x2a1e14, alpha = 0.45) {
    const gfx = new PIXI.Graphics(); gfx.ellipse(0, 0, r, r * 0.6).fill({ color, alpha }); gfx.x = x; gfx.y = y;
    gfx.p = { decal: true, life: 25, max: 25 }; this.ground.addChild(gfx); this.live.push(gfx);
  }
  number(x, y, text, color = '#ffffff', big = false) {
    const t = new PIXI.Text({ text, style: { fontFamily: 'Avenir Next, system-ui', fontWeight: '900', fontSize: big ? 15 : 11, fill: color, stroke: { color: '#1b1b1b', width: 3 } } });
    t.anchor.set(0.5); t.x = x; t.y = y; t.resolution = 3;
    t.p = { text: true, life: 0.8, max: 0.8, vy: -30 }; this.layer.addChild(t); this.live.push(t);
  }
  kick(shake = 0.2, stop = 0.05) { this.shake = Math.max(this.shake, shake); this.hitStop = Math.max(this.hitStop, stop); }

  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const s = this.live[i], p = s.p;
      p.life -= dt;
      const k = Math.max(0, p.life / p.max);
      if (p.ring) { s.scale.set(1 + (1 - k) * 2.2); s.alpha = k; }
      else if (p.decal) { s.alpha = Math.min(1, p.life / 3); }
      else if (p.text) { s.y += p.vy * dt; p.vy *= 0.92; s.alpha = Math.min(1, k * 2); }
      else {
        p.vx *= 1 - Math.min(1, p.drag * dt); p.vy *= 1 - Math.min(1, p.drag * dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= p.grav * dt; p.z = Math.max(0, p.z + p.vz * dt);
        s.x = p.x; s.y = p.y - p.z;
        const sz = (p.size + p.grow * (1 - k)) / 8; s.scale.set(sz); s.alpha = k;
      }
      if (p.life <= 0) {
        s.parent?.removeChild(s); this.live.splice(i, 1);
        if (s instanceof PIXI.Sprite && !p.text) this.pool.push(s); else s.destroy();
      }
    }
  }
}
