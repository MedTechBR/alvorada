import { D, H, TR, IM, ME, SELF, R } from './kit.js';

// Fogo
export default {
  ember: { // Brasa: fagulhas pequenas
    head: H.flame(0.9, { haloScale: 0.9 }),
    trail: TR.all(TR.p({ tex: 'ember', speed: 25, life: 0.35, vz: 30, grav: -10, add: true, jitter: 2 }, 50), TR.p({ tex: 'spark', color: 0xffc04a, speed: 50, life: 0.12, scale: 0.4 }, 30)),
    impact: IM.all(IM.p({ tex: 'ember', n: 16, speed: 90, life: 0.6, vz: 70, grav: 160, add: true }), IM.p({ frames: 'flame', n: 4, speed: 30, life: 0.35, add: false, vz: 30 })),
    after: IM.scorch(0.4),
  },
  flamethrower: { // Lança-Chamas: jato contínuo ondulante
    kind: 'proj',
    beam: { dur: 1.0, width: 7, speed: 560, tick: 0.1, share: 1.45, range: 7.5, wavy: 3.5, colors: [0xff4a10, 0xff9a2a, 0xfff0a0], style: 'fire' },
    charge: (v, u, k) => v.E(u.x, u.y - 10, { frames: 'flame', n: 1, speed: 10, life: 0.3, scale: 0.6 + k * 0.6, add: false, jitter: 6, vz: 20 }),
  },
  fireBlast: { // Rajada de Fogo: estrela de fogo em forma de 大
    head: H.flame(2.6, { haloScale: 3 }),
    trail: TR.all(TR.type(), TR.p({ frames: 'flame', speed: 40, life: 0.4, scale: 1.4, end: 0.3, add: false, jitter: 6 }, 60)),
    impact: IM.all(IM.kanji(), IM.boom(0xff6a1a, 1.1)),
    after: IM.scorch(1.5),
  },
  flameWheel: { // Roda de Fogo: o usuário vira uma roda de chamas
    dashStart: (v, u) => { u.wheelT = 0.45; },
    dash: (v, u, dt) => {
      const y = u.y - (u.midH ?? 12);
      for (let i = R(dt, 140); i > 0; i--) { const a = v.g.time * 18 + Math.random() * 6.28, r = u.r + 4; v.E(u.x + Math.cos(a) * r, y + Math.sin(a) * r, { frames: 'flame', n: 1, speed: 20, dir: a + 1.57, spread: 0.2, life: 0.22, scale: 1, end: 0.4, add: false }); }
      if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.04; v.afterimage(u, 0xff7a2a, 0.5, 0.2); }
    },
    impact: IM.all(IM.type('fire', 1.2), IM.ring(0xff9a2a, 8, 2)),
  },
  firePunch: {
    melee: ME('fist', { color: 0xff7a2a, glow: 'flame' }),
    charge: (v, u, k) => v.E(u.x, u.y - 12, { frames: 'flame', n: 1, speed: 6, life: 0.25, scale: 0.8, add: false, jitter: 5 }),
    hit: IM.all(IM.type('fire', 1.2), IM.p({ frames: 'flame', n: 10, speed: 90, life: 0.4, add: false, scale: 1.2, end: 0.3 })),
    data: D('Soco de Fogo', 'fire', 'phys', 75, 'melee', { eff: { status: 'brn', chance: 0.1 } }),
  },
  fireFang: {
    melee: ME('fang', { color: 0xff7a2a, glow: 'flame' }),
    hit: IM.all(IM.type('fire', 1), IM.p({ tex: 'ember', n: 12, speed: 70, life: 0.5, add: true, vz: 40 })),
    data: D('Presa de Fogo', 'fire', 'phys', 65, 'melee', { eff: { status: 'brn', chance: 0.1, flinch: 0.1 } }),
  },
  fireSpin: { // Redemoinho de Fogo: coluna de fogo girando no alvo
    data: D('Redemoinho de Fogo', 'fire', 'spec', 35, 'target', { eff: { bind: 3 } }),
    target: (v, t, x, y) => { for (let k = 0; k < 40; k++) { const a = k / 40 * 12.56, h = k * 0.9; v.E(x + Math.cos(a) * 9, y + 4 + Math.sin(a) * 4 - h, { frames: 'flame', n: 1, speed: 10, dir: a + 1.57, spread: 0.2, life: 0.5 + k / 80, scale: 1.1, end: 0.3, add: false, vz: 20 }); } v.fx.light(x, y - 10, 0xff6a1a, 40, 0.5); },
    after: IM.scorch(0.8),
  },
  flameCharge: {
    data: D('Ataque de Chamas', 'fire', 'phys', 50, 'dash', { eff: { stat: 'spe', by: 1, self: true, chance: 1 } }),
    dash: (v, u, dt) => { v.E(u.x, u.y - 6, { frames: 'flame', n: R(dt, 90), speed: 15, life: 0.35, scale: 1.1, end: 0.3, add: false, vz: 40, jitter: u.r }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.04; v.afterimage(u, 0xff5a1a, 0.5, 0.25); } v.fx.decal('scorch', u.x, u.y, { scale: 0.35, alpha: 0.7, life: 10 }); },
    impact: IM.type('fire', 1.1),
  },
  heatWave: { // Onda de Calor: leque de ar quente ondulante
    data: D('Onda de Calor', 'fire', 'spec', 95, 'cone', { range: 6.5 }),
    cone: (v, u, dx, dy, R0) => { const a0 = Math.atan2(dy, dx); for (let i = 0; i < 4; i++) v.fx.ring(u.x + dx * (12 + i * 14), u.y - 8 + dy * (12 + i * 14), 0xff8a3a, 6 + i * 4, 0.4 + i * 0.08, { width: 2.5, squash: 0.5 }); v.E(u.x + dx * 8, u.y - 8, { frames: 'flame', n: 30, speed: R0 * 2.2, dir: a0, spread: 1.1, life: 0.45, scale: 1, end: 0.5, add: false, drag: 1.5 }); v.E(u.x + dx * 8, u.y - 8, { tex: 'glow', color: 0xffb060, n: 20, size: 6, speed: R0 * 2, dir: a0, spread: 1.1, life: 0.5, alpha: 0.5 }); v.fx.screenFlash(0xff7a2a, 0.08); },
  },
  flareBlitz: { // Investida Flamejante: cometa de fogo e explosão
    data: D('Investida Flamejante', 'fire', 'phys', 120, 'dash', { range: 7, eff: { recoil: 0.33, status: 'brn', chance: 0.1 } }),
    dashStart: (v, u) => { v.fx.light(u.x, u.y - 10, 0xff6a1a, 50, 0.3); },
    dash: (v, u, dt) => { const y = u.y - 10 - u.z; v.E(u.x, y, { frames: 'flame', n: R(dt, 200), speed: 50, life: 0.4, scale: 1.6, end: 0.3, add: false, jitter: u.r + 2, vz: 20 }); v.E(u.x, y, { tex: 'glow', color: 0xff8a2a, n: R(dt, 60), size: 10, speed: 10, life: 0.2 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0xffaa3a, 0.7, 0.3); } },
    impact: IM.all(IM.boom(0xff6a1a, 1.4), IM.p({ frames: 'flame', n: 24, speed: 150, life: 0.5, scale: 1.5, end: 0.3, add: false })),
    after: IM.scorch(1.4),
  },
  willOWisp: { // Fogo-Fátuo: chamas azuis que flutuam e queimam
    data: D('Fogo-Fátuo', 'fire', 'status', 0, 'proj', { speed: 9, range: 10, acc: 0.85, eff: { status: 'brn', chance: 1 } }),
    count: 3, spread: 0.35,
    head: H.bflame(1.3, { halo: 0x6a8aff }),
    trail: TR.p({ frames: 'bflame', speed: 10, life: 0.4, scale: 0.7, end: 0.2, add: true, vz: 10 }, 30),
    impact: IM.all(IM.wisps(0x7a9aff, 8), IM.p({ frames: 'bflame', n: 8, speed: 40, life: 0.5, add: true, vz: 30 })),
  },
  overheat: { // Superaquecimento: explosão de fogo em volta e o usuário fumega
    data: D('Superaquecimento', 'fire', 'spec', 130, 'wave', { range: 5.5, eff: { stat: 'spa', by: -2, self: true, chance: 1 } }),
    charge: (v, u, k) => { v.E(u.x, u.y - 10, { tex: 'glow', color: 0xff5a1a, n: 2, size: 4 + k * 6, speed: 30, life: 0.3 }); },
    wave: (v, u, R0) => { v.fx.shock(u.x, u.y, 0xff6a1a, R0, 0.5); for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; v.E(u.x, u.y - 8, { frames: 'flame', n: 1, speed: R0 * 2.3, dir: a, spread: 0.1, life: 0.45, scale: 1.4, end: 0.5, add: false, drag: 1.5 }); } v.fx.screenFlash(0xff7a2a, 0.3); v.fx.kick(0.4, 0.08); v.E(u.x, u.y - 10, { tex: 'smoke', n: 10, speed: 20, life: 1.5, scale: 0.8, end: 2, vz: 30, alpha: 0.5, add: false, color: 0x666666 }); },
  },
  lavaPlume: { // Erupção de Lava: anel de lava saindo do chão
    data: D('Pluma de Lava', 'fire', 'spec', 80, 'wave', { range: 5, eff: { status: 'brn', chance: 0.3 } }),
    wave: (v, u, R0) => { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; v.g.later(i * 0.015, () => { const x = u.x + Math.cos(a) * R0 * 0.6, y = u.y + Math.sin(a) * R0 * 0.4; v.E(x, y, { tex: 'ball', color: 0xff5a1a, n: 4, speed: 20, vz: 160, grav: 400, life: 0.8, add: true, scale: 0.8 }); v.E(x, y, { frames: 'flame', n: 3, speed: 15, life: 0.5, add: false, vz: 40 }); v.fx.decal('scorch', x, y, { scale: 0.5, alpha: 0.8, life: 20 }); }); } v.fx.shock(u.x, u.y, 0xff4a1a, R0, 0.5); },
  },
  inferno: { // Inferno: bola gigante que vira uma coluna de fogo
    data: D('Inferno', 'fire', 'spec', 100, 'proj', { speed: 12, range: 11, eff: { status: 'brn', chance: 1 } }),
    head: H.flame(2.2, { haloScale: 3.2 }),
    trail: TR.p({ frames: 'flame', speed: 30, life: 0.45, scale: 1.3, end: 0.3, add: false, jitter: 6, vz: 20 }, 90),
    impact: IM.all(IM.boom(0xff4a1a, 1.2), (v, x, y) => { for (let k = 0; k < 30; k++) v.E(x + (Math.random() - 0.5) * 16, y + 6 - k * 1.5, { frames: 'flame', n: 1, speed: 8, life: 0.6 + k / 50, scale: 1.6, end: 0.3, add: false, vz: 50 }); }),
    after: IM.scorch(1.6),
  },
  sunnyDay: { data: D('Dia Ensolarado', 'fire', 'status', 0, 'self', { eff: { stat: 'spa', by: 1, self: true } }), self: SELF.rise(0xffd84a, 'twinkle', true, (v, u) => { v.fx.screenFlash(0xffe8a0, 0.25); v.fx.light(u.x, u.y - 30, 0xfff0a0, 90, 0.8, 1); }) },
};
