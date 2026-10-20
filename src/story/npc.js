import * as PIXI from 'pixi.js';
import { makeNpcFrames } from '../sprites/npc.js';
import { makeCharacterFrames, dir4 } from '../sprites/characters.js';

// Visuais da história no formato do ramo `sprites` (predefinições + cores próprias)
const LOOK = {
  prof: 'professor', mom: 'mae', rival: 'rival', youngster: 'treinador',
  bugcatcher: { preset: 'treinador', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#7fbf4f', legs: 'shorts', pants: '#c9a46a', bag: '#5a8a3a' },
  leader: { preset: 'montanhista', hat: 'cap', cap: '#e8c860', capLogo: '#b8902a', top: '#c8452f', trim: '#3a5a9a', pants: '#3a5a9a', bagStyle: null },
  nurse: { preset: 'treinadora', hair: '#f08ab0', hairStyle: 'long', top: '#ffffff', trim: '#f08ab0', pants: '#f4c0d0', shoes: '#f08ab0', bagStyle: null },
  hiker: 'montanhista',
  // look de dados (3D e 2D): a enfermeira e o balconista usam as mesmas roupas dos LOOK acima
  enfermeira: { preset: 'treinadora', hair: '#f08ab0', hairStyle: 'long', top: '#ffffff', trim: '#f08ab0', pants: '#f4c0d0', shoes: '#f08ab0', bagStyle: null }, lojista: { preset: 'treinador', top: '#3a7ae8', pants: '#2a3a5a' }, guia: 'treinador',
};
function framesFor(look) {
  try { const f = makeCharacterFrames(LOOK[look] ?? look); if (f?.down) return f; } catch { /* desenho provisório */ }
  return makeNpcFrames(look);
}

// Personagem da história no mapa: anda até um ponto (cenas), vira para o jogador e mostra "!".
export class Npc {
  constructor(g, { id, name, look, x, y, dir = 'down' }) {
    this.g = g; this.id = id; this.name = name;
    this.x = x; this.y = y; this.dir = dir; this.home = { x, y, dir }; this.look = look;
    this.frames = framesFor(look);
    this.r = 6; this.h = (this.frames.fh ?? 30) + (look === 'leader' ? 4 : 0); this.t = 0; this.walk = null; this.speed = 0;
    this.view = new PIXI.Container();
    const shadow = new PIXI.Sprite(g.tx.shadow); shadow.anchor.set(0.5); shadow.scale.set(0.8);
    this.body = new PIXI.Sprite(this.frames[dir][0]); this.body.anchor.set(0.5, 1); this.body.y = 2;
    if (look === 'leader') this.body.scale.set(1.12);
    this.view.addChild(shadow, this.body);
    g.ents.addChild(this.view);
    this.update(0);
  }
  get visible() { return this.view.visible; }
  set visible(v) { this.view.visible = v; }
  face(dir) { this.dir = dir; }
  faceTo(x, y) { if (Math.hypot(x - this.x, y - this.y) > 1) this.dir = dir4(x - this.x, y - this.y); }
  place(x, y, dir) { this.x = x; this.y = y; if (dir) this.dir = dir; this.walk?.res(); this.walk = null; }
  goHome() { this.place(this.home.x, this.home.y, this.home.dir); }

  // Anda em linha reta até (x, y), desviando de blocos sólidos; se travar, chega teleportado
  walkTo(x, y, speed = 62) {
    this.walk?.res();
    return new Promise((res) => { this.walk = { x, y, speed, res, t: 0, stuck: 0 }; });
  }

  // pose de arremesso da Poké Bola (quando o desenho tem a animação "throw")
  throwPose() { this.throwT = 0.45; }

  exclaim(text = '!', color = 0xe5383b) {
    const g = this.g;
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics().roundRect(-5, -7, 10, 12, 3).fill(0xffffff).stroke({ width: 1, color: 0x1d2340 });
    bg.poly([-2, 5, 2, 5, 0, 8]).fill(0xffffff);
    const tx = new PIXI.Text({ text, style: { fontFamily: 'Avenir Next, Nunito, ui-rounded, system-ui, sans-serif', fontWeight: '900', fontSize: 40, fill: color } });
    tx.anchor.set(0.5); tx.scale.set(0.25); tx.y = -1;
    c.addChild(bg, tx); c.y = -this.h - 4;
    this.view.addChild(c);
    let t = 0;
    const tick = () => { t += g.app.ticker.deltaMS / 1000; c.scale.set(Math.min(1, t * 8)); if (t > 1.1) { g.app.ticker.remove(tick); c.destroy({ children: true }); } };
    g.app.ticker.add(tick);
  }

  update(dt) {
    const g = this.g, w = this.walk;
    this.t += dt;
    this.speed = 0;
    if (w) {
      const dx = w.x - this.x, dy = w.y - this.y, d = Math.hypot(dx, dy);
      w.t += dt;
      if (d < 2 || w.t > 12 || w.stuck > 1.2) {
        if (d >= 2 && !g.map.solidAt(w.x, w.y)) { this.x = w.x; this.y = w.y; }
        if (w.exato) { this.x = w.x; this.y = w.y; } // passo em grade (src/world/people.js): termina no centro do bloco
        this.walk = null; w.res();
      } else {
        const st = Math.min(d, w.speed * dt);
        const ox = this.x, oy = this.y;
        this.x += dx / d * st; this.y += dy / d * st;
        g.map.resolve(this, this.r);
        g.grade?.separaGente(this, this.r, this);
        const moved = Math.hypot(this.x - ox, this.y - oy);
        if (moved < st * 0.3) w.stuck += dt; else w.stuck = 0;
        this.dir = dir4(dx, dy); this.speed = w.speed;
      }
    }
    const step = this.speed > 5 ? Math.floor(this.t * 8) % 4 : 0;
    if (this.throwT > 0 && this.frames.throw) {
      this.throwT -= dt;
      const th = this.frames.throw[this.dir];
      this.body.texture = th[Math.min(th.length - 1, Math.floor((0.45 - this.throwT) / 0.15))] ?? th[0];
    } else this.body.texture = this.frames[this.dir][step];
    this.view.x = Math.round(this.x); this.view.y = Math.round(this.y); this.view.zIndex = this.y;
  }
  destroy() { this.view.destroy({ children: true }); }
}
