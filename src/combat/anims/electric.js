import { D, H, TR, IM, ME, SELF, DRAW, R } from './kit.js';

const sparkAura = (rate = 30) => (v, u, dt) => { const y = u.y - (u.midH ?? 12); if (Math.random() < dt * rate) { const a = Math.random() * 6.28; v.fx.bolt(u.x, y, u.x + Math.cos(a) * (u.r + 8), y + Math.sin(a) * (u.r + 6), 0xffe23a, 0.08, { amp: 3 }); } v.E(u.x, y, { tex: 'spark', color: 0xfff27a, n: R(dt, 30), speed: 50, life: 0.15, scale: 0.6, jitter: u.r }); };

// Elétrico
export default {
  thunderShock: { // Choque do Trovão: zigue-zague curto
    kind: 'bolt', bolt: { flickers: 2, gap: 0.05, width: 1.4, amp: 5, range: 6.5, branch: 1 },
    charge: (v, u, k, dt) => sparkAura(10)(v, u, dt),
    impact: IM.all(IM.type('electric', 0.9), IM.bolts(3, 14)),
  },
  thunderbolt: { // Relâmpago: raio grosso que pisca 3 vezes
    data: D('Relâmpago', 'electric', 'spec', 90, 'bolt', { range: 9, eff: { status: 'par', chance: 0.1 } }),
    bolt: { flickers: 4, gap: 0.06, width: 2.4, amp: 8, range: 9, branch: 3 },
    charge: (v, u, k, dt) => sparkAura(30)(v, u, dt),
    impact: IM.all(IM.type('electric', 1.4), IM.bolts(6, 26), IM.flash(0xfff6a0, 0.2)),
  },
  thunder: { data: D('Trovão', 'electric', 'spec', 110, 'sky', { range: 11, eff: { status: 'par', chance: 0.3 } }), sky: { color: 0xffe23a, width: 3.2, branches: 5 } },
  thunderWave: { // Onda de Trovão: anéis elétricos
    head: { ...H.none(0xffe23a, 1.4), draw: DRAW.rings(0xfff27a, 3, 8) },
    trail: TR.p({ tex: 'spark', color: 0xfff27a, speed: 30, life: 0.2, scale: 0.6 }, 30),
    impact: IM.all(IM.bolts(6, 16), IM.ring(0xfff27a, 6, 3)),
  },
  spark: { // Faísca: o usuário eletrificado investe
    dashStart: (v, u) => { u.sparkT = 0.35; },
    dash: (v, u, dt) => { sparkAura(60)(v, u, dt); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0xffe23a, 0.6, 0.2); } },
    impact: IM.all(IM.type('electric', 1.2), IM.bolts(4, 18)),
  },
  thunderPunch: { data: D('Soco Trovão', 'electric', 'phys', 75, 'melee', { eff: { status: 'par', chance: 0.1 } }), melee: ME('fist', { color: 0xffe23a, glow: 'spark' }), charge: (v, u, k, dt) => sparkAura(15)(v, u, dt), hit: IM.all(IM.type('electric', 1.2), IM.bolts(5, 20)) },
  thunderFang: { data: D('Presa Trovão', 'electric', 'phys', 65, 'melee', { eff: { status: 'par', chance: 0.1, flinch: 0.1 } }), melee: ME('fang', { color: 0xffe23a, glow: 'spark' }), hit: IM.all(IM.type('electric'), IM.bolts(3, 14)) },
  voltTackle: { // Investida Trovão: bola de raios em disparada
    data: D('Investida Trovão', 'electric', 'phys', 120, 'dash', { range: 7, eff: { recoil: 0.33, status: 'par', chance: 0.1 } }),
    dash: (v, u, dt) => { sparkAura(90)(v, u, dt); const y = u.y - 10 - u.z; v.E(u.x, y, { tex: 'glow', color: 0xffe23a, n: R(dt, 60), size: 10, speed: 10, life: 0.2 }); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.025; v.afterimage(u, 0xfff6a0, 0.8, 0.3); } v.fx.decal('scorch', u.x, u.y, { scale: 0.3, alpha: 0.6, life: 8 }); },
    impact: IM.all(IM.boom(0xffe23a, 1.3), IM.bolts(8, 34)),
  },
  discharge: { // Descarga: raios para todos os lados
    data: D('Descarga', 'electric', 'spec', 80, 'wave', { range: 5.5, eff: { status: 'par', chance: 0.3 } }),
    wave: (v, u, R0) => { const y = u.y - 10; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + Math.random() * 0.3; v.fx.bolt(u.x, y, u.x + Math.cos(a) * R0, y + Math.sin(a) * R0 * 0.7, 0xffe23a, 0.25, { amp: 7, width: 1.6 }); } v.fx.shock(u.x, u.y, 0xffe23a, R0, 0.35); v.fx.screenFlash(0xfff6a0, 0.15); v.fx.light(u.x, y, 0xffe23a, R0 * 0.7, 0.3, 0.6); },
  },
  chargeBeam: { data: D('Raio Carregado', 'electric', 'spec', 50, 'proj', { range: 9, eff: { stat: 'spa', by: 1, self: true, chance: 0.7 } }), beam: { dur: 0.55, width: 5, speed: 900, tick: 0.08, share: 1, range: 8, colors: [0xc8a000, 0xffe23a, 0xffffff], style: 'electric' } },
  electroBall: { data: D('Bola Elétrica', 'electric', 'spec', 80, 'proj', { speed: 15, range: 12 }), head: { ...H.none(0xffe23a, 1.6), draw: DRAW.electro(6) }, trail: TR.p({ tex: 'spark', color: 0xfff27a, speed: 40, life: 0.18, scale: 0.6 }, 40), impact: IM.all(IM.type('electric', 1.5), IM.bolts(7, 24), IM.shock(0xffe23a, 30)) },
  wildCharge: { data: D('Carga Selvagem', 'electric', 'phys', 90, 'dash', { range: 6, eff: { recoil: 0.25 } }), dash: (v, u, dt) => { sparkAura(70)(v, u, dt); if ((u.ghostT = (u.ghostT ?? 0) - dt) <= 0) { u.ghostT = 0.03; v.afterimage(u, 0xffffff, 0.6, 0.2); } }, impact: IM.all(IM.type('electric', 1.4), IM.bolts(5, 22), IM.shock(0xffe23a, 26)) },
  charge: { data: D('Carga', 'electric', 'status', 0, 'self', { eff: { stat: 'spd', by: 1, self: true } }), self: SELF.rise(0xffe23a, 'spark', true, (v, u) => { for (let i = 0; i < 4; i++) { const a = Math.random() * 6.28; v.fx.bolt(u.x, u.y - 10, u.x + Math.cos(a) * 16, u.y - 10 + Math.sin(a) * 14, 0xffe23a, 0.2, { amp: 3 }); } }) },
  zapCannon: { data: D('Canhão Zap', 'electric', 'spec', 120, 'proj', { speed: 9, range: 12, eff: { status: 'par', chance: 1 } }), head: { ...H.none(0xffe23a, 2.4), draw: DRAW.electro(9) }, trail: TR.all(TR.p({ tex: 'spark', color: 0xfff27a, speed: 60, life: 0.2 }, 60), TR.bolt(0xffe23a, 0.03)), impact: IM.all(IM.boom(0xffe23a, 1.3), IM.bolts(10, 36)) },
};
