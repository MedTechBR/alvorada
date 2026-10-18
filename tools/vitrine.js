import * as PIXI from 'pixi.js';
import { loadPokemonSprites, frameOf, portraitOf } from '../src/sprites/pmd.js';
import { makeCharacterFrames, NPC_PRESETS, DEFAULT_LOOK } from '../src/sprites/characters.js';
import { SPECIES } from '../src/data/species.js';

const q = new URLSearchParams(location.search);
const PTS = q.has('pts'), MODO = q.get('modo') ?? 'pokemon', Z = +(q.get('z') ?? 2);
const COLS = +(q.get('cols') ?? 10), CW = 80, CH = 64;

const app = new PIXI.Application();
await app.init({ width: 1600, height: 1200, background: 0x6a9a5a, antialias: false, resolution: 1, preference: 'webgl', preserveDrawingBuffer: true });
document.body.appendChild(app.canvas);
PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';
const world = new PIXI.Container(); world.scale.set(Z); app.stage.addChild(world);
const sc = document.createElement('canvas'); sc.width = 16; sc.height = 8;
{ const x = sc.getContext('2d'); x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(8, 4, 7.5, 3.5, 0, 0, 7); x.fill(); }
const shadowTex = PIXI.Texture.from(sc);
const ents = []; let time = 0;

function label(text, x, y) { const t = new PIXI.Text({ text, style: { fontSize: 7, fill: 0xffffff, fontFamily: 'sans-serif' } }); t.resolution = 4; t.x = x; t.y = y; world.addChild(t); }
function cross(color) { const g = new PIXI.Graphics(); g.rect(-0.5, -0.5, 1, 1).fill(color); return g; }

async function pokemon() {
  const list = await fetch('assets/pmd/index.json').then((r) => r.json());
  const n = list.length, rows = Math.ceil(n / COLS);
  app.renderer.resize(COLS * CW * Z, rows * CH * Z);
  await Promise.all(list.map(async (dex, k) => {
    const set = await loadPokemonSprites(dex); await set.pending;
    const cx = (k % COLS) * CW, cy = Math.floor(k / COLS) * CH;
    const bg = new PIXI.Graphics(); bg.rect(cx, cy, CW, CH).fill(k % 2 ? 0x74a364 : 0x6a9a5a); world.addChildAt(bg, 0);
    label(`${dex} ${SPECIES[dex]?.name ?? ''}`, cx + 2, cy + 1);
    for (const [i, anim] of [[0, 'Idle'], [1, 'Walk']]) {
      const v = new PIXI.Container(); v.x = cx + 22 + i * 38; v.y = cy + CH - 12;
      const sh = new PIXI.Sprite(shadowTex); sh.anchor.set(0.5); sh.scale.set(...set.shadowScale);
      const body = new PIXI.Sprite(); v.addChild(sh, body);
      const marks = PTS ? [cross(0xff2020), cross(0x20e0ff), cross(0xffff20)] : [];
      marks.forEach((m) => v.addChild(m));
      world.addChild(v);
      ents.push({ set, anim, body, marks, i, t: Math.random() });
    }
  }));
}

function humanos() {
  const looks = [...NPC_PRESETS, DEFAULT_LOOK.menino, DEFAULT_LOOK.menina];
  app.renderer.resize(13 * 30 * Z, looks.length * 40 * Z);
  looks.forEach((look, r) => {
    const f = makeCharacterFrames(look);
    label(typeof look === 'string' ? look : 'criador:' + look.sexo, 2, r * 40 + 1);
    let c = 0;
    for (const anim of ['walk', 'run', 'throw']) for (const dir of ['down', 'left']) {
      const v = new PIXI.Container(); v.x = 40 + c * 26; v.y = r * 40 + 36;
      const sh = new PIXI.Sprite(shadowTex); sh.anchor.set(0.5); sh.scale.set(0.8);
      const b = new PIXI.Sprite(f[anim][dir][0]); b.anchor.set(0.5, 1); b.y = 2;
      v.addChild(sh, b); world.addChild(v); c++;
      ents.push({ human: true, frames: f[anim][dir], body: b, rate: anim === 'run' ? 11 : anim === 'throw' ? 5 : 7.5 });
    }
  });
}

function frame(dt) {
  time += dt;
  for (const e of ents) {
    if (e.human) { e.body.texture = e.frames[Math.floor(time * e.rate) % e.frames.length]; continue; }
    const dir = e.anim === 'Idle' ? 2 : Math.floor(time / 1.2) % 8;
    const f = frameOf(e.set, e.anim, dir, time + e.t);
    e.body.texture = f.tex; e.body.anchor.set(f.ax, f.ay);
    if (e.marks.length) { const pts = [f.head, f.mouth, f.hand]; e.marks.forEach((m, k) => { m.x = pts[k].x; m.y = pts[k].y; }); }
  }
}
if (MODO === 'humanos') humanos(); else await pokemon();
app.ticker.add((tk) => frame(Math.min(0.05, tk.deltaMS / 1000)));
window.vit = { app, frame, shot: (n) => { app.renderer.render(app.stage); app.canvas.toBlob((b) => fetch('/__shot?n=' + n, { method: 'POST', body: b }), 'image/jpeg', 0.92); }, portraitOf, ready: true };
