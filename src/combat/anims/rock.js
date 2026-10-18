import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

// Pedra
export default {
  rockThrow: { rainTex: ['boulder', 'rock2'] },
  rockTomb: { rainTex: ['rock2', 'rock2'], rainLeave: true },
  rockSlide: { data: D('Deslizamento de Pedras', 'rock', 'phys', 75, 'rain', { range: 10, eff: { flinch: 0.3 } }), rainTex: ['boulder', 'rock2'], rainN: 6, rainSpread: 26 },
  stoneEdge: { // Gume de Pedra: pedras pontudas brotam do chão em linha
    data: D('Gume de Pedra', 'rock', 'phys', 100, 'line', { range: 6, critUp: 1 }),
    wave: (v, u, R0) => { const a = u.angle; for (let i = 1; i <= 7; i++) v.g.later(i * 0.04, () => { const x = u.x + Math.cos(a) * i * 13, y = u.y + Math.sin(a) * i * 13; v.E(x, y, { tex: 'shard', color: 0xb8a888, n: 3, speed: 15, vz: 120, grav: 300, life: 0.7, scale: 2, add: false, fade: 'late' }); v.E(x, y, { tex: 'dust', n: 2, speed: 20, life: 0.5, scale: 0.6, end: 1.4, add: false, alpha: 0.7 }); v.fx.decal('crack', x, y, { scale: 0.6, life: 20 }); }); v.fx.kick(0.3, 0.04); },
    lineAhead: true,
  },
  ancientPower: { data: D('Poder Ancestral', 'rock', 'spec', 60, 'proj', { speed: 14, range: 11 }), count: 3, spread: 0.3, head: H.tex('rock2', { scale: 1.6, spin: 6, halo: 0xffd07a, haloScale: 1 }), trail: TR.p({ tex: 'glow', color: 0xffd07a, size: 3, speed: 6, life: 0.3 }, 30), impact: IM.all(IM.type('rock', 1), IM.light(0xffd07a, 40)) },
  rollout: { data: D('Rolagem', 'rock', 'phys', 30, 'dash', { range: 7 }), dashStart: (v, u) => { u.wheelT = 0.4; }, dash: (v, u, dt) => { v.E(u.x, u.y, { tex: 'dust', n: R(dt, 30), speed: 15, life: 0.4, scale: 0.6, end: 1.4, add: false, alpha: 0.7 }); v.fx.decal('turf', u.x, u.y, { scale: 0.4, life: 6, alpha: 0.6 }); }, impact: IM.all(IM.type('rock', 1), IM.rocks(5, 'rock1')) },
  powerGem: { data: D('Joia de Poder', 'rock', 'spec', 80, 'proj', { speed: 17, range: 12 }), head: H.tex('star', { tint: 0xfff0a0, scale: 1.6, spin: 6, add: true, halo: 0xffd07a, haloScale: 1.3 }), trail: TR.p({ tex: 'twinkle', color: 0xfff0c0, speed: 20, life: 0.4 }, 40), impact: IM.all(IM.type('rock', 1.1), IM.stars(0xfff0a0, 10), IM.light(0xfff0a0, 50)) },
  rockBlast: { data: D('Explosão de Rocha', 'rock', 'phys', 25, 'proj', { speed: 18, range: 10 }), count: 4, spread: 0.1, gap: 0.1, head: H.tex('rock2', { scale: 1.5, spin: 10 }), trail: TR.p({ tex: 'dust', speed: 8, life: 0.3, scale: 0.4, end: 1, add: false, alpha: 0.6 }, 20), impact: IM.all(IM.type('rock', 0.8), IM.rocks(4, 'rock1')) },
  sandstorm: { data: D('Tempestade de Areia', 'rock', 'status', 0, 'cloud', {}), cloudColor: 0xd8c08a, cloudTex: 'dust', cloudDense: true },
  stealthRock: { data: D('Pedras Furtivas', 'rock', 'status', 0, 'cloud', {}), cloudColor: 0xb8a888, cloudTex: 'rock1' },
  headSmash: { data: D('Cabeçada de Rocha', 'rock', 'phys', 150, 'dash', { range: 6, eff: { recoil: 0.5 } }), dash: (v, u, dt) => { v.E(u.x, u.y - 10, { tex: 'rock1', n: R(dt, 30), speed: 30, life: 0.5, grav: 300, vz: 40, add: false }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0xc8b48a, 0.6, 0.25); } }, impact: IM.all(IM.boom(0xc8b48a, 1.4), IM.rocks(12, 'rock2'), IM.crater(1.2)) },
};
