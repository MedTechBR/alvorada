import { writeFileSync } from 'node:fs';
const KEYS = { w: ['KeyW', 87], a: ['KeyA', 65], s: ['KeyS', 83], d: ['KeyD', 68], shift: ['ShiftLeft', 16], e: ['KeyE', 69], x: ['KeyX', 88], space: ['Space', 32], enter: ['Enter', 13], q: ['KeyQ', 81], up: ['ArrowUp', 38], right: ['ArrowRight', 39] };
export async function util({ P, sleep, out }) {
  // teclas disparadas dentro da página, com tempo exato (as idas e vindas do CDP atrapalham toques curtos)
  await P.ev(`window.__k = (c, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code: c, bubbles: true })); window.__hold = (cs, ms) => new Promise((r) => { cs.forEach((c) => __k(c, true)); setTimeout(() => { cs.slice().reverse().forEach((c) => __k(c, false)); r(1); }, ms); });`);
  const key = (k, down) => P.ev(`__k(${JSON.stringify(KEYS[k][0])}, ${down})`);
  const hold = (ks, ms) => P.ev(`__hold(${JSON.stringify([].concat(ks).map((k) => KEYS[k][0]))}, ${ms})`);
  const foto = async (n) => { const s = await P.raw('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); writeFileSync(new URL(`${n}.jpg`, out), Buffer.from(s.result.data, 'base64')); };
  const est = () => P.ev(`(() => { const p = game.player; return JSON.stringify({ x: p.x, y: p.y, tx: Math.floor(p.x/16), ty: Math.floor((p.y-2)/16), dir: p.dir, sp: Math.round(p.speed), an: !!p.andando, idx: p.animIdx, interior: game.map.interiorAt(p.x, p.y)?.name ?? null }); })()`).then(JSON.parse);
  const centro = (e) => e.x % 16 === 8 && e.y % 16 === 10;
  const tp = (tx, ty, dir = 'down') => P.ev(`(() => { const p = game.player; p.x = ${tx} * 16 + 8; p.y = ${ty} * 16 + 10; p.dir = ${JSON.stringify(dir)}; game.cam.x = p.x; game.cam.y = p.y; return 1; })()`);
  return { key, hold, foto, est, centro, tp };
}
