// Kit de blocos para montar a animação de cada golpe em fases:
//   charge (preparação no usuário) → cast (saída) → head/trail (viagem) → impact (impacto) → after (resto no chão)
// Também: melee (corpo a corpo), cone, wave, self, dash, beam, bolt, sky, surf, target, shield.
// Cada golpe combina blocos com parâmetros próprios (cor, forma, tamanho, quantidade), para não ficarem iguais.

const TAU = Math.PI * 2;
export const R = (dt, rate) => Math.floor(dt * rate + Math.random());

// ---------- dados de golpes que ainda não existem em data/moves.js ----------
const RANGE = { proj: 12, melee: 1.8, multi: 1.8, dash: 6, cone: 6, wave: 6, quake: 5, cloud: 9, rain: 10, self: 0, bolt: 8, sky: 11, surf: 9, target: 9, shield: 0 };
export function D(name, type, cat, power, kind, extra = {}) {
  const cd = cat === 'status' ? 5 : +(0.45 + (power ?? 40) * 0.026).toFixed(2);
  return { name, type, cat, power: cat === 'status' ? undefined : power, kind, range: RANGE[kind] ?? 8, cd, ...extra };
}

// ---------- cabeças de projétil ----------
export const H = {
  orb: (tint, scale = 1.2, halo = tint, o = {}) => ({ tex: 'ball', tint, scale, halo, haloScale: scale * 1.25, add: true, ...o }),
  tex: (tex, o = {}) => ({ tex, scale: 1.3, tint: 0xffffff, halo: 0xffffff, haloScale: 1.1, add: false, ...o }),
  flame: (scale = 1.5, o = {}) => ({ frames: 'flame', scale, halo: 0xff6a1a, haloScale: scale * 1.25, add: false, ...o }),
  bflame: (scale = 1.5, o = {}) => ({ frames: 'bflame', scale, halo: 0x7a5aff, haloScale: scale * 1.25, add: true, ...o }),
  none: (halo = 0xffffff, haloScale = 1) => ({ tex: 'px', scale: 0.01, halo, haloScale, add: true }),
};

// desenhos por quadro (GA = aditivo, GN = normal)
export const DRAW = {
  // esfera escura com borda que gira (Bola Sombria, Bomba de Lodo, Esfera de Aura...)
  sphere: (dark, rim, r = 6, spikes = 3) => (GA, GN, p, t) => {
    GN.circle(p.x, p.y, r).fill({ color: dark, alpha: 0.95 });
    GN.circle(p.x - r * 0.3, p.y - r * 0.3, r * 0.35).fill({ color: rim, alpha: 0.45 });
    for (let i = 0; i < spikes; i++) { const a = t * 9 + i * TAU / spikes; GA.arc(p.x, p.y, r + 1.5, a, a + 1.4).stroke({ width: 1.6, color: rim, alpha: 0.9 }); }
    GA.circle(p.x, p.y, r + 3 + Math.sin(t * 30)).stroke({ width: 1, color: rim, alpha: 0.35 });
  },
  // dragão de energia: corpo serpenteando pelo rastro, cabeça com chifres
  dragon: (c1, c2) => (GA, GN, p, t) => {
    const h = p.hist; if (!h || h.length < 4) return;
    for (let i = 1; i < h.length; i++) { const k = i / h.length; GA.moveTo(h[i - 1].x, h[i - 1].y).lineTo(h[i].x, h[i].y).stroke({ width: 1 + k * 7, color: i % 2 ? c1 : c2, alpha: 0.35 + 0.6 * k, cap: 'round' }); }
    const a = Math.atan2(p.vy, p.vx), ca = Math.cos(a), sa = Math.sin(a);
    GA.circle(p.x, p.y, 5).fill({ color: c2, alpha: 0.9 });
    for (const s of [-1, 1]) GA.moveTo(p.x - ca * 2 + -sa * 3 * s, p.y - sa * 2 + ca * 3 * s).lineTo(p.x - ca * 9 + -sa * 7 * s, p.y - sa * 9 + ca * 7 * s).stroke({ width: 1.5, color: 0xffffff, alpha: 0.9 });
    GA.circle(p.x + ca * 2 - sa * 2, p.y + sa * 2 + ca * 2, 1).fill({ color: 0xffffff }); GA.circle(p.x + ca * 2 + sa * 2, p.y + sa * 2 - ca * 2, 1).fill({ color: 0xffffff });
  },
  // lâminas em X (Lâmina de Ar, Tesoura X)
  cross: (c, r = 7) => (GA, GN, p, t) => {
    const a = Math.atan2(p.vy, p.vx);
    for (const s of [-1, 1]) { const b = a + s * 0.8; GA.arc(p.x - Math.cos(b) * r * 0.6, p.y - Math.sin(b) * r * 0.6, r, b - 1, b + 1).stroke({ width: 2.2, color: c, alpha: 0.95 }); GA.arc(p.x - Math.cos(b) * r * 0.6, p.y - Math.sin(b) * r * 0.6, r, b - 0.6, b + 0.6).stroke({ width: 1, color: 0xffffff }); }
  },
  // crescente de vento (Cortador de Ar, Lâmina de Folha)
  crescent: (c, r = 8) => (GA, GN, p) => { const a = Math.atan2(p.vy, p.vx); GA.arc(p.x - Math.cos(a) * r * 0.7, p.y - Math.sin(a) * r * 0.7, r, a - 1.1, a + 1.1).stroke({ width: 2.5, color: c, alpha: 0.9 }); GA.arc(p.x - Math.cos(a) * r * 0.7, p.y - Math.sin(a) * r * 0.7, r, a - 0.7, a + 0.7).stroke({ width: 1, color: 0xffffff }); },
  // estrela de 5 pontas girando (Velocidade)
  star: (c, r = 5) => (GA, GN, p, t) => { const pts = []; for (let i = 0; i < 10; i++) { const a = t * 10 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); } GA.poly(pts).fill({ color: c, alpha: 0.95 }); GA.poly(pts).stroke({ width: 1, color: 0xffffff }); },
  // anéis que pulsam em volta (Supersônico, Onda Psíquica)
  rings: (c, n = 3, r = 6) => (GA, GN, p, t) => { for (let i = 0; i < n; i++) { const k = ((t * 3 + i / n) % 1); GA.circle(p.x, p.y, 2 + k * r).stroke({ width: 1.3, color: c, alpha: 1 - k }); } },
  // bola elétrica com faíscas presas
  electro: (r = 6) => (GA, GN, p, t) => { GA.circle(p.x, p.y, r).fill({ color: 0xffe23a, alpha: 0.5 }); GA.circle(p.x, p.y, r * 0.55).fill({ color: 0xffffff, alpha: 0.9 }); for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, b = a + (Math.random() - 0.5) * 1.5; GA.moveTo(p.x + Math.cos(a) * r * 0.5, p.y + Math.sin(a) * r * 0.5).lineTo(p.x + Math.cos(b) * r * 1.4, p.y + Math.sin(b) * r * 1.4).stroke({ width: 1, color: 0xfff6a0 }); } },
  // lua (Explosão Lunar)
  moon: (r = 7) => (GA, GN, p, t) => { GA.circle(p.x, p.y, r + 3).fill({ color: 0xff8fe0, alpha: 0.3 }); GA.circle(p.x, p.y, r).fill({ color: 0xffe8fa, alpha: 0.95 }); GN.circle(p.x + r * 0.45, p.y - r * 0.2, r * 0.75).fill({ color: 0xd890e0, alpha: 0.5 }); },
};

// ---------- rastros ----------
export const TR = {
  p: (o, rate) => (v, p, dt) => v.E(p.x, p.y, { ...o, n: R(dt, rate) }),
  back: (o, rate) => (v, p, dt) => v.E(p.x, p.y, { ...o, dir: Math.atan2(p.vy, p.vx) + Math.PI, n: R(dt, rate) }),
  type: () => (v, p, dt) => v.trail(p, dt),
  all: (...f) => (v, p, dt) => { for (const fn of f) fn(v, p, dt); },
  ring: (c, every = 0.07, r = 3, o = {}) => (v, p, dt) => { if ((p.rt = (p.rt ?? 0) - dt) <= 0) { p.rt = every; v.fx.ring(p.x, p.y, c, r, 0.3, { squash: 1, width: 1.2, ...o }); } },
  bolt: (c = 0xffe23a, every = 0.035) => (v, p, dt) => { if ((p.bt = (p.bt ?? 0) - dt) <= 0) { p.bt = every; v.fx.bolt(p.lx ?? p.x, p.ly ?? p.y, p.x, p.y, c, 0.1, { amp: 4 }); p.lx = p.x; p.ly = p.y; } },
  chain: (c = 0xffe23a) => (v, p) => { if (Math.random() < 0.5) v.fx.bolt(p.ox, p.oy, p.x, p.y, c, 0.05, { amp: 5 }); },
};

// ---------- impactos ----------
export const IM = {
  type: (t, k = 1) => (v, x, y, dir, P, gy) => v.impact(t, x, y, dir, P * k, gy),
  all: (...f) => (v, x, y, dir, P, gy) => { for (const fn of f) fn(v, x, y, dir, P, gy); },
  p: (o) => (v, x, y) => v.E(x, y, o),
  shock: (c, r = 30, life = 0.35) => (v, x, y, dir, P, gy) => v.fx.shock(x, gy ?? y + 8, c, r * Math.min(1.6, P), life),
  ring: (c, r = 10, n = 1, life = 0.35) => (v, x, y, dir, P) => { for (let i = 0; i < n; i++) v.fx.ring(x, y, c, r * (1 + i * 0.5), life + i * 0.08, { width: 2, squash: 1 }); },
  flash: (c = 0xffffff, a = 0.2) => (v) => v.fx.screenFlash(c, a),
  kick: (s = 0.3, st = 0.06) => (v) => v.fx.kick(s, st),
  light: (c, r = 40) => (v, x, y) => v.fx.light(x, y, c, r, 0.25, 1),
  // estrela de fogo em forma de 大 (Rajada de Fogo)
  kanji: () => (v, x, y) => {
    const arms = [[0, -1, 26], [-1, -0.15, 22], [1, -0.15, 22], [-0.75, 0.9, 24], [0.75, 0.9, 24]];
    for (const [ax, ay, L] of arms) for (let s = 0; s <= L; s += 3) v.E(x + ax * s, y + ay * s, { frames: 'flame', n: 1, speed: 6, life: 0.55 + s / 80, scale: 1.4 - s / 50, end: 0.4, add: false, vz: 10 });
    v.fx.light(x, y, 0xff8a2a, 44, 0.4, 0.5);
  },
  // explosão grande com fumaça (Investida Flamejante, Explosão, Giga Impacto)
  boom: (c, P0 = 1.6) => (v, x, y, dir, P, gy) => {
    const k = P0 * Math.max(1, P * 0.7);
    v.E(x, y, { tex: 'impact', color: 0xffffff, n: 1, speed: 0, scale: 1.6 * k, end: 3, life: 0.14 });
    v.E(x, y, { tex: 'glow', color: c, n: Math.round(9 * k), speed: 140 * k, size: 5, life: 0.35, end: 0.3, drag: 4, alpha: 0.7 });
    v.E(x, y, { tex: 'smoke', n: Math.round(6 * k), speed: 50 * k, life: 1.1, scale: 1, end: 2.6, alpha: 0.6, add: false, color: 0x777777, drag: 3, vz: 20 });
    v.E(x, y, { tex: 'spark', color: 0xffffff, n: 16, speed: 200 * k, life: 0.3, stretch: 0.012, drag: 4 });
    v.fx.shock(x, gy ?? y + 8, c, 34 * k, 0.45); v.fx.light(x, y, c, 40 * k, 0.3, 0.55); v.fx.screenFlash(c, 0.1); v.fx.kick(0.45, 0.1);
  },
  pop: (c = 0xbfe6ff) => (v, x, y) => { v.fx.ring(x, y, c, 3, 0.18, { squash: 1, width: 1.5 }); v.E(x, y, { tex: 'drop', n: 5, speed: 50, life: 0.4, vz: 50, grav: 300, add: false, scale: 0.7 }); },
  frost: (k = 1) => (v, x, y, dir, P, gy) => { v.fx.decal('splat', x, gy ?? y + 8, { tint: 0xd8f8ff, alpha: 0.8, life: 10, scale: 0.8 * k }); v.E(x, gy ?? y + 8, { tex: 'ice', n: Math.round(5 * k), speed: 20, life: 1.2, add: false, vz: 40, grav: 300, fade: 'late' }); },
  leaves: (n = 8, tex = 'leaf') => (v, x, y) => v.E(x, y, { tex, n, speed: 80, life: 0.8, spin: 12, grav: 80, vz: 60, add: false, drag: 3 }),
  petals: (n = 12) => (v, x, y) => v.E(x, y, { tex: 'petal', n, speed: 70, life: 1.1, spin: 8, grav: 40, vz: 40, add: false, drag: 2 }),
  claws: (c = 0xffffff, scale = 2.2, rot = -0.5) => (v, x, y, dir) => { v.E(x, y, { tex: 'claw', color: c, n: 1, speed: 0, scale, end: scale * 1.15, life: 0.22, rot: dir + rot, add: true }); v.E(x, y, { tex: 'claw', color: 0xffffff, n: 1, speed: 0, scale: scale * 0.7, life: 0.12, rot: dir + rot, add: true }); },
  x: (c = 0xffffff, scale = 2) => (v, x, y) => { for (const r of [0.78, -0.78]) v.E(x, y, { tex: 'slash', color: c, n: 1, speed: 0, scale, end: scale * 1.3, life: 0.22, rot: r }); },
  stars: (c, n = 10) => (v, x, y) => v.E(x, y, { tex: 'star', color: c, n, speed: 90, life: 0.6, spin: 8 }),
  goo: (c = 0x8a3ac0) => (v, x, y, dir, P, gy) => { v.fx.decal('splat', x, gy ?? y + 8, { tint: c, alpha: 0.75, life: 8, scale: 0.9 }); v.E(x, y, { tex: 'goo', n: 8, speed: 70, life: 0.8, vz: 80, grav: 320, add: false }); },
  bolts: (n = 5, L = 22, c = 0xffe23a) => (v, x, y) => { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, l = L * (0.5 + Math.random() * 0.6); v.fx.bolt(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.8, c, 0.18, { amp: 4 }); } },
  rocks: (n = 8, tex = 'rock0') => (v, x, y) => v.E(x, y, { tex, n, speed: 90, life: 1, spin: 12, grav: 380, vz: 130, add: false, bounce: 0.35 }),
  crater: (s = 0.8) => (v, x, y, dir, P, gy) => v.fx.decal('crater', x, gy ?? y + 8, { scale: s, life: 30 }),
  scorch: (s = 0.8) => (v, x, y, dir, P, gy) => v.fx.decal('scorch', x, gy ?? y + 8, { scale: s, alpha: 0.9, life: 25 }),
  smoke: (c = 0x777777, n = 5, a = 0.5) => (v, x, y) => v.E(x, y, { tex: 'smoke', n, speed: 30, life: 1.1, scale: 0.8, end: 2.2, vz: 25, alpha: a, add: false, color: c }),
  wisps: (c, n = 8, add = true) => (v, x, y) => v.E(x, y, { tex: 'wisp', color: c, n, speed: 60, life: 0.7, vz: 30, add, end: 0.3 }),
  notes: (c = 0xffffff, n = 6) => (v, x, y) => v.E(x, y, { tex: 'note', color: c, n, speed: 50, life: 0.8, vz: 30, add: false }),
  hearts: (n = 6) => (v, x, y) => v.E(x, y, { tex: 'heart', color: 0xff8fd8, n, speed: 50, life: 0.8, vz: 30 }),
};

// ---------- corpo a corpo ----------
// estilos: claw, slash, bite, fang, stab, whip, chop, blunt, fist, tail, drill, ghost, horn
export const ME = (style, o = {}) => ({ style, ...o });

// ---------- auras (golpes em si mesmo) ----------
export const SELF = {
  rise: (c, tex = 'glow', up = true, extra = null) => (v, u) => {
    v.fx.ring(u.x, u.y, c, 8, 0.45, { width: 2, fill: 0.2 }); v.fx.light(u.x, u.y - 10, c, 28, 0.4, 0.6);
    v.E(u.x, u.y - 4, { tex, color: c, n: 14, speed: 18, size: 3, scale: tex === 'glow' ? undefined : 0.9, life: 0.9, vz: 60, grav: -30, jitter: 8, add: true });
    v.E(u.x, u.y - 4, { tex: up ? 'arrowUp' : 'arrowDn', color: up ? 0x7ad0ff : 0xff8a7a, n: 3, speed: 4, life: 0.8, vz: up ? 50 : -10, z: up ? 4 : 30, add: false, jitter: 8 });
    extra?.(v, u);
  },
};
