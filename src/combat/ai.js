import { PokeEntity } from '../entities/pokemon.js';
import { Mon } from '../data/mon.js';
import { effectiveness } from '../data/types.js';
import { kindOf } from './anims/index.js';

// IA dos selvagens:
// - temperamentos: tímido foge, agressivo persegue, neutro revida;
// - bandos com alfa (maior, olhos vermelhos, mais forte) que chama o bando quando um é provocado;
// - quem dorme acorda com barulho (golpes, choques, explosões);
// - em luta: circula o alvo, mantém a distância certa para os golpes, esquiva de projéteis
//   e avisa antes de atacar (telegrafia, em combat.windup);
// - um selvagem por vez preparando golpe contra o mesmo alvo (dois num bando com alfa): dá para ler a luta;
// - espécies rivais brigam entre si quando se encontram.

const SIGHT = { aggressive: 92, neutral: 0, timid: 70 };
const DODGE = { aggressive: 0.25, neutral: 0.35, timid: 0.45 };

// Chance de um selvagem nascer como alfa de um bando (raro: ~1 em 14). Alfa: +3 níveis, PS ×1,5, bate 25% mais forte,
// não foge; vencido dá XP em dobro e deixa cair um item (main.js). Capturar é mais difícil (combat.catchChance).
export const ALPHA_ODDS = 0.07;

export class WildAI {
  constructor(g, c) { this.g = g; this.c = c; this.scanT = 2; this.packs = 0; }

  // ---------- percepção ----------
  noise(x, y, r, src) {
    for (const w of this.g.wilds ?? []) {
      if (!w.alive || w === src) continue;
      const d = Math.hypot(w.x - x, w.y - y);
      if (d > r) continue;
      const ai = w.ai;
      if (ai.state === 'sleep') { this.wake(w); continue; }
      if (ai.state === 'aggro' || ai.state === 'flee') continue;
      if (w.temper === 'timid' && d < r * 0.7) { this.flee(w, src); continue; }
      if (ai.state !== 'alert' && (ai.state === 'idle' || ai.state === 'wander' || ai.state === 'follow')) { ai.state = 'alert'; ai.t = 0.9; ai.look = { x, y }; ai.src = src?.side ? src : null; this.#mark(w, '?', 0xffffff); }
    }
  }
  wake(w) {
    w.ai.state = 'alert'; w.ai.t = 0.7; w.ai.look = { x: this.g.player.x, y: this.g.player.y };
    this.#mark(w, '!', 0xffd84a);
    this.g.fx.emit(w.x, w.y - 20, { tex: 'zz', color: 0xffffff, n: 2, speed: 30, life: 0.5, add: false });
    w.wakeT = 0.4;
  }
  #mark(w, s, c) { if ((w.markT ?? 0) > this.g.time) return; w.markT = this.g.time + 0.8; this.g.fx.number(w.x, w.y - (w.topH ?? 20) - 12, s, c, true); }
  flee(w, from) { if (w.mon.hp < w.mon.stats.hp * 0.25 && from) { this.provoke(w, from, true); return; } w.ai.state = 'flee'; w.ai.t = 3 + Math.random() * 2; w.ai.from = from ?? this.g.player; this.#mark(w, '!', 0x9ad0ff); }

  provoke(w, by, cornered = false) {
    if (w.side !== 'wild' || !w.alive || !by) return;
    if (w.ai.state === 'sleep') this.wake(w);
    if (by.isTrainer && this.g.lead?.alive && Math.random() < 0.7) by = this.g.lead;
    if (!cornered && w.temper === 'timid' && w.mon.hp > w.mon.stats.hp * 0.3 && !w.isAlpha) { this.flee(w, by); return; }
    const was = w.ai.state === 'aggro' && w.aggroTarget === by;
    w.ai.state = 'aggro'; w.ai.t = 12; w.aggroTarget = by;
    if (!was) { this.#mark(w, '!', 0xff5a4a); w.ai.react = 0.25 + Math.random() * 0.2; }
    // o bando inteiro entra na briga; o alfa urra
    const pk = w.pack;
    if (pk && !pk.called) {
      pk.called = true;
      const a = pk.alpha?.alive ? pk.alpha : w;
      this.g.fx.shock(a.x, a.y, 0xff3a2a, 40, 0.5);
      this.g.fx.number(a.x, a.y - 44, 'O alfa chamou o bando!', 0xff6a5a, true, 'banner');
      this.c.sfx('howl'); this.g.fx.kick(0.15, 0);
      for (const m of pk.members) if (m !== w && m.alive) { m.ai.state = 'aggro'; m.ai.t = 12; m.aggroTarget = by; m.ai.react = 0.3 + Math.random() * 0.4; this.#mark(m, '!', 0xff5a4a); }
      this.g.later(6, () => { pk.called = false; });
    }
  }

  // ---------- bandos com alfa ----------
  async onSpawn(w) {
    const g = this.g;
    if (w.ai.state === 'sleep' || Math.random() > ALPHA_ODDS || (g.wilds?.filter((o) => o.alive).length ?? 0) > 8) return;
    const pack = { id: ++this.packs, alpha: w, members: new Set([w]), called: false };
    w.pack = pack; this.makeAlpha(w);
    const n = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, x = w.x + Math.cos(a) * 22, y = w.y + Math.sin(a) * 18;
      if (g.map.solidAt(x, y)) continue;
      const m = new PokeEntity(g, new Mon(w.mon.dex, Math.max(2, w.mon.level - 4 + Math.floor(Math.random() * 2))), 'wild', x, y);
      await m.ready;
      m.pack = pack; pack.members.add(m); m.ai.state = 'follow'; m.temper = w.temper === 'timid' ? 'timid' : 'neutral';
      g.entities.push(m); g.wilds.push(m); g.ents.addChild(m.view); m.alpha = 0; m.fadeIn = true;
    }
  }
  makeAlpha(w) {
    w.isAlpha = true;
    const m = w.mon; m.level = Math.min(100, m.level + 3); m.calc(); m.stats.hp = Math.round(m.stats.hp * 1.5); m.hp = m.stats.hp;
    w.scale = 1.38; w.r = Math.min(28, w.r * 1.3);
    w.temper = 'aggressive'; // alfa não foge: defende o território
  }

  // ---------- decisão por quadro ----------
  think(e, dt) {
    const g = this.g, ai = e.ai, pl = g.player;
    ai.t -= dt; ai.dodgeCd = (ai.dodgeCd ?? 0) - dt; ai.react = (ai.react ?? 0) - dt;
    if (e.charging || e.wakeT > 0) { e.wakeT -= dt; return Z; }
    const alto = g.vivo?.pensar(e, dt); if (alto) return alto; // em cima de telhado/copa/rocha: fica, luta de cima ou salta no alvo (src/world/vivo.js)
    const dP = Math.hypot(pl.x - e.x, pl.y - e.y);
    if (ai.state === 'sleep') {
      if (dP < 18 && pl.speed > 60) this.wake(e);
      if ((e.zzT = (e.zzT ?? 0) - dt) <= 0) { e.zzT = 1.3; g.fx.emit(e.x + 4, e.y - (e.topH ?? 20), { tex: 'zz', color: 0xffffff, n: 1, speed: 4, life: 1.4, vz: 14, vx: 8, add: false, end: 1.6, scale: 0.6 }); }
      return Z;
    }
    let v = Z;
    if (ai.state === 'flee') v = this.#flee(e, dt);
    else if (ai.state === 'aggro') v = this.#fight(e, dt);
    else if (ai.state === 'alert') {
      e.face(ai.look.x - e.x, ai.look.y - e.y);
      if (ai.t <= 0) {
        const src = ai.src;
        if (e.temper === 'aggressive' && src && src.alive !== false && Math.hypot(src.x - e.x, src.y - e.y) < 200) this.provoke(e, src);
        else { ai.state = e.pack && e.pack.alpha !== e ? 'follow' : 'idle'; ai.t = 1; }
      }
    } else v = this.#roam(e, dt, dP);
    // preso num obstáculo (árvore, pedra): contorna pelo lado
    const want = Math.hypot(v.vx, v.vy);
    if (want > 10) {
      ai.stuckT = (ai.stuckT ?? 0) + dt;
      if (ai.stuckT > 0.35) { const moved = Math.hypot(e.x - (ai.px ?? e.x), e.y - (ai.py ?? e.y)); if (moved < want * ai.stuckT * 0.3) { ai.unstick = 0.7; ai.uside = Math.random() < 0.5 ? 1 : -1; } ai.stuckT = 0; ai.px = e.x; ai.py = e.y; }
    } else { ai.stuckT = 0; ai.px = e.x; ai.py = e.y; }
    if (ai.unstick > 0) { ai.unstick -= dt; const l = want || 1; v = { vx: v.vx * 0.3 + (-v.vy / l) * want * ai.uside, vy: v.vy * 0.3 + (v.vx / l) * want * ai.uside }; }
    if (e.confused > 0) { e.confused -= dt; const a = g.time * 5 + e.x; v = { vx: v.vx * 0.4 + Math.cos(a) * 40, vy: v.vy * 0.4 + Math.sin(a) * 40 }; if (Math.random() < dt) g.fx.emit(e.x, e.y - 24, { tex: 'twinkle', color: 0xffe27a, n: 2, speed: 20, life: 0.5 }); }
    return v;
  }
  #flee(e, dt) {
    const ai = e.ai, f = ai.from ?? this.g.player;
    const fx = e.x - f.x, fy = e.y - f.y, l = Math.hypot(fx, fy) || 1;
    if (ai.t <= 0 || l > 280) { ai.state = 'idle'; ai.t = 2; ai.home = { x: e.x, y: e.y }; return Z; }
    const wob = Math.sin(this.g.time * 3 + e.x) * 0.4;
    const s = e.speed(1.4);
    return { vx: (fx / l + -fy / l * wob) * s, vy: (fy / l + fx / l * wob) * s };
  }
  #roam(e, dt, dP) {
    const g = this.g, ai = e.ai, lead = g.lead, pl = g.player;
    // percebe quem chega perto
    const sight = SIGHT[e.temper] * (e.isAlpha ? 1.3 : 1) * (e.pouso ? 1.6 : 1); // lá do alto enxerga mais longe
    if (sight > 0 && ai.react <= 0) {
      const tgt = lead?.alive && !this.c.alt.hidden(lead) ? lead : pl;
      const d = Math.hypot(tgt.x - e.x, tgt.y - e.y);
      if (e.temper === 'aggressive' && d < sight) { this.provoke(e, tgt); return Z; }
      if (e.temper === 'timid' && dP < sight && pl.speed > 50) { this.flee(e, pl); return Z; }
    }
    if (ai.state === 'follow') {
      const a = e.pack?.alpha;
      if (!a?.alive) { ai.state = 'idle'; return Z; }
      if (a.ai.state === 'aggro' && a.aggroTarget) { this.provoke(e, a.aggroTarget); return Z; }
      const dx = a.x - e.x, dy = a.y - e.y, d = Math.hypot(dx, dy);
      if (d > 34) return { vx: dx / d * e.speed(0.8), vy: dy / d * e.speed(0.8) };
      if (ai.t <= 0) { ai.t = 1 + Math.random() * 2; ai.tx = a.x + (Math.random() - 0.5) * 50; ai.ty = a.y + (Math.random() - 0.5) * 40; }
      const ex = (ai.tx ?? e.x) - e.x, ey = (ai.ty ?? e.y) - e.y, ed = Math.hypot(ex, ey);
      return ed > 4 ? { vx: ex / ed * e.speed(0.4), vy: ey / ed * e.speed(0.4) } : Z;
    }
    if (ai.state === 'idle' && ai.t <= 0) { ai.state = 'wander'; ai.t = 2 + Math.random() * 3; ai.tx = ai.home.x + (Math.random() - 0.5) * 120; ai.ty = ai.home.y + (Math.random() - 0.5) * 120; }
    if (ai.state === 'wander') {
      const dx = ai.tx - e.x, dy = ai.ty - e.y, d = Math.hypot(dx, dy);
      if (d < 4 || ai.t <= 0) { ai.state = 'idle'; ai.t = 1 + Math.random() * 3; return Z; }
      return { vx: dx / d * e.speed(0.45), vy: dy / d * e.speed(0.45) };
    }
    return Z;
  }
  #fight(e, dt) {
    const g = this.g, c = this.c, ai = e.ai;
    let tg = e.aggroTarget;
    if (!tg || tg.alive === false || tg.dead || (tg.mon && tg.mon.hp <= 0)) {
      // alvo caiu: procura outro do time do jogador por perto, senão se acalma
      const lead = g.lead;
      tg = lead?.alive && Math.hypot(lead.x - e.x, lead.y - e.y) < 160 ? lead : null;
      if (!tg) { ai.state = 'idle'; ai.t = 2; e.aggroTarget = null; ai.home = { x: e.x, y: e.y }; return Z; }
      e.aggroTarget = tg;
    }
    if (c.alt.hidden(tg)) { // alvo sumiu (mergulhou/cavou): procura em volta
      return { vx: Math.cos(g.time * 2 + e.x) * e.speed(0.5), vy: Math.sin(g.time * 2 + e.x) * e.speed(0.5) };
    }
    const dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d > 400 || (ai.t <= 0 && d > 240)) { ai.state = 'idle'; e.aggroTarget = null; ai.t = 2; ai.home = { x: e.x, y: e.y }; return Z; }
    if (e.lock <= 0) e.face(dx, dy);
    // voadores às vezes levantam voo
    if (c.alt.canFly(e) && !e.alt && Math.random() < dt * 0.12) c.alt.takeoff(e, 30, 4 + Math.random() * 3);
    // esquiva de projéteis vindo na direção dele
    if (ai.dodgeCd <= 0 && e.stun <= 0 && e.lock <= 0) {
      for (const p of c.projectiles) {
        if (p.dead || !c.hostile(p.user, e)) continue;
        const rx = e.x - p.x, ry = e.y - p.gy, rd = Math.hypot(rx, ry);
        if (rd > 70) continue;
        const sp = Math.hypot(p.vx, p.vy) || 1, ux = p.vx / sp, uy = p.vy / sp;
        const along = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux);
        if (along > 0 && lat < e.r + p.r + 6 && along / sp < 0.4) {
          ai.dodgeCd = 2 + Math.random();
          if (Math.random() < DODGE[e.temper] + e.stat('spe') / 500) {
            const side = (rx * uy - ry * ux) > 0 ? 1 : -1;
            e.kx += uy * side * 250; e.ky += -ux * side * 250;
            if (e.set?.anims?.Hop) e.play('Hop');
            c.vfx.afterimage(e, 0xffffff, 0.45, 0.2);
            g.fx.emit(e.x, e.y, { tex: 'dust', n: 3, speed: 20, life: 0.35, scale: 0.5, end: 1.2, add: false, alpha: 0.6 });
          }
          break;
        }
      }
    }
    // escolhe golpe (com fichas: um por vez contra o mesmo alvo, dois num bando)
    if (e.lock <= 0 && e.stun <= 0 && ai.react <= 0) {
      let busy = 0; for (const o of g.wilds) if (o !== e && o.charging && o.aggroTarget === tg) busy++;
      const rate = (e.isAlpha ? 1.9 : 1.4) * (e.temper === 'aggressive' ? 1.2 : 1);
      // fichas de ataque: só um selvagem de cada vez prepara golpe contra o mesmo alvo (bando com alfa: dois)
      if (busy < (e.pack ? 2 : 1) && Math.random() < dt * rate) {
        // prefere golpes de dano; golpes de estado só de vez em quando
        let tot = 0; const opts = [];
        e.mon.moves.forEach((_, i) => { const { id, mv } = c.moveAt(e, i); if (mv && e.cds[i] <= 0 && c.inRange(e, mv, d, id)) { const w = mv.cat === 'status' ? 0.3 : 1 + (mv.power ?? 40) / 100; opts.push([i, w]); tot += w; } });
        if (opts.length) { let r = Math.random() * tot, i = opts[0][0]; for (const [k, w] of opts) { if ((r -= w) <= 0) { i = k; break; } } if (c.windup(e, i, tg)) ai.retreat = 0.5; }
      }
    }
    // movimento: distância certa, circula o alvo, recua depois de atacar
    // só conta golpes de dano: rosnado e afins não seguram ninguém de longe
    const dmgMove = (i, set) => { const { id, mv } = c.moveAt(e, i); return mv && mv.cat !== 'status' && set.includes(kindOf(id, mv)); };
    const RK = ['proj', 'cone', 'wave', 'cloud', 'rain', 'bolt', 'sky', 'surf', 'target', 'line'];
    const ranged = e.mon.moves.some((_, i) => dmgMove(i, RK));
    const rangedReady = e.mon.moves.some((_, i) => e.cds[i] <= 0 && dmgMove(i, RK));
    const melee = e.mon.moves.some((_, i) => dmgMove(i, ['melee', 'multi', 'dash']));
    ai.phaseT = (ai.phaseT ?? 0) - dt;
    if (ai.phaseT <= 0) { ai.phaseT = 2 + Math.random() * 2.5; ai.press = melee && (!ranged || Math.random() < 0.5); ai.side = Math.random() < 0.5 ? 1 : -1; }
    if (melee && !rangedReady) ai.press = true;
    const want = ai.press ? e.r + (tg.r ?? 6) + 10 : 76 + (e.isAlpha ? 10 : 0);
    let vx = 0, vy = 0;
    ai.retreat = (ai.retreat ?? 0) - dt;
    if (ai.retreat > 0 && ai.retreat < 0.35) { vx = -dx / d; vy = -dy / d; }
    else if (d > want + 10) { vx = dx / d; vy = dy / d; }
    else if (d < want - 16) { vx = -dx / d * 0.8; vy = -dy / d * 0.8; }
    const circ = ai.press && d < want + 14 ? 0.35 : 0.75;
    vx += -dy / d * circ * ai.side; vy += dx / d * circ * ai.side;
    const s = e.speed(1.05);
    return { vx: vx * s, vy: vy * s };
  }

  // ---------- rivais e bandos (varredura lenta) ----------
  update(dt) {
    this.scanT -= dt; if (this.scanT > 0) return; this.scanT = 1.5;
    const W = (this.g.wilds ?? []).filter((w) => w.alive && (w.ai.state === 'idle' || w.ai.state === 'wander'));
    const pl = this.g.player;
    for (const a of W) {
      if (Math.hypot(a.x - pl.x, a.y - pl.y) > 320 || Math.random() > 0.25) continue;
      for (const b of W) {
        if (a === b || a.mon.dex === b.mon.dex || (a.pack && a.pack === b.pack) || b.ai.state === 'aggro') continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) > 100) continue;
        if (!this.rivals(a, b)) continue;
        a.ai.state = b.ai.state = 'aggro'; a.ai.t = b.ai.t = 10; a.aggroTarget = b; b.aggroTarget = a;
        this.#mark(a, '!', 0xff5a4a); this.#mark(b, '!', 0xff5a4a);
        this.g.fx.number((a.x + b.x) / 2, Math.min(a.y, b.y) - 40, 'Briga de rivais!', 0xffb347, true, 'banner');
        return;
      }
    }
  }
  rivals(a, b) {
    const adv = (x, y) => x.mon.types.some((t) => effectiveness(t, y.mon.types) > 1);
    return adv(a, b) || adv(b, a) || (a.temper === 'aggressive' && b.temper === 'aggressive');
  }
}
const Z = { vx: 0, vy: 0 };
