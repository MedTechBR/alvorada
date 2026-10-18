import * as PIXI from 'pixi.js';
import { frameOf, dir8, loadPokemonSprites } from '../sprites/pmd.js';
import { TEMPER } from '../data/species.js';
import { speciesScale } from '../sprites/scale.js';
import { heldTick, statusTick } from '../mechanics/items.js';
import { TURNO_S } from '../mechanics/tempo.js';

// silhueta branca para o clarão de acerto (um filtro só, compartilhado)
let WHITE = null;
function whiteFilter() {
  if (!WHITE) { WHITE = new PIXI.ColorMatrixFilter(); WHITE.matrix = [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]; }
  return WHITE;
}

// Um Pokémon no mapa (do jogador ou selvagem). Não existe "modo batalha": ele sempre pode
// atacar e ser atacado; os selvagens reagem conforme o temperamento (ver combat/ai.js).
export class PokeEntity {
  constructor(g, mon, side, x, y) {
    this.g = g; this.mon = mon; this.side = side;
    this.x = x; this.y = y; this.z = 0; this.vz = 0;
    this.vx = 0; this.vy = 0; this.kx = 0; this.ky = 0;
    this.dir = 2; this.angle = Math.PI / 2;
    this.anim = 'Idle'; this.animT = Math.random(); this.animLoop = true;
    this.cds = [0, 0, 0, 0]; this.lock = 0; this.iframes = 0; this.stun = 0; this.flash = 0;
    this.hpShow = 0; this.dead = false; this.alpha = 1; this.scale = 1;
    this.flashW = 0; this.spinT = 0; this.spinDir = 1; this.squash = 0; this.wobble = 0;
    this.temper = TEMPER[mon.dex] ?? 'neutral';
    this.ai = { state: 'idle', t: Math.random() * 2, tx: x, ty: y, home: { x, y } };
    this.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
    this.view = new PIXI.Container();
    this.shadow = new PIXI.Sprite(g.tx.shadow); this.shadow.anchor.set(0.5);
    this.body = new PIXI.Sprite(); this.body.anchor.set(0.5);
    this.bar = new PIXI.Graphics();
    this.view.addChild(this.shadow, this.body, this.bar);
    this.r = 6;
    this.ready = loadPokemonSprites(mon.spriteKey).then((set) => this.setSprites(set));
  }

  // Troca o conjunto de sprites (entrada e evolução) e aplica a escala da espécie (altura real)
  setSprites(set) {
    this.set = set;
    this.baseScale = speciesScale(this.mon.spriteKey ?? this.mon.dex, set);
    this.h = (set.top || 24) * this.baseScale;            // altura na tela (px), sem o tamanho de alfa
    this.r = Math.max(5, Math.min(28, set.size * 0.22 * this.baseScale)) * (this.isAlpha ? 1.3 : 1);
    this.shadow.scale.set(...(set.shadowScale ?? [1, 1]));
  }
  get fullScale() { return (this.scale ?? 1) * (this.baseScale ?? 1); }

  // Ponto de onde sai um golpe (boca ou mão) no quadro atual, em coordenadas do mundo.
  // Devolve { x, y, h }: (x, y) = posição no chão abaixo da boca; h = altura da boca acima do chão (px).
  emitPoint(kind = 'mouth') {
    const f = this.f, s = this.fullScale;
    const p = f ? (kind === 'hand' ? f.hand : f.mouth) : { x: 0, y: -(this.set?.top ?? 16) * 0.6 };
    const lift = Math.max(0, -p.y * s * 0.75) + this.z;  // parte da altura vira profundidade (vista 3/4)
    return { x: this.x + p.x * s, y: this.y + p.y * s + lift - this.z, h: lift };
  }
  // altura do centro do corpo acima do chão (px de mundo)
  get midH() { return (this.h ?? 16) * 0.5 * (this.scale ?? 1) + this.z; }
  // topo da cabeça acima do chão (px de mundo)
  get topH() { return (this.h ?? 16) * (this.scale ?? 1) + this.z; }

  get alive() { return !this.dead && this.mon.hp > 0; }
  stat(k) { const s = this.stages[k] ?? 0; return (this.mon.stats[k] ?? 10) * (s >= 0 ? (2 + s) / 2 : 2 / (2 - s)); }

  play(name, loop = false) { if (this.anim === name && loop && this.animLoop) return; this.anim = name; this.animT = 0; this.animLoop = loop; }
  face(dx, dy) { if (Math.abs(dx) + Math.abs(dy) < 1e-3) return; this.angle = Math.atan2(dy, dx); this.dir = dir8(dx, dy); }

  think(dt) { return this.g.combat.ai.think(this, dt); }
  // arenaVel: terreno da arena de ginásio (teia, chão alagado), calculado pela arena a cada quadro
  speed(k = 1) { return (38 + this.stat('spe') * 0.42) * k * (this.mon.status === 'par' ? 0.6 : 1) * (this.arenaVel ?? 1); }
  provoke(by) { this.g.combat.ai.provoke(this, by); }
  wake() { this.g.combat.ai.wake(this); }

  // reação ao golpe: clarão branco, animação Hurt, amassa, e gira se estiver no ar ou for arremessado
  react({ power = 1, eff = 1, crit = false, quiet = false } = {}) {
    this.flashW = quiet ? 0.05 : 0.09; this.flash = quiet ? 0.1 : 0.18;
    if (this.alt?.mode === 'dive' || this.alt?.mode === 'dig') return;
    if (!quiet || this.anim !== 'Hurt') this.play('Hurt');
    this.squash = Math.min(0.35, 0.12 + power * 0.08);
    const strong = power > 1.35 || eff > 1 || crit;
    if (!quiet && (this.z > 6 || strong)) {
      this.vz = Math.max(this.vz, strong ? 120 + power * 50 : 60);
      if (this.z > 6 || power > 1.7) { this.spinT = 0.45 + Math.min(0.3, power * 0.1); this.spinDir = Math.random() < 0.5 ? -1 : 1; }
    }
  }

  update(dt) {
    if (!this.set) return;
    this.animT += dt;
    const cds = this.cds; for (let i = 0; i < cds.length; i++) if (cds[i] > 0) cds[i] = Math.max(0, cds[i] - dt);
    this.lock -= dt; this.iframes -= dt; this.stun -= dt; this.flash -= dt; this.hpShow -= dt; this.flashW -= dt;
    // efeitos de estado contínuos
    // estados e itens equipados (regras dos jogos: veneno, queimadura, Sobras, frutas, orbes; 1 turno = 3 s)
    if (this.alive && !this.pvp) {
      const g = this.g;
      if (this.mon.status === 'brn' || this.mon.status === 'psn' || this.mon.status === 'tox') {
        this.dot = (this.dot ?? 0) + dt;
        if (this.dot >= TURNO_S) {
          this.dot = 0;
          const d = statusTick(this.mon, this);
          if (d > 0) { g.combat.hurt(this, d, null, { silent: true }); g.fx.number(this.x, this.y - (this.h ?? 20) - 8, String(d), '#d090ff'); }
          g.fx.emit(this.x, this.y - 12, this.mon.status === 'brn' ? { frames: 'flame', n: 4, speed: 15, vz: 30, life: 0.5, add: false } : { tex: 'bubble', color: 0xd090ff, n: 4, speed: 12, vz: 20, life: 0.6, add: false, scale: 0.7 });
        }
      }
      if (this.mon.item || this.mon.ability) {
        for (const ev of heldTick(this.mon, dt, { entity: this })) {
          if (ev.kind === 'heal' || (ev.kind === 'berry' && ev.amount)) g.fx.number(this.x, this.y - (this.h ?? 20) - 8, '+' + ev.amount, '#7dff8a');
          if (ev.note && this.side === 'ally') g.toast?.(`${this.mon.name}: ${ev.note}`);
          if (ev.kind === 'hurt' && this.mon.hp <= 0) g.onFaint(this, null);
        }
      }
    }
    // movimento (quem controla define vx/vy antes)
    if (this.dead) { this.vx *= 0.8; this.vy *= 0.8; }
    this.x += (this.vx + this.kx) * dt; this.y += (this.vy + this.ky) * dt;
    this.kx *= 1 - Math.min(1, dt * 7); this.ky *= 1 - Math.min(1, dt * 7);
    if (!this.g.combat?.alt?.resolve(this, this.r * 0.8)) this.g.map.resolve(this, this.r * 0.8, this.swim);
    const wasUp = this.z > 0;
    this.z = Math.max(0, this.z + this.vz * dt); this.vz -= 500 * dt; if (this.z === 0) this.vz = 0;
    if (wasUp && this.z === 0 && this.spinT <= 0 && !this.alt) this.squash = Math.max(this.squash, 0.15);
    const moving = Math.hypot(this.vx, this.vy) > 8;
    if (!this.dead && (this.animLoop || this.anim === 'Idle' || this.anim === 'Walk')) {
      if (this.ai.state === 'sleep' && this.set.anims.Sleep) this.play('Sleep', true);
      else if (!this.charging) this.play(moving ? 'Walk' : 'Idle', true);
    }
    const f = frameOf(this.set, this.anim, this.dir, this.animT * (this.anim === 'Walk' ? Math.max(0.7, Math.hypot(this.vx, this.vy) / 45) : 1), this.animLoop);
    if (!this.animLoop && f.done && !this.dead) this.play('Idle', true);
    this.lastFrame = f; this.f = f;
    this.body.texture = f.tex;
    if (f.ax != null) this.body.anchor.set(f.ax, f.ay); // o ponto do chão do quadro fica na posição da entidade
    // posição na tela (y-sort pelo pé)
    this.view.x = Math.round(this.x); this.view.y = Math.round(this.y);
    let sx = 1, sy = 1, rot = 0, a = this.alpha;
    // respiração ao dormir
    if (this.ai.state === 'sleep' && !this.set.anims.Sleep) { sy = 1 - 0.05 * (0.5 + 0.5 * Math.sin(this.animT * 3)); sx = 2 - sy; }
    // amassa no impacto e na queda
    if (this.squash > 0) { sy *= 1 - this.squash; sx *= 1 + this.squash * 0.8; this.squash = Math.max(0, this.squash - dt * 1.6); }
    // giro no ar
    if (this.spinT > 0) { this.spinT -= dt; rot = this.spinDir * (1 - Math.max(0, this.spinT) / 0.6) * Math.PI * 2 * 1.5; if (this.spinT <= 0) rot = 0; }
    if (this.wheelT > 0) { this.wheelT -= dt; rot = this.animT * 22 * (Math.cos(this.angle) >= 0 ? 1 : -1); }
    // distorção psíquica
    if (this.wobble > 0) { this.wobble -= dt; const k = Math.min(1, this.wobble * 2); sx *= 1 + Math.sin(this.animT * 40) * 0.15 * k; sy *= 1 - Math.sin(this.animT * 40) * 0.12 * k; }
    // desmaio: clarão, cai de lado, afunda e some
    if (this.dead) {
      this.faintT = (this.faintT ?? 0) + dt;
      const t = this.faintT;
      const tip = Math.min(1, Math.max(0, (t - 0.12) / 0.25));
      rot = (this.faintDir ?? 1) * tip * tip * 1.45;
      sy *= 1 - 0.15 * tip; sx *= 1 + 0.08 * tip;
      a = t < 0.55 ? 1 : Math.max(0, 1 - (t - 0.55) / 0.45);
      this.alpha = a;
      if (t > 0.36 && !this.faintDust) { this.faintDust = true; this.g.fx.emit(this.x, this.y, { tex: 'dust', n: 7, speed: 40, life: 0.7, scale: 0.8, end: 2, add: false, alpha: 0.7 }); this.g.fx.kick(0.1, 0); }
    }
    const sc = this.fullScale;
    this.view.scale.set(sc);
    this.body.scale.set(sx, sy);
    this.body.rotation = rot;
    const hide = this.alt?.mode;
    // giro no ar acontece em volta do meio do corpo; no chão, em volta dos pés
    const mid = this.spinT > 0 || this.wheelT > 0 ? (this.set.top ?? 16) * 0.5 : 0;
    this.body.y = -this.z / sc - mid + (hide === 'dive' ? 4 : 0);
    if (mid && f.oy != null) this.body.anchor.set(f.ax, (f.oy - mid) / (f.tex.frame.height || 1));
    const sk = 1 - Math.min(0.45, this.z / 120), ss = this.set.shadowScale ?? [1, 1];
    this.shadow.y = 0; this.shadow.alpha = 0.9 - Math.min(0.6, this.z / 40); this.shadow.scale.set(ss[0] * sk, ss[1] * sk);
    // cores: clarão branco, vermelho do dano, paralisia, carga do golpe
    const white = this.flashW > 0 || (this.charging && this.charging.t > this.charging.W - 0.22 && Math.sin(this.animT * 60) > 0);
    const want = white ? 1 : 0;
    if (want !== this.whiteOn) { this.body.filters = white ? [whiteFilter()] : null; this.whiteOn = want; }
    let tint = 0xffffff;
    if (!white && this.flash > 0) tint = 0xffb4b4;
    else if (this.mon.status === 'par' && Math.sin(this.animT * 30) > 0.6) tint = 0xfff27a;
    else if (this.isAlpha && !this.dead) tint = 0xffe0e0;
    else if (this.dmaxT > 0 && !this.dead) tint = Math.sin(this.animT * 5) > 0 ? 0xffa0ae : 0xffccd2; // Dynamax: brilho vermelho
    if (hide === 'dive') tint = 0x4a8ad8;
    this.body.tint = tint;
    this.body.visible = hide !== 'dig';
    this.shadow.visible = hide !== 'dig' && hide !== 'dive';
    this.body.alpha = (hide === 'dive' ? 0.3 : a) * (this.iframes > 0 && !this.dead && Math.sin(this.animT * 50) > 0 ? 0.55 : 1);
    // alfa: olhos vermelhos e aura
    if (this.isAlpha && !this.dead && !hide) this.#alphaFx(dt);
    else if (this.eyes) this.eyes.visible = false;
    // barra de vida (selvagens atingidos e o seu Pokémon em combate)
    this.bar.clear();
    if ((this.hpShow > 0 || this.side === 'wild' && this.mon.hp < this.mon.stats.hp) && this.alive && !hide) {
      const w = this.isAlpha ? 26 : 22, k = this.mon.hp / this.mon.stats.hp, y = -(this.set.top ?? 16) - 5 - this.z / sc;
      this.bar.rect(-w / 2 - 1, y - 1, w + 2, 5).fill(this.isAlpha ? 0x5a0a0a : 0x1b1b1b);
      this.bar.rect(-w / 2, y, w * k, 3).fill(k > 0.5 ? 0x4cd06a : k > 0.2 ? 0xf2c94c : 0xef5b4b);
    }
  }
  #alphaFx(dt) {
    if (!this.eyes) {
      this.eyes = new PIXI.Container();
      for (let i = 0; i < 2; i++) { const s = new PIXI.Sprite(this.g.fx.T.sq); s.anchor.set(0.5); s.tint = 0xff2a1a; s.scale.set(0.5); this.eyes.addChild(s); }
      const glow = new PIXI.Sprite(this.g.fx.T.glow); glow.anchor.set(0.5); glow.tint = 0xff2a1a; glow.blendMode = 'add'; glow.alpha = 0.7; glow.scale.set(0.6, 0.35); this.eyes.addChild(glow);
      this.view.addChild(this.eyes);
    }
    const f = this.f, hd = f?.head ?? { x: 0, y: -(this.set.top ?? 16) * 0.8 };
    const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
    const front = sa > -0.35; // de costas não mostra os olhos
    this.eyes.visible = front && this.flashW <= 0 && !this.spinT;
    const cx = hd.x + ca * 1.5, cy = hd.y + 1 + this.body.y;
    const sep = 1.4 + Math.abs(sa) * 1.2;
    this.eyes.children[0].position.set(cx - sep, cy); this.eyes.children[1].position.set(cx + sep, cy);
    this.eyes.children[2].position.set(cx, cy); this.eyes.children[2].alpha = 0.5 + 0.3 * Math.sin(this.animT * 5);
    if (Math.random() < dt * 6) this.g.fx.emit(this.x + (Math.random() - 0.5) * this.r * 2, this.y - 2, { tex: 'glow', color: 0xff3a2a, size: 2.5, n: 1, speed: 4, vz: 30, life: 0.7, alpha: 0.7 });
  }
}
