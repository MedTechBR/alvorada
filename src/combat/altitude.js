import { T, TILE, WALLS } from '../world/tiles.js';
import { MOVES } from '../data/moves.js';
import { nearWater } from './damage.js';

// Altura e profundidade no eixo z: voar, mergulhar, cavar e pular.
// - Voar: sobe (sombra se afasta), imune a golpes de chão e ao corpo a corpo de quem está no chão.
// - Mergulhar: some embaixo d'água, imune; emerge com dano.
// - Cavar: some no chão, imune (menos a tremores); sai debaixo do alvo com dano.
// - Pular: esquiva vertical curta; projéteis e golpes rasteiros passam por baixo.
const FLY_H = 30;

export class Altitude {
  constructor(g, c) { this.g = g; this.c = c; }
  canFly(e) { const sp = e.mon?.sp; return !!(e.mon?.types?.includes('flying') || sp?.body === 'bird' || sp?.body === 'flyer'); }
  isWaterType(e) { return !!e.mon?.types?.includes('water'); }
  canDive(e) { return this.isWaterType(e) && (this.inWater(e) || nearWater(this.g, e, 2)); }
  inWater(e) { const t = this.g.map.at(Math.floor(e.x / T), Math.floor(e.y / T)); return t === TILE.WATER || t === TILE.DEEP; }
  hidden(e) { const m = e.alt?.mode; return m === 'dive' || m === 'dig'; }

  // tecla de altura (C / botão): voa, pousa, mergulha, cava ou emerge conforme o Pokémon e o lugar
  action(e, ax, ay) {
    if (!e?.alive || e.lock > 0 && !this.hidden(e)) return;
    if (this.g.vivo?.acaoAltura(e, ax, ay)) return; // em cima de algo: desce; voando sobre telhado/copa/rocha: pousa (src/world/vivo.js)
    const m = e.alt?.mode;
    if (m === 'fly') return this.land(e);
    if (m === 'dive' || m === 'dig') return this.emerge(e, ax, ay);
    if (this.canFly(e)) return this.takeoff(e);
    if (this.canDive(e)) return this.dive(e);
    // Entrar na terra pertence ao golpe Cavar, nunca ao botão genérico de altura.
    return false;
  }
  jump(e) {
    if (!e?.alive || e.z - (e.piso ?? 0) > 2 || e.alt?.mode || e.stun > 0) return;
    if (this.g.vivo?.pulo(e)) return; // perto de telhado, copa ou rocha: sobe, se a espécie consegue
    e.vz = 230; e.jumpT = 0.62;
    this.g.fx.emit(e.x, e.y, { tex: 'dust', n: 5, speed: 30, life: 0.4, scale: 0.6, end: 1.4, add: false, alpha: 0.7 });
    if (e.set?.anims?.Hop) e.play('Hop');
    this.c.sfx('jump');
  }
  takeoff(e, h = FLY_H, dur = null) {
    e.alt = { mode: 'fly', t: 0, h, dur };
    e.vz = 160;
    this.g.fx.ring(e.x, e.y, 0xffffff, 8, 0.35, { width: 1.5 });
    this.g.fx.emit(e.x, e.y, { tex: 'dust', n: 8, speed: 60, life: 0.5, scale: 0.7, end: 1.6, add: false, alpha: 0.7 });
    this.g.fx.emit(e.x, e.y - 10, { tex: 'feather', n: 4, speed: 40, life: 0.9, spin: 5, grav: 30, add: false });
    this.c.sfx('whoosh');
    if (e.side === 'ally') this.g.fx.number(e.x, e.y - 44, 'Voando!', 0xbfe0ff);
  }
  land(e, force = false) {
    if (!force && this.g.map.solidAt(e.x, e.y)) { this.g.fx.number(e.x, e.y - 50, 'Não dá para pousar aqui', 0xffd0a0); return; }
    e.alt = null;
    this.g.fx.emit(e.x, e.y, { tex: 'dust', n: 6, speed: 40, life: 0.45, scale: 0.6, end: 1.4, add: false, alpha: 0.7 });
  }
  dive(e, dur = 5) {
    if (!this.inWater(e)) { // pula para a água mais perto
      const tx = Math.floor(e.x / T), ty = Math.floor(e.y / T); let best = null, bd = 1e9;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const t = this.g.map.at(tx + i, ty + j); if (t !== TILE.WATER && t !== TILE.DEEP) continue; const cx = (tx + i) * T + 8, cy = (ty + j) * T + 8, d = Math.hypot(cx - e.x, cy - e.y); if (d < bd) { bd = d; best = [cx, cy]; } }
      if (best) { e.x = best[0]; e.y = best[1]; }
    }
    e.alt = { mode: 'dive', t: 0, dur };
    this.#splash(e.x, e.y, 1.2);
    this.c.sfx('splash');
    if (e.side === 'ally') this.g.fx.number(e.x, e.y - 34, 'Mergulhou!', 0x9ad0ff);
  }
  dig(e, dur = 4) {
    e.alt = { mode: 'dig', t: 0, dur };
    const fx = this.g.fx;
    fx.emit(e.x, e.y, { tex: 'dirt', n: 14, speed: 70, life: 0.7, grav: 320, vz: 110, add: false });
    fx.emit(e.x, e.y, { tex: 'dust', n: 6, speed: 30, life: 0.6, scale: 0.8, end: 1.8, add: false, alpha: 0.8 });
    fx.decal('crater', e.x, e.y + 1, { scale: 0.6, life: 30 });
    this.c.arena.dig(e.x, e.y);
    this.c.sfx('dig');
    if (e.side === 'ally') this.g.fx.number(e.x, e.y - 30, 'Cavou!', 0xd8b888);
  }
  cancel(e) { e.alt = null; }
  #splash(x, y, P = 1) {
    const fx = this.g.fx;
    fx.emit(x, y - 2, { tex: 'drop', n: Math.round(16 * P), speed: 60 * P, life: 0.7, vz: 150, grav: 420, add: false });
    fx.emit(x, y - 2, { tex: 'foam', n: Math.round(8 * P), speed: 40, life: 0.4, add: false });
    fx.ring(x, y, 0xbfe6ff, 7 * P, 0.45, { width: 2 });
  }

  // sai do esconderijo atacando (mergulho emerge sob a água; cavar sai debaixo do alvo)
  emerge(e, ax, ay, move = null) {
    const m = e.alt?.mode; if (m !== 'dive' && m !== 'dig') return;
    const g = this.g, c = this.c;
    const id = move ?? (m === 'dive' ? 'dive' : 'dig'), mv = MOVES[id];
    // procura o alvo mais perto da mira (até 70 px de onde está)
    let best = null, bd = 1e9;
    for (const t of c.targetsOf(e)) { if (t.isTrainer) continue; const d = Math.hypot(t.x - (ax ?? e.x), t.y - (ay ?? e.y)); const de = Math.hypot(t.x - e.x, t.y - e.y); if (de < 80 && d < bd) { bd = d; best = t; } }
    if (best && m === 'dig') { const q = this.ate(e, best.x + (Math.random() - 0.5) * 4, best.y + 2); e.x = q.x; e.y = q.y; } // sai debaixo do alvo, sem passar parede
    e.alt = null; e.vz = 260; e.iframes = Math.max(e.iframes, 0.2);
    e.play(c.pickAnim(e, ['Attack', 'Strike']));
    if (m === 'dive') {
      this.#splash(e.x, e.y, 2);
      g.fx.shock(e.x, e.y, 0x7ac8ff, 34, 0.4);
      c.sfx('splash'); c.arena.soak(e.x, e.y);
    } else {
      const fx = g.fx;
      fx.emit(e.x, e.y, { tex: 'rock0', n: 10, speed: 90, life: 0.9, grav: 400, vz: 170, add: false, spin: 12, bounce: 0.3 });
      fx.emit(e.x, e.y, { tex: 'dirt', n: 16, speed: 80, life: 0.8, grav: 380, vz: 150, add: false });
      fx.emit(e.x, e.y, { tex: 'dust', n: 8, speed: 40, life: 0.8, scale: 0.9, end: 2, add: false, alpha: 0.8 });
      fx.shock(e.x, e.y, 0xc8a070, 30, 0.4);
      c.arena.blast(e.x, e.y, 14, mv);
      c.sfx('quake');
    }
    g.fx.kick(0.35, 0.08);
    for (const t of c.targetsOf(e)) {
      const d = Math.hypot(t.x - e.x, t.y - e.y);
      if (d < 26 + t.r) {
        const r = c.strike(e, t, mv, id, (t.x - e.x) / (d || 1), (t.y - e.y) / (d || 1), { src: 'emerge', knock: 0.8, force: false });
        if (r !== 'miss' && t.mon) { t.vz = Math.max(t.vz, 260); t.spinT = 0.6; }
      }
    }
  }

  // golpes de altura usados como golpe (Voar, Cavar, Mergulho)
  flyMove(e, mv, id, ax, ay) {
    if (e.alt?.mode !== 'fly') this.takeoff(e, 70);
    else e.alt.h = 70;
    e.alt.swoop = { mv, id, ax, ay, t: 0.55 };
    e.iframes = Math.max(e.iframes, 0.55);
  }
  digMove(e, mv, id, ax, ay) { this.dig(e, 0.9); e.alt.auto = { ax, ay, id }; }
  diveMove(e, mv, id, ax, ay) {
    if (!this.canDive(e)) { this.g.fx.number(e.x, e.y - 34, 'Precisa de água!', 0x9ad0ff); this.#splash(e.x, e.y, 0.5); return; }
    this.dive(e, 0.9); e.alt.auto = { ax, ay, id };
  }

  // a altura protege deste golpe?
  dodges(t, mv, info, attacker) {
    if (!t || t.isTrainer) return false;
    const m = t.alt?.mode;
    if (m === 'dig') return !(info.src === 'quake');
    if (m === 'dive') return true;
    const src = info.src;
    // no alto (telhado, copa, rocha): golpe de terra não chega; corpo a corpo do chão só alcança até a altura de quem bate;
    // e quem está lá em cima esquiva melhor dos golpes vindos do chão
    const piso = t.piso ?? 0;
    if (piso > 0 && (attacker?.piso ?? 0) < piso - 4 && !this.canFly(attacker) && (attacker?.z ?? 0) < piso) {
      if (mv?.type === 'ground' || src === 'quake' || src === 'line') { this.g.fx.number(t.x, t.y - piso - (t.h ?? 16) - 8, 'Não alcança!', 0xd8f0ff); return true; }
      if ((src === 'melee' || src === 'dash') && piso > (attacker?.topH ?? 16) + 10) { this.g.fx.number(t.x, t.y - piso - (t.h ?? 16) - 8, 'Não alcança!', 0xd8f0ff); return true; }
      if (['proj', 'cone', 'wave', 'melee', 'dash', 'bolt', 'surf'].includes(src) && Math.random() < 0.22) return true;
    }
    const airborne = t.z - piso > 12;
    if (airborne) {
      if (src === 'quake' || src === 'line' || (mv?.type === 'ground' && src !== 'proj')) return true;
      if ((src === 'melee' || src === 'dash') && (attacker?.z ?? 0) < 8 && !this.canFly(attacker)) return true;
    }
    if (t.jumpT > 0 && t.z > 14 && m !== 'fly' && ['proj', 'melee', 'dash', 'cone', 'wave', 'zone'].includes(src)) return true;
    return false;
  }

  // colisão especial: voando passa por cima de água e objetos; mergulhado só anda na água;
  // Pokémon de Água controlado pelo jogador entra e sai da água.
  resolve(e, r) {
    const m = e.alt?.mode;
    if (m === 'fly' || m === 'dive' || this.#anfibio(e)) { this.#resolveBy(e, r, this.solido(e)); return true; }
    return false;
  }
  #anfibio(e) { return this.isWaterType(e) && (e.amphibious || e.side === 'wild' && this.inWater(e)); }
  // O que é parede para este Pokémon agora, em blocos (tx, ty). Voando passa por cima de água, objetos e mato, mas
  // não de parede de sala nem de penhasco (antes só o penhasco segurava: voando, atravessava a parede da sala);
  // mergulhado só anda na água; o Pokémon de Água anfíbio anda onde andaria a pé OU nadando (antes atravessava parede).
  solido(e) {
    const m = e.alt?.mode, map = this.g.map;
    if (m === 'fly') return (tx, ty) => { const t = map.at(tx, ty); return t === TILE.CLIFF || t === TILE.VOID || WALLS.has(t); };
    if (m === 'dive') return (tx, ty) => map.solidAt(tx * T + 1, ty * T + 1, true);
    if (this.#anfibio(e)) return (tx, ty) => map.solidAt(tx * T + 1, ty * T + 1, false) && map.solidAt(tx * T + 1, ty * T + 1, true);
    return (tx, ty) => map.solidAt(tx * T + 1, ty * T + 1, !!e.swim);
  }
  // Rede de segurança depois de qualquer deslocamento: se o centro acabou dentro de um bloco sólido (empurrão de
  // arena, teleporte, saída do buraco, troca de modo), volta ao último ponto bom ou ao bloco livre mais perto.
  seguro(e) {
    if (e.pouso || e.saltando) { e.seguro = null; return; }
    const s = this.solido(e), at = (x, y) => s(Math.floor(x / T), Math.floor(y / T));
    if (!at(e.x, e.y)) { (e.seguro ??= {}).x = e.x; e.seguro.y = e.y; return; }
    const v = e.seguro && !at(e.seguro.x, e.seguro.y) ? e.seguro : this.g.map.blocoLivrePerto(e.x, e.y, s, 6);
    if (v) { e.x = v.x; e.y = v.y; e.kx = e.ky = 0; }
  }
  // de onde está até (x, y) sem atravessar parede
  ate(e, x, y) { const s = this.solido(e); return this.g.map.ateLivre(e.x, e.y, x, y, (px, py) => s(Math.floor(px / T), Math.floor(py / T))); }
  #resolveBy(p, r, solid) {
    const x0 = Math.floor((p.x - r) / T), x1 = Math.floor((p.x + r) / T), y0 = Math.floor((p.y - r) / T), y1 = Math.floor((p.y + r) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!solid(x, y)) continue;
      const nx = Math.max(x * T, Math.min(p.x, x * T + T)), ny = Math.max(y * T, Math.min(p.y, y * T + T));
      const dx = p.x - nx, dy = p.y - ny, d = Math.hypot(dx, dy);
      if (d < r && d > 1e-4) { p.x += dx / d * (r - d); p.y += dy / d * (r - d); }
      else if (d <= 1e-4) { p.x += (p.x - (x * T + 8)) > 0 ? r : -r; }
    }
  }

  update(dt) {
    const g = this.g;
    for (const e of g.entities) {
      if (e.jumpT > 0) e.jumpT -= dt;
      const a = e.alt; if (!a || !e.alive) continue;
      a.t += dt;
      if (a.mode === 'fly') {
        const sw = a.swoop;
        if (sw) { sw.t -= dt; if (sw.t <= 0) { a.swoop = null; a.h = FLY_H; e.iframes = 0; e.face(sw.ax - e.x, sw.ay - e.y); this.c.use(e, -1, sw.ax, sw.ay, { forced: true, moveId: sw.id, asDash: true }); } }
        if (!e.dashing) e.vz = (a.h - e.z) * 7 + 500 * dt;
        if (Math.random() < dt * 4) g.fx.emit(e.x, e.y - 2, { tex: 'dust', n: 1, speed: 20, life: 0.35, scale: 0.4, end: 1, add: false, alpha: 0.35 });
        if (a.dur && a.t > a.dur && !sw) this.land(e, false);
        if (this.inWater(e) && Math.random() < dt * 6) g.fx.ring(e.x, e.y, 0xbfe6ff, 3, 0.4, { width: 1 });
      } else if (a.mode === 'dive') {
        e.z = 0; e.vz = 0;
        if ((a.rip = (a.rip ?? 0) - dt) <= 0) { a.rip = 0.28; g.fx.ring(e.x, e.y, 0xbfe6ff, 4, 0.5, { width: 1, squash: 0.5 }); g.fx.emit(e.x, e.y, { tex: 'bubble', n: 1, speed: 6, life: 0.6, scale: 0.6, add: false }); }
        if (a.auto && a.t > a.dur) this.emerge(e, a.auto.ax, a.auto.ay, a.auto.id);
        else if (a.t > a.dur || !this.inWater(e) && a.t > 0.2) this.emerge(e, e.x, e.y);
      } else if (a.mode === 'dig') {
        e.z = 0; e.vz = 0;
        if (Math.random() < dt * 14 * (Math.hypot(e.vx, e.vy) > 5 ? 1.5 : 0.4)) g.fx.emit(e.x, e.y, { tex: 'dirt', n: 2, speed: 25, life: 0.5, grav: 300, vz: 50, add: false });
        if ((a.mound = (a.mound ?? 0) - dt) <= 0) { a.mound = 0.25; g.fx.decal('turf', e.x, e.y + 1, { scale: 0.6, life: 3, alpha: 0.8 }); }
        if (a.auto && a.t > a.dur) { // anda por baixo até a mira e sai
          const dx = a.auto.ax - e.x, dy = a.auto.ay - e.y, d = Math.hypot(dx, dy);
          if (d > 6 && a.t < a.dur + 0.5) { const q = this.ate(e, e.x + dx / d * Math.min(d, 260 * dt), e.y + dy / d * Math.min(d, 260 * dt)); if (Math.hypot(q.x - e.x, q.y - e.y) < 0.5) this.emerge(e, a.auto.ax, a.auto.ay, a.auto.id); else { e.x = q.x; e.y = q.y; } }
          else this.emerge(e, a.auto.ax, a.auto.ay, a.auto.id);
        } else if (a.t > a.dur) this.emerge(e, e.x, e.y);
      }
    }
  }
}
