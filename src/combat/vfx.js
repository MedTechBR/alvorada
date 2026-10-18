import * as PIXI from 'pixi.js';
import { TYPE_COLOR } from '../data/types.js';

// Visual de cada golpe e de cada tipo, tudo em pixel art/partículas desenhadas por código.
// Funções puras de efeito: não mexem em dano nem em regras (isso fica em combat.js).

const TAU = Math.PI * 2;
export const TC = {};
for (const [k, v] of Object.entries(TYPE_COLOR)) TC[k] = parseInt(v.replace('#', ''), 16);
// cores de efeito mais vivas que as cores de interface
Object.assign(TC, { fire: 0xff6a1a, water: 0x3a9cff, electric: 0xffe23a, grass: 0x5ad83a, ice: 0x8ff0ff, psychic: 0xff5aa8,
  dragon: 0x7a5aff, fairy: 0xff8fe0, poison: 0xb050e0, ghost: 0x8a5ad0, dark: 0x6a3a4a, normal: 0xf0f0e8, flying: 0xbfe0ff,
  rock: 0xc8b48a, ground: 0xc89a5a, bug: 0xb8d83a, fighting: 0xff8a3a, steel: 0xc8e0f0 });
export const typeHex = (t) => TC[t] ?? 0xffffff;

// estilos de corpo-a-corpo por golpe
const MELEE_STYLE = {
  scratch: 'claw', furySwipes: 'claw', metalClaw: 'claw', crushClaw: 'claw', furyCutter: 'slash', karateChop: 'chop',
  bite: 'bite', hyperFang: 'bite', bugBite: 'bite', peck: 'stab', poisonJab: 'stab', furyAttack: 'stab', vineWhip: 'whip', bind: 'whip',
  lowKick: 'chop', doubleKick: 'chop', rockSmash: 'blunt', lick: 'ghost', astonish: 'ghost', tackle: 'blunt', slam: 'blunt', pound: 'blunt', stomp: 'blunt', rage: 'blunt',
};
export const meleeStyle = (id) => MELEE_STYLE[id] ?? 'blunt';

// animação do PMD preferida para cada estilo (só usa se a espécie tiver)
export const ANIM_PREF = {
  claw: ['Swing', 'Strike', 'Attack'], slash: ['Swing', 'Strike', 'Attack'], bite: ['Strike', 'Attack'], stab: ['Strike', 'Attack'],
  whip: ['Swing', 'Attack'], chop: ['Strike', 'Pound', 'Attack'], blunt: ['Pound', 'Attack'], ghost: ['Strike', 'Attack'],
  dash: ['Attack', 'Strike'], spin: ['Rotate', 'Attack'], proj: ['Shoot', 'Charge', 'Attack'], beam: ['Shoot', 'Charge', 'Attack'],
  cone: ['Shoot', 'Attack'], wave: ['Charge', 'Shoot', 'Attack'], quake: ['Pound', 'Attack'], self: ['Charge', 'Shoot', 'Idle'], rain: ['Charge', 'Shoot', 'Attack'], cloud: ['Shoot', 'Attack'],
};

export class Vfx {
  constructor(g) {
    this.g = g; this.fx = g.fx; this.T = g.fx.T;
    this.ghosts = new PIXI.Container(); this.ghosts.blendMode = 'add';
    this.ghostPool = []; this.ghostLive = [];
  }
  E(x, y, o) { this.fx.emit(x, y, o); }

  // ---------- imagens residuais (esquiva, investida) ----------
  afterimage(e, tint = 0x9ad0ff, alpha = 0.55, life = 0.25) {
    if (!e.body?.texture) return;
    const s = this.ghostPool.pop() ?? new PIXI.Sprite();
    if (!s.parent) this.ghosts.addChild(s);
    s.visible = true; s.texture = e.body.texture; s.anchor.set(e.body.anchor.x, e.body.anchor.y); s.tint = tint;
    s.x = e.view.x; s.y = e.view.y + e.body.y * e.view.scale.y; s.scale.set(e.view.scale.x * (e.body.scale?.x ?? 1), e.view.scale.y * (e.body.scale?.y ?? 1)); s.rotation = e.body.rotation;
    s.alpha = alpha; s.life = s.max = life; s.a0 = alpha;
    this.ghostLive.push(s);
  }
  update(dt) {
    const L = this.ghostLive;
    for (let i = L.length - 1; i >= 0; i--) {
      const s = L[i]; s.life -= dt;
      if (s.life <= 0) { s.visible = false; L[i] = L[L.length - 1]; L.pop(); this.ghostPool.push(s); continue; }
      s.alpha = s.a0 * (s.life / s.max);
    }
  }

  // ---------- projéteis ----------
  // aparência da "cabeça" do projétil: textura, halo, giro
  head(mv, id) {
    const t = mv.type, big = Math.max(1, (mv.power ?? 40) / 55);
    const H = { tex: 'ball', frames: null, scale: 1.2 * big, halo: typeHex(t), haloScale: 1.3 * big, add: true, orient: false, spin: 0, tint: 0xffffff };
    switch (t) {
      case 'fire': Object.assign(H, { frames: 'flame', tex: null, scale: 1.5 * big, haloScale: 1.8 * big, add: false }); break;
      case 'water': Object.assign(H, id === 'bubble' ? { tex: 'bubble', scale: 1.4, add: false } : id === 'waterPulse' ? { tex: 'ring', scale: 1.1, tint: 0xbfe6ff } : { tex: 'drop', scale: 1.6 * big, orient: true, add: false, rotOff: -Math.PI / 2 }); break;
      case 'electric': Object.assign(H, id === 'thunderWave' ? { tex: 'ring', scale: 1.0, tint: 0xfff27a } : { tex: 'spark', scale: 1.7, spin: 14 }); break;
      case 'grass': Object.assign(H, id === 'leechSeed' ? { tex: 'ball', tint: 0x9a7a3a, scale: 0.9, add: false } : (id === 'absorb' || id === 'megaDrain') ? { tex: 'ball', tint: 0xb8ff9a, scale: 1.1 } : { tex: 'leaf', scale: 1.4, spin: 18, add: false }); break;
      case 'psychic': Object.assign(H, id === 'hypnosis' ? { tex: 'swirl', spin: 9, tint: 0xffb0e0 } : { tex: 'ball', tint: 0xffd0ec, scale: 1.3 }); break;
      case 'ice': Object.assign(H, { tex: 'ice', scale: 1.6, orient: true, add: false, rotOff: Math.PI / 2 }); break;
      case 'rock': Object.assign(H, { tex: 'rock2', scale: 1.4, spin: 8, add: false }); break;
      case 'ground': Object.assign(H, { tex: 'ball', tint: 0x8a6438, scale: 1.2, add: false }); break;
      case 'dragon': Object.assign(H, { frames: 'bflame', tex: null, scale: 1.6 * big, haloScale: 2 * big }); break;
      case 'fairy': Object.assign(H, { tex: 'star', tint: 0xffd0f4, spin: 8, scale: 1.4 }); break;
      case 'poison': Object.assign(H, id === 'poisonSting' ? { tex: 'needle', tint: 0xd090ff, orient: true, scale: 1.3 } : { tex: 'goo', scale: 1.4, add: false, orient: true }); break;
      case 'bug': Object.assign(H, id === 'stringShot' ? { tex: 'dot', tint: 0xffffff, scale: 1.2 } : { tex: 'needle', tint: 0xe0ff8a, orient: true, scale: 1.3 }); break;
      case 'flying': Object.assign(H, { tex: 'slash', tint: 0xe8f6ff, orient: true, scale: 1.3 * big, rotOff: Math.PI / 2 }); break;
      case 'ghost': case 'dark': Object.assign(H, { tex: 'wisp', tint: t === 'dark' ? 0xb05a6a : 0xc8a0ff, scale: 1.4, orient: true, rotOff: -Math.PI / 2 }); break;
      case 'normal': Object.assign(H, id === 'supersonic' ? { tex: 'ring', tint: 0xffffff, scale: 1.0 } : { tex: 'ball', scale: 1.1 }); break;
    }
    return H;
  }

  // rastro do projétil (por tempo, não por quadro: igual a 60 e a 120 FPS)
  trail(p, dt) {
    const t = p.mv.type, x = p.x, y = p.y, ang = Math.atan2(p.vy, p.vx), back = ang + Math.PI, big = p.big;
    p.acc = (p.acc ?? 0) + dt;
    const k = (rate) => { const n = Math.floor(p.acc * rate + Math.random()); return n; };
    const step = p.acc; p.acc = 0;
    const R = (rate) => Math.floor(step * rate + Math.random());
    switch (t) {
      case 'fire':
        this.E(x, y, { frames: 'flame', n: R(70 * big), speed: 22, dir: back, spread: 1.2, scale: 1.1 * big, end: 0.3, life: 0.32, vz: 30, add: false, jitter: 3 });
        this.E(x, y, { tex: 'ember', n: R(24), speed: 30, life: 0.5, vz: 40, grav: -20, add: true, jitter: 4 });
        this.E(x, y, { tex: 'smoke', n: R(5), speed: 8, life: 0.7, scale: 0.6, end: 1.6, vz: 18, alpha: 0.35, add: false, color: 0x777777 });
        break;
      case 'water':
        this.E(x, y, { tex: 'drop', n: R(30), speed: 25, life: 0.45, vz: 40, grav: 320, add: false, scale: 0.8 });
        this.E(x, y, { tex: 'glow', n: R(30), color: 0x6ac0ff, speed: 10, size: 4 * big, life: 0.22 });
        if (p.id === 'bubble') this.E(x, y, { tex: 'bubble', n: R(6), speed: 10, scale: 0.6, life: 0.4, add: false });
        break;
      case 'electric':
        this.E(x, y, { tex: 'spark', n: R(36), color: 0xfff27a, speed: 70, life: 0.14, scale: 0.7, end: 0.2 });
        if ((p.boltT = (p.boltT ?? 0) - step) <= 0) { p.boltT = 0.035; this.fx.bolt(p.lx ?? x, p.ly ?? y, x, y, 0xffe23a, 0.1, { amp: 4 }); p.lx = x; p.ly = y; }
        break;
      case 'grass':
        this.E(x, y, { tex: 'leaf2', n: R(10), speed: 20, life: 0.5, spin: 10, scale: 0.7, add: false, grav: 40, vz: 20 });
        this.E(x, y, { tex: 'glow', n: R(24), color: 0x7aff5a, size: 3, speed: 8, life: 0.2 });
        break;
      case 'psychic':
        if ((p.ringT = (p.ringT ?? 0) - step) <= 0) { p.ringT = 0.07; this.fx.ring(x, y, 0xff7ac0, 3, 0.3, { mult: 3, squash: 1, width: 1.2 }); }
        this.E(x, y, { tex: 'glow', n: R(30), color: 0xff7ac0, size: 4, speed: 6, life: 0.3 });
        break;
      case 'ice':
        this.E(x, y, { tex: 'twinkle', n: R(26), color: 0xcff8ff, speed: 18, life: 0.4, add: true });
        this.E(x, y, { tex: 'glow', n: R(16), color: 0x8ff0ff, size: 3, speed: 4, life: 0.25 });
        break;
      case 'rock': case 'ground':
        this.E(x, y, { tex: 'dust', n: R(14), speed: 10, life: 0.4, scale: 0.6, end: 1.3, add: false, alpha: 0.6 });
        if (t === 'ground') this.E(x, y, { tex: 'dirt', n: R(18), speed: 20, life: 0.5, vz: 30, grav: 300, add: false });
        break;
      case 'dragon':
        this.E(x, y, { frames: 'bflame', n: R(50 * big), speed: 20, dir: back, spread: 1, scale: big, end: 0.3, life: 0.3, add: true, jitter: 3 });
        this.E(x, y, { tex: 'spark', n: R(12), color: 0xb8a8ff, speed: 40, life: 0.2, scale: 0.6 });
        break;
      case 'fairy':
        this.E(x, y, { tex: Math.random() < 0.3 ? 'heart' : 'twinkle', n: R(22), color: 0xffa8ec, speed: 18, life: 0.45, scale: 0.8 });
        break;
      case 'poison':
        this.E(x, y, { tex: 'bubble', n: R(10), color: 0xd080ff, speed: 10, life: 0.5, scale: 0.6, vz: 15, add: false });
        this.E(x, y, { tex: 'goo', n: R(8), speed: 10, life: 0.5, scale: 0.5, grav: 260, vz: 10, add: false });
        break;
      case 'bug':
        if (p.id === 'stringShot') this.E(x, y, { tex: 'px', n: R(90), speed: 0, life: 0.45, color: 0xffffff, add: false, scale: 1 });
        else this.E(x, y, { tex: 'glow', n: R(20), color: 0xd0ff6a, size: 2.5, speed: 6, life: 0.18 });
        break;
      case 'flying':
        this.E(x, y, { tex: 'streak', n: R(28), color: 0xd8f0ff, speed: 30, dir: back, spread: 0.5, life: 0.2, rot: 'dir', stretch: 0.004 });
        break;
      case 'ghost': case 'dark':
        this.E(x, y, { tex: 'wisp', n: R(22), color: t === 'dark' ? 0x5a2a3a : 0x8a5ad0, speed: 10, life: 0.45, vz: 25, scale: 0.8, end: 0.3, add: t === 'ghost', alpha: 0.8 });
        break;
      default:
        this.E(x, y, { tex: 'glow', n: R(40), color: typeHex(t), size: 2.5 + big * 1.5, speed: 12, life: 0.22 });
        this.E(x, y, { tex: 'streak', n: R(16), color: 0xffffff, speed: 20, dir: back, spread: 0.3, life: 0.14, rot: 'dir', alpha: 0.6 });
    }
  }

  // clarão na boca ao disparar
  muzzle(type, x, y, dir, power = 40) {
    const c = typeHex(type), k = Math.min(2, power / 50);
    this.fx.light(x, y, c, 14 + 8 * k, 0.14);
    this.E(x, y, { tex: 'spark', color: 0xffffff, n: 4, speed: 60, dir, spread: 1.2, life: 0.12, scale: 0.6 });
    if (type === 'fire') this.E(x, y, { frames: 'flame', n: 6, speed: 50, dir, spread: 0.9, life: 0.2, scale: 1.1, end: 0.3, add: false });
    if (type === 'water') this.E(x, y, { tex: 'drop', n: 5, speed: 60, dir, spread: 0.9, life: 0.3, grav: 260, vz: 40, add: false });
    if (type === 'electric') for (let i = 0; i < 2; i++) { const a = dir + (Math.random() - 0.5) * 1.6; this.fx.bolt(x, y, x + Math.cos(a) * 12, y + Math.sin(a) * 12, 0xffe23a, 0.08, { amp: 3 }); }
  }

  // ---------- impactos por tipo ----------
  impact(type, x, y, dir = 0, power = 1, gy = null) {
    const fx = this.fx, c = typeHex(type), P = Math.min(2.4, power);
    const ground = gy ?? y + 8;
    fx.light(x, y, c, 14 + 10 * P, 0.18, 0.55);
    this.E(x, y, { tex: 'impact', color: 0xffffff, n: 1, speed: 0, scale: 0.8 + 0.35 * P, end: 1.6, life: 0.09, add: true, alpha: 0.85 });
    this.E(x, y, { tex: 'spark', color: c, n: Math.round(6 + 6 * P), speed: 110 * P, life: 0.22, scale: 0.8, end: 0.2, stretch: 0.012, drag: 5 });
    switch (type) {
      case 'fire':
        this.E(x, y, { frames: 'flame', n: Math.round(10 * P), speed: 60 * P, life: 0.45, scale: 1.2, end: 0.4, vz: 50, add: false, drag: 4 });
        this.E(x, y, { tex: 'ember', n: Math.round(14 * P), speed: 90, life: 0.7, vz: 80, grav: 120, add: true });
        this.E(x, y, { tex: 'smoke', n: Math.round(3 * P), speed: 15, life: 0.9, scale: 0.8, end: 2, vz: 20, alpha: 0.4, add: false, color: 0x666666 });
        break;
      case 'water':
        this.E(x, y, { tex: 'drop', n: Math.round(14 * P), speed: 80 * P, life: 0.6, vz: 110, grav: 420, add: false, scale: 0.9 });
        this.E(x, y, { tex: 'foam', n: Math.round(6 * P), speed: 40, life: 0.35, add: false });
        fx.ring(x, ground, 0x8fd0ff, 6 * P, 0.35, { width: 1.5 });
        fx.decal('splat', x, ground, { tint: 0x3a7ac8, alpha: 0.5, life: 4, scale: 0.6 + 0.3 * P });
        break;
      case 'electric':
        for (let i = 0; i < 3 + Math.round(2 * P); i++) { const a = Math.random() * TAU, L = 10 + Math.random() * 16 * P; fx.bolt(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L * 0.8, 0xffe23a, 0.14, { amp: 4 }); }
        fx.screenFlash(0xfff6a0, 0.08 * P);
        break;
      case 'grass':
        this.E(x, y, { tex: 'leaf', n: Math.round(8 * P), speed: 70, life: 0.7, spin: 12, grav: 100, vz: 60, add: false, drag: 3 });
        this.E(x, y, { tex: 'clip', n: Math.round(6 * P), speed: 50, life: 0.6, vz: 70, grav: 300, add: false });
        break;
      case 'psychic':
        for (let i = 0; i < 3; i++) fx.ring(x, y, 0xff7ac0, 5 + i * 4 * P, 0.25 + i * 0.1, { squash: 1, width: 2 });
        break;
      case 'ice':
        this.E(x, y, { tex: 'ice', n: Math.round(8 * P), speed: 90, life: 0.6, spin: 14, grav: 260, vz: 70, add: false, bounce: 0.3 });
        this.E(x, y, { tex: 'twinkle', n: 10, color: 0xffffff, speed: 50, life: 0.5 });
        fx.decal('splat', x, ground, { tint: 0xbff4ff, alpha: 0.7, life: 6, scale: 0.6 + 0.3 * P });
        break;
      case 'rock': case 'ground':
        this.E(x, y, { tex: type === 'rock' ? 'rock0' : 'dirt', n: Math.round(8 * P), speed: 80, life: 0.9, spin: 10, grav: 360, vz: 110, add: false, bounce: 0.35 });
        this.E(x, ground, { tex: 'dust', n: Math.round(5 * P), speed: 30, life: 0.6, scale: 0.8, end: 1.8, add: false, alpha: 0.7 });
        if (power > 1.1) fx.decal('crater', x, ground, { scale: 0.4 + 0.25 * P, alpha: 0.8, life: 20 });
        break;
      case 'dragon':
        this.E(x, y, { frames: 'bflame', n: Math.round(10 * P), speed: 70 * P, life: 0.4, scale: 1.1, end: 0.3, add: true, drag: 4 });
        fx.shock(x, ground, 0x7a5aff, 14 * P, 0.35);
        break;
      case 'fairy':
        this.E(x, y, { tex: 'star', n: Math.round(8 * P), color: 0xffb8f0, speed: 70, life: 0.6, spin: 6 });
        this.E(x, y, { tex: 'heart', n: 3, color: 0xff8fd8, speed: 40, life: 0.6, vz: 30 });
        break;
      case 'poison':
        this.E(x, y, { tex: 'goo', n: Math.round(7 * P), speed: 60, life: 0.7, vz: 70, grav: 300, add: false });
        this.E(x, y, { tex: 'bubble', n: 6, color: 0xd090ff, speed: 25, life: 0.7, vz: 25, add: false, scale: 0.8 });
        fx.decal('splat', x, ground, { tint: 0x8a3ac0, alpha: 0.6, life: 6, scale: 0.6 + 0.3 * P });
        break;
      case 'flying':
        this.E(x, y, { tex: 'streak', n: 10, color: 0xe8f6ff, speed: 120, life: 0.2, rot: 'dir' });
        this.E(x, y, { tex: 'feather', n: 3, speed: 40, life: 0.8, spin: 4, grav: 30, vz: 30, add: false });
        break;
      case 'ghost': case 'dark':
        this.E(x, y, { tex: 'wisp', n: Math.round(8 * P), color: type === 'dark' ? 0x4a1a2a : 0x9a6ae0, speed: 60, life: 0.5, vz: 20, add: type === 'ghost', end: 0.3 });
        fx.ring(x, y, type === 'dark' ? 0xa03a4a : 0x9a6ae0, 6 * P, 0.3, { width: 2 });
        break;
      case 'fighting':
        this.E(x, y, { tex: 'impact', color: 0xffa04a, n: 1, speed: 0, scale: 1.4 * P, end: 2.4, life: 0.16 });
        fx.shock(x, y, 0xff8a3a, 12 * P, 0.25);
        break;
      case 'steel':
        this.E(x, y, { tex: 'px', n: Math.round(14 * P), color: 0xfff2b0, speed: 150, life: 0.35, grav: 300, vz: 60, stretch: 0.03, scale: 1.5 });
        break;
      case 'bug':
        this.E(x, y, { tex: 'needle', n: 6, color: 0xd8ff6a, speed: 80, life: 0.3, rot: 'dir' });
        break;
      default:
        this.E(x, y, { tex: 'impact', color: 0xffffff, n: 1, speed: 0, scale: 1.2 * P, end: 2.2, life: 0.12 });
        this.E(x, ground, { tex: 'dust', n: Math.round(3 * P), speed: 30, life: 0.45, scale: 0.6, end: 1.5, add: false, alpha: 0.6 });
        fx.ring(x, y, 0xffffff, 6 * P, 0.22, { width: 2 });
    }
  }

  // ---------- corpo a corpo ----------
  melee(user, mv, id, dx, dy, reach, i = 0, cfg = null) {
    const fx = this.fx, style = cfg?.style ?? meleeStyle(id), c = cfg?.color ?? typeHex(mv.type), tc = typeHex(mv.type);
    const a = Math.atan2(dy, dx), cy = user.y - (user.midH ?? 12);
    const x = user.x + dx * reach * 0.75, y = cy + dy * reach * 0.6;
    const flip = i % 2 ? -1 : 1, big = cfg?.big ? 1.4 : 1;
    const glow = () => { if (cfg?.glow) this.E(x, y, cfg.glow === 'flame' ? { frames: 'flame', n: 8, speed: 50, dir: a, spread: 1.2, life: 0.3, add: false, scale: 1 } : { tex: cfg.glow, color: c, n: 8, speed: 60, dir: a, spread: 1.2, life: 0.3, add: cfg.glow !== 'drop' }); };
    switch (style) {
      case 'claw':
        this.E(x, y, { tex: 'claw', color: 0xffffff, n: 1, speed: 0, scale: 1.3 * big, end: 1.5 * big, life: 0.16, rot: a + flip * 0.5, add: true });
        this.E(x, y, { tex: 'claw', color: c, n: 1, speed: 0, scale: 1.8 * big, end: 2 * big, life: 0.2, rot: a + flip * 0.5, add: true, alpha: 0.6 });
        if (cfg?.metal) this.E(x, y, { tex: 'px', color: 0xfff2b0, n: 8, speed: 120, dir: a, spread: 1.4, life: 0.25, grav: 200, stretch: 0.03, scale: 1.4 });
        break;
      case 'slash': case 'chop': case 'scythe':
        this.E(x, y, { tex: 'slash', color: style === 'chop' ? 0xffd0a0 : cfg?.dark ? 0xff3a5a : 0xffffff, n: 1, speed: 0, scale: 1.4 * big, end: 1.9 * big, life: 0.15, rot: a + Math.PI / 2 + flip * (style === 'chop' ? 1.2 : 0.3) });
        this.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale: 2 * big, end: 2.4 * big, life: 0.2, rot: a + Math.PI / 2 + flip * (style === 'chop' ? 1.2 : 0.3), alpha: 0.6 });
        if (style === 'scythe') this.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale: 1.2, end: 1.6, life: 0.15, rot: a + Math.PI / 2 - flip * 0.6 });
        break;
      case 'x':
        for (const r of [0.8, -0.8]) this.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale: 2.2, end: 2.6, life: 0.2, rot: a + Math.PI / 2 + r });
        break;
      case 'bite': case 'fang':
        for (const s of [-1, 1]) this.E(x - dy * 7 * s * big, y + dx * 7 * s * big, { tex: 'slash', color: style === 'fang' ? c : 0xffffff, n: 1, speed: 120, dir: Math.atan2(dx * s, -dy * s) + Math.PI, spread: 0, drag: 14, scale: 1.2 * big, life: 0.14, rot: a + (s > 0 ? Math.PI : 0) + Math.PI / 2 });
        this.E(x, y, { tex: 'impact', color: c, n: 1, speed: 0, scale: 0.8 * big, end: 1.6 * big, life: 0.12 });
        if (style === 'fang') glow();
        break;
      case 'stab':
        this.E(user.x + dx * reach * 0.3, cy + dy * reach * 0.3, { tex: 'streak', color: c, n: cfg?.fast ? 2 : 3, speed: 260, dir: a + (Math.random() - 0.5) * (cfg?.fast ? 0.5 : 0), spread: 0.15, drag: 10, life: 0.12, rot: 'dir', scale: 1.4, stretch: 0.004 });
        break;
      case 'whip': case 'vine': {
        const ox = user.x + dx * 6, oy = cy, tx = user.x + dx * reach + (-dy) * 10 * flip, ty = cy + dy * reach + dx * 10 * flip;
        fx.bolt(ox, oy, (ox + tx) / 2 - dy * 8 * flip, (oy + ty) / 2 + dx * 8 * flip, c, 0.18, { amp: 2, width: 2.2, seg: 5 });
        fx.bolt((ox + tx) / 2 - dy * 8 * flip, (oy + ty) / 2 + dx * 8 * flip, tx, ty, c, 0.18, { amp: 2, width: 2, seg: 5 });
        this.E(tx, ty, { tex: 'spark', color: 0xffffff, n: 4, speed: 80, life: 0.12, scale: 0.7 });
        if (style === 'vine' && tc === typeHex('grass')) this.E(tx, ty, { tex: 'leaf2', n: 3, speed: 40, life: 0.4, spin: 10, add: false });
        break;
      }
      case 'tail': case 'sweep':
        for (let k = 0; k < 7; k++) { const b = a + (k / 6 - 0.5) * 2.2 * flip; this.E(user.x + Math.cos(b) * reach * 0.8, cy + Math.sin(b) * reach * 0.55 + (style === 'sweep' ? 8 : 0), { tex: 'glow', color: c, n: 1, speed: 20, size: 4, life: 0.18 }); }
        this.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale: 2.6, end: 3, life: 0.2, rot: a + Math.PI / 2 + flip * 0.2, alpha: 0.8 });
        if (cfg?.metal) this.E(x, y, { tex: 'twinkle', color: 0xffffff, n: 4, speed: 30, life: 0.3 });
        glow();
        break;
      case 'fist': case 'kick':
        this.E(user.x + dx * reach * 0.4, cy + dy * reach * 0.3, { tex: 'streak', color: 0xffffff, n: 3, speed: 240, dir: a, spread: 0.3, drag: 12, life: 0.1, rot: 'dir', alpha: 0.8 });
        this.E(x, y, { tex: 'impact', color: c, n: 1, speed: 0, scale: 1.1, end: 1.9, life: 0.12 });
        glow();
        break;
      case 'lick':
        this.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale: 1.5, end: 1.7, life: 0.18, rot: a + Math.PI / 2 });
        this.E(x, y, { tex: 'goo', n: 3, speed: 30, life: 0.4, grav: 200, add: false, scale: 0.6 });
        break;
      case 'ghost':
        this.E(x, y, { tex: 'wisp', color: 0xb08aff, n: 6, speed: 60, dir: a, spread: 1.4, life: 0.35, add: true, vz: 20 });
        this.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale: 1.6, end: 2, life: 0.18, rot: a + Math.PI / 2 });
        break;
      case 'stomp':
        fx.shock(x, user.y + dy * reach * 0.6, c, 22, 0.3);
        this.E(x, user.y + dy * reach * 0.6, { tex: 'dust', n: 6, speed: 50, life: 0.5, scale: 0.7, end: 1.6, add: false, alpha: 0.7 });
        break;
      case 'tackle':
        this.E(user.x, cy, { tex: 'streak', color: 0xffffff, n: 6, speed: 60, dir: a + Math.PI, spread: 0.6, life: 0.2, rot: 'dir', alpha: 0.7 });
        this.afterimage(user, 0xffffff, 0.45, 0.18);
        break;
      default: // blunt
        this.E(x, y, { tex: 'streak', color: cfg?.rage ? 0xff5a5a : 0xffffff, n: 4, speed: 200, dir: a, spread: 0.6, drag: 12, life: 0.12, rot: 'dir', alpha: 0.7 });
        if (cfg?.rage) this.E(user.x, cy, { tex: 'glow', color: 0xff3a2a, n: 6, size: 5, speed: 30, life: 0.3 });
    }
    // arco de varredura
    for (let k = 0; k < 5; k++) { const b = a + (k / 4 - 0.5) * 1.5 * flip; this.E(user.x + Math.cos(b) * reach * 0.8, cy + Math.sin(b) * reach * 0.6, { tex: 'glow', color: c, n: 1, speed: 15, size: 3, life: 0.12 }); }
  }
  meleeHit(style, type, x, y, dir, P) {
    if (style === 'blunt' || style === 'chop' || style === 'fist' || style === 'tackle' || style === 'kick') { this.fx.shock(x, y + 6, 0xffffff, 10 * P, 0.22); }
    this.impact(type, x, y, dir, P);
  }

  // ---------- leque (sopros e ventos) ----------
  cone(user, mv, id, dx, dy, R) {
    const a0 = Math.atan2(dy, dx), x = user.x + dx * 8, y = user.y - 8 + dy * 6, t = mv.type, sp = R * 2.4;
    const O = { n: 26, speed: sp, dir: a0, spread: 1.0, life: 0.42, drag: 1.4 };
    if (id === 'dragonBreath') { this.E(x, y, { ...O, frames: 'bflame', scale: 1.3, end: 0.5, add: true, n: 34 }); this.E(x, y, { ...O, tex: 'spark', color: 0xfff27a, n: 10, scale: 0.6 }); }
    else if (id === 'twister') { for (let k = 0; k < 3; k++) this.E(x + dx * R * 0.25 * k, y + dy * R * 0.25 * k, { tex: 'swirl', color: 0x9a8aff, n: 3, speed: sp * 0.4, dir: a0, spread: 0.6, spin: 14, scale: 1.4, end: 2.2, life: 0.6 }); this.E(x, y, { ...O, tex: 'streak', color: 0xb8a8ff, rot: 'dir' }); }
    else if (id === 'fairyWind') { this.E(x, y, { ...O, tex: 'twinkle', color: 0xffb8f0 }); this.E(x, y, { ...O, tex: 'star', color: 0xff8fe0, n: 8, spin: 6 }); }
    else if (id === 'sandAttack') { this.E(x, y + 6, { ...O, tex: 'dust', add: false, scale: 0.7, end: 1.4, alpha: 0.8, n: 16 }); this.E(x, y + 6, { ...O, tex: 'px', color: 0xd8c08a, add: false, n: 30, grav: 200, vz: 40, scale: 1.4 }); }
    else if (id === 'roar') { for (let k = 0; k < 3; k++) this.fx.ring(x + dx * 10 * k, y + dy * 10 * k, 0xffffff, 6 + k * 3, 0.3 + k * 0.08, { width: 2 }); this.E(x, y, { ...O, tex: 'streak', color: 0xffffff, rot: 'dir', stretch: 0.004 }); }
    else { // gust, whirlwind e outros ventos
      this.E(x, y, { ...O, tex: 'streak', color: typeHex(t), rot: 'dir', stretch: 0.004, n: 30 });
      this.E(x, y, { ...O, tex: 'swirl', color: 0xffffff, n: 4, spin: 10, scale: 1, end: 1.8, add: true });
      this.E(x, y + 6, { ...O, tex: 'leaf2', n: 5, add: false, spin: 10 });
    }
  }

  // ---------- ondas ao redor ----------
  wave(user, mv, id, R) {
    const fx = this.fx, x = user.x, y = user.y, t = mv.type, cy = user.y - 10;
    if (t === 'fairy') { for (let i = 0; i < 3; i++) fx.ring(x, y, 0xff8fe0, R / 3.2 * (0.6 + i * 0.25), 0.35 + i * 0.1, { width: 2.5, fill: i ? 0 : 0.15 }); this.E(x, cy, { tex: 'heart', color: 0xffa8ec, n: 10, speed: R * 2, life: 0.5 }); this.E(x, cy, { tex: 'twinkle', color: 0xffffff, n: 14, speed: R * 2.2, life: 0.5 }); return; }
    if (id === 'leer' || id === 'scaryFace') { this.E(x, cy - 4, { tex: 'twinkle', color: 0xff3a2a, n: 1, speed: 0, scale: 2.2, end: 0.5, life: 0.35 }); fx.ring(x, y, 0xff5a4a, R / 3.2, 0.4, { width: 2 }); return; }
    // sons (rosnado, grito, chicote de cauda)
    for (let i = 0; i < 3; i++) fx.ring(x, cy, 0xffffff, R / 3.2 * (0.5 + i * 0.25), 0.3 + i * 0.12, { width: 1.5, squash: 0.8 });
    this.E(x, cy, { tex: 'note', color: 0xffffff, n: 5, speed: 50, life: 0.6, vz: 20, add: false });
  }
  quake(user, mv, R) {
    const fx = this.fx, x = user.x, y = user.y;
    fx.shock(x, y, 0xc8a070, R, 0.45);
    fx.decal('crack', x, y + 2, { scale: 1 + R / 60, life: 25 });
    fx.decal('crater', x, y + 2, { scale: 0.8, life: 25 });
    this.E(x, y, { tex: 'dust', n: 26, speed: R * 2.2, life: 0.6, scale: 0.9, end: 2, add: false, alpha: 0.8, drag: 3 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, rr = R * (0.4 + Math.random() * 0.5); this.E(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6, { tex: Math.random() < 0.5 ? 'rock0' : 'rock1', n: 2, speed: 30, vz: 160, grav: 420, life: 0.9, spin: 10, add: false, bounce: 0.3 }); }
    fx.screenFlash(0xc8a070, 0.1);
  }

  // ---------- aura (golpes em si mesmo) ----------
  aura(user, mv, id, up = true) {
    const fx = this.fx, x = user.x, y = user.y, c = typeHex(mv.type);
    fx.ring(x, y, c, 8, 0.45, { width: 2, fill: 0.2 });
    fx.light(x, y - 10, c, 26, 0.4, 0.6);
    this.E(x, y - 4, { tex: 'glow', color: c, n: 14, speed: 18, size: 3, life: 0.8, vz: 60, grav: -30, jitter: 8 });
    this.E(x, y - 4, { tex: up ? 'arrowUp' : 'arrowDn', color: up ? 0x7ad0ff : 0xff8a7a, n: 3, speed: 4, life: 0.8, vz: up ? 50 : -10, z: up ? 4 : 30, add: false, jitter: 8 });
    if (id === 'harden' || id === 'withdraw' || id === 'defenseCurl') this.E(x, y - 10, { tex: 'twinkle', color: 0xffffff, n: 6, speed: 30, life: 0.4 });
    if (id === 'growth') this.E(x, y, { tex: 'leaf', n: 8, speed: 20, life: 0.9, vz: 60, spin: 8, add: false, jitter: 8 });
    if (id === 'focusEnergy') this.E(x, y, { frames: 'flame', n: 14, speed: 10, life: 0.6, vz: 50, add: false, jitter: 8, scale: 0.9 });
    if (id === 'splash') this.E(x, y, { tex: 'drop', n: 10, speed: 40, life: 0.6, vz: 120, grav: 400, add: false });
  }

  // ---------- investida: rastro ----------
  dash(u, mv, id, dt) {
    u.ghostT = (u.ghostT ?? 0) - dt;
    const t = mv.type, c = typeHex(t), x = u.x, y = u.y - (u.midH ?? 12);
    if (u.ghostT <= 0) { u.ghostT = 0.03; this.afterimage(u, c, 0.5, 0.22); }
    const R = (rate) => Math.floor(dt * rate + Math.random());
    if (t === 'fire') { for (let k = 0; k < R(80); k++) { const a = Math.random() * TAU; this.E(x + Math.cos(a) * u.r * 1.2, y + Math.sin(a) * u.r, { frames: 'flame', n: 1, speed: 10, life: 0.3, scale: 1, end: 0.3, add: false, vz: 20 }); } }
    else if (t === 'electric') { if (Math.random() < dt * 30) { const a = Math.random() * TAU; this.fx.bolt(x, y, x + Math.cos(a) * 14, y + Math.sin(a) * 12, 0xffe23a, 0.08, { amp: 3 }); } this.E(x, y, { tex: 'spark', color: 0xfff27a, n: R(30), speed: 40, life: 0.15, scale: 0.6 }); }
    else if (t === 'water') this.E(x, y + 6, { tex: 'drop', n: R(50), speed: 50, life: 0.45, vz: 80, grav: 380, add: false });
    else if (t === 'ghost' || t === 'dark') this.E(x, y, { tex: 'wisp', color: t === 'dark' ? 0x3a1a2a : 0x8a5ad0, n: R(40), speed: 10, life: 0.4, vz: 20, add: t === 'ghost' });
    else if (t === 'flying') { this.E(x, y, { tex: 'streak', color: 0xe8f6ff, n: R(40), speed: 20, life: 0.18, rot: 'dir' }); this.E(x, y, { tex: 'feather', n: R(6), speed: 30, life: 0.6, spin: 4, add: false }); }
    else { this.E(x, y, { tex: 'streak', color: 0xffffff, n: R(40), speed: 10, life: 0.16, alpha: 0.7 }); this.E(u.x, u.y, { tex: 'dust', n: R(14), speed: 10, life: 0.4, scale: 0.5, end: 1.2, add: false, alpha: 0.6 }); }
  }

  // ---------- nuvens que ficam ----------
  cloud(z, dt, A = {}) {
    const id = z.id, R = (rate) => Math.floor(dt * rate + Math.random());
    const col = A.cloudColor ?? { poisonPowder: 0xc070f0, sleepPowder: 0xa8f0c8, stunSpore: 0xffe86a, smokescreen: 0x9a9a9a, smog: 0x7a4a9a }[id] ?? z.color;
    const dense = A.cloudDense ?? (id === 'smokescreen' || id === 'smog');
    const rx = () => z.x + (Math.random() - 0.5) * z.r * 2, ry = () => z.y + (Math.random() - 0.5) * z.r * 1.1;
    this.E(rx(), ry(), { tex: 'smoke', color: col, n: R(dense ? 28 : 14), speed: 6, life: 1.1, scale: 0.9, end: 1.8, alpha: dense ? 0.75 : 0.5, add: false, vz: 4 });
    const t = A.cloudTex ?? 'twinkle';
    if (t !== 'smoke') this.E(rx(), ry() - 6, { tex: t, color: col, n: R(16), speed: 5, life: 0.9, vz: 10, scale: 0.8, spin: 3, add: !['feather', 'rock1', 'shard', 'puff', 'dust'].includes(t) });
  }

}
