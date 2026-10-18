import { D, H, TR, IM, ME, SELF, R } from './kit.js';

const snowCone = (n, speedK, extra) => (v, u, dx, dy, R0) => { const a0 = Math.atan2(dy, dx); v.E(u.x + dx * 8, u.y - 8, { tex: 'twinkle', color: 0xffffff, n, speed: R0 * speedK, dir: a0, spread: 1, life: 0.5, drag: 1.2 }); v.E(u.x + dx * 8, u.y - 8, { tex: 'puff', color: 0xe8f8ff, n: Math.round(n / 3), speed: R0 * speedK * 0.8, dir: a0, spread: 1, life: 0.55, scale: 0.6, end: 1.4, alpha: 0.6, add: false, drag: 1.2 }); extra?.(v, u, dx, dy, R0, a0); };

// Gelo
export default {
  iceShard: { head: H.tex('ice', { scale: 1.6, orient: true, rotOff: Math.PI / 2, halo: 0x8ff0ff, haloScale: 0.8 }), trail: TR.p({ tex: 'twinkle', color: 0xcff8ff, speed: 18, life: 0.35, add: true }, 30), impact: IM.all(IM.type('ice', 0.9), IM.frost(0.6)) },
  iceBeam: { // Raio de Gelo: feixe que congela o chão
    data: D('Raio de Gelo', 'ice', 'spec', 90, 'proj', { range: 9, eff: { status: 'frz', chance: 0.1 } }),
    beam: { dur: 0.85, width: 6, speed: 800, tick: 0.1, share: 1.4, range: 8.5, colors: [0x3ab8ff, 0x9ef0ff, 0xffffff], style: 'ice', freeze: true },
    charge: (v, u, k) => v.E(u.x, u.y - 10, { tex: 'twinkle', color: 0xcff8ff, n: 1, speed: 20, life: 0.3, jitter: 10 }),
  },
  blizzard: { // Nevasca: tempestade de neve em leque largo
    data: D('Nevasca', 'ice', 'spec', 110, 'cone', { range: 7.5, eff: { status: 'frz', chance: 0.1 } }),
    cone: snowCone(70, 2.8, (v, u, dx, dy, R0, a0) => { v.E(u.x + dx * 8, u.y - 8, { tex: 'ice', n: 20, speed: R0 * 2.4, dir: a0, spread: 1, life: 0.5, spin: 10, add: false, drag: 1 }); v.fx.screenFlash(0xd8f8ff, 0.25); for (let k = 1; k <= 3; k++) v.fx.decal('splat', u.x + dx * R0 * k / 3, u.y + dy * R0 * k / 3, { tint: 0xe8fbff, alpha: 0.85, life: 12, scale: 1.2 }); }),
  },
  icePunch: { data: D('Soco de Gelo', 'ice', 'phys', 75, 'melee', { eff: { status: 'frz', chance: 0.1 } }), melee: ME('fist', { color: 0x8ff0ff, glow: 'twinkle' }), hit: IM.all(IM.type('ice', 1.2), IM.frost(0.8)) },
  iceFang: { data: D('Presa de Gelo', 'ice', 'phys', 65, 'melee', { eff: { status: 'frz', chance: 0.1, flinch: 0.1 } }), melee: ME('fang', { color: 0x8ff0ff, glow: 'twinkle' }), hit: IM.all(IM.type('ice'), IM.p({ tex: 'ice', n: 6, speed: 60, life: 0.5, spin: 8, grav: 200, vz: 40, add: false })) },
  powderSnow: { data: D('Neve em Pó', 'ice', 'spec', 40, 'cone', { range: 5.5, eff: { status: 'frz', chance: 0.1 } }), cone: snowCone(30, 2.2) },
  icyWind: { data: D('Vento Congelante', 'ice', 'spec', 55, 'cone', { range: 6.5, eff: { stat: 'spe', by: -1, chance: 1 } }), cone: snowCone(30, 2.6, (v, u, dx, dy, R0, a0) => v.E(u.x + dx * 8, u.y - 8, { tex: 'streak', color: 0xbff4ff, n: 26, speed: R0 * 2.8, dir: a0, spread: 0.9, life: 0.3, rot: 'dir', stretch: 0.004 })) },
  auroraBeam: { data: D('Raio Aurora', 'ice', 'spec', 65, 'proj', { range: 9, eff: { stat: 'atk', by: -1, chance: 0.1 } }), beam: { dur: 0.7, width: 6, speed: 800, tick: 0.1, share: 1.3, range: 8, colors: [0xff8fe0, 0x9ef0ff, 0xffffff], style: 'aurora' } },
  avalanche: { data: D('Avalanche', 'ice', 'phys', 60, 'rain', { range: 9 }), rainTex: ['ice', 'ice'], rainScale: 2.4 },
  frostBreath: { data: D('Sopro Gelado', 'ice', 'spec', 60, 'cone', { range: 6, critUp: 3 }), cone: snowCone(40, 2.4, (v, u, dx, dy, R0, a0) => v.E(u.x + dx * 8, u.y - 8, { tex: 'glow', color: 0x9ef0ff, n: 30, size: 5, speed: R0 * 2.2, dir: a0, spread: 0.8, life: 0.4 })) },
  haze: { data: D('Névoa', 'ice', 'status', 0, 'self', {}), self: (v, u) => { v.E(u.x, u.y - 8, { tex: 'smoke', color: 0xd8e8f0, n: 30, speed: 60, life: 1.6, scale: 1, end: 2.5, alpha: 0.6, add: false, drag: 1 }); for (const k in u.stages) u.stages[k] = 0; } },
  mist: { data: D('Neblina', 'ice', 'status', 0, 'self', { eff: { stat: 'def', by: 1, self: true } }), self: SELF.rise(0xcff8ff, 'twinkle', true, (v, u) => v.E(u.x, u.y - 8, { tex: 'smoke', color: 0xe8f8ff, n: 14, speed: 30, life: 1.4, scale: 0.8, end: 2, alpha: 0.5, add: false })) },
};
