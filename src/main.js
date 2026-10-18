import * as PIXI from 'pixi.js';
import { Input, IS_TOUCH } from './engine/input.js';
import { Fx } from './engine/fx.js';
import { makeTiles, T, TILE } from './world/tiles.js';
import { GameMap } from './world/map.js';
import { makeTrainerFrames, dir4 } from './sprites/characters.js';
import { loadPokemonSprites } from './sprites/pmd.js';
import { PokeEntity } from './entities/pokemon.js';
import { Combat } from './combat/combat.js';
import { Mon } from './data/mon.js';
import { SPECIES, BIOME_ENCOUNTERS } from './data/species.js';
import { MOVES } from './data/moves.js';
import { TYPE_PT } from './data/types.js';
import { Audio } from './audio/audio.js';

const $ = (id) => document.getElementById(id);

class Game {
  async init() {
    this.app = new PIXI.Application();
    await this.app.init({ resizeTo: window, background: 0x1b2a1e, antialias: false, roundPixels: true, resolution: 1, preference: 'webgl', powerPreference: 'high-performance' });
    $('game').appendChild(this.app.canvas);
    PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';
    this.tx = makeTiles();
    this.input = new Input(this.app.canvas);
    this.audio = new Audio();
    this.time = 0; this.timers = [];
    // camadas do mundo
    this.world = new PIXI.Container();
    this.map = new GameMap(this.tx);
    this.world.addChild(this.map.buildLayer());
    this.fx = new Fx(this);
    this.world.addChild(this.fx.ground);
    this.ents = new PIXI.Container(); this.ents.sortableChildren = true;
    this.world.addChild(this.ents);
    this.combat = new Combat(this);
    this.world.addChild(this.combat.layer, this.fx.layer);
    this.app.stage.addChild(this.world);
    this.#buildObjects();
    // treinador e equipe
    this.player = this.#makeTrainer(100 * T, 104 * T);
    this.party = [new Mon(4, 8), new Mon(7, 7), new Mon(1, 7)];
    this.box = []; this.bag = { pokeball: 10, potion: 5 };
    this.leadIdx = 0; this.entities = [];
    await this.#sendOut(0);
    this.available = await fetch('assets/pmd/index.json').then((r) => r.json()).catch(() => [1, 4, 6, 7, 9, 25, 130, 133]);
    this.spawnT = 0; this.wilds = [];
    this.zoom = 3; this.#resize(); addEventListener('resize', () => this.#resize());
    this.cam = { x: this.player.x, y: this.player.y };
    $('loading').remove();
    this.hudInit();
    this.app.ticker.maxFPS = 0;
    this.app.ticker.add((tk) => this.frame(Math.min(0.05, tk.deltaMS / 1000)));
    window.game = this;
  }

  #resize() {
    // escala inteira para o pixel art ficar nítido: ~15 a 20 blocos de altura na tela
    this.zoom = Math.max(2, Math.round(innerHeight / (T * (IS_TOUCH ? 13 : 18))));
    this.world.scale.set(this.zoom);
  }

  #makeTrainer(x, y) {
    const frames = makeTrainerFrames();
    const view = new PIXI.Container();
    const shadow = new PIXI.Sprite(this.tx.shadow); shadow.anchor.set(0.5); shadow.scale.set(0.8);
    const body = new PIXI.Sprite(frames.down[0]); body.anchor.set(0.5, 1); body.y = 2;
    view.addChild(shadow, body); this.ents.addChild(view);
    const g = this;
    return {
      isTrainer: true, alive: true, side: 'ally', x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: 5, speed: 0, dir: 'down', t: 0, roll: 0, iframes: 0, view, body, frames,
      knock(kx, ky) { if (this.iframes > 0) return; this.kx += kx; this.ky += ky; this.stun = 0.3; this.iframes = 0.6; g.toast('Você foi atingido!'); },
    };
  }

  #buildObjects() {
    this.objSprites = new Map();
    for (const o of this.map.objects) {
      const s = new PIXI.Sprite(this.tx[o.kind]);
      s.anchor.set(0.5, 1); s.x = o.x; s.y = o.y + (o.kind === 'house' ? 4 : 2); s.zIndex = s.y;
      this.ents.addChild(s); o.sprite = s;
      for (const k of o.cells) this.objSprites.set(k, o);
    }
  }

  // ---------- equipe ----------
  async #sendOut(i) {
    const mon = this.party[i];
    if (this.lead) { this.fx.burst(this.lead.x, this.lead.y - 8, 0xff5a5a, 0.8); this.ents.removeChild(this.lead.view); this.entities = this.entities.filter((e) => e !== this.lead); }
    this.leadIdx = i;
    const e = new PokeEntity(this, mon, 'ally', this.player.x + 14, this.player.y + 6);
    await e.ready;
    this.lead = e; this.entities.push(e); this.ents.addChild(e.view);
    this.fx.burst(e.x, e.y - 8, 0xffffff, 1); e.vz = 90;
    this.hudLead(); this.hudMoves();
  }
  swap() {
    const n = this.party.length;
    for (let k = 1; k <= n; k++) { const i = (this.leadIdx + k) % n; if (!this.party[i].fainted) { if (i !== this.leadIdx) { this.#sendOut(i); this.toast(`Vai, ${this.party[i].name}!`); } return; } }
  }

  // ---------- selvagens ----------
  async spawnWild() {
    const p = this.player;
    for (let tries = 0; tries < 12; tries++) {
      const a = Math.random() * Math.PI * 2, d = (14 + Math.random() * 14) * T;
      const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
      if (this.map.solidAt(x, y) || this.map.solidAt(x + 8, y) || this.map.solidAt(x - 8, y)) continue;
      const biome = this.map.biome(x, y); if (biome === 'vila') continue;
      const table = (BIOME_ENCOUNTERS[biome] ?? BIOME_ENCOUNTERS.campo).filter((e) => this.available.includes(e[0]) && SPECIES[e[0]]);
      const pool = table.length ? table : this.available.filter((d) => SPECIES[d] && d !== 130).map((d) => [d, 3, 8, 1]);
      let r = Math.random() * pool.reduce((s, e) => s + e[3], 0); const entry = pool.find((e) => (r -= e[3]) < 0) ?? pool[0];
      const [dex, lo, hi] = entry;
      const mon = new Mon(dex, lo + Math.floor(Math.random() * (hi - lo + 1)));
      const w = new PokeEntity(this, mon, 'wild', x, y);
      await w.ready;
      if (Math.random() < 0.15) w.ai.state = 'sleep';
      this.entities.push(w); this.wilds.push(w); this.ents.addChild(w.view);
      w.alpha = 0; w.fadeIn = true;
      this.combat.ai.onSpawn(w); // bandos com alfa
      return;
    }
  }

  onFaint(e, by) {
    if (e.dead) return;
    e.dead = true; e.play('Hurt');
    this.fx.burst(e.x, e.y - 8, 0xffffff, 1.2);
    if (e.side === 'wild') {
      const lead = this.lead;
      if (lead?.alive && (by === lead || by?.side === 'ally')) this.giveXp(lead.mon, e.mon.xpYield());
      this.later(1.1, () => this.removeEntity(e));
    } else {
      this.toast(`${e.mon.name} desmaiou!`);
      this.later(0.8, () => {
        const next = this.party.findIndex((m) => !m.fainted);
        if (next >= 0) { this.#sendOut(next); this.toast(`Vai, ${this.party[next].name}!`); }
        else this.blackout();
      });
    }
  }
  removeEntity(e) { this.ents.removeChild(e.view); e.view.destroy({ children: true }); this.entities = this.entities.filter((o) => o !== e); this.wilds = this.wilds.filter((o) => o !== e); }
  giveXp(mon, xp) {
    const ev = mon.gainXp(xp);
    this.fx.number(this.lead.x, this.lead.y - 34, `+${xp} XP`, '#9ad0ff');
    for (const v of ev) {
      if (v.type === 'level') { this.toast(`${mon.name} subiu para o nível ${v.level}!`); this.audio.sfx('levelup'); this.fx.ring(this.lead.x, this.lead.y - 8, 0xffe27a, 16, 0.6); }
      if (v.type === 'learn') { if (mon.moves.length < 4) { mon.learn(v.move); this.toast(`${mon.name} aprendeu ${MOVES[v.move]?.name ?? v.move}!`); } else this.toast(`${mon.name} quer aprender ${MOVES[v.move]?.name}, mas já sabe 4 golpes.`); }
      if (v.type === 'evolve') this.later(1.2, () => this.evolve(mon, v.to));
    }
    this.hudLead(); this.hudMoves();
  }
  async evolve(mon, to) {
    const old = mon.name;
    const e = this.lead; if (!e || e.mon !== mon) { mon.evolveTo(to); return; }
    for (let i = 0; i < 6; i++) this.later(i * 0.12, () => { e.flash = 0.08; this.fx.ring(e.x, e.y - 8, 0xffffff, 10 + i * 3, 0.3); });
    this.later(0.8, async () => {
      mon.evolveTo(to); const set = await loadPokemonSprites(to); e.set = set; e.r = Math.max(5, Math.min(18, set.size * 0.22));
      this.fx.burst(e.x, e.y - 10, 0xffffff, 2); this.toast(`${old} evoluiu para ${mon.name}!`); this.audio.sfx('caught'); this.hudLead();
    });
  }
  blackout() {
    this.toast('Sua equipe desmaiou! Você voltou para a vila.');
    this.party.forEach((m) => m.heal());
    this.player.x = 100 * T; this.player.y = 104 * T;
    this.#sendOut(0);
  }

  // ---------- Poké Bola (a qualquer momento) ----------
  throwBall(ax, ay) {
    if (!this.bag.pokeball) { this.toast('Sem Poké Bolas!'); return; }
    this.bag.pokeball--;
    const p = this.player, dx = ax - p.x, dy = ay - p.y, d = Math.hypot(dx, dy) || 1;
    const ball = new PIXI.Graphics(); ball.circle(0, 0, 3).fill(0xffffff); ball.rect(-3, -3, 6, 3).fill(0xe5383b); ball.circle(0, 0, 1).fill(0x222222);
    this.world.addChild(ball);
    const dist = Math.min(d, 150), tx = p.x + dx / d * dist, ty = p.y + dy / d * dist;
    this.balls ??= []; this.balls.push({ s: ball, x0: p.x, y0: p.y - 12, x1: tx, y1: ty, t: 0, dur: 0.25 + dist / 600 });
    this.audio.sfx('throw');
  }
  #updateBalls(dt) {
    for (const b of this.balls ?? []) {
      if (b.capture) continue;
      b.t += dt / b.dur; const k = Math.min(1, b.t);
      b.x = b.x0 + (b.x1 - b.x0) * k; b.y = b.y0 + (b.y1 - b.y0) * k - Math.sin(k * Math.PI) * 26;
      b.s.x = b.x; b.s.y = b.y; b.s.rotation += dt * 20;
      const target = this.wilds.find((w) => w.alive && Math.hypot(w.x - b.x, w.y - 8 - b.y) < w.r + 6);
      if (target) { this.#capture(b, target); continue; }
      if (k >= 1) { b.done = true; this.fx.burst(b.x, b.y, 0xffffff, 0.3); this.later(1, () => b.s.destroy()); }
    }
    this.balls = (this.balls ?? []).filter((b) => !b.done);
  }
  #capture(b, w) {
    b.capture = true; w.busy = true; w.lock = 99;
    const chance = this.combat.catchChance(w);
    const shakes = chance >= 1 ? 4 : [0, 1, 2, 3].filter(() => Math.random() < Math.pow(chance, 0.25)).length;
    this.fx.burst(w.x, w.y - 8, 0xffffff, 1.2); this.audio.sfx('pop');
    w.view.visible = false;
    b.s.x = w.x; b.s.y = w.y - 3;
    for (let i = 0; i < Math.min(3, shakes); i++) this.later(0.5 + i * 0.6, () => { this.audio.sfx('shake'); b.wob = 0.3; });
    const end = 0.5 + Math.min(3, shakes) * 0.6 + 0.3;
    this.later(end, () => {
      if (shakes >= 4) {
        this.audio.sfx('caught'); this.fx.emit(b.s.x, b.s.y, { color: 0xffe27a, n: 14, speed: 40, size: 4, life: 0.7, vz: 60 });
        const m = w.mon; m.status = null;
        if (this.party.length < 6) { this.party.push(m); this.toast(`${m.name} foi capturado e entrou na equipe!`); } else { this.box.push(m); this.toast(`${m.name} foi capturado (enviado ao PC).`); }
        w.dead = true; this.removeEntity(w); this.hudLead();
      } else {
        w.view.visible = true; w.busy = false; w.lock = 0; this.fx.burst(w.x, w.y - 8, 0xff5a5a, 1); this.audio.sfx('pop');
        this.toast(['Ah, não! Escapou!', 'Quase!', 'Por pouco!'][Math.min(2, shakes)]); w.provoke(this.lead ?? this.player);
      }
      b.s.destroy(); b.done = true;
    });
  }

  // ---------- cenário destrutível ----------
  hitScenery(x, y, mv) {
    const k = Math.floor(x / T) + Math.floor(y / T) * this.map.w;
    const o = this.objSprites.get(k);
    if (o && !o.dead) {
      if (o.breakable) {
        o.hp -= (mv?.power ?? 40) >= 60 ? 2 : 1;
        this.fx.emit(o.x, o.y - 6, { color: o.kind === 'rock' ? 0x9a9aa2 : 0x4c9a48, n: 8, speed: 60, size: 4, life: 0.5, add: false, grav: 260, vz: 80 });
        if (o.hp <= 0) { this.map.removeObject(o); o.sprite.destroy(); this.fx.kick(0.15, 0.03); }
      } else this.fx.emit(x, y - 10, { color: 0x3f9a48, n: 4, speed: 30, size: 3, life: 0.5, add: false, grav: 120 });
      return true;
    }
    if (mv && ['grass', 'normal', 'fighting', 'steel', 'bug'].includes(mv.type) && this.map.tallAt(x, y) && mv.cat === 'phys') this.map.setTile(Math.floor(x / T), Math.floor(y / T), TILE.GRASS);
    return false;
  }
  scorchTile(x, y) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    const t = this.map.at(tx, ty);
    if (t === TILE.TALL || t === TILE.GRASS || t === TILE.GRASS2 || t === TILE.FLOWERS) { this.map.setTile(tx, ty, TILE.PATH); this.fx.scorch(tx * T + 8, ty * T + 8, 9); this.fx.emit(tx * T + 8, ty * T + 6, { color: 0xff8a2a, n: 3, speed: 15, size: 4, life: 0.6, vz: 30 }); }
  }

  later(delay, fn) { this.timers.push({ t: this.time + delay, fn }); }

  // ---------- quadro ----------
  frame(rdt) {
    const t0 = performance.now();
    const inp = this.input; inp.poll();
    if (inp.pressed('perf')) $('perf').hidden = !$('perf').hidden;
    // pausa no impacto: o mundo congela por alguns milissegundos
    let dt = rdt;
    if (this.fx.hitStop > 0) { this.fx.hitStop -= rdt; dt = rdt * 0.08; }
    this.time += dt;
    for (const tm of this.timers.slice()) if (tm.t <= this.time) { this.timers.splice(this.timers.indexOf(tm), 1); tm.fn(); }
    this.#control(dt, rdt);
    this.#updateWild(dt);
    this.combat.update(dt);
    this.#updateBalls(dt);
    for (const e of this.entities) { if (e.fadeIn) { e.alpha = Math.min(1, e.alpha + dt * 2); if (e.alpha >= 1) e.fadeIn = false; } if (e.dead) e.alpha = Math.max(0, e.alpha - dt * 2); e.update(dt); e.view.zIndex = e.y; }
    this.#crowd();
    this.fx.update(dt);
    this.#camera(rdt);
    this.map.flushDirty();
    this.hudUpdate(rdt);
    inp.endFrame();
    this.#perf(rdt, performance.now() - t0);
  }

  #aimPoint() {
    const inp = this.input, lead = this.lead ?? this.player;
    if (inp.releasedAim?.dir) { const d = inp.releasedAim.dir, l = Math.hypot(d.x, d.y) || 1; return { x: lead.x + d.x / l * 140, y: lead.y + d.y / l * 140 }; }
    if (inp.aimStick) return { x: lead.x + inp.aimStick.x * 140, y: lead.y + inp.aimStick.y * 140 };
    if (!IS_TOUCH && !inp.usingPad && inp.mouse.inside) return this.screenToWorld(inp.mouse.x, inp.mouse.y);
    // mira automática: selvagem mais próximo à frente (ou o mais próximo)
    const p = this.player; let best = null, bd = 230;
    for (const w of this.wilds) { if (!w.alive) continue; const d = Math.hypot(w.x - lead.x, w.y - lead.y); if (d < bd) { bd = d; best = w; } }
    if (best) return { x: best.x, y: best.y - 6 };
    const fd = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir];
    return { x: lead.x + fd[0] * 120, y: lead.y + fd[1] * 120 };
  }
  screenToWorld(sx, sy) { return { x: (sx - this.world.x) / this.zoom, y: (sy - this.world.y) / this.zoom }; }

  #control(dt) {
    const inp = this.input, p = this.player;
    if (this.combat.pilot.control(dt)) return; // modo de controle direto do Pokémon (R)
    // treinador
    p.t += dt; p.iframes -= dt; p.stun = (p.stun ?? 0) - dt;
    const run = inp.down('run');
    const want = p.stun > 0 ? 0 : (run ? 118 : 74);
    const mx = inp.move.x, my = inp.move.y, mag = Math.min(1, Math.hypot(mx, my));
    const tvx = mag > 0.1 ? mx * want : 0, tvy = mag > 0.1 ? my * want : 0;
    const acc = Math.min(1, dt * (mag > 0.1 ? 14 : 18));
    p.vx += (tvx - p.vx) * acc; p.vy += (tvy - p.vy) * acc;
    if (inp.pressed('dodge') && p.roll <= 0) {
      const dx = mag > 0.1 ? mx : ({ down: 0, up: 0, left: -1, right: 1 }[p.dir]), dy = mag > 0.1 ? my : ({ down: 1, up: -1, left: 0, right: 0 }[p.dir]);
      p.kx += dx * 260; p.ky += dy * 260; p.roll = 0.5; p.iframes = 0.3;
      if (this.lead?.alive) { const l = this.lead; l.kx += dx * 300; l.ky += dy * 300; l.iframes = 0.36; l.play('Hop'); }
      this.combat.onDodge(this.lead?.alive ? this.lead : p);
    }
    p.roll -= dt;
    p.x += (p.vx + p.kx) * dt; p.y += (p.vy + p.ky) * dt;
    p.kx *= 1 - Math.min(1, dt * 8); p.ky *= 1 - Math.min(1, dt * 8);
    this.map.resolve(p, p.r);
    p.speed = Math.hypot(p.vx, p.vy);
    if (p.speed > 10) p.dir = dir4(p.vx, p.vy);
    const step = p.speed > 10 ? Math.floor(p.t * (run ? 11 : 7.5)) % 4 : 0;
    p.body.texture = (run && p.speed > 90 ? p.frames.run : p.frames.walk ?? p.frames)[p.dir][step];
    p.body.alpha = p.iframes > 0 && Math.sin(p.t * 40) > 0 ? 0.5 : 1;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y;
    if (this.map.tallAt(p.x, p.y) && p.speed > 20 && Math.random() < dt * 4) this.fx.emit(p.x, p.y - 2, { color: 0x5aa84e, n: 2, speed: 25, size: 3, life: 0.35, add: false, grav: 120, vz: 40 });

    // Pokémon que acompanha: fica ao lado e ataca para onde você mira
    const l = this.lead;
    if (l?.alive) {
      if (l.lock <= 0 && !l.dashing) {
        const back = { down: [-14, -8], up: [14, 10], left: [12, -6], right: [-12, -6] }[p.dir];
        const tx = p.x + back[0], ty = p.y + back[1];
        const dx = tx - l.x, dy = ty - l.y, d = Math.hypot(dx, dy);
        if (d > 260) { l.x = tx; l.y = ty; }
        const sp = d > 6 ? Math.min(d * 5, Math.max(p.speed * 1.1, 60)) : 0;
        l.vx = d > 0.1 ? dx / d * sp : 0; l.vy = d > 0.1 ? dy / d * sp : 0;
        if (sp > 0) l.face(dx, dy); else if (p.speed < 5) l.face(p.dir === 'left' ? -1 : p.dir === 'right' ? 1 : 0, p.dir === 'up' ? -1 : p.dir === 'down' ? 1 : 0);
      } else { l.vx = 0; l.vy = 0; }
      for (let s = 0; s < 4; s++) if (inp.pressed('m' + s)) { const a = this.#aimPoint(); this.combat.use(l, s, a.x, a.y); }
    }
    if (inp.pressed('ball')) { const a = this.#aimPoint(); this.throwBall(a.x, a.y); }
    if (inp.pressed('swap')) this.swap();
  }

  #updateWild(dt) {
    this.spawnT -= dt;
    const p = this.player;
    if (this.spawnT <= 0 && this.wilds.filter((w) => w.alive).length < 10) { this.spawnT = 1.2; this.spawnWild(); }
    for (const w of this.wilds) {
      if (!w.alive || w.busy) { w.vx = w.vy = 0; continue; }
      if (w.stun > 0 || w.lock > 0) { w.vx = w.vy = 0; continue; }
      const v = w.think(dt); w.vx = v.vx; w.vy = v.vy;
      if (Math.hypot(v.vx, v.vy) > 1) w.face(v.vx, v.vy);
      if (Math.hypot(w.x - p.x, w.y - p.y) > 44 * T) { w.dead = true; this.removeEntity(w); }
    }
  }

  // ninguém atravessa ninguém
  #crowd() {
    const list = [this.player, ...this.entities.filter((e) => e.alive && !e.busy)];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.r + b.r) * 0.85;
      if (d > 0.01 && d < m) {
        const push = (m - d) / 2, nx = dx / d, ny = dy / d;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      }
    }
  }

  #camera(dt) {
    const p = this.camFocus?.() ?? this.player, c = this.cam;
    c.x += (p.x - c.x) * Math.min(1, dt * 8); c.y += (p.y - c.y) * Math.min(1, dt * 8);
    let sx = 0, sy = 0;
    if (this.fx.shake > 0) { this.fx.shake -= dt; const k = this.fx.shake * 6; sx = (Math.random() - 0.5) * k; sy = (Math.random() - 0.5) * k; }
    const z = this.zoom;
    this.world.x = Math.round(innerWidth / 2 - (c.x + sx) * z);
    this.world.y = Math.round(innerHeight / 2 - (c.y + sy) * z);
    const hw = innerWidth / 2 / z + 40, hh = innerHeight / 2 / z + 40;
    this.map.cullChunks({ x0: c.x - hw, x1: c.x + hw, y0: c.y - hh, y1: c.y + hh });
    // objetos fora da tela não são desenhados
    for (const o of this.map.objects) if (o.sprite && !o.dead) o.sprite.visible = Math.abs(o.x - c.x) < hw && Math.abs(o.y - c.y) < hh + 40;
    const area = this.map.areaName(p.x, p.y);
    if (area !== this.area) { this.area = area; const el = $('area'); el.textContent = area; el.classList.add('on'); clearTimeout(this.areaT); this.areaT = setTimeout(() => el.classList.remove('on'), 2500); }
  }

  // ---------- HUD ----------
  hudInit() { this.hudLead(); this.hudMoves(); }
  hudLead() {
    const m = this.party[this.leadIdx]; if (!m) return;
    const k = m.hp / m.stats.hp;
    $('lead').innerHTML = `<div class="nm"><span>${m.name}</span><span>Nv. ${m.level}</span></div>
      <div class="bar"><i class="${k < 0.2 ? 'low' : k < 0.5 ? 'mid' : ''}" style="width:${k * 100}%"></i></div>
      <div class="party">${this.party.map((p, i) => `<b class="${p.fainted ? 'ko' : ''} ${i === this.leadIdx ? 'cur' : ''}"></b>`).join('')}</div>`;
  }
  hudMoves() {
    const m = this.party[this.leadIdx]; if (!m) return;
    const keys = IS_TOUCH ? ['', '', '', ''] : ['1 / clique', '2 / dir.', '3', '4'];
    $('moves').innerHTML = IS_TOUCH ? '' : m.moves.map((id, i) => { const mv = MOVES[id]; return `<div class="mv" data-i="${i}"><b>${mv?.name ?? id}</b><small>${TYPE_PT[mv?.type] ?? ''} · ${mv?.power ?? '—'}</small><kbd>${keys[i]}</kbd><div class="cd" style="transform:scaleX(0)"></div></div>`; }).join('');
    for (const b of document.querySelectorAll('.tb.move')) { const mv = MOVES[m.moves[+b.dataset.slot]]; b.textContent = mv?.name ?? ''; b.style.visibility = mv ? 'visible' : 'hidden'; }
  }
  hudUpdate(dt) {
    this.hudT = (this.hudT ?? 0) - dt; if (this.hudT > 0) return; this.hudT = 0.1;
    this.hudLead();
    const l = this.lead; if (!l) return;
    document.querySelectorAll('#moves .mv').forEach((el, i) => { const mv = MOVES[l.mon.moves[i]]; const k = mv ? l.cds[i] / (mv.cd || 1) : 0; el.querySelector('.cd').style.transform = `scaleX(${Math.max(0, k)})`; });
  }
  toast(text) {
    const el = document.createElement('div'); el.textContent = text; $('toasts').prepend(el);
    setTimeout(() => el.remove(), 3200);
    while ($('toasts').children.length > 4) $('toasts').lastChild.remove();
  }
  #perf(dt, ms) {
    const P = (this.perfD ??= { n: 0, t: 0, ms: 0 }); P.n++; P.t += dt; P.ms += ms;
    if (P.t >= 0.5) { if (!$('perf').hidden) $('perf').textContent = `${Math.round(P.n / P.t)} FPS · lógica ${(P.ms / P.n).toFixed(2)} ms · ${this.entities.length} Pokémon · zoom ${this.zoom}x`; P.n = 0; P.t = 0; P.ms = 0; }
  }
}

const g = new Game();
g.init();
addEventListener('pointerdown', () => g.audio?.unlock?.(), { once: true });
addEventListener('keydown', () => g.audio?.unlock?.(), { once: true });
