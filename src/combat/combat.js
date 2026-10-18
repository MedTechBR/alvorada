import * as PIXI from 'pixi.js';
import { MOVES } from '../data/moves.js';
import { effectiveness, TYPE_COLOR } from '../data/types.js';

// Combate contínuo no próprio mapa: qualquer Pokémon pode atacar qualquer alvo a qualquer momento.
// Lados: 'ally' (seu time + você) e 'wild'. Golpes de lados opostos se chocam no ar.
const M = 16;            // 1 m (dados do 3D) = 16 px
const DMG = 0.55;        // ritmo do tempo real (o dano dos jogos por turno é alto demais aqui)
const hex = (c) => (typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c ?? 0xffffff);
const typeColor = (t) => hex(TYPE_COLOR?.[t] ?? 0xffffff);

// Quem pode acertar quem. Lados do online (src/net/*): 'rival' = Pokémon de outro jogador num
// duelo PvP (inimigo do seu); 'peer' = Pokémon de outro jogador passeando (ninguém acerta nem é acertado).
// Quem pode acertar quem. ally = você e sua equipe; wild = selvagens; foe = Pokémon de treinador (história);
// rival = Pokémon do outro jogador num duelo online; peer = do outro jogador passeando (ninguém acerta).
export const FOES = { ally: ['wild', 'foe', 'rival'], wild: ['ally'], foe: ['ally'], rival: ['ally'], peer: [] };

// Fórmula de dano (pura). Usada aqui e pelo árbitro do PvP online (src/net/arbiter.js), para os dois
// lados de um duelo calcularem igual. user/t: qualquer objeto com .mon e .stat(k).
export function calcDamage(user, t, mv, rnd = Math.random) {
  const L = user.mon.level, phys = mv.cat === 'phys';
  const A = phys ? user.stat('atk') : user.stat('spa'), D = phys ? t.stat('def') : t.stat('spd');
  const crit = rnd() < 1 / 16;
  let dmg = Math.floor(Math.floor((Math.floor((2 * L) / 5 + 2) * (mv.power ?? 40) * A) / D) / 50) + 2;
  const eff = effectiveness(mv.type, t.mon.types);
  if (user.mon.types.includes(mv.type)) dmg *= 1.5;
  dmg *= eff * (crit ? 1.5 : 1) * (0.85 + rnd() * 0.15) * DMG;
  if (phys && user.mon.status === 'brn') dmg *= 0.5;
  dmg = eff === 0 ? 0 : Math.max(1, Math.round(dmg));
  return { dmg, eff, crit };
}

export class Combat {
  constructor(g) { this.g = g; this.projectiles = []; this.zones = []; this.layer = new PIXI.Container(); this.layer.blendMode = 'add'; }
  move(id) { return MOVES[id]; }
  range(mv) { return (mv.range ?? 6) * M; }
  inRange(user, mv, d) {
    if (mv.kind === 'self') return true;
    if (mv.kind === 'melee' || mv.kind === 'multi') return d < (mv.range ?? 1.8) * M + 10 + user.r;
    if (mv.kind === 'dash') return d < this.range(mv);
    if (mv.kind === 'wave' || mv.kind === 'quake') return d < this.range(mv) * 0.9;
    return d < this.range(mv) * 0.95;
  }
  enemiesOf(e) {
    const f = FOES[e.side];
    if (!f) return this.g.entities.filter((o) => o.alive && o !== e && (e.side === 'wild' ? o.side !== 'wild' : o.side === 'wild'));
    return this.g.entities.filter((o) => o.alive && o !== e && f.includes(o.side));
  }

  // Usa o golpe do espaço `slot` mirando no ponto (ax, ay)
  use(user, slot, ax, ay) {
    const id = user.mon.moves[slot], mv = MOVES[id];
    if (!mv || user.cds[slot] > 0 || user.lock > 0 || user.stun > 0 || !user.alive) return false;
    user.cds[slot] = mv.cd * (user.side === 'wild' ? 1.5 : 1);
    if (user.mon.status === 'par' && Math.random() < 0.15) { this.g.fx.number(user.x, user.y - 24, 'Paralisado!', '#fff27a'); user.lock = 0.5; return true; }
    let dx = ax - user.x, dy = ay - user.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    user.face(dx, dy);
    const g = this.g, color = typeColor(mv.type);
    const melee = mv.kind === 'melee' || mv.kind === 'multi' || mv.kind === 'dash';
    user.play(melee ? 'Attack' : 'Shoot');
    user.lock = melee ? 0.32 : 0.22;
    g.audio?.sfx?.('move-' + mv.kind, mv.type);
    const fire = (fn, delay) => g.later(delay, () => user.alive && fn());
    switch (mv.kind) {
      case 'proj': {
        const n = mv.count ?? 1;
        for (let i = 0; i < n; i++) fire(() => this.#projectile(user, mv, id, dx, dy, color), 0.09 + i * 0.09);
        break;
      }
      case 'melee': case 'multi': {
        const hits = mv.hits ?? (mv.kind === 'multi' ? 3 : 1);
        user.kx += dx * 140; user.ky += dy * 140;   // avança no golpe
        for (let i = 0; i < hits; i++) fire(() => this.#arc(user, mv, id, dx, dy, color, (mv.range ?? 1.8) * M + user.r + 8, 0.9), 0.1 + i * 0.12);
        break;
      }
      case 'dash': {
        user.iframes = 0.25; user.dashHit = new Set();
        fire(() => { user.kx += dx * this.range(mv) * 3.2; user.ky += dy * this.range(mv) * 3.2; user.dashing = { mv, id, t: 0.28, color }; }, 0.06);
        break;
      }
      case 'cone': fire(() => this.#cone(user, mv, id, dx, dy, color), 0.08); break;
      case 'wave': fire(() => this.#wave(user, mv, id, color), 0.1); break;
      case 'quake': fire(() => { this.#wave(user, mv, id, 0xb08850, true); g.fx.kick(0.45, 0.06); }, 0.18); break;
      case 'cloud': case 'rain': {
        const tx = user.x + dx * Math.min(d, this.range(mv)), ty = user.y + dy * Math.min(d, this.range(mv));
        fire(() => this.#zone(user, mv, id, tx, ty, color), 0.15); break;
      }
      case 'self': fire(() => this.#self(user, mv, color), 0.1); break;
      default: fire(() => this.#projectile(user, mv, id, dx, dy, color), 0.1);
    }
    this.onUse?.(user, slot, ax, ay); // gancho do online: avisa os outros jogadores (src/net/online.js)
    return true;
  }

  #projectile(user, mv, id, dx, dy, color) {
    const g = this.g;
    const big = Math.max(1, (mv.power ?? 40) / 55);
    const s = new PIXI.Container();
    const core = new PIXI.Sprite(g.tx.glow); core.anchor.set(0.5); core.tint = 0xffffff; core.scale.set(0.55 * big);
    const halo = new PIXI.Sprite(g.tx.glow); halo.anchor.set(0.5); halo.tint = color; halo.scale.set(1.3 * big);
    s.addChild(halo, core); this.layer.addChild(s);
    // sai da boca (ponto do quadro do sprite); a altura extra (lift) some no começo do voo
    const ep = user.emitPoint?.(mv.cat === 'phys' ? 'hand' : 'mouth');
    const sx = ep ? ep.x + dx * 2 : user.x + dx * (user.r + 4), sy = ep ? ep.y - 8 + dy * 2 : user.y + dy * (user.r + 4) - 8;
    this.projectiles.push({ user, side: user.side, mv, id, x: sx, y: sy, lift: ep ? Math.max(0, ep.h - 8) : 0, vx: dx * (mv.speed ?? 15) * M, vy: dy * (mv.speed ?? 15) * M, left: this.range(mv), s, color, r: 5 * big, power: mv.power ?? 30, big });
  }

  #arc(user, mv, id, dx, dy, color, reach, spread) {
    const g = this.g;
    const cx = user.x + dx * reach * 0.6, cy = user.y + dy * reach * 0.6;
    for (let i = 0; i < 6; i++) { const a = Math.atan2(dy, dx) + (i / 5 - 0.5) * 1.6; g.fx.emit(user.x + Math.cos(a) * reach * 0.8, user.y + Math.sin(a) * reach * 0.8 - 8, { color: 0xffffff, n: 1, speed: 20, size: 4, life: 0.15 }); }
    for (const t of this.enemiesOf(user)) {
      const ex = t.x - user.x, ey = t.y - user.y, d = Math.hypot(ex, ey);
      if (d > reach + t.r) continue;
      if (Math.acos(Math.max(-1, Math.min(1, (ex * dx + ey * dy) / (d || 1)))) > spread + 0.2 && d > t.r + 4) continue;
      this.hit(user, t, mv, id, dx, dy);
    }
    g.fx.burst(cx, cy - 8, color, 0.6);
  }

  #cone(user, mv, id, dx, dy, color) {
    const g = this.g, R = this.range(mv), a0 = Math.atan2(dy, dx);
    for (let i = 0; i < 26; i++) g.fx.emit(user.x + dx * 8, user.y + dy * 8 - 8, { color, n: 1, speed: R * 2.2, life: 0.4, size: 5, dir: a0, spread: 0.9, drag: 1.2 });
    for (const t of this.enemiesOf(user)) {
      const ex = t.x - user.x, ey = t.y - user.y, d = Math.hypot(ex, ey);
      if (d > R + t.r) continue;
      if (Math.abs(Math.atan2(Math.sin(Math.atan2(ey, ex) - a0), Math.cos(Math.atan2(ey, ex) - a0))) > 0.55) continue;
      this.hit(user, t, mv, id, dx, dy);
    }
    // golpes de fogo queimam o mato
    if (mv.type === 'fire') for (let k = 1; k <= 4; k++) g.scorchTile(user.x + dx * R * k / 4, user.y + dy * R * k / 4);
  }

  #wave(user, mv, id, color, ground = false) {
    const g = this.g, R = this.range(mv);
    g.fx.ring(user.x, user.y, color, R / 3, 0.4); g.fx.ring(user.x, user.y, 0xffffff, R / 4, 0.3);
    if (ground) { for (let i = 0; i < 30; i++) g.fx.emit(user.x, user.y, { color: 0x9a7a52, n: 1, speed: R * 2.4, life: 0.5, size: 5, add: false, grav: 300, vz: 120 }); g.fx.scorch(user.x, user.y, R * 0.55, 0x5a4630, 0.35); }
    for (const t of this.enemiesOf(user)) { const d = Math.hypot(t.x - user.x, t.y - user.y); if (d < R + t.r) this.hit(user, t, mv, id, (t.x - user.x) / (d || 1), (t.y - user.y) / (d || 1)); }
  }

  #zone(user, mv, id, x, y, color) {
    this.zones.push({ user, mv, id, x, y, r: 1.6 * M * 1.6, t: mv.kind === 'rain' ? 2.2 : 3, tick: 0, color });
  }

  #self(user, mv, color) {
    const g = this.g, e = mv.eff ?? {};
    g.fx.ring(user.x, user.y - 10, color, 10, 0.5);
    for (let i = 0; i < 12; i++) g.fx.emit(user.x, user.y - 4, { color, n: 1, speed: 25, life: 0.7, size: 4, vz: 60, grav: -40 });
    if (e.stat) { user.stages[e.stat] = Math.max(-6, Math.min(6, (user.stages[e.stat] ?? 0) + (e.by ?? 1))); g.fx.number(user.x, user.y - 30, e.by > 0 ? 'Subiu!' : 'Caiu!', '#9ad0ff'); }
    if (e.teleport) { g.fx.burst(user.x, user.y - 8, 0xff8fd8, 1); const a = Math.random() * 6.28; user.x += Math.cos(a) * 90; user.y += Math.sin(a) * 90; g.map.resolve(user, user.r); g.fx.burst(user.x, user.y - 8, 0xff8fd8, 1); }
  }

  // Dano (fórmula dos jogos, ajustada ao tempo real), recuo, efeitos e reação
  hit(user, t, mv, id, dx = 0, dy = 0) {
    if (!t.alive || t.iframes > 0) return;
    const g = this.g;
    if (t.isTrainer) { t.knock(dx * 220, dy * 220); g.fx.kick(0.25, 0.05); g.fx.burst(t.x, t.y - 10, typeColor(mv.type), 0.7); return; }
    // Gancho do PvP online: golpe entre Pokémon de duelo não tira HP aqui; vira um pedido ao
    // árbitro (src/net/duel.js), que devolve o dano oficial para os dois jogadores.
    if ((t.pvp || user.pvp) && this.onPvpHit) { this.onPvpHit(user, t, mv, id, dx, dy); return; }
    if (mv.cat === 'status') { this.#status(user, t, mv); return; }
    const { dmg, eff, crit } = calcDamage(user, t, mv);
    this.hurt(t, dmg, user, { eff, crit, mv, dx, dy });
    // efeitos secundários
    const e = mv.eff ?? {};
    if (e.status && !t.mon.status && Math.random() < (e.chance ?? 0.1)) this.#applyStatus(t, e.status);
    if (e.flinch && Math.random() < e.flinch) t.stun = Math.max(t.stun, 0.35);
    if (e.drain) { const hp = Math.round(dmg * e.drain); user.mon.hp = Math.min(user.mon.stats.hp, user.mon.hp + hp); g.fx.number(user.x, user.y - 28, '+' + hp, '#7dff8a'); }
    if (e.recoil) this.hurt(user, Math.max(1, Math.round(dmg * e.recoil)), null, { silent: true });
  }

  hurt(t, dmg, by, { eff = 1, crit = false, mv = null, dx = 0, dy = 0, silent = false, auth = false } = {}) {
    const g = this.g;
    if (t.pvp && !auth) return; // duelo online: só o árbitro tira HP (veneno e queimadura inclusos)
    t.mon.hp = Math.max(0, t.mon.hp - dmg);
    t.hpShow = 3; t.flash = 0.12;
    if (!silent) {
      const power = Math.min(2.2, 0.6 + (mv?.power ?? 40) / 80) * (eff > 1 ? 1.3 : 1);
      t.kx += dx * 160 * power; t.ky += dy * 160 * power; t.vz = 70 * power;
      t.play('Hurt'); t.lock = Math.max(t.lock, 0.18);
      g.fx.burst(t.x, t.y - (t.h ?? 20) * 0.55, mv ? typeColor(mv.type) : 0xffffff, power * 0.8);
      g.fx.kick(eff > 1 || crit ? 0.32 : 0.14, eff > 1 || crit ? 0.07 : 0.035);
      g.fx.number(t.x, t.y - (t.h ?? 20) - 6, String(dmg), eff > 1 ? '#ffb347' : eff < 1 ? '#c8c8c8' : '#ffffff', eff > 1 || crit);
      if (eff > 1) g.fx.number(t.x, t.y - (t.h ?? 20) - 20, 'Super efetivo!', '#ffd84a');
      else if (eff > 0 && eff < 1) g.fx.number(t.x, t.y - (t.h ?? 20) - 20, 'Pouco efetivo', '#bbbbbb');
      if (crit) g.fx.number(t.x, t.y - (t.h ?? 20) - 32, 'Crítico!', '#ff7a5a');
      g.audio?.sfx?.(eff > 1 ? 'hit-super' : eff < 1 ? 'hit-weak' : 'hit');
    }
    if (by && t.side === 'wild') t.provoke(by.side === 'ally' ? by : t.aggroTarget);
    if (t.mon.hp <= 0) g.onFaint(t, by);
  }

  #status(user, t, mv) {
    const e = mv.eff ?? {};
    if (e.status && !t.mon.status && Math.random() < (mv.acc ?? 1)) this.#applyStatus(t, e.status);
    if (e.stat && !e.self) { t.stages[e.stat] = Math.max(-6, (t.stages[e.stat] ?? 0) + (e.by ?? -1)); this.g.fx.number(t.x, t.y - 30, 'Caiu!', '#9ad0ff'); }
    if (e.confuse) t.confused = 4;
    if (e.knock) { const d = Math.hypot(t.x - user.x, t.y - user.y) || 1; t.kx += (t.x - user.x) / d * e.knock * 30; t.ky += (t.y - user.y) / d * e.knock * 30; }
    if (t.side === 'wild') t.provoke(user);
  }
  #applyStatus(t, st) {
    t.mon.status = st;
    const name = { brn: 'Queimado!', psn: 'Envenenado!', par: 'Paralisado!', slp: 'Dormiu!' }[st] ?? st;
    this.g.fx.number(t.x, t.y - 34, name, '#ff9adf');
    if (st === 'slp') { t.stun = 2.5; t.mon.status = null; }
  }

  update(dt) {
    const g = this.g;
    // investidas (dash) acertam o primeiro no caminho
    for (const u of g.entities) if (u.dashing) {
      const dsh = u.dashing; dsh.t -= dt;
      g.fx.emit(u.x, u.y - 8, { color: dsh.color, n: 2, speed: 10, size: 5, life: 0.25 });
      for (const t of this.enemiesOf(u)) if (!u.dashHit.has(t) && Math.hypot(t.x - u.x, t.y - u.y) < t.r + u.r + 4) {
        u.dashHit.add(t); const d = Math.hypot(u.kx, u.ky) || 1; this.hit(u, t, dsh.mv, dsh.id, u.kx / d, u.ky / d); u.kx *= 0.3; u.ky *= 0.3;
      }
      if (dsh.t <= 0) u.dashing = null;
    }
    // projéteis: voo, rastro, choque entre golpes, acerto e cenário
    for (const p of this.projectiles) {
      if (p.dead) continue;
      const st = Math.hypot(p.vx, p.vy) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.left -= st;
      p.lift *= 1 - Math.min(1, dt * 6);
      p.s.x = p.x; p.s.y = p.y - p.lift; p.s.rotation += dt * 8;
      if (Math.random() < 0.9) g.fx.emit(p.x, p.s.y, { color: p.color, n: 1, speed: 12, size: 3 + p.big * 2, life: 0.25 });
      if (p.left <= 0) { p.dead = true; g.fx.burst(p.x, p.y, p.color, 0.4); if (p.mv.type === 'fire') g.scorchTile(p.x, p.y + 8); continue; }
      for (const q of this.projectiles) {
        if (q === p || q.dead || q.side === p.side) continue;
        if (Math.hypot(q.x - p.x, q.y - p.y) < p.r + q.r + 4) {
          const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
          g.fx.burst(mx, my, p.color, 1.6); g.fx.burst(mx, my, q.color, 1.6); g.fx.ring(mx, my, 0xffffff, 26, 0.35);
          g.fx.kick(0.4, 0.09); g.audio?.sfx?.('clash');
          const diff = p.power - q.power;
          if (diff > 15) { p.power = diff; q.dead = true; } else if (diff < -15) { q.power = -diff; p.dead = true; } else { p.dead = q.dead = true; }
          break;
        }
      }
      if (p.dead) continue;
      for (const t of this.enemiesOf(p.user)) {
        if (Math.hypot(t.x - p.x, t.y - 8 - p.y) < t.r + p.r + 2) { const d = Math.hypot(p.vx, p.vy) || 1; this.hit(p.user, t, p.mv, p.id, p.vx / d, p.vy / d); p.dead = true; g.fx.burst(p.x, p.y, p.color, 0.9 * p.big); if (p.mv.type === 'fire') g.scorchTile(t.x, t.y); break; }
      }
      if (!p.dead && g.hitScenery(p.x, p.y + 8, p.mv)) { p.dead = true; g.fx.burst(p.x, p.y, p.color, 0.7); }
    }
    for (const p of this.projectiles) if (p.dead && p.s.parent) p.s.destroy({ children: true });
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    // áreas que ficam (nuvem venenosa, chuva)
    for (const z of this.zones) {
      z.t -= dt; z.tick -= dt;
      g.fx.emit(z.x + (Math.random() - 0.5) * z.r * 2, z.y + (Math.random() - 0.5) * z.r * 1.2, z.mv.kind === 'rain' ? { color: 0x9fd4ff, n: 1, speed: 0, size: 3, life: 0.3, z: 60, vz: -260 } : { color: z.color, n: 1, speed: 8, size: 7, life: 0.8, add: false });
      if (z.tick <= 0) { z.tick = 0.6; for (const t of this.enemiesOf(z.user)) if (Math.hypot(t.x - z.x, t.y - z.y) < z.r + t.r) this.hit(z.user, t, { ...z.mv, power: (z.mv.power ?? 30) * 0.45 }, z.id); }
    }
    this.zones = this.zones.filter((z) => z.t > 0);
  }

  // Poké Bola: chance pela vida restante, estado e se o alvo estava distraído
  catchChance(e) {
    const m = e.mon, max = m.stats.hp;
    const rate = m.sp.catchRate ?? 45;
    let a = ((3 * max - 2 * m.hp) * rate) / (3 * max);
    if (m.status || e.stun > 0 || e.ai.state === 'sleep') a *= 2;
    if (e.ai.state !== 'aggro' && e.ai.state !== 'flee') a *= 1.6; // não percebeu você
    return Math.min(1, a / 255);
  }
}
