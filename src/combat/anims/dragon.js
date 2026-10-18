import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

// Dragão, Aço e Fada
export default {
  twister: {}, dragonBreath: {},
  dragonPulse: { // Pulso do Dragão: dragão de energia
    head: { ...H.bflame(1.4, { haloScale: 2 }), draw: DRAW.dragon(0x5a4aff, 0xb8a8ff), hist: 14 },
    trail: TR.all(TR.p({ frames: 'bflame', speed: 20, life: 0.35, scale: 1, end: 0.3, add: true, jitter: 3 }, 50), TR.p({ tex: 'spark', color: 0xd0c8ff, speed: 40, life: 0.2, scale: 0.6 }, 20)),
    impact: IM.all(IM.boom(0x7a5aff, 1), IM.p({ frames: 'bflame', n: 16, speed: 110, life: 0.5, scale: 1.3, end: 0.3, add: true })),
  },
  dragonClaw: { data: D('Garra de Dragão', 'dragon', 'phys', 80, 'melee'), melee: ME('claw', { color: 0x7a5aff }), hit: IM.all(IM.type('dragon', 1.1), IM.claws(0x9a8aff, 2.6)) },
  dragonRage: { data: D('Fúria do Dragão', 'dragon', 'spec', 40, 'proj', { speed: 14, range: 11 }), head: H.bflame(1.8, { haloScale: 2.2 }), trail: TR.p({ frames: 'bflame', speed: 30, life: 0.4, scale: 1.1, end: 0.3, add: true, jitter: 5 }, 70), impact: IM.all(IM.type('dragon', 1.2), IM.ring(0x7a5aff, 8, 3)) },
  outrage: { data: D('Ultraje', 'dragon', 'phys', 120, 'multi', { hits: 4, range: 2 }), melee: ME('blunt', { color: 0xff5a5a, rage: true }), charge: (v, u) => v.E(u.x, u.y - 10, { frames: 'bflame', n: 2, speed: 20, life: 0.3, add: true, jitter: 8 }), hit: IM.all(IM.type('dragon', 1.2), IM.shock(0xff5a5a, 22), IM.kick(0.3, 0.05)) },
  dracoMeteor: { data: D('Meteoro do Dragão', 'dragon', 'spec', 130, 'rain', { range: 10, eff: { stat: 'spa', by: -2, self: true, chance: 1 } }), rainTex: ['meteor', 'meteor'], rainN: 5, rainSpread: 30 },
  dragonDance: { data: D('Dança do Dragão', 'dragon', 'status', 0, 'self', { eff: { stat: 'atk', by: 1, self: true } }), self: SELF.rise(0x7a5aff, 'glow', true, (v, u) => { for (let i = 0; i < 24; i++) { const a = i / 24 * 12.56; v.E(u.x + Math.cos(a) * 12, u.y - i * 1.2, { frames: 'bflame', n: 1, speed: 10, life: 0.6, add: true, scale: 0.9 }); } }) },
  dragonTail: { data: D('Cauda de Dragão', 'dragon', 'phys', 60, 'melee', { range: 2.4, eff: { knock: 9 } }), melee: ME('tail', { color: 0x7a5aff }), hit: IM.all(IM.type('dragon', 1.2), IM.shock(0x7a5aff, 26)) },
  // Aço
  metalClaw: { melee: ME('claw', { color: 0xc8e0f0, metal: true }), hit: IM.all(IM.type('steel', 1), IM.claws(0xe0f0ff, 2)) },
  ironTail: { data: D('Cauda de Ferro', 'steel', 'phys', 100, 'melee', { range: 2.4, eff: { stat: 'def', by: -1, chance: 0.3 } }), melee: ME('tail', { color: 0xc8e0f0, metal: true }), hit: IM.all(IM.type('steel', 1.4), IM.shock(0xffffff, 26)) },
  ironHead: { data: D('Cabeça de Ferro', 'steel', 'phys', 80, 'dash', { range: 5, eff: { flinch: 0.3 } }), dash: (v, u, dt) => { v.E(u.x, u.y - (u.midH ?? 12), { tex: 'px', color: 0xfff2b0, n: R(dt, 50), speed: 60, life: 0.25, grav: 200, stretch: 0.03, scale: 1.4 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0xe0f0ff, 0.6, 0.2); } }, impact: IM.all(IM.type('steel', 1.4), IM.shock(0xc8e0f0, 26)) },
  flashCannon: { data: D('Canhão de Luz', 'steel', 'spec', 80, 'proj', { range: 9, eff: { stat: 'spd', by: -1, chance: 0.1 } }), beam: { dur: 0.6, width: 8, speed: 1000, tick: 0.1, share: 1.3, range: 8.5, colors: [0x9ab8d0, 0xe8f4ff, 0xffffff], style: 'flash' }, charge: (v, u, k) => v.fx.light(u.x, u.y - 12, 0xe8f4ff, 10 + k * 26, 0.06, 0.8) },
  bulletPunch: { data: D('Soco Projétil', 'steel', 'phys', 40, 'dash', { range: 5 }), dash: (v, u, dt) => { v.E(u.x, u.y - 8, { tex: 'streak', color: 0xe0f0ff, n: R(dt, 60), speed: 15, life: 0.12 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.02; v.afterimage(u, 0xc8e0f0, 0.6, 0.12); } }, impact: IM.all(IM.type('steel', 1), IM.p({ tex: 'impact', color: 0xe0f0ff, n: 1, speed: 0, scale: 1.3, end: 2, life: 0.1 })) },
  harden: {},
  irondefense: { data: D('Defesa de Ferro', 'steel', 'status', 0, 'self', { eff: { stat: 'def', by: 2, self: true } }), self: SELF.rise(0xc8e0f0, 'twinkle', true, (v, u) => v.fx.ring(u.x, u.y - 10, 0xe0f0ff, 7, 0.5, { width: 3, squash: 1 })) },
  // Fada
  disarmingVoice: {}, fairyWind: {},
  dazzlingGleam: { data: D('Brilho Deslumbrante', 'fairy', 'spec', 80, 'wave', { range: 6 }), wave: (v, u, R0) => { v.fx.screenFlash(0xffd8f8, 0.35); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; v.E(u.x, u.y - 10, { tex: 'twinkle', color: 0xffffff, n: 1, speed: R0 * 2.4, dir: a, spread: 0.05, life: 0.4, scale: 1.6 }); } v.E(u.x, u.y - 10, { tex: 'star', color: 0xffb8f0, n: 20, speed: R0 * 2, life: 0.5, spin: 6 }); v.fx.light(u.x, u.y - 10, 0xffd8f8, R0 * 1.6, 0.35, 1); v.fx.shock(u.x, u.y, 0xff8fe0, R0, 0.4); } },
  moonblast: { data: D('Explosão Lunar', 'fairy', 'spec', 95, 'proj', { speed: 13, range: 12, eff: { stat: 'spa', by: -1, chance: 0.3 } }), charge: (v, u, k) => v.fx.light(u.x, u.y - 30, 0xffe8fa, 10 + k * 30, 0.06, 0.7), head: { ...H.none(0xff8fe0, 1.8), draw: DRAW.moon(7) }, trail: TR.p({ tex: 'twinkle', color: 0xffd8f8, speed: 20, life: 0.5 }, 40), impact: IM.all(IM.boom(0xff8fe0, 1), IM.stars(0xffe8fa, 12)) },
  playRough: { data: D('Brincadeira Bruta', 'fairy', 'phys', 90, 'multi', { hits: 3, range: 1.9, eff: { stat: 'atk', by: -1, chance: 0.1 } }), melee: ME('blunt', { color: 0xff8fe0 }), hit: IM.all(IM.type('fairy', 1.1), IM.p({ tex: 'dust', color: 0xffd0f0, n: 6, speed: 50, life: 0.5, scale: 0.8, end: 1.6, add: false, alpha: 0.8 }), IM.stars(0xffe27a, 4), IM.hearts(3)) },
  drainingKiss: { data: D('Beijo Drenante', 'fairy', 'spec', 50, 'proj', { speed: 12, range: 9, eff: { drain: 0.75 } }), head: H.tex('heart', { tint: 0xff8fd8, scale: 1.6, add: true, halo: 0xff8fe0, haloScale: 1, pulse: 0.3 }), trail: TR.p({ tex: 'heart', color: 0xffb8e8, speed: 10, life: 0.4, scale: 0.6 }, 16), impact: IM.all(IM.hearts(8), IM.type('fairy', 0.8)) },
  charm: { data: D('Encanto', 'fairy', 'status', 0, 'wave', { range: 5, eff: { stat: 'atk', by: -2 } }), wave: (v, u, R0) => { v.E(u.x, u.y - 14, { tex: 'heart', color: 0xff8fd8, n: 16, speed: R0 * 1.6, life: 0.7 }); v.fx.ring(u.x, u.y, 0xff8fe0, R0 / 3.2, 0.4, { width: 2 }); } },
  sweetKiss: { data: D('Beijo Doce', 'fairy', 'status', 0, 'proj', { speed: 10, range: 8, acc: 0.75, eff: { confuse: 1 } }), head: H.tex('heart', { tint: 0xff8fd8, scale: 1.3, add: true, halo: 0xff8fe0, haloScale: 0.8 }), trail: TR.p({ tex: 'heart', color: 0xffb8e8, speed: 10, life: 0.4, scale: 0.5 }, 12), impact: IM.hearts(8) },
  moonlight: { data: D('Luz da Lua', 'fairy', 'status', 0, 'self', { eff: { heal: 0.5, self: true } }), self: SELF.rise(0xffe8fa, 'twinkle', true, (v, u) => { v.fx.light(u.x, u.y - 40, 0xffe8fa, 50, 0.9, 1); v.E(u.x, u.y - 50, { tex: 'glow', color: 0xffe8fa, n: 16, size: 3, speed: 8, life: 0.9, vz: -40, jitter: 12 }); }) },
};
