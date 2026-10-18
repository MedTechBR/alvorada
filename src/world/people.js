import * as PIXI from 'pixi.js';
import { T } from './tiles.js';
import { Npc } from '../story/npc.js';
import { loadPokemonSprites, frameOf, dir8 } from '../sprites/pmd.js';
import { speciesScale } from '../sprites/scale.js';
import { SPECIES } from '../data/species.js';

// Moradores e Pokémon das cidades: andam pela vizinhança, falam (dicas e humor) e dão vida às vilas.
// Dados em assets/maps/alvorada.json: "people" (moradores) e "pets" (Pokémon passivos), também dentro dos interiores.
// Morador: { id, name, look, x, y, dir, wander (blocos), lines: [...], heal?: true }
// Pokémon: { dex, x, y, wander, perch?: true (no telhado), say: 'Piu!' }

const NEAR = 30 * T; // só anima quem está perto da câmera

export class People {
  constructor(g, map, defs, pets) {
    this.g = g; this.map = map;
    this.list = defs.map((d) => this.#resident(d)).filter(Boolean);
    this.pets = pets.map((d) => this.#pet(d));
  }

  #resident(d) {
    const g = this.g;
    let n;
    try { n = new Npc(g, { id: d.id, name: d.name, look: d.look ?? 'menino', x: d.x * T + 8, y: d.y * T + 10, dir: d.dir ?? 'down' }); }
    catch (e) { console.warn('morador', d.id, e); return null; }
    n.def = d; n.wanderT = 1 + Math.random() * 3; n.talking = false;
    return n;
  }

  #pet(d) {
    const g = this.g;
    const view = new PIXI.Container();
    const shadow = new PIXI.Sprite(g.tx.shadow); shadow.anchor.set(0.5); shadow.alpha = d.perch ? 0 : 0.8;
    const body = new PIXI.Sprite(); body.anchor.set(0.5, 1);
    view.addChild(shadow, body); view.visible = false;
    g.ents.addChild(view);
    const p = { d, view, body, shadow, x: d.x * T + 8, y: d.y * T + 10, home: { x: d.x * T + 8, y: d.y * T + 10 }, vx: 0, vy: 0, dir: 2, t: Math.random() * 3, anim: 'Idle', wanderT: 2, z: d.z ?? 0, r: 5 };
    loadPokemonSprites(d.dex).then((set) => { p.set = set; p.scale = speciesScale(d.dex, set) * (d.scale ?? 1); shadow.scale.set(...(set.shadowScale ?? [0.8, 0.8])); }).catch(() => {});
    return p;
  }

  update(dt, paused) {
    const g = this.g, pl = g.player;
    for (const n of this.list) {
      const near = Math.abs(n.x - pl.x) < NEAR && Math.abs(n.y - pl.y) < NEAR;
      n.view.visible = near;
      if (!near) continue;
      if (!paused && !n.talking && n.def.wander) {
        n.wanderT -= dt;
        if (n.wanderT <= 0 && !n.walk) {
          n.wanderT = (n.def.kid ? 1 : 2.5) + Math.random() * 3;
          const R = n.def.wander * T, a = Math.random() * Math.PI * 2, r = Math.random() * R;
          const tx = n.home.x + Math.cos(a) * r, ty = n.home.y + Math.sin(a) * r;
          if (!this.map.solidAt(tx, ty) && Math.hypot(tx - pl.x, ty - pl.y) > 14) n.walkTo(tx, ty, n.def.kid ? 70 : 34);
        }
      }
      n.update(dt);
    }
    for (const p of this.pets) this.#updatePet(p, dt, paused);
  }

  #updatePet(p, dt, paused) {
    const g = this.g, pl = g.player;
    const near = Math.abs(p.x - pl.x) < NEAR && Math.abs(p.y - pl.y) < NEAR;
    p.view.visible = near && !!p.set; if (!p.view.visible) return;
    p.t += dt;
    if (!paused && p.d.wander && !p.d.perch) {
      p.wanderT -= dt;
      if (p.wanderT <= 0) {
        p.wanderT = 1.5 + Math.random() * 3.5;
        if (Math.random() < 0.55) { const a = Math.random() * Math.PI * 2, s = 22 + Math.random() * 14; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
        else { p.vx = p.vy = 0; }
      }
      if (Math.hypot(p.x + p.vx * dt - p.home.x, p.y + p.vy * dt - p.home.y) > p.d.wander * T) { p.vx = (p.home.x - p.x) * 0.8; p.vy = (p.home.y - p.y) * 0.8; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      this.map.resolve(p, 5);
    }
    const moving = Math.hypot(p.vx, p.vy) > 4 && !p.d.perch;
    if (moving) p.dir = dir8(p.vx, p.vy);
    p.anim = moving ? 'Walk' : (p.d.sleep && p.set.anims?.Sleep ? 'Sleep' : 'Idle');
    const f = frameOf(p.set, p.anim, p.d.perch ? 0 : p.dir, p.t, true);
    p.body.texture = f.tex; p.body.anchor.set(f.ax ?? 0.5, f.ay ?? 1); p.body.scale.set(p.scale);
    p.body.y = -p.z;
    p.view.x = Math.round(p.x); p.view.y = Math.round(p.y); p.view.zIndex = p.y + (p.d.perch ? 200 : 0);
  }

  // Interação (tecla E / botão A): o morador ou o Pokémon mais perto à frente do jogador
  nearest(px, py, dir) {
    const f = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[dir] ?? [0, 1];
    const ax = px + f[0] * 12, ay = py + f[1] * 12;
    let best = null, bd = 22;
    for (const n of this.list) { if (!n.view.visible) continue; const d = Math.hypot(n.x - ax, n.y - ay); if (d < bd) { bd = d; best = { kind: 'npc', o: n }; } }
    for (const p of this.pets) { if (!p.view.visible || p.d.perch) continue; const d = Math.hypot(p.x - ax, p.y - ay); if (d < bd) { bd = d; best = { kind: 'pet', o: p }; } }
    return best;
  }
  async talk(it) {
    const g = this.g;
    if (it.kind === 'pet') {
      const p = it.o, name = SPECIES[p.d.dex]?.name ?? 'Pokémon';
      p.vx = p.vy = 0; p.wanderT = 2; p.z = 0;
      const t0 = p.t; const hop = () => { const k = p.t - t0; p.z = Math.max(0, Math.sin(k * 12) * 5); if (k < 0.5) requestAnimationFrame(hop); else p.z = 0; }; hop();
      g.toast?.(`${name}: ${p.d.say ?? '!'}`);
      return;
    }
    const n = it.o;
    n.talking = true; n.walk?.res?.(); n.walk = null; n.faceTo(g.player.x, g.player.y);
    const lines = n.def.lines?.length ? n.def.lines : ['…'];
    // fala em sequência: cada conversa mostra a próxima frase (ou todas, se forem curtas)
    const all = n.def.all ?? lines.length <= 2;
    const say = all ? lines : [lines[(n.talkI = ((n.talkI ?? -1) + 1) % lines.length)]];
    await g.ui?.say?.(say, { name: n.def.name ?? '' });
    if (n.def.heal) {
      for (const m of g.party ?? []) m.heal?.();
      g.audio?.sfx?.('heal'); g.toast?.('Seus Pokémon estão curados!'); g.hudLead?.();
    }
    n.talking = false; n.wanderT = 2;
  }
}
