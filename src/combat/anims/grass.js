import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

const drainFx = (c = 0x7dff8a, n = 10) => (v, x, y) => v.E(x, y, { tex: 'glow', color: c, n, size: 3, speed: 30, life: 0.6, vz: 20 });

// Planta
export default {
  vineWhip: { melee: ME('vine', { color: 0x3fa129 }), hit: IM.all(IM.type('grass', 0.9), IM.p({ tex: 'spark', color: 0xffffff, n: 6, speed: 90, life: 0.15, stretch: 0.01 })) },
  razorLeaf: { // Folha Navalha: folhas girando em curva
    head: H.tex('leaf', { scale: 1.5, spin: 22, halo: 0x7aff5a, haloScale: 0.7 }),
    trail: TR.all(TR.p({ tex: 'leaf2', speed: 20, life: 0.4, spin: 10, scale: 0.6, add: false }, 10), TR.p({ tex: 'streak', color: 0xb8ff9a, speed: 10, life: 0.12, alpha: 0.6 }, 30)),
    impact: IM.all(IM.type('grass', 0.8), IM.x(0xb8ff9a, 1.2)),
  },
  leafage: { head: H.tex('leaf2', { scale: 1.4, spin: 10, halo: 0x7aff5a, haloScale: 0.7 }), trail: TR.p({ tex: 'leaf2', speed: 15, life: 0.5, spin: 8, scale: 0.5, add: false }, 14), impact: IM.leaves(8, 'leaf2') },
  absorb: { head: H.orb(0xb8ff9a, 0.9), trail: TR.p({ tex: 'glow', color: 0x7dff8a, size: 2, speed: 6, life: 0.3 }, 30), impact: IM.all(IM.type('grass', 0.6), drainFx(0x7dff8a, 8)) },
  megaDrain: { head: H.orb(0x9aff7a, 1.2), trail: TR.all(TR.p({ tex: 'glow', color: 0x7dff8a, size: 3, speed: 8, life: 0.35 }, 40), TR.ring(0x7dff8a, 0.1, 3)), impact: IM.all(IM.type('grass', 0.9), drainFx(0x7dff8a, 14)) },
  gigaDrain: { data: D('Gigadreno', 'grass', 'spec', 75, 'target', { eff: { drain: 0.5 } }), target: (v, t, x, y) => { for (let k = 0; k < 3; k++) v.fx.ring(x, y, 0x7dff8a, 16 - k * 4, 0.4 + k * 0.1, { width: 2, squash: 1, mult: 0.2 }); v.E(x, y, { tex: 'glow', color: 0x9aff7a, n: 24, size: 4, speed: 70, life: 0.7, drag: 1 }); v.fx.light(x, y, 0x7dff8a, 40, 0.4); } },
  solarBeam: { // Raio Solar: carrega luz e solta um feixe largo
    data: D('Raio Solar', 'grass', 'spec', 120, 'proj', { range: 10, cd: 4.5 }),
    beam: { dur: 0.9, width: 14, speed: 900, tick: 0.1, share: 1.4, range: 9.5, charge: 1.0, colors: [0x7aff5a, 0xfff6a0, 0xffffff], style: 'solar' },
    charge: (v, u, k, dt) => { const y = u.y - 14; for (let i = R(dt, 50); i > 0; i--) { const a = Math.random() * 6.28, r = 26 + Math.random() * 10; v.E(u.x + Math.cos(a) * r, y + Math.sin(a) * r, { tex: 'twinkle', color: 0xfff6a0, n: 1, speed: r / 0.3, dir: a + Math.PI, spread: 0, drag: 0, life: 0.3 }); } v.fx.light(u.x, y, 0xfff6a0, 10 + k * 30, 0.06, 0.8); },
  },
  leechSeed: { head: H.tex('ball', { tint: 0x8a6a2a, scale: 0.8, halo: 0x7aff5a, haloScale: 0.5, spin: 6 }), trail: TR.p({ tex: 'px', color: 0x5a8a2a, speed: 5, life: 0.3, add: false }, 30), impact: IM.all(IM.leaves(5, 'leaf2'), (v, x, y, d, P, gy) => { for (let i = 0; i < 6; i++) v.fx.bolt(x, gy ?? y + 8, x + (Math.random() - 0.5) * 20, y - 10 + Math.random() * 8, 0x3fa129, 0.5, { amp: 3, width: 1.2, seg: 5 }); }) },
  sleepPowder: { cloudColor: 0x9ad8ff, cloudTex: 'twinkle' },
  stunSpore: { cloudColor: 0xffe86a, cloudTex: 'spark' },
  petalDance: { // Dança das Pétalas: redemoinho de pétalas em volta
    data: D('Dança das Pétalas', 'grass', 'spec', 120, 'wave', { range: 5 }),
    wave: (v, u, R0) => { for (let i = 0; i < 60; i++) { const a = i / 60 * 12.56; v.g.later(i * 0.008, () => v.E(u.x + Math.cos(a) * 10, u.y - 10 + Math.sin(a) * 6, { tex: 'petal', n: 1, speed: R0 * 1.8, dir: a, spread: 0.3, life: 0.7, spin: 10, add: false, drag: 1.2 })); } v.fx.ring(u.x, u.y, 0xff8fc8, R0 / 3.2, 0.5, { width: 2 }); },
  },
  energyBall: { data: D('Bola de Energia', 'grass', 'spec', 90, 'proj', { speed: 14, range: 12 }), head: { ...H.orb(0xd8ffb0, 1.6, 0x5ad83a), draw: DRAW.rings(0x9aff7a, 2, 7) }, trail: TR.p({ tex: 'glow', color: 0x9aff7a, size: 4, speed: 12, life: 0.3 }, 50), impact: IM.all(IM.type('grass', 1.3), IM.shock(0x7aff5a, 30), IM.light(0x9aff7a, 50)) },
  leafBlade: { data: D('Lâmina de Folha', 'grass', 'phys', 90, 'melee', { range: 2.2, critUp: 1 }), melee: ME('slash', { color: 0x5ad83a, glow: 'leaf' }), hit: IM.all(IM.type('grass', 1.2), IM.x(0x9aff7a, 2)) },
  seedBomb: { data: D('Bomba de Sementes', 'grass', 'phys', 80, 'proj', { speed: 14, range: 11 }), head: H.tex('ball', { tint: 0x7a5a2a, scale: 1.3, halo: 0x5ad83a, haloScale: 0.8, spin: 8 }), trail: TR.p({ tex: 'dirt', speed: 10, life: 0.3, add: false }, 20), impact: IM.all(IM.boom(0x9aff7a, 0.8), IM.leaves(10)) },
  magicalLeaf: { data: D('Folha Mágica', 'grass', 'spec', 60, 'proj', { speed: 15, range: 12 }), count: 3, spread: 0.5, head: H.tex('leaf', { scale: 1.3, spin: 16, halo: 0xff8fe0, haloScale: 1 }), trail: TR.p({ tex: 'twinkle', color: 0xffb8f0, speed: 15, life: 0.4 }, 30), impact: IM.all(IM.type('grass'), IM.stars(0xffb8f0, 6)) },
  leafStorm: { data: D('Tempestade de Folhas', 'grass', 'spec', 130, 'cone', { range: 7, eff: { stat: 'spa', by: -2, self: true, chance: 1 } }), cone: (v, u, dx, dy, R0) => { const a0 = Math.atan2(dy, dx); v.E(u.x + dx * 8, u.y - 8, { tex: 'leaf', n: 50, speed: R0 * 2.6, dir: a0, spread: 0.9, life: 0.55, spin: 16, add: false, drag: 1.2 }); v.E(u.x + dx * 8, u.y - 8, { tex: 'leaf2', n: 30, speed: R0 * 2.2, dir: a0, spread: 1.1, life: 0.6, spin: 16, add: false, drag: 1.2 }); v.E(u.x + dx * 8, u.y - 8, { tex: 'streak', color: 0xb8ff9a, n: 30, speed: R0 * 2.8, dir: a0, spread: 0.9, life: 0.3, rot: 'dir' }); v.fx.kick(0.3, 0.05); } },
  bulletSeed: { data: D('Projétil de Sementes', 'grass', 'phys', 25, 'proj', { speed: 24, range: 10 }), count: 5, spread: 0.08, gap: 0.06, head: H.tex('ball', { tint: 0xc8a050, scale: 0.7, halo: 0x9aff7a, haloScale: 0.5 }), trail: TR.p({ tex: 'streak', color: 0xd8c080, speed: 5, life: 0.1 }, 40), impact: IM.p({ tex: 'dirt', n: 4, speed: 50, life: 0.4, grav: 300, vz: 40, add: false }) },
  synthesis: { data: D('Síntese', 'grass', 'status', 0, 'self', { eff: { heal: 0.5, self: true } }), self: SELF.rise(0x9aff7a, 'twinkle', true, (v, u) => { v.fx.light(u.x, u.y - 30, 0xfff6a0, 50, 0.8, 1); v.E(u.x, u.y - 40, { tex: 'glow', color: 0xfff6a0, n: 20, size: 3, speed: 10, life: 0.8, vz: -40, jitter: 12 }); }) },
  growth: { self: SELF.rise(0x7aff5a, 'leaf', true, (v, u) => v.E(u.x, u.y, { tex: 'leaf2', n: 10, speed: 20, life: 0.9, vz: 60, spin: 8, add: false, jitter: 8 })) },
  cottonSpore: { data: D('Esporo de Algodão', 'grass', 'status', 0, 'cloud', { eff: { stat: 'spe', by: -2 } }), cloudColor: 0xffffff, cloudTex: 'puff' },
};
