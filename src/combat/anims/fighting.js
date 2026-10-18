import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

// Lutador
export default {
  lowKick: { melee: ME('sweep', { color: 0xffa04a }), hit: IM.all(IM.type('fighting', 0.9), IM.p({ tex: 'dust', n: 4, speed: 40, life: 0.4, scale: 0.6, end: 1.4, add: false, alpha: 0.7 })) },
  karateChop: { melee: ME('chop', { color: 0xffd0a0 }), hit: IM.all(IM.type('fighting'), IM.p({ tex: 'slash', color: 0xffffff, n: 1, speed: 0, scale: 2.2, end: 2.6, life: 0.15, rot: 1.57 })) },
  doubleKick: { melee: ME('kick', { color: 0xffa04a }), hit: IM.all(IM.type('fighting', 0.8), IM.ring(0xffa04a, 6)) },
  rockSmash: { melee: ME('fist', { color: 0xc8a070 }), hit: IM.all(IM.type('fighting'), IM.rocks(6, 'rock1')) },
  brickBreak: { data: D('Quebra-Tijolo', 'fighting', 'phys', 75, 'melee'), melee: ME('chop', { color: 0xffb060 }), hit: IM.all(IM.type('fighting', 1.3), IM.rocks(6, 'rock1'), IM.p({ tex: 'impact', color: 0xffa04a, n: 1, speed: 0, scale: 2, end: 3, life: 0.16 })) },
  closeCombat: { // Combate Corpo a Corpo: rajada de golpes
    data: D('Combate Corpo a Corpo', 'fighting', 'phys', 120, 'multi', { hits: 5, range: 1.9, eff: { stat: 'def', by: -1, self: true, chance: 1 } }),
    melee: ME('fist', { color: 0xff8a3a, fast: true }), hit: IM.all(IM.type('fighting', 1.1), IM.p({ tex: 'impact', color: 0xffffff, n: 2, speed: 40, scale: 1.2, end: 2, life: 0.1 })),
  },
  auraSphere: { data: D('Esfera de Aura', 'fighting', 'spec', 80, 'proj', { speed: 16, range: 13 }), head: { ...H.orb(0xbfe0ff, 1.3, 0x3a7aff), draw: DRAW.sphere(0x1a4ac8, 0x9ad0ff, 5, 4) }, trail: TR.all(TR.p({ tex: 'glow', color: 0x5a9aff, size: 4, speed: 10, life: 0.3 }, 50), TR.p({ tex: 'wisp', color: 0x7ab0ff, speed: 10, life: 0.3, scale: 0.6, add: true }, 20)), impact: IM.all(IM.type('fighting', 1.2), IM.shock(0x5a9aff, 34), IM.light(0x5a9aff, 50)) },
  focusBlast: { data: D('Rajada Focada', 'fighting', 'spec', 120, 'proj', { speed: 12, range: 12 }), head: { ...H.orb(0xffe8a0, 2, 0xff8a3a), draw: DRAW.sphere(0xff7a1a, 0xffe27a, 7, 5) }, trail: TR.p({ tex: 'glow', color: 0xffa04a, size: 5, speed: 12, life: 0.35 }, 60), impact: IM.boom(0xff8a3a, 1.5) },
  machPunch: { data: D('Soco Mach', 'fighting', 'phys', 40, 'dash', { range: 5 }), dash: (v, u, dt) => { v.E(u.x, u.y - 8, { tex: 'streak', color: 0xffd0a0, n: R(dt, 60), speed: 15, life: 0.15, alpha: 0.8 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.025; v.afterimage(u, 0xffd0a0, 0.5, 0.15); } }, impact: IM.all(IM.type('fighting'), IM.p({ tex: 'impact', color: 0xffa04a, n: 1, speed: 0, scale: 1.4, end: 2.2, life: 0.12 })) },
  dynamicPunch: { data: D('Soco Dinâmico', 'fighting', 'phys', 100, 'melee', { eff: { confuse: 1 } }), melee: ME('fist', { color: 0xff6a1a }), hit: IM.boom(0xff8a3a, 1.2) },
  crossChop: { data: D('Golpe Cruzado', 'fighting', 'phys', 100, 'melee', { critUp: 1 }), melee: ME('chop', { color: 0xffb060 }), hit: IM.all(IM.type('fighting', 1.3), IM.x(0xffd0a0, 2.4)) },
  drainPunch: { data: D('Soco Dreno', 'fighting', 'phys', 75, 'melee', { eff: { drain: 0.5 } }), melee: ME('fist', { color: 0x9aff7a }), hit: IM.all(IM.type('fighting'), IM.p({ tex: 'glow', color: 0x7dff8a, n: 12, size: 3, speed: 50, life: 0.6 })) },
  bulkUp: { data: D('Fortalecer', 'fighting', 'status', 0, 'self', { eff: { stat: 'atk', by: 1, self: true } }), self: SELF.rise(0xff8a3a, 'glow', true, (v, u) => { v.fx.shock(u.x, u.y, 0xff8a3a, 20, 0.3); v.fx.kick(0.15, 0); }) },
  superpower: { data: D('Superpoder', 'fighting', 'phys', 120, 'melee', { eff: { stat: 'atk', by: -1, self: true, chance: 1 } }), melee: ME('fist', { color: 0xff5a1a }), charge: (v, u) => v.E(u.x, u.y - 10, { tex: 'glow', color: 0xff5a1a, n: 2, size: 6, speed: 20, life: 0.3 }), hit: IM.all(IM.boom(0xff6a1a, 1.3), IM.rocks(8)) },
};
