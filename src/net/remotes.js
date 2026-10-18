import * as PIXI from 'pixi.js';
import { makeCharacterFrames, dir4, FH } from '../sprites/characters.js';

const TAG_Y = -(FH + 1), BUBBLE_Y = -(FH + 11); // nome e balão acima da cabeça (quadro de FH px)
import { PokeEntity } from '../entities/pokemon.js';
import { validateMon, validateState, cleanLook } from './validate.js';
import { MountRig } from '../world/mounts.js';

// Os outros treinadores no seu mapa: boneco com o visual do criador de personagem (makeCharacterFrames), nome em cima, balão de fala,
// emotes e o Pokémon que acompanha. A posição chega 10x/s (20x/s no duelo) e é interpolada:
// mostramos cada um ~130 ms no passado, entre duas amostras reais, para o movimento sair liso.

const DELAY = 130, DELAY_DUEL = 90, EXTRAP = 160;
export const EMOTES = { heart: '♥', excl: '!', ask: '?', note: '♪', dots: '…', gg: 'GG', zz: 'zZ', smile: ':)' };

function label(text, color = '#ffffff', size = 6) {
  const t = new PIXI.Text({ text, style: { fontFamily: 'Avenir Next, Nunito, system-ui', fontWeight: '900', fontSize: size, fill: color, stroke: { color: '#14201a', width: 2.2 }, align: 'center' } });
  t.resolution = 4; t.anchor.set(0.5, 1); return t;
}

// Balão branco com texto, acima de um contêiner (treinador)
export function bubble(parent, text, { big = false, life = 5 } = {}) {
  parent.bubble?.destroy({ children: true });
  const c = new PIXI.Container();
  const t = new PIXI.Text({ text, style: { fontFamily: 'Avenir Next, Nunito, system-ui', fontWeight: '800', fontSize: big ? 10 : 5.5, fill: '#1c2a20', wordWrap: true, wordWrapWidth: 92, breakWords: true, align: 'center' } });
  t.resolution = 5; t.anchor.set(0.5, 1);
  const w = Math.max(big ? 14 : 16, t.width + 7), h = t.height + 4;
  const g = new PIXI.Graphics();
  g.roundRect(-w / 2, -h, w, h, 3).fill(0xffffff).stroke({ width: 0.8, color: 0x3a4a3e });
  g.poly([-2.5, -0.4, 2.5, -0.4, 0, 3]).fill(0xffffff);
  t.y = -2;
  c.addChild(g, t); c.y = BUBBLE_Y; c.life = life; c.max = life; c.big = big;
  parent.addChild(c); parent.bubble = c;
  return c;
}
export function tickBubble(parent, dt) {
  const b = parent.bubble; if (!b) return;
  b.life -= dt;
  const k = b.max - b.life;
  b.scale.set(b.big ? Math.min(1, 0.4 + k * 5) * (1 + Math.max(0, 0.15 - k) * 2) : 1);
  b.alpha = Math.min(1, b.life * 2);
  if (b.life <= 0) { b.destroy({ children: true }); parent.bubble = null; }
}

class Remote {
  constructor(g, p) {
    this.g = g; this.id = p.id; this.name = p.name; this.color = p.color;
    this.buf = []; this.off = null; this.lead = null; this.leadKey = ''; this.follower = null; this.duelMon = null;
    this.lookKey = ''; this.frames = null;
    const v = this.view = new PIXI.Container();
    const shadow = new PIXI.Sprite(g.tx.shadow); shadow.anchor.set(0.5); shadow.scale.set(0.8);
    this.body = new PIXI.Sprite(); this.body.anchor.set(0.5, 1); this.body.y = 2;
    this.setLook(p.look);
    this.tag = label(p.name, '#ffffff'); this.tag.y = TAG_Y;
    this.dot = new PIXI.Graphics(); this.#dot();
    v.addChild(shadow, this.body, this.tag, this.dot);
    v.visible = false; // até chegar a primeira posição
    g.ents.addChild(v);
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.t = 0; this.dir = 'down';
  }
  #dot() { this.dot.clear(); this.dot.circle(-this.tag.width / 2 - 3.5, -this.tag.height / 2 + TAG_Y, 2).fill(parseInt(this.color.slice(1), 16)).stroke({ width: 0.8, color: 0x14201a }); }
  // visual do jogador (vem no aperto de mão, no roster e no 'info'); já chega limpo por cleanLook
  setLook(look) {
    const l = cleanLook(look), key = JSON.stringify(l);
    if (key === this.lookKey) return;
    this.lookKey = key; this.frames = makeCharacterFrames(l);
    this.body.texture = this.frames.walk[this.dir ?? 'down'][0];
  }
  rename(name) { if (name === this.name) return; this.name = name; this.tag.text = name; this.#dot(); }
  push(s, ts) {
    const now = performance.now();
    if (Number.isFinite(ts)) { const o = now - ts; this.off = this.off == null || o < this.off ? o : this.off + (o - this.off) * 0.02; }
    const t = Number.isFinite(ts) && this.off != null ? ts + this.off : now;
    if (this.buf.length && t <= this.buf[this.buf.length - 1].t) return; // fora de ordem
    this.buf.push({ ...s, t }); if (this.buf.length > 30) this.buf.shift();
  }
  // posição interpolada no instante (agora - atraso)
  sample(delay) {
    const b = this.buf; if (!b.length) return null;
    const rt = performance.now() - delay;
    let i = b.length - 1; while (i > 0 && b[i - 1].t > rt) i--;
    const B = b[i], A = b[i - 1];
    if (!A && rt < B.t) return { ...B, vx: 0, vy: 0, lv: { x: 0, y: 0 } };
    if (!A || rt >= B.t) {
      const P = b[b.length - 2], Q = b[b.length - 1];
      if (!P || rt - Q.t > EXTRAP) return { ...Q, vx: 0, vy: 0, lv: { x: 0, y: 0 } };
      const k = (rt - Q.t) / Math.max(1, Q.t - P.t), dt = (Q.t - P.t) / 1000 || 0.1;
      const vx = (Q.x - P.x) / dt, vy = (Q.y - P.y) / dt;
      const l = Q.l && P.l ? { ...Q.l, x: Q.l.x + (Q.l.x - P.l.x) * k, y: Q.l.y + (Q.l.y - P.l.y) * k } : Q.l;
      const lv = Q.l && P.l ? { x: (Q.l.x - P.l.x) / dt, y: (Q.l.y - P.l.y) / dt } : { x: 0, y: 0 };
      return { ...Q, x: Q.x + (Q.x - P.x) * k, y: Q.y + (Q.y - P.y) * k, vx, vy, l, lv };
    }
    if (rt <= A.t) return { ...A, vx: 0, vy: 0, lv: { x: 0, y: 0 } };
    const k = (rt - A.t) / (B.t - A.t), dt = (B.t - A.t) / 1000;
    const mix = (a, c) => a + (c - a) * k;
    const jump = Math.hypot(B.x - A.x, B.y - A.y) > 180;
    const l = A.l && B.l && A.l.u === B.l.u ? { ...B.l, x: mix(A.l.x, B.l.x), y: mix(A.l.y, B.l.y) } : B.l;
    const lv = A.l && B.l ? { x: (B.l.x - A.l.x) / dt, y: (B.l.y - A.l.y) / dt } : { x: 0, y: 0 };
    return jump ? { ...B, vx: 0, vy: 0, lv } : { ...B, x: mix(A.x, B.x), y: mix(A.y, B.y), vx: (B.x - A.x) / dt, vy: (B.y - A.y) / dt, l, lv };
  }
  setInfo(info) {
    if (!info) return;
    if (info.look) this.setLook(info.look);
    if (info.lead === null) { this.lead = null; return; }
    const v = validateMon(info.lead); if (v.ok) this.lead = v.mon;
  }
  // Pokémon que acompanha: o do 'info' fora do duelo; no duelo, o Mon validado pelo árbitro
  async ensureFollower(uid) {
    const g = this.g;
    const mon = this.duelMon?.(uid) ?? (this.lead && this.lead.uid === uid ? this.lead : null);
    const side = this.duelMon ? 'rival' : 'peer';
    const key = mon ? `${mon.uid}:${mon.dex}:${side}` : '';
    if (key === this.leadKey) return;
    this.leadKey = key;
    this.dropFollower();
    if (!mon) return;
    const s = this.buf[this.buf.length - 1]?.l;
    const e = new PokeEntity(g, mon, side, s?.x ?? this.x, s?.y ?? this.y);
    e.remote = this.id; e.pvp = side === 'rival';
    await e.ready;
    if (this.leadKey !== key || this.gone) { e.view.destroy({ children: true }); return; }
    this.follower = e; g.entities.push(e); g.ents.addChild(e.view);
    if (side === 'rival') { g.fx.burst(e.x, e.y - 8, 0xffffff, 1); e.vz = 90; }
  }
  dropFollower() {
    const e = this.follower; if (!e) return;
    this.follower = null;
    if (this.g.entities.includes(e)) this.g.removeEntity(e);
  }
  update(dt, duel) {
    const s = this.sample(duel ? DELAY_DUEL : DELAY);
    if (!s) return;
    const v = this.view; v.visible = true;
    this.x = s.x; this.y = s.y; this.t += dt;
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > 10) this.dir = dir4(s.vx, s.vy); else this.dir = s.d;
    const anim = sp > 10 && s.r ? this.frames.run : this.frames.walk;
    const step = sp > 10 ? Math.floor(this.t * (s.r ? 11 : 7.5)) % anim[this.dir].length : 0;
    this.body.texture = anim[this.dir][step];
    v.x = Math.round(s.x); v.y = Math.round(s.y); v.zIndex = s.y;
    v.alpha = this.drop ? 0.45 : 1;
    // montado: o mesmo desenho da montaria do jogador (Pokémon PMD + treinador sentado); nome e balão sobem junto
    if (s.m || this.rig?.kind) {
      this.rig ??= new MountRig(this.g, v, this.body, v.children[0]);
      this.rig.setKind(s.m ?? null, s.mountDex); // espécie montada (mountDex); fora da tabela, a padrão do modo
      const on = this.rig.update(dt, { x: s.x, y: s.y, vx: s.vx, vy: s.vy, z: s.z ?? 0, frames: this.frames, dir4: this.dir, under: !!s.u, face: { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[this.dir] });
      const lift = on ? this.rig.lift : 0;
      this.tag.y = TAG_Y - lift; this.dot.y = -lift; if (v.bubble) v.bubble.y = BUBBLE_Y - lift;
    }
    tickBubble(v, dt);
    // Pokémon que acompanha
    if (s.l?.u) this.ensureFollower(s.l.u); else if (this.leadKey) { this.leadKey = ''; this.dropFollower(); }
    const e = this.follower;
    if (e && s.l) {
      e.kx = e.ky = 0;
      const far = Math.hypot(e.x - s.l.x, e.y - s.l.y) > 120;
      e.vx = far ? 0 : s.lv.x; e.vy = far ? 0 : s.lv.y;
      // a física do quadro soma vx*dt depois; compensamos para cair exatamente no ponto interpolado
      e.x = s.l.x - e.vx * dt; e.y = s.l.y - e.vy * dt;
      if (Math.hypot(e.vx, e.vy) > 8) e.face(e.vx, e.vy); else e.dir = s.l.a;
      e.alpha = this.drop ? 0.45 : e.alpha;
    }
  }
  destroy() {
    this.gone = true;
    this.rig?.destroy();
    this.dropFollower();
    this.view.destroy({ children: true });
  }
}

export class Remotes {
  constructor(g) { this.g = g; this.map = new Map(); }
  sync(roster, selfId) {
    const want = new Set();
    for (const p of roster) {
      if (p.id === selfId) continue;
      want.add(p.id);
      let r = this.map.get(p.id);
      if (!r) { r = new Remote(this.g, p); this.map.set(p.id, r); }
      r.rename(p.name); if (p.look) r.setLook(p.look); r.drop = !!p.drop;
    }
    for (const [id, r] of this.map) if (!want.has(id)) { r.destroy(); this.map.delete(id); }
  }
  get(id) { return this.map.get(id); }
  onState(id, data) { const s = validateState(data); if (s) this.map.get(id)?.push(s, Number(data.ts)); }
  update(dt, duelWith) { for (const r of this.map.values()) r.update(dt, r.id === duelWith); }
  nearest(x, y, max = 44) {
    let best = null, bd = max;
    for (const r of this.map.values()) { if (!r.view.visible || r.drop) continue; const d = Math.hypot(r.x - x, r.y - y); if (d < bd) { bd = d; best = r; } }
    return best;
  }
  clear() { for (const r of this.map.values()) r.destroy(); this.map.clear(); }
}
