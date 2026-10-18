import * as PIXI from 'pixi.js';
import { T, TILE } from './tiles.js';
import { SPR, LEAVES, VARAL } from './art.js';
import { KINDS } from './objects.js';
import { Minimap } from './minimap.js';
import { People } from './people.js';
import { itemName } from '../data/items.js';

// Vida do mundo: relógio de dia e noite (tingimento suave + luzes de janela), portas e escadas com fade,
// bichinhos (borboletas, pássaros, peixes, folhas caindo, vaga-lumes), itens brilhando, árvores de frutas,
// placas, mato alto que balança e o minimapa. Exposto no jogo como `game.mundo`.

const ITEM_PT = { potion: 'uma Poção', pokeball: 'uma Poké Bola', oran: 'uma Fruta Oran', pecha: 'uma Fruta Pecha' };
// cor de multiplicação da tela ao longo do dia (hora, cor)
const SKY = [[0, 0x40508e], [4.5, 0x46549a], [5.5, 0x8a7ab0], [6.3, 0xffb898], [7.3, 0xffffff], [16.8, 0xffffff], [18, 0xffc08e], [18.8, 0xd08aa0], [19.8, 0x5a62a6], [21, 0x40508e], [24, 0x40508e]];
const lerpC = (a, b, k) => { const r = (a >> 16) + (((b >> 16) - (a >> 16)) * k), g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * k), bl = (a & 255) + (((b & 255) - (a & 255)) * k); return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl); };

export class WorldLife {
  constructor(g) {
    this.g = g; this.map = g.map;
    this.hour = 9; this.totalHours = 0; this.daySeconds = 20 * 60; // um dia inteiro em 20 minutos
    this.taken = new Set(); this.picked = new Map(); this.visited = new Set();
    // camadas
    this.air = new PIXI.Container(); g.world.addChild(this.air);              // bichinhos voando, folhas
    this.shade = new PIXI.Sprite(PIXI.Texture.WHITE); this.shade.blendMode = 'multiply';
    this.lights = new PIXI.Container(); this.lights.blendMode = 'add';
    this.fade = new PIXI.Sprite(PIXI.Texture.WHITE); this.fade.tint = 0x000000; this.fade.alpha = 0;
    g.app.stage.addChild(this.shade, this.lights, this.fade);
    this.lightPool = []; this.lightT = 0;
    this.critters = []; this.leaves = []; this.sparkles = [];
    this.spawnT = { fly: 0, bird: 4, fish: 2, leaf: 0, firefly: 0 };
    this.#itemsInit();
    this.minimap = new Minimap(g, this);
    this.people = new People(g, this.map, this.map.peopleDefs ?? [], this.map.petDefs ?? []);
    this.signBox = this.#makeSignBox();
    this.warpCool = 0; this.tweens = [];
  }

  // ---------- relógio ----------
  get nightness() { const h = this.hour; return h < 5 || h >= 20 ? 1 : h < 7 ? (7 - h) / 2 : h >= 18 ? (h - 18) / 2 : 0; }
  isNight() { return this.hour >= 19 || this.hour < 6; }
  setHour(h) { this.hour = ((h % 24) + 24) % 24; }
  skyColor() {
    const h = this.hour; let i = 0; while (i < SKY.length - 2 && SKY[i + 1][0] <= h) i++;
    const [h0, c0] = SKY[i], [h1, c1] = SKY[i + 1];
    return lerpC(c0, c1, Math.min(1, (h - h0) / (h1 - h0 || 1)));
  }

  // ---------- quadro ----------
  // paused = menu/diálogo/título abertos: só animação (água, céu, bichinhos), sem interação
  update(dt, paused = false) {
    const g = this.g, p = g.player, map = this.map;
    this.#runTweens(Math.min(dt, 0.05));
    const dh = dt * 24 / this.daySeconds; this.hour = (this.hour + dh) % 24; this.totalHours += dh;
    this.berryT = (this.berryT ?? 0) - dt; if (this.berryT <= 0) { this.berryT = 1; this.#berries(); }
    this.windT = (this.windT ?? 0) - dt; if (this.windT <= 0) { this.windT = 0.45; this.windF = 1 - (this.windF ?? 0); for (const c of map.visible) for (const o of c.objs) if (KINDS[o.kind]?.anim === 'varal' && o.sprite) o.sprite.texture = VARAL[this.windF]; }
    map.update(dt);
    const room = map.interiorAt(p.x, p.y);
    // tingimento: fora segue o céu; dentro de casa fica claro; na gruta é escuro
    const sky = room ? (room.dark ? 0x4a4250 : 0xfff6ea) : this.skyColor();
    this.shade.tint = sky; this.shade.width = innerWidth; this.shade.height = innerHeight;
    this.shade.visible = sky !== 0xffffff; // de dia não desenha a camada de tela cheia à toa
    this.shade.visible = sky !== 0xffffff;
    this.fade.width = innerWidth; this.fade.height = innerHeight;
    this.lights.position.copyFrom(g.world.position); this.lights.scale.copyFrom(g.world.scale);
    this.#updateLights(dt, room);
    this.#critters(dt, room);
    this.people.update(dt, paused);
    this.#smoke(dt, room);
    if (!paused) {
      this.#rustle(dt);
      this.#items(dt);
      this.#warps(dt);
      this.#interact();
      this.#gates(dt);
      this.#push(dt);
    }
    // setores visitados (mapa da região)
    if (!room) { const cx = Math.floor(p.x / T / 16), cy = Math.floor(p.y / T / 16); if (cx + cy * 64 !== this.lastSector) { this.lastSector = cx + cy * 64; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) this.visited.add(cx + i + (cy + j) * 64); } }
    this.minimap.update(dt);
  }

  // luzes de janela e postes, só nos setores visíveis
  #updateLights(dt, room) {
    const k = room ? (room.dark ? 1 : 0) : this.nightness;
    this.lights.visible = k > 0.02;
    if (!this.lights.visible) return;
    this.lightT -= dt;
    if (this.lightT <= 0) {
      this.lightT = 0.4;
      let n = 0;
      const use = (x, y, tex, s, a) => { let sp = this.lightPool[n]; if (!sp) { sp = new PIXI.Sprite(); sp.anchor.set(0.5); this.lightPool.push(sp); this.lights.addChild(sp); } sp.visible = true; sp.texture = tex; sp.x = x; sp.y = y; sp.scale.set(s); sp.baseA = a; n++; };
      if (room?.dark) use(this.g.player.x, this.g.player.y - 10, SPR.glow, 2.6, 0.55);
      for (const c of this.map.visible) for (const o of c.objs) {
        const K = KINDS[o.kind]; if (!K.lights || o.dead) continue;
        const sp = o.sprite; if (!sp) continue;
        const left = sp.x - sp.width / 2, top = sp.y - sp.height;
        for (const [lx, ly, big] of K.lights) {
          // qualidade baixa: só a janela acesa, sem o halo grande (src/engine/quality.js)
          if (big) { if (!this.lowLights) use(left + lx, top + ly, SPR.glow, 1.1 * big, 0.9); else use(left + lx, top + ly, SPR.glow, 0.7 * big, 0.7); }
          else { use(left + lx, top + ly, SPR.winlight, 1, 0.95); if (!this.lowLights) use(left + lx, top + ly + 6, SPR.glow, 0.65, 0.5); }
        }
      }
      for (let i = n; i < this.lightPool.length; i++) this.lightPool[i].visible = false;
    }
    const flick = 0.92 + Math.sin(this.map.time * 9) * 0.04;
    for (const sp of this.lightPool) if (sp.visible) sp.alpha = sp.baseA * k * flick;
  }

  // mato alto balança quando alguém passa; Pokémon dentro dele levantam folhinhas
  #rustle(dt) {
    const g = this.g, list = [g.player, ...g.entities];
    for (const e of list) {
      if (!e || e.dead) continue;
      const sp = Math.hypot(e.vx || 0, e.vy || 0);
      if (sp > 12 && this.map.tallAt(e.x, e.y)) this.map.rustle(e.x, e.y, sp > 90 ? 0.6 : 0.45);
    }
  }

  // ---------- portas, tapetes e escadas ----------
  #warps(dt) {
    const g = this.g, p = g.player, inp = g.input;
    this.warpCool -= dt;
    if (this.warping || this.warpCool > 0) return;
    const tx = Math.floor(p.x / T), ty = Math.floor((p.y - 2) / T);
    const w = this.map.warpAt.get(tx + ty * this.map.w);
    if (!w) return;
    const mv = inp?.move ?? { x: 0, y: 0 };
    const goingUp = p.vy < -8 || mv.y < -0.4, goingDown = p.vy > 8 || mv.y > 0.4;
    if (w.dir === 'up' && !goingUp) return;
    if (w.dir === 'down' && !goingDown) return;
    this.warpTo(w.to.x, w.to.y, w.face);
  }
  // teleporte com fade (também serve para a história levar o jogador a um ponto)
  warpTo(tx, ty, face = 'down', onArrive) {
    const g = this.g, p = g.player;
    this.warping = true; p.stun = 0.6; g.audio?.sfx?.('dodge');
    this.#tween(0.22, (k) => { this.fade.alpha = k; }, () => {
      p.x = tx * T + 8; p.y = ty * T + 12; p.vx = p.vy = p.kx = p.ky = 0; p.dir = face;
      if (g.lead?.alive) { const b = { down: [0, -14], up: [0, 14], left: [14, 0], right: [-14, 0] }[face]; g.lead.x = p.x + b[0]; g.lead.y = p.y + b[1]; g.lead.vx = g.lead.vy = 0; }
      if (g.cam) { g.cam.x = p.x; g.cam.y = p.y; }
      for (const w of g.wilds ?? []) if (w.alive && Math.hypot(w.x - p.x, w.y - p.y) > 30 * T) { w.dead = true; g.removeEntity?.(w); }
      this.warpCool = 0.5; this.lightT = 0;
      onArrive?.();
      this.#tween(0.28, (k) => { this.fade.alpha = 1 - k; }, () => { this.warping = false; });
    });
  }
  // fade simples para cenas da história
  fadeOut(t = 0.3, cb) { this.#tween(t, (k) => { this.fade.alpha = Math.max(this.fade.alpha, k); }, cb); }
  fadeIn(t = 0.3, cb) { const a0 = this.fade.alpha; this.#tween(t, (k) => { this.fade.alpha = a0 * (1 - k); }, cb); }
  // animações curtas movidas pelo próprio quadro do jogo (não dependem de requestAnimationFrame)
  #tween(dur, step, done) { const tw = { t: 0, dur, step, done }; step(0); this.tweens.push(tw); return tw; }
  #runTweens(dt) {
    for (const tw of this.tweens.slice()) {
      tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.step(k);
      if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.done?.(); }
    }
  }

  // ---------- itens no chão ----------
  #itemsInit() {
    this.itemSprites = [];
    for (const it of this.map.items) {
      const s = new PIXI.Sprite(SPR.itemball); s.anchor.set(0.5, 1); s.x = it.x * T + 8; s.y = it.y * T + 13; s.zIndex = s.y - 2; s.it = it; s.key = `${it.x},${it.y}`;
      if (it.hidden) s.alpha = 0; // item escondido: só um brilho de vez em quando, bem de perto
      const sp = new PIXI.Sprite(SPR.sparkle); sp.anchor.set(0.5); sp.blendMode = 'add'; s.sparkle = sp; sp.x = s.x + 3; sp.y = s.y - 9;
      this.itemSprites.push(s);
    }
  }
  #items(dt) {
    const g = this.g, p = g.player, t = this.map.time;
    for (const s of this.itemSprites) {
      if (this.taken.has(s.key)) { if (s.parent) { s.parent.removeChild(s); s.sparkle.parent?.removeChild(s.sparkle); } continue; }
      const near = Math.abs(s.x - p.x) < 260 && Math.abs(s.y - p.y) < 200;
      if (near && !s.parent) { g.ents.addChild(s); this.air.addChild(s.sparkle); }
      if (!near && s.parent) { s.parent.removeChild(s); this.air.removeChild(s.sparkle); }
      if (!near) continue;
      const ph = (t * 0.9 + s.x * 0.013) % 2.2; s.sparkle.alpha = ph < 0.5 ? Math.sin(ph / 0.5 * Math.PI) : 0; s.sparkle.scale.set(0.6 + s.sparkle.alpha * 0.6);
      if (s.it.hidden) { const d = Math.hypot(s.x - p.x, s.y - p.y); s.sparkle.alpha *= d < 56 ? 0.75 : 0; s.sparkle.y = s.y - 4; }
      if (Math.hypot(s.x - p.x, s.y - 4 - p.y) < 10) {
        this.taken.add(s.key);
        const item = s.it.item, n = s.it.n ?? 1; g.bag[item] = (g.bag[item] ?? 0) + n; g.missoes?.evento('item', { item, n, x: s.it.x, y: s.it.y });
        g.toast(`Você encontrou ${s.it.hidden ? 'algo escondido: ' : ''}${(n === 1 && ITEM_PT[item]) || (n > 1 ? n + '× ' : '') + itemName(item)}!`); g.audio?.sfx?.('levelup');
        g.fx?.emit(s.x, s.y - 6, { color: 0xfff27a, n: 10, speed: 40, size: 3, life: 0.5, vz: 40 });
        g.hudMoves?.();
      }
    }
  }

  // ---------- ginásio de Campina: porteiras abrem quando o aprendiz é vencido; fardos empurráveis ----------
  #gates(dt) {
    this.gateT = (this.gateT ?? 0) - dt; if (this.gateT > 0) return; this.gateT = 0.5;
    const tr = this.g.flags?.trainers ?? {};
    for (const o of this.map.objects) {
      if (!o.opens || o.dead || !tr[o.opens]) continue;
      this.map.removeObject(o);
      const s = o.sprite;
      if (s) this.#tween(0.6, (k) => { s.alpha = 1 - k; s.y = o.y + 1 - k * 6; }, () => { s.parent?.removeChild(s); s.destroy(); o.sprite = null; });
      this.g.toast?.('Uma porteira do milharal se abriu!'); this.g.audio?.sfx?.('pop');
    }
  }
  #push(dt) {
    const g = this.g, p = g.player, mv = g.input?.move ?? { x: 0, y: 0 };
    const d = Math.abs(mv.x) > 0.5 ? [Math.sign(mv.x), 0] : Math.abs(mv.y) > 0.5 ? [0, Math.sign(mv.y)] : null;
    if (!d || this.warping) { this.pushT = 0; return; }
    const ax = Math.floor((p.x + d[0] * 10) / T), ay = Math.floor((p.y - 3 + d[1] * 10) / T);
    const o = this.map.cellObj.get(ax + ay * this.map.w);
    if (!o || o.dead || !KINDS[o.kind]?.push) { this.pushT = 0; return; }
    this.pushT = (this.pushT ?? 0) + dt;
    if (this.pushT < 0.3) return;
    this.pushT = 0;
    const x0 = o.sprite?.x, y0 = o.sprite?.y;
    if (this.map.moveObject(o, d[0], d[1])) {
      g.audio?.sfx?.('dodge');
      const s = o.sprite; if (s) this.#tween(0.2, (k) => { s.x = x0 + d[0] * T * k; s.y = y0 + d[1] * T * k; });
    }
  }

  // ---------- interação: placas e árvores de frutas (tecla E / botão A) ----------
  #interact() {
    const g = this.g, inp = g.input, p = g.player;
    if (this.signBox.open && (inp.pressed('act') || Math.hypot(p.x - this.signBox.x, p.y - this.signBox.y) > 40)) { this.closeSign(); return; }
    const f = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[p.dir] ?? [0, 1];
    const ax = p.x + f[0] * 14, ay = p.y - 4 + f[1] * 14;
    let best = null, bd = 22;
    for (const c of this.map.visible) for (const o of c.objs) {
      if (o.dead || !(o.text || o.berry || o.kind === 'pc')) continue;
      const d = Math.hypot(o.x - ax, o.y - 8 - ay); if (d < bd + (o.berry ? 10 : 0)) { bd = d; best = o; }
    }
    const who = this.people.nearest(p.x, p.y, p.dir);
    const hud = g.ui?.hud;
    // balão "E · Falar" (só quando a história não mostrou o dela neste quadro)
    if (hud?.setPrompt && (!hud.bubble?.visible || this.ownPrompt)) {
      if (who) hud.setPrompt({ x: who.o.x, y: who.o.y, h: 30 }, who.kind === 'pet' ? 'Brincar' : 'Falar');
      else if (best) hud.setPrompt({ x: best.x, y: best.y - 8, h: 24 }, best.berry ? 'Sacudir' : best.kind === 'pc' ? 'Usar o PC' : best.kind === 'sign' ? 'Ler' : 'Ver');
      else if (this.ownPrompt) hud.setPrompt(null);
      this.ownPrompt = !!(who || best);
    }
    if (!inp.pressed('act')) return;
    if (who) { inp.taps.delete('act'); this.people.talk(who); return; }
    if (!best) return;
    inp.taps.delete('act');
    if (best.kind === 'pc' && !best.text) { g.audio?.sfx?.('blip'); g.ui?.openPC?.(); return; }
    if (best.berry) this.#shake(best);
    else this.showSign(best.text, best.x, best.y, best.kind === 'sign' ? 'Placa' : '');
  }
  #shake(o) {
    const g = this.g, key = `${o.tx},${o.ty}`, last = this.picked.get(key);
    const s = o.sprite;
    this.#tween(0.35, (k) => { s.skew.x = Math.sin(k * 20) * 0.06 * (1 - k); }, () => { s.skew.x = 0; });
    g.audio?.sfx?.('shake');
    if (last !== undefined && this.totalHours - last < 6) { g.toast('A árvore ainda não deu frutos novos.'); return; }
    this.picked.set(key, this.totalHours);
    s.texture = SPR.bigtree;
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const b = new PIXI.Sprite(SPR.berry[o.berry]); b.anchor.set(0.5); b.x = o.x + (Math.random() - 0.5) * 26; b.y = o.y - 30; this.air.addChild(b);
      const y0 = b.y, y1 = o.y + 4 + Math.random() * 6;
      this.#tween(0.45 + Math.random() * 0.2, (k) => { b.y = y0 + (y1 - y0) * k * k; }, () => this.#tween(0.7, (k) => { b.alpha = 1 - k; }, () => b.destroy()));
    }
    g.bag[o.berry] = (g.bag[o.berry] ?? 0) + n;
    g.toast(`Caíram ${n} ${o.berry === 'oran' ? (n > 1 ? 'Frutas Oran' : 'Fruta Oran') : (n > 1 ? 'Frutas Pecha' : 'Fruta Pecha')}!`);
  }
  // árvores colhidas ficam sem fruta por 6 horas do jogo
  #berries() {
    for (const c of this.map.visible) for (const o of c.objs) {
      if (!o.berry || !o.sprite) continue;
      const last = this.picked.get(`${o.tx},${o.ty}`);
      const empty = last !== undefined && this.totalHours - last < 6;
      o.sprite.texture = empty ? SPR.bigtree : SPR[o.kind];
    }
  }

  #makeSignBox() {
    const el = document.createElement('div');
    el.id = 'placa';
    el.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);max-width:min(560px,92vw);background:#fbf6e8;border:3px solid #4a3a2a;border-radius:10px;padding:10px 14px;font:700 15px/1.35 "Avenir Next",Nunito,system-ui,sans-serif;color:#2a2018;white-space:pre-line;box-shadow:0 4px 0 rgba(0,0,0,.25);z-index:30;display:none;pointer-events:none';
    document.body.appendChild(el);
    return { el, open: false, x: 0, y: 0 };
  }
  showSign(text, x, y, name = 'Placa') {
    if (this.g.ui?.say) { this.g.ui.say(text.split('\n'), { name }); return; }
    const b = this.signBox; b.el.textContent = text; b.el.style.display = 'block'; b.open = true; b.x = x ?? this.g.player.x; b.y = y ?? this.g.player.y;
    clearTimeout(b.t); b.t = setTimeout(() => this.closeSign(), 6000);
  }
  closeSign() { const b = this.signBox; b.el.style.display = 'none'; b.open = false; }

  // ---------- fumaça das chaminés ----------
  #smoke(dt, room) {
    if (room) return;
    this.smokeT = (this.smokeT ?? 0) - dt; if (this.smokeT > 0) return; this.smokeT = 0.45;
    for (const c of this.map.visible) for (const o of c.objs) {
      const K = KINDS[o.kind]; if (!K.smoke || !o.sprite) continue;
      const sp = o.sprite, x = sp.x - sp.width / 2 + K.smoke[0], y = sp.y - sp.height + K.smoke[1];
      const s = this.#sprite(SPR.puff, x + (Math.random() - 0.5) * 3, y); s.kind = 'smoke'; s.life = 2.6; s.vx = 4 + Math.random() * 3; s.vy = -9; s.alpha = 0.7;
    }
  }

  // ---------- bichinhos ----------
  #critters(dt, room) {
    const g = this.g, p = g.player, map = this.map, night = this.nightness > 0.6, t = map.time;
    const view = map.view; if (!view) return;
    const biome = room ? 'interior' : map.biome(p.x, p.y);
    const S = this.spawnT; for (const k in S) S[k] -= dt;
    const count = (kind) => this.critters.filter((c) => c.kind === kind).length;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const onScreen = () => ({ x: rnd(view.x0 + 30, view.x1 - 30), y: rnd(view.y0 + 30, view.y1 - 30) });
    if (!room) {
      // borboletas de dia nos campos e vilas
      if (!night && S.fly <= 0 && count('fly') < 6 && biome !== 'praia') {
        S.fly = 1.5; const q = onScreen(); const tt = map.at(Math.floor(q.x / T), Math.floor(q.y / T));
        if ([TILE.GRASS, TILE.GRASS2, TILE.FLOWERS, TILE.TALL].includes(tt)) { const c = this.#sprite(SPR.butterfly[Math.floor(Math.random() * 4)][0], q.x, q.y); c.kind = 'fly'; c.col = Math.floor(Math.random() * 4); c.vx = rnd(-12, 12); c.vy = rnd(-8, 8); c.h = rnd(6, 16); c.life = rnd(12, 25); }
      }
      // vaga-lumes à noite
      if (night && S.firefly <= 0 && count('ff') < 14 && biome !== 'praia') {
        S.firefly = 0.5; const q = onScreen(); const c = this.#sprite(SPR.firefly, q.x, q.y); c.blendMode = 'add'; c.kind = 'ff'; c.vx = rnd(-6, 6); c.vy = rnd(-6, 6); c.h = rnd(4, 18); c.life = rnd(6, 12); c.ph = Math.random() * 6;
        this.lights.addChild(c); this.air.removeChild(c);
      }
      // revoada de pássaros cruzando a tela (com sombra no chão)
      if (!night && S.bird <= 0) {
        S.bird = rnd(9, 18); const n = 2 + Math.floor(Math.random() * 3), dir = Math.random() < 0.5 ? 1 : -1;
        const y0 = rnd(view.y0 + 20, view.y1 - 60), x0 = dir > 0 ? view.x0 - 30 : view.x1 + 30;
        for (let i = 0; i < n; i++) {
          const c = this.#sprite(SPR.bird[0], x0 - dir * i * 16, y0 + (i % 2) * 10 + i * 4); c.kind = 'bird'; c.vx = dir * rnd(70, 85); c.vy = rnd(-6, 6); c.h = 50; c.scale.x = dir; c.life = 14; c.ph = Math.random() * 6;
          c.shadow = new PIXI.Sprite(g.tx.shadow); c.shadow.anchor.set(0.5); c.shadow.scale.set(0.5); c.shadow.alpha = 0.5; this.air.addChildAt(c.shadow, 0);
        }
      }
      // peixes pulando na água visível
      if (S.fish <= 0) {
        S.fish = rnd(1.2, 3);
        for (let k = 0; k < 8; k++) {
          const q = onScreen(), tt = map.at(Math.floor(q.x / T), Math.floor(q.y / T));
          if (tt !== TILE.WATER && tt !== TILE.DEEP) continue;
          if (map.at(Math.floor(q.x / T) + 1, Math.floor(q.y / T)) !== tt) continue;
          const c = this.#sprite(SPR.fish, q.x, q.y); c.kind = 'fish'; c.t0 = 0; c.dir = Math.random() < 0.5 ? 1 : -1; c.scale.x = -c.dir; c.life = 0.9; c.x0 = q.x; c.y0 = q.y;
          this.#ripple(q.x, q.y); break;
        }
      }
      // folhas caindo das árvores (mais no bosque)
      if (S.leaf <= 0) {
        S.leaf = biome === 'floresta' ? 0.25 : 1.2;
        const trees = []; for (const c of map.visible) for (const o of c.objs) if (!o.dead && o.sprite && KINDS[o.kind]?.fw === 2 && /tree|pine|autumn/.test(o.kind)) trees.push(o);
        if (trees.length) {
          const o = trees[Math.floor(Math.random() * trees.length)], au = /autumn/.test(o.kind);
          const c = this.#sprite(LEAVES[Math.floor(Math.random() * LEAVES.length)], o.x + rnd(-12, 12), o.y - rnd(24, 40)); c.kind = 'leaf'; c.vy = rnd(10, 16); c.vx = rnd(-4, 4); c.life = rnd(2.5, 4); c.ph = Math.random() * 6; c.ground = o.y + rnd(2, 14);
          if (au) c.tint = 0xffa040; c.scale.set(0.8);
        }
      }
    }
    // atualiza
    for (const c of this.critters) {
      c.life -= dt; c.age = (c.age ?? 0) + dt;
      switch (c.kind) {
        case 'fly': {
          c.vx += (Math.random() - 0.5) * 60 * dt; c.vy += (Math.random() - 0.5) * 60 * dt; c.vx = Math.max(-18, Math.min(18, c.vx)); c.vy = Math.max(-12, Math.min(12, c.vy));
          if (Math.hypot(c.wx - p.x, c.wy - p.y) < 22) { c.vx += (c.wx - p.x) * dt * 6; c.vy += (c.wy - p.y) * dt * 6; }
          c.wx += c.vx * dt; c.wy += c.vy * dt; c.texture = SPR.butterfly[c.col][Math.floor(c.age * 9) % 2];
          c.x = c.wx; c.y = c.wy - c.h - Math.sin(c.age * 3) * 3; break;
        }
        case 'ff': { c.wx += c.vx * dt + Math.sin(c.age * 1.3 + c.ph) * 0.3; c.wy += c.vy * dt; c.x = c.wx; c.y = c.wy - c.h; c.alpha = 0.4 + 0.6 * Math.max(0, Math.sin(c.age * 2.4 + c.ph)); break; }
        case 'bird': {
          c.wx += c.vx * dt; c.wy += c.vy * dt; c.texture = SPR.bird[Math.floor(c.age * 8 + c.ph) % 2];
          c.x = c.wx; c.y = c.wy - c.h; c.shadow.x = c.wx; c.shadow.y = c.wy; break;
        }
        case 'fish': {
          const k = c.age / 0.9; c.x = c.x0 + c.dir * k * 14; c.y = c.y0 - Math.sin(k * Math.PI) * 14; c.rotation = c.dir * (k - 0.5) * 1.6;
          if (k >= 1 && !c.splashed) { c.splashed = true; this.#ripple(c.x, c.y0); g.fx?.emit(c.x, c.y0, { color: 0xdff4ff, n: 6, speed: 30, size: 2, life: 0.4, vz: 50, grav: 200, add: false }); c.life = 0; }
          break;
        }
        case 'leaf': {
          c.wx += (c.vx + Math.sin(c.age * 3 + c.ph) * 10) * dt; c.wy += c.vy * dt; c.rotation = Math.sin(c.age * 3 + c.ph) * 0.8;
          c.x = c.wx; c.y = c.wy; if (c.wy >= c.ground) { c.vy = 0; c.vx = 0; c.alpha = Math.min(1, c.life); } break;
        }
        case 'ripple': { const k = c.age / 0.8; c.scale.set(0.4 + k * 0.9); c.alpha = 1 - k; break; }
        case 'smoke': { c.wx += c.vx * dt; c.wy += c.vy * dt; c.x = c.wx; c.y = c.wy; const k = c.age / 2.6; c.scale.set(0.5 + k * 1.3); c.alpha = 0.65 * (1 - k); break; }
      }
      if (c.kind !== 'ripple' && c.kind !== 'smoke' && (Math.abs(c.wx - p.x) > 520 || Math.abs(c.wy - p.y) > 400)) c.life = 0;
    }
    for (const c of this.critters) if (c.life <= 0) { c.shadow?.destroy(); c.destroy(); }
    this.critters = this.critters.filter((c) => c.life > 0);
  }
  #sprite(tex, x, y) { const s = new PIXI.Sprite(tex); s.anchor.set(0.5); s.wx = x; s.wy = y; s.x = x; s.y = y; this.air.addChild(s); this.critters.push(s); return s; }
  #ripple(x, y) { const r = this.#sprite(SPR.ripple, x, y + 1); r.kind = 'ripple'; r.life = 0.8; this.air.addChildAt(r, 0); }

  // ---------- estado salvo e mapa da região ----------
  saveState() { return { hour: this.hour, totalHours: this.totalHours, taken: [...this.taken], visited: [...this.visited], picked: [...this.picked] }; }
  loadState(s) { if (!s) return; this.hour = s.hour ?? this.hour; this.totalHours = s.totalHours ?? 0; this.taken = new Set(s.taken ?? []); this.visited = new Set(s.visited ?? []); this.picked = new Map(s.picked ?? []); }
  renderRegionMap(canvas, opts) { return this.minimap.renderRegionMap(canvas, opts); }
  get spots() { return this.map.spots; }
}
