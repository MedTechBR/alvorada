import * as PIXI from 'pixi.js';
import { buildFxAtlas, glyphKeys, GLYPH_ADV } from './fxtex.js';
import { IS_TOUCH } from './input.js';

// Efeitos: partículas em pool (ParticleContainer, um draw call por camada), anéis de choque,
// raios, luzes, números e letreiros em fonte pixel, marcas no chão, tremor, pausa no impacto
// e clarão de tela. Nada é criado por quadro: tudo sai de pools.

const TAU = Math.PI * 2;
const DYN = { vertex: true, position: true, rotation: true, uvs: true, color: true };

// tira p do ParticleContainer em O(1) (troca com o último)
function pcRemove(pc, p) {
  const arr = pc.particleChildren, i = p.ci, last = arr[arr.length - 1];
  if (arr[i] !== p) { const j = arr.indexOf(p); if (j < 0) return; arr[j] = last; last.ci = j; arr.pop(); return; }
  arr[i] = last; last.ci = i; arr.pop();
}
function pcAdd(pc, p) { p.ci = pc.particleChildren.length; pc.particleChildren.push(p); }

export class Fx {
  constructor(g) {
    this.g = g;
    const A = buildFxAtlas(); this.A = A; this.T = A.tex;
    this.ground = new PIXI.Container();           // marcas no chão (abaixo das entidades)
    this.decals = new PIXI.Container(); this.ground.addChild(this.decals);
    this.groundPC = new PIXI.ParticleContainer({ dynamicProperties: DYN, texture: A.tex.px });
    this.ground.addChild(this.groundPC);
    this.layer = new PIXI.Container();            // acima das entidades
    this.pcN = new PIXI.ParticleContainer({ dynamicProperties: DYN, texture: A.tex.px });
    this.pcA = new PIXI.ParticleContainer({ dynamicProperties: DYN, texture: A.tex.px }); this.pcA.blendMode = 'add';
    this.shapes = new PIXI.Graphics(); this.shapes.blendMode = 'add';
    this.pcT = new PIXI.ParticleContainer({ dynamicProperties: DYN, texture: A.tex.px, roundPixels: true });
    this.add = this.pcA; // compatibilidade
    this.layer.addChild(this.pcN, this.shapes, this.pcA, this.pcT);
    this.pool = []; this.live = [];
    this.rings = []; this.bolts = []; this.texts = []; this.decalList = [];
    this.shake = 0; this.hitStop = 0; this.flash = 0; this.flashColor = 0xffffff;
    this.max = IS_TOUCH ? 1400 : 3200;
    this.q = IS_TOUCH ? 0.65 : 1;               // qualidade (pode cair se o quadro pesar)
    this.dirty = new Set();
  }

  // ---------- partículas ----------
  // Opções: color, color2 (cor final), size|scale, end (escala final relativa), n, speed, life,
  // grav, add, drag, z, vz, tex, frames, fps, spread, dir, grow, spin, rot ('rand'|'dir'|número),
  // stretch (estica na direção do movimento), bounce, jitter, alpha, fade ('late'), vx/vy herdados, ground
  emit(x, y, o = {}) {
    let n = o.n ?? 1;
    if (n > 1) n = Math.floor(n * this.q + Math.random());
    const texName = o.tex ?? 'glow';
    const frames = o.frames ? this.A.anim[o.frames] : null;
    const tex = frames ? frames[0] : (this.T[texName] ?? this.T.glow);
    const sz = frames ? 9 : (this.A.size[texName] ?? 16);
    const soft = texName === 'glow' || texName === 'light';
    const pc = o.ground ? this.groundPC : (o.add === false ? this.pcN : (o.add || soft) ? this.pcA : this.pcN);
    const speed = o.speed ?? 40, life = o.life ?? 0.5, spread = o.spread ?? TAU, dir = o.dir ?? 0;
    for (let i = 0; i < n; i++) {
      if (this.live.length >= this.max) return;
      const p = this.pool.pop() ?? new PIXI.Particle(tex);
      p.texture = tex; p.anchorX = 0.5; p.anchorY = 0.5;
      const a = dir + (Math.random() - 0.5) * spread, v = speed * (0.4 + Math.random() * 0.8);
      const j = o.jitter ?? 0;
      p.px = x + (j ? (Math.random() - 0.5) * j * 2 : 0); p.py = y + (j ? (Math.random() - 0.5) * j : 0);
      p.pz = o.z ?? 0; p.vx = Math.cos(a) * v + (o.vx ?? 0); p.vy = Math.sin(a) * v + (o.vy ?? 0);
      p.vz = (o.vz ?? 0) * (0.6 + Math.random() * 0.8);
      p.life = p.max = life * (o.lifeVar ? 1 - o.lifeVar * Math.random() : 1);
      const s0 = o.scale ?? (o.size != null ? o.size / (sz / 2) : 1);
      p.s0 = s0 * (o.scaleVar ? 1 - o.scaleVar * Math.random() : 1);
      p.s1 = o.grow ? (o.size + o.grow) / (sz / 2) : p.s0 * (o.end ?? 1);
      p.grav = o.grav ?? 0; p.drag = o.drag ?? 2; p.spin = o.spin ? (Math.random() - 0.5) * 2 * o.spin : 0;
      p.rotation = o.rot === 'rand' ? Math.random() * TAU : o.rot === 'dir' ? a : (o.rot ?? 0);
      p.dirRot = o.rot === 'dir';
      p.frames = frames; p.fps = o.fps ?? 12; p.ft = Math.random() * 4;
      p.c0 = o.color ?? 0xffffff; p.c1 = o.color2 ?? -1; p.tint = bgr(p.c0);
      p.amax = o.alpha ?? 1; p.late = o.fade === 'late'; p.stretch = o.stretch ?? 0; p.bounce = o.bounce ?? 0;
      p.pc = pc;
      p.x = p.px; p.y = p.py - p.pz; p.scaleX = p.scaleY = p.s0; p.alpha = p.amax;
      pcAdd(pc, p); this.dirty.add(pc);
      this.live.push(p);
    }
  }
  // Explosão genérica (mantida para o código antigo)
  burst(x, y, color, power = 1) {
    this.emit(x, y, { color, n: Math.round(14 * power), speed: 90 * power, size: 4, life: 0.35, end: 0.3 });
    this.emit(x, y, { color: 0xffffff, n: Math.round(5 * power), speed: 50, size: 6, life: 0.18 });
    this.light(x, y, color, 14 + 10 * power, 0.18);
    this.ring(x, y, color, 14 * power);
  }
  light(x, y, color = 0xffffff, r = 24, life = 0.2, alpha = 0.8) {
    if (this.lowLights) { if (r > 30) return; alpha *= 0.7; } // qualidade baixa: sem luzes grandes (overdraw aditivo)
    alpha *= r > 40 ? 0.6 : 0.75; // luz grande demais estoura a cena
    this.emit(x, y, { tex: 'light', color, n: 1, speed: 0, scale: r / 16, end: 1.2, life, alpha, drag: 0 });
  }

  // ---------- anéis de choque e raios (desenhados num Graphics aditivo) ----------
  ring(x, y, color = 0xffffff, r = 14, life = 0.3, o = {}) {
    if (this.rings.length > 60) this.rings.shift();
    this.rings.push({ x, y, color, r0: o.r0 ?? r * 0.25, r1: r * (o.mult ?? 3.2), life, max: life, w: o.width ?? 2, squash: o.squash ?? 0.6, fill: o.fill ?? 0 });
  }
  shock(x, y, color, r, life = 0.35) { this.ring(x, y, color, r / 3.2, life, { r0: r * 0.15, width: 4, fill: 0.22 }); this.ring(x, y, 0xffffff, r / 3.6, life * 0.8, { r0: r * 0.1, width: 1.5 }); }
  // Raio em zigue-zague de (x0,y0) a (x1,y1)
  bolt(x0, y0, x1, y1, color = 0xfff27a, life = 0.12, o = {}) {
    if (this.bolts.length > 40) this.bolts.shift();
    const seg = o.seg ?? Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 7)), amp = o.amp ?? 6;
    const pts = [x0, y0];
    const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
    for (let i = 1; i < seg; i++) { const k = i / seg, off = (Math.random() - 0.5) * 2 * amp; pts.push(x0 + (x1 - x0) * k + nx / l * off, y0 + (y1 - y0) * k + ny / l * off); }
    pts.push(x1, y1);
    this.bolts.push({ pts, color, life, max: life, w: o.width ?? 1.5 });
  }

  // ---------- marcas no chão ----------
  decal(kind, x, y, o = {}) {
    let d;
    if (this.decalList.length >= (IS_TOUCH ? 90 : 180)) { d = this.decalList.shift(); }
    else { d = { s: new PIXI.Sprite() }; d.s.anchor.set(0.5); this.decals.addChild(d.s); }
    const s = d.s; s.texture = this.T[kind] ?? this.T.scorch; s.visible = true;
    s.x = Math.round(x); s.y = Math.round(y); s.tint = o.tint ?? 0xffffff; s.rotation = o.rot ?? 0;
    const sc = o.scale ?? 1; s.scale.set(sc * (o.flip === false || Math.random() < 0.5 ? 1 : -1), sc);
    d.life = d.max = o.life ?? 30; d.a = o.alpha ?? 1; s.alpha = d.a;
    this.decalList.push(d);
    return d;
  }
  scorch(x, y, r, color = 0x2a1e14, alpha = 0.45) { this.decal(color === 0x2a1e14 ? 'scorch' : 'crater', x, y, { scale: Math.max(0.4, r / 10), alpha: Math.min(1, alpha * 1.8) }); }

  // ---------- textos em fonte pixel ----------
  // estilo: 'dmg' (salta em arco), 'info' (sobe), 'banner' (letreiro grande que treme)
  number(x, y, text, color = '#ffffff', big = false, style = null) {
    if (this.g.show) return this.g.show.texto(x, y, text, color, big, style); // textos na camada de tela (nítidos também no 3D)
    const keys = glyphKeys(String(text), this.T);
    const c = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
    const st = style ?? (/^[0-9]+$/.test(String(text)) ? 'dmg' : 'info');
    if (this.texts.length > 40) this.#killText(this.texts[0], 0);
    const glyphs = [];
    for (const k of keys) {
      const p = this.pool.pop() ?? new PIXI.Particle(this.T[k]);
      p.texture = this.T[k]; p.anchorX = 0.5; p.anchorY = 0.5; p.rotation = 0; p.tint = bgr(c); p.alpha = 1; p.pc = this.pcT;
      pcAdd(this.pcT, p); glyphs.push(p);
    }
    this.dirty.add(this.pcT);
    const life = st === 'banner' ? 1.05 : st === 'dmg' ? 0.95 : 0.9;
    const t = { glyphs, x, y, vx: st === 'dmg' ? (Math.random() - 0.5) * 50 : 0, vy: st === 'dmg' ? -95 - (big ? 25 : 0) : st === 'banner' ? -8 : -26,
      life, max: life, big, st, base: big && st === 'dmg' ? 1 : 2 / 3 };
    this.texts.push(t);
    this.#layoutText(t, 1);
    return t;
  }
  #layoutText(t, k) {
    const z = this.g.zoom || 3;
    const age = t.max - t.life;
    let s = t.base;
    if (t.st === 'dmg') s *= 1 + Math.max(0, 0.16 - age) / 0.16 * (t.big ? 0.6 : 0.4);
    else if (t.st === 'banner') s *= 1 + Math.max(0, 0.12 - age) / 0.12 * 1;
    s = Math.max(1 / z, Math.round(s * z) / z); // escala inteira na tela: fonte sempre nítida
    const n = t.glyphs.length, w = GLYPH_ADV * s;
    const shake = t.st === 'banner' && age < 0.35 ? (Math.random() - 0.5) * 2.5 : 0;
    const a = t.st === 'banner' ? Math.min(1, t.life / 0.25) : Math.min(1, k * 2.5);
    for (let i = 0; i < n; i++) {
      const p = t.glyphs[i];
      p.x = t.x + (i - (n - 1) / 2) * w + shake;
      p.y = t.y + (t.st === 'banner' ? Math.sin(age * 18 + i * 0.7) * Math.max(0, 0.4 - age) * 3 : 0);
      p.scaleX = p.scaleY = s; p.alpha = a;
    }
  }
  #killText(t, idx = -1) {
    for (const p of t.glyphs) { pcRemove(this.pcT, p); this.pool.push(p); }
    this.dirty.add(this.pcT);
    const i = idx >= 0 ? idx : this.texts.indexOf(t); if (i >= 0) this.texts.splice(i, 1);
  }

  // ---------- câmera ----------
  kick(shake = 0.2, stop = 0.05) { this.shake = Math.max(this.shake, shake); this.hitStop = Math.max(this.hitStop, Math.min(stop, 0.06)); } // pausa no impacto: no máximo 60 ms
  screenFlash(color = 0xffffff, a = 0.35) { this.flashColor = color; this.flash = Math.max(this.flash, Math.min(0.28, a * 0.6)); }

  // ---------- quadro ----------
  update(dt) {
    const live = this.live;
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i];
      p.life -= dt;
      if (p.life <= 0) {
        pcRemove(p.pc, p); this.dirty.add(p.pc);
        live[i] = live[live.length - 1]; live.pop(); this.pool.push(p);
        continue;
      }
      const k = p.life / p.max;
      const dr = 1 - Math.min(1, p.drag * dt);
      p.vx *= dr; p.vy *= dr;
      p.px += p.vx * dt; p.py += p.vy * dt;
      if (p.grav || p.vz) {
        p.vz -= p.grav * dt; p.pz += p.vz * dt;
        if (p.pz <= 0) { p.pz = 0; if (p.bounce && p.vz < -20) { p.vz = -p.vz * p.bounce; p.vx *= 0.6; p.vy *= 0.6; } else { p.vz = 0; if (p.grav > 0) { p.vx *= 0.5; p.vy *= 0.5; p.spin *= 0.5; } } }
      }
      p.x = p.px; p.y = p.py - p.pz;
      const s = p.s1 + (p.s0 - p.s1) * k;
      if (p.stretch) { const v = Math.hypot(p.vx, p.vy - p.vz); p.scaleX = s * (1 + v * p.stretch); p.scaleY = s; p.rotation = Math.atan2(p.vy - p.vz, p.vx); }
      else { p.scaleX = p.scaleY = s; if (p.spin) p.rotation += p.spin * dt; else if (p.dirRot) p.rotation = Math.atan2(p.vy, p.vx); }
      if (p.frames) { p.ft += dt * p.fps; p.texture = p.frames[Math.floor(p.ft) % p.frames.length]; }
      p.alpha = p.amax * (p.late ? Math.min(1, k * 3.3) : k);
      if (p.c1 >= 0) p.tint = bgr(lerpColor(p.c0, p.c1, 1 - k));
    }
    // textos
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.#killText(t, i); continue; }
      t.x += t.vx * dt; t.y += t.vy * dt;
      if (t.st === 'dmg') { t.vy += 260 * dt; if (t.max - t.life > 0.42) { t.vy = Math.min(t.vy, 6); t.vx *= 0.9; } }
      else t.vy *= 1 - Math.min(1, dt * 3);
      this.#layoutText(t, t.life / t.max);
    }
    for (const pc of this.dirty) pc.update();
    this.dirty.clear();
    // anéis e raios
    const G = this.shapes; G.clear();
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.life -= dt;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      const k = r.life / r.max, e = 1 - k * k, rad = r.r0 + (r.r1 - r.r0) * e;
      if (r.fill) G.ellipse(r.x, r.y, rad, rad * r.squash).fill({ color: r.color, alpha: r.fill * k });
      G.ellipse(r.x, r.y, rad, rad * r.squash).stroke({ width: Math.max(0.6, r.w * k + 0.4), color: r.color, alpha: Math.min(1, k * 1.4) });
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i]; b.life -= dt;
      if (b.life <= 0) { this.bolts.splice(i, 1); continue; }
      const k = b.life / b.max;
      G.poly(b.pts, false).stroke({ width: b.w * 3.2, color: b.color, alpha: 0.4 * k });
      G.poly(b.pts, false).stroke({ width: b.w, color: 0xffffff, alpha: k });
    }
    // marcas no chão somem devagar
    for (const d of this.decalList) if (d.life > 0) { d.life -= dt; d.s.alpha = d.a * Math.min(1, d.life / 4); if (d.life <= 0) d.s.visible = false; }
    // clarão de tela
    if (this.flash > 0 || this.flashSpr?.visible) {
      if (!this.flashSpr) { this.flashSpr = new PIXI.Sprite(PIXI.Texture.WHITE); this.flashSpr.blendMode = 'add'; this.g.app.stage.addChild(this.flashSpr); }
      const f = this.flashSpr; f.width = innerWidth; f.height = innerHeight; f.tint = this.flashColor;
      f.alpha = Math.max(0, this.flash); f.visible = this.flash > 0.005; this.flash -= dt * 2.2;
    }
  }
  get count() { return this.live.length; }
}

// o Particle do Pixi guarda a cor em ordem BGR
export const bgr = (c) => ((c & 255) << 16) | (c & 0xff00) | ((c >> 16) & 255);

export function lerpColor(a, b, t) {
  const ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255;
  return ((ar + ((b >> 16 & 255) - ar) * t) << 16) | ((ag + ((b >> 8 & 255) - ag) * t) << 8) | (ab + ((b & 255) - ab) * t);
}
