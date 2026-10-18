import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

const psyRings = (c = 0xff7ac0) => (v, t, x, y) => { t.wobble = 0.7; for (let k = 0; k < 4; k++) v.g.later(k * 0.06, () => v.fx.ring(x, y, c, 16 - k * 3, 0.35, { width: 2, squash: 1, mult: 0.15, r0: 26 - k * 4 })); v.fx.light(x, y, c, 40, 0.5, 0.8); v.fx.screenFlash(c, 0.08); };

// Psíquico
export default {
  confusion: { head: { ...H.orb(0xffd0ec, 1.2, 0xff5aa8), draw: DRAW.rings(0xff9ad0, 2, 7) }, trail: TR.all(TR.ring(0xff7ac0, 0.07, 3), TR.p({ tex: 'glow', color: 0xff7ac0, size: 4, speed: 6, life: 0.3 }, 30)), impact: IM.all(IM.type('psychic', 1), (v, x, y) => v.E(x, y - 6, { tex: 'twinkle', color: 0xffe27a, n: 6, speed: 30, life: 0.6 })) },
  psybeam: { data: D('Psicorraio', 'psychic', 'spec', 65, 'proj', { range: 9, eff: { confuse: 0.1 } }), beam: { dur: 0.7, width: 5, speed: 800, tick: 0.1, share: 1.3, range: 8, colors: [0xff5aa8, 0xb88aff, 0xffffff], style: 'psy' } },
  psychic: { // Psíquico: distorção e anéis no alvo
    data: D('Psíquico', 'psychic', 'spec', 90, 'target', { range: 10, eff: { stat: 'spd', by: -1, chance: 0.1 } }),
    charge: (v, u, k) => v.E(u.x, u.y - 14, { tex: 'ring', color: 0xff7ac0, n: 1, speed: 0, scale: 0.4 + k, end: 1.6, life: 0.2 }),
    target: psyRings(0xff7ac0), hitDelay: 0.22,
    impact: IM.all(IM.type('psychic', 1.3), IM.shock(0xff7ac0, 30)),
  },
  psyshock: { data: D('Psicochoque', 'psychic', 'spec', 80, 'proj', { speed: 15, range: 11 }), count: 3, spread: 0.3, head: H.tex('shard', { tint: 0xffa8dc, scale: 1.6, orient: true, rotOff: 1.57, add: true, halo: 0xff5aa8, haloScale: 0.8 }), trail: TR.p({ tex: 'glow', color: 0xff7ac0, size: 3, speed: 5, life: 0.25 }, 30), impact: IM.all(IM.type('psychic'), IM.p({ tex: 'shard', color: 0xffa8dc, n: 6, speed: 70, life: 0.5, spin: 10 })) },
  hypnosis: { head: { ...H.tex('swirl', { spin: 9, tint: 0xffb0e0, add: true, halo: 0xff5aa8 }) }, trail: TR.ring(0xd890ff, 0.1, 4), impact: IM.all(IM.ring(0xd890ff, 6, 3), IM.p({ tex: 'zz', color: 0xffffff, n: 3, speed: 15, life: 1, vz: 20, add: false })) },
  agility: { self: SELF.rise(0xff7ac0, 'streak', true, (v, u) => { for (let i = 0; i < 4; i++) v.g.later(i * 0.05, () => v.afterimage(u, 0xff9ad0, 0.5, 0.3)); }) },
  teleport: {},
  zenHeadbutt: { data: D('Cabeçada Zen', 'psychic', 'phys', 80, 'dash', { range: 6, eff: { flinch: 0.2 } }), dash: (v, u, dt) => { v.E(u.x, u.y - (u.midH ?? 12), { tex: 'glow', color: 0x9a7aff, n: R(dt, 60), size: 8, speed: 10, life: 0.2 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.035; v.afterimage(u, 0xb08aff, 0.6, 0.25); } }, impact: IM.all(IM.type('psychic', 1.3), IM.shock(0x9a7aff, 28), IM.p({ tex: 'star', color: 0xffe27a, n: 6, speed: 50, life: 0.6, spin: 6 })) },
  futureSight: { data: D('Visão do Futuro', 'psychic', 'spec', 120, 'target', { range: 11, cd: 6 }), target: (v, t, x, y) => { v.fx.ring(x, y + 4, 0xff7ac0, 6, 1.2, { width: 1.5 }); v.g.later(1.0, () => { v.E(x, y - 80, { tex: 'glow', color: 0xffd0ec, n: 1, speed: 0, size: 14, life: 0.2 }); for (let i = 0; i < 6; i++) v.fx.ring(x, y, 0xff7ac0, 6 + i * 4, 0.4 + i * 0.06, { width: 2.5, squash: 1 }); v.fx.screenFlash(0xff7ac0, 0.3); v.fx.kick(0.4, 0.08); }); }, hitDelay: 1.0 },
  calmMind: { data: D('Mente Calma', 'psychic', 'status', 0, 'self', { eff: { stat: 'spa', by: 1, self: true } }), self: SELF.rise(0xb88aff, 'ring', true, (v, u) => { for (let i = 0; i < 3; i++) v.fx.ring(u.x, u.y - 14, 0xb88aff, 4 + i * 3, 0.6 + i * 0.1, { squash: 1, width: 1.5 }); }) },
  reflect: { data: D('Refletir', 'psychic', 'status', 0, 'shield', { eff: { stat: 'def', by: 1, self: true } }), shield: { color: 0xffd0ec, dur: 1.4, hex: true } },
  lightScreen: { data: D('Tela de Luz', 'psychic', 'status', 0, 'shield', { eff: { stat: 'spd', by: 1, self: true } }), shield: { color: 0xffe27a, dur: 1.4, hex: true } },
  dreamEater: { data: D('Comedor de Sonhos', 'psychic', 'spec', 100, 'target', { eff: { drain: 0.5 } }), target: (v, t, x, y) => { v.E(x, y, { tex: 'glow', color: 0xd890ff, n: 20, size: 4, speed: 50, life: 0.8 }); v.E(x, y - 10, { tex: 'zz', color: 0xffffff, n: 4, speed: 30, life: 0.8, add: false }); psyRings(0xb88aff)(v, t, x, y); } },
  psychoCut: { data: D('Psicocorte', 'psychic', 'phys', 70, 'proj', { speed: 18, range: 9, critUp: 1 }), head: { ...H.none(0xff5aa8, 1), draw: DRAW.crescent(0xff9ad0, 8) }, trail: TR.p({ tex: 'streak', color: 0xff9ad0, speed: 10, life: 0.15 }, 30), impact: IM.all(IM.type('psychic'), IM.p({ tex: 'slash', color: 0xff9ad0, n: 1, speed: 0, scale: 2.2, end: 2.6, life: 0.16 })) },
};
