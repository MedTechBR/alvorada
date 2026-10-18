import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

const featherDash = (c = 0xe8f6ff) => (v, u, dt) => { v.E(u.x, u.y - 10 - u.z, { tex: 'streak', color: c, n: R(dt, 50), speed: 20, life: 0.18, rot: 'dir' }); v.E(u.x, u.y - 10 - u.z, { tex: 'feather', n: R(dt, 8), speed: 30, life: 0.7, spin: 4, add: false }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.035; v.afterimage(u, c, 0.5, 0.2); } };

// Voador
export default {
  gust: {},
  peck: { melee: ME('stab', { color: 0xffffff }), hit: IM.all(IM.type('flying', 0.8), IM.p({ tex: 'impact', color: 0xffffff, n: 1, speed: 0, scale: 0.9, end: 1.4, life: 0.08 })) },
  wingAttack: { dash: featherDash(), impact: IM.all(IM.type('flying', 1.2), IM.x(0xe8f6ff, 1.8)) },
  aerialAce: { data: D('Ás Aéreo', 'flying', 'phys', 60, 'dash', { range: 6 }), dash: featherDash(0xffffff), impact: IM.all(IM.type('flying'), IM.p({ tex: 'slash', color: 0xffffff, n: 1, speed: 0, scale: 2.8, end: 3.2, life: 0.18, rot: 0.6 })) },
  airSlash: { // Lâmina de Ar: lâminas de vento em X
    head: { ...H.none(0xbfe0ff, 1.2), draw: DRAW.cross(0xd8f0ff, 8) },
    trail: TR.p({ tex: 'streak', color: 0xd8f0ff, speed: 30, life: 0.15, rot: 'dir', alpha: 0.7 }, 40),
    impact: IM.all(IM.type('flying', 1.1), IM.x(0xe8f6ff, 2.2)),
  },
  airCutter: { data: D('Cortador de Ar', 'flying', 'spec', 60, 'proj', { speed: 20, range: 10, critUp: 1 }), count: 2, spread: 0.3, head: { ...H.none(0xbfe0ff, 1), draw: DRAW.crescent(0xd8f0ff, 7) }, trail: TR.p({ tex: 'streak', color: 0xd8f0ff, speed: 20, life: 0.12, alpha: 0.6 }, 30), impact: IM.all(IM.type('flying'), IM.p({ tex: 'slash', color: 0xffffff, n: 1, speed: 0, scale: 1.8, end: 2.2, life: 0.15 })) },
  fly: { dash: featherDash(), impact: IM.all(IM.boom(0xbfe0ff, 0.9), IM.p({ tex: 'feather', n: 10, speed: 70, life: 1, spin: 5, grav: 30, add: false })) },
  drillPeck: { data: D('Bicada Broca', 'flying', 'phys', 80, 'dash', { range: 6 }), dashStart: (v, u) => { u.wheelT = 0.35; }, dash: (v, u, dt) => { const y = u.y - (u.midH ?? 12); for (let i = R(dt, 60); i > 0; i--) { const a = v.g.time * 30 + Math.random() * 6.28; v.E(u.x + Math.cos(a) * 6, y + Math.sin(a) * 6, { tex: 'streak', color: 0xffffff, n: 1, speed: 40, dir: a + 1.57, spread: 0, life: 0.15, rot: 'dir' }); } }, impact: IM.all(IM.type('flying', 1.2), IM.ring(0xffffff, 6, 3, 0.25)) },
  braveBird: { data: D('Pássaro Bravo', 'flying', 'phys', 120, 'dash', { range: 7, eff: { recoil: 0.33 } }), dash: (v, u, dt) => { featherDash(0x9ad0ff)(v, u, dt); v.E(u.x, u.y - 10 - u.z, { tex: 'glow', color: 0x5aa0ff, n: R(dt, 60), size: 9, speed: 10, life: 0.25 }); }, impact: IM.all(IM.boom(0x7ab0ff, 1.3), IM.p({ tex: 'feather', n: 14, speed: 90, life: 1.2, spin: 6, grav: 30, add: false })) },
  hurricane: { data: D('Furacão', 'flying', 'spec', 110, 'target', { range: 10, eff: { confuse: 0.3 } }), target: (v, t, x, y) => { for (let k = 0; k < 50; k++) { const a = k / 50 * 25, h = k * 1.2; v.E(x + Math.cos(a) * (6 + k * 0.25), y + 4 + Math.sin(a) * 4 - h, { tex: 'streak', color: 0xd8f0ff, n: 1, speed: 40, dir: a + 1.57, spread: 0.1, life: 0.6, rot: 'dir', alpha: 0.9 }); } v.E(x, y, { tex: 'leaf2', n: 10, speed: 60, life: 1, spin: 12, vz: 80, grav: 40, add: false }); v.fx.kick(0.25, 0.04); }, hitDelay: 0.25 },
  whirlwind: {}, roar: {},
  featherDance: { data: D('Dança das Penas', 'flying', 'status', 0, 'cloud', { eff: { stat: 'atk', by: -2 } }), cloudColor: 0xffffff, cloudTex: 'feather' },
  steelWing: { data: D('Asa de Aço', 'steel', 'phys', 70, 'dash', { range: 6, eff: { stat: 'def', by: 1, self: true, chance: 0.1 } }), dash: featherDash(0xc8e0f0), impact: IM.all(IM.type('steel', 1.2), IM.p({ tex: 'slash', color: 0xc8e0f0, n: 1, speed: 0, scale: 2.2, end: 2.6, life: 0.15 })) },
  roost: { data: D('Pouso', 'flying', 'status', 0, 'self', { eff: { heal: 0.5, self: true } }), self: SELF.rise(0xbfe0ff, 'feather', true) },
};
