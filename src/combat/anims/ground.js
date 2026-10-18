import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

// Terra
export default {
  sandAttack: {},
  mudSlap: { head: H.tex('ball', { tint: 0x7a5a38, scale: 1, halo: 0x8a6438, haloScale: 0.5 }), trail: TR.p({ tex: 'dirt', speed: 20, life: 0.4, grav: 300, vz: 20, add: false }, 30), impact: IM.all(IM.type('ground', 0.6), IM.goo(0x6a4a28)) },
  mudShot: { head: H.tex('ball', { tint: 0x6a4a28, scale: 1.5, halo: 0x8a6438, haloScale: 0.7 }), trail: TR.p({ tex: 'dirt', speed: 20, life: 0.5, grav: 300, vz: 30, add: false }, 40), impact: IM.all(IM.type('ground', 1), IM.goo(0x5a3a1a)) },
  mudBomb: { data: D('Bomba de Lama', 'ground', 'spec', 65, 'proj', { speed: 12, range: 11, eff: { stat: 'acc', by: -1, chance: 0.3 } }), head: { ...H.none(0x8a6438, 1), draw: DRAW.sphere(0x5a3a1a, 0xa07a4c, 6, 2) }, trail: TR.p({ tex: 'dirt', speed: 15, life: 0.5, grav: 300, vz: 20, add: false }, 30), impact: IM.all(IM.boom(0x8a6438, 0.8), IM.goo(0x5a3a1a)) },
  magnitude: { quakeK: 1 },
  bulldoze: { quakeK: 0.8 },
  earthquake: { data: D('Terremoto', 'ground', 'phys', 100, 'quake', { range: 7 }), quakeK: 1.6 },
  earthPower: { // Poder da Terra: o chão explode debaixo do alvo
    data: D('Poder da Terra', 'ground', 'spec', 90, 'target', { eff: { stat: 'spd', by: -1, chance: 0.1 } }),
    target: (v, t, x, y) => { v.fx.decal('crack', x, y + 4, { scale: 1.2, life: 25 }); v.g.later(0.2, () => { for (let k = 0; k < 24; k++) v.E(x + (Math.random() - 0.5) * 14, y + 4, { tex: Math.random() < 0.5 ? 'glow' : 'dirt', color: 0xffa04a, n: 1, speed: 10, vz: 120 + Math.random() * 160, grav: 400, life: 0.9, add: false, size: 4 }); v.fx.light(x, y, 0xffa04a, 50, 0.4); v.fx.shock(x, y + 4, 0xc8a070, 30, 0.4); v.fx.kick(0.3, 0.05); }); },
    hitDelay: 0.2,
  },
  dig: {},
  boneClub: { data: D('Clava de Osso', 'ground', 'phys', 65, 'melee', { eff: { flinch: 0.1 } }), melee: ME('blunt', { color: 0xf0e8d0 }), hit: IM.all(IM.type('ground'), IM.p({ tex: 'impact', color: 0xf0e8d0, n: 1, speed: 0, scale: 1.4, end: 2, life: 0.12 })) },
  bonemerang: { data: D('Bumerangue de Osso', 'ground', 'phys', 50, 'proj', { speed: 16, range: 9 }), count: 2, gap: 0.25, head: H.tex('needle', { tint: 0xf0e8d0, scale: 2, spin: 18, halo: 0xc8a070, haloScale: 0.6 }), trail: TR.p({ tex: 'streak', color: 0xf0e8d0, speed: 5, life: 0.12, alpha: 0.6 }, 30), impact: IM.type('ground', 0.8) },
  sandTomb: { data: D('Tumba de Areia', 'ground', 'phys', 35, 'target', { eff: { bind: 3 } }), target: (v, t, x, y) => { for (let i = 0; i < 40; i++) { const a = i / 40 * 12.56; v.E(x + Math.cos(a) * 10, y + 4 + Math.sin(a) * 5, { tex: 'px', color: 0xe0c890, n: 2, speed: 30, dir: a + 1.57, spread: 0.3, life: 0.7, vz: 20 + i * 2, grav: 60, add: false, scale: 1.5 }); } v.E(x, y, { tex: 'dust', n: 8, speed: 30, life: 0.9, scale: 0.8, end: 1.8, add: false, alpha: 0.8 }); } },
  spikes: { data: D('Espinhos', 'ground', 'status', 0, 'cloud', {}), cloudColor: 0xa08060, cloudTex: 'shard' },
};
