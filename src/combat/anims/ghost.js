import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

// Fantasma e Sombrio
export default {
  lick: { melee: ME('lick', { color: 0xff8ab0 }), hit: IM.all(IM.type('ghost', 0.8), IM.p({ tex: 'goo', n: 4, speed: 30, life: 0.5, grav: 200, add: false, scale: 0.6 })) },
  astonish: { melee: ME('ghost', { color: 0x9a6ae0 }), hit: IM.all(IM.type('ghost', 0.8), IM.p({ tex: 'impact', color: 0xd0b0ff, n: 1, speed: 0, scale: 1.4, end: 2.2, life: 0.12 })) },
  shadowSneak: { dashStart: (v, u) => { u.sneakT = 0.3; }, dash: (v, u, dt) => { v.E(u.x, u.y, { tex: 'wisp', color: 0x3a1a5a, n: R(dt, 60), speed: 10, life: 0.4, vz: 15, add: false, scale: 1.2 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.04; v.afterimage(u, 0x6a3aaa, 0.5, 0.25); } }, impact: IM.all(IM.type('ghost', 1.1), IM.wisps(0x8a5ad0, 10)) },
  shadowBall: { // Bola Sombria: esfera escura girando
    data: D('Bola Sombria', 'ghost', 'spec', 80, 'proj', { speed: 14, range: 12, eff: { stat: 'spd', by: -1, chance: 0.2 } }),
    head: { ...H.none(0x6a3aaa, 1.8), draw: DRAW.sphere(0x1a0a2a, 0xa07aff, 6, 3) },
    trail: TR.all(TR.p({ tex: 'wisp', color: 0x4a2a7a, speed: 12, life: 0.45, vz: 10, add: false, scale: 0.9, end: 0.3 }, 40), TR.p({ tex: 'glow', color: 0x8a5ad0, size: 3, speed: 10, life: 0.3 }, 30)),
    impact: IM.all(IM.boom(0x6a3aaa, 0.9), IM.wisps(0x9a6ae0, 12)),
  },
  shadowClaw: { data: D('Garra Sombria', 'ghost', 'phys', 70, 'melee', { critUp: 1 }), melee: ME('claw', { color: 0x6a3aaa }), hit: IM.all(IM.type('ghost'), IM.claws(0x9a6ae0, 2.4)) },
  nightShade: { data: D('Sombra Noturna', 'ghost', 'spec', 60, 'target', { range: 9 }), target: (v, t, x, y) => { t.wobble = 0.5; v.fx.screenFlash(0x2a0a3a, 0.25); for (let i = 0; i < 6; i++) v.fx.bolt(x + (Math.random() - 0.5) * 40, y - 60, x, y, 0x8a2a5a, 0.3, { amp: 6, width: 2 }); v.E(x, y, { tex: 'wisp', color: 0x2a0a3a, n: 14, speed: 40, life: 0.8, add: false, vz: 20 }); } },
  hex: { data: D('Feitiço', 'ghost', 'spec', 65, 'target', { range: 9 }), target: (v, t, x, y) => { for (let i = 0; i < 3; i++) v.fx.ring(x, y + 4, 0x9a6ae0, 5 + i * 3, 0.6, { width: 2, squash: 0.5 }); v.E(x, y - 6, { tex: 'swirl', color: 0xc8a0ff, n: 4, speed: 30, life: 0.6, spin: 10 }); v.E(x, y, { tex: 'wisp', color: 0x9a6ae0, n: 10, speed: 50, life: 0.6, add: true, vz: 30 }); } },
  confuseRay: { data: D('Raio Confuso', 'ghost', 'status', 0, 'proj', { speed: 10, range: 10, eff: { confuse: 1 } }), head: H.orb(0xfff6a0, 1, 0xffd84a, { pulse: 0.4 }), trail: TR.p({ tex: 'twinkle', color: 0xffe27a, speed: 20, life: 0.5 }, 30), impact: IM.p({ tex: 'twinkle', color: 0xffe27a, n: 10, speed: 30, life: 0.8 }) },
  phantomForce: { data: D('Força Fantasma', 'ghost', 'phys', 90, 'dig', { range: 8 }) },
  // Sombrio
  bite: { melee: ME('bite', { color: 0xffffff }), hit: IM.all(IM.type('dark', 0.9), IM.p({ tex: 'impact', color: 0xffffff, n: 1, speed: 0, scale: 1.2, end: 1.8, life: 0.1 })) },
  crunch: { data: D('Triturar', 'dark', 'phys', 80, 'melee', { eff: { stat: 'def', by: -1, chance: 0.2 } }), melee: ME('bite', { color: 0xff5a6a, big: true }), hit: IM.all(IM.type('dark', 1.3), IM.shock(0x8a2a3a, 24), IM.rocks(4, 'rock1')) },
  pursuit: { dash: (v, u, dt) => { v.E(u.x, u.y - 8, { tex: 'wisp', color: 0x2a1a2a, n: R(dt, 50), speed: 10, life: 0.3, add: false }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0x6a2a3a, 0.5, 0.2); } }, impact: IM.type('dark', 1) },
  darkPulse: { data: D('Pulso Sombrio', 'dark', 'spec', 80, 'wave', { range: 6, eff: { flinch: 0.2 } }), wave: (v, u, R0) => { for (let i = 0; i < 4; i++) v.g.later(i * 0.06, () => { v.fx.ring(u.x, u.y - 8, 0x8a2a5a, R0 / 3.2 * (0.5 + i * 0.18), 0.35, { width: 3, squash: 0.8 }); }); v.E(u.x, u.y - 8, { tex: 'wisp', color: 0x2a0a1a, n: 30, speed: R0 * 2, life: 0.45, add: false, drag: 1.5 }); v.fx.screenFlash(0x3a0a2a, 0.15); } },
  nightSlash: { data: D('Corte Noturno', 'dark', 'phys', 70, 'melee', { critUp: 1 }), melee: ME('slash', { color: 0x8a2a5a, dark: true }), hit: IM.all(IM.type('dark'), IM.p({ tex: 'slash', color: 0xff3a5a, n: 1, speed: 0, scale: 2.6, end: 3, life: 0.18, rot: -0.5 }), IM.flash(0x1a0a1a, 0.15)) },
  suckerPunch: { data: D('Soco Sorrateiro', 'dark', 'phys', 70, 'dash', { range: 5 }), dash: (v, u, dt) => { if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.02; v.afterimage(u, 0x3a1a2a, 0.7, 0.15); } }, impact: IM.all(IM.type('dark', 1.1), IM.p({ tex: 'impact', color: 0xff5a6a, n: 1, speed: 0, scale: 1.6, end: 2.4, life: 0.12 })) },
  feintAttack: { data: D('Ataque Fingido', 'dark', 'phys', 60, 'dash', { range: 6 }), dashStart: (v, u) => { v.afterimage(u, 0x6a2a3a, 0.8, 0.4); }, dash: (v, u, dt) => { if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.05; v.afterimage(u, 0x3a1a2a, 0.4, 0.2); } }, impact: IM.type('dark', 1) },
  snarl: { data: D('Rosnado Feroz', 'dark', 'spec', 55, 'cone', { range: 5.5, eff: { stat: 'spa', by: -1, chance: 1 } }), cone: (v, u, dx, dy, R0) => { for (let k = 0; k < 3; k++) v.fx.ring(u.x + dx * 10 * k, u.y - 8 + dy * 10 * k, 0xa03a4a, 6 + k * 4, 0.3 + k * 0.08, { width: 2 }); v.E(u.x, u.y - 8, { tex: 'wisp', color: 0x5a1a2a, n: 16, speed: R0 * 2, dir: Math.atan2(dy, dx), spread: 1, life: 0.4, add: false }); } },
  scaryFace: {}, leer: {},
};
