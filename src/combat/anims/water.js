import { D, H, TR, IM, ME, SELF, R } from './kit.js';

// Água
export default {
  waterGun: { // Revólver d'Água: jato fino
    beam: { dur: 0.42, width: 3.5, speed: 700, tick: 0.07, share: 1.0, range: 7, colors: [0x2a7aff, 0x7ac8ff, 0xffffff], style: 'water', thin: true },
    impact: IM.pop(),
  },
  bubble: { // Bolha: bolhas que estouram
    head: H.tex('bubble', { scale: 1.4, halo: 0x8fd0ff, haloScale: 0.8 }),
    trail: TR.p({ tex: 'bubble', speed: 8, life: 0.35, scale: 0.5, add: false }, 8),
    impact: IM.all(IM.pop(0xbfe6ff), IM.p({ tex: 'bubble', n: 5, speed: 40, life: 0.3, scale: 0.6, add: false })),
  },
  bubbleBeam: { // Raio de Bolhas: rajada de muitas bolhas
    data: D('Raio de Bolhas', 'water', 'spec', 65, 'proj', { speed: 13, range: 11, eff: { stat: 'spe', by: -1, chance: 0.1 } }),
    count: 7, spread: 0.32, gap: 0.05, power: 0.3,
    head: H.tex('bubble', { scale: 1.1, halo: 0x8fd0ff, haloScale: 0.6 }),
    impact: IM.pop(0xbfe6ff),
  },
  waterPulse: { // Pulso d'Água: anel de água que pulsa
    head: H.tex('ring', { scale: 1.2, tint: 0xbfe6ff, add: true, halo: 0x3a9cff, haloScale: 1.6, pulse: 0.35 }),
    trail: TR.all(TR.ring(0x7ac8ff, 0.06, 3), TR.p({ tex: 'drop', speed: 20, life: 0.4, grav: 300, vz: 30, add: false, scale: 0.7 }, 20)),
    impact: IM.all(IM.type('water', 1), IM.ring(0x7ac8ff, 8, 3, 0.4)),
  },
  hydroPump: { // Hidro Bomba: dois canhões grossos
    beam: { dur: 1.1, width: 9, speed: 620, tick: 0.1, share: 1.55, knock: 1.8, range: 8.5, colors: [0x1a5ad8, 0x5ab0ff, 0xffffff], style: 'water', double: 5 },
    charge: (v, u, k) => v.E(u.x, u.y - 10, { tex: 'drop', n: 1, speed: 30, life: 0.3, add: false, jitter: 8, vz: 20, grav: 200 }),
  },
  surf: { // Surf: onda que atravessa a tela
    data: D('Surfar', 'water', 'spec', 90, 'surf', { range: 11 }),
  },
  aquaJet: {
    dash: (v, u, dt) => { const y = u.y - 8; v.E(u.x, y, { tex: 'drop', n: R(dt, 80), speed: 60, life: 0.5, vz: 80, grav: 400, add: false }); v.E(u.x, y, { tex: 'foam', n: R(dt, 40), speed: 20, life: 0.3, add: false, jitter: u.r }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0x5ab0ff, 0.6, 0.25); } },
    impact: IM.all(IM.type('water', 1), IM.pop()),
  },
  aquaTail: { data: D('Cauda d\'Água', 'water', 'phys', 90, 'melee', { range: 2.4 }), melee: ME('tail', { color: 0x5ab0ff, glow: 'drop' }), hit: IM.all(IM.type('water', 1.4), IM.ring(0x8fd0ff, 10, 2)) },
  waterfall: { // Cachoeira: coluna de água que sobe sob o alvo
    data: D('Cachoeira', 'water', 'phys', 80, 'dash', { range: 6, eff: { flinch: 0.2 } }),
    dash: (v, u, dt) => { v.E(u.x, u.y - 4, { tex: 'drop', n: R(dt, 120), speed: 20, life: 0.5, vz: 220, grav: 500, add: false, jitter: u.r }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.035; v.afterimage(u, 0x7ac8ff, 0.5, 0.25); } },
    impact: (v, x, y, dir, P, gy) => { for (let k = 0; k < 30; k++) v.E(x + (Math.random() - 0.5) * 12, (gy ?? y + 8) - k * 1.6, { tex: Math.random() < 0.5 ? 'drop' : 'foam', n: 1, speed: 10, life: 0.6, vz: 120, grav: 300, add: false }); v.impact('water', x, y, dir, P * 1.2, gy); },
  },
  scald: { // Escaldar: água fervendo com vapor
    data: D('Escaldar', 'water', 'spec', 80, 'proj', { speed: 16, range: 12, eff: { status: 'brn', chance: 0.3 } }),
    head: H.orb(0xbfe6ff, 1.5, 0xff9a6a),
    trail: TR.all(TR.type(), TR.p({ tex: 'smoke', color: 0xffffff, speed: 10, life: 0.7, scale: 0.6, end: 1.6, vz: 25, alpha: 0.4, add: false }, 20)),
    impact: IM.all(IM.type('water', 1.1), IM.smoke(0xffffff, 8, 0.6)),
  },
  withdraw: { self: SELF.rise(0x8fd0ff, 'twinkle', true, (v, u) => { v.fx.ring(u.x, u.y - 8, 0xbfe6ff, 6, 0.5, { width: 3, squash: 1 }); }) },
  rainDance: { data: D('Dança da Chuva', 'water', 'status', 0, 'self', {}), self: (v, u) => { v.fx.screenFlash(0x3a6aaa, 0.2); for (let i = 0; i < 80; i++) v.g.later(i * 0.02, () => v.E(u.x + (Math.random() - 0.5) * 240, u.y + (Math.random() - 0.5) * 160, { tex: 'streak', color: 0x9fd4ff, n: 1, speed: 0, life: 0.3, z: 120, vz: -500, rot: 1.75, alpha: 0.8 })); } },
  whirlpool: { // Redemoinho: vórtice de água no alvo
    data: D('Redemoinho', 'water', 'spec', 35, 'target', { eff: { bind: 3 } }),
    target: (v, t, x, y) => { for (let k = 0; k < 3; k++) v.fx.ring(x, y + 4, 0x5ab0ff, 4 + k * 4, 0.6 + k * 0.1, { width: 2, squash: 0.5 }); for (let i = 0; i < 30; i++) { const a = i / 30 * 12.56; v.E(x + Math.cos(a) * 12, y + 4 + Math.sin(a) * 6, { tex: 'foam', n: 1, speed: 30, dir: a + 1.57, spread: 0.1, life: 0.6, add: false, vz: 30 + i * 2, grav: 50 }); } },
  },
  brine: { data: D('Salmoura', 'water', 'spec', 65, 'proj', { speed: 15, range: 12 }), head: H.orb(0xe8f8ff, 1.3, 0x3a9cff), trail: TR.all(TR.type(), TR.p({ tex: 'twinkle', color: 0xffffff, speed: 15, life: 0.3 }, 20)), impact: IM.all(IM.type('water'), IM.p({ tex: 'twinkle', n: 12, color: 0xffffff, speed: 60, life: 0.5 })) },
  muddyWater: { data: D('Água Lamacenta', 'water', 'spec', 90, 'surf', { range: 9, eff: { stat: 'acc', by: -1, chance: 0.3 } }), surfColor: [0x8a6a3a, 0xc8a070] },
};
